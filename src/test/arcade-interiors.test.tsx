import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationScene } from "@/components/LocationScene";
import { bankTransferAction, runAction } from "@/lib/actions";
import { START } from "@/lib/game-data";
import { SHOP_GOODS, shopAvailability } from "@/lib/shop-catalog";
import { roomFor } from "@/lib/rooms";

afterEach(() => cleanup());
const shop = () => roomFor("shop", START);

describe("arcade shop", () => {
  it("shows all six goods on a selectable product wheel with a clerk", () => {
    render(<LocationScene room={shop()} state={START} feedback={null} onRun={vi.fn()} onLeave={vi.fn()} />);
    expect(screen.getByText("The shopkeeper")).toBeInTheDocument();
    expect(screen.getByLabelText("Product wheel")).toBeInTheDocument();
    for (const good of SHOP_GOODS) expect(screen.getByRole("button", { name: `Select ${good.name}` })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "BUY · $10" })).toBeEnabled();
  });

  it("keeps consumables purchasable in one session without closing the wheel", () => {
    const onRun = vi.fn();
    render(<LocationScene room={shop()} state={START} feedback={null} onRun={onRun} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "BUY · $10" }));
    fireEvent.click(screen.getByRole("button", { name: "BUY · $10" }));
    expect(onRun).toHaveBeenCalledTimes(2);
    expect(onRun.mock.calls[0]![0].id).toBe("snack");
    expect(screen.getByLabelText("Product wheel")).toBeInTheDocument();
  });

  it("rotates to an equipment item and prevents unaffordable purchases", () => {
    render(<LocationScene room={shop()} state={START} feedback={null} onRun={vi.fn()} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "Select Running shoes" }));
    expect(screen.getByText("Running shoes", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Need $130 more" })).toBeDisabled();
  });

  it("keeps retail careers accessible without littering the shop with hotspots", () => {
    render(<LocationScene room={shop()} state={START} feedback={null} onRun={vi.fn()} onLeave={vi.fn()} />);
    fireEvent.click(screen.getByRole("tab", { name: /Work here/ }));
    const jobs = screen.getByRole("tabpanel", { name: "Retail careers" });
    expect(within(jobs).getByText("Shop jobs board")).toBeInTheDocument();
    expect(within(jobs).getByRole("button", { name: /Apply: Shop Assistant/ })).toBeInTheDocument();
  });
});

describe("shop action rules", () => {
  it("allows repeatable inventory purchases and preserves the existing save fields", () => {
    const snack = SHOP_GOODS[0]!;
    const first = runAction(START, snack.action(START));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    const second = runAction(first.next, snack.action(first.next));
    expect(second.ok).toBe(true);
    if (!second.ok) return;
    expect(second.next.money).toBe(0);
    expect(second.next.snacks).toBe(2);
    expect(second.next.day).toBe(START.day);
    expect(shopAvailability(snack, second.next)).toBe("Need $10 more");
  });

  it("adds energy immediately from repeatable drinks without new save properties", () => {
    const pop = SHOP_GOODS.find((good) => good.id === "pop")!;
    const state = { ...START, energy: 50 };
    const outcome = runAction(state, pop.action(state));
    expect(outcome.ok).toBe(true);
    if (!outcome.ok) return;
    expect(outcome.next.money).toBe(12);
    expect(outcome.next.energy).toBe(68);
    expect(Object.keys(outcome.next)).toEqual(Object.keys(state));
  });

  it("locks equipment after purchase", () => {
    const shoes = SHOP_GOODS.find((good) => good.id === "trainers")!;
    const first = runAction({ ...START, money: 160 }, shoes.action(START));
    expect(first.ok).toBe(true);
    if (first.ok) {
      expect(first.next.trainers).toBe(1);
      expect(shoes.available(first.next)).toBe(false);
      expect(shopAvailability(shoes, first.next)).toBe("Already owned");
    }
  });
});

describe("bank transfer rules", () => {
  it("transfers exact amounts in both directions without time or state-schema changes", () => {
    const state = { ...START, money: 200, bank: 30 };
    const deposit = runAction(state, bankTransferAction("deposit", 75));
    expect(deposit.ok).toBe(true);
    if (!deposit.ok) return;
    expect(deposit.next).toMatchObject({ money: 125, bank: 105, hour: state.hour });
    const withdrawal = runAction(deposit.next, bankTransferAction("withdraw", 100));
    expect(withdrawal.ok).toBe(true);
    if (withdrawal.ok) expect(withdrawal.next).toMatchObject({ money: 225, bank: 5, day: state.day });
    expect(runAction(state, bankTransferAction("withdraw", 50)).ok).toBe(false);
    expect(runAction(state, bankTransferAction("deposit", 0)).ok).toBe(false);
  });
});

describe("service encounters", () => {
  it("supports teller transfers with chosen amounts and quick presets", () => {
    const state = { ...START, money: 120, bank: 80 };
    const onRun = vi.fn();
    render(<LocationScene room={roomFor("bank", state)} state={state} feedback={null} onRun={onRun} onLeave={vi.fn()} />);
    expect(screen.getByText("$120")).toBeInTheDocument();
    expect(screen.getByText("$80")).toBeInTheDocument();
    const amount = screen.getByRole("spinbutton", { name: "Amount ($)" });
    fireEvent.change(amount, { target: { value: "75" } });
    fireEvent.click(screen.getByRole("button", { name: /Deposit \$75/ }));
    expect(onRun.mock.calls[0]![0].id).toBe("bank-deposit-75");
    fireEvent.click(screen.getByRole("button", { name: "All savings" }));
    expect(amount).toHaveValue(80);
    expect(screen.getByRole("button", { name: /Withdraw \$80/ })).toBeEnabled();
  });

  it("shows education gains as an arcade-style result splash", () => {
    render(<LocationScene room={roomFor("school", START)} state={START} feedback={{ message: "+1 intelligence", success: true, changes: ["Intelligence: +1"] }} onRun={vi.fn()} onLeave={vi.fn()} />);
    expect(screen.getByText(/INTELLIGENCE INCREASED!/)).toBeInTheDocument();
  });

  it("keeps the Leave control available", () => {
    const onLeave = vi.fn();
    render(<LocationScene room={shop()} state={START} feedback={null} onRun={vi.fn()} onLeave={onLeave} />);
    fireEvent.click(screen.getByRole("button", { name: "Leave building" }));
    expect(onLeave).toHaveBeenCalledOnce();
  });
});
