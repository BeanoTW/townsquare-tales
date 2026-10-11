import { runAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";

/**
 * Shared Lucky Sevens rules. Only the fictional in-game currency is used: there is no
 * way to buy credits and no cash-out. All wagers are whole multiples of BET_STEP so that
 * every payout (including blackjack's 3:2) is a whole number of dollars.
 */
export const BET_STEP = 10;
export const MIN_BET = 10;
export const MAX_BET = 500;
export const CHIPS = [10, 50, 100, 500] as const;

export type CasinoGame = "blackjack" | "slots";

/** Largest legal wager the player can currently afford (0 when they cannot bet at all). */
export function maxBet(money: number): number {
  const affordable = Math.floor(Math.max(0, money) / BET_STEP) * BET_STEP;
  return Math.min(MAX_BET, affordable);
}

/** Snap any requested wager to a legal one: a multiple of BET_STEP, never above what the player holds. */
export function clampBet(bet: number, money: number): number {
  const cap = maxBet(money);
  if (cap < MIN_BET) return 0;
  const snapped = Math.round((Number.isFinite(bet) ? bet : MIN_BET) / BET_STEP) * BET_STEP;
  return Math.max(MIN_BET, Math.min(cap, snapped));
}

/** Playing costs an hour and a little energy, charged once when the first round is committed. */
export const CASINO_SESSION: ActionDef = {
  id: "casino-session",
  label: "Take a seat",
  hours: 1,
  energy: 5,
  resolve: () => ({ patch: {}, message: "You take a seat." }),
};

export type SessionCheck = { ok: true; next: GameState } | { ok: false; message: string };

export function chargeSession(s: GameState): SessionCheck {
  const r = runAction(s, CASINO_SESSION);
  return r.ok ? { ok: true, next: r.next } : { ok: false, message: r.message };
}

/** Whether the player could start a session at all (used to refuse entry up front). */
export function canSit(s: GameState): SessionCheck {
  return chargeSession(s);
}

const KEYS = {
  blackjack: ["bjWon", "bjLost"],
  slots: ["slotWon", "slotLost"],
} as const;

/** Record one settled round. `net` is payout minus everything wagered; zero changes nothing. */
export function recordResult(s: GameState, game: CasinoGame, net: number): GameState {
  const [won, lost] = KEYS[game];
  if (net > 0) return { ...s, [won]: s[won] + net };
  if (net < 0) return { ...s, [lost]: s[lost] - net };
  return s;
}

export function lifetime(s: GameState, game: CasinoGame) {
  const [won, lost] = KEYS[game];
  return { won: s[won], lost: s[lost], net: s[won] - s[lost] };
}

export function money(n: number): string {
  return `${n < 0 ? "−" : ""}$${Math.abs(n).toLocaleString("en-GB")}`;
}
export function signed(n: number): string {
  return n > 0 ? `+${money(n)}` : money(n);
}
