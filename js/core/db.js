/* ==========================================================
   Violet — db.js   (global: VioletDB)
   Data layer on top of localStorage, shared by the storefront
   and the admin panel — every change in the admin panel shows
   up on the website immediately.

   Connecting a real backend later: replace read() / write()
   below with fetch() calls; the rest of the code only talks to
   the VioletDB API.
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU;
  const PREFIX = 'violet:';
  const VERSION = 5;               // bump to re-seed products/settings after big changes
  const memory = {};               // fallback when localStorage is blocked

  /* ---------- storage primitives ---------- */
  const VISITOR_KEYS = ['cart', 'cartCoupon', 'cartGift', 'wishlist', 'compare', 'profile', 'recent', 'myOrders'];
  const K = (key) => (VISITOR_KEYS.indexOf(key) >= 0 ? 'v.' + key : key);
  function read(key, fallback) {
    key = K(key);
    try {
      const raw = localStorage.getItem(PREFIX + key);
      if (raw === null) return key in memory ? memory[key] : fallback;
      return JSON.parse(raw);
    } catch (e) { return key in memory ? memory[key] : fallback; }
  }
  function write(key, value) {
    key = K(key);
    memory[key] = value;
    try { localStorage.setItem(PREFIX + key, JSON.stringify(value)); return true; }
    catch (e) { console.warn('Violet: storage full or blocked', e); U.bus.emit('storage:error', e); return false; }
  }
  function clone(v) { return JSON.parse(JSON.stringify(v)); }

  /* ---------- order statuses ---------- */
  const STATUS = {
    pending:    { label: 'در انتظار پرداخت', color: '#f5b942' },
    paid:       { label: 'پرداخت‌شده', color: '#4cc9ff' },
    processing: { label: 'در حال آماده‌سازی', color: '#a78bfa' },
    shipped:    { label: 'ارسال‌شده', color: '#c084fc' },
    delivered:  { label: 'تحویل‌شده', color: '#34d399' },
    cancelled:  { label: 'لغوشده', color: '#f87171' },
    returned:   { label: 'مرجوعی', color: '#fb923c' }
  };

  const STATUS_KEYS = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];

  /* ---------- generic table helper ---------- */
  function table(key, evt) {
    return {
      all() { return read(key, []); },
      get(id) { return read(key, []).find((x) => x.id === id); },
      save(item) {
        const list = read(key, []);
        if (!item.id) item.id = U.uid(key.slice(0, 2));
        const i = list.findIndex((x) => x.id === item.id);
        if (i >= 0) list[i] = item; else list.unshift(item);
        write(key, list); U.bus.emit(evt || (key + ':change'), list);
        return item;
      },
      saveAll(list) { write(key, list); U.bus.emit(evt || (key + ':change'), list); },
      remove(id) {
        const list = read(key, []).filter((x) => x.id !== id);
        write(key, list); U.bus.emit(evt || (key + ':change'), list);
      }
    };
  }

  const DB = {
    VERSION: VERSION,
    STATUS: STATUS,
    STATUS_KEYS: STATUS_KEYS,
    read: read,
    write: write,

    /* ================= bootstrap ================= */
    init() {
      if (read('version', 0) !== VERSION) DB.reset(true);
      // merge any new default settings keys into saved settings
      const saved = read('settings', null);
      write('settings', saved ? merge(global.VioletDefaults.settings(), saved) : global.VioletDefaults.settings());
      const s = read('settings');
      if (s.deal && s.deal.endsAt && s.deal.endsAt < Date.now()) { s.deal.endsAt = Date.now() + 3 * 86400000; write('settings', s); }
      if (!read('admin', null)) write('admin', { user: 'admin', pass: U.hash('admin123'), changed: false });
    },

    /** re-seed catalog + settings (orders, messages, subscribers are kept when keep=true) */
    reset(keep) {
      const keepKeys = keep ? { orders: read('orders', []), messages: read('messages', []), subscribers: read('subscribers', []), logs: read('logs', []), admin: read('admin', null) } : {};
      write('settings', global.VioletDefaults.settings());
      write('collections', global.VioletDefaults.collections());
      write('coupons', global.VioletDefaults.coupons());
      write('products', global.VioletProducts.build());
      write('reviews', seedReviews());
      write('orders', keepKeys.orders || []);
      write('messages', keepKeys.messages || []);
      write('subscribers', keepKeys.subscribers || []);
      write('logs', keepKeys.logs || []);
      if (keepKeys.admin) write('admin', keepKeys.admin);
      write('version', VERSION);
    },

    /* ================= settings ================= */
    settings: {
      get() { return read('settings', global.VioletDefaults.settings()); },
      save(patch) { const s = merge(DB.settings.get(), patch); write('settings', s); U.bus.emit('settings:change', s); return s; },
      replace(s) { write('settings', s); U.bus.emit('settings:change', s); return s; }
    },

    /* ================= products ================= */
    products: Object.assign(table('products'), {
      /** visible products only (storefront) */
      active() { return read('products', []).filter((p) => p.active !== false); },
      related(p, n) {
        const list = DB.products.active().filter((x) => x.id !== p.id);
        const score = (x) => (x.collection === p.collection ? 4 : 0) + (x.gender === p.gender ? 2 : 0) + (1 - Math.min(1, Math.abs(x.price - p.price) / Math.max(p.price, 1)));
        return list.sort((a, b) => score(b) - score(a)).slice(0, n || 8);
      },
      /** patch is an object or a function(product) -> object */
      bulk(ids, patch) {
        const list = read('products', []);
        list.forEach((p) => { if (ids.indexOf(p.id) >= 0) Object.assign(p, typeof patch === 'function' ? patch(p) : patch); });
        write('products', list); U.bus.emit('products:change', list);
      },
      nextSku() {
        let max = 100;
        read('products', []).forEach((p) => { const m = String(p.sku || '').match(/(\d+)$/); if (m) max = Math.max(max, Number(m[1])); });
        return 'VL-NEW-' + (max + 1);
      },
      adjustStock(id, delta) {
        const list = read('products', []);
        const p = list.find((x) => x.id === id);
        if (!p) return;
        p.stock = Math.max(0, (p.stock || 0) + delta);
        if (delta < 0) p.sold = (p.sold || 0) - delta;
        write('products', list); U.bus.emit('products:change', list);
      },
      recalcRating(id) {
        const list = read('products', []), p = list.find((x) => x.id === id);
        if (!p) return;
        const rs = DB.reviews.forProduct(id, true);
        if (rs.length) {
          p.rating = Math.round(rs.reduce((n, r) => n + r.rating, 0) / rs.length * 10) / 10;
          p.reviewsCount = Math.max(p.reviewsCount || 0, rs.length);
          write('products', list);
        }
      }
    }),

    /* ================= collections ================= */
    collections: Object.assign(table('collections'), {
      sorted() { return read('collections', []).slice().sort((a, b) => (a.order || 0) - (b.order || 0)); },
      replace(list) { write('collections', list); U.bus.emit('collections:change', list); }
    }),

    /* ================= coupons ================= */
    coupons: Object.assign(table('coupons'), {
      /** -> { ok, amount, coupon, msg } */
      check(code, subtotal) {
        code = String(code || '').trim().toUpperCase();
        const c = read('coupons', []).find((x) => x.code === code);
        if (!c) return { ok: false, msg: 'این کد تخفیف وجود ندارد.' };
        if (!c.active) return { ok: false, msg: 'این کد تخفیف غیرفعال است.' };
        if (c.expires && c.expires < Date.now()) return { ok: false, msg: 'مهلت استفاده از این کد تمام شده است.' };
        if (c.usageLimit && c.used >= c.usageLimit) return { ok: false, msg: 'ظرفیت استفاده از این کد پر شده است.' };
        if (c.minOrder && subtotal < c.minOrder) return { ok: false, msg: 'حداقل خرید برای این کد ' + U.num(c.minOrder) + ' ' + DB.settings.get().currency + ' است.' };
        let amount = c.type === 'percent' ? Math.round(subtotal * c.value / 100) : c.value;
        if (c.maxDiscount && amount > c.maxDiscount) amount = c.maxDiscount;
        amount = Math.min(amount, subtotal);
        return { ok: true, amount: amount, coupon: c, msg: 'کد تخفیف اعمال شد.' };
      },
      markUsed(code) {
        const list = read('coupons', []);
        const c = list.find((x) => x.code === String(code).toUpperCase());
        if (c) { c.used = (c.used || 0) + 1; write('coupons', list); }
      }
    }),

    /* ================= visitor (per browser) ================= */
    visitor: {
      cart() { return read('cart', []); },
      saveCart(v) { write('cart', v); U.bus.emit('cart:change', v); },
      wishlist() { return read('wishlist', []); },
      saveWishlist(v) { write('wishlist', v); U.bus.emit('wishlist:change', v); },
      compare() { return read('compare', []); },
      saveCompare(v) { write('compare', v); U.bus.emit('compare:change', v); },
      profile() { return read('profile', {}); },
      saveProfile(v) { write('profile', v); },
      recent() { return read('recent', []); },
      pushRecent(id) { const r = read('recent', []).filter((x) => x !== id); r.unshift(id); write('recent', r.slice(0, 12)); },
      myOrders() { return read('myOrders', []); },
      addMyOrder(code) { const l = read('myOrders', []).filter((c) => c !== code); l.unshift(code); write('myOrders', l.slice(0, 12)); }
    },

    /* ================= orders ================= */
    orders: Object.assign(table('orders'), {
      all() { return read('orders', []).slice().sort((a, b) => b.createdAt - a.createdAt); },
      statusInfo(st) { return STATUS[st] || { label: st, color: '#999' }; },

      create(data) {
        const s = DB.settings.get();
        const list = read('orders', []);
        const order = {
          id: U.uid('o'),
          code: (s.orderPrefix || 'VL') + '-' + (100100 + list.length + 1),
          createdAt: Date.now(),
          status: data.status || 'pending',
          customer: data.customer,
          items: data.items,
          subtotal: data.subtotal, discount: data.discount || 0, giftWrap: data.giftWrap || 0,
          shipping: data.shipping || 0, tax: data.tax || 0, total: data.total,
          coupon: data.coupon || '',
          payMethod: data.payMethod,
          trackingNumber: '',
          adminNote: '',
          history: [{ status: data.status || 'pending', at: Date.now(), note: 'سفارش ثبت شد' }]
        };
        list.push(order);
        write('orders', list);
        order.items.forEach((i) => DB.products.adjustStock(i.productId, -i.qty));
        if (order.coupon) DB.coupons.markUsed(order.coupon);
        DB.log('order', 'سفارش جدید ' + order.code + ' به مبلغ ' + U.num(order.total) + ' ثبت شد');
        U.bus.emit('orders:change', list);
        return order;
      },

      setStatus(id, status, note) {
        const list = read('orders', []);
        const o = list.find((x) => x.id === id);
        if (!o) return;
        const wasActive = o.status !== 'cancelled' && o.status !== 'returned';
        o.status = status;
        o.history = o.history || [];
        o.history.push({ status: status, at: Date.now(), note: note || '' });
        if (wasActive && (status === 'cancelled' || status === 'returned')) {
          o.items.forEach((i) => DB.products.adjustStock(i.productId, i.qty));
        }
        write('orders', list);
        DB.log('order', 'وضعیت سفارش ' + o.code + ' به «' + DB.orders.statusInfo(status).label + '» تغییر کرد');
        U.bus.emit('orders:change', list);
      },

      findByTracking(code, phone) {
        code = String(code || '').trim().toUpperCase();
        const ph = U.toEn(String(phone || '')).replace(/\D/g, '').slice(-10);
        if (!code) return null;
        return read('orders', []).find((o) => o.code.toUpperCase() === code && (!ph || String(o.customer.phone).replace(/\D/g, '').slice(-10) === ph)) || null;
      }
    }),

    /* ================= reviews ================= */
    reviews: Object.assign(table('reviews'), {
      forProduct(productId, approvedOnly) {
        return read('reviews', []).filter((r) => r.productId === productId && (!approvedOnly || r.approved));
      },
      add(r) {
        const list = read('reviews', []);
        r.id = U.uid('r'); r.createdAt = Date.now(); r.approved = false;
        list.push(r); write('reviews', list); U.bus.emit('reviews:change', list);
        return r;
      }
    }),

    subscribers: table('subscribers'),
    messages: table('messages'),

    /* ================= activity log ================= */
    log(type, msg) {
      const l = read('logs', []);
      l.unshift({ id: U.uid('l'), type: type, msg: msg, at: Date.now() });
      write('logs', l.slice(0, 80));
    },
    logs() { return read('logs', []); },

    /* ================= admin auth ================= */
    auth: {
      verify(pass) { const a = read('admin', null); return !!a && a.pass === U.hash(pass); },
      login(user, pass) {
        const a = read('admin', null);
        if (a && a.user === String(user).trim() && a.pass === U.hash(pass)) {
          try { sessionStorage.setItem('violet:admin', '1'); } catch (e) { memory._adm = true; }
          return true;
        }
        return false;
      },
      isLoggedIn() { try { return sessionStorage.getItem('violet:admin') === '1'; } catch (e) { return !!memory._adm; } },
      logout() { try { sessionStorage.removeItem('violet:admin'); } catch (e) { /* ignore */ } delete memory._adm; },
      info() { const a = read('admin', {}); return { user: a.user, changed: !!a.changed }; },
      change(user, pass) { write('admin', { user: String(user).trim(), pass: U.hash(pass), changed: true }); }
    },

    /* ================= statistics (admin dashboard) ================= */
    stats() {
      const orders = read('orders', []);
      const valid = orders.filter((o) => o.status !== 'cancelled' && o.status !== 'returned');
      const products = read('products', []);
      const revenue = valid.reduce((n, o) => n + o.total, 0);
      const day = 86400000, days = [];
      for (let i = 13; i >= 0; i--) {
        const d = new Date(); d.setHours(0, 0, 0, 0);
        const t0 = d.getTime() - i * day;
        const set = valid.filter((o) => o.createdAt >= t0 && o.createdAt < t0 + day);
        days.push({ t: t0, revenue: set.reduce((n, o) => n + o.total, 0), count: set.length });
      }
      const sold = {};
      valid.forEach((o) => o.items.forEach((i) => { sold[i.productId] = (sold[i.productId] || 0) + i.qty; }));
      const top = Object.keys(sold).map((id) => ({ product: DB.products.get(id), qty: sold[id] })).filter((x) => x.product).sort((a, b) => b.qty - a.qty).slice(0, 5);
      return {
        orders: orders.length,
        open: orders.filter((o) => ['pending', 'paid', 'processing'].indexOf(o.status) >= 0).length,
        revenue: revenue,
        avg: valid.length ? Math.round(revenue / valid.length) : 0,
        products: products.length,
        lowStock: products.filter((p) => p.stock > 0 && p.stock <= 3).length,
        outOfStock: products.filter((p) => p.stock <= 0).length,
        stockValue: products.reduce((n, p) => n + p.price * p.stock, 0),
        unreadMessages: read('messages', []).filter((m) => !m.read).length,
        pendingReviews: read('reviews', []).filter((r) => !r.approved).length,
        subscribers: read('subscribers', []).length,
        days: days, top: top
      };
    },

    /* ================= backup ================= */
    exportAll() {
      const data = { app: 'violet', version: VERSION, exportedAt: Date.now() };
      ['settings', 'products', 'collections', 'coupons', 'orders', 'reviews', 'messages', 'subscribers'].forEach((k) => { data[k] = read(k, null); });
      return JSON.stringify(data, null, 2);
    },
    importAll(json) {
      const data = typeof json === 'string' ? JSON.parse(json) : json;
      if (!data || data.app !== 'violet') throw new Error('فایل پشتیبان معتبر نیست.');
      ['settings', 'products', 'collections', 'coupons', 'orders', 'reviews', 'messages', 'subscribers'].forEach((k) => { if (data[k] != null) write(k, data[k]); });
      write('version', VERSION);
      U.bus.emit('data:imported');
    }
  };

  /* ---------- helpers ---------- */
  function merge(def, saved) {
    if (Array.isArray(def) || typeof def !== 'object' || def === null) return saved === undefined ? def : saved;
    const out = Object.assign({}, def);
    Object.keys(saved || {}).forEach((k) => {
      const d = def[k], v = saved[k];
      out[k] = (d && typeof d === 'object' && !Array.isArray(d) && v && typeof v === 'object' && !Array.isArray(v)) ? merge(d, v) : v;
    });
    return out;
  }

  function seedReviews() {
    const names = ['نیلوفر', 'امیر', 'سارا', 'کامران', 'مهسا', 'علیرضا', 'یاسمن', 'پارسا', 'الهام', 'بهراد'];
    const texts = [
      'کیفیت ساخت عالی و بسته‌بندی فوق‌العاده. دقیقاً مثل عکس بود.',
      'وزن و حس روی مچ خیلی خوبه. بعد از دو هفته هنوز دقیق کار می‌کنه.',
      'رنگ صفحه از نزدیک خیلی زیباتر از عکسه، پیشنهاد می‌کنم.',
      'ارسال سریع بود و کارت اصالت و گارانتی کامل داشت.',
      'قیمت نسبت به کیفیت منصفانه است. حتماً دوباره از ویولت خرید می‌کنم.',
      'هدیه گرفتم و خیلی خوشحال شدم. بند بسیار راحت و نرمه.'
    ];
    const out = [];
    global.VioletProducts.build().forEach((p, i) => {
      if (i % 3 !== 0) return;
      for (let k = 0; k < 2; k++) {
        out.push({ id: 'r' + i + '_' + k, productId: p.id, name: names[(i + k * 3) % names.length], rating: (i + k) % 5 === 0 ? 4 : 5, text: texts[(i + k * 2) % texts.length], createdAt: Date.now() - ((i + k * 5) % 50 + 1) * 86400000, approved: true });
      }
    });
    return out;
  }

  global.VioletDB = DB;
})(window);
