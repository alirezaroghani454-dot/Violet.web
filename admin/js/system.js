/* ==========================================================
   Violet admin — system.js
   Security (change login), backup / restore, reset, storage
   usage and a few maintenance tools
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;

  function storageUsage() {
    let bytes = 0;
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k.indexOf('violet:') === 0) bytes += (k.length + (localStorage.getItem(k) || '').length) * 2;
      }
    } catch (e) { /* ignore */ }
    return bytes;
  }

  function render(root) {
    const used = storageUsage(), limit = 5 * 1024 * 1024;
    const pct = Math.min(100, used / limit * 100);
    const info = DB.auth.info();

    root.innerHTML =
      '<div class="grid c2">' +

      '<div class="card"><h3>' + VI('key', 'ic-inline') + ' امنیت ورود</h3>' +
      (info.changed ? '' : '<div class="login-hint" style="margin-bottom:14px;border-color:var(--warn)">⚠ هنوز نام کاربری و رمز پیش‌فرض را تغییر نداده‌اید.</div>') +
      '<form class="form" id="pwForm" novalidate>' + VA.in.text('user', 'نام کاربری جدید', info.user, { ltr: true }) +
      VA.in.text('cur', 'رمز فعلی', '', { type: 'password', ltr: true }) + VA.in.text('pw1', 'رمز جدید (حداقل ۶ کاراکتر)', '', { type: 'password', ltr: true }) + VA.in.text('pw2', 'تکرار رمز جدید', '', { type: 'password', ltr: true }) +
      '<button class="btn btn-primary" type="submit">' + VI('lock') + 'تغییر اطلاعات ورود</button></form>' +
      '<p class="hint" style="margin-top:12px">توجه: این نسخه بدون سرور کار می‌کند و رمز فقط ورود به صفحه‌ی مدیریت را در همین مرورگر محدود می‌کند؛ برای یک سایت واقعی لازم است مدیریت و داده‌ها روی سرور و با احراز هویت واقعی باشند.</p></div>' +

      '<div class="card"><h3>' + VI('layers', 'ic-inline') + ' پشتیبان‌گیری و بازیابی</h3>' +
      '<p class="hint" style="margin-bottom:14px">همه‌ی محصولات، سفارش‌ها، تنظیمات و نظرها در یک فایل ذخیره می‌شود. قبل از هر تغییر بزرگ یا انتقال به مرورگر/رایانه‌ی دیگر پشتیبان بگیرید.</p>' +
      '<div class="toolbar"><button class="btn btn-primary" id="bkExport">' + VI('download') + 'دانلود فایل پشتیبان</button><button class="btn" id="bkImport">' + VI('upload') + 'بازیابی از فایل</button><input type="file" id="bkFile" accept="application/json,.json" hidden></div>' +
      '<div style="margin-top:22px"><div style="display:flex;justify-content:space-between;font-size:.86rem;margin-bottom:8px"><span>فضای ذخیره‌ی مرورگر</span><span class="muted">' + U.toFa((used / 1024).toFixed(0)) + ' از ' + U.toFa(5120) + ' کیلوبایت</span></div><div class="meter"><i style="width:' + pct + '%"></i></div>' +
      (pct > 70 ? '<p class="hint" style="margin-top:8px;color:var(--warn)">فضا رو به پایان است. از عکس‌های سنگین استفاده نکنید یا سفارش‌های قدیمی را خروجی بگیرید و حذف کنید.</p>' : '') + '</div></div>' +
      '</div>' +

      '<div class="card"><h3>' + VI('refresh', 'ic-inline') + ' نگهداری</h3><div class="toolbar">' +
      '<button class="btn" id="mtSite">' + VI('external') + 'مشاهده‌ی سایت</button>' +
      '<button class="btn" id="mtOrders">پاک‌کردن همه‌ی سفارش‌ها</button>' +
      '<button class="btn" id="mtLogs">پاک‌کردن رویدادها</button>' +
      '<button class="btn btn-danger" id="mtReset">بازگرداندن همه چیز به حالت اولیه</button></div>' +
      '<p class="hint" style="margin-top:12px">«حالت اولیه» محصولات، کلکسیون‌ها، کدهای تخفیف، تنظیمات و نظرها را به نسخه‌ی اولیه برمی‌گرداند. سفارش‌ها و پیام‌ها دست‌نخورده می‌مانند.</p></div>';

    $('#pwForm', root).addEventListener('submit', (e) => {
      e.preventDefault();
      const v = VA.collect(e.target);
      if (!DB.auth.verify(v.cur)) { VA.toast('رمز فعلی درست نیست.', 'error'); return; }
      if (String(v.user).trim().length < 3) { VA.toast('نام کاربری حداقل ۳ کاراکتر باشد.', 'error'); return; }
      if (v.pw1.length < 6) { VA.toast('رمز جدید حداقل ۶ کاراکتر باشد.', 'error'); return; }
      if (v.pw1 !== v.pw2) { VA.toast('تکرار رمز با رمز جدید یکی نیست.', 'error'); return; }
      DB.auth.change(v.user, v.pw1);
      DB.log('security', 'اطلاعات ورود مدیر تغییر کرد');
      VA.toast('اطلاعات ورود تغییر کرد.'); VA.rerender();
    });

    $('#bkExport', root).onclick = () => {
      U.download('violet-backup-' + new Date().toISOString().slice(0, 10) + '.json', DB.exportAll(), 'application/json');
      DB.log('system', 'فایل پشتیبان دانلود شد');
    };
    $('#bkImport', root).onclick = () => $('#bkFile', root).click();
    $('#bkFile', root).addEventListener('change', (e) => {
      const f = e.target.files[0]; if (!f) return;
      const rd = new FileReader();
      rd.onload = () => {
        try {
          const data = JSON.parse(rd.result);
          VA.confirm('اطلاعات فعلی با محتوای این فایل جایگزین می‌شود. ادامه می‌دهید؟', { danger: true, yes: 'بازیابی' }).then((ok) => {
            if (!ok) return;
            DB.importAll(data); DB.log('system', 'اطلاعات از فایل پشتیبان بازیابی شد');
            VA.toast('بازیابی انجام شد.'); VA.rerender();
          });
        } catch (err) { VA.toast(err.message || 'فایل معتبر نیست.', 'error'); }
      };
      rd.readAsText(f); e.target.value = '';
    });

    $('#mtSite', root).onclick = () => window.open('../index.html', '_blank');
    $('#mtOrders', root).onclick = () => VA.confirm('همه‌ی سفارش‌ها پاک شود؟ این کار برگشت‌پذیر نیست (از قبل پشتیبان بگیرید).', { danger: true, yes: 'پاک شود' }).then((ok) => { if (ok) { DB.orders.replace([]); DB.log('system', 'همه‌ی سفارش‌ها پاک شد'); VA.toast('سفارش‌ها پاک شد.'); VA.refreshBadges(); } });
    $('#mtLogs', root).onclick = () => { DB.write('logs', []); VA.toast('رویدادها پاک شد.', 'info'); };
    $('#mtReset', root).onclick = () => VA.confirm('همه‌ی محصولات، تنظیمات و کلکسیون‌ها به حالت اولیه برمی‌گردد و تغییرات شما از بین می‌رود. مطمئن هستید؟', { danger: true, yes: 'بازگردانی' }).then((ok) => {
      if (!ok) return; DB.reset(true); DB.init(); DB.log('system', 'داده‌ها به حالت اولیه بازگشت'); VA.toast('بازگردانی انجام شد.'); VA.rerender();
    });
  }

  VA.register('system', { title: 'امنیت و پشتیبان', icon: 'lock', group: 'سایت', render: render });
})(window);
