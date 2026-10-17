import type { ActFn, PersonRig } from "@/components/Character3D";
import type { CastStyle } from "@/lib/crime-cast";
import type { CastAct } from "@/lib/conversation-camera";

/**
 * Procedural acting for the underworld cast, layered over the shared stick-figure rig (no animation files).
 * Every character has an idle that tells you who they are, and their own way of performing the director's
 * gestures: Mick jabs and puffs up, Lez drifts and stalls mid-thought, Nia barely moves and still wins.
 *
 * Rig conventions (see home3d/scenes/acts.ts): arm rotation.x −π/2 points forward, −π up; positive splay is
 * outward (armL.z = −s, armR.z = +s); `reach(side, k)` bends an arm, 1 straight, ~0.45 hand at the shoulder.
 */
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** 0→1→0 window between a and b (seconds within a loop), with soft edges. */
const bump = (t: number, a: number, b: number, edge = 0.35) => Math.min(ease((t - a) / edge), ease((b - t) / edge));
function arm(r: PersonRig, side: "l" | "r", x: number, splay = 0, k = 1) {
  const g = side === "l" ? r.armL : r.armR;
  g.rotation.x = x;
  g.rotation.z = side === "l" ? -splay : splay;
  r.reach(side, k);
}
const crossArms = (r: PersonRig, depth = 1.05) => { arm(r, "l", -depth, -0.48, 0.5); arm(r, "r", -depth + 0.08, -0.42, 0.5); };
const handsOnHips = (r: PersonRig) => { arm(r, "l", -0.15, 0.62, 0.55); arm(r, "r", -0.15, 0.62, 0.55); };
const hold = (r: PersonRig, x = -1.15, k = 0.6) => { arm(r, "l", x, -0.2, k); arm(r, "r", x, -0.2, k); };

/* ------------------------------------------------------------------ idles: who they are when nothing is happening */

function idle(style: CastStyle, r: PersonRig, t: number, seated: boolean) {
  switch (style) {
    case "mick": {
      // Chest out, hands on hips, surveying his empire. Shifts his weight like a boxer between rounds.
      handsOnHips(r);
      r.body.rotation.x = -0.07;
      r.body.rotation.z = Math.sin(t * 0.9) * 0.03;
      r.head.rotation.y = Math.sin(t * 0.55) * 0.35;
      r.head.rotation.x = -0.06;
      if (t % 11 > 8.4) { arm(r, "r", -1.55 + Math.sin(t * 7) * 0.08, 0, 1); }
      return;
    }
    case "lez": {
      // Loose sway; every so often he looks up at something nobody else can see, or scratches his head about it.
      const loop = t % 13;
      r.body.rotation.z = Math.sin(t * 0.7) * 0.07;
      arm(r, "l", Math.sin(t * 0.7) * 0.12, 0.08, 1);
      arm(r, "r", -Math.sin(t * 0.7) * 0.12, 0.08, 1);
      r.head.rotation.z = Math.sin(t * 0.7 + 0.6) * 0.1;
      r.head.rotation.x = -0.5 * bump(loop, 3, 6.2, 0.6);
      const scratch = bump(loop, 8, 10.4, 0.4);
      if (scratch > 0) arm(r, "r", -2.6 * scratch, -0.25 * scratch, 1 - 0.5 * scratch);
      if (scratch > 0.8) r.armR.rotation.y = Math.sin(t * 12) * 0.25;
      return;
    }
    case "nia": {
      // Arms folded, very little movement. Slow observant head turns; the occasional unimpressed tilt.
      crossArms(r, seated ? 0.95 : 1.05);
      r.head.rotation.y = Math.sin(t * 0.33) * 0.3;
      r.head.rotation.z = 0.06 + 0.08 * bump(t % 9, 5, 7.2, 0.5);
      return;
    }
    case "clerk": {
      // Hands together, counting something under his breath; glances at the back door.
      arm(r, "l", -0.95, -0.3, 0.55); arm(r, "r", -0.95 + Math.sin(t * 9) * 0.06, -0.3, 0.55);
      r.head.rotation.y = Math.sin(t * 2.6) * 0.12 + 0.6 * bump(t % 6, 4, 5.1, 0.2);
      r.body.position.y += Math.abs(Math.sin(t * 4)) * 0.004;
      return;
    }
    case "stranger": {
      // Hands behind his back, perfectly still, staring. Leans in to re-read the sign every so often.
      arm(r, "l", 0.35, -0.25, 0.7); arm(r, "r", 0.35, -0.25, 0.7);
      r.body.rotation.x = 0.1 * bump(t % 8, 5, 7, 0.6);
      r.head.rotation.x = 0.05;
      return;
    }
    case "shopkeeper": {
      // Competent stillness: arms folded, straight back, an occasional precise nod.
      crossArms(r, 1.0);
      r.head.rotation.x = 0.12 * bump(t % 7, 5, 5.6, 0.2);
      return;
    }
    case "buyer": {
      // Knee going like a sewing machine, glasses adjusted, eyes on the wrong door.
      if (seated) { r.legL.rotation.x += Math.sin(t * 19) * 0.07; }
      arm(r, "l", seated ? -0.6 : -0.2, 0, 0.8);
      const fix = bump(t % 5, 3.4, 4.4, 0.25);
      arm(r, "r", seated ? -0.6 - 1.8 * fix : -0.2 - 2.1 * fix, -0.25 * fix, 0.8 - 0.32 * fix);
      r.head.rotation.y = 0.75 * bump(t % 7, 1, 2.8, 0.25);
      return;
    }
    case "player": return;
  }
}

/* ------------------------------------------------------------------ talking: personal styles */

function talk(style: CastStyle, r: PersonRig, t: number) {
  switch (style) {
    case "mick":
      // Jabbing finger, other hand on hip, little nods of self-agreement.
      arm(r, "l", -0.15, 0.62, 0.55);
      arm(r, "r", -1.5 + Math.sin(t * 6.5) * 0.14, 0.05, 1);
      r.body.rotation.x = 0.05 + Math.sin(t * 3.2) * 0.02;
      r.head.rotation.x = Math.sin(t * 6.5) * 0.06;
      return;
    case "lez": {
      // Big slow shapes in the air while explaining the universe; stalls for a long think every few seconds.
      const loop = t % 6;
      const think = bump(loop, 3.6, 5.6, 0.4);
      const w = (1 - think);
      arm(r, "l", -0.85 + Math.sin(t * 1.4) * 0.3 * w, 0.6 + Math.sin(t * 1.1) * 0.2 * w, 0.85);
      arm(r, "r", -0.95 + Math.sin(t * 1.4 + 1.3) * 0.3 * w, 0.55 + Math.sin(t * 1.2 + 0.7) * 0.2 * w, 0.85);
      r.head.rotation.x = -0.35 * think;
      r.head.rotation.z = Math.sin(t * 0.8) * 0.12;
      r.body.rotation.z = Math.sin(t * 0.7) * 0.06;
      return;
    }
    case "nia":
      // One economical hand; the other stays folded. A head tilt does the rest.
      arm(r, "l", -1.0, -0.48, 0.5);
      arm(r, "r", -0.95 + Math.sin(t * 2.3) * 0.1, 0.1, 0.6);
      r.head.rotation.z = 0.08 + Math.sin(t * 1.1) * 0.04;
      return;
    case "shopkeeper":
      arm(r, "l", -1.0, -0.48, 0.5);
      arm(r, "r", -1.05 + Math.sin(t * 2) * 0.06, 0, 0.62);
      return;
    case "buyer":
      arm(r, "l", -0.9 + Math.sin(t * 5) * 0.12, 0.2, 0.7);
      arm(r, "r", -0.9 + Math.sin(t * 5 + 1) * 0.12, 0.2, 0.7);
      r.head.rotation.y = 0.5 * bump(t % 3, 1.8, 2.6, 0.15);
      return;
    default:
      arm(r, "l", -0.7 + Math.sin(t * 3) * 0.15, 0.2, 0.8);
      arm(r, "r", -0.75 + Math.sin(t * 3 + 1.4) * 0.15, 0.2, 0.8);
      r.head.rotation.x = Math.sin(t * 3) * 0.04;
  }
}

/* ------------------------------------------------------------------ listening in character */

/** What each character does while someone else holds the floor (the comedy is mostly here). */
export function listening(style: CastStyle, speaker: string | null): CastAct {
  if (style === "nia") return speaker === "mick" ? "arms-crossed" : speaker === "lez" ? "laugh-quiet" : "idle";
  if (style === "lez") return speaker === "mick" ? "stare-sky" : "idle";
  if (style === "mick") return speaker === "lez" ? "arms-crossed" : speaker === "nia" ? "glance" : "idle";
  return "idle";
}

/* ------------------------------------------------------------------ the performance */

/** One act, for one character. `t` is seconds into the beat (or into the scene for idles). */
export function perform(style: CastStyle, act: CastAct, seated = false): ActFn {
  return (r, t) => {
    switch (act) {
      case "idle": idle(style, r, t, seated); return;
      case "talk": talk(style, r, t); return;
      case "nod": idle(style, r, t, seated); r.head.rotation.x = Math.max(0, Math.sin(t * 5)) * 0.22; return;
      case "shrug": {
        const s = bump(t % 2.2, 0.2, 1.4, 0.25);
        arm(r, "l", -0.55 * s, 0.55 * s, 1 - 0.4 * s); arm(r, "r", -0.55 * s, 0.55 * s, 1 - 0.4 * s);
        r.body.position.y += 0.012 * s; r.head.rotation.z = 0.18 * s;
        return;
      }
      case "glance": idle(style, r, t, seated); r.head.rotation.y = Math.sin(t * 2.2) * 0.65; return;
      case "pause": r.head.rotation.x = 0.12; if (style === "nia") crossArms(r); return;
      case "hand-over": arm(r, "r", -1.35 * ease(t / 0.5), 0, 0.6 + 0.3 * ease(t / 0.5)); return;
      case "receive": { const k = ease((t - 0.25) / 0.45); const back = ease((t - 1.3) / 0.5); arm(r, "r", -1.3 * k * (1 - back * 0.5), 0, 0.6 + 0.3 * k - 0.25 * back); return; }
      case "triumph": {
        const b = Math.abs(Math.sin(t * 6));
        arm(r, "l", -2.8, 0.25, 0.75 + 0.25 * b); arm(r, "r", -2.8, 0.25, 0.75 + 0.25 * b);
        r.body.position.y += 0.03 * b; r.body.rotation.x = -0.12; r.head.rotation.x = -0.25;
        return;
      }
      case "deflate": {
        // The confidence leaves the building: shoulders drop, head goes, arms hang.
        const k = ease(t / 0.8);
        r.body.rotation.x = 0.2 * k; r.head.rotation.x = 0.4 * k; r.body.position.y -= 0.015 * k;
        arm(r, "l", 0.05, -0.05, 1); arm(r, "r", 0.05, -0.05, 1);
        return;
      }
      case "facepalm": {
        const k = ease((t - 0.2) / 0.4);
        arm(r, "r", -2.45 * k, -0.42 * k, 1 - 0.58 * k); if (style === "nia") arm(r, "l", -1.0, -0.48, 0.5);
        r.head.rotation.x = 0.28 * k; r.head.rotation.y = Math.sin(t * 2) * 0.08 * k;
        return;
      }
      case "point": arm(r, "r", -1.6, 0, 1); arm(r, "l", -0.1, 0.1, 1); r.body.rotation.x = 0.04; r.head.rotation.x = -0.05; return;
      case "stare-sky": idle(style, r, t, seated); r.head.rotation.x = -0.6; r.head.rotation.y = Math.sin(t * 0.3) * 0.2; return;
      case "laugh-quiet": {
        // A small, private laugh she would deny later.
        const k = ease(t / 0.4);
        arm(r, "l", -2.15 * k, -0.35 * k, 1 - 0.55 * k); arm(r, "r", -1.0, -0.42, 0.5);
        r.head.rotation.x = 0.15 * k + Math.sin(t * 14) * 0.03 * k; r.body.position.y += Math.abs(Math.sin(t * 14)) * 0.004 * k;
        return;
      }
      case "arms-crossed": crossArms(r); r.head.rotation.z = style === "nia" ? 0.1 + Math.sin(t * 1.5) * 0.06 : 0; r.head.rotation.y = style === "nia" ? Math.sin(t * 1.3) * 0.18 : 0; if (style === "mick") r.body.rotation.x = -0.08; return;
      case "mumble": arm(r, "l", -0.6, -0.4, 0.75); arm(r, "r", -0.6, -0.4, 0.75); r.head.rotation.x = 0.32; r.head.rotation.y = -0.25; r.body.rotation.x = 0.06; return;
      case "turn-away": r.root.rotation.y += Math.PI * 0.85 * ease(t / 0.6); crossArms(r); return;
      case "rub-hands": arm(r, "l", -1.1 + Math.sin(t * 10) * 0.06, -0.4, 0.5); arm(r, "r", -1.1 - Math.sin(t * 10) * 0.06, -0.4, 0.5); r.head.rotation.x = -0.05; return;
      case "count": arm(r, "l", -1.0, -0.25, 0.55); arm(r, "r", -1.0 + Math.sin(t * 9) * 0.1, -0.25, 0.55); r.head.rotation.x = 0.25; return;
      case "salute": arm(r, "r", -2.7, -0.5, 0.55); r.head.rotation.x = -0.25; r.body.rotation.x = -0.04; return;
      case "head-down": r.head.rotation.x = 0.42; r.body.rotation.x = 0.08; r.body.position.y += Math.sin(t * 1.6) * 0.002; arm(r, "l", 0.02, 0, 1); arm(r, "r", 0.02, 0, 1); return;
      case "hold-card": hold(r, -1.15, 0.58); r.head.rotation.x = 0.32; return;
      case "look-around": r.head.rotation.y = Math.sin(t * 2.6) * 0.85; arm(r, "l", -0.5, 0.45, 0.7); arm(r, "r", -0.5, 0.45, 0.7); return;
      case "present-cone": { const k = ease(t / 0.6); arm(r, "l", -1.9 * k, 0, 1); r.head.rotation.x = -0.1; return; }
      case "comfort": arm(r, "r", -0.75, -0.2, 0.95); arm(r, "l", -0.2, 0, 1); r.head.rotation.z = 0.16; r.head.rotation.x = 0.1; return;
      case "inspect": r.body.rotation.x = 0.24; r.head.rotation.x = 0.38; arm(r, "r", -0.95 + Math.sin(t * 2) * 0.08, -0.1, 0.85); arm(r, "l", -0.5, 0, 0.8); return;
      case "fluster": r.head.rotation.y = Math.sin(t * 7) * 0.4; arm(r, "l", -1.2, 0.3, 0.55 + Math.sin(t * 11) * 0.05); arm(r, "r", -1.2, 0.3, 0.55 - Math.sin(t * 11) * 0.05); return;
      case "announce": arm(r, "r", -2.65, 0.05, 1); arm(r, "l", -0.15, 0.62, 0.55); r.body.rotation.x = -0.1; r.head.rotation.x = -0.15; return;
      case "peek": r.body.rotation.z = 0.2; r.body.rotation.x = 0.1; r.head.rotation.y = 0.25 + Math.sin(t * 1.5) * 0.15; arm(r, "l", -0.4, 0.1, 0.8); return;
      case "check-sign": r.body.rotation.x = 0.14 * bump(t % 4, 0.5, 3.2, 0.5); arm(r, "r", -1.95, -0.3, 0.45); arm(r, "l", -1.0, -0.4, 0.5); return;
      case "jiggle": idle(style, r, t, seated); return;
      case "adjust-glasses": arm(r, "r", -2.35, -0.3, 0.48); arm(r, "l", -0.6, 0, 0.8); r.head.rotation.x = -0.05; return;
      case "push": hold(r, -1.35, 0.85); r.body.rotation.x = 0.12; r.legL.rotation.x = Math.sin(t * 6) * 0.35; r.legR.rotation.x = -Math.sin(t * 6) * 0.35; return;
      case "hands-up": arm(r, "l", -2.95, 0.15, 1); arm(r, "r", -2.95, 0.15, 1); r.head.rotation.x = -0.1; return;
      case "flee": {
        r.root.rotation.y += Math.PI * ease(t / 0.3);
        if (t < 0.3) return;
        const k = t - 0.3;
        const d = Math.min(1.6, k * 2.6);
        r.root.position.x += Math.sin(r.root.rotation.y) * d; r.root.position.z += Math.cos(r.root.rotation.y) * d;
        const sw = Math.sin(k * 16) * 0.9;
        r.legL.rotation.x = sw; r.legR.rotation.x = -sw; arm(r, "l", -sw * 0.8, 0, 1); arm(r, "r", sw * 0.8, 0, 1);
        return;
      }
      case "phone": arm(r, "r", -2.4, -0.3, 0.42); arm(r, "l", -0.15, 0.6, 0.55); r.head.rotation.z = 0.15; return;
      case "wave-off": arm(r, "r", -1.6, Math.sin(t * 8) * 0.4, 0.85); r.head.rotation.y = -0.3; return;
      case "lean-in": r.body.rotation.x = 0.15; r.head.rotation.x = 0.08; arm(r, "l", -0.5, 0, 0.8); arm(r, "r", -0.7 + Math.sin(t * 3) * 0.1, 0, 0.8); return;
    }
  };
}