# REGULENS AI 2.0

> **Regulatory Intelligence. Simplified.**
>
> *From application preparation to evidence-based verification, one intelligent workspace.*

**Problem Statement 26261** · AICTE Regulation Bureau · Smart Automation · SIH 2026

---

## Overview

REGULENS AI 2.0 is an enterprise-grade AI-powered regulatory technology platform that transforms the AICTE institutional approval process. It combines deterministic rule-enforcement (R01–R16), cryptographically-anchored audit trails, an AI regulatory assistant, and an institution-facing guidance suite — all in one responsive, accessible, and multilingual workspace.

---

## Key Features

### 🔵 Intelligence Layer
- **REGI AI Assistant** — Regulatory Guidance Intelligence with grounded RAG, exact rule citations (R01–R16, NBC Part IV, APH clauses), multilingual explanations, and external LLM fallback
- **Evidence Intelligence Graph** — cross-document relationship mapping and contradiction detection
- **Trust Map** — semantic knowledge graph linking documents to regulatory rules
- **Document DNA Dialog** — SimHash-based document reuse detection across applications

### 🏛️ Institution Portal (`/portal`)
- Submit new applications with multi-document upload and AI pipeline processing
- Rectification workflow with contextual Smart Document Assistance suggestions
- Smart Tasks & Reminders (`/institution/tasks`) — database-persisted with filters
- Smart Document Assistance Center (`/institution/document-assistance/:type`) — checklists, official timelines, personalized deadline planner, and sync to tasks
- Nearby Certified Services (`/institution/document-assistance/:type/nearby`) — interactive Leaflet/OpenStreetMap map, GPS detection, city search, split/list/map modes

### 🏢 Officer Scrutiny Portal (`/`)
- Priority scrutiny queue with risk scoring and aging indicators
- Full-featured Application Cockpit with PDF viewer + bounding box overlay
- Finding review, clarification request, escalation, and evidence passport issuance
- Regulatory Copilot drawer for AI-assisted decision drafting

### 📢 Notice Center (`/notices`)
- Official AICTE APH circulars with AI summaries (4 languages)
- Applicant relevance matching and key date extraction
- Provenance badges linking back to the official AICTE source

### 🌐 Global Features
- **Ctrl+K Command Palette** — instant navigation, record search, and assistant launch
- **4-language UI** — English, Hindi (हिंदी), Marathi (मराठी), Hinglish
- **Light / Dark / System themes** — zero-flash, semantic CSS variables
- **WCAG-accessible** — keyboard navigation, ARIA labels, focus rings, sufficient contrast
- **Voice Interface ("Talk to REGI")** — Web Speech API STT/TTS, waveform visualization, playback speed, privacy disclosure

### 🔒 Trust & Auditability
- Hash-chained SQLite triggers — tamper-evident append-only audit log
- Evidence Passports — cryptographic credential bundles for cleared applications
- SHA-256 file hash deduplication — detect reuse of identical evidence across institutions
- Full audit trail visualization with chain integrity verification

---

## Architecture

```
SATYAPAN/
├── backend/                    # FastAPI (Python 3.11)
│   ├── app/
│   │   ├── main.py             # Application + all routers
│   │   ├── models.py           # SQLAlchemy ORM models
│   │   ├── services/
│   │   │   ├── pipeline.py     # 16-rule analysis engine (R01–R16)
│   │   │   └── assistant.py    # REGI RAG engine + LLM abstraction
│   │   ├── routers/            # FastAPI route handlers
│   │   │   ├── applications.py
│   │   │   ├── assistant.py    # Chat, conversations, suggestions
│   │   │   ├── document_guidance.py
│   │   │   ├── notices.py
│   │   │   ├── services.py     # Nearby geospatial discovery
│   │   │   ├── tasks.py
│   │   │   ├── search.py
│   │   │   └── preferences.py
│   │   └── db/
│   │       └── init_extensions.py  # DB migration + seeding
│   ├── tests/
│   │   ├── test_satyapan.py    # 39 original tests
│   │   └── test_regulens_v2.py # 4 new v2 tests
│   └── data/satyapan.db        # SQLite (WAL, hash-chained triggers)
│
├── frontend/                   # Next.js 14 (App Router)
│   ├── app/
│   │   ├── page.tsx            # Officer Dashboard
│   │   ├── login/page.tsx      # REGULENS-branded auth
│   │   ├── portal/             # Institution Portal
│   │   │   ├── page.tsx        # Application list + Smart Assistance cards
│   │   │   └── applications/[id]/page.tsx  # Detail + Rectification
│   │   ├── institution/
│   │   │   ├── tasks/page.tsx  # Smart Tasks Center
│   │   │   └── document-assistance/
│   │   │       └── [documentType]/
│   │   │           ├── page.tsx       # Checklist + timeline
│   │   │           └── nearby/page.tsx # Geospatial discovery
│   │   ├── notices/
│   │   │   ├── page.tsx        # Notice hub
│   │   │   └── [id]/page.tsx   # Notice detail + AI summary
│   │   ├── applications/[id]/page.tsx  # Officer Scrutiny Cockpit
│   │   └── globals.css         # Design system + dark mode overrides
│   ├── components/
│   │   ├── OfficialShell.tsx   # Main layout shell with sidebar
│   │   ├── RegulensLogo.tsx    # Custom SVG emblem
│   │   ├── ThemeToggle.tsx     # Light/Dark/System theme dropdown
│   │   ├── LanguageSelector.tsx # 4-language dropdown
│   │   ├── CommandPalette.tsx  # Ctrl+K global search palette
│   │   ├── RegiAssistantDrawer.tsx  # REGI AI assistant with voice
│   │   ├── RegiLauncher.tsx    # Floating assistant button
│   │   └── ServiceMap.tsx      # Leaflet/OpenStreetMap map
│   ├── lib/
│   │   ├── api.ts              # All API client fetch functions
│   │   ├── auth.tsx            # Auth context + language state
│   │   ├── labels.ts           # 4-language label dictionaries
│   │   └── theme.tsx           # Theme provider (zero-flash)
│   └── types/index.ts          # Full TypeScript interface definitions
│
├── .env.example                # Environment variable documentation
└── README.md                   # This file
```

---

## Getting Started

### Prerequisites
- Python 3.11+
- Node.js 20+
- Git

### 1. Clone & Setup Backend

```bash
cd SATYAPAN

# Create virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux

# Install dependencies
pip install -r backend/requirements.txt

# Initialize and seed the database
python backend/app/db/init_extensions.py

# Start the backend
uvicorn backend.app.main:app --reload --port 8000
```

### 2. Setup Frontend

```bash
# Install Node dependencies
npm.cmd --prefix frontend install

# Start the dev server
npm.cmd --prefix frontend run dev
```

Open **http://localhost:3000**

### 3. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

For AI assistant features, set `LLM_API_KEY` (Google Gemini recommended). Without it, the system falls back to the built-in deterministic RAG engine — no API key required for core functionality.

---

## Demo Accounts

| Role | Username | Password | Portal |
|------|----------|----------|--------|
| Institution User | `demo_institution` | `demo123` | `/portal` |
| Scrutiny Officer | `demo_officer` | `demo123` | `/` |
| Senior Officer | `demo_senior` | `demo123` | `/` |
| Auditor | `demo_auditor` | `demo123` | `/` |

---

## Testing & Build Verification

```bash
# Run all 43 backend tests
cd SATYAPAN
.venv\Scripts\python.exe -m pytest backend/tests/ -v

# Verify production frontend build
cd frontend
cmd /c npm run build
```

Expected output: **43/43 passed** backend tests & optimized Next.js 14 production bundle across all 18 routes.

---

## Design System & Theming

REGULENS AI 2.0 features a custom, token-based design system:
- **Semantic CSS Tokens:** HSL-tailored variables (`--canvas`, `--surface`, `--surface-raised`, `--border`, `--text-primary`, `--text-secondary`, `--brand-accent`, `--success`, `--warning`, `--danger`, `--info`).
- **Zero-Flash Theme Detection:** Synchronous head script resolving `light`, `dark`, or system default with zero hydration flicker.
- **Universal Dark-Mode Overrides:** Automatic CSS variable overrides in `globals.css` ensuring full dark mode compatibility across both new components and legacy analysis tools.
- **Multilingual Support:** Complete localization in 4 languages: English, Hindi (हिंदी), Marathi (मराठी), and Hinglish, persisted seamlessly via user preferences.

---

## Regulatory Rules Enforced (R01–R16)

| Rule | Description |
|------|-------------|
| R01 | Land ownership / lease deed validation (≥30 years, registered sub-registrar) |
| R02 | Fire Safety NOC — valid, current year, issued authority check |
| R03 | Occupancy/Completion Certificate — local authority verified |
| R04 | Cross-document consistency (name, address, survey number) |
| R05 | Faculty cadre declaration — minimum qualifications per AICTE norms |
| R06 | Infrastructure declaration — built-up area per NBA/NAAC standards |
| R07 | Accreditation status — NBA/NAAC certificate currency check |
| R08 | Financial Statement — audited accounts, CA certification |
| R09 | Affidavit — notarized, stamp paper value compliance |
| R10 | State Government / Affiliating University NOC currency |
| R11 | Document expiry validation — all documents must be within validity window |
| R12 | PDF authenticity — digitally signed or certified copy check |
| R13 | Registry source availability — issuer simulation with known providers |
| R14 | Evidence sufficiency — minimum page count and legibility score |
| R15 | Mandatory document presence — all required types submitted |
| R16 | SimHash reuse detection — duplicate evidence across institutions flagged |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Backend API | FastAPI (Python 3.11) |
| Database | SQLite + WAL + Hash-chained audit triggers |
| PDF Extraction | PyMuPDF (fitz) + pytesseract OCR |
| AI Assistant | Grounded RAG engine + Google Gemini / OpenAI (optional) |
| Frontend | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS v3 + CSS custom properties |
| Maps | Leaflet + OpenStreetMap (no API key required) |
| Voice | Web Speech API (STT + TTS, browser-native) |
| Auth | HTTP-only session cookies, bcrypt hashed passwords |

---

## Offline / Zero-Key Operation

REGULENS AI 2.0 is designed to be fully functional with **no external API keys**:

- **Maps**: OpenStreetMap via Leaflet — completely free and open
- **AI Assistant**: Falls back to the deterministic grounded RAG engine citing exact rule clauses
- **Voice**: Web Speech API — browser-native, no cloud dependency
- All core verification (R01–R16), audit trails, and evidence passports work entirely offline

---

## License

Prototype submission for Smart India Hackathon 2026 — PS 26261.  
Advisory only. Final regulatory decisions rest with competent AICTE authority.

---

*Built for AICTE Regulation Bureau · Smart Automation Theme · SIH 2026*
