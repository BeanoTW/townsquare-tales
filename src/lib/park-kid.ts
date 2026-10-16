import type { GameState } from "@/lib/game-state";

/** One recurring park character; dialogue escalates and consequences persist in the save. */
export const PARK_KID_SPOT = { x: 18.0, y: 5.4, approach: 1.1 } as const;
export const PARK_SMOKE_LIMIT = 15;

const BENCH_DIALOGUE = [
  "Evening. Don't suppose you've got a minute?",
  "Cheers. Been a long old day.",
  "Hey, take my old board. It's just gathering dust at home.",
  "Back again? You're becoming a familiar face.",
  "Some days I just sit here watching the world go by.",
  "Saw quite the argument outside the pub earlier.",
  "I keep meaning to find somewhere else to hang out.",
  "You've got a knack for turning up at strange times.",
  "I used to skate all round this town. Different times.",
  "Think I've spent far too long on this bench today.",
  "I'm not feeling particularly great, actually.",
  "I'll be alright. Just need a minute.",
  "Perhaps I ought to head home soon.",
  "Everything seems to be catching up with me.",
  "I should've called it a day ages ago.",
  "That's enough for me. I think I'll head home.",
] as const;

export function parkKidDialogue(stage: number): string {
  const index = Math.max(0, Math.min(BENCH_DIALOGUE.length - 1, Math.trunc(stage)));
  return BENCH_DIALOGUE[index] ?? BENCH_DIALOGUE[0];
}

export function giveParkSmoke(s: GameState): { patch: Partial<GameState>; message: string } | string {
  if (s.parkKidGone || s.parkSmokes >= PARK_SMOKE_LIMIT) return "He's gone home. The bench is empty.";
  if (s.smokes < 1) return "You check your pockets. The regular shrugs.";
  const given = s.parkSmokes + 1;
  return {
    patch: {
      smokes: s.smokes - 1,
      parkSmokes: given,
      skateboard: given >= 2 ? 1 : s.skateboard,
      skateboardEquipped: given >= 2 ? 1 : s.skateboardEquipped,
      karma: s.karma - (given >= 10 ? 3 : given >= 5 ? 2 : 1),
    },
    message: parkKidDialogue(given),
  };
}
