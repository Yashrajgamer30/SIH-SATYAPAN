import pytest
from app.core.database import SessionLocal
from app.routers.official import (
    get_regulatory_rules,
    update_regulatory_rule,
    reset_regulatory_rules_to_defaults,
    RuleUpdateRequest,
)


def test_regulatory_rules_lifecycle():
    db = SessionLocal()
    try:
        # 1. Reset rules to ensure pristine state
        reset_res = reset_regulatory_rules_to_defaults(db=db)
        assert reset_res["status"] == "success"

        # 2. Get default rules
        rules = get_regulatory_rules(db=db)
        assert len(rules) >= 6
        land_rule = next((r for r in rules if r["rule_code"] == "LAND_AREA_COMPLIANCE"), None)
        assert land_rule is not None
        assert land_rule["version"] == 1
        assert land_rule["is_active"] is True

        # 3. Update rule
        update_req = RuleUpdateRequest(
            rule_json={"min_acres_metro": 2.0, "min_acres_urban": 3.0, "min_acres_rural": 5.0},
            is_active=True,
            remarks="Updated metro threshold for testing"
        )
        update_res = update_regulatory_rule("LAND_AREA_COMPLIANCE", update_req, db=db)
        assert update_res["status"] == "success"
        assert update_res["version"] == 2
        assert update_res["rule_json"]["min_acres_metro"] == 2.0

        # 4. Fetch again to verify persistence
        rules_after = get_regulatory_rules(db=db)
        updated_land = next(r for r in rules_after if r["rule_code"] == "LAND_AREA_COMPLIANCE")
        assert updated_land["version"] == 2
        assert updated_land["rule_json"]["min_acres_metro"] == 2.0

        # 5. Reset back to defaults
        reset_res2 = reset_regulatory_rules_to_defaults(db=db)
        assert reset_res2["status"] == "success"

        # 6. Verify version restored to 1
        rules_reset = get_regulatory_rules(db=db)
        reset_land = next(r for r in rules_reset if r["rule_code"] == "LAND_AREA_COMPLIANCE")
        assert reset_land["version"] == 1
        assert reset_land["rule_json"]["min_acres_metro"] == 1.5

    finally:
        db.close()
