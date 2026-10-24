/* Diagram renderers. Pure string builders, driven by the sticker simulator in sim.js. */
(function (g) {
  'use strict';
  const S = g.Sim || require('./sim.js');

  // Sticker colours: saturated, GAN-style. White on top, green in front.
  const P = { U: '#ffffff', D: '#ffd500', F: '#009b48', B: '#0046ad', R: '#b71234', L: '#ff5800' };
  // Last-layer diagrams are drawn the way cubers hold the cube: yellow on top, green in front.
  const LL = { U: '#ffd500', D: '#ffffff', F: '#009b48', B: '#0046ad', R: '#ff5800', L: '#b71234' };
  const OFF = '#303035', FACE = '#1b1b1e', DIM = '#2a2a2e';
  const f1 = n => Math.round(n * 100) / 100;

  /* Unfolded 3x3: the cross-shaped net with square stickers. */
  function net(state, pal) {
    pal = pal || P;
    const Z = 30, G = 3, at = { U: [3, 0], L: [0, 3], F: [3, 3], R: [6, 3], B: [9, 3], D: [3, 6] };
    let out = '';
    for (const f in at) {
      const grid = S.grid(state, f);
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out += `<rect x="${(at[f][0] + c) * Z + G / 2}" y="${(at[f][1] + r) * Z + G / 2}" width="${Z - G}" height="${Z - G}" fill="${pal[grid[r][c]]}"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${12 * Z} ${9 * Z}">${out}</svg>`;
  }

  /* Isometric cube. view 0 = Up/Front/Right, view 1 = the opposite corner (Down/Back/Left). */
  function iso(state, o) {
    o = o || {};
    const pal = o.pal || P, view = o.view || 0, H = Math.sqrt(3) / 2, k = 0.455;
    // Any of the 8 corners can face the camera. A proper rotation (never a mirror) takes that corner to Up/Front/Right.
    const cs = o.corner || (view ? [-1, -1, -1] : [1, 1, 1]);
    const T = cs[0] * cs[1] * cs[2] > 0 ? v => [cs[0] * v[0], cs[1] * v[1], cs[2] * v[2]] : v => [cs[2] * v[2], cs[1] * v[1], cs[0] * v[0]];
    const proj = v => [(v[0] - v[2]) * H, -v[1] + (v[0] + v[2]) * 0.5];
    const polys = [];
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    for (const st of state) {
      const n = T(st.n);
      if (n[0] + n[1] + n[2] <= 0) continue;
      const p = T(st.p), c = [p[0] + n[0] * 0.5, p[1] + n[1] * 0.5, p[2] + n[2] * 0.5];
      const [u, w] = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].filter((_, i) => n[i] === 0);
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([a, b]) => {
        const q = proj([c[0] + k * (a * u[0] + b * w[0]), c[1] + k * (a * u[1] + b * w[1]), c[2] + k * (a * u[2] + b * w[2])]);
        x0 = Math.min(x0, q[0]); x1 = Math.max(x1, q[0]); y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]);
        return f1(q[0]) + ',' + f1(q[1]);
      });
      const dim = o.gray && o.gray(st);
      polys.push(`<polygon points="${pts.join(' ')}" fill="${dim ? DIM : pal[st.c]}"/>`);
    }
    const pad = 0.05;
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${f1(x0 - pad)} ${f1(y0 - pad)} ${f1(x1 - x0 + 2 * pad)} ${f1(y1 - y0 + 2 * pad)}">${polys.join('')}</svg>`;
  }

  /* Last-layer top view.
     oll  : bright where the sticker faces up, grey otherwise; side bars only where yellow points sideways.
     coll : same top, plus every side sticker in its true colour.
     pll  : neutral top, true side colours, arrows showing where pieces travel. */
  function ll(state, mode, pal) {
    pal = pal || LL;
    const Z = 20, G = 2.5, X0 = (100 - (3 * Z + 2 * G)) / 2, T = 7, GAP = 2.5, W = 3 * Z + 2 * G;
    let arr = [];
    if (mode === 'pll') { const p = S.pll(state); state = p.state; arr = p.arrows; }
    const info = S.lastLayer(state);
    let out = '';
    const cellX = i => X0 + i * (Z + G);
    out += `<rect x="${f1(X0 - G)}" y="${f1(X0 - G)}" width="${W + 2 * G}" height="${W + 2 * G}" fill="${FACE}"/>`;
    for (let i = 0; i < 9; i++) {
      const lit = info.top[i] === 'U';
      const fill = mode === 'pll' ? pal.U : (lit ? pal.U : OFF);
      out += `<rect x="${f1(cellX(i % 3))}" y="${f1(cellX((i / 3) | 0))}" width="${Z}" height="${Z}" fill="${fill}"/>`;
    }
    const bar = (x, y, w, h, ch) => {
      if (mode === 'oll' && ch !== 'U') return '';
      return `<rect x="${f1(x)}" y="${f1(y)}" width="${w}" height="${h}" fill="${pal[ch]}"/>`;
    };
    for (let i = 0; i < 3; i++) {
      out += bar(cellX(i), X0 - GAP - T, Z, T, info.side[i]);                 // back, north
      out += bar(X0 + W + GAP, cellX(i), T, Z, info.side[3 + i]);              // right, east
      out += bar(cellX(i), X0 + W + GAP, Z, T, info.side[6 + i]);              // front, south
      out += bar(X0 - GAP - T, cellX(i), T, Z, info.side[9 + i]);              // left, west
    }
    if (mode === 'pll') {
      const ctr = ([x, z]) => [X0 + (x + 1) * (Z + G) + Z / 2, X0 + (z + 1) * (Z + G) + Z / 2];
      const head = (px, py, dx, dy) => {
        const L = 6.4, Wd = 3.6, nx = -dy, ny = dx;
        return `<polygon points="${f1(px)},${f1(py)} ${f1(px - dx * L + nx * Wd)},${f1(py - dy * L + ny * Wd)} ${f1(px - dx * L - nx * Wd)},${f1(py - dy * L - ny * Wd)}" fill="#111"/>`;
      };
      for (const a of arr) {
        const [ax, ay] = ctr(a.a), [bx, by] = ctr(a.b);
        const len = Math.hypot(bx - ax, by - ay), dx = (bx - ax) / len, dy = (by - ay) / len, cut = 3;
        const sx = ax + dx * cut, sy = ay + dy * cut, ex = bx - dx * cut, ey = by - dy * cut;
        out += `<line x1="${f1(sx + (a.both ? dx * 5 : 0))}" y1="${f1(sy + (a.both ? dy * 5 : 0))}" x2="${f1(ex - dx * 5)}" y2="${f1(ey - dy * 5)}" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>`;
        out += head(ex, ey, dx, dy);
        if (a.both) out += head(sx, sy, -dx, -dy);
      }
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${out}</svg>`;
  }

  const api = { P, LL, net, iso, ll };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.Draw = api;
})(typeof window !== 'undefined' ? window : globalThis);
