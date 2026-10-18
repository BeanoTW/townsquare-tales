/**
 * Floor plans for the three public venues that get a 3D interior: Lucky Sevens (casino), the Tipsy Stick (bar)
 * and the Iron Gym. They use the same plan format, camera and walkability data as the homes, at the same
 * world scale, so a character can later walk through any of them. Slot ids are the existing hotspot ids.
 *
 *   casino  15.0 × 10.6 m, 3.4 m ceilings, windowless gaming floor + walled-off high-stakes room
 *   bar     12.0 ×  8.2 m, 3.0 m ceilings, brick bar room with a dance floor and darts corner
 *   gym     15.0 ×  9.4 m, 3.6 m warehouse gym with a weights floor, cardio zone and changing rooms
 */
import type { VenueId } from "@/lib/home-zones";
import type { PlanZone } from "@/lib/home-zones";
import type { HomePlan, Slot } from "./layout";
import { arch, door, wall, win } from "./plans";
import { TOWN_VENUES, isTownVenue } from "./town-venues";
export { PAWN, POLICE } from "./town-venues";

type Dim = [w: number, d: number];
/** A venue slot: explicit label and tag (these match the classic hotspots), footprint swapped for quarter turns. */
function vslot(id: Slot["id"], x: number, z: number, rot: number, zone: PlanZone, dim: Dim, label: string, tag: string, labelY: number, flat = false): Slot {
  const turned = Math.sin(rot) ** 2 > 0.5;
  return { id, x, z, rot, w: turned ? dim[1] : dim[0], d: turned ? dim[0] : dim[1], zone, label, tag, labelY, ...(flat ? { flat: true } : {}) };
}
const R = (x0: number, z0: number, x1: number, z1: number) => ({ x0, z0, x1, z1 });

/* ------------------------------------------------------------------ Lucky Sevens */
const CW = 15.0;
const CD = 10.6;
const CH = 3.4;
const GOLD = "#c9a24a";
const cOuter = (id: string, a: [number, number], b: [number, number], normal: [number, number], colour: string, openings = [] as ReturnType<typeof door>[], extra = {}) =>
  wall(id, a, b, CH, 0.2, normal, true, colour, openings, { style: "panel", trim: GOLD, ...extra });
export const CASINO: HomePlan = {
  tier: 10,
  kind: "casino",
  name: "Lucky Sevens casino",
  size: { w: CW, d: CD, h: CH },
  floors: [
    { zone: "floor", rect: R(0, 0, 10.4, 8.0), kind: "pattern", colour: "#8a2b45" },
    { zone: "floor", rect: R(10.4, 6.0, CW, 8.0), kind: "pattern", colour: "#8a2b45" },
    { zone: "vip", rect: R(10.4, 0, CW, 6.0), kind: "pattern", colour: "#1f6b4a" },
    { zone: "floor", rect: R(0, 8.0, CW, CD), kind: "marble", colour: "#d8d0e0" },
  ],
  walls: [
    cOuter("back", [0, 0], [CW, 0], [0, -1], "#4a3568"),
    cOuter("front", [0, CD], [CW, CD], [0, 1], "#4a3568", [door(6.0, 8.2, 2.7)], { leaf: "#6b1f2a" }),
    cOuter("left", [0, 0], [0, CD], [-1, 0], "#42305e"),
    cOuter("right", [CW, 0], [CW, CD], [1, 0], "#2f5a4a"),
    wall("vip-west", [10.4, 0], [10.4, 6.0], CH, 0.18, [-1, 0], false, "#1f4a3a", [arch(1.3, 4.7, 2.7)], { style: "panel", trim: GOLD, fold: 0.34 }),
    wall("vip-south", [10.4, 6.0], [CW, 6.0], CH, 0.18, [0, 1], false, "#1f4a3a", [], { style: "panel", trim: GOLD, fold: 0.34 }),
  ],
  slots: [
    vslot("slots", 5.2, 0.55, 0, "floor", [2.4, 0.8], "Slot machine", "SLOTS", 2.2),
    vslot("blackjack", 4.8, 4.4, 0, "floor", [2.6, 1.5], "Blackjack table", "21", 1.5),
    vslot("high-dice", 12.7, 2.8, 0, "vip", [3.2, 1.5], "High-stakes dice", "DICE", 1.55),
  ],
  focus: {
    all: R(0, 0, CW, CD),
    floor: R(0, 0, 10.4, CD),
    vip: R(10.4, 0, CW, 6.0),
  },
  rooms: [
    { zone: "floor", name: "Gaming floor", rect: R(0, 0, 10.4, 8.0) },
    { zone: "floor", name: "Gaming floor, east", rect: R(10.4, 6.0, CW, 8.0) },
    { zone: "floor", name: "Entrance hall", rect: R(0, 8.0, CW, CD) },
    { zone: "vip", name: "High-stakes room", rect: R(10.4, 0, CW, 6.0) },
  ],
  doors: [
    { a: [6.0, CD], b: [8.2, CD] },
    { a: [10.4, 1.3], b: [10.4, 4.7] },
  ],
  spawn: { entry: [7.1, 10.1], zones: { floor: [7.1, 8.7], vip: [12.7, 4.9] } },
  colliders: [
    R(0.7, 0.2, 3.1, 0.9), // decor slot bank, left
    R(7.3, 0.2, 9.7, 0.9), // decor slot bank, right
    R(3.9, 5.3, 5.7, 5.8), // blackjack stools
    R(7.6, 3.9, 9.6, 5.3), // roulette table
    R(0.1, 5.2, 0.9, 7.8), // cashier cage
    R(2.1, 2.7, 2.7, 3.3), // columns
    R(7.7, 2.7, 8.3, 3.3),
    R(2.1, 6.1, 2.7, 6.7),
    R(7.7, 6.5, 8.3, 7.1),
    R(11.6, 0.1, 13.8, 0.65), // bottle cabinet
    R(10.8, 4.8, 11.6, 5.6), // armchair
    R(13.8, 4.8, 14.6, 5.6), // armchair
  ],
  lights: {
    hemi: ["#7a5a9a", "#2a1a3a"], hemiBase: 1.0, hemiDay: 0, sunBase: 0.7, sunDay: 0, sunTint: ["#ffe3b0", "#ffe3b0"],
    points: [
      { p: [5.0, 2.9, 4.4], colour: "#ffd28a", day: 16, night: 16, distance: 11, decay: 1.4 },
      { p: [5.2, 2.4, 1.5], colour: "#ff4fd8", day: 9, night: 9, distance: 5.5, decay: 1.5 },
      { p: [12.7, 2.9, 3.0], colour: "#ffe0a0", day: 12, night: 12, distance: 8, decay: 1.5 },
      { p: [7.1, 2.8, 9.2], colour: "#ffd9a8", day: 9, night: 9, distance: 8, decay: 1.5 },
    ],
  },
  sky: { day: ["#2a1c3f", "#4a2f63"], night: ["#1a1228", "#33204a"] },
  base: { side: "#2b2236", top: "#43365a", margin: 0.5 },
  npcs: [
    { id: "marlow", name: "Marlow the dealer", x: 4.8, z: 3.25, rot: 0, pose: "stand", shirt: "#f4f1ea", skin: "#d9b48f", hair: "#1e1a1a" },
    { id: "ivy", name: "Ivy", x: 4.1, z: 5.55, rot: Math.PI, pose: "sit", shirt: "#5c6e98", skin: "#f0d5b7", hair: "#3a2a22" },
    { id: "gus", name: "Gus", x: 5.5, z: 5.55, rot: Math.PI, pose: "sit", shirt: "#4f8a54", skin: "#e8c7a0", hair: "#8a8a8a" },
    { id: "nox", name: "Nox", x: 5.2, z: 1.5, rot: Math.PI, pose: "stand", shirt: "#733d45", skin: "#d9b48f", hair: "#1e1a1a" },
    { id: "vera", name: "Vera at the cage", x: 0.5, z: 6.5, rot: Math.PI / 2, pose: "stand", shirt: "#c9a24a", skin: "#e8c7a0", hair: "#3a2a22" },
    { id: "croupier", name: "Croupier", x: 12.7, z: 1.45, rot: 0, pose: "stand", shirt: "#1a1a1f", skin: "#c99a74", hair: "#1e1a1a" },
    { id: "whale1", name: "High roller", x: 12.0, z: 3.95, rot: Math.PI, pose: "stand", shirt: "#2f7f79", skin: "#f0d5b7", hair: "#8a6a3a" },
    { id: "whale2", name: "High roller", x: 13.6, z: 3.95, rot: Math.PI, pose: "stand", shirt: "#7a2d3a", skin: "#d9b48f", hair: "#1e1a1a" },
  ],
};

/* ------------------------------------------------------------------ The Tipsy Stick */
const BW = 12.0;
const BD = 8.2;
const BH = 3.0;
const bOuter = (id: string, a: [number, number], b: [number, number], normal: [number, number], colour: string, openings = [] as ReturnType<typeof door>[], extra = {}) =>
  wall(id, a, b, BH, 0.2, normal, true, colour, openings, { trim: "#2a1a1f", ...extra });
export const BAR: HomePlan = {
  tier: 11,
  kind: "bar",
  name: "The Tipsy Stick",
  size: { w: BW, d: BD, h: BH },
  floors: [
    { zone: "bar", rect: R(0, 0, 7.6, BD), kind: "boards", colour: "#b08a66" },
    { zone: "dance", rect: R(7.6, 0, BW, BD), kind: "boards", colour: "#8a6a50" },
    { zone: "dance", rect: R(7.9, 3.4, 11.0, 7.5), kind: "checker", colour: "#ffffff" },
  ],
  walls: [
    bOuter("back", [0, 0], [BW, 0], [0, -1], "#a86a5a", [], { style: "brick" }),
    bOuter("front", [0, BD], [BW, BD], [0, 1], "#5a3858", [win(1.2, 3.2, 1.1, 2.3), door(5.0, 6.2, 2.15), win(8.0, 10.2, 1.1, 2.3)], { leaf: "#2a1a1f" }),
    bOuter("left", [0, 0], [0, BD], [-1, 0], "#a05a4c", [win(1.4, 2.4, 1.3, 2.4), win(4.8, 5.8, 1.3, 2.4)], { style: "brick" }),
    bOuter("right", [BW, 0], [BW, BD], [1, 0], "#a05a4c", [win(6.6, 7.6, 1.3, 2.4)], { style: "brick" }),
  ],
  slots: [
    vslot("bar-counter", 4.0, 2.25, 0, "bar", [6.2, 0.9], "Bar counter", "ROUND", 1.9),
    vslot("dance-floor", 9.45, 5.45, 0, "dance", [3.1, 4.1], "Dance floor", "CHAT", 1.6, true),
    vslot("dartboard", 10.2, 0.3, 0, "dance", [1.0, 0.3], "Dartboard", "DARTS", 2.25),
    // Ron the bookie and his odds board beside the darts, looking out over the dance floor that doubles as the fight floor.
    vslot("pub-brawl", 9.1, 0.75, 0, "dance", [0.8, 0.5], "Ron the bookie", "FIGHT", 2.2),
  ],
  focus: {
    all: R(0, 0, BW, BD),
    bar: R(0, 0, 7.8, BD),
    dance: R(7.4, 0, BW, BD),
  },
  rooms: [
    { zone: "bar", name: "Bar room", rect: R(0, 0, 7.6, BD) },
    { zone: "dance", name: "Dance floor and darts", rect: R(7.6, 0, BW, BD) },
  ],
  doors: [{ a: [5.0, BD], b: [6.2, BD] }],
  spawn: { entry: [5.6, 7.7], zones: { bar: [5.0, 4.4], dance: [8.6, 2.4] } },
  colliders: [
    R(1.1, 2.9, 6.9, 3.3), // bar stools
    R(0.1, 4.0, 1.55, 7.4), // booth and its table
    R(2.6, 5.2, 4.0, 6.6), // round tables
    R(4.8, 5.2, 6.2, 6.6),
    R(11.2, 3.6, 11.9, 6.2), // DJ booth
    R(11.3, 2.7, 11.9, 3.3), // speaker stacks
    R(11.3, 6.5, 11.9, 7.1),
    R(0.1, 1.2, 0.7, 2.0), // jukebox
    R(0.8, 0.12, 7.2, 0.7), // back bar
    R(7.15, 6.9, 7.5, 7.5), // barrel by the dance floor
  ],
  lights: {
    hemi: ["#6a4a68", "#2a1a28"], hemiBase: 0.6, hemiDay: 0.3, sunBase: 0.15, sunDay: 0.9, sunTint: ["#ffd9b0", "#ffb070"],
    points: [
      { p: [4.0, 2.6, 2.8], colour: "#ffb86a", day: 7, night: 14, distance: 6.5, decay: 1.5 },
      { p: [3.8, 2.4, 0.9], colour: "#ff4f9a", day: 4, night: 8, distance: 5, decay: 1.6 },
      { p: [9.5, 2.7, 5.4], colour: "#9a5bff", day: 7, night: 12, distance: 6.5, decay: 1.5 },
      { p: [10.2, 2.4, 1.6], colour: "#fff0c8", day: 4, night: 7, distance: 4.5, decay: 1.6 },
    ],
  },
  sky: { day: ["#c9a0c8", "#e8d0c0"], night: ["#150c1f", "#2a1838"] },
  base: { side: "#3a2937", top: "#5a4152", margin: 0.5 },
  npcs: [
    { id: "barkeep", name: "Bartender", x: 4.0, z: 1.2, rot: 0, pose: "stand", shirt: "#83416f", skin: "#e8c7a0", hair: "#3a2a22" },
    { id: "dot", name: "Dot", x: 2.5, z: 3.1, rot: Math.PI, pose: "sit", seat: 0.72, shirt: "#4f8a54", skin: "#f0d5b7", hair: "#8a3a2a" },
    { id: "pete", name: "Pete", x: 5.5, z: 3.1, rot: Math.PI, pose: "sit", seat: 0.72, shirt: "#5c6e98", skin: "#d9b48f", hair: "#1e1a1a" },
    { id: "dancer1", name: "Dancer", x: 9.0, z: 4.4, rot: 0.3, pose: "dance", shirt: "#e05aa0", skin: "#f0d5b7", hair: "#3a2a22" },
    { id: "dancer2", name: "Dancer", x: 10.2, z: 5.6, rot: -0.5, pose: "dance", shirt: "#3aa6c9", skin: "#d9b48f", hair: "#1e1a1a" },
    { id: "dancer3", name: "Dancer", x: 9.2, z: 6.7, rot: Math.PI, pose: "dance", shirt: "#e9c46a", skin: "#c99a74", hair: "#1e1a1a" },
    { id: "gus-darts", name: "Gus", x: 11.3, z: 1.7, rot: Math.PI, pose: "stand", shirt: "#4f8a54", skin: "#e8c7a0", hair: "#8a8a8a" },
  ],
};

/* ------------------------------------------------------------------ Iron Gym */
const GW = 15.0;
const GD = 9.4;
const GH = 3.6;
const gOuter = (id: string, a: [number, number], b: [number, number], normal: [number, number], colour: string, openings = [] as ReturnType<typeof door>[], extra = {}) =>
  wall(id, a, b, GH, 0.2, normal, true, colour, openings, { style: "block", trim: "#e1a53a", ...extra });
export const GYM: HomePlan = {
  tier: 12,
  kind: "gym",
  name: "Iron Gym",
  size: { w: GW, d: GD, h: GH },
  floors: [
    { zone: "weights", rect: R(0, 0, 8.6, 7.0), kind: "rubber", colour: "#ffffff" },
    { zone: "cardio", rect: R(8.6, 0, GW, 6.8), kind: "concrete", colour: "#d5d8da" },
    { zone: "cardio", rect: R(9.4, 4.5, 13.6, 6.5), kind: "rubber", colour: "#d9574a" },
    { zone: "weights", rect: R(0, 7.0, 8.6, GD), kind: "tile", colour: "#dfe3e6" },
    { zone: "cardio", rect: R(8.6, 6.8, 11.8, GD), kind: "tile", colour: "#dfe3e6" },
    { zone: "cardio", rect: R(11.8, 6.8, GW, GD), kind: "tile", colour: "#9fb6c4" },
  ],
  walls: [
    gOuter("back", [0, 0], [GW, 0], [0, -1], "#8da4af", [win(1.5, 3.3, 2.0, 3.2), win(5.0, 6.8, 2.0, 3.2), win(9.0, 10.8, 2.0, 3.2), win(12.0, 13.8, 2.0, 3.2)]),
    gOuter("front", [0, GD], [GW, GD], [0, 1], "#8da4af", [win(1.2, 4.2, 1.2, 2.9), door(6.0, 7.4, 2.2), win(9.0, 11.2, 1.2, 2.9)], { leaf: "#2f3a42" }),
    gOuter("left", [0, 0], [0, GD], [-1, 0], "#a8604e", [win(2.0, 3.4, 2.0, 3.2)], { style: "brick" }),
    gOuter("right", [GW, 0], [GW, GD], [1, 0], "#8da4af", [win(1.5, 3.5, 2.0, 3.2), win(5.0, 6.4, 2.0, 3.2)]),
    wall("changing-north", [11.8, 6.8], [GW, 6.8], GH, 0.14, [0, -1], false, "#7e95a1", [door(1.0, 2.0, 2.15)], { style: "block", trim: "#e1a53a", fold: 0.34, leaf: "#2f3a42" }),
    wall("changing-west", [11.8, 6.8], [11.8, GD], GH, 0.14, [-1, 0], false, "#7e95a1", [], { style: "block", trim: "#e1a53a", fold: 0.34 }),
  ],
  slots: [
    vslot("rack", 3.2, 3.2, 0, "weights", [2.6, 2.2], "Weights rack", "LIFT", 2.45),
    vslot("track", 11.8, 1.5, 0, "cardio", [3.9, 2.1], "Running machines", "JOG", 1.95),
  ],
  focus: {
    all: R(0, 0, GW, GD),
    weights: R(0, 0, 8.6, GD),
    cardio: R(8.6, 0, GW, GD),
  },
  rooms: [
    { zone: "weights", name: "Weights floor", rect: R(0, 0, 8.6, GD) },
    { zone: "cardio", name: "Cardio and stretch", rect: R(8.6, 0, GW, 6.8) },
    { zone: "cardio", name: "Reception", rect: R(8.6, 6.8, 11.8, GD) },
    { zone: "cardio", name: "Changing rooms", rect: R(11.8, 6.8, GW, GD) },
  ],
  doors: [
    { a: [6.0, GD], b: [7.4, GD] },
    { a: [12.8, 6.8], b: [13.8, 6.8] },
  ],
  spawn: { entry: [6.7, 8.9], zones: { weights: [4.8, 7.6], cardio: [11.0, 5.6] } },
  colliders: [
    R(1.4, 0.15, 5.2, 0.75), // dumbbell rack
    R(5.6, 1.7, 6.8, 3.3), // bench A
    R(5.6, 4.4, 6.8, 6.0), // bench B
    R(0.9, 5.0, 2.7, 6.6), // squat cage
    R(3.6, 5.8, 4.9, 6.5), // plyo boxes
    R(0.6, 0.9, 1.2, 1.5), // heavy bag
    R(0.5, 7.7, 3.7, 8.7), // reception desk
    R(4.2, 8.6, 4.8, 9.2), // water cooler
    R(9.2, 3.15, 12.0, 3.95), // exercise bikes
    R(14.0, 2.9, 14.8, 4.9), // rowing machine
    R(14.5, 7.0, 14.9, 9.2), // lockers
    R(12.6, 8.1, 13.9, 8.6), // changing bench
  ],
  lights: {
    hemi: ["#dfe8ee", "#6a6d70"], hemiBase: 0.5, hemiDay: 0.45, sunBase: 0.2, sunDay: 2.2, sunTint: ["#fff3dc", "#ffcf9a"],
    points: [
      { p: [3.5, 3.3, 3.0], colour: "#e8f2ff", day: 4, night: 16, distance: 9, decay: 1.5 },
      { p: [11.0, 3.3, 3.5], colour: "#e8f2ff", day: 4, night: 16, distance: 9, decay: 1.5 },
      { p: [4.5, 3.0, 7.8], colour: "#ffe3b8", day: 2, night: 8, distance: 7, decay: 1.6 },
      { p: [13.4, 2.9, 8.1], colour: "#dcecff", day: 2, night: 6, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#bcd4e0", "#e6e2d4"], night: ["#121a2a", "#1f2a3d"] },
  base: { side: "#4d5258", top: "#6b7076", margin: 0.5 },
  npcs: [
    { id: "trainer", name: "Brick the trainer", x: 5.0, z: 4.9, rot: Math.PI / 2, pose: "stand", shirt: "#e1a53a", skin: "#c99a74", hair: "#1e1a1a" },
    { id: "front-desk", name: "Receptionist", x: 2.1, z: 9.05, rot: Math.PI, pose: "stand", shirt: "#2f6a64", skin: "#f0d5b7", hair: "#3a2a22" },
    { id: "jogger", name: "Jogger", x: 11.8, z: 1.7, rot: Math.PI, pose: "jog", shirt: "#d9574a", skin: "#e8c7a0", hair: "#3a2a22" },
    { id: "lifter", name: "Lifter", x: 3.0, z: 1.3, rot: Math.PI, pose: "stand", shirt: "#3a4252", skin: "#d9b48f", hair: "#1e1a1a" },
  ],
};

export const VENUES: Record<VenueId, HomePlan> = { casino: CASINO, bar: BAR, gym: GYM, ...TOWN_VENUES };
const isKnownVenue = (id: string): id is VenueId => id === "casino" || id === "bar" || id === "gym" || isTownVenue(id);
export const venuePlan = (id: string): HomePlan | null => (isKnownVenue(id) ? VENUES[id] : null);