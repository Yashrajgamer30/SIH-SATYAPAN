# AICTE SATYAPAN - Complete System Architecture

## 1. System Overview & Statutory Tenets
**AICTE SATYAPAN** is an enterprise-grade AI decision-support and document scrutiny platform designed for the All India Council for Technical Education (AICTE) Extension of Approval (EoA) scrutiny cycle.

It is built strictly under the following statutory principles:
1. **Decision Support Only (Principle 1)**: All AI outputs are strictly advisory. AI never approves, rejects, or sanctions an application. All final statutory decisions are executed exclusively by human officials with mandatory written justification remarks.
2. **Two-Person Rule for Adverse Actions**: Scrutiny officers can directly approve clean applications. Any adverse action (*Reject*, *Raise Deficiency*, *Recommend Physical Inspection*) automatically transitions the dossier to `AWAITING_SENIOR_CONFIRMATION` and requires formal concurrence by an `OFFICIAL_SENIOR` officer before execution.
3. **Explainable AI (XAI)**: Every finding, anomaly flag, and risk score features an Explain-Why factor breakdown with model/rule attribution, inputs used, feature weights, and visual bounding box overlays.
4. **Cryptographic Immutability**: All decisions, document access events, and rule alterations are recorded in a SHA-256 hash-chained audit ledger with real-time tamper detection.
5. **Privacy by Design**: Mandatory purpose-bound access tokens before document viewing, default PII masking (Aadhaar, PAN, Mobile), and dynamic official watermarking under the Indian DPDP Act 2023.

---

## 2. End-to-End System Architecture Diagram

```mermaid
flowchart TD
    subgraph Frontend["Frontend Layer (React 18 + TypeScript + Vite)"]
        UI_Inst["Institute Portal\n(Application Wizard, What-If Simulator, Vault)"]
        UI_Off["Officials Workbench\n(Smart Queue, 8-Tab Review, Split-Screen Scan)"]
        UI_Admin["Admin Rule Builder\n(Form UI, Versioning, Rollback)"]
        UI_Tools["Differentiators\n(Cross-Network Graph, Inspection Planner)"]
    end

    subgraph Gateway["FastAPI Gateway & Security Layer (:8000)"]
        AUTH["Argon2 Authentication\n+ Official 6-Digit MFA OTP"]
        RBAC["RBAC Route Guards\n+ IDOR Row-Level Tenancy Isolation"]
        SEC_HDR["National Security Headers\n(CSP, HSTS, X-Frame-Options, X-AI-Advisory)"]
        RATE["SlowAPI Rate Limiter\n(100 req/min, 15MB ceiling)"]
    end

    subgraph Pipeline["ML Verification & Forensics Pipeline (CPU-Offline)"]
        RENDER["Document Renderer\n(150 DPI PyPDFium2 Rasterizer + Disk Cache)"]
        OCR["Tesseract OCR Engine\n(Word-level Bounding Boxes & Text Extraction)"]
        CV_DET["OpenCV Contours & Hough Detector\n(QR Decoder, Signature Strokes, Blue Seals)"]
        TAMPER["Tamper & ELA Forensics\n(Copy-Move Detector, Metadata Inspection)"]
        HASH["Perceptual Hashing (pHash)\n(Cross-Institute Duplicate Detection)"]
        RISK_ENG["Composite Risk Engine\n(65% Anomaly Score + 35% SLA Urgency)"]
    end

    subgraph Storage["Storage & Cryptographic Audit Layer"]
        VAULT["AES-256-GCM Document Vault\n(Authenticated Ciphertext + Signed HMAC URLs)"]
        SQLITE["SQLite Master Database\n(WAL Mode, UUID PKs, Tenancy Partitioning)"]
        CHAIN["SHA-256 Cryptographic Hash Chain\n(Hash_i = SHA256(Hash_i-1 || CanonicalJSON))"]
    end

    subgraph MockGateways["Simulated Authority Gateways (SIMULATED SOURCE)"]
        M_FIRE["State Fire Services Registry"]
        M_LAND["Revenue & Land Collector 7/12"]
        M_BANK["Joint Escrow FDR Gateway (SBI CBS)"]
        M_PWD["PWD Building Safety Registry"]
        M_UNIV["Affiliating State University Portal"]
    end

    UI_Inst -->|Bearer JWT| Gateway
    UI_Off -->|Bearer JWT| Gateway
    UI_Admin -->|Bearer JWT| Gateway
    UI_Tools -->|Bearer JWT| Gateway

    Gateway --> Pipeline
    Gateway --> Storage
    Gateway --> MockGateways

    Pipeline --> RENDER
    RENDER --> OCR
    RENDER --> CV_DET
    OCR --> TAMPER
    CV_DET --> HASH
    TAMPER --> RISK_ENG
    HASH --> RISK_ENG

    Storage --> VAULT
    Storage --> SQLITE
    Storage --> CHAIN
```

---

## 3. Cryptographic Hash Chain Specification

Every transaction written to the audit log computes a deterministic SHA-256 hash chaining backward to the hardcoded genesis root:

$$\text{Root Hash}_0 = \text{"GENESIS\_ROOT\_HASH\_AICTE\_SATYAPAN\_2026"}$$

$$\text{Hash}_i = \text{SHA-256}\Big(\text{Hash}_{i-1} \,\|\, \text{":"} \,\|\, \text{CanonicalJSON}(\text{Payload}_i)\Big)$$

Where $\text{CanonicalJSON}$ is defined as UTF-8 encoded JSON with sorted keys and compact separators:
```python
json.dumps(payload, sort_keys=True, separators=(',', ':'))
```

Any modification to a past row's details immediately produces a checksum mismatch:
$$\text{Expected Hash}_i \neq \text{Stored Hash}_i$$
The `/audit/verify-chain` endpoint recomputes this sequence from genesis in under 20ms across thousands of records and pinpoints the exact corrupted row ID and index.

---

## 4. Bounding Box & Coordinate Unification Contract

All document overlays (OCR words, extracted form fields, QR decoders, blue seals, signature strokes, and tampered regions) adhere to a unified coordinate space:

- **Origin**: Top-left corner $(0, 0)$ of the rendered document page image.
- **Rendering Resolution**: Standardized at **150 DPI**.
- **Page Dimensions**: Provided alongside bounding box records: `[x, y, width, height, page_width, page_height]`.
- **Frontend Presentation**: Rendered inside a `.stage` `<div>` containing an `<img class="page">` and an overlaid `<svg class="overlay" viewBox="0 0 W H" preserveAspectRatio="none">`.
- **Zoom & Pan**: All transformations (scale, translate, rotate) apply strictly to `.stage` via CSS transforms, guaranteeing pixel-perfect alignment under any viewport scaling.
