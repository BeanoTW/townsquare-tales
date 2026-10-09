import { useEffect, useRef, useState } from "react";
import { findRoute, type Point } from "@/lib/pathfinding";

// Upright oblique projection: ground plan matches the minimap; height offsets
// the roof up and slightly right to reveal front and side walls.
const TW = 48, TH = 36, N = 30;
export const P = (x: number, y: number, h = 0) => [x * TW + h * 0.025, y * TH - h * 0.57] as const;
const pts = (a: (readonly [number, number])[]) => a.map((p) => p.join(",")).join(" ");

// Streets have deliberate ends and T-junctions rather than an endless grid.
export const ROADS = [
  { x: 9, y: 0, w: 2, d: 30 },       // Main Street: the town's north-south spine
  { x: 0, y: 8, w: 24, d: 1.8 },     // residential / campus street, ends at East Lane
  { x: 22, y: 8, w: 2, d: 22 },      // East Lane, stopping at the edge of town
  { x: 0, y: 18.3, w: 24, d: 1.8 },  // market street: the main shopping T-junction
  { x: 0, y: 27.3, w: 11, d: 1.7 },  // local access street with an actual end
  { x: 22, y: 26.5, w: 7, d: 1.7 },  // depot turning street
] as const;

type Facing = "north" | "south" | "east" | "west";
type B = { facing: Facing; id: string; label: string; x: number; y: number; w: number; d: number; h: number; wall: string; side: string; roof: string; sign: string; win?: boolean };

const HOUSE_LOOK = [
  { h: 18, wall: "#c9a26b", side: "#a9824f", roof: "#dcb986", label: "Box" },
  { h: 70, wall: "#d9d2c3", side: "#b5ad9c", roof: "#8a8172", label: "Flat" },
  { h: 60, wall: "#e8dcc0", side: "#c3b593", roof: "#b2553f", label: "House" },
  { h: 95, wall: "#f4efe4", side: "#cfc7b4", roof: "#4a5a72", label: "Mansion" },
];

export const buildings = (house: number): B[] => {
  const hl = HOUSE_LOOK[house] ?? HOUSE_LOOK[0]!;
  return [
    { facing: "south", id: "home", label: `Home · ${hl.label}`, x: 1.1, y: 1.9, w: 3.1, d: 4, h: hl.h, wall: hl.wall, side: hl.side, roof: hl.roof, sign: "#3b3b3b", win: house > 0 },
    { facing: "south", id: "gym", label: "Iron Gym", x: 17.8, y: 2.9, w: 3, d: 3.4, h: 70, wall: "#8f9aa6", side: "#6d7884", roof: "#3f4852", sign: "#d6402f", win: true },
    { facing: "south", id: "school", label: "Stick U", x: 12.1, y: 1.8, w: 4, d: 4.2, h: 90, wall: "#b65c43", side: "#8f4331", roof: "#5f6b4a", sign: "#2d4a7a", win: true },
    { facing: "south", id: "bar", label: "The Tipsy Stick", x: 1.2, y: 22.2, w: 3, d: 4, h: 60, wall: "#5a3a5e", side: "#432a46", roof: "#2c1c2f", sign: "#e94d8a", win: true },
    { facing: "east", id: "work", label: "MegaCorp", x: 17.4, y: 21.2, w: 3.4, d: 4, h: 190, wall: "#7aa3bf", side: "#57809c", roof: "#3b5a70", sign: "#1f2d3a", win: true },
    { facing: "west", id: "alley", label: "Dark Alley", x: 25.2, y: 25.2, w: 3, d: 1.1, h: 55, wall: "#4b4642", side: "#36322f", roof: "#262321", sign: "#9b8f3a", win: false },
    { facing: "south", id: "bank", label: "Town Bank", x: 12.3, y: 12.1, w: 3.8, d: 4.1, h: 85, wall: "#d5c39b", side: "#9f8969", roof: "#605c56", sign: "#255b45", win: true },
    { facing: "south", id: "shop", label: "Corner Shop", x: 5.3, y: 2.5, w: 2.5, d: 3.3, h: 48, wall: "#e0b36b", side: "#bd873a", roof: "#6f3c32", sign: "#a02b34", win: true },
    { facing: "south", id: "diner", label: "Fryday Diner", x: 5.4, y: 12.4, w: 2.5, d: 3.8, h: 55, wall: "#f4b24c", side: "#d77d38", roof: "#a93832", sign: "#c12932", win: true },
    { facing: "west", id: "pawn", label: "Oddities Pawn", x: 25.1, y: 2.7, w: 3, d: 3.5, h: 56, wall: "#b1a478", side: "#887c5d", roof: "#5c514b", sign: "#47624b", win: true },
    { facing: "south", id: "furniture", label: "Cosy Corner", x: 17.5, y: 12.3, w: 3.2, d: 3.6, h: 78, wall: "#e8d0a4", side: "#b99871", roof: "#6c5a48", sign: "#a75a38", win: true },
    { facing: "south", id: "casino", label: "Lucky Sevens", x: 5.3, y: 22.2, w: 2.8, d: 4, h: 115, wall: "#66519a", side: "#43386c", roof: "#302847", sign: "#e7bb40", win: true },
    { facing: "west", id: "depot", label: "Town Transit", x: 25.2, y: 21.3, w: 3.2, d: 3.1, h: 50, wall: "#91b6bd", side: "#628b91", roof: "#394e56", sign: "#2e6477", win: true },
    { facing: "west", id: "police", label: "Town Police", x: 25.2, y: 12.1, w: 3.1, d: 4, h: 90, wall: "#9eacc0", side: "#748498", roof: "#465366", sign: "#234c86", win: true },
    { facing: "south", id: "clinic", label: "Patch Up Clinic", x: 1.1, y: 12.3, w: 3, d: 3.8, h: 75, wall: "#dce5d9", side: "#adbea9", roof: "#678676", sign: "#399179", win: true },
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
const TREES = [[0.7,1],[4.5,1.2],[8.1,3],[11.6,1],[16.5,1],[21.2,3],[28.8,6],[1.1,10.8],[8,14],[11.5,11],[21,14],[28.8,17],[1,21],[8.1,24],[12.4,22],[15.6,26.2],[21,27],[28.8,21]] as const;
const LAMPS = [[3,7.1],[7,7.1],[13,7.1],[20,7.1],[2,17.5],[7,17.5],[15,17.5],[21,17.5],[3,26.6],[7,26.6],[23.7,15],[23.7,24]] as const;

function Box({ b, night }: { b: B; night: boolean }) {
  const { x, y, w, d, h } = b;
  const front = [P(x, y + d), P(x + w, y + d), P(x + w, y + d, h), P(x, y + d, h)];
  const right = [P(x + w, y), P(x + w, y + d), P(x + w, y + d, h), P(x + w, y, h)];
  const top = [P(x, y, h), P(x + w, y, h), P(x + w, y + d, h), P(x, y + d, h)];
  const winFill = night ? "#ffd46b" : "#2b3a4a";
  const wins: React.ReactNode[] = [];
  if (b.win) {
    const rows = Math.max(1, Math.floor((h - 24) / 26));
    for (let r = 0; r < rows; r++) {
      const z0 = 26 + r * 26, z1 = z0 + 14;
      for (let c = 0; c < Math.floor(w * 1.5); c++) {
        const u0 = x + 0.3 + c * (w - 0.4) / Math.floor(w * 1.5), u1 = u0 + 0.35;
        wins.push(<polygon key={`f${r}${c}`} points={pts([P(u0, y + d, z0), P(u1, y + d, z0), P(u1, y + d, z1), P(u0, y + d, z1)])} fill={winFill} opacity={night && (r + c) % 3 === 0 ? 0.35 : 0.9} />);
      }
      for (let c = 0; c < Math.floor(d * 1.5); c++) {
        const v0 = y + 0.3 + c * (d - 0.4) / Math.floor(d * 1.5), v1 = v0 + 0.35;
        wins.push(<polygon key={`r${r}${c}`} points={pts([P(x + w, v0, z0), P(x + w, v1, z0), P(x + w, v1, z1), P(x + w, v0, z1)])} fill={winFill} opacity={0.75} />);
      }
    }
  }
  const dc = x + w / 2, dy = y + d / 2;
  const face = b.facing;
  const doorPts = face === "north" || face === "south"
    ? [P(dc - .3, face === "south" ? y+d : y), P(dc + .3, face === "south" ? y+d : y), P(dc + .3, face === "south" ? y+d : y, 22), P(dc - .3, face === "south" ? y+d : y, 22)]
    : [P(face === "east" ? x+w : x, dy-.34), P(face === "east" ? x+w : x, dy+.34), P(face === "east" ? x+w : x, dy+.34, 22), P(face === "east" ? x+w : x, dy-.34, 22)];
  const north = [P(x,y),P(x+w,y),P(x+w,y,h),P(x,y,h)];
  const left = [P(x,y),P(x,y+d),P(x,y+d,h),P(x,y,h)];
  const [lx, ly] = P(x + w / 2, y + d / 2, h);
  return (
    <g>
      <polygon points={pts([P(x + 0.2, y + d + 0.3), P(x + w + 0.3, y + d + 0.3), P(x + w + 0.3, y + 0.2), P(x + w, y), P(x, y + d)])} fill="#000" opacity={0.18} />
      <polygon points={pts(north)} fill={face === "north" ? b.wall : b.side} stroke="#1d1d1d" strokeWidth={1.5} />
      <polygon points={pts(left)} fill={face === "west" ? b.wall : b.side} stroke="#1d1d1d" strokeWidth={1.5} />
      <polygon points={pts(right)} fill={face === "east" ? b.wall : b.side} stroke="#1d1d1d" strokeWidth={1.5} />
      <polygon points={pts(front)} fill={face === "south" ? b.wall : b.side} stroke="#1d1d1d" strokeWidth={1.5} />
      {wins}
      <polygon points={pts(doorPts)} fill={night ? "#ffcf5c" : "#3a2a1e"} stroke="#1d1d1d" />
      <polygon points={pts(top)} fill={b.roof} stroke="#1d1d1d" strokeWidth={1.5} />
      <g transform={`translate(${lx},${ly - 22})`}>
        <rect x={-b.label.length * 4.2 - 8} y={-13} width={b.label.length * 8.4 + 16} height={22} rx={4} fill={b.sign} stroke="#1d1d1d" strokeWidth={1.5} />
        <text textAnchor="middle" y={4} fontSize={15} fill="#fff" fontWeight={700}>{b.label}</text>
      </g>
    </g>
  );
}

function Tree({ x, y }: { x: number; y: number }) {
  const [sx, sy] = P(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx={0} cy={2} rx={14} ry={6} fill="#000" opacity={0.18} />
      <rect x={-3} y={-22} width={6} height={22} fill="#6b4a2e" stroke="#1d1d1d" />
      <circle cx={0} cy={-34} r={18} fill="#4f8a4a" stroke="#1d1d1d" strokeWidth={1.5} />
      <circle cx={-7} cy={-40} r={8} fill="#6aa65f" />
    </g>
  );
}

function Lamp({ x, y, night }: { x: number; y: number; night: boolean }) {
  const [sx, sy] = P(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      {night && <ellipse cx={0} cy={0} rx={34} ry={16} fill="#ffd46b" opacity={0.25} />}
      <line x1={0} y1={0} x2={0} y2={-46} stroke="#2a2a2a" strokeWidth={3} />
      <circle cx={0} cy={-48} r={5} fill={night ? "#ffe9a8" : "#cfcfcf"} stroke="#1d1d1d" />
    </g>
  );
}

function Car({ x, y, dir, color }: { x: number; y: number; dir: "x" | "y"; color: string }) {
  const [w, d] = dir === "x" ? [1.2, 0.6] : [0.6, 1.2];
  const bx = x - w / 2, by = y - d / 2, h = 11;
  return (
    <g>
      <polygon points={pts([P(bx, by + d), P(bx + w, by + d), P(bx + w, by + d, h), P(bx, by + d, h)])} fill={color} stroke="#1d1d1d" />
      <polygon points={pts([P(bx + w, by), P(bx + w, by + d), P(bx + w, by + d, h), P(bx + w, by, h)])} fill={color} stroke="#1d1d1d" filter="brightness(0.8)" opacity={0.85} />
      <polygon points={pts([P(bx, by, h), P(bx + w, by, h), P(bx + w, by + d, h), P(bx, by + d, h)])} fill={color} stroke="#1d1d1d" />
      <polygon points={pts([P(bx + w * 0.25, by + d * 0.2, h + 8), P(bx + w * 0.75, by + d * 0.2, h + 8), P(bx + w * 0.75, by + d * 0.8, h + 8), P(bx + w * 0.25, by + d * 0.8, h + 8)])} fill="#bfe3f5" stroke="#1d1d1d" />
    </g>
  );
}

function Stick({ x, y, phase, walking, color = "#111" }: { x: number; y: number; phase: number; walking: boolean; color?: string }) {
  const [sx, sy] = P(x, y);
  const s = walking ? Math.sin(phase) * 7 : 0;
  return (
    <g transform={`translate(${sx},${sy})`} stroke={color} strokeWidth={3} strokeLinecap="round" fill="none">
      <ellipse cx={0} cy={0} rx={10} ry={4} fill="#000" opacity={0.25} stroke="none" />
      <circle cx={0} cy={-40} r={7} fill="#fff" />
      <line x1={0} y1={-33} x2={0} y2={-16} />
      <line x1={0} y1={-28} x2={-8 - s / 2} y2={-20 + Math.abs(s) / 3} />
      <line x1={0} y1={-28} x2={8 + s / 2} y2={-20 + Math.abs(s) / 3} />
      <line x1={0} y1={-16} x2={-s} y2={0} />
      <line x1={0} y1={-16} x2={s} y2={0} />
    </g>
  );
}

const NPCS = [
  { path: [[3, 7.2], [7, 7.2]], color: "#7a2a2a", speed: 0.5 },
  { path: [[10.7, 10.5], [10.7, 17.3]], color: "#2a4a7a", speed: 0.35 },
  { path: [[11, 20.6], [17, 20.6]], color: "#2a6a3a", speed: 0.45 },
] as const;

export function TownMap({ hour, house, speed = 1, onEnter, active }: { hour: number; house: number; speed?: number; onEnter: (id: string) => void; active: string | null }) {
  const bs = buildings(house);
  const svgRef = useRef<SVGSVGElement>(null);
  const me = useRef({ x: 9.95, y: 9.0, phase: 0, walking: false });
  const target = useRef<{ waypoints: Point[]; enter?: string } | null>(null);
  const routeTo = (destination: Point, enter?: string) => {
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
    let last = performance.now(), raf = 0;
    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
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
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house, speed]);

  const toTile = (e: React.PointerEvent) => {
    const svg = svgRef.current!;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const p = pt.matrixTransform(svg.getScreenCTM()!.inverse());
    return { x: p.x / TW, y: p.y / TH };
  };

  const night = hour >= 19 || hour < 6;
  const dusk = hour >= 17 && hour < 19;
  const m = me.current;

  // depth-sorted drawables
  const items: { key: number; el: React.ReactNode }[] = [];
  bs.forEach((b) => items.push({ key: (b.y + b.d) * 100 + b.x, el: (
    <g key={b.id} onClick={(e) => { e.stopPropagation(); routeTo(door(b), b.id); }} className="cursor-pointer" opacity={active === b.id ? 1 : 0.97}>
      <Box b={b} night={night} />
    </g>) }));
  TREES.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Tree key={`t${i}`} x={x} y={y} /> }));
  LAMPS.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Lamp key={`l${i}`} x={x} y={y} night={night || dusk} /> }));
  const c1 = ((t * 2.2) % 23), c2 = 23 - ((t * 1.7) % 23), c3 = ((t * 1.9 + 7) % (N + 4)) - 2;
  items.push({ key: 8.9 * 100 + c1, el: <Car key="c1" x={c1} y={8.9} dir="x" color="#d94a3a" /> });
  items.push({ key: 19.2 * 100 + c2, el: <Car key="c2" x={c2} y={19.2} dir="x" color="#3a7bd9" /> });
  items.push({ key: c3 * 100 + 10, el: <Car key="c3" x={10} y={c3} dir="y" color="#e6b83a" /> });
  NPCS.forEach((n, i) => {
    const [[ax, ay], [bx, by]] = n.path;
    const f = (Math.sin(t * n.speed + i) + 1) / 2;
    const x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
    items.push({ key: y * 100 + x, el: <Stick key={`n${i}`} x={x} y={y} phase={t * 8} walking color={n.color} /> });
  });
  items.push({ key: m.y * 100 + m.x, el: <Stick key="me" x={m.x} y={m.y} phase={m.phase} walking={m.walking} /> });
  items.sort((a, b) => a.key - b.key);

  const tile = (x: number, y: number, w: number, d: number, fill: string, k: string) => (
    <polygon key={k} points={pts([P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)])} fill={fill} />
  );

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: night ? "#1b2433" : dusk ? "#e8a76a" : "#9fd3e8" }}>
      <svg ref={svgRef} viewBox={(() => { const [cx, cy] = P(m.x, m.y); return `${cx - 240} ${cy - 415} 480 800`; })()} preserveAspectRatio="xMidYMid slice" className="block h-full w-full touch-none select-none font-hand"
        onPointerDown={(e) => { const p = toTile(e); routeTo({ x: Math.max(0.3, Math.min(N - 0.3, p.x)), y: Math.max(0.3, Math.min(N - 0.3, p.y)) }); }}>
        {/* Plot-led map: green blocks first, with pavements sized to actual roads and doors. */}
        {tile(0,0,N,N,"#83b773","grass")}
        {/* Mixed neighbourhood greens without artificial rectangular district boundaries. */}
        {tile(0,0,8.8,7.4,"#8dbd7b","green-northwest")}
        {tile(11.7,0,10.1,7.3,"#91bd83","green-northeast")}
        {tile(0,20.7,8.7,6.2,"#7ead75","green-southwest")}
        {tile(11.8,21.2,9.5,7.4,"#91bf79","green-park")}
        {/* Road shoulders do not extend across entire neighbourhoods. */}
        {ROADS.map((r,i) => tile(Math.max(0,r.x-.42),Math.max(0,r.y-.42),
          Math.min(N,r.x+r.w+.42)-Math.max(0,r.x-.42),
          Math.min(N,r.y+r.d+.42)-Math.max(0,r.y-.42),
          "#d2cec2","kerb-"+i))}
        {/* Individual lawns and building setbacks, rather than continuous square paving. */}
        {bs.map(b => tile(Math.max(0,b.x-.15),Math.max(0,b.y-.15),b.w+.3,b.d+.3,
          b.id==="casino" || b.id==="alley"?"#84a16e":"#a3c58b","lot-"+b.id))}
        {/* Paths connect the side-street plots to their actual street frontages. */}
        {tile(11.05,5.8,.38,2.4,"#dfd5be","campus-link")}
        {tile(21,10,.42,8.4,"#dfd5be","east-walk")}
        {tile(11.1,20.3,.38,6.8,"#dfd5be","park-walk")}
        {/* Central park: not another paved rectangle. */}
        {tile(12.15,22.1,3.9,5.2,"#a4cb82","park")}
        <ellipse cx={P(14.5,24.1)[0]} cy={P(14.5,24.1)[1]} rx={38} ry={23} fill="#5aa7c9" stroke="#4086a3" strokeWidth={3} />
        {tile(13.7,21,0.45,7.2,"#e3d7b7","park-path-ns")}
        {tile(12.3,25.3,4.3,0.4,"#e3d7b7","park-path-ew")}
        {/* Roads are finite streets with deliberate ends and T-junctions. */}
        {ROADS.map((r,i)=>tile(r.x,r.y,r.w,r.d,"#3d3f44","road-"+i))}
        {/* Dashed centre markings respect the actual road segments. */}
        {Array.from({length:15},(_,i)=>i*2+.5).filter(y=>y<7.6||(y>10.2&&y<17.8)||(y>20.5&&y<26.8)).map(y=>tile(9.95,y,.1,.85,"#efd04f","main-dash-"+y))}
        {[.7,2.7,4.7,6.7,11.6,13.6,15.6,17.6,19.6].map(x=>tile(x,8.84,.85,.1,"#efd04f","upper-dash-"+x))}
        {[.7,2.7,4.7,6.7,11.6,13.6,15.6,17.6,19.6].map(x=>tile(x,19.12,.85,.1,"#efd04f","market-dash-"+x))}
        {[.7,2.7,4.7,6.7].map(x=>tile(x,28.11,.85,.1,"#efd04f","lower-dash-"+x))}
        {[10.5,12.5,14.5,16.5,21.5,23.5,25.5].map(y=>tile(22.95,y,.1,.85,"#efd04f","east-dash-"+y))}
        {/* Crossings and marked road-end thresholds. */}
        {[0,1,2,3].map(i=><g key={"cross-"+i}>{tile(8.45,7.85+i*.36,.43,.2,"#f2f2ea","cross-a"+i)}{tile(10.95,18.4+i*.35,.42,.2,"#f2f2ea","cross-b"+i)}</g>)}
        {tile(23.92,8,.12,1.8,"#efefea","east-kerb-cap")}
        {tile(0,27.2,8.7,.12,"#e1d9c8","lower-kerb")}
        {/* Every property has a short approach path linking its door to the surrounding pavement. */}
        {bs.map((b) => {
          const d = door(b);
          const south = b.facing === "south";
          const north = b.facing === "north";
          const x = south || north ? d.x - 0.33 : Math.min(d.x, b.facing === "east" ? b.x+b.w : b.x) - 0.05;
          const y = south ? b.y+b.d : north ? d.y : d.y - 0.33;
          const w = south || north ? 0.66 : 0.7;
          const depth = south || north ? 0.65 : 0.66;
          return tile(x, y, w, depth, "#e4ddce", "walk-" + b.id);
        })}
        {/* alley grime */}
        {tile(15.5, 13, 1, 1, "#3a3733", "gr")}
        <polygon points={pts([P(0, N), P(N, N), P(N, N, -22), P(0, N, -22)])} fill="#5b7a43" stroke="#1d1d1d" />
        <polygon points={pts([P(N, 0), P(N, N), P(N, N, -22), P(N, 0, -22)])} fill="#4a6536" stroke="#1d1d1d" />
        {target.current && !target.current.enter && (() => { const end = target.current.waypoints.at(-1)!; const [x, y] = P(end.x, end.y); return <ellipse cx={x} cy={y} rx={12} ry={6} fill="none" stroke="#fff" strokeWidth={2} />; })()}
        {items.map((i) => i.el)}
        {(night || dusk) && <rect x={-2000} y={-2000} width={4000} height={4000} fill={night ? "#0b1530" : "#c2562a"} opacity={night ? 0.4 : 0.15} pointerEvents="none" />}
      </svg>
      
      {/* Compact overhead minimap: same world coordinates as navigation, not screen pixels. */}
      <div className="absolute bottom-16 left-3 z-10 w-32 rounded-lg border-2 border-foreground bg-card/95 p-1 shadow-lg sm:bottom-3 sm:w-40" aria-label="Town minimap">
        <div className="mb-1 flex items-center justify-between px-1 text-xs font-bold">
          <span>🗺️ Town map</span>
          <span className="text-[10px] font-normal text-muted-foreground">Tap to walk</span>
        </div>
        <svg viewBox={`0 0 ${N} ${N}`} className="aspect-square w-full rounded bg-[#8ab979]" role="img" aria-label="Overhead map showing buildings and your location"
          onPointerDown={(e) => {
            e.stopPropagation();
            const bounds = e.currentTarget.getBoundingClientRect();
            routeTo({
              x: Math.max(0.3, Math.min(N - 0.3, (e.clientX - bounds.left) / bounds.width * N)),
              y: Math.max(0.3, Math.min(N - 0.3, (e.clientY - bounds.top) / bounds.height * N)),
            });
          }}>
          <rect x="12" y="21" width="4.6" height="7" fill="#a6cc80" />
          {ROADS.map((r,i) => <rect key={"mini-road-"+i} x={r.x} y={r.y} width={r.w} height={r.d} fill="#50525b" />)}
          {bs.map((b) => <rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.d}
            fill={b.sign} stroke="#fff" strokeWidth={0.18} rx={0.2}>
            <title>{b.label}</title>
          </rect>)}
          <circle cx={m.x} cy={m.y} r={0.85} fill="#fff" stroke="#111" strokeWidth={0.35} />
          <circle cx={m.x} cy={m.y} r={0.28} fill="#e44335" />
        </svg>
      </div>

      {near && (
        <button onClick={() => onEnter(near.id)} className="absolute bottom-24 left-1/2 -translate-x-1/2 rounded-sm border-2 border-foreground bg-primary px-4 py-1 text-xl text-primary-foreground">
          Enter {near.label} <span className="hidden sm:inline">(E)</span>
        </button>
      )}
    </div>
  );
}
