# AICTE SATYAPAN - Project Architecture & Technical Specification

## 1. Executive Summary & Core Tenets
**AICTE SATYAPAN** is an AI-powered verification, document authentication, and regulatory compliance assistance platform for AICTE approval processing (Extension of Approval / EoA). It is built strictly under the following non-negotiable principles:
1. **Decision Support Only**: Advisory banner (`AI result is advisory`) on all screens. No automatic approval or rejection. Adverse outcomes require explicit human official action and remarks.
2. **Explainable AI**: Plain-language reasoning, evidence bounding boxes/page numbers, confidence scores, and rule/model identifiers.
3. **Configurable**: Validation rules and checklists stored in SQLite/PostgreSQL as JSON, editable via Admin UI.
4. **Role-Based Access Control**: `INSTITUTE_FACULTY`, `INSTITUTE_ADMIN`, `OFFICIAL_SCRUTINY`, `OFFICIAL_SENIOR`, `SYSTEM_ADMIN`. Strict institute data isolation.
5. **Exact Status Enum**: `VERIFIED`, `MISMATCH_DETECTED`, `EXPIRED`, `VERIFICATION_PENDING`, `SOURCE_UNAVAILABLE`, `MANUAL_REVIEW_REQUIRED`.
6. **Synthetic Data Only**: Clear `SIMULATED SOURCE` badge on simulated third-party integrations (DigiLocker, UGC, NAAC, State DTE).
7. **Demo Reliability**: `DEMO_MODE=true` deterministic response caching for grand finale live presentations.

---

## 2. Target Monorepo Architecture

```
SIH SATYAPAN/
├── frontend/             # React 18 + Vite + TS + Tailwind CSS + Framer Motion
│   ├── src/
│   │   ├── components/   # Government portal UI (GovHeader, AdvisoryBanner, SimulatedBadge)
│   │   ├── locales/      # i18next (en, hi, mr)
│   │   ├── pages/        # Institute portal, Scrutiny portal, Admin Rule Builder, Audit Log
│   │   └── store/        # Zustand (auth, application state, theme, language)
├── backend/              # Python FastAPI + SQLAlchemy 2 + Pydantic v2 + SSE
│   ├── app/
│   │   ├── api/          # Auth, Applications, Documents, Verification, Admin Rules
│   │   ├── mock_authorities/ # Simulated DigiLocker, UGC, NAAC, State DTE routers
│   │   ├── models/       # SQLAlchemy models (Applications, Rules, Audits, Docs)
│   │   └── services/     # Orchestrator, Verification Pipeline, SSE streamer
│   ├── tests/
├── ml/                   # Modular verification engines (CPU-offline friendly)
│   ├── ocr/              # Tesseract / EasyOCR fallback
│   ├── classification/   # Document type detector (Land, Building, Faculty, FDR, Affiliation)
│   ├── extraction/       # Key-value extraction with bounding boxes
│   ├── tamper/           # ELA (Error Level Analysis), copy-move, metadata inspection
│   ├── duplicate/        # Perceptual hashing (imagehash) for duplicate certificate detection
│   ├── signature/        # Signature & stamp detector with pyHanko digital signature validation
│   └── risk/             # Rule-based + statistical composite risk scoring
├── seed/                 # Synthetic generator & Demo Pack
│   ├── generator/        # Generates realistic sample PDFs & JSON records (realistic Indian names)
│   └── demo_pack/        # Deterministic sample applications (Clean, Minor Mismatch, Fraudulent Tampered)
└── docs/                 # ARCHITECTURE, API, INTEGRATION, SECURITY, DEMO_SCRIPT, PS_MAPPING, PROGRESS
```
