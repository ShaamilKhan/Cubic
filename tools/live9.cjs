// Display settings (hide scramble / picture / session bar), persistence, the timer with everything hidden, and a 3BLD method review.
const { spawn } = require('child_process');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9801;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=C:/Projects/Cubetimer/tools/.work/l10-' + Date.now(), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
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
  const vis = sel => ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return 'none';const s=getComputedStyle(e),b=e.getBoundingClientRect();return s.display==='none'?'display-none':s.visibility==='hidden'?'hidden':'shown'})()`);
  const solve = async () => { await key('keyDown', ' ', 'Space', 32); await phase('ready'); await key('keyUp', ' ', 'Space', 32); await phase('running'); await sleep(450); await key('keyDown', 'a', 'KeyA', 65); await key('keyUp', 'a', 'KeyA', 65); await phase('idle'); await sleep(300); };
  await call('Runtime.enable'); await call('Page.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' }); await ready();

  console.log('--- defaults');
  check('scramble, picture and session bar are all shown at first', (await vis('#scr')) === 'shown' && (await vis('#net')) === 'shown' && (await vis('.band')) === 'shown');
  await ev(`document.querySelector('#settings').click()`); await sleep(250);
  check('settings has the three new switches, all on', await ev(`['s-scr','s-img','s-band'].every(i=>document.getElementById(i)?.getAttribute('aria-checked')==='true')`));

  console.log('--- each switch hides only its own part');
  await ev(`document.getElementById('s-img').click()`); await sleep(150);
  check('picture off: picture hidden', (await vis('#net')) === 'display-none' || (await vis('.net')) === 'display-none', await vis('.net'));
  check('  scramble and session bar untouched', (await vis('#scr')) === 'shown' && (await vis('.band')) === 'shown');
  await ev(`document.getElementById('s-img').click()`); await sleep(100);
  await ev(`document.getElementById('s-band').click()`); await sleep(150);
  check('session bar off: bar gone', (await vis('.band')) === 'display-none');
  check('  scramble and picture untouched', (await vis('#scr')) === 'shown' && (await vis('.net')) === 'shown');
  await ev(`document.getElementById('s-band').click()`); await sleep(100);
  await ev(`document.getElementById('s-scr').click()`); await sleep(150);
  check('scramble off: moves hidden', (await vis('#scr')) === 'display-none');
  check('  picture and session bar untouched', (await vis('.net')) === 'shown' && (await vis('.band')) === 'shown');
  check('  but a scramble still exists underneath, so the timer works', !!(await ev('__cubic.state.scr')));

  console.log('--- everything hidden, timer still works, choices survive a reload');
  await ev(`document.getElementById('s-img').click();document.getElementById('s-band').click()`); await sleep(150);
  check('all three off', (await ev(`document.body.className`)).includes('no-scr') && (await ev(`document.body.className`)).includes('no-img') && (await ev(`document.body.className`)).includes('no-band'), await ev('document.body.className'));
  await key('keyDown', 'Escape', 'Escape', 27); await key('keyUp', 'Escape', 'Escape', 27); await sleep(250);
  const mid = await ev('(()=>{const r=document.querySelector("#t").getBoundingClientRect();return [Math.round(r.left+r.width/2-innerWidth/2),Math.round(r.top+r.height/2-innerHeight/2)]})()');
  check('timer is centred horizontally with everything hidden', Math.abs(mid[0])<=2, mid);
  check('timer is near the vertical middle too', Math.abs(mid[1])<=80, mid);
  await solve();
  check('a solve is timed and saved with everything hidden', /^\d+\.\d\d$/.test(await ev(`document.querySelector('#t').textContent`)) && (await ev(`JSON.parse(localStorage.getItem('cubic-v1')).solves.length`)) === 1);
  check('  the comment and buttons still appear', (await ev(`document.querySelector('#quip').textContent.length`)) > 5 && (await vis('#after')) === 'shown');
  const saved = await ev(`JSON.stringify(['showScr','showImg','showBand'].map(k=>JSON.parse(localStorage.getItem('cubic-v1'))[k]))`);
  check('choices are saved', saved === '[false,false,false]', saved);
  await call('Page.reload'); await ready();
  check('after a reload they are still off', (await vis('#scr')) === 'display-none' && (await vis('.band')) === 'display-none', await ev('document.body.className'));
  check('  and the solve is still there (stats band hidden but data kept)', Number(await ev(`document.querySelector('#sn').textContent`)) === 1);
  await ev(`document.querySelector('#settings').click()`); await sleep(250);
  check('  and the switches show their saved state', await ev(`['s-scr','s-img','s-band'].every(i=>document.getElementById(i).getAttribute('aria-checked')==='false')`));
  await ev(`document.getElementById('s-scr').click();document.getElementById('s-img').click();document.getElementById('s-band').click()`); await sleep(150);
  check('turning them back on restores everything', (await vis('#scr')) === 'shown' && (await vis('.net')) === 'shown' && (await vis('.band')) === 'shown');
  await key('keyDown', 'Escape', 'Escape', 27); await key('keyUp', 'Escape', 'Escape', 27); await sleep(200);

  console.log('--- an older save with none of these fields shows everything');
  await ev(`localStorage.setItem('cubic-v1', JSON.stringify({solves:[],learned:[],hold:300,name:'Old',hide:false,comments:true,fx:true,wca:true,variant:{}}))`);
  await call('Page.reload'); await ready();
  check('missing fields default to shown', (await vis('#scr')) === 'shown' && (await vis('.net')) === 'shown' && (await vis('.band')) === 'shown');

  console.log('--- 3BLD method review (scramble ends in a wide move)');
  await ev(`localStorage.removeItem('cubic-v1')`); await call('Page.reload'); await ready();
  await ev(`[...document.querySelectorAll('#events .chip')].find(c=>c.textContent==='3BLD').click()`);
  for (let i = 0; i < 300 && !(await ev(`__cubic.state.ev==='3BLD'&&!!__cubic.state.scr`)); i++) await sleep(50);
  const scr = await ev('__cubic.state.scr');
  check('3BLD scramble uses wide moves', /[RUFLDB]w/.test(scr), scr.slice(0, 70));
  await solve();
  await ev(`document.querySelector('#rv-last').click()`); await sleep(450);
  check('the solve sheet offers a review for 3BLD', await ev(`!!document.querySelector('#sv-rev')`));
  await ev(`document.querySelector('#sv-rev').click()`);
  for (let i = 0; i < 400 && !(await ev(`!!document.querySelector('#stages .stg')`)); i++) await sleep(100);
  check('CFOP review of a 3BLD solve works', (await ev(`document.querySelectorAll('#stages .stg').length`)) >= 5, await ev(`document.querySelectorAll('#stages .stg').length + ' stages'`));
  for (const m of ['roux', 'zz', 'two-phase']) {
    await ev(`document.querySelector('#meths [data-m=${m}]').click()`);
    let ok = false; for (let i = 0; i < 400; i++) { if (await ev(`document.querySelector('#meths .on')?.dataset.m==='${m}'&&!!document.querySelector('#stages .stg')`)) { ok = true; break; } await sleep(100); }
    check('  ' + m + ' review of a 3BLD solve', ok);
  }
  console.log('\nJS errors:', errs.length ? errs : 'none'); check('no JavaScript errors', errs.length === 0, errs);
  console.log(fails ? '\n' + fails + ' CHECK(S) FAILED' : '\nall checks passed');
  ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
