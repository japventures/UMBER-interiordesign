// Offline URL contract; no DNS, account, email or backend changes.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
function files(dir = root) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(item => item.name.startsWith('.') || ['tests', 'docs', 'supabase'].includes(item.name) ? [] : item.isDirectory() ? files(path.join(dir, item.name)) : [path.join(dir, item.name)]);
}
const pages = files().filter(file => file.endsWith('/index.html') && read(path.relative(root,file)).includes('<base'));
const mounts = [
  ['https://umberinteriordesign.com', ''],
  ['https://www.umberinteriordesign.com', ''],
  ['https://japventures.github.io', '/UMBER-interiordesign']
];
for (const [origin, prefix] of mounts) {
  test(`${origin}${prefix}: all static resources and anchors resolve within the mount`, () => {
    for (const file of pages) {
      const rel = path.relative(root, file).replaceAll(path.sep, '/');
      const route = '/' + rel.replace(/index\.html$/, '');
      const html = read(rel), page = origin + prefix + route;
      assert.match(html, /<meta name="robots" content="noindex,nofollow">/);
      const base = new URL(html.match(/<base href="([^"]+)"/)[1], page);
      assert.equal(base.href, origin + prefix + '/', rel);
      assert.ok(html.indexOf('data-umber-base') < html.indexOf('rel="stylesheet"'), rel);
      for (const match of html.matchAll(/<(?:a|script|link|img)\b[^>]*?\b(?:href|src)="([^"]+)"/g)) {
        const target = new URL(match[1], base);
        if (target.origin !== origin) continue;
        assert.ok(target.pathname.startsWith(prefix + '/'), `${rel}: ${target.href}`);
        let local = target.pathname.slice(prefix.length);
        const candidate = path.join(root, local);
        assert.ok(fs.existsSync(candidate) || fs.existsSync(candidate + '/index.html'), `${rel}: ${target.href}`);
        if (target.hash === '#main') assert.equal(target.pathname.replace(/\/$/, ''), (prefix+route).replace(/\/$/, ''), 'skip stays on current page');
      }
    }
  });
  test(`${origin}${prefix}: config and route normalization`, () => {
    const context = vm.createContext({ window: {}, document: {baseURI: origin+prefix+'/'}, location: {origin, pathname: prefix+'/es/services/'}, URL });
    vm.runInContext(read('config.js'), context);
    assert.equal(context.window.UMBER_BASE, prefix);
    assert.equal(context.window.UMBER_SITE_URL, (origin.includes('www.') ? 'https://umberinteriordesign.com' : origin)+prefix);
    for(const suffix of ['/es/services/', '/es/services/index.html']) assert.equal(context.umberRoutePath(prefix+suffix), '/es/services/');
    assert.equal(context.umberRoutePath(prefix+'/'), '/');
  });
}
test('Custom-domain readiness does not activate DNS, Pages or hosted Auth settings', () => {
  assert.equal(fs.existsSync(path.join(root, 'CNAME')), false);
  assert.match(read('supabase/config.toml'), /site_url = "https:\/\/japventures.github.io\/UMBER-interiordesign\/es\/portal\/"/);
  assert.ok(pages.length >= 45);
});
function languageHarness(origin,prefix,locale) {
  const baseURI=origin+prefix+'/',links=[],meta=[];
  const anchor=(href,language)=>{
    let url=new URL(href,baseURI);const attributes={};
    if(language)attributes['data-language']=language;
    return {dataset:{language},get href(){return url.href;},set href(value){url=new URL(value,baseURI);},get origin(){return url.origin;},get pathname(){return url.pathname;},get hash(){return url.hash;},get search(){return url.search;},hasAttribute:name=>name in attributes,setAttribute(name,value){if(name==='href')url=new URL(value,baseURI);else attributes[name]=value;},removeAttribute(name){delete attributes[name];}};
  };
  links.push(anchor('/portfolio?filter=all'),anchor(prefix+'/es/blog?source=qa'),anchor('https://external.example/info?x=1'),anchor('mailto:info@umberinteriordesign.com'),anchor(prefix+'/es/','es'),anchor(prefix+'/','en'));
  const skip=anchor('#main');
  const document={baseURI,title:'SERVICES | UMBER INTERIOR DESIGN',documentElement:{},body:{},head:{append:link=>meta.push(link)},querySelector:selector=>selector==='.skip'?skip:null,createTreeWalker:()=>({nextNode:()=>null}),createElement:()=>({dataset:{}}),querySelectorAll:selector=>selector==='a[href]'?links:selector==='[data-language]'?links.filter(a=>a.dataset.language):[]};
  const context=vm.createContext({window:{},location:{origin,pathname:prefix+(locale==='es'?'/es':'')+'/services/'},document,URL,NodeFilter:{SHOW_TEXT:4,FILTER_REJECT:2,FILTER_ACCEPT:1}});
  vm.runInContext(read('config.js'),context);vm.runInContext(read('i18n.js'),context);context.applyLanguage('/services');
  return {context,links,meta,skip};
}
for(const [origin,prefix] of mounts)for(const locale of ['en','es']) {
  test(`${origin}${prefix} ${locale}: actual i18n preserves queries, locale, canonical and alternate routes`,()=>{
    const {context,links,meta,skip}=languageHarness(origin,prefix,locale);
    const languagePrefix=locale==='es'?'/es':'';
    assert.equal(links[0].href,origin+prefix+languagePrefix+'/portfolio?filter=all');
    assert.equal(links[1].href,origin+prefix+languagePrefix+'/blog?source=qa');
    assert.equal(links[2].href,'https://external.example/info?x=1');assert.equal(links[3].href,'mailto:info@umberinteriordesign.com');
    assert.equal(links[4].href,origin+prefix+'/es/services');assert.equal(links[5].href,origin+prefix+'/services');
    assert.equal(skip.href,origin+prefix+languagePrefix+'/services#main');
    assert.equal(context.document.documentElement.lang,locale);
    const canonicalOrigin=origin.includes('www.')?'https://umberinteriordesign.com':origin;
    assert.equal(meta.find(l=>l.rel==='canonical').href,canonicalOrigin+prefix+languagePrefix+'/services/');
    assert.deepEqual(meta.filter(l=>l.rel==='alternate').map(l=>[l.hreflang,l.href]),[['en',canonicalOrigin+prefix+'/services/'],['es',canonicalOrigin+prefix+'/es/services/'],['x-default',canonicalOrigin+prefix+'/services/']]);
  });
  test(`${origin}${prefix} ${locale}: actual portal reset submission uses the current origin/mount`,async()=>{
    const events={},mount={innerHTML:''},calls=[];
    const document={baseURI:origin+prefix+'/',body:{classList:{add(){},remove(){}}},getElementById:id=>id==='umber-portal'?mount:null,querySelector:()=>null,addEventListener:(name,fn)=>events[name]=fn};
    const context=vm.createContext({window:{},document,URL,URLSearchParams,location:{origin,pathname:prefix+(locale==='es'?'/es':'')+'/portal/',hash:'',search:''},Intl,Date,atob,Blob,setTimeout,clearTimeout,FormData:class{constructor(form){this.values=form.values;}*[Symbol.iterator](){yield*Object.entries(this.values);}}});
    vm.runInContext(read('config.js'),context);vm.runInContext(read('portal.js'),context);
    context.window.UMBERPortalService={configured:()=>true,passwordFlow:()=>null,live:async()=>null,client:async()=>({auth:{onAuthStateChange:()=>({data:{subscription:{unsubscribe(){}}}})}}),reset:async(...args)=>calls.push(args)};
    await context.window.UMBERPortal.mount('/portal');
    const form={dataset:{upForm:'reset'},values:{email:' qa@example.invalid '},closest:()=>null,querySelector:()=>({disabled:false})};
    events.submit({preventDefault(){},target:{closest:()=>form}});await new Promise(resolve=>setImmediate(resolve));
    assert.deepEqual(calls,[['qa@example.invalid',origin+prefix+(locale==='es'?'/es':'')+'/portal/reset/']]);
    assert.match(mount.innerHTML,locale==='es'?/recibirás un enlace/:/receive a recovery link/);
  });
}
test('404 shell pins root/project bases before resources at arbitrary URL depth',()=>{
  const html=read('404.html');assert.match(html,/<meta name="robots" content="noindex,nofollow">/);
  const bootstrap=html.match(/<script data-umber-base>([\s\S]*?)<\/script>/)[1];
  for(const [origin,prefix] of mounts)for(const suffix of ['/missing/','/es/missing/deep/path/']){
    const href=origin+prefix+suffix;let pinned=new URL('./',href);
    const base={get href(){return pinned.href;},set href(value){pinned=new URL(value,href);}};
    const document={get baseURI(){return pinned.href;},querySelector:selector=>selector==='base'?base:null};
    const context=vm.createContext({window:{},document,location:{origin,href,pathname:prefix+suffix},URL});
    vm.runInContext(bootstrap,context);vm.runInContext(read('config.js'),context);
    assert.equal(document.baseURI,origin+prefix+'/');assert.equal(context.window.UMBER_BASE,prefix);
    for(const file of ['styles.css','config.js','app.js'])assert.equal(new URL(file,document.baseURI).href,origin+prefix+'/'+file);
  }
});
