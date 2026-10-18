import type { ActFn, PersonRig } from "@/components/Character3D";
import type { MoveId } from "@/lib/combat";
import type { FighterStyle, FightOutcome } from "@/lib/fight-presentation";

/**
 * Procedural fighting animation for the shared stick-figure rig: guard stances with each fighter's own
 * personality, five moves (with misses), defensive reactions, hit-stun, knockouts and the aftermath. All timing is
 * relative to an event's length so short and full cutscene settings scale the same choreography.
 * Arm rotation.x −π/2 points forward; positive splay is outward; reach(k) bends the arm (1 straight).
 */
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));
/** Rise to 1 between a and b, hold, fall back between c and d (fractions of the event). */
const env = (p: number, a: number, b: number, c: number, d: number) => (p < a || p > d ? 0 : p < b ? ease((p - a) / (b - a)) : p < c ? 1 : 1 - ease((p - c) / (d - c)));
function arm(r: PersonRig, side: "l" | "r", x: number, splay = 0, k = 1) {
  const g = side === "l" ? r.armL : r.armR;
  g.rotation.x = x;
  g.rotation.z = side === "l" ? -splay : splay;
  r.reach(side, k);
}
function advance(r: PersonRig, d: number) {
  r.root.position.x += Math.sin(r.root.rotation.y) * d;
  r.root.position.z += Math.cos(r.root.rotation.y) * d;
}
/** When the blow lands, as a fraction of the attack. */
export const IMPACT: Record<MoveId, number> = { jab: 0.32, hook: 0.52, heavy: 0.6, block: 0.3, recover: 0.5 };

/* ------------------------------------------------------------------ stances */

function guard(style: FighterStyle, r: PersonRig, t: number) {
  const bounce = Math.abs(Math.sin(t * (style === "pete" ? 7.5 : style === "derek" ? 3.2 : 5)));
  r.body.position.y += bounce * (style === "barry" ? 0.004 : 0.008) - 0.012;
  r.legL.rotation.x = 0.18; r.legR.rotation.x = -0.18;
  switch (style) {
    case "barry":
      // Wide, chest out, hands low: he doesn't think he'll need them.
      r.legL.rotation.z = -0.16; r.legR.rotation.z = 0.16;
      arm(r, "l", -0.9, 0.3, 0.55); arm(r, "r", -0.8, 0.35, 0.55);
      r.body.rotation.x = -0.08; r.body.rotation.z = Math.sin(t * 1.4) * 0.04;
      return;
    case "pete":
      // The legendary right hand, cocked by his ear at all times.
      arm(r, "l", -1.2, -0.1, 0.5); arm(r, "r", -2.15 + Math.sin(t * 3) * 0.08, -0.15, 0.42);
      r.body.rotation.y = -0.2;
      return;
    case "derek":
      // Tight, high guard, chin down, glaring. Very little wasted movement.
      arm(r, "l", -1.4, -0.3, 0.42); arm(r, "r", -1.35, -0.32, 0.4);
      r.head.rotation.x = 0.18; r.body.rotation.x = 0.06;
      return;
    case "cousin": {
      // Swaps stance at random-looking moments and looks round to see who's watching.
      const swap = Math.sin(t * 0.9) > 0.4;
      arm(r, "l", swap ? -0.6 : -1.25, 0.25, 0.6); arm(r, "r", swap ? -1.3 : -0.7, 0.25, 0.55);
      r.body.rotation.z = Math.sin(t * 2.1) * 0.08; r.head.rotation.y = Math.sin(t * 1.3) * 0.5;
      return;
    }
    default:
      arm(r, "l", -1.25, -0.15, 0.45); arm(r, "r", -1.15, -0.2, 0.42);
      r.head.rotation.x = 0.08;
  }
}

/* ------------------------------------------------------------------ attacks */

function attack(style: FighterStyle, move: MoveId, missed: boolean, r: PersonRig, p: number, t: number) {
  guard(style, r, t);
  switch (move) {
    case "jab": {
      const e = env(p, 0, 0.25, 0.45, 0.8);
      arm(r, "l", -1.25 - 0.4 * e, -0.15 * (1 - e), 0.45 + 0.55 * e);
      advance(r, 0.12 * e + (missed ? 0.08 * env(p, 0.3, 0.45, 0.6, 0.9) : 0));
      r.body.rotation.y = -0.15 * e;
      return;
    }
    case "hook": {
      const wind = env(p, 0, 0.3, 0.35, 0.5), swing = env(p, 0.3, 0.52, 0.65, 0.95);
      r.body.rotation.y = -0.35 * wind + 0.55 * swing;
      arm(r, "r", -1.2 - 0.3 * swing, 0.9 * (1 - swing) - 0.25 * swing + 0.3 * wind, 0.45 + 0.4 * swing);
      advance(r, 0.15 * swing + (missed ? 0.12 * env(p, 0.5, 0.65, 0.75, 1) : 0));
      if (missed) r.body.rotation.z = 0.18 * env(p, 0.55, 0.7, 0.8, 1);
      return;
    }
    case "heavy": {
      const wind = env(p, 0, 0.4, 0.45, 0.6), hit = env(p, 0.45, 0.6, 0.72, 0.98);
      r.body.rotation.x = -0.16 * wind + 0.18 * hit;
      arm(r, "r", 0.45 * wind - 1.65 * hit - 1.1 * (1 - wind) * (1 - hit), 0.1, 0.6 + 0.4 * hit);
      advance(r, -0.12 * wind + 0.38 * hit + (missed ? 0.2 * env(p, 0.6, 0.75, 0.85, 1) : 0));
      if (missed) { r.body.rotation.z = 0.25 * env(p, 0.62, 0.75, 0.85, 1); r.head.rotation.x = 0.25 * env(p, 0.62, 0.75, 0.85, 1); }
      return;
    }
    case "block": {
      const k = ease(p / 0.35);
      arm(r, "l", -1.25 - 0.8 * k, -0.15 - 0.25 * k, 0.45 - 0.05 * k); arm(r, "r", -1.15 - 0.85 * k, -0.2 - 0.25 * k, 0.42);
      r.head.rotation.x = 0.08 + 0.12 * k; r.body.position.y -= 0.02 * k;
      return;
    }
    case "recover": {
      // Guard drops, hands to knees, a big breath, back up again.
      const k = env(p, 0, 0.2, 0.75, 1);
      arm(r, "l", -1.25 * (1 - k) - 0.35 * k, -0.15 + 0.2 * k, 0.45 + 0.4 * k); arm(r, "r", -1.15 * (1 - k) - 0.35 * k, -0.2 + 0.2 * k, 0.42 + 0.4 * k);
      r.body.rotation.x = 0.3 * k; r.head.rotation.x = 0.2 * k - 0.25 * k * Math.max(0, Math.sin(p * 9));
      r.body.position.y += Math.sin(p * 12) * 0.008 * k;
      return;
    }
  }
}

/* ------------------------------------------------------------------ defence and damage */

function block(style: FighterStyle, r: PersonRig, t: number) {
  guard(style, r, t);
  arm(r, "l", -2.05, -0.4, 0.4); arm(r, "r", -2.0, -0.45, 0.42);
  r.head.rotation.x = 0.22; r.body.position.y -= 0.02;
}

function defend(style: FighterStyle, move: MoveId, outcome: FightOutcome, guarded: boolean, heavy: boolean, r: PersonRig, p: number, t: number) {
  const at = IMPACT[move];
  if (guarded) block(style, r, t); else guard(style, r, t);
  if (p < at - 0.12) return;
  if (outcome === "miss") {
    // Sway out of the way just in time.
    const k = env(p, at - 0.12, at, at + 0.15, at + 0.4);
    r.body.rotation.z += (move === "hook" ? -0.32 : 0.28) * k; r.body.position.y -= 0.035 * k; r.head.rotation.x += 0.1 * k;
    return;
  }
  if (p < at) return;
  const since = p - at;
  const stun = Math.max(0, 1 - since / (heavy ? 0.55 : 0.32));
  if (outcome === "blocked") { advance(r, -0.06 * stun); r.body.rotation.x -= 0.06 * stun; return; }
  // Hit: head snaps, body rocks back, a step or a stagger to the side for hooks.
  r.head.rotation.x -= (heavy ? 0.55 : 0.35) * stun;
  r.body.rotation.x -= (heavy ? 0.25 : 0.12) * stun;
  advance(r, -(heavy ? 0.32 : move === "hook" ? 0.16 : 0.08) * Math.min(1, since * 6));
  if (move === "hook") { r.body.rotation.z += 0.28 * stun; r.head.rotation.y += 0.4 * stun; }
  arm(r, "l", -0.7 * stun - 1.25 * (1 - stun), 0.35 * stun, 0.7); arm(r, "r", -0.6 * stun - 1.15 * (1 - stun), 0.35 * stun, 0.7);
}

/** Down and out: topples backwards over ~0.8 s and stays there. */
function knockedOut(r: PersonRig, s: number) {
  const k = ease(s / 0.8);
  r.body.rotation.x = -1.45 * k;
  r.body.position.y += 0.07 * k - 0.04 * Math.sin(Math.min(1, s / 0.8) * Math.PI);
  r.body.position.z -= 0.28 * k;
  r.legL.rotation.x = 0.35 * k; r.legR.rotation.x = -0.1 * k;
  arm(r, "l", -2.4 * k, 0.6 * k, 1); arm(r, "r", -2.2 * k, 0.8 * k, 1);
  r.head.rotation.x = -0.2 * k; r.head.rotation.y = 0.5 * k;
}

function celebrate(style: FighterStyle, r: PersonRig, t: number) {
  const b = Math.abs(Math.sin(t * 5));
  if (style === "derek") { arm(r, "r", -2.9, 0, 1); arm(r, "l", -0.2, 0, 1); r.head.rotation.x = -0.15; return; }
  if (style === "cousin") { arm(r, "l", -2.8, 0.4, 0.8 + 0.2 * b); arm(r, "r", -0.3, 0.3, 1); r.root.rotation.y += Math.sin(t * 3) * 0.8; return; }
  arm(r, "l", -2.85, 0.3, 0.75 + 0.25 * b); arm(r, "r", -2.85, 0.3, 0.75 + 0.25 * b);
  r.body.position.y += 0.03 * b; r.head.rotation.x = -0.25;
}

/** Pre-fight showboating, one per personality. */
function taunt(style: FighterStyle, r: PersonRig, t: number) {
  switch (style) {
    case "barry": arm(r, "l", -1.6, 1.35, 0.5); arm(r, "r", -1.6, 1.35, 0.5); r.body.rotation.x = -0.1; r.body.position.y += Math.abs(Math.sin(t * 3)) * 0.01; return;
    case "pete": guard("pete", r, t); arm(r, "r", -1.55, 0, 1); r.head.rotation.x = -0.1; return;
    case "derek": guard("derek", r, t); r.head.rotation.z = Math.sin(t * 2.5) * 0.35; return;
    case "cousin": arm(r, "r", -2.6 + Math.sin(t * 9) * 0.2, 0.4, 1); r.head.rotation.y = Math.sin(t * 1.5) * 0.7; return;
    default: guard(style, r, t);
  }
}

export type FighterRole =
  | { kind: "idle"; guarded: boolean }
  | { kind: "taunt" }
  | { kind: "attack"; move: MoveId; missed: boolean; p: number }
  | { kind: "defend"; move: MoveId; outcome: FightOutcome; guarded: boolean; heavy: boolean; p: number }
  | { kind: "ko"; since: number }
  | { kind: "win" };

export function fighterAct(style: FighterStyle, role: FighterRole, t: number): ActFn {
  return (r) => {
    switch (role.kind) {
      case "idle": if (role.guarded) block(style, r, t); else guard(style, r, t); return;
      case "taunt": taunt(style, r, t); return;
      case "attack": attack(style, role.move, role.missed, r, role.p, t); return;
      case "defend": defend(style, role.move, role.outcome, role.guarded, role.heavy, r, role.p, t); return;
      case "ko": knockedOut(r, role.since); return;
      case "win": celebrate(style, r, t); return;
    }
  };
}

/* ------------------------------------------------------------------ the crowd */

export type CrowdMood = "watch" | "ooh" | "cheer" | "wince" | "erupt";
export function crowdAct(mood: CrowdMood, seed: number, t: number): ActFn {
  return (r) => {
    const tt = t + seed * 1.7;
    switch (mood) {
      case "watch":
        r.body.rotation.z = Math.sin(tt * 1.1) * 0.05;
        arm(r, "l", -0.25, 0.1, 0.9); arm(r, "r", seed % 2 ? -1.1 : -0.25, 0.1, seed % 2 ? 0.5 : 0.9);
        r.head.rotation.y = Math.sin(tt * 0.7) * 0.15;
        return;
      case "ooh": arm(r, "l", -2.5, -0.5, 0.45); arm(r, "r", -2.5, -0.5, 0.45); r.body.rotation.x = -0.08; return;
      case "cheer": { const b = Math.abs(Math.sin(tt * 7)); arm(r, seed % 2 ? "l" : "r", -2.8, 0.2, 0.6 + 0.4 * b); r.body.position.y += 0.015 * b; return; }
      case "wince": arm(r, "l", -2.2, -0.4, 0.45); arm(r, "r", -1.0, -0.3, 0.6); r.head.rotation.x = 0.25; r.body.rotation.x = 0.1; return;
      case "erupt": { const b = Math.abs(Math.sin(tt * 8)); arm(r, "l", -2.9, 0.35, 0.8 + 0.2 * b); arm(r, "r", -2.9, 0.35, 0.8 + 0.2 * b); r.body.position.y += 0.03 * b; return; }
    }
  };
}