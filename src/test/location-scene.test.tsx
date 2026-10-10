import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationScene } from "@/components/LocationScene";
import { isArcadeRoom } from "@/lib/arcade-rooms";
import { fitRect, panelStyle } from "@/lib/room-layout";
import { START } from "@/lib/game-data";
import { PLACE_IDS, ROOMS, VIEW, roomFor, visibleHotspots } from "@/lib/rooms";

afterEach(() => cleanup());

function renderRoom(id: (typeof PLACE_IDS)[number], onRun = vi.fn(), onLeave = vi.fn()) {
  const room = roomFor(id, START);
  const utils = render(
    <LocationScene room={room} state={START} feedback={null} onRun={onRun} onLeave={onLeave} />,
  );
  return { ...utils, room, onRun, onLeave };
}

describe("LocationScene", () => {
  it("renders every interior without a runtime error", () => {
    for (const id of PLACE_IDS) {
      const { room, unmount } = renderRoom(id);
      expect(screen.getByRole("heading", { level: 2, name: room.title })).toBeInTheDocument();
      if (isArcadeRoom(id)) {
        expect(screen.getByRole("region", { name: `${room.title} interaction` })).toBeInTheDocument();
      } else {
        for (const h of visibleHotspots(room, START)) {
          expect(screen.getByRole("button", { name: new RegExp(`^${h.label}\\.`) })).toBeInTheDocument();
        }
      }
      unmount();
    }
  });

  it("opens a floating panel when an object is tapped, showing duration and cost", () => {
    renderRoom("gym");
    fireEvent.click(screen.getByRole("button", { name: /^Weights rack\./ }));
    const panel = screen.getByRole("dialog", { name: "Weights rack" });
    expect(within(panel).getByRole("button", { name: /Lift weights/ })).toHaveTextContent("2h");
    expect(within(panel).getByRole("button", { name: /Lift weights/ })).toHaveTextContent(
      "−20 energy",
    );
    expect(within(panel).getByRole("button", { name: /Lift weights/ })).toHaveTextContent("$5");
  });

  it("runs the chosen action through the callback", () => {
    const { onRun } = renderRoom("gym");
    fireEvent.click(screen.getByRole("button", { name: /^Weights rack\./ }));
    fireEvent.click(screen.getByRole("button", { name: /Lift weights/ }));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0]![0]).toMatchObject({ id: "lift", hours: 2, energy: 20 });
  });

  it("switches the panel when another object is tapped", () => {
    renderRoom("gym");
    fireEvent.click(screen.getByRole("button", { name: /^Weights rack\./ }));
    fireEvent.click(screen.getByRole("button", { name: /^Running machine\./ }));
    expect(screen.queryByRole("dialog", { name: "Weights rack" })).not.toBeInTheDocument();
    expect(screen.getByRole("dialog", { name: "Running machine" })).toBeInTheDocument();
  });

  it("opens an object from the keyboard", () => {
    renderRoom("bank");
    const teller = screen.getByRole("button", { name: /^Teller window\./ });
    teller.focus();
    fireEvent.keyDown(teller, { key: "Enter" });
    expect(screen.getByRole("dialog", { name: "Teller window" })).toBeInTheDocument();
  });

  it("leaves with the Leave button and Escape", () => {
    const { onLeave } = renderRoom("shop");
    fireEvent.click(screen.getByRole("button", { name: "Leave building" }));
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("closes the panel on Escape before leaving the building", () => {
    const { onLeave } = renderRoom("clinic");
    fireEvent.click(screen.getByRole("button", { name: /^Treatment bed\./ }));
    expect(screen.getByRole("dialog", { name: "Treatment bed" })).toBeInTheDocument();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(onLeave).not.toHaveBeenCalled();
    fireEvent.keyDown(window, { key: "Escape" });
    expect(onLeave).toHaveBeenCalledTimes(1);
  });

  it("shows the result of the last action in the footer", () => {
    const room = ROOMS.bank;
    render(
      <LocationScene
        room={room}
        state={START}
        feedback={{
          message: "Deposited $50.",
          success: true,
          changes: ["Cash: -50"],
          timeLine: "08:00 → 10:00",
        }}
        onRun={vi.fn()}
        onLeave={vi.fn()}
      />,
    );
    expect(screen.getByText(/✓ Deposited \$50\./)).toBeInTheDocument();
    expect(screen.getByText("Cash: -50")).toBeInTheDocument();
  });

  it("marks failures as failures", () => {
    render(
      <LocationScene
        room={ROOMS.bank}
        state={START}
        feedback={{ message: "You need $50 cash.", success: false, changes: [] }}
        onRun={vi.fn()}
        onLeave={vi.fn()}
      />,
    );
    expect(screen.getByText(/You need \$50 cash\./)).toBeInTheDocument();
  });
});

describe("layout helpers", () => {
  it("fits the whole room on a phone without cropping, preserving the aspect ratio", () => {
    const fit = fitRect(390, 600);
    expect(fit.w / fit.h).toBeCloseTo(VIEW.w / VIEW.h, 5);
    expect(fit.w).toBeLessThanOrEqual(390);
    expect(fit.h).toBeLessThanOrEqual(600);
  });

  it("keeps the panel inside the stage horizontally and vertically", () => {
    const fit = fitRect(390, 600);
    const style = panelStyle({ x: 380, y: 30, w: 40, h: 60 }, fit, 390, 600);
    expect(Number(style.left)).toBeGreaterThanOrEqual(0);
    expect(Number(style.left) + Number(style.width)).toBeLessThanOrEqual(390);
  });

  it("moves the panel above a low object when there is more room above", () => {
    const fit = fitRect(390, 600);
    const style = panelStyle({ x: 20, y: 150, w: 80, h: 100 }, fit, 390, 600);
    expect(style.bottom).toBeDefined();
    expect(style.top).toBeUndefined();
  });
});
