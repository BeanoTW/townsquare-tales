/**
 * Darts rules and aiming model (all pure; every random draw takes an injected rng).
 *
 * Board coordinates: the centre is (0, 0), +x is right, +y is down, and a radius of 1 is the outside edge
 * of the double ring. The numbered rim and the cork surround reach out to BOARD_R; beyond that is wall.
 */
export const SEGMENTS = [20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5] as const;

/** Real board proportions (mm / 170). */
export const RADII = {
  bull: 6.35 / 170,
  outerBull: 15.9 / 170,
  trebleInner: 99 / 170,
  trebleOuter: 107 / 170,
  doubleInner: 162 / 170,
  doubleOuter: 1,
} as const;
/** Edge of the numbered rim. Landing beyond this means the dart missed the board entirely. */
export const BOARD_R = 1.32;

export type Ring = "bull" | "outer-bull" | "treble" | "double" | "single" | "rim" | "off";
export type Dart = {
  x: number;
  y: number;
  ring: Ring;
  /** Segment number 1..20, or 25/50 for the bull, or 0. */
  number: number;
  points: number;
  /** Short label such as T20, D16, 25, Bull, S5, Rim or Miss. */
  label: string;
  /** True when the dart missed the board altogether. */
  offBoard: boolean;
  /** Counts as a double for finishing (doubles and the inner bull). */
  isDouble: boolean;
};

export function segmentAt(x: number, y: number): number {
  const angle = Math.atan2(x, -y); // clockwise from straight up
  const twentieth = (angle + Math.PI / 20 + Math.PI * 2) % (Math.PI * 2);
  return SEGMENTS[Math.floor(twentieth / (Math.PI / 10)) % 20]!;
}

export function scoreAt(x: number, y: number): Dart {
  const r = Math.hypot(x, y);
  const base = { x, y, offBoard: r > BOARD_R };
  if (r <= RADII.bull) return { ...base, ring: "bull", number: 50, points: 50, label: "Bull", isDouble: true };
  if (r <= RADII.outerBull) return { ...base, ring: "outer-bull", number: 25, points: 25, label: "25", isDouble: false };
  if (r > RADII.doubleOuter) {
    return { ...base, ring: r > BOARD_R ? "off" : "rim", number: 0, points: 0, label: r > BOARD_R ? "Miss" : "Rim", isDouble: false };
  }
  const n = segmentAt(x, y);
  if (r >= RADII.doubleInner) return { ...base, ring: "double", number: n, points: n * 2, label: `D${n}`, isDouble: true };
  if (r >= RADII.trebleInner && r <= RADII.trebleOuter) return { ...base, ring: "treble", number: n, points: n * 3, label: `T${n}`, isDouble: false };
  return { ...base, ring: "single", number: n, points: n, label: `S${n}`, isDouble: false };
}

/** Centre of a segment's ring, handy for tests and for the practice hint. */
export function aimPoint(number: number, ring: "single" | "double" | "treble"): { x: number; y: number } {
  if (number === 50) return { x: 0, y: 0 };
  const i = SEGMENTS.indexOf(number as (typeof SEGMENTS)[number]);
  const a = (i * Math.PI) / 10;
  const r = ring === "treble" ? (RADII.trebleInner + RADII.trebleOuter) / 2 : ring === "double" ? (RADII.doubleInner + 1) / 2 : 0.8;
  return { x: Math.sin(a) * r, y: -Math.cos(a) * r };
}

/* -------------------------------- Aiming -------------------------------- */
export type Difficulty = "easy" | "normal" | "hard";
export const LEVELS: Record<Difficulty, { speed: number; sigma: number; label: string }> = {
  easy: { speed: 0.75, sigma: 0.045, label: "Easy" },
  normal: { speed: 1, sigma: 0.06, label: "Normal" },
  hard: { speed: 1.3, sigma: 0.08, label: "Hard" },
};
/** How long a hold takes to fully steady the throw. */
export const STEADY_MS = 1100;
/** Holding longer than this tires the arm and the aim gets wobbly again. */
export const TIRE_AFTER_MS = 2300;
/** Releasing sooner than this is a flinch: a wild throw. */
export const FLINCH_MS = 160;
/** How much of the sweep survives when fully steady (the reticle slows to this fraction of speed). */
export const STEADY_SLOWDOWN = 0.2;

export type Aimer = { tau: number; heldMs: number; holding: boolean; level: Difficulty; px: number; py: number };

export function newAimer(level: Difficulty, rng: () => number = Math.random): Aimer {
  return { tau: rng() * 20, heldMs: 0, holding: false, level, px: rng() * Math.PI * 2, py: rng() * Math.PI * 2 };
}

/** 0 → 1 as the hold steadies the throw. */
export const steadiness = (a: Aimer) => (a.holding ? Math.min(1, a.heldMs / STEADY_MS) : 0);
export const tiredness = (a: Aimer) => (a.holding ? Math.max(0, Math.min(1, (a.heldMs - TIRE_AFTER_MS) / 1500)) : 0);

export function stepAimer(a: Aimer, dtMs: number): Aimer {
  const s = steadiness(a);
  const rate = LEVELS[a.level].speed * (1 - (1 - STEADY_SLOWDOWN) * s);
  a.tau += (dtMs / 1000) * rate;
  if (a.holding) a.heldMs += dtMs;
  return a;
}
export function press(a: Aimer) {
  a.holding = true;
  a.heldMs = 0;
}

/** Where the reticle is right now: a lazy Lissajous sweep across the board. */
export function reticle(a: Aimer): { x: number; y: number } {
  const tr = tiredness(a);
  const shake = tr * 0.07;
  return {
    x: 0.82 * Math.sin(a.tau * 1.55 + a.px) + Math.sin(a.tau * 31) * shake,
    y: 0.78 * Math.sin(a.tau * 1.15 + a.py) + Math.cos(a.tau * 27) * shake,
  };
}

/** Standard deviation of the throw scatter right now, in board units. */
export function sigmaNow(a: Aimer): number {
  const base = LEVELS[a.level].sigma;
  const flinch = a.holding && a.heldMs < FLINCH_MS ? 2.2 : 1;
  return base * (1 - 0.7 * steadiness(a)) * flinch * (1 + 1.5 * tiredness(a));
}

/** Box-Muller normal draw. */
export function gauss(rng: () => number): number {
  const u = Math.max(1e-9, rng());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rng());
}

/** Release the throw: where the dart lands is the reticle plus scatter. Ends the hold. */
export function release(a: Aimer, rng: () => number = Math.random): Dart & { aimX: number; aimY: number; sigma: number } {
  const aim = reticle(a);
  const sigma = sigmaNow(a);
  const x = aim.x + gauss(rng) * sigma;
  const y = aim.y + gauss(rng) * sigma;
  a.holding = false;
  a.heldMs = 0;
  return { ...scoreAt(x, y), aimX: aim.x, aimY: aim.y, sigma };
}

/* --------------------------------- Rules --------------------------------- */
export const START_301 = 301;
export const DARTS_PER_TURN = 3;

export type Turn = { darts: Dart[]; startRemaining: number };
export type TurnResult =
  | { kind: "ok"; remaining: number; turnOver: boolean; scored: number }
  | { kind: "bust"; remaining: number; reason: "over" | "one" | "no-double"; turnOver: true; scored: 0 }
  | { kind: "win"; remaining: 0; turnOver: true; scored: number };

/**
 * Apply one dart in a 301 leg with double-out. Busting (going below zero, leaving 1, or reaching zero
 * without a double) sends the score back to where the turn started and ends the turn.
 */
export function applyDart(turn: Turn, dart: Dart): TurnResult {
  const before = turn.startRemaining - turn.darts.reduce((n, d) => n + d.points, 0);
  turn.darts.push(dart);
  const after = before - dart.points;
  if (after < 0) return { kind: "bust", remaining: turn.startRemaining, reason: "over", turnOver: true, scored: 0 };
  if (after === 1) return { kind: "bust", remaining: turn.startRemaining, reason: "one", turnOver: true, scored: 0 };
  if (after === 0) {
    if (dart.isDouble) return { kind: "win", remaining: 0, turnOver: true, scored: turn.startRemaining };
    return { kind: "bust", remaining: turn.startRemaining, reason: "no-double", turnOver: true, scored: 0 };
  }
  return { kind: "ok", remaining: after, turnOver: turn.darts.length >= DARTS_PER_TURN, scored: turn.startRemaining - after };
}

export const threeDartScore = (ds: readonly Dart[]) => ds.reduce((n, d) => n + d.points, 0);

/* ----------------------------------- Gus ----------------------------------- */
/** Gus's three-dart visit for "highest score". Mostly mediocre, occasionally magnificent. */
export function gusThreeDarts(rng: () => number): number {
  const p = Math.round(40 + gauss(rng) * 17);
  return Math.max(0, Math.min(180, rng() < 0.04 ? 100 + Math.floor(rng() * 40) : p));
}

/** Gus's visit in 301: returns the new remaining score and what happened. Never goes below zero, and only finishes on a double. */
export function gusVisit(remaining: number, rng: () => number): { remaining: number; bust: boolean; won: boolean; scored: number } {
  // Close to the finish he aims at a double and usually fluffs it.
  if (remaining <= 40 && remaining % 2 === 0) {
    if (rng() < 0.3) return { remaining: 0, bust: false, won: true, scored: remaining };
    const nibble = rng() < 0.5 ? 0 : 2 * Math.floor(rng() * Math.max(1, remaining / 4));
    const left = remaining - nibble;
    return left >= 2 ? { remaining: left, bust: false, won: false, scored: nibble } : { remaining, bust: true, won: false, scored: 0 };
  }
  const p = Math.max(0, Math.min(120, Math.round(36 + gauss(rng) * 18)));
  const left = remaining - p;
  if (left < 2) {
    // would bust or leave one: he busts, or plays safe and scores less
    if (rng() < 0.55) return { remaining, bust: true, won: false, scored: 0 };
    const safe = Math.max(0, remaining - 2 - Math.floor(rng() * 20));
    const l2 = remaining - Math.min(safe, remaining - 2);
    return { remaining: Math.max(2, l2), bust: false, won: false, scored: remaining - Math.max(2, l2) };
  }
  return { remaining: left, bust: false, won: false, scored: p };
}

/* ----------------------------- Banter and crowd ----------------------------- */
export type Banter = { gus: string; crowd: string | null };

const pick = <T,>(xs: readonly T[], rng: () => number) => xs[Math.floor(rng() * xs.length) % xs.length]!;

const FULL_MISS_GUS = [
  "Gus puts his pint down very slowly. \"That's the wall, pal. The board is the round thing.\"",
  "Gus: \"I've seen pigeons with better aim. And they were aiming at me.\"",
  "Gus stares at the dart in the plaster for a full five seconds. Says nothing. It's worse.",
  "Gus: \"Do you want me to move the board? Closer? To your hand?\"",
];
const FULL_MISS_CROWD = [
  "The whole pub goes quiet. Somebody drops a peanut.",
  "A man by the jukebox slowly shakes his head.",
  "Someone at the bar says \"oof\" and means it.",
];
const BAD_GUS = [
  "Gus: \"Ah. Bold choice. Wrong, but bold.\"",
  "Gus: \"Was that the plan? Be honest.\"",
  "Gus: \"Nice one. If you were aiming for the rim, that is.\"",
];
const MEH_GUS = ["Gus shrugs. \"Seen worse. Not today, but I have.\"", "Gus: \"Points are points. Small ones, but points.\"", "Gus: \"Respectable. Don't let it go to your head.\""];
const GOOD_GUS = ["Gus raises an eyebrow. \"Hm. Lucky.\"", "Gus: \"Not bad. I'll allow it.\"", "Gus: \"Careful. You'll start getting ideas.\""];
const GREAT_GUS = ["Gus chokes on his pint. \"Do that again. Go on.\"", "Gus: \"Right, who taught you that? Name names.\""];
const BUST_GUS = ["Gus: \"Bust! Back where you started. Lovely.\"", "Gus wheezes with laughter. \"Bust. Course it is.\""];
const WIN_GUS = ["Gus: \"Well. Buy yourself something nice. Not here, though.\"", "Gus, through gritted teeth: \"Fluke. Next time.\""];
const LOSE_GUS = ["Gus: \"Better luck next time. And by luck I mean practice.\"", "Gus pockets the stake with a very smug face."];
const CROWD_GOOD = ["The regulars cheer, slightly sarcastically.", "A ripple of applause from the corner table.", "Somebody bangs a pint glass on the bar."];
const CROWD_BAD = ["A groan rolls round the bar.", "Someone laughs. Not with you.", "The bar goes \"ooooh\" in perfect harmony."];

/** What Gus and the crowd say about a throw. The line explains the outcome so it is never a mystery. */
export function banterFor(d: Dart, rng: () => number, opts: { bust?: boolean } = {}): Banter {
  if (opts.bust) return { gus: pick(BUST_GUS, rng), crowd: pick(CROWD_BAD, rng) };
  if (d.offBoard) return { gus: pick(FULL_MISS_GUS, rng), crowd: pick(FULL_MISS_CROWD, rng) };
  if (d.points >= 50 || d.ring === "treble" && d.number >= 19) return { gus: pick(GREAT_GUS, rng), crowd: pick(CROWD_GOOD, rng) };
  if (d.points >= 30) return { gus: pick(GOOD_GUS, rng), crowd: rng() < 0.6 ? pick(CROWD_GOOD, rng) : null };
  if (d.points >= 10) return { gus: pick(MEH_GUS, rng), crowd: null };
  return { gus: pick(BAD_GUS, rng), crowd: rng() < 0.5 ? pick(CROWD_BAD, rng) : null };
}
export const gusMatchLine = (won: boolean | null, rng: () => number) => (won === null ? "Gus: \"A draw. Nobody's happy. That's pub darts.\"" : won ? pick(WIN_GUS, rng) : pick(LOSE_GUS, rng));
export const ONE_EIGHTY = "ONE HUNDRED AND EIGHTY! The whole pub erupts. Gus pretends he wasn't watching.";
