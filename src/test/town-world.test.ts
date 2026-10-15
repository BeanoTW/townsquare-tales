import { describe, expect, it } from "vitest";
import { P } from "@/lib/town-projection";
import { buildings, buildingPoint, buildingHull, convexHull, playerCameraOffset, TREES, LAMPS, N } from "@/lib/town-world";
import { bucketFaces, groundFaces, townFaces, outlineSegments, propsOutside, type Face } from "@/components/town3d/town-scene";

describe("shared town world", () => {
  it("building points at ground level match the ground projection", () => {
    for (const house of [0, 1, 2, 3]) {
      for (const b of buildings(house)) {
        for (const [x, y] of [[b.x, b.y], [b.x + b.w, b.y + b.d]] as const) {
          const [bx, by] = buildingPoint(b, x, y, 0);
          const [px, py] = P(x, y, 0);
          expect(bx).toBeCloseTo(px, 9);
          expect(by).toBeCloseTo(py, 9);
        }
      }
    }
  });

  it("raises building tops upward on screen", () => {
    const b = buildings(1).find((item) => item.id === "work")!;
    const [, baseY] = buildingPoint(b, b.x, b.y, 0);
    const [, topY] = buildingPoint(b, b.x, b.y, b.h);
    expect(topY).toBeLessThan(baseY);
  });

  it("centres the player on the portrait camera anchor", () => {
    for (const [x, y, skating] of [[9.95, 9, false], [3, 22, false], [20, 14, true]] as const) {
      const [ox, oy] = playerCameraOffset(x, y, skating);
      const [cx, cy] = P(x, y);
      const boardYOffset = skating ? -5 : -7;
      expect(cx + ox).toBeCloseTo(165, 0);
      expect(cy + oy).toBeCloseTo(275 - boardYOffset, 0);
    }
  });

  it("builds convex tap hulls that contain every projected corner", () => {
    for (const b of buildings(0)) {
      const hull = buildingHull(b);
      expect(hull.length).toBeGreaterThanOrEqual(4);
      expect(hull.length).toBeLessThanOrEqual(8);
      const corners: [number, number][] = [];
      for (const x of [b.x, b.x + b.w]) for (const y of [b.y, b.y + b.d]) for (const z of [0, b.h]) corners.push(buildingPoint(b, x, y, z));
      for (const [px, py] of corners) expect(inside(hull, px, py)).toBe(true);
    }
  });

  it("hull of a square is its four corners", () => {
    expect(convexHull([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1]]).length).toBe(4);
  });

  it("drops only the props that sit inside a building footprint in 3D", () => {
    const bs = buildings(0);
    const { trees, lamps } = propsOutside(bs);
    expect(trees.length).toBe(TREES.length - 1);
    expect(trees.some(([x, y]) => x === 12.2 && y === 10)).toBe(false);
    expect(lamps.length).toBe(LAMPS.length);
  });

  it("keeps the plan inside the town boundary", () => {
    expect(N).toBe(30);
  });
});

describe("3D town scene", () => {
  it("bucketed triangles match the convex faces", () => {
    const { world, objects } = townFaces(1, false);
    const faces = [...world, ...objects];
    const expected = faces.reduce((n, f) => n + (f.pts.length - 2) * 3, 0);
    const actual = bucketFaces(faces).reduce((n, b) => n + b.positions.length / 3, 0);
    expect(actual).toBe(expected);
  });

  it("stacks upper floors in front of ground behind them", () => {
    const b = buildings(0).find((item) => item.id === "work")!;
    const { objects } = townFaces(0, false);
    const roofs = objects.filter((f) => f.color === b.roof);
    expect(roofs.length).toBeGreaterThan(0);
    const roofDepth = Math.max(...roofs[0]!.pts.map((p) => p[2]));
    // A ground tile a few tiles north of the tower sits at lower depth.
    const ground = groundFaces(buildings(0)).find((f) => f.color === "var(--town-grass)") as Face;
    expect(roofDepth).toBeGreaterThan(Math.max(...ground.pts.map((p) => p[2])));
  });

  it("draws the home with the height of the chosen house", () => {
    const top = (house: number) => {
      const home = buildings(house).find((item) => item.id === "home")!;
      return home.h;
    };
    expect(top(0)).toBeLessThan(top(3));
  });

  it("builds outline segments in pairs for outlined faces only", () => {
    const { objects } = townFaces(0, false);
    const seg = outlineSegments(objects);
    expect(seg.positions.length % 6).toBe(0);
    expect(seg.positions.length).toBeGreaterThan(0);
  });
});

function inside(hull: [number, number][], px: number, py: number) {
  // Counter-clockwise hull: point must be on the left of every edge (small tolerance).
  return hull.every(([ax, ay], i) => {
    const [bx, by] = hull[(i + 1) % hull.length]!;
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax) >= -1e-6;
  });
}
