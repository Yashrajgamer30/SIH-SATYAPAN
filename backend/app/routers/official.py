from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles
from app.models.schemas import User, UserRole, Application, ApplicationStatus
from app.services.dashboard_service import DashboardService
from app.core.audit import write_audit_event

router = APIRouter(prefix="/official", tags=["AICTE Official Scrutiny Portal"])


class OfficialDecisionRequest(BaseModel):
    decision: str = Field(..., description="APPROVED, DEFICIENCY_RAISED, INSPECTION_RECOMMENDED, REJECTED")
    remarks: str = Field(..., min_length=10, description="Mandatory official justification remarks")


@router.get("/dashboard")
def get_official_dashboard(
    current_user: User = Depends(require_roles(UserRole.OFFICIAL_SCRUTINY, UserRole.OFFICIAL_SENIOR, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns macro KPI numbers, risk distribution, status breakdowns, and monthly disposal trends for Officials.
    """
    service = DashboardService(db)
    return service.get_official_dashboard()


@router.get("/queue")
def get_scrutiny_queue(
    state: Optional[str] = None,
    status_filter: Optional[str] = None,
    current_user: User = Depends(require_roles(UserRole.OFFICIAL_SCRUTINY, UserRole.OFFICIAL_SENIOR, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns prioritized applications queue for official scrutiny.
    """
    stmt = select(Application).order_by(desc(Application.risk_score), desc(Application.created_at)).limit(50)
    res = db.execute(stmt)
    apps = res.scalars().all()

    queue = []
    for a in apps:
        if status_filter and a.status.value != status_filter:
            continue
        if state and a.institute and a.institute.state != state:
            continue

        queue.append({
            "id": a.id,
            "application_no": a.application_no,
            "institute_id": a.institute_id,
            "institute_name": a.institute.name if a.institute else "Unknown",
            "state": a.institute.state if a.institute else "N/A",
            "academic_year": a.academic_year,
            "status": a.status.value,
            "risk_score": a.risk_score,
            "fast_track": a.risk_score <= 25.0,
            "deficiency_count": a.deficiency_count,
            "created_at": a.created_at.isoformat()
        })
    return queue


@router.post("/applications/{application_id}/decision")
def record_official_decision(
    application_id: str,
    payload: OfficialDecisionRequest,
    request: Request,
    current_user: User = Depends(require_roles(UserRole.OFFICIAL_SCRUTINY, UserRole.OFFICIAL_SENIOR, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Principle 1 Enforcement: AI is strictly advisory.
    Adverse or regulatory actions require explicit human official authorization and written remarks.
    Writes an immutable hash-chained audit event.
    """
    stmt = select(Application).where(Application.id == application_id)
    res = db.execute(stmt)
    app_record = res.scalar_one_or_none()

    if not app_record:
        raise HTTPException(status_code=404, detail="Application not found.")

    valid_decisions = {s.value for s in ApplicationStatus}
    if payload.decision not in valid_decisions:
        raise HTTPException(status_code=400, detail=f"Invalid decision status. Allowed: {valid_decisions}")

    old_status = app_record.status.value
    app_record.status = ApplicationStatus(payload.decision)
    app_record.official_remarks = payload.remarks
    app_record.assigned_officer_id = current_user.id

    client_ip = request.client.host if request.client else "127.0.0.1"

    # Append hash-chained audit log
    write_audit_event(
        session=db,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        action="OFFICIAL_DECISION_SUBMITTED",
        entity="applications",
        entity_id=application_id,
        details={
            "old_status": old_status,
            "new_status": payload.decision,
            "official_remarks": payload.remarks
        },
        ip=client_ip
    )
    db.commit()

    return {
        "status": "success",
        "message": f"Regulatory decision '{payload.decision}' successfully recorded by {current_user.name}.",
        "application_id": application_id,
        "new_status": payload.decision
    }
