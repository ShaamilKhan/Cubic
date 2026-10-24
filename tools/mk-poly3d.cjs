// Wrap csTimer's poly3dlib (real 3D puzzle geometry) so it runs on its own, in Node and in the browser.
const fs = require('fs');
const src = fs.readFileSync('C:/Projects/Cubetimer/source/cstimer/poly3dlib.js', 'utf8');
const out = `/* csTimer poly3dlib (GPL-3.0), wrapped to run standalone. Gives real 3D pieces for Pyraminx, Skewb and Megaminx. */
(function (root) {
var DEBUG = false, debugger_ = 0;
var $ = { UDPOLY_RE: '(?!)', col2std: function () { return []; } };
var kernel = { getProp: function () { return ''; } };
var tools = { carrot2poch: function (s) { return s; } };
${src.replace(/\bdebugger\s*;?/g, '')}
root.poly3d = poly3d;
})(typeof window !== 'undefined' ? window : globalThis);
`;
fs.writeFileSync('C:/Projects/Cubetimer/app/poly3d.js', out);
console.log('poly3d.js', (out.length / 1024 | 0) + ' KB');
require('C:/Projects/Cubetimer/app/poly3d.js');
const p = globalThis.poly3d;
console.log('exports:', Object.keys(p).join(', '));
for (const name of ['pyr', 'skb', 'mgm']) {
  const t = Date.now(), b = p.getFamousPuzzle(name), puz = p.makePuzzle.apply(p, b.polyParam);
  let n = 0, arcs = 0; puz.enumFacesPolys((f, i, poly) => { n++; if (poly.paths.some(x => x.ct)) arcs++; });
  console.log(name, 'pieces', n, 'curved', arcs, 'faces', puz.facePlanes.length, 'moves', puz.twistyDetails.length, (Date.now() - t) + 'ms', 'parser', !!b.parser);
}
