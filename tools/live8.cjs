// Whole-app sweep: every tab, every Train set, every Learn guide, practice drills, the method review worker, settings, errors.
const { spawn } = require('child_process'), fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9501;
const W = 'C:/Projects/Cubetimer/tools/.work/';
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=' + W + 'l9-' + Date.now(), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '   ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)).slice(0, 200) : '')); };
(async () => {
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (t.find(x => x.type === 'page')) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const p = new Map(), errs = [], reqs = [];
  ws.onmessage = e => {
    const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); }
    if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text);
    if (d.method === 'Runtime.consoleAPICalled' && d.params.type === 'error') errs.push('console.error ' + d.params.args.map(a => a.value || a.description).join(' ').slice(0, 160));
    if (d.method === 'Network.requestWillBeSent') reqs.push(d.params.request.url.replace(/^.*\/app\//, ''));
    if (d.method === 'Network.loadingFailed' && !/fonts\.g/.test(d.params.requestId + '')) reqs.push('FAILED ' + (d.params.errorText || ''));
  };
  const call = (m, a = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: a })); });
  const ev = async x => { const r = await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return 'ERR ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result.result.value; };
  const key = (ty, k, c, v) => call('Input.dispatchKeyEvent', { type: ty, key: k, code: c, windowsVirtualKeyCode: v, text: k === ' ' ? ' ' : undefined });
  const waitPhase = async (want, ms = 3000) => { for (let i = 0; i < ms / 25; i++) { if ((await ev('__cubic.state.phase')) === want) return true; await sleep(25); } return false; };
  const realSolve = async (runMs = 600) => { await key('keyDown', ' ', 'Space', 32); const green = await waitPhase('ready'); await key('keyUp', ' ', 'Space', 32); const run = await waitPhase('running'); await sleep(runMs); await key('keyDown', 'a', 'KeyA', 65); await key('keyUp', 'a', 'KeyA', 65); const done = await waitPhase('idle'); await sleep(300); return { green, run, done, phase: await ev('__cubic.state.phase') }; };
  await call('Runtime.enable'); await call('Page.enable'); await call('Network.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  const t0 = Date.now();
  await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' });
  for (let i = 0; i < 300 && (await ev('typeof __cubic')) !== 'object'; i++) await sleep(50);
  const tReady = Date.now() - t0;
  for (let i = 0; i < 300 && !(await ev('__cubic.state.scr')); i++) await sleep(50);
  const tScr = Date.now() - t0;
  check('app is interactive quickly', tReady < 4000, tReady + ' ms (first scramble ' + tScr + ' ms)');
  check('the 3.3 MB training library is NOT loaded at startup', !reqs.some(r => /train-data/.test(r)) && !reqs.some(r => /learn-pics/.test(r)), reqs.filter(r => /\.js$/.test(r)).join(' '));

  console.log('--- Train loads on demand');
  await ev(`__cubic.go('train')`);
  for (let i = 0; i < 200 && !(await ev(`document.querySelectorAll('#cases .case').length`)); i++) await sleep(100);
  check('opening Train loads the library and shows cases', (await ev(`document.querySelectorAll('#cases .case').length`)) > 20 && reqs.some(r => /train-data/.test(r)));
  const ids = await ev(`[...document.querySelectorAll('#side button')].map(b=>b.dataset.s)`);
  check('Train lists every set (38 data sets; the 7 ZBLL subsets share one entry = 32)', ids.length === 32, ids.length);
  const bad = [];
  for (const sid of ids) {
    await ev(`document.querySelector('#side [data-s="${sid}"]').click()`); await sleep(40);
    const r = await ev(`(()=>{const cs=[...document.querySelectorAll('#cases .case')];return {n:cs.length,empty:cs.filter(c=>{const s=c.querySelector('svg');return !s||s.getBoundingClientRect().width<20||s.querySelectorAll('*').length<4}).length}})()`);
    if (!r.n || r.empty) bad.push(sid + JSON.stringify(r));
  }
  check('every Train set draws a picture for every case', bad.length === 0, bad.length ? bad : ids.length + ' sets');
  // open a case in each of a sample of sets, step it, practise it
  const sample = ['f2l', 'oll', 'pll', 'zbll', 'cll', 'l4e', 'sarah', 'megaminx-co', 'megaminx-cp', 'parity-444', 'l2e-555', 'sq1ep', 'eg-1'].filter(s => ids.includes(s));
  const caseBad = [];
  for (const sid of sample) {
    await ev(`document.querySelector('#side [data-s="${sid}"]').click()`); await sleep(120);
    await ev(`document.querySelector('#cases .case').click()`); await sleep(160);
    const ok = await ev(`!!document.querySelector('#sheet .alg') && document.querySelector('#modal').classList.contains('on')`);
    await ev(`document.querySelector('#pn') && (document.querySelector('#pn').click(),document.querySelector('#pn').click())`);
    await ev(`document.querySelector('#pr') && document.querySelector('#pr').click()`); await sleep(220);
    const drilling = await ev(`!!document.querySelector('#end-drill') && !!document.querySelector('#net svg')`);
    if (!ok || !drilling) caseBad.push(sid + ':' + ok + '/' + drilling);
    await ev(`document.querySelector('#end-drill') && document.querySelector('#end-drill').click()`); await sleep(80);
    await ev(`__cubic.go('train')`); await sleep(120);
  }
  check('open a case, step through it, practise it, in ' + sample.length + ' sets', caseBad.length === 0, caseBad);

  console.log('--- Learn loads its pictures on demand');
  await ev(`__cubic.go('learn')`);
  for (let i = 0; i < 100 && !(await ev(`!!window.LPIC`)); i++) await sleep(100);
  const names = await ev(`[...document.querySelectorAll('#lside button')].map(b=>b.dataset.l)`);
  const lbad = [];
  for (const n of names) {
    await ev(`document.querySelector('#lside [data-l="${n}"]').click()`); await sleep(100);
    const r = await ev(`(()=>{const q=s=>[...document.querySelectorAll(s)];const ok=s=>{const b=s.getBoundingClientRect();return b.width>30&&b.height>30&&s.querySelectorAll('*').length>3};return {steps:q('.lsteps li').length,hero:q('.lhero svg').length,heroBad:q('.lhero svg').filter(s=>!ok(s)).length,picBad:q('.lpic svg').filter(s=>!ok(s)).length,empty:q('.lalg .lm').filter(m=>!m.textContent.trim()).length}})()`);
    if (!r.steps || !r.hero || r.heroBad || r.picBad || r.empty) lbad.push(n + JSON.stringify(r));
  }
  check('all ' + names.length + ' Learn guides have steps, hero pictures and algorithms', lbad.length === 0 && names.length === 14, lbad.length ? lbad : names.join(','));

  console.log('--- method review (rebuilt worker)');
  await ev(`__cubic.go('timer')`); await sleep(300);
  await ev(`document.querySelector('#end-drill') && document.querySelector('#end-drill').click()`); await sleep(200);
  await ev(`document.querySelectorAll('#events .chip')[0].click()`); await sleep(300);
  for (let i = 0; i < 100 && !(await ev('__cubic.state.scr')); i++) await sleep(50);
  console.log('  storage before the solve:', await ev(`(localStorage.getItem('cubic-v1')||'').slice(0,160)`), '| solves:', await ev(`JSON.parse(localStorage.getItem('cubic-v1')||'{}').solves?.length`));
  console.log('  state before the solve:', await ev(`JSON.stringify({screen:__cubic.state.screen,phase:__cubic.state.phase,scr:!!__cubic.state.scr,drill:!!__cubic.state.drill,modal:document.querySelector('#modal').classList.contains('on'),active:document.activeElement&&document.activeElement.tagName})`));
  const rs = await realSolve(); check('a real hold-release-stop solve registers (turns green, runs, stops)', rs.green && rs.run && rs.done, rs);
  console.log('  state after the solve: ', await ev(`JSON.stringify({phase:__cubic.state.phase,t:document.querySelector('#t').textContent,solves:JSON.parse(localStorage.getItem('cubic-v1')||'{}').solves?.length})`));
  console.log('  before Review click:', await ev(`JSON.stringify({after:getComputedStyle(document.querySelector('#after')).display,rv:!!document.querySelector('#rv-last'),wca:__cubic.state.wca,type:__cubic.state.type,lastCode:(JSON.parse(localStorage.getItem('cubic-v1')).solves.slice(-1)[0]||{}).code})`));
  await ev(`document.querySelector('#rv-last').click()`); await sleep(500);
  console.log('  after Review click: ', await ev(`JSON.stringify({modal:document.querySelector('#modal').classList.contains('on'),svRev:!!document.querySelector('#sv-rev'),sheet:document.querySelector('#sheet').textContent.replace(/\s+/g,' ').slice(0,90)})`));
  await ev(`document.querySelector('#sv-rev') && document.querySelector('#sv-rev').click()`);
  for (let i = 0; i < 50 && (await ev('__cubic.state.screen')) !== 'review'; i++) await sleep(100);
  for (let i = 0; i < 300 && !(await ev(`!!document.querySelector('#stages .stg')`)); i++) await sleep(100);
  check('Review solves a fresh scramble with CFOP', await ev(`document.querySelectorAll('#stages .stg').length`) >= 5, await ev(`document.querySelectorAll('#stages .stg').length + ' stages'`));
  for (const m of ['roux', 'zz', 'two-phase']) {
    await ev(`document.querySelector('#meths [data-m=${m}]').click()`);
    let ok = false; for (let i = 0; i < 400; i++) { if (await ev(`document.querySelector('#meths .on')?.dataset.m==='${m}'&&!!document.querySelector('#stages .stg')`)) { ok = true; break; } await sleep(100); }
    check('  ' + m + ' review', ok);
  }
  await ev(`document.querySelector('#rn').click();document.querySelector('#rn').click()`); await sleep(200);
  check('  stepping through the solution moves the cube', /^\d+ \/ \d+$/.test(await ev(`document.querySelector('#pos').textContent`)), await ev(`document.querySelector('#pos').textContent`));

  console.log('--- scrambles for every event, both modes');
  await ev(`__cubic.go('timer')`); await sleep(300);
  const tabs = await ev(`[...document.querySelectorAll('#events .chip')].map(c=>c.textContent)`);
  const sbad = [];
  for (const [i, name] of tabs.entries()) {
    await ev(`document.querySelectorAll('#events .chip')[${i}].click()`);
    let s = ''; for (let k = 0; k < 400; k++) { s = await ev(`__cubic.state.ev==='${name}'?__cubic.state.scr:''`); if (s) break; await sleep(50); }
    const dia = await ev(`document.querySelector('#net svg')?document.querySelector('#net svg').getBoundingClientRect().width>40:false`);
    if (!s || !dia) sbad.push(name + (s ? '' : ' no scramble') + (dia ? '' : ' no picture'));
  }
  check('all ' + tabs.length + ' events produce a scramble and a picture (WCA mode)', sbad.length === 0, sbad);
  await ev(`document.querySelector('#wca [data-w="0"]').click()`); await sleep(500);
  const pbad = [];
  for (const [i, name] of tabs.entries()) {
    await ev(`document.querySelectorAll('#events .chip')[${i}].click()`);
    let s = ''; for (let k = 0; k < 600; k++) { s = await ev(`__cubic.state.ev==='${name}'?__cubic.state.scr:''`); if (s) break; await sleep(50); }
    if (!s) pbad.push(name);
  }
  check('all events also work in Practice mode', pbad.length === 0, pbad);

  console.log('--- settings and storage');
  await ev(`document.querySelector('#settings').click()`); await sleep(300);
  check('settings opens with name, switches and hold options', await ev(`!!document.querySelector('#nm')&&document.querySelectorAll('.tgl').length===6&&document.querySelectorAll('#hold button').length===3`));
  await key('keyDown', 'Escape', 'Escape', 27); await key('keyUp', 'Escape', 'Escape', 27); await sleep(200);
  const bytes = await ev(`(localStorage.getItem('cubic-v1')||'').length`);
  check('storage works and is small', bytes > 0 && bytes < 500000, bytes + ' bytes');
  const net = reqs.filter(r => /^FAILED/.test(r));
  check('no failed file requests', net.length === 0, net);
  console.log('\nJS errors:', errs.length ? errs : 'none');
  check('no JavaScript errors in the whole sweep', errs.length === 0, errs);
  console.log(fails ? '\n' + fails + ' CHECK(S) FAILED' : '\nall checks passed');
  ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
