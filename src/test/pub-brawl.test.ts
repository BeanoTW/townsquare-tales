import {describe,it,expect} from "vitest";
import {beginFight,takeTurn,settleFight,PUB_STAKES} from "@/lib/combat";
import type {GameState} from "@/lib/game-state";
const state={money:500,energy:100,hour:12,health:100,str:0,streetSmarts:0,medicalDebt:0} as GameState;
describe("pub AP fighting",()=>{
 it("offers repeatable three-stake brawls",()=>{expect(PUB_STAKES).toEqual([50,150,300]);expect(beginFight(state,50).stake).toBe(20);expect(()=>beginFight(state,200)).toThrow();});
 it("spends AP, trades turns, and blocks damage",()=>{let f=beginFight(state,20);f=takeTurn(f,"block");expect(f.player.guard).toBe(true);expect(f.turn).toBe("opponent");f=takeTurn(f,"jab",()=>0);expect(f.player.hp).toBeLessThan(100);expect(f.player.guard).toBe(false);expect(f.turn).toBe("player");});
 it("can KO and settle winnings without healing",()=>{let f=beginFight(state,50);f.opponent.hp=1;f=takeTurn(f,"jab",()=>0);expect(f.over).toBe(true);expect(f.winner).toBe("player");const after=settleFight(state,f);expect(after.money).toBe(550);expect(after.health).toBe(100);});
 it("charges a loss once and restores minimum survivable health",()=>{let f=beginFight(state,300);f.turn="opponent";f.player.hp=1;f=takeTurn(f,"jab",()=>0);expect(f.winner).toBe("opponent");const a=settleFight(state,f);expect(a.money).toBe(200);expect(a.medicalDebt).toBe(350);expect(a.health).toBe(30);});
 it("disallows starting a fight when incapacitated",()=>{expect(()=>beginFight({...state,health:0},20)).toThrow();});
});
