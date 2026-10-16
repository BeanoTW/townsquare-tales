import { useMemo } from "react";
import type { B } from "@/lib/town-world";
import { shade } from "@/components/town3d/palette";
import { Ball, Box, Cone, Cyl, Flat, Walls, Window, faceOf, lampBulb, mat } from "@/components/town3d/kit";
import { grassTexture, pavingTexture, roofTileTexture, stoneTexture } from "@/components/town3d/textures";

/**
 * Tier 4: the castle, built on the old cardboard-box plot once bought. A curtain wall with crenellations,
 * four round corner towers under slate cones with pennants, a twin-towered gatehouse with a half-raised
 * portcullis and a drawbridge over the moat, and a square keep with corner turrets in a paved courtyard.
 * Every piece stays inside the plot, which faces south onto the upper west street.
 */
type Colours = { wall: string; side: string; roof: string; sign: string };
const STONE = "#b9b1a2";
const STONE_D = "#8f877a";
const SLATE = "#4a5a72";
const RED = "#a93d37";
const GOLD = "#d8b45a";
const WOOD = "#7a5232";

/** A row of merlons along a wall top from (x0,z0) to (x1,z1). */
function Merlons({ x0, z0, x1, z1, y, t = 0.28, c = STONE }: { x0: number; z0: number; x1: number; z1: number; y: number; t?: number; c?: string }) {
  const len = Math.hypot(x1 - x0, z1 - z0);
  const n = Math.max(2, Math.floor(len / 0.24));
  const alongX = Math.abs(x1 - x0) > Math.abs(z1 - z0);
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const k = (i + 0.5) / n;
        return <Box key={i} s={alongX ? [0.13, 0.13, t] : [t, 0.13, 0.13]} p={[x0 + (x1 - x0) * k, y + 0.065, z0 + (z1 - z0) * k]} c={c} o={{ rough: 0.95 }} />;
      })}
    </>
  );
}

/** Round tower: stone drum, crenellated top ring, slate cone and a pennant. */
function Tower({ x, z, h, rad, flag }: { x: number; z: number; h: number; rad: number; flag: string }) {
  return (
    <group>
      <Cyl rad={rad} h={h} p={[x, h / 2, z]} c={STONE} o={{ rough: 0.95 }} />
      <Cyl rad={rad + 0.05} h={0.08} p={[x, h + 0.04, z]} c={STONE_D} />
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i / 10) * Math.PI * 2;
        return <Box key={i} s={[0.12, 0.12, 0.08]} p={[x + Math.cos(a) * (rad + 0.02), h + 0.14, z + Math.sin(a) * (rad + 0.02)]} r={[0, -a, 0]} c={STONE} />;
      })}
      <Cone rad={rad + 0.02} h={rad * 1.5} p={[x, h + 0.1 + rad * 0.75, z]} c={SLATE} o={{ rough: 0.7 }} />
      <Cyl rad={0.012} h={0.4} p={[x, h + 0.1 + rad * 1.5 + 0.2, z]} c="#2b2a2e" shadow={false} />
      <Box s={[0.26, 0.12, 0.01]} p={[x + 0.13, h + 0.1 + rad * 1.5 + 0.32, z]} c={flag} shadow={false} />
      {/* arrow slits */}
      {[0.45, 0.95].map((y) => <Box key={y} s={[0.04, 0.16, 0.02]} p={[x, y, z + rad + 0.005]} c="#2b2a2e" shadow={false} />)}
    </group>
  );
}

export function Castle({ b, c }: { b: B; c: Colours }) {
  const stone = stoneTexture();
  const grass = grassTexture(), paving = pavingTexture();
  const water = useMemo(() => mat("#3f7f9a", { rough: 0.1, metal: 0.15 }), []);
  const cx = b.x + b.w / 2;
  // Curtain wall rectangle inside the plot, the moat in front of it.
  const x0 = b.x + 0.5, x1 = b.x + b.w - 0.5, z0 = b.y + 0.45, z1 = b.y + b.d - 0.75;
  const H = 0.95, T = 0.28;
  // Keep at the back of the courtyard.
  const kw = 2.3, kd = 1.8, kx = cx - kw / 2, kz = z0 + 0.4, KH = 2.2;
  const S = faceOf(kx, kz, kw, kd, "s"), Wf = faceOf(kx, kz, kw, kd, "w");
  const gate = 0.62;
  return (
    <group>
      {/* Grounds: lawn round the walls, a paved courtyard, the moat across the front */}
      <Flat x={b.x} z={b.y} w={b.w} d={b.d} y={0.0072} c="#6f9f4c" map={grass} per={1.2} />
      <Flat x={x0} z={z0} w={x1 - x0} d={z1 - z0} y={0.0076} c="#cfc6b4" map={paving} per={0.5} />
      <Box s={[b.w - 0.3, 0.06, 0.5]} p={[cx, -0.01, z1 + 0.42]} c={STONE_D} />
      <mesh position={[cx, 0.026, z1 + 0.42]} rotation={[-Math.PI / 2, 0, 0]} material={water} receiveShadow><planeGeometry args={[b.w - 0.4, 0.4]} /></mesh>
      {/* drawbridge: planks and chains up to the gatehouse */}
      <Box s={[gate - 0.04, 0.04, 0.72]} p={[cx, 0.05, z1 + 0.38]} c={WOOD} />
      {[-0.22, 0, 0.22].map((u) => <Box key={u} s={[0.02, 0.045, 0.72]} p={[cx + u, 0.06, z1 + 0.38]} c={shade(WOOD, -0.2)} shadow={false} />)}
      {[-1, 1].map((sd) => <Cyl key={sd} rad={0.008} h={0.75} p={[cx + sd * 0.28, 0.42, z1 + 0.25]} r={[0.95, 0, 0]} c="#2b2a2e" shadow={false} />)}

      {/* Curtain walls with crenellations (front wall leaves room for the gatehouse) */}
      <Walls x={x0} z={z0} w={x1 - x0} d={T} h={H} c={STONE} map={stone} per={0.8} />
      <Walls x={x0} z={z0} w={T} d={z1 - z0} h={H} c={STONE} map={stone} per={0.8} />
      <Walls x={x1 - T} z={z0} w={T} d={z1 - z0} h={H} c={STONE} map={stone} per={0.8} />
      <Walls x={x0} z={z1 - T} w={cx - 0.75 - x0} d={T} h={H} c={STONE} map={stone} per={0.8} />
      <Walls x={cx + 0.75} z={z1 - T} w={x1 - cx - 0.75} d={T} h={H} c={STONE} map={stone} per={0.8} />
      <Merlons x0={x0} z0={z0 + T / 2} x1={x1} z1={z0 + T / 2} y={H} />
      <Merlons x0={x0 + T / 2} z0={z0} x1={x0 + T / 2} z1={z1} y={H} />
      <Merlons x0={x1 - T / 2} z0={z0} x1={x1 - T / 2} z1={z1} y={H} />
      <Merlons x0={x0} z0={z1 - T / 2} x1={cx - 0.75} z1={z1 - T / 2} y={H} />
      <Merlons x0={cx + 0.75} z0={z1 - T / 2} x1={x1} z1={z1 - T / 2} y={H} />
      {/* heraldic banners on the front wall */}
      {[x0 + 0.9, x1 - 0.9].map((x) => (
        <group key={x}>
          <Box s={[0.32, 0.55, 0.015]} p={[x, 0.55, z1 + 0.01]} c={RED} shadow={false} />
          <Box s={[0.06, 0.55, 0.017]} p={[x, 0.55, z1 + 0.012]} c={GOLD} shadow={false} />
          <Box s={[0.36, 0.03, 0.03]} p={[x, 0.84, z1 + 0.02]} c={WOOD} />
        </group>
      ))}

      {/* Corner towers */}
      <Tower x={x0 + 0.1} z={z0 + 0.1} h={1.55} rad={0.48} flag={RED} />
      <Tower x={x1 - 0.1} z={z0 + 0.1} h={1.55} rad={0.48} flag={GOLD} />
      <Tower x={x0 + 0.1} z={z1 - 0.1} h={1.45} rad={0.48} flag={GOLD} />
      <Tower x={x1 - 0.1} z={z1 - 0.1} h={1.45} rad={0.48} flag={RED} />

      {/* Gatehouse: twin square towers, arch, portcullis, lanterns and the house arms above */}
      {[-1, 1].map((sd) => (
        <group key={sd}>
          <Walls x={cx + sd * 0.62 - 0.32} z={z1 - 0.52} w={0.64} d={0.64} h={1.35} c={STONE} map={stone} per={0.8} />
          <Merlons x0={cx + sd * 0.62 - 0.32} z0={z1 + 0.1} x1={cx + sd * 0.62 + 0.32} z1={z1 + 0.1} y={1.35} t={0.1} />
          <Merlons x0={cx + sd * 0.62 + sd * 0.3} z0={z1 - 0.52} x1={cx + sd * 0.62 + sd * 0.3} z1={z1 + 0.12} y={1.35} t={0.1} />
          <Box s={[0.05, 0.2, 0.02]} p={[cx + sd * 0.62, 0.85, z1 + 0.125]} c="#2b2a2e" shadow={false} />
          <mesh position={[cx + sd * 0.38, 0.62, z1 + 0.16]} material={lampBulb}><boxGeometry args={[0.07, 0.1, 0.07]} /></mesh>
        </group>
      ))}
      <Walls x={cx - 0.3} z={z1 - 0.52} w={0.6} d={0.64} h={0.4} y0={0.75} c={STONE} map={stone} per={0.8} />
      <Box s={[gate, 0.75, 0.05]} p={[cx, 0.375, z1 - 0.2]} c="#2a2420" />
      {/* portcullis, half raised */}
      {[-0.24, -0.12, 0, 0.12, 0.24].map((u) => <Box key={u} s={[0.025, 0.5, 0.025]} p={[cx + u, 0.55, z1 + 0.05]} c="#2b2a2e" o={{ metal: 0.5, rough: 0.4 }} shadow={false} />)}
      {[0.4, 0.55, 0.7].map((y) => <Box key={y} s={[gate - 0.02, 0.025, 0.025]} p={[cx, y, z1 + 0.05]} c="#2b2a2e" o={{ metal: 0.5, rough: 0.4 }} shadow={false} />)}
      <Box s={[0.34, 0.4, 0.03]} p={[cx, 0.98, z1 + 0.135]} c={RED} shadow={false} />
      <Ball rad={0.07} p={[cx, 1.0, z1 + 0.16]} c={GOLD} o={{ metal: 0.6, rough: 0.3 }} />

      {/* The keep: stone block with lit windows, turrets on each corner and the great standard */}
      <Walls x={kx} z={kz} w={kw} d={kd} h={KH} c={STONE} map={stone} per={0.8} />
      <Box s={[kw + 0.08, 0.08, kd + 0.08]} p={[cx, KH + 0.04, kz + kd / 2]} c={STONE_D} />
      <Merlons x0={kx} z0={kz + kd} x1={kx + kw} z1={kz + kd} y={KH + 0.08} t={0.12} />
      <Merlons x0={kx} z0={kz} x1={kx + kw} z1={kz} y={KH + 0.08} t={0.12} />
      <Merlons x0={kx} z0={kz} x1={kx} z1={kz + kd} y={KH + 0.08} t={0.12} />
      <Merlons x0={kx + kw} z0={kz} x1={kx + kw} z1={kz + kd} y={KH + 0.08} t={0.12} />
      {[0.7, 1.15, 1.6].map((y, row) => [0.45, 1.15, 1.85].map((u) => <Window key={`${y}${u}`} f={S} u={u} v={y} w={0.16} h={row === 2 ? 0.26 : 0.22} frame={STONE_D} lit={row !== 0} />))}
      {[0.6, 1.2].map((u) => <Window key={u} f={Wf} u={u} v={1.4} w={0.14} h={0.22} frame={STONE_D} />)}
      <Box s={[0.5, 0.62, 0.04]} p={[cx, 0.31, kz + kd + 0.02]} c="#3a2a1e" />
      <Box s={[0.6, 0.06, 0.08]} p={[cx, 0.66, kz + kd + 0.04]} c={STONE_D} />
      {[[kx, kz], [kx + kw, kz], [kx, kz + kd], [kx + kw, kz + kd]].map(([x, z], i) => (
        <group key={i}>
          <Cyl rad={0.17} h={0.55} p={[x!, KH + 0.3, z!]} c={STONE} />
          <Cone rad={0.2} h={0.4} p={[x!, KH + 0.78, z!]} c={SLATE} />
        </group>
      ))}
      <Cyl rad={0.015} h={0.8} p={[cx, KH + 0.48, kz + kd / 2]} c="#2b2a2e" shadow={false} />
      <Box s={[0.5, 0.3, 0.012]} p={[cx + 0.25, KH + 0.7, kz + kd / 2]} c={RED} shadow={false} />
      <Box s={[0.5, 0.06, 0.014]} p={[cx + 0.25, KH + 0.7, kz + kd / 2]} c={GOLD} shadow={false} />
      <Box s={[kw * 0.6, 0.5, kd * 0.6]} p={[cx, KH + 0.08 + 0.25, kz + kd / 2]} c={shade(c.roof, 0.05)} />

      {/* Courtyard life: a well, a hay cart, braziers by the inner gate, training dummy */}
      <group position={[x0 + 0.9, 0, z1 - 1.0]}>
        <Cyl rad={0.2} h={0.25} p={[0, 0.125, 0]} c={STONE_D} />
        <Cyl rad={0.16} h={0.02} p={[0, 0.24, 0]} c="#2f5d7a" />
        {[-0.17, 0.17].map((u) => <Box key={u} s={[0.03, 0.42, 0.03]} p={[u, 0.38, 0]} c={WOOD} />)}
        <Box s={[0.5, 0.04, 0.34]} p={[0, 0.62, 0]} r={[0, 0, 0]} c={shade(c.roof, -0.05)} />
      </group>
      <group position={[x1 - 1.0, 0, z1 - 1.05]}>
        <Box s={[0.6, 0.2, 0.36]} p={[0, 0.2, 0]} c={WOOD} />
        {[-0.25, 0.25].map((u) => <Cyl key={u} rad={0.11} h={0.03} p={[u, 0.11, 0.2]} r={[Math.PI / 2, 0, 0]} c="#4a3220" />)}
        <Box s={[0.5, 0.14, 0.3]} p={[0, 0.36, 0]} c="#d9c27a" o={{ rough: 1 }} />
      </group>
      {[-1, 1].map((sd) => (
        <group key={sd} position={[cx + sd * 0.55, 0, z1 - 0.75]}>
          <Cyl rad={0.03} h={0.3} p={[0, 0.15, 0]} c="#2b2a2e" />
          <Cyl rad={0.08} h={0.06} p={[0, 0.32, 0]} c="#2b2a2e" />
          <mesh position={[0, 0.38, 0]} material={lampBulb}><sphereGeometry args={[0.06, 8, 6]} /></mesh>
        </group>
      ))}
      <group position={[x0 + 0.85, 0, z0 + 0.9]}>
        <Cyl rad={0.02} h={0.5} p={[0, 0.25, 0]} c={WOOD} />
        <Box s={[0.3, 0.03, 0.03]} p={[0, 0.4, 0]} c={WOOD} />
        <Ball rad={0.07} p={[0, 0.55, 0]} c="#d9c27a" />
      </group>
      {/* roof tiles texture keeps the keep's top visible under the oblique camera */}
      <mesh position={[cx, KH + 0.335, kz + kd / 2]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[kw * 0.6, kd * 0.6]} /><meshStandardMaterial map={roofTileTexture()} color={SLATE} roughness={0.8} /></mesh>
    </group>
  );
}
