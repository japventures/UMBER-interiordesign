// Regenerate public static main content from the same renderers used by the site.
// No network, browser, authentication or backend calls.
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const data=JSON.parse(read('site-data.js').replace(/^window.UMBER_DATA=/,'').replace(/;\s*$/,''));
const i18n=read('i18n.js'),dictContext={};vm.createContext(dictContext);vm.runInContext(i18n.slice(i18n.indexOf('const ES='),i18n.indexOf('function translateText'))+';dictionary=ES;',dictContext);
const control={setAttribute(){},classList:{remove(){},toggle(){}},addEventListener(){},querySelector(){return control}};
const context={window:{UMBER_DATA:data},document:{querySelector:()=>control,querySelectorAll:()=>[],addEventListener(){},body:{classList:{toggle(){}}},documentElement:{lang:'en'}},location:{pathname:'/',origin:'https://japventures.github.io'},history:{},umberRoutePath:p=>p,translateText:v=>dictContext.dictionary[v]||v,URL,setInterval(){},clearInterval(){}};
vm.createContext(context);vm.runInContext(read('app.js').replace(/render\(\);\s*$/,''),context);
for(const [route,fn] of [['','home'],['portfolio','portfolio'],['services','servicePage'],['contact','contact'],['team-3','about']])for(const es of [false,true]){
 context.location.pathname=(es?'/es':'')+'/'+route;context.document.documentElement.lang=es?'es':'en';
 const html=vm.runInContext(fn+'()',context).replace(/href="\/([^"#]*)"/g,(_,p)=>'href="'+(es?'es/':'')+p+'"');
 const file=(es?'es/':'')+(route?route+'/':'')+'index.html',source=read(file);
 const rendered=source.replace(/(<main(?:\s[^>]*)?>)[\s\S]*?<\/main>/,(_,open)=>open+html+'</main>');
 fs.writeFileSync(path.join(root,file),rendered);
}
