import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Ball, Box, Cone, Cyl, Group, Round, mat } from "../primitives";
import { artTexture, neonTexture } from "../textures";
import { labelTexture } from "@/components/town3d/textures";

/**
 * Shared set dressing for the town venues, at the same finish as the gym and the homes: bevelled shapes,
 * real materials, small props. Every model sits on its own origin, front toward +z.
 * Repeated small items (stock, books, files) are instanced so a full shelf is one draw call per colour.
 */
export type V3 = [number, number, number];
export const STEEL = { rough: 0.35, metal: 0.75 };
export const CHROME = { rough: 0.18, metal: 0.95 };
export const BRASS = { rough: 0.3, metal: 0.85 };
export { Ball, Box, Cone, Cyl, Group, Round, mat };

const plane = new THREE.PlaneGeometry(1, 1);
const unit = new THREE.BoxGeometry(1, 1, 1);

/** Painted sign with the game's hand-drawn lettering. */
export function Sign({ p, r, w, h, text, bg, fg = "#fff8e6", border = "#2b2a2e", glow = 0 }: { p: V3; r?: V3; w: number; h: number; text: string; bg: string; fg?: string; border?: string; glow?: number }) {
  const m = useMemo(() => {
    const map = labelTexture(text, bg, fg, { w: 512, h: Math.max(64, Math.round((512 * h) / w)), border });
    return new THREE.MeshStandardMaterial({ map, roughness: 0.6, ...(glow ? { emissive: new THREE.Color("#ffffff"), emissiveMap: map, emissiveIntensity: glow } : {}) });
  }, [text, bg, fg, w, h, border, glow]);
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[w + 0.04, h + 0.04, 0.03]} p={[0, 0, -0.016]} c={border} shadow={false} />
      <mesh geometry={plane} position={[0, 0, 0.001]} scale={[w, h, 1]} material={m} />
    </Group>
  );
}

/** Neon tube sign on a dark backing board, glowing in its own colour. */
export function Neon({ p, r, w, h, text, colour }: { p: V3; r?: V3; w: number; h: number; text: string; colour: string }) {
  const m = useMemo(() => {
    const t = neonTexture(text, colour);
    return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.2, roughness: 0.5 });
  }, [text, colour]);
  return <Box s={[w, h, 0.04]} p={p} {...(r ? { r } : {})} m={m} shadow={false} />;
}

/** Framed print from the shared art set. */
export function Art({ p, r, w, h, art }: { p: V3; r?: V3; w: number; h: number; art: number }) {
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: artTexture(art), roughness: 0.7 }), [art]);
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[w + 0.07, h + 0.07, 0.035]} c="#3a2c22" shadow={false} />
      <mesh geometry={plane} position={[0, 0, 0.019]} scale={[w, h, 1]} material={face} />
    </Group>
  );
}

/** Pin board with paper notices, photos and a header strip. */
export function NoticeBoard({ p, r, w = 1.3, h = 0.9, frame = "#6b4a32", cork = "#c49a6c", header }: { p: V3; r?: V3; w?: number; h?: number; frame?: string; cork?: string; header?: string }) {
  const notes = useMemo(() => {
    const out: { x: number; y: number; w: number; h: number; c: string; t: number }[] = [];
    const cols = ["#f4efe2", "#f3e08a", "#cfe6f2", "#f4c9c0", "#e9eef2"];
    let seed = Math.round(w * 97 + h * 31);
    const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < Math.round(w * h * 9); i++) out.push({ x: (rnd() - 0.5) * (w - 0.3), y: (rnd() - 0.5) * (h - 0.3) - (header ? 0.06 : 0), w: 0.13 + rnd() * 0.12, h: 0.15 + rnd() * 0.12, c: cols[i % cols.length]!, t: (rnd() - 0.5) * 0.18 });
    return out;
  }, [w, h, header]);
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[w + 0.08, h + 0.08, 0.04]} c={frame} o={{ rough: 0.7 }} />
      <Box s={[w, h, 0.02]} p={[0, 0, 0.022]} c={cork} o={{ rough: 1 }} shadow={false} />
      {notes.map((n, i) => (
        <Group key={i} p={[n.x, n.y, 0.036]} r={[0, 0, n.t]}>
          <Box s={[n.w, n.h, 0.004]} c={n.c} shadow={false} />
          <Ball rad={0.012} p={[0, n.h / 2 - 0.02, 0.006]} c={["#d9574a", "#2f6a64", "#e1a53a"][i % 3]!} shadow={false} />
        </Group>
      ))}
      {header && <Sign p={[0, h / 2 - 0.07, 0.04]} w={Math.min(w - 0.1, 0.9)} h={0.12} text={header} bg="#2b2a2e" border="#2b2a2e" />}
    </Group>
  );
}

/** Wall clock. */
export function Clock({ p, r, rad = 0.17 }: { p: V3; r?: V3; rad?: number }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Cyl rad={rad} h={0.05} r={[Math.PI / 2, 0, 0]} c="#2b2a2e" shadow={false} />
      <Cyl rad={rad * 0.88} h={0.052} r={[Math.PI / 2, 0, 0]} c="#f4f1ea" shadow={false} />
      <Box s={[0.012, rad * 0.6, 0.01]} p={[0, rad * 0.25, 0.03]} c="#2b2a2e" shadow={false} />
      <Box s={[rad * 0.5, 0.012, 0.01]} p={[rad * 0.2, 0, 0.03]} c="#2b2a2e" shadow={false} />
    </Group>
  );
}

/** Potted plant with a leafy crown. */
export function Plant({ p, s = 1, pot = "#c9775a" }: { p: V3; s?: number; pot?: string }) {
  return (
    <Group p={p}>
      <Cyl rad={0.17 * s} h={0.36 * s} p={[0, 0.18 * s, 0]} c={pot} o={{ rough: 0.8 }} />
      <Cyl rad={0.155 * s} h={0.02} p={[0, 0.36 * s, 0]} c="#4a3626" shadow={false} />
      <Ball rad={0.26 * s} p={[0, 0.62 * s, 0]} c="#4f8a3e" o={{ rough: 1 }} />
      <Ball rad={0.18 * s} p={[0.14 * s, 0.82 * s, 0.05 * s]} c="#6aa24f" o={{ rough: 1 }} />
      <Ball rad={0.16 * s} p={[-0.13 * s, 0.78 * s, -0.06 * s]} c="#3f7a33" o={{ rough: 1 }} />
    </Group>
  );
}

/** Upright chair; `cushion` colours the seat and back pad. */
export function Chair({ p, r, frame = "#6b4a32", cushion = "#cf6a57", h = 0.46 }: { p: V3; r?: V3; frame?: string; cushion?: string; h?: number }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      {[[-0.19, -0.19], [0.19, -0.19], [-0.19, 0.19], [0.19, 0.19]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.04, h, 0.04]} p={[x!, h / 2, z!]} c={frame} />)}
      <Round s={[0.46, 0.06, 0.46]} p={[0, h, 0]} c={cushion} rad={0.025} />
      <Box s={[0.44, 0.42, 0.05]} p={[0, h + 0.24, -0.21]} c={frame} />
      <Round s={[0.36, 0.28, 0.04]} p={[0, h + 0.26, -0.18]} c={cushion} rad={0.015} />
    </Group>
  );
}

/** Office swivel chair. */
export function OfficeChair({ p, r, c = "#2a2f36" }: { p: V3; r?: V3; c?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[0.3, 0.03, 0.04]} p={[Math.cos((i * Math.PI * 2) / 5) * 0.14, 0.04, Math.sin((i * Math.PI * 2) / 5) * 0.14]} r={[0, -(i * Math.PI * 2) / 5, 0]} c="#1a1a1f" shadow={false} />)}
      <Cyl rad={0.025} h={0.36} p={[0, 0.22, 0]} c="#aab3b8" o={STEEL} />
      <Round s={[0.48, 0.08, 0.46]} p={[0, 0.44, 0]} c={c} rad={0.03} />
      <Round s={[0.44, 0.5, 0.07]} p={[0, 0.75, -0.21]} c={c} rad={0.03} />
    </Group>
  );
}

/** Bar or counter stool. */
export function Stool({ p, top = "#b8433c", h = 0.72 }: { p: V3; top?: string; h?: number }) {
  return (
    <Group p={p}>
      <Cyl rad={0.17} h={0.03} p={[0, 0.015, 0]} c="#c9ced2" o={CHROME} shadow={false} />
      <Cyl rad={0.025} h={h} p={[0, h / 2, 0]} c="#c9ced2" o={CHROME} />
      <Cyl rad={0.2} h={0.08} p={[0, h + 0.03, 0]} c={top} o={{ rough: 0.4 }} />
      <Cyl rad={0.12} h={0.015} p={[0, h * 0.35, 0]} c="#c9ced2" o={CHROME} shadow={false} />
    </Group>
  );
}

/** Rectangular table with four legs. */
export function Table({ p, r, w, d, h = 0.75, top = "#b98a5b", leg = "#6b4a32", round = false }: { p: V3; r?: V3; w: number; d: number; h?: number; top?: string; leg?: string; round?: boolean }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      {round ? <Cyl rad={w / 2} h={0.05} p={[0, h, 0]} c={top} o={{ rough: 0.45 }} /> : <Round s={[w, 0.05, d]} p={[0, h, 0]} c={top} rad={0.02} o={{ rough: 0.5 }} />}
      {round ? (
        <>
          <Cyl rad={0.04} h={h} p={[0, h / 2, 0]} c={leg} o={STEEL} />
          <Cyl rad={0.22} h={0.03} p={[0, 0.015, 0]} c={leg} o={STEEL} shadow={false} />
        </>
      ) : (
        [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <Box key={`${sx}${sz}`} s={[0.05, h, 0.05]} p={[sx! * (w / 2 - 0.07), h / 2, sz! * (d / 2 - 0.07)]} c={leg} />)
      )}
    </Group>
  );
}

/** Flat-screen monitor on a stand with a glowing picture. */
export function Monitor({ p, r, w = 0.55, glow = "#6fb6e6" }: { p: V3; r?: V3; w?: number; glow?: string }) {
  const h = w * 0.6;
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[0.18, 0.015, 0.14]} p={[0, 0.008, 0]} c="#1a1a1f" shadow={false} />
      <Box s={[0.04, 0.16, 0.03]} p={[0, 0.09, -0.02]} c="#1a1a1f" shadow={false} />
      <Round s={[w, h, 0.035]} p={[0, 0.16 + h / 2, 0]} c="#1a1a1f" rad={0.012} />
      <Box s={[w - 0.04, h - 0.04, 0.005]} p={[0, 0.16 + h / 2, 0.019]} c="#0f2030" o={{ emissive: glow, glow: 0.7 }} shadow={false} />
    </Group>
  );
}

/** Desk keyboard and mouse. */
export function Keyboard({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Box s={[0.42, 0.02, 0.14]} c="#2a2f36" shadow={false} />
      <Box s={[0.06, 0.02, 0.09]} p={[0.3, 0, 0.02]} c="#2a2f36" shadow={false} />
    </Group>
  );
}

/** Recessed ceiling light panel: a bright emissive slab under a frame. */
export function CeilingPanel({ p, w = 1.2, d = 0.6, colour = "#f6fbff" }: { p: V3; w?: number; d?: number; colour?: string }) {
  // A single down-facing plane: lit from the room below, back-face culled from the overhead camera so it
  // never reads as a slab floating over the floor.
  return (
    <mesh position={p} rotation={[Math.PI / 2, 0, 0]}>
      <planeGeometry args={[w, d]} />
      <meshStandardMaterial color="#ffffff" emissive={colour} emissiveIntensity={1.4} />
    </mesh>
  );
}

/** Two-tier water cooler. */
export function WaterCooler({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Round s={[0.34, 0.95, 0.34]} p={[0, 0.475, 0]} c="#e9eef2" rad={0.03} o={{ rough: 0.4 }} />
      <Cyl rad={0.14} h={0.42} p={[0, 1.16, 0]} c="#9fd0e6" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
      <Box s={[0.05, 0.05, 0.04]} p={[-0.06, 0.78, 0.18]} c="#4a8fd9" shadow={false} />
      <Box s={[0.05, 0.05, 0.04]} p={[0.06, 0.78, 0.18]} c="#d9574a" shadow={false} />
    </Group>
  );
}

/** Office bin. */
export function Bin({ p, c = "#5a6066" }: { p: V3; c?: string }) {
  return <Cyl rad={0.14} h={0.34} p={[p[0], 0.17, p[2]]} c={c} o={{ rough: 0.5, metal: 0.3 }} />;
}

/** Steel filing cabinet with drawer handles. */
export function FilingCabinet({ p, r, n = 4, c = "#8b949a" }: { p: V3; r?: V3; n?: number; c?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[0.46, n * 0.32, 0.6]} p={[0, (n * 0.32) / 2, 0]} c={c} o={{ rough: 0.4, metal: 0.4 }} />
      {Array.from({ length: n }, (_, i) => (
        <Group key={i} p={[0, 0.16 + i * 0.32, 0.302]}>
          <Box s={[0.42, 0.28, 0.01]} c={c} o={{ rough: 0.35, metal: 0.45 }} shadow={false} />
          <Box s={[0.14, 0.025, 0.02]} p={[0, 0.07, 0.01]} c="#2b2a2e" shadow={false} />
        </Group>
      ))}
    </Group>
  );
}

/** Instanced small boxes: one draw call per colour however many items. */
export function Instanced({ items, colours, rough = 0.6 }: { items: { p: V3; s: V3; c: number; ry?: number }[]; colours: string[]; rough?: number }) {
  const groups = useMemo(() => colours.map((_, i) => items.filter((it) => it.c % colours.length === i)), [items, colours]);
  const materials = useMemo(() => colours.map((c) => mat(c, { rough })), [colours, rough]);
  return (
    <>
      {groups.map((list, i) => list.length ? <InstancedSet key={i} list={list} material={materials[i]!} /> : null)}
    </>
  );
}
function InstancedSet({ list, material }: { list: { p: V3; s: V3; ry?: number }[]; material: THREE.Material }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    list.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(0, it.ry ?? 0, 0);
      o.scale.set(...it.s);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [list]);
  return <instancedMesh ref={ref} args={[unit, material, list.length]} castShadow receiveShadow />;
}

const BOOK = ["#d9695a", "#2f7f79", "#e0b84a", "#6f7f93", "#e9dfc9", "#8a5a6b", "#4a7a4a", "#2c4462"];
/** Rows of books (or files) along shelves of width w, at the given shelf heights. */
export function useBooks(w: number, shelves: number[], depth = 0.22, seed = 1, files = false) {
  return useMemo(() => {
    const items: { p: V3; s: V3; c: number; ry?: number }[] = [];
    let a = seed * 7919;
    const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647);
    shelves.forEach((y) => {
      let x = -w / 2 + 0.03;
      while (x < w / 2 - 0.08) {
        const bw = files ? 0.07 : 0.035 + rnd() * 0.035;
        const bh = files ? 0.3 : 0.2 + rnd() * 0.12;
        if (rnd() > 0.93) { x += 0.1; continue; }
        items.push({ p: [x + bw / 2, y + bh / 2, 0], s: [bw, bh, depth * (0.75 + rnd() * 0.25)], c: Math.floor(rnd() * 8), ry: rnd() > 0.95 ? 0.2 : 0 });
        x += bw + 0.004;
      }
    });
    return items;
  }, [w, shelves, depth, seed, files]);
}
export const BOOK_COLOURS = BOOK;

/** Tall open bookcase full of books. */
export function Bookcase({ p, r, w = 1.2, h = 2.0, d = 0.34, wood = "#6b4a32", seed = 1, files = false }: { p: V3; r?: V3; w?: number; h?: number; d?: number; wood?: string; seed?: number; files?: boolean }) {
  const shelves = useMemo(() => Array.from({ length: Math.floor(h / 0.4) }, (_, i) => 0.06 + i * 0.4), [h]);
  const books = useBooks(w - 0.08, shelves, d * 0.8, seed, files);
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[w, h, 0.03]} p={[0, h / 2, -d / 2 + 0.015]} c={wood} o={{ rough: 0.7 }} />
      {[-1, 1].map((s) => <Box key={s} s={[0.04, h, d]} p={[s * (w / 2 - 0.02), h / 2, 0]} c={wood} o={{ rough: 0.7 }} />)}
      {[...shelves, h - 0.02].map((y) => <Box key={y} s={[w - 0.04, 0.03, d]} p={[0, y - 0.015, 0]} c={wood} o={{ rough: 0.7 }} shadow={false} />)}
      <Group p={[0, 0, 0.02]}>
        <Instanced items={books} colours={files ? ["#e9dfc9", "#2f7f79", "#6f7f93", "#2c4462", "#e0b84a", "#d9695a", "#e9eef2", "#8a5a6b"] : BOOK} />
      </Group>
    </Group>
  );
}

/** Generic service counter: carcass, worktop and a kick plate; `front` colours the customer face. */
export function Counter({ p, r, w, d = 0.7, h = 1.0, body = "#6b4a32", top = "#e9e2d2", front, kick = "#2b2a2e" }: { p: V3; r?: V3; w: number; d?: number; h?: number; body?: string; top?: string; front?: string; kick?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[w, h - 0.05, d]} p={[0, (h - 0.05) / 2, 0]} c={body} o={{ rough: 0.6 }} />
      <Round s={[w + 0.06, 0.05, d + 0.08]} p={[0, h - 0.02, 0.02]} c={top} rad={0.015} o={{ rough: 0.35 }} />
      {front && <Box s={[w - 0.04, h - 0.25, 0.02]} p={[0, (h - 0.05) / 2 + 0.05, d / 2 + 0.01]} c={front} o={{ rough: 0.5 }} shadow={false} />}
      <Box s={[w, 0.1, 0.02]} p={[0, 0.05, d / 2 + 0.012]} c={kick} shadow={false} />
    </Group>
  );
}

/** Till: screen on a stand, keypad and cash drawer. */
export function Till({ p, r }: { p: V3; r?: V3 }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[0.36, 0.1, 0.32]} p={[0, 0.05, 0]} c="#2b2a2e" />
      <Box s={[0.26, 0.04, 0.12]} p={[0, 0.12, 0.05]} c="#3a3f45" r={[-0.3, 0, 0]} shadow={false} />
      <Box s={[0.04, 0.18, 0.04]} p={[0, 0.19, -0.1]} c="#2b2a2e" shadow={false} />
      <Box s={[0.28, 0.18, 0.03]} p={[0, 0.34, -0.1]} r={[-0.25, 0, 0]} c="#1a1a1f" />
      <Box s={[0.24, 0.14, 0.005]} p={[0, 0.34, -0.083]} r={[-0.25, 0, 0]} c="#0f2030" o={{ emissive: "#6fe3a8", glow: 0.8 }} shadow={false} />
    </Group>
  );
}

/** Low fabric sofa (two-seater) for waiting areas and offices. */
export function Settee({ p, r, w = 1.6, c = "#5c6e98", legs = "#2b2a2e" }: { p: V3; r?: V3; w?: number; c?: string; legs?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Round s={[w, 0.2, 0.72]} p={[0, 0.3, 0]} c={c} rad={0.05} />
      <Round s={[w, 0.42, 0.18]} p={[0, 0.55, -0.28]} c={c} rad={0.06} />
      {[-1, 1].map((s) => <Round key={s} s={[0.16, 0.3, 0.72]} p={[s * (w / 2 - 0.08), 0.42, 0]} c={c} rad={0.05} />)}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => <Box key={`${sx}${sz}`} s={[0.04, 0.2, 0.04]} p={[sx! * (w / 2 - 0.1), 0.1, sz! * 0.28]} c={legs} shadow={false} />)}
    </Group>
  );
}

/** Row of linked waiting chairs on a steel beam. */
export function ChairRow({ p, r, n = 4, c = "#4f9a87" }: { p: V3; r?: V3; n?: number; c?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[n * 0.55, 0.05, 0.08]} p={[0, 0.3, 0]} c="#9aa3a8" o={STEEL} />
      {[-1, 1].map((s) => <Box key={s} s={[0.05, 0.3, 0.4]} p={[s * (n * 0.55 / 2 - 0.15), 0.15, 0]} c="#9aa3a8" o={STEEL} shadow={false} />)}
      {Array.from({ length: n }, (_, i) => (
        <Group key={i} p={[(i - (n - 1) / 2) * 0.55, 0, 0]}>
          <Round s={[0.46, 0.06, 0.44]} p={[0, 0.44, 0.02]} c={c} rad={0.03} />
          <Round s={[0.46, 0.42, 0.05]} p={[0, 0.68, -0.2]} r={[-0.12, 0, 0]} c={c} rad={0.02} />
        </Group>
      ))}
    </Group>
  );
}

/** Metal shelving rack with boxes, for stockrooms and back rooms. */
export function Racking({ p, r, w = 2.4, h = 2.0, d = 0.5, seed = 3, colours = ["#b88b5f", "#c9a77c", "#9c7650", "#e9dfc9"] }: { p: V3; r?: V3; w?: number; h?: number; d?: number; seed?: number; colours?: string[] }) {
  const items = useMemo(() => {
    const out: { p: V3; s: V3; c: number }[] = [];
    let a = seed * 104729;
    const rnd = () => ((a = (a * 16807) % 2147483647) / 2147483647);
    for (let level = 0; level < 4; level++) {
      const y = 0.08 + level * (h / 4);
      let x = -w / 2 + 0.06;
      while (x < w / 2 - 0.3) {
        const bw = 0.24 + rnd() * 0.22, bh = Math.min(h / 4 - 0.08, 0.18 + rnd() * 0.22);
        out.push({ p: [x + bw / 2, y + bh / 2 + 0.02, (rnd() - 0.5) * 0.06], s: [bw, bh, d * (0.7 + rnd() * 0.25)], c: Math.floor(rnd() * 4) });
        x += bw + 0.03 + rnd() * 0.08;
      }
    }
    return out;
  }, [w, h, d, seed]);
  return (
    <Group p={p} {...(r ? { r } : {})}>
      {[-1, 1].map((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.04, h, 0.04]} p={[sx * (w / 2 - 0.02), h / 2, sz * (d / 2 - 0.02)]} c="#3f6e8c" o={STEEL} />))}
      {[0, 1, 2, 3].map((l) => <Box key={l} s={[w, 0.03, d]} p={[0, 0.08 + l * (h / 4), 0]} c="#c9ced2" o={STEEL} shadow={false} />)}
      <Instanced items={items} colours={colours} rough={0.9} />
    </Group>
  );
}

/** Ceiling-hung strip light. */
export function StripLight({ p, w = 1.8, colour = "#f6fbff" }: { p: V3; w?: number; colour?: string; drop?: number }) {
  // Down-facing tube only: glows for the room below, culled from the overhead camera.
  return <CeilingPanel p={p} w={w} d={0.16} colour={colour} />;
}

/** Rope barrier post (brass) for queues. */
export function QueuePost({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Cyl rad={0.14} h={0.04} p={[0, 0.02, 0]} c="#c9a24a" o={BRASS} shadow={false} />
      <Cyl rad={0.03} h={0.9} p={[0, 0.47, 0]} c="#c9a24a" o={BRASS} />
      <Ball rad={0.05} p={[0, 0.94, 0]} c="#c9a24a" o={BRASS} />
    </Group>
  );
}

/** Thick velvet rope between two points at post height. */
export function Rope({ a, b, c = "#8a2a2a" }: { a: [number, number]; b: [number, number]; c?: string }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return <Cyl rad={0.022} h={len} p={[(a[0] + b[0]) / 2, 0.82, (a[1] + b[1]) / 2]} r={[0, -Math.atan2(b[1] - a[1], b[0] - a[0]), Math.PI / 2]} c={c} o={{ rough: 0.9 }} shadow={false} />;
}

/** Traffic cone. */
export function TrafficCone({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Box s={[0.3, 0.03, 0.3]} p={[0, 0.015, 0]} c="#2b2a2e" shadow={false} />
      <Cone rad={0.12} h={0.45} p={[0, 0.25, 0]} c="#e8743b" o={{ rough: 0.6 }} />
      <Cyl rad={0.075} h={0.06} p={[0, 0.3, 0]} c="#f4f1ea" shadow={false} />
    </Group>
  );
}

/** A floor-standing radiator-style heater or a wall box, used as small filler props. */
export function WallBox({ p, r, s = [0.4, 0.5, 0.15], c = "#d9dde0" }: { p: V3; r?: V3; s?: V3; c?: string }) {
  return <Round s={s} p={p} {...(r ? { r } : {})} c={c} rad={0.02} o={{ rough: 0.5 }} />;
}

export { Cyl as Cylinder };
