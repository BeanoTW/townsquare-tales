/** Overworld grind geometry, separate from the existing arcade rail run. */
export type TownRail = { id: string; name: string; a: { x:number;y:number }; b: {x:number;y:number} };
export const TOWN_RAILS: TownRail[] = [
  {id:"park",name:"Park rail",a:{x:27,y:7.8},b:{x:28.4,y:7.8}},
  {id:"market",name:"Market curb",a:{x:14,y:10.2},b:{x:19,y:10.2}},
  {id:"megacorp",name:"MegaCorp handrail",a:{x:6.5,y:14},b:{x:6.5,y:16.5}},
  {id:"alley",name:"Alley pipe",a:{x:22,y:19.5},b:{x:24,y:19.5}},
];
export function railProximity(p:{x:number;y:number}, rail:TownRail) {
  const dx=rail.b.x-rail.a.x,dy=rail.b.y-rail.a.y;
  const lengthSquared=dx*dx+dy*dy;
  const t=Math.max(0,Math.min(1,((p.x-rail.a.x)*dx+(p.y-rail.a.y)*dy)/lengthSquared));
  const closest={x:rail.a.x+t*dx,y:rail.a.y+t*dy};
  return {distance:Math.hypot(p.x-closest.x,p.y-closest.y),progress:t,closest};
}
export function nearbyRail(p:{x:number;y:number},radius=.4):TownRail|null{
  const hits=TOWN_RAILS.map(rail=>({rail,d:railProximity(p,rail).distance})).filter(v=>v.d<=radius);
  hits.sort((a,b)=>a.d-b.d);
  return hits[0]?.rail??null;
}
