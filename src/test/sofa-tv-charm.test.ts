import { describe, expect, it } from "vitest";
import { RELAX_SOFA, TV_CHANNELS, runAction, watchTvAction } from "@/lib/actions";
import { START } from "@/lib/game-data";
import { FURNITURE } from "@/lib/furniture";

describe("sofa and TV charm balance", () => {
  it("sofa restores up to 15 energy without generating charm", () => {
    const state = { ...START, energy: 90, cha: 12 };
    const result = runAction(state, RELAX_SOFA);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next.energy).toBe(100);
    expect(result.next.cha).toBe(12);
  });

  it("drama and comedy award exactly one charm with a TV", () => {
    const tv = FURNITURE.find(item => item.id === "tv")!;
    const state = { ...START, house: 1, furniture: START.furniture | tv.bit, energy: 100 };
    for (const id of ["social", "comedy"] as const) {
      const result = runAction(state, watchTvAction(id));
      expect(result.ok).toBe(true);
      if (result.ok) expect(result.next.cha).toBe(state.cha + 1);
    }
    expect(TV_CHANNELS.filter(channel => channel.stat === "cha").every(channel => channel.gain === 1)).toBe(true);
  });
});
