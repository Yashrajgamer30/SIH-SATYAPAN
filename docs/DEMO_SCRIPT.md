# AICTE SATYAPAN - Grand Finale Rehearsal & Live Evaluation Guide

Optimized for the four core hackathon criteria: **INNOVATION, FEASIBILITY, IMPACT, and CLARITY**.

---

## 1. Hackathon Persona Roles (Top-Right Switcher)
- **Role 1: Scrutiny Official (`OFFICIAL_SCRUTINY`)**:
  - Views all submitted applications across the region.
  - Inspects automated findings, visual bounding boxes, confidence ratings, and cross-checks with simulated issuing authorities.
  - Takes mandatory human action: Enters formal remarks to recommend EoA, issue a Deficiency Memo, or reject.
- **Role 2: Institute Administrator (`INSTITUTE_ADMIN`)**:
  - Enforces **Principle 4 (Authorized Access Only)**.
  - Institute sees strictly its own files and records (e.g. Saraswati Institute of Technology).
- **Role 3: System Administrator (`SYSTEM_ADMIN`)**:
  - Enforces **Principle 3 (Configurable)**.
  - Dynamically updates APH 2026-27 checklist rules (e.g., minimum land acres, maximum SFR) stored in SQLite as JSON without redeploying code.

---

## 2. Grand Finale 3-Act Demo Walkthrough

### Act 1: The Clean Approval Flow (Innovation & Clarity)
1. Select application `AICTE/EOA/2026/MH-PUNE-402` (**Saraswati Institute of Technology**).
2. Note the prominent **AI Result is Advisory** banner (Principle 1) and the green low-risk score (4.5/100).
3. Click **Open Scrutiny Desk**.
4. Click on **LAND_AREA_COMPLIANCE**:
   - Observe the visual certificate with the highlighted bounding box over `3.25 Acres`.
   - View the purple **SIMULATED SOURCE • Mahabhumi Land Records** tag (Principle 6).
5. Switch language in the header to **हिन्दी** or **मराठी**:
   - Notice the live translations of official terminology and Indian Government typography (Noto Sans & Noto Sans Devanagari).
6. In the Official Action Drawer, select **Recommend Extension of Approval (EoA)**, type remarks: *"All parameters compliant with APH 2026-27 norms"*, and submit.

### Act 2: Multi-Deficiency & Anomaly Detection (Impact)
1. Return to Roster and select `AICTE/EOA/2026/MH-NSK-108` (**Sahyadri College of Engineering**).
2. Note the advisory risk score spikes to **HIGH (78.2/100)**.
3. Inspect the three distinct anomalies:
   - **Land Deficit (`MISMATCH_DETECTED`)**: Only 1.40 Acres verified vs 2.50 Acres mandatory requirement.
   - **Expired Fire Safety NOC (`EXPIRED`)**: DigiLocker cross-check detected expiration on 09-01-2024.
   - **Duplicate Faculty Alert (`MANUAL_REVIEW_REQUIRED`)**: Dr. Ramesh V. Kulkarni found concurrently active at another engineering institute.
4. Issue an official **Deficiency Memo** with formal observations to demonstrate Decision Support Only in action.

### Act 3: Dynamic Rule Configuration (Feasibility)
1. Switch to the **APH 2026-27 Rule Builder** tab (as System Administrator).
2. Click **Edit Rule Thresholds** on `LAND_AREA_COMPLIANCE`.
3. Adjust the threshold JSON (e.g., set `min_acres_urban` to `2.0`).
4. Click **Save New Version** to showcase database-driven compliance agility without engineering downtime.
