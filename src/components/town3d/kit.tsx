import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Box, Cyl, mat, Round } from "@/components/home3d/primitives";
import { labelTexture, stripeTexture, tiled, windowTexture } from "@/components/town3d/textures";
import { mixColor } from "@/components/town3d/palette";

export { Box, Cyl, Round, Ball, Cone, mat } from "@/components/home3d/primitives";
export type V3 = [number, number, number];
export type Side = "s" | "w" | "n" | "e";

/* ------------------------------------------------------------------ shared night materials */

/** Glass that glows warm after dark. One instance, so the hour changes it everywhere at once. */
export const litGlass = new THREE.MeshStandardMaterial({ color: "#a9c4da", roughness: 0.18, metalness: 0.08, emissive: new THREE.Color("#ffcf7d"), emissiveIntensity: 0, map: null });
/** Glass that stays dark at night (empty rooms), still reflective in daylight. */
export const darkGlass = new THREE.MeshStandardMaterial({ color: "#8fadc6", roughness: 0.16, metalness: 0.08 });
/** Lamp bulbs and neon: bright at night, pale by day. */
export const lampBulb = new THREE.MeshStandardMaterial({ color: "#f3efe2", roughness: 0.4, emissive: new THREE.Color("#ffe3a3"), emissiveIntensity: 0 });
export const neonRed = new THREE.MeshStandardMaterial({ color: "#d94a52", roughness: 0.4, emissive: new THREE.Color("#ff4f64"), emissiveIntensity: 0.25 });
export const neonGold = new THREE.MeshStandardMaterial({ color: "#e8c25a", roughness: 0.35, emissive: new THREE.Color("#ffd35c"), emissiveIntensity: 0.2 });

let glassTextureSet = false;
/** Called once on the client: gives glass a subtle sky gradient. */
export function prepareNightMaterials() {
  if (glassTextureSet || typeof document === "undefined") return;
  glassTextureSet = true;
  const t = windowTexture();
  litGlass.map = t;
  darkGlass.map = t;
  litGlass.needsUpdate = darkGlass.needsUpdate = true;
}

/** Building-specific glowing materials (tower glass, police lamp, clinic cross) follow the hour too. */
const nightRegistry = new Map<string, { m: THREE.MeshStandardMaterial; base: number; max: number }>();
export function nightGlow(key: string, make: () => THREE.MeshStandardMaterial, base: number, max: number): THREE.MeshStandardMaterial {
  let hit = nightRegistry.get(key);
  if (!hit) {
    hit = { m: make(), base, max };
    hit.m.emissiveIntensity = base;
    nightRegistry.set(key, hit);
  }
  return hit.m;
}

/** night: 0 = full day, 1 = full night. */
export function setNightLevel(night: number) {
  litGlass.emissiveIntensity = 1.35 * night;
  lampBulb.emissiveIntensity = 2.2 * night;
  neonRed.emissiveIntensity = 0.25 + 1.8 * night;
  neonGold.emissiveIntensity = 0.2 + 1.6 * night;
  nightRegistry.forEach(({ m, base, max }) => { m.emissiveIntensity = base + max * night; });
}

/** Deterministic per-window choice of which rooms are lit at night. */
export const litAt = (a: number, b: number) => (Math.sin(a * 12.9898 + b * 78.233) * 43758.5453) % 1 > -0.35;

/* ------------------------------------------------------------------ flat ground pieces */

const planeGeo = new THREE.PlaneGeometry(1, 1);
/** Horizontal rectangle on the ground from (x, z) with size w × d, `y` above ground. */
export function Flat({ x, z, w, d, y = 0, c = "#ffffff", map, per = 1, rough = 0.95, shadow = false, world = true }: {
  x: number; z: number; w: number; d: number; y?: number; c?: string; map?: THREE.Texture; per?: number; rough?: number; shadow?: boolean; world?: boolean;
}) {
  // World-aligned texture offsets let neighbouring pieces of paving meet seamlessly.
  const m = useMemo(() => mat(c, { rough, map: map ? tiled(map, w / per, d / per, world ? x / per : 0, world ? -(z + d) / per : 0) : null }), [c, rough, map, w, d, per, x, z, world]);
  return <mesh geometry={planeGeo} position={[x + w / 2, y, z + d / 2]} rotation={[-Math.PI / 2, 0, 0]} scale={[w, d, 1]} material={m} receiveShadow castShadow={shadow} />;
}

/** Flat ellipse/disc on the ground. */
const discGeo = new THREE.CircleGeometry(1, 40);
export function Disc({ x, z, rx, rz, y = 0.002, c, rough = 0.9, o }: { x: number; z: number; rx: number; rz: number; y?: number; c: string; rough?: number; o?: { metal?: number; opacity?: number } }) {
  return <mesh geometry={discGeo} position={[x, y, z]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx, rz, 1]} material={mat(c, { rough, ...(o ?? {}) })} receiveShadow />;
}

/* ------------------------------------------------------------------ facades */

/** Frame for one wall of a footprint: u runs left→right as seen from outside, v is height. */
export type Face = { origin: [number, number]; along: [number, number]; normal: [number, number]; len: number; rotY: number };
export function faceOf(x: number, z: number, w: number, d: number, side: Side): Face {
  switch (side) {
    case "s": return { origin: [x, z + d], along: [1, 0], normal: [0, 1], len: w, rotY: 0 };
    case "w": return { origin: [x, z], along: [0, 1], normal: [-1, 0], len: d, rotY: -Math.PI / 2 };
    case "n": return { origin: [x + w, z], along: [-1, 0], normal: [0, -1], len: w, rotY: Math.PI };
    case "e": return { origin: [x + w, z + d], along: [0, -1], normal: [1, 0], len: d, rotY: Math.PI / 2 };
  }
}
/** World position of a point on a face, `u` metres along, `v` up, `out` proud of the wall. */
export function onFace(f: Face, u: number, v: number, out = 0): V3 {
  return [f.origin[0] + f.along[0] * u + f.normal[0] * out, v, f.origin[1] + f.along[1] * u + f.normal[1] * out];
}

/** A framed window with sill; lit windows glow at night. */
export function Window({ f, u, v, w = 0.24, h = 0.3, lit = true, frame = "#f4efe4" }: { f: Face; u: number; v: number; w?: number; h?: number; lit?: boolean; frame?: string }) {
  const r: V3 = [0, f.rotY, 0];
  return (
    <>
      <Box s={[w + 0.05, h + 0.05, 0.03]} p={onFace(f, u, v, 0.012)} r={r} c={frame} o={{ rough: 0.6 }} shadow={false} />
      <Box s={[w, h, 0.02]} p={onFace(f, u, v, 0.03)} r={r} m={lit ? litGlass : darkGlass} shadow={false} />
      <Box s={[w * 0.06, h, 0.025]} p={onFace(f, u, v, 0.035)} r={r} c={frame} shadow={false} />
      <Box s={[w + 0.1, 0.03, 0.07]} p={onFace(f, u, v - h / 2 - 0.03, 0.035)} r={r} c={frame} o={{ rough: 0.7 }} />
    </>
  );
}

/** A row of windows per storey across a face, skipping the door bay. */
export function WindowGrid({ f, floors, storey = 0.55, base = 0.12, w = 0.24, h = 0.3, skip, skipAll = false, from = 0, margin = 0.25, frame, seed = 0, spacing = 0.55 }: {
  f: Face; floors: number; storey?: number; base?: number; w?: number; h?: number; skip?: [number, number] | undefined; skipAll?: boolean; from?: number; margin?: number; frame?: string; seed?: number; spacing?: number;
}) {
  const cols = Math.max(1, Math.floor((f.len - margin * 2) / spacing) + 1);
  const step = cols > 1 ? (f.len - margin * 2) / (cols - 1) : 0;
  const out: ReactNode[] = [];
  for (let k = from; k < floors; k++) {
    for (let i = 0; i < cols; i++) {
      const u = cols > 1 ? margin + i * step : f.len / 2;
      const v = base + k * storey + storey * 0.55;
      if ((k === 0 || skipAll) && skip && u > skip[0] && u < skip[1]) continue;
      out.push(<Window key={`${k}-${i}`} f={f} u={u} v={v} w={w} h={h} lit={litAt(seed + i, k)} {...(frame ? { frame } : {})} />);
    }
  }
  return <>{out}</>;
}

/** Front door with frame, step and optional glass. */
export function Door({ f, u, w = 0.3, h = 0.44, c = "#7a4b32", glass = false, frame = "#f4efe4", double = false }: { f: Face; u: number; w?: number; h?: number; c?: string; glass?: boolean; frame?: string; double?: boolean }) {
  const r: V3 = [0, f.rotY, 0];
  return (
    <>
      <Box s={[w + 0.07, h + 0.05, 0.035]} p={onFace(f, u, h / 2 + 0.02, 0.012)} r={r} c={frame} o={{ rough: 0.6 }} shadow={false} />
      {glass ? (
        <Box s={[w, h, 0.02]} p={onFace(f, u, h / 2 + 0.01, 0.03)} r={r} m={litGlass} shadow={false} />
      ) : (
        <Box s={[w, h, 0.02]} p={onFace(f, u, h / 2 + 0.01, 0.03)} r={r} c={c} o={{ rough: 0.5 }} shadow={false} />
      )}
      {double && <Box s={[0.015, h, 0.03]} p={onFace(f, u, h / 2 + 0.01, 0.04)} r={r} c={frame} shadow={false} />}
      <Cyl rad={0.012} h={0.012} p={onFace(f, u + w * 0.3, h * 0.5, 0.045)} r={[Math.PI / 2, 0, 0]} c="#d8b85a" o={{ metal: 0.6, rough: 0.3 }} shadow={false} />
      <Box s={[w + 0.16, 0.04, 0.16]} p={onFace(f, u, 0.02, 0.08)} r={r} c="#c9c3b6" o={{ rough: 0.9 }} />
    </>
  );
}

/** Striped canvas awning over a shopfront. */
export function Awning({ f, u, w, v, depth = 0.3, colour }: { f: Face; u: number; w: number; v: number; depth?: number; colour: string }) {
  const m = useMemo(() => mat("#ffffff", { rough: 0.85, map: tiled(stripeTexture(colour), Math.max(1, w / 0.5), 1) }), [colour, w]);
  const tilt = 0.42;
  const p = onFace(f, u, v - Math.sin(tilt) * depth * 0.5, depth * 0.5);
  return (
    <group position={p} rotation={[0, f.rotY, 0]}>
      <mesh geometry={boxGeoUnit} rotation={[tilt, 0, 0]} scale={[w, 0.025, depth]} material={m} castShadow receiveShadow />
      <mesh geometry={boxGeoUnit} position={[0, -Math.sin(tilt) * depth * 0.5 - 0.035, depth * 0.47]} scale={[w, 0.07, 0.015]} material={m} castShadow receiveShadow />
    </group>
  );
}
const boxGeoUnit = new THREE.BoxGeometry(1, 1, 1);

/** Painted sign board with text, mounted on a face. */
export function SignBoard({ f, u, v, w, h, text, bg, fg = "#fff8e6", out = 0.04, border = "#2b2a2e" }: { f: Face; u: number; v: number; w: number; h: number; text: string; bg: string; fg?: string; out?: number; border?: string }) {
  const m = useMemo(() => mat("#ffffff", { rough: 0.6, map: labelTexture(text, bg, fg, { w: 512, h: Math.max(64, Math.round(512 * (h / w))), border }) }), [text, bg, fg, w, h, border]);
  return (
    <>
      <Box s={[w + 0.04, h + 0.04, 0.03]} p={onFace(f, u, v, out - 0.01)} r={[0, f.rotY, 0]} c={border} shadow={false} />
      <mesh geometry={planeGeo} position={onFace(f, u, v, out + 0.007)} rotation={[0, f.rotY, 0]} scale={[w, h, 1]} material={m} />
    </>
  );
}

/** Free-standing sign facing the viewer (south), e.g. rooftop billboards and blade signs. */
export function Billboard({ p, w, h, text, bg, fg = "#fff8e6", rotY = 0, border = "#2b2a2e", posts = 0, emissive }: {
  p: V3; w: number; h: number; text: string; bg: string; fg?: string; rotY?: number; border?: string; posts?: number; emissive?: THREE.Material;
}) {
  const m = useMemo(() => emissive ?? mat("#ffffff", { rough: 0.6, map: labelTexture(text, bg, fg, { w: 512, h: Math.max(64, Math.round(512 * (h / w))), border }) }), [text, bg, fg, w, h, border, emissive]);
  return (
    <group position={p} rotation={[0, rotY, 0]}>
      <Box s={[w + 0.05, h + 0.05, 0.05]} p={[0, 0, -0.02]} c={border} />
      <mesh geometry={planeGeo} position={[0, 0, 0.008]} scale={[w, h, 1]} material={m} />
      {posts > 0 && [-w * 0.35, w * 0.35].map((x) => <Cyl key={x} rad={0.025} h={posts} p={[x, -h / 2 - posts / 2, -0.03]} c="#3d3f44" o={{ metal: 0.5, rough: 0.4 }} />)}
    </group>
  );
}

/* ------------------------------------------------------------------ roofs */

const gableCache = new Map<string, THREE.ExtrudeGeometry>();
function gableGeo(w: number, h: number, d: number) {
  const key = `${w}|${h}|${d}`;
  let g = gableCache.get(key);
  if (!g) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(0, h);
    s.closePath();
    g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false });
    g.translate(0, 0, -d / 2);
    gableCache.set(key, g);
  }
  return g;
}
/**
 * Pitched roof over a footprint. ridge "z" runs north–south (gables face south),
 * ridge "x" runs east–west. Wall-coloured gable infill plus tiled overhanging slopes.
 */
export function GableRoof({ x, z, w, d, y, rise, ridge = "x", wall, roof, map }: { x: number; z: number; w: number; d: number; y: number; rise: number; ridge?: "x" | "z"; wall: string; roof: string; map?: THREE.Texture }) {
  const span = ridge === "x" ? d : w;
  const length = ridge === "x" ? w : d;
  const slope = Math.hypot(span / 2, rise);
  const angle = Math.atan2(rise, span / 2);
  const over = 0.08;
  const roofMat = useMemo(() => mat(roof, { rough: 0.8, map: map ? tiled(map, (length + over * 2) / 0.35, (slope + over) / 0.35) : null }), [roof, map, length, slope]);
  const inner = gableGeo(span, rise, length);
  return (
    <group position={[x + w / 2, y, z + d / 2]} rotation={[0, ridge === "x" ? Math.PI / 2 : 0, 0]}>
      <mesh geometry={inner} material={mat(wall, { rough: 0.9 })} castShadow receiveShadow />
      {[-1, 1].map((sgn) => (
        <mesh key={sgn} geometry={boxGeoUnit} material={roofMat} castShadow receiveShadow
          position={[sgn * (span / 4 + 0.01), rise / 2 + 0.02, 0]}
          rotation={[0, 0, -sgn * angle]}
          scale={[slope + over, 0.045, length + over * 2]} />
      ))}
      <Box s={[0.07, 0.06, length + over * 2]} p={[0, rise + 0.03, 0]} c={roof} o={{ rough: 0.7 }} />
    </group>
  );
}

/** Flat roof with a low parapet, sitting on top of walls of height y. */
export function FlatRoof({ x, z, w, d, y, c, trim, map, parapet = 0.08 }: { x: number; z: number; w: number; d: number; y: number; c: string; trim: string; map?: THREE.Texture; parapet?: number }) {
  // Roofs fill much of the town camera's view, so they stay in the building's colour
  // but are lifted towards warm stone so they never read as flat dark slabs.
  const surface = mixColor(c, "#d8d2c4", 0.4);
  return (
    <>
      <Flat x={x} z={z} w={w} d={d} y={y + 0.003} c={surface} {...(map ? { map } : {})} per={0.8} />
      <Flat x={x + 0.08} z={z + 0.08} w={w - 0.16} d={d - 0.16} y={y + 0.005} c={mixColor(surface, "#000000", 0.06)} {...(map ? { map } : {})} per={0.8} />
      <Box s={[w + 0.04, parapet, 0.06]} p={[x + w / 2, y + parapet / 2, z + 0.01]} c={trim} o={{ rough: 0.8 }} />
      <Box s={[w + 0.04, parapet, 0.06]} p={[x + w / 2, y + parapet / 2, z + d - 0.01]} c={trim} o={{ rough: 0.8 }} />
      <Box s={[0.06, parapet, d]} p={[x + 0.01, y + parapet / 2, z + d / 2]} c={trim} o={{ rough: 0.8 }} />
      <Box s={[0.06, parapet, d]} p={[x + w - 0.01, y + parapet / 2, z + d / 2]} c={trim} o={{ rough: 0.8 }} />
    </>
  );
}

/** Rooftop air-conditioning unit. */
export function RoofUnit({ p, s = 0.22 }: { p: V3; s?: number }) {
  return (
    <>
      <Round s={[s, s * 0.6, s * 0.8]} p={[p[0], p[1] + s * 0.3, p[2]]} c="#b9bec2" rad={0.02} o={{ rough: 0.5, metal: 0.3 }} />
      <Cyl rad={s * 0.28} h={0.01} p={[p[0], p[1] + s * 0.61, p[2]]} c="#5b6166" />
    </>
  );
}

/** Walls block from ground to height h, optionally clad on the visible south and west faces. */
export function Walls({ x, z, w, d, h, c, map, per = 0.6, rough = 0.92, y0 = 0, metal = 0, face }: { x: number; z: number; w: number; d: number; h: number; c: string; map?: THREE.Texture; per?: number; rough?: number; y0?: number; metal?: number; face?: THREE.Material }) {
  const sMat = useMemo(() => face ?? mat(c, { rough, metal, map: map ? tiled(map, w / per, h / per) : null }), [c, rough, metal, map, w, h, per, face]);
  const wMat = useMemo(() => face ?? mat(c, { rough, metal, map: map ? tiled(map, d / per, h / per) : null }), [c, rough, metal, map, d, h, per, face]);
  const cy = y0 + h / 2;
  return (
    <>
      <Box s={[w, h, d]} p={[x + w / 2, cy, z + d / 2]} c={c} o={{ rough }} />
      {(map || face) && (
        <>
          <mesh geometry={planeGeo} position={[x + w / 2, cy, z + d + 0.004]} scale={[w, h, 1]} material={sMat} receiveShadow />
          <mesh geometry={planeGeo} position={[x - 0.004, cy, z + d / 2]} rotation={[0, -Math.PI / 2, 0]} scale={[d, h, 1]} material={wMat} receiveShadow />
        </>
      )}
    </>
  );
}

/** Horizontal band (string course / plinth) wrapping the visible faces. */
export function Band({ x, z, w, d, y, h, c, out = 0.02 }: { x: number; z: number; w: number; d: number; y: number; h: number; c: string; out?: number }) {
  return <Box s={[w + out * 2, h, d + out * 2]} p={[x + w / 2, y + h / 2, z + d / 2]} c={c} o={{ rough: 0.8 }} />;
}

/** Low picket fence along a line. */
export function Fence({ a, b, c = "#f4efe4", h = 0.16 }: { a: [number, number]; b: [number, number]; c?: string; h?: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const n = Math.max(2, Math.round(len / 0.09));
  const posts: ReactNode[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    posts.push(<Box key={i} s={[0.025, h, 0.02]} p={[a[0] + (b[0] - a[0]) * t, h / 2, a[1] + (b[1] - a[1]) * t]} r={[0, -ang, 0]} c={c} o={{ rough: 0.7 }} />);
  }
  return (
    <>
      {posts}
      <Box s={[len, 0.02, 0.015]} p={[(a[0] + b[0]) / 2, h * 0.7, (a[1] + b[1]) / 2]} r={[0, -ang, 0]} c={c} />
    </>
  );
}

/** Rounded hedge block. */
export function Hedge({ x, z, w, d, h = 0.18, c = "#4f8a3e" }: { x: number; z: number; w: number; d: number; h?: number; c?: string }) {
  return <Round s={[w, h, d]} p={[x + w / 2, h / 2, z + d / 2]} c={c} rad={Math.min(0.08, h / 2.2, w / 2.2, d / 2.2)} o={{ rough: 1 }} />;
}
