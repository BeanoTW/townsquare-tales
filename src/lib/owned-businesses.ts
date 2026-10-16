import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { trackBest } from "@/lib/career-history";

export type BusinessKind = "restaurant" | "retail";
export const BUSINESS = {
 restaurant: {name:"Independent restaurant",cost:80000,baseRevenue:5500,baseExpenses:4100},
 retail: {name:"Independent shop",cost:45000,baseRevenue:3300,baseExpenses:2650},
} as const;

const rank = (s:GameState,k:BusinessKind) => trackBest(s,k==="restaurant"?1:2);
const owns = (s:GameState,k:BusinessKind) => Boolean(k==="restaurant"?s.restaurantOwned:s.retailOwned);
/** High risk and reward for hospitality; retail steadier and improves other firms' purchasing. */
export function weeklyBusinessResult(s:GameState,k:BusinessKind,week:number){
 const b=BUSINESS[k],level=rank(s,k),procurement=trackBest(s,2);
 const noise=Math.sin(week*1.73+(k==="restaurant"?2.1:0.6));
 const volatility=k==="restaurant"?0.45:0.16;
 const revenue=Math.round(b.baseRevenue*(1+level*0.11+noise*volatility));
 const expenses=Math.round(b.baseExpenses*(1-level*0.045-Math.min(0.12,procurement*0.025)));
 return {revenue,expenses,profit:revenue-expenses};
}
/** Settles every elapsed complete week; no advance payments for selling and rebuying. */
export function settleBusinesses(s:GameState,nextDay:number):Partial<GameState>{
 const last=s.businessLastDay??s.day;
 const weeks=Math.max(0,Math.floor((nextDay-last)/7));
 if(!weeks)return {};
 let net=0;
 for(let n=0;n<weeks;n++){
   const week=Math.floor((last+(n+1)*7)/7);
   for(const kind of ["restaurant","retail"] as const)if(owns(s,kind))net+=weeklyBusinessResult(s,kind,week).profit;
 }
 const debts=s.businessDebt??0;
 const available=s.money+net-debts;
 return {money:Math.max(0,available),businessDebt:Math.max(0,-available),businessLastDay:last+weeks*7};
}
export function buyBusinessAction(kind:BusinessKind):ActionDef {
 const b=BUSINESS[kind];
 return {id:"buy-business-"+kind,label:`Buy ${b.name} · $${b.cost.toLocaleString("en-US")}`,hours:1,energy:3,cost:b.cost,
 note:"Weekly operating income and expenses · ownership is permanent",
 resolve:s=>{
  if(owns(s,kind))return "You already own this business.";
  if((s.businessDebt??0)>0)return "Clear unpaid business operating costs before expanding.";
  if(s.money<b.cost)return `You need $${b.cost} to buy this business.`;
  return {patch:{money:s.money-b.cost,businessLastDay:s.businessLastDay??s.day,...(kind==="restaurant"?{restaurantOwned:1}:{retailOwned:1})},message:`You now own an ${b.name}. The first operating statement arrives after seven days.`};
 }};
}
export function repayBusinessDebtAction():ActionDef {
 return {id:"pay-business-debt",label:"Settle outstanding operating expenses",hours:0,energy:0,
 resolve:s=>{
  const amount=Math.min(s.money,s.businessDebt??0);
  if(amount<=0)return "No affordable business debt payment is due.";
  return {patch:{money:s.money-amount,businessDebt:(s.businessDebt??0)-amount},message:`Paid $${amount} towards business operating expenses.`};
 }};
}
export function businessStatus(s:GameState,k:BusinessKind):string[]{
 const b=BUSINESS[k];
 if(!owns(s,k))return [`Purchase price: $${b.cost.toLocaleString("en-US")}`,`${k==="restaurant"?"Hospitality":"Retail"} career experience boosts profitability`];
 const {profit}=weeklyBusinessResult(s,k,Math.floor(s.day/7)+1);
 return [`Owned · estimated next week $${profit} ${profit>=0?"profit":"loss"}`,`Career expertise: level ${rank(s,k)}/4 · unpaid costs $${s.businessDebt??0}`];
}
