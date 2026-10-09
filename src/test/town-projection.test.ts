import { describe, expect, it } from "vitest";
import { P, buildings, door } from "@/components/TownMap";
describe("upright oblique town projection", () => {
  it("keeps east-west streets horizontal", () => {
    const a=P(3,8.5), b=P(22,8.5);
    expect(a[1]).toBe(b[1]); expect(b[0]).toBeGreaterThan(a[0]);
  });
  it("keeps north-south streets vertical", () => {
    const a=P(8.5,2), b=P(8.5,25);
    expect(a[0]).toBe(b[0]); expect(b[1]).toBeGreaterThan(a[1]);
  });
  it("gives buildings visible 3D height without rotating streets", () => {
    const base=P(10,10), roof=P(10,10,70);
    expect(roof[1]).toBeLessThan(base[1]); expect(roof[0]).toBeGreaterThan(base[0]);
  });
  it("aligns all entrances to a street-facing frontage", () => {
    for (const b of buildings(0)) {
      const threshold=door(b);
      expect(threshold.x).toBeGreaterThan(b.x);
      expect(threshold.x).toBeLessThan(b.x+b.w);
      expect(threshold.y).toBeGreaterThan(b.y+b.d);
    }
  });
});
