import { useEffect, useRef, useState } from "react";
import { findRoute, type Point } from "@/lib/pathfinding";

// Isometric projection
const TW = 64, TH = 46, N = 30;
const P = (x: number, y: number, h = 0) => [(x - y) * (TW / 2), (x + y) * (TH / 2) - h] as const;
const pts = (a: (readonly [number, number])[]) => a.map((p) => p.join(",")).join(" ");

type B = { id: string; label: string; x: number; y: number; w: number; d: number; h: number; wall: string; side: string; roof: string; sign: string; win?: boolean };

const HOUSE_LOOK = [
  { h: 18, wall: "#c9a26b", side: "#a9824f", roof: "#dcb986", label: "Box" },
  { h: 70, wall: "#d9d2c3", side: "#b5ad9c", roof: "#8a8172", label: "Flat" },
  { h: 60, wall: "#e8dcc0", side: "#c3b593", roof: "#b2553f", label: "House" },
  { h: 95, wall: "#f4efe4", side: "#cfc7b4", roof: "#4a5a72", label: "Mansion" },
];

export const buildings = (house: number): B[] => {
  const hl = HOUSE_LOOK[house] ?? HOUSE_LOOK[0]!;
  return [
    { id: "home", label: `Home · ${hl.label}`, x: 1, y: 2, w: 3, d: 4, h: hl.h, wall: hl.wall, side: hl.side, roof: hl.roof, sign: "#3b3b3b", win: house > 0 },
    { id: "gym", label: "Iron Gym", x: 15.2, y: 3, w: 2.5, d: 3.5, h: 70, wall: "#8f9aa6", side: "#6d7884", roof: "#3f4852", sign: "#d6402f", win: true },
    { id: "school", label: "Stick U", x: 10.5, y: 2, w: 4, d: 4.5, h: 90, wall: "#b65c43", side: "#8f4331", roof: "#5f6b4a", sign: "#2d4a7a", win: true },
    { id: "bar", label: "The Tipsy Stick", x: 1, y: 22, w: 3, d: 4, h: 60, wall: "#5a3a5e", side: "#432a46", roof: "#2c1c2f", sign: "#e94d8a", win: true },
    { id: "work", label: "MegaCorp", x: 14.4, y: 11, w: 3.4, d: 5, h: 190, wall: "#7aa3bf", side: "#57809c", roof: "#3b5a70", sign: "#1f2d3a", win: true },
    { id: "alley", label: "Dark Alley", x: 10.8, y: 22, w: 3, d: 4, h: 55, wall: "#4b4642", side: "#36322f", roof: "#262321", sign: "#9b8f3a", win: false },
    { id: "bank", label: "Town Bank", x: 10.7, y: 12, w: 3.2, d: 4, h: 85, wall: "#d5c39b", side: "#9f8969", roof: "#605c56", sign: "#255b45", win: true },
    { id: "shop", label: "Corner Shop", x: 4.4, y: 3, w: 2.5, d: 3, h: 48, wall: "#e0b36b", side: "#bd873a", roof: "#6f3c32", sign: "#a02b34", win: true },
    { id: "diner", label: "Fryday Diner", x: 4.4, y: 12.5, w: 2.5, d: 3.5, h: 55, wall: "#f4b24c", side: "#d77d38", roof: "#a93832", sign: "#c12932", win: true },
    { id: "pawn", label: "Oddities Pawn", x: 25.1, y: 3, w: 3, d: 3, h: 56, wall: "#b1a478", side: "#887c5d", roof: "#5c514b", sign: "#47624b", win: true },
    { id: "furniture", label: "Cosy Corner", x: 20.6, y: 2, w: 4, d: 4, h: 78, wall: "#e8d0a4", side: "#b99871", roof: "#6c5a48", sign: "#a75a38", win: true },
    { id: "casino", label: "Lucky Sevens", x: 4.5, y: 21, w: 3, d: 5, h: 115, wall: "#66519a", side: "#43386c", roof: "#302847", sign: "#e7bb40", win: true },
    { id: "depot", label: "Town Transit", x: 25.1, y: 12, w: 3.1, d: 4, h: 50, wall: "#91b6bd", side: "#628b91", roof: "#394e56", sign: "#2e6477", win: true },
    { id: "police", label: "Town Police", x: 20.8, y: 12, w: 3.8, d: 4, h: 90, wall: "#9eacc0", side: "#748498", roof: "#465366", sign: "#234c86", win: true },
    { id: "clinic", label: "Patch Up Clinic", x: 1, y: 12, w: 3, d: 4, h: 75, wall: "#dce5d9", side: "#adbea9", roof: "#678676", sign: "#399179", win: true },
  ];
};

export const door = (b: B) => ({ x: b.x + b.w / 2, y: b.y + b.d + 0.6 });
const TREES = [[0.8, 0.7], [7.2, 2], [16.8, 1], [28.8, 4], [1.2, 11], [7.3, 14], [12, 11], [28.4, 15], [15, 23], [18, 26], [22, 24], [25, 25.5], [28, 27], [1, 27]] as const;
const LAMPS = [[7.6, 7.6], [10.4, 7.6], [7.6, 10.4], [10.4, 10.4], [3, 7.6], [14, 10.4]] as const;

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
  const dc = x + w / 2;
  const doorPts = [P(dc - 0.3, y + d), P(dc + 0.3, y + d), P(dc + 0.3, y + d, 22), P(dc - 0.3, y + d, 22)];
  const [lx, ly] = P(x + w / 2, y + d / 2, h);
  return (
    <g>
      <polygon points={pts([P(x + 0.2, y + d + 0.3), P(x + w + 0.3, y + d + 0.3), P(x + w + 0.3, y + 0.2), P(x + w, y), P(x, y + d)])} fill="#000" opacity={0.18} />
      <polygon points={pts(front)} fill={b.wall} stroke="#1d1d1d" strokeWidth={1.5} />
      <polygon points={pts(right)} fill={b.side} stroke="#1d1d1d" strokeWidth={1.5} />
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
  const bx = x - w / 2, by = y - d / 2, h = 14;
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
  { path: [[3, 8.2], [7, 8.2]], color: "#7a2a2a", speed: 0.5 },
  { path: [[10.7, 2], [10.7, 7]], color: "#2a4a7a", speed: 0.35 },
  { path: [[11, 10.6], [17, 10.6]], color: "#2a6a3a", speed: 0.45 },
] as const;

export function TownMap({ hour, house, speed = 1, onEnter, active }: { hour: number; house: number; speed?: number; onEnter: (id: string) => void; active: string | null }) {
  const bs = buildings(house);
  const svgRef = useRef<SVGSVGElement>(null);
  const me = useRef({ x: 8.9, y: 8.9, phase: 0, walking: false });
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
      if (k.has("w") || k.has("arrowup")) { dx -= 1; dy -= 1; }
      if (k.has("s") || k.has("arrowdown")) { dx += 1; dy += 1; }
      if (k.has("a") || k.has("arrowleft")) { dx -= 1; dy += 1; }
      if (k.has("d") || k.has("arrowright")) { dx += 1; dy -= 1; }
      if (!dx && !dy && target.current) {
        const waypoint = target.current.waypoints[0];
        if (waypoint) {
          dx = waypoint.x - m.x; dy = waypoint.y - m.y;
          if (Math.hypot(dx, dy) < 0.15) {
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
    const a = p.x / (TW / 2), b = p.y / (TH / 2);
    return { x: (a + b) / 2, y: (b - a) / 2 };
  };

  const night = hour >= 19 || hour < 6;
  const dusk = hour >= 17 && hour < 19;
  const m = me.current;

  // depth-sorted drawables
  const items: { key: number; el: React.ReactNode }[] = [];
  bs.forEach((b) => items.push({ key: b.x + b.w + b.y + b.d - 0.5, el: (
    <g key={b.id} onClick={(e) => { e.stopPropagation(); routeTo(door(b), b.id); }} className="cursor-pointer" opacity={active === b.id ? 1 : 0.97}>
      <Box b={b} night={night} />
    </g>) }));
  TREES.forEach(([x, y], i) => items.push({ key: x + y, el: <Tree key={`t${i}`} x={x} y={y} /> }));
  LAMPS.forEach(([x, y], i) => items.push({ key: x + y, el: <Lamp key={`l${i}`} x={x} y={y} night={night || dusk} /> }));
  const c1 = ((t * 2.2) % (N + 4)) - 2, c2 = N + 2 - ((t * 1.7) % (N + 4)), c3 = ((t * 1.9 + 7) % (N + 4)) - 2;
  items.push({ key: c1 + 8.5, el: <Car key="c1" x={c1} y={8.5} dir="x" color="#d94a3a" /> });
  items.push({ key: c2 + 9.5, el: <Car key="c2" x={c2} y={9.5} dir="x" color="#3a7bd9" /> });
  items.push({ key: 8.5 + c3, el: <Car key="c3" x={8.5} y={c3} dir="y" color="#e6b83a" /> });
  NPCS.forEach((n, i) => {
    const [[ax, ay], [bx, by]] = n.path;
    const f = (Math.sin(t * n.speed + i) + 1) / 2;
    const x = ax + (bx - ax) * f, y = ay + (by - ay) * f;
    items.push({ key: x + y, el: <Stick key={`n${i}`} x={x} y={y} phase={t * 8} walking color={n.color} /> });
  });
  items.push({ key: m.x + m.y, el: <Stick key="me" x={m.x} y={m.y} phase={m.phase} walking={m.walking} /> });
  items.sort((a, b) => a.key - b.key);

  const tile = (x: number, y: number, w: number, d: number, fill: string, k: string) => (
    <polygon key={k} points={pts([P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)])} fill={fill} />
  );

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: night ? "#1b2433" : dusk ? "#e8a76a" : "#9fd3e8" }}>
      <svg ref={svgRef} viewBox={(() => { const [cx, cy] = P(m.x, m.y); return `${cx - 190} ${cy - 330} 380 640`; })()} preserveAspectRatio="xMidYMid slice" className="block h-full w-full touch-none select-none font-hand"
        onPointerDown={(e) => { const p = toTile(e); routeTo({ x: Math.max(0.3, Math.min(N - 0.3, p.x)), y: Math.max(0.3, Math.min(N - 0.3, p.y)) }); }}>
        {/* ground */}
        {tile(0, 0, N, N, "#7fb069", "g")}
        {tile(0, 0, 8, 8, "#86b872", "q1")}{tile(10, 10, 8, 8, "#5d5a52", "q4")}
        {tile(10, 0, 8, 8, "#8cbf78", "q2")}{tile(0, 10, 8, 8, "#a8a8a0", "q3")}
        {tile(19.95, 20, 9.3, 7, "#86b872", "park")}
        {tile(20.8, 20.8, 7.5, 5.9, "#90c27e", "park-lawn")}
        {/* Continuous paved frontages in front of all three rows of buildings */}
        {tile(0, 7, N, 1, "#d5d0c5", "front-north")}
        {tile(0, 17, N, 1.3, "#d5d0c5", "front-middle")}
        {tile(0, 27, N, 1.2, "#d5d0c5", "front-south")}
        {/* sidewalks */}
        {tile(18, 0, 2, N, "#c9c4b8", "new-sw-x")}
        {tile(0, 18, N, 2, "#c9c4b8", "new-sw-y")}
        {tile(0, 7.4, N, 3.2, "#c9c4b8", "sw1")}{tile(7.4, 0, 3.2, N, "#c9c4b8", "sw2")}
        {/* roads */}
        {tile(0, 28.2, N, 1.5, "#3d3f44", "south-street")}
        {tile(18.3, 0, 1.6, N, "#3d3f44", "road-east")}
        {tile(0, 18.3, N, 1.6, "#3d3f44", "road-south")}
        {tile(0, 8, N, 2, "#3d3f44", "r1")}{tile(8, 0, 2, N, "#3d3f44", "r2")}
        {Array.from({ length: 9 }, (_, i) => i * 2 + 0.3).filter((v) => v < 7.5 || v > 10).map((v) => (
          <g key={`m${v}`}>{tile(v, 8.95, 0.9, 0.1, "#f2d24b", `ma${v}`)}{tile(8.95, v, 0.1, 0.9, "#f2d24b", `mb${v}`)}</g>
        ))}
        {[0, 1, 2, 3, 4].map((i) => <g key={`z${i}`}>{tile(7.45, 8.1 + i * 0.4, 0.5, 0.2, "#eee", `za${i}`)}{tile(10.05, 8.1 + i * 0.4, 0.5, 0.2, "#eee", `zb${i}`)}</g>)}
        {tile(20.8, 23.5, 7.5, 0.45, "#ded4bb", "park-path1")}
        {tile(24.2, 20.8, 0.45, 6.1, "#ded4bb", "park-path2")}
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
          <rect x="20" y="20" width="9" height="9" fill="#a6cc80" />
          {[8, 18.3].map((v) => <g key={v}>
            <rect x={v} y="0" width={v === 8 ? 2 : 1.6} height={N} fill="#50525b" />
            <rect x="0" y={v} width={N} height={v === 8 ? 2 : 1.6} fill="#50525b" />
          </g>)}
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
