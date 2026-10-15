import { useMemo, type ReactNode } from "react";
import * as THREE from "three";

/** Shared materials and geometry so the whole flat is a few dozen GPU resources, not hundreds. */
const materials = new Map<string, THREE.MeshStandardMaterial>();
export type MatOpts = { rough?: number; metal?: number; emissive?: string; glow?: number; opacity?: number; map?: THREE.Texture | null };
export function mat(colour: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = [colour, o.rough, o.metal, o.emissive, o.glow, o.opacity, o.map ? o.map.uuid : ""].join("|");
  let m = materials.get(key);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color: colour,
      roughness: o.rough ?? 0.75,
      metalness: o.metal ?? 0,
      ...(o.emissive ? { emissive: new THREE.Color(o.emissive), emissiveIntensity: o.glow ?? 1 } : {}),
      ...(o.opacity !== undefined && o.opacity < 1 ? { transparent: true, opacity: o.opacity, depthWrite: false } : {}),
      ...(o.map ? { map: o.map } : {}),
    });
    materials.set(key, m);
  }
  return m;
}

const boxGeo = new THREE.BoxGeometry(1, 1, 1);
const cylGeo = new THREE.CylinderGeometry(1, 1, 1, 20);
const sphGeo = new THREE.SphereGeometry(1, 18, 14);
const coneGeo = new THREE.CylinderGeometry(0.0001, 1, 1, 18);
const roundCache = new Map<string, THREE.BufferGeometry>();
/** A box with softly rounded edges, scaled to unit size and cached by bevel. */
function roundedGeo(w: number, h: number, d: number, r: number) {
  const key = [w, h, d, r].join("|");
  let g = roundCache.get(key);
  if (!g) {
    const rr = Math.max(0.002, Math.min(r, w / 2 - 0.002, h / 2 - 0.002, d / 2 - 0.002));
    const bs = rr * 0.9;
    const w2 = Math.max(0.004, w - 2 * bs);
    const h2 = Math.max(0.004, h - 2 * bs);
    const c = Math.min(rr * 0.4, w2 / 2, h2 / 2);
    const x = -w2 / 2;
    const y = -h2 / 2;
    const shape = new THREE.Shape();
    shape.moveTo(x + c, y);
    shape.lineTo(x + w2 - c, y);
    shape.quadraticCurveTo(x + w2, y, x + w2, y + c);
    shape.lineTo(x + w2, y + h2 - c);
    shape.quadraticCurveTo(x + w2, y + h2, x + w2 - c, y + h2);
    shape.lineTo(x + c, y + h2);
    shape.quadraticCurveTo(x, y + h2, x, y + h2 - c);
    shape.lineTo(x, y + c);
    shape.quadraticCurveTo(x, y, x + c, y);
    const depth = Math.max(0.002, d - 2 * rr);
    g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bs, bevelThickness: rr, bevelSegments: 2, curveSegments: 3 });
    g.translate(0, 0, -depth / 2);
    roundCache.set(key, g);
  }
  return g;
}

type V3 = [number, number, number];
type Common = { p?: V3; r?: V3; c?: string; o?: MatOpts; shadow?: boolean; name?: string; m?: THREE.Material };

/** Box with a given size, centred at p. */
export function Box({ s, p = [0, 0, 0], r, c = "#ccc", o, shadow = true, m }: Common & { s: V3 }) {
  return <mesh geometry={boxGeo} position={p} {...(r ? { rotation: r } : {})} scale={s} material={m ?? mat(c, o)} castShadow={shadow} receiveShadow />;
}
/** Softly rounded box (cushions, mattresses, chair seats). */
export function Round({ s, p = [0, 0, 0], r, c = "#ccc", o, rad = 0.04, shadow = true, m }: Common & { s: V3; rad?: number }) {
  const g = useMemo(() => roundedGeo(s[0], s[1], s[2], rad), [s[0], s[1], s[2], rad]); // eslint-disable-line react-hooks/exhaustive-deps
  return <mesh geometry={g} position={p} {...(r ? { rotation: r } : {})} material={m ?? mat(c, o)} castShadow={shadow} receiveShadow />;
}
/** Cylinder with radius rad and height h, standing on y. */
export function Cyl({ rad, h, p = [0, 0, 0], r, c = "#ccc", o, shadow = true, m }: Common & { rad: number; h: number }) {
  return <mesh geometry={cylGeo} position={p} {...(r ? { rotation: r } : {})} scale={[rad, h, rad]} material={m ?? mat(c, o)} castShadow={shadow} receiveShadow />;
}
export function Ball({ rad, p = [0, 0, 0], sc, c = "#ccc", o, shadow = true }: Common & { rad: number; sc?: V3 }) {
  return <mesh geometry={sphGeo} position={p} scale={sc ?? [rad, rad, rad]} material={mat(c, o)} castShadow={shadow} receiveShadow />;
}
export function Cone({ rad, h, p = [0, 0, 0], r, c = "#ccc", o, shadow = true }: Common & { rad: number; h: number }) {
  return <mesh geometry={coneGeo} position={p} {...(r ? { rotation: r } : {})} scale={[rad, h, rad]} material={mat(c, o)} castShadow={shadow} receiveShadow />;
}
export function Group({ p = [0, 0, 0], r, children }: { p?: V3; r?: V3; children?: ReactNode }) {
  return (
    <group position={p} {...(r ? { rotation: r } : {})}>
      {children}
    </group>
  );
}
