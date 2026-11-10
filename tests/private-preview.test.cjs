const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function fixture(download=async()=>new Blob([Uint8Array.from([255,216,255,0])])){
 const events={},nodes={},created=[],revoked=[];let inline=[],calls=0;
 const mount={_html:'',get innerHTML(){return this._html},set innerHTML(v){this._html=v;for(const n of inline)n.isConnected=false;inline=[...v.matchAll(/data-up-inline="([^"]+)"/g)].map(m=>{const status={textContent:'',hidden:false},img={hidden:true};Object.defineProperty(img,'src',{set(v){this.value=v;queueMicrotask(()=>this.onload?.());}});return {dataset:{upInline:m[1]},isConnected:true,querySelector:s=>s==='img'?img:status,img,status};});}};
 const classList=()=>({values:new Set(),add(v){this.values.add(v)},remove(v){this.values.delete(v)},contains(v){return this.values.has(v)}});
 const doc={body:{classList:classList(),append(d){d.isConnected=true;nodes[d.id]=d}},getElementById:id=>id==='umber-portal'?mount:nodes[id]||null,addEventListener:(e,f)=>events[e]=f,querySelector:()=>null,querySelectorAll:()=>inline,createElement(tag){const d={tagName:tag,classList:classList(),isConnected:true,setAttribute(){},append(x){this.children??=[];this.children.push(x)},replaceChildren(){this.children=[]},addEventListener(){},showModal(){},close(){this.isConnected=false;delete nodes[this.id]},remove(){this.close()},querySelector(){return this.target??=( {children:[],replaceChildren(){this.children=[]},append(x){this.children.push(x)}} )}};return d;}};
 const entry={id:'entry-1',project_id:'a',kind:'render',title:'Private rendering',description:'',visibility:'client',status:'review',data:{drive_file_id:'fictional-file-12345',file_name:'render.jpg'}};
 const api={configured:()=>true,live:async()=>({user:{id:'client'},staff:false}),projects:async()=>[{id:'a',name:'A'},{id:'b',name:'B'}],projectData:async id=>({entries:id==='a'?[entry,{...entry,id:'hidden',visibility:'team'}]:[],comments:[],decisions:[],members:[{project_id:id,user_id:'client',role:'client'}]}),scopeProjectData:(_,r)=>r,fileUrl:()=>null,driveUrl:()=>null,downloadEntry:async id=>{calls++;return download(id)},client:async()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}),signOut:async()=>({localOnly:false})};
 const context={window:{UMBER_BASE:'',UMBERPortalService:api},umberRoutePath:p=>p,document:doc,location:{pathname:'/portal/',hash:''},URL:{createObjectURL(blob){const u='blob:test-'+created.length;created.push({url:u,type:blob.type});return u},revokeObjectURL:u=>revoked.push(u)},Intl,Date,Blob,Uint8Array,queueMicrotask,setTimeout,clearTimeout};
 vm.createContext(context);vm.runInContext(fs.readFileSync(path.join(__dirname,'../portal.js'),'utf8'),context);
 async function click(selector,dataset={}){await events.click({target:{closest:()=>({dataset,matches:s=>s===selector})}});await tick();}
 return {P:context.window.UMBERPortal,mount,nodes,entry,created,revoked,get inline(){return inline},get calls(){return calls},click,async changeProject(id){await events.change({target:{id:'up-project',value:id}});await tick();}};
}
const tick=async()=>{await new Promise(r=>setImmediate(r));await new Promise(r=>setImmediate(r));};
test('preview recognizes supported bytes and refuses HTML, SVG and oversized text',async()=>{
 const {P}=fixture();
 for(const [bytes,name,mime] of [[Uint8Array.from([137,80,78,71,13,10,26,10]),'x.png','image/png'],[Uint8Array.from([255,216,255]),'x.jpg','image/jpeg'],['RIFF1234WEBP','x.webp','image/webp'],['%PDF-1.7','x.pdf','application/pdf'],['item,amount\nA,1','x.csv','text/plain']])assert.equal(await P.previewMime(new Blob([bytes]),name),mime);
 for(const [data,name] of [['<html>bad</html>','x.jpg'],['<svg/>','x.svg'],['a\0b','x.csv'],['x'.repeat(512*1024+1),'x.txt']])assert.equal(await P.previewMime(new Blob([data]),name),null);
});
test('renders load inline only in design, share one private fetch with viewer, and clear on sign-out',async()=>{
 const f=fixture();await f.P.mount('/portal');assert.equal(f.calls,0);await f.click('[data-up-tab]',{upTab:'design'});assert.equal(f.calls,1);assert.equal(f.inline.length,1,'hidden team rendering excluded');assert.equal(f.inline[0].img.hidden,false);assert.equal(f.created[0].type,'image/jpeg');assert.ok(f.mount.innerHTML.includes('data-up-preview="entry-1"'));assert.ok(f.mount.innerHTML.includes('data-up-download="entry-1"'));
 await f.click('[data-up-preview]',{upPreview:'entry-1'});assert.equal(f.calls,1);assert.equal(f.nodes['up-dialog'].target.children[0].tagName,'img');await f.click('[data-up-logout]');assert.equal(f.revoked.length,1);assert.equal(f.nodes['up-dialog'],undefined);
});
test('pending image response is discarded after project switch',async()=>{
 let resolve;const pending=new Promise(r=>resolve=r),f=fixture(()=>pending);await f.P.mount('/portal');await f.click('[data-up-tab]',{upTab:'design'});await f.changeProject('b');resolve(new Blob([Uint8Array.from([255,216,255])]));await tick();assert.equal(f.created.length,0);assert.ok(!f.mount.innerHTML.includes('Private rendering'));
});
test('PDF opens in a private inline viewer; text is rendered literally',async()=>{
 const pdf=fixture(async()=>new Blob(['%PDF-1.7\nfixture']));pdf.entry.kind='document';pdf.entry.data.file_name='plan.pdf';await pdf.P.mount('/portal');await pdf.click('[data-up-preview]',{upPreview:'entry-1'});const viewer=pdf.nodes['up-dialog'].target.children[0];assert.equal(viewer.tagName,'iframe');assert.equal(pdf.created[0].type,'application/pdf');assert.match(viewer.src,/^blob:/);
 const csv=fixture(async()=>new Blob(['<img src=x onerror=alert(1)>']));csv.entry.kind='document';csv.entry.data.file_name='budget.csv';await csv.P.mount('/portal');await csv.click('[data-up-preview]',{upPreview:'entry-1'});const text=csv.nodes['up-dialog'].target.children[0];assert.equal(text.tagName,'pre');assert.equal(text.textContent,'<img src=x onerror=alert(1)>');assert.equal(csv.created.length,0);
});
test('unsupported preview fails safely while download remains available',async()=>{
 const f=fixture(async()=>new Blob(['<html>not an image</html>']));await f.P.mount('/portal');await f.click('[data-up-tab]',{upTab:'design'});assert.equal(f.created.length,0);assert.match(f.inline[0].status.textContent,/Preview is unavailable/);assert.ok(f.mount.innerHTML.includes('data-up-download="entry-1"'));
});
