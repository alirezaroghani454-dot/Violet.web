/* ==========================================================
   Violet admin — core.js   (window.VA)
   Router, modal / confirm / toast, form helpers, list editor
   Every admin view registers itself with VA.register()
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI;
  const $ = U.$, $$ = U.$$;

  const VA = {
    $: $, $$: $$, esc: U.esc, U: U, DB: DB, VI: VI,
    views: {}, order: [], current: null, openModals: 0
  };

  /* ---------- small helpers ---------- */
  VA.cur = () => DB.settings.get().currency || 'تومان';
  VA.price = (n) => U.num(n) + ' ' + VA.cur();
  VA.tag = (text, color, cls) => '<span class="tag ' + (cls || '') + '"' + (color ? ' style="--c:' + color + '"' : '') + '>' + U.esc(text) + '</span>';
  VA.statusTag = (st) => { const i = DB.orders.statusInfo(st); return VA.tag(i.label, i.color); };
  VA.ibtn = (icon, label, attrs, cls) => '<button type="button" class="mini-btn ' + (cls || '') + '" title="' + U.esc(label) + '" aria-label="' + U.esc(label) + '" ' + (attrs || '') + '>' + VI(icon) + '</button>';
  VA.thumb = (p, view) => '<span class="thumb">' + (p.images && p.images.length ? '<img src="' + U.esc(p.images[0]) + '" alt="">' : global.VioletWatch.svg(p.spec, { viewBox: view || '60 150 280 330' })) + '</span>';
  VA.colName = (id) => { const c = DB.collections.get(id); return c ? c.name : '—'; };
  VA.empty = (text, icon) => '<div class="empty-box">' + VI(icon || 'box', '') + '<p style="margin-top:10px">' + U.esc(text) + '</p></div>';

  /* ---------- toast ---------- */
  VA.toast = function (msg, type, ms) {
    const box = $('#toasts'); if (!box) return;
    const icon = type === 'error' ? 'alert' : type === 'info' ? 'info' : 'check';
    const t = U.el('div', { class: 'toast ' + (type || 'success'), role: 'status' }, '<span class="ti">' + VI(icon) + '</span><span>' + U.esc(msg) + '</span>');
    box.appendChild(t);
    while (box.children.length > 3) box.firstChild.remove();
    setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 380); }, ms || 3000);
  };

  /* ---------- modal ---------- */
  VA.modal = function (o) {
    const host = $('#modalHost');
    const el = U.el('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.title || '' },
      '<div class="modal-bg" data-x></div><div class="modal-box ' + (o.size || 'md') + '"><button class="icon-btn modal-close" data-x aria-label="بستن">' + VI('close') + '</button>' +
      '<div class="modal-scroll"><div class="modal-title"><h2>' + U.esc(o.title || '') + '</h2>' + (o.subtitle ? '<p class="muted">' + U.esc(o.subtitle) + '</p>' : '') + '</div><div class="modal-pad" data-body></div></div></div>');
    const body = $('[data-body]', el);
    if (typeof o.html === 'string') body.innerHTML = o.html; else if (o.html) body.appendChild(o.html);
    host.appendChild(el);
    VA.openModals++; document.body.classList.add('no-scroll');
    requestAnimationFrame(() => el.classList.add('show'));

    const api = {
      el: el, body: body,
      close() {
        if (el.__closed) return; el.__closed = true;
        el.classList.remove('show');
        setTimeout(() => el.remove(), 350);
        VA.openModals = Math.max(0, VA.openModals - 1);
        if (!VA.openModals) document.body.classList.remove('no-scroll');
        document.removeEventListener('keydown', onKey);
        if (o.onClose) o.onClose();
      }
    };
    function onKey(e) { if (e.key === 'Escape' && el === host.lastElementChild) api.close(); }
    document.addEventListener('keydown', onKey);
    el.addEventListener('click', (e) => { if (e.target.closest('[data-x]')) api.close(); });
    return api;
  };

  VA.confirm = function (message, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      let done = false;
      const m = VA.modal({
        title: opts.title || 'تایید عملیات', size: 'sm', onClose() { if (!done) resolve(false); },
        html: '<p style="line-height:2;margin-bottom:22px">' + U.esc(message) + '</p><div class="form-actions" style="position:static;padding:0;background:none"><button class="btn ' + (opts.danger ? 'btn-danger' : 'btn-primary') + '" data-yes>' + U.esc(opts.yes || 'بله، انجام شود') + '</button><button class="btn" data-no>انصراف</button></div>'
      });
      $('[data-yes]', m.el).onclick = () => { done = true; m.close(); resolve(true); };
      $('[data-no]', m.el).onclick = () => m.close();
    });
  };

  /* ---------- form field builders (return HTML strings) ---------- */
  const attr = (o) => Object.keys(o || {}).map((k) => ' ' + k + '="' + U.esc(o[k]) + '"').join('');
  VA.in = {
    text(k, label, val, o) {
      o = o || {};
      return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label>' + label + '</label><input class="input" data-k="' + k + '" type="' + (o.type || 'text') + '" value="' + U.esc(val === undefined || val === null ? '' : val) + '"' +
        (o.ph ? ' placeholder="' + U.esc(o.ph) + '"' : '') + (o.ltr ? ' style="direction:ltr;text-align:left"' : '') + attr(o.attrs) + '>' + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
    },
    num(k, label, val, o) {
      o = o || {};
      return VA.in.text(k, label, val === undefined ? 0 : val, Object.assign({ type: 'number', ltr: true, attrs: Object.assign({ inputmode: 'numeric', min: 0, step: 'any' }, o.attrs) }, o));
    },
    area(k, label, val, o) {
      o = o || {};
      return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label>' + label + '</label><textarea class="textarea" data-k="' + k + '" style="min-height:' + (o.h || 100) + 'px"' + (o.ph ? ' placeholder="' + U.esc(o.ph) + '"' : '') + '>' + U.esc(val || '') + '</textarea>' + (o.hint ? '<span class="hint">' + o.hint + '</span>' : '') + '</div>';
    },
    select(k, label, val, options, o) {
      o = o || {};
      return '<div class="field' + (o.cls ? ' ' + o.cls : '') + '"><label>' + label + '</label><select class="select" data-k="' + k + '">' +
        options.map((x) => '<option value="' + U.esc(x[0]) + '"' + (String(x[0]) === String(val) ? ' selected' : '') + '>' + U.esc(x[1]) + '</option>').join('') + '</select></div>';
    },
    check(k, label, val) {
      return '<label class="check"><input type="checkbox" data-k="' + k + '"' + (val ? ' checked' : '') + '><span>' + label + '</span></label>';
    },
    switch(k, label, val) {
      return '<label class="check" style="justify-content:space-between;gap:16px"><span>' + label + '</span><span class="switch"><input type="checkbox" data-k="' + k + '"' + (val ? ' checked' : '') + '><i></i></span></label>';
    },
    color(k, label, val, o) {
      return '<div class="field' + ((o || {}).cls ? ' ' + o.cls : '') + '"><label>' + label + '</label><div class="color-field"><input class="input" type="color" data-color-for="' + k + '" value="' + U.esc(val || '#000000') + '"><input class="input" data-k="' + k + '" value="' + U.esc(val || '') + '" maxlength="9" spellcheck="false"></div></div>';
    }
  };

  /** keep colour pickers and their text inputs in sync inside a root */
  VA.bindColors = function (root) {
    root.addEventListener('input', (e) => {
      const t = e.target;
      if (t.hasAttribute && t.hasAttribute('data-color-for')) {
        const txt = $('[data-k="' + t.getAttribute('data-color-for') + '"]', root);
        if (txt) { txt.value = t.value; txt.dispatchEvent(new Event('input', { bubbles: true })); }
      } else if (t.matches && t.matches('[data-k]') && /^#[0-9a-f]{6}$/i.test(t.value)) {
        const pick = $('[data-color-for="' + t.getAttribute('data-k') + '"]', root);
        if (pick) pick.value = t.value;
      }
    });
  };

  /** read every [data-k] inside root into an object ("a.b" keys make nested objects) */
  VA.collect = function (root) {
    const out = {};
    $$('[data-k]', root).forEach((el) => {
      let v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'number') v = el.value === '' ? 0 : Number(U.toEn(el.value));
      else v = el.value;
      const path = el.getAttribute('data-k').split('.');
      let o = out;
      path.forEach((p, i) => { if (i === path.length - 1) o[p] = v; else o = o[p] = o[p] || {}; });
    });
    return out;
  };

  /* ---------- list editor ---------- */
  VA.listEditor = function (host, items, fields, opts) {
    opts = opts || {};
    let rows = JSON.parse(JSON.stringify(items || []));

    function fieldHtml(f, val) {
      const wide = f.wide ? ' wide' : '';
      if (f.type === 'textarea') return '<div class="field' + wide + '"><label>' + f.label + '</label><textarea class="textarea" data-f="' + f.k + '" style="min-height:76px">' + U.esc(val || '') + '</textarea></div>';
      if (f.type === 'select') return '<div class="field' + wide + '"><label>' + f.label + '</label><select class="select" data-f="' + f.k + '">' + f.options.map((o) => '<option value="' + U.esc(o[0]) + '"' + (o[0] === val ? ' selected' : '') + '>' + U.esc(o[1]) + '</option>').join('') + '</select></div>';
      if (f.type === 'check') return '<label class="check' + wide + '"><input type="checkbox" data-f="' + f.k + '"' + (val ? ' checked' : '') + '><span>' + f.label + '</span></label>';
      return '<div class="field' + wide + '"><label>' + f.label + '</label><input class="input" data-f="' + f.k + '" type="' + (f.type === 'number' ? 'number' : 'text') + '" value="' + U.esc(val === undefined ? '' : val) + '"' + (f.ltr ? ' style="direction:ltr;text-align:left"' : '') + (f.ph ? ' placeholder="' + U.esc(f.ph) + '"' : '') + '></div>';
    }

    function tools(i) {
      return '<div class="le-tools">' + VA.ibtn('chevD', 'پایین', 'data-le="down" data-i="' + i + '"') + VA.ibtn('chevD', 'بالا', 'data-le="up" data-i="' + i + '" style="transform:rotate(180deg)"') + VA.ibtn('trash', 'حذف', 'data-le="del" data-i="' + i + '"', 'danger') + '</div>';
    }

    function render() {
      host.innerHTML = '<div class="le">' + (rows.length ? rows.map((r, i) => opts.simple
        ? '<div class="le-simple" data-i="' + i + '"><input class="input" value="' + U.esc(r) + '"' + (opts.ph ? ' placeholder="' + U.esc(opts.ph) + '"' : '') + '>' + VA.ibtn('trash', 'حذف', 'data-le="del" data-i="' + i + '"', 'danger') + '</div>'
        : '<div class="le-row" data-i="' + i + '">' + tools(i) + '<div class="le-fields">' + fields.map((f) => fieldHtml(f, r[f.k])).join('') + '</div></div>').join('')
        : '<div class="hint">هنوز موردی اضافه نشده است.</div>') + '</div>' +
        '<button type="button" class="btn btn-sm" data-le="add" style="margin-top:12px">' + VI('plus') + (opts.addLabel || 'افزودن مورد جدید') + '</button>';
    }

    function sync() {
      $$('[data-i]', host).forEach((rowEl) => {
        if (!rowEl.classList.contains('le-row') && !rowEl.classList.contains('le-simple')) return;
        const i = Number(rowEl.getAttribute('data-i'));
        if (opts.simple) { rows[i] = $('input', rowEl).value; return; }
        fields.forEach((f) => {
          const el = $('[data-f="' + f.k + '"]', rowEl); if (!el) return;
          rows[i][f.k] = f.type === 'check' ? el.checked : f.type === 'number' ? (Number(el.value) || 0) : el.value;
        });
      });
    }

    host.addEventListener('click', (e) => {
      const b = e.target.closest('[data-le]'); if (!b || !host.contains(b)) return;
      sync();
      const act = b.getAttribute('data-le'), i = Number(b.getAttribute('data-i'));
      if (act === 'add') { if (opts.max && rows.length >= opts.max) { VA.toast('حداکثر ' + U.toFa(opts.max) + ' مورد مجاز است.', 'info'); return; } rows.push(opts.simple ? '' : (opts.newItem ? opts.newItem() : {})); }
      if (act === 'del') rows.splice(i, 1);
      if (act === 'up' && i > 0) { const t = rows[i]; rows[i] = rows[i - 1]; rows[i - 1] = t; }
      if (act === 'down' && i < rows.length - 1) { const t = rows[i]; rows[i] = rows[i + 1]; rows[i + 1] = t; }
      render();
    });

    render();
    return { get() { sync(); return opts.simple ? rows.filter((r) => String(r).trim()) : rows.slice(); } };
  };

  /* ---------- pager ---------- */
  VA.pagerHtml = function (total, page, per) {
    const pages = Math.max(1, Math.ceil(total / per));
    if (pages <= 1) return '';
    let out = '<div class="pager"><button data-pg="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + ' aria-label="قبلی">‹</button>';
    const show = [];
    for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - page) <= 1) show.push(i);
    let last = 0;
    show.forEach((i) => { if (i - last > 1) out += '<span>…</span>'; out += '<button data-pg="' + i + '" class="' + (i === page ? 'on' : '') + '">' + U.toFa(i) + '</button>'; last = i; });
    return out + '<button data-pg="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + ' aria-label="بعدی">›</button></div>';
  };

  /* ---------- router ---------- */
  VA.register = function (name, def) {
    def.name = name;
    VA.views[name] = def;
    VA.order.push(name);
  };

  VA.go = function (name) { if (location.hash === '#/' + name) VA.render(); else location.hash = '#/' + name; };

  VA.render = function () {
    const name = (location.hash.match(/^#\/([\w-]+)/) || [])[1];
    const def = VA.views[name] || VA.views.dashboard;
    VA.current = def;
    const root = $('#view');
    root.innerHTML = '';
    $('#pageTitle').textContent = def.title;
    document.title = def.title + ' | پنل ویولت';
    $$('#nav a').forEach((a) => a.classList.toggle('active', a.getAttribute('data-view') === def.name));
    closeSide();
    def.render(root);
    window.scrollTo(0, 0);
    VA.refreshBadges();
  };

  /** re-render the current view without losing scroll position */
  VA.rerender = function () {
    if (!VA.current) return;
    const y = window.scrollY;
    const root = $('#view');
    VA.current.render(root);
    window.scrollTo(0, y);
    VA.refreshBadges();
  };

  VA.buildNav = function () {
    const groups = {};
    VA.order.forEach((n) => { const d = VA.views[n]; (groups[d.group || ''] = groups[d.group || ''] || []).push(d); });
    $('#nav').innerHTML = Object.keys(groups).map((g) =>
      (g ? '<h6>' + g + '</h6>' : '') + groups[g].map((d) =>
        '<a href="#/' + d.name + '" data-view="' + d.name + '">' + VI(d.icon) + '<span>' + d.title + '</span><span class="pill hidden" data-badge="' + d.name + '"></span></a>').join('')).join('');
  };

  VA.refreshBadges = function () {
    VA.order.forEach((n) => {
      const d = VA.views[n]; const el = $('[data-badge="' + n + '"]');
      if (!el || !d.badge) return;
      const c = d.badge();
      el.textContent = U.toFa(c); el.classList.toggle('hidden', !c);
    });
  };

  function closeSide() { $('#side').classList.remove('open'); $('#sideBg').classList.remove('show'); }
  VA.openSide = function () { $('#side').classList.add('open'); $('#sideBg').classList.add('show'); };
  VA.closeSide = closeSide;

  /* ---------- printing / export helpers ---------- */
  VA.printHtml = function (title, html) {
    const w = window.open('', '_blank', 'width=900,height=800');
    if (!w) { VA.toast('پنجره‌ی چاپ مسدود شد. اجازه‌ی باز شدن پنجره را بدهید.', 'error'); return; }
    w.document.write('<!doctype html><html lang="fa" dir="rtl"><head><meta charset="utf-8"><title>' + U.esc(title) + '</title><style>' +
      'body{font-family:Tahoma,Vazirmatn,sans-serif;padding:32px;color:#111;line-height:1.9}h1{margin:0 0 4px;font-size:22px}table{width:100%;border-collapse:collapse;margin:18px 0}th,td{border:1px solid #ccc;padding:8px 10px;text-align:right;font-size:13px}th{background:#f1ecff}' +
      '.row{display:flex;justify-content:space-between;gap:20px}.muted{color:#666;font-size:12px}.tot td{font-weight:700;background:#faf7ff}@media print{button{display:none}}</style></head><body>' + html +
      '<button onclick="window.print()" style="margin-top:20px;padding:10px 24px">چاپ</button></body></html>');
    w.document.close();
  };

  global.VA = VA;
})(window);
