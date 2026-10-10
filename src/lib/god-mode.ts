import { runAction, type ActionDef, type ActionResult, type Rng } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";

/** A separate sandbox save: never overwrite the normal game's progress. */
export const GOD_SAVE_KEY = "sticktown-god-save";
export const GOD_ENABLED_KEY = "sticktown-god-enabled";
const MAX_MONEY = 1_000_000_000_000;
const MAX_STATS = 1_000_000;

/** Powers are reapplied after every successful action to make them genuinely inexhaustible. */
export function grantGodPowers(s: GameState): GameState {
  return {
    ...s,
    money: MAX_MONEY,
    bank: MAX_MONEY,
    energy: 100,
    str: MAX_STATS,
    int: MAX_STATS,
    cha: MAX_STATS,
    xp: MAX_STATS,
    house: 3,
    school: 4,
    job: 4,
    trainers: 1,
    alarm: 1,
    skateboard: 1,
    skateboardEquipped: 1,
    furniture: 31,
  };
}

/** Time is frozen, costs refunded, and stats remain maxed; actions still execute normally. */
export function runGodAction(state: GameState, def: ActionDef, rng: Rng = Math.random): ActionResult {
  const powered = grantGodPowers(state);
  const attempt = runAction({ ...powered, hour: 0 }, def, rng);
  if (!attempt.ok) return attempt;
  return {
    ...attempt,
    next: grantGodPowers({
      ...attempt.next,
      hour: state.hour,
    }),
    hoursUsed: 0,
    changes: attempt.changes,
  };
}

export function parseGodSave(raw: string | null, fallback: GameState): GameState {
  if (!raw) return grantGodPowers(fallback);
  try {
    const value = JSON.parse(raw) as Partial<GameState>;
    return grantGodPowers({ ...fallback, ...value });
  } catch {
    return grantGodPowers(fallback);
  }
}
