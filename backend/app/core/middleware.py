from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response, JSONResponse
from app.core.config import settings


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # 1. Request size limit check
        content_length = request.headers.get("content-length")
        if content_length and int(content_length) > settings.MAX_REQUEST_SIZE_BYTES:
            return JSONResponse(
                status_code=413,
                content={
                    "detail": f"Payload too large. Maximum allowed size is {settings.MAX_REQUEST_SIZE_BYTES // (1024*1024)}MB."
                }
            )

        response: Response = await call_next(request)

        # 2. Strict National Security Headers
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains; preload"
        response.headers["Content-Security-Policy"] = "default-src 'self'; img-src 'self' data:; script-src 'self'; style-src 'self' 'unsafe-inline'; frame-ancestors 'none';"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # Mandated Principle 1 Advisory Header
        response.headers["X-AI-Advisory"] = "AI result is advisory. Final regulatory decisions are strictly authorized by designated AICTE Scrutiny Officials with mandatory written remarks."

        return response
