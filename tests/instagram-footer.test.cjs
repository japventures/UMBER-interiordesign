const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function shells(dir=root){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.name==='.git'?[]:e.isDirectory()?shells(path.join(dir,e.name)):e.name.endsWith('.html')?[path.join(dir,e.name)]:[])}
test('every public footer contains one localized invitation with the confirmed Instagram profile',()=>{
 const files=shells().filter(f=>fs.readFileSync(f,'utf8').includes('<footer>'));assert.equal(files.length,47);
 for(const f of files){const s=fs.readFileSync(f,'utf8'),block=s.match(/<section class="instagram-follow"[\s\S]*?<\/section>/g);assert.equal(block?.length,1,f);const es=path.relative(root,f).startsWith('es/');assert.ok(block[0].includes(es?'Sigue al estudio en Instagram':'Follow our studio on Instagram'),f);assert.match(block[0],/href="https:\/\/www\.instagram\.com\/umberinteriordesign\/" target="_blank" rel="noopener noreferrer" data-native/);assert.ok(!block[0].includes('<iframe'));}
});
test('Instagram invitation has EN/ES mappings for SPA language changes',()=>{
 const context=vm.createContext({});vm.runInContext(fs.readFileSync(path.join(root,'i18n.js'),'utf8'),context);
 assert.equal(context.translateText('Follow our studio on Instagram'),'Sigue al estudio en Instagram');
 assert.equal(context.translateText('Projects, details and inspiration from UMBER.'),'Proyectos, detalles e inspiración de UMBER.');
});
