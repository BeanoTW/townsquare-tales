import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { START } from "@/lib/game-data";
import { parseGame, saveGame, loadGame } from "@/lib/game-state";
import { runAction } from "@/lib/actions";
import { runGodAction } from "@/lib/god-mode";
import { buyWeapon, weaponBlock, robTill, robberyChance } from "@/lib/counter-robbery";
import { CounterRobberyChoice } from "@/components/rooms/CounterRobberyChoice";

const late = { ...START, day: 7, karma: -20, gangStage: 2, gangRep: 12, str: 25, money: 1500 };
const armed = { ...late, weapon: 2 };
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
describe("crew equipment and counter robberies", () => {
  it("denies starting players regardless of money, stats or god mode", () => {
    const s = { ...START, money: 1e9, str: 9999 };
    for (const tier of [1, 2] as const) {
      expect(runAction(s, buyWeapon(tier)).ok).toBe(false);
      expect(runGodAction(s, buyWeapon(tier)).ok).toBe(false);
    }
    expect(runGodAction(s, robTill("shop")).ok).toBe(false);
  });
  it.each([
    { day: 6 },
    { gangStage: 1 },
    { gangRep: 11 },
    { karma: -9 },
    { str: 24 },
    { money: 899 },
  ])("requires every late-game supply condition: %j", (patch) => {
    expect(weaponBlock({ ...late, ...patch }, 2)).not.toBeNull();
    expect(runAction({ ...late, ...patch }, buyWeapon(2)).ok).toBe(false);
  });
  it("purchases equipment through the existing cash, time, energy and heat rules", () => {
    const r = runAction(late, buyWeapon(2));
    expect(r.ok).toBe(true);
    if (!r.ok) throw Error(r.message);
    expect(r.next).toMatchObject({ weapon: 2, money: 600, hour: 11, energy: 80, heat: 3 });
    expect(runAction(r.next, buyWeapon(2)).ok).toBe(false);
    expect(runAction(r.next, buyWeapon(1)).ok).toBe(false);
  });
  it("allows the weaker item later but never treats it as robbery capable", () => {
    const r = runAction({ ...late, day: 4, gangStage: 1, gangRep: 4 }, buyWeapon(1));
    if (!r.ok) throw Error(r.message);
    expect(r.next).toMatchObject({ weapon: 1, money: 1320, energy: 92, hour: 9, heat: 1 });
    const rng = vi.fn(() => 0);
    expect(runAction(r.next, robTill("shop"), rng).ok).toBe(false);
    expect(rng).not.toHaveBeenCalled();
  });
  it("saves equipment and the global daily attempt guard without breaking old saves", () => {
    expect(parseGame(JSON.stringify(START), START).weapon).toBeUndefined();
    const r = runAction(armed, robTill("shop"), () => 0);
    if (!r.ok) throw Error(r.message);
    saveGame(r.next);
    const loaded = loadGame(START);
    expect(loaded).toMatchObject({ weapon: 2, tillRobberyDay: 7, money: 1545 });
    for (const id of ["shop", "pawn", "furniture", "diner", "bar"] as const) {
      const rng = vi.fn(() => 0);
      expect(runAction(loaded, robTill(id), rng).ok).toBe(false);
      expect(runGodAction(loaded, robTill(id), rng).ok).toBe(false);
      expect(rng).not.toHaveBeenCalled();
    }
    expect(runAction({ ...loaded, day: 8, hour: 8 }, robTill("bar"), () => 0).ok).toBe(true);
  });
  it("charges consequences on failed attempts without taking bank savings or negative cash", () => {
    const r = runAction(
      { ...armed, money: 3, bank: 999, energy: 15, heat: 99 },
      robTill("bar"),
      () => 1,
    );
    if (!r.ok) throw Error(r.message);
    expect(r.next).toMatchObject({
      money: 0,
      bank: 999,
      energy: 0,
      heat: 100,
      karma: -26,
      tillRobberyDay: 7,
      hour: 8.5,
    });
  });
  it("rejects exhausted or late attempts before RNG and respects bounded chance", () => {
    const rng = vi.fn(() => 0);
    for (const patch of [{ energy: 14 }, { hour: 23.75 }])
      expect(runAction({ ...armed, ...patch }, robTill("shop"), rng).ok).toBe(false);
    expect(rng).not.toHaveBeenCalled();
    expect(robberyChance({ ...armed, str: 1e6, cha: 1e6, heat: 0 })).toBeLessThanOrEqual(0.8);
    expect(robberyChance({ ...armed, str: 0, cha: 0, heat: 100 })).toBe(0.1);
    expect(robberyChance({ ...armed, heat: 20 })).toBeLessThan(robberyChance(armed));
  });
  it("validates and clamps numeric save fields", () => {
    expect(
      parseGame(JSON.stringify({ ...START, weapon: 999, tillRobberyDay: -8 }), START),
    ).toMatchObject({ weapon: 2, tillRobberyDay: 0 });
    expect(parseGame(JSON.stringify({ ...START, weapon: "2" }), START).weapon).toBeUndefined();
  });
  it("requires deliberate confirmation; reviewing and cancelling never runs an action", () => {
    const onRun = vi.fn();
    const view = render(
      <CounterRobberyChoice state={armed} venue="shop" godMode={false} onRun={onRun} />,
    );
    fireEvent.click(screen.getByRole("button", { name: /Rob the till/ }));
    expect(onRun).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Back off" }));
    expect(onRun).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Rob the till/ }));
    fireEvent.click(screen.getByRole("button", { name: "Go through with it" }));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0]![0].id).toBe("rob-till-shop");
    view.rerender(
      <CounterRobberyChoice
        state={{ ...armed, tillRobberyDay: 7 }}
        venue="shop"
        godMode={false}
        onRun={onRun}
      />,
    );
    expect(screen.getByRole("button", { name: /Rob the till/ })).toBeDisabled();
  });
  it.each([undefined, 1])("explains missing or inadequate equipment (%s)", (weapon) => {
    render(
      <CounterRobberyChoice
        state={weapon === undefined ? late : { ...late, weapon }}
        venue="shop"
        godMode={false}
        onRun={vi.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /Rob the till/ })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Go through with it" })).not.toBeInTheDocument();
  });
});
