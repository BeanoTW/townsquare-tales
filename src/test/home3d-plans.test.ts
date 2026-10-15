import { describe, expect, it } from "vitest";
import { PLANS, planFor } from "@/lib/home3d/plans";
import { insideFootprint, overlaps, visibleSlots, type HomePlan } from "@/lib/home3d/layout";
import { approachable, buildNav, isReached, reachable } from "@/lib/home3d/nav";
import { homeZones, furnitureZone } from "@/lib/home-zones";
import { HOUSES } from "@/lib/game-data";
import { FURNITURE } from "@/lib/furniture";

const rectOf = (s: { x: number; z: number; w: number; d: number }) => ({ x0: s.x - s.w / 2, z0: s.z - s.d / 2, x1: s.x + s.w / 2, z1: s.z + s.d / 2 });
const hit = (a: ReturnType<typeof rectOf>, b: ReturnType<typeof rectOf>) => a.x0 < b.x1 && a.x1 > b.x0 && a.z0 < b.z1 && a.z1 > b.z0;
const allIds = (p: HomePlan) => p.slots.map((s) => s.id);

describe.each(PLANS.map((p) => [p.tier, p.name, p] as const))("home plan %i: %s", (_t, _n, plan) => {
  it("is the plan for its tier", () => {
    expect(planFor(plan.tier)).toBe(plan);
  });
  it("offers a camera focus for every room button the game shows", () => {
    for (const z of homeZones(plan.tier)) expect(plan.focus[z.id], z.id).toBeTruthy();
    expect(plan.focus.all).toBeTruthy();
  });
  it("keeps every opening inside its wall and below the ceiling", () => {
    for (const w of plan.walls) {
      const len = Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
      for (const o of w.openings) {
        expect(o.u0, w.id).toBeGreaterThanOrEqual(0.2);
        expect(o.u1, w.id).toBeLessThanOrEqual(len - 0.2);
        expect(o.v1, w.id).toBeLessThanOrEqual(w.height);
      }
    }
  });
  it("places every slot inside the building, inside a room of its own zone, without overlaps", () => {
    for (const s of plan.slots) {
      expect(insideFootprint(plan, s), s.id).toBe(true);
      const ok = plan.rooms.some((r) => r.zone === s.zone && rectOf(s).x0 >= r.rect.x0 - 1e-6 && rectOf(s).x1 <= r.rect.x1 + 1e-6 && rectOf(s).z0 >= r.rect.z0 - 1e-6 && rectOf(s).z1 <= r.rect.z1 + 1e-6);
      expect(ok, `${s.id} in ${s.zone}`).toBe(true);
      // The classic UI files the weights under a "study" zone the Studio Flat does not have, so they were unreachable there.
      const studioWeights = plan.tier === 1 && s.id === "weights";
      expect(furnitureZone(s.id, plan.tier) === s.zone || s.id === "blackjack" || s.id === "slots" || studioWeights, `${s.id} zone matches the game`).toBe(true);
    }
    for (let i = 0; i < plan.slots.length; i++) {
      for (let j = i + 1; j < plan.slots.length; j++) expect(overlaps(plan.slots[i]!, plan.slots[j]!), `${plan.slots[i]!.id}/${plan.slots[j]!.id}`).toBe(false);
      for (const c of plan.colliders) expect(hit(rectOf(plan.slots[i]!), c), `${plan.slots[i]!.id} vs collider`).toBe(false);
    }
  });
  it("has a spawn at the front door and in every zone, all on walkable floor connected to the door", () => {
    const nav = buildNav(plan, allIds(plan));
    const seen = reachable(nav, plan.spawn.entry);
    expect(isReached(nav, seen, ...plan.spawn.entry), "entry").toBe(true);
    for (const [z, p] of Object.entries(plan.spawn.zones)) expect(isReached(nav, seen, p![0], p![1]), `spawn ${z}`).toBe(true);
    // The front door sits on the building edge (outside the walkable area); every interior doorway must be reachable.
    for (const d of plan.doors.filter((x) => x.a[1] < plan.size.d - 0.01 || x.b[1] < plan.size.d - 0.01)) expect(isReached(nav, seen, (d.a[0] + d.b[0]) / 2, (d.a[1] + d.b[1]) / 2), `door ${d.a}`).toBe(true);
  });
  it("lets a character reach and use every piece of furniture at once", () => {
    const nav = buildNav(plan, allIds(plan));
    const seen = reachable(nav, plan.spawn.entry);
    for (const s of plan.slots) expect(approachable(nav, seen, rectOf(s)), s.id).toBe(true);
  });
  it("reaches every room, not just the ones near the door", () => {
    const nav = buildNav(plan, allIds(plan));
    const seen = reachable(nav, plan.spawn.entry);
    for (const r of plan.rooms) {
      let found = false;
      for (let x = r.rect.x0; x <= r.rect.x1 && !found; x += 0.2) for (let z = r.rect.z0; z <= r.rect.z1; z += 0.2) if (isReached(nav, seen, x, z)) { found = true; break; }
      expect(found, r.name).toBe(true);
    }
  });
  it("only lists NPCs where they do not block a doorway", () => {
    for (const n of plan.npcs ?? []) for (const d of plan.doors) expect(Math.hypot(n.x - (d.a[0] + d.b[0]) / 2, n.z - (d.a[1] + d.b[1]) / 2), n.id).toBeGreaterThan(1);
  });
});

describe("the housing ladder", () => {
  it("has one plan per property and each is bigger than the last", () => {
    expect(PLANS.length).toBe(HOUSES.length);
    for (let i = 1; i < PLANS.length; i++) expect(PLANS[i]!.size.w * PLANS[i]!.size.d).toBeGreaterThan(PLANS[i - 1]!.size.w * PLANS[i - 1]!.size.d);
  });
  it("gives each tier a different shell: proportions, ceilings, materials and room count", () => {
    const sig = PLANS.map((p) => JSON.stringify([p.size, [...new Set(p.floors.map((f) => f.kind))].sort(), p.rooms.length]));
    expect(new Set(sig).size).toBe(PLANS.length);
    const heights = PLANS.map((p) => p.size.h);
    expect(heights[3]).toBeGreaterThan(heights[2]!);
    expect(heights[0]).toBeLessThan(heights[1]!);
  });
  it("splits the larger homes into physically separate rooms joined by doorways", () => {
    expect(PLANS[0]!.rooms.length).toBe(1);
    expect(PLANS[2]!.rooms.length).toBeGreaterThanOrEqual(4);
    expect(PLANS[3]!.rooms.length).toBeGreaterThanOrEqual(6);
    for (const p of [PLANS[2]!, PLANS[3]!]) expect(p.walls.filter((w) => !w.outer).length).toBeGreaterThanOrEqual(4);
  });
  it("only the mansion has the games room, with blackjack, slots and three friends", () => {
    for (const p of PLANS.slice(0, 3)) expect(allIds(p)).not.toContain("blackjack");
    expect(allIds(PLANS[3]!)).toEqual(expect.arrayContaining(["blackjack", "slots"]));
    expect(PLANS[3]!.npcs?.length).toBe(3);
  });
  it("has a slot for every purchasable piece that the tier's rules allow", () => {
    for (const p of PLANS) for (const f of FURNITURE) {
      const electronic = f.id === "tv" || f.id === "console" || f.id === "bookshelf";
      if (p.tier === 0 && electronic) continue;
      expect(allIds(p), `${p.name} ${f.id}`).toContain(f.id);
    }
  });
  it("does not hand out furniture: with nothing owned only the always-present slots show", () => {
    for (const p of PLANS) expect(visibleSlots(p, []).length).toBe(0);
  });
});
