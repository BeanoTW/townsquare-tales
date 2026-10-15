import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

const KEEP = new Set(["position", "normal", "uv"]);
const CELL = 10;

/** Bake one mesh into a standalone, non-indexed geometry in the batch root's space. */
export function bakeGeometry(mesh: THREE.Mesh, toRoot: THREE.Matrix4): THREE.BufferGeometry {
  const src = mesh.geometry;
  const g = src.index ? src.toNonIndexed() : src.clone();
  for (const name of Object.keys(g.attributes)) if (!KEEP.has(name)) g.deleteAttribute(name);
  if (!g.getAttribute("normal")) g.computeVertexNormals();
  if (!g.getAttribute("uv")) g.setAttribute("uv", new THREE.Float32BufferAttribute(new Float32Array(g.getAttribute("position").count * 2), 2));
  g.morphAttributes = {};
  g.clearGroups();
  g.applyMatrix4(new THREE.Matrix4().multiplyMatrices(toRoot, mesh.matrixWorld));
  return g;
}

/**
 * Renders static children once (hidden), then merges them into one mesh per
 * material, shadow flag and 10×10-tile cell. Hundreds of small parts become a
 * few hundred draw calls, and off-screen cells are still frustum-culled.
 */
export function StaticBatch({ children, version }: { children: ReactNode; version: string }) {
  const source = useRef<THREE.Group>(null);
  const [merged, setMerged] = useState<THREE.Mesh[]>([]);
  useLayoutEffect(() => {
    const root = source.current;
    if (!root) return;
    root.updateMatrixWorld(true);
    const toRoot = root.matrixWorld.clone().invert();
    const buckets = new Map<string, { material: THREE.Material; cast: boolean; parts: THREE.BufferGeometry[] }>();
    const centre = new THREE.Vector3();
    root.traverse((o) => {
      const mesh = o as THREE.Mesh;
      if (!mesh.isMesh || Array.isArray(mesh.material)) return;
      mesh.getWorldPosition(centre);
      const cell = `${Math.floor(centre.x / CELL)}:${Math.floor(centre.z / CELL)}`;
      const key = `${mesh.material.uuid}|${mesh.castShadow ? 1 : 0}|${cell}`;
      let bucket = buckets.get(key);
      if (!bucket) {
        bucket = { material: mesh.material, cast: mesh.castShadow, parts: [] };
        buckets.set(key, bucket);
      }
      bucket.parts.push(bakeGeometry(mesh, toRoot));
    });
    const meshes: THREE.Mesh[] = [];
    buckets.forEach(({ material, cast, parts }) => {
      const geometry = parts.length === 1 ? parts[0]! : mergeGeometries(parts, false);
      if (parts.length > 1) parts.forEach((p) => p.dispose());
      if (!geometry) return;
      geometry.computeBoundingSphere();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = cast;
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      // Transparent pieces (fences, glass) draw after opaque ones.
      if (material.transparent) mesh.renderOrder = 1;
      meshes.push(mesh);
    });
    setMerged(meshes);
    return () => meshes.forEach((m) => m.geometry.dispose());
    // Re-merge only when the static content changes (house tier, theme).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);
  return (
    <>
      <group ref={source} visible={false}>{children}</group>
      {merged.map((m) => <primitive key={m.uuid} object={m} />)}
    </>
  );
}
