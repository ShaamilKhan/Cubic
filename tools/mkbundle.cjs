// Builds app/engine-src.js (the csTimer scramble engine, once) and app/catalog.js (its scramble-type list).
// The method-review worker is the same engine plus the solver files, so only the extra part is stored separately.
const fs = require('fs');
const D = 'C:/Projects/Cubetimer/source/', O = 'C:/Projects/Cubetimer/app/';
const eng = fs.readFileSync(D + 'engine.js', 'utf8'), core = fs.readFileSync(D + 'review-core.js', 'utf8');
const wk = fs.readFileSync(D + 'review-worker.js', 'utf8').replace(/^importScripts\([^\n]*\n/m, '');
fs.writeFileSync(O + 'engine-src.js', 'window.ENGINE_SRC=' + JSON.stringify(eng) + ';\nwindow.REVIEW_EXTRA=' + JSON.stringify('\n;\n' + core + '\n;\n' + wk) + ';\n');
fs.writeFileSync(O + 'catalog.js', 'window.CATALOG=' + JSON.stringify(require(D + 'catalog.json')) + ';\n');
console.log('engine-src.js', (fs.statSync(O + 'engine-src.js').size / 1024 | 0) + ' KB');
