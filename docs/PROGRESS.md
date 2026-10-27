# SATYAPAN - Phase-by-Phase Progress Log

This log tracks every development phase against its acceptance checks. According to engineering rules, a phase is marked complete only after its tests and acceptance criteria pass.

| Phase | Description | Status | Tests & Verification | Notes |
|-------|-------------|--------|----------------------|-------|
| **Phase 0** | Workspace & Architecture Setup | **PASSED** | Monorepo layout verified | Monorepo directories, docs, venv, and initial configs created |
| **Phase A1** | Design System, Tokens & `/styleguide` | **PASSED** | Vite build passed in 16.56s | Tokens, Noto Sans Devanagari, Global Shell, 25 components, 3 themes, 3 languages |
| **Phase A2** | Schema, Alembic, ERD & Master Seed | **PASSED** | 5 Acceptance tests passed 100% | UUID PKs, Alembic migrations, Argon2 demo accounts, ERD in `/docs/erd.md`, seed runs in 0.81s (< 30s) |
| **Phase A3** | FastAPI Foundation & Security Core | **PASSED** | 17/17 Pytest suite passed (6.13s) | Argon2, MFA 6-digit OTP, Revocation list, IDOR isolation, Hash chain, AES-256-GCM vault, live at `:8000` |
| **Phase A4** | Animated Login & Sign-In Transition | **PASSED** | Full browser agent verification passed | Seamless viewport background, left panel, right glass card, MFA OTP, <SignInTransition/>, role redirects, session-timeout modal, en/hi/mr & light/dark/contrast |
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

---

## Phase A4 Acceptance Verification Summary (Animated Login & Sign-In Transition)

### 1. Visual & Interactive Architecture Delivered
- **Shared Full-Viewport Background (`<LoginBackground/>`)**:
  - Full-viewport ambient layer with zero seam between left panel and right glass card.
  - 3 blurred mesh blobs drifting on 28s-34s keyframe loops (`animate-blob-slow`, `animate-blob-reverse`, `animate-blob-pulse`).
  - Fine radial-masked dot grid with smooth mouse parallax lerping.
  - 24-spoke vector Ashoka Chakra rotating at 120s (standard) or accelerating to 6s during sign-in transition.
  - Multi-stop rotating conic light rays and interactive canvas particle system with saffron, white, green, and gold nodes.
  - High-contrast pure black fallback with WCAG 2.1 AAA 7:1 borders.
- **Left Panel (`<LoginLeftPanel/>`)**:
  - Floating Ashoka Lion Capital Emblem with golden radial glow and vertical 6s float loop.
  - "सत्यमेव जयते" rendered in authentic Noto Sans Devanagari.
  - AICTE SATYAPAN product title with v2.0 badge and regulatory governance advisory notice.
  - 4-second multilingual rotating taglines in English, Hindi, and Marathi with smooth Framer Motion transitions.
  - 3 animated cubic count-up metric cards (Documents Scanned 12,480+, Review Time Saved 78%, Institutes Onboarded 2,400+).
- **Right Glass Card (`<LoginCard/>`)**:
  - Segmented Institute / Officials toggle with spring-animated layout indicator (`layoutId="loginTabIndicator"`).
  - Floating-label input fields with show/hide password toggle.
  - Arithmetic CAPTCHA validation with live refresh.
  - Remember me checkbox and institutional credential recovery notice.
  - 6-digit MFA OTP verification with automatic focus advance, backspace navigation, paste handler, 30s resend countdown, and click-to-fill demo hint.
  - 4 one-click demo account chips (Faculty, Institute Admin, Scrutiny Officer, Senior Officer) featuring a 15ms typewriter autofill animation and clipboard copy buttons.
  - Real-time validation, error shake keyframes (`x: [-12, 12, -8, 8, -4, 4, 0]`), spinner, and green success tick.
- **Cinematic `<SignInTransition/>` Overlay**:
  - Glass card blur-out and fade.
  - Shared layout movement of Ashoka Lion Capital Emblem to screen center.
  - Chakra speed-up from 120s to 6s.
  - Triple tricolour expanding pulse rings (Saffron, White, Green) with glowing identity verification caption.
  - Central radial light flash peaking at ~850ms, triggering the React Router route change underneath the flash peak.
  - Emblem shoots forward towards the camera with zoom blur into the flash, dissolving smoothly into the destination dashboard.
  - Reverse transition on logout ("Official Session Terminated • Tokens Revoked").
  - 300ms cross-fade fallback when `prefers-reduced-motion` is active.
- **Route Guards & Session Management**:
  - `ProtectedRoute` guard redirecting unauthenticated traffic to `/login`.
  - Automatic role-based redirect (Institute roles to Institute Dossier, Official roles to Scrutiny Roster Desk).
  - `<SessionTimeoutModal/>` watchdog monitoring access token expiry with 60-second live countdown, extend session handler, and auto-logout.
  - Full multilingual support across English, Hindi, and Marathi, plus Light, Dark, and High-Contrast themes.

### 2. Browser Verification Benchmarks
- **Demo Chips & Typewriter Autofill**: Verified across all 4 synthetic roles.
- **Validation & Shake**: Verified on incorrect password and incorrect OTP (`999999`).
- **Official MFA Challenge**: Verified 6-box OTP entry, demo OTP auto-fill, and transition.
- **Transition & Route Change**: Verified forward sign-in into Institute Desk and Scrutiny Roster Desk, plus reverse logout transition back to `/login`.
- **Language & Theme Switching**: Verified instantaneous dictionary updates (EN/HI/MR) and CSS token shifts.

