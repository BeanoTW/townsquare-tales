import { useMemo } from "react";
import { Ball, Box, Chair, Clock, Cone, Cyl, FilingCabinet, Group, Instanced, NoticeBoard, Round, STEEL, Sign, StripLight, TrafficCone, CeilingPanel, type V3 } from "./kit";

/**
 * Construction Yard: a block-and-steel builders' shed. Pallets of bricks, timber and sand, a forklift and
 * scaffolding, a tool wall, the trades board, and the foreman's portacabin office in the corner.
 */
const AMBER = "#d6a02e";
const HIVIS = "#e8d23a";
const TIMBER = "#c79a5c";

/** Interactive: heavy workbench with a vice and power tools, plus a cement mixer. */
function WorkSite() {
  return (
    <Group>
      <Group p={[-0.45, 0, -0.25]}>
        <Box s={[2.0, 0.08, 0.8]} p={[0, 0.9, 0]} c={TIMBER} o={{ rough: 0.8 }} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.08, 0.9, 0.08]} p={[x! * 0.92, 0.45, z! * 0.35]} c="#3a3d42" o={STEEL} />)}
        <Box s={[1.9, 0.04, 0.7]} p={[0, 0.25, 0]} c={TIMBER} o={{ rough: 0.9 }} shadow={false} />
        <Group p={[0.8, 0.94, 0.25]}>
          <Box s={[0.2, 0.12, 0.14]} c="#2f6fb3" o={{ rough: 0.4, metal: 0.5 }} />
          <Cyl rad={0.012} h={0.25} p={[0, 0.0, 0.12]} r={[0, 0, Math.PI / 2]} c="#aab3b8" o={STEEL} shadow={false} />
        </Group>
        <Group p={[-0.3, 0.97, 0.05]} r={[0, 0.4, 0]}>
          <Round s={[0.32, 0.12, 0.1]} c={HIVIS} rad={0.03} />
          <Cyl rad={0.06} h={0.03} p={[0.18, 0, 0]} r={[0, 0, Math.PI / 2]} c="#aab3b8" o={STEEL} shadow={false} />
        </Group>
        <Box s={[0.5, 0.004, 0.36]} p={[0.2, 0.945, -0.1]} r={[0, -0.1, 0]} c="#cfe3f2" shadow={false} />
        <Ball rad={0.13} p={[-0.75, 1.02, -0.15]} sc={[0.14, 0.09, 0.16]} c={HIVIS} />
        {[0, 1, 2].map((i) => <Box key={i} s={[0.3, 0.02, 0.03]} p={[-0.1 + i * 0.12, 0.96, 0.3]} r={[0, i * 0.4, 0]} c={["#c0392b", "#2b2a2e", "#aab3b8"][i]!} shadow={false} />)}
      </Group>
      {/* cement mixer on a stand */}
      <Group p={[1.15, 0, 0.25]}>
        <Box s={[0.6, 0.06, 0.4]} p={[0, 0.25, 0]} c="#3a3d42" o={STEEL} />
        {[-0.25, 0.25].map((x) => <Cyl key={x} rad={0.12} h={0.06} p={[x, 0.12, 0.2]} r={[Math.PI / 2, 0, 0]} c="#1a1a1f" />)}
        <Group p={[0, 0.7, 0]} r={[0.5, 0, 0]}>
          <Cyl rad={0.32} h={0.5} c="#e8743b" o={{ rough: 0.5 }} />
          <Cone rad={0.32} h={0.25} p={[0, 0.37, 0]} c="#e8743b" o={{ rough: 0.5 }} />
          <Cyl rad={0.14} h={0.06} p={[0, 0.5, 0]} c="#5a5650" shadow={false} />
        </Group>
        <Box s={[0.06, 0.55, 0.06]} p={[-0.32, 0.5, 0]} c="#3a3d42" o={STEEL} />
      </Group>
    </Group>
  );
}

/** Interactive: the trades board with job cards (on the back wall). */
function TradesBoard() {
  return (
    <Group>
      <NoticeBoard p={[0, 1.65, -0.05]} w={1.7} h={1.1} header="TRADES WANTED" frame={AMBER} cork="#c49a6c" />
      {[-0.6, 0.6].map((x) => <Box key={x} s={[0.04, 0.12, 0.08]} p={[x, 1.0, 0.0]} c="#3a3d42" shadow={false} />)}
      <Ball rad={0.12} p={[-0.6, 1.1, 0.08]} sc={[0.13, 0.08, 0.15]} c={HIVIS} />
      <Ball rad={0.12} p={[0.6, 1.1, 0.08]} sc={[0.13, 0.08, 0.15]} c="#f4f1ea" />
    </Group>
  );
}

/** Interactive: the foreman's desk with drawings, a phone and a mug. */
function ForemanDesk() {
  return (
    <Group>
      <Round s={[1.9, 0.05, 0.8]} p={[0, 0.74, 0]} c="#9c8b72" rad={0.015} />
      {[-0.85, 0.85].map((x) => <Box key={x} s={[0.06, 0.72, 0.75]} p={[x, 0.36, 0]} c="#5b6a73" o={STEEL} />)}
      <Box s={[0.9, 0.004, 0.6]} p={[-0.2, 0.768, 0.0]} r={[0, 0.08, 0]} c="#cfe3f2" shadow={false} />
      {[0.2, 0.35, 0.5].map((x) => <Box key={x} s={[0.012, 0.006, 0.5]} p={[x - 0.4, 0.772, 0]} c="#2a4a8a" shadow={false} />)}
      <Box s={[0.18, 0.06, 0.22]} p={[0.6, 0.79, -0.15]} c="#2b2a2e" shadow={false} />
      <Cyl rad={0.045} h={0.1} p={[0.55, 0.81, 0.2]} c="#f4f1ea" shadow={false} />
      <Ball rad={0.13} p={[0.35, 0.86, -0.25]} sc={[0.14, 0.09, 0.16]} c="#f2c846" />
      <Chair p={[0, 0, -0.62]} frame="#3a3d42" cushion="#2b2a2e" />
    </Group>
  );
}

function BrickPallet({ p }: { p: V3 }) {
  const bricks = useMemo(() => {
    const out: { p: V3; s: V3; c: number }[] = [];
    for (let y = 0; y < 6; y++) for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) out.push({ p: [-0.36 + i * 0.24, 0.16 + y * 0.09, -0.24 + j * 0.24], s: [0.22, 0.075, 0.22], c: (y + i + j) % 3 });
    return out;
  }, []);
  return (
    <Group p={p}>
      <Box s={[1.0, 0.12, 0.8]} p={[0, 0.06, 0]} c={TIMBER} o={{ rough: 0.9 }} />
      <Instanced items={bricks} colours={["#b5634b", "#a8553f", "#c06e52"]} rough={0.95} />
      <Box s={[1.02, 0.02, 0.82]} p={[0, 0.7, 0]} c="#dff0f5" o={{ opacity: 0.25 }} shadow={false} />
    </Group>
  );
}

function Forklift({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Round s={[0.95, 0.5, 1.2]} p={[0, 0.45, 0.15]} c={AMBER} rad={0.06} o={{ rough: 0.45 }} />
      <Round s={[0.95, 0.4, 0.4]} p={[0, 0.5, 0.75]} c="#3a3d42" rad={0.06} />
      {[[-0.45, -0.2], [0.45, -0.2], [-0.45, 0.6], [0.45, 0.6]].map(([x, z]) => <Cyl key={`${x}${z}`} rad={0.2} h={0.18} p={[x!, 0.2, z!]} r={[0, 0, Math.PI / 2]} c="#1a1a1f" />)}
      {/* overhead guard, seat and steering wheel */}
      {[[-0.4, -0.25], [0.4, -0.25], [-0.4, 0.55], [0.4, 0.55]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.05, 1.3, 0.05]} p={[x!, 1.3, z!]} c="#2b2a2e" o={STEEL} />)}
      <Box s={[0.9, 0.05, 0.9]} p={[0, 1.95, 0.15]} c="#2b2a2e" o={STEEL} />
      <Round s={[0.45, 0.1, 0.4]} p={[0, 0.75, 0.3]} c="#1a1a1f" rad={0.03} />
      <Cyl rad={0.14} h={0.03} p={[0, 1.05, -0.05]} r={[0.9, 0, 0]} c="#1a1a1f" shadow={false} />
      {/* mast and forks with a pallet */}
      {[-0.3, 0.3].map((x) => <Box key={x} s={[0.07, 2.0, 0.07]} p={[x, 1.0, -0.6]} c="#3a3d42" o={STEEL} />)}
      {[-0.22, 0.22].map((x) => <Box key={x} s={[0.08, 0.04, 0.8]} p={[x, 0.18, -1.0]} c="#3a3d42" o={STEEL} />)}
      <Box s={[0.8, 0.1, 0.8]} p={[0, 0.25, -1.0]} c={TIMBER} o={{ rough: 0.9 }} />
      <Box s={[0.7, 0.4, 0.7]} p={[0, 0.5, -1.0]} c="#b88b5f" o={{ rough: 0.9 }} />
    </Group>
  );
}

function Drum({ p, c }: { p: V3; c: string }) {
  return (
    <Group p={p}>
      <Cyl rad={0.28} h={0.88} p={[0, 0.44, 0]} c={c} o={{ rough: 0.5, metal: 0.3 }} />
      {[0.3, 0.6].map((y) => <Cyl key={y} rad={0.285} h={0.03} p={[0, y, 0]} c="#2b2a2e" o={STEEL} shadow={false} />)}
    </Group>
  );
}

function Wheelbarrow({ p, r = 0 }: { p: V3; r?: number }) {
  return (
    <Group p={p} r={[0, r, 0]}>
      <Round s={[0.55, 0.28, 0.8]} p={[0, 0.42, 0]} c="#2f6a4a" rad={0.06} o={{ rough: 0.5, metal: 0.3 }} />
      <Cyl rad={0.16} h={0.06} p={[0, 0.16, 0.5]} r={[0, 0, Math.PI / 2]} c="#1a1a1f" />
      {[-0.22, 0.22].map((x) => <Box key={x} s={[0.04, 0.04, 1.0]} p={[x, 0.42, -0.25]} r={[0.25, 0, 0]} c="#3a3d42" o={STEEL} />)}
    </Group>
  );
}

export function YardFixture({ id }: { id: string }) {
  switch (id) {
    case "site": return <WorkSite />;
    case "trades-board": return <TradesBoard />;
    case "foreman": return <ForemanDesk />;
    default: return null;
  }
}

export function YardDecor() {
  const planks = useMemo(() => Array.from({ length: 18 }, (_, i) => ({ p: [0, 0.1 + Math.floor(i / 6) * 0.1, -0.3 + (i % 6) * 0.12] as V3, s: [3.0, 0.08, 0.11] as V3, c: i % 3 })), []);
  return (
    <Group>
      <BrickPallet p={[0.85, 0, 5.9]} />
      <BrickPallet p={[1.85, 0, 5.9]} />
      <Group p={[1.8, 0, 7.6]}><Instanced items={planks} colours={[TIMBER, "#b8894f", "#d4a86a"]} rough={0.85} /></Group>
      {/* sand pile with a shovel */}
      <Ball rad={0.9} p={[6.6, 0.0, 5.3]} sc={[0.85, 0.55, 0.75]} c="#d9c08a" o={{ rough: 1 }} />
      <Group p={[6.9, 0.55, 5.0]} r={[0.3, 0, -0.5]}>
        <Cyl rad={0.02} h={1.1} c="#8a6a45" />
        <Box s={[0.22, 0.28, 0.02]} p={[0, -0.6, 0]} c="#5a6066" o={STEEL} />
      </Group>
      {/* scaffold poles racked on the left wall, ladders and a tool wall on the back */}
      {[0.6, 1.1, 1.6, 2.1].map((y) => <Box key={y} s={[0.4, 0.05, 0.05]} p={[0.35, y, 1.2]} c="#3a3d42" o={STEEL} shadow={false} />)}
      {[0.6, 1.1, 1.6, 2.1].map((y) => <Box key={`b${y}`} s={[0.4, 0.05, 0.05]} p={[0.35, y, 3.6]} c="#3a3d42" o={STEEL} shadow={false} />)}
      {[0.66, 1.16, 1.66].map((y) => [0.25, 0.4].map((x) => <Cyl key={`${y}${x}`} rad={0.024} h={3.8} p={[x, y, 2.4]} r={[Math.PI / 2, 0, 0]} c="#aab3b8" o={STEEL} />))}
      <Group p={[3.6, 0, 0.14]}>
        <Box s={[2.8, 1.3, 0.03]} p={[0, 1.75, 0]} c="#c79a5c" o={{ rough: 0.9 }} />
        {[[-1.1, 2.1], [-0.7, 2.0], [-0.3, 2.15], [0.2, 1.95], [0.7, 2.1], [1.1, 1.9], [-0.9, 1.45], [-0.2, 1.4], [0.5, 1.5], [1.0, 1.4]].map(([x, y], i) => (
          <Box key={i} s={[i % 3 ? 0.06 : 0.22, i % 3 ? 0.35 : 0.06, 0.04]} p={[x!, y!, 0.03]} c={["#c0392b", "#2b2a2e", "#2f6fb3", "#aab3b8"][i % 4]!} shadow={false} />
        ))}
      </Group>
      {[5.6, 6.0].map((x, i) => (
        <Group key={x} p={[x, 0, 0.35]} r={[-0.18 - i * 0.05, 0, 0]}>
          {[-0.2, 0.2].map((s) => <Box key={s} s={[0.05, 2.8, 0.05]} p={[s, 1.4, 0]} c="#aab3b8" o={STEEL} />)}
          {Array.from({ length: 8 }, (_, k) => <Box key={k} s={[0.4, 0.03, 0.03]} p={[0, 0.3 + k * 0.32, 0]} c="#aab3b8" o={STEEL} shadow={false} />)}
        </Group>
      ))}
      <Forklift p={[9.4, 0, 6.8]} />
      {[[13.95, 8.95, "#2f6fb3"], [14.5, 8.95, "#c0392b"], [13.95, 9.5, "#2f6fb3"], [14.5, 9.5, "#3a3d42"]].map(([x, z, c], i) => <Drum key={i} p={[x as number, 0, z as number]} c={c as string} />)}
      {/* steel beams and the generator */}
      {[0, 1, 2].map((i) => (
        <Group key={i} p={[13.0, 0.08 + i * 0.16, 6.55]}>
          <Box s={[3.1, 0.02, 0.22]} p={[0, 0.07, 0]} c="#7f8b90" o={STEEL} />
          <Box s={[3.1, 0.12, 0.02]} p={[0, 0, 0]} c="#7f8b90" o={STEEL} />
          <Box s={[3.1, 0.02, 0.22]} p={[0, -0.07, 0]} c="#7f8b90" o={STEEL} />
        </Group>
      ))}
      <Group p={[14.3, 0, 7.6]}>
        <Round s={[0.95, 0.75, 0.7]} p={[0, 0.4, 0]} c={HIVIS} rad={0.05} o={{ rough: 0.5 }} />
        <Box s={[0.3, 0.2, 0.02]} p={[-0.2, 0.55, 0.36]} c="#2b2a2e" shadow={false} />
        <Cyl rad={0.04} h={0.3} p={[0.3, 0.9, -0.2]} c="#3a3d42" shadow={false} />
      </Group>
      <Wheelbarrow p={[4.6, 0, 4.4]} r={0.6} />
      <Wheelbarrow p={[3.4, 0, 9.0]} r={-0.4} />
      {[[4.4, 8.7], [9.6, 8.9], [10.4, 3.4]].map(([x, z]) => <TrafficCone key={`${x}${z}`} p={[x!, 0, z!]} />)}
      {/* hazard stripes at the roller door and yellow walkway lines */}
      {Array.from({ length: 10 }, (_, i) => <Box key={i} s={[0.4, 0.012, 0.25]} p={[5.2 + i * 0.4, 0.016, 9.75]} c={i % 2 ? "#1a1a1f" : HIVIS} shadow={false} />)}
      <Box s={[0.08, 0.01, 6.0]} p={[4.9, 0.018, 6.5]} c={HIVIS} shadow={false} />
      <Box s={[0.08, 0.01, 6.0]} p={[9.1, 0.018, 6.5]} c={HIVIS} shadow={false} />
      {/* safety signs and the yard banner */}
      <Sign p={[0.12, 2.9, 7.0]} r={[0, Math.PI / 2, 0]} w={2.2} h={0.4} text="HARD HATS ON" bg={HIVIS} fg="#1a1a1f" />
      <Sign p={[8.5, 3.4, 0.13]} w={3.0} h={0.45} text="TOWN BUILDERS LTD" bg="#2b2a2e" fg={HIVIS} border={AMBER} />
      {[[3.0, 3.0], [8.0, 3.0], [3.0, 7.0], [8.0, 7.0]].map(([x, z]) => <StripLight key={`${x}${z}`} p={[x!, 3.75, z!]} w={2.2} />)}
      {/* foreman's cabin: filing, a wall planner, hi-vis on hooks, a heater */}
      <FilingCabinet p={[11.6, 0, 0.5]} c="#5b6a73" />
      <Group p={[14.88, 1.45, 2.4]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[1.6, 0.9, 0.02]} c="#f4f1ea" shadow={false} />
        {Array.from({ length: 12 }, (_, i) => <Box key={i} s={[0.1, 0.06, 0.004]} p={[-0.65 + (i % 6) * 0.26, 0.2 - Math.floor(i / 6) * 0.3, 0.012]} c={["#c0392b", "#2f6fb3", "#4f8a3e"][i % 3]!} shadow={false} />)}
        <Sign p={[0, 0.38, 0.012]} w={0.8} h={0.1} text="SITE PLANNER" bg="#2b2a2e" />
      </Group>
      {[13.6, 14.0].map((x, i) => (
        <Group key={x} p={[x, 1.55, 4.42]}>
          <Box s={[0.04, 0.04, 0.06]} c="#3a3d42" shadow={false} />
          <Round s={[0.34, 0.6, 0.08]} p={[0, -0.32, -0.02]} c={i ? "#e8743b" : HIVIS} rad={0.03} />
        </Group>
      ))}
      <Clock p={[12.4, 2.1, 0.13]} />
      <CeilingPanel p={[11.6, 2.45, 2.3]} w={0.5} d={0.9} colour="#f2f6ff" />
      <CeilingPanel p={[13.1, 2.45, 2.3]} w={0.5} d={0.9} colour="#f2f6ff" />
      {/* a steel step up to the portacabin door */}
      <Box s={[1.2, 0.12, 0.4]} p={[12.3, 0.06, 4.85]} c="#7f8b90" o={STEEL} />
    </Group>
  );
}

