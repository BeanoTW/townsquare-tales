import { useMemo } from "react";
import * as THREE from "three";
import { Ball, Box, Cyl, Group, Round } from "./primitives";
import { neonTexture } from "./textures";

/**
 * Iron Gym: a converted warehouse. Steel trusses and hanging strip lights, exposed brick on one wall and painted
 * block on the others, a rubber weights floor, a cardio zone with a stretching mat, a reception desk and a
 * changing room behind a door. The power rack and the running machines are the interactive objects.
 */
const STEEL = { rough: 0.35, metal: 0.8 };
const AMBER = "#e1a53a";
const PLATE = ["#1a1a1f", "#2a3a5a", "#c0392b", "#2f6a64"];

const neonMat = (text: string, colour: string) => {
  const t = neonTexture(text, colour);
  return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.1, roughness: 0.5 });
};

function Plate({ p, rad = 0.22, c = "#1a1a1f", rot = 0 }: { p: [number, number, number]; rad?: number; c?: string; rot?: number }) {
  return (
    <Group p={p} r={[0, 0, Math.PI / 2 + rot]}>
      <Cyl rad={rad} h={0.05} c={c} o={{ rough: 0.4, metal: 0.4 }} />
      <Cyl rad={0.06} h={0.054} c="#c9c9cf" o={STEEL} shadow={false} />
    </Group>
  );
}

function Barbell({ p, len = 2.2, plates = 3 }: { p: [number, number, number]; len?: number; plates?: number }) {
  return (
    <Group p={p}>
      <Cyl rad={0.016} h={len} r={[0, 0, Math.PI / 2]} c="#c9c9cf" o={STEEL} />
      {[-1, 1].map((s) =>
        Array.from({ length: plates }, (_, i) => (
          <Plate key={`${s}${i}`} p={[s * (len / 2 - 0.2 - i * 0.06), 0, 0]} rad={0.22 - i * 0.02} c={PLATE[(i + (s > 0 ? 1 : 0)) % PLATE.length]!} />
        )),
      )}
    </Group>
  );
}

/** Interactive: a steel power rack on a lifting platform with a loaded bar, a bench, and a plate tree. */
export function PowerRack() {
  return (
    <Group>
      <Box s={[2.6, 0.05, 2.1]} p={[0, 0.03, 0]} c="#6a4a30" o={{ rough: 0.9 }} shadow={false} />
      {[[-0.65, -0.55], [0.65, -0.55], [-0.65, 0.55], [0.65, 0.55]].map(([x, z]) => (
        <Box key={`${x}${z}`} s={[0.09, 2.35, 0.09]} p={[x!, 1.2, z!]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.6 }} />
      ))}
      {[-0.55, 0.55].map((z) => (
        <Box key={z} s={[1.4, 0.07, 0.09]} p={[0, 2.35, z]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.6 }} />
      ))}
      {[-0.65, 0.65].map((x) => (
        <Box key={x} s={[0.09, 0.07, 1.2]} p={[x, 2.35, 0]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.6 }} />
      ))}
      {/* amber hole-markers and hooks */}
      {[-0.65, 0.65].map((x) => (
        <Group key={x}>
          <Box s={[0.1, 0.9, 0.1]} p={[x, 1.2, -0.55]} c={AMBER} o={{ rough: 0.5 }} shadow={false} />
          <Box s={[0.1, 0.12, 0.2]} p={[x, 1.4, -0.45]} c="#c9c9cf" o={STEEL} />
          <Box s={[0.1, 0.12, 0.2]} p={[x, 1.4, 0.45]} c="#c9c9cf" o={STEEL} />
        </Group>
      ))}
      <Barbell p={[0, 1.5, -0.55]} len={2.3} plates={3} />
      {/* bench under a pull-up bar */}
      <Round s={[0.34, 0.1, 1.1]} p={[0, 0.45, 0.15]} c="#1a1a1f" rad={0.04} />
      <Box s={[0.08, 0.42, 0.9]} p={[0, 0.21, 0.15]} c="#2a2a2c" o={STEEL} />
      <Cyl rad={0.02} h={1.3} p={[0, 2.1, 0.55]} r={[0, 0, Math.PI / 2]} c="#c9c9cf" o={STEEL} />
      {/* plate tree and a chalk bowl */}
      <Group p={[1.1, 0, -0.4]}>
        <Cyl rad={0.025} h={1.1} p={[0, 0.55, 0]} c="#2a2a2c" o={STEEL} />
        {[0.2, 0.4, 0.6, 0.8].map((y, i) => (
          <Cyl key={y} rad={0.2 - i * 0.015} h={0.05} p={[0, y, 0]} c={PLATE[i % PLATE.length]!} o={{ rough: 0.4, metal: 0.4 }} />
        ))}
      </Group>
      <Round s={[0.2, 0.08, 0.2]} p={[-1.05, 0.1, 0.55]} c="#f4f1ea" rad={0.03} />
    </Group>
  );
}

/** Interactive: three treadmills side by side, console end toward the back wall. */
export function Treadmills() {
  return (
    <Group>
      {[-1.35, 0, 1.35].map((x, i) => (
        <Group key={x} p={[x, 0, 0]}>
          <Round s={[0.78, 0.2, 1.8]} p={[0, 0.16, 0.1]} c="#1a1a1f" rad={0.04} o={{ rough: 0.5 }} />
          <Box s={[0.58, 0.02, 1.5]} p={[0, 0.275, 0.15]} c="#2e3238" o={{ rough: 0.9 }} shadow={false} />
          {Array.from({ length: 6 }, (_, k) => (
            <Box key={k} s={[0.58, 0.004, 0.02]} p={[0, 0.287, -0.5 + k * 0.28]} c="#4a5058" shadow={false} />
          ))}
          {[-0.36, 0.36].map((sx) => (
            <Group key={sx}>
              <Box s={[0.06, 1.1, 0.06]} p={[sx, 0.75, -0.7]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.5 }} />
              <Box s={[0.05, 0.05, 0.8]} p={[sx, 1.1, -0.35]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.5 }} />
              <Cyl rad={0.02} h={0.7} p={[sx, 1.12, -0.4]} r={[Math.PI / 2, 0, 0]} c="#c9c9cf" o={STEEL} shadow={false} />
            </Group>
          ))}
          <Round s={[0.62, 0.3, 0.1]} p={[0, 1.35, -0.72]} r={[0.35, 0, 0]} c="#1a1a1f" rad={0.03} />
          <Box s={[0.46, 0.18, 0.02]} p={[0, 1.36, -0.66]} r={[0.35, 0, 0]} c="#0f2030" o={{ emissive: i === 1 ? "#6fe3a8" : "#6fe3ff", glow: 1.1 }} shadow={false} />
          <Box s={[0.1, 0.02, 0.1]} p={[0.2, 1.22, -0.62]} c={AMBER} o={{ emissive: AMBER, glow: 0.8 }} shadow={false} />
        </Group>
      ))}
    </Group>
  );
}

function Dumbbells({ p, w = 3.8 }: { p: [number, number, number]; w?: number }) {
  const n = Math.floor(w / 0.32);
  return (
    <Group p={p}>
      <Box s={[w, 0.7, 0.5]} p={[0, 0.35, 0]} c="#2a2a2c" o={{ rough: 0.5, metal: 0.5 }} />
      {[0, 1].map((row) => (
        <Group key={row} p={[0, 0.46 + row * 0.34, 0.02 + row * 0.0]}>
          {Array.from({ length: n }, (_, i) => (
            <Group key={i} p={[-w / 2 + 0.2 + i * 0.32, 0, 0]}>
              <Cyl rad={0.012} h={0.18} r={[Math.PI / 2, 0, 0]} c="#c9c9cf" o={STEEL} shadow={false} />
              {[-0.1, 0.1].map((z) => <Box key={z} s={[0.085, 0.085, 0.07]} p={[0, 0, z]} c={row ? "#c0392b" : "#1a1a1f"} o={{ rough: 0.4, metal: 0.4 }} shadow={false} />)}
            </Group>
          ))}
        </Group>
      ))}
    </Group>
  );
}

function Bench({ p, rot = 0 }: { p: [number, number, number]; rot?: number }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Round s={[0.34, 0.1, 1.3]} p={[0, 0.44, 0]} c="#1a1a1f" rad={0.04} />
      <Box s={[0.08, 0.4, 1.0]} p={[0, 0.2, 0]} c="#2a2a2c" o={STEEL} />
      {[-0.32, 0.32].map((z) => <Box key={z} s={[0.5, 0.05, 0.08]} p={[0, 0.03, z * 1.6]} c="#2a2a2c" o={STEEL} shadow={false} />)}
      {/* uprights holding a bar */}
      {[-0.5, 0.5].map((x) => <Box key={x} s={[0.06, 1.1, 0.06]} p={[x, 0.55, -0.55]} c="#2a2a2c" o={STEEL} />)}
      <Barbell p={[0, 1.05, -0.55]} len={2.0} plates={2} />
    </Group>
  );
}

function SquatCage({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      {[[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.08, 2.3, 0.08]} p={[x!, 1.15, z!]} c="#2a2a2c" o={STEEL} />)}
      {[-0.6, 0.6].map((z) => <Box key={z} s={[1.5, 0.07, 0.08]} p={[0, 2.3, z]} c={AMBER} o={{ rough: 0.5 }} />)}
      <Barbell p={[0, 1.4, 0]} len={1.9} plates={2} />
      <Cyl rad={0.02} h={1.5} p={[0, 2.15, -0.6]} r={[0, 0, Math.PI / 2]} c="#c9c9cf" o={STEEL} shadow={false} />
    </Group>
  );
}

function HeavyBag({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Cyl rad={0.006} h={0.9} p={[0, 2.95, 0]} c="#2a2a2c" o={STEEL} shadow={false} />
      <Cyl rad={0.17} h={1.15} p={[0, 1.55, 0]} c="#9a2a22" o={{ rough: 0.6 }} />
      <Cyl rad={0.172} h={0.04} p={[0, 1.2, 0]} c="#1a1a1f" shadow={false} />
      <Cyl rad={0.172} h={0.04} p={[0, 1.9, 0]} c="#1a1a1f" shadow={false} />
    </Group>
  );
}

function PlyoBoxes({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      {[[0.4, 0.6, 0], [0.5, 0.5, 0.5], [0.3, 0.4, 0.7]].map(([h, w, x], i) => (
        <Box key={i} s={[w!, h!, 0.5]} p={[(x! - 0.4) * 1.3, h! / 2, 0]} c={["#2f6a64", "#c0392b", "#e1a53a"][i]!} o={{ rough: 0.7 }} />
      ))}
    </Group>
  );
}

function Bike({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Box s={[0.4, 0.06, 0.9]} p={[0, 0.03, 0]} c="#2a2a2c" o={STEEL} />
      <Box s={[0.07, 1.0, 0.07]} p={[0, 0.55, -0.1]} r={[0.1, 0, 0]} c="#2a2a2c" o={STEEL} />
      <Round s={[0.3, 0.08, 0.2]} p={[0, 1.05, 0.2]} c="#1a1a1f" rad={0.03} />
      <Round s={[0.26, 0.07, 0.3]} p={[0, 1.15, -0.25]} c="#1a1a1f" rad={0.03} />
      <Cyl rad={0.2} h={0.05} p={[0, 0.3, -0.3]} r={[0, 0, Math.PI / 2]} c="#c0392b" o={{ rough: 0.4 }} />
      <Box s={[0.2, 0.12, 0.04]} p={[0, 1.4, -0.3]} c="#0f2030" o={{ emissive: "#6fe3ff", glow: 0.9 }} shadow={false} />
    </Group>
  );
}

function Rower({ p, rot = 0 }: { p: [number, number, number]; rot?: number }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[0.1, 0.06, 1.9]} p={[0, 0.2, 0]} c="#2a2a2c" o={STEEL} />
      <Cyl rad={0.22} h={0.1} p={[0, 0.3, -0.85]} r={[0, 0, Math.PI / 2]} c="#1a1a1f" />
      <Box s={[0.28, 0.07, 0.3]} p={[0, 0.26, 0.2]} c="#c0392b" />
      <Box s={[0.2, 0.1, 0.04]} p={[0, 0.65, -0.95]} c="#0f2030" o={{ emissive: "#6fe3a8", glow: 0.9 }} shadow={false} />
    </Group>
  );
}

function Lockers({ p, rot = 0, n = 6 }: { p: [number, number, number]; rot?: number; n?: number }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <Group key={i} p={[0, 0, (i - (n - 1) / 2) * 0.36]}>
          <Box s={[0.4, 1.9, 0.34]} p={[0, 0.95, 0]} c={["#4a6a8a", "#2f6a64", "#8a4a3a"][i % 3]!} o={{ rough: 0.4, metal: 0.4 }} />
          <Box s={[0.012, 0.04, 0.2]} p={[0.2, 1.7, 0]} c="#1a1a1f" shadow={false} />
          <Box s={[0.012, 0.06, 0.04]} p={[0.2, 1.25, 0.08]} c="#c9c9cf" o={STEEL} shadow={false} />
        </Group>
      ))}
    </Group>
  );
}

export function GymDecor() {
  const signs = useMemo(() => ({ iron: neonMat("IRON GYM", "#f2b33d"), noPain: neonMat("NO PAIN NO GAIN", "#ff5a4a"), cardio: neonMat("CARDIO", "#6fe3ff") }), []);
  return (
    <Group>
      {/* mirrors and the neon sign along the back wall */}
      {[1.8, 4.1, 6.4].map((x) => (
        <Box key={x} s={[2.1, 1.45, 0.03]} p={[x, 1.3, 0.12]} c="#d6e6ee" o={{ metal: 0.9, rough: 0.06, opacity: 0.92 }} shadow={false} />
      ))}
      <Box s={[3.4, 0.85, 0.05]} p={[4.1, 2.5, 0.12]} c="#ffffff" m={signs.iron} shadow={false} />
      <Group p={[0.12, 2.5, 4.6]} r={[0, Math.PI / 2, 0]}>
        <Box s={[3.2, 0.8, 0.05]} c="#ffffff" m={signs.noPain} shadow={false} />
      </Group>
      <Box s={[1.5, 0.4, 0.05]} p={[12.0, 2.4, 0.12]} c="#ffffff" m={signs.cardio} shadow={false} />

      {/* weights floor kit */}
      <Dumbbells p={[3.3, 0, 0.5]} />
      <Bench p={[6.2, 0, 2.5]} rot={Math.PI / 2} />
      <Bench p={[6.2, 0, 5.2]} rot={Math.PI / 2} />
      <SquatCage p={[1.8, 0, 5.8]} />
      <PlyoBoxes p={[4.25, 0, 6.15]} />
      <HeavyBag p={[0.9, 0, 1.2]} />
      {/* kettlebells in a row */}
      {[0, 1, 2, 3].map((i) => (
        <Group key={i} p={[5.4 + i * 0.28, 0, 6.9]}>
          <Ball rad={0.1} p={[0, 0.1, 0]} c="#1a1a1f" o={{ rough: 0.4, metal: 0.5 }} />
          <Cyl rad={0.02} h={0.1} p={[0, 0.24, 0]} c="#1a1a1f" shadow={false} />
        </Group>
      ))}

      {/* cardio zone: bikes, a rower and a stretching mat with foam rollers */}
      {[9.6, 10.6, 11.6].map((x) => <Bike key={x} p={[x, 0, 3.55]} />)}
      <Rower p={[14.4, 0, 3.9]} />
      {[0, 1].map((i) => <Cyl key={i} rad={0.08} h={0.5} p={[13.1, 0.08, 4.8 + i * 0.5]} r={[0, 0, Math.PI / 2]} c="#2f6a64" o={{ rough: 0.8 }} />)}
      {[10.0, 11.4].map((x) => <Round key={x} s={[0.5, 0.04, 1.4]} p={[x, 0.05, 5.5]} c="#3a4252" rad={0.02} o={{ rough: 0.9 }} shadow={false} />)}

      {/* reception desk, water cooler and a leaflet rack */}
      <Group p={[2.1, 0, 8.2]}>
        <Box s={[3.2, 1.05, 1.0]} p={[0, 0.525, 0]} c="#2a2f36" o={{ rough: 0.5 }} />
        <Box s={[3.3, 0.06, 1.1]} p={[0, 1.07, 0]} c={AMBER} o={{ rough: 0.4 }} />
        <Box s={[0.4, 0.28, 0.04]} p={[-0.6, 1.25, 0.0]} r={[-0.2, 0, 0]} c="#0f2030" o={{ emissive: "#6fe3ff", glow: 0.8 }} shadow={false} />
        <Box s={[3.2, 0.1, 0.02]} p={[0, 0.7, 0.51]} c={AMBER} o={{ emissive: AMBER, glow: 0.3 }} shadow={false} />
      </Group>
      <Group p={[4.5, 0, 8.9]}>
        <Box s={[0.34, 0.9, 0.34]} p={[0, 0.45, 0]} c="#e9eef2" o={{ rough: 0.4 }} />
        <Cyl rad={0.14} h={0.4} p={[0, 1.1, 0]} c="#9fd0e6" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
      </Group>

      {/* changing room: lockers, bench and a shower stall behind the door */}
      <Lockers p={[14.7, 0, 8.1]} rot={0} n={6} />
      <Group p={[13.25, 0, 8.35]}>
        <Round s={[1.2, 0.08, 0.4]} p={[0, 0.45, 0]} c="#8a6a45" rad={0.02} />
        {[-0.5, 0.5].map((x) => <Box key={x} s={[0.06, 0.45, 0.3]} p={[x, 0.22, 0]} c="#2a2a2c" o={STEEL} />)}
      </Group>
      <Group p={[12.4, 0, 9.0]}>
        <Box s={[0.9, 0.05, 0.7]} p={[0, 0.03, 0]} c="#cfe3ee" o={{ rough: 0.2 }} shadow={false} />
        <Box s={[0.02, 2.0, 0.7]} p={[0.46, 1.0, 0]} c="#cfe3ee" o={{ opacity: 0.3, rough: 0.05 }} shadow={false} />
        <Cyl rad={0.01} h={0.5} p={[-0.3, 2.0, -0.28]} c="#c9c9cf" o={STEEL} shadow={false} />
        <Cyl rad={0.1} h={0.02} p={[-0.3, 1.74, -0.2]} c="#c9c9cf" o={STEEL} shadow={false} />
      </Group>

      {/* exposed steel trusses and hanging strip lights */}
      {[2.2, 6.0, 9.8, 13.4].map((x) => (
        <Group key={x}>
          <Box s={[0.14, 0.24, 9.2]} p={[x, 3.45, 4.7]} c="#2a2f36" o={STEEL} shadow={false} />
        </Group>
      ))}
      {[[3.5, 3.0], [3.5, 6.2], [10.8, 3.0], [10.8, 6.2]].map(([x, z]) => (
        <Group key={`${x}${z}`} p={[x!, 3.1, z!]}>
          <Box s={[0.03, 0.3, 0.03]} p={[0.9, 0.2, 0]} c="#2a2a2c" shadow={false} />
          <Box s={[0.03, 0.3, 0.03]} p={[-0.9, 0.2, 0]} c="#2a2a2c" shadow={false} />
          <Box s={[2.0, 0.06, 0.16]} c="#f6fbff" o={{ emissive: "#e8f2ff", glow: 1.6 }} shadow={false} />
        </Group>
      ))}
      {/* entrance mat */}
      <Box s={[1.4, 0.014, 0.8]} p={[6.7, 0.03, 8.5]} c="#2a2f36" o={{ rough: 1 }} shadow={false} />
    </Group>
  );
}