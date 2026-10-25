// Turning animation: the last frame of every kind of move must show exactly the stickers the model says the cube has afterwards,
// from both camera corners, with and without a whole-cube rotation applied, on 2x2 to 5x5. Middle frames must really move.
const assert = require('assert');
global.window = global;
const Sim = require('../app/sim.js'), NxN = require('../app/nxn.js'), Anim = require('../app/anim.js');
const PAL = { U: '#fff', D: '#ff0', F: '#0a0', B: '#00f', R: '#f00', L: '#f80' };
let n = 0; const ok = (c, m) => { assert(c, m); n++; };

const polys = svg => [...svg.matchAll(/<polygon points="([^"]+)" fill="([^"]+)"/g)]
  .filter(m => m[2] !== Anim.BODY).map(m => ({ fill: m[2], pts: m[1].split(' ').map(p => p.split(',').map(Number)) }));
function sameStickers(a, b) {
  if (a.length !== b.length) return 'count ' + a.length + ' vs ' + b.length;
  const used = new Array(b.length).fill(false);
  for (const p of a) {
    let found = false;
    for (let j = 0; j < b.length && !found; j++) {
      if (used[j] || b[j].fill !== p.fill) continue;
      // the same four corners, whichever one the list starts from
      if (b[j].pts.every(q => p.pts.some(r => Math.abs(q[0] - r[0]) < 0.012 && Math.abs(q[1] - r[1]) < 0.012))) { used[j] = true; found = true; }
    }
    if (!found) return 'sticker ' + p.fill + ' ' + JSON.stringify(p.pts) + ' has no partner';
  }
  return '';
}
const rnd = (a) => a[Math.random() * a.length | 0];
const CORNERS = [[1, 1, 1], [-1, -1, -1], [1, -1, 1], [-1, 1, -1]];
const POSTS = ['', 'x', 'y2', "z'", "x y"];

function check(label, N, s0, s1, turn, post, corner) {
  const last = Anim.cube(s0, { N, pal: PAL, corner, post, turn: { ...turn, th: Anim.angle(turn.q) } }).svg;
  const want = Anim.cube(s1, { N, pal: PAL, corner, post }).svg;
  const bad = sameStickers(polys(last), polys(want));
  ok(!bad, label + ' ' + corner.join() + ' post=' + JSON.stringify(post) + ': ' + bad);
}

// ---- 3x3 (sim.js): faces, primes, doubles, wide, slices, whole-cube turns
const MOVES3 = ['R', "R'", 'R2', 'L', "L'", 'U', "U'", 'U2', 'D', 'F', "F'", 'B', 'B2', 'M', "M'", 'E', 'S2', 'r', "r'", 'Rw', 'Uw2', "Fw", 'l', 'd', 'x', "y'", 'z2', 'x2'];
const SCR3 = "R U R' U' F2 L D' B2 U2 R' F D2 L' U B R2 D F' U'";
for (const mv of MOVES3) {
  const s0 = Sim.run(SCR3), raw = Sim.parse(mv), s1 = Sim.apply(s0.map(x => ({ ...x })), raw);
  const turns = Anim.fromSim(Sim, raw); ok(turns.length === 1, mv + ' is one turn');
  for (const corner of CORNERS) for (const post of POSTS) check('3x3 ' + mv, 3, s0, s1, turns[0], Anim.rotList(post), corner);
  // undoing a move from its end state gives back the start (this is how Back plays)
  const back = Anim.undo(turns[0]); check('3x3 back ' + mv, 3, s1, s0, back, [], [1, 1, 1]);
}

// ---- 2x2, 4x4, 5x5 (nxn.js): layers by number, wide, whole-cube turns
const SCR = { 2: "R U R' U' F2 R' U2 F R2 U", 4: "R U R' U' Rw2 F2 3Rw L' D2 Uw' B", 5: "R U2 R' Rw Uw' F2 3Rw 2L D' Bw2 U" };
const MOVES = { 2: ['R', "U'", 'F2', 'D', 'L', 'x', "y'", 'z2'], 4: ['R', "Rw", 'Rw2', "3Rw'", '2L', 'Uw', "2U", 'F', "Fw'", 'x', 'y2'], 5: ['R', 'Rw', "3Rw", "2R'", '3Uw2', 'Lw', 'D', 'x', "z'"] };
for (const N of [2, 4, 5]) {
  const sim = NxN.make(N), s0 = sim.view(sim.run(SCR[N]));
  for (const mv of MOVES[N]) {
    const s1 = sim.view(sim.run(mv, sim.run(SCR[N]))), turns = Anim.fromNxN(sim, mv); ok(turns.length === 1, N + ' ' + mv + ' is one turn');
    for (const corner of CORNERS) for (const post of ['', "x y'", 'z2']) check(N + 'x' + N + ' ' + mv, N, s0, s1, turns[0], Anim.rotList(post), corner);
  }
}

// ---- the resting picture is the same cube the existing renderer draws, including after a whole-cube turn
{
  const Draw = require('../app/render.js'), pal = Draw.LL;
  const same = (label, a, b) => { const bad = sameStickers(polys(a), polys(b)); ok(!bad, label + ': ' + bad); };
  for (const rot of ['', 'x', "y'", 'z2', "x y", "z' y2"]) {
    const st = Sim.run(SCR3), turned = rot ? Sim.run(rot, st.map(x => ({ ...x }))) : st;
    for (const corner of CORNERS) same('3x3 rest, turn "' + rot + '", corner ' + corner.join(), Anim.cube(st, { N: 3, pal, corner, post: Anim.rotList(rot) }).svg, Draw.iso(turned, { pal, corner }));
  }
  for (const N of [2, 4, 5]) {
    const sim = NxN.make(N), st = sim.run(SCR[N]);
    for (const rot of ['', 'x', "y'", 'z2', "x y'"]) {
      const turned = rot ? sim.run(rot, st) : st;
      for (const corner of CORNERS) same(N + 'x' + N + ' rest, turn "' + rot + '", corner ' + corner.join(), Anim.cube(sim.view(st), { N, pal, corner, post: Anim.rotList(rot) }).svg, Draw.iso(sim.view(turned), { pal, corner }));
    }
  }
}

// ---- middle frames: valid, and different from both ends
{
  const s0 = Sim.run(SCR3), turn = Anim.fromSim(Sim, Sim.parse('R'))[0];
  const frame = u => Anim.cube(s0, { N: 3, pal: PAL, corner: [1, 1, 1], turn: { ...turn, th: Anim.angle(turn.q) * u } }).svg;
  for (const u of [0.1, 0.25, 0.5, 0.75, 0.9]) {
    const f = frame(u); ok(!/NaN|undefined|Infinity/.test(f), 'frame ' + u + ' has no bad numbers');
    // 27 at rest; a layer's stickers can be exactly edge-on (zero area) at 45 degrees, so a few may drop out of view for an instant
    ok(polys(f).length >= 21 && polys(f).length <= 33, 'frame ' + u + ' shows a sensible number of stickers: ' + polys(f).length);
  }
  ok(sameStickers(polys(frame(0)), polys(Anim.cube(s0, { N: 3, pal: PAL, corner: [1, 1, 1] }).svg)) === '', 'frame 0 is the starting picture');
  ok(sameStickers(polys(frame(0.5)), polys(frame(0))) !== '', 'frame 0.5 differs from the start');
  ok(sameStickers(polys(frame(0.5)), polys(frame(1))) !== '', 'frame 0.5 differs from the end');
  // the frame never changes size mid-turn
  const vb = svg => svg.match(/viewBox="([^"]+)"/)[1];
  const fixed = Anim.box(3, [1, 1, 1]);
  ok(vb(Anim.cube(s0, { N: 3, pal: PAL, corner: [1, 1, 1], box: fixed, turn: { ...turn, th: 0.7 } }).svg) === fixed, 'viewBox stays put');
}

// ---- timing and direction
ok(Anim.angle(1) > 0 && Anim.angle(3) < 0 && Math.abs(Anim.angle(2)) === Math.PI, 'quarter turns take the short way round');
ok(Anim.msFor(1) >= 350 && Anim.msFor(1) <= 500 && Anim.msFor(2) > Anim.msFor(1) && Anim.msFor(2) < 2 * Anim.msFor(1), 'a quarter turn is not rushed or slow; a half turn is a little longer');
ok(Math.abs(Anim.ease(0)) < 1e-12 && Math.abs(Anim.ease(1) - 1) < 1e-12 && Math.abs(Anim.ease(0.5) - 0.5) < 1e-12 && Anim.ease(0.1) < 0.1 && Anim.ease(0.9) > 0.9, 'easing starts and ends gently');

// ---- the stage walks forward and back, and ends on the model's state
(async () => {
  const toks = ['R', 'U', "R'", 'U2', 'F'], stateAt = k => Sim.run(SCR3 + ' ' + toks.slice(0, k).join(' '));
  const host = [{ innerHTML: '' }, { innerHTML: '' }];
  const st = Anim.stage({ N: 3, pal: PAL, corners: [[1, 1, 1], [-1, -1, -1]], stateAt, tokenAt: i => toks[i], turns: t => Anim.fromSim(Sim, Sim.parse(t)) });
  st.bind(host);
  await st.walk(0, 3);
  ok(sameStickers(polys(host[0].innerHTML), polys(Anim.cube(stateAt(3), { N: 3, pal: PAL, corner: [1, 1, 1] }).svg)) === '', 'walk 0->3 ends on state 3 (front)');
  ok(sameStickers(polys(host[1].innerHTML), polys(Anim.cube(stateAt(3), { N: 3, pal: PAL, corner: [-1, -1, -1] }).svg)) === '', 'walk 0->3 ends on state 3 (back)');
  await st.walk(3, 1);
  ok(sameStickers(polys(host[0].innerHTML), polys(Anim.cube(stateAt(1), { N: 3, pal: PAL, corner: [1, 1, 1] }).svg)) === '', 'walk back 3->1 ends on state 1');
  st.show(5); ok(sameStickers(polys(host[0].innerHTML), polys(Anim.cube(stateAt(5), { N: 3, pal: PAL, corner: [1, 1, 1] }).svg)) === '', 'show(5)');
  console.log(n + ' animation checks passed');
})().catch(e => { console.log('FAILED', e.message); process.exit(1); });

// ---- Pyraminx, Skewb, Megaminx: the last frame of every move equals the still picture after the move
{
  require('../app/poly3d.js'); require('../app/poly-pal.js');
  const Views = require('../app/views.js');
  global.Anim = Anim;
  const MV = {
    pyr: ['U', "U'", 'R', "R'", 'L', "L'", 'B', "B'", 'u', "u'", 'r', 'l', 'b'],
    skb: ['R', "R'", 'U', "U'", 'L', "L'", 'B', "B'"],
    mgm: ['R++', 'R--', 'D++', 'D--', 'U', "U'", 'U2', "U2'"]
  };
  const SC = { pyr: "U' R L B' u l' r", skb: "R U' L B R' U", mgm: "R++ D-- R-- D++ U R++ D-- U'" };
  const seg = svg => [...svg.matchAll(/<polygon points="([^"]+)" fill="([^"]+)"/g)].map(m => ({ fill: m[2], pts: m[1].split(' ').map(p => p.split(',').map(Number)) }));
  for (const name of Object.keys(MV)) {
    const rig = Views.polyRig(name, SC[name]);
    ok(rig.count >= 1, name + ' has a picture');
    for (const mv of MV[name]) {
      const turns = Views.polyTurns(name, mv); ok(turns.length === 1, name + ' ' + mv + ' parses to one turn: ' + turns.length);
      const t = turns[0], p0 = rig.at(''), p1 = rig.at(mv);
      for (let i = 0; i < rig.count; i++) {
        const end = rig.render(p0, { axis: t.axis, set: t.set, th: t.theta }, i), want = rig.render(p1, undefined, i);
        const bad = sameStickers(seg(end), seg(want)); ok(!bad, name + ' ' + mv + ' picture ' + i + ': ' + bad);
        // and going backwards from the end lands on the start
        const b = t.inv(); const back = rig.render(p1, { axis: b.axis, set: b.set, th: b.theta }, i), start = rig.render(p0, undefined, i);
        const bad2 = sameStickers(seg(back), seg(start)); ok(!bad2, name + ' back ' + mv + ' picture ' + i + ': ' + bad2);
      }
      const mid = rig.render(p0, { axis: t.axis, set: t.set, th: t.theta * 0.5 }, 0); ok(!/NaN|undefined/.test(mid), name + ' ' + mv + ' middle frame is clean');
    }
  }
  console.log(n + ' animation checks passed (with polyhedra)');
}
