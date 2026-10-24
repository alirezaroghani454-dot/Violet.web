/* ==========================================================
   Violet — site/app.js
   Boots the storefront: data, theme, header, navigation,
   rails, scroll effects, deep links and live sync with the
   admin panel (other tab).
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI;
  const $ = U.$;

  function boot() {
    DB.init();
    const s = DB.settings.get();

    /* theme: visitor choice > shop default */
    const saved = global.VUI.getSavedTheme();
    global.VUI.setTheme(saved || s.theme || 'dark');
    if (U.prefersReducedMotion()) document.documentElement.classList.add('reduce-motion');

    /* header icons */
    $('#menuBtn').innerHTML = VI('menu');
    $('#navClose').innerHTML = VI('close');
    $('#themeBtn').addEventListener('click', global.VUI.toggleTheme);
    $('#upBtn').innerHTML = VI('arrowUp') || VI('chevUp') || '↑';
    const hint = document.querySelector('.scroll-hint'); if (hint) hint.innerHTML = VI('arrowDown') || '↓';

    /* mobile menu: the header uses backdrop-filter, which would trap a fixed drawer inside it,
       so on small screens the nav lives directly in <body> */
    const nav = $('#mainNav'), inner = document.querySelector('.header-inner'), actions = document.querySelector('.header-actions');
    const mq = window.matchMedia('(max-width: 980px)');
    const placeNav = () => { if (mq.matches) document.body.appendChild(nav); else inner.insertBefore(nav, actions); };
    if (mq.addEventListener) mq.addEventListener('change', placeNav); else mq.addListener(placeNav);
    placeNav();

    /* mobile menu */
    $('#menuBtn').addEventListener('click', () => { global.VUI.open('nav'); $('#navClose').classList.remove('hidden'); $('#menuBtn').setAttribute('aria-expanded', 'true'); });
    $('#navClose').addEventListener('click', () => { global.VUI.close('nav'); $('#menuBtn').setAttribute('aria-expanded', 'false'); });
    $('#mainNav').addEventListener('click', (e) => { if (e.target.closest('a')) { global.VUI.close('nav'); $('#menuBtn').setAttribute('aria-expanded', 'false'); } });

    /* content */
    global.VHero.init(s);
    global.VSections.all();
    global.VShop.init();
    global.VCart.init();
    global.VCheckout.init();
    global.VForms.init();
    global.VUI.cursor();

    /* collection cards -> shop filter */
    $('#colGrid').addEventListener('click', (e) => { const c = e.target.closest('[data-col]'); if (c) global.VShop.setCollection(c.getAttribute('data-col')); });
    $('#colGrid').addEventListener('keydown', (e) => { if (e.key === 'Enter') { const c = e.target.closest('[data-col]'); if (c) global.VShop.setCollection(c.getAttribute('data-col')); } });
    const all = document.querySelector('a[data-col=""]');
    if (all) all.addEventListener('click', () => global.VShop.setCollection('', false));

    /* rails (RTL aware: scrollBy with negative values moves "forward") */
    function rail(trackSel, prevSel, nextSel) {
      const track = $(trackSel), prev = $(prevSel), next = $(nextSel);
      if (!track) return;
      prev.innerHTML = VI('arrowR'); next.innerHTML = VI('arrowL');
      const step = () => Math.max(260, track.clientWidth * 0.8);
      prev.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
      next.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    }
    rail('#featuredRail', '#featPrev', '#featNext');
    rail('#testiTrack', '#testiPrev', '#testiNext');

    /* scroll effects */
    const header = $('#header'), prog = $('#scrollProgress'), up = $('#upBtn');
    const links = U.$$('#mainNav a[href^="#"]');
    const sections = links.map((a) => document.getElementById(a.getAttribute('href').slice(1))).filter(Boolean);
    function onScroll() {
      const y = window.scrollY, max = document.documentElement.scrollHeight - window.innerHeight;
      header.classList.toggle('scrolled', y > 30);
      prog.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
      up.classList.toggle('show', y > 700);
      let cur = null;
      sections.forEach((sec) => { if (sec.getBoundingClientRect().top < window.innerHeight * 0.4) cur = sec.id; });
      links.forEach((a) => a.classList.toggle('active', a.getAttribute('href') === '#' + cur));
    }
    window.addEventListener('scroll', U.throttle(onScroll, 80), { passive: true });
    onScroll();
    up.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    /* deep link: #p=p019 opens a product */
    function hash() {
      const m = location.hash.match(/^#p=(.+)$/);
      if (m && DB.products.get(decodeURIComponent(m[1]))) global.VProduct.open(decodeURIComponent(m[1]));
    }
    hash();
    window.addEventListener('hashchange', hash);

    /* live sync: admin edits in another tab */
    let t = null;
    window.addEventListener('storage', (e) => {
      if (!e.key || e.key.indexOf('violet:') !== 0) return;
      clearTimeout(t);
      t = setTimeout(refresh, 250);
    });
    U.bus.on('data:imported', refresh);

    function refresh() {
      const st = DB.settings.get();
      global.VHero.render(st);
      global.VSections.all();
      global.VShop.refresh();
      global.VCart.render(); global.VCart.renderWish(); global.VCart.badges(); global.VCart.renderCompareBar();
    }

    /* loader */
    const done = () => { const l = $('#loader'); if (l) { l.classList.add('done'); setTimeout(() => l.remove(), 900); } document.body.classList.add('ready'); };
    if (document.readyState === 'complete') setTimeout(done, 350); else window.addEventListener('load', () => setTimeout(done, 350));
    setTimeout(done, 3500); // safety net if a font is slow
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
