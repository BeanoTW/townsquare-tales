import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {UNDERWORLD_SCRIPTS,investigationLine} from "@/lib/underworld-story-script";
import {investigateStory,finishStory} from "@/lib/underworld-stories";
describe("five authored criminal comedy missions",()=>{
 it("provides distinctive dialogue, investigations and philosophy for all five",()=>{
  expect(Object.keys(UNDERWORLD_SCRIPTS)).toHaveLength(5);
  for(let id=1;id<=5;id++){const s=UNDERWORLD_SCRIPTS[id];expect(s.intro.length).toBeGreaterThan(45);expect(s.philosophy).toBeTruthy();expect(s.clues).toHaveLength(3);expect(s.epilogue).toBeTruthy();}
 });
 it("investigations accept all three approaches, with fallback for insufficient skill",()=>{
  for(let id=1;id<=5;id++)for(const c of ["observe","ask","improvise"] as const){const line=investigationLine(id,c,START);expect(line?.clue).toBeGreaterThan(0);}
 });
 it("records chosen approach without paying until the final return",()=>{
  const initial={...START,underworldStoryActive:1,underworldStoryStage:0};
  const result=investigateStory(1,"improvise").resolve({...initial,cha:50},()=>0.5);
  expect(typeof result).not.toBe("string");if(typeof result==="string")return;
  expect(result.patch.underworldStoryClue).toBe(3);
  const returned={...initial,...result.patch,cha:50};
  const outcome=finishStory(1,"steady").resolve(returned,()=>0.5);
  expect(typeof outcome).not.toBe("string");if(typeof outcome==="string")return;
  expect(outcome.patch.underworldStoryClue).toBe(0);
  expect(outcome.patch.underworldStoryMask).toBe(1);
 });
});