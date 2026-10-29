import pytest
from app.core.database import SessionLocal
from app.models.schemas import User, UserRole
from app.routers.audit import (
    get_security_posture,
    get_document_access_logs,
    get_active_sessions,
    revoke_session,
    verify_chain_endpoint
)
from app.routers.demo import (
    demo_tamper_audit_row,
    demo_repair_audit_chain
)
from app.routers.official import (
    get_infra_compliance_data,
    get_analytics_eval_report,
    test_regulatory_rule_on_sample as run_rule_test_on_sample,
    rollback_regulatory_rule
)


def test_security_posture_and_sessions():
    db = SessionLocal()
    try:
        # 1. Security Posture
        posture = get_security_posture()
        assert posture["status"] == "SECURE"
        assert len(posture["controls"]) >= 5
        for control in posture["controls"]:
            assert control["healthy"] is True
            assert control["status"] == "ACTIVE"

        # 2. Document Access Logs
        logs = get_document_access_logs(db=db)
        assert isinstance(logs, list)

        # 3. Active Sessions and Revocation
        sessions = get_active_sessions()
        assert len(sessions) > 0
        sid = sessions[0]["id"]
        res = revoke_session(session_id=sid, db=db)
        assert res["status"] == "success"
    finally:
        db.close()


def test_audit_hash_chain_tamper_and_repair():
    db = SessionLocal()
    try:
        # 0. Ensure clean starting state
        demo_repair_audit_chain(db=db)
        init_verify = verify_chain_endpoint(db=db)
        assert init_verify["is_valid"] is True

        # 1. Tamper row
        tamper_res = demo_tamper_audit_row(db=db)
        assert tamper_res["status"] == "tampered"
        tampered_id = tamper_res["tampered_row_id"]

        # 2. Verify chain detects tampering
        verification = verify_chain_endpoint(db=db)
        assert verification["is_valid"] is False
        assert verification["broken_at_id"] == tampered_id

        # 3. Repair chain
        repair_res = demo_repair_audit_chain(db=db)
        assert repair_res["status"] == "repaired"

        # 4. Verify chain integrity restored
        verification_restored = verify_chain_endpoint(db=db)
        assert verification_restored["is_valid"] is True
    finally:
        db.close()


def test_infra_compliance_and_evaluation_metrics():
    db = SessionLocal()
    try:
        # 1. Infra Compliance
        infra = get_infra_compliance_data(db=db)
        assert "checklist" in infra
        assert "gallery" in infra
        assert len(infra["checklist"]) >= 4

        # 2. Evaluation Analytics (loaded from synthetic benchmark eval.json)
        analytics = get_analytics_eval_report()
        assert "synthetic benchmark, held-out split" in analytics["benchmark_disclosure"]
        assert "metrics" in analytics
        assert "effort_reduction_assumptions" in analytics
        assert analytics["metrics"]["ocr_field_accuracy"] >= 95.0
        assert analytics["effort_reduction_assumptions"]["hours_saved_annually"] > 10000
    finally:
        db.close()


def test_admin_rules_test_and_rollback():
    db = SessionLocal()
    try:
        # 1. Test rule on sample
        test_res = run_rule_test_on_sample(rule_code="FACULTY_CADRE_RATIO", db=db)
        assert test_res["rule_code"] == "FACULTY_CADRE_RATIO"
        assert "evaluation" in test_res

        # 2. Rollback rule version
        rb_res = rollback_regulatory_rule(rule_code="FACULTY_CADRE_RATIO", db=db)
        assert rb_res["status"] == "success"
        assert rb_res["version"] == 1
    finally:
        db.close()
