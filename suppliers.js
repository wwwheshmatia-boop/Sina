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

  function getSuppliers() { return LS.get('suppliers'); }
  function saveSuppliers(s) { LS.set('suppliers', s); }
  function getBuys() { return LS.get('buys'); }
  function saveBuys(b) { LS.set('buys', b); }
  function getSells() { return LS.get('sells'); }

  const safeFmt = (n) => (typeof fmt === 'function' ? fmt(n) : String(Math.round(n)));
  const safeShowDate = (d) => (typeof showDate === 'function' ? showDate(d) : (d || ''));

  // تزریق فیلد فروشنده توی فرم خرید
  function injectSupplierField() {
    const form = document.getElementById('buyForm');
    if (!form || document.getElementById('buySupplier')) return;
    const supplierDiv = document.createElement('div');
    supplierDiv.style.cssText = 'display:flex;gap:0.3rem;margin-bottom:0.5rem;';
    supplierDiv.innerHTML = '<select id="buySupplier" style="flex:2;padding:0.55rem;border:1px solid #cbd5e1;border-radius:0.45rem;font-size:0.85rem;"><option value="">فروشنده...</option></select><input type="text" id="buySupplierNew" placeholder="یا اسم جدید" style="flex:1;padding:0.55rem;border:1px solid #cbd5e1;border-radius:0.45rem;font-size:0.85rem;"><button type="button" id="buySupplierAdd" style="background:#16a34a;color:white;border:none;padding:0.5rem 0.7rem;border-radius:0.45rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">➕</button>';
    const firstInput = form.querySelector('input, select, label');
    if (firstInput) form.insertBefore(supplierDiv, firstInput);
    else form.appendChild(supplierDiv);

    document.getElementById('buySupplierAdd').onclick = () => {
      const name = document.getElementById('buySupplierNew').value.trim();
      if (!name) return alert('اسم فروشنده رو بنویس.');
      const suppliers = getSuppliers();
      if (suppliers.find(s => s.name === name)) return alert('این فروشنده قبلاً ثبت شده.');
      suppliers.push({ id: Date.now(), name, createdAt: Date.now() });
      saveSuppliers(suppliers);
      document.getElementById('buySupplierNew').value = '';
      renderSuppliersDropdown();
      document.getElementById('buySupplier').value = name;
      alert('✅ فروشنده اضافه شد.');
    };
  }

  function renderSuppliersDropdown() {
    const sel = document.getElementById('buySupplier');
    if (!sel) return;
    const suppliers = getSuppliers();
    const cur = sel.value;
    sel.innerHTML = '<option value="">فروشنده...</option>' + suppliers.map(s => '<option value="' + s.name + '">' + s.name + '</option>').join('');
    sel.value = cur;
  }

  // پچ فرم خرید: هنگام ثبت، فروشنده ذخیره بشه
  function patchBuyForm() {
    const form = document.getElementById('buyForm');
    if (!form || form.dataset.supPatched) return;
    form.dataset.supPatched = '1';
    form.addEventListener('submit', () => {
      setTimeout(() => {
        const buys = getBuys();
        if (!buys.length) return;
        const last = buys[buys.length - 1];
        const sel = document.getElementById('buySupplier');
        const newInp = document.getElementById('buySupplierNew');
        let supplier = (sel ? sel.value : '') || (newInp ? newInp.value.trim() : '');
        if (supplier && !last.supplier) {
          last.supplier = supplier;
          saveBuys(buys);
          // اگه فروشنده جدید بود، به لیست اضافه کن
          const suppliers = getSuppliers();
          if (!suppliers.find(s => s.name === supplier)) {
            suppliers.push({ id: Date.now(), name: supplier, createdAt: Date.now() });
            saveSuppliers(suppliers);
          }
        }
      }, 100);
    });
  }

  // رندر گزارش‌ها توی صفحه گزارش
  function injectReportSections() {
    const report = document.getElementById('report');
    if (!report || document.getElementById('accountReportBox')) return;
    const box = document.createElement('div');
    box.id = 'accountReportBox';
    box.style.cssText = 'margin-top:1.5rem;';
    report.appendChild(box);
    renderReportSections();
  }

  function renderReportSections() {
    const box = document.getElementById('accountReportBox');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();

    // گزارش فروشنده‌ها
    const supplierMap = {};
    buys.forEach(b => {
      const name = b.supplier || 'نامشخص';
      if (!supplierMap[name]) supplierMap[name] = { count: 0, total: 0 };
      supplierMap[name].count++;
      supplierMap[name].total += (+b.weight || 0) * (+b.price || 0);
    });

    // گزارش هتل‌ها
    const hotelMap = {};
    sells.forEach(s => {
      const name = s.hotel || 'نامشخص';
      if (!hotelMap[name]) hotelMap[name] = { count: 0, revenue: 0, cost: 0, profit: 0 };
      hotelMap[name].count++;
      const revenue = (+s.weight || 0) * (+s.price || 0);
      const cost = (typeof getSellCost === 'function') ? getSellCost(s) : 0;
      hotelMap[name].revenue += revenue;
      hotelMap[name].cost += cost;
      hotelMap[name].profit += revenue - cost;
    });

    let html = '';

    // فاکتور خرید بر اساس فروشنده
    const supplierKeys = Object.keys(supplierMap);
    if (supplierKeys.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#1e40af;font-size:0.95rem;margin-bottom:0.5rem;">📥 فاکتور خرید — بر اساس فروشنده</h3>';
      supplierKeys.sort((a, b) => supplierMap[b].total - supplierMap[a].total).forEach(name => {
        const d = supplierMap[name];
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem;border-bottom:1px dashed #e2e8f0;font-size:0.8rem;">';
        html += '<span><b>' + name + '</b> — ' + d.count + ' فاکتور</span>';
        html += '<span style="color:#1e40af;font-weight:bold;">' + safeFmt(d.total) + ' ریال</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // فاکتور فروش بر اساس هتل
    const hotelKeys = Object.keys(hotelMap);
    if (hotelKeys.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#166534;font-size:0.95rem;margin-bottom:0.5rem;">📤 فاکتور فروش — سود بر اساس هتل</h3>';
      hotelKeys.sort((a, b) => hotelMap[b].profit - hotelMap[a].profit).forEach(name => {
        const d = hotelMap[name];
        const profitColor = d.profit >= 0 ? '#166534' : '#dc2626';
        html += '<div style="padding:0.5rem;border-bottom:1px dashed #e2e8f0;font-size:0.8rem;">';
        html += '<div style="display:flex;justify-content:space-between;"><span><b>' + name + '</b> — ' + d.count + ' فاکتور</span><span style="color:' + profitColor + ';font-weight:bold;">سود: ' + safeFmt(d.profit) + ' ریال</span></div>';
        html += '<div style="font-size:0.7rem;color:#64748b;margin-top:0.2rem;">فروش: ' + safeFmt(d.revenue) + ' | بهای تمام: ' + safeFmt(d.cost) + '</div>';
        html += '</div>';
      });
      html += '</div>';
    }

    if (!html) html = '<p style="text-align:center;color:#94a3b8;font-size:0.85rem;">داده‌ای برای گزارش نیست.</p>';
    box.innerHTML = html;
  }

  // راه‌اندازی
  function init() {
    const t = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectSupplierField();
        renderSuppliersDropdown();
        patchBuyForm();
        const origShow = window.showPage;
        if (typeof origShow === 'function' && !window.__SUP_showPatched) {
          window.__SUP_showPatched = true;
          window.showPage = function (id) {
            origShow(id);
            if (id === 'buy') { setTimeout(() => { injectSupplierField(); renderSuppliersDropdown(); }, 100); }
            if (id === 'report') { setTimeout(() => { injectReportSections(); renderReportSections(); }, 200); }
          };
        }
        clearInterval(t);
      }
    }, 500);

    // هر ۲ ثانیه گزارش رو رفرش کن
    setInterval(() => {
      const box = document.getElementById('accountReportBox');
      if (box) renderReportSections();
    }, 2000);
  }

  window.__SUP_refresh = renderReportSections;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
