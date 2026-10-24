/* ==========================================================
   Violet admin — app.js
   Login screen, shell wiring and live refresh when the
   storefront (another tab) receives orders or messages
   ========================================================== */
(function (global) {
  'use strict';

  const VA = global.VA, U = VA.U, DB = VA.DB, VI = VA.VI, $ = VA.$;

  function setTheme(t) {
    document.documentElement.setAttribute('data-theme', t);
    try { localStorage.setItem('violet_admin_theme', t); } catch (e) { /* ignore */ }
    $('#themeBtn').innerHTML = VI(t === 'light' ? 'moon' : 'sun');
  }

  function applyBrandColors() {
    const s = DB.settings.get(), r = document.documentElement.style;
    if (s.colorPrimary) r.setProperty('--primary', s.colorPrimary);
    if (s.colorAccent) r.setProperty('--accent', s.colorAccent);
    if (s.colorHot) r.setProperty('--hot', s.colorHot);
    r.setProperty('--grad', 'linear-gradient(135deg,' + (s.colorPrimary || '#8b3dff') + ' 0%,' + (s.colorHot || '#ff5fa2') + ' 100%)');
  }

  function showShell() {
    $('#login').classList.add('hidden');
    $('#shell').classList.remove('hidden');
    VA.buildNav();
    if (!location.hash) location.hash = '#/dashboard';
    VA.render();
  }

  function boot() {
    DB.init();
    applyBrandColors();
    $('#loginMark').innerHTML = global.VILogo; $('#sideMark').innerHTML = global.VILogo;
    $('#menuBtn').innerHTML = VI('menu');
    $('#viewSite').innerHTML = VI('external') + 'مشاهده‌ی فروشگاه';
    $('#logoutBtn').innerHTML = VI('logout') + 'خروج';

    let saved = null; try { saved = localStorage.getItem('violet_admin_theme'); } catch (e) { /* ignore */ }
    setTheme(saved || 'dark');
    $('#themeBtn').addEventListener('click', () => setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light'));

    if (DB.auth.info().changed) $('#loginHint').classList.add('hidden');

    /* login */
    $('#loginForm').addEventListener('submit', (e) => {
      e.preventDefault();
      if (DB.auth.login($('#lgUser').value, $('#lgPass').value)) { DB.log('security', 'ورود مدیر'); showShell(); }
      else { $('#loginErr').textContent = 'نام کاربری یا رمز عبور درست نیست.'; $('#lgPass').value = ''; $('#lgPass').focus(); }
    });
    $('#logoutBtn').addEventListener('click', () => { DB.auth.logout(); location.hash = ''; location.reload(); });

    /* shell */
    $('#menuBtn').addEventListener('click', VA.openSide);
    $('#sideBg').addEventListener('click', VA.closeSide);
    window.addEventListener('hashchange', () => { if (DB.auth.isLoggedIn()) VA.render(); });

    /* orders / messages arriving from the storefront in another tab */
    let t = null;
    window.addEventListener('storage', (e) => {
      if (!DB.auth.isLoggedIn() || !e.key || e.key.indexOf('violet:') !== 0 || e.key.indexOf('violet:v.') === 0) return;
      clearTimeout(t);
      t = setTimeout(() => {
        VA.refreshBadges();
        if (VA.current && VA.current.live && !VA.openModals) VA.rerender();
        if (e.key === 'violet:orders') VA.toast('سفارش جدید یا تغییری در سفارش‌ها ثبت شد.', 'info');
        if (e.key === 'violet:messages') VA.toast('پیام جدیدی رسید.', 'info');
      }, 300);
    });

    if (DB.auth.isLoggedIn()) showShell(); else $('#lgUser').focus();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})(window);
