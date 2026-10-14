/** Pure H-O-R-S-E turn engine, independent of UI, clock and wallet. */
export type HorseOpponent = "park-kid" | "gus" | "mara" | "nox";
export type HorsePlayer = "human" | "npc";
export type HorseShot = "standard" | "bank" | "long" | "trick";
export type HorseState = {
  caller: HorsePlayer;
  phase: "call" | "copy" | "finished";
  shot: HorseShot | null;
  letters: Record<HorsePlayer, number>;
  winner: HorsePlayer | null;
  turns: number;
};
export const HORSE_OPPONENTS: Record<HorseOpponent, { name: string; accuracy: number; bank: number; long: number; trick: number }> = {
  "park-kid": { name: "Park Kid", accuracy: .40, bank: .32, long: .20, trick: .12 },
  gus: { name: "Gus", accuracy: .65, bank: .57, long: .39, trick: .22 },
  mara: { name: "Mara", accuracy: .75, bank: .68, long: .55, trick: .35 },
  nox: { name: "Nox", accuracy: .63, bank: .65, long: .52, trick: .72 },
};
export const horseLetters = (count: number) => "HORSE".slice(0, Math.max(0, Math.min(5, count)));
const other = (p: HorsePlayer): HorsePlayer => p === "human" ? "npc" : "human";
export const createHorseGame = (caller: HorsePlayer = "human"): HorseState => ({
  caller, phase: "call", shot: null, letters: { human: 0, npc: 0 }, winner: null, turns: 0,
});
/**
 * Call succeeds: the other player must copy. Call fails: initiative passes.
 * Copy fails: copycat gains a letter, and becomes caller next turn.
 * Copy succeeds: copycat becomes caller with no penalty.
 */
export function horseAttempt(state: HorseState, player: HorsePlayer, made: boolean, shot: HorseShot = "standard"): HorseState {
  if (state.phase === "finished") return state;
  const expected = state.phase === "call" ? state.caller : other(state.caller);
  if (player !== expected) return state;
  if (state.phase === "call") {
    return made
      ? { ...state, phase: "copy", shot, turns: state.turns + 1 }
      : { ...state, caller: other(state.caller), phase: "call", shot: null, turns: state.turns + 1 };
  }
  const letters = { ...state.letters, [player]: state.letters[player] + (made ? 0 : 1) };
  const winner = letters[player] >= 5 ? state.caller : null;
  return { ...state, caller: player, phase: winner ? "finished" : "call", shot: null,
    letters, winner, turns: state.turns + 1 };
}
export function npcHorseChance(opponent: HorseOpponent, shot: HorseShot): number {
  const profile = HORSE_OPPONENTS[opponent];
  return shot === "standard" ? profile.accuracy : profile[shot];
}

/** Shot requirements are checked against the actual simulated flight. */
export function qualifiesHorseShot(kind: HorseShot, made: boolean, power: number, contacts: readonly string[], swish: boolean): boolean {
  if (!made) return false;
  switch (kind) {
    case "standard": return true;
    case "bank": return contacts.includes("backboard");
    case "long": return power >= 0.7;
    case "trick": return swish && power >= 0.55;
  }
}
