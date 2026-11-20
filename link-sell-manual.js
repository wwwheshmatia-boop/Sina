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

  function getMatches() {
    if (!currentBooth) return {};
    try { return JSON.parse(localStorage.getItem('matches_' + currentBooth) || '{}'); }
    catch (e) { return {}; }
  }
  function saveMatches(m) {
    if (!currentBooth) return;
    localStorage.setItem('matches_' + currentBooth, JSON.stringify(m));
  }

  function getLearning() {
    if (!currentBooth) return {};
    try { return JSON.parse(localStorage.getItem('learning_' + currentBooth) || '{}'); }
    catch (e) { return {}; }
  }
  function saveLearning(l) {
    if (!currentBooth) return;
    localStorage.setItem('learning_' + currentBooth, JSON.stringify(l));
  }

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
    const sellName = safeNormalize(sell.fruit);
    const matches = getMatches();
    const allBuys = getBuys();

    // خریدهای هم‌نام یا تطبیق‌شده
    const result = allBuys.map(b => {
      const buyName = safeNormalize(b.fruit);
      const isMatch = (buyName === sellName) || (matches[sell.fruit] && matches[sell.fruit] === b.fruit) || (matches[b.fruit] && matches[b.fruit] === sell.fruit);
      const remain = remainOfBuy(b, sells);
      return { buy: b, remain, isMatch };
    }).filter(x => x.isMatch && x.remain > 0.0001);

    // اگه هیچی نبود، همه‌ی خریدها رو نشون بده
    if (result.length === 0) {
      return allBuys.map(b => ({ buy: b, remain: remainOfBuy(b, sells), isMatch: false })).filter(x => x.remain > 0.0001);
    }

    result.sort((a, b) => {
      const da = jalaliToNumSafe(a.buy.date);
      const db = jalaliToNumSafe(b.buy.date);
      return da - db;
    });
    return result;
  }

  function jalaliToNumSafe(d) {
    if (typeof jalaliToNum === 'function') return jalaliToNum(d);
    if (!d) return 0;
    const p = String(d).replace(/[^\d]/g, '-').split('-').filter(Boolean);
    if (p.length < 3) return 0;
    return parseInt(p[0]) * 10000 + parseInt(p[1]) * 100 + parseInt(p[2]);
  }

  /* ========== تزریق صفحه ========== */
  function injectPage() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('link-sell-manual')) return;
    const sec = document.createElement('section');
    sec.id = 'link-sell-manual';
    sec.className = 'page';
    sec.innerHTML = '<div id="lsmMain"></div>';
    main.appendChild(sec);
  }

  function injectMenu() {
    const menu = document.getElementById('mainMenu');
    if (!menu || document.getElementById('menu-link-sell-manual')) return;

    // حذف آیتم کدینگ هتل‌ها
    const hotelCoding = menu.querySelector('[onclick*="showPage(\'coding\')"]');
    if (hotelCoding) hotelCoding.remove();

    const item = document.createElement('div');
    item.className = 'menu-item';
    item.id = 'menu-link-sell-manual';
    item.textContent = '🔗 اتصال فروش به خرید';
    item.onclick = () => { showPage('link-sell-manual'); closeMenu(); };
    const logout = menu.querySelector('.logout-item');
    if (logout) menu.insertBefore(item, logout);
    else menu.appendChild(item);
  }

  /* ========== رندر ========== */
  function render() {
    const box = document.getElementById('lsmMain');
    if (!box) return;
    const sells = getSells();
    const unlinked = sells.filter(s => !(s.linkedBuys && s.linkedBuys.length));

    let html = `
      <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:1.2rem;border-radius:1rem;margin-bottom:1rem;">
        <h2 style="font-size:1.1rem;margin-bottom:0.3rem;">🔗 اتصال فروش به خرید (دستی)</h2>
        <p style="font-size:0.8rem;opacity:0.9;">هر فروش رو به یک یا چند خرید وصل کن. سیستم از اسم‌ها یاد می‌گیره.</p>
      </div>
    `;

    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem;">';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#1e40af;">' + sells.length + '</div><div style="font-size:0.7rem;color:#1e40af;">کل فروش</div></div>';
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#991b1b;">' + unlinked.length + '</div><div style="font-size:0.7rem;color:#991b1b;">بدون اتصال</div></div>';
    html += '</div>';

    if (!unlinked.length) {
      html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:1rem;border-radius:1rem;text-align:center;color:#166534;font-size:0.9rem;">🎉 همه‌ی فروش‌ها متصل هستن.</div>';
      box.innerHTML = html;
      return;
    }

    if (unlinked.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">📋 فروش‌های بدون اتصال (' + unlinked.length + ')</h3>';
      unlinked.forEach(s => {
        html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;padding:0.6rem;border-radius:0.5rem;margin-bottom:0.5rem;font-size:0.8rem;">';
        html += '<div><b>' + safeShowDate(s.date) + '</b> — ' + (s.hotel || 'نامشخص') + ' — <b>' + (s.fruit || '?') + '</b> — ' + safeFmt(s.weight) + ' کیلو × ' + safeFmt(s.price) + ' ریال</div>';
        html += '<div style="margin-top:0.4rem;"><button onclick="window.__LSM_openLink(' + s.id + ')" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;padding:0.4rem 0.7rem;border-radius:0.4rem;font-weight:bold;cursor:pointer;font-size:0.75rem;">🔗 اتصال به خرید</button></div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // لیست فروش‌های متصل (با ویرایش)
    const linkedSells = sells.filter(s => s.linkedBuys && s.linkedBuys.length);
    if (linkedSells.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#166534;font-size:0.95rem;margin-bottom:0.5rem;">✅ فروش‌های متصل (' + linkedSells.length + ')</h3>';
      linkedSells.forEach(s => {
        const totalLinked = s.linkedBuys.reduce((a, lb) => a + (+lb.weight || 0), 0);
        const isFull = Math.abs(totalLinked - (+s.weight || 0)) < 0.01;
        html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.6rem;border-radius:0.5rem;margin-bottom:0.5rem;font-size:0.8rem;">';
        html += '<div><b>' + safeShowDate(s.date) + '</b> — ' + (s.hotel || 'نامشخص') + ' — <b>' + (s.fruit || '?') + '</b> — ' + safeFmt(s.weight) + ' کیلو</div>';
        html += '<div style="font-size:0.7rem;color:#166534;margin-top:0.2rem;">' + (isFull ? '✅ کامل متصل' : '⚠️ ' + safeFmt(totalLinked) + ' از ' + safeFmt(s.weight) + ' کیلو متصل') + '</div>';
        // جزئیات
        html += '<div style="font-size:0.7rem;color:#64748b;margin-top:0.2rem;">';
        s.linkedBuys.forEach(lb => {
          const buy = getBuys().find(b => String(b.id) === String(lb.buyId));
          if (buy) html += '🔗 ' + safeShowDate(buy.date) + ' — ' + buy.fruit + ' — ' + safeFmt(lb.weight) + ' کیلو (فی ' + safeFmt(buy.price) + ')<br>';
        });
        html += '</div>';
        html += '<div style="margin-top:0.4rem;display:flex;gap:0.3rem;flex-wrap:wrap;">';
        html += '<button onclick="window.__LSM_editLink(' + s.id + ')" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:0.35rem 0.6rem;border-radius:0.4rem;font-weight:bold;cursor:pointer;font-size:0.7rem;">✏️ ویرایش</button>';
        html += '<button onclick="window.__LSM_unlink(' + s.id + ')" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.35rem 0.6rem;border-radius:0.4rem;font-weight:bold;cursor:pointer;font-size:0.7rem;">🗑️ حذف اتصال</button>';
        html += '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    box.innerHTML = html;
  }

  /* ========== مودال اتصال ========== */
  function openLinkModal(sellId) {
    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(sellId));
    if (!sell) return;

    const candidates = candidateBuysForSell(sell, sells);
    if (!candidates.length) {
      alert('هیچ خریدی با موجودی باقی‌مانده برای این میوه پیدا نشد.');
      return;
    }

    const already = (sell.linkedBuys || []).reduce((a, x) => a + (+x.weight || 0), 0);
    let remainingToLink = (+sell.weight || 0) - already;
    if (remainingToLink <= 0) {
      alert('این فروش قبلاً به‌طور کامل متصل شده.');
      return;
    }

    const modal = document.createElement('div');
    modal.id = 'lsmModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:3000;display:flex;align-items:center;justify-content:center;padding:1rem;';
    modal.innerHTML = `
      <div style="background:white;border-radius:1rem;padding:1rem;width:100%;max-width:460px;max-height:90vh;overflow-y:auto;">
        <h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">🔗 اتصال فروش به خرید</h3>
        <p style="font-size:0.78rem;color:#666;margin-bottom:0.7rem;">
          فروش: <b>${safeShowDate(sell.date)} — ${sell.hotel} — ${sell.fruit}</b><br>
          وزن کل: <b>${(+sell.weight).toFixed(1)} کیلو</b> — باقی‌مانده: <b id="lsmRemainLabel">${remainingToLink.toFixed(1)} کیلو</b>
        </p>
        <div id="lsmCandidateList" style="max-height:300px;overflow-y:auto;border:1px solid #e2e8f0;border-radius:0.5rem;padding:0.4rem;"></div>
        <div style="margin-top:0.7rem;display:flex;gap:0.4rem;flex-wrap:wrap;">
          <button onclick="window.__LSM_confirm()" style="flex:1;background:#2563eb;color:white;border:none;padding:0.6rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">✅ تأیید اتصال</button>
          <button onclick="window.__LSM_closeModal()" style="flex:1;background:#eee;color:#333;border:none;padding:0.6rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">انصراف</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    window.__LSM_ctx = { sellId: sell.id, candidates, remainingToLink };
    renderCandidates(candidates);
  }

  function renderCandidates(candidates) {
    const box = document.getElementById('lsmCandidateList');
    if (!box) return;
    box.innerHTML = candidates.map((c, idx) => {
      const id = 'lsmCand_' + idx;
      const buy = c.buy;
      const matchBadge = c.isMatch ? ' <span style="background:#dcfce7;color:#166534;padding:0.1rem 0.3rem;border-radius:0.2rem;font-size:0.65rem;">✅ تطبیق</span>' : ' <span style="background:#fef3c7;color:#92400e;padding:0.1rem 0.3rem;border-radius:0.2rem;font-size:0.65rem;">⚠️ غیرمطابق</span>';
      return `
        <div style="display:flex;align-items:center;gap:0.4rem;padding:0.4rem;border-bottom:1px dashed #e2e8f0;">
          <input type="checkbox" id="${id}_chk" onchange="window.__LSM_toggle(${idx})" style="width:18px;height:18px;cursor:pointer;">
          <div style="flex:1;font-size:0.75rem;line-height:1.4;">
            <div><b>${safeShowDate(buy.date)}</b> — ${buy.fruit}${matchBadge}</div>
            <div style="color:#64748b;">فی: ${safeFmt(buy.price)} | موجودی خرید: ${safeFmt(c.remain)} کیلو</div>
          </div>
          <input type="number" id="${id}_w" step="0.1" min="0" max="${c.remain}" placeholder="کیلو" disabled
                 style="width:70px;padding:0.3rem;border:1px solid #cbd5e1;border-radius:0.3rem;font-size:0.75rem;text-align:center;">
        </div>
      `;
    }).join('');
  }

  function toggleCandidate(idx) {
    const chk = document.getElementById('lsmCand_' + idx + '_chk');
    const w = document.getElementById('lsmCand_' + idx + '_w');
    if (!chk || !w) return;
    w.disabled = !chk.checked;
    if (chk.checked && (!w.value || +w.value === 0)) {
      const ctx = window.__LSM_ctx;
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
    const ctx = window.__LSM_ctx;
    if (!ctx) return 0;
    let s = 0;
    ctx.candidates.forEach((_, idx) => {
      const chk = document.getElementById('lsmCand_' + idx + '_chk');
      const w = document.getElementById('lsmCand_' + idx + '_w');
      if (chk && chk.checked && w) s += +w.value || 0;
    });
    return s;
  }

  function updateRemainLabel() {
    const ctx = window.__LSM_ctx;
    if (!ctx) return;
    const lbl = document.getElementById('lsmRemainLabel');
    if (!lbl) return;
    const used = getSumChecked();
    const remain = ctx.remainingToLink - used;
    lbl.textContent = remain.toFixed(1) + ' کیلو';
    lbl.style.color = remain < -0.0001 ? '#dc2626' : (remain < 0.0001 ? '#16a34a' : '#1e293b');
  }

  function confirmLink() {
    const ctx = window.__LSM_ctx;
    if (!ctx) return;
    const used = getSumChecked();
    if (used <= 0.0001) return alert('هیچ خریدی انتخاب نشده.');
    if (used > ctx.remainingToLink + 0.0001) return alert('مجموع انتخاب‌شده از باقی‌مانده بیشتره.');

    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(ctx.sellId));
    if (!sell) return;

    if (!sell.linkedBuys) sell.linkedBuys = [];
    const linkedFruits = [];

    ctx.candidates.forEach((c, idx) => {
      const chk = document.getElementById('lsmCand_' + idx + '_chk');
      const w = document.getElementById('lsmCand_' + idx + '_w');
      if (chk && chk.checked && w) {
        const ww = +w.value || 0;
        if (ww > 0) {
          sell.linkedBuys.push({ buyId: c.buy.id, weight: +ww.toFixed(1) });
          if (c.buy.fruit && safeNormalize(c.buy.fruit) !== safeNormalize(sell.fruit)) {
            linkedFruits.push(c.buy.fruit);
          }
        }
      }
    });

    saveSells(sells);

    // ذخیره‌ی تطبیق (اسم فروش → اسم خرید) و یادگیری
    if (linkedFruits.length > 0) {
      const matches = getMatches();
      const learning = getLearning();
      linkedFruits.forEach(buyFruit => {
        matches[sell.fruit] = buyFruit;
        if (!learning[sell.fruit]) learning[sell.fruit] = { suggestedMatch: buyFruit, count: 0, confidence: 0 };
        learning[sell.fruit].suggestedMatch = buyFruit;
        learning[sell.fruit].count++;
        learning[sell.fruit].confidence = Math.min(0.95, 0.5 + learning[sell.fruit].count * 0.1);
        learning[sell.fruit].lastUsed = Date.now();
      });
      saveMatches(matches);
      saveLearning(learning);
    }

    closeModal();
    render();
    if (linkedFruits.length > 0) {
      alert('✅ اتصال ثبت شد.\n📚 سیستم یاد گرفت: «' + sell.fruit + '» → «' + linkedFruits.join('، ') + '»');
    } else {
      alert('✅ اتصال ثبت شد.');
    }
  }

  function closeModal() {
    const m = document.getElementById('lsmModal');
    if (m) m.remove();
    window.__LSM_ctx = null;
  }

  /* ========== موجودی (override) ========== */
  function usedFromBuyGlobal(buyId) {
    const sells = getSells();
    let sum = 0;
    sells.forEach(s => (s.linkedBuys || []).forEach(lb => {
      if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0;
    }));
    return sum;
  }

  window.stockOf = function (fruit) {
    if (fruit == null) return { bought: 0, sold: 0, remain: 0 };
    const target = safeNormalize(fruit);
    const buys = getBuys();
    const sells = getSells();
    let bought = 0, sold = 0;

    // خریدهای این میوه
    buys.forEach(b => {
      if (safeNormalize(b.fruit) === target) {
        bought += +b.weight || 0;
      }
    });

    // فروش‌های این میوه
    sells.forEach(s => {
      if (safeNormalize(s.fruit) !== target) return;
      const linkedWeight = (s.linkedBuys || []).reduce((a, lb) => a + (+lb.weight || 0), 0);
      sold += linkedWeight;
    });

    return { bought, sold, remain: +(bought - sold).toFixed(2) };
  };

  /* ========== راه‌اندازی ========== */
  function init() {
    const t = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectMenu();
        injectPage();
        const orig = window.showPage;
        if (typeof orig === 'function' && !window.__LSM_wrapped) {
          window.__LSM_wrapped = true;
          window.showPage = function (id) {
            orig(id);
            injectMenu();
            injectPage();
            if (id === 'link-sell-manual') setTimeout(render, 50);
          };
        }
        clearInterval(t);
      }
    }, 500);
  }

  function editLink(sellId) {
    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(sellId));
    // پاک کردن اتصال فعلی
    if (sell.linkedBuys) {
      delete sell.linkedBuys;
      saveSells(sells);
    }
    openLinkModal(sellId);
  }

  function unlink(sellId) {
    const sells = getSells();
    const sell = sells.find(s => String(s.id) === String(sellId));
    delete sell.linkedBuys;
    saveSells(sells);
    render();
    alert('✅ اتصال پاک شد.');
  }

  window.__LSM_editLink = editLink;
  window.__LSM_unlink = unlink;
  window.__LSM_openLink = openLinkModal;
  window.__LSM_toggle = toggleCandidate;
  window.__LSM_confirm = confirmLink;
  window.__LSM_closeModal = closeModal;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
