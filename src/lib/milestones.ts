import { CAREERS } from "@/lib/careers";
import { HOUSES, SCHOOLS } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";

/**
 * Life milestones: the big moments that get a full-screen scene of their own instead of the
 * everyday in-world one. Detected purely from the state before and after an action, so any
 * route to the milestone (a desk, a panel, a dashboard button) triggers it.
 */
export type MilestoneKind = "new-home" | "graduated" | "promoted" | "hired" | "debt-free";
export type Milestone = { kind: MilestoneKind; title: string; detail: string };

/** Cutscene preference: full scenes, always-short scenes, or none at all. */
export type CutsceneMode = "full" | "short" | "off";
export const CUTSCENE_MODE_KEY = "tst.cutscenes";
export function readCutsceneMode(): CutsceneMode {
  try {
    const v = typeof window === "undefined" ? null : window.localStorage.getItem(CUTSCENE_MODE_KEY);
    return v === "short" || v === "off" ? v : "full";
  } catch {
    return "full";
  }
}

const roleName = (career: number, job: number) => CAREERS[career]?.roles[job]?.name ?? CAREERS[career]?.name ?? "the job";

/** The single most important milestone an action reached, if any (a house outranks a payslip). */
export function milestoneFor(before: GameState, after: GameState): Milestone | null {
  if (after.house > before.house) return { kind: "new-home", title: "HOME SWEET HOME", detail: HOUSES[after.house]?.name ?? "A new home" };
  if (after.school > before.school) return { kind: "graduated", title: "GRADUATION DAY", detail: SCHOOLS[after.school] ?? "Qualified" };
  if ((after.employed ?? 1) === 1 && (before.employed ?? 1) === 1 && after.career === before.career && after.job > before.job) {
    return { kind: "promoted", title: "PROMOTED!", detail: roleName(after.career, after.job) };
  }
  if (before.employed === 0 && (after.employed ?? 1) === 1) return { kind: "hired", title: "YOU'RE HIRED!", detail: roleName(after.career, after.job) };
  if ((before.loanDebt ?? 0) > 0 && (after.loanDebt ?? 0) === 0) return { kind: "debt-free", title: "DEBT FREE!", detail: "Loan paid in full" };
  return null;
}
