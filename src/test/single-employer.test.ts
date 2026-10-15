import { describe, expect, it } from "vitest";
import { applyAction, QUIT_JOB, runAction, shiftAction } from "@/lib/actions";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";

describe("single employer", () => {
  it("starts unemployed, joins one employer, blocks second application, and allows resignation", () => {
    const hired = runAction(START, applyAction(1));
    expect(hired.ok).toBe(true);
    if (!hired.ok) return;
    expect(hired.next).toMatchObject({ employed: 1, career: 1 });
    expect(runAction(hired.next, applyAction(2)).ok).toBe(false);
    const quit = runAction(hired.next, QUIT_JOB);
    expect(quit.ok).toBe(true);
    if (!quit.ok) return;
    expect(quit.next.employed).toBe(0);
    const second = runAction(quit.next, applyAction(2));
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.next.career).toBe(2);
  });

  it("prevents working while unemployed and preserves old employment saves", () => {
    expect(runAction(START, shiftAction(START)).ok).toBe(false);
    const legacy = parseGame(JSON.stringify({ ...START, career: 3, job: 1, employed: undefined }), START);
    expect(legacy.employed).toBe(1);
    expect(legacy.career).toBe(3);
  });
});
