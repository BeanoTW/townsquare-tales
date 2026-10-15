import { useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { N } from "@/lib/town-world";
import { residentsAt, type ResidentId } from "@/lib/living-town";
import { AMBIENT_ROUTES, type StreetActor, type StreetBird } from "@/lib/street-life";
import { GANG_SPOT } from "@/lib/street-gang";
import { PARK_KID_SPOT } from "@/lib/park-kid";
import type { EncounterSpot } from "@/lib/world-encounters";
import { OLLIE_SECONDS, elevation, deckRotation, type SkateJump } from "@/lib/skate-tricks";
import { townColor, shade } from "@/components/town3d/palette";
import { darkGlass, lampBulb, mat } from "@/components/town3d/kit";
import { blobShadowTexture } from "@/components/town3d/textures";
import { LIFT } from "@/components/town3d/screen";

const DEG = Math.PI / 180;
export type Pose = "standing" | "sitting" | "lying";
export type PersonState = { x: number; z: number; angle: number; walking: boolean; pose: Pose; visible: boolean; lift?: number; phase?: number; hammer?: boolean };

/** Live game state the 3D layer reads every frame. Owned by TownMap and StreetLife. */
export type StreetLive = {
  extras: Record<string, StreetActor>;
  visible: Record<string, boolean>;
  birds: Record<string, StreetBird>;
  scatter: Record<string, boolean>;
};
export type TownLive = {
  me: MutableRefObject<{ x: number; y: number; phase: number; walking: boolean; skateAngle: number }>;
  jump: MutableRefObject<SkateJump | null>;
  seatedUntil: MutableRefObject<number>;
  residents: MutableRefObject<Partial<Record<ResidentId, StreetActor>>>;
  street: MutableRefObject<StreetLive | null>;
};

/* ------------------------------------------------------------------ the figure */

const capsule = new THREE.CapsuleGeometry(1, 1, 4, 10);
const ball = new THREE.SphereGeometry(1, 16, 12);
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
const blobMat = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, depthWrite: false, opacity: 0.35 });
const plane = new THREE.PlaneGeometry(1, 1);
let blobReady = false;
function blob() {
  if (!blobReady && typeof document !== "undefined") {
    blobMat.map = blobShadowTexture();
    blobMat.color.set("#ffffff");
    blobMat.needsUpdate = true;
    blobReady = true;
  }
  return blobMat;
}

/** Characters are drawn larger than life, like the classic sprites, so they read from the town camera. */
export const PERSON_SCALE = 1.45;

/** Rounded, chunky stick-person matching the interior style; heading 0 = north. */
export function Person({ get, outfit, skin, hat, hatKind = "cap", shadow = true, children }: {
  get: () => PersonState | null; outfit: string; skin: string; hat?: string; hatKind?: "cap" | "hard" | "beanie" | "flat"; shadow?: boolean; children?: ReactNode;
}) {
  const root = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const legL = useRef<THREE.Group>(null), legR = useRef<THREE.Group>(null);
  const armL = useRef<THREE.Group>(null), armR = useRef<THREE.Group>(null);
  const m = useMemo(() => ({
    outfit: mat(outfit, { rough: 0.7 }),
    legs: mat(shade(outfit, -0.35), { rough: 0.75 }),
    skin: mat(skin, { rough: 0.6 }),
    hat: hat ? mat(hat, { rough: 0.5 }) : null,
    eye: mat("#1d1b20", { rough: 0.3 }),
  }), [outfit, skin, hat]);
  useFrame((state) => {
    const s = get();
    const r = root.current;
    if (!r) return;
    if (!s || !s.visible) { r.visible = false; return; }
    r.visible = true;
    r.position.set(s.x, s.lift ?? 0, s.z);
    r.rotation.y = Math.PI - s.angle * DEG;
    r.scale.setScalar(PERSON_SCALE);
    const t = s.phase ?? state.clock.elapsedTime * 9;
    const swing = s.walking ? Math.sin(t) * 0.6 : 0;
    const b = body.current!;
    b.rotation.set(0, 0, 0);
    b.position.set(0, s.walking ? Math.abs(Math.cos(t)) * 0.015 : 0, 0);
    if (s.pose === "sitting") {
      b.position.y = -0.06;
      legL.current!.rotation.x = legR.current!.rotation.x = -1.45;
      armL.current!.rotation.x = armR.current!.rotation.x = -0.5;
    } else if (s.pose === "lying") {
      b.rotation.x = -Math.PI / 2;
      b.position.set(0, 0.07, 0.25);
      legL.current!.rotation.x = 0.1;
      legR.current!.rotation.x = -0.1;
      armL.current!.rotation.x = armR.current!.rotation.x = -2.6;
    } else {
      legL.current!.rotation.x = swing;
      legR.current!.rotation.x = -swing;
      armL.current!.rotation.x = -swing * 0.8;
      armR.current!.rotation.x = s.hammer ? -1.6 + Math.sin(state.clock.elapsedTime * 7) * 0.7 : swing * 0.8;
    }
  });
  return (
    <group ref={root}>
      {shadow && <mesh geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]} scale={[0.34, 0.3, 1]} material={blob()} renderOrder={2} />}
      <group ref={body}>
        {/* Legs pivot at the hips */}
        <group ref={legL} position={[-0.045, 0.21, 0]}>
          <mesh geometry={capsule} position={[0, -0.095, 0]} scale={[0.04, 0.13, 0.04]} material={m.legs} castShadow />
        </group>
        <group ref={legR} position={[0.045, 0.21, 0]}>
          <mesh geometry={capsule} position={[0, -0.095, 0]} scale={[0.04, 0.13, 0.04]} material={m.legs} castShadow />
        </group>
        <mesh geometry={capsule} position={[0, 0.315, 0]} scale={[0.095, 0.085, 0.075]} material={m.outfit} castShadow />
        {/* Arms pivot at the shoulders */}
        <group ref={armL} position={[-0.11, 0.39, 0]}>
          <mesh geometry={capsule} position={[0, -0.08, 0]} scale={[0.03, 0.1, 0.03]} material={m.outfit} />
          <mesh geometry={ball} position={[0, -0.155, 0]} scale={0.032} material={m.skin} />
        </group>
        <group ref={armR} position={[0.11, 0.39, 0]}>
          <mesh geometry={capsule} position={[0, -0.08, 0]} scale={[0.03, 0.1, 0.03]} material={m.outfit} />
          <mesh geometry={ball} position={[0, -0.155, 0]} scale={0.032} material={m.skin} />
          {children}
        </group>
        <mesh geometry={ball} position={[0, 0.535, 0]} scale={0.11} material={m.skin} castShadow />
        <mesh geometry={ball} position={[-0.038, 0.55, 0.098]} scale={0.014} material={m.eye} />
        <mesh geometry={ball} position={[0.038, 0.55, 0.098]} scale={0.014} material={m.eye} />
        {m.hat && hatKind === "hard" && (
          <>
            <mesh geometry={ball} position={[0, 0.575, 0]} scale={[0.118, 0.085, 0.118]} material={m.hat} castShadow />
            <mesh geometry={cyl} position={[0, 0.575, 0.02]} scale={[0.135, 0.012, 0.14]} material={m.hat} />
          </>
        )}
        {m.hat && hatKind === "beanie" && <mesh geometry={ball} position={[0, 0.58, -0.005]} scale={[0.115, 0.09, 0.115]} material={m.hat} castShadow />}
        {m.hat && hatKind === "flat" && <mesh geometry={cyl} position={[0, 0.63, 0.02]} scale={[0.12, 0.03, 0.13]} material={m.hat} castShadow />}
        {m.hat && hatKind === "cap" && (
          <>
            <mesh geometry={ball} position={[0, 0.585, 0]} scale={[0.112, 0.07, 0.112]} material={m.hat} castShadow />
            <mesh geometry={box} position={[0, 0.575, 0.11]} scale={[0.12, 0.01, 0.08]} material={m.hat} />
          </>
        )}
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ the player */

export function Player3D({ live, skating, head }: { live: TownLive; skating: boolean; head: string }) {
  const outfit = townColor("var(--town-player)");
  const state = useRef<PersonState>({ x: 0, z: 0, angle: 0, walking: false, pose: "standing", visible: true });
  const deck = useRef<THREE.Group>(null);
  const deckMat = useMemo(() => mat("#89949c", { rough: 0.5 }), []);
  useFrame(() => {
    const m = live.me.current;
    const jump = live.jump.current;
    const seated = performance.now() / 1000 < live.seatedUntil.current;
    const lift = skating ? 0.05 + elevation(jump) / LIFT : 0;
    Object.assign(state.current, {
      x: m.x, z: m.y, angle: m.skateAngle, walking: !skating && m.walking, pose: seated ? "sitting" : "standing",
      visible: true, lift, phase: m.phase,
    });
    const d = deck.current;
    if (d) {
      d.visible = skating;
      d.position.set(m.x, 0.035 + elevation(jump) / LIFT, m.y);
      d.rotation.set(0, Math.PI - m.skateAngle * DEG + deckRotation(jump) * DEG, 0);
      if (jump?.trick === "kickflip") d.rotateZ((Math.min(1, jump.elapsed / OLLIE_SECONDS)) * Math.PI * 2);
    }
  });
  return (
    <>
      <Person get={() => state.current} outfit={outfit} skin={head} />
      <group ref={deck}>
        <mesh geometry={box} scale={[0.13, 0.02, 0.44]} material={deckMat} castShadow />
        {[[-0.05, 0.15], [0.05, 0.15], [-0.05, -0.15], [0.05, -0.15]].map(([x, z], i) => (
          <mesh key={i} geometry={cyl} position={[x!, -0.025, z!]} rotation={[0, 0, Math.PI / 2]} scale={[0.022, 0.025, 0.022]} material={mat("#e9e3d0", { rough: 0.4 })} />
        ))}
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ residents and passers-by */

const RESIDENT_LOOK: Record<ResidentId, { skin: string; hat?: string; hatKind?: "cap" | "beanie" | "flat" }> = {
  mara: { skin: "#e8c3a0" },
  nox: { skin: "#c99572", hat: "#3a2830", hatKind: "beanie" },
  gus: { skin: "#d9a67f", hat: "#7a5a3c", hatKind: "flat" },
  ivy: { skin: "#f0d2b6", hat: "#5c6e98", hatKind: "cap" },
};

export function Residents({ live, hour }: { live: TownLive; hour: number }) {
  const people = residentsAt(hour);
  return (
    <>
      {people.map((p) => {
        const look = RESIDENT_LOOK[p.id];
        const s: PersonState = { x: p.x, z: p.y, angle: 180, walking: false, pose: "standing", visible: true };
        const get = () => {
          const a = live.residents.current[p.id];
          if (a) {
            s.x = a.x; s.z = a.y; s.angle = a.angle; s.walking = a.walking;
            s.pose = p.id === "gus" && Math.hypot(a.x - 8, a.y - 10.8) < 0.65 && !a.walking ? "sitting" : "standing";
          }
          return s;
        };
        return <Person key={p.id} get={get} outfit={townColor(p.color)} skin={look.skin} {...(look.hat ? { hat: look.hat, hatKind: look.hatKind ?? "cap" } : {})} />;
      })}
    </>
  );
}

export function Pedestrians({ live }: { live: TownLive }) {
  return (
    <>
      {AMBIENT_ROUTES.map((route, i) => {
        const s: PersonState = { x: route.morning[0].x, z: route.morning[0].y, angle: 180, walking: false, pose: "standing", visible: false };
        const get = () => {
          const st = live.street.current;
          const a = st?.extras[route.id];
          s.visible = Boolean(a && st?.visible[route.id]);
          if (a) { s.x = a.x; s.z = a.y; s.angle = a.angle; s.walking = a.walking; }
          return s;
        };
        const helper = route.id === "foreman-helper";
        return <Person key={route.id} get={get} outfit={townColor(route.color)} skin={["#efd0b0", "#c99572", "#e2b58f", "#8d5a3b"][i % 4]!} {...(helper ? { hat: "#f2c846", hatKind: "hard" as const } : route.id === "patrol" ? { hat: "#1f2a44", hatKind: "cap" as const } : {})} />;
      })}
    </>
  );
}

/** Pigeons peck around their flock spots and burst into the air when startled. */
export function Pigeons({ live }: { live: TownLive }) {
  const keys = useMemo(() => Array.from({ length: 4 }, (_, f) => [0, 1, 2].map((i) => `${f}-${i}`)).flat(), []);
  return <>{keys.map((k) => <Pigeon key={k} id={k} live={live} />)}</>;
}
function Pigeon({ id, live }: { id: string; live: TownLive }) {
  const root = useRef<THREE.Group>(null);
  const wings = useRef<THREE.Group>(null);
  const grey = mat(townColor("var(--town-pigeon)"), { rough: 0.8 });
  const neck = mat(townColor("var(--town-pigeon-neck)"), { rough: 0.6 });
  useFrame((st) => {
    const b = live.street.current?.birds[id];
    const r = root.current;
    if (!r) return;
    r.visible = Boolean(b);
    if (!b) return;
    const flying = Boolean(live.street.current?.scatter[id]);
    const t = st.clock.elapsedTime;
    r.position.set(b.x, flying ? 0.25 + Math.sin(t * 6 + b.x) * 0.05 : Math.abs(Math.sin(t * 3 + b.y * 9)) * 0.01, b.y);
    r.rotation.y = Math.PI - b.angle * DEG;
    if (wings.current) {
      wings.current.visible = flying;
      wings.current.rotation.z = flying ? Math.sin(t * 30) * 0.8 : 0;
    }
  });
  return (
    <group ref={root}>
      <mesh geometry={ball} position={[0, 0.045, 0]} scale={[0.035, 0.03, 0.055]} material={grey} />
      <mesh geometry={ball} position={[0, 0.075, 0.04]} scale={0.022} material={neck} />
      <mesh geometry={box} position={[0, 0.072, 0.065]} scale={[0.008, 0.008, 0.016]} material={mat("#e0b14a")} />
      <group ref={wings} position={[0, 0.06, 0]}>
        <mesh geometry={box} position={[0.05, 0, 0]} scale={[0.07, 0.005, 0.04]} material={grey} />
        <mesh geometry={box} position={[-0.05, 0, 0]} scale={[0.07, 0.005, 0.04]} material={grey} />
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ fixed characters */

const fixed = (x: number, z: number, angle: number, pose: Pose, extra: Partial<PersonState> = {}): PersonState => ({ x, z, angle, walking: false, pose, visible: true, ...extra });

export function Gang() {
  const sit = fixed(GANG_SPOT.x - 0.42, GANG_SPOT.y + 0.12, 180, "sitting", { lift: 0.0 });
  const stand = fixed(GANG_SPOT.x + 0.17, GANG_SPOT.y - 0.28, 200, "standing");
  const lie = fixed(GANG_SPOT.x + 0.5, GANG_SPOT.y + 0.05, 90, "lying");
  return (
    <>
      <Person get={() => sit} outfit="#292735" skin="#ae856c" hat="#3b2f3a" hatKind="beanie" />
      <Person get={() => { stand.walking = false; stand.angle = 200 + Math.sin(performance.now() / 900) * 25; return stand; }} outfit="#292735" skin="#aa7f6b" hat="#5a2b2b" hatKind="cap" />
      <Person get={() => lie} outfit="#332c35" skin="#bd977b" />
    </>
  );
}

export function ParkKid({ present }: { present: boolean }) {
  const s = fixed(PARK_KID_SPOT.x, PARK_KID_SPOT.y + 0.02, 180, "sitting");
  return <Person get={() => (present ? s : null)} outfit="#292633" skin="#dbb38b" hat="#3f6a8c" hatKind="cap" />;
}

export function EncounterPerson({ encounter }: { encounter: EncounterSpot | null | undefined }) {
  const s = fixed(0, 0, 180, "standing");
  return (
    <Person
      get={() => {
        if (!encounter) return null;
        const t = performance.now() / 1000;
        const pacing = encounter.pose === "pacing";
        s.x = encounter.x + (pacing ? Math.sin(t * 1.8) * 0.32 : 0);
        s.z = encounter.y;
        s.walking = pacing;
        s.angle = pacing ? (Math.cos(t * 1.8) > 0 ? 90 : 270) : 180;
        s.pose = encounter.pose === "sitting" ? "sitting" : "standing";
        return s;
      }}
      outfit="#3c3043" skin="#f3d7b8"
    />
  );
}

/** Crew, foreman, crane and digger on the construction site. */
export function SiteCrew({ active }: { active: boolean }) {
  const carry = fixed(17.3, 20.8, 90, "standing");
  const hammer = fixed(20.8, 18.7, 270, "standing", { hammer: true });
  const foreman = fixed(18.2, 24.1, 180, "standing");
  const jib = useRef<THREE.Group>(null);
  const arm = useRef<THREE.Group>(null);
  const beacon = useMemo(() => new THREE.MeshStandardMaterial({ color: "#efa848", emissive: new THREE.Color("#ffb347"), emissiveIntensity: 1 }), []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    if (jib.current) jib.current.rotation.y = active ? Math.sin(t * 0.25) * 0.7 : 0.2;
    if (arm.current) arm.current.rotation.z = active ? -0.3 + Math.sin(t * 0.9) * 0.35 : -0.1;
    beacon.emissiveIntensity = active ? (Math.sin(t * 6) > 0 ? 2 : 0.2) : 0;
  });
  const yellow = mat("#f2bf46", { rough: 0.5, metal: 0.2 });
  return (
    <>
      <Person get={() => { if (!active) return null; carry.x = 17.3 + Math.sin(performance.now() / 1400) * 0.4; carry.walking = true; carry.angle = Math.cos(performance.now() / 1400) > 0 ? 90 : 270; return carry; }} outfit="#394043" skin="#dbb089" hat="#d7ab38" hatKind="hard">
        <mesh geometry={box} position={[0, -0.17, 0.05]} scale={[0.1, 0.06, 0.12]} material={mat("#b5634b")} />
      </Person>
      <Person get={() => (active ? hammer : null)} outfit="#394043" skin="#dbb089" hat="#eac763" hatKind="hard">
        <mesh geometry={box} position={[0, -0.17, 0.04]} scale={[0.02, 0.02, 0.12]} material={mat("#6b4a2b")} />
      </Person>
      <Person get={() => foreman} outfit="#303137" skin="#e1ae83" hat="#f2c846" hatKind="hard">
        <mesh geometry={box} position={[0, -0.15, 0.05]} scale={[0.09, 0.12, 0.012]} material={mat("#d3c8aa")} />
      </Person>
      {/* Tower crane: lattice mast, rotating jib with counterweight and hook */}
      <group position={[18.9, 0.22, 16.9]}>
        <mesh geometry={box} position={[0, 2.0, 0]} scale={[0.16, 4.0, 0.16]} material={yellow} castShadow />
        {Array.from({ length: 13 }, (_, i) => <mesh key={i} geometry={box} position={[0, 0.2 + i * 0.3, 0.081]} rotation={[0, 0, i % 2 ? 0.75 : -0.75]} scale={[0.21, 0.02, 0.005]} material={mat("#a97720")} />)}
        <group ref={jib} position={[0, 4.0, 0]}>
          <mesh geometry={box} position={[0, 0.1, 0]} scale={[0.26, 0.22, 0.26]} material={mat("#e8b642", { rough: 0.5 })} castShadow />
          <mesh geometry={box} position={[0.11, 0.12, 0.13]} scale={[0.04, 0.12, 0.005]} material={darkGlass} />
          <mesh geometry={box} position={[1.05, 0.25, 0]} scale={[2.3, 0.1, 0.1]} material={yellow} castShadow />
          <mesh geometry={box} position={[-0.75, 0.25, 0]} scale={[1.1, 0.1, 0.12]} material={yellow} castShadow />
          <mesh geometry={box} position={[-1.15, 0.12, 0]} scale={[0.3, 0.22, 0.24]} material={mat("#7c7765")} castShadow />
          <mesh geometry={box} position={[0, 0.48, 0]} scale={[0.06, 0.5, 0.06]} material={yellow} />
          <mesh geometry={box} position={[1.9, -1.05, 0]} scale={[0.01, 2.5, 0.01]} material={mat("#4c5357")} />
          <mesh geometry={box} position={[1.9, -2.32, 0]} scale={[0.08, 0.06, 0.08]} material={mat("#b9bfc0", { metal: 0.6, rough: 0.3 })} castShadow />
        </group>
      </group>
      {/* Digger with a working arm */}
      <group position={[20.1, 0, 22.0]}>
        <mesh geometry={box} position={[0, 0.06, 0]} scale={[0.6, 0.1, 0.42]} material={mat("#343b3d", { rough: 0.8 })} castShadow />
        <mesh geometry={box} position={[-0.05, 0.22, 0]} scale={[0.46, 0.22, 0.36]} material={mat("#e0a72f", { rough: 0.5 })} castShadow />
        <mesh geometry={box} position={[-0.12, 0.42, 0]} scale={[0.22, 0.2, 0.28]} material={mat("#e0a72f", { rough: 0.5 })} castShadow />
        <mesh geometry={box} position={[-0.12, 0.43, 0.141]} scale={[0.16, 0.12, 0.005]} material={darkGlass} />
        <mesh geometry={ball} position={[-0.2, 0.55, 0.1]} scale={0.03} material={beacon} />
        <group ref={arm} position={[0.15, 0.3, 0]}>
          <mesh geometry={box} position={[0.25, 0.15, 0]} rotation={[0, 0, 0.6]} scale={[0.6, 0.07, 0.07]} material={mat("#e5af43", { rough: 0.5 })} castShadow />
          <mesh geometry={box} position={[0.58, 0.12, 0]} rotation={[0, 0, -0.8]} scale={[0.4, 0.06, 0.06]} material={mat("#e5af43", { rough: 0.5 })} castShadow />
          <mesh geometry={box} position={[0.72, -0.05, 0]} scale={[0.14, 0.1, 0.14]} material={mat("#656a69", { metal: 0.4 })} castShadow />
        </group>
      </group>
    </>
  );
}

/* ------------------------------------------------------------------ traffic */

/** Same timing as the classic map's cars, driving on the left in their lane. */
export function carPositions(t: number) {
  const c1 = (t * 2.2) % 8, c2 = 11 + ((t * 1.7) % 12), c3 = ((t * 1.9 + 7) % (N + 4)) - 2;
  return [
    { x: c1, z: 8.5 - 0.35, heading: 90 },
    { x: c2, z: 13.3 - 0.35, heading: 90 },
    { x: 10 + 0.35, z: c3, heading: 180 },
  ];
}

export function Traffic() {
  const colours = ["var(--town-car-red)", "var(--town-car-blue)", "var(--town-car-yellow)"].map((c) => townColor(c));
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(() => {
    carPositions(performance.now() / 1000).forEach((c, i) => {
      const g = refs.current[i];
      if (!g) return;
      g.position.set(c.x, 0, c.z);
      g.rotation.y = Math.PI - c.heading * DEG;
      // Fade the wrap-around so cars do not pop at the end of their run.
      g.visible = c.x > -0.4 && c.z > -0.4 && c.x < N + 0.4 && c.z < N + 0.4;
    });
  });
  return (
    <>
      {colours.map((c, i) => (
        <group key={i} ref={(el) => { refs.current[i] = el; }}>
          <Car colour={c} />
        </group>
      ))}
      <group position={[8.4, 0, 9.25]} rotation={[0, Math.PI / 2 + 0.08, 0]}>
        <Car colour="#74695e" wreck />
      </group>
    </>
  );
}

/** Rounded little car, nose towards local +Z. */
export function Car({ colour, wreck = false }: { colour: string; wreck?: boolean }) {
  const paint = mat(colour, { rough: wreck ? 0.95 : 0.35, metal: wreck ? 0 : 0.25 });
  const trim = mat(wreck ? "#4a3f37" : shade(colour, -0.35), { rough: 0.6 });
  const tyre = mat("#232427", { rough: 0.8 });
  const rounded = useMemo(() => roundedBox(0.34, 0.14, 0.62, 0.05), []);
  const cabinGeo = useMemo(() => roundedBox(0.3, 0.13, 0.34, 0.05), []);
  return (
    <group rotation={[0, 0, wreck ? 0.05 : 0]}>
      <mesh geometry={plane} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.021, 0]} scale={[0.5, 0.8, 1]} material={blob()} renderOrder={2} />
      <mesh geometry={rounded} position={[0, 0.13, 0]} material={paint} castShadow receiveShadow />
      <mesh geometry={cabinGeo} position={[0, 0.25, -0.04]} material={paint} castShadow receiveShadow />
      <mesh geometry={box} position={[0, 0.255, -0.04]} scale={[0.305, 0.09, 0.3]} material={wreck ? mat("#6d7a80", { rough: 0.9 }) : darkGlass} />
      {[[-0.16, 0.19], [0.16, 0.19], [-0.16, -0.19], [0.16, -0.19]].map(([x, z], i) => (
        (!wreck || i !== 3) && <mesh key={i} geometry={cyl} position={[x!, wreck && i === 1 ? 0.05 : 0.065, z!]} rotation={[0, 0, Math.PI / 2]} scale={[0.065, 0.05, 0.065]} material={tyre} castShadow />
      ))}
      {!wreck && [-0.1, 0.1].map((x) => <mesh key={x} geometry={box} position={[x, 0.14, 0.311]} scale={[0.06, 0.03, 0.01]} material={lampBulb} />)}
      {[-0.11, 0.11].map((x) => <mesh key={x} geometry={box} position={[x, 0.14, -0.311]} scale={[0.06, 0.03, 0.01]} material={mat("#b02a2a", { rough: 0.4 })} />)}
      <mesh geometry={box} position={[0, 0.07, 0.31]} scale={[0.3, 0.04, 0.02]} material={trim} />
      {wreck && [[-0.2, 0.1], [0.22, -0.25], [0.15, 0.3]].map(([x, z], i) => <mesh key={i} geometry={ball} position={[x!, 0.03, z!]} scale={[0.06, 0.05, 0.06]} material={mat("#5e8a3e", { rough: 1 })} />)}
    </group>
  );
}

const roundCache = new Map<string, THREE.BufferGeometry>();
function roundedBox(w: number, h: number, d: number, r: number) {
  const key = `${w}|${h}|${d}|${r}`;
  let g = roundCache.get(key);
  if (!g) {
    const s = new THREE.Shape();
    const x = -w / 2 + r, y = -h / 2 + r, ww = w - 2 * r, hh = h - 2 * r;
    s.moveTo(x, y - r);
    s.lineTo(x + ww, y - r);
    s.quadraticCurveTo(x + ww + r, y - r, x + ww + r, y);
    s.lineTo(x + ww + r, y + hh);
    s.quadraticCurveTo(x + ww + r, y + hh + r, x + ww, y + hh + r);
    s.lineTo(x, y + hh + r);
    s.quadraticCurveTo(x - r, y + hh + r, x - r, y + hh);
    s.lineTo(x - r, y);
    s.quadraticCurveTo(x - r, y - r, x, y - r);
    g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * r, bevelEnabled: true, bevelSize: r * 0.8, bevelThickness: r, bevelSegments: 2, curveSegments: 3 });
    g.translate(0, 0, -(d - 2 * r) / 2);
    roundCache.set(key, g);
  }
  return g;
}
