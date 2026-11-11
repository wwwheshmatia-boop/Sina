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
const fmt = (n) => Math.round(n).toLocaleString('fa-IR');

/* ---------- مدیریت غرفه‌ها ---------- */
let currentBooth = sessionStorage.getItem('currentBooth') || null;
function getBooths() { return JSON.parse(localStorage.getItem('booths') || '[]'); }
function saveBooths(b) { localStorage.setItem('booths', JSON.stringify(b)); }
if (getBooths().length === 0) { saveBooths([{ name: 'غرفه اصلی', pass: '1234' }]); }

function loadLoginBooths() {
  const booths = getBooths(); const sel = document.getElementById('loginBooth');
  sel.innerHTML = booths.map(b => `<option value="${b.name}">${b.name}</option>`).join('');
}
function tryLogin() {
  const boothName = document.getElementById('loginBooth').value;
  const inputPass = document.getElementById('loginPass').value;
  const err = document.getElementById('loginError');
  const booths = getBooths(); const booth = booths.find(b => b.name === boothName);
  if (booth && inputPass === booth.pass) {
    sessionStorage.setItem('loggedIn', '1'); sessionStorage.setItem('currentBooth', boothName);
    currentBooth = boothName;
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
    document.getElementById('headerBoothName').textContent = `🍎 حساب‌داری ${boothName}`;
    err.textContent = ''; document.getElementById('loginPass').value = ''; 
    loadAllData();
  } else { err.textContent = 'رمز عبور اشتباهه!'; document.getElementById('loginPass').value = ''; }
}
function logout() {
  if (!confirm('از حساب خارج می‌شوی؟')) return;
  sessionStorage.removeItem('loggedIn'); sessionStorage.removeItem('currentBooth'); currentBooth = null;
  document.getElementById('mainApp').style.display = 'none';
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('loginPass').value = ''; loadLoginBooths();
}

/* ---------- مدیریت غرفه‌ها (مودال) ---------- */
function openManageBooths() { document.getElementById('manageBoothsModal').style.display = 'flex'; renderManageBooths(); }
function closeManageBooths() { document.getElementById('manageBoothsModal').style.display = 'none'; loadLoginBooths(); }
function renderManageBooths() {
  const booths = getBooths(); const list = document.getElementById('boothListManage');
  list.innerHTML = booths.map((b, index) => `<div style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.5rem; margin-bottom:0.3rem; border-radius:0.4rem; border:1px solid #ddd;"><span style="font-size:0.85rem; font-weight:bold;">${b.name}</span><div style="display:flex; gap:5px;"><button onclick="editBooth(${index})" style="background:#e3f2fd; color:#0d47a1; border:none; padding:0.2rem 0.5rem; border-radius:0.3rem; cursor:pointer; font-size:0.7rem;">✏️ ویرایش</button>${booths.length > 1 ? `<button onclick="deleteBooth(${index})" style="background:#ffebee; color:#c62828; border:none; padding:0.2rem 0.5rem; border-radius:0.3rem; cursor:pointer; font-size:0.7rem;">حذف</button>` : ''}</div></div>`).join('');
}
function addNewBooth() {
  const name = document.getElementById('newBoothName').value.trim(); const pass = document.getElementById('newBoothPass').value;
  if (!name || !pass) return alert('نام و رمز غرفه را وارد کنید');
  const booths = getBooths(); if (booths.find(b => b.name === name)) return alert('این نام غرفه قبلاً وجود دارد');
  booths.push({ name, pass }); saveBooths(booths);
  document.getElementById('newBoothName').value = ''; document.getElementById('newBoothPass').value = '';
  renderManageBooths(); alert('✅ غرفه جدید اضافه شد');
}
function editBooth(index) {
  const booths = getBooths(); const booth = booths[index];
  const newName = prompt('نام جدید غرفه:', booth.name); if (newName === null) return; if (!newName.trim()) return alert('نام خالی است');
  const newPass = prompt('رمز جدید (برای تغییر ندادن لغو کنید):', '');
  if (newPass !== null && newPass.length > 0) { if (newPass.length < 4) return alert('رمز حداقل ۴ کاراکتر'); booth.pass = newPass; }
  const oldName = booth.name;
  if (newName.trim() !== oldName) {
    const keys = ['buys', 'sells', 'matches', 'hotel_codes', 'archives'];
    keys.forEach(k => { const data = localStorage.getItem(k + '_' + oldName); if (data) { localStorage.setItem(k + '_' + newName, data); localStorage.removeItem(k + '_' + oldName); } });
    booth.name = newName.trim();
  }
  saveBooths(booths); renderManageBooths();
  if (currentBooth === oldName && newName.trim() !== oldName) { sessionStorage.setItem('currentBooth', newName); currentBooth = newName; document.getElementById('headerBoothName').textContent = `🍎 حساب‌داری ${newName}`; document.getElementById('backupBoothName').textContent = newName; }
  alert('✅ اطلاعات ویرایش شد');
}
function deleteBooth(index) { if (!confirm('حذف شود؟')) return; const booths = getBooths(); booths.splice(index, 1); saveBooths(booths); renderManageBooths(); }

/* ---------- دیکشنری تطبیق نام‌ها ---------- */
function getMatches() { if (!currentBooth) return {}; return JSON.parse(localStorage.getItem('matches_' + currentBooth) || '{}'); }
function saveMatches(m) { if (currentBooth) localStorage.setItem('matches_' + currentBooth, JSON.stringify(m)); }
function normalizeName(name) { const matches = getMatches(); return matches[name] || name; }

/* ---------- ذخیره‌سازی داده‌های هر غرفه ---------- */
const DB = {
  get: (k) => { if (!currentBooth) return []; return JSON.parse(localStorage.getItem(k + '_' + currentBooth) || '[]'); },
  set: (k, v) => { if (!currentBooth) return; localStorage.setItem(k + '_' + currentBooth, JSON.stringify(v)); },
  add: (k, item) => { const a = DB.get(k); a.push(item); DB.set(k, a); }
};

/* ---------- گرفتن همه داده‌ها (باز + آرشیو) ---------- */
function getAllSells() {
  const currentSells = DB.get('sells');
  const archives = getArchives();
  const archiveSells = archives.flatMap(a => a.sells);
  return [...currentSells, ...archiveSells];
}
function getAllBuys() {
  const currentBuys = DB.get('buys');
  const archives = getArchives();
  const archiveBuys = archives.flatMap(a => a.buys);
  return [...currentBuys, ...archiveBuys];
}

/* ---------- کدینگ هتل‌ها ---------- */
function loadHotelCodes() {
  const codes = DB.get('hotel_codes');
  const list = document.getElementById('codingListBox');
  if (!list) return;
  if (!codes.length) { list.innerHTML = '<p style="text-align:center;color:#999;font-size:0.8rem">هنوز کدی تعریف نشده</p>'; return; }
  list.innerHTML = codes.map((c, index) => `<div style="display:flex; justify-content:space-between; align-items:center; padding:0.5rem; border-bottom:1px dashed #ccc;"><span style="font-size:0.85rem;"><strong>${c.code}</strong> - ${c.name}</span><button onclick="deleteHotelCode(${index})" style="background:#ffebee; color:#c62828; border:none; padding:0.2rem 0.5rem; border-radius:0.3rem; cursor:pointer; font-size:0.7rem;">حذف</button></div>`).join('');
}
function resolveHotelCode() {
  const codeInput = document.getElementById('sellHotelCode').value.trim();
  if (!codeInput) return;
  const codes = DB.get('hotel_codes');
  const found = codes.find(c => c.code === codeInput);
  if (found) { document.getElementById('sellHotel').value = found.name; }
}
function deleteHotelCode(index) { if (!confirm('حذف شود؟')) return; const codes = DB.get('hotel_codes'); codes.splice(index, 1); DB.set('hotel_codes', codes); loadHotelCodes(); }

/* ---------- پرونده‌ها (Archives) ---------- */
function getArchives() { return DB.get('archives'); }

function closeDay() {
  const buys = DB.get('buys'); const sells = DB.get('sells');
  if (!buys.length && !sells.length) return alert('پرونده امروز خالیه!');
  
  let sellDates = sells.map(s => s.date).filter(Boolean);
  let buyDates = buys.map(b => b.date).filter(Boolean);
  let archiveDate = sellDates.length > 0 ? sellDates.sort()[0] : (buyDates.length > 0 ? buyDates.sort()[0] : todayJalali());
  
  if (!confirm(`آیا از بستن پرونده مطمئن هستید؟ (تاریخ پرونده: ${archiveDate})`)) return;
  
  const archives = getArchives();
  const archiveId = Date.now();
  archives.push({ id: archiveId, label: `پرونده ${archiveDate}`, date: archiveDate, buys: buys, sells: sells });
  DB.set('archives', archives);
  DB.set('buys', []); DB.set('sells', []);
  
  loadAllData();
  alert('✅ پرونده بسته شد');
}

/* ---------- آرشیو: مشاهده، ویرایش و افزودن ---------- */
let editingArchiveId = null;

function renderArchiveList() {
  const list = document.getElementById('archiveListBox');
  const archives = getArchives();
  if (!archives.length) { list.innerHTML = '<p style="text-align:center;color:#999;font-size:0.85rem">هنوز پرونده‌ای بسته نشده</p>'; return; }
  list.innerHTML = archives.slice().reverse().map(a => `
    <div style="display:flex; justify-content:space-between; align-items:center; padding:0.6rem; border-bottom:1px dashed #ccc;">
      <span style="font-size:0.85rem; font-weight:bold;">${a.label}</span>
      <div style="display:flex; gap:5px;">
        <button onclick="openArchiveEdit(${a.id})" style="background:#e3f2fd; color:#0d47a1; border:none; padding:0.3rem 0.6rem; border-radius:0.3rem; cursor:pointer; font-size:0.75rem;">✏️ ویرایش / افزودن</button>
        <button onclick="deleteArchive(${a.id})" style="background:#ffebee; color:#c62828; border:none; padding:0.3rem 0.6rem; border-radius:0.3rem; cursor:pointer; font-size:0.75rem;">حذف</button>
      </div>
    </div>
  `).join('');
}

function openArchiveEdit(id) {
  const archives = getArchives();
  const archive = archives.find(a => String(a.id) === String(id));
  if (!archive) return;
  editingArchiveId = id;

  document.getElementById('archiveEditTitle').textContent = 'ویرایش: ' + archive.label;
  document.getElementById('archiveEditBox').style.display = 'block';

  let addButtons = `<div style="display:flex; gap:0.5rem; margin-bottom:1rem;">
    <button onclick="addNewItemToArchive(${id}, 'buys')" style="flex:1; background:#2e7d32; color:white; border:none; padding:0.6rem; border-radius:0.5rem; font-weight:bold; cursor:pointer; font-size:0.85rem;">➕ افزودن خرید</button>
    <button onclick="addNewItemToArchive(${id}, 'sells')" style="flex:1; background:#1976d2; color:white; border:none; padding:0.6rem; border-radius:0.5rem; font-weight:bold; cursor:pointer; font-size:0.85rem;">➕ افزودن فروش</button>
  </div>`;

  const buyList = document.getElementById('archiveBuyList');
  buyList.innerHTML = archive.buys.length ? archive.buys.map((b, i) => `
    <li style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.5rem; margin-bottom:0.3rem; border-radius:0.3rem;">
      <span>${showDate(b.date)} — ${b.fruit} — ${b.weight}kg × ${fmt(b.price)}</span>
      <div style="display:flex; gap:3px;">
        <button onclick="editArchiveItem(${id}, 'buys', ${i})" style="background:#e3f2fd; color:#0d47a1; border:none; padding:0.2rem 0.4rem; border-radius:0.2rem; cursor:pointer; font-size:0.7rem;">✏️</button>
        <button onclick="deleteArchiveItem(${id}, 'buys', ${i})" style="background:#ffebee; color:#c62828; border:none; padding:0.2rem 0.4rem; border-radius:0.2rem; cursor:pointer; font-size:0.7rem;">🗑️</button>
      </div>
    </li>
  `).join('') : '<li style="color:#999;">خریدی ثبت نشده</li>';

  const sellList = document.getElementById('archiveSellList');
  sellList.innerHTML = archive.sells.length ? archive.sells.map((s, i) => `
    <li style="display:flex; justify-content:space-between; align-items:center; background:white; padding:0.5rem; margin-bottom:0.3rem; border-radius:0.3rem;">
      <span>${showDate(s.date)} — ${s.hotel} — ${s.fruit} — ${s.weight}kg × ${fmt(s.price)} ${s.manualCost ? '(بهای دستی)' : ''}</span>
      <div style="display:flex; gap:3px;">
        <button onclick="editArchiveItem(${id}, 'sells', ${i})" style="background:#e3f2fd; color:#0d47a1; border:none; padding:0.2rem 0.4rem; border-radius:0.2rem; cursor:pointer; font-size:0.7rem;">✏️</button>
        <button onclick="deleteArchiveItem(${id}, 'sells', ${i})" style="background:#ffebee; color:#c62828; border:none; padding:0.2rem 0.4rem; border-radius:0.2rem; cursor:pointer; font-size:0.7rem;">🗑️</button>
      </div>
    </li>
  `).join('') : '<li style="color:#999;">فروشی ثبت نشده</li>';

  const container = document.getElementById('archiveEditBox');
  let addDiv = document.getElementById('archiveAddButtons');
  if (!addDiv) { addDiv = document.createElement('div'); addDiv.id = 'archiveAddButtons'; container.insertBefore(addDiv, document.getElementById('archiveBuyList').parentNode); }
  addDiv.innerHTML = addButtons;
}

function closeArchiveEdit() {
  document.getElementById('archiveEditBox').style.display = 'none';
  const addDiv = document.getElementById('archiveAddButtons');
  if (addDiv) addDiv.innerHTML = '';
  editingArchiveId = null;
}

function addNewItemToArchive(archiveId, type) {
  const archives = getArchives();
  const archive = archives.find(a => String(a.id) === String(archiveId));
  if (!archive) return;

  if (type === 'buys') {
    const date = prompt('تاریخ خرید:', archive.date); if (date === null) return;
    const fruit = prompt('نام میوه:'); if (fruit === null) return;
    const weight = prompt('وزن (کیلو):'); if (weight === null) return;
    const price = prompt('فی خرید (ریال):'); if (price === null) return;
    archive.buys.push({ id: Date.now(), date: date.trim(), fruit: fruit.trim(), weight: +weight, price: +price });
  } else {
    const date = prompt('تاریخ فروش:', archive.date); if (date === null) return;
    const hotel = prompt('نام هتل:'); if (hotel === null) return;
    const fruit = prompt('نام میوه:'); if (fruit === null) return;
    const weight = prompt('وزن (کیلو):'); if (weight === null) return;
    const price = prompt('فی فروش (ریال):'); if (price === null) return;
    const manualCost = prompt('بهای تمام‌شده دستی (اختیاری - برای رد کردن خالی بگذارید):', '');
    
    const newItem = { id: Date.now(), date: date.trim(), hotel: hotel.trim(), fruit: fruit.trim(), weight: +weight, price: +price };
    if (manualCost !== null && manualCost.trim() !== '') {
      newItem.manualCost = +manualCost;
    }
    archive.sells.push(newItem);
  }

  DB.set('archives', archives);
  openArchiveEdit(archiveId);
  alert('✅ آیتم جدید اضافه شد');
}

function editArchiveItem(archiveId, type, index) {
  const archives = getArchives();
  const archive = archives.find(a => String(a.id) === String(archiveId));
  if (!archive || !archive[type][index]) return;
  const item = archive[type][index];

  if (type === 'buys') {
    const newDate = prompt('تاریخ خرید:', item.date); if (newDate === null) return;
    const newFruit = prompt('نام میوه:', item.fruit); if (newFruit === null) return;
    const newWeight = prompt('وزن (کیلو):', item.weight); if (newWeight === null) return;
    const newPrice = prompt('فی خرید (ریال):', item.price); if (newPrice === null) return;
    item.date = newDate.trim(); item.fruit = newFruit.trim(); item.weight = parseFloat((+newWeight).toFixed(1)); item.price = +newPrice;
  } else {
    const newDate = prompt('تاریخ فروش:', item.date); if (newDate === null) return;
    const newHotel = prompt('نام هتل:', item.hotel); if (newHotel === null) return;
    const newFruit = prompt('نام میوه:', item.fruit); if (newFruit === null) return;
    const newWeight = prompt('وزن (کیلو):', item.weight); if (newWeight === null) return;
    const newPrice = prompt('فی فروش (ریال):', item.price); if (newPrice === null) return;
    
    let currentManualUnitPrice = '';
    if (item.manualCost !== undefined && item.manualCost !== null && item.weight > 0) {
      currentManualUnitPrice = Math.round(item.manualCost / item.weight);
    }
    const newManualUnitPrice = prompt('فی خرید (بهای تمام‌شده) برای این فروش (اختیاری):', currentManualUnitPrice);
    
    item.date = newDate.trim(); item.hotel = newHotel.trim(); item.fruit = newFruit.trim(); item.weight = parseFloat((+newWeight).toFixed(1)); item.price = +newPrice;
    
    if (newManualUnitPrice !== null) {
      if (newManualUnitPrice.trim() === '') {
        delete item.manualCost;
        delete item.manualUnitPrice;
      } else {
        const unitPrice = parseFloat(newManualUnitPrice) || 0;
        item.manualCost = unitPrice * item.weight;
        item.manualUnitPrice = unitPrice;
      }
    }
  }

  DB.set('archives', archives);
  openArchiveEdit(archiveId);
  alert('✅ ویرایش شد');
}

function deleteArchiveItem(archiveId, type, index) {
  if (!confirm('حذف شود؟')) return;
  const archives = getArchives();
  const archive = archives.find(a => String(a.id) === String(archiveId));
  if (!archive) return;
  archive[type].splice(index, 1);
  DB.set('archives', archives);
  openArchiveEdit(archiveId);
}

function deleteArchive(id) {
  if (!confirm('کل این پرونده حذف شود؟')) return;
  let archives = getArchives();
  archives = archives.filter(a => String(a.id) !== String(id));
  DB.set('archives', archives);
  renderArchiveList();
  if (editingArchiveId === id) closeArchiveEdit();
}

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
  if (id === 'coding') { loadHotelCodes(); }
  if (id === 'match') { fillMatchDropdown(); renderMatchList(); }
  if (id === 'analysis') { renderAnalysis(); }
  if (id === 'archive') { renderArchiveList(); closeArchiveEdit(); }
}
function setDefaultDate(id) { const el = document.getElementById(id); if (el && !el.value) el.value = todayJalali(); }

/* ---------- ثبت کدینگ ---------- */
document.getElementById('codingForm').addEventListener('submit', e => {
  e.preventDefault();
  const code = document.getElementById('codeHotelCode').value.trim();
  const name = document.getElementById('codeHotelName').value.trim();
  if (!code || !name) return;
  const codes = DB.get('hotel_codes');
  if (codes.find(c => c.code === code)) return alert('این کد قبلاً ثبت شده');
  codes.push({ code, name }); DB.set('hotel_codes', codes);
  document.getElementById('codeHotelCode').value = '';
  document.getElementById('codeHotelName').value = '';
  loadHotelCodes(); alert('✅ کد هتل ثبت شد');
});

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

function editBuy(id) {
  const buys = DB.get('buys'); const buy = buys.find(b => String(b.id) === String(id)); if (!buy) return;
  const newDate = prompt('تاریخ جدید:', buy.date); if (newDate === null) return;
  const newFruit = prompt('نام میوه:', buy.fruit); if (newFruit === null) return;
  const newWeight = prompt('وزن:', buy.weight); if (newWeight === null) return;
  const newPrice = prompt('فی خرید:', buy.price); if (newPrice === null) return;
  buy.date = newDate.trim(); buy.fruit = newFruit.trim(); buy.weight = parseFloat((+newWeight).toFixed(1)); buy.price = +newPrice;
  DB.set('buys', buys); renderBuy(); alert('✅ ویرایش شد');
}

function renderBuy() {
  const list = document.getElementById('buyList'); const buys = DB.get('buys').slice().reverse();
  list.innerHTML = buys.map(b => `<li><span style="flex:1">${showDate(b.date)} — ${b.fruit} — ${b.weight.toFixed(1)}kg × ${fmt(b.price)} ریال</span><div style="display:flex;gap:5px"><button class="del" style="background:#e3f2fd;color:#0d47a1;border:1px solid #90caf9" onclick="editBuy(${b.id})">✏️ ویرایش</button><button class="del" onclick="delItem('buys', ${b.id})">حذف</button></div></li>`).join('') || '<li>هنوز خریدی ثبت نشده</li>';
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
  let currentUnitPrice = ''; if (sell.manualCost !== undefined && sell.manualCost !== null && sell.weight > 0) { currentUnitPrice = Math.round(sell.manualCost / sell.weight); }
  const newUnitPrice = prompt(`فی خرید برای ${sell.weight.toFixed(1)} کیلو ${sell.fruit} (ریال):`, currentUnitPrice);
  if (newUnitPrice === null) return;
  const unitPrice = parseFloat(newUnitPrice) || 0;
  sell.manualCost = unitPrice * sell.weight; sell.manualUnitPrice = unitPrice;
  DB.set('sells', sells); renderSell(); alert(`✅ ثبت شد. بهای کل: ${fmt(sell.manualCost)} ریال`);
}
function renderSell() {
  const list = document.getElementById('sellList'); const sells = DB.get('sells').slice().reverse();
  list.innerHTML = sells.map(s => {
    const manualBadge = (s.manualCost !== undefined && s.manualCost !== null) ? `<span style="font-size:0.7rem;color:#ef6c00;margin-right:5px">(دستی)</span>` : '';
    return `<li><span style="flex:1">${showDate(s.date)} — ${s.hotel} — ${s.fruit} — ${s.weight.toFixed(1)}kg × ${fmt(s.price)} ریال ${manualBadge}</span><div style="display:flex;gap:5px"><button class="del" style="background:#fff3e0;color:#ef6c00;border:1px solid #ffcc80" onclick="editSellCost(${s.id})">✏️ بهای تمام‌شده</button><button class="del" onclick="delItem('sells', ${s.id})">حذف</button></div></li>`;
  }).join('') || '<li>هنوز فروشی ثبت نشده</li>';
}

function delItem(key, id) { if (!confirm('حذف شود؟')) return; DB.set(key, DB.get(key).filter(x => String(x.id) !== String(id))); if (key === 'buys') renderBuy(); else renderSell(); }
function clearAll() { if (!confirm('همه داده‌های این غرفه (به جز آرشیوها) پاک شوند؟')) return; DB.set('buys', []); DB.set('sells', []); renderReport(); alert('پاک شد'); }

/* ---------- آپلود اکسل فروش ---------- */
function importExcel() {
  const file = document.getElementById('excelFile').files[0]; if (!file) return alert('اول فایل اکسل رو انتخاب کن');
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result); const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]]; const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
      const sells = DB.get('sells'); let added = 0; let dataStarted = false;
      for (let i = 0; i < rows.length; i++) {
        const r = rows[i]; if (!r || r.length < 12) continue;
        const dateVal = String(r[3]).trim(); const hotelVal = String(r[5]).trim(); const fruitVal = String(r[6]).trim();
        const rawWeight = parseFloat(r[10]) || 0; const weightVal = parseFloat(rawWeight.toFixed(1)); const priceVal = parseFloat(r[11]) || 0;
        if (dateVal && fruitVal && weightVal > 0 && /^\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}$/.test(dateVal)) {
          sells.push({ id: Date.now() + i, date: dateVal, hotel: hotelVal || 'نامشخص', fruit: fruitVal, weight: weightVal, price: priceVal }); added++; dataStarted = true;
        } else if (dataStarted) { break; }
      }
      DB.set('sells', sells); renderSell(); alert(`✅ ${added} ردیف فروش اضافه شد`); document.getElementById('excelFile').value = '';
    } catch (err) { alert('خطا: ' + err.message); }
  };
  reader.readAsArrayBuffer(file);
}

/* ---------- محاسبات ---------- */
function getSellCost(sell) { if (sell.manualCost !== undefined && sell.manualCost !== null) return sell.manualCost; return avgBuyPrice(sell.fruit, sell.date) * sell.weight; }
function avgBuyPrice(fruit, date) {
  const allBuys = getAllBuys();
  const targetFruit = normalizeName(fruit);
  let buys = allBuys.filter(b => normalizeName(b.fruit) === targetFruit);
  
  if (date) {
    const dateNum = jalaliToNum(date);
    const buysBefore = buys.filter(b => jalaliToNum(b.date) <= dateNum);
    if (buysBefore.length > 0) buys = buysBefore;
  }

  if (!buys.length) return 0;
  const tw = buys.reduce((s, b) => s + b.weight, 0); const tc = buys.reduce((s, b) => s + b.weight * b.price, 0);
  return tw ? tc / tw : 0;
}
function calcProfit(sells) { return sells.reduce((sum, s) => sum + (s.weight * s.price - getSellCost(s)), 0); }
function stockOf(fruit) {
  const allBuys = getAllBuys();
  const allSells = getAllSells();
  const targetFruit = normalizeName(fruit);
  const bought = allBuys.filter(b => normalizeName(b.fruit) === targetFruit).reduce((s,b)=>s+b.weight,0);
  const sold = allSells.filter(s => normalizeName(s.fruit) === targetFruit).reduce((s,x)=>s+x.weight,0);
  return { bought, sold, remain: bought - sold };
}

/* ---------- تطبیق نام‌ها ---------- */
function fillMatchDropdown() {
  const allBuys = getAllBuys(); const allSells = getAllSells();
  const fruits = [...new Set([...allBuys.map(b=>b.fruit), ...allSells.map(s=>s.fruit)])].filter(Boolean).sort();
  const sel = document.getElementById('matchFrom');
  sel.innerHTML = '<option value="">انتخاب کنید...</option>' + fruits.map(f => `<option value="${f}">${f}</option>`).join('');
}
function addMatch() {
  const from = document.getElementById('matchFrom').value; const to = document.getElementById('matchTo').value.trim();
  if (!from || !to) return alert('هر دو فیلد رو پر کن'); if (from === to) return alert('نمی‌تونی به خودش وصل کنی');
  const matches = getMatches(); matches[from] = to; saveMatches(matches); document.getElementById('matchTo').value = ''; renderMatchList(); loadAllData();
}
function deleteMatch(key) { if (!confirm('حذف شود؟')) return; const matches = getMatches(); delete matches[key]; saveMatches(matches); renderMatchList(); loadAllData(); }
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
  const allSells = getAllSells(); const dates = [...new Set(allSells.map(s => s.date))].sort();
  const today = todayJalali(); const yesterday = daysAgoJalali(1);
  const todayCount = allSells.filter(s => s.date === today).length; const yesterdayCount = allSells.filter(s => s.date === yesterday).length;
  alert(`📅 امروز: ${today}\n📅 دیروز: ${yesterday}\n\n📊 تاریخ‌های ثبت‌شده (${dates.length}):\n${dates.join('\n') || 'هیچ'}\n\n💰 فروش امروز: ${todayCount} ردیف\n💰 فروش دیروز: ${yesterdayCount} ردیف`);
}

/* ---------- فیلترها ---------- */
function fillFilters() {
  const allSells = getAllSells(); const hotels = [...new Set(allSells.map(s => s.hotel).filter(Boolean))];
  const fruits = [...new Set(allSells.map(s => normalizeName(s.fruit)).filter(Boolean))];
  const hSel = document.getElementById('filterHotel'); const fSel = document.getElementById('filterFruit'); if (!hSel || !fSel) return;
  const curH = hSel.value, curF = fSel.value;
  hSel.innerHTML = '<option value="">همه هتل‌ها</option>' + hotels.map(h => `<option value="${h}">${h}</option>`).join('');
  fSel.innerHTML = '<option value="">همه میوه‌ها</option>' + fruits.map(f => `<option value="${f}">${f}</option>`).join('');
  hSel.value = curH; fSel.value = curF;
}
function getFilteredSells() {
  let sells = getAllSells(); 
  const h = document.getElementById('filterHotel')?.value; 
  const f = document.getElementById('filterFruit')?.value; 
  const from = document.getElementById('filterFrom')?.value.trim(); 
  const to = document.getElementById('filterTo')?.value.trim();
  if (h) sells = sells.filter(s => s.hotel === h); if (f) sells = sells.filter(s => normalizeName(s.fruit) === f);
  if (from) { const fromNum = jalaliToNum(from); sells = sells.filter(s => jalaliToNum(s.date) >= fromNum); }
  if (to) { const toNum = jalaliToNum(to); sells = sells.filter(s => jalaliToNum(s.date) <= toNum); }
  return sells;
}
function resetFilter() { document.getElementById('filterHotel').value = ''; document.getElementById('filterFruit').value = ''; document.getElementById('filterFrom').value = ''; document.getElementById('filterTo').value = ''; renderReport(); }

/* ---------- داشبورد ---------- */
function renderDashboard() {
  const allSells = getAllSells(); const today = todayJalali(); const yesterday = daysAgoJalali(1);
  const todayProfit = calcProfit(allSells.filter(s => s.date === today)); 
  const yesterdayProfit = calcProfit(allSells.filter(s => s.date === yesterday));
  document.getElementById('todayProfit').textContent = fmt(todayProfit) + ' ریال'; renderChange('todayChange', todayProfit, yesterdayProfit);

  const weekStartNum = jalaliToNum(daysAgoJalali(7)); const week2StartNum = jalaliToNum(daysAgoJalali(14));
  const thisWeek = calcProfit(allSells.filter(s => jalaliToNum(s.date) >= weekStartNum));
  const lastWeek = calcProfit(allSells.filter(s => { const n = jalaliToNum(s.date); return n >= week2StartNum && n < weekStartNum; }));
  document.getElementById('weekProfit').textContent = fmt(thisWeek) + ' ریال'; renderChange('weekChange', thisWeek, lastWeek);

  const monthStartNum = jalaliToNum(daysAgoJalali(30)); const month2StartNum = jalaliToNum(daysAgoJalali(60));
  const thisMonth = calcProfit(allSells.filter(s => jalaliToNum(s.date) >= monthStartNum));
  const lastMonth = calcProfit(allSells.filter(s => { const n = jalaliToNum(s.date); return n >= month2StartNum && n < monthStartNum; }));
  document.getElementById('monthProfit').textContent = fmt(thisMonth) + ' ریال'; renderChange('monthChange', thisMonth, lastMonth);

  const allFruits = [...new Set([...getAllBuys().map(b => b.fruit), ...allSells.map(s => s.fruit)])].map(normalizeName);
  const uniqueFruits = [...new Set(allFruits)];

  document.getElementById('stockBox').innerHTML = uniqueFruits.map(f => {
    const st = stockOf(f); const isNegative = st.remain < -0.01;
    const badge = isNegative ? `<span class="badge negative">فروش بیشتر از خرید: ${Math.abs(st.remain).toFixed(1)} کیلو</span>` : (st.remain === 0 ? '<span class="badge out">تموم شد</span>' : `<span class="badge ok">${st.remain.toFixed(1)} کیلو موجود</span>`);
    return `<div class="report-row ${isNegative ? 'negative-row' : ''}"><span>${f}</span><span>خرید: ${st.bought.toFixed(1)}kg — فروش: ${st.sold.toFixed(1)}kg ${badge}</span></div>`;
  }).join('') || '<div class="report-row">هنوز داده‌ای نیست</div>';
}

/* ---------- گزارش ---------- */
function renderReport() { const sells = getFilteredSells(); renderHotelReport(sells); renderProfitMargin(sells); renderChart(sells); }

/* ---------- تحلیل داده ---------- */
function renderAnalysis() {
  const archives = getArchives();
  const currentBuys = DB.get('buys'); const currentSells = DB.get('sells');
  const allBuys = [...currentBuys, ...archives.flatMap(a => a.buys)];
  const allSells = [...currentSells, ...archives.flatMap(a => a.sells)];
  const box = document.getElementById('analysisBox');
  let html = '';

  const missingSellPrice = allSells.filter(s => !s.price || s.price === 0);
  if (missingSellPrice.length > 0) {
    html += `<div style="background:#ffebee; padding:1rem; border-radius:0.5rem; margin-bottom:1rem;"><h3 style="color:#c62828; font-size:0.95rem; margin-bottom:0.5rem;">⚠️ ${missingSellPrice.length} فروش بدون فی فروش:</h3><ul style="font-size:0.8rem; color:#666; padding-right:1rem; list-style-type:disc;">`;
    missingSellPrice.slice(0, 20).forEach(s => { html += `<li>${showDate(s.date)} - ${s.hotel} - ${s.fruit} (${s.weight} کیلو)</li>`; });
    if (missingSellPrice.length > 20) html += `<li>و ${missingSellPrice.length - 20} مورد دیگر...</li>`;
    html += `</ul></div>`;
  }

  const missingBuyPrice = allBuys.filter(b => !b.price || b.price === 0);
  if (missingBuyPrice.length > 0) {
    html += `<div style="background:#fff3e0; padding:1rem; border-radius:0.5rem; margin-bottom:1rem;"><h3 style="color:#e65100; font-size:0.95rem; margin-bottom:0.5rem;">⚠️ ${missingBuyPrice.length} خرید بدون فی خرید:</h3><ul style="font-size:0.8rem; color:#666; padding-right:1rem; list-style-type:disc;">`;
    missingBuyPrice.slice(0, 20).forEach(b => { html += `<li>${showDate(b.date)} - ${b.fruit} (${b.weight} کیلو)</li>`; });
    if (missingBuyPrice.length > 20) html += `<li>و ${missingBuyPrice.length - 20} مورد دیگر...</li>`;
    html += `</ul></div>`;
  }

  const sellsWithoutCost = allSells.filter(s => {
    if (s.manualCost !== undefined && s.manualCost !== null) return false;
    const allBuysForFruit = allBuys.filter(b => normalizeName(b.fruit) === normalizeName(s.fruit));
    return allBuysForFruit.length === 0;
  });
  if (sellsWithoutCost.length > 0) {
    html += `<div style="background:#e3f2fd; padding:1rem; border-radius:0.5rem; margin-bottom:1rem;"><h3 style="color:#0d47a1; font-size:0.95rem; margin-bottom:0.5rem;">⚠️ ${sellsWithoutCost.length} فروش بدون بهای تمام‌شده:</h3><p style="font-size:0.75rem; color:#666; margin-bottom:0.5rem;">برای این فروش‌ها خریدی ثبت نشده و دستی هم بهای تمام‌شده رو وارد نکردی.</p><ul style="font-size:0.8rem; color:#666; padding-right:1rem; list-style-type:disc;">`;
    sellsWithoutCost.slice(0, 20).forEach(s => { html += `<li>${showDate(s.date)} - ${s.hotel} - ${s.fruit} (${s.weight} کیلو)</li>`; });
    if (sellsWithoutCost.length > 20) html += `<li>و ${sellsWithoutCost.length - 20} مورد دیگر...</li>`;
    html += `</ul></div>`;
  }

  if (!html) {
    html = `<div style="text-align:center; padding:2rem; color:#2e7d32;"><div style="font-size:3rem; margin-bottom:1rem;">🎉</div><h3 style="margin-bottom:0.5rem;">همه‌چیز مرتبه!</h3><p style="font-size:0.85rem; color:#666;">تمام خریدها و فروش‌های همه پرونده‌ها فی و بهای تمام‌شده دارن.</p></div>`;
  }
  box.innerHTML = html;
  
  // چشمک زدن در صورت وجود هشدار
  box.classList.toggle('blink-warning', html.includes('⚠️'));
}

/* ---------- حاشیه سود ---------- */
function renderProfitMargin(sells) {
  const box = document.getElementById('profitMarginBox'); if (!box) return;
  const fruits = [...new Set(sells.map(s => normalizeName(s.fruit)))].filter(Boolean);
  if (!fruits.length) { box.innerHTML = '<div style="text-align:center;color:#999;font-size:0.85rem">داده‌ای برای محاسبه نیست</div>'; return; }
  const data = fruits.map(f => {
    const fs = sells.filter(s => normalizeName(s.fruit) === f);
    const cost = fs.reduce((a,s) => a + getSellCost(s), 0); const revenue = fs.reduce((a,s) => a + s.weight * s.price, 0);
    const profit = revenue - cost; const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    return { fruit: f, profit, revenue, margin };
  });
  data.sort((a, b) => b.margin - a.margin);
  box.innerHTML = data.map(d => {
    let color = '#66bb6a'; if (d.margin < 0) color = '#ef5350'; else if (d.margin < 10) color = '#ff9800';
    const barWidth = Math.min(Math.max(d.margin, 0), 100); 
    return `<div class="margin-row"><span style="width: 80px; font-weight:bold; font-size:0.8rem;">${d.fruit}</span><div class="margin-bar-bg"><div class="margin-bar-fill" style="width: ${barWidth}%; background-color: ${color};"></div></div><span class="margin-pct" style="color: ${color};">${d.margin.toFixed(1)}%</span></div>`;
  }).join('');
}

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
  const fruitsForMargin = [...new Set(sells.map(s => normalizeName(s.fruit)))].filter(Boolean);
  let marginRows = fruitsForMargin.map(f => {
    const fs = sells.filter(s => normalizeName(s.fruit) === f);
    const cost = fs.reduce((a,s) => a + getSellCost(s), 0); const revenue = fs.reduce((a,s) => a + s.weight * s.price, 0);
    const profit = revenue - cost; const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    let color = '#2e7d32'; if (margin < 0) color = '#c62828'; else if (margin < 10) color = '#e65100';
    return `<tr><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${f}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(revenue)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${fmt(profit)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px;color:${color};font-weight:bold">${margin.toFixed(1)}%</td></tr>`;
  }).join('');
  if (!fruitsForMargin.length) marginRows = '<tr><td colspan="4" style="text-align:center;padding:10px;color:#999">داده‌ای نیست</td></tr>';
  const allFruits = [...new Set([...getAllBuys().map(b => b.fruit), ...sells.map(s => s.fruit)])].map(normalizeName); const uniqueFruits = [...new Set(allFruits)];
  const stockRows = uniqueFruits.map(f => { const st = stockOf(f); const isNeg = st.remain < -0.01; const status = isNeg ? `<span style="color:#0d47a1;font-weight:bold">⚠ فروش بیشتر از خرید (${Math.abs(st.remain).toFixed(1)} kg)</span>` : (st.remain === 0 ? '<span style="color:#c62828">تموم شد</span>' : `<span style="color:#2e7d32">${st.remain.toFixed(1)} kg موجود</span>`); return `<tr><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${f}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${st.bought.toFixed(1)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${st.sold.toFixed(1)}</td><td style="border:1px solid #a5d6a7;padding:6px;font-size:11px">${status}</td></tr>`; }).join('') || '<tr><td colspan="4" style="text-align:center;padding:10px;color:#999">داده‌ای نیست</td></tr>';
  return `<div style="font-family:Tahoma;direction:rtl;padding:15px;color:#1b3a1b;background:white;font-size:12px"><h2 style="text-align:center;color:#2e7d32;border-bottom:2px solid #66bb6a;padding-bottom:8px;font-size:16px">🍎 ${title}</h2><p style="text-align:center;font-size:11px;color:#666;margin:6px 0">${subtitle || ''} — تاریخ: ${today}</p><div style="background:#c8e6c9;padding:10px;border-radius:6px;text-align:center;margin:10px 0"><strong style="font-size:13px">💰 سود ناخالص کل: </strong><strong style="font-size:15px;color:${totalProfit>=0?'#2e7d32':'#c62828'}">${fmt(totalProfit)} ریال</strong></div><h3 style="color:#2e7d32;margin-top:15px;font-size:13px;border-bottom:1px solid #a5d6a7;padding-bottom:4px">📊 حاشیه سود هر میوه</h3><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="background:#e8f5e9"><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">میوه</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">جمع فروش</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">سود</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">درصد سود</th></tr></thead><tbody>${marginRows}</tbody></table><h3 style="color:#2e7d32;margin-top:15px;font-size:13px;border-bottom:1px solid #a5d6a7;padding-bottom:4px">🏨 تفکیک فروش و سود هر هتل</h3>${hotelsHtml}<h3 style="color:#2e7d32;margin-top:15px;font-size:13px;border-bottom:1px solid #a5d6a7;padding-bottom:4px">📦 موجودی میوه‌ها</h3><table style="width:100%;border-collapse:collapse;margin-top:6px"><thead><tr style="background:#e8f5e9"><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">میوه</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">خرید (kg)</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">فروش (kg)</th><th style="border:1px solid #a5d6a7;padding:6px;font-size:11px;text-align:right">وضعیت</th></tr></thead><tbody>${stockRows}</tbody></table><p style="margin-top:15px;font-size:10px;color:#999;text-align:center">ساخته‌شده با سیستم حساب‌داری میدان تره‌بار — همه مبالغ به ریال</p></div>`;
}

function generateAndDownloadPDF(html, filename) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert('لطفاً به مرورگر اجازه بده پنجره جدید باز کنه.'); return; }
  printWindow.document.write(`
    <!DOCTYPE html>
    <html dir="rtl" lang="fa">
    <head>
      <meta charset="UTF-8">
      <title>${filename}</title>
      <style>
        body { font-family: Tahoma, sans-serif; padding: 15px; background: white; color: #1b3a1b; }
        table { width: 100%; border-collapse: collapse; }
        th, td { border: 1px solid #a5d6a7; padding: 6px; font-size: 11px; text-align: right; }
        th { background-color: #e8f5e9; color: #2e7d32; }
        .summary-box { background-color: #c8e6c9; padding: 10px; border-radius: 6px; text-align: center; margin: 10px 0; }
        @media print {
          body { -webkit-print-color-adjust: exact; }
          @page { size: A4; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      ${html}
      <script>
        window.onload = function() { window.print(); };
      </script>
    </body>
    </html>
  `);
  printWindow.document.close();
}

function downloadPDF() { const sells = getFilteredSells(); if(!sells.length) return alert('داده‌ای وجود ندارد'); generateAndDownloadPDF(buildPDFHtml(sells, 'گزارش سود و زیان — ' + currentBooth, 'گزارش کامل'), `گزارش-کامل-${todayJalali().replace(/\//g,'-')}`); }
function downloadPDFWeek() { const weekStartNum = jalaliToNum(daysAgoJalali(7)); const weekSells = getAllSells().filter(s => jalaliToNum(s.date) >= weekStartNum); if (!weekSells.length) return alert('فروشی در هفته اخیر ثبت نشده'); generateAndDownloadPDF(buildPDFHtml(weekSells, 'گزارش هفتگی — ' + currentBooth, `از ${daysAgoJalali(7)} تا ${todayJalali()}`), `گزارش-هفتگی-${todayJalali().replace(/\//g,'-')}`); }
function downloadPDFMonth() { const monthStartNum = jalaliToNum(daysAgoJalali(30)); const monthSells = getAllSells().filter(s => jalaliToNum(s.date) >= monthStartNum); if (!monthSells.length) return alert('فروشی در ماه اخیر ثبت نشده'); generateAndDownloadPDF(buildPDFHtml(monthSells, 'گزارش ماهانه — ' + currentBooth, `از ${daysAgoJalali(30)} تا ${todayJalali()}`), `گزارش-ماهانه-${todayJalali().replace(/\//g,'-')}`); }
function downloadPDFDay() { const today = todayJalali(); const todayNum = jalaliToNum(today); const todaySells = getAllSells().filter(s => jalaliToNum(s.date) === todayNum); if (!todaySells.length) return alert('فروشی برای امروز ثبت نشده'); generateAndDownloadPDF(buildPDFHtml(todaySells, 'گزارش روزانه — ' + currentBooth, `تاریخ: ${today}`), `گزارش-روزانه-${today.replace(/\//g,'-')}`); }
function downloadPDFCustom() { const customDate = document.getElementById('pdfCustomDate').value.trim(); if (!customDate) return alert('لطفاً یک تاریخ وارد کنید (مثلاً 1403/08/15)'); const customNum = jalaliToNum(customDate); const customSells = getAllSells().filter(s => jalaliToNum(s.date) === customNum); if (!customSells.length) return alert(`هیچ فروشی برای تاریخ ${customDate} ثبت نشده است.`); generateAndDownloadPDF(buildPDFHtml(customSells, 'گزارش روزانه — ' + currentBooth, `تاریخ: ${customDate}`), `گزارش-${customDate.replace(/\//g,'-')}`); }

/* ---------- پشتیبان‌گیری ---------- */
function exportJSON() { const data = { booth: currentBooth, buys: DB.get('buys'), sells: DB.get('sells'), matches: getMatches(), hotel_codes: DB.get('hotel_codes'), archives: getArchives(), exportDate: new Date().toISOString() }; const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }); const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `پشتیبان-${currentBooth}-${todayJalali().replace(/\//g,'-')}.json`; a.click(); }
function exportExcel() {
  const buys = DB.get('buys'); const sells = DB.get('sells'); const wb = XLSX.utils.book_new();
  const buyData = [['تاریخ','میوه','وزن','فی خرید (ریال)','جمع خرید (ریال)']]; buys.forEach(b => buyData.push([b.date, b.fruit, b.weight, b.price, b.weight * b.price]));
  const sellData = [['تاریخ','هتل','میوه','وزن','فی فروش (ریال)','جمع فروش (ریال)']]; sells.forEach(s => sellData.push([s.date, s.hotel, s.fruit, s.weight, s.price, s.weight * s.price]));
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(buyData), 'خرید'); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(sellData), 'فروش'); XLSX.writeFile(wb, `پشتیبان-${currentBooth}-${todayJalali().replace(/\//g,'-')}.xlsx`);
}
function restoreJSON() {
  const file = document.getElementById('restoreFile').files[0]; if (!file) return alert('اول فایل پشتیبان رو انتخاب کن'); if (!confirm('داده‌های فعلی این غرفه با فایل پشتیبان جایگزین می‌شن. ادامه؟')) return;
  const reader = new FileReader(); reader.onload = (e) => { try { const data = JSON.parse(e.target.result); if (!data.buys || !data.sells) throw new Error('فرمت فایل نامعتبره'); DB.set('buys', data.buys); DB.set('sells', data.sells); if (data.matches) saveMatches(data.matches); if (data.hotel_codes) DB.set('hotel_codes', data.hotel_codes); if (data.archives) DB.set('archives', data.archives); alert(`✅ بازیابی شد: ${data.buys.length} خرید، ${data.sells.length} فروش`); document.getElementById('restoreFile').value = ''; loadAllData(); } catch (err) { alert('خطا در بازیابی: ' + err.message); } }; reader.readAsText(file);
}

/* ---------- شروع ---------- */
function loadAllData() {
  if (!currentBooth) return;
  document.getElementById('backupBoothName').textContent = currentBooth;
  renderBuy(); renderSell(); renderDashboard(); fillFilters(); renderReport(); renderAnalysis(); renderArchiveList();
}
window.addEventListener('load', () => {
  loadLoginBooths();
  if (sessionStorage.getItem('loggedIn') === '1' && currentBooth) { document.getElementById('loginScreen').style.display = 'none'; document.getElementById('mainApp').style.display = 'block'; document.getElementById('headerBoothName').textContent = `🍎 حساب‌داری ${currentBooth}`; loadAllData(); } else { document.getElementById('loginScreen').style.display = 'flex'; document.getElementById('mainApp').style.display = 'none'; }
});
