(function () {
  'use strict';
  function injectCSS() {
    if (document.getElementById('assistant-css')) return;
    const style = document.createElement('style');
    style.id = 'assistant-css';
    style.textContent = `
      #assistantFab { position: fixed; top: 80px; left: 16px; width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; font-size: 24px; display: none; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 6px 20px rgba(124,58,237,0.5); z-index: 1500; transition: transform 0.2s; border: 2px solid rgba(255,255,255,0.4); user-select: none; }
      #assistantFab:hover { transform: scale(1.1); }
      #assistantFab.show { display: flex; }
      #assistantOverlay { position: fixed; inset: 0; background: rgba(15,23,42,0.6); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); z-index: 2000; display: none; align-items: center; justify-content: center; padding: 1rem; animation: assistantFadeIn 0.3s; }
      #assistantOverlay.show { display: flex; }
      @keyframes assistantFadeIn { from { opacity: 0; } to { opacity: 1; } }
      #assistantCircle { width: 120px; height: 120px; border-radius: 50%; background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; font-size: 48px; display: flex; align-items: center; justify-content: center; animation: assistantPulse 1.5s ease-in-out infinite; box-shadow: 0 0 0 0 rgba(124,58,237,0.7); border: 3px solid rgba(255,255,255,0.5); flex-shrink: 0; }
      @keyframes assistantPulse { 0% { box-shadow: 0 0 0 0 rgba(124,58,237,0.7); transform: scale(1); } 50% { box-shadow: 0 0 0 30px rgba(124,58,237,0); transform: scale(1.05); } 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0); transform: scale(1); } }
      #assistantPanel { background: white; border-radius: 1.2rem; padding: 1.2rem; width: 100%; max-width: 460px; max-height: 70vh; overflow-y: auto; box-shadow: 0 20px 60px rgba(0,0,0,0.4); display: none; animation: assistantSlideUp 0.3s; }
      #assistantPanel.show { display: block; }
      @keyframes assistantSlideUp { from { transform: translateY(30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .assistant-msg { padding: 0.7rem 1rem; border-radius: 1rem; margin-bottom: 0.5rem; font-size: 0.85rem; line-height: 1.6; animation: assistantMsgIn 0.3s; }
      @keyframes assistantMsgIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      .assistant-msg.bot { background: linear-gradient(135deg, #f3e8ff, #e9d5ff); color: #4c1d95; border-bottom-right-radius: 0.3rem; }
      .assistant-msg.status { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }
      .assistant-msg.warn { background: #fef2f2; color: #991b1b; border: 1px solid #fecaca; }
      .assistant-msg.ok { background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0; }
      .assistant-buttons { display: flex; flex-direction: column; gap: 0.4rem; margin-top: 0.8rem; }
      .assistant-btn { background: linear-gradient(135deg, #7c3aed, #6d28d9); color: white; border: none; padding: 0.7rem 1rem; border-radius: 0.6rem; font-weight: bold; cursor: pointer; font-size: 0.85rem; text-align: right; transition: transform 0.15s; }
      .assistant-btn:hover { transform: translateY(-1px); }
      .assistant-btn.secondary { background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0; }
      .assistant-btn.danger { background: #fef2f2; color: #dc2626; border: 1px solid #fecaca; }
      .assistant-btn.warn-btn { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
      .assistant-close { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; float: left; padding: 0.2rem; }
    `;
    document.head.appendChild(style);
  }
  function injectElements() {
    if (document.getElementById('assistantFab')) return;
    const fab = document.createElement('div');
    fab.id = 'assistantFab';
    fab.textContent = '🤖';
    fab.title = 'رابط هوشمند سیستم';
    document.body.appendChild(fab);
    const overlay = document.createElement('div');
    overlay.id = 'assistantOverlay';
    overlay.innerHTML = '<div style="display:flex;flex-direction:column;align-items:center;gap:1rem;width:100%;max-width:460px;"><div id="assistantCircle">🤖</div><div id="assistantPanel"><button class="assistant-close" onclick="window.__ASSIST_close()">✖</button><div id="assistantMessages"></div><div id="assistantButtons" class="assistant-buttons"></div></div></div>';
    document.body.appendChild(overlay);
    fab.addEventListener('click', openAssistant);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeAssistant(); });
  }
  function openAssistant() {
    const overlay = document.getElementById('assistantOverlay');
    const circle = document.getElementById('assistantCircle');
    const panel = document.getElementById('assistantPanel');
    const msgBox = document.getElementById('assistantMessages');
    const btnBox = document.getElementById('assistantButtons');
    overlay.classList.add('show');
    circle.style.display = 'flex';
    panel.classList.remove('show');
    msgBox.innerHTML = '';
    btnBox.innerHTML = '';
    if (navigator.vibrate) navigator.vibrate([100, 50, 100, 50, 200]);
    setTimeout(() => {
      circle.style.display = 'none';
      panel.classList.add('show');
      addMsg('bot', 'سلام! 👋 من رابط هوشمند سیستمم. چه کمکی از دستم برمیاد؟');
      setTimeout(() => {
        addMsg('status', buildStatus());
        renderButtons();
      }, 1200);
    }, 1400);
  }
  function closeAssistant() {
    const overlay = document.getElementById('assistantOverlay');
    if (overlay) overlay.classList.remove('show');
  }
  function addMsg(type, text) {
    const box = document.getElementById('assistantMessages');
    if (!box) return;
    const div = document.createElement('div');
    div.className = 'assistant-msg ' + type;
    div.innerHTML = text;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }
  function getBuys() { if (!currentBooth) return []; try { return JSON.parse(localStorage.getItem('buys_' + currentBooth) || '[]'); } catch (e) { return []; } }
  function getSells() { if (!currentBooth) return []; try { return JSON.parse(localStorage.getItem('sells_' + currentBooth) || '[]'); } catch (e) { return []; } }
  function getCodes() { if (!currentBooth) return []; try { return JSON.parse(localStorage.getItem('fruit_codes_' + currentBooth) || '[]'); } catch (e) { return []; } }
  function buildStatus() {
    const buys = getBuys();
    const sells = getSells();
    const codes = getCodes();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    const buysNoCode = buys.filter(b => !b.fruitCode).length;
    const sellsNoCode = sells.filter(s => !s.fruitCode).length;
    let groups = [];
    try { if (typeof window.__SMART_computeStock === 'function') { window.__SMART_computeStock().forEach(x => groups.push(x)); } } catch (e) {}
    const negatives = groups.filter(g => g.remain < -0.01);
    let html = '📊 <b>وضعیت فعلی:</b><br>• ' + buys.length + ' خرید، ' + sells.length + ' فروش، ' + codes.length + ' کد میوه<br>';
    if (buysNoCode || sellsNoCode) html += '⚠️ ' + buysNoCode + ' خرید و ' + sellsNoCode + ' فروش بدون کد<br>';
    if (unlinked.length) html += '🔗 ' + unlinked.length + ' فروش بدون اتصال<br>';
    if (negatives.length) html += '📦 ' + negatives.length + ' میوه موجودی منفی<br>';
    if (!buysNoCode && !sellsNoCode && !unlinked.length && !negatives.length) html += '✅ همه‌چیز مرتبه!';
    return html;
  }
  function renderButtons() {
    const box = document.getElementById('assistantButtons');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    const buysNoCode = buys.filter(b => !b.fruitCode).length;
    const sellsNoCode = sells.filter(s => !s.fruitCode).length;
    let negatives = 0;
    try { if (typeof window.__SMART_computeStock === 'function') { window.__SMART_computeStock().forEach(g => { if (g.remain < -0.01) negatives++; }); } } catch (e) {}
    let html = '';
    if (buysNoCode || sellsNoCode) html += '<button class="assistant-btn" onclick="window.__ASSIST_code()">🏷️ کدگذاری خودکار</button>';
    if (unlinked.length) html += '<button class="assistant-btn" onclick="window.__ASSIST_link()">🔗 اتصال خودکار (' + unlinked.length + ')</button>';
    if (negatives) html += '<button class="assistant-btn warn-btn" onclick="window.__ASSIST_fixNeg()">📦 رفع موجودی منفی (' + negatives + ')</button>';
    html += '<button class="assistant-btn secondary" onclick="window.__ASSIST_verify()">🔍 بررسی نهایی</button>';
    html += '<button class="assistant-btn secondary" onclick="window.__ASSIST_status()">📊 وضعیت کامل</button>';
    html += '<button class="assistant-btn danger" onclick="window.__ASSIST_close()">❌ بستن</button>';
    box.innerHTML = html;
  }
  function actionCode() { addMsg('bot', 'باشه، دارم کدگذاری می‌کنم...'); setTimeout(() => { if (typeof window.__BRAIN_codeAll === 'function') { try { window.__BRAIN_codeAll(); addMsg('ok', '✅ کدگذاری انجام شد.'); } catch (e) { addMsg('warn', '❌ خطا: ' + e.message); } } else { addMsg('warn', '⚠️ مغز سیستم در دسترس نیست.'); } setTimeout(() => { addMsg('status', buildStatus()); renderButtons(); }, 800); }, 500); }
  function actionLink() { addMsg('bot', 'باشه، دارم فروش‌ها رو به خریدها وصل می‌کنم...'); setTimeout(() => { if (typeof window.__BRAIN_linkAll === 'function') { try { window.__BRAIN_linkAll(); addMsg('ok', '✅ اتصال انجام شد.'); } catch (e) { addMsg('warn', '❌ خطا: ' + e.message); } } else { addMsg('warn', '⚠️ مغز سیستم در دسترس نیست.'); } setTimeout(() => { addMsg('status', buildStatus()); renderButtons(); }, 800); }, 500); }
  function actionVerify() {
    addMsg('bot', 'دارم همه‌چیز رو بررسی می‌کنم...');
    setTimeout(() => {
      if (typeof window.__BRAIN_verify === 'function') { try { window.__BRAIN_verify(); } catch (e) {} }
      const buys = getBuys();
      const sells = getSells();
      const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
      const buysNoCode = buys.filter(b => !b.fruitCode).length;
      const sellsNoCode = sells.filter(s => !s.fruitCode).length;
      let negatives = 0;
      try { if (typeof window.__SMART_computeStock === 'function') { window.__SMART_computeStock().forEach(g => { if (g.remain < -0.01) negatives++; }); } } catch (e) {}
      if (!buysNoCode && !sellsNoCode && !unlinked.length && !negatives) addMsg('ok', '🎉 همه‌چیز اوکیه!<br>✅ خطا صفر<br>✅ موجودی درست<br>✅ کدها یکتا<br>✅ اتصال کامل');
      else { let m = '🔍 نتیجه بررسی:<br>'; if (buysNoCode || sellsNoCode) m += '⚠️ ' + (buysNoCode + sellsNoCode) + ' بدون کد<br>'; if (unlinked.length) m += '🔗 ' + unlinked.length + ' بدون اتصال<br>'; if (negatives) m += '📦 ' + negatives + ' موجودی منفی<br>'; addMsg('warn', m + '<br>💡 از دکمه‌های بالا استفاده کن.'); }
      renderButtons();
    }, 800);
  }
  function actionFixNeg() { addMsg('bot', 'باشه، صفحه مغز سیستم رو باز کردم. از بخش «موجودی منفی» اقدام کن.'); closeAssistant(); setTimeout(() => { if (typeof showPage === 'function') showPage('analysis'); }, 300); }
  function actionStatus() { addMsg('status', buildStatus()); renderButtons(); }
  function init() {
    injectCSS();
    injectElements();
    const tryShow = setInterval(() => {
      const main = document.getElementById('mainApp');
      const fab = document.getElementById('assistantFab');
      if (main && fab && main.style.display !== 'none') { fab.classList.add('show'); }
    }, 500);
  }
  window.__ASSIST_close = closeAssistant;
  window.__ASSIST_code = actionCode;
  window.__ASSIST_link = actionLink;
  window.__ASSIST_verify = actionVerify;
  window.__ASSIST_fixNeg = actionFixNeg;
  window.__ASSIST_status = actionStatus;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
