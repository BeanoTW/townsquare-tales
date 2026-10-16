import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { trackBest } from "@/lib/career-history";

export type BusinessKind = "restaurant" | "retail";
export const BUSINESS = {
 restaurant: {name:"Independent restaurant",cost:80000,baseRevenue:5500,baseExpenses:4100},
 retail: {name:"Independent shop",cost:45000,baseRevenue:3300,baseExpenses:2650},
} as const;

const rank = (s:GameState,k:BusinessKind) => trackBest(s,k==="restaurant"?1:2);
const managerLevel = (s:GameState,k:BusinessKind) => k==="restaurant"?(s.restaurantManager??0):(s.retailManager??0);
const branches = (s:GameState,k:BusinessKind) => owns(s,k) ? Math.max(1,k==="restaurant"?(s.restaurantBranches??1):(s.retailBranches??1)) : 0;
const managerWage = (level:number) => level===2?850:level===1?420:0;
const owns = (s:GameState,k:BusinessKind) => Boolean(k==="restaurant"?s.restaurantOwned:s.retailOwned);
/** High risk and reward for hospitality; retail steadier and improves other firms' purchasing. */
export function weeklyBusinessResult(s:GameState,k:BusinessKind,week:number){
 const b=BUSINESS[k],level=rank(s,k),manager=managerLevel(s,k),procurement=trackBest(s,2);
 const noise=Math.sin(week*1.73+(k==="restaurant"?2.1:0.6));
 const volatility=k==="restaurant"?0.45:0.16;
 const revenue=Math.round(b.baseRevenue*(1+level*0.11+manager*0.085+noise*volatility));
 const expenses=Math.round(b.baseExpenses*(1-level*0.045-Math.min(0.12,procurement*0.025)))+managerWage(manager);
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
   for(const kind of ["restaurant","retail"] as const)if(owns(s,kind))net+=weeklyBusinessResult(s,kind,week).profit*branches(s,kind);
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
export function hireBusinessManagerAction(kind:BusinessKind,level:1|2):ActionDef{
 const fee=level===1?1200:4500;
 return {id:`hire-${kind}-manager-${level}`,label:`Hire ${level===1?"experienced":"expert"} manager · ${fee}`,hours:1,energy:4,cost:fee,
 note:`Ongoing ${managerWage(level)}/week per branch · boosts sales`,
 resolve:s=>{
  if(!owns(s,kind))return "Buy the business before hiring a manager.";
  if(managerLevel(s,kind)>=level)return "You already have a manager at this level.";
  if((s.businessDebt??0)>0)return "Settle business debt before hiring.";
  if(s.money<fee)return "Not enough cash to recruit.";
  return {patch:{money:s.money-fee,...(kind==="restaurant"?{restaurantManager:level}:{retailManager:level})},message:"Manager hired. Their weekly wages are included in business operating costs."};
 }};
}
export function expandBusinessAction(kind:BusinessKind):ActionDef{
 const b=BUSINESS[kind],cost=b.cost;
 return {id:`expand-${kind}`,label:`Open another ${kind} branch · ${cost.toLocaleString("en-US")}`,hours:2,energy:5,cost,
 note:"Up to 3 branches · each branch adds revenue, expenses and staff wages",
 resolve:s=>{
  const count=branches(s,kind);
  if(count===0)return "Own the first business before expanding.";
  if(count>=3)return "Your company is at the current three-branch limit.";
  if((s.businessDebt??0)>0)return "Pay outstanding business costs before expanding.";
  if(s.money<cost)return "Not enough cash to fund a new branch.";
  return {patch:{money:s.money-cost,...(kind==="restaurant"?{restaurantBranches:count+1}:{retailBranches:count+1})},message:`Opened branch ${count+1}. Both sales and operating costs now apply to all branches.`};
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
 return [`Owned · ${branches(s,k)} branch(es) · estimated ${profit*branches(s,k)}/week`,`Career expertise ${rank(s,k)}/4 · manager ${managerLevel(s,k)}/2 · unpaid costs ${s.businessDebt??0}`];
}
