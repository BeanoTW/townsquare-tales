import { afterEach, describe, it, expect, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { LocationScene } from "@/components/LocationScene";
import type { GameState } from "@/lib/game-state";
import { START } from "@/lib/game-data";
import { roomFor, visibleHotspots } from "@/lib/rooms";
import {
  SHOP_LAYOUTS,
  SHOP_ENTRY,
  SHOP_EXIT,
  shopRoute,
  shopObstacles,
  SHOP_AISLES,
  SHOP_STAFF,
  moveShopPlayer,
} from "@/lib/walkable-shops";
import { isWalkable } from "@/lib/pathfinding";
import { SHOP_GOODS } from "@/lib/shop-catalog";
import { runAction } from "@/lib/actions";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});
function clock() {
  let callback: FrameRequestCallback | null = null,
    now = 0;
  vi.spyOn(performance, "now").mockImplementation(() => now);
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    callback = cb;
    return 1;
  });
  vi.stubGlobal("cancelAnimationFrame", () => {
    callback = null;
  });
  return (count: number) => {
    for (let i = 0; i < count; i++)
      act(() => {
        now += 60;
        const cb = callback;
        callback = null;
        cb?.(now);
      });
  };
}
function enter(id: "shop" | "pawn" | "furniture" = "shop", state: GameState = START) {
  const run = vi.fn(),
    leave = vi.fn();
  const view = render(
    <LocationScene
      room={roomFor(id, state)}
      state={state}
      feedback={null}
      onRun={run}
      onLeave={leave}
    />,
  );
  return { ...view, run, leave };
}
describe("walkable shop navigation", () => {
  it("preserves every existing hotspot and makes all approaches reachable", () => {
    for (const id of ["shop", "pawn", "furniture"] as const) {
      expect(SHOP_LAYOUTS[id].map((f) => f.id).sort()).toEqual(
        visibleHotspots(roomFor(id, START), START)
          .map((h) => h.id)
          .sort(),
      );
      for (const goal of [...SHOP_LAYOUTS[id].map((f) => f.approach), SHOP_EXIT]) {
        const route = shopRoute(id, SHOP_ENTRY, goal);
        expect(route.at(-1)).toEqual(goal);
        let prev = SHOP_ENTRY;
        for (const point of route) {
          const length = Math.hypot(point.x - prev.x, point.y - prev.y);
          for (let step = 0; step <= Math.ceil(length * 20); step++) {
            const t = Math.min(1, step / Math.max(1, Math.ceil(length * 20)));
            expect(
              isWalkable(
                { x: prev.x + (point.x - prev.x) * t, y: prev.y + (point.y - prev.y) * t },
                shopObstacles(id),
              ),
            ).toBe(true);
          }
          prev = point;
        }
      }
    }
  });
  it("renders proper tills and distinct fittings whose aisles block walking", () => {
    for (const id of ["shop", "pawn", "furniture"] as const) {
      const view = enter(id);
      expect(
        view.container.querySelector("[data-shop-counter] [data-shop-till]"),
      ).toBeInTheDocument();
      expect(view.container.querySelector("[data-shop-shell]")).toHaveAttribute(
        "data-shop-shell",
        id,
      );
      const staff = SHOP_STAFF[id];
      expect(isWalkable(staff, shopObstacles(id))).toBe(false);
      if (id === "shop") {
        expect(view.container.querySelectorAll("[data-stocked-shelf]")).toHaveLength(2);
        for (const aisle of SHOP_AISLES[id])
          expect(
            isWalkable({ x: aisle.x + aisle.w / 2, y: aisle.y + aisle.d / 2 }, shopObstacles(id)),
          ).toBe(false);
      }
      if (id === "furniture") {
        expect(view.container.querySelector("[data-showroom-bed]")).toBeInTheDocument();
        expect(view.container.querySelector("[data-showroom-sofa]")).toBeInTheDocument();
      }
      view.unmount();
    }
  });
  it("blocks keyboard movement into furniture and walls", () => {
    expect(moveShopPlayer("shop", { x: 5.5, y: 5 }, { x: -0.4, y: 0 })).toEqual({ x: 5.5, y: 5 });
    expect(moveShopPlayer("shop", { x: 16.5, y: 12 }, { x: 0.5, y: 0 })).toEqual({
      x: 16.5,
      y: 12,
    });
  });
  it("browses without charging, walks to the till, then reuses every catalog action", () => {
    const step = clock(),
      state = { ...START, money: 1000 },
      { container, run } = enter("shop", state);
    fireEvent.click(screen.getByRole("button", { name: /^Shop shelves\./ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    step(160);
    const shelves = screen.getByRole("dialog", { name: "Shop shelves" });
    for (const good of SHOP_GOODS)
      expect(
        within(shelves).getByRole("button", { name: `Take ${good.name} to checkout` }),
      ).toBeInTheDocument();
    fireEvent.click(within(shelves).getByRole("button", { name: "Take Snack pack to checkout" }));
    expect(run).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    step(160);
    const checkout = screen.getByRole("dialog", { name: "Checkout" });
    for (const good of SHOP_GOODS) {
      fireEvent.click(within(checkout).getByRole("button", { name: `Select ${good.name}` }));
      fireEvent.click(
        within(checkout).getByRole("button", { name: `Buy ${good.name} for $${good.price}` }),
      );
      const action = run.mock.calls.at(-1)![0];
      expect(runAction(state, action, () => 0)).toEqual(
        runAction(state, good.action(state), () => 0),
      );
    }
    expect(container.querySelectorAll("[data-overhead-person]")).toHaveLength(2);
    expect(container.querySelector("[data-resting-legs]")).toBeNull();
    expect(
      Number(container.querySelector("[data-shop-player]")!.getAttribute("data-x")),
    ).toBeCloseTo(10, 1);
    fireEvent.keyDown(within(checkout).getByRole("button", { name: "Close panel" }), {
      key: "Escape",
    });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("disables unaffordable and already-owned goods at the checkout", () => {
    const step = clock();
    enter("shop", { ...START, trainers: 1 });
    fireEvent.click(screen.getByRole("button", { name: /^Checkout\./ }));
    step(160);
    fireEvent.click(screen.getByRole("button", { name: "Select Running shoes" }));
    expect(screen.getByRole("button", { name: /Running shoes.*Already owned/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Select Alarm clock" }));
    expect(screen.getByRole("button", { name: /Alarm clock.*Need \$80 more/i })).toBeDisabled();
  });
  it("approaches the centre aisle rather than opening its menu from across the room", () => {
    const step = clock(),
      { container } = enter();
    fireEvent.click(screen.getByRole("button", { name: "Browse the grocery aisle" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    step(160);
    expect(screen.getByRole("dialog", { name: "Shop shelves" })).toBeInTheDocument();
    expect(
      Number(container.querySelector("[data-shop-player]")!.getAttribute("data-x")),
    ).toBeCloseTo(9.5, 1);
  });
  it("filters shelf categories and leaves retail shifts at the till", () => {
    const step = clock();
    enter();
    fireEvent.click(screen.getByRole("button", { name: /^Shop shelves\./ }));
    step(160);
    fireEvent.click(screen.getByRole("button", { name: "Equipment" }));
    expect(
      screen.getByRole("button", { name: "Take Running shoes to checkout" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Take Snack pack to checkout" }),
    ).not.toBeInTheDocument();
  });
  it("keeps jobs accessible and pauses movement while a panel is open", () => {
    const step = clock(),
      { container } = enter();
    fireEvent.click(screen.getByRole("button", { name: /^Shop jobs board\./ }));
    step(150);
    expect(screen.getByRole("button", { name: /Apply: Shop Assistant/ })).toBeInTheDocument();
    const before = container.querySelector("[data-shop-player]")!.getAttribute("data-x");
    fireEvent.keyDown(window, { key: "d" });
    step(20);
    expect(container.querySelector("[data-shop-player]")!.getAttribute("data-x")).toBe(before);
  });
  it("supports keyboard walking, lost-focus stop and an actual walk-out exit", () => {
    const step = clock(),
      { container, leave } = enter();
    fireEvent.keyDown(window, { key: "ArrowLeft" });
    step(5);
    expect(
      Number(container.querySelector("[data-shop-player]")!.getAttribute("data-x")),
    ).toBeLessThan(9);
    fireEvent.blur(window);
    const x = container.querySelector("[data-shop-player]")!.getAttribute("data-x");
    step(5);
    expect(container.querySelector("[data-shop-player]")!.getAttribute("data-x")).toBe(x);
    fireEvent.click(screen.getByRole("button", { name: "Walk to exit" }));
    expect(leave).not.toHaveBeenCalled();
    step(60);
    expect(leave).toHaveBeenCalledOnce();
  });
  it("has no idle animation loop and respects reduced-motion arm preferences", () => {
    const step = clock();
    vi.stubGlobal("matchMedia", () => ({ matches: true }));
    const { container } = enter();
    const initial = container.querySelector("[data-shop-player]")!.innerHTML;
    step(10);
    expect(container.querySelector("[data-shop-player]")!.innerHTML).toBe(initial);
    fireEvent.keyDown(window, { key: "d" });
    step(5);
    expect(container.querySelector("[data-shop-player] [data-person-arms]")).toHaveAttribute(
      "d",
      "M-7 -7 Q-13 -5 -13 0 M7 -7 Q13 -5 13 0",
    );
  });
  it("keeps sales and furniture purchases available in the other walkable shops", () => {
    const step = clock();
    const pawn = enter("pawn");
    fireEvent.click(screen.getByRole("button", { name: /^Pawn counter\./ }));
    step(160);
    expect(screen.getByRole("dialog", { name: "Pawn counter" })).toHaveTextContent(
      "Nothing to sell yet",
    );
    pawn.unmount();
    enter("furniture");
    fireEvent.click(screen.getByRole("button", { name: /^Sofa display\./ }));
    step(160);
    expect(
      within(screen.getByRole("dialog", { name: "Sofa display" })).getByRole("button", {
        name: /sofa/i,
      }),
    ).toBeInTheDocument();
  });
});
