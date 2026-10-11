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
  it("blocks keyboard movement into furniture and walls", () => {
    expect(moveShopPlayer("shop", { x: 5.5, y: 5 }, { x: -0.4, y: 0 })).toEqual({ x: 5.5, y: 5 });
    expect(moveShopPlayer("shop", { x: 16.5, y: 12 }, { x: 0.5, y: 0 })).toEqual({
      x: 16.5,
      y: 12,
    });
  });
  it("walks to shelves before opening all seven goods and reuses their actions", () => {
    const step = clock(),
      state = { ...START, money: 1000 },
      { container, run } = enter("shop", state);
    fireEvent.click(screen.getByRole("button", { name: /^Shop shelves\./ }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    step(130);
    const panel = screen.getByRole("dialog", { name: "Shop shelves" });
    const actions = within(panel)
      .getAllByRole("button")
      .filter((b) => b.getAttribute("aria-label") !== "Close panel");
    expect(actions).toHaveLength(SHOP_GOODS.length);
    for (const [i, good] of SHOP_GOODS.entries()) {
      fireEvent.click(actions[i]!);
      const action = run.mock.calls.at(-1)![0];
      expect(action.id).toBe(good.action(START).id);
      expect(runAction(state, action, () => 0)).toEqual(
        runAction(state, good.action(state), () => 0),
      );
    }
    expect(container.querySelectorAll("[data-overhead-person]")).toHaveLength(2);
    expect(container.querySelector("[data-resting-legs]")).toBeNull();
    const player = container.querySelector("[data-shop-player]")!;
    expect(Number(player.getAttribute("data-x"))).toBeCloseTo(6, 1);
    expect(Math.abs(Number(player.getAttribute("data-y")) - 5)).toBeLessThan(0.08);
    // Escape also works when focus is inside the action panel.
    fireEvent.keyDown(actions[0]!, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("disables unaffordable and already-owned catalog goods", () => {
    const step = clock();
    enter("shop", { ...START, trainers: 1 });
    fireEvent.click(screen.getByRole("button", { name: /^Shop shelves\./ }));
    step(130);
    expect(screen.getByRole("button", { name: /Running shoes.*Already owned/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /Alarm clock.*Need \$80 more/i })).toBeDisabled();
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
