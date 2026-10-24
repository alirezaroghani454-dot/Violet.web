/* ==========================================================
   Violet admin — products.js
   Product list: search, filters, inline stock edit, bulk
   actions, duplicate / delete, CSV export.
   (The big add / edit form lives in product-editor.js)
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$, $$ = VA.$$;
  const PER = 12;
  const st = { q: '', col: '', status: '', gender: '', sort: 'new', page: 1, sel: {} };

  function filtered() {
    const q = U.toEn(st.q).trim().toLowerCase();
    let list = DB.products.all().filter((p) => {
      if (st.col && p.collection !== st.col) return false;
      if (st.gender && p.gender !== st.gender) return false;
      if (st.status === 'active' && p.active === false) return false;
      if (st.status === 'hidden' && p.active !== false) return false;
      if (st.status === 'low' && !(p.stock > 0 && p.stock <= 3)) return false;
      if (st.status === 'out' && p.stock > 0) return false;
      if (st.status === 'sale' && !(p.oldPrice > p.price)) return false;
      if (st.status === 'featured' && !p.featured) return false;
      if (q && [p.name, p.sku, VA.colName(p.collection)].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
    const by = {
      new: (a, b) => b.createdAt - a.createdAt,
      name: (a, b) => a.name.localeCompare(b.name),
      priceAsc: (a, b) => a.price - b.price,
      priceDesc: (a, b) => b.price - a.price,
      stock: (a, b) => a.stock - b.stock,
      sold: (a, b) => (b.sold || 0) - (a.sold || 0)
    };
    return list.sort(by[st.sort] || by.new);
  }

  function stockTag(p) {
    if (p.stock <= 0) return VA.tag('ناموجود', 'var(--danger)');
    if (p.stock <= 3) return VA.tag('کم‌موجود', 'var(--warn)');
    return '';
  }

  function render(root) {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER));
    if (st.page > pages) st.page = pages;
    const rows = list.slice((st.page - 1) * PER, st.page * PER);
    const selCount = Object.keys(st.sel).length;
    const cols = DB.collections.sorted();

    root.innerHTML =
      '<div class="toolbar">' +
      '<input class="input grow" id="pq" type="search" placeholder="جستجوی نام، کد کالا یا کلکسیون…" value="' + U.esc(st.q) + '">' +
      '<select class="select" id="pcol"><option value="">همه‌ی کلکسیون‌ها</option>' + cols.map((c) => '<option value="' + c.id + '"' + (st.col === c.id ? ' selected' : '') + '>' + U.esc(c.name) + '</option>').join('') + '</select>' +
      '<select class="select" id="pstatus">' + [['', 'همه‌ی وضعیت‌ها'], ['active', 'فعال'], ['hidden', 'پنهان'], ['low', 'کم‌موجود'], ['out', 'ناموجود'], ['sale', 'تخفیف‌دار'], ['featured', 'منتخب']].map((o) => '<option value="' + o[0] + '"' + (st.status === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' +
      '<select class="select" id="pgender">' + [['', 'همه'], ['men', 'آقایان'], ['women', 'بانوان'], ['unisex', 'یونی‌سکس']].map((o) => '<option value="' + o[0] + '"' + (st.gender === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' +
      '<select class="select" id="psort">' + [['new', 'جدیدترین'], ['name', 'نام'], ['priceAsc', 'ارزان‌ترین'], ['priceDesc', 'گران‌ترین'], ['stock', 'کمترین موجودی'], ['sold', 'پرفروش‌ترین']].map((o) => '<option value="' + o[0] + '"' + (st.sort === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' +
      '<button class="btn" id="pexport">' + VI('download') + 'خروجی CSV</button>' +
      '<button class="btn btn-primary" id="padd">' + VI('plus') + 'محصول جدید</button></div>' +

      '<div class="muted" style="font-size:.88rem">' + U.toFa(list.length) + ' محصول' + (selCount ? ' · ' + U.toFa(selCount) + ' مورد انتخاب‌شده' : '') + '</div>' +

      (selCount ? '<div class="card" style="padding:14px 18px"><div class="toolbar"><b>عملیات گروهی:</b>' +
        '<button class="btn btn-sm" data-bulk="show">نمایش در سایت</button><button class="btn btn-sm" data-bulk="hide">پنهان‌کردن</button>' +
        '<button class="btn btn-sm" data-bulk="feature">منتخب‌کردن</button><button class="btn btn-sm" data-bulk="unfeature">حذف از منتخب‌ها</button>' +
        '<button class="btn btn-sm" data-bulk="discount">اعمال تخفیف درصدی…</button><button class="btn btn-sm" data-bulk="stock">افزایش موجودی…</button>' +
        '<button class="btn btn-sm btn-danger" data-bulk="delete">حذف</button><button class="btn btn-sm btn-ghost" data-bulk="clear">لغو انتخاب</button></div></div>' : '') +

      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:40px"><input type="checkbox" id="pall" aria-label="انتخاب همه‌ی این صفحه"' + (rows.length && rows.every((p) => st.sel[p.id]) ? ' checked' : '') + '></th><th>محصول</th><th>کلکسیون</th><th>قیمت</th><th>موجودی</th><th>فروش</th><th>نمایش</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map((p) =>
        '<tr data-id="' + p.id + '"><td><input type="checkbox" data-sel="' + p.id + '"' + (st.sel[p.id] ? ' checked' : '') + ' aria-label="انتخاب"></td>' +
        '<td><div class="cell-prod">' + VA.thumb(p) + '<div><b>' + U.esc(p.name) + '</b><small class="latin" style="font-family:var(--font)">' + U.esc(p.sku) + '</small></div></div></td>' +
        '<td>' + U.esc(VA.colName(p.collection)) + '</td>' +
        '<td class="num">' + U.num(p.price) + (p.oldPrice > p.price ? '<br><small class="muted" style="text-decoration:line-through">' + U.num(p.oldPrice) + '</small>' : '') + '</td>' +
        '<td><input class="input stock-input" type="number" min="0" value="' + p.stock + '" data-stock="' + p.id + '" aria-label="موجودی ' + U.esc(p.name) + '"> ' + stockTag(p) + '</td>' +
        '<td class="num">' + U.toFa(p.sold || 0) + '</td>' +
        '<td><label class="switch"><input type="checkbox" data-active="' + p.id + '"' + (p.active !== false ? ' checked' : '') + ' aria-label="نمایش در سایت"><i></i></label></td>' +
        '<td><div class="actions">' + VA.ibtn('edit', 'ویرایش', 'data-edit="' + p.id + '"') + VA.ibtn('copy', 'کپی', 'data-dup="' + p.id + '"') + VA.ibtn('trash', 'حذف', 'data-del="' + p.id + '"', 'danger') + '</div></td></tr>').join('')
        : '<tr><td colspan="8" class="empty">محصولی با این فیلتر پیدا نشد.</td></tr>') +
      '</tbody></table></div>' + VA.pagerHtml(list.length, st.page, PER);

    bind(root);
  }

  function bind(root) {
    const re = () => render(root);
    $('#pq', root).addEventListener('input', U.debounce((e) => { st.q = e.target.value; st.page = 1; re(); const i = $('#pq', root); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250));
    [['#pcol', 'col'], ['#pstatus', 'status'], ['#pgender', 'gender'], ['#psort', 'sort']].forEach((x) => $(x[0], root).addEventListener('change', (e) => { st[x[1]] = e.target.value; st.page = 1; re(); }));
    $('#padd', root).onclick = () => VA.editProduct(null, re);
    $('#pexport', root).onclick = exportCsv;

    root.onclick = (e) => {
      const pg = e.target.closest('[data-pg]');
      if (pg && !pg.disabled) { st.page = Number(pg.getAttribute('data-pg')); re(); window.scrollTo(0, 0); return; }
      const ed = e.target.closest('[data-edit]');
      if (ed) { VA.editProduct(ed.getAttribute('data-edit'), re); return; }
      const dup = e.target.closest('[data-dup]');
      if (dup) { duplicate(dup.getAttribute('data-dup')); re(); return; }
      const del = e.target.closest('[data-del]');
      if (del) { remove(del.getAttribute('data-del'), re); return; }
      const bulk = e.target.closest('[data-bulk]');
      if (bulk) { bulkAction(bulk.getAttribute('data-bulk'), re); }
    };

    root.onchange = (e) => {
      const t = e.target;
      if (t.id === 'pall') { filtered().slice((st.page - 1) * PER, st.page * PER).forEach((p) => { if (t.checked) st.sel[p.id] = true; else delete st.sel[p.id]; }); re(); return; }
      if (t.hasAttribute('data-sel')) { const id = t.getAttribute('data-sel'); if (t.checked) st.sel[id] = true; else delete st.sel[id]; re(); return; }
      if (t.hasAttribute('data-stock')) {
        const p = DB.products.get(t.getAttribute('data-stock')); if (!p) return;
        p.stock = Math.max(0, Math.floor(Number(t.value) || 0)); DB.products.save(p);
        VA.toast('موجودی «' + p.name + '» ذخیره شد.'); re(); VA.refreshBadges(); return;
      }
      if (t.hasAttribute('data-active')) {
        const p = DB.products.get(t.getAttribute('data-active')); if (!p) return;
        p.active = t.checked; DB.products.save(p);
        VA.toast(p.active ? '«' + p.name + '» در سایت نمایش داده می‌شود.' : '«' + p.name + '» از سایت پنهان شد.', 'info');
      }
    };
  }

  function duplicate(id) {
    const p = DB.products.get(id); if (!p) return;
    const c = JSON.parse(JSON.stringify(p));
    c.id = ''; c.name = p.name + ' Copy'; c.sku = DB.products.nextSku(); c.createdAt = Date.now(); c.sold = 0; c.reviewsCount = 0; c.active = false;
    DB.products.save(c);
    DB.log('product', 'محصول «' + p.name + '» کپی شد (پنهان)');
    VA.toast('نسخه‌ی کپی ساخته شد و فعلاً در سایت پنهان است.');
  }

  function remove(id, re) {
    const p = DB.products.get(id); if (!p) return;
    VA.confirm('محصول «' + p.name + '» برای همیشه حذف شود؟ سفارش‌های قبلی تغییری نمی‌کنند.', { danger: true, yes: 'حذف محصول' }).then((ok) => {
      if (!ok) return;
      DB.products.remove(id); delete st.sel[id];
      DB.log('product', 'محصول «' + p.name + '» حذف شد');
      VA.toast('محصول حذف شد.'); re();
    });
  }

  function bulkAction(act, re) {
    const ids = Object.keys(st.sel);
    if (act === 'clear') { st.sel = {}; re(); return; }
    if (!ids.length) return;
    const done = (msg) => { DB.log('product', msg); VA.toast(msg); st.sel = {}; re(); };
    if (act === 'show') { DB.products.bulk(ids, { active: true }); done(U.toFa(ids.length) + ' محصول در سایت نمایش داده شد.'); }
    if (act === 'hide') { DB.products.bulk(ids, { active: false }); done(U.toFa(ids.length) + ' محصول پنهان شد.'); }
    if (act === 'feature') { DB.products.bulk(ids, { featured: true }); done(U.toFa(ids.length) + ' محصول منتخب شد.'); }
    if (act === 'unfeature') { DB.products.bulk(ids, { featured: false }); done(U.toFa(ids.length) + ' محصول از منتخب‌ها خارج شد.'); }
    if (act === 'delete') {
      VA.confirm(U.toFa(ids.length) + ' محصول انتخاب‌شده حذف شود؟', { danger: true, yes: 'حذف همه' }).then((ok) => {
        if (!ok) return;
        ids.forEach((id) => DB.products.remove(id)); done(U.toFa(ids.length) + ' محصول حذف شد.');
      });
    }
    if (act === 'discount' || act === 'stock') {
      const isDisc = act === 'discount';
      const m = VA.modal({
        title: isDisc ? 'اعمال تخفیف گروهی' : 'افزایش موجودی گروهی', size: 'sm',
        html: '<div class="form">' + VA.in.num('v', isDisc ? 'درصد تخفیف (۰ یعنی حذف تخفیف)' : 'تعداد افزوده‌شده به موجودی هر محصول', isDisc ? 10 : 5, { attrs: { min: 0, max: isDisc ? 90 : 9999 } }) +
          (isDisc ? '<p class="hint">قیمت فعلی به عنوان «قیمت قبل» ثبت و قیمت جدید با تخفیف محاسبه می‌شود.</p>' : '') +
          '<div class="form-actions"><button class="btn btn-primary" data-go>اعمال</button></div></div>'
      });
      $('[data-go]', m.el).onclick = () => {
        const v = Number($('[data-k="v"]', m.el).value) || 0;
        if (isDisc) {
          DB.products.bulk(ids, (p) => {
            const base = p.oldPrice > p.price ? p.oldPrice : p.price;
            return v > 0 ? { oldPrice: base, price: Math.round(base * (100 - v) / 100 / 10000) * 10000 } : { oldPrice: 0, price: base };
          });
        } else DB.products.bulk(ids, (p) => ({ stock: (p.stock || 0) + Math.floor(v) }));
        m.close(); done(isDisc ? 'تخفیف روی ' + U.toFa(ids.length) + ' محصول اعمال شد.' : 'موجودی ' + U.toFa(ids.length) + ' محصول افزایش یافت.');
      };
    }
  }

  function exportCsv() {
    const rows = [['کد کالا', 'نام', 'کلکسیون', 'جنسیت', 'قیمت', 'قیمت قبل', 'موجودی', 'فروش', 'فعال']];
    DB.products.all().forEach((p) => rows.push([p.sku, p.name, VA.colName(p.collection), p.gender, p.price, p.oldPrice || '', p.stock, p.sold || 0, p.active !== false ? 'بله' : 'خیر']));
    U.download('violet-products.csv', U.csv(rows), 'text/csv;charset=utf-8');
  }

  VA.register('products', { title: 'محصولات', icon: 'watch', group: 'فروشگاه', render: render, badge() { return 0; } });
})(window);
