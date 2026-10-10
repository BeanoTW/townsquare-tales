import { describe, expect, it } from "vitest";
import { runAction } from "@/lib/actions";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import {
  PLACE_IDS,
  ROOMS,
  VIEW,
  hotspotActions,
  isPlace,
  roomFor,
  visibleHotspots,
  type Box,
} from "@/lib/rooms";

const rich: GameState = {
  ...START,
  money: 100000,
  energy: 100,
  hour: 0,
  bank: 5000,
  snacks: 5,
  trainers: 1,
  alarm: 1,
  career: 1,
  job: 1,
  xp: 300,
  int: 100,
  cha: 100,
  str: 100,
  school: 2,
  furniture: 31,
  house: 2,
  heat: 3,
};

const overlaps = (a: Box, b: Box) =>
  a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

describe("room registry", () => {
  it("defines every one of the sixteen interiors once", () => {
    expect(PLACE_IDS).toHaveLength(16);
    expect(new Set(PLACE_IDS).size).toBe(16);
    for (const id of PLACE_IDS) expect(ROOMS[id].id).toBe(id);
  });

  it("recognises only real places", () => {
    expect(isPlace("bank")).toBe(true);
    expect(isPlace("moon-base")).toBe(false);
  });

  it("gives each room its own palette", () => {
    const walls = PLACE_IDS.map((id) => ROOMS[id].palette.wall);
    expect(new Set(walls).size).toBeGreaterThanOrEqual(14);
  });

  it("changes the home room with housing tier", () => {
    const cardboard = roomFor("home", { ...START, house: 0 });
    const mansion = roomFor("home", { ...START, house: 3 });
    expect(cardboard.title).not.toBe(mansion.title);
    expect(cardboard.palette.wall).not.toBe(mansion.palette.wall);
  });
});

describe("hotspots", () => {
  for (const id of PLACE_IDS) {
    describe(id, () => {
      const room = ROOMS[id];

      it("keeps every object inside the drawn room", () => {
        for (const h of room.hotspots) {
          expect(h.box.x).toBeGreaterThanOrEqual(0);
          expect(h.box.y).toBeGreaterThanOrEqual(0);
          expect(h.box.x + h.box.w).toBeLessThanOrEqual(VIEW.w);
          expect(h.box.y + h.box.h).toBeLessThanOrEqual(VIEW.h);
        }
      });

      it("gives every object a touch target at least 40 units across", () => {
        for (const h of room.hotspots) {
          expect(h.box.w, `${h.label} width`).toBeGreaterThanOrEqual(40);
          expect(h.box.h, `${h.label} height`).toBeGreaterThanOrEqual(40);
        }
      });

      it("has unique object ids and labels", () => {
        expect(new Set(room.hotspots.map((h) => h.id)).size).toBe(room.hotspots.length);
        expect(new Set(room.hotspots.map((h) => h.label)).size).toBe(room.hotspots.length);
      });

      it("does not overlap objects, so every tap lands on one thing", () => {
        const all = room.hotspots;
        for (let i = 0; i < all.length; i++) {
          for (let j = i + 1; j < all.length; j++) {
            const a = all[i]!,
              b = all[j]!;
            expect(overlaps(a.box, b.box), `${a.label} overlaps ${b.label}`).toBe(false);
          }
        }
      });

      it("gives each visible object something to show or do", () => {
        for (const h of visibleHotspots(room, START)) {
          const actions = hotspotActions(h, START);
          const lines = h.lines?.(START) ?? [];
          expect(actions.length + lines.length, h.label).toBeGreaterThan(0);
        }
      });

      it("never throws when any offered action is used, broke or rich", () => {
        for (const state of [START, rich]) {
          for (const h of visibleHotspots(roomFor(id, state), state)) {
            for (const action of hotspotActions(h, state)) {
              expect(() => runAction(state, action, () => 0.5), `${id}/${action.id}`).not.toThrow();
              expect(
                () => runAction(state, action, () => 0.99),
                `${id}/${action.id}`,
              ).not.toThrow();
            }
          }
        }
      });
    });
  }

  it("keeps the nested home furniture as conditional, not missing", () => {
    const bare = visibleHotspots(ROOMS.home, START).map((h) => h.id);
    const furnished = visibleHotspots(ROOMS.home, rich).map((h) => h.id);
    expect(bare).toContain("bed");
    expect(bare).not.toContain("weights");
    expect(furnished).toEqual(
      expect.arrayContaining(["bed", "weights", "desk", "sofa", "kitchen"]),
    );
  });

  it("hides the estate board once the mansion is owned", () => {
    expect(visibleHotspots(ROOMS.home, { ...START, house: 2 }).map((h) => h.id)).toContain(
      "estate",
    );
    expect(visibleHotspots(ROOMS.home, { ...START, house: 3 }).map((h) => h.id)).not.toContain(
      "estate",
    );
  });

  it("offers each workplace its own shift and promotion, but only once employed", () => {
    const corporate = visibleHotspots(ROOMS.work, START);
    const shift = corporate.find((h) => h.id === "workstation");
    expect(hotspotActions(shift!, START).map((a) => a.id)).toEqual(["shift"]);
    const elsewhere = { ...START, career: 2 };
    expect(hotspotActions(shift!, elsewhere)).toEqual([]);
  });
});
