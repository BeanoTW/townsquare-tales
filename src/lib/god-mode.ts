import { runAction, type ActionDef, type ActionResult, type Rng } from "@/lib/actions";
import { parseGame, type GameState } from "@/lib/game-state";

/** A separate sandbox save: never overwrite the normal game's progress. */
export const GOD_SAVE_KEY = "sticktown-god-save";
export const GOD_ENABLED_KEY = "sticktown-god-enabled";
const MAX_MONEY = 1_000_000_000_000;
/** Versioned to restart only old, automatically-completed sandbox saves. */
export const DEV_SAVE_VERSION_KEY = "sticktown-dev-save-version";
export const DEV_SAVE_VERSION = "2";

/** Developer mode supplies test resources, not unlocked progression. */
export function grantGodPowers(s: GameState): GameState {
  return {
    ...s,
    money: MAX_MONEY,
    bank: MAX_MONEY,
    energy: 100,
    xp: 1_000_000,
  };
}

/** Time and resource costs are bypassed, but career, home, education and equipment still progress normally. */
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
    return grantGodPowers(parseGame(raw, fallback));
  } catch {
    return grantGodPowers(fallback);
  }
}
