import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { START } from "@/lib/game-data";
import { ROOMS } from "@/lib/rooms";
import { FURNITURE, LUXURY_FURNITURE } from "@/lib/furniture";
import { InteriorCommercePanel } from "@/components/rooms/InteriorCommercePanel";

describe("Cosy Corner catalogue", () => {
  const hotspot=ROOMS.furniture.hotspots.find(h=>h.id==="catalogue")!;
  const show=()=>render(<InteriorCommercePanel venue="furniture" hotspot={hotspot}
    state={{...START,money:100000}} godMode={false} onRun={vi.fn()} onClose={vi.fn()}/>);
  it("asks which quality to browse before displaying products",()=>{
    show();
    expect(screen.getByRole("button",{name:/Standard goods/i})).toBeTruthy();
    expect(screen.getByRole("button",{name:/Premium goods/i})).toBeTruthy();
    expect(screen.queryByText(FURNITURE[0]!.name)).toBeNull();
  });
  it("shows all standard items and can change to premium",()=>{
    show();
    fireEvent.click(screen.getByRole("button",{name:/Standard goods/i}));
    for(const item of FURNITURE)expect(screen.getByText(item.name)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Change/i}));
    fireEvent.click(screen.getByRole("button",{name:/Premium goods/i}));
    for(const item of LUXURY_FURNITURE)expect(screen.getByText(item.name)).toBeTruthy();
  });
});
