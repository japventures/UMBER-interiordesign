// Fully offline, deterministic Formspree contract tests. No live submissions.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');
const source=read('app.js');
const endpoint='https://formspree.io/f/mzerpbpg';
function fixture(){
 const field=(name,value,type='text',required=true)=>({name,value,type,required,maxLength:200,checked:false,message:'',get validity(){return {typeMismatch:type==='email'&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.value)};},setCustomValidity(message){this.message=message;}});
 const inputs=[field('Full Name / Company Name','Example QA'),field('Last name','','text',false),field('Project Address','123 Example Street'),field('Project City','Example city'),field('Phone','+1 (832) 555-0100','tel'),field('email','qa@example.invalid','email'),field('Approximate Square Footage','125.5','number'),field('How did you hear about us?','QA'),field('message','Fictional local test','textarea',false),field('_gotcha','','text',false)];
 const types=[field('type','Residential','checkbox',false),field('type','Commercial','checkbox',false)];types[0].checked=true;
 const status={textContent:''},button={disabled:true,textContent:''},fieldset={disabled:true},unavailable={hidden:false},listeners={},timeline=[],attributes={};
 const get=name=>inputs.find(input=>input.name===name);
 const form={noValidate:false,resets:0,inputs,types,querySelector(selector){return {'.contact-fields':fieldset,'.form-status':status,'.form-unavailable':unavailable,'button[type=submit]':button,'input[name="Phone"]':get('Phone'),'input[name="Approximate Square Footage"]':get('Approximate Square Footage'),'[name="_gotcha"]':get('_gotcha')}[selector];},querySelectorAll(selector){return selector==='input[name="type"]'?types:selector==='input:not([type=hidden]),textarea'?[...inputs,...types]:inputs;},addEventListener(name,fn){listeners[name]=fn;timeline.push(name);},setAttribute(name,value){attributes[name]=value;},reportValidity(){return ![...inputs,...types].some(input=>input.message);},reset(){this.resets++;for(const input of inputs)input.value='';for(const input of types)input.checked=false;}};
 return {form,get,types,status,button,fieldset,unavailable,listeners,timeline,attributes};
}
function harness(locale='en',fetchImpl=async()=>({ok:true,status:200,json:async()=>({ok:true,next:'/thanks'})})){
 const forms=[],calls=[],timers=new Map();let nextTimer=0;
 class FormDataMock extends Map{constructor(form){super();assert.equal(form.querySelector('.contact-fields').disabled,false);for(const input of form.inputs)this.set(input.name,input.value);this.types=form.types.filter(t=>t.checked).map(t=>t.value);}*[Symbol.iterator](){yield*super[Symbol.iterator]();for(const value of this.types)yield ['type',value];}}
 const context=vm.createContext({ui:(en,es)=>locale==='es'?es:en,document:{querySelectorAll:()=>forms},FormData:FormDataMock,AbortController,fetch:async(...args)=>{calls.push(args);return fetchImpl(...args);},setTimeout(fn,delay){timers.set(++nextTimer,{fn,delay});return nextTimer;},clearTimeout(id){timers.delete(id);}});
 vm.runInContext(source.slice(source.indexOf('const field='),source.indexOf('function closePhotoOnNavigation()')),context);
 const f=fixture();forms.push(f.form);context.bindContactForm(f.form);
 const submit=async(target=f)=>{let prevented=false;const result=target.listeners.submit({preventDefault(){prevented=true;}});assert.equal(prevented,true);await result;};
 return {context,f,forms,calls,timers,submit};
}
for(const locale of ['en','es']){
 test(`${locale}: only ready handlers enable the form; validation messages are localized`,async()=>{
  const h=harness(locale),{f}=h;
  assert.deepEqual(f.timeline,['input','change','submit']);assert.equal(f.button.disabled,false);assert.equal(f.fieldset.disabled,false);assert.equal(f.unavailable.hidden,true);assert.equal(f.form.noValidate,true);
  for(const name of ['Full Name / Company Name','Project Address','Project City','Phone','email','Approximate Square Footage','How did you hear about us?']){
   const field=f.get(name),old=field.value;field.value='   ';await h.submit();assert.match(field.message,locale==='es'?/Completa/:/Complete/);assert.equal(h.calls.length,0);field.value=old;
  }
  f.get('email').value='invalid';await h.submit();assert.match(f.get('email').message,locale==='es'?/correo/:/email/);f.get('email').value='qa@example.invalid';
  for(const bad of ['-1','0','NaN','Infinity']){f.get('Approximate Square Footage').value=bad;await h.submit();assert.match(f.get('Approximate Square Footage').message,locale==='es'?/superficie/:/surface area/);}
  f.get('Approximate Square Footage').value='0.25';
  for(const bad of ['abc','+1+2345678','123456','1234567890123456','1234567x']){f.get('Phone').value=bad;await h.submit();assert.match(f.get('Phone').message,locale==='es'?/teléfono/:/phone/);}
  f.get('Phone').value='+52 33 1234 5678';f.types.forEach(input=>input.checked=false);await h.submit();assert.match(f.types[0].message,locale==='es'?/Selecciona/:/Select/);
  f.types[1].checked=true;f.get('message').value='x'.repeat(201);await h.submit();assert.match(f.get('message').message,locale==='es'?/Reduce/:/shorten/);assert.equal(h.calls.length,0);
 });
 test(`${locale}: POST preserves multiple types; only explicit accepted JSON clears values`,async()=>{
  const h=harness(locale);h.f.types[1].checked=true;
  await h.submit();assert.equal(h.calls.length,1);
  const [url,options]=h.calls[0];assert.equal(url,endpoint);assert.equal(options.method,'POST');assert.deepEqual({...options.headers},{Accept:'application/json'});assert.equal(options.credentials,'omit');assert.equal(options.redirect,'error');assert.equal(options.referrerPolicy,'no-referrer');assert.deepEqual(options.body.types,['Residential','Commercial']);assert.equal(options.body.get('email'),'qa@example.invalid');
  assert.equal(h.f.form.resets,1);assert.equal(h.f.get('email').value,'');assert.match(h.f.status.textContent,locale==='es'?/Tu solicitud se ha enviado/:/Your request was submitted/);assert.equal(h.f.button.disabled,false);assert.equal(h.f.attributes['aria-busy'],'false');assert.equal(h.timers.size,0);
 });
 test(`${locale}: documented next-only response confirms acceptance without redirecting`,async()=>{
  const h=harness(locale,async()=>({ok:true,status:200,json:async()=>({next:'/thanks?language=en'})}));await h.submit();assert.equal(h.f.form.resets,1);assert.equal(h.calls.length,1);assert.equal(h.f.status.textContent,h.context.contactMessage('success'));
 });
 for(const [name,response,message] of [
  ['validation',{ok:false,status:422,json:async()=>({errors:[{message:'unsafe raw detail'}]})},'rejected'],
  ['rate limit',{ok:false,status:429,json:async()=>({})},'limited'],
  ['server failure',{ok:false,status:503,json:async()=>({ok:true})},'uncertain'],
  ['missing acknowledgment',{ok:true,status:200,json:async()=>({})},'uncertain'],
  ['contradictory acknowledgment',{ok:true,status:200,json:async()=>({ok:false,next:'/thanks'})},'uncertain'],
  ['malformed errors',{ok:true,status:200,json:async()=>({ok:true,errors:{message:'bad'}})},'uncertain'],
  ['API errors',{ok:true,status:200,json:async()=>({ok:true,errors:[{message:'bad'}]})},'uncertain'],
  ['HTML/challenge',{ok:true,status:200,json:async()=>{throw Error('Unexpected HTML');}},'uncertain']
 ])test(`${locale}: ${name} preserves inputs and never claims success`,async()=>{
  const h=harness(locale,async()=>response);await h.submit();assert.equal(h.f.form.resets,0);assert.equal(h.f.get('email').value,'qa@example.invalid');assert.equal(h.f.button.disabled,false);assert.equal(h.calls.length,1);assert.equal(h.f.status.textContent,h.context.contactMessage(message));assert.ok(!h.f.status.textContent.includes('unsafe raw detail'));
 });
 test(`${locale}: network failure is uncertain, retained and never retried automatically`,async()=>{
  const h=harness(locale,async()=>{throw new TypeError('Failed to fetch');});await h.submit();assert.equal(h.f.form.resets,0);assert.equal(h.calls.length,1);assert.equal(h.f.status.textContent,h.context.contactMessage('uncertain'));assert.equal(h.f.button.disabled,false);
 });
 test(`${locale}: timeout aborts without assuming non-delivery or retrying`,async()=>{
  const h=harness(locale,(_url,{signal})=>new Promise((_resolve,reject)=>signal.addEventListener('abort',()=>reject(Error('aborted')))));
  const pending=h.submit();assert.equal(h.f.fieldset.disabled,true);const timer=[...h.timers.values()][0];assert.equal(timer.delay,20000);timer.fn();await pending;assert.equal(h.calls.length,1);assert.equal(h.f.form.resets,0);assert.equal(h.f.status.textContent,h.context.contactMessage('uncertain'));
 });
 test(`${locale}: repeated submit and SPA replacement cannot start a parallel request`,async()=>{
  let resolve;const h=harness(locale,()=>new Promise(r=>resolve=r));const pending=h.submit();await h.submit();assert.equal(h.calls.length,1);assert.equal(h.f.fieldset.disabled,true);
  const next=fixture();next.form.reset();h.forms.splice(0,1,next.form);h.context.bindContactForm(next.form);assert.equal(next.get('email').value,'qa@example.invalid');assert.equal(next.fieldset.disabled,true);assert.equal(next.status.textContent,h.context.contactMessage('sending'));await h.submit(next);assert.equal(h.calls.length,1);
  resolve({ok:true,status:200,json:async()=>({ok:true})});await pending;assert.equal(next.fieldset.disabled,false);assert.equal(next.status.textContent,h.context.contactMessage('success'));assert.equal(h.f.form.resets,1);assert.equal(next.get('email').value,'');
 });
 for(const failure of ['validation','timeout'])test(`${locale}: empty SPA form restores draft and checked types after ${failure}`,async()=>{
  let settle;const h=harness(locale,(_url,{signal})=>new Promise((resolve,reject)=>{settle=()=>resolve({ok:false,status:422});signal.addEventListener('abort',()=>reject(Error('aborted')));}));h.f.types[1].checked=true;
  const pending=h.submit(),next=fixture();next.form.reset();h.forms.splice(0,1,next.form);h.context.bindContactForm(next.form);
  assert.equal(next.get('message').value,'Fictional local test');assert.equal(next.types.filter(t=>t.checked).length,2);assert.equal(next.get('email').value,'qa@example.invalid');
  if(failure==='timeout')[...h.timers.values()][0].fn();else settle();await pending;
  assert.equal(next.fieldset.disabled,false);assert.equal(next.get('email').value,'qa@example.invalid');assert.equal(next.types.filter(t=>t.checked).length,2);assert.equal(h.calls.length,1);
  next.get('Project City').value='Corrected city';next.listeners.input();const third=fixture();third.form.reset();h.context.bindContactForm(third.form);assert.equal(third.get('Project City').value,'Corrected city');
 });
 test(`${locale}: honeypot blocks submission without fabricated success`,async()=>{
  const h=harness(locale);h.f.get('_gotcha').value='bot';await h.submit();assert.equal(h.calls.length,0);assert.equal(h.f.form.resets,0);assert.equal(h.f.status.textContent,'');
 });
}
test('Missing browser API leaves the form closed, with contact email visible',()=>{
 const h=harness();h.context.fetch=undefined;const next=fixture();h.context.bindContactForm(next.form);assert.equal(next.fieldset.disabled,true);assert.equal(next.button.disabled,true);assert.equal(next.unavailable.hidden,false);assert.equal(next.listeners.submit,undefined);
});
test('Runtime and static ES/EN markup use safe POST defaults and no-JS protection',()=>{
 for(const locale of ['en','es']){
  const context=vm.createContext({ui:(en,es)=>locale==='es'?es:en});vm.runInContext(read('i18n.js'),context);
  for(const prefix of ['const esc=','const field=','function contact()'])vm.runInContext(source.split('\n').find(line=>line.startsWith(prefix)),context);
  const runtime=context.contact(),staticPage=read((locale==='es'?'es/':'')+'contact/index.html');
  assert.equal(staticPage.match(/<main id="main">([\s\S]*?)<\/main>/)[1],runtime);
  assert.match(runtime,/<form data-contact method="post" action="https:\/\/formspree.io\/f\/mzerpbpg"/);assert.match(runtime,/<fieldset class="contact-fields" disabled>/);assert.match(runtime,/<button class="outline" type="submit" disabled>/);assert.match(runtime,/name="email" type="email" required/);assert.match(runtime,/name="language" value="(?:en|es)"/);assert.match(runtime,/name="_gotcha"/);assert.match(runtime,/aria-live="polite"/);assert.match(runtime,/mailto:info@umberinteriordesign.com/);assert.ok(!runtime.includes('Preview only'));
 }
 assert.ok(!source.includes('localStorage'));assert.ok(!source.includes('bindContactPreview'));
});
