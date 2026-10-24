// Builds app/train-data.js: every extra algorithm set, keeping ONLY cases whose algorithm is shown to solve them.
const fs = require('fs');
const D = 'C:/Projects/Cubetimer/source/';
const engine = require(D + 'engine.js');
const Sim = require('C:/Projects/Cubetimer/app/sim.js');
const sets = JSON.parse(fs.readFileSync(D + 'algorithms.json', 'utf8'));
const byId = id => sets.find(s => s.id === id);
const AX = Sim.AX;
const REMAP = { '#00f': '#0046ad', '#0d0': '#009b48', '#f00': '#b71234', '#fa0': '#ff5800', '#ff0': '#ffd500', '#f80': '#ff5800', '#0f0': '#009b48',
  '#0000ff': '#0046ad', '#00ff00': '#009b48', '#ff0000': '#b71234', '#ffff00': '#ffd500', '#ff8800': '#ff5800', '#006600': '#009b48', '#0000bb': '#0046ad',
  '#ff8833': '#ff5800', '#77ee00': '#8bd800', '#dd0000': '#b71234', '#ff99ff': '#c04fd6', '#88ddff': '#3fb0ee', '#999999': '#8a8a8e', '#ffcc00': '#ffd500', '#ffffbb': '#efe58a' };
function clean(svg) {
  const w = parseFloat((/width="([\d.]+)/.exec(svg) || [])[1]), h = parseFloat((/height="([\d.]+)/.exec(svg) || [])[1]);
  return svg.replace(/#[0-9a-fA-F]{3,6}\b/g, m => REMAP[m.toLowerCase()] || m).replace(/<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`);
}
const AUF = ['', 'U', 'U2', "U'"];
const top = s => { const g = Sim.grid(s, 'U').flat(); return g.every(v => v === g[0]); };
function cornersOK(s) {
  for (const f of 'UDFBLR') { const k = AX[f], cs = s.filter(x => x.n[0] === k[0] && x.n[1] === k[1] && x.n[2] === k[2] && x.p.filter(v => v).length === 3); if (!cs.every(x => x.c === cs[0].c)) return false; }
  return true;
}
const out = [], report = [];

/* ---- 3x3 and 2x2: verified with the sticker simulator; drawn by the app from the setup ---- */
function simSet(id, meta, test, { auf = true, keep = c => true, two = false } = {}) {
  const set = byId(id), cases = []; let tot = 0;
  for (const c of set.cases) {
    tot++;
    let good = [];
    try {
      const base = Sim.run(Sim.deRotate(c.setup));
      for (const a of c.algs) {
        let ok = false;
        for (const pre of auf ? AUF : ['']) for (const post of auf ? AUF : ['']) {
          const r = Sim.run(Sim.deRotate(pre + ' ' + a.moves + ' ' + post), base.map(x => ({ ...x })));
          if (test(r)) ok = true;
        }
        if (ok) good.push(a.moves);
      }
    } catch (e) { continue; }
    if (good.length && keep(c)) {
      const setup = Sim.deRotate(c.setup), item = { n: c.name, g: c.group || meta.name, setup, algs: good.slice(0, 3) };
      if (two) { try { item.svg = clean(engine.getImage(setup.replace(/2'/g, '2'), '222so')); } catch (e) { continue; } if (!item.svg) continue; }
      cases.push(item);
    }
  }
  out.push({ id, ...meta, kind: two ? 'eng' : 'sim', mode: two ? 'eng' : meta.mode, cases }); report.push(`${id.padEnd(13)} ${cases.length}/${tot} kept`);
}
const lower = s => Sim.lowerSolved(s);
simSet('f2l', { puzzle: '3×3', group: 'CFOP', name: 'F2L', blurb: 'Pair a corner with its edge and slot both in. Every case, seen from the front-right slot.', mode: 'iso' }, lower, { auf: false });
simSet('advanced-f2l', { puzzle: '3×3', group: 'CFOP', name: 'Advanced F2L', blurb: 'Awkward F2L cases where a piece is trapped. Needs a setup or a special algorithm.', mode: 'iso' }, lower, { auf: false });
simSet('oll', { puzzle: '3×3', group: 'CFOP', name: 'OLL', blurb: 'Turn the whole top face one colour. Yellow squares are already facing up.', mode: 'oll' }, s => top(s) && lower(s));
simSet('pll', { puzzle: '3×3', group: 'CFOP', name: 'PLL', blurb: 'Last step. Arrows show where each piece has to travel.', mode: 'pll' }, s => Sim.isSolved(s));
simSet('coll', { puzzle: '3×3', group: 'Last layer', name: 'COLL', blurb: 'Solve the top corners while the edges are already oriented.', mode: 'coll' }, s => top(s) && lower(s));
for (const t of ['t', 'u', 'l', 's', 'as', 'pi', 'h']) {
  const nm = { t: 'T', u: 'U', l: 'L', s: 'Sune', as: 'Anti-Sune', pi: 'Pi', h: 'H' }[t];
  simSet('zbll-' + t, { puzzle: '3×3', group: 'Last layer', name: 'ZBLL ' + nm, blurb: 'Finish the last layer in one algorithm when the edges are already oriented.', mode: 'coll', parent: 'zbll' }, s => Sim.isSolved(s));
}
simSet('zbls', { puzzle: '3×3', group: 'Last slot', name: 'ZBLS', blurb: 'Insert the last F2L pair and orient every last-layer edge in one go.', mode: 'iso' }, s => lower(s));
simSet('vls', { puzzle: '3×3', group: 'Last slot', name: 'VLS', blurb: 'Insert the last F2L pair while orienting the last-layer corners.', mode: 'iso' }, s => lower(s));
simSet('cls', { puzzle: '3×3', group: 'Last slot', name: 'CLS', blurb: 'Insert the last F2L pair while solving the last-layer corners.', mode: 'iso' }, s => lower(s));
simSet('sv', { puzzle: '3×3', group: 'Last slot', name: 'SV', blurb: 'Last slot plus last-layer orientation, the Sune-based variation.', mode: 'iso' }, s => lower(s));
simSet('vw', { puzzle: '3×3', group: 'Last slot', name: 'WV', blurb: 'Last slot with the last-layer corners oriented.', mode: 'iso' }, s => lower(s));
simSet('cll', { puzzle: '2×2', group: 'Face method', name: 'CLL', blurb: 'Solve the last layer of a 2×2 in one algorithm.', mode: 'coll' }, cornersOK, { two: true });
simSet('ocll', { puzzle: '2×2', group: 'Face method', name: 'OCLL', blurb: 'Orient the last-layer corners of a 2×2 first. Seven cases.', mode: 'coll' }, s => top(s) || cornersOK(s), { two: true });
simSet('eg-1', { puzzle: '2×2', group: 'Advanced', name: 'EG-1', blurb: 'Solve the first layer and the last layer at the same time, with one layer already built.', mode: 'coll' }, cornersOK, { two: true });
simSet('eg-2', { puzzle: '2×2', group: 'Advanced', name: 'EG-2', blurb: 'Solve the last layer with a block already built, when the first layer is not yet solved.', mode: 'coll' }, cornersOK, { two: true });
simSet('pbl', { puzzle: '2×2', group: 'Advanced', name: 'PBL', blurb: 'Permute both layers at once. The finish of a layer-first 2×2 solve.', mode: 'iso' }, cornersOK, { two: true });

/* ---- other puzzles: verified by the csTimer engine (setup + algorithm returns the solved picture); drawn from the engine ---- */
const CODE = { pyram: 'pyrso', skewb: 'skbso', mega: 'mgmp' };
const ADD = { pyram: ['', 'U', "U'"], mega: ['', 'U', "U'", 'U2', "U2'"], skewb: [''] };
const clean2 = a => a.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim();
function engSet(id, meta) {
  const set = byId(id), code = CODE[set.cases[0].puzzle], add = ADD[set.cases[0].puzzle], solved = engine.getImage('', code), cases = []; let tot = 0;
  for (const c of set.cases) {
    tot++; const good = [];
    for (const a of c.algs.slice(0, 4)) {
      let ok = false;
      outer: for (const pre of add) for (const post of add) { try { if (engine.getImage(clean2(c.setup + ' ' + pre + ' ' + a.moves + ' ' + post), code) === solved) { ok = true; break outer; } } catch (e) {} }
      if (ok) good.push(a.moves);
    }
    if (!good.length) continue;
    let svg; try { svg = engine.getImage(clean2(c.setup), code); } catch (e) { continue; }
    if (!svg) continue;
    cases.push({ n: c.name, g: c.group || meta.name, setup: clean2(c.setup), algs: good.slice(0, 3), svg: clean(svg) });
  }
  out.push({ id, ...meta, kind: 'eng', cases }); report.push(`${id.padEnd(13)} ${cases.length}/${tot} kept`);
}
engSet('l4e', { puzzle: 'Pyraminx', group: 'Last layer', name: 'L4E', blurb: 'Solve the last four edges once the top, tips and centres are done.', mode: 'eng' });
engSet('sarah', { puzzle: 'Skewb', group: "Sarah's", name: "Sarah's Intermediate", blurb: 'Solve the last layer of a Skewb with one algorithm. Grouped by corner shape.', mode: 'eng' });
engSet('megaminx-co', { puzzle: 'Megaminx', group: 'Last layer', name: 'Corner orientation', blurb: 'Twist the last-layer corners the right way round.', mode: 'eng' });
engSet('megaminx-cp', { puzzle: 'Megaminx', group: 'Last layer', name: 'Corner permutation', blurb: 'Move the last-layer corners into place.', mode: 'eng' });
engSet('megaminx-eo', { puzzle: 'Megaminx', group: 'Last layer', name: 'Edge orientation', blurb: 'Flip the last-layer edges to make the star.', mode: 'eng' });
engSet('megaminx-ep', { puzzle: 'Megaminx', group: 'Last layer', name: 'Edge permutation', blurb: 'Move the last-layer edges into place.', mode: 'eng' });

// Square-1: an algorithm solves a case when the case's picture equals the picture of the algorithm's inverse (sequences joined properly)
const SQ = require('./sq1merge.cjs');
function sq1Set(id, meta) {
  const set = byId(id), cases = []; let tot = 0;
  for (const c of set.cases) {
    tot++; const good = [];
    let want; try { want = SQ.img(SQ.norm(SQ.ops(c.setup))); } catch (e) { continue; }
    for (const a of c.algs.slice(0, 4)) { try { if (SQ.img(SQ.norm(SQ.invert(SQ.ops(a.moves)))) === want) good.push(a.moves); } catch (e) {} }
    if (!good.length) continue;
    let svg; try { svg = engine.getImage(c.setup.replace(/\s+/g, ' ').trim(), 'sqrs'); } catch (e) { continue; }
    if (svg) cases.push({ n: c.name, g: c.group || meta.name, setup: c.setup.replace(/\s+/g, ' ').trim(), algs: good.slice(0, 3), svg: clean(svg) });
  }
  out.push({ id, ...meta, kind: 'eng', cases }); report.push(id.padEnd(13) + ' ' + cases.length + '/' + tot + ' kept');
}

// Big cubes: checked on the NxN model (setup + algorithm, with an optional U turn, leaves every sticker on its own colour)
const { make } = require('C:/Projects/Cubetimer/app/nxn.js');
const PAL = { U: '#ffffff', D: '#ffd500', F: '#009b48', B: '#0046ad', R: '#b71234', L: '#ff5800' };
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
const colourOK = st => { const NAME = { '0,1,0': 'U', '0,-1,0': 'D', '1,0,0': 'R', '-1,0,0': 'L', '0,0,1': 'F', '0,0,-1': 'B' }; return st.every(x => x.c === NAME[x.n.join()]); };
function bigSet(id, N, meta) {
  const sim = make(N), set = byId(id), cases = []; let tot = 0;
  for (const c of set.cases) {
    tot++; let setupState; try { setupState = sim.run(c.setup); } catch (e) { continue; }
    const good = [];
    for (const a of c.algs.slice(0, 4)) {
      let ok = false;
      for (const post of ['', 'U', 'U2', "U'"]) { try { if (colourOK(sim.run(c.setup + ' ' + a.moves + ' ' + post))) { ok = true; break; } } catch (e) {} }
      if (ok) good.push(a.moves);
    }
    if (good.length) cases.push({ n: c.name, g: c.group || meta.name, setup: c.setup, algs: good.slice(0, 3), svg: netN(setupState, N) });
  }
  out.push({ id, ...meta, kind: 'eng', cases }); report.push(id.padEnd(13) + ' ' + cases.length + '/' + tot + ' kept');
}
bigSet('parity-444', 4, { puzzle: '4×4', group: 'Parity', name: 'Parity', blurb: 'The cases a 4×4 can reach that a 3×3 cannot. OLL parity flips an edge, PLL parity swaps two.', mode: 'eng' });
bigSet('parity-555', 5, { puzzle: '5×5', group: 'Parity', name: 'Edge parity', blurb: 'One flipped edge at the end of a 5×5.', mode: 'eng' });
bigSet('l2c-555', 5, { puzzle: '5×5', group: 'Centres and edges', name: 'Last two centres', blurb: 'Finish the last two centres of a 5×5 in one algorithm.', mode: 'eng' });
bigSet('l2e-555', 5, { puzzle: '5×5', group: 'Centres and edges', name: 'Last two edges', blurb: 'Join the last two edges of a 5×5 in one algorithm.', mode: 'eng' });
sq1Set('sq1cs', { puzzle: 'Square-1', group: 'Cubeshape', name: 'Cubeshape', blurb: 'Turn any Square-1 shape into a cube. Pick the shape you see.', mode: 'eng' });
sq1Set('sq1co', { puzzle: 'Square-1', group: 'Corners', name: 'Corner orientation', blurb: 'Get white and yellow corners onto the right layers.', mode: 'eng' });
sq1Set('sq1cp', { puzzle: 'Square-1', group: 'Corners', name: 'Corner permutation', blurb: 'Put the corners in the right order.', mode: 'eng' });
sq1Set('sq1eo', { puzzle: 'Square-1', group: 'Edges', name: 'Edge orientation', blurb: 'Get white and yellow edges onto the right layers.', mode: 'eng' });
sq1Set('sq1ep', { puzzle: 'Square-1', group: 'Edges', name: 'Edge permutation', blurb: 'Put the edges in the right order.', mode: 'eng' });
sq1Set('sq1parity', { puzzle: 'Square-1', group: 'Parity', name: 'Parity', blurb: 'Fix the parity that appears when only two edges or corners are swapped.', mode: 'eng' });
console.log(report.join('\n'));
const kept = out.reduce((n, s) => n + s.cases.length, 0);
console.log('sets', out.length, 'cases', kept);
fs.writeFileSync('C:/Projects/Cubetimer/app/train-data.js', 'window.TRAIN=' + JSON.stringify(out) + ';\n');
console.log('train-data.js', (fs.statSync('C:/Projects/Cubetimer/app/train-data.js').size / 1024 | 0) + ' KB');
