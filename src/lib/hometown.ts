import type {GameState} from "@/lib/game-state";
import type {ActionDef} from "@/lib/actions";

/** This first hometown visit resolves as a journey encounter. A second explorable city is future work. */
export const hometownUnlocked=(s:GameState)=>((s.underworldStoryMask??0)&31)===31;
export const familyCorrespondenceEstablished=(s:GameState)=>Boolean(s.familyFirstReplyDay && (s.familyReplyMask??0));
export const canVisitFamilyOnTrip=(s:GameState)=>familyCorrespondenceEstablished(s)&&Boolean(s.hometownNoticeDay && s.hometownNoticeDay<s.day);
export function notifyFamilyOfVisit(s:GameState):GameState {
 if(!hometownUnlocked(s)||s.hometownJobDone)return s;
 return {...s,hometownNoticeDay:s.day};
}
export const buyMoonDust:ActionDef={id:"crew-buy-moon-dust",label:"Buy Moon Dust · $1,000",hours:0,energy:0,cost:1000,
 resolve:s=>s.gangStage<1?"The crew doesn't know you well enough to sell you anything.":s.money<1000?"Mick insists the price is $1,000. Nia insists you don't ask what the markup is.":(s.stimulantPacks??0)>=20?"You can't carry any more mysterious powder.":{patch:{money:s.money-1000,stimulantPacks:(s.stimulantPacks??0)+1},message:"Nia hands you Moon Dust. Mick says he's a pharmaceutical magnate. Lez asks whether the moon gets royalties."}};
export const hometownSupplyRun:ActionDef={id:"hometown-supply-run",label:"Make the hometown supply run",hours:8,energy:10,
 resolve:s=>{
 if(!hometownUnlocked(s))return "There isn't an out-of-town job for you yet.";
 if(s.hometownJobDone)return "Bomb and Minnie have already made their introduction.";
 const visit=canVisitFamilyOnTrip(s);
 return {patch:{hometownJobDone:1,hometownTripDay:s.day,hometownTripResult:visit?1:2,gangRep:Math.min(100,s.gangRep+2),criminalTrust:Math.min(100,(s.criminalTrust??0)+5),money:Math.min(1e12,s.money+700)},
 message:visit?"Bomb and Minnie meet you in your old city. Their supply operation looks oddly professional. You stop by the family home afterwards; Mum has the kettle on, and Sarah is glad you warned them. +$700.":"Bomb and Minnie meet you in your old city. You recognise the streets, but the family home isn't expecting you. You finish the delivery and head back. +$700. Someone may have spotted you."};
 }};
