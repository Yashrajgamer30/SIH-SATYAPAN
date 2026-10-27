from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import select, desc

from app.core.database import get_db
from app.core.auth import get_current_user, require_roles, verify_institute_access
from app.models.schemas import User, UserRole, Application, Document, Finding
from app.services.dashboard_service import DashboardService

router = APIRouter(prefix="/institute", tags=["Institute Portal"])


@router.get("/dashboard")
def get_institute_dashboard(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns KPI numbers, 5-year intake chart datasets, and compliance readiness
    for the logged-in institute. Enforces strict row-level institute isolation.
    """
    if not current_user.institute_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Authenticated user is not linked to any AICTE Institute."
        )

    service = DashboardService(db)
    try:
        data = service.get_institute_dashboard(current_user)
        return data
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/applications")
def get_my_applications(
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns list of applications strictly isolated to the caller's institution (Row-level isolation).
    """
    stmt = (
        select(Application)
        .where(Application.institute_id == current_user.institute_id)
        .order_by(desc(Application.created_at))
    )
    res = db.execute(stmt)
    apps = res.scalars().all()
    return [
        {
            "id": a.id,
            "application_no": a.application_no,
            "academic_year": a.academic_year,
            "status": a.status.value,
            "risk_score": a.risk_score,
            "submission_date": a.submission_date.isoformat() if a.submission_date else None,
            "created_at": a.created_at.isoformat()
        } for a in apps
    ]


@router.get("/applications/{application_id}")
def get_application_by_id(
    application_id: str,
    current_user: User = Depends(require_roles(UserRole.INSTITUTE_ADMIN, UserRole.INSTITUTE_FACULTY, UserRole.SYSTEM_ADMIN)),
    db: Session = Depends(get_db)
):
    """
    Returns details for an application.
    Enforces IDOR Protection: Raises 403 Forbidden if institute attempts to access another institute's application.
    """
    stmt = select(Application).where(Application.id == application_id)
    res = db.execute(stmt)
    app_record = res.scalar_one_or_none()

    if not app_record:
        raise HTTPException(status_code=404, detail=f"Application '{application_id}' not found.")

    # Strict IDOR check
    verify_institute_access(current_user, app_record.institute_id)

    # Fetch documents
    docs_res = db.execute(select(Document).where(Document.application_id == application_id))
    docs = docs_res.scalars().all()

    # Fetch findings
    findings_res = db.execute(select(Finding).where(Finding.application_id == application_id))
    findings = findings_res.scalars().all()

    return {
        "advisory_banner": "AI RESULT IS ADVISORY. Scrutiny and approval decisions rest strictly with authorized AICTE Officials.",
        "id": app_record.id,
        "application_no": app_record.application_no,
        "institute_id": app_record.institute_id,
        "academic_year": app_record.academic_year,
        "status": app_record.status.value,
        "risk_score": app_record.risk_score,
        "deficiency_count": app_record.deficiency_count,
        "official_remarks": app_record.official_remarks,
        "documents": [
            {
                "id": d.id,
                "doc_type": d.doc_type,
                "original_filename": d.original_filename,
                "size": d.size,
                "created_at": d.created_at.isoformat()
            } for d in docs
        ],
        "findings": [
            {
                "id": f.id,
                "title": f.title,
                "severity": f.severity.value if hasattr(f.severity, 'value') else str(f.severity),
                "status": f.status.value if hasattr(f.status, 'value') else str(f.status),
                "type": f.type.value if hasattr(f.type, 'value') else str(f.type),
                "reason": f.reason
            } for f in findings
        ]
    }
