import type { ActionDef } from "@/lib/actions";

export const PARK_OBJECTS = [
  {id:"ramp",x:18.9,y:2.55,label:"Grind the rail · 15m · 6 energy",kind:"ramp"},
  {id:"hoop",x:21.25,y:2.65,label:"Play basketball · 30m · 8 energy",kind:"hoop"},
  {id:"hide",x:21.5,y:6.1,label:"Lay low in bushes · 1h · 4 energy",kind:"hide"},
] as const;
export type ParkObjectId = typeof PARK_OBJECTS[number]["id"];
/** Voluntary activities share the ordinary action clock and saved daily reward guards. */
export function parkAction(id: ParkObjectId): ActionDef {
  return {id:`park-${id}`,label:PARK_OBJECTS.find(o=>o.id===id)!.label,
    hours:id==="hide"?1:id==="hoop"?.5:.25,energy:id==="hide"?4:id==="hoop"?8:6,
    resolve:(s,rng)=> {
      if(id==="ramp") {
        if(!s.skateboard || !s.skateboardEquipped) return "Equip your skateboard first.";
        if(s.parkSkateDay===s.day) return "You've made your impression today. The concrete remembers.";
        if(s.energy<20) return {patch:{parkSkateDay:s.day,energy:Math.max(0,s.energy-10)},message:"A tired wobble, then a seated landing. The pavement gives no references. -10 energy · 15m."};
        const trick=rng()<.5?"ollie":"kickflip";
        return {patch:{parkSkateDay:s.day,cha:s.cha+1},message:`A clean ${trick}. The crew briefly forget to look unimpressed. Charm +1 · -6 energy · 15m.`};
      }
      if(id==="hoop") {
        if(s.parkHoopDay===s.day) return "Enough training today. The hoop has filed a complaint.";
        return {patch:{parkHoopDay:s.day,str:s.str+1},message:"Free throws, questionable technique. Strength +1 · -8 energy · 30m."};
      }
      if(s.heat<=0) return "Nobody is looking for you. An unusual achievement.";
      if(s.parkHideDay===s.day) return "The bushes aren't a witness-protection programme. Try tomorrow.";
      return {patch:{parkHideDay:s.day,heat:Math.max(0,s.heat-4)},message:"An hour under a bush. A duck declines to identify you. Heat -4 · -4 energy · 1h."};
    }};
}
