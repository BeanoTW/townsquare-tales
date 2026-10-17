import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {UNDERWORLD_BEATS,activeUnderworldBeat} from "@/lib/gang-career";
describe("underworld encounter pipeline",()=>{
 it("has unique and scene-specific beat ids",()=>{expect(Object.keys(UNDERWORLD_BEATS)).toHaveLength(6);for(const [id,beat] of Object.entries(UNDERWORLD_BEATS)){expect(beat.id).toBe(id);expect(beat.venue).toBeTruthy();expect(beat.speaker).toBeTruthy();expect(beat.choices.length).toBeGreaterThan(0);}});
 it("maps existing save flags without changing them",()=>{
  expect(activeUnderworldBeat({...START,gangTask:1})?.venue).toBe("alley");
  expect(activeUnderworldBeat({...START,gangTask:3})?.venue).toBe("bank");
  expect(activeUnderworldBeat({...START,gangTask:5})?.venue).toBe("bar");
  expect(activeUnderworldBeat({...START,gangParcel:1})?.venue).toBe("pawn");
  expect(activeUnderworldBeat({...START,pawnIntroduction:1,pawnMet:0})?.id).toBe("pawn-contact");
  expect(activeUnderworldBeat({...START,gangTask:0,gangParcel:0,pawnIntroduction:0})).toBeNull();
 });
});
