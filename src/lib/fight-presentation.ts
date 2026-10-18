import { MOVES, opponentMove, takeTurn, type Fight, type FightVenue, type MoveId } from "@/lib/combat";
import type { CutsceneMode } from "@/lib/conversation-camera";

/**
 * Presentation layer for brawls. The combat engine (src/lib/combat.ts) stays the only place that decides hits,
 * damage, turns and knockouts; everything here is derived from its before/after results so the 3D scene, the
 * commentary and the camera can act out what already happened. No randomness here decides an outcome.
 */

/* ------------------------------------------------------------------ turn events */

export type Side = "player" | "opponent";
export type FightOutcome = "hit" | "blocked" | "miss" | "brace" | "recover";
export type FightEvent = {
  actor: Side;
  move: MoveId;
  outcome: FightOutcome;
  /** HP the target actually lost. */
  damage: number;
  ko: boolean;
  /** Worth a bigger camera reaction: heavy connections and knockouts. */
  big: boolean;
  message: string;
  before: Fight;
  after: Fight;
};

const other = (s: Side): Side => (s === "player" ? "opponent" : "player");

/** What one engine step looked like, read from the fight before and after it. */
export function eventFor(before: Fight, after: Fight, move: MoveId): FightEvent {
  const actor = before.turn;
  const target = other(actor);
  const damage = Math.max(0, before[target].hp - after[target].hp);
  const outcome: FightOutcome = move === "recover" ? "recover" : move === "block" ? "brace" : damage === 0 ? "miss" : before[target].guard ? "blocked" : "hit";
  const ko = after.over && after.winner === actor;
  return {
    actor, move, outcome, damage, ko,
    big: ko || (outcome === "hit" && (move === "heavy" || damage >= 20)),
    message: after.history[after.history.length - 1] ?? "",
    before, after,
  };
}

/**
 * One player choice, resolved exactly as before (player move, then the opponent's reply if the fight goes on),
 * returned as the final engine state plus the events to perform in order.
 */
export function playTurn(f: Fight, move: MoveId, roll: () => number = Math.random): { fight: Fight; events: FightEvent[] } {
  const events: FightEvent[] = [];
  const first = takeTurn(f, move, roll);
  events.push(eventFor(f, first, move));
  let fight = first;
  if (!first.over) {
    const reply = opponentMove(first);
    const second = takeTurn(first, reply, roll);
    events.push(eventFor(first, second, reply));
    fight = second;
  }
  return { fight, events };
}

/** How long each action plays, kept short so ordinary turns stay quick. */
const BASE: Record<MoveId, number> = { jab: 0.6, hook: 0.85, heavy: 1.25, block: 0.55, recover: 0.75 };
export function eventSeconds(e: FightEvent, mode: CutsceneMode, reducedMotion = false): number {
  if (mode === "off" || reducedMotion) return e.ko ? 0.9 : 0.35;
  const base = BASE[e.move] + (e.outcome === "miss" ? 0.1 : 0) + (e.ko ? 1.7 : 0);
  return mode === "short" ? Math.max(0.35, base * 0.6) : base;
}
export const queueSeconds = (events: readonly FightEvent[], mode: CutsceneMode, reducedMotion = false) => events.reduce((n, e) => n + eventSeconds(e, mode, reducedMotion), 0);

/* ------------------------------------------------------------------ fighters */

export type FighterStyle = "player" | "barry" | "pete" | "derek" | "cousin" | "contender";
export type FighterLook = {
  style: FighterStyle;
  name: string;
  billing: string;
  outfit: string;
  skin: string;
  legs: string;
  /** Height and width multipliers on the shared stick figure. */
  stretch: number;
  bulk: number;
  intro: string;
  /** Lines used sparingly: after their misses, when they get hit, when they go down or win. */
  miss: readonly string[];
  hurt: readonly string[];
  ko: string;
  win: string;
};

export const FIGHTERS: Readonly<Record<Exclude<FighterStyle, "player">, FighterLook>> = {
  barry: { style: "barry", name: "Big Barry", billing: "Seventeen stone of opinions", outfit: "#e8e2d2", skin: "#e2b08a", legs: "#3a4a6a", stretch: 1.04, bulk: 1.3,
    intro: "Big Barry. Biggest shoulders in the pub. Smallest tolerance for being laughed at.",
    miss: ["Barry swings at absolutely nothing.", "Barry blames the floor.", "Barry looks round to check nobody saw that. Everybody saw that."],
    hurt: ["Barry's lip wobbles. Just a bit.", "Barry pretends that didn't hurt. It did."],
    ko: "Barry goes down like a wardrobe and asks for his mum.", win: "Barry flexes at the crowd. The crowd is not sure where to look." },
  pete: { style: "pete", name: "One-Punch Pete", billing: "Undefeated in his own memory", outfit: "#c94a3a", skin: "#c99572", legs: "#2b2a2e", stretch: 1.06, bulk: 0.85,
    intro: "One-Punch Pete. He has a legendary knockout punch. He would like you to know about it.",
    miss: ["Pete appears to have punched his own confidence.", "That was the legendary punch. Apparently.", "Pete insists that was a warm-up."],
    hurt: ["Pete explains that he let that one in.", "Pete's record grows longer and sadder."],
    ko: "One-Punch Pete is done in more than one punch. Again.", win: "Pete: \"ONE PUNCH!\" It was nine." },
  derek: { style: "derek", name: "Derek the Menace", billing: "Takes this far too seriously", outfit: "#1f2a26", skin: "#8d5a3b", legs: "#1d1d22", stretch: 1, bulk: 1,
    intro: "Derek the Menace. Has trained for this in the car park. Has been training for eleven years.",
    miss: ["Derek mutters something about footwork.", "Derek stares at his fist like it betrayed him."],
    hurt: ["Derek nods. He respects it. He hates it.", "Derek writes something in a mental notebook."],
    ko: "Derek goes down, still glaring.", win: "Derek bows to the crowd. Only Derek is moved." },
  cousin: { style: "cousin", name: "Mad Mick's Cousin", billing: "Possibly confused about the rules", outfit: "#d98a2a", skin: "#e8c3a0", legs: "#6a2333", stretch: 0.97, bulk: 1.05,
    intro: "Mad Mick's Cousin. Nobody knows his name. He doesn't seem sure either.",
    miss: ["Mick's Cousin tries to tag in the bartender.", "Mick's Cousin asks if this is the queue for the toilets."],
    hurt: ["Mick's Cousin says he's telling Mick.", "Mick's Cousin briefly forgets where he is."],
    ko: "Mick's Cousin lies down and announces he's winning.", win: "Mick's Cousin celebrates the wrong person." },
  contender: { style: "contender", name: "Underground contender", billing: "No nickname. Doesn't need one.", outfit: "#2b2a2e", skin: "#c99572", legs: "#1d1d22", stretch: 1.02, bulk: 1.15,
    intro: "No introduction. No smile.", miss: ["The contender resets without a word."], hurt: ["The contender doesn't flinch."],
    ko: "The contender finally stays down.", win: "The contender walks off without looking back." },
};
export function fighterFor(name: string): FighterLook {
  return Object.values(FIGHTERS).find((f) => f.name === name) ?? FIGHTERS.contender;
}

/* ------------------------------------------------------------------ commentary */

export const CROWD_LINES = [
  "The bartender has seen worse. On a Tuesday.",
  "Someone in the crowd wants their twenty dollars back.",
  "A man by the jukebox shouts advice he has never followed.",
  "Somebody spills a pint in sympathy.",
  "The bartender wipes the same glass for the fourth time.",
];

/** The engine names the player "You" in third-person templates; read those back in the second person. */
export function voice(line: string): string {
  return line
    .replace(/^You's /, "Your ")
    .replace(/^You lands /, "You land ")
    .replace(/^You braces /, "You brace ")
    .replace(/^You catches their breath/, "You catch your breath");
}

/** A line for the commentary strip: the engine's own words first, with an occasional bit of colour. */
export function commentary(e: FightEvent, opponent: FighterLook): string[] {
  const lines = [voice(e.message)];
  const seed = e.before.round * 7 + (e.actor === "player" ? 3 : 5) + e.damage;
  const pick = <T,>(xs: readonly T[]) => xs[seed % xs.length]!;
  if (e.ko) lines.push(e.actor === "player" ? opponent.ko : "You hit the boards. The pub goes quiet, then very loud.");
  else if (e.actor === "opponent" && e.outcome === "miss") lines.push(pick(opponent.miss));
  else if (e.actor === "player" && e.outcome === "hit" && e.big) lines.push(pick(opponent.hurt));
  else if (e.actor === "player" && e.outcome === "miss" && seed % 2 === 0) lines.push("You punch a bit of the air that had it coming.");
  else if (seed % 5 === 0) lines.push(pick(CROWD_LINES));
  return lines;
}

/* ------------------------------------------------------------------ venues */

export type V3 = [number, number, number];
export type ShotPreset = { eye: V3; target: V3; fov: number };
export type Spectator = { x: number; z: number; angle: number; outfit: string; skin: string; hat?: string };
/**
 * Everything a fight location supplies to the presentation: where it happens, who watches, and how the camera
 * frames it. The pub uses The Tipsy Stick's real floor plan; a future venue only needs its own preset.
 */
export type FightVenuePreset = {
  venue: FightVenue;
  label: string;
  /** Floor plan to draw (a 3D venue kind), or null for the plain stage. */
  plan: "bar" | null;
  /** Plan NPCs who step out of the room while a fight is on (they reappear as spectators). */
  clears: readonly string[];
  player: { x: number; z: number };
  opponent: { x: number; z: number };
  bookie: { x: number; z: number; angle: number } | null;
  spectators: readonly Spectator[];
  shots: { wager: ShotPreset; gather: ShotPreset; faceoff: ShotPreset; fight: ShotPreset; result: ShotPreset };
  floor: string;
  light: string;
};

export const FIGHT_VENUES: Readonly<Record<FightVenue, FightVenuePreset>> = {
  pub: {
    venue: "pub", label: "The Tipsy Stick", plan: "bar",
    clears: ["dancer1", "dancer2", "dancer3", "gus-darts"],
    // The dance floor doubles as the fight floor: no ring, just a loose circle of regulars.
    player: { x: 8.98, z: 5.5 }, opponent: { x: 9.98, z: 5.5 },
    bookie: { x: 9.1, z: 0.8, angle: 180 },
    spectators: [
      { x: 8.15, z: 3.95, angle: 150, outfit: "#e05aa0", skin: "#f0d5b7" },
      { x: 9.1, z: 3.7, angle: 175, outfit: "#4f8a54", skin: "#e8c7a0", hat: "#3a3a3a" },
      { x: 10.05, z: 3.75, angle: 195, outfit: "#3aa6c9", skin: "#d9b48f" },
      { x: 10.85, z: 4.35, angle: 230, outfit: "#e9c46a", skin: "#c99a74" },
      { x: 10.95, z: 6.3, angle: 280, outfit: "#7a5a8a", skin: "#efd0b0", hat: "#b8433c" },
      { x: 7.75, z: 4.75, angle: 115, outfit: "#5c6e98", skin: "#d9b48f" },
      { x: 7.7, z: 6.45, angle: 80, outfit: "#b55a51", skin: "#8d5a3b" },
    ],
    shots: {
      wager: { eye: [8.45, 1.85, 3.9], target: [9.1, 0.55, 1.0], fov: 52 },
      gather: { eye: [8.6, 2.3, 7.95], target: [9.5, 0.6, 4.8], fov: 62 },
      faceoff: { eye: [9.48, 1.05, 7.6], target: [9.48, 0.98, 5.5], fov: 54 },
      fight: { eye: [9.12, 1.45, 7.95], target: [9.48, 0.8, 5.35], fov: 58 },
      // Looks down in front of the fighters so the aftermath sits above the result card.
      result: { eye: [9.2, 2.35, 7.95], target: [9.5, 0.2, 5.9], fov: 60 },
    },
    floor: "#2a1f3a", light: "#ffb36a",
  },
  // Pipework only: an organised venue supplies its own plan, crowd and cameras later. No map location exists yet.
  underground: {
    venue: "underground", label: "Underground", plan: null, clears: [],
    player: { x: -0.65, z: 0 }, opponent: { x: 0.65, z: 0 }, bookie: null,
    spectators: [
      { x: -1.6, z: -1.3, angle: 140, outfit: "#2b2a2e", skin: "#c99572" },
      { x: 0, z: -1.7, angle: 180, outfit: "#3a3a44", skin: "#e8c3a0" },
      { x: 1.6, z: -1.3, angle: 220, outfit: "#2b2a2e", skin: "#8d5a3b" },
    ],
    shots: {
      wager: { eye: [0, 1.6, 3], target: [0, 1, 0], fov: 50 },
      gather: { eye: [0, 2.4, 3.6], target: [0, 0.7, -0.6], fov: 60 },
      faceoff: { eye: [0, 0.9, 1.6], target: [0, 0.95, 0], fov: 58 },
      fight: { eye: [-0.9, 1.6, 2.6], target: [0, 0.85, 0], fov: 60 },
      result: { eye: [-1.0, 1.9, 2.8], target: [0, 0.75, -0.2], fov: 62 },
    },
    floor: "#3a3a3e", light: "#d9e4ff",
  },
};

/** Moves in the order they sit on the move bar, with their cost and a short readable effect. */
export const MOVE_BAR: readonly { id: MoveId; name: string; cost: number; effect: string }[] = (Object.keys(MOVES) as MoveId[]).map((id) => ({
  id, name: MOVES[id].name, cost: MOVES[id].cost,
  effect: id === "recover" ? "+2 AP" : id === "block" ? "Guard" : `${MOVES[id].min}–${MOVES[id].max}`,
}));