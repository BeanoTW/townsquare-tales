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
    expect(granted.next.loanDebt).toBe(250);
    expect(runAction(granted.next, bankLoanAction(250)).ok).toBe(false);
  });

  it("requires work for larger borrowing and preserves existing progress", () => {
    expect(runAction({ ...START, job: 0 }, bankLoanAction(1000)).ok).toBe(false);
    const granted = runAction({ ...START, job: 1, day: 8 }, bankLoanAction(1000));
    expect(granted.ok).toBe(true);
    if (!granted.ok) return;
    expect(granted.next.day).toBe(8);
    expect(granted.next.loanDebt).toBe(1000);
  });

  it("charges daily interest and supports partial and full repayment", () => {
    const sleep = runAction({ ...START, loanDebt: 250, money: 500 }, sleepAction({ ...START, loanDebt: 250, money: 500 }));
    expect(sleep.ok).toBe(true);
    if (!sleep.ok) return;
    expect(sleep.next.loanDebt).toBe(253);
    const partial = runAction(sleep.next, repayLoanAction(100));
    expect(partial.ok).toBe(true);
    if (!partial.ok) return;
    expect(partial.next.loanDebt).toBe(153);
    const full = runAction(partial.next, repayLoanAction("all"));
    expect(full.ok).toBe(true);
    if (!full.ok) return;
    expect(full.next.loanDebt).toBe(0);
  });

  it("round trips existing and new saves with no loan debt by default", () => {
    const old = parseGame(JSON.stringify({ ...START }), START);
    expect(old.loanDebt ?? 0).toBe(0);
    expect(parseGame(JSON.stringify({ ...old, loanDebt: 101 }), START).loanDebt).toBe(101);
  });
});
