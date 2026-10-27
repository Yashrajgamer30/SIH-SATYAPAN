from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.schemas import User, UserRole, AuditLog
from app.core.audit import verify_audit_chain

router = APIRouter(prefix="/audit", tags=["Cryptographic Audit Trail"])


@router.get("/verify-chain")
def verify_chain_endpoint(
    db: Session = Depends(get_db)
):
    """
    Cryptographically verifies the SHA-256 hash chain of the entire audit log.
    Recomputes hash(prev_hash + canonical_json) for every row from genesis.
    Returns:
    - is_valid: True if intact, False if tampered
    - broken_at_id: ID of first corrupted row (if any)
    """
    verification = verify_audit_chain(db)
    return verification


@router.get("/logs")
def list_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    entity: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.OFFICIAL_SCRUTINY, UserRole.OFFICIAL_SENIOR, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns immutable audit logs ordered chronologically with cryptographic hashes.
    """
    query = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    if entity:
        query = query.where(AuditLog.entity == entity)

    res = db.execute(query)
    logs = res.scalars().all()

    return [
        {
            "id": l.id,
            "created_at": l.created_at.isoformat(),
            "actor_id": l.actor_id,
            "actor_role": l.actor_role,
            "action": l.action,
            "entity": l.entity,
            "entity_id": l.entity_id,
            "ip": l.ip,
            "prev_hash": l.prev_hash,
            "hash": l.hash
        } for l in logs
    ]
