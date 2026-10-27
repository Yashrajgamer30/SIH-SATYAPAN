# SATYAPAN - Stage Evaluation Demo Pack

This document provides the canonical rehearsal script and ground-truth expected outcomes for the 12 fixed evaluation documents in `/seed/demo_pack/`.

| # | File Name | Document Type | What to Say on Stage | Expected AI Verdict | Technical Anomaly Triggered |
|---|-----------|---------------|----------------------|----------------------|----------------------------|
| **1** | `fire_noc_clean.pdf` | Fire NOC | Verified, no findings | **VERIFIED** | `NONE` |
| **2** | `naac_certificate_expired.pdf` | NAAC Accreditation | Expired, HIGH finding | **EXPIRED** | `EXPIRED_DATE` |
| **3** | `affidavit_tampered_date.pdf` | Affidavit | Tampered date field with ELA noise disparity | **TAMPER_SUSPECTED** | `TAMPERED_TEXT` |
| **4** | `trust_deed_copy_move_seal.png` | Trust Deed | Copy-move on the seal detected by ORB feature match | **TAMPER_SUSPECTED** | `COPY_MOVE_SEAL` |
| **5** | `building_plan_duplicate.pdf` | Building Plan | Matches document of another institute via pHash | **DUPLICATE** | `DUPLICATE_CROSS_INSTITUTE` |
| **6** | `university_letter_bad_qr.pdf` | Affiliation Letter | HMAC fails signature integrity check | **SIGNATURE_INVALID** | `BAD_QR_HMAC` |
| **7** | `appointment_letter_untrusted.pdf` | Appointment Letter | Signer not in the institutional trust store | **SIGNER_NOT_TRUSTED** | `UNTRUSTED_SIGNER` |
| **8** | `marksheet_clean.pdf` | Mark Sheet | Verified authentic student credential | **VERIFIED** | `NONE` |
| **9** | `fee_receipt_id_mismatch.pdf` | Fee Receipt | Mismatch ID against the active institute record | **MISMATCH_ID** | `MISMATCH_INSTITUTE_ID` |
| **10** | `lab_photo_good.jpg` | Infra Evidence | Infra evidence passes room geometry and sharpness | **VERIFIED** | `NONE` |
| **11** | `lab_photo_blurry.jpg` | Infra Evidence | Needs additional evidence due to high Laplacian blur | **NEEDS_ADDITIONAL_EVIDENCE** | `BLUR_DEFICIENCY` |
| **12** | `library_photo_inconsistent.jpg` | Infra Evidence | Flagged for physical scrutiny committee inspection | **FLAGGED_FOR_INSPECTION** | `INCONSISTENT_LIGHTING` |

---

### Verification Acceptance Criteria
1. All files generate deterministically using `RANDOM_SEED = 20260228`.
2. Ground-truth verdicts in `/seed/labels.csv` exactly match this table.
3. The Document Scan View (`<ScanView/>`) displays the identical forensic report and advisory banner.
