/* Offline-only rendering: synthetic origin intercepted in memory, no listening server,
 * no external requests, no account session and no live Supabase configuration. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),origin='https://umber-qa.invalid',screenshots=process.env.SCREENSHOT_DIR;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.webp':'image/webp','.woff2':'font/woff2','.png':'image/png','.svg':'image/svg+xml'};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium'});
 try{
  for(const width of [390,1440]){
   const context=await browser.newContext({viewport:{width,height:900},serviceWorkers:'block'}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await context.route('**/*',async route=>{
    const u=new URL(route.request().url());if(u.origin!==origin)return route.abort();
    let name=decodeURIComponent(u.pathname);if(!path.extname(name))name=name.replace(/\/$/,'')+'/index.html';
    const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep))return route.fulfill({status:403,body:''});
    if(name==='/portal-config.js')return route.fulfill({contentType:'text/javascript',body:'window.UMBER_PORTAL_CONFIG={enabled:false};'});
    try{return route.fulfill({contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});}catch{return route.fulfill({status:404,body:''});}
   });
   await page.goto(origin+'/es/admin/demo/');await page.locator('[data-up-tab="workflow"]').click();
   assert.equal(await page.locator('#up-workflow-phase option').count(),5);
   const check=async label=>{await page.evaluate(async()=>{await document.fonts.ready;return true;});const d=await page.evaluate(()=>({body:document.documentElement.scrollWidth,width:innerWidth}));assert.ok(d.body<=d.width+1,label+' overflows '+JSON.stringify(d));if(screenshots){fs.mkdirSync(screenshots,{recursive:true});await page.screenshot({path:path.join(screenshots,`five-stage-${width}-${label}.png`),fullPage:true});}};
   for(const phase of ['intake','engagement','concept','technical','implementation']){await page.locator('#up-workflow-phase').selectOption(phase);await check(phase);}
   await page.locator('#up-workflow-phase').selectOption('concept');assert.equal(await page.locator('[data-up-guided="model_3d"]').isDisabled(),true);
   const upload=async slot=>{await page.locator(`[data-up-guided="${slot}"]`).click();await page.locator('dialog input[name="room"]').fill('Sala · simulación');await page.getByRole('button',{name:'Simular carga',exact:true}).click();await page.locator('#up-dialog').waitFor({state:'hidden'});};
   await page.locator('#up-workflow-phase').selectOption('engagement');await upload('agreement');await upload('advance');
   const confirm=async()=>{await page.locator('[data-up-confirmation]').click();await page.locator('dialog textarea[name="note"]').fill('Confirmación ficticia para revisión visual, sin pago ni aprobación real');await page.getByRole('button',{name:'Registrar confirmación',exact:true}).click();await page.locator('#up-dialog').waitFor({state:'hidden'});};
   await confirm();await page.locator('#up-workflow-phase').selectOption('concept');await upload('plans_2d');await upload('moodboard');await upload('lookfeel_approval');assert.equal(await page.locator('[data-up-guided="model_3d"]').isDisabled(),true);await confirm();assert.equal(await page.locator('[data-up-guided="model_3d"]').isEnabled(),true);await upload('model_3d');await check('confirmed-concept');await upload('moodboard');assert.equal(await page.locator('[data-up-guided="renders"]').isDisabled(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  console.log('PASS: 390/1440 rendering, five stages, no page overflow, draft upload simulation, separate confirmations and reapproval after new moodboard; all network intercepted.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
