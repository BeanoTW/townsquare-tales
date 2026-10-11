import type { ActionDef, Patch } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { RELATION_FIELDS, RESIDENTS, type ResidentId } from "@/lib/living-town";
import { timeLabel } from "@/lib/day-cycle";
import type { PlaceId } from "@/lib/rooms";

type Favour = { code:number; resident:ResidentId; title:string; request:string; pickup:PlaceId; location:string;
  item:string; duration:number; deliverLabel:string; alternativeLabel:string;
  reward:(s:GameState, alternative:boolean)=>{patch:Patch;relation:number;karma:number;message:string} };
/** Favour content is independent of map components; new errands share this lifecycle. */
export const RESIDENT_FAVOURS: readonly Favour[] = [
  {code:1,resident:"mara",title:"Lunch, before retirement",pickup:"diner",location:"Fryday Diner",item:"Mara's lunch",duration:4,
    request:"'Collect my lunch from Fryday before it becomes a historical artefact. Four hours. I'm being generous.'",
    deliverLabel:"Deliver her lunch · $10 · relationship +2",alternativeLabel:"Keep the lunch · snack +1 · relationship -2",
    reward:(s,alternative)=>alternative ? {patch:{snacks:Math.min(99,s.snacks+1)},relation:-2,karma:-2,message:"Mara: 'Even the sandwich has betrayed me.' Snack +1 · relationship -2 · karma -2."} :
      {patch:{money:s.money+10},relation:2,karma:1,message:"Mara: 'Still warm. A rare town success.' Cash +$10 · relationship +2 · karma +1."}},
  {code:2,resident:"nox",title:"No questions on the receipt",pickup:"pawn",location:"Oddities Pawn",item:"Nox's sealed parcel",duration:8,
    request:"'Pick up my sealed parcel at Oddities. Bring it back within eight hours. The receipt says ornaments. Lovely ornaments.'",
    deliverLabel:"Return the sealed parcel · $18 · heat +2",alternativeLabel:"Report the parcel to police · heat -5 · relationship -3",
    reward:(s,alternative)=>alternative ? {patch:{heat:Math.max(0,s.heat-5),gangRep:Math.max(0,s.gangRep-2)},relation:-3,karma:2,message:"The police log it as 'probably ornaments'. Nox disagrees with your filing system. Heat -5 (minimum 0) · gang rep -2 · relationship -3 · karma +2."} :
      {patch:{money:s.money+18,heat:Math.min(100,s.heat+2),gangRep:Math.min(100,s.gangRep+3)},relation:2,karma:-1,message:"Nox: 'See? No questions. Barely any police.' Cash +$18 · heat +2 · gang rep +3 · relationship +2 · karma -1."}},
  {code:3,resident:"gus",title:"The missing lucky opener",pickup:"bar",location:"The Tipsy Stick",item:"Gus's bottle opener",duration:8,
    request:"'Left my lucky opener at the pub. Without it, my luck's just drinking. Fetch it within eight hours?'",
    deliverLabel:"Return the lucky opener · $6 · charm +1",alternativeLabel:"Sell the opener · $10 · relationship -2",
    reward:(s,alternative)=>alternative ? {patch:{money:s.money+10},relation:-2,karma:-2,message:"Sold for $10. Gus calls it a family heirloom. Last week it was a promotional freebie. Relationship -2 · karma -2."} :
      {patch:{money:s.money+6,cha:s.cha+1},relation:2,karma:0,message:"Gus offers $6 and a story with no surviving witnesses. Cash +$6 · charm +1 · relationship +2."}},
  {code:4,resident:"ivy",title:"Peer review of a disaster",pickup:"school",location:"Stick U",item:"Ivy's marked essay",duration:8,
    request:"'Could you collect my marked essay at Stick U? Eight hours. I want to read the criticism before it evolves.'",
    deliverLabel:"Return the essay · intelligence +2 · relationship +2",alternativeLabel:"Sell the notes · $12 · relationship -2",
    reward:(s,alternative)=>alternative ? {patch:{money:s.money+12},relation:-2,karma:-1,message:"The buyer asks whether despair will be on the exam. Cash +$12 · relationship -2 · karma -1."} :
      {patch:{int:s.int+2},relation:2,karma:1,message:"Ivy: 'The tutor wrote fascinating. That's academic for doomed.' Intelligence +2 · relationship +2 · karma +1."}},
];
const now = (s:GameState)=>s.day*24+s.hour;
export function activeFavour(s:GameState): Favour | null {
  return RESIDENT_FAVOURS.find(f=>f.code===s.residentFavour) ?? null;
}
export function favourExpired(s:GameState):boolean {
  return Boolean(activeFavour(s) && now(s)>(s.residentFavourDeadline ?? 0));
}
export function favourObjective(s:GameState):string|null {
  const f=activeFavour(s);if(!f)return null;
  const name=RESIDENTS.find(r=>r.id===f.resident)?.name ?? f.resident;
  if(favourExpired(s))return `${name}'s favour expired. Talk to them to close it. No penalty.`;
  const deadline=s.residentFavourDeadline ?? 0;
  return `${s.residentFavourStage===1 ? `Return ${f.item} to ${name}` : `Collect ${f.item} at ${f.location}`} · by day ${Math.floor(deadline/24)}, ${timeLabel(deadline%24)}`;
}
const cleared = (s:GameState):Patch=>({residentFavour:0,residentFavourStage:0,residentFavourDeadline:0,residentFavourLastDay:s.day});
export function acceptFavour(id:ResidentId):ActionDef {
  const f=RESIDENT_FAVOURS.find(f=>f.resident===id)!;
  return {id:`favour-${id}-accept`,label:`Take the favour · deadline ${f.duration}h`,hours:0,energy:0,
    resolve:s=> {
      if(activeFavour(s))return "Finish or close your current favour first.";
      if(s.residentFavourLastDay !== undefined && s.day<s.residentFavourLastDay+3)return "Give the town a breather. Another favour is available three days after the last one.";
      if(s[RELATION_FIELDS[id]]<=-4)return "They're not trusting you with an errand yet. Repair the relationship first.";
      const next={...s,residentFavour:f.code,residentFavourStage:0,residentFavourDeadline:now(s)+f.duration};
      return {patch:{residentFavour:next.residentFavour,residentFavourStage:0,residentFavourDeadline:next.residentFavourDeadline},message:favourObjective(next)!};
    }};
}
/** Called only after entering a reachable existing location, never from distant map taps. */
export function favourVisitAction(s:GameState, location:PlaceId):ActionDef|null {
  const f=activeFavour(s);
  if(!f || f.pickup!==location || s.residentFavourStage===1 || favourExpired(s))return null;
  return {id:`favour-${f.resident}-pickup`,label:`Collect ${f.item}`,hours:0,energy:0,
    resolve:current=>activeFavour(current)?.code!==f.code || favourExpired(current) || current.residentFavourStage===1 ? "The errand has changed." :
      {patch:{residentFavourStage:1},message:`Collected ${f.item}. ${favourObjective({...current,residentFavourStage:1})}`}};
}
export function finishFavour(id:ResidentId, alternative=false):ActionDef {
  const f=RESIDENT_FAVOURS.find(f=>f.resident===id)!;
  return {id:`favour-${id}-${alternative?"alternative":"deliver"}`,label:(alternative?f.alternativeLabel:f.deliverLabel)+" · 15m · 2 energy",hours:.25,energy:2,
    resolve:s=> {
      if(activeFavour(s)?.resident!==id || s.residentFavourStage!==1)return "Collect the item for this resident first.";
      if(favourExpired(s) || now(s)+.25>(s.residentFavourDeadline ?? 0))return "The deadline has passed. Close the favour without a penalty.";
      if(id==="mara" && alternative && s.snacks>=99)return "Your snack stash is full. Deliver the lunch or close the favour.";
      const result=f.reward(s,alternative),key=RELATION_FIELDS[id];
      return {patch:{...result.patch,...cleared(s),[key]:Math.max(-10,Math.min(10,s[key]+result.relation)),karma:s.karma+result.karma},message:result.message};
    }};
}
export function closeFavour(id:ResidentId):ActionDef {
  return {id:`favour-${id}-close`,label:"Close the favour · no penalty",hours:0,energy:0,
    resolve:s=>activeFavour(s)?.resident!==id ? "That's not your current favour." :
      {patch:cleared(s),message:"The errand is closed. No penalty. The town will invent a fresh inconvenience in three days."}};
}
export function favourChoices(id:ResidentId,s:GameState):ActionDef[] {
  const f=activeFavour(s);
  if(!f) return (s.residentFavourLastDay===undefined || s.day>=s.residentFavourLastDay+3) && s[RELATION_FIELDS[id]]>-4 ? [acceptFavour(id)] : [];
  if(f.resident!==id)return [];
  return [...(!favourExpired(s) && s.residentFavourStage===1 ? [finishFavour(id),finishFavour(id,true)] : []),closeFavour(id)];
}
