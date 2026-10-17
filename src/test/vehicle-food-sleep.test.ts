import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {runAction,EAT_SNACK,BUY_SANDWICH,EAT_SANDWICH,BUY_STIMULANT,STAY_AWAKE,repayMedicalDebt} from "@/lib/actions";
import {mailFor} from "@/lib/town-mail";
import {SHOP_GOODS} from "@/lib/shop-catalog";
describe("vehicles, meals, and absurd sleep debt",()=>{
 it("charges time for eating while purchases can be carried",()=>{const s={...START,money:100,energy:10,snacks:1};expect(EAT_SNACK.hours).toBe(.25);const bought=runAction(s,BUY_SANDWICH);expect(bought.ok).toBe(true);if(!bought.ok)return;expect(bought.next.sandwiches).toBe(1);const eaten=runAction(bought.next,EAT_SANDWICH);expect(eaten.ok).toBe(true);if(eaten.ok)expect(eaten.next.hour).toBe(s.hour+.5);});
 it("removes instant drinks and keeps only portable food in the corner shop",()=>{const ids=SHOP_GOODS.map(x=>x.id);expect(ids).toContain("sandwich");expect(ids).not.toContain("coffee");expect(ids).not.toContain("pop");});
 it("two sleepless nights, then third causes hospital and a payable $10000 bill",()=>{let s={...START,money:15000,stimulantPacks:3};for(let i=0;i<3;i++){const next=runAction(s,STAY_AWAKE);expect(next.ok).toBe(true);if(!next.ok)return;s=next.next;}expect(s.medicalDebt).toBe(10000);expect(s.wakeStreak).toBe(0);const repaid=runAction(s,repayMedicalDebt(500));expect(repaid.ok).toBe(true);if(repaid.ok)expect(repaid.next.medicalDebt).toBe(9500);});
 it("the foreman sends a letter once the player owns a restored car",()=>{expect(mailFor({...START,companyCar:1,abandonedCar:1,wreckRepairs:3}).some(x=>x.id===13)).toBe(true);});
});
