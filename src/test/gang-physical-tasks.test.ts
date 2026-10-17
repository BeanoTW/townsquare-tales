import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {gangJob,advanceGangTask,gangTaskObjective} from "@/lib/gang-career";
import {parseGame} from "@/lib/game-state";
describe("physical gang assignments",()=>{
 it("initiation requires collecting an envelope and returning",()=>{
 const accepted=runAction(START,gangJob("gang-initiation"));expect(accepted.ok).toBe(true);if(!accepted.ok)return;
 expect(accepted.next.money).toBe(START.money);expect(accepted.next.gangTask).toBe(1);
 const collected=runAction(accepted.next,advanceGangTask(1));expect(collected.ok).toBe(true);if(!collected.ok)return;
 expect(gangTaskObjective(collected.next)?.place).toBe("gang");
 const paid=runAction(collected.next,advanceGangTask(2));expect(paid.ok).toBe(true);if(!paid.ok)return;
 expect(paid.next).toMatchObject({gangTask:0,gangStage:1,money:START.money+15});
 });
 it("lookout must visit bank and report back before reward",()=>{
 const start={...START,gangStage:1,gangRep:1};
 const accepted=runAction(start,gangJob("gang-lookout"));expect(accepted.ok).toBe(true);if(!accepted.ok)return;
 expect(accepted.next.gangTask).toBe(3);expect(accepted.next.money).toBe(start.money);
 expect(runAction(accepted.next,gangJob("gang-lookout")).ok).toBe(false);
 const watched=runAction(accepted.next,advanceGangTask(3));expect(watched.ok).toBe(true);if(!watched.ok)return;
 expect(gangTaskObjective(watched.next)?.place).toBe("gang");
 const paid=runAction(watched.next,advanceGangTask(4));expect(paid.ok).toBe(true);if(!paid.ok)return;
 expect(paid.next.money).toBe(start.money+35);
 });
 it("buyer exchange happens at pub, survives save reload",()=>{
 const start={...START,gangStage:2,gangRep:3};
 const accepted=runAction(start,gangJob("gang-fence"));expect(accepted.ok).toBe(true);if(!accepted.ok)return;
 expect(accepted.next.money).toBe(start.money);
 expect(gangTaskObjective(accepted.next)?.place).toBe("bar");
 const loaded=parseGame(JSON.stringify(accepted.next),START);expect(loaded.gangTask).toBe(5);
 const paid=runAction(loaded,advanceGangTask(5));expect(paid.ok).toBe(true);if(!paid.ok)return;
 expect(paid.next.money).toBe(start.money+120);expect(paid.next.gangTask).toBe(0);
 });
});
