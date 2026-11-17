(function () {
  'use strict';

  // موجودی بر اساس linkedBuys
  function getBuysSafe() {
    if (!currentBooth) return [];
    const cur = JSON.parse(localStorage.getItem('buys_' + currentBooth) || '[]');
    const arch = JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]');
    const sup = JSON.parse(localStorage.getItem('supplies_' + currentBooth) || '[]');
    return [...cur, ...arch.flatMap(a => a.buys || []), ...sup.map(s => ({...s, isSupply: true}))];
  }
  function getSellsSafe() {
    if (!currentBooth) return [];
    const cur = JSON.parse(localStorage.getItem('sells_' + currentBooth) || '[]');
    const arch = JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]');
    return [...cur, ...arch.flatMap(a => a.sells || [])];
  }

  function usedFromBuy(buyId, sells) {
    let sum = 0;
    (sells || getSellsSafe()).forEach(s => (s.linkedBuys || []).forEach(lb => {
      if (String(lb.buyId) === String(buyId)) sum += +lb.weight || 0;
    }));
    return sum;
  }

  // stockOf: بر اساس linkedBuys
  window.stockOf = function (fruit) {
    if (fruit == null) return { bought: 0, sold: 0, remain: 0 };
    const buys = getBuysSafe();
    const sells = getSellsSafe();
    const target = (typeof normalizeName === 'function') ? normalizeName(fruit) : fruit;
    let bought = 0, sold = 0;
    buys.forEach(b => {
      const bn = (typeof normalizeName === 'function') ? normalizeName(b.fruit) : b.fruit;
      if (bn === target) bought += +b.weight || 0;
    });
    sells.forEach(s => {
      const sn = (typeof normalizeName === 'function') ? normalizeName(s.fruit) : s.fruit;
      if (sn !== target) return;
      if (s.linkedBuys && s.linkedBuys.length) {
        sold += s.linkedBuys.reduce((a, lb) => a + (+lb.weight || 0), 0);
      }
    });
    return { bought, sold, remain: +(bought - sold).toFixed(2) };
  };

  // getSellCost: از linkedBuys
  window.getSellCost = function (sell) {
    if (!sell) return 0;
    if (sell.manualCost !== undefined && sell.manualCost !== null) return +sell.manualCost;
    const buys = getBuysSafe();
    if (sell.linkedBuys && sell.linkedBuys.length) {
      let total = 0;
      sell.linkedBuys.forEach(lb => {
        const buy = buys.find(b => String(b.id) === String(lb.buyId));
        if (buy) total += (+lb.weight || 0) * (+buy.price || 0);
      });
      return total;
    }
    // fallback: آخرین فی خرید
    const target = (typeof normalizeName === 'function') ? normalizeName(sell.fruit) : sell.fruit;
    const fruitBuys = buys.filter(b => {
      const bn = (typeof normalizeName === 'function') ? normalizeName(b.fruit) : b.fruit;
      return bn === target;
    });
    if (!fruitBuys.length) return 0;
    fruitBuys.sort((a, b) => {
      const da = (typeof jalaliToNum === 'function') ? jalaliToNum(a.date) : 0;
      const db = (typeof jalaliToNum === 'function') ? jalaliToNum(b.date) : 0;
      return da - db;
    });
    return (+sell.weight || 0) * (+fruitBuys[fruitBuys.length - 1].price || 0);
  };

  console.log('✅ accurate-report: موجودی و گزارش بر اساس linkedBuys');
})();
