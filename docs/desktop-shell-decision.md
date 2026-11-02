# Desktop shell: Tauri or Electron

Decision record for FileMelo Desktop, written 2 November 2026 against the
requirement in section 17 of the master prompt to compare both, pick one, and
say why.

**Decision: Electron.** The deciding factor is engine consistency for a
WebAssembly-heavy document pipeline that is already verified on Chromium.
Tauri wins clearly on installer size and would be the better answer for a
lighter app.

## What the desktop app actually is

The site is a Next.js static export (`output: "export"`, 26 MB) that does all
its PDF work in the browser: `pdf-lib`, `pdfjs-dist`, `@pdf-lib/fontkit`,
`fflate`, `@pdfsmaller/pdf-encrypt`, `tesseract.js`. There are 16 WebAssembly
references in `src/`, plus a PDF worker and 9.1 MB of bundled CJK fonts.

So the desktop app is not new product surface. It is that export, running
locally, with native file handling around it. That framing is what makes the
shell choice mostly a question about **which browser engine runs the export**.

## The comparison

| | Electron | Tauri |
|---|---|---|
| **Engine (macOS)** | Chromium, bundled | WKWebView — Safari |
| **Engine (Windows)** | Chromium, bundled | WebView2 — Chromium |
| **Engines to verify** | **one** | **two, one of them never tested here** |
| **Runtime footprint** | 258 MB on disk before packaging | ~10–20 MB + system webview |
| **Toolchain present?** | yes — Node, already used by all three repos | **no** — `rustc` and `cargo` are not installed |
| **Security model** | opt-in hardening: sandbox, context isolation, IPC contract | capability grants and Rust command validation by default |
| **Updates** | Squirrel / electron-updater, we host and sign | built-in updater with signature verification |
| **Maintenance** | we track Chromium CVEs and ship runtime updates | OS ships webview updates; Rust surface is ours |
| **Accessibility** | Chromium's a11y tree, consistent across both OSes | each platform's native webview |

## Why engine consistency decided it

This project has verified its PDF engine against **Chromium** (website, plus
the extension QA across Chrome, Edge and Opera) and **Gecko** (Firefox). It has
never been tested on **WebKit**.

Tauri on macOS means WKWebView. That is a third engine for a pipeline built on
WebAssembly, workers, canvas rendering of PDF pages, and OCR — exactly the
areas where engines differ most. Choosing Tauri would mean re-verifying the
whole tool suite on Safari *and* separately on WebView2, because Tauri does not
give one engine across platforms; it gives whatever each OS ships.

Electron gives one Chromium on both. The QA already done carries over, and
future tool work is verified once rather than twice. For a small team under an
explicit minimum-cost constraint, halving the verification surface is worth
more than the installer size.

The toolchain gap reinforces it but did not decide it: Tauri would need Rust
installed and maintained, and cross-building Windows artifacts from macOS is
meaningfully harder with Tauri than with Electron.

## What choosing Electron costs

Honestly stated, because it is the real downside:

- **Installer size.** 258 MB of runtime before packaging, against roughly
  10–20 MB for Tauri. Users download a far bigger app for the same features.
- **Memory.** A full Chromium per app, rather than a shared system webview.
- **Security maintenance is ours.** Chromium CVEs become our update
  obligation. Tauri would inherit webview patches from the OS.
- **Hardening is opt-in.** Electron is insecure by default; every protection
  below had to be switched on deliberately. Tauri starts closed.

If the app later becomes a thin launcher rather than the full tool suite, this
decision should be revisited — the reasoning above would invert.

## Hardening applied

Because Electron defaults are permissive, these are deliberate:

- Renderer runs with `sandbox: true`, `contextIsolation: true`,
  `nodeIntegration: false`, `nodeIntegrationInWorker: false`, `webviewTag: false`.
  Verified at runtime: `window.require`, `window.process` and `window.electron`
  are all `undefined` in the page.
- Content is served over a **custom `filemelo://` scheme**, not `file://`.
  `file://` gives an opaque origin, which breaks the workers and WASM the
  engines need; the custom standard scheme yields a real, secure origin
  (`isSecureContext: true`, confirmed).
- **Path containment** on every request, so `../` cannot escape the web root.
- A **CSP** on every response: `default-src 'self'`, `script-src 'self'
  'wasm-unsafe-eval'`, `object-src 'none'`, `frame-ancestors 'none'`,
  `base-uri 'none'`, `form-action 'none'`. `wasm-unsafe-eval` permits
  WebAssembly compilation without granting `eval()`.
- **All external requests denied** by `onBeforeRequest`. Boot loads zero
  remote resources; a probe fetch to `https://example.com` is refused.
- Navigation away from `filemelo://app` is cancelled; external links open in
  the system browser; all permission requests (camera, microphone, location)
  are denied.
- **The IPC contract takes no paths.** The renderer can ask the user to pick
  files and ask the user where to save, but cannot name a location itself. A
  compromised page cannot read or write anywhere the user did not choose in a
  native dialog.

Writing the request policy first caught a real mistake: the protocol handler
was fetching its own files over `file://`, which the policy refused — so the
app failed to load until the handler was changed to read bytes directly. The
strict default surfaced it immediately.

## Known gap: OCR is not offline

`src/lib/ocr/ocr-engine.ts` calls `createWorker(language, 1, { logger })` with
no `corePath` or `langPath`. tesseract.js 7 then fetches its WASM core and
language data from `cdn.jsdelivr.net` at first use.

This is already true of the website, where it is less visible. In the desktop
app it is sharper, because external requests are blocked by policy: **OCR will
fail rather than silently download**, which is the honest failure but still a
broken tool.

The document never leaves the device either way — only engine assets are
fetched — but "100% Offline" does not currently hold for OCR on any platform.

Fixing it means bundling the core and the language data and pointing
`corePath`/`langPath` at them locally. For English that is roughly 25 MB added
to every build, and more per additional language. That is a size-versus-truth
tradeoff for the owner, not something to decide silently here.

## Verified

Running on macOS 26.6, Electron 45.2.1, driven over CDP:

- Window loads `filemelo://app/index.html`, title `FileMelo — Private PDF Tools`.
- App hydrates: 49 tool links, brand text present.
- Client-side routing works under the custom scheme — `/tool/merge` renders
  "Merge PDF" with a working file input.
- 10 Next.js chunks load, **every asset local**, zero remote requests at boot.
- WebAssembly and Workers available; secure context true.
- Bridge exposes exactly `isDesktop`, `platform`, `openDocuments`,
  `saveDocument`, `revealFile` and nothing else.

## Not yet done

Installers, checksums, versioned release metadata, licence notices, code
signing and macOS notarization. Signing needs an Apple Developer ID and a
Windows certificate; until those exist, builds must be labelled unsigned and
un-notarized, and users must never be told to bypass Gatekeeper or SmartScreen.

Also outstanding from section 17: open-with/file-association registration,
drag-and-drop, printing, recent items, batch queues, folder watching, and
measured testing on Windows and on Apple Silicon versus Intel. Nothing here has
run on Windows.
