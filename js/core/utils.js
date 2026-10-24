/* ==========================================================
   Violet — utils.js
   Small helpers shared by the storefront and the admin panel
   ========================================================== */
(function (global) {
  'use strict';

  const faDigits = '۰۱۲۳۴۵۶۷۸۹';

  const U = {
    /* ---------- DOM ---------- */
    $(sel, root) { return (root || document).querySelector(sel); },
    $$(sel, root) { return Array.from((root || document).querySelectorAll(sel)); },

    el(tag, attrs, html) {
      const node = document.createElement(tag);
      if (attrs) {
        Object.keys(attrs).forEach((k) => {
          if (k === 'class') node.className = attrs[k];
          else if (k === 'dataset') Object.assign(node.dataset, attrs[k]);
          else if (k.startsWith('on') && typeof attrs[k] === 'function') node.addEventListener(k.slice(2), attrs[k]);
          else node.setAttribute(k, attrs[k]);
        });
      }
      if (html !== undefined) node.innerHTML = html;
      return node;
    },

    esc(str) {
      return String(str === undefined || str === null ? '' : str)
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    },

    /* ---------- Numbers & text ---------- */
    toFa(n) {
      return String(n).replace(/\d/g, (d) => faDigits[d]);
    },

    toEn(str) {
      return String(str)
        .replace(/[۰-۹]/g, (d) => faDigits.indexOf(d))
        .replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
    },

    /** 12500000 -> "۱۲٬۵۰۰٬۰۰۰" */
    num(n) {
      n = Math.round(Number(n) || 0);
      return n.toLocaleString('fa-IR');
    },

    /** price with currency label */
    price(n, currency) {
      return U.num(n) + ' ' + (currency || 'تومان');
    },

    /** Compact numbers: 1.2 میلیون */
    compact(n) {
      n = Number(n) || 0;
      if (n >= 1e9) return U.toFa((n / 1e9).toFixed(1).replace('.0', '')) + ' میلیارد';
      if (n >= 1e6) return U.toFa((n / 1e6).toFixed(1).replace('.0', '')) + ' میلیون';
      if (n >= 1e3) return U.toFa((n / 1e3).toFixed(1).replace('.0', '')) + ' هزار';
      return U.toFa(Math.round(n));
    },

    clamp(v, min, max) { return Math.min(max, Math.max(min, v)); },
    lerp(a, b, t) { return a + (b - a) * t; },
    rand(min, max) { return Math.random() * (max - min) + min; },
    randInt(min, max) { return Math.floor(U.rand(min, max + 1)); },
    pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },

    /** Deterministic pseudo random generator (mulberry32) */
    rng(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0; a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },

    slugify(str) {
      return String(str).trim().toLowerCase()
        .replace(/[\s_]+/g, '-')
        .replace(/[^a-z0-9؀-ۿ-]/g, '')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    },

    uid(prefix) {
      return (prefix || 'id') + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    },

    /** simple 53-bit string hash (not cryptographic — demo-level protection only) */
    hash(str, seed) {
      let h1 = 0xdeadbeef ^ (seed || 0), h2 = 0x41c6ce57 ^ (seed || 0);
      for (let i = 0, ch; i < str.length; i++) {
        ch = str.charCodeAt(i);
        h1 = Math.imul(h1 ^ ch, 2654435761);
        h2 = Math.imul(h2 ^ ch, 1597334677);
      }
      h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
      h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
      return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
    },

    /* ---------- Dates (Jalali via Intl) ---------- */
    date(ts, withTime) {
      const d = new Date(ts);
      const opts = { year: 'numeric', month: 'long', day: 'numeric' };
      if (withTime) { opts.hour = '2-digit'; opts.minute = '2-digit'; }
      try {
        return new Intl.DateTimeFormat('fa-IR-u-ca-persian', opts).format(d);
      } catch (e) {
        return d.toLocaleDateString('fa-IR');
      }
    },

    dateShort(ts) {
      try {
        return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { month: 'short', day: 'numeric' }).format(new Date(ts));
      } catch (e) { return new Date(ts).toLocaleDateString('fa-IR'); }
    },

    timeAgo(ts) {
      const s = Math.floor((Date.now() - ts) / 1000);
      if (s < 60) return 'همین الان';
      if (s < 3600) return U.toFa(Math.floor(s / 60)) + ' دقیقه پیش';
      if (s < 86400) return U.toFa(Math.floor(s / 3600)) + ' ساعت پیش';
      if (s < 2592000) return U.toFa(Math.floor(s / 86400)) + ' روز پیش';
      return U.date(ts);
    },

    /* ---------- Function helpers ---------- */
    debounce(fn, wait) {
      let t;
      return function () {
        const args = arguments, ctx = this;
        clearTimeout(t);
        t = setTimeout(() => fn.apply(ctx, args), wait || 200);
      };
    },

    throttle(fn, wait) {
      let last = 0, timer = null;
      return function () {
        const now = Date.now(), args = arguments, ctx = this;
        if (now - last >= wait) { last = now; fn.apply(ctx, args); }
        else if (!timer) {
          timer = setTimeout(() => { last = Date.now(); timer = null; fn.apply(ctx, args); }, wait - (now - last));
        }
      };
    },

    raf(fn) { return requestAnimationFrame(fn); },

    /* ---------- Environment ---------- */
    isTouch() {
      return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    },
    prefersReducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    /* ---------- Files ---------- */
    download(filename, content, mime) {
      const blob = new Blob([content], { type: mime || 'application/octet-stream' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = filename;
      document.body.appendChild(a); a.click();
      setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 500);
    },

    csv(rows) {
      const q = (v) => '"' + String(v === undefined || v === null ? '' : v).replace(/"/g, '""') + '"';
      return '﻿' + rows.map((r) => r.map(q).join(',')).join('\n');
    },

    readFileAsDataURL(file) {
      return new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result);
        r.onerror = reject;
        r.readAsDataURL(file);
      });
    },

    /** Shrinks an uploaded image to keep localStorage usage low */
    resizeImage(file, maxSize, quality) {
      maxSize = maxSize || 900; quality = quality || 0.82;
      return U.readFileAsDataURL(file).then((src) => new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          const ratio = Math.min(1, maxSize / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * ratio);
          c.height = Math.round(img.height * ratio);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', quality));
        };
        img.onerror = () => resolve(src);
        img.src = src;
      }));
    },

    /* ---------- Validation ---------- */
    isPhone(v) { return /^09\d{9}$/.test(U.toEn(v).replace(/\s|-/g, '')); },
    isEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); },
    isPostal(v) { return /^\d{10}$/.test(U.toEn(v).replace(/\s|-/g, '')); },

    /* ---------- Tiny event bus ---------- */
    bus: (function () {
      const map = {};
      return {
        on(evt, fn) { (map[evt] = map[evt] || []).push(fn); },
        off(evt, fn) { map[evt] = (map[evt] || []).filter((f) => f !== fn); },
        emit(evt, data) { (map[evt] || []).slice().forEach((fn) => { try { fn(data); } catch (e) { console.error(e); } }); }
      };
    })()
  };

  global.VU = U;
})(window);
