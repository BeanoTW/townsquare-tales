import { walkable, type Nav } from "@/lib/home3d/nav";
import type { WalkPoint } from "@/lib/home3d/route";

/** Resolve a short movement vector against the navigation mask without ever
 * moving into a blocked cell. Axial sliding and small corner probes prevent
 * the joystick getting trapped on diagonal contact. */
export function slideMove(nav: Nav, point: WalkPoint, vx: number, vz: number): WalkPoint {
  const valid=(x:number,z:number)=>walkable(nav,x,z);
  const direct={x:point.x+vx,z:point.z+vz};
  if(valid(direct.x,direct.z))return direct;
  const xFree=valid(point.x+vx,point.z);
  const zFree=valid(point.x,point.z+vz);
  if(xFree && (!zFree || Math.abs(vx)>=Math.abs(vz)))return {x:point.x+vx,z:point.z};
  if(zFree)return {x:point.x,z:point.z+vz};
  if(xFree)return {x:point.x+vx,z:point.z};
  // Probe a small tangent deflection around a blocked grid corner. Never
  // teleport, and never allow the player to cross a collider diagonally.
  for(const fraction of [.75,.5,.25]){
    const tx=point.x+vx*fraction,tz=point.z+vz*fraction;
    if(valid(tx,point.z))return {x:tx,z:point.z};
    if(valid(point.x,tz))return {x:point.x,z:tz};
  }
  return point;
}

/** Conservative line of sight for smoothing tap-to-walk routes. */
export function clearSegment(nav: Nav, from: WalkPoint, to: WalkPoint): boolean {
  const len=Math.hypot(to.x-from.x,to.z-from.z);
  const steps=Math.max(1,Math.ceil(len/(nav.cell*.4)));
  for(let i=1;i<=steps;i++){
    const t=i/steps;
    if(!walkable(nav,from.x+(to.x-from.x)*t,from.z+(to.z-from.z)*t))return false;
  }
  return true;
}

export function smoothRoute(nav: Nav,start: WalkPoint,path: WalkPoint[]): WalkPoint[]{
  if(path.length<2)return path;
  const result: WalkPoint[]=[];
  let prev=start,i=0;
  while(i<path.length){
    let far=i;
    for(let j=path.length-1;j>i;j--){
      if(clearSegment(nav,prev,path[j]!)){far=j;break;}
    }
    const next=path[far]!;
    result.push(next);prev=next;i=far+1;
  }
  return result;
}
