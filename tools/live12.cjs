// Move animation in a real browser: Review player, case-sheet player on every kind of puzzle, timing, camera, and clean-up.
const { spawn } = require('child_process');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9804;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=C:/Projects/Cubetimer/tools/.work/l12-' + Date.now(), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, x) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '   ' + (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 200) : '')); };
(async () => {
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (t.find(x => x.type === 'page')) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const p = new Map(), errs = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description?.slice(0, 220) || d.params.exceptionDetails.text); };
  const call = (m, a = {}) => new Promise(r => { const i = ++id, to = setTimeout(() => { p.delete(i); r({ result: { result: { value: undefined } } }); }, 30000); p.set(i, d => { clearTimeout(to); r(d); }); ws.send(JSON.stringify({ id: i, method: m, params: a })); });
  const ev = async x => { const r = await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.result.exceptionDetails ? 'ERR ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) : r.result.result.value; };
  const ready = async () => { for (let i = 0; i < 400 && (await ev('typeof __cubic')) !== 'object'; i++) await sleep(50); for (let i = 0; i < 400 && !(await ev('__cubic.state.scr')); i++) await sleep(50); await sleep(200); };
  const shot = async n => { const r = await call('Page.captureScreenshot', { format: 'png' }); if (r.result && r.result.data) fs.writeFileSync('C:/Projects/Cubetimer/tools/.work/' + n + '.png', Buffer.from(r.result.data, 'base64')); };
  const click = sel => ev(`document.querySelector(${JSON.stringify(sel)}).click()`);

  await call('Runtime.enable'); await call('Page.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
  await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' }); await ready();

  const defWatch = () => ev(`window.__watch = (sel, ms) => new Promise(res => { const el = document.querySelector(sel), t0 = performance.now(), seen = [], vb = new Set(); (function f() { const s = el.innerHTML; if (!seen.length || seen[seen.length - 1] !== s) seen.push(s); const m = /viewBox="([^"]+)"/.exec(s); if (m) vb.add(m[1]); if (performance.now() - t0 < ms) requestAnimationFrame(f); else res({ frames: seen.length, boxes: vb.size, last: seen[seen.length - 1], first: seen[0] }); })(); })`);

  console.log('--- Review player');
  const now = Date.now();
  const scr = "R U R' U' F2 L D' B2 U2 R' F D2 L' U B R2 D F' U'";
  await ev(`localStorage.setItem('cubic-v1', JSON.stringify({solves:[{id:'a1',t:11230,pen:'0',scr:${JSON.stringify(scr)},ev:'3×3',b:'ev:3×3',code:'333',date:${now},kind:'solve'}],learned:[],name:'T'}))`);
  await call('Page.reload'); await ready(); await defWatch();
  await ev(`__cubic.go('review', 'a1')`);
  for (let i = 0; i < 600 && !(await ev(`!!document.querySelector('#rn') && document.querySelectorAll('#c0 polygon').length > 20`)); i++) await sleep(100);
  check('review opens with two cubes and a player', (await ev(`document.querySelectorAll('#c0 polygon').length`)) > 20 && (await ev(`document.querySelectorAll('#c1 polygon').length`)) > 20);
  const startPic = await ev(`document.querySelector('#c0').innerHTML`);
  let w = ev(`__watch('#c0', 900)`); await sleep(30); const t0 = Date.now(); await click('#rn'); const res = await w;
  check('Next turns the layer smoothly (many different frames)', res.frames >= 8, res.frames + ' frames');
  check('the camera and frame stay fixed (one viewBox the whole time)', res.boxes === 1, res.boxes + ' viewBoxes');
  check('first frame is the start, last frame is different (one move later)', res.first === startPic && res.last !== startPic);
  check('position moved to 1 and the move is highlighted', (await ev(`document.querySelector('#rs').value`)) === '1' && (await ev(`!!document.querySelector('#stages .mv span.cur')`)));
  const endAfterNext = await ev(`document.querySelector('#c0').innerHTML`);
  await ev(`document.querySelector('#rs').value = 1; document.querySelector('#rs').dispatchEvent(new Event('input'))`); await sleep(100);
  check('the animation ends on exactly the picture a jump to that move shows', (await ev(`document.querySelector('#c0').innerHTML`)) === endAfterNext);
  // timing of one quarter turn
  await ev(`document.querySelector('#rs').value = 0; document.querySelector('#rs').dispatchEvent(new Event('input'))`); await sleep(100);
  const dur = await ev(`new Promise(res => { const el = document.querySelector('#c0'), a = el.innerHTML; let t0 = 0, last = a, tEnd = 0; document.querySelector('#rn').click(); t0 = performance.now(); (function f() { const s = el.innerHTML; if (s !== last) { last = s; tEnd = performance.now(); } if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res(Math.round(tEnd - t0)); })(); })`);
  check('a quarter turn takes a moderate time (not rapid, not slow)', dur >= 330 && dur <= 700, dur + ' ms');
  await sleep(200);
  // Back
  w = ev(`__watch('#c0', 900)`); await sleep(30); await click('#rp'); const back = await w;
  check('Back turns the layer the other way, smoothly, and returns to the start', back.frames >= 8 && back.last === startPic, back.frames + ' frames');
  // slider jumps
  await ev(`document.querySelector('#rs').value = 6; document.querySelector('#rs').dispatchEvent(new Event('input'))`); await sleep(120);
  check('dragging the slider still jumps straight to the move', (await ev(`document.querySelector('#rs').value`)) === '6' && (await ev(`document.querySelector('#pos').textContent`)).startsWith('6'));
  // Play runs to the end and ends clean
  await ev(`document.querySelector('#rs').value = 0; document.querySelector('#rs').dispatchEvent(new Event('input'))`); await sleep(100);
  await click('#play'); await sleep(250);
  check('Play switches to Pause', (await ev(`document.querySelector('#play').getAttribute('aria-label')`)) === 'Pause');
  let shown = 0; await sleep(1500); const mid = Number(await ev(`document.querySelector('#rs').value`));
  check('Play moves through the solution one animated move after another', mid >= 2 && mid <= 5, 'move ' + mid + ' after ~1.7 s');
  await click('#play'); await sleep(700);
  const stopAt = Number(await ev(`document.querySelector('#rs').value`)); await sleep(900);
  check('Pause stops it where it is', Number(await ev(`document.querySelector('#rs').value`)) === stopAt && (await ev(`document.querySelector('#play').getAttribute('aria-label')`)) === 'Play', 'at ' + stopAt);
  await click('#play');
  const total = Number(await ev(`document.querySelector('#rs').max`));
  for (let i = 0; i < 400 && Number(await ev(`document.querySelector('#rs').value`)) < total; i++) await sleep(100);
  await sleep(700);
  check('Play reaches the end and the cube is solved', Number(await ev(`document.querySelector('#rs').value`)) === total && (await ev(`document.querySelector('#play').getAttribute('aria-label')`)) === 'Play');
  const solvedPic = await ev(`(()=>{const f=[...document.querySelectorAll('#c0 polygon')].map(p=>p.getAttribute('fill')).filter(c=>c!=='#16161a');return new Set(f).size})()`);
  check('the final picture shows a solved cube (three faces, one colour each)', solvedPic === 3, solvedPic + ' colours');
  await shot('t-anim-review');

  console.log('--- pressing Next fast, many times');
  await ev(`document.querySelector('#rs').value = 0; document.querySelector('#rs').dispatchEvent(new Event('input'))`); await sleep(100);
  for (let i = 0; i < 6; i++) { await click('#rn'); await sleep(40); }
  await sleep(900);
  check('six quick presses land on move 6 with a whole picture', (await ev(`document.querySelector('#rs').value`)) === '6' && (await ev(`document.querySelectorAll('#c0 polygon').length`)) > 20);
  const quick = await ev(`document.querySelector('#c0').innerHTML`);
  await ev(`document.querySelector('#rs').value = 6; document.querySelector('#rs').dispatchEvent(new Event('input'))`); await sleep(100);
  check('and it is exactly the right picture for move 6', (await ev(`document.querySelector('#c0').innerHTML`)) === quick);
  await ev(`document.querySelector('#play').click()`); await sleep(300);
  await ev(`__cubic.go('timer')`); await sleep(300);
  check('leaving Review while playing stops quietly', errs.length === 0, errs);

  console.log('--- case sheet player: every kind of puzzle');
  await ev(`__cubic.go('train')`);
  for (let i = 0; i < 200 && !(await ev(`!!document.querySelector('#side [data-s="oll"]')`)); i++) await sleep(50);
  const sets = [['oll', 'a 3x3 last-layer algorithm'], ['pll', 'PLL'], ['f2l', 'F2L'], ['cll', '2x2'], ['parity-444', '4x4 parity'], ['l2e-555', '5x5'], ['l4e', 'Pyraminx'], ['sarah', 'Skewb'], ['megaminx-co', 'Megaminx'], ['megaminx-cp', 'Megaminx corners']];
  for (const [sid, label] of sets) {
    await ev(`document.querySelector('#side [data-s="${sid}"]').click()`); await sleep(250);
    await ev(`document.querySelector('#cases .case').click()`); await sleep(350);
    const info = await ev(`(()=>{const q=s=>document.querySelector(s);return {has:!!q('#pp'), n:Number(q('#sl')?.max||0), pics:document.querySelectorAll('#cs3 svg').length, polys:document.querySelectorAll('#cs3 polygon').length}})()`);
    if (!info.has) { check(label + ' (' + sid + '): sheet has a Play button', false, info); await click('#x'); continue; }
    const start = await ev(`document.querySelector('#cs3').innerHTML`);
    const wch = ev(`__watch('#cs3', 1100)`); await sleep(30); await click('#pn'); const r = await wch;
    const okAnim = info.pics >= 1 && info.polys > 8 && r.frames >= 6 && r.last !== start;
    check(label + ' (' + sid + '): Next animates (' + r.frames + ' frames, ' + info.pics + ' picture' + (info.pics > 1 ? 's' : '') + ')', okAnim, { frames: r.frames, changed: r.last !== start });
    // go to the end by Play, then compare with a jump
    await ev(`document.querySelector('#sl').value=0;document.querySelector('#sl').dispatchEvent(new Event('input'))`); await sleep(100);
    await click('#pp');
    for (let i = 0; i < 300 && (await ev(`document.querySelector('#pp').getAttribute('aria-label')`)) === 'Pause'; i++) await sleep(100);
    await sleep(300);
    const atEnd = Number(await ev(`document.querySelector('#sl').value`)) === info.n;
    const playedPic = await ev(`document.querySelector('#cs3').innerHTML`);
    await ev(`document.querySelector('#sl').value=${info.n};document.querySelector('#sl').dispatchEvent(new Event('input'))`); await sleep(120);
    check('   Play reaches the last move and shows the same picture as a jump', atEnd && (await ev(`document.querySelector('#cs3').innerHTML`)) === playedPic, { atEnd, moves: info.n });
    await click('#x'); await sleep(120);
  }
  await ev(`document.querySelector('#side [data-s="oll"]').click()`); await sleep(250);
  await ev(`document.querySelector('#cases .case').click()`); await sleep(350);
  await click('#pp'); await sleep(500);
  await click('#x'); await sleep(200);
  const before = await ev(`document.querySelector('#cs3')?.innerHTML?.length || 0`);
  await sleep(1200);
  check('closing the sheet while it plays stops it (nothing keeps running)', !(await ev(`document.querySelector('#modal').classList.contains('on')`)) && errs.length === 0, errs);
  await ev(`document.querySelector('#cases .case').click()`); await sleep(350);
  await click('#pp'); await sleep(600); await shot('t-anim-case');
  await click('#x');
  console.log('JS errors:', errs.length ? errs : 'none'); check('no JavaScript errors', errs.length === 0, errs);
  console.log(fails ? fails + ' FAILED' : 'all checks passed'); ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
