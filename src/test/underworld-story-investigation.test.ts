import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {storyObjective,investigateStory,finishStory,STORY_DESTINATIONS} from "@/lib/underworld-stories";
describe("in-world underworld investigations",()=>{
 it("has unique venues for five authored incidents",()=>expect(new Set(Object.values(STORY_DESTINATIONS).map(x=>x.venue)).size).toBe(5));
 it("requires an investigation before payout",()=>{
  const state={...START,underworldStoryActive:1,underworldStoryStage:0};
  expect(storyObjective(state)?.venue).toBe("pawn");
  expect(finishStory(1,"steady").resolve(state,()=>0.5)).toMatch(/something you need to look into/i);
  const investigated=investigateStory(1).resolve(state,()=>0.5);
  expect(typeof investigated).not.toBe("string");
  if(typeof investigated==="string")return;
  const next={...state,...investigated.patch};
  expect(next.underworldStoryStage).toBe(1);
  expect(storyObjective(next)).toBeNull();
  const finished=finishStory(1,"steady").resolve(next,()=>0.5);
  expect(typeof finished).not.toBe("string");
  if(typeof finished==="string")expect.fail(finished);
  else expect(finished.patch.underworldStoryStage).toBe(0);
 });
 it("does not complete the wrong assignment",()=>expect(investigateStory(4).resolve({...START,underworldStoryActive:1},()=>0.5)).toBeTypeOf("string"));
});
