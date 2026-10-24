/* ==========================================================
   Violet admin — settings.js
   "Site settings" view with tabs. This file holds the tab
   framework + general / appearance / home page / sections /
   shop tabs. Story, trust, testimonials and FAQ tabs are in
   settings-content.js
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;
  const W = global.VioletWatch;

  VA.settingsTabs = [];
  VA.registerSettingsTab = function (id, title, fn) { VA.settingsTabs.push({ id: id, title: title, render: fn }); };

  /** builds <form> + save button; build(values, form) must return the settings patch (or false to cancel) */
  VA.settingsForm = function (host, html, build, logMsg) {
    host.innerHTML = '<form class="form" novalidate>' + html +
      '<div class="form-actions"><button class="btn btn-primary btn-lg" type="submit">' + VI('save') + 'ذخیره‌ی تغییرات</button><a class="btn btn-lg" href="../index.html" target="_blank" rel="noopener">' + VI('external') + 'مشاهده‌ی سایت</a></div></form>';
    const form = host.firstElementChild;
    VA.bindColors(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const patch = build(VA.collect(form), form);
      if (patch === false) return;
      DB.settings.save(patch);
      DB.log('settings', logMsg || 'تنظیمات سایت تغییر کرد');
      VA.toast('ذخیره شد و همین حالا در سایت اعمال می‌شود.');
    });
    return form;
  };

  const dtLocal = (ts) => { const d = new Date(ts || Date.now()); const p = (n) => String(n).padStart(2, '0'); return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes()); };

  /* ---------------- general ---------------- */
  VA.registerSettingsTab('general', 'اطلاعات فروشگاه', (host, s) => {
    VA.settingsForm(host,
      '<div class="fieldset"><h4>هویت برند</h4><div class="row cols-3">' + VA.in.text('brand', 'نام لاتین برند', s.brand, { ltr: true }) + VA.in.text('brandFa', 'نام فارسی', s.brandFa) + VA.in.text('slogan', 'شعار', s.slogan) + '</div></div>' +
      '<div class="fieldset"><h4>راه‌های ارتباطی</h4><div class="row cols-2">' + VA.in.text('phone', 'تلفن ثابت', s.phone) + VA.in.text('mobile', 'موبایل پشتیبانی', s.mobile, { ltr: true }) +
      VA.in.text('whatsapp', 'شماره‌ی واتساپ (با کد کشور)', s.whatsapp, { ltr: true, ph: '989120000000', hint: 'بدون + و صفر اول؛ مثل 989123456789' }) + VA.in.text('email', 'ایمیل', s.email, { ltr: true }) + '</div>' +
      VA.in.area('address', 'نشانی فروشگاه', s.address, { h: 70 }) + VA.in.text('workingHours', 'ساعت کاری', s.workingHours) + '</div>' +
      '<div class="fieldset"><h4>شبکه‌های اجتماعی</h4><div class="row cols-2">' + VA.in.text('instagram', 'اینستاگرام (فقط نام کاربری)', s.instagram, { ltr: true }) + VA.in.text('telegram', 'تلگرام (فقط نام کاربری)', s.telegram, { ltr: true }) + '</div></div>',
      (v) => v, 'اطلاعات فروشگاه ویرایش شد');
  });

  /* ---------------- appearance ---------------- */
  const PRESETS = [
    ['بنفش ویولت', '#8b3dff', '#e8c27a', '#ff5fa2'],
    ['یاقوت صورتی', '#c026d3', '#f5d0a9', '#fb7185'],
    ['نیلی اقیانوسی', '#4f46e5', '#7dd3fc', '#22d3ee'],
    ['بنفش و زمرد', '#7c3aed', '#34d399', '#fbbf24'],
    ['انگور و رزگلد', '#9333ea', '#f0a79a', '#f472b6']
  ];
  VA.registerSettingsTab('appearance', 'ظاهر و رنگ‌ها', (host, s) => {
    const form = VA.settingsForm(host,
      '<div class="fieldset"><h4>تم پیش‌فرض</h4>' + VA.in.select('theme', 'نمایش اولیه برای بازدیدکننده‌ی جدید', s.theme, [['dark', 'تیره (پیشنهادی)'], ['light', 'روشن']]) + '<p class="hint">بازدیدکننده می‌تواند با دکمه‌ی خورشید/ماه بالای سایت تم را عوض کند و انتخابش در مرورگرش می‌ماند.</p></div>' +
      '<div class="fieldset"><h4>رنگ‌های برند</h4><div class="swatch-row" id="presets">' + PRESETS.map((p, i) => '<button type="button" class="chip" data-i="' + i + '">' + p[0] + '</button>').join('') + '</div>' +
      '<div class="row cols-3">' + VA.in.color('colorPrimary', 'رنگ اصلی', s.colorPrimary) + VA.in.color('colorAccent', 'رنگ طلایی (تاکید)', s.colorAccent) + VA.in.color('colorHot', 'رنگ دوم (گرادیان)', s.colorHot) + '</div>' +
      '<div class="preview" style="padding:22px"><div class="toolbar" style="justify-content:center"><button type="button" class="btn btn-primary" id="pvBtn">دکمه‌ی اصلی</button><button type="button" class="btn btn-gold">دکمه‌ی طلایی</button><span class="badge" id="pvBadge">نشان</span></div><small>پیش‌نمایش رنگ‌ها (اعمال نهایی بعد از ذخیره)</small></div></div>',
      (v) => ({ theme: v.theme, colorPrimary: v.colorPrimary, colorAccent: v.colorAccent, colorHot: v.colorHot }), 'رنگ‌های سایت تغییر کرد');

    const paint = () => {
      const v = VA.collect(form);
      const pv = $('#pvBtn', form);
      pv.style.background = 'linear-gradient(135deg,' + v.colorPrimary + ',' + v.colorHot + ')';
      $('#pvBadge', form).style.borderColor = v.colorPrimary;
    };
    form.addEventListener('input', paint); paint();
    $('#presets', form).addEventListener('click', (e) => {
      const b = e.target.closest('[data-i]'); if (!b) return;
      const p = PRESETS[Number(b.getAttribute('data-i'))];
      [['colorPrimary', p[1]], ['colorAccent', p[2]], ['colorHot', p[3]]].forEach((x) => { const inp = $('[data-k="' + x[0] + '"]', form); inp.value = x[1]; inp.dispatchEvent(new Event('input', { bubbles: true })); });
    });
  });

  /* ---------------- home: hero ---------------- */
  VA.registerSettingsTab('hero', 'بخش اصلی (هیرو)', (host, s) => {
    const h = s.hero, sp = Object.assign({}, h.spec);
    const form = VA.settingsForm(host,
      '<div class="editor"><div class="form">' +
      '<div class="fieldset"><h4>متن‌ها</h4>' + VA.in.text('hero.eyebrow', 'برچسب بالای عنوان', h.eyebrow) +
      VA.in.text('hero.title', 'عنوان بزرگ', h.title, { hint: 'برای شکستن خط، متن را در دو خط بنویسید یا فقط کلمات را بنویسید تا خودکار نیمه‌نیمه شود. خط آخر رنگی نمایش داده می‌شود.' }) +
      VA.in.area('hero.subtitle', 'توضیح زیر عنوان', h.subtitle, { h: 80 }) +
      '<div class="row cols-2">' + VA.in.text('hero.cta1', 'متن دکمه‌ی اصلی', h.cta1) + VA.in.text('hero.cta2', 'متن دکمه‌ی دوم', h.cta2) + '</div></div>' +
      '<div class="fieldset"><h4>ساعت سه‌بعدی بالای صفحه</h4><div class="row cols-3">' +
      VA.in.select('hero.spec.shape', 'شکل', sp.shape, W.options.shape) + VA.in.select('hero.spec.caseColor', 'رنگ بدنه', sp.caseColor, W.options.caseColor) + VA.in.select('hero.spec.dialStyle', 'سبک صفحه', sp.dialStyle, W.options.dialStyle) +
      VA.in.select('hero.spec.markers', 'نشانه‌ها', sp.markers, W.options.markers) + VA.in.select('hero.spec.strap', 'بند', sp.strap, W.options.strap) + VA.in.select('hero.spec.handStyle', 'عقربه‌ها', sp.handStyle || 'sword', W.options.handStyle) + '</div>' +
      '<div class="row cols-3">' + VA.in.color('hero.spec.dial', 'رنگ صفحه', sp.dial) + VA.in.color('hero.spec.strapColor', 'رنگ بند', sp.strapColor) + VA.in.color('hero.spec.handColor', 'رنگ عقربه', sp.handColor) + '</div>' +
      VA.in.check('hero.spec.date', 'نمایش تاریخ', sp.date) + '</div>' +
      '<div class="fieldset"><h4>آمار زیر عنوان</h4><div id="statsHost"></div></div></div>' +
      '<aside class="preview"><div class="pv-watch" id="hpv"></div><small>پیش‌نمایش زنده</small></aside></div>',
      (v) => { v.stats = stats.get().map((x) => ({ value: Number(x.value) || 0, suffix: x.suffix, label: x.label })); return v; }, 'بخش اصلی صفحه ویرایش شد');

    const stats = VA.listEditor($('#statsHost', form), s.stats || [], [
      { k: 'value', label: 'عدد', type: 'number' }, { k: 'suffix', label: 'پسوند (مثل + یا سال)', type: 'text' }, { k: 'label', label: 'عنوان', type: 'text', wide: true }
    ], { addLabel: 'افزودن آمار', max: 4, newItem: () => ({ value: 100, suffix: '+', label: '' }) });

    const paint = () => {
      const v = VA.collect(form);
      $('#hpv', form).innerHTML = W.svg(Object.assign({}, v.hero.spec), { viewBox: '20 20 360 600', live: true });
      W.startLive();
    };
    form.addEventListener('input', U.debounce(paint, 60)); form.addEventListener('change', paint); paint();
  });

  /* ---------------- home: sections ---------------- */
  const SECTION_LABELS = [['trust', 'نوار مزایا (ارسال، گارانتی…)'], ['collections', 'کلکسیون‌ها'], ['featured', 'منتخب‌ها'], ['deal', 'تخفیف ویژه‌ی روز'], ['shop', 'فروشگاه و فیلترها'], ['story', 'داستان برند'], ['testimonials', 'نظر مشتریان'], ['faq', 'سوالات متداول'], ['newsletter', 'خبرنامه'], ['contact', 'تماس با ما']];
  VA.registerSettingsTab('sections', 'بخش‌های صفحه', (host, s) => {
    const d = s.deal || {};
    const form = VA.settingsForm(host,
      '<div class="fieldset"><h4>نمایش یا پنهان‌کردن بخش‌ها</h4><div class="grid c2" style="gap:6px 24px">' + SECTION_LABELS.map((x) => VA.in.switch('sections.' + x[0], x[1], s.sections[x[0]] !== false)).join('') + '</div></div>' +
      '<div class="fieldset"><h4>نوار اعلان بالای سایت</h4><div id="annHost"></div></div>' +
      '<div class="fieldset"><h4>تخفیف ویژه‌ی روز (شمارش معکوس)</h4>' + VA.in.switch('deal.enabled', 'فعال', d.enabled) +
      '<div class="row cols-2">' + VA.in.select('deal.productId', 'محصول', d.productId, DB.products.all().map((p) => [p.id, p.name + ' — ' + VA.colName(p.collection)])) + VA.in.num('deal.discountPercent', 'درصد تخفیف', d.discountPercent || 0, { attrs: { min: 0, max: 90 } }) + '</div>' +
      '<div class="row cols-2">' + VA.in.text('deal.title', 'عنوان نشان', d.title) + '<div class="field"><label>پایان تخفیف</label><input class="input" type="datetime-local" id="dealEnd" value="' + dtLocal(d.endsAt) + '" style="direction:ltr"></div></div>' +
      '<div class="toolbar"><span class="hint">زمان پایان را سریع تنظیم کنید:</span><button type="button" class="chip" data-add="1">۱ روز دیگر</button><button type="button" class="chip" data-add="3">۳ روز دیگر</button><button type="button" class="chip" data-add="7">۱ هفته دیگر</button></div></div>',
      (v, f) => {
        const end = new Date($('#dealEnd', f).value).getTime();
        v.deal.endsAt = isNaN(end) ? Date.now() + 86400000 : end;
        v.announcements = ann.get();
        return v;
      }, 'بخش‌های صفحه‌ی اصلی تغییر کرد');
    const ann = VA.listEditor($('#annHost', form), s.announcements || [], null, { simple: true, ph: 'مثلاً: ارسال رایگان برای خرید بالای ۱۵ میلیون', addLabel: 'افزودن اعلان', max: 8 });
    form.addEventListener('click', (e) => {
      const b = e.target.closest('[data-add]'); if (!b) return;
      $('#dealEnd', form).value = dtLocal(Date.now() + Number(b.getAttribute('data-add')) * 86400000);
    });
  });

  /* ---------------- shop / payment ---------------- */
  VA.registerSettingsTab('shop', 'ارسال و پرداخت', (host, s) => {
    VA.settingsForm(host,
      '<div class="fieldset"><h4>قیمت و ارسال</h4><div class="row cols-3">' + VA.in.text('currency', 'واحد پول', s.currency) + VA.in.num('shippingFee', 'هزینه‌ی ارسال', s.shippingFee) + VA.in.num('freeShippingOver', 'ارسال رایگان از مبلغ', s.freeShippingOver) +
      VA.in.num('taxPercent', 'مالیات (درصد)', s.taxPercent || 0, { attrs: { max: 50, step: '0.5' } }) + VA.in.num('giftWrapFee', 'هزینه‌ی بسته‌بندی هدیه', s.giftWrapFee) + VA.in.text('orderPrefix', 'پیشوند کد سفارش', s.orderPrefix, { ltr: true }) + '</div></div>' +
      '<div class="fieldset"><h4>روش‌های پرداخت</h4>' + VA.in.switch('payOnline', 'پرداخت آنلاین (درگاه بانکی)', s.payOnline) + VA.in.switch('payCard', 'کارت به کارت', s.payCard) + VA.in.switch('payCod', 'پرداخت در محل', s.payCod) +
      '<div class="row cols-2">' + VA.in.text('cardNumber', 'شماره‌ی کارت فروشگاه', s.cardNumber, { ltr: true }) + VA.in.text('cardOwner', 'به نام', s.cardOwner) + '</div>' +
      '<p class="hint">درگاه آنلاین در این نسخه نمایشی است؛ برای اتصال به درگاه واقعی (زرین‌پال، آی‌دی‌پی و…) به یک سرور نیاز است. راهنمای اتصال در فایل README آمده است.</p></div>',
      (v) => v, 'تنظیمات ارسال و پرداخت تغییر کرد');
  });

  /* ---------------- view ---------------- */
  let tab = 'general';
  function render(root) {
    root.innerHTML = '<div class="a-tabs" id="sTabs">' + VA.settingsTabs.map((t) => '<button class="' + (t.id === tab ? 'on' : '') + '" data-t="' + t.id + '">' + t.title + '</button>').join('') + '</div><div id="sBody"></div>';
    const draw = () => { const t = VA.settingsTabs.find((x) => x.id === tab) || VA.settingsTabs[0]; t.render($('#sBody', root), DB.settings.get()); };
    $('#sTabs', root).addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      tab = b.getAttribute('data-t');
      U.$$('#sTabs button', root).forEach((x) => x.classList.toggle('on', x === b));
      draw();
    });
    draw();
  }

  VA.register('settings', { title: 'تنظیمات سایت', icon: 'settings', group: 'سایت', render: render });
})(window);
