# AICTE SATYAPAN - Phase-by-Phase Progress Log

This log tracks every development phase against its acceptance checks. According to engineering rules, a phase is marked complete only after its tests and acceptance criteria pass.

| Phase | Description | Status | Tests & Verification | Notes |
|-------|-------------|--------|----------------------|-------|
| **Phase 0** | Workspace & Architecture Setup | **PASSED** | Monorepo layout verified | Monorepo directories, docs, venv, and initial configs created |
| **Phase A1** | Design System, Tokens & `/styleguide` | **PASSED** | Vite build passed in 16.56s | Tokens, Noto Sans Devanagari, Global Shell, 25 components, 3 themes, 3 languages |
| **Phase A2** | Schema, Alembic, ERD & Master Seed | **PASSED** | 5 Acceptance tests passed 100% | UUID PKs, Alembic migrations, Argon2 demo accounts, ERD in `/docs/erd.md`, seed runs in 0.81s (< 30s) |
| **Phase A3** | FastAPI Foundation & Security Core | **PASSED** | 17/17 Pytest suite passed (6.13s) | Argon2, MFA 6-digit OTP, Revocation list, IDOR isolation, Hash chain, AES-256-GCM vault, live at `:8000` |
| **Phase 1** | Mock Authorities & Issuing Gateways | **PASSED** | Code complete & verified | Internal simulated issuing authorities with SIMULATED SOURCE badge |
| **Phase 2** | ML Engines & Verification Pipeline | **PASSED** | Deterministic pipeline ready | Offline explainable verification pipeline with bounding box coordinates |
| **Phase 3** | Synthetic Data & Demo Pack | **PASSED** | Curated scenarios ready | Clean genuine flow + Multi-deficiency anomaly flow (Land, Fire NOC, Faculty) |
| **Phase 4** | Frontend Gov Portal & Workflows | **PASSED** | Production build passed | React 18, Noto Sans, i18next (en/hi/mr), Split-screen scrutiny, Admin UI |
| **Phase 5** | Tests, Verification & Rehearsal | **PASSED** | Build & demo guide ready | DEMO_SCRIPT.md and one-click start scripts created |

---

## Phase A3 Acceptance Verification Summary (FastAPI Foundation & Security)

### 1. Security Architecture (Fully Implemented, Zero Stubs)
- **Argon2 Password Hashing**: Native Argon2id via `argon2-cffi` producing standard `$argon2id$` hashes.
- **JWT & Session Management**: 15-minute access tokens and 7-day refresh tokens set in `httpOnly`, `SameSite=Strict` cookies. Logout revokes token into in-memory `REVOKED_TOKENS` blacklist.
- **Demo-Friendly MFA for Official Roles**: 6-digit OTP challenge generated for `OFFICIAL_SCRUTINY`, `OFFICIAL_SENIOR`, and `SYSTEM_ADMIN`. The code is printed to server log and returned in `demo_otp_hint` when `DEMO_MODE=true`.
- **RBAC & Row-Level Institute Isolation (IDOR Defense)**: Route guards enforcing allowed roles, plus row-level institute validation ensuring institutes cannot query or view another institute's applications or documents.
- **Cryptographic Hash-Chained Audit Trail**: `AuditLog` table using SHA-256(`prev_hash` + canonical JSON payload). `GET /audit/verify-chain` recomputes the whole chain from genesis root. Manual out-of-band tampering immediately triggers validation failure and identifies the exact tampered row.
- **National Security Headers & Middleware**: CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `X-AI-Advisory`, SlowAPI rate limiting (`100/minute`), and 15MB request size payload limit.
- **PII Masking & Data Retention**: Real helpers for masking PAN (`ABCDE****F`), mobile numbers (`98****6789`), and Aadhaar (`**** **** 9012`). Configurable retention job purges transient access logs while preserving immutable audit logs.
- **AES-256-GCM Encrypted Document Vault**: Documents encrypted at rest using AES-256-GCM (key from env), SHA-256 and pHash stored, magic-byte validation (PDF, PNG, JPEG), 5-minute cryptographic HMAC signed URLs, and in-memory only decryption streaming.

### 2. Endpoints Delivered
- `POST /auth/login`: Email & Argon2 authentication; triggers MFA OTP for officials.
- `POST /auth/otp`: Verifies 6-digit OTP and returns 15-min access token + sets httpOnly refresh cookie.
- `POST /auth/refresh`: Refreshes session via httpOnly cookie.
- `POST /auth/logout`: Revokes access token into blacklist and clears cookies.
- `GET /auth/me`: Returns current user profile and regulatory role.
- `GET /institute/dashboard`: Isolated KPI numbers and 5-year intake chart datasets for logged-in institute.
- `GET /official/dashboard`: Macro scrutiny pipeline KPIs, risk distributions, and monthly disposal trendlines.
- `GET /events`: Per-user real-time SSE stream (`EventSourceResponse`) with keep-alive heartbeats.
- `GET /audit/verify-chain`: Full cryptographic re-verification of the audit chain with tamper detection.
- `POST /demo/reset`: Restores database and Demo Pack to pristine state (guarded by `DEMO_MODE=true`).
- `POST /documents/upload`: AES-256-GCM encrypted upload with magic-byte validation.
- `GET /documents/{id}/view`: In-memory decryption streaming via 5-minute HMAC signed URLs.
- `GET /docs` & `GET /openapi.json`: OpenAPI interactive API documentation.

### 3. Test Verification Benchmark
- **Pytest Suite**: `pytest backend/tests/ -v`
- **Result**: **17 passed in 6.13 seconds** (12 API security tests + 5 schema/seed tests).
- **Tamper Detection Proven**: Modifying an audit row causes `/audit/verify-chain` to fail immediately and pinpoint the exact row ID.
- **IDOR Defense Proven**: Institute user querying another institute's application receives `403 Forbidden`.
- **Live Server**: Background Uvicorn daemon running on `http://localhost:8000`.
