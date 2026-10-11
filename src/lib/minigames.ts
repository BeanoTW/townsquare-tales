import { runAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";

/**
 * Shared rules for the arcade minigames (basketball, rail grind, darts).
 *
 * - Playing costs in-game time and energy through the ordinary action rules, charged once when a
 *   session begins. The real-world clock never advances the game clock.
 * - Records live in the normal save (see GameState). Old saves read as zero.
 * - Stat rewards reuse the existing stats and are capped to one per day per game, using the
 *   same saved day-stamps the park activities already used, so practice cannot be farmed.
 */
export type MinigameId = "basketball" | "rail" | "darts";

export const SESSIONS: Record<
  MinigameId,
  { hours: number; energy: number; label: string; failure: string }
> = {
  basketball: { hours: 0.5, energy: 8, label: "Shoot hoops", failure: "Too tired to shoot hoops." },
  rail: { hours: 0.25, energy: 6, label: "Grind the rail", failure: "Too tired to skate." },
  darts: { hours: 0.5, energy: 3, label: "Play darts", failure: "Too tired to throw." },
};

export function sessionAction(id: MinigameId): ActionDef {
  const s = SESSIONS[id];
  return {
    id: `minigame-${id}`,
    label: s.label,
    hours: s.hours,
    energy: s.energy,
    resolve: () => ({ patch: {}, message: s.label + "." }),
  };
}

export type SessionStart = { ok: true; next: GameState } | { ok: false; message: string };

/** Charge the time and energy for one sitting. Refuses (changing nothing) when the player can't afford it. */
export function startSession(s: GameState, id: MinigameId): SessionStart {
  const r = runAction(s, sessionAction(id));
  return r.ok ? { ok: true, next: r.next } : { ok: false, message: r.message };
}

/** Quick pre-check used before opening a game from the town or a room. */
export const canStartSession = (s: GameState, id: MinigameId) => startSession(s, id);

export const hasEquippedBoard = (s: GameState) => Boolean(s.skateboard && s.skateboardEquipped);

const pct = (made: number, total: number) => (total > 0 ? Math.round((made / total) * 100) : 0);
export const accuracy = (made: number, total: number) => pct(made, total);

export type Finish = { next: GameState; notes: string[]; newBest: boolean };

/* ------------------------------ Basketball ------------------------------ */
export type BasketballMode = "practice" | "five" | "timed";

export function finishBasketball(
  s: GameState,
  mode: BasketballMode,
  made: number,
  shots: number,
  completed: boolean,
): Finish {
  const m = Math.max(0, Math.min(made, shots));
  let next: GameState =
    mode === "practice"
      ? { ...s }
      : { ...s, bbMade: s.bbMade + m, bbShots: s.bbShots + Math.max(0, shots) };
  const notes: string[] = [];
  let newBest = false;
  if (completed && mode === "five" && m > s.bbBest5) {
    next = { ...next, bbBest5: Math.min(5, m) };
    newBest = m > 0;
  }
  if (completed && mode === "timed" && m > s.bbBestTimed) {
    next = { ...next, bbBestTimed: Math.min(200, m) };
    newBest = m > 0;
  }
  if (completed && mode !== "practice" && m >= 1) {
    if (s.parkHoopDay === s.day)
      notes.push("Strength training done for today. The hoop is not impressed by overtime.");
    else {
      next = { ...next, str: s.str + 1, parkHoopDay: s.day };
      notes.push("Strength +1 (once a day)");
    }
  } else if (completed && mode !== "practice") {
    notes.push("No baskets, no gains.");
  } else if (mode === "practice") {
    notes.push("Practice never counts towards records or rewards.");
  }
  return { next, notes, newBest };
}

/* ------------------------------ Rail grind ------------------------------ */
export function finishRail(
  s: GameState,
  r: { level: number; success: boolean; balancedMs: number },
): Finish {
  const level = Math.max(1, Math.min(5, Math.trunc(r.level)));
  const longest = Math.max(0, Math.min(60000, Math.round(r.balancedMs)));
  let next: GameState = { ...s };
  const notes: string[] = [];
  let newBest = longest > s.railLongest;
  if (newBest) next = { ...next, railLongest: longest };
  if (r.success) {
    next = { ...next, railGrinds: s.railGrinds + 1, railLevel: Math.max(s.railLevel, level) };
    if (level > s.railLevel) notes.push(`Level ${Math.min(5, level + 1)} unlocked.`);
    if (s.parkSkateDay === s.day)
      notes.push("Charm is capped at one gain a day. The crew already saw your best.");
    else {
      next = { ...next, cha: s.cha + 1, parkSkateDay: s.day };
      notes.push("Charm +1 (once a day)");
    }
  } else {
    next = { ...next, railFalls: s.railFalls + 1 };
    newBest = newBest && longest > 0;
  }
  return { next, notes, newBest };
}

/* -------------------------------- Darts --------------------------------- */
export type DartsMode = "practice" | "three" | "x01";
export const WAGERS = [0, 5, 10, 20] as const;
export const MAX_WAGER = 20;

/** A friendly wager is whole dollars, at most MAX_WAGER, and never more than the player holds. */
export function clampWager(w: number, money: number): number {
  if (!Number.isFinite(w) || w <= 0) return 0;
  return Math.max(0, Math.min(MAX_WAGER, Math.floor(money), Math.floor(w)));
}

export function finishDarts(
  s: GameState,
  r: {
    mode: DartsMode;
    throws: number;
    hits: number;
    /** Three-dart score (mode "three"). */
    score?: number;
    /** Win/loss for matches that have one. */
    won?: boolean | null;
    completed: boolean;
    /** Stake already taken at the start of the match. */
    wager?: number;
  },
): Finish {
  let next: GameState =
    r.mode === "practice"
      ? { ...s }
      : {
          ...s,
          dartThrows: s.dartThrows + Math.max(0, r.throws),
          dartHits: s.dartHits + Math.max(0, Math.min(r.hits, r.throws)),
        };
  const notes: string[] = [];
  let newBest = false;
  if (r.mode === "three" && r.completed && r.score !== undefined && r.score > s.dartBest3) {
    next = { ...next, dartBest3: Math.min(180, r.score) };
    newBest = r.score > 0;
  }
  const wager = Math.max(0, r.wager ?? 0);
  if (r.mode !== "practice") {
    if (r.won === true && r.completed) {
      next = { ...next, dartWins: s.dartWins + 1, money: next.money + wager * 2 };
      if (wager) notes.push(`Won $${wager} from Gus.`);
      if (s.dartDay === s.day) notes.push("Charm and Gus's respect are capped at one gain a day.");
      else {
        next = { ...next, cha: s.cha + 1, relGus: Math.min(10, s.relGus + 1), dartDay: s.day };
        notes.push("Charm +1, Gus +1 (once a day)");
      }
    } else if (r.won === null && r.completed) {
      if (wager) {
        next = { ...next, money: next.money + wager };
        notes.push("A draw. Your stake is returned.");
      }
    } else if (r.won === false || !r.completed) {
      next = { ...next, dartLosses: s.dartLosses + 1 };
      if (wager) notes.push(`Lost $${wager}.`);
    }
  } else notes.push("Practice never counts towards records or rewards.");
  return { next, notes, newBest };
}

/** The wager is taken when a match starts so quitting mid-match cannot dodge it. */
export function takeWager(s: GameState, wager: number): GameState {
  const w = clampWager(wager, s.money);
  return w ? { ...s, money: s.money - w } : s;
}
