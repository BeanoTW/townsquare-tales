import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render } from "@testing-library/react";
import { START } from "@/lib/game-data";
import { Route } from "@/routes/index";
vi.mock("@/components/TownMap", () => ({
  TownMap: ({ onEnter }: { onEnter: (id: string) => void }) => (
    <button onClick={() => onEnter("gang")}>Approach crew</button>
  ),
}));
vi.mock("@/lib/action-audio", () => ({ playActionCue: vi.fn() }));
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
const Game = Route.options.component!;
describe("crew equipment UI", () => {
  it("shows locked supply to beginners without charging or granting weapons", () => {
    window.localStorage.setItem("sticktown", JSON.stringify({ ...START, str: 20 }));
    const view = render(<Game />);
    fireEvent.click(view.getByRole("button", { name: "Approach crew" }));
    expect(view.queryByRole("button", { name: /Arrange a heavy bat/ })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem("sticktown")!).weapon).toBeUndefined();
  });
  it("shows locked supply before the crew has enough trust", () => {
    window.localStorage.setItem(
      "sticktown",
      JSON.stringify({ ...START, karma: -20, gangStage: 1, gangRep: 1 }),
    );
    const view = render(<Game />);
    fireEvent.click(view.getByRole("button", { name: "Approach crew" }));
    const button = view.getByRole("button", { name: /Arrange a heavy bat/ });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(JSON.parse(window.localStorage.getItem("sticktown")!).weapon).toBeUndefined();
  });
  it("buys late equipment from the crew and persists it via the game action handler", () => {
    window.localStorage.setItem(
      "sticktown",
      JSON.stringify({
        ...START,
        day: 7,
        str: 25,
        karma: -20,
        gangStage: 2,
        gangRep: 12,
        money: 1500,
      }),
    );
    const view = render(<Game />);
    fireEvent.click(view.getByRole("button", { name: "Approach crew" }));
    fireEvent.click(view.getByRole("button", { name: /Arrange a heavy bat/ }));
    expect(JSON.parse(window.localStorage.getItem("sticktown")!)).toMatchObject({
      weapon: 2,
      money: 600,
      energy: 80,
      hour: 11,
      heat: 3,
    });
    expect(view.getByRole("status")).toHaveTextContent("Heavy bat acquired");
  });
});
