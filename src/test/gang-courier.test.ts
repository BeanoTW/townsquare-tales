import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {gangJob,deliverGangParcel} from "@/lib/gang-career";
import {parseGame} from "@/lib/game-state";
describe("gang package courier",()=>{
 const initial={...START,gangStage:1,gangRep:1};
 it("requires gang initiation",()=>{
  expect(runAction(START,gangJob("gang-courier")).ok).toBe(false);
 });
 it("collects a parcel without instant payout",()=>{
  const result=runAction(initial,gangJob("gang-courier"));
  expect(result.ok).toBe(true);
  if(!result.ok)return;
  expect(result.next).toMatchObject({gangParcel:1,money:initial.money,gangRep:1});
  expect(runAction(result.next,gangJob("gang-courier")).ok).toBe(false);
  const restored=parseGame(JSON.stringify(result.next),START);
  expect(restored.gangParcel).toBe(1);
 });
 it("pays only on handoff and clears parcel",()=>{
  const start={...initial,gangParcel:1};
  const outcome=runAction(start,deliverGangParcel());
  expect(outcome.ok).toBe(true);
  if(!outcome.ok)return;
  expect(outcome.next).toMatchObject({gangParcel:0,money:initial.money+75,gangRep:3});
  expect(runAction(outcome.next,deliverGangParcel()).ok).toBe(false);
 });
});
