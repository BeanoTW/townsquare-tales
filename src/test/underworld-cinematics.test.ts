import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { runAction } from "@/lib/actions";
import { beginStory, finishStory, investigateStory, storyObjective } from "@/lib/underworld-stories";
import { UNDERWORLD_SCRIPTS } from "@/lib/underworld-story-script";
import { directedCrimeCue } from "@/lib/crime-cinematic-director";
import { visualCueForAction } from "@/lib/crime-visual-cues";
import { actFor, beatAt, blendProjection, crewScene, sceneLength, shotFor, storyEpilogueScene, type Marks } from "@/lib/conversation-camera";
import { crimeOutcome, crimeStage } from "@/lib/crime-stage";
import { ALLEY_SPOT, CAST_LOOKS, alleyObjectiveOpen, crewHeldProps, trolleyLocation, venueStoryScene } from "@/lib/crime-cast";
import { venuePlan } from "@/lib/home3d/venues";
import { buildings, townSolids } from "@/lib/town-world";
import { findRoute, isWalkable } from "@/lib/pathfinding";

const deepFreeze = <T,>(o: T): T => { Object.freeze(o); for (const v of Object.values(o as object)) if (v && typeof v === "object") deepFreeze(v); return o; };
const ready = (over: Partial<GameState> = {}): GameState => ({ ...START, day: 40, gangStage: 2, gangRep: 20, criminalTrust: 40, energy: 100, ...over });
const marks: Marks = { mick: { x: 6.15, z: 4.25, scale: 1.45 }, lez: { x: 5.65, z: 4.6, scale: 1.45, stretch: 1.12 }, nia: { x: 6.55, z: 4.45, scale: 1.45, seated: true }, player: { x: 6.1, z: 5.5, scale: 1.45 } };

describe("conversation director", () => {
  it("plays the crew cue as timed beats whose last shot holds while the player chooses", () => {
    const cue = crewScene("mick", "full")!;
    expect(cue.beats.map((b) => b.shot)).toEqual(["speaker-close", "three-shot", "over-shoulder"]);
    expect(cue.beats.at(-1)!.durationMs).toBe(Infinity);
    expect(beatAt(cue, 0).index).toBe(0);
    expect(beatAt(cue, 3500).index).toBe(1);
    expect(beatAt(cue, 60_000).index).toBe(2);
    expect(crewScene("lez", "short")!.beats).toHaveLength(2);
    expect(crewScene("nia", "full", undefined, true)!.beats).toHaveLength(1);
  });

  it("gives every character their own reaction: the speaker talks, the others listen in character", () => {
    const cue = crewScene("mick", "full")!;
    const listen = (actor: string) => (speaker: string | null) => (actor === "nia" && speaker === "mick" ? "arms-crossed" : "idle") as never;
    expect(actFor(cue, 0, cue.beats[0]!, "mick", listen("mick"))).toBe("talk");
    expect(actFor(cue, 0, cue.beats[0]!, "lez", listen("lez"))).toBe("idle");
    expect(actFor(cue, 0, cue.beats[0]!, "nia", listen("nia"))).toBe("arms-crossed");
    // The final, held shot lets the speaker settle.
    expect(actFor(cue, 2, cue.beats[2]!, "mick", listen("mick"))).toBe("idle");
  });

  it("frames every shot from the open side and returns overhead for the overhead shot", () => {
    for (const shot of ["speaker-close", "two-shot", "three-shot", "over-shoulder", "wide"] as const) {
      const pose = shotFor(shot, "nia", marks)!;
      expect(pose.eye.every(Number.isFinite)).toBe(true);
      expect(pose.eye[1]).toBeGreaterThan(0.3);
      expect(pose.eye[2]).toBeGreaterThan(4.2); // never from behind the cast (the home side)
    }
    expect(shotFor("overhead", "mick", marks)).toBeNull();
  });

  it("restores the overhead camera exactly when a scene ends", () => {
    const overhead = Array.from({ length: 16 }, (_, i) => i * 0.37 - 2);
    const shot = Array.from({ length: 16 }, (_, i) => Math.sin(i));
    expect(blendProjection(overhead, shot, 0)).toEqual(overhead);
    expect(blendProjection(overhead, shot, 1).map((v) => +v.toFixed(9))).toEqual(shot.map((v) => +v.toFixed(9)));
  });

  it("plays each story's ending with the script's own words, and lets the last favour breathe", () => {
    for (let id = 1; id <= 5; id++) {
      const scene = storyEpilogueScene(id, "full")!;
      expect(scene.kind).toBe("epilogue");
      // A caption may stay up across two beats; read once, it is the script's epilogue word for word.
      const captions = scene.beats.map((b) => b.caption).filter((c, i, all) => c !== all[i - 1]);
      expect(captions.join(" ").replace(/\s+/g, " ")).toBe(UNDERWORLD_SCRIPTS[id]!.epilogue);
      expect(Number.isFinite(sceneLength(scene))).toBe(true);
      expect(sceneLength(scene)).toBeLessThanOrEqual(9000);
    }
    const favour = storyEpilogueScene(5, "full")!;
    expect(favour.beats[0]!.acts?.lez).toBe("head-down");
    expect(favour.beats[0]!.durationMs).toBeGreaterThanOrEqual(2500);
    expect(favour.beats.at(-1)!.acts?.lez).toBe("present-cone");
  });

  it("plays nothing when cutscenes are off, and holds still with reduced motion", () => {
    expect(crewScene("mick", "off")).toBeNull();
    expect(storyEpilogueScene(3, "off")).toBeNull();
    expect(storyEpilogueScene(3, "full", true)!.beats).toHaveLength(1);
  });
});

describe("crime cutscenes", () => {
  const actions = ["underworld-investigate-1-ask", "underworld-investigate-2-observe", "underworld-investigate-3-improvise", "underworld-investigate-4-ask", "underworld-investigate-5-observe", "gang-encounter-1-quiet", "gang-encounter-2-quiet", "gang-encounter-3-bold", "gang-encounter-4-persuade", "gang-encounter-5-quiet", "gang-parcel-handoff", "mug"];

  it("casts and blocks every mapped action on a set, within the 3–6 second brief", () => {
    for (const id of actions) {
      const story = Number(/investigate-(\d)/.exec(id)?.[1] ?? 0);
      const before = ready({ underworldStoryActive: story, underworldStoryStage: 0, gangTask: Number(/encounter-(\d)/.exec(id)?.[1] ?? 0), gangParcel: id === "gang-parcel-handoff" ? 1 : 0 });
      const after = { ...before, underworldStoryStage: story ? 1 : 0, underworldStoryClue: 2, gangTask: 0, gangParcel: 0, money: before.money + 50 };
      const spec = crimeStage({ actionId: id, before, after, changes: [], message: "ok", mode: "full" }, 1)!;
      expect(spec, id).not.toBeNull();
      const cue = visualCueForAction(id)!;
      for (const actor of cue.cast) expect(spec.crime!.cast.map((c) => c.id), id).toContain(actor);
      expect(spec.duration, id).toBeGreaterThanOrEqual(3);
      expect(spec.duration, id).toBeLessThanOrEqual(6);
    }
  });

  it("is built from the outcome and never changes it", () => {
    const before = deepFreeze(ready({ underworldStoryActive: 1, underworldStoryStage: 0 }));
    const result = runAction(before, investigateStory(1, "observe"), () => 0.5);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const after = deepFreeze(result.next);
    const spec = crimeStage({ actionId: "underworld-investigate-1-observe", before, after, changes: result.changes, message: result.message, mode: "full" }, 7)!;
    expect(spec.crime!.outcome).toBe("success");
    expect(Object.keys(spec)).not.toContain("patch");
    // Building the scene twice gives the same scene and leaves the state exactly as the action left it.
    expect(crimeStage({ actionId: "underworld-investigate-1-observe", before, after, changes: result.changes, message: result.message, mode: "full" }, 7)).toEqual(spec);
    expect(after.underworldStoryStage).toBe(1);
  });

  it("shows a fumbled approach only when the script says it didn't land", () => {
    const before = ready({ underworldStoryActive: 2, underworldStoryStage: 0, cha: 1 });
    const flop = runAction(before, investigateStory(2, "ask"), () => 0.5);
    const fine = runAction(before, investigateStory(2, "observe"), () => 0.5);
    if (!flop.ok || !fine.ok) throw new Error("investigation should run");
    expect(crimeStage({ actionId: "underworld-investigate-2", before, after: flop.next, changes: [], message: flop.message, mode: "full" }, 1)!.caption).toBe("IT DOESN'T QUITE LAND");
    expect(crimeStage({ actionId: "underworld-investigate-2", before, after: fine.next, changes: [], message: fine.message, mode: "full" }, 1)!.caption).toBeNull();
  });

  it("shows a setback without inventing a handover", () => {
    const before = ready({ gangTask: 5 });
    expect(crimeOutcome("gang-encounter-5-bold", before, before)).toBe("setback");
    const spec = crimeStage({ actionId: "gang-encounter-5-bold", before, after: before, changes: [], message: "no", mode: "full" }, 1)!;
    expect(spec.crime!.handover).toBeNull();
    expect(spec.caption).toBe("IT DOESN'T QUITE LAND");
  });

  it("respects off, short and reduced-motion preferences, and is always skippable", () => {
    const req = { actionId: "gang-parcel-handoff", before: ready({ gangParcel: 1 }), after: ready(), changes: [], message: "" };
    expect(crimeStage({ ...req, mode: "off" }, 1)).toBeNull();
    expect(crimeStage({ ...req, mode: "short" }, 1)!.duration).toBeLessThan(crimeStage({ ...req, mode: "full" }, 1)!.duration);
    const still = crimeStage({ ...req, mode: "full", reducedMotion: true }, 1)!;
    expect(still.crime!.cue.beats).toHaveLength(1);
    expect(still.crime!.reduced).toBe(true);
    expect(directedCrimeCue("gang-parcel-handoff", "full")!.skippable).toBe(true);
    expect(crimeStage({ ...req, actionId: "sleep", mode: "full" }, 1)).toBeNull();
    // Story endings play at the green with the crew instead of a card.
    expect(crimeStage({ ...req, actionId: "underworld-story-finish-1-steady", mode: "full" }, 1)).toBeNull();
  });
});

describe("mission contacts and props", () => {
  it("stages each venue's contact inside the real room while its objective is open", () => {
    for (const [id, venue] of [[1, "pawn"], [2, "diner"], [3, "shop"], [4, "bar"]] as const) {
      const s = ready({ underworldStoryActive: id, underworldStoryStage: 0 });
      expect(storyObjective(s)?.venue).toBe(venue);
      const scene = venueStoryScene(s, venue)!;
      const plan = venuePlan(venue)!;
      expect(scene.contact.x).toBeGreaterThan(0);
      expect(scene.contact.x).toBeLessThan(plan.size.w);
      expect(scene.contact.z).toBeGreaterThan(0);
      expect(scene.contact.z).toBeLessThan(plan.size.d);
      for (const replaced of scene.replaces) expect(plan.npcs?.map((n) => n.id)).toContain(replaced);
      expect(venueStoryScene({ ...s, underworldStoryStage: 1 }, venue)).toBeNull();
      expect(venueStoryScene(s, "gym")).toBeNull();
    }
    expect(venueStoryScene(ready({ gangTask: 5 }), "bar")?.contact.id).toBe("buyer");
  });

  it("gives Mick, Lez and Nia distinct looks, with Nia (and the shopkeeper) the capable ones", () => {
    const looks = (["mick", "lez", "nia"] as const).map((id) => CAST_LOOKS[id]);
    expect(new Set(looks.map((l) => l.outfit)).size).toBe(3);
    expect(new Set(looks.map((l) => l.stretch)).size).toBe(3);
    expect(Object.values(CAST_LOOKS).filter((l) => l.competent).map((l) => l.name)).toEqual(["Nia", "Shopkeeper"]);
  });

  it("follows Lez's trolley from the alley to the green, and leaves the cone with Lez afterwards", () => {
    const open = ready({ underworldStoryActive: 5, underworldStoryStage: 0 });
    expect(trolleyLocation(open)).toBe("alley");
    expect(trolleyLocation({ ...open, underworldStoryStage: 1 })).toBe("green");
    expect(trolleyLocation(ready())).toBeNull();
    expect(crewHeldProps(ready({ underworldStoryMask: 0b11111 })).lez).toBe("traffic-cone");
    expect(crewHeldProps(ready({ underworldStoryActive: 1 })).nia).toBe("ledger-open");
  });
});

describe("the five missions stay completable", () => {
  it("runs every story from introduction to payout through the existing rules", () => {
    let s = ready({ underworldStoryMask: 0 });
    const contacts = ["nia", "lez", "mick", "nia", "lez"] as const;
    for (let id = 1 as 1 | 2 | 3 | 4 | 5; id <= 5; id = (id + 1) as typeof id) {
      void contacts;
      const begun = runAction(s, beginStory(id), () => 0.5);
      expect(begun.ok, `begin ${id}`).toBe(true);
      if (!begun.ok) return;
      s = begun.next;
      if (id === 5) expect(alleyObjectiveOpen(s)).toBe(true);
      const looked = runAction(s, investigateStory(id, "observe"), () => 0.5);
      expect(looked.ok, `investigate ${id}`).toBe(true);
      if (!looked.ok) return;
      s = looked.next;
      const money = s.money;
      const done = runAction(s, finishStory(id, "steady"), () => 0.5);
      expect(done.ok, `finish ${id}`).toBe(true);
      if (!done.ok) return;
      expect(done.next.money).toBeGreaterThan(money);
      s = { ...done.next, energy: 100, hour: 9 };
    }
    expect(s.underworldStoryMask).toBe(0b11111);
  });

  it("can reach the alley between the pub and the casino on foot", () => {
    const solids = townSolids(buildings(1));
    expect(isWalkable({ x: ALLEY_SPOT.x, y: ALLEY_SPOT.y }, solids)).toBe(true);
    const route = findRoute({ x: 9.9, y: 9 }, { x: ALLEY_SPOT.x, y: ALLEY_SPOT.y }, solids);
    const end = route[route.length - 1]!;
    expect(Math.hypot(end.x - ALLEY_SPOT.x, end.y - ALLEY_SPOT.y)).toBeLessThan(0.6);
    expect(alleyObjectiveOpen(ready())).toBe(false);
    expect(alleyObjectiveOpen(ready({ gangTask: 1 }))).toBe(true);
  });
});