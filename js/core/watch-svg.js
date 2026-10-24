/* ==========================================================
   Violet — watch-svg.js
   Procedural watch renderer. Every product picture in the shop
   is generated from a small "spec" object, so the admin panel can
   create new watches without uploading any photo.

   VioletWatch.svg(spec, opts)  -> SVG markup string
   VioletWatch.startLive()      -> animates every .vw-live watch

   spec = {
     shape:      'round' | 'square' | 'rect' | 'octagon'
     caseColor:  'steel' | 'gold' | 'rosegold' | 'violet' | 'black' | 'titanium'
     dial:       '#hex'
     dialStyle:  'plain' | 'sunburst' | 'guilloche' | 'chrono' | 'skeleton' | 'galaxy' | 'digital' | 'moon'
     markers:    'baton' | 'roman' | 'arabic' | 'dots' | 'minimal' | 'none'
     strap:      'leather' | 'silicone' | 'steel' | 'mesh' | 'ceramic' | 'nato'
     strapColor: '#hex'
     handColor:  '#hex'
     handStyle:  'baton' | 'sword' | 'dauphine'
     date:       true | false
     bezel:      '#hex' (optional colored bezel insert)
     seed:       number (optional, for galaxy stars)
   }
   ========================================================== */
(function (global) {
  'use strict';

  const CX = 200, CY = 320;
  let counter = 0;

  /* ---------- palettes ---------- */
  const METALS = {
    steel:    ['#f7f8fb', '#aab0bd', '#eceef3', '#6c7283', '#d9dce4'],
    gold:     ['#fff3c9', '#d9ab4c', '#f8dc8e', '#8d6621', '#ecc766'],
    rosegold: ['#ffe4da', '#dc9783', '#f8c9ba', '#8d5648', '#eeb09f'],
    violet:   ['#eedcff', '#8d44ff', '#cfa8ff', '#471a94', '#b07bff'],
    black:    ['#74747f', '#1b1b22', '#51515d', '#09090d', '#2d2d37'],
    titanium: ['#dadce1', '#80848f', '#bcc0ca', '#4b4e57', '#a0a4af']
  };

  /* ---------- shape geometry ---------- */
  const SHAPES = {
    round:   { a: 118, b: 118, n: 2,   rx: 118 },
    square:  { a: 116, b: 116, n: 4.5, rx: 46 },
    rect:    { a: 94,  b: 120, n: 4.5, rx: 34 },
    octagon: { a: 114, b: 114, n: 3.4, rx: 0, cut: 40 }
  };

  function shapePath(shape, inset) {
    const s = SHAPES[shape] || SHAPES.round;
    const a = s.a - inset, b = s.b - inset;
    if (shape === 'round' || !SHAPES[shape]) {
      return 'M' + (CX - a) + ' ' + CY + 'a' + a + ' ' + a + ' 0 1 0 ' + (2 * a) + ' 0a' + a + ' ' + a + ' 0 1 0 ' + (-2 * a) + ' 0Z';
    }
    if (shape === 'octagon') {
      const c = Math.max(8, s.cut - inset * 0.6);
      const x1 = CX - a, x2 = CX + a, y1 = CY - b, y2 = CY + b;
      return 'M' + (x1 + c) + ' ' + y1 + 'L' + (x2 - c) + ' ' + y1 + 'L' + x2 + ' ' + (y1 + c) +
        'L' + x2 + ' ' + (y2 - c) + 'L' + (x2 - c) + ' ' + y2 + 'L' + (x1 + c) + ' ' + y2 +
        'L' + x1 + ' ' + (y2 - c) + 'L' + x1 + ' ' + (y1 + c) + 'Z';
    }
    const r = Math.max(6, s.rx - inset * 0.8);
    const x = CX - a, y = CY - b, w = 2 * a, h = 2 * b;
    return 'M' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w) + ' ' + (y + r) +
      'V' + (y + h - r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + w - r) + ' ' + (y + h) +
      'H' + (x + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + x + ' ' + (y + h - r) +
      'V' + (y + r) + 'A' + r + ' ' + r + ' 0 0 1 ' + (x + r) + ' ' + y + 'Z';
  }

  /** distance from the centre to the (super-ellipse) dial edge at angle deg (0 = 12 o'clock) */
  function boundary(shape, inset, deg) {
    const s = SHAPES[shape] || SHAPES.round;
    const a = s.a - inset, b = s.b - inset;
    const t = deg * Math.PI / 180;
    const sx = Math.abs(Math.sin(t)) / a, cy = Math.abs(Math.cos(t)) / b;
    return Math.pow(Math.pow(sx, s.n) + Math.pow(cy, s.n), -1 / s.n);
  }

  function pt(shape, inset, deg, factor, extra) {
    const r = boundary(shape, inset, deg) * factor + (extra || 0);
    const t = deg * Math.PI / 180;
    return [CX + r * Math.sin(t), CY - r * Math.cos(t)];
  }

  const f = (n) => Math.round(n * 100) / 100;

  /* ---------- gradient helpers ---------- */
  function metalGrad(id, key, vertical) {
    const m = METALS[key] || METALS.steel;
    const dir = vertical ? 'x1="0" y1="0" x2="0" y2="1"' : 'x1="0" y1="0" x2="1" y2="1"';
    return '<linearGradient id="' + id + '" ' + dir + '>' +
      '<stop offset="0" stop-color="' + m[0] + '"/><stop offset=".28" stop-color="' + m[1] + '"/>' +
      '<stop offset=".52" stop-color="' + m[2] + '"/><stop offset=".8" stop-color="' + m[3] + '"/>' +
      '<stop offset="1" stop-color="' + m[4] + '"/></linearGradient>';
  }

  function shade(hex, amt) {
    let c = String(hex || '#333').replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const num = parseInt(c, 16);
    let r = (num >> 16) + amt, g = ((num >> 8) & 255) + amt, b = (num & 255) + amt;
    r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  /* ---------- strap ---------- */
  function strapShape(top, shape) {
    // tapered strap polygon; top strap goes up from the case, bottom goes down
    const wCase = shape === 'rect' ? 76 : 92;
    const wEnd = wCase - 14;
    if (top) {
      return 'M' + (CX - wCase) + ' 238 L' + (CX - wEnd) + ' 6 Q' + CX + ' -4 ' + (CX + wEnd) + ' 6 L' + (CX + wCase) + ' 238Z';
    }
    return 'M' + (CX - wCase) + ' 402 L' + (CX - wEnd) + ' 634 Q' + CX + ' 646 ' + (CX + wEnd) + ' 634 L' + (CX + wCase) + ' 402Z';
  }

  function strapMarkup(spec, id, shape) {
    const kind = spec.strap || 'leather';
    const col = spec.strapColor || '#1a1030';
    const wCase = shape === 'rect' ? 76 : 92;
    let out = '';
    const topP = strapShape(true, shape), botP = strapShape(false, shape);

    out += '<defs>' +
      '<clipPath id="' + id + 'ct"><path d="' + topP + '"/></clipPath>' +
      '<clipPath id="' + id + 'cb"><path d="' + botP + '"/></clipPath>' +
      '<linearGradient id="' + id + 'sg" x1="0" y1="0" x2="1" y2="0">' +
      '<stop offset="0" stop-color="' + shade(col, -26) + '"/><stop offset=".22" stop-color="' + shade(col, 14) + '"/>' +
      '<stop offset=".5" stop-color="' + shade(col, 26) + '"/><stop offset=".78" stop-color="' + shade(col, 6) + '"/>' +
      '<stop offset="1" stop-color="' + shade(col, -30) + '"/></linearGradient>' +
      '<linearGradient id="' + id + 'sf" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".35" stop-color="#000" stop-opacity="0"/>' +
      '<stop offset=".65" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>' +
      '<pattern id="' + id + 'mesh" width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
      '<rect width="5" height="5" fill="none"/><path d="M0 0H5M0 0V5" stroke="#000" stroke-opacity=".28" stroke-width=".8"/></pattern>' +
      '</defs>';

    const fillFor = (kind === 'steel' || kind === 'mesh') ? 'url(#' + id + 'mt)' : 'url(#' + id + 'sg)';

    ['t', 'b'].forEach((side) => {
      const isTop = side === 't';
      const clip = 'url(#' + id + 'c' + side + ')';
      const path = isTop ? topP : botP;
      out += '<g clip-path="' + clip + '">';
      out += '<path d="' + path + '" fill="' + fillFor + '"/>';

      const y0 = isTop ? 0 : 402, y1 = isTop ? 238 : 640;

      if (kind === 'leather') {
        // stitching + subtle grain
        const inset = 12;
        [-1, 1].forEach((sgn) => {
          const xTop = CX + sgn * (wCase - inset), xEnd = CX + sgn * (wCase - 14 - inset);
          out += isTop
            ? '<line x1="' + xTop + '" y1="238" x2="' + xEnd + '" y2="10" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="5 4"/>'
            : '<line x1="' + xTop + '" y1="402" x2="' + xEnd + '" y2="630" stroke="#fff" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="5 4"/>';
        });
        if (!isTop) {
          for (let i = 0; i < 6; i++) out += '<circle cx="' + CX + '" cy="' + (500 + i * 18) + '" r="4.2" fill="#000" fill-opacity=".6"/><circle cx="' + CX + '" cy="' + (500 + i * 18) + '" r="4.2" fill="none" stroke="#fff" stroke-opacity=".12"/>';
        }
        out += '<rect x="0" y="' + y0 + '" width="400" height="' + (y1 - y0) + '" fill="url(#' + id + 'sf)"/>';
      }

      if (kind === 'silicone') {
        for (let y = y0 + 10; y < y1; y += 14) {
          out += '<line x1="' + (CX - 100) + '" y1="' + y + '" x2="' + (CX + 100) + '" y2="' + y + '" stroke="#000" stroke-opacity=".18" stroke-width="2"/>' +
            '<line x1="' + (CX - 100) + '" y1="' + (y + 2) + '" x2="' + (CX + 100) + '" y2="' + (y + 2) + '" stroke="#fff" stroke-opacity=".08" stroke-width="1.5"/>';
        }
        if (!isTop) for (let i = 0; i < 5; i++) out += '<ellipse cx="' + CX + '" cy="' + (512 + i * 20) + '" rx="5" ry="5.5" fill="#000" fill-opacity=".5"/>';
        out += '<rect x="0" y="' + y0 + '" width="400" height="' + (y1 - y0) + '" fill="url(#' + id + 'sf)"/>';
      }

      if (kind === 'steel' || kind === 'ceramic') {
        const rowH = 28;
        const start = isTop ? 238 : 402;
        const dirn = isTop ? -1 : 1;
        for (let i = 0; i < 9; i++) {
          const y = start + dirn * i * rowH;
          const yy = isTop ? y - rowH : y;
          if (kind === 'ceramic') {
            out += '<rect x="' + (CX - 100) + '" y="' + yy + '" width="200" height="' + rowH + '" fill="none" stroke="#000" stroke-opacity=".5" stroke-width="2"/>';
            out += '<rect x="' + (CX - 34) + '" y="' + (yy + 3) + '" width="68" height="' + (rowH - 6) + '" rx="8" fill="#fff" fill-opacity=".05" stroke="#fff" stroke-opacity=".12"/>';
          } else {
            out += '<line x1="' + (CX - 100) + '" y1="' + yy + '" x2="' + (CX + 100) + '" y2="' + yy + '" stroke="#000" stroke-opacity=".45" stroke-width="2"/>';
            out += '<line x1="' + (CX - 30) + '" y1="' + yy + '" x2="' + (CX - 30) + '" y2="' + (yy + rowH) + '" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>';
            out += '<line x1="' + (CX + 30) + '" y1="' + yy + '" x2="' + (CX + 30) + '" y2="' + (yy + rowH) + '" stroke="#000" stroke-opacity=".35" stroke-width="1.6"/>';
            out += '<rect x="' + (CX - 28) + '" y="' + (yy + 3) + '" width="56" height="' + (rowH - 6) + '" rx="6" fill="#fff" fill-opacity=".12"/>';
          }
        }
        out += '<rect x="0" y="' + y0 + '" width="400" height="' + (y1 - y0) + '" fill="url(#' + id + 'sf)"/>';
      }

      if (kind === 'mesh') {
        out += '<path d="' + path + '" fill="url(#' + id + 'mesh)"/>';
        out += '<rect x="0" y="' + y0 + '" width="400" height="' + (y1 - y0) + '" fill="url(#' + id + 'sf)"/>';
      }

      if (kind === 'nato') {
        const stripes = [col, '#f4f4f8', shade(col, 40), '#f4f4f8', col];
        const total = 200, sw = total / stripes.length;
        stripes.forEach((c, i) => {
          out += '<rect x="' + (CX - 100 + i * sw) + '" y="' + y0 + '" width="' + sw + '" height="' + (y1 - y0) + '" fill="' + c + '" fill-opacity="' + (i % 2 ? .85 : 1) + '"/>';
        });
        for (let y = y0; y < y1; y += 4) out += '<line x1="' + (CX - 100) + '" y1="' + y + '" x2="' + (CX + 100) + '" y2="' + y + '" stroke="#000" stroke-opacity=".14"/>';
        out += '<rect x="0" y="' + y0 + '" width="400" height="' + (y1 - y0) + '" fill="url(#' + id + 'sf)"/>';
      }

      out += '</g>';
    });

    // buckle keeper on leather/silicone/nato
    if (kind === 'leather' || kind === 'silicone' || kind === 'nato') {
      out += '<rect x="' + (CX - wCase + 6) + '" y="468" width="' + (2 * wCase - 12) + '" height="14" rx="5" fill="' + shade(col, -18) + '" stroke="#000" stroke-opacity=".35"/>';
    }

    // steel/mesh need the metal gradient defined
    if (kind === 'steel' || kind === 'mesh') {
      out = '<defs>' + metalGrad(id + 'mt', spec.caseColor, false) + '</defs>' + out;
    }
    return out;
  }

  /* ---------- dial ---------- */
  function dialMarkup(spec, id, shape) {
    const dialColor = spec.dial || '#3a1878';
    const style = spec.dialStyle || 'sunburst';
    const hand = spec.handColor || '#f2dc9c';
    const markers = spec.markers || 'baton';
    const di = 22; // dial inset
    const dPath = shapePath(shape, di);
    let out = '';

    out += '<defs>' +
      '<clipPath id="' + id + 'dc"><path d="' + dPath + '"/></clipPath>' +
      '<radialGradient id="' + id + 'dg" cx=".5" cy=".42" r=".75">' +
      '<stop offset="0" stop-color="' + shade(dialColor, 38) + '"/><stop offset=".6" stop-color="' + dialColor + '"/>' +
      '<stop offset="1" stop-color="' + shade(dialColor, -46) + '"/></radialGradient>' +
      '<linearGradient id="' + id + 'gl" x1="0" y1="0" x2="1" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".34"/><stop offset=".42" stop-color="#fff" stop-opacity=".05"/>' +
      '<stop offset=".43" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>' +
      '</defs>';

    out += '<path d="' + dPath + '" fill="url(#' + id + 'dg)"/>';
    out += '<g clip-path="url(#' + id + 'dc)">';

    /* texture layers */
    if (style === 'sunburst') {
      for (let i = 0; i < 120; i++) {
        const a = i * 3 * Math.PI / 180;
        out += '<line x1="' + CX + '" y1="' + CY + '" x2="' + f(CX + 170 * Math.sin(a)) + '" y2="' + f(CY - 170 * Math.cos(a)) + '" stroke="' + (i % 2 ? '#fff' : '#000') + '" stroke-opacity="' + (i % 2 ? .06 : .09) + '" stroke-width="1.4"/>';
      }
    }
    if (style === 'guilloche' || style === 'moon') {
      for (let k = 6; k < 110; k += 5) {
        out += '<path d="' + shapePath(shape, di + k * 0.55) + '" fill="none" stroke="#fff" stroke-opacity=".07" stroke-width="1"/>';
      }
      for (let i = 0; i < 24; i++) {
        const a = i * 15 * Math.PI / 180;
        out += '<line x1="' + CX + '" y1="' + CY + '" x2="' + f(CX + 170 * Math.sin(a)) + '" y2="' + f(CY - 170 * Math.cos(a)) + '" stroke="#000" stroke-opacity=".07"/>';
      }
    }
    if (style === 'galaxy') {
      const rnd = global.VU ? global.VU.rng(spec.seed || 77) : Math.random;
      out += '<ellipse cx="' + (CX + 20) + '" cy="' + (CY - 10) + '" rx="120" ry="46" fill="#c06bff" fill-opacity=".22" transform="rotate(-32 ' + CX + ' ' + CY + ')"/>';
      out += '<ellipse cx="' + (CX - 20) + '" cy="' + (CY + 20) + '" rx="90" ry="30" fill="#4cc9ff" fill-opacity=".16" transform="rotate(-32 ' + CX + ' ' + CY + ')"/>';
      for (let i = 0; i < 70; i++) {
        const x = CX - 110 + rnd() * 220, y = CY - 110 + rnd() * 220, r = rnd() * 1.4 + .3;
        out += '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="#fff" fill-opacity="' + f(rnd() * .7 + .25) + '"/>';
      }
    }
    if (style === 'skeleton') {
      const gear = (cx, cy, r, teeth, rot) => {
        let d = '';
        for (let i = 0; i < teeth * 2; i++) {
          const a = (i * Math.PI / teeth) + rot, rr = i % 2 ? r : r + 7;
          d += (i ? 'L' : 'M') + f(cx + rr * Math.cos(a)) + ' ' + f(cy + rr * Math.sin(a));
        }
        return d + 'Z';
      };
      const col = METALS[spec.caseColor] ? METALS[spec.caseColor][2] : '#ccc';
      out += '<rect x="0" y="0" width="400" height="640" fill="#07040f" fill-opacity=".65"/>';
      out += '<g fill="none" stroke="' + col + '" stroke-width="2.2" stroke-opacity=".85">' +
        '<path d="' + gear(CX - 36, CY - 8, 34, 14, 0.2) + '"/><circle cx="' + (CX - 36) + '" cy="' + (CY - 8) + '" r="14"/>' +
        '<path d="' + gear(CX + 40, CY + 22, 28, 12, 0.5) + '"/><circle cx="' + (CX + 40) + '" cy="' + (CY + 22) + '" r="10"/>' +
        '<path d="' + gear(CX + 6, CY + 68, 20, 10, 0.1) + '"/>' +
        '<circle cx="' + (CX + 34) + '" cy="' + (CY - 50) + '" r="22"/><circle cx="' + (CX + 34) + '" cy="' + (CY - 50) + '" r="6" fill="' + dialColor + '"/>' +
        '</g>';
      out += '<circle cx="' + (CX - 36) + '" cy="' + (CY - 8) + '" r="4" fill="#ff5fa2"/><circle cx="' + (CX + 40) + '" cy="' + (CY + 22) + '" r="3.2" fill="#ff5fa2"/>';
    }

    /* sub-dials */
    const sub = (cx, cy, r, label) => {
      let s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#000" fill-opacity=".28" stroke="' + hand + '" stroke-opacity=".55" stroke-width="1.2"/>';
      for (let i = 0; i < 12; i++) {
        const a = i * 30 * Math.PI / 180;
        s += '<line x1="' + f(cx + (r - 4) * Math.sin(a)) + '" y1="' + f(cy - (r - 4) * Math.cos(a)) + '" x2="' + f(cx + (r - 1.5) * Math.sin(a)) + '" y2="' + f(cy - (r - 1.5) * Math.cos(a)) + '" stroke="' + hand + '" stroke-opacity=".8" stroke-width="1"/>';
      }
      s += '<line x1="' + cx + '" y1="' + cy + '" x2="' + f(cx + (r - 5) * Math.sin(label)) + '" y2="' + f(cy - (r - 5) * Math.cos(label)) + '" stroke="' + hand + '" stroke-width="1.5" stroke-linecap="round"/><circle cx="' + cx + '" cy="' + cy + '" r="1.8" fill="' + hand + '"/>';
      return s;
    };
    if (style === 'chrono') {
      out += sub(CX - 46, CY + 2, 25, 1.1) + sub(CX + 46, CY + 2, 25, 4.2) + sub(CX, CY + 56, 25, 2.6);
      // tachymeter ring
      out += '<path d="' + shapePath(shape, di + 6) + '" fill="none" stroke="' + hand + '" stroke-opacity=".28" stroke-dasharray="1.2 3.2" stroke-width="3"/>';
    }
    if (style === 'moon') {
      const cx = CX, cy = CY + 52, r = 24;
      out += '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="#0a1236" stroke="' + hand + '" stroke-opacity=".7" stroke-width="1.4"/>' +
        '<circle cx="' + (cx - 6) + '" cy="' + cy + '" r="12" fill="#f6e7a8"/><circle cx="' + (cx + 4) + '" cy="' + (cy - 3) + '" r="11" fill="#0a1236"/>' +
        '<circle cx="' + (cx + 12) + '" cy="' + (cy + 10) + '" r="1.2" fill="#fff"/><circle cx="' + (cx - 14) + '" cy="' + (cy - 12) + '" r="1" fill="#fff"/>';
    }

    /* Digital / smart watch face */
    if (style === 'digital') {
      out += '<rect x="0" y="0" width="400" height="640" fill="#05050a"/>';
      const rings = [['#ff5fa2', 62, .78], ['#7cf0b6', 50, .55], ['#4cc9ff', 38, .66]];
      rings.forEach((r) => {
        const C = 2 * Math.PI * r[1];
        out += '<circle cx="' + CX + '" cy="' + (CY + 6) + '" r="' + r[1] + '" fill="none" stroke="' + r[0] + '" stroke-opacity=".18" stroke-width="7"/>' +
          '<circle cx="' + CX + '" cy="' + (CY + 6) + '" r="' + r[1] + '" fill="none" stroke="' + r[0] + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + f(C * r[2]) + ' ' + f(C) + '" transform="rotate(-90 ' + CX + ' ' + (CY + 6) + ')"/>';
      });
      out += '<text class="vw-digital-time" x="' + CX + '" y="' + (CY + 14) + '" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-weight="700" font-size="30" fill="#fff">10:08</text>';
      out += '<text x="' + CX + '" y="' + (CY - 70) + '" text-anchor="middle" font-family="Vazirmatn,sans-serif" font-size="10" fill="#c9a8ff">TUE 20</text>';
      out += '<text x="' + CX + '" y="' + (CY + 90) + '" text-anchor="middle" font-family="Vazirmatn,sans-serif" font-size="10" fill="#7cf0b6">72 bpm</text>';
    }

    /* markers */
    if (style !== 'digital' && style !== 'skeleton') {
      const roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
      const mCol = spec.markerColor || hand;
      for (let i = 0; i < 12; i++) {
        const deg = i * 30;
        if (markers === 'none') break;
        if (markers === 'minimal' && i % 3) continue;
        if (spec.date && i === 3 && (markers === 'roman' || markers === 'arabic' || markers === 'dots')) continue;
        if (style === 'chrono' && (deg === 90 || deg === 270 || deg === 180)) {
          // keep markers outside the sub-dial area
        }
        if (markers === 'baton' || markers === 'minimal') {
          const p1 = pt(shape, di, deg, 0.93), p2 = pt(shape, di, deg, i % 3 ? 0.8 : 0.74);
          out += '<line x1="' + f(p1[0]) + '" y1="' + f(p1[1]) + '" x2="' + f(p2[0]) + '" y2="' + f(p2[1]) + '" stroke="' + mCol + '" stroke-width="' + (i % 3 ? 4 : 6) + '" stroke-linecap="butt"/>';
        } else if (markers === 'dots') {
          const p = pt(shape, di, deg, 0.85);
          out += '<circle cx="' + f(p[0]) + '" cy="' + f(p[1]) + '" r="' + (i % 3 ? 3.2 : 5.2) + '" fill="' + mCol + '"/>';
        } else if (markers === 'roman' || markers === 'arabic') {
          const p = pt(shape, di, deg, 0.8);
          const txt = markers === 'roman' ? roman[i] : String(i === 0 ? 12 : i);
          out += '<text x="' + f(p[0]) + '" y="' + f(p[1] + 5) + '" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-weight="700" font-size="' + (markers === 'roman' ? 15 : 17) + '" fill="' + mCol + '">' + txt + '</text>';
        }
      }
      // minute track
      if (markers !== 'none') {
        for (let m = 0; m < 60; m++) {
          if (m % 5 === 0) continue;
          const p1 = pt(shape, di, m * 6, 0.975), p2 = pt(shape, di, m * 6, 0.93);
          out += '<line x1="' + f(p1[0]) + '" y1="' + f(p1[1]) + '" x2="' + f(p2[0]) + '" y2="' + f(p2[1]) + '" stroke="' + hand + '" stroke-opacity=".5" stroke-width=".9"/>';
        }
      }
    }

    /* brand text and date */
    if (style !== 'digital') {
      const hasSub = style === 'chrono';
      out += '<text x="' + CX + '" y="' + (CY - (hasSub ? 52 : 42)) + '" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-weight="700" font-size="13" letter-spacing="4" fill="' + hand + '" fill-opacity=".92">VIOLET</text>';
      if (style !== 'skeleton' && style !== 'chrono' && style !== 'moon') {
        out += '<text x="' + CX + '" y="' + (CY - 28) + '" text-anchor="middle" font-family="Cormorant Garamond,Georgia,serif" font-size="7" letter-spacing="2.6" fill="' + hand + '" fill-opacity=".6">AUTOMATIC · SWISS MADE</text>';
      }
      if (spec.date) {
        const p = pt(shape, di, 90, 0.66);
        out += '<rect x="' + f(p[0] - 11) + '" y="' + f(p[1] - 9) + '" width="22" height="18" rx="2" fill="#fbfbfd" stroke="' + hand + '" stroke-opacity=".6"/>' +
          '<text class="vw-date" x="' + f(p[0]) + '" y="' + f(p[1] + 5) + '" text-anchor="middle" font-family="Cormorant Garamond,serif" font-weight="700" font-size="13" fill="#17102b">20</text>';
      }
    }

    /* hands */
    if (style !== 'digital') {
      const R = Math.min(SHAPES[shape].a, SHAPES[shape].b) - di; // usable radius
      const hLen = R * 0.5, mLen = R * 0.78, sLen = R * 0.88;
      const hs = spec.handStyle || 'sword';
      const handShape = (len, wd) => {
        if (hs === 'baton') return '<rect x="' + (CX - wd / 2) + '" y="' + (CY - len) + '" width="' + wd + '" height="' + (len + 10) + '" rx="1" fill="' + hand + '" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>';
        if (hs === 'dauphine') return '<path d="M' + CX + ' ' + (CY - len) + 'L' + (CX + wd) + ' ' + (CY + 6) + 'L' + (CX - wd) + ' ' + (CY + 6) + 'Z" fill="' + hand + '" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>';
        return '<path d="M' + CX + ' ' + (CY - len) + 'Q' + (CX + wd) + ' ' + (CY - len * 0.55) + ' ' + (CX + wd * 0.55) + ' ' + (CY + 8) + 'L' + (CX - wd * 0.55) + ' ' + (CY + 8) + 'Q' + (CX - wd) + ' ' + (CY - len * 0.55) + ' ' + CX + ' ' + (CY - len) + 'Z" fill="' + hand + '" stroke="#000" stroke-opacity=".35" stroke-width=".6"/>';
      };
      const lume = '<line x1="' + CX + '" y1="__Y1__" x2="' + CX + '" y2="__Y2__" stroke="#fff" stroke-opacity=".35" stroke-width="1.4"/>';

      out += '<g class="vw-hand" data-hand="h" transform="rotate(304 ' + CX + ' ' + CY + ')"><g filter="url(#' + id + 'sh)">' + handShape(hLen, 7) + lume.replace('__Y1__', CY - hLen + 10).replace('__Y2__', CY - 10) + '</g></g>';
      out += '<g class="vw-hand" data-hand="m" transform="rotate(48 ' + CX + ' ' + CY + ')"><g filter="url(#' + id + 'sh)">' + handShape(mLen, 5) + lume.replace('__Y1__', CY - mLen + 10).replace('__Y2__', CY - 10) + '</g></g>';
      const sCol = spec.secondColor || '#ff5fa2';
      out += '<g class="vw-hand" data-hand="s" transform="rotate(216 ' + CX + ' ' + CY + ')">' +
        '<line x1="' + CX + '" y1="' + (CY + 28) + '" x2="' + CX + '" y2="' + (CY - sLen) + '" stroke="' + sCol + '" stroke-width="1.7" stroke-linecap="round"/>' +
        '<circle cx="' + CX + '" cy="' + (CY + 24) + '" r="4.2" fill="' + sCol + '"/>' +
        '<circle cx="' + CX + '" cy="' + (CY - sLen * 0.72) + '" r="3" fill="' + sCol + '"/></g>';
      out += '<circle cx="' + CX + '" cy="' + CY + '" r="6.5" fill="' + hand + '" stroke="#000" stroke-opacity=".4"/><circle cx="' + CX + '" cy="' + CY + '" r="2.4" fill="#17102b"/>';
    }

    // glass reflection
    out += '<path d="' + dPath + '" fill="url(#' + id + 'gl)"/>';
    out += '</g>';
    return out;
  }

  /* ---------- main renderer ---------- */
  function svg(spec, opts) {
    spec = spec || {};
    opts = opts || {};
    const shape = SHAPES[spec.shape] ? spec.shape : 'round';
    const id = 'vw' + (++counter) + '_';
    const caseKey = METALS[spec.caseColor] ? spec.caseColor : 'steel';
    const chrono = spec.dialStyle === 'chrono';
    const strapless = opts.noStrap;
    const viewBox = opts.viewBox || (opts.cropped ? '60 170 280 300' : '0 0 400 640');
    const m = METALS[caseKey];

    let out = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="' + viewBox + '" class="vw-svg' + (opts.live ? ' vw-live' : '') + '" role="img" aria-label="' + (opts.label ? String(opts.label).replace(/"/g, '') : 'ساعت ویولت') + '" preserveAspectRatio="xMidYMid meet">';

    out += '<defs>' +
      metalGrad(id + 'cg', caseKey) +
      metalGrad(id + 'cv', caseKey, true) +
      '<linearGradient id="' + id + 'bz" x1="1" y1="1" x2="0" y2="0">' +
      '<stop offset="0" stop-color="' + m[0] + '"/><stop offset=".5" stop-color="' + m[3] + '"/><stop offset="1" stop-color="' + m[2] + '"/></linearGradient>' +
      '<filter id="' + id + 'sh" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="1.5" dy="2.5" stdDeviation="2" flood-color="#000" flood-opacity=".5"/></filter>' +
      '<filter id="' + id + 'cs" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="10" stdDeviation="9" flood-color="#000" flood-opacity=".5"/></filter>' +
      '</defs>';

    if (!strapless) out += strapMarkup(spec, id, shape);

    /* lugs */
    const lw = shape === 'rect' ? 70 : 86;
    [[-1, 'top'], [1, 'bot']].forEach((l) => {
      const y = l[1] === 'top' ? 198 : 400;
      [-1, 1].forEach((sgn) => {
        const x = CX + sgn * (lw - 4) - 8;
        out += '<rect x="' + x + '" y="' + y + '" width="16" height="42" rx="6" fill="url(#' + id + 'cv)" stroke="#000" stroke-opacity=".35"/>';
      });
    });

    /* crown + pushers */
    const rightX = CX + (SHAPES[shape].a) - 4;
    out += '<g>';
    if (chrono) {
      out += '<rect x="' + (rightX - 2) + '" y="' + (CY - 56) + '" width="18" height="17" rx="4" fill="url(#' + id + 'cg)" stroke="#000" stroke-opacity=".4" transform="rotate(-18 ' + (rightX + 6) + ' ' + (CY - 48) + ')"/>';
      out += '<rect x="' + (rightX - 2) + '" y="' + (CY + 39) + '" width="18" height="17" rx="4" fill="url(#' + id + 'cg)" stroke="#000" stroke-opacity=".4" transform="rotate(18 ' + (rightX + 6) + ' ' + (CY + 48) + ')"/>';
    }
    out += '<rect x="' + (rightX - 2) + '" y="' + (CY - 15) + '" width="26" height="30" rx="6" fill="url(#' + id + 'cv)" stroke="#000" stroke-opacity=".45"/>';
    for (let g = 0; g < 5; g++) out += '<line x1="' + (rightX + 2 + g * 4.4) + '" y1="' + (CY - 13) + '" x2="' + (rightX + 2 + g * 4.4) + '" y2="' + (CY + 13) + '" stroke="#000" stroke-opacity=".4" stroke-width="1.3"/>';
    out += '</g>';

    /* case */
    out += '<g filter="url(#' + id + 'cs)"><path d="' + shapePath(shape, 0) + '" fill="url(#' + id + 'cg)" stroke="#000" stroke-opacity=".4" stroke-width="1.4"/></g>';
    out += '<path d="' + shapePath(shape, 7) + '" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.2"/>';
    out += '<path d="' + shapePath(shape, 12) + '" fill="url(#' + id + 'bz)" stroke="#000" stroke-opacity=".35" stroke-width="1.2"/>';

    /* coloured bezel insert */
    if (spec.bezel) {
      out += '<path d="' + shapePath(shape, 14) + '" fill="none" stroke="' + spec.bezel + '" stroke-width="7" stroke-opacity=".95"/>';
      if (shape === 'round') {
        for (let i = 0; i < 60; i++) {
          const a = i * 6 * Math.PI / 180, r1 = 104, r2 = i % 5 ? 101 : 98;
          out += '<line x1="' + f(CX + r1 * Math.sin(a)) + '" y1="' + f(CY - r1 * Math.cos(a)) + '" x2="' + f(CX + r2 * Math.sin(a)) + '" y2="' + f(CY - r2 * Math.cos(a)) + '" stroke="#fff" stroke-opacity=".7" stroke-width="' + (i % 5 ? .8 : 1.6) + '"/>';
        }
      }
    }
    out += '<path d="' + shapePath(shape, 20) + '" fill="#000" fill-opacity=".55"/>';

    /* dial */
    out += dialMarkup(spec, id, shape);

    /* crystal rim */
    out += '<path d="' + shapePath(shape, 20.5) + '" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.2"/>';

    out += '</svg>';
    return out;
  }

  /* ---------- live clock ---------- */
  let liveRunning = false;

  function setHands(root, now) {
    const s = now.getSeconds() + now.getMilliseconds() / 1000;
    const m = now.getMinutes() + s / 60;
    const h = (now.getHours() % 12) + m / 60;
    const angles = { h: h * 30, m: m * 6, s: s * 6 };
    root.querySelectorAll('[data-hand]').forEach((g) => {
      g.setAttribute('transform', 'rotate(' + angles[g.getAttribute('data-hand')].toFixed(2) + ' ' + CX + ' ' + CY + ')');
    });
    const dt = root.querySelector('.vw-digital-time');
    if (dt) dt.textContent = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0');
    const dd = root.querySelector('.vw-date');
    if (dd) dd.textContent = String(now.getDate());
  }

  function loop() {
    const nodes = document.querySelectorAll('.vw-live');
    if (!nodes.length) { liveRunning = false; return; }
    const now = new Date();
    nodes.forEach((n) => {
      const r = n.getBoundingClientRect();
      if (r.bottom > 0 && r.top < window.innerHeight) setHands(n, now);
    });
    requestAnimationFrame(loop);
  }

  function startLive() {
    if (liveRunning) return;
    liveRunning = true;
    requestAnimationFrame(loop);
  }

  global.VioletWatch = {
    svg: svg,
    startLive: startLive,
    metals: METALS,
    shapes: Object.keys(SHAPES),
    options: {
      shape: [['round', 'گرد'], ['square', 'مربع'], ['rect', 'مستطیل'], ['octagon', 'هشت‌ضلعی']],
      caseColor: [['steel', 'استیل'], ['gold', 'طلایی'], ['rosegold', 'رزگلد'], ['violet', 'بنفش'], ['black', 'مشکی'], ['titanium', 'تیتانیوم']],
      dialStyle: [['plain', 'ساده'], ['sunburst', 'سان‌برست'], ['guilloche', 'گیوشه'], ['chrono', 'کرونوگراف'], ['skeleton', 'اسکلتون'], ['galaxy', 'کهکشانی'], ['moon', 'فاز ماه'], ['digital', 'هوشمند']],
      markers: [['baton', 'میله‌ای'], ['roman', 'رومی'], ['arabic', 'عددی'], ['dots', 'نقطه‌ای'], ['minimal', 'مینیمال'], ['none', 'بدون']],
      strap: [['leather', 'چرم'], ['silicone', 'سیلیکون'], ['steel', 'استیل'], ['mesh', 'میلانز'], ['ceramic', 'سرامیک'], ['nato', 'پارچه‌ای']],
      handStyle: [['sword', 'شمشیری'], ['baton', 'میله‌ای'], ['dauphine', 'دوفین']]
    }
  };
})(window);
