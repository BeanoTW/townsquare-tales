import { useEffect, useRef, useState } from "react";
import { BuildingExterior, type BuildingLot } from "@/components/BuildingExterior";
import { Button } from "@/components/ui/button";
import { P } from "@/lib/town-projection";
export { P } from "@/lib/town-projection";
import { findRoute, nearestWalkable, isWalkable, type Point } from "@/lib/pathfinding";
import type { EncounterSpot } from "@/lib/world-encounters";

// Upright oblique projection: ground plan matches the minimap; height offsets
// the roof up and slightly right to reveal front and side walls.
const TW = 48, TH = 36, N = 30;

const pts = (a: (readonly [number, number])[]) => a.map((p) => p.join(",")).join(" ");

// Streets have deliberate ends and T-junctions rather than an endless grid.
export const ROADS = [
  { x: 9, y: 0, w: 2, d: 30 },       // north-south Main Street, only T-junctions
  { x: 0, y: 7.6, w: 9, d: 1.8 },    // upper west street, joins Main Street
  { x: 11, y: 12.4, w: 12, d: 1.8 }, // east market street, offset 4.8 tiles
  { x: 0, y: 19, w: 9, d: 1.8 },     // lower west street, staggered again
  { x: 11, y: 26, w: 12, d: 1.8 },  // lower east street, offset 7 tiles
  { x: 23, y: 12.4, w: 2, d: 17.2 }, // east side street with T-junctions
] as const;

type B = BuildingLot;

const HOUSE_LOOK = [
  { h: 18, wall: "var(--town-box-wall)", side: "var(--town-box-side)", roof: "var(--town-box-roof)", label: "Box" },
  { h: 70, wall: "var(--town-flat-wall)", side: "var(--town-flat-side)", roof: "var(--town-flat-roof)", label: "Flat" },
  { h: 60, wall: "var(--town-house-wall)", side: "var(--town-house-side)", roof: "var(--town-house-roof)", label: "House" },
  { h: 95, wall: "var(--town-mansion-wall)", side: "var(--town-mansion-side)", roof: "var(--town-mansion-roof)", label: "Mansion" },
];

export const buildings = (house: number): B[] => {
  const hl = HOUSE_LOOK[house] ?? HOUSE_LOOK[0] ?? { h: 18, wall: "var(--town-cardboard)", side: "var(--town-cardboard-side)", roof: "var(--town-cardboard-roof)", label: "Box" };
  return [
    { facing: "south", id: "home", label: `Home · ${hl.label}`, x: 1.1, y: 2, w: 3, d: 4, h: hl.h, wall: hl.wall, side: hl.side, roof: hl.roof, sign: "var(--town-home-sign)", win: house > 0 },
    { facing: "south", id: "yard", label: "Workers Yard", x: 1.2, y: 9.2, w: 3, d: 2.8, h: 35, wall: "var(--town-depot-wall)", side: "var(--town-depot-side)", roof: "var(--town-depot-roof)", sign: "var(--town-depot-sign)", win: false },
    { facing: "south", id: "gym", label: "Iron Gym", x: 11.8, y: 8.3, w: 3, d: 3.3, h: 70, wall: "var(--town-gym-wall)", side: "var(--town-gym-side)", roof: "var(--town-gym-roof)", sign: "var(--town-gym-sign)", win: true },
    { facing: "west", id: "school", label: "Stick U", x: 12, y: 2.1, w: 4, d: 4, h: 90, wall: "var(--town-school-wall)", side: "var(--town-school-side)", roof: "var(--town-school-roof)", sign: "var(--town-school-sign)", win: true },
    { facing: "north", id: "bar", label: "The Tipsy Stick", x: 1.2, y: 22, w: 3, d: 4, h: 60, wall: "var(--town-bar-wall)", side: "var(--town-bar-side)", roof: "var(--town-bar-roof)", sign: "var(--town-bar-sign)", win: true },
    { facing: "north", id: "work", label: "MegaCorp", x: 17.2, y: 15.5, w: 3.7, d: 4, h: 190, wall: "var(--town-work-wall)", side: "var(--town-work-side)", roof: "var(--town-work-roof)", sign: "var(--town-work-sign)", win: true },
    { facing: "west", id: "alley", label: "Dark Alley", x: 12.3, y: 22.5, w: 2.5, d: 2.8, h: 55, wall: "var(--town-alley-wall)", side: "var(--town-alley-side)", roof: "var(--town-alley-roof)", sign: "var(--town-alley-sign)", win: false },
    { facing: "west", id: "bank", label: "Town Bank", x: 12, y: 15.5, w: 3.5, d: 4, h: 85, wall: "var(--town-bank-wall)", side: "var(--town-bank-side)", roof: "var(--town-bank-roof)", sign: "var(--town-bank-sign)", win: true },
    { facing: "south", id: "shop", label: "Corner Shop", x: 15.25, y: 8.65, w: 2.6, d: 3.0, h: 48, wall: "var(--town-shop-wall)", side: "var(--town-shop-side)", roof: "var(--town-shop-roof)", sign: "var(--town-shop-sign)", win: true },
    { facing: "south", id: "diner", label: "Fryday Diner", x: 5.1, y: 13.2, w: 2.8, d: 3.8, h: 55, wall: "var(--town-diner-wall)", side: "var(--town-diner-side)", roof: "var(--town-diner-roof)", sign: "var(--town-diner-sign)", win: true },
    { facing: "west", id: "pawn", label: "Oddities Pawn", x: 26, y: 13.3, w: 3, d: 3.2, h: 56, wall: "var(--town-pawn-wall)", side: "var(--town-pawn-side)", roof: "var(--town-pawn-roof)", sign: "var(--town-pawn-sign)", win: true },
    { facing: "south", id: "furniture", label: "Cosy Corner", x: 18.3, y: 7.9, w: 3.6, d: 3.7, h: 78, wall: "var(--town-furniture-wall)", side: "var(--town-furniture-side)", roof: "var(--town-furniture-roof)", sign: "var(--town-furniture-sign)", win: true },
    { facing: "north", id: "casino", label: "Lucky Sevens", x: 5.2, y: 22, w: 2.8, d: 4, h: 115, wall: "var(--town-casino-wall)", side: "var(--town-casino-side)", roof: "var(--town-casino-roof)", sign: "var(--town-casino-sign)", win: true },
    { facing: "west", id: "depot", label: "Town Transit", x: 26, y: 25.6, w: 3, d: 3.1, h: 50, wall: "var(--town-depot-wall)", side: "var(--town-depot-side)", roof: "var(--town-depot-roof)", sign: "var(--town-depot-sign)", win: true },
    { facing: "west", id: "police", label: "Town Police", x: 26, y: 19.3, w: 3, d: 3.9, h: 90, wall: "var(--town-police-wall)", side: "var(--town-police-side)", roof: "var(--town-police-roof)", sign: "var(--town-police-sign)", win: true },
    { facing: "south", id: "clinic", label: "Patch Up Clinic", x: 1.1, y: 13, w: 3, d: 4, h: 75, wall: "var(--town-clinic-wall)", side: "var(--town-clinic-side)", roof: "var(--town-clinic-roof)", sign: "var(--town-clinic-sign)", win: true },
  ];
};

export const door = (b: B) => {
  switch (b.facing) {
    case "north": return { x: b.x + b.w / 2, y: b.y - 0.6 };
    case "south": return { x: b.x + b.w / 2, y: b.y + b.d + 0.6 };
    case "east": return { x: b.x + b.w + 0.6, y: b.y + b.d / 2 };
    case "west": return { x: b.x - 0.6, y: b.y + b.d / 2 };
  }
};
const TREES = [[.6,1],[4.6,1],[8,3],[11.9,.6],[17,4],[21,4],[28.8,6],[1,11],[7.5,11],[12.2,10],[21.5,16.2],[28.8,18],[1,28],[8,28],[13.7,27.7],[18,24],[21,22],[29,29]] as const;
const LAMPS = [[2,6.9],[7,6.9],[8.4,10.3],[12,11.8],[20.8,11.8],[2,18.4],[7,18.4],[8.4,22],[12,25.4],[20,25.4],[25.5,16],[25.5,23]] as const;


function Tree({ x, y }: { x: number; y: number }) {
  const [sx, sy] = P(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx={0} cy={2} rx={14} ry={6} fill="var(--town-shadow)" opacity={0.18} />
      <rect x={-3} y={-22} width={6} height={22} fill="var(--town-tree-trunk)" stroke="var(--town-ink)" />
      <circle cx={0} cy={-34} r={18} fill="var(--town-leaf)" stroke="var(--town-ink)" strokeWidth={1.5} />
      <circle cx={-7} cy={-40} r={8} fill="var(--town-leaf-light)" />
    </g>
  );
}

function Lamp({ x, y, night }: { x: number; y: number; night: boolean }) {
  const [sx, sy] = P(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      {night && <ellipse cx={0} cy={0} rx={34} ry={16} fill="var(--town-window-lit)" opacity={0.25} />}
      <line x1={0} y1={0} x2={0} y2={-46} stroke="var(--town-lamp-post)" strokeWidth={3} />
      <circle cx={0} cy={-48} r={5} fill={night ? "var(--town-lamp-lit)" : "var(--town-lamp-glass)"} stroke="var(--town-ink)" />
    </g>
  );
}

function Car({ x, y, dir, color }: { x: number; y: number; dir: "x" | "y"; color: string }) {
  const [w, d] = dir === "x" ? [1.2, 0.6] : [0.6, 1.2];
  const bx = x - w / 2, by = y - d / 2, h = 11;
  return (
    <g>
      <polygon points={pts([P(bx, by + d), P(bx + w, by + d), P(bx + w, by + d, h), P(bx, by + d, h)])} fill={color} stroke="var(--town-ink)" />
      <polygon points={pts([P(bx + w, by), P(bx + w, by + d), P(bx + w, by + d, h), P(bx + w, by, h)])} fill={color} stroke="var(--town-ink)" filter="brightness(0.8)" opacity={0.85} />
      <polygon points={pts([P(bx, by, h), P(bx + w, by, h), P(bx + w, by + d, h), P(bx, by + d, h)])} fill={color} stroke="var(--town-ink)" />
      <polygon points={pts([P(bx + w * 0.25, by + d * 0.2, h + 8), P(bx + w * 0.75, by + d * 0.2, h + 8), P(bx + w * 0.75, by + d * 0.8, h + 8), P(bx + w * 0.25, by + d * 0.8, h + 8)])} fill="var(--town-windscreen)" stroke="var(--town-ink)" />
    </g>
  );
}

function Stick({ x, y, phase, walking, color = "var(--town-player)" }: { x: number; y: number; phase: number; walking: boolean; color?: string }) {
  const [sx, sy] = P(x, y);
  const s = walking ? Math.sin(phase) * 7 : 0;
  return (
    <g transform={`translate(${sx},${sy})`} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none">
      <ellipse cx={0} cy={0} rx={10} ry={4} fill="var(--town-shadow)" opacity={0.25} stroke="none" />
      <circle cx={0} cy={-40} r={7} fill="var(--town-paper)" />
      <line x1={0} y1={-33} x2={0} y2={-16} />
      <line x1={0} y1={-28} x2={-8 - s / 2} y2={-20 + Math.abs(s) / 3} />
      <line x1={0} y1={-28} x2={8 + s / 2} y2={-20 + Math.abs(s) / 3} />
      <line x1={0} y1={-16} x2={-s} y2={0} />
      <line x1={0} y1={-16} x2={s} y2={0} />
    </g>
  );
}

const NPCS = [
  { path: [[3, 7.2], [7, 7.2]], color: "var(--town-npc-red)", speed: 0.5 },
  { path: [[10.7, 10.5], [10.7, 17.3]], color: "var(--town-npc-blue)", speed: 0.35 },
  { path: [[11, 20.6], [17, 20.6]], color: "var(--town-npc-green)", speed: 0.45 },
] as const;

export function TownMap({ hour, house, speed = 1, onEnter, active, encounter, onEncounter }: { hour: number; house: number; speed?: number; onEnter: (id: string) => void; active: string | null; encounter?: EncounterSpot | null; onEncounter?: () => void }) {
  const bs = buildings(house);
  const svgRef = useRef<SVGSVGElement>(null);
  const me = useRef({ x: 9.95, y: 9.0, phase: 0, walking: false });
  const target = useRef<{ waypoints: Point[]; enter?: string | undefined } | null>(null);
  const routeTo = (destination: Point, enter?: string) => {
    if (!isWalkable(me.current, bs)) Object.assign(me.current, nearestWalkable(me.current, bs));
    const route = findRoute(me.current, destination, bs);
    target.current = route.length ? { waypoints: route, enter } : null;
  };
  const keys = useRef(new Set<string>());
  const [t, setT] = useState(0);
  const [near, setNear] = useState<B | null>(null);
  const nearRef = useRef<B | null>(null);
  const enterRef = useRef(onEnter);
  enterRef.current = onEnter;

  const blocked = (x: number, y: number) =>
    x < 0.2 || y < 0.2 || x > N - 0.2 || y > N - 0.2 || bs.some((b) => x > b.x - 0.15 && x < b.x + b.w + 0.15 && y > b.y - 0.15 && y < b.y + b.d + 0.15);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if ((k === "e" || k === " " || k === "enter") && nearRef.current) enterRef.current(nearRef.current.id);
      keys.current.add(k);
      target.current = null;
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    if (!isWalkable(me.current, bs)) Object.assign(me.current, nearestWalkable(me.current, bs));
    // Limit expensive React/SVG scene reconciliation to 20 FPS on mobile.
    // The browser still schedules RAF normally, but most frames do no React work.
    let last = performance.now(), raf = 0;
    const FRAME_MS = 50;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const k = keys.current, m = me.current;
      let dx = 0, dy = 0;
      if (k.has("w") || k.has("arrowup")) dy -= 1;
      if (k.has("s") || k.has("arrowdown")) dy += 1;
      if (k.has("a") || k.has("arrowleft")) dx -= 1;
      if (k.has("d") || k.has("arrowright")) dx += 1;
      if (!dx && !dy && target.current) {
        const waypoint = target.current.waypoints[0];
        if (waypoint) {
          dx = waypoint.x - m.x; dy = waypoint.y - m.y;
          if (Math.hypot(dx, dy) < Math.max(0.15, 4.5 * speed * dt)) {
            target.current.waypoints.shift(); dx = dy = 0;
          }
        }
        if (target.current && target.current.waypoints.length === 0) {
          const id = target.current.enter;
          target.current = null;
          if (id) enterRef.current(id);
        }
      }
      const len = Math.hypot(dx, dy);
      m.walking = len > 0;
      if (len) {
        const sp = 4.5 * speed * dt;
        const nx = m.x + (dx / len) * sp, ny = m.y + (dy / len) * sp;
        if (!blocked(nx, ny)) { m.x = nx; m.y = ny; }
        else if (!blocked(nx, m.y)) m.x = nx;
        else if (!blocked(m.x, ny)) m.y = ny;
        else target.current = null;
        m.phase += dt * 12;
      }
      const n = bs.find((b) => { const dd = door(b); return Math.hypot(dd.x - m.x, dd.y - m.y) < 1; }) ?? null;
      if (n?.id !== nearRef.current?.id) { nearRef.current = n; setNear(n); }
      setT(now / 1000);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house, speed]);

  const toTile = (e: React.PointerEvent) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = pt.matrixTransform(matrix.inverse());
    return { x: p.x / TW, y: p.y / TH };
  };

  const night = hour >= 19 || hour < 6;
  const dusk = hour >= 17 && hour < 19;
  const m = me.current;

  // depth-sorted drawables
  const items: { key: number; el: React.ReactNode }[] = [];
  bs.forEach((b) => items.push({ key: (b.y + b.d) * 100 + b.x, el: (
    <g key={b.id} onClick={(e) => { e.stopPropagation(); routeTo(door(b), b.id); }} className="cursor-pointer" opacity={active === b.id ? 1 : 0.97}>
      <BuildingExterior b={b} night={night} />
    </g>) }));
  TREES.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Tree key={`t${i}`} x={x} y={y} /> }));
  LAMPS.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Lamp key={`l${i}`} x={x} y={y} night={night || dusk} /> }));
  const c1 = ((t * 2.2) % 8), c2 = 11 + ((t * 1.7) % 12), c3 = ((t * 1.9 + 7) % (N + 4)) - 2;
  items.push({ key: 8.5 * 100 + c1, el: <Car key="c1" x={c1} y={8.5} dir="x" color="var(--town-car-red)" /> });
  items.push({ key: 13.3 * 100 + c2, el: <Car key="c2" x={c2} y={13.3} dir="x" color="var(--town-car-blue)" /> });
  items.push({ key: c3 * 100 + 10, el: <Car key="c3" x={10} y={c3} dir="y" color="var(--town-car-yellow)" /> });
  NPCS.forEach((n, i) => {
    const [[ax, ay], [bx, by]] = n.path;
    const f = (Math.sin(t * n.speed + i) + 1) / 2;
    const x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
    items.push({ key: y * 100 + x, el: <Stick key={`n${i}`} x={x} y={y} phase={t * 8} walking color={n.color} /> });
  });
  if(encounter){
    const e=encounter;
    const sway=e.pose==="pacing"?Math.sin(t*1.8)*.32:0;
    const px=e.x+sway;
    const [sx,sy]=P(px,e.y);
    items.push({key:e.y*100+px,el:<g key="encounter" className="cursor-pointer" role="button" aria-label={e.hint} onPointerDown={ev=>ev.stopPropagation()} onClick={ev=>{ev.stopPropagation();onEncounter?.();}}>
      <g transform={`translate(${sx} ${sy})`}>
        <ellipse cy="2" rx="12" ry="4" opacity=".2" fill="#16131e"/>
        <g stroke="var(--town-ink)" strokeWidth="3" strokeLinecap="round" fill="none">
          <circle cy="-42" r="8" fill="#f3d7b8"/>
          <path d={e.pose==="sitting"?"M0 -34V-19L14 -14M0 -19L-9 -7M0 -19L12 -5":"M0 -34V-17M0 -29L-13 -19M0 -29L12 -22M0 -17L-9 0M0 -17L9 0"}/>
          <path d="M-6 -32H6L7 -22H-7Z" fill="#906ca6"/>
        </g>
        <g transform={`translate(0 ${-72+Math.sin(t*3)*3})`}>
          <rect x="-19" y="-24" width="38" height="29" rx="12" fill="#fff2d4" stroke="#24202b" strokeWidth="3"/>
          <text textAnchor="middle" y="-4" fontSize="18" fontWeight="bold" fill="#25202b">{e.icon}</text>
          <path d="M-3 4L0 12L6 4" fill="#fff2d4" stroke="#24202b" strokeWidth="2"/>
        </g>
        <rect x="-30" y="-94" width="60" height="108" fill="transparent" />
      </g>
    </g>});
  }
  items.push({ key: m.y * 100 + m.x, el: <Stick key="me" x={m.x} y={m.y} phase={m.phase} walking={m.walking} /> });
  items.sort((a, b) => a.key - b.key);

  const tile = (x: number, y: number, w: number, d: number, fill: string, k: string) => (
    <polygon key={k} points={pts([P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)])} fill={fill} />
  );

  return (
    <div className={"absolute inset-0 overflow-hidden " + (night ? "town-night" : dusk ? "town-dusk" : "town-day")}>
      <svg ref={svgRef} viewBox={(() => { const [cx, cy] = P(m.x, m.y); return `${cx - 240} ${cy - 415} 480 800`; })()} preserveAspectRatio="xMidYMid slice" className="block h-full w-full touch-none select-none font-hand"
        onPointerDown={(e) => { const p = toTile(e); if (!p) return; routeTo({ x: Math.max(0.3, Math.min(N - 0.3, p.x)), y: Math.max(0.3, Math.min(N - 0.3, p.y)) }); }}>
        {/* Plot-led map: green blocks first, with pavements sized to actual roads and doors. */}
        {tile(0,0,N,N,"var(--town-grass)","grass")}
        {/* Plots intermix naturally; there are no imposed rectangular districts. */}
        {tile(0,0,8.8,7.2,"var(--town-lawn)","quiet-green")}
        {tile(11.5,21.5,10.7,8.4,"var(--town-park-lawn)","park-green")}
        {/* Road shoulders do not extend across entire neighbourhoods. */}
        {ROADS.map((r,i) => tile(Math.max(0,r.x-.42),Math.max(0,r.y-.42),
          Math.min(N,r.x+r.w+.42)-Math.max(0,r.x-.42),
          Math.min(N,r.y+r.d+.42)-Math.max(0,r.y-.42),
          "var(--town-pavement)","kerb-"+i))}
        {/* Individual lawns and building setbacks, rather than continuous square paving. */}
        {bs.map(b => tile(Math.max(0,b.x-.15),Math.max(0,b.y-.15),b.w+.3,b.d+.3,
          b.id==="casino" || b.id==="alley"?"var(--town-backlot)":"var(--town-garden)","lot-"+b.id))}
        {/* Short building approach paths, connected to the closest available road. */}
        {bs.map(b => {
          const d=door(b);
          const r=ROADS.map(road=>{
            const x=Math.max(road.x,Math.min(road.x+road.w,d.x));
            const y=Math.max(road.y,Math.min(road.y+road.d,d.y));
            return {x,y,distance:Math.hypot(d.x-x,d.y-y)};
          }).sort((a,b)=>a.distance-b.distance)[0];
          if(!r) return null;
          return tile(Math.min(d.x,r.x)-.22,Math.min(d.y,r.y)-.22,
            Math.abs(d.x-r.x)+.44,Math.abs(d.y-r.y)+.44,"var(--town-approach)","approach-"+b.id);
        })}
        {/* Central park: not another paved rectangle. */}
        {tile(15.3,21.4,5.6,3.5,"var(--town-park)","park")}
        <ellipse cx={P(18,23.3)[0]} cy={P(14.5,24.1)[1]} rx={38} ry={23} fill="var(--town-pond)" stroke="var(--town-pond-edge)" strokeWidth={3} />
        {tile(17.6,20.9,0.45,4.3,"var(--town-park-path)","park-path-ns")}
        {tile(15.2,23.9,5.5,0.4,"var(--town-park-path)","park-path-ew")}
        {/* Roads are finite streets with deliberate ends and T-junctions. */}
        {ROADS.map((r,i)=>tile(r.x,r.y,r.w,r.d,"var(--town-asphalt)","road-"+i))}
        {/* Lane paint is generated from each actual street, never a removed grid road. */}
        {ROADS.map((r,i)=>{
          const vertical=r.d>r.w;
          const count=Math.floor((vertical?r.d:r.w)/2.4);
          return Array.from({length:count},(_,j)=>
            vertical?tile(r.x+r.w/2-.05,r.y+.6+j*2.4,.1,.85,"var(--town-lane-paint)","line-"+i+"-"+j):
              tile(r.x+.6+j*2.4,r.y+r.d/2-.05,.85,.1,"var(--town-lane-paint)","line-"+i+"-"+j));
        })}
        {/* Crossings only where the staggered side roads actually meet the spine. */}
        {[7.6,12.4,19,26].map((y,i)=>
          <g key={"crossing-"+i}>{Array.from({length:4},(_,j)=>
            tile(9.15+j*.44,y-.35,.25,.4,"var(--town-crossing)","stripe-"+i+"-"+j))}</g>)}
        {/* Every property has a short approach path linking its door to the surrounding pavement. */}
        {bs.map((b) => {
          const d = door(b);
          const south = b.facing === "south";
          const north = b.facing === "north";
          const x = south || north ? d.x - 0.33 : Math.min(d.x, b.facing === "east" ? b.x+b.w : b.x) - 0.05;
          const y = south ? b.y+b.d : north ? d.y : d.y - 0.33;
          const w = south || north ? 0.66 : 0.7;
          const depth = south || north ? 0.65 : 0.66;
          return tile(x, y, w, depth, "var(--town-door-path)", "walk-" + b.id);
        })}
        {/* alley grime */}
        {tile(11.6, 23, .55, 1.5, "var(--town-grime)", "gr")}
        <polygon points={pts([P(0, N), P(N, N), P(N, N, -22), P(0, N, -22)])} fill="var(--town-earth-front)" stroke="var(--town-ink)" />
        <polygon points={pts([P(N, 0), P(N, N), P(N, N, -22), P(N, 0, -22)])} fill="var(--town-earth-side)" stroke="var(--town-ink)" />
        {target.current && !target.current.enter && (() => { const end = target.current.waypoints.at(-1); if (!end) return null; const [x, y] = P(end.x, end.y); return <ellipse cx={x} cy={y} rx={12} ry={6} fill="none" stroke="var(--town-paper)" strokeWidth={2} />; })()}
        {items.map((i) => i.el)}
        {(night || dusk) && <rect x={-2000} y={-2000} width={4000} height={4000} fill={night ? "var(--town-night-wash)" : "var(--town-dusk-wash)"} opacity={night ? 0.4 : 0.15} pointerEvents="none" />}
      </svg>
      
      {/* Compact overhead minimap: same world coordinates as navigation, not screen pixels. */}
      <div className="absolute bottom-16 left-3 z-10 w-32 rounded-lg border-2 border-foreground bg-card/95 p-1 shadow-lg sm:bottom-3 sm:w-40" aria-label="Town minimap">
        <div className="mb-1 flex items-center justify-between px-1 text-xs font-bold">
          <span>🗺️ Town map</span>
        </div>
        <svg viewBox={`0 0 ${N} ${N}`} className="aspect-square w-full rounded bg-town-grass" role="img" aria-label="Overhead map showing buildings and your location"
          onPointerDown={(e) => {
            e.stopPropagation();
            const bounds = e.currentTarget.getBoundingClientRect();
            routeTo({
              x: Math.max(0.3, Math.min(N - 0.3, (e.clientX - bounds.left) / bounds.width * N)),
              y: Math.max(0.3, Math.min(N - 0.3, (e.clientY - bounds.top) / bounds.height * N)),
            });
          }}>
          <rect x="12" y="21" width="4.6" height="7" fill="var(--town-mini-park)" />
          {ROADS.map((r,i) => <rect key={"mini-road-"+i} x={r.x} y={r.y} width={r.w} height={r.d} fill="var(--town-mini-road)" />)}
          {bs.map((b) => <rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.d}
            fill={b.sign} stroke="var(--town-paper)" strokeWidth={0.18} rx={0.2}>
            <title>{b.label}</title>
          </rect>)}
          <circle cx={m.x} cy={m.y} r={0.85} fill="var(--town-paper)" stroke="var(--town-player)" strokeWidth={0.35} />
          <circle cx={m.x} cy={m.y} r={0.28} fill="var(--town-player-marker)" />
        </svg>
      </div>

      {near && (
        <Button onClick={() => onEnter(near.id)} className="absolute bottom-64 left-1/2 max-w-[calc(100%-24px)] -translate-x-1/2 rounded-sm border-2 border-foreground bg-primary px-4 py-1 text-lg text-primary-foreground sm:bottom-24">
          Enter {near.label} <span className="hidden sm:inline">(E)</span>
        </Button>
      )}
    </div>
  );
}
