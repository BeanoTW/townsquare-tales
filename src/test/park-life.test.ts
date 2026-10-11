import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {parkAction,PARK_OBJECTS} from "@/lib/park-life";
import {gangReception,gangResponse} from "@/lib/street-gang";
import {parseGame} from "@/lib/game-state";
import {isWalkable,findRoute} from "@/lib/pathfinding";
import {buildings} from "@/components/TownMap";

describe("park activities and voluntary turf consequences",()=>{
  it("keeps park targets accessible through existing navigation",()=>{
    for(const p of PARK_OBJECTS) {
      expect(isWalkable(p,buildings(0))).toBe(true);
      expect(findRoute({x:9.95,y:9},p,buildings(0)).length).toBeGreaterThan(0);
    }
  });
  it("requires an equipped board without consuming time",()=>{
    expect(runAction({...START,skateboard:1,skateboardEquipped:0},parkAction("ramp")).ok).toBe(false);
  });
  it("rewards a trick once per saved day and allows it next day",()=>{
    const first=runAction({...START,skateboard:1,skateboardEquipped:1},parkAction("ramp"),()=>0);
    expect(first.ok).toBe(true);if(!first.ok)return;
    expect(first.next.cha).toBe(START.cha+1);
    expect(first.next.energy).toBe(START.energy-6);
    const loaded=parseGame(JSON.stringify(first.next),START);
    expect(runAction(loaded,parkAction("ramp")).ok).toBe(false);
    expect(runAction({...loaded,day:loaded.day+1},parkAction("ramp")).ok).toBe(true);
  });
  it("uses a bounded tumble instead of a reward at low energy",()=>{
    const result=runAction({...START,energy:12,skateboard:1,skateboardEquipped:1},parkAction("ramp"));
    expect(result.ok).toBe(true);if(!result.ok)return;
    expect(result.next.energy).toBe(2);expect(result.next.cha).toBe(START.cha);
  });
  it("charges training time and limits strength farming",()=>{
    const r=runAction(START,parkAction("hoop"));expect(r.ok).toBe(true);if(!r.ok)return;
    expect(r.next.str).toBe(START.str+1);expect(r.next.hour).toBe(START.hour+.5);
    expect(runAction(r.next,parkAction("hoop")).ok).toBe(false);
  });
  it("never clears heat for free and cannot repeat after reload",()=>{
    expect(runAction(START,parkAction("hide")).ok).toBe(false);
    const r=runAction({...START,heat:2},parkAction("hide"));expect(r.ok).toBe(true);if(!r.ok)return;
    expect(r.next.heat).toBe(0);expect(r.next.hour).toBe(START.hour+1);
    expect(runAction({...r.next,heat:20},parkAction("hide")).ok).toBe(false);
  });
  it("does not penalise the player for approaching and recognises alignment",()=>{
    expect(gangReception(START).patch).toEqual({});
    expect(gangReception({...START,gangStage:1}).hostile).toBe(false);
    expect(gangReception({...START,heat:20,karma:-10}).hostile).toBe(false);
  });
  it("resolves explicit responses with bounded losses and persistent rep guards",()=>{
    const loss=runAction({...START,money:2,str:0},gangResponse("stand"));expect(loss.ok).toBe(true);if(!loss.ok)return;
    expect(loss.next.money).toBe(0);
    const win=runAction({...START,cha:15},gangResponse("talk"));expect(win.ok).toBe(true);if(!win.ok)return;
    expect(win.next.gangRep).toBe(START.gangRep+1);
    expect(runAction(parseGame(JSON.stringify(win.next),START),gangResponse("stand")).ok).toBe(false);
  });
});
