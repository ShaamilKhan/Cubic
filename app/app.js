(() => {
'use strict';
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const uid = () => Math.random().toString(36).slice(2, 10);

/* ---------- storage (every access guarded; the page works without it) ---------- */
const KEY = 'cubic-v1', OLD_KEY = 'cubic-concept-v2';
let store = { solves: [], learned: [], hold: 300, name: '', hide: false, comments: true, fx: true, showScr: true, showImg: true, showBand: true, insp: false, pick: {}, tmode: false };
try {
  let raw = localStorage.getItem(KEY);
  if (!raw) { raw = localStorage.getItem(OLD_KEY); if (raw) localStorage.setItem(KEY, raw); }   // carry over data saved before the rename
  if (raw) store = { ...store, ...JSON.parse(raw) };
  if (typeof store.insp !== 'boolean') store.insp = false;
  if (!store.pick || typeof store.pick !== 'object' || Array.isArray(store.pick)) store.pick = {};
  store.tmode = store.tmode === true;
  for (const k of ['showScr', 'showImg', 'showBand']) if (typeof store[k] !== 'boolean') store[k] = true;
} catch (e) {}
let saveFailed = false;
const save = () => {
  let ok = true;
  try { localStorage.setItem(KEY, JSON.stringify(store)); } catch (e) { ok = false; }
  if (ok === saveFailed) { saveFailed = !ok; const w = document.getElementById('savewarn'); if (w) w.hidden = ok; }
};

/* ---------- events ---------- */
// [tab, WCA generator, length, catalog groups holding the other scramble types for that puzzle]
// [tab, csTimer generator, length, TNoodle puzzle key (the official WCA scrambler) or null, csTimer catalog groups for the practice types]
const EVENTS = [
  ['3×3', '333', 0, '333', ['3x3x3', '3x3x3 CFOP', '3x3x3 Roux']], ['2×2', '222so', 0, '222', ['2x2x2']],
  ['4×4', '444wca', 40, '444', ['4x4x4', '4x4x4 Yau/Hoya']], ['5×5', '555wca', 60, '555', ['5x5x5']],
  ['6×6', '666wca', 80, '666', ['6x6x6']], ['7×7', '777wca', 100, '777', ['7x7x7']],
  ['Clock', 'clkwca', 0, 'clock', ['Clock']], ['Mega', 'mgmp', 70, 'minx', ['Megaminx']],
  ['Pyra', 'pyrso', 10, 'pyram', ['Pyraminx']], ['Skewb', 'skbso', 0, 'skewb', ['Skewb']], ['Sq-1', 'sqrs', 0, 'sq1', ['Square-1']],
  ['3BLD', '333ni', 0, '333ni', []], ['FMC', '333fm', 0, null, []], ['OH', '333oh', 0, '333', []]
];
const EV = EVENTS.map(e => e[0]);
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
// types that crash, take 5+ seconds, or have no diagram are left out
const SKIP = /^(nocache_|333custom|333noob|input|remote|blank|mgmso|ftocorn|clkc$|clke$)/;
function typesFor(name) {
  const e = EVENTS.find(x => x[0] === name), out = [['', [['Standard', e[1], e[2]]]]];
  for (const [g, list] of CATALOG) if (e[4].includes(g)) out.push([g, list.filter(([, code]) => !SKIP.test(code) && code !== e[1]).map(([n, code, len]) => [decode(n), code, Math.abs(len || 0)])]);
  return out.filter(([, l]) => l.length);
}
let ev = '3×3', drill = null, cur = null, genToken = 0;
const HAS_TN = typeof TNOODLE_B64 === 'string';
store.wca = store.wca !== false; store.variant = store.variant || {};
const canTN = () => HAS_TN && !!EVENTS.find(x => x[0] === ev)[3];
const useTN = () => store.wca && canTN();
function curType() {
  const e = EVENTS.find(x => x[0] === ev);
  if (useTN()) return { code: e[1], len: e[2], tn: e[3] };
  const v = store.variant[ev];
  if (v) { const [code, len] = v.split('|'); return { code, len: +len }; }
  return { code: e[1], len: e[2] };
}

/* ---------- scramble engine: runs in the page, no server needed ---------- */
const mkWorker = src => new Worker(URL.createObjectURL(new Blob([src], { type: 'text/javascript' })));
const eng = mkWorker(ENGINE_SRC); let eid = 0; const epend = new Map();
eng.onmessage = e => { const [id, , res] = e.data, p = epend.get(id); if (p) { epend.delete(id); p(res); } };
eng.onerror = () => { epend.forEach(p => p(null)); epend.clear(); };
const ask = (type, args) => new Promise(res => {
  const id = ++eid, t = setTimeout(() => { epend.delete(id); res(null); }, 60000);
  epend.set(id, r => { clearTimeout(t); res(r); }); eng.postMessage([id, type, args]);
});
const REMAP = { '#00f': '#0046ad', '#0d0': '#009b48', '#f00': '#b71234', '#fa0': '#ff5800', '#ff0': '#ffd500', '#f80': '#ff5800', '#0f0': '#009b48',
  '#0000ff': '#0046ad', '#00ff00': '#009b48', '#ff0000': '#b71234', '#ffff00': '#ffd500', '#ff8800': '#ff5800',
  '#006600': '#009b48', '#0000bb': '#0046ad', '#ff8833': '#ff5800', '#77ee00': '#8bd800', '#dd0000': '#b71234', '#ff99ff': '#c04fd6',
  '#88ddff': '#3fb0ee', '#999999': '#8a8a8e', '#ffcc00': '#ffd500', '#ffffbb': '#efe58a' };
function cleanSvg(svg) {
  if (!svg || typeof svg !== 'string') return '';
  const w = parseFloat((/width="([\d.]+)/.exec(svg) || [])[1]), h = parseFloat((/height="([\d.]+)/.exec(svg) || [])[1]);
  if (!w || !h) return '';
  return svg.replace(/#[0-9a-fA-F]{3,6}\b/g, m => REMAP[m.toLowerCase()] || m)
    .replace(/<svg[^>]*>/, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}">`).replace(/<script[\s\S]*?<\/script>/gi, '');
}
// the official WCA scrambler (TNoodle, compiled to WebAssembly), in its own worker
function tnWorker() {   // runs inside the worker: loads the TNoodle WebAssembly module and answers scramble requests
  let wasm = null, mem = null, vlen = 0;
  const dec = new TextDecoder('utf-8', { ignoreBOM: true, fatal: true }), enc = new TextEncoder();
  const u8 = () => (mem === null || mem.byteLength === 0) ? (mem = new Uint8Array(wasm.memory.buffer)) : mem;
  const str = (p, l) => dec.decode(u8().subarray(p >>> 0, (p >>> 0) + l));
  const trap = e => { const i = wasm.__externref_table_alloc(); wasm.__wbindgen_externrefs.set(i, e); wasm.__wbindgen_exn_store(i); };
  const imports = { './tnoodle_lib_rs_bg.js': {
    __wbg_Error_67e7344beaa85059: (a, b) => Error(str(a, b)),
    __wbg_getRandomValues_436a51d0629d84e1: (a, b) => { try { crypto.getRandomValues(u8().subarray(a >>> 0, (a >>> 0) + b)); } catch (e) { trap(e); } },
    __wbindgen_init_externref_table: () => { const t = wasm.__wbindgen_externrefs, o = t.grow(4); t.set(0, undefined); t.set(o, undefined); t.set(o + 1, null); t.set(o + 2, true); t.set(o + 3, false); }
  } };
  function scramble(key) {
    const buf = enc.encode(key), ptr = wasm.__wbindgen_malloc(buf.length, 1) >>> 0;
    u8().subarray(ptr, ptr + buf.length).set(buf); vlen = buf.length;
    const r = wasm.scramble(ptr, vlen);
    if (r[3]) { const e = wasm.__wbindgen_externrefs.get(r[2]); wasm.__externref_table_dealloc(r[2]); throw e; }
    try { return str(r[0], r[1]); } finally { wasm.__wbindgen_free(r[0], r[1], 1); }
  }
  const queue = [];
  const run = ([id, key]) => { try { self.postMessage([id, null, scramble(key)]); } catch (e) { self.postMessage([id, String(e && e.message || e), null]); } };
  self.onmessage = e => {
    if (e.data && e.data.init) {
      try {
        const module = new WebAssembly.Module(Uint8Array.from(atob(e.data.init), c => c.charCodeAt(0)));
        wasm = new WebAssembly.Instance(module, imports).exports; wasm.__wbindgen_start();
        queue.splice(0).forEach(run);
      } catch (err) { queue.splice(0).forEach(([id]) => self.postMessage([id, 'TNoodle failed to load: ' + err.message, null])); }
    } else if (wasm) run(e.data); else queue.push(e.data);
  };
}
let tnw = null, tid = 0; const tpend = new Map();
function tnAsk(key) {
  if (!tnw) {
    tnw = mkWorker('(' + tnWorker + ')()'); tnw.postMessage({ init: TNOODLE_B64 });
    tnw.onmessage = e => { const [id, err, res] = e.data, p = tpend.get(id); if (p) { tpend.delete(id); err ? p.rej(new Error(err)) : p.res(res); } };
    tnw.onerror = () => { tpend.forEach(p => p.rej(new Error('TNoodle failed to start'))); tpend.clear(); tnw = null; };
  }
  return new Promise((res, rej) => { const id = ++tid; tpend.set(id, { res, rej }); tnw.postMessage([id, key]); });
}
async function make(t) {
  const scr = String(t.tn ? await tnAsk(t.tn) : await ask('scramble', [t.code, t.len]) || '').trim();
  if (!scr) throw new Error('empty');
  return { scr, svg: cleanSvg(await ask('image', [scr, t.code])), code: t.code, tn: !!t.tn };
}
// a few scrambles are always generated ahead, so "next" is instant
const ready = new Map();
function refill(t) {
  const k = t.code + '|' + t.len + '|' + (t.tn || ''); let b = ready.get(k); if (!b) ready.set(k, b = { list: [], busy: false });
  if (b.busy) return; b.busy = true;
  (async () => { try { while (b.list.length < 3) b.list.push(await make(t)); } catch (e) {} b.busy = false; })();
}
async function take(t) {
  const b = ready.get(t.code + '|' + t.len + '|' + (t.tn || ''));
  if (b && b.list.length) { const x = b.list.shift(); refill(t); return x; }
  const x = await make(t); refill(t); return x;
}

/* ---------- formatting ---------- */
const val = s => s.pen === 'DNF' ? Infinity : s.t + (s.pen === '2' ? 2000 : 0);
function parts(ms) {
  const cs = Math.floor(ms / 10), m = Math.floor(cs / 6000), sec = Math.floor((cs % 6000) / 100), c = cs % 100;
  return [m ? m + ':' + String(sec).padStart(2, '0') : String(sec), String(c).padStart(2, '0')];
}
const clockHTML = ms => { const [a, b] = parts(ms); return `${a}<small>.${b}</small>`; };
const text = ms => ms === Infinity ? 'DNF' : parts(ms).join('.');
const label = s => s.pen === 'DNF' ? 'DNF' : text(val(s)) + (s.pen === '2' ? '+' : '');
const disp = t => t.replace(/2'$/, '2').replace(/^([rludfb])(?!w)/, (m, c) => c.toUpperCase() + 'w');
const toks = s => String(s).replace(/[()]/g, ' ').trim().split(/\s+/).filter(Boolean);
const isRot = t => /^[xyz]/.test(t);
function tidy(list) {
  const out = [];
  for (const t of list) {
    const prev = out[out.length - 1];
    if (prev && isRot(t) && isRot(prev) && prev[0] === t[0]) {
      const q = x => (x.endsWith("'") ? 3 : x.endsWith('2') ? 2 : 1);
      const n = (q(prev) + q(t)) % 4; out.pop();
      if (n) out.push(t[0] + (n === 2 ? '2' : n === 3 ? "'" : ''));
    } else out.push(t);
  }
  return out;
}
const rtoks = s => tidy(toks(s));

/* ---------- on-demand data: the training library and Learn pictures are large, so they load when first needed ---------- */
const loading = {};
function loadScript(src) {
  return loading[src] || (loading[src] = new Promise((res, rej) => {
    const s = document.createElement('script'); s.src = src; s.onload = () => res(); s.onerror = () => { delete loading[src]; rej(new Error('Could not load ' + src)); };
    document.head.appendChild(s);
  }));
}
let trainReady = false;
async function ensureTrain() { if (!trainReady) { await Promise.all([loadScript('train-data.js'), loadScript('oll-extra.js').catch(() => {})]); buildTrain(); trainReady = true; } }
const ensureLearn = () => window.LPIC ? Promise.resolve() : loadScript('learn-pics.js').catch(() => {});   // pictures are a bonus: the guide still reads without them
const busy = on => document.body.classList.toggle('loading-data', on);

/* ---------- move player: one controller for the Review screen and the case sheet ---------- */
const PLAY_SVG = '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>', PAUSE_SVG = '<svg viewBox="0 0 24 24"><path d="M7 5v14M17 5v14"/></svg>';
const nap = ms => new Promise(r => setTimeout(r, ms));
// o: { stage, len, onPos(p), afterMove(p), onPlay(bool) }. Positions are 0..len = how many moves have been made.
function track(o) {
  const t = { pos: 0, playing: false, id: 0 };
  t.set = (p, anim) => {
    o.stage.finish();                        // a press while a turn is in progress lets that turn land first
    const from = t.pos; t.pos = p; o.onPos(p);
    const done = () => { if (t.pos === p && o.afterMove) o.afterMove(p); };
    if (anim && from !== p && Math.abs(p - from) <= 3) return o.stage.walk(from, p).then(done);
    o.stage.show(p); done(); return Promise.resolve();
  };
  t.stop = () => { t.id++; if (t.playing) { t.playing = false; o.onPlay(false); } };
  t.halt = () => { t.stop(); o.stage.cancel(); };
  t.play = async () => {
    if (t.playing) { t.stop(); return; }
    if (t.pos >= o.len) await t.set(0, false);
    t.playing = true; const id = ++t.id; o.onPlay(true);
    while (t.id === id && t.pos < o.len) {
      await t.set(t.pos + 1, true);
      if (t.id !== id) return;
      await nap(Anim.reduced() ? 520 : 170);   // a short breath between moves
    }
    if (t.id === id) { t.playing = false; o.onPlay(false); }
  };
  return t;
}
const setPlayIcon = (b, on) => { if (!b) return; b.innerHTML = on ? PAUSE_SVG : PLAY_SVG; b.setAttribute('aria-label', on ? 'Pause' : 'Play'); };

/* ---------- navigation ---------- */
let screen = 'timer', reviewId = null;
function go(s, id) {
  if (id !== undefined) reviewId = id;
  screen = s;
  $$('.screen').forEach(e => e.classList.toggle('on', e.id === s));
  $$('#nav button').forEach(b => b.classList.toggle('on', b.dataset.s === s));
  if (s === 'train') { if (trainReady) renderTrain(); else { busy(true); ensureTrain().then(() => { busy(false); if (screen === 'train') renderTrain(); }).catch(() => { busy(false); $('#cases').innerHTML = '<div class="empty">Could not load the training library. Check your connection and reopen this tab.</div>'; }); } }
  if (s === 'learn') { renderLearn(); if (!window.LPIC) ensureLearn().then(() => { if (screen === 'learn') renderLearn(); }); }
  if (s === 'stats') renderStats();
  if (s === 'review') renderReview();
  try { history.replaceState(null, '', '#' + s); } catch (e) {}
}
$$('#nav button').forEach(b => b.onclick = () => go(b.dataset.s));
$('#logo').onclick = e => { e.preventDefault(); if (phase === 'idle') go('timer'); };

/* ---------- events bar / drill bar ---------- */
function renderEvents() {
  const el = $('#events');
  if (drill) {
    const n = drill.pool.length, set = SETMETA[drill.set];
    el.innerHTML = `<div class="drill"><b>${set.name} practice</b><span>${n === 1 ? esc(DATA[drill.set][drill.pool[0]].n) : n + ' cases · ' + drill.done + ' of ' + n + ' this round'}</span><span class="nostat" title="Practice times stay out of your stats">Not in stats</span><span class="sep"></span><button class="link" id="chg-drill">Change cases</button><button class="link" id="end-drill">End practice</button></div>`;
    $('#chg-drill').onclick = () => { if (phase === 'idle') go('train'); };
    $('#end-drill').onclick = () => { drill = null; renderEvents(); newScramble(); };
    return;
  }
  el.innerHTML = EV.map(e => `<button class="chip${e === ev ? ' on' : ''}" data-e="${esc(e)}">${esc(e)}</button>`).join('');
  { const on = el.querySelector('.chip.on'); if (on && el.scrollWidth > el.clientWidth) el.scrollLeft = on.offsetLeft - (el.clientWidth - on.offsetWidth) / 2; }
  $$('#events .chip').forEach(c => c.onclick = () => { if (phase !== 'idle') return; ev = c.dataset.e; cur = null; renderEvents(); renderTools(); renderBand(); showAfter(false); setTime(0); newScramble(); });
}
const menuOpen = () => !$('#pop').hidden;
function closeMenu() { $('#pop').hidden = true; $('#tbtn').setAttribute('aria-expanded', 'false'); }
function renderInsp() { const b = $('#insp'); b.setAttribute('aria-pressed', String(!!store.insp)); b.title = 'Inspection: 15 s countdown before each solve. Tap or hold and release to start; it starts by itself at 15 s.'; }
$('#insp').onclick = () => { if (phase !== 'idle') return; store.insp = !store.insp; save(); renderInsp(); };
function renderTools() {
  renderInsp();
  const can = canTN(), on = can && store.wca, mode = $('#mode');
  mode.hidden = !!drill;
  const seg = $('#wca');
  seg.classList.toggle('off', !can);
  seg.querySelectorAll('button').forEach(b => { const w = b.dataset.w === '1'; b.setAttribute('aria-checked', String(w ? on : !on)); b.disabled = !can; b.title = w ? 'The official WCA scrambler (TNoodle)' : 'csTimer scramble types for practice'; });
  seg.title = !HAS_TN ? 'The official scrambler did not load' : can ? '' : 'The official scrambler has no ' + ev + ' event, so this uses csTimer';
  // the practice-type menu only exists when you are off the WCA scrambler and the event has more than one type
  const groups = typesFor(ev), flat = groups.flatMap(([, l]) => l), show = !drill && !on && flat.length > 1;
  $('#tmenu').hidden = !show; closeMenu();
  if (!show) return;
  if (!store.variant[ev] || !flat.some(([, c, l]) => c + '|' + l === store.variant[ev])) store.variant[ev] = flat[0][1] + '|' + flat[0][2];
  const sel = store.variant[ev], hit = flat.find(([, c, l]) => c + '|' + l === sel);
  $('#tname').textContent = hit ? hit[0] : 'Standard';
  $('#pop').innerHTML = groups.map(([g, l]) => (g ? `<h6>${esc(g)}</h6>` : '') + l.map(([n, c, len]) => `<button role="option" data-v="${c}|${len}" aria-selected="${c + '|' + len === sel}">${esc(n)}</button>`).join('')).join('');
  $$('#pop button').forEach(b => b.onclick = () => { store.variant[ev] = b.dataset.v; save(); cur = null; renderTools(); newScramble(); });
}

/* ---------- scramble display ---------- */
function layout(t) {
  const n = t.length, L = Math.max(...t.map(x => x.length)), cw = L * 0.62 + 1.15;
  for (const [fs, maxRows] of [[28, 2], [24, 3], [20, 4], [17, 6], [15, 9]]) {
    const per = Math.max(1, Math.floor(1120 / (cw * fs))), rows = Math.ceil(n / per);
    if (rows <= maxRows) { const p = Math.ceil(n / rows); return { fs, per: p, cw }; }
  }
  return { fs: 14, per: 20, cw };
}
function scrHTML(textStr) {
  const lines = textStr.split('\n').map(l => l.trim()).filter(Boolean);
  let rows, fs, cw;
  if (lines.length > 1) {
    rows = lines.map(l => l.split(/\s+/).map(disp));
    const L = Math.max(...rows.flat().map(x => x.length)); cw = L * 0.62 + 1.1; fs = 19;
  } else {
    const t = lines[0].split(/\s+/).map(disp), l = layout(t); fs = l.fs; cw = l.cw; rows = [];
    for (let i = 0; i < t.length; i += l.per) rows.push(t.slice(i, i + l.per));
  }
  const cols = Math.max(...rows.map(r => r.length));
  const multi = lines.length > 1;
  return rows.map((r, i) => `<div class="srow" style="--cols:${cols};--cw:${cw.toFixed(2)}em;--fs:clamp(14px,2.2vw,${fs}px)">${r.map(x => `<span>${esc(x)}</span>`).join('')}</div>${multi && i < rows.length - 1 ? '<div class="brk"></div>' : ''}`).join('');
}

function curScr() { return drill ? drill.cur.scr : cur ? cur.scr : ''; }
const TAB3 = ['3×3', '3BLD', 'FMC', 'OH'];
function showScramble() {
  const scr = curScr();
  if (!scr) return;
  $('#scr').innerHTML = scrHTML(scr);
  { const n = scr.split(/\s+/).filter(Boolean).length; $('#scr').style.setProperty('--pf', (n <= 12 ? 22 : n <= 25 ? 20 : n <= 45 ? 17 : n <= 70 ? 15 : 13) + 'px'); }
  let net = '';
  if (drill) net = drill.cur.v ? drill.cur.v.card : drill.cur.svg || Draw.iso(drill.cur.state, { pal: Draw.LL });
  else if (TAB3.includes(ev)) { try { net = Draw.net(Sim.run(scr)); } catch (e) { net = cur.svg; } }
  else net = cur.svg;
  $('#net').innerHTML = net;
  $('.net-l').textContent = drill ? 'The case on your cube' : 'Scramble preview';
  const al = $('#algline');
  if (drill) {
    al.innerHTML = drill.shown ? `<span>${esc(drill.cur.alg)}</span>` : `<button class="link" id="show-alg">Show algorithm</button>`;
    const b = $('#show-alg'); if (b) b.onclick = () => { drill.shown = true; showScramble(); };
  } else al.innerHTML = '';
}
async function newScramble() {
  if (drill) { nextCase(); renderEvents(); showScramble(); return; }
  const tok = ++genToken, t = curType(); cur = null;
  const slow = setTimeout(() => { if (tok === genToken && !cur) { $('#scr').innerHTML = '<div class="gen">Generating scramble…</div>'; $('#net').innerHTML = ''; } }, 160);
  try { const x = await take(t); if (tok !== genToken) return; cur = x; }
  catch (e) {
    if (tok === genToken) { $('#scr').innerHTML = '<div class="gen">Couldn’t generate this scramble. <button class="link" id="retry">Try again</button></div>'; $('#retry').onclick = newScramble; }
    return;
  } finally { clearTimeout(slow); }
  showScramble();
}

/* ---------- drills ---------- */
function nextCase() {
  const p = drill.pool;
  if (!drill.bag || !drill.bag.length) {
    const b = p.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [b[i], b[j]] = [b[j], b[i]]; }
    if (b.length > 1 && b[b.length - 1] === drill.last) [b[b.length - 1], b[0]] = [b[0], b[b.length - 1]];   // never the same case twice in a row
    drill.bag = b;
  }
  const pick = drill.bag.pop();
  drill.last = pick; drill.shown = false; drill.done = p.length - drill.bag.length;
  const c = DATA[drill.set][pick], meta = SETMETA[drill.set], mode = meta.mode, vk = meta.view;
  if (vk) {
    // a spare turn of the top layer, as in real solves, wherever the stored algorithm was checked to allow it
    const auf = (vk[0] === 'nxn:2' && vk[1] === 'll') || (vk[0] === 'poly:mgm' && vk[1] !== 'oll') ? [' ', ' U', ' U2', " U'"][Math.random() * 4 | 0] : ' ';
    const scr = (c.setup + auf).replace(/\s+/g, ' ').trim();
    drill.cur = { i: pick, scr, state: null, v: Views.views(vk[0], vk[1], scr, '', {}), alg: c.algs[0], name: c.n };
    return;
  }
  if (c.svg) { drill.cur = { i: pick, scr: c.setup, state: null, svg: c.svg, alg: c.algs[0], name: c.n }; return; }
  const auf = mode === 'iso' ? '' : ['', ' U', ' U2', " U'"][Math.random() * 4 | 0];
  const scr = Sim.deRotate(c.setup + auf);
  drill.cur = { i: pick, scr, state: Sim.run(scr), alg: c.algs[0], name: c.n };
}
function startDrill(set, pool) {
  drill = { set, pool, last: -1, shown: false, bag: null, done: 0 }; nextCase();
  closeModal(); go('timer'); renderEvents(); showScramble(); renderBand(); setTime(0); showAfter(false);
}

/* ---------- timer ---------- */
let phase = 'idle', t0 = 0, raf = 0, holdTimer = 0, last = null;
// Inspection: 15 s countdown. Tap, or hold and release, to start early; at 15 s the timer starts by itself with a different beep.
const beepGo = () => { beep(1320, .1); setTimeout(() => beep(1760, .35), 130); };
let inspT0 = 0, inspRaf = 0, inspBeep = 0;
const inspElapsed = () => (performance.now() - inspT0) / 1000;
function beep(f, len = .12) { try { const a = beep.c || (beep.c = new (window.AudioContext || window.webkitAudioContext)()), o = a.createOscillator(), g = a.createGain(); o.frequency.value = f; g.gain.value = .06; o.connect(g); g.connect(a.destination); o.start(); o.stop(a.currentTime + len); } catch (e) {} }
function inspTick() {
  if (!inspT0) return;
  const e = inspElapsed();
  if (e >= 8 && inspBeep < 1) { inspBeep = 1; beep(660); }
  if (e >= 12 && inspBeep < 2) { inspBeep = 2; beep(880); }
  if (e >= 15) { clearTimeout(holdTimer); beepGo(); startRun(); return; }
  T.innerHTML = String(Math.ceil(15 - e));
  T.classList.toggle('insp-warn', e >= 8);
  inspRaf = requestAnimationFrame(inspTick);
}
function endInsp() { clearTimeout(inspAuto); inspT0 = 0; inspBeep = 0; cancelAnimationFrame(inspRaf); T.classList.remove('insp-warn', 'insp-bad'); }
let startPen = '0', inspAuto = 0;
function startRun() {
  endInsp(); phase = 'running'; T.className = ''; document.body.classList.remove('hold'); document.body.classList.add('run'); t0 = performance.now();
  document.body.classList.toggle('veil', !!store.hide); tick();
}
const T = $('#t');
let lastEw = 0;
function sizeFor(ms, pen, dnf) {
  let ew = 1.94;
  if (!dnf) { const cs = Math.floor(ms / 10), m = Math.floor(cs / 6000), digits = String(Math.floor((cs % 6000) / 100)).length; ew = m ? 2.632 + (String(m).length - 1) * 0.555 : 1.285 + 0.555 * (digits - 1); if (m && digits < 2) ew = 2.632; ew += pen === '2' ? 0.4 : 0; }
  if (ew === lastEw) return; lastEw = ew;
  T.style.setProperty('--ew', ew); T.style.setProperty('--ewr', Math.max(ew, 1.84));   // while running it is never smaller than a two-digit time, so it does not jump at 10 s
}
const setTime = ms => { sizeFor(ms); T.innerHTML = clockHTML(ms); };
const bucket = () => drill ? 'drill:' + drill.set : 'ev:' + ev;
const mine = () => store.solves.filter(s => s.b === bucket());
let lastPrev = [], lastQuip = '', recentQuips = [];
// a finished solve: OK shows the time, +2 shows the new total, DNF shows DNF until the next solve starts
function showTime(s) {
  T.classList.toggle('is-dnf', s.pen === 'DNF');
  if (s.pen === 'DNF') { sizeFor(0, '0', true); T.innerHTML = 'DNF'; return; }
  sizeFor(val(s), s.pen);
  T.innerHTML = clockHTML(val(s)) + (s.pen === '2' ? '<sup class="p2">+2</sup>' : '');
}
function showAfter(on) {
  $('#hint').style.display = on ? 'none' : ''; $('#after').classList.toggle('show', on);
  if (!on) { const q = $('#quip'); q.hidden = true; q.textContent = ''; T.classList.remove('is-dnf'); if (window.FX) FX.clear(T); T.className = T.className.replace(/fx-w+/g, '').trim(); }
}
// the comment under the time and the animation on it
function react(s) {
  if (!window.Quips) return;
  const vals = lastPrev.slice(), total = mine().length;
  const r = Quips.make({ name: store.name, ev: s.ev, ms: val(s) === Infinity ? s.t : val(s), pen: s.pen, prev: vals, total, lastText: lastQuip, recent: recentQuips });
  lastQuip = r.text; recentQuips = recentQuips.concat(r.text).slice(-8);
  const q = $('#quip');
  if (store.comments) { q.textContent = r.text; q.dataset.tone = r.tone; q.hidden = false; } else q.hidden = true;
  if (store.fx && window.FX) FX.play(r.fx, T);
}
function tick() { if (!store.hide) setTime(performance.now() - t0); raf = requestAnimationFrame(tick); }
function down(e) {
  if (phase === 'running') {
    cancelAnimationFrame(raf);
    const ms = performance.now() - t0; phase = 'idle'; document.body.classList.remove('run', 'hold');
    const s = { id: uid(), t: Math.floor(ms / 10) * 10, pen: startPen, scr: curScr(), ev: drill ? SETMETA[drill.set].name : ev, b: bucket(), date: Date.now(),
      kind: drill ? 'drill' : 'solve', set: drill && drill.set, ci: drill && drill.cur.i, code: drill ? null : cur.code };
    const prevVals = mine().map(val);
    store.solves.push(s); save(); last = s; lastPrev = prevVals;
    if (drill) { drill.shown = true; }
    document.body.classList.remove('veil'); startPen = '0';
    showTime(s); markPen(); showAfter(true); react(s);
    newScramble();
    renderBand(); return;
  }
  if (phase === 'idle' && store.insp && curScr() && !inspT0) {   // first press starts the countdown
    phase = 'insp'; showAfter(false); T.className = ''; document.body.classList.add('run'); inspT0 = performance.now(); inspBeep = 0; inspTick();
    inspAuto = setTimeout(() => { if (inspT0 && phase !== 'running') { clearTimeout(holdTimer); beepGo(); startRun(); } }, 15000); return;
  }
  if ((phase !== 'idle' && phase !== 'insp') || !curScr()) return;
  phase = 'hold'; T.className = 'hold'; showAfter(false); if (!inspT0) document.body.classList.add('hold');
  // the last time stays up in red while you hold, then the clock clears to zero the moment it turns green
  holdTimer = setTimeout(() => { if (phase === 'hold') { phase = 'ready'; T.className = 'ready'; if (!inspT0) setTime(0); } }, store.hold);
}
function up() {
  clearTimeout(holdTimer);
  if (phase === 'ready' || (phase === 'hold' && inspT0)) { if (inspT0) beepGo(); startRun(); }
  else if (phase === 'hold') { phase = inspT0 ? 'insp' : 'idle'; T.className = ''; document.body.classList.remove('hold'); }
}
// Space belongs to the timer. It never activates a focused button, and clicking something never leaves it focused.
const inField = () => { const a = document.activeElement; return !!a && (a.tagName === 'TEXTAREA' || (a.tagName === 'INPUT' && a.type !== 'range')); };
const modalOpen = () => $('#modal').classList.contains('on');
addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (menuOpen()) closeMenu();
    else if (modalOpen()) closeModal();
    else if (phase === 'running' || phase === 'hold' || phase === 'ready' || phase === 'insp') { endInsp(); startPen = '0'; clearTimeout(holdTimer); cancelAnimationFrame(raf); phase = 'idle'; T.className = ''; document.body.classList.remove('run', 'hold', 'veil'); setTime(0); }
    return;
  }
  if (screen === 'review' && !inField()) {
    if (e.key === 'ArrowRight') { e.preventDefault(); stepBy(1); } else if (e.key === 'ArrowLeft') { e.preventDefault(); stepBy(-1); }
    if (e.code !== 'Space') return;
  }
  if (e.code === 'Space' && !inField() && !modalOpen()) {
    e.preventDefault(); e.stopPropagation();
    const a = document.activeElement; if (a && a !== document.body && a.blur) a.blur();
    if (screen === 'timer' && !e.repeat) { closeMenu(); down(); }
    return;
  }
  if (screen !== 'timer' || modalOpen() || inField() || e.repeat) return;
  if (phase === 'running') { e.preventDefault(); down(); }
}, true);
addEventListener('keyup', e => {
  if (e.code !== 'Space' || inField() || modalOpen()) return;
  e.preventDefault(); e.stopPropagation();
  if (screen === 'timer') up();
}, true);
$('#clock').addEventListener('pointerdown', e => { if (e.target.closest('.after, .quip, button, a')) return; if (phase !== 'running') { e.preventDefault(); closeMenu(); down(); } });
addEventListener('pointerup', () => { if (phase === 'hold' || phase === 'ready') up(); });
let tapGuard = 0;
addEventListener('pointerdown', e => { if (phase === 'running') { e.preventDefault(); e.stopPropagation(); if (e.pointerType !== 'mouse') tapGuard = performance.now() + 380; down(); } }, true);
addEventListener('click', e => { if (performance.now() < tapGuard) { e.preventDefault(); e.stopPropagation(); } }, true);
addEventListener('pointercancel', () => { if (phase === 'hold') up(); });
// a mouse click should not leave a focus ring or an armed button behind
addEventListener('click', e => { const b = e.target.closest && e.target.closest('button'); if (b && e.detail > 0 && !b.closest('#sheet')) b.blur(); }, true);

function markPen() { $$('#after [data-pen]').forEach(b => b.classList.toggle('on', last && b.dataset.pen === last.pen)); }
$$('#after [data-pen]').forEach(b => b.onclick = e => {
  e.stopPropagation(); if (!last || phase !== 'idle') return;
  const pen = b.dataset.pen === '0' ? '0' : b.dataset.pen === '2' ? '2' : 'DNF';
  if (last.pen === pen) return;
  last.pen = pen; save(); markPen(); showTime(last); renderBand(); react(last);
});
$('#rv-last').onclick = e => { e.stopPropagation(); if (last && phase === 'idle') openSolve(last); };
$('#next').onclick = () => { if (phase === 'idle') { showAfter(false); newScramble(); } };
$('#copy').onclick = () => { try { navigator.clipboard.writeText(curScr()); } catch (e) {} const b = $('#copy'); b.style.color = 'var(--go)'; setTimeout(() => b.style.color = '', 700); };
$('#all').onclick = historyModal;

/* ---------- stats ---------- */
function ao(vals, n) {
  if (vals.length < n) return '—';
  const w = vals.slice(-n).sort((a, b) => a - b).slice(1, -1);
  return w.includes(Infinity) ? 'DNF' : text(w.reduce((a, b) => a + b, 0) / w.length);
}
function renderBand() {
  const list = mine(), v = list.map(val), fin = v.filter(x => x !== Infinity), best = fin.length ? Math.min(...fin) : null;
  $('#sn').textContent = list.length;
  $('#sb').textContent = best === null ? '—' : text(best);
  $('#s5').textContent = ao(v, 5); $('#s12').textContent = ao(v, 12);
  $('#sm').textContent = fin.length ? text(fin.reduce((a, b) => a + b, 0) / fin.length) : '—';
  const r = list.slice(-12).reverse();
  $('#recent').innerHTML = r.length ? r.map(s => `<button data-id="${s.id}" class="${val(s) === best ? 'pb' : ''}">${label(s)}</button>`).join('') : '<span class="none">No solves yet</span>';
  $$('#recent button').forEach(b => b.onclick = () => openSolve(store.solves.find(s => s.id === b.dataset.id)));
}
/* ---------- train ---------- */
// every training set comes from train-data.js, where each case was checked: its algorithm really solves its picture
// How each set is drawn. Only the part of the puzzle a case needs: a top view with its ring of side stickers
// for last-layer cases, otherwise 3D from the corner where the most is out of place.
const VIEWKIND = {
  cll: ['nxn:2', 'll'], ocll: ['nxn:2', 'll'], 'eg-1': ['nxn:2', 'best'], 'eg-2': ['nxn:2', 'best'], pbl: ['nxn:2', 'best'],
  'parity-444': ['nxn:4', 'll'], 'parity-555': ['nxn:5', 'll'], 'l2c-555': ['nxn:5', 'best'], 'l2e-555': ['nxn:5', 'best'],
  l4e: ['poly:pyr', 'best'], sarah: ['poly:skb', 'best'],
  'megaminx-co': ['poly:mgm', 'oll'], 'megaminx-cp': ['poly:mgm', 'llc'], 'megaminx-eo': ['poly:mgm', 'll'], 'megaminx-ep': ['poly:mgm', 'lle']
};
// puzzles in the order people look for them; anything not listed keeps its place after these
const PUZZLE_ORDER = ['3×3', 'Megaminx', '2×2', '4×4', '5×5'];
const rank = p => { const i = PUZZLE_ORDER.indexOf(p); return i < 0 ? PUZZLE_ORDER.length : i; };
const DATA = {}, SETMETA = {}, ORDER = [], NAV = [];
function buildTrain() {
for (const s of TRAIN) {
  if (!s.cases.length) continue;
  const id = s.parent || s.id;
  if (!DATA[id]) { DATA[id] = []; SETMETA[id] = { name: s.parent ? s.parent.toUpperCase() : s.name, mode: s.mode, blurb: s.blurb, puzzle: s.puzzle, group: s.group, view: VIEWKIND[s.id] }; ORDER.push(id); }
  for (const c of s.cases) DATA[id].push(s.parent ? { ...c, g: s.name.replace('ZBLL ', '') } : c);
}
for (const id of ORDER) {
  const m = SETMETA[id], key = m.puzzle + ' · ' + m.group;
  let g = NAV.find(x => x[0] === key); if (!g) NAV.push(g = [key, [], m.puzzle]); g[1].push(id);
}
NAV.sort((a, b) => rank(a[2]) - rank(b[2]));   // stable: groups inside a puzzle keep their order
// community nicknames and one extra algorithm per OLL case (every one was run on a model, see tools/oll-nick.cjs)
if (window.OLLX && DATA.oll) for (const c of DATA.oll) { c.nick = OLLX.nick[c.n]; const x = OLLX.alg[c.n]; if (x) c.algs = c.algs.concat(x); }
}
let tset = 'oll', q = '';
const learnedKey = (s, i) => s + ':' + i;
const isLearned = (s, i) => store.learned.includes(learnedKey(s, i));
const diagram = (set, c) => {
  const vk = SETMETA[set].view;
  if (vk) return Views.views(vk[0], vk[1], c.setup, '', {}).card;
  if (c.svg) return c.svg;
  const st = Sim.run(c.setup), m = SETMETA[set].mode;
  return m === 'iso' ? Draw.iso(st, { pal: Draw.LL }) : Draw.ll(st, m);
};
const cardCache = {};
const pickKey = c => c.g + '|' + c.n;
const pickedSet = set => new Set(store.pick[set] || []);
const pickedIdx = set => { const k = pickedSet(set); return DATA[set].map((c, i) => k.has(pickKey(c)) ? i : -1).filter(i => i >= 0); };
let tView = [];   // the cases on screen right now (after the search box), as indexes
function setPick(set, idxs, on) {
  const k = pickedSet(set);
  for (const i of idxs) { const key = pickKey(DATA[set][i]); if (on) k.add(key); else k.delete(key); }
  store.pick[set] = [...k]; save();
}
// update the ticks and counts in place, so the list keeps its scroll position
function refreshPick() {
  const k = pickedSet(tset), n = pickedIdx(tset).length;
  $$('#cases .case').forEach(b => { const on = k.has(pickKey(DATA[tset][+b.dataset.i])); b.classList.toggle('sel', on); b.setAttribute('aria-checked', String(on)); });
  $$('#cases [data-pg]').forEach(b => { const ids = b.dataset.pg.split(',').map(Number), all = ids.every(i => k.has(pickKey(DATA[tset][i]))); b.textContent = all ? 'Clear group' : 'Select group'; });
  const cnt = $('#sel-n'); if (cnt) cnt.textContent = n;
  const go1 = $('#drill-all'); go1.textContent = n ? 'Train ' + n + (n === 1 ? ' case' : ' cases') : 'Train'; go1.disabled = !n;
}
function renderTrain() {
  const prac = store.tmode, keep = $('#cases').scrollTop;
  $('#side').innerHTML = NAV.map(([h, ids]) => `<div style="margin-bottom:22px"><h6>${esc(h)}</h6>${ids.map(id => `<button data-s="${id}" class="${id === tset ? 'on' : ''}">${esc(SETMETA[id].name)}<em>${DATA[id].length}</em></button>`).join('')}</div>`).join('');
  $$('#side button').forEach(b => b.onclick = () => { tset = b.dataset.s; q = ''; $('#find').value = ''; $('#cases').scrollTop = 0; renderTrain(); });
  const list = DATA[tset], meta = SETMETA[tset];
  const learned = list.filter((_, i) => isLearned(tset, i)).length;
  $('#tt').textContent = meta.name;
  $('#tp').textContent = prac ? `${list.length} cases. Tick the ones you want to drill, then press Train. Practice times are not added to your stats.` : `${list.length} cases${learned ? ' · ' + learned + ' learned' : ''} — ${meta.blurb}`;
  $$('#tmode button').forEach(b => b.setAttribute('aria-checked', String((b.dataset.m === '1') === prac)));
  const groups = []; list.forEach((c, i) => {
    if (q && !(c.n + ' ' + c.g + ' ' + (c.nick || '')).toLowerCase().includes(q)) return;
    let g = groups.find(x => x.name === c.g); if (!g) groups.push(g = { name: c.g, items: [] }); g.items.push(i);
  });
  tView = groups.flatMap(g => g.items);
  const shown = tView.length, picked = pickedSet(tset);
  $('#selbar').hidden = !prac; $('#train').classList.toggle('prac', prac);
  if (prac) {
    $('#selbar').innerHTML = `<span class="cnt"><b id="sel-n">0</b> selected</span><button class="link" data-sel="all">${q ? 'Select shown' : 'Select all'}</button><button class="link" data-sel="new">Select not learned</button><button class="link" data-sel="none">Clear</button>`;
    $$('#selbar [data-sel]').forEach(b => b.onclick = () => {
      const w = b.dataset.sel;
      if (w === 'none') setPick(tset, list.map((_, i) => i), false);
      else if (w === 'all') setPick(tset, tView, true);
      else setPick(tset, tView.filter(i => !isLearned(tset, i)), true);
      refreshPick();
    });
  } else {
    $('#drill-all').textContent = q ? `Practice ${shown}` : 'Practice all';
    $('#drill-all').disabled = !shown;
  }
  $('#cases').innerHTML = shown ? groups.map(g => `<section class="group"><div class="gh"><h3>${esc(g.name || meta.name)}<em>${g.items.length}</em></h3><button class="link" ${prac ? `data-pg="${g.items.join(',')}">Select group` : `data-g="${g.items.join(',')}">Practice`}</button></div><div class="grid">${g.items.map(i => {
    const k = tset + i, c = list[i], on = picked.has(pickKey(c)); const svg = cardCache[k] || (cardCache[k] = diagram(tset, c));
    return `<button class="case${on ? ' sel' : ''}" data-i="${i}"${prac ? ` role="checkbox" aria-checked="${on}"` : ''}>${prac ? '<u class="ck"></u><span class="inf" data-info="1" title="Open this case" role="button">i</span>' : ''}${isLearned(tset, i) ? '<i></i>' : ''}${svg}<b>${esc(c.n)}</b>${c.nick ? `<small>${esc(c.nick)}</small>` : ''}</button>`;
  }).join('')}</div></section>`).join('') : '<div class="empty">No case matches that.</div>';
  $$('#cases .case').forEach(b => b.onclick = e => {
    const i = +b.dataset.i;
    if (!prac || e.target.closest('[data-info]')) { openCase(tset, i); return; }
    setPick(tset, [i], !pickedSet(tset).has(pickKey(list[i]))); refreshPick();
  });
  $$('#cases [data-g]').forEach(b => b.onclick = () => startDrill(tset, b.dataset.g.split(',').map(Number)));
  $$('#cases [data-pg]').forEach(b => b.onclick = () => {
    const ids = b.dataset.pg.split(',').map(Number), k = pickedSet(tset);
    setPick(tset, ids, !ids.every(i => k.has(pickKey(list[i])))); refreshPick();
  });
  $('#drill-all').onclick = () => { if (prac) { const idx = pickedIdx(tset); if (idx.length) startDrill(tset, idx); } else startDrill(tset, tView); };
  if (prac) refreshPick();
  $('#cases').scrollTop = keep;
}
$$('#tmode button').forEach(b => b.onclick = () => { store.tmode = b.dataset.m === '1'; save(); renderTrain(); });
$('#find').oninput = e => { q = e.target.value.trim().toLowerCase(); renderTrain(); };

/* ---------- learn ---------- */
const SRC = {
  checked: ['Algorithms checked', 'Every algorithm in this guide was run on a model of the puzzle and does what the step says.'],
  partial: ['Parity checked', 'The parity algorithms were run on a model of the puzzle. The centre and edge steps follow a published guide.'],
  guide: ['From a published guide', 'The steps follow a published beginner guide. They have not been run on a model of the puzzle here.'],
  overview: ['Overview', 'A short overview. The full method has more to it.']
};
let lid = '3×3';
function algRow(a, pics, key) {
  const svg = pics && pics.algs[key];
  const pic = svg ? `<div class="lpic">${svg}<span>Before</span></div>` : '';
  return `<div class="lalg">${pic}<div><div class="lw">${esc(a.w)}</div><div class="lm">${toks(a.m).map(t => `<span>${esc(disp(t))}</span>`).join(' ')}</div>${a.n ? `<div class="ln">${esc(a.n)}</div>` : ''}</div></div>`;
}
function renderLearn() {
  $('#lside').innerHTML = `<div><h6>Puzzles</h6>${LEARN.map(g => `<button data-l="${esc(g.id)}" class="${g.id === lid ? 'on' : ''}">${esc(g.name)}<em>${g.steps.length}</em></button>`).join('')}</div>`;
  $$('#lside button').forEach(b => b.onclick = () => { lid = b.dataset.l; renderLearn(); $('#lbody').scrollTop = 0; });
  const g = LEARN.find(x => x.id === lid) || LEARN[0], src = SRC[g.src], pics = window.LPIC && LPIC[g.id];
  $('#lbody').innerHTML = `<article class="lart">
    <div class="lh"><div><div class="lk">${esc(g.tag)} · ${esc(g.level)}</div><h1>${esc(g.name)}</h1></div>
      <div class="lbtns"><button class="btn ghost sm" data-ev="${esc(g.ev)}">Open ${esc(g.name)} in the timer ↗</button></div></div>
    <p class="lintro">${esc(g.intro)}</p>
    ${pics && pics.hero.length ? `<div class="lhero">${pics.hero.map((s, i) => `<figure>${s}<figcaption>${esc(pics.heroCap[i] || '')}</figcaption></figure>`).join('')}</div>` : ''}
    <div class="lsrc" title="${esc(src[1])}"><i></i>${esc(src[0])}<span>${esc(src[1])}</span></div>
    <section class="lnot"><h2>Notation</h2><dl>${g.notation.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></section>
    <ol class="lsteps">${g.steps.map((s, i) => `<li><div class="ln0">${i + 1}</div><div class="lbd"><h3>${esc(s.t)}</h3><p>${esc(s.d)}</p>${pics && pics.steps[i] ? `<div class="lprog">${pics.steps[i].map(x => `<div>${x}</div>`).join('')}<span>${i === g.steps.length - 1 ? 'Solved' : 'Solved after this step, shown in colour'}</span></div>` : ''}${s.algs.map((a, ai) => algRow(a, pics, i + '.' + ai)).join('')}${s.tip ? `<p class="ltip"><b>Tip</b> ${esc(s.tip)}</p>` : ''}</div></li>`).join('')}</ol>
    <section class="lnot"><h2>Good to know</h2><ul class="lt">${g.tips.map(t => `<li>${esc(t)}</li>`).join('')}</ul></section>
  </article>`;
  $$('#lbody [data-ev]').forEach(b => b.onclick = () => { if (phase !== 'idle') return; drill = null; ev = b.dataset.ev; cur = null; go('timer'); renderEvents(); renderTools(); renderBand(); showAfter(false); setTime(0); newScramble(); });
}

/* ---------- case sheet ---------- */
function algHTML(tokens, k) {
  return tokens.map((t, i) => `<span class="${k === 0 ? '' : i < k - 1 ? 'd' : i === k - 1 ? 'cur' : 'u'}">${esc(disp(t))}</span>`).join(' ');
}
let CS = null;   // the case sheet's move player, so closing the sheet can stop it
function openCase(set, i) {
  if (CS) CS.halt();
  const c = DATA[set][i], meta = SETMETA[set], vk = meta.view, eng = !!c.svg && !vk, memo = {};
  const base = eng || vk ? null : Sim.run(Sim.deRotate(c.setup));
  let which = 0, tk = [], stage = null, hasTop = false;
  const view = k => { try { return Views.views(vk[0], vk[1], c.setup, tk.slice(0, k).join(' '), memo); } catch (e) { return { top: null, a: '', b: '' }; } };
  // the cube(s) turn on their own stage; if a puzzle's moves cannot be animated the pictures simply jump, as before
  const plainStage = () => ({
    count: vk ? (view(0).b ? 2 : 1) : 2, bind(list) { this.els = [...list]; }, finish() {}, cancel() {}, busy: () => false,
    show(p) { const [a, b] = vk ? [view(p).a, view(p).b] : (() => { const st = Sim.apply(base.map(x => ({ ...x })), Sim.parse(tk.slice(0, p).join(' '))); return [Draw.iso(st, { pal: Draw.LL }), Draw.iso(st, { pal: Draw.LL, view: 1 })]; })(); this.els.forEach((el, n) => { el.innerHTML = n ? b || '' : a; }); },
    walk(from, to) { this.show(to); return Promise.resolve(); }
  });
  const prep = () => {
    tk = toks(c.algs[which]); stage = null;
    if (eng) return;
    try {
      const [kind, v] = vk ? vk[0].split(':') : ['cube', '3'];
      let at, mk;
      if (kind === 'cube') {
        const memoSt = [base]; at = k => { while (memoSt.length <= k) memoSt.push(Sim.apply(memoSt[memoSt.length - 1].map(x => ({ ...x })), Sim.parse(tk[memoSt.length - 1]))); return memoSt[k]; };
        mk = () => Anim.stage({ N: 3, pal: Draw.LL, corners: [[1, 1, 1], [-1, -1, -1]], stateAt: at, tokenAt: j => tk[j], turns: t => Anim.fromSim(Sim, Sim.parse(t)) });
      } else if (kind === 'nxn') {
        const r = Views.nxnRig(+v, vk[1], c.setup);
        at = k => r.view(tk.slice(0, k).join(' '));
        mk = () => Anim.stage({ N: r.N, pal: Draw.LL, corners: r.corners, post: Anim.rotList(r.post), stateAt: at, tokenAt: j => tk[j], turns: t => Anim.fromNxN(r.sim, t) });
      } else {
        const r = Views.polyRig(v, c.setup);
        at = k => r.at(tk.slice(0, k).join(' '));
        mk = () => Anim.stage({ count: r.count, render: r.render, stateAt: at, tokenAt: j => tk[j], turns: t => Views.polyTurns(v, t) });
      }
      at(tk.length);   // every position of this algorithm can be built, or we fall back
      stage = mk();
    } catch (e) { stage = null; }
  };
  const render = k0 => {
    prep(); if (!eng && !stage) stage = plainStage();
    hasTop = !!vk && !!view(0).top;
    const two = !eng && stage.count > 1;
    $('#sheet').innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:22px">
        <div><h2>${esc(meta.name)} · ${esc(c.n)}</h2><div class="sub">${esc(c.g)}${c.nick ? ' · ' + esc(c.nick) : ''}</div></div>
        <button class="ic" id="x" aria-label="Close"><svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg></button></div>
      <div class="cs">
        <div class="cs-l">
          ${eng ? `<div class="top engpic">${c.svg}</div>` : vk ? (hasTop ? '<div class="top" id="cstop"></div>' : '') : (meta.mode === 'iso' ? '' : `<div class="top">${Draw.ll(base, meta.mode === 'oll' ? 'oll' : meta.mode === 'pll' ? 'pll' : 'coll')}</div>`)}
          ${eng ? '' : `<div class="three${two ? '' : ' one'}" id="cs3">${'<div class="ah"></div>'.repeat(two ? 2 : 1)}</div>`}
        </div>
        <div>
          <div class="alg" id="csalg"></div>
          ${eng ? '' : `<div class="stepper"><button class="ic" id="pb" aria-label="Previous move"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button>
            <button class="ic" id="pp" aria-label="Play">${PLAY_SVG}</button>
            <input type="range" id="sl" min="0" max="${tk.length}" value="0" aria-label="Step through the algorithm">
            <button class="ic" id="pn" aria-label="Next move"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button></div>`}
          ${c.algs.length > 1 ? `<div class="alts">${c.algs.map((a, j) => `<button data-j="${j}" class="${j === which ? 'on' : ''}">${esc(toks(a).map(disp).join(' '))}</button>`).join('')}</div>` : ''}
          <div class="row"><button class="btn" id="pr">Practice this case</button><button class="btn ghost" id="ln">${isLearned(set, i) ? 'Learned ✓' : 'Mark as learned'}</button></div>
        </div>
      </div>`;
    $('#x').onclick = closeModal;
    if (eng) { $('#csalg').innerHTML = algHTML(tk, 0); CS = null; }
    else {
      stage.bind($$('#cs3 .ah'));
      const tr = CS = track({ stage, len: tk.length,
        onPos: p => { $('#csalg').innerHTML = algHTML(tk, p); $('#sl').value = p; },
        afterMove: p => { if (hasTop) $('#cstop').innerHTML = view(p).top || ''; },   // the flat top view changes once the move has landed
        onPlay: on => setPlayIcon($('#pp'), on) });
      $('#sl').oninput = e => { tr.stop(); tr.set(+e.target.value, false); };
      $('#pb').onclick = () => { tr.stop(); tr.set(Math.max(0, tr.pos - 1), true); };
      $('#pn').onclick = () => { tr.stop(); tr.set(Math.min(tk.length, tr.pos + 1), true); };
      $('#pp').onclick = () => tr.play();
      tr.set(k0, false);
    }
    $$('.alts button').forEach(b => b.onclick = () => { which = +b.dataset.j; if (CS) CS.halt(); render(0); });
    $('#pr').onclick = () => startDrill(set, [i]);
    $('#ln').onclick = () => {
      const key = learnedKey(set, i), at = store.learned.indexOf(key);
      if (at < 0) store.learned.push(key); else store.learned.splice(at, 1);
      save(); $('#ln').textContent = isLearned(set, i) ? 'Learned ✓' : 'Mark as learned'; if (screen === 'train') { renderTrain(); }
    };
  };
  render(0); openModal();
}

/* ---------- modal ---------- */
function openModal() { $('#modal').classList.add('on'); }
function closeModal() { $('#modal').classList.remove('on'); if (CS) CS.halt(); }
$('#modal').onclick = e => { if (e.target.id === 'modal') closeModal(); };

const CLOSE = '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>';
const timeOf = d => new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
const dayOf = d => new Date(d).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

/* All solves: the times and nothing else, as capsules. Tap one to open that solve. */
function historyModal() {
  const list = mine().slice().reverse(), v = list.map(val).filter(Number.isFinite), best = v.length ? Math.min(...v) : null;
  $('#sheet').innerHTML = `<div class="sh-h"><div><h2>All solves</h2><div class="sub">${list.length} · ${esc(drill ? SETMETA[drill.set].name : ev)}</div></div><button class="ic" id="x" aria-label="Close">${CLOSE}</button></div>
    <div class="caps">${list.length ? list.map(s => `<button class="cap${val(s) === best ? ' pb' : ''}${s.pen === 'DNF' ? ' dn' : ''}" data-id="${s.id}">${label(s)}</button>`).join('') : '<div class="empty">No solves yet.</div>'}</div>`;
  $('#x').onclick = closeModal;
  $$('.caps .cap').forEach(b => b.onclick = () => openSolve(store.solves.find(s => s.id === b.dataset.id), true));
  openModal();
}

/* One solve: the time, when, the scramble and its picture, penalties, delete, and a way into the method review. */
function openSolve(s, fromList) {
  if (!s) return;
  if (s.kind === 'drill' && s.set != null) { closeModal(); ensureTrain().then(() => openCase(s.set, s.ci)); return; }
  const list = mine(), pos = list.findIndex(x => x.id === s.id), nth = pos + 1;
  const vals = list.map(val), ao5 = Stats.aoSeries(vals, 5)[pos], ao12 = Stats.aoSeries(vals, 12)[pos];
  const fin = vals.filter(Number.isFinite), rank = Number.isFinite(val(s)) ? fin.filter(x => x < val(s)).length + 1 : null;
  const was = Math.min(...vals.slice(0, Math.max(0, pos)).filter(Number.isFinite), Infinity), isPB = Number.isFinite(val(s)) && val(s) < was && pos > 0;
  const big = s.pen === 'DNF' ? 'DNF' : Stats.fmt(val(s));
  let pic = '';
  try {
    if (/^(333|333oh|333ni|333fm)$/.test(s.code || '') && window.Sim) pic = Draw.net(Sim.run(s.scr));
    else if (s.code) {
      const e = EVENTS.find(x => x[1] === s.code), N = e && ({ '2×2': 2, '4×4': 4, '5×5': 5, '6×6': 6, '7×7': 7 })[e[0]];
      if (N) pic = Views.full('nxn:' + N, s.scr, 0);
    }
  } catch (err) { pic = ''; }
  const can3 = is3(s);
  $('#sheet').innerHTML = `<div class="sh-h"><div><h2 class="big-t">${big}${s.pen === '2' ? '<sup class="p2">+2</sup>' : ''}</h2><div class="sub">${esc(s.ev)} · ${dayOf(s.date)}, ${timeOf(s.date)}${isPB ? ' · <span class="tagpb">New best</span>' : ''}</div></div><button class="ic" id="x" aria-label="Close">${CLOSE}</button></div>
    <div class="sv-grid">
      <div class="sv-l">
        <h6>Scramble</h6><div class="sv-scr">${esc(String(s.scr).replace(/\s+/g, ' ').split(' ').map(disp).join(' '))}</div>
        <div class="sv-facts">
          <div><span>Solve</span><b>#${nth} of ${list.length}</b></div>
          <div><span>Rank</span><b>${rank ? rank + ' of ' + fin.length : '—'}</b></div>
          <div><span>Ao5</span><b>${ao5 == null ? '—' : Stats.fmt(ao5)}</b></div>
          <div><span>Ao12</span><b>${ao12 == null ? '—' : Stats.fmt(ao12)}</b></div>
        </div>
        <div class="sv-pen" role="group" aria-label="Result"><button data-p="0" class="${s.pen === '0' ? 'on' : ''}">OK</button><button data-p="2" class="${s.pen === '2' ? 'on' : ''}">+2</button><button data-p="DNF" class="${s.pen === 'DNF' ? 'on' : ''}">DNF</button></div>
      </div>
      <div class="sv-r">${pic ? '<div class="sv-pic">' + pic + '</div><div class="sv-cap">Scrambled state</div>' : ''}</div>
    </div>
    <div class="sv-act">${can3 ? '<button class="btn" id="sv-rev">Review this solve ↗</button>' : '<span class="muted-note">Method review is available for 3×3 solves.</span>'}<button class="btn ghost" id="sv-copy">Copy scramble</button>${fromList ? '<button class="btn ghost" id="sv-back">All solves</button>' : ''}<button class="btn ghost danger" id="sv-del">Delete</button></div>`;
  $('#x').onclick = closeModal;
  $$('.sv-pen button').forEach(b => b.onclick = () => { s.pen = b.dataset.p; save(); if (last && last.id === s.id) { showTime(s); markPen(); } renderBand(); openSolve(s, fromList); });
  const rv = $('#sv-rev'); if (rv) rv.onclick = () => { closeModal(); go('review', s.id); };
  $('#sv-copy').onclick = e => { try { navigator.clipboard.writeText(s.scr); } catch (err) {} e.target.textContent = 'Copied'; };
  const bk = $('#sv-back'); if (bk) bk.onclick = historyModal;
  $('#sv-del').onclick = e => {
    if (e.target.dataset.sure !== '1') { e.target.dataset.sure = '1'; e.target.textContent = 'Delete this solve?'; return; }
    store.solves = store.solves.filter(x => x.id !== s.id); save();
    if (last && last.id === s.id) { last = null; showAfter(false); setTime(0); }
    renderBand(); fromList ? historyModal() : closeModal();
  };
  openModal();
}
// the three "hide" options are plain classes on <body>, so they apply to every screen at once and cost nothing
function applyView() {
  document.body.classList.toggle('no-scr', !store.showScr);
  document.body.classList.toggle('no-img', !store.showImg);
  document.body.classList.toggle('no-band', !store.showBand);
}
function renderWho() { const w = $('#who'); w.hidden = !store.name; w.textContent = store.name; w.title = 'Your name. Open settings to change it.'; }
$('#who').onclick = () => $('#settings').click();

$('#settings').onclick = () => {
  const row = (t, d, ctl) => `<div class="field"><div>${t}<small>${d}</small></div>${ctl}</div>`;
  const sw = (id, on) => `<button class="tgl" id="${id}" role="switch" aria-checked="${on}"><i></i></button>`;
  $('#sheet').innerHTML = `<div class="sh-h"><h2>Settings</h2><button class="ic" id="x" aria-label="Close">${CLOSE}</button></div>
    <div class="field name"><div>Your name<small>Used in comments, and saved on this device only</small></div><input class="find" id="nm" maxlength="24" placeholder="Your name" value="${esc(store.name)}" autocomplete="off" aria-label="Your name"></div>
    ${row('Show the scramble', 'Turn off to time without seeing the moves, for example when you only use your own scrambler', sw('s-scr', store.showScr))}
    ${row('Show the scramble picture', 'The unfolded puzzle beside the timer', sw('s-img', store.showImg))}
    ${row('Show the session bar', 'The solves, averages and recent times under the timer', sw('s-band', store.showBand))}
    ${row('Hide the time while solving', 'You see a small animation instead. The time appears when you stop.', sw('s-hide', store.hide))}
    ${row('Comments after a solve', 'A short line under the time, based on your history', sw('s-com', store.comments))}
    ${row('Stop animations', 'Colour pulse, confetti on a personal best', sw('s-fx', store.fx))}
    ${row('Hold to start', 'How long to hold space before the timer turns green', `<div class="seg" id="hold">${[[0, 'Instant'], [300, '0.3 s'], [500, '0.5 s']].map(([v, l]) => `<button data-v="${v}" class="${store.hold === v ? 'on' : ''}">${l}</button>`).join('')}</div>`)}
    ${row('Backup', 'Download every solve and your settings as a file', '<button class="btn ghost sm" id="exp">Export</button>')}
    ${row('Clear this session', 'Removes the solves for the current puzzle', '<button class="btn ghost sm" id="clr">Clear</button>')}`;
  $('#x').onclick = closeModal;
  const nm = $('#nm'); nm.oninput = () => { store.name = nm.value.trim(); save(); renderWho(); };
  const tg = (id, key, after) => { const b = $(id); b.onclick = () => { store[key] = !store[key]; save(); b.setAttribute('aria-checked', String(store[key])); if (after) after(); }; };
  tg('#s-hide', 'hide');  tg('#s-com', 'comments'); tg('#s-fx', 'fx'); tg('#s-scr', 'showScr', applyView); tg('#s-img', 'showImg', applyView); tg('#s-band', 'showBand', applyView);
  $$('#hold button').forEach(b => b.onclick = () => { store.hold = +b.dataset.v; save(); $$('#hold button').forEach(x => x.classList.toggle('on', x === b)); });
  $('#exp').onclick = () => { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([JSON.stringify(store, null, 1)], { type: 'application/json' })); a.download = 'cubic-backup.json'; a.click(); };
  $('#clr').onclick = e => { if (e.target.dataset.sure !== '1') { e.target.dataset.sure = '1'; e.target.textContent = 'Sure?'; return; } const b = bucket(); store.solves = store.solves.filter(s => s.b !== b); save(); last = null; showAfter(false); setTime(0); renderBand(); closeModal(); };
  openModal();
};

/* ---------- stats screen ---------- */
let stEv = null, stRange = 50, stView = 'chart';
// how many weeks fit across the card: each cell is 13px with a 3px gap, minus the weekday labels and card padding
function weeksFit() { const w = ($('#st-act').parentElement.clientWidth || 1000) - 36 - 31; return Math.max(16, Math.min(53, Math.floor(w / 16))); }
function renderStats() {
  const evs = EV.filter(e => store.solves.some(s => s.kind !== 'drill' && s.ev === e));
  const sel = $('#st-ev');
  if (!evs.length) {
    $('#st-title').textContent = store.name ? store.name + '’s stats' : 'Your stats';
    $('#st-sub').textContent = '';
    $('#st-f').hidden = true;
    $('#st-act').innerHTML = ''; $('#st-body').innerHTML = '<div class="blank st-empty"><div><h2>No solves yet</h2><p>Time a few solves and your progress shows up here: a line chart, your averages, and how much faster you are getting.</p><button class="btn" id="st-go">Go to the timer</button></div></div>';
    $('#st-go').onclick = () => go('timer'); return;
  }
  $('#st-f').hidden = false;
  Stats.activity($('#st-act'), Stats.countByDay(store.solves.filter(s => s.kind !== 'drill').map(s => s.date)), { weeks: weeksFit() });
  if (!stEv || !evs.includes(stEv)) stEv = evs.includes(ev) ? ev : evs[0];
  const countOf = e => store.solves.filter(s => s.kind !== 'drill' && s.ev === e).length;
  const total = evs.reduce((n, e) => n + countOf(e), 0);
  sel.innerHTML = evs.map(e => `<option value="${esc(e)}"${e === stEv ? ' selected' : ''}>${esc(e)}  ·  ${countOf(e)} solve${countOf(e) === 1 ? '' : 's'}</option>`).join('');
  $$('#st-range button').forEach(b => b.classList.toggle('on', +b.dataset.r === stRange));
  $$('#st-view button').forEach(b => b.classList.toggle('on', b.dataset.v === stView));

  const all = store.solves.filter(s => s.kind !== 'drill' && s.ev === stEv);
  const vAll = all.map(val), a5All = Stats.aoSeries(vAll, 5), a12All = Stats.aoSeries(vAll, 12);
  const from = stRange ? Math.max(0, all.length - stRange) : 0;
  const spec = { vals: vAll.slice(from), ao5: a5All.slice(from), ao12: a12All.slice(from), from, dates: all.slice(from).map(s => s.date) };
  const fin = spec.vals.filter(Number.isFinite); spec.mean = fin.length ? fin.reduce((a, b) => a + b, 0) / fin.length : null;
  const sm = Stats.summarize(vAll, a5All, a12All), win = Stats.summarize(spec.vals, spec.ao5, spec.ao12);
  const first = all[0] ? dayOf(all[0].date) : '';
  $('#st-title').textContent = (store.name ? store.name + '’s ' : 'Your ') + 'stats';
  $('#st-sub').textContent = `${esc2(stEv)} · ${all.length} solve${all.length === 1 ? '' : 's'}${first ? ' since ' + first : ''}${sm.dnf ? ' · ' + sm.dnf + ' DNF' : ''}`;

  const tile = (l, v, extra) => `<div class="tile"><span>${l}</span><b>${v}</b>${extra ? `<em class="${extra[0]}">${extra[1]}</em>` : ''}</div>`;
  let imp = '—', impX = null;
  if (sm.improve) {
    const d = sm.improve.delta / 1000, p = sm.improve.pct * 100, better = d < -0.005, worse = d > 0.005;
    imp = (better ? '−' : worse ? '+' : '') + Math.abs(d).toFixed(2) + 's';
    impX = [better ? 'up' : worse ? 'down' : 'flat', `${better ? '▼' : worse ? '▲' : '■'} ${Math.abs(p).toFixed(1)}% · last ${sm.improve.n} vs first ${sm.improve.n}`];
  }
  const dnfRate = sm.count ? Math.round((sm.dnf / sm.count) * 100) : 0;
  const hero = `<div class="hero"><span>Improvement</span><b class="${impX ? impX[0] : 'none'}">${impX ? imp : 'Not yet'}</b><em>${impX ? impX[1].replace(/^[▼▲■] /, '') : 'Needs six solves to compare'}</em></div>`;
  const today = new Date().toDateString(), todayN = all.filter(s => new Date(s.date).toDateString() === today).length, doneN = sm.count - sm.dnf;
  const byPuzzle = `<div class="bypz" role="group" aria-label="Solves by puzzle">${evs.map(e => `<button class="pz${e === stEv ? ' on' : ''}" data-e="${esc(e)}"><b>${countOf(e)}</b><span>${esc(e)}</span></button>`).join('')}<div class="pz tot"><b>${total}</b><span>All puzzles</span></div></div>`;
  const tiles = `<div class="tiles">${tile('Solves', sm.count, ['flat', doneN + ' finished' + (todayN ? ' · ' + todayN + ' today' : '')])}${tile('Best', Stats.fmt(sm.best))}${tile('Mean', Stats.fmt(sm.mean), sm.sd != null ? ['flat', '± ' + (sm.sd / 1000).toFixed(2) + 's'] : null)}${tile('Best Ao5', Stats.fmt(sm.bestAo5))}${tile('Best Ao12', Stats.fmt(sm.bestAo12))}${tile('Current Ao5', Stats.fmt(Stats.lastOf(a5All)))}${tile('Current Ao12', Stats.fmt(Stats.lastOf(a12All)))}${tile('Worst', Stats.fmt(sm.worst))}${tile('DNFs', sm.dnf, sm.dnf ? ['flat', dnfRate + '% of solves'] : null)}</div>`;

  const chartHead = `<div class="ch-h"><h2>Progress</h2><div class="legend"><span><i class="key solve"></i>Solve</span><span><i class="key ao5"></i>Ao5 <b>${Stats.fmt(Stats.lastOf(spec.ao5))}</b></span><span><i class="key ao12"></i>Ao12 <b>${Stats.fmt(Stats.lastOf(spec.ao12))}</b></span><span><i class="key mean"></i>Mean <b>${Stats.fmt(spec.mean)}</b></span></div></div>`;
  $('#st-body').innerHTML = byPuzzle + hero + tiles + `<div class="chart-card">${chartHead}<div id="ch"></div><p class="ch-note">${stRange && all.length > stRange ? 'Showing your last ' + stRange + ' solves.' : 'Showing all ' + all.length + ' solves.'} Lower is faster. Hover the chart, or use the arrow keys on it.</p></div>`;
  if (stView === 'table') Stats.table($('#ch'), spec); else Stats.lineChart($('#ch'), spec);
  $$('#st-body .bypz .pz[data-e]').forEach(b => b.onclick = () => { stEv = b.dataset.e; renderStats(); });
}
const esc2 = esc;
$('#st-ev').onchange = e => { stEv = e.target.value; renderStats(); };
$$('#st-range button').forEach(b => b.onclick = () => { stRange = +b.dataset.r; renderStats(); });
$$('#st-view button').forEach(b => b.onclick = () => { stView = b.dataset.v; renderStats(); });

/* ---------- review ---------- */
const METHODS = [['cfop', 'CFOP'], ['roux', 'Roux'], ['zz', 'ZZ'], ['two-phase', 'Two-phase']];
const NICE = { 'F2L-1': 'F2L 1', 'F2L-2': 'F2L 2', 'F2L-3': 'F2L 3', 'F2L-4': 'F2L 4', 'PLL + AUF': 'PLL', 'Step 1': 'First block', 'Step 2': 'Second block', 'Corners': 'CMLL', 'Last six edges': 'LSE', 'ZZF2L1': 'F2L · block 1', 'ZZF2L2': 'F2L · block 2', 'Complete solution': 'Solution' };
const NOTE = {
  cfop: 'Each stage is searched for its fewest moves; OLL and PLL come from the algorithm library. The whole solve is checked against your scramble.',
  roux: 'Both blocks are searched for their fewest moves, then CMLL from the library and the last six edges with M and U turns.',
  zz: 'EOLine and both F2L blocks are searched for their fewest moves, then OLL and PLL from the library.',
  'two-phase': 'Ignores method and finds a very short solution. Great for learning what is possible, hard to execute by hand.'
};
let R = null, method = 'cfop', solver = null, solveJob = 0;
const solved = new Map();   // "scramble|method" -> result, so switching tabs is instant
const is3 = s => s && /^(333|333oh|333ni|333fm|333ft)$/.test(s.code || '') ;
function solveWith(scramble, m) {
  const key = scramble + '|' + m;
  if (solved.has(key)) return Promise.resolve(solved.get(key));
  return new Promise(res => {
    if (solver) solver.terminate();
    solver = mkWorker(ENGINE_SRC + REVIEW_EXTRA);
    const done = r => { clearTimeout(t); if (solver) { solver.terminate(); solver = null; } res(r); };
    const t = setTimeout(() => done({ error: 'This search took too long.' }), 70000);
    solver.onmessage = e => { if (e.data.progress) return; done(e.data); };
    solver.onerror = () => done({ error: 'The solver could not start.' });
    solver.postMessage({ method: m, scramble, sets: ALGSETS });
  });
}
function orient(m, scramble) {   // white-on-bottom: solve the colour-swapped cube, then turn it over
  const flip = x => x.replace(/[UDRL]/g, c => ({ U: 'D', D: 'U', R: 'L', L: 'R' })[c]);
  return m === 'two-phase' ? { z: false, scr: scramble } : { z: true, scr: flip(scramble) };
}
function blank(html) { $('#rev').innerHTML = `<div class="blank" style="grid-column:1/-1"><div>${html}</div></div>`; }
async function renderReview() {
  stopPlay(); if (R) R.stage.cancel(); R = null;
  let s = store.solves.find(x => x.id === reviewId);
  if (!s) { s = store.solves.slice().reverse().find(x => x.kind !== 'drill' && is3(x)); if (s) reviewId = s.id; }
  if (!s) return blank('<h1 style="font-weight:500;font-size:28px;margin-bottom:8px">Nothing to review yet</h1><p>Finish a 3×3 solve, then open it here.</p>');
  if (!is3(s)) return blank(`<h1 style="font-weight:300;font-size:64px;letter-spacing:-.045em">${label(s)}</h1><p style="margin-top:12px">Method review is available for 3×3 solves.<br>${esc(s.ev)} solves keep their scramble and time.</p>`);
  const base = Sim.faceOnly(s.scr);   // same cube with its centres at home
  const job = ++solveJob, o = orient(method, base);
  if (!solved.has(base + '|' + method)) {
    blank(`<div class="spin"></div><p style="margin-top:18px">Finding a ${esc((METHODS.find(m => m[0] === method) || [])[1] || '')} solution…</p>`);
  }
  const r = await solveWith(o.scr, method);
  if (job !== solveJob || screen !== 'review') return;
  if (r.error || !r.verified) {
    return blank(`<h1 style="font-weight:500;font-size:24px;margin-bottom:10px">No ${esc(method.toUpperCase())} solution found</h1><p style="max-width:380px;margin:0 auto 20px">${esc(r.error || 'The solution could not be verified.')}</p><div class="row" style="justify-content:center"><button class="btn" data-m="two-phase">Try two-phase</button><button class="btn ghost" data-m="cfop">Back to CFOP</button></div>`) || $$('#rev [data-m]').forEach(b => b.onclick = () => { method = b.dataset.m; renderReview(); });
  }
  // never show a solution we have not checked ourselves
  const all = r.steps.map(x => x.moves).join(' ');
  if (!Sim.isSolved(Sim.run(base + (o.z ? ' z2 ' : ' ') + all))) return blank('<h1 style="font-weight:500;font-size:24px">Could not verify this solution</h1><p>It was not shown.</p>');
  solved.set(base + '|' + method, r);
  drawReview(s, r, o.z, base);
}
function drawReview(s, run, z, base) {
  const el = $('#rev');
  const tokens = []; run.steps.forEach((st, si) => rtoks(st.moves).forEach(t => tokens.push({ t, si })));
  const prefix = (base || s.scr) + (z ? ' z2' : ''), states = [Sim.run(prefix)];
  tokens.forEach(x => states.push(Sim.apply(states[states.length - 1].map(q => ({ ...q })), Sim.parse(x.t))));   // every position is known up front
  const stage = Anim.stage({ N: 3, pal: Draw.P, corners: [[1, 1, 1], [-1, -1, -1]], stateAt: k => states[k], tokenAt: i => tokens[i].t, turns: t => Anim.fromSim(Sim, Sim.parse(t)) });
  R = { s, run, tokens, pos: 0, prefix, stage };
  R.tr = track({ stage, len: tokens.length, onPos: p => markPos(p), onPlay: on => setPlayIcon($('#play'), on) });
  const ms = val(s), moves = run.count;
  const counts = Object.fromEntries(METHODS.map(([k]) => [k, solved.get((base || s.scr) + '|' + k)]));
  el.innerHTML = `
    <div class="rv-l">
      <div class="rv-h"><h1>${label(s)}</h1><span>${esc(s.ev)} · ${new Date(s.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
      <div class="rv-sc">${esc(s.scr.split(/\s+/).map(disp).join(' '))}</div>
      <div class="seg meths" id="meths">${METHODS.map(([k, l]) => `<button data-m="${k}" class="${k === method ? 'on' : ''}">${l}${counts[k] && counts[k].count ? `<em>${counts[k].count}</em>` : ''}</button>`).join('')}</div>
      <p class="note">${NOTE[method]}</p>
      <div class="stages" id="stages">${(() => { let o = 0; return run.steps.map((st, si) => { const tk = rtoks(st.moves), base = o; o += tk.length; return `<div class="stg" data-si="${si}"><span class="nm">${esc(NICE[st.name] || st.name)}</span><span class="mv">${tk.map((t, j) => `<span data-i="${base + j}">${esc(disp(t))}</span>`).join(' ')}</span><span class="ct">${st.count || 0}</span></div>`; }).join(''); })()}</div>
    </div>
    <div class="rv-r">
      <div class="cubes"><figure><div id="c0"></div><figcaption>Front</figcaption></figure><figure><div id="c1"></div><figcaption>Back</figcaption></figure></div>
      <div class="player"><button class="ic" id="rp" aria-label="Previous move"><svg viewBox="0 0 24 24"><path d="m15 6-6 6 6 6"/></svg></button>
        <button class="ic" id="play" aria-label="Play"><svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg></button>
        <input type="range" id="rs" min="0" max="${tokens.length}" value="0" aria-label="Solution move">
        <button class="ic" id="rn" aria-label="Next move"><svg viewBox="0 0 24 24"><path d="m9 6 6 6-6 6"/></svg></button><span class="pos" id="pos"></span></div>
      <div class="facts"><div><b>${moves}</b><span>moves</span></div><div><b>${ms === Infinity ? '—' : (moves / (ms / 1000)).toFixed(1)}</b><span>turns/s at your time</span></div></div>
    </div>`;
  $$('#meths button').forEach(b => b.onclick = () => { method = b.dataset.m; renderReview(); });
  $$('.stg').forEach(r => r.onclick = () => { const si = +r.dataset.si; let end = 0; tokens.forEach((x, i) => { if (x.si <= si) end = i + 1; }); setPos(end); });
  $('#rs').oninput = e => setPos(+e.target.value);
  $('#rn').onclick = () => stepBy(1); $('#rp').onclick = () => stepBy(-1);
  $('#play').onclick = () => R.tr.play();
  stage.bind([$('#c0'), $('#c1')]);
  setPos(0);
}
function stepBy(d) {
  if (!R) return;
  let p = R.pos + d;
  while (p > 0 && p < R.tokens.length && isRot(R.tokens[p - 1].t) && d > 0) p += d;
  R.tr.stop(); R.tr.set(Math.max(0, Math.min(R.tokens.length, p)), true);   // one move (or a turn of the whole cube and the move after it): animated
}
function setPos(p) { if (!R) return; R.tr.stop(); R.tr.set(p, false); }   // the slider and the stage list jump straight there
function markPos(p) {
  R.pos = p;
  $('#rs').value = p;
  const done = R.tokens.slice(0, p).filter(x => !isRot(x.t)).length, total = R.tokens.filter(x => !isRot(x.t)).length;
  $('#pos').textContent = done + ' / ' + total;
  $$('#stages .mv span').forEach(sp => { const i = +sp.dataset.i; sp.className = i < p - 1 ? 'done' : i === p - 1 ? 'cur' : ''; });
  const cur = p ? R.tokens[p - 1].si : -1;
  $$('.stg').forEach(r => r.classList.toggle('act', +r.dataset.si === cur));
}
const stopPlay = () => { if (R) R.tr.stop(); };

/* ---------- boot ---------- */
applyView(); renderWho(); renderEvents(); renderTools(); renderBand(); setTime(0); showAfter(false); newScramble();
$$('#wca button').forEach(b => b.onclick = () => { if (b.disabled || phase !== 'idle') return; const w = b.dataset.w === '1'; if (w === store.wca) return; store.wca = w; save(); cur = null; renderTools(); newScramble(); });
$('#tbtn').onclick = e => { e.stopPropagation(); const open = !menuOpen(); $('#pop').hidden = !open; $('#tbtn').setAttribute('aria-expanded', String(open)); if (open) { const s = $('#pop [aria-selected=true]'); if (s) s.scrollIntoView({ block: 'nearest' }); } };
document.addEventListener('pointerdown', e => { if (menuOpen() && !e.target.closest('#tmenu')) closeMenu(); });
const h = location.hash.slice(1); if (['train', 'review'].includes(h)) go(h);
window.__cubic = { setTime, showTime, go, openSolve, historyModal, openCase, startDrill, get state() { return { phase, drill, ev, screen, scr: curScr(), type: curType(), wca: store.wca }; } };
})();
