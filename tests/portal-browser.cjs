// Optional local-only browser smoke: npm install --no-save playwright (or existing runtime).
const {chromium}=require('playwright'),http=require('node:http'),fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),prefix='/UMBER-interiordesign';
const server=http.createServer((req,res)=>{
 let name=decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(new RegExp('^'+prefix),'');
 if(name.endsWith('/'))name+='index.html';
 const file=path.resolve(root,'.'+name);if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 if(name==='/portal-config.js'){res.setHeader('Content-Type','text/javascript');res.end('window.UMBER_PORTAL_CONFIG={enabled:false};');return;}
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html','.svg':'image/svg+xml','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.writeHead(404).end();}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
 let count=0;const errors=[];
 try{
  for(const width of [375,390,768,1440]){
   const page=await browser.newPage({viewport:{width,height:900}});
   // External CDN/Google/Supabase requests are blocked; this test uses fictional demo only.
   await page.route('**/*',route=>route.request().url().startsWith(origin)?route.continue():route.abort());
   page.on('pageerror',e=>errors.push(e.message));
   for(const lang of ['/es','']){
    await page.goto(origin+prefix+lang+'/portal/demo/');await page.locator('[data-up-tab="overview"]').first().waitFor();
    for(const tab of ['overview','stages','calendar','documents','design','selections','invoices','updates','messages']){
     await page.locator(`.up-sidebar [data-up-tab="${tab}"]`).click();
     assert.equal(await page.locator(`.up-sidebar [data-up-tab="${tab}"]`).getAttribute('aria-current'),'page');
     const dimensions=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
     assert.ok(dimensions.scroll<=dimensions.viewport+1,`${lang}/${tab} width ${width}: overflow ${JSON.stringify(dimensions)}`);
     assert.equal(await page.getByText('Presupuesto interno de ejemplo').count(),0);
     count++;
     if(process.env.SCREENSHOT_DIR&&lang==='/es'&&['overview','selections','calendar'].includes(tab))await page.screenshot({path:path.join(process.env.SCREENSHOT_DIR,`portal-${width}-${tab}.png`),fullPage:true});
    }
    await page.locator('[data-up-role]').click();await page.locator('.up-sidebar [data-up-tab="team"]').click();
    assert.equal(await page.getByText('Presupuesto interno de ejemplo').count(),1);
   }
   await page.close();
  }
  assert.deepEqual(errors,[]);console.log(`PASS: ${count} mobile/tablet/desktop section checks, EN/ES, no body overflow, client draft isolation, team draft visibility, no page errors; external requests blocked.`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1}).finally(()=>server.close());
