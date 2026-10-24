/* ==========================================================
   Violet — icons.js
   Inline SVG icon set (stroke icons, 24x24, currentColor)
   Usage: VI('cart')  ->  '<svg ...>...</svg>'
   ========================================================== */
(function (global) {
  'use strict';

  const P = {
    cart: '<circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2.5 3h2.6l2.3 11.2a1.6 1.6 0 0 0 1.6 1.3h8.6a1.6 1.6 0 0 0 1.6-1.2L21 7.5H6"/>',
    heart: '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="m20.5 20.5-4.300-4.300"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c.6-4 3.800-6 8-6s7.400 2 8 6"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
    close: '<path d="M6 6l12 12M18 6 6 18"/>',
    sun: '<circle cx="12" cy="12" r="4.200"/><path d="M12 2.500v2.200M12 19.300v2.200M2.500 12h2.200M19.300 12h2.200M5.300 5.300l1.500 1.500M17.200 17.200l1.500 1.500M5.300 18.700l1.500-1.500M17.200 6.800l1.500-1.500"/>',
    moon: '<path d="M20.500 14.500A8.500 8.500 0 0 1 9.500 3.500a8.500 8.500 0 1 0 11 11z"/>',
    truck: '<path d="M2 6.500h11v10H2zM13 10h4.500l3.500 3.500v3H13z"/><circle cx="6.500" cy="18" r="1.800"/><circle cx="17" cy="18" r="1.800"/>',
    shield: '<path d="M12 2.500 4 5.500v6c0 5 3.200 8.600 8 10 4.800-1.400 8-5 8-10v-6z"/><path d="m8.500 12 2.500 2.500 4.500-5"/>',
    return: '<path d="M4 9h11a5 5 0 0 1 0 10H8"/><path d="m8 5-4 4 4 4"/>',
    support: '<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><rect x="3" y="14" width="4" height="6" rx="1.500"/><rect x="17" y="14" width="4" height="6" rx="1.500"/><path d="M19 20c0 1.200-1.500 2-4 2h-2"/>',
    star: '<path d="m12 2.500 2.900 6 6.600.9-4.800 4.600 1.200 6.500L12 17.300 6.100 20.500l1.200-6.500L2.500 9.400l6.600-.9z" fill="currentColor" stroke="none"/>',
    check: '<path d="m5 12.500 4.500 4.500L19 7.500"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    minus: '<path d="M5 12h14"/>',
    trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
    arrowL: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    arrowUp: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    arrowDown: '<path d="M12 5v14M19 12l-7 7-7-7"/>',
    arrowR: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    chevD: '<path d="m6 9 6 6 6-6"/>',
    chevL: '<path d="m15 6-6 6 6 6"/>',
    chevR: '<path d="m9 6 6 6-6 6"/>',
    eye: '<path d="M2 12s3.500-7 10-7 10 7 10 7-3.500 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    compare: '<path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4"/>',
    filter: '<path d="M3 5h18l-7 8v6l-4-2v-4z"/>',
    grid: '<rect x="3" y="3" width="7.500" height="7.500" rx="1.500"/><rect x="13.500" y="3" width="7.500" height="7.500" rx="1.500"/><rect x="3" y="13.500" width="7.500" height="7.500" rx="1.500"/><rect x="13.500" y="13.500" width="7.500" height="7.500" rx="1.500"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3.500 6h.01M3.500 12h.01M3.500 18h.01"/>',
    phone: '<path d="M5 4h4l2 5-2.500 1.500a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>',
    mail: '<rect x="3" y="5" width="18" height="14" rx="2.500"/><path d="m3.500 7 8.500 6 8.500-6"/>',
    pin: '<path d="M12 21s7-6.100 7-11.500A7 7 0 0 0 5 9.500C5 14.900 12 21 12 21z"/><circle cx="12" cy="9.500" r="2.500"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.500 2"/>',
    gift: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M5 12v9h14v-9M12 8v13M12 8C9 8 7 6.500 7.500 5S10.500 4 12 8c1.500-4 3.500-4.500 4.500-3S15 8 12 8z"/>',
    tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.500" cy="8.500" r="1.200"/>',
    box: '<path d="M3 7.500 12 3l9 4.500v9L12 21l-9-4.500z"/><path d="m3 7.500 9 4.500 9-4.500M12 12v9"/>',
    watch: '<rect x="6.500" y="6.500" width="11" height="11" rx="5.500"/><path d="M9 6.500 9.700 2.500h4.600l.7 4M9 17.500l.7 4h4.600l.7-4M12 10v2.500l1.800 1"/>',
    sparkle: '<path d="M12 3l1.800 5.200L19 10l-5.200 1.800L12 17l-1.800-5.200L5 10l5.200-1.800zM19 15l.8 2.200 2.200.8-2.200.8L19 21l-.8-2.200-2.200-.8 2.200-.8z"/>',
    lock: '<rect x="4.500" y="10.500" width="15" height="10" rx="2.500"/><path d="M8 10.500V8a4 4 0 0 1 8 0v2.500"/>',
    share: '<circle cx="18" cy="5.500" r="2.500"/><circle cx="6" cy="12" r="2.500"/><circle cx="18" cy="18.500" r="2.500"/><path d="m8.200 10.800 7.600-4M8.200 13.200l7.600 4"/>',
    copy: '<rect x="9" y="9" width="11" height="11" rx="2.500"/><path d="M5 15V6a2 2 0 0 1 2-2h8"/>',
    edit: '<path d="M4 20h4L19.500 8.500a2.800 2.800 0 0 0-4-4L4 16z"/><path d="m14 6 4 4"/>',
    download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
    upload: '<path d="M12 16V5M7 9l5-5 5 5M4 20h16"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M19.400 15a1.700 1.700 0 0 0 .3 1.800l.1.100a2 2 0 1 1-2.800 2.800l-.1-.1a1.700 1.700 0 0 0-1.800-.3 1.700 1.700 0 0 0-1 1.500V21a2 2 0 1 1-4 0v-.1a1.700 1.700 0 0 0-1.100-1.500 1.700 1.700 0 0 0-1.800.3l-.1.100a2 2 0 1 1-2.800-2.800l.1-.1a1.700 1.700 0 0 0 .3-1.800 1.700 1.700 0 0 0-1.500-1H3a2 2 0 1 1 0-4h.1a1.700 1.700 0 0 0 1.500-1.100 1.700 1.700 0 0 0-.3-1.800l-.1-.1a2 2 0 1 1 2.800-2.800l.1.100a1.700 1.700 0 0 0 1.800.3h0a1.700 1.700 0 0 0 1-1.500V3a2 2 0 1 1 4 0v.1a1.700 1.700 0 0 0 1 1.500h0a1.700 1.700 0 0 0 1.800-.3l.1-.1a2 2 0 1 1 2.800 2.800l-.1.100a1.700 1.700 0 0 0-.3 1.800v0a1.700 1.700 0 0 0 1.500 1H21a2 2 0 1 1 0 4h-.1a1.700 1.700 0 0 0-1.500 1z"/>',
    dashboard: '<rect x="3" y="3" width="8" height="10" rx="2"/><rect x="13" y="3" width="8" height="6" rx="2"/><rect x="13" y="11" width="8" height="10" rx="2"/><rect x="3" y="15" width="8" height="6" rx="2"/>',
    orders: '<path d="M6 3h12l2 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7z"/><path d="M4 7h16M9 11a3 3 0 0 0 6 0"/>',
    users: '<circle cx="9" cy="8" r="3.500"/><path d="M2.500 20c.5-3.500 3-5.500 6.500-5.500s6 2 6.500 5.500"/><path d="M16 4.500a3.500 3.500 0 0 1 0 7M18 14.800c2 .6 3.200 2.300 3.500 5.200"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    trend: '<path d="m3 17 6-6 4 4 8-9"/><path d="M15 6h6v6"/>',
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    logout: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
    image: '<rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.800"/><path d="m21 16-5-5-8 8"/>',
    percent: '<path d="M19 5 5 19"/><circle cx="7" cy="7" r="2.500"/><circle cx="17" cy="17" r="2.500"/>',
    message: '<path d="M4 5h16a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9l-5 4V6a1 1 0 0 1 1-1z"/>',
    home: '<path d="m3 11 9-8 9 8M5 9.500V20h5v-6h4v6h5V9.500"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    alert: '<path d="M12 3 2 20h20z"/><path d="M12 10v4.500M12 17.500h.01"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5.500M12 7.500h.01"/>',
    flame: '<path d="M12 2c.5 3.500-3 5.500-3 9.500a3 3 0 0 0 6 0c0-1-.5-2-1-2.500 2.500 1 4.500 3.500 4.500 6.500a6.500 6.500 0 0 1-13 0C5.500 9 10 7 12 2z"/>',
    camera: '<path d="M4 8h3l2-3h6l2 3h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/><circle cx="12" cy="13.500" r="3.500"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.500-5.800M20 4v5h-5"/>',
    drag: '<path d="M9 5h.01M15 5h.01M9 12h.01M15 12h.01M9 19h.01M15 19h.01"/>',
    save: '<path d="M5 3h11l4 4v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z"/><path d="M8 3v5h7V3M8 21v-7h8v7"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    key: '<circle cx="8" cy="15" r="4.500"/><path d="m11.500 12 9-9M17 7l3 3M15 9l2 2"/>',
    refresh: '<path d="M4 4v5h5M20 20v-5h-5"/><path d="M5.500 15A8 8 0 0 0 20 12M18.500 9A8 8 0 0 0 4 12"/>',
    layers: '<path d="m12 3 9 5-9 5-9-5zM3 13l9 5 9-5M3 17.500l9 5 9-5"/>'
  };

  // brand glyphs (filled)
  const BRAND = {
    whatsapp: '<path fill="currentColor" stroke="none" d="M12 2a10 10 0 0 0-8.600 15.100L2 22l5-1.300A10 10 0 1 0 12 2zm5.200 14c-.2.600-1.300 1.200-1.800 1.200-.5.100-1 .200-3.300-.700-2.800-1.100-4.600-3.900-4.700-4.100-.1-.2-1.100-1.500-1.100-2.800s.7-2 1-2.300c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.300 0 .500l-.3.400-.4.400c-.2.200-.3.300-.1.700.2.300.9 1.500 2 2.400 1.400 1.200 2.500 1.600 2.900 1.800.3.200.5.100.7-.1l.9-1c.2-.3.400-.2.700-.1l2 1c.3.100.5.200.6.300.1.200.1.800-.1 1.400z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5.500"/><circle cx="12" cy="12" r="4"/><circle cx="17.200" cy="6.800" r="1" fill="currentColor" stroke="none"/>',
    telegram: '<path d="M21.500 4 2.500 11.300l5.300 1.800 2 6 3-3.500 4.800 3.500zM7.800 13.100 18 7"/>'
  };

  function VI(name, cls) {
    const body = P[name] || BRAND[name] || P.sparkle;
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"' + (cls ? ' class="' + cls + '"' : '') + '>' + body + '</svg>';
  }

  /** filled star row, e.g. VIStars(4.3) */
  function VIStars(rating) {
    let out = '<span class="stars" aria-label="امتیاز ' + rating + ' از ۵">';
    for (let i = 1; i <= 5; i++) {
      const on = rating >= i - 0.25;
      out += '<svg viewBox="0 0 24 24" class="' + (on ? 'on' : '') + '"><path d="m12 2.500 2.900 6 6.600.9-4.800 4.600 1.200 6.500L12 17.300 6.100 20.500l1.200-6.500L2.500 9.400l6.600-.9z"/></svg>';
    }
    return out + '</span>';
  }

  const LOGO = '<svg viewBox="0 0 32 32" fill="none" aria-hidden="true"><path d="M5 7l11 20L27 7" stroke="#fff" stroke-width="3.200" stroke-linecap="round" stroke-linejoin="round"/><circle cx="16" cy="10.500" r="2" fill="#fff"/></svg>';

  global.VI = VI;
  global.VIStars = VIStars;
  global.VILogo = LOGO;
  global.VIIconNames = Object.keys(P);
})(window);
