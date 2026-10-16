import { useMemo } from "react";
import * as THREE from "three";
import { DoorMat, Pendant, Rug } from "../decor";
import { Art, BRASS, Ball, Box, Clock, Cone, Cyl, Group, Instanced, Neon, Racking, Round, STEEL, Sign, Till, CeilingPanel, type V3 } from "./kit";

/**
 * Oddities Pawn: a dark-panelled, cluttered pawnbroker. Glass jewellery counters, a guitar wall, stacked
 * televisions, a suit of armour and a lit cabinet of curiosities; behind the partition, the repair bench and
 * the safe.
 */
const WOOD = "#5c3e2d";
const BRASS_C = "#bf9550";
const FELT = "#304c43";
const GLASS = { opacity: 0.3, rough: 0.05 };

const ring = new THREE.TorusGeometry(1, 0.28, 8, 16);
function Rings({ p, n = 6 }: { p: V3; n?: number }) {
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: "#e1b23d", roughness: 0.25, metalness: 0.9 }), []);
  return (
    <Group p={p}>
      {Array.from({ length: n }, (_, i) => <mesh key={i} geometry={ring} material={gold} position={[(i - (n - 1) / 2) * 0.09, 0.02, (i % 2) * 0.06]} rotation={[Math.PI / 2 - 0.4, 0, 0]} scale={0.025} />)}
    </Group>
  );
}

/** Glass-topped jewellery case: rings, watches and a necklace on felt. */
function JewelleryCase({ p, w = 1.6, d = 0.55 }: { p: V3; w?: number; d?: number }) {
  return (
    <Group p={p}>
      <Box s={[w, 0.75, d]} p={[0, 0.375, 0]} c={WOOD} o={{ rough: 0.6 }} />
      <Box s={[w - 0.08, 0.02, d - 0.08]} p={[0, 0.76, 0]} c={FELT} o={{ rough: 1 }} shadow={false} />
      <Rings p={[-w / 4, 0.77, -0.05]} />
      {[0.1, 0.3].map((x) => <Group key={x} p={[x, 0.78, 0.05]}><Cyl rad={0.035} h={0.012} r={[Math.PI / 2, 0, 0]} c="#c9ced2" o={{ rough: 0.2, metal: 0.9 }} shadow={false} /><Box s={[0.02, 0.005, 0.12]} c="#2b2a2e" shadow={false} /></Group>)}
      <Box s={[w, 0.3, d]} p={[0, 0.92, 0]} c="#dff0f5" o={GLASS} shadow={false} />
      <Box s={[w + 0.02, 0.03, d + 0.02]} p={[0, 1.08, 0]} c={BRASS_C} o={BRASS} shadow={false} />
    </Group>
  );
}

function Guitar({ p, c, r = 0 }: { p: V3; c: string; r?: number }) {
  return (
    <Group p={p} r={[0, Math.PI / 2, r]}>
      <Round s={[0.36, 0.42, 0.08]} p={[0, -0.25, 0]} c={c} rad={0.04} o={{ rough: 0.3 }} />
      <Round s={[0.3, 0.3, 0.08]} p={[0, 0.06, 0]} c={c} rad={0.04} o={{ rough: 0.3 }} />
      <Cyl rad={0.05} h={0.01} p={[0, -0.12, 0.045]} r={[Math.PI / 2, 0, 0]} c="#1a1a1f" shadow={false} />
      <Box s={[0.05, 0.55, 0.03]} p={[0, 0.45, 0]} c="#6b4a32" />
      <Box s={[0.08, 0.14, 0.03]} p={[0, 0.78, 0]} c="#2b2a2e" />
    </Group>
  );
}

/** Interactive: the main counter with jewellery under glass, scales, the ledger and the till. */
function PawnCounter() {
  return (
    <Group>
      <Box s={[4.0, 0.92, 0.9]} p={[0, 0.46, 0]} c={WOOD} o={{ rough: 0.6 }} />
      {[-1.5, -0.5, 0.5, 1.5].map((x) => <Box key={x} s={[0.9, 0.6, 0.02]} p={[x, 0.48, 0.46]} c="#4a3022" shadow={false} />)}
      <Box s={[4.1, 0.06, 1.0]} p={[0, 0.95, 0]} c={BRASS_C} o={BRASS} />
      <Box s={[3.9, 0.02, 0.8]} p={[0, 0.99, 0]} c={FELT} o={{ rough: 1 }} shadow={false} />
      <Rings p={[-1.1, 1.0, -0.1]} n={8} />
      <Rings p={[0.2, 1.0, 0.1]} n={5} />
      <Box s={[3.9, 0.3, 0.8]} p={[0, 1.15, 0]} c="#dff0f5" o={GLASS} shadow={false} />
      <Box s={[3.95, 0.03, 0.82]} p={[0, 1.3, 0]} c={BRASS_C} o={BRASS} shadow={false} />
      {/* scales, a loupe and the open ledger on the glass, the till at the end */}
      <Group p={[1.2, 1.32, -0.15]}>
        <Box s={[0.3, 0.04, 0.2]} c="#2b2a2e" />
        <Cyl rad={0.08} h={0.01} p={[0, 0.03, 0]} c="#c9ced2" o={STEEL} shadow={false} />
        <Box s={[0.08, 0.02, 0.012]} p={[0, 0.03, 0.1]} c="#6fe3a8" o={{ emissive: "#6fe3a8", glow: 1 }} shadow={false} />
      </Group>
      <Group p={[0.4, 1.32, 0.15]} r={[0, 0.2, 0]}>
        <Box s={[0.44, 0.015, 0.32]} c="#efe3c4" shadow={false} />
        <Box s={[0.006, 0.02, 0.32]} c="#6b4a32" shadow={false} />
      </Group>
      <Cyl rad={0.03} h={0.04} p={[0.85, 1.34, 0.25]} r={[Math.PI / 2, 0, 0]} c="#1a1a1f" shadow={false} />
      <Till p={[-1.6, 1.32, -0.15]} />
      <Cyl rad={0.045} h={0.04} p={[-0.6, 1.34, 0.3]} c={BRASS_C} o={BRASS} shadow={false} />
      <Neon p={[0, 2.35, -0.2]} w={1.8} h={0.42} text="WE BUY GOLD" colour="#ffd35c" />
      {[-0.7, 0.7].map((x) => <Cyl key={x} rad={0.006} h={0.6} p={[x, 2.85, -0.2]} c="#2b2a2e" shadow={false} />)}
    </Group>
  );
}

/** Interactive: tall lit glass cabinet of oddities. */
function Curiosities() {
  return (
    <Group>
      <Box s={[1.4, 2.2, 0.6]} p={[0, 1.1, -0.85]} c={WOOD} o={{ rough: 0.5 }} />
      <Box s={[1.3, 2.0, 0.02]} p={[0, 1.15, -0.54]} c="#dff0f5" o={GLASS} shadow={false} />
      {[0.4, 0.95, 1.5].map((y) => <Box key={y} s={[1.3, 0.03, 0.5]} p={[0, y, -0.85]} c="#e9dfc9" shadow={false} />)}
      {/* skull, crystal ball, old camera, tiny globe, stuffed owl, brass telescope */}
      <Ball rad={0.1} p={[-0.35, 0.53, -0.85]} sc={[0.09, 0.1, 0.11]} c="#efe6d2" />
      <Group p={[0.1, 0.43, -0.85]}><Cyl rad={0.06} h={0.05} p={[0, 0.025, 0]} c={BRASS_C} o={BRASS} shadow={false} /><Ball rad={0.1} p={[0, 0.14, 0]} c="#bfe6ff" o={{ opacity: 0.6, rough: 0.05, emissive: "#9fd0ff", glow: 0.4 }} /></Group>
      <Box s={[0.2, 0.14, 0.12]} p={[0.42, 0.5, -0.85]} c="#2b2a2e" />
      <Cyl rad={0.04} h={0.06} p={[0.42, 0.5, -0.77]} r={[Math.PI / 2, 0, 0]} c="#c9ced2" o={STEEL} shadow={false} />
      <Ball rad={0.1} p={[-0.3, 1.07, -0.85]} c="#4a7fb0" />
      <Group p={[0.25, 0.98, -0.85]}>
        <Ball rad={0.13} p={[0, 0.13, 0]} sc={[0.12, 0.15, 0.11]} c="#8a6a45" o={{ rough: 1 }} />
        <Ball rad={0.06} p={[0, 0.3, 0.02]} c="#a07a50" o={{ rough: 1 }} />
        {[-0.025, 0.025].map((x) => <Ball key={x} rad={0.014} p={[x, 0.31, 0.07]} c="#e8b84a" shadow={false} />)}
      </Group>
      <Cyl rad={0.035} h={0.6} p={[0, 1.6, -0.85]} r={[0, 0, Math.PI / 2 - 0.2]} c={BRASS_C} o={BRASS} />
      <Box s={[1.3, 0.04, 0.4]} p={[0, 2.18, -0.75]} c="#fff4d6" o={{ emissive: "#ffe2a0", glow: 1.0 }} shadow={false} />
      <Sign p={[0, 2.38, -0.54]} w={1.0} h={0.18} text="CURIOSITIES" bg="#2b2a2e" fg="#e9c46a" border={BRASS_C} />
      <Rug p={[0, 0.2]} w={1.4} d={1.0} cols={["#5a2f22", "#c9a24a", "#304c43", "#8a2a2a"]} />
    </Group>
  );
}

function Television({ p, r = 0 }: { p: V3; r?: number }) {
  return (
    <Group p={p} r={[0, r, 0]}>
      <Round s={[0.62, 0.5, 0.5]} p={[0, 0.25, 0]} c="#3a3a3c" rad={0.04} />
      <Box s={[0.46, 0.36, 0.02]} p={[-0.05, 0.27, 0.25]} c="#9aa3a8" o={{ emissive: "#b8c4cc", glow: 0.35 }} shadow={false} />
      <Box s={[0.06, 0.3, 0.02]} p={[0.25, 0.25, 0.25]} c="#2b2a2e" shadow={false} />
    </Group>
  );
}

export function PawnFixture({ id }: { id: string }) {
  switch (id) {
    case "pawn-counter": return <PawnCounter />;
    case "curiosities": return <Curiosities />;
    default: return null;
  }
}

export function PawnDecor() {
  const bikes = useMemo(() => [0, 1], []);
  return (
    <Group>
      <JewelleryCase p={[3.47, 0, 3.8]} w={1.7} />
      <JewelleryCase p={[8.92, 0, 3.8]} w={0.9} />
      <JewelleryCase p={[3.3, 0, 6.2]} w={1.75} d={0.75} />
      {/* guitar wall and an amp */}
      {[3.3, 3.95, 4.6, 5.25, 5.9].map((z, i) => <Guitar key={z} p={[0.18, 1.7, z]} c={["#c0392b", "#e0b84a", "#2b2a2e", "#4a7fb0", "#8a5a3a"][i]!} r={(i % 2 ? 0.08 : -0.06)} />)}
      <Round s={[0.5, 0.55, 0.35]} p={[0.4, 0.28, 6.2]} c="#1a1a1f" rad={0.03} />
      <Box s={[0.02, 0.4, 0.3]} p={[0.58, 0.32, 6.2]} c="#3a3a3c" shadow={false} />
      {/* stacked televisions and a record player */}
      <Television p={[0.5, 0, 7.0]} r={Math.PI / 2} />
      <Television p={[0.5, 0.5, 7.0]} r={Math.PI / 2} />
      <Television p={[0.5, 0, 7.75]} r={Math.PI / 2} />
      <Group p={[0.5, 0.5, 7.75]} r={[0, Math.PI / 2, 0]}>
        <Box s={[0.5, 0.12, 0.4]} p={[0, 0.06, 0]} c="#8a5a3a" />
        <Cyl rad={0.15} h={0.01} p={[0, 0.13, 0]} c="#1a1a1f" shadow={false} />
      </Group>
      {/* suit of armour in the corner */}
      <Group p={[11.55, 0, 3.45]}>
        <Box s={[0.5, 0.06, 0.5]} p={[0, 0.03, 0]} c={WOOD} />
        {[-0.1, 0.1].map((x) => <Cyl key={x} rad={0.07} h={0.75} p={[x, 0.45, 0]} c="#aab3b8" o={{ rough: 0.25, metal: 0.9 }} />)}
        <Round s={[0.42, 0.55, 0.28]} p={[0, 1.1, 0]} c="#aab3b8" rad={0.08} o={{ rough: 0.25, metal: 0.9 }} />
        {[-0.27, 0.27].map((x) => <Cyl key={x} rad={0.06} h={0.55} p={[x, 1.05, 0]} c="#aab3b8" o={{ rough: 0.25, metal: 0.9 }} />)}
        <Ball rad={0.14} p={[0, 1.55, 0]} c="#aab3b8" o={{ rough: 0.25, metal: 0.9 }} />
        <Box s={[0.18, 0.03, 0.02]} p={[0, 1.55, 0.13]} c="#1a1a1f" shadow={false} />
        <Cone rad={0.04} h={0.2} p={[0, 1.75, 0]} c="#c0392b" />
        <Cyl rad={0.012} h={1.6} p={[0.35, 0.85, 0]} c="#6b4a32" />
        <Cone rad={0.05} h={0.2} p={[0.35, 1.75, 0]} c="#c9ced2" o={STEEL} />
      </Group>
      {/* shelving by the window: radios, vases, a typewriter */}
      <Group p={[11.62, 0, 8.2]} r={[0, -Math.PI / 2, 0]}>
        {[0.3, 0.8, 1.3, 1.8].map((y) => <Box key={y} s={[1.2, 0.03, 0.4]} p={[0, y, 0]} c={WOOD} shadow={false} />)}
        {[-0.6, 0.6].map((x) => <Box key={x} s={[0.03, 1.9, 0.4]} p={[x, 0.95, 0]} c={WOOD} />)}
        {[[-0.3, 0.32, "#8a5a3a"], [0.25, 0.32, "#2b2a2e"], [-0.25, 0.82, "#2f7f79"], [0.3, 0.82, "#c9a24a"], [0, 1.32, "#c0392b"], [-0.35, 1.82, "#e9dfc9"], [0.3, 1.82, "#4a7fb0"]].map(([x, y, c], i) => <Round key={i} s={[0.24, 0.24, 0.22]} p={[x as number, (y as number) + 0.13, 0]} c={c as string} rad={0.05} />)}
      </Group>
      {/* bicycles hanging from the ceiling, a lamp and rugs */}
      {bikes.map((i) => (
        <Group key={i} p={[6.0 + i * 1.8, 2.55, 7.4]}>
          {[-0.45, 0.45].map((x) => <Cyl key={x} rad={0.33} h={0.04} p={[x, 0, 0]} r={[Math.PI / 2, 0, 0]} c="#1a1a1f" shadow={false} />)}
          <Box s={[0.8, 0.04, 0.04]} p={[0, 0.1, 0]} c={i ? "#2f6fb3" : "#c0392b"} shadow={false} />
          {[-0.3, 0.3].map((x) => <Cyl key={x} rad={0.006} h={0.5} p={[x, 0.4, 0]} c="#2b2a2e" shadow={false} />)}
        </Group>
      ))}
      <Rug p={[6.0, 6.6]} w={2.6} d={1.8} cols={["#5a2f22", "#c9a24a", "#304c43", "#8a2a2a"]} />
      <Art p={[11.88, 1.9, 6.2]} r={[0, -Math.PI / 2, 0]} w={0.5} h={0.7} art={1} />
      <Clock p={[11.88, 2.5, 5.0]} r={[0, -Math.PI / 2, 0]} />
      {[[4.0, 5.0], [8.4, 6.0]].map(([x, z]) => <Pendant key={`${x}${z}`} p={[x!, 3.2, z!]} colour="#ffcf88" cord={1.0} />)}
      <Sign p={[0.12, 2.7, 4.6]} r={[0, Math.PI / 2, 0]} w={1.6} h={0.3} text="ODDITIES PAWN" bg="#2b2a2e" fg="#e9c46a" border={BRASS_C} />
      <DoorMat p={[5.9, 8.5]} />
      {/* back room: repair bench with a lamp and a radio, racking, boxed stock and the safe */}
      <Group p={[4.3, 0, 0.48]}>
        <Box s={[2.5, 0.06, 0.62]} p={[0, 0.9, 0]} c="#8a6a45" o={{ rough: 0.8 }} />
        {[-1.15, 1.15].map((x) => <Box key={x} s={[0.06, 0.9, 0.55]} p={[x, 0.45, 0]} c="#3a3d42" o={STEEL} />)}
        <Group p={[-0.8, 0.93, 0]}><Cyl rad={0.07} h={0.02} c="#2b2a2e" shadow={false} /><Cyl rad={0.01} h={0.4} p={[0, 0.2, -0.05]} r={[0.3, 0, 0]} c="#2b2a2e" shadow={false} /><Cone rad={0.08} h={0.1} p={[0, 0.4, 0.05]} r={[Math.PI - 0.6, 0, 0]} c="#c0392b" o={{ emissive: "#ffe2a0", glow: 0.3 }} /></Group>
        <Round s={[0.4, 0.2, 0.18]} p={[0.6, 1.03, 0]} c="#8a5a3a" rad={0.04} />
        <Box s={[0.3, 0.12, 0.22]} p={[0.1, 0.99, 0.05]} c="#2b2a2e" shadow={false} />
        {[0, 1, 2].map((i) => <Box key={i} s={[0.14, 0.012, 0.03]} p={[-0.3 + i * 0.08, 0.935, 0.2]} r={[0, i * 0.3, 0]} c={["#c0392b", "#aab3b8", "#e0b84a"][i]!} shadow={false} />)}
      </Group>
      <Racking p={[1.2, 0, 0.42]} w={1.6} h={2.0} d={0.5} seed={9} />
      <Instanced colours={["#b88b5f", "#c9a77c", "#9c7650"]} items={[[7.2, 0.2, 0.45], [7.65, 0.2, 0.5], [8.1, 0.2, 0.45], [7.4, 0.55, 0.5], [7.9, 0.55, 0.5], [7.6, 0.9, 0.5]].map(([x, y, z], i) => ({ p: [x!, y!, z!] as V3, s: [0.42, 0.34, 0.5] as V3, c: i % 3 }))} />
      <Group p={[11.1, 0, 0.6]}>
        <Round s={[0.95, 0.95, 0.75]} p={[0, 0.48, 0]} c="#3a3d42" rad={0.04} o={{ rough: 0.35, metal: 0.6 }} />
        <Cyl rad={0.12} h={0.04} p={[0.1, 0.55, 0.38]} r={[Math.PI / 2, 0, 0]} c={BRASS_C} o={BRASS} shadow={false} />
        <Box s={[0.04, 0.3, 0.05]} p={[-0.3, 0.55, 0.38]} c="#c9ced2" o={STEEL} shadow={false} />
      </Group>
      <CeilingPanel p={[6.0, 2.85, 1.4]} w={1.2} d={0.2} colour="#f0f0e0" />
    </Group>
  );
}
