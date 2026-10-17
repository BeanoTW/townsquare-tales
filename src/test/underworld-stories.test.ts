import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {UNDERWORLD_STORIES,storyAvailable,storyDialogue,activeStory,beginStory,finishStory} from "@/lib/underworld-stories";
describe("authored underworld story skeleton",()=>{
 const eligible={...START,day:40,gangStage:2,gangRep:25,criminalTrust:50,energy:100,money:0};
 it("contains five authored incidents without progression UI",()=>{expect(UNDERWORLD_STORIES).toHaveLength(5);expect(new Set(UNDERWORLD_STORIES.map(x=>x.id)).size).toBe(5);});
 it("uses character-specific stat lines without displaying numeric gates",()=>{
  const nia=UNDERWORLD_STORIES[0]!;
  expect(storyDialogue(nia,{...eligible,karma:30})).toContain("goody-two-shoes");
  expect(storyDialogue(nia,{...eligible,karma:-30})).toContain("trouble");
  expect(storyDialogue(nia,{...eligible,karma:-30})).not.toMatch(/requires|karma -30/i);
 });
 it("reveals incidents only through appropriate characters and hidden milestones",()=>{
  expect(storyAvailable(eligible,"nia")?.id).toBe(1);
  expect(storyAvailable(eligible,"mick")).toBeNull();
  expect(storyAvailable({...eligible,day:1},"nia")).toBeNull();
  expect(storyAvailable({...eligible,gangParcel:1},"nia")).toBeNull();
 });
 it("records completion and one choice, then never pays twice",()=>{
  const started=beginStory(1).resolve(eligible,()=>0.5);
  expect(typeof started).not.toBe("string");
  if(typeof started==="string")return;
  const active={...eligible,...started.patch};
  expect(activeStory(active)?.id).toBe(1);
  const done=finishStory(1,"clever").resolve(active,()=>0.5);
  expect(typeof done).not.toBe("string");
  if(typeof done==="string")return;
  const next={...active,...done.patch};
  expect(next.underworldStoryActive).toBe(0);
  expect(next.underworldStoryMask).toBe(1);
  expect(next.underworldStoryChoiceMask).toBe(2);
  expect(next.money).toBe(235);
  expect(finishStory(1,"clever").resolve(next,()=>0.5)).toMatch(/no longer available/i);
 });
 it("unlocks later scenes from earlier completion without affecting normal tasks",()=>{
  expect(storyAvailable({...eligible,underworldStoryMask:1},"lez")?.id).toBe(2);
  expect(storyAvailable({...eligible,underworldStoryMask:1,gangTask:3},"lez")).toBeNull();
 });
});
