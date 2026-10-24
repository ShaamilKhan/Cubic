// Square-1: does an algorithm really solve the state drawn from its inverse? Joins sequences correctly (adjacent turns merge, no extra slice).
const fs = require('fs');
const D = 'C:/Projects/Cubetimer/source/';
const engine = require(D + 'engine.js');
const polys = svg => [...svg.matchAll(/<(?:polygon|path)\b[^>]*>/g)].map(m => { const f = /fill:\s*([^;"']+)/.exec(m[0]); return f ? f[1].trim() : ''; });
const solvedKey = polys(engine.getImage('', 'sqrs')).join();
// ops: ['t',a,b] or ['s']
function ops(str) {
  const out = []; const re = /\(\s*(-?\d+)\s*,\s*(-?\d+)\s*\)|\//g; let m;
  while ((m = re.exec(str))) out.push(m[0] === '/' ? ['s'] : ['t', +m[1], +m[2]]);
  return out;
}
function norm(list) {
  const out = [];
  for (const o of list) {
    const l = out[out.length - 1];
    if (o[0] === 't' && l && l[0] === 't') { l[1] += o[1]; l[2] += o[2]; if (!l[1] && !l[2]) out.pop(); }
    else if (o[0] === 's' && l && l[0] === 's') out.pop();
    else if (o[0] === 't' && !o[1] && !o[2]) continue;
    else out.push(o.slice());
  }
  return out;
}
const wrap = v => { v = ((v % 12) + 12) % 12; return v > 6 ? v - 12 : v; };
const str = list => list.map(o => o[0] === 's' ? '/' : `(${wrap(o[1])},${wrap(o[2])})`).join(' ');
const invert = list => list.slice().reverse().map(o => o[0] === 's' ? o : ['t', -o[1], -o[2]]);
const img = list => polys(engine.getImage(str(list), 'sqrs')).join();
function solves(alg) { // alg applied after its own inverse must give the solved picture
  const a = ops(alg), joined = norm([...invert(a), ...a]);
  return img(joined) === solvedKey;
}
module.exports = { ops, norm, str, invert, img, solves, solvedKey, polys };
if (require.main === module) {
  const sets = JSON.parse(fs.readFileSync(D + 'algorithms.json', 'utf8'));
  console.log('beginner (Ruwix) algorithms: inverse + alg returns to the solved picture?');
  for (const a of ["(0, -1) / (6, 0) / (6, 0) / (0, 1)", "(0, -4) / (0, 3) / (0, 1)", "(1, 0) / (0, -3) / (0, 3) / (0, -3) / (0, -3) / (0, 6) / (-1, 0)", "(1, 0) / (0, -3) / (0, -3) / (-1, -1) / (1, 4) / (0, 3) / (-1, 0)", "/ (3, -3) / (0, 3) / (-3, 0) / (3, 0) / (-3, 0) /", "(0, 2) / (0, -3) / (1, 1) / (-1, 2) / (0, -2)", "/ (3,3) / (1,0) / (-2,-2) / (2,0) / (2,2) / (-1,0) / (-3,-3) / (-2,0) / (3,3) / (3,0) / (-1,-1) / (-3,0) / (1,1) / (-4,-3)"]) console.log('  ', String(solves(a)).padEnd(6), a.slice(0, 70));
  console.log('\ndataset sets: setup picture == picture of inverse(alg), for at least one algorithm');
  for (const id of ['sq1cs', 'sq1co', 'sq1cp', 'sq1eo', 'sq1ep', 'sq1parity']) {
    const set = sets.find(s => s.id === id); let ok = 0, trivial = 0;
    for (const c of set.cases) {
      let hit = false;
      for (const a of c.algs.slice(0, 3)) { try { if (img(norm(invert(ops(a.moves)))) === img(norm(ops(c.setup)))) hit = true; } catch (e) {} }
      if (hit) ok++;
    }
    console.log('  ', id.padEnd(10), ok + '/' + set.cases.length);
  }
}
