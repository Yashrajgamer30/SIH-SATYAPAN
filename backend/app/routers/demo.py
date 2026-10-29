import sys
import os
import hashlib
import json
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.core.config import settings
from app.core.database import get_db
from app.models.schemas import AuditLog

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


@router.post("/tamper-audit-row")
def demo_tamper_audit_row(db: Session = Depends(get_db)):
    """
    Differentiator 2: Injects an unauthorized modification into an audit row
    WITHOUT updating the cryptographic SHA-256 hash or chain link.
    Causes /audit/verify-chain to fail on stage, proving tamper evidence.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Available only in DEMO_MODE.")

    # Find the 3rd or middle audit row
    rows = db.query(AuditLog).order_by(AuditLog.created_at).all()
    if len(rows) < 2:
        raise HTTPException(status_code=400, detail="Not enough audit records to tamper.")

    target = rows[len(rows) // 2]
    old_details = target.details

    # Direct SQL update bypassing ORM audit protection
    from sqlalchemy import text
    tampered_details = json.dumps({"unauthorized_tampering": "CRITICAL: Scrutiny finding altered out-of-band"})
    db.execute(
        text("UPDATE audit_log SET details = :d WHERE id = :id"),
        {"d": tampered_details, "id": target.id}
    )
    db.commit()

    return {
        "status": "tampered",
        "message": f"Audit record {target.id} was intentionally tampered out-of-band. Live verification will fail.",
        "tampered_row_id": target.id
    }


@router.post("/repair-audit-chain")
def demo_repair_audit_chain(db: Session = Depends(get_db)):
    """
    Differentiator 2: One-click repair tool that recomputes the canonical SHA-256
    hash chain from genesis root, restoring green integrity.
    """
    if not settings.DEMO_MODE:
        raise HTTPException(status_code=403, detail="Available only in DEMO_MODE.")

    from sqlalchemy import text
    from app.core.audit import GENESIS_HASH, compute_chain_hash
    rows = db.query(AuditLog).order_by(AuditLog.created_at.asc(), AuditLog.id.asc()).all()
    expected_prev_hash = GENESIS_HASH

    for idx, r in enumerate(rows):
        try:
            payload = json.loads(r.details)
        except Exception:
            payload = {}

        recalculated_hash = compute_chain_hash(expected_prev_hash, payload)
        db.execute(
            text("UPDATE audit_log SET prev_hash = :p, hash = :h WHERE id = :id"),
            {"p": expected_prev_hash, "h": recalculated_hash, "id": r.id}
        )
        expected_prev_hash = recalculated_hash

    db.commit()

    return {
        "status": "repaired",
        "message": "Audit chain cryptographic hashes recomputed from genesis root. Integrity restored.",
        "repaired_blocks": len(rows)
    }
