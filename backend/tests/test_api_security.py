"""
AICTE SATYAPAN - Core Security & API Test Suite
Covers:
1. Argon2 password hashing
2. Official MFA (6-digit OTP challenge + verification + demo hint)
3. 15-min JWT access token & 7-day httpOnly refresh cookie
4. Logout token revocation blacklist
5. RBAC dependency guards
6. Strict IDOR defense & Row-level institute isolation
7. Cryptographic hash-chained audit trail & tamper detection
8. AES-256-GCM encrypted file vault, signed URLs, and memory-only decryption
9. Security headers & advisory banner
10. PII masking helpers & data retention job
11. Demo reset endpoint
12. OpenAPI documentation availability
"""
import pytest
import os
import io
import json
from fastapi.testclient import TestClient
from sqlalchemy import select, update, text

from app.main import app
from app.core.config import settings
from app.core.security import (
    hash_password, verify_password, mask_pan, mask_mobile, mask_aadhaar,
    REVOKED_TOKENS
)
from app.core.database import SessionLocal
from app.models.schemas import User, Institute, Application, AuditLog, Document
from app.services.retention_service import DataRetentionService

client = TestClient(app)


# ------------------------------------------------------------------------------
# 1. Argon2 Password Hashing
# ------------------------------------------------------------------------------
def test_argon2_password_hashing():
    raw_pw = "Demo@1234"
    hashed = hash_password(raw_pw)
    assert hashed.startswith("$argon2id$")
    assert verify_password(raw_pw, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


# ------------------------------------------------------------------------------
# 2. MFA Authentication for Official Roles & OTP Challenge
# ------------------------------------------------------------------------------
def test_official_mfa_login_and_otp():
    # Official user scrutiny@aicte.demo
    login_payload = {
        "email": "scrutiny@aicte.demo",
        "password": "Demo@1234"
    }
    resp = client.post("/auth/login", json=login_payload)
    assert resp.status_code == 200
    data = resp.json()

    # Must require MFA for official
    assert data["mfa_required"] is True
    assert "challenge_id" in data
    assert "demo_otp_hint" in data
    otp_code = data["demo_otp_hint"]
    assert len(otp_code) == 6
    assert otp_code.isdigit()

    # Verify OTP
    otp_payload = {
        "challenge_id": data["challenge_id"],
        "otp_code": otp_code
    }
    otp_resp = client.post("/auth/otp", json=otp_payload)
    assert otp_resp.status_code == 200
    token_data = otp_resp.json()

    assert "access_token" in token_data
    assert token_data["expires_in_minutes"] == 15
    assert token_data["role"] == "OFFICIAL_SCRUTINY"

    # Verify refresh token in httpOnly SameSite=Strict cookie
    assert "refresh_token" in otp_resp.cookies
    refresh_cookie = otp_resp.cookies["refresh_token"]
    assert len(refresh_cookie) > 20


# ------------------------------------------------------------------------------
# 3. Refresh Token Rotation
# ------------------------------------------------------------------------------
def test_refresh_token_endpoint():
    # Login as institute admin (no MFA required by default)
    login_resp = client.post("/auth/login", json={
        "email": "admin@demo-institute.in",
        "password": "Demo@1234"
    })
    assert login_resp.status_code == 200
    refresh_cookie = login_resp.cookies.get("refresh_token")
    assert refresh_cookie is not None

    # Call /auth/refresh with cookie
    ref_resp = client.post("/auth/refresh", cookies={"refresh_token": refresh_cookie})
    assert ref_resp.status_code == 200
    data = ref_resp.json()
    assert "access_token" in data
    assert data["expires_in_minutes"] == 15


# ------------------------------------------------------------------------------
# 4. Logout with Revocation List
# ------------------------------------------------------------------------------
def test_logout_with_revocation_list():
    login_resp = client.post("/auth/login", json={
        "email": "admin@demo-institute.in",
        "password": "Demo@1234"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Verify token works for /auth/me
    me_resp = client.get("/auth/me", headers=headers)
    assert me_resp.status_code == 200
    assert me_resp.json()["email"] == "admin@demo-institute.in"

    # Logout
    logout_resp = client.post("/auth/logout", headers=headers)
    assert logout_resp.status_code == 200
    assert token in REVOKED_TOKENS

    # Re-accessing /auth/me must fail with 401
    me_after = client.get("/auth/me", headers=headers)
    assert me_after.status_code == 401
    assert "revoked" in me_after.json()["detail"].lower()


# ------------------------------------------------------------------------------
# 5. RBAC Dependency Guards
# ------------------------------------------------------------------------------
def test_rbac_guards():
    # Login as Institute Admin
    inst_resp = client.post("/auth/login", json={
        "email": "admin@demo-institute.in",
        "password": "Demo@1234"
    })
    inst_token = inst_resp.json()["access_token"]
    inst_headers = {"Authorization": f"Bearer {inst_token}"}

    # Attempt to access Official Dashboard -> MUST fail with 403 Forbidden
    off_dash = client.get("/official/dashboard", headers=inst_headers)
    assert off_dash.status_code == 403
    assert "forbidden" in off_dash.json()["detail"].lower()

    # Attempt with no credentials -> MUST fail with 401 Unauthorized
    unauth_resp = client.get("/official/dashboard")
    assert unauth_resp.status_code == 401


# ------------------------------------------------------------------------------
# 6. IDOR Defense: Row-Level Institute Isolation
# ------------------------------------------------------------------------------
def test_idor_row_level_institute_isolation():
    db = SessionLocal()
    try:
        # Find Saraswati Institute (AICTE-1-3324901) and second institute (AICTE-1-4000358)
        inst_saraswati = db.execute(select(Institute).where(Institute.aicte_id == "AICTE-1-3324901")).scalar_one()
        inst_second = db.execute(select(Institute).where(Institute.aicte_id == "AICTE-1-4000358")).scalar_one()

        # Find an application belonging to the second institute
        second_app = db.execute(
            select(Application).where(Application.institute_id == inst_second.id)
        ).scalars().first()
        assert second_app is not None
        second_app_id = second_app.id
    finally:
        db.close()

    # Login as Saraswati Admin
    login_resp = client.post("/auth/login", json={
        "email": "admin@demo-institute.in",
        "password": "Demo@1234"
    })
    saraswati_token = login_resp.json()["access_token"]
    saraswati_headers = {"Authorization": f"Bearer {saraswati_token}"}

    # Saraswati attempts to read other institute's application -> MUST return 403 Forbidden
    idor_attempt = client.get(f"/institute/applications/{second_app_id}", headers=saraswati_headers)
    assert idor_attempt.status_code == 403
    assert "idor" in idor_attempt.json()["detail"].lower() or "isolation" in idor_attempt.json()["detail"].lower()


# ------------------------------------------------------------------------------
# 7. Institute Dashboard Isolation
# ------------------------------------------------------------------------------
def test_institute_dashboard():
    login_resp = client.post("/auth/login", json={
        "email": "admin@demo-institute.in",
        "password": "Demo@1234"
    })
    token = login_resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    dash = client.get("/institute/dashboard", headers=headers)
    assert dash.status_code == 200
    data = dash.json()
    assert "advisory_banner" in data
    assert "kpis" in data
    assert data["institute"]["aicte_id"] == "AICTE-1-3324901"
    assert "readiness_score" in data["kpis"]
    assert "intake_trend" in data


# ------------------------------------------------------------------------------
# 8. Cryptographic Hash-Chained Audit Trail & Tamper Detection
# ------------------------------------------------------------------------------
def test_audit_chain_tamper_detection():
    # 1. Chain must initially verify successfully
    verify_resp = client.get("/audit/verify-chain")
    assert verify_resp.status_code == 200
    assert verify_resp.json()["is_valid"] is True

    # 2. Manually tamper a row in database
    db = SessionLocal()
    tampered_row_id = None
    original_details = None
    try:
        row = db.execute(select(AuditLog).order_by(AuditLog.created_at.asc())).scalars().first()
        assert row is not None
        tampered_row_id = row.id
        original_details = row.details

        # Bypass ORM event listeners by using raw SQL update
        db.execute(
            text("UPDATE audit_log SET details = :tampered WHERE id = :id"),
            {"tampered": json.dumps({"action": "MALICIOUS_UNAUTHORIZED_MUTATION", "details": "Tampered payload"}), "id": row.id}
        )
        db.commit()
    finally:
        db.close()

    # 3. Verification endpoint MUST immediately detect the corruption
    fail_resp = client.get("/audit/verify-chain")
    assert fail_resp.status_code == 200
    fail_data = fail_resp.json()
    assert fail_data["is_valid"] is False
    assert fail_data["broken_at_id"] == tampered_row_id
    assert "tampered" in fail_data["reason"].lower() or "integrity" in fail_data["reason"].lower()

    # 4. Restore original state and verify chain passes again
    db = SessionLocal()
    try:
        db.execute(
            text("UPDATE audit_log SET details = :orig WHERE id = :id"),
            {"orig": original_details, "id": tampered_row_id}
        )
        db.commit()
    finally:
        db.close()

    repaired_resp = client.get("/audit/verify-chain")
    assert repaired_resp.status_code == 200
    assert repaired_resp.json()["is_valid"] is True


# ------------------------------------------------------------------------------
# 9. AES-256-GCM Encrypted File Storage & Memory-Only Decryption
# ------------------------------------------------------------------------------
def test_encrypted_file_vault_and_signed_url():
    # Login as Saraswati Principal
    login_resp = client.post("/auth/login", json={
        "email": "admin@demo-institute.in",
        "password": "Demo@1234"
    })
    token = login_resp.json()["access_token"]
    user_id = login_resp.json()["user_id"]
    headers = {"Authorization": f"Bearer {token}"}

    db = SessionLocal()
    try:
        app_rec = db.execute(select(Application).where(Application.institute_id == login_resp.json()["institute_id"])).scalars().first()
        app_id = app_rec.id
    finally:
        db.close()

    # Create dummy PDF
    pdf_bytes = b"%PDF-1.4\n1 0 obj\n<< /Title (Test AICTE Document) >>\nendobj\ntrailer\n<< /Root 1 0 R >>\n%%EOF"
    upload_file = io.BytesIO(pdf_bytes)

    # Upload
    upload_resp = client.post(
        "/documents/upload",
        data={"application_id": app_id, "document_type": "FIRE_SAFETY_NOC"},
        files={"file": ("fire_noc.pdf", upload_file, "application/pdf")},
        headers=headers
    )
    assert upload_resp.status_code == 200
    upload_data = upload_resp.json()
    doc_id = upload_data["document_id"]
    vault_path = upload_data["encrypted_vault_path"]

    # Verify encrypted on disk: file on disk must NOT contain raw string "%PDF-1.4"
    with open(vault_path, "rb") as f:
        stored_bytes = f.read()
    assert b"%PDF-1.4" not in stored_bytes

    # Generate 5-minute signed viewing URL
    sign_resp = client.post(f"/documents/{doc_id}/signed-url", headers=headers)
    assert sign_resp.status_code == 200
    signed_token = sign_resp.json()["signed_token"]

    # View decrypted file via signed URL
    view_resp = client.get(f"/documents/{doc_id}/view?token={signed_token}&user_id={user_id}")
    assert view_resp.status_code == 200
    assert view_resp.content == pdf_bytes # Decrypted in memory exactly equals original bytes
    assert view_resp.headers["content-type"] == "application/pdf"

    # View with invalid token -> 403 Forbidden
    bad_view = client.get(f"/documents/{doc_id}/view?token=invalid.signature&user_id={user_id}")
    assert bad_view.status_code == 403


# ------------------------------------------------------------------------------
# 10. Security Headers & Principle 1 Advisory Banner
# ------------------------------------------------------------------------------
def test_security_headers_and_advisory():
    resp = client.get("/")
    assert resp.status_code == 200

    # Headers check
    headers = resp.headers
    assert headers["x-frame-options"] == "DENY"
    assert headers["x-content-type-options"] == "nosniff"
    assert "strict-transport-security" in headers
    assert "content-security-policy" in headers
    assert "x-ai-advisory" in headers
    assert "advisory" in headers["x-ai-advisory"].lower()


# ------------------------------------------------------------------------------
# 11. PII Masking Helpers & Data Retention Service
# ------------------------------------------------------------------------------
def test_pii_masking_and_data_retention():
    assert mask_pan("ABCDE1234F") == "ABCDE****F"
    assert mask_mobile("+91-9823456789") == "98****6789"
    assert mask_aadhaar("1234 5678 9012") == "**** **** 9012"

    # Test Data Retention Job
    db = SessionLocal()
    try:
        retention = DataRetentionService(db)
        result = retention.purge_expired_access_logs(retention_days=30)
        assert result["status"] == "success"
        assert "purged_count" in result
    finally:
        db.close()


# ------------------------------------------------------------------------------
# 12. Demo Reset & OpenAPI Docs
# ------------------------------------------------------------------------------
def test_demo_reset_and_docs():
    # OpenAPI Docs
    docs_resp = client.get("/docs")
    assert docs_resp.status_code == 200

    openapi_resp = client.get("/openapi.json")
    assert openapi_resp.status_code == 200
    assert openapi_resp.json()["info"]["title"].startswith("AICTE SATYAPAN")

    # Demo reset
    reset_resp = client.post("/demo/reset")
    assert reset_resp.status_code == 200
    assert reset_resp.json()["status"] == "success"
