import { CornerShopDecor, CornerShopFixture } from "../corner-shop-detailed";
import { DoorMat } from "../decor";
import { Art, Box, CeilingPanel, Clock, Cyl, Group, NoticeBoard, Plant, Racking, Round, STEEL, Sign, type V3 } from "./kit";

/**
 * Corner Shop: the stocked convenience-store kit from the shop fidelity pass, now in a real shop with a
 * stockroom behind the shelves (racking, a delivery cage and the staff tea corner).
 * The kit was laid out for a 10 × 8 room; the shop floor now starts 2.6 m forward, so it is shifted to match.
 */
const SHIFT = 2.6;
const SHELF_GREEN = "#3c6660";

/** Interactive: the community notice board on a freestanding stand. */
function JobsBoard() {
  return (
    <Group>
      {[-0.55, 0.55].map((x) => <Box key={x} s={[0.06, 1.9, 0.06]} p={[x, 0.95, 0]} c="#3a3f45" o={STEEL} />)}
      <Box s={[0.5, 0.04, 0.3]} p={[-0.55, 0.02, 0]} c="#3a3f45" shadow={false} />
      <Box s={[0.5, 0.04, 0.3]} p={[0.55, 0.02, 0]} c="#3a3f45" shadow={false} />
      <NoticeBoard p={[0, 1.35, 0.04]} w={1.05} h={0.85} header="JOBS" frame={SHELF_GREEN} />
    </Group>
  );
}

export function ShopFixture({ id }: { id: string }) {
  if (id === "shop-board") return <JobsBoard />;
  return <CornerShopFixture id={id} />;
}

/** Glass-door bottle chiller by the door. */
function Chiller({ p }: { p: V3 }) {
  const cols = ["#c0392b", "#4a8fd9", "#4f8a3e", "#e0b84a", "#f4f1ea"];
  return (
    <Group p={p}>
      <Box s={[1.1, 2.05, 0.66]} p={[0, 1.03, 0]} c="#262e34" o={{ rough: 0.5 }} />
      <Box s={[0.9, 1.75, 0.015]} p={[0, 1.08, 0.34]} c="#dff0f5" o={{ opacity: 0.28, rough: 0.05 }} shadow={false} />
      {[0.35, 0.84, 1.33, 1.8].map((y, i) => (
        <Group key={y} p={[0, y, 0.12]}>
          <Box s={[0.85, 0.03, 0.4]} c="#9aa5aa" o={STEEL} shadow={false} />
          {[-0.32, -0.16, 0, 0.16, 0.32].map((x, j) => <Cyl key={x} rad={0.045} h={0.25} p={[x, 0.14, 0]} c={cols[(i + j) % cols.length]!} shadow={false} />)}
        </Group>
      ))}
      <Box s={[0.9, 0.04, 0.01]} p={[0, 1.98, 0.34]} c="#ffffff" o={{ emissive: "#eef6ff", glow: 1.2 }} shadow={false} />
    </Group>
  );
}

export function ShopDecor() {
  return (
    <Group>
      <Group p={[0, 0, SHIFT]}><CornerShopDecor /></Group>
      {/* the kit's header sign now hangs from the ceiling on chains */}
      {[3.95, 5.95].map((x) => <Cyl key={x} rad={0.006} h={0.35} p={[x, 2.98, 2.86]} c="#2b2a2e" shadow={false} />)}
      <Chiller p={[9.1, 0, 8.45]} />
      <Sign p={[5.0, 2.7, 6.2]} w={2.4} h={0.36} text="CORNER SHOP" bg={SHELF_GREEN} fg="#f6e7c4" />
      {[4.1, 5.9].map((x) => <Cyl key={x} rad={0.006} h={0.3} p={[x, 3.0, 6.2]} c="#2b2a2e" shadow={false} />)}
      <Art p={[0.12, 1.8, 6.2]} r={[0, Math.PI / 2, 0]} w={0.6} h={0.8} art={2} />
      <Sign p={[0.12, 2.5, 6.2]} r={[0, Math.PI / 2, 0]} w={1.2} h={0.24} text="FRESH TODAY" bg="#b55a51" />
      <Clock p={[9.88, 2.45, 6.6]} r={[0, -Math.PI / 2, 0]} />
      <Plant p={[0.5, 0, 10.0]} s={0.8} pot={SHELF_GREEN} />
      <DoorMat p={[5.0, 10.1]} />
      {/* stockroom: racking, stacked deliveries, a roll cage, the tea corner and a mop */}
      <Racking p={[1.05, 0, 0.45]} w={1.6} h={2.0} d={0.5} seed={4} />
      <Racking p={[0.38, 0, 1.6]} r={[0, Math.PI / 2, 0]} w={1.5} h={2.0} d={0.42} seed={7} />
      {[[2.4, 0.2], [2.85, 0.2], [2.6, 0.55], [3.1, 0.18]].map(([x, y], i) => <Box key={i} s={[0.42, 0.34, 0.45]} p={[x!, y! + 0.0, 0.42]} c={["#b88b5f", "#c9a77c", "#9c7650", "#b88b5f"][i]!} o={{ rough: 0.9 }} />)}
      <Group p={[9.1, 0, 0.65]}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.03, 1.7, 0.03]} p={[x! * 0.62, 0.85, z! * 0.38]} c="#9aa5aa" o={STEEL} shadow={false} />)}
        {[0.15, 0.9, 1.65].map((y) => <Box key={y} s={[1.26, 0.03, 0.78]} p={[0, y, 0]} c="#9aa5aa" o={STEEL} shadow={false} />)}
        {[[-0.3, 0.35], [0.3, 0.35], [0, 1.1], [-0.35, 1.1]].map(([x, y], i) => <Box key={i} s={[0.5, 0.38, 0.6]} p={[x!, y!, 0]} c={["#c9a77c", "#e9dfc9", "#b88b5f", "#9c7650"][i]!} o={{ rough: 0.9 }} />)}
      </Group>
      <Group p={[4.6, 0, 1.95]}>
        <Round s={[0.8, 0.04, 0.55]} p={[0, 0.74, 0]} c="#e9e2d2" rad={0.01} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.03, 0.74, 0.03]} p={[x! * 0.36, 0.37, z! * 0.24]} c="#3a3f45" shadow={false} />)}
        <Round s={[0.16, 0.18, 0.14]} p={[-0.2, 0.85, 0]} c="#c9ced2" rad={0.03} o={STEEL} />
        <Cyl rad={0.04} h={0.09} p={[0.15, 0.8, 0.05]} c="#b55a51" shadow={false} />
        <Cyl rad={0.04} h={0.09} p={[0.25, 0.8, -0.08]} c="#f4f1ea" shadow={false} />
      </Group>
      <Group p={[7.8, 0, 2.15]}>
        <Cyl rad={0.17} h={0.3} p={[0, 0.15, 0]} c="#e0b84a" o={{ rough: 0.5 }} />
        <Cyl rad={0.012} h={1.1} p={[0.05, 0.75, 0]} r={[0, 0, 0.15]} c="#8a6a45" shadow={false} />
      </Group>
      <Sign p={[7.0, 2.35, 0.13]} w={1.2} h={0.24} text="STAFF ONLY" bg="#b55a51" />
      <CeilingPanel p={[5.0, 2.9, 1.3]} w={1.2} d={0.2} colour="#f2efe2" />
      {[[2.4, 5.6], [5.2, 8.0], [7.8, 5.6]].map(([x, z]) => <CeilingPanel key={`${x}${z}`} p={[x!, 3.12, z!]} w={1.5} d={0.3} />)}
    </Group>
  );
}
