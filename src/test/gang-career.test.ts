import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {parseGame} from "@/lib/game-state";
import {runAction} from "@/lib/actions";
import {gangAccess,gangDialogue,gangJob} from "@/lib/gang-career";

describe("gang criminal route",()=>{
  it("requires negative karma without exposing a progression meter",()=>{
    expect(gangAccess(START)).toBe("outsider");
    expect(gangDialogue(START)).not.toMatch(/-10|karma|rep|stage/i);
    expect(runAction(START,gangJob("gang-initiation")).ok).toBe(false);
  });
  it("starts with initiation and unlocks progressively riskier work",()=>{
    let state={...START,karma:-15,energy:100};
    expect(gangAccess(state)).toBe("initiation");
    const init=runAction(state,gangJob("gang-initiation"));
    if(!init.ok)throw Error(init.message);
    state=init.next;
    expect(gangAccess(state)).toBe("probation");
    expect(runAction(state,gangJob("gang-initiation")).ok).toBe(false);
    const errand=runAction(state,gangJob("gang-courier"));
    if(!errand.ok)throw Error(errand.message);
    expect(gangAccess(errand.next)).toBe("trusted");
    expect(errand.next.money).toBeGreaterThan(state.money);
    expect(errand.next.heat).toBeGreaterThan(state.heat);
  });
  it("keeps earned trust through save and gates serious jobs",()=>{
    const state={...START,karma:-14,gangStage:1,gangRep:1};
    expect(runAction(state,gangJob("gang-fence")).ok).toBe(false);
    expect(parseGame(JSON.stringify({...state,gangStage:2,gangRep:6}),START)).toMatchObject({gangStage:2,gangRep:6});
  });
});