import {describe,it,expect} from "vitest";
import {START} from "@/lib/game-data";
import {SHOP_GOODS,shopAvailability} from "@/lib/shop-catalog";
import {ROOMS} from "@/lib/rooms";
import {SHOP_LAYOUTS} from "@/lib/walkable-shops";
import {buyDesktopPcAction,hasHomeComputer,marketAction} from "@/lib/investing";
describe("shop storefront and computer purchasing",()=>{
 it("offers caffeine tablets and both home computers at one Buy counter",()=>{
   const goods=SHOP_GOODS.map(g=>g.id);
   expect(goods).toContain("caffeine-pill");expect(goods).toContain("laptop");expect(goods).toContain("desktop-pc");
   expect(ROOMS.shop.hotspots.some(h=>h.id==="shelves")).toBe(false);
   expect(ROOMS.shop.hotspots.find(h=>h.id==="checkout")?.label).toBe("Buy");
 });
 it("places checkout near the entry instead of behind the old browse interaction",()=>{
  expect(SHOP_LAYOUTS.shop.find(f=>f.id==="checkout")?.approach.y).toBe(10);
 });
 it("lets a desktop PC satisfy existing investing access without a laptop",()=>{
  const state={...START,house:2,money:5000};
  const bought=buyDesktopPcAction().resolve(state,()=>.5);
  expect(typeof bought).not.toBe("string");
  if(typeof bought==="string")return;
  const equipped={...state,...bought.patch,careerBest0:2};
  expect(hasHomeComputer(equipped)).toBe(true);
  expect(marketAction("buy",1).resolve(equipped,()=>.5)).not.toBeTypeOf("string");
 });
 it("gates computer and tablet purchases to existing constraints",()=>{
   const laptop=SHOP_GOODS.find(g=>g.id==="laptop")!;
   const tablet=SHOP_GOODS.find(g=>g.id==="caffeine-pill")!;
   expect(shopAvailability(laptop,{...START,money:10000})).toMatch(/studio flat/i);
   expect(shopAvailability(tablet,{...START,caffeinePills:20,money:10000})).toBe("Bag full");
 });
});
