import type { GameState } from "@/lib/game-state";

/** One recurring park character; dialogue escalates and consequences persist in the save. */
export const PARK_KID_SPOT = { x: 13.2, y: 23.6, approach: 1.1 } as const;
export const PARK_SMOKE_LIMIT = 15;

export function parkKidDialogue(given: number): string {
  if (given <= 0) return "Psst. Got a smoke to spare?";
  if (given === 1) return "Thanks, mate.";
  if (given === 2) return "You're cool, man. Here, have my skateboard.";
  if (given < 6) return "Cheers. You really keep coming back, eh?";
  if (given < 10) return "Another? I've probably had enough already.";
  if (given < PARK_SMOKE_LIMIT) return "*cough* Mate, my chest is killing me. Seriously...";
  return "*cough, cough* I feel really rough. I'm getting out of here.";
}

export function giveParkSmoke(s: GameState): { patch: Partial<GameState>; message: string } | string {
  if (s.parkKidGone || s.parkSmokes >= PARK_SMOKE_LIMIT) return "He's gone home. The bench is empty.";
  if (s.smokes < 1) return "No smokes in your inventory. The kid shrugs.";
  const given = s.parkSmokes + 1;
  return {
    patch: {
      smokes: s.smokes - 1,
      parkSmokes: given,
      skateboard: given >= 2 ? 1 : s.skateboard,
      skateboardEquipped: given >= 2 ? 1 : s.skateboardEquipped,
      karma: s.karma - (given >= 10 ? 3 : given >= 5 ? 2 : 1),
    },
    message: parkKidDialogue(given) + (given === 2 ? " Skateboard unlocked!" : "") + " Karma decreased.",
  };
}
