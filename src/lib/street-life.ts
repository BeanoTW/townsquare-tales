import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { RELATION_FIELDS, type ResidentId } from "@/lib/living-town";
import { findRoute, isWalkable, nearestWalkable, type Point, type Obstacle } from "@/lib/pathfinding";

export const STREET_OBJECTS = [
  { id: "bench", x: 8, y: 10.8, label: "Sit on bench · 30m · +8 energy", kind: "bench" },
  { id: "bin", x: 8, y: 11.7, label: "Search rubbish bin · 30m", kind: "bin" },
  { id: "newspaper", x:8.1, y:17.9, label:"Read the town paper · $2 · 15m · +1 intelligence", kind:"newspaper" },
  { id: "litter", x:21.6, y:15.2, label:"Kick litter · 1 energy", kind:"litter" },
  { id: "vending", x: 11.4, y: 10.8, label: "Buy vending drink · $3 · +12 energy", kind: "vending" },
] as const;
export type StreetObjectId = typeof STREET_OBJECTS[number]["id"];
export function streetAction(id: StreetObjectId): ActionDef {
  return {
    id: `street-${id}`, label: STREET_OBJECTS.find(o => o.id === id)?.label ?? id,
    hours: id === "vending" || id === "litter" ? 0 : id === "newspaper" ? .25 : .5, energy: id === "litter" ? 1 : 0, cost: id === "vending" ? 3 : id === "newspaper" ? 2 : 0,
    resolve: (s, rng) => {
      if (id === "litter") return {patch:{},message:"The receipt tumbles away. You've defeated a minor administrative threat. -1 energy."};
      if (id === "newspaper") {
        if(s.streetNewsDay===s.day) return "Read today's paper already. The town hasn't improved since.";
        if(s.money<2) return "Need $2 for the paper.";
        const rumours=["MegaCorp denies replacing staff with stationery. The stapler remains silent.","Gus reports a haunted pub stool. Sources describe him as 'Gus'.","Police advise against sealed parcels. Nox advises against advice."];
        return {patch:{money:s.money-2,int:s.int+1,streetNewsDay:s.day},message:`${rumours[s.day%rumours.length]} Intelligence +1 · cash -$2 · 15m.`};
      }
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
export function residentBark(id: ResidentId, s: GameState, context: ReactionContext, variation = 0): string {
  if (context === "blocked" || context === "skating") {
    const lines = REACTION_LINES[id][context];
    return lines[variation % lines.length] ?? lines[0]!;
  }
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
export type AmbientRoute = {id:string;color:string;morning:readonly [Point,Point];evening:readonly [Point,Point];line:string};
export const AMBIENT_ROUTES: readonly AmbientRoute[] = [
  {id:"worker",color:"var(--town-npc-blue)",morning:[{x:11.4,y:19.5},{x:11.4,y:24.6}],evening:[{x:11.4,y:24.6},{x:11.4,y:19.5}],line:"Another meeting. Kill me now."},
  {id:"shopper",color:"var(--town-npc-red)",morning:[{x:15.1,y:11.6},{x:21.8,y:11.6}],evening:[{x:4.7,y:21.5},{x:8.1,y:21.5}],line:"Only came out for milk."},
  {id:"foreman-helper",color:"var(--town-depot-sign)",morning:[{x:19,y:22.2},{x:21.8,y:24.7}],evening:[{x:7.8,y:21.5},{x:4.7,y:21.5}],line:"They call that a safety briefing?"},
  {id:"delivery",color:"var(--town-depot-sign)",morning:[{x:16.5,y:11.65},{x:21.8,y:11.6}],evening:[{x:16.5,y:11.65},{x:21.8,y:11.6}],line:"Signed for by 'Nobody'. Again."},
  {id:"coffee",color:"var(--town-npc-blue)",morning:[{x:8.5,y:16.8},{x:8,y:10.8}],evening:[{x:8.5,y:16.8},{x:8,y:10.8}],line:"Coffee first. Existential dread later."},
  {id:"park",color:"var(--town-npc-green)",morning:[{x:26.7,y:10.3},{x:26.7,y:8.5}],evening:[{x:26.7,y:10.3},{x:26.7,y:8.5}],line:"Nature. With suspicious pond foam."},
  {id:"casino",color:"var(--town-casino-sign)",morning:[{x:8.3,y:21.5},{x:6.6,y:21.4}],evening:[{x:8.3,y:21.5},{x:6.6,y:21.4}],line:"It's only a loss if I go home."},
  {id:"patrol",color:"var(--town-police-sign)",morning:[{x:25.5,y:18.7},{x:25.5,y:24}],evening:[{x:8.1,y:21.5},{x:11.4,y:25}],line:"Nothing to see here. Yet."},
] as const;
export function ambientVisible(id: string, hour: number) {
  if (id === "delivery") return hour >= 6 && hour < 12;
  if (id === "coffee") return hour >= 6 && hour < 11;
  if (id === "park") return hour >= 12 && hour < 18;
  if (id === "casino") return hour >= 18 || hour < 2;
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
/** Runtime encounters are edge-triggered, never a proximity tax. */
export type PhysicalReaction = "yield" | "refuse" | "dodge" | "complain";
export type EncounterMemory = {
  armed: boolean; cooldownUntil: number; activeUntil: number; recoveryUntil: number;
  blockedFor: number; sequence: number; kind: PhysicalReaction | null; target: Point | null;
};
export const newEncounterMemory = (): EncounterMemory => ({
  armed: true, cooldownUntil: 0, activeUntil: 0, recoveryUntil: 0,
  blockedFor: 0, sequence: 0, kind: null, target: null,
});
const REACTION_LINES = {
  mara: { blocked: ["Some of us have jobs. Move.", "My shift died. Let me bury it.", "Queue elsewhere. I'm off duty."], skating: ["Oi! Watch the board!", "My obituary won't say wheels.", "Customer service ends here."] },
  nox: { blocked: ["I'm not moving, mate.", "Find another pavement.", "You've picked a weird hill."], skating: ["Try that again. I dare you.", "Nice board. Shame about you.", "That better be your last lap."] },
  gus: { blocked: ["Not a car park, is it?", "My pint won't mourn itself.", "I've outlived shorter queues."], skating: ["Nearly spilled my bloody pint!", "Nearly met my late uncle.", "Heard quieter funeral carts."] },
  ivy: { blocked: ["Sorry. Could I get past?", "This isn't a group project.", "I'll cite you as an obstacle."], skating: ["Watch where you're going!", "Statistically, that was stupid.", "I haven't revised for death."] },
} as const;
export function updateEncounter(memory: EncounterMemory, actor: StreetActor, me: Point,
  velocity: Point, skating: boolean, personality: string, now: number, dt: number): ReactionContext | null {
  const dx = actor.x-me.x, dy = actor.y-me.y, distance = Math.hypot(dx,dy);
  if (distance > 2.1) { memory.armed = true; memory.blockedFor = 0; }
  if (now < memory.recoveryUntil || now < memory.cooldownUntil || !memory.armed) return null;
  const next = actor.path[0];
  const onRoute = next && distance < .85 &&
    (me.x-actor.x)*(next.x-actor.x)+(me.y-actor.y)*(next.y-actor.y) > 0;
  memory.blockedFor = onRoute ? memory.blockedFor + dt : 0;
  const speed = Math.hypot(velocity.x,velocity.y);
  const approaching = dx*velocity.x+dy*velocity.y > speed*distance*.55;
  const nearMiss = skating && speed > 1 && approaching && distance < 1.35;
  const yielding = !skating && speed > .2 && approaching && distance < 1.05;
  const blocked = memory.blockedFor >= 2;
  if (!nearMiss && !yielding && !blocked) return null;
  memory.kind = nearMiss ? "dodge" : blocked ? "complain" :
    personality === "nox" || personality === "mara" || personality === "worker" ? "refuse" : "yield";
  memory.armed = false; memory.sequence++; memory.blockedFor = 0;
  memory.activeUntil = now + 1.6; memory.recoveryUntil = now + 3;
  memory.cooldownUntil = now + SPEECH_COOLDOWN;
  memory.target = null;
  return nearMiss ? "skating" : blocked ? "blocked" : "passing";
}
/** Pick one fixed lateral destination; route through the existing navigation grid. */
export function reactionTarget(actor: StreetActor, me: Point, lots: Obstacle[]): Point | null {
  const next = actor.path[0];
  const dx = next ? next.x-actor.x : actor.x-me.x;
  const dy = next ? next.y-actor.y : actor.y-me.y;
  const length = Math.hypot(dx,dy) || 1;
  const candidates = [-1,1].map(sign => ({x:actor.x-sign*dy/length*.65,y:actor.y+sign*dx/length*.65}));
  return candidates.filter(p => isWalkable(p,lots) && Math.hypot(p.x-me.x,p.y-me.y)>.8)
    .sort((a,b)=>Math.hypot(b.x-me.x,b.y-me.y)-Math.hypot(a.x-me.x,a.y-me.y))[0] ?? null;
}
const INCIDENT_FIELDS = {mara:"streetMaraIncidents",nox:"streetNoxIncidents",gus:"streetGusIncidents",ivy:"streetIvyIncidents"} as const;
/** Three separated disruptive encounters before one point lost, capped once per resident/day. */
export function recordStreetIncident(s: GameState, id: ResidentId): GameState {
  const field = INCIDENT_FIELDS[id], stamp = s[field] ?? 0;
  const count = Math.floor(stamp/10) === s.day ? stamp%10 : 0;
  if (count >= 3) return s;
  const relation = RELATION_FIELDS[id];
  return {...s,[field]:s.day*10+count+1,...(count===2 ? {[relation]:Math.max(-10,s[relation]-1)} : {})};
}

export function townAtmosphere(hour: number) {
  return {period:hour<6||hour>=22?"late-night":hour<12?"morning":hour<18?"afternoon":"evening",
    lit:hour>=18||hour<6, constructionActive:hour>=7&&hour<18, dinerActive:hour>=6&&hour<22};
}
export type StreetBird = Point & { angle: number; scatterUntil: number; armed: boolean };
/** Bounded flight and a gentle return; no radius-switch teleport or constant fright retrigger. */
export function moveBird(bird: StreetBird, home: Point, me: Point, now: number, dt: number,
  index: number, lots: Obstacle[], reduced = false) {
  const distance=Math.hypot(bird.x-me.x,bird.y-me.y);
  if(distance>2) bird.armed=true;
  if(distance<1.2 && bird.armed) {bird.scatterUntil=now+3;bird.armed=false;}
  const scattering=now<bird.scatterUntil;
  const dx=bird.x-me.x,dy=bird.y-me.y,length=Math.hypot(dx,dy)||1;
  const target=scattering ? {x:home.x+dx/length*1.4,y:home.y+dy/length*1.4} :
    {x:home.x+Math.cos(now*.25+index*2.1)*.22,y:home.y+Math.sin(now*.25+index*2.1)*.22};
  const tx=target.x-bird.x,ty=target.y-bird.y,travel=Math.hypot(tx,ty);
  if(travel>.025) {
    const step=Math.min(travel,dt*(scattering ? reduced ? .65 : 1.6 : .22));
    const next={x:bird.x+tx/travel*step,y:bird.y+ty/travel*step};
    if(isWalkable(next,lots)) {Object.assign(bird,next);bird.angle=Math.atan2(tx,-ty)*180/Math.PI;}
  }
  return scattering;
}
