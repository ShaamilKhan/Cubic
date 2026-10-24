// Read the true sticker colour of every face of Pyraminx / Skewb / Megaminx from csTimer's own solved picture.
const fs = require('fs');
const engine = require('C:/Projects/Cubetimer/source/engine.js');
require('C:/Projects/Cubetimer/app/poly3d.js');
const P = globalThis.poly3d;
const REMAP = { '#00f': '#0046ad', '#0d0': '#009b48', '#f00': '#b71234', '#fa0': '#ff5800', '#ff0': '#ffd500', '#f80': '#ff5800', '#0f0': '#009b48',
  '#0000ff': '#0046ad', '#00ff00': '#009b48', '#ff0000': '#b71234', '#ffff00': '#ffd500', '#ff8800': '#ff5800', '#fff': '#ffffff', '#ffffff': '#ffffff',
  '#006600': '#0a7a3a', '#0000bb': '#1d3fbf', '#ff8833': '#ff7a1f', '#77ee00': '#8bd800', '#dd0000': '#c8102e', '#ff99ff': '#e48ad8',
  '#88ddff': '#6fc6ee', '#999999': '#8d8d92', '#ffcc00': '#ffd23a', '#ffffbb': '#f1ecb0', '#8811ff': '#7a2cf2' };
const out = {};
for (const [name, code] of [['pyr', 'pyrso'], ['skb', 'skbso'], ['mgm', 'mgmp']]) {
  const b = P.getFamousPuzzle(name), puz = P.makePuzzle.apply(P, b.polyParam);
  const faceOf = []; puz.enumFacesPolys((f, i, poly, idx) => { faceOf[idx] = f; });
  const svg = engine.getImage('', code);
  const fills = [...svg.matchAll(/<polygon[^>]*style="fill:([^;"]+)/g)].map(m => m[1].toLowerCase());
  const col = [], bad = [];
  faceOf.forEach((f, idx) => { if (col[f] === undefined) col[f] = fills[idx]; else if (col[f] !== fills[idx]) bad.push(idx); });
  console.log(name.padEnd(4), 'pieces', faceOf.length, 'engine polygons', fills.length, 'faces', col.length, 'inconsistent', bad.length, '\n     ', col.join(' '));
  out[name] = col.map(c => REMAP[c] || c);
  const missing = col.filter(c => !REMAP[c]); if (missing.length) console.log('      unmapped:', missing.join(' '));
}
fs.writeFileSync('C:/Projects/Cubetimer/app/poly-pal.js', 'window.POLY_PAL=' + JSON.stringify(out) + ';\n');
console.log(JSON.stringify(out));
