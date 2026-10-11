import { describe, expect, it } from "vitest";
import { P, buildings, door, playerCameraViewBox } from "@/components/TownMap";
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
      if (b.facing === "north") expect(threshold.y).toBeLessThan(b.y);
      if (b.facing === "south") expect(threshold.y).toBeGreaterThan(b.y+b.d);
      if (b.facing === "east") expect(threshold.x).toBeGreaterThan(b.x+b.w);
      if (b.facing === "west") expect(threshold.x).toBeLessThan(b.x);
    }
  });
  it("keeps the visible player head centred when travelling north and south", () => {
    for (const y of [2, 9, 16, 25]) {
      const x = 10;
      const parts = playerCameraViewBox(x, y).split(" ").map(Number);
      const left = parts[0]!, top = parts[1]!, width = parts[2]!, height = parts[3]!;
      const [px, py] = P(x, y);
      expect(left + width / 2).toBe(px);
      expect(top + height / 2).toBe(py - 7);
    }
  });
  it("centres uphill and downhill skating on the combined board and rider", () => {
    const [, groundY] = P(10, 14);
    const centre = (angle: number) => {
      const parts = playerCameraViewBox(10, 14, true, angle).split(" ").map(Number);
      return parts[1]! + parts[3]! / 2;
    };
    expect(centre(0)).toBe(groundY - 5);
    expect(centre(180)).toBe(groundY - 5);
    expect(centre(90)).toBe(groundY - 5);
  });
});
