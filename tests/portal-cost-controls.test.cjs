const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../portal.js'),'utf8');
const c=vm.createContext({window:{},document:{addEventListener(){}},location:{pathname:'/es/portal/demo/'},umberRoutePath:p=>p,URL,Intl});vm.runInContext(src,c);const p=c.window.UMBERPortal;
test('purchases: per-unit discount, tax and shipping calculate without adding commission',()=>{
 const a=p.purchaseAmounts({unit_price:100,quantity:3,discount_amount:10,tax_amount:27,delivery_amount:15,commission_amount:20});
 assert.equal(a.subtotal,270);assert.equal(a.total,312);assert.equal(a.commission,20);
});
test('confirmed amounts override calculations and incomplete extras do not become zero',()=>{
 assert.equal(p.purchaseAmounts({unit_price:100,quantity:2,discount_amount:0,tax_amount:0,delivery_amount:0,subtotal_amount:175}).total,175);
 assert.equal(p.purchaseAmounts({unit_price:100,quantity:2,discount_amount:0,tax_amount:null,delivery_amount:10}).total,null);
 assert.equal(p.purchaseAmounts({unit_price:100,quantity:2,tax_amount:0,delivery_amount:0}).total,null);
 assert.equal(p.purchaseAmounts({amount:180,unit_price:100,quantity:2}).total,180);
 assert.equal(p.purchaseAmounts({unit_price:100,quantity:2,discount_amount:101,tax_amount:0,delivery_amount:0}).subtotal,null);
 assert.equal(p.purchaseAmounts({unit_price:0.1,quantity:3,discount_amount:0,tax_amount:0,delivery_amount:0}).total,0.3);
});
test('construction: positive overrun, available budget, zero actual and missing actual remain distinct',()=>{
 assert.equal(p.workAmounts({budget_amount:100,actual_amount:125}).difference,25);
 assert.equal(p.workAmounts({budget_amount:100,actual_amount:80}).state,'under');
 assert.equal(p.workAmounts({budget_amount:100,actual_amount:0}).difference,-100);
 assert.equal(p.workAmounts({budget_amount:100,actual_amount:null}).difference,null);
 assert.equal(p.workAmounts({budget_amount:0,actual_amount:0}).state,'equal');
 assert.equal(p.workAmounts({budget_amount:-1,actual_amount:0}).state,'unknown');
});
