// Train: Browse / Practice (tick-to-select), nicknames, the round-robin drill, and "drill times stay out of the stats".
const { spawn } = require('child_process');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9803;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=C:/Projects/Cubetimer/tools/.work/l11-' + Date.now(), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, x) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '   ' + (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 180) : '')); };
(async () => {
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (t.find(x => x.type === 'page')) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const p = new Map(), errs = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description?.slice(0, 200) || d.params.exceptionDetails.text); };
  const call = (m, a = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: a })); });
  const ev = async x => { const r = await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.result.exceptionDetails ? 'ERR ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) : r.result.result.value; };
  const key = (ty, k, c, v) => call('Input.dispatchKeyEvent', { type: ty, key: k, code: c, windowsVirtualKeyCode: v, text: k === ' ' ? ' ' : undefined });
  const phase = async (w, ms = 3000) => { for (let i = 0; i < ms / 25; i++) { if ((await ev('__cubic.state.phase')) === w) return true; await sleep(25); } return false; };
  const ready = async () => { for (let i = 0; i < 400 && (await ev('typeof __cubic')) !== 'object'; i++) await sleep(50); for (let i = 0; i < 400 && !(await ev('__cubic.state.scr')); i++) await sleep(50); await sleep(200); };
  const shot = async n => { const r = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('C:/Projects/Cubetimer/tools/.work/' + n + '.png', Buffer.from(r.result.data, 'base64')); };
  const store = () => ev(`JSON.parse(localStorage.getItem('cubic-v1'))`);
  const n = sel => ev(`document.querySelectorAll(${JSON.stringify(sel)}).length`);
  const click = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click()`);
  const clickNth = (sel, i) => ev(`document.querySelectorAll(${JSON.stringify(sel)})[${i}].click()`);
  const openTrain = async set => {
    await ev(`__cubic.go('train')`);
    for (let i = 0; i < 200 && !(await ev(`!!document.querySelector('#side [data-s="${set}"]')`)); i++) await sleep(50);
    await click(`#side [data-s="${set}"]`); await sleep(250);
  };
  const solve = async () => { await key('keyDown', ' ', 'Space', 32); await phase('ready'); await key('keyUp', ' ', 'Space', 32); await phase('running'); await sleep(250); await key('keyDown', 'a', 'KeyA', 65); await key('keyUp', 'a', 'KeyA', 65); await phase('idle'); await sleep(200); };

  await call('Runtime.enable'); await call('Page.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' }); await ready();

  console.log('--- Browse mode is unchanged');
  await openTrain('oll');
  check('browse: selection bar hidden, button says Practice all', (await ev(`document.querySelector('#selbar').hidden`)) && (await ev(`document.querySelector('#drill-all').textContent`)) === 'Practice all');
  check('every OLL card shows its nickname', (await n('#cases .case small')) === 57, await n('#cases .case small'));
  await clickNth('#cases .case', 0); await sleep(250);
  check('a card still opens its sheet, which names the case', await ev(`document.querySelector('#sheet .sub').textContent.includes('Blank')`), await ev(`document.querySelector('#sheet .sub').textContent`));
  await click('#x'); await sleep(150);

  console.log('--- Practice mode: select and train');
  await click('#tmode [data-m="1"]'); await sleep(250);
  check('selection bar appears, nothing ticked, Train disabled', !(await ev(`document.querySelector('#selbar').hidden`)) && (await ev(`document.querySelector('#drill-all').disabled`)) && (await ev(`document.querySelector('#sel-n').textContent`)) === '0');
  await clickNth('#cases .case', 2); await sleep(100);
  await clickNth('#cases .case', 5); await sleep(100);
  check('tapping a card ticks it and does not open it', (await n('#cases .case.sel')) === 2 && !(await ev(`document.querySelector('#modal').classList.contains('on')`)));
  check('count and button follow', (await ev(`document.querySelector('#sel-n').textContent`)) === '2' && (await ev(`document.querySelector('#drill-all').textContent`)) === 'Train 2 cases');
  await click('#cases [data-pg]'); await sleep(120);
  const g1 = await ev(`document.querySelector('#cases [data-pg]').dataset.pg.split(',').length`);
  check('Select group ticks the whole group', (await n('#cases .case.sel')) >= g1, g1 + ' in group, ' + (await n('#cases .case.sel')) + ' ticked');
  await click('#selbar [data-sel="none"]'); await sleep(100);
  check('Clear unticks everything', (await n('#cases .case.sel')) === 0);
  await click('#selbar [data-sel="all"]'); await sleep(100);
  check('Select all ticks all 57', (await n('#cases .case.sel')) === 57, await n('#cases .case.sel'));
  await click('#selbar [data-sel="none"]'); await sleep(100);
  await ev(`document.querySelector('#find').value='sune';document.querySelector('#find').dispatchEvent(new Event('input'))`); await sleep(200);
  const found = await n('#cases .case');
  await click('#selbar [data-sel="all"]'); await sleep(100);
  check('search by nickname finds cases; Select shown ticks only those', found >= 2 && found < 57 && (await n('#cases .case.sel')) === found, found + ' found');
  await ev(`document.querySelector('#find').value='';document.querySelector('#find').dispatchEvent(new Event('input'))`); await sleep(200);
  check('clearing the search keeps the ticks', (await n('#cases .case.sel')) === found);
  const saved = (await store()).pick.oll;
  check('selection is saved for this set', Array.isArray(saved) && saved.length === found, saved && saved.length);
  await call('Page.reload'); await ready();
  await openTrain('oll');
  check('after a reload, Practice mode and the ticks are still there', (await ev(`document.querySelector('#tmode [data-m="1"]').getAttribute('aria-checked')`)) === 'true' && (await n('#cases .case.sel')) === found);
  await ev(`document.querySelector('#cases .case .inf').click()`); await sleep(250);
  check('the small i opens the case sheet instead of ticking', await ev(`document.querySelector('#modal').classList.contains('on')`));
  await click('#x'); await sleep(150);

  console.log('--- the drill');
  await click('#selbar [data-sel="none"]'); await sleep(80);
  for (const i of [0, 7, 20]) await clickNth('#cases .case', i);
  await sleep(120);
  await shot('t-pick');
  await click('#drill-all'); await sleep(500);
  const bar = await ev(`document.querySelector('.drill')?.textContent || ''`);
  check('Train opens the timer with the case picture', (await ev(`__cubic.state.screen`)) === 'timer' && (await n('#end-drill')) === 1 && (await ev(`document.querySelector('#net svg')!==null`)));
  check('bar shows "3 cases" and "Not in stats"', bar.includes('3 cases') && bar.includes('Not in stats'), bar);
  const seen = [];
  for (let i = 0; i < 6; i++) { seen.push(await ev(`__cubic.state.drill.cur.name`)); await solve(); }
  check('each round shows every ticked case exactly once', new Set(seen.slice(0, 3)).size === 3 && new Set(seen.slice(3)).size === 3, seen.join(' | '));
  check('never the same case twice in a row', seen.every((c, i) => i === 0 || c !== seen[i - 1]));
  const s = await store();
  check('6 drill times saved, each flagged as a drill', s.solves.length === 6 && s.solves.every(x => x.kind === 'drill'), s.solves.map(x => x.kind).join());
  await ev(`__cubic.go('stats')`); await sleep(400);
  check('they stay out of the stats page', (await ev(`document.querySelector('#st-body').textContent`)).includes('No solves yet'), await ev(`document.querySelector('#st-body').textContent.slice(0, 50)`));
  await ev(`__cubic.go('timer')`); await sleep(300);

  console.log('--- Change cases goes back to the selection');
  await click('#chg-drill'); await sleep(500);
  check('back on Train in Practice mode with the 3 ticks kept', (await ev(`__cubic.state.screen`)) === 'train' && (await n('#cases .case.sel')) === 3);

  console.log('--- every set can be ticked and trained');
  await ev(`__cubic.go('timer')`); await sleep(200); await ev(`document.querySelector('#end-drill') && document.querySelector('#end-drill').click()`);
  const sets = await ev(`[...document.querySelectorAll('#side button')].map(b=>b.dataset.s)`);
  const bad = [];
  for (const sid of sets) {
    await openTrain(sid);
    const total = await n('#cases .case'), want = Math.min(total, 3);
    await click('#selbar [data-sel="none"]');
    for (let i = 0; i < want; i++) await clickNth('#cases .case', i);
    await sleep(60);
    const ticked = await n('#cases .case.sel');
    await click('#drill-all'); await sleep(280);
    const ok = await ev(`(()=>{const d=__cubic.state.drill;return !!d&&!!d.cur&&document.querySelector('#net').innerHTML.length>200&&!!document.querySelector('#scr').textContent.trim()})()`);
    if (!ok || ticked !== want) bad.push(sid + ':' + ok + '/' + ticked + 'of' + want);
    await ev(`document.querySelector('#end-drill') && document.querySelector('#end-drill').click()`); await sleep(60);
  }
  check('all ' + sets.length + ' sets: tick cases, Train, a case and its picture appear', bad.length === 0, bad);
  console.log('JS errors:', errs.length ? errs : 'none'); check('no JavaScript errors', errs.length === 0, errs);
  console.log(fails ? fails + ' FAILED' : 'all checks passed'); ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
