import * as THREE from "three";

/**
 * The town is a real 3D world measured in map tiles:
 *   X = map x (east), Y = height, Z = map y (south).
 * It is drawn with a fixed oblique projection whose ground plane is exactly the
 * classic map projection P (48 px per tile across, 36 px per tile down), so the
 * portrait follow camera, taps, drag-to-move and the minimap are unchanged.
 * Height lifts things up the screen and leans them slightly right, so the south
 * and west walls (where most doors are) face the player.
 */
export { TILE_X, TILE_Z, LIFT, SKEW, VIEW_W, VIEW_H, screenOf, boxHull } from "@/components/town3d/screen";
import { TILE_X, TILE_Z, LIFT, SKEW, VIEW_W, VIEW_H } from "@/components/town3d/screen";
const DEPTH_MID = 20;
const DEPTH_HALF = 45;

/** Direction from the scene towards the viewer: every point along it lands on the same pixel. */
export const VIEW_DIR = new THREE.Vector3(-SKEW / TILE_X, 1, LIFT / TILE_Z).normalize();

/**
 * World-to-clip matrix for a viewport of width x height CSS pixels. The SVG uses
 * viewBox 330x550 with "xMidYMid slice", then translates the world by (ox, oy);
 * this matrix reproduces both. Depth is height + southness, which increases
 * monotonically towards the viewer along every view ray.
 */
export function townClipMatrix(width: number, height: number, ox: number, oy: number, out = new THREE.Matrix4()): THREE.Matrix4 {
  const k = Math.max(width / VIEW_W, height / VIEW_H);
  const sx = (2 * k) / Math.max(1, width);
  const sy = (2 * k) / Math.max(1, height);
  return out.set(
    TILE_X * sx, SKEW * sx, 0, (ox - VIEW_W / 2) * sx,
    0, LIFT * sy, -TILE_Z * sy, -(oy - VIEW_H / 2) * sy,
    0, -1 / DEPTH_HALF, -1 / DEPTH_HALF, DEPTH_MID / DEPTH_HALF,
    0, 0, 0, 1,
  );
}

/** Camera orientation whose view axis matches the projection, so lighting and glass reflections read correctly. */
export const VIEW_QUATERNION = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), VIEW_DIR);

/**
 * Point the given camera at the town: identity position, VIEW_QUATERNION rotation,
 * and a projection that composes the oblique clip matrix with the inverse view.
 */
export function applyTownCamera(camera: THREE.Camera, width: number, height: number, ox: number, oy: number) {
  camera.position.set(0, 0, 0);
  camera.quaternion.copy(VIEW_QUATERNION);
  camera.updateMatrixWorld(true);
  const clip = townClipMatrix(width, height, ox, oy);
  camera.projectionMatrix.multiplyMatrices(clip, camera.matrixWorld);
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
}
