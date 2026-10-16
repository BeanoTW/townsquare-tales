/**
 * Floor plans for every property tier. All units are metres and share one world scale, so a character
 * (about 1.7 m tall, 0.4 m across) fits through every doorway in every home.
 *
 *   tier 0  Cardboard Box / Squat  4.6 × 3.6 m, one improvised space
 *   tier 1  Studio Flat            7.6 × 4.8 m, two spaces (see layout.ts)
 *   tier 2  Suburban House         11.2 × 8.0 m, four rooms plus hall
 *   tier 3  Mansion                19.6 × 13.0 m, six rooms plus foyer, 3.3 m ceilings
 *
 * Slots only say where a piece of furniture WOULD stand. Whether it appears is decided by the existing
 * hotspot rules (ownership and tier), never by the plan.
 */
import type { PlanZone } from "@/lib/home-zones";
import { STUDIO, type HomePlan, type Opening, type Slot, type WallSpec } from "./layout";

type Dim = [w: number, d: number];
/** Footprint (width across, depth front-to-back) of each model before rotation. */
const MODEL: Record<string, Dim> = {
  bed: [1.6, 2.1], sofa: [2.0, 0.95], kitchen: [2.6, 0.74], tv: [1.35, 0.5], console: [0.5, 0.5], bookshelf: [0.95, 0.38],
  weights: [1.5, 1.1], desk: [1.5, 0.7], estate: [0.7, 0.25], blackjack: [2.6, 1.5], slots: [2.4, 0.8],
};
const LABEL: Record<string, [string, string, number]> = {
  bed: ["Bed", "SLEEP", 1.2], sofa: ["Sofa", "RELAX", 1.25], kitchen: ["Kitchen", "COOK", 1.7], tv: ["Television", "WATCH", 1.45],
  console: ["Game console", "PLAY", 0.95], bookshelf: ["Bookshelf", "READ", 2.05], weights: ["Home weights", "TRAIN", 1.35],
  desk: ["Study desk", "STUDY", 1.5], estate: ["Estate agent board", "MOVE", 1.5], blackjack: ["Blackjack table", "CARDS", 1.3], slots: ["Slot machines", "SPIN", 2.0],
};

/** Build a slot; the footprint swaps width and depth when the piece is turned a quarter. */
function slot(id: Slot["id"], x: number, z: number, rot: number, zone: PlanZone, dim?: Dim, labelY?: number, label?: string): Slot {
  const [w, d] = dim ?? MODEL[id]!;
  const turned = Math.sin(rot) ** 2 > 0.5;
  const [name, tag, ly] = LABEL[id]!;
  return { id, x, z, rot, w: turned ? d : w, d: turned ? w : d, zone, label: label ?? name, tag, labelY: labelY ?? ly };
}

export const wall = (
  id: string, a: [number, number], b: [number, number], height: number, thickness: number, normal: [number, number],
  outer: boolean, colour: string, openings: Opening[] = [], extra: Partial<WallSpec> = {},
): WallSpec => ({ id, a, b, height, thickness, normal, outer, colour, openings, ...extra });
export const win = (u0: number, u1: number, v0 = 0.95, v1 = 2.05): Opening => ({ kind: "window", u0, u1, v0, v1 });
export const door = (u0: number, u1: number, v1 = 2.1): Opening => ({ kind: "door", u0, u1, v0: 0, v1 });
export const arch = (u0: number, u1: number, v1 = 2.1): Opening => ({ kind: "doorway", u0, u1, v0: 0, v1 });

/* ------------------------------------------------------------------ squat */
const SW = 4.6;
const SD = 3.6;
const SH = 2.1;
export const SQUAT: HomePlan = {
  tier: 0,
  kind: "squat",
  vantagePoints: {
    shelter: { eye: [2.3, 1.4, 2.9], lookAt: [2.3, 1.1, 0.8] },
  },
  name: "Cardboard box squat",
  size: { w: SW, d: SD, h: SH },
  floors: [
    { zone: "shelter", rect: { x0: 0, z0: 0, x1: SW, z1: SD }, kind: "concrete", colour: "#8d877c" },
    { zone: "shelter", rect: { x0: 0.15, z0: 0.15, x1: 2.3, z1: 1.85 }, kind: "boards", colour: "#9a7b55" },
  ],
  walls: [
    wall("back", [0, 0], [SW, 0], SH, 0.1, [0, -1], true, "#a98456", [win(1.05, 1.85, 1.1, 1.7)], { style: "scrap" }),
    wall("front", [0, SD], [SW, SD], SH, 0.1, [0, 1], true, "#9b7a4f", [arch(2.5, 3.4, 1.75)], { style: "scrap" }),
    wall("left", [0, 0], [0, SD], SH, 0.1, [-1, 0], true, "#8f7550", [], { style: "scrap" }),
    wall("right", [SW, 0], [SW, SD], SH, 0.1, [1, 0], true, "#9a8a70", [], { style: "scrap" }),
  ],
  slots: [
    slot("bed", 1.2, 0.95, Math.PI / 2, "shelter", [1.5, 2.0], 0.9, "Mattress"),
    slot("kitchen", 3.65, 0.4, 0, "shelter", [1.3, 0.6], 1.2, "Camp stove"),
    slot("desk", 4.2, 1.75, -Math.PI / 2, "shelter", [1.1, 0.6], 1.2, "Crate desk"),
    slot("weights", 2.9, 1.9, Math.PI / 2, "shelter", [1.2, 0.8], 1.1, "Scrap weights"),
    slot("sofa", 1.2, 3.05, Math.PI, "shelter", [1.5, 0.8], 1.1, "Old couch"),
    slot("estate", 4.0, 3.3, 0, "shelter"),
  ],
  focus: {
    all: { x0: 0, z0: 0, x1: SW, z1: SD },
    shelter: { x0: 0, z0: 0, x1: SW, z1: SD },
  },
  rooms: [{ zone: "shelter", name: "The shelter", rect: { x0: 0, z0: 0, x1: SW, z1: SD } }],
  doors: [{ a: [2.5, SD], b: [3.4, SD] }],
  spawn: { entry: [2.95, 3.25], zones: { shelter: [2.95, 2.95] } },
  colliders: [
    { x0: 0.2, z0: 2.0, x1: 0.7, z1: 2.5 }, // crate stack
    { x0: 4.15, z0: 2.65, x1: 4.5, z1: 3.05 }, // rubbish sacks
  ],
  lights: {
    hemi: ["#b4b8ae", "#4a4038"], hemiBase: 0.3, hemiDay: 0.32, sunBase: 0.08, sunDay: 1.35, sunTint: ["#e8e4d6", "#d9a56a"],
    points: [
      { p: [2.3, 1.9, 1.6], colour: "#ffd79a", day: 1.6, night: 7.5, distance: 4.8, decay: 1.7 },
      { p: [0.8, 0.7, 1.2], colour: "#ff9f4a", day: 0.5, night: 2.8, distance: 2.4, decay: 1.8 },
    ],
  },
  sky: { day: ["#a9afac", "#c9c3b5"], night: ["#0f1218", "#191b21"] },
  base: { side: "#5a4936", top: "#7b6a52", margin: 0.3 },
};

/* --------------------------------------------------------------- suburban */
const UW = 11.2;
const UD = 8.0;
const UH = 2.6;
const OT = 0.16;
const IT = 0.12;
const WARM = "#e6d5b8";
const MINT = "#cfe0d6";
const LILAC = "#d7cfe4";
const SKY = "#c9d6e0";
const HALL = "#eadfc8";
const INNER = "#f0e9da";
const inner = (id: string, a: [number, number], b: [number, number], normal: [number, number], openings: Opening[]) =>
  wall(id, a, b, UH, IT, normal, false, INNER, openings, { fold: 0.38 });
export const SUBURBAN: HomePlan = {
  tier: 2,
  kind: "suburban",
  vantagePoints: {
    living: { eye: [3, 1.6, 3.6], lookAt: [2.2, 1.25, 1.2] },
    kitchen: { eye: [8.6, 1.6, 3.6], lookAt: [8.6, 1.25, 1.2] },
    bedroom: { eye: [2.3, 1.6, 7.2], lookAt: [2.3, 1.25, 5] },
    study: { eye: [9, 1.6, 7.2], lookAt: [9, 1.25, 5.4] },
  },
  name: "Suburban house",
  size: { w: UW, d: UD, h: UH },
  floors: [
    { zone: "living", rect: { x0: 0, z0: 0, x1: 6.0, z1: 4.4 }, kind: "laminate", colour: "#ffffff" },
    { zone: "kitchen", rect: { x0: 6.0, z0: 0, x1: UW, z1: 4.4 }, kind: "tile", colour: "#ffffff" },
    { zone: "bedroom", rect: { x0: 0, z0: 4.4, x1: 4.6, z1: UD }, kind: "carpet", colour: "#d9cde4" },
    { zone: "living", rect: { x0: 4.6, z0: 4.4, x1: 6.6, z1: UD }, kind: "parquet", colour: "#ffffff" },
    { zone: "study", rect: { x0: 6.6, z0: 4.4, x1: 8.9, z1: UD }, kind: "parquet", colour: "#b9a58c" },
    { zone: "study", rect: { x0: 8.9, z0: 4.4, x1: UW, z1: UD }, kind: "rubber", colour: "#ffffff" },
  ],
  walls: [
    wall("back-living", [0, 0], [6.0, 0], UH, OT, [0, -1], true, WARM, [win(3.9, 5.5)]),
    wall("back-kitchen", [6.0, 0], [UW, 0], UH, OT, [0, -1], true, MINT, [win(1.3, 3.3)]),
    wall("front-bedroom", [0, UD], [4.6, UD], UH, OT, [0, 1], true, LILAC, [win(1.4, 3.2)]),
    wall("front-hall", [4.6, UD], [6.6, UD], UH, OT, [0, 1], true, HALL, [door(0.4, 1.6, 2.15)], { leaf: "#7a2f2f" }),
    wall("front-study", [6.6, UD], [UW, UD], UH, OT, [0, 1], true, SKY, [win(0.6, 1.8), win(2.8, 4.2)]),
    wall("left-living", [0, 0], [0, 4.4], UH, OT, [-1, 0], true, WARM, [win(0.7, 1.8)]),
    wall("left-bedroom", [0, 4.4], [0, UD], UH, OT, [-1, 0], true, LILAC, [win(1.3, 2.7)]),
    wall("right-kitchen", [UW, 0], [UW, 4.4], UH, OT, [1, 0], true, MINT, [win(1.0, 2.6)]),
    wall("right-study", [UW, 4.4], [UW, UD], UH, OT, [1, 0], true, SKY, [win(1.0, 2.4)]),
    inner("wall-living-kitchen", [6.0, 0], [6.0, 4.4], [-1, 0], [arch(1.4, 2.8)]),
    inner("wall-rows", [0, 4.4], [UW, 4.4], [0, -1], [door(1.2, 2.1), arch(4.8, 5.9), arch(8.0, 9.0)]),
    inner("wall-bedroom-hall", [4.6, 4.4], [4.6, UD], [-1, 0], [door(0.9, 1.8)]),
    inner("wall-hall-study", [6.6, 4.4], [6.6, UD], [-1, 0], [arch(0.9, 1.9)]),
  ],
  slots: [
    slot("sofa", 2.55, 3.1, -Math.PI / 2, "living"),
    slot("tv", 0.35, 3.1, Math.PI / 2, "living"),
    slot("console", 0.42, 1.95, Math.PI / 2, "living"),
    slot("bookshelf", 1.5, 0.28, 0, "living"),
    slot("estate", 5.05, 7.55, 0, "living"),
    slot("kitchen", 8.3, 0.45, 0, "kitchen"),
    slot("bed", 3.1, 5.55, 0, "bedroom", [2.32, 2.1]),
    slot("desk", 7.7, 7.5, Math.PI, "study"),
    slot("weights", 10.0, 6.0, 0, "study"),
  ],
  focus: {
    all: { x0: 0, z0: 0, x1: UW, z1: UD },
    living: { x0: 0, z0: 0, x1: 6.6, z1: 4.4 },
    kitchen: { x0: 6.0, z0: 0, x1: UW, z1: 4.4 },
    bedroom: { x0: 0, z0: 4.4, x1: 4.6, z1: UD },
    study: { x0: 6.6, z0: 4.4, x1: UW, z1: UD },
  },
  rooms: [
    { zone: "living", name: "Living room", rect: { x0: 0, z0: 0, x1: 6.0, z1: 4.4 } },
    { zone: "kitchen", name: "Kitchen", rect: { x0: 6.0, z0: 0, x1: UW, z1: 4.4 } },
    { zone: "bedroom", name: "Bedroom", rect: { x0: 0, z0: 4.4, x1: 4.6, z1: UD } },
    { zone: "living", name: "Hall", rect: { x0: 4.6, z0: 4.4, x1: 6.6, z1: UD } },
    { zone: "study", name: "Study and gym", rect: { x0: 6.6, z0: 4.4, x1: UW, z1: UD } },
  ],
  doors: [
    { a: [5.0, UD], b: [6.2, UD] },
    { a: [6.0, 1.4], b: [6.0, 2.8] },
    { a: [1.2, 4.4], b: [2.1, 4.4] },
    { a: [4.8, 4.4], b: [5.9, 4.4] },
    { a: [8.0, 4.4], b: [9.0, 4.4] },
    { a: [4.6, 5.3], b: [4.6, 6.2] },
    { a: [6.6, 5.3], b: [6.6, 6.3] },
  ],
  spawn: { entry: [5.9, 7.3], zones: { living: [3.9, 2.4], kitchen: [10.0, 2.2], bedroom: [1.4, 6.8], study: [8.0, 6.2] } },
  colliders: [
    { x0: 5.4, z0: 0.1, x1: 5.9, z1: 0.6 }, // plant
    { x0: 7.5, z0: 2.4, x1: 9.5, z1: 3.6 }, // dining table and chairs
    { x0: 0.08, z0: 4.6, x1: 0.68, z1: 5.6 }, // wardrobe
    { x0: 10.5, z0: 7.2, x1: 11.05, z1: 7.75 }, // water cooler / bench by the gym window
  ],
  lights: {
    hemi: ["#e8eff6", "#8a7660"], hemiBase: 0.5, hemiDay: 0.55, sunBase: 0.2, sunDay: 2.6, sunTint: ["#fff3dc", "#ffcf9a"],
    points: [
      { p: [3.0, 2.3, 2.4], colour: "#ffc983", day: 4, night: 19, distance: 8, decay: 1.6 },
      { p: [8.6, 2.3, 2.2], colour: "#fff0d0", day: 3, night: 15, distance: 7, decay: 1.6 },
      { p: [2.3, 2.1, 6.2], colour: "#d4c4ff", day: 2.5, night: 12, distance: 6, decay: 1.6 },
      { p: [8.9, 2.1, 6.2], colour: "#c9dcff", day: 2.5, night: 12, distance: 7, decay: 1.6 },
    ],
  },
  sky: { day: ["#c4e0f0", "#f1ead8"], night: ["#1c2440", "#2d3150"] },
  base: { side: "#4a4038", top: "#6a6e62", margin: 0.35, frontLawn: 1.7 },
};

/* ---------------------------------------------------------------- mansion */
const MW = 19.6;
const MD = 13.0;
const MH = 3.3;
const MOT = 0.22;
const MIT = 0.16;
const minner = (id: string, a: [number, number], b: [number, number], normal: [number, number], openings: Opening[]) =>
  wall(id, a, b, MH, MIT, normal, false, "#f2ece0", openings, { fold: 0.34, style: "panel", trim: "#fbf6ea" });
const mouter = (id: string, a: [number, number], b: [number, number], normal: [number, number], colour: string, openings: Opening[], extra: Partial<WallSpec> = {}) =>
  wall(id, a, b, MH, MOT, normal, true, colour, openings, { style: "panel", trim: "#fbf6ea", ...extra });
const tall = (u0: number, u1: number) => win(u0, u1, 0.45, 2.85);
export const MANSION: HomePlan = {
  tier: 3,
  kind: "mansion",
  vantagePoints: {
    living: { eye: [4, 1.65, 5.4], lookAt: [3.2, 1.3, 2] },
    kitchen: { eye: [10.7, 1.65, 5.4], lookAt: [10.7, 1.3, 2] },
    entertainment: { eye: [16.5, 1.65, 5.4], lookAt: [16.5, 1.3, 2.2] },
    bedroom: { eye: [3, 1.65, 11.4], lookAt: [3, 1.3, 7.5] },
    study: { eye: [12, 1.65, 11.4], lookAt: [12, 1.3, 7.5] },
    gym: { eye: [17, 1.65, 11.4], lookAt: [17, 1.3, 8] },
  },
  name: "Mansion",
  size: { w: MW, d: MD, h: MH },
  floors: [
    { zone: "living", rect: { x0: 0, z0: 0, x1: 8.0, z1: 6.4 }, kind: "marble", colour: "#f1ece2" },
    { zone: "kitchen", rect: { x0: 8.0, z0: 0, x1: 13.4, z1: 6.4 }, kind: "marble", colour: "#dfe3e6" },
    { zone: "entertainment", rect: { x0: 13.4, z0: 0, x1: MW, z1: 6.4 }, kind: "carpet", colour: "#6d4a86" },
    { zone: "bedroom", rect: { x0: 0, z0: 6.4, x1: 6.0, z1: MD }, kind: "carpet", colour: "#efe6d6" },
    { zone: "living", rect: { x0: 6.0, z0: 6.4, x1: 9.4, z1: MD }, kind: "marble", colour: "#e9e1d2" },
    { zone: "study", rect: { x0: 9.4, z0: 6.4, x1: 14.6, z1: MD }, kind: "parquet", colour: "#8a5a38" },
    { zone: "gym", rect: { x0: 14.6, z0: 6.4, x1: MW, z1: MD }, kind: "rubber", colour: "#ffffff" },
  ],
  walls: [
    mouter("back-living", [0, 0], [8.0, 0], [0, -1], "#e8dcc4", [tall(0.9, 2.5), tall(5.5, 7.1)]),
    mouter("back-kitchen", [8.0, 0], [13.4, 0], [0, -1], "#e4ece6", [tall(1.2, 2.8), tall(3.2, 4.6)]),
    mouter("back-games", [13.4, 0], [MW, 0], [0, -1], "#4a3358", []),
    mouter("right-games", [MW, 0], [MW, 6.4], [1, 0], "#4a3358", []),
    mouter("right-gym", [MW, 6.4], [MW, MD], [1, 0], "#cfd8de", [tall(1.2, 3.2), tall(3.8, 5.6)]),
    mouter("front-gym", [14.6, MD], [MW, MD], [0, 1], "#cfd8de", [tall(0.9, 2.5), tall(3.0, 4.4)]),
    mouter("front-study", [9.4, MD], [14.6, MD], [0, 1], "#cdd6df", [tall(0.8, 2.4), tall(3.0, 4.6)]),
    mouter("front-foyer", [6.0, MD], [9.4, MD], [0, 1], "#efe7d6", [{ kind: "door", u0: 1.2, u1: 3.0, v0: 0, v1: 2.7 }], { leaf: "#26262b" }),
    mouter("front-bedroom", [0, MD], [6.0, MD], [0, 1], "#e3dcea", [tall(1.0, 2.8), tall(3.3, 5.0)]),
    mouter("left-bedroom", [0, 6.4], [0, MD], [-1, 0], "#e3dcea", [tall(1.4, 3.2), tall(3.8, 5.4)]),
    mouter("left-living", [0, 0], [0, 6.4], [-1, 0], "#e8dcc4", [tall(0.6, 1.8), tall(4.4, 5.8)]),
    minner("wall-living-kitchen", [8.0, 0], [8.0, 6.4], [-1, 0], [arch(1.2, 5.0, 2.8)]),
    minner("wall-kitchen-games", [13.4, 0], [13.4, 6.4], [-1, 0], [arch(1.5, 4.9, 2.8)]),
    minner("wall-rows", [0, 6.4], [MW, 6.4], [0, -1], [door(0.9, 1.9, 2.4), arch(6.2, 7.9, 2.8), arch(8.3, 9.3, 2.6), door(10.9, 11.9, 2.4), door(13.6, 14.4, 2.4), arch(16.2, 17.8, 2.6)]),
    minner("wall-bedroom-foyer", [6.0, 6.4], [6.0, MD], [-1, 0], [door(1.6, 2.6, 2.4)]),
    minner("wall-foyer-study", [9.4, 6.4], [9.4, MD], [-1, 0], [arch(1.6, 2.8, 2.6)]),
    minner("wall-study-gym", [14.6, 6.4], [14.6, MD], [-1, 0], [arch(1.9, 3.4, 2.6)]),
  ],
  slots: [
    slot("tv", 0.35, 3.2, Math.PI / 2, "living"),
    slot("sofa", 3.4, 3.2, -Math.PI / 2, "living"),
    slot("bookshelf", 4.0, 0.3, 0, "living"),
    slot("kitchen", 10.7, 0.45, 0, "kitchen"),
    slot("bed", 3.55, 7.55, 0, "bedroom", [2.32, 2.1]),
    slot("desk", 12.0, 12.45, Math.PI, "study"),
    slot("weights", 17.2, 10.0, 0, "gym"),
    slot("console", 14.3, 1.2, Math.PI / 2, "entertainment"),
    slot("blackjack", 16.0, 3.4, 0, "entertainment"),
    slot("slots", 17.2, 0.55, 0, "entertainment"),
  ],
  focus: {
    all: { x0: 0, z0: 0, x1: MW, z1: MD },
    living: { x0: 0, z0: 0, x1: 8.0, z1: 6.4 },
    kitchen: { x0: 8.0, z0: 0, x1: 13.4, z1: 6.4 },
    entertainment: { x0: 13.4, z0: 0, x1: MW, z1: 6.4 },
    bedroom: { x0: 0, z0: 6.4, x1: 6.0, z1: MD },
    study: { x0: 9.4, z0: 6.4, x1: 14.6, z1: MD },
    gym: { x0: 14.6, z0: 6.4, x1: MW, z1: MD },
  },
  rooms: [
    { zone: "living", name: "Grand living room", rect: { x0: 0, z0: 0, x1: 8.0, z1: 6.4 } },
    { zone: "kitchen", name: "Luxury kitchen", rect: { x0: 8.0, z0: 0, x1: 13.4, z1: 6.4 } },
    { zone: "entertainment", name: "Games room", rect: { x0: 13.4, z0: 0, x1: MW, z1: 6.4 } },
    { zone: "bedroom", name: "Master bedroom", rect: { x0: 0, z0: 6.4, x1: 6.0, z1: MD } },
    { zone: "living", name: "Foyer", rect: { x0: 6.0, z0: 6.4, x1: 9.4, z1: MD } },
    { zone: "study", name: "Executive study", rect: { x0: 9.4, z0: 6.4, x1: 14.6, z1: MD } },
    { zone: "gym", name: "Private gym", rect: { x0: 14.6, z0: 6.4, x1: MW, z1: MD } },
  ],
  doors: [
    { a: [7.2, MD], b: [9.0, MD] },
    { a: [8.0, 1.2], b: [8.0, 5.0] },
    { a: [13.4, 1.5], b: [13.4, 4.9] },
    { a: [0.9, 6.4], b: [1.9, 6.4] },
    { a: [6.2, 6.4], b: [7.9, 6.4] },
    { a: [8.3, 6.4], b: [9.3, 6.4] },
    { a: [10.9, 6.4], b: [11.9, 6.4] },
    { a: [13.6, 6.4], b: [14.4, 6.4] },
    { a: [16.2, 6.4], b: [17.8, 6.4] },
    { a: [6.0, 8.0], b: [6.0, 9.0] },
    { a: [9.4, 8.0], b: [9.4, 9.2] },
    { a: [14.6, 8.3], b: [14.6, 9.8] },
  ],
  spawn: { entry: [8.1, 12.3], zones: { living: [5.0, 4.6], kitchen: [12.4, 5.2], entertainment: [15.6, 5.4], bedroom: [1.6, 9.5], study: [11.5, 8.6], gym: [16.2, 8.0] } },
  colliders: [
    { x0: 1.2, z0: 2.85, x1: 2.3, z1: 3.55, when: "sofa" }, // coffee table
    { x0: 2.95, z0: 0.85, x1: 3.85, z1: 1.75, when: "sofa" }, // armchair
    { x0: 2.95, z0: 4.65, x1: 3.85, z1: 5.55, when: "sofa" }, // armchair
    { x0: 4.55, z0: 1.25, x1: 6.05, z1: 3.6 }, // grand piano and stool
    { x0: 2.55, z0: 0.11, x1: 3.45, z1: 0.55 }, // marble fireplace
    { x0: 9.3, z0: 2.6, x1: 12.1, z1: 4.2, when: "kitchen" }, // kitchen island and stools
    { x0: 6.1, z0: 9.4, x1: 7.0, z1: 12.7 }, // staircase
    { x0: 8.9, z0: 10.2, x1: 9.3, z1: 11.6 }, // foyer console table
    { x0: 0.08, z0: 11.0, x1: 0.71, z1: 12.9 }, // walk-in wardrobe
    { x0: 2.85, z0: 9.3, x1: 4.25, z1: 9.9, when: "bed" }, // chaise longue
    { x0: 14.2, z0: 6.6, x1: 14.5, z1: 8.2 }, // library wall
    { x0: 14.2, z0: 9.9, x1: 14.5, z1: 12.8 }, // library wall
    { x0: 9.9, z0: 9.7, x1: 11.1, z1: 10.7, when: "desk" }, // reading chairs and table
    { x0: 18.9, z0: 0.9, x1: 19.5, z1: 5.2 }, // banquette seating
  ],
  lights: {
    hemi: ["#eef2f8", "#9a8a78"], hemiBase: 0.55, hemiDay: 0.55, sunBase: 0.2, sunDay: 2.4, sunTint: ["#fff4e2", "#ffd2a0"],
    points: [
      { p: [4.0, 3.0, 3.2], colour: "#ffd9a0", day: 5, night: 22, distance: 10, decay: 1.5 },
      { p: [10.7, 2.9, 3.0], colour: "#fff4de", day: 4, night: 18, distance: 8, decay: 1.5 },
      { p: [16.5, 2.8, 3.2], colour: "#c28bff", day: 6, night: 16, distance: 8, decay: 1.4 },
      { p: [3.5, 2.7, 9.5], colour: "#ffd8a8", day: 3, night: 14, distance: 8, decay: 1.5 },
      { p: [12.0, 2.7, 9.7], colour: "#ffcf8f", day: 3, night: 15, distance: 8, decay: 1.5 },
      { p: [17.2, 2.8, 9.7], colour: "#e6f0ff", day: 4, night: 14, distance: 8, decay: 1.5 },
    ],
  },
  sky: { day: ["#bcd9ee", "#f6efdd"], night: ["#1c2440", "#2d3150"] },
  base: { side: "#2e3340", top: "#46505d", margin: 0.5, frontLawn: 2.2 },
  npcs: [
    { id: "ivy", name: "Ivy", x: 15.3, z: 4.55, rot: Math.PI, pose: "sit", shirt: "#5c6e98", skin: "#f0d5b7", hair: "#3a2a22" },
    { id: "gus", name: "Gus", x: 16.7, z: 4.55, rot: Math.PI, pose: "sit", shirt: "#4f8a54", skin: "#e8c7a0", hair: "#8a8a8a" },
    { id: "nox", name: "Nox", x: 17.2, z: 1.45, rot: Math.PI, pose: "stand", shirt: "#733d45", skin: "#d9b48f", hair: "#1e1a1a" },
  ],
};

export const PLANS: readonly HomePlan[] = [SQUAT, STUDIO, SUBURBAN, MANSION];
/** The plan for a property tier, or null if the tier has none. */
export const planFor = (house: number): HomePlan | null => PLANS[house] ?? null;