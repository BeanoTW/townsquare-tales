import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";
import { runAction } from "@/lib/actions";
import { civicRunAction, civicStatus, civicVolunteerAction, townHallBuilt } from "@/lib/civic-career";

describe("Town Hall civic progression", () => {
  it("remains under construction before opening day", () => {
    expect(townHallBuilt({ day: 29 })).toBe(false);
    expect(townHallBuilt({ day: 30 })).toBe(true);
    expect(civicStatus({ ...START, day: 10 })[0]).toMatch(/under construction/);
  });
  it("requires support before advancing, preserves progress in saves", () => {
    const initial = { ...START, day: 30, energy: 100, hour: 8 };
    expect(runAction(initial, civicRunAction()).ok).toBe(false);
    const helped = runAction(initial, civicVolunteerAction());
    expect(helped.ok).toBe(true);
    if (!helped.ok) return;
    expect(helped.next.civicSupport).toBe(5);
    const ready = { ...helped.next, civicSupport: 10 };
    const won = runAction(ready, civicRunAction());
    expect(won.ok).toBe(true);
    if (!won.ok) return;
    expect(parseGame(JSON.stringify(won.next), START).civicStage).toBe(1);
  });
});
