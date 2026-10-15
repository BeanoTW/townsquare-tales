import { useMemo } from "react";
import * as THREE from "three";
import { LAMPS, TREES, type B } from "@/lib/town-world";
import { STREET_OBJECTS } from "@/lib/street-life";
import { GANG_SPOT } from "@/lib/street-gang";
import { PARK_KID_SPOT } from "@/lib/park-kid";
import { townColor, shade } from "@/components/town3d/palette";
import { Ball, Billboard, Box, Cone, Cyl, Flat, Round, darkGlass, lampBulb, litGlass, mat } from "@/components/town3d/kit";
import { soilTexture } from "@/components/town3d/textures";

/** Trees and lamps whose base sits inside a building footprint are hidden on the classic map too. */
export function propsOutside(bs: B[]) {
  const inside = (x: number, y: number) => bs.some((b) => x > b.x - 0.15 && x < b.x + b.w + 0.15 && y > b.y - 0.15 && y < b.y + b.d + 0.15);
  return { trees: TREES.filter(([x, y]) => !inside(x, y)), lamps: LAMPS.filter(([x, y]) => !inside(x, y)) };
}

const canopyGeo = new THREE.SphereGeometry(1, 14, 10);

export function Trees({ bs }: { bs: B[] }) {
  const leaf = townColor("var(--town-leaf)");
  const light = townColor("var(--town-leaf-light)");
  const trunk = townColor("var(--town-tree-trunk)");
  const { trees } = useMemo(() => propsOutside(bs), [bs]);
  const leafMat = mat(leaf, { rough: 0.95 });
  const lightMat = mat(light, { rough: 0.95 });
  return (
    <group>
      {trees.map(([x, z], i) => {
        const s = 0.9 + ((i * 37) % 7) / 20;
        return (
          <group key={i} position={[x, 0, z]} scale={[s, s, s]}>
            <Cyl rad={0.055} h={0.7} p={[0, 0.35, 0]} c={trunk} o={{ rough: 0.9 }} />
            <mesh geometry={canopyGeo} position={[0, 0.98, 0]} scale={[0.4, 0.36, 0.4]} material={leafMat} castShadow receiveShadow />
            <mesh geometry={canopyGeo} position={[-0.16, 1.12, 0.1]} scale={[0.26, 0.24, 0.26]} material={lightMat} castShadow receiveShadow />
            <mesh geometry={canopyGeo} position={[0.18, 0.86, 0.12]} scale={[0.26, 0.22, 0.26]} material={leafMat} castShadow receiveShadow />
          </group>
        );
      })}
    </group>
  );
}

/** Lamp positions actually drawn (used for night light pools too). */
export const lampPositions = (bs: B[]) => propsOutside(bs).lamps;

export function Lamps({ bs }: { bs: B[] }) {
  const post = townColor("var(--town-lamp-post)");
  const lamps = useMemo(() => lampPositions(bs), [bs]);
  return (
    <group>
      {lamps.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <Cyl rad={0.045} h={0.08} p={[0, 0.04, 0]} c={post} o={{ metal: 0.4, rough: 0.5 }} />
          <Cyl rad={0.022} h={1.42} p={[0, 0.71, 0]} c={post} o={{ metal: 0.4, rough: 0.5 }} />
          <Box s={[0.035, 0.03, 0.26]} p={[0, 1.4, 0.11]} c={post} o={{ metal: 0.4, rough: 0.5 }} />
          <Round s={[0.14, 0.07, 0.14]} p={[0, 1.38, 0.22]} c={post} rad={0.03} o={{ metal: 0.4, rough: 0.5 }} />
          <mesh geometry={bulbGeo} position={[0, 1.335, 0.22]} scale={[0.055, 0.03, 0.055]} material={lampBulb} />
        </group>
      ))}
    </group>
  );
}
const bulbGeo = new THREE.SphereGeometry(1, 12, 8);

/** Street furniture and park features, one model per interactive object. */
export function StreetFurniture() {
  return (
    <group>
      {STREET_OBJECTS.map((o) => {
        switch (o.kind) {
          case "bench": return <Bench key={o.id} x={o.x} z={o.y} along="z" />;
          case "bin": return <Bin key={o.id} x={o.x} z={o.y} />;
          case "newspaper": return <NewsBox key={o.id} x={o.x} z={o.y} />;
          case "litter": return <Litter key={o.id} x={o.x} z={o.y} />;
          case "vending": return <Vending key={o.id} x={o.x} z={o.y} facing="w" />;
          case "ramp": return <Ramp key={o.id} x={o.x} z={o.y} />;
          case "hoop": return <Hoop key={o.id} x={o.x} z={o.y} />;
          case "hide": return <Bushes key={o.id} x={o.x} z={o.y} />;
          default: return null;
        }
      })}
      <Bicycle x={11.4} z={18} />
      <GangHangout />
      <Bench x={PARK_KID_SPOT.x} z={PARK_KID_SPOT.y - 0.05} along="x" />
    </group>
  );
}

export function Bench({ x, z, along }: { x: number; z: number; along: "x" | "z" }) {
  const wood = "#9c6b45";
  const iron = "#33363b";
  // Seat faces the road (east) for a z-aligned bench, the viewer (south) for an x-aligned one.
  const rot = along === "z" ? Math.PI / 2 : 0;
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      {[-0.035, 0.035].map((dz) => <Box key={dz} s={[0.62, 0.025, 0.06]} p={[0, 0.17, dz]} c={wood} o={{ rough: 0.8 }} />)}
      {[0.22, 0.3].map((y) => <Box key={y} s={[0.62, 0.05, 0.02]} p={[0, y, -0.08]} c={wood} o={{ rough: 0.8 }} />)}
      {[-0.26, 0.26].map((dx) => (
        <group key={dx}>
          <Box s={[0.03, 0.17, 0.14]} p={[dx, 0.085, 0]} c={iron} o={{ metal: 0.5, rough: 0.4 }} />
          <Box s={[0.03, 0.18, 0.03]} p={[dx, 0.24, -0.08]} c={iron} o={{ metal: 0.5, rough: 0.4 }} />
        </group>
      ))}
    </group>
  );
}

function Bin({ x, z }: { x: number; z: number }) {
  const c = townColor("var(--town-bin)");
  return (
    <group position={[x, 0, z]}>
      <Cyl rad={0.1} h={0.28} p={[0, 0.14, 0]} c={c} o={{ rough: 0.6 }} />
      <Cyl rad={0.115} h={0.04} p={[0, 0.3, 0]} c={shade(c, -0.2)} o={{ rough: 0.5 }} />
      <Box s={[0.08, 0.03, 0.02]} p={[0, 0.26, 0.1]} c="#2b2a2e" />
    </group>
  );
}

function NewsBox({ x, z }: { x: number; z: number }) {
  const c = townColor("var(--town-vending)");
  return (
    <group position={[x, 0, z]}>
      {[-0.08, 0.08].map((dx) => <Box key={dx} s={[0.025, 0.12, 0.025]} p={[dx, 0.06, 0]} c="#3a3d42" />)}
      <Round s={[0.24, 0.26, 0.2]} p={[0, 0.25, 0]} c={c} rad={0.03} o={{ rough: 0.5 }} />
      <Box s={[0.17, 0.11, 0.01]} p={[0, 0.29, 0.1]} m={darkGlass} shadow={false} />
      <Box s={[0.14, 0.08, 0.008]} p={[0, 0.28, 0.105]} c="#efe9d9" shadow={false} />
    </group>
  );
}

function Litter({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Ball rad={0.035} p={[0, 0.035, 0]} c="#f2eee4" o={{ rough: 0.9 }} />
      <Box s={[0.08, 0.004, 0.05]} p={[0.07, 0.004, 0.04]} r={[0, 0.6, 0]} c="#f2eee4" shadow={false} />
    </group>
  );
}

function Vending({ x, z, facing, broken = false }: { x: number; z: number; facing: "w" | "s"; broken?: boolean }) {
  const c = townColor("var(--town-vending)");
  return (
    <group position={[x, 0, z]} rotation={[0, facing === "w" ? -Math.PI / 2 : 0, broken ? 0.12 : 0]}>
      <Round s={[0.34, 0.6, 0.26]} p={[0, 0.3, 0]} c={c} rad={0.03} o={{ rough: 0.45 }} />
      <Box s={[0.18, 0.36, 0.01]} p={[-0.05, 0.36, 0.132]} m={broken ? darkGlass : litGlass} shadow={false} />
      {[0.26, 0.36, 0.46].map((y, i) => <Box key={y} s={[0.14, 0.03, 0.012]} p={[-0.05, y, 0.14]} c={["#e94b4b", "#4bb3e9", "#f2c846"][i]!} shadow={false} />)}
      <Box s={[0.06, 0.12, 0.012]} p={[0.11, 0.38, 0.135]} c="#2b2a2e" shadow={false} />
      <Box s={[0.2, 0.05, 0.012]} p={[-0.03, 0.1, 0.135]} c="#1d1d20" shadow={false} />
    </group>
  );
}

function Ramp({ x, z }: { x: number; z: number }) {
  const geo = useMemo(() => {
    const s = new THREE.Shape();
    s.moveTo(0, 0);
    s.lineTo(0.7, 0);
    s.lineTo(0.7, 0.32);
    s.quadraticCurveTo(0.42, 0.06, 0, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.8, bevelEnabled: false, curveSegments: 10 });
    g.translate(-0.35, 0, -0.4);
    return g;
  }, []);
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={geo} material={mat("#b9b5ac", { rough: 0.85 })} castShadow receiveShadow />
      <Box s={[0.04, 0.32, 0.8]} p={[0.37, 0.16, 0]} c="#8d8a83" />
      <Billboard p={[0.05, 0.12, 0.405]} w={0.4} h={0.1} text="NO FUTURE" bg="#b9b5ac" fg="#d94a8c" border="#b9b5ac" />
    </group>
  );
}

const torus = new THREE.TorusGeometry(1, 0.12, 8, 20);
function Hoop({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Cyl rad={0.03} h={1.05} p={[0, 0.525, -0.08]} c="#4a4f55" o={{ metal: 0.5, rough: 0.4 }} />
      <Box s={[0.4, 0.28, 0.02]} p={[0, 1.0, -0.04]} c="#f4efe4" o={{ rough: 0.4 }} />
      <Box s={[0.16, 0.11, 0.022]} p={[0, 0.94, -0.039]} c="#d94a52" shadow={false} />
      <mesh geometry={torus} position={[0, 0.88, 0.06]} rotation={[Math.PI / 2, 0, 0]} scale={0.085} material={mat("#e8743b", { rough: 0.5, metal: 0.3 })} castShadow />
      <Cone rad={0.08} h={0.12} p={[0, 0.82, 0.06]} r={[Math.PI, 0, 0]} c="#ffffff" o={{ opacity: 0.55 }} />
      <Ball rad={0.06} p={[0.25, 0.06, 0.25]} c="#e8743b" o={{ rough: 0.7 }} />
    </group>
  );
}

function Bushes({ x, z }: { x: number; z: number }) {
  const c = townColor("var(--town-park)");
  const d = shade(c, -0.25);
  return (
    <group position={[x, 0, z]}>
      <mesh geometry={canopyGeo} position={[-0.25, 0.2, 0]} scale={[0.32, 0.26, 0.3]} material={mat(d, { rough: 1 })} castShadow receiveShadow />
      <mesh geometry={canopyGeo} position={[0.0, 0.26, -0.05]} scale={[0.36, 0.32, 0.34]} material={mat(shade(c, -0.15), { rough: 1 })} castShadow receiveShadow />
      <mesh geometry={canopyGeo} position={[0.28, 0.2, 0.02]} scale={[0.3, 0.25, 0.3]} material={mat(d, { rough: 1 })} castShadow receiveShadow />
    </group>
  );
}

const wheel = new THREE.TorusGeometry(1, 0.13, 6, 18);
function Bicycle({ x, z }: { x: number; z: number }) {
  const frame = "#2f6fb3";
  return (
    <group position={[x, 0, z]}>
      {[-0.17, 0.17].map((dx) => <mesh key={dx} geometry={wheel} position={[dx, 0.1, 0]} scale={0.095} material={mat("#232427", { rough: 0.6 })} castShadow />)}
      <Box s={[0.3, 0.018, 0.018]} p={[0, 0.18, 0]} c={frame} />
      <Box s={[0.018, 0.13, 0.018]} p={[-0.07, 0.15, 0]} r={[0, 0, 0.3]} c={frame} />
      <Box s={[0.018, 0.14, 0.018]} p={[0.15, 0.15, 0]} r={[0, 0, -0.25]} c={frame} />
      <Box s={[0.07, 0.02, 0.04]} p={[-0.09, 0.23, 0]} c="#1d1d20" />
      <Box s={[0.02, 0.02, 0.14]} p={[0.17, 0.24, 0]} c="#1d1d20" />
    </group>
  );
}

/** The gang's corner: a scavenged bench, an overflowing bin and a dead vending machine. */
function GangHangout() {
  const { x, y: z } = GANG_SPOT;
  return (
    <group>
      <Box s={[0.6, 0.04, 0.18]} p={[x - 0.42, 0.16, z + 0.05]} c="#846b53" o={{ rough: 0.9 }} />
      {[-0.66, -0.18].map((dx) => <Box key={dx} s={[0.14, 0.14, 0.16]} p={[x + dx, 0.07, z + 0.05]} c="#b38b5f" o={{ rough: 0.95 }} />)}
      <group position={[x - 1.15, 0, z + 0.1]}>
        <Cyl rad={0.12} h={0.3} p={[0, 0.15, 0]} c={townColor("var(--town-bin)")} o={{ rough: 0.6 }} />
        {[[0.03, 0.33, 0.02], [-0.05, 0.32, -0.03]].map(([a, y, c], i) => <Ball key={i} rad={0.05} p={[a!, y!, c!]} c={i ? "#2d2d2d" : "#e6e1d3"} />)}
      </group>
      <Vending x={x + 1.05} z={z - 0.15} facing="s" broken />
      <Round s={[0.62, 0.06, 0.32]} p={[x + 0.63, 0.03, z + 0.05]} c="#8a7a6a" rad={0.03} />
    </group>
  );
}

/* ------------------------------------------------------------------ construction site (static parts) */

export const SITE = { x: 16.1, z: 15.3, w: 6.0, d: 9.2 } as const;

export function ConstructionStatic() {
  const soil = soilTexture();
  const { x, z, w, d } = SITE;
  const fence = mat("#a8adb1", { rough: 0.5, metal: 0.3, opacity: 0.4 });
  const fenceRuns: [number, number, number, number][] = [[x, z, x + w, z], [x, z, x, z + d], [x + w, z, x + w, z + d], [x, z + d, 17.6, z + d], [18.8, z + d, x + w, z + d]];
  return (
    <group>
      <Flat x={x} z={z} w={w} d={d} y={0.016} c="#c9b998" map={soil} per={2.2} />
      <Flat x={16.3} z={15.6} w={3.4} d={5.2} y={0.017} c="#b5a888" map={soil} per={2.2} />
      <Flat x={19.8} z={16.1} w={2.0} d={2.8} y={0.017} c="#d3c7ad" map={soil} per={2.2} />
      {/* Temporary fencing with a pedestrian gate on the south side */}
      {fenceRuns.map(([ax, az, bx, bz], i) => {
        const len = Math.hypot(bx - ax, bz - az);
        const along = Math.abs(bx - ax) > Math.abs(bz - az) ? "x" : "z";
        const n = Math.max(1, Math.round(len / 0.75));
        return Array.from({ length: n }, (_, k) => {
          const t0 = k / n, t1 = (k + 1) / n, cx = ax + (bx - ax) * (t0 + t1) / 2, cz = az + (bz - az) * (t0 + t1) / 2, pl = len / n;
          return (
            <group key={`${i}-${k}`}>
              <mesh geometry={unit} position={[cx, 0.24, cz]} scale={along === "x" ? [pl - 0.03, 0.4, 0.012] : [0.012, 0.4, pl - 0.03]} material={fence} />
              <Box s={along === "x" ? [pl, 0.02, 0.02] : [0.02, 0.02, pl]} p={[cx, 0.45, cz]} c="#9ea3a7" o={{ metal: 0.5 }} />
              <Box s={[0.12, 0.05, 0.12]} p={[ax + (bx - ax) * t0, 0.025, az + (bz - az) * t0]} c="#e1ac49" />
              <Cyl rad={0.012} h={0.45} p={[ax + (bx - ax) * t0, 0.24, az + (bz - az) * t0]} c="#9ea3a7" o={{ metal: 0.5 }} />
            </group>
          );
        });
      })}
      {/* Excavated foundations and the steel frame going up */}
      <Flat x={16.5} z={17.5} w={2.8} d={2.7} y={0.019} c="#6d706b" rough={0.95} />
      <Box s={[2.2, 0.06, 2.1]} p={[17.9, 0.05, 18.85]} c="#9b9d98" o={{ rough: 0.95 }} />
      {[[16.8, 17.8], [19.0, 17.8], [16.8, 19.9], [19.0, 19.9]].map(([cx, cz], i) => <Box key={i} s={[0.08, 1.9, 0.08]} p={[cx!, 0.08 + 0.95, cz!]} c="#7f8b90" o={{ metal: 0.6, rough: 0.45 }} />)}
      {[1.0, 1.9].map((y) => (
        <group key={y}>
          <Box s={[2.28, 0.07, 0.07]} p={[17.9, y, 17.8]} c="#8a969b" o={{ metal: 0.6, rough: 0.45 }} />
          <Box s={[2.28, 0.07, 0.07]} p={[17.9, y, 19.9]} c="#8a969b" o={{ metal: 0.6, rough: 0.45 }} />
          <Box s={[0.07, 0.07, 2.18]} p={[16.8, y, 18.85]} c="#8a969b" o={{ metal: 0.6, rough: 0.45 }} />
          <Box s={[0.07, 0.07, 2.18]} p={[19.0, y, 18.85]} c="#8a969b" o={{ metal: 0.6, rough: 0.45 }} />
        </group>
      ))}
      {/* Scaffold along the south face: poles, a timber deck and bracing */}
      {[16.5, 17.43, 18.37, 19.3].map((px) => [20.2, 20.5].map((pz) => <Cyl key={`${px}${pz}`} rad={0.015} h={1.5} p={[px, 0.75, pz]} c="#c9b28a" o={{ metal: 0.3 }} />))}
      <Box s={[2.85, 0.03, 0.34]} p={[17.9, 0.9, 20.35]} c="#c79a5c" o={{ rough: 0.85 }} />
      <Box s={[2.85, 0.018, 0.018]} p={[17.9, 1.2, 20.52]} c="#d0c3a7" />
      <Box s={[3.0, 0.016, 0.016]} p={[17.9, 0.5, 20.52]} r={[0, 0, 0.32]} c="#a8b1b0" />
      {/* Second building at foundation stage with pile caps */}
      <Box s={[1.7, 0.05, 2.2]} p={[20.75, 0.04, 20.3]} c="#c8c0b3" o={{ rough: 0.95 }} />
      {[[20.1, 19.4], [21.4, 19.4], [20.1, 21.2], [21.4, 21.2]].map(([px, pz], i) => <Cyl key={i} rad={0.1} h={0.12} p={[px!, 0.1, pz!]} c="#8f9592" />)}
      {/* Crane base */}
      <Box s={[0.8, 0.22, 0.8]} p={[18.9, 0.11, 16.9]} c="#7c7765" o={{ rough: 0.9 }} />
      {/* Dumper truck */}
      <group position={[20.4, 0, 17.1]}>
        <Round s={[0.8, 0.22, 0.5]} p={[0, 0.2, 0]} c="#d2a033" rad={0.05} o={{ rough: 0.6 }} />
        <Box s={[0.42, 0.24, 0.48]} p={[-0.18, 0.42, 0]} r={[0, 0, 0.18]} c="#80694c" o={{ rough: 0.8 }} />
        <Round s={[0.22, 0.24, 0.42]} p={[0.25, 0.43, 0]} c="#d2a033" rad={0.04} />
        <Box s={[0.012, 0.16, 0.34]} p={[0.365, 0.45, 0]} m={darkGlass} shadow={false} />
        {[[-0.25, 0.26], [0.25, 0.26], [-0.25, -0.26], [0.25, -0.26]].map(([a, c], i) => <Cyl key={i} rad={0.1} h={0.08} p={[a!, 0.1, c!]} r={[Math.PI / 2, 0, 0]} c="#2a3032" />)}
      </group>
      {/* Pallets, bricks, pipes, cones and the access sign */}
      {[0, 1, 2].map((i) => <Box key={"pl" + i} s={[0.28, 0.06, 0.28]} p={[16.75 + i * 0.34, 0.03, 21.5]} c="#b88b62" o={{ rough: 0.9 }} />)}
      {[17.1, 17.4, 17.7].map((px) => <Box key={"br" + px} s={[0.24, 0.16, 0.2]} p={[px, 0.09, 22.1]} c="#b5634b" o={{ rough: 0.9 }} />)}
      {[[19.6, 23.8], [21.4, 22.3]].map(([px, pz], i) => (
        <group key={"pp" + i} position={[px!, 0, pz!]}>
          {[[-0.11, 0.06], [0, 0.06], [0.11, 0.06], [-0.055, 0.155], [0.055, 0.155]].map(([dx, y], k) => <Cyl key={k} rad={0.055} h={0.7} p={[dx!, y!, 0]} r={[Math.PI / 2, 0, 0]} c="#8e9b9b" o={{ metal: 0.4, rough: 0.4 }} />)}
        </group>
      ))}
      {[[17.7, 24.3], [18.8, 24.3], [21.7, 23.3]].map(([px, pz], i) => (
        <group key={"cn" + i} position={[px!, 0, pz!]}>
          <Box s={[0.12, 0.015, 0.12]} p={[0, 0.008, 0]} c="#3a3a3a" />
          <Cone rad={0.05} h={0.2} p={[0, 0.11, 0]} c="#e78336" o={{ rough: 0.6 }} />
          <Cyl rad={0.033} h={0.03} p={[0, 0.12, 0]} c="#f2e9d3" />
        </group>
      ))}
      <Billboard p={[18.1, 0.55, 24.42]} w={0.95} h={0.22} text="SITE ACCESS" bg="#f1d9a5" fg="#34363c" posts={0.44} />
      <Flat x={16.6} z={21.5} w={2.4} d={2.6} y={0.018} c="#cdbb96" map={soil} per={2.2} />
      <mesh geometry={unit} position={[17.2, 0.08, 23.2]} scale={[0.9, 0.1, 0.06]} material={mat("#eab74c", { rough: 0.6 })} castShadow />
      {[16.95, 17.45].map((px) => <Box key={px} s={[0.1, 0.1, 0.065]} p={[px, 0.08, 23.2]} c="#393c3c" />)}
    </group>
  );
}
const unit = new THREE.BoxGeometry(1, 1, 1);

