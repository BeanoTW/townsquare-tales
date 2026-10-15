import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { BufferAttribute, BufferGeometry, DoubleSide, type OrthographicCamera } from "three";
import { bucketFaces, outlineSegments, townFaces, type Face } from "@/components/town3d/town-scene";

/**
 * Three.js world drawn behind the SVG overlay. Coordinates are already screen
 * units (see town-scene.ts), so an orthographic camera reproduces the portrait
 * follow camera exactly: the SVG slices a 330x550 view and so does this camera.
 * `ox`/`oy` are the same translate the SVG layer uses for the player.
 */
export type TownWorld3DProps = { ox: number; oy: number; house: number; night: boolean };

const VIEW = { width: 330, height: 550 } as const;
const FALLBACK = "#808080";

/** Canvas 2D converts any CSS colour, including oklch, to sRGB we can hand to three.js. */
export function resolveTownColor(ref: string): string {
  try {
    const name = /^var\((--[\w-]+)\)$/.exec(ref)?.[1];
    const raw = name ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : ref;
    if (!raw || !CSS.supports("color", raw)) return FALLBACK;
    const ctx = document.createElement("canvas").getContext("2d");
    if (!ctx) return FALLBACK;
    ctx.fillStyle = raw;
    ctx.fillRect(0, 0, 1, 1);
    const [r = 128, g = 128, b = 128] = ctx.getImageData(0, 0, 1, 1).data;
    return `rgb(${r},${g},${b})`;
  } catch {
    return FALLBACK;
  }
}

function FollowCamera({ ox, oy }: { ox: number; oy: number }) {
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const camera = useThree((s) => s.camera) as OrthographicCamera;
  const invalidate = useThree((s) => s.invalidate);
  useLayoutEffect(() => {
    // SVG preserveAspectRatio="xMidYMid slice": cover the viewport, centred on the view.
    camera.zoom = Math.max(width / VIEW.width, height / VIEW.height);
    // Content point p is drawn at viewBox p + offset, so the view centre is p = 165 - ox, 275 - oy.
    // Three.js is y-up while SVG y is down.
    camera.position.set(VIEW.width / 2 - ox, oy - VIEW.height / 2, 2000);
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    invalidate();
  }, [camera, invalidate, width, height, ox, oy]);
  return null;
}

function World({ house, night }: { house: number; night: boolean }) {
  const { world, objects } = useMemo(() => townFaces(house, night), [house, night]);
  const [palette, setPalette] = useState<Record<string, string>>({});
  useEffect(() => {
    const refs = new Set<string>();
    for (const f of [...world, ...objects]) refs.add(f.color);
    refs.add("var(--town-ink)");
    const next: Record<string, string> = {};
    refs.forEach((r) => { next[r] = resolveTownColor(r); });
    setPalette(next);
  }, [world, objects]);
  const meshes = useMemo(() => {
    const all: Face[] = [...world, ...objects];
    return bucketFaces(all).map((bucket) => {
      const geometry = new BufferGeometry();
      geometry.setAttribute("position", new BufferAttribute(bucket.positions, 3));
      return { key: bucket.key, color: palette[bucket.color] ?? FALLBACK, overlay: bucket.overlay, geometry };
    });
  }, [world, objects, palette]);
  const outlines = useMemo(() => {
    const seg = outlineSegments(objects);
    const geometry = new BufferGeometry();
    geometry.setAttribute("position", new BufferAttribute(seg.positions, 3));
    return { geometry, color: palette["var(--town-ink)"] ?? "#1d1b16" };
  }, [objects, palette]);
  useEffect(() => () => {
    meshes.forEach((m) => m.geometry.dispose());
    outlines.geometry.dispose();
  }, [meshes, outlines]);
  return (
    <group>
      {meshes.map((m) => (
        <mesh key={m.key} geometry={m.geometry} renderOrder={m.overlay ? 2 : 0}>
          <meshBasicMaterial color={m.color} side={DoubleSide} depthTest={!m.overlay} />
        </mesh>
      ))}
      <lineSegments geometry={outlines.geometry}>
        <lineBasicMaterial color={outlines.color} />
      </lineSegments>
    </group>
  );
}

export default function TownWorld3D({ ox, oy, house, night }: TownWorld3DProps) {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-town-world-3d>
      <Canvas
        orthographic
        frameloop="demand"
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        camera={{ position: [0, 0, 2000], near: 0.1, far: 5000, zoom: 1 }}
      >
        <FollowCamera ox={ox} oy={oy} />
        <World house={house} night={night} />
      </Canvas>
    </div>
  );
}
