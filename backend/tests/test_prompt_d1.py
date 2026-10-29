import pytest
from app.core.database import SessionLocal
from app.models.schemas import User, UserRole, Application, ApplicationStatus, Verification, VerificationStatus
from app.routers.official import (
    get_smart_scrutiny_queue,
    get_application_review_dossier,
    record_official_decision,
    confirm_senior_decision,
    get_verification_centre_records,
    retry_unavailable_verifications,
    manual_confirm_verification,
    bulk_assign_applications,
    OfficialDecisionRequest,
    SeniorConfirmationRequest,
    BulkAssignRequest,
    ManualVerificationRequest
)


class MockRequest:
    client = type('Client', (), {'host': '127.0.0.1'})()
    headers = {}


def test_smart_queue_ranking_and_filters():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == UserRole.OFFICIAL_SCRUTINY).first()
        queue = get_smart_scrutiny_queue(current_user=user, db=db)
        assert len(queue) > 0

        # Verify sorted by priority_score descending
        scores = [item["priority_score"] for item in queue]
        assert scores == sorted(scores, reverse=True)

        # Verify top reasons presence
        for item in queue[:5]:
            assert len(item["top_risk_reasons"]) >= 1
            assert "priority_score" in item
            assert "sla_status" in item

        # Test state filter
        mh_queue = get_smart_scrutiny_queue(state="Maharashtra", current_user=user, db=db)
        for item in mh_queue:
            assert item["state"] == "Maharashtra"

        # Test saved view filter
        crit_queue = get_smart_scrutiny_queue(saved_view="critical_risk", current_user=user, db=db)
        for item in crit_queue:
            assert item["risk_score"] >= 50.0
    finally:
        db.close()


def test_application_review_8_tabs_dossier():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == UserRole.OFFICIAL_SCRUTINY).first()
        app = db.query(Application).first()
        dossier = get_application_review_dossier(app.id, current_user=user, db=db)

        # 8 Tabs existence
        assert "summary" in dossier
        assert "diff" in dossier
        assert "students_and_documents" in dossier
        assert "findings" in dossier
        assert "infra_evidence" in dossier
        assert "verification" in dossier
        assert "timeline" in dossier
        assert "audit" in dossier

        # Check diff structure
        assert len(dossier["diff"]) >= 4
        mismatches = [d for d in dossier["diff"] if d["is_mismatch"]]
        assert len(mismatches) >= 1

        # Check explain-why metadata in findings
        for f in dossier["findings"]:
            assert "explain_why" in f
            assert "top_contributing_factors" in f["explain_why"]
    finally:
        db.close()


def test_two_person_rule_decision_lifecycle():
    db = SessionLocal()
    try:
        scrutiny_user = db.query(User).filter(User.role == UserRole.OFFICIAL_SCRUTINY).first()
        senior_user = db.query(User).filter(User.role == UserRole.OFFICIAL_SENIOR).first()
        app = db.query(Application).first()
        req = MockRequest()

        # 1. Scrutiny officer proposing adverse action -> must trigger AWAITING_SENIOR_CONFIRMATION
        adverse_payload = OfficialDecisionRequest(
            decision="REJECTED",
            remarks="Critical statutory non-compliance. Land area and fire safety invalid."
        )
        res1 = record_official_decision(app.id, adverse_payload, req, current_user=scrutiny_user, db=db)
        assert res1["status"] == "awaiting_senior"
        assert res1["new_status"] == "AWAITING_SENIOR_CONFIRMATION"

        db.refresh(app)
        assert app.status.value == "AWAITING_SENIOR_CONFIRMATION"

        # 2. Senior officer confirming decision -> finalizes to REJECTED
        confirm_payload = SeniorConfirmationRequest(
            confirmed=True,
            remarks="Concur with findings. Two-person senior endorsement completed."
        )
        res2 = confirm_senior_decision(app.id, confirm_payload, req, current_user=senior_user, db=db)
        assert res2["status"] == "success"
        assert res2["final_status"] == "REJECTED"

        db.refresh(app)
        assert app.status.value == "REJECTED"

        # Reset status back to SUBMITTED for cleanliness
        app.status = ApplicationStatus.SUBMITTED
        db.commit()
    finally:
        db.close()


def test_verification_centre_and_bulk_retry():
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.role == UserRole.OFFICIAL_SCRUTINY).first()
        vc = get_verification_centre_records(current_user=user, db=db)

        # Assert 6 exact statuses in stats
        expected_statuses = [
            "VERIFIED", "MISMATCH_DETECTED", "EXPIRED",
            "VERIFICATION_PENDING", "SOURCE_UNAVAILABLE", "MANUAL_REVIEW_REQUIRED"
        ]
        for s in expected_statuses:
            assert s in vc["stats"]

        # Test bulk retry
        retry_res = retry_unavailable_verifications(current_user=user, db=db)
        assert retry_res["status"] == "success"

        # Test manual confirmation
        if len(vc["items"]) > 0:
            target_id = vc["items"][0]["id"]
            manual_payload = ManualVerificationRequest(
                status="VERIFIED",
                remarks="Physical deed verified under register volume 184.",
                physical_ref="DISPATCH/MH/2026/8841"
            )
            man_res = manual_confirm_verification(target_id, manual_payload, current_user=user, db=db)
            assert man_res["status"] == "success"
            assert man_res["new_status"] == "VERIFIED"
    finally:
        db.close()
