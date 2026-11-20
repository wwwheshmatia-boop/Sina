(function () {
  'use strict';
  function readLS(key) {
    if (!currentBooth) return [];
    try { return JSON.parse(localStorage.getItem(key + '_' + currentBooth) || '[]'); }
    catch (e) { return []; }
  }
  function getAllBuysSafe() {
    const cur = readLS('buys');
    const arch = readLS('archives');
    const sup = readLS('supplies');
    const archBuys = arch.flatMap(a => a.buys || []);
    return [...cur, ...archBuys, ...sup.map(s => ({ ...s, isSupply: true }))];
  }
  function getAllSellsSafe() {
    const cur = readLS('sells');
    const arch = readLS('archives');
    const archSells = arch.flatMap(a => a.sells || []);
    return [...cur, ...archSells];
  }
  function safeNorm(name) {
    if (!name) return '';
    try { return (typeof normalizeName === 'function') ? normalizeName(name) : name; }
    catch (e) { return name; }
  }
  function groupKey(item) {
    if (!item) return '';
    const code = item.fruitCode ? String(item.fruitCode) : '';
    const name = safeNorm(item.fruit);
    if (code) return 'C:' + code + '|N:' + name;
    return 'N:' + name;
  }
  function buildBuyGroups() {
    const buys = getAllBuysSafe();
    const groups = new Map();
    buys.forEach(b => {
      const key = groupKey(b);
      if (!key) return;
      if (!groups.has(key)) {
        groups.set(key, { key, name: b.fruit, code: b.fruitCode || '', buys: [], totalWeight: 0, totalCost: 0, soldWeight: 0, soldCost: 0 });
      }
      const g = groups.get(key);
      const weight = +b.weight || 0;
      const price = +b.price || 0;
      g.buys.push(b);
      g.totalWeight += weight;
      g.totalCost += weight * price;
    });
    groups.forEach(g => { g.avgPrice = g.totalWeight > 0 ? g.totalCost / g.totalWeight : 0; });
    return groups;
  }
  function findGroupForSell(sell, groups) {
    if (!sell) return null;
    const sellCode = sell.fruitCode ? String(sell.fruitCode) : '';
    const sellName = safeNorm(sell.fruit);
    if (sellCode) {
      const exactKey = 'C:' + sellCode + '|N:' + sellName;
      if (groups.has(exactKey)) return groups.get(exactKey);
    }
    if (sellCode) {
      for (const [key, g] of groups) { if (g.code && String(g.code) === sellCode) return g; }
    }
    for (const [key, g] of groups) { if (safeNorm(g.name) === sellName) return g; }
    return null;
  }
  function computeStock() {
    const groups = buildBuyGroups();
    const sells = getAllSellsSafe();
    groups.forEach(g => { g.soldWeight = 0; g.soldCost = 0; });
    sells.forEach(s => {
      const g = findGroupForSell(s, groups);
      if (g) { const w = +s.weight || 0; g.soldWeight += w; g.soldCost += w * g.avgPrice; }
    });
    groups.forEach(g => { g.remain = g.totalWeight - g.soldWeight; });
    return groups;
  }
  window.stockOf = function (fruit) {
    const groups = computeStock();
    const target = safeNorm(fruit);
    const relatedGroups = [];
    groups.forEach(g => { if (safeNorm(g.name) === target) relatedGroups.push(g); });
    if (!relatedGroups.length) return { bought: 0, sold: 0, remain: 0 };
    const bought = relatedGroups.reduce((s, g) => s + g.totalWeight, 0);
    const sold = relatedGroups.reduce((s, g) => s + g.soldWeight, 0);
    return { bought, sold, remain: bought - sold };
  };
  window.getSellCost = function (sell) {
    if (!sell) return 0;
    if (sell.manualCost !== undefined && sell.manualCost !== null) return +sell.manualCost;
    if (sell.linkedBuys && sell.linkedBuys.length) {
      const allBuys = getAllBuysSafe();
      let total = 0, linkedWeight = 0;
      sell.linkedBuys.forEach(lb => {
        const buy = allBuys.find(b => String(b.id) === String(lb.buyId));
        if (buy) { const w = +lb.weight || 0; total += w * (+buy.price || 0); linkedWeight += w; }
      });
      const remainWeight = Math.max(0, (+sell.weight || 0) - linkedWeight);
      if (remainWeight > 0.0001) {
        const groups = computeStock();
        const g = findGroupForSell(sell, groups);
        if (g && g.avgPrice > 0) total += remainWeight * g.avgPrice;
      }
      return total;
    }
    const groups = computeStock();
    const g = findGroupForSell(sell, groups);
    if (g && g.avgPrice > 0) return (+sell.weight || 0) * g.avgPrice;
    return (typeof getLastBuyPrice === 'function' ? getLastBuyPrice(sell.fruit) : 0) * (+sell.weight || 0);
  };
  window.__SMART_computeStock = computeStock;
  window.__SMART_buildBuyGroups = buildBuyGroups;
  console.log('✅ smart-stock.js لود شد');
})();
