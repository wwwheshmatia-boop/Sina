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

  function getBuys() { return LS.get('buys'); }
  function saveBuys(b) { LS.set('buys', b); }
  function getSuppliers() { return LS.get('suppliers'); }

  const safeFmt = (n) => (typeof fmt === 'function' ? fmt(n) : String(Math.round(n)));

  // تزریق دکمه توی فرم خرید
  function injectButton() {
    const form = document.getElementById('buyForm');
    if (!form || document.getElementById('bulkInvoiceBtn')) return;
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.id = 'bulkInvoiceBtn';
    btn.textContent = '📦 فاکتور تجمیعی';
    btn.style.cssText = 'background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;border:none;padding:0.7rem;border-radius:0.6rem;font-weight:bold;cursor:pointer;font-size:0.9rem;margin-bottom:0.5rem;width:100%;';
    btn.onclick = openBulkModal;
    form.parentNode.insertBefore(btn, form);
  }

  // مودال فاکتور تجمیعی
  function openBulkModal() {
    const suppliers = getSuppliers();
    const modal = document.createElement('div');
    modal.id = 'bulkModal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.8);z-index:3000;display:flex;align-items:flex-start;justify-content:center;padding:1rem;overflow-y:auto;';
    modal.innerHTML = `
      <div style="background:white;border-radius:1rem;padding:1rem;width:100%;max-width:520px;margin-top:1rem;">
        <div style="background:linear-gradient(135deg,#7c3aed,#6d28d9);color:white;padding:0.8rem 1rem;border-radius:0.6rem;font-weight:bold;margin-bottom:0.7rem;display:flex;justify-content:space-between;">
          <span>📦 فاکتور تجمیعی خرید</span>
          <button onclick="document.getElementById('bulkModal').remove()" style="background:rgba(255,255,255,0.2);color:white;border:none;padding:0.3rem 0.6rem;border-radius:0.4rem;cursor:pointer;">✖</button>
        </div>
        <label style="font-size:0.75rem;color:#475569;font-weight:bold;">فروشنده:</label>
        <div style="display:flex;gap:0.3rem;margin-bottom:0.6rem;">
          <select id="bulkSupplier" style="flex:2;padding:0.55rem;border:1px solid #cbd5e1;border-radius:0.45rem;font-size:0.85rem;">
            <option value="">فروشنده...</option>
            ${suppliers.map(s => '<option value="' + s.name + '">' + s.name + '</option>').join('')}
          </select>
          <input type="text" id="bulkSupplierNew" placeholder="یا اسم جدید" style="flex:1;padding:0.55rem;border:1px solid #cbd5e1;border-radius:0.45rem;font-size:0.85rem;">
        </div>
        <label style="font-size:0.75rem;color:#475569;font-weight:bold;">تاریخ:</label>
        <input type="text" id="bulkDate" placeholder="مثلاً 1405/08/22" style="width:100%;padding:0.55rem;border:1px solid #cbd5e1;border-radius:0.45rem;font-size:0.85rem;margin-bottom:0.6rem;">
        <label style="font-size:0.75rem;color:#475569;font-weight:bold;">ردیف‌ها:</label>
        <div id="bulkRows"></div>
        <button type="button" onclick="window.__BULK_addRow()" style="background:#16a34a;color:white;border:none;padding:0.5rem 0.8rem;border-radius:0.45rem;font-weight:bold;cursor:pointer;font-size:0.8rem;margin-top:0.4rem;">➕ افزودن ردیف</button>
        <div style="background:#f1f5f9;padding:0.6rem;border-radius:0.45rem;margin-top:0.6rem;display:flex;justify-content:space-between;font-size:0.85rem;">
          <b>جمع کل:</b>
          <b id="bulkTotal" style="color:#7c3aed;">۰ ریال</b>
        </div>
        <div style="display:flex;gap:0.4rem;margin-top:0.7rem;">
          <button onclick="window.__BULK_save()" style="flex:1;background:linear-gradient(135deg,#2563eb,#1d4ed8);color:white;border:none;padding:0.7rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">💾 ثبت فاکتور</button>
          <button onclick="document.getElementById('bulkModal').remove()" style="flex:1;background:#eee;color:#333;border:none;padding:0.7rem;border-radius:0.5rem;font-weight:bold;cursor:pointer;font-size:0.85rem;">انصراف</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    // ۳ ردیف اولیه
    addRow(); addRow(); addRow();
  }

  let rowCount = 0;
  function addRow() {
    const box = document.getElementById('bulkRows');
    if (!box) return;
    rowCount++;
    const id = 'bulkRow_' + rowCount;
    const div = document.createElement('div');
    div.id = id;
    div.style.cssText = 'display:grid;grid-template-columns:2fr 1fr 1.5fr 30px;gap:0.3rem;margin-bottom:0.3rem;';
    div.innerHTML = `
      <input type="text" class="bulk-fruit" placeholder="میوه" style="padding:0.4rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.8rem;">
      <input type="number" class="bulk-weight" placeholder="کیلو" step="0.1" oninput="window.__BULK_updateTotal()" style="padding:0.4rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.8rem;">
      <input type="number" class="bulk-price" placeholder="فی (ریال)" oninput="window.__BULK_updateTotal()" style="padding:0.4rem;border:1px solid #cbd5e1;border-radius:0.4rem;font-size:0.8rem;">
      <button type="button" onclick="document.getElementById('${id}').remove(); window.__BULK_updateTotal()" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;border-radius:0.4rem;cursor:pointer;font-weight:bold;font-size:0.8rem;">✖</button>
    `;
    box.appendChild(div);
  }

  function updateTotal() {
    const rows = document.querySelectorAll('#bulkRows > div');
    let total = 0;
    rows.forEach(r => {
      const w = parseFloat(r.querySelector('.bulk-weight').value) || 0;
      const p = parseFloat(r.querySelector('.bulk-price').value) || 0;
      total += w * p;
    });
    const el = document.getElementById('bulkTotal');
    if (el) el.textContent = safeFmt(total) + ' ریال';
  }

  function saveBulk() {
    const sel = document.getElementById('bulkSupplier');
    const newInp = document.getElementById('bulkSupplierNew');
    const supplier = (sel ? sel.value : '') || (newInp ? newInp.value.trim() : '');
    const date = (document.getElementById('bulkDate') ? document.getElementById('bulkDate').value.trim() : '');
    if (!supplier) return alert('فروشنده رو انتخاب کن.');
    if (!date) return alert('تاریخ رو وارد کن.');

    const rows = document.querySelectorAll('#bulkRows > div');
    const items = [];
    rows.forEach(r => {
      const fruit = r.querySelector('.bulk-fruit').value.trim();
      const weight = parseFloat(r.querySelector('.bulk-weight').value) || 0;
      const price = parseFloat(r.querySelector('.bulk-price').value) || 0;
      if (fruit && weight > 0 && price > 0) {
        items.push({ fruit, weight, price });
      }
    });
    if (!items.length) return alert('حداقل یک ردیف با میوه، وزن و فی وارد کن.');

    const invoiceId = 'inv_' + Date.now();
    const buys = getBuys();
    items.forEach((it, idx) => {
      buys.push({
        id: Date.now() + idx,
        invoiceId,
        supplier,
        date,
        fruit: it.fruit,
        weight: parseFloat(it.weight.toFixed(1)),
        price: it.price
      });
    });
    saveBuys(buys);

    // ثبت فروشنده اگه جدید بود
    const suppliers = getSuppliers();
    if (!suppliers.find(s => s.name === supplier)) {
      suppliers.push({ id: Date.now(), name: supplier, createdAt: Date.now() });
      LS.set('suppliers', suppliers);
    }

    const total = items.reduce((a, it) => a + it.weight * it.price, 0);
    alert('✅ فاکتور تجمیعی ثبت شد.\n' + items.length + ' ردیف — جمع ' + safeFmt(total) + ' ریال');

    document.getElementById('bulkModal').remove();
    rowCount = 0;
    if (typeof renderBuy === 'function') renderBuy();
    if (typeof window.__ACC_refresh === 'function') window.__ACC_refresh();
  }

  function init() {
    const t = setInterval(() => {
      const main = document.getElementById('mainApp');
      if (main && main.style.display !== 'none') {
        const orig = window.showPage;
        if (typeof orig === 'function' && !window.__BULK_wrapped) {
          window.__BULK_wrapped = true;
          window.showPage = function (id) {
            orig(id);
            if (id === 'buy') setTimeout(injectButton, 100);
          };
        }
        clearInterval(t);
      }
    }, 500);
  }

  window.__BULK_addRow = addRow;
  window.__BULK_updateTotal = updateTotal;
  window.__BULK_save = saveBulk;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
