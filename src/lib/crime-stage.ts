import { directedCrimeCue } from "@/lib/crime-cinematic-director";
import type { CrimeVisualActor, CrimeVisualCue } from "@/lib/crime-visual-cues";
import type { CastAct, CutsceneMode, SceneBeat, SceneCue } from "@/lib/conversation-camera";
import type { MissionProp, PlacedCast, PlacedProp } from "@/lib/crime-cast";
import { gainsOf, lossesOf } from "@/lib/cutscenes";
import type { GameState } from "@/lib/game-state";
import type { StageSpec } from "@/lib/scene-stage";

/**
 * Crime cutscenes on the scene stage: the director's cue for an action, cast and blocked on a small set that
 * matches its venue, with each beat's performances chosen from the (already decided) outcome. Built after the
 * action has run, from before/after snapshots only; it never changes state, pays out or advances a mission.
 */
export type CrimeSet = "pawn" | "diner" | "shop" | "pub" | "lane" | "bankfront" | "green";
export type CrimeOutcome = "success" | "setback";
export type CrimeStage = {
  cue: SceneCue;
  set: CrimeSet;
  cast: readonly PlacedCast[];
  props: readonly PlacedProp[];
  /** A prop that changes hands during `beat`. */
  handover: { prop: MissionProp; from: CrimeVisualActor; to: CrimeVisualActor; beat: number } | null;
  storyId: number | null;
  outcome: CrimeOutcome;
  reduced: boolean;
};

const SET_FOR: Record<CrimeVisualCue["venue"], CrimeSet> = { pawn: "pawn", diner: "diner", shop: "shop", bar: "pub", alley: "lane", bank: "bankfront", gang: "green" };
const TITLES: Record<CrimeVisualCue["kind"], string> = {
  robbery: "STICK-UP", delivery: "SPECIAL DELIVERY", lookout: "ON WATCH", collection: "THE COLLECTION", investigation: "THE INVESTIGATION", negotiation: "NEGOTIATIONS",
};
const STORY_TITLES: Record<number, string> = { 1: "THE MISSING CUT", 2: "SOMEONE AT THE DOOR", 3: "AN AWKWARD COLLECTION", 4: "A STRANGER'S OFFER", 5: "THE LATE-NIGHT FAVOUR" };

const P = (id: CrimeVisualActor, x: number, z: number, angle: number, pose: PlacedCast["pose"] = "standing", extra: Partial<PlacedCast> = {}): PlacedCast => ({ id, x, z, angle, pose, ...extra });
const prop = (kind: MissionProp, x: number, y: number, z: number, rot = 0): PlacedProp => ({ kind, x, y, z, rot });

/** Did the action do what the player wanted? Read from the state change, never re-rolled. */
export function crimeOutcome(actionId: string, before: GameState, after: GameState): CrimeOutcome {
  if (actionId.startsWith("underworld-investigate-")) return (after.underworldStoryStage ?? 0) > (before.underworldStoryStage ?? 0) ? "success" : "setback";
  if (actionId.startsWith("gang-encounter-")) return after.gangTask !== before.gangTask ? "success" : "setback";
  if (actionId === "gang-parcel-handoff") return before.gangParcel && !after.gangParcel ? "success" : "setback";
  return after.money > before.money ? "success" : "setback";
}

/** Blocking (who stands where, and what is on set) for a cue. Stage metres; the camera looks from +z. */
function block(cue: CrimeVisualCue, storyId: number | null): { cast: PlacedCast[]; props: PlacedProp[] } {
  const other = cue.cast.find((a) => a !== "player") ?? "stranger";
  switch (cue.id) {
    case "underworld-investigate-1": return { cast: [P("clerk", 0.25, -1.05, 180), P("player", -0.35, 0.15, 10)], props: [prop("ledger", -0.15, 0.62, -0.6, 0.2), prop("soup-coupon", 0.35, 0.62, -0.52, -0.3), prop("biscuits", 0.8, 0.62, -0.66)] };
    case "underworld-investigate-2": return { cast: [P("stranger", 0.75, -0.55, 280), P("player", -1.0, 0.35, 70)], props: [prop("pie-sign", 0.05, 0, -0.85, 0.5)] };
    case "underworld-investigate-3": return { cast: [P("shopkeeper", 0.15, -1.05, 180, "standing", { held: "envelope" }), P("player", -0.3, 0.15, 15)], props: [prop("wheelbarrow", 1.5, 0, -1.0, -1.1)] };
    case "underworld-investigate-4": return { cast: [P("buyer", 0.5, -0.75, 215, "sitting", { lift: 0.3 }), P("player", -0.55, 0.15, 30)], props: [prop("small-table", 0.05, 0, -0.35), prop("stool", 0.5, 0, -0.75), prop("parcel", -0.05, 0.57, -0.3, 0.3), prop("pint", 0.25, 0.57, -0.45)] };
    case "underworld-investigate-5": return { cast: [P("player", -0.75, 0.25, 70), P("lez", 0.8, -1.15, 290)], props: [prop("trolley", 0.05, 0, -0.15, -1.45)] };
    case "gang-task-1": return { cast: [P("player", -0.35, 0.1, 340), P("stranger", 1.35, -1.1, 250)], props: [prop("envelope", -0.6, 0.42, -0.55, 0.2)] };
    case "gang-task-2": case "gang-task-4": return { cast: [P("mick", 0.05, -0.75, 180), P("lez", -0.75, -0.95, 160), P("nia", 0.8, -0.85, 205, "sitting", { lift: 0.27 }), P("player", -0.15, 0.35, 0)], props: [] };
    case "gang-task-3": return { cast: [P("player", -0.85, 0.25, 60), P("stranger", 0.8, -0.65, 240)], props: [] };
    case "gang-task-5": return { cast: [P("buyer", 0.5, -0.75, 215, "sitting", { lift: 0.3 }), P("player", -0.55, 0.15, 30)], props: [prop("small-table", 0.05, 0, -0.35), prop("stool", 0.5, 0, -0.75), prop("pint", 0.25, 0.57, -0.45)] };
    case "gang-parcel-handoff": return { cast: [P("clerk", 0.25, -1.05, 180), P("player", -0.3, 0.15, 10, "standing", { held: "parcel" })], props: [prop("ledger", 0.75, 0.62, -0.6)] };
  }
  void storyId;
  // Robbery and anything new: across a counter.
  return { cast: [P(other, 0.2, -1.05, 180), P("player", -0.2, 0.2, 5)], props: [] };
}

/** Performances for each beat, by kind of scene and outcome. Beat 0 sets up, 1 is the exchange, 2 the reaction. */
function performances(cue: CrimeVisualCue, outcome: CrimeOutcome, fumble: boolean, storyId: number | null): Partial<Record<CrimeVisualActor, CastAct>>[] {
  const o = cue.cast.find((a) => a !== "player") ?? "stranger";
  const ok = outcome === "success";
  switch (cue.kind) {
    case "investigation": return [
      { player: "inspect", [o]: "fluster" },
      { player: fumble ? "shrug" : "lean-in", [o]: fumble ? "wave-off" : "talk" },
      { player: "idle", [o]: fumble ? "arms-crossed" : "shrug" },
    ];
    case "lookout": return [
      { player: "peek", [o]: storyId === 2 ? "check-sign" : "glance" },
      { player: "peek", [o]: storyId === 2 ? "glance" : "look-around" },
      { player: ok ? "nod" : "turn-away", [o]: storyId === 2 ? "check-sign" : ok ? "pause" : "point" },
    ];
    case "collection": return storyId === 3 ? [
      { player: "talk", shopkeeper: "arms-crossed" },
      { player: "receive", shopkeeper: ok ? "hand-over" : "arms-crossed" },
      { player: "nod", shopkeeper: "nod" },
    ] : [
      { player: "inspect", [o]: "peek" },
      { player: ok ? "receive" : "flee", [o]: "glance" },
      { player: ok ? "nod" : "shrug", [o]: "turn-away" },
    ];
    case "negotiation": return cue.venue === "gang" ? [
      { player: "talk", mick: "arms-crossed", nia: "arms-crossed", lez: "stare-sky" },
      { player: "talk", mick: ok ? "nod" : "point", nia: "count", lez: "stare-sky" },
      { player: "idle", mick: ok ? "triumph" : "deflate", nia: ok ? "nod" : "facepalm", lez: "salute" },
    ] : [
      { player: "talk", [o]: "jiggle" },
      { player: "lean-in", [o]: "adjust-glasses" },
      { player: ok ? "nod" : "shrug", [o]: ok ? "hand-over" : "wave-off" },
    ];
    case "delivery":
      if (storyId === 5) return [
        { player: "push", lez: "head-down" },
        { player: "hold-card", lez: "pause" },
        { player: "pause", lez: "head-down" },
      ];
      if (cue.venue === "gang") return [
        { player: "talk", mick: "arms-crossed", nia: "arms-crossed", lez: "glance" },
        { player: "hand-over", mick: "receive", nia: "count", lez: "glance" },
        { player: "idle", mick: ok ? "triumph" : "deflate", nia: "nod", lez: "stare-sky" },
      ];
      return [
        { player: "talk", [o]: "fluster" },
        { player: "hand-over", [o]: "receive" },
        { player: "nod", [o]: "nod" },
      ];
    case "robbery": return [
      { player: "point", [o]: "pause" },
      { player: "point", [o]: ok ? "hands-up" : "phone" },
      { player: "flee", [o]: ok ? "hands-up" : "point" },
    ];
  }
}

function handoverFor(cue: CrimeVisualCue, outcome: CrimeOutcome, storyId: number | null): CrimeStage["handover"] {
  const o = cue.cast.find((a) => a !== "player") ?? "stranger";
  if (outcome !== "success") return null;
  if (storyId === 3) return { prop: "envelope", from: "shopkeeper", to: "player", beat: 1 };
  // Lez's card comes out of the trolley and into your hands.
  if (storyId === 5) return { prop: "birthday-card", from: "lez", to: "player", beat: 1 };
  if (cue.id === "gang-task-2") return { prop: "envelope", from: "player", to: "mick", beat: 1 };
  if (cue.id === "gang-parcel-handoff") return { prop: "parcel", from: "player", to: o, beat: 1 };
  if (cue.id === "gang-task-5") return { prop: "parcel", from: "player", to: "buyer", beat: 1 };
  if (cue.kind === "robbery") return { prop: "cash", from: o, to: "player", beat: 1 };
  return null;
}

export type CrimeStageRequest = { actionId: string; before: GameState; after: GameState; changes: string[]; message: string; mode: CutsceneMode; reducedMotion?: boolean };

/** The crime cutscene for an action that just succeeded, or null (cutscenes off, or not a crime action). */
export function crimeStage(req: CrimeStageRequest, key: number): StageSpec | null {
  const reduced = req.reducedMotion === true;
  const directed = directedCrimeCue(req.actionId, req.mode, reduced);
  if (!directed) return null;
  const cue = directed.visual;
  const storyId = req.actionId.startsWith("underworld-investigate-") ? Number(req.actionId.split("-")[2]) || null : null;
  const outcome = crimeOutcome(req.actionId, req.before, req.after);
  // A skill approach the player couldn't carry off still finds the basic clue; the script says so, and so does the scene.
  const fumble = storyId !== null && /doesn't quite land/i.test(req.message);
  const acts = performances(cue, outcome, fumble, storyId);
  const { cast, props } = block(cue, storyId);
  // Beats get time in proportion to the director's suggestion; a reflective scene gets its pauses on top.
  const total = (Math.max(directed.durationSeconds, reduced ? 0 : 1.5) + (req.mode === "short" ? 0.4 : 1.1)) * 1000;
  const weights = directed.beats.map((b) => 1 + b.pauseMs / 900);
  const sum = weights.reduce((a, b) => a + b, 0);
  const beats: SceneBeat[] = reduced
    ? [{ ...directed.beats[0]!, durationMs: 2000, acts: acts[2] ?? {} }]
    : directed.beats.map((b, i) => ({ ...b, durationMs: (total * weights[i]!) / sum, acts: acts[i] ?? {} }));
  const crime: CrimeStage = {
    cue: { id: cue.id, kind: "action", cast: cue.cast, beats, ...(storyId ? { storyId } : {}) },
    set: SET_FOR[cue.venue], cast, props, handover: reduced ? null : handoverFor(cue, outcome, storyId), storyId, outcome, reduced,
  };
  const duration = beats.reduce((n, b) => n + b.durationMs, 0) / 1000;
  return {
    key, mode: "card", set: "desk", act: "relax", held: null, hat: null, mark: { x: 0, z: 0, face: 0, lift: 0 }, world: [],
    title: storyId ? STORY_TITLES[storyId]! : TITLES[cue.kind], detail: null,
    caption: outcome === "setback" ? (cue.kind === "robbery" ? "NOT TODAY" : "IT DOESN'T QUITE LAND") : fumble ? "IT DOESN'T QUITE LAND" : null,
    message: req.message, gains: gainsOf(req.changes), losses: lossesOf(req.changes), confetti: null, costar: null, duration, banner: null, crime,
  };
}