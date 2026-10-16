import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { START } from "@/lib/game-data";
import { LocationScene } from "@/components/LocationScene";
import { luxuryMap, toHotspotId, toSlotId, webglAvailable } from "@/components/home3d/Home3DStage";
import { roomFor, visibleHotspots } from "@/lib/rooms";
import { visibleSlots } from "@/lib/home3d/layout";
import { planFor } from "@/lib/home3d/plans";

const flat = (over: Record<string, unknown> = {}) => ({ ...START, house: 1, ...over });

describe("home 3D integration", () => {
  it("maps the television hotspot to its layout slot and back", () => {
    expect(toSlotId("television")).toBe("tv");
    expect(toHotspotId("tv")).toBe("television");
    expect(toSlotId("sofa")).toBe("sofa");
  });

  it("reads luxury ownership from the existing bitmask", () => {
    const m = luxuryMap(flat({ luxuryFurniture: 1 | 16 }) as never);
    expect(m["bed"]).toBe(true);
    expect(m["sofa"]).toBe(true);
    expect(m["kitchen"]).toBe(false);
    expect(Object.values(luxuryMap(flat() as never)).some(Boolean)).toBe(false);
  });

  it("shows only owned furniture, using the same rules as the classic renderer", () => {
    const s = flat({ furniture: 0 }) as never;
    const ids = visibleHotspots(roomFor("home", s), s).map((h) => toSlotId(h.id));
    const slots = visibleSlots(planFor(1)!, ids).map((x) => x.id);
    expect(slots).not.toContain("sofa");
    expect(slots).not.toContain("tv");
    expect(slots).toContain("bed");
  });

  it("has no WebGL under jsdom and falls back to the classic renderer", () => {
    expect(webglAvailable()).toBe(false);
    const s = flat() as never;
    const { container } = render(<LocationScene room={roomFor("home", s)} state={s} feedback={null} onRun={() => {}} onLeave={() => {}} />);
    expect(container.querySelector("[data-home3d]")).toBeNull();
    expect(container.querySelector(".room-art-frame")).not.toBeNull();
  });
});

import { GAME_SLOTS } from "@/components/home3d/Home3DStage";
import { PLANS } from "@/lib/home3d/plans";
import { requiresMainsPower } from "@/lib/home-zones";
import { homeZones } from "@/lib/home-zones";

describe("every housing tier uses a 3D plan", () => {
  it("maps each house index to a distinct plan", () => {
    const kinds = [0, 1, 2, 3, 4].map((h) => planFor(h)!.kind);
    expect(new Set(kinds).size).toBe(5);
    expect(planFor(5)).toBeNull();
  });

  it("offers a camera focus for every room button of each tier", () => {
    for (const h of [0, 1, 2, 3, 4]) {
      const plan = planFor(h)!;
      for (const z of homeZones(h)) expect(plan.focus[z.id], `house ${h} ${z.id}`).toBeDefined();
    }
  });

  it("gives nothing for free: an empty home shows no furniture slots beyond the mattress rule", () => {
    for (const h of [0, 1, 2, 3, 4]) {
      const s = { ...START, house: h, furniture: 0 } as never;
      const ids = visibleHotspots(roomFor("home", s), s).map((x) => toSlotId(x.id));
      const slots = visibleSlots(planFor(h)!, ids).map((x) => x.id);
      for (const id of ["sofa", "tv", "kitchen", "weights", "desk", "console", "bookshelf"]) expect(slots, `house ${h}`).not.toContain(id);
    }
  });

  it("keeps mains-powered items out of the squat", () => {
    const s = { ...START, house: 0, furniture: 255 } as never;
    const ids = visibleHotspots(roomFor("home", s), s).map((x) => toSlotId(x.id));
    for (const id of ids) expect(requiresMainsPower(id), id).toBe(false);
  });

  it("exposes the games-room machines as plan slots that launch the existing minigames", () => {
    expect(GAME_SLOTS).toEqual({ blackjack: "blackjack", slots: "slots" });
    const ids = visibleSlots(planFor(3)!, ["blackjack", "slots"]).map((x) => x.id);
    expect(ids).toEqual(expect.arrayContaining(["blackjack", "slots"]));
    expect(PLANS[3]!.npcs?.length ?? 0).toBeGreaterThan(0);
  });
});
