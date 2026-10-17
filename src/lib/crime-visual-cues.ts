/** Visual-only crime scene contracts. No game-state mutation or reward logic belongs here. */
export type CrimeVisualKind = "robbery" | "delivery" | "lookout" | "collection" | "investigation" | "negotiation";
export type CrimeVisualActor = "player" | "mick" | "lez" | "nia" | "clerk" | "buyer" | "stranger" | "shopkeeper";
export type CrimeVisualCue = {
  id: string;
  kind: CrimeVisualKind;
  venue: "alley"|"bank"|"pawn"|"bar"|"shop"|"diner"|"gang";
  cast: readonly CrimeVisualActor[];
  prop: "parcel"|"envelope"|"ledger"|"trolley"|"cash"|"none";
  tone: "absurd"|"suspicious"|"reflective";
  /** Default animation time. Existing cutscene mode determines actual duration. */
  suggestedDurationSeconds: number;
};
export const CRIME_VISUAL_CUES:Readonly<Record<string,CrimeVisualCue>> = {
 "underworld-investigate-1":{id:"underworld-investigate-1",kind:"investigation",venue:"pawn",cast:["player","clerk"],prop:"ledger",tone:"absurd",suggestedDurationSeconds:3},
 "underworld-investigate-2":{id:"underworld-investigate-2",kind:"lookout",venue:"diner",cast:["player","stranger"],prop:"none",tone:"suspicious",suggestedDurationSeconds:3},
 "underworld-investigate-3":{id:"underworld-investigate-3",kind:"collection",venue:"shop",cast:["player","shopkeeper"],prop:"envelope",tone:"absurd",suggestedDurationSeconds:3},
 "underworld-investigate-4":{id:"underworld-investigate-4",kind:"negotiation",venue:"bar",cast:["player","buyer"],prop:"parcel",tone:"suspicious",suggestedDurationSeconds:3},
 "underworld-investigate-5":{id:"underworld-investigate-5",kind:"delivery",venue:"alley",cast:["player","lez"],prop:"trolley",tone:"reflective",suggestedDurationSeconds:4},
 "gang-parcel-handoff":{id:"gang-parcel-handoff",kind:"delivery",venue:"pawn",cast:["player","clerk"],prop:"parcel",tone:"absurd",suggestedDurationSeconds:2.5},
 "gang-task-3":{id:"gang-task-3",kind:"lookout",venue:"bank",cast:["player","stranger"],prop:"none",tone:"suspicious",suggestedDurationSeconds:3},
 "gang-task-1":{id:"gang-task-1",kind:"collection",venue:"alley",cast:["player","stranger"],prop:"envelope",tone:"suspicious",suggestedDurationSeconds:3},
 "gang-task-2":{id:"gang-task-2",kind:"delivery",venue:"gang",cast:["player","mick","lez","nia"],prop:"envelope",tone:"absurd",suggestedDurationSeconds:3},
 "gang-task-4":{id:"gang-task-4",kind:"negotiation",venue:"gang",cast:["player","mick","lez","nia"],prop:"none",tone:"absurd",suggestedDurationSeconds:3},
 "gang-task-5":{id:"gang-task-5",kind:"negotiation",venue:"bar",cast:["player","buyer"],prop:"parcel",tone:"suspicious",suggestedDurationSeconds:3},
};
export function visualCueForAction(actionId:string):CrimeVisualCue|null {
 if(actionId.startsWith("underworld-investigate-")) {
  return CRIME_VISUAL_CUES[actionId.replace(/-(observe|ask|improvise)$/,"")]??null;
 }
 const encounter=/^gang-encounter-(\d)-/.exec(actionId);
 if(encounter)return CRIME_VISUAL_CUES["gang-task-"+encounter[1]]??null;
 if(actionId==="gang-parcel-handoff")return CRIME_VISUAL_CUES[actionId]!;
 if(actionId.startsWith("underworld-story-finish-"))return null; // resolution uses the authored scene's own dialogue
 if(actionId.includes("robbery")||actionId==="mug")return {id:actionId,kind:"robbery",venue:"shop",cast:["player","shopkeeper"],prop:"cash",tone:"suspicious",suggestedDurationSeconds:3};
 return null;
}
