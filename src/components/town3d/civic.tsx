import { useMemo } from "react";
import * as THREE from "three";
import type { B } from "@/lib/town-world";
import { Ball, Band, Box, Cyl, Door, Flat, GableRoof, Hedge, SignBoard, Walls, Window, darkGlass, faceOf, lampBulb, litGlass, mat, onFace, type V3 } from "@/components/town3d/kit";
import { clockTexture, grassTexture, pavingTexture, plasterTexture, roofTileTexture, stoneTexture, tiled } from "@/components/town3d/textures";
import { corrugatedTexture } from "@/components/home3d/textures";
import { Car } from "@/components/town3d/actors";
import { Bench } from "@/components/town3d/props";

/**
 * Town models for the two late-game civic buildings: the Community Hall that rises on the construction site behind
 * MegaCorp, and Bayside Garage on the seafront. Both are static and drawn inside the town's StaticBatch. The town
 * camera looks down steeply from the south, so roofs and the south and west faces carry most of the detail.
 */
const CREAM = "#f4efe4";
const INK = "#2b2a2e";
const plane = new THREE.PlaneGeometry(1, 1);

/* ------------------------------------------------------------------ Community Hall */

const HALL_TEAL = "#304f56";
const HALL_GOLD = "#d8b45a";
const STONE = "#d8c9ab";
const SLATE = "#6f7983";

/** A flat round window (oculus) or medallion set into a south-facing wall. */
function Oculus({ p, rad, glass = true }: { p: V3; rad: number; glass?: boolean }) {
  return (
    <group position={p}>
      <Cyl rad={rad + 0.035} h={0.02} r={[Math.PI / 2, 0, 0]} c={CREAM} />
      {glass ? <mesh position={[0, 0, 0.012]} rotation={[Math.PI / 2, 0, 0]} scale={[rad, 0.01, rad]} geometry={cylGeo} material={litGlass} /> : <Cyl rad={rad} h={0.03} r={[Math.PI / 2, 0, 0]} c={HALL_GOLD} o={{ metal: 0.6, rough: 0.35 }} />}
    </group>
  );
}
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 24);

/** A street lamp on a black post; the lantern glows after dark. */
function Lantern({ x, z, h = 0.75 }: { x: number; z: number; h?: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl rad={0.045} h={0.05} p={[0, 0.025, 0]} c={INK} />
      <Cyl rad={0.018} h={h} p={[0, h / 2, 0]} c={INK} o={{ metal: 0.5, rough: 0.4 }} />
      <Box s={[0.1, 0.12, 0.1]} p={[0, h + 0.06, 0]} m={lampBulb} shadow={false} />
      <Box s={[0.13, 0.025, 0.13]} p={[0, h + 0.13, 0]} c={INK} />
    </group>
  );
}

/** Raised planter of flowers. */
function Planter({ x, z, w = 0.42, seed = 1 }: { x: number; z: number; w?: number; seed?: number }) {
  const blooms = ["#e05a4f", "#f2c94c", "#c56ad9", "#f4efe4", "#e88aa8"];
  return (
    <group position={[x, 0, z]}>
      <Box s={[w, 0.16, 0.24]} p={[0, 0.08, 0]} c="#b8ae9b" o={{ rough: 0.9 }} />
      <Box s={[w - 0.04, 0.02, 0.2]} p={[0, 0.165, 0]} c="#5a4632" />
      {Array.from({ length: 7 }, (_, i) => <Ball key={i} rad={0.045} p={[-w / 2 + 0.05 + i * ((w - 0.1) / 6), 0.2 + ((i * seed) % 3) * 0.012, ((i * 7 + seed) % 3 - 1) * 0.05]} c={i % 2 ? "#4f8a3e" : blooms[(i + seed) % blooms.length]!} o={{ rough: 1 }} />)}
    </group>
  );
}

export function CommunityHall() {
  // Footprint matches the "hall" building (16.6, 16.65, 4.3 × 4.7), inset a touch; the portico steps forward of it.
  const bx = 16.7, bz = 16.8, bw = 4.1, bd = 4.45, H = 1.4, rise = 0.95;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const tx = bx + bw / 2, tz = bz + bd / 2;
  const front = bz + bd;
  const slope = Math.atan2(rise, bw / 2);
  const clock = useMemo(() => mat("#ffffff", { rough: 0.6, map: clockTexture() }), []);
  const lawn = grassTexture();
  // Portico: four columns under a pedimented roof, on three steps.
  const px = tx - 1.25, pw = 2.5, pd = 0.95;
  const P = faceOf(px, front, pw, pd, "s");
  return (
    <group>
      {/* the plot: a stone plinth, paved forecourt, lawns and hedges */}
      <Box s={[5.9, 0.08, 8.6]} p={[19.1, 0.04, 19.4]} c="#cfc6b2" o={{ rough: 0.95 }} />
      <Flat x={16.2} z={front} w={5.8} d={23.65 - front} y={0.082} c="#dcd4c2" map={pavingTexture()} per={0.5} />
      <Flat x={16.2} z={15.15} w={5.8} d={bz - 15.15} y={0.082} c="#8fb36a" map={lawn} per={1.2} />
      <Flat x={bx + bw + 0.05} z={bz} w={22.0 - bx - bw - 0.05} d={bd} y={0.082} c="#8fb36a" map={lawn} per={1.2} />
      <Flat x={tx - 0.5} z={front + pd} w={1.0} d={23.65 - front - pd} y={0.085} c="#c9bfa8" map={stoneTexture()} per={0.4} />
      <Hedge x={21.7} z={15.3} w={0.25} d={5.9} h={0.2} />
      <Hedge x={16.25} z={15.25} w={5.6} d={0.22} h={0.2} />
      <Hedge x={16.2} z={23.35} w={1.35} d={0.22} h={0.16} />
      <Hedge x={20.65} z={23.35} w={1.35} d={0.22} h={0.16} />

      {/* the hall: dressed stone over a rusticated base, string course and a deep cornice */}
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c={STONE} map={stoneTexture()} per={0.45} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.2} c="#b8ae9b" out={0.025} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0.62} h={0.04} c={CREAM} out={0.015} />
      <Band x={bx} z={bz} w={bw} d={bd} y={H - 0.1} h={0.1} c={CREAM} out={0.04} />
      {/* quoins at the visible corners */}
      {[0, 1, 2, 3, 4, 5].map((i) => [[bx, front], [bx + bw, front], [bx, bz]].map(([x, z], k) => (
        <Box key={`${i}${k}`} s={[i % 2 ? 0.16 : 0.24, 0.17, i % 2 ? 0.16 : 0.24]} p={[x!, 0.29 + i * 0.18, z!]} c={CREAM} o={{ rough: 0.85 }} />
      )))}
      {/* tall arched windows: one either side of the portico on the front, five down the west side */}
      {[0.42, bw - 0.42].map((u) => <TallWindow key={u} f={S} u={u} />)}
      {[0.55, 1.4, 2.25, 3.1, 3.95].map((u) => <TallWindow key={u} f={W} u={u} />)}
      <SignBoard f={S} u={0.42} v={0.32} w={0.32} h={0.12} text="EST. 2026" bg="#b8ae9b" fg={INK} border="#9a907d" />
      {/* the main doors behind the portico */}
      <Door f={S} u={bw / 2} w={0.5} h={0.66} c={HALL_TEAL} double frame={CREAM} />
      <Window f={S} u={bw / 2 - 0.62} v={0.6} w={0.18} h={0.44} frame={CREAM} />
      <Window f={S} u={bw / 2 + 0.62} v={0.6} w={0.18} h={0.44} frame={CREAM} />

      {/* slate roof, gable to the street, with an oculus in the gable and skylights down each slope */}
      <GableRoof x={bx - 0.04} z={bz - 0.04} w={bw + 0.08} d={bd + 0.08} y={H} rise={rise} ridge="z" wall={STONE} roof={SLATE} map={roofTileTexture()} />
      <Oculus p={[tx, H + 0.36, front + 0.045]} rad={0.17} />
      {[-1, 1].map((s) => [0.95, 2.2, 3.45].map((dz) => (
        <group key={`${s}${dz}`} position={[tx + s * bw / 4, H + rise / 2 + 0.04, bz + dz]} rotation={[0, 0, -s * slope]}>
          <Box s={[0.6, 0.04, 0.5]} c={CREAM} />
          <Box s={[0.52, 0.02, 0.42]} p={[0, 0.025, 0]} m={litGlass} shadow={false} />
        </group>
      )))}
      {/* clock cupola on the ridge: a square base with clock faces, an open belfry and a lead dome */}
      <group position={[tx, H + rise - 0.2, tz - 0.3]}>
        <Box s={[0.62, 0.62, 0.62]} p={[0, 0.31, 0]} c={CREAM} />
        <Box s={[0.7, 0.06, 0.7]} p={[0, 0.65, 0]} c={STONE} />
        <mesh geometry={plane} position={[0, 0.34, 0.312]} scale={[0.42, 0.42, 1]} material={clock} />
        <mesh geometry={plane} position={[-0.312, 0.34, 0]} rotation={[0, -Math.PI / 2, 0]} scale={[0.42, 0.42, 1]} material={clock} />
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.08, 0.42, 0.08]} p={[x! * 0.24, 0.89, z! * 0.24]} c={CREAM} />)}
        <Cyl rad={0.1} h={0.16} p={[0, 0.86, 0]} c={HALL_GOLD} o={{ metal: 0.7, rough: 0.3 }} />
        <Box s={[0.66, 0.06, 0.66]} p={[0, 1.12, 0]} c={STONE} />
        <Ball rad={0.3} p={[0, 1.15, 0]} sc={[0.3, 0.32, 0.3]} c="#5f8a86" o={{ rough: 0.6, metal: 0.2 }} />
        <Cyl rad={0.012} h={0.4} p={[0, 1.62, 0]} c={INK} />
        <Box s={[0.22, 0.02, 0.02]} p={[0, 1.66, 0]} c={INK} />
        <Box s={[0.02, 0.02, 0.22]} p={[0, 1.66, 0]} c={INK} />
        <Box s={[0.18, 0.08, 0.01]} p={[0.07, 1.78, 0]} c={HALL_GOLD} o={{ metal: 0.7, rough: 0.3 }} />
      </group>

      {/* the portico: three steps, four columns, an entablature carrying the name and a pediment */}
      {[0, 1, 2].map((i) => <Box key={i} s={[pw + 0.3 - i * 0.1, 0.06, pd + 0.36 - i * 0.12]} p={[tx, 0.11 + i * 0.06, front + (pd + 0.36 - i * 0.12) / 2 - 0.02]} c="#e3dccb" o={{ rough: 0.85 }} />)}
      {[0, 1, 2, 3].map((i) => {
        const x = px + 0.18 + i * ((pw - 0.36) / 3);
        return (
          <group key={i} position={[x, 0, front + pd - 0.14]}>
            <Box s={[0.18, 0.06, 0.18]} p={[0, 0.3, 0]} c={CREAM} />
            <Cyl rad={0.075} h={1.0} p={[0, 0.82, 0]} c={CREAM} o={{ rough: 0.7 }} />
            <Box s={[0.2, 0.07, 0.2]} p={[0, 1.35, 0]} c={CREAM} />
          </group>
        );
      })}
      <Box s={[pw, 0.2, pd]} p={[tx, 1.48, front + pd / 2]} c={CREAM} />
      <SignBoard f={P} u={pw / 2} v={1.48} w={2.0} h={0.15} text="COMMUNITY HALL" bg={HALL_TEAL} fg={HALL_GOLD} border={HALL_GOLD} out={0.012} />
      <GableRoof x={px} z={front - 0.1} w={pw} d={pd + 0.12} y={1.58} rise={0.42} ridge="z" wall={CREAM} roof={SLATE} map={roofTileTexture()} />
      <Oculus p={[tx, 1.74, front + pd + 0.03]} rad={0.09} glass={false} />
      {/* pendant lantern hanging inside the portico */}
      <Cyl rad={0.006} h={0.22} p={[tx, 1.27, front + 0.5]} c={INK} />
      <Box s={[0.08, 0.1, 0.08]} p={[tx, 1.12, front + 0.5]} m={lampBulb} shadow={false} />

      {/* forecourt: flagpole, a glazed noticeboard, benches, planters, lamps and a bike rack */}
      <group position={[21.55, 0.08, 22.75]}>
        <Cyl rad={0.06} h={0.06} p={[0, 0.03, 0]} c="#b8ae9b" />
        <Cyl rad={0.018} h={2.3} p={[0, 1.15, 0]} c={CREAM} o={{ metal: 0.4, rough: 0.4 }} />
        <Ball rad={0.035} p={[0, 2.32, 0]} c={HALL_GOLD} o={{ metal: 0.7, rough: 0.3 }} />
        <Box s={[0.5, 0.32, 0.01]} p={[-0.27, 2.08, 0]} c={HALL_TEAL} />
        <Box s={[0.5, 0.06, 0.012]} p={[-0.27, 2.08, 0]} c={HALL_GOLD} shadow={false} />
      </group>
      <group position={[16.85, 0.08, 22.7]}>
        {[-0.26, 0.26].map((x) => <Box key={x} s={[0.04, 0.6, 0.04]} p={[x, 0.3, 0]} c={HALL_TEAL} />)}
        <Box s={[0.62, 0.38, 0.07]} p={[0, 0.68, 0]} c={HALL_TEAL} />
        <Box s={[0.54, 0.28, 0.01]} p={[0, 0.66, 0.04]} c="#c49a6c" />
        {[[-0.17, 0.7, "#f4ead6"], [0, 0.64, "#f2c94c"], [0.17, 0.7, "#cfe6f2"]].map(([x, y, c], i) => <Box key={i} s={[0.12, 0.15, 0.005]} p={[x as number, y as number, 0.047]} c={c as string} shadow={false} />)}
        <Box s={[0.54, 0.28, 0.005]} p={[0, 0.66, 0.052]} m={darkGlass} shadow={false} />
        <Box s={[0.66, 0.04, 0.12]} p={[0, 0.89, 0]} c={HALL_TEAL} />
      </group>
      <group position={[0, 0.08, 0]}>
        <Bench x={17.45} z={23.05} along="x" />
        <Bench x={20.05} z={23.05} along="x" />
      </group>
      <group position={[0, 0.08, 0]}>
        <Planter x={tx - 1.65} z={front + 0.55} seed={1} />
        <Planter x={tx + 1.65} z={front + 0.55} seed={3} />
        <Planter x={16.45} z={21.7} w={0.36} seed={2} />
      </group>
      <Lantern x={tx - 0.75} z={23.45} />
      <Lantern x={tx + 0.75} z={23.45} />
      <group position={[21.45, 0.08, 21.55]}>
        {[-0.2, 0, 0.2].map((dz) => (
          <group key={dz} position={[0, 0, dz]}>
            {[-0.1, 0.1].map((x) => <Box key={x} s={[0.02, 0.22, 0.02]} p={[x, 0.11, 0]} c="#9aa5aa" o={{ metal: 0.6, rough: 0.35 }} />)}
            <Box s={[0.22, 0.02, 0.02]} p={[0, 0.22, 0]} c="#9aa5aa" o={{ metal: 0.6, rough: 0.35 }} />
          </group>
        ))}
      </group>
    </group>
  );
}

/** A tall sash window with a round-headed arch, stone surround and keystone. */
function TallWindow({ f, u }: { f: ReturnType<typeof faceOf>; u: number }) {
  const r: V3 = [0, f.rotY, 0];
  return (
    <>
      <Box s={[0.36, 0.82, 0.03]} p={onFace(f, u, 0.72, 0.012)} r={r} c={CREAM} o={{ rough: 0.6 }} shadow={false} />
      <Box s={[0.28, 0.66, 0.02]} p={onFace(f, u, 0.68, 0.028)} r={r} m={litGlass} shadow={false} />
      <Box s={[0.02, 0.66, 0.025]} p={onFace(f, u, 0.68, 0.035)} r={r} c={CREAM} shadow={false} />
      <Box s={[0.28, 0.02, 0.025]} p={onFace(f, u, 0.74, 0.035)} r={r} c={CREAM} shadow={false} />
      <Box s={[0.1, 0.1, 0.04]} p={onFace(f, u, 1.12, 0.02)} r={r} c={CREAM} />
      <Box s={[0.42, 0.04, 0.08]} p={onFace(f, u, 0.33, 0.035)} r={r} c={CREAM} o={{ rough: 0.7 }} />
    </>
  );
}

/* ------------------------------------------------------------------ Bayside Garage */

const GARAGE_TEAL = "#344b52";
const GARAGE_GOLD = "#e6cf8f";
const HAZARD = "#e6b422";

/** A triangle in the y–z plane, extruded `t` along x (sawtooth roof gable ends). */
const triCache = new Map<string, THREE.ExtrudeGeometry>();
function triGeo(d: number, r: number, t: number) {
  const key = `${d}|${r}|${t}`;
  let g = triCache.get(key);
  if (!g) {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(d, 0);
    s.lineTo(d, r);
    s.closePath();
    g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false });
    triCache.set(key, g);
  }
  return g;
}

/** A stack of tyres lying flat. */
function TyreStack({ p, n = 4 }: { p: V3; n?: number }) {
  return (
    <group position={p}>
      {Array.from({ length: n }, (_, i) => (
        <group key={i} position={[((i * 7) % 3 - 1) * 0.008, 0.035 + i * 0.07, 0]}>
          <Cyl rad={0.12} h={0.065} c="#1d1e20" o={{ rough: 0.9 }} />
          <Cyl rad={0.065} h={0.067} c="#3a3a3c" />
        </group>
      ))}
    </group>
  );
}

/** A roller shutter in a bay opening; `open` is the fraction rolled up (0 closed, 1 fully open). */
function Shutter({ f, u, w, h, open }: { f: ReturnType<typeof faceOf>; u: number; w: number; h: number; open: number }) {
  const r: V3 = [0, f.rotY, 0];
  const down = h * (1 - open);
  const ribs = Math.max(0, Math.round(down / 0.07));
  return (
    <>
      {/* the dark workshop seen through the opening */}
      <Box s={[w, h, 0.02]} p={onFace(f, u, h / 2, 0.005)} r={r} c="#17191b" shadow={false} />
      {open > 0.5 && <Box s={[w - 0.06, 0.03, 0.02]} p={onFace(f, u, h - 0.2, 0.01)} r={r} m={lampBulb} shadow={false} />}
      {down > 0 && <Box s={[w, down, 0.03]} p={onFace(f, u, h - down / 2, 0.02)} r={r} c="#a9b0b3" o={{ rough: 0.45, metal: 0.55 }} />}
      {Array.from({ length: ribs }, (_, i) => <Box key={i} s={[w, 0.012, 0.035]} p={onFace(f, u, h - 0.035 - i * 0.07, 0.025)} r={r} c="#7d8589" shadow={false} />)}
      {/* side guides, the barrel box and a yellow-and-black kerb line */}
      {[-1, 1].map((s) => <Box key={s} s={[0.04, h, 0.05]} p={onFace(f, u + s * (w / 2 + 0.02), h / 2, 0.025)} r={r} c="#5a6066" />)}
      <Box s={[w + 0.1, 0.1, 0.1]} p={onFace(f, u, h + 0.05, 0.05)} r={r} c="#5a6066" o={{ metal: 0.4, rough: 0.5 }} />
      {[0, 1, 2, 3, 4, 5].map((i) => <Box key={`k${i}`} s={[w / 6, 0.008, 0.06]} p={onFace(f, u - w / 2 + w / 12 + (i * w) / 6, 0.004, 0.06)} r={r} c={i % 2 ? INK : HAZARD} shadow={false} />)}
    </>
  );
}

export function BaysideGarage({ b }: { b: B }) {
  const bx = b.x + 0.05, bz = b.y + 0.05, bw = b.w - 0.1, bd = b.d - 0.1, H = 1.0;
  const S = faceOf(bx, bz, bw, bd, "s"), W = faceOf(bx, bz, bw, bd, "w");
  const front = bz + bd;
  // Sawtooth north-light roof in three teeth; here the glazing faces the street so it reads from the camera.
  const teeth = 3, td = bd / teeth, tr = 0.32;
  const roofMat = useMemo(() => mat("#aab1b4", { rough: 0.55, metal: 0.3, map: tiled(corrugatedTexture(), bw / 0.25, Math.hypot(td, tr) / 0.6) }), [bw, td]);
  const bays = [1.42, 2.22, 3.02];
  const gableMat = useMemo(() => mat("#ddd5c4", { rough: 0.9 }), []);
  return (
    <group>
      {/* concrete apron along the west wall and oil-stained forecourt */}
      <Flat x={bx - 0.6} z={bz + 0.2} w={0.6} d={bd - 0.2} y={0.004} c="#a8a69e" map={pavingTexture()} per={0.5} />
      {[[bx + 2.25, front + 0.25, 0.16, 0.1], [bx + 1.35, front + 0.3, 0.1, 0.07], [bx + 3.05, front + 0.2, 0.12, 0.08]].map(([x, z, rx, rz], i) => (
        <mesh key={i} position={[x!, 0.006, z!]} rotation={[-Math.PI / 2, 0, 0]} scale={[rx!, rz!, 1]} geometry={discGeo} material={mat("#3a3632", { rough: 0.3, opacity: 0.55 })} />
      ))}

      {/* rendered block walls with a teal plinth and fascia */}
      <Walls x={bx} z={bz} w={bw} d={bd} h={H} c="#ddd5c4" map={plasterTexture()} per={0.5} />
      <Band x={bx} z={bz} w={bw} d={bd} y={0} h={0.12} c={GARAGE_TEAL} out={0.012} />
      <Band x={bx} z={bz} w={bw} d={bd} y={H - 0.2} h={0.2} c={GARAGE_TEAL} out={0.03} />
      <Box s={[bw + 0.08, 0.025, bd + 0.08]} p={[bx + bw / 2, H - 0.2, bz + bd / 2]} c={GARAGE_GOLD} />

      {/* reception at the west end: glazed door and a shop window with a little canopy */}
      <Door f={S} u={0.62} w={0.3} h={0.5} glass frame={GARAGE_TEAL} />
      <Window f={S} u={0.22} v={0.42} w={0.24} h={0.34} frame={GARAGE_TEAL} />
      <Box s={[0.82, 0.03, 0.22]} p={onFace(S, 0.45, 0.63, 0.11)} c={GARAGE_TEAL} />
      <SignBoard f={S} u={0.45} v={0.71} w={0.6} h={0.09} text="RECEPTION" bg={CREAM} fg={GARAGE_TEAL} border={GARAGE_TEAL} out={0.035} />
      <Box s={[0.02, H - 0.2, 0.06]} p={onFace(S, 0.95, (H - 0.2) / 2, 0.03)} c={GARAGE_TEAL} />

      {/* three workshop bays: one closed, one half up, one open with a car on the ramp */}
      <Shutter f={S} u={bays[0]!} w={0.68} h={0.72} open={0} />
      <Shutter f={S} u={bays[1]!} w={0.68} h={0.72} open={1} />
      <Shutter f={S} u={bays[2]!} w={0.68} h={0.72} open={0.45} />
      {bays.map((u, i) => <SignBoard key={u} f={S} u={u} v={H - 0.1} w={0.3} h={0.1} text={`BAY ${i + 1}`} bg={GARAGE_TEAL} fg={GARAGE_GOLD} border={GARAGE_TEAL} out={0.035} />)}
      <SignBoard f={S} u={2.22} v={H + 0.13} w={2.1} h={0.2} text="BAYSIDE GARAGE" bg={GARAGE_TEAL} fg={GARAGE_GOLD} border={GARAGE_GOLD} out={0.04} />
      <group position={[bx + bays[1]!, 0, front - 0.18]} rotation={[0, Math.PI, 0]} scale={[0.95, 0.95, 0.95]}>
        <Car colour="#3d6fa8" />
      </group>

      {/* west wall: high windows, a side door and a painted tyre sign */}
      {[0.45, 1.35, 2.25].map((u) => <Window key={u} f={W} u={u} v={0.68} w={0.32} h={0.16} frame={GARAGE_TEAL} />)}
      <Door f={W} u={0.9} w={0.26} h={0.44} c={GARAGE_TEAL} frame={CREAM} />
      <SignBoard f={W} u={1.95} v={0.38} w={0.7} h={0.16} text="TYRES · MOT" bg={HAZARD} fg={INK} border={INK} out={0.012} />

      {/* sawtooth roof: corrugated slopes, street-facing glazing and gable ends */}
      <Box s={[bw, 0.04, bd]} p={[bx + bw / 2, H + 0.02, bz + bd / 2]} c="#5a6066" />
      {Array.from({ length: teeth }, (_, k) => {
        const z0 = bz + k * td;
        const ang = Math.atan2(tr, td);
        return (
          <group key={k}>
            <mesh geometry={boxUnit} material={roofMat} position={[bx + bw / 2, H + 0.04 + tr / 2, z0 + td / 2]} rotation={[-ang, 0, 0]} scale={[bw + 0.06, 0.03, Math.hypot(td, tr) + 0.02]} castShadow receiveShadow />
            <Box s={[bw - 0.1, tr - 0.04, 0.02]} p={[bx + bw / 2, H + 0.04 + tr / 2, z0 + td - 0.005]} m={litGlass} shadow={false} />
            {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.025, tr, 0.03]} p={[bx + 0.05 + (i * (bw - 0.1)) / 5, H + 0.04 + tr / 2, z0 + td]} c={GARAGE_TEAL} shadow={false} />)}
            {[bx + 0.015, bx + bw + 0.015].map((x) => <mesh key={x} geometry={triGeo(td, tr, 0.03)} position={[x, H + 0.04, z0]} rotation={[0, -Math.PI / 2, 0]} material={gableMat} castShadow />)}
          </group>
        );
      })}
      {/* extractor fan and a vent stack */}
      <Cyl rad={0.1} h={0.16} p={[bx + bw - 0.4, H + 0.16, bz + 0.25]} c="#9aa5aa" o={{ metal: 0.5, rough: 0.4 }} />
      <Cyl rad={0.12} h={0.03} p={[bx + bw - 0.4, H + 0.26, bz + 0.25]} c="#5a6066" />

      {/* forecourt and yard: MOT A-board, air and water machine, tyre stacks, oil drums and a pallet */}
      <group position={[bx + 0.25, 0, front + 0.32]}>
        {[-1, 1].map((s) => <Box key={s} s={[0.24, 0.32, 0.015]} p={[0, 0.16, s * 0.05]} r={[s * 0.16, 0, 0]} c={CREAM} />)}
        <Box s={[0.2, 0.1, 0.005]} p={[0, 0.22, 0.072]} r={[0.16, 0, 0]} c={HAZARD} shadow={false} />
        <Box s={[0.2, 0.06, 0.005]} p={[0, 0.12, 0.068]} r={[0.16, 0, 0]} c={GARAGE_TEAL} shadow={false} />
      </group>
      <group position={[bx + bw - 0.12, 0, front + 0.22]}>
        <Box s={[0.18, 0.42, 0.14]} p={[0, 0.21, 0]} c="#d9342a" />
        <Box s={[0.12, 0.08, 0.01]} p={[0, 0.33, 0.075]} c="#cfe6f2" shadow={false} />
        <Box s={[0.14, 0.04, 0.01]} p={[0, 0.42, 0.075]} c={CREAM} shadow={false} />
        <Cyl rad={0.035} h={0.02} p={[0.05, 0.2, 0.08]} r={[Math.PI / 2, 0, 0]} c={INK} />
      </group>
      <TyreStack p={[bx - 0.3, 0, bz + 0.45]} n={5} />
      <TyreStack p={[bx - 0.3, 0, bz + 0.75]} n={3} />
      {[[bx - 0.32, bz + 1.85, "#2f5ea8"], [bx - 0.3, bz + 2.1, "#3d7a4a"]].map(([x, z, c], i) => (
        <group key={i} position={[x as number, 0, z as number]}>
          <Cyl rad={0.1} h={0.3} p={[0, 0.15, 0]} c={c as string} o={{ metal: 0.3, rough: 0.5 }} />
          <Cyl rad={0.102} h={0.015} p={[0, 0.22, 0]} c={INK} />
        </group>
      ))}
      <group position={[bx - 0.3, 0, bz + 2.45]}>
        <Box s={[0.36, 0.06, 0.36]} p={[0, 0.03, 0]} c="#b08a5a" />
        <Box s={[0.18, 0.12, 0.16]} p={[-0.06, 0.12, -0.05]} c="#c9a77c" />
        <Box s={[0.14, 0.1, 0.14]} p={[0.09, 0.11, 0.08]} c="#b88b5f" />
        <Box s={[0.08, 0.12, 0.05]} p={[0.1, 0.12, -0.1]} c="#d9342a" />
      </group>
    </group>
  );
}
const boxUnit = new THREE.BoxGeometry(1, 1, 1);
const discGeo = new THREE.CircleGeometry(1, 24);