import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {CREW_MEMBERS,crewConversation} from "@/lib/gang-career";
describe("crew characters",()=>{
 it("three distinct named speakers",()=>expect(new Set(CREW_MEMBERS.map(m=>m.name)).size).toBe(3));
 it("reacts to current objective without exposing stats",()=>{const s={...START,gangTask:4};expect(crewConversation(s,"mick")).toContain("Anything worth knowing");expect(crewConversation(s,"lez")).toContain("bank");});
 it("recognises parcel without completing it",()=>expect(crewConversation({...START,gangParcel:1},"nia")).toContain("No money"));
 it("responds to rising heat",()=>expect(crewConversation({...START,heat:25},"lez")).toContain("asking questions"));
});
