import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { trackBest } from "@/lib/career-history";

/** Site Lead is the first role trusted with the retired company car. */
export const companyCarEligible = (s: GameState) => trackBest(s, 3) >= 2;
export const canDrive = (s: GameState) => Boolean(s.drivingLicence && s.companyCar);

export function licenceTestAction(): ActionDef {
 return {id:"driving-test",label:"Take driving test · $120",hours:2,energy:10,cost:120,
 note:"Pass with 10 intelligence · licence is permanent",
 resolve:s=>{
  if(s.drivingLicence)return "You already hold a driving licence.";
  if(s.money<120)return "The test costs $120.";
  if(s.int<10)return {patch:{money:s.money-120,drivingTestDay:s.day},message:"You didn't pass the theory and safety test. Study before trying again."};
  return {patch:{money:s.money-120,drivingLicence:1,drivingTestDay:s.day},message:"Driving test passed! You may now legally drive a car."};
 }};
}
export function claimCompanyCarAction():ActionDef {
 return {id:"claim-company-car",label:"Collect the old company car",hours:1,energy:0,
 note:"Free at Site Lead · requires a driving licence",
 resolve:s=>{
  if(s.companyCar)return "You've already claimed the company car.";
  if(!companyCarEligible(s))return "The company car is entrusted to Site Leads and above.";
  if(!s.drivingLicence)return "Get your licence at Town Transit before collecting the keys.";
  return {patch:{companyCar:1},message:"The foreman handed over the keys to the old company car. Home and work fast travel unlocked."};
 }};
}
/** Fixed elapsed travel time; fast travel is never a free teleport or arbitrary destination. */
export function driveAction(destination:"home"|"work"):ActionDef {
 return {id:"drive-"+destination,label:destination==="home"?"Drive home":"Drive to work",hours:destination==="home"?0.5:0.75,energy:0,
 note:"Car required · only home or your current workplace",
 resolve:s=>{
   if(!canDrive(s))return "You need your own company car and a driving licence.";
   if(destination==="work" && !s.employed)return "You aren't employed. There is no work destination.";
   return {patch:{driveDestination:destination==="home"?1:2,driveTrip:(s.driveTrip??0)+1},message:destination==="home"?"Drove home and parked nearby.":"Drove to your workplace and parked nearby."};
 }};
}
