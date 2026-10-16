import { useMemo } from "react";
import { Art, BRASS, Ball, Bookcase, Box, Chair, Clock, Cone, Cyl, Group, Instanced, Plant, Round, STEEL, Sign, Table, type V3 } from "./kit";

/**
 * Stick Town Community Hall: a tall village hall with a sprung timber floor marked out for badminton, a raised
 * stage with velvet curtains, rows of chairs, an upright piano and a tea hatch, the noticeboard and volunteer
 * table by the doors, and behind a panelled partition the council meeting room. Fixtures face +z; decor is in
 * plan coordinates (HALL in src/lib/home3d/town-venues.ts).
 */
const TEAL = "#304f56";
const CREAM = "#f4ead6";
const OAK = "#8a5a38";
const OAK_D = "#5e3c25";
const VELVET = "#8a2a34";
const VELVET_D = "#5e1a22";
const GOLD = "#d9b45a";

/** Interactive: the big cork noticeboard with pinned posters, a header and a leaflet tray. */
function HallNoticeboard() {
  const notes = useMemo(() => {
    const items: { p: V3; s: V3; c: number; ry?: number }[] = [];
    let k = 3;
    const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
    for (let row = 0; row < 3; row++) for (let col = 0; col < 6; col++) {
      if (rnd() < 0.15) continue;
      const w = 0.16 + rnd() * 0.1;
      items.push({ p: [-0.72 + col * 0.29 + (rnd() - 0.5) * 0.05, 1.25 + row * 0.3 + (rnd() - 0.5) * 0.05, -0.12], s: [w, w * 1.3, 0.005], c: Math.floor(rnd() * 5) });
    }
    return items;
  }, []);
  return (
    <Group>
      <Box s={[1.84, 1.14, 0.05]} p={[0, 1.55, -0.17]} c={OAK_D} />
      <Box s={[1.7, 1.0, 0.02]} p={[0, 1.55, -0.14]} c="#c49a6c" o={{ rough: 1 }} />
      <Instanced items={notes} colours={[CREAM, "#f2c94c", "#cfe6f2", "#f2c4c0", "#c8e6c0"]} rough={0.9} />
      {notes.map((n, i) => <Ball key={i} rad={0.012} p={[n.p[0], n.p[1] + n.s[1] / 2 - 0.02, -0.11]} c={["#d9342a", "#2f5ea8", "#3d9a4a"][i % 3]!} shadow={false} />)}
      <Sign p={[0, 2.25, -0.15]} w={1.5} h={0.24} text="WHAT'S ON" bg={TEAL} fg={GOLD} />
      {/* a poster for the next big event */}
      <Box s={[0.36, 0.5, 0.01]} p={[0.62, 1.7, -0.12]} c="#e05a4f" shadow={false} />
      <Box s={[0.28, 0.08, 0.01]} p={[0.62, 1.82, -0.115]} c={CREAM} shadow={false} />
      {/* leaflet tray below */}
      <Box s={[1.2, 0.06, 0.18]} p={[0, 0.92, -0.08]} c={OAK} />
      {[-0.4, -0.13, 0.13, 0.4].map((x, i) => <Box key={x} s={[0.2, 0.26, 0.02]} p={[x, 1.06, -0.06]} r={[-0.15, 0, 0]} c={[CREAM, "#f2c94c", "#cfe6f2", "#c8e6c0"][i]!} shadow={false} />)}
    </Group>
  );
}

/** Interactive: a trestle table with a printed cloth, sign-up sheets, a cash tin and a pop-up banner. */
function VolunteerDesk() {
  return (
    <Group>
      <Box s={[2.2, 0.05, 0.8]} p={[0, 0.74, 0]} c="#c9b896" />
      <Box s={[2.24, 0.62, 0.02]} p={[0, 0.44, 0.41]} c={TEAL} />
      {[-1, 1].map((s) => <Box key={s} s={[0.02, 0.62, 0.82]} p={[s * 1.12, 0.44, 0]} c={TEAL} />)}
      <Box s={[2.24, 0.06, 0.84]} p={[0, 0.77, 0]} c={TEAL} />
      <Sign p={[0, 0.5, 0.43]} w={1.5} h={0.28} text="VOLUNTEERS WELCOME" bg={TEAL} fg={GOLD} border={TEAL} />
      {/* clipboard sign-up sheets with a pen, a cash tin, leaflets and a jar of sweets */}
      {[-0.55, 0.05].map((x, i) => (
        <Group key={x} p={[x, 0.81, 0.12]} r={[0, i ? -0.15 : 0.1, 0]}>
          <Box s={[0.26, 0.01, 0.34]} c="#8a6a48" />
          <Box s={[0.23, 0.005, 0.3]} p={[0, 0.008, -0.01]} c={CREAM} shadow={false} />
          <Box s={[0.08, 0.02, 0.03]} p={[0, 0.012, 0.15]} c="#9aa5aa" o={STEEL} shadow={false} />
        </Group>
      ))}
      <Cyl rad={0.006} h={0.14} p={[-0.3, 0.82, 0.2]} r={[0, 0, Math.PI / 2]} c="#2b3a67" shadow={false} />
      <Box s={[0.3, 0.1, 0.2]} p={[0.65, 0.84, -0.1]} c="#2f5ea8" o={{ rough: 0.4, metal: 0.5 }} />
      {[0.55, 0.75].map((x, i) => <Box key={x} s={[0.15, 0.02, 0.21]} p={[x, 0.82 + i * 0.01, 0.2]} r={[0, i * 0.2, 0]} c={["#f2c94c", "#cfe6f2"][i]!} shadow={false} />)}
      <Cyl rad={0.07} h={0.16} p={[0.95, 0.88, 0.05]} c="#e8f4ff" o={{ opacity: 0.5, rough: 0.05 }} shadow={false} />
      {[0, 1, 2].map((i) => <Ball key={i} rad={0.025} p={[0.93 + i * 0.02, 0.84 + i * 0.03, 0.05]} c={["#e05a4f", "#e0b84a", "#4fb07a"][i]!} shadow={false} />)}
      {/* pop-up banner behind the coordinator's chair */}
      <Group p={[1.0, 0, -0.6]}>
        <Box s={[0.6, 0.04, 0.12]} p={[0, 0.02, 0]} c="#9aa5aa" o={STEEL} />
        <Box s={[0.56, 1.9, 0.01]} p={[0, 1.0, 0]} c={TEAL} />
        <Sign p={[0, 1.55, 0.01]} w={0.46} h={0.3} text="GET" bg={TEAL} fg={GOLD} border={TEAL} />
        <Sign p={[0, 1.22, 0.01]} w={0.46} h={0.3} text="INVOLVED" bg={TEAL} fg={GOLD} border={TEAL} />
        <Ball rad={0.13} p={[0, 0.75, 0.01]} sc={[0.13, 0.13, 0.01]} c={GOLD} shadow={false} />
      </Group>
      <Chair p={[0, 0, -0.95]} frame={OAK_D} cushion={TEAL} />
    </Group>
  );
}

/** Interactive: the council meeting table with chairs round it, papers, a jug of water and the chair's gavel. */
function MeetingTable() {
  return (
    <Group>
      <Table p={[0, 0, 0]} w={3.2} d={1.3} h={0.75} top={OAK} leg={OAK_D} />
      <Box s={[2.6, 0.01, 0.4]} p={[0, 0.78, 0]} c="#3d5a3a" shadow={false} />
      {[-1.05, -0.35, 0.35, 1.05].map((x) => <Chair key={`n${x}`} p={[x, 0, -1.05]} frame={OAK_D} cushion="#4f6a8a" />)}
      {[-1.05, -0.35, 0.35, 1.05].map((x) => <Chair key={`s${x}`} p={[x, 0, 1.0]} r={[0, Math.PI, 0]} frame={OAK_D} cushion="#4f6a8a" />)}
      {[-1, 1].map((s) => <Chair key={`e${s}`} p={[s * 1.95, 0, 0]} r={[0, -s * Math.PI / 2, 0]} frame={OAK_D} cushion="#4f6a8a" />)}
      {/* agenda papers, glasses and name cards at each place */}
      {[-1.05, -0.35, 0.35, 1.05].map((x) => [-1, 1].map((s) => (
        <Group key={`${x}${s}`} p={[x, 0.78, s * 0.42]}>
          <Box s={[0.21, 0.005, 0.28]} r={[0, s * 0.05, 0]} c={CREAM} shadow={false} />
          <Cyl rad={0.03} h={0.1} p={[0.16, 0.05, -s * 0.06]} c="#e8f4ff" o={{ opacity: 0.45, rough: 0.05 }} shadow={false} />
          <Box s={[0.16, 0.06, 0.01]} p={[0, 0.04, -s * 0.14]} r={[s * 0.3, 0, 0]} c="#f4f1e6" shadow={false} />
        </Group>
      )))}
      <Cyl rad={0.07} h={0.24} p={[0, 0.9, 0]} c="#e8f4ff" o={{ opacity: 0.4, rough: 0.05 }} shadow={false} />
      {/* gavel and block at the chair's place */}
      <Cyl rad={0.06} h={0.03} p={[-0.35, 0.79, -0.25]} c={OAK_D} />
      <Cyl rad={0.03} h={0.14} p={[-0.35, 0.85, -0.25]} r={[0, 0, Math.PI / 2]} c={OAK_D} />
      <Cyl rad={0.01} h={0.22} p={[-0.25, 0.85, -0.3]} r={[0, 0.6, Math.PI / 2]} c={OAK} shadow={false} />
      {/* laptop and conference phone */}
      <Group p={[0.6, 0.78, -0.3]}>
        <Box s={[0.34, 0.02, 0.24]} c="#9aa5aa" o={STEEL} />
        <Box s={[0.34, 0.22, 0.01]} p={[0, 0.11, -0.12]} r={[-0.2, 0, 0]} c="#2b2a2e" />
        <Box s={[0.3, 0.18, 0.005]} p={[0, 0.11, -0.112]} r={[-0.2, 0, 0]} c="#6fb6e6" o={{ emissive: "#6fb6e6", glow: 0.6 }} shadow={false} />
      </Group>
      <Cone rad={0.12} h={0.05} p={[0, 0.8, 0.25]} c="#2b2a2e" />
    </Group>
  );
}

export function HallFixture({ id }: { id: string }) {
  if (id === "noticeboard") return <HallNoticeboard />;
  if (id === "volunteer-desk") return <VolunteerDesk />;
  if (id === "meeting-room") return <MeetingTable />;
  return null;
}

/** A string of triangular flags between two points at height y. */
function Bunting({ a, b, y, n = 14 }: { a: [number, number]; b: [number, number]; y: number; n?: number }) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const colours = ["#e05a4f", "#e0b84a", "#4a8fd9", "#4fb07a", "#f4ead6", "#c56ad9"];
  return (
    <Group p={[a[0], y, a[1]]} r={[0, -ang, 0]}>
      <Box s={[len, 0.01, 0.01]} p={[len / 2, 0, 0]} c="#f4ead6" shadow={false} />
      {Array.from({ length: n }, (_, i) => {
        const t = (i + 0.5) / n;
        const sag = Math.sin(t * Math.PI) * 0.25;
        return <Cone key={i} rad={0.1} h={0.22} p={[t * len, -0.12 - sag, 0]} r={[Math.PI, 0, 0]} c={colours[i % colours.length]!} shadow={false} />;
      })}
    </Group>
  );
}

/** Stack of plastic stacking chairs. */
function ChairStack({ p, n = 8, c = "#3d6a7a" }: { p: V3; n?: number; c?: string }) {
  return (
    <Group p={p}>
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.03, 0.44, 0.03]} p={[x! * 0.2, 0.22, z! * 0.2]} c="#9aa5aa" o={STEEL} shadow={false} />)}
      {Array.from({ length: n }, (_, i) => (
        <Group key={i} p={[0, 0.44 + i * 0.07, -i * 0.012]}>
          <Round s={[0.46, 0.04, 0.44]} c={c} rad={0.015} />
          <Round s={[0.44, 0.38, 0.04]} p={[0, 0.2, -0.21]} r={[-0.12, 0, 0]} c={c} rad={0.015} />
        </Group>
      ))}
    </Group>
  );
}

/** Upright piano, keyboard toward +z. */
function Piano({ p, r }: { p: V3; r?: V3 }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[1.15, 1.25, 0.5]} p={[0, 0.65, -0.05]} c="#2a1a14" o={{ rough: 0.25 }} />
      <Box s={[1.1, 0.06, 0.24]} p={[0, 0.74, 0.26]} c="#2a1a14" o={{ rough: 0.25 }} />
      <Box s={[1.0, 0.025, 0.12]} p={[0, 0.78, 0.3]} c="#f4f1e6" />
      {Array.from({ length: 14 }, (_, i) => <Box key={i} s={[0.03, 0.02, 0.07]} p={[-0.45 + i * 0.07, 0.8, 0.27]} c="#1a1a1a" shadow={false} />)}
      <Box s={[0.5, 0.3, 0.02]} p={[0, 1.0, 0.2]} r={[-0.25, 0, 0]} c={CREAM} shadow={false} />
      {[-1, 1].map((s) => <Cyl key={s} rad={0.07} h={0.2} p={[s * 0.32, 1.3, -0.05]} c={GOLD} o={BRASS} />)}
      {[-1, 1].map((s) => <Box key={`l${s}`} s={[0.06, 0.7, 0.06]} p={[s * 0.5, 0.35, 0.3]} c="#2a1a14" />)}
    </Group>
  );
}

export function HallDecor() {
  return (
    <Group>
      {/* ── stage ── */}
      <Box s={[6.8, 0.75, 3.5]} p={[3.5, 0.375, 1.85]} c="#6b4a32" o={{ rough: 0.7 }} />
      <Box s={[6.82, 0.04, 3.52]} p={[3.5, 0.77, 1.85]} c="#7a5236" />
      <Box s={[6.82, 0.6, 0.02]} p={[3.5, 0.38, 3.61]} c={VELVET_D} />
      {/* steps up at the left front */}
      {[0, 1, 2].map((i) => <Box key={i} s={[0.8, 0.25 * (i + 1), 0.3]} p={[0.55, 0.125 * (i + 1), 4.05 - i * 0.3]} c="#7a5236" />)}
      {/* proscenium curtains, pelmet and the backdrop */}
      {[0.75, 6.25].map((x, j) => (
        <Group key={x} p={[x, 0.77, 3.45]}>
          {Array.from({ length: 5 }, (_, i) => <Round key={i} s={[0.24, 3.1, 0.12]} p={[(i - 2) * 0.2, 1.55, (i % 2) * 0.06]} c={i % 2 ? VELVET_D : VELVET} rad={0.06} o={{ rough: 0.95 }} />)}
          <Cyl rad={0.02} h={0.5} p={[j ? -0.55 : 0.55, 1.2, 0.05]} r={[0, 0, Math.PI / 2]} c={GOLD} o={BRASS} shadow={false} />
        </Group>
      ))}
      <Box s={[6.9, 0.5, 0.18]} p={[3.5, 3.95, 3.5]} c={VELVET} o={{ rough: 0.95 }} />
      <Box s={[6.9, 0.04, 0.19]} p={[3.5, 3.72, 3.5]} c={GOLD} o={BRASS} />
      <Box s={[6.6, 3.2, 0.04]} p={[3.5, 2.4, 0.13]} c="#2f4a5c" />
      {[1.4, 2.6, 4.4, 5.6].map((x, i) => <Ball key={x} rad={0.05} p={[x, 3.1 - (i % 2) * 0.3, 0.16]} c="#fff6d8" o={{ emissive: "#fff2c0", glow: 1.2 }} shadow={false} />)}
      <Sign p={[3.5, 3.0, 0.17]} w={3.4} h={0.44} text="STICK TOWN PLAYERS" bg={TEAL} fg={GOLD} border={GOLD} />
      {/* lectern, microphone and a lighting bar of spotlights */}
      <Group p={[3.5, 0.77, 2.6]}>
        <Box s={[0.6, 1.0, 0.4]} p={[0, 0.5, 0]} c={OAK} />
        <Box s={[0.66, 0.05, 0.46]} p={[0, 1.05, -0.03]} r={[0.25, 0, 0]} c={OAK_D} />
        <Ball rad={0.13} p={[0, 0.55, 0.21]} sc={[0.13, 0.13, 0.01]} c={GOLD} shadow={false} />
        <Cyl rad={0.008} h={0.3} p={[0.15, 1.2, 0.08]} r={[0.4, 0, 0]} c="#2b2a2e" shadow={false} />
        <Ball rad={0.025} p={[0.15, 1.34, 0.14]} c="#2b2a2e" />
      </Group>
      <Group p={[5.2, 0.77, 2.4]}>
        <Cyl rad={0.12} h={0.02} p={[0, 0.01, 0]} c="#2b2a2e" />
        <Cyl rad={0.012} h={1.4} p={[0, 0.7, 0]} c="#2b2a2e" />
        <Ball rad={0.035} p={[0, 1.42, 0.03]} c="#5a6066" o={STEEL} />
      </Group>
      <Box s={[6.4, 0.06, 0.06]} p={[3.5, 3.85, 4.1]} c="#2b2a2e" />
      {[1.2, 2.7, 4.3, 5.8].map((x) => (
        <Group key={x} p={[x, 3.72, 4.1]}>
          <Cyl rad={0.09} h={0.22} r={[0.7, 0, 0]} c="#2b2a2e" />
          <Cyl rad={0.07} h={0.01} p={[0, -0.08, -0.08]} r={[0.7, 0, 0]} c="#fff6d8" o={{ emissive: "#fff2c0", glow: 1.2 }} shadow={false} />
        </Group>
      ))}

      {/* ── main hall ── */}
      {/* badminton court markings on the sprung floor */}
      {[[7.5, 4.3, 9.4, 0.05], [7.5, 10.4, 9.4, 0.05], [7.5, 7.35, 9.4, 0.04], [7.5, 5.0, 9.4, 0.04], [7.5, 9.7, 9.4, 0.04]].map(([x, z, w, d], i) => <Box key={`h${i}`} s={[w!, 0.004, d!]} p={[x!, 0.004, z!]} c="#f2c94c" shadow={false} />)}
      {[2.8, 3.3, 7.5, 11.7, 12.2].map((x, i) => <Box key={`v${i}`} s={[0.05, 0.004, i === 2 ? 0.05 : 6.1]} p={[x, 0.004, 7.35]} c="#f2c94c" shadow={false} />)}
      <Box s={[0.05, 0.004, 1.9]} p={[7.5, 0.004, 5.25]} c="#f2c94c" shadow={false} />
      <Box s={[0.05, 0.004, 1.9]} p={[7.5, 0.004, 9.45]} c="#f2c94c" shadow={false} />
      {/* rows of chairs facing the stage */}
      {[4.9, 5.9].map((z) => Array.from({ length: 7 }, (_, i) => <Chair key={`${z}${i}`} p={[2.35 + i * 0.55, 0, z]} r={[0, Math.PI, 0]} frame="#9aa5aa" cushion="#3d6a7a" />))}
      <ChairStack p={[13.85, 0, 10.2]} />
      <ChairStack p={[14.35, 0, 10.2]} n={6} c="#a84a3a" />
      <Piano p={[0.45, 0, 5.0]} r={[0, Math.PI / 2, 0]} />
      <Group p={[1.25, 0, 5.0]}>
        <Box s={[0.42, 0.05, 0.8]} p={[0, 0.48, 0]} c="#2a1a14" />
        {[-1, 1].map((s) => <Box key={s} s={[0.36, 0.46, 0.04]} p={[0, 0.23, s * 0.36]} c="#2a1a14" />)}
      </Group>
      {/* tea hatch in the right wall: a counter, an urn, cups and the price board */}
      <Group p={[14.65, 0, 6.0]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[2.8, 1.0, 0.5]} p={[0, 0.5, 0]} c={TEAL} />
        <Round s={[2.9, 0.05, 0.58]} p={[0, 1.02, 0]} c={CREAM} rad={0.015} />
        <Box s={[2.6, 1.0, 0.04]} p={[0, 1.6, -0.24]} c="#3a2a22" />
        <Box s={[2.3, 0.6, 0.02]} p={[0, 1.55, -0.22]} c="#e8e2d0" />
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x) => <Box key={x} s={[0.3, 0.02, 0.02]} p={[x, 1.35, -0.2]} c="#c9ccd2" shadow={false} />)}
        <Box s={[2.7, 0.32, 0.08]} p={[0, 2.25, -0.22]} c="#c9ced2" o={STEEL} />
        <Box s={[2.9, 0.12, 0.6]} p={[0, 2.43, 0]} c={TEAL} />
        <Sign p={[0, 2.25, -0.17]} w={1.8} h={0.24} text="TEA & CAKE 50p" bg={TEAL} fg={GOLD} />
        <Group p={[-0.9, 1.05, 0]}>
          <Cyl rad={0.17} h={0.55} p={[0, 0.3, 0]} c="#c9ced2" o={STEEL} />
          <Ball rad={0.17} p={[0, 0.58, 0]} sc={[0.17, 0.07, 0.17]} c="#c9ced2" o={STEEL} />
          <Box s={[0.05, 0.04, 0.1]} p={[0, 0.15, 0.2]} c="#2b2a2e" />
        </Group>
        {[-0.3, -0.05, 0.2, 0.45].map((x) => (
          <Group key={x} p={[x, 1.05, 0.08]}>
            <Cyl rad={0.07} h={0.01} c={CREAM} shadow={false} />
            <Cyl rad={0.04} h={0.08} p={[0, 0.05, 0]} c={CREAM} />
          </Group>
        ))}
        <Cyl rad={0.15} h={0.12} p={[0.95, 1.11, 0]} c="#a84a3a" />
        <Group p={[0.95, 1.18, 0]}><Cyl rad={0.12} h={0.06} c="#e9c79a" /></Group>
      </Group>
      {/* honours board, clock, portraits and the hall's banner */}
      <Clock p={[14.89, 3.0, 8.8]} r={[0, -Math.PI / 2, 0]} rad={0.24} />
      <Group p={[0.11, 0, 10.2]} r={[0, Math.PI / 2, 0]}>
        <Box s={[1.1, 1.4, 0.04]} p={[0, 1.8, 0]} c={OAK_D} />
        <Sign p={[0, 2.35, 0.03]} w={0.9} h={0.16} text="HALL TRUSTEES" bg={OAK_D} fg={GOLD} border={OAK_D} />
        {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.8, 0.03, 0.01]} p={[0, 2.12 - i * 0.16, 0.025]} c={GOLD} shadow={false} />)}
      </Group>
      <Art p={[14.89, 1.9, 4.0]} r={[0, -Math.PI / 2, 0]} w={0.8} h={0.6} art={2} />
      <Sign p={[11.8, 3.3, 3.88]} w={4.0} h={0.42} text="STICK TOWN COMMUNITY HALL" bg={TEAL} fg={GOLD} border={GOLD} />
      {/* radiators under the windows */}
      {[[0.15, 5.3, Math.PI / 2], [14.85, 8.8, -Math.PI / 2]].map(([x, z, ry], i) => (
        <Group key={i} p={[x!, 0, z!]} r={[0, ry!, 0]}>
          {Array.from({ length: 10 }, (_, k) => <Box key={k} s={[0.06, 0.6, 0.08]} p={[-0.6 + k * 0.13, 0.55, 0.04]} c="#e9e4d8" shadow={false} />)}
        </Group>
      ))}
      <Bunting a={[0.3, 4.2]} b={[14.7, 10.6]} y={3.6} n={20} />
      <Bunting a={[0.3, 10.6]} b={[14.7, 4.2]} y={3.6} n={20} />
      {/* big globe pendants on long drops */}
      {[[3.5, 7.5], [7.5, 6.0], [11.5, 7.5], [7.5, 9.6]].map(([x, z]) => (
        <Group key={`${x}${z}`} p={[x!, 0, z!]}>
          <Cyl rad={0.008} h={0.7} p={[0, 3.85, 0]} c="#2b2a2e" shadow={false} />
          <Ball rad={0.22} p={[0, 3.42, 0]} c="#fff6e6" o={{ emissive: "#ffe8c0", glow: 1.1 }} shadow={false} />
        </Group>
      ))}
      <Plant p={[5.7, 0, 10.5]} s={1.1} pot={TEAL} />
      <Plant p={[9.3, 0, 10.5]} s={1.1} pot={TEAL} />
      <Group p={[7.5, 2.85, 10.89]} r={[0, Math.PI, 0]}><Sign p={[0, 0, 0]} w={0.6} h={0.2} text="EXIT" bg="#3d9a4a" glow={0.6} /></Group>
      {/* a lost-property box and a badminton net rolled up on its posts */}
      <Box s={[0.5, 0.36, 0.4]} p={[13.0, 0.18, 10.6]} c="#c9a77c" o={{ rough: 0.9 }} />
      <Group p={[13.9, 0, 8.4]}>
        {[-0.08, 0.08].map((x) => <Cyl key={x} rad={0.025} h={1.55} p={[x, 0.78, 0]} c="#2f5ea8" />)}
        <Cyl rad={0.14} h={0.03} p={[0, 0.015, 0]} c="#2b2a2e" />
        <Cyl rad={0.07} h={1.2} p={[0, 0.9, 0.09]} c="#f4ead6" o={{ rough: 1 }} />
      </Group>

      {/* ── meeting room ── */}
      <Group p={[7.9, 0, 0.45]}>
        <Box s={[0.7, 0.02, 0.5]} p={[0, 0.02, 0]} c="#2b2a2e" />
        {[-0.25, 0.25].map((x) => <Cyl key={x} rad={0.015} h={1.5} p={[x, 0.75, 0.05]} r={[0.1, 0, 0]} c="#9aa5aa" o={STEEL} shadow={false} />)}
        <Box s={[0.7, 0.9, 0.02]} p={[0, 1.4, 0.1]} c="#f8f8f4" />
        {[0, 1, 2].map((i) => <Box key={i} s={[0.4 - i * 0.08, 0.03, 0.01]} p={[-0.05, 1.65 - i * 0.15, 0.115]} c={["#2f5ea8", "#d9342a", "#3d9a4a"][i]!} shadow={false} />)}
      </Group>
      <Group p={[11.6, 1.75, 0.12]}>
        <Box s={[2.4, 1.2, 0.04]} c="#f8f8f4" />
        <Box s={[2.5, 0.05, 0.12]} p={[0, -0.63, 0.04]} c="#9aa5aa" o={STEEL} />
        <Sign p={[0, 0.42, 0.03]} w={1.4} h={0.2} text="TOWN PLAN 2026" bg={TEAL} fg={GOLD} />
        {/* the town plan sketched on the board */}
        {[[-0.7, 0, 0.5, 0.3], [-0.1, -0.1, 0.4, 0.5], [0.5, 0.05, 0.6, 0.3], [0.2, -0.38, 1.2, 0.04], [-0.42, -0.1, 0.04, 0.7]].map(([x, y, w, h], i) => <Box key={i} s={[w!, h!, 0.01]} p={[x!, y!, 0.025]} c={["#8fd0a8", "#f2c94c", "#cfe6f2", "#9aa5aa", "#9aa5aa"][i]!} shadow={false} />)}
      </Group>
      <Bookcase p={[14.65, 0, 2.0]} r={[0, -Math.PI / 2, 0]} w={1.6} h={2.0} wood={OAK_D} seed={7} files />
      {/* the town flag on a brass pole */}
      <Group p={[9.6, 0, 0.45]}>
        <Cyl rad={0.14} h={0.05} p={[0, 0.025, 0]} c={GOLD} o={BRASS} />
        <Cyl rad={0.015} h={2.3} p={[0, 1.15, 0]} c={GOLD} o={BRASS} />
        <Ball rad={0.04} p={[0, 2.32, 0]} c={GOLD} o={BRASS} />
        <Box s={[0.7, 0.45, 0.01]} p={[0.36, 1.95, 0]} c={TEAL} />
        <Box s={[0.7, 0.08, 0.012]} p={[0.36, 1.95, 0]} c={GOLD} shadow={false} />
      </Group>
      <Art p={[13.6, 2.2, 0.12]} w={0.5} h={0.65} art={4} />
      <Plant p={[14.3, 0, 3.3]} s={0.85} pot={TEAL} />
      {[9.8, 13.2].map((x) => <Group key={x} p={[x, 3.0, 1.9]}><Box s={[1.2, 0.05, 0.5]} c="#ffffff" o={{ emissive: "#fff8ec", glow: 1.1 }} shadow={false} /></Group>)}
      <Sign p={[8.5, 2.55, 3.88]} w={1.3} h={0.2} text="MEETING ROOM" bg={TEAL} fg={GOLD} />
    </Group>
  );
}