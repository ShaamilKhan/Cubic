/* Tiny 3x3 sticker simulator. Every sticker keeps a position, a facing, its colour (home face letter) and its home position. */
(function (g) {
  'use strict';
  const AX = { U: [0, 1, 0], D: [0, -1, 0], R: [1, 0, 0], L: [-1, 0, 0], F: [0, 0, 1], B: [0, 0, -1] };
  const NAME = { '0,1,0': 'U', '0,-1,0': 'D', '1,0,0': 'R', '-1,0,0': 'L', '0,0,1': 'F', '0,0,-1': 'B' };
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  // quarter turn clockwise when looking at the origin from the tip of k
  const rot = (v, k) => { const d = dot(k, v), c = cross(k, v); return [k[0] * d - c[0] + 0, k[1] * d - c[1] + 0, k[2] * d - c[2] + 0]; };

  function solved() {
    const s = [];
    for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = -1; z <= 1; z++) {
      if (!x && !y && !z) continue;
      const p = [x, y, z];
      for (let a = 0; a < 3; a++) if (p[a]) { const n = [0, 0, 0]; n[a] = p[a]; s.push({ p, n, c: NAME[n.join()], o: p }); }
    }
    return s;
  }

  const SLICE = { M: 'L', E: 'D', S: 'F' }, ROT = { x: 'R', y: 'U', z: 'F' };
  function parse(str) {
    const out = [];
    const toks = String(str).replace(/[’‘]/g, "'").replace(/[()[\]]/g, ' ').trim().split(/\s+/).filter(Boolean);
    for (const t of toks) {
      const m = /^([UDLRFBudlrfbMESxyz])(w?)([23]?)('?)([23]?)('?)$/.exec(t);
      if (!m) throw new Error('bad move ' + t);
      const L = m[1], n = Number(m[3] || m[5] || 1), prime = m[4] || m[6];
      let t4 = n % 4; if (prime) t4 = (4 - t4) % 4;
      let ax, mode;
      if (SLICE[L]) { ax = AX[SLICE[L]]; mode = 'slice'; }
      else if (ROT[L]) { ax = AX[ROT[L]]; mode = 'all'; }
      else if (m[2] || L === L.toLowerCase()) { ax = AX[L.toUpperCase()]; mode = 'wide'; }
      else { ax = AX[L]; mode = 'face'; }
      out.push({ ax, mode, t: t4 });
    }
    return out;
  }

  // does this move turn the piece at p? (also used by the turning animation, so both always agree)
  const hits = (mv, p) => { const d = dot(p, mv.ax); return mv.mode === 'all' || (mv.mode === 'face' && d === 1) || (mv.mode === 'wide' && d >= 0) || (mv.mode === 'slice' && d === 0); };
  function apply(s, moves) {
    for (const mv of moves) {
      for (let i = 0; i < s.length; i++) {
        if (!hits(mv, s[i].p)) continue;
        let p = s[i].p, n = s[i].n;
        for (let q = 0; q < mv.t; q++) { p = rot(p, mv.ax); n = rot(n, mv.ax); }
        s[i] = { p, n, c: s[i].c, o: s[i].o };
      }
    }
    return s;
  }
  const invert = moves => moves.slice().reverse().map(m => ({ ax: m.ax, mode: m.mode, t: (4 - m.t) % 4 }));
  const run = (str, base) => apply(base || solved(), parse(str));

  // 3x3 grid of colour letters for one face, as seen from outside with the usual "up"
  function grid(s, face) {
    const k = AX[face], G = [[], [], []];
    for (const st of s) {
      if (st.n[0] !== k[0] || st.n[1] !== k[1] || st.n[2] !== k[2]) continue;
      const [x, y, z] = st.p; let r, c;
      if (face === 'U') { r = z + 1; c = x + 1; }
      else if (face === 'D') { r = 1 - z; c = x + 1; }
      else if (face === 'F') { r = 1 - y; c = x + 1; }
      else if (face === 'B') { r = 1 - y; c = 1 - x; }
      else if (face === 'R') { r = 1 - y; c = 1 - z; }
      else { r = 1 - y; c = z + 1; }
      G[r][c] = st.c;
    }
    return G;
  }

  // top layer as seen from above: nine top stickers + twelve side stickers (back, right, front, left)
  // Colours are returned relative to the centres (U = same colour as the top centre, F = the front centre's...),
  // so a setup that ends with a cube rotation still draws the same way a cuber would see it.
  function lastLayer(s) {
    const rel = {};
    for (const st of s) if (st.o.filter(v => v !== 0).length === 1) rel[st.c] = NAME[st.n.join()];
    const top = grid(s, 'U').flat().map(c => rel[c]).join('');
    const side = { B: [], R: [], F: [], L: [] };
    for (const st of s) {
      if (st.p[1] !== 1 || st.n[1] !== 0) continue;
      const [x, , z] = st.p, c = rel[st.c];
      if (st.n[2] === -1) side.B[x + 1] = c;
      else if (st.n[0] === 1) side.R[z + 1] = c;
      else if (st.n[2] === 1) side.F[x + 1] = c;
      else side.L[z + 1] = c;
    }
    return { top, side: side.B.join('') + side.R.join('') + side.F.join('') + side.L.join('') };
  }

  const faceUniform = (s, f) => { const q = grid(s, f).flat(); return q.every(v => v === q[0]); };
  const isSolved = s => 'UDFBLR'.split('').every(f => faceUniform(s, f));
  function lowerSolved(s) {
    for (const f of 'FRBL') { const G = grid(s, f); const c = G[1][1]; if (!(G[1].every(v => v === c) && G[2].every(v => v === c))) return false; }
    const D = grid(s, 'D').flat(); return D.every(v => v === D[0]);
  }

  // PLL arrows: where each top-layer piece must travel to reach its home slot.
  // A setup may end with a y rotation, so homes are rotated by however far the whole cube has turned.
  // Library algorithms often carry a U turn that lines the layer up, so the raw state can be one U away
  // from the textbook chart. Try all four alignments and keep the chart form: fewest pieces moving,
  // then shortest cycles (G perms are 3+3, never a 4-cycle).
  function longestCycle(a) {
    const next = new Map(); let best = 0;
    for (const r of a) { next.set(r.a.join(), r.b.join()); if (r.both) next.set(r.b.join(), r.a.join()); }
    for (const start of next.keys()) { let n = 0, k = start; do { k = next.get(k); n++; } while (k !== undefined && k !== start && n < 9); best = Math.max(best, n); }
    return best;
  }
  function pll(s0) {
    let best = null;
    for (let j = 0; j < 4; j++) {
      const st = apply(s0.map(x => ({ ...x })), [{ ax: AX.U, mode: 'face', t: j }]);
      const a = arrowsRaw(st);
      const score = [a.reduce((m, r) => m + (r.both ? 2 : 1), 0), longestCycle(a)];
      if (!best || score[0] < best.s[0] || (score[0] === best.s[0] && score[1] < best.s[1])) best = { s: score, a, state: st };
    }
    return { state: best.state, arrows: best.a };
  }
  const arrows = s => pll(s).arrows;
  function arrowsRaw(s) {
    const fc = s.find(x => x.c === 'F' && x.o[0] === 0 && x.o[1] === 0 && x.o[2] === 1);
    let k = 0, v = fc.o;
    while (k < 4 && !(v[0] === fc.p[0] && v[1] === fc.p[1] && v[2] === fc.p[2])) { v = rot(v, AX.U); k++; }
    const home = o => { let q = o; for (let i = 0; i < k; i++) q = rot(q, AX.U); return q; };
    const raw = [];
    for (const st of s) {
      if (st.c !== 'U' || st.n[1] !== 1 || st.p[1] !== 1 || (!st.p[0] && !st.p[2])) continue;
      const h = home(st.o);
      if (h[0] === st.p[0] && h[2] === st.p[2]) continue;
      raw.push({ a: [st.p[0], st.p[2]], b: [h[0], h[2]], both: false });
    }
    const out = [];
    for (const r of raw) {
      const twin = out.find(o => o.a.join() === r.b.join() && o.b.join() === r.a.join());
      if (twin) twin.both = true; else out.push(r);
    }
    return out;
  }

  // Rewrite a sequence with whole-cube rotations (x y z) so it has none: every turn is relabelled to the
  // face it lands on in the final orientation. The cube ends up looking identical to a cuber holding it.
  const SL = { L: ['M', 1], R: ['M', -1], D: ['E', 1], U: ['E', -1], F: ['S', 1], B: ['S', -1] };
  function deRotate(str) {
    const T = String(str).replace(/[’‘]/g, "'").replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
    const turns = []; let after = [];
    const out = new Array(T.length).fill(null);
    for (let i = T.length - 1; i >= 0; i--) {
      const t = T[i], m = /^([xyz])(2'?|')?$/.exec(t);
      if (m) { const q = m[2] && m[2][0] === '2' ? 2 : m[2] === "'" ? 3 : 1; after.unshift({ k: AX[{ x: 'R', y: 'U', z: 'F' }[m[1]]], q }); continue; }
      const mv = /^([UDLRFBudlrfbMES])(w?)(2'?|')?$/.exec(t); if (!mv) throw new Error('bad move ' + t);
      const map = v => { for (const r of after) for (let j = 0; j < r.q; j++) v = rot(v, r.k); return v; };
      let L = mv[1], suf = mv[3] || '', flip = false; if (suf === "2'") suf = '2';
      if ('MES'.includes(L)) {
        const base = { M: 'L', E: 'D', S: 'F' }[L], nl = NAME[map(AX[base]).join()], [sl, sign] = SL[nl];
        L = sl; if (sign < 0) flip = true;
      } else {
        const up = L.toUpperCase(), nl = NAME[map(AX[up]).join()];
        L = L === up ? nl : nl.toLowerCase();
      }
      if (flip) suf = suf === '2' ? '2' : suf === "'" ? '' : "'";
      out[i] = L + mv[2] + suf;
    }
    return out.filter(Boolean).join(' ');
  }

  // A wide move is a face turn plus a whole-cube rotation: Rw = L x, Uw = D y, Fw = B z (and Lw = R x', Dw = U y', Bw = F z').
  // A rotation can be moved to the end of the sequence if every move after it is relabelled by where its face went; deRotate already
  // does that relabelling for rotations that come AFTER a move (it works backwards from the end). So: rewrite each wide move as its
  // face turn followed by its rotation, then deRotate the whole thing. The result never moves a centre and is the same cube, held
  // the way a solver expects: white face where the solver expects white, etc.
  const WIDE = { R: ['L', 'x', 1], L: ['R', 'x', -1], U: ['D', 'y', 1], D: ['U', 'y', -1], F: ['B', 'z', 1], B: ['F', 'z', -1] };
  function normalize(str) {
    const out = [];
    for (const t of String(str).replace(/[’‘]/g, "'").replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean)) {
      const m = /^([URFDLB])w(2'?|')?$/.exec(t);
      if (!m) { out.push(t); continue; }
      const [face, rot, dir] = WIDE[m[1]], suf = m[2] ? (m[2][0] === '2' ? '2' : "'") : '';
      const rsuf = suf === '2' ? '2' : (dir > 0 ? suf : (suf === "'" ? '' : "'"));
      out.push(face + suf, rot + rsuf);
    }
    return out.join(' ');
  }
  // the whole-cube turn a scramble leaves the cube in, as a short move string: how to get the centres back home
  const ROTS24 = (() => { const r = []; for (const a of ['', 'x', 'x2', "x'", 'z', "z'"]) for (const b of ['', 'y', 'y2', "y'"]) r.push((a + ' ' + b).trim()); return r; })();
  function homeTurn(str) {
    const base = run(str);
    for (const r of ROTS24) { const t = r ? run(r, base.map(x => ({ ...x }))) : base; if ('UDFBLR'.split('').every(f => grid(t, f)[1][1] === f)) return r; }
    return null;
  }
  // scramble written with only face turns, giving the same cube as the original once the cube is turned so its centres are home
  function faceOnly(str) {
    const n = normalize(str), r = homeTurn(n);
    return r === null ? n : deRotate(n + (r ? ' ' + r : ''));
  }

  const api = { hits, faceOnly, homeTurn, normalize, deRotate, AX, solved, parse, apply, invert, run, grid, lastLayer, isSolved, lowerSolved, arrows, pll };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.Sim = api;
})(typeof window !== 'undefined' ? window : globalThis);
