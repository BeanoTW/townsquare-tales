import { useMemo } from "react";
import { Ball, Box, CHROME, ChairRow, Clock, Cyl, Group, Instanced, Keyboard, Monitor, Plant, Round, STEEL, Sign, TrafficCone, WallBox, type V3 } from "./kit";

/**
 * Bayside Garage: customer reception with the service counter, key board and a coffee corner, and through a
 * glazed partition the three-bay workshop. Bay 1 has a hatchback up on axle stands with its bonnet open, bay 2
 * (the interactive fixture) a two-post lift with a saloon raised, bay 3 an inspection pit. Fixtures face +z;
 * decor is in plan coordinates (GARAGE in src/lib/home3d/town-venues.ts).
 */
const TEAL = "#344b52";
const GOLD = "#c6a663";
const HAZARD = "#e6b422";
const RED = "#b8433c";
const RUBBER = "#1d1e20";

/** A tyre with a steel rim, standing on its tread; its axle runs along local x. */
function Wheel({ p, rad = 0.32, w = 0.22, rim = "#b9c0c4" }: { p: V3; rad?: number; w?: number; rim?: string }) {
  return (
    <Group p={p}>
      <Cyl rad={rad} h={w} r={[0, 0, Math.PI / 2]} c={RUBBER} o={{ rough: 0.9 }} />
      <Cyl rad={rad * 0.6} h={w + 0.02} r={[0, 0, Math.PI / 2]} c={rim} o={CHROME} shadow={false} />
      <Cyl rad={rad * 0.18} h={w + 0.04} r={[0, 0, Math.PI / 2]} c="#5a6066" o={STEEL} shadow={false} />
    </Group>
  );
}

/** A small car, long axis along z with its nose at +z. `bonnet` opens the engine bay. */
function Car({ p, r, paint, bonnet = false, wheels = true, plate = "BY51 GRG" }: { p: V3; r?: V3; paint: string; bonnet?: boolean; wheels?: boolean; plate?: string }) {
  const glass = { opacity: 0.55, rough: 0.05, metal: 0.4 };
  return (
    <Group p={p} {...(r ? { r } : {})}>
      {/* lower body, sills and bumpers */}
      <Round s={[1.74, 0.5, 3.9]} p={[0, 0.55, 0]} c={paint} rad={0.12} o={{ rough: 0.25, metal: 0.45 }} />
      <Box s={[1.78, 0.12, 2.3]} p={[0, 0.34, 0]} c="#2b2a2e" />
      <Round s={[1.76, 0.2, 0.18]} p={[0, 0.42, 1.94]} c="#2b2a2e" rad={0.06} />
      <Round s={[1.76, 0.2, 0.18]} p={[0, 0.42, -1.94]} c="#2b2a2e" rad={0.06} />
      {/* cabin with tinted glass */}
      <Round s={[1.56, 0.5, 2.0]} p={[0, 1.03, -0.25]} c={paint} rad={0.14} o={{ rough: 0.25, metal: 0.45 }} />
      <Box s={[1.58, 0.36, 1.7]} p={[0, 1.05, -0.25]} c="#1e2a33" o={glass} shadow={false} />
      <Box s={[1.4, 0.34, 0.04]} p={[0, 1.02, 0.77]} r={[-0.55, 0, 0]} c="#2a3a46" o={glass} shadow={false} />
      <Box s={[1.4, 0.3, 0.04]} p={[0, 1.04, -1.27]} r={[0.5, 0, 0]} c="#2a3a46" o={glass} shadow={false} />
      {/* lamps, grille and number plates */}
      {[-0.6, 0.6].map((x) => <Box key={`h${x}`} s={[0.36, 0.14, 0.04]} p={[x, 0.66, 1.96]} c="#fff6d8" o={{ emissive: "#fff2c0", glow: 0.4 }} shadow={false} />)}
      {[-0.65, 0.65].map((x) => <Box key={`t${x}`} s={[0.3, 0.14, 0.04]} p={[x, 0.68, -1.96]} c="#c0302a" o={{ emissive: "#ff3a2a", glow: 0.3 }} shadow={false} />)}
      <Box s={[0.7, 0.14, 0.03]} p={[0, 0.62, 1.97]} c="#2b2a2e" />
      <Sign p={[0, 0.44, 2.04]} w={0.52} h={0.12} text={plate} bg="#f4f1e6" fg="#1d1e20" border="#1d1e20" />
      <Sign p={[0, 0.48, -2.04]} r={[0, Math.PI, 0]} w={0.52} h={0.12} text={plate} bg="#f2c94c" fg="#1d1e20" border="#1d1e20" />
      {/* door mirrors */}
      {[-1, 1].map((s) => <Round key={s} s={[0.14, 0.1, 0.16]} p={[s * 0.9, 0.95, 0.55]} c={paint} rad={0.03} />)}
      {bonnet ? (
        <>
          {/* engine bay: block, rocker cover, battery and the radiator */}
          <Box s={[1.5, 0.12, 1.15]} p={[0, 0.76, 1.3]} c="#2b2a2e" />
          <Box s={[0.8, 0.32, 0.6]} p={[-0.1, 0.92, 1.3]} c="#6a6f74" o={STEEL} />
          <Round s={[0.62, 0.1, 0.42]} p={[-0.1, 1.12, 1.3]} c={RED} rad={0.03} />
          <Box s={[0.28, 0.22, 0.2]} p={[0.55, 0.92, 1.1]} c="#1d1e20" />
          <Box s={[1.3, 0.3, 0.06]} p={[0, 0.9, 1.84]} c="#3a3f44" />
          <Cyl rad={0.04} h={0.6} p={[0.35, 0.95, 1.55]} r={[Math.PI / 2, 0, 0]} c="#1d1e20" shadow={false} />
          {/* the bonnet itself, propped open on its stay */}
          <Group p={[0, 0.82, 0.72]} r={[-0.85, 0, 0]}>
            <Round s={[1.6, 0.05, 1.2]} p={[0, 0, 0.6]} c={paint} rad={0.02} o={{ rough: 0.25, metal: 0.45 }} />
          </Group>
          <Cyl rad={0.01} h={0.75} p={[-0.6, 1.15, 1.2]} r={[0.5, 0, 0]} c="#9aa5aa" o={STEEL} shadow={false} />
        </>
      ) : (
        <Round s={[1.6, 0.06, 1.2]} p={[0, 0.8, 1.3]} c={paint} rad={0.02} o={{ rough: 0.25, metal: 0.45 }} />
      )}
      {wheels && [[-0.82, 1.28], [0.82, 1.28], [-0.82, -1.28], [0.82, -1.28]].map(([x, z]) => <Wheel key={`${x}${z}`} p={[x!, 0.32, z!]} />)}
    </Group>
  );
}

/** Interactive: bay 2's two-post lift with a saloon raised to working height, an oil drainer under it. */
function LiftBay() {
  return (
    <Group>
      {/* yellow bay outline and the lift's floor plates */}
      {[-1.45, 1.45].map((x) => <Box key={x} s={[0.08, 0.01, 4.6]} p={[x, 0.006, 0]} c={HAZARD} shadow={false} />)}
      {[-1.25, 1.25].map((x) => (
        <Group key={x} p={[x, 0, 0]}>
          <Box s={[0.5, 0.04, 0.6]} p={[0, 0.02, 0]} c="#5a6066" o={STEEL} />
          {/* posts with a carriage and a pair of swing arms reaching under the sills */}
          <Box s={[0.26, 3.3, 0.36]} p={[0, 1.65, 0]} c="#2f5ea8" o={{ rough: 0.4, metal: 0.4 }} />
          <Box s={[0.08, 3.2, 0.12]} p={[-Math.sign(x) * 0.15, 1.65, 0]} c="#1f3f78" />
          <Box s={[0.32, 0.42, 0.42]} p={[-Math.sign(x) * 0.08, 1.58, 0]} c="#c9ced2" o={STEEL} />
          {[-1, 1].map((s) => <Box key={s} s={[0.6, 0.08, 0.1]} p={[-Math.sign(x) * 0.42, 1.48, s * 0.55]} r={[0, s * Math.sign(x) * 0.5, 0]} c="#c9ced2" o={STEEL} />)}
          <Box s={[0.2, 0.18, 0.18]} p={[0, 3.12, 0.2]} c="#2b2a2e" />
          <Sign p={[0, 2.5, 0.19]} w={0.22} h={0.5} text="LIFT" bg={HAZARD} fg="#1d1e20" />
        </Group>
      ))}
      {/* overhead crossbar with the hydraulic line */}
      <Box s={[2.8, 0.14, 0.18]} p={[0, 3.36, 0]} c="#2f5ea8" o={{ rough: 0.4, metal: 0.4 }} />
      <Cyl rad={0.015} h={2.5} p={[0, 3.26, 0]} r={[0, 0, Math.PI / 2]} c="#1d1e20" shadow={false} />
      <Car p={[0, 1.18, 0.1]} paint="#3d6fa8" plate="BS19 LFT" />
      {/* drainer and an oil drip tray under the sump */}
      <Group p={[0.1, 0, 1.0]}>
        <Cyl rad={0.32} h={0.08} p={[0, 0.9, 0]} c="#c9a12a" />
        <Cyl rad={0.03} h={0.85} p={[0, 0.45, 0]} c="#9aa5aa" o={STEEL} />
        <Cyl rad={0.22} h={0.5} p={[0, 0.3, 0]} c="#c9a12a" />
        {[0, 1, 2].map((i) => <Ball key={i} rad={0.04} p={[Math.cos(i * 2.1) * 0.2, 0.04, Math.sin(i * 2.1) * 0.2]} c="#1d1e20" />)}
      </Group>
      <Round s={[0.9, 0.01, 0.7]} p={[-0.25, 0.006, -0.4]} c="#26231f" rad={0.005} o={{ rough: 0.2 }} shadow={false} />
      {/* the control box on the left post */}
      <Group p={[-1.25, 1.2, 0.26]}>
        <Box s={[0.22, 0.32, 0.12]} c="#d9dde0" />
        <Ball rad={0.035} p={[0, 0.06, 0.07]} c="#d9342a" o={{ emissive: "#ff3a2a", glow: 0.3 }} />
        <Ball rad={0.03} p={[0, -0.06, 0.07]} c="#3d9a4a" />
      </Group>
      <Sign p={[0, 3.62, 0.1]} w={0.9} h={0.24} text="BAY 2" bg={TEAL} fg={GOLD} />
    </Group>
  );
}

/** Interactive: the reception counter with a booking screen, card reader, bell and brochures. */
function ServiceDesk() {
  return (
    <Group>
      <Box s={[2.8, 0.78, 0.75]} p={[0, 0.39, 0]} c={TEAL} o={{ rough: 0.55 }} />
      <Box s={[2.84, 0.07, 0.02]} p={[0, 0.64, 0.38]} c={GOLD} />
      <Box s={[2.84, 0.1, 0.02]} p={[0, 0.05, 0.38]} c="#1d1e20" />
      <Round s={[2.9, 0.05, 0.82]} p={[0, 0.8, 0]} c="#e9e4d8" rad={0.015} />
      {/* raised customer ledge */}
      <Box s={[2.9, 0.12, 0.28]} p={[0, 0.88, 0.27]} c="#e9e4d8" />
      <Sign p={[0, 0.42, 0.39]} w={1.6} h={0.28} text="SERVICE & MOT" bg={TEAL} fg={GOLD} />
      <Monitor p={[-0.6, 0.83, -0.15]} w={0.5} glow="#8fd0a8" />
      <Keyboard p={[-0.6, 0.83, 0.08]} />
      <Box s={[0.1, 0.04, 0.16]} p={[0.3, 0.96, 0.27]} r={[-0.3, 0, 0]} c="#2b2a2e" />
      <Cyl rad={0.06} h={0.03} p={[0.7, 0.955, 0.27]} c="#c9a24a" o={{ rough: 0.3, metal: 0.85 }} />
      <Ball rad={0.025} p={[0.7, 0.985, 0.27]} c="#c9a24a" o={{ rough: 0.3, metal: 0.85 }} />
      {/* brochure stand and a job card clipboard */}
      <Group p={[1.15, 0.94, 0.2]}>
        <Box s={[0.36, 0.3, 0.12]} p={[0, 0.15, 0]} r={[-0.25, 0, 0]} c="#9aa5aa" o={STEEL} />
        {[-0.1, 0.1].map((x, i) => <Box key={x} s={[0.14, 0.24, 0.01]} p={[x, 0.18, 0.06]} r={[-0.25, 0, 0]} c={["#e05a4f", "#4a8fd9"][i]!} shadow={false} />)}
      </Group>
      <Box s={[0.24, 0.01, 0.32]} p={[0.1, 0.83, -0.1]} r={[0, 0.2, 0]} c="#f4f1e6" shadow={false} />
      <Box s={[0.4, 0.03, 0.3]} p={[-1.2, 0.84, -0.15]} c="#c9a77c" />
    </Group>
  );
}

export function GarageFixture({ id }: { id: string }) {
  if (id === "service-desk") return <ServiceDesk />;
  if (id === "service-bays") return <LiftBay />;
  return null;
}

/** A tall red roll-cab tool chest with drawers. */
function ToolChest({ p, w = 0.9 }: { p: V3; w?: number }) {
  return (
    <Group p={p}>
      <Round s={[w, 1.15, 0.5]} p={[0, 0.65, 0]} c={RED} rad={0.03} o={{ rough: 0.35, metal: 0.3 }} />
      {Array.from({ length: 7 }, (_, i) => <Box key={i} s={[w - 0.1, 0.02, 0.01]} p={[0, 0.2 + i * 0.14, 0.255]} c="#c9ced2" o={CHROME} shadow={false} />)}
      <Round s={[w, 0.4, 0.46]} p={[0, 1.42, 0]} c={RED} rad={0.03} o={{ rough: 0.35, metal: 0.3 }} />
      {[-1, 1].map((s) => <Cyl key={s} rad={0.04} h={0.04} p={[s * (w / 2 - 0.08), 0.04, 0.15]} r={[0, 0, Math.PI / 2]} c={RUBBER} shadow={false} />)}
    </Group>
  );
}

/** A workbench with a vice and a pegboard of tools above it. */
function Workbench({ p, w = 2.2 }: { p: V3; w?: number }) {
  const tools = useMemo(() => {
    const items: { p: V3; s: V3; c: number }[] = [];
    let k = 5;
    const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 16; i++) {
      const x = -w / 2 + 0.15 + (i % 8) * ((w - 0.3) / 7);
      const row = Math.floor(i / 8);
      items.push({ p: [x, 1.55 + row * 0.45, -0.22], s: [0.04 + rnd() * 0.05, 0.22 + rnd() * 0.12, 0.03], c: Math.floor(rnd() * 3) });
    }
    return items;
  }, [w]);
  return (
    <Group p={p}>
      <Box s={[w, 0.06, 0.62]} p={[0, 0.9, 0]} c="#8a6a48" o={{ rough: 0.8 }} />
      {[-1, 1].map((s) => <Box key={s} s={[0.06, 0.88, 0.56]} p={[s * (w / 2 - 0.05), 0.44, 0]} c="#5a6066" o={STEEL} />)}
      <Box s={[w - 0.1, 0.04, 0.5]} p={[0, 0.2, 0]} c="#5a6066" o={STEEL} />
      <Box s={[0.36, 0.22, 0.12]} p={[w / 2 - 0.35, 1.04, 0.24]} c="#2f5ea8" />
      {/* pegboard */}
      <Box s={[w, 1.0, 0.03]} p={[0, 1.75, -0.27]} c="#c9b896" />
      <Instanced items={tools} colours={["#c9ced2", RED, "#2b2a2e"]} rough={0.4} />
      <Box s={[0.5, 0.18, 0.2]} p={[-w / 2 + 0.45, 1.02, -0.05]} c={RED} />
      <Cyl rad={0.06} h={0.18} p={[0.1, 1.02, 0]} c="#3a6a3a" />
    </Group>
  );
}

export function GarageDecor() {
  return (
    <Group>
      {/* ── reception ── */}
      <Sign p={[2.1, 2.75, 0.11]} w={2.6} h={0.42} text="BAYSIDE GARAGE" bg={TEAL} fg={GOLD} />
      {/* key board: hooks of numbered fobs behind the desk */}
      <Group p={[2.1, 1.75, 0.12]}>
        <Box s={[1.1, 0.6, 0.03]} c="#6b4a32" />
        {Array.from({ length: 12 }, (_, i) => (
          <Group key={i} p={[-0.42 + (i % 6) * 0.17, 0.14 - Math.floor(i / 6) * 0.26, 0.03]}>
            <Cyl rad={0.006} h={0.04} r={[Math.PI / 2, 0, 0]} c="#c9ced2" shadow={false} />
            <Box s={[0.05, 0.08, 0.01]} p={[0, -0.06, 0.01]} c={["#e05a4f", "#4a8fd9", "#e0b84a", "#4fb07a"][i % 4]!} shadow={false} />
          </Group>
        ))}
      </Group>
      <Sign p={[3.55, 1.8, 0.11]} w={0.8} h={1.0} text="PRICES" bg="#f4f1e6" fg={TEAL} border={TEAL} />
      <Clock p={[0.11, 2.6, 2.0]} r={[0, Math.PI / 2, 0]} />
      {/* coffee corner: a cabinet, the machine and cups */}
      <Group p={[0.55, 0, 0.55]}>
        <Box s={[0.8, 0.9, 0.7]} p={[0, 0.45, 0]} c="#e9e4d8" />
        <Box s={[0.36, 0.5, 0.36]} p={[-0.1, 1.15, -0.05]} c="#2b2a2e" />
        <Box s={[0.2, 0.1, 0.02]} p={[-0.1, 1.28, 0.14]} c="#8fd0a8" o={{ emissive: "#8fd0a8", glow: 0.6 }} shadow={false} />
        {[0.18, 0.28].map((x) => <Cyl key={x} rad={0.035} h={0.08} p={[x, 0.94, 0.1]} c="#f4f1e6" />)}
        <Sign p={[0.2, 1.25, 0.36]} w={0.3} h={0.14} text="FREE" bg={RED} />
      </Group>
      {/* waiting chairs, a magazine rack and a plant */}
      <ChairRow p={[0.4, 0, 7.55]} r={[0, Math.PI / 2, 0]} n={3} c={TEAL} />
      <Group p={[0.13, 1.2, 5.6]} r={[0, Math.PI / 2, 0]}>
        <Box s={[0.6, 0.5, 0.06]} c="#9aa5aa" o={STEEL} />
        {[-0.18, 0, 0.18].map((x, i) => <Box key={x} s={[0.16, 0.22, 0.02]} p={[x, 0.06, 0.04]} c={["#e05a4f", "#e0b84a", "#4a8fd9"][i]!} shadow={false} />)}
      </Group>
      <Plant p={[3.7, 0, 6.6]} s={0.8} pot={TEAL} />
      {/* tyre display */}
      {[7.85, 8.4].map((z, j) => (
        <Group key={z} p={[3.68, 0, z]}>
          {Array.from({ length: 4 - j }, (_, i) => (
            <Group key={i} p={[0, 0.11 + i * 0.22, 0]}>
              <Cyl rad={0.3} h={0.2} c={RUBBER} o={{ rough: 0.9 }} />
              <Cyl rad={0.17} h={0.21} c="#3a3a3c" shadow={false} />
            </Group>
          ))}
        </Group>
      ))}
      <Sign p={[3.68, 1.15 - 0.22, 8.4]} r={[0, -Math.PI / 2, 0]} w={0.5} h={0.16} text="TYRES" bg={GOLD} fg="#1d1e20" />
      {/* reception lights */}
      {[2.0, 5.5].map((z) => <Group key={z} p={[2.1, 3.0, z]}><Box s={[1.2, 0.05, 0.3]} c="#ffffff" o={{ emissive: "#fff8ec", glow: 1.1 }} shadow={false} /></Group>)}
      <Sign p={[4.12, 2.55, 6.1]} r={[0, -Math.PI / 2, 0]} w={1.2} h={0.18} text="WORKSHOP · STAFF ONLY" bg={HAZARD} fg="#1d1e20" />

      {/* ── workshop ── */}
      {/* bay lines and painted walkway */}
      {[4.6, 7.6, 7.75, 10.6, 10.8, 13.8].map((x) => <Box key={x} s={[0.07, 0.008, 7.6]} p={[x, 0.005, 4.9]} c={HAZARD} shadow={false} />)}
      {[["BAY 1", 6.1], ["BAY 3", 12.3]].map(([t, x]) => <Sign key={t as string} p={[x as number, 3.5, 0.11]} w={0.9} h={0.24} text={t as string} bg={TEAL} fg={GOLD} />)}
      {/* roller shutters on the street wall, one with its vision panels lit by daylight */}
      {[6.1, 9.2, 12.3].map((x, i) => (
        <Group key={x} p={[x, 0, 8.88]}>
          <Box s={[2.9, 3.25, 0.04]} p={[0, 1.62, 0]} c="#b9bfc2" o={{ rough: 0.4, metal: 0.6 }} />
          {Array.from({ length: 16 }, (_, k) => <Box key={k} s={[2.9, 0.02, 0.02]} p={[0, 0.1 + k * 0.2, -0.03]} c="#8a9094" shadow={false} />)}
          <Box s={[3.1, 0.38, 0.4]} p={[0, 3.45, 0.05]} c="#5a6066" o={STEEL} />
          {[-1.5, 1.5].map((s) => <Box key={s} s={[0.08, 3.25, 0.1]} p={[s, 1.62, -0.03]} c="#5a6066" o={STEEL} />)}
          {i === 1 && [-0.9, -0.3, 0.3, 0.9].map((u) => <Box key={u} s={[0.4, 0.12, 0.01]} p={[u, 1.8, -0.05]} c="#e8f4ff" o={{ emissive: "#dff0ff", glow: 0.9 }} shadow={false} />)}
          <Box s={[0.22, 0.32, 0.1]} p={[1.75, 1.3, -0.05]} c="#d9dde0" />
        </Group>
      ))}
      {/* bay 1: a hatchback on axle stands, bonnet up, a front wheel off and leaning on the stand */}
      <Car p={[6.1, 0.25, 4.2]} paint="#d0503f" bonnet wheels={false} plate="BG07 HTB" />
      {[[5.3, 2.9], [6.9, 2.9], [5.3, 5.5], [6.9, 5.5]].map(([x, z]) => (
        <Group key={`${x}${z}`} p={[x!, 0, z!]}>
          <Cyl rad={0.14} h={0.03} p={[0, 0.015, 0]} c="#d9342a" />
          <Cyl rad={0.03} h={0.3} p={[0, 0.17, 0]} c="#d9342a" o={STEEL} />
        </Group>
      ))}
      {[[5.28, 2.92], [6.92, 2.92], [6.92, 5.48]].map(([x, z]) => <Wheel key={`w${x}${z}`} p={[x!, 0.57, z!]} />)}
      <Group p={[4.95, 0.3, 5.9]} r={[0, 0.2, 0.25]}><Wheel p={[0, 0, 0]} /></Group>
      {/* trolley jack and a creeper board */}
      <Group p={[6.1, 0, 6.5]}>
        <Box s={[0.32, 0.14, 0.7]} p={[0, 0.12, 0]} c="#d9342a" />
        <Cyl rad={0.02} h={0.9} p={[0, 0.45, -0.75]} r={[0.85, 0, 0]} c="#9aa5aa" o={STEEL} shadow={false} />
      </Group>
      <Box s={[0.45, 0.05, 1.0]} p={[5.0, 0.08, 3.4]} c="#2b2a2e" />
      {/* bay 3: the inspection pit with hazard edging and a chain barrier */}
      <Group p={[12.3, 0, 4.5]}>
        <Box s={[1.0, 0.012, 3.6]} p={[0, 0.006, 0]} c="#141516" shadow={false} />
        {[-0.56, 0.56].map((x) => <Box key={x} s={[0.12, 0.02, 3.72]} p={[x, 0.01, 0]} c={HAZARD} shadow={false} />)}
        {[-1.86, 1.86].map((z) => <Box key={z} s={[1.24, 0.02, 0.12]} p={[0, 0.01, z]} c={HAZARD} shadow={false} />)}
        {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.12, 0.021, 0.12]} p={[-0.56, 0.012, -1.6 + i * 0.64]} c="#1d1e20" shadow={false} />)}
        {Array.from({ length: 6 }, (_, i) => <Box key={`r${i}`} s={[0.12, 0.021, 0.12]} p={[0.56, 0.012, -1.6 + i * 0.64]} c="#1d1e20" shadow={false} />)}
        {/* steps down at the far end, and a lamp glowing in the pit */}
        {[0, 1, 2].map((i) => <Box key={`s${i}`} s={[0.8, 0.015, 0.22]} p={[0, 0.013, -1.6 + i * 0.25]} c="#5a6066" shadow={false} />)}
        <Box s={[0.5, 0.015, 0.1]} p={[0, 0.014, 1.2]} c="#fff2c0" o={{ emissive: "#ffe8a0", glow: 1 }} shadow={false} />
        {[[-1.05, -1.95], [1.05, -1.95], [-1.05, 1.95], [1.05, 1.95]].map(([x, z]) => (
          <Group key={`${x}${z}`} p={[x!, 0, z!]}>
            <Cyl rad={0.035} h={0.9} p={[0, 0.45, 0]} c={HAZARD} />
            <Cyl rad={0.12} h={0.04} p={[0, 0.02, 0]} c="#1d1e20" />
          </Group>
        ))}
        {[-1.05, 1.05].map((x) => <Box key={`c${x}`} s={[0.025, 0.025, 3.9]} p={[x, 0.78, 0]} c="#d9342a" shadow={false} />)}
        <Sign p={[0, 0.7, 1.96]} w={0.8} h={0.2} text="PIT · KEEP CLEAR" bg={HAZARD} fg="#1d1e20" />
      </Group>
      <TrafficCone p={[11.4, 0, 7.2]} />
      <TrafficCone p={[13.0, 0, 7.4]} />
      {/* back wall: benches, tool chests and the tyre rack */}
      <Workbench p={[5.6, 0, 0.5]} w={2.2} />
      <ToolChest p={[7.3, 0, 0.45]} />
      <Workbench p={[9.3, 0, 0.5]} w={2.4} />
      <ToolChest p={[11.0, 0, 0.45]} w={0.8} />
      <Group p={[12.75, 0, 0.5]}>
        {[0.15, 1.0, 1.85].map((y) => <Box key={y} s={[1.9, 0.05, 0.6]} p={[0, y, 0]} c="#2f5ea8" o={{ rough: 0.4, metal: 0.4 }} />)}
        {[-0.93, 0.93].map((x) => <Box key={x} s={[0.05, 2.3, 0.6]} p={[x, 1.15, 0]} c="#2f5ea8" o={{ rough: 0.4, metal: 0.4 }} />)}
        {[0.17, 1.02].map((y) => [-0.65, -0.4, -0.15, 0.1, 0.35, 0.6].map((x) => <Wheel key={`${y}${x}`} p={[x, y + 0.31, 0]} rad={0.29} w={0.2} rim="#3a3a3c" />))}
      </Group>
      {/* compressor, oil drums and an air line reel */}
      {[7.3, 7.9].map((z, i) => (
        <Group key={z} p={[13.5, 0, z]}>
          <Cyl rad={0.27} h={0.86} p={[0, 0.43, 0]} c={i ? "#2f5ea8" : "#3d7a4a"} o={{ rough: 0.5, metal: 0.4 }} />
          {[0.2, 0.62].map((y) => <Cyl key={y} rad={0.275} h={0.03} p={[0, y, 0]} c="#1d1e20" shadow={false} />)}
        </Group>
      ))}
      <Group p={[13.5, 0, 8.45]}>
        <Cyl rad={0.18} h={0.6} p={[0, 0.3, 0]} r={[Math.PI / 2, 0, 0]} c={RED} />
        <Box s={[0.4, 0.25, 0.28]} p={[0, 0.7, 0]} c="#2b2a2e" />
      </Group>
      <Group p={[13.88, 1.6, 6.3]} r={[0, -Math.PI / 2, 0]}>
        <Cyl rad={0.22} h={0.1} r={[Math.PI / 2, 0, 0]} c="#d9342a" />
        <Cyl rad={0.14} h={0.12} r={[Math.PI / 2, 0, 0]} c="#1d1e20" />
      </Group>
      {/* exhaust extraction hose dropping into bay 1 */}
      <Cyl rad={0.07} h={1.6} p={[6.1, 3.2, 1.6]} c="#2b2a2e" o={{ rough: 0.9 }} />
      <WallBox p={[4.32, 1.5, 7.5]} r={[0, Math.PI / 2, 0]} s={[0.5, 0.6, 0.15]} c="#d9dde0" />
      <Sign p={[4.4, 1.95, 7.5]} r={[0, Math.PI / 2, 0]} w={0.5} h={0.12} text="ISOLATOR" bg={RED} />
      {/* bay lighting: long fluorescent battens */}
      {[6.1, 9.2, 12.3].map((x) => [2.6, 6.0].map((z) => (
        <Group key={`${x}${z}`} p={[x, 3.7, z]}>
          <Box s={[0.18, 0.06, 1.6]} c="#ffffff" o={{ emissive: "#f6fbff", glow: 1.3 }} shadow={false} />
        </Group>
      )))}
    </Group>
  );
}