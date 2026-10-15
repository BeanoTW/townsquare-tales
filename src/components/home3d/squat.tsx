import { Ball, Box, Cone, Cyl, Group, Round, mat } from "./primitives";
import { cardboardTexture } from "./textures";

/**
 * The Cardboard Box / Squat: a shelter built from scavenged material. Poverty is shown through physical
 * condition: patched walls, rotting boards, stains, rubbish, makeshift furniture and a single bare bulb.
 * Models are drawn around their own footprint centre, front toward +z, like the rest of the furniture.
 */
const TIMBER = "#6b5438";
const TIMBER_L = "#9a7b55";
const RUST = "#8a5a3a";
const STEEL = "#8a9096";
const CRATE = "#2f5d8a";
const CRATE_D = "#1f3f60";
const GRIME = "#2a2622";

const card = (n: number) => mat("#ffffff", { rough: 1, map: cardboardTexture(n) });

/** A plastic milk crate: open slats and a thicker rim. */
function Crate({ p, r, c = CRATE, h = 0.28, w = 0.34, d = 0.34 }: { p: [number, number, number]; r?: [number, number, number]; c?: string; h?: number; w?: number; d?: number }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[w, 0.04, d]} p={[0, 0.02, 0]} c={c} o={{ rough: 0.7 }} />
      {[-1, 1].map((sx) => (
        <Box key={`x${sx}`} s={[0.03, h, d]} p={[sx * (w / 2 - 0.015), h / 2, 0]} c={c} o={{ rough: 0.7 }} />
      ))}
      {[-1, 1].map((sz) => (
        <Box key={`z${sz}`} s={[w, h, 0.03]} p={[0, h / 2, sz * (d / 2 - 0.015)]} c={c} o={{ rough: 0.7 }} />
      ))}
      {[0.1, 0.19].map((y) => (
        <Box key={y} s={[w - 0.02, 0.03, 0.035]} p={[0, y, d / 2 - 0.012]} c={CRATE_D} shadow={false} />
      ))}
      <Box s={[w + 0.02, 0.025, d + 0.02]} p={[0, h, 0]} c={c} o={{ rough: 0.6 }} shadow={false} />
    </Group>
  );
}

/** A timber pallet: three bearers and a row of top slats. */
function Pallet({ w = 1.5, d = 2.0, p = [0, 0, 0] as [number, number, number] }: { w?: number; d?: number; p?: [number, number, number] }) {
  return (
    <Group p={p}>
      {[-1, 0, 1].map((i) => (
        <Box key={i} s={[0.09, 0.09, d]} p={[(i * (w - 0.1)) / 2, 0.045, 0]} c={TIMBER} o={{ rough: 1 }} />
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <Box key={i} s={[w, 0.022, 0.2]} p={[0, 0.1, -d / 2 + 0.1 + (i * (d - 0.2)) / 6]} r={[0, (i % 3 - 1) * 0.012, 0]} c={i % 2 ? TIMBER_L : "#80663f"} o={{ rough: 1 }} />
      ))}
    </Group>
  );
}

/** A filthy mattress on flattened cardboard, a sleeping bag and a rolled jacket: the "bed" before you buy one. */
export function SquatMattress() {
  return (
    <Group>
      <Box s={[1.1, 0.014, 2.1]} p={[0, 0.008, 0]} r={[0, 0.04, 0]} m={card(2)} shadow={false} />
      <Box s={[0.9, 0.012, 1.1]} p={[0.15, 0.02, 0.6]} r={[0, -0.35, 0]} m={card(1)} shadow={false} />
      <Round s={[0.92, 0.13, 1.85]} p={[0, 0.085, 0]} c="#8d8a78" rad={0.045} />
      {/* ticking stripes, stains and a torn corner showing yellow foam */}
      {[-0.3, -0.1, 0.1, 0.3].map((x) => (
        <Box key={x} s={[0.02, 0.003, 1.8]} p={[x, 0.152, 0]} c="#6f6c5c" shadow={false} />
      ))}
      <Box s={[0.4, 0.004, 0.5]} p={[0.12, 0.154, 0.25]} r={[0, 0.5, 0]} c="#5d5240" o={{ opacity: 0.55 }} shadow={false} />
      <Box s={[0.26, 0.004, 0.3]} p={[-0.2, 0.154, -0.5]} r={[0, -0.3, 0]} c="#4a3f33" o={{ opacity: 0.5 }} shadow={false} />
      <Round s={[0.3, 0.1, 0.26]} p={[0.28, 0.1, 0.84]} r={[0, 0.3, 0]} c="#d8c15a" rad={0.04} />
      {/* sleeping bag, half unzipped, and a balled-up coat for a pillow */}
      <Round s={[0.78, 0.14, 1.15]} p={[0, 0.2, 0.3]} r={[0, 0.04, 0]} c="#47576a" rad={0.06} />
      <Box s={[0.012, 0.01, 1.05]} p={[0.1, 0.275, 0.3]} c="#a9b3bd" shadow={false} />
      <Round s={[0.42, 0.14, 0.3]} p={[-0.04, 0.2, -0.72]} r={[0, 0.2, 0]} c="#6d4f3a" rad={0.06} />
    </Group>
  );
}

/** Two pallets, a thin mattress and a plaid blanket: the owned bed in the squat. */
export function PalletBed() {
  return (
    <Group>
      <Pallet w={1.5} d={1.0} p={[0, 0, -0.5]} />
      <Pallet w={1.5} d={1.0} p={[0, 0, 0.5]} />
      <Pallet w={1.5} d={1.0} p={[0, 0.115, -0.5]} />
      <Pallet w={1.5} d={1.0} p={[0, 0.115, 0.5]} />
      <Round s={[1.4, 0.16, 1.92]} p={[0, 0.34, 0]} c="#a7a38f" rad={0.05} />
      {[-0.35, 0, 0.35].map((x) => (
        <Box key={x} s={[0.02, 0.003, 1.85]} p={[x, 0.42, 0]} c="#85826f" shadow={false} />
      ))}
      <Round s={[1.38, 0.07, 1.05]} p={[0, 0.46, 0.42]} c="#a6523f" rad={0.03} />
      {[-0.4, -0.1, 0.2, 0.5].map((x, i) => (
        <Box key={x} s={[0.04, 0.004, 1.0]} p={[x, 0.5, 0.42]} c={i % 2 ? "#e4cf9a" : "#5a2a22"} shadow={false} />
      ))}
      <Round s={[0.6, 0.12, 0.34]} p={[0, 0.5, -0.75]} c="#d9d1bd" rad={0.05} />
    </Group>
  );
}

/** A camping stove on milk crates, with a billy can, tins and a gas canister. */
export function CampStove() {
  return (
    <Group>
      <Crate p={[-0.45, 0, 0]} />
      <Crate p={[0.45, 0, 0]} c="#7a3a2a" />
      <Box s={[1.25, 0.04, 0.5]} p={[0, 0.34, 0]} r={[0, 0, 0.01]} c={TIMBER_L} o={{ rough: 1 }} />
      <Box s={[0.4, 0.012, 0.4]} p={[0.02, 0.365, 0]} c="#2c2f33" o={{ rough: 0.6, metal: 0.4 }} />
      {/* stove, flame and billy can */}
      <Cyl rad={0.1} h={0.05} p={[-0.1, 0.38, 0]} c={STEEL} o={{ rough: 0.5, metal: 0.6 }} />
      <Cyl rad={0.075} h={0.012} p={[-0.1, 0.41, 0]} c="#59b7ff" o={{ emissive: "#59b7ff", glow: 1.6 }} shadow={false} />
      <Cyl rad={0.095} h={0.15} p={[-0.1, 0.49, 0]} c="#3a3d40" o={{ rough: 0.6, metal: 0.5 }} />
      <Box s={[0.16, 0.012, 0.012]} p={[-0.1, 0.57, 0]} c={STEEL} shadow={false} />
      <Cyl rad={0.06} h={0.14} p={[0.22, 0.45, 0.05]} c="#b53a30" o={{ rough: 0.5 }} />
      {/* frying pan and tins */}
      <Cyl rad={0.13} h={0.03} p={[0.3, 0.4, -0.08]} c="#26282c" o={{ rough: 0.5, metal: 0.5 }} />
      <Box s={[0.2, 0.015, 0.03]} p={[0.48, 0.4, -0.08]} c="#26282c" />
      {[0, 1, 2].map((i) => (
        <Cyl key={i} rad={0.035} h={0.1} p={[-0.42 + i * 0.08, 0.41, 0.15]} c={["#b8442f", "#c9a24a", "#6b8f4a"][i]!} o={{ rough: 0.4, metal: 0.5 }} />
      ))}
      {/* jerrycan and bottled water by the leg */}
      <Box s={[0.2, 0.3, 0.12]} p={[-0.7, 0.15, 0.2]} r={[0, 0.3, 0]} c="#6f7a3a" o={{ rough: 0.6 }} />
      <Cyl rad={0.045} h={0.28} p={[0.68, 0.14, 0.2]} c="#cfe5ef" o={{ opacity: 0.55, rough: 0.2 }} shadow={false} />
    </Group>
  );
}

/** An old door laid across two crates: the study desk. */
export function CrateDesk() {
  return (
    <Group>
      <Crate p={[-0.4, 0, 0]} c="#8a4a2a" h={0.3} />
      <Crate p={[0.4, 0, 0]} c="#8a4a2a" h={0.3} />
      <Box s={[1.1, 0.04, 0.58]} p={[0, 0.32, 0]} r={[0, 0.02, 0.012]} c="#b9a98a" o={{ rough: 0.9 }} />
      <Box s={[1.05, 0.01, 0.015]} p={[0, 0.345, 0.12]} c="#8f7f60" shadow={false} />
      <Cyl rad={0.02} h={0.02} p={[0.45, 0.36, 0.05]} c="#8f7f60" shadow={false} />
      {/* papers, a tin pen pot and a candle stub in a bottle */}
      <Box s={[0.28, 0.01, 0.2]} p={[-0.1, 0.347, 0.05]} r={[0, 0.3, 0]} c="#e9e3d0" shadow={false} />
      <Box s={[0.22, 0.012, 0.17]} p={[-0.06, 0.357, 0.03]} r={[0, -0.2, 0]} c="#d8d1bb" shadow={false} />
      <Cyl rad={0.035} h={0.1} p={[-0.42, 0.39, -0.12]} c="#b8442f" o={{ rough: 0.4, metal: 0.4 }} />
      <Cyl rad={0.03} h={0.2} p={[0.32, 0.44, -0.1]} c="#2f6a4a" o={{ opacity: 0.7, rough: 0.2 }} />
      <Cyl rad={0.014} h={0.07} p={[0.32, 0.575, -0.1]} c="#efe6c8" />
      <Ball rad={0.014} p={[0.32, 0.62, -0.1]} sc={[0.012, 0.022, 0.012]} c="#ffcf6a" o={{ emissive: "#ffb347", glow: 2 }} shadow={false} />
      {/* milk-crate stool */}
      <Crate p={[0.05, 0, 0.55]} r={[0, 0.4, 0]} c="#2f5d8a" h={0.3} w={0.3} d={0.3} />
      <Round s={[0.3, 0.05, 0.3]} p={[0.05, 0.33, 0.55]} r={[0, 0.4, 0]} c="#7a6a50" rad={0.02} />
    </Group>
  );
}

/** Home gym made of paint tins full of concrete, a scaffold pole and bricks. */
export function ScrapWeights() {
  return (
    <Group>
      {/* bench: a plank on breeze blocks */}
      <Box s={[0.42, 0.2, 0.2]} p={[-0.4, 0.1, 0.22]} c="#a39d90" o={{ rough: 1 }} />
      <Box s={[0.42, 0.2, 0.2]} p={[0.0, 0.1, 0.22]} c="#a39d90" o={{ rough: 1 }} />
      <Box s={[1.1, 0.04, 0.3]} p={[-0.2, 0.22, 0.22]} r={[0, 0, -0.01]} c="#9a7b55" o={{ rough: 1 }} />
      {/* bar resting on two stacks of bricks, tins on the ends */}
      {[-0.5, 0.5].map((x) => (
        <Group key={x} p={[x, 0, -0.22]}>
          <Box s={[0.22, 0.07, 0.1]} p={[0, 0.035, 0]} c="#9a4a32" o={{ rough: 1 }} />
          <Box s={[0.22, 0.07, 0.1]} p={[0.01, 0.105, 0]} r={[0, 0.08, 0]} c="#a9553a" o={{ rough: 1 }} />
          <Box s={[0.22, 0.07, 0.1]} p={[-0.01, 0.175, 0]} r={[0, -0.05, 0]} c="#8f432c" o={{ rough: 1 }} />
        </Group>
      ))}
      <Cyl rad={0.017} h={1.1} p={[0, 0.235, -0.22]} r={[0, 0, Math.PI / 2]} c={STEEL} o={{ rough: 0.4, metal: 0.8 }} />
      {[-0.46, 0.46].map((x) => (
        <Cyl key={x} rad={0.1} h={0.15} p={[x, 0.235, -0.22]} r={[0, 0, Math.PI / 2]} c="#b9b4a4" o={{ rough: 1 }} />
      ))}
      {[-0.56, 0.56].map((x) => (
        <Cyl key={x} rad={0.104} h={0.012} p={[x, 0.235, -0.22]} r={[0, 0, Math.PI / 2]} c="#b53a30" o={{ rough: 0.5, metal: 0.4 }} shadow={false} />
      ))}
      {/* a loose dumbbell and a water-bottle weight */}
      <Cyl rad={0.012} h={0.26} p={[0.45, 0.04, 0.25]} r={[0, 0.4, Math.PI / 2]} c={STEEL} o={{ metal: 0.7, rough: 0.4 }} />
      <Cyl rad={0.06} h={0.06} p={[0.38, 0.06, 0.28]} r={[0, 0.4, Math.PI / 2]} c="#b9b4a4" o={{ rough: 1 }} />
      <Cyl rad={0.06} h={0.06} p={[0.52, 0.06, 0.22]} r={[0, 0.4, Math.PI / 2]} c="#b9b4a4" o={{ rough: 1 }} />
      <Cyl rad={0.04} h={0.24} p={[0.2, 0.12, 0.3]} c="#9fc4d6" o={{ opacity: 0.55, rough: 0.2 }} shadow={false} />
      <Round s={[0.34, 0.02, 0.22]} p={[-0.45, 0.235, 0.22]} r={[0, 0.2, 0]} c="#c9c2b0" rad={0.01} shadow={false} />
    </Group>
  );
}

/** A sagging charity-skip sofa, taped and propped on a brick. */
export function OldCouch() {
  return (
    <Group>
      <Group r={[0, 0, 0.025]}>
        <Round s={[1.5, 0.28, 0.78]} p={[0, 0.2, 0]} c="#6b4f3d" rad={0.05} />
        {/* seat cushions: one sunken, one lumpy */}
        <Round s={[0.62, 0.14, 0.56]} p={[-0.38, 0.4, 0.06]} c="#8a6a50" rad={0.06} />
        <Round s={[0.62, 0.1, 0.56]} p={[0.34, 0.37, 0.06]} r={[0.03, 0, 0.03]} c="#7d5f48" rad={0.05} />
        <Round s={[1.5, 0.52, 0.2]} p={[0, 0.58, -0.3]} r={[-0.08, 0, 0]} c="#6b4f3d" rad={0.06} />
        <Round s={[0.18, 0.4, 0.78]} p={[-0.76, 0.42, 0]} c="#5d4332" rad={0.05} />
        {/* the right arm has gone: stuffing and a splintered frame */}
        <Round s={[0.18, 0.2, 0.7]} p={[0.76, 0.3, 0]} c="#d9c777" rad={0.07} />
        <Box s={[0.04, 0.34, 0.04]} p={[0.8, 0.4, 0.3]} r={[0, 0, 0.2]} c={TIMBER} />
        <Box s={[0.5, 0.012, 0.012]} p={[0.2, 0.62, -0.19]} r={[0, 0, 0.2]} c="#a7a79d" shadow={false} />
        {/* throw blanket */}
        <Round s={[0.7, 0.04, 0.4]} p={[-0.3, 0.47, 0.12]} r={[0, 0.3, 0]} c="#a84a3a" rad={0.02} />
      </Group>
      <Box s={[0.2, 0.1, 0.1]} p={[0.7, 0.05, 0.28]} c="#9a4a32" o={{ rough: 1 }} />
      <Box s={[0.08, 0.18, 0.08]} p={[-0.7, 0.09, 0.28]} c={TIMBER} o={{ rough: 1 }} />
      <Box s={[0.08, 0.18, 0.08]} p={[-0.7, 0.09, -0.28]} c={TIMBER} o={{ rough: 1 }} />
    </Group>
  );
}

/** Built-in grime, exposed structure and rubbish. None of it is furniture the player owns. */
export function SquatDecor({ owned }: { owned: ReadonlySet<string> }) {
  void owned;
  return (
    <Group>
      {/* broken slabs and lumps on the floor: it is not level */}
      {([
        [0.5, 3.3, 0.5, 0.04, 0.4, 0.2], [4.2, 0.9, 0.4, 0.03, 0.6, -0.5], [3.6, 3.1, 0.3, 0.035, 0.3, 0.4], [1.8, 2.2, 0.35, 0.03, 0.5, 0.9],
      ] as const).map(([x, z, w, h, d, r], i) => (
        <Box key={i} s={[w, h, d]} p={[x, 0.04, z]} r={[0.02, r, 0.03]} c="#7d786d" o={{ rough: 1 }} />
      ))}
      <Box s={[0.9, 0.012, 0.6]} p={[3.7, 0.028, 2.6]} r={[0, 0.2, 0]} c="#1c2227" o={{ rough: 0.12, opacity: 0.75 }} shadow={false} />
      <Box s={[1.1, 0.012, 0.8]} p={[2.95, 0.026, 3.25]} r={[0, 0.15, 0]} m={card(3)} shadow={false} />
      <Box s={[0.8, 0.012, 0.6]} p={[3.4, 0.03, 3.3]} r={[0, -0.4, 0]} m={card(1)} shadow={false} />

      {/* exposed rafters and a torn tarp: the roof is mostly missing */}
      {[0.9, 2.3, 3.7].map((x, i) => (
        <Box key={x} s={[0.09, 0.11, 3.7]} p={[x, 2.04, 1.8]} r={[0, 0, (i - 1) * 0.02]} c={TIMBER} o={{ rough: 1 }} />
      ))}
      <Box s={[4.4, 0.08, 0.1]} p={[2.3, 2.0, 0.2]} c="#5b4630" o={{ rough: 1 }} />
      <Box s={[1.7, 0.015, 1.3]} p={[3.45, 1.96, 0.7]} r={[0.08, 0.1, -0.06]} c="#3f6d8c" o={{ rough: 0.6 }} />
      <Box s={[1.4, 0.015, 0.8]} p={[0.7, 1.97, 3.0]} r={[-0.06, -0.2, 0.05]} c="#6a8c9d" o={{ rough: 0.6 }} />

      {/* bare bulb on a wire */}
      <Cyl rad={0.004} h={0.2} p={[2.3, 1.9, 1.6]} c="#222" shadow={false} />
      <Ball rad={0.05} p={[2.3, 1.76, 1.6]} c="#fff1c4" o={{ emissive: "#ffd48a", glow: 2.4 }} shadow={false} />

      {/* damp, mould and a drip into a bucket */}
      <Box s={[0.9, 0.7, 0.006]} p={[3.1, 1.2, 0.07]} c="#3d4a36" o={{ opacity: 0.45, rough: 1 }} shadow={false} />
      <Box s={[0.4, 0.5, 0.006]} p={[0.7, 1.45, 0.07]} c="#4a4030" o={{ opacity: 0.5, rough: 1 }} shadow={false} />
      <Box s={[0.5, 0.9, 0.006]} p={[0.07, 1.0, 1.4]} r={[0, Math.PI / 2, 0]} c="#3d4a36" o={{ opacity: 0.4, rough: 1 }} shadow={false} />
      <Group p={[0.3, 0, 3.2]}>
        <Cyl rad={0.14} h={0.26} p={[0, 0.13, 0]} c="#9aa0a4" o={{ rough: 0.5, metal: 0.6 }} />
        <Cyl rad={0.125} h={0.005} p={[0, 0.2, 0]} c="#6f93a6" o={{ opacity: 0.8, rough: 0.05 }} shadow={false} />
      </Group>
      <Cyl rad={0.004} h={1.5} p={[0.3, 1.0, 3.2]} c="#9fc4d6" o={{ opacity: 0.5 }} shadow={false} />

      {/* a stack of crates holding the rest of their belongings */}
      <Group p={[0.45, 0, 2.25]}>
        <Crate p={[0, 0, 0]} c="#2f5d8a" w={0.46} d={0.46} h={0.3} />
        <Crate p={[0, 0.3, 0]} r={[0, 0.3, 0]} c="#7a3a2a" w={0.42} d={0.42} h={0.28} />
        <Round s={[0.3, 0.12, 0.24]} p={[0.02, 0.64, 0.02]} r={[0, 0.5, 0]} c="#5d6a7a" rad={0.05} />
      </Group>

      {/* bin bags, tins and bottles */}
      <Group p={[4.32, 0, 2.85]}>
        <Ball rad={0.2} p={[0, 0.17, 0]} sc={[0.2, 0.19, 0.18]} c={GRIME} o={{ rough: 0.3 }} />
        <Ball rad={0.17} p={[0.12, 0.14, -0.08]} sc={[0.16, 0.16, 0.15]} c="#1b2a26" o={{ rough: 0.3 }} />
        <Ball rad={0.14} p={[-0.06, 0.4, 0.04]} sc={[0.13, 0.13, 0.12]} c="#2a2f35" o={{ rough: 0.3 }} />
      </Group>
      {([[1.5, 1.6, 0.4], [2.1, 2.1, -0.3], [3.2, 0.95, 1.2], [0.95, 3.4, 0.9], [4.05, 3.45, 2.0], [2.2, 3.35, 0.2]] as const).map(([x, z, r], i) => (
        <Cyl key={i} rad={0.03} h={0.1} p={[x, 0.05, z]} r={[Math.PI / 2, 0, r]} c={["#b8442f", "#6b8f4a", "#c9a24a", "#9aa0a4", "#b8442f", "#2f6a4a"][i]!} o={{ rough: 0.4, metal: 0.4 }} />
      ))}
      <Box s={[0.38, 0.05, 0.38]} p={[3.1, 0.035, 2.95]} r={[0, 0.6, 0]} c="#d8d1bb" o={{ rough: 1 }} shadow={false} />
      <Box s={[0.3, 0.012, 0.22]} p={[1.3, 0.03, 2.0]} r={[0, 0.8, 0]} c="#ccc6b4" shadow={false} />
      <Box s={[0.28, 0.012, 0.2]} p={[1.5, 0.036, 2.1]} r={[0, -0.3, 0]} c="#bdb7a4" shadow={false} />

      {/* washing line with a grey shirt */}
      <Cyl rad={0.006} h={2.0} p={[1.2, 1.78, 2.3]} r={[0, 0, Math.PI / 2]} c="#c9c2a8" shadow={false} />
      <Box s={[0.34, 0.38, 0.015]} p={[1.0, 1.55, 2.3]} r={[0, 0, 0.05]} c="#8a929a" shadow={false} />
      <Box s={[0.22, 0.3, 0.015]} p={[1.55, 1.58, 2.3]} r={[0, 0, -0.08]} c="#9a6a5a" shadow={false} />

      {/* the entrance: a scrap of carpet, mud and a wonky lean-to timber */}
      <Box s={[0.8, 0.014, 0.5]} p={[2.95, 0.03, 3.5]} r={[0, 0.1, 0]} c="#6a5340" o={{ rough: 1 }} shadow={false} />
      <Box s={[0.07, 1.7, 0.07]} p={[2.45, 0.85, 3.52]} r={[0.02, 0, -0.06]} c={TIMBER} o={{ rough: 1 }} />
      <Box s={[0.07, 1.6, 0.07]} p={[3.45, 0.8, 3.52]} r={[0.02, 0, 0.05]} c={TIMBER} o={{ rough: 1 }} />
      <Cone rad={0.05} h={0.12} p={[0.9, 0.06, 3.3]} c="#e0732a" o={{ rough: 0.5 }} />
    </Group>
  );
}
