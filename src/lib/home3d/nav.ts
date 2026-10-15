/**
 * Walkable-region helpers for the 3D homes. Nothing here is used by the renderer yet: it exists so the
 * Stick RPG character can walk the same plans later, and so tests can prove every room and every owned
 * piece of furniture is reachable from the front door.
 */
import type { HomePlan, Rect } from "./layout";
import { visibleSlots } from "./layout";

/** Clearance a character needs on each side, in metres. */
export const WALK_RADIUS = 0.2;
const CELL = 0.1;

type Seg = { ax: number; az: number; bx: number; bz: number; half: number };

/** Wall pieces a character cannot pass: every wall minus its door and doorway openings (windows stay solid). */
export function wallSolids(plan: HomePlan): Seg[] {
  const out: Seg[] = [];
  for (const w of plan.walls) {
    const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
    const ux = (w.b[0] - w.a[0]) / len;
    const uz = (w.b[1] - w.a[1]) / len;
    const gaps = w.openings.filter((o) => o.kind !== "window").sort((p, q) => p.u0 - q.u0);
    let cur = 0;
    const push = (u0: number, u1: number) => {
      if (u1 - u0 > 1e-6) out.push({ ax: w.a[0] + ux * u0, az: w.a[1] + uz * u0, bx: w.a[0] + ux * u1, bz: w.a[1] + uz * u1, half: w.thickness / 2 });
    };
    for (const g of gaps) {
      push(cur, g.u0);
      cur = g.u1;
    }
    push(cur, len);
  }
  return out;
}

function distToSeg(px: number, pz: number, s: Seg) {
  const dx = s.bx - s.ax;
  const dz = s.bz - s.az;
  const t = Math.max(0, Math.min(1, ((px - s.ax) * dx + (pz - s.az) * dz) / (dx * dx + dz * dz || 1)));
  return Math.hypot(px - (s.ax + dx * t), pz - (s.az + dz * t));
}
export const distToRect = (px: number, pz: number, r: Rect) => Math.hypot(Math.max(r.x0 - px, 0, px - r.x1), Math.max(r.z0 - pz, 0, pz - r.z1));

export type Nav = { nx: number; nz: number; blocked: Uint8Array; cell: number };

export function buildNav(plan: HomePlan, visibleIds: readonly string[], radius = WALK_RADIUS): Nav {
  const nx = Math.round(plan.size.w / CELL) + 1;
  const nz = Math.round(plan.size.d / CELL) + 1;
  const blocked = new Uint8Array(nx * nz);
  const solids = wallSolids(plan);
  const rects: Rect[] = [
    ...plan.colliders.filter((c) => !c.when || visibleIds.includes(c.when)),
    ...visibleSlots(plan, visibleIds).map((s) => ({ x0: s.x - s.w / 2, z0: s.z - s.d / 2, x1: s.x + s.w / 2, z1: s.z + s.d / 2 })),
    ...(plan.npcs ?? []).map((n) => ({ x0: n.x - 0.3, z0: n.z - 0.3, x1: n.x + 0.3, z1: n.z + 0.3 })),
  ];
  for (let i = 0; i < nx; i++)
    for (let j = 0; j < nz; j++) {
      const x = i * CELL;
      const z = j * CELL;
      let bad = x < radius || z < radius || x > plan.size.w - radius || z > plan.size.d - radius;
      if (!bad) bad = solids.some((s) => distToSeg(x, z, s) < s.half + radius);
      if (!bad) bad = rects.some((r) => distToRect(x, z, r) < radius);
      if (bad) blocked[i * nz + j] = 1;
    }
  return { nx, nz, blocked, cell: CELL };
}

export const walkable = (nav: Nav, x: number, z: number) => {
  const i = Math.round(x / nav.cell);
  const j = Math.round(z / nav.cell);
  return i >= 0 && j >= 0 && i < nav.nx && j < nav.nz && !nav.blocked[i * nav.nz + j];
};

/** Flood fill from a point; returns the visited cells. */
export function reachable(nav: Nav, from: [number, number]): Uint8Array {
  const seen = new Uint8Array(nav.nx * nav.nz);
  const i0 = Math.round(from[0] / nav.cell);
  const j0 = Math.round(from[1] / nav.cell);
  if (i0 < 0 || j0 < 0 || i0 >= nav.nx || j0 >= nav.nz || nav.blocked[i0 * nav.nz + j0]) return seen;
  const stack = [i0 * nav.nz + j0];
  seen[stack[0]!] = 1;
  while (stack.length) {
    const c = stack.pop()!;
    const i = Math.floor(c / nav.nz);
    const j = c % nav.nz;
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]] as const) {
      const a = i + di;
      const b = j + dj;
      if (a < 0 || b < 0 || a >= nav.nx || b >= nav.nz) continue;
      const k = a * nav.nz + b;
      if (!nav.blocked[k] && !seen[k]) {
        seen[k] = 1;
        stack.push(k);
      }
    }
  }
  return seen;
}

export const isReached = (nav: Nav, seen: Uint8Array, x: number, z: number) => {
  const i = Math.round(x / nav.cell);
  const j = Math.round(z / nav.cell);
  return i >= 0 && j >= 0 && i < nav.nx && j < nav.nz && seen[i * nav.nz + j] === 1;
};

/** True when a character can stand within arm's reach of the rect: the piece can actually be used. */
export function approachable(nav: Nav, seen: Uint8Array, r: Rect, reach = 0.75): boolean {
  const x0 = Math.floor((r.x0 - reach) / nav.cell);
  const x1 = Math.ceil((r.x1 + reach) / nav.cell);
  const z0 = Math.floor((r.z0 - reach) / nav.cell);
  const z1 = Math.ceil((r.z1 + reach) / nav.cell);
  for (let i = Math.max(0, x0); i <= Math.min(nav.nx - 1, x1); i++)
    for (let j = Math.max(0, z0); j <= Math.min(nav.nz - 1, z1); j++)
      if (seen[i * nav.nz + j] && distToRect(i * nav.cell, j * nav.cell, r) <= reach) return true;
  return false;
}
