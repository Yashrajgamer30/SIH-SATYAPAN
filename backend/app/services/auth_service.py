import uuid
import secrets
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from app.models.schemas import User, UserRole
from app.repositories.auth_repo import AuthRepository
from app.core.security import (
    verify_password, create_access_token, create_refresh_token,
    decode_token, revoke_token, MFA_CHALLENGES
)
from app.core.audit import write_audit_event
from app.core.config import settings


class AuthService:
    def __init__(self, session: Session):
        self.session = session
        self.auth_repo = AuthRepository(session)

    def authenticate_user(self, email: str, password: str, client_ip: Optional[str] = None) -> Dict[str, Any]:
        """
        Step 1 of Authentication:
        - Validates credentials against Argon2 hash.
        - If user is an OFFICIAL with MFA enabled:
          Generates a 6-digit OTP, prints to server log, and if DEMO_MODE=true, returns demo hint.
        - Otherwise returns tokens directly.
        """
        user = self.auth_repo.get_by_email(email)
        if not user or not verify_password(password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid official email or password."
            )

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This account has been deactivated by the System Policy Administrator."
            )

        # Demo-Friendly MFA for OFFICIAL roles
        is_official = user.role in [UserRole.OFFICIAL_SCRUTINY, UserRole.OFFICIAL_SENIOR, UserRole.SYSTEM_ADMIN]
        if is_official and user.mfa_enabled:
            # Generate 6-digit OTP
            otp = f"{secrets.randbelow(900000) + 100000}"
            challenge_id = str(uuid.uuid4())
            
            MFA_CHALLENGES[challenge_id] = {
                "user_id": user.id,
                "otp": otp,
                "expires_at": datetime.utcnow() + timedelta(minutes=5)
            }

            # Print code in server log as requested by prompt
            print(f"\n=======================================================")
            print(f" [AICTE SATYAPAN MFA] 6-Digit OTP for {user.email}: {otp}")
            print(f" Challenge ID: {challenge_id} (Expires in 5 mins)")
            print(f"=======================================================\n")

            return {
                "mfa_required": True,
                "challenge_id": challenge_id,
                "message": f"A 6-digit one-time password has been generated for {user.role.value}.",
                "demo_otp_hint": otp if settings.DEMO_MODE else None
            }

        # Issue direct tokens for institute personas or non-MFA
        return self._finalize_login(user, client_ip)

    def verify_otp(self, challenge_id: str, otp_code: str, client_ip: Optional[str] = None) -> Dict[str, Any]:
        """
        Step 2 of MFA: Validates 6-digit OTP and issues 15-min access token + refresh token.
        """
        challenge = MFA_CHALLENGES.get(challenge_id)
        if not challenge:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="MFA challenge expired or invalid. Please re-initiate login."
            )

        if datetime.utcnow() > challenge["expires_at"]:
            MFA_CHALLENGES.pop(challenge_id, None)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP expired. Please request a new verification code."
            )

        if challenge["otp"] != otp_code.strip():
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect 6-digit OTP code."
            )

        # Clear challenge
        user_id = challenge["user_id"]
        MFA_CHALLENGES.pop(challenge_id, None)

        user = self.auth_repo.get_by_id(user_id)
        if not user:
            raise HTTPException(status_code=404, detail="User account not found.")

        return self._finalize_login(user, client_ip, mfa_verified=True)

    def _finalize_login(self, user: User, client_ip: Optional[str], mfa_verified: bool = False) -> Dict[str, Any]:
        access_token = create_access_token(user.id, role=user.role.value, institute_id=user.institute_id)
        refresh_token = create_refresh_token(user.id)

        self.auth_repo.update_last_login(user.id)

        # Write immutable hash-chained audit event
        write_audit_event(
            session=self.session,
            actor_id=user.id,
            actor_role=user.role.value,
            action="USER_LOGIN_SUCCESS",
            entity="users",
            entity_id=user.id,
            details={"email": user.email, "mfa_verified": mfa_verified},
            ip=client_ip
        )
        self.session.commit()

        return {
            "mfa_required": False,
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES,
            "role": user.role.value,
            "user_id": user.id,
            "name": user.name,
            "institute_id": user.institute_id
        }

    def refresh_access_token(self, refresh_token: str) -> Dict[str, Any]:
        try:
            payload = decode_token(refresh_token)
            if payload.get("type") != "refresh":
                raise ValueError("Provided token is not a refresh token.")
            user_id = payload.get("sub")
            user = self.auth_repo.get_by_id(user_id)
            if not user or not user.is_active:
                raise ValueError("User not active or does not exist.")

            new_access_token = create_access_token(user.id, role=user.role.value, institute_id=user.institute_id)
            return {
                "access_token": new_access_token,
                "token_type": "bearer",
                "expires_in_minutes": settings.ACCESS_TOKEN_EXPIRE_MINUTES
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail=f"Could not refresh session: {str(e)}"
            )

    def logout_user(self, access_token: str, user_id: str, client_ip: Optional[str] = None):
        revoke_token(access_token)
        write_audit_event(
            session=self.session,
            actor_id=user_id,
            actor_role="AUTHENTICATED_USER",
            action="USER_LOGOUT",
            entity="users",
            entity_id=user_id,
            details={"revoked": True},
            ip=client_ip
        )
        self.session.commit()
