import type {GameState} from "@/lib/game-state";
import type {ActionDef} from "@/lib/actions";
import type {CrewMember} from "@/lib/gang-career";

/** Authored narrative beats, not a visible crime career ladder. */
export type StoryTrait = "karma"|"strength"|"intelligence"|"charm"|"street";
export type StoryResponse = {id:"steady"|"clever"|"bold"; label:string; reply:string; pay:number; heat:number; trust:number};
export type UnderworldStory = {
 id:1|2|3|4|5; contact:CrewMember; title:string; setup:string;
 variants:ReadonlyArray<{trait:StoryTrait;when:"high"|"low";line:string}>;
 defaultLine:string; options:readonly StoryResponse[];
};
export const UNDERWORLD_STORIES:readonly UnderworldStory[]=[
 {id:1,contact:"nia",title:"The Missing Cut",setup:"Nia has been counting the takings twice. They still don't add up.",
 variants:[{trait:"karma",when:"high",line:'"You look like a proper goody-two-shoes. Maybe that is exactly what we need."'},{trait:"karma",when:"low",line:'"You look like trouble. Just make sure it is their trouble, not ours."'},{trait:"intelligence",when:"high",line:'"Mick says you are sharp. Let us see whether you can spot what I missed."'}],
 defaultLine:'"Someone has been dipping into the money. I want a second pair of eyes."',
 options:[{id:"steady",label:"Check the records discreetly",reply:"You trace a missing payment without attracting attention. Nia nods, impressed.",pay:210,heat:1,trust:5},{id:"clever",label:"Question the figures",reply:"A discrepancy points to a dodgy middleman. Nia appreciates the thinking.",pay:235,heat:2,trust:6},{id:"bold",label:"Confront the suspect",reply:"The suspect makes a scene before handing over part of the money.",pay:270,heat:8,trust:2}]},
 {id:2,contact:"lez",title:"Someone at the Door",setup:"Lez points across the street. Someone has been hanging around a friend's place.",
 variants:[{trait:"strength",when:"high",line:'"At least you look like you can handle yourself. Just do not start anything."'},{trait:"karma",when:"low",line:'"You have got a reputation. Try not to make this one worse."'}],
 defaultLine:'"I need someone to go over there and find out what is happening."',
 options:[{id:"steady",label:"Observe from a distance",reply:"You spot a familiar face and report back to Lez.",pay:230,heat:1,trust:4},{id:"clever",label:"Ask a few questions",reply:"A careful conversation reveals the visitor's real business.",pay:255,heat:2,trust:5},{id:"bold",label:"Approach directly",reply:"The stranger bolts when challenged. Lez is pleased, if nervous.",pay:295,heat:9,trust:2}]},
 {id:3,contact:"mick",title:"An Awkward Collection",setup:"Mick needs an envelope retrieved from someone who has stopped answering his calls.",
 variants:[{trait:"charm",when:"high",line:'"You have got a mouth on you. Might be useful today."'},{trait:"karma",when:"high",line:'"Do not give me that innocent look. Just hear me out."'}],
 defaultLine:'"Normally I would send Lez. Today, I want you to handle it."',
 options:[{id:"steady",label:"Wait for the right moment",reply:"The exchange happens quietly. Mick gives you a rare approving nod.",pay:300,heat:1,trust:5},{id:"clever",label:"Offer a compromise",reply:"A negotiated settlement saves everyone some trouble.",pay:325,heat:3,trust:6},{id:"bold",label:"Demand an answer",reply:"There is a loud argument, then the envelope changes hands.",pay:375,heat:10,trust:2}]},
 {id:4,contact:"nia",title:"A Stranger's Offer",setup:"A new buyer has offered Nia more money than expected, and she does not like it.",
 variants:[{trait:"intelligence",when:"high",line:'"You have a decent head. Tell me what does not add up here."'},{trait:"karma",when:"low",line:'"I know you are not easily frightened. That does not mean we should trust him."'}],
 defaultLine:"\"Too much money, not enough questions. Sounds wrong, doesn't it?\"",
 options:[{id:"steady",label:"Keep the agreed terms",reply:"The deal stays small and quiet. Nia respects your caution.",pay:370,heat:2,trust:5},{id:"clever",label:"Test the buyer's story",reply:"Your questions expose an inconsistency. Nia quietly changes the arrangement.",pay:390,heat:2,trust:7},{id:"bold",label:"Take the extra offer",reply:"The money arrives, but the buyer leaves Nia distinctly uneasy.",pay:470,heat:13,trust:-2}]},
 {id:5,contact:"lez",title:"The Late-Night Favour",setup:"Lez asks for help with one last errand. He is unusually serious.",
 variants:[{trait:"street",when:"high",line:'"You know how this town works by now. Keep that in mind tonight."'},{trait:"karma",when:"high",line:'"You still look like someone who knows where the line is. Good."'},{trait:"strength",when:"high",line:'"No heroics just because you are built for them."'}],
 defaultLine:'"Do this right and I owe you more than a drink."',
 options:[{id:"steady",label:"Follow the instructions",reply:"The errand is finished without anyone asking questions.",pay:460,heat:2,trust:6},{id:"clever",label:"Find a quieter solution",reply:"Your improvisation saves Lez from an awkward meeting.",pay:500,heat:3,trust:7},{id:"bold",label:"Take the risky shortcut",reply:"You finish quickly, but the night leaves witnesses.",pay:570,heat:15,trust:2}]},
];
const thresholds:Record<StoryTrait,(s:GameState)=>number>={karma:s=>s.karma,strength:s=>s.str,intelligence:s=>s.int,charm:s=>s.cha,street:s=>s.streetSmarts??0};
export function storyDialogue(story:UnderworldStory,s:GameState):string{
 for(const v of story.variants){const n=thresholds[v.trait](s);const boundary=v.trait==="karma"?0:v.trait==="street"?20:22;
 if(v.when==="high"?(n>=boundary):(n<(v.trait==="karma"?-10:boundary)))return v.line;}
 return story.defaultLine;
}
export function storyAvailable(s:GameState,member:CrewMember):UnderworldStory|null{
 if(s.underworldStoryActive||s.gangTask||s.gangParcel||s.gangStage<1)return null;
 const done=s.underworldStoryMask??0;
 for(const story of UNDERWORLD_STORIES){
  if(story.contact!==member||(done&(1<<(story.id-1))))continue;
  const previous=story.id===1||Boolean(done&(1<<(story.id-2)));
  const eligible=s.day>=4+story.id*3 && s.gangRep>=2+story.id && (s.criminalTrust??0)>=7+story.id*2;
  if(previous&&eligible)return story;
 }
 return null;
}
export function activeStory(s:GameState):UnderworldStory|null{return UNDERWORLD_STORIES.find(v=>v.id===s.underworldStoryActive)??null;}
export function beginStory(id:number):ActionDef{return {id:"underworld-story-begin-"+id,label:"Hear them out",hours:0,energy:0,resolve:s=>{
 const v=UNDERWORLD_STORIES.find(x=>x.id===id);
 if(!v||storyAvailable(s,v.contact)?.id!==id)return "They have nothing unusual for you right now.";
 return {patch:{underworldStoryActive:id,underworldStoryStage:0},message:v.setup};
}};}
export function finishStory(id:number,approach:StoryResponse["id"]):ActionDef{return {id:"underworld-story-finish-"+id+"-"+approach,label:"Handle the situation",hours:1,energy:6,resolve:s=>{
 const v=activeStory(s),option=v?.options.find(o=>o.id===approach);
 if(!v||v.id!==id||!option)return "That opportunity is no longer available.";
 if((s.underworldStoryStage??0)<1)return "There is still something you need to look into around town.";
 const mask=(s.underworldStoryMask??0)|(1<<(id-1));
 const index=(id-1)*2;
 const codes={steady:1,clever:2,bold:3};
 const choices=((s.underworldStoryChoiceMask??0)&~(3<<index))|(codes[approach]<<index);
 return {patch:{underworldStoryActive:0,underworldStoryStage:0,underworldStoryMask:mask,underworldStoryChoiceMask:choices,
 money:Math.min(1e12,s.money+option.pay),heat:Math.min(100,s.heat+option.heat),
 criminalTrust:Math.max(0,Math.min(100,(s.criminalTrust??0)+option.trust)),
 streetSmarts:Math.min(100,(s.streetSmarts??0)+3),gangRep:Math.min(100,s.gangRep+1)},
 message:option.reply+" You receive $"+option.pay+"."};
}};}

/** Actual destinations for authored scenes, using only existing town venues. */
export const STORY_DESTINATIONS:Record<number,{venue:string;prompt:string;contact:string}>={
 1:{venue:"pawn",prompt:"Check the questionable account books at Oddities Pawn.",contact:"A nervous clerk keeps checking the back door."},
 2:{venue:"diner",prompt:"Find out who has been waiting outside the diner.",contact:"Someone at the counter recognises Lez's description."},
 3:{venue:"shop",prompt:"Find the person Mick mentioned near the Corner Shop.",contact:"The person you are looking for is reluctant to talk."},
 4:{venue:"bar",prompt:"Meet the suspicious buyer at The Tipsy Stick.",contact:"The buyer is sitting alone, looking uneasy."},
 5:{venue:"alley",prompt:"Check the alley before returning to Lez.",contact:"The alley is quieter than you expected."},
};
export function storyObjective(s:GameState){
 const v=activeStory(s);if(!v)return null;
 return (s.underworldStoryStage??0)===0?STORY_DESTINATIONS[v.id]:null;
}
export function investigateStory(id:number):ActionDef{
 return {id:"underworld-investigate-"+id,label:"Investigate",hours:0.5,energy:3,resolve:s=>{
  if(s.underworldStoryActive!==id||(s.underworldStoryStage??0)!==0)return "There is nothing more to investigate here.";
  return {patch:{underworldStoryStage:1},message:"You learn enough to report back. Return to the crew and decide what to do."};
 }};
}
