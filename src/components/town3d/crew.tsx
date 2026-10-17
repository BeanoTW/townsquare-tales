import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { PersonState } from "@/components/Character3D";
import { CastPerson, MissionPropMesh } from "@/components/crime/Cast";
import { listening, perform } from "@/components/crime/acting";
import { CREW_SPOTS } from "@/lib/street-gang";
import { ALLEY_SPOT, CAST_LOOKS, type MissionProp } from "@/lib/crime-cast";
import { actFor, beatAt, blendProjection, faceToward, shotForBeat, type LiveConversation, type Marks } from "@/lib/conversation-camera";
import { applyTownCamera, townClipMatrix } from "@/components/town3d/projection";
import { playerCameraOffset } from "@/lib/town-world";
import type { TownLive } from "@/components/town3d/actors";
import { PERSON_SCALE } from "@/components/Character3D";

/**
 * Mick, Lez and Nia at the green, the props that tell you which story is open, and the conversation camera that
 * leaves the overhead view to frame them. The camera blends the town's oblique projection into a perspective
 * shot (one projective matrix interpolated element-wise, so the world never jumps), then blends back; the
 * player's position and the overhead camera are never modified, so closing a conversation restores them exactly.
 */
export type CrewVisuals = {
  held: Partial<Record<"mick" | "lez" | "nia", MissionProp>>;
  /** Mick's traffic cone, parked by the green until it turns up somewhere else. */
  cone: boolean;
  trolley: "alley" | "green" | null;
  /** The crew's alley errand: an envelope waiting to be found. */
  alleyEnvelope: boolean;
};

const CREW = ["mick", "lez", "nia"] as const;
type Crew = (typeof CREW)[number];
const HOME_ANGLE: Record<Crew, number> = { mick: 180, lez: 175, nia: 170 };
const now = () => (typeof performance === "undefined" ? 0 : performance.now());

export function crewMarks(live: TownLive): Marks {
  const m = live.me.current;
  return {
    mick: { x: CREW_SPOTS.mick.x, z: CREW_SPOTS.mick.y, scale: PERSON_SCALE, stretch: CAST_LOOKS.mick.stretch },
    lez: { x: CREW_SPOTS.lez.x, z: CREW_SPOTS.lez.y, scale: PERSON_SCALE, stretch: CAST_LOOKS.lez.stretch },
    nia: { x: CREW_SPOTS.nia.x, z: CREW_SPOTS.nia.y, scale: PERSON_SCALE, seated: true },
    player: { x: m.x, z: m.y, scale: PERSON_SCALE },
  };
}

/** Turn smoothly toward a heading (degrees), taking the short way round. */
function approach(current: number, target: number, k: number) {
  const d = ((((target - current) % 360) + 540) % 360) - 180;
  return current + d * k;
}

export function CrewGang({ live, conversation, visuals }: { live: TownLive; conversation: LiveConversation | null | undefined; visuals: CrewVisuals }) {
  const states = useRef<Record<Crew, PersonState>>({
    mick: { x: CREW_SPOTS.mick.x, z: CREW_SPOTS.mick.y, angle: HOME_ANGLE.mick, walking: false, pose: "standing", visible: true },
    lez: { x: CREW_SPOTS.lez.x, z: CREW_SPOTS.lez.y, angle: HOME_ANGLE.lez, walking: false, pose: "standing", visible: true },
    nia: { x: CREW_SPOTS.nia.x, z: CREW_SPOTS.nia.y, angle: HOME_ANGLE.nia, walking: false, pose: "sitting", visible: true, lift: 0.02 },
  });
  const convo = useRef(conversation);
  convo.current = conversation;
  const last = useRef(now());
  const get = (id: Crew) => () => {
    const s = states.current[id];
    const t = now();
    const dt = Math.min(0.1, (t - last.current) / 1000);
    if (id === "nia") last.current = t;
    const c = convo.current;
    const clock = t / 1000 + (id === "lez" ? 3.1 : id === "nia" ? 6.7 : 0);
    if (!c) {
      s.angle = approach(s.angle, HOME_ANGLE[id], 1 - Math.exp(-dt * 3));
      s.act = perform(id, "idle", id === "nia");
      s.actT = clock;
      return s;
    }
    const marks = crewMarks(live);
    const { index, beat, t: bt } = beatAt(c.cue, t - c.startedAt);
    const act = actFor(c.cue, index, beat, id, (speaker) => listening(id, speaker));
    const lead = c.cue.kind === "conversation" ? c.cue.beats[0]?.speaker ?? null : beat.speaker;
    const face = faceToward(id, lead === id ? "player" : beat.speaker ?? lead, marks);
    if (face !== null && act !== "turn-away") s.angle = approach(s.angle, face, c.reduced ? 1 : 1 - Math.exp(-dt * 5));
    s.act = perform(id, c.reduced ? (act === "talk" ? "talk" : "idle") : act, id === "nia");
    // Idles keep their own clock so nobody snaps between loops; acted beats start from zero.
    s.actT = act === "idle" || act === "talk" || act === "stare-sky" || act === "arms-crossed" ? clock : bt;
    return s;
  };
  const getters = useMemo(() => ({ mick: get("mick"), lez: get("lez"), nia: get("nia") }), []); // eslint-disable-line react-hooks/exhaustive-deps
  // Lez's favour ends with the card in his hand and the cone, finally, in his other.
  const favour = conversation?.cue.storyId === 5;
  return (
    <>
      <CastPerson id="mick" get={getters.mick} held={visuals.held.mick} />
      <CastPerson id="lez" get={getters.lez} heldLeft={favour && conversation?.cue.kind === "epilogue" ? "traffic-cone" : visuals.held.lez} held={favour ? "birthday-card" : undefined} />
      <CastPerson id="nia" get={getters.nia} held={visuals.held.nia} scale={PERSON_SCALE} />
      {/* Nia's upturned crate, so she is sitting on something */}
      <group position={[CREW_SPOTS.nia.x, 0, CREW_SPOTS.nia.y - 0.04]} rotation={[0, 0.2, 0]}>
        <mesh position={[0, 0.1, 0]} castShadow receiveShadow><boxGeometry args={[0.3, 0.2, 0.24]} /><meshStandardMaterial color="#3d6a8a" roughness={0.7} /></mesh>
        {[-0.08, 0, 0.08].map((x) => <mesh key={x} position={[x, 0.1, 0.121]}><boxGeometry args={[0.04, 0.13, 0.005]} /><meshStandardMaterial color="#2b4a62" /></mesh>)}
      </group>
      {visuals.cone && <group position={[6.5, 0, 3.95]} rotation={[0, 0.4, 0]} scale={0.55}><MissionPropMesh kind="traffic-cone" /></group>}
      {visuals.trolley === "green" && <group position={[5.2, 0, 4.85]} rotation={[0, 0.9, 0]} scale={0.55}><MissionPropMesh kind="trolley" /></group>}
      {visuals.trolley === "alley" && <group position={[ALLEY_SPOT.x, 0, ALLEY_SPOT.y + 0.2]} rotation={[0, 0.35, 0]} scale={0.55}><MissionPropMesh kind="trolley" /></group>}
      {(visuals.trolley === "alley" || visuals.alleyEnvelope) && <AlleyDressing envelope={visuals.alleyEnvelope} />}
    </>
  );
}

/** A little life in the gap between the pub and the casino while an errand points there. */
function AlleyDressing({ envelope }: { envelope: boolean }) {
  return (
    <group position={[ALLEY_SPOT.x, 0, ALLEY_SPOT.y]}>
      <mesh position={[-0.28, 0.16, -0.75]} castShadow><boxGeometry args={[0.3, 0.32, 0.26]} /><meshStandardMaterial color="#3f5f4a" roughness={0.8} /></mesh>
      <mesh position={[-0.28, 0.33, -0.75]}><boxGeometry args={[0.33, 0.03, 0.29]} /><meshStandardMaterial color="#2c4535" /></mesh>
      <mesh position={[0.25, 0.08, -0.35]} castShadow><boxGeometry args={[0.24, 0.16, 0.2]} /><meshStandardMaterial color="#8a6a45" roughness={0.9} /></mesh>
      {envelope && <group position={[0.25, 0.165, -0.35]} rotation={[0, 0.4, 0]} scale={0.7}><MissionPropMesh kind="envelope" /></group>}
      <mesh position={[0.05, 0.004, 0.55]} rotation={[-Math.PI / 2, 0, 0]} scale={[0.32, 0.18, 1]}><circleGeometry args={[1, 18]} /><meshStandardMaterial color="#3a4450" roughness={0.15} metalness={0.3} /></mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ conversation camera */

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/**
 * Replaces the town Rig: the overhead follow camera, blended toward the director's shot while a conversation is
 * open. With reduced motion the blend is a cut; with no conversation it is exactly the original overhead camera.
 */
export function TownCameraRig({ live, skating, conversation }: { live: TownLive; skating: boolean; conversation: LiveConversation | null | undefined }) {
  const { invalidate } = useThree();
  const blend = useRef(0);
  const convo = useRef(conversation);
  convo.current = conversation;
  const last = useRef<LiveConversation | null>(null);
  const shot = useRef({ eye: new THREE.Vector3(), target: new THREE.Vector3(), fov: 42, ready: false });
  const persp = useMemo(() => new THREE.PerspectiveCamera(42, 1, 0.05, 90), []);
  // The town draws on demand; a new scene (or its end) must request the first frame of the move.
  useEffect(() => { invalidate(); }, [conversation, invalidate]);
  const tmp = useMemo(() => ({ m0: new THREE.Matrix4(), m1: new THREE.Matrix4(), eye: new THREE.Vector3(), target: new THREE.Vector3() }), []);
  useFrame((state, delta) => {
    const m = live.me.current;
    const [ox, oy] = playerCameraOffset(m.x, m.y, skating);
    const { width, height } = state.size;
    applyTownCamera(state.camera, width, height, ox, oy);
    const c = convo.current;
    if (c) last.current = c;
    const dt = Math.min(delta, 0.1);
    const reduced = (c ?? last.current)?.reduced ?? false;
    const rate = (c ?? last.current)?.mode === "short" ? 2.6 : 1.5;
    const before = blend.current;
    blend.current = reduced ? (c ? 1 : 0) : Math.max(0, Math.min(1, blend.current + (c ? 1 : -1) * dt * rate));
    if (blend.current <= 0) { shot.current.ready = false; if (before > 0) invalidate(); return; }
    const active = c ?? last.current;
    if (!active) return;
    const { beat } = beatAt(active.cue, now() - active.startedAt);
    const lead = active.cue.kind === "conversation" ? active.cue.beats[0]?.speaker ?? null : null;
    const pose = shotForBeat(beat, crewMarks(live), undefined, lead);
    if (pose) {
      tmp.eye.set(...pose.eye); tmp.target.set(...pose.target);
      // The dialogue sheet covers the lower half: aim low so the people sit in the upper half of the frame.
      if (active.cue.kind === "conversation") tmp.target.y -= beat.shot === "speaker-close" ? 0.08 : 0.26;
      const s = shot.current;
      if (!s.ready || reduced) { s.eye.copy(tmp.eye); s.target.copy(tmp.target); s.fov = pose.fov; s.ready = true; }
      else {
        // Cuts between speakers glide rather than jump: a quick ease that settles within half a second.
        const k = 1 - Math.exp(-dt * (active.mode === "short" ? 7 : 4.2));
        s.eye.lerp(tmp.eye, k); s.target.lerp(tmp.target, k); s.fov += (pose.fov - s.fov) * k;
      }
    }
    persp.fov = shot.current.fov;
    persp.aspect = width / Math.max(1, height);
    persp.position.copy(shot.current.eye);
    persp.lookAt(shot.current.target);
    persp.updateMatrixWorld(true);
    persp.updateProjectionMatrix();
    tmp.m1.multiplyMatrices(persp.projectionMatrix, persp.matrixWorldInverse);
    townClipMatrix(width, height, ox, oy, tmp.m0);
    blendProjection(tmp.m0.elements, tmp.m1.elements, ease(blend.current), tmp.m0.elements);
    const cam = state.camera;
    cam.projectionMatrix.multiplyMatrices(tmp.m0, cam.matrixWorld);
    cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
    // Keep drawing while the shot is moving or the cast is acting.
    invalidate();
  }, -1);
  return null;
}

/** The player turns to whoever is speaking during a scene, without touching their saved heading. */
export function useConversationFacing(live: TownLive, conversation: LiveConversation | null | undefined): MutableRefObject<number | null> {
  const face = useRef<number | null>(null);
  const convo = useRef(conversation);
  convo.current = conversation;
  useFrame(() => {
    const c = convo.current;
    if (!c) { face.current = null; return; }
    const { beat } = beatAt(c.cue, now() - c.startedAt);
    const lead = c.cue.kind === "conversation" ? c.cue.beats[0]?.speaker ?? null : beat.speaker;
    face.current = faceToward("player", beat.speaker ?? lead ?? "mick", crewMarks(live));
  });
  return face;
}