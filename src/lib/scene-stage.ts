import type { VignetteKind } from "@/components/ActionVignette";
import { gainsOf, lossesOf, type ActName, type HeldProp, type WorldProp } from "@/lib/cutscenes";
import type { GameState } from "@/lib/game-state";
import type { CutsceneMode, Milestone } from "@/lib/milestones";

/**
 * The scene stage: a small 3D set with the player on it, used for (a) life milestones, which get
 * a full-screen moment of their own, and (b) actions that happen outside a 3D room (the town map,
 * the classic renderer), replacing the old flat stick-figure card. Pure description only.
 */
export type StageSet =
  | "gym" | "park" | "bench" | "bar" | "bed" | "desk" | "casino" | "alley" | "counter" | "dancefloor"
  | "clinic" | "busstop" | "atm" | "lounge" | "kitchen"
  | "podium" | "graduation" | "house-1" | "house-2" | "house-3" | "house-4" | "bank" | "workplace";

export type StageSpec = {
  key: number;
  mode: "milestone" | "card";
  set: StageSet;
  act: ActName;
  held: HeldProp | null;
  hat: "mortar" | null;
  /** Actor mark on the set (metres; face 0 looks at the camera). */
  mark: { x: number; z: number; face: number; lift: number };
  world: WorldProp[];
  title: string;
  /** Big subtitle for milestones (new role, house or qualification). */
  detail: string | null;
  caption: string | null;
  message: string;
  gains: string[];
  losses: string[];
  confetti: "party" | "paper" | null;
  /** Someone to share the moment with (boss, dance partner). */
  costar: { x: number; z: number; rot: number } | null;
  duration: number;
  /** Sign text painted on the set (workplace name, banner). */
  banner: string | null;
};

let keyN = 0;
const AT = (x: number, z: number, face = 0, lift = 0) => ({ x, z, face, lift });

/** Full-screen milestone scenes: the biggest moments in a life. */
export function milestoneStage(m: Milestone, ctx: { day: number; house: number; changes: string[]; message: string; mode: CutsceneMode }): StageSpec {
  const base = { key: ++keyN, mode: "milestone" as const, hat: null, world: [], caption: null, costar: null, banner: null, message: ctx.message, gains: gainsOf(ctx.changes), losses: lossesOf(ctx.changes), title: m.title, detail: m.detail };
  const duration = ctx.mode === "short" ? 3.2 : 6.2;
  switch (m.kind) {
    case "new-home":
      return { ...base, set: `house-${Math.min(4, Math.max(1, ctx.house))}` as StageSet, act: "keys", held: "keys", mark: AT(0, 0.2), confetti: "party", duration };
    case "graduated":
      return { ...base, set: "graduation", act: "victory", held: "diploma", hat: "mortar", mark: AT(0, 0, 0, 0.32), confetti: "party", banner: `CLASS OF DAY ${ctx.day}`, duration };
    case "promoted":
      return { ...base, set: "podium", act: "victory", held: "trophy", mark: AT(0, 0, 0, 0.5), confetti: "party", duration };
    case "hired":
      return { ...base, set: "workplace", act: "hire", held: null, mark: AT(-0.2, 0.15, 0.55), costar: { x: 0.55, z: 0.45, rot: -Math.PI / 2 - 0.35 }, confetti: "party", banner: m.detail.toUpperCase(), duration };
    case "debt-free":
      return { ...base, set: "bank", act: "tear", held: "contract", mark: AT(0, 0.1), confetti: "paper", banner: "PAID IN FULL", duration };
  }
}

/** Everyday actions outside a 3D room: a compact card-sized scene (the old vignette's job). */
export function cardStage(kind: VignetteKind, req: { actionId: string; changes: string[]; message: string; before: GameState; after: GameState; title: string; mode: CutsceneMode }): StageSpec {
  const won = req.after.money > req.before.money;
  const base = { key: ++keyN, mode: "card" as const, hat: null, world: [] as WorldProp[], detail: null, caption: null as string | null, costar: null, banner: null, confetti: null, message: req.message, gains: gainsOf(req.changes), losses: lossesOf(req.changes), title: req.title };
  const duration = req.mode === "short" ? 1.5 : 2.7;
  const pick = ((): Pick<StageSpec, "set" | "act" | "held" | "mark"> & Partial<StageSpec> => {
    switch (kind) {
      case "strength": return { set: "gym", act: "press", held: "dumbbells", mark: AT(0, 0) };
      case "run": return { set: "park", act: "run", held: null, mark: AT(0, 0, Math.PI / 2) };
      case "study": return { set: "bench", act: "read", held: "book", mark: AT(0, -0.05, 0, 0.19) };
      case "drink": return { set: "bar", act: "drink", held: "pint", mark: AT(0, 0.1, Math.PI, 0.46) };
      // Beds run across the shot so the sleeper is seen side-on, not from the foot of the bed.
      case "sleep": return { set: "bed", act: "sleep", held: null, mark: AT(-0.1, 0, Math.PI / 2, 0.2), world: [{ kind: "blanket", w: 1.2, d: 1.32, x: 0, z: 0.34, y: 0.4 }] };
      case "food": return req.actionId === "cook" ? { set: "kitchen", act: "cook", held: "spoon", mark: AT(0, 0.1, Math.PI) } : { set: "bench", act: "munch", held: "snack", mark: AT(0.15, 0.2) };
      case "work": return { set: "desk", act: "type", held: null, mark: AT(0, -0.35, 0, 0.22) };
      case "gamble": return { set: "casino", act: won ? "dice-win" : "dice-lose", held: "dice", mark: AT(0, -0.2), caption: won ? "LUCKY ROLL!" : "BUST" };
      case "shady": return req.actionId === "sell-goods" ? { set: "alley", act: "sell", held: "bag", mark: AT(0, 0.1, Math.PI) } : { set: "alley", act: won ? "rob" : "caught", held: won ? "bag" : null, mark: AT(0, -0.5, Math.PI) };
      case "shop": return { set: "counter", act: "sell", held: "cash", mark: AT(0, 0.05, Math.PI) };
      case "social": return { set: "dancefloor", act: "dance", held: null, mark: AT(-0.3, 0), costar: { x: 0.45, z: 0.1, rot: -Math.PI / 2 } };
      case "recover": return { set: "clinic", act: "heal", held: null, mark: AT(-0.1, 0, Math.PI / 2, 0.6) };
      case "travel": return { set: "busstop", act: "board", held: null, mark: AT(0.1, 0.15, Math.PI) };
      case "money": return { set: "atm", act: "atm", held: "cash", mark: AT(0, 0.05, Math.PI) };
      case "tv": return { set: "lounge", act: "watch", held: null, mark: AT(0, -0.1, 0, 0.2) };
    }
  })();
  return { ...base, ...pick, duration };
}
