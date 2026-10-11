import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";

/** A permanent street encounter, not a sixteenth building. Open green north-east of the shops. */
export const GANG_SPOT = { id: "gang", x: 26.4, y: 6.8, approach: 1.45 } as const;

export type GangMeeting =
  | { hostile: true; message: string; patch: Partial<GameState>; cashLost: number }
  | { hostile: false; message: string; patch: Partial<GameState>; cashLost: 0 };

/**
 * No paywall or purchased defence. Both weak and uncharismatic means a
 * guaranteed rough reception; either social confidence or strength can help.
 * Higher combined stats progressively reduce the chance of being targeted.
 */
export function meetStreetGang(state: GameState, rng: () => number = Math.random): GangMeeting {
  const strength = Math.max(0, state.str);
  const charm = Math.max(0, state.cha);
  const easyTarget = strength < 15 && charm < 15;
  const survival = Math.min(0.98, 0.12 + strength * 0.013 + charm * 0.019);
  const hostile = easyTarget || rng() >= survival;
  if (hostile) {
    const cashLost = Math.min(state.money, Math.max(10, Math.ceil(state.money * 0.4)));
    return {
      hostile: true,
      cashLost,
      patch: { money: state.money - cashLost, energy: Math.max(0, state.energy - 16) },
      message: cashLost
        ? `"Oi! Wrong part of town, mate. F*** off!" They shove you about and nick $${cashLost}. -16 energy.`
        : '"Oi! Wrong part of town, mate. F*** off!" They shove you away. -16 energy.',
    };
  }
  return {
    hostile: false,
    cashLost: 0,
    patch: {},
    message: strength >= 22
      ? '"Alright, tough one. You can hang about. Don\'t cause trouble."'
      : '"You\'ve got some nerve coming over here. Alright, what do you want?"',
  };
}

/** Approaching is free; only an explicit response risks a consequence. */
export function gangReception(s: GameState): GangMeeting {
  if(s.gangStage>0 || s.gangRep>=3 || (s.karma<=-10 && s.heat>=10)) return {hostile:false,cashLost:0,patch:{},message:'"There you are. Looking regrettably employable. Fancy a job?"'};
  if(s.str>=22 || s.cha>=22) return {hostile:false,cashLost:0,patch:{},message:'"Alright. Hang about. Just don’t start a motivational podcast."'};
  return {hostile:true,cashLost:0,patch:{},message:'"Private pavement, mate. Donation or demonstration?" You can leave safely, talk them down, or stand your ground.'};
}
export function gangResponse(kind: "stand" | "talk"): ActionDef {
  return {id:`gang-${kind}`,label:kind==="stand"?"Stand ground · 10 energy · risk losing $10":"Talk them down · 4 energy · risk losing $5",
    hours:.25,energy:kind==="stand"?10:4,resolve:(s)=> {
      if(s.gangResponseDay===s.day) return "You've settled this today. Nobody needs an encore.";
      const succeeds=kind==="stand"?s.str>=15:s.cha>=15;
      if(succeeds) return {patch:{gangResponseDay:s.day,gangRep:Math.min(100,s.gangRep+1)},message:kind==="stand"?"You hold your ground. They respect the paperwork involved in bothering someone else. Street rep +1.":"You talk them into calling it a misunderstanding. They spell that 'networking'. Street rep +1."};
      const lost=Math.min(s.money,kind==="stand"?10:5);
      return {patch:{gangResponseDay:s.day,money:s.money-lost},message:`They insist on a $${lost} 'pavement licence'. You're free to leave, dignity pending.`};
    }};
}
