import { simulateFlight } from "./basketball-physics";
/**
 * Basketball shooting model (all pure).
 *
 * Side-on court in a 400x300 box. The shooter stands at the left and the hoop slides left and right.
 * Hold to charge: the power meter sweeps 0 → 1 → 0 like a triangle wave. Release launches the ball at a
 * fixed 60° angle with a speed set by the power. Where the ball comes down at rim height, compared with
 * where the (moving) hoop is *when the ball arrives*, decides the shot. So three things matter:
 * the hoop's horizontal position, the power you released at, and your timing.
 */
export type Difficulty = "easy" | "normal" | "hard";

export const COURT = { w: 400, h: 300, floorY: 268, shooterX: 70, releaseX: 84, releaseY: 212, rimY: 118 } as const;
export const BALL_R = 9;
export const RIM_HALF = 22;
export const GRAVITY = 900;
const ANGLE = (60 * Math.PI) / 180;
const V_MIN = 380;
const V_MAX = 700;
/** Seconds for the power meter to sweep 0 → 1 → 0. */
export const METER_PERIOD_MS = 2200;

export const LEVELS: Record<Difficulty, { amp: number; periodMs: number; swish: number; made: number; showGuide: boolean }> = {
  easy: { amp: 28, periodMs: 7000, swish: 18, made: 30, showGuide: true },
  normal: { amp: 46, periodMs: 5500, swish: 14, made: 24, showGuide: true },
  hard: { amp: 56, periodMs: 4200, swish: 11, made: 20, showGuide: false },
};
const HOOP_CENTRE = 296;

/** Triangle wave 0 → 1 → 0 for how long the shot has been charged. */
export function powerAt(heldMs: number): number {
  const phase = ((Math.max(0, heldMs) % METER_PERIOD_MS) / METER_PERIOD_MS) * 2;
  return phase <= 1 ? phase : 2 - phase;
}

/** Hoop centre x at a point in play time. The hoop never stops moving, so the target is always live. */
export function hoopX(tMs: number, level: Difficulty): number {
  const l = LEVELS[level];
  return HOOP_CENTRE + l.amp * Math.sin((2 * Math.PI * tMs) / l.periodMs);
}

export const speedFor = (power: number) => V_MIN + Math.max(0, Math.min(1, power)) * (V_MAX - V_MIN);

/** Flight time to rim height on the way down, or null if the shot cannot reach rim height. */
export function flightToRim(power: number): number | null {
  const v = speedFor(power);
  const vy = v * Math.sin(ANGLE);
  const rise = COURT.releaseY - COURT.rimY;
  const disc = vy * vy - 2 * GRAVITY * rise;
  if (disc < 0) return null;
  return (vy + Math.sqrt(disc)) / GRAVITY;
}

/** Where the ball is horizontally when it comes down through rim height, or null if it never gets there. */
export function landingX(power: number): number | null {
  const t = flightToRim(power);
  if (t === null) return null;
  return COURT.releaseX + speedFor(power) * Math.cos(ANGLE) * t;
}

/** The power that would drop the ball in the hoop's centre given where the hoop will be on arrival. */
export function idealPower(tMs: number, level: Difficulty): number {
  let lo = 0.3;
  let hi = 1;
  const err = (p: number) => {
    const x = landingX(p);
    const t = flightToRim(p);
    if (x === null || t === null) return -1e6;
    return x - hoopX(tMs + t * 1000, level);
  };
  for (let i = 0; i < 28; i++) {
    const mid = (lo + hi) / 2;
    if (err(mid) < 0) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
}

export type ShotResult = "swish" | "rim-in" | "short" | "long" | "rim-out" | "airball";
export type Shot = {
  power: number;
  releaseMs: number;
  result: ShotResult;
  made: boolean;
  /** Ball x − hoop x at rim height (negative = short). */
  miss: number;
  arriveMs: number;
  hoopAtArrival: number;
  reason: string;
};

export function evaluateShot(power: number, releaseMs: number, level: Difficulty): Shot {
  const p = Math.max(0, Math.min(1, power));
  const t = flightToRim(p);
  const x = landingX(p);
  if (t === null || x === null) {
    return {
      power: p, releaseMs, result: "airball", made: false, miss: -999, arriveMs: releaseMs + 900,
      hoopAtArrival: hoopX(releaseMs + 900, level),
      reason: "Way too weak: the ball never reached the rim. Hold longer.",
    };
  }
  const arriveMs = releaseMs + t * 1000;
  const hx = hoopX(arriveMs, level);
  const dx = x - hx;
  const l = LEVELS[level];
  const abs = Math.abs(dx);
  const px = Math.round(abs);
  let result: ShotResult;
  let reason: string;
  if (abs <= l.swish) {
    result = "swish";
    reason = "Swish! Power and timing were right on the hoop.";
  } else if (abs <= l.made) {
    result = "rim-in";
    reason = "Rim in. A little rough, but it counts.";
  } else if (abs <= l.made + 14) {
    result = "rim-out";
    reason =
      dx < 0
        ? `Rattled the front rim and out (${px}px short). A touch more power.`
        : `Rolled off the back of the rim (${px}px long). A touch less power.`;
  } else if (dx < 0) {
    result = "short";
    reason = `Short by ${px}px. Release later for more power, or wait for the hoop to swing closer.`;
  } else {
    result = "long";
    reason = `Long by ${px}px. Release sooner for less power, or wait for the hoop to swing back.`;
  }
  return { power: p, releaseMs, result, made: result === "swish" || result === "rim-in", miss: dx, arriveMs, hoopAtArrival: hx, reason };
}

/**
 * Resolve the actual simulated trajectory rather than trusting the legacy
 * ideal-power classification. The legacy predictor still drives the aim guide.
 */
export function evaluatePhysicalShot(power: number, releaseMs: number, level: Difficulty): Shot {
  const predicted = evaluateShot(power, releaseMs, level);
  const simulation = simulateFlight({
    releaseX: COURT.releaseX,
    releaseY: COURT.releaseY,
    floorY: COURT.floorY,
    rimY: COURT.rimY,
    radius: BALL_R,
    rimHalf: RIM_HALF,
    gravity: GRAVITY,
    speed: speedFor(predicted.power),
    angle: ANGLE,
    hoopX: predicted.hoopAtArrival,
  });
  const rimTouched = simulation.contacts.some((c) => c === "front-rim" || c === "back-rim");
  const banked = simulation.contacts.includes("backboard");
  const made = simulation.crossedNet;
  const result: ShotResult = made ? (rimTouched || banked ? "rim-in" : "swish") :
    rimTouched ? "rim-out" : predicted.result === "airball" ? "airball" :
    predicted.miss < 0 ? "short" : "long";
  const reason = made
    ? result === "swish" ? "Nothing but net!" : banked ? "Off the glass and in!" : "Rattled the iron and dropped!"
    : rimTouched ? "Clanged off the rim and bounced out."
    : predicted.reason;
  return { ...predicted, result, made, reason };
}

export type Pt = { x: number; y: number };

/**
 * Whole ball path at 60 samples a second, ready to play back: the arc, then either through the net
 * (made) or a bounce off the rim / backboard / floor (missed). Pure and deterministic.
 */
export function ballPath(shot: Shot): Pt[] {
  const flight = simulateFlight({
    releaseX: COURT.releaseX,
    releaseY: COURT.releaseY,
    floorY: COURT.floorY,
    rimY: COURT.rimY,
    radius: BALL_R,
    rimHalf: RIM_HALF,
    gravity: GRAVITY,
    speed: speedFor(shot.power),
    angle: ANGLE,
    hoopX: shot.hoopAtArrival,
  });
  return flight.frames.map(({ x, y }) => ({ x, y }));
}

/** Number of samples in the arc before the ball reaches the rim, used to time the net animation. */
export const TIMED_SECONDS = 30;
export const FIVE_SHOTS = 5;
