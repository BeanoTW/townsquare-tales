import {beforeEach,describe,expect,it} from "vitest";
import {START} from "@/lib/game-data";
import {saveSlot,readSlot,localSlots,backupSave,readEmergencyBackup,importSave} from "@/lib/save-vault";
describe("save vault: legacy autosave preservation",()=>{
 beforeEach(()=>localStorage.clear());
 it("writes a manual slot without replacing the current autosave",()=>{
   localStorage.setItem("sticktown",JSON.stringify({...START,day:31,money:2918}));
   expect(saveSlot(1,{...START,day:31,money:2918})).toBe(true);
   expect(localSlots()).toEqual([{slot:1,day:31}]);
   expect(readSlot(1,START)).toMatchObject({day:31,money:2918});
   expect(JSON.parse(localStorage.getItem("sticktown")!).day).toBe(31);
 });
 it("keeps three slots independent and refuses invalid slot numbers",()=>{
   expect(saveSlot(1,{...START,day:31})).toBe(true);
   expect(saveSlot(2,{...START,day:2})).toBe(true);
   expect(saveSlot(4,START)).toBe(false);
   expect(readSlot(1,START)?.day).toBe(31);
   expect(readSlot(2,START)?.day).toBe(2);
 });
 it("stores and restores a recovery snapshot",()=>{
   expect(backupSave({...START,day:31,money:2918})).toBe(true);
   expect(readEmergencyBackup(START)).toMatchObject({day:31,money:2918});
 });
 it("validates imports and rejects arbitrary JSON",()=>{
   expect(importSave('{"day":31}',START)).toBeNull();
   expect(importSave("not json",START)).toBeNull();
   const valid=JSON.stringify({game:"townsquare-tales",version:1,savedAt:"2026-10-17T00:00:00Z",state:{...START,day:31,money:2918}});
   expect(importSave(valid,START)).toMatchObject({day:31,money:2918});
 });
});
