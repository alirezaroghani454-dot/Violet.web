/* ==========================================================
   Violet — site/hero.js
   Hero content, live 3D watch (mouse / touch / gyro tilt)
   and the floating-dust canvas
   ========================================================== */
(function (global) {
  'use strict';

  const U = global.VU, VI = global.VI;
  const $ = U.$;

  const Hero = {

    render(s) {
      const h = s.hero;
      $('#heroEyebrow').textContent = h.eyebrow;
      $('#heroSub').textContent = h.subtitle;
      const c1 = $('#heroCta1'), c2 = $('#heroCta2');
      c1.innerHTML = U.esc(h.cta1) + VI('arrowL');
      c2.innerHTML = VI('clock') + U.esc(h.cta2);

      // title: split in lines (explicit \n or by half of the words); 2nd line gets the gradient
      const words = String(h.title).trim().split(/\s+/);
      let lines;
      if (String(h.title).indexOf('\n') >= 0) lines = String(h.title).split('\n');
      else if (words.length <= 2) lines = [h.title];
      else { const mid = Math.ceil(words.length / 2); lines = [words.slice(0, mid).join(' '), words.slice(mid).join(' ')]; }
      $('#heroTitle').innerHTML = lines.map((l, i) =>
        '<span class="line"><span class="' + (i === lines.length - 1 && lines.length > 1 ? 'grad-text' : '') + '">' + U.esc(l) + '</span></span>').join('');

      // stats
      const box = $('#heroStats');
      box.innerHTML = (s.stats || []).map((st) =>
        '<div class="stat"><b><span data-count="' + st.value + '">۰</span>' + U.esc(st.suffix || '') + '</b><span>' + U.esc(st.label) + '</span></div>').join('');
      U.$$('[data-count]', box).forEach((el, i) => setTimeout(() => global.VUI.count(el, Number(el.getAttribute('data-count')), 1800), 700 + i * 120));

      // watch
      const spec = Object.assign({}, h.spec);
      const main = $('#heroWatchMain'), shadow = $('#heroWatchShadow');
      if (main) main.innerHTML = global.VioletWatch.svg(spec, { live: true, label: 'ساعت ویولت' });
      if (shadow) shadow.innerHTML = global.VioletWatch.svg(spec, { noStrap: false, label: '' });
      global.VioletWatch.startLive();

      // float tag icons
      $('#tagIco1').innerHTML = VI('sparkle');
      $('#tagIco2').innerHTML = VI('shield');
      $('#tagIco3').innerHTML = VI('check');
    },

    /* ---------- 3D tilt ---------- */
    initTilt() {
      const stage = $('#heroStage'), watch = $('#watch3d');
      if (!stage || !watch || stage.__tilt) return;
      stage.__tilt = true;
      let rx = 0, ry = 0, tx = 0, ty = 0, raf = null, dragging = false, startX = 0, startY = 0, baseX = 0, baseY = 0;

      function apply() {
        rx += (tx - rx) * 0.12; ry += (ty - ry) * 0.12;
        watch.style.transform = 'rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg)';
        watch.style.setProperty('--gx', (50 + ry * 2.2).toFixed(1) + '%');
        watch.style.setProperty('--gy', (30 - rx * 2.2).toFixed(1) + '%');
        if (Math.abs(tx - rx) > 0.02 || Math.abs(ty - ry) > 0.02) raf = requestAnimationFrame(apply); else raf = null;
      }
      function kick() { if (!raf) raf = requestAnimationFrame(apply); }

      stage.addEventListener('pointermove', (e) => {
        if (dragging) {
          ty = U.clamp(baseY + (e.clientX - startX) * 0.35, -42, 42);
          tx = U.clamp(baseX - (e.clientY - startY) * 0.2, -26, 26);
          kick(); return;
        }
        if (e.pointerType !== 'mouse') return;
        const r = stage.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        ty = x * 34; tx = -y * 22; kick();
      });
      stage.addEventListener('pointerleave', () => { if (!dragging) { tx = 0; ty = 0; kick(); } });
      stage.addEventListener('pointerdown', (e) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        dragging = true; startX = e.clientX; startY = e.clientY; baseX = tx; baseY = ty;
        watch.classList.add('is-dragging');
        try { stage.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
      });
      const end = () => { if (!dragging) return; dragging = false; watch.classList.remove('is-dragging'); tx = 0; ty = 0; kick(); };
      stage.addEventListener('pointerup', end);
      stage.addEventListener('pointercancel', end);
      stage.style.touchAction = 'pan-y';

      // gyroscope on phones (only where no permission prompt is needed)
      if (window.DeviceOrientationEvent && U.isTouch() && typeof DeviceOrientationEvent.requestPermission !== 'function') {
        window.addEventListener('deviceorientation', (e) => {
          if (dragging || e.gamma === null) return;
          ty = U.clamp(e.gamma, -30, 30) * 0.9;
          tx = U.clamp((e.beta || 45) - 45, -25, 25) * -0.6;
          kick();
        }, { passive: true });
      }
    },

    /* ---------- particles ---------- */
    initParticles() {
      const cv = $('#heroCanvas');
      if (!cv || cv.__init || U.prefersReducedMotion()) return;
      cv.__init = true;
      const ctx = cv.getContext('2d');
      let w = 0, h = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), parts = [], running = true, mouse = { x: -999, y: -999 };

      function resize() {
        const r = cv.getBoundingClientRect();
        w = r.width; h = r.height;
        cv.width = w * dpr; cv.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const n = Math.round(U.clamp(w * h / 16000, 22, 90));
        parts = [];
        for (let i = 0; i < n; i++) parts.push(make());
      }
      function make() {
        const hue = U.pick([266, 280, 300, 330, 42]);
        return { x: Math.random() * w, y: Math.random() * h, r: U.rand(0.6, 2.6), vx: U.rand(-0.12, 0.12), vy: U.rand(-0.35, -0.08), a: U.rand(0.2, 0.8), hue: hue, tw: U.rand(0, 6.28) };
      }
      function frame() {
        if (!running) return;
        ctx.clearRect(0, 0, w, h);
        for (let i = 0; i < parts.length; i++) {
          const p = parts[i];
          p.x += p.vx; p.y += p.vy; p.tw += 0.03;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
          if (d2 < 14000) { const f = (1 - d2 / 14000) * 0.9; p.x += dx * 0.02 * f; p.y += dy * 0.02 * f; }
          if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
          if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
          const a = p.a * (0.6 + Math.sin(p.tw) * 0.4);
          ctx.beginPath();
          ctx.fillStyle = 'hsla(' + p.hue + ',90%,72%,' + a.toFixed(3) + ')';
          ctx.shadowColor = 'hsla(' + p.hue + ',90%,65%,.9)';
          ctx.shadowBlur = p.r * 6;
          ctx.arc(p.x, p.y, p.r, 0, 6.2832);
          ctx.fill();
        }
        ctx.shadowBlur = 0;
        // faint links
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const a = parts[i], b = parts[j], dx = a.x - b.x, dy = a.y - b.y, d = dx * dx + dy * dy;
            if (d < 7000) {
              ctx.strokeStyle = 'rgba(178,123,255,' + ((1 - d / 7000) * 0.16).toFixed(3) + ')';
              ctx.lineWidth = 0.8;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        requestAnimationFrame(frame);
      }

      resize();
      window.addEventListener('resize', U.debounce(resize, 250));
      const hero = $('#hero');
      hero.addEventListener('pointermove', (e) => { const r = cv.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; });
      hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; });

      // pause when the hero is off-screen
      if ('IntersectionObserver' in window) {
        new IntersectionObserver((en) => {
          const vis = en[0].isIntersecting;
          if (vis && !running) { running = true; requestAnimationFrame(frame); }
          if (!vis) running = false;
        }).observe(hero);
      }
      requestAnimationFrame(frame);
    },

    init(s) {
      Hero.render(s);
      Hero.initTilt();
      Hero.initParticles();
    }
  };

  global.VHero = Hero;
})(window);
