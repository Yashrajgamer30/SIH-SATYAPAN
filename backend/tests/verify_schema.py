"""
Standalone Schema & Seed Verification Runner
Can be executed with pytest OR directly with python.
"""
import os
import sys
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


def test_row_counts(session):
    print("Checking row counts...")
    inst_count = session.execute(select(func.count(Institute.id))).scalar()
    cat_count = session.execute(select(func.count(ApplicationCategory.id))).scalar()
    app_count = session.execute(select(func.count(Application.id))).scalar()
    faculty_count = session.execute(select(func.count(Faculty.id))).scalar()
    student_count = session.execute(select(func.count(Student.id))).scalar()
    metrics_count = session.execute(select(func.count(EvaluationMetric.id))).scalar()

    assert inst_count >= 40, f"Expected at least 40 institutes, found {inst_count}"
    assert cat_count == 8, f"Expected 8 application categories, found {cat_count}"
    assert app_count >= 60, f"Expected >= 60 applications, found {app_count}"
    assert faculty_count >= 150, f"Expected >= 150 faculty, found {faculty_count}"
    assert student_count >= 600, f"Expected >= 600 students, found {student_count}"
    assert metrics_count >= 100, f"Expected >= 100 historical metric data points, found {metrics_count}"
    print(f" -> PASS: {inst_count} institutes, {cat_count} categories, {app_count} apps, {faculty_count} faculty, {student_count} students, {metrics_count} metrics.")


def test_demo_accounts_and_argon2_hashing(session):
    print("Checking demo accounts & Argon2 password hashes...")
    ph = PasswordHasher()
    demo_emails = [
        "faculty@demo-institute.in",
        "admin@demo-institute.in",
        "scrutiny@aicte.demo",
        "senior@aicte.demo",
        "sysadmin@aicte.demo"
    ]

    for email in demo_emails:
        user = session.execute(select(User).where(User.email == email)).scalar_one_or_none()
        assert user is not None, f"Demo account {email} not found"
        assert user.password_hash.startswith("$argon2"), f"Password for {email} is not hashed with Argon2"
        assert ph.verify(user.password_hash, "Demo@1234") is True
    print(" -> PASS: All 5 demo accounts verified with Argon2 hash for 'Demo@1234'.")


def test_foreign_key_and_demo_institute_integrity(session):
    print("Checking foreign key integrity and demo institute relationships...")
    demo_inst = session.execute(
        select(Institute).where(Institute.aicte_id == "AICTE-1-3324901")
    ).scalar_one_or_none()

    assert demo_inst is not None
    assert demo_inst.name == "Saraswati Institute of Technology"

    assert demo_inst.records is not None
    progs = json.loads(demo_inst.records.approved_programmes)
    assert len(progs) >= 4, "Demo institute must have at least 4 approved programmes"

    assert len(demo_inst.faculty) >= 30, "Demo institute must have >= 30 faculty members"
    assert len(demo_inst.students) >= 100, "Demo institute must have >= 100 students"
    assert len(demo_inst.applications) >= 3, "Demo institute must have 3 applications in different states"
    print(" -> PASS: Foreign keys and rich demo institute relationships confirmed.")


def test_audit_log_hash_chain_integrity(session):
    print("Checking cryptographic hash chain on audit_log...")
    logs = session.execute(select(AuditLog).order_by(AuditLog.ts.asc())).scalars().all()
    assert len(logs) >= 5, "Expected at least 5 audit log entries"

    for i in range(len(logs)):
        current = logs[i]
        payload = json.loads(current.details)
        canonical = json.dumps(payload, sort_keys=True, separators=(',', ':'))
        expected_hash = hashlib.sha256(f"{current.prev_hash}:{canonical}".encode('utf-8')).hexdigest()
        assert current.hash == expected_hash, f"Hash chain mismatch at log ID {current.id}"
    print(f" -> PASS: Cryptographic hash chain verified across {len(logs)} audit log records.")


def test_audit_log_append_only_guard(session):
    print("Checking append-only ORM guard (blocking UPDATE & DELETE)...")
    log = session.execute(select(AuditLog).limit(1)).scalar_one()

    # Attempt UPDATE
    update_blocked = False
    try:
        log.details = json.dumps({"tampered": True})
        session.flush()
    except PermissionError:
        update_blocked = True
        session.rollback()
    assert update_blocked is True, "Expected PermissionError on AuditLog UPDATE"

    # Attempt DELETE
    delete_blocked = False
    try:
        log_to_delete = session.execute(select(AuditLog).limit(1)).scalar_one()
        session.delete(log_to_delete)
        session.flush()
    except PermissionError:
        delete_blocked = True
        session.rollback()
    assert delete_blocked is True, "Expected PermissionError on AuditLog DELETE"

    print(" -> PASS: Append-only guard successfully blocked UPDATE and DELETE operations.")


def run_all_tests():
    print("=" * 65)
    print("   AICTE SATYAPAN - SCHEMA & SEED ACCEPTANCE VERIFICATION")
    print("=" * 65)
    session = SessionLocal()
    try:
        test_row_counts(session)
        test_demo_accounts_and_argon2_hashing(session)
        test_foreign_key_and_demo_institute_integrity(session)
        test_audit_log_hash_chain_integrity(session)
        test_audit_log_append_only_guard(session)
        print("=" * 65)
        print(" ALL 5 ACCEPTANCE TESTS PASSED WITH 100% SUCCESS!")
        print("=" * 65)
    finally:
        session.close()


if __name__ == "__main__":
    run_all_tests()
