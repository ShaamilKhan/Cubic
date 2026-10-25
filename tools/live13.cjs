// Responsive layout and touch: at phone, tablet and desktop sizes - nothing sticks out sideways, the timer is big and centred,
// real finger touches start and stop it, the tab bar works, sheets fit, and the whole-screen timer fills the display.
const { spawn } = require('child_process');
const fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9806;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=C:/Projects/Cubetimer/tools/.work/l13-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (n, ok, x) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '   ' + (typeof x === 'string' ? x : JSON.stringify(x)).slice(0, 220) : '')); };
(async () => {
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (t.find(x => x.type === 'page')) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const p = new Map(), errs = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description?.slice(0, 220) || d.params.exceptionDetails.text); };
  const call = (m, a = {}) => new Promise(r => { const i = ++id, to = setTimeout(() => { p.delete(i); r({ result: { result: { value: undefined } } }); }, 30000); p.set(i, d => { clearTimeout(to); r(d); }); ws.send(JSON.stringify({ id: i, method: m, params: a })); });
  const ev = async x => { const r = await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.result.exceptionDetails ? 'ERR ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) : r.result.result.value; };
  const phase = async (w, ms = 3000) => { for (let i = 0; i < ms / 25; i++) { if ((await ev('__cubic.state.phase')) === w) return true; await sleep(25); } return false; };
  const ready = async () => { for (let i = 0; i < 400 && (await ev('typeof __cubic')) !== 'object'; i++) await sleep(50); for (let i = 0; i < 400 && !(await ev('__cubic.state.scr')); i++) await sleep(50); await sleep(300); };
  const size = async (w, h, mobile = true) => {
    await call('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile, screenWidth: w, screenHeight: h });
    await call('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: 5 });
  };
  const touch = (type, x, y) => call('Input.dispatchTouchEvent', { type, touchPoints: type === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
  const rect = sel => ev(`(()=>{const r=document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2,w:r.width,h:r.height,l:r.left,r:r.right,t:r.top,b:r.bottom}})()`);
  const shot = async n => { const r = await call('Page.captureScreenshot', { format: 'png' }); if (r.result && r.result.data) fs.writeFileSync('C:/Projects/Cubetimer/tools/.work/' + n + '.png', Buffer.from(r.result.data, 'base64')); };

  await call('Runtime.enable'); await call('Page.enable');
  const now = Date.now(), solves = [];
  for (let i = 0; i < 30; i++) solves.push({ id: 's' + i, t: 9000 + ((i * 7919) % 4000), pen: '0', scr: "R U R' U' F2 L D' B2 U2 R' F D2 L' U B R2 D F' U'", ev: '3×3', b: 'ev:3×3', code: '333', date: now - (30 - i) * 3600e3 * 9, kind: 'solve' });
  const seed = JSON.stringify({ solves, learned: [], name: 'Sam', wca: true });
  const load = async () => { await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' }); await ready(); await ev(`localStorage.setItem('cubic-v1', ${JSON.stringify(seed)})`); await call('Page.reload'); await ready(); };

  const SIZES = [['phone 360x640', 360, 640], ['phone 390x844', 390, 844], ['phone 430x932', 430, 932], ['phone 320x568', 320, 568], ['phone landscape 844x390', 844, 390], ['tablet 768x1024', 768, 1024], ['tablet landscape 1024x768', 1024, 768], ['laptop 1366x768', 1366, 768], ['desktop 1440x900', 1440, 900], ['wide 1920x1080', 1920, 1080]];
  for (const [label, w, h] of SIZES) {
    console.log('--- ' + label);
    await size(w, h, Math.min(w, h) < 700); await load();
    const bad = [];
    for (const s of ['timer', 'train', 'learn', 'stats', 'review']) {
      await ev(`__cubic.go('${s}', ${s === 'review' ? "'s3'" : 'undefined'})`); await sleep(s === 'train' ? 800 : 450);
      if (s === 'review') for (let i = 0; i < 100 && !(await ev(`document.querySelectorAll('#c0 polygon').length>20`)); i++) await sleep(100);
      const m = await ev(`(()=>{const de=document.documentElement;const over=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(),st=getComputedStyle(e);return r.width>0&&st.visibility!=='hidden'&&st.display!=='none'&&(r.right>innerWidth+1||r.left<-1)&&!e.closest('.events,.side,.ac-scroll,.chart-scroll,.tb-wrap,#fx,.recent,.alts,.stages,.caps,svg,.sheet')}).slice(0,3).map(e=>(e.id?'#'+e.id:'')+'.'+String(e.className).split(' ')[0]);return {sideways:de.scrollWidth>innerWidth+1,over}})()`);
      if (m.sideways || m.over.length) bad.push(s + ':' + (m.sideways ? 'page scrolls sideways ' : '') + m.over.join(','));
    }
    check('no screen pokes out sideways', bad.length === 0, bad);
    await ev(`__cubic.go('timer')`); await sleep(400);
    const tr = await rect('#t');
    check('timer is centred left-to-right', Math.abs(tr.x - w / 2) <= 2, Math.round(tr.x) + ' vs ' + w / 2);
    const phoneUp = w < 700 && h > w, big = phoneUp ? tr.w >= w * 0.5 : tr.h >= Math.min(h * 0.17, 120);
    check('timer is big', big, Math.round(tr.w) + 'x' + Math.round(tr.h) + ' on ' + w + 'x' + h);
    check('timer stays inside the screen with room at the sides', tr.l >= 8 && tr.r <= w - 8, Math.round(tr.l) + '..' + Math.round(tr.r));
    const vm = Math.abs(tr.y - h / 2) < h * 0.2;
    check('timer is near the middle of the screen', vm, Math.round(tr.y) + ' of ' + h);
    const below = await ev(`(()=>{const q=s=>{const e=document.querySelector(s);if(!e)return null;const st=getComputedStyle(e);if(st.display==='none'||st.visibility==='hidden')return null;const r=e.getBoundingClientRect();return r.width?r:null};const t=q('#t'),a=q('#scr'),h=q('#hint'),n=q('#net svg');const hit=(x,y)=>x&&y&&!(x.right<=y.left||y.right<=x.left||x.bottom<=y.top||y.bottom<=x.top);return {scr:hit(t,a),hint:hit(t,h),net:hit(t,n)}})()`);
    check('timer overlaps nothing (scramble, hint, picture)', !below.scr && !below.hint && !below.net, below);
    if (w < 700) {
      const bar = await ev(`(()=>{const n=document.querySelector('#nav'),r=n.getBoundingClientRect();return {bottom:Math.round(r.bottom),top:Math.round(r.top),w:Math.round(r.width),pos:getComputedStyle(n).position}})()`);
      if (h > w) check('phone upright: tab bar sits along the bottom edge', bar.pos === 'fixed' && bar.bottom >= h - 1 && bar.w >= w - 2, bar);
    }
    if (label === 'phone 390x844' || label === 'phone landscape 844x390' || label === 'tablet 768x1024') await shot('t-' + label.replace(/[^a-z0-9]+/gi, '-'));
  }

  console.log('--- real touches on a phone (390x844)');
  await size(390, 844, true); await load();
  let r = await rect('#clock');
  await touch('touchStart', r.x, r.y); check('finger down: holding (red)', await phase('hold', 1000));
  await phase('ready', 2000); check('after the hold time the timer turns green', (await ev('__cubic.state.phase')) === 'ready');
  const col = await ev(`getComputedStyle(document.querySelector('#t')).color`);
  await touch('touchEnd'); check('lift the finger: timer runs', await phase('running', 1500));
  const full = await rect('#clock');
  check('while running only the time is shown, full screen', full.w >= 389 && full.h >= 843 && (await ev(`getComputedStyle(document.querySelector('.band')).visibility`)) === 'hidden', Math.round(full.w) + 'x' + Math.round(full.h));
  const tfull = await rect('#t');
  check('the running time is big and centred', Math.abs(tfull.x - 195) <= 2 && Math.abs(tfull.y - 422) <= 6 && tfull.w >= 200, Math.round(tfull.w) + ' wide at ' + Math.round(tfull.x) + ',' + Math.round(tfull.y));
  await shot('t-run-phone'); await sleep(600);
  await touch('touchStart', 120, 300); await sleep(30); await touch('touchEnd'); await sleep(300);
  check('a tap anywhere stops it and saves the solve', (await ev('__cubic.state.phase')) === 'idle' && (await ev(`JSON.parse(localStorage.getItem('cubic-v1')).solves.length`)) === 31);
  check('the buttons under the time appear and nothing was pressed by the stopping tap', await ev(`document.querySelector('#after').classList.contains('show')`) && (await ev(`JSON.parse(localStorage.getItem('cubic-v1')).solves.slice(-1)[0].pen`)) === '0');
  const after = await rect('#after');
  check('OK / +2 / DNF are inside the screen and big enough to tap', after.l >= 0 && after.r <= 390 && (await ev(`Math.min(...[...document.querySelectorAll('#after button')].map(b=>b.getBoundingClientRect().height))`)) >= 34);
  await shot('t-after-phone');
  await touch('touchStart', r.x, r.y); await sleep(60); await touch('touchEnd'); await sleep(200);
  check('a quick touch (not held long enough) does not start the timer', (await ev('__cubic.state.phase')) === 'idle');
  // the tab bar
  for (const s of ['train', 'learn', 'stats', 'review', 'timer']) {
    const b = await rect(`#nav [data-s="${s}"]`);
    await touch('touchStart', b.x, b.y); await touch('touchEnd'); await sleep(450);
    check('tab bar: tapping ' + s + ' opens it', (await ev('__cubic.state.screen')) === s && b.h >= 40 && b.w >= 50, Math.round(b.w) + 'x' + Math.round(b.h));
  }
  // a sheet fits
  await ev(`document.querySelector('#all').click()`); await sleep(400);
  const sh = await rect('#sheet');
  check('the All solves sheet fits the phone', sh.l >= 0 && sh.r <= 390 && sh.b <= 844 && sh.w >= 340, Math.round(sh.w) + 'x' + Math.round(sh.h));
  await ev(`document.querySelector('#x').click()`); await sleep(200);
  await ev(`document.querySelector('#settings').click()`); await sleep(400);
  const st = await rect('#sheet');
  check('Settings fits the phone and its switches are in reach', st.l >= 0 && st.r <= 390 && (await ev(`[...document.querySelectorAll('.tgl')].every(b=>{const r=b.getBoundingClientRect();return r.right<=390&&r.left>=0})`)), Math.round(st.w) + 'x' + Math.round(st.h));
  await shot('t-settings-phone'); await ev(`document.querySelector('#x').click()`); await sleep(200);
  // Train: practice mode and the floating button
  await ev(`__cubic.go('train')`); await sleep(800);
  await ev(`document.querySelector('#tmode [data-m="1"]').click()`); await sleep(250);
  await ev(`document.querySelectorAll('#cases .case')[0].click()`); await sleep(150);
  const fb = await rect('#drill-all');
  check('Train: the Train button floats at the bottom, above the tab bar, and is easy to hit', fb.b <= 844 - 56 && fb.w >= 300 && fb.h >= 40, JSON.stringify({ b: Math.round(fb.b), w: Math.round(fb.w), h: Math.round(fb.h) }));
  const cg = await ev(`(()=>{const c=[...document.querySelectorAll('#cases .case')].slice(0,3).map(e=>e.getBoundingClientRect());return c.map(r=>Math.round(r.width))})()`);
  check('Train: three cards per row on a phone, each a comfortable size', cg.length === 3 && cg.every(x => x >= 90), cg);
  await shot('t-train-phone');
  await ev(`document.querySelector('#tmode [data-m="0"]').click()`);
  // a sheet with the moving cube on a phone
  await ev(`document.querySelectorAll('#cases .case')[0].click()`); await sleep(500);
  const cs = await rect('#sheet');
  check('case sheet with the move player fits the phone', cs.l >= 0 && cs.r <= 390 && cs.b <= 844, Math.round(cs.w) + 'x' + Math.round(cs.h));
  await ev(`document.querySelector('#pp').click()`); await sleep(700); await shot('t-case-phone');
  await ev(`document.querySelector('#x').click()`);

  console.log('--- a long time and a +2 never touch the edges');
  await size(360, 640, true); await load(); await ev(`__cubic.go('timer')`); await sleep(300);
  const widths = {};
  for (const [k, ms, pen] of [['short', 9990, '0'], ['two digits', 12340, '0'], ['minutes', 754560, '0'], ['plus two', 12340, '2']]) {
    await ev(`__cubic.setTime(${ms}); void 0`); if (pen === '2') await ev(`document.querySelector('#t').insertAdjacentHTML('beforeend','<sup class="p2">+2</sup>')`);
    if (pen === '2') await ev(`(()=>{const T=document.querySelector('#t');T.style.setProperty('--ew',1.807+0.555+0.45)})()`);
    await sleep(60); const r = await rect('#t'); widths[k] = [Math.round(r.l), Math.round(r.r)];
  }
  await ev(`__cubic.showTime({pen:'DNF',t:0})`); await sleep(60); { const r = await rect('#t'); widths.dnf = [Math.round(r.l), Math.round(r.r)]; }
  check('every kind of time fits inside a 360-wide phone with margin', Object.values(widths).every(([l, r]) => l >= 4 && r <= 356), widths);

  console.log('JS errors:', errs.length ? errs : 'none'); check('no JavaScript errors', errs.length === 0, errs);
  console.log(fails ? fails + ' FAILED' : 'all checks passed'); ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
