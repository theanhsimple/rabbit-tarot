/* Rabbit Tarot CMS.
   Storage is the site's own GitHub repository:
     main       content/site.json (published content) + index.html (built from cms/template.html) + assets/media/*
     cms-draft  content/draft.json (the working draft; never served, so saving it can't change the public site)
   Sign-in is GitHub through Firebase Auth; every write is a GitHub API call made with the signed-in user's token,
   so GitHub enforces access server-side. Only repository administrators are let in. */
import {initializeApp} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js';
import {initializeAuth, inMemoryPersistence, browserPopupRedirectResolver, GithubAuthProvider, signInWithPopup, signOut} from 'https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js';

const CFG = {
  owner: 'theanhsimple', repo: 'rabbit-tarot', main: 'main', draftBranch: 'cms-draft',
  site: 'https://rabbittarot.io.vn',
  firebase: {apiKey: 'AIzaSyDZyuRKTlyb5d1Bd1LzoLFM7vzoJ8DKc6U', authDomain: 'rabbit-tarot.firebaseapp.com', projectId: 'rabbit-tarot'}
};
const P = {published: 'content/site.json', draft: 'content/draft.json', media: 'content/media.json', template: 'cms/template.html', index: 'index.html'};
const REPO = `${CFG.owner}/${CFG.repo}`;
const SESSION_KEY = 'rt-cms-session';
const IDLE_MS = 2 * 3600e3, MAX_MS = 12 * 3600e3;
// access code sign-in: a repo-scoped GitHub token, encrypted in the browser with the owner's access code
const ACCESS_PATH = 'admin/access.json', KDF_ITER = 600000, MIN_CODE = 12;
const MAX_UPLOAD = 15 * 1024 * 1024, MAX_EDGE = 2400;
const CATEGORIES = ['Banner', 'Hero', 'Background', 'Tarot Artwork', 'Thumbnail', 'Icon', 'Other'];
// files the page template or renderer use on their own, outside content/site.json
const SYSTEM_FILES = ['assets/emblem-144.png'];
const {TYPES, validate, esc} = window.RTRender;

/* ---------- state ---------- */
const S = {
  token: null, user: null, view: 'dashboard',
  published: null, publishedSha: null, publishedJson: '',
  draft: null, draftSha: null, savedJson: '',
  media: {items: []}, mediaSha: null,
  template: null,
  sel: 0,                // selected section index
  mediaSel: null, mediaFilter: 'all', mediaQuery: '',
  localImg: {},          // path → data URL for files uploaded in this session (not deployed yet)
  busy: '', deploy: '',  // deploy: '', 'building', 'live', 'slow'
  errors: [], history: null, historyLoading: false, accessBox: undefined
};
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const clone = o => JSON.parse(JSON.stringify(o));
const pretty = o => JSON.stringify(o, null, 2) + '\n';
const isDirty = () => S.draft && JSON.stringify(S.draft) !== S.savedJson;
const isPending = () => S.draft && JSON.stringify(S.draft) !== S.publishedJson;
const fmtBytes = n => n < 1024 ? n + ' B' : n < 1048576 ? (n / 1024).toFixed(0) + ' KB' : (n / 1048576).toFixed(1) + ' MB';
const fmtTime = t => t ? new Date(t).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'}) : '—';
const ago = t => {
  if (!t) return '—';
  const m = Math.round((Date.now() - new Date(t)) / 60000);
  return m < 1 ? 'vừa xong' : m < 60 ? `${m} phút trước` : m < 1440 ? `${Math.round(m / 60)} giờ trước` : fmtTime(t);
};
const ICON = {
  dashboard: '<path d="M3 3h7v9H3zM14 3h7v5h-7zM14 12h7v9h-7zM3 16h7v5H3z"/>',
  landing: '<path d="M3 4h18v16H3zM3 9h18M8 9v11"/>',
  media: '<path d="M3 4h18v16H3z"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  seo: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/>',
  eyeOff: '<path d="M17.9 17.9A10.5 10.5 0 0 1 12 19c-7 0-11-7-11-7a19 19 0 0 1 5.1-5.9M9.9 4.2A10 10 0 0 1 12 4c7 0 11 7 11 7a19 19 0 0 1-2.2 3.2M1 1l22 22"/>',
  ext: '<path d="M14 3h7v7M10 14L21 3M21 14v7H3V3h7"/>'
};
const svg = (name, cls = '') => `<svg viewBox="0 0 24 24" class="${cls}" aria-hidden="true">${ICON[name]}</svg>`;

/* ---------- toasts & dialogs ---------- */
function toast(msg, kind = '') {
  const el = document.createElement('div');
  el.className = 'toast ' + kind; el.textContent = msg;
  $('#toasts').append(el);
  setTimeout(() => el.remove(), kind === 'err' ? 7000 : 3500);
}
function modal({title, body, ok = 'Đồng ý', cancel = 'Huỷ', danger = false, wide = false, onOpen}) {
  return new Promise(resolve => {
    const d = document.createElement('dialog');
    d.className = 'modal' + (wide ? ' wide' : '');
    d.innerHTML = `<div class="modal-head"><h2>${esc(title)}</h2><button class="btn btn-ghost btn-icon" data-x aria-label="Đóng">✕</button></div>
      <div class="modal-body">${body}</div>
      <div class="modal-foot">${cancel ? `<button class="btn" data-x>${esc(cancel)}</button>` : ''}${ok ? `<button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" data-ok>${esc(ok)}</button>` : ''}</div>`;
    document.body.append(d);
    let result = false;
    d.addEventListener('click', e => {
      if (e.target === d || e.target.closest('[data-x]')) d.close();
      if (e.target.closest('[data-ok]')) { result = true; d.close(); }
    });
    d.addEventListener('close', () => { d.remove(); resolve(result); });
    d.showModal();
    onOpen && onOpen(d, v => { result = v; d.close(); });
  });
}
const confirmBox = (title, text, ok, danger) => modal({title, body: `<p>${text}</p>`, ok, danger});

/* ---------- GitHub API ---------- */
class ApiError extends Error { constructor(status, msg) { super(msg); this.status = status; } }
async function gh(path, opts = {}) {
  let res;
  try {
    res = await fetch('https://api.github.com' + path, {
      ...opts, cache: 'no-store',
      headers: {Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28', Authorization: `Bearer ${S.token}`, ...(opts.body ? {'Content-Type': 'application/json'} : {})}
    });
  } catch (e) { throw new ApiError(0, 'Không kết nối được tới GitHub. Kiểm tra mạng rồi thử lại.'); }
  if (res.status === 401) { if (S.user) endSession('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.'); throw new ApiError(401, 'Phiên đăng nhập đã hết hạn'); }
  if (!res.ok) {
    let m = ''; try { m = (await res.json()).message; } catch (e) {}
    if (res.status === 403 && /rate limit/i.test(m)) m = 'GitHub đang giới hạn số lần gọi. Đợi vài phút rồi thử lại.';
    throw new ApiError(res.status, m || res.statusText);
  }
  return res.status === 204 ? null : res.json();
}
const b64FromBytes = bytes => { let s = ''; for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000)); return btoa(s); };
const b64enc = str => b64FromBytes(new TextEncoder().encode(str));
const b64dec = b64 => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\s/g, '')), c => c.charCodeAt(0)));

async function readFile(path, ref) {
  try {
    const f = await gh(`/repos/${REPO}/contents/${path}?ref=${encodeURIComponent(ref)}`);
    // the contents API leaves out the body for files over 1 MB; fetch the blob instead
    const text = f.content ? b64dec(f.content) : b64dec((await gh(`/repos/${REPO}/git/blobs/${f.sha}`)).content);
    return {sha: f.sha, text};
  } catch (e) { if (e.status === 404) return null; throw e; }
}
async function branchHead(branch) {
  try { return (await gh(`/repos/${REPO}/git/ref/heads/${branch}`)).object.sha; }
  catch (e) { if (e.status === 404) return null; throw e; }
}
// One atomic commit with several files (text, base64 bytes, or deletions); retried once if the branch moved meanwhile.
async function commitFiles(branch, files, message) {
  for (let attempt = 0; ; attempt++) {
    const head = await branchHead(branch);
    if (!head) throw new ApiError(404, `Không tìm thấy nhánh ${branch}`);
    const base = await gh(`/repos/${REPO}/git/commits/${head}`);
    const tree = [];
    for (const f of files) {
      if (f.delete) { tree.push({path: f.path, mode: '100644', type: 'blob', sha: null}); continue; }
      const blob = await gh(`/repos/${REPO}/git/blobs`, {method: 'POST', body: JSON.stringify({content: f.b64 || b64enc(f.text), encoding: 'base64'})});
      tree.push({path: f.path, mode: '100644', type: 'blob', sha: blob.sha});
    }
    const t = await gh(`/repos/${REPO}/git/trees`, {method: 'POST', body: JSON.stringify({base_tree: base.tree.sha, tree})});
    const c = await gh(`/repos/${REPO}/git/commits`, {method: 'POST', body: JSON.stringify({message, tree: t.sha, parents: [head]})});
    try { await gh(`/repos/${REPO}/git/refs/heads/${branch}`, {method: 'PATCH', body: JSON.stringify({sha: c.sha, force: false})}); return c; }
    catch (e) { if (e.status === 422 && attempt === 0) continue; throw e; }
  }
}
async function ensureDraftBranch() {
  if (await branchHead(CFG.draftBranch)) return;
  const head = await branchHead(CFG.main);
  await gh(`/repos/${REPO}/git/refs`, {method: 'POST', body: JSON.stringify({ref: `refs/heads/${CFG.draftBranch}`, sha: head})});
}

/* ---------- session ---------- */
const fbApp = initializeApp(CFG.firebase);
const fbAuth = initializeAuth(fbApp, {persistence: inMemoryPersistence, popupRedirectResolver: browserPopupRedirectResolver});

function saveSession(extra = {}) {
  const cur = JSON.parse(sessionStorage.getItem(SESSION_KEY) || '{}');
  sessionStorage.setItem(SESSION_KEY, JSON.stringify({...cur, ...extra, last: Date.now()}));
}
function readSession() {
  try {
    const s = JSON.parse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (!s || !s.token) return null;
    if (Date.now() - s.start > MAX_MS || Date.now() - s.last > IDLE_MS) { sessionStorage.removeItem(SESSION_KEY); return null; }
    return s;
  } catch (e) { return null; }
}
async function login() {
  const btn = $('#ghBtn'), err = $('#loginErr');
  err.hidden = true; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Đang đăng nhập…';
  try {
    const provider = new GithubAuthProvider();
    provider.addScope('public_repo');
    provider.setCustomParameters({allow_signup: 'false'});
    const result = await signInWithPopup(fbAuth, provider);
    const token = GithubAuthProvider.credentialFromResult(result)?.accessToken;
    await signOut(fbAuth);   // only the GitHub token is needed; no Firebase session is kept
    if (!token) throw new Error('GitHub không trả về quyền truy cập.');
    S.token = token;
    await authorize();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({token, start: Date.now(), last: Date.now()}));
    await boot();
  } catch (e) {
    S.token = null;
    const code = e.code || '';
    err.textContent = code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request' ? 'Bạn đã đóng cửa sổ đăng nhập.'
      : code === 'auth/popup-blocked' ? 'Trình duyệt đã chặn cửa sổ đăng nhập. Hãy cho phép popup cho trang này rồi thử lại.'
      : code === 'auth/unauthorized-domain' ? 'Tên miền này chưa được cho phép đăng nhập trong Firebase (Authentication › Settings › Authorized domains).'
      : code === 'auth/operation-not-allowed' ? 'Đăng nhập GitHub chưa được bật trong Firebase (Authentication › Sign-in method).'
      : e.message || 'Không đăng nhập được.';
    err.hidden = false;
    btn.disabled = false; btn.textContent = 'Đăng nhập bằng GitHub';
  }
}
/* ---------- access code ---------- */
const b64ToBytes = b => Uint8Array.from(atob(b), c => c.charCodeAt(0));
async function codeKey(code, salt, iter) {
  const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(code.normalize('NFC')), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', hash: 'SHA-256', salt, iterations: iter}, base, {name: 'AES-GCM', length: 256}, false, ['encrypt', 'decrypt']);
}
async function sealToken(token, code, meta) {
  const salt = crypto.getRandomValues(new Uint8Array(16)), iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({name: 'AES-GCM', iv}, await codeKey(code, salt, KDF_ITER), new TextEncoder().encode(token)));
  return {v: 1, kdf: 'PBKDF2-SHA256', iter: KDF_ITER, cipher: 'AES-256-GCM', salt: b64FromBytes(salt), iv: b64FromBytes(iv), ct: b64FromBytes(ct), ...meta};
}
async function openToken(box, code) {
  try {
    const pt = await crypto.subtle.decrypt({name: 'AES-GCM', iv: b64ToBytes(box.iv)}, await codeKey(code, b64ToBytes(box.salt), box.iter), b64ToBytes(box.ct));
    return new TextDecoder().decode(pt);
  } catch (e) { return null; }
}
// read without signing in: the file only holds the encrypted token
async function loadAccessBox() {
  const res = await fetch(`https://api.github.com/repos/${REPO}/contents/${ACCESS_PATH}?ref=${CFG.main}`, {cache: 'no-store', headers: {Accept: 'application/vnd.github+json'}});
  if (res.status === 404) return null;
  if (!res.ok) throw new Error('Không đọc được cấu hình đăng nhập từ GitHub (mã ' + res.status + ').');
  return JSON.parse(b64dec((await res.json()).content));
}
async function codeLogin(e) {
  e.preventDefault();
  const btn = $('#codeBtn'), err = $('#loginErr'), code = $('#accessCode').value;
  err.hidden = true; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Đang mở khoá…';
  try {
    const token = await openToken(S.accessBox, code);
    if (!token) { await new Promise(r => setTimeout(r, 800)); throw new Error('Mã truy cập không đúng.'); }
    S.token = token;
    await authorize();
    sessionStorage.setItem(SESSION_KEY, JSON.stringify({token, start: Date.now(), last: Date.now()}));
    await boot();
  } catch (ex) {
    S.token = null;
    err.textContent = ex.status === 401 ? 'Khoá GitHub đã hết hạn hoặc bị thu hồi. Hãy thiết lập lại mã truy cập.' : ex.message;
    err.hidden = false; btn.disabled = false; btn.textContent = 'Vào CMS';
    $('#accessCode').select();
  }
}
function codeProblem(code, again) {
  if (code.length < MIN_CODE) return `Mã cần ít nhất ${MIN_CODE} ký tự. Một câu ngắn dễ nhớ là được, ví dụ: tho-trang-doc-bai-2026.`;
  if (/^\d+$/.test(code) || new Set(code).size < 6) return 'Mã quá dễ đoán. Hãy dùng chữ, số và dấu gạch, ví dụ: tho-trang-doc-bai-2026.';
  if (code !== again) return 'Hai lần nhập mã không giống nhau.';
  return '';
}
async function saveAccessBox(token, code, expires) {
  const box = await sealToken(token, code, {login: S.user.login, expires: expires || '', updated: new Date().toISOString()});
  await commitFiles(CFG.main, [{path: ACCESS_PATH, text: pretty(box)}], `CMS: cập nhật mã truy cập (${S.user.login})`);
  S.accessBox = box;
}
function showSetup(message) {
  const exp = new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10);
  $('#app').innerHTML = `<main class="login"><form class="login-card setup" id="setupForm" autocomplete="off">
    <img src="../assets/emblem-144.png" alt="">
    <h1>Thiết lập mã truy cập</h1>
    <p>Làm một lần. Sau đó chỉ cần nhập mã để vào CMS.</p>
    <div class="field"><label for="patInput">Khoá GitHub (fine-grained token)</label><input type="password" id="patInput" class="input" required autocomplete="off" spellcheck="false">
      <p class="help">Tạo tại GitHub › Settings › Developer settings › Fine-grained tokens. Chỉ chọn repository <span class="mono">${esc(REPO)}</span>, quyền <b>Contents: Read and write</b>.</p></div>
    <div class="field"><label for="patExp">Ngày khoá hết hạn</label><input type="date" id="patExp" class="input" value="${exp}"><p class="help">CMS sẽ nhắc bạn trước khi khoá hết hạn.</p></div>
    <div class="field"><label for="newCode">Mã truy cập mới</label><input type="password" id="newCode" class="input" required autocomplete="new-password"><p class="help">Ít nhất ${MIN_CODE} ký tự, ví dụ: tho-trang-doc-bai-2026.</p></div>
    <div class="field"><label for="newCode2">Nhập lại mã</label><input type="password" id="newCode2" class="input" required autocomplete="new-password"></div>
    <button class="btn btn-dark" id="setupBtn">Lưu và vào CMS</button>
    <p class="login-err" id="loginErr"${message ? '' : ' hidden'}>${esc(message || '')}</p>
    <p class="note"><button type="button" class="btn btn-ghost btn-sm" id="backLogin">← Quay lại đăng nhập</button></p>
  </form></main>`;
  $('#backLogin').onclick = () => showLogin();
  $('#setupForm').onsubmit = async e => {
    e.preventDefault();
    const err = $('#loginErr'), btn = $('#setupBtn');
    const pat = $('#patInput').value.trim(), code = $('#newCode').value, problem = codeProblem(code, $('#newCode2').value);
    if (problem) { err.textContent = problem; err.hidden = false; return; }
    err.hidden = true; btn.disabled = true; btn.innerHTML = '<span class="spin"></span> Đang kiểm tra khoá…';
    try {
      S.token = pat;
      await authorize();
      btn.innerHTML = '<span class="spin"></span> Đang lưu…';
      await saveAccessBox(pat, code, $('#patExp').value);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify({token: pat, start: Date.now(), last: Date.now()}));
      toast('Đã thiết lập mã truy cập. Từ lần sau chỉ cần nhập mã.', 'ok');
      await boot();
    } catch (ex) {
      S.token = null; S.user = null;
      err.textContent = ex.status === 401 ? 'Khoá GitHub không hợp lệ hoặc đã hết hạn.'
        : ex.status === 403 || ex.status === 404 ? 'Khoá này chưa có quyền ghi (Contents: Read and write) vào repository ' + REPO + '.'
        : ex.message;
      err.hidden = false; btn.disabled = false; btn.textContent = 'Lưu và vào CMS';
    }
  };
  $('#patInput').focus();
}
async function changeCode() {
  let code = '', again = '';
  const ok = await modal({
    title: 'Đổi mã truy cập', ok: 'Lưu mã mới',
    body: `<div class="form"><div class="field"><label for="cc1">Mã mới</label><input type="password" id="cc1" class="input" autocomplete="new-password"><p class="help">Ít nhất ${MIN_CODE} ký tự.</p></div>
      <div class="field"><label for="cc2">Nhập lại mã mới</label><input type="password" id="cc2" class="input" autocomplete="new-password"></div></div>`,
    onOpen: d => { $('#cc1', d).oninput = e => code = e.target.value; $('#cc2', d).oninput = e => again = e.target.value; $('#cc1', d).focus(); }
  });
  if (!ok) return;
  const problem = codeProblem(code, again);
  if (problem) { toast(problem, 'err'); return; }
  setBusy('Đang lưu mã truy cập…');
  try { await saveAccessBox(S.token, code, (S.accessBox || {}).expires); toast('Đã đổi mã truy cập.', 'ok'); render(); }
  catch (e) { toast('Chưa đổi được mã: ' + e.message, 'err'); }
  finally { setBusy(''); }
}
const keyDaysLeft = () => { const x = (S.accessBox || {}).expires; return x ? Math.ceil((new Date(x + 'T23:59:59') - Date.now()) / 864e5) : null; };

// The token must belong to an administrator of the site repository.
async function authorize() {
  const [user, repo] = await Promise.all([gh('/user'), gh(`/repos/${REPO}`)]);
  if (!repo.permissions || !repo.permissions.admin) throw new Error(`Tài khoản GitHub @${user.login} không có quyền quản trị website này.`);
  S.user = {login: user.login, name: user.name || user.login, avatar: user.avatar_url, role: 'Administrator'};
}
async function logout(skipConfirm) {
  if (!skipConfirm && isDirty() && !await confirmBox('Đăng xuất?', 'Bạn có thay đổi chưa lưu. Đăng xuất sẽ bỏ các thay đổi này.', 'Đăng xuất', true)) return;
  endSession();
}
function endSession(message) {
  sessionStorage.removeItem(SESSION_KEY);
  S.token = null; S.user = null; S.draft = null;
  showLogin(message);
}
// idle timeout: unsaved work is saved as a draft first so nothing is lost
let lastActivity = Date.now();
['pointerdown', 'keydown'].forEach(ev => addEventListener(ev, () => {
  if (Date.now() - lastActivity > 30e3 && S.token) saveSession();
  lastActivity = Date.now();
}, {passive: true}));
setInterval(async () => {
  if (!S.token) return;
  const s = readSession();
  if (s) return;
  if (isDirty()) { try { await saveDraft(true); } catch (e) {} }
  endSession('Phiên đăng nhập đã hết hạn do không hoạt động. Bản nháp đã được lưu.');
}, 60e3);
addEventListener('beforeunload', e => { if (isDirty()) { e.preventDefault(); e.returnValue = ''; } });

/* ---------- load & save ---------- */
async function loadContent() {
  const [pub, draftHead, media] = await Promise.all([readFile(P.published, CFG.main), branchHead(CFG.draftBranch), readFile(P.media, CFG.main)]);
  if (!pub) throw new Error('Không tìm thấy content/site.json trên nhánh main.');
  S.published = JSON.parse(pub.text); S.publishedSha = pub.sha; S.publishedJson = JSON.stringify(S.published);
  const draft = draftHead ? await readFile(P.draft, CFG.draftBranch) : null;
  S.draft = draft ? JSON.parse(draft.text) : clone(S.published);
  S.draftSha = draft ? draft.sha : null;
  S.savedJson = draft ? JSON.stringify(S.draft) : S.publishedJson;
  S.media = media ? JSON.parse(media.text) : {items: []};
  S.mediaSha = media ? media.sha : null;
  S.history = null;
}

async function saveDraft(silent) {
  if (!isDirty() && S.draftSha) { silent || toast('Không có thay đổi mới để lưu.'); return; }
  setBusy('Đang lưu nháp…');
  try {
    await ensureDraftBranch();
    const cur = await readFile(P.draft, CFG.draftBranch);
    if (cur && S.draftSha && cur.sha !== S.draftSha && !silent) {
      if (!await confirmBox('Bản nháp đã thay đổi ở nơi khác', 'Bản nháp trên GitHub đã được lưu từ một tab hoặc thiết bị khác sau khi bạn mở. Lưu đè bằng nội dung bạn đang sửa?', 'Lưu đè', true)) return false;
    }
    const json = pretty(S.draft);
    await commitFiles(CFG.draftBranch, [{path: P.draft, text: json}], `CMS: lưu nháp (${S.user.login})`);
    S.draftSha = (await readFile(P.draft, CFG.draftBranch)).sha;
    S.savedJson = JSON.stringify(S.draft); S.history = null;
    silent || toast('Đã lưu bản nháp. Website chưa thay đổi.', 'ok');
    return true;
  } catch (e) { toast('Chưa lưu được bản nháp: ' + e.message, 'err'); return false; }
  finally { setBusy(''); }
}

function changes(a, b) {
  // what differs between draft a and published b, by section id and settings
  const out = [];
  const bySec = (c) => Object.fromEntries((c.sections || []).map(s => [s.id, JSON.stringify(s)]));
  const A = bySec(a), B = bySec(b);
  (a.sections || []).forEach(s => {
    const name = sectionName(s);
    if (!B[s.id]) out.push(`Thêm section “${name}”`);
    else if (A[s.id] !== B[s.id]) out.push(`Sửa “${name}”`);
  });
  (b.sections || []).forEach(s => { if (!A[s.id]) out.push(`Xoá section “${sectionName(s)}”`); });
  const ord = c => (c.sections || []).map(s => s.id).filter(id => A[id] && B[id]).join();
  if (ord(a) !== ord(b)) out.push('Đổi thứ tự section');
  const st = ['header', 'footer', 'seo'];
  if (JSON.stringify({...a.settings, ...Object.fromEntries(st.map(k => [k, 0]))}) !== JSON.stringify({...b.settings, ...Object.fromEntries(st.map(k => [k, 0]))})) out.push('Sửa cài đặt chung');
  if (JSON.stringify((a.settings || {}).header) !== JSON.stringify((b.settings || {}).header)) out.push('Sửa header');
  if (JSON.stringify((a.settings || {}).footer) !== JSON.stringify((b.settings || {}).footer)) out.push('Sửa footer');
  if (JSON.stringify((a.settings || {}).seo) !== JSON.stringify((b.settings || {}).seo)) out.push('Sửa SEO');
  return out;
}

async function getTemplate(fresh) {
  if (!S.template || fresh) {
    const t = await readFile(P.template, CFG.main);
    if (!t) throw new Error('Không tìm thấy cms/template.html');
    S.template = t.text;
  }
  return S.template;
}
function buildPage(content, tpl) {
  const html = window.RTRender.render(tpl, content, {deck: window.RABBIT_DECK || []});
  if (!/<\/html>\s*$/.test(html) || /<!--\/?CMS:/.test(html)) throw new Error('Template không hợp lệ: còn vùng nội dung chưa được điền.');
  return html;
}

async function publish(content = S.draft, note = '') {
  const errs = validate(content);
  if (errs.length) { S.errors = errs; render(); toast('Còn lỗi nội dung, chưa thể publish.', 'err'); return; }
  const list = changes(content, S.published);
  if (!list.length && !note) { toast('Bản nháp giống hệt nội dung đang hiển thị, không có gì để publish.'); return; }
  const ok = await modal({
    title: 'Publish lên website?',
    body: `<p>Nội dung sau sẽ hiển thị công khai trên <b>${esc(CFG.site.replace('https://', ''))}</b> sau khoảng 1 phút:</p>
      <ul class="rows panel" style="margin-top:12px">${(list.length ? list : [note]).map(x => `<li>${esc(x)}</li>`).join('')}</ul>
      <p class="muted" style="margin-top:12px">Phiên bản hiện tại vẫn được lưu trong Lịch sử và có thể khôi phục.</p>`,
    ok: 'Publish'
  });
  if (!ok) return;
  if (content === S.draft && isDirty() && !await saveDraft(true)) return;
  setBusy('Đang publish…');
  try {
    const cur = await readFile(P.published, CFG.main);
    if (cur.sha !== S.publishedSha && !await confirmBox('Website vừa được cập nhật ở nơi khác', 'Nội dung đang hiển thị đã thay đổi sau khi bạn mở CMS. Publish sẽ thay thế thay đổi đó bằng bản của bạn.', 'Vẫn publish', true)) return;
    const html = buildPage(content, await getTemplate(true));
    await commitFiles(CFG.main, [{path: P.published, text: pretty(content)}, {path: P.index, text: html}],
      `CMS: publish — ${(list.length ? list : [note]).slice(0, 4).join('; ')}${list.length > 4 ? '…' : ''} (${S.user.login})`);
    S.published = clone(content); S.publishedJson = JSON.stringify(S.published);
    S.publishedSha = (await readFile(P.published, CFG.main)).sha;
    S.errors = []; S.history = null;
    toast('Đã publish. Website sẽ cập nhật trong khoảng 1 phút.', 'ok');
    watchDeploy();
  } catch (e) { toast('Publish chưa thành công: ' + e.message, 'err'); }
  finally { setBusy(''); }
}
// GitHub Pages rebuilds after each publish; poll the live content until it matches what was published.
let deployTimer = null;
function watchDeploy() {
  clearTimeout(deployTimer);
  S.deploy = 'building'; renderStatus();
  const want = S.publishedJson, started = Date.now();
  const tick = async () => {
    try {
      const live = await fetch(`${CFG.site}/${P.published}?t=${Date.now()}`, {cache: 'no-store'}).then(r => r.ok ? r.json() : null);
      if (live && JSON.stringify(live) === want) { S.deploy = 'live'; renderStatus(); toast('Website đã hiển thị nội dung mới.', 'ok'); return; }
    } catch (e) {}
    if (Date.now() - started > 5 * 60e3) { S.deploy = 'slow'; renderStatus(); return; }
    deployTimer = setTimeout(tick, 6000);
  };
  deployTimer = setTimeout(tick, 8000);
}

/* ---------- preview ---------- */
const rawUrl = p => `https://raw.githubusercontent.com/${REPO}/${CFG.main}/${p}`;
const mediaUrl = p => !p ? '' : S.localImg[p] || (/^https:/.test(p) ? p : p.startsWith('assets/media/') ? rawUrl(p) : '../' + p);
async function preview(content = S.draft, label = 'Bản nháp') {
  let html;
  try { html = buildPage(content, await getTemplate()); }
  catch (e) { toast('Không tạo được bản xem trước: ' + e.message, 'err'); return; }
  // assets resolve against this site; files uploaded but not deployed yet come from this session or GitHub
  html = html.replace('<head>', `<head><base href="${location.origin}/">`);
  for (const [p, data] of Object.entries(S.localImg)) html = html.split(`"${p}"`).join(`"${data}"`);
  html = html.replace(/"assets\/media\//g, `"${rawUrl('assets/media/')}`);
  const ov = document.createElement('div');
  ov.className = 'preview-overlay';
  ov.innerHTML = `<div class="preview-bar">
      <b>Xem trước</b><span class="pill warn">${esc(label)} — chưa hiển thị công khai</span>
      <span class="grow"></span>
      <div class="seg" role="group" aria-label="Kích thước màn hình">
        <button aria-pressed="true" data-w="100%">Máy tính</button><button aria-pressed="false" data-w="768px">Tablet</button><button aria-pressed="false" data-w="390px">Điện thoại</button>
      </div>
      ${content === S.draft ? '<button class="btn btn-primary btn-sm" data-pub>Publish</button>' : ''}
      <button class="btn btn-sm" data-close>Đóng</button>
    </div>
    <div class="preview-stage"><iframe title="Xem trước website" sandbox="allow-scripts allow-popups" src="preview.html"></iframe></div>`;
  document.body.append(ov);
  const frame = $('iframe', ov);
  const onMsg = e => { if (e.source === frame.contentWindow && e.data && e.data.type === 'rt-preview-ready') frame.contentWindow.postMessage({type: 'rt-preview', html}, '*'); };
  addEventListener('message', onMsg);
  const close = () => { removeEventListener('message', onMsg); removeEventListener('keydown', onKey); ov.remove(); };
  const onKey = e => { if (e.key === 'Escape') close(); };
  addEventListener('keydown', onKey);
  ov.addEventListener('click', e => {
    const w = e.target.closest('[data-w]');
    if (w) { $$('[data-w]', ov).forEach(b => b.setAttribute('aria-pressed', b === w)); frame.style.width = w.dataset.w; }
    if (e.target.closest('[data-close]')) close();
    if (e.target.closest('[data-pub]')) { close(); publish(); }
  });
  $('[data-close]', ov).focus();
}

/* ---------- media ---------- */
const MAGIC = [
  {type: 'image/png', ext: 'png', test: b => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4E && b[3] === 0x47},
  {type: 'image/jpeg', ext: 'jpg', test: b => b[0] === 0xFF && b[1] === 0xD8 && b[2] === 0xFF},
  {type: 'image/webp', ext: 'webp', test: b => b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50}
];
// Accepts PNG/JPG/WebP by their real bytes (not the file name) and SVG without scripts or external references.
async function checkFile(file) {
  if (file.size > MAX_UPLOAD) throw new Error(`lớn hơn ${fmtBytes(MAX_UPLOAD)}`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const m = MAGIC.find(x => x.test(bytes));
  if (m) return {kind: m.type, ext: m.ext, bytes};
  const head = new TextDecoder().decode(bytes.subarray(0, 2048)).trim();
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) {
    const text = new TextDecoder().decode(bytes);
    if (/<script|<foreignObject|<iframe|<embed|<object|\son[a-z]+\s*=|javascript:|(?:xlink:)?href\s*=\s*["']\s*(?!#)|<!ENTITY/i.test(text)) throw new Error('SVG chứa mã hoặc liên kết ngoài, không an toàn');
    return {kind: 'image/svg+xml', ext: 'svg', bytes};
  }
  throw new Error('không phải ảnh PNG, JPG, WebP hoặc SVG hợp lệ');
}
const loadImage = blob => new Promise((ok, no) => {
  const url = URL.createObjectURL(blob), img = new Image();
  img.onload = () => { URL.revokeObjectURL(url); ok(img); };
  img.onerror = () => { URL.revokeObjectURL(url); no(new Error('ảnh bị lỗi, không đọc được')); };
  img.src = url;
});
// Raster images: scaled to at most 2400 px on the long edge and re-encoded (WebP unless a format is required).
async function optimize(info, forceType) {
  if (info.kind === 'image/svg+xml') {
    if (forceType && forceType !== 'image/svg+xml') throw new Error('cần ảnh cùng định dạng với ảnh cũ');
    return {bytes: info.bytes, type: info.kind, ext: 'svg', width: null, height: null};
  }
  const img = await loadImage(new Blob([info.bytes], {type: info.kind}));
  const scale = Math.min(1, MAX_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale), h = Math.round(img.naturalHeight * scale);
  const type = forceType || 'image/webp';
  if (forceType === 'image/svg+xml') throw new Error('cần ảnh SVG');
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  if (type === 'image/jpeg') { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(img, 0, 0, w, h);
  const blob = await new Promise(r => c.toBlob(r, type, type === 'image/png' ? undefined : 0.86));
  if (!blob || blob.type !== type) throw new Error('trình duyệt không chuyển được sang ' + type);
  let bytes = new Uint8Array(await blob.arrayBuffer());
  let outType = type;
  // keep the original when it was already small and re-encoding made it bigger
  if (!forceType && scale === 1 && bytes.length > info.bytes.length) { bytes = info.bytes; outType = info.kind; }
  const ext = {'image/webp': 'webp', 'image/jpeg': 'jpg', 'image/png': 'png'}[outType];
  return {bytes, type: outType, ext, width: w, height: h};
}
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').toLowerCase().replace(/\.[a-z0-9]+$/, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'anh';
const dataUrl = (bytes, type) => `data:${type};base64,${b64FromBytes(bytes)}`;

async function uploadFiles(fileList, category = 'Other', rowsEl) {
  const files = [...fileList];
  if (!files.length) return [];
  const rows = files.map(f => {
    const r = document.createElement('div'); r.className = 'up-row';
    r.innerHTML = `<span class="grow">${esc(f.name)}</span><span class="st muted">Đang kiểm tra…</span>`;
    rowsEl && rowsEl.append(r); return r;
  });
  const st = (i, t, cls = '') => { const s = $('.st', rows[i]); s.textContent = t; s.className = 'st ' + cls; };
  const ready = [];
  const year = new Date().getFullYear();
  for (let i = 0; i < files.length; i++) {
    try {
      const info = await checkFile(files[i]);
      st(i, 'Đang tối ưu…');
      const out = await optimize(info);
      const path = `assets/media/${year}/${slug(files[i].name)}-${Math.random().toString(36).slice(2, 6)}.${out.ext}`;
      ready.push({i, path, out, name: files[i].name.replace(/\.[^.]+$/, ''), orig: files[i].size});
      st(i, `${fmtBytes(files[i].size)} → ${fmtBytes(out.bytes.length)}`);
    } catch (e) { st(i, 'Lỗi: ' + e.message, 'ferr'); }
  }
  if (!ready.length) return [];
  ready.forEach(r => st(r.i, 'Đang tải lên…'));
  const now = new Date().toISOString();
  const media = clone(S.media);
  ready.forEach(r => media.items.unshift({path: r.path, name: r.name, category, alt: '', size: r.out.bytes.length, type: r.out.type, width: r.out.width, height: r.out.height, uploaded: now, by: S.user.login}));
  try {
    await commitFiles(CFG.main, [...ready.map(r => ({path: r.path, b64: b64FromBytes(r.out.bytes)})), {path: P.media, text: pretty(media)}],
      `CMS: tải lên ${ready.length} ảnh (${S.user.login})`);
    S.media = media;
    ready.forEach(r => { S.localImg[r.path] = dataUrl(r.out.bytes, r.out.type); st(r.i, 'Đã tải lên', 'tag green'); });
    toast(`Đã tải lên ${ready.length} ảnh.`, 'ok');
    return ready.map(r => r.path);
  } catch (e) {
    ready.forEach(r => st(r.i, 'Lỗi tải lên', 'ferr'));
    toast('Tải ảnh lên chưa thành công: ' + e.message, 'err');
    return [];
  }
}
function usage(path) {
  const where = [];
  const scan = (content, label) => {
    (content.sections || []).forEach(s => { if (JSON.stringify(s).includes(`"${path}"`)) where.push(`${label}: ${sectionName(s)}`); });
    if (JSON.stringify(content.settings || {}).includes(`"${path}"`)) where.push(`${label}: Cài đặt / SEO`);
  };
  scan(S.draft, 'Bản nháp'); scan(S.published, 'Đang hiển thị');
  if (SYSTEM_FILES.includes(path)) where.push('Giao diện website (mặc định)');
  return [...new Set(where)];
}
async function deleteMedia(item) {
  const used = usage(item.path);
  if (used.length) {
    await modal({title: 'Ảnh đang được dùng', body: `<p>Không thể xoá vì ảnh này đang được dùng ở:</p><ul style="margin:8px 0 0 18px">${used.map(u => `<li>${esc(u)}</li>`).join('')}</ul><p class="muted" style="margin-top:12px">Hãy thay ảnh ở các vị trí trên (và publish) trước khi xoá.</p>`, ok: '', cancel: 'Đóng'});
    return;
  }
  if (!await confirmBox('Xoá ảnh?', `“${esc(item.name)}” sẽ bị xoá khỏi thư viện và website. Có thể lấy lại từ lịch sử GitHub nếu cần.`, 'Xoá ảnh', true)) return;
  setBusy('Đang xoá ảnh…');
  try {
    const media = clone(S.media); media.items = media.items.filter(x => x.path !== item.path);
    await commitFiles(CFG.main, [{path: item.path, delete: true}, {path: P.media, text: pretty(media)}], `CMS: xoá ảnh ${item.path} (${S.user.login})`);
    S.media = media; S.mediaSel = null; delete S.localImg[item.path];
    toast('Đã xoá ảnh.', 'ok'); render();
  } catch (e) { toast('Chưa xoá được ảnh: ' + e.message, 'err'); }
  finally { setBusy(''); }
}
async function replaceMedia(item, file) {
  try {
    const info = await checkFile(file);
    const used = usage(item.path);
    if (!await confirmBox('Thay ảnh?', `Ảnh mới sẽ thay “${esc(item.name)}” ở cùng đường dẫn${used.length ? `, nên các vị trí đang dùng ảnh này (${esc(used.join(', '))}) sẽ đổi ngay trên website sau khoảng 1 phút, không cần publish` : ''}.`, 'Thay ảnh')) return;
    setBusy('Đang thay ảnh…');
    const out = await optimize(info, item.type);
    const media = clone(S.media);
    Object.assign(media.items.find(x => x.path === item.path), {size: out.bytes.length, width: out.width, height: out.height, uploaded: new Date().toISOString(), by: S.user.login});
    await commitFiles(CFG.main, [{path: item.path, b64: b64FromBytes(out.bytes)}, {path: P.media, text: pretty(media)}], `CMS: thay ảnh ${item.path} (${S.user.login})`);
    S.media = media; S.localImg[item.path] = dataUrl(out.bytes, out.type);
    toast('Đã thay ảnh.', 'ok'); render();
  } catch (e) { toast('Chưa thay được ảnh: ' + e.message, 'err'); }
  finally { setBusy(''); }
}

// Image picker for image fields: choose from the library or upload; resolves to a path or null.
function pickImage(current) {
  let chosen = current || null, filter = 'all', q = '';
  const grid = () => {
    const items = S.media.items.filter(m => (filter === 'all' || m.category === filter) && (!q || (m.name + m.path).toLowerCase().includes(q)));
    return items.length ? items.map(m => `<button type="button" class="m-card" data-p="${esc(m.path)}" aria-pressed="${m.path === chosen}">
        <div class="im"><img src="${esc(mediaUrl(m.path))}" alt="" loading="lazy"></div><div class="cap"><b>${esc(m.name)}</b><small>${esc(m.category)}</small></div></button>`).join('')
      : '<div class="empty"><b>Không có ảnh phù hợp</b>Thử bộ lọc khác hoặc tải ảnh mới lên.</div>';
  };
  return new Promise(resolve => {
    modal({
      title: 'Chọn ảnh', wide: true, ok: 'Dùng ảnh này',
      body: `<div class="toolbar"><input class="input" type="search" placeholder="Tìm theo tên…" data-q aria-label="Tìm ảnh">
          <label class="btn">Tải ảnh lên<input type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple hidden data-up></label></div>
        <div class="chips" style="margin-bottom:12px">${['all', ...CATEGORIES].map(c => `<button type="button" class="chip" data-f="${esc(c)}" aria-pressed="${c === filter}">${c === 'all' ? 'Tất cả' : esc(c)}</button>`).join('')}</div>
        <div class="uploads" data-rows></div>
        <div class="media-grid" data-grid>${grid()}</div>`,
      onOpen: d => {
        const g = $('[data-grid]', d);
        d.addEventListener('click', e => {
          const c = e.target.closest('.m-card'); if (c) { chosen = c.dataset.p; $$('.m-card', d).forEach(x => x.setAttribute('aria-pressed', x === c)); }
          const f = e.target.closest('[data-f]'); if (f) { filter = f.dataset.f; $$('[data-f]', d).forEach(x => x.setAttribute('aria-pressed', x === f)); g.innerHTML = grid(); }
        });
        $('[data-q]', d).addEventListener('input', e => { q = e.target.value.toLowerCase(); g.innerHTML = grid(); });
        $('[data-up]', d).addEventListener('change', async e => {
          const paths = await uploadFiles(e.target.files, filter === 'all' ? 'Other' : filter, $('[data-rows]', d));
          if (paths.length) chosen = paths[0];
          g.innerHTML = grid();
        });
      }
    }).then(ok => resolve(ok ? chosen : null));
  });
}

/* ---------- field editors (generated from the schema in assets/cms-render.js) ---------- */
const getAt = (o, path) => path.reduce((a, k) => a == null ? a : a[k], o);
function setAt(o, path, v) {
  let cur = o;
  path.slice(0, -1).forEach((k, i) => { if (cur[k] == null) cur[k] = typeof path[i + 1] === 'number' ? [] : {}; cur = cur[k]; });
  cur[path[path.length - 1]] = v;
}
const pathAttr = p => esc(JSON.stringify(p));
const fid = p => 'f-' + p.join('-').replace(/[^\w-]/g, '_');

function bioToText(b) {
  return (Array.isArray(b) ? b : b ? [b] : []).map(x => typeof x === 'string' ? x : x.list ? x.list.map(i => '- ' + i).join('\n') : x.quote ? '> ' + x.quote : '').join('\n\n');
}
function textToBio(t) {
  return String(t).split(/\n\s*\n/).map(p => p.trim()).filter(Boolean).map(p => {
    const lines = p.split('\n');
    if (lines.every(l => /^-\s+/.test(l))) return {list: lines.map(l => l.replace(/^-\s+/, ''))};
    if (/^>\s*/.test(p)) return {quote: lines.map(l => l.replace(/^>\s*/, '')).join(' ')};
    return p;
  });
}
const ANCHORS = ['#zalo', '#services', '#readers', '#booking', '#daily', '#faq'];

function fieldHtml(f, value, path) {
  const id = fid(path), pa = pathAttr(path);
  const lab = `<label for="${id}">${esc(f.label)}${f.req ? ' <span class="req">*</span>' : ''}</label>`;
  const help = f.help ? `<p class="help">${esc(f.help)}</p>` : '';
  const counter = f.max && (f.t === 'text' || f.t === 'textarea' || f.t === 'url') ? `<p class="counter" data-count-for="${id}">${String(value || '').length}/${f.max}</p>` : '';
  const attrs = `id="${id}" data-path="${pa}" data-kind="${f.t}"${f.max ? ` maxlength="${f.max + 200}"` : ''}${f.req ? ' aria-required="true"' : ''}${f.pattern ? ` data-pattern="${esc(f.pattern)}"` : ''}`;
  switch (f.t) {
    case 'text': case 'url':
      return `<div class="field">${lab}<input type="text" ${attrs} value="${esc(value)}"${f.t === 'url' ? ` list="anchors" inputmode="url"` : ''}>${help}${counter}</div>`;
    case 'textarea':
      return `<div class="field">${lab}<textarea ${attrs}>${esc(value)}</textarea>${help}${counter}</div>`;
    case 'number':
      return `<div class="field">${lab}<input type="number" ${attrs} value="${esc(value)}"${f.min != null ? ` min="${f.min}"` : ''}${f.max != null ? ` max="${f.max}"` : ''}>${help}</div>`;
    case 'select':
      return `<div class="field">${lab}<select ${attrs}>${f.options.map(([v, l]) => `<option value="${esc(v)}"${(value || f.options[0][0]) === v ? ' selected' : ''}>${esc(l)}</option>`).join('')}</select>${help}</div>`;
    case 'toggle':
      return `<div class="field"><label class="switch"><input type="checkbox" ${attrs}${value !== false ? ' checked' : ''}> ${esc(f.label)}</label>${help}</div>`;
    case 'link': {
      const v = value || {};
      return `<div class="field"><span class="flabel">${esc(f.label)}</span><div class="row2">
        <input type="text" id="${id}" placeholder="Chữ trên nút" aria-label="${esc(f.label)}: chữ trên nút" data-path="${pathAttr([...path, 'label'])}" data-kind="text" value="${esc(v.label)}">
        <input type="text" placeholder="Liên kết, ví dụ #zalo" aria-label="${esc(f.label)}: liên kết" list="anchors" data-path="${pathAttr([...path, 'href'])}" data-kind="url" value="${esc(v.href)}"></div>
        <p class="help">Liên kết trong trang: #zalo, #services, #readers, #daily, #faq — hoặc địa chỉ https://…</p></div>`;
    }
    case 'image':
      return `<div class="field"><span class="flabel">${esc(f.label)}${f.req ? ' <span class="req">*</span>' : ''}</span>
        <div class="img-field">${value ? `<img class="thumb" src="${esc(mediaUrl(value))}" alt="">` : '<span class="thumb"></span>'}
          <div class="meta"><span class="mono">${value ? esc(value) : 'Chưa có ảnh'}</span></div>
          <div class="btns"><button type="button" class="btn btn-sm" data-pick="${pa}">${value ? 'Đổi ảnh' : 'Chọn ảnh'}</button>${value ? `<button type="button" class="btn btn-sm btn-ghost" data-clear="${pa}">Bỏ</button>` : ''}</div>
        </div>${help}</div>`;
    case 'bio':
      return `<div class="field">${lab}<textarea class="tall" ${attrs}>${esc(bioToText(value))}</textarea>${help}</div>`;
    case 'days': {
      const v = value || [];
      return `<div class="field"><span class="flabel">${esc(f.label)}</span><div class="days">${['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((d, i) =>
        `<label class="check"><input type="checkbox" data-path="${pa}" data-kind="days" value="${i}"${v.includes(i) ? ' checked' : ''}> ${d}</label>`).join('')}</div>${help}</div>`;
    }
    case 'card': {
      const deck = window.RABBIT_DECK || [];
      return `<div class="field">${lab}<select ${attrs}><option value="">— Không có —</option>${deck.map(c => `<option value="${esc(c.id)}"${c.id === value ? ' selected' : ''}>${esc(c.vi)} · ${esc(c.name)}</option>`).join('')}</select>${help}</div>`;
    }
    case 'strings': {
      const v = value || [];
      return `<div class="field"><span class="flabel">${esc(f.label)}</span><div class="strings">${v.map((s, i) =>
        `<div class="s-row"><input type="text" class="input" aria-label="${esc(f.label)} ${i + 1}" data-path="${pathAttr([...path, i])}" data-kind="text" value="${esc(s)}">
          <button type="button" class="btn btn-icon btn-ghost" title="Lên" aria-label="Chuyển lên" data-move="${pathAttr(path)}" data-i="${i}" data-d="-1"${i ? '' : ' disabled'}>↑</button>
          <button type="button" class="btn btn-icon btn-ghost btn-danger" title="Xoá" aria-label="Xoá dòng" data-del="${pathAttr(path)}" data-i="${i}">✕</button></div>`).join('')}
        <div><button type="button" class="btn btn-sm" data-add="${pa}" data-kind="strings">+ Thêm dòng</button></div></div>${help}</div>`;
    }
    case 'list': {
      const v = value || [];
      const first = f.item.find(x => x.t === 'text');
      return `<div class="field"><span class="flabel">${esc(f.label)} <span class="muted">(${v.length})</span></span>${help}<div class="list-items">${v.map((it, i) => `
        <details class="li-card"${v.length <= 2 ? ' open' : ''}><summary><span class="chev">›</span><span class="t" data-sum>${esc((first && it[first.k]) || `Mục ${i + 1}`)}</span>
          <button type="button" class="btn btn-icon btn-ghost btn-sm" title="Lên" aria-label="Chuyển lên" data-move="${pathAttr(path)}" data-i="${i}" data-d="-1"${i ? '' : ' disabled'}>↑</button>
          <button type="button" class="btn btn-icon btn-ghost btn-sm" title="Xuống" aria-label="Chuyển xuống" data-move="${pathAttr(path)}" data-i="${i}" data-d="1"${i < v.length - 1 ? '' : ' disabled'}>↓</button>
          <button type="button" class="btn btn-icon btn-ghost btn-sm btn-danger" title="Xoá" aria-label="Xoá mục" data-del="${pathAttr(path)}" data-i="${i}">✕</button></summary>
          <div class="li-body">${f.item.map(x => fieldHtml(x, it[x.k], [...path, i, x.k])).join('')}</div></details>`).join('')}
        <div><button type="button" class="btn btn-sm" data-add="${pa}" data-kind="list">+ Thêm ${esc(f.label.toLowerCase())}</button></div></div></div>`;
    }
  }
  return '';
}
function fieldError(el) {
  const v = el.value;
  if (el.getAttribute('aria-required') === 'true' && !v.trim()) return 'Bắt buộc';
  if (el.dataset.pattern && v && !new RegExp(el.dataset.pattern).test(v)) return 'Sai định dạng';
  if (el.dataset.kind === 'url' && v && window.RTRender.safeUrl(v) === '#' && v !== '#') return 'Liên kết cần bắt đầu bằng #, /, https://, mailto: hoặc tel:';
  return '';
}
function onFieldInput(e) {
  const el = e.target.closest('[data-path]');
  if (!el || !S.draft) return;
  const path = JSON.parse(el.dataset.path), kind = el.dataset.kind;
  let v;
  if (kind === 'toggle') v = el.checked;
  else if (kind === 'number') v = el.value === '' ? '' : Number(el.value);
  else if (kind === 'bio') v = textToBio(el.value);
  else if (kind === 'days') v = $$(`input[data-kind="days"][data-path='${el.dataset.path}']`).filter(x => x.checked).map(x => +x.value);
  else v = el.value;
  setAt(S.draft, path, v);
  if (kind !== 'toggle' && kind !== 'days') {
    const err = fieldError(el);
    el.setAttribute('aria-invalid', !!err);
    let msg = el.parentElement.querySelector(`[data-err-for="${el.id}"]`);
    if (err && !msg) { msg = document.createElement('p'); msg.className = 'ferr'; msg.dataset.errFor = el.id; el.after(msg); }
    if (msg) msg.textContent = err;
    const c = el.id && $(`[data-count-for="${el.id}"]`);
    if (c) { const max = +c.textContent.split('/')[1]; c.textContent = `${el.value.length}/${max}`; c.classList.toggle('over', el.value.length > max); }
    const sum = el.closest('.li-card'); if (sum && el.closest('.li-body') && el === $('.li-body input[data-kind="text"]', sum)) $('[data-sum]', sum).textContent = el.value || '…';
  }
  if (S.view === 'seo') renderSeoPreview();
  if (S.view === 'landing') { const it = $('.sec-item[aria-current="true"] .name b'); if (it && path[2] === 'title') it.textContent = v; }
  renderStatus();
}
async function onFieldClick(e) {
  const t = e.target;
  const pick = t.closest('[data-pick]'), clear = t.closest('[data-clear]'), add = t.closest('[data-add]'), del = t.closest('[data-del]'), mv = t.closest('[data-move]');
  if (pick) { const p = JSON.parse(pick.dataset.pick); const v = await pickImage(getAt(S.draft, p)); if (v) { setAt(S.draft, p, v); rerender(); } }
  if (clear) { setAt(S.draft, JSON.parse(clear.dataset.clear), ''); rerender(); }
  if (add) {
    e.preventDefault();
    const p = JSON.parse(add.dataset.add);
    const arr = getAt(S.draft, p) || [];
    arr.push(add.dataset.kind === 'strings' ? '' : {});
    setAt(S.draft, p, arr); rerender();
  }
  if (del) {
    e.preventDefault();
    const p = JSON.parse(del.dataset.del), arr = getAt(S.draft, p);
    if (!arr) return;
    const item = arr[+del.dataset.i];
    if (item && typeof item === 'object' && Object.values(item).some(Boolean) && !await confirmBox('Xoá mục này?', 'Mục này sẽ bị xoá khỏi bản nháp. Bạn có thể tải lại bản đã lưu nếu cần.', 'Xoá', true)) return;
    arr.splice(+del.dataset.i, 1); rerender();
  }
  if (mv) {
    e.preventDefault();
    const p = JSON.parse(mv.dataset.move), arr = getAt(S.draft, p), i = +mv.dataset.i, j = i + +mv.dataset.d;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]]; rerender();
  }
}
function rerender() { const y = scrollY; render(); scrollTo(0, y); }

/* ---------- views ---------- */
const sectionName = s => s.title || (TYPES[s.type] ? TYPES[s.type].label : s.type);
const NAV = [
  ['dashboard', 'Tổng quan', 'dashboard'], ['landing', 'Landing page', 'landing'], ['media', 'Thư viện ảnh', 'media'],
  ['settings', 'Cài đặt chung', 'settings'], ['seo', 'SEO', 'seo'], ['history', 'Lịch sử phiên bản', 'history']
];
const TITLES = Object.fromEntries(NAV.map(n => [n[0], n[1]]));

async function showLogin(message) {
  document.title = 'Đăng nhập — Rabbit Tarot CMS';
  $('#app').innerHTML = '<div class="loading" role="status"><span class="spin"></span>Đang tải…</div>';
  try { S.accessBox = await loadAccessBox(); } catch (e) { S.accessBox = undefined; message = message || e.message; }
  const hasCode = !!S.accessBox;
  $('#app').innerHTML = `<main class="login"><div class="login-card">
    <img src="../assets/emblem-144.png" alt="">
    <h1>Rabbit Tarot CMS</h1>
    <p>Quản trị nội dung website rabbittarot.io.vn</p>
    ${hasCode ? `<form id="codeForm" class="code-form">
        <label for="accessCode" class="sr-only">Mã truy cập</label>
        <input type="password" id="accessCode" class="input" placeholder="Nhập mã truy cập" autocomplete="current-password" required>
        <button class="btn btn-dark" id="codeBtn">Vào CMS</button>
      </form>` : `<p class="notice" style="margin-top:20px;text-align:left">Chưa có mã truy cập. Thiết lập một lần để từ sau chỉ cần nhập mã.</p>
      <button class="btn btn-dark" id="setupLink">Thiết lập mã truy cập</button>`}
    <p class="login-err" id="loginErr"${message ? '' : ' hidden'}>${esc(message || '')}</p>
    <div class="login-alt">
      <button class="btn btn-ghost btn-sm" id="ghBtn">Đăng nhập bằng GitHub</button>
      ${hasCode ? '<button class="btn btn-ghost btn-sm" id="setupLink">Thiết lập lại mã</button>' : ''}
    </div>
  </div></main>`;
  $('#ghBtn').onclick = login;
  $('#setupLink').onclick = () => showSetup();
  if (hasCode) { $('#codeForm').onsubmit = codeLogin; $('#accessCode').focus(); }
}

function shell() {
  $('#app').innerHTML = `<div class="shell" id="shell">
    <aside class="sidebar" aria-label="Điều hướng CMS">
      <a class="sb-brand" href="#dashboard" data-nav="dashboard"><img src="../assets/emblem-144.png" alt=""><span><b>Rabbit Tarot</b><small>CMS</small></span></a>
      <nav class="sb-nav">${NAV.map(([k, l, ic]) => `<button data-nav="${k}">${svg(ic)}<span>${l}</span>${k === 'landing' ? '<span class="count" id="pendingCount" hidden></span>' : ''}</button>`).join('')}</nav>
      <div class="sb-foot">
        <a class="sb-site" href="${CFG.site}" target="_blank" rel="noopener">${svg('ext')} Mở website</a>
        <div class="sb-user"><img src="${esc(S.user.avatar)}" alt=""><div><b>${esc(S.user.name)}</b><small>${esc(S.user.role)} · @${esc(S.user.login)}</small></div></div>
        <button class="btn btn-sm" id="logoutBtn">Đăng xuất</button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar">
        <button class="btn btn-icon menu-toggle" id="menuToggle" aria-label="Mở menu">☰</button>
        <h1 id="viewTitle"></h1>
        <span id="status"></span>
        <span id="actions"></span>
      </header>
      <main class="view" id="view"></main>
    </div>
  </div>
  <datalist id="anchors">${ANCHORS.map(a => `<option value="${a}">`).join('')}</datalist>`;
  $('#shell').addEventListener('click', e => {
    const n = e.target.closest('[data-nav]');
    if (n) { e.preventDefault(); go(n.dataset.nav); $('#shell').classList.remove('nav-open'); }
  });
  $('#menuToggle').onclick = () => $('#shell').classList.toggle('nav-open');
  $('#logoutBtn').onclick = () => logout();
  const view = $('#view');
  view.addEventListener('input', onFieldInput);
  view.addEventListener('change', e => { if (e.target.matches('select,[type=checkbox]')) onFieldInput(e); });
  view.addEventListener('click', e => { onFieldClick(e); onViewClick(e); });
  $('#actions').addEventListener('click', e => {
    if (e.target.closest('[data-act=preview]')) preview();
    if (e.target.closest('[data-act=save]')) saveDraft().then(render);
    if (e.target.closest('[data-act=publish]')) publish().then(render);
  });
}
function go(view) {
  S.view = view; S.errors = S.errors || [];
  location.hash = view;
  render(); scrollTo(0, 0);
}
function setBusy(t) { S.busy = t; renderStatus(); }
function renderStatus() {
  const st = $('#status'); if (!st) return;
  let html;
  if (S.busy) html = `<span class="pill busy">${esc(S.busy)}</span>`;
  else if (isDirty()) html = '<span class="pill warn">Có thay đổi chưa lưu</span>';
  else if (isPending()) html = '<span class="pill warn">Bản nháp chưa publish</span>';
  else if (S.deploy === 'building') html = '<span class="pill busy">Đang triển khai lên website…</span>';
  else if (S.deploy === 'slow') html = '<span class="pill warn">Website chưa cập nhật — kiểm tra lại sau ít phút</span>';
  else html = '<span class="pill ok">Đã publish · website đang hiển thị bản này</span>';
  st.innerHTML = html;
  const n = S.draft ? changes(S.draft, S.published).length : 0;
  const pc = $('#pendingCount'); if (pc) { pc.hidden = !n; pc.textContent = n; }
  const showActs = ['dashboard', 'landing', 'settings', 'seo'].includes(S.view);
  $('#actions').innerHTML = showActs ? `<span style="display:inline-flex;gap:8px">
      <button class="btn" data-act="preview">Xem trước</button>
      <button class="btn" data-act="save"${S.busy ? ' disabled' : ''}>Lưu nháp</button>
      <button class="btn btn-primary" data-act="publish"${S.busy || !isPending() && !isDirty() ? ' disabled' : ''}>Publish</button></span>` : '';
}
function render() {
  if (!S.user) return;
  $$('[data-nav]').forEach(b => b.tagName === 'BUTTON' && (b.getAttribute('data-nav') === S.view ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current')));
  $('#viewTitle').textContent = TITLES[S.view];
  document.title = `${TITLES[S.view]} — Rabbit Tarot CMS`;
  const v = $('#view');
  const errs = S.errors && S.errors.length ? `<div class="errors" role="alert"><b>Cần sửa trước khi publish:</b><ul>${S.errors.slice(0, 12).map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : '';
  v.innerHTML = errs + ({dashboard: viewDashboard, landing: viewLanding, media: viewMedia, settings: viewSettings, seo: viewSeo, history: viewHistory}[S.view])();
  renderStatus();
  if (S.view === 'landing') bindDrag();
  if (S.view === 'seo') renderSeoPreview();
  if (S.view === 'history' && !S.history) loadHistory();
  if (S.view === 'dashboard' && !S.history) loadHistory();
}

function viewDashboard() {
  const secs = S.draft.sections || [];
  const visible = secs.filter(s => s.visible !== false).length;
  const items = secs.reduce((n, s) => n + ['items', 'notes', 'steps'].reduce((m, k) => m + ((s.data || {})[k] || []).length, 0), 0);
  const mediaSize = S.media.items.reduce((n, m) => n + (m.size || 0), 0);
  const ch = changes(S.draft, S.published);
  const lastPub = S.history && S.history.published[0];
  const lastDraft = S.history && S.history.drafts[0];
  const days = keyDaysLeft();
  return `${days != null && days <= 21 ? `<div class="notice">Khoá GitHub dùng cho mã truy cập ${days > 0 ? `sẽ hết hạn sau ${days} ngày` : 'đã hết hạn'}. Hãy tạo khoá mới rồi chọn “Thiết lập lại mã” ở màn hình đăng nhập.</div>` : ''}<div class="stats">
      <div class="panel stat"><span class="label-s">Section</span><b>${secs.length}</b><small>${visible} đang hiển thị</small></div>
      <div class="panel stat"><span class="label-s">Mục nội dung</span><b>${items}</b><small>gói, reader, câu hỏi, ghi chú…</small></div>
      <div class="panel stat"><span class="label-s">Thư viện ảnh</span><b>${S.media.items.length}</b><small>${fmtBytes(mediaSize)}</small></div>
      <div class="panel stat"><span class="label-s">Chờ xuất bản</span><b>${ch.length}</b><small>${isDirty() ? 'có thay đổi chưa lưu' : ch.length ? 'thay đổi trong bản nháp' : 'đã đồng bộ với website'}</small></div>
    </div>
    <div class="grid-2">
      <section class="panel"><div class="panel-head"><h2>Nội dung chờ xuất bản</h2>${ch.length ? '<button class="btn btn-sm" data-act-dash="preview">Xem trước</button>' : ''}</div>
        ${ch.length ? `<ul class="rows">${ch.map(c => `<li><span class="grow">${esc(c)}</span></li>`).join('')}</ul>` : '<div class="empty"><b>Không có gì chờ xuất bản</b>Website đang hiển thị đúng bản nháp hiện tại.</div>'}
      </section>
      <section class="panel"><div class="panel-head"><h2>Website</h2><a class="btn btn-sm" href="${CFG.site}" target="_blank" rel="noopener">Mở website</a></div>
        <ul class="rows">
          <li><span class="grow"><b>Lần publish gần nhất</b><small>${lastPub ? `${esc(fmtTime(lastPub.date))} · @${esc(lastPub.login)}` : S.history ? '—' : 'Đang tải…'}</small></span></li>
          <li><span class="grow"><b>Lần lưu nháp gần nhất</b><small>${lastDraft ? `${esc(fmtTime(lastDraft.date))} · @${esc(lastDraft.login)}` : S.history ? 'Chưa có bản nháp riêng' : 'Đang tải…'}</small></span></li>
          <li><span class="grow"><b>Triển khai</b><small>${S.deploy === 'building' ? 'Đang cập nhật website…' : S.deploy === 'slow' ? 'Chậm hơn thường lệ — kiểm tra lại sau ít phút' : 'Website đang chạy bản publish gần nhất'}</small></span></li>
        </ul>
      </section>
    </div>
    <section class="panel" style="margin-top:20px"><div class="panel-head"><h2>Lịch sử chỉnh sửa gần đây</h2><button class="btn btn-sm" data-nav="history">Xem tất cả</button></div>
      ${S.history ? historyRows([...S.history.published.map(h => ({...h, kind: 'pub'})), ...S.history.drafts.map(h => ({...h, kind: 'draft'}))].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 6), false) : '<div class="loading"><span class="spin"></span>Đang tải lịch sử…</div>'}
    </section>`;
}

function viewLanding() {
  const secs = S.draft.sections || [];
  if (S.sel >= secs.length) S.sel = Math.max(0, secs.length - 1);
  const pub = Object.fromEntries((S.published.sections || []).map(s => [s.id, JSON.stringify(s)]));
  const list = secs.map((s, i) => `<li class="sec-item${s.visible === false ? ' is-hidden' : ''}" draggable="true" data-sec="${i}" aria-current="${i === S.sel}">
      <span class="grip" title="Kéo để sắp xếp"><svg viewBox="0 0 10 16"><circle cx="3" cy="3" r="1.3"/><circle cx="7" cy="3" r="1.3"/><circle cx="3" cy="8" r="1.3"/><circle cx="7" cy="8" r="1.3"/><circle cx="3" cy="13" r="1.3"/><circle cx="7" cy="13" r="1.3"/></svg></span>
      <span class="name"><b>${esc(sectionName(s))}</b><small>${esc(TYPES[s.type] ? TYPES[s.type].label : s.type)}${TYPES[s.type] && TYPES[s.type].onlineOnly ? ' · chỉ khi mở đặt online' : ''}</small></span>
      ${pub[s.id] !== JSON.stringify(s) ? '<span class="dot" title="Có thay đổi chưa publish"></span>' : ''}
      <button class="btn btn-icon btn-ghost eye" data-vis="${i}" aria-label="${s.visible === false ? 'Hiện' : 'Ẩn'} section ${esc(sectionName(s))}" title="${s.visible === false ? 'Đang ẩn — bấm để hiện' : 'Đang hiện — bấm để ẩn'}">${svg(s.visible === false ? 'eyeOff' : 'eye')}</button>
    </li>`).join('');
  const s = secs[S.sel];
  return `<div class="lp">
    <section class="panel"><div class="panel-head"><h2>Section</h2><span class="muted small">Kéo để sắp xếp</span></div>
      <ul class="sec-list" id="secList">${list}</ul>
      <div class="sec-actions"><button class="btn btn-sm" data-add-sec>+ Thêm section</button></div>
    </section>
    <section class="panel">${s ? sectionEditor(s, S.sel) : '<div class="empty"><b>Chưa có section</b>Thêm section để bắt đầu.</div>'}</section>
  </div>`;
}
function sectionEditor(s, i) {
  const T = TYPES[s.type];
  if (!T) return `<div class="empty"><b>Loại section không xác định: ${esc(s.type)}</b></div>`;
  const base = ['sections', i];
  const hasAnchor = T.anchor || s.anchor;
  const so = s.showOn || {};
  return `<div class="panel-head"><div><h2>${esc(sectionName(s))}</h2><span class="muted small">${esc(T.label)}${hasAnchor ? ` · neo <span class="mono">#${esc(T.anchor || s.anchor)}</span>` : ''}</span></div>
      <span style="display:flex;gap:6px">
        <button class="btn btn-sm" data-sec-move="-1"${i ? '' : ' disabled'}>↑ Lên</button><button class="btn btn-sm" data-sec-move="1"${i < S.draft.sections.length - 1 ? '' : ' disabled'}>↓ Xuống</button>
        ${T.singleton ? '' : '<button class="btn btn-sm btn-danger" data-sec-del>Xoá</button>'}
      </span></div>
    ${T.onlineOnly ? '<div class="notice" style="margin:16px 18px 0">Section này chỉ hiển thị khi mở đặt lịch online. Hiện website đặt lịch qua Zalo nên khách chưa thấy section này.</div>' : ''}
    <div class="form">
      <div class="form-group"><h3>Hiển thị</h3>
        ${fieldHtml({k: 'visible', t: 'toggle', label: 'Hiện section này trên website'}, s.visible, [...base, 'visible'])}
        <div class="row2">
          <label class="check"><input type="checkbox" data-path="${pathAttr([...base, 'showOn', 'desktop'])}" data-kind="toggle"${so.desktop !== false ? ' checked' : ''}> Hiện trên máy tính</label>
          <label class="check"><input type="checkbox" data-path="${pathAttr([...base, 'showOn', 'mobile'])}" data-kind="toggle"${so.mobile !== false ? ' checked' : ''}> Hiện trên điện thoại</label>
        </div>
        ${T.singleton ? '' : fieldHtml({k: 'title', t: 'text', label: 'Tên nội bộ', help: 'Chỉ hiện trong CMS để dễ nhận biết.', max: 60}, s.title, [...base, 'title'])}
        ${hasAnchor ? fieldHtml({k: 'navLabel', t: 'text', label: 'Tên trên menu', help: 'Để trống nếu không muốn section này xuất hiện trên menu và footer.', max: 30}, s.navLabel, [...base, 'navLabel']) : ''}
      </div>
      <div class="form-group"><h3>Nội dung</h3>
        ${T.fields.map(f => fieldHtml(f, (s.data || {})[f.k], [...base, 'data', f.k])).join('')}
      </div>
    </div>`;
}
let dragFrom = null;
function bindDrag() {
  const list = $('#secList'); if (!list) return;
  list.addEventListener('dragstart', e => { const it = e.target.closest('.sec-item'); if (!it) return; dragFrom = +it.dataset.sec; it.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', it.dataset.sec); });
  list.addEventListener('dragover', e => {
    const it = e.target.closest('.sec-item'); if (!it || dragFrom == null) return;
    e.preventDefault();
    $$('.sec-item', list).forEach(x => x.classList.remove('drop-before', 'drop-after'));
    const r = it.getBoundingClientRect();
    it.classList.add(e.clientY < r.top + r.height / 2 ? 'drop-before' : 'drop-after');
  });
  list.addEventListener('dragend', () => { dragFrom = null; $$('.sec-item', list).forEach(x => x.classList.remove('dragging', 'drop-before', 'drop-after')); });
  list.addEventListener('drop', e => {
    e.preventDefault();
    const it = e.target.closest('.sec-item'); if (!it || dragFrom == null) return;
    let to = +it.dataset.sec + (it.classList.contains('drop-after') ? 1 : 0);
    const arr = S.draft.sections, [m] = arr.splice(dragFrom, 1);
    if (to > dragFrom) to--;
    arr.splice(to, 0, m); S.sel = to; dragFrom = null; rerender();
  });
}
async function onViewClick(e) {
  const t = e.target;
  if (t.closest('[data-act-dash=preview]')) preview();
  if (t.closest('[data-change-code]')) changeCode();
  // landing page
  const vis = t.closest('[data-vis]');
  if (vis) { e.stopPropagation(); const s = S.draft.sections[+vis.dataset.vis]; s.visible = s.visible === false; rerender(); return; }
  const it = t.closest('.sec-item');
  if (it && !t.closest('button')) { S.sel = +it.dataset.sec; rerender(); return; }
  const mv = t.closest('[data-sec-move]');
  if (mv) { const a = S.draft.sections, i = S.sel, j = i + +mv.dataset.secMove; [a[i], a[j]] = [a[j], a[i]]; S.sel = j; rerender(); }
  if (t.closest('[data-sec-del]')) {
    const s = S.draft.sections[S.sel];
    if (await confirmBox('Xoá section?', `Section “${esc(sectionName(s))}” sẽ bị xoá khỏi bản nháp. Website chỉ thay đổi khi bạn publish.`, 'Xoá section', true)) { S.draft.sections.splice(S.sel, 1); S.sel = Math.max(0, S.sel - 1); rerender(); }
  }
  if (t.closest('[data-add-sec]')) addSection();
  // media
  const mc = t.closest('#mediaGrid .m-card');
  if (mc) { S.mediaSel = mc.dataset.p; rerender(); }
  const mf = t.closest('[data-mf]');
  if (mf) { S.mediaFilter = mf.dataset.mf; rerender(); }
  if (t.closest('[data-m-del]')) { const m = S.media.items.find(x => x.path === S.mediaSel); m && deleteMedia(m); }
  if (t.closest('[data-m-save]')) saveMediaMeta();
  if (t.closest('[data-copy]')) { navigator.clipboard?.writeText(t.closest('[data-copy]').dataset.copy).then(() => toast('Đã sao chép đường dẫn.')); }
  // history
  const hv = t.closest('[data-h-view]'), hr = t.closest('[data-h-restore]'), hp = t.closest('[data-h-publish]');
  if (hv || hr || hp) historyAction(hv ? 'view' : hr ? 'restore' : 'publish', (hv || hr || hp).dataset);
  if (t.closest('[data-h-reload]')) { S.history = null; render(); }
}
async function addSection() {
  const present = new Set(S.draft.sections.map(s => s.type));
  const opts = Object.entries(TYPES).filter(([k, T]) => !T.singleton || !present.has(k));
  let chosen = opts[0][0];
  const ok = await modal({
    title: 'Thêm section', ok: 'Thêm',
    body: `<div class="field"><label for="newType">Loại section</label><select id="newType">${opts.map(([k, T]) => `<option value="${k}">${esc(T.label)}</option>`).join('')}</select>
      <p class="help">Section mới được thêm ngay sau section đang chọn và chỉ lên website khi bạn publish.</p></div>`,
    onOpen: d => $('#newType', d).addEventListener('change', e => chosen = e.target.value)
  });
  if (!ok) return;
  const T = TYPES[chosen];
  const id = (T.singleton ? chosen : chosen) + '-' + Math.random().toString(36).slice(2, 6);
  const sec = {id: T.singleton ? chosen : id, type: chosen, visible: true, data: {}};
  if (!T.singleton) { sec.anchor = 'sec-' + id.split('-').pop(); sec.title = T.label; }
  if (chosen === 'text') sec.data = {heading: 'Tiêu đề mới', layout: 'image-right', tone: 'ivory'};
  S.draft.sections.splice(S.sel + 1, 0, sec);
  S.sel = S.sel + 1; rerender();
  toast('Đã thêm section vào bản nháp.');
}

const SETTINGS_FORM = [
  ['Nhận diện', [
    {k: 'siteTitle', t: 'text', label: 'Tên website', req: true, max: 60},
    {k: 'header.brandName', t: 'text', label: 'Tên thương hiệu trên header', max: 40},
    {k: 'header.logo', t: 'image', label: 'Logo', help: 'Ảnh vuông, nền trong suốt. Khoảng 144 × 144 px.'},
    {k: 'favicon', t: 'image', label: 'Favicon', help: 'Ảnh vuông PNG, ít nhất 48 × 48 px.'}]],
  ['Nút trên header', [
    {k: 'header.ctaLabel', t: 'text', label: 'Chữ trên nút (máy tính)', max: 30},
    {k: 'header.ctaLabelMobile', t: 'text', label: 'Chữ trên nút (menu điện thoại)', max: 30},
    {k: 'header.ctaHref', t: 'url', label: 'Liên kết của nút', help: 'Mặc định #zalo — mở phần chọn reader.'}]],
  ['Footer', [
    {k: 'footer.tagline', t: 'textarea', label: 'Giới thiệu ngắn', max: 200},
    {k: 'footer.hoursTitle', t: 'text', label: 'Tiêu đề cột giờ nhận lịch', max: 40},
    {k: 'footer.hours', t: 'strings', label: 'Giờ nhận lịch', max: 60},
    {k: 'footer.showZalo', t: 'toggle', label: 'Hiện liên kết Zalo của các reader'},
    {k: 'footer.pagesTitle', t: 'text', label: 'Tiêu đề cột liên kết trang', max: 40},
    {k: 'footer.copyright', t: 'text', label: 'Bản quyền', max: 80},
    {k: 'footer.disclaimer', t: 'text', label: 'Lưu ý cuối trang', max: 200}]],
  ['Thông tin liên hệ', [
    {k: 'footer.contact.phone', t: 'text', label: 'Số điện thoại', pattern: '^[0-9+ .]{0,16}$', max: 16},
    {k: 'footer.contact.email', t: 'text', label: 'Email', pattern: '^$|^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$', max: 80},
    {k: 'footer.contact.address', t: 'text', label: 'Địa chỉ studio', max: 160}]],
  ['Mạng xã hội', [
    {k: 'footer.socialTitle', t: 'text', label: 'Tiêu đề cột', max: 40},
    {k: 'footer.social', t: 'list', label: 'Liên kết', item: [{k: 'label', t: 'text', label: 'Tên (Facebook, TikTok…)', req: true, max: 30}, {k: 'href', t: 'url', label: 'Đường dẫn https://', req: true}]}]]
];
const SEO_FORM = [
  ['Tìm kiếm (Google)', [
    {k: 'seo.title', t: 'text', label: 'Meta title', req: true, max: 70, help: 'Nên dưới 60 ký tự.'},
    {k: 'seo.description', t: 'textarea', label: 'Meta description', max: 200, help: 'Nên 120–160 ký tự.'},
    {k: 'seo.canonical', t: 'url', label: 'Canonical URL', help: 'Địa chỉ chính thức của trang, ví dụ https://rabbittarot.io.vn/'}]],
  ['Chia sẻ (Zalo, Facebook — Open Graph)', [
    {k: 'seo.ogTitle', t: 'text', label: 'OG title', max: 90, help: 'Để trống sẽ dùng Meta title.'},
    {k: 'seo.ogDescription', t: 'textarea', label: 'OG description', max: 200, help: 'Để trống sẽ dùng Meta description.'},
    {k: 'seo.ogImage', t: 'image', label: 'Ảnh chia sẻ (OG image)', help: 'Khuyên dùng 1200 × 630 px, JPG hoặc PNG.'}]]
];
const settingsForm = groups => `<div class="panel form">${groups.map(([title, fields]) => `<div class="form-group"><h3>${esc(title)}</h3>${fields.map(f => {
  const path = ['settings', ...f.k.split('.')];
  return fieldHtml(f, getAt(S.draft, path), path);
}).join('')}</div>`).join('')}</div>`;
function viewSettings() {
  const days = keyDaysLeft();
  return `<p class="muted" style="margin-bottom:16px">Thay đổi ở đây nằm trong bản nháp và chỉ lên website khi bạn publish. Màu sắc, font và cấu hình kỹ thuật không chỉnh được từ CMS để giữ nhận diện thương hiệu.</p>${settingsForm(SETTINGS_FORM)}
    <section class="panel" style="margin-top:20px"><div class="panel-head"><h2>Đăng nhập CMS</h2><button class="btn btn-sm" data-change-code>${S.accessBox ? 'Đổi mã truy cập' : 'Tạo mã truy cập'}</button></div>
      <div class="panel-body"><p>${S.accessBox ? `Đăng nhập bằng mã truy cập đang bật. ${days != null ? `Khoá GitHub hết hạn ngày <b>${esc(fmtTime((S.accessBox.expires) + 'T12:00:00').slice(0, 10))}</b> (còn ${days} ngày).` : ''}` : 'Chưa có mã truy cập; đang dùng đăng nhập GitHub.'}</p>
      <p class="help" style="margin-top:6px">Đổi mã không làm mất nội dung. Khi khoá GitHub sắp hết hạn, tạo khoá mới rồi chọn “Thiết lập lại mã” ở màn hình đăng nhập.</p></div></section>`;
}
function viewSeo() {
  return `<div class="grid-2"><div>${settingsForm(SEO_FORM)}</div>
    <div style="display:grid;gap:20px;align-content:start">
      <section class="panel"><div class="panel-head"><h2>Xem trước trên Google</h2></div><div class="panel-body" id="serp"></div></section>
      <section class="panel"><div class="panel-head"><h2>Xem trước khi chia sẻ link</h2></div><div class="panel-body" id="share"></div></section>
    </div></div>`;
}
function renderSeoPreview() {
  const st = S.draft.settings || {}, seo = st.seo || {};
  const url = (seo.canonical || CFG.site).replace(/^https?:\/\//, '');
  const serp = $('#serp'), share = $('#share'); if (!serp) return;
  serp.innerHTML = `<div class="serp"><div class="u">${esc(url)}</div><div class="t">${esc(seo.title || st.siteTitle || '')}</div><div class="d">${esc(seo.description || '')}</div></div>
    <p class="help" style="margin-top:8px">Tiêu đề ${(seo.title || '').length}/60 · Mô tả ${(seo.description || '').length}/160 ký tự khuyên dùng.</p>`;
  share.innerHTML = `<div class="share">${seo.ogImage ? `<img class="img" src="${esc(mediaUrl(seo.ogImage))}" alt="">` : '<div class="img"></div>'}
    <div class="txt"><small>${esc(url.split('/')[0])}</small><b>${esc(seo.ogTitle || seo.title || '')}</b><span class="muted">${esc(seo.ogDescription || seo.description || '')}</span></div></div>`;
}

function viewMedia() {
  const q = S.mediaQuery.toLowerCase();
  const items = S.media.items.filter(m => (S.mediaFilter === 'all' || m.category === S.mediaFilter) && (!q || (m.name + ' ' + m.path).toLowerCase().includes(q)));
  const sel = S.media.items.find(m => m.path === S.mediaSel);
  const counts = c => S.media.items.filter(m => c === 'all' || m.category === c).length;
  return `<label class="dropzone" id="dropzone"><input type="file" id="mediaUpload" accept="image/png,image/jpeg,image/webp,image/svg+xml" multiple hidden>
      <b>Kéo thả ảnh vào đây hoặc bấm để chọn</b><span class="small">PNG, JPG, WebP, SVG · tối đa ${fmtBytes(MAX_UPLOAD)} mỗi ảnh · ảnh lớn được thu về tối đa ${MAX_EDGE}px và nén sang WebP</span>
      <span class="small">Nhóm cho ảnh tải lên: <select id="upCat" class="input" style="width:auto;min-height:28px;padding:2px 6px">${CATEGORIES.map(c => `<option${c === (S.mediaFilter === 'all' ? 'Other' : S.mediaFilter) ? ' selected' : ''}>${c}</option>`).join('')}</select></span></label>
    <div class="uploads" id="uploadRows"></div>
    <div class="toolbar"><input class="input" type="search" id="mediaSearch" placeholder="Tìm theo tên hoặc đường dẫn…" value="${esc(S.mediaQuery)}" aria-label="Tìm ảnh">
      <div class="chips">${['all', ...CATEGORIES].map(c => `<button class="chip" data-mf="${esc(c)}" aria-pressed="${S.mediaFilter === c}">${c === 'all' ? 'Tất cả' : esc(c)} · ${counts(c)}</button>`).join('')}</div></div>
    <div class="media-wrap">
      <div class="media-grid" id="mediaGrid">${items.length ? items.map(m => `<button type="button" class="m-card" data-p="${esc(m.path)}" aria-pressed="${m.path === S.mediaSel}">
          <div class="im"><img src="${esc(mediaUrl(m.path))}" alt="" loading="lazy"></div>
          <div class="cap"><b>${esc(m.name)}</b><small>${esc(m.category)} · ${fmtBytes(m.size || 0)}</small></div></button>`).join('')
        : `<div class="empty" style="grid-column:1/-1"><b>${S.media.items.length ? 'Không có ảnh phù hợp' : 'Thư viện đang trống'}</b>${S.media.items.length ? 'Thử bộ lọc hoặc từ khoá khác.' : 'Tải ảnh lên để bắt đầu.'}</div>`}</div>
      <aside class="panel detail">${sel ? mediaDetail(sel) : '<div class="empty"><b>Chọn một ảnh</b>để xem chi tiết, đổi tên, thay hoặc xoá.</div>'}</aside>
    </div>`;
}
function mediaDetail(m) {
  const used = usage(m.path);
  return `<div class="preview"><img src="${esc(mediaUrl(m.path))}" alt=""></div>
    <div class="panel-body form" style="gap:14px">
      <div class="field"><label for="mName">Tên</label><input type="text" id="mName" value="${esc(m.name)}" maxlength="80"></div>
      <div class="field"><label for="mCat">Nhóm</label><select id="mCat">${CATEGORIES.map(c => `<option${c === m.category ? ' selected' : ''}>${c}</option>`).join('')}</select></div>
      <div class="field"><label for="mAlt">Mô tả (alt) mặc định</label><input type="text" id="mAlt" value="${esc(m.alt || '')}" maxlength="160"></div>
      <dl class="kv"><dt>Đường dẫn</dt><dd class="mono">${esc(m.path)}</dd><dt>Định dạng</dt><dd>${esc((m.type || '').replace('image/', '').toUpperCase())}</dd>
        <dt>Kích thước</dt><dd>${m.width ? `${m.width} × ${m.height} px` : '—'}</dd><dt>Dung lượng</dt><dd>${fmtBytes(m.size || 0)}</dd>
        <dt>Tải lên</dt><dd>${esc(fmtTime(m.uploaded))}${m.by ? ` · @${esc(m.by)}` : ''}</dd>
        <dt>Đang dùng</dt><dd>${used.length ? used.map(esc).join('<br>') : 'Chưa dùng ở đâu'}</dd></dl>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" data-m-save>Lưu thông tin</button>
        <label class="btn btn-sm">Thay ảnh<input type="file" id="mReplace" accept="image/png,image/jpeg,image/webp,image/svg+xml" hidden></label>
        <button class="btn btn-sm" data-copy="${esc(m.path)}">Sao chép đường dẫn</button>
        <button class="btn btn-sm btn-danger" data-m-del>Xoá</button>
      </div>
    </div>`;
}
async function saveMediaMeta() {
  const media = clone(S.media), m = media.items.find(x => x.path === S.mediaSel);
  if (!m) return;
  const name = $('#mName').value.trim();
  if (!name) { toast('Tên ảnh không được để trống.', 'err'); return; }
  Object.assign(m, {name, category: $('#mCat').value, alt: $('#mAlt').value.trim()});
  setBusy('Đang lưu thông tin ảnh…');
  try { await commitFiles(CFG.main, [{path: P.media, text: pretty(media)}], `CMS: sửa thông tin ảnh ${m.path} (${S.user.login})`); S.media = media; toast('Đã lưu thông tin ảnh.', 'ok'); rerender(); }
  catch (e) { toast('Chưa lưu được: ' + e.message, 'err'); }
  finally { setBusy(''); }
}
document.addEventListener('change', async e => {
  if (e.target.id === 'mediaUpload') { await uploadFiles(e.target.files, $('#upCat').value, $('#uploadRows')); e.target.value = ''; const rows = $('#uploadRows').innerHTML; rerender(); $('#uploadRows').innerHTML = rows; }
  if (e.target.id === 'mReplace') { const m = S.media.items.find(x => x.path === S.mediaSel); if (m && e.target.files[0]) replaceMedia(m, e.target.files[0]); }
});
document.addEventListener('input', e => { if (e.target.id === 'mediaSearch') { S.mediaQuery = e.target.value; const pos = e.target.selectionStart; rerender(); const s = $('#mediaSearch'); s.focus(); s.setSelectionRange(pos, pos); } });
['dragover', 'dragleave', 'drop'].forEach(ev => document.addEventListener(ev, async e => {
  const dz = e.target.closest && e.target.closest('#dropzone'); if (!dz) return;
  e.preventDefault();
  dz.classList.toggle('over', ev === 'dragover');
  if (ev === 'drop' && e.dataTransfer.files.length) { await uploadFiles(e.dataTransfer.files, $('#upCat').value, $('#uploadRows')); const rows = $('#uploadRows').innerHTML; rerender(); $('#uploadRows').innerHTML = rows; }
}));

/* ---------- history ---------- */
async function loadHistory() {
  if (S.historyLoading) return;
  S.historyLoading = true;
  try {
    const list = async (branch, path) => {
      try { return (await gh(`/repos/${REPO}/commits?sha=${branch}&path=${path}&per_page=30`)).map(c => ({sha: c.sha, date: c.commit.author.date, msg: c.commit.message.split('\n')[0], login: c.author ? c.author.login : c.commit.author.name})); }
      catch (e) { if (e.status === 404 || e.status === 409 || e.status === 422) return []; throw e; }
    };
    const [published, drafts] = await Promise.all([list(CFG.main, P.published), (await branchHead(CFG.draftBranch)) ? list(CFG.draftBranch, P.draft) : []]);
    S.history = {published, drafts};
  } catch (e) { S.history = {published: [], drafts: [], error: e.message}; }
  S.historyLoading = false;
  if (['history', 'dashboard'].includes(S.view)) rerender();
}
function historyRows(rows, actions = true) {
  if (!rows.length) return '<div class="empty"><b>Chưa có lịch sử</b>Các lần lưu nháp và publish sẽ hiện ở đây.</div>';
  const cur = S.history.published[0] && S.history.published[0].sha;
  return `<ul class="rows">${rows.map(h => `<li>
      <span class="tag ${h.kind === 'pub' ? 'green' : ''}">${h.kind === 'pub' ? 'Publish' : 'Nháp'}</span>
      <span class="grow"><b>${esc(h.msg.replace(/^CMS: /, ''))}</b><small>${esc(fmtTime(h.date))} · @${esc(h.login)} · <span class="mono">${h.sha.slice(0, 7)}</span>${h.sha === cur ? ' · <b>đang hiển thị</b>' : ''}</small></span>
      ${actions ? `<button class="btn btn-sm" data-h-view data-sha="${h.sha}" data-kind="${h.kind}">Xem trước</button>
        <button class="btn btn-sm" data-h-restore data-sha="${h.sha}" data-kind="${h.kind}">Đưa vào bản nháp</button>
        ${h.kind === 'pub' && h.sha !== cur ? `<button class="btn btn-sm btn-primary" data-h-publish data-sha="${h.sha}" data-kind="pub">Khôi phục & publish</button>` : ''}` : ''}
    </li>`).join('')}</ul>`;
}
function viewHistory() {
  if (!S.history) return '<div class="loading"><span class="spin"></span>Đang tải lịch sử…</div>';
  return `${S.history.error ? `<div class="errors">Không tải được lịch sử: ${esc(S.history.error)} <button class="btn btn-sm" data-h-reload>Thử lại</button></div>` : ''}
    <p class="muted" style="margin-bottom:16px">Mỗi lần publish và lưu nháp là một phiên bản. Khôi phục không xoá phiên bản nào; nó tạo một phiên bản mới từ nội dung cũ.</p>
    <div class="grid-2">
      <section class="panel"><div class="panel-head"><h2>Phiên bản đã publish</h2><button class="btn btn-sm btn-ghost" data-h-reload>Tải lại</button></div>${historyRows(S.history.published.map(h => ({...h, kind: 'pub'})))}</section>
      <section class="panel"><div class="panel-head"><h2>Các lần lưu nháp</h2></div>${historyRows(S.history.drafts.map(h => ({...h, kind: 'draft'})))}</section>
    </div>`;
}
async function historyAction(act, {sha, kind}) {
  setBusy('Đang tải phiên bản…');
  let content;
  try { const f = await readFile(kind === 'pub' ? P.published : P.draft, sha); content = JSON.parse(f.text); }
  catch (e) { toast('Không tải được phiên bản: ' + e.message, 'err'); return; }
  finally { setBusy(''); }
  const when = fmtTime((S.history.published.concat(S.history.drafts).find(h => h.sha === sha) || {}).date);
  if (act === 'view') return preview(content, `Phiên bản ${sha.slice(0, 7)} (${when})`);
  if (act === 'restore') {
    if (isDirty() && !await confirmBox('Thay bản nháp?', 'Bản nháp hiện có thay đổi chưa lưu. Đưa phiên bản cũ vào sẽ thay thế các thay đổi đó.', 'Thay bản nháp', true)) return;
    S.draft = content; S.sel = 0; S.errors = [];
    toast(`Đã đưa phiên bản ${when} vào bản nháp. Bấm Lưu nháp hoặc Publish để áp dụng.`, 'ok');
    go('landing');
  }
  if (act === 'publish') {
    if (isDirty() && !await confirmBox('Bỏ thay đổi chưa lưu?', 'Khôi phục sẽ thay bản nháp hiện tại bằng phiên bản cũ.', 'Tiếp tục', true)) return;
    S.draft = content;
    await publish(S.draft, `Khôi phục phiên bản ${sha.slice(0, 7)} (${when})`);
    render();
  }
}

/* ---------- boot ---------- */
async function boot() {
  $('#app').innerHTML = '<div class="loading" role="status"><span class="spin"></span>Đang tải nội dung…</div>';
  try { await loadContent(); if (S.accessBox === undefined || S.accessBox === null) S.accessBox = await loadAccessBox().catch(() => null); }
  catch (e) {
    $('#app').innerHTML = `<main class="login"><div class="login-card"><h1>Không tải được nội dung</h1><p class="login-err">${esc(e.message)}</p><button class="btn btn-dark" id="retry">Thử lại</button></div></main>`;
    $('#retry').onclick = boot; return;
  }
  shell();
  const h = location.hash.slice(1);
  S.view = TITLES[h] ? h : 'dashboard';
  render();
}
(async () => {
  const s = readSession();
  if (!s) return showLogin();
  S.token = s.token;
  try { await authorize(); saveSession(); await boot(); }
  catch (e) { if (S.token) endSession(e.message); }
})();
addEventListener('hashchange', () => { const h = location.hash.slice(1); if (S.user && TITLES[h] && h !== S.view) go(h); });
