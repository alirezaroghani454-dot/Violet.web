/* ==========================================================
   Violet — site/cart.js
   Cart, wishlist, compare bar + their drawers/modals
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI, C = global.VCards;
  const $ = U.$;

  const Cart = {

    /* ---------- state ---------- */
    lines() { return DB.visitor.cart(); },
    save(lines) { DB.visitor.saveCart(lines); Cart.render(); Cart.badges(); },

    coupon() { return DB.read('cartCoupon', ''); },
    giftWrap() { return !!DB.read('cartGift', false); },

    /** cart lines joined with product data (drops products that no longer exist) */
    items() {
      return Cart.lines().map((l) => {
        const p = DB.products.get(l.id);
        return p && p.active !== false ? { line: l, p: p, price: l.price || p.price, qty: l.qty } : null;
      }).filter(Boolean);
    },

    count() { return Cart.lines().reduce((s, l) => s + l.qty, 0); },

    totals() {
      const s = DB.settings.get();
      const items = Cart.items();
      const subtotal = items.reduce((t, i) => t + i.price * i.qty, 0);
      let discount = 0, couponInfo = null, couponMsg = '';
      const code = Cart.coupon();
      if (code && subtotal) {
        const r = DB.coupons.check(code, subtotal);
        if (r.ok) { discount = r.amount; couponInfo = r.coupon; } else { couponMsg = r.msg; }
      }
      const gift = Cart.giftWrap() && items.length ? (s.giftWrapFee || 0) : 0;
      const shipping = !items.length ? 0 : (subtotal - discount >= (s.freeShippingOver || Infinity) ? 0 : (s.shippingFee || 0));
      const tax = Math.round((subtotal - discount) * (s.taxPercent || 0) / 100);
      return {
        items: items, subtotal: subtotal, discount: discount, coupon: couponInfo, couponMsg: couponMsg,
        gift: gift, shipping: shipping, tax: tax,
        total: Math.max(0, subtotal - discount + gift + shipping + tax),
        freeOver: s.freeShippingOver || 0
      };
    },

    /* ---------- actions ---------- */
    add(id, qty, opts) {
      const p = DB.products.get(id);
      if (!p) return;
      qty = qty || 1;
      if (p.stock <= 0) { global.VUI.toast('این ساعت فعلاً ناموجود است.', 'error'); return; }
      const lines = Cart.lines();
      const line = lines.find((l) => l.id === id);
      const have = line ? line.qty : 0;
      if (have + qty > p.stock) {
        global.VUI.toast('حداکثر موجودی این مدل ' + U.toFa(p.stock) + ' عدد است.', 'info');
        qty = p.stock - have;
        if (qty <= 0) return;
      }
      if (line) { line.qty += qty; if (opts && opts.dealPrice) line.price = opts.dealPrice; }
      else lines.push({ id: id, qty: qty, price: opts && opts.dealPrice ? opts.dealPrice : 0 });
      Cart.save(lines);
      global.VUI.toast(p.name + ' به سبد خرید اضافه شد.');
      const b = $('#cartBtn'); if (b) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25) rotate(-8deg)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'ease-out' });
    },

    setQty(id, qty) {
      const p = DB.products.get(id);
      let lines = Cart.lines();
      const line = lines.find((l) => l.id === id);
      if (!line) return;
      if (p && qty > p.stock) { qty = p.stock; global.VUI.toast('موجودی این مدل ' + U.toFa(p.stock) + ' عدد است.', 'info'); }
      if (qty <= 0) lines = lines.filter((l) => l.id !== id); else line.qty = qty;
      Cart.save(lines);
    },

    remove(id) { Cart.save(Cart.lines().filter((l) => l.id !== id)); },

    clear() { DB.write('cartCoupon', ''); DB.write('cartGift', false); Cart.save([]); },

    applyCoupon(code) {
      code = String(code || '').trim();
      if (!code) return { ok: false, msg: 'کد تخفیف را وارد کنید.' };
      const sub = Cart.totals().subtotal;
      const r = DB.coupons.check(code, sub);
      if (r.ok) { DB.write('cartCoupon', code.toUpperCase()); Cart.render(); }
      return r;
    },

    removeCoupon() { DB.write('cartCoupon', ''); Cart.render(); },

    /* ---------- wishlist ---------- */
    toggleWish(id) {
      const w = DB.visitor.wishlist();
      const i = w.indexOf(id);
      const p = DB.products.get(id);
      if (i >= 0) { w.splice(i, 1); global.VUI.toast('از علاقه‌مندی‌ها حذف شد.', 'info'); }
      else { w.unshift(id); global.VUI.toast((p ? p.name : 'ساعت') + ' به علاقه‌مندی‌ها اضافه شد.'); }
      DB.visitor.saveWishlist(w);
      Cart.syncCardStates();
      Cart.badges(); Cart.renderWish();
    },

    /* ---------- compare ---------- */
    toggleCompare(id) {
      const c = DB.visitor.compare();
      const i = c.indexOf(id);
      if (i >= 0) c.splice(i, 1);
      else {
        if (c.length >= 3) { global.VUI.toast('حداکثر ۳ ساعت را می‌توانید مقایسه کنید.', 'info'); return; }
        c.push(id);
      }
      DB.visitor.saveCompare(c);
      Cart.syncCardStates();
      Cart.renderCompareBar();
    },

    syncCardStates() {
      const w = DB.visitor.wishlist(), c = DB.visitor.compare();
      U.$$('.p-card').forEach((card) => {
        const id = card.getAttribute('data-id');
        const wb = card.querySelector('[data-act="wish"]'), cb = card.querySelector('[data-act="compare"]');
        if (wb) { wb.classList.toggle('on', w.indexOf(id) >= 0); wb.setAttribute('aria-pressed', w.indexOf(id) >= 0); }
        if (cb) { cb.classList.toggle('on', c.indexOf(id) >= 0); cb.setAttribute('aria-pressed', c.indexOf(id) >= 0); }
      });
      const pw = $('#pdWish'); if (pw) pw.classList.toggle('on', w.indexOf(pw.getAttribute('data-id')) >= 0);
    },

    /* ---------- rendering ---------- */
    badges() {
      const n = Cart.count(), w = DB.visitor.wishlist().length;
      const cc = $('#cartCount'), wc = $('#wishCount');
      cc.textContent = U.toFa(n); cc.classList.toggle('show', n > 0);
      wc.textContent = U.toFa(w); wc.classList.toggle('show', w > 0);
    },

    render() {
      const body = $('#cartBody'), foot = $('#cartFoot');
      if (!body) return;
      const t = Cart.totals();
      const cur = C.cur();

      if (!t.items.length) {
        body.innerHTML = '<div class="drawer-empty">' + VI('cart') + '<h3>سبد خرید خالی است</h3><p style="margin:8px 0 22px">ساعت دلخواه‌تان را انتخاب کنید و به سبد اضافه کنید.</p><button class="btn btn-primary" data-close="cart" id="cartEmptyBtn">دیدن ساعت‌ها</button></div>';
        foot.innerHTML = '';
        foot.classList.add('hidden');
        const eb = $('#cartEmptyBtn'); if (eb) eb.addEventListener('click', () => { const sh = $('#shop'); if (sh) sh.scrollIntoView({ behavior: 'smooth' }); });
        return;
      }
      foot.classList.remove('hidden');

      const remain = Math.max(0, t.freeOver - (t.subtotal - t.discount));
      const pct = t.freeOver ? Math.min(100, (t.subtotal - t.discount) / t.freeOver * 100) : 100;
      const ship = '<div class="ship-progress">' + (remain > 0
        ? 'با ' + U.num(remain) + ' ' + U.esc(cur) + ' خرید بیشتر، <b>ارسال رایگان</b> می‌شود.'
        : VI('truck', 'ic-inline') + ' <b>ارسال سفارش شما رایگان است!</b>') + '<div class="bar"><i style="width:' + pct + '%"></i></div></div>';

      body.innerHTML = ship + t.items.map((i) =>
        '<div class="cart-item" data-id="' + i.p.id + '">' +
        '<div class="thumb">' + C.watchHtml(i.p, '60 120 280 400') + '</div>' +
        '<div><h4>' + U.esc(i.p.name) + '</h4><small>' + U.esc(C.collectionName(i.p.collection)) + ' · ' + U.esc((i.p.details || {}).strap || '') + '</small>' +
        '<div class="qty"><button data-q="-1" aria-label="کم کردن">−</button><b>' + U.toFa(i.qty) + '</b><button data-q="1" aria-label="زیاد کردن">+</button></div>' +
        '<div class="price"><span class="now">' + U.num(i.price * i.qty) + '</span><span class="cur">' + U.esc(cur) + '</span></div></div>' +
        '<button class="rm" data-rm aria-label="حذف">' + VI('trash') + '</button></div>').join('');

      const code = Cart.coupon();
      foot.innerHTML =
        '<div class="coupon-row"><input class="input" id="couponInput" placeholder="کد تخفیف" value="' + U.esc(t.coupon ? code : '') + '"' + (t.coupon ? ' readonly' : '') + ' aria-label="کد تخفیف">' +
        (t.coupon ? '<button class="btn btn-sm" id="couponRemove">حذف</button>' : '<button class="btn btn-sm" id="couponApply">اعمال</button>') + '</div>' +
        '<div class="coupon-msg ' + (t.coupon ? 'ok' : (t.couponMsg ? 'err' : '')) + '" id="couponMsg">' + (t.coupon ? 'کد «' + U.esc(t.coupon.code) + '» اعمال شد.' : U.esc(t.couponMsg)) + '</div>' +
        '<label class="check"><input type="checkbox" id="giftToggle"' + (Cart.giftWrap() ? ' checked' : '') + '><span>' + VI('gift', 'ic-inline') + ' بسته‌بندی هدیه (' + U.num(DB.settings.get().giftWrapFee) + ' ' + U.esc(cur) + ')</span></label>' +
        '<div class="sum-row"><span>جمع کالاها</span><span>' + U.num(t.subtotal) + ' ' + U.esc(cur) + '</span></div>' +
        (t.discount ? '<div class="sum-row"><span>تخفیف</span><span class="disc">− ' + U.num(t.discount) + ' ' + U.esc(cur) + '</span></div>' : '') +
        (t.gift ? '<div class="sum-row"><span>بسته‌بندی هدیه</span><span>' + U.num(t.gift) + ' ' + U.esc(cur) + '</span></div>' : '') +
        '<div class="sum-row"><span>هزینه‌ی ارسال</span><span>' + (t.shipping ? U.num(t.shipping) + ' ' + U.esc(cur) : '<b style="color:var(--ok)">رایگان</b>') + '</span></div>' +
        (t.tax ? '<div class="sum-row"><span>مالیات</span><span>' + U.num(t.tax) + ' ' + U.esc(cur) + '</span></div>' : '') +
        '<div class="sum-row total"><span>مبلغ قابل پرداخت</span><span>' + U.num(t.total) + ' ' + U.esc(cur) + '</span></div>' +
        '<button class="btn btn-primary btn-lg btn-block" id="goCheckout">ادامه و ثبت سفارش' + VI('arrowL') + '</button>';
    },

    renderWish() {
      const body = $('#wishBody'); if (!body) return;
      const list = DB.visitor.wishlist().map((id) => DB.products.get(id)).filter(Boolean);
      if (!list.length) {
        body.innerHTML = '<div class="drawer-empty">' + VI('heart') + '<h3>لیست علاقه‌مندی‌ها خالی است</h3><p style="margin-top:8px">روی قلب هر ساعت بزنید تا اینجا ذخیره شود.</p></div>';
        return;
      }
      const cur = C.cur();
      body.innerHTML = list.map((p) =>
        '<div class="cart-item" data-id="' + p.id + '"><div class="thumb" data-view style="cursor:pointer">' + C.watchHtml(p, '60 120 280 400') + '</div>' +
        '<div><h4>' + U.esc(p.name) + '</h4><small>' + U.esc(C.collectionName(p.collection)) + '</small>' +
        '<div class="price"><span class="now">' + U.num(p.price) + '</span><span class="cur">' + U.esc(cur) + '</span></div>' +
        (p.stock > 0 ? '<button class="btn btn-primary btn-sm" data-move style="margin-top:8px">افزودن به سبد</button>' : '<small style="color:var(--danger)">ناموجود</small>') + '</div>' +
        '<button class="rm" data-unwish aria-label="حذف">' + VI('trash') + '</button></div>').join('');
    },

    renderCompareBar() {
      const ids = DB.visitor.compare();
      const bar = $('#compareBar');
      bar.classList.toggle('show', ids.length > 0);
      $('#compareText').textContent = U.toFa(ids.length) + ' ساعت برای مقایسه';
      $('#compareOpen').disabled = ids.length < 2;
      $('#compareOpen').classList.toggle('is-disabled', ids.length < 2);
    },

    openCompare() {
      const list = DB.visitor.compare().map((id) => DB.products.get(id)).filter(Boolean);
      if (list.length < 2) { global.VUI.toast('حداقل دو ساعت را انتخاب کنید.', 'info'); return; }
      const rows = [
        ['قیمت', (p) => U.num(p.price) + ' ' + C.cur()],
        ['کلکسیون', (p) => U.esc(C.collectionName(p.collection))],
        ['موومنت', (p) => U.esc((p.details || {}).movement || '-')],
        ['قطر بدنه', (p) => U.esc((p.details || {}).caseSize || '-')],
        ['ضخامت', (p) => U.esc((p.details || {}).thickness || '-')],
        ['جنس بدنه', (p) => U.esc((p.details || {}).caseMaterial || '-')],
        ['شیشه', (p) => U.esc((p.details || {}).glass || '-')],
        ['مقاومت در برابر آب', (p) => U.esc((p.details || {}).water || '-')],
        ['جنس بند', (p) => U.esc((p.details || {}).strap || '-')],
        ['وزن', (p) => U.esc((p.details || {}).weight || '-')],
        ['امتیاز', (p) => U.toFa(p.rating) + ' ★'],
        ['موجودی', (p) => p.stock > 0 ? U.toFa(p.stock) + ' عدد' : 'ناموجود']
      ];
      $('#compareContent').innerHTML = '<table class="compare-table"><thead><tr><th></th>' +
        list.map((p) => '<th><div class="cmp-watch">' + C.svgHtml(p, '36 40 328 570') + '</div><div class="p-name" style="font-size:1.4rem">' + U.esc(p.name) + '</div><button class="btn btn-primary btn-sm" data-cmp-add="' + p.id + '" style="margin-top:8px">افزودن به سبد</button></th>').join('') +
        '</tr></thead><tbody>' + rows.map((r) => '<tr><td>' + r[0] + '</td>' + list.map((p) => '<td>' + r[1](p) + '</td>').join('') + '</tr>').join('') + '</tbody></table>';
      global.VUI.open('compare');
    },

    open() { Cart.render(); global.VUI.open('cart'); },

    /* ---------- events ---------- */
    init() {
      $('#cartBtn').innerHTML = VI('cart') + $('#cartBtn').innerHTML;
      $('#wishBtn').innerHTML = VI('heart') + $('#wishBtn').innerHTML;
      U.$$('[data-close="cart"],[data-close="wish"]').forEach((b) => { if (!b.innerHTML.trim()) b.innerHTML = VI('close'); });
      $('#compareClear').innerHTML = VI('close');

      $('#cartBtn').addEventListener('click', Cart.open);
      $('#wishBtn').addEventListener('click', () => { Cart.renderWish(); global.VUI.open('wish'); });

      $('#cartBody').addEventListener('click', (e) => {
        const item = e.target.closest('.cart-item'); if (!item) return;
        const id = item.getAttribute('data-id');
        const q = e.target.closest('[data-q]');
        if (q) { const line = Cart.lines().find((l) => l.id === id); if (line) Cart.setQty(id, line.qty + Number(q.getAttribute('data-q'))); return; }
        if (e.target.closest('[data-rm]')) { item.style.transition = 'all .3s'; item.style.opacity = '0'; item.style.transform = 'translateX(-30px)'; setTimeout(() => Cart.remove(id), 250); }
      });

      $('#cartFoot').addEventListener('click', (e) => {
        if (e.target.closest('#couponApply')) {
          const r = Cart.applyCoupon($('#couponInput').value);
          if (!r.ok) { const m = $('#couponMsg'); m.className = 'coupon-msg err'; m.textContent = r.msg; } else global.VUI.toast('کد تخفیف اعمال شد.');
        }
        if (e.target.closest('#couponRemove')) Cart.removeCoupon();
        if (e.target.closest('#goCheckout')) { global.VUI.close('cart'); global.VCheckout.open(); }
      });
      $('#cartFoot').addEventListener('change', (e) => { if (e.target.id === 'giftToggle') { DB.write('cartGift', e.target.checked); Cart.render(); } });
      $('#cartFoot').addEventListener('keydown', (e) => { if (e.key === 'Enter' && e.target.id === 'couponInput') { e.preventDefault(); const b = $('#couponApply'); if (b) b.click(); } });

      $('#wishBody').addEventListener('click', (e) => {
        const item = e.target.closest('.cart-item'); if (!item) return;
        const id = item.getAttribute('data-id');
        if (e.target.closest('[data-unwish]')) Cart.toggleWish(id);
        else if (e.target.closest('[data-move]')) { Cart.add(id, 1); }
        else if (e.target.closest('[data-view]')) { global.VUI.close('wish'); global.VProduct.open(id); }
      });

      $('#compareOpen').addEventListener('click', Cart.openCompare);
      $('#compareClear').addEventListener('click', () => { DB.visitor.saveCompare([]); Cart.syncCardStates(); Cart.renderCompareBar(); });
      $('#compareContent').addEventListener('click', (e) => { const b = e.target.closest('[data-cmp-add]'); if (b) Cart.add(b.getAttribute('data-cmp-add'), 1); });

      Cart.render(); Cart.renderWish(); Cart.badges(); Cart.renderCompareBar();
    }
  };

  global.VCart = Cart;
})(window);
