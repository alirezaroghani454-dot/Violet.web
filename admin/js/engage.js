/* ==========================================================
   Violet admin — engage.js
   Customer interaction: product reviews (moderation),
   contact-form messages and newsletter subscribers
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;

  /* ========================= reviews ========================= */
  let rvFilter = 'pending';

  function approve(r, on) {
    const p = DB.products.get(r.productId);
    r.approved = on;
    // a newly approved review nudges the product's average rating (once)
    if (on && !r.counted && p) {
      const n = p.reviewsCount || 0;
      p.rating = Math.round(((p.rating || 0) * n + r.rating) / (n + 1) * 10) / 10;
      p.reviewsCount = n + 1;
      DB.products.save(p);
      r.counted = true;
    }
    DB.reviews.save(r);
  }

  function renderReviews(root) {
    const all = DB.reviews.all().slice().sort((a, b) => b.createdAt - a.createdAt);
    const pending = all.filter((r) => !r.approved).length;
    const list = all.filter((r) => rvFilter === 'all' || (rvFilter === 'pending' ? !r.approved : r.approved));
    root.innerHTML =
      '<div class="toolbar" id="rvTabs"><button class="chip' + (rvFilter === 'pending' ? ' active' : '') + '" data-f="pending">در انتظار تایید (' + U.toFa(pending) + ')</button><button class="chip' + (rvFilter === 'approved' ? ' active' : '') + '" data-f="approved">تاییدشده</button><button class="chip' + (rvFilter === 'all' ? ' active' : '') + '" data-f="all">همه (' + U.toFa(all.length) + ')</button></div>' +
      (list.length ? '<div class="stack">' + list.map((r) => {
        const p = DB.products.get(r.productId);
        return '<div class="msg' + (r.approved ? '' : ' unread') + '"><header><b>' + U.esc(r.name) + '</b>' + global.VIStars(r.rating) + '<small>' + U.timeAgo(r.createdAt) + '</small><span class="spacer"></span>' + (r.approved ? VA.tag('تاییدشده', 'var(--ok)') : VA.tag('در انتظار', 'var(--warn)')) + '</header>' +
          '<p>' + U.esc(r.text) + '</p><small class="muted">برای محصول: <b>' + U.esc(p ? p.name : 'محصول حذف‌شده') + '</b></small>' +
          '<div class="tools">' + (r.approved ? '<button class="btn btn-sm" data-un="' + r.id + '">لغو تایید</button>' : '<button class="btn btn-sm btn-primary" data-ok="' + r.id + '">تایید و نمایش</button>') + '<button class="btn btn-sm btn-danger" data-del="' + r.id + '">حذف</button></div></div>';
      }).join('') + '</div>' : VA.empty(rvFilter === 'pending' ? 'نظر جدیدی برای بررسی وجود ندارد.' : 'نظری پیدا نشد.', 'star'));

    root.onclick = (e) => {
      const f = e.target.closest('[data-f]'); if (f) { rvFilter = f.getAttribute('data-f'); renderReviews(root); return; }
      const ok = e.target.closest('[data-ok]'), un = e.target.closest('[data-un]'), del = e.target.closest('[data-del]');
      if (ok) { approve(DB.reviews.get(ok.getAttribute('data-ok')), true); VA.toast('نظر تایید شد و در سایت نمایش داده می‌شود.'); }
      if (un) { approve(DB.reviews.get(un.getAttribute('data-un')), false); VA.toast('تایید نظر لغو شد.', 'info'); }
      if (del) { VA.confirm('این نظر حذف شود؟', { danger: true, yes: 'حذف' }).then((y) => { if (y) { DB.reviews.remove(del.getAttribute('data-del')); VA.toast('حذف شد.'); renderReviews(root); VA.refreshBadges(); } }); return; }
      if (ok || un) { renderReviews(root); VA.refreshBadges(); }
    };
  }

  VA.register('reviews', { title: 'نظرات', icon: 'star', group: 'مشتریان', render: renderReviews, badge() { return DB.reviews.all().filter((r) => !r.approved).length; } });

  /* ========================= messages ========================= */
  function renderMessages(root) {
    const list = DB.messages.all().slice().sort((a, b) => b.createdAt - a.createdAt);
    root.innerHTML = list.length ? '<div class="stack">' + list.map((m) =>
      '<div class="msg' + (m.read ? '' : ' unread') + '"><header><b>' + U.esc(m.name) + '</b>' + (m.subject ? VA.tag(m.subject) : '') + '<small>' + U.date(m.createdAt, true) + '</small></header>' +
      '<p>' + U.esc(m.text) + '</p><div class="tools">' +
      (m.phone ? '<a class="btn btn-sm" href="tel:' + U.esc(m.phone) + '">' + VI('phone') + U.esc(m.phone) + '</a><a class="btn btn-sm" target="_blank" rel="noopener" href="https://wa.me/98' + U.esc(String(m.phone).replace(/^0/, '')) + '?text=' + encodeURIComponent('سلام ' + m.name + '، در مورد پیام شما به ' + DB.settings.get().brand + ':') + '">' + VI('whatsapp') + 'پاسخ در واتساپ</a>' : '') +
      '<button class="btn btn-sm" data-read="' + m.id + '">' + (m.read ? 'علامت: خوانده‌نشده' : 'علامت: خوانده‌شد') + '</button><button class="btn btn-sm btn-danger" data-del="' + m.id + '">حذف</button></div></div>').join('') + '</div>'
      : VA.empty('هنوز پیامی از فرم تماس دریافت نشده است.', 'message');

    root.onclick = (e) => {
      const r = e.target.closest('[data-read]'), d = e.target.closest('[data-del]');
      if (r) { const m = DB.messages.get(r.getAttribute('data-read')); m.read = !m.read; DB.messages.save(m); renderMessages(root); VA.refreshBadges(); }
      if (d) VA.confirm('این پیام حذف شود؟', { danger: true, yes: 'حذف' }).then((y) => { if (y) { DB.messages.remove(d.getAttribute('data-del')); renderMessages(root); VA.refreshBadges(); } });
    };
  }

  VA.register('messages', { title: 'پیام‌ها', icon: 'message', group: 'مشتریان', render: renderMessages, live: true, badge() { return DB.messages.all().filter((m) => !m.read).length; } });

  /* ======================= subscribers ======================= */
  function renderSubs(root) {
    const list = DB.subscribers.all().slice().sort((a, b) => b.createdAt - a.createdAt);
    root.innerHTML =
      '<div class="toolbar"><span class="muted">' + U.toFa(list.length) + ' عضو</span><span class="spacer"></span><button class="btn" id="sCopy">' + VI('copy') + 'کپی همه‌ی ایمیل‌ها</button><button class="btn" id="sCsv">' + VI('download') + 'خروجی CSV</button></div>' +
      '<div class="tbl-wrap"><table class="tbl" style="min-width:420px"><thead><tr><th>ایمیل</th><th>تاریخ عضویت</th><th></th></tr></thead><tbody>' +
      (list.length ? list.map((s) => '<tr><td dir="ltr" style="text-align:right">' + U.esc(s.value) + '</td><td class="num">' + U.date(s.createdAt) + '</td><td><div class="actions">' + VA.ibtn('trash', 'حذف', 'data-del="' + s.id + '"', 'danger') + '</div></td></tr>').join('') : '<tr><td colspan="3" class="empty">هنوز کسی عضو خبرنامه نشده است.</td></tr>') + '</tbody></table></div>';

    $('#sCopy', root).onclick = () => {
      const txt = list.map((s) => s.value).join('\n');
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(() => VA.toast('ایمیل‌ها کپی شد.')); else VA.toast('مرورگر اجازه‌ی کپی نمی‌دهد.', 'error');
    };
    $('#sCsv', root).onclick = () => U.download('violet-subscribers.csv', U.csv([['ایمیل', 'تاریخ']].concat(list.map((s) => [s.value, U.date(s.createdAt)]))), 'text/csv;charset=utf-8');
    root.onclick = (e) => { const d = e.target.closest('[data-del]'); if (d) { DB.subscribers.remove(d.getAttribute('data-del')); renderSubs(root); } };
  }

  VA.register('subscribers', { title: 'خبرنامه', icon: 'mail', group: 'مشتریان', render: renderSubs });
})(window);
