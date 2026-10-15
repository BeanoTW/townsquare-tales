import { describe, expect, it } from "vitest";
import { enrollAction, runAction, STUDY_DESK, STUDY_LIBRARY, studyGain } from "@/lib/actions";
import { START } from "@/lib/game-data";

describe("qualification-driven study effectiveness", () => {
  it("does not grant intelligence immediately upon enrolment", () => {
    const state = { ...START, money: 2000, int: 12, studyXp: 20 };
    const action = enrollAction(state);
    expect(action).not.toBeNull();
    const outcome = runAction(state, action!);
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.next.school).toBe(1);
    expect(outcome.next.int).toBe(12);
    expect(outcome.next.studyXp).toBe(20);
  });

  it("requires study XP before graduation", () => {
    const state = { ...START, money: 2000, studyXp: 19 };
    const result = runAction(state, enrollAction(state)!);
    expect(result.ok).toBe(false);
    const studied = runAction(state, STUDY_DESK);
    expect(studied.ok).toBe(true);
    if (!studied.ok) return;
    expect(studied.next.studyXp).toBe(23);
    const graduate = runAction(studied.next, enrollAction(studied.next)!);
    expect(graduate.ok).toBe(true);
  });

  it("adds one extra intelligence per school level for each study action", () => {
    expect(studyGain(2, 0)).toBe(2);
    expect(studyGain(2, 1)).toBe(3);
    expect(studyGain(2, 4)).toBe(6);
    for (const school of [0, 1, 2, 3, 4]) {
      const state = { ...START, school, energy: 100 };
      const desk = runAction(state, STUDY_DESK);
      const library = runAction(state, STUDY_LIBRARY);
      expect(desk.ok).toBe(true);
      expect(library.ok).toBe(true);
      if (desk.ok) expect(desk.next.int - state.int).toBe(2 + school);
      if (library.ok) expect(library.next.int - state.int).toBe(1 + school);
    }
  });
});
