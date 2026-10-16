import { Bed, Bookshelf, Sofa } from "../furniture";
import { Bedsides } from "../mansion";
import { Mirror, Pendant, Rug, Wardrobe, DoorMat } from "../decor";
import { Art, Ball, BRASS, Box, Chair, Cyl, Group, Plant, Round, Sign, Table, Till, type V3 } from "./kit";

/**
 * Cosy Corner: a warm furniture showroom of finished room sets. The display pieces are the same luxury
 * models the homes use, so what you buy here is what you get at home.
 */
const OAK = "#b98a5b";
const WALNUT = "#4a3022";
const SALE = "#c0392b";

function PriceTag({ p, text, r }: { p: V3; text: string; r?: V3 }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Cyl rad={0.008} h={0.25} p={[0, 0.12, 0]} c="#c9a24a" o={BRASS} shadow={false} />
      <Sign p={[0, 0.3, 0]} w={0.32} h={0.14} text={text} bg="#fff8e6" fg={SALE} border={SALE} />
    </Group>
  );
}

function FloorLamp({ p, shade = "#f1dfb0" }: { p: V3; shade?: string }) {
  return (
    <Group p={p}>
      <Cyl rad={0.15} h={0.03} p={[0, 0.015, 0]} c="#2b2a2e" shadow={false} />
      <Cyl rad={0.015} h={1.45} p={[0, 0.74, 0]} c="#c9a24a" o={BRASS} />
      <Cyl rad={0.2} h={0.26} p={[0, 1.55, 0]} c={shade} o={{ emissive: "#ffcf7d", glow: 0.6, rough: 0.8 }} />
    </Group>
  );
}

function Armchair({ p, r, c = "#3f6e6a" }: { p: V3; r?: V3; c?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Round s={[0.85, 0.24, 0.8]} p={[0, 0.27, 0]} c={c} rad={0.06} />
      <Round s={[0.6, 0.14, 0.62]} p={[0, 0.45, 0.05]} c={c} rad={0.05} />
      <Round s={[0.85, 0.5, 0.18]} p={[0, 0.62, -0.31]} c={c} rad={0.07} />
      {[-1, 1].map((s) => <Round key={s} s={[0.16, 0.32, 0.78]} p={[s * 0.36, 0.48, 0]} c={c} rad={0.06} />)}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Cyl key={`${x}${z}`} rad={0.025} h={0.15} p={[x! * 0.32, 0.075, z! * 0.3]} c={WALNUT} shadow={false} />)}
    </Group>
  );
}

/** Interactive: the lounge set: luxury sofa on a rug, coffee table, lamp and cushions. */
function SofaSet() {
  return (
    <Group>
      <Rug p={[0, 0.2]} w={2.9} d={2.0} cols={["#7a5a42", "#d9c3a0", "#b8433c", "#e9dfc9"]} />
      <Group p={[0, 0, -0.5]}><Sofa lux /></Group>
      <Round s={[1.0, 0.06, 0.55]} p={[0, 0.42, 0.45]} c={WALNUT} rad={0.02} o={{ rough: 0.4 }} />
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.04, 0.4, 0.04]} p={[x! * 0.44, 0.2, 0.45 + z! * 0.22]} c={WALNUT} />)}
      <Group p={[0.25, 0.45, 0.45]}>
        <Cyl rad={0.07} h={0.18} p={[0, 0.09, 0]} c="#2f7f79" o={{ rough: 0.3 }} />
        <Ball rad={0.05} p={[0.02, 0.22, 0]} c="#e9dfc9" />
      </Group>
      <Box s={[0.3, 0.04, 0.22]} p={[-0.25, 0.47, 0.45]} c="#d9695a" shadow={false} />
      <FloorLamp p={[1.3, 0, -0.65]} />
      <PriceTag p={[-1.3, 0, 0.75]} text="£899" />
    </Group>
  );
}

/** Interactive: the bedroom set: luxury bed with bedside tables, throw and a price tag. */
function BedSet() {
  return (
    <Group>
      <Rug p={[0, 0.35]} w={2.3} d={2.4} cols={["#5c6e98", "#e9dfc9", "#8a5a6b", "#f4efe4"]} />
      <Group p={[0, 0, -0.1]}>
        <Bed lux />
        <Bedsides lux />
      </Group>
      <PriceTag p={[1.05, 0, 1.2]} text="£1,250" />
    </Group>
  );
}

/** Interactive: the order desk: catalogues, a tablet kiosk and the till. */
function OrderDesk() {
  return (
    <Group>
      <Round s={[1.9, 0.92, 0.75]} p={[0, 0.46, 0]} c={OAK} rad={0.04} o={{ rough: 0.5 }} />
      <Round s={[2.0, 0.05, 0.85]} p={[0, 0.94, 0]} c="#f4efe4" rad={0.02} />
      <Box s={[1.7, 0.6, 0.02]} p={[0, 0.5, 0.385]} c="#7a5a42" shadow={false} />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.32, 0.03, 0.42]} p={[-0.55, 0.985 + i * 0.03, 0.05]} r={[0, 0.06 * i, 0]} c={["#c0392b", "#e9dfc9", "#2f7f79"][i]!} shadow={false} />)}
      <Group p={[0.1, 0.97, 0.1]}>
        <Box s={[0.3, 0.02, 0.22]} r={[-0.3, 0, 0]} c="#1a1a1f" shadow={false} />
        <Box s={[0.26, 0.004, 0.18]} p={[0, 0.012, 0]} r={[-0.3, 0, 0]} c="#0f2030" o={{ emissive: "#f3d9a8", glow: 0.7 }} shadow={false} />
      </Group>
      <Till p={[0.65, 0.97, -0.05]} />
      <Group p={[-0.85, 0.97, -0.2]}>
        <Cyl rad={0.06} h={0.2} p={[0, 0.1, 0]} c="#dff0f5" o={{ opacity: 0.5, rough: 0.05 }} shadow={false} />
        {[0, 1, 2].map((i) => <Ball key={i} rad={0.05} p={[(i - 1) * 0.05, 0.27 + (i % 2) * 0.04, 0]} c={["#d9695a", "#f3bf6a", "#f4c1d0"][i]!} />)}
      </Group>
      <Sign p={[0, 1.6, -0.3]} w={1.1} h={0.22} text="ORDER HERE" bg="#7a5a42" />
      <Cyl rad={0.008} h={0.5} p={[-0.4, 1.95, -0.3]} c="#2b2a2e" shadow={false} />
      <Cyl rad={0.008} h={0.5} p={[0.4, 1.95, -0.3]} c="#2b2a2e" shadow={false} />
    </Group>
  );
}

function SingleBed({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Box s={[1.05, 0.3, 2.0]} p={[0, 0.2, 0]} c={OAK} o={{ rough: 0.6 }} />
      <Round s={[0.95, 0.18, 1.9]} p={[0, 0.42, 0]} c="#f4efe4" rad={0.05} />
      <Round s={[0.96, 0.08, 1.2]} p={[0, 0.52, 0.32]} c="#5c8fc0" rad={0.03} />
      <Round s={[0.6, 0.12, 0.32]} p={[0, 0.56, -0.72]} c="#ffffff" rad={0.05} />
      <Box s={[1.05, 0.75, 0.06]} p={[0, 0.5, -0.98]} c={OAK} o={{ rough: 0.6 }} />
      <Ball rad={0.1} p={[0.25, 0.62, 0.2]} c="#c79a5c" o={{ rough: 1 }} />
    </Group>
  );
}

export function CosyCornerFixture({ id }: { id: string }) {
  switch (id) {
    case "sofa-display": return <SofaSet />;
    case "bed-display": return <BedSet />;
    case "catalogue": return <OrderDesk />;
    default: return null;
  }
}

export function CosyCornerDecor() {
  return (
    <Group>
      {/* dining room set with a runner, vase and pendant */}
      <Group p={[6.5, 0, 2.7]}>
        <Rug p={[0, 0]} w={2.6} d={1.9} cols={["#2f7f79", "#e9dfc9", "#c9a24a", "#f4efe4"]} />
        <Table p={[0, 0, 0]} w={1.6} d={0.9} top={OAK} leg={WALNUT} />
        <Box s={[1.5, 0.006, 0.3]} p={[0, 0.78, 0]} c="#b8433c" shadow={false} />
        <Cyl rad={0.06} h={0.22} p={[0.2, 0.89, 0]} c="#f4efe4" />
        {[0, 1].map((i) => <Ball key={i} rad={0.06} p={[0.18 + i * 0.05, 1.05, 0]} c="#f3bf6a" />)}
        {[-0.45, 0.45].map((x) => <Chair key={`n${x}`} p={[x, 0, -0.62]} cushion="#e9dfc9" frame={WALNUT} />)}
        {[-0.45, 0.45].map((x) => <Chair key={`s${x}`} p={[x, 0, 0.62]} r={[0, Math.PI, 0]} cushion="#e9dfc9" frame={WALNUT} />)}
        <PriceTag p={[1.05, 0, 0.7]} text="£640" />
      </Group>
      <Pendant p={[6.5, 3.3, 2.7]} colour="#ffd9a0" cord={1.2} r={0.3} />
      {/* armchairs with a side table and lamp */}
      <Armchair p={[0.95, 0, 6.0]} r={[0, Math.PI / 2, 0]} />
      <Armchair p={[0.95, 0, 7.0]} r={[0, Math.PI / 2, 0]} c="#b8433c" />
      <Group p={[1.4, 0, 6.5]}>
        <Cyl rad={0.2} h={0.03} p={[0, 0.55, 0]} c={WALNUT} />
        <Cyl rad={0.03} h={0.55} p={[0, 0.275, 0]} c={WALNUT} />
        <Cyl rad={0.05} h={0.25} p={[0, 0.69, 0]} c="#2f7f79" />
        <Cyl rad={0.14} h={0.16} p={[0, 0.88, 0]} c="#f1dfb0" o={{ emissive: "#ffcf7d", glow: 0.5 }} />
      </Group>
      <PriceTag p={[1.8, 0, 7.3]} text="£320" />
      {/* bookcases and a dresser along the back wall */}
      <Group p={[5.25, 0, 0.38]}><Bookshelf lux /></Group>
      <Group p={[6.75, 0, 0.38]}><Bookshelf lux={false} /></Group>
      <Group p={[8.2, 0, 0.38]}>
        <Round s={[1.2, 0.85, 0.45]} p={[0, 0.425, 0]} c={OAK} rad={0.03} />
        {[0.2, 0.45, 0.7].map((y) => <Box key={y} s={[1.1, 0.2, 0.02]} p={[0, y, 0.23]} c="#a87a4b" shadow={false} />)}
        <Cyl rad={0.08} h={0.3} p={[-0.35, 1.0, 0]} c="#2f7f79" />
        <Mirror p={[0, 1.55, -0.18]} w={0.9} h={0.7} />
      </Group>
      {/* sideboard on the left wall */}
      <Group p={[0.42, 0, 4.6]} r={[0, Math.PI / 2, 0]}>
        <Round s={[1.3, 0.8, 0.5]} p={[0, 0.4, 0]} c={WALNUT} rad={0.03} />
        {[-0.32, 0.32].map((x) => <Box key={x} s={[0.6, 0.65, 0.02]} p={[x, 0.42, 0.255]} c="#6b4a32" shadow={false} />)}
        <Plant p={[-0.4, 0.8, 0]} s={0.55} pot="#e9dfc9" />
        <Cyl rad={0.13} h={0.18} p={[0.35, 1.05, 0]} c="#f1dfb0" o={{ emissive: "#ffcf7d", glow: 0.5 }} />
        <Cyl rad={0.03} h={0.22} p={[0.35, 0.91, 0]} c="#c9a24a" o={BRASS} />
      </Group>
      {/* wall art, the shop sign and a sale banner */}
      <Art p={[0.12, 1.7, 2.3]} r={[0, Math.PI / 2, 0]} w={0.8} h={0.6} art={1} />
      <Art p={[0.12, 1.7, 3.3]} r={[0, Math.PI / 2, 0]} w={0.5} h={0.6} art={2} />
      <Sign p={[2.6, 2.55, 0.13]} w={2.4} h={0.4} text="COSY CORNER" bg="#7a5a42" fg="#fff1c2" />
      <Sign p={[2.6, 2.05, 0.13]} w={1.6} h={0.24} text="SALE NOW ON" bg={SALE} />
      <Plant p={[0.5, 0, 0.5]} s={1.1} />
      <Plant p={[9.1, 0, 8.9]} s={1.0} />
      <DoorMat p={[5.7, 9.0]} />
      {[2.6, 6.5].map((x) => <Pendant key={x} p={[x, 3.3, x < 3 ? 4.6 : 6.4]} colour="#fff0d8" cord={1.0} />)}
      {/* bedroom gallery: wardrobe, a single bed, a mirror and a soft rug */}
      <Wardrobe p={[13.5, 0, 6.5]} rot={-Math.PI / 2} w={2.0} d={0.6} />
      <SingleBed p={[11.2, 0, 8.0]} />
      <PriceTag p={[12.0, 0, 7.0]} text="£450" />
      <Rug p={[11.8, 5.6]} w={2.0} d={1.2} cols={["#e9dfc9", "#c9a24a", "#f4efe4", "#e9dfc9"]} />
      <Art p={[13.88, 1.8, 2.4]} r={[0, -Math.PI / 2, 0]} w={0.7} h={0.5} art={0} />
      <Pendant p={[11.9, 3.3, 2.6]} colour="#ffd2a0" cord={1.0} />
      <Plant p={[10.1, 0, 9.0]} s={0.9} pot="#7a5a42" />
    </Group>
  );
}
