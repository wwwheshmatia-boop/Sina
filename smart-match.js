(function () {
  'use strict';

  const LS = {
    get(key) {
      if (!currentBooth) return null;
      try { return JSON.parse(localStorage.getItem(key + '_' + currentBooth)); }
      catch (e) { return null; }
    },
    set(key, val) {
      if (!currentBooth) return;
      localStorage.setItem(key + '_' + currentBooth, JSON.stringify(val));
    }
  };

  const safeFmt = (n) => (typeof fmt === 'function' ? fmt(n) : String(Math.round(n)));
  const safeNormalize = (n) => (typeof normalizeName === 'function' ? normalizeName(n) : n);

  function getMatches() {
    const m = LS.get('matches');
    return m || {};
  }
  function saveMatches(m) {
    LS.set('matches', m);
    if (currentBooth) localStorage.setItem('matches_' + currentBooth, JSON.stringify(m));
  }
  function getLearning() {
    return LS.get('learning') || {};
  }
  function saveLearning(l) {
    LS.set('learning', l);
  }
  function getRejected() {
    return LS.get('rejected') || {};
  }
  function saveRejected(r) {
    LS.set('rejected', r);
  }

  function similarity(a, b) {
    a = safeNormalize(a).replace(/\s+/g, ' ').trim();
    b = safeNormalize(b).replace(/\s+/g, ' ').trim();
    if (a === b) return 1;
    if (a.includes(b) || b.includes(a)) return 0.85;
    const m = a.length, n = b.length;
    if (!m || !n) return 0;
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return 1 - dp[m][n] / Math.max(m, n);
  }

  function getAllFruitNames() {
    if (!currentBooth) return [];
    const buys = JSON.parse(localStorage.getItem('buys_' + currentBooth) || '[]');
    const sells = JSON.parse(localStorage.getItem('sells_' + currentBooth) || '[]');
    const arch = JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]');
    const archBuys = arch.flatMap(a => a.buys || []);
    const archSells = arch.flatMap(a => a.sells || []);
    const names = new Set();
    [...buys, ...sells, ...archBuys, ...archSells].forEach(x => {
      if (x.fruit) names.add(x.fruit);
    });
    return [...names];
  }

  function findUnmatchedNames() {
    const matches = getMatches();
    const learning = getLearning();
    const all = getAllFruitNames();
    return all.filter(name => !matches[name] && !learning[name]);
  }

  function findSimilarPairs() {
    const unmatched = findUnmatchedNames();
    const all = getAllFruitNames();
    const pairs = [];
    const seen = new Set();
    unmatched.forEach(u => {
      all.forEach(a => {
        if (a === u) return;
        const key = [u, a].sort().join('|');
        if (seen.has(key)) return;
        const score = similarity(u, a);
        if (score > 0.6 && score < 1) {
          seen.add(key);
          pairs.push({ a: u, b: a, score });
        }
      });
    });
    pairs.sort((x, y) => y.score - x.score);
    return pairs.slice(0, 20);
  }

  /* ========== موجودی ========== */
  function getAllBuysSafe() {
    if (!currentBooth) return [];
    const cur = JSON.parse(localStorage.getItem('buys_' + currentBooth) || '[]');
    const arch = JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]');
    const sup = JSON.parse(localStorage.getItem('supplies_' + currentBooth) || '[]');
    const archBuys = arch.flatMap(a => a.buys || []);
    return [...cur, ...archBuys, ...sup.map(s => ({ ...s, isSupply: true }))];
  }
  function getAllSellsSafe() {
    if (!currentBooth) return [];
    const cur = JSON.parse(localStorage.getItem('sells_' + currentBooth) || '[]');
    const arch = JSON.parse(localStorage.getItem('archives_' + currentBooth) || '[]');
    const archSells = arch.flatMap(a => a.sells || []);
    return [...cur, ...archSells];
  }
  function itemKey(item) {
    const code = item.fruitCode ? String(item.fruitCode).trim() : '';
    const name = (item.fruit || '').trim();
    if (code) return code + '|' + name;
    return 'NOCODE|' + name;
  }
  function computeAllGroups() {
    const buys = getAllBuysSafe();
    const sells = getAllSellsSafe();
    const groups = new Map();
    buys.forEach(b => {
      const key = itemKey(b);
      if (!groups.has(key)) groups.set(key, { key, name: b.fruit || 'نامشخص', code: b.fruitCode || '', bought: 0, sold: 0 });
      groups.get(key).bought += +b.weight || 0;
    });
    sells.forEach(s => {
      const key = itemKey(s);
      if (!groups.has(key)) groups.set(key, { key, name: s.fruit || 'نامشخص', code: s.fruitCode || '', bought: 0, sold: 0 });
      groups.get(key).sold += +s.weight || 0;
    });
    const result = [];
    groups.forEach(g => {
      g.remain = +(g.bought - g.sold).toFixed(2);
      result.push(g);
    });
    return result;
  }
  window.stockOf = function (fruit) {
    if (fruit == null) return { bought: 0, sold: 0, remain: 0 };
    const target = safeNormalize(fruit);
    const all = computeAllGroups();
    let bought = 0, sold = 0;
    all.forEach(g => {
      if (safeNormalize(g.name) === target) { bought += g.bought; sold += g.sold; }
    });
    return { bought, sold, remain: +(bought - sold).toFixed(2) };
  };
  window.__SMART_computeStock = function () {
    const arr = computeAllGroups();
    const map = new Map();
    arr.forEach(g => map.set(g.key, g));
    return map;
  };

  /* ========== رندر صفحه ========== */
  function renderNewMatchPage() {
    const page = document.getElementById('match');
    if (!page) return;

    const matches = getMatches();
    const learning = getLearning();
    const allNames = getAllFruitNames();
    const unmatched = findUnmatchedNames();
    const pairs = findSimilarPairs();

    const totalItems = Object.keys(matches).length + Object.keys(learning).length;
    const learnPct = totalItems > 0 ? Math.round((Object.keys(learning).length / totalItems) * 100) : 0;

    let html = '<h2>🧠 تطبیق هوشمند نام‌ها</h2>';
    html += '<p style="font-size:0.8rem;color:#666;margin-bottom:1rem;">سیستم خودش اسم‌های مشابه رو پیدا می‌کنه و از رفتار شما یاد می‌گیره.</p>';

    // آمار
    html += '<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem;">';
    html += '<div style="background:#f0fdf4;border:1px solid #bbf7d0;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#166534;">' + Object.keys(matches).length + '</div><div style="font-size:0.7rem;color:#166534;">تطبیق فعال</div></div>';
    html += '<div style="background:#fef3c7;border:1px solid #fde68a;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#92400e;">' + unmatched.length + '</div><div style="font-size:0.7rem;color:#92400e;">بدون تطبیق</div></div>';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#1e40af;">' + Object.keys(learning).length + '</div><div style="font-size:0.7rem;color:#1e40af;">یادگیری</div></div>';
    html += '<div style="background:#fef2f2;border:1px solid #fecaca;padding:0.7rem;border-radius:0.6rem;text-align:center;"><div style="font-size:1.5rem;font-weight:bold;color:#991b1b;">' + pairs.length + '</div><div style="font-size:0.7rem;color:#991b1b;">پیشنهاد مشابه</div></div>';
    html += '</div>';

    // درصد یادگیری
    html += '<div style="background:white;padding:0.8rem;border-radius:0.6rem;margin-bottom:1rem;border:1px solid #e2e8f0;text-align:center;">';
    html += '<div style="font-size:0.75rem;color:#64748b;margin-bottom:0.3rem;">📊 درصد یادگیری سیستم</div>';
    html += '<div style="font-size:1.2rem;font-weight:bold;color:#7c3aed;">' + learnPct + '٪</div>';
    html += '<div style="font-size:0.7rem;color:#94a3b8;">از ' + totalItems + ' مورد، ' + Object.keys(learning).length + ' مورد یاد گرفته شده</div>';
    html += '</div>';

    // پیشنهادهای هوشمند (فقط برای اسم‌های بدون یادگیری)
    const pairsFiltered = pairs.filter(p => {
      if (learning[p.a] || learning[p.b] || matches[p.a] || matches[p.b]) return false;
      const rejected = getRejected();
      if (rejected[p.a + '|' + p.b] || rejected[p.b + '|' + p.a]) return false;
      return true;
    });
    if (pairsFiltered.length) {
      html += '<div style="background:#fffbeb;border:1px solid #fde68a;padding:1rem;border-radius:1rem;margin-bottom:1rem;">';
      html += '<h3 style="color:#92400e;font-size:0.95rem;margin-bottom:0.5rem;">🎯 پیشنهادهای هوشمند (' + pairsFiltered.length + ')</h3>';
      html += '<p style="font-size:0.75rem;color:#78350f;margin-bottom:0.5rem;">این اسم‌ها شبیه همن و هنوز یادگیری ندارن.</p>';
      pairsFiltered.slice(0, 5).forEach((p, i) => {
        html += '<div style="background:white;padding:0.6rem;border-radius:0.5rem;margin-bottom:0.4rem;border:1px solid #fde68a;">';
        html += '<div style="font-size:0.8rem;margin-bottom:0.4rem;"><b>' + p.a + '</b> و <b>' + p.b + '</b> <span style="color:#92400e;">(' + Math.round(p.score * 100) + '٪ شباهت)</span></div>';
        html += '<div style="display:flex;gap:0.3rem;flex-wrap:wrap;">';
        html += '<button onclick="window.__SMARTMATCH_acceptPair(\'' + p.a.replace(/'/g, "\\'") + '\', \'' + p.b.replace(/'/g, "\\'") + '\')" style="background:#16a34a;color:white;border:none;padding:0.3rem 0.6rem;border-radius:0.4rem;font-size:0.7rem;font-weight:bold;cursor:pointer;">✅ تطبیق بده</button>';
        html += '<button onclick="window.__SMARTMATCH_rejectPair(\'' + p.a.replace(/'/g, "\\'") + '\', \'' + p.b.replace(/'/g, "\\'") + '\')" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.3rem 0.6rem;border-radius:0.4rem;font-size:0.7rem;font-weight:bold;cursor:pointer;">❌ رد کن</button>';
        html += '</div></div>';
      });
      html += '</div>';
    }

    // اسم‌های بدون تطبیق
    if (unmatched.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">📋 اسم‌های بدون تطبیق (' + unmatched.length + ')</h3>';
      html += '<div style="max-height:200px;overflow-y:auto;font-size:0.78rem;">';
      unmatched.forEach(n => {
        html += '<div style="padding:0.4rem;border-bottom:1px dashed #e2e8f0;">' + n + '</div>';
      });
      html += '</div></div>';
    }

    // تطبیق‌های فعال
    const matchKeys = Object.keys(matches);
    if (matchKeys.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">✅ تطبیق‌های فعال (' + matchKeys.length + ')</h3>';
      matchKeys.forEach(k => {
        html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:0.4rem;border-bottom:1px dashed #e2e8f0;font-size:0.8rem;">';
        html += '<span>' + k + ' → <b>' + matches[k] + '</b></span>';
        html += '<button onclick="window.__SMARTMATCH_deleteMatch(\'' + k.replace(/'/g, "\\'") + '\')" style="background:#fef2f2;color:#dc2626;border:none;padding:0.2rem 0.4rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;">🗑️</button>';
        html += '</div>';
      });
      html += '</div>';
    }

    // یادگیری‌ها
    const learnKeys = Object.keys(learning);
    if (learnKeys.length) {
      html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
      html += '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">🧠 یادگیری سیستم (' + learnKeys.length + ')</h3>';
      learnKeys.forEach(k => {
        const l = learning[k];
        const conf = Math.round((l.confidence || 0) * 100);
        html += '<div style="padding:0.6rem;border-bottom:1px dashed #e2e8f0;font-size:0.8rem;">';
        html += '<div style="margin-bottom:0.3rem;"><b>' + k + '</b> → <b>' + l.suggestedMatch + '</b></div>';
        html += '<div style="font-size:0.7rem;color:#64748b;">' + (l.count || 0) + ' بار، ' + conf + '٪ اطمینان</div>';
        html += '<div style="display:flex;gap:0.3rem;margin-top:0.4rem;flex-wrap:wrap;">';
        html += '<button onclick="window.__SMARTMATCH_editLearning(\'' + k.replace(/'/g, "\\'") + '\')" style="background:#eff6ff;color:#1e40af;border:1px solid #bfdbfe;padding:0.25rem 0.5rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;font-weight:bold;">✏️ ویرایش</button>';
        html += '<button onclick="window.__SMARTMATCH_forget(\'' + k.replace(/'/g, "\\'") + '\')" style="background:#fef2f2;color:#dc2626;border:none;padding:0.25rem 0.5rem;border-radius:0.3rem;cursor:pointer;font-size:0.7rem;font-weight:bold;">🗑️ حذف</button>';
        html += '</div></div>';
      });
      html += '</div>';
    }

    // افزودن دستی
    html += '<div style="background:white;padding:1rem;border-radius:1rem;box-shadow:0 2px 8px rgba(0,0,0,0.08);margin-bottom:1rem;">';
    html += '<h3 style="color:#1e293b;font-size:0.95rem;margin-bottom:0.5rem;">➕ افزودن تطبیق دستی</h3>';
    html += '<div style="display:flex;gap:0.4rem;flex-wrap:wrap;">';
    html += '<input type="text" id="newMatchFrom" placeholder="اسم ثبت‌شده" style="flex:1;min-width:120px;padding:0.5rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.85rem;">';
    html += '<input type="text" id="newMatchTo" placeholder="اسم اصلی" style="flex:1;min-width:120px;padding:0.5rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.85rem;">';
    html += '<button onclick="window.__SMARTMATCH_addMatch()" style="background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;padding:0.5rem 0.8rem;border-radius:0.4rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">افزودن</button>';
    html += '</div></div>';

    // ریست
    html += '<button onclick="window.__SMARTMATCH_resetLearning()" style="width:100%;background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:0.6rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.8rem;">🔄 ریست کامل یادگیری</button>';

    page.innerHTML = html;
  }

  /* ========== توابع ========== */
  function addMatch() {
    const from = document.getElementById('newMatchFrom').value.trim();
    const to = document.getElementById('newMatchTo').value.trim();
    if (!from || !to) return alert('هر دو فیلد رو پر کن.');
    if (from === to) return alert('نمی‌تونی به خودش وصل کنی.');
    const m = getMatches();
    m[from] = to;
    saveMatches(m);
    const l = getLearning();
    if (!l[from]) l[from] = { suggestedMatch: to, count: 0, confidence: 0 };
    l[from].count++;
    l[from].suggestedMatch = to;
    l[from].confidence = Math.min(0.95, 0.5 + l[from].count * 0.1);
    l[from].lastUsed = Date.now();
    saveLearning(l);
    renderNewMatchPage();
    alert('✅ تطبیق اضافه شد و سیستم یاد گرفت.');
  }

  function deleteMatch(key) {
    if (!confirm('حذف شود؟')) return;
    const m = getMatches();
    delete m[key];
    saveMatches(m);
    renderNewMatchPage();
  }

  function acceptPair(a, b) {
    const from = a.length <= b.length ? a : b;
    const to = a.length <= b.length ? b : a;
    if (!confirm('«' + from + '» به «' + to + '» وصل شود؟')) return;
    const m = getMatches();
    m[from] = to;
    saveMatches(m);
    const l = getLearning();
    if (!l[from]) l[from] = { suggestedMatch: to, count: 0, confidence: 0 };
    l[from].count++;
    l[from].suggestedMatch = to;
    l[from].confidence = Math.min(0.95, 0.5 + l[from].count * 0.1);
    l[from].lastUsed = Date.now();
    saveLearning(l);
    renderNewMatchPage();
    alert('✅ تطبیق و یادگیری ثبت شد.');
  }

  function rejectPair(a, b) {
    const rejected = getRejected();
    rejected[a + '|' + b] = { time: Date.now(), a: a, b: b };
    saveRejected(rejected);
    renderNewMatchPage();
    alert('✅ پیشنهاد رد شد و دیگه نمایش داده نمی‌شه.');
  }

  function forget(key) {
    if (!confirm('یادگیری «' + key + '» فراموش شود؟')) return;
    const l = getLearning();
    delete l[key];
    saveLearning(l);
    renderNewMatchPage();
  }

  function resetLearning() {
    if (!confirm('همه‌ی یادگیری‌ها پاک شوند؟')) return;
    saveLearning({});
    renderNewMatchPage();
    alert('✅ یادگیری‌ها پاک شد.');
  }

  function editLearning(key) {
    const l = getLearning()[key];
    if (!l) return;
    const newMatch = prompt('اسم مقصد برای «' + key + '»:', l.suggestedMatch);
    if (newMatch === null) return;
    if (!newMatch.trim()) return alert('اسم نمی‌تونه خالی باشه.');
    l.suggestedMatch = newMatch.trim();
    l.lastUsed = Date.now();
    const learning = getLearning();
    learning[key] = l;
    saveLearning(learning);
    const m = getMatches();
    if (m[key]) { m[key] = newMatch.trim(); saveMatches(m); }
    renderNewMatchPage();
    alert('✅ ویرایش شد.');
  }

  /* ========== راه‌اندازی ========== */
  function init() {
    const orig = window.showPage;
    if (typeof orig === 'function' && !window.__SMARTMATCH_wrapped) {
      window.__SMARTMATCH_wrapped = true;
      window.showPage = function (id) {
        orig(id);
        if (id === 'match') setTimeout(renderNewMatchPage, 50);
      };
    }
  }

  window.__SMARTMATCH_addMatch = addMatch;
  window.__SMARTMATCH_deleteMatch = deleteMatch;
  window.__SMARTMATCH_acceptPair = acceptPair;
  window.__SMARTMATCH_rejectPair = rejectPair;
  window.__SMARTMATCH_forget = forget;
  window.__SMARTMATCH_resetLearning = resetLearning;
  window.__SMARTMATCH_editLearning = editLearning;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
