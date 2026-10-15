import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { P } from "@/lib/town-projection";
import { buildings, convexHull, playerCameraOffset, ROADS, TREES, LAMPS } from "@/lib/town-world";
import { screenOf, boxHull, townSky, nightLevel } from "@/components/town3d/screen";
import { applyTownCamera, townClipMatrix, VIEW_DIR } from "@/components/town3d/projection";
import { buildingHull3d, buildingTop } from "@/components/town3d/specs";
import { kerbSegments, pavementRects, approachRects } from "@/components/town3d/ground";
import { propsOutside } from "@/components/town3d/props";
import { carPositions } from "@/components/town3d/actors";
import { bakeGeometry } from "@/components/town3d/StaticBatch";
import { mixColor, shade } from "@/components/town3d/palette";

const inside = (hull: [number, number][], px: number, py: number) =>
  hull.every(([ax, ay], i) => {
    const [bx, by] = hull[(i + 1) % hull.length]!;
    return (bx - ax) * (py - ay) - (by - ay) * (px - ax) >= -1e-6;
  });

/** Pixel position the SVG layer gives a world point: viewBox 330×550, slice, then the camera translate. */
function svgPixel(sx: number, sy: number, ox: number, oy: number, W: number, H: number) {
  const k = Math.max(W / 330, H / 550);
  return [(sx + ox - 165) * k + W / 2, (sy + oy - 275) * k + H / 2] as const;
}
function clipToPixel(v: THREE.Vector3, W: number, H: number) {
  return [(v.x + 1) * W / 2, (1 - v.y) * H / 2] as const;
}

describe("shared town data", () => {
  it("hull of a square is its four corners", () => {
    expect(convexHull([[0, 0], [2, 0], [2, 2], [0, 2], [1, 1]]).length).toBe(4);
  });

  it("centres the player on the portrait camera anchor", () => {
    for (const [x, y, skating] of [[9.95, 9, false], [3, 22, false], [20, 14, true]] as const) {
      const [ox, oy] = playerCameraOffset(x, y, skating);
      const [cx, cy] = P(x, y);
      expect(cx + ox).toBeCloseTo(165, 0);
      expect(cy + oy).toBeCloseTo(275 - (skating ? -5 : -7), 0);
    }
  });
});

describe("3D town projection keeps the classic point of view", () => {
  it("puts the ground exactly where the classic projection does", () => {
    for (const [x, z] of [[0, 0], [9.95, 9], [17.3, 22.1], [30, 30]] as const) {
      const [sx, sy] = screenOf(x, 0, z);
      const [px, py] = P(x, z);
      expect(sx).toBeCloseTo(px, 9);
      expect(sy).toBeCloseTo(py, 9);
    }
  });

  it("lifts height up the screen", () => {
    expect(screenOf(5, 2, 5)[1]).toBeLessThan(screenOf(5, 0, 5)[1]);
  });

  it("projects to the same pixels as the SVG layer on phone and desktop viewports", () => {
    for (const [W, H] of [[390, 844], [1280, 800], [768, 1024]] as const) {
      const [ox, oy] = playerCameraOffset(9.95, 9);
      const M = townClipMatrix(W, H, ox, oy);
      for (const [x, z] of [[9.95, 9], [12, 11], [7, 14]] as const) {
        const clip = new THREE.Vector3(x, 0, z).applyMatrix4(M);
        const [px, py] = clipToPixel(clip, W, H);
        const [ex, ey] = svgPixel(...P(x, z), ox, oy, W, H);
        expect(px).toBeCloseTo(ex, 3);
        expect(py).toBeCloseTo(ey, 3);
      }
    }
  });

  it("composes the camera so view × projection equals the clip matrix", () => {
    const cam = new THREE.OrthographicCamera();
    applyTownCamera(cam, 390, 844, 12, -40);
    cam.updateMatrixWorld(true);
    const combined = new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse);
    const expected = townClipMatrix(390, 844, 12, -40);
    combined.elements.forEach((v, i) => expect(v).toBeCloseTo(expected.elements[i]!, 6));
  });

  it("orders depth towards the viewer along every view ray", () => {
    const M = townClipMatrix(390, 844, 0, 0);
    const far = new THREE.Vector3(10, 0, 10).applyMatrix4(M);
    const near = new THREE.Vector3(10, 0, 10).addScaledVector(VIEW_DIR, 1.5).applyMatrix4(M);
    expect(near.x).toBeCloseTo(far.x, 6);
    expect(near.y).toBeCloseTo(far.y, 6);
    expect(near.z).toBeLessThan(far.z);
    // The whole town and its tallest building stay inside the depth range.
    for (const p of [[0, -0.7, 0], [30, 5, 30], [30, -0.7, 30]] as const) {
      const v = new THREE.Vector3(...p).applyMatrix4(M);
      expect(Math.abs(v.z)).toBeLessThan(1);
    }
  });
});

describe("3D buildings", () => {
  it("has a model height for every building and home tier", () => {
    for (const house of [0, 1, 2, 3]) for (const b of buildings(house)) expect(buildingTop(b, house)).toBeGreaterThan(0.5);
    expect(buildingTop({ id: "work" })).toBeGreaterThan(buildingTop({ id: "shop" }));
  });

  it("tap outlines cover each building from footprint to roof", () => {
    for (const house of [0, 3]) for (const b of buildings(house)) {
      const hull = buildingHull3d(b, house);
      const top = buildingTop(b, house);
      for (const [x, z] of [[b.x, b.y], [b.x + b.w, b.y + b.d], [b.x + b.w / 2, b.y + b.d / 2]] as const) {
        for (const y of [0, top]) expect(inside(hull, ...screenOf(x, y, z))).toBe(true);
      }
    }
    expect(boxHull(0, 0, 1, 1, 1).length).toBeGreaterThanOrEqual(4);
  });
});

describe("3D ground", () => {
  it("leaves kerbs open where side streets join", () => {
    const kerbs = kerbSegments();
    expect(kerbs.length).toBeGreaterThan(10);
    // Main Street's east kerb must stop for the market street (z 11.9 to 14.7).
    const eastMain = kerbs.filter((k) => k.axis === "z" && Math.abs(k.x - 11.4) < 1e-6);
    expect(eastMain.length).toBeGreaterThan(1);
    expect(eastMain.some((k) => k.z < 13.3 && k.z + k.len > 13.3)).toBe(false);
  });

  it("never runs a kerb across the middle of a road", () => {
    for (const k of kerbSegments()) {
      const mx = k.axis === "x" ? k.x + k.len / 2 : k.x;
      const mz = k.axis === "z" ? k.z + k.len / 2 : k.z;
      const across = ROADS.filter((r) => mx > r.x + 0.01 && mx < r.x + r.w - 0.01 && mz > r.y + 0.01 && mz < r.y + r.d - 0.01);
      expect(across, `kerb at ${mx},${mz}`).toHaveLength(0);
    }
  });

  it("matches the classic pavements and door paths", () => {
    expect(pavementRects()).toHaveLength(ROADS.length);
    for (const r of pavementRects()) {
      expect(r.x).toBeGreaterThanOrEqual(0);
      expect(r.x + r.w).toBeLessThanOrEqual(30 + 1e-9);
    }
    expect(approachRects(buildings(0))).toHaveLength(buildings(0).length);
  });

  it("drops only props that sit inside a building footprint", () => {
    const { trees, lamps } = propsOutside(buildings(0));
    expect(trees.length).toBe(TREES.length - 1);
    expect(trees.some(([x, y]) => x === 12.2 && y === 10)).toBe(false);
    expect(lamps.length).toBe(LAMPS.length);
  });
});

describe("3D traffic and batching", () => {
  it("keeps the classic car timing", () => {
    for (const t of [0, 3.7, 12.25]) {
      const [c1, c2, c3] = carPositions(t);
      expect(c1!.x).toBeCloseTo((t * 2.2) % 8, 9);
      expect(c2!.x).toBeCloseTo(11 + ((t * 1.7) % 12), 9);
      expect(c3!.z).toBeCloseTo(((t * 1.9 + 7) % 34) - 2, 9);
    }
  });

  it("bakes meshes into non-indexed geometry in world space", () => {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshStandardMaterial());
    mesh.position.set(5, 0.5, 7);
    mesh.updateMatrixWorld(true);
    const g = bakeGeometry(mesh, new THREE.Matrix4());
    expect(g.index).toBeNull();
    expect(Object.keys(g.attributes).sort()).toEqual(["normal", "position", "uv"]);
    g.computeBoundingBox();
    const c = new THREE.Vector3();
    g.boundingBox!.getCenter(c);
    expect(c.x).toBeCloseTo(5, 6);
    expect(c.z).toBeCloseTo(7, 6);
  });
});

describe("3D colour and sky", () => {
  it("mixes and shades hex colours", () => {
    expect(mixColor("#000000", "#ffffff", 0.5)).toBe("#808080");
    expect(shade("#808080", -1)).toBe("#000000");
  });

  it("darkens the sky and raises night lighting after dark", () => {
    expect(nightLevel(12)).toBe(0);
    expect(nightLevel(23)).toBeGreaterThan(0.9);
    expect(townSky(12)).not.toBe(townSky(23));
  });
});
