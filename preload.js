const { contextBridge, ipcRenderer, clipboard } = require('electron');

contextBridge.exposeInMainWorld('swift', {
    isElectron: true,
    platform: process.platform,
    versions: {
        electron: process.versions.electron,
        chrome: process.versions.chrome,
        node: process.versions.node,
    },
    setPrivacy: (opts) => ipcRenderer.send('swift:set-privacy', opts),
    clearData: () => ipcRenderer.invoke('swift:clear-data'),
    encrypt: (plain) => ipcRenderer.invoke('swift:encrypt', plain),
    decrypt: (b64) => ipcRenderer.invoke('swift:decrypt', b64),
    openExternal: (url) => ipcRenderer.send('swift:open-external', url),
    readClipboardText: () => clipboard.readText(),
    controlWindow: (action) => ipcRenderer.invoke('swift:window-control', action),
    isWindowMaximized: () => ipcRenderer.invoke('swift:is-maximized'),
    listDownloads: () => ipcRenderer.invoke('swift:downloads-list'),
    cancelDownload: (id) => ipcRenderer.invoke('swift:downloads-cancel', id),
    removeDownload: (id) => ipcRenderer.invoke('swift:downloads-remove', id),
    onDownloadsUpdated: (cb) => {
        const handler = (_e, items) => { try { cb(Array.isArray(items) ? items : []); } catch {} };
        ipcRenderer.on('swift:downloads-updated', handler);
        return () => ipcRenderer.removeListener('swift:downloads-updated', handler);
    },
    listExtensions: (partition) => ipcRenderer.invoke('swift:extensions-list', partition),
    installExtension: (partition) => ipcRenderer.invoke('swift:extension-install', partition),
    installExtensionFromUrl: (partition, url) => ipcRenderer.invoke('swift:extension-install-url', partition, url),
    setExtensionEnabled: (partition, key, enabled) => ipcRenderer.invoke('swift:extension-set-enabled', partition, key, enabled === true),
    removeExtension: (partition, key) => ipcRenderer.invoke('swift:extension-remove', partition, key),
    onWindowState: (cb) => {
        const handler = (_e, maximized) => { try { cb(maximized); } catch {} };
        ipcRenderer.on('swift:window-state', handler);
        return () => ipcRenderer.removeListener('swift:window-state', handler);
    },
    onOpenTab: (cb) => {
        const handler = (_e, url) => { try { cb(url); } catch {} };
        ipcRenderer.on('swift:open-tab', handler);
        return () => ipcRenderer.removeListener('swift:open-tab', handler);
    },
});
