import type { ActionDef } from "./actions";
import type { GameState } from "./game-state";

export type HustleId = "deliveries" | "odd-jobs" | "market-stall";
export const HUSTLES = [
 { id:"deliveries", name:"Local deliveries", hours:2, energy:16, base:26, skill:"str", note:"Deliver parcels around town · reliable cash" },
 { id:"odd-jobs", name:"Handyman callouts", hours:3, energy:24, base:42, skill:"str", note:"Repair and tidy homes · strength improves pay" },
 { id:"market-stall", name:"Weekend market stall", hours:3, energy:14, base:54, skill:"cha", note:"Buy stock for $25 · charm improves sales · risk of a slow day" },
] as const;
export function hustleAction(id:HustleId):ActionDef {
 const h=HUSTLES.find(item=>item.id===id)!;
 return {id:"hustle-"+id,label:h.name,hours:h.hours,energy:h.energy,
  cost:id==="market-stall"?25:undefined,note:h.note,
  resolve:(s:GameState,rng)=>{
    if(s.sideHustleDay===s.day && (s.sideHustlesToday??0)>=3) return "You've done three side jobs today. Come back tomorrow.";
    const cost=id==="market-stall"?25:0;
    if(s.money<cost)return "You need $25 to buy stall stock.";
    const skill=Math.max(0,Math.min(100,id==="market-stall"?s.cha:s.str));
    const lucky=rng();
    let revenue=h.base+Math.floor(skill*(id==="market-stall"?0.22:0.18));
    if(id==="market-stall")revenue=lucky<0.25?Math.floor(revenue*0.5):lucky>0.87?Math.floor(revenue*1.35):revenue;
    else revenue+=Math.floor(lucky*9);
    return {patch:{
      money:Math.min(1e12,s.money+revenue-cost),
      sideHustleDay:s.day,
      sideHustlesToday:s.sideHustleDay===s.day?(s.sideHustlesToday??0)+1:1,
    },message:`${h.name}: earned $${revenue}${cost?` after buying $${cost} stock (net $${revenue-cost})`:""}.`};
  }
 };
}
