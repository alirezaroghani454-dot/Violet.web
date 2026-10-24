/* ==========================================================
   Violet — products-data.js
   72 seed products (8 collections x 9 models).
   Admin can edit / delete / add products later; this file is
   only used the first time the shop runs (or after "reset").
   ========================================================== */
(function (global) {
  'use strict';

  /* W(name, gender, price, caseColor, dial, dialStyle, markers, strap, strapColor, shape, hand, extra) */
  function W(name, gender, price, caseColor, dial, dialStyle, markers, strap, strapColor, shape, hand, extra) {
    return Object.assign({
      name: name, gender: gender, price: price,
      spec: {
        shape: shape || 'round', caseColor: caseColor, dial: dial, dialStyle: dialStyle,
        markers: markers, strap: strap, strapColor: strapColor, handColor: hand || '#f2dc9c',
        handStyle: 'sword', date: false
      }
    }, extra || {});
  }

  const D = (o) => o; // readability helper

  const LINES = {
    eclipse: {
      movement: 'quartz', glass: 'یاقوت کبود', water: 100, size: 43, thick: 13, caseMat: 'استیل ۳۱۶L',
      items: [
        W('Eclipse Nocturne', 'men', 28900000, 'black', '#14091f', 'chrono', 'baton', 'leather', '#120a1c', 'round', '#e9d6ff', { badge: 'bestseller' }),
        W('Eclipse Amethyst', 'men', 31500000, 'steel', '#4b1fa8', 'chrono', 'baton', 'steel', '#aab0bd', 'round', '#f4e9ff', { badge: 'new' }),
        W('Eclipse Solaris', 'men', 29800000, 'gold', '#1b1230', 'chrono', 'baton', 'leather', '#3b2410', 'round', '#f8dc8e'),
        W('Eclipse Velocity', 'unisex', 24500000, 'titanium', '#0f1d3a', 'chrono', 'dots', 'silicone', '#2a1b5e', 'round', '#cde6ff', { bezel: '#8b3dff' }),
        W('Eclipse Apex', 'men', 36900000, 'violet', '#0d0820', 'chrono', 'baton', 'ceramic', '#1a1030', 'round', '#e8d6ff', { badge: 'limited' }),
        W('Eclipse Quartz', 'men', 18900000, 'steel', '#22314f', 'chrono', 'dots', 'nato', '#3a1d78', 'round', '#f1f3ff', { oldPrice: 21500000, badge: 'sale' }),
        W('Eclipse Meridian', 'men', 33200000, 'rosegold', '#2a1636', 'chrono', 'baton', 'leather', '#3a1b2a', 'round', '#ffd9cb'),
        W('Eclipse Storm', 'men', 27400000, 'black', '#1a1a22', 'chrono', 'arabic', 'mesh', '#2d2d37', 'round', '#f0f0f6', { bezel: '#ff5fa2' }),
        W('Eclipse GT', 'unisex', 22900000, 'steel', '#ece8f8', 'chrono', 'baton', 'leather', '#5a2fa0', 'round', '#2b1a55', { markerColor: '#2b1a55', oldPrice: 25900000, badge: 'sale' })
      ]
    },
    aurora: {
      movement: 'quartz', glass: 'یاقوت کبود', water: 50, size: 32, thick: 8.5, caseMat: 'استیل ۳۱۶L',
      items: [
        W('Aurora Lilac', 'women', 12900000, 'steel', '#c9a8ff', 'sunburst', 'dots', 'leather', '#7b4bd8', 'round', '#ffffff', { markerColor: '#ffffff', badge: 'bestseller' }),
        W('Aurora Pearl', 'women', 14500000, 'gold', '#f6efe6', 'guilloche', 'roman', 'leather', '#d9c6a8', 'round', '#7a5a1e', { markerColor: '#7a5a1e' }),
        W('Aurora Mist', 'women', 11200000, 'rosegold', '#f7d5e6', 'sunburst', 'baton', 'mesh', '#dc9783', 'round', '#8a4a5c', { markerColor: '#8a4a5c', badge: 'new' }),
        W('Aurora Tank', 'women', 16800000, 'gold', '#fffaf0', 'plain', 'roman', 'leather', '#2a1636', 'rect', '#1a1030', { markerColor: '#1a1030' }),
        W('Aurora Petal', 'women', 9800000, 'steel', '#ffd6ec', 'guilloche', 'dots', 'leather', '#ff8fc4', 'round', '#ffffff', { markerColor: '#ffffff', oldPrice: 11500000, badge: 'sale' }),
        W('Aurora Midnight', 'women', 15200000, 'violet', '#1a0f38', 'galaxy', 'minimal', 'mesh', '#8d44ff', 'round', '#e8d6ff'),
        W('Aurora Square', 'women', 13600000, 'rosegold', '#fff1ea', 'sunburst', 'baton', 'steel', '#dc9783', 'square', '#8a5446', { markerColor: '#8a5446' }),
        W('Aurora Opal', 'women', 17400000, 'steel', '#dff4ff', 'guilloche', 'dots', 'ceramic', '#e8e6f2', 'round', '#3a5a8a', { markerColor: '#3a5a8a', badge: 'new' }),
        W('Aurora Bloom', 'women', 10500000, 'gold', '#f9e0f2', 'sunburst', 'arabic', 'leather', '#b86aa5', 'octagon', '#7a3d68', { markerColor: '#7a3d68' })
      ]
    },
    monarch: {
      movement: 'automatic', glass: 'یاقوت کبود', water: 50, size: 40, thick: 11, caseMat: 'استیل ۳۱۶L پوشش PVD',
      items: [
        W('Monarch Regent', 'men', 46500000, 'gold', '#1c1236', 'guilloche', 'roman', 'leather', '#1c1230', 'round', '#f8dc8e', { date: true, badge: 'bestseller' }),
        W('Monarch Sovereign', 'men', 52800000, 'steel', '#10122b', 'moon', 'roman', 'leather', '#241a46', 'round', '#f4f4fb', { badge: 'limited' }),
        W('Monarch Crest', 'men', 38400000, 'steel', '#ece8f8', 'sunburst', 'baton', 'steel', '#aab0bd', 'round', '#241a46', { date: true, markerColor: '#241a46' }),
        W('Monarch Duke', 'men', 41200000, 'gold', '#3a1878', 'sunburst', 'baton', 'leather', '#3b2410', 'round', '#fff3c9', { date: true, badge: 'new' }),
        W('Monarch Skeleton', 'men', 68900000, 'rosegold', '#120a22', 'skeleton', 'none', 'leather', '#2a1636', 'round', '#ffd9cb', { badge: 'limited' }),
        W('Monarch Empress', 'women', 34900000, 'gold', '#f6efe6', 'guilloche', 'roman', 'leather', '#7a4a2a', 'round', '#6f4c14', { date: true, markerColor: '#6f4c14' }),
        W('Monarch Baron', 'men', 36200000, 'titanium', '#1b2540', 'guilloche', 'arabic', 'mesh', '#80848f', 'round', '#e6f0ff', { date: true, oldPrice: 41000000, badge: 'sale' }),
        W('Monarch Royale', 'men', 59800000, 'gold', '#0c0820', 'moon', 'roman', 'leather', '#0f0a1c', 'round', '#f8dc8e'),
        W('Monarch Prince', 'men', 33500000, 'steel', '#5b2bc4', 'guilloche', 'baton', 'leather', '#1c1230', 'octagon', '#ffffff', { date: true })
      ]
    },
    phantom: {
      movement: 'automatic', glass: 'یاقوت کبود ضدانعکاس', water: 200, size: 44, thick: 14, caseMat: 'سرامیک فنی مشکی',
      items: [
        W('Phantom Zero', 'men', 54900000, 'black', '#07050d', 'plain', 'baton', 'ceramic', '#0f0f15', 'round', '#c08bff', { badge: 'bestseller' }),
        W('Phantom Shadow', 'men', 48500000, 'black', '#0c0a16', 'guilloche', 'dots', 'leather', '#0f0a1c', 'round', '#e8d6ff', { date: true }),
        W('Phantom Skeleton', 'men', 72900000, 'black', '#0a0614', 'skeleton', 'none', 'ceramic', '#15151c', 'round', '#b07bff', { badge: 'limited' }),
        W('Phantom Raven', 'men', 39800000, 'black', '#1a1022', 'chrono', 'baton', 'silicone', '#15101f', 'round', '#ff9ccb', { bezel: '#ff5fa2', badge: 'new' }),
        W('Phantom Onyx', 'men', 44200000, 'black', '#0a0a10', 'sunburst', 'roman', 'mesh', '#1b1b22', 'octagon', '#d8c6ff', { date: true }),
        W('Phantom Void', 'unisex', 36400000, 'black', '#120826', 'galaxy', 'minimal', 'leather', '#0b0814', 'round', '#f0e6ff', { seed: 311, oldPrice: 41900000, badge: 'sale' }),
        W('Phantom Eclipse', 'men', 58300000, 'black', '#06040c', 'moon', 'baton', 'ceramic', '#101017', 'round', '#c9a8ff'),
        W('Phantom Stealth', 'men', 31900000, 'black', '#101018', 'plain', 'dots', 'nato', '#1c1c26', 'square', '#cfd2dc'),
        W('Phantom Nightfall', 'men', 49600000, 'black', '#150a2e', 'guilloche', 'baton', 'ceramic', '#17101f', 'round', '#b07bff', { date: true })
      ]
    },
    orchid: {
      movement: 'quartz', glass: 'یاقوت کبود', water: 30, size: 30, thick: 8, caseMat: 'استیل رزگلد PVD',
      items: [
        W('Orchid Blush', 'women', 13400000, 'rosegold', '#fbe0e8', 'sunburst', 'roman', 'leather', '#f2b8c6', 'round', '#8a4a5c', { markerColor: '#8a4a5c', badge: 'bestseller' }),
        W('Orchid Noir', 'women', 15900000, 'rosegold', '#1a0f22', 'guilloche', 'dots', 'mesh', '#dc9783', 'round', '#ffd9cb'),
        W('Orchid Rose', 'women', 11800000, 'rosegold', '#fff1ea', 'plain', 'baton', 'leather', '#c4707f', 'rect', '#8a5446', { markerColor: '#8a5446' }),
        W('Orchid Dusk', 'women', 17200000, 'rosegold', '#3a1a4a', 'galaxy', 'minimal', 'leather', '#2a1636', 'round', '#ffd9cb', { seed: 52, badge: 'new' }),
        W('Orchid Silk', 'women', 12600000, 'gold', '#fdf3df', 'sunburst', 'dots', 'mesh', '#d9ab4c', 'round', '#7a5a1e', { markerColor: '#7a5a1e' }),
        W('Orchid Charm', 'women', 9600000, 'rosegold', '#ffd1e3', 'guilloche', 'arabic', 'leather', '#ff8fb8', 'square', '#8a3c62', { markerColor: '#8a3c62', oldPrice: 11200000, badge: 'sale' }),
        W('Orchid Pearl', 'women', 18900000, 'rosegold', '#f7f2ee', 'moon', 'roman', 'steel', '#dc9783', 'round', '#8a5446', { markerColor: '#8a5446', badge: 'limited' }),
        W('Orchid Garden', 'women', 14300000, 'rosegold', '#e6d1ff', 'sunburst', 'baton', 'ceramic', '#f3dfe6', 'octagon', '#5a2fa0', { markerColor: '#5a2fa0' }),
        W('Orchid Velvet', 'women', 16100000, 'rosegold', '#5a1f4a', 'guilloche', 'dots', 'leather', '#3a1030', 'round', '#ffd9cb', { badge: 'new' })
      ]
    },
    nebula: {
      movement: 'smart', glass: 'شیشه‌ی سخت ضدخش', water: 50, size: 42, thick: 11, caseMat: 'آلومینیوم هوافضا',
      items: [
        W('Nebula One', 'unisex', 15900000, 'steel', '#05050a', 'digital', 'none', 'silicone', '#2a1b5e', 'square', '#ffffff', { badge: 'bestseller', features: ['نمایشگر AMOLED ۱.۵ اینچ', 'باتری ۷ روزه', 'ردیاب ضربان و اکسیژن خون', 'GPS داخلی'] }),
        W('Nebula Pro', 'men', 24900000, 'titanium', '#05050a', 'digital', 'none', 'silicone', '#15151c', 'square', '#ffffff', { badge: 'new', features: ['بدنه‌ی تیتانیوم', 'نمایشگر ۱۰۰۰ نیت', 'ECG و فشار خون', 'GPS دوفرکانس'] }),
        W('Nebula Mini', 'women', 12400000, 'rosegold', '#05050a', 'digital', 'none', 'leather', '#f2b8c6', 'rect', '#ffffff', { features: ['طراحی سبک ۳۲ گرمی', 'پایش خواب و استرس', 'اعلان‌های هوشمند', 'ضدآب ۵۰ متر'] }),
        W('Nebula Sport', 'men', 17600000, 'black', '#05050a', 'digital', 'none', 'nato', '#8b3dff', 'square', '#ffffff', { features: ['۱۰۰+ حالت ورزشی', 'باتری ۱۰ روزه', 'قطب‌نما و ارتفاع‌سنج', 'ضدضربه نظامی'] }),
        W('Nebula Luxe', 'unisex', 29500000, 'gold', '#05050a', 'digital', 'none', 'leather', '#1a1030', 'round', '#ffffff', { badge: 'limited', features: ['بدنه‌ی آبکاری طلایی', 'شیشه‌ی یاقوت کبود', 'پرداخت NFC', 'نمایشگر همیشه روشن'] }),
        W('Nebula Air', 'women', 10900000, 'steel', '#05050a', 'digital', 'none', 'mesh', '#aab0bd', 'rect', '#ffffff', { oldPrice: 12500000, badge: 'sale', features: ['فوق‌سبک و باریک', 'شارژ مغناطیسی', 'اعلان تماس و پیام', 'پایش چرخه‌ی سلامت'] }),
        W('Nebula Active', 'unisex', 14200000, 'violet', '#05050a', 'digital', 'none', 'silicone', '#471a94', 'square', '#ffffff', { features: ['مسیریابی آفلاین', 'ردیاب شنا', 'میکروفون و اسپیکر', 'شارژ سریع ۴۵ دقیقه‌ای'] }),
        W('Nebula Titan', 'men', 32900000, 'titanium', '#05050a', 'digital', 'none', 'ceramic', '#4b4e57', 'octagon', '#ffffff', { badge: 'new', features: ['بدنه‌ی تیتانیوم درجه ۵', 'باتری ۱۴ روزه', 'نقشه‌ی توپوگرافی', 'مقاومت تا ۱۰۰ متر'] }),
        W('Nebula Pulse', 'unisex', 13700000, 'black', '#05050a', 'digital', 'none', 'silicone', '#ff5fa2', 'square', '#ffffff', { features: ['پایش ۲۴ ساعته‌ی ضربان', 'ردیاب خواب پیشرفته', 'تایمر و آلارم هوشمند', 'ضدآب ۵۰ متر'] })
      ]
    },
    heritage: {
      movement: 'quartz', glass: 'یاقوت کبود', water: 50, size: 38, thick: 8.5, caseMat: 'استیل ۳۱۶L',
      items: [
        W('Heritage Classic', 'unisex', 8900000, 'steel', '#f4f1fa', 'plain', 'baton', 'leather', '#2a1b5e', 'round', '#241a46', { markerColor: '#241a46', badge: 'bestseller' }),
        W('Heritage Slim', 'men', 9800000, 'gold', '#fbf4e4', 'plain', 'minimal', 'leather', '#3b2410', 'round', '#6f4c14', { markerColor: '#6f4c14' }),
        W('Heritage Noir', 'men', 10400000, 'steel', '#0d0a18', 'plain', 'baton', 'leather', '#0f0a1c', 'round', '#f4f4fb'),
        W('Heritage Amethyst', 'unisex', 9200000, 'steel', '#6a3dd6', 'sunburst', 'dots', 'leather', '#1c1230', 'round', '#ffffff', { badge: 'new' }),
        W('Heritage Square', 'unisex', 11200000, 'steel', '#ece8f8', 'plain', 'roman', 'leather', '#241a46', 'square', '#241a46', { markerColor: '#241a46' }),
        W('Heritage Tank', 'women', 10100000, 'gold', '#fffaf0', 'plain', 'roman', 'leather', '#7a4a2a', 'rect', '#3b2410', { markerColor: '#3b2410', oldPrice: 11900000, badge: 'sale' }),
        W('Heritage Date', 'men', 11800000, 'steel', '#1b2540', 'sunburst', 'baton', 'steel', '#aab0bd', 'round', '#f4f4fb', { date: true }),
        W('Heritage Minimal', 'unisex', 7900000, 'titanium', '#e4e2ec', 'plain', 'none', 'mesh', '#80848f', 'round', '#241a46', { markerColor: '#241a46' }),
        W('Heritage Atelier', 'women', 10700000, 'rosegold', '#f7e8e4', 'guilloche', 'arabic', 'leather', '#a86a62', 'octagon', '#6a3a34', { markerColor: '#6a3a34' })
      ]
    },
    solstice: {
      movement: 'solar', glass: 'یاقوت کبود ضدانعکاس', water: 200, size: 44, thick: 12.5, caseMat: 'تیتانیوم درجه ۲',
      items: [
        W('Solstice Dawn', 'men', 21900000, 'titanium', '#2a1450', 'sunburst', 'baton', 'silicone', '#fb923c', 'round', '#fff0d6', { bezel: '#fb923c', date: true, badge: 'bestseller' }),
        W('Solstice Dusk', 'men', 23400000, 'titanium', '#140a2a', 'sunburst', 'baton', 'silicone', '#8b3dff', 'round', '#ffd9ff', { bezel: '#8b3dff', date: true }),
        W('Solstice Trail', 'unisex', 19800000, 'black', '#1c1c22', 'plain', 'arabic', 'nato', '#fb923c', 'round', '#ffffff', { bezel: '#fb923c', badge: 'new' }),
        W('Solstice Dive 200', 'men', 27600000, 'steel', '#0a1f3a', 'sunburst', 'dots', 'steel', '#aab0bd', 'round', '#e6f4ff', { bezel: '#1d6fd1', date: true, badge: 'limited' }),
        W('Solstice Summit', 'men', 24800000, 'titanium', '#1c2a18', 'plain', 'baton', 'nato', '#3b5a2a', 'round', '#f0ffe0', { oldPrice: 27900000, badge: 'sale' }),
        W('Solstice Coral', 'women', 16800000, 'rosegold', '#ffd6c4', 'sunburst', 'dots', 'silicone', '#fb923c', 'round', '#8a4a2c', { bezel: '#f4a58a', markerColor: '#8a4a2c' }),
        W('Solstice Chrono', 'men', 26200000, 'black', '#14091f', 'chrono', 'baton', 'silicone', '#2a1b5e', 'round', '#fb923c', { bezel: '#fb923c' }),
        W('Solstice Horizon', 'unisex', 18400000, 'steel', '#dff4ff', 'sunburst', 'baton', 'mesh', '#80848f', 'round', '#16405a', { markerColor: '#16405a', bezel: '#38bdf8' }),
        W('Solstice Ember', 'men', 22700000, 'violet', '#2a0f2a', 'galaxy', 'arabic', 'silicone', '#fb923c', 'octagon', '#ffe6cf', { seed: 904, badge: 'new' })
      ]
    }
  };

  const COLL_ID = {
    eclipse: 'c_eclipse', aurora: 'c_aurora', monarch: 'c_monarch', phantom: 'c_phantom',
    orchid: 'c_orchid', nebula: 'c_nebula', heritage: 'c_heritage', solstice: 'c_solstice'
  };

  const STRAP_FA = { leather: 'چرم طبیعی', silicone: 'سیلیکون پزشکی', steel: 'استیل لینک', mesh: 'میلانز استیل', ceramic: 'سرامیک', nato: 'پارچه‌ی نایلونی' };
  const CASE_FA = { steel: 'استیل', gold: 'طلایی', rosegold: 'رزگلد', violet: 'بنفش', black: 'مشکی', titanium: 'تیتانیوم' };
  const MOVE_FA = { quartz: 'کوارتز سوئیسی', automatic: 'اتوماتیک ۲۱ جواهر', smart: 'هوشمند', solar: 'خورشیدی' };
  const STYLE_FA = { plain: 'ساده و تمیز', sunburst: 'سان‌برست', guilloche: 'گیوشه‌ی دستی', chrono: 'کرونوگراف سه‌زیرصفحه', skeleton: 'اسکلتون', galaxy: 'کهکشانی', moon: 'فاز ماه', digital: 'AMOLED' };

  const WATCH_FEATURES = {
    quartz: ['موومنت کوارتز سوئیسی با دقت ±۱۰ ثانیه در ماه', 'شیشه‌ی یاقوت کبود ضدخش', 'کارت اصالت و شماره سریال'],
    automatic: ['موومنت اتوماتیک با ذخیره‌ی ۴۰ ساعته', 'پشت شفاف برای دیدن موومنت', 'تاج پیچی مقاوم در برابر آب'],
    smart: [],
    solar: ['شارژ با نور خورشید و لامپ', 'ذخیره‌ی انرژی تا ۶ ماه در تاریکی', 'مقاوم در برابر ضربه و آب']
  };

  const FA = '۰۱۲۳۴۵۶۷۸۹';
  function U_FA(n) { return String(n).replace(/\d/g, (d) => FA[d]).replace('.', '٫'); }

  function build() {
    const out = [];
    let idx = 0;
    const base = Date.now();
    Object.keys(LINES).forEach((key) => {
      const line = LINES[key];
      line.items.forEach((it, i) => {
        idx++;
        const spec = it.spec;
        if (it.bezel) spec.bezel = it.bezel;
        if (it.markerColor) spec.markerColor = it.markerColor;
        if (it.date) spec.date = true;
        if (it.seed) spec.seed = it.seed;
        const moveKey = line.movement;
        const strapFa = STRAP_FA[spec.strap];
        const rating = Math.min(4.9, 4.2 + ((idx * 37) % 8) / 10);
        const feats = it.features || WATCH_FEATURES[moveKey].concat([
          'بند ' + strapFa,
          'سبک ' + STYLE_FA[spec.dialStyle]
        ]);
        const sold = 20 + ((idx * 71) % 380);
        const size = spec.shape === 'rect' ? line.size - 4 : line.size;
        const POWER = { quartz: 'باتری ۵ ساله', automatic: 'کوک خودکار (اتوماتیک)', smart: 'باتری لیتیوم قابل شارژ', solar: 'شارژ خورشیدی' };
        const weight = Math.round(size * 1.9 + (spec.strap === 'steel' || spec.strap === 'mesh' || spec.strap === 'ceramic' ? 62 : 8));
        const badges = [];
        if (it.badge) badges.push(it.badge);
        out.push({
          id: 'p' + String(idx).padStart(3, '0'),
          sku: 'VL-' + key.slice(0, 3).toUpperCase() + '-' + String(100 + idx),
          name: it.name,
          collection: COLL_ID[key],
          gender: it.gender,
          price: it.price,
          oldPrice: it.oldPrice || 0,
          stock: idx % 13 === 0 ? 0 : (idx % 7 === 0 ? 2 : 4 + ((idx * 5) % 15)),
          badges: badges,
          active: true,
          featured: idx % 6 === 1 || badges.indexOf('bestseller') >= 0,
          rating: Math.round(rating * 10) / 10,
          reviewsCount: 8 + ((idx * 53) % 190),
          sold: sold,
          createdAt: base - (72 - idx) * 86400000 * 1.7,
          images: [],
          tags: [CASE_FA[spec.caseColor], strapFa, STYLE_FA[spec.dialStyle]],
          details: {
            movement: MOVE_FA[moveKey],
            power: POWER[moveKey],
            caseSize: U_FA(size) + ' میلی‌متر',
            thickness: U_FA(line.thick) + ' میلی‌متر',
            caseMaterial: line.caseMat,
            glass: line.glass,
            water: U_FA(line.water) + ' متر',
            strap: strapFa,
            weight: U_FA(weight) + ' گرم',
            warranty: '۵ سال گارانتی ویولت'
          },
          desc: it.name + ' از مجموعه‌ی ' + key.charAt(0).toUpperCase() + key.slice(1) +
            ' با بدنه‌ی ' + CASE_FA[spec.caseColor] + '، صفحه‌ی ' + STYLE_FA[spec.dialStyle] +
            ' و بند ' + strapFa + ' ساخته شده است. ' + (moveKey === 'smart'
              ? 'این مدل هوشمند، ظاهر یک ساعت لوکس را با امکانات روزمره ترکیب می‌کند.'
              : 'طراحی متعادل و جزئیات دقیق آن، آن را برای استفاده‌ی روزانه و مناسبت‌های خاص مناسب می‌کند.'),
          features: feats,
          spec: spec
        });
      });
    });
    return out;
  }

  global.VioletProducts = { build: build, LINES: LINES };
})(window);
