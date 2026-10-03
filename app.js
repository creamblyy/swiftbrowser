
const STORAGE_KEY = 'swift-settings';

const ENGINE_ICONS = {
    duckduckgo: { asset: 'assets/search-engines/duckduckgo.png', color: '#de5833', desc: 'Приватный поиск без слежки' },
    brave:      { asset: 'assets/search-engines/brave.png', color: '#fb542b', desc: 'Независимый приватный поиск' },
    google:     { svg: '<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="16" fill="#fff"/><path d="M27.6 16.2c0-.7-.1-1.4-.2-2H16v3.8h6.5a5.6 5.6 0 01-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.4z" fill="#4285F4"/><path d="M16 28c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H5.4v3.1A12 12 0 0016 28z" fill="#34A853"/><path d="M9.4 18.4A7.2 7.2 0 019 16c0-.8.1-1.6.4-2.4v-3.1h-4A12 12 0 004 16c0 1.9.5 3.8 1.4 5.5l4-3.1z" fill="#FBBC05"/><path d="M16 9.5c1.7 0 3.3.6 4.5 1.8l3.4-3.4A12 12 0 0016 4 12 12 0 005.4 10.5l4 3.1C10.3 11.6 12.9 9.5 16 9.5z" fill="#EA4335"/></svg>', color: '#4285f4', letter: 'G', desc: 'Самый популярный поисковик' },
    bing:       { asset: 'assets/search-engines/bing.png', color: '#008373', desc: 'Поисковик от Microsoft' },
    yandex:     { asset: 'assets/search-engines/yandex.png', color: '#fc3f1d', desc: 'Лучший поиск по рунету' },
};

const SEARCH_ENGINES = {
    duckduckgo: { name: 'DuckDuckGo', url: 'https://duckduckgo.com/?q=' },
    brave:      { name: 'Brave Search', url: 'https://search.brave.com/search?q=' },
    google:     { name: 'Google',     url: 'https://www.google.com/search?q=' },
    bing:       { name: 'Bing',       url: 'https://www.bing.com/search?q=' },
    yandex:     { name: 'Яндекс',     url: 'https://yandex.ru/search/?text=' },
};

const ACCENTS = [
    { id: 'orange', c: '#ff6a3d', c2: '#ff8a5b', rgb: '255,106,61'  },
    { id: 'blue',   c: '#3d8bff', c2: '#5ba3ff', rgb: '61,139,255'  },
    { id: 'violet', c: '#8b5cf6', c2: '#a78bfa', rgb: '139,92,246'  },
    { id: 'green',  c: '#22c55e', c2: '#4ade80', rgb: '34,197,94'   },
    { id: 'pink',   c: '#ec4899', c2: '#f472b6', rgb: '236,72,153'  },
    { id: 'red',    c: '#ef4444', c2: '#f87171', rgb: '239,68,68'   },
];

const DEFAULT_SETTINGS = {
    engine: 'duckduckgo',
    theme: 'dark',
    accent: 'orange',
    showTagline: true,
    showShortcuts: true,
    showWaves: true,
    wavesType: 'normal',   
    darkSites: true,       
    uiAnimations: true,    
    reduceMotion: false,   

    blockTrackers: true,       
    blockSocial: true,         
    blockThirdPartyCookies: true, 
    doNotTrack: true,          
    stripReferrer: true,       
    blockFingerprinting: true, 
    httpsOnly: false,          
    enableJavaScript: true,    
    saveHistory: true,         
    savePasswords: true,       
    clearOnExit: false,        
};

let settings = loadSettings();

function updateBookmarkButton() {}
function addHistoryEntry() {}
function touchHistoryTitle() {}
function injectPageHelpers() {}
function handleLoginDetected() {}
function refreshLibraryPanes() {}
function reloadProfileData() {}
function attachConsoleLoginListener() {}
function clearHistory() {}
function initLibraryUI() {}

function settingsStorageKey() {
    try {
        const raw = JSON.parse(localStorage.getItem('swift-profiles'));
        const id = raw && raw.activeId ? raw.activeId : 1;
        return STORAGE_KEY + '-' + id;
    } catch { return STORAGE_KEY + '-1'; }
}

function loadSettings() {
    try {
        const key = settingsStorageKey();
        let saved = JSON.parse(localStorage.getItem(key));
        if (!saved) {
            saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (saved) localStorage.setItem(key, JSON.stringify(saved));
        }
        const merged = Object.assign({}, DEFAULT_SETTINGS, saved || {});
        if (merged.engine === 'startpage') merged.engine = 'duckduckgo';
        return merged;
    } catch { return Object.assign({}, DEFAULT_SETTINGS); }
}

function saveSettings() {
    try { localStorage.setItem(settingsStorageKey(), JSON.stringify(settings)); } catch {}
}

function engineFallbackText(id) {
    const eng = SEARCH_ENGINES[id] || SEARCH_ENGINES.duckduckgo;
    return (ENGINE_ICONS[id] && ENGINE_ICONS[id].letter) || eng.name.charAt(0).toUpperCase();
}

function createEngineIcon(id, className) {
    const holder = document.createElement('span');
    holder.className = `engine-icon ${className || ''}`.trim();
    holder.setAttribute('aria-hidden', 'true');

    const icon = ENGINE_ICONS[id];
    if (icon && icon.asset) {
        const image = document.createElement('img');
        image.src = new URL(icon.asset, document.baseURI).href;
        image.alt = '';
        image.decoding = 'sync';
        image.draggable = false;
        holder.appendChild(image);
    } else if (icon && icon.svg) {
        holder.innerHTML = icon.svg;
    } else {
        holder.classList.add('engine-icon-letter');
        holder.textContent = engineFallbackText(id);
    }
    return holder;
}

function searchUrl(query) {
    const eng = SEARCH_ENGINES[settings.engine] || SEARCH_ENGINES.duckduckgo;
    return eng.url + encodeURIComponent(query);
}

const tabsEl        = document.getElementById('tabs');
const newTabBtn     = document.getElementById('newTabBtn');
const backBtn       = document.getElementById('backBtn');
const forwardBtn    = document.getElementById('forwardBtn');
const reloadBtn     = document.getElementById('reloadBtn');
const homeBtn       = document.getElementById('homeBtn');
const addressForm   = document.getElementById('addressForm');
const addressInput  = document.getElementById('addressInput');
const goBtn         = document.getElementById('goBtn');
const webviewHost   = document.getElementById('webviewHost');
const homePage      = document.getElementById('homePage');
const downloadsBtn = document.getElementById('downloadsBtn');
const downloadsPanel = document.getElementById('downloadsPanel');
const downloadsList = document.getElementById('downloadsList');
const closeDownloadsBtn = document.getElementById('closeDownloadsBtn');

let downloads = [];
function formatBytes(bytes) {
    if (!Number.isFinite(bytes) || bytes <= 0) return '0 Б';
    const units = ['Б', 'КБ', 'МБ', 'ГБ'];
    const index = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
    return `${(bytes / (1024 ** index)).toFixed(index ? 1 : 0)} ${units[index]}`;
}
function renderDownloads(items = downloads) {
    downloads = Array.isArray(items) ? items : [];
    if (!downloadsList) return;
    downloadsList.textContent = '';
    if (!downloads.length) {
        const empty = document.createElement('p');
        empty.className = 'downloads-empty';
        empty.textContent = 'Нет загрузок';
        downloadsList.appendChild(empty);
        return;
    }
    downloads.forEach(item => {
        const row = document.createElement('article');
        row.className = 'download-item';
        const percent = item.totalBytes > 0 ? Math.min(100, Math.round(item.receivedBytes * 100 / item.totalBytes)) : 0;
        const active = item.state === 'progressing';
        row.innerHTML = `<div class="download-name" title="${String(item.name || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')}"></div><div class="download-meta"></div><div class="download-progress"><span></span></div><div class="download-actions"></div>`;
        row.querySelector('.download-name').textContent = item.name || 'Загрузка';
        row.querySelector('.download-meta').textContent = active
            ? `${formatBytes(item.speed)}/с · ${percent}%`
            : (item.state === 'completed' ? 'Завершено' : item.state === 'cancelled' ? 'Отменено' : 'Прервано');
        row.querySelector('.download-progress span').style.width = `${percent}%`;
        const actions = row.querySelector('.download-actions');
        if (active) {
            const cancel = document.createElement('button');
            cancel.className = 'nav-btn'; cancel.title = 'Отменить загрузку'; cancel.innerHTML = '<span class="material-icons-round">close</span>';
            cancel.addEventListener('click', () => window.swift?.cancelDownload?.(item.id));
            actions.appendChild(cancel);
        }
        const remove = document.createElement('button');
        remove.className = 'nav-btn'; remove.title = 'Удалить запись и файл'; remove.innerHTML = '<span class="material-icons-round">delete</span>';
        remove.addEventListener('click', () => window.swift?.removeDownload?.(item.id));
        actions.appendChild(remove);
        downloadsList.appendChild(row);
    });
}
function setDownloadsPanel(open) {
    if (!downloadsPanel) return;
    downloadsPanel.hidden = !open;
    downloadsBtn?.setAttribute('aria-expanded', String(open));
    if (open) window.swift?.listDownloads?.().then(renderDownloads).catch(() => {});
}
downloadsBtn?.addEventListener('click', () => setDownloadsPanel(downloadsPanel?.hidden));
closeDownloadsBtn?.addEventListener('click', () => setDownloadsPanel(false));
if (window.swift?.onDownloadsUpdated) window.swift.onDownloadsUpdated(renderDownloads);

Object.defineProperty(window, 'webview', {
    get() {
        const t = (typeof activeTab === 'function') ? activeTab() : null;
        return t ? t.view : null;
    }
});
const homeSearchForm = document.getElementById('homeSearchForm');
const homeSearchInput = document.getElementById('homeSearchInput');
const shortcutsEl   = document.getElementById('shortcuts');
const loadbar       = document.getElementById('loadbar');

const SHORTCUTS_KEY = 'swift-shortcuts';
const SHORTCUTS_DEFAULT = [
    { id: 1, label: 'DuckDuckGo', url: 'https://duckduckgo.com',      color: '#de5833', icon: 'D' },
    { id: 2, label: 'Wikipedia',  url: 'https://ru.wikipedia.org',    color: '#636466', icon: 'W' },
    { id: 3, label: 'YouTube',    url: 'https://www.youtube.com',     color: '#ff0000', icon: '▶' },
    { id: 4, label: 'GitHub',     url: 'https://github.com',          color: '#24292e', icon: '' },
    { id: 5, label: 'Reddit',     url: 'https://www.reddit.com',      color: '#ff4500', icon: 'R' },
    { id: 6, label: 'Postman',    url: 'https://www.postman.com',     color: '#ff6c37', icon: 'P' },
    { id: 7, label: 'Twitch',     url: 'https://www.twitch.tv',       color: '#9146ff', icon: 'T' },
    { id: 8, label: 'X',          url: 'https://x.com',               color: '#000000', icon: 'X' },
];

function loadShortcuts() {
    try {
        const s = JSON.parse(localStorage.getItem(SHORTCUTS_KEY));
        if (Array.isArray(s) && s.length) return s;
    } catch {}
    return SHORTCUTS_DEFAULT.map(s => ({ ...s }));
}
function saveShortcuts() {
    try { localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(userShortcuts)); } catch {}
}
let userShortcuts = loadShortcuts();
let scNextId = Math.max(...userShortcuts.map(s => s.id), 0) + 1;

let tabs = [];
let activeId = null;
let nextId = 1;
const extensionStartupTasks = new Map();

function ensureProfileExtensions(partition) {
    if (!partition.startsWith('persist:') || !window.swift || !window.swift.listExtensions) {
        return Promise.resolve([]);
    }
    if (!extensionStartupTasks.has(partition)) {
        extensionStartupTasks.set(partition, window.swift.listExtensions(partition).catch(() => []));
    }
    return extensionStartupTasks.get(partition);
}

function currentProfilePartition() {
    const profile = (typeof activeProfile === 'function') ? activeProfile() : null;
    if (profile && profile.guest) return 'swift-incognito-' + profile.id;
    const id = profile ? profile.id : 1;
    return 'persist:swift-profile-' + String(id).replace(/[^a-z0-9_-]/gi, '');
}

function createWebview(tab) {
    if (tab.view) return tab.view;
    const view = document.createElement('webview');
    view.className = 'browser-frame';
    view.setAttribute('allowpopups', '');
    view.setAttribute('partition', currentProfilePartition());
    view.setAttribute('webpreferences',
        'javascript=' + (settings.enableJavaScript ? 'yes' : 'no') +
        ', backgroundThrottling=yes');
    tab.view = view;
    tab._cssKey = null;      
    attachWebviewListeners(view, tab);
    attachConsoleLoginListener(view);
    webviewHost.appendChild(view);
    return view;
}

function createTab(url = null) {
    const tab = {
        id: nextId++,
        title: 'Новая вкладка',
        url: url,       
        canBack: false,
        canForward: false,
        isPlaying: false,
        view: null,
        loaded: false,  
    };
    tabs.push(tab);
    if (url && !isAboutUrl(url)) createWebview(tab);
    switchTab(tab.id);
    return tab;
}

function activeTab() {
    return tabs.find(t => t.id === activeId);
}

function closeTab(id) {
    const idx = tabs.findIndex(t => t.id === id);
    if (idx === -1) return;
    const tab = tabs[idx];
    if (tab.view) { try { tab.view.remove(); } catch {} tab.view = null; }
    tabs.splice(idx, 1);
    if (tabs.length === 0) { createTab(); return; }
    if (activeId === id) {
        activeId = tabs[Math.max(0, idx - 1)].id;
    }
    switchTab(activeId);
}

function switchTab(id) {
    activeId = id;
    const tab = activeTab();
    renderTabs();

    tabs.forEach(t => {
        if (t.view) t.view.classList.toggle('active', t.id === id);
    });

    if (isAboutUrl(tab.url)) {
        addressInput.value = tab.url;
        const info = ABOUT_PAGES[tab.url];
        showSettingsView(info && info.pane);
    } else if (tab.url) {
        addressInput.value = tab.url;
        showWebview();
        const view = createWebview(tab);
        if (!tab.loaded) {
            const targetUrl = tab.url;
            ensureProfileExtensions(currentProfilePartition()).finally(() => {
                if (tab.view === view && tab.url === targetUrl && !tab.loaded) {
                    view.src = targetUrl;
                    tab.loaded = true;
                }
            });
        }
    } else {
        addressInput.value = '';
        showHome();
    }
    updateNavButtons();
    updateBookmarkButton();
}

function renderTabs() {
    tabsEl.innerHTML = '';
    tabs.forEach(tab => {
        const el = document.createElement('div');
        el.className = 'tab' + (tab.id === activeId ? ' active' : '');
        el.title = tab.title;

        if (isAboutUrl(tab.url)) {
            const ic = document.createElement('span');
            ic.className = 'tab-fav material-icons-round';
            ic.style.fontSize = '15px';
            ic.textContent = 'settings';
            el.appendChild(ic);
        } else if (tab.url) {
            const img = document.createElement('img');
            img.className = 'tab-fav';
            img.src = faviconFor(tab.url);
            img.onerror = () => { img.replaceWith(tabIcon('language')); };
            el.appendChild(img);
        } else {
            el.appendChild(tabIcon('home'));
        }

        if (tab.isPlaying) {
            const audioBtn = document.createElement('span');
            audioBtn.className = 'tab-audio material-icons-round';
            audioBtn.textContent = tab.isMuted ? 'volume_off' : 'volume_up';
            audioBtn.title = tab.isMuted ? 'Включить звук' : 'Выключить звук';
            audioBtn.onclick = (e) => {
                e.stopPropagation();
                tab.isMuted = !tab.isMuted;
                try { if (tab.view) tab.view.setAudioMuted(tab.isMuted); } catch {}
                renderTabs();
            };
            el.appendChild(audioBtn);
        }

        const title = document.createElement('span');
        title.className = 'tab-title';
        title.textContent = tab.title;
        el.appendChild(title);

        const close = document.createElement('span');
        close.className = 'tab-close';
        close.textContent = '×';
        close.onclick = (e) => { e.stopPropagation(); closeTab(tab.id); };
        el.appendChild(close);

        el.onclick = () => switchTab(tab.id);
        tabsEl.appendChild(el);
    });
}

function tabIcon(iconName) {
    const icon = document.createElement('span');
    icon.className = 'tab-fav material-icons-round';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = iconName;
    return icon;
}

const ABOUT_PAGES = {
    'about:preferences': { title: 'Настройки', view: 'settings', pane: 'general' },
    'about:settings':    { title: 'Настройки', view: 'settings', pane: 'general' },
    'about:history':     { title: 'История',   view: 'settings', pane: 'history' },
    'about:bookmarks':   { title: 'Закладки',  view: 'settings', pane: 'bookmarks' },
    'about:passwords':   { title: 'Пароли',    view: 'settings', pane: 'passwords' },
    'about:privacy':     { title: 'Приватность', view: 'settings', pane: 'privacy' },
};
function isAboutUrl(url) {
    return typeof url === 'string' && !!ABOUT_PAGES[url.trim().toLowerCase()];
}

function normalizeInput(raw) {
    const q = raw.trim();
    if (!q) return null;

    if (isAboutUrl(q)) return q.toLowerCase();

    if (/^[a-z]+:\/\//i.test(q)) return q;                       
    const looksLikeUrl = /^[\w-]+(\.[\w-]+)+(\/.*)?$/.test(q) && !q.includes(' ');
    if (looksLikeUrl) return 'https://' + q;                     

    return searchUrl(q);                                         
}

function navigate(url) {
    const tab = activeTab();
    if (!tab) return;

    if (isAboutUrl(url)) {
        const info = ABOUT_PAGES[url.toLowerCase()];
        tab.url = url.toLowerCase();
        tab.title = info ? info.title : url;
        addressInput.value = tab.url;
        showSettingsView(info && info.pane);
        renderTabs();
        updateNavButtons();
        updateBookmarkButton();
        return;
    }

    tab.url = url;
    addressInput.value = url;
    showWebview();
    const view = createWebview(tab);
    tabs.forEach(t => {
        if (t.view) t.view.classList.toggle('active', t.id === tab.id);
    });
    view.src = url;
    tab.loaded = true;
    renderTabs();
    updateBookmarkButton();
}

function goTo(raw) {
    const url = normalizeInput(raw);
    if (url) navigate(url);
}

function goBack()    { if (webview.canGoBack && webview.canGoBack())    webview.goBack(); }
function goForward() { if (webview.canGoForward && webview.canGoForward()) webview.goForward(); }
function reload()    { const t = activeTab(); if (t && t.url) webview.reload(); }

function goHome() {
    const tab = activeTab();
    if (!tab) return;
    tab.url = null;
    tab.title = 'Новая вкладка';
    addressInput.value = '';
    showHome();
    renderTabs();
    updateNavButtons();
    updateBookmarkButton();
}

function updateNavButtons() {
    const tab = activeTab();
    const hasPage = !!(tab && tab.url);
    backBtn.disabled    = !hasPage || !(webview.canGoBack && webview.canGoBack());
    forwardBtn.disabled = !hasPage || !(webview.canGoForward && webview.canGoForward());
}

function hideSettingsView() {
    const page = document.getElementById('settingsPage');
    if (page) {
        page.classList.remove('open');
        page.setAttribute('aria-hidden', 'true');
    }
}

function showWebview() {
    hideSettingsView();
    homePage.classList.add('hidden');
    homePage.classList.remove('page-enter');
    webviewHost.classList.add('visible');
    webviewHost.classList.remove('page-enter');
    if (typeof stopHomeAnimations === 'function') stopHomeAnimations();
}

function showHome() {
    hideSettingsView();
    webviewHost.classList.remove('visible');
    homePage.classList.remove('hidden');
    homePage.classList.add('page-enter');
    homeSearchInput.value = '';
    homeSearchInput.focus();
    if (typeof startHomeAnimations === 'function') startHomeAnimations();
}

function showSettingsView(pane) {
    const page = document.getElementById('settingsPage');
    homePage.classList.add('hidden');
    webviewHost.classList.remove('visible');
    if (typeof stopHomeAnimations === 'function') stopHomeAnimations();
    if (page) {
        page.classList.add('open');
        page.classList.add('page-enter');
        page.setAttribute('aria-hidden', 'false');
    }
    if (typeof syncSettingsUI === 'function') syncSettingsUI();
    const target = pane || 'general';
    if (typeof selectSettingsPane === 'function') selectSettingsPane(target);
    const ss = document.getElementById('settingsSearch');
    if (ss) { ss.value = ''; if (typeof runSettingsSearch === 'function') runSettingsSearch(''); }
    if (typeof refreshLibraryPanes === 'function') refreshLibraryPanes(target);
}


const DARK_SITE_CSS = `
:root { color-scheme: dark !important; }
html {
    filter: invert(1) hue-rotate(180deg) !important;
    background: #111 !important;
}
img, video, canvas, svg, picture, iframe,
[style*="background-image"] {
    filter: invert(1) hue-rotate(180deg) !important;
}
`;

const DARK_SITE_CSS_NATIVE = `
:root { color-scheme: dark !important; }
`;


async function siteIsAlreadyDark(view) {
    view = view || webview;
    if (!view || !view.executeJavaScript) return false;
    try {
        return await view.executeJavaScript(`(function () {
            function luminance(color) {
                var m = color && color.match(/[\\d.]+/g);
                if (!m || m.length < 3) return null;
                var r = +m[0], g = +m[1], b = +m[2];
                var a = m.length >= 4 ? +m[3] : 1;
                if (a < 0.1) return null; // практически прозрачный — пропускаем
                return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
            }

            // 1. Явное объявление тёмной схемы сайтом.
            try {
                var declared = getComputedStyle(document.documentElement).colorScheme || '';
                var metaCS = document.querySelector('meta[name="color-scheme"]');
                var metaVal = metaCS ? (metaCS.getAttribute('content') || '') : '';
                var scheme = (declared + ' ' + metaVal).toLowerCase();
                // Если заявлена ТОЛЬКО тёмная схема — сайт сам тёмный.
                if (scheme.indexOf('dark') !== -1 && scheme.indexOf('light') === -1) {
                    return true;
                }
            } catch (e) {}

            // 2. Сайт поддерживает prefers-color-scheme: dark (значит сам даёт тёмную тему).
            try {
                if (window.matchMedia &&
                    window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    // Проверяем, что сайт действительно адаптируется: смотрим фон body ниже.
                    // Используем как сильный сигнал вместе с анализом фона.
                    var prefersDark = true;
                }
            } catch (e) {}

            // 3. Анализ яркости фона нескольких заметных элементов.
            function sample(el) {
                if (!el) return null;
                try {
                    var cs = getComputedStyle(el);
                    return { l: luminance(cs.backgroundColor), area: (el.offsetWidth || 0) * (el.offsetHeight || 0) };
                } catch (e) { return null; }
            }

            var candidates = [
                document.documentElement,
                document.body,
                document.querySelector('main'),
                document.querySelector('header'),
                document.querySelector('[role="main"]'),
                document.querySelector('#root'),
                document.querySelector('#app')
            ];

            // Добавляем крупнейший видимый блок у верха страницы.
            try {
                var mid = document.elementFromPoint(window.innerWidth / 2, Math.min(120, window.innerHeight / 2));
                candidates.push(mid);
            } catch (e) {}

            var weighted = 0, totalWeight = 0, direct = [];
            for (var i = 0; i < candidates.length; i++) {
                var s = sample(candidates[i]);
                if (!s || s.l === null) continue;
                direct.push(s.l);
                var w = Math.max(s.area, 1);
                weighted += s.l * w;
                totalWeight += w;
            }

            var avgLum;
            if (totalWeight > 0) {
                avgLum = weighted / totalWeight; // средняя яркость, взвешенная по площади
            } else if (direct.length) {
                avgLum = direct.reduce(function (a, b) { return a + b; }, 0) / direct.length;
            } else {
                return false; // ничего не смогли измерить — считаем светлым
            }

            // Если сайт заявил prefers-color-scheme: dark И фон не светлый — точно тёмный.
            if (prefersDark && avgLum < 0.6) return true;

            return avgLum < 0.5; // тёмный фон
        })();`);
    } catch {
        return false;
    }
}

async function applyDarkSiteCSS(tab) {
    tab = tab || activeTab();
    if (!tab || !tab.view || !tab.view.insertCSS) return;
    const view = tab.view;
    if (tab._cssKey) {
        try { await view.removeInsertedCSS(tab._cssKey); } catch {}
        tab._cssKey = null;
    }
    if (settings.theme === 'dark' && settings.darkSites) {
        const alreadyDark = await siteIsAlreadyDark(view);
        const css = alreadyDark ? DARK_SITE_CSS_NATIVE : DARK_SITE_CSS;
        try { tab._cssKey = await view.insertCSS(css); } catch {}
    }
}

async function removeDarkSiteCSS(tab) {
    tab = tab || activeTab();
    if (!tab || !tab.view || !tab._cssKey) return;
    try { await tab.view.removeInsertedCSS(tab._cssKey); } catch {}
    tab._cssKey = null;
}

function refreshAllDarkCSS() {
    tabs.forEach(t => { if (t.loaded) applyDarkSiteCSS(t); });
}

function attachWebviewListeners(view, tab) {
    view.addEventListener('media-started-playing', () => {
        tab.isPlaying = true; renderTabs();
    });
    view.addEventListener('media-paused', () => {
        tab.isPlaying = false; renderTabs();
    });

    view.addEventListener('did-start-loading', () => {
        if (tab.id === activeId) loadbar.classList.add('loading');
        tab._cssKey = null; 
        tab.isPlaying = false;
        renderTabs();
    });
    view.addEventListener('did-stop-loading', () => {
        if (tab.id === activeId) {
            loadbar.classList.remove('loading');
            updateNavButtons();
        }
        applyDarkSiteCSS(tab);
        injectPageHelpers(view, tab);
        if (tab.url && !isAboutUrl(tab.url)) {
            addHistoryEntry(tab.url, tab.title);
            if (tab.id === activeId) updateBookmarkButton();
        }
    });
    view.addEventListener('did-fail-load', (e) => {
        if (e.isMainFrame && e.errorCode !== -3 && tab.id === activeId) {
            loadbar.classList.remove('loading');
            console.error('Не удалось загрузить страницу:', e.errorDescription, e.validatedURL || e.url);
        }
    });
    view.addEventListener('did-navigate', (e) => {
        if (e.url && e.url !== 'about:blank') {
            tab.url = e.url;
            if (tab.id === activeId) {
                addressInput.value = e.url;
                updateBookmarkButton();
            }
            addHistoryEntry(e.url, tab.title);
        }
        if (tab.id === activeId) updateNavButtons();
    });
    view.addEventListener('did-navigate-in-page', (e) => {
        if (e.url) {
            tab.url = e.url;
            if (tab.id === activeId) {
                addressInput.value = e.url;
                updateBookmarkButton();
            }
            if (e.isMainFrame !== false) addHistoryEntry(e.url, tab.title);
        }
        if (tab.id === activeId) updateNavButtons();
    });
    view.addEventListener('page-title-updated', (e) => {
        if (e.title) {
            tab.title = e.title;
            renderTabs();
            if (tab.url) touchHistoryTitle(tab.url, e.title);
        }
    });

    view.addEventListener('new-window', (e) => {
        const url = e.url;
        if (!url) return;
        try { e.preventDefault(); } catch {}
        if (/^(https?:|about:)/i.test(url)) createTab(url);
        else if (window.swift && window.swift.openExternal) window.swift.openExternal(url);
    });

    view.addEventListener('ipc-message', (e) => {
        if (e.channel === 'swift-login' && e.args && e.args[0]) {
            handleLoginDetected(e.args[0]);
        }
    });
}

function faviconFor(url) {
    try {
        const u = new URL(url);
        return `https://icons.duckduckgo.com/ip3/${u.hostname}.ico`;
    } catch { return ''; }
}

function renderShortcuts() {
    shortcutsEl.innerHTML = '';
    shortcutsEl.style.display = settings.showShortcuts ? '' : 'none';
    if (!settings.showShortcuts) return;

    userShortcuts.forEach(sc => {
        const a = document.createElement('div');
        a.className = 'shortcut';
        a.dataset.scId = sc.id;
        a.onclick = () => navigate(sc.url);
        a.oncontextmenu = (e) => { e.preventDefault(); showShortcutMenu(e, sc); };

        const icon = document.createElement('div');
        icon.className = 'sc-icon';
        icon.style.background = sc.color;

        const favUrl = faviconFor(sc.url);
        if (favUrl) {
            const img = document.createElement('img');
            img.src = favUrl;
            img.style.cssText = 'width:26px;height:26px;object-fit:contain;border-radius:4px;';
            img.onerror = () => { img.remove(); icon.textContent = sc.icon || sc.label[0]; };
            icon.appendChild(img);
        } else {
            icon.textContent = sc.icon || sc.label[0];
        }

        const label = document.createElement('div');
        label.className = 'sc-label';
        label.textContent = sc.label;

        a.appendChild(icon);
        a.appendChild(label);
        shortcutsEl.appendChild(a);
    });

    const addBtn = document.createElement('div');
    addBtn.className = 'shortcut shortcut-add';
    addBtn.title = 'Добавить сайт';
    addBtn.onclick = () => openShortcutEditor(null);
    const addIcon = document.createElement('div');
    addIcon.className = 'sc-icon sc-icon-add';
    addIcon.innerHTML = '<span class="material-icons-round" style="font-size:22px;color:var(--text-dim)">add</span>';
    const addLabel = document.createElement('div');
    addLabel.className = 'sc-label';
    addLabel.textContent = 'Добавить';
    addBtn.appendChild(addIcon);
    addBtn.appendChild(addLabel);
    shortcutsEl.appendChild(addBtn);
}

let scMenuEl = null;

function closeShortcutMenu() {
    if (scMenuEl) { scMenuEl.remove(); scMenuEl = null; }
    document.removeEventListener('mousedown', _scOutsideClick);
}

function _scOutsideClick(e) {
    if (scMenuEl && !scMenuEl.contains(e.target)) {
        closeShortcutMenu();
    }
}

function showShortcutMenu(e, sc) {
    closeShortcutMenu();
    document.removeEventListener('mousedown', _scOutsideClick);

    const menu = document.createElement('div');
    menu.className = 'sc-context-menu';
    scMenuEl = menu;

    const items = [
        { icon: 'open_in_browser', label: 'Открыть',                 action: () => navigate(sc.url) },
        { icon: 'open_in_new',     label: 'Открыть в новой вкладке', action: () => createTab(sc.url) },
        { icon: 'edit',            label: 'Редактировать',            action: () => openShortcutEditor(sc) },
        { divider: true },
        { icon: 'delete_outline',  label: 'Удалить',                  action: () => deleteShortcut(sc.id), danger: true },
    ];

    items.forEach(item => {
        if (item.divider) {
            const d = document.createElement('div');
            d.className = 'sc-menu-divider';
            menu.appendChild(d);
            return;
        }
        const btn = document.createElement('button');
        btn.className = 'sc-menu-item' + (item.danger ? ' danger' : '');
        const ic = document.createElement('span');
        ic.className = 'material-icons-round';
        ic.textContent = item.icon;
        const tx = document.createElement('span');
        tx.textContent = item.label;
        btn.appendChild(ic);
        btn.appendChild(tx);
        btn.addEventListener('click', () => { closeShortcutMenu(); item.action(); });
        menu.appendChild(btn);
    });

    document.body.appendChild(menu);

    const mw = 210;
    const mh = menu.offsetHeight || 170;
    let x = e.clientX, y = e.clientY;
    if (x + mw > window.innerWidth)  x = window.innerWidth  - mw - 8;
    if (y + mh > window.innerHeight) y = window.innerHeight - mh - 8;
    menu.style.left = x + 'px';
    menu.style.top  = y + 'px';

    requestAnimationFrame(() => menu.classList.add('open'));

    setTimeout(() => {
        document.addEventListener('mousedown', _scOutsideClick);
    }, 0);
}

function openShortcutEditor(sc) {
    const old = document.getElementById('scEditorOverlay');
    if (old) old.remove();

    const isNew = !sc;
    const overlay = document.createElement('div');
    overlay.id = 'scEditorOverlay';
    overlay.className = 'modal-overlay';

    const card = document.createElement('div');
    card.className = 'modal-card';

    card.innerHTML = `
        <h2>
            <span class="material-icons-round">${isNew ? 'add_circle' : 'edit'}</span>
            ${isNew ? 'Добавить сайт' : 'Редактировать плитку'}
        </h2>
        <div style="display:flex;flex-direction:column;gap:12px">
            <div>
                <label style="font-size:12px;color:var(--text-dim);font-weight:500;display:block;margin-bottom:4px">Название</label>
                <input id="scEdName" type="text" placeholder="Например: YouTube" maxlength="24"
                    value="${sc ? sc.label : ''}"
                    style="width:100%;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none">
            </div>
            <div>
                <label style="font-size:12px;color:var(--text-dim);font-weight:500;display:block;margin-bottom:4px">URL</label>
                <input id="scEdUrl" type="text" placeholder="https://example.com" maxlength="256"
                    value="${sc ? sc.url : ''}"
                    style="width:100%;padding:10px 12px;background:var(--bg);border:1px solid var(--border);border-radius:10px;color:var(--text);font-size:14px;font-family:inherit;outline:none">
            </div>
        </div>
        <div class="btn-row" style="margin-top:18px">
            <button class="btn-ghost" id="scEdCancel">Отмена</button>
            <button class="btn-primary ripple" id="scEdSave">${isNew ? 'Добавить' : 'Сохранить'}</button>
        </div>
    `;

    overlay.appendChild(card);
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));

    const nameInput = document.getElementById('scEdName');
    const urlInput  = document.getElementById('scEdUrl');

    [nameInput, urlInput].forEach(inp => {
        inp.addEventListener('focus', () => inp.style.borderColor = 'var(--accent)');
        inp.addEventListener('blur',  () => inp.style.borderColor = 'var(--border)');
    });
    setTimeout(() => nameInput.focus(), 100);

    document.getElementById('scEdCancel').onclick = () => {
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 250);
    };
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
            overlay.classList.remove('open');
            setTimeout(() => overlay.remove(), 250);
        }
    });

    document.getElementById('scEdSave').onclick = () => {
        const name = nameInput.value.trim();
        let url = urlInput.value.trim();
        if (!name || !url) return;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        if (isNew) {
            const colors = ['#3d8bff','#22c55e','#ec4899','#f59e0b','#8b5cf6','#ef4444','#06b6d4','#ff6a3d'];
            const colorIdx = (name.charCodeAt(0) + (url.length)) % colors.length;
            userShortcuts.push({
                id: scNextId++,
                label: name,
                url,
                color: colors[colorIdx],
                icon: name[0].toUpperCase(),
            });
        } else {
            const idx = userShortcuts.findIndex(s => s.id === sc.id);
            if (idx !== -1) {
                userShortcuts[idx].label = name;
                userShortcuts[idx].url   = url;
                userShortcuts[idx].icon  = name[0].toUpperCase();
            }
        }
        saveShortcuts();
        renderShortcuts();
        overlay.classList.remove('open');
        setTimeout(() => overlay.remove(), 250);
    };
}

function deleteShortcut(id) {
    userShortcuts = userShortcuts.filter(s => s.id !== id);
    saveShortcuts();
    renderShortcuts();
}

const wavesCanvas = document.getElementById('wavesCanvas');
const wavesCtx = wavesCanvas ? wavesCanvas.getContext('2d') : null;

let wavesRAF = null;
let wavesStart = 0;
let wavesDPR = 1;
let wavesLastTs = 0;
const WAVES_MIN_FRAME_MS = 1000 / 30; 
let cachedAccentRGB = '255,106,61';

function accentRGB() {
    return cachedAccentRGB;
}
function refreshAccentRGB() {
    const v = getComputedStyle(document.documentElement)
        .getPropertyValue('--accent-rgb').trim();
    cachedAccentRGB = v || '255,106,61';
}

function resizeWaves() {
    if (!wavesCanvas) return;
    wavesDPR = window.devicePixelRatio || 1;
    const w = wavesCanvas.clientWidth || wavesCanvas.offsetWidth || window.innerWidth;
    const h = wavesCanvas.clientHeight || wavesCanvas.offsetHeight || window.innerHeight;
    wavesCanvas.width = Math.max(1, Math.round(w * wavesDPR));
    wavesCanvas.height = Math.max(1, Math.round(h * wavesDPR));
}

const WAVE_LAYERS = [
    { amp: 26, len: 0.0032, speed: 0.00022, yOff: 0.74, alpha: 0.30 },
    { amp: 34, len: 0.0024, speed: 0.00031, yOff: 0.82, alpha: 0.24 },
    { amp: 20, len: 0.0041, speed: 0.00042, yOff: 0.90, alpha: 0.18 },
];

function drawWaves(ts) {
    if (!wavesCtx) return;
    if (document.hidden || homePage.classList.contains('hidden')) {
        wavesRAF = null;
        return;
    }
    wavesRAF = requestAnimationFrame(drawWaves);
    if (ts - wavesLastTs < WAVES_MIN_FRAME_MS) return;
    wavesLastTs = ts;
    if (!wavesStart) wavesStart = ts;
    const t = ts - wavesStart;

    const W = wavesCanvas.width;
    const H = wavesCanvas.height;
    const rgb = accentRGB();

    wavesCtx.clearRect(0, 0, W, H);

    if (settings.wavesType === 'stripes') {
        drawStripeWaves(t, W, H, rgb);
    } else {
        drawNormalWaves(t, W, H, rgb);
    }
    drawDottedLogo();
}

function drawNormalWaves(t, W, H, rgb) {
    const step = Math.max(8, Math.round(10 * wavesDPR));
    WAVE_LAYERS.forEach((layer, i) => {
        const baseY = H * layer.yOff;
        const amp = layer.amp * wavesDPR;
        const phase = t * layer.speed + i * 1.3;

        wavesCtx.beginPath();
        wavesCtx.moveTo(0, H);
        for (let x = 0; x <= W; x += step) {
            const y = baseY
                + Math.sin(x * layer.len + phase) * amp
                + Math.sin(x * layer.len * 0.5 + phase * 1.7) * amp * 0.4;
            wavesCtx.lineTo(x, y);
        }
        wavesCtx.lineTo(W, H);
        wavesCtx.closePath();

        const grad = wavesCtx.createLinearGradient(0, baseY - amp, 0, H);
        grad.addColorStop(0, `rgba(${rgb},${layer.alpha})`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        wavesCtx.fillStyle = grad;
        wavesCtx.fill();
    });
}

function drawStripeWaves(t, W, H, rgb) {
    const lines = 16;
    const gap = H / (lines + 1);
    const step = Math.max(10, Math.round(12 * wavesDPR));
    wavesCtx.lineWidth = Math.max(1, 1.2 * wavesDPR);

    for (let i = 0; i < lines; i++) {
        const baseY = gap * (i + 1);
        const amp = (10 + (i % 5) * 6) * wavesDPR;
        const len = 0.0028 + (i % 4) * 0.0006;
        const phase = t * (0.00018 + (i % 6) * 0.00004) + i * 0.5;
        const alpha = 0.08 + 0.22 * (i / lines);

        wavesCtx.beginPath();
        for (let x = 0; x <= W; x += step) {
            const y = baseY
                + Math.sin(x * len + phase) * amp
                + Math.cos(x * len * 0.6 - phase * 1.3) * amp * 0.35;
            if (x === 0) wavesCtx.moveTo(x, y);
            else wavesCtx.lineTo(x, y);
        }
        wavesCtx.strokeStyle = `rgba(${rgb},${alpha})`;
        wavesCtx.stroke();
    }
}

function startWaves() {
    if (!wavesCanvas) return;
    stopWaves();
    if (!settings.showWaves || homePage.classList.contains('hidden') || document.hidden) {
        wavesCanvas.classList.add('hidden');
        return;
    }
    wavesCanvas.classList.remove('hidden');
    resizeWaves();
    refreshAccentRGB();
    wavesStart = 0;
    wavesLastTs = 0;
    wavesRAF = requestAnimationFrame(drawWaves);
}

function stopWaves() {
    if (wavesRAF) { cancelAnimationFrame(wavesRAF); wavesRAF = null; }
}

const dottedLogo = document.getElementById('dottedLogo');
const dottedCtx = dottedLogo ? dottedLogo.getContext('2d') : null;
const dottedState = {
    anchors: [],
    pointerX: -1000,
    pointerY: -1000,
    active: false,
    cssWidth: 0,
    cssHeight: 0,
    dpr: 1,
};

function rebuildDottedLogo() {
    if (!dottedLogo || !dottedCtx) return;
    const rect = dottedLogo.getBoundingClientRect();
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    if (width === dottedState.cssWidth && height === dottedState.cssHeight && dpr === dottedState.dpr) return;

    dottedState.cssWidth = width;
    dottedState.cssHeight = height;
    dottedState.dpr = dpr;
    dottedLogo.width = Math.max(1, Math.round(width * dpr));
    dottedLogo.height = Math.max(1, Math.round(height * dpr));
    dottedCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const sample = document.createElement('canvas');
    sample.width = width;
    sample.height = height;
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    const fontSize = Math.min(52, Math.max(34, width / 11.8));
    sampleCtx.font = `700 ${fontSize}px "Segoe UI", system-ui, sans-serif`;
    sampleCtx.textAlign = 'center';
    sampleCtx.textBaseline = 'middle';
    sampleCtx.fillStyle = '#fff';
    sampleCtx.fillText('Swift Browser', width / 2, height / 2);

    const pixels = sampleCtx.getImageData(0, 0, width, height).data;
    const gap = width < 430 ? 4 : 5;
    const anchors = [];
    for (let y = gap / 2; y < height; y += gap) {
        for (let x = gap / 2; x < width; x += gap) {
            if (pixels[(Math.floor(y) * width + Math.floor(x)) * 4 + 3] > 96) {
                anchors.push({ x, y, dx: 0, dy: 0, vx: 0, vy: 0 });
            }
        }
    }
    dottedState.anchors = anchors;
    drawDottedLogo();
}

function drawDottedLogo() {
    if (!dottedCtx) return;
    const { cssWidth, cssHeight, anchors, pointerX, pointerY, active } = dottedState;
    dottedCtx.clearRect(0, 0, cssWidth, cssHeight);
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#ff6a3d';
    dottedCtx.fillStyle = accent;
    dottedCtx.shadowColor = 'transparent';
    dottedCtx.shadowBlur = 0;

    for (const point of anchors) {
        if (active) {
            const px = point.x + point.dx;
            const py = point.y + point.dy;
            const rx = px - pointerX;
            const ry = py - pointerY;
            const distance = Math.hypot(rx, ry);
            if (distance < 58 && distance > 0.01) {
                const force = (1 - distance / 58) * 1.35;
                point.vx += (rx / distance) * force;
                point.vy += (ry / distance) * force;
            }
            point.vx += -point.dx * 0.12;
            point.vy += -point.dy * 0.12;
            point.vx *= 0.72;
            point.vy *= 0.72;
            point.dx += point.vx;
            point.dy += point.vy;
            if (Math.abs(point.dx) < 0.01 && Math.abs(point.vx) < 0.01) point.dx = point.vx = 0;
            if (Math.abs(point.dy) < 0.01 && Math.abs(point.vy) < 0.01) point.dy = point.vy = 0;
        } else if (point.dx !== 0 || point.dy !== 0 || point.vx !== 0 || point.vy !== 0) {
            point.dx = point.dy = point.vx = point.vy = 0;
        }
        dottedCtx.beginPath();
        dottedCtx.arc(
            Math.round(point.x + point.dx),
            Math.round(point.y + point.dy),
            1.45, 0, Math.PI * 2
        );
        dottedCtx.fill();
    }
}

function updateDottedPointer(event) {
    const rect = dottedLogo.getBoundingClientRect();
    dottedState.pointerX = event.clientX - rect.left;
    dottedState.pointerY = event.clientY - rect.top;
    dottedState.active = true;
}
if (dottedLogo) {
    dottedLogo.addEventListener('pointermove', updateDottedPointer);
    dottedLogo.addEventListener('pointerleave', () => { dottedState.active = false; });
}

function startDotted() {
    rebuildDottedLogo();
}

function stopDotted() {
    dottedState.active = false;
}

let homeResizeTimer = null;
function resizeHomeCanvases() {
    clearTimeout(homeResizeTimer);
    homeResizeTimer = setTimeout(() => {
        if (homePage.classList.contains('hidden')) return;
        resizeWaves();
        rebuildDottedLogo();
    }, 100);
}
window.addEventListener('resize', resizeHomeCanvases);
if (window.ResizeObserver && dottedLogo) {
    new ResizeObserver(resizeHomeCanvases).observe(dottedLogo);
}

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        stopHomeAnimations();
    } else if (!homePage.classList.contains('hidden')) {
        startHomeAnimations();
    }
});

function startHomeAnimations() {
    refreshAccentRGB();
    startWaves();
    startDotted();
}
function stopHomeAnimations() {
    stopWaves();
    stopDotted();
}

addressForm.addEventListener('submit', (e) => { e.preventDefault(); goTo(addressInput.value); });
goBtn.addEventListener('click', () => goTo(addressInput.value));

homeSearchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = homeSearchInput.value.trim();
    if (q) navigate(searchUrl(q));
});

newTabBtn.addEventListener('click', () => createTab());
backBtn.addEventListener('click', goBack);
forwardBtn.addEventListener('click', goForward);
reloadBtn.addEventListener('click', reload);
homeBtn.addEventListener('click', goHome);
addressInput.addEventListener('focus', () => addressInput.select());

document.addEventListener('keydown', (e) => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key === 't') { e.preventDefault(); createTab(); }
    else if (mod && e.key === 'w') { e.preventDefault(); closeTab(activeId); }
    else if (mod && e.key === 'l') { e.preventDefault(); addressInput.focus(); }
    else if (mod && e.key === 'r') { e.preventDefault(); reload(); }
    else if (mod && e.key === 'h') { e.preventDefault(); navigate('about:history'); }
    else if (mod && e.shiftKey && (e.key === 'O' || e.key === 'o')) { e.preventDefault(); navigate('about:bookmarks'); }
    else if (mod && e.key === 'd') {
        e.preventDefault();
        const tab = activeTab();
        if (tab && tab.url) toggleBookmark(tab.url, tab.title);
    }
    else if (e.altKey && e.key === 'ArrowLeft')  { e.preventDefault(); goBack(); }
    else if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); goForward(); }
});

const settingsBtn      = document.getElementById('settingsBtn');
const settingsPage     = document.getElementById('settingsPage');
const settingsNav      = document.getElementById('settingsNav');
const settingsSearch   = document.getElementById('settingsSearch');
const settingsClose    = document.getElementById('settingsClose');
const searchEngineSelect = document.getElementById('searchEngineSelect');
const themeToggle      = document.getElementById('themeToggle');
const accentGrid       = document.getElementById('accentGrid');
const toggleTagline    = document.getElementById('toggleTagline');
const toggleShortcuts  = document.getElementById('toggleShortcuts');
const toggleWaves      = document.getElementById('toggleWaves');
const wavesTypeToggle  = document.getElementById('wavesType');
const toggleBlockTrackers    = document.getElementById('toggleBlockTrackers');
const toggleThirdPartyCookies = document.getElementById('toggleThirdPartyCookies');
const toggleDNT              = document.getElementById('toggleDNT');
const toggleHttpsOnly        = document.getElementById('toggleHttpsOnly');
const toggleJavaScript       = document.getElementById('toggleJavaScript');
const clearDataBtn     = document.getElementById('clearDataBtn');
const resetSettingsBtn = document.getElementById('resetSettingsBtn');
const settingsVersion  = document.getElementById('settingsVersion');
const taglineEl        = document.querySelector('.tagline');

function applySettings() {
    const root = document.documentElement;

    root.setAttribute('data-theme', settings.theme);

    const accent = ACCENTS.find(a => a.id === settings.accent) || ACCENTS[0];
    root.style.setProperty('--accent', accent.c);
    root.style.setProperty('--accent-2', accent.c2);
    root.style.setProperty('--accent-rgb', accent.rgb);
    if (typeof refreshAccentRGB === 'function') refreshAccentRGB();

    root.classList.toggle('no-anim', !settings.uiAnimations || settings.reduceMotion);
    root.classList.toggle('reduce-motion', !!settings.reduceMotion);

    const engName = (SEARCH_ENGINES[settings.engine] || SEARCH_ENGINES.duckduckgo).name;
    if (homeSearchInput) homeSearchInput.placeholder = 'Поиск в ' + engName;
    if (addressInput) addressInput.placeholder = 'Поиск в ' + engName + ' или введите адрес';

    if (taglineEl) taglineEl.style.display = settings.showTagline ? '' : 'none';
    renderShortcuts();

    if (typeof startHomeAnimations === 'function' && !homePage.classList.contains('hidden')) {
        startHomeAnimations();
    }

    if (settings.theme === 'dark' && settings.darkSites) {
        tabs.forEach(t => { if (t.loaded) applyDarkSiteCSS(t); });
    } else {
        tabs.forEach(t => { if (t.loaded) removeDarkSiteCSS(t); });
    }

    applyPrivacy();
}

function applyPrivacy() {
    tabs.forEach(t => {
        if (!t.view) return;
        try {
            t.view.setAttribute('webpreferences',
                'javascript=' + (settings.enableJavaScript ? 'yes' : 'no') +
                ', backgroundThrottling=yes');
        } catch {}
    });

    try {
        if (window.swift && typeof window.swift.setPrivacy === 'function') {
            window.swift.setPrivacy({
                blockTrackers: settings.blockTrackers,
                blockSocial: settings.blockSocial,
                blockThirdPartyCookies: settings.blockThirdPartyCookies,
                doNotTrack: settings.doNotTrack,
                httpsOnly: settings.httpsOnly,
                stripReferrer: settings.stripReferrer,
                blockFingerprinting: settings.blockFingerprinting,
                clearOnExit: settings.clearOnExit,
            });
        }
    } catch {}
}

function renderEngineSelect(container, selectedId, onChange) {
    if (!container) return;
    container.style.display = 'none'; 

    let wrap = container.parentElement.querySelector('.engine-select-wrap');
    if (!wrap) {
        wrap = document.createElement('div');
        wrap.className = 'engine-select-wrap';
        container.parentElement.insertBefore(wrap, container.nextSibling);
    }

    const curEng = SEARCH_ENGINES[selectedId] || SEARCH_ENGINES.duckduckgo;

    wrap.innerHTML = '';

    const selDiv = document.createElement('div');
    selDiv.className = 'engine-selected ripple';
    selDiv.tabIndex = 0;

    const selIcon = createEngineIcon(selectedId, 'engine-sel-icon');

    const selName = document.createElement('span');
    selName.className = 'engine-sel-name';
    selName.textContent = curEng.name;

    const selArrow = document.createElement('span');
    selArrow.className = 'material-icons-round engine-sel-arrow';
    selArrow.textContent = 'expand_more';

    selDiv.appendChild(selIcon);
    selDiv.appendChild(selName);
    selDiv.appendChild(selArrow);

    const drop = document.createElement('div');
    drop.className = 'engine-dropdown';
    drop.style.display = 'none';

    Object.entries(SEARCH_ENGINES).forEach(([id, eng]) => {
        const opt = document.createElement('div');
        opt.className = 'engine-option' + (id === selectedId ? ' active' : '');
        opt.dataset.id = id;

        const optIcon = createEngineIcon(id, 'engine-opt-icon');

        const optName = document.createElement('span');
        optName.className = 'engine-opt-name';
        optName.textContent = eng.name;

        opt.appendChild(optIcon);
        opt.appendChild(optName);

        if (id === selectedId) {
            const chk = document.createElement('span');
            chk.className = 'material-icons-round engine-opt-check';
            chk.textContent = 'check';
            opt.appendChild(chk);
        }

        drop.appendChild(opt);
    });

    wrap.appendChild(selDiv);
    wrap.appendChild(drop);

    selDiv.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = drop.style.display !== 'none';
        drop.style.display = isOpen ? 'none' : 'block';
        selArrow.textContent = isOpen ? 'expand_more' : 'expand_less';
    });

    drop.querySelectorAll('.engine-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const id = opt.dataset.id;
            drop.style.display = 'none';
            selArrow.textContent = 'expand_more';
            onChange(id);
            renderEngineSelect(container, id, onChange);
        });
    });

    document.addEventListener('click', function closeDropdown(e) {
        if (!wrap.contains(e.target)) {
            drop.style.display = 'none';
            selArrow.textContent = 'expand_more';
            document.removeEventListener('click', closeDropdown);
        }
    });
}

function syncSettingsUI() {
    renderEngineSelect(searchEngineSelect, settings.engine, (id) => {
        settings.engine = id;
        saveSettings();
        applySettings();
    });

    themeToggle.querySelectorAll('button').forEach(b => {
        b.classList.toggle('active', b.dataset.theme === settings.theme);
    });

    accentGrid.innerHTML = '';
    ACCENTS.forEach(a => {
        const sw = document.createElement('div');
        sw.className = 'accent-swatch' + (a.id === settings.accent ? ' active' : '');
        sw.style.background = a.c;
        sw.title = a.id;
        sw.onclick = () => {
            settings.accent = a.id;
            saveSettings();
            applySettings();
            syncSettingsUI();
        };
        accentGrid.appendChild(sw);
    });

    toggleTagline.checked = settings.showTagline;
    toggleShortcuts.checked = settings.showShortcuts;

    if (toggleWaves) toggleWaves.checked = settings.showWaves;
    if (wavesTypeToggle) {
        wavesTypeToggle.querySelectorAll('button').forEach(b => {
            b.classList.toggle('active', b.dataset.waves === settings.wavesType);
        });
        wavesTypeToggle.classList.toggle('disabled', !settings.showWaves);
    }

    if (toggleBlockTrackers)     toggleBlockTrackers.checked = settings.blockTrackers;
    if (toggleThirdPartyCookies) toggleThirdPartyCookies.checked = settings.blockThirdPartyCookies;
    if (toggleDNT)               toggleDNT.checked = settings.doNotTrack;
    if (toggleHttpsOnly)         toggleHttpsOnly.checked = settings.httpsOnly;
    if (toggleJavaScript)        toggleJavaScript.checked = settings.enableJavaScript;

    const toggleDarkSites = document.getElementById('toggleDarkSites');
    if (toggleDarkSites) toggleDarkSites.checked = settings.darkSites;

    const toggleBlockSocial = document.getElementById('toggleBlockSocial');
    const toggleStripReferrer = document.getElementById('toggleStripReferrer');
    const toggleFingerprinting = document.getElementById('toggleFingerprinting');
    const toggleSaveHistory = document.getElementById('toggleSaveHistory');
    const toggleSavePasswords = document.getElementById('toggleSavePasswords');
    const toggleClearOnExit = document.getElementById('toggleClearOnExit');
    const toggleUiAnim = document.getElementById('toggleUiAnim');
    const toggleReduceMotion = document.getElementById('toggleReduceMotion');
    if (toggleBlockSocial) toggleBlockSocial.checked = settings.blockSocial;
    if (toggleStripReferrer) toggleStripReferrer.checked = settings.stripReferrer;
    if (toggleFingerprinting) toggleFingerprinting.checked = settings.blockFingerprinting;
    if (toggleSaveHistory) toggleSaveHistory.checked = settings.saveHistory;
    if (toggleSavePasswords) toggleSavePasswords.checked = settings.savePasswords;
    if (toggleClearOnExit) toggleClearOnExit.checked = settings.clearOnExit;
    if (toggleUiAnim) toggleUiAnim.checked = settings.uiAnimations;
    if (toggleReduceMotion) toggleReduceMotion.checked = settings.reduceMotion;

    if (window.swift && window.swift.versions) {
        settingsVersion.textContent =
            `Swift Browser 1.0.0 · Electron ${window.swift.versions.electron}`;
    } else {
        settingsVersion.textContent = 'Swift Browser 1.0.0';
    }
}

function selectSettingsPane(pane) {
    if (!settingsNav) return;
    settingsNav.querySelectorAll('.settings-nav-item').forEach(b => {
        b.classList.toggle('active', b.dataset.pane === pane);
    });
    document.querySelectorAll('.settings-pane').forEach(p => {
        const active = p.id === 'pane-' + pane;
        p.classList.toggle('active', active);
        if (active && settings.uiAnimations && !settings.reduceMotion) {
            p.classList.remove('pane-enter');
            void p.offsetWidth;
            p.classList.add('pane-enter');
        }
    });
    const scroll = document.getElementById('settingsScroll');
    if (scroll) scroll.scrollTop = 0;
    if (typeof refreshLibraryPanes === 'function') refreshLibraryPanes(pane);
    if (pane === 'extensions') refreshExtensionsUI();
}

async function refreshExtensionsUI() {
    const list = document.getElementById('extensionsList');
    const status = document.getElementById('extensionsStatus');
    if (!list || !window.swift || !window.swift.listExtensions) return;
    list.replaceChildren();

    const showEmptyState = (icon, title, message) => {
        const empty = document.createElement('div');
        empty.className = 'extensions-empty';
        const emptyIcon = document.createElement('span');
        emptyIcon.className = 'material-icons-round extensions-empty-icon';
        emptyIcon.setAttribute('aria-hidden', 'true');
        emptyIcon.textContent = icon;
        const copy = document.createElement('div');
        const heading = document.createElement('strong');
        heading.textContent = title;
        const hint = document.createElement('span');
        hint.textContent = message;
        copy.append(heading, hint);
        empty.append(emptyIcon, copy);
        list.appendChild(empty);
    };

    if (isIncognito()) {
        status.textContent = '';
        showEmptyState('visibility_off', 'Недоступно в приватном режиме', 'Переключитесь на обычный профиль, чтобы управлять расширениями.');
        return;
    }
    try {
        const extensions = await ensureProfileExtensions(currentProfilePartition());
        if (!extensions.length) {
            status.textContent = '';
            showEmptyState('extension_off', 'Расширений пока нет', 'Установите дополнение по ссылке или выберите XPI-файл либо папку.');
            return;
        }
        status.textContent = `${extensions.length} ${extensions.length === 1 ? 'расширение' : 'расширения'}`;
        extensions.forEach(extension => {
            const row = document.createElement('article');
            row.className = `extension-row${extension.enabled ? '' : ' is-disabled'}${extension.enabled && !extension.loaded ? ' has-error' : ''}`;

            const icon = document.createElement('div');
            icon.className = 'extension-icon';
            icon.setAttribute('aria-hidden', 'true');
            const iconGlyph = document.createElement('span');
            iconGlyph.className = 'material-icons-round';
            iconGlyph.textContent = 'extension';
            icon.appendChild(iconGlyph);

            const info = document.createElement('div');
            info.className = 'extension-info';
            const heading = document.createElement('div');
            heading.className = 'extension-heading';
            const name = document.createElement('strong');
            name.textContent = extension.name || 'Расширение без названия';
            const badge = document.createElement('span');
            badge.className = `extension-badge ${extension.enabled && extension.loaded ? 'is-enabled' : 'is-disabled'}`;
            badge.textContent = extension.enabled ? (extension.loaded ? 'Включено' : 'Ошибка загрузки') : 'Выключено';
            heading.append(name, badge);

            const meta = document.createElement('div');
            meta.className = 'extension-meta';
            const version = document.createElement('span');
            version.textContent = `Версия ${extension.version || 'не указана'}`;
            meta.appendChild(version);
            if (extension.id) {
                const source = document.createElement('span');
                source.className = 'extension-source';
                source.textContent = extension.id;
                source.title = extension.id;
                meta.appendChild(source);
            }
            info.append(heading, meta);
            if (extension.enabled && !extension.loaded) {
                const error = document.createElement('p');
                error.className = 'extension-error';
                error.textContent = extension.error || 'Не удалось загрузить в этом профиле';
                info.appendChild(error);
            }

            const actions = document.createElement('div');
            actions.className = 'extension-actions';
            const toggleLabel = document.createElement('label');
            toggleLabel.className = 'extension-toggle';
            toggleLabel.title = `${extension.enabled ? 'Выключить' : 'Включить'} ${name.textContent}`;
            const toggle = document.createElement('input');
            toggle.type = 'checkbox';
            toggle.checked = extension.enabled;
            toggle.setAttribute('aria-label', toggleLabel.title);
            const toggleTrack = document.createElement('span');
            toggleTrack.className = 'extension-toggle-track';
            toggle.addEventListener('change', async () => {
                const partition = currentProfilePartition();
                const nextEnabled = toggle.checked;
                toggle.disabled = true;
                remove.disabled = true;
                status.textContent = nextEnabled ? 'Включаем расширение…' : 'Выключаем расширение…';
                const result = await window.swift.setExtensionEnabled(partition, extension.key, nextEnabled);
                if (result.ok) {
                    extensionStartupTasks.delete(partition);
                    status.textContent = nextEnabled ? 'Расширение включено.' : 'Расширение выключено.';
                    refreshExtensionsUI();
                } else {
                    toggle.checked = !nextEnabled;
                    toggle.disabled = false;
                    remove.disabled = false;
                    status.textContent = result.error || 'Не удалось изменить состояние расширения.';
                }
            });
            toggleLabel.append(toggle, toggleTrack);
            const remove = document.createElement('button');
            remove.className = 'extension-remove';
            remove.type = 'button';
            remove.innerHTML = '<span class="material-icons-round" aria-hidden="true">delete_outline</span><span>Удалить</span>';
            remove.title = `Удалить ${name.textContent}`;
            remove.setAttribute('aria-label', remove.title);
            remove.addEventListener('click', async () => {
                remove.disabled = true;
                const result = await window.swift.removeExtension(currentProfilePartition(), extension.key);
                if (result.ok) {
                    extensionStartupTasks.delete(currentProfilePartition());
                    refreshExtensionsUI();
                } else {
                    remove.disabled = false;
                    status.textContent = result.error || 'Не удалось удалить расширение.';
                }
            });
            actions.append(toggleLabel, remove);
            row.append(icon, info, actions);
            list.appendChild(row);
        });
    } catch (error) {
        status.textContent = error.message || 'Не удалось загрузить список расширений.';
        showEmptyState('error_outline', 'Не удалось показать расширения', 'Попробуйте открыть раздел ещё раз.');
    }
}

const installExtensionBtn = document.getElementById('installExtensionBtn');
if (installExtensionBtn) {
    installExtensionBtn.addEventListener('click', async () => {
        const status = document.getElementById('extensionsStatus');
        if (isIncognito()) {
            status.textContent = 'Переключитесь на обычный профиль, чтобы установить расширение.';
            return;
        }
        installExtensionBtn.disabled = true;
        status.textContent = 'Выберите XPI-файл или папку расширения…';
        const result = await window.swift.installExtension(currentProfilePartition());
        installExtensionBtn.disabled = false;
        if (result.canceled) {
            status.textContent = '';
        } else if (result.ok) {
            extensionStartupTasks.delete(currentProfilePartition());
            status.textContent = `Установлено: ${result.extension.name}`;
            refreshExtensionsUI();
        } else {
            status.textContent = result.error || 'Не удалось установить расширение.';
        }
    });
}

const extensionLinkForm = document.getElementById('extensionLinkForm');
if (extensionLinkForm) {
    const input = document.getElementById('extensionLinkInput');
    const pasteButton = document.getElementById('pasteExtensionLinkBtn');
    pasteButton.addEventListener('click', () => {
        input.value = window.swift.readClipboardText().trim();
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
    });

    extensionLinkForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const status = document.getElementById('extensionsStatus');
        const button = document.getElementById('installExtensionLinkBtn');
        if (isIncognito()) {
            status.textContent = 'Переключитесь на обычный профиль, чтобы установить расширение.';
            return;
        }
        button.disabled = true;
        status.textContent = 'Скачиваю и проверяю расширение…';
        const partition = currentProfilePartition();
        const link = input.value.trim();
        const url = /^[a-z][a-z\d+.-]*:/i.test(link) ? link : `https://${link}`;
        try {
            const result = await window.swift.installExtensionFromUrl(partition, url);
            if (result.ok) {
                input.value = '';
                extensionStartupTasks.delete(partition);
                status.textContent = `Установлено: ${result.extension.name}`;
                refreshExtensionsUI();
            } else {
                status.textContent = result.error || 'Не удалось установить расширение по ссылке.';
            }
        } catch (error) {
            status.textContent = error.message || 'Не удалось установить расширение по ссылке.';
        } finally {
            button.disabled = false;
        }
    });
}

const openAddonCatalogBtn = document.getElementById('openAddonCatalogBtn');
if (openAddonCatalogBtn) {
    openAddonCatalogBtn.addEventListener('click', () => {
        window.swift.openExternal('https://addons.mozilla.org/firefox/');
    });
}

function openSettings() {
    const settingsTab = tabs.find(tab =>
        tab.url === 'about:preferences' || tab.url === 'about:settings'
    );
    if (settingsTab) switchTab(settingsTab.id);
    else createTab('about:preferences');
}
function closeSettings() {
    const tab = activeTab();
    if (tab) {
        tab.url = null;
        tab.title = 'Новая вкладка';
    }
    addressInput.value = '';
    showHome();
    renderTabs();
    updateNavButtons();
    updateBookmarkButton();
}

function runSettingsSearch(query) {
    const q = (query || '').trim().toLowerCase();
    const panes = document.querySelectorAll('.settings-pane');

    if (!q) {
        document.querySelectorAll('.settings-card').forEach(c => c.classList.remove('search-hidden'));
        settingsNav.querySelectorAll('.settings-nav-item').forEach(b => b.classList.remove('search-hidden'));
        panes.forEach(p => p.style.removeProperty('display'));
        const active = settingsNav.querySelector('.settings-nav-item.active');
        if (active) selectSettingsPane(active.dataset.pane);
        return;
    }

    settingsNav.querySelectorAll('.settings-nav-item').forEach(b => b.classList.add('search-hidden'));
    panes.forEach(p => {
        let anyVisible = false;
        p.querySelectorAll('.settings-card').forEach(card => {
            const match = card.textContent.toLowerCase().includes(q);
            card.classList.toggle('search-hidden', !match);
            if (match) anyVisible = true;
        });
        p.style.display = anyVisible ? 'block' : 'none';
    });
}

settingsBtn.addEventListener('click', openSettings);
settingsClose.addEventListener('click', closeSettings);

const minimizeWindowBtn = document.getElementById('minimizeWindowBtn');
const maximizeWindowBtn = document.getElementById('maximizeWindowBtn');
const closeWindowBtn = document.getElementById('closeWindowBtn');
function updateMaximizeButton(maximized) {
    if (!maximizeWindowBtn) return;
    const icon = maximizeWindowBtn.querySelector('.material-icons-round');
    icon.textContent = maximized ? 'filter_none' : 'crop_square';
    maximizeWindowBtn.title = maximized ? 'Восстановить' : 'Развернуть';
    maximizeWindowBtn.setAttribute('aria-label', maximizeWindowBtn.title);
}
if (minimizeWindowBtn) minimizeWindowBtn.addEventListener('click', () => window.swift.controlWindow('minimize'));
if (maximizeWindowBtn) {
    maximizeWindowBtn.addEventListener('click', async () => {
        updateMaximizeButton(await window.swift.controlWindow('toggle-maximize'));
    });
    window.swift.isWindowMaximized().then(updateMaximizeButton);
    window.swift.onWindowState(updateMaximizeButton);
}
if (closeWindowBtn) closeWindowBtn.addEventListener('click', () => window.swift.controlWindow('close'));

if (settingsNav) {
    settingsNav.addEventListener('click', (e) => {
        const item = e.target.closest('.settings-nav-item');
        if (!item) return;
        if (settingsSearch) settingsSearch.value = '';
        runSettingsSearch('');
        selectSettingsPane(item.dataset.pane);
    });
}

if (settingsSearch) {
    settingsSearch.addEventListener('input', () => runSettingsSearch(settingsSearch.value));
}


themeToggle.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-theme]');
    if (!btn) return;
    settings.theme = btn.dataset.theme;
    saveSettings();
    applySettings();
    syncSettingsUI();
});

toggleTagline.addEventListener('change', () => {
    settings.showTagline = toggleTagline.checked;
    saveSettings();
    applySettings();
});
toggleShortcuts.addEventListener('change', () => {
    settings.showShortcuts = toggleShortcuts.checked;
    saveSettings();
    applySettings();
});

if (toggleWaves) {
    toggleWaves.addEventListener('change', () => {
        settings.showWaves = toggleWaves.checked;
        saveSettings();
        applySettings();
        syncSettingsUI();
    });
}

if (wavesTypeToggle) {
    wavesTypeToggle.addEventListener('click', (e) => {
        const btn = e.target.closest('button[data-waves]');
        if (!btn) return;
        settings.wavesType = btn.dataset.waves;
        saveSettings();
        syncSettingsUI();
        applySettings();
    });
}

function bindPrivacyToggle(el, key, { reload = false } = {}) {
    if (!el) return;
    el.addEventListener('change', () => {
        settings[key] = el.checked;
        saveSettings();
        applyPrivacy();
        if (reload) { const t = activeTab(); if (t && t.url && !isAboutUrl(t.url)) webview.reload(); }
    });
}
const toggleDarkSitesEl = document.getElementById('toggleDarkSites');
if (toggleDarkSitesEl) {
    toggleDarkSitesEl.addEventListener('change', () => {
        settings.darkSites = toggleDarkSitesEl.checked;
        saveSettings();
        applySettings();
    });
}

bindPrivacyToggle(toggleBlockTrackers,     'blockTrackers',          { reload: true });
bindPrivacyToggle(toggleThirdPartyCookies, 'blockThirdPartyCookies', { reload: true });
bindPrivacyToggle(toggleDNT,               'doNotTrack',             { reload: true });
bindPrivacyToggle(toggleHttpsOnly,         'httpsOnly',              { reload: true });
bindPrivacyToggle(toggleJavaScript,        'enableJavaScript',       { reload: true });
bindPrivacyToggle(document.getElementById('toggleBlockSocial'), 'blockSocial', { reload: true });
bindPrivacyToggle(document.getElementById('toggleStripReferrer'), 'stripReferrer', { reload: true });
bindPrivacyToggle(document.getElementById('toggleFingerprinting'), 'blockFingerprinting', { reload: true });
bindPrivacyToggle(document.getElementById('toggleSaveHistory'), 'saveHistory');
bindPrivacyToggle(document.getElementById('toggleSavePasswords'), 'savePasswords');
bindPrivacyToggle(document.getElementById('toggleClearOnExit'), 'clearOnExit');

const toggleUiAnimEl = document.getElementById('toggleUiAnim');
if (toggleUiAnimEl) {
    toggleUiAnimEl.addEventListener('change', () => {
        settings.uiAnimations = toggleUiAnimEl.checked;
        saveSettings();
        applySettings();
    });
}
const toggleReduceMotionEl = document.getElementById('toggleReduceMotion');
if (toggleReduceMotionEl) {
    toggleReduceMotionEl.addEventListener('change', () => {
        settings.reduceMotion = toggleReduceMotionEl.checked;
        saveSettings();
        applySettings();
    });
}

clearDataBtn.addEventListener('click', async () => {
    clearDataBtn.disabled = true;
    const original = 'Очистить данные просмотра';
    clearDataBtn.textContent = 'Очистка…';
    try {
        if (webview && webview.clearHistory) webview.clearHistory();
        if (window.swift && typeof window.swift.clearData === 'function') {
            await window.swift.clearData();
        }
        if (typeof clearHistory === 'function') clearHistory();
    } catch {}
    tabs.forEach(t => { if (t.view) { try { t.view.remove(); } catch {} } });
    webviewHost.innerHTML = '';
    tabs = [];
    nextId = 1;
    createTab();
    clearDataBtn.textContent = '✓ Данные очищены';
    setTimeout(() => { clearDataBtn.textContent = original; clearDataBtn.disabled = false; }, 1500);
});

resetSettingsBtn.addEventListener('click', () => {
    settings = Object.assign({}, DEFAULT_SETTINGS);
    saveSettings();
    applySettings();
    syncSettingsUI();
});

document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        const prompt = document.getElementById('passwordPrompt');
        if (prompt && prompt.classList.contains('open')) {
            if (typeof hidePasswordPrompt === 'function') hidePasswordPrompt();
            return;
        }
        const tab = activeTab();
        if (tab && isAboutUrl(tab.url)) closeSettings();
    } else if ((e.ctrlKey || e.metaKey) && e.key === ',') { e.preventDefault(); openSettings(); }
});

const PROFILES_KEY = 'swift-profiles';
const PROFILE_COLORS = ['#ff6a3d','#3d8bff','#8b5cf6','#22c55e','#ec4899','#ef4444','#f59e0b','#06b6d4'];
const INCOGNITO_COLOR = '#5b6578';

function loadProfiles() {
    try {
        const data = JSON.parse(localStorage.getItem(PROFILES_KEY));
        if (data && Array.isArray(data.list) && data.list.length > 0) {
            data.list = data.list.filter(p => !p.guest);
            if (!data.list.length) {
                data.list = [{ id: 1, name: 'Основной', color: PROFILE_COLORS[0], created: Date.now() }];
                data.activeId = 1;
            } else if (!data.list.some(p => p.id === data.activeId)) {
                data.activeId = data.list[0].id;
            }
            saveProfiles(data);
            return data;
        }
    } catch {}
    const def = { activeId: 1, list: [{ id: 1, name: 'Основной', color: PROFILE_COLORS[0], created: Date.now() }] };
    saveProfiles(def);
    return def;
}

function saveProfiles(data) {
    try { localStorage.setItem(PROFILES_KEY, JSON.stringify(data)); } catch {}
}

let profilesData = loadProfiles();
let preIncognitoProfileId = null;
let pendingDeleteId = null;
let pendingDeleteTimer = null;

function activeProfile() {
    return profilesData.list.find(p => p.id === profilesData.activeId) || profilesData.list[0];
}

function regularProfiles() {
    return profilesData.list.filter(p => !p.guest);
}

function isIncognito() {
    const p = activeProfile();
    return Boolean(p && p.guest);
}

function profileInitial(name) {
    return (name || '?')[0].toUpperCase();
}

function clearProfileLocalData(pid) {
    const bases = [
        'swift-history-', 'swift-bookmarks-', 'swift-passwords-',
        'swift-passwords-never-', STORAGE_KEY + '-'
    ];
    bases.forEach(base => {
        try { localStorage.removeItem(base + pid); } catch {}
    });
}

function refreshProfilesUI() {
    renderProfilesList(
        document.getElementById('profileModalList'),
        (id) => { switchProfile(id); closeProfileModal(); },
        deleteProfile
    );
    renderProfilesList(
        document.getElementById('settingsProfilesList'),
        switchProfile, deleteProfile
    );
}

function updateProfileBtn() {
    const p = activeProfile();
    const btn = document.getElementById('profileBtn');
    if (btn) {
        btn.textContent = p.guest ? 'I' : profileInitial(p.name);
        btn.style.background = p.color;
        btn.title = p.guest ? 'Инкогнито' : p.name;
        btn.classList.toggle('incognito', Boolean(p.guest));
    }
    const av = document.getElementById('settingsProfileAvatar');
    const nm = document.getElementById('settingsProfileName');
    if (av) {
        av.textContent = p.guest ? 'I' : profileInitial(p.name);
        av.style.background = p.color;
    }
    if (nm) nm.textContent = p.guest ? 'Инкогнито' : p.name;
}

function updateIncognitoUI() {
    const on = isIncognito();
    document.body.classList.toggle('incognito-mode', on);
    const sw = document.getElementById('incognitoSwitch');
    if (sw && sw.checked !== on) sw.checked = on;
    const label = document.getElementById('homeIncognitoToggle');
    if (label) label.classList.toggle('active', on);
    updateProfileBtn();
}

function renderProfilesList(listEl, onSwitch, onDelete) {
    if (!listEl) return;
    listEl.innerHTML = '';
    const list = regularProfiles();
    list.forEach(p => {
        const item = document.createElement('div');
        item.className = 'profile-item' + (p.id === profilesData.activeId ? ' active' : '');

        const av = document.createElement('div');
        av.className = 'profile-avatar';
        av.style.background = p.color;
        av.textContent = profileInitial(p.name);

        const info = document.createElement('div');
        info.className = 'profile-info';
        const nm = document.createElement('div');
        nm.className = 'profile-name';
        nm.textContent = p.name;
        const meta = document.createElement('div');
        meta.className = 'profile-meta';
        meta.textContent = p.id === profilesData.activeId ? 'Активный' : 'Нажмите для переключения';
        info.appendChild(nm);
        info.appendChild(meta);

        item.appendChild(av);
        item.appendChild(info);

        if (p.id === profilesData.activeId) {
            const chk = document.createElement('span');
            chk.className = 'profile-check material-icons-round';
            chk.textContent = 'check_circle';
            item.appendChild(chk);
        }

        const actions = document.createElement('div');
        actions.className = 'profile-actions';

        const rename = document.createElement('button');
        rename.type = 'button';
        rename.className = 'profile-del';
        rename.title = 'Переименовать профиль';
        rename.innerHTML = '<span class="material-icons-round" style="font-size:18px">edit</span>';
        rename.onclick = (e) => {
            e.stopPropagation();
            startInlineRename(p, nm, meta, listEl, onSwitch, onDelete);
        };
        actions.appendChild(rename);

        if (list.length > 1) {
            const del = document.createElement('button');
            del.type = 'button';
            del.className = 'profile-del';
            del.title = pendingDeleteId === p.id ? 'Нажмите ещё раз для удаления' : 'Удалить профиль';
            del.innerHTML = '<span class="material-icons-round" style="font-size:18px">' +
                (pendingDeleteId === p.id ? 'warning' : 'delete_outline') + '</span>';
            if (pendingDeleteId === p.id) del.classList.add('confirm');
            del.onclick = (e) => { e.stopPropagation(); onDelete(p.id); };
            actions.appendChild(del);
        }
        item.appendChild(actions);

        item.onclick = () => {
            if (p.id !== profilesData.activeId) onSwitch(p.id);
        };
        listEl.appendChild(item);
    });
}

function startInlineRename(profile, nameEl, metaEl, listEl, onSwitch, onDelete) {
    if (!nameEl || nameEl.querySelector('input')) return;
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'profile-rename-input';
    input.maxLength = 40;
    input.value = profile.name;
    nameEl.textContent = '';
    nameEl.appendChild(input);
    if (metaEl) metaEl.textContent = 'Enter — сохранить, Esc — отмена';
    input.focus();
    input.select();

    const finish = (save) => {
        const next = input.value.trim().slice(0, 40);
        if (save && next) {
            profile.name = next;
            saveProfiles(profilesData);
            updateProfileBtn();
        }
        refreshProfilesUI();
        if (listEl && listEl !== document.getElementById('profileModalList') &&
            listEl !== document.getElementById('settingsProfilesList')) {
            renderProfilesList(listEl, onSwitch, onDelete);
        }
    };

    input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') { e.preventDefault(); finish(true); }
        if (e.key === 'Escape') { e.preventDefault(); finish(false); }
    });
    input.addEventListener('click', (e) => e.stopPropagation());
    input.addEventListener('blur', () => finish(true));
}

function resetTabsForProfile() {
    tabs.forEach(tab => {
        if (tab.view) { try { tab.view.remove(); } catch {} }
    });
    tabs = [];
    activeId = null;
    webviewHost.innerHTML = '';
    createTab();
}

function activateProfile(id, opts = {}) {
    const target = profilesData.list.find(p => p.id === id);
    if (!target) return false;
    if (!opts.force && id === profilesData.activeId) return false;

    profilesData.activeId = id;
    saveProfiles(profilesData);
    settings = loadSettings();
    applySettings();
    if (typeof syncSettingsUI === 'function') syncSettingsUI();
    resetTabsForProfile();
    updateProfileBtn();
    if (typeof reloadProfileData === 'function') reloadProfileData();
    refreshProfilesUI();
    updateIncognitoUI();

    if (opts.toast !== false && typeof showToast === 'function') {
        const label = target.guest ? 'Инкогнито' : (target.name || 'Профиль');
        showToast(target.guest ? 'Режим инкогнито' : ('Профиль: ' + label), {
            icon: target.guest ? 'visibility_off' : 'manage_accounts'
        });
    }
    return true;
}

function switchProfile(id) {
    const target = profilesData.list.find(p => p.id === id);
    if (!target || target.guest) return;
    if (isIncognito()) {
        const guests = profilesData.list.filter(p => p.guest);
        guests.forEach(g => clearProfileLocalData(g.id));
        profilesData.list = profilesData.list.filter(p => !p.guest);
        preIncognitoProfileId = null;
        saveProfiles(profilesData);
    }
    activateProfile(id, { force: true });
}

function deleteProfile(id) {
    const profile = profilesData.list.find(p => p.id === id);
    const regularCount = regularProfiles().length;
    if (!profile || profile.guest) return;
    if (regularCount <= 1) {
        if (typeof showToast === 'function') showToast('Нельзя удалить последний профиль', { icon: 'warning' });
        return;
    }

    if (pendingDeleteId !== id) {
        pendingDeleteId = id;
        if (pendingDeleteTimer) clearTimeout(pendingDeleteTimer);
        pendingDeleteTimer = setTimeout(() => {
            pendingDeleteId = null;
            refreshProfilesUI();
        }, 4000);
        refreshProfilesUI();
        if (typeof showToast === 'function') {
            showToast('Нажмите удалить ещё раз, чтобы подтвердить', { icon: 'warning' });
        }
        return;
    }
    pendingDeleteId = null;
    if (pendingDeleteTimer) { clearTimeout(pendingDeleteTimer); pendingDeleteTimer = null; }

    const wasActive = profilesData.activeId === id;
    profilesData.list = profilesData.list.filter(p => p.id !== id);
    clearProfileLocalData(id);

    if (wasActive) {
        const next = regularProfiles()[0] || profilesData.list[0];
        profilesData.activeId = next.id;
        saveProfiles(profilesData);
        activateProfile(next.id, { force: true, toast: false });
        if (typeof showToast === 'function') showToast('Профиль удалён', { icon: 'delete_outline' });
        return;
    }

    saveProfiles(profilesData);
    refreshProfilesUI();
    updateProfileBtn();
    if (typeof showToast === 'function') showToast('Профиль удалён', { icon: 'delete_outline' });
}

function createProfile(name, options = {}) {
    const trimmed = (name || '').trim();
    if (!trimmed) {
        if (typeof showToast === 'function') showToast('Введите имя профиля', { icon: 'warning' });
        return null;
    }

    if (isIncognito() && !options.guest) {
        exitIncognito({ silent: true });
    }

    const colorIdx = regularProfiles().length % PROFILE_COLORS.length;
    const newP = {
        id: options.guest ? ('guest-' + Date.now()) : Date.now(),
        name: trimmed.slice(0, 40),
        color: options.color || (options.guest ? INCOGNITO_COLOR : PROFILE_COLORS[colorIdx]),
        guest: Boolean(options.guest),
        created: Date.now()
    };
    profilesData.list.push(newP);
    saveProfiles(profilesData);
    activateProfile(newP.id, { force: true, toast: false });
    if (typeof showToast === 'function' && !options.guest) {
        showToast('Профиль создан: ' + newP.name, { icon: 'person_add' });
    }
    return newP;
}

function enterIncognito() {
    if (isIncognito()) {
        updateIncognitoUI();
        return;
    }
    preIncognitoProfileId = profilesData.activeId;
    profilesData.list.filter(p => p.guest).forEach(g => clearProfileLocalData(g.id));
    profilesData.list = profilesData.list.filter(p => !p.guest);
    saveProfiles(profilesData);
    createProfile('Инкогнито', { guest: true, color: INCOGNITO_COLOR });
    updateIncognitoUI();
    if (typeof showToast === 'function') {
        showToast('Инкогнито: история и cookies не сохраняются', { icon: 'visibility_off' });
    }
}

function exitIncognito(opts = {}) {
    if (!isIncognito()) {
        updateIncognitoUI();
        return;
    }
    const guests = profilesData.list.filter(p => p.guest);
    guests.forEach(g => clearProfileLocalData(g.id));
    profilesData.list = profilesData.list.filter(p => !p.guest);

    let restoreId = preIncognitoProfileId;
    preIncognitoProfileId = null;
    if (!profilesData.list.some(p => p.id === restoreId)) {
        restoreId = (regularProfiles()[0] || profilesData.list[0] || {}).id;
    }
    if (!profilesData.list.length) {
        profilesData.list = [{ id: 1, name: 'Основной', color: PROFILE_COLORS[0], created: Date.now() }];
        restoreId = 1;
    }
    profilesData.activeId = restoreId;
    saveProfiles(profilesData);
    activateProfile(restoreId, { force: true, toast: false });
    updateIncognitoUI();
    if (!opts.silent && typeof showToast === 'function') {
        showToast('Инкогнито выключен', { icon: 'visibility' });
    }
}

function setIncognito(on) {
    if (on) enterIncognito();
    else exitIncognito();
}

const profileModal = document.getElementById('profileModal');
const profileBtn   = document.getElementById('profileBtn');

function openProfileModal() {
    if (!profileModal) return;
    if (isIncognito()) {
        if (typeof showToast === 'function') {
            showToast('Сначала выключите инкогнито', { icon: 'visibility_off' });
        }
        return;
    }
    refreshProfilesUI();
    const inp = document.getElementById('modalNewProfileName');
    if (inp) inp.value = '';
    profileModal.classList.add('open');
    if (inp) setTimeout(() => inp.focus(), 50);
}
function closeProfileModal() {
    if (profileModal) profileModal.classList.remove('open');
}

if (profileBtn) profileBtn.addEventListener('click', openProfileModal);

const profileModalClose = document.getElementById('profileModalClose');
if (profileModalClose) profileModalClose.addEventListener('click', closeProfileModal);

function submitNewProfile(inputId) {
    const inp = document.getElementById(inputId);
    if (!inp) return;
    const created = createProfile(inp.value);
    if (created) {
        inp.value = '';
        if (inputId === 'modalNewProfileName') closeProfileModal();
    } else {
        inp.focus();
    }
}

const profileModalCreateForm = document.getElementById('profileModalCreateForm');
if (profileModalCreateForm) {
    profileModalCreateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitNewProfile('modalNewProfileName');
    });
}

if (profileModal) profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
});

const settingsProfileBtn = document.getElementById('settingsProfileBtn');
if (settingsProfileBtn) settingsProfileBtn.addEventListener('click', openProfileModal);

const profileCreateForm = document.getElementById('profileCreateForm');
if (profileCreateForm) {
    profileCreateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        submitNewProfile('newProfileName');
    });
}

const incognitoSwitch = document.getElementById('incognitoSwitch');
if (incognitoSwitch) {
    incognitoSwitch.addEventListener('change', () => setIncognito(incognitoSwitch.checked));
}

document.addEventListener('click', (e) => {
    const btn = e.target.closest('.ripple');
    if (!btn) return;
    btn.classList.remove('ripple-active');
    void btn.offsetWidth; 
    btn.classList.add('ripple-active');
    setTimeout(() => btn.classList.remove('ripple-active'), 600);
});

const ONBOARDING_KEY = 'swift-onboarding-done';
const LEGAL_ACCEPT_KEY = 'swift-legal-accepted';

const LEGAL_DOCS = {
    terms: { title: 'Пользовательское соглашение', file: 'legal/TERMS.txt' },
    privacy: { title: 'Политика конфиденциальности', file: 'legal/PRIVACY.txt' },
    eula: { title: 'Лицензионное соглашение (EULA)', file: 'legal/EULA.txt' },
};

const ONBOARDING_STEPS = [
    {
        icon: 'gavel',
        title: 'Соглашения',
        desc: 'Перед началом работы подтвердите согласие с документами. Без этого продолжить нельзя.',
        type: 'legal',
    },
    {
        icon: 'bolt',
        title: 'Добро пожаловать в Swift!',
        desc: 'Быстрый, красивый и приватный браузер. Давайте настроим его под вас — это займёт меньше минуты.',
        type: 'welcome',
    },
    {
        icon: 'search',
        title: 'Выберите поисковую систему',
        desc: 'Какой поисковик использовать по умолчанию в адресной строке и на стартовой странице?',
        type: 'engine',
    },
    {
        icon: 'palette',
        title: 'Выберите акцентный цвет',
        desc: 'Этот цвет будет использоваться во всём интерфейсе браузера.',
        type: 'accent',
    },
    {
        icon: 'check_circle',
        title: 'Всё готово!',
        desc: 'Swift настроен и готов к работе. Приятного сёрфинга!',
        type: 'done',
    },
];

let obStep = 0;
let obEngine = settings.engine;
let obAccent = settings.accent;
let obLegal = { terms: false, privacy: false, eula: false };

async function openLegalDocument(key) {
    const doc = LEGAL_DOCS[key];
    if (!doc) return;
    const overlay = document.getElementById('legalDocOverlay');
    const titleEl = document.getElementById('legalDocTitle');
    const bodyEl = document.getElementById('legalDocBody');
    if (!overlay || !titleEl || !bodyEl) return;
    titleEl.textContent = doc.title;
    bodyEl.textContent = 'Загрузка…';
    overlay.hidden = false;
    try {
        const res = await fetch(doc.file);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        bodyEl.textContent = await res.text();
    } catch {
        bodyEl.textContent = 'Не удалось загрузить документ. Файл: ' + doc.file;
    }
}

function closeLegalDocument() {
    const overlay = document.getElementById('legalDocOverlay');
    if (overlay) overlay.hidden = true;
}

function legalAccepted() {
    return obLegal.terms && obLegal.privacy && obLegal.eula;
}

function syncLegalNextButton() {
    const next = document.getElementById('obNext');
    if (!next) return;
    const step = ONBOARDING_STEPS[obStep];
    if (step && step.type === 'legal') {
        next.disabled = !legalAccepted();
    }
}

function renderOnboardingStep() {
    const step = ONBOARDING_STEPS[obStep];
    const stepsEl = document.getElementById('onboardingSteps');
    const contentEl = document.getElementById('onboardingStepContent');
    const card = document.getElementById('onboardingCard');
    if (!stepsEl || !contentEl) return;

    if (card) card.classList.toggle('onboarding-card-wide', step.type === 'legal');

    stepsEl.innerHTML = '';
    ONBOARDING_STEPS.forEach((_, i) => {
        const dot = document.createElement('div');
        dot.className = 'onboarding-step-dot' + (i === obStep ? ' active' : '');
        stepsEl.appendChild(dot);
    });

    let html = `<div class="onboarding-step-content">
        <div class="onboarding-icon"><span class="material-icons-round">${step.icon}</span></div>
        <div class="onboarding-title">${step.title}</div>
        <div class="onboarding-desc">${step.desc}</div>`;

    if (step.type === 'legal') {
        html += `<div class="onboarding-legal" id="obLegal">
            <label class="onboarding-legal-row">
                <input type="checkbox" id="obLegalTerms" ${obLegal.terms ? 'checked' : ''}>
                <span>Я принимаю <button type="button" class="legal-link" data-legal="terms">Пользовательское соглашение</button></span>
            </label>
            <label class="onboarding-legal-row">
                <input type="checkbox" id="obLegalPrivacy" ${obLegal.privacy ? 'checked' : ''}>
                <span>Я принимаю <button type="button" class="legal-link" data-legal="privacy">Политику конфиденциальности</button></span>
            </label>
            <label class="onboarding-legal-row">
                <input type="checkbox" id="obLegalEula" ${obLegal.eula ? 'checked' : ''}>
                <span>Я принимаю <button type="button" class="legal-link" data-legal="eula">Лицензионное соглашение (EULA)</button></span>
            </label>
        </div>`;
    }

    if (step.type === 'engine') {
        html += '<div class="onboarding-engines" id="obEngines">';
        Object.entries(SEARCH_ENGINES).forEach(([id, eng]) => {
            const info = ENGINE_ICONS[id] || { color: '#888', letter: eng.name[0], desc: '' };
            const sel = id === obEngine ? ' selected' : '';
            html += `<div class="onboarding-engine-item${sel}" data-engine="${id}">
                <div class="onboarding-engine-icon" style="background:${info.color}" data-engine-icon="${id}"></div>
                <div>
                    <div class="onboarding-engine-name">${eng.name}</div>
                    <div class="onboarding-engine-desc">${info.desc}</div>
                </div>
                <span class="onboarding-engine-check material-icons-round">check_circle</span>
            </div>`;
        });
        html += '</div>';
    }

    if (step.type === 'accent') {
        html += '<div class="onboarding-accents" id="obAccents">';
        ACCENTS.forEach(a => {
            const sel = a.id === obAccent ? ' selected' : '';
            html += `<div class="onboarding-accent-swatch${sel}" data-accent="${a.id}" style="background:${a.c}" title="${a.id}"></div>`;
        });
        html += '</div>';
    }

    html += '<div class="onboarding-nav">';
    if (obStep > 0) html += `<button class="btn-ghost" id="obBack">Назад</button>`;
    if (obStep < ONBOARDING_STEPS.length - 1) {
        const disabled = step.type === 'legal' && !legalAccepted() ? ' disabled' : '';
        html += `<button class="btn-primary ripple" id="obNext"${disabled}>Далее</button>`;
    } else {
        html += `<button class="btn-primary ripple" id="obFinish">Начать работу</button>`;
    }
    html += '</div></div>';

    contentEl.innerHTML = html;

    contentEl.querySelectorAll('[data-engine-icon]').forEach(icon => {
        const id = icon.dataset.engineIcon;
        icon.replaceChildren(createEngineIcon(id, 'onboarding-engine-image'));
    });

    const obNextBtn = document.getElementById('obNext');
    const obBackBtn = document.getElementById('obBack');
    const obFinishBtn = document.getElementById('obFinish');

    if (obNextBtn) obNextBtn.addEventListener('click', () => {
        if (ONBOARDING_STEPS[obStep].type === 'legal' && !legalAccepted()) return;
        obStep++;
        renderOnboardingStep();
    });
    if (obBackBtn) obBackBtn.addEventListener('click', () => {
        obStep--;
        renderOnboardingStep();
    });
    if (obFinishBtn) obFinishBtn.addEventListener('click', finishOnboarding);

    contentEl.querySelectorAll('.legal-link').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openLegalDocument(btn.dataset.legal);
        });
    });

    const termsCb = document.getElementById('obLegalTerms');
    const privacyCb = document.getElementById('obLegalPrivacy');
    const eulaCb = document.getElementById('obLegalEula');
    if (termsCb) termsCb.addEventListener('change', () => { obLegal.terms = termsCb.checked; syncLegalNextButton(); });
    if (privacyCb) privacyCb.addEventListener('change', () => { obLegal.privacy = privacyCb.checked; syncLegalNextButton(); });
    if (eulaCb) eulaCb.addEventListener('change', () => { obLegal.eula = eulaCb.checked; syncLegalNextButton(); });

    const engItems = document.querySelectorAll('.onboarding-engine-item');
    engItems.forEach(el => {
        el.addEventListener('click', () => {
            obEngine = el.dataset.engine;
            engItems.forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
        });
    });

    const accentSwatches = document.querySelectorAll('.onboarding-accent-swatch');
    accentSwatches.forEach(el => {
        el.addEventListener('click', () => {
            obAccent = el.dataset.accent;
            accentSwatches.forEach(e => e.classList.remove('selected'));
            el.classList.add('selected');
            const a = ACCENTS.find(x => x.id === obAccent);
            if (a) {
                document.documentElement.style.setProperty('--accent', a.c);
                document.documentElement.style.setProperty('--accent-2', a.c2);
                document.documentElement.style.setProperty('--accent-rgb', a.rgb);
                if (typeof refreshAccentRGB === 'function') refreshAccentRGB();
            }
        });
    });
}

function finishOnboarding() {
    if (!legalAccepted()) {
        obStep = 0;
        renderOnboardingStep();
        return;
    }
    settings.engine = obEngine;
    settings.accent = obAccent;
    saveSettings();
    applySettings();
    syncSettingsUI();

    const overlay = document.getElementById('onboardingOverlay');
    if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => { overlay.classList.add('hidden'); }, 420);
    }
    localStorage.setItem(ONBOARDING_KEY, '1');
    localStorage.setItem(LEGAL_ACCEPT_KEY, JSON.stringify({
        terms: true,
        privacy: true,
        eula: true,
        at: new Date().toISOString(),
        version: '1.0',
    }));
}

function initLegalDocUi() {
    const closeBtn = document.getElementById('legalDocClose');
    const overlay = document.getElementById('legalDocOverlay');
    if (closeBtn) closeBtn.addEventListener('click', closeLegalDocument);
    if (overlay) overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeLegalDocument();
    });
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && overlay && !overlay.hidden) closeLegalDocument();
    });
    document.querySelectorAll('[data-legal]').forEach(el => {
        if (el.closest('#onboardingStepContent')) return;
        el.addEventListener('click', (e) => {
            e.preventDefault();
            openLegalDocument(el.dataset.legal);
        });
    });
}

function initOnboarding() {
    const done = localStorage.getItem(ONBOARDING_KEY);
    const overlay = document.getElementById('onboardingOverlay');
    if (!overlay) return;
    if (done) {
        overlay.classList.add('hidden');
        return;
    }
    obStep = 0;
    obEngine = settings.engine;
    obAccent = settings.accent;
    obLegal = { terms: false, privacy: false, eula: false };
    renderOnboardingStep();
}

applySettings();
updateProfileBtn();
updateIncognitoUI();
refreshProfilesUI();
createTab();
initLegalDocUi();
initOnboarding();
