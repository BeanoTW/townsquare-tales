import {describe,it,expect} from "vitest";
import {CRIME_VISUAL_CUES,visualCueForAction} from "@/lib/crime-visual-cues";
describe("crime visual cues for future animated scenes",()=>{
 it("covers all five authored investigations",()=>{for(let id=1;id<=5;id++){const cue=visualCueForAction("underworld-investigate-"+id);expect(cue?.cast.length).toBeGreaterThan(1);expect(cue?.venue).toBeTruthy();}});
 it("maps the live lookout and parcel encounter action IDs",()=>{expect(visualCueForAction("gang-encounter-3-quiet")?.kind).toBe("lookout");expect(visualCueForAction("gang-parcel-handoff")?.kind).toBe("delivery");});
 it("keeps the visual metadata pure and not linked to gameplay state",()=>{for(const cue of Object.values(CRIME_VISUAL_CUES))expect(Object.keys(cue)).not.toContain("patch");});
 it("does not invent a scene for ordinary unrelated actions",()=>expect(visualCueForAction("sleep")).toBeNull());
});