import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {townHallBuilt} from "@/lib/civic-career";
import {buildings} from "@/lib/town-world";
import {mailFor,markRead,hasRead} from "@/lib/town-mail";
import {roomFor} from "@/lib/rooms";
import {parseGame} from "@/lib/game-state";

describe("Town Hall relocation notice",()=>{
 it("relocates on day 30 without car or licence",()=>{
  const before={...START,day:29,drivingLicence:0,companyCar:0};
  const after={...before,day:30};
  expect(townHallBuilt(before)).toBe(false);
  expect(townHallBuilt(after)).toBe(true);
  const yard=buildings(after.house,false,townHallBuilt(after)).find(b=>b.id==="yard")!;
  expect(yard.x).toBeGreaterThan(29);
 });
 it("keeps day-30 notification available on older saves",()=>{
  for(const day of [30,45,120]){
    const letters=mailFor({...START,day});
    const note=letters.find(l=>l.id===12)!;
    expect(note.day).toBe(30);
    expect(note.body).toContain("east of the police station");
  }
  expect(mailFor({...START,day:29}).some(l=>l.id===12)).toBe(false);
 });
 it("keeps the new letter read after a save roundtrip",()=>{
  const s=markRead({...START,day:40},12);
  expect(hasRead(s,12)).toBe(true);
  expect(hasRead(parseGame(JSON.stringify(s),START),12)).toBe(true);
 });
 it("explains the move through the foreman",()=>{
  const yard=roomFor("yard");
  const f=yard.hotspots.find(h=>h.id==="foreman")!;
  expect(f.lines?.({...START,day:31}).join(" ")).toContain("east of Town Police");
 });
});