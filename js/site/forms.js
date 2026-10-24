/* ==========================================================
   Violet — site/forms.js
   Newsletter, contact form and the full-screen search overlay
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI, C = global.VCards;
  const $ = U.$;

  const Forms = {

    /* ---------- newsletter ---------- */
    newsletter() {
      const form = $('#newsForm');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const v = $('#newsEmail').value.trim();
        if (!U.isEmail(v)) { global.VUI.toast('ایمیل معتبر وارد کنید.', 'error'); return; }
        if (DB.subscribers.all().find((x) => x.value === v)) { global.VUI.toast('این ایمیل قبلاً عضو شده است.', 'info'); return; }
        DB.subscribers.save({ id: U.uid('sb'), value: v, createdAt: Date.now() });
        DB.log('subscriber', 'عضو جدید خبرنامه: ' + v);
        form.reset();
        global.VUI.toast('عضویت شما ثبت شد. کد VIOLET10 را برای اولین خرید استفاده کنید.');
      });
    },

    /* ---------- contact ---------- */
    contact() {
      const form = $('#contactForm');
      if (!form) return;
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = $('#cfName').value.trim(), phone = U.toEn($('#cfPhone').value.trim()), text = $('#cfText').value.trim();
        if (name.length < 3) { global.VUI.toast('نام خود را وارد کنید.', 'error'); $('#cfName').focus(); return; }
        if (!U.isPhone(phone)) { global.VUI.toast('شماره‌ی موبایل معتبر نیست.', 'error'); $('#cfPhone').focus(); return; }
        if (text.length < 8) { global.VUI.toast('پیام را کمی کامل‌تر بنویسید.', 'error'); $('#cfText').focus(); return; }
        DB.messages.save({ id: U.uid('m'), name: name, phone: phone, email: '', subject: $('#cfSubject').value || 'بدون موضوع', text: text, read: false, createdAt: Date.now() });
        DB.log('message', 'پیام جدید از ' + name);
        form.reset();
        global.VUI.toast('پیام شما ارسال شد. به‌زودی با شما تماس می‌گیریم.');
      });
    },

    /* ---------- search overlay ---------- */
    search() {
      const input = $('#searchInput'), box = $('#searchResults'), tags = $('#quickTags');
      if (!input) return;
      $('#searchBtn').innerHTML = VI('search');
      $('#searchOvIco').innerHTML = VI('search');
      $('#searchBtn').addEventListener('click', () => { global.VUI.open('search'); setTimeout(() => input.focus(), 150); render(''); });

      const quick = ['کرونوگراف', 'رزگلد', 'اتوماتیک', 'سرامیک', 'هوشمند', 'چرم', 'بانوان', 'خورشیدی'];
      tags.innerHTML = quick.map((t) => '<button class="chip" data-q="' + U.esc(t) + '">' + U.esc(t) + '</button>').join('');
      tags.addEventListener('click', (e) => { const b = e.target.closest('[data-q]'); if (b) { input.value = b.getAttribute('data-q'); render(input.value); input.focus(); } });

      function matches(q) {
        q = U.toEn(q).trim().toLowerCase();
        if (!q) return DB.products.active().filter((p) => p.featured).slice(0, 6);
        const words = q.split(/\s+/);
        return DB.products.active().filter((p) => {
          const hay = [p.name, p.sku, C.collectionName(p.collection), C.collectionNameEn(p.collection), (p.tags || []).join(' '), (p.details || {}).strap, (p.details || {}).movement, C.GENDER[p.gender]].join(' ').toLowerCase();
          return words.every((w) => hay.indexOf(w) >= 0);
        }).slice(0, 8);
      }

      function render(q) {
        const list = matches(q);
        if (!list.length) { box.innerHTML = '<div class="sr-hint">ساعتی با این نام پیدا نشد. عبارت دیگری را امتحان کنید.</div>'; return; }
        box.innerHTML = (q ? '' : '<div class="sr-hint" style="padding:12px 18px;text-align:start">پیشنهادهای ویولت</div>') + list.map((p) =>
          '<div class="sr-item" data-id="' + p.id + '" tabindex="0" role="button"><span class="t">' + C.svgHtml(p, '36 120 328 400') + '</span>' +
          '<span><b>' + U.esc(p.name) + '</b><small>' + U.esc(C.collectionName(p.collection)) + '</small></span>' +
          '<span class="sr-price">' + U.num(p.price) + ' ' + U.esc(C.cur()) + '</span></div>').join('') +
          (q ? '<div class="sr-item" data-all="1" tabindex="0" role="button" style="justify-content:center"><b style="font-family:inherit;font-size:1rem">نمایش همه‌ی نتایج در فروشگاه</b></div>' : '');
      }

      input.addEventListener('input', U.debounce(() => render(input.value), 120));
      input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); go(input.value); } });
      function go(q) { global.VUI.close('search'); global.VShop.setSearch(q); }
      function pick(e) {
        const it = e.target.closest('.sr-item'); if (!it) return;
        if (it.getAttribute('data-all')) { go(input.value); return; }
        global.VUI.close('search');
        global.VProduct.open(it.getAttribute('data-id'));
      }
      box.addEventListener('click', pick);
      box.addEventListener('keydown', (e) => { if (e.key === 'Enter') pick(e); });
    },

    init() { Forms.newsletter(); Forms.contact(); Forms.search(); }
  };

  global.VForms = Forms;
})(window);
