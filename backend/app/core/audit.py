"""
AICTE SATYAPAN - Cryptographic Hash-Chained Audit Service
Formula: hash = SHA256(prev_hash + canonical_json_payload)
Provides:
- write_audit_event(session, actor_id, actor_role, action, entity, entity_id, details, ip)
- verify_audit_chain(session) -> { "is_valid": bool, "total_records": int, "broken_at_id": Optional[str], "details": str }
"""
import json
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import select, desc
from app.models.schemas import AuditLog

GENESIS_HASH = "GENESIS_ROOT_HASH_AICTE_SATYAPAN_2026"


def canonicalize_payload(payload: Dict[str, Any]) -> str:
    """Returns deterministic canonical JSON string."""
    return json.dumps(payload, sort_keys=True, separators=(',', ':'))


def compute_chain_hash(prev_hash: str, payload: Dict[str, Any]) -> str:
    """Computes SHA-256 over prev_hash + canonical payload."""
    canonical_json = canonicalize_payload(payload)
    to_hash = f"{prev_hash}:{canonical_json}".encode('utf-8')
    return hashlib.sha256(to_hash).hexdigest()


def write_audit_event(
    session: Session,
    actor_id: Optional[str],
    actor_role: str,
    action: str,
    entity: str,
    entity_id: str,
    details: Dict[str, Any],
    ip: Optional[str] = None
) -> AuditLog:
    """
    Appends an immutable hash-chained event to audit_log.
    Queries the latest record to get prev_hash.
    """
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at), desc(AuditLog.id)).limit(1)
    result = session.execute(stmt)
    latest = result.scalar_one_or_none()

    prev_hash = latest.hash if latest else GENESIS_HASH

    payload = {
        "action": action,
        "entity": entity,
        "entity_id": entity_id,
        "details": details,
        "actor_id": actor_id
    }

    current_hash = compute_chain_hash(prev_hash, payload)

    audit_entry = AuditLog(
        actor_id=actor_id,
        actor_role=actor_role,
        action=action,
        entity=entity,
        entity_id=entity_id,
        details=json.dumps(payload),
        ip=ip or "127.0.0.1",
        prev_hash=prev_hash,
        hash=current_hash
    )

    session.add(audit_entry)
    session.flush()
    return audit_entry


def verify_audit_chain(session: Session) -> Dict[str, Any]:
    """
    Recomputes the entire audit log hash chain from genesis root to the latest entry.
    Identifies if any row was tampered with or modified out-of-band.
    """
    stmt = select(AuditLog).order_by(AuditLog.created_at.asc(), AuditLog.id.asc())
    result = session.execute(stmt)
    logs = result.scalars().all()

    if not logs:
        return {
            "is_valid": True,
            "total_records": 0,
            "broken_at_id": None,
            "message": "Audit chain empty."
        }

    expected_prev_hash = GENESIS_HASH

    for idx, entry in enumerate(logs):
        # 1. Check prev_hash linkage
        if entry.prev_hash != expected_prev_hash:
            return {
                "is_valid": False,
                "total_records": len(logs),
                "broken_at_id": entry.id,
                "broken_index": idx,
                "reason": f"Chain linkage broken at ID {entry.id}. Expected prev_hash {expected_prev_hash[:16]}..., found {entry.prev_hash[:16]}..."
            }

        # 2. Recompute current hash from details payload
        try:
            payload = json.loads(entry.details)
        except Exception:
            payload = {}

        recalculated_hash = compute_chain_hash(expected_prev_hash, payload)

        if entry.hash != recalculated_hash:
            return {
                "is_valid": False,
                "total_records": len(logs),
                "broken_at_id": entry.id,
                "broken_index": idx,
                "reason": f"Data integrity tampered at row ID {entry.id}. Expected hash {recalculated_hash}, found {entry.hash} in database."
            }

        expected_prev_hash = entry.hash

    return {
        "is_valid": True,
        "total_records": len(logs),
        "broken_at_id": None,
        "head_hash": expected_prev_hash,
        "message": f"Cryptographic integrity verified across {len(logs)} immutable audit log entries."
    }
