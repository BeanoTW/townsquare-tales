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


/** Turn on the spot by `amount` radians over [from, from+dur]. */
const turn = (r: PersonRig, t: number, from: number, amount = Math.PI, dur = 0.4) => { r.root.rotation.y += amount * ease((t - from) / dur); };
/** Walk/run legs and arms by hand (the base walk cycle is off during acts). */
function stride(r: PersonRig, t: number, speed: number, amp: number) {
  const sw = Math.sin(t * speed) * amp;
  r.legL.rotation.x = sw; r.legR.rotation.x = -sw;
  r.armL.rotation.x = -sw * 0.8; r.armR.rotation.x = sw * 0.8;
  r.body.position.y += Math.abs(Math.cos(t * speed)) * 0.012;
}
/** Move along the current facing (after any turn) by `d` metres. */
function advance(r: PersonRig, d: number) {
  r.root.position.x += Math.sin(r.root.rotation.y) * d;
  r.root.position.z += Math.cos(r.root.rotation.y) * d;
}
/** Both hands out front holding something (box, tray, parcel). */
const hold = (r: PersonRig, x = -1.25, k = 0.55) => arms(r, x, k);
/** Turn to the camera and pump a fist. */
function celebrate(r: PersonRig, t: number, from: number) {
  turn(r, t, from);
  if (t < from + 0.25) return;
  const b = Math.abs(Math.sin((t - from) * 7));
  r.armR.rotation.x = -2.95; r.reach("r", 0.65 + 0.35 * b);
  r.armL.rotation.x = -0.4;
  r.root.position.y += 0.05 * b;
  r.head.rotation.x = -0.2;
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

    // ── Phase 3: milestones ──
    case "victory":
      return { pose: "standing", run: (r, t) => {
        // Walk up, then both arms high, hopping, with a spin at the peak.
        if (t < 0.9) { stride(r, t, 9, 0.4); advance(r, -0.6 + (t / 0.9) * 0.6); return; }
        const b = Math.abs(Math.sin((t - 0.9) * 6));
        r.armL.rotation.x = -2.95; r.armR.rotation.x = -3.05;
        r.armL.rotation.z = -0.3 - 0.1 * b; r.armR.rotation.z = 0.25;
        r.reach("l", 0.75 + 0.25 * b); r.reach("r", 1);
        r.root.position.y += 0.09 * b;
        r.head.rotation.x = -0.25;
        r.root.rotation.y += Math.PI * 2 * ease((t - 2.4) / 0.8);
      } };
    case "keys":
      return { pose: "standing", run: (r, t) => {
        if (t < 2.0) {
          // Jangle the new keys at the camera.
          r.armR.rotation.x = -2.7 + Math.sin(t * 18) * 0.08; r.armR.rotation.z = Math.sin(t * 18) * 0.12; r.reach("r", 0.9);
          r.armL.rotation.x = -0.3; r.root.position.y += 0.03 * Math.abs(Math.sin(t * 5));
          r.head.rotation.x = -0.2;
          return;
        }
        if (t < 3.6) {
          // Turn and stride up the path to the front door.
          turn(r, t, 2.0);
          stride(r, t, 9, 0.45);
          advance(r, Math.min(0.9, (t - 2.2) * 0.65));
          return;
        }
        // At the door: turn back round to wave goodbye to the old life.
        turn(r, t, 2.0);
        advance(r, 0.9);
        turn(r, t, 3.6);
        r.armR.rotation.x = -2.8; r.armR.rotation.z = 0.35 * Math.sin(t * 9); r.reach("r", 1);
      } };
    case "hire":
      return { pose: "standing", run: (r, t) => {
        if (t < 1.7) {
          r.armR.rotation.x = -1.45 + Math.sin(t * 11) * 0.09 * (t > 0.5 ? 1 : 0); r.reach("r", 0.95);
          r.head.rotation.y = 0.15; r.body.rotation.x = 0.06;
          return;
        }
        // Square up to the camera (world-forward) and punch the air.
        r.root.rotation.y *= 1 - ease((t - 1.7) / 0.4);
        const b = Math.abs(Math.sin((t - 1.7) * 7));
        r.armR.rotation.x = -2.95; r.reach("r", 0.65 + 0.35 * b);
        r.armL.rotation.x = -0.4; r.root.position.y += 0.05 * b; r.head.rotation.x = -0.2;
      } };
    case "tear":
      return { pose: "standing", run: (r, t) => {
        if (t < 1.8) {
          // Read it one last time.
          arms(r, -1.25, 0.65);
          r.head.rotation.x = 0.35 + Math.sin(t * 2) * 0.05;
          return;
        }
        // Rip! The hands fly apart with a half each, then a victory hop.
        const k = ease((t - 1.8) / 0.25);
        arms(r, -1.25 - 1.5 * ease((t - 2.4) / 0.4), 0.65 + 0.35 * k, 0.9 * k);
        r.head.rotation.x = 0.35 - 0.6 * k;
        if (t > 2.4) r.root.position.y += 0.08 * Math.abs(Math.sin((t - 2.4) * 6));
      } };
    // ── Phase 2: venues ──
    case "scan":
      return { pose: "standing", run: (r, t) => {
        const sweep = Math.sin(t * 5 * tempo);
        r.armR.rotation.x = -1.2; r.armR.rotation.z = 0.5 * sweep; r.reach("r", 0.8);
        r.armL.rotation.x = -1.0; r.armL.rotation.z = -0.25 - 0.2 * sweep; r.reach("l", 0.7);
        r.head.rotation.x = 0.3; r.head.rotation.y = -0.2 * sweep;
        wobble(r, t);
      } };
    case "pay":
      return { pose: "standing", run: (r, t) => {
        const out = ease((t - 0.3) / 0.4) * (1 - ease((t - 1.6) / 0.4));
        r.armR.rotation.x = -0.4 - 1.15 * out; r.reach("r", 0.6 + 0.4 * out);
        r.head.rotation.x = 0.15 * out;
        if (t > 2.2) { r.head.rotation.x = -0.1; r.head.rotation.y = Math.sin((t - 2.2) * 6) * 0.1; }
      } };
    case "collect":
      return { pose: "standing", run: (r, t) => {
        if (t < 1.2) { const out = Math.sin(Math.PI * Math.min(1, t / 1.2)); r.armR.rotation.x = -0.4 - 1.1 * out; r.reach("r", 0.6 + 0.4 * out); return; }
        // Counting the notes: both hands in, thumb flicking.
        turn(r, t, 1.2, Math.PI);
        arms(r, -1.1, 0.55);
        r.armR.rotation.z = -0.15 + Math.sin(t * 16) * 0.12;
        r.head.rotation.x = 0.4;
      } };
    case "atm":
      return { pose: "standing", run: (r, t) => {
        if (t < 1.6) { r.armR.rotation.x = -1.35 + Math.max(0, Math.sin(t * 11)) * 0.12; r.reach("r", 0.8); r.armR.rotation.z = 0.1 * Math.sin(t * 3); r.head.rotation.x = 0.1; return; }
        if (t < 2.2) { r.armR.rotation.x = -1.0; r.reach("r", 0.95); r.head.rotation.x = 0.3; return; }
        celebrate(r, t, 2.2);
      } };
    case "sign":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = 0.2;
        arms(r, -1.2, 0.7);
        if (t < 2.0) { r.armR.rotation.z = Math.sin(t * 14) * 0.12; r.armR.rotation.x += Math.cos(t * 14) * 0.05; r.head.rotation.x = 0.35; }
        else { r.body.rotation.x = -0.1; r.armR.rotation.x = -2.9; r.reach("r", 0.7); r.head.rotation.x = -0.15; }
      } };
    case "munch":
      return { pose: "standing", run: (r, t) => {
        const bite = rep(t, 0.9);
        r.armR.rotation.x = -1.2 - 1.15 * bite; r.reach("r", 0.75 - 0.3 * bite);
        r.armL.rotation.x = -0.3;
        r.head.rotation.x = -0.05 + Math.sin(t * 14) * 0.04 * (1 - bite);
      } };
    case "eat":
      return { pose: "sitting", run: (r, t) => {
        const bite = rep(t, 0.8);
        r.body.rotation.x = 0.18;
        r.armR.rotation.x = -1.1 - 1.2 * bite; r.reach("r", 0.7 - 0.25 * bite);
        r.armL.rotation.x = -1.1; r.reach("l", 0.7);
        r.head.rotation.x = 0.25 - 0.2 * bite + Math.sin(t * 13) * 0.03;
      } };
    case "flip":
      return { pose: "standing", run: (r, t) => {
        const c = (t * 1.2 * tempo) % 1;
        const flick = c > 0.7 ? Math.sin((c - 0.7) / 0.3 * Math.PI) : 0;
        r.armR.rotation.x = -1.0 - 0.8 * flick; r.reach("r", 0.8);
        r.armL.rotation.x = -0.9; r.armL.rotation.z = -0.2; r.reach("l", 0.7);
        r.head.rotation.x = 0.35 - 0.3 * flick;
        r.body.rotation.x = 0.08;
        if (t > 2.6) celebrate(r, t, 2.6);
      } };
    case "serve":
      return { pose: "standing", run: (r, t) => {
        r.armL.rotation.x = -1.5; r.reach("l", 0.55);
        r.armR.rotation.x = -1.25 + Math.sin(t * 3) * 0.1; r.armR.rotation.z = 0.2 * Math.sin(t * 2.2); r.reach("r", 0.8);
        r.body.rotation.z = Math.sin(t * 2.4) * 0.04;
        r.head.rotation.y = Math.sin(t * 1.5) * 0.25;
        wobble(r, t);
      } };
    case "shovel":
      return { pose: "standing", run: (r, t) => {
        const dig = rep(t, 0.75 * tempo);
        r.body.rotation.x = 0.15 + 0.45 * (1 - dig);
        arms(r, -0.55 - 0.9 * dig - 0.45 * (1 - dig) + 0.45, 0.85);
        r.armL.rotation.z = -0.25;
        r.legL.rotation.x = -0.25 * (1 - dig);
        r.body.position.y -= 0.02 * (1 - dig);
        r.head.rotation.x = 0.25 * (1 - dig);
        wobble(r, t);
      } };
    case "carry":
      return { pose: "standing", run: (r, t) => {
        // Load up, then haul it a few steps.
        stride(r, t, 9 * tempo, t > 1.1 ? 0.45 : 0);
        hold(r);
        r.body.rotation.x = -0.08;
        if (t > 1.1) advance(r, Math.min(0.9, (t - 1.1) * 0.5));
        wobble(r, t);
      } };
    case "write":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = 0.25;
        arms(r, -1.25, 0.68);
        r.armR.rotation.z = Math.sin(t * 9) * 0.1;
        r.head.rotation.x = 0.4;
        if (t > 2.1 && t < 2.9) { r.armR.rotation.x = -3.05; r.reach("r", 1); r.head.rotation.x = -0.2; r.body.rotation.x = 0; }
        wobble(r, t);
      } };
    case "heal":
      return { pose: "lying", run: (r, t) => {
        lieBack(r);
        arms(r, 0.05, 1);
        r.body.position.y += Math.sin(t * 1.6) * 0.004;
        if (t > 2.2) { r.armR.rotation.x = -Math.PI / 2; r.reach("r", 0.75); r.head.rotation.x = -0.3; }
      } };
    case "board":
      return { pose: "standing", run: (r, t) => {
        r.head.rotation.x = -0.35;
        if (t > 1.0 && t < 2.0) { r.armL.rotation.x = -1.45; r.armL.rotation.z = 0.5; r.reach("l", 0.6); r.head.rotation.x = 0.35; r.head.rotation.y = 0.3; }
        if (t >= 2.0) {
          turn(r, t, 2.0);
          r.head.rotation.x = -0.1;
          r.armR.rotation.x = -2.8; r.armR.rotation.z = 0.35 * Math.sin(t * 9); r.reach("r", 1);
        }
      } };
    case "sell":
      return { pose: "standing", run: (r, t) => {
        const out = ease((t - 0.2) / 0.5) * (1 - ease((t - 1.6) / 0.4));
        arms(r, -0.9 - 0.55 * out, 0.6 + 0.4 * out);
        r.head.rotation.x = 0.2;
        if (t > 2.1) { turn(r, t, 2.1); r.armR.rotation.x = -1.7; r.reach("r", 0.75); r.armL.rotation.x = -0.3; r.head.rotation.y = Math.sin(t * 5) * 0.12; }
      } };
    case "payfine":
      return { pose: "standing", run: (r, t) => {
        r.head.rotation.x = 0.45; r.body.rotation.x = 0.12;
        r.body.position.y -= 0.01 + Math.max(0, Math.sin(t * 1.2)) * 0.008;
        const out = ease((t - 0.8) / 0.8) * (1 - ease((t - 2.3) / 0.5));
        r.armR.rotation.x = -0.25 - 1.15 * out; r.reach("r", 0.6 + 0.4 * out);
        r.armL.rotation.x = 0.1;
      } };
    case "drink":
      return { pose: "sitting", run: (r, t) => {
        r.body.rotation.x = 0.06;
        r.armL.rotation.x = -1.0; r.reach("l", 0.7);
        if (t < 0.6) { r.armR.rotation.x = -1.1; r.reach("r", 0.75); return; }
        if (t < 1.9) { const up = ease((t - 0.6) / 0.35); r.armR.rotation.x = -1.1 - 1.3 * up; r.reach("r", 0.75 - 0.3 * up); r.head.rotation.x = -0.4 * up; r.body.rotation.x = 0.06 - 0.12 * up; return; }
        if (t < 2.3) { r.armR.rotation.x = -1.1; r.reach("r", 0.75); r.head.rotation.x = 0.05; return; }
        // Spin round on the stool and raise the glass to the room.
        turn(r, t, 2.3, Math.PI, 0.45);
        r.armR.rotation.x = -2.9; r.reach("r", 0.9); r.head.rotation.x = -0.15;
        r.root.position.y += 0.02 * Math.abs(Math.sin(t * 7));
      } };
    case "dance":
      return { pose: "standing", run: (r, t) => {
        const beat = t * 6.5;
        r.body.rotation.z = Math.sin(beat) * 0.16;
        r.root.position.y += 0.03 * Math.abs(Math.sin(beat));
        r.armL.rotation.x = -2.5 + Math.sin(beat) * 0.5; r.armL.rotation.z = -0.3;
        r.armR.rotation.x = -0.8 - Math.sin(beat + Math.PI) * 0.6; r.armR.rotation.z = 0.3;
        r.legL.rotation.z = -0.12 * Math.max(0, Math.sin(beat)); r.legR.rotation.z = 0.12 * Math.max(0, -Math.sin(beat));
        r.head.rotation.z = Math.sin(beat) * 0.12;
        r.root.rotation.y += Math.PI * 2 * ease((t - 1.5) / 0.7);
      } };
    case "dice-win":
    case "dice-lose": {
      const win = name === "dice-win";
      return { pose: "standing", run: (r, t) => {
        if (t < 1.1) { r.armR.rotation.x = -1.3 + Math.sin(t * 22) * 0.15; r.reach("r", 0.55); r.armL.rotation.x = -0.6; r.head.rotation.x = 0.15; return; }
        if (t < 1.5) { const k = ease((t - 1.1) / 0.25); r.armR.rotation.x = -1.3 - 0.5 * k; r.reach("r", 0.55 + 0.45 * k); r.body.rotation.x = 0.15 * k; r.head.rotation.x = 0.3; return; }
        if (win) {
          const b = Math.abs(Math.sin((t - 1.5) * 7));
          r.armL.rotation.x = r.armR.rotation.x = -2.95; r.reach("l", 0.7 + 0.3 * b); r.reach("r", 0.7 + 0.3 * (1 - b));
          r.armL.rotation.z = -0.35; r.armR.rotation.z = 0.35;
          r.root.position.y += 0.07 * b; r.head.rotation.x = -0.3;
        } else {
          const k = ease((t - 1.5) / 0.5);
          r.body.rotation.x = 0.28 * k; r.head.rotation.x = 0.5 * k;
          arms(r, -2.55 * k, 1 - 0.55 * k, 0.55 * k);
          r.body.position.y -= 0.02 * k;
        }
      } };
    }
    case "promote":
    case "apply":
      return { pose: "standing", run: (r, t) => {
        if (t < 1.6) {
          // Handshake (or a point at the vacancy) across the desk.
          r.armR.rotation.x = name === "apply" && t < 0.8 ? -2.0 : -1.45 + Math.sin(t * 11) * 0.09 * (t > 0.5 ? 1 : 0);
          r.reach("r", 0.95);
          r.body.rotation.x = 0.08; r.head.rotation.x = 0.05 + Math.sin(t * 4) * 0.05;
          return;
        }
        celebrate(r, t, 1.6);
      } };
    case "resign":
      return { pose: "standing", run: (r, t) => {
        hold(r, -1.2, 0.55);
        r.head.rotation.y = Math.sin(t * 3.2) * 0.35 * (1 - ease((t - 1.6) / 0.5));
        r.head.rotation.x = 0.25;
        r.body.position.y -= 0.01;
        if (t > 1.6) { stride(r, t, 7, 0.3); hold(r, -1.2, 0.55); advance(r, (t - 1.6) * 0.35); }
      } };
    case "bounce":
      return { pose: "sitting", run: (r, t) => {
        if (t < 1.6) { r.root.position.y += 0.06 * Math.abs(Math.sin(t * 7)) * (1 - t / 1.6); arms(r, -0.3, 1, 0.35); r.head.rotation.x = -0.15; return; }
        r.body.rotation.x = -0.22; arms(r, -2.85, 0.42, 0.75); r.head.rotation.x = -0.1;
      } };
    case "flop":
      return { pose: "lying", run: (r, t) => {
        lieBack(r);
        r.root.position.y += 0.12 * Math.abs(Math.sin(t * 6)) * Math.max(0, 1 - t / 1.2);
        const wave = Math.sin(t * 4) * 0.35;
        r.armL.rotation.z = -1.1 - wave; r.armR.rotation.z = 1.1 + wave;
        r.legL.rotation.z = -0.15 - wave * 0.4; r.legR.rotation.z = 0.15 + wave * 0.4;
        r.head.rotation.y = Math.sin(t * 1.5) * 0.3;
      } };
    case "rob":
    case "caught": {
      const ok = name === "rob";
      return { pose: "standing", run: (r, t) => {
        if (t < 0.7) { r.armR.rotation.x = -1.5; r.reach("r", 1); r.body.rotation.x = 0.25; r.head.rotation.y = Math.sin(t * 9) * 0.3; return; }
        turn(r, t, 0.7, Math.PI, 0.25);
        const run = Math.max(0, t - 0.9);
        if (ok || t < 1.5) {
          stride(r, t, 15, 0.75);
          r.body.rotation.x = 0.25;
          if (ok) { r.armR.rotation.x = -0.2; r.reach("r", 1); }
          advance(r, Math.min(ok ? 2.4 : 0.8, run * 1.6));
          return;
        }
        // Trip over the sale sign: pitch forward and land flat.
        advance(r, 0.8 + 0.25 * ease((t - 1.5) / 0.3));
        const k = ease((t - 1.5) / 0.35);
        r.body.rotation.x = 0.25 + (Math.PI / 2 - 0.25) * k;
        r.body.position.y += 0.06 * k;
        arms(r, -2.6 * k, 1, 0.4 * k);
        r.legL.rotation.x = 0.3 * k; r.legR.rotation.x = -0.1 * k;
        r.head.rotation.x = -0.6 * k;
      } };
    }
  }
}
