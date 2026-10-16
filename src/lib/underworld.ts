import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";

/** Internal progression is deliberately not exposed as a public quest tree. */
export function criminalMilestones(s: GameState) {
  return { learnedCar: (s.criminalTrust ?? 0) >= 10, knownToPawn: Boolean(s.pawnIntroduction) };
}

export function gangCarLesson(): ActionDef {
  return { id:"crew-car-lesson", label:"Ask about the old wreck", hours:1, energy:5,
    resolve:s => {
      if(s.gangStage < 1) return '"Not until we know you."';
      if((s.criminalTrust??0)>=10) return '"You already know enough. Go see the wreck."';
      return { patch:{criminalTrust:10,streetSmarts:Math.min(100,(s.streetSmarts??0)+3)},
        message:'"That old car? Maybe it has a bit of life left. Try your luck. We never had this conversation."' };
    }
  };
}
export function attemptHotwire(won = false): ActionDef {
  return { id:"wreck-ignition",label:"Try the ignition",hours:0.5,energy:8,
    resolve:s=>{
      if(s.abandonedCar) return "You've already claimed the old wreck.";
      if(!criminalMilestones(s).learnedCar) return "You have no idea where to start.";
      if(s.hotwireLastDay===s.day) return "You've already tried today. Give it a rest.";
      const attempts=(s.hotwireAttempts??0)+1;
      // Abstract retry puzzle, deliberately no instructions for real vehicle interference.
      const success=won;
      return {patch:{
        hotwireAttempts:attempts,hotwireLastDay:s.day,
        streetSmarts:Math.min(100,(s.streetSmarts??0)+2),
        ...(success?{abandonedCar:1}:{})
      },message: success
        ? "The old engine coughs, splutters, then starts. It's yours—for better or worse."
        : "A sputter, a click and silence. You'll have to come back and try another day."};
    }
  };
}
export function pawnIntroductionAction():ActionDef {
  return {id:"pawn-introduction",label:"Ask about the people behind the pawn shop",hours:0.5,energy:2,
    resolve:s=>{
      if(s.pawnIntroduction) return '"You know who to ask for."';
      if(s.gangRep < 7 && (s.streetSmarts??0)<16) return '"You are not ready to meet them."';
      return {patch:{pawnIntroduction:1,criminalTrust:Math.min(100,(s.criminalTrust??0)+8)},
        message:'"Ask at the pawn shop. Quietly. Mention that we sent you. They decide if you get through the back door."' };
    }};
}

/** The pawn shop remains an ordinary shop unless the street crew introduces you. */
export function meetPawnContact(): ActionDef {
 return {id:"pawn-backroom-meet",label:"Mention the name the crew gave you",hours:0.5,energy:2,
 resolve:s=>{
  if(!s.pawnIntroduction)return '"Sorry. Don\'t know what you mean."';
  if(s.pawnMet)return '"We\'ve met. Get to the point."';
  return {patch:{pawnMet:1,criminalTrust:Math.min(100,(s.criminalTrust??0)+5)},
    message:'The shopkeeper studies you, then opens a door behind the counter. Inside, Vince sits with two strangers. "The lads say you have potential. We shall see."'};
 }};
}
export function pawnErrand(): ActionDef {
 return {id:"pawn-quiet-errand",label:"Take Vince's discreet errand",hours:2,energy:13,
 resolve:s=>{
  if(!s.pawnMet)return '"We haven\'t been introduced."';
  if(s.pawnJobDay===s.day)return '"That\'s enough for today. Don\'t get greedy."';
  return {patch:{pawnJobDay:s.day,money:Math.min(1e12,s.money+90),
    streetSmarts:Math.min(100,(s.streetSmarts??0)+3),
    criminalTrust:Math.min(100,(s.criminalTrust??0)+3),
    heat:Math.min(100,s.heat+4),karma:s.karma-2},
    message:'You deliver an unmarked parcel and return without questions. Vince counts your share. "You learn quickly."'};
 }};
}

/** The found car is a separate asset: restoring it does not grant a company car or driving licence. */
export function repairWreck(): ActionDef {
 return {id:"repair-old-wreck",label:"Restore the old wreck",hours:2,energy:12,
 resolve:s=>{
  if(!s.abandonedCar)return "You have not claimed the wreck.";
  const stage=s.wreckRepairs??0;
  if(stage>=3)return "The old wreck is already roadworthy.";
  const costs=[120,210,300];
  const price=costs[stage]!;
  if(s.money<price)return "Repairs need $"+price+".";
  const descriptions=[
   "You replace the ruined tyres and tidy the cabin.",
   "You repair the brakes and steering.",
   "You finish the engine work and safety inspection. The old wreck is finally roadworthy."
  ];
  return {patch:{money:s.money-price,wreckRepairs:stage+1},message:descriptions[stage]!};
 }};
}
export const wreckRoadworthy=(s:GameState)=>Boolean(s.abandonedCar && (s.wreckRepairs??0)>=3);
