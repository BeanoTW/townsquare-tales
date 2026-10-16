import { DoorMat } from "../decor";
import { Art, Ball, Box, CeilingPanel, ChairRow, Clock, Counter, Cyl, FilingCabinet, Group, Keyboard, Monitor, NoticeBoard, OfficeChair, Plant, Round, STEEL, Sign, WaterCooler, type V3 } from "./kit";

/**
 * Town Police: a blue-grey station. Reception with the front desk behind security glass and steel benches;
 * through the door, the squad room with desks, evidence lockers, the wanted board and a holding cell.
 */
const NAVY = "#273e58";
const BLUE = "#2c4462";
const CHECK = "#e8e3d0";

/** Battenburg band along a counter front: blue and yellow-white squares. */
function Battenburg({ w, y, z }: { w: number; y: number; z: number }) {
  const n = Math.floor(w / 0.2);
  return <Group>{Array.from({ length: n }, (_, i) => <Box key={i} s={[0.2, 0.12, 0.01]} p={[-w / 2 + 0.1 + i * 0.2, y, z]} c={i % 2 ? "#2f63c9" : CHECK} shadow={false} />)}</Group>;
}

/** Interactive: the front desk behind toughened glass, with a speaking grille, intercom and paperwork. */
function FrontDesk() {
  return (
    <Group>
      <Counter p={[0, 0, 0]} w={4.1} d={0.9} h={1.05} body="#d9dfe5" top="#3a4252" front={BLUE} />
      <Battenburg w={4.0} y={0.85} z={0.47} />
      <Box s={[4.0, 1.0, 0.04]} p={[0, 1.6, -0.1]} c="#dff0f5" o={{ opacity: 0.32, rough: 0.05 }} shadow={false} />
      <Box s={[4.06, 0.06, 0.08]} p={[0, 2.12, -0.1]} c="#aab3b8" o={STEEL} shadow={false} />
      {[-2.0, 0, 2.0].map((x) => <Box key={x} s={[0.06, 1.05, 0.08]} p={[x, 1.6, -0.1]} c="#aab3b8" o={STEEL} shadow={false} />)}
      <Cyl rad={0.09} h={0.01} p={[-0.9, 1.4, -0.07]} r={[Math.PI / 2, 0, 0]} c="#aab3b8" o={STEEL} shadow={false} />
      <Box s={[0.4, 0.06, 0.25]} p={[-0.9, 1.07, 0.2]} c="#aab3b8" o={STEEL} shadow={false} />
      <Group p={[0.9, 1.05, -0.3]}><Monitor p={[0, 0, 0]} r={[0, Math.PI, 0]} w={0.45} /></Group>
      <Box s={[0.18, 0.1, 0.12]} p={[-0.2, 1.1, 0.3]} c="#2b2a2e" shadow={false} />
      <Box s={[0.012, 0.012, 0.02]} p={[-0.2, 1.16, 0.37]} c="#6fe3a8" o={{ emissive: "#6fe3a8", glow: 1 }} shadow={false} />
      {[0, 1].map((i) => <Box key={i} s={[0.22, 0.004, 0.3]} p={[0.4 + i * 0.03, 1.07 + i * 0.004, 0.25]} r={[0, 0.1 * i, 0]} c="#fdfbf2" shadow={false} />)}
      <Sign p={[0, 2.35, -0.1]} w={1.4} h={0.24} text="ENQUIRIES" bg={NAVY} />
      <OfficeChair p={[0.9, 0, -0.95]} c={NAVY} />
    </Group>
  );
}

/** Interactive: the wanted board with mugshots, a map and red string. */
function WantedBoard() {
  return (
    <Group>
      <NoticeBoard p={[0, 1.65, -0.36]} w={1.6} h={1.05} header="WANTED" frame={NAVY} cork="#c49a6c" />
      {[[-0.5, 1.75], [0, 1.85], [0.5, 1.7], [-0.25, 1.4], [0.3, 1.38]].map(([x, y], i) => (
        <Group key={i} p={[x!, y!, -0.315]}>
          <Box s={[0.2, 0.24, 0.004]} c="#e9e3d0" shadow={false} />
          <Ball rad={0.05} p={[0, 0.03, 0.004]} sc={[0.05, 0.06, 0.004]} c="#4a4f55" shadow={false} />
        </Group>
      ))}
      {[[-0.5, 1.75, 0, 1.85], [0, 1.85, 0.5, 1.7], [-0.25, 1.4, 0.3, 1.38]].map(([x0, y0, x1, y1], i) => {
        const len = Math.hypot(x1! - x0!, y1! - y0!);
        return <Box key={i} s={[len, 0.008, 0.004]} p={[(x0! + x1!) / 2, (y0! + y1!) / 2, -0.31]} r={[0, 0, Math.atan2(y1! - y0!, x1! - x0!)]} c="#c0392b" shadow={false} />;
      })}
    </Group>
  );
}

function SquadDesk({ p, r = 0 }: { p: V3; r?: number }) {
  return (
    <Group p={p} r={[0, r, 0]}>
      <Round s={[1.35, 0.05, 0.85]} p={[0, 0.74, 0]} c="#d9dfe5" rad={0.015} />
      {[-0.62, 0.62].map((x) => <Box key={x} s={[0.05, 0.72, 0.8]} p={[x, 0.37, 0]} c="#7d8b9c" o={STEEL} shadow={false} />)}
      <Monitor p={[0.15, 0.77, -0.22]} w={0.48} />
      <Keyboard p={[0.15, 0.78, 0.1]} />
      <Cyl rad={0.04} h={0.1} p={[-0.45, 0.82, 0.05]} c="#f4f1ea" shadow={false} />
      <Box s={[0.22, 0.004, 0.3]} p={[-0.35, 0.77, -0.15]} c="#fdfbf2" shadow={false} />
      <Box s={[0.08, 0.14, 0.05]} p={[0.55, 0.84, -0.25]} c="#1a1a1f" shadow={false} />
    </Group>
  );
}

export function PoliceFixture({ id }: { id: string }) {
  switch (id) {
    case "front-desk": return <FrontDesk />;
    case "wanted": return <WantedBoard />;
    default: return null;
  }
}

export function PoliceDecor() {
  return (
    <Group>
      {/* screens either side of the desk keep the public out of the office */}
      {[[0.57, 0.95], [5.97, 1.25]].map(([x, w]) => (
        <Group key={x} p={[x!, 0, 5.3]}>
          <Counter p={[0, 0, 0]} w={w!} d={0.6} h={1.05} body="#d9dfe5" top="#3a4252" front={BLUE} />
          <Box s={[w!, 1.0, 0.04]} p={[0, 1.6, 0]} c="#dff0f5" o={{ opacity: 0.32, rough: 0.05 }} shadow={false} />
        </Group>
      ))}
      {/* staff side: CCTV wall, desks, cabinets, radio chargers and the station crest */}
      <Group p={[3.3, 0, 0.18]}>
        {[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => (
          <Group key={`${r}${c}`} p={[-1.05 + c * 0.7, 1.4 + r * 0.42, 0]}>
            <Round s={[0.64, 0.38, 0.06]} c="#1a1a1f" rad={0.01} />
            <Box s={[0.58, 0.32, 0.005]} p={[0, 0, 0.032]} c="#2a3a4a" o={{ emissive: ["#8fb0c8", "#a8c4a0", "#c8b8a0"][(r + c) % 3]!, glow: 0.45 }} shadow={false} />
          </Group>
        )))}
        <Box s={[3.0, 0.05, 0.55]} p={[0, 0.76, 0.3]} c="#d9dfe5" />
        <Box s={[2.9, 0.72, 0.5]} p={[0, 0.36, 0.3]} c="#7d8b9c" o={STEEL} />
        <Keyboard p={[-0.6, 0.79, 0.35]} />
        <Keyboard p={[0.6, 0.79, 0.35]} />
        <OfficeChair p={[-0.6, 0, 1.0]} r={[0, Math.PI, 0]} c={NAVY} />
      </Group>
      {[0.5, 1.0].map((x) => <FilingCabinet key={x} p={[x, 0, 2.2 + x]} r={[0, Math.PI / 2, 0]} c="#7d8b9c" />)}
      <Group p={[5.9, 0, 2.6]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[1.4, 0.9, 0.35]} p={[0, 0.45, 0]} c="#3a4252" />
        {[-0.5, -0.25, 0, 0.25, 0.5].map((x) => <Box key={x} s={[0.05, 0.22, 0.04]} p={[x, 1.0, 0.05]} c="#1a1a1f" shadow={false} />)}
        {[-0.5, -0.25, 0, 0.25, 0.5].map((x) => <Box key={`l${x}`} s={[0.03, 0.02, 0.01]} p={[x, 0.92, 0.18]} c="#6fe3a8" o={{ emissive: "#6fe3a8", glow: 1 }} shadow={false} />)}
      </Group>
      <Sign p={[3.3, 2.9, 0.13]} w={2.4} h={0.35} text="TOWN POLICE" bg={NAVY} fg="#e9eef2" border="#2f63c9" />
      {/* reception: benches, posters, a water cooler, plants and the door mat */}
      <ChairRow p={[1.85, 0, 8.9]} r={[0, Math.PI, 0]} n={5} c={BLUE} />
      <ChairRow p={[10.9, 0, 8.9]} r={[0, Math.PI, 0]} n={5} c={BLUE} />
      <WaterCooler p={[12.55, 0, 5.65]} />
      <Plant p={[0.5, 0, 6.3]} s={1.0} pot={NAVY} />
      <Plant p={[12.5, 0, 7.8]} s={1.0} pot={NAVY} />
      <Sign p={[0.12, 2.0, 7.4]} r={[0, Math.PI / 2, 0]} w={0.9} h={0.6} text="NEIGHBOURHOOD WATCH" bg="#f4d03f" fg={NAVY} border={NAVY} />
      <Sign p={[12.88, 2.0, 6.4]} r={[0, -Math.PI / 2, 0]} w={0.9} h={0.6} text="CRIMESTOPPERS" bg="#c0392b" border={NAVY} />
      <Art p={[12.88, 1.9, 7.6]} r={[0, -Math.PI / 2, 0]} w={0.6} h={0.75} art={2} />
      <Clock p={[12.88, 2.6, 7.6]} r={[0, -Math.PI / 2, 0]} />
      <DoorMat p={[6.3, 9.0]} />
      {/* squad room: desks, evidence lockers, a city map, a coffee machine and a hat stand */}
      <SquadDesk p={[7.5, 0, 1.9]} r={Math.PI / 2} />
      <SquadDesk p={[7.5, 0, 3.7]} r={Math.PI / 2} />
      <OfficeChair p={[8.4, 0, 1.9]} r={[0, -Math.PI / 2, 0]} c={NAVY} />
      {[3.2, 3.8, 4.4].map((z) => (
        <Group key={z} p={[12.65, 0, z]} r={[0, -Math.PI / 2, 0]}>
          <Box s={[0.55, 1.9, 0.45]} p={[0, 0.95, 0]} c="#7d8b9c" o={{ rough: 0.4, metal: 0.4 }} />
          {[0.5, 1.0, 1.5].map((y) => <Box key={y} s={[0.5, 0.42, 0.01]} p={[0, y, 0.23]} c="#8b98a8" o={{ rough: 0.4, metal: 0.4 }} shadow={false} />)}
          <Box s={[0.1, 0.06, 0.02]} p={[0, 1.7, 0.235]} c={CHECK} shadow={false} />
        </Group>
      ))}
      <Group p={[6.72, 1.8, 1.0]} r={[0, Math.PI / 2, 0]}>
        <Box s={[1.4, 1.0, 0.03]} c="#e9eef2" shadow={false} />
        {[["#4f8a3e", -0.3, 0.1, 0.5, 0.3], ["#4a8fd9", 0.25, -0.15, 0.4, 0.25], ["#d9d3c0", 0, 0, 1.3, 0.04], ["#d9d3c0", 0.1, 0, 0.04, 0.9]].map(([c, x, y, w, h], i) => <Box key={i} s={[w as number, h as number, 0.004]} p={[x as number, y as number, 0.017]} c={c as string} shadow={false} />)}
        {[[-0.4, 0.3], [0.2, -0.2], [0.45, 0.25]].map(([x, y]) => <Ball key={`${x}${y}`} rad={0.03} p={[x!, y!, 0.03]} c="#c0392b" shadow={false} />)}
      </Group>
      <Group p={[10.4, 0, 4.6]}>
        <Box s={[0.6, 0.9, 0.5]} p={[0, 0.45, 0]} c="#3a4252" />
        <Round s={[0.34, 0.42, 0.34]} p={[0, 1.12, 0]} c="#1a1a1f" rad={0.03} />
        <Cyl rad={0.04} h={0.1} p={[0.18, 0.95, 0.12]} c="#f4f1ea" shadow={false} />
      </Group>
      <Group p={[12.6, 0, 4.85]}>
        <Cyl rad={0.15} h={0.03} p={[0, 0.02, 0]} c="#2b2a2e" shadow={false} />
        <Cyl rad={0.02} h={1.8} p={[0, 0.9, 0]} c="#2b2a2e" />
        <Cyl rad={0.14} h={0.1} p={[0.12, 1.8, 0]} c={NAVY} />
        <Box s={[0.3, 0.02, 0.2]} p={[0.12, 1.74, 0.05]} c="#1a1a1f" shadow={false} />
      </Group>
      {/* holding cell: bars, a barred door, a steel bench and a toilet */}
      {Array.from({ length: 13 }, (_, i) => <Cyl key={`x${i}`} rad={0.02} h={2.6} p={[11.0, 1.3, 0.2 + i * 0.19]} c="#3a3d42" o={STEEL} />)}
      {Array.from({ length: 10 }, (_, i) => <Cyl key={`z${i}`} rad={0.02} h={2.6} p={[11.1 + i * 0.19, 1.3, 2.62]} c="#3a3d42" o={STEEL} />)}
      {[0.6, 2.4].map((y) => <Box key={y} s={[0.04, 0.05, 2.5]} p={[11.0, y, 1.35]} c="#3a3d42" o={STEEL} shadow={false} />)}
      {[0.6, 2.4].map((y) => <Box key={`f${y}`} s={[1.95, 0.05, 0.04]} p={[11.95, y, 2.62]} c="#3a3d42" o={STEEL} shadow={false} />)}
      <Box s={[0.45, 0.08, 1.6]} p={[12.65, 0.45, 1.2]} c="#aab3b8" o={STEEL} />
      <Group p={[11.4, 0, 0.4]}>
        <Round s={[0.38, 0.4, 0.45]} p={[0, 0.2, 0]} c="#c9ced2" rad={0.06} o={STEEL} />
      </Group>
      <Group p={[11.95, 3.1, 1.3]}><Box s={[0.4, 0.04, 0.4]} c="#ffffff" o={{ emissive: "#c6d0ff", glow: 0.8 }} shadow={false} /></Group>
      {[[3.2, 6.8], [9.8, 7.2], [9.6, 2.4], [3.3, 2.5]].map(([x, z]) => <CeilingPanel key={`${x}${z}`} p={[x!, 3.28, z!]} />)}
      <Group p={[6.3, 2.95, 9.2]}><Box s={[0.3, 0.2, 0.2]} c="#2f63c9" o={{ emissive: "#4d8bff", glow: 1.2 }} shadow={false} /></Group>
    </Group>
  );
}
