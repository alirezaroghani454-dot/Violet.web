/* ==========================================================
   Violet — site/checkout.js
   3-step checkout (details → payment → confirmation) and the
   order tracking window.

   NOTE: the "online payment" step is a demo gateway screen.
   To connect a real gateway (Zarinpal, IDPay, ...) replace
   Checkout.payOnline() with a request to your server.
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI, C = global.VCards;
  const $ = U.$;

  let step = 1;
  let form = {};
  let pay = 'online';
  let busy = false;

  const FLOW = ['pending', 'paid', 'processing', 'shipped', 'delivered'];

  const Checkout = {

    open() {
      const t = global.VCart.totals();
      if (!t.items.length) { global.VUI.toast('سبد خرید شما خالی است.', 'info'); return; }
      step = 1; busy = false;
      form = Object.assign({ name: '', phone: '', email: '', city: '', address: '', postal: '', notes: '' }, DB.visitor.profile());
      const s = DB.settings.get();
      pay = s.payOnline ? 'online' : (s.payCard ? 'card' : 'cod');
      Checkout.render();
      global.VUI.open('checkout');
    },

    stepsBar() {
      const names = ['اطلاعات ارسال', 'روش پرداخت', 'تایید سفارش'];
      return '<div class="steps">' + names.map((n, i) => {
        const k = i + 1;
        return '<div class="step ' + (k === step ? 'active' : k < step ? 'done' : '') + '"><i>' + (k < step ? '✓' : U.toFa(k)) + '</i><span>' + n + '</span></div>';
      }).join('') + '</div>';
    },

    summary() {
      const t = global.VCart.totals(), cur = C.cur();
      return '<aside class="order-sum"><h4>خلاصه‌ی سفارش</h4>' +
        t.items.map((i) => '<div class="mini"><div class="t">' + C.watchHtml(i.p, '60 120 280 400') + '</div><div><b class="latin" style="font-size:1.1rem">' + U.esc(i.p.name) + '</b><div class="muted">' + U.toFa(i.qty) + ' عدد</div></div><span>' + U.num(i.price * i.qty) + '</span></div>').join('') +
        '<div class="sum-row"><span>جمع کالاها</span><span>' + U.num(t.subtotal) + '</span></div>' +
        (t.discount ? '<div class="sum-row"><span>تخفیف</span><span class="disc">− ' + U.num(t.discount) + '</span></div>' : '') +
        (t.gift ? '<div class="sum-row"><span>بسته‌بندی هدیه</span><span>' + U.num(t.gift) + '</span></div>' : '') +
        '<div class="sum-row"><span>ارسال</span><span>' + (t.shipping ? U.num(t.shipping) : 'رایگان') + '</span></div>' +
        (t.tax ? '<div class="sum-row"><span>مالیات</span><span>' + U.num(t.tax) + '</span></div>' : '') +
        '<div class="sum-row total"><span>قابل پرداخت</span><span>' + U.num(t.total) + ' ' + U.esc(cur) + '</span></div></aside>';
    },

    render() {
      const box = $('#checkoutContent');
      if (step === 1) {
        box.innerHTML = '<div class="modal-title"><h2>تکمیل خرید</h2></div>' + Checkout.stepsBar() +
          '<div class="checkout-grid"><form class="panel" id="coForm" novalidate>' +
          '<div class="row cols-2"><div class="field"><label for="coName">نام و نام خانوادگی *</label><input class="input" id="coName" autocomplete="name" value="' + U.esc(form.name) + '"><span class="field-error"></span></div>' +
          '<div class="field"><label for="coPhone">شماره‌ی موبایل *</label><input class="input" id="coPhone" inputmode="tel" autocomplete="tel" placeholder="09123456789" value="' + U.esc(form.phone) + '"><span class="field-error"></span></div></div>' +
          '<div class="row cols-2"><div class="field"><label for="coCity">شهر *</label><input class="input" id="coCity" autocomplete="address-level2" value="' + U.esc(form.city) + '"><span class="field-error"></span></div>' +
          '<div class="field"><label for="coPostal">کد پستی *</label><input class="input" id="coPostal" inputmode="numeric" autocomplete="postal-code" value="' + U.esc(form.postal) + '"><span class="field-error"></span></div></div>' +
          '<div class="field"><label for="coAddress">نشانی کامل *</label><textarea class="textarea" id="coAddress" style="min-height:90px" autocomplete="street-address">' + U.esc(form.address) + '</textarea><span class="field-error"></span></div>' +
          '<div class="field"><label for="coEmail">ایمیل (اختیاری)</label><input class="input" id="coEmail" type="email" autocomplete="email" value="' + U.esc(form.email) + '"></div>' +
          '<div class="field"><label for="coNotes">توضیحات سفارش (اختیاری)</label><input class="input" id="coNotes" value="' + U.esc(form.notes) + '"></div>' +
          '<div class="checkout-nav"><button type="button" class="btn" data-close="checkout">بازگشت</button><button class="btn btn-primary btn-lg" type="submit">ادامه به پرداخت' + VI('arrowL') + '</button></div></form>' +
          Checkout.summary() + '</div>';
        $('#coForm').addEventListener('submit', Checkout.submitInfo);
        return;
      }

      if (step === 2) {
        const s = DB.settings.get();
        const opts = [];
        if (s.payOnline) opts.push(['online', 'پرداخت آنلاین', 'پرداخت امن با کارت‌های عضو شتاب']);
        if (s.payCard) opts.push(['card', 'کارت به کارت', 'واریز به کارت فروشگاه و ثبت رسید']);
        if (s.payCod) opts.push(['cod', 'پرداخت در محل', 'پرداخت هنگام تحویل (شهرهای منتخب)']);
        if (!opts.length) opts.push(['cod', 'پرداخت در محل', 'هماهنگی پرداخت با پشتیبانی']);
        if (!opts.some((o) => o[0] === pay)) pay = opts[0][0];

        box.innerHTML = '<div class="modal-title"><h2>روش پرداخت</h2></div>' + Checkout.stepsBar() +
          '<div class="checkout-grid"><div class="panel" id="payPanel">' +
          opts.map((o) => '<label class="pay-opt"><input type="radio" name="pay" value="' + o[0] + '"' + (pay === o[0] ? ' checked' : '') + ' class="check" style="width:20px;height:20px"><div><b>' + o[1] + '</b><small>' + o[2] + '</small></div></label>').join('') +
          '<div id="payExtra"></div>' +
          '<div class="checkout-nav"><button class="btn" id="coBack">' + 'مرحله‌ی قبل</button><button class="btn btn-primary btn-lg" id="coPay">' + VI('lock') + ' <span id="coPayText"></span></button></div></div>' +
          Checkout.summary() + '</div>';
        Checkout.payExtra();
        $('#payPanel').addEventListener('change', (e) => { if (e.target.name === 'pay') { pay = e.target.value; Checkout.payExtra(); } });
        $('#coBack').onclick = () => { step = 1; Checkout.render(); };
        $('#coPay').onclick = Checkout.submitPay;
      }
    },

    payExtra() {
      const s = DB.settings.get();
      const extra = $('#payExtra');
      const t = global.VCart.totals();
      if (pay === 'card') {
        extra.innerHTML = '<div class="card-info">مبلغ <b>' + U.num(t.total) + ' ' + U.esc(s.currency) + '</b> را به کارت زیر واریز کنید و کد پیگیری سفارش را همراه رسید در واتساپ برای ما بفرستید:<br><b class="latin" style="font-size:1.25rem;direction:ltr;display:inline-block;letter-spacing:.08em">' + U.esc(s.cardNumber) + '</b><br>به نام: ' + U.esc(s.cardOwner) + '</div>';
        $('#coPayText').textContent = 'ثبت سفارش';
      } else if (pay === 'cod') {
        extra.innerHTML = '<div class="card-info">سفارش شما ثبت و آماده‌ی ارسال می‌شود. مبلغ را هنگام تحویل به پیک پرداخت کنید.</div>';
        $('#coPayText').textContent = 'ثبت سفارش';
      } else {
        extra.innerHTML = '';
        $('#coPayText').textContent = 'پرداخت ' + U.num(t.total) + ' ' + s.currency;
      }
    },

    submitInfo(e) {
      e.preventDefault();
      const g = (id) => $('#' + id).value.trim();
      const data = { name: g('coName'), phone: U.toEn(g('coPhone')), city: g('coCity'), postal: U.toEn(g('coPostal')), address: g('coAddress'), email: g('coEmail'), notes: g('coNotes') };
      const bad = {};
      if (data.name.length < 3) bad.coName = 'نام را کامل وارد کنید.';
      if (!U.isPhone(data.phone)) bad.coPhone = 'شماره‌ی موبایل معتبر نیست (مثل 09123456789).';
      if (data.city.length < 2) bad.coCity = 'شهر را وارد کنید.';
      if (!U.isPostal(data.postal)) bad.coPostal = 'کد پستی باید ۱۰ رقم باشد.';
      if (data.address.length < 10) bad.coAddress = 'نشانی را کامل‌تر بنویسید.';
      if (data.email && !U.isEmail(data.email)) bad.coEmail = 'ایمیل معتبر نیست.';

      ['coName', 'coPhone', 'coCity', 'coPostal', 'coAddress', 'coEmail'].forEach((id) => {
        const el = $('#' + id); if (!el) return;
        el.classList.toggle('invalid', !!bad[id]);
        const fe = el.parentElement.querySelector('.field-error'); if (fe) fe.textContent = bad[id] || '';
      });
      const first = Object.keys(bad)[0];
      if (first) { $('#' + first).focus(); return; }

      form = data;
      DB.visitor.saveProfile(data);
      step = 2; Checkout.render();
      $('#checkoutContent').parentElement.scrollTop = 0;
    },

    submitPay() {
      if (busy) return;
      if (pay === 'online') { Checkout.gateway(); return; }
      Checkout.finish(pay === 'cod' ? 'processing' : 'pending');
    },

    /* demo gateway screen */
    gateway() {
      const t = global.VCart.totals(), s = DB.settings.get();
      $('#checkoutContent').innerHTML = '<div class="success"><div class="tick" style="background:var(--surface-2);box-shadow:none">' + VI('lock') + '</div>' +
        '<h2>درگاه پرداخت (نسخه‌ی نمایشی)</h2><p class="muted">مبلغ قابل پرداخت</p><div class="code-box" style="font-size:1.6rem">' + U.num(t.total) + ' ' + U.esc(s.currency) + '</div>' +
        '<p class="muted" style="max-width:44ch">این صفحه برای نمایش است. در نسخه‌ی نهایی به درگاه بانکی متصل می‌شود.</p>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><button class="btn btn-primary btn-lg" id="gwOk">پرداخت موفق</button><button class="btn btn-lg" id="gwNo">انصراف</button></div></div>';
      $('#gwOk').onclick = () => Checkout.finish('paid');
      $('#gwNo').onclick = () => { global.VUI.toast('پرداخت انجام نشد. دوباره تلاش کنید.', 'error'); step = 2; Checkout.render(); };
    },

    finish(status) {
      if (busy) return; busy = true;
      const t = global.VCart.totals();
      if (!t.items.length) { busy = false; return; }

      // last stock check
      for (const i of t.items) {
        if (i.qty > i.p.stock) { busy = false; global.VUI.toast(i.p.name + ' به اندازه‌ی کافی موجود نیست.', 'error'); step = 1; global.VCart.setQty(i.p.id, i.p.stock); Checkout.render(); return; }
      }

      const order = DB.orders.create({
        customer: { name: form.name, phone: form.phone, email: form.email, city: form.city, address: form.address, postal: form.postal, notes: form.notes },
        items: t.items.map((i) => ({ productId: i.p.id, name: i.p.name, price: i.price, qty: i.qty, spec: i.p.spec })),
        subtotal: t.subtotal, discount: t.discount, giftWrap: t.gift, shipping: t.shipping, tax: t.tax, total: t.total,
        coupon: t.coupon ? t.coupon.code : '', payMethod: pay, status: status
      });
      if (status === 'paid' && order.status !== 'paid') DB.orders.setStatus(order.id, 'paid', 'پرداخت آنلاین موفق');
      DB.visitor.addMyOrder(order.code);
      global.VCart.clear();
      busy = false;
      step = 3;
      Checkout.success(order);
    },

    success(order) {
      const s = DB.settings.get();
      $('#checkoutContent').innerHTML = '<div class="modal-title"><h2 style="visibility:hidden">.</h2></div>' + Checkout.stepsBar().replace(/active/g, 'done') +
        '<div class="success"><div class="tick"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.500 4.500 4.500L19 7.500"/></svg></div>' +
        '<h2>سفارش شما ثبت شد</h2><p>ممنون از اعتماد شما، ' + U.esc(order.customer.name) + '. کد پیگیری سفارش:</p>' +
        '<div class="code-box">' + U.esc(order.code) + '</div>' +
        '<p class="muted" style="max-width:48ch">این کد را نگه دارید؛ با کد و شماره‌ی موبایل می‌توانید وضعیت سفارش را از بخش «پیگیری سفارش» ببینید.' +
        (order.payMethod === 'card' ? '<br>لطفاً رسید واریز را در واتساپ برای ما ارسال کنید.' : '') + '</p>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap;justify-content:center"><button class="btn btn-primary" id="coTrack">پیگیری سفارش</button>' +
        '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/' + String(s.whatsapp).replace(/\D/g, '') + '?text=' + encodeURIComponent('سلام، سفارش من با کد ' + order.code + ' ثبت شد.') + '">' + VI('whatsapp') + 'ارتباط در واتساپ</a>' +
        '<button class="btn btn-ghost" data-close="checkout">ادامه‌ی خرید</button></div></div>';
      $('#coTrack').onclick = () => { global.VUI.close('checkout'); Checkout.openTrack(order.code, order.customer.phone); };
      global.VUI.toast('سفارش ' + order.code + ' با موفقیت ثبت شد.');
    },

    /* ---------- tracking ---------- */
    openTrack(code, phone) {
      Checkout.renderTrack(code, phone);
      global.VUI.open('track');
      if (code) Checkout.lookup(code, phone);
    },

    renderTrack(code, phone) {
      const mine = DB.visitor.myOrders();
      $('#trackContent').innerHTML = '<div class="modal-title"><h2>پیگیری سفارش</h2><p class="muted">کد سفارش و شماره‌ی موبایل را وارد کنید.</p></div>' +
        '<div class="modal-pad"><form id="trackForm" class="panel" style="display:grid;gap:14px" novalidate>' +
        '<div class="field"><label for="trCode">کد پیگیری</label><input class="input latin" id="trCode" style="direction:ltr;text-align:left" placeholder="VL-100145" value="' + U.esc(code || '') + '"></div>' +
        '<div class="field"><label for="trPhone">شماره‌ی موبایل</label><input class="input" id="trPhone" inputmode="tel" placeholder="09123456789" value="' + U.esc(phone || (DB.visitor.profile().phone || '')) + '"></div>' +
        '<button class="btn btn-primary" type="submit">' + VI('search') + 'پیگیری</button>' +
        (mine.length ? '<div class="muted" style="font-size:.84rem">سفارش‌های اخیر شما: ' + mine.slice(0, 4).map((c) => '<button type="button" class="chip" data-code="' + U.esc(c) + '" style="min-height:30px;padding:0 12px;margin:2px">' + U.esc(c) + '</button>').join('') + '</div>' : '') +
        '</form><div id="trackResult" style="margin-top:22px"></div></div>';
      $('#trackForm').onsubmit = (e) => { e.preventDefault(); Checkout.lookup($('#trCode').value, $('#trPhone').value); };
      U.$$('#trackForm [data-code]').forEach((b) => b.onclick = () => { $('#trCode').value = b.getAttribute('data-code'); Checkout.lookup(b.getAttribute('data-code'), $('#trPhone').value); });
    },

    lookup(code, phone) {
      const res = $('#trackResult');
      const o = DB.orders.findByTracking(code, phone);
      if (!o) { res.innerHTML = '<div class="card-info" style="background:rgba(248,113,113,.1);border-color:var(--danger)">سفارشی با این مشخصات پیدا نشد. کد و شماره‌ی موبایل را بررسی کنید.</div>'; return; }

      const info = DB.orders.statusInfo(o.status);
      const special = o.status === 'cancelled' || o.status === 'returned';
      const idx = FLOW.indexOf(o.status);
      const at = (st) => { const h = (o.history || []).slice().reverse().find((x) => x.status === st); return h ? U.date(h.at, true) : ''; };

      const tl = special
        ? '<div class="timeline"><div class="tl done"><b>ثبت سفارش</b><small>' + U.date(o.createdAt, true) + '</small></div><div class="tl current"><b>' + info.label + '</b><small>' + at(o.status) + '</small></div></div>'
        : '<div class="timeline">' + FLOW.map((st, i) => {
          const cls = i < idx ? 'done' : i === idx ? 'current' : 'todo';
          return '<div class="tl ' + cls + '"><b>' + DB.orders.statusInfo(st).label + '</b><small>' + (i <= idx ? (at(st) || U.date(o.createdAt, true)) : '') + '</small></div>';
        }).join('') + '</div>';

      res.innerHTML = '<div class="glass" style="padding:20px"><div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px"><b class="latin" style="font-size:1.3rem;letter-spacing:.06em">' + U.esc(o.code) + '</b>' +
        '<span class="badge" style="border-color:' + info.color + ';color:' + info.color + '">' + info.label + '</span></div>' + tl +
        '<div style="margin-top:18px;padding-top:14px;border-top:1px dashed var(--line-strong);font-size:.9rem;display:grid;gap:6px">' +
        o.items.map((i) => '<div class="sum-row"><span>' + U.esc(i.name) + ' × ' + U.toFa(i.qty) + '</span><span>' + U.num(i.price * i.qty) + '</span></div>').join('') +
        '<div class="sum-row total"><span>مبلغ کل</span><span>' + U.num(o.total) + ' ' + U.esc(DB.settings.get().currency) + '</span></div>' +
        (o.trackingNumber ? '<div class="sum-row"><span>کد رهگیری پست</span><b class="latin">' + U.esc(o.trackingNumber) + '</b></div>' : '') + '</div></div>';
    },

    init() {
      $('#trackBtn').innerHTML = VI('box');
      $('#trackBtn').addEventListener('click', () => Checkout.openTrack());
      U.$$('[data-close="checkout"],[data-close="track"],[data-close="product"],[data-close="compare"]').forEach((b) => { if (b.classList.contains('modal-close') && !b.innerHTML.trim()) b.innerHTML = VI('close'); });
    }
  };

  global.VCheckout = Checkout;
})(window);
