/** In-world incidents have a clear location, a reason to approach and a short-lived daily slot. */
export type EncounterSpot={id:string; x:number;y:number; icon:string;pose:"standing"|"sitting"|"pacing";hint:string;title:string};
export const ENCOUNTER_SPOTS:readonly EncounterSpot[]=[
 {id:"diner",x:8.0,y:16.8,icon:"?",pose:"standing",hint:"Someone needs a hand",title:"Outside the diner"},
 {id:"bar",x:3.8,y:20.9,icon:"…",pose:"sitting",hint:"A regular has a story",title:"By the pub"},
 {id:"alley",x:11.7,y:22.0,icon:"$",pose:"pacing",hint:"An unusual offer",title:"Around the corner"},
 {id:"school",x:11.4,y:6.5,icon:"!",pose:"standing",hint:"A student is looking for help",title:"Near Stick U"},
 {id:"work",x:16.6,y:20.2,icon:"?",pose:"pacing",hint:"A colleague wants a word",title:"By MegaCorp"},
 {id:"shop",x:5.4,y:6.7,icon:"…",pose:"standing",hint:"A neighbour waves",title:"At the corner shop"},
];
export function encounterForDay(day:number):EncounterSpot | null {
 // An occasional optional NPC, in the world until approached or the day ends.
 if(day<2||day%3===0)return null;
 return ENCOUNTER_SPOTS[(day*7+Math.floor(day/3))%ENCOUNTER_SPOTS.length];
}
