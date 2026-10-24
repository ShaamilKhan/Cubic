const assert = require('assert');
const C = 'C:/Projects/Cubetimer/app/';
const Q = require(C + 'quips.js'), S = require(C + 'stats.js');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const s = x => x * 1000;

/* ---- comment tone ---- */
const cls = (ms, prev, pen, total) => Q.classify({ ms, prev, pen: pen || '0', total: total || prev.length + 1 });
ok(cls(s(12), []).tone === 'first', 'first solve');
ok(cls(s(0), [s(12), s(13)], 'DNF').tone === 'dnf' && cls(s(1), [s(12)], 'DNF').fx === 'dnf', 'DNF');
ok(cls(s(14), [s(12)], '2').tone === 'plus2', '+2');
ok(cls(s(10), [s(12), s(13), s(14)]).tone === 'earlybest', 'few solves -> softer best');
const six = [s(14), s(13), s(15), s(14), s(13), s(15)];
ok(cls(s(11), six).tone === 'sub' && cls(s(11), six).thr === 12, 'a best that crosses a round number is a "sub-N" moment');
ok(cls(s(12.8), six).tone === 'pb' && cls(s(12.8), six).fx === 'pb', 'personal best (crosses no round number)');
ok(cls(s(9.8), [s(11), s(12), s(11.5), s(12), s(11), s(12)]).tone === 'sub' && cls(s(9.8), [s(11), s(12), s(11.5), s(12), s(11), s(12)]).thr === 10, 'first sub-10');
ok(cls(s(9.5), [s(9.8), s(12), s(11.5), s(12), s(11), s(12)]).tone === 'pb', 'second sub-10 is just a PB (not first)');
const eight = [s(12), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)];
ok(cls(s(20), eight).tone === 'worst' && cls(s(20), eight).fx === 'worst', 'slowest on record');
ok(cls(s(13.5), eight).tone === 'worst', 'slower than everything so far is the worst on record');
const spread = [s(12), s(12.5), s(12), s(15), s(12.4), s(12.6), s(12.1), s(12.9)];
ok(cls(s(13.9), spread).tone === 'meh', 'a bit slow, not the worst: ' + cls(s(13.9), spread).tone);
ok(cls(s(18), [s(12), s(12.5), s(30), s(13), s(12.4), s(12.6), s(12.1), s(12.9)]).tone === 'slow', 'slow but not the worst');
ok(cls(s(10.5), eight).tone === 'sub' && cls(s(10.5), eight).thr === 12, 'faster than all of them, crossing 12, is a sub-12');
ok(cls(s(11.9), [s(12.05), s(12.5), s(12.2), s(13), s(12.4), s(12.6), s(12.1), s(12.9)]).tone === 'sub', 'crosses 12');
ok(cls(s(12.04), [s(12.05), s(12.5), s(12.2), s(13), s(12.4), s(12.6), s(12.1), s(12.9)]).tone === 'pb', 'beats best by a hair, no round number');
ok(cls(s(12.2), eight).tone === 'ok', 'on par');
ok(cls(s(11.2), [s(11), s(12.5), s(12), s(13), s(12.4), s(12.6), s(12.1), s(12.9)]).tone === 'great', '>10% faster than the median, not a PB');
ok(Q.classify({ ms: s(12.4), prev: eight, pen: '0', total: 50 }).tone === 'milestone', 'milestone at 50');
ok(cls(s(9), [s(Infinity), s(12)]).tone !== 'worst', 'DNFs in history do not break it');
const fin = [Infinity, s(12), Infinity];
ok(Q.classify({ ms: s(11), prev: fin, pen: '0', total: 4 }).tone === 'earlybest', 'DNFs ignored for best');

/* ---- text: name substituted, never repeats the last line, every pool non-empty ---- */
for (const k of Object.keys(Q.POOL)) ok(Q.POOL[k].length >= 3, 'pool ' + k + ' has variety');
for (let i = 0; i < 200; i++) {
  const r = Q.make({ name: 'Ada', ms: s(10), prev: six, pen: '0', total: 7, lastText: '' });
  ok(r.text && !/\{name\}|\{thr\}/.test(r.text), 'no raw placeholders: ' + r.text);
}
let prevText = '', repeats = 0;
for (let i = 0; i < 300; i++) { const r = Q.make({ name: 'Ada', ms: s(12), prev: six, pen: '0', total: 7, lastText: prevText }); if (r.text === prevText) repeats++; prevText = r.text; }
ok(repeats === 0, 'never the same comment twice in a row (' + repeats + ' repeats)');
ok(/Ada/.test(Array.from({ length: 80 }, () => Q.make({ name: 'Ada', ms: s(10), prev: six, pen: '0', total: 7 }).text).join(' ')), 'name appears in some comments');
ok(Q.make({ name: '', ms: s(10), prev: six, pen: '0', total: 7 }).text.length > 0, 'works with no name');

/* ---- stats ---- */
const v = [10, 11, 12, 13, 14].map(s);
ok(S.trimmed(v) === s(12), 'ao5 of 10..14 drops 10 and 14 -> 12');
ok(S.trimmed([s(10), s(11), s(12), s(13), Infinity]) === s(12), 'one DNF counts as the worst');
ok(S.trimmed([s(10), s(11), s(12), Infinity, Infinity]) === null, 'two DNFs make the average a DNF');
const ao5 = S.aoSeries(v.concat([s(9)]), 5);
ok(ao5.slice(0, 4).every(x => x == null) && ao5[4] === s(12) && ao5[5] === s(12), 'ao series starts at n and slides');
const sm = S.summarize([s(12), s(11), s(13), s(10), s(14), s(9), s(8), s(9)]);
ok(sm.best === s(8) && sm.worst === s(14) && sm.count === 8 && sm.dnf === 0, 'best/worst/count');
ok(Math.abs(sm.mean - s(10.75)) < 1, 'mean');
ok(sm.improve.n === 4 && sm.improve.delta < 0 && sm.improve.pct < 0, 'improving = negative delta (first 4 mean 11.5 -> last 4 mean 10)');
ok(Math.abs(sm.improve.delta - s(-1.5)) < 1, 'improvement is exactly -1.5s (first 4 mean 11.5, last 4 mean 10.0)');
const withDnf = S.summarize([s(12), Infinity, s(10)]);
ok(withDnf.dnf === 1 && withDnf.best === s(10) && withDnf.mean === s(11) && withDnf.improve === null, 'DNF counted, ignored in mean, too few for improvement');
ok(S.fmt(s(83.456)) === '1:23.45' && S.fmt(s(9.99)) === '9.99' && S.fmt(Infinity) === '—' && S.fmt(null) === '—', 'format');
const tk = S.niceTicks(9.3, 14.2, 5); ok(tk[0] <= 9.3 && tk[tk.length - 1] >= 14.2 && tk.length >= 3 && tk.length <= 9, 'ticks cover the range: ' + tk.join(','));
ok(S.niceTicks(10, 10, 5).length >= 2, 'flat data still gives a scale');
console.log(n + ' checks passed');
