// Draws every picture the Learn guides use, from the engine and the sticker models. Output: app/learn-pics.js
const fs = require('fs');
const C = 'C:/Projects/Cubetimer/app/';
const engine = require('C:/Projects/Cubetimer/source/engine.js');
const Sim = require(C + 'sim.js'); globalThis.Sim = Sim;
const Draw = require(C + 'render.js');
const { make } = require(C + 'nxn.js');
const SQ = require('./sq1merge.cjs');
globalThis.NxN = require(C + 'nxn.js'); globalThis.Draw = Draw; require(C + 'poly3d.js');
globalThis.POLY_PAL = new Function('window', fs.readFileSync(C + 'poly-pal.js', 'utf8') + ';return window.POLY_PAL;')({});
const V = require(C + 'views.js');
const KIND = { '2×2': 'nxn:2', '4×4': 'nxn:4', '5×5': 'nxn:5', '6×6': 'nxn:6', '7×7': 'nxn:7', Mega: 'poly:mgm', Pyra: 'poly:pyr', Skewb: 'poly:skb' };
const LEARN = new Function('window', fs.readFileSync(C + 'learn-data.js', 'utf8') + ';return window.LEARN;')({});

const REMAP = { '#00f': '#0046ad', '#0d0': '#009b48', '#f00': '#b71234', '#fa0': '#ff5800', '#ff0': '#ffd500', '#f80': '#ff5800', '#0f0': '#009b48',
  '#0000ff': '#0046ad', '#00ff00': '#009b48', '#ff0000': '#b71234', '#ffff00': '#ffd500', '#ff8800': '#ff5800', '#006600': '#009b48', '#0000bb': '#0046ad',
  '#ff8833': '#ff5800', '#77ee00': '#8bd800', '#dd0000': '#b71234', '#ff99ff': '#c04fd6', '#88ddff': '#3fb0ee', '#999999': '#8a8a8e', '#ffcc00': '#ffd500', '#ffffbb': '#efe58a' };
function clean(svg) {
  const w = parseFloat((/width="([\d.]+)/.exec(svg) || [])[1]), h = parseFloat((/height="([\d.]+)/.exec(svg) || [])[1]);
  return svg.replace(/#[0-9a-fA-F]{3,6}\b/g, m => REMAP[m.toLowerCase()] || m).replace(/<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`);
}
const CODE = { '2×2': ['222so', 0], '4×4': ['444wca', 40], '5×5': ['555wca', 60], '6×6': ['666wca', 80], '7×7': ['777wca', 100], Clock: ['clkwca', 0], Mega: ['mgmp', 70], Pyra: ['pyrso', 10], Skewb: ['skbso', 0], 'Sq-1': ['sqrs', 0] };
const BIG = { '4×4': 4, '5×5': 5, '6×6': 6, '7×7': 7 };
const PAL = { U: '#ffffff', D: '#ffd500', F: '#009b48', B: '#0046ad', R: '#b71234', L: '#ff5800' };
const out = {};

function netN(state, N) {
  const H = N - 1, Z = N <= 4 ? 13 : 11, G = 1, at = { U: [N, 0], L: [0, N], F: [N, N], R: [2 * N, N], B: [3 * N, N], D: [N, 2 * N] };
  const NAME = { '0,1,0': 'U', '0,-1,0': 'D', '1,0,0': 'R', '-1,0,0': 'L', '0,0,1': 'F', '0,0,-1': 'B' };
  let o = '';
  for (const x of state) {
    const f = NAME[x.n.join()], [px, py, pz] = x.p; let r, c;
    if (f === 'U') { r = (pz + H) / 2; c = (px + H) / 2; } else if (f === 'D') { r = (H - pz) / 2; c = (px + H) / 2; }
    else if (f === 'F') { r = (H - py) / 2; c = (px + H) / 2; } else if (f === 'B') { r = (H - py) / 2; c = (H - px) / 2; }
    else if (f === 'R') { r = (H - py) / 2; c = (H - pz) / 2; } else { r = (H - py) / 2; c = (pz + H) / 2; }
    o += `<rect x="${(at[f][0] + c) * Z + G / 2}" y="${(at[f][1] + r) * Z + G / 2}" width="${Z - G}" height="${Z - G}" fill="${PAL[x.c]}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${4 * N * Z} ${3 * N * Z}">${o}</svg>`;
}
const sqInv = a => SQ.str(SQ.norm(SQ.invert(SQ.ops(a))));

/* ---- 3×3 progress pictures: what is solved after each step (white on the bottom) ---- */
const home = x => x.o, cnt = o => o.filter(v => v).length;
const topEdge = o => o[1] === 1 && cnt(o) === 2, topCorner = o => o[1] === 1 && cnt(o) === 3;
const DONE3 = [
  st => st.o[1] === -1 && cnt(st.o) <= 2,                                              // 1 white cross (bottom edges + centre)
  st => st.o[1] === -1,                                                               // 2 first layer
  st => st.o[1] <= 0,                                                                 // 3 middle layer
  st => st.o[1] <= 0 || (topEdge(st.o) && st.n[1] === 1),                             // 4 yellow cross: top edges show yellow on top
  st => st.o[1] <= 0 || topEdge(st.o),                                                // 5 edges matched
  st => st.o[1] <= 0 || topEdge(st.o) || (topCorner(st.o) && st.c !== 'U'),           // 6 corners placed
  () => true                                                                          // 7 done
];
function pair(st, gray) {
  const a = Draw.iso(st, { pal: Draw.LL, view: 0, gray }), b = Draw.iso(st, { pal: Draw.LL, view: 1, gray });
  return [a, b];
}

for (const g of LEARN) {
  const id = g.id, pic = { hero: [], steps: [], algs: {} };
  /* hero pictures */
  if (id === '3×3') pic.hero = pair(Sim.solved(), null).map((s, i) => s);
  else if (KIND[id]) {
    const [code, len] = CODE[id];
    pic.hero.push(V.full(KIND[id], '', 0));
    const sc = String(engine.getScramble(code, len)).trim();
    pic.hero.push(V.full(KIND[id], sc, 0));
  } else if (CODE[id]) {
    const [code, len] = CODE[id];
    pic.hero.push(clean(engine.getImage('', code)));
    pic.hero.push(clean(engine.getImage(String(engine.getScramble(code, len)).trim(), code)));
  } else if (['3BLD', 'FMC', 'OH'].includes(id)) pic.hero = pair(Sim.solved(), null);
  if (id === '3×3') { pic.heroCap = ['Solved: white on the bottom, yellow on top', 'The other side']; }
  else if (CODE[id]) pic.heroCap = ['Solved', 'Scrambled'];
  else pic.heroCap = ['Solved', 'The other side'];
  if (id === '3×3') pic.steps = DONE3.map(done => pair(Sim.solved(), st => !done(st)));

  /* the state each algorithm starts from (the algorithm's inverse applied to a solved puzzle) */
  g.steps.forEach((s, si) => s.algs.forEach((a, ai) => {
    const key = si + '.' + ai; let svg = null;
    try {
      if (id === '3×3' || id === '3BLD' || id === 'FMC' || id === 'OH') svg = Draw.iso(Sim.apply(Sim.solved(), Sim.invert(Sim.parse(a.m))), { pal: Draw.LL });
      else if (id === '2×2') svg = V.views('nxn:2', /U R U' L'|L F'|F L F/.test(a.m) ? 'll' : 'best', invertStr(a.m), '', {}).card;
      else if (BIG[id]) { svg = V.views('nxn:' + BIG[id], /^Rw2 R2 B2|Rw2 R2 U2/.test(a.m) ? 'll' : 'best', invertStr(a.m), '', {}).card; }
      else if (KIND[id] && KIND[id].startsWith('poly:')) {
        // Pyraminx and Skewb: the guide's corner letters line up with the Timer's by elimination (three letters are shared,
        // so the fourth must be the one left over): Pyraminx F is the Timer's B, Skewb F is the Timer's U.
        const map = id === 'Pyra' ? { F: 'B' } : id === 'Skewb' ? { F: 'U' } : {};
        const seq = polyInv(a.m, map);
        const v = V.views(KIND[id], 'best', seq, '', {});
        svg = (id === 'Mega' && si >= 4) ? v.card : v.a;
      }
      else if (id === 'Sq-1') svg = clean(engine.getImage(sqInv(a.m), 'sqrs'));
    } catch (e) { svg = null; console.log('  picture failed:', id, key, a.m.slice(0, 40), '|', String(e.message).slice(0, 70)); }
    if (svg) pic.algs[key] = svg;
  }));
  out[id] = pic;
}
// inverse of a polyhedron move string: same letter, prime toggled; U'2 is written U2' for the engine's parser
function polyInv(m, map) {
  return m.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim().split(' ').reverse().map(t => {
    t = t.replace(/^([A-Za-z]+)'(\d)$/, "$1$2'");
    const mm = /^([A-Za-z]+)(\d?)('?)$/.exec(t); if (!mm) throw new Error('bad token ' + t);
    const L = map[mm[1]] || mm[1];
    return L + mm[2] + (mm[3] ? '' : "'");
  }).join(' ');
}
function invertStr(m) { return m.replace(/[()]/g, ' ').trim().split(/\s+/).reverse().map(t => /2'?$/.test(t) ? t.replace(/'$/, '') : t.endsWith("'") ? t.slice(0, -1) : t + "'").join(' '); }
fs.writeFileSync(C + 'learn-pics.js', 'window.LPIC=' + JSON.stringify(out) + ';\n');
console.log('learn-pics.js', (fs.statSync(C + 'learn-pics.js').size / 1024 | 0) + ' KB');
for (const [id, p] of Object.entries(out)) console.log(id.padEnd(6), 'hero', p.hero.length, ' steps', p.steps.length, ' alg pictures', Object.keys(p.algs).length);
