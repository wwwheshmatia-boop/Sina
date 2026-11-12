(function () {
  'use strict';
  const LS = {
    get(key) {
      if (!currentBooth) return [];
      try { return JSON.parse(localStorage.getItem(key + '_' + currentBooth) || '[]'); }
      catch (e) { return []; }
    },
    set(key, val) {
      if (!currentBooth) return;
      localStorage.setItem(key + '_' + currentBooth, JSON.stringify(val));
    }
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
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return 1 - dp[m][n] / Math.max(m, n);
  }
  function injectBrainMenu() {
    const menu = document.getElementById('mainMenu');
    if (!menu || document.getElementById('menu-brain')) return;
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.id = 'menu-brain';
    item.textContent = '🧠 مغز سیستم';
    item.style.background = 'linear-gradient(135deg, #7c3aed, #6d28d9)';
    item.style.color = 'white';
    item.onclick = () => { showPage('brain-page'); closeMenu(); };
    const analysis = menu.querySelector('[onclick*="showPage(\'analysis\')"]');
    if (analysis && analysis.nextSibling) menu.insertBefore(item, analysis.nextSibling);
    else menu.insertBefore(item, menu.querySelector('.logout-item'));
  }
  function injectBrainPage() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('brain-page')) return;
    const sec = document.createElement('section');
    sec.id = 'brain-page';
    sec.className = 'page';
    sec.innerHTML = '<div id="brainMain"></div>';
    main.appendChild(sec);
  }
  function renderBrainPage() {
    const box = document.getElementById('brainMain');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();
    const codes = getFruitCodes();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    const buysWithoutCode = buys.filter(b => !b.fruitCode).length;
    const sellsWithoutCode = sells.filter(s => !s.fruitCode).length;
    let html = '<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:1.2rem;border-radius:1rem;margin-bottom:1rem;"><h2 style="font-size:1.1rem;margin-bottom:0.3rem;">🧠 مغز سیستم</h2><p style="font-size:0.8rem;opacity:0.9;">دستیار هوشمند شما — کدگذاری، ادغام، و اتصال خودکار</p></div>';
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem;">';
    html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#166534;">' + buys.length + '</div><div style="font-size:0.7rem;color:#166534;">خرید</div></div>';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#1e40af;">' + sells.length + '</div><div style="font-size:0.7rem;color:#1e40af;">فروش</div></div>';
    html += '<div style="background:#fef3c7;border:1px solid #fde68a;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#92400e;">' + codes.length + '</div><div style="font-size:0.7rem;color:#92400e;">کد میوه</div></div>';
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#991b1b;">' + unlinked.length + '</div><div style="font-size:0.7rem;color:#991b1b;">بدون اتصال</div></div>';
    html += '</div>';
    const needsCoding = (buysWithoutCode > 0 || sellsWithoutCode > 0);
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">۱️⃣ مرحله کدگذاری</h3>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:0.7rem;">' + (needsCoding ? '📊 ' + buysWithoutCode + ' خرید و ' + sellsWithoutCode + ' فروش بدون کد دارن.' : '✅ همه‌ی خریدها و فروش‌ها کد دارن.') + '</p>';
    html += '<button onclick="window.__BRAIN_codeAll()" style="width:100%;background:' + (needsCoding ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#e2e8f0') + ';color:' + (needsCoding ? 'white' : '#94a3b8') + ';border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:' + (needsCoding ? 'pointer' : 'not-allowed') + ';font-size:0.85rem;" ' + (needsCoding ? '' : 'disabled') + '>🏷️ کدگذاری خودکار همه میوه‌ها</button></div>';
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">۲️⃣ مرحله اتصال</h3>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:0.7rem;">' + (unlinked.length ? '📊 ' + unlinked.length + ' فروش بدون اتصال دارن.' : '✅ همه‌ی فروش‌ها متصل هستن.') + '</p>';
    html += '<button onclick="window.__BRAIN_linkAll()" style="width:100%;background:' + (unlinked.length ? 'linear-gradient(135deg,#16a34a,#15803d)' : '#e2e8f0') + ';color:' + (unlinked.length ? 'white' : '#94a3b8') + ';border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:' + (unlinked.length ? 'pointer' : 'not-allowed') + ';font-size:0.85rem;" ' + (unlinked.length ? '' : 'disabled') + '>🔗 اتصال خودکار فروش به خرید (FIFO)</button></div>';
    if (codes.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;"><h3 style="color:#7c3aed;font-size:0.95rem;margin-bottom:0.5rem;">📋 کدهای فعلی (' + codes.length + ')</h3><div style="max-height:300px;overflow-y:auto;font-size:0.8rem;">';
      codes.forEach(c => { html += '<div style="display:flex;justify-content:space-between;padding:0.4rem;border-bottom:1px dashed #e2e8f0;"><span>' + c.name + '</span><span style="color:#7c3aed;font-weight:bold;">کد ' + c.code + '</span></div>'; });
      html += '</div></div>';
    }
    if (unlinked.length) {
      html += '<div style="background:#fef2f2;padding:1rem;border-radius:1rem;border:1px solid #fecaca;margin-bottom:1rem;"><h3 style="color:#991b1b;font-size:0.9rem;margin-bottom:0.4rem;">📋 فروش‌های بدون اتصال (' + unlinked.length + ')</h3><div style="max-height:200px;overflow-y:auto;font-size:0.75rem;">';
      unlinked.slice(0, 20).forEach(s => { html += '<div style="padding:0.3rem 0;border-bottom:1px dashed #fecaca;">' + safeShowDate(s.date) + ' — ' + s.hotel + ' — ' + s.fruit + ' — ' + safeFmt(s.weight) + ' کیلو</div>'; });
      if (unlinked.length > 20) html += '<div style="color:#94a3b8;padding:0.3rem 0;">... و ' + (unlinked.length - 20) + ' مورد دیگر</div>';
      html += '</div></div>';
    }
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;"><h3 style="color:#dc2626;font-size:0.9rem;margin-bottom:0.5rem;">⚠️ منطقه خطر</h3><p style="font-size:0.75rem;color:#666;margin-bottom:0.5rem;">صفر کردن کدها معمولاً بعد از بستن پرونده انجام می‌شه.</p><button onclick="window.__BRAIN_resetCodes()" style="width:100%;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.6rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">🔄 صفر کردن کدهای این پرونده</button></div>';
    box.innerHTML = html;
  }
  function codeAll() {
    const buys = getBuys();
    const sells = getSells();
    let codes = getFruitCodes();
    const namesToCode = new Map();
    buys.forEach(b => {
      if (!b.fruitCode && b.fruit) {
        const key = safeNormalize(b.fruit);
        if (!namesToCode.has(key)) namesToCode.set(key, { name: b.fruit, buys: 0, sells: 0 });
        namesToCode.get(key).buys++;
      }
    });
    sells.forEach(s => {
      if (!s.fruitCode && s.fruit) {
        const key = safeNormalize(s.fruit);
        if (!namesToCode.has(key)) namesToCode.set(key, { name: s.fruit, buys: 0, sells: 0 });
        namesToCode.get(key).sells++;
      }
    });
    if (!namesToCode.size) { alert('✅ همه‌ی میوه‌ها کد دارن!'); return; }
    const newNames = [];
    const mergeCandidates = [];
    namesToCode.forEach((info, key) => {
      let bestMatch = null, bestScore = 0;
      codes.forEach(c => {
        const score = similarity(info.name, c.name);
        if (score > bestScore && score > 0.6) { bestScore = score; bestMatch = c; }
      });
      if (bestMatch) mergeCandidates.push({ newName: info.name, existingCode: bestMatch, score: bestScore, info });
      else newNames.push({ key, name: info.name, info });
    });
    let report = '🏷️ گزارش کدگذاری خودکار\n\n';
    if (mergeCandidates.length) {
      report += '🔗 ' + mergeCandidates.length + ' اسم مشابه با کدهای موجود ادغام شد:\n';
      mergeCandidates.forEach(mc => {
        buys.forEach(b => { if (!b.fruitCode && safeNormalize(b.fruit) === safeNormalize(mc.newName)) b.fruitCode = mc.existingCode.code; });
        sells.forEach(s => { if (!s.fruitCode && safeNormalize(s.fruit) === safeNormalize(mc.newName)) s.fruitCode = mc.existingCode.code; });
        report += '   • «' + mc.newName + '» → کد ' + mc.existingCode.code + ' (' + mc.existingCode.name + ') [' + Math.round(mc.score * 100) + '% شباهت]\n';
      });
      report += '\n';
    }
    if (newNames.length) {
      report += '🆕 ' + newNames.length + ' میوه جدید کدگذاری شد:\n';
      newNames.forEach(nn => {
        let existing = null;
        codes.forEach(c => {
          const score = similarity(nn.name, c.name);
          if (score > 0.6 && (!existing || score > existing.score)) existing = { code: c.code, name: c.name, score };
        });
        let newCode;
        if (existing) {
          newCode = existing.code;
          report += '   • «' + nn.name + '» → کد ' + newCode + ' (' + existing.name + ') [ادغام]\n';
        } else {
          newCode = generateNewCode(codes);
          codes.push({ code: newCode, name: nn.name });
          saveFruitCodes(codes);
          report += '   • «' + nn.name + '» → کد ' + newCode + ' (جدید)\n';
        }
        buys.forEach(b => { if (!b.fruitCode && safeNormalize(b.fruit) === safeNormalize(nn.name)) b.fruitCode = newCode; });
        sells.forEach(s => { if (!s.fruitCode && safeNormalize(s.fruit) === safeNormalize(nn.name)) s.fruitCode = newCode; });
      });
    }
    saveFruitCodes(codes);
    saveBuys(buys);
    saveSells(sells);
    alert(report);
    renderBrainPage();
    if (window.__LSS_renderAll) window.__LSS_renderAll();
  }
  function linkAll() {
    const buys = getBuys();
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    if (!unlinked.length) return alert('همه‌ی فروش‌ها قبلاً متصل شدن.');
    function usedFromBuy(buyId) {
      let sum = 0;
      sells.forEach(s => (s.linkedBuys || []).forEach(lb => { if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0; }));
      return sum;
    }
    let totalLinked = 0, totalFull = 0, totalPartial = 0;
    const details = [];
    unlinked.forEach(sell => {
      const sellKey = sell.fruitCode ? 'CODE:' + String(sell.fruitCode) : 'NAME:' + safeNormalize(sell.fruit);
      const candidates = buys.map(b => {
        const buyKey = b.fruitCode ? 'CODE:' + String(b.fruitCode) : 'NAME:' + safeNormalize(b.fruit);
        const match = (buyKey === sellKey);
        const remain = (+b.weight || 0) - usedFromBuy(b.id);
        return { buy: b, remain, match };
      }).filter(x => x.match && x.remain > 0.0001).sort((a, b) => (typeof jalaliToNum === 'function' ? jalaliToNum(a.buy.date) - jalaliToNum(b.buy.date) : String(a.buy.date).localeCompare(String(b.buy.date))));
      if (!candidates.length) { totalPartial++; details.push({ sell, status: 'no-buy', picks: [] }); return; }
      let need = (+sell.weight || 0);
      const picks = [];
      candidates.forEach(c => {
        if (need <= 0.0001) return;
        const take = Math.min(need, c.remain);
        if (take > 0.0001) {
          if (!sell.linkedBuys) sell.linkedBuys = [];
          sell.linkedBuys.push({ buyId: c.buy.id, weight: +take.toFixed(1) });
          picks.push({ buy: c.buy, weight: +take.toFixed(1) });
          need -= take;
        }
      });
      if (picks.length) totalLinked++;
      if (need <= 0.0001) totalFull++;
      else totalPartial++;
      details.push({ sell, status: need <= 0.0001 ? 'full' : 'partial', picks, remain: need });
    });
    saveSells(sells);
    let report = '🔗 گزارش اتصال خودکار\n\n✅ ' + totalLinked + ' فروش متصل شد.\n   • ' + totalFull + ' فروش کامل متصل شد.\n';
    if (totalPartial) report += '   • ' + totalPartial + ' فروش کامل نشد.\n';
    report += '\n📋 جزئیات:\n';
    details.slice(0, 8).forEach(d => {
      if (d.status === 'no-buy') report += '❌ ' + d.sell.fruit + ' (' + safeShowDate(d.sell.date) + ') — هیچ خریدی پیدا نشد.\n';
      else if (d.status === 'partial') report += '⚠️ ' + d.sell.fruit + ' (' + safeShowDate(d.sell.date) + ') — ' + d.picks.map(p => safeFmt(p.weight) + ' از ' + safeShowDate(p.buy.date)).join(' + ') + ' | ' + safeFmt(d.remain) + ' باقی ماند.\n';
      else report += '✅ ' + d.sell.fruit + ' (' + safeShowDate(d.sell.date) + ') — ' + d.picks.map(p => safeFmt(p.weight) + ' از ' + safeShowDate(p.buy.date)).join(' + ') + '\n';
    });
    if (details.length > 8) report += '... و ' + (details.length - 8) + ' مورد دیگر.\n';
    alert(report);
    renderBrainPage();
    if (window.__LSS_renderAll) window.__LSS_renderAll();
  }
  function resetCodes() {
    if (!confirm('همه‌ی کدهای میوه‌های این پرونده پاک بشن؟')) return;
    saveFruitCodes([]);
    const buys = getBuys();
    const sells = getSells();
    buys.forEach(b => { delete b.fruitCode; });
    sells.forEach(s => { delete s.fruitCode; });
    saveBuys(buys);
    saveSells(sells);
    renderBrainPage();
    alert('✅ همه‌ی کدها صفر شدن.');
  }
  function init() {
    const tryInject = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectBrainMenu();
        injectBrainPage();
        const origShowPage = window.showPage;
        if (typeof origShowPage === 'function' && !window.__BRAIN_wrapped) {
          window.__BRAIN_wrapped = true;
          window.showPage = function (id) {
            origShowPage(id);
            injectBrainMenu();
            injectBrainPage();
            if (id === 'brain-page') renderBrainPage();
          };
        }
        clearInterval(tryInject);
      }
    }, 400);
  }
  window.__BRAIN_codeAll = codeAll;
  window.__BRAIN_linkAll = linkAll;
  window.__BRAIN_resetCodes = resetCodes;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
