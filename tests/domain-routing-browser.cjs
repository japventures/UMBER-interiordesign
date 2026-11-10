// Real Chromium, fully mocked origins. No external requests, credentials or email.
// CHROMIUM_PATH=/usr/bin/chromium node tests/domain-routing-browser.cjs
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '..');
const mounts = [
  ['https://umberinteriordesign.com', ''],
  ['https://japventures.github.io', '/UMBER-interiordesign']
];
const mime = {'.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp'};
function list(dir=root) {
  return fs.readdirSync(dir,{withFileTypes:true}).flatMap(item => item.name.startsWith('.') || ['tests','docs','supabase'].includes(item.name) ? [] : item.isDirectory() ? list(path.join(dir,item.name)) : [path.join(dir,item.name)]);
}
const pages=list().filter(file=>file.endsWith('/index.html') && fs.readFileSync(file,'utf8').includes('<base')).map(file=>'/'+path.relative(root,file).replaceAll(path.sep,'/').replace(/index\.html$/,''));
(async()=>{
  const browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_PATH?{executablePath:process.env.CHROMIUM_PATH}:{})});
  let checks=0;
  try{
    for(const [origin,prefix] of mounts){
      const errors=[],missing=[];
      const context=await browser.newContext();
      const serve = async route=>{
        const url=new URL(route.request().url());
        if(url.origin!==origin) return route.abort();
        if(!url.pathname.startsWith(prefix+'/')) {missing.push(url.pathname);return route.fulfill({status:404,body:'Not mounted'});}
        let local=url.pathname.slice(prefix.length);
        if(local==='/portal-config.js') return route.fulfill({contentType:'text/javascript',body:'window.UMBER_PORTAL_CONFIG={enabled:false};'});
        let file=path.resolve(root,'.'+local);
        if(!file.startsWith(root+path.sep))return route.fulfill({status:403,body:'Forbidden'});
        let status=200;
        if(fs.existsSync(file)&&fs.statSync(file).isDirectory()){
          if(!local.endsWith('/'))return route.fulfill({status:301,headers:{location:origin+prefix+local+'/'+url.search}});
          file=path.join(file,'index.html');
        }
        if(!fs.existsSync(file)){if(route.request().isNavigationRequest()){status=404;file=path.join(root,'404.html');}else{missing.push(local);return route.fulfill({status:404,body:'Missing'});}}
        return route.fulfill({status,contentType:mime[path.extname(file)]||'application/octet-stream',body:fs.readFileSync(file)});
      };
      await context.route('**/*', serve);
      const page=await context.newPage();page.on('pageerror',error=>errors.push(error.message));
      await page.clock.install({time:new Date('2026-11-09T16:00:00Z')});
      for(const route of pages){
        const response=await page.goto(origin+prefix+route);assert.equal(response.status(),200,route);
        const state=await page.evaluate(()=>({base:window.UMBER_BASE,site:window.UMBER_SITE_URL,lang:document.documentElement.lang,baseURI:document.baseURI,canonical:document.querySelector('[rel="canonical"]').href,robots:document.querySelector('[name="robots"]').content,main:document.querySelector('main').innerText,styles:document.styleSheets.length,links:[...document.querySelectorAll('header a[href],footer a[href]')].filter(a=>a.origin===location.origin).map(a=>a.pathname)}));
        assert.equal(state.base,prefix,route);assert.equal(state.site,origin+prefix,route);assert.equal(state.baseURI,origin+prefix+'/',route);
        assert.equal(state.lang,route.startsWith('/es/')?'es':'en',route);assert.match(state.robots,/noindex/,route);assert.ok(state.styles>=2,route);
        assert.equal(new URL(state.canonical).pathname.replace(/\/$/,''),(prefix+route).replace(/\/$/,''),route);
        assert.ok(!/Page not found|PÁGINA NO ENCONTRADA/.test(state.main),route);
        for(const href of state.links)assert.ok(href.startsWith(prefix+'/'),href);
        checks++;
      }
      // Deep load, language toggle, query-bearing SPA navigation, reload and back/forward.
      await page.goto(origin+prefix+'/es/services/index.html');
      assert.equal(await page.locator('html').getAttribute('lang'),'es');
      await page.locator('[data-language="en"]').click();
      assert.equal(new URL(page.url()).pathname,prefix+'/services');
      await page.locator('#nav a').filter({hasText:'CONTACT'}).click();
      assert.equal(await page.evaluate(()=>document.baseURI),origin+prefix+'/');
      await page.reload();assert.equal(await page.locator('html').getAttribute('lang'),'en');
      await page.evaluate(()=>{const a=document.createElement('a');a.href=window.UMBER_BASE+'/portfolio?source=qa';a.id='qa-query';a.textContent='QA';document.body.append(a);});
      await page.locator('#qa-query').click();assert.equal(new URL(page.url()).search,'?source=qa');
      await page.goBack();assert.match(new URL(page.url()).pathname,/\/contact\/$/);
      await page.goForward();assert.equal(new URL(page.url()).search,'?source=qa');
      checks+=7;
      for(const locale of ['', '/es']){
        // Callback landing preserves exact nonsecret fixture query/hash while moving to reset.
        await page.goto(origin+prefix+locale+'/portal/?fixture=qa#type=recovery&access_token=fictional');
        assert.equal(new URL(page.url()).pathname,prefix+locale+'/portal/reset/');
        assert.equal(new URL(page.url()).search,'?fixture=qa');assert.equal(new URL(page.url()).hash,'#type=recovery&access_token=fictional');
        // Fake only auth methods, never the URL builder under test; email is not transmitted.
        await page.goto(origin+prefix+locale+'/portal/');
        await page.evaluate(()=>{
          window.UMBERPortalService={...window.UMBERPortalService,configured:()=>true,live:async()=>null,client:async()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}),reset:async(email,redirectTo)=>{window.qaReset={email,redirectTo};}};
          render();
        });
        await page.locator('details summary').click();
        await page.locator('[data-up-form="reset"] input[name="email"]').fill('qa@example.invalid');
        await page.locator('[data-up-form="reset"] button').click();
        await page.waitForFunction(()=>window.qaReset);
        assert.deepEqual(await page.evaluate(()=>window.qaReset),{email:'qa@example.invalid',redirectTo:origin+prefix+locale+'/portal/reset/'});
        checks+=2;
      }
      const response=await page.goto(origin+prefix+'/es/unknown/deep/path/');
      assert.equal(response.status(),404);assert.equal(await page.evaluate(()=>document.baseURI),origin+prefix+'/');
      assert.match(await page.locator('main').innerText,/Página no encontrada|Page not found/);checks++;
      assert.deepEqual(missing,[],'No missing local resources');assert.deepEqual(errors,[],'No page errors');
      // With scripts disabled, the static public navigation and CSS still use the right mount.
      const nojsContext=await browser.newContext({javaScriptEnabled:false});await nojsContext.route('**/*',serve);const nojs=await nojsContext.newPage();
      for(const route of ['/','/es/','/services/','/es/services/','/post/what-makes-a-house-feel-like-home/']){
        await nojs.goto(origin+prefix+route);
        const state=await nojs.evaluate(()=>({base:document.baseURI,links:[...document.querySelectorAll('header a')].map(a=>a.href)}));
        assert.equal(state.base,origin+prefix+'/');for(const href of state.links)assert.ok(href.startsWith(origin+prefix+'/'));checks++;
      }
      await nojsContext.close();
      await context.close();
    }
    console.log(`PASS: ${checks} root/project Chromium checks across ${pages.length} routes each; ES/EN, canonical/noindex, static resources, SPA/reload/history, 404, reset URLs and preserved recovery query/hash. All external network blocked.`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
