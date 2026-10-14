/** Overworld skate tricks. No camera or movement changes. */
export type FlatlandTrick = "ollie" | "kickflip" | "shuvit";
export type SkateJump = { trick: FlatlandTrick; elapsed: number };
export const OLLIE_SECONDS = .35;
export function elevation(jump: SkateJump | null): number {
  if (!jump) return 0;
  const t = Math.max(0, Math.min(1, jump.elapsed / OLLIE_SECONDS));
  return 18 * 4 * t * (1 - t);
}
export function deckRotation(jump: SkateJump | null): number {
  if (!jump) return 0;
  const t = Math.max(0, Math.min(1, jump.elapsed / OLLIE_SECONDS));
  return jump.trick === "shuvit" ? 180 * t : 0;
}
export function trickLabel(trick: FlatlandTrick): string {
  return trick === "ollie" ? "OLLIE!" : trick === "kickflip" ? "KICKFLIP!" : "SHUVIT!";
}
export function stepJump(jump: SkateJump | null, dt: number): SkateJump | null {
  if (!jump) return null;
  const elapsed = jump.elapsed + Math.max(0, dt);
  return elapsed >= OLLIE_SECONDS ? null : { ...jump, elapsed };
}
