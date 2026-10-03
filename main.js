const { app, BrowserWindow, shell, session, ipcMain, safeStorage, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { Readable, Transform } = require('stream');
const { pipeline } = require('stream/promises');
const yauzl = require('yauzl');

let mainWindow;
const extensionSessions = new Set();

const downloads = new Map();
const downloadSessions = new WeakSet();

function isMainRenderer(event) {
    return Boolean(mainWindow && !mainWindow.isDestroyed() && event.sender === mainWindow.webContents);
}

function downloadsDirectory() {
    return path.resolve(app.getPath('downloads'));
}

function isRegisteredDownloadPath(filePath) {
    const root = downloadsDirectory();
    const resolved = path.resolve(filePath);
    return resolved.startsWith(root + path.sep) && resolved !== root;
}

function uniqueDownloadPath(fileName) {
    const root = downloadsDirectory();
    fs.mkdirSync(root, { recursive: true });
    const safeName = path.basename(String(fileName || 'download')) || 'download';
    const ext = path.extname(safeName);
    const stem = path.basename(safeName, ext) || 'download';
    let candidate = path.join(root, safeName);
    let index = 1;
    while (fs.existsSync(candidate) || [...downloads.values()].some(item => item.path === candidate)) {
        candidate = path.join(root, `${stem} (${index++})${ext}`);
    }
    return candidate;
}

function downloadSnapshot(record) {
    return {
        id: record.id,
        name: record.name,
        receivedBytes: record.receivedBytes,
        totalBytes: record.totalBytes,
        state: record.state,
        speed: record.speed,
        path: record.path,
    };
}

function sendDownloads() {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('swift:downloads-updated', [...downloads.values()].map(downloadSnapshot));
    }
}

function setupDownloadsForSession(ses) {
    if (!ses || downloadSessions.has(ses)) return;
    downloadSessions.add(ses);
    ses.on('will-download', (_event, item) => {
        const id = randomUUID();
        const targetPath = uniqueDownloadPath(item.getFilename());
        const record = {
            id,
            item,
            name: path.basename(targetPath),
            path: targetPath,
            receivedBytes: 0,
            totalBytes: item.getTotalBytes(),
            speed: 0,
            state: 'progressing',
            lastBytes: 0,
            lastAt: Date.now(),
        };
        downloads.set(id, record);
        item.setSavePath(targetPath);
        item.on('updated', (_updatedEvent, state) => {
            const now = Date.now();
            const received = item.getReceivedBytes();
            const elapsed = Math.max(1, now - record.lastAt);
            record.speed = Math.max(0, Math.round((received - record.lastBytes) * 1000 / elapsed));
            record.lastBytes = received;
            record.lastAt = now;
            record.receivedBytes = received;
            record.totalBytes = item.getTotalBytes();
            record.state = state === 'interrupted' ? 'interrupted' : (item.isPaused() ? 'paused' : 'progressing');
            sendDownloads();
        });
        item.once('done', (_doneEvent, state) => {
            record.receivedBytes = item.getReceivedBytes();
            record.totalBytes = item.getTotalBytes();
            record.speed = 0;
            record.state = state === 'completed' ? 'completed' : (state === 'cancelled' ? 'cancelled' : 'interrupted');
            record.item = null;
            sendDownloads();
        });
        sendDownloads();
    });
}

function extensionRegistryPath() {
    return path.join(app.getPath('userData'), 'extensions.json');
}

function readExtensionRegistry() {
    try {
        const entries = JSON.parse(fs.readFileSync(extensionRegistryPath(), 'utf8'));
        return Array.isArray(entries) ? entries : [];
    } catch { return []; }
}

function writeExtensionRegistry(entries) {
    fs.mkdirSync(app.getPath('userData'), { recursive: true });
    fs.writeFileSync(extensionRegistryPath(), JSON.stringify(entries, null, 2));
}

function extractXpi(archivePath, target) {
    return new Promise((resolve, reject) => {
        yauzl.open(archivePath, { lazyEntries: true, autoClose: false, validateEntrySizes: true, strictFileNames: true }, (openError, zip) => {
            if (openError) return reject(openError);
            let settled = false;
            let fileCount = 0;
            let totalSize = 0;
            const fail = error => {
                if (settled) return;
                settled = true;
                zip.close();
                reject(error);
            };

            zip.on('error', fail);
            zip.on('end', () => {
                if (settled) return;
                settled = true;
                zip.close();
                resolve();
            });
            zip.on('entry', entry => {
                try {
                    fileCount += 1;
                    totalSize += entry.uncompressedSize;
                    if (fileCount > 20000 || totalSize > 500 * 1024 * 1024) {
                        throw new Error('Архив расширения превышает допустимый размер.');
                    }

                    const fileName = entry.fileName.replace(/\\/g, '/');
                    const segments = fileName.split('/');
                    if (fileName.startsWith('/') || /^[a-z]:/i.test(fileName) || fileName.includes('\0')) {
                        throw new Error('В архиве найден недопустимый путь.');
                    }
                    if (segments[segments.length - 1] === '') segments.pop();
                    if (!segments.length || segments.some(segment =>
                        !segment || segment === '.' || segment === '..' || /[<>:"|?*]/.test(segment) || /[. ]$/.test(segment) ||
                        /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(segment))) {
                        throw new Error('В архиве найден недопустимый путь.');
                    }

                    const unixMode = (entry.externalFileAttributes >>> 16) & 0o170000;
                    if (unixMode && unixMode !== 0o100000 && unixMode !== 0o040000) {
                        throw new Error('Архив содержит неподдерживаемый тип файла.');
                    }

                    const output = path.resolve(target, ...segments);
                    const root = path.resolve(target);
                    if (!output.startsWith(root + path.sep)) throw new Error('В архиве найден недопустимый путь.');
                    const isDirectory = entry.fileName.endsWith('/') || unixMode === 0o040000;
                    if (isDirectory) {
                        fs.mkdirSync(output, { recursive: true });
                        zip.readEntry();
                        return;
                    }

                    fs.mkdirSync(path.dirname(output), { recursive: true });
                    zip.openReadStream(entry, (streamError, stream) => {
                        if (streamError) return fail(streamError);
                        pipeline(stream, fs.createWriteStream(output, { flags: 'wx' }))
                            .then(() => zip.readEntry())
                            .catch(fail);
                    });
                } catch (error) {
                    fail(error);
                }
            });
            zip.readEntry();
        });
    });
}

app.on('web-contents-created', (_event, contents) => {
    if (contents.getType() !== 'webview') return;
    setupDownloadsForSession(contents.session);
    setupPrivacyFiltersForSession(contents.session);
});

function extensionSession(partition) {
    if (typeof partition !== 'string' || !/^persist:swift-profile-[a-z0-9_-]+$/i.test(partition)) {
        throw new Error('Расширения доступны только в обычном профиле.');
    }
    const ses = session.fromPartition(partition);
    if (!ses.isPersistent()) throw new Error('Расширения недоступны в этой сессии.');
    setupPrivacyFiltersForSession(ses);
    setupDownloadsForSession(ses);
    extensionSessions.add(ses);
    return ses;
}

async function loadProfileExtensions(partition) {
    const ses = extensionSession(partition);
    const entries = readExtensionRegistry();
    const failures = new Map();
    for (const entry of entries) {
        if (!entry || typeof entry.path !== 'string' || !fs.existsSync(entry.path)) continue;
        const loaded = ses.getAllExtensions().find(extension => extension.path === entry.path);
        if (entry.enabled === false) {
            if (loaded) ses.removeExtension(loaded.id);
            continue;
        }
        if (loaded) continue;
        try {
            await ses.loadExtension(entry.path);
        } catch (error) {
            failures.set(entry.key, String(error && error.message || error));
        }
    }
    const loadedExtensions = ses.getAllExtensions();
    return entries.map(entry => {
        const loaded = loadedExtensions.find(extension => extension.path === entry.path);
        const enabled = entry.enabled !== false;
        return {
            key: entry.key,
            id: loaded ? loaded.id : '',
            name: entry.name,
            version: entry.version,
            enabled,
            loaded: Boolean(loaded),
            error: enabled ? (failures.get(entry.key) || '') : '',
        };
    });
}

async function fetchHttps(ses, url, headers = {}) {
    let current = new URL(url);
    for (let redirects = 0; redirects <= 5; redirects += 1) {
        if (current.protocol !== 'https:' || current.username || current.password) {
            throw new Error('Разрешены только HTTPS-ссылки без данных авторизации.');
        }
        const response = await ses.fetch(current, {
            headers,
            redirect: 'manual',
            signal: AbortSignal.timeout(120000),
        });
        if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location');
            if (!location || redirects === 5) throw new Error('Слишком много перенаправлений при скачивании.');
            current = new URL(location, current);
            continue;
        }
        if (!response.ok) throw new Error(`Сервер вернул HTTP ${response.status}.`);
        return response;
    }
    throw new Error('Не удалось открыть ссылку расширения.');
}

async function resolveExtensionDownloadUrl(ses, input) {
    let link;
    try { link = new URL(input); }
    catch { throw new Error('Введите корректную HTTPS-ссылку.'); }
    if (link.protocol !== 'https:' || link.username || link.password) {
        throw new Error('Разрешены только HTTPS-ссылки без данных авторизации.');
    }

    if (link.hostname.toLowerCase() === 'addons.mozilla.org') {
        const match = link.pathname.match(/^\/(?:[a-z]{2}(?:-[a-z]{2})?\/)?firefox\/addon\/([^/]+)\/?$/i);
        if (match) {
            const apiUrl = `https://addons.mozilla.org/api/v5/addons/addon/${encodeURIComponent(match[1])}/`;
            const response = await fetchHttps(ses, apiUrl, { accept: 'application/json' });
            const addon = await response.json();
            const version = addon && addon.current_version;
            const files = version && version.files;
            const file = version && version.file && typeof version.file.url === 'string'
                ? version.file
                : Array.isArray(files) && files.find(item => item && typeof item.url === 'string');
            if (!file) throw new Error('В каталоге не найден файл текущей версии расширения.');
            link = new URL(file.url, apiUrl);
        } else if (!link.pathname.toLowerCase().endsWith('.xpi')) {
            throw new Error('Откройте страницу конкретного дополнения или укажите прямую ссылку на XPI.');
        }
    } else if (!link.pathname.toLowerCase().endsWith('.xpi')) {
        throw new Error('Укажите прямую ссылку на файл .xpi или страницу дополнения Firefox.');
    }

    if (link.protocol !== 'https:') throw new Error('Каталог вернул небезопасную ссылку на файл.');
    return link.href;
}

async function installExtensionFile(ses, source) {
    const key = randomUUID();
    const target = path.join(app.getPath('userData'), 'extensions', key);
    try {
        fs.mkdirSync(target, { recursive: true });
        if (fs.statSync(source).isDirectory()) {
            fs.cpSync(source, target, { recursive: true });
        } else if (path.extname(source).toLowerCase() === '.xpi') {
            await extractXpi(source, target);
        } else {
            throw new Error('Выберите XPI-файл или папку с manifest.json.');
        }

        const manifestPath = path.join(target, 'manifest.json');
        if (!fs.existsSync(manifestPath)) throw new Error('В выбранном расширении не найден manifest.json.');
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
        if (![2, 3].includes(manifest.manifest_version) || !manifest.name || !manifest.version) {
            throw new Error('Манифест расширения имеет неподдерживаемый формат.');
        }

        const extension = await ses.loadExtension(target);
        const entries = readExtensionRegistry();
        entries.push({ key, path: target, name: extension.name || manifest.name, version: extension.version || manifest.version, enabled: true });
        writeExtensionRegistry(entries);
        return { ok: true, extension: { key, id: extension.id, name: extension.name || manifest.name, version: extension.version || manifest.version, loaded: true } };
    } catch (error) {
        fs.rmSync(target, { recursive: true, force: true });
        return { ok: false, error: String(error && error.message || error) };
    }
}

async function chooseAndInstallExtension(partition) {
    const ses = extensionSession(partition);
    const result = await dialog.showOpenDialog(mainWindow, {
        title: 'Установить расширение',
        buttonLabel: 'Установить',
        properties: ['openFile', 'openDirectory'],
        filters: [{ name: 'Firefox Extension', extensions: ['xpi'] }],
    });
    if (result.canceled || !result.filePaths.length) return { ok: false, canceled: true };
    return installExtensionFile(ses, result.filePaths[0]);
}

async function installExtensionFromUrl(partition, input) {
    const ses = extensionSession(partition);
    const tempFile = path.join(app.getPath('temp'), `swift-extension-${randomUUID()}.xpi`);
    try {
        const downloadUrl = await resolveExtensionDownloadUrl(ses, input);
        const response = await fetchHttps(ses, downloadUrl, { accept: 'application/x-xpinstall, application/zip, application/octet-stream' });
        const contentLength = Number(response.headers.get('content-length') || 0);
        const maxBytes = 100 * 1024 * 1024;
        if (contentLength > maxBytes) throw new Error('Файл расширения превышает лимит 100 МБ.');
        if (!response.body) throw new Error('Сервер не передал файл расширения.');

        let received = 0;
        const sizeLimit = new Transform({
            transform(chunk, _encoding, callback) {
                received += chunk.length;
                callback(received > maxBytes ? new Error('Файл расширения превышает лимит 100 МБ.') : null, chunk);
            },
        });
        await pipeline(Readable.fromWeb(response.body), sizeLimit, fs.createWriteStream(tempFile, { flags: 'wx' }));
        return await installExtensionFile(ses, tempFile);
    } catch (error) {
        return { ok: false, error: String(error && error.message || error) };
    } finally {
        fs.rmSync(tempFile, { force: true });
    }
}

async function setRegisteredExtensionEnabled(partition, key, enabled) {
    const ses = extensionSession(partition);
    const entries = readExtensionRegistry();
    const entry = entries.find(item => item && item.key === key);
    if (!entry) return { ok: false, error: 'Расширение не найдено.' };

    const shouldEnable = enabled === true;
    try {
        const loaded = ses.getAllExtensions().find(extension => extension.path === entry.path);
        if (shouldEnable && !loaded) await ses.loadExtension(entry.path);
        if (!shouldEnable && loaded) ses.removeExtension(loaded.id);
        entry.enabled = shouldEnable;
        writeExtensionRegistry(entries);
        return { ok: true, enabled: shouldEnable };
    } catch (error) {
        return { ok: false, error: String(error && error.message || error) };
    }
}

function removeRegisteredExtension(partition, key) {
    extensionSession(partition);
    const entries = readExtensionRegistry();
    const entry = entries.find(item => item && item.key === key);
    if (!entry) return { ok: false, error: 'Расширение не найдено.' };
    for (const ses of extensionSessions) {
        const loaded = ses.getAllExtensions().find(extension => extension.path === entry.path);
        if (loaded) ses.removeExtension(loaded.id);
    }
    writeExtensionRegistry(entries.filter(item => item !== entry));
    fs.rmSync(entry.path, { recursive: true, force: true });
    return { ok: true };
}


let privacy = {
    blockTrackers: true,
    blockThirdPartyCookies: true,
    doNotTrack: true,
    httpsOnly: false,
    stripReferrer: true,
    blockFingerprinting: true,
    blockSocial: true,
    clearOnExit: false,
};

const TRACKER_HOSTS = [
    'doubleclick.net', 'googlesyndication.com', 'google-analytics.com',
    'googletagmanager.com', 'googletagservices.com', 'adservice.google.com',
    'googleadservices.com', 'pagead2.googlesyndication.com',
    'facebook.net', 'connect.facebook.net', 'graph.facebook.com',
    'ads-twitter.com', 'analytics.twitter.com', 'static.ads-twitter.com',
    'scorecardresearch.com', 'quantserve.com', 'adnxs.com', 'criteo.com',
    'criteo.net', 'taboola.com', 'outbrain.com', 'amazon-adsystem.com',
    'adsrvr.org', 'rubiconproject.com', 'pubmatic.com', 'openx.net',
    'moatads.com', 'yandex.ru/metrika', 'mc.yandex.ru', 'hotjar.com',
    'mixpanel.com', 'segment.io', 'segment.com', 'branch.io', 'appsflyer.com',
    'clarity.ms', 'mouseflow.com', 'fullstory.com', 'newrelic.com',
    'nr-data.net', 'sentry.io', 'crazyegg.com', 'optimizely.com',
];

const SOCIAL_HOSTS = [
    'platform.twitter.com', 'platform.linkedin.com', 'platform.instagram.com',
    'connect.facebook.net', 'vk.com/js/api', 'widgets.pinterest.com',
    'platform.stumbleupon.com', 'apis.google.com/js/platform',
    's7.addthis.com', 'sharethis.com', 'addtoany.com',
];

function hostFromUrl(u) {
    try { return new URL(u).hostname.toLowerCase(); } catch { return ''; }
}
function registrableBase(host) {
    const parts = host.split('.');
    return parts.length <= 2 ? host : parts.slice(-2).join('.');
}
function matchesHostList(url, list) {
    const host = hostFromUrl(url);
    if (!host) return false;
    let pathname = '';
    try { pathname = new URL(url).pathname; } catch {}
    return list.some(t => {
        if (t.includes('/')) return (host + pathname).includes(t);
        return host === t || host.endsWith('.' + t);
    });
}
function isTracker(url) {
    return matchesHostList(url, TRACKER_HOSTS) ||
        (privacy.blockSocial && matchesHostList(url, SOCIAL_HOSTS));
}

function isGoogleFirstPartyAuthRequest(details) {
    const target = hostFromUrl(details.url);
    const referrer = hostFromUrl(details.referrer || '');
    const googleHosts = ['google.com', 'youtube.com', 'googleusercontent.com', 'gstatic.com'];
    const isGoogleHost = host => googleHosts.some(domain => host === domain || host.endsWith('.' + domain));
    return isGoogleHost(target) && isGoogleHost(referrer);
}

function setupPrivacyFiltersForSession(ses) {
    if (!ses || ses.__swiftPrivacyFiltersInstalled) return;
    ses.__swiftPrivacyFiltersInstalled = true;

    ses.webRequest.onBeforeRequest((details, cb) => {
        if (privacy.blockTrackers && details.resourceType !== 'mainFrame' && isTracker(details.url)) {
            return cb({ cancel: true });
        }
        if (privacy.httpsOnly && details.url.startsWith('http://') && details.resourceType === 'mainFrame') {
            return cb({ redirectURL: details.url.replace(/^http:\/\//i, 'https://') });
        }
        cb({ cancel: false });
    });

    ses.webRequest.onBeforeSendHeaders((details, cb) => {
        const headers = details.requestHeaders || {};
        if (privacy.doNotTrack) {
            headers['DNT'] = '1';
            headers['Sec-GPC'] = '1';
        }
        if (privacy.stripReferrer) {
            delete headers['Referer'];
            delete headers['referer'];
            headers['Referrer-Policy'] = 'no-referrer';
        }
        if (privacy.blockThirdPartyCookies && details.resourceType !== 'mainFrame' && !isGoogleFirstPartyAuthRequest(details)) {
            const target = registrableBase(hostFromUrl(details.url));
            const ref = details.referrer ? registrableBase(hostFromUrl(details.referrer)) : '';
            if (ref && target && ref !== target) {
                delete headers['Cookie'];
                delete headers['cookie'];
            }
        }
        cb({ requestHeaders: headers });
    });

    ses.webRequest.onHeadersReceived((details, cb) => {
        const headers = { ...(details.responseHeaders || {}) };
        let changed = false;

        if (privacy.blockThirdPartyCookies && details.resourceType !== 'mainFrame' && !isGoogleFirstPartyAuthRequest(details)) {
            const target = registrableBase(hostFromUrl(details.url));
            const ref = details.referrer ? registrableBase(hostFromUrl(details.referrer)) : '';
            if (ref && target && ref !== target) {
                for (const k of Object.keys(headers)) {
                    if (k.toLowerCase() === 'set-cookie') {
                        delete headers[k];
                        changed = true;
                    }
                }
            }
        }

        if (privacy.stripReferrer) {
            headers['referrer-policy'] = ['no-referrer'];
            changed = true;
        }

        if (privacy.blockFingerprinting) {
            const cspKey = Object.keys(headers).find(k => k.toLowerCase() === 'permissions-policy');
            const extra = 'interest-cohort=(), browsing-topics=()';
            if (cspKey) {
                const cur = Array.isArray(headers[cspKey]) ? headers[cspKey].join(', ') : String(headers[cspKey] || '');
                headers[cspKey] = [cur ? cur + ', ' + extra : extra];
            } else {
                headers['Permissions-Policy'] = [extra];
            }
            changed = true;
        }

        cb(changed ? { responseHeaders: headers } : {});
    });
}

function resolveIcon() {
    const candidates = ['icon.ico', 'icon.png', 'icon.svg'];
    for (const name of candidates) {
        const p = path.join(__dirname, name);
        if (fs.existsSync(p)) return p;
    }
    return undefined;
}

function createWindow() {
    const winOpts = {
        width: 1000,
        height: 700,
        minWidth: 760,
        minHeight: 480,
        backgroundColor: '#0f1115',
        title: 'Swift Browser',
        frame: false,
        autoHideMenuBar: true,
        show: false,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false,
            webviewTag: true,
            backgroundThrottling: true,
            spellcheck: false,
        },
    };
    const icon = resolveIcon();
    if (icon) winOpts.icon = icon;

    mainWindow = new BrowserWindow(winOpts);
    mainWindow.on('maximize', () => mainWindow.webContents.send('swift:window-state', true));
    mainWindow.on('unmaximize', () => mainWindow.webContents.send('swift:window-state', false));
    mainWindow.once('ready-to-show', () => {
        if (mainWindow && !mainWindow.isDestroyed()) mainWindow.show();
    });
    mainWindow.loadFile('index.html');

    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        if (/^https?:\/\//i.test(url) || url.startsWith('mailto:')) {
            shell.openExternal(url);
        }
        return { action: 'deny' };
    });

    mainWindow.on('closed', () => { mainWindow = null; });
}

app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');

async function clearBrowsingData() {
    const sessions = new Set([session.defaultSession]);
    for (const ses of extensionSessions) sessions.add(ses);
    for (const ses of sessions) {
        await ses.clearCache();
        await ses.clearStorageData({
            storages: ['cookies', 'localstorage', 'caches', 'indexdb',
                       'serviceworkers', 'websql', 'shadercache'],
        });
    }
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (hasSingleInstanceLock) {
    app.on('second-instance', () => {
        if (!mainWindow || mainWindow.isDestroyed()) return;
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    });

app.whenReady().then(() => {
    setupPrivacyFiltersForSession(session.defaultSession);
    setupDownloadsForSession(session.defaultSession);

    ipcMain.handle('swift:downloads-list', (event) => {
        if (!isMainRenderer(event)) return [];
        return [...downloads.values()].map(downloadSnapshot);
    });
    ipcMain.handle('swift:downloads-cancel', (event, id) => {
        if (!isMainRenderer(event) || typeof id !== 'string') return { ok: false, error: 'Недоступно.' };
        const record = downloads.get(id);
        if (!record || !record.item || record.state !== 'progressing') return { ok: false, error: 'Загрузка не активна.' };
        record.item.cancel();
        return { ok: true };
    });
    ipcMain.handle('swift:downloads-remove', (event, id) => {
        if (!isMainRenderer(event) || typeof id !== 'string') return { ok: false, error: 'Недоступно.' };
        const record = downloads.get(id);
        if (!record || !isRegisteredDownloadPath(record.path)) return { ok: false, error: 'Загрузка не найдена.' };
        if (record.item && record.state === 'progressing') record.item.cancel();
        try { fs.rmSync(record.path, { force: true }); }
        catch (error) { return { ok: false, error: String(error && error.message || error) }; }
        downloads.delete(id);
        sendDownloads();
        return { ok: true };
    });

    ipcMain.handle('swift:extensions-list', (event, partition) => {
        if (!mainWindow || event.sender !== mainWindow.webContents) return [];
        return loadProfileExtensions(partition);
    });
    ipcMain.handle('swift:extension-install', (event, partition) => {
        if (!mainWindow || event.sender !== mainWindow.webContents) return { ok: false, error: 'Недоступно.' };
        return chooseAndInstallExtension(partition);
    });
    ipcMain.handle('swift:extension-install-url', (event, partition, url) => {
        if (!mainWindow || event.sender !== mainWindow.webContents) return { ok: false, error: 'Недоступно.' };
        return installExtensionFromUrl(partition, url);
    });
    ipcMain.handle('swift:extension-set-enabled', (event, partition, key, enabled) => {
        if (!mainWindow || event.sender !== mainWindow.webContents) return { ok: false, error: 'Недоступно.' };
        return setRegisteredExtensionEnabled(partition, key, enabled);
    });
    ipcMain.handle('swift:extension-remove', (event, partition, key) => {
        if (!mainWindow || event.sender !== mainWindow.webContents) return { ok: false, error: 'Недоступно.' };
        try { return removeRegisteredExtension(partition, key); }
        catch (error) { return { ok: false, error: String(error && error.message || error) }; }
    });

    ipcMain.handle('swift:window-control', (event, action) => {
        if (!mainWindow || mainWindow.isDestroyed() || event.sender !== mainWindow.webContents) return false;
        if (action === 'minimize') mainWindow.minimize();
        if (action === 'toggle-maximize') {
            if (mainWindow.isMaximized()) mainWindow.unmaximize();
            else mainWindow.maximize();
        }
        if (action === 'close') mainWindow.close();
        return mainWindow.isMaximized();
    });

    ipcMain.handle('swift:is-maximized', () => Boolean(mainWindow && mainWindow.isMaximized()));

    ipcMain.on('swift:set-privacy', (_e, opts) => {
        if (opts && typeof opts === 'object') {
            privacy = Object.assign(privacy, opts);
        }
    });

    ipcMain.handle('swift:clear-data', async () => {
        try {
            await clearBrowsingData();
            return { ok: true };
        } catch (err) {
            return { ok: false, error: String(err) };
        }
    });

    ipcMain.handle('swift:encrypt', (_e, plain) => {
        try {
            if (!safeStorage.isEncryptionAvailable()) {
                return { ok: true, data: Buffer.from(String(plain), 'utf8').toString('base64'), fallback: true };
            }
            const buf = safeStorage.encryptString(String(plain));
            return { ok: true, data: buf.toString('base64'), fallback: false };
        } catch (err) {
            return { ok: false, error: String(err) };
        }
    });

    ipcMain.handle('swift:decrypt', (_e, b64) => {
        try {
            const buf = Buffer.from(String(b64), 'base64');
            if (!safeStorage.isEncryptionAvailable()) {
                return { ok: true, data: buf.toString('utf8'), fallback: true };
            }
            return { ok: true, data: safeStorage.decryptString(buf) };
        } catch (err) {
            return { ok: false, error: String(err) };
        }
    });

    ipcMain.on('swift:open-external', (_e, url) => {
        if (typeof url === 'string' && /^(https?:|mailto:)/i.test(url)) {
            shell.openExternal(url);
        }
    });

    app.on('web-contents-created', (_e, contents) => {
        if (contents.getType() === 'webview') {
            contents.setWindowOpenHandler(({ url }) => {
                if (mainWindow && !mainWindow.isDestroyed()) {
                    mainWindow.webContents.send('swift:open-tab', url);
                }
                return { action: 'deny' };
            });
        }
    });

    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('before-quit', async (e) => {
    if (!privacy.clearOnExit) return;
    e.preventDefault();
    privacy.clearOnExit = false; 
    try { await clearBrowsingData(); } catch {}
    app.quit();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});
} else {
    app.quit();
}
