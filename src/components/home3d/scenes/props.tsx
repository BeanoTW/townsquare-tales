import type { ReactNode } from "react";
import type { HeldProp, WorldProp } from "@/lib/cutscenes";
import { Box, Cyl, Group, Round } from "../primitives";

/*
 * Held props live in hand space inside the scaled Person, so sizes are in person units
 * (≈ metres ÷ 1.7 at home scale). The right hand sits at body x = +0.11, so a two-handed
 * prop is centred 0.11 to its left.
 */
const STEEL = { rough: 0.3, metal: 0.85 };
const X = [0, 0, Math.PI / 2] as [number, number, number];

function Barbell() {
  return (
    <Group p={[-0.11, 0, 0]}>
      <Cyl rad={0.008} h={0.95} r={X} c="#c9ccd2" o={STEEL} shadow={false} />
      {[-0.4, 0.4].map((x) => <Cyl key={x} rad={0.11} h={0.03} p={[x, 0, 0]} r={X} c="#c0392b" o={{ rough: 0.45 }} />)}
      {[-0.44, 0.44].map((x) => <Cyl key={x} rad={0.085} h={0.025} p={[x, 0, 0]} r={X} c="#2d5f8a" o={{ rough: 0.45 }} />)}
      {[-0.47, 0.47].map((x) => <Cyl key={x} rad={0.016} h={0.02} p={[x, 0, 0]} r={X} c="#c9ccd2" o={STEEL} shadow={false} />)}
    </Group>
  );
}

function Dumbbell() {
  return (
    <Group>
      <Cyl rad={0.007} h={0.15} r={X} c="#c9ccd2" o={STEEL} shadow={false} />
      {[-0.06, 0.06].map((x) => <Cyl key={x} rad={0.035} h={0.03} p={[x, 0, 0]} r={X} c="#26272b" o={{ rough: 0.5 }} />)}
    </Group>
  );
}

function Book() {
  return (
    <Group p={[-0.11, 0.01, 0.02]} r={[0.5, 0, 0]}>
      <Box s={[0.15, 0.012, 0.11]} p={[-0.04, 0, 0]} r={[0, 0, 0.18]} c="#b55a51" shadow={false} />
      <Box s={[0.15, 0.012, 0.11]} p={[0.04, 0, 0]} r={[0, 0, -0.18]} c="#b55a51" shadow={false} />
      <Box s={[0.135, 0.006, 0.1]} p={[-0.04, 0.008, 0]} r={[0, 0, 0.18]} c="#f6f0df" shadow={false} />
      <Box s={[0.135, 0.006, 0.1]} p={[0.04, 0.008, 0]} r={[0, 0, -0.18]} c="#f6f0df" shadow={false} />
    </Group>
  );
}

function Controller() {
  return (
    <Group p={[-0.11, 0, 0.01]}>
      <Round s={[0.12, 0.025, 0.06]} c="#2b2d33" rad={0.012} shadow={false} />
      <Box s={[0.012, 0.006, 0.012]} p={[0.03, 0.015, 0]} c="#e05a4f" o={{ emissive: "#e05a4f", glow: 0.6 }} shadow={false} />
      <Box s={[0.012, 0.006, 0.012]} p={[-0.03, 0.015, 0]} c="#4a8fd9" o={{ emissive: "#4a8fd9", glow: 0.6 }} shadow={false} />
    </Group>
  );
}

function Spoon() {
  return (
    <Group p={[0, -0.04, 0.01]}>
      <Cyl rad={0.006} h={0.1} c="#b88b5f" shadow={false} />
      <Round s={[0.025, 0.01, 0.035]} p={[0, -0.055, 0]} c="#b88b5f" rad={0.004} shadow={false} />
    </Group>
  );
}

/**
 * Keeps a prop level while the arm holds it out at `arm` radians (the act's rotation.x): undoes the
 * arm's tilt and lifts the prop `up` along world-up so it rests on the hands rather than through them.
 */
function Level({ arm, up = 0, x = -0.11, children }: { arm: number; up?: number; x?: number; children: ReactNode }) {
  return (
    <group position={[x, Math.cos(arm) * up, -Math.sin(arm) * up]} rotation={[-arm, 0, 0]}>
      {children}
    </group>
  );
}
const CARD = "#b88b5f";
function Carton({ w = 0.22, h = 0.14, d = 0.16, c = CARD, tape = "#d9c7a0" }: { w?: number; h?: number; d?: number; c?: string; tape?: string }) {
  return (
    <>
      <Box s={[w, h, d]} c={c} o={{ rough: 0.9 }} />
      <Box s={[w + 0.002, 0.004, 0.03]} p={[0, h / 2, 0]} c={tape} shadow={false} />
    </>
  );
}
function Note() {
  return <Box s={[0.075, 0.004, 0.038]} p={[0, -0.01, 0.025]} c="#7fb36a" shadow={false} />;
}
function Pen() {
  return <Cyl rad={0.004} h={0.06} p={[0, -0.03, 0.01]} c="#2b3a67" shadow={false} />;
}
function Snack() {
  return <Box s={[0.06, 0.075, 0.018]} p={[0, -0.035, 0.012]} c="#e0b84a" shadow={false} />;
}
function Fork() {
  return <Cyl rad={0.004} h={0.07} p={[0, -0.035, 0.01]} c="#c9ccd2" o={STEEL} shadow={false} />;
}
function Spatula() {
  return (
    <Group p={[0, -0.05, 0]}>
      <Cyl rad={0.006} h={0.1} c="#2b2a2e" shadow={false} />
      <Box s={[0.05, 0.05, 0.004]} p={[0, -0.07, 0]} c="#c9ccd2" o={STEEL} shadow={false} />
    </Group>
  );
}
function Shovel() {
  return (
    <Group p={[0, -0.22, 0]}>
      <Cyl rad={0.008} h={0.48} c="#8a6a45" shadow={false} />
      <Box s={[0.1, 0.1, 0.01]} p={[0, -0.28, 0.01]} c="#5d6268" o={STEEL} />
    </Group>
  );
}
function Tray() {
  return (
    <Level arm={-1.5} up={0.02} x={0}>
      <Cyl rad={0.1} h={0.006} c="#c9ccd2" o={STEEL} shadow={false} />
      <Cyl rad={0.018} h={0.04} p={[0.04, 0.022, 0.02]} c="#f4f1ea" shadow={false} />
      <Cyl rad={0.018} h={0.04} p={[-0.035, 0.022, -0.02]} c="#f4f1ea" shadow={false} />
      <Round s={[0.06, 0.02, 0.05]} p={[-0.02, 0.014, 0.045]} c="#d9a24a" rad={0.008} shadow={false} />
    </Level>
  );
}
function Pint() {
  return (
    <Level arm={-1.1} up={0.03} x={0}>
      <Cyl rad={0.032} h={0.085} c="#d99a2b" o={{ opacity: 0.85, rough: 0.15 }} shadow={false} />
      <Cyl rad={0.033} h={0.018} p={[0, 0.05, 0]} c="#f6efe0" shadow={false} />
    </Level>
  );
}
function Dice() {
  return (
    <Group p={[0, -0.02, 0.02]}>
      <Box s={[0.022, 0.022, 0.022]} r={[0.4, 0.3, 0]} c="#f4f1ea" shadow={false} />
      <Box s={[0.022, 0.022, 0.022]} p={[0.025, 0.005, 0.005]} r={[0.1, 0.7, 0.2]} c="#c0392b" shadow={false} />
    </Group>
  );
}
function MoneyBag() {
  return (
    <Group p={[0, -0.07, 0]}>
      <Round s={[0.1, 0.1, 0.08]} c="#9c7650" rad={0.035} />
      <Box s={[0.03, 0.03, 0.002]} p={[0, 0, 0.041]} c="#e0b84a" shadow={false} />
    </Group>
  );
}

function Trophy() {
  return (
    <Group p={[0, 0.03, 0.02]}>
      <Box s={[0.05, 0.02, 0.05]} c="#3a2a22" />
      <Cyl rad={0.008} h={0.04} p={[0, 0.03, 0]} c="#e0b84a" o={{ metal: 0.8, rough: 0.25 }} shadow={false} />
      <Cyl rad={0.035} h={0.05} p={[0, 0.07, 0]} c="#e0b84a" o={{ metal: 0.8, rough: 0.25 }} />
    </Group>
  );
}
function Diploma() {
  return (
    <Group p={[0, -0.01, 0.02]} r={[0, 0, Math.PI / 2]}>
      <Cyl rad={0.014} h={0.12} c="#f4efe2" shadow={false} />
      <Cyl rad={0.016} h={0.015} c="#b5413a" shadow={false} />
    </Group>
  );
}
function Keys() {
  return (
    <Group p={[0, -0.03, 0.01]}>
      <Cyl rad={0.014} h={0.004} r={[Math.PI / 2, 0, 0]} c="#c9a24a" o={{ metal: 0.8, rough: 0.3 }} shadow={false} />
      <Box s={[0.008, 0.035, 0.003]} p={[0.008, -0.025, 0]} c="#c9a24a" o={{ metal: 0.8, rough: 0.3 }} shadow={false} />
      <Box s={[0.008, 0.03, 0.003]} p={[-0.01, -0.022, 0]} r={[0, 0, 0.3]} c="#9aa5aa" o={{ metal: 0.8, rough: 0.3 }} shadow={false} />
      <Round s={[0.02, 0.012, 0.006]} p={[0, 0.02, 0]} c="#e05a4f" rad={0.003} shadow={false} />
    </Group>
  );
}
/** One half of the loan agreement per hand: together they read as one sheet until it's torn. */
function ContractHalf({ side }: { side: 1 | -1 }) {
  return (
    <Group p={[side * -0.055, -0.03, 0.03]} r={[0.3, 0, 0]}>
      <Box s={[0.11, 0.15, 0.003]} p={[side * -0.0, 0, 0]} c="#f6f0df" shadow={false} />
      {[0.04, 0.015, -0.01, -0.035].map((y) => <Box key={y} s={[0.08, 0.004, 0.004]} p={[0, y, 0.002]} c="#9a948a" shadow={false} />)}
    </Group>
  );
}

/** What each hand grips for a held prop. */
export function heldProps(held: HeldProp | null): { left?: ReactNode; right?: ReactNode } {
  switch (held) {
    case "barbell": return { right: <Barbell /> };
    case "dumbbells": return { left: <Dumbbell />, right: <Dumbbell /> };
    case "book": return { right: <Book /> };
    case "controller": return { right: <Controller /> };
    case "spoon": return { right: <Spoon /> };
    case "cash": return { right: <Note /> };
    case "pen": return { right: <Pen /> };
    case "snack": return { right: <Snack /> };
    case "fork": return { right: <Fork /> };
    case "spatula": return { right: <Spatula /> };
    case "shovel": return { right: <Shovel /> };
    case "tray": return { left: <Tray /> };
    case "pint": return { right: <Pint /> };
    case "dice": return { right: <Dice /> };
    case "bag": return { right: <MoneyBag /> };
    case "box": return { right: <Level arm={-1.25} up={0.08}><Carton /></Level> };
    case "parcel": return { right: <Level arm={-1.25} up={0.06}><Carton w={0.18} h={0.1} d={0.13} c="#c9a77c" tape="#6a8fc9" /></Level> };
    case "crate": return { right: <Level arm={-1.25} up={0.07}><Carton w={0.22} h={0.1} d={0.15} c="#4f8a3e" tape="#e05a4f" /></Level> };
    case "toolbox": return { right: <Level arm={-1.25} up={0.06}><Carton w={0.2} h={0.09} d={0.1} c="#c0392b" tape="#2b2a2e" /></Level> };
    case "bricks": return { right: <Level arm={-1.25} up={0.07}><Carton w={0.14} h={0.12} d={0.08} c="#a9553a" tape="#cbbfa8" /></Level> };
    case "trainers": return { right: <Level arm={-1.2} up={0.05}><Carton w={0.18} h={0.08} d={0.11} c="#e07a3a" tape="#f4f1ea" /></Level> };
    case "clock": return { right: <Level arm={-1.2} up={0.05}><Cyl rad={0.045} h={0.03} r={[Math.PI / 2, 0, 0]} c="#c0392b" /><Cyl rad={0.036} h={0.032} r={[Math.PI / 2, 0, 0]} c="#f4f1ea" shadow={false} /></Level> };
    case "trophy": return { right: <Trophy /> };
    case "diploma": return { right: <Diploma /> };
    case "keys": return { right: <Keys /> };
    case "contract": return { left: <ContractHalf side={-1} />, right: <ContractHalf side={1} /> };
    default: return {};
  }
}

/** Fixture-local set dressing for a scene (in metres, inside the slot's transform). */
export function WorldProps({ props }: { props: WorldProp[] }) {
  return (
    <>
      {props.map((p, i) => p.kind === "blanket" && (
        <Group key={i} p={[p.x, p.y, p.z]}>
          <Round s={[p.w, 0.09, p.d]} c="#5f7fa8" rad={0.04} />
          <Round s={[p.w + 0.02, 0.1, 0.22]} p={[0, 0.01, -p.d / 2 + 0.08]} c="#f4efe2" rad={0.04} />
          {[-0.25, 0.1, 0.4].map((z) => <Box key={z} s={[p.w + 0.005, 0.005, 0.02]} p={[0, 0.047, z]} c="#7d9cc4" shadow={false} />)}
        </Group>
      ))}
    </>
  );
}
