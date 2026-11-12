(function () {
  'use strict';
  const LS = {
    get(key) { if (!currentBooth) return []; try { return JSON.parse(localStorage.getItem(key + '_' + currentBooth) || '[]'); } catch (e) { return []; } },
    set(key, val) { if (!currentBooth) return; localStorage.setItem(key + '_' + currentBooth, JSON.stringify(val)); }
  };
  const safeFmt = (n) => (typeof fmt === 'function' ? fmt(n) : String(Math.round(n)));
  const safeShowDate = (d) => (typeof showDate === 'function' ? showDate(d) : (d || ''));
  const safeNormalize = (n) => (typeof normalizeName === 'function' ? normalizeName(n) : n);
  function getFruitCodes() { return LS.get('fruit_codes'); }
  function saveFruitCodes(arr) { LS.set('fruit_codes', arr); }
  function getBuys() { return LS.get('buys'); }
  function getSells() { return LS.get('sells'); }
  function saveBuys(a) { LS.set('buys', a); }
  function saveSells(a) { LS.set('sells', a); }
  function getSupplies() { return LS.get('supplies') || []; }
  function saveSupplies(a) { LS.set('supplies', a); }
  function generateNewCode(existingCodes) {
    const codes = existingCodes || getFruitCodes();
    if (!codes.length) return '101';
    const nums = codes.map(c => parseInt(c.code) || 0).filter(n => n > 0);
    const max = nums.length ? Math.max(...nums) : 100;
    return String(max + 1);
  }
  function similarity(a, b) {
    a = safeNormalize(a).replace(/\s+/g, ' ').trim();
    b = safeNormalize(b).replace(/\s+/g, ' ').trim();
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.85;
    const m = a.length, n = b.length;
    if (!m || !n) return 0;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) for (let j = 1; j <= n; j++) dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    return 1 - dp[m][n] / Math.max(m, n);
  }
  function getStockData() {
    if (typeof window.__SMART_computeStock !== 'function') return [];
    const groups = window.__SMART_computeStock();
    const arr = []; groups.forEach(g => { arr.push(g); });
    return arr;
  }
  function injectBrainIntoAnalysis() {
    const analysis = document.getElementById('analysis');
    if (!analysis) return;
    const tabs = analysis.querySelector('.tabs');
    if (tabs) {
      const btns = tabs.querySelectorAll('.tab-btn');
      if (btns[1]) { btns[1].textContent = '🩺 عیب‌یابی'; btns[1].setAttribute('onclick', "switchAnalysisTab('brain', this)"); }
    }
    let tab = document.getElementById('analysisBrainTab');
    if (!tab) {
      tab = document.createElement('div');
      tab.id = 'analysisBrainTab';
      tab.style.marginTop = '1rem';
      tab.innerHTML = '<div id="brainMain"></div>';
      const chartTab = document.getElementById('analysisChartTab');
      if (chartTab) chartTab.parentNode.insertBefore(tab, chartTab);
      else tabs.parentNode.insertBefore(tab, tabs.nextSibling);
    }
    tab.style.display = 'none';
  }
  function renderBrainPage() {
    const box = document.getElementById('brainMain');
    if (!box) return;
    const buys = getBuys(); const sells = getSells(); const codes = getFruitCodes();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    const buysNoCode = buys.filter(b => !b.fruitCode).length;
    const sellsNoCode = sells.filter(s => !s.fruitCode).length;
    const groups = getStockData();
    const negativeGroups = groups.filter(g => g.remain < -0.01);
    let html = '<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:1.2rem;border-radius:1rem;margin-bottom:1rem;"><h2 style="font-size:1.1rem;margin-bottom:0.3rem;">🩺 عیب‌یابی هوشمند</h2><p style="font-size:0.8rem;opacity:0.9;">دستیار شما — کدگذاری، اتصال، بررسی نهایی، ادغام کدها</p></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem;">';
    html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#166534;">' + buys.length + '</div><div style="font-size:0.7rem;color:#166534;">خرید</div></div>';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#1e40af;">' + sells.length + '</div><div style="font-size:0.7rem;color:#1e40af;">فروش</div></div>';
    html += '<div style="background:#fef3c7;border:1px solid #fde68a;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#92400e;">' + codes.length + '</div><div style="font-size:0.7rem;color:#92400e;">کد میوه</div></div>';
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#991b1b;">' + unlinked.length + '</div><div style="font-size:0.7rem;color:#991b1b;">بدون اتصال</div></div>';
    html += '</div>';
    const needsCoding = (buysNoCode > 0 || sellsNoCode > 0);
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">۱️⃣ مرحله کدگذاری</h3>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:0.7rem;">' + (needsCoding ? '📊 ' + buysNoCode + ' خرید و ' + sellsNoCode + ' فروش بدون کد.' : '✅ همه کد دارن.') + '</p>';
    html += '<button onclick="window.__BRAIN_codeAll()" style="width:100%;background:' + (needsCoding ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#e2e8f0') + ';color:' + (needsCoding ? 'white' : '#94a3b8') + ';border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:' + (needsCoding ? 'pointer' : 'not-allowed') + ';font-size:0.85rem;" ' + (needsCoding ? '' : 'disabled') + '>🏷️ کدگذاری خودکار</button></div>';
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">۲️⃣ مرحله اتصال</h3>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:0.7rem;">' + (unlinked.length ? '📊 ' + unlinked.length + ' فروش بدون اتصال.' : '✅ همه متصل هستن.') + '</p>';
    html += '<button onclick="window.__BRAIN_linkAll()" style="width:100%;background:' + (unlinked.length ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#e2e8f0') + ';color:' + (unlinked.length ? 'white' : '#94a3b8') + ';border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:' + (unlinked.length ? 'pointer' : 'not-allowed') + ';font-size:0.85rem;" ' + (unlinked.length ? '' : 'disabled') + '>🔗 اتصال خودکار (FIFO)</button></div>';
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">۳️⃣ بررسی نهایی</h3>';
    html += '<button onclick="window.__BRAIN_verify()" style="width:100%;background:linear-gradient(135deg,#0891b2,#0e7490);color:white;border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">🔍 بررسی نهایی</button></div>';
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">🔀 ادغام کدها</h3>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:0.7rem;">اگه دو میوه با اسم‌های مختلف دو کد جداگانه دارن ولی یکی‌ان، این‌جا ادغامشون کن.</p>';
    html += '<button onclick="window.__BRAIN_openMerge()" style="width:100%;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">🔀 ادغام دو کد</button></div>';
    if (negativeGroups.length) {
      html += '<div style="background:#fef2f2;padding:1rem;border-radius:1rem;border:1px solid #fecaca;margin-bottom:1rem;">';
      html += '<h3 style="color:#991b1b;font-size:0.9rem;margin-bottom:0.5rem;">⚠️ ' + negativeGroups.length + ' میوه موجودی منفی</h3>';
      negativeGroups.forEach(g => {
        const supplies = getSupplies();
        const alreadySupplied = supplies.some(s => safeNormalize(s.fruit) === safeNormalize(g.name) && s.reason === 'موجودی از قبل');
        html += '<div style="background:white;padding:0.6rem;border-radius:0.5rem;margin-bottom:0.4rem;border:1px solid #fecaca;">';
        html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.4rem;"><b style="color:#991b1b;font-size:0.8rem;">' + g.name + ' ' + (g.code ? '(کد ' + g.code + ')' : '') + '</b><span style="color:#dc2626;font-weight:bold;font-size:0.8rem;">' + safeFmt(Math.abs(g.remain)) + ' کیلو منفی</span></div>';
        if (alreadySupplied) {
          html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.4rem;border-radius:0.4rem;font-size:0.72rem;color:#166534;">✅ قبلاً تأمین بار ثبت شده. اگه بازم منفی نشون می‌ده، احتمالاً داده‌ها مشکل دارن.</div>';
        } else {
          html += '<div style="display:flex;gap:0.3rem;flex-wrap:wrap;"><button onclick="window.__BRAIN_resolveNeg(\'' + g.key.replace(/'/g, "\\'") + '\', \'prev\')" style="background:#0ea5e9;color:white;border:none;padding:0.35rem 0.6rem;border-radius:0.4rem;font-size:0.7rem;font-weight:bold;cursor:pointer;">📦 از بار قبلی</button>';
          html += '<button onclick="window.__BRAIN_resolveNeg(\'' + g.key.replace(/'/g, "\\'") + '\', \'error\')" style="background:#f59e0b;color:white;border:none;padding:0.35rem 0.6rem;border-radius:0.4rem;font-size:0.7rem;font-weight:bold;cursor:pointer;">🔧 خطای ثبت</button>';
          html += '<button onclick="window.__BRAIN_resolveNeg(\'' + g.key.replace(/'/g, "\\'") + '\', \'skip\')" style="background:#e2e8f0;color:#475569;border:none;padding:0.35rem 0.6rem;border-radius:0.4rem;font-size:0.7rem;font-weight:bold;cursor:pointer;">⏭️ رد کن</button></div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }
    if (codes.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;"><h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">📋 کدهای فعلی (' + codes.length + ')</h3><div style="max-height:300px;overflow-y:auto;font-size:0.8rem;">';
      codes.forEach((c, idx) => {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem;border-bottom:1px dashed #e2e8f0;gap:0.3rem;"><span style="flex:1;">' + c.name + '</span><span style="color:#7c3aed;font-weight:bold;margin-left:0.3rem;">کد ' + c.code + '</span><button onclick="window.__BRAIN_editCode(' + idx + ')" style="background:#eff6ff;color:#1e40af;border:none;padding:0.2rem 0.4rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;">✏️</button><button onclick="window.__BRAIN_deleteCode(' + idx + ')" style="background:#fef2f2;color:#dc2626;border:none;padding:0.2rem 0.4rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;">🗑️</button></div>';
      });
      html += '</div></div>';
    }
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;"><h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">➕ افزودن کد جدید</h3><div style="display:flex;gap:0.3rem;"><input type="text" id="brainNewCode" placeholder="کد" style="flex:1;padding:0.5rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.85rem;"><input type="text" id="brainNewName" placeholder="نام میوه" style="flex:2;padding:0.5rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.85rem;"><button onclick="window.__BRAIN_addCode()" style="background:linear-gradient(135deg,#16a34a,#15803d);color:white;border:none;padding:0.5rem 0.8rem;border-radius:0.4rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">افزودن</button></div></div>';
    if (groups.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">📊 موجودی گروه‌ها (' + groups.length + ')</h3>';
      html += '<div style="max-height:400px;overflow-y:auto;font-size:0.78rem;">';
      groups.forEach(g => {
        const color = g.remain <= 0.0001 ? '#991b1b' : (g.remain / g.totalWeight < 0.3 ? '#92400e' : '#166534');
        const bg = g.remain <= 0.0001 ? '#fef2f2' : (g.remain / g.totalWeight < 0.3 ? '#fffbeb' : '#f0fdf4');
        html += '<div style="background:' + bg + ';border:1px solid #e2e8f0;padding:0.5rem;border-radius:0.5rem;margin-bottom:0.3rem;"><div style="display:flex;justify-content:space-between;"><b>' + g.name + (g.code ? ' [' + g.code + ']' : '') + '</b><span style="color:' + color + ';font-weight:bold;">' + safeFmt(g.remain) + ' / ' + safeFmt(g.totalWeight) + ' کیلو</span></div><div style="font-size:0.7rem;color:#64748b;margin-top:0.2rem;">خرید: ' + safeFmt(g.totalWeight) + ' | فروش: ' + safeFmt(g.soldWeight) + ' | میانگین فی: ' + safeFmt(g.avgPrice) + '</div></div>';
      });
      html += '</div></div>';
    }
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;"><h3 style="color:#dc2626;font-size:0.9rem;margin-bottom:0.5rem;">⚠️ منطقه خطر</h3><button onclick="window.__BRAIN_resetCodes()" style="width:100%;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.6rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">🔄 صفر کردن کدها</button></div>';
    box.innerHTML = html;
  }
  function openMerge() {
    const codes = getFruitCodes();
    if (codes.length < 2) return alert('حداقل دو کد لازمه.');
    let html = '<div style="position:fixed;inset:0;background:rgba(15,23,42,0.7);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;" id="mergeOverlay"><div style="background:white;border-radius:1rem;padding:1.2rem;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;">';
    html += '<h3 style="color:#7c3aed;font-size:1rem;margin-bottom:0.5rem;">🔀 ادغام دو کد</h3>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:0.8rem;">کد مبدأ (حذف می‌شه) → کد مقصد (می‌مونه)</p>';
    html += '<label style="font-size:0.8rem;color:#475569;font-weight:bold;">کد مبدأ (حذف می‌شه):</label>';
    html += '<select id="mergeSource" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:0.5rem;font-size:0.85rem;margin-bottom:0.6rem;">';
    codes.forEach(c => { html += '<option value="' + c.code + '">' + c.name + ' (کد ' + c.code + ')</option>'; });
    html += '</select>';
    html += '<label style="font-size:0.8rem;color:#475569;font-weight:bold;">کد مقصد (می‌مونه):</label>';
    html += '<select id="mergeTarget" style="width:100%;padding:0.6rem;border:1px solid #cbd5e1;border-radius:0.5rem;font-size:0.85rem;margin-bottom:0.6rem;">';
    codes.forEach(c => { html += '<option value="' + c.code + '">' + c.name + ' (کد ' + c.code + ')</option>'; });
    html += '</select>';
    html += '<div id="mergeInfo" style="background:#f1f5f9;padding:0.6rem;border-radius:0.5rem;font-size:0.78rem;color:#475569;margin-bottom:0.8rem;">برای دیدن تعداد خرید/فروش، دکمه‌ی «پیش‌نمایش» رو بزن.</div>';
    html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;"><button onclick="window.__BRAIN_previewMerge()" style="flex:1;background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:0.6rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">👁️ پیش‌نمایش</button>';
    html += '<button onclick="window.__BRAIN_confirmMerge()" style="flex:1;background:linear-gradient(135deg,#f59e0b,#d97706);color:white;border:none;padding:0.6rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">✅ ادغام کن</button>';
    html += '<button onclick="document.getElementById(\'mergeOverlay\').remove()" style="flex:1;background:#e2e8f0;color:#475569;border:none;padding:0.6rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">انصراف</button></div>';
    html += '</div></div>';
    const div = document.createElement('div');
    div.innerHTML = html;
    document.body.appendChild(div.firstChild);
    document.getElementById('mergeSource').addEventListener('change', previewMerge);
    document.getElementById('mergeTarget').addEventListener('change', previewMerge);
  }
  function previewMerge() {
    const src = document.getElementById('mergeSource').value;
    const tgt = document.getElementById('mergeTarget').value;
    const info = document.getElementById('mergeInfo');
    if (!info) return;
    if (src === tgt) { info.innerHTML = '<span style="color:#dc2626;font-weight:bold;">⚠️ کد مبدأ و مقصد نمی‌تونن یکی باشن.</span>'; return; }
    const buys = getBuys(); const sells = getSells();
    const srcBuys = buys.filter(b => String(b.fruitCode) === String(src)).length;
    const srcSells = sells.filter(s => String(s.fruitCode) === String(src)).length;
    const tgtBuys = buys.filter(b => String(b.fruitCode) === String(tgt)).length;
    const tgtSells = sells.filter(s => String(s.fruitCode) === String(tgt)).length;
    info.innerHTML = '📊 <b>کد مبدأ (' + src + '):</b> ' + srcBuys + ' خرید، ' + srcSells + ' فروش<br>📊 <b>کد مقصد (' + tgt + '):</b> ' + tgtBuys + ' خرید، ' + tgtSells + ' فروش';
  }
  function confirmMerge() {
    const src = document.getElementById('mergeSource').value;
    const tgt = document.getElementById('mergeTarget').value;
    if (src === tgt) return alert('کد مبدأ و مقصد یکی‌ان.');
    const codes = getFruitCodes();
    const srcCode = codes.find(c => String(c.code) === String(src));
    const tgtCode = codes.find(c => String(c.code) === String(tgt));
    if (!srcCode || !tgtCode) return alert('کد پیدا نشد.');
    const buys = getBuys(); const sells = getSells();
    const srcBuys = buys.filter(b => String(b.fruitCode) === String(src)).length;
    const srcSells = sells.filter(s => String(s.fruitCode) === String(src)).length;
    const tgtBuys = buys.filter(b => String(b.fruitCode) === String(tgt)).length;
    const tgtSells = sells.filter(s => String(s.fruitCode) === String(tgt)).length;
    if (srcBuys === 0 && srcSells === 0) return alert('⚠️ کد مبدأ هیچ خرید یا فروشی نداره. ادغام معنی نداره.');
    if (tgtBuys === 0 && tgtSells === 0) return alert('⚠️ کد مقصد هیچ خرید یا فروشی نداره. ادغام معنی نداره.');
    if (!confirm('ادغام «' + srcCode.name + '» (کد ' + src + ') به «' + tgtCode.name + '» (کد ' + tgt + ')?\n\n' + srcBuys + ' خرید و ' + srcSells + ' فروش منتقل می‌شن.\nکد ' + src + ' حذف می‌شه.')) return;
    buys.forEach(b => { if (String(b.fruitCode) === String(src)) b.fruitCode = tgt; });
    sells.forEach(s => { if (String(s.fruitCode) === String(src)) s.fruitCode = tgt; });
    saveBuys(buys); saveSells(sells);
    const idx = codes.findIndex(c => String(c.code) === String(src));
    if (idx > -1) codes.splice(idx, 1);
    saveFruitCodes(codes);
    const overlay = document.getElementById('mergeOverlay');
    if (overlay) overlay.remove();
    renderBrainPage();
    alert('✅ ادغام انجام شد.\n«' + srcCode.name + '» به «' + tgtCode.name + '» منتقل شد.');
  }
  function codeAll() {
    const buys = getBuys(); const sells = getSells(); let codes = getFruitCodes();
    const namesToCode = new Map();
    buys.forEach(b => { if (!b.fruitCode && b.fruit) { const k = safeNormalize(b.fruit); if (!namesToCode.has(k)) namesToCode.set(k, { name: b.fruit }); } });
    sells.forEach(s => { if (!s.fruitCode && s.fruit) { const k = safeNormalize(s.fruit); if (!namesToCode.has(k)) namesToCode.set(k, { name: s.fruit }); } });
    if (!namesToCode.size) { alert('✅ همه کد دارن!'); return; }
    const newNames = []; const mergeCandidates = [];
    namesToCode.forEach((info, key) => {
      let bestMatch = null, bestScore = 0;
      codes.forEach(c => { const score = similarity(info.name, c.name); if (score > bestScore && score > 0.6) { bestScore = score; bestMatch = c; } });
      if (bestMatch) mergeCandidates.push({ newName: info.name, existingCode: bestMatch, score: bestScore });
      else newNames.push({ key, name: info.name });
    });
    let report = '🏷️ گزارش کدگذاری\n\n';
    if (mergeCandidates.length) {
      report += '🔗 ' + mergeCandidates.length + ' اسم مشابه ادغام شد:\n';
      mergeCandidates.forEach(mc => {
        buys.forEach(b => { if (!b.fruitCode && safeNormalize(b.fruit) === safeNormalize(mc.newName)) b.fruitCode = mc.existingCode.code; });
        sells.forEach(s => { if (!s.fruitCode && safeNormalize(s.fruit) === safeNormalize(mc.newName)) s.fruitCode = mc.existingCode.code; });
        report += '   • «' + mc.newName + '» → ' + mc.existingCode.code + '\n';
      });
      report += '\n';
    }
    if (newNames.length) {
      report += '🆕 ' + newNames.length + ' میوه جدید:\n';
      newNames.forEach(nn => {
        let existing = null;
        codes.forEach(c => { const score = similarity(nn.name, c.name); if (score > 0.6 && (!existing || score > existing.score)) existing = { code: c.code, name: c.name, score }; });
        let newCode;
        if (existing) { newCode = existing.code; report += '   • «' + nn.name + '» → ' + newCode + ' (ادغام)\n'; }
        else { newCode = generateNewCode(codes); codes.push({ code: newCode, name: nn.name }); saveFruitCodes(codes); report += '   • «' + nn.name + '» → ' + newCode + ' (جدید)\n'; }
        buys.forEach(b => { if (!b.fruitCode && safeNormalize(b.fruit) === safeNormalize(nn.name)) b.fruitCode = newCode; });
        sells.forEach(s => { if (!s.fruitCode && safeNormalize(s.fruit) === safeNormalize(nn.name)) s.fruitCode = newCode; });
      });
    }
    saveFruitCodes(codes); saveBuys(buys); saveSells(sells);
    alert(report); renderBrainPage();
  }
  function linkAll() {
    const buys = getBuys(); const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    if (!unlinked.length) return alert('همه متصل هستن.');
    function used(bid) { let sum = 0; sells.forEach(s => (s.linkedBuys || []).forEach(lb => { if (String(lb.buyId) === String(bid)) sum += +lb.weight || 0; })); return sum; }
    let tl = 0, tf = 0, tp = 0;
    unlinked.forEach(sell => {
      const sk = sell.fruitCode ? 'C:' + String(sell.fruitCode) : 'N:' + safeNormalize(sell.fruit);
      const c = buys.map(b => { const bk = b.fruitCode ? 'C:' + String(b.fruitCode) : 'N:' + safeNormalize(b.fruit); return { buy: b, remain: (+b.weight || 0) - used(b.id), match: bk === sk }; }).filter(x => x.match && x.remain > 0.0001).sort((a, b) => (typeof jalaliToNum === 'function' ? jalaliToNum(a.buy.date) - jalaliToNum(b.buy.date) : 0));
      if (!c.length) { tp++; return; }
      let need = +sell.weight || 0; let got = 0;
      c.forEach(x => { if (need <= 0.0001) return; const t = Math.min(need, x.remain); if (t > 0.0001) { if (!sell.linkedBuys) sell.linkedBuys = []; sell.linkedBuys.push({ buyId: x.buy.id, weight: +t.toFixed(1) }); need -= t; got++; } });
      if (got) tl++;
      if (need <= 0.0001) tf++; else tp++;
    });
    saveSells(sells);
    alert('🔗 اتصال انجام شد.\n✅ ' + tl + ' فروش متصل شد\n   • ' + tf + ' کامل، ' + tp + ' ناقص');
    renderBrainPage();
    setTimeout(() => { if (typeof window.__BRAIN_verify === 'function') window.__BRAIN_verify(); }, 500);
  }
  function verifyAll() {
    const buys = getBuys(); const sells = getSells();
    let fixed = []; let errors = [];
    if (sells.filter(s => !s.fruitCode).length) fixed.push(sells.filter(s => !s.fruitCode).length + ' فروش بدون کد');
    if (buys.filter(b => !b.fruitCode).length) fixed.push(buys.filter(b => !b.fruitCode).length + ' خرید بدون کد');
    if (sells.filter(s => !(s.linkedBuys && s.linkedBuys.length)).length) fixed.push(sells.filter(s => !(s.linkedBuys && s.linkedBuys.length)).length + ' فروش بدون اتصال');
    const groups = getStockData();
    groups.filter(g => g.remain < -0.01).forEach(g => errors.push('«' + g.name + '» موجودی منفی: ' + safeFmt(Math.abs(g.remain)) + ' کیلو'));
    const codeMap = {}; getFruitCodes().forEach(c => { if (!codeMap[c.code]) codeMap[c.code] = []; codeMap[c.code].push(c.name); });
    Object.keys(codeMap).forEach(code => { if (codeMap[code].length > 1) errors.push('کد ' + code + ' برای چند میوه: ' + codeMap[code].join('، ')); });
    let msg = '';
    if (!fixed.length && !errors.length) msg = '🎉 همه‌چیز اوکیه!\n\n✅ خطا صفر\n✅ موجودی درست\n✅ کدها یکتا\n✅ اتصال کامل\n✅ سودها دقیق';
    else { msg = '🔍 نتیجه بررسی:\n\n'; if (fixed.length) { msg += '✅ خودکار رفع می‌شن:\n'; fixed.forEach(f => { msg += '   • ' + f + '\n'; }); msg += '\n'; } if (errors.length) { msg += '⚠️ بررسی دستی:\n'; errors.forEach((e, i) => { msg += '   ' + (i + 1) + '. ' + e + '\n'; }); } else { msg += '✅ خطای دستی نیست.'; } }
    alert(msg); renderBrainPage();
  }
  function resolveNeg(key, action) {
    const groups = getStockData();
    const g = groups.find(x => x.key === key);
    if (!g) return;
    if (action === 'skip') { alert('⏭️ رد شد'); return; }
    if (action === 'error') {
      const allSells = getSells().filter(s => safeNormalize(s.fruit) === safeNormalize(g.name));
      let msg = 'فروش‌های ' + g.name + ':\n\n';
      allSells.slice(0, 15).forEach(s => { msg += safeShowDate(s.date) + ' - ' + s.hotel + ' - ' + s.weight + ' کیلو\n'; });
      msg += '\nبرو صفحه فروش و اصلاح کن.';
      alert(msg); return;
    }
    if (action === 'prev') {
      const supplies = getSupplies();
      const already = supplies.some(s => safeNormalize(s.fruit) === safeNormalize(g.name) && s.reason === 'موجودی از قبل');
      if (already) {
        alert('⚠️ برای «' + g.name + '» قبلاً تأمین بار «از بار قبلی» ثبت شده.');
        return;
      }
      const deficit = Math.abs(g.remain);
      if (!confirm(safeFmt(deficit) + ' کیلو ' + g.name + ' از بار قبلی بوده؟')) return;
      supplies.push({ id: Date.now(), date: (typeof todayJalali === 'function' ? todayJalali() : ''), fruit: g.name, weight: +deficit.toFixed(1), price: 0, reason: 'موجودی از قبل', isSupply: true });
      saveSupplies(supplies);
      alert('✅ تأمین بار ' + safeFmt(deficit) + ' کیلو ' + g.name + ' ثبت شد.');
      renderBrainPage();
    }
  }
  function editCode(idx) {
    const codes = getFruitCodes();
    const c = codes[idx];
    if (!c) return;
    const newName = prompt('نام جدید میوه:', c.name);
    if (newName === null) return;
    const newCode = prompt('کد جدید:', c.code);
    if (newCode === null) return;
    if (!newName.trim() || !newCode.trim()) return alert('نام و کد نمی‌تونن خالی باشن.');
    if (codes.find((x, i) => i !== idx && String(x.code) === String(newCode.trim()))) return alert('این کد قبلاً برای میوه‌ی دیگه استفاده شده.');
    const oldName = c.name;
    const oldCode = c.code;
    c.name = newName.trim();
    c.code = newCode.trim();
    saveFruitCodes(codes);
    if (confirm('کد جدید به خریدها و فروش‌های قبلی هم اعمال بشه؟')) {
      const buys = getBuys(); const sells = getSells();
      buys.forEach(b => { if (safeNormalize(b.fruit) === safeNormalize(oldName) || String(b.fruitCode) === String(oldCode)) b.fruitCode = c.code; });
      sells.forEach(s => { if (safeNormalize(s.fruit) === safeNormalize(oldName) || String(s.fruitCode) === String(oldCode)) s.fruitCode = c.code; });
      saveBuys(buys); saveSells(sells);
    }
    renderBrainPage();
    alert('✅ کد ویرایش شد.');
  }
  function deleteCode(idx) {
    const codes = getFruitCodes();
    if (!codes[idx]) return;
    if (!confirm('کد «' + codes[idx].name + '» حذف بشه؟ (خرید/فروش‌ها دست‌نخورده می‌مونن)')) return;
    codes.splice(idx, 1);
    saveFruitCodes(codes);
    renderBrainPage();
  }
  function addCode() {
    const codeEl = document.getElementById('brainNewCode');
    const nameEl = document.getElementById('brainNewName');
    if (!codeEl || !nameEl) return;
    const code = codeEl.value.trim();
    const name = nameEl.value.trim();
    if (!code || !name) return alert('کد و نام رو پر کن.');
    const codes = getFruitCodes();
    if (codes.find(c => String(c.code) === code)) return alert('این کد قبلاً استفاده شده.');
    if (codes.find(c => safeNormalize(c.name) === safeNormalize(name))) return alert('این نام قبلاً استفاده شده.');
    codes.push({ code, name });
    saveFruitCodes(codes);
    codeEl.value = ''; nameEl.value = '';
    renderBrainPage();
    alert('✅ کد جدید افزوده شد.');
  }
  function resetCodes() {
    if (!confirm('همه کدها پاک بشن؟')) return;
    saveFruitCodes([]);
    const buys = getBuys(); const sells = getSells();
    buys.forEach(b => { delete b.fruitCode; });
    sells.forEach(s => { delete s.fruitCode; });
    saveBuys(buys); saveSells(sells);
    renderBrainPage(); alert('✅ صفر شد.');
  }
  function init() {
    const t = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectBrainIntoAnalysis();
        if (!window.__BRAIN_wrapped) {
          window.__BRAIN_wrapped = true;
          const orig = window.showPage;
          window.showPage = function (id) {
            orig(id);
            injectBrainIntoAnalysis();
            if (id === 'analysis') {
              const btns = document.querySelectorAll('#analysis .tab-btn');
              btns.forEach(b => b.classList.remove('active'));
              if (btns[0]) btns[0].classList.add('active');
              document.getElementById('analysisDefectsTab').style.display = 'block';
              document.getElementById('analysisChartTab').style.display = 'none';
              const brainTab = document.getElementById('analysisBrainTab');
              if (brainTab) brainTab.style.display = 'none';
            }
          };
        }
        clearInterval(t);
      }
    }, 400);
  }
  window.__BRAIN_codeAll = codeAll;
  window.__BRAIN_linkAll = linkAll;
  window.__BRAIN_verify = verifyAll;
  window.__BRAIN_resolveNeg = resolveNeg;
  window.__BRAIN_resetCodes = resetCodes;
  window.__BRAIN_editCode = editCode;
  window.__BRAIN_deleteCode = deleteCode;
  window.__BRAIN_addCode = addCode;
  window.__BRAIN_openMerge = openMerge;
  window.__BRAIN_previewMerge = previewMerge;
  window.__BRAIN_confirmMerge = confirmMerge;
  window.__BRAIN_renderIntoAnalysis = function() { const tab = document.getElementById('analysisBrainTab'); if (tab) { tab.style.display = 'block'; renderBrainPage(); } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
