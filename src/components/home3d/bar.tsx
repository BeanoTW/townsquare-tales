import { useMemo } from "react";
import * as THREE from "three";
import { Ball, Box, Cone, Cyl, Group, Round, mat } from "./primitives";
import { dartboardTexture, neonTexture } from "./textures";

/**
 * The Tipsy Stick. A long timber bar with a bottle-lined back bar on the brick wall, pub tables and a booth on
 * the left, and on the right a lit dance floor, DJ booth and a darts corner. The bar counter (with its stools),
 * the dance floor and the dartboard are the three interactive objects; everything else is clear of the aisles.
 */
const TIMBER = "#3a2418";
const TOP = "#6a4428";
const BRASS = { rough: 0.3, metal: 0.85 };
const GOLD = "#c9a24a";

const neonMat = (text: string, colour: string) => {
  const t = neonTexture(text, colour);
  return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.2, roughness: 0.5 });
};
const BOTTLES = ["#2a5a3a", "#8a4a1a", "#c0392b", "#1a3a6a", "#e9c46a", "#5a2a6a", "#cfe3ee", "#3a2a1a"];

function BarStool({ p, c = "#a02a2a" }: { p: [number, number, number]; c?: string }) {
  return (
    <Group p={p}>
      <Cyl rad={0.02} h={0.68} p={[0, 0.34, 0]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} />
      <Cyl rad={0.17} h={0.025} p={[0, 0.012, 0]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} />
      <Cyl rad={0.11} h={0.012} p={[0, 0.3, 0]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} shadow={false} />
      <Round s={[0.36, 0.09, 0.36]} p={[0, 0.72, 0]} c={c} rad={0.04} />
    </Group>
  );
}

/** Interactive: the bar itself with taps, till, glasses, a brass foot rail and six stools. */
export function BarCounter() {
  return (
    <Group>
      <Box s={[6.2, 1.0, 0.8]} p={[0, 0.5, 0.0]} c={TIMBER} o={{ rough: 0.55 }} />
      {/* panelled front with brass kick-plate and foot rail */}
      {Array.from({ length: 10 }, (_, i) => (
        <Box key={i} s={[0.52, 0.62, 0.02]} p={[-2.79 + i * 0.62, 0.52, 0.41]} c="#4a3020" o={{ rough: 0.45 }} shadow={false} />
      ))}
      <Box s={[6.2, 0.06, 0.04]} p={[0, 0.08, 0.44]} c={GOLD} o={BRASS} shadow={false} />
      <Cyl rad={0.025} h={6.0} p={[0, 0.22, 0.62]} r={[0, 0, Math.PI / 2]} c={GOLD} o={BRASS} />
      {/* leather-padded arm rail and the bar top */}
      <Round s={[6.3, 0.07, 0.95]} p={[0, 1.04, 0.05]} c={TOP} rad={0.03} o={{ rough: 0.2 }} />
      <Round s={[6.0, 0.06, 0.2]} p={[0, 1.1, 0.35]} c="#2a1a14" rad={0.025} o={{ rough: 0.5 }} shadow={false} />
      {/* beer taps and drip tray */}
      <Box s={[0.9, 0.05, 0.3]} p={[-1.4, 1.1, -0.1]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} shadow={false} />
      {[-1.7, -1.5, -1.3, -1.1].map((x, i) => (
        <Group key={x} p={[x, 1.07, -0.12]}>
          <Cyl rad={0.02} h={0.3} p={[0, 0.17, 0]} c={GOLD} o={BRASS} />
          <Round s={[0.05, 0.14, 0.05]} p={[0, 0.4, 0]} c={["#c0392b", "#2f7f79", "#e9c46a", "#1a1a1f"][i]!} rad={0.015} />
        </Group>
      ))}
      {/* till */}
      <Group p={[2.5, 1.07, -0.05]}>
        <Box s={[0.38, 0.2, 0.34]} p={[0, 0.1, 0]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.5 }} />
        <Box s={[0.3, 0.12, 0.04]} p={[0, 0.3, -0.08]} r={[-0.4, 0, 0]} c="#0f1a14" o={{ emissive: "#6fe3a8", glow: 0.6 }} shadow={false} />
      </Group>
      {/* glasses and a bowl of nuts */}
      {[[0.2, 0.2], [0.55, 0.28], [-0.4, 0.3], [1.3, 0.25], [1.9, 0.3]].map(([x, z], i) => (
        <Cyl key={i} rad={0.035} h={0.12} p={[x!, 1.14, z!]} c="#dfeef5" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
      ))}
      <Round s={[0.2, 0.06, 0.2]} p={[-2.4, 1.11, 0.2]} c="#8a5a30" rad={0.03} />
      {/* pendant lamps along the bar */}
      {[-1.9, 0, 1.9].map((x) => (
        <Group key={x} p={[x, 2.15, 0.1]}>
          <Cyl rad={0.006} h={0.8} p={[0, 0.5, 0]} c="#1a1a1f" shadow={false} />
          <Cone rad={0.2} h={0.22} p={[0, 0, 0]} r={[Math.PI, 0, 0]} c="#2a1a14" o={{ rough: 0.5 }} />
          <Ball rad={0.07} p={[0, -0.08, 0]} c="#fff4d2" o={{ emissive: "#ffd98a", glow: 2 }} shadow={false} />
        </Group>
      ))}
      {/* stools in front, where the regulars sit */}
      {[-2.5, -1.5, -0.5, 0.5, 1.5, 2.5].map((x) => (
        <BarStool key={x} p={[x, 0, 0.85]} c={Math.abs(x) > 2 ? "#2f7f79" : "#a02a2a"} />
      ))}
    </Group>
  );
}

/** Interactive: a grid of coloured light tiles. Walkable: it is flat. */
export function DanceFloor() {
  const cols = ["#e05aa0", "#3aa6c9", "#e9c46a", "#9a5bff"];
  return (
    <Group>
      <Box s={[3.1, 0.03, 4.1]} p={[0, 0.03, 0]} c="#120a1e" o={{ rough: 0.2 }} shadow={false} />
      {Array.from({ length: 4 }, (_, i) =>
        Array.from({ length: 5 }, (_, j) => (
          <Box key={`${i}${j}`} s={[0.66, 0.012, 0.66]} p={[-1.1 + i * 0.73, 0.05, -1.5 + j * 0.75]} c={cols[(i + j) % 4]!} o={{ emissive: cols[(i + j) % 4]!, glow: 0.55, rough: 0.3 }} shadow={false} />
        )),
      )}
      {/* light strip around the edge */}
      <Box s={[3.2, 0.02, 0.05]} p={[0, 0.045, 2.08]} c="#ff4fd8" o={{ emissive: "#ff4fd8", glow: 1.5 }} shadow={false} />
      <Box s={[3.2, 0.02, 0.05]} p={[0, 0.045, -2.08]} c="#6fe3ff" o={{ emissive: "#6fe3ff", glow: 1.5 }} shadow={false} />
    </Group>
  );
}

/** Interactive: a cabinet-mounted board on the back wall, with scoreboard, spot light and darts in the board. */
export function Dartboard() {
  const face = useMemo(() => dartboardTexture(), []);
  return (
    <Group>
      <Box s={[0.9, 1.0, 0.06]} p={[0, 1.75, 0.0]} c="#3a2418" o={{ rough: 0.5 }} />
      <Box s={[0.82, 0.92, 0.02]} p={[0, 1.75, 0.04]} c="#1a2a22" o={{ rough: 0.9 }} shadow={false} />
      <Cyl rad={0.23} h={0.05} p={[0, 1.75, 0.07]} r={[Math.PI / 2, 0, 0]} c="#ffffff" m={mat("#ffffff", { rough: 0.9, map: face })} />
      {[[0.05, 1.82], [-0.08, 1.7], [0.12, 1.68]].map(([x, y], i) => (
        <Group key={i} p={[x!, y!, 0.12]}>
          <Cyl rad={0.006} h={0.14} p={[0, 0, 0.05]} r={[Math.PI / 2, 0, 0]} c="#c9c9cf" o={{ metal: 0.9, rough: 0.2 }} shadow={false} />
          <Box s={[0.04, 0.04, 0.012]} p={[0, 0, 0.11]} c={["#c0392b", "#2f7f79", "#e9c46a"][i]!} shadow={false} />
        </Group>
      ))}
      <Box s={[0.7, 0.05, 0.14]} p={[0, 2.35, 0.12]} c="#2a2a2c" />
      <Box s={[0.5, 0.02, 0.1]} p={[0, 2.31, 0.15]} c="#fff4d2" o={{ emissive: "#fff0c8", glow: 1.6 }} shadow={false} />
      {/* chalk scoreboard to the side */}
      <Box s={[0.5, 0.4, 0.04]} p={[0.9, 1.6, 0.0]} c="#2a3a32" o={{ rough: 1 }} />
      <Box s={[0.4, 0.004, 0.012]} p={[0.9, 1.62, 0.03]} c="#f4f1ea" shadow={false} />
    </Group>
  );
}

function PubTable({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Cyl rad={0.04} h={0.74} p={[0, 0.37, 0]} c="#1a1a1f" />
      <Cyl rad={0.2} h={0.03} p={[0, 0.015, 0]} c="#1a1a1f" />
      <Cyl rad={0.42} h={0.05} p={[0, 0.76, 0]} c={TOP} o={{ rough: 0.3 }} />
      <Cyl rad={0.04} h={0.11} p={[0.1, 0.85, 0.05]} c="#dfeef5" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
      <Cyl rad={0.1} h={0.012} p={[-0.12, 0.8, -0.1]} c="#f4f1ea" shadow={false} />
      {[0, 1, 2, 3].map((k) => {
        const a = k * (Math.PI / 2) + 0.4;
        return <BarStool key={k} p={[Math.sin(a) * 0.72, 0, Math.cos(a) * 0.72]} c="#4a3a5a" />;
      }).map((s, i) => <Group key={i} p={[0, -0.22, 0]}>{s}</Group>)}
    </Group>
  );
}

export function BarDecor() {
  const signs = useMemo(() => ({ main: neonMat("TIPSY STICK", "#ff4f9a"), cocktails: neonMat("COCKTAILS", "#6fe3ff"), open: neonMat("OPEN", "#6fe3a8"), dj: neonMat("DJ", "#9a5bff") }), []);
  const rng = useMemo(() => {
    let a = 7;
    return () => ((a = (a * 1664525 + 1013904223) >>> 0) / 4294967296);
  }, []);
  const shelf = useMemo(() => [0, 1, 2].map((row) => Array.from({ length: 22 }, (_, i) => ({ c: BOTTLES[Math.floor(rng() * BOTTLES.length)]!, h: 0.2 + rng() * 0.12, key: `${row}${i}` }))), [rng]);
  return (
    <Group>
      {/* back bar: fridges, three shelves of bottles and a long mirror under the neon */}
      <Group p={[4.0, 0, 0.34]}>
        <Box s={[6.4, 0.9, 0.5]} p={[0, 0.45, 0]} c="#2a1a14" o={{ rough: 0.5 }} />
        {[-2.4, -0.8, 0.8, 2.4].map((x) => (
          <Box key={x} s={[1.4, 0.7, 0.02]} p={[x, 0.45, 0.26]} c="#9fbccd" o={{ opacity: 0.45, rough: 0.05 }} shadow={false} />
        ))}
        <Box s={[6.4, 0.05, 0.54]} p={[0, 0.92, 0]} c={TOP} o={{ rough: 0.3 }} />
        <Box s={[6.2, 1.3, 0.02]} p={[0, 1.75, -0.2]} c="#cfe3ee" o={{ metal: 0.85, rough: 0.08, opacity: 0.9 }} shadow={false} />
        {shelf.map((row, r) => (
          <Group key={r} p={[0, 1.2 + r * 0.45, -0.02]}>
            <Box s={[6.2, 0.03, 0.22]} c="#3a2418" shadow={false} />
            {row.map((b, i) => (
              <Cyl key={b.key} rad={0.035} h={b.h} p={[-3.0 + i * 0.28, 0.02 + b.h / 2, 0]} c={b.c} o={{ rough: 0.15, ...(r === 2 ? { emissive: b.c, glow: 0.12 } : {}) }} shadow={false} />
            ))}
          </Group>
        ))}
      </Group>
      <Box s={[3.2, 0.8, 0.05]} p={[3.8, 2.72, 0.13]} c="#ffffff" m={signs.main} shadow={false} />
      <Box s={[1.5, 0.38, 0.05]} p={[6.7, 2.35, 0.13]} c="#ffffff" m={signs.cocktails} shadow={false} />

      {/* pub tables and the booth along the left wall */}
      <PubTable p={[3.3, 0, 5.9]} />
      <PubTable p={[5.5, 0, 5.9]} />
      <Group p={[0.45, 0, 5.7]}>
        <Box s={[0.5, 0.45, 3.4]} p={[0, 0.225, 0]} c="#6a1f2a" o={{ rough: 0.8 }} />
        <Box s={[0.14, 0.7, 3.4]} p={[-0.2, 0.75, 0]} c="#5a1a24" o={{ rough: 0.8 }} />
        {Array.from({ length: 5 }, (_, i) => (
          <Box key={i} s={[0.02, 0.5, 0.02]} p={[-0.12, 0.8, -1.4 + i * 0.7]} c="#2a0a10" shadow={false} />
        ))}
        <Cyl rad={0.04} h={0.7} p={[0.78, 0.35, 0]} c="#1a1a1f" />
        <Round s={[0.7, 0.05, 1.2]} p={[0.78, 0.72, 0]} c={TOP} rad={0.02} o={{ rough: 0.3 }} />
        <Cyl rad={0.04} h={0.11} p={[0.8, 0.8, 0.2]} c="#dfeef5" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
      </Group>
      {/* jukebox on the left wall */}
      <Group p={[0.36, 0, 1.6]} r={[0, Math.PI / 2, 0]}>
        <Round s={[0.8, 1.4, 0.5]} p={[0, 0.7, 0]} c="#b0342a" rad={0.08} o={{ rough: 0.3 }} />
        <Box s={[0.6, 0.5, 0.04]} p={[0, 1.0, 0.25]} c="#fff4d2" o={{ emissive: "#ffd98a", glow: 1.2 }} shadow={false} />
        <Box s={[0.5, 0.1, 0.04]} p={[0, 0.55, 0.25]} c="#e9c46a" o={{ emissive: "#e9c46a", glow: 0.9 }} shadow={false} />
        <Cyl rad={0.12} h={0.02} p={[0, 1.4, 0.0]} r={[Math.PI / 2, 0, 0]} c="#6fe3ff" o={{ emissive: "#6fe3ff", glow: 1 }} shadow={false} />
      </Group>
      {/* neon OPEN in the front window */}
      <Group p={[9.1, 1.85, 8.05]} r={[0, Math.PI, 0]}>
        <Box s={[0.7, 0.3, 0.03]} c="#ffffff" m={signs.open} shadow={false} />
      </Group>
      {/* barrel and a doormat at the entrance */}
      <Group p={[7.33, 0, 7.2]}>
        <Cyl rad={0.28} h={0.7} p={[0, 0.35, 0]} c="#7a5a3a" o={{ rough: 0.8 }} />
        {[0.15, 0.55].map((y) => <Cyl key={y} rad={0.292} h={0.04} p={[0, y, 0]} c="#2a2a2c" o={{ metal: 0.6 }} shadow={false} />)}
      </Group>
      <Box s={[1.1, 0.014, 0.7]} p={[5.6, 0.028, 7.8]} c="#4a2a1a" o={{ rough: 1 }} shadow={false} />

      {/* DJ booth with speaker stacks, and a mirror ball over the dance floor */}
      <Group p={[11.55, 0, 4.9]}>
        <Box s={[0.7, 1.05, 2.6]} p={[0, 0.525, 0]} c="#15101e" o={{ rough: 0.5 }} />
        <Box s={[0.5, 0.05, 2.4]} p={[-0.02, 1.07, 0]} c="#2a2a2c" o={{ rough: 0.3, metal: 0.6 }} />
        {[-0.5, 0.5].map((z) => (
          <Cyl key={z} rad={0.19} h={0.04} p={[-0.02, 1.12, z]} c="#1a1a1f" o={{ rough: 0.3, metal: 0.7 }} shadow={false} />
        ))}
        <Box s={[0.2, 0.02, 0.5]} p={[-0.1, 1.11, 0]} c="#6fe3ff" o={{ emissive: "#6fe3ff", glow: 1 }} shadow={false} />
        <Box s={[0.04, 0.5, 1.4]} p={[0.37, 1.45, 0]} c="#ffffff" m={signs.dj} shadow={false} />
      </Group>
      {[3.0, 6.8].map((z) => (
        <Group key={z} p={[11.6, 0, z]}>
          <Box s={[0.5, 1.5, 0.55]} p={[0, 0.75, 0]} c="#1a1a1f" o={{ rough: 0.7 }} />
          <Cyl rad={0.17} h={0.05} p={[-0.26, 0.45, 0]} r={[0, 0, Math.PI / 2]} c="#2a2a2c" shadow={false} />
          <Cyl rad={0.1} h={0.05} p={[-0.26, 1.1, 0]} r={[0, 0, Math.PI / 2]} c="#2a2a2c" shadow={false} />
        </Group>
      ))}
      <Group p={[9.45, 2.55, 5.45]}>
        <Cyl rad={0.006} h={0.9} p={[0, 0.5, 0]} c="#1a1a1f" shadow={false} />
        <Ball rad={0.32} c="#dfe6ef" o={{ metal: 0.95, rough: 0.12, emissive: "#9a8fd0", glow: 0.35 }} shadow={false} />
      </Group>

      {/* darts corner: the throw line on the floor and a bar-stool for waiting */}
      <Box s={[0.9, 0.012, 0.05]} p={[10.2, 0.03, 2.75]} c="#f4f1ea" shadow={false} />
      <BarStool p={[8.4, 0, 1.0]} c="#2f7f79" />
      <Group p={[8.4, 0.85, 1.0]}>
        <Cyl rad={0.035} h={0.11} c="#dfeef5" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
      </Group>
      {/* string lights across the back wall */}
      {Array.from({ length: 16 }, (_, i) => (
        <Ball key={i} rad={0.035} p={[0.8 + i * 0.7, 2.68 - Math.sin((i / 15) * Math.PI) * -0.0 - (i % 2) * 0.08, 0.1]} c="#fff4d2" o={{ emissive: ["#ffd98a", "#ff9ac4", "#9ae0ff"][i % 3]!, glow: 1.4 }} shadow={false} />
      ))}
    </Group>
  );
}