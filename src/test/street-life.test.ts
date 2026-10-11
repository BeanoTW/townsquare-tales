import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { runAction } from "@/lib/actions";
import { streetAction, residentBark, ambientVisible, pigeonOffset } from "@/lib/street-life";

describe("street life integration", () => {
  it("lets bench rests advance time and restore energy", () => {
    const result = runAction({ ...START, hour: 12, energy: 45 }, streetAction("bench"));
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.next.hour).toBe(12.5); expect(result.next.energy).toBe(53); }
  });
  it("charges only once for a vending drink", () => {
    const result = runAction({ ...START, money: 10, energy: 60 }, streetAction("vending"));
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.next.money).toBe(7); expect(result.next.energy).toBe(72); }
  });
  it("prevents repeat bin searches on the same day", () => {
    const first = runAction({ ...START, day: 2 }, streetAction("bin"), () => 0.1);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const again = runAction(first.next, streetAction("bin"), () => 0.1);
    expect(again.ok).toBe(false);
  });
  it("makes reactions context and reputation dependent", () => {
    expect(residentBark("mara", START, "skating")).not.toBe(residentBark("mara", START, "passing"));
    expect(residentBark("nox", { ...START, gangRep: 30 }, "passing")).not.toBe(residentBark("nox", START, "passing"));
  });
  it("switches ambient residents by time and scatters birds", () => {
    expect(ambientVisible("patrol", 23)).toBe(true);
    expect(ambientVisible("patrol", 12)).toBe(false);
    expect(pigeonOffset(0, 2, 0).scatter).toBe(true);
    expect(pigeonOffset(10, 2, 0).scatter).toBe(false);
  });
});
