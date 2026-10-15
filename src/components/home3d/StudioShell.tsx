import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { OpeningLike } from "./types";
import { STUDIO, type WallSpec } from "@/lib/home3d/layout";
import { Ball, Box, Cone, Cyl, Group, Round, mat } from "./primitives";
import { carpetTexture, plankTexture } from "./textures";
import { Frame } from "./furniture";

const T_CAP = "#2c2d33";
const FRAME = "#f6f1e3";
const GLASS = { opacity: 0.22, rough: 0.05 };

/** One wall: solid boxes around every opening, plus frames, glass, sills, skirting and a dark cut edge. */
export function Wall({ spec, register }: { spec: WallSpec; register: (id: string, g: THREE.Group | null) => void }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    register(spec.id, ref.current);
    return () => register(spec.id, null);
  }, [spec.id, register]);
  const dx = spec.b[0] - spec.a[0];
  const dz = spec.b[1] - spec.a[1];
  const len = Math.hypot(dx, dz);
  const angle = Math.atan2(-dz, dx);
  const T = spec.thickness;
  const H = spec.height;
  const ops = [...spec.openings].sort((a, b) => a.u0 - b.u0);
  // Vertical slabs between openings.
  const slabs: { u0: number; u1: number }[] = [];
  let cursor = 0;
  for (const o of ops) {
    if (o.u0 > cursor) slabs.push({ u0: cursor, u1: o.u0 });
    cursor = o.u1;
  }
  if (cursor < len) slabs.push({ u0: cursor, u1: len });
  const colour = spec.colour;
  const piece = (key: string, u0: number, u1: number, v0: number, v1: number, base = false) => (
    <Group key={key}>
      <Box s={[u1 - u0, v1 - v0, T]} p={[(u0 + u1) / 2, (v0 + v1) / 2, 0]} c={colour} o={{ rough: 0.92 }} />
      {v1 >= H - 1e-6 && <Box s={[u1 - u0, 0.025, T + 0.002]} p={[(u0 + u1) / 2, H + 0.0125, 0]} c={T_CAP} shadow={false} />}
      {base && <Box s={[u1 - u0, 0.1, T + 0.035]} p={[(u0 + u1) / 2, 0.05, 0]} c={FRAME} shadow={false} />}
    </Group>
  );
  return (
    <group ref={ref} position={[spec.a[0], 0, spec.a[1]]} rotation={[0, angle, 0]}>
      {slabs.map((s, i) => piece(`s${i}`, s.u0, s.u1, 0, H, true))}
      {ops.map((o, i) => {
        const w = o.u1 - o.u0;
        const h = o.v1 - o.v0;
        const cx = (o.u0 + o.u1) / 2;
        const cy = (o.v0 + o.v1) / 2;
        return (
          <Group key={`o${i}`}>
            {o.v1 < H && piece(`top${i}`, o.u0, o.u1, o.v1, H)}
            {o.v0 > 0 && piece(`bot${i}`, o.u0, o.u1, 0, o.v0, true)}
            {o.kind === "window" && <WindowDetail w={w} h={h} cx={cx} cy={cy} T={T} />}
            {o.kind === "door" && <DoorDetail w={w} h={h} cx={cx} T={T} />}
          </Group>
        );
      })}
    </group>
  );
}

function WindowDetail({ w, h, cx, cy, T }: OpeningLike & { cy: number }) {
  const f = 0.06;
  return (
    <Group p={[cx, cy, 0]}>
      <Box s={[w + 0.08, f, T + 0.06]} p={[0, h / 2 + f / 2 - 0.02, 0]} c={FRAME} shadow={false} />
      <Box s={[w + 0.08, f, T + 0.06]} p={[0, -h / 2 - f / 2 + 0.02, 0]} c={FRAME} shadow={false} />
      <Box s={[f, h, T + 0.06]} p={[-w / 2 - f / 2 + 0.02, 0, 0]} c={FRAME} shadow={false} />
      <Box s={[f, h, T + 0.06]} p={[w / 2 + f / 2 - 0.02, 0, 0]} c={FRAME} shadow={false} />
      <Box s={[0.04, h, 0.04]} p={[0, 0, 0]} c={FRAME} shadow={false} />
      <Box s={[w, 0.04, 0.04]} p={[0, 0.05, 0]} c={FRAME} shadow={false} />
      <Box s={[w - 0.02, h - 0.02, 0.01]} c="#bfe4ee" o={GLASS} shadow={false} />
      <Box s={[w + 0.22, 0.045, 0.22]} p={[0, -h / 2 - 0.05, T / 2 + 0.06]} c={FRAME} />
    </Group>
  );
}

function DoorDetail({ w, h, cx, T }: OpeningLike) {
  return (
    <Group p={[cx, 0, 0]}>
      <Box s={[0.06, h, T + 0.05]} p={[-w / 2 - 0.02, h / 2, 0]} c={FRAME} shadow={false} />
      <Box s={[0.06, h, T + 0.05]} p={[w / 2 + 0.02, h / 2, 0]} c={FRAME} shadow={false} />
      <Box s={[w + 0.1, 0.06, T + 0.05]} p={[0, h + 0.01, 0]} c={FRAME} shadow={false} />
      {/* leaf swung ajar */}
      <Group p={[-w / 2 + 0.02, 0, 0.04]} r={[0, 0.55, 0]}>
        <Box s={[w - 0.06, h - 0.04, 0.045]} p={[(w - 0.06) / 2, h / 2, 0]} c="#2f6a64" />
        <Box s={[w - 0.3, 0.9, 0.012]} p={[(w - 0.06) / 2, h * 0.64, 0.025]} c="#3a7f78" shadow={false} />
        <Cyl rad={0.02} h={0.06} p={[w - 0.2, h * 0.48, 0.04]} r={[Math.PI / 2, 0, 0]} c="#c9a24a" o={{ rough: 0.3, metal: 0.85 }} />
      </Group>
    </Group>
  );
}

/** Floors: laminate planks and a different, softer carpet in the sleeping space. */
export function Floors() {
  const plank = useMemo(() => plankTexture([4.2 / 1.0, 4.8 / 1.0]), []);
  const carpet = useMemo(() => carpetTexture([3.4 * 1.3, 4.8 * 1.3]), []);
  return (
    <Group>
      {STUDIO.floors.map((f) => {
        const w = f.rect.x1 - f.rect.x0;
        const d = f.rect.z1 - f.rect.z0;
        const tex = f.kind === "laminate" ? plank : carpet;
        return (
          <mesh key={f.zone} position={[(f.rect.x0 + f.rect.x1) / 2, 0.015, (f.rect.z0 + f.rect.z1) / 2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow material={mat("#ffffff", { rough: f.kind === "laminate" ? 0.55 : 0.98, map: tex })}>
            <planeGeometry args={[w, d]} />
          </mesh>
        );
      })}
      {/* threshold strip between the two floors */}
      <Box s={[0.08, 0.02, 4.8]} p={[4.2, 0.02, 2.4]} c="#c9a24a" o={{ rough: 0.4, metal: 0.6 }} shadow={false} />
    </Group>
  );
}

/** A thick slab under the flat makes it read as a dollhouse cross-section. */
export function Plinth() {
  const { w, d } = STUDIO.size;
  return (
    <Group>
      <Box s={[w + 0.5, 0.35, d + 0.5]} p={[w / 2, -0.22, d / 2]} c="#3b414d" o={{ rough: 0.9 }} />
      <Box s={[w + 0.5, 0.04, d + 0.5]} p={[w / 2, -0.04, d / 2]} c="#59606e" o={{ rough: 0.8 }} shadow={false} />
    </Group>
  );
}

/** Built-in features and everyday clutter. None of this is a purchasable item. */
export function Decor() {
  return (
    <Group>
      {/* living-room rug */}
      <Box s={[2.3, 0.012, 2.1]} p={[2.1, 0.026, 2.55]} c="#e9dfc9" o={{ rough: 1 }} shadow={false} />
      <Box s={[2.1, 0.014, 1.9]} p={[2.1, 0.028, 2.55]} c="#2f7f79" o={{ rough: 1 }} shadow={false} />
      <Box s={[1.7, 0.016, 1.5]} p={[2.1, 0.03, 2.55]} c="#d9695a" o={{ rough: 1 }} shadow={false} />
      <Box s={[1.4, 0.018, 1.2]} p={[2.1, 0.032, 2.55]} c="#efe6d2" o={{ rough: 1 }} shadow={false} />

      {/* radiator under the left window */}
      <Group p={[0.12, 0.35, 1.45]} r={[0, Math.PI / 2, 0]}>
        {Array.from({ length: 9 }, (_, i) => (
          <Box key={i} s={[0.07, 0.5, 0.06]} p={[-0.45 + i * 0.113, 0, 0]} c="#f4f1ea" shadow={false} />
        ))}
        <Box s={[1.05, 0.04, 0.06]} p={[0, 0.27, 0]} c="#f4f1ea" shadow={false} />
        <Box s={[1.05, 0.04, 0.06]} p={[0, -0.24, 0]} c="#f4f1ea" shadow={false} />
      </Group>

      {/* curtains at the big living window */}
      <Group p={[3.47, 0, 0.14]}>
        <Cyl rad={0.014} h={1.5} p={[0, 2.12, 0]} r={[0, 0, Math.PI / 2]} c="#2a2a2c" />
        <Round s={[0.32, 1.35, 0.06]} p={[-0.62, 1.4, 0]} c="#d9695a" rad={0.02} />
        <Round s={[0.32, 1.35, 0.06]} p={[0.62, 1.4, 0]} c="#d9695a" rad={0.02} />
        {[-0.7, -0.62, -0.54, 0.54, 0.62, 0.7].map((x) => (
          <Box key={x} s={[0.012, 1.34, 0.075]} p={[x, 1.4, 0]} c="#b95a49" shadow={false} />
        ))}
      </Group>
      {/* roller blind at the bedroom window */}
      <Group p={[6.75, 0, 0.12]}>
        <Box s={[0.96, 0.4, 0.03]} p={[0, 1.8, 0]} c="#e9dfc9" />
        <Cyl rad={0.02} h={0.98} p={[0, 2.01, 0]} r={[0, 0, Math.PI / 2]} c="#cfc6b0" />
      </Group>

      {/* standing lamp by the sofa */}
      <Group p={[3.75, 0, 1.55]}>
        <Cyl rad={0.14} h={0.03} p={[0, 0.015, 0]} c="#2a2a2c" />
        <Cyl rad={0.012} h={1.4} p={[0, 0.72, 0]} c="#2a2a2c" />
        <Cone rad={0.19} h={0.3} p={[0, 1.5, 0]} r={[Math.PI, 0, 0]} c="#f1dfb0" o={{ emissive: "#ffd98a", glow: 0.9, rough: 0.9 }} />
      </Group>

      {/* plants */}
      <Plant p={[3.85, 0, 0.45]} big />
      <Plant p={[7.25, 0, 4.4]} />
      <Plant p={[0.3, 0, 0.3]} small />

      {/* cardboard boxes, shoes, post and laundry */}
      <Group p={[3.78, 0, 0.95]}>
        <Box s={[0.5, 0.32, 0.4]} p={[0, 0.16, 0]} c="#b58a5a" />
        <Box s={[0.5, 0.012, 0.08]} p={[0, 0.326, 0]} c="#9b7449" shadow={false} />
        <Box s={[0.38, 0.26, 0.32]} p={[0.04, 0.45, 0.02]} r={[0, 0.4, 0]} c="#c29866" />
      </Group>
      <Group p={[1.95, 0, 4.5]}>
        <Round s={[0.12, 0.09, 0.28]} p={[-0.07, 0.045, 0]} r={[0, 0.3, 0]} c="#2f6a64" rad={0.03} />
        <Round s={[0.12, 0.09, 0.28]} p={[0.08, 0.045, 0.04]} r={[0, -0.2, 0]} c="#2f6a64" rad={0.03} />
      </Group>
      <Group p={[0.75, 0.02, 4.4]} r={[0, 0.5, 0]}>
        <Box s={[0.22, 0.02, 0.3]} c="#f4f1ea" shadow={false} />
        <Box s={[0.22, 0.02, 0.3]} p={[0.02, 0.025, 0.02]} r={[0, 0.3, 0]} c="#e9d6a8" shadow={false} />
      </Group>
      <Group p={[4.62, 0, 4.4]}>
        <Cyl rad={0.22} h={0.5} p={[0, 0.25, 0]} c="#cfc6b0" />
        <Cyl rad={0.205} h={0.04} p={[0, 0.5, 0]} c="#2f7f79" />
        <Round s={[0.3, 0.1, 0.2]} p={[0.04, 0.56, 0]} r={[0.2, 0.4, 0.3]} c="#d9695a" rad={0.04} />
      </Group>

      {/* built-in wardrobe on the partition */}
      <Group p={[4.58, 0, 1.3]}>
        <Box s={[0.6, 2.15, 2.0]} p={[0, 1.075, 0]} c="#e4dcc8" />
        {[-0.5, 0.5].map((z) => (
          <Box key={z} s={[0.012, 2.0, 0.96]} p={[0.306, 1.07, z]} c="#d3c9b0" shadow={false} />
        ))}
        {[-0.07, 0.07].map((z) => (
          <Box key={z} s={[0.03, 0.22, 0.02]} p={[0.325, 1.05, z]} c="#8a7a60" shadow={false} />
        ))}
        <Box s={[0.64, 0.05, 2.04]} p={[0, 2.17, 0]} c="#cfc6b0" shadow={false} />
      </Group>

      {/* wall art and a bed reading light */}
      <Group p={[4.13, 1.55, 3.0]} r={[0, -Math.PI / 2, 0]}>
        <Frame w={0.5} h={0.62} art={1} />
      </Group>
      <Group p={[6.0, 1.7, 0.095]}>
        <Frame w={0.8} h={0.5} art={2} />
      </Group>
      <Group p={[6.0, 1.28, 0.2]}>
        <Box s={[0.3, 0.03, 0.14]} p={[0, 0, -0.02]} c="#2a2a2c" />
        <Cone rad={0.11} h={0.12} p={[0, -0.06, 0.1]} r={[Math.PI - 0.5, 0, 0]} c="#2a2a2c" o={{ emissive: "#ffd98a", glow: 0.9 }} />
      </Group>
      <Group p={[0.095, 1.65, 3.6]} r={[0, Math.PI / 2, 0]}>
        <Frame w={0.6} h={0.45} art={0} />
      </Group>
      {/* wall clock over the kitchen */}
      <Group p={[2.2, 2.2, 0.1]}>
        <Cyl rad={0.14} h={0.03} r={[Math.PI / 2, 0, 0]} c="#f4f1ea" />
        <Box s={[0.012, 0.09, 0.012]} p={[0, 0.04, 0.02]} c="#222" shadow={false} />
        <Box s={[0.08, 0.012, 0.012]} p={[0.03, 0, 0.02]} c="#222" shadow={false} />
      </Group>
    </Group>
  );
}

function Plant({ p, big = false, small = false }: { p: [number, number, number]; big?: boolean; small?: boolean }) {
  const s = big ? 1.25 : small ? 0.7 : 1;
  const leaves: [number, number, number][] = [[0, 0.62, 0], [0.14, 0.52, 0.06], [-0.13, 0.48, -0.05], [0.04, 0.78, -0.08], [-0.06, 0.7, 0.12]];
  return (
    <Group p={p}>
      <Cyl rad={0.13 * s} h={0.26 * s} p={[0, 0.13 * s, 0]} c="#c9874f" />
      <Cyl rad={0.115 * s} h={0.02} p={[0, 0.265 * s, 0]} c="#3d2c20" shadow={false} />
      {leaves.map(([x, y, z], i) => (
        <Ball key={i} rad={0.13 * s} p={[x * s, y * s + 0.1, z * s]} sc={[0.13 * s, 0.17 * s, 0.1 * s]} c={i % 2 ? "#3f8a4a" : "#4aa05a"} />
      ))}
    </Group>
  );
}

export { mat };
