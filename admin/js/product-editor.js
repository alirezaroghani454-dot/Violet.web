/* ==========================================================
   Violet admin — product-editor.js
   Add / edit a product in a large dialog with a LIVE watch
   preview. The watch picture is generated from the design
   options; you may also upload real photos.
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$, $$ = VA.$$;
  const W = global.VioletWatch;
  const MAX_IMAGES = 4;

  const DIAL_COLORS = ['#3a1878', '#14091f', '#0d0820', '#1b2540', '#0a1f3a', '#5b2bc4', '#c9a8ff', '#ece8f8', '#f6efe6', '#fbe0e8', '#ffd6c4', '#1c2a18', '#1a1a22', '#6a3dd6'];
  const STRAP_COLORS = ['#120a1c', '#2a1b5e', '#3b2410', '#7a4a2a', '#8b3dff', '#ff5fa2', '#f2b8c6', '#fb923c', '#3b5a2a', '#e8e6f2', '#aab0bd', '#dc9783'];
  const HAND_COLORS = ['#f2dc9c', '#ffffff', '#e8d6ff', '#241a46', '#ffd9cb', '#f4f4fb', '#c08bff', '#fb923c'];
  const METAL_SW = { steel: '#c9ccd6', gold: '#e8c27a', rosegold: '#e0a190', violet: '#8b3dff', black: '#17171d', titanium: '#8c909b' };
  const BADGES = [['new', 'جدید'], ['bestseller', 'پرفروش'], ['limited', 'نسخه‌ی محدود'], ['sale', 'تخفیف (نشان دستی)']];

  function blank() {
    return {
      id: '', sku: '', name: '', collection: (DB.collections.sorted()[0] || {}).id || '', gender: 'unisex', price: 10000000, oldPrice: 0, stock: 5,
      badges: [], featured: false, active: true, rating: 4.5, reviewsCount: 0, sold: 0, desc: '', features: [], tags: [], images: [],
      details: { movement: 'کوارتز سوئیسی', power: 'باتری ۵ ساله', caseSize: '', thickness: '', caseMaterial: 'استیل ۳۱۶L', glass: 'یاقوت کبود', water: '', strap: '', weight: '', warranty: '۵ سال گارانتی ویولت' },
      spec: { shape: 'round', caseColor: 'steel', dial: '#3a1878', dialStyle: 'sunburst', markers: 'baton', strap: 'leather', strapColor: '#120a1c', handColor: '#f2dc9c', handStyle: 'sword', date: false }
    };
  }

  function swatches(key, colors, current) {
    return '<div class="swatch-row" data-sw="' + key + '">' + colors.map((c) => '<button type="button" class="sw' + (c.toLowerCase() === String(current).toLowerCase() ? ' on' : '') + '" style="background:' + c + '" data-c="' + c + '" aria-label="' + c + '"></button>').join('') + '</div>';
  }

  function options(name) { return W.options[name]; }

  VA.editProduct = function (id, onDone) {
    const isNew = !id;
    const p = isNew ? blank() : JSON.parse(JSON.stringify(DB.products.get(id)));
    if (!p) return;
    p.details = Object.assign({}, blank().details, p.details || {});
    p.spec = Object.assign({}, blank().spec, p.spec || {});
    p.images = (p.images || []).slice();
    const d = p.details, sp = p.spec;
    const cols = DB.collections.sorted().map((c) => [c.id, c.name]);

    const basic =
      '<div class="form">' +
      '<div class="row cols-2">' + VA.in.text('name', 'نام محصول (لاتین)', p.name, { ph: 'Eclipse Nocturne', ltr: true }) + VA.in.text('sku', 'کد کالا', p.sku, { ph: 'خودکار', ltr: true }) + '</div>' +
      '<div class="row cols-2">' + VA.in.select('collection', 'کلکسیون', p.collection, cols) + VA.in.select('gender', 'مناسب برای', p.gender, [['men', 'آقایان'], ['women', 'بانوان'], ['unisex', 'یونی‌سکس']]) + '</div>' +
      '<div class="row cols-3">' + VA.in.num('price', 'قیمت فروش (' + VA.cur() + ')', p.price) + VA.in.num('oldPrice', 'قیمت قبل از تخفیف', p.oldPrice || 0, { hint: 'برای نمایش تخفیف، عددی بزرگ‌تر از قیمت فروش بنویسید. ۰ = بدون تخفیف' }) + VA.in.num('stock', 'موجودی انبار', p.stock) + '</div>' +
      '<div class="fieldset"><h4>نشان‌ها و وضعیت</h4><div class="checks">' + BADGES.map((b) => VA.in.check('badge_' + b[0], b[1], p.badges.indexOf(b[0]) >= 0)).join('') + VA.in.check('featured', 'نمایش در «منتخب‌ها»', p.featured) + VA.in.check('active', 'نمایش در سایت', p.active !== false) + '</div></div>' +
      VA.in.area('desc', 'توضیحات محصول', p.desc, { h: 120 }) +
      VA.in.text('tags', 'برچسب‌ها (برای جستجو؛ با ویرگول جدا کنید)', (p.tags || []).join('، '), { ph: 'کرونوگراف، مشکی، چرم' }) +
      '<div class="row cols-3">' + VA.in.num('rating', 'امتیاز (۰ تا ۵)', p.rating, { attrs: { min: 0, max: 5, step: '0.1' } }) + VA.in.num('reviewsCount', 'تعداد نظرها', p.reviewsCount || 0) + VA.in.num('sold', 'تعداد فروش‌رفته', p.sold || 0) + '</div></div>';

    const details =
      '<div class="form"><div class="row cols-2">' +
      VA.in.text('details.movement', 'موومنت', d.movement) + VA.in.text('details.power', 'منبع انرژی', d.power) +
      VA.in.text('details.caseSize', 'قطر بدنه', d.caseSize, { ph: '۴۲ میلی‌متر' }) + VA.in.text('details.thickness', 'ضخامت', d.thickness, { ph: '۱۲ میلی‌متر' }) +
      VA.in.text('details.caseMaterial', 'جنس بدنه', d.caseMaterial) + VA.in.text('details.glass', 'شیشه', d.glass) +
      VA.in.text('details.water', 'مقاومت در برابر آب', d.water, { ph: '۱۰۰ متر' }) + VA.in.text('details.strap', 'جنس بند', d.strap, { ph: 'چرم طبیعی' }) +
      VA.in.text('details.weight', 'وزن', d.weight, { ph: '۱۰۵ گرم' }) + VA.in.text('details.warranty', 'گارانتی', d.warranty) +
      '</div><div class="fieldset"><h4>ویژگی‌های برجسته</h4><p class="hint">هر مورد یک خط در صفحه‌ی محصول (حداکثر ۶ مورد نمایش داده می‌شود).</p><div id="featHost"></div></div></div>';

    const design =
      '<div class="form"><p class="hint">تصویر ساعت از روی همین گزینه‌ها ساخته می‌شود؛ تغییرات را در پیش‌نمایش ببینید.</p>' +
      '<div class="row cols-3">' + VA.in.select('spec.shape', 'شکل بدنه', sp.shape, options('shape')) + VA.in.select('spec.dialStyle', 'سبک صفحه', sp.dialStyle, options('dialStyle')) + VA.in.select('spec.markers', 'نشانه‌های ساعت', sp.markers, options('markers')) + '</div>' +
      '<div class="row cols-3">' + VA.in.select('spec.strap', 'جنس بند', sp.strap, options('strap')) + VA.in.select('spec.handStyle', 'شکل عقربه‌ها', sp.handStyle || 'sword', options('handStyle')) + VA.in.select('spec.caseColor', 'رنگ بدنه', sp.caseColor, options('caseColor')) + '</div>' +
      '<div class="field"><label>رنگ بدنه (انتخاب سریع)</label><div class="swatch-row" data-sw="spec.caseColor">' + Object.keys(METAL_SW).map((k) => '<button type="button" class="sw' + (k === sp.caseColor ? ' on' : '') + '" style="background:' + METAL_SW[k] + '" data-c="' + k + '" aria-label="' + k + '"></button>').join('') + '</div></div>' +
      '<div class="row cols-2"><div>' + VA.in.color('spec.dial', 'رنگ صفحه', sp.dial) + swatches('spec.dial', DIAL_COLORS, sp.dial) + '</div><div>' + VA.in.color('spec.strapColor', 'رنگ بند', sp.strapColor) + swatches('spec.strapColor', STRAP_COLORS, sp.strapColor) + '</div></div>' +
      '<div class="row cols-2"><div>' + VA.in.color('spec.handColor', 'رنگ عقربه‌ها و نشانه‌ها', sp.handColor) + swatches('spec.handColor', HAND_COLORS, sp.handColor) + '</div>' +
      '<div class="fieldset"><div class="checks">' + VA.in.check('spec.date', 'نمایش پنجره‌ی تاریخ', sp.date) + VA.in.check('useBezel', 'حلقه‌ی رنگی دور صفحه', !!sp.bezel) + '</div>' + VA.in.color('spec.bezel', 'رنگ حلقه', sp.bezel || '#8b3dff') + '</div></div></div>';

    const images =
      '<div class="form"><p class="hint">اگر عکس واقعی ساعت را آپلود کنید، به جای تصویر ساخته‌شده نمایش داده می‌شود. تصویرها فشرده و در مرورگر ذخیره می‌شوند؛ حداکثر ' + U.toFa(MAX_IMAGES) + ' عکس. برای سایت واقعی بهتر است عکس‌ها روی سرور باشند.</p>' +
      '<label class="drop" id="drop" tabindex="0">' + VI('upload') + '<div style="margin-top:8px">برای انتخاب عکس کلیک کنید یا فایل را اینجا رها کنید</div><input type="file" id="imgInput" accept="image/*" multiple hidden></label>' +
      '<div class="img-grid" id="imgGrid"></div></div>';

    const m = VA.modal({
      title: isNew ? 'افزودن محصول جدید' : 'ویرایش «' + p.name + '»', size: 'xl',
      html: '<div class="editor"><div><div class="a-tabs" id="edTabs"><button class="on" data-t="basic">اطلاعات اصلی</button><button data-t="details">مشخصات فنی</button><button data-t="design">طراحی ساعت</button><button data-t="images">عکس‌ها</button></div>' +
        '<form id="edForm" novalidate><div data-p="basic">' + basic + '</div><div data-p="details" class="hidden">' + details + '</div><div data-p="design" class="hidden">' + design + '</div><div data-p="images" class="hidden">' + images + '</div>' +
        '<div class="form-actions"><button class="btn btn-primary btn-lg" type="submit">' + VI('save') + (isNew ? 'افزودن محصول' : 'ذخیره‌ی تغییرات') + '</button><button class="btn btn-lg" type="button" data-x>انصراف</button></div></form></div>' +
        '<aside class="preview"><div class="pv-watch" id="pv"></div><b class="latin" id="pvName" style="font-size:1.4rem"></b><small>پیش‌نمایش زنده</small></aside></div>'
    });

    const form = $('#edForm', m.el);
    VA.bindColors(form);
    const feats = VA.listEditor($('#featHost', m.el), p.features || [], null, { simple: true, ph: 'مثلاً: شیشه‌ی یاقوت کبود ضدخش', addLabel: 'افزودن ویژگی', max: 12 });

    /* ----- tabs ----- */
    $('#edTabs', m.el).addEventListener('click', (e) => {
      const b = e.target.closest('[data-t]'); if (!b) return;
      $$('#edTabs button', m.el).forEach((x) => x.classList.toggle('on', x === b));
      $$('[data-p]', m.el).forEach((x) => x.classList.toggle('hidden', x.getAttribute('data-p') !== b.getAttribute('data-t')));
    });

    /* ----- live preview ----- */
    function currentSpec() {
      const v = VA.collect(form);
      const s = Object.assign({}, v.spec);
      if (!v.useBezel) delete s.bezel;
      if (p.spec.markerColor) s.markerColor = p.spec.markerColor;
      if (p.spec.seed) s.seed = p.spec.seed;
      return { spec: s, name: v.name || 'Violet' };
    }
    function preview() {
      const c = currentSpec();
      $('#pv', m.el).innerHTML = W.svg(c.spec, { viewBox: '20 20 360 600', live: true, label: 'پیش‌نمایش' });
      $('#pvName', m.el).textContent = c.name;
      W.startLive();
    }
    form.addEventListener('input', U.debounce(preview, 60));
    form.addEventListener('change', preview);
    preview();

    /* swatch clicks */
    form.addEventListener('click', (e) => {
      const sw = e.target.closest('.sw'); if (!sw) return;
      const key = sw.parentElement.getAttribute('data-sw');
      const input = $('[data-k="' + key + '"]', form);
      input.value = sw.getAttribute('data-c');
      input.dispatchEvent(new Event('input', { bubbles: true }));
      $$('.sw', sw.parentElement).forEach((x) => x.classList.toggle('on', x === sw));
      if (key === 'spec.caseColor') input.dispatchEvent(new Event('change', { bubbles: true }));
    });

    /* ----- images ----- */
    function drawImages() {
      $('#imgGrid', m.el).innerHTML = p.images.map((src, i) =>
        '<div class="img-tile"><img src="' + U.esc(src) + '" alt="">' + (i === 0 ? '<span class="first">اصلی</span>' : '<button type="button" class="x" style="inset-inline-start:6px;inset-inline-end:auto;background:var(--primary)" data-main="' + i + '" title="اصلی کن">★</button>') +
        '<button type="button" class="x" data-rm="' + i + '" aria-label="حذف">' + VI('close') + '</button></div>').join('');
    }
    drawImages();
    async function addFiles(files) {
      for (const f of Array.from(files)) {
        if (p.images.length >= MAX_IMAGES) { VA.toast('حداکثر ' + U.toFa(MAX_IMAGES) + ' عکس برای هر محصول.', 'info'); break; }
        if (!/^image\//.test(f.type)) continue;
        p.images.push(await U.resizeImage(f, 800, 0.78));
      }
      drawImages();
    }
    $('#imgInput', m.el).addEventListener('change', (e) => { addFiles(e.target.files); e.target.value = ''; });
    const drop = $('#drop', m.el);
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => addFiles(e.dataTransfer.files));
    drop.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); $('#imgInput', m.el).click(); } });
    $('#imgGrid', m.el).addEventListener('click', (e) => {
      const rm = e.target.closest('[data-rm]'), mn = e.target.closest('[data-main]');
      if (rm) { p.images.splice(Number(rm.getAttribute('data-rm')), 1); drawImages(); }
      if (mn) { const i = Number(mn.getAttribute('data-main')); p.images.unshift(p.images.splice(i, 1)[0]); drawImages(); }
    });

    /* ----- save ----- */
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = VA.collect(form);
      const err = (msg, tab) => {
        VA.toast(msg, 'error');
        const b = $('#edTabs [data-t="' + tab + '"]', m.el); if (b) b.click();
      };
      if (String(v.name).trim().length < 2) return err('نام محصول را وارد کنید.', 'basic');
      if (!(v.price > 0)) return err('قیمت فروش باید بیشتر از صفر باشد.', 'basic');
      if (!v.collection) return err('یک کلکسیون انتخاب کنید (ابتدا از بخش «کلکسیون‌ها» بسازید).', 'basic');
      if (v.oldPrice && v.oldPrice <= v.price) v.oldPrice = 0;

      const badges = BADGES.map((b) => b[0]).filter((k) => v['badge_' + k]);
      const c = currentSpec();
      const out = Object.assign({}, p, {
        name: String(v.name).trim(), collection: v.collection, gender: v.gender,
        price: Math.round(v.price), oldPrice: Math.round(v.oldPrice || 0), stock: Math.max(0, Math.floor(v.stock)),
        badges: badges, featured: !!v.featured, active: !!v.active,
        desc: v.desc, tags: String(v.tags || '').split(/[,،]/).map((t) => t.trim()).filter(Boolean),
        rating: U.clamp(Number(v.rating) || 0, 0, 5), reviewsCount: Math.floor(v.reviewsCount || 0), sold: Math.floor(v.sold || 0),
        details: v.details, features: feats.get(), images: p.images, spec: c.spec
      });
      if (!out.sku) out.sku = DB.products.nextSku();
      else out.sku = String(v.sku).trim() || out.sku;
      if (isNew) { out.createdAt = Date.now(); out.id = ''; }
      DB.products.save(out);
      DB.log('product', (isNew ? 'محصول جدید «' : 'محصول «') + out.name + (isNew ? '» اضافه شد' : '» ویرایش شد'));
      VA.toast(isNew ? 'محصول اضافه شد.' : 'تغییرات ذخیره شد.');
      m.close();
      if (onDone) onDone(); else VA.rerender();
    });
  };
})(window);
