from typing import List, Optional, Dict, Any
from datetime import datetime
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


# ==============================================================================
# Principle 3: Configurable Regulatory Checklist & Rules Engine Endpoints
# ==============================================================================

DEFAULT_REGULATORY_RULES = [
    {
        "id": "rule-1",
        "rule_code": "LAND_AREA_COMPLIANCE",
        "category": "Land & Infrastructure",
        "title": "Minimum Land Requirement for Technical Institution",
        "description": "Validates that the institution possesses contiguous unencumbered land based on location classification (Mega/Metro: 1.5 acres, Urban: 2.5 acres, Rural: 4.0 acres).",
        "version": 1,
        "is_active": True,
        "rule_json": {
            "min_acres_metro": 1.5,
            "min_acres_urban": 2.5,
            "min_acres_rural": 4.0,
            "ownership_types_allowed": ["OWNED", "GOVERNMENT_LEASE_30_YEARS"],
            "allow_multiple_plots": False,
            "contiguous_mandatory": True
        }
    },
    {
        "id": "rule-2",
        "rule_code": "FIRE_NOC_VALIDITY",
        "category": "Fire & Building Safety",
        "title": "Fire Safety Certificate / NOC Validity Check",
        "description": "Ensures Fire Department NOC is unexpired and encompasses all operational academic blocks and student hostel facilities.",
        "version": 1,
        "is_active": True,
        "rule_json": {
            "must_be_active": True,
            "authority_type": "STATE_FIRE_SERVICES",
            "renewal_grace_period_days": 0,
            "inspection_certificate_mandatory": True
        }
    },
    {
        "id": "rule-3",
        "rule_code": "FACULTY_CADRE_RATIO",
        "category": "Faculty & Cadre Ratios",
        "title": "Faculty-to-Student & Cadre Ratio Compliance",
        "description": "Verifies Student-to-Faculty Ratio (SFR) 1:20 and Cadre distribution 1:2:6 (Professor : Assoc Professor : Asst Professor).",
        "version": 1,
        "is_active": True,
        "rule_json": {
            "target_sfr": 20.0,
            "max_sfr_tolerated": 20.0,
            "cadre_professor_ratio": 1,
            "cadre_assoc_prof_ratio": 2,
            "cadre_asst_prof_ratio": 6,
            "min_phd_percentage": 20.0,
            "duplicate_faculty_prohibited": True
        }
    },
    {
        "id": "rule-4",
        "rule_code": "FDR_DEPOSIT_SECURITY",
        "category": "Financial & FDR Norms",
        "title": "Joint FDR with Regional Officer AICTE",
        "description": "Validates that Fixed Deposit Receipt is drawn jointly with Regional Officer AICTE with minimum 8 years tenure and zero encumbrance/lien.",
        "version": 1,
        "is_active": True,
        "rule_json": {
            "joint_with_aicte": True,
            "min_tenure_years": 8,
            "min_amount_lakhs": 35.0,
            "lien_status_allowed": ["NONE"]
        }
    },
    {
        "id": "rule-5",
        "rule_code": "BUILDING_SAFETY_AND_OCCUPANCY",
        "category": "Fire & Building Safety",
        "title": "Building Occupancy & Structural Stability",
        "description": "Validates that building plans are approved by competent municipal authority and structural stability certificate is signed by a registered structural engineer.",
        "version": 1,
        "is_active": True,
        "rule_json": {
            "approved_by_competent_authority": True,
            "barrier_free_disabled_access": True,
            "lift_installed_if_floors_exceed": 3,
            "structural_stability_certified": True
        }
    },
    {
        "id": "rule-6",
        "rule_code": "STATUTORY_AFFIDAVIT_INTEGRITY",
        "category": "Accreditation & Trust",
        "title": "Anti-Ragging and Statutory Land Affidavits",
        "description": "Verifies that notary registration numbers, date stamps, and non-judicial e-stamp serial numbers conform to State Government registers.",
        "version": 1,
        "is_active": True,
        "rule_json": {
            "notary_registration_verified": True,
            "estamp_value_min_inr": 100,
            "hmac_signature_verified": True
        }
    }
]


@router.get("/rules")
def get_regulatory_rules(
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """
    Returns configurable APH regulatory checklist rules.
    If custom versions exist in ConfigVersion, merges them with defaults.
    """
    from app.models.schemas import ConfigVersion
    import json

    stmt = select(ConfigVersion).where(ConfigVersion.key.startswith("RULE_"))
    res = db.execute(stmt)
    configs = {c.key: c for c in res.scalars().all()}

    rules = []
    for r in DEFAULT_REGULATORY_RULES:
        key = f"RULE_{r['rule_code']}"
        rule_item = dict(r)
        if key in configs:
            try:
                saved = json.loads(configs[key].value_json)
                rule_item["rule_json"] = saved.get("rule_json", rule_item["rule_json"])
                rule_item["version"] = saved.get("version", rule_item["version"])
                rule_item["is_active"] = saved.get("is_active", True)
                rule_item["updated_at"] = configs[key].updated_at.isoformat()
            except Exception:
                pass

        if category and category.lower() not in rule_item["category"].lower():
            continue
        rules.append(rule_item)

    return rules


class RuleUpdateRequest(BaseModel):
    rule_json: Dict[str, Any]
    is_active: Optional[bool] = True
    remarks: Optional[str] = "Rule threshold updated by administrator"


@router.put("/rules/{rule_code}")
def update_regulatory_rule(
    rule_code: str,
    payload: RuleUpdateRequest,
    db: Session = Depends(get_db)
):
    """
    Updates rule JSON configuration, increments version, and writes immutable audit event.
    """
    from app.models.schemas import ConfigVersion
    import json

    key = f"RULE_{rule_code}"
    stmt = select(ConfigVersion).where(ConfigVersion.key == key)
    res = db.execute(stmt)
    cfg = res.scalar_one_or_none()

    current_version = 1
    if cfg:
        try:
            old_data = json.loads(cfg.value_json)
            current_version = old_data.get("version", 1) + 1
        except Exception:
            current_version = 2
    else:
        cfg = ConfigVersion(key=key)
        db.add(cfg)
        current_version = 2

    new_payload = {
        "rule_code": rule_code,
        "rule_json": payload.rule_json,
        "version": current_version,
        "is_active": payload.is_active,
        "remarks": payload.remarks
    }
    cfg.value_json = json.dumps(new_payload)
    cfg.updated_at = datetime.utcnow()

    # Audit event
    write_audit_event(
        session=db,
        actor_id="admin-system-user",
        actor_role="SYSTEM_ADMIN",
        action="ADMIN_RULE_UPDATED",
        entity="config_versions",
        entity_id=key,
        details={
            "rule_code": rule_code,
            "new_version": current_version,
            "remarks": payload.remarks
        }
    )
    db.commit()

    return {
        "status": "success",
        "message": f"Rule {rule_code} updated to Version {current_version}.0",
        "rule_code": rule_code,
        "version": current_version,
        "rule_json": payload.rule_json,
        "is_active": payload.is_active
    }


@router.post("/rules/reset")
def reset_regulatory_rules_to_defaults(db: Session = Depends(get_db)):
    """Restores all checklist rules back to official AICTE APH 2026-27 defaults."""
    from app.models.schemas import ConfigVersion
    from sqlalchemy import delete

    db.execute(delete(ConfigVersion).where(ConfigVersion.key.startswith("RULE_")))
    write_audit_event(
        session=db,
        actor_id="admin-system-user",
        actor_role="SYSTEM_ADMIN",
        action="ADMIN_RULES_RESET_DEFAULTS",
        entity="config_versions",
        entity_id="ALL",
        details={"notice": "Restored 6 APH 2026-27 statutory rules to defaults"}
    )
    db.commit()

    return {
        "status": "success",
        "message": "All regulatory rules restored to AICTE APH 2026-27 statutory defaults."
    }

