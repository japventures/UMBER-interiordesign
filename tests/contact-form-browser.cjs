// Real Chromium with every request intercepted. Never forwards traffic to Formspree.
// CHROMIUM_PATH=/usr/bin/chromium node tests/contact-form-browser.cjs
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),endpoint='https://formspree.io/f/mzerpbpg';
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp'};
async function fixture(browser,origin,prefix,{javaScriptEnabled=true,blockApp=false,viewport={width:1440,height:1000}}={}){
 const context=await browser.newContext({javaScriptEnabled,viewport}),requests=[],unexpected=[],errors=[];
 let mode='success',held;
 await context.route('**/*',async route=>{
  const request=route.request(),url=new URL(request.url());
  if(url.href===endpoint){
   requests.push({url:request.url(),method:request.method(),data:request.postData(),headers:request.headers()});
   if(mode==='network')return route.abort('failed');
   const fulfill=(status,body)=>route.fulfill({status,headers:{'access-control-allow-origin':'*','content-type':'application/json'},body});
   if(mode==='delay'||mode==='delay-rejected'){const rejected=mode==='delay-rejected';held=()=>fulfill(rejected?422:200,JSON.stringify(rejected?{errors:[{message:'Rejected'}]}:{ok:true,next:'/thanks'}));return;}
   if(mode==='limited')return fulfill(429,JSON.stringify({errors:[{message:'Rate limit'}]}));
   if(mode==='rejected')return fulfill(422,JSON.stringify({errors:[{message:'Rejected'}]}));
   if(mode==='unknown')return fulfill(200,JSON.stringify({}));
   if(mode==='html')return route.fulfill({status:200,headers:{'access-control-allow-origin':'*','content-type':'text/html'},body:'<h1>Challenge</h1>'});
   return fulfill(200,JSON.stringify({ok:true,next:'/thanks'}));
  }
  if(url.origin!==origin){unexpected.push(url.href);return route.abort();}
  if(!url.pathname.startsWith(prefix+'/'))return route.fulfill({status:404,body:'Not mounted'});
  const local=url.pathname.slice(prefix.length);
  if(local==='/portal-config.js')return route.fulfill({contentType:'text/javascript',body:'window.UMBER_PORTAL_CONFIG={enabled:false};'});
  if(blockApp&&local==='/app.js')return route.abort();
  let file=path.resolve(root,'.'+local);
  if(!file.startsWith(root+path.sep))return route.fulfill({status:403,body:'Forbidden'});
  if(fs.existsSync(file)&&fs.statSync(file).isDirectory())file=path.join(file,'index.html');
  if(!fs.existsSync(file))return route.fulfill({status:404,body:'Missing'});
  return route.fulfill({status:200,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
 });
 const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
 return {context,page,requests,unexpected,errors,setMode:value=>mode=value,release:()=>held()};
}
async function fill(page){
 for(const [name,value] of [['Full Name / Company Name','Example QA'],['Project Address','123 Example Street'],['Project City','Example city'],['Phone','+1 (832) 555-0100'],['email','qa@example.invalid'],['Approximate Square Footage','125.5'],['How did you hear about us?','Mock test'],['message','Fictional local-only test']])await page.locator(`[name="${name}"]`).fill(value);
 await page.locator('[name="type"][value="Residential"]').check();await page.locator('[name="type"][value="Commercial"]').check();
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});let checks=0;
 try{
  for(const [origin,prefix] of [['https://umberinteriordesign.com',''],['https://japventures.github.io','/UMBER-interiordesign']])for(const locale of ['en','es'])for(const width of [1440,390]){
   const h=await fixture(browser,origin,prefix,{viewport:{width,height:1000}}),{page}=h,url=origin+prefix+(locale==='es'?'/es':'')+'/contact/';
   await page.goto(url);await page.waitForFunction(()=>!document.querySelector('.contact-fields').disabled);
   assert.equal(await page.locator('html').getAttribute('lang'),locale);assert.equal(await page.locator('[data-contact]').getAttribute('method'),'post');
   await page.locator('button[type=submit]').click();assert.equal(h.requests.length,0);assert.match(await page.locator('[name="email"]').evaluate(input=>input.validationMessage),locale==='es'?/Completa/:/Complete/);
   await fill(page);await page.locator('[name="Phone"]').fill('invalid');await page.locator('button[type=submit]').click();assert.equal(h.requests.length,0);assert.match(await page.locator('[name="Phone"]').evaluate(input=>input.validationMessage),locale==='es'?/teléfono/:/phone/);await page.locator('[name="Phone"]').fill('+1 832 555 0100');
   for(const mode of ['rejected','limited','unknown','html','network']){
    h.setMode(mode);const count=h.requests.length;await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('form[data-contact]').getAttribute('aria-busy')==='false');
    assert.equal(h.requests.length,count+1);assert.equal(await page.locator('[name="email"]').inputValue(),'qa@example.invalid');assert.equal(page.url(),url);assert.doesNotMatch(await page.locator('.form-status').innerText(),/Your request was submitted|Tu solicitud se ha enviado/);
   }
   h.setMode('delay');await page.locator('button[type=submit]').click();await page.waitForFunction(()=>document.querySelector('.contact-fields').disabled);
   const count=h.requests.length;await page.locator('form[data-contact]').evaluate(form=>form.dispatchEvent(new Event('submit',{cancelable:true})));assert.equal(h.requests.length,count);
   await h.release();await page.waitForFunction(()=>!document.querySelector('.contact-fields').disabled);assert.equal(await page.locator('[name="email"]').inputValue(),'');assert.match(await page.locator('.form-status').innerText(),locale==='es'?/Tu solicitud se ha enviado/:/Your request was submitted/);
   for(const request of h.requests){assert.equal(request.url,endpoint);assert.equal(request.method,'POST');assert.match(request.data,/name="email"\r\n\r\nqa@example.invalid/);assert.match(request.data,/Residential/);assert.match(request.data,/Commercial/);assert.equal(request.headers.referer,undefined);}
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);assert.deepEqual(h.unexpected,[]);assert.deepEqual(h.errors,[]);
   if(width===390&&prefix==='')await page.screenshot({path:`/tmp/umber-formspree-${locale}-mobile.png`,fullPage:true});
   checks+=14;await h.context.close();
  }
  // Language switches preserve values and prevent parallel sends, even after rejection.
  for(const mode of ['delay','delay-rejected']){const h=await fixture(browser,'https://umberinteriordesign.com','');await h.page.goto('https://umberinteriordesign.com/contact/');await fill(h.page);h.setMode(mode);await h.page.locator('button[type=submit]').click();await h.page.locator('[data-language=es]').click();assert.equal(await h.page.locator('.contact-fields').isDisabled(),true);assert.match(await h.page.locator('.form-status').innerText(),/Enviando/);assert.equal(await h.page.locator('[name=email]').inputValue(),'qa@example.invalid');assert.equal(await h.page.locator('[name=type]:checked').count(),2);await h.release();await h.page.waitForFunction(()=>!document.querySelector('.contact-fields').disabled);assert.match(await h.page.locator('.form-status').innerText(),mode==='delay'?/Tu solicitud se ha enviado/:/no pudo aceptar/);assert.equal(await h.page.locator('[name=email]').inputValue(),mode==='delay'?'':'qa@example.invalid');assert.equal(h.requests.length,1);assert.deepEqual(h.errors,[]);await h.context.close();checks+=7;}
  for(const locale of ['en','es'])for(const options of [{javaScriptEnabled:false},{blockApp:true}]){
   const h=await fixture(browser,'https://umberinteriordesign.com','',options);await h.page.goto('https://umberinteriordesign.com/'+(locale==='es'?'es/':'')+'contact/');assert.equal(await h.page.locator('.contact-fields').isDisabled(),true);assert.equal(await h.page.locator('[name="email"]').isDisabled(),true);assert.equal(await h.page.locator('button[type=submit]').isDisabled(),true);assert.equal(await h.page.locator('.form-unavailable').isVisible(),true);assert.equal(await h.page.locator('form').getAttribute('method'),'post');assert.equal(h.requests.length,0);await h.context.close();checks+=6;
  }
  console.log(`PASS: ${checks} browser checks with all traffic mocked; zero live submissions.`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
