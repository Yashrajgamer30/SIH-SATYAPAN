import pytest
from app.core.database import SessionLocal
from app.models.schemas import User, UserRole, Application, Institute
from app.routers.official import (
    get_cross_institute_duplicate_network,
    get_institute_trust_profile,
    get_risk_based_inspection_planner,
    get_inspection_brief,
    add_case_note,
    get_case_notes,
    CaseNoteRequest
)
from app.routers.documents import (
    verify_submission_acknowledgement,
    grant_purpose_bound_access,
    reveal_masked_pii,
    PurposeAccessRequest,
    PiiRevealRequest
)


def test_cross_institute_duplicate_network():
    db = SessionLocal()
    try:
        network = get_cross_institute_duplicate_network(db=db)
        assert network["status"] == "success"
        assert "nodes" in network
        assert "edges" in network
        assert len(network["edges"]) >= 2
        for edge in network["edges"]:
            assert edge["similarity"] >= 0.80
            assert "source" in edge
            assert "target" in edge
            assert "doc_type" in edge
    finally:
        db.close()


def test_institute_trust_profile():
    db = SessionLocal()
    try:
        inst = db.query(Institute).first()
        inst_id = inst.id if inst else "1"
        profile = get_institute_trust_profile(inst_id=inst_id, db=db)
        assert profile["status"] == "success"
        assert "STATUTORY ADVISORY" in profile["advisory_notice"]
        assert 0 <= profile["trust_index"] <= 100
        assert len(profile["trust_factors"]) >= 3
        assert len(profile["flag_history"]) >= 2
        assert profile["compliance_summary"]["total_past_audits"] > 0
    finally:
        db.close()


def test_risk_based_inspection_planner_and_brief():
    db = SessionLocal()
    try:
        # 1. Inspection Planner
        planner = get_risk_based_inspection_planner(db=db)
        assert planner["status"] == "success"
        assert planner["total_recommended_inspections"] >= 2
        assert "grouped_by_district" in planner
        assert "Pune" in planner["grouped_by_district"]

        # 2. One-Click Inspection Brief
        brief = get_inspection_brief(app_id="1", db=db)
        assert "BRIEF-" in brief["brief_id"]
        assert "institute" in brief
        assert len(brief["critical_findings"]) >= 1
        assert len(brief["on_site_checklist"]) >= 3
    finally:
        db.close()


def test_case_notes_collaboration():
    db = SessionLocal()
    try:
        officer = db.query(User).filter(User.role == UserRole.OFFICIAL_SCRUTINY).first()
        payload = CaseNoteRequest(
            application_id="app-test-collab-1",
            content="Cross-verified municipal registry for fire certificate. @senior Please confirm approval.",
            mentions=["senior"]
        )
        res = add_case_note(payload=payload, current_user=officer, db=db)
        assert res["status"] == "success"
        assert res["note"]["content"] == payload.content

        notes = get_case_notes(app_id="app-test-collab-1")
        assert len(notes) >= 1
    finally:
        db.close()


def test_acknowledgement_verification_and_pii_privacy():
    db = SessionLocal()
    try:
        officer = db.query(User).filter(User.role == UserRole.OFFICIAL_SCRUTINY).first()

        # 1. Acknowledgement QR Verification (both synthetic hash and existing DB application)
        ack_res = verify_submission_acknowledgement(ack_hash="7f83b1657ff1fc53b92dc18148a1d65d", db=db)
        assert ack_res["status"] == "VERIFIED_AUTHENTIC"
        assert ack_res["is_valid"] is True
        assert "AICTE" in ack_res["statutory_seal"]

        existing_app = db.query(Application).first()
        if existing_app:
            ack_db_res = verify_submission_acknowledgement(ack_hash=existing_app.id, db=db)
            assert ack_db_res["status"] == "VERIFIED_AUTHENTIC"
            assert ack_db_res["is_valid"] is True
            assert ack_db_res["application_no"] == existing_app.application_no

        # 2. Purpose-Bound Document Access
        purpose_req = PurposeAccessRequest(
            purpose="APH_CHAPTER_4_SCRUTINY",
            notes="Formal scrutiny of structural safety"
        )
        grant_res = grant_purpose_bound_access(
            document_id="doc-test-1",
            payload=purpose_req,
            current_user=officer,
            db=db
        )
        assert grant_res["status"] == "granted"
        assert "watermark_text" in grant_res

        # 3. Masked PII Reveal
        pii_req = PiiRevealRequest(
            document_id="doc-test-1",
            field_name="AADHAAR",
            statutory_reason="Identity verification for principal signatory"
        )
        pii_res = reveal_masked_pii(
            payload=pii_req,
            current_user=officer,
            db=db
        )
        assert pii_res["status"] == "revealed"
        assert pii_res["field_name"] == "AADHAAR"
        assert len(pii_res["revealed_value"]) > 6
    finally:
        db.close()

