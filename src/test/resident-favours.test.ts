import {describe,expect,it} from "vitest";
import {runAction,type ActionDef} from "@/lib/actions";
import {START} from "@/lib/game-data";
import {parseGame,type GameState} from "@/lib/game-state";
import {RELATION_FIELDS} from "@/lib/living-town";
import {RESIDENT_FAVOURS,acceptFavour,activeFavour,closeFavour,favourChoices,favourExpired,favourObjective,favourVisitAction,finishFavour} from "@/lib/resident-favours";
function execute(s:GameState,action:ActionDef):GameState {
  const result=runAction(s,action);
  if(!result.ok)throw Error(result.message);
  return result.next;
}
describe("resident favours",()=>{
  it.each(RESIDENT_FAVOURS)("tracks $resident pickup, hand-in and saved progress",f=>{
    let s=execute({...START,hour:12},acceptFavour(f.resident));
    expect(activeFavour(s)?.resident).toBe(f.resident);
    expect(favourObjective(s)).toContain(f.location);
    expect(favourVisitAction(s,"gym")).toBeNull();
    expect(runAction(s,finishFavour(f.resident)).ok).toBe(false);
    s=execute(s,favourVisitAction(s,f.pickup)!);
    s=parseGame(JSON.stringify(s),START);
    expect(s.residentFavourStage).toBe(1);
    expect(favourObjective(s)).toContain("Return");
    expect(favourVisitAction(s,f.pickup)).toBeNull();
    s=execute(s,finishFavour(f.resident));
    expect(activeFavour(s)).toBeNull();
    expect(s.hour).toBe(12.25);expect(s.energy).toBe(98);
    expect(s[RELATION_FIELDS[f.resident]]).toBe(2);
    expect(runAction(s,finishFavour(f.resident)).ok).toBe(false);
    expect(runAction(s,acceptFavour(f.resident)).ok).toBe(false);
    expect(favourChoices(f.resident,{...s,day:s.day+3})).toHaveLength(1);
  });
  it.each(RESIDENT_FAVOURS)("offers a questionable or cautious alternative for $resident",f=>{
    let s=execute({...START,hour:12},acceptFavour(f.resident));
    s=execute(s,favourVisitAction(s,f.pickup)!);
    const before={...s};
    s=execute(s,finishFavour(f.resident,true));
    expect(s[RELATION_FIELDS[f.resident]]).toBeLessThan(before[RELATION_FIELDS[f.resident]]);
    expect(activeFavour(s)).toBeNull();
    expect(s.hour).toBe(before.hour+.25);
    expect(s.energy).toBe(before.energy-2);
  });
  it("permits only one active favour and refuses strangers with a grudge",()=>{
    const s=execute(START,acceptFavour("mara"));
    expect(runAction(s,acceptFavour("ivy")).ok).toBe(false);
    expect(favourChoices("ivy",s)).toHaveLength(0);
    expect(runAction({...START,relIvy:-4},acceptFavour("ivy")).ok).toBe(false);
  });
  it("persists exact fractional deadlines, handles next-day expiry and closes without punishment",()=>{
    let s=execute({...START,hour:23.5},acceptFavour("mara"));
    expect(s.residentFavourDeadline).toBe(51.5);
    s=parseGame(JSON.stringify(s),START);
    expect(s.residentFavourDeadline).toBe(51.5);
    expect(favourObjective(s)).toContain("day 2, 03:30");
    const expired={...s,day:2,hour:8};
    expect(favourExpired(expired)).toBe(true);
    expect(favourVisitAction(expired,"diner")).toBeNull();
    const closed=execute(expired,closeFavour("mara"));
    expect(closed.relMara).toBe(expired.relMara);expect(closed.karma).toBe(expired.karma);
    expect(activeFavour(closed)).toBeNull();
  });
  it("requires time to finish and does not charge energy or consume the quest on failure",()=>{
    let s=execute({...START,hour:12},acceptFavour("ivy"));
    s=execute(s,favourVisitAction(s,"school")!);
    expect(runAction({...s,energy:0},finishFavour("ivy")).ok).toBe(false);
    expect(runAction({...s,hour:19.9},finishFavour("ivy")).ok).toBe(false);
    expect(s.residentFavourStage).toBe(1);
  });
  it("bounds Nox's heat, gang reputation and relationship rewards",()=>{
    let s=execute({...START,hour:12,heat:99,gangRep:99,relNox:10},acceptFavour("nox"));
    s=execute(s,favourVisitAction(s,"pawn")!);
    s=execute(s,finishFavour("nox"));
    expect(s.heat).toBe(100);expect(s.gangRep).toBe(100);expect(s.relNox).toBe(10);
  });
  it("rejects an overfull snack inventory and the wrong resident hand-in",()=>{
    let s=execute({...START,hour:12,snacks:99},acceptFavour("mara"));
    s=execute(s,favourVisitAction(s,"diner")!);
    expect(runAction(s,finishFavour("mara",true)).ok).toBe(false);
    expect(runAction(s,finishFavour("gus")).ok).toBe(false);
    expect(runAction(s,closeFavour("gus")).ok).toBe(false);
  });
  it("does not alter old saves or unrelated employment, progression and inventory",()=>{
    const old=parseGame(JSON.stringify(START),START);
    expect(activeFavour(old)).toBeNull();
    const accepted=execute({...old,job:3,house:2,skateboard:1,parkKidGone:1},acceptFavour("mara"));
    const picked=execute(accepted,favourVisitAction(accepted,"diner")!);
    expect(picked).toMatchObject({job:3,house:2,skateboard:1,parkKidGone:1});
  });
});
