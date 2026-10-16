import type { GameState } from "@/lib/game-state";

/** The active xp/job fields remain compatible with existing saves and UI. */
export const trackXp = (s: GameState, career: number): number => {
  const key = ("careerXp"+career) as keyof GameState;
  const saved = s[key];
  return typeof saved === "number" ? saved : s.career === career ? s.xp : 0;
};
export const trackBest = (s: GameState, career: number): number => {
  const key = ("careerBest"+career) as keyof GameState;
  const saved = s[key];
  return typeof saved === "number" ? saved : s.career === career ? s.job : 0;
};
export const saveCareer = (s: GameState): Partial<GameState> => ({
  [`careerXp${s.career}`]: s.xp,
  [`careerBest${s.career}`]: Math.max(s.job, trackBest(s, s.career)),
});
