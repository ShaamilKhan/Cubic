/* Views: 3D pictures for every puzzle, showing only what a case needs.
   - cubes (2×2 to 7×7): last-layer top view with its ring of side stickers, or a 3D corner view
   - Pyraminx, Skewb, Megaminx: real 3D pieces from csTimer's geometry, seen from the best corner,
     or (Megaminx last layer) from straight above with the ring of side stickers. */
(function (g) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Sim = g.Sim || (node && require('./sim.js'));
  const NxN = g.NxN || (node && require('./nxn.js'));
  const Draw = g.Draw || (node && require('./render.js'));
  if (node && !g.poly3d) require('./poly3d.js');
  const poly3d = g.poly3d;
  const f1 = n => Math.round(n * 100) / 100;
  const DARK = '#2e2e33', FACE = '#1b1b1e';

  // arrows: list of {a:[x,y], b:[x,y], both} in the 0-100 picture space
  function arrowSvg(list) {   // identical to the 3×3 PLL arrows in render.js: thin dark line, small dark head
    let o = '';
    const head = (px, py, dx, dy) => {
      const L = 6.4, Wd = 3.6, nx = -dy, ny = dx;
      return '<polygon points="' + f1(px) + ',' + f1(py) + ' ' + f1(px - dx * L + nx * Wd) + ',' + f1(py - dy * L + ny * Wd) + ' ' + f1(px - dx * L - nx * Wd) + ',' + f1(py - dy * L - ny * Wd) + '" fill="#111"/>';
    };
    for (const r of list) {
      const len = Math.hypot(r.b[0] - r.a[0], r.b[1] - r.a[1]) || 1, dx = (r.b[0] - r.a[0]) / len, dy = (r.b[1] - r.a[1]) / len, cut = 3;
      const sx = r.a[0] + dx * cut, sy = r.a[1] + dy * cut, ex = r.b[0] - dx * cut, ey = r.b[1] - dy * cut;
      o += '<line x1="' + f1(sx + (r.both ? dx * 5 : 0)) + '" y1="' + f1(sy + (r.both ? dy * 5 : 0)) + '" x2="' + f1(ex - dx * 5) + '" y2="' + f1(ey - dy * 5) + '" stroke="#111" stroke-width="2.4" stroke-linecap="round"/>';
      o += head(ex, ey, dx, dy);
      if (r.both) o += head(sx, sy, -dx, -dy);
    }
    return o;
  }
  // merge a→b with b→a into one two-way arrow
  function mergeArrows(list) {
    const out = [];
    for (const r of list) {
      const twin = out.find(o => o.ka === r.kb && o.kb === r.ka);
      if (twin) twin.both = true; else out.push({ ...r, both: false });
    }
    return out;
  }

  /* ================= cubes ================= */
  const sims = {};
  const sim = N => sims[N] || (sims[N] = NxN.make(N));
  const LET = n => ({ '0,1,0': 'U', '0,-1,0': 'D', '1,0,0': 'R', '-1,0,0': 'L', '0,0,1': 'F', '0,0,-1': 'B' })[n.join()];
  const ROT = (() => { const out = []; for (const a of ['', 'x', 'x2', "x'", 'z', "z'"]) for (const b of ['', 'y', 'y2', "y'"]) out.push((a + ' ' + b).trim()); return out; })();
  const matches = st => { let m = 0; for (const x of st) if (x.c === LET(x.n)) m++; return m; };
  // the whole-cube turn that puts a state back in its natural orientation (most stickers on their own colour)
  function turnFor(N, st) {
    const s = sim(N); let best = '', bm = -1;
    for (const r of ROT) { const m = matches(r ? s.run(r, st) : st); if (m > bm) { bm = m; best = r; } }
    return best;
  }
  // state after setup (and optionally some of an algorithm), shown in its natural orientation
  function cubeState(N, setup, alg, turn) {
    const s = sim(N), base = s.run(setup || '');
    const t = turn === undefined ? turnFor(N, base) : turn;
    const st = alg ? s.run(alg, base) : base;
    return { st: t ? s.run(t, st) : st, turn: t };
  }
  const CORNERS = [[1, 1, 1], [-1, 1, 1], [-1, 1, -1], [1, 1, -1], [1, -1, 1], [-1, -1, 1], [-1, -1, -1], [1, -1, -1]];
  function bestCorner(st) {
    let best = CORNERS[0], bs = -1;
    for (const c of CORNERS) { let sc = 0; for (const x of st) if (x.n[0] * c[0] + x.n[1] * c[1] + x.n[2] * c[2] > 0 && x.c !== LET(x.n)) sc++; if (sc > bs) { bs = sc; best = c; } }
    return best;
  }
  const opposite = c => c.map(v => -v);

  // top-face stickers whose piece is away from home. Centres are skipped: swapping identical centres is not a case to learn.
  function arrowPairs(st, H) {
    const out = [];
    for (const x of st) {
      if (x.p[1] !== H || x.n[1] !== 1 || x.c !== 'U' || x.o[1] !== H || x.p.join() === x.o.join()) continue;
      if (Math.abs(x.o[0]) < H && Math.abs(x.o[2]) < H) continue;
      out.push({ p: x.p, o: x.o });
    }
    return out;
  }
  const MAXARROWS = 6;
  // turn the top layer to the alignment that needs the fewest arrows; the result is empty when even that is cluttered
  function alignCube(N, st) {
    const s = sim(N), H = N - 1; let best = null;
    for (let a = 0; a < 4; a++) {
      const t = a ? s.run(Array(a).fill('U').join(' '), st) : st;
      const n = mergeArrows(arrowPairs(t, H).map(x => ({ ka: x.p.join(), kb: x.o.join() }))).length;
      if (!best || n < best.n) best = { n, t };
    }
    return best.n <= MAXARROWS ? best.t : null;
  }
  /* last layer from above: the top face as an N×N grid, and the row of side stickers touching it */
  function llView(st, N, o) {
    o = o || {};
    const H = N - 1, pal = o.pal || Draw.LL, orient = o.mode === 'oll';
    const margin = 5, T = N <= 3 ? 8 : 6, GAP = 3, inner = 100 - 2 * (margin + T + GAP);
    const G = N <= 3 ? 2.2 : 1.1, Z = (inner - (N - 1) * G) / N, x0 = margin + T + GAP, span = inner;
    const cell = i => x0 + i * (Z + G);
    let out = `<rect x="${f1(x0 - G)}" y="${f1(x0 - G)}" width="${f1(span + 2 * G)}" height="${f1(span + 2 * G)}" fill="${FACE}"/>`;
    const lit = c => (orient ? (c === 'U' ? pal.U : DARK) : pal[c]);
    for (const x of st) {
      if (x.p[1] === H && x.n[1] === 1) {                       // top face
        const c = (x.p[0] + H) / 2, r = (x.p[2] + H) / 2;
        out += `<rect x="${f1(cell(c))}" y="${f1(cell(r))}" width="${f1(Z)}" height="${f1(Z)}" fill="${lit(x.c)}"/>`;
      } else if (x.p[1] === H && x.n[1] === 0) {                // ring of side stickers
        if (orient && x.c !== 'U') continue;
        const c = (x.p[0] + H) / 2, r = (x.p[2] + H) / 2;
        let rx, ry, w, h;
        if (x.n[2] === -1) { rx = cell(c); ry = x0 - GAP - T; w = Z; h = T; }
        else if (x.n[2] === 1) { rx = cell(c); ry = x0 + span + GAP; w = Z; h = T; }
        else if (x.n[0] === 1) { rx = x0 + span + GAP; ry = cell(r); w = T; h = Z; }
        else { rx = x0 - GAP - T; ry = cell(r); w = T; h = Z; }
        out += `<rect x="${f1(rx)}" y="${f1(ry)}" width="${f1(w)}" height="${f1(h)}" fill="${pal[x.c]}"/>`;
      }
    }
    if (o.arrows) {
      const ctr = q => [cell((q[0] + H) / 2) + Z / 2, cell((q[2] + H) / 2) + Z / 2];
      out += arrowSvg(mergeArrows(arrowPairs(st, H).map(x => ({ a: ctr(x.p), b: ctr(x.o), ka: x.p.join(), kb: x.o.join() }))));
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${out}</svg>`;
  }
  function isoView(st, N, corner, pal) { return Draw.iso(sim(N).view(st), { pal: pal || Draw.LL, corner }); }

  /* ================= polyhedra: Pyraminx, Skewb, Megaminx ================= */
  const polys = {};
  function puzzle(name) {
    if (polys[name]) return polys[name];
    const b = poly3d.getFamousPuzzle(name), puz = poly3d.makePuzzle.apply(poly3d, b.polyParam), pieces = [];
    puz.enumFacesPolys((face, i, poly, idx) => { pieces[idx] = { face, v: poly.paths.map(p => [p.p1.x, p.p1.y, p.p1.z]), c: [poly.center.x, poly.center.y, poly.center.z], n: [poly.norm.x, poly.norm.y, poly.norm.z] }; });
    return (polys[name] = { b, puz, pieces, norms: puz.facePlanes.map(p => [p.norm.x, p.norm.y, p.norm.z]) });
  }
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const len = a => Math.hypot(a[0], a[1], a[2]);
  const unit = a => { const l = len(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
  const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
  const scale = (a, k) => [a[0] * k, a[1] * k, a[2] * k];

  // which colour sits on each piece after some moves (same replay rule csTimer uses for its own pictures)
  function posit(name, moves, from) {
    const P = puzzle(name); let pos = from ? from.slice() : P.pieces.map(p => p.face);
    if (!moves || !String(moves).trim()) return pos;
    for (const mv of P.b.parser.parseScramble(String(moves).replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim())) {
      const idx = P.puz.getTwistyIdx(mv[0]); if (idx < 0) throw new Error('unknown move ' + mv[0]);
      const perm = P.puz.moveTable[idx], maxPow = P.puz.twistyDetails[idx][1], pow = ((mv[1] % maxPow) + maxPow) % maxPow, next = [];
      for (let i = 0; i < pos.length; i++) { let v = i; for (let j = 0; j < pow; j++) v = perm[v] < 0 ? v : perm[v]; next[i] = pos[v]; }
      pos = next;
    }
    return pos;
  }
  const changedCount = (name, pos, d) => { const P = puzzle(name); let n = 0; P.pieces.forEach((p, i) => { if (dot(p.n, d) > 0.03 && pos[i] !== p.face) n++; }); return n; };

  // candidate viewpoints: Pyraminx sees three faces from the corner opposite each face, Skewb from each of 8 corners
  function candidates(name) {
    const P = puzzle(name);
    if (name === 'pyr') return P.norms.map(n => unit(scale(n, -1)));
    if (name === 'skb') { const out = []; for (const a of [1, -1]) for (const b of [1, -1]) for (const c of [1, -1]) out.push(unit(add(add(scale(P.norms[0], a), scale(P.norms[1], b)), scale(P.norms[2], c)))); return out; }
    const v = unit(add(add(P.norms[0], P.norms[1]), P.norms[2])); return [v, scale(v, -1)];
  }
  function bestView(name, pos) {
    const c = candidates(name); let best = c[0], bs = -1;
    for (const d of c) { const s = changedCount(name, pos, d); if (s > bs) { bs = s; best = d; } }
    return best;
  }

  /* o: { d: direction toward the viewer, up: screen-up hint, minH + axis: only keep pieces near a face, mask: face index to highlight } */
  function polySvg(name, pos, o) {
    const P = puzzle(name), pal = g.POLY_PAL[name], d = unit(o.d);
    let u = o.up || [0, 1, 0]; u = add(u, scale(d, -dot(u, d)));
    if (len(u) < 1e-6) u = add([0, 0, 1], scale(d, -d[2]));
    u = unit(u); const r = unit(cross(u, d));
    const vis = [];
    P.pieces.forEach((p, i) => { if (dot(p.n, d) > 0.03 && (!o.axis || dot(p.c, o.axis) >= o.minH)) vis.push(i); });
    vis.sort((a, b) => dot(P.pieces[a].c, d) - dot(P.pieces[b].c, d));
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    const pr = vis.map(i => P.pieces[i].v.map(v => { const x = dot(v, r), y = -dot(v, u); x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); return [x, y]; }));
    const k = 88 / Math.max(x1 - x0, y1 - y0), ox = 50 - ((x0 + x1) / 2) * k, oy = 50 - ((y0 + y1) / 2) * k;
    let out = '';
    vis.forEach((i, j) => {
      const c = o.mask !== undefined ? (pos[i] === o.mask ? pal[o.mask] : DARK) : pal[pos[i]];
      out += `<polygon points="${pr[j].map(q => f1(q[0] * k + ox) + ',' + f1(q[1] * k + oy)).join(' ')}" fill="${c}" stroke="#000" stroke-width="${o.stroke || 1.1}" stroke-linejoin="round"/>`;
    });
    if (o.arrows && o.arrows.length) {
      const ctr = new Map(); vis.forEach((i, j) => { const q = pr[j]; ctr.set(i, [q.reduce((s, v) => s + v[0], 0) / q.length * k + ox, q.reduce((s, v) => s + v[1], 0) / q.length * k + oy]); });
      const list = o.arrows.filter(r => ctr.has(r.a) && ctr.has(r.b)).map(r => ({ a: ctr.get(r.a), b: ctr.get(r.b), ka: r.a, kb: r.b }));
      out += arrowSvg(mergeArrows(list));
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">${out}</svg>`;
  }
  // pieces on the top face that sit away from home: replay the moves on piece numbers instead of colours
  // which top-face polygons are corners and which are edges: the five farther from the middle are corners
  function topKinds(name) {
    const P = puzzle(name), c0 = P.norms[0], idx = [];
    P.pieces.forEach((p, i) => { if (p.face === 0 && dot(p.c, c0) > 0.9) idx.push(i); });
    const dist = i => len(add(P.pieces[i].c, scale(c0, -dot(P.pieces[i].c, c0))));
    idx.sort((a, b) => dist(a) - dist(b));
    return { centre: idx.slice(0, 1), edges: idx.slice(1, 6), corners: idx.slice(6, 11) };
  }
  // kind: 'corners' | 'edges'. The top layer is turned to the alignment that needs the fewest arrows.
  function topArrows(name, moves, kind) {
    const P = puzzle(name), K = topKinds(name), only = new Set(kind === 'edges' ? K.edges : K.corners);
    let best = null;
    for (let u = 0; u < 5; u++) {
      const mv = (moves || '') + ' ' + Array(u).fill('U').join(' '), origin = posit(name, mv, P.pieces.map((p, i) => i)), out = [];
      P.pieces.forEach((p, j) => { const i = origin[j]; if (i !== j && only.has(j) && only.has(i)) out.push({ a: j, b: i }); });
      const n = mergeArrows(out.map(r => ({ ka: r.a, kb: r.b }))).length;
      if (!best || n < best.n) best = { n, out, mv };
    }
    return best.n && best.n <= 5 ? { arrows: best.out, moves: best.mv } : null;
  }
  // Megaminx last layer: straight down onto the top face; the ring of side stickers that touch it shows too
  function megaLL(pos, mask, arrows) {
    const P = puzzle('mgm');
    return polySvg('mgm', pos, { d: P.norms[0], up: scale(P.norms[1], -1), axis: P.norms[0], minH: 0.7, mask, stroke: 1.2, arrows });
  }

  /* ================= one entry point per kind of picture ================= */
  // kind: 'nxn:N' or 'poly:name'; mode: 'll' | 'oll' | 'best'
  function split(kind) { const [t, v] = kind.split(':'); return [t, t === 'nxn' ? +v : v]; }
  function views(kind, mode, setup, alg, memo) {
    const [t, v] = split(kind);
    if (t === 'nxn') {
      const N = v, cs = cubeState(N, setup, alg, memo && memo.turn);
      if (memo) memo.turn = cs.turn;
      const ll = (mode === 'll' || mode === 'oll');
      const c1 = ll ? [1, 1, 1] : bestCorner(cs.st);
      let top = cs.st, arrows = false;
      if (mode === 'll' && !alg && !cs.turn) { const al = alignCube(N, cs.st); if (al) { top = al; arrows = true; } }
      const llv = ll ? llView(top, N, { mode, arrows }) : null;
      return { top: llv, a: isoView(cs.st, N, c1), b: isoView(cs.st, N, opposite(c1)), card: ll ? llv : isoView(cs.st, N, c1) };
    }
    const pos = posit(v, (setup || '') + ' ' + (alg || ''));
    if (v === 'mgm') {
      const mask = mode === 'oll' ? 0 : undefined, P = puzzle('mgm'), d = unit(add(add(P.norms[0], P.norms[1]), P.norms[2]));
      // 'llc' / 'lle': permutation cases, drawn with arrows for the corners / the edges that have to swap
      let topPos = pos, arrows = null;
      if ((mode === 'llc' || mode === 'lle') && !alg) { const t = topArrows('mgm', setup || '', mode === 'lle' ? 'edges' : 'corners'); if (t) { arrows = t.arrows; topPos = posit('mgm', t.moves); } }
      const top = megaLL(topPos, mask, arrows);
      return { top, a: polySvg('mgm', pos, { d, up: [0, 1, 0] }), b: polySvg('mgm', pos, { d: scale(d, -1), up: [0, 1, 0] }), card: top };
    }
    const d = memo && memo.d ? memo.d : bestView(v, posit(v, setup || ''));
    if (memo) memo.d = d;
    const a = polySvg(v, pos, { d });
    // the far side only earns its place if something on it is out of order
    const P = puzzle(v), back = scale(d, -1), seen = new Set();
    P.pieces.forEach((p, i) => { if (dot(p.n, back) > 0.03) seen.add(pos[i]); });
    const b = seen.size > 1 ? polySvg(v, pos, { d: back }) : null;
    return { top: null, a, b, card: a };
  }
  const full = (kind, scramble, which) => {   // a whole puzzle, for the Learn pages
    const [t, v] = split(kind);
    if (t === 'nxn') { const st = sim(v).run(scramble || ''); return isoView(st, v, which ? [-1, -1, -1] : [1, 1, 1]); }
    const pos = posit(v, scramble || ''), P = puzzle(v);
    const d = v === 'mgm' ? unit(add(add(P.norms[0], P.norms[1]), P.norms[2])) : v === 'pyr' ? unit(scale(P.norms[0], -1)) : unit(add(add(P.norms[0], P.norms[1]), P.norms[2]));
    return polySvg(v, pos, { d: which ? scale(d, -1) : d });
  };

  const api = { views, full, llView, isoView, posit, puzzle, polySvg, megaLL, cubeState, turnFor, bestCorner, sim };
  if (node) module.exports = api; else g.Views = api;
})(typeof window !== 'undefined' ? window : globalThis);
