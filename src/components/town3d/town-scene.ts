import { P } from "@/lib/town-projection";
import { N, ROADS, TREES, LAMPS, buildingPoint, door, buildings, type B } from "@/lib/town-world";

/**
 * Pure scene data for the 3D town. Vertices are already in screen units:
 *   X = screen x, Y = -screen y (three.js is y-up), Z = depth.
 * Depth is the true world height plus plan depth (h + y). Along every view ray
 * that is strictly increasing, so the z-buffer reproduces the painter's order
 * without the 2D sort keys. Ground layers add a small per-layer offset so that
 * coplanar tiles stack in the same order as the SVG ground.
 */
export type V3 = [number, number, number];
export type Face = { pts: V3[]; color: string; overlay?: boolean; outline?: boolean };

const LAYER = 0.05;
const INK = "var(--town-ink)";

const at = (sx: number, sy: number, depth: number): V3 => [sx, -sy, depth];
const ground = (x: number, y: number, layer: number): V3 => { const [sx, sy] = P(x, y); return at(sx, sy, y + layer * LAYER); };

function tile(x: number, y: number, w: number, d: number, color: string, layer: number): Face {
  return { pts: [ground(x, y, layer), ground(x + w, y, layer), ground(x + w, y + d, layer), ground(x, y + d, layer)], color };
}

// Matches the SVG tile rules, in the same painter order.
export function groundFaces(bs: B[]): Face[] {
  const faces: Face[] = [];
  const add = (f: Face) => faces.push(f);
  let layer = 1;
  add(tile(0, 0, N, N, "var(--town-grass)", layer++));
  add(tile(0, 0, 8.8, 7.2, "var(--town-lawn)", layer++));
  add(tile(25.5, 7.5, 4.2, 4.8, "var(--town-park-lawn)", layer++));
  ROADS.forEach((r) => add(tile(Math.max(0, r.x - .58), Math.max(0, r.y - .58),
    Math.min(N, r.x + r.w + .58) - Math.max(0, r.x - .58),
    Math.min(N, r.y + r.d + .58) - Math.max(0, r.y - .58), "var(--town-pavement)", layer)));
  layer++;
  bs.forEach((b) => add(tile(Math.max(0, b.x - .15), Math.max(0, b.y - .15), b.w + .3, b.d + .3,
    b.id === "casino" || b.id === "alley" ? "var(--town-backlot)" : "var(--town-garden)", layer)));
  layer++;
  bs.forEach((b) => {
    const d = door(b);
    const r = ROADS.map((road) => {
      const x = Math.max(road.x, Math.min(road.x + road.w, d.x));
      const y = Math.max(road.y, Math.min(road.y + road.d, d.y));
      return { x, y, distance: Math.hypot(d.x - x, d.y - y) };
    }).sort((a, b) => a.distance - b.distance)[0];
    if (r) add(tile(Math.min(d.x, r.x) - .22, Math.min(d.y, r.y) - .22, Math.abs(d.x - r.x) + .44, Math.abs(d.y - r.y) + .44, "var(--town-approach)", layer));
  });
  layer++;
  add(tile(25.5, 8.1, 4.1, 4.0, "var(--town-park)", layer++));
  // Pond is an ellipse in screen units, as in the SVG.
  const [cx, cy] = P(28.1, 10.2);
  const pond: V3[] = [];
  for (let i = 0; i < 48; i++) {
    const t = (i / 48) * Math.PI * 2;
    pond.push(at(cx + 38 * Math.cos(t), cy + 23 * Math.sin(t), 10.2 + layer * LAYER));
  }
  add({ pts: pond, color: "var(--town-pond)" });
  layer++;
  add(tile(27.5, 8.0, .45, 4.3, "var(--town-park-path)", layer));
  add(tile(25.5, 10.3, 4.1, .4, "var(--town-park-path)", layer));
  layer++;
  ROADS.forEach((r) => add(tile(r.x, r.y, r.w, r.d, "var(--town-asphalt)", layer)));
  layer++;
  ROADS.forEach((r) => {
    const vertical = r.d > r.w;
    const count = Math.floor((vertical ? r.d : r.w) / 2.4);
    for (let j = 0; j < count; j++) {
      add(vertical
        ? tile(r.x + r.w / 2 - .05, r.y + .6 + j * 2.4, .1, .85, "var(--town-lane-paint)", layer)
        : tile(r.x + .6 + j * 2.4, r.y + r.d / 2 - .05, .85, .1, "var(--town-lane-paint)", layer));
    }
  });
  layer++;
  [7.1, 11.9, 18.5, 25.5].forEach((y) => {
    for (let j = 0; j < 4; j++) add(tile(8.85 + j * .62, y - .35, .34, .4, "var(--town-crossing)", layer));
  });
  layer++;
  bs.forEach((b) => {
    const d = door(b);
    const south = b.facing === "south", north = b.facing === "north";
    const x = south || north ? d.x - 0.33 : Math.min(d.x, b.facing === "east" ? b.x + b.w : b.x) - 0.05;
    const y = south ? b.y + b.d : north ? d.y : d.y - 0.33;
    add(tile(x, y, south || north ? 0.66 : 0.7, south || north ? 0.65 : 0.66, "var(--town-door-path)", layer));
  });
  layer++;
  add(tile(25.5, 6.0, 2.0, 1.8, "var(--town-grime)", layer));
  // Earth slab below the plan: visible front and east faces.
  const slab = (x: number, y: number, h: number) => { const [sx, sy] = P(x, y, h); return at(sx, sy, h + y); };
  add({ pts: [slab(0, N, -22), slab(N, N, -22), slab(N, N, 0), slab(0, N, 0)], color: "var(--town-earth-front)" });
  add({ pts: [slab(N, 0, -22), slab(N, N, -22), slab(N, N, 0), slab(N, 0, 0)], color: "var(--town-earth-side)" });
  return faces;
}

/** Walls, roofs and front details. Front details follow the building's facing, like BuildingExterior. */
export function buildingFaces(b: B, night: boolean): Face[] {
  const { x, y, w, d, h } = b;
  const at3 = (u: number, v: number, z: number): V3 => {
    const [sx, sy] = buildingPoint(b, u, v, z);
    return at(sx, sy, z + v);
  };
  const faces: Face[] = [];
  // Visible walls are the south and east faces; the facing wall takes the wall colour.
  faces.push({ pts: [at3(x, y + d, 0), at3(x + w, y + d, 0), at3(x + w, y + d, h), at3(x, y + d, h)], color: b.facing === "south" ? b.wall : b.side, outline: true });
  faces.push({ pts: [at3(x + w, y, 0), at3(x + w, y + d, 0), at3(x + w, y + d, h), at3(x + w, y, h)], color: b.facing === "east" ? b.wall : b.side, outline: true });
  faces.push({ pts: [at3(x, y, h), at3(x + w, y, h), at3(x + w, y + d, h), at3(x, y + d, h)], color: b.roof, outline: true });
  // Front entrance panels on the facing wall.
  const front = (u: number, z: number): V3 => {
    if (b.facing === "north") return at3(x + u * w, y, z);
    if (b.facing === "south") return at3(x + u * w, y + d, z);
    if (b.facing === "east") return at3(x + w, y + u * d, z);
    return at3(x, y + u * d, z);
  };
  const hidden = b.facing === "north" || b.facing === "west";
  const panel = (a: number, c: number, low: number, high: number, color: string) =>
    faces.push({ pts: [front(a, low), front(c, low), front(c, high), front(a, high)], color, overlay: hidden });
  const glass = night ? "var(--town-window-lit)" : "var(--town-glass)";
  if (b.win) {
    const rows = Math.max(1, Math.floor((h - 20) / 30));
    for (let r = 0; r < rows; r++) [.12, .29, .7, .87].forEach((u) => panel(u - .055, u + .055, 18 + r * 30, 32 + r * 30, glass));
  }
  panel(.43, .57, 0, 25, glass);
  if (h > 20) panel(.15, .85, Math.max(h - 26, 20), h - 6, b.sign);
  return faces;
}

/** Props whose base sits inside a building footprint are hidden in the SVG too, so 3D omits them. */
export function propsOutside(bs: B[]): { trees: (readonly [number, number])[]; lamps: (readonly [number, number])[] } {
  const inside = (x: number, y: number) => bs.some((b) => x > b.x - 0.15 && x < b.x + b.w + 0.15 && y > b.y - 0.15 && y < b.y + b.d + 0.15);
  return { trees: TREES.filter(([x, y]) => !inside(x, y)), lamps: LAMPS.filter(([x, y]) => !inside(x, y)) };
}

/** Trees and lamps as flat screen sprites placed at their true depth. */
export function propFaces(bs: B[], night: boolean): Face[] {
  const faces: Face[] = [];
  const { trees, lamps } = propsOutside(bs);
  trees.forEach(([x, y]) => {
    const [sx, sy] = P(x, y);
    faces.push({ pts: [at(sx - 3, sy, y), at(sx + 3, sy, y), at(sx + 3, sy - 22, y + 38), at(sx - 3, sy - 22, y + 38)], color: "var(--town-tree-trunk)" });
    faces.push({ pts: disc(sx, sy - 34, 18, y + 60), color: "var(--town-leaf)", outline: true });
  });
  lamps.forEach(([x, y]) => {
    const [sx, sy] = P(x, y);
    faces.push({ pts: [at(sx - 1.5, sy, y), at(sx + 1.5, sy, y), at(sx + 1.5, sy - 46, y + 81), at(sx - 1.5, sy - 46, y + 81)], color: "var(--town-lamp-post)" });
    faces.push({ pts: disc(sx, sy - 48, 5, y + 81), color: night ? "var(--town-lamp-lit)" : "var(--town-lamp-glass)", outline: true });
  });
  return faces;
}

function disc(cx: number, cy: number, r: number, depth: number): V3[] {
  const pts: V3[] = [];
  for (let i = 0; i < 20; i++) {
    const t = (i / 20) * Math.PI * 2;
    pts.push(at(cx + r * Math.cos(t), cy + r * Math.sin(t), depth));
  }
  return pts;
}

/** `world` is flat ground; `objects` stand up from it and are depth-tested against each other. */
export function townFaces(house: number, night: boolean): { world: Face[]; objects: Face[] } {
  const bs = buildings(house);
  const objects: Face[] = [];
  bs.forEach((b) => objects.push(...buildingFaces(b, night)));
  objects.push(...propFaces(bs, night));
  return { world: groundFaces(bs), objects };
}

export type Bucket = { key: string; color: string; overlay: boolean; positions: Float32Array };

/** Groups convex faces by colour into flat triangle lists for one BufferGeometry each. */
export function bucketFaces(faces: Face[]): Bucket[] {
  const map = new Map<string, { color: string; overlay: boolean; values: number[] }>();
  for (const f of faces) {
    const key = `${f.color}|${f.overlay ? 1 : 0}`;
    let bucket = map.get(key);
    if (!bucket) { bucket = { color: f.color, overlay: Boolean(f.overlay), values: [] }; map.set(key, bucket); }
    const p = f.pts;
    for (let i = 1; i < p.length - 1; i++) {
      for (const v of [p[0]!, p[i]!, p[i + 1]!]) bucket.values.push(v[0], v[1], v[2]);
    }
  }
  return [...map.entries()].map(([key, b]) => ({ key, color: b.color, overlay: b.overlay, positions: new Float32Array(b.values) }));
}

/** Ink outlines for building and prop faces, lifted slightly toward the camera. */
export function outlineSegments(faces: Face[]): { color: string; positions: Float32Array } {
  const values: number[] = [];
  const lift = 0.25;
  for (const f of faces) {
    if (!f.outline) continue;
    const p = f.pts;
    for (let i = 0; i < p.length; i++) {
      const a = p[i]!, b = p[(i + 1) % p.length]!;
      values.push(a[0], a[1], a[2] + lift, b[0], b[1], b[2] + lift);
    }
  }
  return { color: INK, positions: new Float32Array(values) };
}

export const TOWN_CAMERA_BASE = { width: 330, height: 550 } as const;
