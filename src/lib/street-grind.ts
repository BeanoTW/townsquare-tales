import { railProximity, type TownRail } from "./town-rails";
export type StreetGrind = { rail: TownRail; progress: number; direction: -1 | 1; elapsed: number; balance: number; velocity: number; outcome: "grinding" | "landed" | "fell" };
/** Snap an ollie to a rail only when approaching its finite segment. */
export function beginStreetGrind(position:{x:number;y:number}, rail:TownRail, direction:-1|1=1):StreetGrind|null {
  const p=railProximity(position,rail);
  if(p.distance>.38 || p.progress>.94 || p.progress<.06) return null;
  return {rail,progress:p.progress,direction,elapsed:0,balance:0,velocity:0,outcome:"grinding"};
}
/** Stable fixed substeps; left/right counteract balance drift. */
export function advanceStreetGrind(grind:StreetGrind,dt:number,lean:number):StreetGrind {
  if(grind.outcome!=="grinding")return grind;
  let next={...grind},remaining=Math.max(0,Math.min(dt,.1));
  while(remaining>0 && next.outcome==="grinding"){
    const step=Math.min(.016,remaining); remaining-=step;
    const force=next.balance*3+Math.sin(next.elapsed*8)*.4+Math.max(-1,Math.min(1,lean))*6;
    next.velocity=(next.velocity+force*step)*(.99);
    next.balance+=next.velocity*step;
    next.progress+=next.direction*step/.95;
    next.elapsed+=step;
    if(Math.abs(next.balance)>1)next.outcome="fell";
    else if(next.progress>=1 || next.progress<=0) {next.progress=Math.max(0,Math.min(1,next.progress));next.outcome="landed";}
  }
  return next;
}
export function grindPosition(grind:StreetGrind) {
  const {a,b}=grind.rail;
  return {x:a.x+(b.x-a.x)*grind.progress,y:a.y+(b.y-a.y)*grind.progress};
}
