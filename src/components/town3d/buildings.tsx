import { useMemo } from "react";
import * as THREE from "three";
import type { B } from "@/lib/town-world";
import { townColor, shade } from "@/components/town3d/palette";
import {
  Awning, Ball, Band, Billboard, Box, Cone, Cyl, Door, Fence, Flat, FlatRoof, GableRoof, Hedge, RoofUnit, Round, SignBoard, Walls,
  Window, WindowGrid, darkGlass, faceOf, lampBulb, mat, neonGold, neonRed, nightGlow, onFace,
} from "@/components/town3d/kit";
import {
  brickWallTexture, clockTexture, curtainWallTexture, flatRoofTexture, labelTexture, plasterTexture, roofTileTexture, stoneTexture, tiled,
} from "@/components/town3d/textures";
import { cardboardTexture, corrugatedTexture } from "@/components/home3d/textures";
import { DINER_CHIMNEY } from "@/components/town3d/screen";

type Colours = { wall: string; side: string; roof: string; sign: string };
const colours = (b: B): Colours => ({ wall: townColor(b.wall), side: townColor(b.side), roof: townColor(b.roof), sign: townColor(b.sign) });
const CREAM = "#f4efe4";
const INK = "#2b2a2e";
const GOLD = "#d8b45a";

/** Every building on the map, modelled inside its existing footprint. */
export function TownBuildings({ bs, house }: { bs: B[]; house: number }) {
  return (
    <group>
      {bs.map((b) => <Building key={b.id + (b.id === "home" ? house : "")} b={b} house={house} />)}
    </group>
  );
}

function Building({ b, house }: { b: B; house: number }) {
  const c = colours(b);
  switch (b.id) {
    case "home": return house === 0 ? <Squat b={b} /> : house === 1 ? <Flats b={b} c={c} /> : house === 2 ? <House b={b} c={c} /> : <Mansion b={b} c={c} />;
    case "residence-0": return <Squat b={b} />;
    case "residence-1": return <Flats b={b} c={c} />;
    case "residence-2": return <House b={b} c={c} />;
    case "residence-3": return <Mansion b={b} c={c} />;
    case "yard": return <SiteOffice b={b} c={c} />;
    case "gym": return <Gym b={b} c={c} />;
    case "school": return <School b={b} c={c} />;
    case "bar": return <Pub b={b} c={c} />;
    case "work": return <MegaCorp b={b} c={c} />;
    case "bank": return <Bank b={b} c={c} />;
    case "shop": return <CornerShop b={b} c={c} />;
    case "diner": return <Diner b={b} c={c} />;
    case "pawn": return <Pawn b={b} c={c} />;
    case "furniture": return <Furniture b={b} c={c} />;
    case "casino": return <Casino b={b} c={c} />;
    case "depot": return <Depot b={b} c={c} />;
    case "post": return <PostOffice b={b} c={c} />;
    case "police": return <Police b={b} c={c} />;
    case "clinic": return <Clinic b={b} c={c} />;
    default: return <Generic b={b} c={c} />;
  }
}

/* ------------------------------------------------------------------ homes */

/** Tier 0: a cardboard-box shelter with a tarp lean-to and scavenged bits. */
function Squat({ b }: { b: B }) {
  const { x, y: z } = b;
  const card = useMemo(() => mat("#ffffff", { rough: 0.95, map: cardboardTexture(1) }), []);
  const card2 = useMemo(() => mat("#ffffff", { rough: 0.95, map: cardboardTexture(2) }), []);
  const S = faceOf(x + 0.8, z + 1.9, 1.4, 1.0, "s");
  return (
    <group>
      <Flat x={x + 0.4} z={z + 1.4} w={2.3} d={2.2} y={0.009} c="#8f8a7c" rough={1} />
      <Box s={[1.4, 0.52, 1.0]} p={[x + 1.5, 0.26, z + 2.4]} m={card} />
      <Box s={[0.5, 0.02, 0.32]} p={[x + 1.08, 0.6, z + 2.98]} r={[-0.9, 0, 0.1]} m={card} />
      <Box s={[0.5, 0.02, 0.32]} p={[x + 1.92, 0.6, z + 2.98]} r={[-0.9, 0, -0.1]} m={card2} />
      <Box s={[0.6, 0.4, 0.02]} p={onFace(S, 0.7, 0.2, 0.004)} c="#2a241c" shadow={false} />
      <Box s={[1.15, 0.025, 1.2]} p={[x + 0.55, 0.38, z + 2.4]} r={[0, 0, 0.62]} c="#3f6fb0" o={{ rough: 0.6 }} />
      <Round s={[0.6, 0.12, 0.28]} p={[x + 1.5, 0.06, z + 3.15]} c="#6c7f4f" rad={0.05} />
      <Box s={[0.55, 0.38, 0.45]} p={[x + 2.6, 0.19, z + 1.75]} m={card2} />
      <Box s={[0.4, 0.3, 0.38]} p={[x + 2.6, 0.53, z + 1.78]} r={[0, 0.3, 0]} m={card} />
      {/* Shopping trolley full of belongings */}
      <group position={[x + 0.6, 0, z + 3.45]} rotation={[0, 0.5, 0]}>
        <Box s={[0.42, 0.24, 0.3]} p={[0, 0.3, 0]} c="#9aa2a8" o={{ metal: 0.6, rough: 0.35, opacity: 0.55 }} shadow={false} />
        <Round s={[0.3, 0.16, 0.22]} p={[0, 0.36, 0]} c="#b5523e" rad={0.04} />
        {[[-0.17, -0.12], [0.17, -0.12], [-0.17, 0.12], [0.17, 0.12]].map(([a, c], i) => <Cyl key={i} rad={0.03} h={0.02} p={[a!, 0.04, c!]} r={[Math.PI / 2, 0, 0]} c="#2b2b2b" />)}
        <Box s={[0.02, 0.18, 0.02]} p={[-0.2, 0.12, 0]} c="#9aa2a8" o={{ metal: 0.6 }} />
      </group>
      <Billboard p={[x + 2.45, 0.42, z + 3.55]} w={0.42} h={0.18} text="HOME" bg="#c79a63" fg="#3a2a1a" border="#7a5a38" posts={0.3} />
      <Cyl rad={0.12} h={0.05} p={[x + 2.1, 0.03, z + 3.4]} c="#3b3b3b" />
    </group>
  );
}

/** Tier 1: three-storey block of flats with balconies. */
function Flats({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.15, bz = b.y + 0.35, bw = b.w - 0.3, bd = b.d - 0.5, H = 1.65;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const plaster = plasterTexture();
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={plaster} per={0.7} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.12} c={shade(c.side, -0.1)} />
      {[0.67, 1.22].map((v) => <Band key={v} x={bx} z={bz} w={bw} d={bd} y={v - 0.02} h={0.035} c={CREAM} out={0.015} />)}
      <WindowGrid f={S} floors={3} skip={[bw / 2 - 0.3, bw / 2 + 0.3]} seed={11} />
      <WindowGrid f={W} floors={3} seed={13} />
      <Door f={S} u={bw / 2} c={shade(c.sign, -0.1)} />
      <Box s={[0.6, 0.04, 0.3]} p={onFace(S, bw / 2, 0.53, 0.15)} c={CREAM} />
      <SignBoard f={S} u={bw / 2} v={0.6} w={0.36} h={0.09} text="FLATS" bg={c.sign} out={0.31} />
      {/* Balconies on the upper floors */}
      {[1, 2].map((k) => [0.55, bw - 0.55].map((u) => (
        <group key={`${k}-${u}`}>
          <Box s={[0.5, 0.03, 0.22]} p={onFace(S, u, 0.12 + k * 0.55, 0.11)} c={CREAM} />
          <Box s={[0.5, 0.13, 0.015]} p={onFace(S, u, 0.2 + k * 0.55, 0.215)} m={darkGlass} shadow={false} />
          <Box s={[0.52, 0.015, 0.025]} p={onFace(S, u, 0.27 + k * 0.55, 0.215)} c="#5a5f66" o={{ metal: 0.5 }} />
        </group>
      )))}
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={shade(c.side, -0.05)} map={flatRoofTexture()} />
      <group position={[bx + bw - 0.6, H, bz + 0.7]}>
        {[[-0.12, -0.12], [0.12, -0.12], [-0.12, 0.12], [0.12, 0.12]].map(([a, d], i) => <Box key={i} s={[0.03, 0.16, 0.03]} p={[a!, 0.08, d!]} c="#5a5f66" />)}
        <Cyl rad={0.18} h={0.26} p={[0, 0.29, 0]} c="#8c6d54" o={{ rough: 0.7 }} />
        <Cone rad={0.19} h={0.06} p={[0, 0.45, 0]} c="#6b5442" />
      </group>
      <RoofUnit p={[bx + 0.6, H, bz + 1.4]} />
      <Cyl rad={0.01} h={0.4} p={[bx + 1.2, H + 0.2, bz + 0.5]} c="#3a3a3a" />
      <Box s={[0.3, 0.01, 0.01]} p={[bx + 1.2, H + 0.32, bz + 0.5]} c="#3a3a3a" />
    </group>
  );
}

/** Tier 2: two-storey suburban house with a tiled roof, porch and picket fence. */
function House({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.3, bz = b.y + 0.6, bw = b.w - 0.6, bd = b.d - 1.05, H = 1.1;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const plaster = plasterTexture();
  const front = b.y + b.d;
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={plaster} per={0.7} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.1} c={shade(c.side, -0.15)} />
      <WindowGrid f={S} floors={2} skip={[bw / 2 - 0.3, bw / 2 + 0.3]} seed={21} margin={0.35} spacing={0.6} />
      <WindowGrid f={W} floors={2} seed={23} margin={0.4} spacing={0.75} />
      <Door f={S} u={bw / 2} c={c.sign} />
      {/* Porch */}
      <Box s={[0.8, 0.035, 0.38]} p={onFace(S, bw / 2, 0.55, 0.19)} r={[0.12, 0, 0]} c={c.roof} />
      {[-0.34, 0.34].map((u) => <Cyl key={u} rad={0.022} h={0.53} p={onFace(S, bw / 2 + u, 0.27, 0.36)} c={CREAM} />)}
      <GableRoof x={bx} z={bz} w={bw} d={bd} y={H} rise={0.58} ridge="x" wall={c.wall} roof={c.roof} map={roofTileTexture()} />
      <Box s={[0.2, 0.55, 0.2]} p={[bx + bw - 0.45, H + 0.42, bz + 0.75]} c={shade(c.side, -0.2)} />
      <Box s={[0.24, 0.04, 0.24]} p={[bx + bw - 0.45, H + 0.71, bz + 0.75]} c={shade(c.side, -0.3)} />
      {/* Front garden: picket fence with a gate gap, hedges and a path */}
      <Fence a={[b.x + 0.05, front - 0.05]} b={[b.x + b.w / 2 - 0.3, front - 0.05]} />
      <Fence a={[b.x + b.w / 2 + 0.3, front - 0.05]} b={[b.x + b.w - 0.05, front - 0.05]} />
      <Hedge x={b.x + 0.08} z={bz + bd + 0.05} w={0.32} d={0.3} h={0.16} />
      <Hedge x={b.x + b.w - 0.4} z={bz + bd + 0.05} w={0.32} d={0.3} h={0.16} />
      <Flat x={b.x + b.w / 2 - 0.22} z={bz + bd} w={0.44} d={front - bz - bd} y={0.01} c="#d9d2c2" />
      <Ball rad={0.09} p={[b.x + 0.55, 0.09, front - 0.25]} c="#c94f5c" o={{ rough: 0.8 }} />
    </group>
  );
}

/** Tier 3: a compact mansion with a columned portico and gold trim. */
function Mansion({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.12, bz = b.y + 0.4, bw = b.w - 0.24, bd = b.d - 0.85, H = 1.4;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const cx = bx + bw / 2, front = bz + bd;
  const stone = stoneTexture();
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={stone} per={0.9} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.12} c={shade(c.side, -0.1)} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0.7} h={0.04} c={GOLD} out={0.015} />
      <WindowGrid f={S} floors={2} storey={0.7} h={0.38} w={0.24} skip={[bw / 2 - 0.65, bw / 2 + 0.65]} skipAll seed={31} margin={0.3} spacing={0.5} frame={CREAM} />
      <WindowGrid f={W} floors={2} storey={0.7} h={0.38} w={0.24} seed={33} margin={0.35} spacing={0.6} frame={CREAM} />
      <Door f={S} u={bw / 2} w={0.36} h={0.55} c="#5a2f2a" double />
      {/* Portico: steps, four columns, entablature and pediment */}
      <Box s={[1.3, 0.05, 0.5]} p={[cx, 0.025, front + 0.25]} c="#e4ddd0" />
      <Box s={[1.2, 0.05, 0.42]} p={[cx, 0.07, front + 0.21]} c="#ece6da" />
      {[-0.5, -0.17, 0.17, 0.5].map((u) => <Cyl key={u} rad={0.05} h={1.24} p={[cx + u, 0.71, front + 0.33]} c={CREAM} o={{ rough: 0.6 }} />)}
      <Box s={[1.3, 0.12, 0.48]} p={[cx, 1.39, front + 0.2]} c={CREAM} />
      <Box s={[1.3, 0.03, 0.48]} p={[cx, 1.33, front + 0.2]} c={GOLD} o={{ metal: 0.5, rough: 0.35 }} />
      <GableRoof x={cx - 0.65} z={front - 0.05} w={1.3} d={0.5} y={1.45} rise={0.32} ridge="z" wall={CREAM} roof={c.roof} />
      <GableRoof x={bx} z={bz} w={bw} d={bd} y={H} rise={0.6} ridge="x" wall={c.wall} roof={c.roof} map={roofTileTexture()} />
      {[bx + 0.4, bx + bw - 0.4].map((x) => <Box key={x} s={[0.22, 0.5, 0.22]} p={[x, H + 0.5, bz + bd / 2]} c={shade(c.wall, -0.1)} />)}
      {/* Topiary beside the steps */}
      {[-0.82, 0.82].map((u) => (
        <group key={u}>
          <Cyl rad={0.09} h={0.12} p={[cx + u, 0.06, front + 0.3]} c="#b9a58a" />
          <Cone rad={0.12} h={0.36} p={[cx + u, 0.3, front + 0.3]} c="#3f7a3a" o={{ rough: 1 }} />
        </group>
      ))}
      <Hedge x={b.x + 0.05} z={b.y + b.d - 0.3} w={0.55} d={0.22} h={0.15} c="#3f7a3a" />
      <Hedge x={b.x + b.w - 0.6} z={b.y + b.d - 0.3} w={0.55} d={0.22} h={0.15} c="#3f7a3a" />
    </group>
  );
}

/* ------------------------------------------------------------------ town buildings */

function SiteOffice({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.15, bw = b.w - 0.2, bd = b.d - 0.3, H = 0.62, base = 0.08;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w"), Nf = faceOf(bx, bz, bw, bd, "n");
  const ribs = corrugatedTexture();
  return (
    <group>
      {[[0.15, 0.15], [bw - 0.15, 0.15], [0.15, bd - 0.15], [bw - 0.15, bd - 0.15]].map(([u, v], i) => <Box key={i} s={[0.16, base, 0.16]} p={[bx + u!, base / 2, bz + v!]} c="#8d8a83" />)}
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} y0={base} c={c.wall} map={ribs} per={0.5} />
      <Box s={[bw + 0.06, 0.05, bd + 0.06]} p={[bx + bw / 2, base + H + 0.025, bz + bd / 2]} c={shade(c.side, -0.1)} />
      <Window f={S} u={0.45} v={base + 0.36} w={0.38} h={0.22} />
      <Window f={S} u={bw - 0.45} v={base + 0.36} w={0.38} h={0.22} />
      <Window f={W} u={bd / 2} v={base + 0.36} w={0.3} h={0.22} />
      <Door f={Nf} u={bw / 2} c="#5b6a73" />
      <Billboard p={[bx + bw / 2, base + H + 0.22, bz + bd / 2]} w={1.2} h={0.2} text="SITE OFFICE" bg={c.sign} fg={INK} posts={0.12} />
      <Round s={[0.14, 0.08, 0.14]} p={[bx + 0.3, base + H + 0.09, bz + 0.3]} c="#f2c846" rad={0.05} />
    </group>
  );
}

function Gym({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.05, bz = b.y + 0.05, bw = b.w - 0.1, bd = b.d - 0.1, H = 1.3;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={brickWallTexture()} per={0.45} />
      <Band x={bx} z={bz} w={bw} d={bd} y={H - 0.12} h={0.12} c={c.side} />
      {[0.5, bw - 0.5].map((u) => <Window key={u} f={S} u={u} v={0.42} w={0.72} h={0.5} frame="#2d2f33" />)}
      <Door f={S} u={bw / 2} w={0.42} h={0.48} glass double frame="#2d2f33" />
      <SignBoard f={S} u={bw / 2} v={0.92} w={1.7} h={0.24} text="IRON GYM" bg={c.sign} />
      <WindowGrid f={W} floors={2} seed={41} frame="#2d2f33" spacing={0.7} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={c.side} map={flatRoofTexture()} />
      {[0.8, 1.6, 2.4].map((v) => <Box key={v} s={[0.6, 0.06, 0.35]} p={[bx + 2.1, H + 0.04, bz + v]} m={darkGlass} />)}
      {/* Rooftop dumbbell */}
      <group position={[bx + bw / 2 - 0.3, H, bz + bd - 0.6]}>
        {[-0.4, 0.4].map((x) => <Box key={x} s={[0.04, 0.32, 0.04]} p={[x, 0.16, 0]} c="#3a3d42" />)}
        <Cyl rad={0.035} h={1.25} p={[0, 0.36, 0]} r={[0, 0, Math.PI / 2]} c="#c9ced2" o={{ metal: 0.7, rough: 0.3 }} />
        {[-0.55, -0.46, 0.46, 0.55].map((x, i) => <Cyl key={x} rad={i === 0 || i === 3 ? 0.13 : 0.17} h={0.07} p={[x, 0.36, 0]} r={[0, 0, Math.PI / 2]} c={c.sign} o={{ rough: 0.5 }} />)}
      </group>
    </group>
  );
}

function School({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.1, bw = b.w - 0.2, bd = b.d - 0.2, H = 1.2;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const tx = bx + bw / 2, tz = bz + bd / 2;
  const clock = useMemo(() => mat("#ffffff", { rough: 0.6, map: clockTexture() }), []);
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={brickWallTexture()} per={0.45} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.12} c={CREAM} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0.64} h={0.04} c={CREAM} out={0.015} />
      <WindowGrid f={S} floors={2} seed={51} frame={CREAM} />
      <WindowGrid f={W} floors={2} skip={[bd / 2 - 0.5, bd / 2 + 0.5]} skipAll seed={53} frame={CREAM} />
      <Door f={W} u={bd / 2} w={0.42} h={0.5} c="#6b3a2b" double />
      {[-0.36, 0.36].map((u) => <Cyl key={u} rad={0.04} h={0.62} p={onFace(W, bd / 2 + u, 0.31, 0.12)} c={CREAM} />)}
      <Box s={[0.85, 0.06, 0.32]} p={onFace(W, bd / 2, 0.64, 0.14)} r={[0, W.rotY, 0]} c={CREAM} />
      <SignBoard f={W} u={bd / 2} v={0.84} w={0.9} h={0.2} text="STICK U" bg={c.sign} />
      <GableRoof x={bx} z={bz} w={bw} d={bd} y={H} rise={0.7} ridge="z" wall={c.wall} roof={c.roof} map={roofTileTexture()} />
      {/* Clock tower and flag */}
      <Box s={[0.6, 1.2, 0.6]} p={[tx, H + 0.6, tz]} c={c.wall} />
      <Box s={[0.68, 0.06, 0.68]} p={[tx, H + 1.2, tz]} c={CREAM} />
      <mesh geometry={plane} position={[tx, H + 0.9, tz + 0.305]} scale={[0.42, 0.42, 1]} material={clock} />
      <mesh geometry={plane} position={[tx - 0.305, H + 0.9, tz]} rotation={[0, -Math.PI / 2, 0]} scale={[0.42, 0.42, 1]} material={clock} />
      <Cone rad={0.46} h={0.5} p={[tx, H + 1.48, tz]} c={c.roof} o={{ rough: 0.7 }} />
      <Cyl rad={0.012} h={0.42} p={[tx, H + 1.92, tz]} c="#3a3a3a" />
      <Box s={[0.22, 0.13, 0.01]} p={[tx + 0.11, H + 2.05, tz]} c={c.sign} o={{ rough: 0.8 }} />
    </group>
  );
}
const plane = new THREE.PlaneGeometry(1, 1);

function Pub({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.1, bw = b.w - 0.2, bd = b.d - 0.2, H = 1.15;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w"), Nf = faceOf(bx, bz, bw, bd, "n");
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={brickWallTexture()} per={0.42} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.52} c={c.side} out={0.01} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0.52} h={0.04} c={GOLD} out={0.02} />
      <WindowGrid f={S} floors={1} base={0} storey={0.52} w={0.42} h={0.26} spacing={0.8} seed={61} frame={GOLD} />
      <WindowGrid f={W} floors={1} base={0} storey={0.52} w={0.42} h={0.26} spacing={0.8} seed={63} frame={GOLD} />
      <WindowGrid f={W} floors={2} from={1} base={0.05} seed={67} spacing={0.7} />
      <Door f={Nf} u={bw / 2} c="#3b2a20" />
      <SignBoard f={S} u={bw / 2} v={0.95} w={2.0} h={0.22} text="THE TIPSY STICK" bg={c.sign} fg="#fff1c2" />
      <GableRoof x={bx} z={bz} w={bw} d={bd} y={H} rise={0.5} ridge="x" wall={c.wall} roof={c.roof} map={roofTileTexture()} />
      <Box s={[0.22, 0.5, 0.22]} p={[bx + 0.5, H + 0.45, bz + 1.2]} c={shade(c.wall, -0.15)} />
      {/* Hanging sign on a bracket at the south-west corner */}
      <Box s={[0.42, 0.03, 0.03]} p={[bx - 0.2, 0.9, bz + bd - 0.1]} c="#2b2a2e" />
      <Billboard p={[bx - 0.3, 0.72, bz + bd - 0.1]} w={0.32} h={0.3} text="🍺" bg={c.sign} fg="#fff1c2" />
      {/* Barrels */}
      {[[bx + bw + 0.0, bz + bd - 0.05], [bx + bw - 0.25, bz + bd + 0.05]].map(([x, z], i) => (
        <group key={i}>
          <Cyl rad={0.1} h={0.24} p={[x!, 0.12, z!]} c="#7a5236" o={{ rough: 0.7 }} />
          <Cyl rad={0.103} h={0.02} p={[x!, 0.2, z!]} c="#3a3a3a" o={{ metal: 0.5 }} />
          <Cyl rad={0.103} h={0.02} p={[x!, 0.05, z!]} c="#3a3a3a" o={{ metal: 0.5 }} />
        </group>
      ))}
    </group>
  );
}

function MegaCorp({ b, c }: { b: B; c: Colours }) {
  const px = b.x + 0.05, pz = b.y + 0.05, pw = b.w - 0.1, pd = b.d - 0.1, podium = 0.55;
  const tx = b.x + 0.35, tz = b.y + 0.35, tw = b.w - 0.7, td = b.d - 0.7, top = 3.9;
  const P = faceOf(px, pz, pw, pd, "w"), PS = faceOf(px, pz, pw, pd, "s");
  const T = faceOf(tx, tz, tw, td, "w"), TS = faceOf(tx, tz, tw, td, "s");
  const curtain = useMemo(() => {
    const map = tiled(curtainWallTexture(), 1, 1);
    return nightGlow("megacorp-glass", () => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.18, metalness: 0.25, map, emissive: new THREE.Color("#ffd790"), emissiveMap: map }), 0, 0.9);
  }, []);
  const sMat = useMemo(() => { const m = curtain.clone(); m.map = m.emissiveMap = tiled(curtainWallTexture(), tw / 0.5, (top - podium) / 0.5); return nightGlow("megacorp-s", () => m, 0, 0.9); }, [curtain, tw]);
  const wMat = useMemo(() => { const m = curtain.clone(); m.map = m.emissiveMap = tiled(curtainWallTexture(), td / 0.5, (top - podium) / 0.5); return nightGlow("megacorp-w", () => m, 0, 0.9); }, [curtain, td]);
  return (
    <group>
      <Walls x={px} z={pz} w={pw} d={pd} h={podium} c={c.side} map={stoneTexture()} per={0.8} />
      <Box s={[tw, top - podium, td]} p={[tx + tw / 2, podium + (top - podium) / 2, tz + td / 2]} c="#3b4654" o={{ rough: 0.3 }} />
      <mesh geometry={plane} position={[tx + tw / 2, (top + podium) / 2, tz + td + 0.004]} scale={[tw, top - podium, 1]} material={sMat} />
      <mesh geometry={plane} position={[tx - 0.004, (top + podium) / 2, tz + td / 2]} rotation={[0, -Math.PI / 2, 0]} scale={[td, top - podium, 1]} material={wMat} />
      {[1.4, 2.25, 3.1].map((v) => <Band key={v} x={tx} z={tz} w={tw} d={td} y={v} h={0.03} c="#c7ccd1" out={0.012} />)}
      <Box s={[tw + 0.08, 0.22, td + 0.08]} p={[tx + tw / 2, top + 0.11, tz + td / 2]} c={c.wall} />
      <SignBoard f={T} u={td / 2} v={top + 0.11} w={2.0} h={0.17} text="MEGACORP" bg={c.sign} out={0.05} />
      <SignBoard f={TS} u={tw / 2} v={top + 0.11} w={1.8} h={0.17} text="MEGACORP" bg={c.sign} out={0.05} />
      <FlatRoof x={tx} z={tz} w={tw} d={td} y={top + 0.22} c={c.roof} trim={c.wall} map={flatRoofTexture()} />
      <RoofUnit p={[tx + 0.6, top + 0.22, tz + 0.8]} s={0.3} />
      <RoofUnit p={[tx + 2.2, top + 0.22, tz + 2.4]} s={0.3} />
      <Cyl rad={0.02} h={0.5} p={[tx + tw / 2, top + 0.47, tz + td / 2]} c="#5a5f66" o={{ metal: 0.6 }} />
      <mesh geometry={sphere} position={[tx + tw / 2, top + 0.74, tz + td / 2]} scale={0.04} material={neonRed} />
      {/* Ground-floor entrance on the podium's west face */}
      <Door f={P} u={pd / 2} w={0.5} h={0.42} glass double frame="#c7ccd1" />
      <Box s={[0.9, 0.04, 0.4]} p={onFace(P, pd / 2, 0.5, 0.2)} r={[0, P.rotY, 0]} c="#c7ccd1" o={{ metal: 0.5, rough: 0.3 }} />
      <WindowGrid f={PS} floors={1} base={0.02} storey={0.5} w={0.42} h={0.26} spacing={0.65} seed={71} frame="#c7ccd1" />
      <WindowGrid f={P} floors={1} base={0.02} storey={0.5} w={0.42} h={0.26} spacing={0.65} skip={[pd / 2 - 0.5, pd / 2 + 0.5]} seed={73} frame="#c7ccd1" />
    </group>
  );
}
const sphere = new THREE.SphereGeometry(1, 12, 9);

function Bank({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.45, bz = b.y + 0.1, bw = b.w - 0.55, bd = b.d - 0.2, H = 1.35;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const stone = stoneTexture();
  const money = useMemo(() => mat("#ffffff", { rough: 0.4, metal: 0.3, map: labelTexture("$", GOLD, "#5a3e10", { w: 256, h: 256, size: 200 }) }), []);
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={stone} per={0.8} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.14} c={shade(c.side, -0.05)} />
      <WindowGrid f={S} floors={2} storey={0.6} h={0.34} seed={81} frame={CREAM} />
      <WindowGrid f={W} floors={2} storey={0.6} h={0.34} skip={[bd / 2 - 0.45, bd / 2 + 0.45]} skipAll seed={83} frame={CREAM} />
      <Door f={W} u={bd / 2} w={0.4} h={0.55} c="#4a3524" double />
      {/* Portico on the west front */}
      <Box s={[0.46, 0.05, 2.9]} p={[b.x + 0.23, 0.025, bz + bd / 2]} c="#e2dccf" />
      <Box s={[0.36, 0.05, 2.8]} p={[b.x + 0.28, 0.075, bz + bd / 2]} c="#ebe6da" />
      {[-1.15, -0.4, 0.4, 1.15].map((u) => <Cyl key={u} rad={0.065} h={1.12} p={[b.x + 0.18, 0.66, bz + bd / 2 + u]} c={CREAM} o={{ rough: 0.55 }} />)}
      <Box s={[0.5, 0.18, 2.95]} p={[b.x + 0.24, 1.31, bz + bd / 2]} c={CREAM} />
      <SignBoard f={faceOf(b.x - 0.01, bz + bd / 2 - 1.475, 0.5, 2.95, "w")} u={1.475} v={1.31} w={1.5} h={0.13} text="TOWN BANK" bg={c.sign} out={0.012} />
      <GableRoof x={b.x - 0.01} z={bz + bd / 2 - 1.5} w={0.52} d={3.0} y={1.4} rise={0.32} ridge="x" wall={CREAM} roof={shade(c.roof, 0.1)} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={CREAM} map={flatRoofTexture()} parapet={0.12} />
      <Cyl rad={0.26} h={0.06} p={[bx + bw / 2, H + 0.3, bz + bd / 2]} r={[0, 0, Math.PI / 2]} c={GOLD} o={{ metal: 0.7, rough: 0.3 }} />
      <mesh geometry={disc} position={[bx + bw / 2 - 0.035, H + 0.3, bz + bd / 2]} rotation={[0, -Math.PI / 2, 0]} scale={0.24} material={money} />
      <Box s={[0.05, 0.3, 0.05]} p={[bx + bw / 2, H + 0.13, bz + bd / 2]} c="#7a6a4a" />
    </group>
  );
}
const disc = new THREE.CircleGeometry(1, 32);

function CornerShop({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.05, bz = b.y + 0.1, bw = b.w - 0.1, bd = b.d - 0.5, H = 0.85;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={plasterTexture()} per={0.7} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.1} c={shade(c.side, -0.15)} />
      {[0.5, bw - 0.5].map((u) => <Window key={u} f={S} u={u} v={0.37} w={0.66} h={0.4} frame={CREAM} />)}
      <Door f={S} u={bw / 2} w={0.34} h={0.46} glass frame={CREAM} />
      <Awning f={S} u={bw / 2} w={bw - 0.1} v={0.66} depth={0.36} colour={c.sign} />
      <SignBoard f={S} u={bw / 2} v={0.77} w={1.9} h={0.13} text="CORNER SHOP" bg={c.sign} />
      <Window f={W} u={bd / 2} v={0.45} w={0.42} h={0.26} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={c.side} map={flatRoofTexture()} />
      <RoofUnit p={[bx + bw - 0.5, H, bz + 0.6]} />
      {/* Fruit crates and an OPEN board */}
      {[0.3, 0.62].map((u, i) => (
        <group key={u}>
          <Box s={[0.26, 0.12, 0.2]} p={[bx + u, 0.06, bz + bd + 0.17]} c="#b78b5a" o={{ rough: 0.9 }} />
          {[-0.07, 0, 0.07].map((dx) => <Ball key={dx} rad={0.035} p={[bx + u + dx, 0.14, bz + bd + 0.17]} c={i ? "#e7952f" : "#c43d3d"} o={{ rough: 0.6 }} />)}
        </group>
      ))}
      <Billboard p={[bx + bw - 0.3, 0.17, bz + bd + 0.24]} w={0.24} h={0.26} text="OPEN" bg="#2b2a2e" fg="#f7e6a6" rotY={-0.2} />
    </group>
  );
}

function Diner({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.35, bw = b.w - 0.2, bd = b.d - 0.7, H = 0.78;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const chrome = "#d5dade";
  return (
    <group>
      <Round s={[bw, H, bd]} p={[bx + bw / 2, H / 2, bz + bd / 2]} c={c.wall} rad={0.12} o={{ rough: 0.55 }} />
      {[0.26, 0.7].map((v) => <Round key={v} s={[bw + 0.03, 0.035, bd + 0.03]} p={[bx + bw / 2, v, bz + bd / 2]} c={chrome} rad={0.017} o={{ metal: 0.8, rough: 0.2 }} />)}
      <WindowGrid f={S} floors={1} base={0.18} storey={0.55} w={0.4} h={0.26} spacing={0.55} skip={[bw / 2 - 0.3, bw / 2 + 0.3]} seed={91} frame={chrome} margin={0.35} />
      <WindowGrid f={W} floors={1} base={0.18} storey={0.55} w={0.4} h={0.26} spacing={0.55} seed={93} frame={chrome} margin={0.35} />
      <Door f={S} u={bw / 2} w={0.32} h={0.46} glass frame={chrome} />
      <Round s={[bw + 0.1, 0.07, bd + 0.1]} p={[bx + bw / 2, H + 0.02, bz + bd / 2]} c={c.side} rad={0.03} />
      <Billboard p={[bx + bw / 2, H + 0.5, bz + bd / 2]} w={2.0} h={0.36} text="FRYDAY DINER" bg={c.sign} posts={0.4} />
      {/* Coffee cup on the roof corner and the kitchen chimney */}
      <group position={[bx + 0.35, H + 0.05, bz + bd - 0.35]}>
        <Cyl rad={0.12} h={0.2} p={[0, 0.1, 0]} c={CREAM} o={{ rough: 0.4 }} />
        <Cyl rad={0.105} h={0.01} p={[0, 0.2, 0]} c="#5a3a22" />
        <Round s={[0.05, 0.12, 0.05]} p={[0.14, 0.11, 0]} c={CREAM} rad={0.02} />
      </group>
      <Cyl rad={0.06} h={0.3} p={[DINER_CHIMNEY.x, H + 0.15, DINER_CHIMNEY.z]} c="#8f969b" o={{ metal: 0.6, rough: 0.3 }} />
    </group>
  );
}

function Pawn({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.1, bw = b.w - 0.2, bd = b.d - 0.2, H = 1.1;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={brickWallTexture()} per={0.42} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.1} c={shade(c.side, -0.2)} />
      <WindowGrid f={S} floors={2} seed={101} frame="#2d2f33" />
      <WindowGrid f={W} floors={2} skip={[bd / 2 - 0.35, bd / 2 + 0.35]} seed={103} frame="#2d2f33" />
      {/* Bars on the ground-floor windows */}
      {[0.25, bd - 0.25].map((u) => [-0.08, 0, 0.08].map((du) => <Box key={`${u}${du}`} s={[0.012, 0.3, 0.012]} p={onFace(W, u + du, 0.42, 0.045)} c="#2b2a2e" shadow={false} />))}
      <Door f={W} u={bd / 2} c="#3b3f45" />
      <SignBoard f={W} u={bd / 2} v={0.66} w={1.6} h={0.17} text="ODDITIES PAWN" bg={c.sign} />
      {/* Three gold balls on a bracket */}
      <Box s={[0.36, 0.03, 0.03]} p={[bx - 0.18, 0.95, bz + 0.45]} c="#2b2a2e" />
      {[[-0.32, 0.78, -0.08], [-0.22, 0.7, 0.0], [-0.32, 0.78, 0.08]].map(([dx, y, dz], i) => (
        <mesh key={i} geometry={sphere} position={[bx + dx!, y!, bz + 0.45 + dz!]} scale={0.065} material={mat(GOLD, { metal: 0.8, rough: 0.25 })} castShadow />
      ))}
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={c.side} map={flatRoofTexture()} />
      <RoofUnit p={[bx + 1.8, H, bz + 1.0]} />
    </group>
  );
}

function Furniture({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.05, bz = b.y + 0.15, bw = b.w - 0.1, bd = b.d - 0.3, H = 1.35;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={plasterTexture()} per={0.7} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.08} c={shade(c.side, -0.15)} />
      {[0.6, bw - 0.6].map((u) => <Window key={u} f={S} u={u} v={0.36} w={0.85} h={0.46} frame={CREAM} />)}
      <Door f={S} u={bw / 2} w={0.36} h={0.46} glass double frame={CREAM} />
      <Awning f={S} u={bw / 2} w={bw - 0.1} v={0.68} depth={0.38} colour={c.sign} />
      <WindowGrid f={S} floors={2} from={1} base={0.2} storey={0.5} seed={111} frame={CREAM} margin={0.4} />
      <SignBoard f={S} u={bw / 2} v={1.24} w={1.7} h={0.15} text="COSY CORNER" bg={c.sign} />
      <WindowGrid f={W} floors={2} base={0.02} storey={0.56} seed={113} frame={CREAM} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={c.side} map={flatRoofTexture()} />
      {/* Giant sofa on the roof */}
      <group position={[bx + bw / 2, H, bz + bd - 0.7]}>
        <Round s={[1.1, 0.16, 0.42]} p={[0, 0.17, 0.02]} c={c.sign} rad={0.06} />
        <Round s={[1.1, 0.32, 0.13]} p={[0, 0.33, -0.17]} c={c.sign} rad={0.06} />
        {[-0.56, 0.56].map((x) => <Round key={x} s={[0.14, 0.26, 0.44]} p={[x, 0.22, 0.0]} c={shade(c.sign, -0.1)} rad={0.06} />)}
        {[-0.45, 0.45].map((x) => <Box key={x} s={[0.04, 0.1, 0.04]} p={[x, 0.05, 0.12]} c="#3a2a1e" />)}
      </group>
    </group>
  );
}

function Casino({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.05, bz = b.y + 0.05, bw = b.w - 0.1, bd = b.d - 0.1, H = 1.8;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w"), Nf = faceOf(bx, bz, bw, bd, "n");
  const sevens = useMemo(() => {
    const map = labelTexture("LUCKY 7s", "#2a1220", "#ffd35c", { w: 512, h: 128, border: "#ffd35c" });
    return nightGlow("casino-sign", () => new THREE.MeshStandardMaterial({ color: "#ffffff", map, emissive: new THREE.Color("#ffffff"), emissiveMap: map, roughness: 0.5 }), 0.25, 1.4);
  }, []);
  const bulbs = (f: typeof S, len: number) => Array.from({ length: Math.floor(len / 0.18) }, (_, i) => (
    <mesh key={i} geometry={sphere} position={onFace(f, 0.1 + i * 0.18, H - 0.09, 0.04)} scale={0.028} material={lampBulb} />
  ));
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={plasterTexture()} per={0.7} />
      <Band x={bx} z={bz} w={bw} d={bd} y={H - 0.18} h={0.18} c={GOLD} out={0.02} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.14} c={shade(c.side, -0.2)} />
      {[0.15, 0.7, 1.35, 2.0, bw - 0.15].map((u) => <Box key={"ps" + u} s={[0.07, H - 0.3, 0.03]} p={onFace(S, u, (H - 0.3) / 2 + 0.14, 0.015)} c={GOLD} o={{ metal: 0.6, rough: 0.35 }} />)}
      {[0.15, 1.0, 2.0, 3.0, bd - 0.15].map((u) => <Box key={"pw" + u} s={[0.07, H - 0.3, 0.03]} p={onFace(W, u, (H - 0.3) / 2 + 0.14, 0.015)} r={[0, W.rotY, 0]} c={GOLD} o={{ metal: 0.6, rough: 0.35 }} />)}
      {/* Big gold sevens on the visible walls */}
      <SignBoard f={S} u={bw / 2} v={0.95} w={1.1} h={0.42} text="7 7 7" bg={shade(c.wall, -0.25)} fg="#ffd35c" border={GOLD} />
      <SignBoard f={W} u={bd / 2} v={0.95} w={1.3} h={0.42} text="CASINO" bg={shade(c.wall, -0.25)} fg="#ffd35c" border={GOLD} />
      {bulbs(S, bw)}
      {bulbs(W, bd)}
      <Door f={Nf} u={bw / 2} w={0.45} h={0.5} glass double frame={GOLD} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={GOLD} map={flatRoofTexture()} />
      <Billboard p={[bx + bw / 2, H + 0.5, bz + bd / 2]} w={2.3} h={0.58} text="LUCKY 7s" bg="#2a1220" posts={0.25} emissive={sevens} border="#ffd35c" />
      {[-1.2, 1.2].map((dx) => <mesh key={dx} geometry={boxGeo} position={[bx + bw / 2 + dx, H + 0.5, bz + bd / 2 + 0.02]} scale={[0.04, 0.62, 0.04]} material={neonRed} />)}
      <mesh geometry={boxGeo} position={[bx + bw / 2, H + 0.83, bz + bd / 2 + 0.02]} scale={[2.44, 0.04, 0.04]} material={neonRed} />
      <mesh geometry={boxGeo} position={[bx + bw / 2, H + 0.17, bz + bd / 2 + 0.02]} scale={[2.44, 0.04, 0.04]} material={neonGold} />
    </group>
  );
}
const boxGeo = new THREE.BoxGeometry(1, 1, 1);

function Depot({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.05, bz = b.y + 0.05, bw = b.w - 0.1, bd = b.d - 0.1, H = 1.0;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const ribs = corrugatedTexture();
  const shutter = useMemo(() => mat("#b7bcc0", { rough: 0.5, metal: 0.4, map: tiled(ribs, 1.5, 1.2) }), [ribs]);
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.side} map={ribs} per={0.5} />
      <Band x={bx} z={bz} w={bw} d={bd} y={H - 0.16} h={0.16} c={c.sign} />
      {[0.55, bd - 0.55].map((u) => (
        <group key={u}>
          <Box s={[0.82, 0.68, 0.03]} p={onFace(W, u, 0.35, 0.015)} r={[0, W.rotY, 0]} c="#3a3d42" />
          <mesh geometry={boxGeo} position={onFace(W, u, 0.34, 0.03)} rotation={[0, W.rotY, 0]} scale={[0.76, 0.62, 0.01]} material={shutter} />
        </group>
      ))}
      <Door f={W} u={bd / 2} w={0.28} c="#4a6a8c" />
      <SignBoard f={W} u={bd / 2} v={0.78} w={1.6} h={0.17} text="TOWN TRANSIT" bg={c.sign} />
      <WindowGrid f={S} floors={1} base={0.2} storey={0.6} seed={121} spacing={0.7} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={c.sign} map={flatRoofTexture()} />
      <RoofUnit p={[bx + 1.9, H, bz + 1.5]} />
      {/* Bus stop flag */}
      <Cyl rad={0.02} h={0.62} p={[bx + 0.08, 0.31, bz + bd - 0.12]} c="#3a3d42" />
      <Billboard p={[bx + 0.08, 0.6, bz + bd - 0.12]} w={0.24} h={0.2} text="BUS" bg={c.sign} rotY={-Math.PI / 2} />
    </group>
  );
}

function Police({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.1, bw = b.w - 0.2, bd = b.d - 0.2, H = 1.35;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const blue = useMemo(() => nightGlow("police-lamp", () => new THREE.MeshStandardMaterial({ color: "#2f63c9", roughness: 0.3, emissive: new THREE.Color("#4d8bff") }), 0.4, 2.2), []);
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={stoneTexture()} per={0.8} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0.5} h={0.07} c={c.sign} out={0.015} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.1} c={shade(c.side, -0.15)} />
      <WindowGrid f={S} floors={2} seed={131} frame={CREAM} />
      <WindowGrid f={W} floors={2} skip={[bd / 2 - 0.5, bd / 2 + 0.5]} skipAll seed={133} frame={CREAM} />
      <Door f={W} u={bd / 2} w={0.42} h={0.46} glass double frame={CREAM} />
      <Box s={[0.9, 0.04, 0.34]} p={onFace(W, bd / 2, 0.55, 0.17)} r={[0, W.rotY, 0]} c={c.sign} />
      <mesh geometry={boxGeo} position={onFace(W, bd / 2, 0.66, 0.12)} rotation={[0, W.rotY, 0]} scale={[0.2, 0.1, 0.1]} material={blue} />
      <SignBoard f={W} u={bd / 2} v={0.92} w={1.3} h={0.2} text="TOWN POLICE" bg={c.sign} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={shade(c.side, -0.05)} map={flatRoofTexture()} />
      <Cyl rad={0.014} h={0.85} p={[bx + 0.4, H + 0.42, bz + bd - 0.4]} c="#d9d9d9" o={{ metal: 0.6 }} />
      <Box s={[0.3, 0.18, 0.01]} p={[bx + 0.56, H + 0.74, bz + bd - 0.4]} c={c.sign} />
      <Cyl rad={0.01} h={0.6} p={[bx + bw - 0.4, H + 0.3, bz + 0.5]} c="#3a3a3a" />
      <RoofUnit p={[bx + 1.6, H, bz + 1.3]} />
    </group>
  );
}

function Clinic({ b, c }: { b: B; c: Colours }) {
  const bx = b.x + 0.1, bz = b.y + 0.15, bw = b.w - 0.2, bd = b.d - 0.5, H = 1.2;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const cross = useMemo(() => nightGlow("clinic-cross", () => new THREE.MeshStandardMaterial({ color: "#3db36b", roughness: 0.4, emissive: new THREE.Color("#4dff8f") }), 0.15, 1.6), []);
  return (
    <group>
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={c.wall} map={plasterTexture()} per={0.7} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.1} c={shade(c.side, -0.1)} />
      <WindowGrid f={S} floors={2} skip={[bw / 2 - 0.45, bw / 2 + 0.45]} skipAll seed={141} />
      <WindowGrid f={W} floors={2} seed={143} />
      <Door f={S} u={bw / 2} w={0.42} h={0.46} glass double />
      {/* Canopy on posts */}
      <Box s={[1.0, 0.05, 0.5]} p={onFace(S, bw / 2, 0.58, 0.28)} c={CREAM} />
      {[-0.44, 0.44].map((u) => <Cyl key={u} rad={0.02} h={0.56} p={onFace(S, bw / 2 + u, 0.28, 0.5)} c="#c9ced2" o={{ metal: 0.5 }} />)}
      <mesh geometry={boxGeo} position={onFace(S, bw / 2, 0.86, 0.04)} scale={[0.1, 0.32, 0.04]} material={cross} />
      <mesh geometry={boxGeo} position={onFace(S, bw / 2, 0.86, 0.04)} scale={[0.32, 0.1, 0.04]} material={cross} />
      <SignBoard f={S} u={bw / 2} v={1.1} w={1.6} h={0.14} text="PATCH UP CLINIC" bg={c.sign} />
      <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c={c.roof} trim={shade(c.side, -0.05)} map={flatRoofTexture()} />
      <RoofUnit p={[bx + 0.6, H, bz + 0.9]} />
      <RoofUnit p={[bx + 2.1, H, bz + 1.8]} />
    </group>
  );
}

/** North-east postal counter: a compact brick-and-cream public building. */
function PostOffice({ b, c }: { b: B; c: Colours }) {
  const bx=b.x+0.08, bz=b.y+0.08, bw=b.w-0.16, bd=b.d-0.16, H=1.08;
  const W=faceOf(bx,bz,bw,bd,"w");
  const S=faceOf(bx,bz,bw,bd,"s");
  return <group>
    <Walls x={bx} z={bz} w={bw} d={bd} h={H} c="#e1caaa" map={brickWallTexture()} per={0.8}/>
    <Band x={bx} z={bz} w={bw} d={bd} y={0.05} h={0.12} c="#873f36"/>
    <FlatRoof x={bx} z={bz} w={bw} d={bd} y={H} c="#554b48" trim="#eee6d5"/>
    <WindowGrid f={S} floors={1} skip={[bw/2-0.6,bw/2+0.6]} skipAll frame={CREAM}/>
    <WindowGrid f={W} floors={1} frame={CREAM}/>
    <Door f={S} u={bw/2} w={0.54} h={0.68} glass double frame={CREAM}/>
    <SignBoard f={S} u={bw/2} v={0.88} w={1.65} h={0.2} text="POST OFFICE" bg="#9d3438" fg="#fff4d8"/>
    <Box s={[0.42,0.67,0.38]} p={[bx+bw-0.42,0.34,bz+bd+0.32]} c="#c33337"/>
    <Box s={[0.32,0.04,0.14]} p={[bx+bw-0.42,0.52,bz+bd+0.54]} c="#28252b"/>
  </group>;
}

function Generic({ b, c }: { b: B; c: Colours }) {
  const H = b.h / 50;
  const S = faceOf(b.x, b.y, b.w, b.d, "s"), W = faceOf(b.x, b.y, b.w, b.d, "w");
  return (
    <group>
      <Walls x={b.x} z={b.y} w={b.w} d={b.d} h={H} c={c.wall} map={plasterTexture()} />
      <WindowGrid f={S} floors={Math.max(1, Math.floor(H / 0.55))} />
      <WindowGrid f={W} floors={Math.max(1, Math.floor(H / 0.55))} />
      <FlatRoof x={b.x} z={b.y} w={b.w} d={b.d} y={H} c={c.roof} trim={c.side} />
    </group>
  );
}

