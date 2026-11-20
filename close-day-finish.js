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

  // بعد از بستن پرونده: میوه‌های تموم‌شده و منفی رو finished کن
  function doFinish() {
    if (!currentBooth) return 0;

    const buys = JSON.parse(localStorage.getItem('buys_' + currentBooth) || '[]');
    const sells = JSON.parse(localStorage.getItem('sells_' + currentBooth) || '[]');
    const arch = JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]');
    const archBuys = arch.flatMap(a => a.buys || []);
    const archSells = arch.flatMap(a => a.sells || []);

    const allBuys = [...buys, ...archBuys];
    const allSells = [...sells, ...archSells];

    const fruits = new Set();
    allBuys.forEach(b => { if (b.fruit) fruits.add(b.fruit); });
    allSells.forEach(s => { if (s.fruit) fruits.add(s.fruit); });

    const finished = getFinished();
    let count = 0;

    fruits.forEach(f => {
      if (typeof window.stockOf === 'function') {
        try {
          const st = window.stockOf(f);
          if (st.remain <= 0.01) {
            finished[f] = { finishedAt: Date.now(), reason: st.remain < -0.01 ? 'منفی' : 'تموم', remain: st.remain };
            count++;
          }
        } catch (e) {}
      }
    });

    saveFinished(finished);
    return count;
  }

  // ذخیره‌ی closeDay اصلی
  function patch() {
    if (window.__CDF_patched) return;

    // ذخیره‌ی تابع اصلی
    const origClose = window.closeDay;

    // override با یه تابع جدید
    window.closeDay = function () {
      // قبل از بستن، finished کن
      const count = doFinish();

      // حالا closeDay اصلی رو صدا بزن
      let result;
      if (typeof origClose === 'function') {
        result = origClose.apply(this, arguments);
      }

      // بعد از بستن، dashboard رو رفرش کن
      setTimeout(() => {
        if (typeof renderDashboard === 'function') renderDashboard();
        if (count > 0) {
          console.log('✅ ' + count + ' میوه به finished اضافه شد');
        }
      }, 500);

      return result;
    };

    window.__CDF_patched = true;
    console.log('✅ close-day-finish: closeDay پچ شد');
  }

  // اگه closeDay هنوز تعریف نشده، صبر کن
  function init() {
    const t = setInterval(() => {
      if (typeof window.closeDay === 'function') {
        patch();
        clearInterval(t);
      }
    }, 300);

    // هر ۵ ثانیه چک کن پچ هست
    setInterval(patch, 5000);
  }

  window.__CDF_doFinish = doFinish;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
