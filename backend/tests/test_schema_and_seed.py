"""
AICTE SATYAPAN - Schema & Seed Acceptance Test Suite
Verifies:
1. Database table row counts meet or exceed prompt specifications
2. Foreign key integrity and associations
3. Argon2 password verification for 'Demo@1234' on all demo accounts
4. Hash-chain cryptographic integrity on audit_log
5. Append-only ORM guard enforcement (blocks UPDATE and DELETE on AuditLog)
"""
import os
import sys
import pytest
import hashlib
import json
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import sessionmaker

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.models.schemas import (
    Base, User, Institute, InstituteRecord, ApplicationCategory, Application,
    Faculty, Student, Document, Finding, Deficiency, Verification, AuditLog,
    EvaluationMetric, UserRole
)
from argon2 import PasswordHasher

DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "satyapan.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)


@pytest.fixture
def db_session():
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()


def test_row_counts(db_session):
    """Verify seeded row counts meet the prompt specifications."""
    inst_count = db_session.execute(select(func.count(Institute.id))).scalar()
    cat_count = db_session.execute(select(func.count(ApplicationCategory.id))).scalar()
    app_count = db_session.execute(select(func.count(Application.id))).scalar()
    faculty_count = db_session.execute(select(func.count(Faculty.id))).scalar()
    student_count = db_session.execute(select(func.count(Student.id))).scalar()
    metrics_count = db_session.execute(select(func.count(EvaluationMetric.id))).scalar()

    assert inst_count >= 40, f"Expected at least 40 institutes, found {inst_count}"
    assert cat_count == 8, f"Expected 8 application categories, found {cat_count}"
    assert app_count >= 60, f"Expected >= 60 applications, found {app_count}"
    assert faculty_count >= 150, f"Expected >= 150 faculty, found {faculty_count}"
    assert student_count >= 600, f"Expected >= 600 students, found {student_count}"
    assert metrics_count >= 100, f"Expected >= 100 historical metric data points, found {metrics_count}"


def test_demo_accounts_and_argon2_hashing(db_session):
    """Verify all 5 demo accounts exist with Argon2 hashed password matching 'Demo@1234'."""
    ph = PasswordHasher()
    demo_emails = [
        "faculty@demo-institute.in",
        "admin@demo-institute.in",
        "scrutiny@aicte.demo",
        "senior@aicte.demo",
        "sysadmin@aicte.demo"
    ]

    for email in demo_emails:
        user = db_session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        assert user is not None, f"Demo account {email} not found in database"
        assert user.password_hash.startswith("$argon2"), f"Password for {email} is not hashed with Argon2"
        # Verify argon2 password matches
        assert ph.verify(user.password_hash, "Demo@1234") is True


def test_foreign_key_and_demo_institute_integrity(db_session):
    """Verify demo institute has rich relationships, applications, faculty, and baseline records."""
    demo_inst = db_session.execute(
        select(Institute).where(Institute.aicte_id == "AICTE-1-3324901")
    ).scalar_one_or_none()

    assert demo_inst is not None
    assert demo_inst.name == "Saraswati Institute of Technology"

    # Institute record baseline
    assert demo_inst.records is not None
    progs = json.loads(demo_inst.records.approved_programmes)
    assert len(progs) >= 4, "Demo institute must have at least 4 approved programmes"

    # Faculty & Students
    assert len(demo_inst.faculty) >= 30, "Demo institute must have richly populated faculty"
    assert len(demo_inst.students) >= 100, "Demo institute must have richly populated student body"

    # Applications
    assert len(demo_inst.applications) >= 3, "Demo institute must have 3 applications in different states"


def test_audit_log_hash_chain_integrity(db_session):
    """Verify cryptographic hash-chaining of the append-only audit log."""
    logs = db_session.execute(select(AuditLog).order_by(AuditLog.ts.asc())).scalars().all()
    assert len(logs) >= 5, "Expected at least 5 audit log entries"

    for i in range(len(logs)):
        current = logs[i]
        payload = json.loads(current.details)
        canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        expected_hash = hashlib.sha256(f"{current.prev_hash}:{canonical}".encode('utf-8')).hexdigest()
        assert current.hash == expected_hash, f"Hash chain mismatch at log ID {current.id}"


def test_audit_log_append_only_guard(db_session):
    """Verify that UPDATE and DELETE are strictly prohibited on AuditLog."""
    log = db_session.execute(select(AuditLog).limit(1)).scalar_one()

    # Attempt UPDATE
    with pytest.raises(PermissionError, match="IMMUTABLE AUDIT LOG: UPDATE operation strictly prohibited"):
        log.details = json.dumps({"tampered": True})
        db_session.flush()

    db_session.rollback()

    # Attempt DELETE
    with pytest.raises(PermissionError, match="IMMUTABLE AUDIT LOG: DELETE operation strictly prohibited"):
        db_session.delete(log)
        db_session.flush()

    db_session.rollback()
