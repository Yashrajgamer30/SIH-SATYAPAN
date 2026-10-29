# AICTE SATYAPAN - Grand Finals 5-Minute Presentation & Rehearsal Script

**Platform**: AICTE SATYAPAN (Grand Finals Edition)  
**Evaluation Criteria**: Innovation (25%), Impact (25%), Feasibility (25%), Clarity (25%)  
**Presentation Duration**: Exactly 5 Minutes (with 2 minutes Q&A)

---

## 0. Pre-Presentation Checklist (Run at T-5 Minutes)

1. Open browser to `http://localhost:5173/demo/health`.
2. Verify all **5 green ticks** are showing:
   - ✓ SQLite Database & Multi-Tenancy (Connected)
   - ✓ Cryptographic Audit Chain (SHA-256 Intact from Genesis Root)
   - ✓ 12-Scenario Demo Pack Files (Loaded in `seed/demo_pack`)
   - ✓ Tesseract OCR & PyPDFium2 Renderer (Operational)
   - ✓ AES-256-GCM Storage Vault (Authenticated)
3. **Emergency Reset Shortcut**: If you need to restore the pristine starting state at any moment, press **`Ctrl+Shift+D`** anywhere in the app (or click **Reset Demo Data**).

---

## 1. The 5-Minute Presentation Walkthrough

### Minute 1: The Problem & Institute Self-Service Pre-Check
- **Hook (0:00 - 0:30)**:
  > *"Every year, AICTE scrutinises over 12,000 technical institutes and 80,000 statutory documents. Manual scrutiny creates backlogs, human error, and undetected syndicate fraud. SATYAPAN transforms this into an explainable, tamper-evident regulatory workbench."*
- **Live Demo - Institute Portal (0:30 - 1:00)**:
  1. Log in as Institute Admin (`admin@demo-institute.in`).
  2. Open **Readiness Simulator** (`/institute/readiness-simulator`):
     - Show the interactive sliders: Adjust Faculty Count vs Student Intake.
     - Toggle Fire NOC status: Watch the predicted risk score shift dynamically from **12% (Green)** to **52% (High Risk)**.
  3. Open **New Application Wizard** (`/institute/new-application`):
     - Show the blue **Offline Draft Restored** badge: Proof that drafts are protected against network failure via LocalStorage + 20s server sync.
     - Show the generated submission receipt with **Tamper-Evident Acknowledgement QR** (`/verify/acknowledgement/demo-ack`).

---

### Minute 2: Smart Queue & AI Scrutiny Dossier
- **Smart Queue (`/official/smart-queue`) (1:00 - 1:45)**:
  1. Log in as Scrutiny Officer (`scrutiny@aicte.demo` with 6-digit MFA OTP).
  2. Explain the **Smart Queue ranking**: Applications ordered by composite priority:
     $$\text{Priority} = 0.65 \times \text{AI Risk Score} + 0.35 \times \text{SLA Urgency}$$
  3. Hover on the red **HIGH RISK (78.5/100)** badge of `AICTE/EOA/2026/MH-PUN-402`:
     - Show the **"Why this score" popover** listing the top 3 contributing risk factors.
  4. Point to the **Deep Navy Header**:
     - Hover over the **`47,700 hrs saved (-78.4%)`** badge.
     - Show the popup with the evaluation model (45 min/check, 6.5 docs/application).

---

### Minute 3: Forensic Scan View & Explainable AI
- **Forensic Scrutiny Review (`/official/applications/1`) (1:45 - 2:45)**:
  1. Open the 8-tab dossier:
     - Tab 1: **Summary** (Institute metadata, risk score, SLA).
     - Tab 2: **Master vs Submitted Diff** (Highlights discrepancies in red).
     - Tab 4: **AI Findings**: Click **Explain-Why** on the Fire NOC finding:
       - Show the slide-out drawer: attribution to Tesseract OCR, inputs used, and factor weight bars (68% expiry date mismatch).
  2. Open **Scan View** (`.stage` transform document viewer):
     - Click an overlay bounding box: Show the smooth **500ms click-to-zoom animation** with 20% padding.
     - Show color-coded forensic boxes: Blue (OCR fields), Green (QR code), Purple (Signature), Orange (Municipal Seal), Red (Tampered Region).
     - Click **Overview** to return smoothly to 100% fit.

---

### Minute 4: Two-Person Rule & External Corroboration
- **Statutory Decision Flow (2:45 - 3:30)**:
  1. Emphasize **Principle 1**: *"AI is strictly advisory — only human officials make statutory decisions."*
  2. In the Decision Panel, select **Raise Deficiency** and type mandatory remarks:
     > *"Fire NOC expiration date contradicts municipal registry records."*
  3. Click **Submit Decision**:
     - The dossier immediately enters **`AWAITING_SENIOR_CONFIRMATION`**.
     - Point to the purple **Two-Person Rule Banner**: *"Adverse decisions require dual authorization by a Senior Regional Officer."*
  4. Switch to Senior Officer (`senior@aicte.demo`):
     - Click **Confirm Adverse Decision** to finalize the order.

---

### Minute 5: Out-of-the-Box Differentiators & Live Tamper Test
- **Differentiators Showcase (3:30 - 5:00)**:
  1. **Cross-Institute Duplicate Network Graph (`/official/cross-network`)**:
     - Show the interactive canvas graph: Nodes are institutes; edges are shared fraudulent documents.
     - Click an edge: Launches the **Side-by-Side Comparator** proving a cloned Fire NOC seal reused across campuses in Pune and Nashik.
  2. **Risk-Based Inspection Planner (`/official/inspection-planner`)**:
     - Show travel clusters grouped by district.
     - Click **Inspection Brief**: Open the **One-Click Printable Inspection PDF** with pre-screening findings and on-site checklist.
  3. **Live Cryptographic Audit Tamper Demonstration (`/official/audit-security`)**:
     - Show the green **Cryptographic Integrity Verified** banner across 80 blocks.
     - Click the developer button **Inject Out-of-Band Tamper**:
       - Re-run verification: **FAIL** alert naming the exact corrupted row ID (`04b0e8f3-...`).
     - Click **One-Click Repair**: Instantly recomputes canonical hashes from genesis root in < 0.1s. All green again!

---

## 2. Screen-Recording Fallback Instructions (5-Minute Backup Video)

If internet or hardware fails on stage, keep a recorded 1080p MP4 ready on your desktop:

1. **Recording Tool**: Use **Windows Game Bar (`Win + Alt + R`)** or **OBS Studio** at 1080p 60fps.
2. **Audio**: Use a clear USB microphone with narration matching the 5 acts above.
3. **File Location**: Save as `C:\Users\Yashraj Jadhav\OneDrive\Desktop\SATYAPAN_Grand_Finals_5Min_Demo.mp4`.
4. **Playback**: Open in VLC Media Player, paused at 0:00, ready to hit Spacebar if live demo is constrained.
