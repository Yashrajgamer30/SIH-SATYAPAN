"""
AICTE SATYAPAN - Core FastAPI Application Entrypoint
National Hackathon Grand Finals Edition

Security & Architecture:
- Argon2 password hashing
- 15-minute JWT Access Tokens + 7-day httpOnly SameSite=Strict Refresh Cookie
- Demo-friendly MFA for Official Roles (6-digit OTP in server logs + demo hint)
- RBAC guards and strict Row-Level Institute Isolation (IDOR Defense)
- Cryptographic SHA-256 Hash-Chained Audit Trail (/audit/verify-chain)
- AES-256-GCM Encrypted File Vault with Memory-Only Decryption & Signed URLs
- National Security Headers (CSP, HSTS, X-Frame-Options: DENY, nosniff, X-AI-Advisory)
- SlowAPI Rate Limiting & 15MB Request Size Protection
- Mandatory Principle 1 Advisory Banner on all Regulatory Responses
"""
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.middleware import SecurityHeadersMiddleware

# Import Routers
from app.routers.auth import router as auth_router
from app.routers.institute import router as institute_router
from app.routers.official import router as official_router
from app.routers.events import router as events_router
from app.routers.audit import router as audit_router
from app.routers.documents import router as documents_router
from app.routers.demo import router as demo_router
from app.mock_authorities.router import router as mock_authorities_router

# Rate Limiter
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_DEFAULT])

app = FastAPI(
    title="AICTE SATYAPAN - Regulatory Compliance & Document Scrutiny Engine",
    description=(
        "AI-Powered Application Validation, Document Authentication, and Regulatory "
        "Compliance Engine for AICTE Approval Process (Extension of Approval / EoA). "
        "Note: All AI evaluations are strictly advisory support for designated AICTE Officials."
    ),
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json"
)

# Attach SlowAPI limiter state and error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# 1. Custom Security Headers & Payload Size Limits
app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS Allow-list
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.onrender\.com",
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allow_headers=["*"],
    expose_headers=["X-AI-Advisory", "X-Data-Source", "X-Notice"]
)

# Root Endpoints (Direct Paths for convenience and compatibility)
app.include_router(auth_router)
app.include_router(institute_router)
app.include_router(official_router)
app.include_router(events_router)
app.include_router(audit_router)
app.include_router(documents_router)
app.include_router(demo_router)
app.include_router(mock_authorities_router)

# Also mount under /api prefix for API clients expecting /api/auth/...
app.include_router(auth_router, prefix="/api")
app.include_router(institute_router, prefix="/api")
app.include_router(official_router, prefix="/api")
app.include_router(events_router, prefix="/api")
app.include_router(audit_router, prefix="/api")
app.include_router(documents_router, prefix="/api")
app.include_router(demo_router, prefix="/api")
app.include_router(mock_authorities_router, prefix="/api")

# Also mount under /api/v1 prefix
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(institute_router, prefix=settings.API_V1_STR)
app.include_router(official_router, prefix=settings.API_V1_STR)
app.include_router(events_router, prefix=settings.API_V1_STR)
app.include_router(audit_router, prefix=settings.API_V1_STR)
app.include_router(documents_router, prefix=settings.API_V1_STR)
app.include_router(demo_router, prefix=settings.API_V1_STR)
app.include_router(mock_authorities_router, prefix=settings.API_V1_STR)


@app.get("/", tags=["System Information"])
async def root():
    return {
        "portal": "AICTE SATYAPAN",
        "tagline": "AI-Powered Regulatory Compliance & Document Scrutiny Engine",
        "notice": "AI RESULT IS ADVISORY. Scrutiny and approval decisions rest strictly with designated AICTE Officials.",
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "docs_url": "/docs",
        "endpoints": {
            "auth": "/auth",
            "institute_dashboard": "/institute/dashboard",
            "official_dashboard": "/official/dashboard",
            "events_stream": "/events",
            "audit_verify_chain": "/audit/verify-chain",
            "demo_reset": "/demo/reset"
        }
    }


@app.get("/health", tags=["System Information"])
async def health_check():
    return {
        "status": "healthy",
        "service": "AICTE SATYAPAN API",
        "version": settings.VERSION,
        "demo_mode": settings.DEMO_MODE,
        "advisory": "AI outputs require mandatory human official sign-off"
    }
