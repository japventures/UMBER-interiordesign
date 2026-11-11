const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),app=read('app.js');
const match=app.match(/const PROJECT_INFO=(.*);\nfunction project/),projects=JSON.parse(match[1]);
test('each project has developed bilingual intent with matching prerendered copy',()=>{
 assert.equal(Object.keys(projects).length,8);
 for(const [slug,row] of Object.entries(projects))for(const [prefix,index] of [['',4],['es/',5]]){
  assert.ok(row[index].split(/\s+/).length>=45,slug+' needs developed intent');
  const text=row[index].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  assert.ok(read(prefix+slug+'/index.html').includes(text),prefix+slug+' static/runtime parity');
 }
 assert.ok(!projects['portfolio-1'][4].includes('Tapalpa'));
 const data=JSON.parse(read('site-data.js').replace(/^window.UMBER_DATA=/,'').replace(/;\s*$/,''));
 assert.equal(data.projects.find(p=>p.slug==='portfolio-1').paragraphs[0],projects['portfolio-1'][4]);
});
test('available brand webfonts are bundled with licenses and shared by public and portal controls',()=>{
 const css=read('styles.css');assert.match(css,/@font-face\{font-family:'Montserrat'/);assert.match(css,/@font-face\{font-family:'Bebas Neue'/);
 for(const file of ['montserrat-variable.woff2','bebas-neue.woff2'])assert.equal(fs.readFileSync(path.join(root,'assets/fonts',file)).subarray(0,4).toString(),'wOF2');
 for(const file of ['montserrat-OFL.txt','bebasneue-OFL.txt'])assert.match(read('assets/fonts/'+file),/SIL OPEN FONT LICENSE/);
 for(const file of ['styles.css','portal.css'])assert.doesNotMatch(read(file),/font[^;{}]*(?:Arial|Helvetica|Georgia)/);
 assert.match(css,/Albra Sans Bold is still unavailable/,'Do not represent provisional display typography as complete');
});
