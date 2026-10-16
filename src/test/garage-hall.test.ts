import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { isVenue, venueZones } from "@/lib/home-zones";
import { venuePlan } from "@/lib/home3d/venues";
import { roomFor } from "@/lib/rooms";
import { buildings } from "@/lib/town-world";

describe("community hall and garage interiors", () => {
  it.each([
    ["hall", "hall", ["Main hall", "Meeting room"]],
    ["garage", "garage", ["Reception", "Workshop"]],
  ] as const)("%s is a 3D venue whose fixtures match its hotspots", (id, kind, labels) => {
    expect(isVenue(id)).toBe(true);
    expect(venueZones(id).map((z) => z.label)).toEqual(labels);
    const plan = venuePlan(id)!;
    expect(plan.kind).toBe(kind);
    expect(plan.slots.map((s) => s.id).sort()).toEqual(roomFor(id, START).hotspots.map((h) => h.id).sort());
    expect(plan.npcs?.length).toBeGreaterThanOrEqual(3);
  });

  it("keeps the hall off the map until the Workers Yard has moved", () => {
    expect(buildings(1).some((b) => b.id === "hall")).toBe(false);
    expect(buildings(1, false, true).some((b) => b.id === "hall")).toBe(true);
    expect(buildings(1).some((b) => b.id === "garage")).toBe(true);
  });
});