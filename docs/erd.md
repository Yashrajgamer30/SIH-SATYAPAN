# AICTE SATYAPAN - Entity Relationship Diagram (ERD)

This document details the complete relational data model for the AICTE SATYAPAN platform with UUID primary keys, automated audit triggers, hash-chained logging, and indexing.

```mermaid
erDiagram
    INSTITUTES ||--o{ USERS : "employs"
    INSTITUTES ||--o{ INSTITUTE_RECORDS : "has verified baseline"
    INSTITUTES ||--o{ APPLICATIONS : "submits"
    INSTITUTES ||--o{ FACULTY : "employs"
    INSTITUTES ||--o{ STUDENTS : "enrolls"

    APPLICATION_CATEGORIES ||--o{ APPLICATIONS : "governs"
    APPLICATIONS ||--o{ DOCUMENTS : "attaches"
    APPLICATIONS ||--o{ STUDENTS : "includes in intake"
    APPLICATIONS ||--o{ VALIDATION_RUNS : "evaluated in"
    APPLICATIONS ||--o{ FINDINGS : "flagged on"
    APPLICATIONS ||--o{ DEFICIENCIES : "issued against"
    APPLICATIONS ||--o{ OFFICIAL_ACTIONS : "decided via"
    APPLICATIONS ||--o{ INFRA_EVIDENCE : "contains"

    DOCUMENTS ||--o{ OCR_RESULTS : "extracted via"
    DOCUMENTS ||--o{ TAMPER_REPORTS : "analyzed by"
    DOCUMENTS ||--o{ SIGNATURE_CHECKS : "cryptographically checked"
    DOCUMENTS ||--o{ VERIFICATIONS : "cross-checked"
    DOCUMENTS ||--o{ FINDINGS : "associated with"
    DOCUMENTS ||--o{ DATA_ACCESS_LOG : "audited access"

    VALIDATION_RUNS ||--o{ FINDINGS : "generates"
    FINDINGS ||--o{ DEFICIENCIES : "triggers"

    USERS ||--o{ OFFICIAL_ACTIONS : "performs"
    USERS ||--o{ NOTIFICATIONS : "receives"
    USERS ||--o{ DATA_ACCESS_LOG : "reads documents"
    USERS ||--o{ CONFIG_VERSIONS : "modifies"

    INSTITUTES {
        string id PK "UUID"
        string aicte_id UK
        string name
        string type
        string state
        string district
        float lat
        float lng
        int established_year
        string trust_name
        string principal_name
        string email
        string phone
        string status
        datetime created_at
        datetime updated_at
    }

    USERS {
        string id PK "UUID"
        string name
        string email UK
        string password_hash "argon2"
        string role "UserRole enum"
        string institute_id FK
        string designation
        boolean mfa_enabled
        datetime last_login
        boolean is_active
        string preferred_language
        datetime created_at
        datetime updated_at
    }

    INSTITUTE_RECORDS {
        string id PK "UUID"
        string institute_id FK
        text approved_programmes "JSON"
        text approved_intake "JSON"
        text previous_eoa "JSON"
        text accreditation "JSON"
        string deficiency_status
        string ter_payment_status
        int faculty_count
        float built_up_area_sqm
        datetime created_at
        datetime updated_at
    }

    APPLICATION_CATEGORIES {
        string id PK "UUID"
        string code UK
        string name
        text checklist_json "JSON"
        text rules_json "JSON"
        int version
        boolean is_active
        datetime created_at
        datetime updated_at
    }

    APPLICATIONS {
        string id PK "UUID"
        string application_no UK
        string institute_id FK "Indexed"
        string category_id FK
        string academic_year
        string status "Indexed"
        float readiness_score
        float risk_score "Indexed"
        string risk_band
        string assigned_official_id FK
        datetime sla_due_at
        datetime submitted_at
        datetime created_at
        datetime updated_at
    }

    FACULTY {
        string id PK "UUID"
        string institute_id FK "Indexed"
        string name
        string designation
        string qualification
        string department
        string pan_masked
        string employment_type
        date joining_date
        datetime created_at
        datetime updated_at
    }

    STUDENTS {
        string id PK "UUID"
        string institute_id FK "Indexed"
        string application_id FK "Indexed"
        string enrolment_no
        string name
        string programme
        int year
        string category
        string gender
        date dob
        string email
        string mobile_masked
        string status
        datetime created_at
        datetime updated_at
    }

    DOCUMENTS {
        string id PK "UUID"
        string application_id FK "Indexed"
        string student_id FK
        string doc_type
        string original_filename
        string storage_path_encrypted
        string sha256
        string phash
        string mime
        int size
        string uploaded_by FK
        datetime uploaded_at
        int version
        string classification_label
        float classification_confidence
        datetime created_at
        datetime updated_at
    }

    VALIDATION_RUNS {
        string id PK "UUID"
        string application_id FK "Indexed"
        datetime started_at
        datetime finished_at
        int rules_version
        text summary_json "JSON"
        datetime created_at
        datetime updated_at
    }

    FINDINGS {
        string id PK "UUID"
        string validation_run_id FK
        string application_id FK "Indexed"
        string document_id FK
        string student_id FK
        string severity "Indexed"
        string type
        string title
        text reason
        text evidence_json "JSON"
        float confidence
        string source
        string status "Indexed"
        string resolved_by FK
        text resolved_note
        datetime created_at
        datetime updated_at
    }

    VERIFICATIONS {
        string id PK "UUID"
        string document_id FK "Indexed"
        string authority_code
        string reference_no
        text request_json "JSON"
        text response_json "JSON"
        string status "6-value Enum"
        string source_name
        boolean is_simulated
        datetime checked_at
        int latency_ms
        string checked_by FK
        datetime created_at
        datetime updated_at
    }

    AUDIT_LOG {
        string id PK "UUID"
        datetime ts
        string actor_id
        string actor_role
        string action
        string entity
        string entity_id
        text details "JSON"
        string ip
        string prev_hash
        string hash "SHA-256 Hash Chained"
        datetime created_at
        datetime updated_at
    }
```
