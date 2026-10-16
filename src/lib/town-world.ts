import { P } from "@/lib/town-projection";
import type { BuildingLot } from "@/components/BuildingExterior";

// Shared town data. TownMap (SVG) and the 3D city read the same plan so
// tiles, doors, trees and hit areas always agree.
export const TW = 48, TH = 36, N = 36;

// Streets have deliberate ends and T-junctions rather than an endless grid.
export const ROADS = [
  { x: 8.6, y: 0, w: 2.8, d: 30 },       // north-south Main Street, only T-junctions
  { x: 0, y: 7.1, w: 9.1, d: 2.8 },    // upper west street, joins Main Street
  { x: 11.1, y: 11.9, w: 12.2, d: 2.8 }, // east market street, offset 4.8 tiles
  { x: 0, y: 18.5, w: 9.1, d: 2.8 },     // lower west street, staggered again
  { x: 11.1, y: 25.5, w: 12.2, d: 2.8 },  // lower east street, offset 7 tiles
  { x: 22.6, y: 8.0, w: 2.8, d: 21.6 }, // eastern street extends north to the Post Office spur
  { x: 22.6, y: 5.8, w: 6.9, d: 2.8 }, // aligned western edge: square right-angle corner at postal branch
] as const;

/** Shared, junction-aware road paint in map units for both SVG and Three.js.
 * Dashes stop before side-road crossings instead of floating through intersections. */
export function laneDashes(roads: readonly {x:number;y:number;w:number;d:number}[] = ROADS) {
  const dashes: {x:number;y:number;w:number;d:number}[] = [];
  roads.forEach((r,i) => {
    const vertical=r.d>r.w;
    const len=vertical?r.d:r.w;
    for(let p=0.65;p+0.82<=len-0.35;p+=2.4) {
      const x=vertical?r.x+r.w/2-0.05:r.x+p;
      const y=vertical?r.y+p:r.y+r.d/2-0.05;
      const dash={x,y,w:vertical?0.1:0.82,d:vertical?0.82:0.1};
      const overlapsOther=roads.some((other,j)=>j!==i &&
        dash.x<other.x+other.w+0.18 && dash.x+dash.w>other.x-0.18 &&
        dash.y<other.y+other.d+0.18 && dash.y+dash.d>other.y-0.18);
      if(!overlapsOther) dashes.push(dash);
    }
  });
  return dashes;
}

export type B = BuildingLot;

export const HOUSE_LOOK = [
  { h: 18, wall: "var(--town-box-wall)", side: "var(--town-box-side)", roof: "var(--town-box-roof)", label: "Box" },
  { h: 70, wall: "var(--town-flat-wall)", side: "var(--town-flat-side)", roof: "var(--town-flat-roof)", label: "Flat" },
  { h: 60, wall: "var(--town-house-wall)", side: "var(--town-house-side)", roof: "var(--town-house-roof)", label: "House" },
  { h: 95, wall: "var(--town-mansion-wall)", side: "var(--town-mansion-side)", roof: "var(--town-mansion-roof)", label: "Mansion" },
];

export const buildings = (house: number): B[] => {
  const hl = HOUSE_LOOK[house] ?? HOUSE_LOOK[0]!;
  const sites = [
    { x: 1.1, y: 2, w: 3, d: 4 },
    { x: 5.0, y: 26.45, w: 3.0, d: 2.9 },
    { x: 22.15, y: 1.0, w: 3.15, d: 3.8 },
    { x: 28.05, y: 8.7, w: 3.8, d: 3.65 },
  ] as const;
  const residences = sites.map((plot, tier) => ({
    facing: (tier === 3 ? "west" : "south") as "west" | "south", id: tier === house ? "home" : `residence-${tier}`,
    label: tier === house ? `Home · ${hl.label}` : ["Cardboard Box", "Studio Flat", "Suburban House", "Mansion"][tier]!,
    ...plot, h: HOUSE_LOOK[tier]!.h, wall: HOUSE_LOOK[tier]!.wall,
    side: HOUSE_LOOK[tier]!.side, roof: HOUSE_LOOK[tier]!.roof,
    sign: "var(--town-home-sign)", win: tier > 0,
  }));
  return [
    ...residences,
    { facing: "north", id: "yard", label: "Construction Office", x: 19.5, y: 22.8, w: 2.1, d: 1.5, h: 35, wall: "var(--town-depot-wall)", side: "var(--town-depot-side)", roof: "var(--town-depot-roof)", sign: "var(--town-depot-sign)", win: false },
    { facing: "south", id: "gym", label: "Iron Gym", x: 11.8, y: 7.75, w: 3, d: 3.3, h: 70, wall: "var(--town-gym-wall)", side: "var(--town-gym-side)", roof: "var(--town-gym-roof)", sign: "var(--town-gym-sign)", win: true },
    { facing: "west", id: "school", label: "Stick U", x: 12, y: 2.1, w: 4, d: 4, h: 90, wall: "var(--town-school-wall)", side: "var(--town-school-side)", roof: "var(--town-school-roof)", sign: "var(--town-school-sign)", win: true },
    { facing: "north", id: "bar", label: "The Tipsy Stick", x: 1.2, y: 22, w: 3, d: 4, h: 60, wall: "var(--town-bar-wall)", side: "var(--town-bar-side)", roof: "var(--town-bar-roof)", sign: "var(--town-bar-sign)", win: true },
    { facing: "west", id: "work", label: "MegaCorp", x: 12, y: 20.1, w: 3.7, d: 4, h: 190, wall: "var(--town-work-wall)", side: "var(--town-work-side)", roof: "var(--town-work-roof)", sign: "var(--town-work-sign)", win: true },
    { facing: "west", id: "bank", label: "Town Bank", x: 12, y: 15.5, w: 3.5, d: 4, h: 85, wall: "var(--town-bank-wall)", side: "var(--town-bank-side)", roof: "var(--town-bank-roof)", sign: "var(--town-bank-sign)", win: true },
    { facing: "south", id: "shop", label: "Corner Shop", x: 15.25, y: 8.05, w: 2.6, d: 3.0, h: 48, wall: "var(--town-shop-wall)", side: "var(--town-shop-side)", roof: "var(--town-shop-roof)", sign: "var(--town-shop-sign)", win: true },
    { facing: "south", id: "diner", label: "Fryday Diner", x: 5.1, y: 13.2, w: 2.8, d: 3.8, h: 55, wall: "var(--town-diner-wall)", side: "var(--town-diner-side)", roof: "var(--town-diner-roof)", sign: "var(--town-diner-sign)", win: true },
    { facing: "west", id: "pawn", label: "Oddities Pawn", x: 26, y: 14.5, w: 3, d: 3.2, h: 56, wall: "var(--town-pawn-wall)", side: "var(--town-pawn-side)", roof: "var(--town-pawn-roof)", sign: "var(--town-pawn-sign)", win: true },
    { facing: "south", id: "furniture", label: "Cosy Corner", x: 18.3, y: 7.25, w: 3.6, d: 3.7, h: 78, wall: "var(--town-furniture-wall)", side: "var(--town-furniture-side)", roof: "var(--town-furniture-roof)", sign: "var(--town-furniture-sign)", win: true },
    { facing: "north", id: "casino", label: "Lucky Sevens", x: 5.2, y: 22, w: 2.8, d: 4, h: 115, wall: "var(--town-casino-wall)", side: "var(--town-casino-side)", roof: "var(--town-casino-roof)", sign: "var(--town-casino-sign)", win: true },
    { facing: "west", id: "depot", label: "Town Transit", x: 26, y: 23.2, w: 3, d: 3.1, h: 50, wall: "var(--town-depot-wall)", side: "var(--town-depot-side)", roof: "var(--town-depot-roof)", sign: "var(--town-depot-sign)", win: true },
    { facing: "south", id: "post", label: "Town Post Office", x: 26, y: 1.25, w: 3.1, d: 3.3, h: 58, wall: "var(--town-clinic-wall)", side: "var(--town-clinic-side)", roof: "var(--town-clinic-roof)", sign: "var(--town-clinic-sign)", win: true },
    { facing: "west", id: "police", label: "Town Police", x: 26, y: 18.3, w: 3, d: 3.9, h: 90, wall: "var(--town-police-wall)", side: "var(--town-police-side)", roof: "var(--town-police-roof)", sign: "var(--town-police-sign)", win: true },
    { facing: "south", id: "clinic", label: "Patch Up Clinic", x: 1.1, y: 13, w: 3, d: 4, h: 75, wall: "var(--town-clinic-wall)", side: "var(--town-clinic-side)", roof: "var(--town-clinic-roof)", sign: "var(--town-clinic-sign)", win: true },
  ];
};

/** Building landscape stops at the postal pavement, rather than painting turf over it. */
export function buildingPlot(b: B): {x:number;y:number;w:number;d:number} {
  const x=Math.max(0,b.x-0.15), y=Math.max(0,b.y-0.15);
  const w=b.w+0.3;
  const ordinaryEnd=b.y+b.d+0.15;
  const branch=ROADS.find(r=>r.x>20&&r.w>5&&r.y<8);
  const end=b.id==="post"&&branch ? Math.min(ordinaryEnd,branch.y-0.58) : ordinaryEnd;
  return {x,y,w,d:Math.max(0,end-y)};
}

export const door = (b: B) => {
  switch (b.facing) {
    case "north": return { x: b.x + b.w / 2, y: b.y - 0.6 };
    case "south": return { x: b.x + b.w / 2, y: b.y + b.d + 0.6 };
    case "east": return { x: b.x + b.w + 0.6, y: b.y + b.d / 2 };
    case "west": return { x: b.x - 0.6, y: b.y + b.d / 2 };
  }
};
export const TREES = [[.6,1],[4.6,1],[8,3],[11.9,.6],[16.8,.65],[22.1,4.2],[29.1,9.5],[1,11],[7.5,11],[12.2,10],[28.8,18],[1,28],[8,28],[13.7,27.7],[29,29]] as const;
export const LAMPS = [[2,6.65],[7,6.65],[8.4,10.35],[12,11.35],[20.8,11.35],[2,18.05],[7,18.05],[8.4,22],[12,25.05],[20,25.05],[25.5,16],[25.5,23]] as const;



/** Monotone-chain convex hull, counter-clockwise in screen units. */
export function convexHull(points: readonly (readonly [number, number])[]): [number, number][] {
  const sorted = points.map(([x, y]) => [x, y] as [number, number]).sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o: [number, number], a: [number, number], b: [number, number]) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower: [number, number][] = [], upper: [number, number][] = [];
  for (const p of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2]!, lower[lower.length - 1]!, p) <= 0) lower.pop();
    lower.push(p);
  }
  for (const p of sorted.slice().reverse()) {
    while (upper.length >= 2 && cross(upper[upper.length - 2]!, upper[upper.length - 1]!, p) <= 0) upper.pop();
    upper.push(p);
  }
  upper.pop(); lower.pop();
  return [...lower, ...upper];
}

/** Offset applied to the world layer so the player stays at the portrait camera's anchor. */
export function playerCameraOffset(x: number, y: number, skating = false): [number, number] {
  const [cx, cy] = P(x, y);
  const boardYOffset = skating ? -5 : -7;
  return [Math.round((165 - cx) * 2) / 2, Math.round((275 - cy - boardYOffset) * 2) / 2];
}
