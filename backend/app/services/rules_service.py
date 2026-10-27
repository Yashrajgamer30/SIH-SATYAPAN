"""
Rule Builder & Checklist Seed
Stores rules in DB as JSON per AICTE Approval Process Handbook (APH 2026-27).
Principle 3: CONFIGURABLE. Rules live in DB as JSON, versioned, editable from Admin UI.
"""
import json
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.models.schemas import ChecklistRule
from app.models.enums import DocumentCategory

INITIAL_AICTE_RULES = [
    {
        "rule_code": "LAND_AREA_COMPLIANCE",
        "category": DocumentCategory.LAND_OWNERSHIP,
        "title": "Minimum Land Requirement for Technical Institution",
        "description": "Validates that the institution possesses contiguous unencumbered land of at least the required acres based on location category (Mega/Metro: 1.5 acres, Urban: 2.5 acres, Rural: 4.0 acres).",
        "rule_json": json.dumps({
            "min_acres_metro": 1.5,
            "min_acres_urban": 2.5,
            "min_acres_rural": 4.0,
            "ownership_types_allowed": ["OWNED", "GOVERNMENT_LEASE_30_YEARS"],
            "allow_multiple_plots": False
        }),
        "version": 1
    },
    {
        "rule_code": "FIRE_NOC_VALIDITY",
        "category": DocumentCategory.FIRE_NOC,
        "title": "Fire Safety Certificate / NOC Validity Check",
        "description": "Ensures that the Fire Department NOC is not expired at the time of scrutiny and covers all operational academic and administrative blocks.",
        "rule_json": json.dumps({
            "must_be_active": True,
            "authority_type": "STATE_FIRE_SERVICES",
            "renewal_grace_period_days": 0
        }),
        "version": 1
    },
    {
        "rule_code": "FACULTY_CADRE_RATIO",
        "category": DocumentCategory.FACULTY_APPOINTMENT,
        "title": "Faculty-to-Student & Cadre Ratio Compliance",
        "description": "Verifies that the Student-to-Faculty Ratio (SFR) meets 1:20 for Engineering/Technology and cadre ratio of Professor : Assoc Professor : Asst Professor is approximately 1:2:6.",
        "rule_json": json.dumps({
            "target_sfr": 20,
            "max_sfr_tolerated": 20.0,
            "min_phd_percentage": 20.0,
            "duplicate_faculty_prohibited": True
        }),
        "version": 1
    },
    {
        "rule_code": "FDR_DEPOSIT_SECURITY",
        "category": DocumentCategory.FDR_DEPOSIT,
        "title": "Joint FDR with AICTE Verification",
        "description": "Verifies that the Fixed Deposit Receipt is drawn in joint name with Regional Officer AICTE, has a minimum maturity of 8 years, and has no encumbrance/lien.",
        "rule_json": json.dumps({
            "joint_with_aicte": True,
            "min_tenure_years": 8,
            "lien_status": "NONE"
        }),
        "version": 1
    },
    {
        "rule_code": "BUILDING_SAFETY_AND_OCCUPANCY",
        "category": DocumentCategory.OCCUPANCY_CERTIFICATE,
        "title": "Building Occupancy & Structural Stability",
        "description": "Validates that the building plan is approved by the competent municipal/planning authority and structural stability certificate is signed by a registered structural engineer.",
        "rule_json": json.dumps({
            "approved_by_competent_authority": True,
            "barrier_free_disabled_access": True,
            "lift_installed_if_floors_exceed": 3
        }),
        "version": 1
    }
]


async def seed_initial_rules(db: AsyncSession):
    for rule_data in INITIAL_AICTE_RULES:
        result = await db.execute(
            select(ChecklistRule).where(ChecklistRule.rule_code == rule_data["rule_code"])
        )
        existing = result.scalar_one_or_none()
        if not existing:
            rule = ChecklistRule(
                rule_code=rule_data["rule_code"],
                category=rule_data["category"],
                title=rule_data["title"],
                description=rule_data["description"],
                rule_json=rule_data["rule_json"],
                version=rule_data["version"],
                is_active=True
            )
            db.add(rule)
    await db.commit()
