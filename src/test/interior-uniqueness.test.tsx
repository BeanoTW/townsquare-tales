import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationScene } from "@/components/LocationScene";
import { RoomArt } from "@/components/rooms/RoomArt";
import { START } from "@/lib/game-data";
import { PLACE_IDS, roomFor, visibleHotspots } from "@/lib/rooms";

afterEach(() => cleanup());

const show = (id: (typeof PLACE_IDS)[number], state = START) =>
  render(<LocationScene room={roomFor(id, state)} state={state} feedback={null} onRun={vi.fn()} onLeave={vi.fn()} />);

describe("mobile arcade interiors", () => {
  it("puts the shop purchase button before the wheel rather than below the fold", () => {
    const view = show("shop");
    const buy = screen.getByRole("button", { name: "BUY · $10" });
    const wheel = screen.getByLabelText("Product wheel");
    expect(buy).toBeInTheDocument();
    expect(Boolean(buy.compareDocumentPosition(wheel) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
    expect(view.container.querySelector(".arcade-purchase-dock")).toContainElement(buy);
  });

  it("defaults to an actual diner food menu, hiding work shifts and promotions from non-staff", () => {
    show("diner");
    const menu = screen.getByRole("tabpanel", { name: "Food menu" });
    expect(within(menu).getAllByRole("button", { name: /^Buy \$/ })).toHaveLength(3);
    fireEvent.click(screen.getByRole("tab", { name: /Jobs/ }));
    expect(screen.getByRole("button", { name: /Apply: Kitchen Porter/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Work 4h shift/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Request promotion/ })).not.toBeInTheDocument();
  });

  it("shows staff actions only after joining hospitality", () => {
    show("diner", { ...START, career: 1 });
    fireEvent.click(screen.getByRole("tab", { name: /Staff room/ }));
    expect(screen.getByRole("button", { name: /Work 4h shift/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Request promotion/ })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Apply: Kitchen Porter/ })).not.toBeInTheDocument();
  });

  it("shows twelve different stage settings with venue-specific art", () => {
    const places = ["shop", "diner", "bank", "school", "work", "yard", "bar", "pawn", "clinic", "depot", "police", "furniture"] as const;
    for (const id of places) {
      const view = show(id);
      expect(view.container.querySelector(`.arcade-set-${id} .venue-world`)).toBeInTheDocument();
      expect(view.container.querySelector(`.arcade-room-${id}`)).toBeInTheDocument();
      view.unmount();
    }
  });
});

describe("depth and housing progression", () => {
  const draw = (id: "home" | "casino", state = START) => {
    const room = roomFor(id, state);
    return render(<RoomArt room={room} state={state} visible={visibleHotspots(room, state)} selectedId={null} onSelect={vi.fn()} />);
  };

  it("draws an actual cardboard sleeping mat, not a labelled placeholder bed", () => {
    const view = draw("home");
    expect(view.container.querySelector('[data-scene-depth="home-0"]')).toBeInTheDocument();
    expect(view.container.querySelector("[data-makeshift-sleep]")).toBeInTheDocument();
    expect(screen.queryByText("BED")).not.toBeInTheDocument();
  });

  it("changes the perspective home as the player upgrades housing", () => {
    const view = draw("home", { ...START, house: 3 });
    expect(view.container.querySelector('[data-scene-depth="home-3"]')).toBeInTheDocument();
    expect(view.container.querySelector("[data-makeshift-sleep]")).not.toBeInTheDocument();
  });

  it("builds the casino as a perspective room with solid slot-machine and dice-table geometry", () => {
    const view = draw("casino");
    expect(view.container.querySelector('[data-scene-depth="casino"]')).toBeInTheDocument();
    expect(view.container.querySelector("[data-slot-machine]")).toBeInTheDocument();
    expect(view.container.querySelector("[data-dice-table]")).toBeInTheDocument();
  });
});
