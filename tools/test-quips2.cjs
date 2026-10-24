// Every number a comment quotes must be true, no raw placeholders may leak, and variety must be real.
const assert = require('assert');
const Q = require('C:/Projects/Cubetimer/app/quips.js');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const s = x => x * 1000, sec = x => (x / 1000).toFixed(2);
const median = a => { const t = a.slice().sort((x, y) => x - y), m = t.length >> 1; return t.length % 2 ? t[m] : (t[m - 1] + t[m]) / 2; };

console.log('total lines:', Q.count());
ok(Q.count() >= 250, 'at least 250 lines, have ' + Q.count());
const per = Object.fromEntries(Object.entries(Q.POOL).map(([k, v]) => [k, v.length]));
console.log(JSON.stringify(per));
for (const [k, v] of Object.entries(Q.POOL)) ok(v.length >= 8, k + ' has ' + v.length + ' lines');
for (const [k, v] of Object.entries(Q.MILESTONE)) ok(v.length >= 4, 'milestone ' + k);
for (const [k, v] of Object.entries(Q.POOL)) ok(new Set(v).size === v.length, 'no duplicate lines in ' + k);

// a spread of histories and solves
const hist = [
  { name: 'Ada', ev: '3×3', prev: [s(14), s(13), s(15), s(14), s(13), s(15)], ms: s(11), pen: '0', total: 7 },          // sub-12
  { name: 'Ada', ev: '3×3', prev: [s(14), s(13), s(15), s(14), s(13), s(15)], ms: s(12.8), pen: '0', total: 7 },        // pb
  { name: 'Ada', ev: '3×3', prev: [s(12), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(10.9), pen: '0', total: 9 },
  { name: 'Ada', ev: '2×2', prev: [s(11), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(11.2), pen: '0', total: 9 },   // great
  { name: 'Ada', ev: '3×3', prev: [s(11), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(11.9), pen: '0', total: 9 },   // good
  { name: '', ev: '3×3', prev: [s(11), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(12.4), pen: '0', total: 9 },       // ok
  { name: 'Ada', ev: '3×3', prev: [s(12), s(12.5), s(12), s(15), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(13.9), pen: '0', total: 9 },    // meh
  { name: 'Ada', ev: '3×3', prev: [s(12), s(12.5), s(30), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(18), pen: '0', total: 9 },       // slow
  { name: 'Ada', ev: '3×3', prev: [s(12), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(20), pen: '0', total: 9 },       // worst
  { name: 'Ada', ev: '3×3', prev: [s(12), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(9), pen: 'DNF', total: 9 },       // dnf
  { name: 'Ada', ev: '3×3', prev: [s(12), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)], ms: s(14.4), pen: '2', total: 9 },      // +2
  { name: 'Ada', ev: '3×3', prev: [], ms: s(12), pen: '0', total: 1 },
  { name: 'Ada', ev: '3×3', prev: [s(12), s(13)], ms: s(12.5), pen: '0', total: 3 },
  { name: 'Ada', ev: '3×3', prev: [s(13), s(12), s(11)], ms: s(10), pen: '0', total: 4 },
  { name: 'Ada', ev: '3×3', prev: [s(14), s(13.5), s(13), s(12.5), s(12.2), s(13)], ms: s(12.4), pen: '0', total: 7 },                      // streak
  { name: 'Ada', ev: '3×3', prev: Array.from({ length: 49 }, (_, i) => s(12 + (i % 5) * 0.3)), ms: s(12.5), pen: '0', total: 50 },        // milestone 50
  { name: 'Ada', ev: '3×3', prev: [s(70), s(75), s(80), s(72), s(78), s(71)], ms: s(66.5), pen: '0', total: 7 }                          // minutes
];

let checked = 0;
for (const h of hist) {
  const fin = h.prev.filter(Number.isFinite), med = fin.length >= 3 ? median(fin.slice(-12)) : null, best = fin.length ? Math.min(...fin) : null;
  const allowedNum = new Set();
  const addT = ms => { const x = ms / 1000; allowedNum.add(x.toFixed(2)); if (x >= 60) { const m = Math.floor(x / 60); allowedNum.add(m + ':' + (x - m * 60).toFixed(2).padStart(5, '0')); } };
  addT(h.ms); if (best != null) addT(best);
  if (med != null) allowedNum.add(sec(Math.abs(h.ms - med)));
  if (best != null && h.ms > best) allowedNum.add(sec(h.ms - best));
  if (best != null && h.ms < best) allowedNum.add(sec(best - h.ms));
  const seen = new Set();
  for (let i = 0; i < 300; i++) {
    const r = Q.make(h);
    ok(r.text && !/[{}]/.test(r.text), 'no placeholder leaks: ' + r.text);
    seen.add(r.text);
    // every decimal number in the text must be one we computed independently
    for (const m of r.text.match(/\d+:\d\d\.\d\d|\d+\.\d\d/g) || []) { ok(allowedNum.has(m), 'quoted number ' + m + ' is not a computed value in: "' + r.text + '" (' + r.kind + ')'); checked++; }
  }
  const pool = Q.POOL[Q.classify(h).tone] || Q.MILESTONE[h.total];
  ok(seen.size >= Math.min(6, pool.length - 2), (Q.classify(h).tone) + ': only ' + seen.size + ' distinct lines in 300 draws');
}
console.log('numbers checked against independent maths:', checked);

// direction words must match the facts
const faster = Q.make({ ...hist[3] }); ok(faster.vals.diff === sec(median(hist[3].prev.slice(-12)) - hist[3].ms), 'great: diff is median minus time');
for (let i = 0; i < 400; i++) { const r = Q.make({ ...hist[6] }); if (/faster|under|quicker/.test(r.text) && /\{|\d/.test(r.text)) ok(false, 'a SLOW solve claims to be faster: ' + r.text); }
for (let i = 0; i < 400; i++) { const r = Q.make({ ...hist[3] }); if (/slower/.test(r.text)) ok(false, 'a FAST solve claims to be slower: ' + r.text); }

// recent lines are avoided: draw 12 in a row, none repeats within the window of 6
const recent = []; let dup = 0;
for (let i = 0; i < 12; i++) { const r = Q.make({ ...hist[4], recent: recent.slice(-6), lastText: recent[recent.length - 1] }); if (recent.slice(-6).includes(r.text)) dup++; recent.push(r.text); }
ok(dup === 0, 'no line repeats within the last six: ' + dup);

// name is used, and missing name still works
let withName = 0; for (let i = 0; i < 400; i++) if (/Ada/.test(Q.make(hist[3]).text)) withName++;
ok(withName > 10, 'name appears in a fair share of comments: ' + withName + '/400');
ok(!/undefined|null|NaN/.test(Array.from({ length: 300 }, () => Q.make(hist[5]).text).join(' ')), 'no undefined/NaN with a blank name');
console.log(n + ' checks passed');
