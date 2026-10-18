import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, type MutableRefObject, type ReactNode } from "react";
import * as THREE from "three";
import { Person, type PersonState } from "@/components/Character3D";
import { Box, Cyl, Group, Round } from "@/components/home3d/primitives";
import { Decor, Furniture, Lights } from "@/components/home3d/HomeScene3D";
import { Floors, Plinth, Wall } from "@/components/home3d/parts";
import { Figure } from "@/components/home3d/mansion";
import { venuePlan } from "@/lib/home3d/venues";
import { BookieFigure, OddsBoard } from "@/components/fight/Bookmaker";
import { IMPACT, crowdAct, fighterAct, type CrowdMood, type FighterRole } from "@/components/fight/fight-acts";
import { eventSeconds, type FightEvent, type FighterLook, type FightVenuePreset, type ShotPreset, type Side, type V3 } from "@/lib/fight-presentation";
import type { CutsceneMode } from "@/lib/conversation-camera";

/**
 * The brawl, drawn in the venue itself: The Tipsy Stick's real floor plan, the two fighters on the dance floor,
 * a loose ring of regulars, Ron at his board and the bartender not caring. The stage only performs events the
 * combat engine has already resolved; it is driven by `show`, which the fight screen updates.
 */
export type FightPhase = "wager" | "intro" | "fight" | "result";
export type FightShow = {
  phase: FightPhase;
  /** performance.now() when the phase began. */
  phaseAt: number;
  events: readonly FightEvent[];
  eventsAt: number;
  guards: Record<Side, boolean>;
  mode: CutsceneMode;
  reduced: boolean;
};
export const FIGHT_SCALE = 1.8;
const now = () => performance.now();
const ease = (x: number) => (x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x));

/** Intro beats, as fractions of its length: Ron confirms the bet, the regulars gather, the fighters square up. */
export const INTRO_SECONDS: Record<CutsceneMode, number> = { full: 4.4, short: 2.2, off: 0 };
export const INTRO_BEATS = { gather: 0.3, faceoff: 0.62 } as const;

type Playhead = { index: number; event: FightEvent | null; p: number; local: number; dur: number; done: boolean };
/** Which event is playing `elapsed` seconds into a queue. */
export function playhead(events: readonly FightEvent[], elapsed: number, mode: CutsceneMode, reduced: boolean): Playhead {
  let start = 0;
  for (let i = 0; i < events.length; i++) {
    const dur = eventSeconds(events[i]!, mode, reduced);
    if (elapsed < start + dur) return { index: i, event: events[i]!, p: (elapsed - start) / dur, local: elapsed - start, dur, done: false };
    start += dur;
  }
  const last = events[events.length - 1] ?? null;
  return { index: events.length - 1, event: last, p: 1, local: last ? eventSeconds(last, mode, reduced) + (elapsed - start) : 0, dur: last ? eventSeconds(last, mode, reduced) : 0, done: true };
}

/** The knockout, if one has happened by now: who is down and for how long. */
function knockout(events: readonly FightEvent[], ph: Playhead): { loser: Side; since: number } | null {
  const ko = events.findIndex((e) => e.ko);
  if (ko < 0 || ph.index < ko) return null;
  const e = events[ko]!;
  const local = ph.index > ko ? 99 : ph.local;
  const impact = ph.index > ko ? 0 : IMPACT[e.move] * ph.dur;
  if (ph.index === ko && local < impact) return null;
  return { loser: e.actor === "player" ? "opponent" : "player", since: local - impact };
}

function roleFor(side: Side, show: FightShow, ph: Playhead): FighterRole {
  if (show.phase === "wager") return { kind: "idle", guarded: false };
  if (show.phase === "intro") return side === "opponent" ? { kind: "taunt" } : { kind: "idle", guarded: false };
  const ko = knockout(show.events, ph);
  if (ko) return ko.loser === side ? { kind: "ko", since: ko.since } : ko.since > 0.6 ? { kind: "win" } : { kind: "idle", guarded: false };
  const e = ph.event;
  if (!e || ph.done) return { kind: "idle", guarded: show.guards[side] };
  if (e.actor === side) return { kind: "attack", move: e.move, missed: e.outcome === "miss", p: ph.p };
  const attacking = e.move === "jab" || e.move === "hook" || e.move === "heavy";
  if (!attacking) return { kind: "idle", guarded: e.before[side].guard };
  return { kind: "defend", move: e.move, outcome: e.outcome, guarded: e.before[side].guard, heavy: e.move === "heavy", p: ph.p };
}

/* ------------------------------------------------------------------ fighters */

function FighterBody({ look, skin, outfit, side, preset, show }: { look: FighterLook; skin?: string; outfit?: string; side: Side; preset: FightVenuePreset; show: MutableRefObject<FightShow> }) {
  const mark = preset[side];
  const state = useRef<PersonState>({ x: mark.x, z: mark.z, angle: side === "player" ? 90 : 270, walking: false, pose: "standing", visible: true });
  const style = look.style;
  const get = () => {
    const s = show.current;
    const t = now() / 1000 + (side === "opponent" ? 1.3 : 0);
    const ph = playhead(s.events, (now() - s.eventsAt) / 1000, s.mode, s.reduced);
    const role = roleFor(side, s, ph);
    const st = state.current;
    st.act = role.kind === "idle" && !role.guarded && s.phase === "wager" ? undefined : fighterAct(style, role, s.reduced ? 0 : t);
    st.actT = 0;
    return st;
  };
  // Width comes from a squashed torso rather than a different model, so everyone stays a Stick Town person.
  const bulk = look.bulk;
  const extras = dressFighter(look.style, bulk);
  return (
    <Person get={get} outfit={outfit ?? look.outfit} skin={skin ?? look.skin} legs={look.legs} scale={FIGHT_SCALE} stretch={look.stretch}
      headExtra={extras.head} bodyExtra={extras.body} />
  );
}

/** Distinguishing pieces per fighter, in the figure's head and torso space. */
function dressFighter(style: FighterLook["style"], bulk: number): { head: ReactNode; body: ReactNode } {
  const torso = (c: string) => bulk !== 1 ? <mesh position={[0, 0.315, 0]} scale={[0.095 * bulk, 0.088, 0.078 * Math.min(1.15, bulk)]}><capsuleGeometry args={[1, 1, 4, 10]} /><meshStandardMaterial color={c} roughness={0.7} /></mesh> : null;
  switch (style) {
    case "barry": return {
      // Bald, sunburnt, vest, tattooed shoulders, a neck like a bollard.
      head: <><Box s={[0.05, 0.012, 0.012]} p={[-0.04, 0.125, 0.1]} r={[0, 0, 0.15]} c="#6a4a2a" shadow={false} /><Box s={[0.05, 0.012, 0.012]} p={[0.04, 0.125, 0.1]} r={[0, 0, -0.15]} c="#6a4a2a" shadow={false} /><Cyl rad={0.07} h={0.06} p={[0, -0.02, 0]} c="#e2b08a" /></>,
      body: <>{torso("#e8e2d2")}<Box s={[0.05, 0.03, 0.01]} p={[0.12, 0.38, 0.02]} c="#3a5a8a" shadow={false} /><Box s={[0.05, 0.03, 0.01]} p={[-0.12, 0.38, 0.02]} c="#b8433c" shadow={false} /></>,
    };
    case "pete": return {
      // Red headband, permanent squint, a bandage on the punching hand's knuckles.
      head: <><Cyl rad={0.113} h={0.025} p={[0, 0.13, 0]} c="#e0e0e0" shadow={false} /><Box s={[0.04, 0.05, 0.01]} p={[-0.06, 0.12, -0.1]} r={[0.3, 0, 0.3]} c="#e0e0e0" shadow={false} /><Round s={[0.2, 0.04, 0.2]} p={[0, 0.18, -0.01]} c="#2a1e1a" rad={0.02} shadow={false} /></>,
      body: <>{torso("#c94a3a")}<Box s={[0.12, 0.05, 0.01]} p={[0, 0.34, 0.072]} c="#f4ead6" shadow={false} /></>,
    };
    case "derek": return {
      // Shaved head, scar, mouthguard he brought from home, black tracksuit zipped to the chin.
      head: <><Box s={[0.006, 0.05, 0.006]} p={[0.06, 0.1, 0.095]} r={[0, 0, 0.3]} c="#5a2a22" shadow={false} /><Box s={[0.05, 0.012, 0.012]} p={[-0.04, 0.12, 0.1]} r={[0, 0, -0.3]} c="#1d1b20" shadow={false} /><Box s={[0.05, 0.012, 0.012]} p={[0.04, 0.12, 0.1]} r={[0, 0, 0.3]} c="#1d1b20" shadow={false} /><Box s={[0.05, 0.015, 0.01]} p={[0, 0.045, 0.104]} c="#3a8adf" shadow={false} /></>,
      body: <><Box s={[0.006, 0.2, 0.006]} p={[0, 0.33, 0.077]} c="#c9ccd2" shadow={false} /><Box s={[0.2, 0.012, 0.16]} p={[0, 0.25, 0]} c="#b8433c" shadow={false} /></>,
    };
    case "cousin": return {
      // A ginger version of Mick's quiff, a lanyard from an event nobody remembers, one sock pulled up.
      head: <><Round s={[0.23, 0.07, 0.23]} p={[0, 0.14, -0.012]} c="#c96a2a" rad={0.03} shadow={false} /><Round s={[0.09, 0.06, 0.07]} p={[0.02, 0.2, 0.07]} c="#c96a2a" rad={0.02} shadow={false} /></>,
      body: <><Box s={[0.012, 0.18, 0.006]} p={[-0.025, 0.36, 0.077]} r={[0, 0, 0.12]} c="#3a8adf" shadow={false} /><Box s={[0.04, 0.05, 0.006]} p={[-0.035, 0.27, 0.08]} c="#f4f1ea" shadow={false} /></>,
    };
    default: return { head: null, body: torso("#2b2a2e") };
  }
}

/* ------------------------------------------------------------------ crowd */

function Spectator({ i, preset, show }: { i: number; preset: FightVenuePreset; show: MutableRefObject<FightShow> }) {
  const sp = preset.spectators[i]!;
  const cx = (preset.player.x + preset.opponent.x) / 2, cz = (preset.player.z + preset.opponent.z) / 2;
  const away = Math.atan2(sp.x - cx, sp.z - cz);
  const state = useRef<PersonState>({ x: sp.x, z: sp.z, angle: sp.angle, walking: false, pose: "standing", visible: true });
  const get = () => {
    const s = show.current;
    const st = state.current;
    const t = now() / 1000;
    // During the intro the regulars drift in from the edges to make a loose circle.
    let k = 1;
    // Nobody gathers until there's a fight to watch.
    st.visible = s.phase !== "wager";
    if (s.phase === "wager") k = 0;
    else if (s.phase === "intro" && !s.reduced) {
      const len = INTRO_SECONDS[s.mode] || 1;
      const f = (now() - s.phaseAt) / 1000 / len;
      // They arrive on the gather shot, not in front of Ron while he takes the money.
      if (f < INTRO_BEATS.gather) st.visible = false;
      k = ease((f - INTRO_BEATS.gather + 0.05) / (INTRO_BEATS.faceoff - INTRO_BEATS.gather));
    }
    const off = 1.1 * (1 - k);
    st.x = sp.x + Math.sin(away) * off; st.z = sp.z + Math.cos(away) * off;
    st.walking = k > 0 && k < 1;
    st.angle = st.walking ? (Math.atan2(cx - st.x, -(cz - st.z)) * 180) / Math.PI : sp.angle;
    let mood: CrowdMood = "watch";
    const ph = playhead(s.events, (now() - s.eventsAt) / 1000, s.mode, s.reduced);
    const e = ph.event;
    if ((s.phase === "fight" || s.phase === "result") && e) {
      const landed = ph.done || ph.p >= IMPACT[e.move];
      const ko = s.events.find((x) => x.ko);
      if (ko && (ph.done || ph.index > s.events.indexOf(ko) || (e === ko && landed))) mood = ko.actor === "player" ? "erupt" : "wince";
      else if (landed && !ph.done && e.outcome === "hit") mood = e.big ? "ooh" : (i + ph.index) % 3 === 0 ? "cheer" : "watch";
    }
    st.act = st.walking ? undefined : crowdAct(mood, i, s.reduced ? 0 : t);
    st.actT = 0;
    return st;
  };
  return <Person get={get} outfit={sp.outfit} skin={sp.skin} {...(sp.hat ? { hat: sp.hat, hatKind: "cap" as const } : {})} scale={FIGHT_SCALE} />;
}

function Bookie({ preset, show }: { preset: FightVenuePreset; show: MutableRefObject<FightShow> }) {
  const b = preset.bookie!;
  const state = useRef<PersonState>({ x: b.x, z: b.z, angle: b.angle, walking: false, pose: "standing", visible: true });
  const get = () => {
    const s = show.current;
    const t = now() / 1000;
    const st = state.current;
    st.act = (r) => {
      if (s.phase === "wager" || s.phase === "intro") {
        // Taking the bet: a showman's open palm, then the notebook.
        r.armR.rotation.x = -1.3 + Math.sin(t * 2.4) * 0.15; r.armR.rotation.z = 0.5; r.reach("r", 0.9);
        r.armL.rotation.x = -1.0; r.armL.rotation.z = 0.2; r.reach("l", 0.55);
        r.head.rotation.x = -0.05;
      } else {
        const write = (t % 4) < 2.6;
        r.armL.rotation.x = -1.05; r.armL.rotation.z = 0.25; r.reach("l", 0.55);
        r.armR.rotation.x = write ? -1.0 + Math.sin(t * 9) * 0.06 : -0.3; r.armR.rotation.z = 0.35; r.reach("r", write ? 0.6 : 1);
        r.head.rotation.x = write ? 0.3 : 0;
      }
    };
    st.actT = 0;
    return st;
  };
  return (
    <>
      <Group p={[b.x, 0, b.z]} r={[0, Math.PI - (b.angle * Math.PI) / 180, 0]}><Group p={[0, 0, -0.1]}><OddsBoard /></Group></Group>
      <BookieFigure get={get} scale={FIGHT_SCALE} />
    </>
  );
}

/* ------------------------------------------------------------------ the room */

const noRegister = () => {};
function Room({ preset }: { preset: FightVenuePreset }) {
  const plan = preset.plan ? venuePlan(preset.plan) : null;
  const owned = useMemo(() => new Set(plan?.slots.map((s) => s.id) ?? []), [plan]);
  if (!plan) {
    return (
      <>
        <hemisphereLight args={["#d9e4ff", "#1a1a20", 0.9]} />
        <directionalLight position={[2, 6, 3]} intensity={1.4} color={preset.light} castShadow />
        <Cyl rad={3} h={0.06} p={[0, -0.03, 0]} c={preset.floor} />
      </>
    );
  }
  return (
    <>
      <Lights plan={plan} day={0.55} />
      <Plinth plan={plan} />
      <Floors plan={plan} />
      {plan.walls.map((w) => <Wall key={w.id} spec={w} register={noRegister} />)}
      <Decor plan={plan} owned={owned} />
      {plan.slots.filter((s) => s.id !== "pub-brawl").map((s) => (
        <group key={s.id} position={[s.x, 0, s.z]} rotation={[0, s.rot, 0]}><Furniture slot={s} plan={plan} luxury={false} hasBed={false} /></group>
      ))}
      {plan.npcs?.filter((n) => !preset.clears.includes(n.id)).map((n) => <Figure key={n.id} npc={n} />)}
      {/* two stools that got dragged off the floor when the circle formed */}
      <Group p={[7.55, 0, 5.6]}><Cyl rad={0.17} h={0.05} p={[0, 0.62, 0]} c="#a02a2a" /><Cyl rad={0.025} h={0.6} p={[0, 0.3, 0]} c="#c9ccd2" /></Group>
      <Group p={[11.1, 0, 7.6]} r={[Math.PI / 2.2, 0, 0.3]}><Cyl rad={0.17} h={0.05} p={[0, 0.2, 0]} c="#a02a2a" /><Cyl rad={0.025} h={0.6} p={[0, 0.2, -0.3]} c="#c9ccd2" /></Group>
      <Round s={[0.4, 0.01, 0.25]} p={[9.6, 0.075, 6.8]} c="#c98a2a" rad={0.005} o={{ opacity: 0.6, rough: 0.1 }} shadow={false} />
      <Box s={[0.05, 0.16, 0.05]} p={[9.8, 0.13, 6.75]} r={[0, 0, Math.PI / 2]} c="#2a5a3a" o={{ opacity: 0.85, rough: 0.1 }} />
    </>
  );
}

/* ------------------------------------------------------------------ camera and popups */

export type Popups = { player: HTMLElement | null; opponent: HTMLElement | null };

function Director({ preset, show, popups }: { preset: FightVenuePreset; show: MutableRefObject<FightShow>; popups: MutableRefObject<Popups> }) {
  const { camera, size } = useThree();
  const cur = useRef({ eye: new THREE.Vector3(), target: new THREE.Vector3(), fov: 60, phase: "" as string });
  const tmp = useMemo(() => ({ eye: new THREE.Vector3(), target: new THREE.Vector3(), p: new THREE.Vector3() }), []);
  useFrame((_, delta) => {
    const s = show.current;
    const dt = Math.min(delta, 0.05);
    const pick = (shot: ShotPreset) => { tmp.eye.set(...shot.eye); tmp.target.set(...shot.target); return shot.fov; };
    let fov = 60;
    let shake = 0;
    const ph = playhead(s.events, (now() - s.eventsAt) / 1000, s.mode, s.reduced);
    if (s.phase === "wager") fov = pick(preset.shots.wager);
    else if (s.phase === "intro") {
      const len = INTRO_SECONDS[s.mode] || 1;
      const f = (now() - s.phaseAt) / 1000 / len;
      fov = pick(f < INTRO_BEATS.gather ? preset.shots.wager : f < INTRO_BEATS.faceoff ? preset.shots.gather : preset.shots.faceoff);
    } else if (s.phase === "result") fov = pick(preset.shots.result);
    else {
      fov = pick(preset.shots.fight);
      const e = ph.event;
      const ko = knockout(s.events, ph);
      if (ko) {
        // Down on the floor: drop the camera and move in on the fallen fighter.
        const m = preset[ko.loser];
        tmp.target.set(m.x, 0.35, m.z);
        tmp.eye.set(m.x - 0.5, 0.85, m.z + 1.9);
        fov = 52;
      } else if (e && !ph.done && e.big && ph.p >= IMPACT[e.move] && !s.reduced) {
        // A real connection: a small push-in and a jolt, nothing more.
        const since = (ph.p - IMPACT[e.move]) * ph.dur;
        const push = Math.max(0, 1 - since / 0.6);
        tmp.eye.lerp(tmp.target, 0.18 * push);
        shake = 0.035 * Math.max(0, 1 - since / 0.3);
      }
    }
    // Portrait screens widen the lens (rather than backing the camera through a wall) so both fighters fit.
    const fit = Math.min(1.45, Math.max(1, 0.62 / (size.width / Math.max(1, size.height))));
    if (fit > 1) fov = (2 * Math.atan(Math.tan((fov * Math.PI) / 360) * fit) * 180) / Math.PI;
    const c = cur.current;
    const cut = c.phase !== s.phase + (s.phase === "intro" ? Math.floor(((now() - s.phaseAt) / 1000 / (INTRO_SECONDS[s.mode] || 1)) * 3) : "");
    if (cut && (s.reduced || c.phase === "" || s.phase === "intro" || s.phase === "wager")) { c.eye.copy(tmp.eye); c.target.copy(tmp.target); c.fov = fov; }
    else { const k = 1 - Math.exp(-dt * 3.5); c.eye.lerp(tmp.eye, k); c.target.lerp(tmp.target, k); c.fov += (fov - c.fov) * k; }
    c.phase = s.phase + (s.phase === "intro" ? Math.floor(((now() - s.phaseAt) / 1000 / (INTRO_SECONDS[s.mode] || 1)) * 3) : "");
    camera.position.copy(c.eye);
    if (shake) camera.position.add(new THREE.Vector3((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake, 0));
    camera.lookAt(c.target);
    const pc = camera as THREE.PerspectiveCamera;
    if (Math.abs(pc.fov - c.fov) > 0.01) { pc.fov = c.fov; pc.updateProjectionMatrix(); }
    // Damage readouts float above the fighter who took (or dodged) the blow.
    for (const side of ["player", "opponent"] as const) {
      const el = popups.current[side];
      if (!el) continue;
      const e = ph.event;
      const target: Side = e?.actor === "player" ? "opponent" : "player";
      const self = e && (e.move === "recover" || e.move === "block") ? e.actor : target;
      const at = e ? IMPACT[e.move] * ph.dur : 0;
      const age = e ? ph.local - at : 99;
      const showIt = s.phase === "fight" && e && self === side && age >= 0 && age < 0.95;
      if (!showIt || !e) { el.style.opacity = "0"; continue; }
      const m = preset[side];
      tmp.p.set(m.x, 1.55 + age * 0.35, m.z).project(camera);
      el.textContent = e.ko ? "K.O.!" : e.outcome === "miss" ? "MISS" : e.outcome === "recover" ? "+2 AP" : e.outcome === "brace" ? "GUARD UP" : e.outcome === "blocked" ? `BLOCKED −${e.damage}` : `−${e.damage}`;
      el.dataset["kind"] = e.ko ? "ko" : e.outcome === "hit" ? (e.big ? "big" : "hit") : e.outcome;
      el.style.opacity = String(Math.min(1, (0.95 - age) * 4));
      el.style.transform = `translate(${((tmp.p.x + 1) / 2) * size.width}px, ${((1 - tmp.p.y) / 2) * size.height}px) translate(-50%, -100%) scale(${e.big || e.ko ? 1.25 : 1})`;
    }
  }, -1);
  return null;
}

export function FightStage({ preset, opponent, player, show, popups }: {
  preset: FightVenuePreset; opponent: FighterLook; player: FighterLook & { skin: string; outfit: string };
  show: MutableRefObject<FightShow>; popups: MutableRefObject<Popups>;
}) {
  return (
    <Canvas shadows="percentage" dpr={[1, 1.5]} camera={{ fov: 60, near: 0.05, far: 60, position: [8.5, 1.6, 7.9] }}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }} style={{ background: "#1a1220", touchAction: "none" }}>
      <Room preset={preset} />
      <FighterBody look={player} skin={player.skin} outfit={player.outfit} side="player" preset={preset} show={show} />
      <FighterBody look={opponent} side="opponent" preset={preset} show={show} />
      {preset.spectators.map((_, i) => <Spectator key={i} i={i} preset={preset} show={show} />)}
      {preset.bookie && <Bookie preset={preset} show={show} />}
      <Director preset={preset} show={show} popups={popups} />
      {/* soft pools of light on the floor, so the fight reads under the disco lights */}
      <pointLight position={[(preset.player.x + preset.opponent.x) / 2, 2.6, preset.player.z + 0.6] as V3} color={preset.light} intensity={10} distance={6} decay={1.3} />
    </Canvas>
  );
}