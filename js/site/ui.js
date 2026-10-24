/* ==========================================================
   Violet — site/ui.js
   Shared UI helpers: toasts, layers (drawers / modals), theme,
   3D tilt, scroll reveal, counters, custom cursor
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU;
  const $ = U.$;

  /* map data-close / data-open names to element ids */
  const LAYERS = {
    cart: 'cartDrawer', wish: 'wishDrawer', product: 'productModal', checkout: 'checkoutModal',
    track: 'trackModal', compare: 'compareModal', search: 'searchOv', nav: 'mainNav', filters: 'filters'
  };
  const stack = [];
  let lastFocus = null;

  function lockScroll(on) {
    document.body.classList.toggle('no-scroll', on);
  }

  const UI = {

    /* ---------- toasts ---------- */
    toast(msg, type, ms) {
      const box = $('#toasts');
      if (!box) return;
      const icon = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check';
      const t = U.el('div', { class: 'toast ' + (type || 'success'), role: 'status' },
        '<span class="ti">' + global.VI(icon) + '</span><span>' + U.esc(msg) + '</span>');
      box.appendChild(t);
      while (box.children.length > 3) box.firstChild.remove();
      setTimeout(() => {
        t.classList.add('out');
        setTimeout(() => t.remove(), 380);
      }, ms || 3200);
    },

    /* ---------- layers ---------- */
    open(name) {
      const id = LAYERS[name] || name;
      const el = document.getElementById(id);
      if (!el) return;
      if (stack.indexOf(id) >= 0) return;
      lastFocus = document.activeElement;
      el.classList.add('show');
      if (name === 'nav') el.classList.add('open');
      if (name === 'filters') el.classList.add('open');
      el.setAttribute('aria-hidden', 'false');
      const needsOverlay = el.classList.contains('drawer');
      if (needsOverlay) $('#overlay').classList.add('show');
      if (name === 'nav') $('#navOverlay').classList.add('show');
      if (name === 'filters') $('#navOverlay').classList.add('show');
      stack.push(id);
      lockScroll(true);
      setTimeout(() => {
        const f = el.querySelector('input:not([type=hidden]), button.btn-primary, .modal-close, button');
        if (f && name === 'search') f.focus();
      }, 120);
      U.bus.emit('layer:open', name);
    },

    close(name) {
      const id = LAYERS[name] || name;
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('show', 'open');
      el.setAttribute('aria-hidden', 'true');
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      const drawerOpen = stack.some((x) => document.getElementById(x).classList.contains('drawer'));
      if (!drawerOpen) $('#overlay').classList.remove('show');
      if (!stack.some((x) => x === 'mainNav' || x === 'filters')) $('#navOverlay').classList.remove('show');
      if (!stack.length) {
        lockScroll(false);
        if (lastFocus && lastFocus.focus) { try { lastFocus.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
      }
      U.bus.emit('layer:close', name);
    },

    closeTop() {
      if (!stack.length) return false;
      const id = stack[stack.length - 1];
      const name = Object.keys(LAYERS).find((k) => LAYERS[k] === id) || id;
      UI.close(name);
      return true;
    },

    closeAll() { stack.slice().forEach((id) => { const n = Object.keys(LAYERS).find((k) => LAYERS[k] === id) || id; UI.close(n); }); },
    isOpen(name) { return stack.indexOf(LAYERS[name] || name) >= 0; },

    /* ---------- theme ---------- */
    setTheme(theme) {
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('violet_theme', theme); } catch (e) { /* ignore */ }
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', theme === 'light' ? '#f8f5ff' : '#0a0617');
      const b = $('#themeBtn');
      if (b) b.innerHTML = global.VI(theme === 'light' ? 'moon' : 'sun');
    },
    toggleTheme() {
      UI.setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light');
    },
    getSavedTheme() {
      try { return localStorage.getItem('violet_theme'); } catch (e) { return null; }
    },

    /* ---------- brand colours from settings ---------- */
    applyBrand(s) {
      const r = document.documentElement.style;
      if (s.colorPrimary) {
        r.setProperty('--primary', s.colorPrimary);
        r.setProperty('--primary-2', lighten(s.colorPrimary, 52));
      }
      if (s.colorAccent) r.setProperty('--accent', s.colorAccent);
      if (s.colorHot) r.setProperty('--hot', s.colorHot);
      r.setProperty('--grad', 'linear-gradient(135deg,' + darken(s.colorPrimary || '#8b3dff', 18) + ' 0%,' + (s.colorPrimary || '#8b3dff') + ' 40%,' + (s.colorHot || '#ff5fa2') + ' 100%)');
    },

    /* ---------- 3D tilt ---------- */
    tilt(el, opts) {
      if (!el || el.__tilt) return;
      el.__tilt = true;
      opts = opts || {};
      const max = opts.max || 10;
      const target = opts.target || el;
      const scale = opts.scale || 1;
      let raf = null;

      function move(e) {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        if (raf) cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          const rx = (0.5 - y) * max * 2, ry = (x - 0.5) * max * 2;
          target.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) scale(' + scale + ')';
          el.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
          el.style.setProperty('--my', (y * 100).toFixed(1) + '%');
        });
      }
      function leave() {
        if (raf) cancelAnimationFrame(raf);
        target.style.transform = '';
      }
      el.addEventListener('pointermove', (e) => { if (e.pointerType === 'mouse') move(e); });
      el.addEventListener('pointerleave', leave);
    },

    /* ---------- scroll reveal ---------- */
    reveal(root) {
      const items = U.$$('.reveal:not(.in)', root);
      if (!('IntersectionObserver' in window) || U.prefersReducedMotion()) {
        items.forEach((i) => i.classList.add('in'));
        return;
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
        });
      }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
      items.forEach((i, idx) => { i.style.setProperty('--d', Math.min(idx % 4, 3) * 0.07 + 's'); io.observe(i); });
    },

    /* ---------- number counter ---------- */
    count(el, to, ms) {
      if (!el) return;
      if (U.prefersReducedMotion()) { el.textContent = U.num(to); return; }
      const start = performance.now();
      ms = ms || 1600;
      function step(t) {
        const p = Math.min(1, (t - start) / ms);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = U.num(Math.round(to * eased));
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    },

    /* ---------- custom cursor (fine pointer only) ---------- */
    cursor() {
      if (U.isTouch() || !window.matchMedia('(pointer:fine)').matches || U.prefersReducedMotion()) return;
      const dot = $('#cursorDot'), ring = $('#cursorRing');
      if (!dot || !ring) return;
      let x = 0, y = 0, rx = 0, ry = 0;
      document.body.classList.add('has-cursor');
      window.addEventListener('pointermove', (e) => {
        x = e.clientX; y = e.clientY;
        dot.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      }, { passive: true });
      (function loop() {
        rx += (x - rx) * 0.18; ry += (y - ry) * 0.18;
        ring.style.transform = 'translate(' + rx.toFixed(1) + 'px,' + ry.toFixed(1) + 'px)';
        requestAnimationFrame(loop);
      })();
      document.addEventListener('pointerover', (e) => {
        const hit = e.target.closest && e.target.closest('a,button,.p-card,.col-card,.chip,input,select,textarea,label,.swatch');
        document.body.classList.toggle('cursor-hover', !!hit);
      });
    }
  };

  /* colour helpers */
  function hexToRgb(h) {
    h = String(h || '#8b3dff').replace('#', '');
    if (h.length === 3) h = h.split('').map((c) => c + c).join('');
    const n = parseInt(h, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(r, g, b) { return '#' + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  function lighten(h, amt) { const c = hexToRgb(h); return toHex(c[0] + amt, c[1] + amt, c[2] + amt); }
  function darken(h, amt) { const c = hexToRgb(h); return toHex(c[0] - amt, c[1] - amt, c[2] - amt); }

  /* global delegation for data-close / data-open */
  document.addEventListener('click', (e) => {
    const c = e.target.closest('[data-close]');
    if (c) { e.preventDefault(); UI.close(c.getAttribute('data-close')); return; }
    const o = e.target.closest('[data-open]');
    if (o) { e.preventDefault(); UI.closeAll(); UI.open(o.getAttribute('data-open')); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') UI.closeTop();
  });
  const ov = document.getElementById('overlay');
  if (ov) ov.addEventListener('click', () => { UI.closeTop(); });
  const nov = document.getElementById('navOverlay');
  if (nov) nov.addEventListener('click', () => { UI.close('nav'); UI.close('filters'); });

  global.VUI = UI;
})(window);
