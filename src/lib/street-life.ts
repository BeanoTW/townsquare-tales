import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { RELATION_FIELDS, type ResidentId } from "@/lib/living-town";
import { findRoute, isWalkable, nearestWalkable, type Point, type Obstacle } from "@/lib/pathfinding";

export const STREET_OBJECTS = [
  { id: "bench", x: 8, y: 10.8, label: "Sit on bench · 30m · +8 energy", kind: "bench" },
  { id: "bin", x: 8, y: 11.7, label: "Search rubbish bin · 30m", kind: "bin" },
  { id: "vending", x: 11.4, y: 10.8, label: "Buy vending drink · $3 · +12 energy", kind: "vending" },
] as const;
export type StreetObjectId = typeof STREET_OBJECTS[number]["id"];
export function streetAction(id: StreetObjectId): ActionDef {
  return {
    id: `street-${id}`, label: STREET_OBJECTS.find(o => o.id === id)?.label ?? id,
    hours: id === "vending" ? 0 : 0.5, energy: 0, cost: id === "vending" ? 3 : 0,
    resolve: (s, rng) => {
      if (id === "bench") return { patch: { energy: Math.min(100, s.energy + 8) }, message: "A quiet sit. Even the pigeons judge you. +8 energy · 30m." };
      if (id === "vending") return s.money < 3 ? "Need $3 for a drink." : { patch: { money: s.money - 3, energy: Math.min(100, s.energy + 12) }, message: "Clunk. A suspiciously warm drink. +12 energy · -$3." };
      if (s.streetSearchDay === s.day) return "Already searched today. Still rubbish.";
      const roll = rng();
      if (roll < 0.25) return { patch: { streetSearchDay: s.day, money: s.money + 2 }, message: "Found $2. Financial independence, here we come." };
      if (roll < 0.45) return { patch: { streetSearchDay: s.day, snacks: Math.min(99, s.snacks + 1) }, message: "An unopened snack. Best not check the date." };
      if (roll < 0.6) return { patch: { streetSearchDay: s.day, energy: Math.max(0, s.energy - 3) }, message: "A furious cat objects to your research. -3 energy." };
      return { patch: { streetSearchDay: s.day }, message: "Just old receipts and someone else's broken dreams." };
    },
  };
}
export const SPEECH_SECONDS = 4.5;
export const SPEECH_COOLDOWN = 22;
export type ReactionContext = "passing" | "blocked" | "skating" | "idle";
export function residentBark(id: ResidentId, s: GameState, context: ReactionContext): string {
  if (context === "skating") return { mara: "Oi! Watch the board!", nox: "Try that again. I dare you.", gus: "Nearly spilled my bloody pint!", ivy: "Watch where you're going!" }[id];
  if (context === "blocked") return { mara: "Some of us have jobs. Move.", nox: "I'm not moving, mate.", gus: "Not a car park, is it?", ivy: "Sorry. Could I get past?" }[id];
  if (s.heat >= 30) return id === "nox" ? "Coppers about. Act normal." : id === "ivy" ? "Please don't involve me." : "You brought trouble with you.";
  if (id === "nox" && s.gangRep >= 20) return "You're with the crew. Alright.";
  if (s[RELATION_FIELDS[id]] <= -4) return id === "nox" ? "Keep moving, mate." : "Oh brilliant. You again.";
  if (s.karma <= -10 && id === "ivy") return "I've heard about you. Stay back.";
  if (s[RELATION_FIELDS[id]] >= 4) return { mara: "Alright, you. Surviving?", nox: "You didn't hear that from me.", gus: "Saved you a story, mate.", ivy: "Hey! Good to see you." }[id];
  if (s.cha >= 20 && id === "gus") return "You look like decent company.";
  if (id === "mara" && s.job >= 3) return "Nice job. Still queue like everyone.";
  if (id === "nox" && s.skateboard) return "Nice board. Keep an eye on it.";
  return { mara: s.hour < 10 ? "Need a bloody coffee..." : s.hour < 18 ? "Another day, another dollar." : "Off the clock. Don't ask.", nox: s.hour >= 18 ? "Keep moving, mate." : "That shopkeeper looks miserable.", gus: s.hour >= 18 ? "This pub used to be cheaper." : "MegaCorp's hiring. Poor sods.", ivy: s.hour < 18 ? "Three deadlines. No sleep." : "You call that music?" }[id];
}
export function yieldsToPlayer(id: ResidentId) { return id === "ivy" || id === "mara"; }

export type StreetActor = Point & { goal: Point; path: Point[]; walking: boolean; angle: number; pauseUntil: number; trip: number };
export function makeActor(p: Point, lots: Obstacle[]): StreetActor {
  const safe = nearestWalkable(p, lots);
  return { ...safe, goal: safe, path: [], walking: false, angle: 0, pauseUntil: 0, trip: 0 };
}
export function moveActor(a: StreetActor, goal: Point, lots: Obstacle[], dt: number, stopped = false) {
  const safe = nearestWalkable(goal, lots);
  if (a.goal.x !== safe.x || a.goal.y !== safe.y) { a.goal = safe; a.path = findRoute(a, safe, lots); }
  a.walking = false;
  const next = a.path[0];
  if (!next || stopped) return;
  const dx = next.x - a.x, dy = next.y - a.y, distance = Math.hypot(dx, dy);
  if (distance < 0.1) { a.path.shift(); return; }
  const step = Math.min(distance, dt * 0.8);
  const p = { x: a.x + dx / distance * step, y: a.y + dy / distance * step };
  if (!isWalkable(p, lots)) { a.path = []; return; }
  Object.assign(a, p, { walking: true, angle: Math.atan2(dx, -dy) * 180 / Math.PI });
}
export const LOCAL_STOPS: Record<ResidentId, Point[]> = {
  mara: [{x:16.5,y:11.65},{x:18,y:11.3}],
  nox: [{x:25.7,y:10.3},{x:26.4,y:6.8}],
  gus: [{x:4.7,y:21.5},{x:7.8,y:21.5}],
  ivy: [{x:11.4,y:6.5},{x:11.4,y:9.9}],
};
export function routineGoal(id: ResidentId, scheduled: Point, hour: number, trip: number): Point {
  if (trip % 3 === 0) return scheduled;
  if (id === "mara" && (hour < 10 || hour >= 18)) return trip % 2 ? {x:8,y:16.8} : scheduled;
  if (id === "gus" && hour < 18) return trip % 2 ? {x:8,y:10.8} : scheduled;
  if (id === "ivy" && hour >= 18) return trip % 2 ? {x:11.4,y:6.5} : scheduled;
  return LOCAL_STOPS[id][trip % 2] ?? scheduled;
}
export const AMBIENT_ROUTES = [
  {id:"worker",color:"var(--town-npc-blue)",morning:[{x:11.4,y:19.5},{x:11.4,y:24.6}],evening:[{x:11.4,y:24.6},{x:11.4,y:19.5}],line:"Another meeting. Kill me now."},
  {id:"shopper",color:"var(--town-npc-red)",morning:[{x:15.1,y:11.6},{x:21.8,y:11.6}],evening:[{x:4.7,y:21.5},{x:8.1,y:21.5}],line:"Only came out for milk."},
  {id:"foreman-helper",color:"var(--town-depot-sign)",morning:[{x:19,y:22.2},{x:21.8,y:24.7}],evening:[{x:7.8,y:21.5},{x:4.7,y:21.5}],line:"They call that a safety briefing?"},
  {id:"patrol",color:"var(--town-police-sign)",morning:[{x:25.5,y:18.7},{x:25.5,y:24}],evening:[{x:8.1,y:21.5},{x:11.4,y:25}],line:"Nothing to see here. Yet."},
] as const;
export function ambientVisible(id: string, hour: number) {
  if (id === "patrol") return hour >= 22 || hour < 6;
  if (id === "worker") return hour >= 6 && hour < 19;
  if (id === "shopper") return hour >= 8 && hour < 22;
  return hour >= 7 && hour < 23;
}
export const PIGEON_FLOCKS = [{x:8,y:11.2},{x:21.8,y:11.3},{x:7.8,y:21.5}];
export function pigeonOffset(distance: number, elapsed: number, index: number) {
  const scatter = distance < 1.5;
  const radius = scatter ? 1.2 : 0.15;
  return { x: Math.cos(elapsed * (scatter ? 2 : .3) + index * 2.1) * radius, y: Math.sin(elapsed * (scatter ? 2 : .3) + index * 2.1) * radius, scatter };
}