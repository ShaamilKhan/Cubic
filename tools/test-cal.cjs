const assert = require('assert');
const S = require('C:/Projects/Cubetimer/app/stats.js');
let n = 0; const ok = (c, m) => { assert(c, m); n++; };
const D = (y, m, d, h = 12) => new Date(y, m - 1, d, h);

/* a fixed "today": Saturday 24 Oct 2026 */
const today = D(2026, 10, 24);
const times = [D(2026, 10, 24, 9), D(2026, 10, 24, 20), D(2026, 10, 23), D(2026, 10, 22), D(2026, 10, 20), D(2026, 10, 19), D(2026, 10, 18), D(2026, 10, 17), D(2026, 1, 5), D(2025, 11, 1), D(2025, 11, 1, 23), D(2025, 11, 2)];
const counts = S.countByDay(times);
ok(counts['2026-10-24'] === 2 && counts['2026-10-23'] === 1 && counts['2025-11-01'] === 2, 'counts per local day, two times on one day are two');
ok(S.dayKey(D(2026, 3, 9, 23)) === '2026-03-09' && S.dayKey(D(2026, 3, 9, 0)) === '2026-03-09', 'local day, not UTC');

const cal = S.calendar(counts, today, 53);
ok(cal.length === 53 && cal.every(c => c.length === 7), '53 weeks of 7 days');
ok(cal[0][0].date.getDay() === 1, 'weeks start on Monday');
const last = cal[52];
ok(last[5].key === '2026-10-24' && last[5].n === 2 && !last[5].future, 'today is Saturday of the last column with 2 solves');
ok(last[6].future === true && last[6].key === '2026-10-25', 'Sunday after today is a future cell');
ok(cal.flat().filter(c => c.future).length === 1, 'only one future cell (the rest of this week)');
const keys = cal.flat().map(c => c.key); ok(new Set(keys).size === keys.length, 'every cell is a distinct day');
ok(cal.flat().every((c, i, a) => i === 0 || c.date - a[i - 1].date >= 82800000), 'days strictly increase (daylight saving safe)');
ok(cal[0][0].key === '2025-10-20', 'the grid starts on the Monday 52 weeks before this week: ' + cal[0][0].key);
ok(cal.flat().reduce((a, c) => a + c.n, 0) === times.length - 0, 'every solve in range is in some cell (12 of 12): ' + cal.flat().reduce((a, c) => a + c.n, 0));

/* streaks */
let st = S.streaks(counts, today);
ok(st.current === 3 && st.longest === 4, 'current 24,23,22 = 3 (21 is empty); longest 17,18,19,20 = 4: ' + JSON.stringify(st));
st = S.streaks(counts, D(2026, 10, 25));
ok(st.current === 3, 'streak survives a day with no solve yet (counts back from yesterday): ' + st.current);
st = S.streaks(counts, D(2026, 10, 26));
ok(st.current === 0, 'two empty days in a row breaks the current streak');
const run = S.countByDay([D(2026, 10, 1), D(2026, 10, 2), D(2026, 10, 3), D(2026, 10, 4), D(2026, 10, 6)]);
ok(S.streaks(run, D(2026, 10, 6)).longest === 4 && S.streaks(run, D(2026, 10, 6)).current === 1, 'longest 4, current 1');
const mon = S.countByDay([D(2026, 2, 27), D(2026, 2, 28), D(2026, 3, 1), D(2026, 3, 2)]);
ok(S.streaks(mon, D(2026, 3, 2)).current === 4, 'streak crosses a month boundary');
const dst = S.countByDay([D(2026, 3, 28), D(2026, 3, 29), D(2026, 3, 30), D(2026, 10, 24), D(2026, 10, 25)]);   // around clock changes
ok(S.streaks(dst, D(2026, 3, 30)).current === 3, 'streak across a daylight-saving change');
const none = S.streaks({}, today); ok(none.current === 0 && none.longest === 0, 'empty history');

/* shade levels */
const lv = S.levelFn({ a: 1, b: 2, c: 8, d: 4 });
ok(lv(0) === 0 && lv(1) >= 1 && lv(8) === 4, 'zero is empty, the busiest day is the darkest');
ok([1, 2, 3, 4, 5, 6, 7, 8].every((x, i, a) => i === 0 || lv(x) >= lv(a[i - 1])), 'levels never go down as the count goes up');
ok(S.levelFn({ a: 1 })(1) === 4 && S.levelFn({ a: 3 })(3) === 4, 'a single busy level is still clearly lit');
ok(S.levelFn({})(0) === 0, 'no data');
ok(new Set([1, 2, 3, 4, 5, 6, 7, 8].map(lv)).size >= 3, 'a spread of counts uses at least 3 shades');
console.log(n + ' calendar checks passed');
