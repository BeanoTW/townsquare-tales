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
export function attemptHotwire(): ActionDef {
  return { id:"wreck-ignition",label:"Try the ignition",hours:0.5,energy:8,
    resolve:s=>{
      if(s.abandonedCar) return "You've already claimed the old wreck.";
      if(!criminalMilestones(s).learnedCar) return "You have no idea where to start.";
      if(s.hotwireLastDay===s.day) return "You've already tried today. Give it a rest.";
      const attempts=(s.hotwireAttempts??0)+1;
      // Abstract retry puzzle, deliberately no instructions for real vehicle interference.
      const success=(s.streetSmarts??0)>=12 || attempts>=3;
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
      if(s.gangRep < 7 && (s.streetSmarts??0)<16) return '"You're not ready to meet them."';
      return {patch:{pawnIntroduction:1,criminalTrust:Math.min(100,(s.criminalTrust??0)+8)},
        message:'"Ask at the pawn shop. Quietly. Mention that we sent you. They decide if you get through the back door."' };
    }};
}
