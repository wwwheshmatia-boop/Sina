(function () {
  'use strict';

  const LS = {
    get(key) {
      if (!currentBooth) return [];
      try { return JSON.parse(localStorage.getItem(key + '_' + currentBooth) || '[]'); }
      catch (e) { return []; }
    }
  };

  function getBuys() { return LS.get('buys'); }
  function getSells() { return LS.get('sells'); }

  const safeFmt = (n) => (typeof fmt === 'function' ? fmt(n) : String(Math.round(n)));
  const safeShowDate = (d) => (typeof showDate === 'function' ? showDate(d) : (d || ''));

  // تزریق منو
  function injectMenu() {
    const menu = document.getElementById('mainMenu');
    if (!menu || document.getElementById('menu-accounting')) return;
    const item = document.createElement('div');
    item.className = 'menu-item';
    item.id = 'menu-accounting';
    item.textContent = '📒 حساب';
    item.onclick = () => { showPage('accounting'); closeMenu(); };
    const logout = menu.querySelector('.logout-item');
    if (logout) menu.insertBefore(item, logout);
    else menu.appendChild(item);
  }

  // تزریق صفحه
  function injectPage() {
    const main = document.querySelector('main');
    if (!main || document.getElementById('accounting')) return;
    const sec = document.createElement('section');
    sec.id = 'accounting';
    sec.className = 'page';
    sec.innerHTML = '<div id="accMain"></div>';
    main.appendChild(sec);
  }

  // رندر
  function render() {
    const box = document.getElementById('accMain');
    if (!box) return;
    const buys = getBuys();
    const sells = getSells();

    // آمار فروشنده‌ها
    const supplierMap = {};
    buys.forEach(b => {
      const name = b.supplier || 'نامشخص';
      if (!supplierMap[name]) supplierMap[name] = { count: 0, total: 0, weight: 0 };
      supplierMap[name].count++;
      supplierMap[name].total += (+b.weight || 0) * (+b.price || 0);
      supplierMap[name].weight += +b.weight || 0;
    });

    // آمار هتل‌ها
    const hotelMap = {};
    sells.forEach(s => {
      const name = s.hotel || 'نامشخص';
      if (!hotelMap[name]) hotelMap[name] = { count: 0, revenue: 0, cost: 0, profit: 0, weight: 0 };
      hotelMap[name].count++;
      const revenue = (+s.weight || 0) * (+s.price || 0);
      const cost = (typeof getSellCost === 'function') ? getSellCost(s) : 0;
      hotelMap[name].revenue += revenue;
      hotelMap[name].cost += cost;
      hotelMap[name].profit += revenue - cost;
      hotelMap[name].weight += +s.weight || 0;
    });

    const supplierKeys = Object.keys(supplierMap);
    const hotelKeys = Object.keys(hotelMap);

    let html = '<h2>📒 حساب</h2>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:1rem;">گزارش فاکتورهای خرید (بر اساس فروشنده) و فروش (بر اساس هتل).</p>';

    // تب‌ها
    html += '<div class="tabs" style="margin-bottom:0.8rem;">';
    html += '<button class="tab-btn active" onclick="window.__ACC_switchTab(\'buy\', this)">📥 فاکتور خرید</button>';
    html += '<button class="tab-btn" onclick="window.__ACC_switchTab(\'sell\', this)">📤 فاکتور فروش</button>';
    html += '</div>';

    // تب خرید
    html += '<div id="accTabBuy" style="display:block;">';
    if (!supplierKeys.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;text-align:center;color:#94a3b8;font-size:0.85rem;">هنوز خریدی ثبت نشده.</div>';
    } else {
      const totalAll = supplierKeys.reduce((a, k) => a + supplierMap[k].total, 0);
      const totalWeight = supplierKeys.reduce((a, k) => a + supplierMap[k].weight, 0);
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:0.8rem;">';
      html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#1e40af;">' + safeFmt(totalAll) + '</div><div style="font-size:0.7rem;color:#1e40af;">جمع خرید (ریال)</div></div>';
      html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#166534;">' + safeFmt(totalWeight) + ' کیلو</div><div style="font-size:0.7rem;color:#166534;">وزن کل</div></div>';
      html += '</div>';
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);">';
      html += '<h3 style="color:#1e40af;font-size:0.95rem;margin-bottom:0.5rem;">فروشنده‌ها (' + supplierKeys.length + ')</h3>';
      supplierKeys.sort((a, b) => supplierMap[b].total - supplierMap[a].total).forEach(name => {
        const d = supplierMap[name];
        html += '<div style="padding:0.6rem;border-bottom:1px dashed #e2e8f0;font-size:0.8rem;">';
        html += '<div style="display:flex;justify-content:space-between;"><span><b>' + name + '</b> — ' + d.count + ' فاکتور</span><span style="color:#1e40af;font-weight:bold;">' + safeFmt(d.total) + ' ریال</span></div>';
        html += '<div style="font-size:0.7rem;color:#64748b;margin-top:0.2rem;">وزن: ' + safeFmt(d.weight) + ' کیلو</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    // تب فروش
    html += '<div id="accTabSell" style="display:none;">';
    if (!hotelKeys.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;text-align:center;color:#94a3b8;font-size:0.85rem;">هنوز فروشی ثبت نشده.</div>';
    } else {
      const totalRevenue = hotelKeys.reduce((a, k) => a + hotelMap[k].revenue, 0);
      const totalProfit = hotelKeys.reduce((a, k) => a + hotelMap[k].profit, 0);
      html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:0.8rem;">';
      html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:#1e40af;">' + safeFmt(totalRevenue) + '</div><div style="font-size:0.7rem;color:#1e40af;">جمع فروش (ریال)</div></div>';
      html += '<div style="background:' + (totalProfit >= 0 ? '#f0fdf4;border:1px solid #bbf7d0' : '#fef2f2;border:1px solid #fecaca') + ';padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.3rem;font-weight:bold;color:' + (totalProfit >= 0 ? '#166534' : '#991b1b') + ';">' + safeFmt(totalProfit) + '</div><div style="font-size:0.7rem;color:' + (totalProfit >= 0 ? '#166534' : '#991b1b') + ';">جمع سود (ریال)</div></div>';
      html += '</div>';
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);">';
      html += '<h3 style="color:#166534;font-size:0.95rem;margin-bottom:0.5rem;">هتل‌ها (' + hotelKeys.length + ')</h3>';
      hotelKeys.sort((a, b) => hotelMap[b].profit - hotelMap[a].profit).forEach(name => {
        const d = hotelMap[name];
        const pColor = d.profit >= 0 ? '#166534' : '#dc2626';
        const pBg = d.profit >= 0 ? '#f0fdf4' : '#fef2f2';
        const pBorder = d.profit >= 0 ? '#bbf7d0' : '#fecaca';
        html += '<div style="background:' + pBg + ';border:1px solid ' + pBorder + ';padding:0.6rem;border-radius:0.5rem;margin-bottom:0.4rem;font-size:0.8rem;">';
        html += '<div style="display:flex;justify-content:space-between;"><span><b>' + name + '</b> — ' + d.count + ' فاکتور</span><span style="color:' + pColor + ';font-weight:bold;">سود: ' + safeFmt(d.profit) + '</span></div>';
        html += '<div style="font-size:0.7rem;color:#64748b;margin-top:0.2rem;">فروش: ' + safeFmt(d.revenue) + ' | بهای تمام: ' + safeFmt(d.cost) + ' | وزن: ' + safeFmt(d.weight) + ' کیلو</div>';
        html += '</div>';
      });
      html += '</div>';
    }
    html += '</div>';

    box.innerHTML = html;
  }

  function switchTab(tab, btn) {
    document.querySelectorAll('#accounting .tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('accTabBuy').style.display = tab === 'buy' ? 'block' : 'none';
    document.getElementById('accTabSell').style.display = tab === 'sell' ? 'block' : 'none';
  }

  function init() {
    const t = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        injectMenu();
        injectPage();
        const orig = window.showPage;
        if (typeof orig === 'function' && !window.__ACC_wrapped) {
          window.__ACC_wrapped = true;
          window.showPage = function (id) {
            orig(id);
            injectMenu();
            injectPage();
            if (id === 'accounting') setTimeout(render, 50);
          };
        }
        clearInterval(t);
      }
    }, 500);
  }

  window.__ACC_switchTab = switchTab;
  window.__ACC_refresh = render;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
