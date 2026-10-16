import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { trackBest } from "@/lib/career-history";

export const CONTRACTS = [
 {id:1,name:"Home repair contract",minimumRank:1,deposit:450,duration:3,payment:1050,overrun:380},
 {id:2,name:"Commercial renovation",minimumRank:2,deposit:3500,duration:6,payment:8500,overrun:2900},
 {id:3,name:"Luxury property development",minimumRank:3,deposit:26000,duration:12,payment:65000,overrun:23500},
] as const;

export function contractOutcome(s:GameState,id:number,dueDay:number){
 const job=CONTRACTS.find(c=>c.id===id);
 if(!job)return null;
 const rank=trackBest(s,3);
 // Deterministic outcomes cannot be rerolled by reloading.
 const sample=(Math.sin((dueDay*79+id*97)*12.9898)*43758.5453)%1;
 const roll=sample<0?sample+1:sample;
 const risk=Math.max(0.09,0.38-rank*0.065);
 const setback=roll<risk;
 const expenses=job.deposit+(setback?job.overrun:0);
 const payout=job.payment+Math.round(job.payment*Math.max(0,rank-job.minimumRank)*0.045);
 return {setback,payout,expenses,net:payout-expenses};
}
export function startContractAction(id:number):ActionDef {
 const job=CONTRACTS.find(c=>c.id===id);
 return {id:`construction-contract-${id}`,label:job?`Take ${job.name} · $${job.deposit.toLocaleString("en-US")} upfront`:"Invalid contract",hours:1,energy:8,cost:job?.deposit,
 note:job?`Requires construction rank ${job.minimumRank} · ${job.duration} days to finish · payment $${job.payment.toLocaleString("en-US")}`:undefined,
 resolve:s=>{
  if(!job)return "Contract not found.";
  if(s.contractType)return "Finish your current contract before taking another.";
  if(trackBest(s,3)<job.minimumRank)return "Gain more construction experience before bidding for this contract.";
  if(s.money<job.deposit)return "Not enough funds for materials and subcontractors.";
  return {patch:{money:s.money-job.deposit,contractType:id,contractDueDay:s.day+job.duration,contractLastDay:s.day},message:`Accepted ${job.name}. Materials paid; project due on day ${s.day+job.duration}.`};
 }};
}
export function settleContract(s:GameState,nextDay:number):Partial<GameState>{
 if(!s.contractType || nextDay<(s.contractDueDay??Number.MAX_SAFE_INTEGER))return {};
 const result=contractOutcome(s,s.contractType,s.contractDueDay!);
 if(!result)return {contractType:0,contractDueDay:0};
 // Deposit is already paid on acceptance; settle only revenue and unexpected overruns.
 const job=CONTRACTS.find(c=>c.id===s.contractType)!;
 const finalCash=s.money+result.payout-(result.setback?job.overrun:0);
 return {money:Math.max(0,finalCash),businessDebt:(s.businessDebt??0)+Math.max(0,-finalCash),
   contractType:0,contractDueDay:0,
   contractWins:(s.contractWins??0)+(result.setback?0:1),
   contractLosses:(s.contractLosses??0)+(result.setback?1:0)};
}
export function constructionStatus(s:GameState):string[]{
 if(s.contractType){
  const name=CONTRACTS.find(c=>c.id===s.contractType)?.name??"Construction project";
  return [`Active: ${name}`,`Completion day ${s.contractDueDay} · ${Math.max(0,(s.contractDueDay??s.day)-s.day)} days remaining`];
 }
 return [`Construction rank ${trackBest(s,3)}/4`,`Contracts completed ${s.contractWins??0} · setbacks ${s.contractLosses??0}`];
}
