import type { GameState } from "@/lib/game-state";
import type { ActionDef, Resolution } from "@/lib/actions";
import { RELATION_FIELDS, dailyTownEvent, type TownEvent } from "@/lib/living-town";

export type StreetEncounter = { title: string; text: string; choices: ActionDef[] };
/** Existing daily event slots, with one persisted resolution and no reward farming. */
export function availableStreetEvent(s: GameState): TownEvent | null {
  return s.streetEncounterDay === s.day ? null : dailyTownEvent(s.day,s.hour);
}
export function streetEncounter(event: TownEvent, opened: GameState): StreetEncounter {
  const choice = (id: string, label: string, hours: number, energy: number,
    resolve: (s: GameState) => Resolution): ActionDef => ({
    id: `encounter-${event.id}-${id}`, label: `${label}${hours ? ` · ${Math.round(hours*60)}m` : ""}${energy ? ` · ${energy} energy` : ""}`, hours, energy,
    resolve: s => {
      const available = availableStreetEvent(s);
      if(s.day !== opened.day || available?.id !== event.id) return "That moment has passed. Town gossip travels faster than you.";
      const result = resolve(s);
      return typeof result === "string" ? result : {...result,patch:{...result.patch,streetEncounterDay:s.day}};
    },
  });
  const outcome = (s: GameState, resident: "mara"|"nox"|"gus"|"ivy", relation: number, karma: number,
    patch: Partial<GameState>, message: string): Resolution => ({patch:{[RELATION_FIELDS[resident]]:Math.max(-10,Math.min(10,s[RELATION_FIELDS[resident]]+relation)),karma:s.karma+karma,...patch},message});
  let text: string, choices: ActionDef[];
  switch(event.id) {
    case "diner":
      text="Mara's shopping bag splits outside the diner. 'Perfect. Even the bag has resigned.'";
      choices=[choice("help","Collect the shopping",.5,4,s=>outcome(s,"mara",2,1,{},"Mara: 'Thanks. You're now my least disappointing colleague.' Relationship +2 · karma +1.")),
        choice("snack","Pocket an unopened snack · karma -2",0,0,s=>s.snacks>=99 ? "Your snack stash is full." : outcome(s,"mara",-2,-2,{snacks:s.snacks+1},"Mara notices. 'Excellent. A scavenger with shoes.' Snack +1 · relationship -2 · karma -2."))];break;
    case "bar":
      text="Gus is arguing over who gets his stool when he dies. Both contenders want it tonight.";
      choices=[choice("peace","Settle the stool dispute",.5,3,s=>outcome(s,"gus",2,1,{cha:s.cha+1},"Gus agrees to remain alive until closing. Charm +1 · relationship +2 · karma +1.")),
        choice("rumour","Tell them the stool is haunted · karma -1",0,0,s=>outcome(s,"gus",-1,-1,{cha:s.cha+1},"The pub observes a minute's silence for a chair. Charm +1 · relationship -1 · karma -1."))];break;
    case "school":
      text="Ivy has lost her notes on catastrophic failure. 'I suppose this counts as fieldwork.'";
      choices=[choice("help","Rebuild her notes",1,6,s=>outcome(s,"ivy",2,1,{int:s.int+1},"Ivy thanks you in a footnote. Intelligence +1 · relationship +2 · karma +1.")),
        choice("sell","Sell her your notes · $8 · karma -1",.5,2,s=>outcome(s,"ivy",-1,-1,{money:s.money+8},"Ivy files the receipt under 'human disappointment'. Cash +$8 · relationship -1 · karma -1."))];break;
    case "work":
      text="Gus claims MegaCorp is replacing managers with a printer. The printer has declined to comment.";
      choices=[choice("check","Check the rumour",.5,3,s=>outcome(s,"gus",1,0,{int:s.int+1},"It's a paper jam, not a coup. Gus calls it a cover-up. Intelligence +1 · relationship +1.")),
        choice("spread","Spread the rumour · karma -1",0,0,s=>outcome(s,"gus",-1,-1,{cha:s.cha+1},"Someone congratulates the printer. Charm +1 · relationship -1 · karma -1."))];break;
    case "shop":
      text=opened.heat>=30 ? "Nox watches a patrol. 'You're attracting uniforms. Terrible dress code.'" : opened.gangRep>=20 ? "Nox recognises you. 'Crew rate. Deliver a sealed box. Curiosity costs extra.'" : "Nox offers a sealed-box delivery. 'Nothing illegal. In writing, anyway.'";
      choices=[choice("delivery","Take the errand · heat +4",1,8,s=>outcome(s,"nox",2,-1,{money:s.money+(s.gangRep>=20?24:18),gangRep:Math.min(100,s.gangRep+2),heat:Math.min(100,s.heat+4)},`The box rattles. You don't ask. Cash +$${s.gangRep>=20?24:18} · relationship +2 · gang rep +2 · heat +4 · karma -1.`)),
        choice("refuse","Question his business model · relationship -1",0,0,s=>outcome(s,"nox",-1,0,{},"Nox: 'The audit department's over there. Keep walking.' Relationship -1."))];break;
    default:
      text="A lost wallet contains $12 and a loyalty card for the clinic. Someone's had a week.";
      choices=[choice("return","Return the wallet · 30m · karma +2",.5,2,s=>outcome(s,"ivy",1,2,{},"Ivy helps find its owner. 'A rare positive data point.' Relationship +1 · karma +2.")),
        choice("keep","Keep the $12 · karma -3",0,0,s=>({patch:{money:s.money+12,karma:s.karma-3},message:"You keep $12. The loyalty card offers no absolution. Cash +$12 · karma -3."}))];
  }
  return {title:event.title,text,choices};
}
