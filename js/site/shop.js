/* ==========================================================
   Violet — site/shop.js
   Product listing: filters, search, sorting, grid / list view,
   "load more" pagination and active-filter chips
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, DB = global.VioletDB, VI = global.VI, C = global.VCards;
  const $ = U.$;
  const PAGE = 12;

  const STRAPS = [['leather', 'چرم'], ['silicone', 'سیلیکون'], ['steel', 'استیل'], ['mesh', 'میلانز'], ['ceramic', 'سرامیک'], ['nato', 'پارچه‌ای']];
  const CASES = [['steel', 'استیل', '#c9ccd6'], ['gold', 'طلایی', '#e8c27a'], ['rosegold', 'رزگلد', '#e0a190'], ['violet', 'بنفش', '#8b3dff'], ['black', 'مشکی', '#17171d'], ['titanium', 'تیتانیوم', '#8c909b']];
  const GENDERS = [['men', 'آقایان'], ['women', 'بانوان'], ['unisex', 'یونی‌سکس']];

  const state = {
    q: '', cols: [], genders: [], straps: [], cases: [],
    min: 0, max: 0, inStock: false, sale: false,
    sort: 'featured', view: 'grid', page: 1
  };
  let bounds = { min: 0, max: 100000000 };

  const Shop = {

    state: state,

    /* ---------- filter panel ---------- */
    buildFilters() {
      const prods = DB.products.active();
      const cols = DB.collections.all().filter((c) => c.visible !== false).sort((a, b) => (a.order || 0) - (b.order || 0));
      const prices = prods.map((p) => p.price);
      bounds.min = Math.floor((Math.min.apply(null, prices) || 0) / 1000000) * 1000000;
      bounds.max = Math.ceil((Math.max.apply(null, prices) || 100000000) / 1000000) * 1000000;
      if (!state.max || state.max > bounds.max) state.max = bounds.max;
      if (state.min < bounds.min) state.min = bounds.min;

      const count = (fn) => prods.filter(fn).length;
      const checks = (name, list, selected, countFn) => '<div class="filter-list">' + list.map((it) =>
        '<label class="check"><span><input type="checkbox" data-f="' + name + '" value="' + it[0] + '"' + (selected.indexOf(it[0]) >= 0 ? ' checked' : '') + '>' + U.esc(it[1]) + '</span><em>' + U.toFa(countFn(it[0])) + '</em></label>').join('') + '</div>';

      $('#filterBody').innerHTML =
        '<div class="filter-group"><h4>کلکسیون</h4>' + checks('cols', cols.map((c) => [c.id, c.name]), state.cols, (v) => count((p) => p.collection === v)) + '</div>' +
        '<div class="filter-group"><h4>مناسب برای</h4>' + checks('genders', GENDERS, state.genders, (v) => count((p) => p.gender === v)) + '</div>' +
        '<div class="filter-group"><h4>محدوده‌ی قیمت</h4>' +
        '<div class="dual-range"><div class="track"></div><div class="fill" id="rangeFill"></div>' +
        '<input type="range" id="rangeMin" min="' + bounds.min + '" max="' + bounds.max + '" step="500000" value="' + state.min + '" aria-label="حداقل قیمت">' +
        '<input type="range" id="rangeMax" min="' + bounds.min + '" max="' + bounds.max + '" step="500000" value="' + state.max + '" aria-label="حداکثر قیمت"></div>' +
        '<div class="price-box"><span id="rangeMinTxt"></span><span id="rangeMaxTxt"></span></div></div>' +
        '<div class="filter-group"><h4>رنگ بدنه</h4><div class="swatches">' + CASES.map((c) =>
          '<button type="button" class="swatch' + (state.cases.indexOf(c[0]) >= 0 ? ' active' : '') + '" data-case="' + c[0] + '" style="background:' + c[2] + '" title="' + c[1] + '" aria-label="' + c[1] + '" aria-pressed="' + (state.cases.indexOf(c[0]) >= 0) + '"></button>').join('') + '</div></div>' +
        '<div class="filter-group"><h4>جنس بند</h4>' + checks('straps', STRAPS, state.straps, (v) => count((p) => p.spec && p.spec.strap === v)) + '</div>' +
        '<div class="filter-group"><div class="filter-list">' +
        '<label class="check"><span><input type="checkbox" id="fStock"' + (state.inStock ? ' checked' : '') + '>فقط کالاهای موجود</span></label>' +
        '<label class="check"><span><input type="checkbox" id="fSale"' + (state.sale ? ' checked' : '') + '>فقط تخفیف‌دارها</span></label></div></div>';

      Shop.updateRangeUI();
    },

    updateRangeUI() {
      const f = $('#rangeFill'); if (!f) return;
      const span = bounds.max - bounds.min || 1;
      const a = (state.min - bounds.min) / span * 100, b = (state.max - bounds.min) / span * 100;
      f.style.insetInlineStart = a + '%';
      f.style.width = (b - a) + '%';
      $('#rangeMinTxt').textContent = U.num(state.min) + ' ' + C.cur();
      $('#rangeMaxTxt').textContent = U.num(state.max) + ' ' + C.cur();
    },

    bindFilters() {
      const body = $('#filterBody');
      body.addEventListener('change', (e) => {
        const t = e.target;
        if (t.matches('[data-f]')) {
          const key = t.getAttribute('data-f'), arr = state[key], i = arr.indexOf(t.value);
          if (t.checked && i < 0) arr.push(t.value);
          if (!t.checked && i >= 0) arr.splice(i, 1);
        } else if (t.id === 'fStock') state.inStock = t.checked;
        else if (t.id === 'fSale') state.sale = t.checked;
        else return;
        state.page = 1; Shop.render();
      });
      body.addEventListener('input', (e) => {
        const t = e.target;
        if (t.id === 'rangeMin') { state.min = Math.min(Number(t.value), state.max - 500000); t.value = state.min; }
        else if (t.id === 'rangeMax') { state.max = Math.max(Number(t.value), state.min + 500000); t.value = state.max; }
        else return;
        Shop.updateRangeUI();
        state.page = 1; Shop.renderDebounced();
      });
      body.addEventListener('click', (e) => {
        const sw = e.target.closest('.swatch');
        if (!sw) return;
        const v = sw.getAttribute('data-case'), i = state.cases.indexOf(v);
        if (i >= 0) state.cases.splice(i, 1); else state.cases.push(v);
        sw.classList.toggle('active'); sw.setAttribute('aria-pressed', i < 0);
        state.page = 1; Shop.render();
      });

      $('#filterReset').addEventListener('click', Shop.reset);
      $('#filterToggle').addEventListener('click', () => global.VUI.open('filters'));
      $('#filtersApply').addEventListener('click', () => { global.VUI.close('filters'); $('#shop').scrollIntoView({ behavior: 'smooth' }); });

      $('#shopSearch').addEventListener('input', U.debounce((e) => { state.q = e.target.value; state.page = 1; Shop.render(); }, 180));
      $('#sortSelect').addEventListener('change', (e) => { state.sort = e.target.value; state.page = 1; Shop.render(); });
      $('#viewGrid').addEventListener('click', () => Shop.setView('grid'));
      $('#viewList').addEventListener('click', () => Shop.setView('list'));
      $('#loadMoreBtn').addEventListener('click', () => { state.page++; Shop.render(true); });

      $('#activeFilters').addEventListener('click', (e) => {
        const c = e.target.closest('[data-rm]');
        if (!c) return;
        const [k, v] = c.getAttribute('data-rm').split(':');
        if (k === 'q') { state.q = ''; $('#shopSearch').value = ''; }
        else if (k === 'price') { state.min = bounds.min; state.max = bounds.max; }
        else if (k === 'inStock') state.inStock = false;
        else if (k === 'sale') state.sale = false;
        else { const arr = state[k]; const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); }
        Shop.buildFilters(); state.page = 1; Shop.render();
      });

      Shop.bindProducts();
    },

    bindProducts() { C.bind($('#pGrid')); },

    reset() {
      state.q = ''; state.cols = []; state.genders = []; state.straps = []; state.cases = [];
      state.min = bounds.min; state.max = bounds.max; state.inStock = false; state.sale = false; state.page = 1;
      $('#shopSearch').value = '';
      Shop.buildFilters(); Shop.render();
    },

    setView(v) {
      state.view = v;
      $('#pGrid').classList.toggle('list-view', v === 'list');
      $('#viewGrid').classList.toggle('active', v === 'grid');
      $('#viewList').classList.toggle('active', v === 'list');
    },

    /** external API: jump to a collection (called from collection cards) */
    setCollection(id, scroll) {
      state.cols = id ? [id] : [];
      state.page = 1;
      Shop.buildFilters(); Shop.render();
      if (scroll !== false) { const el = $('#shop'); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    },

    setSearch(q) {
      state.q = q; $('#shopSearch').value = q; state.page = 1; Shop.render();
      $('#shop').scrollIntoView({ behavior: 'smooth' });
    },

    /* ---------- filtering & sorting ---------- */
    query() {
      const q = U.toEn(state.q).trim().toLowerCase();
      let list = DB.products.active().filter((p) => {
        if (state.cols.length && state.cols.indexOf(p.collection) < 0) return false;
        if (state.genders.length && state.genders.indexOf(p.gender) < 0) return false;
        if (state.straps.length && state.straps.indexOf(p.spec && p.spec.strap) < 0) return false;
        if (state.cases.length && state.cases.indexOf(p.spec && p.spec.caseColor) < 0) return false;
        if (p.price < state.min || p.price > state.max) return false;
        if (state.inStock && p.stock <= 0) return false;
        if (state.sale && !(p.oldPrice > p.price)) return false;
        if (q) {
          const hay = [p.name, p.sku, C.collectionName(p.collection), C.collectionNameEn(p.collection), (p.tags || []).join(' '), p.desc, (p.details || {}).strap, (p.details || {}).caseMaterial].join(' ').toLowerCase();
          if (!q.split(/\s+/).every((w) => hay.indexOf(w) >= 0)) return false;
        }
        return true;
      });

      const by = {
        featured: (a, b) => (b.featured - a.featured) || (b.sold - a.sold),
        newest: (a, b) => b.createdAt - a.createdAt,
        bestseller: (a, b) => b.sold - a.sold,
        priceAsc: (a, b) => a.price - b.price,
        priceDesc: (a, b) => b.price - a.price,
        rating: (a, b) => b.rating - a.rating,
        discount: (a, b) => C.discountPercent(b) - C.discountPercent(a)
      };
      list.sort(by[state.sort] || by.featured);
      return list;
    },

    /* ---------- rendering ---------- */
    render(append) {
      const list = Shop.query();
      const shown = list.slice(0, state.page * PAGE);
      const grid = $('#pGrid');

      if (!list.length) {
        grid.innerHTML = '<div class="empty-state">' + VI('search') + '<h3>ساعتی با این مشخصات پیدا نشد</h3><p class="muted" style="margin:8px 0 18px">فیلترها را کمی تغییر دهید یا همه را پاک کنید.</p><button class="btn btn-primary" id="emptyReset">پاک‌کردن فیلترها</button></div>';
        const b = $('#emptyReset'); if (b) b.onclick = Shop.reset;
      } else if (append) {
        const start = (state.page - 1) * PAGE;
        grid.insertAdjacentHTML('beforeend', list.slice(start, state.page * PAGE).map(C.card).join(''));
      } else {
        grid.innerHTML = shown.map(C.card).join('');
      }

      $('#resultInfo').textContent = U.toFa(list.length) + ' ساعت پیدا شد';
      const left = list.length - shown.length;
      $('#loadMore').classList.toggle('hidden', left <= 0);
      $('#loadMoreInfo').textContent = 'نمایش ' + U.toFa(shown.length) + ' از ' + U.toFa(list.length) + ' ساعت';

      Shop.renderChips();
    },

    renderChips() {
      const chips = [];
      const colName = (id) => C.collectionName(id);
      if (state.q) chips.push(['q:', 'جستجو: ' + state.q]);
      state.cols.forEach((v) => chips.push(['cols:' + v, colName(v)]));
      state.genders.forEach((v) => chips.push(['genders:' + v, (GENDERS.find((g) => g[0] === v) || [])[1]]));
      state.straps.forEach((v) => chips.push(['straps:' + v, 'بند ' + (STRAPS.find((g) => g[0] === v) || [])[1]]));
      state.cases.forEach((v) => chips.push(['cases:' + v, 'بدنه ' + (CASES.find((g) => g[0] === v) || [])[1]]));
      if (state.min > bounds.min || state.max < bounds.max) chips.push(['price:', U.compact(state.min) + ' تا ' + U.compact(state.max)]);
      if (state.inStock) chips.push(['inStock:', 'موجود']);
      if (state.sale) chips.push(['sale:', 'تخفیف‌دار']);
      $('#activeFilters').innerHTML = chips.map((c) => '<button class="chip" data-rm="' + c[0] + '">' + U.esc(c[1]) + ' <i>✕</i></button>').join('');
    },

    init() {
      Shop.buildFilters();
      Shop.bindFilters();
      Shop.render();
      $('#viewGrid').innerHTML = VI('grid');
      $('#viewList').innerHTML = VI('list');
      $('#filterToggle').innerHTML = VI('filter') + 'فیلترها';
      $('#shopSearchIco').innerHTML = VI('search');
    },

    /** re-render after data changes (admin edits in another tab) */
    refresh() {
      Shop.buildFilters();
      Shop.render();
    }
  };

  Shop.renderDebounced = U.debounce(() => Shop.render(), 120);
  global.VShop = Shop;
})(window);
