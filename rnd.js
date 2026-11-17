(function () {
  'use strict';
  const RND_PASS_KEY = 'rndPassHash';
  const SCRIPTS_KEY = 'rnd_scripts';
  const LS = {
    getRaw(k) { return localStorage.getItem(k); },
    setRaw(k, v) { localStorage.setItem(k, v); },
    getJSON(k, def) { try { return JSON.parse(localStorage.getItem(k) || JSON.stringify(def)); } catch (e) { return def; } },
    setJSON(k, v) { localStorage.setItem(k, JSON.stringify(v)); }
  };
  async function sha256(text) {
    const enc = new TextEncoder().encode(text);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  async function ensureDefaultPass() {
    if (!LS.getRaw(RND_PASS_KEY)) {
      const h = await sha256('rnd1234');
      LS.setRaw(RND_PASS_KEY, h);
    }
  }
  function getScripts() { return LS.getJSON(SCRIPTS_KEY, []); }
  function saveScripts(s) { LS.setJSON(SCRIPTS_KEY, s); }
  function injectCSS() {
    if (document.getElementById('rnd-css')) return;
    const st = document.createElement('style');
    st.id = 'rnd-css';
    st.textContent = `
      #rndOverlay { position: fixed; inset: 0; background: rgba(15,23,42,0.75); backdrop-filter: blur(4px); -webkit-backdrop-filter: blur(4px); z-index: 2500; display: none; align-items: center; justify-content: center; padding: 1rem; }
      #rndOverlay.show { display: flex; }
      #rndPanel { background: white; border-radius: 1rem; width: 100%; max-width: 520px; max-height: 92vh; display: flex; flex-direction: column; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
      .rnd-head { background: linear-gradient(135deg,#0ea5e9,#0369a1); color: white; padding: 0.9rem 1rem; font-weight: bold; font-size: 0.95rem; display: flex; justify-content: space-between; align-items: center; }
      .rnd-head button { background: rgba(255,255,255,0.2); color: white; border: none; padding: 0.3rem 0.6rem; border-radius: 0.4rem; cursor: pointer; font-size: 0.8rem; }
      .rnd-body { padding: 1rem; overflow-y: auto; flex: 1; }
      .rnd-tabs { display: flex; gap: 0.3rem; margin-bottom: 0.8rem; flex-wrap: wrap; }
      .rnd-tab { flex: 1; min-width: 90px; padding: 0.5rem; border: 1px solid #cbd5e1; background: #f8fafc; border-radius: 0.4rem; font-size: 0.75rem; font-weight: bold; color: #475569; cursor: pointer; }
      .rnd-tab.active { background: linear-gradient(135deg,#0ea5e9,#0369a1); color: white; border-color: #0369a1; }
      .rnd-tabContent { display: none; }
      .rnd-tabContent.active { display: block; }
      .rnd-label { font-size: 0.75rem; color: #475569; font-weight: bold; margin: 0.5rem 0 0.25rem 0; display: block; }
      .rnd-input, .rnd-textarea { width: 100%; padding: 0.55rem; border: 1px solid #cbd5e1; border-radius: 0.45rem; font-size: 0.85rem; font-family: inherit; }
      .rnd-textarea { font-family: 'Courier New', monospace; font-size: 0.8rem; min-height: 180px; resize: vertical; direction: ltr; text-align: left; }
      .rnd-btn { padding: 0.55rem 0.9rem; border-radius: 0.45rem; border: none; font-weight: bold; cursor: pointer; font-size: 0.8rem; }
      .rnd-btnPrimary { background: linear-gradient(135deg,#0ea5e9,#0369a1); color: white; }
      .rnd-btnGreen { background: linear-gradient(135deg,#16a34a,#15803d); color: white; }
      .rnd-btnRed { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      .rnd-btnGray { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
      .rnd-console { background: #0f172a; color: #e2e8f0; border-radius: 0.45rem; padding: 0.6rem; font-family: 'Courier New', monospace; font-size: 0.72rem; max-height: 140px; overflow-y: auto; min-height: 60px; direction: ltr; text-align: left; margin-top: 0.5rem; }
      .rnd-console .ok { color: #86efac; }
      .rnd-console .err { color: #fca5a5; }
      .rnd-console .info { color: #93c5fd; }
      .rnd-script { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.5rem 0.6rem; margin-bottom: 0.4rem; font-size: 0.78rem; }
      .rnd-script .title { font-weight: bold; color: #0f172a; margin-bottom: 0.2rem; }
      .rnd-script .meta { color: #64748b; font-size: 0.68rem; }
      .rnd-badge { display: inline-block; padding: 0.1rem 0.35rem; border-radius: 0.3rem; font-size: 0.65rem; font-weight: bold; margin-right: 0.3rem; }
      .rnd-badgePerm { background: #fef3c7; color: #92400e; }
      .rnd-badgeTemp { background: #dbeafe; color: #1e40af; }
      .rnd-badgeActive { background: #dcfce7; color: #166534; }
      .rnd-badgeOff { background: #f1f5f9; color: #64748b; }
      .rnd-actions { display: flex; gap: 0.3rem; flex-wrap: wrap; margin-top: 0.4rem; }
      .rnd-actions .rnd-btn { padding: 0.3rem 0.55rem; font-size: 0.7rem; }
      .rnd-empty { text-align: center; color: #94a3b8; font-size: 0.8rem; padding: 1rem; }
      .rnd-warn { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; padding: 0.5rem; border-radius: 0.4rem; font-size: 0.75rem; margin-bottom: 0.5rem; }
    `;
    document.head.appendChild(st);
  }
  function injectMenu() {
    const menu = document.getElementById('mainMenu');
    if (!menu || document.getElementById('menuRnd')) return;
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.id = 'menuRnd';
    item.textContent = '🔬 تحقیق و توسعه';
    item.onclick = () => { closeMenu(); openRnd(); };
    const logout = menu.querySelector('.logout-item');
    if (logout) menu.insertBefore(item, logout);
    else menu.appendChild(item);
  }
  function openRnd() { showPassModal(); }
  function showPassModal() {
    const old = document.getElementById('rndOverlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'rndOverlay';
    ov.className = 'show';
    ov.innerHTML = '<div id="rndPanel"><div class="rnd-head"><span>🔐 رمز امنیتی R&D</span><button onclick="document.getElementById(\'rndOverlay\').remove()">✖</button></div><div class="rnd-body"><p style="font-size:0.8rem;color:#475569;margin-bottom:0.7rem;">برای ورود به بخش تحقیق و توسعه، رمز امنیتی رو وارد کن.</p><input type="password" id="rndPassInput" class="rnd-input" placeholder="رمز R&D" onkeydown="if(event.key===\'Enter\')window.__RND_tryPass()"><div id="rndPassMsg" style="font-size:0.75rem;color:#dc2626;margin-top:0.4rem;min-height:1rem;"></div><div style="display:flex;gap:0.4rem;margin-top:0.6rem;"><button class="rnd-btn rnd-btnPrimary" style="flex:1;" onclick="window.__RND_tryPass()">🔓 ورود</button><button class="rnd-btn rnd-btnGray" onclick="document.getElementById(\'rndOverlay\').remove()">انصراف</button></div><p style="font-size:0.68rem;color:#94a3b8;margin-top:0.7rem;text-align:center;">رمز پیش‌فرض: <b>rnd1234</b></p></div></div>';
    document.body.appendChild(ov);
    setTimeout(() => { const i = document.getElementById('rndPassInput'); if (i) i.focus(); }, 100);
  }
  async function tryPass() {
    const inp = document.getElementById('rndPassInput');
    const msg = document.getElementById('rndPassMsg');
    if (!inp || !msg) return;
    const h = await sha256(inp.value);
    if (h === LS.getRaw(RND_PASS_KEY)) {
      const ov = document.getElementById('rndOverlay');
      if (ov) ov.remove();
      showRndModal();
    } else {
      msg.textContent = '❌ رمز اشتباهه.';
      inp.value = '';
    }
  }
  function showRndModal() {
    const old = document.getElementById('rndOverlay');
    if (old) old.remove();
    const ov = document.createElement('div');
    ov.id = 'rndOverlay';
    ov.className = 'show';
    ov.innerHTML = '<div id="rndPanel"><div class="rnd-head"><span>🔬 تحقیق و توسعه</span><div><button onclick="window.__RND_changePass()" title="تغییر رمز">🔑</button> <button onclick="document.getElementById(\'rndOverlay\').remove()" title="بستن">✖</button></div></div><div class="rnd-body"><div class="rnd-tabs"><button class="rnd-tab active" data-tab="editor" onclick="window.__RND_switchTab(\'editor\')">✏️ ادیتور</button><button class="rnd-tab" data-tab="scripts" onclick="window.__RND_switchTab(\'scripts\')">📋 اسکریپت‌ها</button><button class="rnd-tab" data-tab="help" onclick="window.__RND_switchTab(\'help\')">❓ راهنما</button></div><div id="rnd-tab-editor" class="rnd-tabContent active"><label class="rnd-label">نام اسکریپت:</label><input type="text" id="rndScriptName" class="rnd-input" placeholder="مثلاً: گزارش سریع سود"><label class="rnd-label">کد (JavaScript):</label><textarea id="rndCodeArea" class="rnd-textarea" placeholder="// کدت رو این‌جا بنویس"></textarea><div style="display:flex;gap:0.3rem;flex-wrap:wrap;margin-top:0.5rem;"><button class="rnd-btn rnd-btnGreen" onclick="window.__RND_runOnce()">▶️ اجرا (بدون ذخیره)</button><button class="rnd-btn rnd-btnPrimary" onclick="window.__RND_saveTemp()">⏱️ ذخیره موقت</button><button class="rnd-btn rnd-btnPrimary" style="background:linear-gradient(135deg,#f59e0b,#d97706);" onclick="window.__RND_savePerm()">🔒 ذخیره دائمی</button><button class="rnd-btn rnd-btnGray" onclick="window.__RND_clearCode()">🗑️ پاک کردن</button></div><div id="rndConsole" class="rnd-console"></div></div><div id="rnd-tab-scripts" class="rnd-tabContent"><p style="font-size:0.75rem;color:#475569;margin-bottom:0.5rem;">اسکریپت‌های ذخیره‌شده:</p><div id="rndScriptsList"></div></div><div id="rnd-tab-help" class="rnd-tabContent"><div style="font-size:0.8rem;color:#334155;line-height:1.8;"><p><b>🔬 تحقیق و توسعه</b> یه محیط اجرای کد داخل خود اپه.</p><p style="margin-top:0.5rem;"><b>⏱️ موقت:</b> یه مدت فعاله، بعد غیرفعال می‌شه.</p><p><b>🔒 دائمی:</b> هر بار اپ باز شد، خودکار اجرا می‌شه.</p><p style="margin-top:0.5rem;"><b>دسترسی‌ها:</b> <code>DB.get(\'buys\')</code>، <code>DB.get(\'sells\')</code>، <code>currentBooth</code>، <code>getAllSells()</code>، <code>getAllBuys()</code>، <code>todayJalali()</code>، <code>fmt()</code>، <code>showDate()</code></p><div class="rnd-warn" style="margin-top:0.6rem;">⚠️ کد اشتباه می‌تونه داده‌ها رو خراب کنه. قبل از آزمایش، بکاپ JSON بگیر.</div></div></div></div></div>';
    document.body.appendChild(ov);
    renderScriptsList();
  }
  function switchTab(name) {
    document.querySelectorAll('.rnd-tab').forEach(b => b.classList.toggle('active', b.dataset.tab === name));
    document.querySelectorAll('.rnd-tabContent').forEach(c => c.classList.toggle('active', c.id === 'rnd-tab-' + name));
    if (name === 'scripts') renderScriptsList();
  }
  function logToConsole(text, type) {
    const c = document.getElementById('rndConsole');
    if (!c) return;
    const line = document.createElement('div');
    line.className = type || 'info';
    line.textContent = '> ' + text;
    c.appendChild(line);
    c.scrollTop = c.scrollHeight;
  }
  function clearCode() {
    const ta = document.getElementById('rndCodeArea');
    if (ta) ta.value = '';
    const nm = document.getElementById('rndScriptName');
    if (nm) nm.value = '';
  }
  function buildConsoleObj() {
    return {
      log: (...a) => logToConsole(a.map(x => typeof x === 'object' ? JSON.stringify(x) : String(x)).join(' '), 'ok'),
      error: (...a) => logToConsole(a.join(' '), 'err'),
      warn: (...a) => logToConsole(a.join(' '), 'err')
    };
  }
  function buildArgs() {
    return [
      buildConsoleObj(),
      typeof DB !== 'undefined' ? DB : null,
      typeof currentBooth !== 'undefined' ? currentBooth : null,
      typeof getAllSells === 'function' ? getAllSells : null,
      typeof getAllBuys === 'function' ? getAllBuys : null,
      typeof todayJalali === 'function' ? todayJalali : null,
      typeof fmt === 'function' ? fmt : null,
      typeof showDate === 'function' ? showDate : null
    ];
  }
  async function runOnce() {
    const ta = document.getElementById('rndCodeArea');
    if (!ta) return;
    const code = ta.value;
    if (!code.trim()) return alert('کد خالیه.');
    const c = document.getElementById('rndConsole');
    if (c) c.innerHTML = '';
    logToConsole('در حال اجرا...', 'info');
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction('console', 'DB', 'currentBooth', 'getAllSells', 'getAllBuys', 'todayJalali', 'fmt', 'showDate', code);
      await fn.apply(null, buildArgs());
      logToConsole('✅ اجرا تمام شد.', 'ok');
    } catch (e) {
      logToConsole('❌ خطا: ' + e.message, 'err');
    }
  }
  function saveScript(type) {
    const ta = document.getElementById('rndCodeArea');
    const nm = document.getElementById('rndScriptName');
    if (!ta || !nm) return;
    const code = ta.value.trim();
    const name = nm.value.trim();
    if (!code) return alert('کد خالیه.');
    if (!name) return alert('اسم اسکریپت رو بنویس.');
    let expiresAt = null;
    if (type === 'temporary') {
      const opt = prompt('مدت اعتبار:\n1 = ۱ ساعت\n2 = ۶ ساعت\n3 = ۱ روز\n4 = ۱ هفته\n5 = ۱ ماه', '3');
      if (opt === null) return;
      const map = { '1': 3600000, '2': 6 * 3600000, '3': 86400000, '4': 7 * 86400000, '5': 30 * 86400000 };
      const dur = map[opt] || 86400000;
      expiresAt = Date.now() + dur;
    } else {
      if (!confirm('⚠️ اسکریپت دائمی هر بار اپ باز شد، خودکار اجرا می‌شه. مطمئنی؟')) return;
    }
    const scripts = getScripts();
    scripts.push({ id: 's_' + Date.now(), name, code, type, expiresAt, active: true, createdAt: Date.now() });
    saveScripts(scripts);
    alert('✅ اسکریپت ذخیره شد.');
    nm.value = '';
    renderScriptsList();
  }
  function renderScriptsList() {
    const box = document.getElementById('rndScriptsList');
    if (!box) return;
    const scripts = getScripts();
    if (!scripts.length) {
      box.innerHTML = '<div class="rnd-empty">هنوز اسکریپتی ذخیره نکردی.</div>';
      return;
    }
    box.innerHTML = scripts.map(s => {
      const isTemp = s.type === 'temporary';
      const expired = isTemp && s.expiresAt && Date.now() > s.expiresAt;
      const badgeType = isTemp ? '<span class="rnd-badge rnd-badgeTemp">⏱️ موقت</span>' : '<span class="rnd-badge rnd-badgePerm">🔒 دائمی</span>';
      const badgeActive = s.active ? (expired ? '<span class="rnd-badge rnd-badgeOff">⏰ منقضی</span>' : '<span class="rnd-badge rnd-badgeActive">✅ فعال</span>') : '<span class="rnd-badge rnd-badgeOff">⏸️ غیرفعال</span>';
      const expiresInfo = isTemp && s.expiresAt ? '<div class="meta">انقضا: ' + new Date(s.expiresAt).toLocaleString('fa-IR') + '</div>' : '';
      const canDelete = !s.active || s.type === 'temporary';
      return '<div class="rnd-script"><div class="title">' + s.name + ' ' + badgeType + badgeActive + '</div><div class="meta">' + s.code.length + ' کاراکتر</div>' + expiresInfo + '<div class="rnd-actions"><button class="rnd-btn rnd-btnGreen" onclick="window.__RND_runScript(\'' + s.id + '\')">▶️ اجرا</button><button class="rnd-btn rnd-btnGray" onclick="window.__RND_toggleScript(\'' + s.id + '\')">' + (s.active ? '⏸️ غیرفعال' : '✅ فعال') + '</button>' + (canDelete ? '<button class="rnd-btn rnd-btnRed" onclick="window.__RND_deleteScript(\'' + s.id + '\')">🗑️ حذف</button>' : '<button class="rnd-btn rnd-btnRed" onclick="window.__RND_deletePerm(\'' + s.id + '\')">🔐 حذف (رمز)</button>') + '</div></div>';
    }).join('');
  }
  async function runScriptById(id) {
    const s = getScripts().find(x => x.id === id);
    if (!s) return;
    const c = document.getElementById('rndConsole');
    if (c) c.innerHTML = '';
    switchTab('editor');
    logToConsole('اجرای: ' + s.name, 'info');
    try {
      const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
      const fn = new AsyncFunction('console', 'DB', 'currentBooth', 'getAllSells', 'getAllBuys', 'todayJalali', 'fmt', 'showDate', s.code);
      await fn.apply(null, buildArgs());
      logToConsole('✅ اجرا تمام شد.', 'ok');
    } catch (e) {
      logToConsole('❌ خطا: ' + e.message, 'err');
    }
  }
  function toggleScript(id) {
    const scripts = getScripts();
    const s = scripts.find(x => x.id === id);
    if (!s) return;
    s.active = !s.active;
    saveScripts(scripts);
    renderScriptsList();
  }
  function deleteScript(id) {
    if (!confirm('این اسکریپت حذف بشه؟')) return;
    saveScripts(getScripts().filter(x => x.id !== id));
    renderScriptsList();
  }
  async function deletePerm(id) {
    const pass = prompt('برای حذف اسکریپت دائمی، رمز R&D رو بزن:');
    if (pass === null) return;
    const h = await sha256(pass);
    if (h !== LS.getRaw(RND_PASS_KEY)) return alert('❌ رمز اشتباهه.');
    if (!confirm('اسکریپت دائمی حذف بشه؟')) return;
    saveScripts(getScripts().filter(x => x.id !== id));
    renderScriptsList();
  }
  async function changePass() {
    const oldP = prompt('رمز فعلی R&D:');
    if (oldP === null) return;
    const oldH = await sha256(oldP);
    if (oldH !== LS.getRaw(RND_PASS_KEY)) return alert('❌ رمز اشتباهه.');
    const newP = prompt('رمز جدید (حداقل ۴ کاراکتر):');
    if (newP === null) return;
    if (newP.length < 4) return alert('رمز خیلی کوتاهه.');
    const newP2 = prompt('رمز جدید رو دوباره بزن:');
    if (newP2 !== newP) return alert('رمزها یکی نیستن.');
    const newH = await sha256(newP);
    LS.setRaw(RND_PASS_KEY, newH);
    alert('✅ رمز R&D عوض شد.');
  }
  async function runAutoScripts() {
    if (!currentBooth) return;
    const scripts = getScripts();
    if (!scripts.length) return;
    const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
    for (const s of scripts) {
      if (!s.active) continue;
      if (s.type === 'temporary' && s.expiresAt && Date.now() > s.expiresAt) continue;
      try {
        const fn = new AsyncFunction('console', 'DB', 'currentBooth', 'getAllSells', 'getAllBuys', 'todayJalali', 'fmt', 'showDate', s.code);
        await fn({ log: () => {}, error: (...a) => console.error('[R&D:' + s.name + ']', ...a), warn: (...a) => console.warn('[R&D:' + s.name + ']', ...a) }, typeof DB !== 'undefined' ? DB : null, currentBooth, typeof getAllSells === 'function' ? getAllSells : null, typeof getAllBuys === 'function' ? getAllBuys : null, typeof todayJalali === 'function' ? todayJalali : null, typeof fmt === 'function' ? fmt : null, typeof showDate === 'function' ? showDate : null);
        console.log('[R&D] اجرا شد: ' + s.name);
      } catch (e) {
        console.error('[R&D:' + s.name + ']', e.message);
      }
    }
  }
  async function init() {
    injectCSS();
    await ensureDefaultPass();
    const t = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') injectMenu();
    }, 500);
    const t2 = setInterval(() => {
      if (typeof currentBooth !== 'undefined' && currentBooth) {
        clearInterval(t2);
        runAutoScripts();
      }
    }, 800);
  }
  window.__RND_tryPass = tryPass;
  window.__RND_switchTab = switchTab;
  window.__RND_runOnce = runOnce;
  window.__RND_saveTemp = () => saveScript('temporary');
  window.__RND_savePerm = () => saveScript('permanent');
  window.__RND_clearCode = clearCode;
  window.__RND_runScript = runScriptById;
  window.__RND_toggleScript = toggleScript;
  window.__RND_deleteScript = deleteScript;
  window.__RND_deletePerm = deletePerm;
  window.__RND_changePass = changePass;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
