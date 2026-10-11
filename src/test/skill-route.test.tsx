import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";
import { START } from "@/lib/game-data";
import { DARTS_ACTION } from "@/lib/minigames";
import type { StreetObjectId } from "@/lib/street-life";
import type { ActionDef } from "@/lib/actions";

vi.mock("@/components/TownMap", () => ({
  TownMap: ({
    onEnter,
    onStreet,
  }: {
    onEnter: (id: string) => void;
    onStreet: (id: StreetObjectId) => void;
  }) => (
    <>
      <button onClick={() => onStreet("hoop")}>Park hoop</button>
      <button onClick={() => onStreet("ramp")}>Park skate spot</button>
      <button onClick={() => onEnter("bar")}>Enter pub</button>
    </>
  ),
}));
vi.mock("@/components/LocationScene", () => ({
  LocationScene: ({ onRun }: { onRun: (a: ActionDef) => void }) => (
    <button onClick={() => onRun(DARTS_ACTION)}>Play pub darts</button>
  ),
}));
beforeEach(() => {
  localStorage.clear();
  localStorage.setItem(
    "sticktown",
    JSON.stringify({ ...START, skateboard: 1, skateboardEquipped: 1 }),
  );
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
function openGame() {
  const Game = Route.options.component!;
  render(<Game />);
}

describe("skill game entry points", () => {
  it.each([
    ["Park hoop", "Park Basketball"],
    ["Park skate spot", "Rail Challenge"],
  ])("opens %s as a playable game instead of an automatic reward", (button, title) => {
    openGame();
    fireEvent.click(screen.getByRole("button", { name: button }));
    expect(screen.getByRole("dialog", { name: title })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Inventory" })).toBeDisabled();
    const saved = JSON.parse(localStorage.getItem("sticktown")!);
    expect(saved.energy).toBe(START.energy);
    expect(saved.hour).toBe(START.hour);
    expect(saved.str).toBe(START.str);
    fireEvent.click(screen.getByRole("button", { name: "← Leave game" }));
    expect(screen.getByRole("button", { name: "Inventory" })).toBeEnabled();
  });
  it("launches pub darts without charging twice and returns to the pub", () => {
    openGame();
    fireEvent.click(screen.getByRole("button", { name: "Enter pub" }));
    fireEvent.click(screen.getByRole("button", { name: "Play pub darts" }));
    expect(JSON.parse(localStorage.getItem("sticktown")!).hour).toBe(START.hour);
    fireEvent.click(screen.getByRole("button", { name: /^Start game/ }));
    expect(JSON.parse(localStorage.getItem("sticktown")!).hour).toBe(START.hour + 0.5);
    fireEvent.click(screen.getByRole("button", { name: "← Leave game" }));
    expect(screen.getByRole("button", { name: "Play pub darts" })).toBeInTheDocument();
  });
  it("refuses skateboarding without the board equipped", () => {
    localStorage.setItem("sticktown", JSON.stringify(START));
    openGame();
    fireEvent.click(screen.getByRole("button", { name: "Park skate spot" }));
    expect(screen.queryByRole("dialog", { name: "Rail Challenge" })).toBeNull();
    expect(screen.getByText(/Equip your skateboard first/)).toBeInTheDocument();
  });
});
