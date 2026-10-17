import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";

/** Hidden reputation: players learn the crew's expectations through dialogue, not meters. */
export function gangAccess(s:GameState): "outsider"|"initiation"|"probation"|"trusted" {
  // Everyone can start; the crew judges earned reputation.
  if(s.gangStage===0)return "initiation";
  return s.gangRep>=3 ? "trusted" : "probation";
}
export function gangDialogue(s:GameState):string {
  switch(gangAccess(s)){
    case "outsider":return '"Come back if you want to prove yourself."';
    case "initiation":return '"You keep coming back. Fancy proving you can keep your mouth shut?"';
    case "probation":return '"Alright, you did what we asked. Maybe there is work for you."';
    case "trusted":return '"There you are. We have a few errands if you want to earn."';
  }
}
export const GANG_JOBS = [
  {id:"gang-initiation",label:"Take the initiation",hours:0,energy:0,minimum:0,money:15,rep:1,heat:2,karma:-2},
  {id:"gang-lookout",label:"Keep watch for the crew",hours:0,energy:0,minimum:1,money:35,rep:1,heat:3,karma:-1},
  {id:"gang-courier",label:"Collect a discreet package",hours:0,energy:0,minimum:1,money:75,rep:2,heat:5,karma:-2},
  {id:"gang-fence",label:"Shift questionable goods",hours:0,energy:0,minimum:2,money:120,rep:2,heat:7,karma:-3},
] as const;
/** Payment and reputation only arrive after visiting the recipient in person. */
export function deliverGangParcel():ActionDef {
  return {id:"gang-parcel-handoff",label:"Hand over sealed package",hours:0.25,energy:2,
    resolve:s=>{
      if(!s.gangParcel)return "You do not have a delivery to hand over.";
      return {patch:{gangParcel:0,money:Math.min(1e12,s.money+75),gangRep:Math.min(100,s.gangRep+2),streetSmarts:Math.min(100,(s.streetSmarts??0)+2),criminalTrust:Math.min(100,(s.criminalTrust??0)+8),gangStage:Math.max(s.gangStage,s.gangRep+2>=3?2:s.gangStage),heat:Math.min(100,s.heat+5),karma:s.karma-2},message:'"Received." The clerk takes the parcel without inspecting it. Your $75 payment is handed over.'};
    }};
}
export function gangJob(id:(typeof GANG_JOBS)[number]["id"]):ActionDef {
  const job=GANG_JOBS.find(x=>x.id===id);
  if(!job)throw Error("Unknown job");
  return {id:job.id,label:job.label,hours:job.hours,energy:job.energy,
    resolve:(s)=>{
      if(s.gangTask)return "Finish your current crew assignment before taking another.";
      if(job.id==="gang-courier") {
        if(s.gangStage<1)return '"Prove yourself first."';
        if(s.gangParcel)return "You already have a package to deliver. Check your backpack for its destination.";
        return {patch:{gangParcel:1},message:"Take this sealed parcel to the counter at Oddities Pawn. Do not open it. Package added to your backpack."};
      }
      if(job.minimum>0 && s.gangStage<1)return '"Prove yourself first."';
      if(job.minimum===2 && s.gangRep<3)return '"You have not earned that kind of trust."';
      if(job.minimum===0 && s.gangStage>0)return '"You already did your bit."';
      if(s.gangParcel)return "Finish your parcel delivery first.";
      if(job.id==="gang-initiation")return {patch:{gangTask:1},message:"Go to the alley and collect the crew\'s marked envelope. Bring it back to the thugs."};
      if(job.id==="gang-lookout")return {patch:{gangTask:3},message:"Head to Town Bank. Keep watch outside, then return to the crew for your pay."};
      if(job.id==="gang-fence")return {patch:{gangTask:5},message:"The buyer is waiting at The Tipsy Stick. Go inside and complete the exchange."};
      return {patch:{
        money:Math.min(1e12,s.money+job.money),
        gangRep:Math.min(100,s.gangRep+job.rep),
        streetSmarts:Math.min(100,(s.streetSmarts??0)+(job.minimum===0?3:job.minimum===2?4:2)),
        criminalTrust:Math.min(100,(s.criminalTrust??0)+job.rep*4),
        gangStage:Math.max(s.gangStage,job.minimum===0?1:s.gangRep+job.rep>=3?2:s.gangStage),
        heat:Math.min(100,s.heat+job.heat),
        karma:s.karma+job.karma,
      },message: job.minimum===0 ? '"You kept your nerve. Come back when you want more work."' : job.id==="gang-lookout" ? '"Nobody noticed a thing. Here is your cut."' : job.id==="gang-courier" ? '"Delivery made. No questions asked."' : '"The buyer paid up. Not a word about it."'};
    }};
}

/** The gang pays only when each real, location-gated task is finished. */
export const gangTaskObjective=(s:GameState):{place:string;description:string;label:string}|null=>{
 switch(s.gangTask??0){
 case 1:return {place:"alley",description:"Go into the alley to collect the crew's marked envelope.",label:"Collect marked envelope"};
 case 2:return {place:"gang",description:"Return the envelope to the thugs at the north-east green.",label:"Return envelope to crew"};
 case 3:return {place:"bank",description:"Visit Town Bank and keep watch from inside the entrance.",label:"Keep watch at bank"};
 case 4:return {place:"gang",description:"Report back to the thugs at the north-east green for payment.",label:"Report back to crew"};
 case 5:return {place:"bar",description:"Meet the buyer inside The Tipsy Stick to exchange the goods.",label:"Meet the buyer"};
 default:return null;
 }
};
export function advanceGangTask(expected:number):ActionDef {
 const time=expected===3?1:expected===5?0.75:0.25;
 return {id:"gang-task-"+expected,label:gangTaskObjective({gangTask:expected} as GameState)?.label??"Crew task",hours:time,energy:expected===3?6:expected===5?5:2,
 resolve:s=>{
  if(s.gangTask!==expected)return "That is not your current assignment.";
  if(expected===1)return {patch:{gangTask:2},message:"Envelope collected. Take it back to the crew at the green."};
  if(expected===3)return {patch:{gangTask:4},message:"You have finished keeping watch. Return to the thugs for your cut."};
  const job=expected===2?GANG_JOBS[0]:expected===4?GANG_JOBS[1]:GANG_JOBS[3];
  const rep=s.gangRep+job.rep;
  return {patch:{gangTask:0,money:Math.min(1e12,s.money+job.money),
   gangRep:Math.min(100,rep),streetSmarts:Math.min(100,(s.streetSmarts??0)+(expected===2?3:expected===5?4:2)),
   criminalTrust:Math.min(100,(s.criminalTrust??0)+job.rep*4),
   gangStage:Math.max(s.gangStage,expected===2?1:rep>=3?2:s.gangStage),
   heat:Math.min(100,s.heat+job.heat),karma:s.karma+job.karma},
   message:expected===2?"The crew take the envelope. You are in. They pay you $15.":expected===4?"Your lookout report checks out. The crew hand you $35.":"The buyer checks the goods and pays you $120."};
 }};
}

/** Small, repeatable encounters: decisions change safety, payment and reputation. */
export type CrewChoice = "quiet" | "bold" | "persuade";
export function crewChoices(s:GameState): {id:CrewChoice;label:string;hint:string}[] {
 switch(s.gangTask??0){
 case 1:return [{id:"quiet",label:"Check the hiding place",hint:"Careful search · low risk"},{id:"bold",label:"Grab it quickly",hint:"Quick collection · more attention"}];
 case 2:return [{id:"quiet",label:"Hand it over without a word",hint:"Professional and discreet"},{id:"persuade",label:"Ask for a better cut",hint:"Charm helps negotiate"}];
 case 3:return [{id:"quiet",label:"Blend in with the queue",hint:"Low profile · longer watch"},{id:"bold",label:"Watch from the street",hint:"Faster but conspicuous"}];
 case 4:return [{id:"quiet",label:"Give a factual report",hint:"Reliable, no fuss"},{id:"persuade",label:"Talk up the threat",hint:"Could earn respect or suspicion"}];
 case 5:return [{id:"quiet",label:"Trade at the agreed price",hint:"Straightforward exchange"},{id:"persuade",label:"Negotiate with the buyer",hint:"Charm can win a bigger cut"},{id:"bold",label:"Pressure them to pay more",hint:"Risk of a confrontation"}];
 default:return [];
 }
}
export function resolveCrewEncounter(expected:number,choice:CrewChoice):ActionDef {
 const choices=crewChoices({gangTask:expected} as GameState);
 const selected=choices.find(c=>c.id===choice);
 if(!selected)throw Error("Unavailable crew approach");
 const base=advanceGangTask(expected);
 return {id:"gang-encounter-"+expected+"-"+choice,label:selected.label,
 hours:base.hours+(choice==="quiet"&&expected===3?0.5:0),
 energy:base.energy+(choice==="bold"?2:0),
 resolve:(s,rng)=>{
  if(s.gangTask!==expected)return "This assignment has already moved on.";
  const risk=choice==="bold"?(expected===5?0.42:0.27):choice==="persuade"?(s.cha>=15?0.12:0.45):0;
  if(rng()<risk) {
   // An unlucky decision never silently awards the job reward.
   if(expected===1)return {patch:{heat:Math.min(100,s.heat+3),energy:Math.max(0,s.energy-3)},message:"A passer-by notices you searching. You retreat and can try again."};
   if(expected===3)return {patch:{heat:Math.min(100,s.heat+4)},message:"Security notices you lingering. You move away and will need to try again."};
   return {patch:{heat:Math.min(100,s.heat+5),criminalTrust:Math.max(0,(s.criminalTrust??0)-1)},message:"Your approach goes badly. The other party backs off. The job remains open."};
  }
  const result=base.resolve(s,rng);
  if(typeof result==="string")return result;
  const completion=[2,4,5].includes(expected);
  return {patch:{...result.patch,
   ...(choice==="bold"?{heat:Math.min(100,(result.patch.heat??s.heat)+2)}:{}),
   ...(choice==="persuade"&&completion?{money:Math.min(1e12,(result.patch.money??s.money)+(expected===5?35:10)),criminalTrust:Math.min(100,(result.patch.criminalTrust??s.criminalTrust??0)+1)}:{})},
   message:choice==="persuade"&&completion?result.message+" Your negotiation earns a little extra.":result.message};
 }};
}

/** Three recognisable people at the green, without exposing the crew's hidden progression. */
export type CrewMember = "mick" | "lez" | "nia";
export const CREW_MEMBERS = [
 {id:"mick",name:"Mick",role:"The one who gives orders"},
 {id:"lez",name:"Lez",role:"Always watching the road"},
 {id:"nia",name:"Nia",role:"Keeps the money straight"},
] as const;
export function crewConversation(s:GameState,member:CrewMember):string {
 const task=s.gangTask??0;
 if(member==="mick"){
  if(task===2)return '"You got it? Put it here. And keep your voice down."';
  if(task===4)return '"Well? Anything worth knowing, or did you just stand there all afternoon?"';
  if(task)return '"Finish the errand first. Then we will talk."';
  if(s.gangStage===0)return '"Everyone wants in until there is something to do. Still interested?"';
  if(s.gangRep>=3)return '"You have been useful. Do not mistake that for being untouchable."';
  return '"There is work when you are ready. No promises."';
 }
 if(member==="lez"){
  if(task===3||task===4)return '"Do not stare at everyone. You will draw more eyes than the bank."';
  if(s.heat>=20)return '"Someone has been asking questions round here. Keep your head down."';
  if(s.gangParcel)return '"That parcel will not walk itself across town."';
  return s.gangStage===0?'"You lost, mate? Mick talks. I watch."':'"Keep moving when you have got a job. Standing around gets noticed."';
 }
 if(task===5)return '"The buyer hates surprises. Remember that."';
 if(s.gangParcel)return '"No money until we know it has arrived."';
 if(task===2||task===4)return '"Bring back something useful and we will settle up."';
 if(s.gangRep>=3)return '"You have done alright. Do not start asking what everything is worth."';
 return '"I count what comes in and what goes out. Mostly what goes missing."';
}

/** Diegetic mission introductions vary by character and day. No hidden success odds are exposed. */
export function missionContactDialogue(s:GameState):{name:string;line:string;hint:string}|null {
 if(s.gangTask===3){
  const lines=[
   '"Keep your eyes on the doors, not on me. See anything unusual?"',
   '"People queue here all day. The trick is noticing who does not belong."',
   '"Do not make a scene. If someone notices us talking, walk away."',
  ];
  return {name:"Bank watcher",line:lines[s.day%lines.length]!,hint:"A stranger by the bank entrance keeps glancing towards the street."};
 }
 if(s.gangTask===5){
  const lines=[
   '"You are the one Mick sent? Have a seat, then. Let me see what you brought."',
   '"I have other people waiting. Tell me why this is worth my time."',
   '"Funny, nobody mentioned you would be the courier. Let us talk numbers."',
  ];
  return {name:"Pub buyer",line:lines[s.day%lines.length]!,hint:"A buyer waits at a quiet table, watching you approach."};
 }
 return null;
}

/**
 * Reusable underworld encounter skeleton. Content/art can be swapped without
 * altering save values, progression gates or mission rewards.
 */
export type UnderworldEncounterId = "crew-intro" | "envelope" | "lookout" | "parcel" | "buyer" | "pawn-contact";
export type UnderworldBeat = {
  id: UnderworldEncounterId;
  venue: string;
  speaker: string;
  opener: string;
  atmosphere: string;
  choices: readonly string[];
};
export const UNDERWORLD_BEATS: Readonly<Record<UnderworldEncounterId,UnderworldBeat>> = {
 "crew-intro":{id:"crew-intro",venue:"gang",speaker:"Mick",opener:"You looking for work, or just lost?",atmosphere:"Three locals pause their conversation as you approach.",choices:["Ask about work","Leave"]},
 envelope:{id:"envelope",venue:"alley",speaker:"Unknown passer-by",opener:"You looking for something?",atmosphere:"Someone lingers at the far end of the alley.",choices:["Search carefully","Grab the envelope"]},
 lookout:{id:"lookout",venue:"bank",speaker:"Bank watcher",opener:"Keep your head down. Watch the entrance.",atmosphere:"People come and go. Nobody seems to notice the contact.",choices:["Blend into the queue","Watch from the street"]},
 parcel:{id:"parcel",venue:"pawn",speaker:"Pawn clerk",opener:"You got something for me?",atmosphere:"The clerk glances at the parcel without reaching for it.",choices:["Hand over parcel","Walk away"]},
 buyer:{id:"buyer",venue:"bar",speaker:"Pub buyer",opener:"Let's see what you have.",atmosphere:"A buyer waits at a quiet table, studying the room.",choices:["Agree on price","Negotiate","Push harder"]},
 "pawn-contact":{id:"pawn-contact",venue:"pawn",speaker:"Backroom contact",opener:"Who sent you?",atmosphere:"The shop carries on around you as if nothing is happening.",choices:["Mention your introduction","Leave"]},
};
export function activeUnderworldBeat(s:GameState):UnderworldBeat|null {
 if(s.gangTask===1)return UNDERWORLD_BEATS.envelope;
 if(s.gangTask===3)return UNDERWORLD_BEATS.lookout;
 if(s.gangTask===5)return UNDERWORLD_BEATS.buyer;
 if(s.gangParcel)return UNDERWORLD_BEATS.parcel;
 if(s.pawnIntroduction&&!s.pawnMet)return UNDERWORLD_BEATS["pawn-contact"];
 return null;
}
