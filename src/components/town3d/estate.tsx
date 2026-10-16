import { useMemo } from "react";
import { ESTATE } from "@/lib/town-world";
import { Ball, Box, Cone, Cyl, Disc, Flat, Hedge, lampBulb, mat } from "@/components/town3d/kit";
import { grassTexture, gravelTexture, pavingTexture } from "@/components/town3d/textures";

/**
 * The mansion estate: everything between the road end and the house, and the land to its north and south,
 * becomes a walled park. A stone wall with piers and iron railings runs right round it, broken only by the
 * gated drive; inside are tree lines, a formal fountain garden with a gazebo, a gravel forecourt and a
 * pool garden with an orchard and glasshouse. All static, so it is batched with the rest of the town.
 */
const STONE = "#d9cfbd";
const CAP = "#efe8da";
const IRON = "#26292b";
const GOLD = "#c7a65b";
const LEAF = "#3f7a3a";
const LEAF_L = "#5a9446";

/** One straight run of wall: stone base, piers with gold finials every ~1.2, railings between. */
function WallRun({ a, b }: { a: [number, number]; b: [number, number] }) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const along = dx !== 0;
  const piers = Math.max(1, Math.round(len / 1.2));
  const at = (t: number): [number, number] => [a[0] + dx * t, a[1] + dz * t];
  const bars = Math.floor(len / 0.14);
  return (
    <group>
      <Box s={along ? [len, 0.2, 0.14] : [0.14, 0.2, len]} p={[a[0] + dx / 2, 0.1, a[1] + dz / 2]} c={STONE} o={{ rough: 0.95 }} />
      <Box s={along ? [len, 0.035, 0.18] : [0.18, 0.035, len]} p={[a[0] + dx / 2, 0.215, a[1] + dz / 2]} c={CAP} />
      {/* railings */}
      <Box s={along ? [len, 0.02, 0.02] : [0.02, 0.02, len]} p={[a[0] + dx / 2, 0.44, a[1] + dz / 2]} c={IRON} o={{ metal: 0.6, rough: 0.35 }} shadow={false} />
      {Array.from({ length: bars }, (_, i) => {
        const [x, z] = at((i + 0.5) / bars);
        return <Box key={i} s={[0.014, 0.22, 0.014]} p={[x, 0.34, z]} c={IRON} o={{ metal: 0.6, rough: 0.35 }} shadow={false} />;
      })}
      {Array.from({ length: piers + 1 }, (_, i) => {
        const [x, z] = at(i / piers);
        return (
          <group key={`p${i}`}>
            <Box s={[0.2, 0.5, 0.2]} p={[x, 0.25, z]} c={STONE} o={{ rough: 0.95 }} />
            <Box s={[0.24, 0.04, 0.24]} p={[x, 0.52, z]} c={CAP} />
            <Ball rad={0.045} p={[x, 0.58, z]} c={GOLD} o={{ metal: 0.6, rough: 0.3 }} />
          </group>
        );
      })}
    </group>
  );
}

function Cypress({ x, z, h = 1.4 }: { x: number; z: number; h?: number }) {
  return (
    <group>
      <Cyl rad={0.04} h={0.2} p={[x, 0.1, z]} c="#6b4a32" />
      <Cone rad={0.2} h={h} p={[x, 0.18 + h / 2, z]} c={LEAF} o={{ rough: 1 }} />
    </group>
  );
}
function RoundTree({ x, z, s = 1, fruit }: { x: number; z: number; s?: number; fruit?: string }) {
  return (
    <group position={[x, 0, z]} scale={[s, s, s]}>
      <Cyl rad={0.05} h={0.6} p={[0, 0.3, 0]} c="#6b4a32" />
      <Ball rad={0.36} p={[0, 0.82, 0]} c={LEAF} o={{ rough: 1 }} />
      <Ball rad={0.24} p={[0.18, 0.95, 0.1]} c={LEAF_L} o={{ rough: 1 }} />
      {fruit && [[0.22, 0.75, 0.22], [-0.2, 0.9, 0.18], [0.05, 0.7, -0.3], [-0.25, 0.68, -0.12]].map(([fx, fy, fz], i) => <Ball key={i} rad={0.04} p={[fx!, fy!, fz!]} c={fruit} shadow={false} />)}
    </group>
  );
}
function Bench({ x, z, ry }: { x: number; z: number; ry: number }) {
  return (
    <group position={[x, 0, z]} rotation={[0, ry, 0]}>
      <Box s={[0.5, 0.03, 0.14]} p={[0, 0.15, 0]} c="#f4efe4" />
      <Box s={[0.5, 0.14, 0.03]} p={[0, 0.24, -0.06]} c="#f4efe4" />
      {[-0.2, 0.2].map((dx) => <Box key={dx} s={[0.03, 0.15, 0.12]} p={[dx, 0.075, 0]} c={IRON} />)}
    </group>
  );
}
/** Flower bed edged in low box hedge, filled with blooms. */
function Parterre({ x0, z0, x1, z1, seed, colours }: { x0: number; z0: number; x1: number; z1: number; seed: number; colours: string[] }) {
  const blooms = useMemo(() => {
    const out: [number, number, number][] = [];
    let k = seed;
    const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 26; i++) out.push([x0 + 0.15 + rnd() * (x1 - x0 - 0.3), z0 + 0.15 + rnd() * (z1 - z0 - 0.3), Math.floor(rnd() * colours.length)]);
    return out;
  }, [x0, z0, x1, z1, seed, colours.length]);
  return (
    <group>
      <Flat x={x0} z={z0} w={x1 - x0} d={z1 - z0} y={0.009} c="#5d4a36" />
      <Hedge x={x0} z={z0} w={x1 - x0} d={0.09} h={0.1} c={LEAF} />
      <Hedge x={x0} z={z1 - 0.09} w={x1 - x0} d={0.09} h={0.1} c={LEAF} />
      <Hedge x={x0} z={z0} w={0.09} d={z1 - z0} h={0.1} c={LEAF} />
      <Hedge x={x1 - 0.09} z={z0} w={0.09} d={z1 - z0} h={0.1} c={LEAF} />
      {blooms.map(([x, z, c], i) => <Ball key={i} rad={0.05} p={[x, 0.06, z]} c={colours[c]!} shadow={false} />)}
    </group>
  );
}
function Fountain({ x, z }: { x: number; z: number }) {
  const water = useMemo(() => mat("#7cc4d8", { rough: 0.08, metal: 0.1 }), []);
  return (
    <group position={[x, 0, z]}>
      <Cyl rad={0.6} h={0.14} p={[0, 0.07, 0]} c={CAP} />
      <mesh position={[0, 0.142, 0]} rotation={[-Math.PI / 2, 0, 0]} material={water}><circleGeometry args={[0.53, 32]} /></mesh>
      <Cyl rad={0.07} h={0.42} p={[0, 0.28, 0]} c={CAP} />
      <Cyl rad={0.26} h={0.06} p={[0, 0.5, 0]} c={CAP} />
      <mesh position={[0, 0.534, 0]} rotation={[-Math.PI / 2, 0, 0]} material={water}><circleGeometry args={[0.22, 24]} /></mesh>
      <Cyl rad={0.03} h={0.2} p={[0, 0.64, 0]} c="#cfeaf2" o={{ opacity: 0.6 }} shadow={false} />
      <Ball rad={0.045} p={[0, 0.75, 0]} c="#e4f5fa" o={{ opacity: 0.7 }} shadow={false} />
    </group>
  );
}
function Gazebo({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl rad={0.5} h={0.06} p={[0, 0.03, 0]} c={CAP} />
      {Array.from({ length: 6 }, (_, i) => {
        const t = (i / 6) * Math.PI * 2;
        return <Cyl key={i} rad={0.025} h={0.5} p={[Math.cos(t) * 0.42, 0.31, Math.sin(t) * 0.42]} c="#ffffff" />;
      })}
      <Cyl rad={0.5} h={0.05} p={[0, 0.58, 0]} c="#ffffff" />
      <Cone rad={0.56} h={0.36} p={[0, 0.78, 0]} c="#4a6e8a" />
      <Ball rad={0.04} p={[0, 0.98, 0]} c={GOLD} o={{ metal: 0.6, rough: 0.3 }} />
      <Bench x={0} z={-0.18} ry={0} />
    </group>
  );
}
function GlassHouse({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box s={[1.0, 0.08, 1.5]} p={[0, 0.04, 0]} c="#b9a58a" />
      <Box s={[0.98, 0.45, 1.48]} p={[0, 0.3, 0]} c="#cfe6f2" o={{ opacity: 0.35, rough: 0.05 }} shadow={false} />
      {[-0.5, 0, 0.5].map((dz) => <Box key={dz} s={[1.0, 0.03, 0.03]} p={[0, 0.53, dz * 1.45]} c="#ffffff" shadow={false} />)}
      {[-0.49, 0.49].map((dx) => [-0.74, 0, 0.74].map((dz) => <Box key={`${dx}${dz}`} s={[0.03, 0.5, 0.03]} p={[dx, 0.3, dz]} c="#ffffff" shadow={false} />))}
      {[-1, 1].map((sd) => <Box key={sd} s={[0.56, 0.02, 1.5]} p={[sd * 0.25, 0.64, 0]} r={[0, 0, sd * -0.55]} c="#d8eef6" o={{ opacity: 0.45, rough: 0.05 }} shadow={false} />)}
      {[-0.25, 0.25].map((dx) => [-0.45, 0, 0.45].map((dz) => <Ball key={`${dx}${dz}`} rad={0.09} p={[dx, 0.18, dz]} c={LEAF_L} />))}
    </group>
  );
}
function Lounger({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Box s={[0.22, 0.04, 0.55]} p={[0, 0.1, 0]} c="#ffffff" />
      <Box s={[0.22, 0.04, 0.22]} p={[0, 0.17, -0.3]} r={[0.6, 0, 0]} c="#ffffff" />
      <Box s={[0.2, 0.02, 0.5]} p={[0, 0.13, 0.02]} c="#3d7aa8" />
    </group>
  );
}

export function EstateGrounds() {
  const { x0, z0, x1, z1, gate } = ESTATE;
  const grass = grassTexture(), gravel = gravelTexture(), paving = pavingTexture();
  const water = useMemo(() => mat("#3fb2cf", { rough: 0.06, metal: 0.1 }), []);
  const stripes = Math.floor((x1 - x0) / 0.55);
  return (
    <group>
      {/* Mown lawn with stripes across the whole estate */}
      <Flat x={x0} z={z0} w={x1 - x0} d={z1 - z0} y={0.0066} c="#6f9f4c" map={grass} per={1.2} />
      {Array.from({ length: stripes }, (_, i) => i % 2 === 0 && <Flat key={i} x={x0 + i * 0.55} z={z0} w={0.55} d={z1 - z0} y={0.0068} c="#7fb25a" map={grass} per={1.2} />)}

      {/* Perimeter: wall, piers and railings, broken only at the gate */}
      <WallRun a={[x0, z0]} b={[x0, gate[0]]} />
      <WallRun a={[x0, gate[1]]} b={[x0, z1]} />
      <WallRun a={[x0, z0]} b={[x1, z0]} />
      <WallRun a={[x0, z1]} b={[x1, z1]} />
      <WallRun a={[x1, z0]} b={[x1, z1]} />

      {/* Tree lines screening the north, south and east walls; an avenue of round trees by the gate */}
      {Array.from({ length: 9 }, (_, i) => <Cypress key={`n${i}`} x={x0 + 0.5 + i * 0.62} z={z0 + 0.38} h={1.25 + (i % 3) * 0.18} />)}
      {Array.from({ length: 20 }, (_, i) => <Cypress key={`e${i}`} x={x1 - 0.35} z={z0 + 0.95 + i * 0.7} h={1.35 + (i % 4) * 0.15} />)}
      {Array.from({ length: 8 }, (_, i) => <RoundTree key={`s${i}`} x={x0 + 0.55 + i * 0.66} z={z1 - 0.42} s={0.95 + (i % 3) * 0.1} />)}
      {[[x0 + 0.45, 3.9], [x0 + 0.45, 10.5]].map(([x, z], i) => <RoundTree key={`g${i}`} x={x!} z={z!} s={1.05} />)}

      {/* Gravel forecourt from the gate to the portico, with urns and lanterns */}
      <Flat x={x0 + 0.1} z={5.25} w={1.45} d={3.9} y={0.0075} c="#c8bba2" map={gravel} per={0.6} />
      <Flat x={x0 + 0.05} z={gate[0] + 0.05} w={0.3} d={gate[1] - gate[0] - 0.1} y={0.0078} c="#c8bba2" map={gravel} per={0.6} />
      {[[x0 + 0.55, 6.3], [x0 + 0.55, 8.1]].map(([x, z], i) => (
        <group key={`urn${i}`}>
          <Cyl rad={0.1} h={0.16} p={[x!, 0.08, z!]} c={CAP} />
          <Ball rad={0.14} p={[x!, 0.3, z!]} c={LEAF} o={{ rough: 1 }} />
        </group>
      ))}

      {/* North garden: gravel cross paths, three parterres, fountain, gazebo, benches and a rose arch */}
      <Flat x={x0 + 0.4} z={2.78} w={x1 - x0 - 1.0} d={0.28} y={0.0075} c="#cfc3aa" map={gravel} per={0.6} />
      <Flat x={32.8} z={1.0} w={0.28} d={3.6} y={0.0075} c="#cfc3aa" map={gravel} per={0.6} />
      <Parterre x0={30.75} z0={1.15} x1={32.6} z1={2.6} seed={3} colours={["#e05a7a", "#f4f1ea", "#e0b84a"]} />
      <Parterre x0={30.75} z0={3.25} x1={32.6} z1={4.55} seed={9} colours={["#c56ad9", "#f4f1ea", "#e05a4f"]} />
      <Parterre x0={33.3} z0={3.25} x1={35.3} z1={4.55} seed={17} colours={["#e05a4f", "#ffd24a", "#f4f1ea"]} />
      <Fountain x={32.94} z={2.92} />
      <Gazebo x={34.4} z={1.85} />
      <Bench x={32.3} z={3.05} ry={Math.PI / 2} />
      <Bench x={33.6} z={2.75} ry={-Math.PI / 2} />
      <group position={[32.94, 0, 4.6]}>
        {[-0.2, 0.2].map((dx) => <Cyl key={dx} rad={0.015} h={0.5} p={[dx, 0.25, 0]} c="#ffffff" shadow={false} />)}
        <Box s={[0.44, 0.04, 0.06]} p={[0, 0.5, 0]} c="#ffffff" shadow={false} />
        {[-0.18, -0.06, 0.06, 0.18].map((dx, i) => <Ball key={dx} rad={0.045} p={[dx, 0.54, 0]} c={i % 2 ? "#e05a7a" : "#f4a3b8"} shadow={false} />)}
      </group>

      {/* South garden: pool terrace with loungers and parasol, glasshouse, and an orchard */}
      <Flat x={30.85} z={11.45} w={3.6} d={2.65} y={0.0078} c="#efe6d2" map={paving} per={0.45} />
      <mesh position={[32.6, 0.012, 12.6]} rotation={[-Math.PI / 2, 0, 0]} material={water} receiveShadow><planeGeometry args={[2.8, 1.4]} /></mesh>
      <Box s={[2.9, 0.03, 0.06]} p={[32.6, 0.02, 11.88]} c={CAP} shadow={false} />
      <Box s={[2.9, 0.03, 0.06]} p={[32.6, 0.02, 13.32]} c={CAP} shadow={false} />
      {[31.17, 34.03].map((x) => <Box key={x} s={[0.06, 0.03, 1.5]} p={[x, 0.02, 12.6]} c={CAP} shadow={false} />)}
      {[31.6, 32.4, 33.2].map((x) => <Lounger key={x} x={x} z={13.75} />)}
      <group position={[34.05, 0, 13.75]}>
        <Cyl rad={0.012} h={0.6} p={[0, 0.3, 0]} c="#ffffff" shadow={false} />
        <Cone rad={0.36} h={0.14} p={[0, 0.62, 0]} c="#e05a4f" />
      </group>
      <GlassHouse x={35.0} z={12.5} />
      {[[30.9, 14.3], [31.75, 14.45], [34.6, 14.4]].map(([x, z], i) => <RoundTree key={`o${i}`} x={x!} z={z!} s={0.7} fruit={i === 1 ? "#e0b84a" : "#d94a3a"} />)}
      <Disc x={34.9} z={10.2} rx={0.35} rz={0.25} y={0.008} c="#5d4a36" />
      {[34.75, 35.0].map((x, i) => <Ball key={x} rad={0.06} p={[x, 0.06, 10.15 + i * 0.08]} c={i ? "#e0b84a" : "#e05a7a"} shadow={false} />)}

      {/* Lanterns on the drive-side piers glow after dark */}
      {[[x0 + 0.25, 5.4], [x0 + 0.25, 9.0]].map(([x, z], i) => (
        <group key={`lan${i}`}>
          <Cyl rad={0.02} h={0.62} p={[x!, 0.31, z!]} c={IRON} />
          <mesh position={[x!, 0.68, z!]} material={lampBulb}><boxGeometry args={[0.09, 0.12, 0.09]} /></mesh>
          <Cone rad={0.08} h={0.07} p={[x!, 0.77, z!]} c={IRON} />
        </group>
      ))}
    </group>
  );
}
