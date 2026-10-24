/* Stats: the numbers and the line chart. Times are milliseconds; a DNF is Infinity.
   Marks follow the dataviz spec: thin lines, 2px surface ring on dots, hairline grid, legend with values, a crosshair
   tooltip that lists every series, and a table view that carries the same numbers. */
(function (g) {
  'use strict';
  const f2 = n => Math.round(n * 100) / 100;

  function fmt(ms) {
    if (ms == null || !Number.isFinite(ms)) return '—';
    const cs = Math.floor(ms / 10), m = Math.floor(cs / 6000), s = Math.floor((cs % 6000) / 100), c = cs % 100;
    return (m ? m + ':' + String(s).padStart(2, '0') : String(s)) + '.' + String(c).padStart(2, '0');
  }
  // average of N: drop the best and worst; one DNF counts as the worst, two or more make the average a DNF (null)
  function trimmed(w) {
    const s = w.slice().sort((a, b) => a - b).slice(1, -1);
    return s.includes(Infinity) ? null : s.reduce((a, b) => a + b, 0) / s.length;
  }
  const aoSeries = (vals, n) => vals.map((_, i) => (i + 1 < n ? null : trimmed(vals.slice(i + 1 - n, i + 1))));
  const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
  const lastOf = a => { for (let i = a.length - 1; i >= 0; i--) if (a[i] != null) return a[i]; return null; };

  function summarize(vals, ao5, ao12) {
    const fin = vals.filter(Number.isFinite);
    const a5 = (ao5 || aoSeries(vals, 5)).filter(x => x != null), a12 = (ao12 || aoSeries(vals, 12)).filter(x => x != null);
    const out = { count: vals.length, dnf: vals.length - fin.length, best: null, worst: null, mean: null, sd: null, bestAo5: null, bestAo12: null, improve: null };
    if (fin.length) {
      out.best = Math.min(...fin); out.worst = Math.max(...fin); out.mean = mean(fin);
      out.sd = Math.sqrt(mean(fin.map(x => (x - out.mean) ** 2)));
    }
    if (a5.length) out.bestAo5 = Math.min(...a5);
    if (a12.length) out.bestAo12 = Math.min(...a12);
    // improvement: the average of your latest solves against your first ones, N each, N up to 10
    if (fin.length >= 6) {
      const n = Math.min(10, Math.floor(fin.length / 2)), first = mean(fin.slice(0, n)), latest = mean(fin.slice(-n));
      out.improve = { n, delta: latest - first, pct: (latest - first) / first };
    }
    return out;
  }

  function niceTicks(lo, hi, target) {
    target = target || 5;
    if (hi - lo < 1e-9) { lo -= 0.5; hi += 0.5; }
    const raw = (hi - lo) / target, mag = Math.pow(10, Math.floor(Math.log10(raw))), r = raw / mag;
    const step = (r <= 1 ? 1 : r <= 2 ? 2 : r <= 2.5 ? 2.5 : r <= 5 ? 5 : 10) * mag;
    const out = []; let v = Math.floor(lo / step + 1e-9) * step;
    for (let i = 0; i < 40; i++, v += step) { out.push(f2(v)); if (v >= hi - 1e-9) break; }   // stop at the first tick at or past the top of the data
    return out;
  }
  const tickLabel = s => (s >= 60 ? Math.floor(s / 60) + ':' + String(Math.round(s % 60)).padStart(2, '0') : String(Math.round(s * 10) / 10));

  /* ---------------- chart ---------------- */
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };

  // spec: { vals, ao5, ao12, mean, from (index of vals[0] in the full list), dates[] }
  function lineChart(host, spec) {
    host._spec = spec;
    if (!host._ro && typeof ResizeObserver !== 'undefined') { host._ro = new ResizeObserver(() => { if (host.clientWidth !== host._w) draw(host); }); host._ro.observe(host); }
    draw(host);
  }

  function draw(host) {
    const sp = host._spec; if (!sp) return;
    const W = Math.max(300, Math.floor(host.clientWidth || 800)); host._w = W;
    const H = W < 560 ? 240 : 300, m = { l: 46, r: 16, t: 12, b: 30 }, iw = W - m.l - m.r, ih = H - m.t - m.b, n = sp.vals.length;
    host.textContent = '';
    const wrap = document.createElement('div'); wrap.className = 'ch-wrap'; host.appendChild(wrap);
    const svg = svgEl('svg', { viewBox: '0 0 ' + W + ' ' + H, width: W, height: H, role: 'img', tabindex: '0', 'aria-label': 'Line chart of ' + n + ' solves with Ao5 and Ao12', class: 'ch' }, wrap);

    const sec = a => a.map(v => (v == null || !Number.isFinite(v) ? null : v / 1000));
    const S = { solve: sec(sp.vals), ao5: sec(sp.ao5), ao12: sec(sp.ao12) }, meanS = sp.mean == null ? null : sp.mean / 1000;
    const all = [...S.solve, ...S.ao5, ...S.ao12, meanS].filter(v => v != null);
    if (!all.length) { const t = document.createElement('p'); t.className = 'ch-empty'; t.textContent = 'Every solve in this range is a DNF.'; host.appendChild(t); return; }
    let lo = Math.min(...all), hi = Math.max(...all); const pad = Math.max((hi - lo) * 0.08, 0.2); lo = Math.max(0, lo - pad); hi += pad;
    const ticks = niceTicks(lo, hi, H < 260 ? 4 : 5), y0 = ticks[0], y1 = ticks[ticks.length - 1];
    const x = i => (n === 1 ? m.l + iw / 2 : m.l + (i * iw) / (n - 1)), y = v => m.t + ih - ((v - y0) / (y1 - y0)) * ih;

    // grid + y labels
    for (const t of ticks) {
      svgEl('line', { x1: m.l, x2: W - m.r, y1: f2(y(t)), y2: f2(y(t)), class: 'gl' }, svg);
      const tx = svgEl('text', { x: m.l - 8, y: f2(y(t)) + 4, 'text-anchor': 'end', class: 'ax' }, svg); tx.textContent = tickLabel(t);
    }
    // x labels: solve numbers, about six of them
    const per = Math.max(1, Math.ceil(n / 6));
    for (let i = 0; i < n; i += per) { const tx = svgEl('text', { x: f2(x(i)), y: H - 8, 'text-anchor': 'middle', class: 'ax' }, svg); tx.textContent = String(sp.from + i + 1); }
    if ((n - 1) % per) { const tx = svgEl('text', { x: f2(x(n - 1)), y: H - 8, 'text-anchor': 'middle', class: 'ax' }, svg); tx.textContent = String(sp.from + n); }
    svgEl('line', { x1: m.l, x2: W - m.r, y1: m.t + ih, y2: m.t + ih, class: 'bl' }, svg);

    const path = arr => { let d = '', pen = false; arr.forEach((v, i) => { if (v == null) { pen = false; return; } d += (pen ? 'L' : 'M') + f2(x(i)) + ' ' + f2(y(v)) + ' '; pen = true; }); return d; };
    if (meanS != null) svgEl('line', { x1: m.l, x2: W - m.r, y1: f2(y(meanS)), y2: f2(y(meanS)), class: 'ln mean' }, svg);
    svgEl('path', { d: path(S.solve), class: 'ln solve' }, svg);
    svgEl('path', { d: path(S.ao12), class: 'ln ao12' }, svg);
    svgEl('path', { d: path(S.ao5), class: 'ln ao5' }, svg);
    // DNFs: a short tick on the baseline
    sp.vals.forEach((v, i) => { if (!Number.isFinite(v)) svgEl('line', { x1: f2(x(i)), x2: f2(x(i)), y1: m.t + ih - 9, y2: m.t + ih, class: 'dnf-tick' }, svg); });
    // end dots with a 2px surface ring
    for (const k of ['ao12', 'ao5']) {
      let li = -1; for (let i = S[k].length - 1; i >= 0; i--) if (S[k][i] != null) { li = i; break; }
      if (li >= 0) svgEl('circle', { cx: f2(x(li)), cy: f2(y(S[k][li])), r: 4, class: 'dot ' + k }, svg);
    }

    // hover layer: crosshair + dots + one tooltip with every series
    const cross = svgEl('g', { class: 'cross', visibility: 'hidden' }, svg);
    const cl = svgEl('line', { y1: m.t, y2: m.t + ih, class: 'cl' }, cross);
    const cd = { solve: svgEl('circle', { r: 4, class: 'dot solve' }, cross), ao5: svgEl('circle', { r: 4, class: 'dot ao5' }, cross), ao12: svgEl('circle', { r: 4, class: 'dot ao12' }, cross) };
    const tip = document.createElement('div'); tip.className = 'ch-tip'; tip.hidden = true; wrap.appendChild(tip);
    const hit = svgEl('rect', { x: m.l, y: m.t, width: iw, height: ih, fill: 'transparent', class: 'hit' }, svg);
    let cur = -1;
    const show = i => {
      i = Math.max(0, Math.min(n - 1, i)); cur = i;
      const px = x(i); cross.setAttribute('visibility', 'visible'); cl.setAttribute('x1', f2(px)); cl.setAttribute('x2', f2(px));
      for (const k in cd) { const v = S[k][i]; if (v == null) cd[k].setAttribute('visibility', 'hidden'); else { cd[k].setAttribute('visibility', 'visible'); cd[k].setAttribute('cx', f2(px)); cd[k].setAttribute('cy', f2(y(v))); } }
      tip.textContent = '';
      const head = document.createElement('div'); head.className = 'tt-h';
      const d = sp.dates && sp.dates[i] ? new Date(sp.dates[i]) : null;
      head.textContent = 'Solve ' + (sp.from + i + 1) + (d ? ' · ' + d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '');
      tip.appendChild(head);
      const rows = [['solve', 'Solve', Number.isFinite(sp.vals[i]) ? sp.vals[i] : 'DNF'], ['ao5', 'Ao5', sp.ao5[i]], ['ao12', 'Ao12', sp.ao12[i]]];
      for (const [k, name, v] of rows) {
        const r = document.createElement('div'); r.className = 'tt-r';
        const key = document.createElement('i'); key.className = 'key ' + k;
        const val = document.createElement('b'); val.textContent = v === 'DNF' ? 'DNF' : v == null ? '—' : fmt(v);
        const lab = document.createElement('span'); lab.textContent = name;
        r.append(key, val, lab); tip.appendChild(r);
      }
      tip.hidden = false;
      const tw = tip.offsetWidth || 150, left = px + 14 + tw > W - 4 ? px - 14 - tw : px + 14;
      tip.style.left = Math.max(4, left) + 'px'; tip.style.top = m.t + 4 + 'px';
    };
    const hide = () => { cross.setAttribute('visibility', 'hidden'); tip.hidden = true; cur = -1; };
    const idxAt = e => { const r = svg.getBoundingClientRect(), px = ((e.clientX - r.left) / r.width) * W; return n === 1 ? 0 : Math.round(((px - m.l) / iw) * (n - 1)); };
    hit.addEventListener('pointermove', e => show(idxAt(e)));
    hit.addEventListener('pointerdown', e => show(idxAt(e)));
    hit.addEventListener('pointerleave', hide);
    svg.addEventListener('keydown', e => {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur < 0 ? n - 1 : cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur < 0 ? n - 1 : cur - 1); }
      else if (e.key === 'Escape') hide();
    });
    svg.addEventListener('blur', hide);
    host._show = show;
  }

  // The table is the same numbers as the chart. Long histories are drawn in pages of 200 rows so it stays instant.
  function table(host, spec) {
    host.textContent = '';
    const wrap = document.createElement('div'); wrap.className = 'tb-wrap'; host.appendChild(wrap);
    const t = document.createElement('table'); t.className = 'tb'; wrap.appendChild(t);
    const hd = t.createTHead().insertRow(); for (const h of ['#', 'Time', 'Ao5', 'Ao12', 'When']) { const c = document.createElement('th'); c.textContent = h; hd.appendChild(c); }
    const body = t.createTBody(), PAGE = 200; let next = spec.vals.length - 1;
    const more = document.createElement('button'); more.className = 'btn ghost sm tb-more';
    const fill = () => {
      const stop = Math.max(-1, next - PAGE);
      for (let i = next; i > stop; i--) {
        const r = body.insertRow(), d = spec.dates && spec.dates[i] ? new Date(spec.dates[i]) : null;
        [spec.from + i + 1, Number.isFinite(spec.vals[i]) ? fmt(spec.vals[i]) : 'DNF', fmt(spec.ao5[i]), fmt(spec.ao12[i]), d ? d.toLocaleDateString([], { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '']
          .forEach(v => { r.insertCell().textContent = String(v); });
      }
      next = stop;
      if (next >= 0) { more.textContent = 'Show ' + Math.min(PAGE, next + 1) + ' older (' + (next + 1) + ' left)'; if (!more.isConnected) host.appendChild(more); } else more.remove();
    };
    more.onclick = fill; fill();
  }

  /* ---------------- activity calendar ---------------- */
  const pad2 = n => String(n).padStart(2, '0');
  const dayKey = d => { d = d instanceof Date ? d : new Date(d); return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); };
  const addDays = (d, n) => { const x = new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); return x; };
  const mondayOf = d => addDays(d, -((d.getDay() + 6) % 7));       // weeks run Monday to Sunday

  // counts: { 'YYYY-MM-DD': n } of timed solves per local day
  function countByDay(times) { const m = {}; for (const t of times) { const k = dayKey(t); m[k] = (m[k] || 0) + 1; } return m; }

  // the last `weeks` weeks ending with the week that contains `today`; each cell is { key, date, n, future }
  function calendar(counts, today, weeks) {
    today = today || new Date(); weeks = weeks || 53;
    const end = mondayOf(today), start = addDays(end, -(weeks - 1) * 7), todayKey = dayKey(today), cols = [];
    for (let w = 0; w < weeks; w++) {
      const col = [];
      for (let d = 0; d < 7; d++) { const date = addDays(start, w * 7 + d), key = dayKey(date); col.push({ key, date, n: counts[key] || 0, future: key > todayKey }); }
      cols.push(col);
    }
    return cols;
  }
  // levels 0..4 from the busiest day, so a quiet history still shows contrast
  function levelFn(counts) {
    const v = Object.values(counts).filter(n => n > 0), max = v.length ? Math.max(...v) : 0, min = v.length ? Math.min(...v) : 0;
    // all active days equal: nothing to compare against, so every one is fully lit; otherwise scale between the quietest and the busiest
    return n => (n <= 0 ? 0 : max === min ? 4 : Math.max(1, Math.min(4, 1 + Math.round(((n - min) / (max - min)) * 3))));
  }
  // current streak counts back from today (or from yesterday if today has no solve yet); longest is over all days
  function streaks(counts, today) {
    today = today || new Date();
    const keys = Object.keys(counts).filter(k => counts[k] > 0).sort();
    let longest = 0, run = 0, prev = null;
    for (const k of keys) {
      const [y, m, d] = k.split('-').map(Number), cur = new Date(y, m - 1, d);
      run = prev && dayKey(addDays(prev, 1)) === k ? run + 1 : 1; prev = cur; if (run > longest) longest = run;
    }
    let cur = 0, day = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    if (!counts[dayKey(day)]) day = addDays(day, -1);
    while (counts[dayKey(day)]) { cur++; day = addDays(day, -1); }
    return { current: cur, longest };
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  function activity(host, counts, opts) {
    opts = opts || {};
    const today = opts.today || new Date(), weeks = opts.weeks || 53, cols = calendar(counts, today, weeks), lvl = levelFn(counts);
    const inRange = cols.flat().filter(c => !c.future), total = inRange.reduce((a, c) => a + c.n, 0), active = inRange.filter(c => c.n > 0).length, st = streaks(counts, today);
    host.textContent = '';
    const head = document.createElement('div'); head.className = 'ac-h';
    const title = document.createElement('div'); title.className = 'ac-t';
    const big = document.createElement('b'); big.textContent = total.toLocaleString('en');
    title.append(big, document.createTextNode(' solve' + (total === 1 ? '' : 's') + ' in the last year'));
    const facts = document.createElement('div'); facts.className = 'ac-f';
    for (const [l, v] of [['Active days', active], ['Current streak', st.current + (st.current === 1 ? ' day' : ' days')], ['Longest streak', st.longest + (st.longest === 1 ? ' day' : ' days')]]) {
      const s = document.createElement('span'); const b = document.createElement('b'); b.textContent = v; s.append(document.createTextNode(l + ' '), b); facts.appendChild(s);
    }
    head.append(title, facts); host.appendChild(head);

    const scroll = document.createElement('div'); scroll.className = 'ac-scroll'; host.appendChild(scroll);
    const grid = document.createElement('div'); grid.className = 'ac-grid'; grid.style.setProperty('--w', weeks); scroll.appendChild(grid);
    grid.setAttribute('role', 'img'); grid.setAttribute('aria-label', total + ' solves in the last year across ' + active + ' days. Current streak ' + st.current + ' days, longest ' + st.longest + '.');
    // month labels: a month is named at the first week that starts inside it. When two would sit closer than three columns,
    // the earlier one is the one dropped, so the label you do see is the month the columns after it actually belong to.
    const marks = []; let lastM = -1;
    cols.forEach((col, i) => { const m = col[0].date.getMonth(); if (m !== lastM) { marks.push({ i, m }); lastM = m; } });
    const kept = marks.filter((mk, k) => k === marks.length - 1 || marks[k + 1].i - mk.i >= 3);
    for (const mk of kept) { const l = document.createElement('span'); l.className = 'ac-m'; l.style.gridColumn = String(mk.i + 2); l.textContent = MONTHS[mk.m]; grid.appendChild(l); }
    ['Mon', '', 'Wed', '', 'Fri', '', ''].forEach((t, r) => { if (!t) return; const l = document.createElement('span'); l.className = 'ac-d'; l.style.gridRow = String(r + 2); l.textContent = t; grid.appendChild(l); });
    const tip = document.createElement('div'); tip.className = 'ac-tip'; tip.hidden = true; host.appendChild(tip);
    const show = (cell, el) => {
      const date = cell.date.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
      tip.textContent = ''; const b = document.createElement('b'); b.textContent = cell.n === 0 ? 'No solves' : cell.n + ' solve' + (cell.n === 1 ? '' : 's'); const s = document.createElement('span'); s.textContent = ' on ' + date; tip.append(b, s); tip.hidden = false;
      const hr = host.getBoundingClientRect(), er = el.getBoundingClientRect(); tip.style.left = Math.max(4, Math.min(hr.width - tip.offsetWidth - 4, er.left - hr.left + er.width / 2 - tip.offsetWidth / 2)) + 'px'; tip.style.top = er.top - hr.top - tip.offsetHeight - 8 + 'px';
    };
    cols.forEach((col, i) => col.forEach((c, r) => {
      const el = document.createElement('i'); el.className = 'ac-c' + (c.future ? ' fut' : ' l' + lvl(c.n)); el.style.gridColumn = String(i + 2); el.style.gridRow = String(r + 2); el.dataset.d = c.key; el.dataset.n = c.n;
      if (!c.future) { el.addEventListener('pointerenter', () => show(c, el)); el.addEventListener('pointerleave', () => { tip.hidden = true; }); }
      grid.appendChild(el);
    }));
    const foot = document.createElement('div'); foot.className = 'ac-l';
    const less = document.createElement('span'); less.textContent = 'Less'; foot.appendChild(less);
    for (let i = 0; i < 5; i++) { const k = document.createElement('i'); k.className = 'ac-c l' + i; foot.appendChild(k); }
    const more = document.createElement('span'); more.textContent = 'More'; foot.appendChild(more); host.appendChild(foot);
    scroll.scrollLeft = scroll.scrollWidth;                  // the newest weeks are the ones you want to see
    return { total, active, ...st };
  }

  const api = { fmt, trimmed, aoSeries, summarize, niceTicks, lastOf, lineChart, table, dayKey, countByDay, calendar, levelFn, streaks, activity };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else g.Stats = api;
})(typeof window !== 'undefined' ? window : globalThis);
