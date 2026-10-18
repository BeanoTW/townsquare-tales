import type { GameState } from "./game-state";

export type FightVenue = "pub" | "underground";
export type MoveId = "jab" | "hook" | "heavy" | "block" | "recover";
export type Fighter = { name: string; hp: number; ap: number; guard: boolean; strength: number; smarts: number; maxAp?: number; style?: "balanced" | "brawler" | "technical" | "defensive" };
export type Fight = { venue: FightVenue; stake: number; player: Fighter; opponent: Fighter; round: number; turn: "player" | "opponent"; history: string[]; over: boolean; winner?: "player" | "opponent" };
export const MOVES: Record<MoveId,{name:string;cost:number;min:number;max:number;accuracy:number}> = {
 jab:{name:"Jab",cost:1,min:5,max:9,accuracy:.94},
 hook:{name:"Hook",cost:2,min:12,max:18,accuracy:.78},
 heavy:{name:"Heavy punch",cost:3,min:20,max:30,accuracy:.62},
 block:{name:"Block",cost:1,min:0,max:0,accuracy:1},
 recover:{name:"Recover",cost:0,min:0,max:0,accuracy:1},
};
export const PUB_STAKES = [50,150,300] as const;
export const fightMaxHp = (s:GameState) => 100 + Math.min(60, Math.floor(((s.vitality ?? 0)*2 + s.str) / 5));
export const fightMaxAp = (strength:number, intelligence:number) => Math.min(9, 5 + Math.floor((strength + intelligence) / 20));
export const FIGHT_BILLS = { minor:100, pubLoss:350, serious:1500, moonDust:10000 } as const;
export function beginFight(s:GameState,stake:number,venue:FightVenue="pub",opponentIndex=0):Fight {
 if(venue==="pub"&&!PUB_STAKES.includes(stake as 50|150|300))throw Error("Invalid pub stake");
 if(s.money<stake)throw Error("Insufficient cash for wager");
 if((s.health??100)<=0)throw Error("Get medical treatment first");
 const names=["Big Barry","One-Punch Pete","Derek the Menace","Mad Mick's Cousin"];
 const difficulty=venue==="pub"?opponentIndex%4:Math.max(4,opponentIndex+4);
 const tier=venue==="pub"?PUB_STAKES.indexOf(stake as 50|150|300):3;
 const bonus=venue==="pub"?[0,24,55][tier]!:65;
 const style=(["balanced","brawler","technical","defensive"] as const)[difficulty%4]!;
 const maxAp=fightMaxAp(s.str,s.int);
 return {venue,stake,player:{name:"You",hp:Math.min(fightMaxHp(s), (s.health??100)+fightMaxHp(s)-100),ap:maxAp,maxAp,guard:false,strength:s.str,smarts:(s.streetSmarts??0)+Math.floor(s.int/4),style:"balanced"},opponent:{name:venue==="pub"?names[difficulty]: "Underground contender",hp:72+difficulty*7+bonus,ap:5+Math.floor(tier/2),maxAp:5+Math.floor(tier/2),guard:false,strength:4+difficulty*3+Math.floor(bonus/3),smarts:difficulty*2+Math.floor(bonus/3),style},round:1,turn:"player",history:["The crowd gathers. Bets are on!"],over:false};
}
export function takeTurn(f:Fight,move:MoveId,roll:()=>number=Math.random):Fight {
 if(f.over) return f;
 const spec=MOVES[move], isPlayer=f.turn==="player", actor={...(isPlayer?f.player:f.opponent)}, target={...(isPlayer?f.opponent:f.player)};
 if(actor.ap<spec.cost)throw Error("Not enough action points");
 let message="";
 if(move==="recover"){actor.ap=Math.min(actor.maxAp??5,actor.ap+2);message=actor.name+" catches their breath (+2 AP).";}
 else {actor.ap-=spec.cost;
  if(move==="block"){actor.guard=true;message=actor.name+" braces for a punch.";}
  else if(roll()>spec.accuracy + Math.min(.06,actor.smarts*.001)){message=actor.name+"'s "+spec.name.toLowerCase()+" misses!";}
  else {const span=spec.max-spec.min+1;let damage=spec.min+Math.floor(roll()*span)+Math.min(8,Math.floor(actor.strength/15));
   if(target.guard){damage=Math.ceil(damage*.35);target.guard=false;}
   target.hp=Math.max(0,target.hp-damage);message=actor.name+" lands a "+spec.name.toLowerCase()+" for "+damage+" HP!";
  }
 }
 const next:Fight={...f,player:isPlayer?actor:target,opponent:isPlayer?target:actor,history:[...f.history,message].slice(-9)};
 if(target.hp===0){next.over=true;next.winner=f.turn;return next;}
 next.turn=isPlayer?"opponent":"player";if(isPlayer===false)next.round++;
 (next.turn==="player"?next.player:next.opponent).ap=Math.min((next.turn==="player"?next.player:next.opponent).maxAp??5,(next.turn==="player"?next.player:next.opponent).ap+2);
 return next;
}
export function opponentMove(f:Fight):MoveId {
 if(f.turn!=="opponent")return "recover";
 const a=f.opponent;
 if(a.ap<1)return "recover";
 if((a.style==="defensive" && a.hp<65 || a.hp<25)&&a.ap>=1&&f.player.ap>=3)return "block";
 if(a.style==="brawler"&&a.ap>=3&&f.round%2===0)return "heavy";
 if(a.style==="technical"&&a.ap>=2&&f.round%3!==0)return "hook";
 if(a.ap>=3&&a.hp>35&&f.round%3===0)return "heavy";
 if(a.ap>=2)return "hook";
 return "jab";
}
export function settleFight(s:GameState,f:Fight):Partial<GameState> {
 if(!f.over||!f.winner)throw Error("Fight is unfinished");
 const won=f.winner==="player";const combatBonus=fightMaxHp(s)-100;const hp=won?Math.max(1,f.player.hp-combatBonus):Math.max(30,f.player.hp-combatBonus);
 return {health:hp,money:Math.max(0,s.money-f.stake+(won?f.stake*2:0)),medicalDebt:Math.min(1e6,(s.medicalDebt??0)+(won?0:f.venue==="pub"?FIGHT_BILLS.pubLoss:FIGHT_BILLS.serious)),energy:Math.max(0,s.energy-15),hour:Math.min(24,s.hour+0.5)};
}
