/* Timer-stop effects. FX.play(kind, el) puts a class on the time and spawns a short overlay.
   kinds: blink (a good solve) · soft · pb (personal best: confetti in cube colours) · worst · dnf · plus2.
   With reduced motion on, only the colour change is applied. */
(function (g) {
  'use strict';
  const KINDS = ['blink', 'soft', 'pb', 'worst', 'dnf', 'plus2'];
  const COL = { blink: '#2fd158', soft: '#ffffff', pb: '#ffd500', worst: '#ff453a', dnf: '#ff453a', plus2: '#ffb020' };
  const STICKERS = ['#ffffff', '#009b48', '#b71234', '#0046ad', '#ff5800', '#ffd500'];
  const reduce = () => !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const layer = () => { let l = document.getElementById('fx'); if (!l) { l = document.createElement('div'); l.id = 'fx'; l.setAttribute('aria-hidden', 'true'); document.body.appendChild(l); } return l; };
  const drop = (node, ms) => setTimeout(() => node.remove(), ms);

  function ring(cx, cy, color, size, dur, delay) {
    const d = document.createElement('div'); d.className = 'fx-ring';
    d.style.cssText = 'left:' + cx + 'px;top:' + cy + 'px;width:' + size + 'px;height:' + size + 'px;--c:' + color + ';animation-duration:' + dur + 'ms;animation-delay:' + (delay || 0) + 'ms';
    layer().appendChild(d); drop(d, dur + (delay || 0) + 80);
  }
  function vignette(color, dur) {
    const d = document.createElement('div'); d.className = 'fx-vig'; d.style.cssText = '--c:' + color + ';animation-duration:' + dur + 'ms';
    layer().appendChild(d); drop(d, dur + 80);
  }
  function confetti(cx, cy) {
    const dpr = Math.min(2, g.devicePixelRatio || 1), W = innerWidth, H = innerHeight;
    const cv = document.createElement('canvas'); cv.className = 'fx-conf'; cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    layer().appendChild(cv); const c = cv.getContext('2d'); c.scale(dpr, dpr);
    const ps = Array.from({ length: 110 }, () => {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.4, v = 6 + Math.random() * 10;
      return { x: cx, y: cy, vx: Math.cos(a) * v, vy: Math.sin(a) * v, s: 5 + Math.random() * 6, r: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, c: STICKERS[(Math.random() * STICKERS.length) | 0], life: 1 };
    });
    const t0 = performance.now(); let raf = 0;
    const step = now => {
      const dt = Math.min(2, (now - (step.l || now)) / 16.7); step.l = now;
      c.clearRect(0, 0, W, H);
      let alive = 0;
      for (const p of ps) {
        p.vy += 0.32 * dt; p.vx *= 0.992; p.x += p.vx * dt; p.y += p.vy * dt; p.r += p.vr * dt; p.life = Math.max(0, 1 - (now - t0) / 2000);
        if (p.life <= 0 || p.y > H + 20) continue; alive++;
        c.save(); c.globalAlpha = Math.min(1, p.life * 2); c.translate(p.x, p.y); c.rotate(p.r); c.fillStyle = p.c; c.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); c.restore();
      }
      if (alive && now - t0 < 2200) raf = requestAnimationFrame(step); else { cv.remove(); }
    };
    raf = requestAnimationFrame(step);
    setTimeout(() => { cancelAnimationFrame(raf); cv.remove(); }, 2600);
  }

  function clear(el) { if (el) KINDS.forEach(k => el.classList.remove('fx-' + k)); }
  function play(kind, el) {
    if (!el) return; clear(el);
    if (KINDS.indexOf(kind) < 0) return;
    el.classList.add('fx-' + kind);
    if (reduce()) return;
    const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2, size = Math.max(r.width, 260);
    if (kind === 'blink') ring(cx, cy, COL.blink, size * 1.15, 850);
    else if (kind === 'soft') ring(cx, cy, COL.soft, size * 0.8, 600);
    else if (kind === 'pb') { ring(cx, cy, COL.pb, size * 1.35, 1100); ring(cx, cy, '#ffffff', size * 0.95, 950, 130); confetti(cx, cy); }
    else if (kind === 'worst') vignette(COL.worst, 1300);
    else if (kind === 'dnf') { ring(cx, cy, COL.dnf, size, 700); vignette(COL.dnf, 800); }
    else if (kind === 'plus2') ring(cx, cy, COL.plus2, size * 0.9, 750);
  }

  g.FX = { play, clear, KINDS };
})(typeof window !== 'undefined' ? window : globalThis);
