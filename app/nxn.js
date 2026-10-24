/* NxN sticker simulator (any size), used to check big-cube algorithms and to draw big cubes.
   Coordinates are odd integers: a 4×4 runs -3,-1,1,3. Stickers keep their home position (o) and colour (c). */
(function (g) {
  'use strict';
  const AX = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
  const NAME = { '0,1,0': 'U', '0,-1,0': 'D', '1,0,0': 'R', '-1,0,0': 'L', '0,0,1': 'F', '0,0,-1': 'B' };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const rot = (v, k) => { const d = dot(k, v), c = cross(k, v); return [k[0] * d - c[0] + 0, k[1] * d - c[1] + 0, k[2] * d - c[2] + 0]; };

  function make(N) {
    const H = N - 1, vals = []; for (let v = -H; v <= H; v += 2) vals.push(v);
    const kind = o => o.filter(v => Math.abs(v) === H).length;
    function solved() {
      const s = [];
      for (const x of vals) for (const y of vals) for (const z of vals) {
        if (Math.abs(x) !== H && Math.abs(y) !== H && Math.abs(z) !== H) continue;
        const p = [x, y, z];
        for (let a = 0; a < 3; a++) if (Math.abs(p[a]) === H) { const n = [0, 0, 0]; n[a] = Math.sign(p[a]); s.push({ p, n, c: NAME[n.join()], o: p }); }
      }
      return s;
    }
    function parse(str) {
      const out = [];
      for (const t of String(str).replace(/[’]/g, "'").replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean)) {
        const m = /^(\d?)([UDLRFBudlrfbxyz])(w?)(2'?|')?$/.exec(t); if (!m) throw new Error('bad move ' + t);
        const L = m[2], suf = m[4] || '', q = suf[0] === '2' ? 2 : suf === "'" ? 3 : 1;
        if ('xyz'.includes(L)) { out.push({ ax: AX[{ x: 'R', y: 'U', z: 'F' }[L]], q, sel: () => true }); continue; }
        const face = L.toUpperCase(), ax = AX[face], wide = m[3] === 'w' || L !== face, num = m[1] ? +m[1] : 0;
        out.push({ ax, q, sel: d => { const layer = (H - d) / 2 + 1; return num ? (wide ? layer <= num : layer === num) : wide ? layer <= 2 : layer === 1; } });
      }
      return out;
    }
    function run(str, base) {
      const s = (base || solved()).map(x => ({ ...x }));
      for (const mv of parse(str)) for (let i = 0; i < s.length; i++) {
        if (!mv.sel(dot(s[i].p, mv.ax))) continue;
        let p = s[i].p, n = s[i].n; for (let j = 0; j < mv.q; j++) { p = rot(p, mv.ax); n = rot(n, mv.ax); }
        s[i] = { p, n, c: s[i].c, o: s[i].o };
      }
      return s;
    }
    // inverse of a move string: reverse the order and flip each turn
    const invert = str => String(str).replace(/[’]/g, "'").replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean).reverse()
      .map(t => { const m = /^(.*?)(2'?|')?$/.exec(t); return m[2] && m[2][0] === '2' ? m[1] + '2' : m[2] === "'" ? m[1] : m[1] + "'"; }).join(' ');
    const NAMEOF = p => (p[1] > 0 ? 'U' : p[1] < 0 ? 'D' : '') + (p[2] > 0 ? 'F' : p[2] < 0 ? 'B' : '') + (p[0] > 0 ? 'R' : p[0] < 0 ? 'L' : '');
    // what an algorithm does to a solved cube, in terms a cuber would use
    function effect(alg) {
      const s = run(alg); let centres = 0, corners = 0; const edgeStickers = new Map(), moved = new Set();
      for (const x of s) {
        const kd = kind(x.o), face = NAME[x.n.join()];
        if (kd === 1 && x.c !== face) centres++;
        if (kd === 3 && x.c !== face) corners++;
        if (kd === 2) {
          const key = x.o.map(v => Math.abs(v) === H ? Math.sign(v) : 0).join(',');
          const e = edgeStickers.get(key) || { bad: 0 }; if (x.c !== face) e.bad++; edgeStickers.set(key, e);
        }
      }
      const bad = [...edgeStickers].filter(([, e]) => e.bad).map(([k]) => NAMEOF(k.split(',').map(Number)));
      return { centres, corners, edges: bad };
    }
    // the picture a solver sees: every sticker, positions in unit cells
    const view = s => s.map(x => ({ p: x.p.map(v => v / 2), n: x.n, c: x.c, o: x.o.map(v => v / 2) }));
    return { N, H, solved, parse, run, invert, effect, view, kind };
  }

  const api = { make };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.NxN = api;
})(typeof window !== 'undefined' ? window : globalThis);
