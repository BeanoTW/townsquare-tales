import type { GameState } from "@/lib/game-state";
import type { HomePlan, Slot } from "@/lib/home3d/layout";

/**
 * In-world cutscenes: when an action succeeds inside a 3D room, the player acts it out at the
 * real fixture while the camera eases in. This module is pure — it decides *what* plays and
 * *where*; the renderer (components/home3d/scenes) decides how it looks.
 */

export type ActName =
  | "bench" | "squat" | "deadlift" | "press" | "run"
  | "sleep" | "cook" | "watch" | "laugh" | "jacks" | "game"
  | "type" | "read" | "relax";

export type HeldProp = "barbell" | "dumbbells" | "book" | "controller" | "spoon";
export type WorldProp = { kind: "blanket"; w: number; d: number; x: number; z: number; y: number };

export type Mark = { x: number; z: number; face: number; lift: number };

export type Cutscene = {
  /** Unique per play, so the same action twice restarts the scene. */
  key: number;
  actionId: string;
  slotId: string;
  act: ActName;
  /** World-space position and heading (radians, Person convention via `angle`). */
  x: number; z: number; angle: number; lift: number;
  held: HeldProp | null;
  world: WorldProp[];
  title: string;
  /** Extra beat for milestones or a tired player. */
  caption: string | null;
  gains: string[];
  /** Seconds. */
  duration: number;
  short: boolean;
  tired: boolean;
  night: boolean;
  frame: { dist: number; el: number };
};

/** Offered every successful action; returns true when the current 3D room will act it out in-world. */
export type CutsceneClaim = (req: Omit<CutsceneRequest, "slotId">) => boolean;

export type CutsceneRequest = {
  actionId: string;
  /** The hotspot the player used (slot id for 3D plans). */
  slotId: string | null;
  changes: string[];
  before: GameState;
  after: GameState;
};

type Variant = "std" | "lux" | "scrap" | "bare";
type Pick = { slotId: string; act: ActName; mark: Mark; held: HeldProp | null; world?: (slot: Slot) => WorldProp[] };

const TITLES: Record<ActName, string> = {
  bench: "BENCH DAY", squat: "NEVER SKIP LEG DAY", deadlift: "PICK IT UP, PUT IT DOWN", press: "FEEL THE BURN",
  run: "ONE MORE KILOMETRE", sleep: "LIGHTS OUT", cook: "CHEF'S SPECIAL", watch: "CHANNEL SURFING",
  laugh: "LAUGH TRACK", jacks: "PUMP TV", game: "PLAYER ONE", type: "BRAIN POWER", read: "PAGE TURNER", relax: "FEET UP",
};

const STRENGTH: ActName[] = ["bench", "squat", "deadlift", "press", "jacks"];
const BRAINS: ActName[] = ["type", "read"];

/* Marks are fixture-local: +z faces the customer, `face` 0 looks out along +z. Lift is the seat/mattress height the rig rests on. */
const SIT = { sofa: { std: 0.31, lux: 0.48, scrap: 0.21 }, chair: { std: 0.23, lux: 0.3, scrap: 0.1 } };
const BED_TOP: Record<Variant, number> = { std: 0.5, lux: 0.71, scrap: 0.42, bare: 0.19 };
const BLANKET_W: Record<Variant, number> = { std: 1.5, lux: 1.62, scrap: 1.36, bare: 1.25 };

function blanket(v: Variant, squat: boolean) {
  const top = squat && v === "bare" ? 0.15 : BED_TOP[v];
  const w = squat && v === "bare" ? 0.82 : BLANKET_W[v];
  return () => [{ kind: "blanket" as const, w, d: 1.32, x: 0, z: 0.46, y: top + 0.2 }];
}

/** The scene for an action, given which fixtures this room actually has. */
function choose(actionId: string, plan: HomePlan, has: (id: string) => boolean, variant: (id: string) => Variant, round: number): Pick | null {
  const squatHome = plan.kind === "squat";
  if (plan.kind === "gym") {
    if (actionId === "lift" && has("rack")) {
      const act = (["bench", "squat", "deadlift"] as const)[round % 3]!;
      return act === "bench"
        ? { slotId: "rack", act, mark: { x: 0, z: 0.28, face: 0, lift: 0.5 }, held: "barbell" }
        : { slotId: "rack", act, mark: { x: 0, z: 0.86, face: 0, lift: 0.05 }, held: "barbell" };
    }
    if (actionId === "jog" && has("track")) return { slotId: "track", act: "run", mark: { x: 1.35, z: 0.2, face: Math.PI, lift: 0.29 }, held: null };
    return null;
  }
  if (plan.tier >= 10) return null; // other venues come in a later pass
  if (actionId === "home-workout" && has("weights")) {
    const v = variant("weights");
    const bench: Record<string, Mark> = {
      std: { x: -0.38, z: 0.06, face: 0, lift: 0.47 },
      lux: { x: 0, z: 0.56, face: 0, lift: 0.49 },
      scrap: { x: -0.12, z: 0.22, face: Math.PI / 2, lift: 0.24 },
    };
    const stand: Record<string, Mark> = {
      std: { x: 0.08, z: -0.12, face: 0, lift: 0.025 },
      lux: { x: 0, z: -0.24, face: 0, lift: 0.03 },
      scrap: { x: 0.3, z: 0.05, face: 0, lift: 0 },
    };
    const options: Pick[] = [
      { slotId: "weights", act: "bench", mark: bench[v]!, held: "barbell" },
      { slotId: "weights", act: "press", mark: stand[v]!, held: "dumbbells" },
    ];
    if (v === "lux") options.push({ slotId: "weights", act: "squat", mark: stand["lux"]!, held: "barbell" });
    return options[round % options.length]!;
  }
  if (actionId === "sleep" && has("bed")) {
    const v = variant("bed");
    return { slotId: "bed", act: "sleep", mark: { x: 0, z: 0.12, face: 0, lift: squatHome && v === "bare" ? 0.15 : BED_TOP[v] }, held: null, world: blanket(v, squatHome) };
  }
  if (actionId === "cook" && has("kitchen")) {
    const v = variant("kitchen");
    return { slotId: "kitchen", act: "cook", mark: { x: v === "scrap" ? 0 : 0.2, z: v === "scrap" ? 0.62 : 0.72, face: Math.PI, lift: 0 }, held: "spoon" };
  }
  const sofa = (act: ActName, held: HeldProp | null): Pick | null => has("sofa")
    ? { slotId: "sofa", act, mark: { x: 0.25, z: 0.1, face: 0, lift: SIT.sofa[variant("sofa") === "bare" ? "std" : variant("sofa") as "std"] }, held }
    : null;
  if (actionId.startsWith("tv-") && has("tv")) {
    if (actionId === "tv-fitness") return has("sofa") ? { slotId: "sofa", act: "jacks", mark: { x: 0, z: 1.0, face: 0, lift: 0 }, held: null } : { slotId: "tv", act: "jacks", mark: { x: 0, z: 1.1, face: Math.PI, lift: 0 }, held: null };
    const act: ActName = actionId === "tv-comedy" || actionId === "tv-social" ? "laugh" : "watch";
    return sofa(act, null) ?? { slotId: "tv", act: "watch", mark: { x: 0, z: 1.2, face: Math.PI, lift: 0 }, held: null };
  }
  if (actionId.startsWith("game-") && has("console")) return sofa("game", "controller") ?? { slotId: "console", act: "game", mark: { x: 0, z: 0.9, face: Math.PI, lift: 0 }, held: "controller" };
  if (actionId.startsWith("read-")) return sofa("read", "book") ?? (has("bookshelf") ? { slotId: "bookshelf", act: "read", mark: { x: 0, z: 0.7, face: 0, lift: 0 }, held: "book" } : null);
  if (actionId === "study-desk" && has("desk")) {
    const v = variant("desk");
    const mark = v === "scrap" ? { x: 0.05, z: 0.55, face: Math.PI, lift: SIT.chair.scrap } : { x: 0, z: v === "lux" ? 0.85 : 0.78, face: Math.PI, lift: SIT.chair[v === "lux" ? "lux" : "std"] };
    return { slotId: "desk", act: "type", mark, held: null };
  }
  if (actionId === "relax") return sofa("relax", null);
  return null;
}

/** Per-session play counts: rotate variants and shorten repeats on the same day. */
export class ScenePlays {
  private plays = new Map<string, number>();
  private keyN = 0;
  round(actionId: string) { return this.plays.get(`n:${actionId}`) ?? 0; }
  seenToday(actionId: string, day: number) { return (this.plays.get(`d:${actionId}:${day}`) ?? 0) > 0; }
  record(actionId: string, day: number) {
    this.plays.set(`n:${actionId}`, this.round(actionId) + 1);
    this.plays.set(`d:${actionId}:${day}`, 1);
    return ++this.keyN;
  }
}

/** Fixture-local point to world space (matches the renderer's slot group rotation). */
export function toWorld(slot: Slot, lx: number, lz: number) {
  const c = Math.cos(slot.rot), s = Math.sin(slot.rot);
  return { x: slot.x + lx * c + lz * s, z: slot.z - lx * s + lz * c };
}

export const gainsOf = (changes: string[]) =>
  changes.filter((c) => /\+\$?\d/.test(c) && !/^Time|hour/i.test(c)).slice(0, 3).map((c) => c.replace(": ", " "));

export function planCutscene(
  req: CutsceneRequest,
  plan: HomePlan,
  ctx: { visibleSlotIds: readonly string[]; luxury: Record<string, boolean>; hasBed: boolean; plays: ScenePlays; reducedMotion?: boolean },
): Cutscene | null {
  const has = (id: string) => ctx.visibleSlotIds.includes(id) && plan.slots.some((s) => s.id === id);
  const variant = (id: string): Variant => {
    if (id === "bed" && !ctx.hasBed) return "bare";
    if (plan.kind === "squat" && !ctx.luxury[id]) return "scrap";
    return ctx.luxury[id] ? "lux" : "std";
  };
  const pick = choose(req.actionId, plan, has, variant, ctx.plays.round(req.actionId));
  if (!pick) return null;
  const slot = plan.slots.find((s) => s.id === pick.slotId)!;
  const w = toWorld(slot, pick.mark.x, pick.mark.z);
  const heading = slot.rot + pick.mark.face;
  const short = ctx.plays.seenToday(req.actionId, req.before.day);
  const tired = req.after.energy < 15 && pick.act !== "sleep";
  let caption: string | null = null;
  if (STRENGTH.includes(pick.act) && Math.floor(req.after.str / 10) > Math.floor(req.before.str / 10)) caption = `NEW PERSONAL BEST · STRENGTH ${req.after.str}`;
  else if (BRAINS.includes(pick.act) && Math.floor(req.after.int / 10) > Math.floor(req.before.int / 10)) caption = `BRAIN WAVE · INTELLIGENCE ${req.after.int}`;
  else if (tired) caption = "RUNNING ON EMPTY";
  const key = ctx.plays.record(req.actionId, req.before.day);
  const lying = pick.act === "sleep" || pick.act === "bench";
  return {
    key,
    actionId: req.actionId,
    slotId: pick.slotId,
    act: pick.act,
    x: w.x, z: w.z,
    angle: (Math.PI - heading) * 180 / Math.PI,
    lift: pick.mark.lift,
    held: pick.held,
    world: pick.world?.(slot) ?? [],
    title: TITLES[pick.act],
    caption,
    gains: gainsOf(req.changes),
    duration: ctx.reducedMotion ? 1.4 : short && !caption ? 1.7 : pick.act === "sleep" ? 4.4 : 3.6,
    short: short && !caption,
    tired,
    night: pick.act === "sleep",
    frame: { dist: lying ? 5.0 : 5.6, el: lying ? 1.12 : 0.98 },
  };
}
