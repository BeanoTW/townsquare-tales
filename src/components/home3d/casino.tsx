import { useMemo } from "react";
import * as THREE from "three";
import { Ball, Box, Cyl, Group, Round, mat } from "./primitives";
import { Frame } from "./furniture";
import { Armchair, Chandelier, SlotBank } from "./mansion";
import { feltTexture, neonTexture } from "./textures";

/**
 * Lucky Sevens: a windowless gaming floor (so it looks the same at any hour), a marble entrance hall with a
 * cashier cage, and a walled-off high-stakes room. Only the dice table, blackjack table and one slot bank are
 * interactive; the rest is set dressing that keeps clear of the walkable aisles (see CASINO.colliders).
 */
const GOLD = "#c9a24a";
const BRASS = { rough: 0.3, metal: 0.85 };

const neonMat = (text: string, colour: string) => {
  const t = neonTexture(text, colour);
  return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.15, roughness: 0.5 });
};

/** A craps-style high-stakes table: padded rail, green felt with gold markings, dice, chips and the stickman's stick. */
export function DiceTable() {
  const felt = useMemo(() => feltTexture(), []);
  return (
    <Group>
      <Box s={[3.0, 0.78, 1.3]} p={[0, 0.39, 0]} c="#2a1c14" o={{ rough: 0.5 }} />
      <Box s={[3.1, 0.04, 1.4]} p={[0, 0.06, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Round s={[3.2, 0.14, 1.5]} p={[0, 0.85, 0]} c="#7a1f24" rad={0.1} />
      <Box s={[2.9, 0.012, 1.2]} p={[0, 0.925, 0]} c="#ffffff" m={mat("#ffffff", { rough: 1, map: felt })} shadow={false} />
      {/* gold lines, the pass line and the number boxes */}
      <Box s={[2.9, 0.004, 0.025]} p={[0, 0.933, 0.38]} c={GOLD} o={BRASS} shadow={false} />
      <Box s={[2.9, 0.004, 0.025]} p={[0, 0.933, -0.1]} c={GOLD} o={BRASS} shadow={false} />
      {[-1.05, -0.63, -0.21, 0.21, 0.63, 1.05].map((x) => (
        <Box key={x} s={[0.36, 0.004, 0.3]} p={[x, 0.934, -0.38]} c="#f4f1ea" o={{ emissive: "#f4f1ea", glow: 0.08 }} shadow={false} />
      ))}
      <Cyl rad={0.2} h={0.004} p={[0, 0.934, 0.12]} c={GOLD} o={BRASS} shadow={false} />
      {/* two dice mid-roll */}
      {[[-0.2, 0.4, 0.3], [0.1, 0.32, -0.6]].map(([x, z, r], i) => (
        <Group key={i} p={[x!, 0.96, z!]} r={[0, r!, 0]}>
          <Round s={[0.07, 0.07, 0.07]} c="#f4f1ea" rad={0.01} />
          <Cyl rad={0.008} h={0.004} p={[0, 0.037, 0]} c="#c0392b" shadow={false} />
        </Group>
      ))}
      {/* chip stacks along the rail */}
      {[[-1.2, 0.5, "#c0392b"], [-0.5, 0.52, "#1a1a1f"], [0.6, 0.5, "#2f7f79"], [1.25, 0.46, "#f3bf6a"], [0.9, -0.5, "#1a1a1f"], [-0.9, -0.52, "#c0392b"]].map(([x, z, c], i) => (
        <Group key={i} p={[x as number, 0.93, z as number]}>
          {[0, 1, 2, 3, 4].map((k) => (
            <Cyl key={k} rad={0.04} h={0.016} p={[0, 0.01 + k * 0.018, 0]} c={c as string} o={{ rough: 0.4 }} shadow={false} />
          ))}
        </Group>
      ))}
      {/* the stickman's stick */}
      <Cyl rad={0.008} h={1.0} p={[1.0, 0.96, -0.2]} r={[0, 0, Math.PI / 2 - 0.1]} c="#2a1c14" shadow={false} />
    </Group>
  );
}

function Roulette({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Box s={[1.8, 0.78, 0.9]} p={[0, 0.39, 0]} c="#2a1c14" o={{ rough: 0.5 }} />
      <Round s={[2.0, 0.1, 1.1]} p={[0, 0.82, 0]} c="#7a1f24" rad={0.07} />
      <Box s={[1.8, 0.012, 0.9]} p={[0, 0.88, 0]} c="#ffffff" m={mat("#ffffff", { rough: 1, map: feltTexture() })} shadow={false} />
      {Array.from({ length: 12 }, (_, i) => (
        <Box key={i} s={[0.09, 0.004, 0.07]} p={[0.05 + i * 0.1, 0.89, 0.12 + (i % 3) * 0.1]} c={i % 3 === 1 ? "#1a1a1f" : "#c0392b"} shadow={false} />
      ))}
      {/* the wheel */}
      <Group p={[-0.55, 0.9, -0.05]}>
        <Cyl rad={0.28} h={0.08} p={[0, 0.04, 0]} c="#3a2418" o={{ rough: 0.3 }} />
        <Cyl rad={0.22} h={0.05} p={[0, 0.1, 0]} c="#c0392b" o={{ rough: 0.4 }} />
        <Cyl rad={0.13} h={0.05} p={[0, 0.13, 0]} c="#1a1a1f" o={{ rough: 0.4 }} />
        <Cyl rad={0.05} h={0.1} p={[0, 0.17, 0]} c={GOLD} o={BRASS} />
      </Group>
      <Box s={[0.5, 0.4, 0.3]} p={[0.2, 0.95, -0.55]} c="#15151a" />
    </Group>
  );
}

function Column({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Cyl rad={0.34} h={0.18} p={[0, 0.09, 0]} c={GOLD} o={BRASS} />
      <Cyl rad={0.27} h={3.0} p={[0, 1.65, 0]} c="#e9e2d2" o={{ rough: 0.25 }} />
      <Cyl rad={0.33} h={0.12} p={[0, 3.05, 0]} c={GOLD} o={BRASS} />
      <Box s={[0.72, 0.16, 0.72]} p={[0, 3.2, 0]} c={GOLD} o={BRASS} />
    </Group>
  );
}

function CashierCage() {
  return (
    <Group p={[0.5, 0, 6.5]}>
      <Box s={[0.7, 1.05, 2.5]} p={[0.15, 0.525, 0]} c="#3a2418" o={{ rough: 0.4 }} />
      <Box s={[0.9, 0.06, 2.6]} p={[0.28, 1.08, 0]} c="#5a3724" o={{ rough: 0.3 }} />
      {Array.from({ length: 17 }, (_, i) => (
        <Cyl key={i} rad={0.012} h={1.2} p={[0.6, 1.7, -1.2 + i * 0.15]} c={GOLD} o={BRASS} shadow={false} />
      ))}
      <Box s={[0.05, 0.05, 2.6]} p={[0.6, 2.32, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Box s={[0.05, 0.05, 2.6]} p={[0.6, 1.1, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Box s={[0.3, 0.14, 1.0]} p={[0.68, 2.55, 0]} c="#fff4d2" o={{ emissive: "#ffd98a", glow: 1.2 }} shadow={false} />
      {/* till and a stack of notes */}
      <Box s={[0.3, 0.2, 0.4]} p={[0.2, 1.2, -0.7]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.5 }} />
      <Box s={[0.18, 0.06, 0.1]} p={[0.35, 1.14, 0.5]} c="#4a9a62" shadow={false} />
    </Group>
  );
}

const Stanchion = ({ p }: { p: [number, number, number] }) => (
  <Group p={p}>
    <Cyl rad={0.16} h={0.03} p={[0, 0.015, 0]} c={GOLD} o={BRASS} />
    <Cyl rad={0.025} h={0.95} p={[0, 0.5, 0]} c={GOLD} o={BRASS} />
    <Ball rad={0.05} p={[0, 1.0, 0]} c={GOLD} o={BRASS} />
  </Group>
);

export function CasinoDecor() {
  const signs = useMemo(() => ({ lucky: neonMat("LUCKY SEVENS", "#ff4fd8"), vip: neonMat("HIGH STAKES", "#6fe3a8"), slots: neonMat("SLOTS", "#ffd24a"), cashier: neonMat("CASHIER", "#6fe3ff") }), []);
  return (
    <Group>
      {/* back-wall neon, and ambient slot banks either side of the playable one */}
      <Box s={[3.6, 0.9, 0.05]} p={[5.2, 2.75, 0.13]} c="#ffffff" m={signs.lucky} shadow={false} />
      <Box s={[1.8, 0.45, 0.05]} p={[5.2, 2.3, 0.13]} c="#ffffff" m={signs.slots} shadow={false} />
      <Group p={[1.9, 0, 0.55]}><SlotBank /></Group>
      <Group p={[8.5, 0, 0.55]}><SlotBank /></Group>
      {/* roulette beside the blackjack table */}
      <Roulette p={[8.6, 0, 4.6]} />
      {/* patterned carpet needs no extra rugs; a red runner leads in from the door */}
      <Box s={[1.7, 0.012, 3.4]} p={[7.1, 0.03, 9.2]} c="#7a1a2a" o={{ rough: 1 }} shadow={false} />
      <Box s={[1.78, 0.011, 3.48]} p={[7.1, 0.028, 9.2]} c={GOLD} o={{ rough: 0.6, metal: 0.4 }} shadow={false} />
      {[[2.4, 3.0], [8.0, 3.0], [2.4, 6.4], [8.0, 6.8]].map(([x, z]) => (
        <Column key={`${x}${z}`} p={[x!, 0, z!]} />
      ))}
      {/* chandeliers over the floor, the hall and the high-stakes room */}
      <Chandelier p={[5.0, 3.0, 4.4]} r={0.95} tiers={3} />
      <Chandelier p={[2.4, 3.0, 9.2]} r={0.6} />
      <Chandelier p={[12.7, 3.0, 3.0]} r={0.75} tiers={2} />
      {/* cashier cage in the hall */}
      <CashierCage />
      <Group p={[0.14, 2.85, 6.5]} r={[0, Math.PI / 2, 0]}>
        <Box s={[1.5, 0.38, 0.05]} c="#ffffff" m={signs.cashier} shadow={false} />
      </Group>
      {/* gilded pictures between the columns */}
      <Group p={[7.5, 1.9, 0.12]}><Frame w={0.6} h={0.75} art={2} /></Group>
      <Group p={[2.9, 1.9, 0.12]}><Frame w={0.6} h={0.75} art={1} /></Group>
      <Group p={[0.12, 1.9, 3.0]} r={[0, Math.PI / 2, 0]}><Frame w={0.8} h={0.6} art={0} /></Group>
      {/* the velvet-rope posts either side of the archway into the high-stakes room */}
      <Stanchion p={[9.95, 0, 0.9]} />
      <Stanchion p={[9.95, 0, 5.1]} />
      <Group p={[10.3, 2.95, 3.0]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[2.2, 0.5, 0.05]} c="#ffffff" m={signs.vip} shadow={false} />
      </Group>

      {/* ----- high-stakes room: leather armchairs, a bottle cabinet and a rug under the table ----- */}
      <Box s={[3.6, 0.012, 2.2]} p={[12.7, 0.03, 2.8]} c="#4a2a1a" o={{ rough: 1 }} shadow={false} />
      <Armchair p={[11.2, 5.2]} rot={Math.PI} c="#5a2a22" />
      <Armchair p={[14.2, 5.2]} rot={Math.PI} c="#5a2a22" />
      <Group p={[12.7, 0, 0.4]}>
        <Box s={[2.2, 1.0, 0.5]} p={[0, 0.5, 0]} c="#2a1c14" o={{ rough: 0.4 }} />
        <Box s={[2.2, 0.05, 0.56]} p={[0, 1.02, 0]} c="#5a3724" o={{ rough: 0.3 }} />
        {Array.from({ length: 8 }, (_, i) => (
          <Cyl key={i} rad={0.04} h={0.3} p={[-0.9 + i * 0.26, 1.2, 0]} c={["#4a2a1a", "#2a5a3a", "#8a6a2a", "#1a2a4a"][i % 4]!} o={{ rough: 0.15 }} shadow={false} />
        ))}
        <Box s={[2.0, 0.9, 0.04]} p={[0, 1.8, -0.2]} c="#cfe3ee" o={{ opacity: 0.4, rough: 0.05, metal: 0.8 }} shadow={false} />
      </Group>
      {/* a standing lamp between the armchairs */}
      <Group p={[12.7, 0, 5.3]}>
        <Cyl rad={0.14} h={0.03} p={[0, 0.015, 0]} c="#2a2a2c" />
        <Cyl rad={0.012} h={1.4} p={[0, 0.72, 0]} c={GOLD} o={BRASS} />
        <Cyl rad={0.17} h={0.3} p={[0, 1.5, 0]} c="#f1dfb0" o={{ emissive: "#ffd98a", glow: 0.9, rough: 0.9 }} />
      </Group>
    </Group>
  );
}