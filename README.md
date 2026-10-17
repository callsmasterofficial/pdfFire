# PDFfire — PDF Tools That Just Work

**PDFfire** is a modern, fast, and privacy-first browser-based PDF productivity toolkit built with Next.js App Router, TypeScript, and Tailwind CSS. All document manipulation, conversions, compression, OCR, and editing execute strictly in your device's browser memory — zero files are ever transmitted to any remote server or cloud API.

---

## 🔒 Privacy & Architecture Guardrails

- **Zero Server Uploads:** All document processing runs directly in local browser memory via WebAssembly, PDF.js, and pdf-lib.
- **No Backend Server:** No server-side PDF manipulation, no API routes, no remote database, and no cloud file persistence.
- **Offline / PWA Ready:** Installable Progressive Web App with service worker asset precaching and live network monitoring.
- **Honest Metrics:** Accurate file compression metrics, honest page bounds detection, and full privacy metadata sanitization.

---

## 🛠️ Tool Catalog (20+ In-Browser Tools)

1. **Organize:** Merge PDFs, Split by Range, Rotate Pages, Extract Pages, Delete & Reorder Pages.
2. **Convert:** Images to PDF (JPG/PNG/WebP), PDF Pages to Images (ZIP archive), PDF to Text, Text to PDF.
3. **Edit & Annotate:** Visual Annotator (text, shapes, pencil drawing, undo/redo), Watermark PDF, Page Numbers & Headers.
4. **Optimize:** Client-Side PDF Compression (Honest metric presets: Light, Balanced, Strong).
5. **Security & Utilities:** Inspect & Strip Metadata, Password Unlock, AcroForm Flattening, SHA-256 Checksum Verification.
6. **Diagnostics & Comparison:** PDF Diff (Myers LCS text comparison & side-by-side view), Visual Pixel Diff Heatmap Overlay, Corrupt PDF Repair & Diagnostics.
7. **OCR:** Client-side optical character recognition via Tesseract.js with multi-language pack support.
8. **AI & Insights:** On-device TextRank document summarization, entity extraction, and BM25 cited Q&A.

---

## 🎨 Brand & Design System

- **Brand:** PDFfire
- **Tagline:** PDF tools that just work.
- **Color Palette:** Ember Orange (`#FF7047`), Charcoal Black (`#171614`), Warm Off-White (`#FAF7F2`), Neutral Gray (`#77716A`).
- **Brand Guidelines:** See [docs/brand-guidelines.md](docs/brand-guidelines.md) for full identity specifications and logo asset usage.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18.18+ or 20+
- npm or pnpm

### Installation

```bash
# Clone repository
git clone https://github.com/your-repo/pdffire.git
cd pdffire

# Install dependencies
npm install
```

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality Gates & Verification

```bash
# Run unit & integration test suites
npm test

# Run ESLint validation
npm run lint

# Production build and static prerendering
npm run build
```

---

## 📄 License

MIT License. Designed with privacy as an architectural guarantee.
