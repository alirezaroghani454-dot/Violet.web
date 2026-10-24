/* ==========================================================
   Violet admin — settings-content.js
   Content tabs of "Site settings": brand story, trust strip,
   customer testimonials and FAQ
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, VI = VA.VI;
  const $ = VA.$;

  const ICONS = [['shield', 'سپر (اصالت)'], ['truck', 'کامیون (ارسال)'], ['return', 'بازگشت'], ['support', 'پشتیبانی'], ['gift', 'هدیه'], ['lock', 'قفل (امنیت)'], ['star', 'ستاره'], ['clock', 'ساعت'], ['sparkle', 'درخشش'], ['check', 'تیک'], ['percent', 'تخفیف'], ['watch', 'ساعت مچی']];

  /* ---------------- story + trust ---------------- */
  VA.registerSettingsTab('story', 'داستان و مزایا', (host, s) => {
    const st = s.story || {};
    const form = VA.settingsForm(host,
      '<div class="fieldset"><h4>داستان برند</h4>' + VA.in.text('story.title', 'عنوان', st.title) +
      VA.in.area('story.text1', 'پاراگراف اول', st.text1, { h: 100 }) + VA.in.area('story.text2', 'پاراگراف دوم', st.text2, { h: 100 }) +
      '<div class="field"><label>نکته‌های برجسته (با تیک نمایش داده می‌شود)</label><div id="ptsHost"></div></div></div>' +
      '<div class="fieldset"><h4>نوار مزایا (زیر بخش اصلی)</h4><p class="hint">معمولاً ۴ مورد بهترین نمایش را دارد.</p><div id="trustHost"></div></div>',
      (v) => { v.story.points = pts.get(); v.trust = trust.get(); return v; }, 'داستان و مزایا ویرایش شد');

    const pts = VA.listEditor($('#ptsHost', form), st.points || [], null, { simple: true, ph: 'مثلاً: شیشه‌ی یاقوت کبود ضدخش', addLabel: 'افزودن نکته', max: 8 });
    const trust = VA.listEditor($('#trustHost', form), s.trust || [], [
      { k: 'icon', label: 'آیکون', type: 'select', options: ICONS },
      { k: 'title', label: 'عنوان', type: 'text' },
      { k: 'text', label: 'توضیح کوتاه', type: 'textarea', wide: true }
    ], { addLabel: 'افزودن مزیت', max: 6, newItem: () => ({ icon: 'shield', title: '', text: '' }) });
  });

  /* ---------------- testimonials + FAQ ---------------- */
  VA.registerSettingsTab('voices', 'نظرها و سوالات', (host, s) => {
    const form = VA.settingsForm(host,
      '<div class="fieldset"><h4>نظر مشتریان (بخش اسلایدی صفحه‌ی اصلی)</h4><p class="hint">این‌ها نظرهای انتخابی برای صفحه‌ی اصلی هستند. نظرهایی که کاربران زیر هر محصول می‌نویسند از بخش «نظرات» مدیریت می‌شوند.</p><div id="tHost"></div></div>' +
      '<div class="fieldset"><h4>سوالات متداول</h4><div id="fHost"></div></div>',
      () => ({ testimonials: testi.get().map((t, i) => Object.assign({ id: 't' + (i + 1) }, t, { rating: U.clamp(Number(t.rating) || 5, 1, 5) })), faq: faq.get().map((f, i) => ({ id: 'f' + (i + 1), q: f.q, a: f.a })) }),
      'نظرها و سوالات متداول ویرایش شد');

    const testi = VA.listEditor($('#tHost', form), s.testimonials || [], [
      { k: 'name', label: 'نام', type: 'text' }, { k: 'role', label: 'شغل / توضیح', type: 'text' },
      { k: 'rating', label: 'امتیاز (۱ تا ۵)', type: 'number' }, { k: 'text', label: 'متن نظر', type: 'textarea', wide: true }
    ], { addLabel: 'افزودن نظر', max: 12, newItem: () => ({ name: '', role: '', rating: 5, text: '' }) });

    const faq = VA.listEditor($('#fHost', form), s.faq || [], [
      { k: 'q', label: 'سوال', type: 'text', wide: true }, { k: 'a', label: 'پاسخ', type: 'textarea', wide: true }
    ], { addLabel: 'افزودن سوال', max: 20, newItem: () => ({ q: '', a: '' }) });
  });
})(window);
