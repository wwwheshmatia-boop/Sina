/* ============================================================
   link-sell-stock.js — افزودنی به link-sell.js
   - دکمه «اتصال خودکار همه (FIFO)» — فقط فروش‌های بدون اتصال
   - دکمه «پاک کردن همه‌ی اتصال‌ها» (با تأیید)
   - جدول موجودی خریدها (پایین صفحه اتصال)
   - بخش موجودی خریدهای باز (توی داشبورد)
   - نمایش مصرف/باقی‌مانده زیر هر خرید (توی صفحه خرید)
   ============================================================ */

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

  function getBuys() { return LS.get('buys'); }
  function getSells() { return LS.get('sells'); }
  function saveSells(arr) { LS.set('sells', arr); }

  function usedFromBuy(buyId, sells) {
    let sum = 0;
    (sells || getSells()).forEach(s => {
      (s.linkedBuys || []).forEach(lb => {
        if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0;
      });
    });
    return sum;
  }

  function remainOfBuy(buy, sells) {
    return (+buy.weight || 0) - usedFromBuy(buy.id, sells);
  }

  function candidateBuysForSell(sell, sells) {
    const target = safeNormalize(sell.fruit);
    return getBuys()
      .filter(b => safeNormalize(b.fruit) === target)
      .map(b => ({ buy: b, remain: remainOfBuy(b, sells) }))
      .filter(x => x.remain > 0.0001)
      .sort((a, b) => (typeof jalaliToNum === 'function'
        ? jalaliToNum(a.buy.date) - jalaliToNum(b.buy.date)
        : String(a.buy.date).localeCompare(String(b.buy.date))));
  }

  function stockColor(remain, total) {
    if (remain <= 0.0001) return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: '🔴 تموم' };
    if (total <= 0) return { bg: '#f1f5f9', border: '#cbd5e1', text: '#475569', label: '—' };
    const pct = remain / total;
    if (pct < 0.1) return { bg: '#fef2f2', border: '#fecaca', text: '#991b1b', label: '🔴 کم' };
    if (pct < 0.5) return { bg: '#fffbeb', border: '#fde68a', text: '#92400e', label: '🟡 متوسط' };
    return { bg: '#f0fdf4', border: '#bbf7d0', text: '#166534', label: '🟢 سالم' };
  }

  function injectGroupButtons() {
    const page = document.getElementById('link-sell');
    if (!page || document.getElementById('lsGroupBar')) return;
    const box = page.querySelector('#lsListBox');
    if (!box) return;
    const bar = document.createElement('div');
    bar.id = 'lsGroupBar';
    bar.style.cssText = 'display:flex;gap:0.5rem;flex-wrap:wrap;margin-bottom:0.8rem;';
    bar.innerHTML = `
      <button onclick="window.__LSS_autoAllFIFO()" style="flex:1;min-width:140px;background:linear-gradient(135deg,#16a34a,#15803d);color:white;border:none;padding:0.7rem 1rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">⚡ اتصال خودکار همه (FIFO)</button>
      <button onclick="window.__LSS_clearAll()" style="flex:1;min-width:140px;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.7rem 1rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">✖ پاک کردن همه‌ی اتصال‌ها</button>
    `;
    box.parentNode.insertBefore(bar, box);
  }

  function autoAllFIFO() {
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));
    if (!unlinked.length) return alert('همه‌ی فروش‌ها قبلاً متصل شدن.');
    if (!confirm(`${unlinked.length} فروشِ بدون اتصال به روش FIFO وصل بشن؟ (فروش‌های متصل دست‌نخورده می‌مونن)`)) return;

    let totalLinked = 0;
    let totalPartial = 0;
    unlinked.forEach(sell => {
      const candidates = candidateBuysForSell(sell, sells);
      if (!candidates.length) { totalPartial++; return; }
      let need = (+sell.weight || 0);
      const picks = [];
      for (const c of candidates) {
        if (need <= 0.0001) break;
        const take = Math.min(need, c.remain);
        if (take > 0.0001) {
          if (!sell.linkedBuys) sell.linkedBuys = [];
          sell.linkedBuys.push({ buyId: c.buy.id, weight: +take.toFixed(1) });
          picks.push(take);
          need -= take;
        }
      }
      if (picks.length) totalLinked++;
      if (need > 0.0001) totalPartial++;
    });

    saveSells(sells);
    renderAll();
    alert(`✅ ${totalLinked} فروش متصل شد.` + (totalPartial ? `\n⚠️ ${totalPartial} فروش به‌طور کامل متصل نشد (خرید کافی نبود).` : ''));
  }

  function clearAll() {
    const sells = getSells();
    const linked = sells.filter(s => s.linkedBuys && s.linkedBuys.length);
    if (!linked.length) return alert('هیچ فروشی متصل نیست.');
    if (!confirm(`اتصال ${linked.length} فروش پاک بشه؟ این کار برگشت‌پذیر نیست.`)) return;
    sells.forEach(s => { delete s.linkedBuys; });
    saveSells(sells);
    renderAll();
    alert('✅ همه‌ی اتصال‌ها پاک شد.');
  }

  function injectStockTable() {
    const page = document.getElementById('link-sell');
    if (!page || document.getElementById('lsStockTable')) return;
    const box = page.querySelector('#lsListBox');
    if (!box) return;
    const stockBox = document.createElement('div');
    stockBox.id = 'lsStockTable';
    stockBox.style.cssText = 'margin-top:1.2rem;background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
    box.parentNode.appendChild(stockBox);
  }

  function renderStockTable() {
    const box = document.getElementById('lsStockTable');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();
    if (!buys.length) {
      box.innerHTML = '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">📊 موجودی خریدها</h3><p style="text-align:center;color:#999;font-size:0.85rem;">هنوز خریدی ثبت نشده.</p>';
      return;
    }

    const rows = buys.map(b => {
      const used = usedFromBuy(b.id, sells);
      const remain = (+b.weight || 0) - used;
      return { buy: b, used, remain };
    }).sort((a, b) => (typeof jalaliToNum === 'function'
      ? jalaliToNum(b.buy.date) - jalaliToNum(a.buy.date)
      : 0));

    let html = `<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">📊 موجودی خریدها</h3>
      <table style="width:100%;border-collapse:collapse;font-size:0.78rem;">
      <thead><tr style="background:#f1f5f9;">
        <th style="padding:0.4rem;text-align:right;color:#475569;">تاریخ</th>
        <th style="padding:0.4rem;text-align:right;color:#475569;">میوه</th>
        <th style="padding:0.4rem;text-align:center;color:#475569;">کل</th>
        <th style="padding:0.4rem;text-align:center;color:#475569;">مصرف</th>
        <th style="padding:0.4rem;text-align:center;color:#475569;">باقی</th>
        <th style="padding:0.4rem;text-align:center;color:#475569;">وضعیت</th>
      </tr></thead><tbody>`;

    rows.forEach(r => {
      const c = stockColor(r.remain, r.buy.weight);
      const linkedSells = sells.filter(s => (s.linkedBuys || []).some(lb => String(lb.buyId) === String(r.buy.id)));
      const sellsDetail = linkedSells.length
        ? linkedSells.map(s => `${safeShowDate(s.date)} — ${s.hotel}: ${safeFmt((s.linkedBuys.find(lb => String(lb.buyId) === String(r.buy.id)) || {}).weight || 0)}kg`).join('<br>')
        : '<span style="color:#94a3b8;">—</span>';
      html += `<tr style="border-bottom:1px solid #f1f5f9;">
        <td style="padding:0.4rem;color:#334155;">${safeShowDate(r.buy.date)}</td>
        <td style="padding:0.4rem;color:#334155;">${r.buy.fruit}</td>
        <td style="padding:0.4rem;text-align:center;color:#475569;">${safeFmt(r.buy.weight)}</td>
        <td style="padding:0.4rem;text-align:center;color:#ea580c;">${safeFmt(r.used)}</td>
        <td style="padding:0.4rem;text-align:center;font-weight:bold;color:${c.text};">${safeFmt(r.remain)}</td>
        <td style="padding:0.4rem;text-align:center;"><span style="background:${c.bg};border:1px solid ${c.border};color:${c.text};padding:0.15rem 0.4rem;border-radius:0.3rem;font-size:0.7rem;">${c.label}</span></td>
      </tr>`;
      html += `<tr><td colspan="6" style="padding:0.2rem 0.4rem 0.5rem 0.4rem;font-size:0.7rem;color:#64748b;border-bottom:1px solid #f1f5f9;">${sellsDetail}</td></tr>`;
    });

    html += `</tbody></table>`;
    box.innerHTML = html;
  }

  function injectDashboardStock() {
    const dash = document.getElementById('dashboard');
    if (!dash || document.getElementById('dashOpenBuys')) return;
    const box = document.createElement('div');
    box.id = 'dashOpenBuys';
    box.style.cssText = 'margin-top:1.2rem;background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
    dash.appendChild(box);
  }

  function renderDashboardStock() {
    const box = document.getElementById('dashOpenBuys');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();
    const open = buys.map(b => {
      const used = usedFromBuy(b.id, sells);
      const remain = (+b.weight || 0) - used;
      return { buy: b, used, remain };
    }).filter(r => r.remain > 0.0001);

    if (!open.length) {
      box.innerHTML = '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">📦 موجودی خریدهای باز</h3><p style="text-align:center;color:#999;font-size:0.85rem;">همه‌ی خریدها تموم شدن یا هنوز خریدی ثبت نشده.</p>';
      return;
    }

    open.sort((a, b) => (typeof jalaliToNum === 'function' ? jalaliToNum(b.buy.date) - jalaliToNum(a.buy.date) : 0));

    let html = `<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">📦 موجودی خریدهای باز (${open.length})</h3><div style="display:flex;flex-direction:column;gap:0.4rem;">`;
    open.forEach(r => {
      const c = stockColor(r.remain, r.buy.weight);
      html += `<div style="display:flex;justify-content:space-between;align-items:center;background:${c.bg};border:1px solid ${c.border};padding:0.5rem 0.7rem;border-radius:0.5rem;font-size:0.78rem;">
        <div><b>${r.buy.fruit}</b> — ${safeShowDate(r.buy.date)}</div>
        <div style="color:${c.text};font-weight:bold;">باقی: ${safeFmt(r.remain)} از ${safeFmt(r.buy.weight)} کیلو</div>
      </div>`;
    });
    html += `</div>`;
    box.innerHTML = html;
  }

  function injectBuyPageInfo() {
    const list = document.getElementById('buyList');
    if (!list) return;
    const buys = getBuys();
    const sells = getSells();
    const tryPatch = setInterval(() => {
      const items = list.querySelectorAll('li');
      if (!items.length) return;
      items.forEach(li => {
        if (li.dataset.lssPatched) return;
        const btn = li.querySelector('button[onclick*="editBuy"]');
        if (!btn) return;
        const m = btn.getAttribute('onclick').match(/editBuy\((\d+)\)/);
        if (!m) return;
        const buyId = m[1];
        const buy = buys.find(b => String(b.id) === String(buyId));
        if (!buy) return;
        const used = usedFromBuy(buy.id, sells);
        const remain = (+buy.weight || 0) - used;
        const c = stockColor(remain, buy.weight);
        const info = document.createElement('div');
        info.style.cssText = `font-size:0.7rem;color:${c.text};margin-top:0.25rem;`;
        info.innerHTML = `مصرف‌شده: <b>${safeFmt(used)}</b> — باقی‌مانده: <b>${safeFmt(remain)}</b> کیلو ${c.label}`;
        li.style.flexWrap = 'wrap';
        li.appendChild(info);
        li.dataset.lssPatched = '1';
      });
    }, 600);
    let tries = 0;
    const stop = setInterval(() => {
      tries++;
      if (tries > 10) { clearInterval(tryPatch); clearInterval(stop); }
    }, 600);
  }

  function renderAll() {
    injectGroupButtons();
    injectStockTable();
    renderStockTable();
    injectDashboardStock();
    renderDashboardStock();
    injectBuyPageInfo();
  }

  function init() {
    const tryInject = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        renderAll();
        const origShowPage = window.showPage;
        if (typeof origShowPage === 'function' && !window.__LSS_wrapped) {
          window.__LSS_wrapped = true;
          window.showPage = function (id) {
            origShowPage(id);
            if (id === 'link-sell') renderAll();
            if (id === 'dashboard') { injectDashboardStock(); renderDashboardStock(); }
            if (id === 'buy') injectBuyPageInfo();
          };
        }
        clearInterval(tryInject);
      }
    }, 400);
  }

  window.__LSS_autoAllFIFO = autoAllFIFO;
  window.__LSS_clearAll = clearAll;
  window.__LSS_renderAll = renderAll;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
