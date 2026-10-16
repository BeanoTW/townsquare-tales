import { Pendant, DoorMat, Splashback } from "../decor";
import { Art, Ball, Box, CHROME, Chair, Clock, Cone, Cyl, Group, Instanced, Neon, NoticeBoard, Plant, Round, STEEL, Sign, Stool, Table, Till, type V3 } from "./kit";

/**
 * Fryday Diner: a fifties chrome-and-vinyl diner. Checkerboard floor, a long formica counter with stools,
 * window booths, a jukebox, and a steel kitchen through the serving pass.
 */
const RED = "#b8433c";
const TEAL = "#3f8f8a";
const CREAM = "#f2ead8";
const FORMICA = "#f4efe6";

/** Interactive: the long counter with pie case, condiments and the till. */
function Counter() {
  return (
    <Group>
      <Round s={[4.3, 0.98, 0.8]} p={[0, 0.49, 0]} c={RED} rad={0.06} o={{ rough: 0.45 }} />
      {[0.22, 0.66].map((y) => <Box key={y} s={[4.32, 0.04, 0.82]} p={[0, y, 0]} c="#d5dade" o={CHROME} shadow={false} />)}
      <Round s={[4.45, 0.06, 0.95]} p={[0, 1.0, 0.05]} c={FORMICA} rad={0.02} o={{ rough: 0.3 }} />
      <Box s={[4.45, 0.03, 0.97]} p={[0, 0.965, 0.05]} c="#d5dade" o={CHROME} shadow={false} />
      <Box s={[4.2, 0.08, 0.06]} p={[0, 0.07, 0.42]} c="#d5dade" o={CHROME} shadow={false} />
      {/* pie case under a glass dome, two cake stands */}
      {[-1.5, 1.0].map((x, i) => (
        <Group key={x} p={[x, 1.03, -0.05]}>
          <Cyl rad={0.2} h={0.02} p={[0, 0.01, 0]} c="#d5dade" o={CHROME} shadow={false} />
          <Cyl rad={0.17} h={0.07} p={[0, 0.06, 0]} c={i ? "#d98f5a" : "#c9653f"} o={{ rough: 0.8 }} />
          <Cyl rad={0.17} h={0.012} p={[0, 0.1, 0]} c="#f4e2c0" shadow={false} />
          <Cone rad={0.21} h={0.26} p={[0, 0.2, 0]} c="#dff0f5" o={{ opacity: 0.35, rough: 0.05 }} shadow={false} />
        </Group>
      ))}
      {/* napkins, ketchup, mustard and sugar every metre */}
      {[-0.9, 0.1, 1.6].map((x) => (
        <Group key={x} p={[x, 1.03, 0.2]}>
          <Box s={[0.1, 0.12, 0.06]} p={[0, 0.06, 0]} c="#d5dade" o={CHROME} shadow={false} />
          <Cyl rad={0.025} h={0.14} p={[0.1, 0.07, 0]} c="#c0392b" shadow={false} />
          <Cyl rad={0.025} h={0.14} p={[0.16, 0.07, 0]} c="#e0b84a" shadow={false} />
          <Cyl rad={0.03} h={0.1} p={[-0.1, 0.05, 0]} c="#f4f1ea" o={{ opacity: 0.8, rough: 0.1 }} shadow={false} />
        </Group>
      ))}
      {/* a plate of burger and fries, a milkshake */}
      <Group p={[-0.4, 1.03, 0.25]}>
        <Cyl rad={0.13} h={0.015} c="#f4f1ea" shadow={false} />
        <Cyl rad={0.06} h={0.05} p={[-0.03, 0.035, 0]} c="#c98b4a" shadow={false} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.012, 0.012, 0.08]} p={[0.06 + i * 0.015, 0.02, 0.01]} r={[0, i * 0.3, 0]} c="#e8b84a" shadow={false} />)}
      </Group>
      <Group p={[0.6, 1.03, 0.22]}>
        <Cone rad={0.045} h={0.18} p={[0, 0.09, 0]} r={[Math.PI, 0, 0]} c="#f4c1d0" o={{ opacity: 0.9 }} shadow={false} />
        <Ball rad={0.04} p={[0, 0.19, 0]} c="#fff4f0" shadow={false} />
        <Ball rad={0.012} p={[0, 0.24, 0]} c="#c0392b" shadow={false} />
      </Group>
      <Till p={[1.85, 1.03, -0.12]} />
    </Group>
  );
}

/** Interactive: the cooking line under an extractor hood. */
function CookLine() {
  return (
    <Group>
      <Box s={[3.1, 0.88, 0.85]} p={[0, 0.44, 0]} c="#c9ced2" o={STEEL} />
      <Box s={[3.14, 0.05, 0.9]} p={[0, 0.9, 0]} c="#dfe3e6" o={CHROME} />
      {/* four burners with a pan and a stock pot, a flat-top griddle and a twin fryer */}
      {[[-1.25, -0.15], [-0.85, -0.15], [-1.25, 0.2], [-0.85, 0.2]].map(([x, z], i) => (
        <Group key={i} p={[x!, 0.93, z!]}>
          <Cyl rad={0.12} h={0.02} c="#1a1a1f" shadow={false} />
          {i === 2 && <Cyl rad={0.14} h={0.05} p={[0, 0.04, 0]} c="#2a2a2c" o={STEEL} />}
          {i === 1 && <Cyl rad={0.13} h={0.28} p={[0, 0.15, 0]} c="#aab3b8" o={STEEL} />}
        </Group>
      ))}
      <Box s={[0.9, 0.03, 0.6]} p={[-0.05, 0.94, 0]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.6 }} shadow={false} />
      {[-0.25, 0.1, 0.3].map((x) => <Cyl key={x} rad={0.05} h={0.02} p={[x, 0.965, 0.05]} c="#8a5a3a" shadow={false} />)}
      {[0.75, 1.15].map((x) => (
        <Group key={x} p={[x, 0.93, 0]}>
          <Box s={[0.34, 0.03, 0.5]} c="#3a3f45" shadow={false} />
          <Box s={[0.26, 0.12, 0.2]} p={[0, 0.12, -0.12]} c="#c9ced2" o={STEEL} shadow={false} />
          <Box s={[0.012, 0.25, 0.012]} p={[0, 0.18, -0.12]} c="#1a1a1f" shadow={false} />
        </Group>
      ))}
      {/* oven doors and knobs */}
      {[-1.05, -0.05].map((x) => <Box key={x} s={[0.8, 0.5, 0.02]} p={[x, 0.42, 0.435]} c="#aab3b8" o={STEEL} shadow={false} />)}
      {[-1.4, -1.2, -1.0, -0.8].map((x) => <Cyl key={x} rad={0.025} h={0.03} p={[x, 0.78, 0.44]} r={[Math.PI / 2, 0, 0]} c="#1a1a1f" shadow={false} />)}
      {/* extractor hood and ticket rail */}
      <Box s={[3.2, 0.5, 0.9]} p={[0, 2.25, -0.05]} c="#c9ced2" o={STEEL} />
      <Box s={[3.0, 0.06, 0.8]} p={[0, 1.98, -0.02]} c="#8a9398" o={STEEL} shadow={false} />
      <Box s={[2.4, 0.03, 0.03]} p={[0, 1.6, 0.42]} c="#d5dade" o={CHROME} shadow={false} />
      {[-0.8, -0.5, -0.2, 0.3, 0.6].map((x, i) => <Box key={x} s={[0.1, 0.16, 0.004]} p={[x, 1.5, 0.43]} r={[0, 0, (i % 2 ? 0.05 : -0.04)]} c="#fdfbf2" shadow={false} />)}
    </Group>
  );
}

/** Interactive: the "now hiring" board by the door (wall-mounted; +z faces into the room). */
function Hiring() {
  return (
    <Group>
      <NoticeBoard p={[0, 1.55, -0.08]} w={1.05} h={0.8} header="NOW HIRING" frame={RED} />
      <Sign p={[0, 0.98, -0.07]} w={0.7} h={0.16} text="Apply within" bg={TEAL} />
    </Group>
  );
}

/** Interactive: the manager's corner booth, laptop and paperwork out. */
function ManagerBooth() {
  return (
    <Group>
      <BoothSeats w={1.6} />
      <Table p={[0, 0, 0]} w={1.2} d={0.62} h={0.74} top={FORMICA} leg="#d5dade" />
      <Group p={[0.15, 0.77, 0]}>
        <Box s={[0.36, 0.02, 0.24]} c="#2a2f36" shadow={false} />
        <Box s={[0.36, 0.22, 0.015]} p={[0, 0.11, -0.12]} r={[-0.25, 0, 0]} c="#2a2f36" shadow={false} />
        <Box s={[0.32, 0.18, 0.004]} p={[0, 0.11, -0.11]} r={[-0.25, 0, 0]} c="#0f2030" o={{ emissive: "#6fb6e6", glow: 0.6 }} shadow={false} />
      </Group>
      {[0, 1, 2].map((i) => <Box key={i} s={[0.21, 0.004, 0.29]} p={[-0.35 + i * 0.02, 0.775 + i * 0.004, 0.05 + i * 0.03]} r={[0, 0.1 * i, 0]} c="#fdfbf2" shadow={false} />)}
      <Cyl rad={0.04} h={0.09} p={[-0.5, 0.81, -0.15]} c="#f4f1ea" shadow={false} />
    </Group>
  );
}

/** Two vinyl booth benches facing each other across x = 0, backs to ±z. */
function BoothSeats({ w = 1.4, colour = RED }: { w?: number; colour?: string }) {
  return (
    <>
      {[-1, 1].map((s) => (
        <Group key={s} p={[0, 0, s * 0.6]} r={[0, s > 0 ? Math.PI : 0, 0]}>
          <Round s={[w, 0.42, 0.5]} p={[0, 0.21, 0]} c="#7b2e2a" rad={0.04} />
          <Round s={[w, 0.12, 0.46]} p={[0, 0.47, 0.02]} c={colour} rad={0.05} />
          <Round s={[w, 0.66, 0.16]} p={[0, 0.78, -0.2]} c={colour} rad={0.06} />
          <Box s={[w + 0.02, 0.03, 0.18]} p={[0, 1.12, -0.2]} c="#d5dade" o={CHROME} shadow={false} />
        </Group>
      ))}
    </>
  );
}

function Booth({ p }: { p: V3 }) {
  return (
    <Group p={p} r={[0, Math.PI / 2, 0]}>
      <BoothSeats w={1.55} />
      <Table p={[0, 0, 0]} w={1.0} d={0.6} h={0.74} top={FORMICA} leg="#d5dade" />
      <Group p={[0.32, 0.77, 0]}>
        <Box s={[0.08, 0.1, 0.05]} p={[0, 0.05, 0]} c="#d5dade" o={CHROME} shadow={false} />
        <Cyl rad={0.02} h={0.12} p={[0.08, 0.06, 0]} c="#c0392b" shadow={false} />
      </Group>
      <Cyl rad={0.11} h={0.012} p={[-0.2, 0.77, 0.15]} c="#f4f1ea" shadow={false} />
      <Cyl rad={0.11} h={0.012} p={[-0.2, 0.77, -0.15]} c="#f4f1ea" shadow={false} />
    </Group>
  );
}

function Jukebox({ p }: { p: V3 }) {
  return (
    <Group p={p} r={[0, -Math.PI / 2, 0]}>
      <Round s={[0.6, 1.1, 0.45]} p={[0, 0.55, 0]} c="#7b2e2a" rad={0.08} o={{ rough: 0.35 }} />
      <Cyl rad={0.3} h={0.45} p={[0, 1.1, 0]} r={[Math.PI / 2, 0, 0]} c="#e1a53a" o={{ emissive: "#ffb347", glow: 0.9 }} />
      <Box s={[0.42, 0.3, 0.02]} p={[0, 0.82, 0.23]} c="#dff0f5" o={{ emissive: "#6fe3ff", glow: 0.7 }} shadow={false} />
      {[-0.18, 0, 0.18].map((x) => <Box key={x} s={[0.04, 0.5, 0.02]} p={[x, 0.42, 0.23]} c="#ff7fb2" o={{ emissive: "#ff7fb2", glow: 1.0 }} shadow={false} />)}
      <Box s={[0.44, 0.08, 0.02]} p={[0, 0.12, 0.23]} c="#d5dade" o={CHROME} shadow={false} />
    </Group>
  );
}

/** The back bar: steel cabinets, coffee, shakes, a pie fridge and the menu board. */
function BackBar() {
  return (
    <Group>
      <Box s={[6.0, 0.95, 0.7]} p={[5.3, 0.475, 0.5]} c="#c9ced2" o={STEEL} />
      <Box s={[6.04, 0.05, 0.74]} p={[5.3, 0.97, 0.5]} c={FORMICA} o={{ rough: 0.3 }} />
      <Splashback p={[5.3, 1.3, 0.13]} w={6.0} />
      {/* espresso machine, coffee pots on warmers, three shake mixers */}
      <Group p={[3.0, 1.0, 0.45]}>
        <Round s={[0.7, 0.45, 0.45]} p={[0, 0.22, 0]} c="#c0392b" rad={0.05} o={{ rough: 0.35 }} />
        <Box s={[0.5, 0.06, 0.3]} p={[0, 0.48, 0]} c="#d5dade" o={CHROME} shadow={false} />
        {[-0.15, 0.15].map((x) => <Cyl key={x} rad={0.03} h={0.08} p={[x, 0.12, 0.24]} c="#2a2a2c" shadow={false} />)}
      </Group>
      {[3.9, 4.25, 4.6].map((x, i) => (
        <Group key={x} p={[x, 1.0, 0.5]}>
          <Cyl rad={0.08} h={0.02} c="#c0392b" o={{ emissive: "#ff5a4a", glow: 0.3 }} shadow={false} />
          <Ball rad={0.085} p={[0, 0.11, 0]} sc={[0.085, 0.1, 0.085]} c={i === 1 ? "#d98f5a" : "#4a2a1a"} o={{ opacity: 0.85, rough: 0.1 }} />
          <Box s={[0.05, 0.03, 0.015]} p={[0.09, 0.2, 0]} c="#2a2a2c" shadow={false} />
        </Group>
      ))}
      {[5.4, 5.8, 6.2].map((x, i) => (
        <Group key={x} p={[x, 1.0, 0.45]}>
          <Box s={[0.18, 0.5, 0.2]} p={[0, 0.25, -0.05]} c={["#4a8fd9", "#f4c1d0", "#8fd9a8"][i]!} o={{ rough: 0.35 }} />
          <Cyl rad={0.05} h={0.18} p={[0, 0.12, 0.08]} c="#d5dade" o={CHROME} />
        </Group>
      ))}
      {/* pie fridge */}
      <Group p={[7.6, 0, 0.5]}>
        <Box s={[1.0, 1.75, 0.66]} p={[0, 0.875, 0]} c="#e9eef2" o={{ rough: 0.4 }} />
        <Box s={[0.84, 1.3, 0.02]} p={[0, 1.0, 0.335]} c="#dff0f5" o={{ opacity: 0.4, rough: 0.05 }} shadow={false} />
        {[0.55, 0.95, 1.35].map((y, i) => (
          <Group key={y} p={[0, y, 0.1]}>
            <Box s={[0.8, 0.02, 0.4]} c="#d5dade" o={CHROME} shadow={false} />
            {[-0.25, 0.05, 0.3].map((x, j) => <Cyl key={x} rad={0.11} h={0.06} p={[x, 0.04, 0]} c={["#c9653f", "#d98f5a", "#f4c1d0", "#8a5a3a"][(i + j) % 4]!} shadow={false} />)}
          </Group>
        ))}
        <Box s={[0.84, 0.04, 0.01]} p={[0, 1.7, 0.335]} c="#ffffff" o={{ emissive: "#eef6ff", glow: 1.2 }} shadow={false} />
      </Group>
      {/* stacked cups and the menu board */}
      {[2.45, 2.55].map((x, i) => <Cyl key={x} rad={0.045} h={0.3 - i * 0.08} p={[x, 1.15 - i * 0.04, 0.6]} c="#f4f1ea" shadow={false} />)}
      <Box s={[3.6, 1.0, 0.06]} p={[5.0, 2.3, 0.14]} c="#1f2a2a" />
      <Sign p={[5.0, 2.62, 0.18]} w={2.4} h={0.26} text="FRYDAY DINER" bg={RED} fg="#fff1c2" />
      {["Burger & fries  $6", "Pie of the day  $3", "Shake  $2   Coffee  $1"].map((t, i) => (
        <Sign key={t} p={[5.0, 2.3 - i * 0.2, 0.18]} w={2.9} h={0.14} text={t} bg="#1f2a2a" fg="#f6e7c4" border="#1f2a2a" />
      ))}
      <Clock p={[8.1, 2.45, 0.14]} />
    </Group>
  );
}

/** Kitchen fit-out around the cooking line. */
function Kitchen() {
  return (
    <Group>
      {/* prep table with chopping boards, veg and a hanging pot rack */}
      <Group p={[11.15, 0, 3.75]}>
        <Box s={[1.7, 0.05, 0.9]} p={[0, 0.9, 0]} c="#dfe3e6" o={CHROME} />
        <Box s={[1.6, 0.03, 0.8]} p={[0, 0.3, 0]} c="#c9ced2" o={STEEL} shadow={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.04, 0.9, 0.04]} p={[x! * 0.8, 0.45, z! * 0.4]} c="#c9ced2" o={STEEL} />)}
        <Box s={[0.5, 0.03, 0.35]} p={[-0.4, 0.94, 0]} c="#c79a5c" shadow={false} />
        {[[-0.5, 0.05, "#c0392b"], [-0.35, -0.05, "#e8743b"], [0.3, 0.1, "#4f8a3e"], [0.45, -0.1, "#e0b84a"]].map(([x, z, c], i) => <Ball key={i} rad={0.05} p={[x as number, 0.98, z as number]} c={c as string} shadow={false} />)}
        <Box s={[1.4, 0.03, 0.03]} p={[0, 2.2, 0]} c="#2a2a2c" o={STEEL} shadow={false} />
        {[-0.5, -0.15, 0.2, 0.5].map((x, i) => <Group key={x} p={[x, 1.95, 0]}><Cyl rad={0.1 + (i % 2) * 0.03} h={0.03} r={[Math.PI / 2, 0, 0]} c="#aab3b8" o={STEEL} shadow={false} /></Group>)}
      </Group>
      {/* walk-in fridge, pot sink and dry store */}
      <Group p={[12.6, 0, 5.35]}>
        <Box s={[0.62, 2.1, 1.45]} p={[0, 1.05, 0]} c="#e9eef2" o={STEEL} />
        <Box s={[0.02, 1.8, 0.6]} p={[-0.32, 1.0, 0.2]} c="#c9ced2" o={STEEL} shadow={false} />
        <Box s={[0.04, 0.3, 0.04]} p={[-0.34, 1.1, -0.05]} c="#2a2a2c" shadow={false} />
      </Group>
      <Group p={[10.9, 0, 8.6]}>
        <Box s={[1.8, 0.88, 0.6]} p={[0, 0.44, 0]} c="#c9ced2" o={STEEL} />
        <Box s={[0.7, 0.04, 0.45]} p={[-0.4, 0.89, 0]} c="#5a6066" shadow={false} />
        <Box s={[0.7, 0.04, 0.45]} p={[0.4, 0.89, 0]} c="#5a6066" shadow={false} />
        <Cyl rad={0.015} h={0.35} p={[0, 1.05, -0.2]} c="#d5dade" o={CHROME} shadow={false} />
        {[0, 1, 2, 3].map((i) => <Cyl key={i} rad={0.12} h={0.02} p={[0.55, 0.92 + i * 0.025, 0.05]} c="#f4f1ea" shadow={false} />)}
      </Group>
      <Group p={[12.6, 0, 7.95]} r={[0, -Math.PI / 2, 0]}>
        {[0.3, 0.75, 1.2, 1.65].map((y) => <Box key={y} s={[1.7, 0.03, 0.55]} p={[0, y, 0]} c="#c9ced2" o={STEEL} shadow={false} />)}
        {[-0.8, 0.8].map((x) => <Box key={x} s={[0.04, 1.8, 0.04]} p={[x, 0.9, 0.25]} c="#c9ced2" o={STEEL} />)}
        <Instanced colours={["#c79a5c", "#e9dfc9", "#c0392b", "#4a8fd9"]} items={[0.3, 0.75, 1.2, 1.65].flatMap((y, l) => [-0.6, -0.25, 0.1, 0.45].map((x, i) => ({ p: [x, y + 0.14, 0] as V3, s: [0.28, 0.25, 0.4] as V3, c: (l + i) % 4 })))} />
      </Group>
      <Group p={[9.75, 0, 7.8]}>
        <Cyl rad={0.17} h={0.32} p={[0, 0.16, 0]} c="#e0b84a" o={{ rough: 0.5 }} />
        <Cyl rad={0.012} h={1.1} p={[0.05, 0.75, 0]} r={[0, 0, 0.15]} c="#8a6a45" shadow={false} />
      </Group>
      <Splashback p={[11.1, 1.25, 0.12]} w={3.2} />
    </Group>
  );
}

export function DinerFixture({ id }: { id: string }) {
  switch (id) {
    case "counter": return <Counter />;
    case "kitchen": return <CookLine />;
    case "hiring": return <Hiring />;
    case "booth": return <ManagerBooth />;
    default: return null;
  }
}

export function DinerDecor() {
  return (
    <Group>
      <BackBar />
      {/* stools along the counter */}
      {[3.5, 4.25, 5.0, 5.75, 6.5, 7.25].map((x) => <Stool key={x} p={[x, 0, 3.7]} />)}
      {/* window booths and two-top tables */}
      <Booth p={[1.05, 0, 3.1]} />
      <Booth p={[1.05, 0, 5.0]} />
      {[3.6, 6.4].map((x) => (
        <Group key={x} p={[x, 0, 5.6]}>
          <Table p={[0, 0, 0]} w={0.75} d={0.75} h={0.74} top={FORMICA} leg="#d5dade" round />
          <Chair p={[0, 0, -0.5]} cushion={RED} frame="#d5dade" />
          <Chair p={[0, 0, 0.5]} r={[0, Math.PI, 0]} cushion={RED} frame="#d5dade" />
          <Box s={[0.08, 0.1, 0.05]} p={[0, 0.82, 0]} c="#d5dade" o={CHROME} shadow={false} />
        </Group>
      ))}
      <Jukebox p={[8.8, 0, 3.9]} />
      {/* pendants over the counter and booths, art on the left wall */}
      {[3.6, 5.3, 7.0].map((x) => <Pendant key={x} p={[x, 3.2, 2.9]} colour="#ffd9a0" cord={0.9} />)}
      {[3.1, 5.0].map((z) => <Pendant key={z} p={[1.15, 3.2, z]} colour="#ffd9a0" cord={1.0} />)}
      <Art p={[0.12, 1.75, 7.0]} r={[0, Math.PI / 2, 0]} w={0.55} h={0.7} art={0} />
      <Neon p={[0.12, 2.6, 4.1]} r={[0, Math.PI / 2, 0]} w={2.0} h={0.42} text="EAT AT FRYDAY'S" colour="#ff7fb2" />
      {/* black-and-white tile stripe along the walls, entrance mat */}
      <Box s={[9.0, 0.3, 0.02]} p={[4.6, 0.15, 0.12]} c={TEAL} shadow={false} />
      <DoorMat p={[5.3, 8.5]} />
      <Cyl rad={0.17} h={0.34} p={[8.7, 0.17, 8.5]} c="#5a6066" o={{ rough: 0.5, metal: 0.3 }} />
      <Kitchen />
      <Box s={[3.6, 0.02, 0.6]} p={[11.1, 0.015, 1.6]} c="#2a2a2c" o={{ rough: 1 }} shadow={false} />
      <Box s={[0.02, 0.3, 9.0]} p={[0.12, 0.15, 4.5]} c={TEAL} shadow={false} />
      <Group p={[11.1, 2.9, 4.0]}><Box s={[0.5, 0.05, 0.5]} c="#ffffff" o={{ emissive: "#eef6ff", glow: 1.3 }} shadow={false} /></Group>
      <Group p={[11.1, 2.9, 7.0]}><Box s={[0.5, 0.05, 0.5]} c="#ffffff" o={{ emissive: "#eef6ff", glow: 1.3 }} shadow={false} /></Group>
      <Group p={[5.3, 0, 8.2]}><Sign p={[0, 2.85, 0]} w={1.2} h={0.24} text="OPEN 24/7" bg={TEAL} glow={0.6} /></Group>
      {[4.8, 5.8].map((x) => <Cyl key={x} rad={0.006} h={0.25} p={[x, 3.07, 8.2]} c="#2a2a2c" shadow={false} />)}
      <Group p={[2.0, 0, 8.4]}><Plant p={[0, 0, 0]} s={0.9} pot={TEAL} /></Group>
    </Group>
  );
}

