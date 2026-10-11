import { runAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";

export type SkillGame = "basketball" | "skateboard" | "darts";
export const GAME_INFO = {
  basketball: {
    title: "Park Basketball",
    hours: 0.5,
    energy: 8,
    goal: 3,
    best: "basketBest",
    day: "parkHoopDay",
    stat: "str",
  },
  skateboard: {
    title: "Rail Challenge",
    hours: 0.25,
    energy: 6,
    goal: 4,
    best: "skateBest",
    day: "parkSkateDay",
    stat: "cha",
  },
  darts: {
    title: "Tipsy Stick Darts",
    hours: 0.5,
    energy: 3,
    goal: 180,
    best: "dartsBest",
    day: "dartsRewardDay",
    stat: "cha",
  },
} as const;
export function skillSession(game: SkillGame): ActionDef {
  const info = GAME_INFO[game];
  return {
    id: `skill-${game}`,
    label: `Play ${info.title}`,
    hours: info.hours,
    energy: info.energy,
    resolve: (s) =>
      game === "skateboard" && (!s.skateboard || !s.skateboardEquipped)
        ? "Equip your skateboard first."
        : { patch: {}, message: "Game on." },
  };
}
export const DARTS_ACTION: ActionDef = {
  ...skillSession("darts"),
  id: "start-darts",
  note: "Aim and throw nine darts. 180 points earns Charm +1 once per day.",
};
export function startSkill(s: GameState, game: SkillGame) {
  return runAction(s, skillSession(game));
}
/** A completed run can improve its record; stat rewards are capped once per saved day. */
export function finishSkill(
  s: GameState,
  game: SkillGame,
  score: number,
): { next: GameState; rewarded: boolean } {
  const info = GAME_INFO[game];
  const safe = Math.max(
    0,
    Math.min(
      game === "darts" ? 540 : game === "basketball" ? 5 : 4,
      Number.isFinite(score) ? score : 0,
    ),
  );
  const rewarded = safe >= info.goal && s[info.day] !== s.day;
  const next = {
    ...s,
    [info.best]: Math.max(s[info.best] ?? 0, safe),
    ...(rewarded ? { [info.day]: s.day, [info.stat]: s[info.stat] + 1 } : {}),
  };
  return { next, rewarded };
}

export type Basketball = {
  time: number;
  shots: number;
  score: number;
  phase: "aim" | "flight" | "done";
  held: number | null;
  flight: number;
  power: number;
  hit: boolean | null;
};
export const newBasketball = (): Basketball => ({
  time: 0,
  shots: 0,
  score: 0,
  phase: "aim",
  held: null,
  flight: 0,
  power: 0,
  hit: null,
});
export const hoopPosition = (time: number) => 0.5 + 0.32 * Math.sin(time * 1.15);
export const shotPower = (held: number) => {
  const t = Math.max(0, held) % 2;
  return t <= 1 ? t : 2 - t;
};
export function basketballHold(s: Basketball): Basketball {
  return s.phase === "aim" && s.held === null ? { ...s, held: 0, hit: null } : s;
}
export function basketballRelease(s: Basketball): Basketball {
  if (s.phase !== "aim" || s.held === null) return s;
  const power = shotPower(s.held);
  return {
    ...s,
    held: null,
    phase: "flight",
    flight: 0,
    power,
    hit: Math.abs(power - hoopPosition(s.time + 0.75)) <= 0.075,
  };
}
export function basketballStep(s: Basketball, dt: number): Basketball {
  if (s.phase === "done") return s;
  const time = s.time + Math.max(0, dt);
  if (s.phase === "aim")
    return { ...s, time, held: s.held === null ? null : s.held + Math.max(0, dt) };
  const flight = s.flight + Math.max(0, dt);
  if (flight < 0.9) return { ...s, time, flight };
  const shots = s.shots + 1;
  return {
    ...s,
    time,
    flight: 0.9,
    shots,
    score: s.score + (s.hit ? 1 : 0),
    phase: shots === 5 ? "done" : "aim",
  };
}

export type Skate = {
  phase: "approach" | "grind" | "done";
  time: number;
  balance: number;
  velocity: number;
  score: number;
  landed: boolean;
  entry: number;
};
export const newSkate = (): Skate => ({
  phase: "approach",
  time: 0,
  balance: 0,
  velocity: 0,
  score: 0,
  landed: false,
  entry: 0,
});
export const JUMP_WINDOW = [1.1, 1.55] as const;
export function skateJump(s: Skate): Skate {
  if (s.phase !== "approach") return s;
  return s.time >= JUMP_WINDOW[0] && s.time <= JUMP_WINDOW[1]
    ? { ...s, phase: "grind", time: 0, balance: 0.12, velocity: 0.25, entry: s.time }
    : { ...s, phase: "done" };
}
export function skateStep(s: Skate, dt: number, input: number): Skate {
  if (s.phase === "done") return s;
  if (s.phase === "approach") {
    const time = s.time + Math.max(0, dt);
    return { ...s, time, phase: time > 1.8 ? "done" : "approach" };
  }
  // Substeps make the balance physics consistent across frame rates.
  let next = { ...s },
    remaining = Math.max(0, Math.min(dt, 0.25));
  while (remaining > 0 && next.phase !== "done") {
    const h = Math.min(remaining, 1 / 120);
    remaining -= h;
    const time = Math.min(4, next.time + h);
    const disturbance = 0.9 * Math.cos(time * 0.8) + 0.6 * Math.sin(time * 2.5);
    const velocity =
      (next.velocity +
        (disturbance + next.balance * 0.5 + Math.max(-1, Math.min(1, input)) * 2.8) * h) *
      Math.exp(-1.4 * h);
    const balance = next.balance + velocity * h;
    const fell = Math.abs(balance) >= 1;
    next = {
      ...next,
      time,
      velocity,
      balance,
      score: fell ? Math.min(time, 3.999) : time,
      landed: !fell && time >= 4,
      phase: fell || time >= 4 ? "done" : "grind",
    };
  }
  return next;
}

export const DART_SEGMENTS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17, 3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;
export function dartScore(x: number, y: number): number {
  const r = Math.hypot(x, y);
  if (!Number.isFinite(r) || r > 1) return 0;
  if (r <= 0.0374) return 50;
  if (r <= 0.0935) return 25;
  const angle = (Math.atan2(x, -y) + Math.PI / 20 + Math.PI * 2) % (Math.PI * 2);
  const value = DART_SEGMENTS[Math.floor(angle / (Math.PI / 10)) % 20]!;
  return value * (r >= 0.953 ? 2 : r >= 0.582 && r <= 0.629 ? 3 : 1);
}
export type Darts = {
  time: number;
  aimX: number;
  aimY: number;
  throws: { x: number; y: number; score: number }[];
  phase: "aim" | "done";
};
export const newDarts = (): Darts => ({ time: 0, aimX: 0, aimY: -0.6, throws: [], phase: "aim" });
export function dartCursor(s: Darts) {
  return { x: s.aimX + 0.065 * Math.sin(s.time * 3.2), y: s.aimY + 0.065 * Math.cos(s.time * 4.1) };
}
export function dartsAim(s: Darts, x: number, y: number): Darts {
  return s.phase === "done"
    ? s
    : { ...s, aimX: Math.max(-1.2, Math.min(1.2, x)), aimY: Math.max(-1.2, Math.min(1.2, y)) };
}
export function dartsThrow(s: Darts): Darts {
  if (s.phase === "done") return s;
  const p = dartCursor(s),
    throws = [...s.throws, { ...p, score: dartScore(p.x, p.y) }];
  return { ...s, throws, phase: throws.length === 9 ? "done" : "aim" };
}
export const dartsTotal = (s: Darts) => s.throws.reduce((total, t) => total + t.score, 0);
