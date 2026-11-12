cd ~/meydan
cat > fruit-codes.js << 'ENDJS'
cd ~/meydan && cat > fruit-codes.js << 'ENDJS'
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
  function getCodeByName(name) {
    if (!name) return '';
    const target = safeNormalize(name);
    const found = getFruitCodes().find(c => safeNormalize(c.name) === target);
    return found ? found.code : '';
  }
  function getNameByCode(code) {
    if (!code) return '';
    const found = getFruitCodes().find(c => String(c.code) === String(code));
    return found ? found.name : '';
  }
  function fruitKey(item) {
    if (!item) return '';
    if (item.fruitCode) return 'CODE:' + String(item.fruitCode);
    return 'NAME:' + safeNormalize(item.fruit);
  }
  function injectFruitCodingMenu() {
    const menu = document.getElementById('mainMenu');
    if (!menu || document.getElementById('menu-fruit-codes')) return;
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.id = 'menu-fruit-codes';
    item.textContent = '🔢 کدینگ میوه‌ها';
    item.onclick = () => { showPage('fruit-codes'); closeMenu(); };
    const codingHotel = menu.querySelector('[onclick*="showPage(\'coding\')"]');
    if (codingHotel && codingHotel.nextSibling) menu.insertBefore(item, codingHotel.nextSibling);
    else menu.insertBefore(item, menu.querySelector('.logout-item'));
  }
  function injectFruitCodingPage() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('fruit-codes')) return;
    const sec = document.createElement('section');
    sec.id = 'fruit-codes';
    sec.className = 'page';
    sec.innerHTML = `
      <h2>🔢 کدینگ میوه‌ها</h2>
      <p style="font-size:0.8rem;color:#666;margin-bottom:1rem;">برای هر میوه یک کد ثابت تعریف کن.</p>
      <form id="fruitCodeForm" style="margin-bottom:1.5rem;">
        <input type="text" id="fcCode" placeholder="کد (مثلاً 101)" required>
        <input type="text" id="fcName" placeholder="نام میوه (مثلاً قارچ)" required>
        <button type="submit">ثبت کد</button>
      </form>
      <div id="fcListBox" style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);"></div>
    `;
    main.appendChild(sec);
  }
  function renderFruitCodes() {
    const box = document.getElementById('fcListBox');
    if (!box) return;
    const codes = getFruitCodes();
    if (!codes.length) {
      box.innerHTML = '<p style="text-align:center;color:#999;font-size:0.85rem;">هنوز کدی تعریف نشده.</p>';
      return;
    }
    box.innerHTML = codes.map((c, i) => `
      <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px dashed #e2e8f0;">
        <span style="font-size:0.85rem;"><b>${c.code}</b> — ${c.name}</span>
        <button onclick="window.__FC_delete(${i})" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.25rem 0.6rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;font-weight:bold;">حذف</button>
      </div>
    `).join('');
  }
  function addFruitCode() {
    const code = document.getElementById('fcCode').value.trim();
    const name = document.getElementById('fcName').value.trim();
    if (!code || !name) return;
    const codes = getFruitCodes();
    if (codes.find(c => String(c.code) === code)) return alert('این کد قبلاً ثبت شده.');
    if (codes.find(c => safeNormalize(c.name) === safeNormalize(name))) return alert('این نام قبلاً ثبت شده.');
    codes.push({ code, name });
    saveFruitCodes(codes);
    document.getElementById('fcCode').value = '';
    document.getElementById('fcName').value = '';
    renderFruitCodes();
    alert('✅ کد میوه ثبت شد.');
  }
  function deleteFruitCode(idx) {
    if (!confirm('حذف شود؟')) return;
    const codes = getFruitCodes();
    codes.splice(idx, 1);
    saveFruitCodes(codes);
    renderFruitCodes();
  }
  function injectFruitCodeInputs() {
    const buyForm = document.getElementById('buyForm');
    if (buyForm && !document.getElementById('buyFruitCode')) {
      const nameInput = document.getElementById('buyFruit');
      if (nameInput) {
        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.id = 'buyFruitCode';
        codeInput.placeholder = 'کد میوه (اختیاری)';
        codeInput.style.marginBottom = '5px';
        codeInput.addEventListener('input', () => {
          const nm = getNameByCode(codeInput.value);
          if (nm) nameInput.value = nm;
        });
        nameInput.addEventListener('input', () => {
          const cd = getCodeByName(nameInput.value);
          if (cd) codeInput.value = cd;
        });
        nameInput.parentNode.insertBefore(codeInput, nameInput);
      }
    }
    const sellForm = document.getElementById('sellForm');
    if (sellForm && !document.getElementById('sellFruitCode')) {
      const nameInput = document.getElementById('sellFruit');
      if (nameInput) {
        const codeInput = document.createElement('input');
        codeInput.type = 'text';
        codeInput.id = 'sellFruitCode';
        codeInput.placeholder = 'کد میوه (اختیاری)';
        codeInput.style.marginBottom = '5px';
        codeInput.addEventListener('input', () => {
          const nm = getNameByCode(codeInput.value);
          if (nm) nameInput.value = nm;
        });
        nameInput.addEventListener('input', () => {
          const cd = getCodeByName(nameInput.value);
          if (cd) codeInput.value = cd;
        });
        nameInput.parentNode.insertBefore(codeInput, nameInput);
      }
    }
  }
  function patchForms() {
    const buyForm = document.getElementById('buyForm');
    if (buyForm && !buyForm.dataset.fcPatched) {
      buyForm.dataset.fcPatched = '1';
      buyForm.addEventListener('submit', () => {
        setTimeout(() => {
          const buys = getBuys();
          if (!buys.length) return;
          const last = buys[buys.length - 1];
          const code = document.getElementById('buyFruitCode') ? document.getElementById('buyFruitCode').value.trim() : '';
          if (code && !last.fruitCode) { last.fruitCode = code; saveBuys(buys); }
        }, 50);
      }, true);
    }
    const sellForm = document.getElementById('sellForm');
    if (sellForm && !sellForm.dataset.fcPatched) {
      sellForm.dataset.fcPatched = '1';
      sellForm.addEventListener('submit', () => {
        setTimeout(() => {
          const sells = getSells();
          if (!sells.length) return;
          const last = sells[sells.length - 1];
          const code = document.getElementById('sellFruitCode') ? document.getElementById('sellFruitCode').value.trim() : '';
          if (code && !last.fruitCode) { last.fruitCode = code; saveSells(sells); }
        }, 50);
      }, true);
    }
  }
  function injectBrainSection() {
    const analysis = document.getElementById('analysis');
    if (!analysis || document.getElementById('brainTabBtn')) return;
    const tabs = analysis.querySelector('.tabs');
    if (!tabs) return;
    const btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.id = 'brainTabBtn';
    btn.textContent = '🧠 مغز سیستم';
    btn.onclick = () => {
      document.querySelectorAll('#analysis .tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      ['analysisDefectsTab', 'analysisDiagnosticTab', 'analysisChartTab'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
      });
      let brain = document.getElementById('analysisBrainTab');
      if (!brain) {
        brain = document.createElement('div');
        brain.id = 'analysisBrainTab';
        brain.style.marginTop = '1rem';
        brain.innerHTML = '<div id="brainBox" style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);"></div>';
        tabs.parentNode.insertBefore(brain, tabs.nextSibling);
      }
      brain.style.display = 'block';
      renderBrain();
    };
    tabs.appendChild(btn);
  }
  function renderBrain() {
    const box = document.getElementById('brainBox');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    let html = `<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:1rem;border-radius:0.8rem;margin-bottom:1rem;"><h3 style="font-size:1rem;margin-bottom:0.3rem;">🧠 دستیار مغز سیستم</h3><p style="font-size:0.8rem;opacity:0.9;">من اینجام تا کار اتصال فروش به خرید رو خودکار برات انجام بدم و گزارش بدم چی شد.</p></div>`;
    html += `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:0.5rem;margin-bottom:1rem;">
      <div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#166534;">${buys.length}</div><div style="font-size:0.7rem;color:#166534;">خرید</div></div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#1e40af;">${sells.length}</div><div style="font-size:0.7rem;color:#1e40af;">فروش</div></div>
      <div style="background:#fef3c7;border:1px solid #fde68a;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#92400e;">${unlinked.length}</div><div style="font-size:0.7rem;color:#92400e;">بدون اتصال</div></div>
    </div>`;
    const sellsWithoutCode = sells.filter(s => !s.fruitCode).length;
    const buysWithoutCode = buys.filter(b => !b.fruitCode).length;
    if (sellsWithoutCode || buysWithoutCode) {
      html += `<div style="background:#fef2f2;border:1px solid #fecaca;padding:0.6rem;border-radius:0.6rem;margin-bottom:1rem;font-size:0.78rem;color:#991b1b;"><b>⚠️ پیشنهاد:</b> ${sellsWithoutCode} فروش و ${buysWithoutCode} خرید بدون کد میوه ثبت شدن.</div>`;
    }
    html += `<div style="display:flex;flex-direction:column;gap:0.5rem;margin-bottom:1rem;">
      <button onclick="window.__BRAIN_run()" style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;padding:0.8rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.9rem;">🚀 اجرای اتصال هوشمند</button>
      <button onclick="window.__BRAIN_analyze()" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">🔍 فقط تحلیل کن</button>
    </div>`;
    if (unlinked.length) {
      html += `<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:0.7rem;border-radius:0.6rem;font-size:0.78rem;"><b style="color:#334155;">📋 فروش‌های بدون اتصال (${unlinked.length}):</b><div style="max-height:200px;overflow-y:auto;margin-top:0.4rem;">`;
      unlinked.slice(0, 10).forEach(s => {
        html += `<div style="padding:0.3rem 0;border-bottom:1px dashed #e2e8f0;color:#475569;">${safeShowDate(s.date)} — ${s.hotel} — ${s.fruit} ${s.fruitCode ? `[کد ${s.fruitCode}]` : ''} — ${safeFmt(s.weight)} کیلو</div>`;
      });
      if (unlinked.length > 10) html += `<div style="color:#94a3b8;padding:0.3rem 0;">... و ${unlinked.length - 10} مورد دیگر</div>`;
      html += `</div></div>`;
    } else {
      html += `<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.8rem;border-radius:0.6rem;text-align:center;color:#166534;font-size:0.85rem;">🎉 همه‌ی فروش‌ها متصل هستن.</div>`;
    }
    box.innerHTML = html;
  }
  function brainRun() {
    const buys = getBuys();
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    if (!unlinked.length) return alert('همه‌ی فروش‌ها قبلاً متصل شدن.');
    function usedFromBuy(buyId) {
      let sum = 0;
      sells.forEach(s => (s.linkedBuys || []).forEach(lb => {
        if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0;
      }));
      return sum;
    }
    let totalLinked = 0, totalFull = 0, totalPartial = 0;
    const details = [];
    unlinked.forEach(sell => {
      const sellKey = fruitKey(sell);
      const candidates = buys.map(b => {
        const buyKey = fruitKey(b);
        const match = (buyKey === sellKey) || (!sell.fruitCode && !b.fruitCode && safeNormalize(b.fruit) === safeNormalize(sell.fruit));
        const remain = (+b.weight || 0) - usedFromBuy(b.id);
        return { buy: b, remain, match };
      }).filter(x => x.match && x.remain > 0.0001).sort((a, b) => (typeof jalaliToNum === 'function' ? jalaliToNum(a.buy.date) - jalaliToNum(b.buy.date) : String(a.buy.date).localeCompare(String(b.buy.date))));
      if (!candidates.length) {
        totalPartial++;
        details.push({ sell, status: 'no-buy', picks: [] });
        return;
      }
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
    let report = `🧠 گزارش دستیار مغز سیستم\n\n`;
    report += `✅ ${totalLinked} فروش متصل شد.\n`;
    report += `   • ${totalFull} فروش کامل متصل شد.\n`;
    if (totalPartial) report += `   • ${totalPartial} فروش کامل نشد.\n`;
    report += `\n📋 جزئیات:\n`;
    details.slice(0, 8).forEach(d => {
      if (d.status === 'no-buy') report += `❌ ${d.sell.fruit} (${safeShowDate(d.sell.date)}) — هیچ خریدی پیدا نشد.\n`;
      else if (d.status === 'partial') report += `⚠️ ${d.sell.fruit} (${safeShowDate(d.sell.date)}) — ${d.picks.map(p => `${safeFmt(p.weight)} از ${safeShowDate(p.buy.date)}`).join(' + ')} | ${safeFmt(d.remain)} باقی ماند.\n`;
      else report += `✅ ${d.sell.fruit} (${safeShowDate(d.sell.date)}) — ${d.picks.map(p => `${safeFmt(p.weight)} از ${safeShowDate(p.buy.date)}`).join(' + ')}\n`;
    });
    if (details.length > 8) report += `... و ${details.length - 8} مورد دیگر.\n`;
    alert(report);
    renderBrain();
    if (window.__LSS_renderAll) window.__LSS_renderAll();
  }
  function brainAnalyze() {
    const buys = getBuys();
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    if (!unlinked.length) return alert('همه‌ی فروش‌ها متصل هستن. 🎉');
    function usedFromBuy(buyId) {
      let sum = 0;
      sells.forEach(s => (s.linkedBuys || []).forEach(lb => {
        if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0;
      }));
      return sum;
    }
    let canLink = 0, cantLink = 0;
    const cantList = [];
    unlinked.forEach(sell => {
      const sellKey = fruitKey(sell);
      const candidates = buys.filter(b => {
        const buyKey = fruitKey(b);
        const match = (buyKey === sellKey) || (!sell.fruitCode && !b.fruitCode && safeNormalize(b.fruit) === safeNormalize(sell.fruit));
        return match && ((+b.weight || 0) - usedFromBuy(b.id)) > 0.0001;
      });
      if (candidates.length) canLink++;
      else { cantLink++; cantList.push(sell); }
    });
    let msg = `🔍 تحلیل مغز سیستم\n\n📊 ${unlinked.length} فروش بدون اتصال داری:\n   ✅ ${canLink} فروش قابل اتصال است.\n`;
    if (cantLink) {
      msg += `   ❌ ${cantLink} فروش خرید هم‌کد/هم‌نام با موجودی ندارد:\n`;
      cantList.slice(0, 5).forEach(s => { msg += `      • ${s.fruit} ${s.fruitCode ? `[کد ${s.fruitCode}]` : ''} (${safeShowDate(s.date)})\n`; });
      if (cantList.length > 5) msg += `      ... و ${cantList.length - 5} مورد دیگر\n`;
    }
    msg += `\n💡 پیشنهاد: اگه بعضی میوه‌ها کد ندارن، از صفحه کدینگ میوه‌ها کد تعریف کن.`;
    alert(msg);
  }
  function injectAll() {
    injectFruitCodingMenu();
    injectFruitCodingPage();
    injectFruitCodeInputs();
    patchForms();
    injectBrainSection();
  }
  function init() {
    const tryInject = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectAll();
        const origShowPage = window.showPage;
        if (typeof origShowPage === 'function' && !window.__FC_wrapped) {
          window.__FC_wrapped = true;
          window.showPage = function (id) {
            origShowPage(id);
            injectAll();
            if (id === 'fruit-codes') renderFruitCodes();
            if (id === 'analysis') injectBrainSection();
          };
        }
        clearInterval(tryInject);
      }
    }, 400);
  }
  window.__FC_delete = deleteFruitCode;
  window.__BRAIN_run = brainRun;
  window.__BRAIN_analyze = brainAnalyze;
  document.addEventListener('submit', (e) => {
    if (e.target && e.target.id === 'fruitCodeForm') {
      e.preventDefault();
      addFruitCode();
    }
  });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
