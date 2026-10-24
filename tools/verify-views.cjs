const fs = require('fs');
const C = 'C:/Projects/Cubetimer/app/';
const engine = require('C:/Projects/Cubetimer/source/engine.js');
globalThis.Sim = require(C + 'sim.js'); globalThis.NxN = require(C + 'nxn.js'); globalThis.Draw = require(C + 'render.js'); require(C + 'poly3d.js');
globalThis.POLY_PAL = new Function('window', fs.readFileSync(C + 'poly-pal.js', 'utf8') + ';return window.POLY_PAL;')({});
const V = require(C + 'views.js');
const TRAIN = new Function('window', fs.readFileSync(C + 'train-data.js', 'utf8') + ';return window.TRAIN;')({});

/* 1. my replay of moves on the 3D pieces must give the same colours as csTimer's own picture */
const REMAPBACK = {};   // engine fills are raw csTimer colours; compare by face index instead
for (const [name, code, len] of [['pyr', 'pyrso', 10], ['skb', 'skbso', 0], ['mgm', 'mgmp', 70]]) {
  const P = V.puzzle(name); let ok = 0, bad = 0;
  const base = [...engine.getImage('', code).matchAll(/<polygon[^>]*style="fill:([^;"]+)/g)].map(m => m[1].toLowerCase());
  const colOf = {}; P.pieces.forEach((p, i) => { colOf[base[i]] = p.face; });         // raw colour -> face index
  for (let t = 0; t < 25; t++) {
    const sc = String(engine.getScramble(code, len)).trim();
    const fills = [...engine.getImage(sc, code).matchAll(/<polygon[^>]*style="fill:([^;"]+)/g)].map(m => m[1].toLowerCase());
    let pos; try { pos = V.posit(name, sc); } catch (e) { bad++; if (bad < 3) console.log(name, 'replay error', e.message, '|', sc.slice(0, 50)); continue; }
    const same = pos.every((f, i) => colOf[fills[i]] === f);
    same ? ok++ : bad++;
  }
  console.log(name.padEnd(4), 'scrambles where my 3D replay == csTimer picture:', ok + '/25');
}

/* 2. every case of every set renders (card, top, both 3D sides, and a mid-algorithm step) */
const VK = { cll: ['nxn:2', 'll'], ocll: ['nxn:2', 'll'], 'eg-1': ['nxn:2', 'best'], 'eg-2': ['nxn:2', 'best'], pbl: ['nxn:2', 'best'], 'parity-444': ['nxn:4', 'll'], 'parity-555': ['nxn:5', 'll'], 'l2c-555': ['nxn:5', 'best'], 'l2e-555': ['nxn:5', 'best'], l4e: ['poly:pyr', 'best'], sarah: ['poly:skb', 'best'], 'megaminx-co': ['poly:mgm', 'oll'], 'megaminx-cp': ['poly:mgm', 'll'], 'megaminx-eo': ['poly:mgm', 'll'], 'megaminx-ep': ['poly:mgm', 'll'] };
let total = 0, fail = 0; const llFallback = {};
for (const s of TRAIN) {
  const vk = VK[s.id]; if (!vk) continue; let n = 0, bad = 0;
  for (const c of s.cases) {
    n++; total++;
    try {
      const memo = {}, v0 = V.views(vk[0], vk[1], c.setup, '', memo), tk = c.algs[0].replace(/[()]/g, ' ').trim().split(/\s+/);
      const v1 = V.views(vk[0], vk[1], c.setup, tk.slice(0, Math.ceil(tk.length / 2)).join(' '), memo);
      // the far side is left out on purpose when nothing on it is out of order, so only the near side must exist
      if (!v0.card || !v0.a || !v1.a) throw new Error('empty');
      if (vk[1] !== 'best' && !v0.top) llFallback[s.id] = (llFallback[s.id] || 0) + 1;
    } catch (e) { bad++; fail++; if (bad <= 2) console.log('  FAIL', s.id, c.n, e.message.slice(0, 80)); }
  }
  console.log(s.id.padEnd(13), n + ' cases,', bad ? bad + ' failed' : 'all render', llFallback[s.id] ? ' (fell back to 3D for ' + llFallback[s.id] + ' cases the top view cannot show)' : '');
}
console.log('total', total, 'failed', fail);
