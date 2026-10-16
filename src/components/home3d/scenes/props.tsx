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

/** What each hand grips for a held prop. */
export function heldProps(held: HeldProp | null): { left?: ReactNode; right?: ReactNode } {
  switch (held) {
    case "barbell": return { right: <Barbell /> };
    case "dumbbells": return { left: <Dumbbell />, right: <Dumbbell /> };
    case "book": return { right: <Book /> };
    case "controller": return { right: <Controller /> };
    case "spoon": return { right: <Spoon /> };
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
