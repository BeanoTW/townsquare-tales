/**
 * Data model for the 3D home renderer. Everything here is plain data so it can be tested without WebGL.
 *
 * Units are metres. x runs left to right, z runs back (0) to front, y is up. The back wall sits at z = 0.
 * Each property tier supplies a `HomePlan` (floor plan, openings, furniture slots). Only the Studio Flat
 * is built so far, but the renderer reads every dimension from the plan so other tiers can follow.
 */
import type { HomeZone } from "@/lib/home-zones";
import type { FurnitureId } from "@/lib/furniture";

export type Rect = { x0: number; z0: number; x1: number; z1: number };
export type Opening = { kind: "window" | "door" | "doorway"; u0: number; u1: number; v0: number; v1: number };
export type WallSpec = {
  id: string;
  /** Start and end of the wall's centre line on the floor plan. */
  a: [number, number];
  b: [number, number];
  height: number;
  thickness: number;
  /** Unit normal pointing out of the building (outer walls) or toward the room it faces (partitions). */
  normal: [number, number];
  /** Exterior walls are cut down when they face the camera; partitions only when tall and in the way. */
  outer: boolean;
  colour: string;
  openings: Opening[];
};
export type FloorSpec = { zone: HomeZone; rect: Rect; kind: "laminate" | "carpet"; colour: string };

export type Slot = {
  id: FurnitureId | "estate";
  /** Centre of the footprint on the floor. */
  x: number;
  z: number;
  /** Rotation about the vertical axis in radians; 0 faces +z (toward the viewer). */
  rot: number;
  /** Footprint after rotation is applied, used for overlap tests. */
  w: number;
  d: number;
  zone: HomeZone;
  label: string;
  tag: string;
  /** Height of the floating label above the floor. */
  labelY: number;
};

export type HomePlan = {
  tier: number;
  name: string;
  size: { w: number; d: number; h: number };
  floors: FloorSpec[];
  walls: WallSpec[];
  slots: Slot[];
  /** Where the camera looks for each room button. */
  focus: Partial<Record<HomeZone | "all", { x: number; z: number; dist: number }>>;
};

const W = 7.6;
const D = 4.8;
const H = 2.5;
const T = 0.14;
const PART_X = 4.2;

export const STUDIO: HomePlan = {
  tier: 1,
  name: "Studio flat",
  size: { w: W, d: D, h: H },
  floors: [
    { zone: "living", rect: { x0: 0, z0: 0, x1: PART_X, z1: D }, kind: "laminate", colour: "#b98a5b" },
    { zone: "bedroom", rect: { x0: PART_X, z0: 0, x1: W, z1: D }, kind: "carpet", colour: "#6f7f93" },
  ],
  walls: [
    {
      id: "back", a: [0, 0], b: [W, 0], height: H, thickness: T, normal: [0, -1], outer: true, colour: "#e9dfc9",
      openings: [
        { kind: "window", u0: 2.95, u1: 4.0, v0: 0.95, v1: 2.05 },
        { kind: "window", u0: 6.3, u1: 7.2, v0: 1.0, v1: 2.0 },
      ],
    },
    { id: "front", a: [0, D], b: [W, D], height: H, thickness: T, normal: [0, 1], outer: true, colour: "#e9dfc9",
      openings: [{ kind: "door", u0: 0.55, u1: 1.5, v0: 0, v1: 2.1 }] },
    { id: "left", a: [0, 0], b: [0, D], height: H, thickness: T, normal: [-1, 0], outer: true, colour: "#e3d8c0",
      openings: [{ kind: "window", u0: 0.9, u1: 2.0, v0: 0.95, v1: 2.05 }] },
    { id: "right", a: [W, 0], b: [W, D], height: H, thickness: T, normal: [1, 0], outer: true, colour: "#a9bba7",
      openings: [{ kind: "window", u0: 0.9, u1: 2.3, v0: 0.95, v1: 2.05 }] },
    // The partition separates the sleeping space from the living space but leaves a wide doorway.
    { id: "partition", a: [PART_X, 0], b: [PART_X, 3.1], height: H, thickness: T, normal: [-1, 0], outer: false, colour: "#c5d0c0", openings: [] },
    { id: "partition-low", a: [PART_X, 3.9], b: [PART_X, D], height: 1.05, thickness: T, normal: [-1, 0], outer: false, colour: "#c5d0c0", openings: [] },
  ],
  slots: [
    { id: "kitchen", x: 1.4, z: 0.42, rot: 0, w: 2.6, d: 0.74, zone: "living", label: "Kitchen", tag: "COOK", labelY: 1.7 },
    { id: "tv", x: 0.35, z: 2.55, rot: Math.PI / 2, w: 0.5, d: 1.35, zone: "living", label: "Television", tag: "WATCH", labelY: 1.45 },
    { id: "console", x: 0.42, z: 3.75, rot: Math.PI / 2, w: 0.5, d: 0.5, zone: "living", label: "Game console", tag: "PLAY", labelY: 0.95 },
    { id: "sofa", x: 2.75, z: 2.55, rot: -Math.PI / 2, w: 0.95, d: 2.0, zone: "living", label: "Sofa", tag: "RELAX", labelY: 1.25 },
    { id: "bookshelf", x: 3.7, z: 4.45, rot: Math.PI, w: 0.95, d: 0.38, zone: "living", label: "Bookshelf", tag: "READ", labelY: 2.05 },
    { id: "bed", x: 6.0, z: 1.2, rot: 0, w: 1.6, d: 2.1, zone: "bedroom", label: "Bed", tag: "SLEEP", labelY: 1.2 },
    { id: "desk", x: 7.15, z: 3.55, rot: -Math.PI / 2, w: 0.7, d: 1.5, zone: "bedroom", label: "Study desk", tag: "STUDY", labelY: 1.5 },
    { id: "weights", x: 5.5, z: 4.0, rot: 0, w: 1.5, d: 1.1, zone: "bedroom", label: "Home weights", tag: "TRAIN", labelY: 1.35 },
    { id: "estate", x: 2.2, z: D - 0.5, rot: 0, w: 0.7, d: 0.25, zone: "living", label: "Estate agent board", tag: "MOVE", labelY: 1.5 },
  ],
  focus: {
    all: { x: W / 2, z: D / 2 + 0.2, dist: 11.5 },
    living: { x: 2.1, z: 2.4, dist: 7.2 },
    bedroom: { x: 5.9, z: 2.4, dist: 7.2 },
  },
};

export const planFor = (house: number): HomePlan | null => (house === 1 ? STUDIO : null);

export const slotFor = (plan: HomePlan, id: string) => plan.slots.find((s) => s.id === id);

export const overlaps = (a: Slot, b: Slot) =>
  Math.abs(a.x - b.x) < (a.w + b.w) / 2 && Math.abs(a.z - b.z) < (a.d + b.d) / 2;

export const insideFootprint = (plan: HomePlan, s: Slot) =>
  s.x - s.w / 2 >= -1e-6 && s.x + s.w / 2 <= plan.size.w + 1e-6 && s.z - s.d / 2 >= -1e-6 && s.z + s.d / 2 <= plan.size.d + 1e-6;

/** Which slots appear. Hotspot visibility already encodes ownership and tier rules, so it is the single source of truth. */
export function visibleSlots(plan: HomePlan, visibleIds: readonly string[]): Slot[] {
  return plan.slots.filter((s) => visibleIds.includes(s.id));
}

/**
 * Cut-away rule: an exterior wall is cut down when the camera looks at it from outside, so the dollhouse
 * is never blocked. `cam` is the camera's horizontal offset from the room centre.
 */
export function wallCutDown(wall: WallSpec, cam: { x: number; z: number }): boolean {
  const len = Math.hypot(cam.x, cam.z) || 1;
  const facing = (wall.normal[0] * cam.x + wall.normal[1] * cam.z) / len;
  return wall.outer ? facing > 0.18 : wall.height > 1.2 && facing > 0.35 && false;
}

/** 0 at night, 1 at midday. Lights and the sky follow the in-game clock. */
export function daylight(hour: number): number {
  const h = ((hour % 24) + 24) % 24;
  if (h < 6 || h > 20) return 0.06;
  if (h < 8) return 0.06 + ((h - 6) / 2) * 0.94;
  if (h > 18) return 0.06 + ((20 - h) / 2) * 0.94;
  return 1;
}

/** Camera distance that fits a region of the given width and depth for a viewport aspect ratio. */
export function fitDistance(width: number, depth: number, aspect: number, vfovDeg: number, margin = 1.08): number {
  const v = Math.tan((vfovDeg * Math.PI) / 360);
  const hz = v * Math.max(0.3, aspect);
  const half = Math.hypot(width, depth) / 2;
  return (Math.max(half * 0.82 / hz, (depth * 0.9 + 1.6) / v * 0.62 + half * 0.2)) * margin;
}

/**
 * Exact camera distance that keeps a region's bounding box (footprint w×d, height h, centred on the
 * look-at point at floor level) inside the view for a given orbit angle, elevation and viewport aspect.
 */
export function fitToView(w: number, d: number, h: number, az: number, el: number, aspect: number, vfovDeg: number, margin = 1.06): number {
  const tv = Math.tan((vfovDeg * Math.PI) / 360);
  const th = tv * Math.max(0.2, aspect);
  // Camera sits at (sin az * cos el, sin el, cos az * cos el) * dist looking at the origin.
  const fx = Math.sin(az) * Math.cos(el), fy = Math.sin(el), fz = Math.cos(az) * Math.cos(el);
  // right = up × forward-from-target, up2 = forward × right
  let rx = fz, rz = -fx; // (0,1,0) × (fx,fy,fz) -> (fz, 0, -fx)
  const rl = Math.hypot(rx, rz) || 1;
  rx /= rl; rz /= rl;
  const ux = fy * rz, uy = fz * rx - fx * rz, uz = -fy * rx;
  let need = 0;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) for (const y of [0, h]) {
    const px = (sx * w) / 2, pz = (sz * d) / 2;
    const cx = px * rx + pz * rz;
    const cy = px * ux + y * uy + pz * uz;
    const cz = px * fx + y * fy + pz * fz; // toward camera
    need = Math.max(need, Math.abs(cx) / th + cz, Math.abs(cy) / tv + cz);
  }
  return need * margin;
}
