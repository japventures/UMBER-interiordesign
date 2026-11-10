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
function contactFixture(){
 const input=(value='')=>({value,message:'',setCustomValidity(message){this.message=message;}});
 const phone=input('+1 (832) 555-0100'),area=input('125.5'),types=[input(),input()];types[0].checked=true;types[1].checked=false;
 const status={textContent:''},button={disabled:true},listeners={},timeline=[];
 const form={querySelector(selector){return {'input[name="Phone"]':phone,'input[name="Approximate Square Footage"]':area,'.form-status':status,'button[type=submit]':button}[selector];},querySelectorAll(){return types;},addEventListener(name,fn){listeners[name]=fn;timeline.push(name);},reportValidity(){return ![phone,area,...types].some(field=>field.message);}};
 return {form,phone,area,types,status,button,listeners,timeline};
}
for(const locale of ['en','es']){
 test(`${locale}: contact validates positive area, phone and project type`,()=>{
  const {context}=harness(locale),f=contactFixture();
  context.validateContactForm(f.form);assert.equal(f.form.reportValidity(),true);
  for(const value of ['-10','0','NaN','Infinity']){f.area.value=value;context.validateContactForm(f.form);assert.notEqual(f.area.message,'');}
  f.area.value='12.75';context.validateContactForm(f.form);assert.equal(f.area.message,'');
  for(const value of ['abc','   ','+1+2345678','123456','1234567890123456','1234567x']){f.phone.value=value;context.validateContactForm(f.form);assert.notEqual(f.phone.message,'');}
  for(const value of ['+52 33 1234 5678','(832) 555-0100','1234567']){f.phone.value=value;context.validateContactForm(f.form);assert.equal(f.phone.message,'');}
  f.types.forEach(input=>input.checked=false);context.validateContactForm(f.form);assert.notEqual(f.types[0].message,'');
  assert.match(f.types[0].message,locale==='es'?/Selecciona/:/Select/);
  f.types[1].checked=true;context.validateContactForm(f.form);assert.equal(f.types[0].message,'');
 });
 test(`${locale}: preview prevents all submission and enables only after handlers`,()=>{
  const {context}=harness(locale),f=contactFixture();context.bindContactPreview(f.form);
  assert.deepEqual(f.timeline,['input','change','submit']);assert.equal(f.button.disabled,false);assert.equal(f.area.step,'any');assert.equal(f.area.min,'0');
  let prevented=0;f.area.value='-1';f.listeners.submit({preventDefault(){prevented++;}});assert.equal(prevented,1);assert.equal(f.status.textContent,'');
  f.area.value='80.25';f.listeners.input();f.listeners.change();f.listeners.submit({preventDefault(){prevented++;}});assert.equal(prevented,2);assert.match(f.status.textContent,locale==='es'?/no se ha enviado/:/has not been sent/);
 });
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
