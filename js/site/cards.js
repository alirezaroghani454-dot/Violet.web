/* ==========================================================
   Violet — site/cards.js
   Product card markup + shared product helpers
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI;

  const BADGE = {
    new: ['جدید', 'badge-new'],
    sale: ['تخفیف', 'badge-sale'],
    limited: ['نسخه‌ی محدود', 'badge-limited'],
    bestseller: ['پرفروش', 'badge-bestseller']
  };
  const GENDER = { men: 'آقایان', women: 'بانوان', unisex: 'یونی‌سکس' };

  const Cards = {
    BADGE: BADGE,
    GENDER: GENDER,

    cur() { return DB.settings.get().currency || 'تومان'; },

    collection(id) { return DB.collections.get(id); },
    collectionName(id) { const c = DB.collections.get(id); return c ? c.name : ''; },
    collectionNameEn(id) { const c = DB.collections.get(id); return c ? c.nameEn : ''; },

    discountPercent(p) {
      if (!p.oldPrice || p.oldPrice <= p.price) return 0;
      return Math.round((1 - p.price / p.oldPrice) * 100);
    },

    /** product picture: uploaded photo or generated SVG */
    watchHtml(p, view, live) {
      if (p.images && p.images.length) {
        return '<img src="' + U.esc(p.images[0]) + '" alt="' + U.esc(p.name) + '" loading="lazy" decoding="async">';
      }
      return global.VioletWatch.svg(p.spec, { viewBox: view || '36 40 328 570', live: !!live, label: 'ساعت ' + p.name });
    },

    /** generated SVG always (for thumbnails and fallback) */
    svgHtml(p, view, live) {
      return global.VioletWatch.svg(p.spec, { viewBox: view || '36 40 328 570', live: !!live, label: 'ساعت ' + p.name });
    },

    stockState(p) {
      if (p.stock <= 0) return 'out';
      if (p.stock <= 5) return 'low';
      return 'in';
    },

    priceHtml(p, big) {
      const cur = Cards.cur();
      return '<span class="price' + (big ? ' pd-price' : '') + '"><span class="now">' + U.num(p.price) + '</span><span class="cur">' + U.esc(cur) + '</span>' +
        (p.oldPrice > p.price ? '<span class="old">' + U.num(p.oldPrice) + '</span>' : '') + '</span>';
    },

    badgesHtml(p) {
      const list = (p.badges || []).slice();
      const d = Cards.discountPercent(p);
      let out = '';
      if (d && list.indexOf('sale') < 0) list.push('sale');
      list.forEach((b) => {
        if (!BADGE[b]) return;
        out += '<span class="badge ' + BADGE[b][1] + '">' + BADGE[b][0] + (b === 'sale' && d ? ' ٪' + U.toFa(d) : '') + '</span>';
      });
      if (p.stock <= 0) out += '<span class="badge">ناموجود</span>';
      return out;
    },

    card(p) {
      const wished = DB.visitor.wishlist().indexOf(p.id) >= 0;
      const cmp = DB.visitor.compare().indexOf(p.id) >= 0;
      const state = Cards.stockState(p);
      const d = p.details || {};
      return '' +
        '<article class="p-card' + (state === 'out' ? ' sold-out' : '') + '" data-id="' + p.id + '">' +
        '<div class="p-media" data-act="open" tabindex="0" role="button" aria-label="مشاهده‌ی ' + U.esc(p.name) + '">' +
        '<div class="p-badges">' + Cards.badgesHtml(p) + '</div>' +
        '<div class="p-actions">' +
        '<button class="' + (wished ? 'on' : '') + '" data-act="wish" aria-label="علاقه‌مندی" aria-pressed="' + wished + '">' + VI('heart') + '</button>' +
        '<button class="secondary' + (cmp ? ' on' : '') + '" data-act="compare" aria-label="مقایسه" aria-pressed="' + cmp + '">' + VI('compare') + '</button>' +
        '<button class="secondary" data-act="open" aria-label="مشاهده‌ی سریع">' + VI('eye') + '</button>' +
        '</div>' +
        '<div class="p-watch">' + Cards.watchHtml(p) + '</div>' +
        (state !== 'out' ? '<button class="btn btn-primary btn-sm p-quick" data-act="add">' + VI('cart') + 'افزودن به سبد</button>' : '') +
        '</div>' +
        '<div class="p-body">' +
        '<span class="p-col">' + U.esc(Cards.collectionName(p.collection)) + ' · ' + (GENDER[p.gender] || '') + '</span>' +
        '<h3 class="p-name">' + U.esc(p.name) + '</h3>' +
        '<div class="p-meta">' + global.VIStars(p.rating) + '<span>' + U.toFa(p.rating) + ' (' + U.toFa(p.reviewsCount || 0) + ')</span></div>' +
        '<div class="p-spec">' + U.esc(d.caseSize || '') + ' · ' + U.esc(d.strap || '') + '</div>' +
        (state === 'low' ? '<div class="stock-note">فقط ' + U.toFa(p.stock) + ' عدد باقی مانده</div>' : '') +
        '<div class="p-foot">' + Cards.priceHtml(p) +
        (state !== 'out' ? '<button class="add" data-act="add" aria-label="افزودن ' + U.esc(p.name) + ' به سبد">' + VI('cart') + '</button>' : '<span class="muted" style="font-size:.8rem">ناموجود</span>') +
        '</div></div></article>';
    },

    /** delegated events for any container holding .p-card elements */
    bind(container) {
      if (!container || container.__bound) return;
      container.__bound = true;

      container.addEventListener('click', (e) => {
        const card = e.target.closest('.p-card');
        if (!card) return;
        const id = card.getAttribute('data-id');
        const actEl = e.target.closest('[data-act]');
        const act = actEl ? actEl.getAttribute('data-act') : null;
        if (act === 'wish') { e.stopPropagation(); global.VCart.toggleWish(id); return; }
        if (act === 'compare') { e.stopPropagation(); global.VCart.toggleCompare(id); return; }
        if (act === 'add') {
          e.stopPropagation();
          global.VCart.add(id, 1);
          const pw = card.querySelector('.p-watch');
          if (pw) { pw.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12) rotate(-4deg)' }, { transform: 'scale(1)' }], { duration: 420, easing: 'ease-out' }); }
          return;
        }
        if (act === 'open') { global.VProduct.open(id); }
      });

      container.addEventListener('keydown', (e) => {
        if ((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('p-media')) {
          e.preventDefault();
          global.VProduct.open(e.target.closest('.p-card').getAttribute('data-id'));
        }
      });

      // 3D parallax on the watch while hovering the card image
      container.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const media = e.target.closest('.p-media');
        if (!media) return;
        const w = media.querySelector('.p-watch');
        const r = media.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        media.style.setProperty('--mx', (x * 100) + '%');
        media.style.setProperty('--my', (y * 100) + '%');
        if (w) w.style.transform = 'rotateY(' + ((x - 0.5) * 26).toFixed(1) + 'deg) rotateX(' + ((0.5 - y) * 18).toFixed(1) + 'deg) translateZ(20px)';
      });
      container.addEventListener('pointerout', (e) => {
        const media = e.target.closest && e.target.closest('.p-media');
        if (!media || media.contains(e.relatedTarget)) return;
        const w = media.querySelector('.p-watch');
        if (w) w.style.transform = '';
      });
    }
  };

  global.VCards = Cards;
})(window);
