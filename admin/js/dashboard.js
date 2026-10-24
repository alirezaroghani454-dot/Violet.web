/* ==========================================================
   Violet admin — dashboard.js
   Overview: key numbers, 14-day sales chart, best sellers,
   latest orders, low-stock alerts and the activity log
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;

  function card(icon, color, value, label, sub) {
    return '<div class="stat-card" style="--c:' + color + '"><span class="ico">' + VI(icon) + '</span><b>' + value + '</b><small>' + label + '</small>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>';
  }

  function chart(days) {
    const W = 760, H = 230, pad = { l: 8, r: 8, t: 16, b: 34 };
    const max = Math.max.apply(null, days.map((d) => d.revenue).concat(1));
    const bw = (W - pad.l - pad.r) / days.length;
    let svg = '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="نمودار فروش ۱۴ روز اخیر" preserveAspectRatio="none"><defs><linearGradient id="gBar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#b27bff"/><stop offset="1" stop-color="#7c3aed"/></linearGradient></defs>';
    for (let i = 0; i <= 3; i++) {
      const y = pad.t + (H - pad.t - pad.b) * i / 3;
      svg += '<line x1="0" x2="' + W + '" y1="' + y + '" y2="' + y + '" stroke-dasharray="3 5"/>';
    }
    days.forEach((d, i) => {
      const h = Math.max(d.revenue ? 4 : 2, (H - pad.t - pad.b) * d.revenue / max);
      const x = W - pad.r - (i + 1) * bw + bw * 0.18;       // RTL: newest on the right
      const y = H - pad.b - h;
      svg += '<rect class="bar" x="' + x.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + (bw * 0.64).toFixed(1) + '" height="' + h.toFixed(1) + '" rx="5"><title>' + U.dateShort(d.t) + ': ' + VA.price(d.revenue) + ' (' + U.toFa(d.count) + ' سفارش)</title></rect>';
      if (i % 2 === days.length % 2) svg += '<text x="' + (x + bw * 0.32).toFixed(1) + '" y="' + (H - 12) + '" text-anchor="middle">' + U.dateShort(d.t) + '</text>';
    });
    return svg + '</svg>';
  }

  /** demo orders so the dashboard has something to show */
  function seedDemoOrders() {
    const products = DB.products.active().filter((p) => p.stock > 3);
    const names = ['نیلوفر کاظمی', 'امیرحسین رضوی', 'سارا مهرابی', 'کامران آذر', 'مهسا احمدی', 'علیرضا نوری', 'یاسمن صادقی', 'پارسا کریمی'];
    const cities = ['تهران', 'اصفهان', 'شیراز', 'مشهد', 'تبریز', 'کرج', 'رشت'];
    const flow = ['paid', 'processing', 'shipped', 'delivered', 'delivered', 'delivered', 'pending', 'cancelled'];
    for (let i = 0; i < 14; i++) {
      const p1 = U.pick(products), p2 = Math.random() > 0.7 ? U.pick(products) : null;
      const items = [p1].concat(p2 && p2.id !== p1.id ? [p2] : []).map((p) => ({ productId: p.id, name: p.name, price: p.price, qty: 1, spec: p.spec }));
      const subtotal = items.reduce((n, x) => n + x.price * x.qty, 0);
      const s = DB.settings.get();
      const shipping = subtotal >= s.freeShippingOver ? 0 : s.shippingFee;
      const nm = U.pick(names);
      const o = DB.orders.create({
        customer: { name: nm, phone: '0912' + String(U.randInt(1000000, 9999999)), email: '', city: U.pick(cities), address: 'خیابان نمونه، کوچه‌ی شماره ' + U.toFa(U.randInt(1, 40)) + '، پلاک ' + U.toFa(U.randInt(1, 90)), postal: String(U.randInt(1000000000, 1999999999)), notes: '' },
        items: items, subtotal: subtotal, discount: 0, giftWrap: 0, shipping: shipping, tax: 0, total: subtotal + shipping,
        coupon: '', payMethod: U.pick(['online', 'card', 'cod']), status: 'pending'
      });
      const st = U.pick(flow);
      if (st !== 'pending') DB.orders.setStatus(o.id, st, 'نمونه');
      const all = DB.orders.all().find((x) => x.id === o.id);
      const back = U.randInt(0, 13) * 86400000 + U.randInt(0, 40000000);
      all.createdAt = Date.now() - back;
      all.history.forEach((h) => { h.at = all.createdAt + 3600000; });
      DB.orders.save(all);
    }
    DB.log('system', 'سفارش‌های نمونه ساخته شد');
  }

  VA.register('dashboard', {
    title: 'داشبورد', icon: 'dashboard', group: 'مدیریت',
    render(root) {
      const s = DB.stats();
      const orders = DB.orders.all().slice(0, 6);
      const low = DB.products.all().filter((p) => p.stock <= 3).sort((a, b) => a.stock - b.stock).slice(0, 7);
      const maxQty = s.top.length ? s.top[0].qty : 1;

      root.innerHTML =
        '<div class="grid c4">' +
        card('chart', '#8b3dff', VA.price(s.revenue), 'مجموع فروش', 'میانگین هر سفارش: ' + VA.price(s.avg)) +
        card('orders', '#4cc9ff', U.toFa(s.orders), 'کل سفارش‌ها', U.toFa(s.open) + ' سفارش در انتظار رسیدگی') +
        card('watch', '#e8c27a', U.toFa(s.products), 'تعداد محصولات', U.toFa(s.lowStock) + ' کم‌موجود · ' + U.toFa(s.outOfStock) + ' ناموجود') +
        card('layers', '#34d399', VA.price(s.stockValue), 'ارزش موجودی انبار', '') +
        '</div>' +
        '<div class="grid c4">' +
        card('message', '#ff5fa2', U.toFa(s.unreadMessages), 'پیام‌های خوانده‌نشده', '') +
        card('star', '#f59e0b', U.toFa(s.pendingReviews), 'نظرهای در انتظار تایید', '') +
        card('mail', '#a78bfa', U.toFa(s.subscribers), 'عضو خبرنامه', '') +
        card('tag', '#fb923c', U.toFa(DB.coupons.all().filter((c) => c.active).length), 'کد تخفیف فعال', '') +
        '</div>' +

        '<div class="grid side-l">' +
        '<div class="card"><div class="card-head"><h3>فروش ۱۴ روز اخیر</h3>' + (s.orders ? '' : '<button class="btn btn-sm btn-primary" id="seedOrders">ساخت سفارش‌های نمونه</button>') + '</div>' + chart(s.days) + '</div>' +
        '<div class="card"><h3>پرفروش‌ترین‌ها</h3>' + (s.top.length ? '<div class="rank">' + s.top.map((t) =>
          '<div class="rank-row"><span class="thumb">' + global.VioletWatch.svg(t.product.spec, { viewBox: '60 150 280 330' }) + '</span><div><b>' + U.esc(t.product.name) + '</b><div class="bar-track"><i style="width:' + (t.qty / maxQty * 100) + '%"></i></div></div><small>' + U.toFa(t.qty) + ' عدد</small></div>').join('') + '</div>'
          : '<p class="muted">هنوز فروشی ثبت نشده است.</p>') + '</div>' +
        '</div>' +

        '<div class="grid side-l">' +
        '<div class="card"><div class="card-head"><h3>آخرین سفارش‌ها</h3><a class="btn btn-sm" href="#/orders">همه‌ی سفارش‌ها</a></div>' +
        (orders.length ? '<div class="tbl-wrap" style="border:0"><table class="tbl"><thead><tr><th>کد</th><th>مشتری</th><th>مبلغ</th><th>وضعیت</th><th>تاریخ</th></tr></thead><tbody>' +
          orders.map((o) => '<tr><td class="num latin"><b>' + U.esc(o.code) + '</b></td><td>' + U.esc(o.customer.name) + '</td><td class="num">' + VA.price(o.total) + '</td><td>' + VA.statusTag(o.status) + '</td><td class="num">' + U.timeAgo(o.createdAt) + '</td></tr>').join('') + '</tbody></table></div>'
          : '<p class="muted">هنوز سفارشی ثبت نشده است.</p>') + '</div>' +

        '<div class="card"><h3>هشدار موجودی</h3>' + (low.length ? '<div class="stack">' + low.map((p) =>
          '<div class="rank-row" style="grid-template-columns:40px 1fr auto"><span class="thumb">' + global.VioletWatch.svg(p.spec, { viewBox: '60 150 280 330' }) + '</span><div><b>' + U.esc(p.name) + '</b><small>' + U.esc(VA.colName(p.collection)) + '</small></div>' + VA.tag(p.stock <= 0 ? 'ناموجود' : U.toFa(p.stock) + ' عدد', p.stock <= 0 ? 'var(--danger)' : 'var(--warn)') + '</div>').join('') + '</div>'
          : '<p class="muted">همه‌ی محصولات موجودی کافی دارند.</p>') + '</div>' +
        '</div>' +

        '<div class="card"><div class="card-head"><h3>رویدادهای اخیر</h3></div>' + (DB.logs().length
          ? '<div class="log">' + DB.logs().slice(0, 14).map((l) => '<div><time>' + U.timeAgo(l.at) + '</time><span>' + U.esc(l.msg) + '</span></div>').join('') + '</div>'
          : '<p class="muted">هنوز رویدادی ثبت نشده است.</p>') + '</div>';

      const seed = $('#seedOrders', root);
      if (seed) seed.onclick = () => { seedDemoOrders(); VA.toast('۱۴ سفارش نمونه ساخته شد.'); VA.rerender(); };
    }
  });
})(window);
