const assert=require('assert');const Q=require('C:/Projects/Cubetimer/app/quips.js');
let n=0;const ok=(c,m)=>{assert(c,m);n++};const s=x=>x*1000;
const hist=[s(14),s(13),s(15),s(14),s(13),s(15),s(14.5),s(13.5)];
const cl=(ms,ev,prev)=>Q.classify({ms,ev,prev:prev||hist,pen:'0',total:9}).tone;
// the user's own case: 0.7 s on a 3x3
ok(cl(s(0.7),'3×3')==='impossible','0.70 on 3x3 -> impossible: '+cl(s(0.7),'3×3'));
ok(cl(s(0.0),'3×3')==='impossible' && cl(s(1.5),'3×3')==='impossible','0.00 and 1.50 -> impossible');
ok(cl(s(2.1),'3×3')==='impossible' && cl(s(2.2),'3×3')==='nearwr', '2.10 (84%) impossible, 2.20 (88%) near-record: '+cl(s(2.1),'3×3')+' '+cl(s(2.2),'3×3'));
ok(cl(s(2.4),'3×3')==='nearwr','2.40 -> beats the record by a hair: '+cl(s(2.4),'3×3'));
ok(cl(s(2.51),'3×3')==='elite' && cl(s(3.2),'3×3')==='elite','at the record and 3.2 -> elite: '+cl(s(2.51),'3×3')+' '+cl(s(3.2),'3×3'));
ok(cl(s(3.4),'3×3')!=='elite' && cl(s(3.4),'3×3')!=='impossible' && cl(s(3.4),'3×3')!=='nearwr','3.40 is normal-fast, not flagged');
// the same time is fine on a bigger puzzle, impossible on a smaller one
ok(cl(s(0.7),'2×2')!=='impossible','0.70 is plausible on a 2×2 (record 0.39): '+cl(s(0.7),'2×2'));
ok(cl(s(0.7),'Pyra')==='nearwr' || cl(s(0.7),'Pyra')==='impossible','0.70 on Pyraminx is at/under the 0.73 record: '+cl(s(0.7),'Pyra'));
ok(cl(s(20),'7×7',[s(200),s(210),s(220),s(205)])==='impossible','20 s on 7x7 -> impossible (record 87.47)');
ok(cl(s(12),'4×4',[s(60),s(65),s(70),s(62)])==='impossible','12 s on 4x4 -> impossible (record 15.18)');
// an unknown puzzle (Training, FMC) is never judged against a record
ok(!['impossible','nearwr','elite'].includes(cl(s(0.7),'OLL')),'practice drills have no record');
ok(!['impossible','nearwr','elite'].includes(cl(s(0.7),'FMC')),'FMC has no time record');
// far faster than YOUR history but nowhere near a record
ok(cl(s(5),'3×3',[s(30),s(31),s(32),s(29),s(30)])==='tooquick','5 s vs a 30 s cuber -> probably a mis-stop: '+cl(s(5),'3×3',[s(30),s(31),s(32),s(29),s(30)]));
ok(cl(s(14),'3×3',[s(30),s(31),s(32),s(29),s(30)])==='tooquick' && cl(s(18),'3×3',[s(30),s(31),s(32),s(29),s(30)])!=='tooquick','halving your time (14 s vs 30 s) is flagged; a 40% improvement (18 s) is celebrated, not doubted');
// a DNF or +2 is judged first, not as impossible
ok(Q.classify({ms:s(0.7),ev:'3×3',prev:hist,pen:'DNF',total:9}).tone==='dnf' && Q.classify({ms:s(0.7),ev:'3×3',prev:hist,pen:'2',total:9}).tone==='plus2','penalties win');
// the first-ever solve being 0.7 s is also impossible, not "first solve in the books"
ok(Q.classify({ms:s(0.7),ev:'3×3',prev:[],pen:'0',total:1}).tone==='impossible','a 0.7 first solve is still flagged');
// the wording is true and complete
for(const t of [s(0.7),s(2.4),s(3.0)]) for(let i=0;i<120;i++){const r=Q.make({name:'Ada',ev:'3×3',ms:t,prev:hist,pen:'0',total:9});ok(r.text&&!/[{}]/.test(r.text)&&!/undefined|NaN|null/.test(r.text),'clean text: '+r.text);
  const m=r.text.match(/about (\d+\.\d\d)s/);if(m)ok(m[1]==='2.51','quoted record is 2.51: '+r.text)}
const r7=Q.make({name:'Ada',ev:'Pyra',ms:s(0.2),prev:hist,pen:'0',total:9});const m7=r7.text.match(/about (\d+\.\d\d)s/);ok(!m7||m7[1]==='0.73','Pyra quotes its own record: '+r7.text);ok(!/\bPyra\b/.test(r7.text),'Pyra is never shown as the short code: '+r7.text);
const r8=Q.make({name:'Ada',ev:'Mega',ms:s(3),prev:[],pen:'0',total:1});const m8=r8.text.match(/about (\d+\.\d\d)s/);ok(!m8||m8[1]==='21.04','Mega quotes its own record: '+r8.text);ok(!/Mega\b(?!minx)/.test(r8.text),'Mega is never shown as the short code: '+r8.text);
const med=Q.make({name:'Ada',ev:'3×3',ms:s(5),prev:[s(30),s(31),s(32),s(29),s(30)],pen:'0',total:9});
console.log('sample, 0.7 on 3x3  :',Q.make({name:'Ada',ev:'3×3',ms:s(0.7),prev:hist,pen:'0',total:9}).text);
console.log('sample, 2.4 on 3x3  :',Q.make({name:'Ada',ev:'3×3',ms:s(2.4),prev:hist,pen:'0',total:9}).text);
console.log('sample, 3.0 on 3x3  :',Q.make({name:'Ada',ev:'3×3',ms:s(3.0),prev:hist,pen:'0',total:9}).text);
console.log('sample, 5 s vs 30 s :',med.text);
console.log(n+' record checks passed; total comment lines now',Q.count());
