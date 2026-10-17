# PDFfire — Project Overview

> **Project status:** Active Development  
> **Product type:** Browser-based PDF productivity toolkit  
> **Architecture:** Client-side processing; no application backend for PDF operations  
> **Official name:** PDFfire (formerly PDFForge)

## 1. Project Vision

Build a polished, privacy-first, all-in-one PDF toolkit inspired by products such as iLovePDF and ihatepdf.cv. Users should be able to open the website, select a PDF or image from their device, perform a supported operation in their browser, and download the result without uploading document contents to a server.

The product should grow into a broad catalog of PDF utilities while maintaining a consistent user experience, reliable file processing, accessible design, and clear privacy communication.

## 2. Primary Goals

- Process supported files entirely in the user's browser.
- Do not build a backend, database, server API, authentication system, or cloud file storage for the initial product.
- Provide a responsive and accessible interface for desktop, tablet, and mobile.
- Create reusable UI and processing infrastructure so new tools can be added without duplicating entire workflows.
- Handle errors, unsupported files, large documents, and browser memory limitations gracefully.
- Keep tool claims honest: a tool is not complete until its processing logic and output have been tested.
- Support static deployment and progressively add offline/PWA capabilities.

## 3. Non-Goals for the Initial Version

Do not introduce the following unless the project scope is explicitly changed:

- Node.js/Express API or Next.js API routes
- Server Actions used for document processing
- PostgreSQL, MongoDB, Prisma, Redis, or BullMQ
- Server-side PDF processing or cloud document uploads
- User accounts, subscriptions, payments, or cross-device sync
- External AI APIs that receive document contents by default

The site still needs static hosting to deliver its app assets. “No backend” means the application does not depend on a custom server to process users' documents.

## 4. Technology Stack

### Core application

- **Next.js App Router** with static export where compatible
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui** for accessible UI primitives
- **Lucide React** for icons

### PDF processing and preview

- **pdf-lib** for supported PDF manipulation and generation
- **PDF.js (`pdfjs-dist`)** for rendering, preview, thumbnails, zoom, and text selection
- **Web Workers** for CPU-intensive work that should not block the UI
- **WebAssembly engines** only where a specific feature needs them and browser compatibility has been tested
- **Canvas API** for rendering pages to images
- **Blob and object URL APIs** for local downloads

### State, validation, and utilities

- **Zustand** for shared workspace state when needed
- **Zod** for validating tool settings and operation inputs
- **React Hook Form** for more involved settings forms
- **@dnd-kit** for drag-and-drop page/file ordering
- **fflate** for creating ZIP archives of multiple outputs
- **localStorage** only for non-sensitive preferences
- **IndexedDB** only when a feature genuinely needs larger local persistence; do not persist documents by default

### Testing and quality

- **Vitest** for unit tests
- **React Testing Library** for component tests
- **Playwright** for browser end-to-end tests
- ESLint and TypeScript checks

### Deployment

- Static hosting such as Vercel or another static host compatible with the chosen export setup
- Optional PWA support with a service worker after the core app works

### Important compatibility note

Do not assume that every library supports every PDF operation. Test each proposed engine and its licensing, browser compatibility, bundle size, memory requirements, encryption behavior, and output quality before committing to it. Advanced compression, Office document conversion, OCR, secure redaction, and digital signatures require separate capability assessments.

## 5. Product Feature Catalog

The following is the long-term catalog. Implement features phase by phase; listing a feature here does not mean it is already implemented.

### Organize PDF

- Merge PDFs
- Split PDFs by page range
- Split every page into a separate PDF
- Extract selected pages
- Delete pages
- Reorder pages using drag and drop
- Rotate pages
- Duplicate pages
- Reverse page order
- Insert blank pages
- Insert pages from another PDF
- Preview pages and thumbnails

### Compress and optimize

- Compress PDF with available quality options
- Optimize supported PDF resources
- Downsample images where a suitable engine is available
- Compare input and output file sizes
- Show size reduction and percentage saved
- Remove metadata
- Flatten supported forms and annotations
- Attempt repair of supported malformed PDFs

Compression must not promise a smaller result for every file. Preserve the original until the user downloads or explicitly replaces it.

### Convert files

- Images to PDF
- PDF pages to PNG/JPEG
- PDF to text
- Extract images from PDFs
- HTML/text/Markdown to PDF where browser-based implementation is practical
- PDF to Word, Excel, PowerPoint, HTML, Markdown, SVG, or EPUB only after selecting and validating a compatible local conversion engine

### Edit PDF

- Add text overlays
- Add images
- Highlight, underline, and strike through text where supported
- Draw freehand marks and shapes
- Add comments or notes
- Add page numbers, headers, and footers
- Add text/image watermarks
- Crop pages
- Change page dimensions where supported
- Fill existing form fields
- Add signature images or drawn signatures
- Undo and redo editor actions

Do not describe text overlays as editing existing PDF text. Editing existing text while preserving layout is a separate, more complex capability.

### Security and document utilities

- Protect PDFs with a password when supported by a tested engine
- Open encrypted PDFs when the user supplies the correct password and the engine supports the operation
- Inspect PDF metadata and permissions
- Remove metadata and selected annotations
- Calculate SHA-256 checksums
- Compare document text or rendered pages
- Redact content only when the implementation securely removes underlying content and validates the output
- Verify supported digital signatures only if a reliable local implementation is selected

A drawn signature is not a cryptographic digital signature. Covering text with a black shape is not secure redaction.

### OCR and advanced tools

- OCR scanned pages using a browser-compatible engine such as Tesseract.js
- Generate searchable PDFs when supported
- Select OCR language data
- Extract recognized text
- Deskew or rotate scans where supported
- Local document summaries, question answering, translation, flashcards, and quizzes as future features

AI functionality must remain local if the product claims the document never leaves the device. Do not send extracted text to an external API without explicit disclosure and user consent.

### Productivity and platform experience

- Batch processing for supported operations
- ZIP download for multiple outputs
- Progress, cancellation where supported, retry, and clear error states
- Tool search and category navigation
- Popular/recent tool shortcuts stored locally when appropriate
- Light and dark themes
- Responsive and keyboard-accessible UI
- Tool-specific instructions and FAQs
- Privacy page explaining local processing and any exceptions
- PWA installation and offline support after initial asset caching

## 6. Development Principles

1. **Local-first:** PDF contents must not be uploaded for processing.
2. **Feature truthfulness:** only show a tool as functional when its processing engine is implemented and tested.
3. **Reusable architecture:** tools should use shared file input, validation, workspace, progress, error, and download components.
4. **Progressive enhancement:** begin with dependable browser capabilities; add WebAssembly or specialized engines only when needed.
5. **Memory awareness:** large PDFs can exhaust browser memory. Set reasonable limits, avoid unnecessary copies, release object URLs and buffers, and use workers where appropriate.
6. **Privacy by default:** do not store selected documents in local storage or IndexedDB unless the user explicitly uses a feature that requires it.
7. **Accessible UI:** keyboard support, visible focus, meaningful labels, sufficient contrast, and understandable error messages.
8. **Quality gates:** type checks, linting, unit tests, and end-to-end tests must pass for each phase.
9. **Static deployment:** avoid runtime server features that break the backend-free architecture. Verify workers, WASM files, fonts, and other assets on the production host.
10. **Licensing:** check licenses and distribution requirements for every third-party library and engine.

## 7. Suggested High-Level Architecture

```text
Next.js static application
├── Public pages and tool directory
├── Reusable PDF workspace UI
├── Shared file input and validation
├── Operation registry and tool settings
├── PDF.js rendering/preview layer
├── Processing adapters
│   ├── pdf-lib operations
│   ├── Canvas/image operations
│   └── Optional WebAssembly/local engines
├── Web Workers for supported heavy operations
└── Local output generation and downloads
```

Keep PDF manipulation behind small, typed processing adapters. UI components should not directly contain complex PDF algorithms. Each operation should have typed inputs, a result shape, clear errors, and tests.

## 8. Project Phases

Work sequentially. Complete and verify each phase before moving to the next. Do not try to implement the full catalog in one pass.

### Phase 0 — Repository and project foundation

- Initialize Next.js, TypeScript, Tailwind CSS, and the chosen UI component setup.
- Configure linting, formatting if selected, path aliases, and test tooling.
- Configure static export only after confirming the required Next.js features are compatible.
- Establish the folder structure and design tokens for light/dark themes.
- Add a README with setup and development commands.

**Exit criteria:** app starts locally; type checks and linting pass; production/static build succeeds with no server-only dependencies.

### Phase 1 — Design system and homepage

- Build the responsive application shell and navigation.
- Build homepage hero, file drop zone, category sections, popular tools, and searchable tool directory.
- Create reusable tool cards and tool-page layouts.
- Add loading, empty, error, and unsupported-file states.
- Add light and dark themes with consistent typography, spacing, and accessible contrast.

**Exit criteria:** responsive pages work across desktop/tablet/mobile; navigation and search work; no PDF operation is falsely presented as functional.

### Phase 2 — File handling and PDF preview

- Create a shared file selection and drag-and-drop component.
- Validate MIME type, extension, file count, and size while treating these checks as input validation rather than a security guarantee.
- Load PDFs locally and render pages using PDF.js.
- Build page thumbnails, zoom, page navigation, loading indicators, and preview errors.
- Ensure document contents are not sent in network requests.
- Define cleanup behavior for workers, buffers, and object URLs.

**Exit criteria:** supported PDFs preview locally; invalid, encrypted, malformed, and oversized files produce clear messages; network inspection confirms the app does not upload document contents during preview.

### Phase 3 — First working PDF tools

Implement and test these tools in order:

1. Merge PDF
2. Rotate PDF
3. Extract pages
4. Split PDF by ranges
5. Delete and reorder pages
6. Images to PDF
7. PDF pages to images

Use pdf-lib for supported manipulations and PDF.js/Canvas for rendering. Build reusable settings, progress, result summary, and download components.

**Exit criteria:** each tool processes real files locally, preserves expected page order/content, handles invalid input, and has automated tests plus manual browser verification.

### Phase 4 — Workspace quality and batch operations

- Improve drag-and-drop ordering and page selection.
- Add multi-file processing for supported operations.
- Add ZIP output downloads where useful.
- Add clear progress/error/success states and cancellation where technically possible.
- Test large documents and reduce avoidable memory copies.
- Add keyboard accessibility and mobile usability refinements.

**Exit criteria:** batch jobs behave predictably, failures are isolated and reported, and memory is cleaned up after jobs finish.

### Phase 5 — Compression and basic editing

- Evaluate and integrate a browser-compatible compression engine if necessary.
- Implement compression presets only when the engine supports them.
- Show before/after size and warn when compression offers little or no improvement.
- Add text/image overlays, drawing, shapes, watermarks, and page numbers.
- Add undo/redo for editor actions if the editor model supports it.

**Exit criteria:** compression quality is measured against a test corpus; edits are visible in downloaded files; UI does not claim to modify existing text when it only adds overlays.

### Phase 6 — Metadata, security, and forms

- Inspect and edit supported metadata.
- Add password protection/unlocking only after engine capability and compatibility testing.
- Add form filling and flattening where supported.
- Investigate secure redaction and signature verification as separate, security-sensitive features.
- Add explicit warnings for unsupported encryption and signature cases.

**Exit criteria:** security-sensitive operations are tested against known sample files and their outputs are validated. Do not ship insecure visual-only redaction as real redaction.

### Phase 7 — OCR and advanced conversions

- Integrate local OCR and language packs.
- Add text extraction and searchable PDF output where supported.
- Benchmark language-data download size, CPU usage, memory, and accuracy.
- Research local Office document conversion engines and validate layout fidelity before implementing public tool pages.
- Add more conversion formats only when there is a reliable in-browser engine.

**Exit criteria:** supported languages and file types are documented; unsupported inputs fail clearly; conversion fidelity has been evaluated with representative files.

### Phase 8 — Offline/PWA and performance

- Add a service worker and installable PWA if useful.
- Cache the app shell and required processing assets deliberately.
- Test supported operations with the network disconnected after initial caching.
- Ensure workers and WASM assets work in the deployed environment.
- Add performance measurements and browser compatibility testing.

**Exit criteria:** documented tools work offline when their assets are cached; cache updates and failures are handled gracefully; large-file limits are documented.

### Phase 9 — AI and optional advanced features

- Evaluate on-device model runtimes and browser hardware support.
- Add local summarization or document Q&A only if model size, speed, and output quality are acceptable.
- Keep AI features optional and separate from core PDF processing.
- Never transmit document content to an external provider without clear disclosure and explicit consent.

**Exit criteria:** AI privacy behavior is explicit, model limitations are documented, and core PDF tools remain usable without AI.

### Phase 10 — Release readiness

- Test Chrome, Firefox, Safari, and mobile browsers where feasible.
- Test malformed PDFs, encrypted files, huge files, mixed page sizes, embedded fonts, and unusual images.
- Run accessibility checks and keyboard-only workflows.
- Review third-party licenses and attribution.
- Verify static deployment, asset paths, privacy statements, error tracking configuration, and download behavior.
- Document known limitations and supported browsers.

**Exit criteria:** production build passes, critical flows have end-to-end tests, privacy claims match observed network behavior, and known limitations are communicated clearly.

## 9. Definition of Done for Every Tool

A tool is complete only when:

- Its UI and settings are implemented.
- Its processing logic works locally in the browser.
- Input validation and clear error states exist.
- Output is downloadable and opens correctly in a PDF reader when applicable.
- Page order, orientation, and expected content are verified.
- Tests cover normal, edge, and failure cases.
- Network inspection confirms document contents are not uploaded.
- Large-file and memory behavior has been considered.
- Accessibility and responsive behavior have been checked.
- Its limitations are documented.

## 10. Instructions for AI Coding Agents

When working on this repository:

1. Read this `project-overview.md` before making changes.
2. Identify the current phase and implement only the requested phase or task.
3. Inspect the existing code before creating or replacing files.
4. Do not rewrite unrelated code or add dependencies without a clear reason.
5. Preserve the client-only architecture. Do not add an API route, server action, database, authentication, cloud storage, or server processing unless the project requirements are explicitly changed.
6. Keep PDF processing in dedicated, typed modules or worker adapters; keep UI components focused on presentation and interaction.
7. Do not create fake tool pages or placeholder actions that imply a tool works when it does not.
8. Prefer small, reviewable changes and reusable components.
9. Run relevant tests, linting, type checks, and production build; report exactly what passed and what could not be verified.
10. If a feature cannot reliably run in-browser, explain the constraint and propose options before adding a backend dependency.
11. Update project documentation when implementation status or supported capabilities change.
12. Do not mark a phase complete unless its exit criteria have been verified.

## 11. Initial Implementation Order

Start with **Phase 0**, then Phase 1, then Phase 2. Do not start advanced PDF operations until the shared file handling and preview layer are reliable. The first end-to-end feature should be **Merge PDF**, followed by Rotate PDF and Extract/Split PDF.

The project should remain a browser-first, privacy-focused PDF toolkit throughout development. Reliability, honest feature claims, and local processing take priority over maximizing the number of tools listed on the homepage.
