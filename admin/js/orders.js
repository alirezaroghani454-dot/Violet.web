/* ==========================================================
   Violet admin — orders.js
   Order list with filters + detail dialog: change status,
   tracking number, internal note, printable invoice, CSV
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;
  const PER = 12;
  const st = { q: '', status: '', pay: '', page: 1 };
  const PAY = { online: 'پرداخت آنلاین', card: 'کارت به کارت', cod: 'پرداخت در محل' };

  function filtered() {
    const q = U.toEn(st.q).trim().toLowerCase();
    return DB.orders.all().filter((o) => {
      if (st.status && o.status !== st.status) return false;
      if (st.pay && o.payMethod !== st.pay) return false;
      if (q && [o.code, o.customer.name, o.customer.phone, o.customer.city].join(' ').toLowerCase().indexOf(q) < 0) return false;
      return true;
    });
  }

  function render(root) {
    const list = filtered();
    const pages = Math.max(1, Math.ceil(list.length / PER));
    if (st.page > pages) st.page = pages;
    const rows = list.slice((st.page - 1) * PER, st.page * PER);
    const counts = {};
    DB.orders.all().forEach((o) => { counts[o.status] = (counts[o.status] || 0) + 1; });

    root.innerHTML =
      '<div class="toolbar"><input class="input grow" id="oq" type="search" placeholder="جستجوی کد سفارش، نام، موبایل یا شهر…" value="' + U.esc(st.q) + '">' +
      '<select class="select" id="opay"><option value="">همه‌ی روش‌های پرداخت</option>' + Object.keys(PAY).map((k) => '<option value="' + k + '"' + (st.pay === k ? ' selected' : '') + '>' + PAY[k] + '</option>').join('') + '</select>' +
      '<button class="btn" id="oexport">' + VI('download') + 'خروجی CSV</button></div>' +
      '<div class="toolbar" id="ostat"><button class="chip' + (!st.status ? ' active' : '') + '" data-s="">همه (' + U.toFa(DB.orders.all().length) + ')</button>' +
      DB.STATUS_KEYS.map((k) => '<button class="chip' + (st.status === k ? ' active' : '') + '" data-s="' + k + '">' + DB.STATUS[k].label + ' (' + U.toFa(counts[k] || 0) + ')</button>').join('') + '</div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>کد سفارش</th><th>مشتری</th><th>شهر</th><th>اقلام</th><th>مبلغ</th><th>پرداخت</th><th>وضعیت</th><th>تاریخ</th><th></th></tr></thead><tbody>' +
      (rows.length ? rows.map((o) =>
        '<tr data-open="' + o.id + '" style="cursor:pointer"><td class="num latin"><b>' + U.esc(o.code) + '</b></td><td>' + U.esc(o.customer.name) + '<br><small class="muted">' + U.esc(o.customer.phone) + '</small></td><td>' + U.esc(o.customer.city) + '</td>' +
        '<td class="num">' + U.toFa(o.items.reduce((n, i) => n + i.qty, 0)) + '</td><td class="num">' + U.num(o.total) + '</td><td>' + (PAY[o.payMethod] || '-') + '</td><td>' + VA.statusTag(o.status) + '</td><td class="num">' + U.date(o.createdAt) + '</td>' +
        '<td><div class="actions">' + VA.ibtn('eye', 'مشاهده', 'data-open="' + o.id + '"') + '</div></td></tr>').join('')
        : '<tr><td colspan="9" class="empty">سفارشی پیدا نشد. سفارش‌های ثبت‌شده در فروشگاه اینجا نمایش داده می‌شوند.</td></tr>') +
      '</tbody></table></div>' + VA.pagerHtml(list.length, st.page, PER);

    $('#oq', root).addEventListener('input', U.debounce((e) => { st.q = e.target.value; st.page = 1; render(root); const i = $('#oq', root); i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 250));
    $('#opay', root).addEventListener('change', (e) => { st.pay = e.target.value; st.page = 1; render(root); });
    $('#oexport', root).onclick = exportCsv;
    root.onclick = (e) => {
      const s = e.target.closest('#ostat [data-s]'); if (s) { st.status = s.getAttribute('data-s'); st.page = 1; render(root); return; }
      const pg = e.target.closest('[data-pg]'); if (pg && !pg.disabled) { st.page = Number(pg.getAttribute('data-pg')); render(root); return; }
      const op = e.target.closest('[data-open]'); if (op) detail(op.getAttribute('data-open'), () => render(root));
    };
  }

  function invoiceHtml(o) {
    const s = DB.settings.get();
    return '<div class="row"><div><h1>فاکتور فروش — ' + U.esc(s.brand) + '</h1><div class="muted">' + U.esc(s.address) + ' · ' + U.esc(s.phone) + '</div></div><div><b>شماره: ' + U.esc(o.code) + '</b><div class="muted">' + U.date(o.createdAt, true) + '</div></div></div>' +
      '<p><b>مشتری:</b> ' + U.esc(o.customer.name) + ' — ' + U.esc(o.customer.phone) + '<br><b>نشانی:</b> ' + U.esc(o.customer.city) + '، ' + U.esc(o.customer.address) + ' — کد پستی ' + U.esc(o.customer.postal) + '</p>' +
      '<table><thead><tr><th>ردیف</th><th>کالا</th><th>تعداد</th><th>قیمت واحد</th><th>مبلغ</th></tr></thead><tbody>' +
      o.items.map((i, n) => '<tr><td>' + U.toFa(n + 1) + '</td><td>' + U.esc(i.name) + '</td><td>' + U.toFa(i.qty) + '</td><td>' + U.num(i.price) + '</td><td>' + U.num(i.price * i.qty) + '</td></tr>').join('') +
      '<tr><td colspan="4">جمع کالاها</td><td>' + U.num(o.subtotal) + '</td></tr>' +
      (o.discount ? '<tr><td colspan="4">تخفیف' + (o.coupon ? ' (' + U.esc(o.coupon) + ')' : '') + '</td><td>− ' + U.num(o.discount) + '</td></tr>' : '') +
      (o.giftWrap ? '<tr><td colspan="4">بسته‌بندی هدیه</td><td>' + U.num(o.giftWrap) + '</td></tr>' : '') +
      '<tr><td colspan="4">هزینه‌ی ارسال</td><td>' + (o.shipping ? U.num(o.shipping) : 'رایگان') + '</td></tr>' +
      (o.tax ? '<tr><td colspan="4">مالیات</td><td>' + U.num(o.tax) + '</td></tr>' : '') +
      '<tr class="tot"><td colspan="4">مبلغ قابل پرداخت (' + U.esc(s.currency) + ')</td><td>' + U.num(o.total) + '</td></tr></tbody></table>' +
      '<p class="muted">روش پرداخت: ' + (PAY[o.payMethod] || '-') + ' · با تشکر از خرید شما از ' + U.esc(s.brand) + '</p>';
  }

  function detail(id, onDone) {
    const o = DB.orders.get(id); if (!o) return;
    const c = o.customer;
    const m = VA.modal({
      title: 'سفارش ' + o.code, subtitle: U.date(o.createdAt, true), size: 'xl',
      html: '<div class="grid c2">' +
        '<div class="stack">' +
        '<div class="card"><h3>اقلام سفارش</h3><div class="o-items">' + o.items.map((i) =>
          '<div class="o-item"><span class="thumb">' + (i.spec ? global.VioletWatch.svg(i.spec, { viewBox: '60 150 280 330' }) : '') + '</span><div><b>' + U.esc(i.name) + '</b><div class="muted" style="font-size:.84rem">' + U.toFa(i.qty) + ' × ' + U.num(i.price) + '</div></div><b class="num" style="font-family:var(--font)">' + U.num(i.price * i.qty) + '</b></div>').join('') + '</div>' +
        '<div class="kv" style="margin-top:16px"><div><span>جمع کالاها</span><b>' + U.num(o.subtotal) + '</b></div>' +
        (o.discount ? '<div><span>تخفیف ' + (o.coupon ? '(' + U.esc(o.coupon) + ')' : '') + '</span><b style="color:var(--ok)">− ' + U.num(o.discount) + '</b></div>' : '') +
        (o.giftWrap ? '<div><span>بسته‌بندی هدیه</span><b>' + U.num(o.giftWrap) + '</b></div>' : '') +
        '<div><span>ارسال</span><b>' + (o.shipping ? U.num(o.shipping) : 'رایگان') + '</b></div>' + (o.tax ? '<div><span>مالیات</span><b>' + U.num(o.tax) + '</b></div>' : '') +
        '<div><span><b>مبلغ کل</b></span><b style="font-size:1.15rem">' + VA.price(o.total) + '</b></div></div></div>' +
        '<div class="card"><h3>اطلاعات مشتری</h3><div class="kv"><div><span>نام</span><b>' + U.esc(c.name) + '</b></div><div><span>موبایل</span><b dir="ltr">' + U.esc(c.phone) + '</b></div>' +
        (c.email ? '<div><span>ایمیل</span><b dir="ltr">' + U.esc(c.email) + '</b></div>' : '') + '<div><span>شهر</span><b>' + U.esc(c.city) + '</b></div><div><span>کد پستی</span><b dir="ltr">' + U.esc(c.postal) + '</b></div>' +
        '<div><span>نشانی</span><b style="max-width:70%">' + U.esc(c.address) + '</b></div>' + (c.notes ? '<div><span>توضیح مشتری</span><b style="max-width:70%">' + U.esc(c.notes) + '</b></div>' : '') +
        '<div><span>روش پرداخت</span><b>' + (PAY[o.payMethod] || '-') + '</b></div></div>' +
        '<div class="toolbar" style="margin-top:14px"><a class="btn btn-sm" href="tel:' + U.esc(c.phone) + '">' + VI('phone') + 'تماس</a><a class="btn btn-sm" target="_blank" rel="noopener" href="https://wa.me/98' + U.esc(String(c.phone).replace(/^0/, '')) + '?text=' + encodeURIComponent('سلام ' + c.name + '، سفارش شما با کد ' + o.code + ' در ' + DB.settings.get().brand + ' ثبت شده است.') + '">' + VI('whatsapp') + 'واتساپ</a></div></div></div>' +

        '<div class="stack"><div class="card"><h3>وضعیت و پیگیری</h3><form class="form" id="oForm">' +
        '<div class="field"><label>وضعیت سفارش</label><select class="select" data-k="status">' + DB.STATUS_KEYS.map((k) => '<option value="' + k + '"' + (o.status === k ? ' selected' : '') + '>' + DB.STATUS[k].label + '</option>').join('') + '</select></div>' +
        VA.in.text('note', 'توضیح تغییر وضعیت (اختیاری، در تاریخچه ثبت می‌شود)', '') +
        VA.in.text('trackingNumber', 'کد رهگیری پست', o.trackingNumber || '', { ltr: true }) +
        VA.in.area('adminNote', 'یادداشت داخلی (برای مشتری نمایش داده نمی‌شود)', o.adminNote || '', { h: 70 }) +
        '<div class="form-actions" style="position:static;padding:0;background:none"><button class="btn btn-primary" type="submit">' + VI('save') + 'ذخیره</button><button class="btn" type="button" id="oPrint">' + VI('download') + 'چاپ فاکتور</button><button class="btn btn-danger btn-sm" type="button" id="oDel">حذف سفارش</button></div></form></div>' +
        '<div class="card"><h3>تاریخچه</h3><div class="timeline">' + (o.history || []).slice().reverse().map((h, i) =>
          '<div class="tl ' + (i === 0 ? 'current' : 'done') + '"><b>' + DB.orders.statusInfo(h.status).label + '</b><small>' + U.date(h.at, true) + (h.note ? ' — ' + U.esc(h.note) : '') + '</small></div>').join('') + '</div></div></div></div>'
    });

    $('#oPrint', m.el).onclick = () => VA.printHtml('فاکتور ' + o.code, invoiceHtml(DB.orders.get(id)));
    $('#oDel', m.el).onclick = () => VA.confirm('سفارش ' + o.code + ' برای همیشه حذف شود؟ موجودی انبار تغییر نمی‌کند.', { danger: true, yes: 'حذف سفارش' }).then((ok) => {
      if (!ok) return; DB.orders.remove(id); DB.log('order', 'سفارش ' + o.code + ' حذف شد'); m.close(); VA.toast('سفارش حذف شد.'); onDone();
    });
    $('#oForm', m.el).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = VA.collect(e.target);
      const cur = DB.orders.get(id);
      cur.trackingNumber = String(v.trackingNumber || '').trim(); cur.adminNote = v.adminNote;
      DB.orders.save(cur);
      if (v.status !== cur.status) DB.orders.setStatus(id, v.status, v.note);
      VA.toast('سفارش به‌روزرسانی شد.'); m.close(); onDone(); VA.refreshBadges();
    });
  }

  function exportCsv() {
    const rows = [['کد سفارش', 'تاریخ', 'مشتری', 'موبایل', 'شهر', 'مبلغ', 'پرداخت', 'وضعیت', 'اقلام']];
    DB.orders.all().forEach((o) => rows.push([o.code, U.date(o.createdAt, true), o.customer.name, o.customer.phone, o.customer.city, o.total, PAY[o.payMethod] || '', DB.orders.statusInfo(o.status).label, o.items.map((i) => i.name + ' ×' + i.qty).join(' | ')]));
    U.download('violet-orders.csv', U.csv(rows), 'text/csv;charset=utf-8');
  }

  VA.register('orders', {
    title: 'سفارش‌ها', icon: 'orders', group: 'فروشگاه', render: render, live: true,
    badge() { return DB.orders.all().filter((o) => o.status === 'pending' || o.status === 'paid').length; }
  });
})(window);
