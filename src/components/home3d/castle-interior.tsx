import { useMemo } from "react";
import { Ball, Box, Cone, Cyl, Group, Round } from "./primitives";
import { Curtains, Rug, Wardrobe } from "./decor";
import { Armchair } from "./mansion";
import { Bookcase, Sign } from "./venues/kit";

/**
 * The castle interior (plan CASTLE in src/lib/home3d/plans.ts). Seven stone rooms dressed in plan
 * coordinates: a great hall with hearth and throne, a banquet hall, the games gallery, a four-poster royal
 * chamber, the entrance hall with its grand stair, a library and an armoury. Interactive furniture comes
 * from the normal home fixtures at the plan's slots; this is the architecture and set dressing around them.
 */
type V3 = [number, number, number];
const STONE = "#bdb4a2";
const STONE_D = "#8f877a";
const OAK = "#6b4a32";
const OAK_D = "#4a3022";
const RED = "#8a2a34";
const GOLD = "#c9a24a";
const IRON = "#2b2a2e";
const BRASS = { rough: 0.3, metal: 0.85 };
const STEEL = { rough: 0.25, metal: 0.9 };

/** Iron ring chandelier with candles, hung on chains. */
function IronChandelier({ p, r = 0.8 }: { p: V3; r?: number }) {
  return (
    <Group p={p}>
      {[-1, 1].map((s) => <Cyl key={s} rad={0.01} h={0.9} p={[s * r * 0.5, 0.45, 0]} r={[0, 0, s * -0.5]} c={IRON} shadow={false} />)}
      {/* an open iron hoop, so it never blocks the view from below */}
      <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[r, 0.035, 8, 40]} /><meshStandardMaterial color={IRON} metalness={0.5} roughness={0.5} /></mesh>
      {[0, Math.PI / 2].map((a) => <Box key={a} s={[r * 2, 0.025, 0.025]} r={[0, a, 0]} c={IRON} shadow={false} />)}
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return (
          <Group key={i} p={[Math.cos(a) * r, 0, Math.sin(a) * r]}>
            <Cyl rad={0.025} h={0.14} p={[0, 0.1, 0]} c="#f4ead6" shadow={false} />
            <Ball rad={0.025} p={[0, 0.2, 0]} c="#ffd27a" o={{ emissive: "#ffb347", glow: 2.2 }} shadow={false} />
          </Group>
        );
      })}
    </Group>
  );
}
/** A long hanging heraldic banner. */
function Banner({ p, r, h = 2.0, c = RED, stripe = GOLD }: { p: V3; r?: V3; h?: number; c?: string; stripe?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[0.9, 0.05, 0.05]} p={[0, h / 2 + 0.05, 0.02]} c={OAK} />
      <Box s={[0.8, h, 0.02]} p={[0, 0, 0.04]} c={c} shadow={false} />
      <Box s={[0.14, h, 0.022]} p={[0, 0, 0.045]} c={stripe} shadow={false} />
      <Cone rad={0.4} h={0.3} p={[0, -h / 2 - 0.15, 0.04]} r={[Math.PI, Math.PI / 4, 0]} c={c} shadow={false} />
      <Ball rad={0.12} p={[0, h * 0.2, 0.06]} c={stripe} o={BRASS} shadow={false} />
    </Group>
  );
}
/** Wall torch in an iron sconce, flame glowing. */
function Sconce({ p, r }: { p: V3; r?: V3 }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[0.08, 0.2, 0.06]} p={[0, 0, 0.03]} c={IRON} />
      <Cyl rad={0.03} h={0.32} p={[0, 0.1, 0.14]} r={[0.35, 0, 0]} c={OAK_D} />
      <Cone rad={0.06} h={0.16} p={[0, 0.3, 0.2]} c="#ffb347" o={{ emissive: "#ff8a1a", glow: 2.4 }} shadow={false} />
    </Group>
  );
}
function SuitOfArmour({ p, rot = 0 }: { p: [number, number]; rot?: number }) {
  return (
    <Group p={[p[0], 0, p[1]]} r={[0, rot, 0]}>
      <Box s={[0.42, 0.12, 0.42]} p={[0, 0.06, 0]} c={STONE_D} />
      {[-0.09, 0.09].map((x) => <Cyl key={x} rad={0.06} h={0.8} p={[x, 0.52, 0]} c="#c9ccd2" o={STEEL} />)}
      <Round s={[0.4, 0.55, 0.26]} p={[0, 1.2, 0]} c="#c9ccd2" rad={0.1} o={STEEL} />
      {[-0.26, 0.26].map((x) => <Cyl key={x} rad={0.05} h={0.6} p={[x, 1.15, 0]} c="#c9ccd2" o={STEEL} />)}
      <Ball rad={0.16} p={[0, 1.62, 0]} c="#c9ccd2" o={STEEL} />
      <Box s={[0.2, 0.03, 0.02]} p={[0, 1.62, 0.15]} c={IRON} />
      <Cone rad={0.04} h={0.2} p={[0, 1.85, 0]} c={RED} />
      <Cyl rad={0.012} h={1.9} p={[0.32, 0.95, 0.06]} c={OAK_D} shadow={false} />
      <Cone rad={0.04} h={0.18} p={[0.32, 1.98, 0.06]} c="#c9ccd2" o={STEEL} />
    </Group>
  );
}
function Shield({ p, r, c = RED }: { p: V3; r?: V3; c?: string }) {
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Round s={[0.5, 0.6, 0.05]} p={[0, 0, 0.03]} c={c} rad={0.08} />
      <Box s={[0.08, 0.5, 0.055]} p={[0, 0, 0.035]} c={GOLD} shadow={false} />
      <Box s={[0.4, 0.08, 0.055]} p={[0, 0.08, 0.035]} c={GOLD} shadow={false} />
      {[-1, 1].map((s) => <Cyl key={s} rad={0.012} h={0.9} p={[s * 0.18, 0, 0.0]} r={[0, 0, s * 0.8]} c="#c9ccd2" o={STEEL} shadow={false} />)}
    </Group>
  );
}
function Bench({ p, w }: { p: V3; w: number }) {
  return (
    <Group p={p}>
      <Box s={[w, 0.07, 0.32]} p={[0, 0.45, 0]} c={OAK} />
      {[-w / 2 + 0.2, w / 2 - 0.2].map((x) => <Box key={x} s={[0.07, 0.45, 0.28]} p={[x, 0.22, 0]} c={OAK_D} />)}
    </Group>
  );
}
function Candelabra({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Cyl rad={0.07} h={0.03} c={GOLD} o={BRASS} />
      <Cyl rad={0.015} h={0.32} p={[0, 0.16, 0]} c={GOLD} o={BRASS} />
      <Box s={[0.3, 0.02, 0.02]} p={[0, 0.28, 0]} c={GOLD} o={BRASS} />
      {[-0.15, 0, 0.15].map((x) => (
        <Group key={x} p={[x, 0.3, 0]}>
          <Cyl rad={0.015} h={0.12} p={[0, 0.06, 0]} c="#f4ead6" shadow={false} />
          <Ball rad={0.018} p={[0, 0.14, 0]} c="#ffd27a" o={{ emissive: "#ffb347", glow: 2.2 }} shadow={false} />
        </Group>
      ))}
    </Group>
  );
}
function Throne({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Box s={[0.9, 0.5, 0.75]} p={[0, 0.25, 0]} c={OAK_D} />
      <Round s={[0.75, 0.12, 0.6]} p={[0, 0.55, 0.05]} c={RED} rad={0.04} />
      <Box s={[0.9, 1.6, 0.14]} p={[0, 1.25, -0.32]} c={OAK_D} />
      <Round s={[0.7, 1.2, 0.06]} p={[0, 1.2, -0.24]} c={RED} rad={0.04} />
      {[-0.42, 0.42].map((x) => <Box key={x} s={[0.1, 0.4, 0.7]} p={[x, 0.75, 0]} c={OAK_D} />)}
      {[-0.42, 0.42].map((x) => <Ball key={`b${x}`} rad={0.07} p={[x, 2.1, -0.32]} c={GOLD} o={BRASS} />)}
      <Cone rad={0.12} h={0.25} p={[0, 2.2, -0.32]} c={GOLD} o={BRASS} />
    </Group>
  );
}

export function CastleDecor({ owned }: { owned: ReadonlySet<string> }) {
  const hasBed = owned.has("bed");
  const hasSofa = owned.has("sofa");
  const books = useMemo(() => [0, 1, 2, 3, 4].map((i) => i), []);
  return (
    <Group>
      {/* =================== great hall =================== */}
      <IronChandelier p={[5.0, 3.15, 3.6]} r={1.0} />
      {/* the great hearth: stone surround, hood and a roaring fire */}
      <Group p={[2.5, 0, 0.42]}>
        <Box s={[2.2, 1.6, 0.6]} p={[0, 0.8, 0]} c={STONE_D} />
        <Box s={[1.4, 1.0, 0.1]} p={[0, 0.5, 0.26]} c="#15110e" shadow={false} />
        <Box s={[2.5, 0.12, 0.7]} p={[0, 1.66, 0.04]} c={STONE} />
        <Box s={[1.6, 1.6, 0.5]} p={[0, 2.5, -0.05]} c={STONE} />
        {[[-0.3, 0.18], [0, 0.22], [0.3, 0.16]].map(([x, h], i) => <Cone key={i} rad={0.16} h={h! + 0.3} p={[x!, 0.25, 0.2]} c="#ff9a3a" o={{ emissive: "#ff6a10", glow: 2.0 }} shadow={false} />)}
        {[-0.3, 0.3].map((x) => <Cyl key={x} rad={0.06} h={0.9} p={[x, 0.12, 0.22]} r={[0, 0, Math.PI / 2]} c={OAK_D} />)}
        <Shield p={[0, 2.4, 0.22]} />
      </Group>
      {/* throne on its dais, a red runner leading to it, banners and guards of armour */}
      <Box s={[2.2, 0.25, 1.5]} p={[7.7, 0.125, 0.86]} c={STONE} />
      <Box s={[1.8, 0.02, 1.2]} p={[7.7, 0.26, 0.9]} c={RED} shadow={false} />
      <Throne p={[7.7, 0.26, 0.75]} />
      <Box s={[1.1, 0.012, 5.4]} p={[8.5, 0.006, 4.3]} c={RED} shadow={false} />
      <Banner p={[6.2, 2.4, 0.16]} />
      <Banner p={[9.2, 2.4, 0.16]} c="#1f3a6a" />
      <SuitOfArmour p={[6.25, 1.9]} />
      <SuitOfArmour p={[9.4, 1.9]} />
      {[[0.16, 1.6], [0.16, 6.2]].map(([x, z], i) => <Sconce key={i} p={[x!, 2.2, z!]} r={[0, Math.PI / 2, 0]} />)}
      <Sconce p={[4.0, 2.2, 0.24]} />
      <Rug p={[2.0, 3.6]} w={3.6} d={3.0} cols={["#7a2d3a", "#c9a24a", "#2a2a4a", "#7a2d3a"]} />
      {hasSofa && <Box s={[1.0, 0.45, 0.7]} p={[1.75, 0.225, 3.6]} c={OAK} />}
      {hasSofa && <Box s={[1.05, 0.04, 0.75]} p={[1.75, 0.47, 3.6]} c={GOLD} o={BRASS} />}
      <Curtains p={[1.0, 0, 0.26]} w={1.1} drop={3.3} top={3.8} colour={RED} pelmet={GOLD} />
      <Curtains p={[9.2, 0, 0.26]} w={1.1} drop={3.3} top={3.8} colour={RED} pelmet={GOLD} />

      {/* =================== banquet hall =================== */}
      <IronChandelier p={[13.0, 3.15, 4.05]} r={0.8} />
      <Group p={[13.0, 0, 4.05]}>
        <Box s={[4.0, 0.08, 1.1]} p={[0, 0.78, 0]} c={OAK} />
        {[-1.8, 1.8].map((x) => <Box key={x} s={[0.12, 0.78, 0.9]} p={[x, 0.39, 0]} c={OAK_D} />)}
        <Box s={[3.8, 0.012, 0.4]} p={[0, 0.825, 0]} c="#efe4c8" shadow={false} />
        {[-1.4, -0.5, 0.5, 1.4].map((x) => [-0.35, 0.35].map((z) => (
          <Group key={`${x}${z}`} p={[x, 0.82, z]}>
            <Cyl rad={0.12} h={0.02} c="#e9e3d2" shadow={false} />
            <Cyl rad={0.03} h={0.14} p={[0.12, 0.07, 0]} c={GOLD} o={BRASS} shadow={false} />
          </Group>
        )))}
        <Candelabra p={[-0.9, 0.82, 0]} />
        <Candelabra p={[0.9, 0.82, 0]} />
        <Round s={[0.5, 0.18, 0.3]} p={[0, 0.92, 0]} c="#b5652a" rad={0.08} />
        <Bench p={[0, 0, -0.78]} w={3.6} />
        <Bench p={[0, 0, 0.78]} w={3.6} />
      </Group>
      <Banner p={[11.2, 2.5, 0.16]} />
      <Banner p={[14.8, 2.5, 0.16]} c="#1f3a6a" />
      <Sconce p={[15.84, 2.2, 6.2]} r={[0, -Math.PI / 2, 0]} />

      {/* =================== games gallery =================== */}
      <IronChandelier p={[20.0, 3.15, 3.6]} r={0.7} />
      <Group p={[23.6, 0, 3.2]}>
        <Box s={[0.6, 0.45, 4.4]} p={[0, 0.225, 0]} c={OAK_D} />
        <Round s={[0.55, 0.12, 4.3]} p={[0, 0.5, 0]} c={RED} rad={0.05} />
        <Round s={[0.14, 0.7, 4.3]} p={[0.22, 0.85, 0]} c={RED} rad={0.05} />
      </Group>
      {/* trophy antlers and crossed shields on the back wall */}
      <Group p={[18.4, 2.6, 0.16]}>
        <Box s={[0.4, 0.5, 0.06]} p={[0, 0, 0.03]} c={OAK} />
        {[-1, 1].map((s) => <Cyl key={s} rad={0.025} h={0.6} p={[s * 0.25, 0.25, 0.08]} r={[0, 0, s * -0.7]} c="#e9dfc9" />)}
      </Group>
      <Shield p={[22.6, 2.6, 0.16]} c="#1f3a6a" />
      <Sign p={[20.0, 3.35, 0.2]} w={2.4} h={0.36} text="THE KING'S GAMBIT" bg={RED} fg="#fff2d6" />

      {/* =================== royal chamber =================== */}
      {hasBed && (
        <Group p={[3.5, 0, 8.45]}>
          {/* four-poster frame and canopy around the bed fixture */}
          {[[-1.2, -1.05], [1.2, -1.05], [-1.2, 1.05], [1.2, 1.05]].map(([x, z]) => <Cyl key={`${x}${z}`} rad={0.06} h={2.6} p={[x!, 1.3, z!]} c={OAK_D} />)}
          <Box s={[2.5, 0.1, 2.2]} p={[0, 2.62, 0]} c={OAK_D} />
          <Box s={[2.4, 0.04, 2.1]} p={[0, 2.55, 0]} c={RED} shadow={false} />
          {[-1, 1].map((s) => <Box key={s} s={[0.04, 1.9, 0.5]} p={[s * 1.22, 1.6, -0.75]} c={RED} shadow={false} />)}
          <Box s={[2.4, 0.3, 0.04]} p={[0, 2.42, 1.07]} c={GOLD} shadow={false} />
          <Group p={[0, 0, 1.6]}>
            <Box s={[1.2, 0.5, 0.55]} p={[0, 0.25, 0]} c={OAK} />
            <Box s={[1.25, 0.06, 0.6]} p={[0, 0.52, 0]} c={GOLD} o={BRASS} />
          </Group>
        </Group>
      )}
      <Wardrobe p={[0.42, 0, 13.5]} rot={Math.PI / 2} w={2.0} d={0.62} h={2.6} c={OAK_D} handle={GOLD} />
      <Rug p={[3.5, 11.6]} w={3.2} d={2.4} cols={["#2a2a4a", "#c9a24a", "#7a2d3a", "#2a2a4a"]} />
      <Banner p={[6.84, 2.6, 12.2]} r={[0, -Math.PI / 2, 0]} h={1.6} c="#1f3a6a" />
      <Curtains p={[0.26, 0, 9.9]} rot={Math.PI / 2} w={1.1} drop={3.0} top={3.6} colour="#2a2a4a" pelmet={GOLD} />
      <Sconce p={[0.16, 2.2, 8.0]} r={[0, Math.PI / 2, 0]} />
      <IronChandelier p={[3.5, 3.2, 11.0]} r={0.55} />

      {/* =================== entrance hall =================== */}
      {/* grand stair rising against the chamber wall */}
      <Group p={[7.55, 0, 12.7]}>
        {Array.from({ length: 10 }, (_, i) => <Box key={i} s={[0.9, 0.18 + i * 0.18, 0.34]} p={[0, (0.18 + i * 0.18) / 2, 1.55 - i * 0.34]} c={i % 2 ? STONE : "#c9c0ae"} />)}
        <Box s={[0.82, 0.02, 3.4]} p={[0, 0.0, 0]} c={RED} shadow={false} />
        <Box s={[0.06, 0.06, 3.5]} p={[0.46, 1.6, -0.2]} r={[0.52, 0, 0]} c={OAK_D} />
      </Group>
      <Box s={[1.2, 0.012, 6.6]} p={[9.25, 0.008, 11.2]} c={RED} shadow={false} />
      <SuitOfArmour p={[11.1, 14.0]} rot={-Math.PI / 2} />
      <Shield p={[9.25, 3.4, 7.42]} r={[0, Math.PI, 0]} />
      <Sconce p={[11.34, 2.2, 8.4]} r={[0, -Math.PI / 2, 0]} />
      <IronChandelier p={[9.25, 3.25, 11.0]} r={0.6} />

      {/* =================== library =================== */}
      {books.map((i) => <Bookcase key={i} p={[12.3 + i * 1.0, 0, 7.52]} w={0.96} h={3.2} d={0.4} wood={OAK_D} seed={i + 3} />)}
      <Group p={[14.25, 0, 10.7]}>
        <Box s={[1.8, 0.07, 0.9]} p={[0, 0.76, 0]} c={OAK} />
        {[-0.8, 0.8].map((x) => <Box key={x} s={[0.1, 0.76, 0.8]} p={[x, 0.38, 0]} c={OAK_D} />)}
        <Box s={[0.3, 0.05, 0.22]} p={[-0.4, 0.82, 0]} c="#7a2d3a" />
        <Candelabra p={[0.5, 0.8, 0]} />
      </Group>
      <Armchair p={[12.6, 12.4]} rot={Math.PI / 2} c={RED} />
      {/* globe on its stand and a rolling ladder */}
      <Group p={[16.2, 0, 13.6]}>
        <Cyl rad={0.15} h={0.7} p={[0, 0.35, 0]} c={OAK_D} />
        <Ball rad={0.3} p={[0, 1.0, 0]} c="#4a7a9a" />
        <Cyl rad={0.32} h={0.02} p={[0, 1.0, 0]} r={[Math.PI / 2, 0, 0.4]} c={GOLD} o={BRASS} />
      </Group>
      <Group p={[15.8, 0, 7.9]} r={[-0.2, 0, 0]}>
        {[-0.22, 0.22].map((x) => <Box key={x} s={[0.04, 3.0, 0.04]} p={[x, 1.5, 0]} c={OAK} />)}
        {Array.from({ length: 8 }, (_, i) => <Box key={i} s={[0.44, 0.03, 0.04]} p={[0, 0.3 + i * 0.36, 0]} c={OAK} />)}
      </Group>
      <IronChandelier p={[14.2, 3.2, 11.0]} r={0.55} />

      {/* =================== armoury =================== */}
      <Group p={[23.62, 0, 11.1]}>
        <Box s={[0.5, 0.15, 6.2]} p={[0, 0.075, 0]} c={OAK_D} />
        <Box s={[0.12, 2.4, 6.2]} p={[0.15, 1.2, 0]} c={OAK} />
        {Array.from({ length: 9 }, (_, i) => (
          <Group key={i} p={[-0.05, 0, -2.8 + i * 0.7]}>
            {i % 3 === 0
              ? <><Cyl rad={0.015} h={2.2} p={[0, 1.2, 0]} c={OAK_D} /><Cone rad={0.05} h={0.25} p={[0, 2.4, 0]} c="#c9ccd2" o={STEEL} /></>
              : <><Box s={[0.03, 1.0, 0.07]} p={[0, 0.85, 0]} c="#c9ccd2" o={STEEL} /><Box s={[0.05, 0.05, 0.28]} p={[0, 0.33, 0]} c={GOLD} o={BRASS} /><Box s={[0.04, 0.22, 0.05]} p={[0, 0.2, 0]} c={OAK_D} /></>}
          </Group>
        ))}
      </Group>
      {[[18.0, 7.42], [19.6, 7.42]].map(([x, z], i) => <Shield key={i} p={[x!, 2.6, z!]} r={[0, Math.PI, 0]} c={i ? "#1f3a6a" : RED} />)}
      <SuitOfArmour p={[17.6, 8.0]} rot={0} />
      {/* training dummy and an archery butt */}
      <Group p={[18.3, 0, 14.0]}>
        <Cyl rad={0.05} h={1.3} p={[0, 0.65, 0]} c={OAK} />
        <Round s={[0.4, 0.55, 0.3]} p={[0, 1.1, 0]} c="#c9b07a" rad={0.1} o={{ rough: 1 }} />
        <Box s={[0.9, 0.06, 0.06]} p={[0, 1.15, 0]} c={OAK} />
        <Ball rad={0.15} p={[0, 1.5, 0]} c="#c9b07a" o={{ rough: 1 }} />
      </Group>
      <Group p={[22.4, 0, 14.5]}>
        <Cyl rad={0.45} h={0.12} p={[0, 1.0, 0]} r={[Math.PI / 2, 0, 0]} c="#d9c27a" />
        {[0.32, 0.22, 0.1].map((r, i) => <Cyl key={r} rad={r} h={0.125} p={[0, 1.0, 0.005]} r={[Math.PI / 2, 0, 0]} c={["#f4f1ea", "#3d5a8a", "#c0392b"][i]!} />)}
        {[-0.3, 0.3].map((x) => <Box key={x} s={[0.05, 1.0, 0.05]} p={[x, 0.5, -0.15]} c={OAK} />)}
      </Group>
      <Sconce p={[17.16, 2.2, 13.0]} r={[0, Math.PI / 2, 0]} />
      <IronChandelier p={[20.5, 3.2, 11.0]} r={0.65} />
    </Group>
  );
}
