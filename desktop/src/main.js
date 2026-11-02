'use strict';

const {
  app,
  BrowserWindow,
  dialog,
  ipcMain,
  shell,
  protocol,
  session,
} = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');

/**
 * The web build is served over a custom scheme rather than file://.
 *
 * file:// gives an opaque origin, which blocks the workers and WebAssembly the
 * PDF and OCR engines rely on. A standard scheme gives a real origin, keeps
 * the renderer on content we ship, and lets us refuse anything outside it.
 */
const APP_SCHEME = 'filemelo';
const APP_ORIGIN = `${APP_SCHEME}://app`;

/** Directory holding the exported web build. */
const WEB_ROOT = path.join(__dirname, '..', 'web');

const MIME_TYPES = new Map(
  Object.entries({
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.txt': 'text/plain; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.otf': 'font/otf',
    '.wasm': 'application/wasm',
    '.pdf': 'application/pdf',
    '.map': 'application/json; charset=utf-8',
    '.webmanifest': 'application/manifest+json',
  })
);

function contentTypeFor(filePath) {
  return MIME_TYPES.get(path.extname(filePath).toLowerCase()) || 'application/octet-stream';
}

protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

/** Resolve a request path to a file inside WEB_ROOT, or null if it escapes. */
async function resolveWebFile(urlPath) {
  const decoded = decodeURIComponent(urlPath.split('?')[0].split('#')[0]);
  const candidate = path.normalize(path.join(WEB_ROOT, decoded));

  // Containment check: normalize() alone does not stop ../ traversal.
  const root = path.normalize(WEB_ROOT + path.sep);
  if (candidate !== path.normalize(WEB_ROOT) && !candidate.startsWith(root)) {
    return null;
  }

  const attempts = [candidate];
  if (!path.extname(candidate)) {
    attempts.push(`${candidate}.html`, path.join(candidate, 'index.html'));
  }

  for (const attempt of attempts) {
    try {
      const stat = await fs.stat(attempt);
      if (stat.isFile()) return attempt;
    } catch {
      // try the next shape
    }
  }
  return null;
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#FAF7F2',
    title: 'FileMelo',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // The renderer runs untrusted-by-default: no Node, isolated context,
      // sandboxed. Everything privileged crosses the IPC contract below.
      sandbox: true,
      contextIsolation: true,
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      webviewTag: false,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: false,
    },
  });

  win.loadURL(`${APP_ORIGIN}/index.html`);

  // Refuse navigation away from our own content.
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith(`${APP_ORIGIN}/`)) {
      event.preventDefault();
    }
  });

  // External links open in the user's browser, never in a FileMelo window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (/^https?:\/\//i.test(url)) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  // Nothing in this app needs camera, microphone, location or the like.
  win.webContents.session.setPermissionRequestHandler((_wc, _permission, callback) => {
    callback(false);
  });

  return win;
}

app.whenReady().then(() => {
  protocol.handle(APP_SCHEME, async (request) => {
    const { host, pathname } = new URL(request.url);
    if (host !== 'app') {
      return new Response('Not found', { status: 404 });
    }
    const file = await resolveWebFile(pathname === '/' ? '/index.html' : pathname);
    if (!file) {
      return new Response('Not found', { status: 404 });
    }
    const body = await fs.readFile(file);
    const headers = new Headers({ 'Content-Type': contentTypeFor(file) });
    // 'wasm-unsafe-eval' lets the PDF and OCR engines compile WebAssembly
    // without granting full eval(). Everything is same-origin: this app has
    // no remote content by design.
    headers.set(
      'Content-Security-Policy',
      [
        "default-src 'self'",
        "script-src 'self' 'wasm-unsafe-eval'",
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob:",
        "font-src 'self' data:",
        "connect-src 'self' blob: data:",
        "worker-src 'self' blob:",
        "object-src 'none'",
        "frame-ancestors 'none'",
        "base-uri 'none'",
        "form-action 'none'",
      ].join('; ')
    );
    return new Response(body, { status: 200, headers });
  });

  // Deny every request that is not our own content. Nothing in FileMelo should
  // reach the network: documents are processed locally, and a tool that needs
  // a remote asset should fail loudly rather than quietly phone home.
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    const allowed =
      details.url.startsWith(`${APP_SCHEME}://`) ||
      details.url.startsWith('devtools://') ||
      details.url.startsWith('blob:') ||
      details.url.startsWith('data:');
    if (!allowed) {
      console.warn('[filemelo] blocked external request:', details.url.slice(0, 120));
    }
    callback({ cancel: !allowed });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- IPC: a narrow, validated surface ---------------------------------------
// The renderer may ask to open a document the user picks, and to save bytes the
// user names. It cannot name a path itself, so it cannot read or write
// anywhere the user did not choose in a native dialog.

ipcMain.handle('dialog:openDocuments', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const { canceled, filePaths } = await dialog.showOpenDialog(win, {
    title: 'Open documents',
    properties: ['openFile', 'multiSelections'],
    filters: [
      { name: 'Documents and images', extensions: ['pdf', 'png', 'jpg', 'jpeg', 'webp'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  if (canceled) return [];

  const files = [];
  for (const filePath of filePaths) {
    const data = await fs.readFile(filePath);
    files.push({
      name: path.basename(filePath),
      size: data.byteLength,
      // Uint8Array survives the structured clone the context bridge performs.
      bytes: new Uint8Array(data),
    });
  }
  return files;
});

ipcMain.handle('dialog:saveDocument', async (event, payload) => {
  const win = BrowserWindow.fromWebContents(event.sender);

  // Validate rather than trust: the renderer supplies content, not a location.
  if (!payload || typeof payload !== 'object') return { saved: false };
  const suggested = typeof payload.name === 'string' ? path.basename(payload.name) : 'document.pdf';
  const bytes = payload.bytes;
  if (!(bytes instanceof Uint8Array) || bytes.byteLength === 0) {
    return { saved: false, error: 'Nothing to save.' };
  }

  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Save document',
    defaultPath: suggested,
  });
  if (canceled || !filePath) return { saved: false };

  await fs.writeFile(filePath, bytes);
  return { saved: true, name: path.basename(filePath) };
});

ipcMain.handle('shell:revealFile', async (_event, name) => {
  // Only ever reveals something the user just saved, by name, under Downloads.
  if (typeof name !== 'string' || !name) return false;
  const guess = path.join(app.getPath('downloads'), path.basename(name));
  try {
    await fs.stat(guess);
    shell.showItemInFolder(guess);
    return true;
  } catch {
    return false;
  }
});
