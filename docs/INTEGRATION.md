# AICTE SATYAPAN - External Authorities & Registry Integration Specification

## 1. Overview & Transparency Mandate
SATYAPAN integrates with external statutory issuing authorities to corroborate institutional claims against source registries. In compliance with National Hackathon guidelines:
- All external authority integrations run through simulated endpoints operating under realistic API latency and status codes.
- Every corroborated record in the UI displays a clear **`SIMULATED SOURCE`** badge to maintain 100% transparency with evaluators.
- Verification requests map strictly to the **6 standardized statutory statuses**:
  1. `VERIFIED`: Exact match with issuing authority source register.
  2. `MISMATCH_DETECTED`: Authority record exists but extracted fields contradict statutory values.
  3. `EXPIRED`: Document authentic but validity date precedes approval cycle.
  4. `VERIFICATION_PENDING`: Gateway query initiated; awaiting asynchronous callback.
  5. `SOURCE_UNAVAILABLE`: External registry offline or HTTP 503 gateway timeout.
  6. `MANUAL_REVIEW_REQUIRED`: Unstructured or physically embossed certificate requiring human scrutiny.

---

## 2. Integrated Authorities & Data Contracts

### 2.1 State Fire Safety Directorate
- **Gateway Endpoint**: `POST /mock-authorities/fire-services/verify`
- **Payload**:
  ```json
  {
    "noc_number": "NOC/MH/PUN/2024/8819",
    "institute_id": "1-29849201",
    "district": "Pune",
    "issued_date": "2024-01-15"
  }
  ```
- **Response**:
  ```json
  {
    "status": "EXPIRED",
    "certificate_serial": "NOC/MH/PUN/2024/8819",
    "valid_upto": "2024-12-31",
    "registered_institute_name": "Government College of Engineering",
    "authority_seal_sha256": "8f92b...1294",
    "source_latency_ms": 140
  }
  ```

### 2.2 Revenue Department (District Collector Land Registry 7/12)
- **Gateway Endpoint**: `POST /mock-authorities/land-revenue/verify`
- **Payload**:
  ```json
  {
    "khata_number": "42/1-AWASARI",
    "survey_number": "42/1",
    "district": "Pune",
    "state": "Maharashtra"
  }
  ```
- **Response**:
  ```json
  {
    "status": "VERIFIED",
    "contiguous_acres": 3.25,
    "title_status": "CLEAR_UNENCUMBERED",
    "land_classification": "EDUCATIONAL_INSTITUTIONAL",
    "owner_entity": "Government College of Engineering Trust"
  }
  ```

### 2.3 Banking Core Gateway (SBI CBS Joint Escrow FDR)
- **Gateway Endpoint**: `POST /mock-authorities/banking-cbs/verify`
- **Payload**:
  ```json
  {
    "fdr_number": "SBI-FDR-991048201",
    "joint_account_holder": "Regional Officer AICTE",
    "claimed_amount_inr": 3500000
  }
  ```
- **Response**:
  ```json
  {
    "status": "VERIFIED",
    "fdr_status": "ACTIVE_LOCKED",
    "principal_amount": 3500000.0,
    "lock_in_period_years": 8,
    "branch_ifsc": "SBIN0001423"
  }
  ```

### 2.4 Public Works Department (PWD Structural Safety)
- **Gateway Endpoint**: `POST /mock-authorities/pwd/verify`
- **Payload**:
  ```json
  {
    "certificate_number": "PWD-MH-2024-881",
    "executive_engineer_code": "EE-PWD-PUN-04"
  }
  ```
- **Response**:
  ```json
  {
    "status": "VERIFIED",
    "structural_stability_passed": true,
    "barrier_free_access_verified": true,
    "expiry_date": "2029-06-30"
  }
  ```

---

## 3. Resilience & Exception Workflows

### 3.1 Bulk Retry for `SOURCE_UNAVAILABLE`
When an external registry experiences network timeout or high traffic, verification items enter `SOURCE_UNAVAILABLE`. Scrutiny officers can trigger bulk asynchronous retry across all stalled items with exponential backoff:
- **API Endpoint**: `POST /official/verifications/retry-unavailable`
- **Recovery Time**: Automated failover to cached registry snapshots with explicit provenance timestamp.

### 3.2 Manual Confirmation Fallback
If an external authority remains unreachable or the certificate is non-standard, scrutiny officers can invoke the **Manual Confirmation Workflow**:
- **API Endpoint**: `POST /official/verifications/:id/manual-confirm`
- **Requirements**:
  1. Mandatory justification remarks (min 10 characters).
  2. Physical register folio / physical dispatch reference number.
  3. Digital identity of the confirming officer recorded in the SHA-256 audit ledger.

