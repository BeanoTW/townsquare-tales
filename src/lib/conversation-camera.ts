import type { CrimeVisualActor } from "@/lib/crime-visual-cues";
import { crewConversationCue, type CameraShot, type ConversationCue, type DirectorBeat } from "@/lib/crime-cinematic-director";
import { UNDERWORLD_SCRIPTS } from "@/lib/underworld-story-script";

/**
 * Interprets the cinematic director's beats as timed camera shots and character performances. Pure maths and
 * timing only, shared by the town conversation camera and the crime cutscene stage, so every scene frames people
 * the same way. Nothing here touches game state.
 */
export type CutsceneMode = "full" | "short" | "off";
export type V3 = [number, number, number];

/** Performances an actor can give during a beat (the director's gestures plus character-specific acting). */
export type CastAct =
  | DirectorBeat["gesture"]
  | "triumph" | "deflate" | "facepalm" | "point" | "stare-sky" | "laugh-quiet" | "arms-crossed" | "mumble" | "turn-away"
  | "rub-hands" | "count" | "salute" | "head-down" | "hold-card" | "look-around" | "present-cone" | "comfort"
  | "inspect" | "fluster" | "announce" | "receive" | "peek" | "check-sign" | "jiggle" | "adjust-glasses" | "push"
  | "hands-up" | "flee" | "phone" | "wave-off" | "lean-in";

export type SceneBeat = DirectorBeat & {
  /** How long the beat holds; `Infinity` holds until the conversation changes. */
  durationMs: number;
  /** Per-actor performances; anyone not listed listens in character. */
  acts?: Partial<Record<CrimeVisualActor, CastAct>>;
  caption?: string;
  /** Who shares a two-shot with the focus, or whom an over-the-shoulder looks at. */
  with?: CrimeVisualActor;
};
export type SceneCue = { id: string; kind: "conversation" | "epilogue" | "action"; cast: readonly CrimeVisualActor[]; beats: readonly SceneBeat[]; storyId?: number };

const BASE_MS: Record<DirectorBeat["gesture"], number> = { talk: 2800, nod: 1700, shrug: 1700, glance: 1700, "hand-over": 2200, pause: 1300, idle: 1800 };

/** Timed version of a director conversation cue. The final beat holds while the player reads and chooses. */
export function timedConversation(cue: ConversationCue, mode: CutsceneMode, reducedMotion = false): SceneCue {
  const beats = cue.beats.map((b, i): SceneBeat => ({ ...b, durationMs: i === cue.beats.length - 1 ? Infinity : BASE_MS[b.gesture] + b.pauseMs }));
  if (reducedMotion) return { id: cue.id, kind: "conversation", cast: cue.cast, beats: [{ ...beats[0]!, shot: "three-shot", gesture: "idle", durationMs: Infinity }] };
  if (mode === "short") return { id: cue.id, kind: "conversation", cast: cue.cast, beats: [{ ...beats[0]!, durationMs: 1400 }, beats[beats.length - 1]!] };
  return { id: cue.id, kind: "conversation", cast: cue.cast, beats };
}

/** The crew conversation for whoever the player is talking to; story contacts get the story's own reaction beats. */
export function crewScene(speaker: "mick" | "lez" | "nia", mode: CutsceneMode, storyId?: number, reducedMotion = false): SceneCue | null {
  if (mode === "off") return null;
  const timed = timedConversation(crewConversationCue(speaker, storyId), mode, reducedMotion);
  return storyId ? { ...timed, storyId } : timed;
}

const sentences = (text: string) => text.match(/[^.!?]+[.!?]+["”]?/g)?.map((s) => s.trim()) ?? [text];

/** Choreography for each story's ending, played at the green after the player decides. */
const EPILOGUES: Readonly<Record<number, readonly Omit<SceneBeat, "caption">[]>> = {
  1: [
    { speaker: "mick", focus: "mick", shot: "speaker-close", gesture: "talk", pauseMs: 0, durationMs: 2600, acts: { mick: "triumph", nia: "arms-crossed", lez: "stare-sky" } },
    { speaker: "nia", focus: "nia", shot: "two-shot", with: "mick", gesture: "talk", pauseMs: 0, durationMs: 2400, acts: { nia: "point", mick: "deflate", lez: "count" } },
    { speaker: null, focus: "mick", shot: "three-shot", gesture: "pause", pauseMs: 600, durationMs: 1900, acts: { mick: "deflate", nia: "facepalm", lez: "count" } },
  ],
  2: [
    { speaker: "lez", focus: "lez", shot: "speaker-close", gesture: "talk", pauseMs: 0, durationMs: 2700, acts: { lez: "stare-sky", mick: "arms-crossed", nia: "arms-crossed" } },
    { speaker: null, focus: "nia", shot: "three-shot", gesture: "pause", pauseMs: 500, durationMs: 2300, acts: { lez: "nod", mick: "shrug", nia: "laugh-quiet" } },
  ],
  3: [
    { speaker: "mick", focus: "mick", shot: "speaker-close", gesture: "talk", pauseMs: 0, durationMs: 2300, acts: { mick: "arms-crossed", nia: "arms-crossed", lez: "glance" } },
    { speaker: null, focus: "mick", shot: "three-shot", gesture: "pause", pauseMs: 900, durationMs: 2000, acts: { mick: "look-around", nia: "turn-away", lez: "turn-away" } },
    { speaker: "mick", focus: "mick", shot: "speaker-close", gesture: "talk", pauseMs: 0, durationMs: 2100, acts: { mick: "mumble", nia: "laugh-quiet", lez: "turn-away" } },
  ],
  4: [
    { speaker: "nia", focus: "nia", shot: "speaker-close", gesture: "talk", pauseMs: 0, durationMs: 2400, acts: { nia: "count", mick: "rub-hands", lez: "stare-sky" } },
    { speaker: "mick", focus: "mick", shot: "two-shot", with: "nia", gesture: "talk", pauseMs: 0, durationMs: 2200, acts: { mick: "rub-hands", nia: "arms-crossed", lez: "salute" } },
    { speaker: null, focus: "nia", shot: "three-shot", gesture: "pause", pauseMs: 400, durationMs: 1700, acts: { nia: "facepalm", mick: "count", lez: "salute" } },
  ],
  5: [
    // The quiet beat is allowed to breathe before anyone moves.
    { speaker: null, focus: "lez", shot: "three-shot", gesture: "pause", pauseMs: 1400, durationMs: 3000, acts: { lez: "head-down", nia: "comfort", mick: "pause" } },
    { speaker: "lez", focus: "lez", shot: "speaker-close", gesture: "pause", pauseMs: 900, durationMs: 2900, acts: { lez: "hold-card", nia: "pause", mick: "pause" } },
    { speaker: "mick", focus: "mick", shot: "two-shot", with: "lez", gesture: "talk", pauseMs: 0, durationMs: 2100, acts: { mick: "look-around", lez: "present-cone", nia: "laugh-quiet" } },
  ],
};

/** The ending scene for a finished story: null when cutscenes are off. Captions are the script's own epilogue. */
export function storyEpilogueScene(storyId: number, mode: CutsceneMode, reducedMotion = false): SceneCue | null {
  const choreography = EPILOGUES[storyId];
  const script = UNDERWORLD_SCRIPTS[storyId];
  if (mode === "off" || !choreography || !script) return null;
  const lines = sentences(script.epilogue);
  const per = Math.ceil(lines.length / choreography.length);
  let beats: SceneBeat[] = choreography.map((b, i) => ({ ...b, caption: lines.slice(i * per, i * per + per).join(" ") || lines[lines.length - 1]! }));
  if (reducedMotion) beats = [{ ...beats[beats.length - 1]!, shot: "three-shot", durationMs: 3200, caption: lines.join(" ") }];
  else if (mode === "short") beats = [{ ...beats[0]!, durationMs: 1500, caption: lines.join(" ") }, { ...beats[beats.length - 1]!, durationMs: 1500, caption: lines.join(" ") }];
  return { id: `crew-epilogue-${storyId}`, kind: "epilogue", cast: ["mick", "lez", "nia", "player"], beats, storyId };
}

/** Total length of a finite scene in ms (Infinity for conversations that hold their last shot). */
export const sceneLength = (cue: SceneCue) => cue.beats.reduce((n, b) => n + b.durationMs, 0);

/** Which beat is on screen `elapsedMs` into the scene, and how far into it. */
export function beatAt(cue: SceneCue, elapsedMs: number): { index: number; beat: SceneBeat; t: number } {
  let start = 0;
  for (let i = 0; i < cue.beats.length; i++) {
    const b = cue.beats[i]!;
    if (elapsedMs < start + b.durationMs || i === cue.beats.length - 1) return { index: i, beat: b, t: Math.max(0, elapsedMs - start) / 1000 };
    start += b.durationMs;
  }
  return { index: 0, beat: cue.beats[0]!, t: 0 };
}

/* ------------------------------------------------------------------ shots */

export type Mark = { x: number; z: number; scale: number; stretch?: number; seated?: boolean };
export type Marks = Partial<Record<CrimeVisualActor, Mark>>;
export type ShotPose = { eye: V3; target: V3; fov: number };

const headY = (m: Mark) => 0.535 * m.scale * (m.stretch ?? 1) * (m.seated ? 0.8 : 1);
function norm(x: number, z: number): [number, number] { const l = Math.hypot(x, z) || 1; return [x / l, z / l]; }

/**
 * Camera pose for a shot. `toward` is the side the camera prefers (in town: the street-facing south, so buildings
 * never block it); shots never swing round behind the cast.
 */
export function shotFor(shot: CameraShot, focus: CrimeVisualActor, marks: Marks, toward: [number, number] = [-0.25, 1], partner?: CrimeVisualActor | null): ShotPose | null {
  if (shot === "overhead") return null;
  const [tx, tz] = norm(toward[0], toward[1]);
  const f = marks[focus] ?? marks.player;
  if (!f) return null;
  const k = f.scale / 1.45;
  const crew = (["mick", "lez", "nia", "clerk", "stranger", "shopkeeper", "buyer"] as const).map((id) => marks[id]).filter((m): m is Mark => Boolean(m));
  const p = marks.player;
  // Keep a direction on the preferred side of the cast.
  const side = (x: number, z: number): [number, number] => {
    const [nx, nz] = norm(x, z);
    const dot = nx * tx + nz * tz;
    return dot >= 0.3 ? [nx, nz] : norm(nx + tx * (0.3 - dot) * 2.2, nz + tz * (0.3 - dot) * 2.2);
  };
  const perp = (x: number, z: number): [number, number] => { const a: [number, number] = [-z, x]; return a[0] * tx + a[1] * tz >= 0 ? a : [z, -x]; };
  // Swing a camera direction off the player when they would stand between the lens and the cast.
  // Of the two swings, prefer the one that keeps the group spread across frame rather than lined up.
  const clear = (dir: [number, number], cx: number, cz: number, who: Mark | undefined, axis?: [number, number]): [number, number] => {
    if (!who) return dir;
    const [wx, wz] = norm(who.x - cx, who.z - cz);
    if (wx * dir[0] + wz * dir[1] < 0.82) return dir;
    const turn = (a: number): [number, number] => [dir[0] * Math.cos(a) - dir[1] * Math.sin(a), dir[0] * Math.sin(a) + dir[1] * Math.cos(a)];
    const a = turn(0.6), b = turn(-0.6);
    const score = (d: [number, number]) => -(wx * d[0] + wz * d[1]) + 0.4 * (d[0] * tx + d[1] * tz) - (axis ? 1.2 * Math.abs(d[0] * axis[0] + d[1] * axis[1]) : 0);
    return score(a) >= score(b) ? a : b;
  };
  const fh = headY(f);
  switch (shot) {
    case "speaker-close": {
      // A clean single: from the listener's side but swung ~35° off their line, so nobody's head is in the way.
      let [dx, dz] = p && focus !== "player" ? side(p.x - f.x, p.z - f.z) : [tx, tz];
      if (p && focus !== "player") {
        const a = 0.6, c = Math.cos(a), s = Math.sin(a);
        const r1: [number, number] = [dx * c - dz * s, dx * s + dz * c], r2: [number, number] = [dx * c + dz * s, -dx * s + dz * c];
        [dx, dz] = r1[0] * tx + r1[1] * tz >= r2[0] * tx + r2[1] * tz ? r1 : r2;
      }
      const [px, pz] = perp(dx, dz);
      const d = 1.6 * k;
      return { eye: [f.x + dx * d + px * 0.38 * k, fh * 1.1, f.z + dz * d + pz * 0.38 * k], target: [f.x, fh * 0.88, f.z], fov: 38 };
    }
    case "two-shot": {
      const o = (partner ? marks[partner] : undefined) ?? (focus === "player" ? crew[0] : p ?? crew.find((m) => m !== f));
      if (!o) return shotFor("speaker-close", focus, marks, toward);
      const mx = (f.x + o.x) / 2, mz = (f.z + o.z) / 2;
      const gap = Math.hypot(o.x - f.x, o.z - f.z);
      // Pick the side angle that keeps everyone else (the player, the third crew member) out of the lens.
      const blockers = [p, ...crew].filter((m): m is Mark => Boolean(m) && m !== f && m !== o);
      const base = side(...perp(o.x - f.x, o.z - f.z));
      const [px, pz] = [0, 0.55, -0.55, 0.95, -0.95].map((a): [number, number] => [base[0] * Math.cos(a) - base[1] * Math.sin(a), base[0] * Math.sin(a) + base[1] * Math.cos(a)])
        .map((d) => ({ d, cost: Math.max(-1, ...blockers.map((m) => { const [bx, bz] = norm(m.x - mx, m.z - mz); return bx * d[0] + bz * d[1]; })) - 0.35 * (d[0] * tx + d[1] * tz) }))
        .reduce((best, c) => (c.cost < best.cost ? c : best)).d;
      const d = (1.2 * gap + 2.0) * k;
      return { eye: [mx + px * d, fh * 1.3, mz + pz * d], target: [mx, fh * 0.78, mz], fov: 44 };
    }
    case "over-shoulder": {
      // Over the player's shoulder at whoever they are facing (the partner when the player is the focus).
      const t = focus === "player" ? (partner ? marks[partner] : crew[0]) : f;
      if (!p || !t) return shotFor("three-shot", focus, marks, toward);
      const [dx, dz] = norm(p.x - t.x, p.z - t.z);
      // Only a true over-the-shoulder when the player stands on the camera's side; otherwise a clean two-shot.
      if (dx * tx + dz * tz < 0.15) return shotFor("two-shot", focus === "player" ? (partner ?? "mick") : focus, marks, toward, focus === "player" ? "player" : null);
      const [px, pz] = perp(dx, dz);
      const tk = t.scale / 1.45;
      return { eye: [p.x + dx * 0.8 * tk + px * 0.72 * tk, headY(p) * 1.4, p.z + dz * 0.8 * tk + pz * 0.72 * tk], target: [t.x, headY(t) * 0.88, t.z], fov: 44 };
    }
    case "three-shot":
    case "wide": {
      const group = crew.length ? crew : [f];
      const cx = group.reduce((n, m) => n + m.x, 0) / group.length, cz = group.reduce((n, m) => n + m.z, 0) / group.length;
      const spread = Math.max(0.6, ...group.map((m) => Math.hypot(m.x - cx, m.z - cz)));
      const d = (shot === "wide" ? 3.4 : 2.4) * k + spread * 1.2;
      // Straight on from the open side and high enough to look over the player's head.
      const [ex, ez] = [tx, tz];
      // High enough to see over the player standing in front of the group.
      return { eye: [cx + ex * d, fh * (shot === "wide" ? 2.8 : 2.5), cz + ez * d], target: [cx, fh * 0.55, cz], fov: 46 };
    }
  }
}

/** Shot for a beat: the director names the shot and the focus; this resolves both against the marks. */
export const shotForBeat = (beat: Pick<SceneBeat, "shot" | "focus" | "with">, marks: Marks, toward?: [number, number], lead?: CrimeVisualActor | null) =>
  shotFor(beat.shot, beat.focus, marks, toward, beat.with ?? lead ?? null);

/** Where an actor should face: the current speaker, or the player when they are the one speaking. */
export function faceToward(actor: CrimeVisualActor, speaker: CrimeVisualActor | null, marks: Marks): number | null {
  const me = marks[actor];
  const target = speaker && speaker !== actor ? marks[speaker] : marks.player && actor !== "player" ? marks.player : null;
  if (!me || !target) return null;
  // Figure convention: 0 faces north (−z), 90 faces east.
  return (Math.atan2(target.x - me.x, -(target.z - me.z)) * 180) / Math.PI;
}

/** A scene playing in the live town: the cue, when it started, and the player's motion preferences. */
export type LiveConversation = { key: number; cue: SceneCue; startedAt: number; mode: CutsceneMode; reduced: boolean };

/**
 * Which act an actor gives at this moment of a scene. Explicit per-beat acts win; otherwise the speaker talks
 * (in a conversation, only during its first beat), the focused actor gives the beat's gesture, and everyone
 * else listens in character via `listen`.
 */
export function actFor(cue: SceneCue, index: number, beat: SceneBeat, actor: CrimeVisualActor, listen: (speaker: CrimeVisualActor | null) => CastAct): CastAct {
  const explicit = beat.acts?.[actor];
  if (explicit) return explicit;
  const lead = cue.kind === "conversation" ? cue.beats[0]?.speaker ?? null : beat.speaker;
  // In a conversation the person you approached keeps talking through the reaction shots, then settles while you choose.
  const holding = cue.kind === "conversation" && index === cue.beats.length - 1 && cue.beats.length > 1;
  if (beat.speaker === actor || (lead === actor && cue.kind === "conversation")) return holding ? "idle" : "talk";
  if (beat.focus === actor) return beat.gesture === "talk" ? "talk" : beat.gesture;
  return listen(lead);
}

/**
 * The town camera's projection during a scene: the overhead oblique matrix blended element-wise into the shot's
 * view-projection. At 0 it is exactly the overhead camera, which is what makes the return to play lossless.
 */
export function blendProjection(overhead: ArrayLike<number>, shot: ArrayLike<number>, amount: number, out: number[] = new Array(16).fill(0)): number[] {
  const a = Math.max(0, Math.min(1, amount));
  for (let i = 0; i < 16; i++) out[i] = a === 0 ? overhead[i]! : overhead[i]! + (shot[i]! - overhead[i]!) * a;
  return out;
}