import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { TV_CHANNELS, furnitureAction, runAction, watchTvAction } from "@/lib/actions";
import { ownsFurniture } from "@/lib/furniture";
import { parseGame } from "@/lib/game-state";
import { ROOMS, visibleHotspots, hotspotActions } from "@/lib/rooms";
import { vignetteForAction } from "@/components/ActionVignette";

describe("home television", () => {
  const flat = { ...START, house: 1, money: 1000 };
  it("can be bought once and ownership survives save parsing", () => {
    const purchase = runAction(flat, furnitureAction("tv", flat));
    expect(purchase.ok).toBe(true);
    if (!purchase.ok) return;
    expect(purchase.next.money).toBe(550);
    expect(ownsFurniture(purchase.next.furniture, "tv")).toBe(true);
    expect(ownsFurniture(parseGame(JSON.stringify(purchase.next), START).furniture, "tv")).toBe(true);
    expect(runAction(purchase.next, furnitureAction("tv", purchase.next)).ok).toBe(false);
  });
  it("requires a flat and a purchased TV to watch", () => {
    expect(runAction(flat, watchTvAction("science")).ok).toBe(false);
    expect(runAction({ ...START, furniture: 32 }, watchTvAction("science")).ok).toBe(false);
  });
  it.each(TV_CHANNELS)("gives the correct $stat gain for $name at a time and energy cost", (channel) => {
    const ready = { ...flat, furniture: 32, hour: 9, energy: 100 };
    const result = runAction(ready, watchTvAction(channel.id));
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.next[channel.stat]).toBe(ready[channel.stat] + channel.gain);
    expect(result.next.hour).toBe(9 + channel.hours);
    expect(result.next.energy).toBe(100 - channel.energy);
    expect(vignetteForAction("tv-" + channel.id)).toBe("tv");
  });
  it("shows the TV hotspot only when owned in a flat or better", () => {
    expect(visibleHotspots(ROOMS.home, flat).some(h => h.id === "television")).toBe(false);
    const tvState = { ...flat, furniture: 32 };
    const hotspot = visibleHotspots(ROOMS.home, tvState).find(h => h.id === "television");
    expect(hotspot).toBeDefined();
    expect(hotspotActions(hotspot!, tvState)).toHaveLength(4);
  });
});
