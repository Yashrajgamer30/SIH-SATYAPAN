from pydantic import BaseModel, Field
from typing import Optional


class LoginRequest(BaseModel):
    email: str = Field(..., pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$", description="Official User Email Address")
    password: str = Field(..., min_length=6)


class OTPVerifyRequest(BaseModel):
    challenge_id: str
    otp_code: str = Field(..., min_length=6, max_length=6)


class OTPChallengeResponse(BaseModel):
    mfa_required: bool = True
    challenge_id: str
    message: str = "A 6-digit one-time password has been generated for official authentication."
    demo_otp_hint: Optional[str] = None # Provided only when DEMO_MODE=true


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in_minutes: int = 15
    role: str
    user_id: str
    name: str
    institute_id: Optional[str] = None


class UserProfileResponse(BaseModel):
    id: str
    name: str
    email: str
    role: str
    institute_id: Optional[str] = None
    designation: Optional[str] = None
    mfa_enabled: bool
    preferred_language: str
