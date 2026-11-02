# FileMelo Desktop

The FileMelo web build running locally in a hardened Electron shell, so
documents are processed on the machine with no server involved.

Why Electron rather than Tauri is recorded in
[`../docs/desktop-shell-decision.md`](../docs/desktop-shell-decision.md),
including what that choice costs.

## Running it

The desktop app ships the site's static export, so build the site first:

```bash
npm run build          # in the repo root, produces out/
```

```bash
cd desktop && npm install && npm start
```

`npm start` runs `sync-web` (copying `out/` into `desktop/web/`) and then
launches Electron. Use `npm run start:nosync` to relaunch without re-copying.

`desktop/web/` is generated and git-ignored; it is a snapshot of a specific
site build rather than a live reference into the parent tree.

## How it is put together

```
desktop/
  src/main.js      main process: protocol, security policy, IPC
  src/preload.js   the entire privileged surface exposed to the page
  scripts/         sync-web.mjs
  web/             generated — the site's export
```

The page is served over a custom `filemelo://` scheme rather than `file://`.
That matters: `file://` gives an opaque origin, which disables the workers and
WebAssembly the PDF and OCR engines depend on. The custom standard scheme
gives a real, secure origin.

## Security posture

Electron is permissive by default, so each of these is deliberate:

- Renderer is sandboxed and context-isolated with no Node integration. From
  the page, `window.require`, `window.process` and `window.electron` are all
  `undefined`.
- Every response carries a CSP: `default-src 'self'`, `script-src 'self'
  'wasm-unsafe-eval'`, `object-src 'none'`, `frame-ancestors 'none'`.
  `wasm-unsafe-eval` allows WebAssembly without allowing `eval()`.
- Every external request is denied. The app loads zero remote resources.
- Requests are contained to the web root, so `../` cannot escape it.
- Navigation off `filemelo://app` is cancelled; external links open in the
  system browser; camera, microphone and location requests are refused.

### The IPC contract takes no paths

`window.filemeloDesktop` is the whole privileged surface:

| Member | Purpose |
|---|---|
| `isDesktop`, `platform` | tell the web app it is running in the shell |
| `openDocuments()` | native picker; resolves to `[{ name, size, bytes }]` |
| `saveDocument({ name, bytes })` | native save dialog for bytes the page made |
| `revealFile(name)` | reveal a just-saved file in Finder/Explorer |

None of these accepts a filesystem path. The renderer can ask the user to
choose a file and ask the user where to put one, but cannot name a location
itself — so a bug or injected script in the page cannot reach the filesystem
on its own.

## Known gap: OCR needs the network

`tesseract.js` fetches its WASM core and language data from a CDN unless given
local paths, and the site does not give it any. Because this shell blocks
external requests, **OCR fails here rather than quietly downloading**.

That is the honest failure mode, but it is still a broken tool, and the same
dependency exists on the website where it is less visible. Fixing it means
bundling the core and language data — roughly 25 MB for English alone. See the
decision record.

## Not built yet

Installers, checksums, release metadata, licence notices, code signing and
notarization; file associations, drag-and-drop, printing, recent items, batch
queues and folder watching. Nothing has been run on Windows, and only Apple
Silicon has been exercised.

Builds produced before signing credentials exist must be labelled unsigned and
un-notarized. Never tell users to disable Gatekeeper, SmartScreen or antivirus.
