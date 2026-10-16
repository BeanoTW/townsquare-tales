import { DoorMat, Splashback } from "../decor";
import { Art, Ball, Box, CeilingPanel, ChairRow, Clock, Counter, Cyl, Group, Instanced, Monitor, Plant, Round, STEEL, Sign, Table, WaterCooler, type V3 } from "./kit";

/**
 * Patch Up Clinic: a bright mint-and-white surgery. A waiting room with linked seating, reception and the
 * dispensary hatch; through the door, a curtained treatment room with two bays, a sink and supplies.
 */
const MINT = "#4f9a87";
const WHITE = "#f4f7f6";
const CURTAIN = "#8fc0d8";

/** Hospital bed with rails, pillow and blanket; head toward −z. */
function HospitalBed({ occupied = false }: { occupied?: boolean }) {
  return (
    <Group>
      <Box s={[0.95, 0.06, 2.05]} p={[0, 0.55, 0]} c="#c9ced2" o={STEEL} />
      {[[-0.42, -0.95], [0.42, -0.95], [-0.42, 0.95], [0.42, 0.95]].map(([x, z]) => (
        <Group key={`${x}${z}`} p={[x!, 0, z!]}>
          <Box s={[0.04, 0.52, 0.04]} p={[0, 0.28, 0]} c="#aab3b8" o={STEEL} shadow={false} />
          <Ball rad={0.04} p={[0, 0.04, 0]} c="#2b2a2e" shadow={false} />
        </Group>
      ))}
      <Round s={[0.9, 0.16, 1.95]} p={[0, 0.66, 0]} c={WHITE} rad={0.05} />
      <Round s={[0.6, 0.1, 0.32]} p={[0, 0.78, -0.75]} c="#ffffff" rad={0.04} />
      <Round s={[0.92, 0.06, 1.1]} p={[0, 0.77, 0.35]} c={CURTAIN} rad={0.02} />
      <Box s={[0.95, 0.5, 0.05]} p={[0, 0.85, -1.0]} c="#c9ced2" o={STEEL} />
      <Box s={[0.95, 0.3, 0.05]} p={[0, 0.75, 1.0]} c="#c9ced2" o={STEEL} />
      {[-1, 1].map((s) => <Box key={s} s={[0.03, 0.2, 1.1]} p={[s * 0.47, 0.85, 0.1]} c="#d5dade" o={STEEL} shadow={false} />)}
      {occupied && <Round s={[0.4, 0.14, 0.9]} p={[0, 0.84, 0.0]} c={CURTAIN} rad={0.06} />}
    </Group>
  );
}

/** Bay curtain rail with two drawn-back curtains around a bed space. */
function BayCurtain({ p, w = 1.6, d = 2.6 }: { p: V3; w?: number; d?: number }) {
  return (
    <Group p={p}>
      <Box s={[w, 0.03, 0.03]} p={[0, 2.45, d / 2]} c="#d5dade" o={STEEL} shadow={false} />
      <Box s={[0.03, 0.03, d]} p={[-w / 2, 2.45, 0]} c="#d5dade" o={STEEL} shadow={false} />
      <Box s={[0.03, 0.03, d]} p={[w / 2, 2.45, 0]} c="#d5dade" o={STEEL} shadow={false} />
      {[-1, 1].map((s) => (
        <Group key={s} p={[s * (w / 2), 1.5, d / 2 - 0.35]}>
          <Round s={[0.08, 1.85, 0.6]} c={CURTAIN} rad={0.03} o={{ rough: 1 }} />
          {[-0.2, 0, 0.2].map((z) => <Box key={z} s={[0.1, 1.83, 0.012]} p={[0, 0, z]} c="#7aaecb" shadow={false} />)}
        </Group>
      ))}
    </Group>
  );
}

/** Interactive: treatment bed with an IV stand, observation monitor and the bay curtains. */
function TreatmentBay() {
  return (
    <Group>
      <HospitalBed />
      <Group p={[-0.7, 0, -0.6]}>
        <Cyl rad={0.2} h={0.03} p={[0, 0.04, 0]} c="#aab3b8" o={STEEL} shadow={false} />
        <Cyl rad={0.015} h={1.9} p={[0, 0.98, 0]} c="#d5dade" o={STEEL} />
        <Box s={[0.14, 0.22, 0.05]} p={[0.06, 1.8, 0]} c="#dff0f5" o={{ opacity: 0.6, rough: 0.1 }} shadow={false} />
      </Group>
      <Group p={[0.75, 0, -0.85]}>
        <Box s={[0.05, 1.4, 0.05]} p={[0, 0.7, 0]} c="#aab3b8" o={STEEL} />
        <Round s={[0.42, 0.32, 0.08]} p={[0, 1.55, 0.05]} r={[0, -0.4, 0]} c="#2b2a2e" rad={0.02} />
        <Box s={[0.36, 0.25, 0.005]} p={[-0.02, 1.55, 0.095]} r={[0, -0.4, 0]} c="#0f2030" o={{ emissive: "#6fe3a8", glow: 0.9 }} shadow={false} />
      </Group>
      <BayCurtain p={[0, 0, 0]} />
    </Group>
  );
}

/** Interactive: the dispensary: counter, medicine shelving and the green pharmacy cross. */
function Dispensary() {
  const boxes = Array.from({ length: 40 }, (_, i) => ({ p: [-1.2 + (i % 10) * 0.27, 0.95 + Math.floor(i / 10) * 0.36, -0.85] as V3, s: [0.22, 0.16, 0.16] as V3, c: i % 5 }));
  return (
    <Group>
      <Counter p={[0, 0, 0.05]} w={2.7} d={0.6} h={1.0} body={WHITE} top="#d6e7e1" front={MINT} />
      <Box s={[2.6, 0.7, 0.02]} p={[0, 1.4, -0.24]} c="#dff0f5" o={{ opacity: 0.3, rough: 0.05 }} shadow={false} />
      <Instanced items={boxes} colours={["#f4f1ea", "#4f9a87", "#d9695a", "#4a8fd9", "#e0b84a"]} />
      {[0.86, 1.22, 1.58, 1.94].map((y) => <Box key={y} s={[2.9, 0.03, 0.3]} p={[0, y, -0.85]} c={WHITE} shadow={false} />)}
      <Monitor p={[-0.8, 1.0, -0.1]} r={[0, Math.PI, 0]} w={0.4} />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.12, 0.16, 0.08]} p={[0.5 + i * 0.15, 1.08, 0.1]} c="#f4f1ea" shadow={false} />)}
      <Group p={[0, 2.35, -0.3]}>
        <Box s={[0.12, 0.42, 0.06]} c="#3db36b" o={{ emissive: "#4dff8f", glow: 0.9 }} />
        <Box s={[0.42, 0.12, 0.06]} c="#3db36b" o={{ emissive: "#4dff8f", glow: 0.9 }} />
      </Group>
      <Sign p={[0.9, 2.35, -0.3]} w={0.9} h={0.2} text="PHARMACY" bg={MINT} />
    </Group>
  );
}

export function ClinicFixture({ id }: { id: string }) {
  switch (id) {
    case "cabinet": return <Dispensary />;
    case "treatment-bed": return <TreatmentBay />;
    default: return null;
  }
}

export function ClinicDecor() {
  return (
    <Group>
      {/* reception desk with a screen and hand gel */}
      <Group p={[1.5, 0, 5.8]}>
        <Counter p={[0, 0, 0]} w={2.2} d={0.7} h={1.05} body={WHITE} top={MINT} front={MINT} />
        <Monitor p={[0.4, 1.05, -0.2]} r={[0, Math.PI, 0]} w={0.42} />
        <Cyl rad={0.035} h={0.16} p={[-0.6, 1.13, 0.2]} c="#dff0f5" o={{ opacity: 0.7 }} shadow={false} />
        <Sign p={[0, 1.75, -0.36]} w={1.1} h={0.2} text="RECEPTION" bg={MINT} />
      </Group>
      {/* waiting seats, a magazine table, a children's corner and the water cooler */}
      <ChairRow p={[5.2, 0, 4.1]} n={6} c={MINT} />
      <ChairRow p={[1.95, 0, 8.55]} r={[0, Math.PI, 0]} n={6} c="#5c8fc0" />
      <Table p={[5.2, 0, 5.4]} w={0.8} d={0.5} h={0.42} top="#e9eef2" leg="#aab3b8" />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.2, 0.01, 0.28]} p={[5.0 + i * 0.18, 0.45 + i * 0.008, 5.4]} r={[0, 0.2 * i, 0]} c={["#d9695a", "#4a8fd9", "#e0b84a"][i]!} shadow={false} />)}
      <Group p={[6.6, 0, 7.6]}>
        <Round s={[1.4, 0.03, 1.2]} p={[0, 0.02, 0]} c="#f3d36a" rad={0.01} o={{ rough: 1 }} shadow={false} />
        {[[-0.3, 0.1, "#d9574a"], [0.1, -0.2, "#4a8fd9"], [0.35, 0.25, "#4f8a3e"], [-0.1, 0.35, "#e0b84a"]].map(([x, z, c], i) => <Box key={i} s={[0.16, 0.16, 0.16]} p={[x as number, 0.11, z as number]} r={[0, i * 0.4, 0]} c={c as string} />)}
        <Ball rad={0.12} p={[0.3, 0.14, -0.25]} c="#d9574a" />
      </Group>
      <WaterCooler p={[7.15, 0, 0.55]} />
      <Plant p={[0.5, 0, 0.5]} s={1.0} pot={MINT} />
      <Plant p={[7.1, 0, 8.5]} s={0.9} pot={MINT} />
      <DoorMat p={[4.9, 8.5]} />
      {/* health posters, a clock and the waiting-room screen */}
      <Sign p={[0.12, 2.2, 2.0]} r={[0, Math.PI / 2, 0]} w={1.0} h={0.6} text="WASH YOUR HANDS" bg="#ffffff" fg={MINT} border={MINT} />
      <Art p={[0.12, 1.7, 6.9]} r={[0, Math.PI / 2, 0]} w={0.6} h={0.75} art={0} />
      <Clock p={[6.0, 2.5, 0.13]} />
      <Group p={[6.4, 1.9, 0.14]}>
        <Round s={[1.0, 0.6, 0.06]} c="#1a1a1f" rad={0.02} />
        <Box s={[0.92, 0.52, 0.005]} p={[0, 0, 0.032]} c="#0f2030" o={{ emissive: "#9fe0c8", glow: 0.6 }} shadow={false} />
        <Sign p={[0, 0.1, 0.04]} w={0.7} h={0.14} text="Now seeing: 42" bg="#0f2030" fg="#9fe0c8" border="#0f2030" />
      </Group>
      {/* treatment room: second bay, medical cart, sink, supply cabinets, scales and an eye chart */}
      <Group p={[12.4, 0, 2.6]}><HospitalBed occupied /></Group>
      <BayCurtain p={[12.4, 0, 2.6]} w={1.3} />
      <Group p={[8.3, 0, 1.3]}>
        <Round s={[0.55, 0.85, 0.5]} p={[0, 0.45, 0]} c="#e9eef2" rad={0.03} />
        {[0.25, 0.5, 0.75].map((y) => <Box key={y} s={[0.5, 0.2, 0.01]} p={[0, y, 0.255]} c={["#d9574a", "#4a8fd9", "#e0b84a"][Math.round(y * 4) % 3]!} shadow={false} />)}
        <Box s={[0.18, 0.08, 0.12]} p={[0, 0.93, 0]} c="#c9ced2" o={STEEL} shadow={false} />
      </Group>
      <Group p={[10.0, 0, 8.65]}>
        <Counter p={[0, 0, 0]} w={2.0} d={0.5} h={0.9} body={WHITE} top="#d6e7e1" />
        <Box s={[0.5, 0.04, 0.35]} p={[0, 0.91, 0]} c="#c9ced2" o={STEEL} shadow={false} />
        <Cyl rad={0.012} h={0.3} p={[0, 1.05, -0.15]} c="#d5dade" o={STEEL} shadow={false} />
        <Box s={[0.3, 0.35, 0.12]} p={[0.7, 1.4, -0.2]} c="#f4f1ea" shadow={false} />
        <Splashback p={[0, 1.25, -0.24]} w={2.0} />
      </Group>
      {[5.5, 6.3, 7.1].map((z) => (
        <Group key={z} p={[12.65, 0, z]} r={[0, -Math.PI / 2, 0]}>
          <Box s={[0.75, 1.9, 0.45]} p={[0, 0.95, 0]} c={WHITE} o={{ rough: 0.4 }} />
          <Box s={[0.7, 1.0, 0.02]} p={[0, 1.35, 0.23]} c="#dff0f5" o={{ opacity: 0.4, rough: 0.05 }} shadow={false} />
          <Box s={[0.012, 0.2, 0.03]} p={[0.3, 0.6, 0.24]} c="#2b2a2e" shadow={false} />
        </Group>
      ))}
      <Group p={[9.0, 0, 5.0]}>
        <Box s={[0.4, 0.05, 0.4]} p={[0, 0.03, 0]} c="#c9ced2" o={STEEL} />
        <Box s={[0.05, 1.3, 0.05]} p={[0, 0.65, -0.15]} c="#c9ced2" o={STEEL} />
        <Box s={[0.18, 0.12, 0.05]} p={[0, 1.35, -0.15]} c="#2b2a2e" shadow={false} />
      </Group>
      <Group p={[12.88, 1.6, 8.0]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[0.5, 0.75, 0.02]} c="#ffffff" shadow={false} />
        {[0.25, 0.12, 0.0, -0.1, -0.2].map((y, i) => <Box key={y} s={[0.36 - i * 0.06, 0.06 - i * 0.008, 0.004]} p={[0, y, 0.012]} c="#1a1a1f" shadow={false} />)}
      </Group>
      {[[3.5, 3.0], [3.5, 6.8], [10.4, 2.6], [10.4, 6.6]].map(([x, z]) => <CeilingPanel key={`${x}${z}`} p={[x!, 3.08, z!]} />)}
    </Group>
  );
}
