# PDFForge — Execution Process & Workflow Guidelines

> **Referenced Document:** [project-overview.md](file:///Users/callsmaster/Documents/vk/free-pdf/project-overview.md)  
> **Status:** Active Working Process Document  
> **Last Updated:** 2026-10-12

---

## 🚨 MANDATORY AGENT & DEVELOPER RULES

These rules are strictly enforced for all AI agents and contributors working in this repository:

### 1. Pre-Change Rule (Read First)
> **BEFORE** creating any new files, updating existing code, deleting files, or making architectural modifications:
> 1. You **MUST read this file (`process.md`)** to check current project status, phase progression, and ongoing tasks.
> 2. You **MUST read [`project-overview.md`](file:///Users/callsmaster/Documents/vk/free-pdf/project-overview.md)** to verify compliance with core architecture, non-goals, technology stack, and phase constraints.

### 2. Post-Change Rule (Update with Date)
> **AFTER** completing every task point, sub-task, or milestone:
> 1. You **MUST update this file (`process.md`)** immediately.
> 2. Include the **exact date** (`YYYY-MM-DD`), the specific task item completed, the current status, and the next planned task in the [Activity & Progress Log](#activity--progress-log) and update the corresponding item in the [Phase Checklist](#phase-execution-checklist).

### 3. Core Architectural Guardrails
- **Client-Side Only:** PDF and document operations must run **100% locally in the browser**.
- **No Backend / Server Storage:** Do not create API routes, server actions for document processing, server databases (Postgres, Mongo, Prisma, Redis), or cloud storage.
- **Privacy First:** Never upload document contents to external servers or AI APIs without explicit user consent.
- **Feature Truthfulness:** Never claim or show a tool as functional if its engine is not fully implemented and tested.
- **Phase Discipline:** Work strictly sequentially through the phases outlined below. Do not jump ahead to advanced features before foundational phases are verified and complete.

### 4. Code Quality & Modularity Standards
- **File Length Limit (Max 160–170 Lines):** Keep individual files and components concise, strictly capped at a maximum of 160–170 lines of code.
- **Sub-Component Extraction:** Break down large, complex components into smaller, focused sub-components rather than bloating single files.
- **DRY Principle:** Strictly adhere to the DRY (Don't Repeat Yourself) principle across business logic and UI code.
- **Reusable Component Architecture:** Extract and leverage shared, reusable components wherever common patterns appear (file drops, sliders, modals, progress bars, preview cards).


---

## 📋 Phase Execution Checklist

### Completed Milestone Phases (Phases 0–10)
- [x] **Phase 0: Foundation & Setup** — TypeScript, Tailwind v4, shadcn/ui, static build *(2026-10-09)*
- [x] **Phase 1: Design System & Shell** — Paper/Charcoal themes, Hero, directory, anti-FOUC *(2026-10-09)*
- [x] **Phase 2: PDF Preview & Validation** — PDF.js canvas, thumbnails, zoom, memory cleanup *(2026-10-10)*
- [x] **Phase 3: Core PDF Tools (7 Tools)** — Merge, Split, Rotate, Extract, Reorder, Img2PDF, PDF2Img *(2026-10-12)*
- [x] **Phase 4: Workspace & Batch Operations** — Batch runner, @dnd-kit reorder, ZIP download *(2026-10-12)*
- [x] **Phase 5: Compression & Annotations** — 3 compression presets, text/shape editor, page numbers *(2026-10-13)*
- [x] **Phase 6: Metadata, Security & Forms** — Metadata editor, SHA hash, form flattener, unlock *(2026-10-13)*
- [x] **Phase 7: OCR & Conversions** — Tesseract.js OCR, PDF-to-Text, Text-to-PDF *(2026-10-13)*
- [x] **Phase 8: Offline / PWA & Performance** — Service worker, manifest, offline indicator, benchmarks *(2026-10-13)*
- [x] **Phase 9: Local AI Capabilities** — Extractive TextRank summary, BM25 cited Q&A *(2026-10-13)*
- [x] **Phase 10: Release Readiness** — 46/46 tests, WCAG AA contrast, 26 static routes, zero API leaks *(2026-10-13)*
- [x] **Phase 11: Document Comparison & Diagnostics** — Compare PDFs (dual text diff & visual pixel overlay), Repair PDF (xref table rebuild & header/trailer repair) *(2026-10-14)*

### 🔮 Active & Upcoming Expansion Phases (From feature-matrix.md)

#### Phase 12: Digital Signatures & Page Imposition
- [ ] **Sign PDF** (`/tool/sign` — draw bezier stylus, type cursive, or upload transparentized signature)
- [ ] **Pages per Sheet (N-Up)** (`/tool/n-up` — 2, 4, 6, 9 pages grid per printed sheet)
- [ ] **Crop & Resize PDF** (`/tool/crop` — trim white margins, set custom canvas bleed)
- [ ] **Alternate & Mix PDF** (`/tool/alternate-mix` — interleave odd/even pages from multiple PDFs)
- [ ] **Flip PDF** (`/tool/flip` — mirror page orientation horizontally or vertically)

#### Phase 13: True Redaction & Security Hardening
- [ ] **Redact PDF** (`/tool/redact` — irreversible vector/text stream removal, not visual black box)
- [ ] **Auto-Redact PII** (automated regex scan for SSNs, credit cards, emails, phone numbers)
- [ ] **Encrypt PDF** (`/tool/protect` — password protection with user/owner permissions)

#### Phase 14: Asset Extraction & Document Authoring
- [ ] **Extract Images from PDF** (`/tool/extract-images` — parse raw XObject images into ZIP)
- [ ] **Markdown to PDF** (`/tool/markdown-to-pdf` — split-pane editor with vector pagination)
- [ ] **CSV to PDF** (`/tool/csv-to-pdf` — formatted tabular data rendering into PDF table)
- [ ] **Invert PDF Colours** (`/tool/invert-colors` — dark mode, sepia, high-contrast transforms)
- [ ] **Bates Numbering** (`/tool/bates-numbering` — legal sequence indexing with custom prefixes)

#### Phase 15: Camera Scanner & Mobile Capture
- [ ] **Scan to PDF** (`/tool/scan` — live device camera/webcam capture)
- [ ] **Edge Detection, Auto-Cropping & Deskew** (computer vision boundary & perspective correction)
- [ ] **Multi-Page Scan-to-PDF** (continuous mobile capture session bundled to PDF)

#### Phase 16: Business, Billing & Tax Preparation
- [ ] **GST Invoice Generator** (`/tool/invoice-generator` — CGST/SGST calculations, printable PDF)
- [ ] **POS Bill Generator** (`/tool/pos-receipt` — product catalog, cart, thermal receipt printer)
- [ ] **GST Filing Prep** (`/tool/gst-prep` — split, compress, and prep documents for tax portal)

#### Phase 17: Workflow Automation & Advanced Batching
- [ ] **PDF Workflow Builder** (`/tool/workflow` — multi-step pipeline chaining in browser memory)
- [ ] **Batch Watermarking & Page Numbering** (apply stamps across multi-file queues)
- [ ] **Batch Text & Asset Extraction** (bulk extraction to folder/ZIP)
- [ ] **P2P File Share** (`/tool/p2p-share` — WebRTC browser-to-browser direct transfer)

---

## 📜 Activity & Progress Log

| Date | Task Point / Item | Action Taken & Summary | Status | Next Planned Step |
| :--- | :--- | :--- | :--- | :--- |
| **2026-10-09** | **Process Setup & Governance** | Created `process.md` integrating `project-overview.md`. Established pre-action read rule and post-task update rule. Configured `AGENTS.md` workspace rule. | ✅ Complete | Complete Phase 0 setup (static export, Vitest, design tokens). |
| **2026-10-09** | **Modularity & DRY Rule Enforcement** | Added rule capping files at max 160–170 lines of code, mandating sub-component decomposition, DRY principle, and reusable components across `AGENTS.md`, `process.md`, and workspace rules. | ✅ Complete | Continue Phase 0 foundation setup. |
| **2026-10-09** | **shadcn/ui Integration** | Initialized shadcn/ui CLI (`base-nova`, `@base-ui/react`, Lucide icons, `tw-animate-css`, `cn` helper, button primitive), configured Tailwind CSS v4 variables in `globals.css`, and verified `npm run build`. | ✅ Complete | Configure static export compatibility & test tooling. |
| **2026-10-09** | **Distinctive Theme Implementation** | Designed and implemented Paper & Terracotta (Light) and Charcoal & Ember (Dark) themes with anti-FOUC script, local storage persistence, modular UI components (Header, Footer, Hero, Dropzone, ToolCard, ToolsDirectory, WorkspacePreview), and verified via browser testing. All files strictly under 160 lines. | ✅ Complete | Configure static export (`output: 'export'`) & Vitest test setup. |
| **2026-10-10** | **Phase 2: File Handling & PDF Preview** | Implemented client-side PDF file validation (MIME, ext, size, `%PDF-` magic bytes), local PDF.js integration with offline worker/cmaps, HiDPI canvas renderer with cancellation tokens, thumbnail generator & sidebar, zoom/rotate/page toolbar, password dialog, corrupted error handling, and test fixtures. All files strictly under 160 lines. Verified via Vitest (7 tests) and browser subagent end-to-end. | ✅ Complete | Phase 3: First Working PDF Tools (Merge, Rotate, Extract, Split, etc.). |
| **2026-10-12** | **Phase 3: First Working PDF Tools** | Implemented and verified all 7 core PDF tools: 1. Merge PDF (`pdf-lib`), 2. Rotate PDF (`pdf-lib`), 3. Extract Pages (`pdf-lib`), 4. Split PDF by ranges (`pdf-lib`, `fflate`), 5. Delete & Reorder Pages (`pdf-lib`), 6. Images to PDF (`pdf-lib`), 7. PDF Pages to Images (PDF.js / Canvas, `fflate` ZIP). Added typed operations adapters, static App Router tool pages (`/tool/[toolId]`), and reusable tool layout & action bars. All files under 160 lines. 14 Vitest unit tests passed; browser subagent verified. | ✅ Complete | Phase 4: Workspace Quality & Batch Operations. |
| **2026-10-12** | **App Router Suspense Boundary Alignment** | Resolved Next.js PPR / prerender warning in `/tool/[toolId]` by decoupling static layout prerendering from dynamic route param resolution via `<Suspense fallback={<ToolLoadingFallback />}>`. Verified 0 build/lint warnings across all 12 static routes. | ✅ Complete | Phase 4: Workspace Quality & Batch Operations. |
| **2026-10-12** | **Phase 4: Workspace Quality & Batch Operations** | Implemented multi-file batch execution engine (`batch-runner.ts`) with per-file status/progress, error isolation, AbortController cancellation, and ZIP bundling. Built accessible drag-and-drop sortable components (`@dnd-kit`), upgrading Merge and Reorder tools. Added dedicated Batch Operations tool (`/tool/batch`). 18 Vitest unit tests passed; browser subagent verified. All files strictly under 160 lines. | ✅ Complete | Phase 5: Compression & Basic Editing. |
| **2026-10-13** | **Phase 5: Compression & Basic Editing** | Implemented client-side PDF compression engine with 3 presets and honest size metrics (`compress.ts`, `CompressStatsCard`), diagonal/horizontal text watermarks (`watermark.ts`), flexible page numbering & headers/footers (`page-numbering.ts`), and full in-browser visual annotator (`edit-tool-view.tsx`, `annotate.ts`) with text, shapes, freehand drawing, and undo/redo history. Built dedicated UI views at `/tool/compress`, `/tool/watermark`, `/tool/page-number`, and `/tool/edit`. 23 Vitest tests passing; 0 ESLint warnings; 17 static routes built; verified via browser subagent. All files strictly under 165 lines. | ✅ Complete | Phase 6: Metadata, Security & Forms. |
| **2026-10-13** | **Visual Editor Polish: Modal & Circle Tool** | Replaced browser `window.prompt` alert with dedicated `TextAnnotationModal` (presets, font sizes, colors, Enter/Esc accessibility). Fixed circle tool pointer-drag creation and SVG live rendering. | ✅ Complete | Phase 6: Metadata, Security & Forms. |
| **2026-10-13** | **Visual Editor: Reposition & Move Controls** | Added 'Select & Move' tool, draggable repositioning for text/shapes/drawings, directional HUD nudge buttons (← → ↑ ↓), and keyboard shortcut support (Arrow keys, Delete). All files under 170 lines. | ✅ Complete | Ready for Phase 6 (Metadata, Security & Forms). |
| **2026-10-13** | **Homepage Streamline** | Removed legacy Phase 1 static mock `WorkspacePreview` from `page.tsx` and re-routed header 'Workspace' navigation link to active live workspace (`HomePreviewSection` with `#workspace`). | ✅ Complete | Ready for Phase 6 (Metadata, Security & Forms). |
| **2026-10-13** | **Test Fixtures Refinement** | Converted development 'Phase 2 Test Fixtures' bar in `HomePreviewSection` into a clean consumer-facing 'Try with a sample 3-page PDF' trigger. | ✅ Complete | Ready for Phase 6 (Metadata, Security & Forms). |
| **2026-10-13** | **Phase 6: Metadata, Security & Forms** | Implemented client-side PDF metadata inspection, editing, and complete privacy sanitization/stripping (`metadata.ts`, `/tool/metadata`). Added Web Crypto hash calculations (SHA-256, SHA-1, SHA-384, SHA-512) and real-time reference checksum verification (`hash.ts`, `/tool/hash`). Implemented AcroForm field inspection, value editing, and permanent vector flattening (`forms.ts`, `/tool/flatten`). Added encryption inspection and client-side password unlocking (`security.ts`, `/tool/unlock`). Built reusable `Input` and `Label` primitives. All files strictly under 160 lines. 28 Vitest tests passed, 0 ESLint warnings, 21 static App Router pages built, verified via live browser subagent. | ✅ Complete | Phase 7: OCR & Advanced Conversions (Tesseract.js). |
| **2026-10-13** | **Phase 8: Offline / PWA & Performance** | Implemented Progressive Web App (PWA) infrastructure with standalone installable manifest (`manifest.json`), high-res vector icon (`icon.svg`), and service worker precaching (`sw.js`). Added live connectivity tracking with offline warning banner (`useOnlineStatus`, `OfflineIndicator`), interactive header PWA install button (`PwaInstallButton`), and performance benchmark / file size guardrails (`benchmark.ts`). All files strictly under 160 lines. 36 Vitest tests passing, 0 ESLint warnings, 24 static App Router pages built, verified via live browser subagent. | ✅ Complete | Phase 9: Optional Local AI Capabilities. |
| **2026-10-13** | **Brand Logo Integration (`icon.svg`)** | Integrated vector brand mark (`icon.svg`) across the application Header and Footer brand lockups, replacing generic placeholder iconography with unified brand visuals. All files under 60 lines. Verified via live browser subagent. | ✅ Complete | Ready for Phase 9: Optional Local AI Capabilities. |
| **2026-10-13** | **Phase 9: Local AI Capabilities** | Built on-device extractive document summarization with TextRank and entity detection (`text-rank-summarizer.ts`, `/tool/summary`), BM25 passage-based document Q&A with page citations (`document-qa.ts`, `/tool/chat`), and WebGPU/hardware telemetry (`hardware-check.ts`). 100% client-side memory execution without server API calls. 41 Vitest tests passing, 0 ESLint warnings, 26 static routes built, verified via browser subagent. All files strictly under 140 lines. | ✅ Complete | Phase 10: Release Readiness & Quality Gates. |
| **2026-10-13** | **Phase 10: Release Readiness & Quality Gates** | Comprehensive quality audit: added edge-case stress test suite (`phase10-quality-gates.test.ts` for corrupt bytes, zero-length files, mixed page orientations/dimensions, UTF-8/emoji metadata, and unusual whitespace), verified mobile (375px/412px) and desktop (1280px/1920px) viewports with zero horizontal overflow, checked WCAG AA contrast and ARIA labels (`PwaInstallButton`, `ThemeToggle`), created full project documentation in `README.md`, and passed all quality gates: 46/46 unit tests passing across 9 suites, 0 ESLint warnings, and 26 static App Router routes compiled cleanly. | ✅ Complete | Roadmap exploration (Phases 11–15). |
| **2026-10-13** | **Future Expansion Roadmap (Phases 11–15)** | Researched and structured Candidate Phases 11–15 in `future-phases.md` and `process.md`: Document Comparison, Sign & Stamp Studio, Asset Extraction & Markdown-to-PDF, True Redaction, and Print Imposition. | ⏳ Pending User Decision | Await user selection to proceed with next phase. |
| **2026-10-14** | **Phase 11: Document Comparison & Diagnostics** | Built and verified Compare PDFs (`/tool/compare`) with Myers LCS word diffing, unified/side-by-side changelogs, and canvas visual pixel diff heatmap overlays. Built Repair PDF (`/tool/repair`) with header anomaly stripping, `%%EOF` trailer terminator fixes, xref table rebuilds, and diagnostic report cards. Added 8 new unit tests (54/54 tests passing across 10 suites), 0 ESLint warnings, 28 static App Router routes compiled cleanly, verified end-to-end via Chrome browser subagent. All files strictly under 155 lines. | ✅ Complete | Ready for Phase 12: Digital Signatures & Page Imposition (`/tool/sign`, `/tool/n-up`). |





