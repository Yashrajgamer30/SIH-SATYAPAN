# AICTE SATYAPAN - Problem Statement & Milestone Requirement Mapping

This document provides a comprehensive traceability matrix mapping every requirement from the **AICTE SATYAPAN Specification (Grand Finals Edition)** to its corresponding backend services, frontend components, machine learning engines, and automated test cases.

---

## 1. Statutory Core Requirements Traceability Matrix

| Requirement / Capability | Frontend Implementation | Backend API & Services | ML / Forensic Engine | Automated Verification Test |
|:---|:---|:---|:---|:---|
| **Principle 1: Human-in-the-Loop Advisory** | `<AdvisoryBanner />` on all review pages | `X-AI-Advisory` header injected by `SecurityHeadersMiddleware` | Advisory scoring engine in `app/services/risk_service.py` | `test_advisory_banner_present` (`test_api_security.py`) |
| **Two-Person Rule for Adverse Actions** | Two-person banner, decision action panel with senior confirmation flow in `ScrutinyDetail.tsx` | `POST /official/applications/:id/decision` & `POST /official/applications/:id/confirm-decision` | Workflow orchestrator in `official.py` | `test_two_person_rule_decision_lifecycle` (`test_prompt_d1.py`) |
| **Smart Queue (AI Risk + SLA Ranking)** | `SmartQueueView.tsx` with saved views, filters, and hover risk factor breakdowns | `GET /official/queue` & `POST /official/queue/bulk-assign` | Ranking algorithm ($0.65 \times \text{Risk} + 0.35 \times \text{SLA}$) | `test_smart_queue_ranking_and_filters` (`test_prompt_d1.py`) |
| **8-Tab Application Scrutiny Dossier** | `ScrutinyDetail.tsx` (Summary, Diff, Students/Docs, Findings, Infra, Verif, Timeline, Audit) | `GET /official/applications/:id/review` | Dossier aggregator in `official.py` | `test_application_review_8_tabs_dossier` (`test_prompt_d1.py`) |
| **Forensic Scan View with Overlay Alignment** | `ScanView.tsx` with `.stage` transform, SVG overlay, and 500ms click-to-zoom | `GET /documents/:id/pages/:n.png` & `GET /documents/:id/metadata` | 150 DPI PyPDFium2 renderer, disk cache in `scratch/page_cache/` | `test_independent_ocr_overlap` & dark pixel sampling (`test_documents.py`) |
| **Explainable AI (Explain-Why Drawer)** | `<ExplainWhyDrawer />` in `ScrutinyDetail.tsx` & popover on queue badges | Findings schema with `explain_why` payload (inputs, model, weights) | Feature attribution model in `official.py` | `test_application_review_8_tabs_dossier` (`test_prompt_d1.py`) |
| **Cryptographic Hash-Chained Audit Trail** | `AuditSecurityCentreView.tsx` with animated chain verification links | `GET /audit/verify-chain`, `POST /demo/tamper-audit-row`, `POST /demo/repair-audit-chain` | SHA-256 sequential block hasher in `app/core/audit.py` | `test_audit_hash_chain_tamper_and_repair` (`test_prompt_d2.py`) |
| **Infrastructure Compliance & Evidence Matching** | `InfraComplianceView.tsx` with CAD plan overlays, geo-photos, and requirement checklist | `GET /official/infra-compliance` | GIS and carpet area analyzer in `official.py` | `test_infra_compliance_and_evaluation_metrics` (`test_prompt_d2.py`) |
| **Admin Rule Builder (Form UI over JSON)** | `AdminRuleBuilder.tsx` with live Form/JSON toggle, test on sample, and rollback | `GET /official/rules`, `POST /official/rules/:code/rollback`, `POST /official/rules/:code/test` | Rule engine with version history in `ConfigVersion` | `test_regulatory_rules_lifecycle` (`test_admin_rules.py`) |
| **Evaluation Benchmark & Effort Model** | `AnalyticsEvaluationView.tsx` with held-out split disclosure and effort assumptions | `GET /official/analytics/eval` (loads `ml/reports/eval.json`) | Evaluation report loader in `official.py` | `test_infra_compliance_and_evaluation_metrics` (`test_prompt_d2.py`) |
| **Cross-Institute Duplicate Network Graph** | `CrossInstituteNetworkView.tsx` with interactive HTML5 canvas topology & side-by-side diff | `GET /official/cross-network` | Perceptual hashing (pHash) & duplicate certificate tracker | `test_cross_institute_duplicate_network` (`test_prompt_e1.py`) |
| **Institute Trust Profile** | `InstituteTrustProfileView.tsx` with Trust Index, historical approvals, and flag resolution velocity | `GET /official/institutes/:id/trust-profile` | Trust Index scoring algorithm ($0-100$, Tier A/B/C) | `test_institute_trust_profile` (`test_prompt_e1.py`) |
| **Risk-Based Inspection Travel Planner** | `InspectionPlannerView.tsx` grouped by district with travel prioritization & CSV export | `GET /official/inspection-planner` | Cluster proximity and risk score priority ranker | `test_risk_based_inspection_planner_and_brief` (`test_prompt_e1.py`) |
| **One-Click Printable Inspection Brief** | `InspectionBriefModal.tsx` with official letterhead, findings, thumbnails, and spot checklist | `GET /official/applications/:id/inspection-brief` | Document generator with QR validation payload | `test_risk_based_inspection_planner_and_brief` (`test_prompt_e1.py`) |
| **What-If Regulatory Readiness Simulator** | `WhatIfSimulatorView.tsx` with sliders for faculty, students, land acreage, Fire NOC, and FDR | Real-time browser calculation against APH 2026-27 norms | Client-side rule evaluator and risk gauge | Verified interactive component |
| **Tamper-Evident Acknowledgement QR** | `AcknowledgementVerifyView.tsx` with cryptographic green shield and hash verification | `GET /documents/verify-acknowledgement/:ackHash` | SHA-256 submission hash verification against audit ledger | `test_acknowledgement_verification_and_pii_privacy` (`test_prompt_e1.py`) |
| **Live 'Time Saved' Impact Counter** | `TimeSavedBadge.tsx` in deep navy header with hover popover detailing model assumptions | Display component tied to evaluation benchmark | 78.4% manual effort reduction model | Verified component in `OfficialsLayout.tsx` |
| **Command Palette (Ctrl+K) & Collaboration** | `CommandPalette.tsx` global spotlight modal + collaboration case notes with @mentions | `POST /official/case-notes` & `GET /official/case-notes/:id` | Full-text command indexer and mention router | `test_case_notes_collaboration` (`test_prompt_e1.py`) |
| **Privacy by Design & PII Masking** | `PurposeBoundAccessModal.tsx` with mandatory purpose selection before decryption | `POST /documents/:id/purpose-access` & `POST /documents/pii-reveal` | DPDP Act 2023 purpose logger and dynamic watermarking | `test_acknowledgement_verification_and_pii_privacy` (`test_prompt_e1.py`) |
| **Offline-Safe Drafts on Institute Side** | `NewApplicationWizard.tsx` with 20s localStorage autosave and restore alert banner | `POST /institute/applications/draft` | Dual-tier offline caching engine | Verified in `NewApplicationWizard.tsx` |
| **Demo Mode & Pre-Presentation Health** | `DemoHealthView.tsx` (`/demo/health`) with green checkmarks & `Ctrl+Shift+D` shortcut | `GET /demo/health` & `POST /demo/reset` | Multi-engine health scanner (Tesseract, DB, Seeds, Demo Pack) | `test_demo_system_health_checks` (`test_prompt_f2.py`) |

---

## 2. Test Suite Coverage Summary

- **Phase A3 (Security Core)**: 12 tests in `test_api_security.py`
- **Admin Rules Lifecycle**: 1 test in `test_admin_rules.py`
- **Prompt D1 (Smart Queue & Decisions)**: 4 tests in `test_prompt_d1.py`
- **Prompt D2 (Infra & Audit)**: 4 tests in `test_prompt_d2.py`
- **Prompt E1 (Differentiators)**: 5 tests in `test_prompt_e1.py`
- **Prompt F2 (Demo Mode Health)**: 1 test in `test_prompt_f2.py`
- **Playwright E2E Guard Rails**: 3 spec suites (`routes.spec.ts`, `admin_rules.spec.ts`, `overlay_alignment.spec.ts`)
- **Total Automated Test Suites**: **100% Passing**.

