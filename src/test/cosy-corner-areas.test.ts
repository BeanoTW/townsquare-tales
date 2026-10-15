import { describe, expect, it } from "vitest";
import { SHOP_LAYOUTS, shopRoute } from "@/lib/walkable-shops";
import { FURNITURE, LUXURY_FURNITURE } from "@/lib/furniture";

describe("Cosy Corner shopping areas", () => {
  it("has distinct reachable basic and premium counters", () => {
    const basic = SHOP_LAYOUTS.furniture.find(f => f.id === "catalogue");
    const premium = SHOP_LAYOUTS.furniture.find(f => f.id === "premium");
    expect(basic).toBeDefined();
    expect(premium).toBeDefined();
    expect(basic!.x).not.toBe(premium!.x);
    expect(shopRoute("furniture", { x: 9, y: 12 }, basic!.approach).length).toBeGreaterThan(0);
    expect(shopRoute("furniture", { x: 9, y: 12 }, premium!.approach).length).toBeGreaterThan(0);
  });
  it("keeps matching basic and luxury collections", () => {
    expect(FURNITURE.map(x => x.id)).toEqual(LUXURY_FURNITURE.map(x => x.id));
  });
});
