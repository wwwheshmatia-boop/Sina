(function () {
  'use strict';

  const LS_KEY = 'control_errors';
  const MAX_ERRORS = 50;

  /* ========== ذخیره‌ی خطاها ========== */
  function getErrors() {
    if (!currentBooth) return [];
    try { return JSON.parse(localStorage.getItem(LS_KEY + '_' + currentBooth) || '[]'); }
    catch (e) { return []; }
  }
  function saveErrors(arr) {
    if (!currentBooth) return;
    // فقط ۵۰ تای آخر
    if (arr.length > MAX_ERRORS) arr = arr.slice(-MAX_ERRORS);
    localStorage.setItem(LS_KEY + '_' + currentBooth, JSON.stringify(arr));
  }
  function addError(err) {
    const errors = getErrors();
    const exists = errors.some(e => e.message === err.message && e.source === err.source && Math.abs(e.time - Date.now()) < 5000);
    if (exists) return;
    errors.push({ ...err, time: Date.now() });
    saveErrors(errors);
  }

  /* ========== گرفتن خطاهای JS ========== */
  window.addEventListener('error', function (e) {
    addError({
      type: 'code',
      message: e.message || 'خطای ناشناخته',
      source: (e.filename || '?') + ':' + (e.lineno || '?'),
      level: 'critical'
    });
  });
  window.addEventListener('unhandledrejection', function (e) {
    addError({
      type: 'code',
      message: 'Promise rejected: ' + (e.reason && e.reason.message ? e.reason.message : String(e.reason)),
      source: 'async',
      level: 'critical'
    });
  });

  /* ========== بررسی داده‌ها ========== */
  function getBuys() {
    if (!currentBooth) return [];
    try { return JSON.parse(localStorage.getItem('buys_' + currentBooth) || '[]'); } catch (e) { return []; }
  }
  function getSells() {
    if (!currentBooth) return [];
    try { return JSON.parse(localStorage.getItem('sells_' + currentBooth) || '[]'); } catch (e) { return []; }
  }
  function getArchives() {
    if (!currentBooth) return [];
    try { return JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]'); } catch (e) { return []; }
  }

  function checkData() {
    const dataErrors = [];
    const buys = getBuys();
    const sells = getSells();
    const arch = getArchives();

    // ۱) فی خالی
    const buyNoPrice = buys.filter(b => !b.price || b.price === 0);
    if (buyNoPrice.length) dataErrors.push({ type: 'data', message: buyNoPrice.length + ' خرید فی خرید خالی یا صفر دارن', level: 'critical', items: buyNoPrice.slice(0, 5) });

    const sellNoPrice = sells.filter(s => !s.price || s.price === 0);
    if (sellNoPrice.length) dataErrors.push({ type: 'data', message: sellNoPrice.length + ' فروش فی فروش خالی یا صفر دارن', level: 'critical', items: sellNoPrice.slice(0, 5) });

    // ۲) وزن صفر یا منفی
    const badWeight = [...buys, ...sells].filter(x => !x.weight || x.weight <= 0);
    if (badWeight.length) dataErrors.push({ type: 'data', message: badWeight.length + ' ردیف وزن صفر یا منفی دارن', level: 'critical', items: badWeight.slice(0, 5) });

    // ۳) تاریخ نامعتبر
    const badDate = [...buys, ...sells].filter(x => !x.date || !/^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(x.date));
    if (badDate.length) dataErrors.push({ type: 'data', message: badDate.length + ' ردیف تاریخ نامعتبر دارن', level: 'critical', items: badDate.slice(0, 5) });

    // ۴) اسم خالی
    const noName = [...buys, ...sells].filter(x => !x.fruit || !x.fruit.trim());
    if (noName.length) dataErrors.push({ type: 'data', message: noName.length + ' ردیف اسم میوه خالی دارن', level: 'critical', items: noName.slice(0, 5) });

    // ۵) تکراری (همون تاریخ + هتل + میوه + وزن + فی)
    const sellKeys = {};
    const dupSells = [];
    sells.forEach(s => {
      const k = s.date + '|' + s.hotel + '|' + s.fruit + '|' + s.weight + '|' + s.price;
      if (sellKeys[k]) dupSells.push(s);
      else sellKeys[k] = true;
    });
    if (dupSells.length) dataErrors.push({ type: 'data', message: dupSells.length + ' فروش تکراری پیدا شد', level: 'warning', items: dupSells.slice(0, 5) });

    // ۶) اسم‌های بدون تطبیق
    const matches = (function() {
      try { return JSON.parse(localStorage.getItem('matches_' + currentBooth) || '{}'); }
      catch (e) { return {}; }
    })();
    const allNames = [...new Set([...buys.map(b => b.fruit), ...sells.map(s => s.fruit)])].filter(Boolean);
    const unmatched = allNames.filter(n => !matches[n] && !matches[Object.keys(matches).find(k => matches[k] === n)]);
    // فقط اسم‌هایی که توی خرید/فروش هستن ولی توی matches نیستن
    const unmatchedFiltered = allNames.filter(n => !Object.keys(matches).includes(n) && !Object.values(matches).includes(n));
    if (unmatchedFiltered.length > 0) dataErrors.push({ type: 'data', message: unmatchedFiltered.length + ' اسم بدون تطبیق', level: 'info', items: unmatchedFiltered.slice(0, 5).map(n => ({ fruit: n })) });

    return dataErrors;
  }

  /* ========== بررسی سیستم ========== */
  function checkSystem() {
    const sysErrors = [];

    // service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(regs => {
        if (regs.length === 0) {
          // ثبت نشده
        }
      });
    }

    // localStorage
    let total = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      const v = localStorage.getItem(k) || '';
      total += k.length + v.length;
    }
    if (total > 4 * 1024 * 1024) {
      sysErrors.push({ type: 'system', message: 'فضای localStorage تقریباً پره (' + (total / 1024 / 1024).toFixed(1) + ' MB)', level: 'warning' });
    }

    // کلیدهای خراب
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k || !k.includes('_')) continue;
      try {
        const v = localStorage.getItem(k);
        if (v && (v.startsWith('{') || v.startsWith('['))) {
          JSON.parse(v);
        }
      } catch (e) {
        sysErrors.push({ type: 'system', message: 'کلید خراب: ' + k, level: 'warning' });
      }
    }

    return sysErrors;
  }

  /* ========== بررسی توابع ========== */
  function checkFunctions() {
    const fns = ['stockOf', 'normalizeName', 'DB', 'fmt', 'showDate', 'todayJalali', 'computeAllGroups'];
    const missing = [];
    fns.forEach(f => {
      if (typeof window[f] === 'undefined' && typeof window[f] !== 'function' && typeof window[f] !== 'object') {
        // چک کن توی scope global هست یا نه
        try {
          if (typeof eval(f) === 'undefined') missing.push(f);
        } catch (e) {
          missing.push(f);
        }
      }
    });
    return missing;
  }

  /* ========== رندر صفحه ========== */
  function renderControlCenter() {
    const box = document.getElementById('brainMain');
    if (!box) return;

    const codeErrors = getErrors().filter(e => e.type === 'code');
    const dataErrors = checkData();
    const sysErrors = checkSystem();
    const missingFns = checkFunctions();
    const buys = getBuys();
    const sells = getSells();
    const arch = getArchives();

    const totalCritical = codeErrors.length + dataErrors.filter(e => e.level === 'critical').length + sysErrors.filter(e => e.level === 'critical').length;
    const totalWarning = dataErrors.filter(e => e.level === 'warning').length + sysErrors.filter(e => e.level === 'warning').length;
    const totalInfo = dataErrors.filter(e => e.level === 'info').length;

    let html = '<div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:1.2rem;border-radius:1rem;margin-bottom:1rem;"><h2 style="font-size:1.1rem;margin-bottom:0.3rem;">🩺 عیب‌یابی سیستم</h2><p style="font-size:0.8rem;opacity:0.9;">بررسی خطاهای کد، داده و سیستم</p></div>';

    // آمار
    html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:0.5rem;margin-bottom:1rem;">';
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#991b1b;">' + totalCritical + '</div><div style="font-size:0.7rem;color:#991b1b;">بحرانی</div></div>';
    html += '<div style="background:#fef3c7;border:1px solid #fde68a;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#92400e;">' + totalWarning + '</div><div style="font-size:0.7rem;color:#92400e;">هشدار</div></div>';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#1e40af;">' + totalInfo + '</div><div style="font-size:0.7rem;color:#1e40af;">اطلاع</div></div>';
    html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.6rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#166534;">' + (buys.length + sells.length) + '</div><div style="font-size:0.7rem;color:#166534;">کل ردیف‌ها</div></div>';
    html += '</div>';

    // اگر همه‌چیز اوکی
    if (totalCritical === 0 && totalWarning === 0 && totalInfo === 0 && codeErrors.length === 0) {
      html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:1rem;border-radius:1rem;text-align:center;margin-bottom:1rem;">';
      html += '<div style="font-size:2rem;margin-bottom:0.5rem;">🎉</div>';
      html += '<h3 style="color:#166534;margin-bottom:0.5rem;">همه‌چیز سالمه!</h3>';
      html += '<p style="font-size:0.85rem;color:#666;">هیچ خطایی توی کد، داده یا سیستم پیدا نشد.</p>';
      html += '</div>';
    }

    // خطاهای کد
    if (codeErrors.length > 0) {
      html += '<div style="background:#fef2f2;padding:1rem;border-radius:1rem;border:1px solid #fecaca;margin-bottom:1rem;">';
      html += '<h3 style="color:#991b1b;font-size:0.95rem;margin-bottom:0.5rem;">🔴 خطاهای کد (' + codeErrors.length + ')</h3>';
      codeErrors.slice(-10).reverse().forEach(e => {
        html += '<div style="background:white;padding:0.5rem;border-radius:0.5rem;margin-bottom:0.4rem;border:1px solid #fecaca;font-size:0.75rem;">';
        html += '<div style="color:#991b1b;font-weight:bold;">' + e.message + '</div>';
        html += '<div style="color:#64748b;font-size:0.7rem;">' + e.source + ' — ' + new Date(e.time).toLocaleString('fa-IR') + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    // خطاهای داده
    if (dataErrors.length > 0) {
      html += '<div style="background:#fffbeb;padding:1rem;border-radius:1rem;border:1px solid #fde68a;margin-bottom:1rem;">';
      html += '<h3 style="color:#92400e;font-size:0.95rem;margin-bottom:0.5rem;">🟡 خطاهای داده (' + dataErrors.length + ')</h3>';
      dataErrors.forEach((e, i) => {
        const color = e.level === 'critical' ? '#dc2626' : e.level === 'warning' ? '#ea580c' : '#2563eb';
        html += '<div style="background:white;padding:0.5rem;border-radius:0.5rem;margin-bottom:0.4rem;border:1px solid #fde68a;font-size:0.75rem;">';
        html += '<div style="color:' + color + ';font-weight:bold;">' + e.message + '</div>';
        if (e.items && e.items.length) {
          html += '<div style="color:#64748b;font-size:0.7rem;margin-top:0.2rem;">' + e.items.map(x => x.fruit || x.date || '?').join('، ') + '</div>';
        }
        html += '</div>';
      });
      html += '</div>';
    }

    // خطاهای سیستم
    if (sysErrors.length > 0) {
      html += '<div style="background:#eff6ff;padding:1rem;border-radius:1rem;border:1px solid #bfdbfe;margin-bottom:1rem;">';
      html += '<h3 style="color:#1e40af;font-size:0.95rem;margin-bottom:0.5rem;">🔵 خطاهای سیستم (' + sysErrors.length + ')</h3>';
      sysErrors.forEach(e => {
        html += '<div style="background:white;padding:0.5rem;border-radius:0.5rem;margin-bottom:0.4rem;border:1px solid #bfdbfe;font-size:0.75rem;color:#1e40af;">' + e.message + '</div>';
      });
      html += '</div>';
    }

    // توابع گم‌شده
    if (missingFns.length > 0) {
      html += '<div style="background:#f8fafc;padding:1rem;border-radius:1rem;border:1px solid #e2e8f0;margin-bottom:1rem;">';
      html += '<h3 style="color:#475569;font-size:0.9rem;margin-bottom:0.5rem;">⚙️ توابع گم‌شده</h3>';
      html += '<div style="font-size:0.75rem;color:#64748b;">' + missingFns.join('، ') + '</div>';
      html += '</div>';
    }

    // دکمه‌ها
    html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">';
    html += '<button onclick="window.__CC_refresh()" style="flex:1;background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">🔄 بررسی مجدد</button>';
    if (codeErrors.length) {
      html += '<button onclick="window.__CC_clearErrors()" style="flex:1;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">🗑️ پاک کردن خطاهای کد</button>';
    }
    html += '</div>';

    box.innerHTML = html;
  }

  /* ========== توابع عمومی ========== */
  function refresh() {
    renderControlCenter();
  }
  function clearErrors() {
    if (!confirm('همه‌ی خطاهای کد پاک بشن؟')) return;
    saveErrors([]);
    renderControlCenter();
  }

  /* ========== راه‌اندازی ========== */
  function init() {
    // override showPage
    const orig = window.showPage;
    if (typeof orig === 'function' && !window.__CC_wrapped) {
      window.__CC_wrapped = true;
      window.showPage = function (id) {
        orig(id);
        if (id === 'analysis') {
          setTimeout(() => {
            // چک کن تب brain فعاله
            const brainTab = document.getElementById('analysisBrainTab');
            if (brainTab && brainTab.style.display !== 'none') {
              renderControlCenter();
            }
          }, 100);
        }
      };
    }

    // override __BRAIN_renderIntoAnalysis
    window.__BRAIN_renderIntoAnalysis = function () {
      const tab = document.getElementById('analysisBrainTab');
      if (tab) {
        tab.style.display = 'block';
        renderControlCenter();
      }
    };

    // هر بار چک کن
    setInterval(() => {
      const brainMain = document.getElementById('brainMain');
      if (brainMain && brainMain.children.length === 0 && currentBooth) {
        // اگه خالیه، رندر کن
      }
    }, 2000);
  }

  window.__CC_refresh = refresh;
  window.__CC_clearErrors = clearErrors;
  window.__CC_render = renderControlCenter;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
