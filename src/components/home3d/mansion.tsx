import { useMemo } from "react";
import * as THREE from "three";
import type { Npc } from "@/lib/home3d/layout";
import { Ball, Box, Cone, Cyl, Group, Round, mat } from "./primitives";
import { Frame } from "./furniture";
import { Plant } from "./StudioShell";
import { Blind, BookStack, Curtains, Mirror, Rug, Splashback, Wardrobe } from "./decor";
import { feltTexture, neonTexture, slotTexture } from "./textures";

/**
 * Mansion fixtures and the games room. The mansion has 3.3 m ceilings, marble and panelled walls, tall windows,
 * a chandelier and a staircase. Anything that stands in for purchasable furniture appears only while that
 * furniture is owned (its collider uses the same rule), so upgrading house never hands out free items.
 */
const GOLD = "#c9a24a";
const BRASS = { rough: 0.3, metal: 0.85 };
const MARBLE = "#efeae0";
const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
};

/* ------------------------------------------------------------------ small shared pieces */
export function Chandelier({ p, r = 0.7, tiers = 2 }: { p: [number, number, number]; r?: number; tiers?: number }) {
  return (
    <Group p={p}>
      <Cyl rad={0.012} h={0.7} p={[0, 0.45, 0]} c={GOLD} o={BRASS} shadow={false} />
      <Cyl rad={0.07} h={0.3} p={[0, 0, 0]} c={GOLD} o={BRASS} shadow={false} />
      {Array.from({ length: tiers }, (_, t) => {
        const rr = r * (1 - t * 0.38);
        const y = -0.1 - t * 0.28;
        const n = 8 - t * 2;
        return (
          <Group key={t}>
            <Cyl rad={rr} h={0.025} p={[0, y, 0]} c={GOLD} o={BRASS} shadow={false} />
            {Array.from({ length: n }, (_, i) => {
              const a = (i / n) * Math.PI * 2;
              return (
                <Group key={i} p={[Math.cos(a) * rr, y, Math.sin(a) * rr]}>
                  <Cyl rad={0.014} h={0.12} p={[0, 0.06, 0]} c={GOLD} o={BRASS} shadow={false} />
                  <Ball rad={0.045} p={[0, 0.15, 0]} sc={[0.04, 0.06, 0.04]} c="#fff4d2" o={{ emissive: "#ffe2a0", glow: 2.2 }} shadow={false} />
                  <Ball rad={0.03} p={[0, -0.06, 0]} c="#e9f4ff" o={{ opacity: 0.55, rough: 0.05 }} shadow={false} />
                </Group>
              );
            })}
          </Group>
        );
      })}
    </Group>
  );
}

export function Armchair({ p, rot, c, legs = "#4a3022" }: { p: [number, number]; rot: number; c: string; legs?: string }) {
  return (
    <Group p={[p[0], 0, p[1]]} r={[0, rot, 0]}>
      {[[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]].map(([x, z]) => (
        <Cyl key={`${x}${z}`} rad={0.025} h={0.18} p={[x!, 0.09, z!]} c={legs} o={{ rough: 0.4 }} />
      ))}
      <Round s={[0.84, 0.22, 0.8]} p={[0, 0.3, 0]} c={c} rad={0.08} />
      <Round s={[0.62, 0.14, 0.56]} p={[0, 0.48, 0.06]} c={c} rad={0.07} />
      <Round s={[0.84, 0.55, 0.2]} p={[0, 0.66, -0.32]} r={[-0.1, 0, 0]} c={c} rad={0.08} />
      {[-1, 1].map((s) => (
        <Round key={s} s={[0.14, 0.34, 0.74]} p={[s * 0.35, 0.5, 0]} c={c} rad={0.06} />
      ))}
    </Group>
  );
}

export function Stool({ p, c = "#a02a2a", h = 0.46 }: { p: [number, number, number]; c?: string; h?: number }) {
  return (
    <Group p={p}>
      <Cyl rad={0.018} h={h} p={[0, h / 2, 0]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} />
      <Cyl rad={0.14} h={0.02} p={[0, 0.01, 0]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} />
      <Round s={[0.34, 0.08, 0.34]} p={[0, h + 0.03, 0]} c={c} rad={0.035} />
    </Group>
  );
}

/** Shelves with rows of book spines, drawn as colour blocks. `len` runs along local x. */
function Library({ p, rot, len, rows = 5, seed }: { p: [number, number, number]; rot: number; len: number; rows?: number; seed: number }) {
  const blocks = useMemo(() => {
    const r = rnd(seed);
    const cols = ["#7a2d2d", "#1f4a42", "#2d3a5a", "#8a6a2a", "#4a2d5a", "#a8793c", "#2f2f35", "#b05a3a"];
    const out: { x: number; row: number; w: number; h: number; c: string; tilt: number }[] = [];
    for (let row = 0; row < rows; row++) {
      let x = -len / 2 + 0.05;
      while (x < len / 2 - 0.2) {
        const w = 0.1 + r() * 0.2;
        out.push({ x: x + w / 2, row, w, h: 0.27 + r() * 0.1, c: cols[Math.floor(r() * cols.length)]!, tilt: r() > 0.92 ? 0.25 : 0 });
        x += w + 0.012;
      }
    }
    return out;
  }, [len, rows, seed]);
  const rowH = 2.9 / rows;
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[len, 3.0, 0.34]} p={[0, 1.5, 0]} c="#4a3022" o={{ rough: 0.5 }} />
      {Array.from({ length: rows + 1 }, (_, i) => (
        <Box key={i} s={[len - 0.04, 0.04, 0.34]} p={[0, 0.05 + i * rowH, 0.01]} c="#5a3d2a" o={{ rough: 0.5 }} shadow={false} />
      ))}
      {blocks.map((b, i) => (
        <Box key={i} s={[b.w, b.h, 0.22]} p={[b.x, 0.07 + b.row * rowH + b.h / 2, 0.06]} r={[0, 0, b.tilt]} c={b.c} o={{ rough: 0.7 }} shadow={false} />
      ))}
      <Box s={[len + 0.1, 0.1, 0.4]} p={[0, 3.05, 0]} c="#3a281c" o={{ rough: 0.5 }} shadow={false} />
    </Group>
  );
}

/* ------------------------------------------------------------------ furniture-adjacent pieces */
/** Two bedside tables with lamps, drawn with the bed so they only exist while the bed is owned. */
export function Bedsides({ lux }: { lux: boolean }) {
  return (
    <Group>
      {[-1, 1].map((s) => (
        <Group key={s} p={[s * 0.98, 0, -0.8]}>
          <Box s={[0.38, 0.5, 0.36]} p={[0, 0.25, 0]} c={lux ? "#2a2018" : "#b9805a"} o={{ rough: 0.5 }} />
          <Box s={[0.32, 0.12, 0.012]} p={[0, 0.36, 0.19]} c={lux ? "#c9a24a" : "#8a5a3a"} {...(lux ? { o: BRASS } : {})} shadow={false} />
          <Cyl rad={0.014} h={0.3} p={[0, 0.65, 0]} c={lux ? GOLD : "#2a2a2c"} {...(lux ? { o: BRASS } : {})} />
          <Cone rad={0.13} h={0.16} p={[0, 0.84, 0]} r={[Math.PI, 0, 0]} c="#f1dfb0" o={{ emissive: "#ffd98a", glow: 0.9, rough: 0.9 }} shadow={false} />
        </Group>
      ))}
    </Group>
  );
}

/* ------------------------------------------------------------------ games room */
/** Semi-circular-style blackjack table: felt, padded rail, chips, cards and three stools on the player side. */
export function BlackjackTable() {
  const felt = useMemo(() => feltTexture(), []);
  return (
    <Group>
      {/* pedestal legs */}
      {[-0.9, 0.9].map((x) => (
        <Cyl key={x} rad={0.12} h={0.74} p={[x, 0.37, 0]} c="#2a1c14" o={{ rough: 0.4 }} />
      ))}
      <Box s={[2.2, 0.06, 0.5]} p={[0, 0.06, 0]} c="#2a1c14" o={{ rough: 0.4 }} />
      {/* top with a padded leather rail and a felt inlay */}
      <Round s={[2.6, 0.12, 1.5]} p={[0, 0.78, 0]} c="#7a1f24" rad={0.1} />
      <Box s={[2.4, 0.01, 1.3]} p={[0, 0.845, 0]} c="#ffffff" m={mat("#ffffff", { rough: 1, map: felt })} shadow={false} />
      <Cyl rad={0.5} h={0.004} p={[0, 0.852, 0.12]} c={GOLD} o={BRASS} shadow={false} />
      <Cyl rad={0.47} h={0.005} p={[0, 0.853, 0.12]} c="#1d6b46" o={{ rough: 1 }} shadow={false} />
      {/* player spots */}
      {[-0.7, 0, 0.7].map((x) => (
        <Cyl key={x} rad={0.1} h={0.004} p={[x, 0.855, 0.45]} c="#e9d9a0" shadow={false} />
      ))}
      {/* chips, cards and the dealer's shoe */}
      {[[-0.7, 0.45, "#c0392b"], [0, 0.45, "#2f7f79"], [0.7, 0.45, "#1a1a1f"], [0.05, -0.15, "#f3bf6a"]].map(([x, z, c], i) => (
        <Group key={i} p={[x as number, 0.86, z as number]}>
          {[0, 1, 2, 3].map((k) => (
            <Cyl key={k} rad={0.04} h={0.016} p={[0, 0.01 + k * 0.018, 0]} c={c as string} o={{ rough: 0.4 }} shadow={false} />
          ))}
        </Group>
      ))}
      {[-0.2, -0.1, 0].map((x, i) => (
        <Box key={i} s={[0.06, 0.004, 0.09]} p={[x - 0.2, 0.855, -0.3]} r={[0, 0.2 - i * 0.2, 0]} c="#fbf6ea" shadow={false} />
      ))}
      <Box s={[0.18, 0.1, 0.12]} p={[0.55, 0.9, -0.38]} r={[0, 0.3, 0]} c="#1a1a1f" />
      {/* stools: the two outer ones are where the friends sit */}
      {[-0.7, 0, 0.7].map((x) => (
        <Stool key={x} p={[x, 0, 1.15]} />
      ))}
    </Group>
  );
}

/** Three slot machines side by side with lit reel windows, light bars and levers. */
export function SlotBank() {
  const faces = useMemo(() => [0, 1, 2].map((n) => slotTexture(n)), []);
  const glow = useMemo(() => faces.map((t) => new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 0.9, roughness: 0.3 })), [faces]);
  const body = ["#a8201a", "#2a1740", "#1f5a6a"];
  return (
    <Group>
      {[-0.8, 0, 0.8].map((x, i) => (
        <Group key={x} p={[x, 0, 0]}>
          <Round s={[0.68, 1.9, 0.62]} p={[0, 0.95, 0]} c={body[i]!} rad={0.07} o={{ rough: 0.35 }} />
          <Box s={[0.5, 0.3, 0.04]} p={[0, 1.72, 0.31]} c="#fff4d2" o={{ emissive: "#ffd98a", glow: 1.6 }} shadow={false} />
          <Box s={[0.46, 0.18, 0.03]} p={[0, 1.72, 0.335]} c="#e63946" o={{ emissive: "#e63946", glow: 1.4 }} shadow={false} />
          <Box s={[0.5, 0.24, 0.03]} p={[0, 1.38, 0.34]} m={glow[i]!} shadow={false} />
          <Box s={[0.6, 0.06, 0.28]} p={[0, 1.18, 0.3]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.6 }} />
          {[-0.14, 0, 0.14].map((bx) => (
            <Cyl key={bx} rad={0.035} h={0.02} p={[bx, 1.215, 0.34]} c="#f3bf6a" o={{ emissive: "#f3bf6a", glow: 0.8 }} shadow={false} />
          ))}
          <Box s={[0.34, 0.14, 0.12]} p={[0, 0.5, 0.3]} c="#15151a" />
          <Box s={[0.3, 0.02, 0.1]} p={[0, 0.44, 0.34]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} shadow={false} />
          {/* lever */}
          <Cyl rad={0.014} h={0.4} p={[0.4, 1.15, 0.1]} c="#c9c9cf" o={{ rough: 0.2, metal: 0.9 }} />
          <Ball rad={0.05} p={[0.4, 1.38, 0.1]} c="#e63946" o={{ rough: 0.3 }} />
          <Box s={[0.7, 0.04, 0.64]} p={[0, 1.92, 0]} c="#f3bf6a" o={{ emissive: "#f3bf6a", glow: 0.7, rough: 0.5 }} shadow={false} />
        </Group>
      ))}
    </Group>
  );
}

/** A person: simplified head-and-arms figure with a body, in the game's flat-colour style. */
export function Figure({ npc }: { npc: Npc }) {
  const sit = npc.pose === "sit";
  const dance = npc.pose === "dance";
  const jog = npc.pose === "jog";
  const base = sit ? (npc.seat ?? 0.5) : 0;
  const outline = "#222530";
  return (
    <Group p={[npc.x, 0, npc.z]} r={[0, npc.rot, 0]}>
      {sit ? (
        <>
          {/* thighs forward, shins down */}
          {[-0.1, 0.1].map((x) => (
            <Group key={x}>
              <Cyl rad={0.065} h={0.34} p={[x, base - 0.0, 0.17]} r={[Math.PI / 2, 0, 0]} c="#3a4252" />
              <Cyl rad={0.055} h={base - 0.06} p={[x, (base - 0.06) / 2, 0.34]} c="#3a4252" />
            </Group>
          ))}
        </>
      ) : jog ? (
        [-1, 1].map((s) => <Cyl key={s} rad={0.06} h={0.86} p={[0, 0.43, s * 0.22]} r={[s * 0.5, 0, 0]} c="#3a4252" />)
      ) : (
        [-0.09, 0.09].map((x) => <Cyl key={x} rad={0.06} h={0.86} p={[x, 0.43, 0]} r={dance ? [0, 0, x * 2.2] : [0, 0, 0]} c="#3a4252" />)
      )}
      <Round s={[0.4, 0.5, 0.24]} p={[0, base + 0.5, 0]} c={npc.shirt} rad={0.08} r={jog ? [0.18, 0, 0] : dance ? [0, 0, 0.12] : [0, 0, 0]} />
      {/* head: skin circle with a dark outline ring and a hair cap */}
      <Ball rad={0.17} p={[0, base + 0.98, 0]} c={outline} sc={[0.185, 0.185, 0.185]} o={{ rough: 1 }} shadow={false} />
      <Ball rad={0.16} p={[0, base + 0.98, 0.012]} c={npc.skin} />
      <Ball rad={0.165} p={[0, base + 1.03, -0.02]} sc={[0.165, 0.1, 0.165]} c={npc.hair} />
      {[-0.06, 0.06].map((x) => (
        <Ball key={x} rad={0.018} p={[x, base + 0.99, 0.16]} c="#1d1d22" shadow={false} />
      ))}
      {/* arms: reaching forward to hold cards (seated), pumping (jogging), up in the air (dancing) or pulling a lever */}
      {[-1, 1].map((s) => (
        <Group
          key={s}
          p={[s * 0.22, base + 0.68, 0.0]}
          r={sit ? [-1.05, 0, s * 0.18] : dance ? [0, 0, s * 2.6] : jog ? [s * 0.9 - 0.4, 0, s * 0.12] : [s > 0 ? -1.3 : -0.2, 0, s * 0.25]}
        >
          <Cyl rad={0.03} h={0.42} p={[0, -0.21, 0]} c={outline} />
          <Ball rad={0.04} p={[0, -0.43, 0]} c={npc.skin} shadow={false} />
        </Group>
      ))}
    </Group>
  );
}

/* ------------------------------------------------------------------ the shell */
export function MansionDecor({ owned }: { owned: ReadonlySet<string> }) {
  const neon = useMemo(() => {
    const t = neonTexture("LUCKY SEVENS", "#ff4fd8");
    return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.1, roughness: 0.5 });
  }, []);
  const gym = useMemo(() => {
    const t = neonTexture("NO EXCUSES", "#6fe3ff");
    return new THREE.MeshStandardMaterial({ map: t, emissive: new THREE.Color("#ffffff"), emissiveMap: t, emissiveIntensity: 1.1, roughness: 0.5 });
  }, []);
  const hasSofa = owned.has("sofa");
  const hasKitchen = owned.has("kitchen");
  const hasBed = owned.has("bed");
  const hasDesk = owned.has("desk");
  return (
    <Group>
      {/* =================== grand living room =================== */}
      <Rug p={[2.0, 3.2]} w={3.8} d={3.2} cols={["#f1e8d2", "#1f2f4a", "#c9a24a", "#f1e8d2"]} />
      <Chandelier p={[4.0, 3.0, 3.2]} r={0.85} tiers={3} />
      <Curtains p={[1.7, 0, 0.22]} w={1.6} drop={2.75} top={3.15} colour="#7a2d3a" pelmet="#c9a24a" />
      <Curtains p={[6.3, 0, 0.22]} w={1.6} drop={2.75} top={3.15} colour="#7a2d3a" pelmet="#c9a24a" />
      <Curtains p={[0.22, 0, 1.2]} rot={Math.PI / 2} w={1.2} drop={2.75} top={3.15} colour="#7a2d3a" pelmet="#c9a24a" />
      <Curtains p={[0.22, 0, 5.1]} rot={Math.PI / 2} w={1.4} drop={2.75} top={3.15} colour="#7a2d3a" pelmet="#c9a24a" />
      {/* marble fireplace with a gilded mirror */}
      <Group p={[3.0, 0, 0.33]}>
        <Box s={[0.9, 1.15, 0.44]} p={[0, 0.575, 0]} c={MARBLE} o={{ rough: 0.2 }} />
        <Box s={[1.0, 0.07, 0.5]} p={[0, 1.19, 0.02]} c="#e4ddcf" o={{ rough: 0.2 }} />
        <Box s={[0.5, 0.6, 0.06]} p={[0, 0.4, 0.2]} c="#15110e" shadow={false} />
        <Box s={[0.4, 0.14, 0.04]} p={[0, 0.2, 0.22]} c="#ff9a3a" o={{ emissive: "#ff7a1a", glow: 1.6 }} shadow={false} />
        <Mirror p={[0, 1.95, -0.17]} w={0.8} h={1.0} />
      </Group>
      <Group p={[2.0, 1.95, 0.12]}>
        <Frame w={0.6} h={0.75} art={1} />
      </Group>
      {/* the grand piano with its lid propped open */}
      <Group p={[5.3, 0, 2.4]}>
        {[[-0.6, -0.75], [0.6, -0.75], [0, 0.7]].map(([x, z]) => (
          <Cyl key={`${x}${z}`} rad={0.045} h={0.7} p={[x!, 0.35, z!]} c="#15151a" o={{ rough: 0.3 }} />
        ))}
        <Round s={[1.5, 0.16, 1.9]} p={[0, 0.78, 0]} c="#15151a" rad={0.07} o={{ rough: 0.15 }} />
        <Round s={[1.45, 0.03, 1.4]} p={[-0.3, 1.05, -0.2]} r={[0, 0, 0.55]} c="#101014" rad={0.01} o={{ rough: 0.15 }} />
        <Box s={[1.3, 0.04, 0.3]} p={[0, 0.88, 0.74]} c="#f4f1ea" shadow={false} />
        {Array.from({ length: 9 }, (_, i) => (
          <Box key={i} s={[0.07, 0.03, 0.2]} p={[-0.56 + i * 0.14, 0.91, 0.78]} c="#15151a" shadow={false} />
        ))}
        <Round s={[0.8, 0.1, 0.34]} p={[0, 0.48, 1.2]} c="#2a1c14" rad={0.04} />
        <Box s={[0.7, 0.4, 0.04]} p={[0, 1.05, 0.55]} c="#101014" shadow={false} />
      </Group>
      {hasSofa && (
        <>
          <Armchair p={[3.4, 1.3]} rot={0} c="#1f4a58" />
          <Armchair p={[3.4, 5.1]} rot={Math.PI} c="#1f4a58" />
          {/* glass coffee table with gold legs and a vase */}
          <Group p={[1.75, 0, 3.2]}>
            <Box s={[1.1, 0.03, 0.7]} p={[0, 0.42, 0]} c="#cfe9f0" o={{ opacity: 0.55, rough: 0.05 }} />
            {[[-0.5, -0.3], [0.5, -0.3], [-0.5, 0.3], [0.5, 0.3]].map(([x, z]) => (
              <Cyl key={`${x}${z}`} rad={0.02} h={0.4} p={[x!, 0.2, z!]} c={GOLD} o={BRASS} />
            ))}
            <Cyl rad={0.06} h={0.2} p={[0, 0.53, 0]} c="#2f7f79" o={{ rough: 0.2 }} />
            <Ball rad={0.1} p={[0, 0.7, 0]} sc={[0.12, 0.09, 0.12]} c="#d9695a" />
            <BookStack p={[0.3, 0.44, 0.1]} rot={0.4} />
          </Group>
        </>
      )}
      <Group p={[0.13, 2.1, 3.2]} r={[0, Math.PI / 2, 0]}>
        <Frame w={1.0} h={0.65} art={2} />
      </Group>
      <Plant p={[7.4, 0, 0.5]} big />
      <Plant p={[0.5, 0, 6.0]} />
      <Group p={[7.0, 0, 5.2]}>
        {/* marble pedestal and urn */}
        <Cyl rad={0.2} h={0.9} p={[0, 0.45, 0]} c={MARBLE} o={{ rough: 0.2 }} />
        <Ball rad={0.2} p={[0, 1.1, 0]} sc={[0.2, 0.26, 0.2]} c="#2f6a8a" o={{ rough: 0.2 }} />
      </Group>

      {/* =================== luxury kitchen =================== */}
      <Splashback p={[10.7, 1.45, 0.12]} w={2.6} h={1.0} />
      <Blind p={[10.0, 0, 0.14]} w={1.7} top={2.8} drop={0.7} colour="#efe6d2" />
      <Blind p={[11.9, 0, 0.14]} w={1.5} top={2.8} drop={0.7} colour="#efe6d2" />
      {hasKitchen && (
        <Group>
          <Group p={[10.7, 0, 3.2]}>
            {/* marble island with a waterfall edge, brass kick and three stools */}
            <Box s={[2.6, 0.9, 1.0]} p={[0, 0.45, 0]} c="#3a4452" o={{ rough: 0.5 }} />
            <Box s={[2.7, 0.06, 1.1]} p={[0, 0.93, 0.04]} c={MARBLE} o={{ rough: 0.12 }} />
            <Box s={[2.62, 0.08, 0.04]} p={[0, 0.06, 0.5]} c={GOLD} o={BRASS} shadow={false} />
            {[-0.9, 0, 0.9].map((x) => (
              <Box key={x} s={[0.6, 0.6, 0.012]} p={[x, 0.45, 0.505]} c="#4a5666" shadow={false} />
            ))}
            {[-0.7, 0, 0.7].map((x) => (
              <Stool key={x} p={[x, 0, 0.86]} c="#7a2d3a" h={0.62} />
            ))}
            <Cyl rad={0.1} h={0.05} p={[0.6, 0.98, 0]} c="#efe6d2" />
            <Ball rad={0.05} p={[0.6, 1.03, 0]} c="#d9695a" />
          </Group>
          {[-0.8, 0, 0.8].map((x) => (
            <Group key={x} p={[10.7 + x, 2.5, 3.2]}>
              <Cyl rad={0.006} h={0.8} p={[0, 0.4, 0]} c="#222" shadow={false} />
              <Ball rad={0.13} p={[0, 0, 0]} c="#f4efe0" o={{ opacity: 0.8, rough: 0.05, emissive: "#ffe2a0", glow: 0.7 }} shadow={false} />
            </Group>
          ))}
        </Group>
      )}

      {/* =================== games room =================== */}
      <Box s={[2.3, 0.6, 0.04]} p={[15.6, 2.3, 0.14]} m={neon} shadow={false} />
      <Group p={[18.4, 1.8, 0.13]}>
        <Frame w={0.7} h={0.9} art={0} />
      </Group>
      {/* round casino rug under the card table */}
      <Cyl rad={1.9} h={0.01} p={[16.0, 0.03, 3.4]} c="#2a1740" o={{ rough: 1 }} shadow={false} />
      <Cyl rad={1.78} h={0.012} p={[16.0, 0.032, 3.4]} c="#c9a24a" o={{ rough: 0.6, metal: 0.3 }} shadow={false} />
      <Cyl rad={1.7} h={0.014} p={[16.0, 0.034, 3.4]} c="#5a1f6a" o={{ rough: 1 }} shadow={false} />
      {/* billiard-style lamp over the table */}
      <Group p={[16.0, 2.2, 3.4]}>
        <Cyl rad={0.005} h={1.0} p={[0, 0.5, 0]} c="#222" shadow={false} />
        <Box s={[1.8, 0.14, 0.5]} c="#1d6b46" o={{ rough: 0.4 }} />
        <Box s={[1.7, 0.01, 0.42]} p={[0, -0.075, 0]} c="#fff4d2" o={{ emissive: "#ffe2a0", glow: 2 }} shadow={false} />
      </Group>
      {/* leather banquette along the right wall */}
      <Group p={[19.2, 0, 3.05]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[4.1, 0.4, 0.5]} p={[0, 0.2, 0]} c="#5a1f1f" />
        <Round s={[4.0, 0.14, 0.46]} p={[0, 0.47, 0.02]} c="#8a2a2a" rad={0.05} />
        <Round s={[4.0, 0.62, 0.14]} p={[0, 0.8, -0.2]} r={[-0.1, 0, 0]} c="#8a2a2a" rad={0.05} />
        {Array.from({ length: 10 }, (_, i) => (
          <Ball key={i} rad={0.018} p={[-1.8 + i * 0.4, 0.88, -0.12]} c={GOLD} o={BRASS} shadow={false} />
        ))}
      </Group>
      {[1.4, 3.05, 4.7].map((z) => (
        <Group key={z} p={[18.7, 0, z]}>
          <Cyl rad={0.2} h={0.03} p={[0, 0.5, 0]} c="#15151a" />
          <Cyl rad={0.02} h={0.48} p={[0, 0.25, 0]} c={GOLD} o={BRASS} />
          <Cyl rad={0.06} h={0.1} p={[0, 0.6, 0]} c="#f3bf6a" o={{ opacity: 0.8, rough: 0.2 }} />
        </Group>
      ))}

      {/* =================== master bedroom =================== */}
      <Rug p={[3.55, 8.3]} w={3.8} d={3.2} cols={["#efe6d6", "#9b879f", "#c9a24a", "#efe6d6"]} />
      <Chandelier p={[3.55, 3.05, 8.3]} r={0.55} tiers={2} />
      <Curtains p={[1.9, 0, 12.78]} rot={Math.PI} w={1.8} drop={2.75} top={3.15} colour="#9b879f" pelmet="#7a6a84" />
      <Curtains p={[4.15, 0, 12.78]} rot={Math.PI} w={1.7} drop={2.75} top={3.15} colour="#9b879f" pelmet="#7a6a84" />
      <Curtains p={[0.22, 0, 8.7]} rot={Math.PI / 2} w={1.8} drop={2.75} top={3.15} colour="#9b879f" pelmet="#7a6a84" />
      <Curtains p={[0.22, 0, 11.0]} rot={Math.PI / 2} w={1.6} drop={2.75} top={3.15} colour="#9b879f" pelmet="#7a6a84" />
      {/* padded headboard wall */}
      <Group p={[3.55, 0, 6.56]}>
        <Box s={[3.0, 2.0, 0.08]} p={[0, 1.4, 0]} c="#c9b6d4" o={{ rough: 0.9 }} />
        {Array.from({ length: 6 }, (_, i) => (
          <Box key={i} s={[0.012, 1.9, 0.09]} p={[-1.25 + i * 0.5, 1.4, 0]} c="#9b879f" shadow={false} />
        ))}
        {[0.8, 1.4, 2.0].map((y) =>
          Array.from({ length: 5 }, (_, i) => <Ball key={`${y}${i}`} rad={0.02} p={[-1.0 + i * 0.5, y, 0.05]} c={GOLD} o={BRASS} shadow={false} />),
        )}
      </Group>
      <Wardrobe p={[0.4, 0, 11.95]} rot={Math.PI / 2} w={1.9} d={0.62} h={2.6} c="#efe6d6" handle={GOLD} />
      {hasBed && (
        <Group p={[3.55, 0, 9.6]}>
          {/* chaise at the foot of the bed */}
          <Round s={[1.4, 0.3, 0.55]} p={[0, 0.3, 0]} c="#7a2d3a" rad={0.08} />
          <Round s={[0.3, 0.45, 0.55]} p={[-0.55, 0.5, 0]} c="#7a2d3a" rad={0.08} />
          {[[-0.6, -0.2], [0.6, -0.2], [-0.6, 0.2], [0.6, 0.2]].map(([x, z]) => (
            <Cyl key={`${x}${z}`} rad={0.025} h={0.15} p={[x!, 0.075, z!]} c={GOLD} o={BRASS} />
          ))}
        </Group>
      )}
      <Plant p={[5.5, 0, 12.4]} big />

      {/* =================== foyer =================== */}
      <Group p={[7.7, 0, 10.0]}>
        {/* floor medallion */}
        <Cyl rad={1.05} h={0.012} p={[0, 0.03, 0]} c={GOLD} o={{ rough: 0.4, metal: 0.4 }} shadow={false} />
        <Cyl rad={0.95} h={0.014} p={[0, 0.032, 0]} c="#e9e1d2" o={{ rough: 0.12 }} shadow={false} />
        <Cyl rad={0.5} h={0.016} p={[0, 0.034, 0]} c="#2f4a6a" o={{ rough: 0.12 }} shadow={false} />
      </Group>
      <Chandelier p={[7.7, 3.05, 10.0]} r={0.7} tiers={3} />
      {/* grand staircase hugging the left wall, up to a landing */}
      <Group p={[6.55, 0, 12.55]}>
        {Array.from({ length: 8 }, (_, i) => (
          <Box key={i} s={[0.9, 0.18 * (i + 1), 0.4]} p={[0, (0.18 * (i + 1)) / 2, -i * 0.4]} c="#efe6d6" o={{ rough: 0.3 }} />
        ))}
        <Box s={[0.9, 0.02, 3.3]} p={[0, 0.01, -1.4]} c="#7a2d3a" o={{ rough: 1 }} shadow={false} />
        {Array.from({ length: 8 }, (_, i) => (
          <Group key={`b${i}`} p={[0.43, 0.18 * (i + 1), -i * 0.4]}>
            <Cyl rad={0.014} h={0.9} p={[0, 0.45, 0]} c={GOLD} o={BRASS} />
          </Group>
        ))}
        <Box s={[0.05, 0.05, 3.3]} p={[0.43, 1.1, -1.35]} r={[0.42, 0, 0]} c="#4a3022" o={{ rough: 0.4 }} shadow={false} />
      </Group>
      <Group p={[9.1, 0, 10.9]} r={[0, -Math.PI / 2, 0]}>
        {/* console table with a vase of flowers */}
        <Box s={[1.4, 0.05, 0.4]} p={[0, 0.82, 0]} c={MARBLE} o={{ rough: 0.15 }} />
        {[-0.62, 0.62].map((x) => (
          <Box key={x} s={[0.05, 0.8, 0.34]} p={[x, 0.4, 0]} c="#2a1c14" />
        ))}
        <Cyl rad={0.07} h={0.3} p={[0, 1.0, 0]} c="#2f7f79" o={{ rough: 0.2 }} />
        {[[-0.06, 1.28, 0xd9695a], [0.04, 1.34, 0xf3bf6a], [0.08, 1.22, 0xffffff]].map(([x, y, c], i) => (
          <Ball key={i} rad={0.07} p={[x as number, y as number, 0]} c={`#${(c as number).toString(16).padStart(6, "0")}`} />
        ))}
      </Group>
      <Mirror p={[9.25, 1.7, 10.9]} w={1.0} h={1.4} rot={-Math.PI / 2} />

      {/* =================== executive study =================== */}
      <Rug p={[12.0, 9.8]} w={3.6} d={2.8} cols={["#4a1f2a", "#8a3a3a", "#c9a24a", "#4a1f2a"]} />
      <Library p={[14.42, 0, 12.0]} rot={-Math.PI / 2} len={1.8} seed={11} />
      <Library p={[14.42, 0, 9.0]} rot={-Math.PI / 2} len={1.5} seed={23} />
      <Library p={[14.42, 0, 7.3]} rot={-Math.PI / 2} len={1.6} seed={37} />
      <Curtains p={[11.0, 0, 12.78]} rot={Math.PI} w={1.6} drop={2.75} top={3.15} colour="#1f4a42" pelmet="#c9a24a" />
      <Curtains p={[13.2, 0, 12.78]} rot={Math.PI} w={1.6} drop={2.75} top={3.15} colour="#1f4a42" pelmet="#c9a24a" />
      <Chandelier p={[12.0, 3.1, 9.8]} r={0.5} tiers={2} />
      {hasDesk && (
        <Group>
          <Armchair p={[10.3, 10.2]} rot={Math.PI / 2} c="#6a3a24" />
          <Armchair p={[10.3, 11.1]} rot={Math.PI / 2} c="#6a3a24" />
          <Group p={[10.9, 0, 10.65]}>
            <Cyl rad={0.28} h={0.04} p={[0, 0.5, 0]} c="#2a1c14" o={{ rough: 0.3 }} />
            <Cyl rad={0.03} h={0.48} p={[0, 0.25, 0]} c="#2a1c14" />
            <Cyl rad={0.1} h={0.05} p={[0.05, 0.54, 0.05]} c="#efe6d2" />
          </Group>
        </Group>
      )}
      <Group p={[9.8, 0, 12.3]}>
        {/* globe on a stand */}
        <Cyl rad={0.14} h={0.03} p={[0, 0.015, 0]} c="#2a1c14" />
        <Cyl rad={0.02} h={0.9} p={[0, 0.45, 0]} c={GOLD} o={BRASS} />
        <Ball rad={0.26} p={[0, 1.05, 0]} c="#2f6a8a" o={{ rough: 0.4 }} />
        <Ball rad={0.262} p={[0.03, 1.05, 0.02]} sc={[0.262, 0.14, 0.262]} c="#5a9a5a" o={{ rough: 0.8 }} shadow={false} />
      </Group>

      {/* =================== private gym =================== */}
      <Mirror p={[14.72, 1.4, 7.4]} w={1.4} h={2.0} rot={Math.PI / 2} />
      <Mirror p={[14.72, 1.4, 11.2]} w={2.4} h={2.0} rot={Math.PI / 2} />
      <Blind p={[16.2, 0, 12.8]} rot={Math.PI} w={1.8} top={2.85} drop={0.6} colour="#dfe8ee" />
      <Blind p={[18.2, 0, 12.8]} rot={Math.PI} w={1.5} top={2.85} drop={0.6} colour="#dfe8ee" />
      <Box s={[1.8, 0.45, 0.04]} p={[18.8, 2.45, 6.5]} m={gym} shadow={false} />
      <Group p={[19.3, 0, 8.2]}>
        {/* towel shelf and a rolled yoga mat */}
        <Box s={[0.4, 0.04, 1.2]} p={[0, 1.1, 0]} c="#e9e1d2" />
        {[-0.4, 0, 0.4].map((z, i) => (
          <Round key={z} s={[0.3, 0.14, 0.3]} p={[0, 1.19, z]} c={["#e9e1d2", "#9fd0ea", "#f3bf6a"][i]!} rad={0.04} />
        ))}
        <Cyl rad={0.08} h={0.7} r={[Math.PI / 2, 0, 0]} p={[-0.1, 0.09, 0.2]} c="#2f7f79" />
      </Group>
      <Group p={[19.2, 0, 12.3]}>
        <Round s={[0.34, 0.9, 0.34]} p={[0, 0.45, 0]} c="#e8eef2" rad={0.05} />
        <Cyl rad={0.12} h={0.3} p={[0, 1.05, 0]} c="#9fd0ea" o={{ opacity: 0.6, rough: 0.1 }} shadow={false} />
      </Group>
    </Group>
  );
}