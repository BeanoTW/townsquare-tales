import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import type { HomePlan, WallSpec } from "@/lib/home3d/layout";
import type { OpeningLike } from "./types";
import { Box, Cyl, Group, mat } from "./primitives";
import { cardboardTexture, corrugatedTexture, floorTexture } from "./textures";

/** Shared architecture: walls, floors and the base slab. Every property tier is drawn from these. */
const T_CAP = "#2c2d33";
const FRAME = "#f6f1e3";
const GLASS = { opacity: 0.22, rough: 0.05 };
const GOLD = { rough: 0.3, metal: 0.85 };

const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
};
const hash = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

type Register = (id: string, g: THREE.Group | null) => void;

/** One wall. Plain and panelled walls are solid boxes around every opening; scrap walls are patched together. */
export function Wall({ spec, register }: { spec: WallSpec; register: Register }) {
  const ref = useRef<THREE.Group>(null);
  useEffect(() => {
    register(spec.id, ref.current);
    return () => register(spec.id, null);
  }, [spec.id, register]);
  const dx = spec.b[0] - spec.a[0];
  const dz = spec.b[1] - spec.a[1];
  const angle = Math.atan2(-dz, dx);
  return (
    <group ref={ref} position={[spec.a[0], 0, spec.a[1]]} rotation={[0, angle, 0]}>
      {spec.style === "scrap" ? <ScrapBody spec={spec} /> : <SolidBody spec={spec} />}
    </group>
  );
}

function SolidBody({ spec }: { spec: WallSpec }) {
  const len = Math.hypot(spec.b[0] - spec.a[0], spec.b[1] - spec.a[1]);
  const T = spec.thickness;
  const H = spec.height;
  const panel = spec.style === "panel";
  const trim = spec.trim ?? FRAME;
  const ops = [...spec.openings].sort((a, b) => a.u0 - b.u0);
  const slabs: { u0: number; u1: number }[] = [];
  let cursor = 0;
  for (const o of ops) {
    if (o.u0 > cursor) slabs.push({ u0: cursor, u1: o.u0 });
    cursor = o.u1;
  }
  if (cursor < len) slabs.push({ u0: cursor, u1: len });
  const colour = spec.colour;
  const baseH = panel ? 0.2 : 0.1;
  const piece = (key: string, u0: number, u1: number, v0: number, v1: number, base = false) => (
    <Group key={key}>
      <Box s={[u1 - u0, v1 - v0, T]} p={[(u0 + u1) / 2, (v0 + v1) / 2, 0]} c={colour} o={{ rough: panel ? 0.7 : 0.92 }} />
      {v1 >= H - 1e-6 && <Box s={[u1 - u0, 0.025, T + 0.002]} p={[(u0 + u1) / 2, H + 0.0125, 0]} c={T_CAP} shadow={false} />}
      {base && <Box s={[u1 - u0, baseH, T + 0.035]} p={[(u0 + u1) / 2, baseH / 2, 0]} c={trim} shadow={false} />}
      {panel && base && v1 - v0 > 1.1 && <PanelDado u0={u0} u1={u1} T={T} colour={colour} trim={trim} />}
      {panel && v1 >= H - 1e-6 && <Box s={[u1 - u0, 0.12, T + 0.07]} p={[(u0 + u1) / 2, H - 0.06, 0]} c={trim} shadow={false} />}
    </Group>
  );
  return (
    <>
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
            {o.kind === "window" && <WindowDetail w={w} h={h} cx={cx} cy={cy} T={T} frame={trim} panel={panel} />}
            {o.kind === "door" && <DoorDetail w={w} h={h} cx={cx} T={T} frame={trim} leaf={spec.leaf ?? "#2f6a64"} />}
            {o.kind === "doorway" && <DoorwayDetail w={w} h={h} cx={cx} T={T} frame={trim} />}
          </Group>
        );
      })}
    </>
  );
}

/** Raised panelling on the lower half of a luxury wall. */
function PanelDado({ u0, u1, T, colour, trim }: { u0: number; u1: number; T: number; colour: string; trim: string }) {
  const c = new THREE.Color(colour).multiplyScalar(0.93);
  const col = `#${c.getHexString()}`;
  const n = Math.max(1, Math.floor((u1 - u0) / 0.9));
  const step = (u1 - u0) / n;
  return (
    <Group>
      <Box s={[u1 - u0, 0.07, T + 0.04]} p={[(u0 + u1) / 2, 1.0, 0]} c={trim} shadow={false} />
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} s={[step - 0.2, 0.62, T + 0.02]} p={[u0 + step * (i + 0.5), 0.6, 0]} c={col} o={{ rough: 0.6 }} shadow={false} />
      ))}
    </Group>
  );
}

type Opening3 = OpeningLike & { frame: string };
function WindowDetail({ w, h, cx, cy, T, frame, panel }: Opening3 & { cy: number; panel: boolean }) {
  const f = panel ? 0.09 : 0.06;
  return (
    <Group p={[cx, cy, 0]}>
      <Box s={[w + 0.08, f, T + 0.06]} p={[0, h / 2 + f / 2 - 0.02, 0]} c={frame} shadow={false} />
      <Box s={[w + 0.08, f, T + 0.06]} p={[0, -h / 2 - f / 2 + 0.02, 0]} c={frame} shadow={false} />
      <Box s={[f, h, T + 0.06]} p={[-w / 2 - f / 2 + 0.02, 0, 0]} c={frame} shadow={false} />
      <Box s={[f, h, T + 0.06]} p={[w / 2 + f / 2 - 0.02, 0, 0]} c={frame} shadow={false} />
      {panel ? (
        <>
          {[-w / 6, w / 6].map((x) => (
            <Box key={x} s={[0.04, h, 0.04]} p={[x, 0, 0]} c={frame} shadow={false} />
          ))}
          <Box s={[w, 0.05, 0.05]} p={[0, h * 0.22, 0]} c={frame} shadow={false} />
        </>
      ) : (
        <>
          <Box s={[0.04, h, 0.04]} p={[0, 0, 0]} c={frame} shadow={false} />
          <Box s={[w, 0.04, 0.04]} p={[0, 0.05, 0]} c={frame} shadow={false} />
        </>
      )}
      <Box s={[w - 0.02, h - 0.02, 0.01]} c="#bfe4ee" o={GLASS} shadow={false} />
      <Box s={[w + 0.22, 0.045, 0.22]} p={[0, -h / 2 - 0.05, T / 2 + 0.06]} c={frame} />
    </Group>
  );
}

function DoorDetail({ w, h, cx, T, frame, leaf }: Opening3 & { leaf: string }) {
  const double = w > 1.5;
  const leafW = double ? (w - 0.08) / 2 : w - 0.06;
  return (
    <Group p={[cx, 0, 0]}>
      <Box s={[0.06, h, T + 0.05]} p={[-w / 2 - 0.02, h / 2, 0]} c={frame} shadow={false} />
      <Box s={[0.06, h, T + 0.05]} p={[w / 2 + 0.02, h / 2, 0]} c={frame} shadow={false} />
      <Box s={[w + 0.1, 0.06, T + 0.05]} p={[0, h + 0.01, 0]} c={frame} shadow={false} />
      {double ? (
        <>
          {/* grand double doors, one leaf ajar */}
          <Group p={[-w / 2 + 0.03, 0, 0.04]} r={[0, 0.5, 0]}>
            <DoorLeaf w={leafW} h={h} leaf={leaf} gold />
          </Group>
          <Group p={[w / 2 - 0.03, 0, 0.0]} r={[0, 0, 0]}>
            <Box s={[leafW, h - 0.04, 0.05]} p={[-leafW / 2, h / 2, 0]} c={leaf} o={{ rough: 0.4 }} />
            <Box s={[leafW - 0.3, h * 0.7, 0.012]} p={[-leafW / 2, h * 0.5, 0.03]} c="#35353b" shadow={false} />
            <Cyl rad={0.025} h={0.3} p={[-0.1, h * 0.48, 0.07]} c="#e0b95a" o={GOLD} />
          </Group>
        </>
      ) : (
        <Group p={[-w / 2 + 0.02, 0, 0.04]} r={[0, 0.55, 0]}>
          <DoorLeaf w={leafW} h={h} leaf={leaf} />
        </Group>
      )}
    </Group>
  );
}
function DoorLeaf({ w, h, leaf, gold = false }: { w: number; h: number; leaf: string; gold?: boolean }) {
  return (
    <Group>
      <Box s={[w, h - 0.04, 0.045]} p={[w / 2, h / 2, 0]} c={leaf} {...(gold ? { o: { rough: 0.4 } } : {})} />
      <Box s={[w - 0.3, gold ? h * 0.7 : 0.9, 0.012]} p={[w / 2, gold ? h * 0.5 : h * 0.64, 0.025]} c={gold ? "#35353b" : "#3a7f78"} shadow={false} />
      <Cyl rad={0.02} h={0.06} p={[w - 0.2, h * 0.48, 0.04]} r={[Math.PI / 2, 0, 0]} c="#c9a24a" o={GOLD} />
    </Group>
  );
}

/** A doorway with a plain architrave and no door leaf. */
function DoorwayDetail({ w, h, cx, T, frame }: Opening3) {
  return (
    <Group p={[cx, 0, 0]}>
      <Box s={[0.07, h, T + 0.05]} p={[-w / 2 - 0.02, h / 2, 0]} c={frame} shadow={false} />
      <Box s={[0.07, h, T + 0.05]} p={[w / 2 + 0.02, h / 2, 0]} c={frame} shadow={false} />
      <Box s={[w + 0.14, 0.07, T + 0.05]} p={[0, h + 0.01, 0]} c={frame} shadow={false} />
    </Group>
  );
}

/* ------------------------------------------------------------- scavenged walls */
/** Walls of a squat: patched strips of cardboard, corrugated iron, ply and pallets, taped and propped. */
function ScrapBody({ spec }: { spec: WallSpec }) {
  const len = Math.hypot(spec.b[0] - spec.a[0], spec.b[1] - spec.a[1]);
  const H = spec.height;
  const parts = useMemo(() => {
    const r = rnd(hash(spec.id));
    const mats = [
      mat("#ffffff", { rough: 1, map: cardboardTexture(1) }),
      mat("#ffffff", { rough: 1, map: cardboardTexture(2) }),
      mat("#ffffff", { rough: 1, map: cardboardTexture(3) }),
      mat("#ffffff", { rough: 0.5, metal: 0.5, map: corrugatedTexture() }),
      mat("#b69167", { rough: 0.95 }),
      mat("#6f5a43", { rough: 1 }),
      mat("#3f6d8c", { rough: 0.6 }),
    ];
    const out: { u0: number; u1: number; v0: number; v1: number; m: THREE.Material; tilt: number; off: number; slats: boolean }[] = [];
    const strip = (u0: number, u1: number, v0: number, v1: number) => {
      let u = u0;
      while (u < u1 - 0.05) {
        const w = Math.min(u1 - u, 0.5 + r() * 0.6);
        const top = v1 >= H - 1e-6 ? v1 - r() * 0.28 : v1;
        const pick = r();
        out.push({ u0: u, u1: u + w, v0, v1: top, m: mats[Math.floor(pick * mats.length)]!, tilt: (r() - 0.5) * 0.05, off: (r() - 0.5) * 0.07, slats: pick > 0.62 && pick < 0.73 });
        u += w - 0.03;
      }
    };
    let cur = 0;
    const ops = [...spec.openings].sort((a, b) => a.u0 - b.u0);
    for (const o of ops) {
      strip(cur, o.u0, 0, H);
      if (o.v0 > 0) strip(o.u0, o.u1, 0, o.v0);
      if (o.v1 < H) strip(o.u0, o.u1, o.v1, H);
      cur = o.u1;
    }
    strip(cur, len, 0, H);
    return out;
  }, [spec.id, spec.openings, len, H]);
  const posts = useMemo(() => {
    const r = rnd(hash(spec.id) + 5);
    const xs = [0.08, len - 0.08];
    for (let u = 1.1 + r() * 0.5; u < len - 0.6; u += 1.2 + r() * 0.8) if (!spec.openings.some((o) => u > o.u0 - 0.15 && u < o.u1 + 0.15)) xs.push(u);
    return xs;
  }, [spec.id, spec.openings, len]);
  const T = spec.thickness;
  return (
    <>
      {parts.map((p, i) => {
        const SL = Math.max(3, Math.round((p.v1 - p.v0) / 0.2));
        return p.slats ? (
          <Group key={i} p={[(p.u0 + p.u1) / 2, 0, p.off]} r={[0, 0, p.tilt]}>
            {Array.from({ length: SL }, (_, k) => (
              <Box key={k} s={[p.u1 - p.u0, (p.v1 - p.v0) / SL - 0.03, T * 0.8]} p={[0, p.v0 + ((k + 0.5) * (p.v1 - p.v0)) / SL, 0]} c="#8a6a45" o={{ rough: 1 }} />
            ))}
          </Group>
        ) : (
          <Box key={i} s={[p.u1 - p.u0, p.v1 - p.v0, T * 0.75]} p={[(p.u0 + p.u1) / 2, (p.v0 + p.v1) / 2, p.off]} r={[0, 0, p.tilt]} m={p.m} />
        );
      })}
      {posts.map((u, i) => (
        <Box key={`p${i}`} s={[0.07, H * 0.96, 0.09]} p={[u, (H * 0.96) / 2, (i % 2 ? 1 : -1) * 0.05]} r={[0, 0, (i % 3 - 1) * 0.012]} c="#5b4630" o={{ rough: 1 }} />
      ))}
      {/* duct tape and a bin-bag patch */}
      {posts.slice(1, 4).map((u, i) => (
        <Box key={`t${i}`} s={[0.5, 0.06, 0.012]} p={[u + 0.2, 0.7 + i * 0.45, 0.06]} r={[0, 0, 0.2 - i * 0.2]} c="#a7a79d" o={{ rough: 0.5 }} shadow={false} />
      ))}
      {spec.openings.map((o, i) =>
        o.kind === "window" ? (
          <Group key={`w${i}`} p={[(o.u0 + o.u1) / 2, (o.v0 + o.v1) / 2, 0]}>
            {/* nailed timber frame, taped plastic where the glass was */}
            <Box s={[o.u1 - o.u0 + 0.12, 0.07, 0.12]} p={[0, (o.v1 - o.v0) / 2, 0]} c="#6b5438" o={{ rough: 1 }} />
            <Box s={[o.u1 - o.u0 + 0.12, 0.07, 0.12]} p={[0, -(o.v1 - o.v0) / 2, 0]} c="#6b5438" o={{ rough: 1 }} />
            <Box s={[0.07, o.v1 - o.v0, 0.12]} p={[-(o.u1 - o.u0) / 2, 0, 0]} c="#6b5438" o={{ rough: 1 }} />
            <Box s={[0.07, o.v1 - o.v0, 0.12]} p={[(o.u1 - o.u0) / 2, 0, 0]} c="#6b5438" o={{ rough: 1 }} />
            <Box s={[o.u1 - o.u0, o.v1 - o.v0, 0.01]} c="#cfe0e0" o={{ opacity: 0.28, rough: 0.2 }} shadow={false} />
            <Box s={[0.9 * (o.u1 - o.u0), 0.04, 0.02]} r={[0, 0, 0.6]} c="#a7a79d" shadow={false} />
          </Group>
        ) : (
          <Group key={`d${i}`} p={[(o.u0 + o.u1) / 2, o.v1, 0]}>
            {/* doorway: a dangling tarp flap and a wonky lintel */}
            <Box s={[o.u1 - o.u0 + 0.2, 0.09, 0.12]} r={[0, 0, 0.03]} c="#5b4630" o={{ rough: 1 }} />
            <Box s={[(o.u1 - o.u0) * 0.55, o.v1 * 0.55, 0.02]} p={[(o.u1 - o.u0) * 0.2, -o.v1 * 0.28, 0.05]} r={[0.08, 0, -0.04]} c="#3f6d8c" o={{ rough: 0.6 }} />
            <Box s={[(o.u1 - o.u0) * 0.4, o.v1 * 0.4, 0.02]} p={[-(o.u1 - o.u0) * 0.22, -o.v1 * 0.2, 0.04]} r={[0.06, 0, 0.05]} c="#6a8c9d" o={{ rough: 0.6 }} />
          </Group>
        ),
      )}
    </>
  );
}

/* --------------------------------------------------------------------- floors */
export function Floors({ plan }: { plan: HomePlan }) {
  return (
    <Group>
      {plan.floors.map((f, i) => {
        const w = f.rect.x1 - f.rect.x0;
        const d = f.rect.z1 - f.rect.z0;
        const { map, rough } = floorTexture(f.kind, w, d);
        const lift = 0.015 + i * 0.0006;
        return (
          <mesh
            key={`${f.zone}${i}`}
            position={[(f.rect.x0 + f.rect.x1) / 2, lift, (f.rect.z0 + f.rect.z1) / 2]}
            rotation={[-Math.PI / 2, 0, 0]}
            receiveShadow
            material={mat(f.colour, { rough, map, ...(f.kind === "marble" ? { metal: 0.05 } : {}) })}
          >
            <planeGeometry args={[w, d]} />
          </mesh>
        );
      })}
    </Group>
  );
}

/** A thick slab under the building makes it read as a dollhouse cross-section; larger homes get a front lawn. */
export function Plinth({ plan }: { plan: HomePlan }) {
  const { w, d } = plan.size;
  const { side, top, margin: m, frontLawn } = plan.base;
  const ext = frontLawn ?? 0;
  return (
    <Group>
      <Box s={[w + 2 * m, 0.35, d + 2 * m + ext]} p={[w / 2, -0.22, (d + ext) / 2]} c={side} o={{ rough: 0.9 }} />
      <Box s={[w + 2 * m, 0.04, d + 2 * m]} p={[w / 2, -0.04, d / 2]} c={top} o={{ rough: 0.8 }} shadow={false} />
      {ext > 0 && <Box s={[w + 2 * m, 0.04, ext]} p={[w / 2, -0.035, d + m + ext / 2]} c="#6c9a50" o={{ rough: 1 }} shadow={false} />}
    </Group>
  );
}
