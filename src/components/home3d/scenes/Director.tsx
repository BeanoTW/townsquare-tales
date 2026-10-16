import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { Cutscene } from "@/lib/cutscenes";
import type { HomePlan } from "@/lib/home3d/layout";
import type { WalkerHandle } from "../HomeWalker";
import { actFor } from "./acts";
import { WorldProps } from "./props";

/** The camera's cinematic goal while a scene plays; the rig eases toward it and back. */
export type Cine = { active: boolean; tx: number; tz: number; dist: number; el: number };

/** DOM pieces of the overlay the director animates frame by frame (no React re-renders). */
export type CineOverlay = {
  barTop: HTMLDivElement | null; barBottom: HTMLDivElement | null; title: HTMLDivElement | null;
  gains: HTMLDivElement | null; tint: HTMLDivElement | null;
};

export const SKIP_EVENT = "tst-cutscene-skip";
const OUTRO = 0.5;
const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
const smooth = (x: number) => { const c = clamp01(x); return c * c * (3 - 2 * c); };

export function Director({ cut, plan, walker, cine, overlay, onDone }: {
  cut: Cutscene;
  plan: HomePlan;
  walker: MutableRefObject<WalkerHandle>;
  cine: MutableRefObject<Cine>;
  overlay: MutableRefObject<CineOverlay>;
  onDone: () => void;
}) {
  const { camera, size, invalidate } = useThree();
  const t = useRef(0);
  const finished = useRef(false);
  const spec = useMemo(() => actFor(cut.act, cut.tired), [cut.act, cut.tired]);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;
  const slot = plan.slots.find((s) => s.id === cut.slotId);

  // A new scene starts from the top; skipping jumps to the outro.
  useEffect(() => {
    t.current = 0;
    finished.current = false;
    // Frame the actor slightly north of their feet so the whole body sits mid-frame.
    cine.current = { active: true, tx: cut.x, tz: cut.z - 0.15, dist: cut.short ? cut.frame.dist * 1.15 : cut.frame.dist, el: cut.frame.el };
    const skip = () => { t.current = Math.max(t.current, cut.duration - OUTRO); invalidate(); };
    window.addEventListener(SKIP_EVENT, skip);
    invalidate();
    return () => {
      window.removeEventListener(SKIP_EVENT, skip);
      cine.current = { ...cine.current, active: false };
      walker.current.scene = null;
    };
  }, [cut, cine, walker, invalidate]);

  useFrame((_, raw) => {
    if (finished.current) return;
    const dt = Math.min(raw, 0.05);
    t.current += dt;
    // Dev-only freeze frame for visual QA (screenshots of a given moment).
    const frozen = import.meta.env.DEV && typeof window !== "undefined" ? (window as { __TST_SCENE_T?: number }).__TST_SCENE_T : undefined;
    if (frozen !== undefined) t.current = Math.min(frozen, cut.duration - 0.01);
    const now = t.current, dur = cut.duration;
    const actT = Math.max(0, now - 0.25);
    walker.current.scene = {
      x: cut.x, z: cut.z, angle: cut.angle, lift: cut.lift, pose: spec.pose,
      walking: Boolean(spec.walking), phase: now * 13, act: spec.run, actT,
    };
    if (now >= dur - OUTRO) cine.current.active = false;

    // Letterbox, title and gains.
    const o = overlay.current;
    const inK = smooth(now / 0.45), outK = smooth((dur - now) / OUTRO);
    const k = Math.min(inK, outK);
    const bar = (cut.short ? 6 : 10) * k;
    if (o.barTop) o.barTop.style.height = `${bar}%`;
    if (o.barBottom) o.barBottom.style.height = `${bar}%`;
    if (o.title) o.title.style.opacity = String(Math.min(smooth((now - 0.25) / 0.35), outK));
    if (o.tint) o.tint.style.opacity = cut.night ? String(0.62 * Math.sin(Math.PI * clamp01(now / dur))) : "0";
    if (o.gains) {
      const start = cut.short ? 0.35 : Math.min(1.1, dur * 0.32);
      const g = clamp01((now - start) / 0.5);
      tmp.set(cut.x, cut.lift + 1.3, cut.z).project(camera);
      const x = (tmp.x * 0.5 + 0.5) * size.width;
      const y = (-tmp.y * 0.5 + 0.5) * size.height - 26 * smooth(g) - 10 * clamp01((now - start) / dur);
      o.gains.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%) scale(${(0.85 + 0.15 * smooth(g)).toFixed(3)})`;
      o.gains.style.opacity = String(Math.min(smooth(g * 1.6), outK));
    }

    if (now >= dur) {
      finished.current = true;
      walker.current.scene = null;
      cine.current.active = false;
      doneRef.current();
    }
    invalidate();
  });

  return slot && cut.world.length > 0 ? (
    <group position={[slot.x, 0, slot.z]} rotation={[0, slot.rot, 0]}>
      <WorldProps props={cut.world} />
    </group>
  ) : null;
}
