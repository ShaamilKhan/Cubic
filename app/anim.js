/* Turning animation for the sticker models.
   The camera never moves: only the layer being turned swings round its axis, with the dark plastic showing underneath.
   cube() draws any N×N×N from its stickers (a 3×3 from sim.js, other sizes from nxn.js). stage() keeps a pair of pictures
   and plays one move at a time on them. tools/test-anim.cjs checks that the last frame of every kind of move shows exactly
   the stickers the model says the cube has afterwards. */
(function (g) {
  'use strict';
  const H = Math.sqrt(3) / 2, BODY = '#16161a', K = 0.455;   // K: sticker half-size, as in render.js
  const f2 = n => Math.round(n * 100) / 100;
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // rotate v by th about the unit axis k, in the same sense as the simulators' quarter turn
  const rotV = (v, k, th) => {
    const d = dot(k, v), c = [k[1] * v[2] - k[2] * v[1], k[2] * v[0] - k[0] * v[2], k[0] * v[1] - k[1] * v[0]], co = Math.cos(th), si = Math.sin(th);
    return [k[0] * d + co * (v[0] - k[0] * d) - si * c[0], k[1] * d + co * (v[1] - k[1] * d) - si * c[1], k[2] * d + co * (v[2] - k[2] * d) - si * c[2]];
  };
  const DIRS = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  const angle = q => (q === 3 ? -1 : q) * Math.PI / 2;          // the short way round: R' turns back a quarter, not three forward
  const msFor = q => (q === 2 ? 560 : 420);                       // a half turn takes a little longer, not twice as long
  const reduced = () => !!(g.matchMedia && g.matchMedia('(prefers-reduced-motion: reduce)').matches);
  const ease = u => 0.5 - 0.5 * Math.cos(Math.PI * u);
  const RAX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };
  // "x y2" -> whole-cube turns applied after everything else
  const rotList = str => String(str || '').trim().split(/\s+/).filter(Boolean).map(t => {
    const m = /^([xyz])(2'?|')?$/.exec(t); if (!m) throw new Error('bad rotation ' + t);
    return { ax: RAX[m[1]], q: !m[2] ? 1 : m[2][0] === '2' ? 2 : 3 };
  });

  /* ---- the cube ----
     state: stickers { p: position in unit cells, n: facing, c: colour letter }
     o: { N, pal, corner, box, turn: { ax, hit(p), th }, post: [{ ax, q }] } */
  function cube(state, o) {
    const N = o.N || 3, h = (N - 1) / 2, pal = o.pal || {}, cs = o.corner || [1, 1, 1], turn = o.turn || null, post = o.post || [];
    const T = cs[0] * cs[1] * cs[2] > 0 ? v => [cs[0] * v[0], cs[1] * v[1], cs[2] * v[2]] : v => [cs[2] * v[2], cs[1] * v[1], cs[0] * v[0]];
    const col = new Map(); for (const s of state) col.set(s.p.join() + '|' + s.n.join(), s.c);
    const hit = p => (turn ? turn.hit(p) : false);
    // a point of a turning piece swings round the axis; then the whole cube takes any final rotation
    const spin = (v, on) => { if (on && turn && turn.th) v = rotV(v, turn.ax, turn.th); for (const r of post) v = rotV(v, r.ax, r.q * Math.PI / 2); return v; };
    const inGrid = q => Math.abs(q[0]) <= h + 1e-9 && Math.abs(q[1]) <= h + 1e-9 && Math.abs(q[2]) <= h + 1e-9;
    let lo = 1e9;
    if (turn) for (let x = -h; x <= h; x++) for (let y = -h; y <= h; y++) for (let z = -h; z <= h; z++) if (hit([x, y, z])) lo = Math.min(lo, dot([x, y, z], turn.ax));
    let axs = 1;
    if (turn) { let a = turn.ax; for (const r of post) a = rotV(a, r.ax, r.q * Math.PI / 2); const t = T(a); axs = Math.sign(t[0] + t[1] + t[2]) || 1; }
    const faces = [];
    for (let x = -h; x <= h; x++) for (let y = -h; y <= h; y++) for (let z = -h; z <= h; z++) {
      const p = [x, y, z], on = hit(p);
      for (const d of DIRS) {
        const q = [x + d[0], y + d[1], z + d[2]];
        if (inGrid(q) && hit(q) === on) continue;                 // a face between two pieces that move together is never seen
        const nT = T(spin(d, on));
        if (nT[0] + nT[1] + nT[2] <= 1e-6) continue;               // facing away from the camera
        const c = col.get(p.join() + '|' + d.join()), ctr = [x + d[0] / 2, y + d[1] / 2, z + d[2] / 2];
        const [u, w] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].filter((_, i) => d[i] === 0);
        const quad = hw => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => T(spin([ctr[0] + hw * (a * u[0] + b * w[0]), ctr[1] + hw * (a * u[1] + b * w[1]), ctr[2] + hw * (a * u[2] + b * w[2])], on)));
        const body = quad(0.5);
        // the turning layer sits between two fixed ones; whichever is nearer the camera is drawn last
        const grp = !turn ? 0 : on ? 1 : dot(p, turn.ax) < lo ? 0 : 2;
        faces.push({ rank: axs > 0 ? grp : 2 - grp, depth: body.reduce((s, v) => s + v[0] + v[1] + v[2], 0) / 4, body, stick: c ? quad(K) : null, fill: c ? pal[c] || '#888' : BODY });
      }
    }
    faces.sort((a, b) => a.rank - b.rank || a.depth - b.depth);
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pts = quadV => quadV.map(v => { const X = (v[0] - v[2]) * H, Y = -v[1] + (v[0] + v[2]) * 0.5; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); return f2(X) + ',' + f2(Y); }).join(' ');
    const out = [];
    for (const f of faces) {
      out.push(`<polygon points="${pts(f.body)}" fill="${BODY}" stroke="${BODY}" stroke-width="0.04" stroke-linejoin="round"/>`);
      if (f.stick) out.push(`<polygon points="${pts(f.stick)}" fill="${f.fill}"/>`);
    }
    const own = `${f2(x0 - 0.15)} ${f2(y0 - 0.15)} ${f2(x1 - x0 + 0.3)} ${f2(y1 - y0 + 0.3)}`;
    return { svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${o.box || own}" style="overflow:visible">${out.join('')}</svg>`, box: own };
  }
  // the picture's frame is fixed by the cube at rest, so it never changes size while a layer swings out past it
  const boxes = new Map();
  function box(N, corner) {
    const k = N + '|' + corner.join();
    if (!boxes.has(k)) boxes.set(k, cube([], { N, corner }).box);
    return boxes.get(k);
  }

  /* ---- turns: what a move does, in the form the drawing needs ---- */
  const fromSim = (S, raws) => raws.filter(r => r.t).map(r => ({ ax: r.ax, q: r.t, hit: p => S.hits(r, p) }));
  const fromNxN = (sim, str) => sim.parse(str).filter(m => m.q % 4).map(m => ({ ax: m.ax, q: m.q % 4, hit: p => m.sel(dot([p[0] * 2, p[1] * 2, p[2] * 2], m.ax)) }));
  const undo = t => ({ ...t, q: (4 - t.q) % 4 });

  /* ---- timing ---- */
  function tween(ms, draw) {
    let raf = 0, done = false, resolve; const promise = new Promise(r => { resolve = r; });
    const end = snap => { if (done) return; done = true; cancelAnimationFrame(raf); if (snap) draw(1); resolve(); };
    if (!ms || reduced() || typeof requestAnimationFrame !== 'function') { draw(1); done = true; resolve(); return { promise, finish() {}, stop() {} }; }
    let t0 = 0;
    const tick = now => { if (done) return; if (!t0) t0 = now; const u = Math.min(1, (now - t0) / ms); draw(ease(u)); if (u < 1) raf = requestAnimationFrame(tick); else end(false); };
    raf = requestAnimationFrame(tick);
    return { promise, finish: () => end(true), stop: () => end(false) };
  }

  /* ---- a pair (or more) of pictures of one cube, all turning together ----
     o: { N, pal, corners: [[1,1,1], [-1,-1,-1]], post, stateAt(n), tokenAt(i), turns(token) -> [turn] } */
  function stage(o) {
    const post = o.post || [], corners = o.corners, frames = corners ? corners.map(c => box(o.N, c)) : null;
    // o.render(state, turn, i) draws picture i; cubes get the default below, other puzzles bring their own
    const render = o.render || ((state, turn, i) => cube(state, { N: o.N, pal: o.pal, corner: corners[i], post, box: frames[i], turn }).svg);
    const count = o.render ? o.count : corners.length;
    let els = [], active = null;
    const html = (state, turn) => Array.from({ length: count }, (_, i) => render(state, turn, i));
    const paint = (state, turn) => { const s = html(state, turn); els.forEach((el, i) => { if (el) el.innerHTML = s[i]; }); };
    const halt = () => { if (active) { active.stop(); active = null; } };
    return {
      count,
      markup: n => html(o.stateAt(n)).map(s => `<div class="ah">${s}</div>`).join(''),
      bind(list) { els = [...list]; },
      show(n) { halt(); paint(o.stateAt(n)); },
      // jump to the end of the move in progress
      finish() { if (active) active.finish(); },
      cancel: halt,
      busy: () => !!active,
      // play the moves between two positions, one after another; resolves when done (or when something else took over)
      walk(from, to) {
        halt();
        const dir = Math.sign(to - from); if (!dir) return Promise.resolve();
        paint(o.stateAt(from));
        const job = { stopped: false, tw: null };
        job.stop = () => { job.stopped = true; if (job.tw) job.tw.stop(); };
        job.finish = () => { job.stop(); paint(o.stateAt(to)); if (active === job) active = null; };
        active = job;
        return (async () => {
          for (let k = from; k !== to && !job.stopped; k += dir) {
            const ts = o.turns(o.tokenAt(dir > 0 ? k : k - 1));
            if (!ts.length) continue;
            const t = dir > 0 ? ts[0] : ts[0].inv ? ts[0].inv() : undo(ts[0]), state0 = o.stateAt(k), th = t.theta !== undefined ? t.theta : angle(t.q);
            job.tw = tween(msFor(t.q), e => paint(state0, { ...t, th: th * e }));
            await job.tw.promise;
          }
          if (!job.stopped) { paint(o.stateAt(to)); if (active === job) active = null; }
        })();
      }
    };
  }

  const api = { cube, box, stage, fromSim, fromNxN, undo, angle, msFor, tween, rotV, rotList, ease, reduced, BODY };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.Anim = api;
})(typeof window !== 'undefined' ? window : globalThis);
