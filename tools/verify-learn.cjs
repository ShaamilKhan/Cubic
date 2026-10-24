// Check each beginner algorithm against what the guide will claim it does, using the independent sticker simulator.
const Sim = require('C:/Projects/Cubetimer/app/sim.js');
const AX = Sim.AX, NAME = { '0,1,0': 'U', '0,-1,0': 'D', '1,0,0': 'R', '-1,0,0': 'L', '0,0,1': 'F', '0,0,-1': 'B' };
const home = o => o.join();
function moved(alg) {
  const s = Sim.run(alg), set = new Map();
  for (const x of s) {
    const inPlace = home(x.p) === home(x.o) && x.n.join() === AX[x.c].join();
    if (!inPlace) set.set(home(x.o), x.o);
  }
  return [...set.values()];
}
const top = o => o[1] === 1, corner = o => o.filter(v => v).length === 3, edge = o => o.filter(v => v).length === 2;
const eq = (o, a) => home(o) === a.join();
let fail = 0;
function check(name, alg, test, why) {
  const m = moved(alg), bad = m.filter(o => !test(o));
  const ok = bad.length === 0; if (!ok) fail++;
  console.log((ok ? 'ok  ' : 'FAIL') + ' ' + name.padEnd(34) + alg.padEnd(30) + (ok ? 'moves ' + m.length + ' pieces: ' + why : 'unexpected: ' + bad.map(home).join(' | ')));
}
// cycle structure of the top-layer pieces of a given kind
function cycles(alg, kind) {
  const s = Sim.run(alg), to = new Map();
  for (const x of s) if (kind(x.o) && x.c === 'U' || (kind(x.o) && x.o[1] === 1 && x.n.join() === AX.U.join() && false)) {}
  const pos = new Map();
  for (const x of s) if (kind(x.o) && x.o[1] === 1) pos.set(home(x.o), x.p);   // last sticker of each piece wins; positions are the same for all of a piece's stickers
  const map = {};
  for (const [h, p] of pos) map[h] = p[0] + ',' + p[2];
  const seen = new Set(), out = [];
  for (const h of Object.keys(map)) {
    const k = h.split(',').map(Number); const start = k[0] + ',' + k[2];
    if (seen.has(start)) continue;
    let cur = start, len = 0; const guard = new Set();
    // follow where the piece that STARTS at `start` has gone: invert the map
    const inv = {}; for (const [hh, to2] of Object.entries(map)) { const q = hh.split(',').map(Number); inv[q[0] + ',' + q[2]] = to2; }
    cur = start; do { seen.add(cur); cur = inv[cur]; len++; } while (cur !== start && cur !== undefined && len < 9);
    if (len > 1) out.push(len);
  }
  return out.sort();
}
const topLayer = top;
check('2nd layer, right', "U R U' R' U' F' U F", o => top(o) || eq(o, [1, 0, 1]), 'top layer + the front-right edge');
check('2nd layer, left', "U' L' U L U F U' F'", o => top(o) || eq(o, [-1, 0, 1]), 'top layer + the front-left edge');
check('last-layer cross', "F R U R' U' F'", top, 'top layer only');
check('last-layer edges', "R U R' U R U2 R' U", top, 'top layer only');
check('last-layer corners', "U R U' L' U R' U' L", top, 'top layer only');
check('2x2 swap, adjacent', "L F' L' D' L' D F", o => top(o) || edge(o), 'top layer (+ edges, irrelevant on 2×2)');
check('2x2 swap, diagonal', "F L F L' D' L' D", o => top(o) || edge(o), 'top layer (+ edges, irrelevant on 2×2)');
check('2x2 3-cycle', "U R U' L' U R' U' L", top, 'top layer only');
const c = alg => cycles(alg, corner).join('+') || 'none';
console.log('\ncorner cycles (piece lengths):');
console.log('  U R U\' L\' U R\' U\' L   ->', c("U R U' L' U R' U' L"), ' (guide says: three corners cycle)');
console.log('  L F\' L\' D\' L\' D F    ->', c("L F' L' D' L' D F"), ' (guide says: two corners swap)');
console.log('  F L F L\' D\' L\' D     ->', c("F L F L' D' L' D"), ' (guide says: two diagonal corners swap)');
const e = alg => cycles(alg, edge).join('+') || 'none';
console.log('edge cycles:  R U R\' U R U2 R\' U ->', e("R U R' U R U2 R' U"), ' (guide says: three edges cycle)');
console.log('edges untouched by the corner 3-cycle:', e("U R U' L' U R' U' L") === 'none');
// pairs of top corners in the diagonal/adjacent swaps
const sw = alg => { const s = Sim.run(alg); const pos = {}; for (const x of s) if (corner(x.o) && x.o[1] === 1) pos[home(x.o)] = x.p; return Object.entries(pos).filter(([h, p]) => h !== p.join() && home(p) !== h).map(([h, p]) => h + '->' + p.join()); };
console.log('swap pieces (adjacent):', sw("L F' L' D' L' D F").join('  '));
console.log('swap pieces (diagonal):', sw("F L F L' D' L' D").join('  '));
console.log(fail ? '\n' + fail + ' CHECKS FAILED' : '\nall structural claims hold');
