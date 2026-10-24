/* ==========================================================
   Violet — site/product.js
   Product detail modal: draggable 3D watch, gallery, specs,
   reviews (with moderation) and related products
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI, C = global.VCards;
  const $ = U.$;
  let current = null;
  let qty = 1;
  let newRating = 5;

  const Product = {

    open(id, tab) {
      const p = DB.products.get(id);
      if (!p) return;
      current = p; qty = 1; newRating = 5;
      DB.visitor.pushRecent(id);
      Product.render(tab || 'desc');
      global.VUI.open('product');
      $('#pdContent').scrollTop = 0;
      try { history.replaceState(null, '', '#p=' + id); } catch (e) { /* file:// etc. */ }
    },

    close() { global.VUI.close('product'); },

    render(tab) {
      const p = current;
      const box = $('#pdContent');
      const d = p.details || {};
      const wished = DB.visitor.wishlist().indexOf(p.id) >= 0;
      const state = C.stockState(p);
      const reviews = DB.reviews.forProduct(p.id, true).sort((a, b) => b.createdAt - a.createdAt);
      const col = C.collection(p.collection);
      const hasPhotos = p.images && p.images.length;

      const thumbs = hasPhotos
        ? '<div class="pd-thumbs">' + p.images.map((src, i) => '<button data-img="' + i + '" class="' + (i === 0 ? 'active' : '') + '" aria-label="تصویر ' + U.toFa(i + 1) + '"><img src="' + U.esc(src) + '" alt=""></button>').join('') +
          '<button data-img="svg" aria-label="نمای سه‌بعدی">' + C.svgHtml(p, '36 150 328 340') + '</button></div>'
        : '';

      box.innerHTML =
        '<div class="pd">' +
        '<div class="pd-stage" id="pdStage">' +
        '<div class="pd-watch" id="pdWatch">' + (hasPhotos ? '<img src="' + U.esc(p.images[0]) + '" alt="' + U.esc(p.name) + '">' : C.svgHtml(p, '20 20 360 600', true)) + '</div>' +
        thumbs +
        '<div class="pd-hint">' + VI('rotate', 'ic-inline') + ' برای چرخاندن ساعت بکشید</div></div>' +

        '<div class="pd-info">' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap">' + C.badgesHtml(p) + '</div>' +
        '<a class="col-link" href="#shop" data-col-link="' + p.collection + '">کلکسیون ' + U.esc(col ? col.name : '') + ' ‹</a>' +
        '<h2 class="pd-title">' + U.esc(p.name) + '</h2>' +
        '<div class="pd-rate">' + global.VIStars(p.rating) + '<b>' + U.toFa(p.rating) + '</b><span>(' + U.toFa(p.reviewsCount || 0) + ' نظر)</span><span>·</span><span>کد کالا: <span class="latin">' + U.esc(p.sku) + '</span></span></div>' +
        '<div>' + C.priceHtml(p, true) + '</div>' +
        '<span class="stock-tag ' + state + '">' + (state === 'out' ? 'ناموجود' : state === 'low' ? 'فقط ' + U.toFa(p.stock) + ' عدد در انبار' : 'موجود در انبار') + '</span>' +
        '<p class="pd-desc">' + U.esc(p.desc) + '</p>' +
        '<ul class="pd-feats">' + (p.features || []).slice(0, 6).map((f) => '<li>' + VI('check') + '<span>' + U.esc(f) + '</span></li>').join('') + '</ul>' +

        '<div class="pd-buy">' +
        (state !== 'out'
          ? '<div class="qty"><button id="pdMinus" aria-label="کم">−</button><b id="pdQty">' + U.toFa(qty) + '</b><button id="pdPlus" aria-label="زیاد">+</button></div>' +
            '<button class="btn btn-primary btn-lg" id="pdAdd">' + VI('cart') + 'افزودن به سبد خرید</button>'
          : '<button class="btn btn-lg" disabled style="flex:1">ناموجود</button>') +
        '<button class="icon-btn' + (wished ? ' on' : '') + '" id="pdWish" data-id="' + p.id + '" aria-label="علاقه‌مندی" style="width:54px;height:54px">' + VI('heart') + '</button>' +
        '<button class="icon-btn" id="pdShare" aria-label="اشتراک‌گذاری" style="width:54px;height:54px">' + VI('share') + '</button></div>' +

        '<div class="pd-meta"><span>' + VI('shield') + 'گارانتی اصالت و ۵ ساله</span><span>' + VI('truck') + 'ارسال بیمه‌شده</span><span>' + VI('return') + '۷ روز بازگشت</span><span>' + VI('gift') + 'جعبه‌ی هدیه</span></div>' +
        '</div></div>' +

        '<div class="pd-tabs"><div class="tabs" role="tablist"><button data-tab="desc" role="tab">مشخصات</button><button data-tab="reviews" role="tab">نظرات (' + U.toFa(reviews.length) + ')</button><button data-tab="ship" role="tab">ارسال و گارانتی</button></div>' +
        '<div id="pdTabBody"></div></div>' +
        '<div class="related" id="pdRelated"></div>';

      Product.tab(tab || 'desc');
      Product.related();
      Product.bind();
      global.VioletWatch.startLive();
    },

    tab(name) {
      const p = current; const d = p.details || {};
      U.$$('.pd-tabs .tabs button').forEach((b) => b.classList.toggle('active', b.getAttribute('data-tab') === name));
      const body = $('#pdTabBody');

      if (name === 'desc') {
        const rows = [['موومنت', d.movement], ['منبع انرژی', d.power], ['قطر بدنه', d.caseSize], ['ضخامت', d.thickness], ['جنس بدنه', d.caseMaterial], ['شیشه', d.glass], ['مقاومت در برابر آب', d.water], ['جنس بند', d.strap], ['وزن', d.weight], ['گارانتی', d.warranty]];
        body.innerHTML = '<div class="spec-table">' + rows.filter((r) => r[1]).map((r) => '<div><span>' + r[0] + '</span><b>' + U.esc(r[1]) + '</b></div>').join('') + '</div>';
      }

      if (name === 'reviews') {
        const list = DB.reviews.forProduct(p.id, true).sort((a, b) => b.createdAt - a.createdAt);
        body.innerHTML =
          (list.length ? list.map((r) =>
            '<div class="review"><header><b>' + U.esc(r.name) + '</b>' + global.VIStars(r.rating) + '<small>' + U.timeAgo(r.createdAt) + '</small></header><p>' + U.esc(r.text) + '</p></div>').join('')
            : '<p class="muted">هنوز نظری ثبت نشده. اولین نفر باشید!</p>') +
          '<form class="review-form" id="reviewForm" novalidate><h4>نظر خودتان را بنویسید</h4>' +
          '<div class="star-input" id="starInput">' + [1, 2, 3, 4, 5].map((i) => '<button type="button" data-s="' + i + '" class="on" aria-label="' + U.toFa(i) + ' ستاره"><svg viewBox="0 0 24 24"><path d="m12 2.500 2.900 6 6.600.9-4.800 4.600 1.200 6.500L12 17.300 6.100 20.500l1.200-6.500L2.500 9.400l6.600-.9z"/></svg></button>').join('') + '</div>' +
          '<div class="row cols-2"><div class="field"><label for="rvName">نام شما</label><input class="input" id="rvName"></div></div>' +
          '<div class="field"><label for="rvText">متن نظر</label><textarea class="textarea" id="rvText" style="min-height:90px"></textarea></div>' +
          '<button class="btn btn-primary" type="submit" style="justify-self:start">ثبت نظر</button><small class="muted">نظر شما پس از تایید مدیر نمایش داده می‌شود.</small></form>';
      }

      if (name === 'ship') {
        const s = DB.settings.get();
        body.innerHTML = '<div class="spec-table">' +
          '<div><span>هزینه‌ی ارسال</span><b>' + U.num(s.shippingFee) + ' ' + U.esc(s.currency) + '</b></div>' +
          '<div><span>ارسال رایگان</span><b>خرید بالای ' + U.num(s.freeShippingOver) + ' ' + U.esc(s.currency) + '</b></div>' +
          '<div><span>زمان تحویل تهران</span><b>۱ تا ۲ روز کاری</b></div>' +
          '<div><span>زمان تحویل شهرستان</span><b>۲ تا ۴ روز کاری</b></div>' +
          '<div><span>بازگشت کالا</span><b>تا ۷ روز</b></div>' +
          '<div><span>گارانتی</span><b>۵ سال ویولت</b></div></div>';
      }
    },

    related() {
      const list = DB.products.related(current, 8);
      const box = $('#pdRelated');
      if (!list.length) { box.innerHTML = ''; return; }
      box.innerHTML = '<h3>ساعت‌های مشابه</h3><div class="rail" id="relRail">' + list.map(C.card).join('') + '</div>';
      C.bind($('#relRail'));
    },

    bind() {
      const box = $('#pdContent');

      /* drag-to-rotate 3D */
      const stage = $('#pdStage'), watch = $('#pdWatch');
      let drag = false, sx = 0, sy = 0, ry = 0, rx = 0, bx = 0, by = 0;
      const set = () => { watch.style.transform = 'rotateY(' + ry.toFixed(1) + 'deg) rotateX(' + rx.toFixed(1) + 'deg)'; };
      stage.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.pd-thumbs')) return;
        drag = true; sx = e.clientX; sy = e.clientY; bx = ry; by = rx; watch.classList.add('dragging');
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      stage.addEventListener('pointermove', (e) => {
        if (drag) { ry = U.clamp(bx + (e.clientX - sx) * 0.55, -70, 70); rx = U.clamp(by - (e.clientY - sy) * 0.3, -30, 30); set(); }
        else if (e.pointerType === 'mouse') {
          const r = stage.getBoundingClientRect();
          ry = ((e.clientX - r.left) / r.width - 0.5) * 30; rx = -((e.clientY - r.top) / r.height - 0.5) * 18; set();
        }
      });
      const end = () => { if (!drag) return; drag = false; watch.classList.remove('dragging'); };
      stage.addEventListener('pointerup', end); stage.addEventListener('pointercancel', end);
      stage.addEventListener('pointerleave', () => { if (!drag) { ry = 0; rx = 0; set(); } });
      stage.addEventListener('dblclick', () => { ry = 0; rx = 0; set(); });

      /* gallery thumbs */
      U.$$('.pd-thumbs button', box).forEach((b) => b.addEventListener('click', () => {
        const v = b.getAttribute('data-img');
        watch.innerHTML = v === 'svg' ? C.svgHtml(current, '20 20 360 600', true) : '<img src="' + U.esc(current.images[Number(v)]) + '" alt="">';
        U.$$('.pd-thumbs button', box).forEach((x) => x.classList.toggle('active', x === b));
        global.VioletWatch.startLive();
      }));

      /* buy box */
      const q = $('#pdQty');
      const minus = $('#pdMinus'), plus = $('#pdPlus');
      if (minus) minus.onclick = () => { qty = Math.max(1, qty - 1); q.textContent = U.toFa(qty); };
      if (plus) plus.onclick = () => { qty = Math.min(current.stock, qty + 1); q.textContent = U.toFa(qty); };
      const add = $('#pdAdd'); if (add) add.onclick = () => { global.VCart.add(current.id, qty); };
      $('#pdWish').onclick = () => global.VCart.toggleWish(current.id);
      $('#pdShare').onclick = () => {
        const url = location.href.split('#')[0] + '#p=' + current.id;
        if (navigator.share) navigator.share({ title: 'Violet ' + current.name, url: url }).catch(() => {});
        else if (navigator.clipboard) navigator.clipboard.writeText(url).then(() => global.VUI.toast('لینک محصول کپی شد.'));
        else global.VUI.toast(url, 'info', 6000);
      };

      /* tabs */
      U.$$('.pd-tabs .tabs button', box).forEach((b) => b.addEventListener('click', () => Product.tab(b.getAttribute('data-tab'))));

      /* collection link */
      const cl = $('[data-col-link]', box);
      if (cl) cl.addEventListener('click', (e) => { e.preventDefault(); Product.close(); global.VShop.setCollection(cl.getAttribute('data-col-link')); });

      /* reviews (delegated, since the form is rebuilt per tab) */
      $('#pdTabBody').onclick = (e) => {
        const s = e.target.closest('[data-s]');
        if (s) { newRating = Number(s.getAttribute('data-s')); U.$$('#starInput button').forEach((b) => b.classList.toggle('on', Number(b.getAttribute('data-s')) <= newRating)); }
      };
      $('#pdTabBody').onsubmit = (e) => {
        e.preventDefault();
        const name = $('#rvName').value.trim(), text = $('#rvText').value.trim();
        if (!name || text.length < 5) { global.VUI.toast('نام و متن نظر را کامل بنویسید.', 'error'); return; }
        DB.reviews.add({ productId: current.id, name: name, text: text, rating: newRating });
        DB.log('review', 'نظر جدید برای ' + current.name + ' ثبت شد');
        global.VUI.toast('نظر شما ثبت شد و پس از تایید نمایش داده می‌شود.');
        e.target.reset();
      };
    }
  };

  global.VProduct = Product;

  /* close hook: clean the url hash */
  global.VU.bus.on('layer:close', (n) => {
    if (n === 'product') { try { if (location.hash.indexOf('#p=') === 0) history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignore */ } }
  });
})(window);
