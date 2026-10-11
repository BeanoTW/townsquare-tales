/**
 * Rail grind model (all pure, no timers, no DOM).
 *
 * A run has four stages: approach (the board rolls towards the rail), jump (press jump inside the glowing
 * window), grind (about four seconds of continuous balancing) and then either a clean landing or a fall.
 *
 * Balance is a small inverted pendulum. `b` is the marker position from -1 (far left) to +1 (far right).
 * Left alone it drifts away from the centre faster and faster, and a gentle wobble pushes it around, so the
 * player must keep leaning against it for the whole grind. A single tap or a held key cannot work: it
 * over-corrects. The instability climbs through the grind and with the level.
 */
export const GRIND_MS = 4000;
export const APPROACH_MS = 1500;
export const JUMP_MS = 450;
export const LANDING_MS = 600;
export const FALL_MS = 900;
/** The central safe zone is |b| <= SAFE. Leaving it for GRACE_MS in a row, or reaching |b| = 1, is a fall. */
export const SAFE = 0.38;
export const GRACE_MS = 260;
export const MAX_LEVEL = 5;

const LEAN = 6.2; // push from a full lean, per second²
const DAMP = 1.1;

export type RailLevel = { gain0: number; gain1: number; wobble: number; windowMs: number; name: string; trick: string };

/** Index 1..5. Higher levels are twitchier and the jump window is tighter. */
export const RAIL_LEVELS: Record<number, RailLevel> = {
  1: { gain0: 2.2, gain1: 2.0, wobble: 0.9, windowMs: 520, name: "Kerb rail", trick: "50-50" },
  2: { gain0: 2.6, gain1: 2.4, wobble: 1.1, windowMs: 470, name: "Handrail", trick: "Boardslide" },
  3: { gain0: 3.0, gain1: 2.8, wobble: 1.25, windowMs: 420, name: "Long rail", trick: "Nosegrind" },
  4: { gain0: 3.4, gain1: 3.1, wobble: 1.4, windowMs: 380, name: "Tall rail", trick: "Crooked grind" },
  5: { gain0: 3.8, gain1: 3.4, wobble: 1.5, windowMs: 340, name: "Rusty monster", trick: "Smith grind" },
};
export const levelInfo = (level: number): RailLevel => RAIL_LEVELS[clampLevel(level)]!;
export const clampLevel = (level: number) => Math.max(1, Math.min(MAX_LEVEL, Math.trunc(level) || 1));

/** Highest level the player may choose: one above the best they have cleared. */
export const unlockedLevel = (railLevel: number) => Math.min(MAX_LEVEL, Math.max(0, Math.trunc(railLevel) || 0) + 1);

export type Phase = "approach" | "jump" | "grind" | "landing" | "fall" | "done";
export type JumpQuality = "perfect" | "good" | "late";
export type Outcome = "clean" | "fell" | "missed-jump";

export type RailRun = {
  level: number;
  phase: Phase;
  /** ms spent in the current phase. */
  t: number;
  b: number;
  v: number;
  grindMs: number;
  /** ms spent inside the safe zone while grinding. */
  safeMs: number;
  /** longest continuous ms inside the safe zone. */
  streakMs: number;
  streakNow: number;
  outMs: number;
  jump: JumpQuality | null;
  outcome: Outcome | null;
  /** direction the marker was going when it fell (-1 / 1). */
  fellTo: -1 | 1 | 0;
  /** Random wobble parameters for this run. */
  p1: number;
  p2: number;
  f1: number;
  f2: number;
  kick: number;
  early: boolean;
};

export function newRun(level: number, rng: () => number = Math.random): RailRun {
  return {
    level: clampLevel(level),
    phase: "approach",
    t: 0,
    b: 0,
    v: 0,
    grindMs: 0,
    safeMs: 0,
    streakMs: 0,
    streakNow: 0,
    outMs: 0,
    jump: null,
    outcome: null,
    fellTo: 0,
    p1: rng() * Math.PI * 2,
    p2: rng() * Math.PI * 2,
    f1: 0.55 + rng() * 0.25,
    f2: 1.15 + rng() * 0.4,
    kick: (rng() < 0.5 ? -1 : 1) * (0.06 + rng() * 0.04),
    early: false,
  };
}

/** Where the jump window sits within the approach. */
export function jumpWindow(level: number): { open: number; perfectFrom: number; perfectTo: number; close: number } {
  const w = levelInfo(level).windowMs;
  const close = APPROACH_MS + 120;
  const open = APPROACH_MS - w;
  const mid = APPROACH_MS - w * 0.32;
  return { open, perfectFrom: mid - w * 0.17, perfectTo: mid + w * 0.17, close };
}

export type PressResult = "jumped" | "early" | "ignored";

/** Player pressed jump. Too early is ignored (the board keeps rolling) so a mis-tap does not ruin the run. */
export function pressJump(run: RailRun, rng: () => number = Math.random): PressResult {
  if (run.phase !== "approach") return "ignored";
  const w = jumpWindow(run.level);
  if (run.t < w.open) {
    run.early = true;
    return "early";
  }
  run.jump = run.t >= w.perfectFrom && run.t <= w.perfectTo ? "perfect" : run.t < w.perfectFrom ? "good" : "late";
  const off = run.jump === "perfect" ? 0 : run.jump === "good" ? 0.1 : 0.2;
  run.b = (rng() < 0.5 ? -1 : 1) * off;
  run.phase = "jump";
  run.t = 0;
  return "jumped";
}

/** Instability gain, 0 → 1 through the grind. */
export const progress = (grindMs: number) => Math.max(0, Math.min(1, grindMs / GRIND_MS));

export function instability(level: number, grindMs: number): number {
  const l = levelInfo(level);
  return l.gain0 + l.gain1 * progress(grindMs);
}

/** Gentle deterministic wobble, scaled by the level. */
export function wobble(run: RailRun, grindMs: number): number {
  const l = levelInfo(run.level);
  const s = grindMs / 1000;
  const w = (Math.sin(run.f1 * Math.PI * 2 * s + run.p1) + 0.6 * Math.sin(run.f2 * Math.PI * 2 * s + run.p2)) / 1.6;
  return w * l.wobble * (0.25 + 1.15 * progress(grindMs));
}

/**
 * Advance the run by dtMs. `input` is the lean from -1 (full left) to 1 (full right); analogue values
 * (touch drag) are fine. Mutates and returns the same run. Large dt values are split for stability.
 */
export function stepRun(run: RailRun, dtMs: number, input: number): RailRun {
  let left = Math.max(0, dtMs);
  while (left > 0) {
    const d = Math.min(left, 16);
    left -= d;
    stepOnce(run, d, Math.max(-1, Math.min(1, Number.isFinite(input) ? input : 0)));
  }
  return run;
}

function stepOnce(run: RailRun, d: number, input: number) {
  run.t += d;
  switch (run.phase) {
    case "approach": {
      const w = jumpWindow(run.level);
      if (run.t > w.close) {
        run.phase = "fall";
        run.t = 0;
        run.outcome = "missed-jump";
      }
      return;
    }
    case "jump":
      if (run.t >= JUMP_MS) {
        run.phase = "grind";
        run.t = 0;
        run.v = run.kick;
      }
      return;
    case "grind": {
      const dt = d / 1000;
      run.grindMs += d;
      const drift = Math.sign(run.kick) * (0.5 + 0.1 * run.level);
      const acc = instability(run.level, run.grindMs) * run.b + wobble(run, run.grindMs) + drift + input * LEAN;
      run.v += acc * dt;
      run.v -= run.v * DAMP * dt;
      run.b += run.v * dt;
      const inZone = Math.abs(run.b) <= SAFE;
      if (inZone) {
        run.safeMs += d;
        run.streakNow += d;
        run.streakMs = Math.max(run.streakMs, run.streakNow);
        run.outMs = 0;
      } else {
        run.streakNow = 0;
        run.outMs += d;
      }
      if (Math.abs(run.b) >= 1 || run.outMs >= GRACE_MS) {
        run.fellTo = run.b < 0 ? -1 : 1;
        run.b = Math.max(-1.15, Math.min(1.15, run.b));
        run.phase = "fall";
        run.t = 0;
        run.outcome = "fell";
        return;
      }
      if (run.grindMs >= GRIND_MS) {
        run.grindMs = GRIND_MS;
        run.phase = "landing";
        run.t = 0;
        run.outcome = "clean";
      }
      return;
    }
    case "landing":
      if (run.t >= LANDING_MS) run.phase = "done";
      return;
    case "fall":
      if (run.t >= FALL_MS) run.phase = "done";
      return;
    case "done":
      return;
  }
}

/** Score shown on the result card: clean time plus a level bonus for finishing. */
export function scoreRun(run: RailRun): number {
  const base = Math.round(run.safeMs / 10);
  return run.outcome === "clean" ? base + run.level * 50 + (run.jump === "perfect" ? 25 : 0) : base;
}

/** Cosmetic trick for the level, with a flourish for a perfect jump. Purely visual. */
export function trickName(run: RailRun): string {
  const t = levelInfo(run.level).trick;
  return run.jump === "perfect" ? `${t} (perfect)` : t;
}

/** One-line reason shown to the player so a fall is never a mystery. */
export function fallReason(run: RailRun): string {
  if (run.outcome === "missed-jump") return "You never jumped. The rail waits for no one.";
  if (run.outcome === "fell")
    return run.fellTo < 0 ? "You drifted left and ran out of rail. Lean right sooner." : "You drifted right and ran out of rail. Lean left sooner.";
  return "";
}

/* ----------------------------- Presentation ----------------------------- */
/** Side-view scene, in a 400 x 300 box. Kept here so the pose maths can be tested without a DOM. */
export const SCENE = { w: 400, h: 300, ground: 250, railY: 206, railX0: 175, railX1: 335, startX: 30, takeoffX: 148 } as const;
const BOARD_ON_GROUND = SCENE.ground - 8;
const BOARD_ON_RAIL = SCENE.railY - 7;
const LEAN_DEG = 24;
const lerp = (a: number, b: number, u: number) => a + (b - a) * u;
const clamp01 = (u: number) => Math.max(0, Math.min(1, u));

export type Pose = { x: number; y: number; angle: number; sparks: boolean; airborne: boolean; celebrate: boolean };

/**
 * Where the board is and how it is tilted. The rider is drawn inside the same group as the board, so
 * the single `angle` rotates both together and their relative pose never changes.
 */
export function poseAt(run: RailRun): Pose {
  const span0 = SCENE.railX0 + 10;
  const span1 = SCENE.railX1 - 10;
  switch (run.phase) {
    case "approach":
      return { x: lerp(SCENE.startX, SCENE.takeoffX, clamp01(run.t / APPROACH_MS)), y: BOARD_ON_GROUND, angle: -3, sparks: false, airborne: false, celebrate: false };
    case "jump": {
      const u = clamp01(run.t / JUMP_MS);
      return {
        x: lerp(SCENE.takeoffX, span0, u),
        y: lerp(BOARD_ON_GROUND, BOARD_ON_RAIL, u) - 144 * u * (1 - u),
        angle: -12 * Math.sin(Math.PI * u) + run.b * LEAN_DEG * u,
        sparks: false,
        airborne: true,
        celebrate: false,
      };
    }
    case "grind":
      return { x: lerp(span0, span1, progress(run.grindMs)), y: BOARD_ON_RAIL, angle: Math.max(-1, Math.min(1, run.b)) * LEAN_DEG, sparks: true, airborne: false, celebrate: false };
    case "landing": {
      const u = clamp01(run.t / LANDING_MS);
      return {
        x: lerp(span1, span1 + 52, u),
        y: lerp(BOARD_ON_RAIL, BOARD_ON_GROUND, u * u) - 26 * u * (1 - u),
        angle: lerp(run.b * LEAN_DEG, -2, Math.min(1, u * 1.6)),
        sparks: false,
        airborne: u < 0.85,
        celebrate: u > 0.5,
      };
    }
    case "fall":
    case "done": {
      const u = clamp01(run.phase === "done" ? 1 : run.t / FALL_MS);
      if (run.outcome === "missed-jump") {
        return { x: SCENE.railX0 - 22 + 6 * u, y: BOARD_ON_GROUND, angle: 78 * Math.min(1, u * 1.5), sparks: false, airborne: false, celebrate: false };
      }
      const dir = run.fellTo || 1;
      const x0 = lerp(span0, span1, progress(run.grindMs));
      return {
        x: x0 + dir * 46 * u,
        y: lerp(BOARD_ON_RAIL, BOARD_ON_GROUND, u * u) - 18 * Math.sin(Math.PI * Math.min(1, u * 1.2)) * (1 - u),
        angle: dir * (LEAN_DEG + 190 * u),
        sparks: false,
        airborne: u < 0.7,
        celebrate: false,
      };
    }
  }
}
