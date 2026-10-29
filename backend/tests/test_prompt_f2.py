import pytest
from app.core.database import SessionLocal
from app.routers.demo import demo_system_health


def test_demo_system_health_checks():
    db = SessionLocal()
    try:
        health = demo_system_health(db=db)
        assert health["status"] == "HEALTHY"
        assert health["all_green"] is True
        assert health["presentation_ready"] is True
        assert health["checks_count"] >= 5

        check_ids = [c["id"] for c in health["checks"]]
        assert "database_connectivity" in check_ids
        assert "audit_chain_integrity" in check_ids
        assert "demo_pack_scenarios" in check_ids
        assert "tesseract_ocr" in check_ids
        assert "storage_vault_encryption" in check_ids

        for c in health["checks"]:
            assert c["healthy"] is True
            assert c["status"] == "GREEN"
    finally:
        db.close()
