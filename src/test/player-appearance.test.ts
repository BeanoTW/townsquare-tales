import { describe, expect, it } from "vitest";
import { Matrix4, Vector3 } from "three";
import { karmaHeadColor, shopPlayerClipMatrix } from "@/lib/player-appearance";

describe("shared player appearance", () => {
  it("retains the town's karma colour indoors, including its saturation limits", () => {
    expect(karmaHeadColor(0)).toBe("rgb(255, 244, 214)");
    expect(karmaHeadColor(30)).toBe("rgb(73, 161, 255)");
    expect(karmaHeadColor(-30)).toBe("rgb(216, 59, 76)");
    expect(karmaHeadColor(100)).toBe(karmaHeadColor(30));
    expect(karmaHeadColor(-100)).toBe(karmaHeadColor(-30));
  });
});

describe("shop character alignment", () => {
  it.each([[432, 360], [360, 640], [1280, 480]])("matches SVG ground positions at %s × %s", (w, h) => {
    const matrix = new Matrix4().fromArray(shopPlayerClipMatrix(w, h));
    const scale = Math.min(w / 432, h / 360);
    for (const [x, z] of [[1, 1], [9, 13], [17, 14]]) {
      const projected = new Vector3(x, 0, z).applyMatrix4(matrix);
      expect((projected.x + 1) * w / 2).toBeCloseTo((w - 432 * scale) / 2 + x! * 24 * scale);
      expect((1 - projected.y) * h / 2).toBeCloseTo((h - 360 * scale) / 2 + z! * 24 * scale);
    }
  });
  it("lifts the head above its ground position without moving sideways", () => {
    const matrix = new Matrix4().fromArray(shopPlayerClipMatrix(432, 360));
    const feet = new Vector3(9, 0, 7).applyMatrix4(matrix);
    const head = new Vector3(9, 1.5, 7).applyMatrix4(matrix);
    expect(head.x).toBe(feet.x);
    expect(head.y).toBeGreaterThan(feet.y);
  });
});
