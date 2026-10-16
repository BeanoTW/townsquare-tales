import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ROOMS, hotspotActions } from "@/lib/rooms";
import { START } from "@/lib/game-data";
import { SHOP_GOODS } from "@/lib/shop-catalog";
import { InteriorCommercePanel } from "@/components/rooms/InteriorCommercePanel";

describe("one purchase point at corner shop", () => {
  const shelves = ROOMS.shop.hotspots.find(h => h.id === "shelves")!;
  const checkout = ROOMS.shop.hotspots.find(h => h.id === "checkout")!;

  it("keeps shelves informational instead of selling a second set of goods", () => {
    expect(hotspotActions(shelves, START)).toEqual([]);
    expect(shelves.lines?.(START).join(" ")).toMatch(/checkout/i);
  });

  it("keeps every catalogue item available at the checkout", () => {
    render(<InteriorCommercePanel venue="shop" hotspot={checkout} state={{ ...START, money: 10000 }}
      godMode={false} onRun={vi.fn()} onClose={vi.fn()} />);
    for (const item of SHOP_GOODS) {
      expect(screen.getByText(new RegExp(item.name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i"))).toBeTruthy();
    }
  });
});
