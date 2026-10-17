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
