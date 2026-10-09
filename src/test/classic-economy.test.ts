import { describe, expect, it } from "vitest";
import { parseGame, type GameState } from "@/lib/game-state";
const fallback: GameState = {day:1,hour:8,energy:100,money:20,str:5,int:5,cha:5,karma:0,house:0,school:0,job:0,heat:0,bank:0,snacks:0,trainers:0,alarm:0};
describe("classic economy persistence", () => {
  it("migrates old saves with no economy fields", () => {
    const old = JSON.stringify({day:7,money:500,house:1});
    expect(parseGame(old,fallback)).toMatchObject({day:7,money:500,house:1,bank:0,snacks:0,trainers:0,alarm:0});
  });
  it("preserves savings and owned items", () => {
    const s = parseGame(JSON.stringify({...fallback,bank:1000,snacks:3,trainers:1,alarm:1}),fallback);
    expect(s).toMatchObject({bank:1000,snacks:3,trainers:1,alarm:1});
  });
  it("clamps invalid item quantities and savings", () => {
    expect(parseGame(JSON.stringify({...fallback,bank:-100,snacks:999,trainers:8,alarm:-2}),fallback))
      .toMatchObject({bank:0,snacks:99,trainers:1,alarm:0});
  });
});
