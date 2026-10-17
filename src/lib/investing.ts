import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";

/** Daily deterministic price prevents reloading or repeated sleep from rerolling the market. */
export function sharePrice(day: number): number {
 const d=Math.max(1,Math.floor(day));
 const raw=90 + Math.round(21*Math.sin(d*0.23)+12*Math.sin(d*0.061+1.3)+9*Math.sin(d*0.71));
 return Math.max(40,raw);
}
export const hasHomeComputer = (s:GameState) => Boolean(s.laptop || s.desktopPc);
export const marketUnlocked = (s:GameState) => (s.careerBest0??(s.career===0?s.job:0))>=2;
export function buyLaptopAction():ActionDef {
 return {id:"buy-laptop",label:"Buy laptop · $2,500",hours:0,energy:0,cost:2500,
 note:"Email and investments from home · requires a powered house",
 resolve:s=>s.laptop?"You already own a laptop.":s.house<1?"You need a studio flat or better to use a laptop.":s.money<2500?"Laptop costs $2,500.":{patch:{laptop:1,money:s.money-2500},message:"Laptop delivered! Access investment tools from your study desk at home."}};
}
/** Fixed desktop computer for the home study; shares the existing online services. */
export function buyDesktopPcAction():ActionDef {
 return {id:"buy-desktop-pc",label:"Buy desktop PC · $3,200",hours:0,energy:0,cost:3200,
 note:"A home PC for research and investments · requires a studio flat or better",
 resolve:s=>s.desktopPc?"You already own a desktop PC.":s.house<1?"You need a studio flat or better to set up a desktop PC.":s.money<3200?"Desktop PC costs $3,200.":{patch:{desktopPc:1,money:s.money-3200},message:"Desktop PC purchased! Set it up at your study desk for online tools."}};
}
export function marketAction(side:"buy"|"sell",quantity:number):ActionDef {
 const count=Math.floor(quantity);
 return {id:`shares-${side}-${count}`,label:`${side==="buy"?"Buy":"Sell"} ${count} shares`,hours:1,energy:3,
 note:"Price changes each day · 2% trading charge",
 resolve:s=>{
   if(!hasHomeComputer(s)||s.house<1)return "Trading requires a computer and a powered home.";
   if(!marketUnlocked(s))return "Learn investing first: progress to MegaCorp Analyst.";
   if(count<=0||count>100)return "Invalid trade size.";
   const price=sharePrice(s.day);
   if(side==="buy"){
     const cost=Math.ceil(price*count*1.02);
     if(s.money<cost)return `Need $${cost} for shares and fees.`;
     return {patch:{money:s.money-cost,marketShares:(s.marketShares??0)+count},message:`Bought ${count} shares for $${cost}. Market price $${price}/share.`};
   }
   if((s.marketShares??0)<count)return "You don't own enough shares.";
   const proceeds=Math.floor(price*count*0.98);
   return {patch:{money:s.money+proceeds,marketShares:(s.marketShares??0)-count},message:`Sold ${count} shares for $${proceeds}. Market price $${price}/share.`};
 }};
}
