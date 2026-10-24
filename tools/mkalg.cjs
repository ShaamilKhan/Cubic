const fs=require('fs');
const sets=JSON.parse(fs.readFileSync('C:/Projects/Cubetimer/source/algorithms.json','utf8')).filter(x=>['oll','pll','coll'].includes(x.id)).map(s=>({id:s.id,cases:s.cases.map(c=>({algs:c.algs.map(a=>({moves:a.moves}))}))}));
fs.writeFileSync('C:/Projects/Cubetimer/app/algsets.js','window.ALGSETS='+JSON.stringify(sets)+';\n');
console.log((fs.statSync('C:/Projects/Cubetimer/app/algsets.js').size/1024|0)+' KB');
// drop the now-unused fixed lists
for(const f of ['scrambles.js','review.js'])try{fs.unlinkSync('C:/Projects/Cubetimer/app/'+f)}catch(e){}
