import { runAction, type ActionDef, type ActionResult, type Rng } from "@/lib/actions";
import { parseGame, type GameState } from "@/lib/game-state";

/** A separate sandbox save: never overwrite the normal game's progress. */
export const GOD_SAVE_KEY = "sticktown-god-save";
export const GOD_ENABLED_KEY = "sticktown-god-enabled";
const MAX_MONEY = 1_000_000_000_000;

/** Developer mode supplies test resources, not unlocked progression. */
export function grantGodPowers(s: GameState): GameState {
  return {
    ...s,
    money: MAX_MONEY,
    bank: MAX_MONEY,
    energy: 100,
    xp: 1_000_000,
    skateboard: 1,
    skateboardEquipped: 1,
    abandonedCar: 1,
    wreckRepairs: 3,
    drivingLicence: 1,
  };
}

/** Time and resource costs are bypassed, but career, home, education and equipment still progress normally. */
export function runGodAction(state: GameState, def: ActionDef, rng: Rng = Math.random): ActionResult {
  const powered = grantGodPowers(state);
  // Preserve the real clock for contextual dialogue and quest deadlines.
  const attempt = runAction(powered, { ...def, hours: 0, energy: 0 }, rng);
  if (!attempt.ok) return attempt;
  return {
    ...attempt,
    next: grantGodPowers({
      ...attempt.next,
      hour: state.hour,
    }),
    hoursUsed: 0,
    changes: attempt.changes,
  };
}

export function parseGodSave(raw: string | null, fallback: GameState): GameState {
  if (!raw) return grantGodPowers(fallback);
  try {
    return grantGodPowers(parseGame(raw, fallback));
  } catch {
    return grantGodPowers(fallback);
  }
}

/** Explicit developer controls, never applied to the normal save. */
export type DeveloperBoost = "all-xp"|"max-stats"|"good-karma"|"bad-karma"|"equipment"|"homes"|"jobs"|"reset-heat";
export function developerBoost(s:GameState,kind:DeveloperBoost):GameState {
 switch(kind){
  case "all-xp":return {...s,xp:1e6,studyXp:1e6,careerXp0:1e6,careerXp1:1e6,careerXp2:1e6,careerXp3:1e6};
  case "max-stats":return {...s,str:1e6,int:1e6,cha:1e6,streetSmarts:100,criminalTrust:100,gangRep:100,energy:100};
  case "good-karma":return {...s,karma:1e6};
  case "bad-karma":return {...s,karma:-1e6};
  case "equipment":return {...s,skateboard:1,skateboardEquipped:1,abandonedCar:1,wreckRepairs:3,drivingLicence:1,weapon:2,trainers:1};
  case "homes":return {...s,ownedHomes:31,house:4};
  case "jobs":return {...s,school:4,career:3,job:4,employed:1};
  case "reset-heat":return {...s,heat:0};
 }
}
/** Jump to an authored scene without unlocking unrelated normal progression. */
export function developerStory(s:GameState,id:number):GameState {
 if(!Number.isInteger(id)||id<0||id>5)return s;
 return {...s,underworldStoryActive:id,gangTask:0,gangParcel:0};
}
