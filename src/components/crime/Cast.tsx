import { useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { Person, type PersonState } from "@/components/Character3D";
import { Ball, Box, Cone, Cyl, Group, Round } from "@/components/home3d/primitives";
import { Sign } from "@/components/home3d/venues/kit";
import { CAST_LOOKS, type CastId, type CastStyle, type MissionProp } from "@/lib/crime-cast";

/**
 * The underworld cast as drawn: one shared stick figure (the same model in the overhead town, in rooms and in
 * close-up), dressed per character with a few cheap pieces so each reads from a distance by silhouette alone.
 * Head pieces are in head space (sphere r 0.11 centred 0.085 above the neck, face toward +z); body pieces sit
 * on the torso (y 0.19–0.44, half-width 0.095).
 */
const torus = new THREE.TorusGeometry(1, 0.22, 6, 18);
function Ring({ p, r, rad, c, metal = false }: { p: [number, number, number]; r?: [number, number, number]; rad: number; c: string; metal?: boolean }) {
  const m = useMemo(() => new THREE.MeshStandardMaterial({ color: c, roughness: metal ? 0.3 : 0.5, metalness: metal ? 0.8 : 0 }), [c, metal]);
  return <mesh geometry={torus} position={p} rotation={r ?? [0, 0, 0]} scale={rad} material={m} />;
}

const GOLD = "#d9b45a";
const INK = "#1d1b20";

type Dress = { head: ReactNode; body: ReactNode; legs: string; eyes?: boolean };
function dress(style: CastStyle): Dress | null {
  switch (style) {
    case "mick": return {
      legs: "#5a1d2b",
      head: <>
        {/* slicked-back hair with a stubborn quiff, sunglasses parked on top, a permanent frown */}
        <Ball rad={0.116} sc={[0.117, 0.075, 0.118]} p={[0, 0.138, -0.014]} c="#2a2220" shadow={false} />
        <Ball rad={0.05} sc={[0.06, 0.042, 0.05]} p={[0, 0.195, 0.07]} c="#2a2220" shadow={false} />
        <Box s={[0.11, 0.02, 0.022]} p={[0, 0.2, 0.025]} c={INK} shadow={false} />
        {[-1, 1].map((s) => <Box key={s} s={[0.046, 0.013, 0.012]} p={[s * 0.04, 0.128, 0.102]} r={[0, 0, s * 0.28]} c="#2a2220" shadow={false} />)}
        <Box s={[0.035, 0.008, 0.01]} p={[0, 0.045, 0.106]} r={[0, 0, 0.12]} c="#7a4a3a" shadow={false} />
      </>,
      body: <>
        {/* puffer gilet over the maroon tracksuit makes him wide; gold chain over the top */}
        <mesh geometry={capsuleGeo} position={[0, 0.33, 0]} scale={[0.112, 0.07, 0.09]} material={mat("#1f2430", 0.6)} castShadow />
        <Ring p={[0, 0.415, 0.045]} r={[Math.PI / 2 - 0.5, 0, 0]} rad={0.055} c={GOLD} metal />
        <Box s={[0.006, 0.17, 0.006]} p={[0, 0.33, 0.093]} c="#c9ccd2" shadow={false} />
      </>,
    };
    case "lez": return {
      legs: "#4a5a7a",
      head: <>
        {/* a mop that has not met a comb this decade, stubble, heavy eyelids */}
        <Ball rad={0.126} sc={[0.128, 0.095, 0.128]} p={[0, 0.15, -0.012]} c="#6b4a2b" shadow={false} />
        {[[0.095, 0.12, 0.03], [-0.098, 0.115, 0.02], [0.05, 0.215, -0.04], [-0.06, 0.205, 0.045], [0, 0.13, -0.105], [0.07, 0.17, 0.07]].map(([x, y, z], i) => <Ball key={i} rad={0.042} p={[x!, y!, z!]} c={i % 2 ? "#7a5634" : "#6b4a2b"} shadow={false} />)}
        <Ball rad={0.07} sc={[0.07, 0.03, 0.04]} p={[0, 0.005, 0.078]} c="#8a6a50" shadow={false} />
        {[-1, 1].map((s) => <Box key={s} s={[0.034, 0.013, 0.012]} p={[s * 0.038, 0.111, 0.104]} c="#a97f62" shadow={false} />)}
      </>,
      body: <>
        {/* open flannel over a tee that has seen things */}
        <Box s={[0.05, 0.17, 0.008]} p={[0, 0.33, 0.074]} c="#cfc6b0" shadow={false} />
      </>,
    };
    case "nia": return {
      legs: "#1d1d22",
      head: <>
        {/* tight high bun, gold hoops, one eyebrow permanently raised */}
        <Ball rad={0.116} sc={[0.117, 0.088, 0.117]} p={[0, 0.128, -0.016]} c="#17141a" shadow={false} />
        <Ball rad={0.056} p={[0, 0.232, -0.035]} c="#17141a" shadow={false} />
        {[-1, 1].map((s) => <Ring key={s} p={[s * 0.108, 0.05, 0]} r={[0, Math.PI / 2, 0]} rad={0.02} c={GOLD} metal />)}
        <Box s={[0.04, 0.01, 0.01]} p={[-0.04, 0.128, 0.102]} r={[0, 0, 0.08]} c="#17141a" shadow={false} />
        <Box s={[0.04, 0.01, 0.01]} p={[0.04, 0.14, 0.1]} r={[0, 0, -0.3]} c="#17141a" shadow={false} />
      </>,
      body: <>
        {/* bomber jacket: ribbed collar, gold zip */}
        <mesh geometry={capsuleGeo} position={[0, 0.43, 0]} scale={[0.07, 0.012, 0.06]} material={mat("#c9772e", 0.7)} />
        <Box s={[0.006, 0.2, 0.006]} p={[0, 0.32, 0.078]} c={GOLD} shadow={false} />
        <Box s={[0.2, 0.02, 0.16]} p={[0, 0.2, 0]} c="#24423f" shadow={false} />
      </>,
    };
    case "clerk": return {
      legs: "#5a4a3a",
      head: <>
        {/* bald on top, grey at the sides, round glasses, a pencil behind the ear */}
        {[-1, 1].map((s) => <Ball key={s} rad={0.05} sc={[0.04, 0.05, 0.07]} p={[s * 0.1, 0.085, -0.025]} c="#b9b4aa" shadow={false} />)}
        <Box s={[0.12, 0.006, 0.05]} p={[0, 0.192, 0.01]} r={[0, 0, 0.12]} c="#b9b4aa" shadow={false} />
        {[-1, 1].map((s) => <Ring key={s} p={[s * 0.04, 0.1, 0.106]} rad={0.027} c={INK} />)}
        <Box s={[0.022, 0.005, 0.005]} p={[0, 0.1, 0.11]} c={INK} shadow={false} />
        <Cyl rad={0.006} h={0.09} p={[0.108, 0.13, 0]} r={[0.3, 0, 0.5]} c="#e0b84a" shadow={false} />
      </>,
      body: <>
        {/* cardigan buttons, and the biscuit crumbs of a long afternoon */}
        {[0.25, 0.3, 0.35, 0.4].map((y) => <Ball key={y} rad={0.008} p={[0, y, 0.077]} c="#6b4a32" shadow={false} />)}
        {[[0.04, 0.37], [-0.035, 0.33], [0.05, 0.29], [-0.02, 0.4], [0.02, 0.27]].map(([x, y], i) => <Ball key={i} rad={0.005} p={[x!, y!, 0.078]} c="#c99a5a" shadow={false} />)}
      </>,
    };
    case "stranger": return {
      legs: "#5a5a5e",
      head: <>
        <Box s={[0.06, 0.016, 0.016]} p={[0, 0.058, 0.104]} c="#3a2a22" shadow={false} />
        {[-1, 1].map((s) => <Box key={s} s={[0.04, 0.009, 0.01]} p={[s * 0.04, 0.125, 0.102]} c="#3a2a22" shadow={false} />)}
      </>,
      body: <>
        {/* belted trench coat with the collar up, long enough to look like a plan */}
        <mesh geometry={capsuleGeo} position={[0, 0.205, 0]} scale={[0.104, 0.075, 0.083]} material={mat("#9a8a6a", 0.8)} castShadow />
        <Box s={[0.205, 0.022, 0.17]} p={[0, 0.275, 0]} c="#6f6248" shadow={false} />
        {[-1, 1].map((s) => <Box key={s} s={[0.045, 0.07, 0.02]} p={[s * 0.045, 0.43, 0.05]} r={[0.3, 0, s * -0.3]} c="#8a7a5a" shadow={false} />)}
      </>,
    };
    case "shopkeeper": return {
      legs: "#2b2a2e",
      head: <>
        <Ball rad={0.115} sc={[0.116, 0.07, 0.116]} p={[0, 0.14, -0.018]} c="#9a9690" shadow={false} />
        <Ball rad={0.085} sc={[0.088, 0.05, 0.062]} p={[0, 0.032, 0.056]} c="#9a9690" shadow={false} />
        {[-1, 1].map((s) => <Box key={s} s={[0.034, 0.012, 0.006]} p={[s * 0.04, 0.094, 0.11]} c={INK} shadow={false} />)}
      </>,
      body: <>
        {/* green apron with a neck strap: the uniform of someone who knows where everything is */}
        <Box s={[0.15, 0.25, 0.012]} p={[0, 0.27, 0.078]} c="#3d6a4a" shadow={false} />
        <Box s={[0.15, 0.02, 0.014]} p={[0, 0.39, 0.079]} c="#2f5539" shadow={false} />
        <Box s={[0.05, 0.04, 0.004]} p={[0.03, 0.31, 0.086]} c="#f4f1ea" shadow={false} />
      </>,
    };
    case "buyer": return {
      legs: "#3a3256",
      eyes: false,
      head: <>
        {/* sunglasses, indoors, at night. Discreet. */}
        <Ball rad={0.115} sc={[0.117, 0.072, 0.117]} p={[0, 0.14, -0.012]} c="#d9c27a" shadow={false} />
        <Box s={[0.03, 0.03, 0.08]} p={[0.07, 0.17, 0.04]} r={[0, 0, -0.3]} c="#c9b06a" shadow={false} />
        {[-1, 1].map((s) => <Round key={s} s={[0.045, 0.03, 0.012]} p={[s * 0.04, 0.1, 0.106]} c="#111014" rad={0.008} o={{ rough: 0.1, metal: 0.4 }} shadow={false} />)}
        <Box s={[0.02, 0.006, 0.006]} p={[0, 0.105, 0.11]} c="#111014" shadow={false} />
        {[-1, 1].map((s) => <Box key={`a${s}`} s={[0.005, 0.006, 0.09]} p={[s * 0.104, 0.105, 0.06]} c="#111014" shadow={false} />)}
      </>,
      body: <>
        <Box s={[0.05, 0.17, 0.01]} p={[0, 0.33, 0.075]} c="#f4f1ea" shadow={false} />
        <Box s={[0.02, 0.13, 0.012]} p={[0, 0.32, 0.08]} c="#b8433c" shadow={false} />
      </>,
    };
    case "player": return null;
  }
}
const capsuleGeo = new THREE.CapsuleGeometry(1, 1, 4, 10);
const matCache = new Map<string, THREE.MeshStandardMaterial>();
function mat(c: string, rough: number) {
  const k = c + rough;
  let m = matCache.get(k);
  if (!m) { m = new THREE.MeshStandardMaterial({ color: c, roughness: rough }); matCache.set(k, m); }
  return m;
}

/* ------------------------------------------------------------------ props in hand (person units) */

export function heldProp(kind: MissionProp | undefined): ReactNode {
  switch (kind) {
    case "ledger-open": case "ledger": return <Group p={[-0.02, -0.02, 0.04]} r={[0.9, 0, 0]}><Box s={[0.15, 0.012, 0.1]} c="#2f5d4a" /><Box s={[0.14, 0.006, 0.09]} p={[0, 0.009, 0]} c="#f6f0df" shadow={false} /></Group>;
    case "envelope": return <Box s={[0.075, 0.05, 0.006]} p={[0, -0.03, 0.03]} c="#e3cf9a" />;
    case "parcel": return <Group p={[0, -0.04, 0.05]}><Box s={[0.12, 0.08, 0.09]} c="#c9a77c" /><Box s={[0.122, 0.015, 0.092]} c="#6a8fc9" shadow={false} /></Group>;
    case "phone": return <Box s={[0.022, 0.048, 0.008]} p={[0, 0.015, 0.02]} c={INK} />;
    case "binoculars": return <Group p={[-0.03, 0, 0.04]}>{[-0.02, 0.02].map((x) => <Cyl key={x} rad={0.015} h={0.06} p={[x, 0, 0]} r={[Math.PI / 2, 0, 0]} c={INK} />)}</Group>;
    case "traffic-cone": return <Group p={[0, -0.09, 0.02]} r={[Math.PI, 0, 0]}><Cone rad={0.05} h={0.15} c="#ef6a2a" /><Cyl rad={0.034} h={0.02} p={[0, 0.0, 0]} c="#f4f1ea" shadow={false} /></Group>;
    case "birthday-card": return <Box s={[0.07, 0.09, 0.004]} p={[0, -0.02, 0.03]} c="#f2c4c0" />;
    case "cash": return <Box s={[0.07, 0.035, 0.006]} p={[0, -0.02, 0.03]} c="#4f9a5a" />;
    default: return null;
  }
}

/** A cast member: the shared figure, dressed. `get` supplies position, pose and the current act every frame. */
export function CastPerson({ id, get, scale, held, heldLeft, outfit, skin }: { id: CastId; get: () => PersonState | null; scale?: number; held?: MissionProp | undefined; heldLeft?: MissionProp | undefined; outfit?: string; skin?: string }) {
  const style: CastStyle = id;
  const look = id === "player" ? null : CAST_LOOKS[id];
  const d = dress(style);
  return (
    <Person
      get={get}
      outfit={outfit ?? look?.outfit ?? "#3b4f7a"}
      skin={skin ?? look?.skin ?? "#e8c3a0"}
      {...(look?.hat ? { hat: look.hat, hatKind: look.hatKind ?? "cap" } : {})}
      {...(scale ? { scale } : {})}
      stretch={look?.stretch ?? 1}
      {...(d ? { headExtra: d.head, bodyExtra: d.body, legs: d.legs, eyes: d.eyes ?? true } : {})}
      heldR={heldProp(held)}
      heldL={heldProp(heldLeft)}
    />
  );
}

/* ------------------------------------------------------------------ mission props in the world (metres) */

export function MissionPropMesh({ kind }: { kind: MissionProp }) {
  switch (kind) {
    case "ledger": case "ledger-open": return (
      <Group>
        <Box s={[0.34, 0.025, 0.25]} p={[0, 0.012, 0]} c="#2f5d4a" />
        <Box s={[0.32, 0.012, 0.23]} p={[0, 0.03, 0]} c="#f6f0df" shadow={false} />
        {Array.from({ length: 7 }, (_, i) => <Box key={i} s={[0.12 + (i % 3) * 0.03, 0.002, 0.006]} p={[-0.07, 0.037, -0.09 + i * 0.03]} c={i % 2 ? "#b8433c" : "#3a3a44"} shadow={false} />)}
        {Array.from({ length: 5 }, (_, i) => <Box key={`r${i}`} s={[0.1, 0.002, 0.006]} p={[0.08, 0.037, -0.07 + i * 0.035]} r={[0, 0.4, 0]} c="#b8433c" shadow={false} />)}
        <Cyl rad={0.006} h={0.16} p={[0.11, 0.04, 0.06]} r={[0, 0.6, Math.PI / 2]} c="#e0b84a" shadow={false} />
      </Group>
    );
    case "soup-coupon": return (
      <Group>
        <Box s={[0.14, 0.003, 0.07]} p={[0, 0.002, 0]} c="#f2c94c" shadow={false} />
        <Box s={[0.14, 0.004, 0.015]} p={[0, 0.003, -0.02]} c="#b8433c" shadow={false} />
        <Cyl rad={0.015} h={0.004} p={[0.04, 0.004, 0.012]} c="#b8433c" shadow={false} />
      </Group>
    );
    case "biscuits": return (
      <Group>
        <Cyl rad={0.1} h={0.012} p={[0, 0.006, 0]} c="#f4f1ea" />
        {[[-0.03, 0.02], [0.03, 0.025], [0, -0.03], [0.04, -0.02]].map(([x, z], i) => <Cyl key={i} rad={0.028} h={0.01} p={[x!, 0.017 + i * 0.004, z!]} c="#c99a5a" />)}
        {[[0.13, 0.05], [0.16, -0.04], [-0.14, 0.08], [0.11, 0.1]].map(([x, z], i) => <Ball key={i} rad={0.005} p={[x!, 0.003, z!]} c="#c99a5a" shadow={false} />)}
      </Group>
    );
    case "pie-sign": return (
      <Group>
        {[-1, 1].map((s) => <Box key={s} s={[0.5, 0.75, 0.025]} p={[0, 0.38, s * 0.12]} r={[s * 0.16, 0, 0]} c="#2b2a2e" />)}
        <Sign p={[0, 0.48, 0.15]} r={[0.16, 0, 0]} w={0.44} h={0.5} text="STAKE PEIS · SOON" bg="#2b2a2e" fg="#f6efe0" border="#6b4a32" />
      </Group>
    );
    case "envelope": return <Box s={[0.18, 0.006, 0.11]} p={[0, 0.004, 0]} c="#e3cf9a" />;
    case "wheelbarrow": return (
      <Group>
        {/* the disputed wheelbarrow, returned with a lawnmower tied to it */}
        <Box s={[0.55, 0.2, 0.75]} p={[0, 0.42, 0]} c="#3d7a4a" o={{ rough: 0.6, metal: 0.3 }} />
        <Cyl rad={0.16} h={0.07} p={[0, 0.16, 0.48]} r={[0, 0, Math.PI / 2]} c="#1d1e20" />
        {[-1, 1].map((s) => <Box key={s} s={[0.03, 0.03, 0.75]} p={[s * 0.22, 0.38, -0.45]} r={[0.25, 0, 0]} c="#6b4a32" />)}
        {[-1, 1].map((s) => <Box key={`l${s}`} s={[0.03, 0.3, 0.03]} p={[s * 0.2, 0.17, -0.25]} c="#5a6066" />)}
        <Group p={[0, 0.58, 0.02]} r={[0, 0.3, 0]}>
          <Round s={[0.42, 0.18, 0.5]} p={[0, 0.09, 0]} c="#c0392b" rad={0.05} />
          <Cyl rad={0.07} h={0.08} p={[0, 0.22, 0.02]} c="#2b2a2e" />
          <Box s={[0.03, 0.03, 0.55]} p={[0.15, 0.3, -0.35]} r={[0.7, 0, 0]} c="#2b2a2e" />
          <Box s={[0.03, 0.03, 0.55]} p={[-0.15, 0.3, -0.35]} r={[0.7, 0, 0]} c="#2b2a2e" />
        </Group>
        {[-0.12, 0.12].map((z) => <Box key={z} s={[0.6, 0.012, 0.015]} p={[0, 0.66, z]} c="#e0c890" shadow={false} />)}
      </Group>
    );
    case "parcel": return <Group><Box s={[0.26, 0.17, 0.2]} p={[0, 0.085, 0]} c="#c9a77c" /><Box s={[0.262, 0.03, 0.202]} p={[0, 0.085, 0]} c="#6a8fc9" shadow={false} /></Group>;
    case "pint": return <Group><Cyl rad={0.045} h={0.16} p={[0, 0.08, 0]} c="#c98a2a" o={{ opacity: 0.85, rough: 0.1 }} /><Cyl rad={0.046} h={0.03} p={[0, 0.17, 0]} c="#f4ead6" shadow={false} /></Group>;
    case "small-table": return <Group><Cyl rad={0.34} h={0.04} p={[0, 0.74, 0]} c="#6b4a32" /><Cyl rad={0.04} h={0.72} p={[0, 0.36, 0]} c="#2b2a2e" /><Cyl rad={0.2} h={0.03} p={[0, 0.015, 0]} c="#2b2a2e" /></Group>;
    case "stool": return <Group><Cyl rad={0.17} h={0.06} p={[0, 0.44, 0]} c="#7a2a2a" /><Cyl rad={0.025} h={0.42} p={[0, 0.21, 0]} c="#c9ccd2" /><Cyl rad={0.14} h={0.02} p={[0, 0.01, 0]} c="#c9ccd2" /></Group>;
    case "trolley": return (
      <Group r={[0, 0, 0.04]}>
        {/* battered shopping trolley: one wheel at an angle, the basket bent */}
        <Box s={[0.5, 0.012, 0.8]} p={[0, 0.45, 0]} c="#9aa5aa" o={{ metal: 0.7, rough: 0.35 }} />
        {[-0.25, 0.25].map((x) => <Box key={x} s={[0.012, 0.42, 0.8]} p={[x, 0.66, 0]} c="#9aa5aa" o={{ metal: 0.7, rough: 0.35, opacity: 0.55 }} shadow={false} />)}
        {[-0.4, 0.4].map((z) => <Box key={z} s={[0.5, 0.42, 0.012]} p={[0, 0.66, z]} c="#9aa5aa" o={{ metal: 0.7, rough: 0.35, opacity: 0.55 }} shadow={false} />)}
        {Array.from({ length: 6 }, (_, i) => <Box key={i} s={[0.5, 0.008, 0.008]} p={[0, 0.5 + i * 0.07, 0.401]} c="#7d878c" shadow={false} />)}
        <Cyl rad={0.018} h={0.6} p={[0, 0.95, -0.48]} r={[0, 0, Math.PI / 2]} c="#c0392b" />
        {[-0.2, 0.2].map((x) => <Box key={x} s={[0.02, 0.5, 0.02]} p={[x, 0.7, -0.44]} r={[-0.25, 0, 0]} c="#9aa5aa" />)}
        {[[-0.2, -0.32, 0], [0.2, -0.32, 0], [-0.2, 0.32, 0], [0.2, 0.32, 0.6]].map(([x, z, ry], i) => <Group key={i} p={[x!, 0.05, z!]} r={[0, ry!, 0]}><Cyl rad={0.05} h={0.03} r={[0, 0, Math.PI / 2]} c="#1d1e20" /><Box s={[0.02, 0.4, 0.02]} p={[0, 0.22, 0]} c="#9aa5aa" /></Group>)}
        {/* its contents: a barely-alive plant, a birthday card and one traffic cone */}
        <Group p={[-0.1, 0.46, -0.12]}><MissionPropMesh kind="plant" /></Group>
        <Group p={[0.12, 0.46, 0.15]} r={[0.3, 0, 0]}><MissionPropMesh kind="traffic-cone" /></Group>
        <Group p={[0.13, 0.62, -0.2]} r={[0.25, 0.4, 0]}><MissionPropMesh kind="birthday-card" /></Group>
      </Group>
    );
    case "plant": return (
      <Group>
        <Cyl rad={0.09} h={0.16} p={[0, 0.08, 0]} c="#b8673e" />
        <Cyl rad={0.08} h={0.01} p={[0, 0.16, 0]} c="#3a2a22" shadow={false} />
        <Cyl rad={0.008} h={0.22} p={[0, 0.27, 0]} r={[0, 0, 0.2]} c="#6a7a3a" shadow={false} />
        {[[0.05, 0.36, 0.3, "#7a8a3a"], [-0.06, 0.3, -0.5, "#8a7a3a"], [0.02, 0.24, 1.2, "#a08a4a"]].map(([x, y, r, c], i) => <Ball key={i} rad={0.05} sc={[0.06, 0.012, 0.03]} p={[x as number, y as number, 0]} c={c as string} shadow={false} />)}
        <Ball rad={0.03} sc={[0.035, 0.008, 0.02]} p={[0.06, 0.17, 0.05]} c="#a08a4a" shadow={false} />
      </Group>
    );
    case "birthday-card": return (
      <Group>
        <Box s={[0.16, 0.2, 0.006]} p={[0, 0.1, 0]} c="#f2c4c0" />
        <Ball rad={0.025} p={[0, 0.13, 0.005]} sc={[0.025, 0.025, 0.004]} c="#e0b84a" shadow={false} />
        <Box s={[0.1, 0.012, 0.004]} p={[0, 0.06, 0.005]} c="#b8433c" shadow={false} />
      </Group>
    );
    case "traffic-cone": return (
      <Group>
        <Box s={[0.36, 0.035, 0.36]} p={[0, 0.017, 0]} c="#e05a1a" />
        <Cone rad={0.15} h={0.5} p={[0, 0.27, 0]} c="#ef6a2a" />
        <Cyl rad={0.09} h={0.07} p={[0, 0.33, 0]} c="#f4f1ea" shadow={false} />
      </Group>
    );
    case "binoculars": return <Group>{[-0.04, 0.04].map((x) => <Cyl key={x} rad={0.03} h={0.12} p={[x, 0.03, 0]} r={[Math.PI / 2, 0, 0]} c={INK} />)}</Group>;
    case "phone": return <Box s={[0.07, 0.01, 0.14]} p={[0, 0.005, 0]} c={INK} />;
    case "cash": return <Box s={[0.15, 0.02, 0.07]} p={[0, 0.01, 0]} c="#4f9a5a" />;
  }
}