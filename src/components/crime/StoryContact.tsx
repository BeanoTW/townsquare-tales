import { useEffect, useMemo, useRef } from "react";
import { useThree } from "@react-three/fiber";
import type { PersonState } from "@/components/Character3D";
import { CastPerson, MissionPropMesh } from "@/components/crime/Cast";
import { perform } from "@/components/crime/acting";
import type { VenueStoryScene } from "@/lib/crime-cast";

/** Contacts are drawn at the venues' human scale (about the height of the room's regulars). */
const ROOM_SCALE = 1.8;

/**
 * An underworld contact waiting in a real venue while their story's investigation is open: the person, in
 * character, and the props the scene is about. The room renders on demand, so while a contact is present the
 * scene is redrawn at a modest rate to keep them alive.
 */
export function StoryContact({ scene }: { scene: VenueStoryScene }) {
  const { invalidate } = useThree();
  useEffect(() => {
    const reduce = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
    if (reduce) { invalidate(); return; }
    const id = window.setInterval(() => invalidate(), 50);
    return () => window.clearInterval(id);
  }, [invalidate]);
  const c = scene.contact;
  const state = useRef<PersonState>({ x: c.x, z: c.z, angle: c.angle, walking: false, pose: c.pose, visible: true, lift: c.lift ?? 0 });
  const act = useMemo(() => perform(c.id, c.id === "stranger" ? "check-sign" : "idle", c.pose === "sitting"), [c.id, c.pose]);
  const start = useRef(typeof performance === "undefined" ? 0 : performance.now());
  return (
    <group>
      <CastPerson id={c.id} scale={ROOM_SCALE} held={c.held} get={() => Object.assign(state.current, { act, actT: (performance.now() - start.current) / 1000 })} />
      {scene.props.map((p, i) => (
        <group key={i} position={[p.x, p.y, p.z]} rotation={[0, p.rot, 0]} scale={p.scale ?? 1}><MissionPropMesh kind={p.kind} /></group>
      ))}
    </group>
  );
}