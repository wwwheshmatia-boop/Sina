/* ============================================================
   link-sell.js  —  اتصال فروش به خرید (افزودنی به app.js)
   - صفحه جدید در منو
   - اتصال دستی + اتصال خودکار FIFO
   - پشتیبانی از چند خرید برای یک فروش
   - موجودی هر خرید = weight - مجموع مصرف‌شده
   - به app.js دست نمی‌زند؛ فقط از توابع global آن استفاده می‌کند
   ============================================================ */

(function () {
  'use strict';

  /* ---------- ابزارهای کمکی (فقط در این فایل) ---------- */
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

  /* ---------- مدل داده ---------- */
  // buys: [{id, date, fruit, weight, price, ...}]
  // sells: [{id, date, hotel, fruit, weight, price, linkedBuys?:[{buyId, weight}]}]

  function getBuys() { return LS.get('buys'); }
  function getSells() { return LS.get('sells'); }
  function saveSells(arr) { LS.set('sells', arr); }

  // موجودی مصرف‌شده از یک خرید خاص (در همه فروش‌ها)
  function usedFromBuy(buyId, sells) {
    let sum = 0;
    (sells || getSells()).forEach(s => {
      (s.linkedBuys || []).forEach(lb => {
        if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0;
      });
    });
    return sum;
  }

  // موجودی باقی‌مانده‌ی یک خرید
  function remainOfBuy(buy, sells) {
    return (+buy.weight || 0) - usedFromBuy(buy.id, sells);
  }

  // خریدهای کاندید برای یک فروش (هم‌نام، با موجودی > 0)
  function candidateBuysForSell(sell, sells) {
    const target = safeNormalize(sell.fruit);
    const allBuys = getBuys();
    return allBuys
      .filter(b => safeNormalize(b.fruit) === target)
      .map(b => ({ buy: b, remain: remainOfBuy(b, sells) }))
      .filter(x => x.remain > 0.0001)
      .sort((a, b) => (typeof jalaliToNum === 'function'
        ? jalaliToNum(a.buy.date) - jalaliToNum(b.buy.date)
        : String(a.buy.date).localeCompare(String(b.buy.date))));
  }

  /* ---------- تزریق صفحه و منو ---------- */
  function injectMenu() {
    const menu = document.getElementById('mainMenu');
    if (!menu || document.getElementById('menu-link-sell')) return;
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.id = 'menu-link-sell';
    item.textContent = '🔗 اتصال فروش به خرید';
    item.onclick = () => { showPage('link-sell'); closeMenu(); };
    // قبل از «خروج» درج شود
    const logout = menu.querySelector('.logout-item');
    if (logout) menu.insertBefore(item, logout);
    else menu.appendChild(item);
  }

  function injectPage() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('link-sell')) return;
    const sec = document.createElement('section');
    sec.id = 'link-sell';
    sec.className = 'page';
    sec.innerHTML = `
      <h2>🔗 اتصال فروش به خرید</h2>
      <p style="font-size:0.8rem;color:#666;margin-bottom:1rem;">
        هر فروش را به یک یا چند خریدِ هم‌نام وصل کن. با این کار موجودی هر خرید جداگانه کم می‌شود و سود دقیق‌تر حساب می‌شود.
      </p>
      <div class="filter-box" style="margin-bottom:0.8rem;">
        <h3>🔍 فیلتر</h3>
        <label>فقط فروش‌های بدون اتصال؟</label>
        <select id="lsFilterLinked">
          <option value="unlinked">فقط بدون اتصال</option>
          <option value="all">همه فروش‌ها</option>
        </select>
        <label>میوه:</label>
        <select id="lsFilterFruit"><option value="">همه</option></select>
        <button onclick="window.__LS_render()" class="backup-btn" style="margin-top:0.5rem;">به‌روزرسانی لیست</button>
      </div>
      <div id="lsListBox" style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);"></div>
    `;
    main.appendChild(sec);
  }

  /* ---------- رندر لیست فروش ---------- */
  function renderList() {
    const box = document.getElementById('lsListBox');
    if (!box) return;
    const sells = getSells();
    const linkedMode = document.getElementById('lsFilterLinked').value;
    const fruitFilter = document.getElementById('lsFilterFruit').value;

    let rows = sells.slice();
    if (linkedMode === 'unlinked') rows = rows.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    if (fruitFilter) rows = rows.filter(s => safeNormalize(s.fruit) === fruitFilter);

    // مرتب‌سازی: جدیدترین اول
    rows.sort((a, b) => (typeof jalaliToNum === 'function'
      ? jalaliToNum(b.date) - jalaliToNum(a.date)
      : 0));

    if (!rows.length) {
      box.innerHTML = '<p style="text-align:center;color:#999;font-size:0.85rem;">فروشی با این فیلتر نیست.</p>';
      return;
    }

    box.innerHTML = rows.map(s => {
      const linkedWeight = (s.linkedBuys || []).reduce((a, x) => a + (+x.weight || 0), 0);
      const isLinked = (s.linkedBuys && s.linkedBuys.length > 0);
      const isFull = Math.abs(linkedWeight - (+s.weight || 0)) < 0.0001;
      const badge = isFull
        ? '<span class="badge ok">متصل کامل</span>'
        : isLinked
          ? `<span class="badge negative">${safeFmt(linkedWeight)} از ${safeFmt(s.weight)} کیلو متصل</span>`
          : '<span class="badge out">بدون اتصال</span>';

      return `
        <div class="report-row" style="align-items:flex-start;flex-direction:column;gap:0.3rem;">
          <div style="display:flex;justify-content:space-between;width:100%;gap:0.5rem;">
            <span style="font-size:0.82rem;font-weight:bold;">
              ${safeShowDate(s.date)} — ${s.hotel} — ${s.fruit} — ${(+s.weight).toFixed(1)} کیلو × ${safeFmt(s.price)}
            </span>
            ${badge}
          </div>
          <div style="display:flex;gap:0.4rem;flex-wrap:wrap;">
            <button onclick="window.__LS_openLink(${s.id})" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;padding:0.4rem 0.8rem;border-radius:0.5rem;font-size:0.75rem;font-weight:bold;cursor:pointer;">🔗 اتصال دستی</button>
            <button onclick="window.__LS_autoFIFO(${s.id})" style="background:linear-gradient(135deg,#16a34a,#15803d);color:white;border:none;padding:0.4rem 0.8rem;border-radius:0.5rem;font-size:0.75rem;font-weight:bold;cursor:pointer;">⚡ اتصال خودکار FIFO</button>
            ${isLinked ? `<button onclick="window.__LS_clearLink(${s.id})" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.4rem 0.8rem;border-radius:0.5rem;font-size:0.75rem;font-weight:bold;cursor:pointer;">✖ پاک کردن اتصال</button>` : ''}
          </div>
          ${isLinked ? `<div style="font-size:0.72rem;color:#64748b;margin-top:0.2rem;">${(s.linkedBuys || []).map(lb => {
            const buy = getBuys().find(b => String(b.id) === String(lb.buyId));
            return buy ? `از خرید ${safeShowDate(buy.date)} → ${safeFmt(lb.weight)} کیلو` : `خرید حذف‌شده → ${safeFmt(lb.weight)} کیلو`;
          }).join(' | ')}</div>` : ''}
        </div>
      `;
    }).join('');
  }

  /* ---------- مودال اتصال دستی ---------- */
  function openLinkModal(sellId) {
    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(sellId));
    if (!sell) return;

    const candidates = candidateBuysForSell(sell, sells);
    if (!candidates.length) {
      alert('هیچ خریدی با موجودی باقی‌مانده برای این میوه پیدا نشد.');
      return;
    }

    // محاسبه‌ی وزن باقی‌مانده‌ی فروش برای اتصال
    const already = (sell.linkedBuys || []).reduce((a, x) => a + (+x.weight || 0), 0);
    let remainingToLink = (+sell.weight || 0) - already;
    if (remainingToLink <= 0) {
      alert('این فروش قبلاً به‌طور کامل متصل شده است.');
      return;
    }

    // ساخت مودال
    const modal = document.createElement('div');
    modal.id = 'lsModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
      <div style="background:white;border-radius:1rem;padding:1rem;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;">
        <h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">🔗 اتصال فروش به خرید</h3>
        <p style="font-size:0.78rem;color:#666;margin-bottom:0.7rem;">
          فروش: <b>${safeShowDate(sell.date)} — ${sell.hotel} — ${sell.fruit}</b><br>
          وزن کل: <b>${(+sell.weight).toFixed(1)} کیلو</b> — باقی‌مانده برای اتصال: <b id="lsRemainLabel">${remainingToLink.toFixed(1)} کیلو</b>
        </p>
        <div id="lsCandidateList" style="max-height:300px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.4rem;"></div>
        <div style="margin-top:0.7rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button onclick="window.__LS_fillFIFO()" style="background:#16a34a;color:white;border:none;padding:0.5rem 0.9rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">⚡ پرکردن خودکار FIFO</button>
          <button onclick="window.__LS_confirm()" style="background:#2563eb;color:white;border:none;padding:0.5rem 0.9rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">✅ تأیید اتصال</button>
          <button onclick="window.__LS_closeModal()" style="background:#eee;color:#333;border:none;padding:0.5rem 0.9rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">انصراف</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // ذخیره context
    window.__LS_ctx = {
      sellId: sell.id,
      candidates,
      remainingToLink
    };

    renderCandidates(candidates, remainingToLink);
  }

  function renderCandidates(candidates, remainingToLink) {
    const box = document.getElementById('lsCandidateList');
    if (!box) return;
    box.innerHTML = candidates.map((c, idx) => {
      const id = 'lsCand_' + idx;
      const buy = c.buy;
      return `
        <div style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem;border-bottom:1px dashed #e2e8f0;">
          <input type="checkbox" id="${id}_chk" onchange="window.__LS_toggle(${idx})" style="width:18px;height:18px;cursor:pointer;">
          <div style="flex:1;font-size:0.75rem;line-height:1.4;">
            <div><b>${safeShowDate(buy.date)}</b> — ${buy.fruit} — فی: ${safeFmt(buy.price)}</div>
            <div style="color:#64748b;">موجودی خرید: ${safeFmt(c.remain)} کیلو</div>
          </div>
          <input type="number" id="${id}_w" step="0.1" min="0" max="${c.remain}" placeholder="کیلو" disabled
                 style="width:70px;padding:0.3rem;border:1px solid #cbd5e1;border-radius:0.3rem;font-size:0.75rem;text-align:center;">
        </div>
      `;
    }).join('');
  }

  function toggleCandidate(idx) {
    const chk = document.getElementById('lsCand_' + idx + '_chk');
    const w = document.getElementById('lsCand_' + idx + '_w');
    if (!chk || !w) return;
    w.disabled = !chk.checked;
    if (chk.checked && (!w.value || +w.value === 0)) {
      // پیشنهاد: پر کردن با min(باقی‌مانده فروش، موجودی خرید)
      const ctx = window.__LS_ctx;
      const cand = ctx.candidates[idx];
      const currentSum = getSumChecked();
      const need = Math.max(0, ctx.remainingToLink - currentSum);
      const suggested = Math.min(need, cand.remain);
      w.value = suggested > 0 ? suggested.toFixed(1) : '';
      w.max = cand.remain;
    }
    if (!chk.checked) w.value = '';
    updateRemainLabel();
  }

  function getSumChecked() {
    const ctx = window.__LS_ctx;
    if (!ctx) return 0;
    let s = 0;
    ctx.candidates.forEach((_, idx) => {
      const chk = document.getElementById('lsCand_' + idx + '_chk');
      const w = document.getElementById('lsCand_' + idx + '_w');
      if (chk && chk.checked && w) s += +w.value || 0;
    });
    return s;
  }

  function updateRemainLabel() {
    const ctx = window.__LS_ctx;
    if (!ctx) return;
    const lbl = document.getElementById('lsRemainLabel');
    if (!lbl) return;
    const used = getSumChecked();
    const remain = ctx.remainingToLink - used;
    lbl.textContent = remain.toFixed(1) + ' کیلو';
    lbl.style.color = remain < -0.0001 ? '#dc2626' : (remain < 0.0001 ? '#16a34a' : '#1e293b');
  }

  function fillFIFO() {
    const ctx = window.__LS_ctx;
    if (!ctx) return;
    let need = ctx.remainingToLink;
    ctx.candidates.forEach((c, idx) => {
      const chk = document.getElementById('lsCand_' + idx + '_chk');
      const w = document.getElementById('lsCand_' + idx + '_w');
      if (!chk || !w) return;
      if (need <= 0.0001) { chk.checked = false; w.disabled = true; w.value = ''; return; }
      const take = Math.min(need, c.remain);
      chk.checked = take > 0;
      w.disabled = false;
      w.max = c.remain;
      w.value = take > 0 ? take.toFixed(1) : '';
      need -= take;
    });
    updateRemainLabel();
  }

  function confirmLink() {
    const ctx = window.__LS_ctx;
    if (!ctx) return;
    const used = getSumChecked();
    if (used <= 0.0001) return alert('هیچ خریدی انتخاب نشده.');
    if (used > ctx.remainingToLink + 0.0001) return alert('مجموع انتخاب‌شده از باقی‌مانده‌ی فروش بیشتر است.');

    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(ctx.sellId));
    if (!sell) return;

    if (!sell.linkedBuys) sell.linkedBuys = [];
    ctx.candidates.forEach((c, idx) => {
      const chk = document.getElementById('lsCand_' + idx + '_chk');
      const w = document.getElementById('lsCand_' + idx + '_w');
      if (chk && chk.checked && w) {
        const ww = +w.value || 0;
        if (ww > 0) sell.linkedBuys.push({ buyId: c.buy.id, weight: +ww.toFixed(1) });
      }
    });

    saveSells(sells);
    closeModal();
    renderList();
    alert('✅ اتصال ثبت شد.');
  }

  function closeModal() {
    const m = document.getElementById('lsModal');
    if (m) m.remove();
    window.__LS_ctx = null;
  }

  /* ---------- اتصال خودکار FIFO ---------- */
  function autoFIFO(sellId) {
    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(sellId));
    if (!sell) return;
    const already = (sell.linkedBuys || []).reduce((a, x) => a + (+x.weight || 0), 0);
    let need = (+sell.weight || 0) - already;
    if (need <= 0.0001) return alert('این فروش قبلاً کامل متصل شده است.');

    const candidates = candidateBuysForSell(sell, sells);
    if (!candidates.length) return alert('هیچ خریدی با موجودی باقی‌مانده پیدا نشد.');

    if (!sell.linkedBuys) sell.linkedBuys = [];
    const picks = [];
    for (const c of candidates) {
      if (need <= 0.0001) break;
      const take = Math.min(need, c.remain);
      if (take > 0.0001) {
        sell.linkedBuys.push({ buyId: c.buy.id, weight: +take.toFixed(1) });
        picks.push(`${safeShowDate(c.buy.date)}: ${take.toFixed(1)} کیلو`);
        need -= take;
      }
    }
    saveSells(sells);
    renderList();
    alert('✅ اتصال خودکار FIFO انجام شد:\n' + picks.join('\n') +
      (need > 0.0001 ? `\n\n⚠️ ${need.toFixed(1)} کیلو هنوز بدون خرید ماند.` : ''));
  }

  /* ---------- پاک کردن اتصال ---------- */
  function clearLink(sellId) {
    if (!confirm('اتصال این فروش پاک شود؟')) return;
    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(sellId));
    if (!sell) return;
    delete sell.linkedBuys;
    saveSells(sells);
    renderList();
  }

  /* ---------- پر کردن فیلتر میوه ---------- */
  function fillFruitFilter() {
    const sel = document.getElementById('lsFilterFruit');
    if (!sel) return;
    const cur = sel.value;
    const fruits = [...new Set(getSells().map(s => safeNormalize(s.fruit)).filter(Boolean))].sort();
    sel.innerHTML = '<option value="">همه</option>' + fruits.map(f => `<option value="${f}">${f}</option>`).join('');
    sel.value = cur;
  }

  /* ---------- رندر اصلی (فراخوانی از بیرون هم مجاز) ---------- */
  function render() {
    fillFruitFilter();
    renderList();
  }

  /* ---------- مقداردهی اولیه ---------- */
  function init() {
    // هر بار که کاربر وارد اپ می‌شود، صفحه و منو بازسازی شوند (بعد از login)
    const tryInject = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectMenu();
        injectPage();
        clearInterval(tryInject);
        // هر بار نمایش صفحه، لیست را تازه کن
        const origShowPage = window.showPage;
        if (typeof origShowPage === 'function' && !window.__LS_wrapped) {
          window.__LS_wrapped = true;
          window.showPage = function (id) {
            origShowPage(id);
            if (id === 'link-sell') render();
          };
        }
      }
    }, 400);
  }

  /* ---------- اتصال توابع به window (برای onclick در HTML) ---------- */
  window.__LS_render = render;
  window.__LS_openLink = openLinkModal;
  window.__LS_autoFIFO = autoFIFO;
  window.__LS_clearLink = clearLink;
  window.__LS_toggle = toggleCandidate;
  window.__LS_fillFIFO = fillFIFO;
  window.__LS_confirm = confirmLink;
  window.__LS_closeModal = closeModal;

  // شروع
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
