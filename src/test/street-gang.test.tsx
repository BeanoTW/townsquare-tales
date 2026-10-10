import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildings, TownMap } from "@/components/TownMap";
import { RoomArt } from "@/components/rooms/RoomArt";
import { VenueScenery } from "@/components/rooms/VenueScenery";
import { START } from "@/lib/game-data";
import { meetStreetGang, GANG_SPOT } from "@/lib/street-gang";
import { findRoute, isWalkable } from "@/lib/pathfinding";
import { roomFor, visibleHotspots } from "@/lib/rooms";

afterEach(() => cleanup());

describe("street gang on the top-right green", () => {
  it("is a permanent outdoor location, not an enterable building", () => {
    const lots = buildings(0);
    expect(lots).toHaveLength(15);
    expect(lots.some(b => b.id === "alley" || b.id === "gang")).toBe(false);
    expect(GANG_SPOT.x).toBeGreaterThan(25);
    expect(GANG_SPOT.y).toBeLessThan(10);
    expect(isWalkable(GANG_SPOT, lots)).toBe(true);
    expect(findRoute({ x: 9.95, y: 9 }, GANG_SPOT, lots).length).toBeGreaterThan(0);
  });

  it("can be found on the world map at any time of day", () => {
    const view = render(<TownMap hour={11} house={0} onEnter={vi.fn()} active={null} />);
    expect(view.getByRole("button", { name: "Approach the street gang" })).toBeInTheDocument();
    expect(view.container.querySelector("[data-street-gang]")).toBeInTheDocument();
  });

  it("always mugs an easy target, with nonnegative money and energy", () => {
    const beginner = { ...START, money: 23, energy: 40, cha: 5, str: 5 };
    const result = meetStreetGang(beginner, () => 0);
    expect(result.hostile).toBe(true);
    expect(result.cashLost).toBeGreaterThan(0);
    expect(result.patch.money).toBeLessThan(beginner.money);
    expect(result.patch.energy).toBe(24);
    expect(result.message).toMatch(/off!/i);
    const broke = meetStreetGang({ ...beginner, money: 0, energy: 3 }, () => 0);
    expect(broke.patch).toMatchObject({ money: 0, energy: 0 });
  });

  it("lets strong or persuasive players earn a shady conversation", () => {
    const strong = meetStreetGang({ ...START, str: 55, cha: 10 }, () => 0);
    expect(strong.hostile).toBe(false);
    expect(strong.patch).toEqual({});
    const charming = meetStreetGang({ ...START, str: 8, cha: 55 }, () => 0);
    expect(charming.hostile).toBe(false);
    expect(charming.message).toContain("what do you want");
  });

  it("still carries some risk without making strong characters immune", () => {
    const mid = { ...START, str: 17, cha: 16 };
    expect(meetStreetGang(mid, () => 0).hostile).toBe(false);
    expect(meetStreetGang(mid, () => 0.99).hostile).toBe(true);
  });
});

describe("grittier town art", () => {
  it("gives the gym a perspective floor with distinct 3D training apparatus", () => {
    const room = roomFor("gym", START);
    const view = render(<RoomArt room={room} state={START} visible={visibleHotspots(room, START)} selectedId={null} onSelect={vi.fn()} />);
    expect(view.container.querySelector('[data-scene-depth="gym"]')).toBeInTheDocument();
    expect(view.container.querySelector("[data-gym-equipment]")).toBeInTheDocument();
  });

  it("gives named staff different, less smiley facial expressions", () => {
    for (const id of ["shop", "bar", "pawn", "diner", "bank"] as const) {
      const view = render(<VenueScenery room={roomFor(id, START)} shirt="#675441" title={id} />);
      expect(view.container.querySelector(`[data-character-venue="${id}"]`)).toBeInTheDocument();
      expect(view.container.querySelector(`[data-expression="${id === "bank" ? "reserved" : id === "shop" ? "unimpressed" : "gruff"}"]`)).toBeInTheDocument();
      view.unmount();
    }
  });
});
