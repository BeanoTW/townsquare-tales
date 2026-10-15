import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { START } from "@/lib/game-data";
import { LocationScene } from "@/components/LocationScene";
import { luxuryMap, toHotspotId, toSlotId, webglAvailable } from "@/components/home3d/Home3DStage";
import { roomFor, visibleHotspots } from "@/lib/rooms";
import { planFor, visibleSlots } from "@/lib/home3d/layout";

const flat = (over: Record<string, unknown> = {}) => ({ ...START, house: 1, ...over });

describe("home 3D integration", () => {
  it("maps the television hotspot to its layout slot and back", () => {
    expect(toSlotId("television")).toBe("tv");
    expect(toHotspotId("tv")).toBe("television");
    expect(toSlotId("sofa")).toBe("sofa");
  });

  it("reads luxury ownership from the existing bitmask", () => {
    const m = luxuryMap(flat({ luxuryFurniture: 1 | 16 }) as never);
    expect(m.bed).toBe(true);
    expect(m.sofa).toBe(true);
    expect(m.kitchen).toBe(false);
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
