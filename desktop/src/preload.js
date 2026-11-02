'use strict';

const { contextBridge, ipcRenderer } = require('electron');

/**
 * The whole privileged surface available to the page, and nothing else.
 *
 * Note what is absent: no path argument anywhere. The renderer can ask the
 * user to choose a file and ask the user where to save one, but it cannot
 * name a location itself, so a bug or injected script in the page cannot
 * reach the filesystem on its own.
 */
contextBridge.exposeInMainWorld('filemeloDesktop', {
  /** True when running inside the desktop shell rather than a browser. */
  isDesktop: true,

  platform: process.platform,

  /** Opens a native picker. Resolves to [{ name, size, bytes }]. */
  openDocuments: () => ipcRenderer.invoke('dialog:openDocuments'),

  /**
   * Offers a native save dialog for bytes the page produced.
   * @param {{name: string, bytes: Uint8Array}} payload
   */
  saveDocument: (payload) => {
    if (!payload || !(payload.bytes instanceof Uint8Array)) {
      return Promise.reject(new TypeError('saveDocument expects { name, bytes: Uint8Array }'));
    }
    return ipcRenderer.invoke('dialog:saveDocument', {
      name: String(payload.name || 'document.pdf'),
      bytes: payload.bytes,
    });
  },

  /** Reveals a previously saved file in Finder/Explorer, by name. */
  revealFile: (name) => ipcRenderer.invoke('shell:revealFile', String(name || '')),
});
