import { describe, expect, it } from "vitest";
import { parseGame } from "@/lib/game-state";
import { START } from "@/lib/game-data";
import { runAction } from "@/lib/actions";
import { streetAction, residentBark, ambientVisible, pigeonOffset, newEncounterMemory, updateEncounter, makeActor, moveActor, reactionTarget, recordStreetIncident } from "@/lib/street-life";

describe("street life integration", () => {
  it("lets bench rests advance time and restore energy", () => {
    const result = runAction({ ...START, hour: 12, energy: 45 }, streetAction("bench"));
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.next.hour).toBe(12.5); expect(result.next.energy).toBe(53); }
  });
  it("charges only once for a vending drink", () => {
    const result = runAction({ ...START, money: 10, energy: 60 }, streetAction("vending"));
    expect(result.ok).toBe(true);
    if (result.ok) { expect(result.next.money).toBe(7); expect(result.next.energy).toBe(72); }
  });
  it("prevents repeat bin searches on the same day", () => {
    const first = runAction({ ...START, day: 2 }, streetAction("bin"), () => 0.1);
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const again = runAction(first.next, streetAction("bin"), () => 0.1);
    expect(again.ok).toBe(false);
  });
  it("makes reactions context and reputation dependent", () => {
    expect(residentBark("mara", START, "skating")).not.toBe(residentBark("mara", START, "passing"));
    expect(residentBark("nox", { ...START, gangRep: 30 }, "passing")).not.toBe(residentBark("nox", START, "passing"));
  });
  it("switches ambient residents by time and scatters birds", () => {
    expect(ambientVisible("patrol", 23)).toBe(true);
    expect(ambientVisible("patrol", 12)).toBe(false);
    expect(pigeonOffset(0, 2, 0).scatter).toBe(true);
    expect(pigeonOffset(10, 2, 0).scatter).toBe(false);
  });
});

describe("physical encounters", () => {
  const actor = () => ({...makeActor({x:5,y:5},[]),path:[{x:8,y:5}]});
  it("does not harass a stationary nearby player or someone beside the route", () => {
    const m=newEncounterMemory(), a=actor();
    for(let i=0;i<500;i++) expect(updateEncounter(m,a,{x:5,y:5.5},{x:0,y:0},true,"ivy",i*.1,.1)).toBeNull();
  });
  it("dodges a fast approaching board but not one moving away", () => {
    const m=newEncounterMemory(), a=actor();
    expect(updateEncounter(m,a,{x:4,y:5},{x:-2,y:0},true,"ivy",0,.1)).toBeNull();
    expect(updateEncounter(m,a,{x:4,y:5},{x:2,y:0},true,"ivy",0,.1)).toBe("skating");
    expect(m.kind).toBe("dodge");
    for(let i=1;i<400;i++) expect(updateEncounter(m,a,{x:4,y:5},{x:2,y:0},true,"ivy",i*.1,.1)).toBeNull();
    updateEncounter(m,a,{x:1,y:5},{x:0,y:0},true,"ivy",41,.1);
    expect(updateEncounter(m,a,{x:4,y:5},{x:2,y:0},true,"ivy",42,.1)).toBe("skating");
  });
  it("requires two seconds of actual route blocking and differentiates personalities", () => {
    const m=newEncounterMemory(), a=actor();
    for(let i=0;i<19;i++) expect(updateEncounter(m,a,{x:5.5,y:5},{x:0,y:0},false,"mara",i*.1,.1)).toBeNull();
    expect(updateEncounter(m,a,{x:5.5,y:5},{x:0,y:0},false,"mara",2,.1)).toBe("blocked");
    const ivy=newEncounterMemory(), nox=newEncounterMemory();
    updateEncounter(ivy,a,{x:4,y:5},{x:1,y:0},false,"ivy",0,.1);
    updateEncounter(nox,a,{x:4,y:5},{x:1,y:0},false,"nox",0,.1);
    expect(ivy.kind).toBe("yield"); expect(nox.kind).toBe("refuse");
  });
  it("keeps sidesteps on walkable ground and movement bounded", () => {
    const a=actor(), lots=[{x:4,y:5.4,w:2,d:2}];
    const target=reactionTarget(a,{x:4.5,y:5},lots)!;
    expect(target.y).toBeLessThan(5);
    moveActor(a,target,lots,.1);
    expect(Math.hypot(a.x-5,a.y-5)).toBeLessThanOrEqual(.081);
  });
  it("forgives isolated accidents and persists a bounded repeated-annoyance penalty", () => {
    let s=recordStreetIncident(START,"mara");
    expect(s.relMara).toBe(0);
    s=recordStreetIncident(s,"mara"); expect(s.relMara).toBe(0);
    s=recordStreetIncident(s,"mara"); expect(s.relMara).toBe(-1);
    s=parseGame(JSON.stringify(s),START);
    expect(recordStreetIncident(s,"mara")).toEqual(s);
    expect(recordStreetIncident({...s,day:2},"mara").relMara).toBe(-1);
    expect(parseGame(JSON.stringify(START),START).relMara).toBe(0);
  });
  it("rotates personality-specific complaint lines", () => {
    expect(residentBark("ivy",START,"skating",1)).not.toBe(residentBark("ivy",START,"skating",0));
  });
});

describe("physical street actions",()=>{
  it("charges newspaper costs once per day across saves",()=>{
    const first=runAction({...START,money:10,hour:12},streetAction("newspaper"));
    if(!first.ok)throw Error(first.message);
    expect(first.next.money).toBe(8);expect(first.next.hour).toBe(12.25);expect(first.next.int).toBe(6);
    const loaded=parseGame(JSON.stringify(first.next),START);
    expect(runAction(loaded,streetAction("newspaper")).ok).toBe(false);
    expect(runAction({...loaded,day:2},streetAction("newspaper")).ok).toBe(true);
  });
  it("rejects purchases with no money or insufficient remaining time",()=>{
    expect(runAction({...START,money:0},streetAction("newspaper")).ok).toBe(false);
    expect(runAction({...START,hour:24},streetAction("newspaper")).ok).toBe(false);
  });
  it("charges a little energy for kicking litter without cash, karma or stat farming",()=>{
    const result=runAction(START,streetAction("litter"));
    if(!result.ok)throw Error(result.message);
    expect(result.next).toEqual({...START,energy:99});
    expect(runAction({...START,energy:0},streetAction("litter")).ok).toBe(false);
  });
});
