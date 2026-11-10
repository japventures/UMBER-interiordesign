// Offline regression checks. No browser, network, real data or backend calls.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function harness(locale='en'){
 const main={innerHTML:''},events={},focus=[];
 const control=()=>({setAttribute(){},classList:{remove(){}},addEventListener(){}});
 const menu=control(),nav=control(),image={src:'',alt:''},counter={textContent:''};
 const box={open:false,closes:0,close(){this.open=false;this.closes++;},showModal(){this.open=true;},addEventListener(){},querySelector(selector){return selector==='img'?image:selector==='.counter'?counter:control();}};
 const document={title:'',documentElement:{lang:locale},body:{classList:{toggle(){}}},addEventListener(name,fn){events[name]=fn;},querySelectorAll(){return [];},querySelector(selector){
  if(selector==='main')return main;if(selector==='#menu')return menu;if(selector==='#nav')return nav;if(selector==='#lightbox')return box;
  const match=selector.match(/^\[data-portfolio-filter="(.*)"\]$/);
  if(match&&main.innerHTML.includes(`data-portfolio-filter="${match[1]}"`))return {focus(options){focus.push({value:match[1],options});}};
  throw Error('Unexpected selector: '+selector);
 }};
 const context={window:{UMBER_DATA:{projects:[],posts:[]},scrollTo(){}},document,location:{pathname:'/UMBER-interiordesign/'+(locale==='es'?'es/':'')+'portfolio',origin:'https://qa.example.invalid'},history:{},UMBERPortal:{mount(){}},applyLanguage(){},translateText(value){return value;},clearInterval(){},setInterval(){},matchMedia(){return {matches:false}},URL};
 vm.createContext(context);
 vm.runInContext(fs.readFileSync(path.join(root,'config.js'),'utf8'),context);
 // Skip only the final auto-render. Tests call the real render and handlers.
 const source=fs.readFileSync(path.join(root,'app.js'),'utf8');
 assert.match(source,/render\(\);\s*$/);
 vm.runInContext(source.replace(/render\(\);\s*$/,''),context);
 return {context,events,box,main,focus};
}
for(const locale of ['en','es']){
 test(`${locale}: filters retain focus after real rendering`,()=>{
  const h=harness(locale);
  for(const value of ['commercial','residential','all']){
   const target={closest(selector){return selector==='[data-portfolio-filter]'?{dataset:{portfolioFilter:value}}:null;}};
   h.events.click({target});assert.equal(h.focus.at(-1).value,value);assert.equal(h.focus.at(-1).options.preventScroll,true);
   assert.match(h.main.innerHTML,new RegExp(`data-portfolio-filter="${value}" aria-pressed="true"`));
  }
 });
 test(`${locale}: history navigation closes an open photo dialog`,()=>{
  const h=harness(locale);h.box.open=true;h.context.window.onpopstate();assert.equal(h.box.open,false);assert.equal(h.box.closes,1);assert.match(h.main.innerHTML,/portfolio-filters/);
  h.context.render();assert.equal(h.box.closes,1,'Closed dialog is not closed repeatedly');
 });
}
test('Prerendered contact pages fail closed without JavaScript',()=>{
 for(const file of ['contact/index.html','es/contact/index.html'])assert.match(fs.readFileSync(path.join(root,file),'utf8'),/<button class="outline" type="submit" disabled>/);
 const h=harness();assert.match(h.context.contact(),/<button class="outline" type="submit" disabled>/);
});
