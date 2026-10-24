// Bundle the TNoodle WebAssembly port (from the NexusTimer reference) into one self-contained worker script,
// then validate every puzzle with the port's own token and length rules.
const fs = require('fs');
const P = 'C:/Projects/Cubetimer/source/tnoodle/';
let glue = fs.readFileSync(P + 'tnoodle_lib_rs.js', 'utf8');
const b64 = /'([A-Za-z0-9+/=]+)'/.exec(fs.readFileSync(P + 'tnoodle_lib_rs_wasm.js', 'utf8'))[1];
glue = glue.replace(/^\/\* @ts-self-types.*\n/, '').replace('export function scramble', 'function scramble');
const a = glue.indexOf('async function __wbg_init'), b = glue.indexOf('export {');
glue = glue.slice(0, a) + glue.slice(b).replace(/export \{[^}]*\};?/, '');   // drop the fetch-based init (it uses import.meta)
const body = glue + '\ninitSync({module:Uint8Array.from(atob(' + JSON.stringify(b64) + '),c=>c.charCodeAt(0))});\n';
const worker = body + 'self.onmessage=e=>{const [id,key]=e.data;try{self.postMessage([id,null,scramble(key)])}catch(err){self.postMessage([id,String(err&&err.message||err),null])}};\n';
fs.writeFileSync('C:/Projects/Cubetimer/app/tnoodle-src.js', 'window.TNOODLE_SRC=' + JSON.stringify(worker) + ';\n');
console.log('tnoodle-src.js', (fs.statSync('C:/Projects/Cubetimer/app/tnoodle-src.js').size / 1024 | 0) + ' KB');

const scramble = new Function('atob', 'TextDecoder', 'TextEncoder', 'WebAssembly', 'crypto', body + '\nreturn scramble;')(atob, TextDecoder, TextEncoder, WebAssembly, globalThis.crypto);
const F = "[RUFLDB]['2]?", W = "[RUFLDB]w?['2]?";
const RULES = {
  '222': [/^[RUF]['2]?$/, 11, 11], '333': [new RegExp('^' + F + '$'), 15, 21], '333ni': [new RegExp('^' + W + '$'), 15, 23],
  '444': [new RegExp('^' + W + '$'), 35, 50], '444ni': [new RegExp('^(' + W + "|[xyz]['2]?)$"), 35, 52],
  '555': [new RegExp('^' + W + '$'), 60, 60], '666': [new RegExp('^3?' + W + '$'), 80, 80], '777': [new RegExp('^3?' + W + '$'), 100, 100],
  pyram: [/^[ULRBulrb]'?$/, 6, 15], sq1: [/^(\(-?\d,-?\d\)|\/)$/, 11, 40], minx: [/^([RD](\+\+|--)|U'?)$/, 77, 77],
  clock: [/^((UR|DR|DL|UL|U|R|D|L|ALL)\d[+-]|y2)$/, 15, 15], skewb: [/^[ULRB]'?$/, 7, 11], fto: [/^(BR|BL|[RLBUDF])'?$/, 20, 34]
};
let bad = 0;
for (const [k, [re, lo, hi]] of Object.entries(RULES)) {
  const t = Date.now(), seen = new Set();
  for (let i = 0; i < 40; i++) {
    const s = scramble(k).trim(); seen.add(s);
    const m = s.split(/\s+/);
    if (m.length < lo || m.length > hi || m.some(x => !re.test(x))) { bad++; console.log('RULE BREAK', k, s.slice(0, 80)); break; }
  }
  console.log(k.padEnd(6), '40 scrambles, distinct', seen.size, (Date.now() - t) + 'ms', ' e.g.', scramble(k).trim().replace(/\s+/g, ' ').slice(0, 56));
}
console.log(bad ? bad + ' rule breaks' : "all 14 TNoodle puzzles satisfy the port's own rules");
