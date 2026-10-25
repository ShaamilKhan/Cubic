// Screenshots of every screen at many screen sizes, plus layout checks (nothing wider than the screen, timer big and centred).
// usage: node tools/shots.cjs [outdir]    -> writes <outdir>/<size>-<screen>.png and prints a table of findings
const { spawn } = require('child_process');
const fs = require('fs');
const OUT = process.argv[2] || 'C:/Projects/Cubetimer/tools/.work/shots';
fs.mkdirSync(OUT, { recursive: true });
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9805;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=C:/Projects/Cubetimer/tools/.work/sh-' + Date.now(), 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const SIZES = [['phone-s', 360, 640, 3], ['phone-m', 390, 844, 3], ['phone-l', 430, 932, 3], ['phone-land', 844, 390, 3], ['phone-s-land', 640, 360, 2], ['tablet', 768, 1024, 2], ['tablet-land', 1024, 768, 2], ['laptop', 1280, 720, 1], ['desktop', 1440, 900, 1], ['wide', 1920, 1080, 1]];
const only = (process.env.ONLY || '').split(',').filter(Boolean);
const SCREENS = ['timer', 'train', 'learn', 'stats', 'review'];
(async () => {
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (t.find(x => x.type === 'page')) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const p = new Map(), errs = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description?.slice(0, 200) || d.params.exceptionDetails.text); };
  const call = (m, a = {}) => new Promise(r => { const i = ++id, to = setTimeout(() => { p.delete(i); r({ result: { result: { value: undefined } } }); }, 30000); p.set(i, d => { clearTimeout(to); r(d); }); ws.send(JSON.stringify({ id: i, method: m, params: a })); });
  const ev = async x => { const r = await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); return r.result.exceptionDetails ? 'ERR ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text) : r.result.result.value; };
  const ready = async () => { for (let i = 0; i < 400 && (await ev('typeof __cubic')) !== 'object'; i++) await sleep(50); for (let i = 0; i < 400 && !(await ev('__cubic.state.scr')); i++) await sleep(50); await sleep(300); };
  await call('Runtime.enable'); await call('Page.enable');
  const now = Date.now(), solves = [];
  for (let i = 0; i < 40; i++) solves.push({ id: 's' + i, t: 9000 + ((i * 7919) % 4000), pen: i === 5 ? '2' : '0', scr: "R U R' U' F2 L D' B2 U2 R' F D2 L' U B R2 D F' U'", ev: '3×3', b: 'ev:3×3', code: '333', date: now - (40 - i) * 3600e3 * 7, kind: 'solve' });
  const seed = JSON.stringify({ solves, learned: [], name: 'Sam', wca: true });
  const report = [];
  for (const [name, w, h, dpr] of SIZES) {
    if (only.length && !only.includes(name)) continue;
    const mobile = Math.min(w, h) < 700;
    await call('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile, screenWidth: w, screenHeight: h });
    if (mobile) await call('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); else await call('Emulation.setTouchEmulationEnabled', { enabled: false });
    await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' }); await ready();
    await ev(`localStorage.setItem('cubic-v1', ${JSON.stringify(seed)})`);
    await call('Page.reload'); await ready();
    for (const s of SCREENS) {
      await ev(`__cubic.go('${s}', ${s === 'review' ? "'s3'" : 'undefined'})`);
      const wait = s === 'train' ? 900 : s === 'review' ? 2500 : 500;
      await sleep(wait);
      if (s === 'review') for (let i = 0; i < 100 && !(await ev(`document.querySelectorAll('#c0 polygon').length>20`)); i++) await sleep(100);
      const m = await ev(`(()=>{
        const de = document.documentElement, b = document.body, sc = document.querySelector('.screen.on');
        const over = [...document.querySelectorAll('body *')].filter(e => { const r = e.getBoundingClientRect(); const st = getComputedStyle(e); return r.width > 0 && st.visibility !== 'hidden' && st.display !== 'none' && (r.right > innerWidth + 1 || r.left < -1) && !e.closest('.events,.side,.ac-scroll,.chart-scroll,.tb-wrap,#fx,.stages,.recent,.alts,svg') ; }).slice(0, 4).map(e => (e.id ? '#' + e.id : '') + '.' + String(e.className).split(' ')[0] + ' ' + Math.round(e.getBoundingClientRect().right));
        const t = document.querySelector('#t'), tr = t.getBoundingClientRect();
        return { docW: de.scrollWidth, winW: innerWidth, bodyScrollH: b.scrollHeight, winH: innerHeight, over, timer: { w: Math.round(tr.width), h: Math.round(tr.height), cx: Math.round(tr.left + tr.width / 2), cy: Math.round(tr.top + tr.height / 2), fs: getComputedStyle(t).fontSize }, scr: sc ? sc.scrollHeight - sc.clientHeight : 0 };
      })()`);
      const r = await call('Page.captureScreenshot', { format: 'png' });
      if (r.result && r.result.data) fs.writeFileSync(`${OUT}/${name}-${s}.png`, Buffer.from(r.result.data, 'base64'));
      report.push({ size: name, wh: w + 'x' + h, screen: s, ...m });
    }
  }
  for (const r of report) {
    const flags = [];
    if (r.docW > r.winW + 1) flags.push('PAGE SCROLLS SIDEWAYS ' + r.docW + '>' + r.winW);
    if (r.over.length) flags.push('overflow: ' + r.over.join('; '));
    if (r.screen === 'timer') flags.push(`timer ${r.timer.w}x${r.timer.h} font ${r.timer.fs} centre ${r.timer.cx}/${r.winW / 2}, ${r.timer.cy}/${r.winH}`);
    console.log(r.size.padEnd(13), r.wh.padEnd(10), r.screen.padEnd(7), flags.join(' | ') || 'ok');
  }
  console.log('JS errors:', errs.length ? errs : 'none');
  ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
