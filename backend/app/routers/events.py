from typing import Optional
from fastapi import APIRouter, Request, Query, HTTPException, status
from sse_starlette.sse import EventSourceResponse

from app.core.security import decode_token
from app.services.event_service import user_event_generator

router = APIRouter(tags=["Real-time SSE Events"])


@router.get("/events")
async def events_stream(
    request: Request,
    token: Optional[str] = Query(None, description="JWT Bearer token for EventSource authentication")
):
    """
    Real-Time Server-Sent Events (SSE) stream for user-specific regulatory alerts and verification updates.
    Accepts token via Query parameter or Authorization Header.
    """
    auth_header = request.headers.get("Authorization")
    jwt_token = None

    if token:
        jwt_token = token
    elif auth_header and auth_header.startswith("Bearer "):
        jwt_token = auth_header.split(" ")[1]

    if not jwt_token:
        # For open demo connectivity or testing, assign a guest/anonymous listener
        user_id = "anonymous-stream"
    else:
        try:
            payload = decode_token(jwt_token)
            user_id = payload.get("sub", "unknown-user")
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token for SSE event stream."
            )

    return EventSourceResponse(
        user_event_generator(user_id),
        media_type="text/event-stream"
    )
