import type { GameState } from "@/lib/game-state";
import type { CrimeVisualActor } from "@/lib/crime-visual-cues";

/**
 * Visual-only casting for the underworld: who the recurring characters are, how they look, and where mission
 * contacts and props stand inside the real town venues while an objective is open. Nothing here reads or writes
 * rewards, progress or saves; it only describes what to draw for a given (read-only) game state.
 */
export type CastId = CrimeVisualActor;
export type CastStyle = "player" | "mick" | "lez" | "nia" | "clerk" | "stranger" | "shopkeeper" | "buyer";

export type CastLook = {
  name: string;
  role: string;
  outfit: string;
  skin: string;
  hat?: string;
  hatKind?: "cap" | "hard" | "beanie" | "flat";
  /** Height multiplier on the shared stick figure: Lez is lanky, Mick is short and wide. */
  stretch: number;
  /** A genuinely capable person: plays it straight, with economical, precise movement. */
  competent: boolean;
  personality: string;
};

export const CAST_LOOKS: Readonly<Record<Exclude<CastId, "player">, CastLook>> = {
  mick: { name: "Mick", role: "Self-appointed mastermind", outfit: "#6a2333", skin: "#d9a67f", stretch: 0.94, competent: false,
    personality: "Chest out, finger pointing, every errand an international operation. Deflates instantly when challenged." },
  lez: { name: "Lez", role: "Accidental philosopher", outfit: "#7a8248", skin: "#c99572", stretch: 1.12, competent: false,
    personality: "Loose, swaying, stares at things nobody else can see. Long pauses. Means every word, especially the wrong ones." },
  nia: { name: "Nia", role: "Exhausted voice of reason", outfit: "#2f5552", skin: "#8d5a3b", stretch: 1, competent: true,
    personality: "Still, observant, arms folded. A slow head shake does more than a speech. Occasionally, against her will, amused." },
  clerk: { name: "Pawn clerk", role: "Keeper of the crossed-out ledger", outfit: "#b9a77c", skin: "#f0d2b6", stretch: 0.97, competent: false,
    personality: "Twitchy, apologetic, covered in biscuit crumbs. Counts the till twice and trusts neither count." },
  stranger: { name: "The watcher", role: "Waiting outside the diner", outfit: "#9a8a6a", skin: "#c99572", hat: "#4a3d33", hatKind: "flat", stretch: 1.02, competent: false,
    personality: "Patient to the point of geology. Checks the pie sign every ten minutes. Suspicious of the pies." },
  shopkeeper: { name: "Shopkeeper", role: "Corner Shop owner", outfit: "#ece6d8", skin: "#8d5a3b", stretch: 1, competent: true,
    personality: "Calm, precise and entirely unimpressed. The only person in this story who understands the paperwork." },
  buyer: { name: "The buyer", role: "Discreet in sunglasses, indoors", outfit: "#4a3f6a", skin: "#efd0b0", stretch: 1, competent: false,
    personality: "Nervous knee, sunglasses he will not remove, keeps watching the wrong door." },
};

/* ------------------------------------------------------------------ mission props and venue contacts */

export type MissionProp =
  | "ledger" | "soup-coupon" | "biscuits" | "pie-sign" | "envelope" | "wheelbarrow" | "parcel" | "pint" | "ledger-open"
  | "trolley" | "plant" | "birthday-card" | "traffic-cone" | "small-table" | "stool" | "binoculars" | "phone" | "cash";
export type PlacedProp = { kind: MissionProp; x: number; y: number; z: number; rot: number; scale?: number };
/** A person drawn in a venue, in plan metres; `angle` uses the figure convention (0 faces north, 180 faces the street). */
export type PlacedCast = { id: CastId; x: number; z: number; angle: number; pose: "standing" | "sitting"; lift?: number; held?: MissionProp };

export type VenueStoryScene = {
  key: string;
  venue: string;
  storyId: number | null;
  contact: PlacedCast;
  /** Existing plan NPC ids this contact stands in for while the scene is open. */
  replaces: readonly string[];
  props: readonly PlacedProp[];
};

/** Every story contact by venue, placed in clear view of the venue's first-person vantage. */
const STORY_VENUES: Readonly<Record<number, Omit<VenueStoryScene, "key" | "storyId">>> = {
  1: { venue: "pawn", replaces: ["pawn-broker"],
    // Behind-counter staff stand on the step behind the counter so they read over it.
    contact: { id: "clerk", x: 6.4, z: 3.05, angle: 180, pose: "standing", lift: 0.48, held: "ledger-open" },
    props: [
      { kind: "ledger", x: 5.55, y: 1.03, z: 3.95, rot: 0.15 },
      { kind: "soup-coupon", x: 6.95, y: 1.03, z: 4.15, rot: -0.3 },
      { kind: "biscuits", x: 7.55, y: 1.03, z: 3.85, rot: 0 },
    ] },
  2: { venue: "diner", replaces: [],
    // Right in the diner's sightline, by the manager's booth, transfixed by the pie board.
    // At the booth, side-on to you, reading the handwritten pie board propped on the table.
    contact: { id: "stranger", x: 7.3, z: 7.75, angle: 34, pose: "standing" },
    props: [{ kind: "pie-sign", x: 7.62, y: 0.76, z: 7.28, rot: -2.55, scale: 0.55 }] },
  3: { venue: "shop", replaces: ["shopkeeper"],
    contact: { id: "shopkeeper", x: 4.72, z: 6.95, angle: 190, pose: "standing", lift: 0.4, held: "envelope" },
    props: [{ kind: "wheelbarrow", x: 6.95, y: 0, z: 7.6, rot: -0.6 }] },
  4: { venue: "bar", replaces: [],
    // Turned round on his stool to watch the room (and the wrong door).
    contact: { id: "buyer", x: 4.0, z: 3.1, angle: 165, pose: "sitting", lift: 0.45 },
    props: [
      { kind: "parcel", x: 4.45, y: 1.06, z: 2.4, rot: 0.3 },
      { kind: "pint", x: 3.7, y: 1.06, z: 2.35, rot: 0 },
    ] },
};

/**
 * The contact and props to stage inside `venue`, or null. Mission scenes show while the story's investigation is
 * open; the same buyer and clerk also stand in for the crew's pub exchange and parcel drop.
 */
export function venueStoryScene(s: GameState, venue: string): VenueStoryScene | null {
  const story = s.underworldStoryActive ?? 0;
  if (story && (s.underworldStoryStage ?? 0) === 0) {
    const scene = STORY_VENUES[story];
    if (scene && scene.venue === venue) return { ...scene, key: `story-${story}`, storyId: story };
  }
  if (venue === "bar" && s.gangTask === 5) return { ...STORY_VENUES[4]!, key: "gang-buyer", storyId: null, props: STORY_VENUES[4]!.props.filter((p) => p.kind !== "parcel") };
  if (venue === "pawn" && s.gangParcel) {
    const { held: _ledger, ...clerk } = STORY_VENUES[1]!.contact;
    void _ledger;
    return { ...STORY_VENUES[1]!, key: "gang-parcel", storyId: null, contact: clerk, props: [] };
  }
  return null;
}

/* ------------------------------------------------------------------ the alley (town) */

/** The narrow alley between The Tipsy Stick and Lucky Sevens: where the trolley is found. */
export const ALLEY_SPOT = { x: 4.7, y: 24.1, approach: 0.9 } as const;
/** The alley only opens when a crew errand or Lez's favour actually sends the player there. */
export function alleyObjectiveOpen(s: GameState): boolean {
  return s.gangTask === 1 || (s.underworldStoryActive === 5 && (s.underworldStoryStage ?? 0) === 0);
}

/** Where Lez's trolley is, if anywhere: in the alley, beside Lez once collected, or gone once the favour is done. */
export function trolleyLocation(s: GameState): "alley" | "green" | null {
  if (s.underworldStoryActive !== 5) return null;
  return (s.underworldStoryStage ?? 0) === 0 ? "alley" : "green";
}

/** Who holds what at the green, so each open story reads at a glance when you walk up. */
export function crewHeldProps(s: GameState): Partial<Record<"mick" | "lez" | "nia", MissionProp>> {
  const story = s.underworldStoryActive ?? 0;
  const held: Partial<Record<"mick" | "lez" | "nia", MissionProp>> = {};
  if (story === 1) held.nia = "ledger-open";
  if (story === 2) held.lez = "binoculars";
  if (story === 3) held.mick = "phone";
  if (story === 4) held.nia = "parcel";
  // After the late-night favour, Lez keeps the cone that was never stolen.
  if (!held.lez && ((s.underworldStoryMask ?? 0) & (1 << 4))) held.lez = "traffic-cone";
  return held;
}
/** Mick's traffic cone sits by the green until it turns up in Lez's trolley. */
export const conePresentAtGreen = (s: GameState) => s.underworldStoryActive !== 5 && !((s.underworldStoryMask ?? 0) & (1 << 4));