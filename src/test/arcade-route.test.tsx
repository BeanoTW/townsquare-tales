import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Route } from "@/routes/index";
import { START } from "@/lib/game-data";

const mapProps: { paused?: boolean; onStreet?: (id: string) => boolean } = {};
vi.mock("@/components/TownMap", () => ({
  TownMap: (p: { onEnter: (id: string) => void; onStreet: (id: string) => boolean; paused: boolean }) => {
    mapProps.paused = p.paused;
    mapProps.onStreet = p.onStreet;
    return (
      <div data-testid="town">
        <button onClick={() => p.onEnter("bar")}>Enter pub</button>
        <button onClick={() => p.onStreet("hoop")}>Tap hoop</button>
        <button onClick={() => p.onStreet("ramp")}>Tap rail</button>
      </div>
    );
  },
}));

const save = (over: object = {}) => localStorage.setItem("sticktown", JSON.stringify({ ...START, money: 200, energy: 90, hour: 10, ...over }));
beforeEach(() => {
  localStorage.clear();
  for (const g of ["basketball", "rail", "darts"]) localStorage.setItem(`tst-minigame-help-${g}`, "1");
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});
const open = () => {
  const Game = Route.options.component!;
  render(<Game />);
};

describe("arcade minigames in the town", () => {
  it("the park hoop opens basketball over the town and leaving returns to the same town", () => {
    save();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tap hoop" }));
    expect(screen.getByRole("heading", { name: "Basketball" })).toBeInTheDocument();
    expect(mapProps.paused).toBe(true); // the map freezes, so the player stays exactly where they were
    expect(screen.getByTestId("town")).toBeInTheDocument();
    for (const label of ["Player", "Inventory", "Journal", "Settings"]) expect(screen.getByRole("button", { name: label })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(screen.queryByRole("heading", { name: "Basketball" })).toBeNull();
    expect(mapProps.paused).toBe(false);
  });

  it("does not open the court when too tired, and costs nothing", () => {
    save({ energy: 0 });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tap hoop" }));
    expect(screen.queryByRole("heading", { name: "Basketball" })).toBeNull();
    expect(JSON.parse(localStorage.getItem("sticktown")!).energy).toBe(0);
  });

  it("the ramp shows the skateboard requirement without one, and the rail game with one", () => {
    save();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tap rail" }));
    expect(screen.getByTestId("board-required")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "OK" }));
    expect(screen.queryByTestId("board-required")).toBeNull();
    cleanup();
    save({ skateboard: 1, skateboardEquipped: 1 });
    open();
    fireEvent.click(screen.getByRole("button", { name: "Tap rail" }));
    expect(screen.getByRole("heading", { name: "Rail grind" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Leave" }));
    expect(screen.queryByRole("heading", { name: "Rail grind" })).toBeNull();
  });

  it("the pub dartboard opens darts and Escape leaves the game without leaving the pub", async () => {
    save();
    open();
    fireEvent.click(screen.getByRole("button", { name: "Enter pub" }));
    vi.useFakeTimers({ toFake: ["requestAnimationFrame", "cancelAnimationFrame", "performance"] });
    fireEvent.click(await screen.findByRole("button", { name: /^Dartboard/ }));
    for (let i = 0; i < 400; i++) act(() => void vi.advanceTimersByTime(50));
    vi.useRealTimers();
    expect(screen.getByRole("heading", { name: "Darts" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("heading", { name: "Darts" })).toBeNull();
    expect(screen.getByRole("heading", { name: /Tipsy Stick/i })).toBeInTheDocument();
  });
});
