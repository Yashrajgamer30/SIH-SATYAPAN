from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user, oauth2_scheme
from app.models.schemas import User
from app.schemas.auth import (
    LoginRequest, OTPVerifyRequest, OTPChallengeResponse,
    TokenResponse, UserProfileResponse
)
from app.services.auth_service import AuthService

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])


@router.post("/login", response_model=None)
def login(
    payload: LoginRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Step 1: Authenticate with Email and Argon2 Password.
    - If user is an OFFICIAL with MFA enabled: Returns 6-digit OTP challenge (and demo hint if DEMO_MODE=true).
    - Otherwise: Issues 15-min JWT access token and sets 7-day httpOnly, SameSite=Strict refresh cookie.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    service = AuthService(db)
    result = service.authenticate_user(payload.email, payload.password, client_ip)

    if result.get("mfa_required"):
        return OTPChallengeResponse(
            mfa_required=True,
            challenge_id=result["challenge_id"],
            message=result["message"],
            demo_otp_hint=result.get("demo_otp_hint")
        )

    # Set httpOnly, SameSite=Strict cookie for refresh token
    refresh_token = result.pop("refresh_token")
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        secure=False,
        max_age=7 * 24 * 3600,
        path="/"
    )

    return TokenResponse(**result)


@router.post("/otp", response_model=TokenResponse)
def verify_otp(
    payload: OTPVerifyRequest,
    request: Request,
    response: Response,
    db: Session = Depends(get_db)
):
    """
    Step 2: Verify 6-digit OTP for Official MFA accounts.
    Issues 15-min JWT access token and sets 7-day httpOnly SameSite=Strict refresh cookie.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    service = AuthService(db)
    result = service.verify_otp(payload.challenge_id, payload.otp_code, client_ip)

    refresh_token = result.pop("refresh_token")
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="strict",
        secure=False,
        max_age=7 * 24 * 3600,
        path="/"
    )

    return TokenResponse(**result)


@router.post("/refresh")
def refresh_token(
    request: Request,
    db: Session = Depends(get_db)
):
    """
    Refreshes 15-minute access token using the httpOnly refresh cookie.
    """
    token = request.cookies.get("refresh_token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Refresh token cookie missing or expired. Please re-login."
        )

    service = AuthService(db)
    return service.refresh_access_token(token)


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    token: str = Depends(oauth2_scheme),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes the current JWT access token and clears httpOnly refresh cookie.
    Appends token to the revocation list.
    """
    client_ip = request.client.host if request.client else "127.0.0.1"
    service = AuthService(db)
    service.logout_user(token, current_user.id, client_ip)

    response.delete_cookie(key="refresh_token", path="/")
    return {
        "status": "success",
        "message": "User session terminated successfully. Token revoked into blacklist."
    }


@router.get("/me", response_model=UserProfileResponse)
def get_me(current_user: User = Depends(get_current_user)):
    """
    Returns active user profile and regulatory role.
    """
    return UserProfileResponse(
        id=current_user.id,
        name=current_user.name,
        email=current_user.email,
        role=current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role),
        institute_id=current_user.institute_id,
        designation=current_user.designation,
        mfa_enabled=current_user.mfa_enabled,
        preferred_language=current_user.preferred_language or "en"
    )
