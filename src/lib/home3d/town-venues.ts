/**
 * Detailed floor plans for the town's everyday venues, built to the same standard as the Iron Gym and the
 * homes: real proportions, a public area plus a back-of-house space, mixed floor finishes, partitions with
 * doorways, windows matching the street front, colliders for every solid prop, coloured lighting and staff.
 *
 * Interaction slots keep the existing hotspot ids exactly; only their position and footprint changed.
 * Units are metres; x runs left to right, z from the back wall (0) to the street front, which holds the door.
 *
 *   shop       10.0 × 10.6  Corner Shop with a stockroom behind the shelves
 *   diner      13.0 ×  9.0  checkerboard dining room, counter and booths, kitchen behind a serving pass
 *   furniture  14.0 ×  9.5  Cosy Corner showroom of room sets with a bedroom gallery through an arch
 *   bank       14.0 × 10.0  marble banking hall, teller screens, loan desk and a vault room
 *   school     14.0 × 10.0  Stick U entrance hall, panelled library and a lecture room
 *   work       15.0 × 10.0  MegaCorp open-plan office with a glass-walled manager's office
 *   yard       15.0 × 10.0  builders' shed with materials, plant and the foreman's cabin
 *   clinic     13.0 ×  9.0  waiting room with dispensary, curtained treatment room
 *   depot      15.0 ×  9.5  bus station concourse, ticket office and the bus bays
 *   pawn       12.0 ×  9.0  Oddities Pawn shop floor and back-room workshop
 *   police     13.0 ×  9.5  reception with the front desk, squad room and holding cell
 */
import type { HomePlan, Slot, WallSpec, Opening } from "./layout";
import type { PlanZone } from "@/lib/home-zones";
import { arch, door, wall, win } from "./plans";

type Dim = [w: number, d: number];
/** A venue slot: explicit label and tag (matching the classic hotspots), footprint swapped for quarter turns. */
function vslot(id: Slot["id"], x: number, z: number, rot: number, zone: PlanZone, dim: Dim, label: string, tag: string, labelY: number): Slot {
  const turned = Math.sin(rot) ** 2 > 0.5;
  return { id, x, z, rot, w: turned ? dim[1] : dim[0], d: turned ? dim[0] : dim[1], zone, label, tag, labelY };
}
const R = (x0: number, z0: number, x1: number, z1: number) => ({ x0, z0, x1, z1 });

/** The four outer walls of a w × d box: back, front (street, holds the door), left, right. */
type Style = NonNullable<WallSpec["style"]>;
function shell(w: number, d: number, h: number, colour: string, style: Style, trim: string, open: { back?: Opening[]; front: Opening[]; left?: Opening[]; right?: Opening[] }, leaf?: string, sides?: { left?: string; right?: string; leftStyle?: Style }): WallSpec[] {
  const extra = { style, trim, ...(leaf ? { leaf } : {}) };
  return [
    wall("back", [0, 0], [w, 0], h, 0.2, [0, -1], true, colour, open.back ?? [], extra),
    wall("front", [0, d], [w, d], h, 0.2, [0, 1], true, colour, open.front, extra),
    wall("left", [0, 0], [0, d], h, 0.2, [-1, 0], true, sides?.left ?? colour, open.left ?? [], { ...extra, ...(sides?.leftStyle ? { style: sides.leftStyle } : {}) }),
    wall("right", [w, 0], [w, d], h, 0.2, [1, 0], true, sides?.right ?? colour, open.right ?? [], extra),
  ];
}
/** An interior partition: drops to a third of its height when it stands between the camera and the room. */
const part = (id: string, a: [number, number], b: [number, number], h: number, normal: [number, number], colour: string, openings: Opening[], style: Style, trim: string, leaf?: string) =>
  wall(id, a, b, h, 0.14, normal, false, colour, openings, { style, trim, fold: 0.34, ...(leaf ? { leaf } : {}) });

/* ------------------------------------------------------------------ Corner Shop */
export const SHOP: HomePlan = {
  tier: 20, kind: "shop", name: "Corner Shop",
  size: { w: 10, d: 10.6, h: 3.15 },
  floors: [
    { zone: "floor", rect: R(0, 2.6, 10, 10.6), kind: "tile", colour: "#d6cfc1" },
    { zone: "back", rect: R(0, 0, 10, 2.6), kind: "concrete", colour: "#c9c4b8" },
  ],
  walls: [
    ...shell(10, 10.6, 3.15, "#cfbaa0", "panel", "#51604e", { front: [win(0.7, 2.9, 1, 2.25), door(4.35, 5.7, 2.3), win(7.1, 9.25, 1, 2.25)], back: [win(2.0, 3.6, 1.6, 2.4)] }),
    part("stockroom", [0, 2.6], [10, 2.6], 3.15, [0, 1], "#c3ae94", [door(8.0, 9.0, 2.15)], "panel", "#51604e", "#5f4b3a"),
  ],
  slots: [
    vslot("shelves", 2.2, 5.0, 0, "floor", [2.3, 0.85], "Stocked shelves", "SHOP", 2.5),
    vslot("shop-board", 7.8, 4.1, 0, "floor", [1.3, 0.35], "Notice board", "JOBS", 2.3),
    vslot("checkout", 4.4, 7.9, 0, "floor", [1.7, 1.0], "Checkout", "BUY", 1.9),
    vslot("back-office", 6.6, 0.75, 0, "back", [1.4, 0.6], "Stockroom", "STAFF", 2.2),
  ],
  focus: { all: R(0, 0, 10, 10.6), floor: R(0, 2.6, 10, 10.6), back: R(0, 0, 10, 2.6) },
  rooms: [
    { zone: "floor", name: "Shop floor", rect: R(0, 2.6, 10, 10.6) },
    { zone: "back", name: "Stockroom", rect: R(0, 0, 10, 2.6) },
  ],
  doors: [{ a: [4.35, 10.6], b: [5.7, 10.6] }, { a: [8.0, 2.6], b: [9.0, 2.6] }],
  spawn: { entry: [5.0, 10.0], zones: { floor: [5.0, 9.3], back: [4.2, 1.6] } },
  colliders: [
    R(0.3, 2.75, 1.3, 3.4), R(1.8, 2.75, 2.8, 3.4), R(6.3, 2.75, 7.3, 3.4), // perimeter bays against the stockroom wall
    R(8.75, 3.7, 9.5, 5.1), // drinks fridge
    R(8.55, 8.1, 9.65, 8.8), R(8.5, 8.75, 9.75, 9.55), // bottle chiller and freezer
    R(0.4, 7.6, 1.05, 8.6), // end bay by the door
    R(0.2, 0.15, 3.4, 0.7), R(0.15, 0.8, 0.6, 2.4), R(8.4, 0.2, 9.8, 1.1), // stockroom racking and delivery cage
  ],
  lights: {
    hemi: ["#cfbaa0", "#3c4447"], hemiBase: 0.85, hemiDay: 0.45, sunBase: 0.4, sunDay: 1.25, sunTint: ["#fff4df", "#efb88c"],
    points: [
      { p: [2.8, 2.8, 5.4], colour: "#fff1d8", day: 5, night: 11, distance: 7, decay: 1.5 },
      { p: [7.5, 2.8, 7.1], colour: "#f0f5ff", day: 4, night: 9, distance: 6, decay: 1.6 },
      { p: [5.0, 2.6, 1.3], colour: "#f2efe2", day: 2, night: 5, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#cfbaa0", "#e6e3da"], night: ["#28323b", "#51604e"] },
  base: { side: "#51604e", top: "#b8aa96", margin: 0.4 },
  npcs: [
    { id: "shopkeeper", name: "Shopkeeper", x: 4.4, z: 6.95, rot: 0, pose: "stand", shirt: "#51604e", skin: "#d4a583", hair: "#322c2d" },
    { id: "browser", name: "Customer", x: 2.0, z: 6.0, rot: Math.PI, pose: "stand", shirt: "#b55a51", skin: "#efd0b0", hair: "#5a3a22" },
    { id: "stock-boy", name: "Stock boy", x: 3.0, z: 1.5, rot: Math.PI, pose: "stand", shirt: "#d99655", skin: "#c99572", hair: "#1e1a1a" },
  ],
};

/* ------------------------------------------------------------------ Fryday Diner */
export const DINER: HomePlan = {
  tier: 21, kind: "diner", name: "Fryday Diner",
  size: { w: 13, d: 9, h: 3.2 },
  floors: [
    { zone: "floor", rect: R(0, 0, 9.2, 9), kind: "chequer", colour: "#ffffff" },
    { zone: "floor", rect: R(2.3, 0, 8.3, 2.45), kind: "tile", colour: "#d8c3a5" },
    { zone: "back", rect: R(9.2, 0, 13, 9), kind: "tile", colour: "#e7ecee" },
  ],
  walls: [
    ...shell(13, 9, 3.2, "#efe2c8", "panel", "#b8433c", {
      back: [win(10.4, 12.4, 1.3, 2.3)],
      front: [win(0.6, 3.6, 0.9, 2.4), door(4.6, 6.0, 2.3), win(6.6, 8.8, 0.9, 2.4), win(10.2, 12.4, 1.2, 2.2)],
      left: [win(2.2, 6.0, 1.0, 2.3)],
    }, "#b8433c"),
    part("kitchen", [9.2, 0], [9.2, 9], 3.2, [-1, 0], "#e4e9ea", [win(1.4, 3.4, 1.05, 1.85), door(5.8, 6.8, 2.15)], "plain", "#8a9aa0", "#c9ced2"),
  ],
  slots: [
    vslot("counter", 5.3, 2.9, 0, "floor", [4.4, 0.85], "Diner counter", "EAT", 1.9),
    vslot("kitchen", 11.1, 0.75, 0, "back", [3.2, 0.9], "Kitchen pass", "COOK", 2.0),
    vslot("hiring", 0.35, 7.9, Math.PI / 2, "floor", [1.2, 0.3], "Hiring notice", "JOB", 2.2),
    vslot("booth", 8.0, 7.6, 0, "floor", [1.9, 1.5], "Manager booth", "WORK", 1.8),
  ],
  focus: { all: R(0, 0, 13, 9), floor: R(0, 0, 9.2, 9), back: R(9.2, 0, 13, 9) },
  rooms: [
    { zone: "floor", name: "Dining room", rect: R(0, 0, 9.2, 9) },
    { zone: "back", name: "Kitchen", rect: R(9.2, 0, 13, 9) },
  ],
  doors: [{ a: [4.6, 9], b: [6.0, 9] }, { a: [9.2, 5.8], b: [9.2, 6.8] }],
  spawn: { entry: [5.3, 8.4], zones: { floor: [5.3, 7.4], back: [10.9, 6.3] } },
  colliders: [
    R(2.3, 0.15, 8.3, 0.85), // back bar: coffee, shakes and the pie case
    R(0.15, 2.3, 1.9, 3.9), R(0.15, 4.2, 1.9, 5.8), // window booths
    R(3.1, 5.1, 4.1, 6.1), R(5.9, 5.1, 6.9, 6.1), // two-top tables
    R(8.5, 3.55, 9.1, 4.25), // jukebox
    R(10.3, 3.3, 12.0, 4.2), // prep table
    R(12.25, 4.6, 12.9, 6.1), // walk-in fridge
    R(10.0, 8.25, 11.8, 8.9), // pot sink
    R(12.3, 7.1, 12.9, 8.85), // dry store shelving
  ],
  lights: {
    hemi: ["#f6e2c8", "#4a3030"], hemiBase: 0.75, hemiDay: 0.45, sunBase: 0.35, sunDay: 1.4, sunTint: ["#fff3dc", "#ffcf9a"],
    points: [
      { p: [3.0, 2.8, 4.2], colour: "#ffd9a0", day: 5, night: 12, distance: 7, decay: 1.5 },
      { p: [7.0, 2.8, 5.8], colour: "#ffd9a0", day: 4, night: 10, distance: 6, decay: 1.5 },
      { p: [11.1, 2.8, 3.0], colour: "#eef6ff", day: 4, night: 9, distance: 6, decay: 1.6 },
      { p: [8.7, 2.1, 3.9], colour: "#ff7fb2", day: 1, night: 4, distance: 3.5, decay: 1.8 },
    ],
  },
  sky: { day: ["#f2c9a8", "#f6e7d2"], night: ["#1d1a2b", "#3a2d45"] },
  base: { side: "#7b2e2a", top: "#d7c9b2", margin: 0.45 },
  npcs: [
    { id: "waitress", name: "Waitress", x: 5.3, z: 1.65, rot: 0, pose: "stand", shirt: "#3f8f8a", skin: "#efd0b0", hair: "#b8433c" },
    { id: "cook", name: "Cook", x: 11.0, z: 1.75, rot: Math.PI, pose: "stand", shirt: "#f4f1ea", skin: "#c99572", hair: "#1e1a1a" },
    { id: "regular", name: "Regular", x: 4.0, z: 3.75, rot: Math.PI, pose: "sit", seat: 0.72, shirt: "#5c6e98", skin: "#d9b48f", hair: "#3a2a22" },
    { id: "booth-diner", name: "Customer", x: 1.0, z: 2.6, rot: 0, pose: "sit", seat: 0.46, shirt: "#e1a53a", skin: "#e8c7a0", hair: "#5a3a22" },
  ],
};

/* ------------------------------------------------------------------ Cosy Corner */
export const FURNITURE: HomePlan = {
  tier: 22, kind: "furniture", name: "Cosy Corner",
  size: { w: 14, d: 9.5, h: 3.3 },
  floors: [
    { zone: "floor", rect: R(0, 0, 9.6, 9.5), kind: "boards", colour: "#e2c29a" },
    { zone: "back", rect: R(9.6, 0, 14, 9.5), kind: "carpet", colour: "#cdb9a2" },
  ],
  walls: [
    ...shell(14, 9.5, 3.3, "#ece2d2", "plain", "#7a5a42", {
      back: [win(10.6, 12.8, 1.0, 2.4)],
      front: [win(0.6, 4.0, 0.6, 2.6), door(5.0, 6.4, 2.4), win(7.0, 9.0, 0.6, 2.6), win(10.2, 13.2, 1.0, 2.4)],
      right: [win(3.0, 5.0, 1.0, 2.3)],
    }, "#7a5a42", { left: "#d7c3a6" }),
    part("gallery", [9.6, 0], [9.6, 9.5], 3.3, [-1, 0], "#dccbb4", [arch(2.0, 5.4, 2.6)], "plain", "#7a5a42"),
  ],
  slots: [
    vslot("sofa-display", 2.6, 2.6, 0, "floor", [3.0, 2.2], "Sofa display", "SOFA", 1.7),
    vslot("bed-display", 11.9, 2.4, 0, "back", [2.4, 2.8], "Bed display", "BED", 1.6),
    vslot("catalogue", 7.6, 7.6, 0, "floor", [2.0, 0.9], "Catalogue", "BROWSE", 1.9),
  ],
  focus: { all: R(0, 0, 14, 9.5), floor: R(0, 0, 9.6, 9.5), back: R(9.6, 0, 14, 9.5) },
  rooms: [
    { zone: "floor", name: "Showroom", rect: R(0, 0, 9.6, 9.5) },
    { zone: "back", name: "Bedroom gallery", rect: R(9.6, 0, 14, 9.5) },
  ],
  doors: [{ a: [5.0, 9.5], b: [6.4, 9.5] }, { a: [9.6, 2.0], b: [9.6, 5.4] }],
  spawn: { entry: [5.7, 8.9], zones: { floor: [5.7, 7.0], back: [11.6, 5.4] } },
  colliders: [
    R(5.2, 1.8, 7.8, 3.6), // dining set display
    R(0.3, 5.6, 1.7, 7.4), // armchair pair
    R(4.6, 0.15, 8.9, 0.6), // bookcases and dresser along the back wall
    R(0.15, 3.9, 0.7, 5.3), // sideboard
    R(13.2, 5.4, 13.85, 7.6), // wardrobe
    R(10.2, 6.9, 12.2, 9.1), // single-bed display
    R(10.1, 1.0, 10.6, 1.5), R(13.2, 1.0, 13.7, 1.5), // bedside tables
  ],
  lights: {
    hemi: ["#f2e4d0", "#4a3a2c"], hemiBase: 0.8, hemiDay: 0.5, sunBase: 0.35, sunDay: 1.5, sunTint: ["#fff3dc", "#ffcf9a"],
    points: [
      { p: [2.6, 2.6, 3.2], colour: "#ffdcae", day: 4, night: 10, distance: 6, decay: 1.5 },
      { p: [6.6, 2.8, 5.4], colour: "#fff0d8", day: 4, night: 9, distance: 7, decay: 1.5 },
      { p: [11.8, 2.6, 2.8], colour: "#ffd2a0", day: 3, night: 9, distance: 6, decay: 1.6 },
      { p: [11.6, 2.6, 7.6], colour: "#ffe7c4", day: 2, night: 6, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#e8d2b4", "#f3eadc"], night: ["#231d1a", "#4a3a2c"] },
  base: { side: "#715242", top: "#d8c3a4", margin: 0.45 },
  npcs: [
    { id: "sales", name: "Sales assistant", x: 8.0, z: 8.6, rot: Math.PI, pose: "stand", shirt: "#715242", skin: "#e8c3a0", hair: "#3a2a22" },
    { id: "shopper-a", name: "Shopper", x: 6.6, z: 4.4, rot: Math.PI, pose: "stand", shirt: "#47718d", skin: "#c99572", hair: "#1e1a1a" },
    { id: "tester", name: "Sofa tester", x: 2.6, z: 2.15, rot: 0, pose: "sit", seat: 0.46, shirt: "#6e956f", skin: "#efd0b0", hair: "#8a5a2a" },
    { id: "shopper-b", name: "Shopper", x: 12.7, z: 5.0, rot: Math.PI, pose: "stand", shirt: "#ab5d4f", skin: "#d9b48f", hair: "#5a3a22" },
  ],
};

/* ------------------------------------------------------------------ Town Bank */
export const BANK: HomePlan = {
  tier: 23, kind: "bank", name: "Town Bank",
  size: { w: 14, d: 10, h: 3.8 },
  floors: [
    { zone: "floor", rect: R(0, 3.4, 10.2, 10), kind: "marble", colour: "#f1ece2" },
    { zone: "floor", rect: R(0, 0, 10.2, 3.4), kind: "carpet", colour: "#4f7a6d" },
    { zone: "back", rect: R(10.2, 0, 14, 10), kind: "marble", colour: "#d9d2c4" },
  ],
  walls: [
    ...shell(14, 10, 3.8, "#e7e2d6", "panel", "#2f5e55", {
      front: [win(0.8, 3.4, 1.0, 2.9), door(4.6, 6.2, 2.6), win(7.0, 9.6, 1.0, 2.9)],
      left: [win(5.0, 7.4, 1.2, 2.9)],
    }, "#2f5e55"),
    part("vault-wing", [10.2, 0], [10.2, 10], 3.8, [-1, 0], "#d6d2c6", [arch(6.2, 7.8, 2.6)], "panel", "#2f5e55"),
  ],
  slots: [
    vslot("teller", 4.6, 3.85, 0, "floor", [3.6, 0.9], "Bank teller", "BANK", 2.6),
    vslot("loans", 8.4, 6.2, 0, "floor", [1.8, 1.3], "Property management", "HOMES", 1.9),
    vslot("atm", 0.5, 8.4, Math.PI / 2, "floor", [0.9, 0.7], "Cash machine", "ATM", 2.1),
    vslot("vault", 12.1, 0.75, 0, "back", [2.4, 1.0], "Bank vault", "VAULT", 2.7),
  ],
  focus: { all: R(0, 0, 14, 10), floor: R(0, 0, 10.2, 10), back: R(10.2, 0, 14, 10) },
  rooms: [
    { zone: "floor", name: "Banking hall", rect: R(0, 3.4, 10.2, 10) },
    { zone: "back", name: "Vault", rect: R(10.2, 0, 14, 10) },
  ],
  doors: [{ a: [4.6, 10], b: [6.2, 10] }, { a: [10.2, 6.2], b: [10.2, 7.8] }],
  spawn: { entry: [5.4, 9.4], zones: { floor: [5.4, 7.6], back: [12.0, 7.0] } },
  colliders: [
    R(0.1, 3.4, 2.8, 4.0), R(6.4, 3.4, 10.1, 4.0), // counter line either side of the teller windows
    R(2.75, 6.35, 3.25, 6.85), R(6.35, 6.35, 6.85, 6.85), // columns
    R(1.5, 8.2, 2.6, 8.9), // paying-in desk
    R(13.35, 1.7, 13.9, 5.8), // safe deposit boxes
    R(10.9, 3.0, 11.8, 3.7), // cash trolley
    R(11.0, 8.5, 13.0, 9.1), // vault waiting bench
    R(0.15, 0.2, 9.9, 0.7), // staff desks against the back wall (behind the counter)
  ],
  lights: {
    hemi: ["#eef2ea", "#3a4a44"], hemiBase: 0.8, hemiDay: 0.45, sunBase: 0.35, sunDay: 1.5, sunTint: ["#fff4df", "#efb88c"],
    points: [
      { p: [3.0, 3.3, 6.0], colour: "#fff3dd", day: 5, night: 12, distance: 8, decay: 1.5 },
      { p: [7.4, 3.3, 6.0], colour: "#fff3dd", day: 5, night: 12, distance: 8, decay: 1.5 },
      { p: [5.0, 3.0, 1.6], colour: "#e6f2ea", day: 3, night: 7, distance: 6, decay: 1.6 },
      { p: [12.1, 3.0, 3.0], colour: "#ffe2a8", day: 3, night: 9, distance: 6, decay: 1.6 },
    ],
  },
  sky: { day: ["#c7d8cf", "#eef0e8"], night: ["#1b2622", "#33504a"] },
  base: { side: "#2f5e55", top: "#e3ddd0", margin: 0.5 },
  npcs: [
    { id: "teller-a", name: "Teller", x: 3.7, z: 2.9, rot: 0, pose: "stand", shirt: "#2f5e55", skin: "#e8c3a0", hair: "#3a2a22" },
    { id: "teller-b", name: "Teller", x: 5.6, z: 2.9, rot: 0, pose: "stand", shirt: "#2f5e55", skin: "#8d5a3b", hair: "#1e1a1a" },
    { id: "guard", name: "Security guard", x: 7.6, z: 9.1, rot: Math.PI, pose: "stand", shirt: "#2a2f36", skin: "#c99a74", hair: "#1e1a1a" },
    { id: "customer", name: "Customer", x: 4.6, z: 5.0, rot: Math.PI, pose: "stand", shirt: "#b55a51", skin: "#efd0b0", hair: "#8a5a2a" },
    { id: "vault-manager", name: "Vault manager", x: 12.6, z: 2.1, rot: 0, pose: "stand", shirt: "#3a4252", skin: "#d9b48f", hair: "#bdbdbd" },
  ],
};

/* ------------------------------------------------------------------ Stick U */
export const SCHOOL: HomePlan = {
  tier: 24, kind: "school", name: "Stick University",
  size: { w: 14, d: 10, h: 3.5 },
  floors: [
    { zone: "floor", rect: R(0, 0, 7.6, 6.6), kind: "parquet", colour: "#d7aa7a" },
    { zone: "floor", rect: R(0, 6.6, 14, 10), kind: "pattern", colour: "#e6dcc8" },
    { zone: "back", rect: R(7.6, 0, 14, 6.6), kind: "carpet", colour: "#7d8fa8" },
  ],
  walls: [
    ...shell(14, 10, 3.5, "#ece3cf", "panel", "#4d6557", {
      back: [win(1.0, 2.6, 1.3, 2.9), win(3.4, 5.0, 1.3, 2.9), win(9.0, 10.6, 1.3, 2.9), win(11.4, 13.0, 1.3, 2.9)],
      front: [win(0.8, 3.6, 1.0, 2.8), door(6.3, 7.7, 2.5), win(10.4, 13.2, 1.0, 2.8)],
      left: [win(3.0, 5.5, 1.3, 2.9)],
      right: [win(2.0, 4.5, 1.3, 2.9)],
    }, "#4d6557", { left: "#e3d6bb" }),
    part("lecture-west", [7.6, 0], [7.6, 6.6], 3.5, [-1, 0], "#e0d6c0", [], "panel", "#4d6557"),
    part("lecture-front", [7.6, 6.6], [14, 6.6], 3.5, [0, 1], "#e0d6c0", [door(1.0, 2.0, 2.2), win(3.0, 5.6, 1.1, 2.3)], "panel", "#4d6557", "#6b3a2b"),
  ],
  slots: [
    vslot("library", 3.0, 2.4, 0, "floor", [3.0, 1.6], "Library shelves", "STUDY", 2.0),
    vslot("classroom", 10.8, 1.5, 0, "back", [2.0, 0.8], "Classroom", "LEARN", 2.3),
    vslot("admissions", 10.6, 8.3, 0, "floor", [2.4, 0.9], "Admissions desk", "JOIN", 1.9),
  ],
  focus: { all: R(0, 0, 14, 10), floor: R(0, 0, 7.6, 10), back: R(7.6, 0, 14, 6.6) },
  rooms: [
    { zone: "floor", name: "Library", rect: R(0, 0, 7.6, 6.6) },
    { zone: "floor", name: "Entrance hall", rect: R(0, 6.6, 14, 10) },
    { zone: "back", name: "Lecture room", rect: R(7.6, 0, 14, 6.6) },
  ],
  doors: [{ a: [6.3, 10], b: [7.7, 10] }, { a: [8.6, 6.6], b: [9.6, 6.6] }],
  spawn: { entry: [7.0, 9.4], zones: { floor: [5.0, 7.8], back: [10.9, 5.9] } },
  colliders: [
    R(0.15, 0.15, 7.4, 0.55), // library shelving under the windows
    R(0.15, 0.6, 0.55, 6.2), // tall shelves on the left wall
    R(2.0, 4.2, 5.2, 5.2), // reading table
    R(6.2, 1.0, 6.8, 1.6), // globe
    R(8.3, 2.8, 10.4, 3.3), R(11.2, 2.8, 13.5, 3.3), // student desks, three rows with a centre aisle
    R(8.3, 4.0, 10.4, 4.5), R(11.2, 4.0, 13.5, 4.5),
    R(8.3, 5.2, 10.4, 5.7), R(11.2, 5.2, 13.5, 5.7),
    R(0.2, 7.2, 0.7, 9.4), // trophy cabinet
    R(2.8, 9.3, 5.0, 9.85), // hall bench
  ],
  lights: {
    hemi: ["#f0e6d2", "#3f4a40"], hemiBase: 0.8, hemiDay: 0.45, sunBase: 0.4, sunDay: 1.4, sunTint: ["#fff4df", "#efb88c"],
    points: [
      { p: [3.0, 3.0, 3.0], colour: "#ffe2b0", day: 4, night: 10, distance: 7, decay: 1.5 },
      { p: [7.0, 3.1, 8.3], colour: "#fff4e2", day: 4, night: 9, distance: 7, decay: 1.5 },
      { p: [10.8, 3.1, 2.4], colour: "#eef4ff", day: 4, night: 9, distance: 6, decay: 1.6 },
      { p: [10.8, 3.1, 5.0], colour: "#eef4ff", day: 3, night: 7, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#cbd9c6", "#efe9da"], night: ["#1c241f", "#3d4d40"] },
  base: { side: "#4d6557", top: "#ddd3bb", margin: 0.5 },
  npcs: [
    { id: "librarian", name: "Librarian", x: 1.3, z: 3.4, rot: Math.PI / 2, pose: "stand", shirt: "#7a5a42", skin: "#e8c3a0", hair: "#bdbdbd" },
    { id: "lecturer", name: "Lecturer", x: 10.8, z: 0.75, rot: 0, pose: "stand", shirt: "#4d6557", skin: "#c99572", hair: "#1e1a1a" },
    { id: "student-a", name: "Student", x: 9.2, z: 3.55, rot: Math.PI, pose: "sit", seat: 0.45, shirt: "#5c6e98", skin: "#efd0b0", hair: "#5a3a22" },
    { id: "student-b", name: "Student", x: 12.3, z: 4.75, rot: Math.PI, pose: "sit", seat: 0.45, shirt: "#b55a51", skin: "#8d5a3b", hair: "#1e1a1a" },
    { id: "registrar", name: "Registrar", x: 10.6, z: 9.25, rot: Math.PI, pose: "stand", shirt: "#3a4252", skin: "#d9b48f", hair: "#8a5a2a" },
  ],
};

/* ------------------------------------------------------------------ MegaCorp office */
export const WORK: HomePlan = {
  tier: 25, kind: "work", name: "MegaCorp Office",
  size: { w: 15, d: 10, h: 3.3 },
  floors: [
    { zone: "floor", rect: R(0, 0, 10.6, 10), kind: "carpet", colour: "#8a9aa5" },
    { zone: "floor", rect: R(0, 7.4, 6.4, 10), kind: "tile", colour: "#e1e5e8" },
    { zone: "floor", rect: R(10.6, 5, 15, 10), kind: "laminate", colour: "#d8c9b3" },
    { zone: "back", rect: R(10.6, 0, 15, 5), kind: "parquet", colour: "#b98a5c" },
  ],
  walls: [
    ...shell(15, 10, 3.3, "#dfe6ea", "plain", "#2f4f66", {
      back: [win(1.0, 4.2, 1.0, 2.7), win(5.2, 8.4, 1.0, 2.7), win(11.2, 14.2, 1.0, 2.7)],
      front: [door(2.6, 4.2, 2.4), win(5.4, 9.0, 1.0, 2.7), win(10.4, 14.0, 1.0, 2.7)],
      left: [win(3.0, 6.0, 1.0, 2.7)],
      right: [win(6.0, 8.8, 1.0, 2.7)],
    }, "#2f4f66", { left: "#2f4f66" }),
    part("office-west", [10.6, 0], [10.6, 5], 3.3, [-1, 0], "#cfd9df", [win(0.4, 4.6, 0.25, 2.8)], "plain", "#2f4f66"),
    part("office-front", [10.6, 5], [15, 5], 3.3, [0, 1], "#cfd9df", [door(0.5, 1.5, 2.2), win(1.9, 4.1, 0.25, 2.8)], "plain", "#2f4f66", "#2f4f66"),
  ],
  slots: [
    vslot("workstation", 4.2, 3.0, 0, "floor", [3.0, 1.8], "Workstation", "WORK", 1.8),
    vslot("vacancies", 0.4, 5.2, Math.PI / 2, "floor", [1.4, 0.3], "Vacancies board", "APPLY", 2.3),
    vslot("manager", 12.8, 2.0, 0, "back", [2.2, 1.0], "Manager desk", "PROMOTE", 1.8),
  ],
  focus: { all: R(0, 0, 15, 10), floor: R(0, 0, 10.6, 10), back: R(10.6, 0, 15, 5) },
  rooms: [
    { zone: "floor", name: "Open-plan office", rect: R(0, 0, 10.6, 10) },
    { zone: "floor", name: "Break area", rect: R(10.6, 5, 15, 10) },
    { zone: "back", name: "Manager's office", rect: R(10.6, 0, 15, 5) },
  ],
  doors: [{ a: [2.6, 10], b: [4.2, 10] }, { a: [11.1, 5], b: [12.1, 5] }],
  spawn: { entry: [3.4, 9.4], zones: { floor: [5.4, 6.4], back: [11.9, 3.6] } },
  colliders: [
    R(6.6, 2.1, 9.6, 3.9), // second desk pod
    R(0.3, 7.7, 2.2, 8.4), // reception desk
    R(5.0, 9.2, 6.8, 9.85), // waiting sofa
    R(9.8, 6.2, 10.4, 6.8), // printer
    R(0.15, 0.8, 0.6, 3.0), // filing cabinets
    R(12.0, 6.6, 14.2, 8.0), // meeting table
    R(14.3, 5.4, 14.9, 8.6), // kitchenette
    R(10.8, 9.2, 11.3, 9.75), // water cooler
    R(14.3, 0.6, 14.85, 4.4), // manager's bookcase
    R(13.1, 3.3, 14.1, 4.3), // coffee table and armchairs
  ],
  lights: {
    hemi: ["#e8eef3", "#3a4652"], hemiBase: 0.85, hemiDay: 0.45, sunBase: 0.4, sunDay: 1.4, sunTint: ["#f2f6ff", "#efc8a0"],
    points: [
      { p: [3.0, 3.0, 3.0], colour: "#eef4ff", day: 4, night: 10, distance: 7, decay: 1.5 },
      { p: [8.0, 3.0, 3.0], colour: "#eef4ff", day: 4, night: 10, distance: 7, decay: 1.5 },
      { p: [4.0, 3.0, 7.6], colour: "#f6f8ff", day: 3, night: 8, distance: 6, decay: 1.6 },
      { p: [12.8, 2.9, 2.2], colour: "#ffe9c8", day: 3, night: 8, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#b7c9d6", "#e8eef2"], night: ["#141c26", "#2c3e52"] },
  base: { side: "#2f4f66", top: "#c9d3d9", margin: 0.5 },
  npcs: [
    { id: "worker-a", name: "Office worker", x: 3.5, z: 2.35, rot: 0, pose: "sit", seat: 0.48, shirt: "#5c6e98", skin: "#efd0b0", hair: "#5a3a22" },
    { id: "worker-b", name: "Office worker", x: 7.9, z: 3.65, rot: Math.PI, pose: "sit", seat: 0.48, shirt: "#e9eef2", skin: "#8d5a3b", hair: "#1e1a1a" },
    { id: "receptionist", name: "Receptionist", x: 1.25, z: 7.25, rot: 0, pose: "stand", shirt: "#2f4f66", skin: "#e8c3a0", hair: "#3a2a22" },
    { id: "manager", name: "Manager", x: 13.6, z: 0.75, rot: Math.PI, pose: "stand", shirt: "#2a2f36", skin: "#d9b48f", hair: "#bdbdbd" },
    { id: "coffee", name: "Office worker", x: 13.75, z: 6.4, rot: Math.PI / 2, pose: "stand", shirt: "#ab5d4f", skin: "#c99572", hair: "#1e1a1a" },
  ],
};

/* ------------------------------------------------------------------ Construction Yard */
export const YARD: HomePlan = {
  tier: 26, kind: "yard", name: "Construction Yard",
  size: { w: 15, d: 10, h: 4.2 },
  floors: [
    { zone: "floor", rect: R(0, 0, 15, 10), kind: "concrete", colour: "#bdb8ad" },
    { zone: "back", rect: R(11, 0, 15, 4.6), kind: "boards", colour: "#9a8a72" },
  ],
  walls: [
    ...shell(15, 10, 4.2, "#b9b3a6", "block", "#d6a02e", {
      back: [win(2.0, 5.0, 2.9, 3.8), win(7.0, 10.0, 2.9, 3.8)],
      front: [arch(5.0, 9.0, 3.4), win(10.4, 13.6, 2.6, 3.6)],
      left: [win(3.0, 6.0, 2.6, 3.6)],
    }, undefined, { left: "#a8604e", leftStyle: "brick" }),
    part("cabin-west", [11, 0], [11, 4.6], 2.6, [-1, 0], "#e3e0d6", [win(1.2, 3.0, 1.0, 1.9)], "panel", "#d6a02e"),
    part("cabin-front", [11, 4.6], [15, 4.6], 2.6, [0, 1], "#e3e0d6", [door(0.8, 1.8, 2.1), win(2.4, 3.6, 1.0, 1.9)], "panel", "#d6a02e", "#5b6a73"),
  ],
  slots: [
    vslot("site", 3.6, 2.6, 0, "floor", [3.0, 1.6], "Work site", "WORK", 2.1),
    vslot("trades-board", 8.4, 0.35, 0, "floor", [1.8, 0.3], "Trades board", "JOBS", 2.5),
    vslot("foreman", 13.2, 1.6, 0, "back", [2.0, 0.9], "Foreman's cabin", "BOSS", 1.9),
  ],
  focus: { all: R(0, 0, 15, 10), floor: R(0, 0, 11, 10), back: R(11, 0, 15, 4.6) },
  rooms: [
    { zone: "floor", name: "Yard shed", rect: R(0, 0, 11, 10) },
    { zone: "floor", name: "Loading bay", rect: R(11, 4.6, 15, 10) },
    { zone: "back", name: "Foreman's cabin", rect: R(11, 0, 15, 4.6) },
  ],
  doors: [{ a: [5.0, 10], b: [9.0, 10] }, { a: [11.8, 4.6], b: [12.8, 4.6] }],
  spawn: { entry: [7.0, 9.4], zones: { floor: [7.0, 7.9], back: [13.0, 3.5] } },
  colliders: [
    R(0.3, 5.2, 2.3, 6.6), // brick pallets
    R(0.2, 7.2, 3.4, 8.0), // timber stack
    R(5.8, 4.6, 7.4, 6.0), // sand pile
    R(0.15, 0.4, 0.6, 4.4), // scaffold pole rack
    R(8.6, 5.8, 10.2, 7.6), // forklift
    R(13.6, 8.6, 14.8, 9.8), // oil drums
    R(11.4, 6.2, 14.6, 6.9), // steel beams
    R(13.8, 7.2, 14.8, 8.0), // generator
    R(11.2, 0.2, 12.0, 0.9), // cabin filing cabinet
  ],
  lights: {
    hemi: ["#ece4d2", "#4a453c"], hemiBase: 0.8, hemiDay: 0.5, sunBase: 0.45, sunDay: 1.6, sunTint: ["#fff1d6", "#ffc98e"],
    points: [
      { p: [4.0, 3.8, 4.0], colour: "#fff1d6", day: 5, night: 13, distance: 9, decay: 1.5 },
      { p: [9.5, 3.8, 4.0], colour: "#fff1d6", day: 5, night: 13, distance: 9, decay: 1.5 },
      { p: [13.0, 2.4, 2.2], colour: "#f2f6ff", day: 3, night: 7, distance: 5, decay: 1.6 },
      { p: [7.0, 3.6, 8.2], colour: "#ffe2b8", day: 3, night: 8, distance: 7, decay: 1.6 },
    ],
  },
  sky: { day: ["#c6c0b0", "#ece6d6"], night: ["#1d1c1a", "#3d3a32"] },
  base: { side: "#5b564c", top: "#a8a397", margin: 0.5 },
  npcs: [
    { id: "builder", name: "Builder", x: 4.0, z: 4.0, rot: Math.PI, pose: "stand", shirt: "#e1a53a", skin: "#dbb089", hair: "#3a2a22" },
    { id: "driver", name: "Forklift driver", x: 9.4, z: 6.55, rot: 0, pose: "sit", seat: 0.75, shirt: "#394043", skin: "#c99572", hair: "#1e1a1a" },
    { id: "foreman", name: "Foreman", x: 13.2, z: 0.65, rot: 0, pose: "stand", shirt: "#303137", skin: "#e1ae83", hair: "#8a5a2a" },
    { id: "labourer", name: "Labourer", x: 6.4, z: 3.3, rot: Math.PI / 2, pose: "stand", shirt: "#e1a53a", skin: "#8d5a3b", hair: "#1e1a1a" },
  ],
};

/* ------------------------------------------------------------------ Patch Up Clinic */
export const CLINIC: HomePlan = {
  tier: 27, kind: "clinic", name: "Patch Up Clinic",
  size: { w: 13, d: 9, h: 3.1 },
  floors: [
    { zone: "floor", rect: R(0, 0, 7.6, 9), kind: "tile", colour: "#d6e7e1" },
    { zone: "back", rect: R(7.6, 0, 13, 9), kind: "tile", colour: "#eaf1f3" },
  ],
  walls: [
    ...shell(13, 9, 3.1, "#eef4f1", "plain", "#4f9a87", {
      back: [win(1.0, 3.0, 1.1, 2.3), win(9.2, 11.2, 1.1, 2.3)],
      front: [win(0.6, 3.2, 1.0, 2.4), door(4.2, 5.6, 2.3), win(8.4, 12.4, 1.1, 2.3)],
      left: [win(3.0, 5.0, 1.1, 2.3)],
    }, "#4f9a87"),
    part("treatment", [7.6, 0], [7.6, 9], 3.1, [-1, 0], "#e3ece8", [door(5.4, 6.4, 2.15)], "plain", "#4f9a87", "#d7e6e1"),
  ],
  slots: [
    vslot("cabinet", 3.4, 1.2, 0, "floor", [2.8, 0.8], "Medical cabinet", "SUPPLY", 2.2),
    vslot("treatment-bed", 10.6, 2.6, 0, "back", [1.3, 2.3], "Treatment bed", "HEAL", 1.6),
  ],
  focus: { all: R(0, 0, 13, 9), floor: R(0, 0, 7.6, 9), back: R(7.6, 0, 13, 9) },
  rooms: [
    { zone: "floor", name: "Waiting room", rect: R(0, 0, 7.6, 9) },
    { zone: "back", name: "Treatment room", rect: R(7.6, 0, 13, 9) },
  ],
  doors: [{ a: [4.2, 9], b: [5.6, 9] }, { a: [7.6, 5.4], b: [7.6, 6.4] }],
  spawn: { entry: [4.9, 8.4], zones: { floor: [4.9, 6.9], back: [10.2, 6.0] } },
  colliders: [
    R(0.4, 5.4, 2.6, 6.2), // reception desk
    R(3.6, 3.8, 6.8, 4.4), // row of waiting chairs
    R(0.3, 8.3, 3.6, 8.85), // chairs under the front window
    R(6.9, 0.3, 7.4, 0.8), // water cooler
    R(1.6, 0.15, 5.2, 0.45), // dispensary shelving
    R(11.85, 1.45, 12.95, 3.75), // second bay bed
    R(8.0, 1.0, 8.6, 1.6), // medical cart
    R(9.0, 8.4, 11.0, 8.9), // sink unit
    R(12.4, 5.0, 12.9, 7.6), // supply cabinets
  ],
  lights: {
    hemi: ["#eef8f5", "#3e5550"], hemiBase: 0.9, hemiDay: 0.45, sunBase: 0.4, sunDay: 1.4, sunTint: ["#f4fbff", "#efc8a0"],
    points: [
      { p: [3.5, 2.8, 3.5], colour: "#f4fbff", day: 4, night: 10, distance: 7, decay: 1.5 },
      { p: [3.5, 2.8, 7.0], colour: "#fff4e6", day: 3, night: 8, distance: 6, decay: 1.5 },
      { p: [10.4, 2.8, 2.8], colour: "#eef8ff", day: 5, night: 11, distance: 6, decay: 1.5 },
      { p: [10.4, 2.8, 6.8], colour: "#eef8ff", day: 3, night: 7, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#cfe6de", "#f0f6f4"], night: ["#17231f", "#2f4a43"] },
  base: { side: "#4f9a87", top: "#dfece7", margin: 0.45 },
  npcs: [
    { id: "receptionist", name: "Receptionist", x: 1.5, z: 4.95, rot: 0, pose: "stand", shirt: "#4f9a87", skin: "#efd0b0", hair: "#3a2a22" },
    { id: "pharmacist", name: "Pharmacist", x: 3.4, z: 0.6, rot: 0, pose: "stand", shirt: "#f4f1ea", skin: "#c99572", hair: "#1e1a1a" },
    { id: "nurse", name: "Nurse", x: 9.4, z: 4.6, rot: Math.PI / 2, pose: "stand", shirt: "#5c8fc0", skin: "#e8c3a0", hair: "#8a5a2a" },
    { id: "patient-a", name: "Patient", x: 4.3, z: 4.15, rot: 0, pose: "sit", seat: 0.45, shirt: "#b55a51", skin: "#d9b48f", hair: "#5a3a22" },
    { id: "patient-b", name: "Patient", x: 12.4, z: 3.0, rot: -Math.PI / 2, pose: "sit", seat: 0.62, shirt: "#9fb4c8", skin: "#8d5a3b", hair: "#1e1a1a" },
  ],
};

/* ------------------------------------------------------------------ Town Transit */
export const DEPOT: HomePlan = {
  tier: 28, kind: "depot", name: "Town Transit",
  size: { w: 15, d: 9.5, h: 4.2 },
  floors: [
    { zone: "floor", rect: R(0, 3.8, 11.6, 9.5), kind: "tile", colour: "#d4d8d6" },
    { zone: "back", rect: R(0, 0, 15, 3.8), kind: "concrete", colour: "#8d9196" },
    { zone: "floor", rect: R(11.6, 3.8, 15, 9.5), kind: "laminate", colour: "#c9b79c" },
  ],
  walls: [
    ...shell(15, 9.5, 4.2, "#dfe7ea", "panel", "#2f6f86", {
      back: [arch(4.0, 11.0, 3.4)],
      front: [win(0.6, 3.4, 1.0, 2.9), door(5.0, 6.6, 2.6), win(7.2, 10.6, 1.0, 2.9)],
      left: [win(5.0, 7.8, 1.0, 2.8)],
    }, "#2f6f86"),
    part("bay-glass", [0, 3.8], [15, 3.8], 4.2, [0, 1], "#cfdde2", [win(0.6, 6.2, 0.25, 3.2), door(6.6, 8.0, 2.4), win(8.4, 14.4, 0.25, 3.2)], "plain", "#2f6f86", "#2f6f86"),
    part("ticket-office", [11.6, 3.8], [11.6, 9.5], 3.0, [-1, 0], "#2f6f86", [win(1.2, 3.0, 0.95, 1.9)], "panel", "#e8c25a"),
  ],
  slots: [
    vslot("departures", 3.6, 5.0, 0, "floor", [2.4, 0.5], "Departures board", "TIMES", 2.9),
    vslot("ticket-hatch", 11.15, 5.9, -Math.PI / 2, "floor", [1.8, 0.8], "Ticket hatch", "JOBS", 2.1),
  ],
  focus: { all: R(0, 0, 15, 9.5), floor: R(0, 3.8, 11.6, 9.5), back: R(0, 0, 15, 3.8) },
  rooms: [
    { zone: "floor", name: "Concourse", rect: R(0, 3.8, 11.6, 9.5) },
    { zone: "back", name: "Bus bays", rect: R(0, 0, 15, 3.8) },
  ],
  doors: [{ a: [5.0, 9.5], b: [6.6, 9.5] }, { a: [6.6, 3.8], b: [8.0, 3.8] }],
  spawn: { entry: [5.8, 8.9], zones: { floor: [5.8, 6.4], back: [12.6, 3.2] } },
  colliders: [
    R(1.0, 7.0, 4.6, 7.6), R(7.2, 6.6, 10.2, 7.2), // waiting seats
    R(0.15, 4.4, 0.75, 5.8), // vending machines
    R(8.4, 4.1, 9.6, 4.6), // ticket machines
    R(1.4, 0.5, 10.6, 2.9), // the bus
    R(12.0, 0.4, 12.4, 0.8), R(13.6, 0.4, 14.0, 0.8), // bollards
  ],
  lights: {
    hemi: ["#e6eef2", "#3a4650"], hemiBase: 0.85, hemiDay: 0.5, sunBase: 0.45, sunDay: 1.5, sunTint: ["#f2f6ff", "#efc8a0"],
    points: [
      { p: [3.0, 3.6, 6.6], colour: "#f2f6ff", day: 4, night: 11, distance: 8, decay: 1.5 },
      { p: [8.5, 3.6, 6.6], colour: "#f2f6ff", day: 4, night: 11, distance: 8, decay: 1.5 },
      { p: [7.5, 3.8, 1.8], colour: "#ffd9a0", day: 3, night: 10, distance: 9, decay: 1.5 },
      { p: [13.3, 2.6, 6.6], colour: "#fff1d8", day: 2, night: 6, distance: 5, decay: 1.6 },
    ],
  },
  sky: { day: ["#bfd3dc", "#ecf2f4"], night: ["#121c24", "#2a4250"] },
  base: { side: "#2f6f86", top: "#c7cdd0", margin: 0.5 },
  npcs: [
    { id: "clerk", name: "Ticket clerk", x: 12.4, z: 5.9, rot: -Math.PI / 2, pose: "stand", shirt: "#2f6f86", skin: "#e8c3a0", hair: "#3a2a22" },
    { id: "traveller-a", name: "Traveller", x: 2.0, z: 7.25, rot: Math.PI, pose: "sit", seat: 0.45, shirt: "#ab5d4f", skin: "#efd0b0", hair: "#8a5a2a" },
    { id: "traveller-b", name: "Traveller", x: 8.6, z: 6.85, rot: Math.PI, pose: "sit", seat: 0.45, shirt: "#6e956f", skin: "#8d5a3b", hair: "#1e1a1a" },
    { id: "driver", name: "Bus driver", x: 11.6, z: 2.0, rot: -Math.PI / 2, pose: "stand", shirt: "#2f6f86", skin: "#c99572", hair: "#bdbdbd" },
    { id: "watcher", name: "Traveller", x: 3.6, z: 6.0, rot: Math.PI, pose: "stand", shirt: "#5c6e98", skin: "#d9b48f", hair: "#5a3a22" },
  ],
};

/* ------------------------------------------------------------------ Oddities Pawn */
export const PAWN: HomePlan = {
  tier: 13, kind: "pawn", name: "Oddities Pawn",
  size: { w: 12, d: 9, h: 3.2 },
  floors: [
    { zone: "floor", rect: R(0, 2.8, 12, 9), kind: "boards", colour: "#9a7a58" },
    { zone: "back", rect: R(0, 0, 12, 2.8), kind: "concrete", colour: "#9a958a" },
  ],
  walls: [
    ...shell(12, 9, 3.2, "#7d6a54", "panel", "#3a2f27", {
      front: [win(0.8, 3.6, 1.0, 2.4), door(5.2, 6.6, 2.3), win(8.2, 11.2, 1.0, 2.4)],
      right: [win(4.0, 5.6, 1.3, 2.3)],
    }, "#3a2f27", { left: "#6f5d4a" }),
    part("back-room", [0, 2.8], [12, 2.8], 3.2, [0, 1], "#6f5d4a", [door(0.6, 1.6, 2.15)], "panel", "#3a2f27", "#4a3a2c"),
  ],
  slots: [
    vslot("pawn-counter", 6.4, 4.0, 0, "floor", [4.1, 1.0], "Pawn counter", "SELL", 1.7),
    vslot("curiosities", 10.6, 6.2, 0, "floor", [1.5, 2.4], "Curiosity cabinet", "LOOK", 1.9),
  ],
  focus: { all: R(0, 0, 12, 9), floor: R(0, 2.8, 12, 9), back: R(0, 0, 12, 2.8) },
  rooms: [
    { zone: "floor", name: "Shop floor", rect: R(0, 2.8, 12, 9) },
    { zone: "back", name: "Back room", rect: R(0, 0, 12, 2.8) },
  ],
  doors: [{ a: [5.2, 9], b: [6.6, 9] }, { a: [0.6, 2.8], b: [1.6, 2.8] }],
  spawn: { entry: [5.9, 8.4], zones: { floor: [5.9, 6.8], back: [2.2, 1.7] } },
  colliders: [
    R(2.6, 3.5, 4.35, 4.1), R(8.45, 3.5, 9.4, 4.1), // jewellery cases either side of the counter
    R(2.4, 5.8, 4.2, 6.6), // centre display case
    R(0.15, 6.6, 0.9, 8.2), // stacked televisions
    R(11.3, 3.1, 11.85, 3.8), // suit of armour
    R(11.4, 7.6, 11.85, 8.8), // shelving by the window
    R(3.0, 0.15, 5.6, 0.8), // workbench
    R(10.6, 0.2, 11.6, 1.0), // safe
    R(7.0, 0.2, 8.4, 1.0), // boxed stock
  ],
  lights: {
    hemi: ["#b9a58a", "#33271f"], hemiBase: 0.7, hemiDay: 0.5, sunBase: 0.25, sunDay: 1.6, sunTint: ["#fff1d6", "#e7b47e"],
    points: [
      { p: [4.0, 2.8, 5.0], colour: "#ffcf88", day: 6, night: 12, distance: 7, decay: 1.5 },
      { p: [9.0, 2.8, 6.0], colour: "#ffd9a0", day: 5, night: 10, distance: 6, decay: 1.5 },
      { p: [5.0, 2.6, 1.4], colour: "#f0f0e0", day: 2, night: 5, distance: 5, decay: 1.6 },
      { p: [6.4, 2.2, 3.6], colour: "#ffe0a0", day: 2, night: 6, distance: 4, decay: 1.7 },
    ],
  },
  sky: { day: ["#a28b6b", "#dfcbb0"], night: ["#29231e", "#574531"] },
  base: { side: "#493a2c", top: "#82705a", margin: 0.45 },
  npcs: [
    { id: "pawn-broker", name: "The broker", x: 6.4, z: 3.1, rot: 0, pose: "stand", shirt: "#474137", skin: "#ac8469", hair: "#292322" },
    { id: "guitar-browser", name: "Customer", x: 1.4, z: 4.6, rot: -Math.PI / 2, pose: "stand", shirt: "#5c6e98", skin: "#efd0b0", hair: "#8a5a2a" },
    { id: "repairer", name: "Repairer", x: 4.3, z: 1.25, rot: Math.PI, pose: "stand", shirt: "#7a5a42", skin: "#c99572", hair: "#bdbdbd" },
  ],
};

/* ------------------------------------------------------------------ Town Police */
/** The front desk stays to the front-left and the wanted board to the back-right, as on the classic map. */
export const POLICE: HomePlan = {
  tier: 14, kind: "police", name: "Town Police",
  size: { w: 13, d: 9.5, h: 3.3 },
  floors: [
    { zone: "floor", rect: R(0, 5.0, 13, 9.5), kind: "tile", colour: "#b3c1cd" },
    { zone: "floor", rect: R(0, 0, 6.6, 5.0), kind: "carpet", colour: "#5d6d82" },
    { zone: "back", rect: R(6.6, 0, 13, 5.0), kind: "tile", colour: "#98a6b4" },
    { zone: "back", rect: R(11.0, 0, 13, 2.6), kind: "concrete", colour: "#a3a198" },
  ],
  walls: [
    ...shell(13, 9.5, 3.3, "#c9d2dc", "panel", "#2c4462", {
      back: [win(1.5, 3.5, 1.4, 2.6)],
      front: [win(0.6, 3.4, 1.1, 2.5), door(5.6, 7.0, 2.4), win(9.0, 12.2, 1.1, 2.5)],
      right: [win(6.0, 8.4, 1.2, 2.5)],
    }, "#2c4462"),
    part("squad-front", [6.6, 5.0], [13, 5.0], 3.3, [0, 1], "#b9c4cf", [door(1.4, 2.4, 2.2), win(3.2, 5.8, 1.1, 2.2)], "panel", "#2c4462", "#2c4462"),
    part("squad-west", [6.6, 0], [6.6, 5.0], 3.3, [-1, 0], "#b9c4cf", [], "panel", "#2c4462"),
  ],
  slots: [
    vslot("front-desk", 3.2, 5.6, 0, "floor", [4.2, 1.1], "Front desk", "FINE", 1.7),
    vslot("wanted", 9.6, 0.5, 0, "back", [1.7, 0.65], "Wanted board", "HEAT", 2.3),
  ],
  focus: { all: R(0, 0, 13, 9.5), floor: R(0, 5.0, 13, 9.5), back: R(6.6, 0, 13, 5.0) },
  rooms: [
    { zone: "floor", name: "Reception", rect: R(0, 5.0, 13, 9.5) },
    { zone: "back", name: "Squad room and cells", rect: R(6.6, 0, 13, 5.0) },
  ],
  doors: [{ a: [5.6, 9.5], b: [7.0, 9.5] }, { a: [8.0, 5.0], b: [9.0, 5.0] }],
  spawn: { entry: [6.3, 8.9], zones: { floor: [6.3, 7.2], back: [9.6, 3.6] } },
  colliders: [
    R(0.1, 5.0, 1.05, 5.6), R(5.35, 5.0, 6.6, 5.6), // security screens sealing the staff side of the desk
    R(0.3, 8.6, 3.4, 9.2), R(9.4, 8.6, 12.4, 9.2), // waiting benches
    R(12.3, 5.4, 12.8, 5.9), // water cooler
    R(6.8, 1.4, 8.2, 2.4), R(6.8, 3.2, 8.2, 4.2), // squad desks
    R(11.0, 0.1, 12.95, 2.65), // holding cell
    R(12.4, 3.0, 12.9, 4.8), // evidence lockers
  ],
  lights: {
    hemi: ["#cfdae5", "#354350"], hemiBase: 0.9, hemiDay: 0.45, sunBase: 0.35, sunDay: 1.45, sunTint: ["#f0f5ff", "#a7b9d5"],
    points: [
      { p: [3.2, 3.0, 6.8], colour: "#eef4ff", day: 5, night: 10, distance: 7, decay: 1.5 },
      { p: [9.8, 3.0, 7.2], colour: "#eef4ff", day: 4, night: 9, distance: 7, decay: 1.5 },
      { p: [9.6, 3.0, 2.4], colour: "#f0f4ff", day: 4, night: 9, distance: 6, decay: 1.6 },
      { p: [12.0, 2.6, 1.2], colour: "#c6d0ff", day: 1, night: 4, distance: 3.5, decay: 1.8 },
    ],
  },
  sky: { day: ["#afbdca", "#e1e9ee"], night: ["#202e3d", "#4a5b71"] },
  base: { side: "#38495c", top: "#91a0ae", margin: 0.45 },
  npcs: [
    { id: "desk-sergeant", name: "Desk sergeant", x: 3.2, z: 4.45, rot: 0, pose: "stand", shirt: "#273e58", skin: "#bd9173", hair: "#272832" },
    { id: "officer", name: "Officer", x: 7.5, z: 2.85, rot: Math.PI / 2, pose: "sit", seat: 0.48, shirt: "#273e58", skin: "#e8c3a0", hair: "#3a2a22" },
    { id: "detainee", name: "Detainee", x: 12.3, z: 1.2, rot: -Math.PI / 2, pose: "sit", seat: 0.45, shirt: "#e07a3a", skin: "#d9b48f", hair: "#5a3a22" },
    { id: "pcso", name: "PCSO", x: 10.6, z: 7.0, rot: Math.PI, pose: "stand", shirt: "#273e58", skin: "#8d5a3b", hair: "#1e1a1a" },
  ],
};

export const TOWN_VENUES = { shop: SHOP, diner: DINER, furniture: FURNITURE, bank: BANK, school: SCHOOL, work: WORK, yard: YARD, clinic: CLINIC, depot: DEPOT, pawn: PAWN, police: POLICE } as const;
export type TownVenueId = keyof typeof TOWN_VENUES;
export const TOWN_VENUE_IDS = Object.keys(TOWN_VENUES) as TownVenueId[];
export const isTownVenue = (id: string): id is TownVenueId => Object.prototype.hasOwnProperty.call(TOWN_VENUES, id);

