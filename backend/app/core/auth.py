from typing import List, Optional, Callable
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_token
from app.models.schemas import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/token", auto_error=False)


def get_current_user(
    token: Optional[str] = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> User:
    """
    Validates 15-minute JWT Bearer token and checks revocation list.
    Returns active authenticated user.
    """
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication credentials were not provided in Authorization header.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Malformed token claims (missing sub).",
                headers={"WWW-Authenticate": "Bearer"},
            )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

    stmt = select(User).where(User.id == user_id)
    res = db.execute(stmt)
    user = res.scalar_one_or_none()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account associated with this token no longer exists.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This user account has been deactivated by the System Policy Administrator."
        )

    return user


def require_roles(*allowed_roles: UserRole) -> Callable:
    """
    RBAC dependency guard enforcing role-based permissions on routes.
    """
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            role_names = [r.value if hasattr(r, 'value') else str(r) for r in allowed_roles]
            user_role_val = current_user.role.value if hasattr(current_user.role, 'value') else str(current_user.role)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: User role '{user_role_val}' is not authorized. Required: {role_names}"
            )
        return current_user
    return role_checker


def verify_institute_access(current_user: User, institute_id: str):
    """
    Guarantees strict Row-Level Institute Isolation (IDOR Defense).
    Officials and Admins can access all institutes.
    Institute users can ONLY access records belonging to their institute_id.
    """
    official_roles = {
        UserRole.OFFICIAL_SCRUTINY,
        UserRole.OFFICIAL_SENIOR,
        UserRole.SYSTEM_ADMIN
    }
    if current_user.role not in official_roles:
        if not current_user.institute_id or current_user.institute_id != institute_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Forbidden: Row-level isolation policy strictly prohibits access to another institute's data (IDOR Defense)."
            )
