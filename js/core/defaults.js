/* ==========================================================
   Violet — defaults.js
   Default settings, collections, coupons, testimonials, FAQ.
   Everything here can be edited later from the admin panel.
   ========================================================== */
(function (global) {
  'use strict';

  const DAY = 86400000;

  const VioletDefaults = {

    settings() {
      return {
        brand: 'Violet',
        brandFa: 'ویولت',
        slogan: 'زمان، با شکوهی بنفش',
        phone: '۰۲۱-۹۱۰۰۰۰۰۰',
        mobile: '09120000000',
        whatsapp: '989120000000',
        email: 'hello@violet-watch.com',
        address: 'تهران، خیابان ولیعصر، نرسیده به پارک ساعی، پلاک ۱۲۰',
        workingHours: 'همه روزه ۱۰ تا ۲۲',
        instagram: 'violet.watch',
        telegram: 'violet_watch',
        aparat: '',

        currency: 'تومان',
        shippingFee: 150000,
        freeShippingOver: 15000000,
        taxPercent: 0,
        giftWrapFee: 120000,
        orderPrefix: 'VL',
        payOnline: true,
        payCod: true,
        payCard: true,
        cardNumber: '6037-9900-0000-0000',
        cardOwner: 'شرکت ویولت',

        theme: 'dark',                 // dark | light
        colorPrimary: '#8b3dff',
        colorAccent: '#e8c27a',
        colorHot: '#ff5fa2',

        announcements: [
          'ارسال رایگان برای سفارش‌های بالای ۱۵ میلیون تومان',
          'گارانتی اصالت و ۵ سال ضمانت تعویض ویولت',
          'با کد VIOLET10 از ۱۰٪ تخفیف اولین خرید لذت ببرید',
          'بسته‌بندی هدیه لوکس برای همه سفارش‌ها'
        ],

        hero: {
          eyebrow: 'مجموعه پاییز ۲۰۲۶',
          title: 'زمان را بنفش ببین',
          subtitle: 'ساعت‌هایی که با دقت سوئیسی ساخته شده‌اند و با رنگ‌های جسورانه‌ی ویولت، هر لحظه‌ی شما را به یک صحنه‌ی لوکس تبدیل می‌کنند.',
          cta1: 'مشاهده‌ی مجموعه',
          cta2: 'ساعت روز',
          spec: {
            shape: 'round', caseColor: 'violet', dial: '#3a1878', dialStyle: 'sunburst',
            markers: 'baton', strap: 'leather', strapColor: '#150c26', handColor: '#f2dc9c', date: true
          }
        },

        stats: [
          { value: 72, suffix: '+', label: 'مدل ساعت منحصربه‌فرد' },
          { value: 12000, suffix: '+', label: 'مشتری راضی' },
          { value: 5, suffix: ' سال', label: 'گارانتی ویولت' },
          { value: 8, suffix: ' کلکسیون', label: 'طراحی‌شده در تهران' }
        ],

        trust: [
          { icon: 'shield', title: 'اصالت تضمینی', text: 'هر ساعت با کارت اصالت و شماره سریال اختصاصی تحویل می‌شود.' },
          { icon: 'truck', title: 'ارسال سریع و بیمه‌شده', text: 'ارسال به سراسر کشور با بیمه‌ی کامل و بسته‌بندی ضدضربه.' },
          { icon: 'return', title: '۷ روز بازگشت کالا', text: 'اگر راضی نبودید، تا ۷ روز بدون قید و شرط بازگردانید.' },
          { icon: 'support', title: 'پشتیبانی تخصصی', text: 'مشاوران ساعت پاسخگوی شما در واتساپ و تلفن هستند.' }
        ],

        story: {
          title: 'ما با زمان، شعر می‌نویسیم',
          text1: 'ویولت از یک دغدغه‌ی ساده شروع شد: چرا ساعت‌های خوب باید یا خیلی گران باشند یا خیلی شبیه هم؟ تیم ما سال‌ها در کارگاه‌های طراحی و مونتاژ ساعت کار کرد تا مجموعه‌ای بسازد که هم دقیق باشد، هم شخصیت داشته باشد.',
          text2: 'هر مدل ویولت از شیشه‌ی یاقوت کبود، بدنه‌ی استیل ۳۱۶ یا تیتانیوم و موومنت‌های تست‌شده استفاده می‌کند. ما به جزئیات اهمیت می‌دهیم؛ از صدای تیک‌تاک تا لحظه‌ای که جعبه را باز می‌کنید.',
          points: ['شیشه‌ی یاقوت کبود ضدخش', 'کوک اتوماتیک و کوارتز با دقت بالا', 'بدنه‌ی استیل ۳۱۶L و تیتانیوم', 'تست مقاومت در برابر آب تا ۲۰۰ متر']
        },

        deal: { enabled: true, productId: 'p019', endsAt: Date.now() + 3 * DAY + 5 * 3600000, discountPercent: 15, title: 'پیشنهاد ویژه‌ی امروز' },

        sections: {
          trust: true, collections: true, featured: true, deal: true,
          shop: true, story: true, testimonials: true, faq: true,
          newsletter: true, contact: true
        },

        testimonials: [
          { id: 't1', name: 'نیلوفر کاظمی', role: 'طراح داخلی', text: 'ساعت Orchid را برای تولدم هدیه گرفتم. جزئیات ساخت و رنگ رزگلدش از عکس هم زیباتر بود. بسته‌بندی واقعاً لوکس بود.', rating: 5 },
          { id: 't2', name: 'امیرحسین رضوی', role: 'مهندس نرم‌افزار', text: 'مونارک اتوماتیک را بعد از کلی مقایسه خریدم. دقتش عالی است و وزنش روی مچ حس خیلی خوبی دارد. پشتیبانی هم سریع جواب داد.', rating: 5 },
          { id: 't3', name: 'سارا مهرابی', role: 'عکاس', text: 'اولین بار بود از فروشگاه آنلاین ساعت می‌خریدم و نگران بودم. ولی سفارش سه روزه رسید و کارت اصالت و گارانتی کامل بود.', rating: 5 },
          { id: 't4', name: 'کامران آذر', role: 'مدیر فروش', text: 'فانتوم مشکی هر جا می‌روم جلب توجه می‌کند. کیفیت سرامیک و بند فوق‌العاده است. قیمت‌ها نسبت به کیفیت منصفانه است.', rating: 4 }
        ],

        faq: [
          { id: 'f1', q: 'ساعت‌های ویولت اصل و دارای گارانتی هستند؟', a: 'بله. همه‌ی ساعت‌ها با کارت اصالت، شماره سریال و ۵ سال گارانتی تعویض و خدمات پس از فروش ارائه می‌شوند.' },
          { id: 'f2', q: 'ارسال سفارش چقدر زمان می‌برد؟', a: 'سفارش‌های تهران ۱ تا ۲ روز کاری و سایر شهرها ۲ تا ۴ روز کاری تحویل داده می‌شوند. همه‌ی مرسوله‌ها بیمه هستند.' },
          { id: 'f3', q: 'اگر سایز بند مناسب مچ من نبود چه کنم؟', a: 'بندهای استیل و میلانز را به‌صورت رایگان توسط واحد خدمات ما تنظیم می‌کنیم. برای چرم و سیلیکون هم می‌توانید بند هم‌سایز تعویض کنید.' },
          { id: 'f3b', q: 'روش‌های پرداخت چیست؟', a: 'پرداخت آنلاین، کارت‌به‌کارت و پرداخت در محل (برای شهرهای منتخب) فعال است.' },
          { id: 'f4', q: 'امکان بازگشت کالا وجود دارد؟', a: 'تا ۷ روز پس از تحویل، در صورتی که ساعت استفاده نشده و بسته‌بندی کامل باشد، می‌توانید کالا را مرجوع کنید.' },
          { id: 'f5', q: 'ساعت‌ها ضدآب هستند؟', a: 'میزان مقاومت در برابر آب در مشخصات هر مدل ذکر شده است؛ از ۳۰ متر (ضد‌پاشش) تا ۲۰۰ متر (مناسب غواصی).' }
        ]
      };
    },

    collections() {
      return [
        { id: 'c_eclipse', slug: 'eclipse', name: 'اکلیپس', nameEn: 'Eclipse', tagline: 'کرونوگراف‌های اسپرت', desc: 'برای کسی که هر ثانیه را اندازه می‌گیرد. سه زیرصفحه، تاکیمتر و بدنه‌ای که در حرکت جان می‌گیرد.', c1: '#7c3aed', c2: '#22d3ee', order: 1, visible: true },
        { id: 'c_aurora', slug: 'aurora', name: 'آرورا', nameEn: 'Aurora', tagline: 'ساعت‌های لباس زنانه', desc: 'ظریف و درخشان. صفحه‌های صدفی و سان‌برست که با نور بازی می‌کنند.', c1: '#c084fc', c2: '#f9a8d4', order: 2, visible: true },
        { id: 'c_monarch', slug: 'monarch', name: 'مونارک', nameEn: 'Monarch', tagline: 'اتوماتیک‌های لوکس', desc: 'موومنت اتوماتیک، اعداد رومی و درخشش طلا؛ میراث ساعت‌سازی کلاسیک با نگاهی امروزی.', c1: '#e8c27a', c2: '#8b3dff', order: 3, visible: true },
        { id: 'c_phantom', slug: 'phantom', name: 'فانتوم', nameEn: 'Phantom', tagline: 'سرامیک و مشکی مطلق', desc: 'تاریک، سنگین و بی‌نقص. بدنه‌ی سرامیکی مقاوم در برابر خراش با جزئیات بنفش.', c1: '#111827', c2: '#a855f7', order: 4, visible: true },
        { id: 'c_orchid', slug: 'orchid', name: 'ارکید', nameEn: 'Orchid', tagline: 'رزگلد و گل‌های شب', desc: 'ظرافت رزگلد با بندهای چرم و میلانز. هدیه‌ای که فراموش نمی‌شود.', c1: '#f472b6', c2: '#fdba74', order: 5, visible: true },
        { id: 'c_nebula', slug: 'nebula', name: 'نبولا', nameEn: 'Nebula', tagline: 'ساعت‌های هوشمند', desc: 'نمایشگر AMOLED، ردیاب سلامت و اعلان‌ها؛ هوشمند اما با ظاهری اصیل.', c1: '#38bdf8', c2: '#8b3dff', order: 6, visible: true },
        { id: 'c_heritage', slug: 'heritage', name: 'هریتیج', nameEn: 'Heritage', tagline: 'کلاسیک‌های مینیمال', desc: 'خطوط ساده، چرم طبیعی و صفحه‌های تمیز؛ ساعتی برای همه‌ی فصل‌های زندگی.', c1: '#a78bfa', c2: '#fcd34d', order: 7, visible: true },
        { id: 'c_solstice', slug: 'solstice', name: 'سولستیس', nameEn: 'Solstice', tagline: 'خورشیدی و ماجراجو', desc: 'شارژ با نور، بدنه‌ی ضربه‌گیر و مقاومت در برابر آب تا ۲۰۰ متر.', c1: '#fb923c', c2: '#7c3aed', order: 8, visible: true }
      ];
    },

    coupons() {
      return [
        { id: 'cp1', code: 'VIOLET10', type: 'percent', value: 10, minOrder: 5000000, maxDiscount: 5000000, usageLimit: 0, used: 0, expires: 0, active: true, note: 'تخفیف اولین خرید' },
        { id: 'cp2', code: 'WELCOME', type: 'fixed', value: 500000, minOrder: 3000000, maxDiscount: 0, usageLimit: 0, used: 0, expires: 0, active: true, note: 'هدیه‌ی خوش‌آمدگویی' },
        { id: 'cp3', code: 'VIP20', type: 'percent', value: 20, minOrder: 30000000, maxDiscount: 20000000, usageLimit: 50, used: 0, expires: 0, active: true, note: 'ویژه‌ی مشتریان وفادار' }
      ];
    }
  };

  global.VioletDefaults = VioletDefaults;
})(window);
