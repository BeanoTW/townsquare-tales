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
  {id:"gang-initiation",label:"Take the initiation",hours:2,energy:12,minimum:0,money:15,rep:1,heat:2,karma:-2},
  {id:"gang-lookout",label:"Keep watch for the crew",hours:2,energy:10,minimum:1,money:35,rep:1,heat:3,karma:-1},
  {id:"gang-courier",label:"Run a discreet package",hours:3,energy:16,minimum:1,money:75,rep:2,heat:5,karma:-2},
  {id:"gang-fence",label:"Shift questionable goods",hours:3,energy:18,minimum:2,money:120,rep:2,heat:7,karma:-3},
] as const;
export function gangJob(id:(typeof GANG_JOBS)[number]["id"]):ActionDef {
  const job=GANG_JOBS.find(x=>x.id===id);
  if(!job)throw Error("Unknown job");
  return {id:job.id,label:job.label,hours:job.hours,energy:job.energy,
    resolve:(s)=>{
      if(job.minimum>0 && s.gangStage<1)return '"Prove yourself first."';
      if(job.minimum===2 && s.gangRep<3)return '"You have not earned that kind of trust."';
      if(job.minimum===0 && s.gangStage>0)return '"You already did your bit."';
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
