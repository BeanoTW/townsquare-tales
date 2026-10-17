import {describe,it,expect} from "vitest";
import {crewConversationCue,storyLocationConversationCue,directedCrimeCue} from "@/lib/crime-cinematic-director";
describe("crime cinematic director contract",()=>{
 it("creates distinct three-person crew reaction cues",()=>{for(const member of ["mick","lez","nia"] as const){const cue=crewConversationCue(member);expect(cue.beats[0].speaker).toBe(member);expect(cue.returnShot).toBe("overhead");expect(cue.cast).toContain("player");}});
 it("has five mission venue shots",()=>{for(let id=1;id<=5;id++){const cue=storyLocationConversationCue(id);expect(cue?.beats.length).toBe(3);expect(cue?.venue).toBeTruthy();}});
 it("respects off, short and reduced-motion preferences",()=>{expect(directedCrimeCue("underworld-investigate-1","off")).toBeNull();expect(directedCrimeCue("underworld-investigate-1","short")?.durationSeconds).toBe(1.5);expect(directedCrimeCue("underworld-investigate-1","full",true)?.durationSeconds).toBe(0);});
 it("never advances story or changes player state",()=>{const result=directedCrimeCue("underworld-investigate-2","full");expect(result?.skippable).toBe(true);expect(Object.keys(result??{})).not.toContain("patch");});
});
