"""
AICTE SATYAPAN - Core Database Schema (SQLAlchemy 2)
PostgreSQL and SQLite compatible.
- UUID primary keys (String(36) for cross-db compatibility)
- created_at and updated_at on EVERY table
- Indexes on: institute_id, application_id, status, risk_score, findings(severity, status)
- Hash-chained append-only AuditLog
"""
import uuid
import json
import hashlib
from datetime import datetime
from enum import Enum
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, DateTime, Date, ForeignKey, Index, Enum as SQLEnum, event
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()


def generate_uuid() -> str:
    return str(uuid.uuid4())


# Enums
class UserRole(str, Enum):
    INSTITUTE_FACULTY = "INSTITUTE_FACULTY"
    INSTITUTE_ADMIN = "INSTITUTE_ADMIN"
    OFFICIAL_SCRUTINY = "OFFICIAL_SCRUTINY"
    OFFICIAL_SENIOR = "OFFICIAL_SENIOR"
    SYSTEM_ADMIN = "SYSTEM_ADMIN"


class ApplicationStatus(str, Enum):
    DRAFT = "DRAFT"
    SUBMITTED = "SUBMITTED"
    AUTO_VALIDATED = "AUTO_VALIDATED"
    UNDER_SCRUTINY = "UNDER_SCRUTINY"
    DEFICIENCY_RAISED = "DEFICIENCY_RAISED"
    CLARIFICATION_SUBMITTED = "CLARIFICATION_SUBMITTED"
    INSPECTION_RECOMMENDED = "INSPECTION_RECOMMENDED"
    AWAITING_SENIOR_CONFIRMATION = "AWAITING_SENIOR_CONFIRMATION"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class FindingSeverity(str, Enum):
    INFO = "INFO"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"


class FindingType(str, Enum):
    MISSING = "MISSING"
    INCOMPLETE = "INCOMPLETE"
    EXPIRED = "EXPIRED"
    INCONSISTENT = "INCONSISTENT"
    TAMPER_SUSPECTED = "TAMPER_SUSPECTED"
    DUPLICATE = "DUPLICATE"
    MISMATCH_ID = "MISMATCH_ID"
    INFRA_GAP = "INFRA_GAP"
    SIGNATURE_INVALID = "SIGNATURE_INVALID"


class FindingStatus(str, Enum):
    OPEN = "OPEN"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"
    DISMISSED_BY_OFFICIAL = "DISMISSED_BY_OFFICIAL"


class VerificationStatus(str, Enum):
    VERIFIED = "VERIFIED"
    MISMATCH_DETECTED = "MISMATCH_DETECTED"
    EXPIRED = "EXPIRED"
    VERIFICATION_PENDING = "VERIFICATION_PENDING"
    SOURCE_UNAVAILABLE = "SOURCE_UNAVAILABLE"
    MANUAL_REVIEW_REQUIRED = "MANUAL_REVIEW_REQUIRED"


# ==============================================================================
# AUTH AND ORGANISATIONS
# ==============================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False) # Argon2
    role = Column(SQLEnum(UserRole), nullable=False)
    institute_id = Column(String(36), ForeignKey("institutes.id"), nullable=True, index=True)
    designation = Column(String(255), nullable=True)
    mfa_enabled = Column(Boolean, default=False)
    last_login = Column(DateTime, nullable=True)
    is_active = Column(Boolean, default=True)
    preferred_language = Column(String(10), default="en")
    
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institute = relationship("Institute", back_populates="users")
    notifications = relationship("Notification", back_populates="user")


class Institute(Base):
    __tablename__ = "institutes"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    aicte_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    type = Column(String(100), nullable=False)
    state = Column(String(100), nullable=False)
    district = Column(String(100), nullable=False)
    lat = Column(Float, nullable=True)
    lng = Column(Float, nullable=True)
    established_year = Column(Integer, nullable=False)
    trust_name = Column(String(255), nullable=False)
    principal_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=False)
    status = Column(String(50), default="ACTIVE")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    users = relationship("User", back_populates="institute")
    records = relationship("InstituteRecord", back_populates="institute", uselist=False)
    applications = relationship("Application", back_populates="institute")
    faculty = relationship("Faculty", back_populates="institute")
    students = relationship("Student", back_populates="institute")


class InstituteRecord(Base):
    __tablename__ = "institute_records"
    # Simulates 'authorised AICTE systems'; read-only to institutes

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id"), nullable=False, unique=True, index=True)
    approved_programmes = Column(Text, nullable=False) # JSON
    approved_intake = Column(Text, nullable=False) # JSON
    previous_eoa = Column(Text, nullable=False) # JSON
    accreditation = Column(Text, nullable=False) # JSON
    deficiency_status = Column(String(50), default="NO_DEFICIENCY")
    ter_payment_status = Column(String(50), default="PAID")
    faculty_count = Column(Integer, default=0)
    built_up_area_sqm = Column(Float, default=0.0)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institute = relationship("Institute", back_populates="records")


# ==============================================================================
# CORE
# ==============================================================================

class ApplicationCategory(Base):
    __tablename__ = "application_categories"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    code = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    checklist_json = Column(Text, nullable=False)
    rules_json = Column(Text, nullable=False)
    version = Column(Integer, default=1)
    is_active = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    applications = relationship("Application", back_populates="category")


class Application(Base):
    __tablename__ = "applications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_no = Column(String(50), unique=True, index=True, nullable=False)
    institute_id = Column(String(36), ForeignKey("institutes.id"), nullable=False, index=True)
    category_id = Column(String(36), ForeignKey("application_categories.id"), nullable=False)
    academic_year = Column(String(20), default="2026-2027")
    status = Column(SQLEnum(ApplicationStatus), default=ApplicationStatus.DRAFT, index=True)
    readiness_score = Column(Float, default=0.0)
    risk_score = Column(Float, default=0.0, index=True)
    risk_band = Column(String(20), default="LOW")
    assigned_official_id = Column(String(36), ForeignKey("users.id"), nullable=True)
    sla_due_at = Column(DateTime, nullable=True)
    submitted_at = Column(DateTime, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institute = relationship("Institute", back_populates="applications")
    category = relationship("ApplicationCategory", back_populates="applications")
    documents = relationship("Document", back_populates="application")
    students = relationship("Student", back_populates="application")
    validation_runs = relationship("ValidationRun", back_populates="application")
    findings = relationship("Finding", back_populates="application")
    deficiencies = relationship("Deficiency", back_populates="application")
    official_actions = relationship("OfficialAction", back_populates="application")
    infra_evidences = relationship("InfraEvidence", back_populates="application")


class Faculty(Base):
    __tablename__ = "faculty"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    designation = Column(String(100), nullable=False)
    qualification = Column(String(100), nullable=False)
    department = Column(String(100), nullable=False)
    pan_masked = Column(String(20), nullable=False)
    employment_type = Column(String(50), default="REGULAR")
    joining_date = Column(Date, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institute = relationship("Institute", back_populates="faculty")


class Student(Base):
    __tablename__ = "students"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    institute_id = Column(String(36), ForeignKey("institutes.id"), nullable=False, index=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=True, index=True)
    enrolment_no = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    programme = Column(String(100), nullable=False)
    year = Column(Integer, nullable=False)
    category = Column(String(50), default="GENERAL")
    gender = Column(String(20), nullable=False)
    dob = Column(Date, nullable=False)
    email = Column(String(255), nullable=False)
    mobile_masked = Column(String(20), nullable=False)
    status = Column(String(50), default="ENROLLED")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    institute = relationship("Institute", back_populates="students")
    application = relationship("Application", back_populates="students")


class Document(Base):
    __tablename__ = "documents"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=True)
    doc_type = Column(String(100), nullable=False)
    original_filename = Column(String(255), nullable=False)
    storage_path_encrypted = Column(String(500), nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    phash = Column(String(64), nullable=True)
    mime = Column(String(100), default="application/pdf")
    size = Column(Integer, nullable=False)
    uploaded_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    version = Column(Integer, default=1)
    classification_label = Column(String(100), nullable=True)
    classification_confidence = Column(Float, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="documents")
    ocr_result = relationship("OCRResult", back_populates="document", uselist=False)
    tamper_report = relationship("TamperReport", back_populates="document", uselist=False)
    signature_check = relationship("SignatureCheck", back_populates="document", uselist=False)
    verifications = relationship("Verification", back_populates="document")
    findings = relationship("Finding", back_populates="document")


# ==============================================================================
# AI AND VALIDATION
# ==============================================================================

class OCRResult(Base):
    __tablename__ = "ocr_results"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, unique=True, index=True)
    full_text = Column(Text, nullable=False)
    fields_json = Column(Text, nullable=False) # JSON
    boxes_json = Column(Text, nullable=False) # JSON
    engine = Column(String(50), default="Tesseract")
    mean_confidence = Column(Float, default=0.95)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="ocr_result")


class ValidationRun(Base):
    __tablename__ = "validation_runs"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    started_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    finished_at = Column(DateTime, nullable=True)
    rules_version = Column(Integer, default=1)
    summary_json = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="validation_runs")
    findings = relationship("Finding", back_populates="validation_run")


class Finding(Base):
    __tablename__ = "findings"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    validation_run_id = Column(String(36), ForeignKey("validation_runs.id"), nullable=True)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    student_id = Column(String(36), ForeignKey("students.id"), nullable=True)
    severity = Column(SQLEnum(FindingSeverity), nullable=False)
    type = Column(SQLEnum(FindingType), nullable=False)
    title = Column(String(255), nullable=False)
    reason = Column(Text, nullable=False)
    evidence_json = Column(Text, nullable=False) # JSON
    confidence = Column(Float, default=0.95)
    source = Column(String(100), default="RULE_ENGINE")
    status = Column(SQLEnum(FindingStatus), default=FindingStatus.OPEN)
    resolved_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    resolved_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Index on (severity, status) as explicitly requested
    __table_args__ = (
        Index("idx_findings_severity_status", "severity", "status"),
    )

    application = relationship("Application", back_populates="findings")
    document = relationship("Document", back_populates="findings")
    validation_run = relationship("ValidationRun", back_populates="findings")


class TamperReport(Base):
    __tablename__ = "tamper_reports"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, unique=True, index=True)
    ela_score = Column(Float, default=0.0)
    noise_score = Column(Float, default=0.0)
    copy_move_score = Column(Float, default=0.0)
    metadata_flags = Column(Text, default="{}") # JSON
    heatmap_path = Column(String(500), nullable=True)
    overall_suspicion = Column(Float, default=0.0)
    explanation = Column(Text, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="tamper_report")


class SignatureCheck(Base):
    __tablename__ = "signature_checks"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, unique=True, index=True)
    qr_payload = Column(Text, nullable=True)
    qr_valid = Column(Boolean, nullable=True)
    digital_sig_present = Column(Boolean, default=False)
    digital_sig_valid = Column(Boolean, default=False)
    signer_name = Column(String(255), nullable=True)
    signer_designation = Column(String(255), nullable=True)
    signer_org = Column(String(255), nullable=True)
    cert_valid_from = Column(DateTime, nullable=True)
    cert_valid_to = Column(DateTime, nullable=True)
    signer_trusted = Column(Boolean, default=False)
    seal_detected = Column(Boolean, default=False)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="signature_check")


class Verification(Base):
    __tablename__ = "verifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    authority_code = Column(String(50), nullable=False)
    reference_no = Column(String(100), nullable=False)
    request_json = Column(Text, default="{}")
    response_json = Column(Text, default="{}")
    status = Column(SQLEnum(VerificationStatus), nullable=False)
    source_name = Column(String(100), nullable=False)
    is_simulated = Column(Boolean, default=True)
    checked_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    latency_ms = Column(Integer, default=120)
    checked_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    document = relationship("Document", back_populates="verifications")


class InfraEvidence(Base):
    __tablename__ = "infra_evidence"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=True)
    evidence_type = Column(String(100), nullable=False)
    cv_labels = Column(Text, default="[]") # JSON
    area_estimate = Column(Float, nullable=True)
    requirement_key = Column(String(100), nullable=False)
    meets_requirement = Column(Boolean, default=True)
    needs_inspection = Column(Boolean, default=False)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="infra_evidences")


# ==============================================================================
# WORKFLOW AND GOVERNANCE
# ==============================================================================

class Deficiency(Base):
    __tablename__ = "deficiencies"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    finding_id = Column(String(36), ForeignKey("findings.id"), nullable=True)
    raised_by = Column(String(36), ForeignKey("users.id"), nullable=False)
    message = Column(Text, nullable=False)
    due_date = Column(DateTime, nullable=False)
    status = Column(String(50), default="OPEN")

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="deficiencies")


class OfficialAction(Base):
    __tablename__ = "official_actions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    application_id = Column(String(36), ForeignKey("applications.id"), nullable=False, index=True)
    official_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    remarks = Column(Text, nullable=False)
    needs_senior_confirmation = Column(Boolean, default=False)
    confirmed_by = Column(String(36), ForeignKey("users.id"), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    application = relationship("Application", back_populates="official_actions")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    title = Column(String(255), nullable=False)
    body = Column(Text, nullable=False)
    level = Column(String(50), default="INFO")
    is_read = Column(Boolean, default=False)
    link = Column(String(255), nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_log"
    # HASH-CHAINED: hash = SHA256(prev_hash + canonical payload).
    # Append-only: ORM guard blocks UPDATE and DELETE.

    id = Column(String(36), primary_key=True, default=generate_uuid)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)
    actor_id = Column(String(36), nullable=True)
    actor_role = Column(String(50), nullable=False)
    action = Column(String(100), nullable=False)
    entity = Column(String(100), nullable=False)
    entity_id = Column(String(100), nullable=False)
    details = Column(Text, default="{}") # JSON
    ip = Column(String(50), nullable=True)
    prev_hash = Column(String(64), nullable=True)
    hash = Column(String(64), nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


# Append-only guard on AuditLog
@event.listens_for(AuditLog, 'before_update')
def block_audit_log_update(mapper, connection, target):
    raise PermissionError("IMMUTABLE AUDIT LOG: UPDATE operation strictly prohibited on audit_log.")


@event.listens_for(AuditLog, 'before_delete')
def block_audit_log_delete(mapper, connection, target):
    raise PermissionError("IMMUTABLE AUDIT LOG: DELETE operation strictly prohibited on audit_log.")


class DataAccessLog(Base):
    __tablename__ = "data_access_log"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    document_id = Column(String(36), ForeignKey("documents.id"), nullable=False, index=True)
    purpose = Column(String(255), nullable=False)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class ConfigVersion(Base):
    __tablename__ = "config_versions"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    key = Column(String(100), index=True, nullable=False)
    value_json = Column(Text, nullable=False)
    changed_by = Column(String(36), ForeignKey("users.id"), nullable=True)
    ts = Column(DateTime, default=datetime.utcnow, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)


class EvaluationMetric(Base):
    __tablename__ = "evaluation_metrics"

    id = Column(String(36), primary_key=True, default=generate_uuid)
    run_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    metric = Column(String(100), nullable=False)
    value = Column(Float, nullable=False)
    dataset = Column(String(100), nullable=False)
    note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
