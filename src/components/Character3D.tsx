import { useMemo, useRef, type ReactNode } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { mat } from "@/components/home3d/primitives";
import { shade } from "@/components/town3d/palette";
import { blobShadowTexture } from "@/components/town3d/textures";
const DEG = Math.PI / 180;
export type Pose = "standing" | "sitting" | "lying";
export type PersonState = { x: number; z: number; angle: number; walking: boolean; pose: Pose; visible: boolean; lift?: number; phase?: number; hammer?: boolean };

const capsule = new THREE.CapsuleGeometry(1, 1, 4, 10);
const ball = new THREE.SphereGeometry(1, 16, 12);
const box = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(1, 1, 1, 16);
const blobMat = new THREE.MeshBasicMaterial({ color: "#000000", transparent: true, depthWrite: false, opacity: 0.35 });
const plane = new THREE.PlaneGeometry(1, 1);
let blobReady = false;
export function blob() {
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
export function Person({ get, outfit, skin, hat, hatKind = "cap", shadow = true, scale = PERSON_SCALE, children }: {
  get: () => PersonState | null; outfit: string; skin: string; hat?: string; hatKind?: "cap" | "hard" | "beanie" | "flat"; shadow?: boolean; scale?: number; children?: ReactNode;
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
    r.scale.setScalar(scale);
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
    <group ref={root} dispose={null}>
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

