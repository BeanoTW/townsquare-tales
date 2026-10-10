import { describe,expect,it } from "vitest";
import { START } from "@/lib/game-data";
import { FURNITURE, ownsFurniture } from "@/lib/furniture";
import { runAction, furnitureAction, homeEntertainmentAction, HOME_ENTERTAINMENT } from "@/lib/actions";
import { parseGame } from "@/lib/game-state";
import { ROOMS, visibleHotspots, hotspotActions } from "@/lib/rooms";

describe("expanded home life", () => {
  it("purchases and remembers the new furniture independently", () => {
    const st={...START,house:1,money:2000};
    const first=runAction(st,furnitureAction("console",st));
    if(!first.ok)throw Error(first.message);
    const second=runAction(first.next,furnitureAction("bookshelf",first.next));
    if(!second.ok)throw Error(second.message);
    const save=parseGame(JSON.stringify(second.next),START);
    expect(ownsFurniture(save.furniture,"console")).toBe(true);
    expect(ownsFurniture(save.furniture,"bookshelf")).toBe(true);
    expect(ownsFurniture(save.furniture,"tv")).toBe(false);
    expect(FURNITURE.reduce((n,f)=>n|f.bit,0)).toBe(255);
  });
  it.each(HOME_ENTERTAINMENT)("charges time and energy and grants $stat for $id",activity=>{
    const st={...START,house:1,furniture:255,hour:8,energy:100};
    const out=runAction(st,homeEntertainmentAction(activity.id));
    if(!out.ok)throw Error(out.message);
    expect(out.next.hour).toBe(8+activity.hours);
    expect(out.next.energy).toBe(100-activity.energy);
    expect(out.next[activity.stat]).toBe(st[activity.stat]+activity.gain);
  });
  it("locks the activities without the right furnishings and hides their hotspots",()=>{
    expect(runAction({...START,house:1},homeEntertainmentAction("game-puzzle")).ok).toBe(false);
    expect(visibleHotspots(ROOMS.home,{...START,house:1}).some(x=>x.id==="console")).toBe(false);
    const all=visibleHotspots(ROOMS.home,{...START,house:1,furniture:255});
    expect(hotspotActions(all.find(x=>x.id==="bookshelf")!,{...START,house:1,furniture:255})).toHaveLength(2);
    expect(hotspotActions(all.find(x=>x.id==="console")!,{...START,house:1,furniture:255})).toHaveLength(2);
  });
});