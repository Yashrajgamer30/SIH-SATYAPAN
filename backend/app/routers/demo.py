import sys
import os
from fastapi import APIRouter, HTTPException, status
from app.core.config import settings

router = APIRouter(prefix="/demo", tags=["Grand Finale Demo Controller"])


@router.post("/reset")
async def reset_demo_database():
    """
    Restores the database and Demo Pack to the pristine starting state.
    Strictly guarded: accessible ONLY when DEMO_MODE=true.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Forbidden: /demo/reset is strictly disabled when DEMO_MODE=false."
        )

    # Import seed script
    seed_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", "seed"))
    if seed_dir not in sys.path:
        sys.path.insert(0, seed_dir)

    try:
        from seed import seed_database
        seed_database(reset=True)
        return {
            "status": "success",
            "message": "AICTE SATYAPAN database and Demo Pack restored to pristine starting state.",
            "demo_mode": settings.DEMO_MODE,
            "demo_accounts": [
                {"role": "OFFICIAL_SCRUTINY", "email": "scrutiny@aicte-india.org", "password": "Demo@1234"},
                {"role": "INSTITUTE_ADMIN", "email": "saraswati.principal@aicte-satyapan.edu.in", "password": "Demo@1234"}
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to reset demo database: {str(e)}")
