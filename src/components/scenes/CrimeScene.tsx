import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import type { PersonState } from "@/components/Character3D";
import { CastPerson, MissionPropMesh } from "@/components/crime/Cast";
import { perform } from "@/components/crime/acting";
import { Ball, Box, Cyl, Group, Round } from "@/components/home3d/primitives";
import { Sign } from "@/components/home3d/venues/kit";
import { townColor } from "@/components/town3d/palette";
import { actFor, beatAt, faceToward, shotForBeat, type Marks } from "@/lib/conversation-camera";
import type { CrimeSet, CrimeStage } from "@/lib/crime-stage";
import type { CrimeVisualActor } from "@/lib/crime-visual-cues";
import type { MissionProp } from "@/lib/crime-cast";

/**
 * The scene stage's crime mode: a small set for the venue, the cast blocked on it, and a camera that follows the
 * director's beats (over-the-shoulder, two-shot, close reaction) using the same shot maths as the town. It only
 * performs an outcome that has already happened.
 */
export const STAGE_SCALE = 1.7;
type Look = { floor: string; wall: string; sky: [string, string]; light: string };
export const CRIME_LOOKS: Record<CrimeSet, Look> = {
  pawn: { floor: "#7a5a3e", wall: "#4a3a5a", sky: ["#2a2030", "#4a3a5a"], light: "#ffd9a0" },
  diner: { floor: "#e9e4d8", wall: "#3f8f8a", sky: ["#cfe6e4", "#f4f1ea"], light: "#fff4e0" },
  shop: { floor: "#d6cfc1", wall: "#51604e", sky: ["#e8e0cc", "#f6f0e0"], light: "#ffffff" },
  pub: { floor: "#5a3a2a", wall: "#3a2232", sky: ["#1a1220", "#3a2232"], light: "#ffb36a" },
  lane: { floor: "#4a4b52", wall: "#6a3b30", sky: ["#141420", "#2e2a3a"], light: "#ffe2a8" },
  bankfront: { floor: "#cfc9bc", wall: "#1f4a3a", sky: ["#9fc3d8", "#e6f0f4"], light: "#fff2c4" },
  green: { floor: "#6f8f4a", wall: "#9cc7e0", sky: ["#bfe0f2", "#e9f5fb"], light: "#fff6dc" },
};
/** Furniture-scale props are shrunk a touch so the larger stage figures can reach them. */
const PROP_SCALE: Partial<Record<MissionProp, number>> = { "small-table": 0.75, stool: 0.75, trolley: 0.85, wheelbarrow: 0.8, "pie-sign": 0.9 };

const SKIP = "tst-stage-skip";
const frozenT = () => (import.meta.env.DEV && typeof window !== "undefined" ? (window as { __TST_SCENE_T?: number }).__TST_SCENE_T : undefined);

function Counter({ c = "#6b4a32", top = "#e9e2d2", w = 2.3 }: { c?: string; top?: string; w?: number }) {
  return (
    <Group p={[0, 0, -0.62]}>
      <Box s={[w, 0.6, 0.5]} p={[0, 0.3, 0]} c={c} o={{ rough: 0.6 }} />
      <Round s={[w + 0.06, 0.04, 0.56]} p={[0, 0.61, 0]} c={top} rad={0.01} />
    </Group>
  );
}
function Shelves({ seed, y = 0.95, colours }: { seed: number; y?: number; colours: string[] }) {
  const items = useMemo(() => Array.from({ length: 22 }, (_, i) => ({ x: -1.9 + (i % 11) * 0.36 + ((i * seed) % 5) * 0.02, y: y + Math.floor(i / 11) * 0.5, h: 0.14 + ((i * 7 + seed) % 5) * 0.04, c: colours[(i * 3 + seed) % colours.length]! })), [seed, y, colours]);
  return (
    <Group p={[0, 0, -1.42]}>
      {[y - 0.02, y + 0.48].map((sy) => <Box key={sy} s={[4.2, 0.03, 0.26]} p={[0, sy, 0]} c="#5e3c25" />)}
      {items.map((it, i) => <Box key={i} s={[0.2, it.h, 0.16]} p={[it.x, it.y + it.h / 2, 0]} c={it.c} />)}
    </Group>
  );
}

function SetPieces({ set }: { set: CrimeSet }) {
  const L = CRIME_LOOKS[set];
  let pieces: ReactNode = null;
  switch (set) {
    case "pawn": pieces = <>
      <Counter c="#5e3c25" top="#d8cbb0" />
      <Shelves seed={3} colours={["#c9a24a", "#8a5a38", "#6a8fc9", "#b8433c", "#4f8a54", "#9aa5aa"]} />
      {/* a guitar on the wall and a cuckoo clock: the pawn shop's two permanent residents */}
      <Group p={[-1.5, 1.85, -1.48]} r={[0, 0, 0.3]}><Ball rad={0.16} sc={[0.16, 0.2, 0.04]} c="#c97a3a" /><Box s={[0.05, 0.5, 0.03]} p={[0, 0.35, 0]} c="#5e3c25" /></Group>
      <Group p={[1.45, 2.0, -1.48]}><Box s={[0.26, 0.3, 0.08]} c="#6b4a32" /><Cyl rad={0.07} h={0.02} p={[0, 0.02, 0.05]} r={[Math.PI / 2, 0, 0]} c="#f4f1ea" /></Group>
      <Sign p={[0, 2.25, -1.45]} w={2.0} h={0.32} text="ODDITIES PAWN" bg="#3a2a4a" fg="#e0b84a" />
    </>; break;
    case "diner": pieces = <>
      {Array.from({ length: 36 }, (_, i) => <Box key={i} s={[0.5, 0.005, 0.5]} p={[-1.5 + (i % 6) * 0.5 + 0.25, 0.003, -1.5 + Math.floor(i / 6) * 0.5 + 0.25]} c={(i + Math.floor(i / 6)) % 2 ? "#2b2a2e" : "#f4f1ea"} shadow={false} />)}
      <Box s={[1.4, 0.9, 0.04]} p={[-0.4, 1.4, -1.47]} c="#cfe6f2" o={{ opacity: 0.6 }} />
      <Sign p={[1.1, 2.15, -1.45]} w={1.4} h={0.3} text="FRYDAY DINER" bg="#b8433c" />
      {/* the menu stand the player hides behind */}
      <Group p={[-0.72, 0, 0.08]} r={[0, 0.5, 0]}><Box s={[0.03, 0.9, 0.03]} p={[0, 0.45, 0]} c="#2b2a2e" /><Sign p={[0, 0.95, 0.02]} w={0.36} h={0.46} text="TODAY: PIE" bg="#2b2a2e" fg="#f6efe0" /></Group>
    </>; break;
    case "shop": pieces = <>
      <Counter c="#3c6660" />
      <Box s={[0.3, 0.2, 0.25]} p={[-0.7, 0.72, -0.62]} c="#2b2d33" />
      <Shelves seed={5} colours={["#e05a4f", "#e0b84a", "#4a8fd9", "#4fb07a", "#f4f1ea", "#c56ad9"]} />
      <Sign p={[0, 2.25, -1.45]} w={1.9} h={0.32} text="CORNER SHOP" bg="#51604e" />
    </>; break;
    case "pub": pieces = <>
      <Round s={[4.0, 1.0, 0.5]} p={[0, 0.5, -1.25]} c="#6b3a26" rad={0.03} />
      <Sign p={[0, 2.2, -1.45]} w={2.0} h={0.32} text="THE TIPSY STICK" bg="#83416f" fg="#ffe9b0" />
      {/* two doors: the buyer keeps watching the wrong one */}
      {[[-1.55, "TOILETS"], [1.55, "WAY OUT"]].map(([x, t]) => <Group key={t as string} p={[x as number, 0, -1.47]}><Box s={[0.6, 1.3, 0.04]} p={[0, 0.65, 0]} c="#3a2418" /><Sign p={[0, 1.45, 0.03]} w={0.6} h={0.16} text={t as string} bg="#2b2a2e" /></Group>)}
      {[-0.9, -0.3, 0.3, 0.9].map((x) => <Ball key={x} rad={0.05} p={[x, 1.55, -1.3]} c="#ffd9a0" o={{ emissive: "#ffb36a", glow: 1.2 }} />)}
    </>; break;
    case "lane": pieces = <>
      {/* the alley walls stop short of the camera so side angles can see in */}
      {[-1, 1].map((s) => <Box key={s} s={[0.15, 2.6, 1.3]} p={[s * 1.55, 1.3, -1.2]} c={s < 0 ? "#6a3b30" : "#5a4a5a"} o={{ rough: 0.95 }} />)}
      <Box s={[0.5, 0.65, 0.4]} p={[-1.15, 0.32, -0.95]} c="#3f5f4a" />
      <Box s={[0.4, 0.4, 0.35]} p={[-0.85, 0.2, -0.45]} c="#8a6a45" />
      <Group p={[1.3, 2.0, -0.6]}><Box s={[0.08, 0.06, 0.3]} c="#2b2a2e" /><Ball rad={0.06} p={[0, -0.05, 0.12]} c="#ffe8b0" o={{ emissive: "#ffd27a", glow: 1.4 }} /></Group>
      {/* the alley's one working lamp, enough to see a face by */}
      <pointLight position={[0.9, 1.9, -0.3]} color="#ffd9a0" intensity={6} distance={4} decay={1.4} />
      <mesh position={[0.3, 0.004, 0.55]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.5, 0.28, 1]}><circleGeometry args={[1, 20]} /><meshStandardMaterial color="#3a4450" roughness={0.12} metalness={0.3} /></mesh>
    </>; break;
    case "bankfront": pieces = <>
      {[-1.4, -0.7, 0.7, 1.4].map((x) => <Cyl key={x} rad={0.13} h={2.4} p={[x, 1.2, -1.2]} c="#f4f1ea" />)}
      <Sign p={[0, 2.3, -1.3]} w={1.8} h={0.3} text="TOWN BANK" bg="#1f4a3a" fg="#e0b84a" />
      {[-0.4, 0.4].map((x) => <Group key={x} p={[x, 0, -0.4]}><Cyl rad={0.03} h={0.75} p={[0, 0.37, 0]} c="#c9a24a" /><Ball rad={0.045} p={[0, 0.77, 0]} c="#c9a24a" /></Group>)}
      <Box s={[0.8, 0.03, 0.03]} p={[0, 0.66, -0.4]} c="#8a2a2a" />
    </>; break;
    case "green": pieces = <>
      <Box s={[4.2, 1.7, 0.2]} p={[0, 0.85, -1.6]} c="#b8735a" />
      <Box s={[0.6, 0.6, 0.04]} p={[-1.1, 1.0, -1.49]} c="#cfe6f2" />
      <Group p={[0.95, 0, -0.9]} r={[0, 0.2, 0]}><Box s={[0.42, 0.3, 0.34]} p={[0, 0.15, 0]} c="#3d6a8a" /></Group>
      <group position={[1.5, 0, -0.4]} scale={0.8}><MissionPropMesh kind="traffic-cone" /></group>
      <Box s={[0.32, 0.46, 0.3]} p={[-1.6, 0.23, -1.0]} c="#4a4f55" />
    </>; break;
  }
  return (
    <>
      <Cyl rad={2.1} h={0.08} p={[0, -0.04, 0]} c={L.floor} o={{ rough: 0.85 }} />
      {set !== "green" && set !== "lane" && <Box s={[4.4, 2.6, 0.12]} p={[0, 1.3, -1.55]} c={L.wall} o={{ rough: 0.9 }} />}
      {set === "lane" && <Box s={[3.0, 2.6, 0.12]} p={[0, 1.3, -1.8]} c="#2a2630" />}
      {pieces}
    </>
  );
}

export function CrimeScene({ crime, duration, head, onDone }: { crime: CrimeStage; duration: number; head: string; onDone: () => void }) {
  const { camera, size } = useThree();
  const t = useRef(0);
  const done = useRef(false);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const [handed, setHanded] = useState(false);
  const shot = useRef({ eye: new THREE.Vector3(), target: new THREE.Vector3(), fov: 42, ready: false });
  const tmp = useMemo(() => ({ eye: new THREE.Vector3(), target: new THREE.Vector3() }), []);
  const marks: Marks = useMemo(() => Object.fromEntries(crime.cast.map((c) => [c.id, { x: c.x, z: c.z, scale: STAGE_SCALE, seated: c.pose === "sitting" }])), [crime.cast]);
  const handoverStart = useMemo(() => {
    if (!crime.handover) return Infinity;
    return crime.cue.beats.slice(0, crime.handover.beat).reduce((n, b) => n + b.durationMs, 0) / 1000 + 0.6;
  }, [crime]);
  useEffect(() => {
    const skip = () => { t.current = Math.max(t.current, duration - 0.35); };
    window.addEventListener(SKIP, skip);
    return () => window.removeEventListener(SKIP, skip);
  }, [duration]);
  useFrame((_, raw) => {
    t.current += Math.min(raw, 0.05);
    const f = frozenT();
    if (f !== undefined) t.current = Math.min(f, duration - 0.01);
    const now = t.current;
    if (!handed && now >= handoverStart) setHanded(true);
    const { beat } = beatAt(crime.cue, now * 1000);
    // Portrait screens step back a little so the whole exchange stays in frame.
    const fit = Math.max(1, 0.9 / (size.width / Math.max(1, size.height)));
    const pose = shotForBeat(beat, marks, [0.12, 1]);
    if (pose) {
      tmp.eye.set(...pose.eye); tmp.target.set(...pose.target);
      tmp.eye.sub(tmp.target).multiplyScalar(fit).add(tmp.target);
      const s = shot.current;
      if (!s.ready || crime.reduced) { s.eye.copy(tmp.eye); s.target.copy(tmp.target); s.fov = pose.fov; s.ready = true; }
      else { const k = 1 - Math.exp(-Math.min(raw, 0.05) * 4.5); s.eye.lerp(tmp.eye, k); s.target.lerp(tmp.target, k); s.fov += (pose.fov - s.fov) * k; }
      camera.position.copy(s.eye);
      camera.lookAt(s.target);
      const pc = camera as THREE.PerspectiveCamera;
      if (Math.abs(pc.fov - s.fov) > 0.01) { pc.fov = s.fov; pc.updateProjectionMatrix(); }
    }
    if (!done.current && now >= duration) { done.current = true; doneRef.current(); }
  });
  const other = crime.cue.cast.find((a) => a !== "player") ?? null;
  return (
    <>
      <SetPieces set={crime.set} />
      {crime.props.map((p, i) => (
        <Group key={i} p={[p.x, p.y, p.z]} r={[0, p.rot, 0]}>
          <group scale={PROP_SCALE[p.kind] ?? 1}><MissionPropMesh kind={p.kind} /></group>
        </Group>
      ))}
      {crime.cast.map((c) => {
        const giving = crime.handover && crime.handover.from === c.id;
        const taking = crime.handover && crime.handover.to === c.id;
        const held = giving ? (handed ? undefined : crime.handover!.prop) : taking ? (handed ? crime.handover!.prop : c.held) : c.held;
        return <StageActor key={c.id} crime={crime} id={c.id} t={t} other={c.id === "player" ? other : "player"} marks={marks} base={c} held={held} head={head} />;
      })}
    </>
  );
}

function StageActor({ crime, id, t, other, marks, base, held, head }: { crime: CrimeStage; id: CrimeVisualActor; t: { current: number }; other: CrimeVisualActor | null; marks: Marks; base: CrimeStage["cast"][number]; held: MissionProp | undefined; head: string }) {
  const state = useRef<PersonState>({ x: base.x, z: base.z, angle: base.angle, walking: false, pose: base.pose, visible: true, lift: base.lift ?? 0 });
  const get = () => {
    const s = state.current;
    const now = crime.reduced ? 0.8 : t.current;
    const { index, beat, t: bt } = beatAt(crime.cue, now * 1000);
    const act = actFor(crime.cue, index, beat, id, () => "idle");
    // People in an exchange turn to each other; the crew at the green face whoever is talking to them.
    const face = (act === "talk" || act === "hand-over" || act === "receive" || act === "lean-in" || act === "point" || act === "hands-up") && other ? faceToward(id, other, marks) : null;
    s.angle = face ?? base.angle;
    s.act = perform(id, act, base.pose === "sitting");
    s.actT = crime.reduced ? 0.8 : act === "idle" ? now : bt;
    return s;
  };
  const playerSkin = head;
  return <CastPerson id={id} get={get} scale={STAGE_SCALE} held={held} {...(id === "player" ? { outfit: townColor("var(--town-player)"), skin: playerSkin } : {})} />;
}