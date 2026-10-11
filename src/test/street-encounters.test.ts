import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";
import { runAction } from "@/lib/actions";
import { availableStreetEvent, streetEncounter } from "@/lib/street-encounters";
import { conversation } from "@/lib/living-town";

function example(id:string) {
  for(let day=2;day<80;day++) {
    const s={...START,day,hour:17};
    const event=availableStreetEvent(s);
    if(event?.id===id) return {s,event,enc:streetEncounter(event,s)};
  }
  throw Error(`Missing event ${id}`);
}
describe("contextual street encounters",()=>{
  it.each(["diner","bar","school","work","shop","wallet"])("offers %s with distinct choices and persisted completion",id=>{
    const {s,event,enc}=example(id);
    expect(enc.choices.length).toBe(2);
    const result=runAction(s,enc.choices[0]!);
    expect(result.ok).toBe(true);
    if(!result.ok)return;
    expect(result.next.streetEncounterDay).toBe(s.day);
    const loaded=parseGame(JSON.stringify(result.next),START);
    expect(availableStreetEvent(loaded)).toBeNull();
    expect(runAction(loaded,enc.choices[0]!).ok).toBe(false);
    expect(streetEncounter(event,s).title).toBe(event.title);
  });
  it("charges real time and energy and preserves unrelated progress",()=>{
    const {s,enc}=example("school");
    const action=enc.choices[0]!;
    const result=runAction({...s,energy:50,job:3,house:2},action);
    if(!result.ok)throw Error(result.message);
    expect(result.next.hour).toBe(18);
    expect(result.next.energy).toBe(44);
    expect(result.next.int).toBe(s.int+1);
    expect(result.next.relIvy).toBe(2);
    expect(result.next.job).toBe(3);expect(result.next.house).toBe(2);
  });
  it("does not complete an event when energy is insufficient",()=>{
    const {s,enc}=example("diner");
    expect(runAction({...s,energy:0},enc.choices[0]!).ok).toBe(false);
    expect(availableStreetEvent(s)?.id).toBe("diner");
  });
  it("rejects expired choices and full inventory without consuming the slot",()=>{
    const {s,enc}=example("diner");
    expect(runAction({...s,day:s.day+1},enc.choices[0]!).ok).toBe(false);
    expect(runAction({...s,snacks:99},enc.choices[1]!).ok).toBe(false);
  });
  it("gives Nox crew rates and bounds police heat and reputation",()=>{
    const {s,event}=example("shop");
    const crew={...s,gangRep:99,heat:99};
    expect(streetEncounter(event,crew).text).toContain("uniforms");
    const result=runAction(crew,streetEncounter(event,crew).choices[0]!);
    if(!result.ok)throw Error(result.message);
    expect(result.next.money).toBe(s.money+24);
    expect(result.next.heat).toBe(100); expect(result.next.gangRep).toBe(100);
    expect(result.next.energy).toBe(s.energy-8);
    expect(result.next.hour).toBe(s.hour+1);
  });
  it("has quiet days and old saves with no completion field remain valid",()=>{
    expect(availableStreetEvent({...START,day:3})).toBeNull();
    const {s}=example("wallet");
    expect(availableStreetEvent(parseGame(JSON.stringify(s),START))).toBeTruthy();
  });
  it("makes heat and crew connections affect named conversations",()=>{
    expect(conversation("ivy",{...START,heat:40}).text).not.toBe(conversation("ivy",START).text);
    expect(conversation("nox",{...START,gangRep:30}).text).toContain("Crew");
  });
});
