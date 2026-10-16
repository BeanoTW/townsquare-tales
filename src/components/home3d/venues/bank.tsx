import { useMemo } from "react";
import { DoorMat, Pendant } from "../decor";
import { Art, BRASS, Ball, Box, Chair, Clock, Counter, Cyl, FilingCabinet, Group, Instanced, Monitor, OfficeChair, Plant, QueuePost, Rope, Round, STEEL, Sign, type V3 } from "./kit";

/**
 * Town Bank: a marble banking hall with brass and bottle-green joinery. Teller windows behind security glass,
 * a loan desk, a cash machine by the door and, through the arch, the vault with its safe-deposit wall.
 */
const GREEN = "#2f5e55";
const MAHOGANY = "#5a2f22";
const MARBLE = "#efe9dc";
const GOLD = "#c9a24a";

/** Security glass with a brass frame and speaking grille, w wide, sitting on a counter of height h. */
function Screen({ w, h = 1.05 }: { w: number; h?: number }) {
  return (
    <Group p={[0, h, -0.05]}>
      <Box s={[w, 0.95, 0.025]} p={[0, 0.5, 0]} c="#dff0f5" o={{ opacity: 0.3, rough: 0.05 }} shadow={false} />
      <Box s={[w + 0.04, 0.05, 0.06]} p={[0, 0.99, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Box s={[0.04, 0.95, 0.06]} p={[-w / 2, 0.5, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Box s={[0.04, 0.95, 0.06]} p={[w / 2, 0.5, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Box s={[w, 0.05, 0.25]} p={[0, 0.02, 0.12]} c={MARBLE} o={{ rough: 0.25 }} shadow={false} />
    </Group>
  );
}

/** Interactive: two teller windows, each with a speaking grille, a pen on a chain and a position light. */
function TellerCounter() {
  return (
    <Group>
      <Counter p={[0, 0, 0]} w={3.6} d={0.7} h={1.05} body={MAHOGANY} top={MARBLE} front={GREEN} />
      {[-1.15, 0, 1.15].map((x) => <Box key={x} s={[0.06, 0.9, 0.04]} p={[x * 1.5, 0.5, 0.36]} c={GOLD} o={BRASS} shadow={false} />)}
      <Screen w={3.5} />
      {[-0.9, 0.9].map((x, i) => (
        <Group key={x} p={[x, 0, 0]}>
          <Cyl rad={0.07} h={0.01} p={[0, 1.35, -0.03]} r={[Math.PI / 2, 0, 0]} c={GOLD} o={BRASS} shadow={false} />
          <Box s={[0.36, 0.1, 0.02]} p={[0, 1.95, -0.02]} c={i ? "#2b2a2e" : "#1f3a33"} o={{ emissive: i ? "#ff5a4a" : "#6fe3a8", glow: 0.8 }} shadow={false} />
          <Box s={[0.12, 0.012, 0.012]} p={[0.25, 1.09, 0.2]} c="#2b2a2e" shadow={false} />
          <Box s={[0.18, 0.004, 0.24]} p={[-0.2, 1.08, 0.15]} c="#fdfbf2" shadow={false} />
          <Monitor p={[0, 1.05, -0.3]} r={[0, Math.PI, 0]} w={0.42} />
        </Group>
      ))}
      <Sign p={[0, 2.25, -0.05]} w={1.6} h={0.2} text="CASHIERS" bg={GREEN} fg="#f6e7c4" border={GOLD} />
    </Group>
  );
}

/** Interactive: the loan desk with a banker's chair and two client chairs. */
function LoanDesk() {
  return (
    <Group>
      <Round s={[1.6, 0.06, 0.8]} p={[0, 0.76, -0.1]} c={MAHOGANY} rad={0.02} o={{ rough: 0.4 }} />
      <Box s={[0.45, 0.72, 0.75]} p={[-0.55, 0.37, -0.1]} c={MAHOGANY} o={{ rough: 0.5 }} />
      <Box s={[0.45, 0.72, 0.75]} p={[0.55, 0.37, -0.1]} c={MAHOGANY} o={{ rough: 0.5 }} />
      <Box s={[1.4, 0.2, 0.02]} p={[0, 0.62, 0.28]} c={GREEN} shadow={false} />
      <Monitor p={[0.4, 0.79, -0.3]} w={0.42} />
      <Box s={[0.3, 0.004, 0.22]} p={[-0.2, 0.795, 0.0]} c="#fdfbf2" shadow={false} />
      <Box s={[0.4, 0.08, 0.06]} p={[-0.5, 0.83, 0.15]} c={GOLD} o={BRASS} shadow={false} />
      <Sign p={[-0.5, 0.88, 0.185]} w={0.36} h={0.06} text="LOANS" bg={GREEN} border={GOLD} />
      <Cyl rad={0.035} h={0.1} p={[0.0, 0.84, 0.1]} c="#2f7f79" shadow={false} />
      <OfficeChair p={[0, 0, -0.75]} c="#3a2a22" />
      <Chair p={[-0.4, 0, 0.6]} r={[0, Math.PI, 0]} frame={MAHOGANY} cushion={GREEN} />
      <Chair p={[0.4, 0, 0.6]} r={[0, Math.PI, 0]} frame={MAHOGANY} cushion={GREEN} />
    </Group>
  );
}

/** Interactive: the cash machine set into a stone surround. */
function CashMachine() {
  return (
    <Group>
      <Round s={[0.8, 2.0, 0.4]} p={[0, 1.0, -0.12]} c="#d9d4c8" rad={0.03} o={{ rough: 0.6 }} />
      <Round s={[0.62, 1.45, 0.34]} p={[0, 0.73, 0.02]} c="#3a4252" rad={0.03} o={{ rough: 0.35, metal: 0.3 }} />
      <Box s={[0.36, 0.26, 0.02]} p={[0, 1.18, 0.2]} r={[-0.2, 0, 0]} c="#0f2030" o={{ emissive: "#6fe3a8", glow: 0.9 }} shadow={false} />
      <Box s={[0.26, 0.04, 0.2]} p={[0, 0.88, 0.25]} r={[0.3, 0, 0]} c="#2b2a2e" shadow={false} />
      {[0, 1, 2].map((r) => [0, 1, 2].map((c) => <Box key={`${r}${c}`} s={[0.05, 0.012, 0.04]} p={[-0.07 + c * 0.07, 0.9 + r * 0.012, 0.22 + r * 0.03]} c="#c9ced2" shadow={false} />))}
      <Box s={[0.14, 0.02, 0.02]} p={[0.18, 1.02, 0.2]} c="#6fe3a8" o={{ emissive: "#6fe3a8", glow: 1 }} shadow={false} />
      <Box s={[0.3, 0.03, 0.02]} p={[0, 0.66, 0.2]} c="#1a1a1f" shadow={false} />
      <Sign p={[0, 1.78, 0.2]} w={0.5} h={0.16} text="CASH" bg={GREEN} glow={0.6} />
    </Group>
  );
}

/** Interactive: the round vault door in a heavy steel frame on the back wall, wheel and bolts in brass. */
function VaultDoor() {
  const bolts = useMemo(() => Array.from({ length: 12 }, (_, i) => (i / 12) * Math.PI * 2), []);
  return (
    <Group>
      <Box s={[2.4, 2.5, 0.35]} p={[0, 1.25, -0.25]} c="#8b949a" o={STEEL} />
      <Cyl rad={1.05} h={0.12} p={[0, 1.25, -0.04]} r={[Math.PI / 2, 0, 0]} c="#5f686e" o={STEEL} />
      <Cyl rad={0.92} h={0.16} p={[0, 1.25, 0.02]} r={[Math.PI / 2, 0, 0]} c="#aab3b8" o={{ rough: 0.25, metal: 0.85 }} />
      {bolts.map((a) => <Cyl key={a} rad={0.045} h={0.08} p={[Math.cos(a) * 0.8, 1.25 + Math.sin(a) * 0.8, 0.12]} r={[Math.PI / 2, 0, 0]} c={GOLD} o={BRASS} shadow={false} />)}
      <Cyl rad={0.32} h={0.05} p={[0, 1.25, 0.14]} r={[Math.PI / 2, 0, 0]} c={GOLD} o={BRASS} />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.75, 0.05, 0.05]} p={[0, 1.25, 0.2]} r={[0, 0, (i * Math.PI) / 3]} c={GOLD} o={BRASS} shadow={false} />)}
      <Box s={[0.18, 0.5, 0.18]} p={[1.0, 1.25, 0.06]} c="#5f686e" o={STEEL} />
      <Sign p={[0, 2.62, -0.05]} w={1.1} h={0.22} text="VAULT" bg="#2b2a2e" fg={GOLD} border={GOLD} />
      <Box s={[2.2, 0.03, 0.5]} p={[0, 0.015, 0.3]} c="#e1a53a" shadow={false} />
    </Group>
  );
}

function Column({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Box s={[0.5, 0.16, 0.5]} p={[0, 0.08, 0]} c="#ddd6c8" />
      <Cyl rad={0.2} h={3.4} p={[0, 1.86, 0]} c="#f2ede2" o={{ rough: 0.35 }} />
      {Array.from({ length: 8 }, (_, i) => <Box key={i} s={[0.03, 3.3, 0.03]} p={[Math.cos((i / 8) * Math.PI * 2) * 0.2, 1.86, Math.sin((i / 8) * Math.PI * 2) * 0.2]} c="#e2dccf" shadow={false} />)}
      <Box s={[0.52, 0.2, 0.52]} p={[0, 3.66, 0]} c="#ddd6c8" />
    </Group>
  );
}

/** Wall of numbered safe-deposit boxes. */
function DepositBoxes({ p }: { p: V3 }) {
  const items = useMemo(() => {
    const out: { p: V3; s: V3; c: number }[] = [];
    for (let r = 0; r < 7; r++) for (let c = 0; c < 10; c++) out.push({ p: [0.02, 0.35 + r * 0.28, -1.8 + c * 0.4], s: [0.02, 0.24, 0.36], c: (r * 3 + c) % 2 });
    return out;
  }, []);
  return (
    <Group p={p}>
      <Box s={[0.5, 2.3, 4.1]} p={[0, 1.15, 0]} c="#8b949a" o={STEEL} />
      <Group p={[-0.26, 0, 0]}><Instanced items={items} colours={["#c9a24a", "#b8923e"]} rough={0.3} /></Group>
    </Group>
  );
}

export function BankFixture({ id }: { id: string }) {
  switch (id) {
    case "teller": return <TellerCounter />;
    case "loans": return <LoanDesk />;
    case "atm": return <CashMachine />;
    case "vault": return <Group p={[0, 0, -0.15]}><VaultDoor /></Group>;
    default: return null;
  }
}

export function BankDecor() {
  return (
    <Group>
      {/* the counter line continues to both walls, sealing off the staff side */}
      <Group p={[1.45, 0, 3.7]}>
        <Counter p={[0, 0, 0]} w={2.7} d={0.6} h={1.05} body={MAHOGANY} top={MARBLE} front={GREEN} />
        <Screen w={2.6} />
        <Sign p={[0, 1.65, -0.04]} w={0.9} h={0.16} text="CLOSED" bg="#2b2a2e" fg="#e9dfc9" border={GOLD} />
      </Group>
      <Group p={[8.25, 0, 3.7]}>
        <Counter p={[0, 0, 0]} w={3.7} d={0.6} h={1.05} body={MAHOGANY} top={MARBLE} front={GREEN} />
        <Screen w={3.6} />
        <Sign p={[0, 1.65, -0.04]} w={1.4} h={0.16} text="ENQUIRIES" bg={GREEN} fg="#f6e7c4" border={GOLD} />
      </Group>
      {/* staff side: desks, monitors, cabinets and the bank's name in gold */}
      {[1.6, 4.4, 7.2].map((x) => (
        <Group key={x} p={[x, 0, 0.45]}>
          <Round s={[1.8, 0.05, 0.55]} p={[0, 0.76, 0]} c={MAHOGANY} rad={0.02} />
          <Box s={[1.7, 0.72, 0.5]} p={[0, 0.36, 0]} c="#4a3022" />
          <Monitor p={[-0.3, 0.79, -0.05]} w={0.45} />
          <Box s={[0.25, 0.08, 0.3]} p={[0.5, 0.83, 0.0]} c="#2b2a2e" shadow={false} />
          <OfficeChair p={[0, 0, 0.75]} r={[0, Math.PI, 0]} c={GREEN} />
        </Group>
      ))}
      <FilingCabinet p={[9.6, 0, 0.45]} />
      <Sign p={[4.4, 2.85, 0.13]} w={3.4} h={0.5} text="TOWN BANK" bg={GREEN} fg="#e9c46a" border={GOLD} />
      <Art p={[8.4, 2.1, 0.13]} w={0.7} h={0.9} art={1} />
      <Clock p={[1.3, 2.45, 0.13]} />
      {/* hall: columns, a red runner, queue ropes, the paying-in desk, plants and chandeliers */}
      <Column p={[3.0, 0, 6.6]} />
      <Column p={[6.6, 0, 6.6]} />
      <Box s={[1.4, 0.012, 5.4]} p={[5.4, 0.022, 7.2]} c="#8a2a2a" o={{ rough: 1 }} shadow={false} />
      <Box s={[1.2, 0.014, 5.2]} p={[5.4, 0.024, 7.2]} c="#a33a3a" o={{ rough: 1 }} shadow={false} />
      {[[3.2, 5.1], [4.4, 5.1], [5.6, 5.1], [6.2, 5.1]].map(([x, z]) => <QueuePost key={`${x}${z}`} p={[x!, 0, z!]} />)}
      <Rope a={[3.2, 5.1]} b={[4.4, 5.1]} />
      <Rope a={[5.6, 5.1]} b={[6.2, 5.1]} />
      <Group p={[2.05, 0, 8.55]}>
        <Round s={[1.0, 0.06, 0.6]} p={[0, 1.05, 0]} c={MARBLE} rad={0.02} />
        <Box s={[0.9, 1.0, 0.5]} p={[0, 0.5, 0]} c={MAHOGANY} />
        {[0, 1, 2].map((i) => <Box key={i} s={[0.16, 0.004, 0.22]} p={[-0.25 + i * 0.22, 1.085, 0]} c={["#fdfbf2", "#cfe6f2", "#f3e08a"][i]!} shadow={false} />)}
        <Box s={[0.12, 0.012, 0.012]} p={[0.35, 1.09, 0.1]} c="#2b2a2e" shadow={false} />
      </Group>
      <Plant p={[0.6, 0, 9.4]} s={1.1} pot="#2f5e55" />
      <Plant p={[9.6, 0, 9.4]} s={1.1} pot="#2f5e55" />
      <Plant p={[9.6, 0, 4.6]} s={0.9} pot="#2f5e55" />
      {[[3.0, 6.0], [7.4, 6.0]].map(([x, z]) => (
        <Group key={`${x}${z}`} p={[x!, 3.8, z!]}>
          <Cyl rad={0.01} h={0.7} p={[0, -0.35, 0]} c={GOLD} o={BRASS} shadow={false} />
          <Cyl rad={0.35} h={0.06} p={[0, -0.72, 0]} c={GOLD} o={BRASS} shadow={false} />
          {Array.from({ length: 6 }, (_, i) => <Ball key={i} rad={0.06} p={[Math.cos((i / 6) * Math.PI * 2) * 0.3, -0.8, Math.sin((i / 6) * Math.PI * 2) * 0.3]} c="#fff4d6" o={{ emissive: "#ffe2a8", glow: 1.2 }} shadow={false} />)}
        </Group>
      ))}
      <Sign p={[0.12, 2.6, 6.2]} r={[0, Math.PI / 2, 0]} w={1.8} h={0.3} text="Est. 1907" bg={GREEN} fg="#e9c46a" border={GOLD} />
      <Art p={[0.12, 1.75, 4.5]} r={[0, Math.PI / 2, 0]} w={0.8} h={1.0} art={2} />
      <DoorMat p={[5.4, 9.5]} />
      {/* CCTV dome over the door */}
      <Ball rad={0.09} p={[5.4, 3.7, 9.6]} c="#2b2a2e" />
      {/* vault wing: deposit boxes, a cash trolley with gold, a bench and a security gate */}
      <DepositBoxes p={[13.62, 0, 3.75]} />
      <Group p={[11.35, 0, 3.35]}>
        <Box s={[0.85, 0.05, 0.6]} p={[0, 0.7, 0]} c="#aab3b8" o={STEEL} />
        <Box s={[0.85, 0.05, 0.6]} p={[0, 0.25, 0]} c="#aab3b8" o={STEEL} shadow={false} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.03, 0.72, 0.03]} p={[x! * 0.4, 0.38, z! * 0.27]} c="#aab3b8" o={STEEL} shadow={false} />)}
        {[0, 1, 2, 3, 4].map((i) => <Box key={i} s={[0.22, 0.07, 0.11]} p={[-0.25 + (i % 3) * 0.25, 0.76 + Math.floor(i / 3) * 0.07, (i % 2) * 0.12 - 0.06]} c="#e1b23d" o={{ rough: 0.25, metal: 0.9 }} />)}
        {[-0.2, 0.2].map((x) => <Ball key={x} rad={0.12} p={[x, 0.38, 0]} sc={[0.13, 0.12, 0.11]} c="#c9b28a" />)}
      </Group>
      <Group p={[12.0, 0, 8.8]}>
        <Round s={[2.0, 0.08, 0.45]} p={[0, 0.45, 0]} c={MAHOGANY} rad={0.02} />
        {[-0.85, 0.85].map((x) => <Box key={x} s={[0.06, 0.45, 0.4]} p={[x, 0.22, 0]} c={GOLD} o={BRASS} shadow={false} />)}
      </Group>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => <Cyl key={i} rad={0.015} h={2.4} p={[10.32, 1.2, 4.0 + i * 0.25]} c={GOLD} o={BRASS} shadow={false} />)}
      <Pendant p={[12.0, 3.8, 3.0]} colour="#ffe2a8" cord={1.2} />
      <Pendant p={[12.0, 3.8, 7.0]} colour="#ffe2a8" cord={1.2} />
    </Group>
  );
}
