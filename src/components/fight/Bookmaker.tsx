import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import { Person, type PersonState, type PersonRig } from "@/components/Character3D";
import { Ball, Box, Cyl, Group } from "@/components/home3d/primitives";
import { Sign } from "@/components/home3d/venues/kit";

/**
 * Ron, The Tipsy Stick's bookmaker: checked jacket, trilby, bow tie, a stub of pencil and a little notebook of
 * everybody's debts. He stands by his odds board at the edge of the dance floor, which doubles as the fight floor.
 * Drawn in fixture space (front toward +z) at room scale.
 */
export const BOOKIE_NAME = "Ron the bookie";
const ROOM_SCALE = 1.8;

function bookieAct(r: PersonRig, t: number) {
  // Licks the pencil, writes in the book, glances up at the room for customers.
  const write = (t % 5) < 3.4;
  r.armL.rotation.x = -1.05; r.armL.rotation.z = 0.25; r.reach("l", 0.55);
  r.armR.rotation.x = write ? -1.0 + Math.sin(t * 9) * 0.06 : -2.2; r.armR.rotation.z = write ? 0.35 : 0.1; r.reach("r", write ? 0.6 : 0.45);
  r.head.rotation.x = write ? 0.3 : -0.05;
  r.head.rotation.y = write ? 0.1 : Math.sin(t * 1.2) * 0.4;
  r.body.rotation.z = Math.sin(t * 0.8) * 0.02;
}

export function BookieFigure({ get, scale = ROOM_SCALE }: { get: () => PersonState | null; scale?: number }) {
  return (
    <Person get={get} outfit="#b88a3a" skin="#e2b08a" hat="#3a2e26" hatKind="flat" legs="#3a2e26" scale={scale}
      headExtra={<>
        {/* trilby brim, pencil behind the ear, a moustache with ambitions */}
        <Cyl rad={0.15} h={0.012} p={[0, 0.17, 0.01]} c="#3a2e26" shadow={false} />
        <Cyl rad={0.006} h={0.09} p={[0.108, 0.12, 0]} r={[0.3, 0, 0.5]} c="#e0b84a" shadow={false} />
        <Box s={[0.07, 0.016, 0.016]} p={[0, 0.058, 0.104]} c="#5a3a22" shadow={false} />
      </>}
      bodyExtra={<>
        {/* checked jacket, red bow tie, cash satchel */}
        {[0.24, 0.3, 0.36, 0.42].map((y) => <Box key={y} s={[0.196, 0.006, 0.156]} p={[0, y, 0]} c="#7a5a22" shadow={false} />)}
        <Box s={[0.05, 0.025, 0.01]} p={[0, 0.425, 0.077]} c="#b8433c" shadow={false} />
        <Ball rad={0.012} p={[0, 0.425, 0.083]} c="#8a2a2a" shadow={false} />
        <Box s={[0.012, 0.25, 0.012]} p={[0.04, 0.33, 0.06]} r={[0, 0, 0.5]} c="#4a3226" shadow={false} />
        <Box s={[0.09, 0.07, 0.04]} p={[0.09, 0.22, 0.04]} c="#5a3a26" shadow={false} />
      </>}
      heldL={<Group p={[0, -0.02, 0.04]} r={[0.9, 0, 0]}><Box s={[0.08, 0.008, 0.1]} c="#2b2a2e" /><Box s={[0.07, 0.004, 0.09]} p={[0, 0.006, 0]} c="#f4ead6" shadow={false} /></Group>}
      heldR={<Cyl rad={0.006} h={0.07} p={[0, -0.02, 0.03]} r={[0.8, 0, 0]} c="#e0b84a" shadow={false} />}
    />
  );
}

/** The odds board: tonight's scraps chalked up, with Ron's cash tin on a stool. */
export function OddsBoard() {
  return (
    <Group>
      <Box s={[0.05, 1.5, 0.05]} p={[-0.45, 0.75, -0.32]} c="#3a2418" />
      <Box s={[0.05, 1.5, 0.05]} p={[0.45, 0.75, -0.32]} c="#3a2418" />
      <Box s={[1.0, 0.75, 0.04]} p={[0, 1.3, -0.3]} c="#3a2418" />
      <Sign p={[0, 1.48, -0.275]} w={0.9} h={0.28} text="FIGHT NIGHT" bg="#1e2a24" fg="#f4ead6" border="#3a2418" />
      <Sign p={[0, 1.16, -0.275]} w={0.9} h={0.3} text="$20 · $50 · $100" bg="#1e2a24" fg="#e0b84a" border="#3a2418" />
      <Cyl rad={0.17} h={0.05} p={[0.5, 0.48, 0.1]} c="#6a4428" />
      <Cyl rad={0.025} h={0.46} p={[0.5, 0.23, 0.1]} c="#2b2a2e" />
      <Box s={[0.22, 0.1, 0.15]} p={[0.5, 0.56, 0.1]} c="#7a8a8e" o={{ metal: 0.6, rough: 0.35 }} />
    </Group>
  );
}

/** Interactive fixture for the pub-brawl slot: Ron and his board. Keeps the room drawing while he fidgets. */
export function BookmakerFixture() {
  const { invalidate } = useThree();
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    if (reduce) return;
    const id = window.setInterval(() => invalidate(), 66);
    return () => window.clearInterval(id);
  }, [invalidate]);
  const start = useRef(typeof performance === "undefined" ? 0 : performance.now());
  const state = useMemo<PersonState>(() => ({ x: 0, z: 0.05, angle: 180, walking: false, pose: "standing", visible: true, act: bookieAct }), []);
  return (
    <Group>
      <OddsBoard />
      <BookieFigure get={() => Object.assign(state, { actT: (performance.now() - start.current) / 1000 })} />
    </Group>
  );
}