/* ==========================================================
   Violet admin — catalog.js
   Collections (add / edit / reorder / hide) and discount codes
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;

  /* ====================== collections ====================== */
  function editCollection(id, onDone) {
    const isNew = !id;
    const c = isNew ? { id: '', name: '', nameEn: '', tagline: '', desc: '', c1: '#7c3aed', c2: '#22d3ee', visible: true, order: DB.collections.all().length + 1 } : Object.assign({}, DB.collections.get(id));
    const m = VA.modal({
      title: isNew ? 'کلکسیون جدید' : 'ویرایش کلکسیون ' + c.name, size: 'md',
      html: '<form class="form" id="cForm" novalidate>' +
        '<div class="row cols-2">' + VA.in.text('name', 'نام فارسی', c.name) + VA.in.text('nameEn', 'نام لاتین', c.nameEn, { ltr: true, ph: 'Eclipse' }) + '</div>' +
        VA.in.text('tagline', 'شعار کوتاه', c.tagline, { ph: 'کرونوگراف‌های اسپرت' }) +
        VA.in.area('desc', 'توضیح کلکسیون', c.desc, { h: 80 }) +
        '<div class="row cols-2">' + VA.in.color('c1', 'رنگ اول کارت', c.c1) + VA.in.color('c2', 'رنگ دوم کارت', c.c2) + '</div>' +
        VA.in.switch('visible', 'نمایش در سایت', c.visible !== false) +
        '<div class="form-actions" style="position:static;padding:0;background:none"><button class="btn btn-primary btn-lg" type="submit">' + VI('save') + 'ذخیره</button><button class="btn btn-lg" type="button" data-x>انصراف</button></div></form>'
    });
    VA.bindColors($('#cForm', m.el));
    $('#cForm', m.el).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = VA.collect(e.target);
      if (v.name.trim().length < 2) { VA.toast('نام کلکسیون را وارد کنید.', 'error'); return; }
      const out = Object.assign(c, v, { name: v.name.trim(), nameEn: (v.nameEn || v.name).trim() });
      out.slug = U.slugify(out.nameEn);
      DB.collections.save(out);
      DB.log('collection', 'کلکسیون «' + out.name + (isNew ? '» اضافه شد' : '» ویرایش شد'));
      VA.toast('کلکسیون ذخیره شد.'); m.close(); onDone();
    });
  }

  function renderCollections(root) {
    const cols = DB.collections.sorted();
    const prods = DB.products.all();
    root.innerHTML =
      '<div class="toolbar"><span class="muted">کلکسیون‌ها به همین ترتیب در صفحه‌ی اصلی و فیلترهای فروشگاه نمایش داده می‌شوند.</span><span class="spacer"></span><button class="btn btn-primary" id="cAdd">' + VI('plus') + 'کلکسیون جدید</button></div>' +
      (cols.length ? '<div class="col-admin">' + cols.map((c, i) => {
        const n = prods.filter((p) => p.collection === c.id).length;
        return '<article class="col-a' + (c.visible === false ? ' off' : '') + '" style="--c1:' + U.esc(c.c1) + ';--c2:' + U.esc(c.c2) + '"><div class="en">' + U.esc(c.nameEn) + '</div><div class="fa">' + U.esc(c.name) + '</div><p>' + U.esc(c.tagline || '') + '</p>' +
          '<div class="meta"><span>' + U.toFa(n) + ' محصول' + (c.visible === false ? ' · پنهان' : '') + '</span><div class="tools">' +
          VA.ibtn('chevD', 'بالا', 'data-up="' + c.id + '"' + (i === 0 ? ' disabled' : '') + ' style="transform:rotate(180deg)"') + VA.ibtn('chevD', 'پایین', 'data-down="' + c.id + '"' + (i === cols.length - 1 ? ' disabled' : '')) +
          VA.ibtn('edit', 'ویرایش', 'data-edit="' + c.id + '"') + VA.ibtn('trash', 'حذف', 'data-del="' + c.id + '"', 'danger') + '</div></div></article>';
      }).join('') + '</div>' : VA.empty('هنوز کلکسیونی ندارید.', 'layers'));

    const re = () => renderCollections(root);
    $('#cAdd', root).onclick = () => editCollection(null, re);
    root.onclick = (e) => {
      const ed = e.target.closest('[data-edit]'); if (ed) { editCollection(ed.getAttribute('data-edit'), re); return; }
      const del = e.target.closest('[data-del]');
      if (del) {
        const c = DB.collections.get(del.getAttribute('data-del'));
        const n = prods.filter((p) => p.collection === c.id).length;
        if (n) { VA.toast('این کلکسیون ' + U.toFa(n) + ' محصول دارد. ابتدا محصولاتش را به کلکسیون دیگری ببرید یا آن‌ها را حذف کنید.', 'error', 5000); return; }
        VA.confirm('کلکسیون «' + c.name + '» حذف شود؟', { danger: true, yes: 'حذف' }).then((ok) => { if (!ok) return; DB.collections.remove(c.id); DB.log('collection', 'کلکسیون «' + c.name + '» حذف شد'); VA.toast('حذف شد.'); re(); });
        return;
      }
      const mv = e.target.closest('[data-up],[data-down]');
      if (mv && !mv.disabled) {
        const id = mv.getAttribute('data-up') || mv.getAttribute('data-down');
        const arr = DB.collections.sorted(); const i = arr.findIndex((x) => x.id === id); const j = mv.hasAttribute('data-up') ? i - 1 : i + 1;
        if (j < 0 || j >= arr.length) return;
        const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
        arr.forEach((x, k) => { x.order = k + 1; });
        DB.collections.replace(arr); re();
      }
    };
  }

  VA.register('collections', { title: 'کلکسیون‌ها', icon: 'layers', group: 'فروشگاه', render: renderCollections });

  /* ======================== coupons ======================== */
  function dateInput(ts) { if (!ts) return ''; const d = new Date(ts); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }

  function editCoupon(id, onDone) {
    const isNew = !id;
    const c = isNew ? { id: '', code: '', type: 'percent', value: 10, minOrder: 0, maxDiscount: 0, usageLimit: 0, used: 0, expires: 0, active: true, note: '' } : Object.assign({}, DB.coupons.get(id));
    const m = VA.modal({
      title: isNew ? 'کد تخفیف جدید' : 'ویرایش کد ' + c.code, size: 'md',
      html: '<form class="form" id="cpForm" novalidate>' +
        '<div class="row cols-2">' + VA.in.text('code', 'کد تخفیف', c.code, { ltr: true, ph: 'SUMMER20', attrs: { style: 'direction:ltr;text-align:left;text-transform:uppercase' } }) + VA.in.select('type', 'نوع تخفیف', c.type, [['percent', 'درصدی'], ['fixed', 'مبلغ ثابت']]) + '</div>' +
        '<div class="row cols-2">' + VA.in.num('value', 'مقدار (درصد یا مبلغ به ' + VA.cur() + ')', c.value) + VA.in.num('maxDiscount', 'سقف تخفیف (۰ = بدون سقف)', c.maxDiscount || 0) + '</div>' +
        '<div class="row cols-2">' + VA.in.num('minOrder', 'حداقل مبلغ خرید (۰ = بدون حداقل)', c.minOrder || 0) + VA.in.num('usageLimit', 'تعداد دفعات مجاز (۰ = نامحدود)', c.usageLimit || 0, { hint: 'تا الان ' + U.toFa(c.used || 0) + ' بار استفاده شده' }) + '</div>' +
        '<div class="row cols-2"><div class="field"><label>تاریخ انقضا (اختیاری)</label><input class="input" type="date" id="cpExp" value="' + dateInput(c.expires) + '" style="direction:ltr"></div>' + VA.in.text('note', 'توضیح داخلی', c.note) + '</div>' +
        VA.in.switch('active', 'فعال', c.active) +
        '<div class="form-actions" style="position:static;padding:0;background:none"><button class="btn btn-primary btn-lg" type="submit">' + VI('save') + 'ذخیره</button><button class="btn btn-lg" type="button" data-x>انصراف</button></div></form>'
    });
    $('#cpForm', m.el).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = VA.collect(e.target);
      const code = String(v.code).trim().toUpperCase().replace(/\s+/g, '');
      if (code.length < 3) { VA.toast('کد باید حداقل ۳ کاراکتر باشد.', 'error'); return; }
      if (DB.coupons.all().some((x) => x.code === code && x.id !== c.id)) { VA.toast('این کد قبلاً ثبت شده است.', 'error'); return; }
      if (!(v.value > 0)) { VA.toast('مقدار تخفیف را وارد کنید.', 'error'); return; }
      if (v.type === 'percent' && v.value > 100) { VA.toast('درصد تخفیف نمی‌تواند بیشتر از ۱۰۰ باشد.', 'error'); return; }
      const ex = $('#cpExp', m.el).value;
      DB.coupons.save(Object.assign(c, v, { code: code, expires: ex ? new Date(ex + 'T23:59:59').getTime() : 0 }));
      DB.log('coupon', 'کد تخفیف ' + code + (isNew ? ' ساخته شد' : ' ویرایش شد'));
      VA.toast('کد تخفیف ذخیره شد.'); m.close(); onDone();
    });
  }

  function renderCoupons(root) {
    const list = DB.coupons.all();
    root.innerHTML =
      '<div class="toolbar"><span class="muted">مشتریان کد را در سبد خرید وارد می‌کنند.</span><span class="spacer"></span><button class="btn btn-primary" id="cpAdd">' + VI('plus') + 'کد تخفیف جدید</button></div>' +
      '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>کد</th><th>تخفیف</th><th>حداقل خرید</th><th>استفاده</th><th>انقضا</th><th>فعال</th><th></th></tr></thead><tbody>' +
      (list.length ? list.map((c) => {
        const expired = c.expires && c.expires < Date.now();
        return '<tr><td><b class="latin" style="font-family:var(--font);letter-spacing:.06em">' + U.esc(c.code) + '</b>' + (c.note ? '<br><small class="muted">' + U.esc(c.note) + '</small>' : '') + '</td>' +
          '<td class="num">' + (c.type === 'percent' ? U.toFa(c.value) + '٪' + (c.maxDiscount ? '<br><small class="muted">تا ' + U.num(c.maxDiscount) + '</small>' : '') : U.num(c.value) + ' ' + VA.cur()) + '</td>' +
          '<td class="num">' + (c.minOrder ? U.num(c.minOrder) : '—') + '</td><td class="num">' + U.toFa(c.used || 0) + (c.usageLimit ? ' از ' + U.toFa(c.usageLimit) : '') + '</td>' +
          '<td class="num">' + (c.expires ? U.date(c.expires) + (expired ? ' ' + VA.tag('منقضی', 'var(--danger)') : '') : '—') + '</td>' +
          '<td><label class="switch"><input type="checkbox" data-act="' + c.id + '"' + (c.active ? ' checked' : '') + ' aria-label="فعال"><i></i></label></td>' +
          '<td><div class="actions">' + VA.ibtn('edit', 'ویرایش', 'data-edit="' + c.id + '"') + VA.ibtn('trash', 'حذف', 'data-del="' + c.id + '"', 'danger') + '</div></td></tr>';
      }).join('') : '<tr><td colspan="7" class="empty">هنوز کد تخفیفی نساخته‌اید.</td></tr>') + '</tbody></table></div>';

    const re = () => renderCoupons(root);
    $('#cpAdd', root).onclick = () => editCoupon(null, re);
    root.onclick = (e) => {
      const ed = e.target.closest('[data-edit]'); if (ed) { editCoupon(ed.getAttribute('data-edit'), re); return; }
      const del = e.target.closest('[data-del]');
      if (del) { const c = DB.coupons.get(del.getAttribute('data-del')); VA.confirm('کد ' + c.code + ' حذف شود؟', { danger: true, yes: 'حذف' }).then((ok) => { if (ok) { DB.coupons.remove(c.id); VA.toast('حذف شد.'); re(); } }); }
    };
    root.onchange = (e) => {
      const t = e.target; if (!t.hasAttribute('data-act')) return;
      const c = DB.coupons.get(t.getAttribute('data-act')); c.active = t.checked; DB.coupons.save(c);
      VA.toast(c.active ? 'کد فعال شد.' : 'کد غیرفعال شد.', 'info');
    };
  }

  VA.register('coupons', { title: 'کدهای تخفیف', icon: 'percent', group: 'فروشگاه', render: renderCoupons });
})(window);
