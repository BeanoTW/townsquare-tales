/**
 * Data model for the 3D home renderer. Everything here is plain data so it can be tested without WebGL.
 *
 * Units are metres. x runs left to right, z runs back (0) to front, y is up. The back wall sits at z = 0.
 * Each property tier supplies a `HomePlan` (floor plan, openings, furniture slots, lighting and the data a
 * walking character will need later: rooms, doorways, spawn points and colliders). The renderer reads every
 * dimension from the plan. The Studio Flat lives here; the other tiers are in `plans.ts`.
 */
import type { PlanZone } from "@/lib/home-zones";
import type { FurnitureId } from "@/lib/furniture";

export type Rect = { x0: number; z0: number; x1: number; z1: number };
export type Opening = { kind: "window" | "door" | "doorway"; u0: number; u1: number; v0: number; v1: number };
export type WallSpec = {
  /** Look of the wall surface. Defaults to smooth plaster. */
  style?: "plain" | "scrap" | "panel" | "brick" | "block";
  /** Interior walls drop to this fraction of their height when the camera looks at them face-on. */
  fold?: number;
  /** Colour of window frames and door trim. */
  trim?: string;
  /** Colour of the door leaf in this wall. */
  leaf?: string;
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
export type FloorKind = "laminate" | "carpet" | "tile" | "parquet" | "marble" | "rubber" | "concrete" | "boards" | "dirt" | "lawn" | "checker" | "chequer" | "pattern";
export type FloorSpec = { zone: PlanZone; rect: Rect; kind: FloorKind; colour: string };

export type PropId = "blackjack" | "slots" | "high-dice" | "bar-counter" | "dance-floor" | "dartboard" | "rack" | "track" | "pawn-counter" | "curiosities" | "front-desk" | "wanted" | "site" | "trades-board" | "foreman" | "library" | "classroom" | "admissions" | "workstation" | "vacancies" | "manager" | "teller" | "atm" | "vault" | "loans" | "shelves" | "back-office" | "shop-board" | "checkout" | "kitchen" | "hiring" | "booth" | "counter" | "sofa-display" | "bed-display" | "catalogue" | "departures" | "ticket-hatch" | "treatment-bed" | "cabinet";
/** Fixed obstacle. When `when` names a furniture id it exists only while that piece is owned. */
export type Collider = Rect & { when?: string };
export type RoomDef = { zone: PlanZone; name: string; rect: Rect };
/** A passage between two rooms (or to the outside): the centre line of the opening, in plan coordinates. */
export type Door = { a: [number, number]; b: [number, number] };
/** A friend standing or sitting in the 3D world. Decorative: not selectable. */
export type Npc = { id: string; name: string; x: number; z: number; rot: number; pose: "sit" | "stand" | "dance" | "jog"; seat?: number; shirt: string; skin: string; hair: string };
export type PlanLight = { p: [number, number, number]; colour: string; day: number; night: number; distance: number; decay: number };
export type PlanLights = { hemi: [sky: string, ground: string]; hemiBase: number; hemiDay: number; sunBase: number; sunDay: number; sunTint: [day: string, dusk: string]; points: PlanLight[] };
export type PlanBase = { side: string; top: string; margin: number; frontLawn?: number };
export type PlanKind = "squat" | "studio" | "suburban" | "mansion" | "casino" | "bar" | "gym" | "pawn" | "police" | "shop" | "diner" | "furniture" | "bank" | "school" | "work" | "yard" | "clinic" | "depot";

export type Slot = {
  id: FurnitureId | "estate" | PropId;
  /** Centre of the footprint on the floor. */
  x: number;
  z: number;
  /** Rotation about the vertical axis in radians; 0 faces +z (toward the viewer). */
  rot: number;
  /** Footprint after rotation is applied, used for overlap tests. */
  w: number;
  d: number;
  zone: PlanZone;
  label: string;
  tag: string;
  /** Height of the floating label above the floor. */
  labelY: number;
  /** A floor-level feature (dance floor) that people can walk across. */
  flat?: boolean;
};

export type VantagePoint = {
  eye: [number, number, number];
  lookAt: [number, number, number];
  yawClamp?: [number, number];
};

export type HomePlan = {
  vantagePoints?: Partial<Record<PlanZone, VantagePoint>>;
  tier: number;
  kind: PlanKind;
  name: string;
  size: { w: number; d: number; h: number };
  floors: FloorSpec[];
  walls: WallSpec[];
  slots: Slot[];
  /** The region the camera frames for each room button (and "all" for the overview). */
  focus: Partial<Record<PlanZone | "all", Rect>>;
  /** Walkable room volumes: continuous floor with defined boundaries. */
  rooms: RoomDef[];
  /** Passages between rooms. The entry door is the first one. */
  doors: Door[];
  /** Where a character appears: at the front door, and a sensible standing spot in each zone. */
  spawn: { entry: [number, number]; zones: Partial<Record<PlanZone, [number, number]>> };
  /** Fixed architecture and decor that blocks walking (never furniture slots, which block when owned). */
  colliders: Collider[];
  lights: PlanLights;
  sky: { day: [string, string]; night: [string, string] };
  base: PlanBase;
  npcs?: Npc[];
};

const W = 7.6;
const D = 4.8;
const H = 2.5;
const T = 0.14;
const PART_X = 4.2;

export const STUDIO: HomePlan = {
  tier: 1,
  kind: "studio",
  vantagePoints: {
    living: { eye: [1.8, 1.55, 3.8], lookAt: [1.8, 1.2, 1.2] },
    bedroom: { eye: [5.6, 1.55, 3.8], lookAt: [5.6, 1.2, 1] },
  },
  name: "Studio flat",
  size: { w: W, d: D, h: H },
  floors: [
    { zone: "living", rect: { x0: 0, z0: 0, x1: PART_X, z1: D }, kind: "laminate", colour: "#ffffff" },
    { zone: "bedroom", rect: { x0: PART_X, z0: 0, x1: W, z1: D }, kind: "carpet", colour: "#ffffff" },
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
    all: { x0: 0, z0: 0, x1: W, z1: D },
    living: { x0: -0.1, z0: 0, x1: 4.3, z1: D },
    bedroom: { x0: 4.1, z0: 0, x1: W, z1: D },
  },
  rooms: [
    { zone: "living", name: "Living room and kitchen", rect: { x0: 0, z0: 0, x1: PART_X, z1: D } },
    { zone: "bedroom", name: "Bedroom and study", rect: { x0: PART_X, z0: 0, x1: W, z1: D } },
  ],
  doors: [
    { a: [0.55, D], b: [1.5, D] },
    { a: [PART_X, 3.1], b: [PART_X, 3.9] },
  ],
  spawn: { entry: [1.0, D - 0.45], zones: { living: [1.4, 3.1], bedroom: [5.0, 3.2] } },
  colliders: [
    { x0: 4.28, z0: 0.3, x1: 4.88, z1: 2.3 }, // built-in wardrobe
    { x0: 3.6, z0: 0.25, x1: 4.1, z1: 0.65 }, // big plant
    { x0: 3.55, z0: 0.75, x1: 4.05, z1: 1.15 }, // boxes
    { x0: 3.61, z0: 1.41, x1: 3.89, z1: 1.69 }, // floor lamp
  ],
  lights: {
    hemi: ["#e3edf5", "#7d6a55"], hemiBase: 0.5, hemiDay: 0.55, sunBase: 0.2, sunDay: 2.6, sunTint: ["#fff3dc", "#ffcf9a"],
    points: [
      { p: [2.1, 2.2, 2.5], colour: "#ffc983", day: 4, night: 20, distance: 8, decay: 1.6 },
      { p: [5.9, 2.0, 2.2], colour: "#c3d2ff", day: 2.5, night: 13.5, distance: 7, decay: 1.6 },
      { p: [1.4, 1.5, 0.9], colour: "#fff0c8", day: 1.5, night: 4.5, distance: 3.5, decay: 1.8 },
    ],
  },
  sky: { day: ["#cfe3ee", "#f0e8d6"], night: ["#1c2440", "#2d3150"] },
  base: { side: "#3b414d", top: "#59606e", margin: 0.25 },
};

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
 * How far a wall drops (1 = full height) for a camera at horizontal offset `cam` from the room centre.
 * Exterior walls facing the camera drop almost flat so the dollhouse is never blocked. Interior walls that
 * declare a `fold` drop to that fraction when seen face-on, so neighbouring rooms stay readable.
 */
export function wallScale(wall: WallSpec, cam: { x: number; z: number }): number {
  const len = Math.hypot(cam.x, cam.z) || 1;
  const facing = (wall.normal[0] * cam.x + wall.normal[1] * cam.z) / len;
  if (wall.outer) return facing > 0.18 ? 0.06 : 1;
  if (wall.fold !== undefined) return Math.abs(facing) > 0.3 ? wall.fold : 1;
  return 1;
}
export const wallCutDown = (wall: WallSpec, cam: { x: number; z: number }) => wallScale(wall, cam) < 1;

/** The Studio's tall partition only drops when the camera is low and on its right-hand side. */
export const partitionDrops = (wall: WallSpec, camPos: { x: number; y: number }) =>
  !wall.outer && wall.fold === undefined && wall.height > 1.2 && wall.normal[0] < 0 && camPos.x > wall.a[0] + 0.01 && camPos.y < 3;

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
/** Safe fallback for older plans without authored room cameras. */
export function vantageFor(plan: HomePlan, zone: PlanZone): VantagePoint {
  const authored = plan.vantagePoints?.[zone];
  if (authored) return authored;
  const spawn = plan.spawn.zones[zone] ?? plan.spawn.entry;
  const eh = Math.min(1.6, plan.size.h - 0.5);
  const x = Math.max(0.2, Math.min(plan.size.w - 0.2, spawn[0]));
  const z = Math.max(0.2, Math.min(plan.size.d - 0.2, spawn[1] + 1));
  return { eye: [x, eh, z], lookAt: [x, eh - 0.35, z - 3], yawClamp: [-1.15, 1.15] };
}

/** Head turn is relative to the authored direction, including its downward pitch. */
export function vantageLook(eye: readonly number[], look: readonly number[], yaw: number): [number, number, number] {
  const dx = look[0]! - eye[0]!, dz = look[2]! - eye[2]!;
  return [eye[0]! + dx * Math.cos(yaw) + dz * Math.sin(yaw), look[1]!, eye[2]! - dx * Math.sin(yaw) + dz * Math.cos(yaw)];
}

export function roomWallScale(wall: WallSpec, off: { x: number; z: number }, camera: { x: number; y: number }, firstPerson: boolean) {
  if (firstPerson) return wall.outer ? wallScale(wall, off) : 1;
  return Math.min(wallScale(wall, off), partitionDrops(wall, camera) ? 0.06 : 1);
}
