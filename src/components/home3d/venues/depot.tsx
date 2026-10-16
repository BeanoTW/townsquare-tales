import { useMemo } from "react";
import * as THREE from "three";
import { DoorMat } from "../decor";
import { Ball, Box, ChairRow, Clock, Counter, Cyl, FilingCabinet, Group, Monitor, OfficeChair, Plant, Round, STEEL, Sign, StripLight, type V3 } from "./kit";

/**
 * Town Transit: a glazed bus station. A tiled concourse with seating, ticket machines and the departures
 * board, the ticket office behind its hatch, and through the glass, a bus waiting in the bay.
 */
const BLUE = "#2f6f86";
const YELLOW = "#e8c25a";

/** The departures display: amber dot-matrix rows drawn once to a canvas. */
function useDepartures() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 256;
    const g = c.getContext("2d")!;
    g.fillStyle = "#101418"; g.fillRect(0, 0, 512, 256);
    g.fillStyle = "#ffb347"; g.font = 'bold 30px "Courier New", monospace';
    g.fillText("DEPARTURES", 150, 38);
    g.font = '24px "Courier New", monospace';
    const rows = [["10:15", "OLD TOWN", "1"], ["10:22", "MEGACORP", "2"], ["10:30", "THE DOCKS", "3"], ["10:41", "AIRPORT", "4"], ["10:55", "SEASIDE", "1"]];
    rows.forEach(([t, d, b], i) => {
      g.fillStyle = i === 0 ? "#ffd27a" : "#ffb347";
      g.fillText(t!, 20, 80 + i * 36); g.fillText(d!, 130, 80 + i * 36); g.fillText("BAY " + b, 380, 80 + i * 36);
    });
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 0.9, roughness: 0.4 });
  }, []);
}

/** Interactive: free-standing departures board on two posts with a timetable stand. */
function Departures() {
  const face = useDepartures();
  return (
    <Group>
      {[-1.05, 1.05].map((x) => <Box key={x} s={[0.1, 2.6, 0.1]} p={[x, 1.3, 0]} c="#3a3f45" o={STEEL} />)}
      <Box s={[2.3, 1.15, 0.14]} p={[0, 2.25, 0]} c="#1a1a1f" />
      <mesh position={[0, 2.25, 0.072]} material={face}><planeGeometry args={[2.1, 1.0]} /></mesh>
      <Box s={[2.3, 0.08, 0.16]} p={[0, 2.86, 0]} c={BLUE} shadow={false} />
      <Clock p={[0, 3.1, 0.02]} rad={0.2} />
      <Group p={[0, 0, 0.12]}>
        <Box s={[0.7, 1.0, 0.04]} p={[0, 1.1, 0]} c={BLUE} />
        {[0, 1, 2, 3].map((i) => <Box key={i} s={[0.55, 0.16, 0.005]} p={[0, 1.42 - i * 0.2, 0.024]} c="#f4f1ea" shadow={false} />)}
      </Group>
    </Group>
  );
}

/** Interactive: the ticket hatch: a ledge, a speaking grille and the TICKETS light box. */
function TicketHatch() {
  return (
    <Group>
      <Box s={[1.7, 0.06, 0.35]} p={[0, 0.98, -0.1]} c="#e9eef2" />
      <Box s={[1.7, 0.95, 0.06]} p={[0, 0.48, -0.3]} c={BLUE} />
      <Cyl rad={0.08} h={0.01} p={[0, 1.35, -0.33]} r={[Math.PI / 2, 0, 0]} c="#aab3b8" o={STEEL} shadow={false} />
      <Box s={[0.4, 0.04, 0.3]} p={[0.45, 1.0, -0.1]} c="#2b2a2e" shadow={false} />
      <Sign p={[0, 2.1, -0.32]} w={1.2} h={0.26} text="TICKETS & JOBS" bg={BLUE} glow={0.5} />
      <Group p={[-0.95, 0, 0.0]}>
        <Box s={[0.3, 1.2, 0.18]} p={[0, 0.6, 0]} c="#e9eef2" />
        {[0.5, 0.75, 1.0].map((y, i) => <Box key={y} s={[0.22, 0.2, 0.02]} p={[0, y, 0.1]} c={["#c0392b", YELLOW, "#4f8a3e"][i]!} shadow={false} />)}
      </Group>
    </Group>
  );
}

function TicketMachine({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Round s={[0.5, 1.5, 0.4]} p={[0, 0.75, 0]} c={BLUE} rad={0.04} />
      <Box s={[0.36, 0.28, 0.02]} p={[0, 1.2, 0.21]} r={[-0.15, 0, 0]} c="#0f2030" o={{ emissive: "#6fe3ff", glow: 0.8 }} shadow={false} />
      <Box s={[0.2, 0.04, 0.03]} p={[0, 0.9, 0.21]} c="#1a1a1f" shadow={false} />
      <Box s={[0.4, 0.12, 0.02]} p={[0, 1.42, 0.21]} c={YELLOW} shadow={false} />
    </Group>
  );
}

function VendingMachine({ p, r, glow = "#ff7f5a", body = "#c0392b" }: { p: V3; r?: V3; glow?: string; body?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Round s={[0.75, 1.85, 0.6]} p={[0, 0.925, 0]} c={body} rad={0.04} o={{ rough: 0.4 }} />
      <Box s={[0.5, 1.3, 0.02]} p={[-0.08, 1.05, 0.31]} c="#dff0f5" o={{ emissive: glow, glow: 0.35, opacity: 0.85 }} shadow={false} />
      {[0.55, 0.85, 1.15, 1.45].map((y, i) => [-0.25, -0.08, 0.09].map((x, j) => <Box key={`${y}${x}`} s={[0.12, 0.18, 0.08]} p={[x, y, 0.22]} c={["#4a8fd9", YELLOW, "#4f8a3e", "#f4f1ea"][(i + j) % 4]!} shadow={false} />))}
      <Box s={[0.1, 0.3, 0.02]} p={[0.28, 1.1, 0.31]} c="#2b2a2e" shadow={false} />
    </Group>
  );
}

/** A single-deck town bus in the transit livery, nose to the east. */
function Bus({ p }: { p: V3 }) {
  const windows = Array.from({ length: 7 }, (_, i) => -3.2 + i * 1.05);
  return (
    <Group p={p}>
      <Round s={[9.0, 2.5, 2.3]} p={[0, 1.55, 0]} c="#f4f1ea" rad={0.2} o={{ rough: 0.4 }} />
      <Box s={[9.02, 0.45, 2.32]} p={[0, 0.65, 0]} c={BLUE} o={{ rough: 0.4 }} shadow={false} />
      <Box s={[9.02, 0.12, 2.32]} p={[0, 1.0, 0]} c={YELLOW} shadow={false} />
      {windows.map((x) => <Box key={x} s={[0.9, 0.9, 2.34]} p={[x, 2.05, 0]} c="#2a3a4a" o={{ rough: 0.15, metal: 0.3 }} shadow={false} />)}
      <Box s={[0.05, 1.1, 2.0]} p={[4.51, 1.95, 0]} c="#2a3a4a" o={{ rough: 0.15, metal: 0.3 }} shadow={false} />
      <Box s={[0.06, 0.3, 1.6]} p={[4.52, 2.75, 0]} c="#1a1a1f" shadow={false} />
      <Box s={[0.07, 0.2, 1.4]} p={[4.53, 2.75, 0]} c="#ffb347" o={{ emissive: "#ffb347", glow: 1.0 }} shadow={false} />
      <Box s={[1.0, 2.0, 0.05]} p={[3.4, 1.35, 1.17]} c="#2a3a4a" o={{ rough: 0.15, metal: 0.3 }} shadow={false} />
      {[-3.0, 3.0].map((x) => [-1, 1].map((s) => <Cyl key={`${x}${s}`} rad={0.45} h={0.3} p={[x, 0.45, s * 1.05]} r={[Math.PI / 2, 0, 0]} c="#1a1a1f" />))}
      {[-0.7, 0.7].map((z) => <Box key={z} s={[0.06, 0.12, 0.3]} p={[4.53, 0.8, z]} c="#fff4d6" o={{ emissive: "#fff4d6", glow: 1.2 }} shadow={false} />)}
      <Box s={[0.4, 0.06, 0.06]} p={[4.6, 2.2, 1.25]} c="#1a1a1f" shadow={false} />
      <Box s={[0.6, 0.16, 0.02]} p={[2.0, 2.75, 1.17]} c="#1a1a1f" shadow={false} />
      <Box s={[0.5, 0.1, 0.02]} p={[2.0, 2.75, 1.18]} c="#ffb347" o={{ emissive: "#ffb347", glow: 0.9 }} shadow={false} />
    </Group>
  );
}

export function DepotFixture({ id }: { id: string }) {
  switch (id) {
    case "departures": return <Departures />;
    case "ticket-hatch": return <TicketHatch />;
    default: return null;
  }
}

export function DepotDecor() {
  return (
    <Group>
      {/* bus bay: the bus, bay markings, a raised kerb with tactile paving, bollards and a stop flag */}
      <Bus p={[6.0, 0, 1.7]} />
      {[0.4, 3.0].map((z) => <Box key={z} s={[10.5, 0.01, 0.1]} p={[6.0, 0.015, z]} c={YELLOW} shadow={false} />)}
      <Box s={[15.0, 0.12, 0.6]} p={[7.5, 0.06, 3.45]} c="#c9ccc8" />
      <Box s={[15.0, 0.01, 0.35]} p={[7.5, 0.125, 3.45]} c={YELLOW} o={{ rough: 1 }} shadow={false} />
      {[12.2, 13.8].map((x) => <Cyl key={x} rad={0.15} h={0.85} p={[x, 0.43, 0.6]} c={YELLOW} o={{ rough: 0.5 }} />)}
      <Group p={[11.8, 0, 3.2]}>
        <Cyl rad={0.04} h={2.6} p={[0, 1.3, 0]} c="#3a3f45" o={STEEL} />
        <Cyl rad={0.3} h={0.04} p={[0, 2.6, 0]} r={[Math.PI / 2, 0, 0]} c="#c0392b" />
        <Sign p={[0, 2.6, 0.025]} w={0.42} h={0.18} text="BUS" bg="#c0392b" border="#c0392b" />
      </Group>
      {/* concourse: seating, ticket machines, vending, the route map and signs */}
      <ChairRow p={[2.8, 0, 7.3]} r={[0, Math.PI, 0]} n={6} c={BLUE} />
      <ChairRow p={[8.7, 0, 6.9]} r={[0, Math.PI, 0]} n={5} c={BLUE} />
      <TicketMachine p={[8.7, 0, 4.35]} />
      <TicketMachine p={[9.35, 0, 4.35]} />
      <VendingMachine p={[0.45, 0, 4.7]} r={[0, Math.PI / 2, 0]} />
      <VendingMachine p={[0.45, 0, 5.5]} r={[0, Math.PI / 2, 0]} glow="#6fe3ff" body="#2f6fb3" />
      <Group p={[0.12, 1.7, 7.9]} r={[0, Math.PI / 2, 0]}>
        <Box s={[2.0, 1.2, 0.03]} c="#f4f1ea" shadow={false} />
        {[["#c0392b", 0.3], ["#2f6fb3", 0.0], ["#4f8a3e", -0.3]].map(([c, y], i) => (
          <Group key={i}>
            <Box s={[1.6, 0.05, 0.01]} p={[0, y as number, 0.02]} r={[0, 0, (i - 1) * 0.12]} c={c as string} shadow={false} />
            {[-0.6, -0.2, 0.2, 0.6].map((x) => <Ball key={x} rad={0.035} p={[x, (y as number) + x * (i - 1) * 0.12, 0.025]} c="#ffffff" shadow={false} />)}
          </Group>
        ))}
        <Sign p={[0, 0.5, 0.02]} w={1.2} h={0.14} text="ROUTE MAP" bg={BLUE} />
      </Group>
      <Sign p={[7.3, 3.0, 3.9]} w={1.6} h={0.3} text="BUS BAYS" bg={BLUE} fg="#fff1c2" glow={0.4} />
      {[[4.5, 7.4], [10.6, 8.6]].map(([x, z]) => <Cyl key={`${x}${z}`} rad={0.18} h={0.6} p={[x!, 0.3, z!]} c="#3a3f45" o={STEEL} />)}
      <Plant p={[11.1, 0, 9.0]} s={1.0} pot={BLUE} />
      <DoorMat p={[5.8, 9.0]} />
      {/* ticket office behind the hatch: desk, screen, clerk's chair, lockers and a kettle */}
      <Group p={[12.9, 0, 5.9]} r={[0, -Math.PI / 2, 0]}>
        <Counter p={[0, 0, 0]} w={1.8} d={0.7} h={0.85} body="#e9eef2" top="#c9b79c" />
        <Monitor p={[0.4, 0.85, -0.1]} r={[0, Math.PI, 0]} w={0.42} />
        <OfficeChair p={[0, 0, -0.6]} c={BLUE} />
      </Group>
      <FilingCabinet p={[14.6, 0, 4.5]} r={[0, -Math.PI / 2, 0]} c="#5b6a73" />
      {[14.6].map((x) => [7.2, 7.7, 8.2].map((z) => <Box key={`${x}${z}`} s={[0.6, 1.9, 0.48]} p={[x, 0.95, z]} c={BLUE} o={{ rough: 0.4, metal: 0.3 }} />))}
      <Clock p={[14.88, 2.3, 6.0]} r={[0, -Math.PI / 2, 0]} />
      {[[3.0, 6.5], [8.5, 6.5], [3.0, 1.8], [8.5, 1.8], [13.3, 6.6]].map(([x, z], i) => <StripLight key={i} p={[x!, i < 2 ? 3.75 : i < 4 ? 3.95 : 2.75, z!]} w={2.4} colour={i >= 2 && i < 4 ? "#ffd9a0" : "#f2f6ff"} />)}
    </Group>
  );
}
