/* NOIR method review, GPL-3.0. Uses csTimer search primitives. */
importScripts('engine.js','review-core.js');
const solvedCube='UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB';
function tokens(s){return s.replace(/[()]/g,' ').replace(/([URFDLB])w/g,(_,f)=>f.toLowerCase()).trim().split(/\s+/).filter(Boolean).map(m=>{if(!/^[URFDLBurfdlbMESxyz](?:2'?|')?$/.test(m))throw Error('Unsupported move: '+m);return m[0]+(m.includes('2')?'2':m.includes("'")?"'":' ');});}
function apply(state,ms){for(const m of ms)state=cubeMove(state,m);return state;}
function clean(ms){return ms.map(m=>m.trim()).join(' ');}
function uniform(s){return [0,9,18,27,36,45].every(i=>s.slice(i,i+9).split('').every(c=>c===s[i+4]));}
function f2l(s){return s.slice(27,36).split('').every(c=>c===s[31])&&[9,18,36,45].every(i=>s.slice(i+3,i+9).split('').every(c=>c===s[i+4]));}
function oriented(s){return f2l(s)&&s.slice(0,9).split('').every(c=>c===s[4]);}
const aufs=[[],['U '],['U2'],["U'"]];
function findAlg(state,sets,predicate){for(const pre of aufs){const a=apply(state,pre);if(predicate(a))return pre;for(const set of sets)for(const c of set.cases)for(const alg of c.algs){let ms;try{ms=tokens(alg.moves);}catch{continue;}for(const y of [[],['y '],['y2'],["y'"]]){const inv=y.length?[y[0]==='y '?'y\'':y[0]==="y'"?'y ':'y2']:[];const seq=[...pre,...y,...ms,...inv];const b=apply(state,seq);if(predicate(b))return seq;for(const post of aufs.slice(1)){if(predicate(apply(b,post)))return [...seq,...post];}}}}return null;}
self.onmessage=({data})=>{try{const start=tokens(data.scramble);const state=apply(solvedCube,start);if(data.action==='verify'){const actual=tokens(data.moves);const final=apply(state,actual);postMessage({verified:uniform(final),count:actual.filter(m=>!/[xyz]/.test(m)).length});return;}let all=[],steps=[],mask=0;
const add=(name,ms,note)=>{all.push(...ms);steps.push({name,moves:clean(ms),count:ms.filter(m=>!/[xyz]/.test(m)).length,note});postMessage({progress:name});};
if(data.method==='two-phase'){const sol=min2phase.solve(state);if(/^Error/.test(sol))throw Error(sol);add('Complete solution',tokens(sol),'Two-phase solution; not proven shortest.');}
else{const meta=data.method==='roux'?sabmeta:data.method==='zz'?zzmeta:cfmeta;
for(const stage of meta){let found=null,bit=mask;const solvers=Object.entries(stage.step).filter(([target,bits])=>(bits|mask)===bits).map(([target,bits])=>({target,bits,solver:new mathlib.gSolver([target],cubeMove,stage.move)}));
for(let depth=0;depth<=(stage.maxl||10)&&!found;depth++){for(const item of solvers){const s=apply(item.target,[...start,...all]);const result=item.solver.search(s,0,depth);if(result){found=result;bit|=item.bits;break;}}}
if(!found)throw Error('Search limit reached at '+stage.head+'. Try the two-phase solver.');mask=bit;add(stage.head,found,'Shortest step within the configured moves, preserving completed pieces.');}
let current=apply(state,all);
if(data.method==='roux'){
 const cornerGoal=s=>[0,9,18,27,36,45].every(i=>[0,2,6,8].every(j=>s[i+j]===solvedCube[i+j]))&&[9,36].every(i=>s.slice(i+3,i+9).split('').every(c=>c===solvedCube[i+4]));
 const cmll=findAlg(current,data.sets.filter(s=>['coll','pll','oll'].includes(s.id)),cornerGoal);if(!cmll)throw Error('No matching corner algorithm found. Try the two-phase solver.');add('Corners',cmll,'Library algorithm matching the remaining corners.');
 current=apply(state,all);const lse=new mathlib.gSolver([solvedCube],cubeMove,appendSuffix({U:0x00,M:0x11})).search(current,0,20);if(!lse)throw Error('Last-six-edges search limit reached.');add('Last six edges',lse,'U / M move search.');
}else{const oll=findAlg(current,data.sets.filter(s=>s.id==='oll'),oriented);if(!oll)throw Error('No matching OLL algorithm found. Try the two-phase solver.');add('OLL',oll,'Matched from the algorithm library, including setup turns.');current=apply(state,all);const pll=findAlg(current,data.sets.filter(s=>s.id==='pll'),uniform);if(!pll)throw Error('No matching PLL algorithm found. Try the two-phase solver.');add('PLL + AUF',pll,'Matched from the algorithm library, including final alignment.');}}
if(!uniform(apply(state,all)))throw Error('Solution verification failed. No solution will be displayed.');postMessage({steps,moves:clean(all),verified:true,count:all.filter(m=>!/[xyz]/.test(m)).length});
}catch(e){postMessage({error:e.message});}};
