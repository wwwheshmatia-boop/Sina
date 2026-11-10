/* ---------- ابزار تاریخ شمسی ---------- */
function toJalali(gy, gm, gd) {
  const g_d_m = [0,31,59,90,120,151,181,212,243,273,304,334];
  let jy = (gy <= 1600) ? 0 : 979;
  gy -= (gy <= 1600) ? 621 : 1600;
  const gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = (365 * gy) + parseInt((gy2 + 3) / 4) - parseInt((gy2 + 99) / 100)
           + parseInt((gy2 + 399) / 400) - 80 + gd + g_d_m[gm - 1];
  jy += 33 * parseInt(days / 12053);
  days %= 12053;
  jy += 4 * parseInt(days / 1461);
  days %= 1461;
  jy += parseInt((days - 1) / 365);
  if (days > 365) days = (days - 1) % 365;
  const jm = (days < 186) ? 1 + parseInt(days / 31) : 7 + parseInt((days - 186) / 30);
  const jd = 1 + ((days < 186) ? (days % 31) : ((days - 186) % 30));
  return `${jy}/${String(jm).padStart(2,'0')}/${String(jd).padStart(2,'0')}`;
}
function todayJalali() { const d = new Date(); return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
function showDate(dateStr) { if (!dateStr) return ''; if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) { const [y, m, d] = dateStr.split('-').map(Number); return toJalali(y, m, d); } return dateStr; }
function daysAgoJalali(n) { const d = new Date(Date.now() - n * 864e5); return toJalali(d.getFullYear(), d.getMonth() + 1, d.getDate()); }
function jalaliToNum(dateStr) { if (!dateStr) return 0; const parts = String(dateStr).replace(/[^\d]/g, '-').split('-').filter(Boolean); if (parts.length < 3) return 0; return parseInt(parts[0]) * 10000 + parseInt(parts[1]) * 100 + parseInt(parts[2]); }

/* ---------- دیکشنری تطبیق نام‌ها ---------- */
function getMatches() { return JSON.parse(localStorage.getItem('matches') || '{}'); }
function saveMatches(m) { localStorage.setItem('matches', JSON.stringify(m)); }
function normalizeName(name) { const matches = getMatches(); return matches[name] || name; }

/* ---------- قفل ورود ---------- */
function getPass() { return localStorage.getItem('appPass') || '1234'; }
function tryLogin() {
  const input = document.getElementById('loginPass');
  const err = document.getElementById('loginError');
  if (input.value === getPass()) {
    sessionStorage.setItem('loggedIn', '1');
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    err.textContent = ''; input.value = ''; renderDashboard();
  } else { err.textContent = 'رمز اشتباهه! دوباره امتحان کن'; input.value = ''; }
}
function logout() { if (!confirm('از حساب خارج می‌شوی؟')) return; sessionStorage.removeItem('loggedIn'); document.getElementById('mainApp').style.display = 'none'; document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('loginPass').value = ''; }
function changePass() { const oldPass = prompt('رمز فعلی را وارد کنید:'); if (oldPass !== getPass()) return alert('رمز فعلی اشتباهه'); const newPass = prompt('رمز جدید را وارد کنید (حداقل ۴ کاراکتر):'); if (!newPass || newPass.length < 4) return alert('رمز باید حداقل ۴ کاراکتر باشه'); localStorage.setItem('appPass', newPass); alert('✅ رمز عوض شد'); }

/* ---------- ذخیره‌سازی ---------- */
const DB = {
  get: (k) => JSON.parse(localStorage.getItem(k) || '[]'),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v)),
  add: (k, item) => { const a = DB.get(k); a.push(item); DB.set(k, a); }
};
const fmt = (n) => Math.round(n).toLocaleString('fa-IR');

/* ---------- ناوبری ---------- */
function showPage(id, btn) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  document.querySelectorAll('nav button').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  if (id === 'dashboard') renderDashboard();
  if (id === 'report') { fillFilters(); renderReport(); }
  if (id === 'buy') { setDefaultDate('buyDate'); renderBuy(); }
  if (id === 'sell') { setDefaultDate('sellDate'); renderSell(); }
  if (id === 'match') { fillMatchDropdown(); renderMatchList(); }
}
function setDefaultDate(id) { const el = document.getElementById(id); if (el && !el.value) el.value = todayJalali(); }

/* ---------- خرید ---------- */
document.getElementById('buyForm').addEventListener('submit', e => {
  e.preventDefault();
  DB.add('buys', {
    id: Date.now(), date: document.getElementById('buyDate').value.trim(),
    fruit: document.getElementById('buyFruit').value.trim(),
    weight: parseFloat((+document.getElementById('buyWeight').value).toFixed(1)),
    price: +document.getElementById('buyPrice').value
  });
  e.target.reset(); setDefaultDate('buyDate'); renderBuy(); alert('خرید ثبت شد ✅');
});
function renderBuy() {
  const list = document.getElementById('buyList'); const buys = DB.get('buys').slice().reverse();
  list.innerHTML = buys.map(b => `<li><span>${showDate(b.date)} — ${b.fruit} — ${b.weight.toFixed(1)}kg × ${fmt(b.price)} ریال</span><button class="del" onclick="delItem('buys', ${b.id})">حذف</button></li>`).join('') || '<li>هنوز خریدی ثبت نشده</li>';
}

/* ---------- فروش دستی ---------- */
document.getElementById('sellForm').addEventListener('submit', e => {
  e.preventDefault();
  DB.add('sells', {
    id: Date.now(), date: document.getElementById('sellDate').value.trim(),
    hotel: document.getElementById('sellHotel').value.trim(), fruit: document.getElementById('sellFruit').value.trim(),
    weight: parseFloat((+document.getElementById('sellWeight').value).toFixed(1)), price: +document.getElementById('sellPrice').value
  });
  e.target.reset(); setDefaultDate('sellDate'); renderSell(); alert('فروش ثبت شد ✅');
});

function editSellCost(id) {
  const sells = DB.get('sells'); const sell = sells.find(s => String(s.id) === String(id)); if (!sell) return;
  let currentUnitPrice = '';
  if (sell.manualCost !== undefined && sell.manualCost !== null && sell.weight > 0) {
    currentUnitPrice = Math.round(sell.manualCost / sell.weight);
  }
  const newUnitPrice = prompt(`فی خرید برای ${sell.weight.toFixed(1)} کیلو ${sell.fruit} را وارد کنید (ریال):`, currentUnitPrice);
  if (newUnitPrice === null) return;
  const unitPrice = parseFloat(newUnitPrice) || 0;
  sell.manualCost = unitPrice * sell.weight;
  sell.manualUnitPrice = unitPrice;
  DB.set('sells', sells); renderSell();
  alert(`✅ فی خرید ${fmt(unitPrice)} ریال ثبت شد. بهای کل: ${fmt(sell.manualCost)} ریال`);
}

function renderSell() {
  const list = document.getElementById('sellList'); const sells = DB.get('sells').slice().reverse();
  list.innerHTML = sells.map(s => {
    const manualBadge = (s.manualCost !== undefined && s.manualCost !== null) ? `<span style="font-size:0.7rem;color:#ef6c00;margin-right:5px">(دستی)</span>` : '';
    return `<li><span style="flex:1">${showDate(s.date)} — ${s.hotel} — ${s.fruit} — ${s.weight.toFixed(1)}kg × ${fmt(s.price)} ریال ${manualBadge}</span><div style="display:flex;gap:5px"><button class="del" style="background:#fff3e0;color:#ef6c00;border:1px solid #ffcc80" onclick="editSellCost(${s.id})">✏️ بهای تمام‌شده</button><button class="del" onclick="delItem('sells', ${s.id})">حذف</button></div></li>`;
  }).join('') || '<li>هنوز فروشی ثبت نشده</li>';
}

function delItem(key, id) { if (!confirm('حذف شود؟')) return; DB.set(key, DB.get(key).filter(x => String(x.id) !== String(id))); if (key === 'buys') renderBuy(); else renderSell(); }
function clearAll() { if (!confirm('همه داده‌ها پاک شوند؟ برگشت‌پذیر نیست!')) return; localStorage.removeItem('buys'); localStorage.removeItem('sells'); renderReport(); alert('همه داده‌ها پاک شد'); }

/* ---------- آپلود اکسل فروش ---------- */
function importExcel() {
  const file = document.getElementById('excelFile').files[0]; if (!file) return alert('اول فایل اکسل رو انتخاب کن');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const sells = DB.get('sells'); let added = 0;
      for (let i = 2; i < rows.length; i++) {
        const r = rows[i]; if (!r || r.length < 12) continue;
        const dateVal = String(r[3]).trim(); const hotelVal = String(r[5]).trim(); const fruitVal = String(r[6]).trim();
        const rawWeight = parseFloat(r[10]) || 0; const weightVal = parseFloat(rawWeight.toFixed(1)); const priceVal = parseFloat(r[11]) || 0;
        if (dateVal && fruitVal && weightVal > 0) {
          sells.push({ id: Date.now() + i, date: dateVal, hotel: hotelVal || 'نامشخص', fruit: fruitVal, weight: weightVal, price: priceVal }); added++;
        }
      }
      DB.set('sells', sells); renderSell(); alert(`✅ ${added} ردیف فروش با موفقیت اضافه شد`); document.getElementById('excelFile').value = '';
    } catch (err) { alert('خطا در خواندن فایل: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- محاسبات (با اعمال تطبیق و بهای دستی) ---------- */
function getSellCost(sell) {
  if (sell.manualCost !== undefined && sell.manualCost !== null) return sell.manualCost;
  return avgBuyPrice(sell.fruit) * sell.weight;
}
function avgBuyPrice(fruit) {
  const targetFruit = normalizeName(fruit);
  const buys = DB.get('buys').filter(b => normalizeName(b.fruit) === targetFruit);
  if (!buys.length) return 0;
  const tw = buys.reduce((s, b) => s + b.weight, 0);
  const tc = buys.reduce((s, b) => s + b.weight * b.price, 0);
  return tw ? tc / tw : 0;
}
function calcProfit(sells) { return sells.reduce((sum, s) => sum + (s.weight * s.price - getSellCost(s)), 0); }
function stockOf(fruit) {
  const targetFruit = normalizeName(fruit);
  const bought = DB.get('buys').filter(b => normalizeName(b.fruit) === targetFruit).reduce((s,b)=>s+b.weight,0);
  const sold = DB.get('sells').filter(s => normalizeName(s.fruit) === targetFruit).reduce((s,x)=>s+x.weight,0);
  return { bought, sold, remain: bought - sold };
}

/* ---------- تطبیق نام‌ها ---------- */
function fillMatchDropdown() {
  const buys = DB.get('buys'); const sells = DB.get('sells');
  const fruits = [...new Set([...buys.map(b=>b.fruit), ...sells.map(s=>s.fruit)])].filter(Boolean).sort();
  const sel = document.getElementById('matchFrom');
  sel.innerHTML = '<option value="">انتخاب کنید...</option>' + fruits.map(f => `<option value="${f}">${f}</option>`).join('');
}
function addMatch() {
  const from = document.getElementById('matchFrom').value; const to = document.getElementById('matchTo').value.trim();
  if (!from || !to) return alert('هر دو فیلد رو پر کن'); if (from === to) return alert('نمی‌تونی یه اسم رو به خودش وصل کنی');
  const matches = getMatches(); matches[from] = to; saveMatches(matches); document.getElementById('matchTo').value = ''; renderMatchList(); renderDashboard();
}
function deleteMatch(key) { if (!confirm('حذف شود؟')) return; const matches = getMatches(); delete matches[key]; saveMatches(matches); renderMatchList(); renderDashboard(); }
function renderMatchList() {
  const matches = getMatches(); const keys = Object.keys(matches); const box = document.getElementById('matchListBox');
  if (!keys.length) { box.innerHTML = '<p style="text-align:center;color:#999;font-size:0.8rem">هنوز تطبیقی ثبت نشده</p>'; return; }
  box.innerHTML = keys.map(k => `<div class="report-row" style="font-size:0.8rem"><span>${k} → <strong>${matches[k]}</strong></span><button class="del" onclick="deleteMatch('${k}')">حذف</button></div>`).join('');
}

/* ---------- درصد تغییر ---------- */
function renderChange(elId, current, previous) {
  const el = document.getElementById(elId); if (!el) return; el.className = 'change';
  if (current === 0 && previous === 0) { el.textContent = '— بدون داده'; el.classList.add('neutral'); return; }
  let pct = previous === 0 ? 100 : ((current - previous) / Math.abs(previous)) * 100;
  const sign = pct >= 0 ? '+' : '';
  if (pct > 0.05) { el.textContent = `▲ ${sign}${pct.toFixed(1)}% افزایش`; el.classList.add('up'); }
  else if (pct < -0.05) { el.textContent = `▼ ${sign}${pct.toFixed(1)}% کاهش`; el.classList.add('down'); }
  else { el.textContent = '— بدون تغییر'; el.classList.add('neutral'); }
}

/* ---------- دیباگ ---------- */
function debugDates() {
  const sells = DB.get('sells'); const dates = [...new Set(sells.map(s => s.date))].sort();
  const today = todayJalali(); const yesterday = daysAgoJalali(1);
  const todayCount = sells.filter(s => s.date === today).length; const yesterdayCount = sells.filter(s => s.date === yesterday).length;
  const msg = `📅 امروز: ${today}\n📅 دیروز: ${yesterday}\n\n📊 تاریخ‌های ثبت‌شده (${dates.length} تاریخ):\n${dates.join('\n') || 'هیچ'}\n\n💰 فروش امروز: ${todayCount} ردیف\n💰 فروش دیروز: ${yesterdayCount} ردیف\n\n📈 سود امروز: ${fmt(calcProfit(sells.filter(s => s.date === today)))} ریال\n📈 سود دیروز: ${fmt(calcProfit(sells.filter(s => s.date === yesterday)))} ریال`;
  alert(msg);
}

/* ---------- فیلترها ---------- */
function fillFilters() {
  const sells = DB.get('sells'); const hotels = [...new Set(sells.map(s => s.hotel).filter(Boolean))];
  const fruits = [...new Set(sells.map(s => normalizeName(s.fruit)).filter(Boolean))];
  const hSel = document.getElementById('filterHotel'); const fSel = document.getElementById('filterFruit'); if (!hSel || !fSel) return;
  const curH = hSel.value, curF = fSel.value;
  hSel.innerHTML = '<option value="">همه هتل‌ها</option>' + hotels.map(h => `<option value="${h}">${h}</option>`).join('');
  fSel.innerHTML = '<option value="">همه میوه‌ها</option>' + fruits.map(f => `<option value="${f}">${f}</option>`).join('');
  hSel.value = curH; fSel.value = curF;
}
function getFilteredSells() {
  let sells = DB.get('sells'); const h = document.getElementById('filterHotel')?.value; const f = document.getElementById('filterFruit')?.value; const from = document.getElementById('filterFrom')?.value.trim(); const to = document.getElementById('filterTo')?.value.trim();
  if (h) sells = sells.filter(s => s.hotel === h); if (f) sells = sells.filter(s => normalizeName(s.fruit) === f);
  if (from) { const fromNum = jalaliToNum(from); sells = sells.filter(s => jalaliToNum(s.date) >= fromNum); }
  if (to) { const toNum = jalaliToNum(to); sells = sells.filter(s => jalaliToNum(s.date) <= toNum); }
  return sells;
}
function resetFilter() { document.getElementById('filterHotel').value = ''; document.getElementById('filterFruit').value = ''; document.getElementById('filterFrom').value = ''; document.getElementById('filterTo').value = ''; renderReport(); }

/* ---------- داشبورد ---------- */
function renderDashboard() {
  const sells = DB.get('sells'); const today = todayJalali(); const yesterday = daysAgoJalali(1);
  const todayProfit = calcProfit(sells.filter(s => s.date === today)); const yesterdayProfit = calcProfit(sells.filter(s => s.date === yesterday));
  document.getElementById('todayProfit').textContent = fmt(todayProfit) + ' ریال'; renderChange('todayChange', todayProfit, yesterdayProfit);

  const weekStartNum = jalaliToNum(daysAgoJalali(7)); const week2StartNum = jalaliToNum(daysAgoJalali(14));
  const thisWeek = calcProfit(sells.filter(s => jalaliToNum(s.date) >= weekStartNum));
  const lastWeek = calcProfit(sells.filter(s => { const n = jalaliToNum(s.date); return n >= week2StartNum && n < weekStartNum; }));
  document.getElementById('weekProfit').textContent = fmt(thisWeek) + ' ریال'; renderChange('weekChange', thisWeek, lastWeek);

  const monthStartNum = jalaliToNum(daysAgoJalali(30)); const month2StartNum = jalaliToNum(daysAgoJalali(60));
  const thisMonth = calcProfit(sells.filter(s => jalaliToNum(s.date) >= monthStartNum));
  const lastMonth = calcProfit(sells.filter(s => { const n = jalaliToNum(s.date); return n >= month2StartNum && n < monthStartNum; }));
  document.getElementById('monthProfit').textContent = fmt(thisMonth) + ' ریال'; renderChange('monthChange', thisMonth, lastMonth);

  const allFruits = [...new Set([...DB.get('buys').map(b => b.fruit), ...sells.map(s => s.fruit)])].map(normalizeName);
  const uniqueFruits = [...new Set(allFruits)];

  document.getElementById('stockBox').innerHTML = uniqueFruits.map(f => {
    const st = stockOf(f); const isNegative = st.remain < -0.01;
    const badge = isNegative ? `<span class="badge negative">فروش بیشتر از خرید: ${Math.abs(st.remain).toFixed(1)} کیلو</span>` : (st.remain === 0 ? '<span class="badge out">تموم شد</span>' : `<span class="badge ok">${st.remain.toFixed(1)} کیلو موجود</span>`);
    return `<div class="report-row ${isNegative ? 'negative-row' : ''}"><span>${f}</span><span>خرید: ${st.bought.toFixed(1)}kg — فروش: ${st.sold.toFixed(1)}kg ${badge}</span></div>`;
  }).join('') || '<div class="report-row">هنوز داده‌ای نیست</div>';
}

/* ---------- گزارش ---------- */
function renderReport() { const sells = getFilteredSells(); renderHotelReport(sells); renderChart(sells); }

/* ---------- تفکیک هتل ---------- */
function renderHotelReport(sells) {
  const hotels = [...new Set(sells.map(s => s.hotel).filter(Boolean))];
  const box = document.getElementById('hotelBox');
  if (!hotels.length) { box.innerHTML = '<div class="hotel-card">داده‌ای برای نمایش نیست</div>'; return; }
  box.innerHTML = hotels.map(h => {
    const hs = sells.filter(s => s.hotel === h);
    const rows = hs.map(s => { const cost = getSellCost(s); const revenue = s.weight * s.price; const profit = revenue - cost; return `<tr><td>${showDate(s.date)}</td><td>${s.fruit}</td><td>${s.weight.toFixed(1)}kg</td><td>${fmt(s.price)}</td><td>${fmt(cost)}</td><td>${fmt(revenue)}</td><td style="color:${profit>=0?'#2e7d32':'#c62828'}">${fmt(profit)}</td></tr>`; }).join('');
    const totalCost = hs.reduce((a,s) => a + getSellCost(s), 0); const totalRevenue = hs.reduce((a,s) => a + s.weight * s.price, 0); const totalProfit = totalRevenue - totalCost;
    return `<div class="hotel-card"><h3>🏨 ${h} — ${hs.length} فروش</h3><table><thead><tr><th>تاریخ</th><th>میوه</th><th>وزن</th><th>فی</th><th>بهای تمام‌شده</th><th>فروش</th><th>سود</th></tr></thead><tbody>${rows}</tbody></table><div class="summary"><span>جمع فروش: <strong>${fmt(totalRevenue)}</strong></span><span>بهای تمام‌شده: <strong>${fmt(totalCost)}</strong></span><span>سود: <strong style="color:${totalProfit>=0?'#2e7d32':'#c62828'}">${fmt(totalProfit)}</strong></span></div></div>`;
  }).join('');
}

/* ---------- نمودار خطی ---------- */
let profitChartInstance = null;
function renderChart(sells) {
  const days = [...new Set(sells.map(s => s.date))].sort(); const profits = days.map(d => calcProfit(sells.filter(s => s.date === d)));
  const ctx = document.getElementById('profitChart'); if (!ctx) return; if (profitChartInstance) profitChartInstance.destroy();
  profitChartInstance = new Chart(ctx, { type: 'line', data: { labels: days.length ? days.map(showDate) : ['داده‌ای نیست'], datasets: [{ label: 'سود روزانه (ریال)', data: days.length ? profits : [0], borderColor: '#2e7d32', backgroundColor: 'rgba(102, 187, 106, 0.15)', borderWidth: 2.5, pointBackgroundColor: (days.length ? profits : [0]).map(p => p >= 0 ? '#2e7d32' : '#c62828'), pointBorderColor: '#fff', pointBorderWidth: 2, pointRadius: 5, pointHoverRadius: 7, fill: true, tension: 0.35 }] }, options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => c.parsed.y.toLocaleString('fa-IR') + ' ریال' } } }, scales: { y: { beginAtZero: true, ticks: { callback: (v) => v.toLocaleString('fa-IR') } } } } });
}

/* ---------- PDF ---------- */
function buildPDFHtml(sells, title, subtitle) {
  const today = todayJalali(); const hotels = [...new Set(sells.map(s => s.hotel).filter(Boolean))]; const totalProfit = calcProfit(sells);
  let hotelsHtml = '';
  if (!hotels.length) { hotelsHtml = '<p style="text-align:center;padding:10px;color:#999">داده‌ای نیست</p>'; } else {
    hotelsHtml = hotels.map(h => {
      const hs = sells.filter(s => s.hotel === h);
      const rows = hs.map(s => { const cost = getSellCost(s); const revenue = s.weight * s.price; const profit = revenue - cost; return `<tr><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${showDate(s.date)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${s.fruit}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${s.weight.toFixed(1)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(s.price)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(cost)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(revenue)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px;color:${profit>=0?'#2e7d32':'#c62828'}">${fmt(profit)}</td></tr>`; }).join('');
      const totalCost = hs.reduce((a,s) => a + getSellCost(s), 0); const totalRevenue = hs.reduce((a,s) => a + s.weight * s.price, 0); const totalHotelProfit = totalRevenue - totalCost;
      return `<div style="margin-top:12px;page-break-inside:avoid"><h4 style="color:#2e7d32;font-size:12px;margin-bottom:4px;background:#e8f5e9;padding:6px;border-radius:4px">🏨 ${h} — ${hs.length} فروش</h4><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#f1f8e9"><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">تاریخ</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">میوه</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">وزن (kg)</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">فی</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">بهای تمام‌شده</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">فروش</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">سود</th></tr></thead><tbody>${rows}</tbody><tfoot><tr style="background:#e8f5e9;font-weight:bold"><td colspan="4" style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:left">جمع ${h}:</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(totalCost)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(totalRevenue)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px;color:${totalHotelProfit>=0?'#2e7d32':'#c62828'}">${fmt(totalHotelProfit)}</td></tr></tfoot></table></div>`;
    }).join('');
  }
  const allFruits = [...new Set([...DB.get('buys').map(b => b.fruit), ...sells.map(s => s.fruit)])].map(normalizeName); const uniqueFruits = [...new Set(allFruits)];
  const stockRows = uniqueFruits.map(f => { const st = stockOf(f); const isNeg = st.remain < -0.01; const status = isNeg ? `<span style="color:#0d47a1;font-weight:bold">⚠ فروش بیشتر از خرید (${Math.abs(st.remain).toFixed(1)} kg)</span>` : (st.remain === 0 ? '<span style="color:#c62828">تموم شد</span>' : `<span style="color:#2e7d32">${st.remain.toFixed(1)} kg موجود</span>`); return `<tr><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${f}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${st.bought.toFixed(1)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${st.sold.toFixed(1)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${status}</td></tr>`; }).join('') || '<tr><td colspan="4" style="text-align:center;padding:10px;color:#999">داده‌ای نیست</td></tr>';
  return `<div style="font-family:Tahoma;direction:rtl;padding:15px;color:#1b3a1b;background:white;font-size:12px"><h2 style="text-align:center;color:#2e7d32;border-bottom:2px solid #66bb6a;padding-bottom:8px;font-size:16px">🍎 ${title}</h2><p style="text-align:center;font-size:11px;color:#666;margin:6px 0">${subtitle || ''} — تاریخ: ${today}</p><div style="background:#c8e6c9;padding:10px;border-radius:6px;text-align:center;margin:10px 0"><strong style="font-size:13px">💰 سود ناخالص کل: </strong><strong style="font-size:15px;color:${totalProfit>=0?'#2e7d32':'#c62828'}">${fmt(totalProfit)} ریال</strong></div><h3 style="color:#2e7d32;margin-top:15px;font-size:13px;border-bottom:1px solid #a5d6a7;padding-bottom:4px">🏨 تفکیک فروش و سود هر هتل</h3>${hotelsHtml}<h3 style="color:#2e7d32;margin-top:15px;font-size:13px;border-bottom:1px solid #a5d6a7;padding-bottom:4px">📦 موجودی میوه‌ها</h3><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="background:#e8f5e9"><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">میوه</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">خرید (kg)</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">فروش (kg)</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">وضعیت</th></tr></thead><tbody>${stockRows}</tbody></table><p style="margin-top:15px;font-size:10px;color:#999;text-align:center">ساخته‌شده با سیستم حساب‌داری میدان تره‌بار — همه مبالغ به ریال</p></div>`;
}
function savePDF(html, filename) { html2pdf().set({ margin: 8, filename: filename, image: { type: 'jpeg', quality: 0.98 }, html2canvas: { scale: 2, useCORS: true }, jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }, pagebreak: { mode: ['avoid-all', 'css', 'legacy'] } }).from(html).save(); }
function downloadPDF() { savePDF(buildPDFHtml(getFilteredSells(), 'گزارش سود و زیان — میدان تره‌بار', 'گزارش کامل'), `گزارش-کامل-${todayJalali().replace(/\//g,'-')}.pdf`); }
function downloadPDFWeek() { const weekStartNum = jalaliToNum(daysAgoJalali(7)); const weekSells = DB.get('sells').filter(s => jalaliToNum(s.date) >= weekStartNum); if (!weekSells.length) return alert('فروشی در هفته اخیر ثبت نشده'); savePDF(buildPDFHtml(weekSells, 'گزارش هفتگی سود و زیان', `از ${daysAgoJalali(7)} تا ${todayJalali()}`), `گزارش-هفتگی-${todayJalali().replace(/\//g,'-')}.pdf`); }
function downloadPDFMonth() { const monthStartNum = jalaliToNum(daysAgoJalali(30)); const monthSells = DB.get('sells').filter(s => jalaliToNum(s.date) >= monthStartNum); if (!monthSells.length) return alert('فروشی در ماه اخیر ثبت نشده'); savePDF(buildPDFHtml(monthSells, 'گزارش ماهانه سود و زیان', `از ${daysAgoJalali(30)} تا ${todayJalali()}`), `گزارش-ماهانه-${todayJalali().replace(/\//g,'-')}.pdf`); }
function downloadPDFDay() { const today = todayJalali(); const todayNum = jalaliToNum(today); const todaySells = DB.get('sells').filter(s => jalaliToNum(s.date) === todayNum); if (!todaySells.length) return alert('فروشی برای امروز ثبت نشده'); savePDF(buildPDFHtml(todaySells, 'گزارش روزانه سود و زیان', `تاریخ: ${today}`), `گزارش-روزانه-${today.replace(/\//g,'-')}.pdf`); }

// تابع جدید برای PDF تاریخ دلخواه
function downloadPDFCustom() {
  const customDate = document.getElementById('pdfCustomDate').value.trim();
  if (!customDate) return alert('لطفاً یک تاریخ وارد کنید (مثلاً 1403/08/15)');
  const customNum = jalaliToNum(customDate);
  const customSells = DB.get('sells').filter(s => jalaliToNum(s.date) === customNum);
  if (!customSells.length) return alert(`هیچ فروشی برای تاریخ ${customDate} ثبت نشده است.`);
  savePDF(buildPDFHtml(customSells, 'گزارش روزانه سود و زیان', `تاریخ: ${customDate}`), `گزارش-${customDate.replace(/\//g,'-')}.pdf`);
}

/* ---------- پشتیبان‌گیری ---------- */
function exportJSON() { const data = { buys: DB.get('buys'), sells: DB.get('sells'), matches: getMatches(), exportDate: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `پشتیبان-${todayJalali().replace(/\//g,'-')}.json`; a.click(); }
function exportExcel() {
  const buys = DB.get('buys'); const sells = DB.get('sells'); const wb = XLSX.utils.book_new();
  const buyData = [['تاریخ','میوه','وزن','فی خرید (ریال)','جمع خرید (ریال)']]; buys.forEach(b => buyData.push([b.date, b.fruit, b.weight, b.price, b.weight * b.price]));
  const sellData = [['تاریخ','هتل','میوه','وزن','فی فروش (ریال)','جمع فروش (ریال)']]; sells.forEach(s => sellData.push([s.date, s.hotel, s.fruit, s.weight, s.price, s.weight * s.price]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buyData), 'خرید'); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sellData), 'فروش'); XLSX.writeFile(wb, `پشتیبان-${todayJalali().replace(/\//g,'-')}.xlsx`);
}
function restoreJSON() {
  const file = document.getElementById('restoreFile').files[0]; if (!file) return alert('اول فایل پشتیبان رو انتخاب کن'); if (!confirm('داده‌های فعلی با فایل پشتیبان جایگزین می‌شن. ادامه؟')) return;
  const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (!data.buys || !data.sells) throw new Error('فرمت فایل نامعتبره'); DB.set('buys', data.buys); DB.set('sells', data.sells); if (data.matches) saveMatches(data.matches); alert(`✅ بازیابی شد: ${data.buys.length} خرید، ${data.sells.length} فروش`); document.getElementById('restoreFile').value = ''; renderDashboard(); } catch (err) { alert('خطا در بازیابی: ' + err.message); } }; reader.readAsText(file);
}

/* ---------- شروع ---------- */
window.addEventListener('load', () => {
  if (sessionStorage.getItem('loggedIn') === '1') { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('mainApp').style.display = 'block'; renderDashboard(); } else { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('mainApp').style.display = 'none'; }
});
