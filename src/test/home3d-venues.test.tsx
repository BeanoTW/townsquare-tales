import { describe, expect, it } from "vitest";
import { VENUES, venuePlan } from "@/lib/home3d/venues";
import { insideFootprint, overlaps, visibleSlots, type HomePlan } from "@/lib/home3d/layout";
import { approachable, buildNav, isReached, reachable } from "@/lib/home3d/nav";
import { venueZones, isVenue } from "@/lib/home-zones";
import { roomFor, visibleHotspots } from "@/lib/rooms";
import { START } from "@/lib/game-data";

const rectOf = (s: { x: number; z: number; w: number; d: number }) => ({ x0: s.x - s.w / 2, z0: s.z - s.d / 2, x1: s.x + s.w / 2, z1: s.z + s.d / 2 });
const hit = (a: ReturnType<typeof rectOf>, b: ReturnType<typeof rectOf>) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
const ids = (p: HomePlan) => p.slots.map((s) => s.id);

describe.each(Object.entries(VENUES))("venue plan %s", (id, plan) => {
  const room = roomFor(id as never, START as never);
  it("is found by its place id", () => {
    expect(isVenue(id)).toBe(true);
    expect(venuePlan(id)).toBe(plan);
  });
  it("has exactly one slot per existing hotspot, using the hotspot ids", () => {
    expect([...ids(plan)].sort()).toEqual(room.hotspots.map((h) => h.id).sort());
    for (const h of visibleHotspots(room, START as never)) expect(visibleSlots(plan, [h.id]).length, h.id).toBe(1);
  });
  it("offers a camera focus for every room button", () => {
    for (const z of venueZones(id as never)) expect(plan.focus[z.id], z.id).toBeTruthy();
    expect(plan.focus.all).toBeTruthy();
  });
  it("keeps openings inside walls and below the ceiling", () => {
    for (const w of plan.walls) {
      const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      for (const o of w.openings) {
        expect(o.u0, w.id).toBeGreaterThanOrEqual(0.2);
        expect(o.u1, w.id).toBeLessThanOrEqual(len - 0.2);
        expect(o.v1, w.id).toBeLessThanOrEqual(w.height);
      }
    }
  });
  it("places every slot inside a room of its zone, clear of other slots and colliders", () => {
    for (const s of plan.slots) {
      expect(insideFootprint(plan, s), s.id).toBe(true);
      const r = rectOf(s);
      expect(plan.rooms.some((m) => m.zone === s.zone && r.x0 >= m.rect.x0 - 1e-6 && r.x1 <= m.rect.x1 + 1e-6 && r.z0 >= m.rect.z0 - 1e-6 && r.z1 <= m.rect.z1 + 1e-6), `${s.id} in ${s.zone}`).toBe(true);
    }
    for (let i = 0; i < plan.slots.length; i++) {
      for (let j = i + 1; j < plan.slots.length; j++) expect(overlaps(plan.slots[i]!, plan.slots[j]!), `${plan.slots[i]!.id}/${plan.slots[j]!.id}`).toBe(false);
      for (const c of plan.colliders) expect(hit(rectOf(plan.slots[i]!), c), `${plan.slots[i]!.id} vs collider`).toBe(false);
    }
  });
  it("is walkable: spawns, doorways, every room and every fixture reachable from the entrance", () => {
    const nav = buildNav(plan, ids(plan));
    const seen = reachable(nav, plan.spawn.entry);
    expect(isReached(nav, seen, ...plan.spawn.entry), "entry").toBe(true);
    for (const [z, p] of Object.entries(plan.spawn.zones)) expect(isReached(nav, seen, p![0], p![1]), `spawn ${z}`).toBe(true);
    for (const d of plan.doors.filter((x) => x.a[1] < plan.size.d - 0.01 || x.b[1] < plan.size.d - 0.01)) expect(isReached(nav, seen, (d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2), `door ${d.a}`).toBe(true);
    for (const s of plan.slots) expect(approachable(nav, seen, rectOf(s)), s.id).toBe(true);
    for (const r of plan.rooms) {
      let found = false;
      for (let x = r.rect.x0; x <= r.rect.x1 && !found; x += 0.2) for (let z = r.rect.z0; z <= r.rect.z1; z += 0.2) if (isReached(nav, seen, x, z)) { found = true; break; }
      expect(found, r.name).toBe(true);
    }
  });
  it("keeps people away from the doorways", () => {
    for (const n of plan.npcs ?? []) for (const d of plan.doors) expect(Math.hypot(n.x - (d.a[0] + d.b[0]) / 2, n.z - (d.a[1] + d.b[1]) / 2), n.id).toBeGreaterThan(1);
  });
});

describe("the 3D venues", () => {
  it("are genuinely different buildings", () => {
    const sig = Object.values(VENUES).map((p) => JSON.stringify([p.size, [...new Set(p.floors.map((f) => f.kind))].sort(), p.rooms.length]));
    expect(new Set(sig).size).toBe(Object.keys(VENUES).length);
  });
  it("the casino is windowless and has a separate high-stakes room, a bar has windows, the gym has a changing room", () => {
    expect(VENUES.casino.walls.flatMap((w) => w.openings).some((o) => o.kind === "window")).toBe(false);
    expect(VENUES.casino.rooms.some((r) => r.zone === "vip")).toBe(true);
    expect(VENUES.bar.walls.flatMap((w) => w.openings).some((o) => o.kind === "window")).toBe(true);
    expect(VENUES.gym.rooms.some((r) => r.name === "Changing rooms")).toBe(true);
  });
  it("keeps Town Police's original front desk and wanted-board layout", () => {
    const police = VENUES.police;
    expect(police.slots.map(s => s.id).sort()).toEqual(["front-desk", "wanted"]);
    const desk = police.slots.find(s => s.id === "front-desk")!;
    const wanted = police.slots.find(s => s.id === "wanted")!;
    expect(desk.x).toBeLessThan(wanted.x);
    expect(desk.z).toBeGreaterThan(wanted.z);
    expect(roomFor("police", START as never).hotspots.map(h => h.id).sort()).toEqual(["front-desk", "wanted"]);
  });
  it("the casino seats real people at its tables", () => {
    expect(VENUES.casino.npcs!.filter((n) => n.pose === "sit").length).toBeGreaterThanOrEqual(2);
  });
  it("only venues in the list get a plan", () => {
    expect(venuePlan("shop")).toBeNull();
    expect(isVenue("home")).toBe(false);
  });
});

import { render } from "@testing-library/react";
import { LocationScene } from "@/components/LocationScene";
import { luxuryMap } from "@/components/home3d/Home3DStage";
import { COUNTERS } from "@/lib/counter-robbery";
import { requiresMainsPower } from "@/lib/home-zones";

describe("venue integration", () => {
  const scene = (id: string) => {
    const s = { ...START } as never;
    return render(<LocationScene room={roomFor(id as never, s)} state={s} feedback={null} onRun={() => {}} onLeave={() => {}} />);
  };
  it("falls back to the classic renderers when WebGL is unavailable", () => {
    for (const id of ["casino", "gym", "bar"]) {
      const { container, unmount } = scene(id);
      expect(container.querySelector("[data-home3d]"), id).toBeNull();
      expect(container.querySelector("[data-renderer-toggle]"), id).toBeNull();
      expect(container.querySelector(`[data-room="${id}"]`), id).not.toBeNull();
      unmount();
    }
  });
  it("keeps every hotspot's launch target and till-robbery counter reachable from a plan slot", () => {
    const casino = roomFor("casino", START as never);
    expect(casino.hotspots.filter((h) => h.launch).map((h) => h.id).sort()).toEqual(["blackjack", "slots"]);
    expect(roomFor("bar", START as never).hotspots.find((h) => h.launch === "darts")?.id).toBe("dartboard");
    expect(VENUES.bar.slots.map((s) => s.id)).toContain(COUNTERS.bar);
  });
  it("never reads home furniture ownership, so venues give and take nothing", () => {
    expect(Object.keys(luxuryMap(START as never)).some((k) => VENUES.casino.slots.some((s) => s.id === k) || VENUES.gym.slots.some((s) => s.id === k))).toBe(false);
    for (const p of Object.values(VENUES)) for (const s of p.slots) expect(requiresMainsPower(s.id)).toBe(false);
  });
});