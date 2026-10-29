# AICTE SATYAPAN - Security Hardening & Penetration Testing Report

## Executive Summary
This document records the defense-in-depth security architecture, automated hardening checks, and penetration testing results for **AICTE SATYAPAN (Grand Finals Edition)**. SATYAPAN processes sensitive statutory institutional records and enforces zero-trust regulatory isolation between technical institutes and AICTE scrutiny officials.

---

## 1. Security Benchmark Results Matrix

| Security Domain | Defense Mechanism | Automated Test Case | Status | Proof / Evidence |
|:---|:---|:---|:---:|:---|
| **Authentication** | Native Argon2id password hashing + 6-digit MFA OTP for officials | `test_argon2_password_hashing` & `test_official_mfa_login_and_otp` | **PASSED** | Passwords hashed with standard `$argon2id$`; OTP challenge required for all officials |
| **Session Control** | 15-minute JWT access tokens + 7-day httpOnly SameSite=Strict refresh cookie + token blacklist | `test_refresh_token_endpoint` & `test_logout_and_revocation_blacklist` | **PASSED** | Immediate token blacklisting upon logout; zero access via revoked JWTs |
| **RBAC Route Guards** | Role-based FastAPI dependency injection (`OFFICIAL_SCRUTINY`, `OFFICIAL_SENIOR`, `SYSTEM_ADMIN`) | `test_rbac_official_route_guards` | **PASSED** | Institute persona requesting official scrutiny queue receives `403 Forbidden` |
| **IDOR Tenancy Defense** | Row-level institute ownership verification (`verify_institute_access`) | `test_idor_protection_institute_isolation` | **PASSED** | Institute A requesting Institute B application/documents receives `403 Forbidden` |
| **Audit Ledger Integrity** | SHA-256 cryptographic hash-chained audit log with genesis root linkage | `test_audit_hash_chain_tamper_and_repair` | **PASSED** | Out-of-band tampering of details breaks chain; `/audit/verify-chain` pinpoints exact row ID |
| **Vault Encryption** | AES-256-GCM file encryption at rest with HMAC signed ephemeral URLs (5 min) | `test_aes_storage_vault_and_signed_urls` | **PASSED** | Files encrypted on disk; memory-only decryption streaming; tampered ciphertext rejected |
| **File Upload Defense** | Magic-byte file signature validation (PDF, PNG, JPEG) & 15MB request size ceiling | `test_malicious_upload_rejection` | **PASSED** | Spoofed extensions (e.g. `.exe` renamed to `.pdf`) rejected by magic-bytes analyzer |
| **DoS Rate Limiting** | SlowAPI IP-based rate limiting (100 req/min default, 30 req/min auth endpoints) | `test_rate_limiter_protection` | **PASSED** | Excess bursts receive `429 Too Many Requests` with Retry-After header |
| **Two-Person Rule** | Mandatory dual-authorization for adverse statutory actions (Reject, Deficiency, Inspection) | `test_two_person_rule_decision_lifecycle` | **PASSED** | Adverse decisions placed in `AWAITING_SENIOR_CONFIRMATION` until senior officer signs |
| **Privacy by Design** | DPDP Act 2023 purpose-bound document access & masked PII with logged reveal | `test_acknowledgement_verification_and_pii_privacy` | **PASSED** | PII masked by default (`ABCDE****F`); reveal creates immutable audit event with purpose |

---

## 2. Detailed Threat Analysis & Penetration Checks

### 2.1 Role-Based Access Control (RBAC) Bypass Attempts
- **Threat Vector**: Malicious institute principal crafts HTTP requests to `/official/queue` or `/official/applications/1/decision` using valid institute credentials.
- **Defense Implementation**: Endpoints mandate `Depends(get_current_user)` and assert `current_user.role in [UserRole.OFFICIAL_SCRUTINY, UserRole.OFFICIAL_SENIOR, UserRole.SYSTEM_ADMIN]`.
- **Test Result**: Returned `403 Forbidden: Insufficient regulatory authority.`

### 2.2 Insecure Direct Object References (IDOR)
- **Threat Vector**: Institute user `inst-pune-402` changes URL parameter to `inst-nashik-108` to access competitor faculty salaries, land title deeds, and deficiency letters.
- **Defense Implementation**: `verify_institute_access(current_user, target_institute_id)` strictly validates that the requesting user's `institute_id` matches the target entity's `institute_id`.
- **Test Result**: Returned `403 Forbidden: Tenancy violation: You do not have regulatory authorization for this institute.`

### 2.3 Cryptographic Audit Trail Tamper Simulation
- **Threat Vector**: Database administrator or insider modifies a finding in `audit_log` from `DEFICIENCY_RAISED` to `APPROVED` using raw SQL.
- **Defense Implementation**:
  $$\text{Hash}_i = \text{SHA-256}\Big(\text{Hash}_{i-1} \,\|\, \text{CanonicalJSON}(\text{Details}_i)\Big)$$
- **Test Result**: Triggering `/demo/tamper-audit-row` broke the cryptographic linkage at index 24; `/audit/verify-chain` immediately returned `is_valid: False` and highlighted the exact corrupted row ID (`04b0e8f3-...`).

### 2.4 Malicious File Upload & Magic-Byte Validation
- **Threat Vector**: Attacker uploads an executable or PHP script disguised as `fire_noc.pdf` by changing the file extension.
- **Defense Implementation**: `validate_file_magic_bytes` reads the initial 8 bytes of the binary buffer:
  - PDF: `%PDF-` (`0x25 0x50 0x44 0x46`)
  - PNG: `\x89PNG\r\n\x1a\n`
  - JPEG: `\xff\xd8\xff`
- **Test Result**: Binary payloads with mismatched headers throw `ValueError: Invalid document file format` and are never written to disk or sent to the OCR pipeline.

### 2.5 National Security Headers
All HTTP responses from FastAPI include:
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:;`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY` (prevents clickjacking)
- `X-Content-Type-Options: nosniff` (prevents MIME sniffing)
- `X-AI-Advisory: AI-ASSISTED-DECISION-SUPPORT-STRICTLY-ADVISORY` (Principle 1 enforcement)

---

## 3. Compliance Summary
- **Indian National DPDP Act 2023**: Fully compliant through purpose-bound access tokens, masked PII by default, and dynamic officer watermarking.
- **AICTE Regulatory Handbook (APH 2026-27)**: Fully compliant through two-person senior review, immutable audit ledger, and statutory advisory disclaimers.
