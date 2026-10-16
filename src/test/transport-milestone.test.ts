import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction} from "@/lib/actions";
import {licenceTestAction,claimCompanyCarAction,driveAction,canDrive} from "@/lib/transport";
import {parseGame} from "@/lib/game-state";
describe("car milestone and fast travel",()=>{
 it("requires skill to pass and charges a test fee",()=>{
  const fail=runAction({...START,money:200,int:5},licenceTestAction());
  expect(fail.ok).toBe(true); if(fail.ok){expect(fail.next.money).toBe(80);expect(fail.next.drivingLicence).toBeUndefined();}
  const ok=runAction({...START,money:200,int:10},licenceTestAction());
  expect(ok.ok).toBe(true);if(ok.ok)expect(ok.next.drivingLicence).toBe(1);
 });
 it("requires a Site Lead record and valid licence for free car",()=>{
  expect(runAction({...START,drivingLicence:1},claimCompanyCarAction()).ok).toBe(false);
  expect(runAction({...START,careerBest3:2},claimCompanyCarAction()).ok).toBe(false);
  const result=runAction({...START,careerBest3:2,drivingLicence:1},claimCompanyCarAction());
  expect(result.ok).toBe(true);if(result.ok)expect(canDrive(result.next)).toBe(true);
 });
 it("fast travels only to home and work and uses in-game time",()=>{
  const s={...START,drivingLicence:1,companyCar:1,employed:1,day:4,hour:9};
  const home=runAction(s,driveAction("home"));
  expect(home.ok).toBe(true);if(!home.ok)return;
  expect(home.next.hour).toBe(9.5);
  expect(home.next.driveDestination).toBe(1);
  const job=runAction(home.next,driveAction("work"));
  expect(job.ok).toBe(true);if(job.ok){expect(job.next.hour).toBe(10.25);expect(job.next.driveDestination).toBe(2);expect(job.next.driveTrip).toBe(2);}
  expect(runAction({...s,employed:0},driveAction("work")).ok).toBe(false);
  expect(runAction({...s,companyCar:0},driveAction("home")).ok).toBe(false);
 });
 it("preserves unlocks across saved games",()=>{
  const s={...START,drivingLicence:1,companyCar:1,driveDestination:1,driveTrip:8};
  const loaded=parseGame(JSON.stringify(s),START);
  expect(loaded.drivingLicence).toBe(1);
  expect(loaded.companyCar).toBe(1);
  expect(loaded.driveTrip).toBe(8);
 });
});