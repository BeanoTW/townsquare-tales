import { describe, expect, it } from "vitest";
import { bankLoanAction, repayLoanAction, runAction, sleepAction } from "@/lib/actions";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";

describe("bank loans", () => {
  it("grants a small loan and prevents another while outstanding", () => {
    const granted = runAction({ ...START, money: 0 }, bankLoanAction(250));
    expect(granted.ok).toBe(true);
    if (!granted.ok) return;
    expect(granted.next.money).toBe(250);
    expect(granted.next.loanDebt).toBe(350);
    expect(granted.next.loanDueDay).toBe(31);
    expect(runAction(granted.next, bankLoanAction(250)).ok).toBe(false);
  });

  it("requires work for larger borrowing and preserves existing progress", () => {
    expect(runAction({ ...START, job: 0 }, bankLoanAction(1000)).ok).toBe(false);
    const granted = runAction({ ...START, job: 1, employed: 1, day: 8 }, bankLoanAction(1000));
    expect(granted.ok).toBe(true);
    if (!granted.ok) return;
    expect(granted.next.day).toBe(8);
    expect(granted.next.loanDebt).toBe(1400);
  });

  it("keeps the fixed charge until due, then penalises overdue debt", () => {
    const state = { ...START, loanDebt: 350, loanPrincipal: 250, loanDueDay: 2, money: 1000 };
    const day2 = runAction(state, sleepAction(state));
    expect(day2.ok).toBe(true);
    if (!day2.ok) return;
    expect(day2.next.loanDebt).toBe(350);
    const day3 = runAction(day2.next, sleepAction(day2.next));
    expect(day3.ok).toBe(true);
    if (!day3.ok) return;
    expect(day3.next.loanDebt).toBe(357);
    const partial = runAction(day3.next, repayLoanAction(100));
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.next.loanDebt).toBe(257);
    const full = runAction(partial.next, repayLoanAction("all"));
    expect(full.ok).toBe(true);
    if (full.ok) {
      expect(full.next.loanDebt).toBe(0);
      expect(full.next.loanDueDay).toBe(0);
    }
  });

  it("round trips existing and new saves with no loan debt by default", () => {
    const old = parseGame(JSON.stringify({ ...START }), START);
    expect(old.loanDebt ?? 0).toBe(0);
    expect(parseGame(JSON.stringify({ ...old, loanDebt: 101 }), START).loanDebt).toBe(101);
  });
});
