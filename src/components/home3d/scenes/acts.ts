import type { ActFn, Pose, PersonRig } from "@/components/Character3D";
import type { ActName } from "@/lib/cutscenes";

/**
 * Cutscene performances. Each act layers over one of the Person base poses and drives the rig
 * procedurally (no animation files). Angles: an arm's rotation.x of -π/2 points it forward, -π up;
 * `reach(side, k)` bends it by shortening (k 1 = straight, ~0.45 = hands at the shoulder).
 * A barbell spans both hands, so barbell acts keep the arms parallel (no splay).
 */
export type ActSpec = { pose: Pose; walking?: boolean; run: ActFn };

const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** 0→1→0 repetition curve with a held top, `rate` reps per second. */
const rep = (t: number, rate: number) => {
  const c = (t * rate) % 1;
  return ease(c < 0.45 ? c / 0.45 : c < 0.6 ? 1 : 1 - (c - 0.6) / 0.4);
};

function arms(r: PersonRig, x: number, k = 1, splay = 0) {
  r.armL.rotation.x = x; r.armR.rotation.x = x;
  r.armL.rotation.z = -splay; r.armR.rotation.z = splay;
  r.reach("l", k); r.reach("r", k);
}

/** Lying on the back: arms then point "forward" (up toward the ceiling) at -π/2. */
function lieBack(r: PersonRig) {
  r.legL.rotation.x = 0.05; r.legR.rotation.x = -0.05;
}

export function actFor(name: ActName, tired: boolean): ActSpec {
  const tempo = tired ? 0.62 : 1;
  const wobble = (r: PersonRig, t: number) => {
    if (!tired) return;
    r.body.rotation.z += Math.sin(t * 5.3) * 0.045;
    r.head.rotation.x += 0.18;
  };
  switch (name) {
    case "bench":
      return { pose: "lying", run: (r, t) => {
        lieBack(r);
        const p = rep(t, 0.85 * tempo);
        arms(r, -Math.PI / 2, 0.42 + 0.58 * p);
        r.head.rotation.x = -0.15;
        if (tired) r.armL.rotation.x += Math.sin(t * 9) * 0.05;
      } };
    case "press":
      return { pose: "standing", run: (r, t) => {
        const p = rep(t, 0.9 * tempo);
        arms(r, -Math.PI + 0.08 * (1 - p), 0.45 + 0.55 * p, 0.45 * (1 - p));
        r.body.position.y -= 0.006 * (1 - p);
        r.head.rotation.x = -0.12;
        wobble(r, t);
      } };
    case "squat":
      return { pose: "standing", run: (r, t) => {
        const d = rep(t, 0.75 * tempo);
        arms(r, -3.4, 0.4); // bar racked across the upper back
        r.body.position.y -= 0.085 * d;
        r.body.rotation.x = 0.28 * d;
        r.legL.rotation.x = r.legR.rotation.x = -1.15 * d;
        r.legL.rotation.z = -0.12 * d; r.legR.rotation.z = 0.12 * d;
        r.head.rotation.x = -0.25 * d;
        wobble(r, t);
      } };
    case "deadlift":
      return { pose: "standing", run: (r, t) => {
        const p = rep(t, 0.7 * tempo);
        const lean = 0.95 * (1 - p);
        r.body.rotation.x = lean;
        r.body.position.y -= 0.05 * (1 - p);
        r.body.position.z -= 0.06 * (1 - p);
        r.legL.rotation.x = r.legR.rotation.x = -0.55 * (1 - p);
        arms(r, -lean, 1);
        r.head.rotation.x = -0.45 * (1 - p);
        wobble(r, t);
      } };
    case "run":
      return { pose: "standing", walking: true, run: (r) => {
        r.body.rotation.x = 0.16;
        r.armL.rotation.x *= 1.3; r.armR.rotation.x *= 1.3;
        r.reach("l", 0.8); r.reach("r", 0.8);
      } };
    case "sleep":
      return { pose: "lying", run: (r, t) => {
        lieBack(r);
        arms(r, 0.05, 1);
        r.body.position.y += Math.sin(t * 1.9) * 0.004;
        r.head.rotation.y = 0.55;
      } };
    case "cook":
      return { pose: "standing", run: (r, t) => {
        const turn = ease((t - 2.35) / 0.45);
        r.root.rotation.y += Math.PI * turn;
        if (turn < 0.5) {
          r.armR.rotation.x = -1.05 + Math.sin(t * 8 * tempo) * 0.14;
          r.armR.rotation.z = Math.cos(t * 8 * tempo) * 0.2;
          r.armL.rotation.x = -0.85;
          r.reach("r", 0.75); r.reach("l", 0.7);
          r.head.rotation.x = 0.3;
          r.body.rotation.x = 0.06;
        } else {
          // Turns to the camera: a taste and a thumbs-up.
          r.armR.rotation.x = -2.5 - Math.sin(t * 6) * 0.1;
          r.reach("r", 0.6);
          r.armL.rotation.x = -0.3;
          r.head.rotation.x = -0.15;
        }
      } };
    case "watch":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = -0.14;
        r.head.rotation.x = tired ? 0.35 + Math.sin(t * 0.9) * 0.08 : Math.sin(t * 1.3) * 0.05;
        r.head.rotation.y = Math.sin(t * 0.7) * 0.1;
      } };
    case "laugh":
      return { pose: "sitting", run: (r, t) => {
        const fit = Math.max(0, Math.sin(t * 2.2));
        r.body.rotation.x = -0.12 - 0.16 * fit + Math.sin(t * 22) * 0.025 * fit;
        r.head.rotation.x = -0.35 * fit;
        r.armL.rotation.x = -0.7; r.armR.rotation.x = -0.7;
        r.armL.rotation.z = 0.35; r.armR.rotation.z = -0.35;
      } };
    case "jacks":
      return { pose: "standing", run: (r, t) => {
        const p = Math.abs(Math.sin(t * Math.PI * 1.25 * tempo));
        r.root.position.y += 0.05 * p;
        r.armL.rotation.z = -2.7 * p; r.armR.rotation.z = 2.7 * p;
        r.legL.rotation.z = -0.32 * p; r.legR.rotation.z = 0.32 * p;
        wobble(r, t);
      } };
    case "game":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = 0.12;
        r.body.rotation.z = Math.sin(t * 3.1) * 0.14;
        arms(r, -1.15 + Math.sin(t * 17) * 0.03, 0.62);
        r.head.rotation.x = 0.1;
        // A celebratory fist pump near the end.
        if (t > 2.4 && t < 3.0) { r.armR.rotation.x = -2.9; r.reach("r", 0.7); }
      } };
    case "type":
      return { pose: "sitting", run: (r, t) => {
        const eureka = t > 1.9 && t < 2.6;
        r.body.rotation.x = 0.18;
        arms(r, -1.25, 0.72);
        r.armL.rotation.x += Math.sin(t * 21) * 0.06;
        r.armR.rotation.x += Math.sin(t * 21 + Math.PI) * 0.06;
        r.head.rotation.x = 0.22 + Math.sin(t * 2) * 0.04;
        if (eureka) { r.armR.rotation.x = -2.95; r.reach("r", 1); r.head.rotation.x = -0.25; r.body.rotation.x = -0.05; }
        wobble(r, t);
      } };
    case "read":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = 0.05;
        arms(r, -1.0, 0.6);
        r.armL.rotation.z = 0.12; r.armR.rotation.z = -0.12;
        r.head.rotation.x = 0.38;
        const flip = (t % 1.3) / 1.3;
        if (flip > 0.82) r.armR.rotation.z = -0.12 - Math.sin((flip - 0.82) / 0.18 * Math.PI) * 0.5;
      } };
    case "relax":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = -0.22;
        arms(r, -2.85, 0.42, 0.75);
        r.head.rotation.x = -0.1 + Math.sin(t * 0.8) * 0.04;
      } };
  }
}
