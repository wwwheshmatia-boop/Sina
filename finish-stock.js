(function () {
  'use strict';

  const LS = {
    get(key) {
      if (!currentBooth) return {};
      try { return JSON.parse(localStorage.getItem(key + '_' + currentBooth) || '{}'); }
      catch (e) { return {}; }
    },
    set(key, val) {
      if (!currentBooth) return;
      localStorage.setItem(key + '_' + currentBooth, JSON.stringify(val));
    }
  };

  function getFinished() { return LS.get('finished'); }
  function saveFinished(f) { LS.set('finished', f); }

  function safeNormalize(n) {
    if (!n) return '';
    try { return (typeof normalizeName === 'function') ? normalizeName(n) : n; }
    catch (e) { return n; }
  }

  // override stockOf: میوه‌های finished رو نادیده بگیر
  const origStockOf = window.stockOf;
  window.stockOf = function (fruit) {
    if (fruit == null) return { bought: 0, sold: 0, remain: 0 };
    const finished = getFinished();
    if (finished[fruit]) return { bought: 0, sold: 0, remain: 0 };
    if (typeof origStockOf === 'function') return origStockOf(fruit);
    return { bought: 0, sold: 0, remain: 0 };
  };

  // بستن پرونده: بعد از closeDay، finishedها رو صفر کن
  function patchCloseDay() {
    const orig = window.closeDay;
    if (typeof orig === 'function' && !window.__FINISH_closeDayPatched) {
      window.__FINISH_closeDayPatched = true;
      window.closeDay = function () {
        const result = orig.apply(this, arguments);
        setTimeout(() => {
          // میوه‌های موجود (بعد از بستن) رو چک کن
          const finished = getFinished();
          const finishedCount = Object.keys(finished).length;
          if (finishedCount > 0) {
            console.log('✅ ' + finishedCount + ' میوه‌ی تموم‌شده هنوز توی finished هستن');
          }
        }, 300);
        return result;
      };
    }
  }

  // رندر دکمه‌های «تمومش کن» توی داشبورد
  function renderFinishedButtons() {
    const box = document.getElementById('stockBox');
    if (!box) return;
    const finished = getFinished();
    // دکمه‌های «تمومش کن» رو به لیست اضافه کن
    const items = box.querySelectorAll('.report-row');
    items.forEach(row => {
      const nameSpan = row.querySelector('span');
      if (!nameSpan) return;
      const fruitName = nameSpan.textContent.trim();
      if (!fruitName) return;
      // اگه قبلاً دکمه اضافه شده، نادیده بگیر
      if (row.querySelector('.finish-btn')) return;
      // فقط برای «تموم شده» و «منفی»
      const badge = row.querySelector('.badge');
      if (!badge) return;
      if (!badge.classList.contains('ok')) return;
      const btn = document.createElement('button');
      btn.className = 'finish-btn';
      btn.textContent = '✅ تمومش کن';
      btn.style.cssText = 'background:#16a34a;color:white;border:none;padding:0.3rem 0.6rem;border-radius:0.4rem;font-weight:bold;cursor:pointer;font-size:0.7rem;margin-right:0.3rem;';
      btn.onclick = (e) => {
        e.stopPropagation();
        if (!confirm('«' + fruitName + '» از موجودی حذف بشه؟')) return;
        const f = getFinished();
        f[fruitName] = { finishedAt: Date.now() };
        saveFinished(f);
        alert('✅ «' + fruitName + '» تموم شد و از موجودی حذف شد.');
        if (typeof toggleStockList === 'function' && typeof stockListVisible !== 'undefined' && stockListVisible) {
          toggleStockList(stockListVisible);
        }
        if (typeof renderDashboard === 'function') renderDashboard();
      };
      row.appendChild(btn);
    });
  }

  // override toggleStockList برای تزریق دکمه‌ها
  function patchToggleStockList() {
    const orig = window.toggleStockList;
    if (typeof orig === 'function' && !window.__FINISH_togglePatched) {
      window.__FINISH_togglePatched = true;
      window.toggleStockList = function (type) {
        const result = orig.apply(this, arguments);
        setTimeout(renderFinishedButtons, 100);
        return result;
      };
    }
  }

  // دکمه‌ی «برگرداندن همه» توی تنظیمات
  function injectRestoreButton() {
    const dashboard = document.getElementById('dashboard');
    if (!dashboard || document.getElementById('finishRestoreBox')) return;
    const box = document.createElement('div');
    box.id = 'finishRestoreBox';
    box.style.cssText = 'margin-top:1rem;background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);';
    const finished = getFinished();
    const count = Object.keys(finished).length;
    if (count === 0) return;
    box.innerHTML = '<h3 style="color:#1e293b;font-size:0.9rem;margin-bottom:0.5rem;">🗂️ میوه‌های تموم‌شده (' + count + ')</h3><div id="finishedListBox"></div>';
    dashboard.appendChild(box);
    renderFinishedList();
  }

  function renderFinishedList() {
    const box = document.getElementById('finishedListBox');
    if (!box) return;
    const finished = getFinished();
    const keys = Object.keys(finished);
    if (!keys.length) { box.innerHTML = ''; return; }
    box.innerHTML = keys.map(k => {
      return '<div style="display:flex;justify-content:space-between;align-items:center;background:#f8fafc;border:1px solid #e2e8f0;padding:0.4rem 0.6rem;border-radius:0.4rem;margin-bottom:0.3rem;font-size:0.8rem;"><span>' + k + '</span><button onclick="window.__FINISH_restore(\'' + k.replace(/'/g, "\\'") + '\')" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:0.2rem 0.5rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;font-weight:bold;">↩️ برگردون</button></div>';
    }).join('');
  }

  function restore(fruit) {
    const f = getFinished();
    delete f[fruit];
    saveFinished(f);
    if (typeof renderDashboard === 'function') renderDashboard();
    renderFinishedList();
    alert('✅ «' + fruit + '» برگشت.');
  }

  function init() {
    // MutationObserver روی stockBox
    const stockBox = document.getElementById('stockBox');
    if (stockBox && !stockBox.dataset.finishObserver) {
      stockBox.dataset.finishObserver = '1';
      const observer = new MutationObserver(() => {
        setTimeout(renderFinishedButtons, 50);
      });
      observer.observe(stockBox, { childList: true, subtree: true });
    }
    // هر ثانیه هم چک کن
    setInterval(() => {
      const sb = document.getElementById('stockBox');
      if (sb && sb.style.display !== 'none' && sb.innerHTML.length > 0) {
        renderFinishedButtons();
      }
    }, 1000);

    // بقیه‌ی init

    patchCloseDay();
    patchToggleStockList();

    // هر بار داشبورد رندر شد، دکمه‌ها و لیست رو چک کن
    const origRender = window.renderDashboard;
    if (typeof origRender === 'function' && !window.__FINISH_renderPatched) {
      window.__FINISH_renderPatched = true;
      window.renderDashboard = function () {
        origRender.apply(this, arguments);
        setTimeout(() => {
          renderFinishedButtons();
          injectRestoreButton();
        }, 200);
      };
    }

    const origShow = window.showPage;
    if (typeof origShow === 'function' && !window.__FINISH_showPatched) {
      window.__FINISH_showPatched = true;
      window.showPage = function (id) {
        origShow(id);
        if (id === 'dashboard') {
          setTimeout(() => {
            injectRestoreButton();
            renderFinishedButtons();
          }, 200);
        }
      };
    }
  }

  window.__FINISH_restore = restore;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
