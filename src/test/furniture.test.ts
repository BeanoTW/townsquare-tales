import { describe, expect, it } from "vitest";
import { FURNITURE, ownsFurniture, furnitureBonus } from "@/lib/furniture";
import { parseGame, type GameState } from "@/lib/game-state";
const old: GameState = {day:1,hour:8,energy:100,money:20,str:5,int:5,cha:5,karma:0,house:0,school:0,job:0,heat:0,bank:0,snacks:0,trainers:0,alarm:0,furniture:0};
describe("furnishings", () => {
  it("migrates an older save with no furniture", () => expect(parseGame(JSON.stringify({day:5,money:250}),old)).toMatchObject({day:5,money:250,furniture:0}));
  it("persists and clamps ownership bitmask", () => {
    expect(parseGame(JSON.stringify({...old,furniture:31}),old).furniture).toBe(31);
    expect(parseGame(JSON.stringify({...old,furniture:999}),old).furniture).toBe(31);
  });
  it("keeps all upgrades independently owned", () => {
    const mask=FURNITURE.reduce((sum,item)=>sum|item.bit,0);
    expect(mask).toBe(31);
    for (const item of FURNITURE) expect(ownsFurniture(mask,item.id)).toBe(true);
  });
  it("only a purchased bed improves sleeping recovery", () => {
    expect(furnitureBonus(0,"sleep")).toBe(0);
    expect(furnitureBonus(2|4|8|16,"sleep")).toBe(0);
    expect(furnitureBonus(1,"sleep")).toBe(25);
  });
});
