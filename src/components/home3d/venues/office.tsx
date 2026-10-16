import { Blind, DoorMat, Rug } from "../decor";
import { Art, Bin, Bookcase, Box, CeilingPanel, Chair, Clock, Counter, Cyl, FilingCabinet, Group, Keyboard, Monitor, NoticeBoard, OfficeChair, Plant, Round, Settee, Sign, STEEL, Table, WaterCooler, type V3 } from "./kit";

/**
 * MegaCorp: a cool grey open-plan office. Desk pods with dividers, a logo wall at reception, a meeting area
 * and kitchenette, and the manager's glazed corner office with a walnut desk and a view.
 */
const BLUE = "#2f4f66";
const DESK = "#e9eef2";
const WALNUT = "#4a3022";

/** Four-desk pod: two pairs facing each other across a fabric divider. */
function DeskPod() {
  return (
    <Group>
      {[-0.72, 0.72].map((x) => [-1, 1].map((s) => (
        <Group key={`${x}${s}`} p={[x, 0, s * 0.42]} r={[0, s > 0 ? 0 : Math.PI, 0]}>
          <Round s={[1.38, 0.04, 0.78]} p={[0, 0.74, 0]} c={DESK} rad={0.012} o={{ rough: 0.4 }} />
          {[-0.65, 0.65].map((lx) => <Box key={lx} s={[0.04, 0.72, 0.7]} p={[lx, 0.37, 0]} c="#aab3b8" o={STEEL} shadow={false} />)}
          <Monitor p={[0, 0.76, -0.22]} w={0.55} glow={["#6fb6e6", "#8fd9a8", "#e6c86f", "#e68fb0"][Math.round((x + 1) * 2 + s) % 4]!} />
          <Keyboard p={[0, 0.77, 0.08]} />
          <Cyl rad={0.04} h={0.1} p={[0.45, 0.81, 0.05]} c={["#c0392b", "#f4f1ea", "#2f7f79"][Math.round(x + 1) % 3]!} shadow={false} />
          <Box s={[0.22, 0.004, 0.3]} p={[-0.45, 0.762, 0.05]} c="#fdfbf2" shadow={false} />
          <OfficeChair p={[0, 0, 0.62]} r={[0, Math.PI, 0]} c={BLUE} />
        </Group>
      )))}
      <Box s={[2.9, 0.42, 0.05]} p={[0, 0.95, 0]} c="#7d8f99" o={{ rough: 1 }} />
      <Plant p={[1.35, 0.76, 0]} s={0.35} pot={DESK} />
    </Group>
  );
}

/** Interactive: the job board by the window, with an APPLY sign (wall-mounted, +z into the room). */
function Vacancies() {
  return (
    <Group>
      <NoticeBoard p={[0, 1.6, -0.08]} w={1.3} h={0.9} header="VACANCIES" frame={BLUE} cork="#d9dde0" />
      <Sign p={[0, 1.0, -0.07]} w={0.7} h={0.16} text="Apply today" bg="#c0392b" />
    </Group>
  );
}

/** Interactive: the manager's walnut desk with a leather chair and two guest chairs. */
function ManagerDesk() {
  return (
    <Group>
      <Round s={[2.1, 0.07, 0.9]} p={[0, 0.76, 0]} c={WALNUT} rad={0.02} o={{ rough: 0.35 }} />
      <Box s={[0.5, 0.72, 0.85]} p={[-0.75, 0.37, 0]} c={WALNUT} o={{ rough: 0.4 }} />
      <Box s={[1.9, 0.5, 0.03]} p={[0, 0.48, 0.42]} c="#5a3a28" shadow={false} />
      <Monitor p={[0.35, 0.8, -0.2]} w={0.6} />
      <Keyboard p={[0.35, 0.81, 0.1]} />
      <Box s={[0.3, 0.06, 0.04]} p={[-0.55, 0.83, 0.32]} c="#c9a24a" o={{ rough: 0.3, metal: 0.8 }} shadow={false} />
      <Group p={[-0.75, 0.8, -0.15]}>
        <Cyl rad={0.06} h={0.02} p={[0, 0.01, 0]} c="#c9a24a" o={{ rough: 0.3, metal: 0.8 }} shadow={false} />
        <Cyl rad={0.035} h={0.22} p={[0, 0.12, 0]} c="#e1b23d" o={{ rough: 0.25, metal: 0.85 }} />
      </Group>
      <Box s={[0.22, 0.004, 0.3]} p={[-0.2, 0.797, 0.1]} c="#fdfbf2" shadow={false} />
      <OfficeChair p={[0, 0, -0.75]} c="#1a1a1f" />
      <Chair p={[-0.45, 0, 0.75]} r={[0, Math.PI, 0]} frame="#2b2a2e" cushion={BLUE} />
      <Chair p={[0.45, 0, 0.75]} r={[0, Math.PI, 0]} frame="#2b2a2e" cushion={BLUE} />
    </Group>
  );
}

function Printer({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Round s={[0.6, 0.9, 0.55]} p={[0, 0.45, 0]} c="#e9eef2" rad={0.03} o={{ rough: 0.4 }} />
      <Box s={[0.5, 0.04, 0.4]} p={[0, 0.92, 0]} c="#3a4252" shadow={false} />
      <Box s={[0.16, 0.08, 0.02]} p={[0.15, 0.82, 0.28]} c="#0f2030" o={{ emissive: "#6fe3a8", glow: 0.8 }} shadow={false} />
      <Box s={[0.3, 0.02, 0.22]} p={[0, 0.96, 0.05]} c="#fdfbf2" shadow={false} />
    </Group>
  );
}

export function OfficeFixture({ id }: { id: string }) {
  switch (id) {
    case "workstation": return <DeskPod />;
    case "vacancies": return <Vacancies />;
    case "manager": return <ManagerDesk />;
    default: return null;
  }
}

export function OfficeDecor() {
  return (
    <Group>
      <Group p={[8.1, 0, 3.0]}><DeskPod /></Group>
      {/* reception: curved desk, logo wall, waiting sofa with a coffee table */}
      <Group p={[1.25, 0, 8.05]}>
        <Counter p={[0, 0, 0]} w={1.9} d={0.65} h={1.05} body="#e9eef2" top={BLUE} front={BLUE} />
        <Monitor p={[0.3, 1.05, -0.15]} r={[0, Math.PI, 0]} w={0.42} />
        <Plant p={[-0.7, 1.05, 0]} s={0.3} pot="#e9eef2" />
      </Group>
      <Sign p={[0.12, 2.1, 8.0]} r={[0, Math.PI / 2, 0]} w={2.2} h={0.5} text="MEGACORP" bg={BLUE} fg="#e9eef2" border={BLUE} glow={0.25} />
      <Sign p={[0.12, 1.65, 8.0]} r={[0, Math.PI / 2, 0]} w={1.8} h={0.16} text="We own the future" bg={BLUE} fg="#a8c4d8" border={BLUE} />
      <Group p={[5.9, 0, 9.5]} r={[0, Math.PI, 0]}><Settee p={[0, 0, 0]} w={1.7} c="#7d8f99" /></Group>
      <Table p={[5.9, 0, 8.6]} w={0.9} d={0.5} h={0.4} top={WALNUT} leg="#2b2a2e" />
      {/* printer, filing, water cooler, bins and plants */}
      <Printer p={[10.1, 0, 6.5]} />
      {[1.05, 1.6, 2.15, 2.7].map((z) => <FilingCabinet key={z} p={[0.4, 0, z - 0.1]} r={[0, Math.PI / 2, 0]} />)}
      <WaterCooler p={[11.05, 0, 9.45]} />
      <Bin p={[5.9, 0, 3.0]} />
      <Bin p={[9.9, 0, 3.0]} />
      {[[0.5, 9.4], [10.2, 9.4], [10.2, 0.5], [0.5, 4.0]].map(([x, z]) => <Plant key={`${x}${z}`} p={[x!, 0, z!]} s={1.1} pot="#e9eef2" />)}
      <Art p={[4.7, 1.8, 0.13]} w={0.7} h={0.9} art={1} />
      <Sign p={[4.7, 2.7, 0.13]} w={0.75} h={0.18} text="SYNERGY" bg="#c0392b" />
      <Clock p={[9.6, 2.55, 0.13]} />
      {/* break area: meeting table with chairs and a screen, kitchenette with coffee */}
      <Group p={[13.1, 0, 7.3]}>
        <Table p={[0, 0, 0]} w={2.0} d={1.1} h={0.75} top="#e9eef2" leg="#aab3b8" />
        {[-0.6, 0, 0.6].map((x) => <Chair key={`a${x}`} p={[x, 0, -0.75]} frame="#2b2a2e" cushion="#c0392b" />)}
        {[-0.6, 0, 0.6].map((x) => <Chair key={`b${x}`} p={[x, 0, 0.75]} r={[0, Math.PI, 0]} frame="#2b2a2e" cushion="#c0392b" />)}
        <Box s={[0.3, 0.004, 0.22]} p={[-0.3, 0.78, 0]} c="#fdfbf2" shadow={false} />
      </Group>
      <Group p={[14.62, 0, 7.0]} r={[0, -Math.PI / 2, 0]}>
        <Counter p={[0, 0, 0]} w={3.0} d={0.55} h={0.92} body="#e9eef2" top="#3a4252" />
        <Round s={[0.3, 0.38, 0.32]} p={[-0.9, 1.1, -0.05]} c="#2b2a2e" rad={0.03} />
        <Cyl rad={0.04} h={0.1} p={[-0.8, 0.97, 0.1]} c="#f4f1ea" shadow={false} />
        <Box s={[0.45, 0.04, 0.4]} p={[0.6, 0.94, 0]} c="#5a6066" shadow={false} />
        <Box s={[0.6, 0.75, 0.3]} p={[0.3, 1.9, -0.1]} c="#e9eef2" o={{ rough: 0.4 }} />
      </Group>
      <Rug p={[13.1, 7.3]} w={2.8} d={2.2} cols={["#3a4252", "#7d8f99", "#3a4252", "#5c6e98"]} />
      <DoorMat p={[3.4, 9.5]} />
      {/* manager's office: bookcase, armchairs round a coffee table, rug, blinds and art */}
      <Bookcase p={[14.6, 0, 2.5]} r={[0, -Math.PI / 2, 0]} w={3.6} h={2.2} d={0.4} wood={WALNUT} seed={21} files />
      <Rug p={[12.7, 2.4]} w={3.2} d={2.6} cols={["#5a3a28", "#c9a24a", "#2f4f66", "#e9dfc9"]} />
      <Group p={[13.6, 0, 3.8]}>
        <Table p={[0, 0, 0]} w={0.6} d={0.6} h={0.42} top={WALNUT} leg="#2b2a2e" round />
        <Chair p={[-0.45, 0, 0]} r={[0, Math.PI / 2, 0]} frame="#1a1a1f" cushion="#7a5a42" />
        <Chair p={[0.45, 0, 0]} r={[0, -Math.PI / 2, 0]} frame="#1a1a1f" cushion="#7a5a42" />
      </Group>
      {[12.7].map((x) => <Blind key={x} p={[x, 0, 0.14]} w={3.0} top={2.7} drop={0.7} colour="#e9eef2" />)}
      {[2.6, 6.8].map((x) => <Blind key={x} p={[x, 0, 0.14]} w={3.2} top={2.7} drop={0.4} colour="#e9eef2" />)}
      <Art p={[11.0, 1.8, 0.13]} w={0.5} h={0.7} art={2} />
      {/* ceiling panels across the floor plate */}
      {[[2.6, 2.4], [6.2, 2.4], [8.4, 4.8], [2.6, 5.6], [6.2, 6.4], [3.0, 8.4], [12.8, 2.4], [12.8, 7.4]].map(([x, z]) => <CeilingPanel key={`${x}${z}`} p={[x!, 3.28, z!]} />)}
    </Group>
  );
}
