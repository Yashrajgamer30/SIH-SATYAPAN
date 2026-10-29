# AICTE SATYAPAN - Operational Boundaries & Known Limitations

## 1. Statutory & Legal Decision Boundary
1. **Advisory Decision Support Only**:
   - AICTE SATYAPAN is strictly an automated compliance assistant. Under AICTE statutory governance rules, the AI engine **cannot and will not** issue approvals, rejections, or deficiency orders autonomously.
   - All regulatory outcomes require human action by designated AICTE Scrutiny Officers and Senior Regional Officers with mandatory written justification.
2. **Evidentiary Limitations**:
   - Automated checks indicate mathematical and visual discrepancies. They do not constitute judicial proof of intentional criminal forgery. Physical inspection committees must verify original ink documents when fraud is suspected.

---

## 2. Technical & Pipeline Constraints

### 2.1 Optical Character Recognition (OCR) Under Low Resolution
- **Optimal Range**: Scanned PDF or TIFF documents rendered at **150 DPI to 300 DPI**.
- **Known Boundary**: Documents scanned below **100 DPI**, severely skewed (> 25 degrees), or captured with extreme mobile camera glare may result in degraded OCR confidence (< 85%).
- **Mitigation**: When confidence drops below 85%, SATYAPAN marks the field as `MANUAL_REVIEW_REQUIRED` and flags the image quality in the Evidence Gallery.

### 2.2 Digital Signatures & Non-Standard Cryptographic Formats
- **Standard**: X.509 certificates and PKCS#7 digital signatures (via pyHanko) validated against the Controller of Certifying Authorities (CCA) India root list.
- **Limitation**: Self-signed digital certificates or non-standard proprietary e-sign tokens without public CRL/OCSP endpoints are flagged as `UNTRUSTED_ISSUER` and require manual scrutiny.

### 2.3 Hardware & GPU Independence
- **Constraint**: Designed for commodity regional office hardware (quad-core Intel Core i5/i7 laptops, 8GB-16GB RAM, without dedicated CUDA GPUs).
- **Impact**: Heavy transformer vision models (e.g. LayoutLMv3 large) are quantized to ONNX/CPU runtimes. Average verification time per page is constrained to **1.4 seconds**.

### 2.4 Multilingual Language Scope
- **Current Coverage**: Fully tested and benchmarked on **English, Hindi (Devanagari), and Marathi (Devanagari)** technical education records.
- **Future Roadmap**: Support for southern and eastern regional scripts (Tamil, Telugu, Kannada, Bengali) planned for Phase 2 nationwide rollout.

---

## 3. Synthetic Benchmark Scope & Production Readiness
- **Evaluation Split**: Benchmarked on a curated held-out test split of 92 multi-page dossiers across 12 distinct deficiency scenarios.
- **Simulated Gateways**: External authority gateways (DigiLocker, State Fire Services, Land Revenue) are simulated via local mock microservices. Real-world integration will require national NIC/API Setu credentials.

