/* ==========================================================
   Violet — site/sections.js
   Renders every content section from the database
   (announcement bar, trust strip, collections, featured rail,
   daily deal, story, testimonials, FAQ, contact, footer)
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI, C = global.VCards;
  const $ = U.$;
  let dealTimer = null;

  const S = {

    brand(s) {
      document.title = s.brand + ' | فروشگاه ساعت مچی ' + (s.brandFa || '');
      $('#brandName').textContent = s.brand;
      $('#brandSlogan').textContent = s.slogan;
      $('#footBrand').textContent = s.brand;
      $('#logoMark').innerHTML = global.VILogo;
      $('#footLogoMark').innerHTML = global.VILogo;
      $('#footAbout').textContent = 'فروشگاه تخصصی ساعت مچی ' + s.brand + '؛ ' + s.slogan + '. همه‌ی محصولات با کارت اصالت و گارانتی معتبر عرضه می‌شوند.';
      $('#copyright').textContent = '© ' + U.toFa(new Date().getFullYear() - 621) + ' ' + s.brand + ' — تمامی حقوق محفوظ است.';
      const wa = $('#waBtn');
      if (wa) { wa.href = 'https://wa.me/' + String(s.whatsapp || '').replace(/\D/g, '') + '?text=' + encodeURIComponent('سلام، درباره‌ی ساعت‌های ' + s.brand + ' سوال داشتم'); wa.innerHTML = VI('whatsapp'); }
    },

    announce(s) {
      const items = (s.announcements || []).filter(Boolean);
      const html = items.map((t) => '<span>' + U.esc(t) + '</span>').join('');
      $('#announceTrack').innerHTML = html + html + html + html;
      $('#announce').classList.toggle('hidden', !items.length);
    },

    trust(s) {
      $('#trustGrid').innerHTML = (s.trust || []).map((t) =>
        '<div class="trust-item"><span class="ico">' + VI(t.icon || 'shield') + '</span><div><h3>' + U.esc(t.title) + '</h3><p>' + U.esc(t.text) + '</p></div></div>').join('');
    },

    collections() {
      const cols = DB.collections.all().filter((c) => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      const prods = DB.products.active();
      const grid = $('#colGrid');
      grid.innerHTML = cols.map((c) => {
        const list = prods.filter((p) => p.collection === c.id);
        const hero = list.find((p) => p.badges && p.badges.indexOf('bestseller') >= 0) || list[0];
        return '<article class="col-card" data-col="' + c.id + '" style="--c1:' + c.c1 + ';--c2:' + c.c2 + '" tabindex="0" role="button" aria-label="کلکسیون ' + U.esc(c.name) + '">' +
          '<span class="shine"></span>' +
          '<div><div class="en latin">' + U.esc(c.nameEn) + '</div><div class="fa">' + U.esc(c.name) + '</div><div class="tag">' + U.esc(c.tagline) + '</div></div>' +
          '<div class="col-watch">' + (hero ? C.svgHtml(hero, '36 40 328 570') : '') + '</div>' +
          '<div class="foot"><span>' + U.toFa(list.length) + ' مدل</span><span class="go">' + VI('arrowL') + '</span></div></article>';
      }).join('');
      U.$$('.col-card', grid).forEach((card) => global.VUI.tilt(card, { max: 9 }));
    },

    featured() {
      let list = DB.products.active().filter((p) => p.featured);
      if (list.length < 6) list = list.concat(DB.products.active().filter((p) => !p.featured).slice(0, 8 - list.length));
      list = list.slice(0, 14);
      const rail = $('#featuredRail');
      rail.innerHTML = list.map(C.card).join('');
      C.bind(rail);
    },

    deal(s) {
      const d = s.deal || {};
      const box = $('#dealBox');
      const sec = $('#deal');
      const p = DB.products.get(d.productId);
      if (!d.enabled || !p) { sec.classList.add('hidden'); return; }
      sec.classList.remove('hidden');

      const pct = Number(d.discountPercent) || 0;
      const base = p.oldPrice > p.price ? p.oldPrice : p.price;
      const dealPrice = Math.round(base * (100 - pct) / 100 / 10000) * 10000;
      const cur = C.cur();

      box.innerHTML =
        '<div><span class="badge">' + VI('flame') + U.esc(d.title || 'پیشنهاد ویژه') + '</span>' +
        '<h2>فقط تا پایان این شمارش معکوس</h2>' +
        '<div class="deal-name latin">' + U.esc(p.name) + '</div>' +
        '<p style="margin-top:10px">' + U.esc(C.collectionName(p.collection)) + ' · ' + U.esc((p.details || {}).movement || '') + '</p>' +
        '<div class="countdown" id="countdown"><div class="box"><b data-u="s">۰۰</b><span>ثانیه</span></div><div class="box"><b data-u="m">۰۰</b><span>دقیقه</span></div><div class="box"><b data-u="h">۰۰</b><span>ساعت</span></div><div class="box"><b data-u="d">۰۰</b><span>روز</span></div></div>' +
        '<div class="deal-price"><span class="now">' + U.num(dealPrice) + ' ' + U.esc(cur) + '</span><span class="old">' + U.num(base) + '</span></div>' +
        '<div style="display:flex;gap:12px;flex-wrap:wrap" class="deal-btns"><button class="btn btn-gold btn-lg" id="dealBuy">' + VI('cart') + 'خرید با قیمت ویژه</button><button class="btn btn-lg" id="dealView" style="--btn-bg:rgba(255,255,255,.14);--btn-fg:#fff">مشاهده‌ی جزئیات</button></div></div>' +
        '<div class="deal-visual"><span class="glow"></span><div class="deal-watch" id="dealWatch">' + C.svgHtml(p, '36 40 328 570', true) + '</div>' +
        '<div class="off"><div><b>٪' + U.toFa(pct) + '</b><small>تخفیف</small></div></div></div>';

      global.VioletWatch.startLive();
      $('#dealView').onclick = () => global.VProduct.open(p.id);
      $('#dealBuy').onclick = () => { global.VCart.add(p.id, 1, { dealPrice: dealPrice }); global.VCart.open(); };
      global.VUI.tilt($('#dealBox .deal-visual'), { max: 14, target: $('#dealWatch') });

      clearInterval(dealTimer);
      const end = Number(d.endsAt) || (Date.now() + 86400000);
      const tick = () => {
        let left = Math.max(0, end - Date.now());
        const days = Math.floor(left / 86400000); left -= days * 86400000;
        const hrs = Math.floor(left / 3600000); left -= hrs * 3600000;
        const min = Math.floor(left / 60000); left -= min * 60000;
        const sec2 = Math.floor(left / 1000);
        const set = (k, v) => { const el = $('[data-u="' + k + '"]', box); if (el) el.textContent = U.toFa(String(v).padStart(2, '0')); };
        set('d', days); set('h', hrs); set('m', min); set('s', sec2);
      };
      tick();
      dealTimer = setInterval(tick, 1000);
    },

    story(s) {
      const st = s.story;
      $('#storyTitle').textContent = st.title;
      $('#storyText1').textContent = st.text1;
      $('#storyText2').textContent = st.text2;
      $('#storyPoints').innerHTML = (st.points || []).map((t) => '<li>' + VI('check') + '<span>' + U.esc(t) + '</span></li>').join('');

      const prods = DB.products.active();
      const pick = (id) => prods.find((p) => p.collection === id) || prods[0];
      const trio = [pick('c_monarch'), pick('c_phantom'), pick('c_aurora')].filter(Boolean);
      const vis = $('#storyVisual');
      U.$$('.st', vis).forEach((n) => n.remove());
      trio.forEach((p, i) => {
        const d = U.el('div', { class: 'st s' + (i === 0 ? 1 : i === 1 ? 2 : 3) }, C.svgHtml(p, '36 40 328 570', i === 1));
        vis.appendChild(d);
      });
      global.VioletWatch.startLive();
      if (!vis.__par) {
        vis.__par = true;
        vis.addEventListener('pointermove', (e) => {
          if (e.pointerType !== 'mouse') return;
          const r = vis.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          U.$$('.st', vis).forEach((el, i) => { el.style.translate = (-x * (14 + i * 10)) + 'px ' + (-y * (10 + i * 8)) + 'px'; });
        });
        vis.addEventListener('pointerleave', () => U.$$('.st', vis).forEach((el) => { el.style.translate = ''; }));
      }
    },

    testimonials(s) {
      $('#testiTrack').innerHTML = (s.testimonials || []).map((t) =>
        '<article class="testi"><div>' + global.VIStars(t.rating) + '</div><p>' + U.esc(t.text) + '</p>' +
        '<div class="who"><span class="avatar">' + U.esc(String(t.name).trim().charAt(0)) + '</span><div><b>' + U.esc(t.name) + '</b><small>' + U.esc(t.role || '') + '</small></div></div></article>').join('');
    },

    faq(s) {
      const list = $('#faqList');
      list.innerHTML = (s.faq || []).map((f, i) =>
        '<div class="faq-item' + (i === 0 ? ' open' : '') + '"><button class="faq-q" aria-expanded="' + (i === 0) + '"><span>' + U.esc(f.q) + '</span><span class="plus">' + VI('plus') + '</span></button>' +
        '<div class="faq-a"><div><p>' + U.esc(f.a) + '</p></div></div></div>').join('');
      if (!list.__bound) {
        list.__bound = true;
        list.addEventListener('click', (e) => {
          const q = e.target.closest('.faq-q');
          if (!q) return;
          const item = q.parentElement;
          const open = !item.classList.contains('open');
          U.$$('.faq-item.open', list).forEach((x) => { x.classList.remove('open'); x.querySelector('.faq-q').setAttribute('aria-expanded', 'false'); });
          if (open) { item.classList.add('open'); q.setAttribute('aria-expanded', 'true'); }
        });
      }
    },

    contact(s) {
      const tel = String(s.mobile || s.phone || '').replace(/[^\d+]/g, '');
      $('#contactInfo').innerHTML =
        '<a class="info-card" href="tel:' + tel + '"><span class="ico">' + VI('phone') + '</span><div><small>تلفن پشتیبانی</small><b>' + U.esc(s.phone) + '</b></div></a>' +
        '<a class="info-card" href="https://wa.me/' + String(s.whatsapp || '').replace(/\D/g, '') + '" target="_blank" rel="noopener"><span class="ico">' + VI('whatsapp') + '</span><div><small>واتساپ</small><b>گفتگوی آنلاین با مشاور</b></div></a>' +
        '<a class="info-card" href="mailto:' + U.esc(s.email) + '"><span class="ico">' + VI('mail') + '</span><div><small>ایمیل</small><b class="latin" style="font-size:1.1rem">' + U.esc(s.email) + '</b></div></a>' +
        '<div class="info-card"><span class="ico">' + VI('pin') + '</span><div><small>نشانی فروشگاه</small><b>' + U.esc(s.address) + '</b></div></div>' +
        '<div class="info-card"><span class="ico">' + VI('clock') + '</span><div><small>ساعت کاری</small><b>' + U.esc(s.workingHours) + '</b></div></div>';
    },

    footer(s) {
      const soc = [];
      if (s.instagram) soc.push('<a href="https://instagram.com/' + U.esc(s.instagram) + '" target="_blank" rel="noopener" aria-label="اینستاگرام">' + VI('instagram') + '</a>');
      if (s.telegram) soc.push('<a href="https://t.me/' + U.esc(s.telegram) + '" target="_blank" rel="noopener" aria-label="تلگرام">' + VI('telegram') + '</a>');
      if (s.whatsapp) soc.push('<a href="https://wa.me/' + String(s.whatsapp).replace(/\D/g, '') + '" target="_blank" rel="noopener" aria-label="واتساپ">' + VI('whatsapp') + '</a>');
      if (s.email) soc.push('<a href="mailto:' + U.esc(s.email) + '" aria-label="ایمیل">' + VI('mail') + '</a>');
      $('#socials').innerHTML = soc.join('');
      $('#footContact').innerHTML =
        '<li class="muted">' + U.esc(s.address) + '</li><li><a href="tel:' + String(s.phone).replace(/[^\d+]/g, '') + '">' + U.esc(s.phone) + '</a></li><li><a href="mailto:' + U.esc(s.email) + '" class="latin">' + U.esc(s.email) + '</a></li><li class="muted">' + U.esc(s.workingHours) + '</li>';
    },

    visibility(s) {
      const map = { trust: 'sec-trust', collections: 'collections', featured: 'featured', deal: 'deal', shop: 'shop', story: 'story', testimonials: 'testimonials', faq: 'faq', newsletter: 'newsletter', contact: 'contact' };
      Object.keys(map).forEach((k) => {
        const el = document.getElementById(map[k]);
        if (el) el.classList.toggle('hidden', s.sections[k] === false);
      });
      if (s.deal && (!s.deal.enabled || !DB.products.get(s.deal.productId))) $('#deal').classList.add('hidden');
      // nav links for hidden sections
      U.$$('#mainNav a[href^="#"]').forEach((a) => {
        const id = a.getAttribute('href').slice(1);
        const key = Object.keys(map).find((k) => map[k] === id);
        a.classList.toggle('hidden', !!key && s.sections[key] === false);
      });
    },

    /** (re)render everything that depends on settings or products */
    all() {
      const s = DB.settings.get();
      global.VUI.applyBrand(s);
      S.brand(s);
      S.announce(s);
      S.trust(s);
      S.collections();
      S.featured();
      S.deal(s);
      S.story(s);
      S.testimonials(s);
      S.faq(s);
      S.contact(s);
      S.footer(s);
      S.visibility(s);
      global.VUI.reveal(document);
    }
  };

  global.VSections = S;
})(window);
