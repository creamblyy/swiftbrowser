
function profileStorageKey(base) {
    const pid = (typeof profilesData !== 'undefined' && profilesData)
        ? profilesData.activeId : 1;
    return base + '-' + pid;
}

function loadJSON(key, fallback) {
    try {
        const v = JSON.parse(localStorage.getItem(key));
        return v == null ? fallback : v;
    } catch { return fallback; }
}
function saveJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

function showToast(message, opts = {}) {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const el = document.createElement('div');
    el.className = 'toast toast-enter';
    el.innerHTML = `<span class="material-icons-round">${opts.icon || 'info'}</span><span>${message}</span>`;
    stack.appendChild(el);
    requestAnimationFrame(() => el.classList.add('open'));
    const ttl = opts.ttl || 2800;
    setTimeout(() => {
        el.classList.remove('open');
        setTimeout(() => el.remove(), 280);
    }, ttl);
}

const HISTORY_MAX = 2000;
let browsingHistory = [];

function loadHistory() {
    browsingHistory = loadJSON(profileStorageKey('swift-history'), []);
    if (!Array.isArray(browsingHistory)) browsingHistory = [];
}
function saveHistory() {
    saveJSON(profileStorageKey('swift-history'), browsingHistory);
}

function isGuestProfile() {
    try {
        return typeof activeProfile === 'function' && Boolean(activeProfile().guest);
    } catch { return false; }
}

function addHistoryEntry(url, title) {
    if (!settings.saveHistory || isGuestProfile()) return;
    if (!url || url === 'about:blank' || isAboutUrl(url)) return;
    if (!/^https?:\/\//i.test(url)) return;
    const now = Date.now();
    if (browsingHistory.length && browsingHistory[0].url === url && (now - browsingHistory[0].visitedAt) < 3000) {
        browsingHistory[0].title = title || browsingHistory[0].title;
        browsingHistory[0].visitedAt = now;
        saveHistory();
        return;
    }
    browsingHistory.unshift({
        id: now + Math.random().toString(36).slice(2, 7),
        url,
        title: title || url,
        visitedAt: now,
    });
    if (browsingHistory.length > HISTORY_MAX) browsingHistory.length = HISTORY_MAX;
    saveHistory();
}

function touchHistoryTitle(url, title) {
    if (!url || !title) return;
    const hit = browsingHistory.find(h => h.url === url);
    if (hit) { hit.title = title; saveHistory(); }
}

function clearHistory() {
    browsingHistory = [];
    saveHistory();
    renderHistoryList();
    showToast('История очищена', { icon: 'delete_outline' });
}

function deleteHistoryEntry(id) {
    browsingHistory = browsingHistory.filter(h => h.id !== id);
    saveHistory();
    renderHistoryList();
}

function formatHistoryTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
    const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    if (sameDay) return 'Сегодня, ' + time;
    if (d.toDateString() === yesterday.toDateString()) return 'Вчера, ' + time;
    return d.toLocaleDateString('ru-RU') + ', ' + time;
}

function renderHistoryList(filter) {
    const list = document.getElementById('historyList');
    if (!list) return;
    const q = (filter || (document.getElementById('historySearch') || {}).value || '').trim().toLowerCase();
    let items = browsingHistory;
    if (q) {
        items = items.filter(h =>
            (h.title || '').toLowerCase().includes(q) ||
            (h.url || '').toLowerCase().includes(q)
        );
    }
    list.innerHTML = '';
    if (!items.length) {
        list.innerHTML = '<div class="lib-empty"><span class="material-icons-round">history</span><p>История пуста</p></div>';
        return;
    }
    items.slice(0, 300).forEach((h, i) => {
        const row = document.createElement('div');
        row.className = 'lib-row';
        row.style.animationDelay = (Math.min(i, 20) * 0.02) + 's';
        row.innerHTML = `
            <img class="lib-fav" src="${faviconFor(h.url)}" alt="" onerror="this.style.visibility='hidden'">
            <div class="lib-meta">
                <div class="lib-title">${escapeHtml(h.title || h.url)}</div>
                <div class="lib-sub">${escapeHtml(h.url)}</div>
            </div>
            <div class="lib-time">${formatHistoryTime(h.visitedAt)}</div>
            <button class="lib-icon-btn" title="Удалить" data-del="${h.id}">
                <span class="material-icons-round">close</span>
            </button>`;
        row.addEventListener('click', (e) => {
            if (e.target.closest('[data-del]')) {
                deleteHistoryEntry(h.id);
                return;
            }
            navigate(h.url);
        });
        list.appendChild(row);
    });
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

let bookmarks = [];

function loadBookmarks() {
    bookmarks = loadJSON(profileStorageKey('swift-bookmarks'), []);
    if (!Array.isArray(bookmarks)) bookmarks = [];
}
function saveBookmarks() {
    saveJSON(profileStorageKey('swift-bookmarks'), bookmarks);
}

function isBookmarked(url) {
    if (!url) return false;
    return bookmarks.some(b => b.url === url);
}

function toggleBookmark(url, title) {
    if (isGuestProfile()) {
        showToast('В инкогнито закладки не сохраняются', { icon: 'visibility_off' });
        return;
    }
    if (!url || isAboutUrl(url) || !/^https?:\/\//i.test(url)) return;
    const idx = bookmarks.findIndex(b => b.url === url);
    if (idx !== -1) {
        bookmarks.splice(idx, 1);
        saveBookmarks();
        updateBookmarkButton();
        renderBookmarksList();
        showToast('Удалено из закладок', { icon: 'star_border' });
        return;
    }
    bookmarks.unshift({
        id: Date.now() + Math.random().toString(36).slice(2, 6),
        url,
        title: title || url,
        createdAt: Date.now(),
    });
    saveBookmarks();
    updateBookmarkButton(true);
    renderBookmarksList();
    showToast('Добавлено в закладки', { icon: 'star' });
}

function updateBookmarkButton(animate) {
    const btn = document.getElementById('bookmarkBtn');
    const icon = document.getElementById('bookmarkBtnIcon');
    if (!btn || !icon) return;
    const tab = activeTab();
    const url = tab && tab.url;
    const ok = !!(url && !isAboutUrl(url) && /^https?:\/\//i.test(url));
    btn.disabled = !ok;
    const on = ok && isBookmarked(url);
    icon.textContent = on ? 'star' : 'star_border';
    btn.classList.toggle('bookmarked', on);
    btn.title = on ? 'Удалить из закладок' : 'Добавить в закладки';
    if (animate && on) {
        btn.classList.remove('star-pop');
        void btn.offsetWidth;
        btn.classList.add('star-pop');
    }
}

function deleteBookmark(id) {
    bookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks();
    renderBookmarksList();
    updateBookmarkButton();
}

function addBookmarkManual(title, url) {
    if (isGuestProfile()) {
        showToast('В инкогнито закладки не сохраняются', { icon: 'visibility_off' });
        return;
    }
    if (!title || !url) return;
    if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
    if (isBookmarked(url)) {
        showToast('Уже в закладках', { icon: 'info' });
        return;
    }
    bookmarks.unshift({
        id: Date.now() + Math.random().toString(36).slice(2, 6),
        url, title, createdAt: Date.now(),
    });
    saveBookmarks();
    renderBookmarksList();
    updateBookmarkButton();
    showToast('Закладка добавлена', { icon: 'star' });
}

function renderBookmarksList(filter) {
    const list = document.getElementById('bookmarksList');
    if (!list) return;
    const q = (filter || (document.getElementById('bookmarksSearch') || {}).value || '').trim().toLowerCase();
    let items = bookmarks;
    if (q) {
        items = items.filter(b =>
            (b.title || '').toLowerCase().includes(q) ||
            (b.url || '').toLowerCase().includes(q)
        );
    }
    list.innerHTML = '';
    if (!items.length) {
        list.innerHTML = '<div class="lib-empty"><span class="material-icons-round">bookmarks</span><p>Закладок пока нет</p></div>';
        return;
    }
    items.forEach((b, i) => {
        const row = document.createElement('div');
        row.className = 'lib-row';
        row.style.animationDelay = (Math.min(i, 20) * 0.02) + 's';
        row.innerHTML = `
            <img class="lib-fav" src="${faviconFor(b.url)}" alt="" onerror="this.style.visibility='hidden'">
            <div class="lib-meta">
                <div class="lib-title">${escapeHtml(b.title || b.url)}</div>
                <div class="lib-sub">${escapeHtml(b.url)}</div>
            </div>
            <button class="lib-icon-btn" title="Удалить" data-del="${b.id}">
                <span class="material-icons-round">delete_outline</span>
            </button>`;
        row.addEventListener('click', (e) => {
            if (e.target.closest('[data-del]')) {
                deleteBookmark(b.id);
                return;
            }
            navigate(b.url);
        });
        list.appendChild(row);
    });
}

let savedPasswords = [];
let passwordNeverHosts = [];
let pendingLogin = null;

function loadPasswords() {
    savedPasswords = loadJSON(profileStorageKey('swift-passwords'), []);
    passwordNeverHosts = loadJSON(profileStorageKey('swift-passwords-never'), []);
    if (!Array.isArray(savedPasswords)) savedPasswords = [];
    if (!Array.isArray(passwordNeverHosts)) passwordNeverHosts = [];
}
function savePasswordsStore() {
    saveJSON(profileStorageKey('swift-passwords'), savedPasswords);
    saveJSON(profileStorageKey('swift-passwords-never'), passwordNeverHosts);
}

async function encryptPassword(plain) {
    if (window.swift && window.swift.encrypt) {
        const res = await window.swift.encrypt(plain);
        if (res && res.ok) return { data: res.data, fallback: !!res.fallback };
    }
    return { data: btoa(unescape(encodeURIComponent(plain))), fallback: true };
}
async function decryptPassword(data) {
    if (window.swift && window.swift.decrypt) {
        const res = await window.swift.decrypt(data);
        if (res && res.ok) return res.data;
    }
    try { return decodeURIComponent(escape(atob(data))); } catch { return ''; }
}

function originFromUrl(url) {
    try { const u = new URL(url); return u.origin; } catch { return ''; }
}

function findPasswordForOrigin(origin) {
    return savedPasswords.filter(p => p.origin === origin);
}

async function upsertPassword({ origin, username, password, url }) {
    if (isGuestProfile()) return;
    if (!origin || !username || !password) return;
    const enc = await encryptPassword(password);
    const existing = savedPasswords.find(p => p.origin === origin && p.username === username);
    if (existing) {
        existing.passwordEnc = enc.data;
        existing.fallback = enc.fallback;
        existing.url = url || existing.url;
        existing.updatedAt = Date.now();
    } else {
        savedPasswords.unshift({
            id: Date.now() + Math.random().toString(36).slice(2, 6),
            origin,
            username,
            passwordEnc: enc.data,
            fallback: enc.fallback,
            url: url || origin,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    }
    savePasswordsStore();
    renderPasswordsList();
}

function deletePassword(id) {
    savedPasswords = savedPasswords.filter(p => p.id !== id);
    savePasswordsStore();
    renderPasswordsList();
    showToast('Пароль удалён', { icon: 'key_off' });
}

function hidePasswordPrompt() {
    const el = document.getElementById('passwordPrompt');
    if (!el) return;
    el.classList.remove('open');
    el.setAttribute('aria-hidden', 'true');
    pendingLogin = null;
}

function showPasswordPrompt(data) {
    pendingLogin = data;
    const el = document.getElementById('passwordPrompt');
    const meta = document.getElementById('passwordPromptMeta');
    if (!el || !meta) return;
    meta.textContent = `${data.username} · ${data.origin}`;
    el.classList.add('open');
    el.setAttribute('aria-hidden', 'false');
}

function handleLoginDetected(data) {
    if (isGuestProfile() || !settings.savePasswords) return;
    if (!data || !data.username || !data.password) return;
    const origin = data.origin || originFromUrl(data.url);
    if (!origin) return;
    if (passwordNeverHosts.includes(origin)) return;
    const existing = savedPasswords.find(p => p.origin === origin && p.username === data.username);
    if (existing) {
        decryptPassword(existing.passwordEnc).then(plain => {
            if (plain === data.password) return;
            showPasswordPrompt({ ...data, origin, update: true });
        });
        return;
    }
    showPasswordPrompt({ ...data, origin });
}

async function renderPasswordsList(filter) {
    const list = document.getElementById('passwordsList');
    if (!list) return;
    const q = (filter || (document.getElementById('passwordsSearch') || {}).value || '').trim().toLowerCase();
    let items = savedPasswords;
    if (q) {
        items = items.filter(p =>
            (p.username || '').toLowerCase().includes(q) ||
            (p.origin || '').toLowerCase().includes(q) ||
            (p.url || '').toLowerCase().includes(q)
        );
    }
    list.innerHTML = '';
    if (!items.length) {
        list.innerHTML = '<div class="lib-empty"><span class="material-icons-round">vpn_key</span><p>Сохранённых паролей нет</p></div>';
        return;
    }
    for (let i = 0; i < items.length; i++) {
        const p = items[i];
        const row = document.createElement('div');
        row.className = 'lib-row password-row';
        row.style.animationDelay = (Math.min(i, 20) * 0.02) + 's';
        row.innerHTML = `
            <div class="lib-fav pass-fav"><span class="material-icons-round">language</span></div>
            <div class="lib-meta">
                <div class="lib-title">${escapeHtml(p.origin.replace(/^https?:\/\//, ''))}</div>
                <div class="lib-sub">${escapeHtml(p.username)} · <span class="pass-mask" data-id="${p.id}">••••••••</span></div>
            </div>
            <button class="lib-icon-btn" title="Показать" data-show="${p.id}">
                <span class="material-icons-round">visibility</span>
            </button>
            <button class="lib-icon-btn" title="Копировать пароль" data-copy="${p.id}">
                <span class="material-icons-round">content_copy</span>
            </button>
            <button class="lib-icon-btn" title="Открыть сайт" data-open="${p.id}">
                <span class="material-icons-round">open_in_new</span>
            </button>
            <button class="lib-icon-btn" title="Удалить" data-del="${p.id}">
                <span class="material-icons-round">delete_outline</span>
            </button>`;
        row.addEventListener('click', async (e) => {
            const show = e.target.closest('[data-show]');
            const copy = e.target.closest('[data-copy]');
            const open = e.target.closest('[data-open]');
            const del = e.target.closest('[data-del]');
            if (del) { deletePassword(p.id); return; }
            if (open) { navigate(p.url || p.origin); return; }
            if (show) {
                const mask = row.querySelector('.pass-mask');
                const icon = show.querySelector('.material-icons-round');
                if (mask.dataset.shown === '1') {
                    mask.textContent = '••••••••';
                    mask.dataset.shown = '0';
                    icon.textContent = 'visibility';
                } else {
                    mask.textContent = await decryptPassword(p.passwordEnc);
                    mask.dataset.shown = '1';
                    icon.textContent = 'visibility_off';
                }
                return;
            }
            if (copy) {
                const plain = await decryptPassword(p.passwordEnc);
                try { await navigator.clipboard.writeText(plain); showToast('Пароль скопирован', { icon: 'content_copy' }); } catch {}
                return;
            }
        });
        list.appendChild(row);
    }
}

function openPasswordEditor(existing) {
    const old = document.getElementById('pwEditorOverlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'pwEditorOverlay';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = `
        <div class="modal-card">
            <h2><span class="material-icons-round">vpn_key</span> ${existing ? 'Изменить пароль' : 'Новый пароль'}</h2>
            <div style="display:flex;flex-direction:column;gap:12px">
                <div>
                    <label class="field-label">Сайт (URL)</label>
                    <input id="pwEdUrl" type="text" placeholder="https://example.com" value="${existing ? escapeHtml(existing.url || existing.origin) : ''}">
                </div>
                <div>
                    <label class="field-label">Логин</label>
                    <input id="pwEdUser" type="text" placeholder="user@mail.com" value="${existing ? escapeHtml(existing.username) : ''}">
                </div>
                <div>
                    <label class="field-label">Пароль</label>
                    <input id="pwEdPass" type="password" placeholder="••••••••" value="">
                </div>
            </div>
            <div class="btn-row" style="margin-top:18px">
                <button class="btn-ghost" id="pwEdCancel">Отмена</button>
                <button class="btn-primary ripple" id="pwEdSave">Сохранить</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 250); };
    overlay.querySelector('#pwEdCancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#pwEdSave').onclick = async () => {
        let url = overlay.querySelector('#pwEdUrl').value.trim();
        const username = overlay.querySelector('#pwEdUser').value.trim();
        const password = overlay.querySelector('#pwEdPass').value;
        if (!url || !username || !password) return;
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
        const origin = originFromUrl(url);
        await upsertPassword({ origin, username, password, url });
        showToast('Пароль сохранён', { icon: 'verified_user' });
        close();
    };
}

function openBookmarkEditor() {
    const old = document.getElementById('bmEditorOverlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'bmEditorOverlay';
    overlay.className = 'modal-overlay';
    const tab = activeTab();
    overlay.innerHTML = `
        <div class="modal-card">
            <h2><span class="material-icons-round">bookmark_add</span> Новая закладка</h2>
            <div style="display:flex;flex-direction:column;gap:12px">
                <div>
                    <label class="field-label">Название</label>
                    <input id="bmEdTitle" type="text" placeholder="Название" value="${tab && tab.title && tab.url ? escapeHtml(tab.title) : ''}">
                </div>
                <div>
                    <label class="field-label">URL</label>
                    <input id="bmEdUrl" type="text" placeholder="https://example.com" value="${tab && tab.url && !isAboutUrl(tab.url) ? escapeHtml(tab.url) : ''}">
                </div>
            </div>
            <div class="btn-row" style="margin-top:18px">
                <button class="btn-ghost" id="bmEdCancel">Отмена</button>
                <button class="btn-primary ripple" id="bmEdSave">Добавить</button>
            </div>
        </div>`;
    document.body.appendChild(overlay);
    requestAnimationFrame(() => overlay.classList.add('open'));
    const close = () => { overlay.classList.remove('open'); setTimeout(() => overlay.remove(), 250); };
    overlay.querySelector('#bmEdCancel').onclick = close;
    overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    overlay.querySelector('#bmEdSave').onclick = () => {
        addBookmarkManual(
            overlay.querySelector('#bmEdTitle').value.trim(),
            overlay.querySelector('#bmEdUrl').value.trim()
        );
        close();
    };
}

const FP_PROTECT_JS = `(function(){
  if (window.__swiftFp) return; window.__swiftFp = true;
  try {
    const noise = (n) => n + (Math.random() - 0.5) * 0.0001;
    const toDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      try {
        const ctx = this.getContext('2d');
        if (ctx) {
          const i = ctx.getImageData(0, 0, Math.min(this.width||1, 8), 1);
          for (let x = 0; x < i.data.length; x += 4) i.data[x] = Math.min(255, i.data[x] ^ 1);
          ctx.putImageData(i, 0, 0);
        }
      } catch (e) {}
      return toDataURL.apply(this, arguments);
    };
    if (navigator.hardwareConcurrency) {
      try { Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 4 }); } catch (e) {}
    }
  } catch (e) {}
})();`;

const LOGIN_WATCH_JS = `(function(){
  if (window.__swiftLogin) return; window.__swiftLogin = true;
  function findUser(form) {
    const sels = ['input[type="email"]','input[type="text"]','input[name*="user" i]','input[name*="login" i]','input[name*="email" i]','input[autocomplete="username"]'];
    for (const s of sels) {
      const el = form.querySelector(s);
      if (el && el.value) return el.value;
    }
    const inputs = form.querySelectorAll('input:not([type="password"]):not([type="hidden"]):not([type="submit"])');
    for (const el of inputs) { if (el.value) return el.value; }
    return '';
  }
  function onSubmit(form) {
    try {
      const pass = form.querySelector('input[type="password"]');
      if (!pass || !pass.value) return;
      const username = findUser(form);
      if (!username) return;
      const payload = {
        username: username,
        password: pass.value,
        url: location.href,
        origin: location.origin
      };
      if (window.swiftBrowser && window.swiftBrowser.postMessage) {
        // unused
      }
      // Electron webview ipc via console trick — use sendToHost if available
      try {
        if (typeof require === 'undefined') {
          // guest page: use ipc via custom event picked up? webview guest can't require.
        }
      } catch (e) {}
      try {
        // Chromium guests in Electron: ipcRenderer not available; use console message protocol
        console.log('SWIFT_LOGIN::' + JSON.stringify(payload));
      } catch (e) {}
    } catch (e) {}
  }
  document.addEventListener('submit', function(e) {
    const form = e.target && e.target.closest ? e.target.closest('form') : e.target;
    if (form) onSubmit(form);
  }, true);
  document.addEventListener('click', function(e) {
    const btn = e.target && e.target.closest && e.target.closest('button[type="submit"], input[type="submit"], button');
    if (!btn) return;
    const form = btn.closest && btn.closest('form');
    if (form && form.querySelector('input[type="password"]')) {
      setTimeout(function(){ onSubmit(form); }, 50);
    }
  }, true);
})();`;

async function injectPageHelpers(view, tab) {
    if (!view || !view.executeJavaScript) return;
    try {
        if (settings.blockFingerprinting) {
            await view.executeJavaScript(FP_PROTECT_JS, true);
        }
        if (settings.savePasswords) {
            await view.executeJavaScript(LOGIN_WATCH_JS, true);
        }
        const origin = originFromUrl(tab && tab.url);
        if (origin && settings.savePasswords) {
            const matches = findPasswordForOrigin(origin);
            if (matches.length === 1) {
                const plain = await decryptPassword(matches[0].passwordEnc);
                const payload = JSON.stringify({
                    username: matches[0].username,
                    password: plain,
                });
                await view.executeJavaScript(`(function(){
                  try {
                    var cred = ${payload};
                    var forms = document.querySelectorAll('form');
                    for (var i=0;i<forms.length;i++){
                      var f=forms[i];
                      var p=f.querySelector('input[type="password"]');
                      if(!p) continue;
                      var u=f.querySelector('input[type="email"],input[autocomplete="username"],input[type="text"],input[name*="user" i],input[name*="login" i],input[name*="email" i]');
                      if(u && !u.value) { u.value=cred.username; u.dispatchEvent(new Event('input',{bubbles:true})); }
                      if(p && !p.value) { p.value=cred.password; p.dispatchEvent(new Event('input',{bubbles:true})); }
                      break;
                    }
                  } catch(e){}
                })();`, true);
            }
        }
    } catch {}
}

function attachConsoleLoginListener(view) {
    if (view.__swiftConsoleBound) return;
    view.__swiftConsoleBound = true;
    view.addEventListener('console-message', (e) => {
        const msg = e.message || '';
        if (!msg.startsWith('SWIFT_LOGIN::')) return;
        try {
            const data = JSON.parse(msg.slice('SWIFT_LOGIN::'.length));
            handleLoginDetected(data);
        } catch {}
    });
}

function refreshLibraryPanes(pane) {
    if (pane === 'history' || !pane) renderHistoryList();
    if (pane === 'bookmarks' || !pane) renderBookmarksList();
    if (pane === 'passwords' || !pane) renderPasswordsList();
}

function reloadProfileData() {
    loadHistory();
    loadBookmarks();
    loadPasswords();
    updateBookmarkButton();
    refreshLibraryPanes();
}

function initLibraryUI() {
    loadHistory();
    loadBookmarks();
    loadPasswords();

    const bookmarkBtn = document.getElementById('bookmarkBtn');
    if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
            const tab = activeTab();
            if (tab && tab.url) toggleBookmark(tab.url, tab.title);
        });
    }
    const historyBtn = document.getElementById('historyBtn');
    if (historyBtn) historyBtn.addEventListener('click', () => navigate('about:history'));
    const bookmarksBtn = document.getElementById('bookmarksBtn');
    if (bookmarksBtn) bookmarksBtn.addEventListener('click', () => navigate('about:bookmarks'));
    const passwordsBtn = document.getElementById('passwordsBtn');
    if (passwordsBtn) passwordsBtn.addEventListener('click', () => navigate('about:passwords'));

    const historySearch = document.getElementById('historySearch');
    if (historySearch) historySearch.addEventListener('input', () => renderHistoryList(historySearch.value));
    const bookmarksSearch = document.getElementById('bookmarksSearch');
    if (bookmarksSearch) bookmarksSearch.addEventListener('input', () => renderBookmarksList(bookmarksSearch.value));
    const passwordsSearch = document.getElementById('passwordsSearch');
    if (passwordsSearch) passwordsSearch.addEventListener('input', () => renderPasswordsList(passwordsSearch.value));

    const clearHistoryPaneBtn = document.getElementById('clearHistoryPaneBtn');
    if (clearHistoryPaneBtn) clearHistoryPaneBtn.addEventListener('click', clearHistory);
    const clearHistoryBtn = document.getElementById('clearHistoryBtn');
    if (clearHistoryBtn) clearHistoryBtn.addEventListener('click', clearHistory);

    const addBookmarkBtn = document.getElementById('addBookmarkBtn');
    if (addBookmarkBtn) addBookmarkBtn.addEventListener('click', openBookmarkEditor);
    const addPasswordBtn = document.getElementById('addPasswordBtn');
    if (addPasswordBtn) addPasswordBtn.addEventListener('click', () => openPasswordEditor(null));

    const pwYes = document.getElementById('passwordPromptYes');
    const pwNo = document.getElementById('passwordPromptNo');
    const pwNever = document.getElementById('passwordPromptNever');
    if (pwYes) pwYes.addEventListener('click', async () => {
        if (pendingLogin) {
            await upsertPassword(pendingLogin);
            showToast('Пароль сохранён', { icon: 'verified_user' });
        }
        hidePasswordPrompt();
    });
    if (pwNo) pwNo.addEventListener('click', hidePasswordPrompt);
    if (pwNever) pwNever.addEventListener('click', () => {
        if (pendingLogin && pendingLogin.origin) {
            passwordNeverHosts.push(pendingLogin.origin);
            savePasswordsStore();
        }
        hidePasswordPrompt();
    });
}

initLibraryUI();
updateBookmarkButton();

if (window.swift && typeof window.swift.onOpenTab === 'function') {
    window.swift.onOpenTab((url) => {
        if (!url) return;
        if (/^(https?:|about:)/i.test(url)) createTab(url);
        else if (window.swift.openExternal) window.swift.openExternal(url);
    });
}
