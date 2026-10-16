import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { Person, type PersonState } from "@/components/Character3D";
import { actFor } from "@/components/home3d/scenes/acts";
import { heldProps, WorldProps } from "@/components/home3d/scenes/props";
import { Ball, Box, Cone, Cyl, Group, Round } from "@/components/home3d/primitives";
import { Sign } from "@/components/home3d/venues/kit";
import { townColor } from "@/components/town3d/palette";
import type { StageSet, StageSpec } from "@/lib/scene-stage";
import "@/components/action-vignette.css";

/**
 * A small 3D set for the player to act on, outside any room: full-screen for life milestones,
 * card-sized for everyday actions on the town map. Uses the same acts and props as the in-world
 * cutscenes so the whole game shares one performance style.
 */
const SKIP = "tst-stage-skip";
const OUTRO = 0.45;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const c = clamp01(x); return c * c * (3 - 2 * c); };
const frozenT = () => (import.meta.env.DEV && typeof window !== "undefined" ? (window as { __TST_SCENE_T?: number }).__TST_SCENE_T : undefined);

type Look = { floor: string; wall: string; sky: [string, string]; light: string };
const LOOKS: Record<StageSet, Look> = {
  gym: { floor: "#3a3d42", wall: "#2f6a64", sky: ["#1f2a2f", "#3b4f55"], light: "#fff4e0" },
  park: { floor: "#6f9a52", wall: "#9cc7e0", sky: ["#bfe0f2", "#e9f5fb"], light: "#fff6dc" },
  bench: { floor: "#8fae6a", wall: "#a9d0e6", sky: ["#c6e3f2", "#eef7fb"], light: "#fff6dc" },
  bar: { floor: "#5a3a2a", wall: "#3a2232", sky: ["#1a1220", "#3a2232"], light: "#ffb36a" },
  bed: { floor: "#7d9cc4", wall: "#2c3550", sky: ["#121a33", "#2c3550"], light: "#c9d6ff" },
  desk: { floor: "#3b4f7a", wall: "#d9dfe6", sky: ["#c9d3dd", "#eef2f6"], light: "#ffffff" },
  casino: { floor: "#1f5a3e", wall: "#4a1f2a", sky: ["#170d14", "#3a1820"], light: "#ffd27a" },
  alley: { floor: "#4a4a4e", wall: "#6a3b30", sky: ["#141418", "#2e2a30"], light: "#e8d2a0" },
  counter: { floor: "#d9cdb4", wall: "#3c6660", sky: ["#e8e0cc", "#f6f0e0"], light: "#ffffff" },
  dancefloor: { floor: "#2a1f3a", wall: "#1a1226", sky: ["#0e0a18", "#2a1640"], light: "#ff7ad9" },
  clinic: { floor: "#c9ddd4", wall: "#e6f1ec", sky: ["#d8ebe3", "#f4faf7"], light: "#ffffff" },
  busstop: { floor: "#8a8f96", wall: "#a9cbe0", sky: ["#bcd9ec", "#eaf4fa"], light: "#fff6dc" },
  atm: { floor: "#d6d0c4", wall: "#2f5d4a", sky: ["#e4dfd2", "#f5f1e8"], light: "#ffffff" },
  lounge: { floor: "#b48a5e", wall: "#6a4a6a", sky: ["#2a1f2e", "#4a3550"], light: "#9fd3ff" },
  kitchen: { floor: "#c9b28a", wall: "#efe6d6", sky: ["#efe6d6", "#fbf7ef"], light: "#fff4e0" },
  podium: { floor: "#2b2a40", wall: "#3a2f6a", sky: ["#120f2a", "#2c2460"], light: "#fff2c4" },
  graduation: { floor: "#7a2f2f", wall: "#1f2f5a", sky: ["#101a36", "#24386a"], light: "#fff2c4" },
  "house-1": { floor: "#9aa3a8", wall: "#b9d7ea", sky: ["#9fcbe8", "#eaf5fc"], light: "#fff6dc" },
  "house-2": { floor: "#6f9a52", wall: "#b9d7ea", sky: ["#9fcbe8", "#eaf5fc"], light: "#fff6dc" },
  "house-3": { floor: "#5f8a46", wall: "#b9d7ea", sky: ["#9fcbe8", "#eaf5fc"], light: "#fff6dc" },
  "house-4": { floor: "#5f8a46", wall: "#b9d7ea", sky: ["#9fcbe8", "#eaf5fc"], light: "#fff6dc" },
  bank: { floor: "#e8e2d4", wall: "#1f4a3a", sky: ["#14241e", "#2f5d4a"], light: "#fff2c4" },
  workplace: { floor: "#3b4f7a", wall: "#d9dfe6", sky: ["#c9d3dd", "#eef2f6"], light: "#ffffff" },
};

/* ── Sets: everything sits on a 1.9 m plinth in front of a backdrop at z −1.5. ── */
function Backdrop({ c, h = 2.6 }: { c: string; h?: number }) {
  return <Box s={[4.4, h, 0.12]} p={[0, h / 2, -1.55]} c={c} o={{ rough: 0.9 }} />;
}
function Bench({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Round s={[1.3, 0.06, 0.42]} p={[0, 0.44, 0]} c="#9c6b45" rad={0.02} />
      <Round s={[1.3, 0.32, 0.05]} p={[0, 0.68, -0.2]} c="#9c6b45" rad={0.02} />
      {[-0.55, 0.55].map((x) => <Box key={x} s={[0.06, 0.44, 0.4]} p={[x, 0.22, 0]} c="#2b2a2e" />)}
    </Group>
  );
}
function Tree({ p }: { p: [number, number, number] }) {
  return (
    <Group p={p}>
      <Cyl rad={0.09} h={1.3} p={[0, 0.65, 0]} c="#6b4a32" />
      <Ball rad={0.6} p={[0, 1.6, 0]} c="#4f8a3e" />
      <Ball rad={0.42} p={[0.35, 1.35, 0.1]} c="#5f9a48" />
    </Group>
  );
}
function House({ tier }: { tier: number }) {
  const door = <><Box s={[0.6, 1.15, 0.06]} p={[0, 0.58, 0.02]} c="#b5413a" /><Ball rad={0.03} p={[0.2, 0.58, 0.07]} c="#e0b84a" /></>;
  if (tier === 1) return (
    <Group p={[0, 0, -1.9]}>
      <Box s={[3.2, 3.2, 0.5]} p={[0, 1.6, -0.25]} c="#b8735a" />
      {[[-1, 2.3], [1, 2.3], [-1, 1.2], [1, 1.2]].map(([x, y]) => <Box key={`${x}${y}`} s={[0.6, 0.6, 0.04]} p={[x!, y!, 0.02]} c="#cfe6f2" />)}
      {door}
    </Group>
  );
  if (tier === 4) return (
    // The castle gatehouse: twin crenellated towers, slate cones, banners and the open gate.
    <Group p={[0, 0, -2.1]}>
      <Box s={[4.6, 2.2, 0.6]} p={[0, 1.1, -0.3]} c="#b9b1a2" />
      {Array.from({ length: 17 }, (_, i) => <Box key={i} s={[0.16, 0.2, 0.6]} p={[-2.2 + i * 0.275, 2.3, -0.3]} c="#b9b1a2" />)}
      {[-1.6, 1.6].map((x) => (
        <Group key={x} p={[x, 0, 0]}>
          <Cyl rad={0.55} h={3.0} p={[0, 1.5, 0]} c="#b9b1a2" />
          <Cone rad={0.62} h={1.0} p={[0, 3.5, 0]} c="#4a5a72" />
          <Cyl rad={0.015} h={0.5} p={[0, 4.2, 0]} c="#2b2a2e" />
          <Box s={[0.32, 0.16, 0.01]} p={[0.16, 4.35, 0]} c={x < 0 ? "#a93d37" : "#d8b45a"} />
          <Box s={[0.36, 0.8, 0.02]} p={[0, 1.5, 0.56]} c="#a93d37" />
        </Group>
      ))}
      <Box s={[1.1, 1.5, 0.04]} p={[0, 0.75, 0.02]} c="#2a2420" />
      {[-0.4, -0.2, 0, 0.2, 0.4].map((x) => <Box key={x} s={[0.03, 0.5, 0.03]} p={[x, 1.3, 0.05]} c="#2b2a2e" />)}
    </Group>
  );
  if (tier === 2) return (
    <Group p={[0, 0, -1.9]}>
      <Box s={[3.0, 1.9, 0.5]} p={[0, 0.95, -0.25]} c="#f1e6cf" />
      <Cone rad={2.25} h={1.1} p={[0, 2.45, -0.25]} r={[0, Math.PI / 4, 0]} c="#7a3f33" />
      {[-0.95, 0.95].map((x) => <Box key={x} s={[0.6, 0.6, 0.04]} p={[x, 1.15, 0.02]} c="#cfe6f2" />)}
      {door}
    </Group>
  );
  return (
    <Group p={[0, 0, -2.0]}>
      <Box s={[4.4, 2.8, 0.6]} p={[0, 1.4, -0.3]} c="#f4f1ea" />
      <Box s={[4.6, 0.25, 0.7]} p={[0, 2.9, -0.25]} c="#d9d2c0" />
      {[-1.2, -0.5, 0.5, 1.2].map((x) => <Cyl key={x} rad={0.12} h={2.6} p={[x, 1.3, 0.25]} c="#ffffff" />)}
      <Box s={[1.8, 0.12, 0.7]} p={[0, 2.65, 0.25]} c="#e9e3d2" />
      {door}
    </Group>
  );
}
function Confetti({ kind, start }: { kind: "party" | "paper"; start: number }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = 140;
  const seeds = useMemo(() => Array.from({ length: n }, (_, i) => ({ x: Math.sin(i * 12.9898) * 2.2, z: Math.cos(i * 78.233) * 1.2 - 0.2, sp: 0.6 + ((i * 37) % 10) / 14, ph: i * 0.37, d: ((i * 53) % 17) / 10 })), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  const colours = useMemo(() => kind === "paper" ? ["#f6f0df", "#e9e3d2", "#ffffff"] : ["#e05a4f", "#ffd24a", "#4a8fd9", "#4fb07a", "#c56ad9", "#ffffff"], [kind]);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const c = new THREE.Color();
    seeds.forEach((_, i) => m.setColorAt(i, c.set(colours[i % colours.length]!)));
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
  }, [colours, seeds]);
  useFrame((state) => {
    const m = ref.current;
    if (!m) return;
    const t = (frozenT() ?? state.clock.elapsedTime) - start;
    seeds.forEach((s, i) => {
      const life = t - s.d * 0.4;
      const y = life < 0 ? 99 : 3.2 - ((life * s.sp) % 3.4);
      tmp.position.set(s.x + Math.sin(life * 2 + s.ph) * 0.15, y, s.z);
      tmp.rotation.set(life * 3 + s.ph, life * 2, s.ph);
      tmp.scale.setScalar(kind === "paper" ? 1.6 : 1);
      tmp.updateMatrix();
      m.setMatrixAt(i, tmp.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[undefined, undefined, n]} frustumCulled={false}>
      <planeGeometry args={[0.05, 0.08]} />
      <meshStandardMaterial side={THREE.DoubleSide} roughness={0.6} />
    </instancedMesh>
  );
}

function SetPieces({ spec }: { spec: StageSpec }) {
  const L = LOOKS[spec.set];
  let pieces: ReactNode = null;
  switch (spec.set) {
    case "gym": pieces = <><Box s={[1.4, 0.03, 1.0]} p={[0, 0.015, 0]} c="#1f2124" /><Group p={[1.2, 0, -0.6]}><Box s={[0.5, 0.9, 0.4]} p={[0, 0.45, 0]} c="#2a2a2c" /></Group></>; break;
    case "park": pieces = <><Box s={[4, 0.02, 0.8]} p={[0, 0.01, 0]} c="#c9b896" /><Tree p={[-1.4, 0, -0.9]} /><Tree p={[1.5, 0, -1.1]} /></>; break;
    case "bench": pieces = <><Bench p={[0, 0, -0.2]} /><Group p={[1.3, 0, -0.6]}><Cyl rad={0.04} h={2.2} p={[0, 1.1, 0]} c="#2b2a2e" /><Ball rad={0.13} p={[0, 2.2, 0]} c="#fff2c4" o={{ emissive: "#ffd27a", glow: 1.2 }} /></Group></>; break;
    case "bar": pieces = <><Round s={[2.6, 1.05, 0.6]} p={[0, 0.52, -0.55]} c="#7a4a32" rad={0.04} /><Cyl rad={0.2} h={0.05} p={[0, 0.72, 0.1]} c="#a02a2a" /><Cyl rad={0.04} h={0.7} p={[0, 0.36, 0.1]} c="#c9ccd2" /></>; break;
    case "bed": pieces = <><Round s={[2.0, 0.2, 1.3]} p={[0, 0.1, 0]} c="#e9e3d2" rad={0.05} /><Round s={[0.3, 0.1, 0.6]} p={[-0.75, 0.25, 0]} c="#ffffff" rad={0.04} /></>; break;
    case "workplace": pieces = <><Round s={[1.2, 1.0, 0.5]} p={[-1.2, 0.5, -1.0]} c="#e9e3d2" rad={0.03} /><Box s={[0.9, 2.1, 0.06]} p={[1.15, 1.05, -1.47]} c="#6a8fc9" /><Group p={[-1.75, 0, -0.4]}><Cyl rad={0.18} h={0.35} p={[0, 0.17, 0]} c="#b55a51" /><Ball rad={0.32} p={[0, 0.65, 0]} c="#4f8a3e" /></Group></>; break;
    case "desk": pieces = <><Box s={[1.5, 0.05, 0.7]} p={[0, 0.74, 0.25]} c="#e9e3d2" />{[-0.68, 0.68].map((x) => <Box key={x} s={[0.05, 0.74, 0.65]} p={[x, 0.37, 0.25]} c="#9aa3a8" />)}<Round s={[0.44, 0.06, 0.44]} p={[0, 0.46, -0.35]} c="#3b4f7a" rad={0.02} /><Box s={[0.36, 0.22, 0.02]} p={[0, 0.88, 0.35]} r={[-0.3, 0, 0]} c="#2b2d33" /></>; break;
    case "casino": pieces = <><Round s={[2.0, 0.08, 0.9]} p={[0, 0.8, 0.45]} c="#1f6a4a" rad={0.04} /><Box s={[1.8, 0.78, 0.7]} p={[0, 0.39, 0.45]} c="#4a1f2a" /></>; break;
    case "alley": pieces = <><Box s={[0.6, 0.8, 0.5]} p={[-1.3, 0.4, -1.1]} c="#3f5f4a" /><Box s={[0.5, 0.7, 0.5]} p={[1.4, 0.35, -1.0]} c="#2b2d33" /></>; break;
    case "counter": pieces = <><Round s={[2.2, 1.0, 0.6]} p={[0, 0.5, -0.65]} c="#3c6660" rad={0.03} /><Box s={[0.3, 0.2, 0.25]} p={[0.5, 1.1, -0.65]} c="#2b2d33" /></>; break;
    case "dancefloor": pieces = <>{[-1, 0, 1].flatMap((i) => [-1, 0, 1].map((j) => <Box key={`${i}${j}`} s={[0.62, 0.02, 0.62]} p={[i * 0.64, 0.012, j * 0.64]} c={["#e05a9a", "#4a8fd9", "#ffd24a", "#7ad9a0"][(i + j + 4) % 4]!} o={{ emissive: ["#e05a9a", "#4a8fd9", "#ffd24a", "#7ad9a0"][(i + j + 4) % 4]!, glow: 0.4 }} shadow={false} />))}</>; break;
    case "clinic": pieces = <><Box s={[2.0, 0.5, 1.0]} p={[0, 0.25, 0]} c="#c9ccd2" /><Round s={[1.95, 0.12, 0.95]} p={[0, 0.55, 0]} c="#ffffff" rad={0.04} /><Round s={[1.1, 0.06, 0.85]} p={[0.3, 0.64, 0]} c="#a9d6e6" rad={0.03} /><Round s={[0.3, 0.1, 0.6]} p={[-0.75, 0.66, 0]} c="#f4f1ea" rad={0.04} /></>; break;
    case "busstop": pieces = <><Cyl rad={0.04} h={2.3} p={[-0.2, 1.15, -0.8]} c="#2b2a2e" /><Sign p={[-0.2, 2.05, -0.78]} w={0.7} h={0.36} text="BUS" bg="#2f6a8a" /><Box s={[1.8, 0.05, 0.5]} p={[0.9, 2.1, -1.0]} c="#2b2a2e" /><Box s={[1.8, 1.9, 0.04]} p={[0.9, 1.05, -1.25]} c="#cfe6f2" o={{ opacity: 0.4 }} /></>; break;
    case "atm": pieces = <><Round s={[0.8, 1.7, 0.45]} p={[0, 0.85, -0.55]} c="#2f5d4a" rad={0.04} /><Box s={[0.4, 0.3, 0.02]} p={[0, 1.25, -0.32]} c="#9fe0ff" o={{ emissive: "#9fe0ff", glow: 0.6 }} /></>; break;
    case "lounge": pieces = <><Round s={[1.8, 0.42, 0.85]} p={[0, 0.21, -0.2]} c="#b55a51" rad={0.06} /><Round s={[1.8, 0.55, 0.22]} p={[0, 0.6, -0.55]} c="#b55a51" rad={0.06} /></>; break;
    case "kitchen": pieces = <><Round s={[2.4, 0.9, 0.6]} p={[0, 0.45, -0.55]} c="#efe6d6" rad={0.02} /><Box s={[2.4, 0.04, 0.62]} p={[0, 0.92, -0.55]} c="#8a6a45" /><Cyl rad={0.14} h={0.1} p={[0, 0.99, -0.5]} c="#2b2a2e" /></>; break;
    case "podium": pieces = <><Box s={[1.0, 0.5, 1.4]} p={[0, 0.25, 0]} c="#e0b84a" /><Box s={[0.9, 0.32, 1.1]} p={[-1.0, 0.16, 0.1]} c="#c9ccd2" /><Box s={[0.9, 0.2, 1.1]} p={[1.0, 0.1, 0.1]} c="#b88b5f" /><Sign p={[0, 0.25, 0.71]} w={0.36} h={0.3} text="1" bg="#e0b84a" fg="#2b2a2e" /></>; break;
    case "graduation": pieces = <><Box s={[3.2, 0.3, 1.6]} p={[0, 0.15, -0.1]} c="#5a2a2a" /><Round s={[0.6, 1.0, 0.45]} p={[1.1, 0.8, -0.55]} c="#6b4a32" rad={0.03} /></>; break;
    case "house-1": case "house-2": case "house-3": case "house-4": pieces = <><House tier={Number(spec.set.slice(-1))} /><Box s={[0.9, 0.02, 2.2]} p={[0, 0.01, -0.7]} c="#c9b896" /><Group p={[1.3, 0, -0.3]}><Cyl rad={0.03} h={1.2} p={[0, 0.6, 0]} c="#6b4a32" /><Sign p={[0, 1.15, 0.03]} w={0.6} h={0.36} text="SOLD" bg="#b5413a" /></Group></>; break;
    case "bank": pieces = <>{[-1.4, -0.7, 0.7, 1.4].map((x) => <Cyl key={x} rad={0.13} h={2.4} p={[x, 1.2, -1.2]} c="#f4f1ea" />)}</>; break;
  }
  return (
    <>
      <Cyl rad={2.1} h={0.08} p={[0, -0.04, 0]} c={L.floor} o={{ rough: 0.85 }} />
      {!spec.set.startsWith("house") && <Backdrop c={L.wall} />}
      {pieces}
      {spec.banner && <Sign p={[0, 2.15, -1.47]} w={2.6} h={0.42} text={spec.banner} bg={spec.set === "bank" ? "#e0b84a" : "#b5413a"} fg={spec.set === "bank" ? "#1f2a24" : "#fff8e6"} />}
      {spec.costar && <Costar {...spec.costar} />}
      {spec.world.length > 0 && <Group p={[spec.mark.x, 0, spec.mark.z]} r={[0, spec.mark.face, 0]}><WorldProps props={spec.world} /></Group>}
    </>
  );
}

/** The other person in the shot: a simple figure in the room style. */
function Costar({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <Group p={[x, 0, z]} r={[0, rot, 0]}>
      {[-0.09, 0.09].map((dx) => <Cyl key={dx} rad={0.06} h={0.5} p={[dx, 0.25, 0]} c="#2b3a52" />)}
      <Round s={[0.4, 0.5, 0.24]} p={[0, 0.5, 0]} c="#5c6e98" rad={0.08} />
      <Ball rad={0.16} p={[0, 0.98, 0]} c="#e8c7a0" />
      <Ball rad={0.165} p={[0, 1.03, -0.02]} sc={[0.165, 0.1, 0.165]} c="#3a2a22" />
      {[-0.06, 0.06].map((dx) => <Ball key={dx} rad={0.018} p={[dx, 0.99, 0.16]} c="#1d1d22" shadow={false} />)}
    </Group>
  );
}

function Actor({ spec, head, t }: { spec: StageSpec; head: string; t: { current: number } }) {
  const act = useMemo(() => actFor(spec.act, false), [spec.act]);
  const held = useMemo(() => heldProps(spec.held), [spec.held]);
  const state = useRef<PersonState>({ x: spec.mark.x, z: spec.mark.z, angle: 180 - (spec.mark.face * 180) / Math.PI, walking: false, pose: act.pose, visible: true, lift: spec.mark.lift });
  return (
    <Person
      get={() => Object.assign(state.current, { pose: act.pose, walking: Boolean(act.walking), phase: t.current * 13, act: act.run, actT: Math.max(0, t.current - 0.2) })}
      skin={head} outfit={townColor("var(--town-player)")} scale={1.7}
      {...(spec.hat ? { hat: "#1d1b26", hatKind: spec.hat } : {})}
      heldL={held.left} heldR={held.right}
    />
  );
}

const big0 = (s: StageSpec) => s.mode === "milestone";

function Director({ spec, head, onDone }: { spec: StageSpec; head: string; onDone: () => void }) {
  const { camera, size } = useThree();
  // Portrait phones need the camera further back to keep banners and co-stars in shot.
  const fit = Math.max(1, (big0(spec) ? 0.95 : 0.8) / (size.width / Math.max(1, size.height)));
  const t = useRef(0);
  const done = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true, []);
  const big = spec.mode === "milestone";
  useEffect(() => {
    const skip = () => { t.current = Math.max(t.current, spec.duration - OUTRO); };
    window.addEventListener(SKIP, skip);
    return () => window.removeEventListener(SKIP, skip);
  }, [spec.duration]);
  useFrame((_, raw) => {
    t.current += Math.min(raw, 0.05);
    const f = frozenT();
    if (f !== undefined) t.current = Math.min(f, spec.duration - 0.01);
    const now = t.current;
    // A slow push-in with a gentle orbit for milestones; a steady three-quarter for cards.
    const push = reduce ? 1 : smooth(now / (big ? 2.2 : 1.2));
    const az = big && !reduce ? 0.32 * Math.sin(now * 0.45) - 0.12 : 0.18;
    const lying = spec.act === "sleep" || spec.act === "heal";
    const dist = ((big ? 5.2 : 3.3) - (big ? 1.4 : 0.55) * push) * fit;
    const target = new THREE.Vector3(spec.mark.x * 0.6, big ? 0.95 : lying ? 0.35 : 0.62, spec.mark.z * 0.5);
    camera.position.set(target.x + Math.sin(az) * dist, target.y + (big ? 0.9 : 0.85) + 0.35 * (1 - push), target.z + Math.cos(az) * dist);
    camera.lookAt(target);
    if (!done.current && now >= spec.duration) { done.current = true; doneRef.current(); }
  });
  return (
    <>
      <Actor spec={spec} head={head} t={t} />
      {spec.confetti && <Confetti kind={spec.confetti} start={big ? 1.6 : 0.4} />}
    </>
  );
}

export function SceneStage({ spec, head, onDone }: { spec: StageSpec; head: string; onDone: () => void }) {
  const L = LOOKS[spec.set];
  const big = spec.mode === "milestone";
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === " " || e.key === "Enter") window.dispatchEvent(new Event(SKIP)); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const canvas = (
    <Canvas
      shadows="percentage"
      dpr={[1, 1.75]}
      camera={{ fov: big ? 42 : 38, near: 0.1, far: 40, position: [0, 1.6, 4] }}
      gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true }}
      style={{ background: `linear-gradient(180deg, ${L.sky[0]} 0%, ${L.sky[1]} 100%)` }}
    >
      <hemisphereLight args={["#ffffff", "#2a2630", big ? 0.9 : 1.1]} />
      <directionalLight castShadow position={[2.2, 5, 3.2]} intensity={1.6} color={L.light} shadow-mapSize={[1024, 1024]} shadow-bias={-0.0004} />
      {big && <spotLight position={[0, 4.5, 1.6]} angle={0.5} penumbra={0.6} intensity={30} color={L.light} />}
      <SetPieces spec={spec} />
      <Director spec={spec} head={head} onDone={onDone} />
    </Canvas>
  );
  const skip = () => window.dispatchEvent(new Event(SKIP));
  if (big) {
    return (
      <div className="fixed inset-0 z-[90] bg-[#0b0a12]" data-scene-stage="milestone" data-stage-set={spec.set} role="status" aria-label={[spec.title, spec.detail, ...spec.gains].filter(Boolean).join(". ")} onPointerDown={skip}>
        <div className="absolute inset-0">{canvas}</div>
        <div className="pointer-events-none absolute inset-x-0 top-0 h-[11%] bg-[#0b0a12]" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[24%] bg-gradient-to-t from-[#0b0a12] via-[#0b0a12]/85 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-[6%] flex flex-col items-center gap-1.5 px-4 text-center">
          <div className="scene-stage-title text-[clamp(30px,9vw,54px)] font-black leading-none tracking-wide text-[#ffd24a] drop-shadow-[0_3px_0_#3a2a00]">{spec.title}</div>
          {spec.detail && <div className="scene-stage-detail text-[clamp(16px,4.6vw,24px)] font-extrabold tracking-wider text-[#f6efe0]">{spec.detail}</div>}
          {(spec.gains.length > 0 || spec.losses.length > 0) && (
            <div className="mt-1 flex flex-wrap justify-center gap-1.5">
              {spec.gains.map((g) => <span key={g} className="rounded-full border-2 border-[#111014] bg-card px-2.5 py-0.5 text-sm font-extrabold text-foreground">{g}</span>)}
              {spec.losses.map((g) => <span key={g} className="rounded-full border-2 border-[#111014] bg-[#b5413a] px-2.5 py-0.5 text-sm font-extrabold text-[#fff4ea]">{g}</span>)}
            </div>
          )}
        </div>
        <button type="button" className="absolute right-3 top-[3%] min-h-9 rounded-full border-2 border-[#f6efe0]/70 bg-black/40 px-3 text-xs font-extrabold tracking-wider text-[#f6efe0]" onPointerDown={(e) => e.stopPropagation()} onClick={skip}>SKIP ▸▸</button>
      </div>
    );
  }
  return (
    <div data-action-vignette={spec.act} data-scene-stage="card" data-stage-set={spec.set} className={`action-vignette ${spec.set === "counter" ? "action-vignette-shop" : ""}`} role="status" aria-label={spec.title} onPointerDown={skip}>
      <div className="action-vignette-card">
        <div className="action-vignette-title">{spec.title}</div>
        <div className="action-vignette-svg relative" style={{ height: "min(38dvh, 260px)" }}>{canvas}
          {spec.caption && <span className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 whitespace-nowrap rounded-full border-2 border-[#111014] bg-[#ffd24a] px-3 py-0.5 text-[11px] font-black tracking-wider text-[#111014]">{spec.caption}</span>}
        </div>
        <div className="action-vignette-gain" aria-live="polite">
          {spec.gains.length || spec.losses.length
            ? <>{spec.gains.join("   ")}{spec.losses.length > 0 && <span className="text-[#b5413a]">{spec.gains.length ? "   " : ""}{spec.losses.join("   ")}</span>}</>
            : "ACTION COMPLETE"}
        </div>
        <p className="action-vignette-message">{spec.message}</p>
      </div>
    </div>
  );
}
