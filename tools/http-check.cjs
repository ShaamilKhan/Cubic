// The same page, loaded over http:// (as a host serves it), not file://. Web Workers from blobs and WebAssembly behave differently there.
const { spawn } = require('child_process');
const EDGE='C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',PORT=9761;
const edge=spawn(EDGE,['--headless=new','--disable-gpu','--remote-debugging-port='+PORT,'--user-data-dir=C:/Projects/Cubetimer/tools/.work/hc-'+Date.now(),'--window-size=1440,900','about:blank'],{stdio:'ignore'});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let t;for(let i=0;i<40;i++){try{t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();if(t.find(x=>x.type==='page'))break}catch(e){}await sleep(250)}
const ws=new WebSocket(t.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const p=new Map(),errs=[],bad=[];
ws.onmessage=e=>{const d=JSON.parse(e.data);if(d.id&&p.has(d.id)){p.get(d.id)(d);p.delete(d.id)}
 if(d.method==='Runtime.exceptionThrown')errs.push(d.params.exceptionDetails.exception?.description?.slice(0,200));
 if(d.method==='Network.responseReceived'&&d.params.response.status>=400)bad.push(d.params.response.status+' '+d.params.response.url);
 if(d.method==='Log.entryAdded'&&d.params.entry.level==='error'&&!/fonts\.g/.test(d.params.entry.url||''))errs.push('log: '+d.params.entry.text.slice(0,160))};
const call=(m,a={})=>new Promise(r=>{const i=++id;p.set(i,r);ws.send(JSON.stringify({id:i,method:m,params:a}))});
const ev=async x=>{const r=await call('Runtime.evaluate',{expression:x,returnByValue:true,awaitPromise:true});return r.result.exceptionDetails?'ERR '+r.result.exceptionDetails.exception?.description:r.result.result.value};
const key=(ty,k,c,v)=>call('Input.dispatchKeyEvent',{type:ty,key:k,code:c,windowsVirtualKeyCode:v,text:k===' '?' ':undefined});
const phase=async(w,ms=3000)=>{for(let i=0;i<ms/25;i++){if((await ev('__cubic.state.phase'))===w)return true;await sleep(25)}return false};
await call('Runtime.enable');await call('Network.enable');await call('Log.enable');await call('Page.enable');await call('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await call('Page.navigate',{url:'http://127.0.0.1:4188/'});
for(let i=0;i<300&&(await ev('typeof __cubic'))!=='object';i++)await sleep(50);for(let i=0;i<300&&!(await ev('__cubic.state.scr'));i++)await sleep(50);
let ok=true;const check=(n,c,x)=>{if(!c)ok=false;console.log((c?'PASS ':'FAIL ')+n,x===undefined?'':JSON.stringify(x))};
check('page loads over http and shows a WCA scramble (TNoodle worker + WebAssembly)',!!(await ev('__cubic.state.scr'))&&(await ev('__cubic.state.type.tn'))==='333',await ev('__cubic.state.type'));
await key('keyDown',' ','Space',32);await phase('ready');await key('keyUp',' ','Space',32);await phase('running');await sleep(500);await key('keyDown','a','KeyA',65);await key('keyUp','a','KeyA',65);await phase('idle');await sleep(300);
check('a solve is timed, shows a comment and saves',/^\d+\.\d\d$/.test(await ev(`document.querySelector('#t').textContent`))&&(await ev(`document.querySelector('#quip').textContent.length`))>5&&(await ev(`JSON.parse(localStorage.getItem('cubic-v1')).solves.length`))===1);
await ev(`__cubic.go('train')`);for(let i=0;i<200&&!(await ev(`document.querySelectorAll('#cases .case').length`));i++)await sleep(50);
check('Train loads its library on demand over http',(await ev(`document.querySelectorAll('#cases .case').length`))>20);
await ev(`__cubic.go('learn')`);for(let i=0;i<100&&!(await ev('!!window.LPIC'));i++)await sleep(50);
check('Learn loads its pictures on demand over http',await ev('!!window.LPIC'));
await ev(`__cubic.go('stats')`);await sleep(500);
check('Stats draws the calendar and chart',(await ev(`document.querySelectorAll('.ac-c').length`))>100&&(await ev(`document.querySelectorAll('#ch svg').length`))===1);
await ev(`__cubic.go('timer')`);await ev(`document.querySelector('#rv-last').click()`);await sleep(400);await ev(`document.querySelector('#sv-rev').click()`);
for(let i=0;i<300&&!(await ev(`!!document.querySelector('#stages .stg')`));i++)await sleep(100);
check('method review solves the scramble over http',(await ev(`document.querySelectorAll('#stages .stg').length`))>=5);
check('no file returned an error',bad.filter(b=>!/fonts\.g/.test(b)).length===0,bad);
check('no JavaScript errors',errs.length===0,errs);
console.log(ok?'all http checks passed':'HTTP CHECKS FAILED');ws.close();edge.kill();process.exit(0)})();
