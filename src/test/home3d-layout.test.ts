import { describe, expect, it } from "vitest";
import { STUDIO, insideFootprint, overlaps, planFor, slotFor, visibleSlots, wallCutDown } from "@/lib/home3d/layout";
import { FURNITURE } from "@/lib/furniture";

describe("studio flat plan", () => {
  it("is only the studio tier for now", () => {
    expect(planFor(1)).toBe(STUDIO);
    expect(planFor(0)).toBeNull();
    expect(planFor(2)).toBeNull();
  });
  it("has two clearly separate spaces with different floors", () => {
    const [a, b] = STUDIO.floors;
    expect(a!.zone).toBe("living");
    expect(b!.zone).toBe("bedroom");
    expect(a!.kind).not.toBe(b!.kind);
    expect(a!.rect.x1).toBe(b!.rect.x0);
  });
  it("gives every purchasable item and the estate board a slot inside the flat, none overlapping", () => {
    for (const f of FURNITURE) expect(slotFor(STUDIO, f.id), f.id).toBeTruthy();
    expect(slotFor(STUDIO, "estate")).toBeTruthy();
    for (const s of STUDIO.slots) expect(insideFootprint(STUDIO, s), s.id).toBe(true);
    for (let i = 0; i < STUDIO.slots.length; i++)
      for (let j = i + 1; j < STUDIO.slots.length; j++) expect(overlaps(STUDIO.slots[i]!, STUDIO.slots[j]!), `${STUDIO.slots[i]!.id}/${STUDIO.slots[j]!.id}`).toBe(false);
  });
  it("shows only what the hotspot rules say is visible (ownership is respected)", () => {
    expect(visibleSlots(STUDIO, ["bed", "estate"]).map((s) => s.id)).toEqual(["bed", "estate"]);
    expect(visibleSlots(STUDIO, []).length).toBe(0);
    expect(visibleSlots(STUDIO, ["tv"]).map((s) => s.id)).toEqual(["tv"]);
  });
  it("keeps windows and doors inside their walls", () => {
    for (const w of STUDIO.walls) {
      const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      for (const o of w.openings) {
        expect(o.u0).toBeGreaterThanOrEqual(0.2);
        expect(o.u1).toBeLessThanOrEqual(len - 0.2);
        expect(o.v1).toBeLessThanOrEqual(w.height);
      }
    }
  });
  it("cuts down exterior walls that face the camera and keeps the others up", () => {
    const front = STUDIO.walls.find((w) => w.id === "front")!;
    const back = STUDIO.walls.find((w) => w.id === "back")!;
    expect(wallCutDown(front, { x: 0, z: 10 })).toBe(true);
    expect(wallCutDown(back, { x: 0, z: 10 })).toBe(false);
    expect(wallCutDown(back, { x: 0, z: -10 })).toBe(true);
  });
});

import { daylight, fitDistance } from "@/lib/home3d/layout";
describe("lighting and framing helpers", () => {
  it("daylight follows the clock", () => {
    expect(daylight(12)).toBe(1);
    expect(daylight(2)).toBeLessThan(0.1);
    expect(daylight(7)).toBeGreaterThan(daylight(6.2));
    expect(daylight(19)).toBeLessThan(1);
  });
  it("narrower screens need the camera further away", () => {
    expect(fitDistance(7.6, 4.8, 0.55, 45)).toBeGreaterThan(fitDistance(7.6, 4.8, 1.6, 45));
    expect(fitDistance(4.9, 4.8, 1, 45)).toBeLessThan(fitDistance(7.6, 4.8, 1, 45));
  });
});
