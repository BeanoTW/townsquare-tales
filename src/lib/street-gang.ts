import type { GameState } from "@/lib/game-state";

/** A permanent street encounter, not a sixteenth building. Open green north-east of the shops. */
export const GANG_SPOT = { id: "gang", x: 26.4, y: 6.8, approach: 1.45 } as const;

export type GangMeeting =
  | { hostile: true; message: string; patch: Partial<GameState>; cashLost: number }
  | { hostile: false; message: string; patch: Partial<GameState>; cashLost: 0 };

/**
 * No paywall or purchased defence. Both weak and uncharismatic means a
 * guaranteed rough reception; either social confidence or strength can help.
 * Higher combined stats progressively reduce the chance of being targeted.
 */
export function meetStreetGang(state: GameState, rng: () => number = Math.random): GangMeeting {
  const strength = Math.max(0, state.str);
  const charm = Math.max(0, state.cha);
  const easyTarget = strength < 15 && charm < 15;
  const survival = Math.min(0.98, 0.12 + strength * 0.013 + charm * 0.019);
  const hostile = easyTarget || rng() >= survival;
  if (hostile) {
    const cashLost = Math.min(state.money, Math.max(10, Math.ceil(state.money * 0.4)));
    return {
      hostile: true,
      cashLost,
      patch: { money: state.money - cashLost, energy: Math.max(0, state.energy - 16) },
      message: cashLost
        ? `"Oi! Wrong part of town, mate. F*** off!" They shove you about and nick $${cashLost}. -16 energy.`
        : '"Oi! Wrong part of town, mate. F*** off!" They shove you away. -16 energy.',
    };
  }
  return {
    hostile: false,
    cashLost: 0,
    patch: {},
    message: strength >= 22
      ? '"Alright, tough one. You can hang about. Don\'t cause trouble."'
      : '"You\'ve got some nerve coming over here. Alright, what do you want?"',
  };
}
