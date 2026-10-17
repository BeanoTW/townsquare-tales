import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {BUY_STIMULANT,runAction} from "@/lib/actions";
import {buyMoonDust,canVisitFamilyOnTrip,hometownUnlocked,hometownSupplyRun,notifyFamilyOfVisit} from "@/lib/hometown";
import {mailFor} from "@/lib/town-mail";
import {SHOP_GOODS} from "@/lib/shop-catalog";
const ready={...START,underworldStoryMask:31,day:40,gangStage:2,gangRep:15,criminalTrust:30,money:2000};
describe("Bomb and Minnie hometown supply chapter",()=>{
 it("unlocks only after five completed stories, without spoiling early missions",()=>{expect(hometownUnlocked(ready)).toBe(true);expect(hometownUnlocked({...ready,underworldStoryMask:15})).toBe(false);});
 it("moves Moon Dust from ordinary shop to the crew",()=>{expect(SHOP_GOODS.some(g=>g.id==="mystery-powder")).toBe(false);expect(buyMoonDust.resolve({...ready,gangStage:0},()=>.5)).toBeTypeOf("string");expect(buyMoonDust.resolve(ready,()=>.5)).not.toBeTypeOf("string");});
 it("requires both existing family correspondence and advance notice",()=>{const replied={...ready,familyReplyMask:1,familyFirstReplyDay:8};expect(canVisitFamilyOnTrip(notifyFamilyOfVisit(replied))).toBe(false);expect(canVisitFamilyOnTrip({...notifyFamilyOfVisit(replied),day:41})).toBe(true);expect(canVisitFamilyOnTrip({...ready,hometownNoticeDay:39})).toBe(false);});
 it("creates Sarah's upset letter after surprise visit, no double reward",()=>{const gone=runAction(ready,hometownSupplyRun);expect(gone.ok).toBe(true);if(!gone.ok)return;expect(gone.next.hometownTripResult).toBe(2);expect(mailFor({...gone.next,day:41}).some(l=>l.id===15)).toBe(true);expect(runAction(gone.next,hometownSupplyRun).ok).toBe(false);});
 it("creates Mum's warm letter for an arranged family visit",()=>{const notified={...ready,day:41,hometownNoticeDay:39,familyReplyMask:1,familyFirstReplyDay:8};const gone=runAction(notified,hometownSupplyRun);expect(gone.ok).toBe(true);if(!gone.ok)return;expect(gone.next.hometownTripResult).toBe(1);expect(mailFor({...gone.next,day:42}).some(l=>l.id===16)).toBe(true);});
});
