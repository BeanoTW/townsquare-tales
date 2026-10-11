import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";
import { START } from "@/lib/game-data";

vi.mock("@/components/TownMap", () => ({
  TownMap: ({ onEnter }: { onEnter: (id: string) => void }) => (
    <button onClick={() => onEnter("casino")}>Enter Lucky Sevens</button>
  ),
}));

beforeEach(() => {
  localStorage.clear();
  localStorage.setItem("sticktown", JSON.stringify({ ...START, money: 1000 }));
  localStorage.setItem("tst-blackjack-rules-seen", "1");
  localStorage.setItem("tst-slots-rules-seen", "1");
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

function enter() {
  const Game = Route.options.component!;
  render(<Game />);
  fireEvent.click(screen.getByRole("button", { name: "Enter Lucky Sevens" }));
}

describe("casino route integration", () => {
  it.each([
    ["Blackjack table", "Blackjack"],
    ["Slot machine", "Lucky Sevens Slots"],
  ])("launches %s and preserves the room when leaving", (object, title) => {
    enter();
    fireEvent.click(screen.getByRole("button", { name: new RegExp(`^${object}\\.`) }));
    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
    for (const label of ["Player", "Inventory", "Journal", "Settings"])
      expect(screen.getByRole("button", { name: label })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Leave table" }));
    expect(screen.queryByRole("heading", { name: title })).toBeNull();
    expect(screen.getByRole("heading", { name: "Lucky Sevens" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inventory" })).toBeEnabled();
  });

  it("Escape leaves the game without also leaving Lucky Sevens", () => {
    enter();
    fireEvent.click(screen.getByRole("button", { name: /^Slot machine\./ }));
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByRole("heading", { name: "Lucky Sevens" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Lucky Sevens Slots" })).toBeNull();
  });
});
