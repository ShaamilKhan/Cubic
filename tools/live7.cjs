const { spawn } = require('child_process'), fs = require('fs');
const EDGE = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', PORT = 9481;
const edge = spawn(EDGE, ['--headless=new', '--disable-gpu', '--remote-debugging-port=' + PORT, '--user-data-dir=C:/Projects/Cubetimer/tools/.work/l8-' + Date.now(), '--window-size=1440,900', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let fails = 0;
const check = (name, ok, extra) => { if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (extra !== undefined ? '   ' + (typeof extra === 'string' ? extra : JSON.stringify(extra)) : '')); };
(async () => {
  let t; for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json(); if (t.find(x => x.type === 'page')) break; } catch (e) {} await sleep(250); }
  const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl); await new Promise(r => ws.onopen = r);
  let id = 0; const p = new Map(), errs = [];
  ws.onmessage = e => { const d = JSON.parse(e.data); if (d.id && p.has(d.id)) { p.get(d.id)(d); p.delete(d.id); } if (d.method === 'Runtime.exceptionThrown') errs.push(d.params.exceptionDetails.exception?.description || d.params.exceptionDetails.text); };
  const call = (m, a = {}) => new Promise(r => { const i = ++id; p.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: a })); });
  const ev = async x => { const r = await call('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true }); if (r.result.exceptionDetails) return 'ERR ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result.result.value; };
  const shot = async n => { const r = await call('Page.captureScreenshot', { format: 'png' }); fs.writeFileSync('C:/Projects/Cubetimer/tools/.work/' + n + '.png', Buffer.from(r.result.data, 'base64')); };
  await call('Runtime.enable'); await call('Page.enable'); await call('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });

  // known data: 3×3 ×14 (1 DNF), 2×2 ×5, Pyra ×3, Mega ×1, plus 4 practice drills that must NOT be counted
  const now = Date.now(), mk = (ev, code, n, base, extra = {}) => Array.from({ length: n }, (_, i) => ({ id: ev + i, t: Math.round((base + Math.sin(i) * 1.2 - i * 0.05) * 1000 / 10) * 10, pen: '0', scr: "R U R' U'", ev, b: 'ev:' + ev, date: now - (n - i) * 3600e3, kind: 'solve', code, ...extra }));
  const solves = [...mk('3×3', '333', 14, 12), ...mk('2×2', '222so', 5, 4), ...mk('Pyra', 'pyrso', 3, 6), ...mk('Mega', 'mgmp', 1, 70),
    ...Array.from({ length: 4 }, (_, i) => ({ id: 'dr' + i, t: 900, pen: '0', scr: 'R U', ev: 'OLL', b: 'drill:oll', date: now - i * 1000, kind: 'drill', set: 'oll', ci: 0 }))];
  solves[5].pen = 'DNF';
  const store = { solves, learned: [], hold: 300, seeded: true, name: 'Sam', hide: false, comments: true, fx: true, wca: true, variant: {} };
  await call('Page.addScriptToEvaluateOnNewDocument', { source: `try{if(!localStorage.getItem('cubic-v1'))localStorage.setItem('cubic-v1', ${JSON.stringify(JSON.stringify(store))})}catch(e){}` });
  await call('Page.navigate', { url: 'file:///C:/Projects/Cubetimer/app/index.html' }); for (let i = 0; i < 300 && (await ev('typeof __cubic')) !== 'object'; i++) await sleep(100); for (let i = 0; i < 300 && !(await ev('__cubic.state.scr')); i++) await sleep(100); await sleep(250);
  console.log('seeded solves in the page:', await ev(`JSON.parse(localStorage.getItem('cubic-v1')||'{}').solves?.length`));
  await ev(`__cubic.go('stats')`); await sleep(900);

  const cal = await ev(`({cells:document.querySelectorAll('.ac-grid .ac-c').length,lit:document.querySelectorAll('.ac-grid .ac-c.l1,.ac-grid .ac-c.l2,.ac-grid .ac-c.l3,.ac-grid .ac-c.l4').length,total:document.querySelector('.ac-t b')?.textContent,streak:[...document.querySelectorAll('.ac-f span')].map(s=>s.textContent),topY:Math.round(document.querySelector('#st-act').getBoundingClientRect().top),bodyY:Math.round(document.querySelector('.hero')?.getBoundingClientRect().top||0)})`);
  check('activity calendar is drawn at the top of the page', cal.cells > 100 && cal.topY < cal.bodyY, cal);
  check('  it counts every timed solve (23) and not the practice drills', cal.total === '23', cal.total);
  check('  coloured days exist (solves on 1 or more days)', cal.lit >= 1 && cal.lit <= 23, cal.lit);
  const hv = await ev(`(()=>{const c=[...document.querySelectorAll('.ac-grid .ac-c.l1,.ac-grid .ac-c.l2,.ac-grid .ac-c.l3,.ac-grid .ac-c.l4')].pop();const r=c.getBoundingClientRect();return [r.left+r.width/2,r.top+r.height/2,c.dataset.d,c.dataset.n]})()`);
  await call('Input.dispatchMouseEvent', { type: 'mouseMoved', x: hv[0], y: hv[1] }); await sleep(250);
  const tip = await ev(`(()=>{const t=document.querySelector('.ac-tip');return t&&!t.hidden?t.textContent:null})()`);
  check('  hovering a day names the date and its solve count', tip && new RegExp(hv[3] + ' solve').test(tip), tip);
  await shot('v-stats-top');
  const opts = await ev(`[...document.querySelectorAll('#st-ev option')].map(o=>o.textContent.replace(/\\s+/g,' ').trim())`);
  check('dropdown lists only puzzles with solves, each with its count', JSON.stringify(opts) === JSON.stringify(['3×3 · 14 solves', '2×2 · 5 solves', 'Mega · 1 solve', 'Pyra · 3 solves']), opts);
  const chips = await ev(`[...document.querySelectorAll('.bypz .pz')].map(b=>b.textContent.replace(/\\s+/g,' ').trim())`);
  check('count chips per puzzle, plus the total', JSON.stringify(chips) === JSON.stringify(['143×3', '52×2', '1Mega', '3Pyra', '23All puzzles']), chips);
  check('practice drills are not counted', !chips.some(c => /OLL/.test(c)) && chips[chips.length - 1].startsWith('23'));
  check('subtitle matches', /3×3 · 14 solves/.test(await ev(`document.querySelector('#st-sub').textContent`)) && /1 DNF/.test(await ev(`document.querySelector('#st-sub').textContent`)), await ev(`document.querySelector('#st-sub').textContent`));
  check('a "Solves" tile shows the count and how many finished', await ev(`(()=>{const t=[...document.querySelectorAll('.tile')].find(x=>x.querySelector('span').textContent==='Solves');return t&&t.querySelector('b').textContent==='14'&&/13 finished/.test(t.textContent)})()`), await ev(`[...document.querySelectorAll('.tile')][0].textContent`));
  const best3 = await ev(`[...document.querySelectorAll('.tile')].find(x=>x.querySelector('span').textContent==='Best').querySelector('b').textContent`);
  await shot('v-stats-33');

  // switching the dropdown switches every figure
  await ev(`(()=>{const s=document.querySelector('#st-ev');s.value='2×2';s.dispatchEvent(new Event('change'))})()`); await sleep(500);
  check('picking 2×2 in the dropdown shows 2×2 stats', /^2×2 · 5 solves/.test(await ev(`document.querySelector('#st-sub').textContent`)), await ev(`document.querySelector('#st-sub').textContent`));
  const best2 = await ev(`[...document.querySelectorAll('.tile')].find(x=>x.querySelector('span').textContent==='Best').querySelector('b').textContent`);
  check('  its best differs from the 3×3 best (separate stats)', best2 !== best3, best3 + ' vs ' + best2);
  check('  the chart redraws for 5 solves', (await ev(`document.querySelector('#ch').textContent`)).includes('5'), await ev(`document.querySelectorAll('#ch svg .ln').length`) + ' lines');
  check('  and no DNF is shown for 2×2', !/DNF/.test(await ev(`document.querySelector('#st-sub').textContent`)));
  // chips click through too
  await ev(`document.querySelector('.bypz .pz[data-e="Pyra"]').click()`); await sleep(500);
  check('clicking a count chip switches puzzle', /^Pyra · 3 solves/.test(await ev(`document.querySelector('#st-sub').textContent`)) && (await ev(`document.querySelector('#st-ev').value`)) === 'Pyra', await ev(`document.querySelector('#st-sub').textContent`));
  check('  the active chip is highlighted', await ev(`document.querySelector('.bypz .pz.on')?.dataset.e`) === 'Pyra');
  await shot('v-stats-pyra');
  await ev(`document.querySelector('.bypz .pz[data-e="Mega"]').click()`); await sleep(500);
  check('a puzzle with one solve still renders', /^Mega · 1 solve$/.test((await ev(`document.querySelector('#st-sub').textContent`)).replace(/ since.*/, '')) && (await ev(`document.querySelectorAll('#ch svg .ln').length`)) >= 1, await ev(`document.querySelector('#st-sub').textContent`));
  check('  improvement says it needs more solves', /Needs six solves/.test(await ev(`document.querySelector('.hero em').textContent`)), await ev(`document.querySelector('.hero em').textContent`));

  // a new solve bumps the right count
  await ev(`document.querySelector('#nav [data-s="timer"]').click()`); await sleep(400);
  await ev(`document.querySelectorAll('#events .chip')[1].click()`);
  for (let i = 0; i < 100 && !(await ev(`__cubic.state.ev==='2×2'&&!!__cubic.state.scr`)); i++) await sleep(100); await sleep(300);
  const key = (ty, k, c, v) => call('Input.dispatchKeyEvent', { type: ty, key: k, code: c, windowsVirtualKeyCode: v, text: k === ' ' ? ' ' : undefined });
  await key('keyDown', ' ', 'Space', 32); await sleep(450); await key('keyUp', ' ', 'Space', 32); await sleep(700); await key('keyDown', 'a', 'KeyA', 65); await key('keyUp', 'a', 'KeyA', 65); await sleep(400);
  await ev(`document.querySelector('#nav [data-s="stats"]').click()`); await sleep(600);
  const opts2 = await ev(`[...document.querySelectorAll('#st-ev option')].map(o=>o.textContent.replace(/\\s+/g,' ').trim())`);
  check('timing a 2×2 solve raises the 2×2 count to 6 and the total to 24', opts2.includes('2×2 · 6 solves') && (await ev(`document.querySelector('.bypz .pz.tot b').textContent`)) === '24', opts2);

  // comments: bigger pool, no repeats in a long run, in the real UI
  const seen = await ev(`(()=>{const out=[];let rec=[];const prev=[12000,12500,12100,12900,12400,12600,12300];for(let i=0;i<30;i++){const r=Quips.make({name:'Sam',ev:'3×3',ms:11800+i*40,pen:'0',prev,total:8+i,lastText:out[out.length-1],recent:rec});rec=rec.concat(r.text).slice(-8);out.push(r.text)}return {n:new Set(out).size,rep:out.filter((x,i)=>i&&x===out[i-1]).length,count:Quips.count(),sample:out.slice(0,4)}})()`);
  check('267 comments in the pool; 30 solves in a row give varied lines and no back-to-back repeats', seen.count >= 250 && seen.rep === 0 && seen.n >= 15, seen);
  console.log('\nJS errors:', errs.length ? errs : 'none');
  console.log(fails ? '\n' + fails + ' CHECK(S) FAILED' : '\nall checks passed');
  ws.close(); edge.kill(); process.exit(0);
})().catch(e => { console.log('DRIVER FAILED', e.message); try { edge.kill(); } catch (x) {} process.exit(1); });
