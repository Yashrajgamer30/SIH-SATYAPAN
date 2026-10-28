# SATYAPAN Frontend Layout Contract

This document defines the strict layout contract and routing hierarchy for the AICTE SATYAPAN regulatory platform.

---

## 1. Route Groups & Layout Matrix

| Layout Group | Target Routes | Visual Shell & Header | Sidebar | Breadcrumbs & Container | Root Styling & Constraints |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`PublicLayout`** | `/login` only | Dedicated public background & utility bar | None | Full viewport responsive center | None (no authenticated chrome) |
| **`InstituteLayout`** | `/institute/**` | Top bar (`h-[68px]`) with Emblem & SATYAPAN title | Responsive collapsible institute navigation drawer | Breadcrumb bar + `<PageContainer max-w-[1440px] p-6>` + `GovFooter` | Flow container, standard typography, light/dark responsive |
| **`OfficialsLayout`** | `/official/**` | Deep Navy Scrutiny Workbench (`#0B1F4B`, `h-[68px]`) with regional office chip | Responsive collapsible scrutiny workbench drawer | Breadcrumb bar + `<PageContainer max-w-[1440px] p-6>` + Page Title Row + `GovFooter` | Flow container with max-width 1440px, 24px padding, standardized headings |
| **`ScannerLayout`** | `/official/applications/:appId/students/:studentId/documents/:docId/scan` | **NONE** (No Officials header, no sidebar) | **NONE** | **NONE** | `position: fixed; inset: 0; background: var(--bg-forensic); isolation: isolate; display: grid; grid-template-rows: 56px 1fr; overflow: hidden;` |

---

## 2. Strict Layout Contract Rules

1. **Scanner Route Isolation (`ScannerLayout`)**:
   - The document scanner is mounted exclusively at `/official/applications/:appId/students/:studentId/documents/:docId/scan`.
   - It is a **first-class React Router route**, NOT a modal or transparent overlay.
   - It **must never** render the Officials portal header, utility bar, or portal sidebar.
   - Root styling must strictly enforce `position: fixed; inset: 0; background: var(--bg-forensic); isolation: isolate; grid-template-rows: 56px 1fr; overflow: hidden;`.
   - Grid Row 1 (56px) houses the unified scanner top bar.
   - Grid Row 2 (1fr) houses the 3-zone independent scrolling forensic canvas.

2. **Officials Workbench (`OfficialsLayout`)**:
   - All regulatory scrutiny, administrative configuration, and dossier reviews reside under `/official/**`.
   - Every page is wrapped inside `<PageContainer>` enforcing `max-width: 1440px` and `24px (p-6)` padding.
   - Standard page title row with breadcrumbs (e.g. `Admin > Rules and Checklists`).
   - Sticky header with quick search (Ctrl+K), notification alert counter, and IT Act digital signature key status.
   - Move `/rules` permanently to `/official/admin/rules` with an immediate 301/302 client redirect from `/rules`.

3. **Institute Self-Service Portal (`InstituteLayout`)**:
   - Technical institute self-service modules reside under `/institute/**`.
   - Covers Dashboard, Profile, Faculty register, Student enrollment, EOA New Application Wizard, Tracking, Vault, and Sahayak AI help.
   - Features institution greeting, permanent AICTE ID badge, and standard government footer.

4. **Empty State & Placeholder Policy**:
   - Any unbuilt, in-progress, or future phase routes (e.g., `/official/infra-compliance`, `/official/decisions`) render inside their respective layout with `<EmptyState />` or `<PlaceholderPageView />`.
   - Unstyled, broken, or blank pages are strictly prohibited.
