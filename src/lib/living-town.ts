import type { GameState } from "@/lib/game-state";

/** Recurring residents have predictable places to be, preferences and permanent reputation. */
export type ResidentId = "mara" | "nox" | "gus" | "ivy";
export type Resident = { id: ResidentId; name: string; title: string; color: string; x: number; y: number; mood: string; hint: string };
export const RESIDENTS: readonly { id: ResidentId; name: string; title: string; color: string; early: [number,number]; day: [number,number]; night: [number,number] }[] = [
  { id:"mara",name:"Mara",title:"The tired shop assistant",color:"#594760",early:[5.6,7.0],day:[15.1,12.2],night:[4.9,7.1] },
  { id:"nox",name:"Nox",title:"The local troublemaker",color:"#733d45",early:[21.8,22.9],day:[19.8,24.5],night:[25.7,10.3] },
  { id:"gus",name:"Gus",title:"The pub regular",color:"var(--town-npc-green)",early:[2.7,18.0],day:[7.8,19.0],night:[4.7,21.5] },
  { id:"ivy",name:"Ivy",title:"The student",color:"#5c6e98",early:[11.5,7.5],day:[11.8,11.1],night:[16.1,22.0] },
];
export function residentsAt(hour:number): Resident[] {
  return RESIDENTS.map(person => {
    const [x,y] = hour < 10 ? person.early : hour < 18 ? person.day : person.night;
    return {id:person.id,name:person.name,title:person.title,color:person.color,x,y,mood:hour>=19?"Evening":hour<10?"Morning":"Daytime",hint:"Talk to "+person.name};
  });
}
export const LAST_TALKED_FIELDS: Record<ResidentId, "lastMara"|"lastNox"|"lastGus"|"lastIvy"> = {mara:"lastMara",nox:"lastNox",gus:"lastGus",ivy:"lastIvy"};
export function hasTalkedToday(state: GameState, id: ResidentId): boolean {
  return state[LAST_TALKED_FIELDS[id]] === state.day;
}
export function recordConversation(state: GameState, id: ResidentId, change: number, karma: number): GameState {
  return {...applyConversation(state,id,change,karma),[LAST_TALKED_FIELDS[id]]:state.day};
}
/** Activity icons appear in-world without launching blocking dialogs. */
export function residentActivity(id: ResidentId, hour:number): string {
  if (id==="mara") return hour<10?"☕":hour<18?"📦":"🎧";
  if (id==="nox") return hour<10?"💤":hour<18?"🛹":"👀";
  if (id==="gus") return hour<10?"📰":hour<18?"🚶":"🍺";
  return hour<10?"📖":hour<18?"✏️":"🎶";
}
export const RELATION_FIELDS: Record<ResidentId, "relMara"|"relNox"|"relGus"|"relIvy"> = {mara:"relMara",nox:"relNox",gus:"relGus",ivy:"relIvy"};
export function conversation(id: ResidentId, state: GameState): { title:string; text:string; choices:{label:string; change:number; karma:number; reply:string}[] } {
  const rel = state[RELATION_FIELDS[id]];
  const opening: Record<ResidentId,[string,string,string]> = {
    mara:["What? Can't you see I'm busy?","Oh. You again. At least you're not as annoying as most customers.","Hey! Good to see you. Don't tell my boss I said that."],
    nox:["What are you looking at?","Alright, I've seen you around.","You're sound. Keep your head down and you'll do fine."],
    gus:["Don't know you, pal.","Sit yourself down. It's been a long day.","There you are! I saved you a story."],
    ivy:["Sorry, I'm trying to concentrate.","Oh, hello again. Got a minute?","I was hoping I'd run into you!"],
  };
  const base=opening[id][rel>=4?2:rel>=1?1:0] ?? "Alright?";
  const text = state.heat >= 30 ? (id === "nox" ? "Coppers love you. Unfortunately, so does their paperwork." : id === "ivy" ? "Please leave me out of whatever your current legal situation is." : id === "mara" ? "I handle returns. Not getaway plans." : "Not here, pal. I prefer my stories without witness statements.") : id === "nox" && state.gangRep >= 20 ? "Crew member. Alright. Your reputation got here before you." : base;
  const person=RESIDENTS.find(p=>p.id===id);
  return {title:(person?.name ?? id)+" · "+(person?.title ?? "Resident"),text,choices:[
    {label:"Have a friendly chat",change:1,karma:0,reply:id==="mara"?"Mara manages half a smile. Progress.":id==="nox"?"Nox nods approvingly.":id==="gus"?"Gus tells you about a funeral where the buffet got a better review than the deceased.":"Ivy explains why your bad week is statistically unremarkable. Somehow, it helps."},
    {label:"Offer to help",change:2,karma:1,reply:id==="mara"?"Mara: 'You helped without asking for a manager. Disturbing.' +1 karma.":id==="nox"?"Nox: 'Useful. Keep that up.' +1 karma.":id==="gus"?"Gus: 'A good deed. We should drink until it wears off.' +1 karma.":"Ivy: 'Thank you. I was considering a very formal panic.' +1 karma."},
    {label:"Be rude",change:-2,karma:-1,reply:"They won't forget that in a hurry. -1 karma."},
  ]};
}
export function applyConversation(state: GameState,id:ResidentId,change:number,karma:number):GameState {
  const key=RELATION_FIELDS[id];
  return {...state,[key]:Math.max(-10,Math.min(10,state[key]+change)),karma:state.karma+karma};
}
export type TownEvent = { id:string; title:string; hint:string; x:number; y:number; icon:string; pose:"standing"|"sitting"|"pacing" };
export function dailyTownEvent(day:number,hour:number):TownEvent|null {
  if(day<2 || day%3===0)return null;
  const events:TownEvent[]=[
    {id:"diner",title:"Shopping disaster",hint:"Mara has dropped her shopping",x:8.5,y:16.8,icon:"?",pose:"standing"},
    {id:"bar",title:"Argument by the pub",hint:"An argument is brewing",x:3.8,y:20.9,icon:"!",pose:"sitting"},
    {id:"school",title:"Forgotten homework",hint:"A student needs help",x:11.4,y:6.5,icon:"?",pose:"standing"},
    {id:"wallet",title:"Lost wallet",hint:"A wallet lies on the pavement",x:21.8,y:15.3,icon:"?",pose:"standing"},
    {id:"work",title:"Workplace rumour",hint:"Someone wants a word",x:11.7,y:22.1,icon:"…",pose:"pacing"},
    {id:"shop",title:"A dodgy offer",hint:"Nox has a suspicious offer",x:25.7,y:10.3,icon:"?",pose:"standing"},
  ];
  const event=events[(day*7+Math.floor(day/3))%events.length];
  if(!event)return null;
  if(event.id==="bar" && hour<16)return null;
  if(event.id==="diner" && hour>19)return null;
  if(event.id==="school" && hour>18)return null;
  return event;
}
