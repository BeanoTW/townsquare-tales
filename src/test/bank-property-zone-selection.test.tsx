import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { InteriorCommercePanel } from "@/components/rooms/InteriorCommercePanel";
import { START, HOUSES } from "@/lib/game-data";
import { ROOMS, hotspotActions } from "@/lib/rooms";
import { BANK, SCHOOL } from "@/lib/home3d/town-venues";
import { zoneForSlot, vantageFor } from "@/lib/home3d/layout";

describe("property management at Town Bank",()=>{
  const desk=ROOMS.bank.hotspots.find(h=>h.id==="loans")!;
  it("replaces the dedicated loans desk with a home purchase service",()=>{
    expect(desk.label).toBe("Property management");
    expect(hotspotActions(desk,START)[0]?.id).toBe("buy-house");
    const onRun=vi.fn();
    render(<InteriorCommercePanel venue="bank" hotspot={desk} state={{...START,money:25000}}
      godMode={false} onRun={onRun} onClose={()=>{}}/>);
    expect(screen.getByText(HOUSES[1]!.name)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:/Buy Studio Flat/i}));
    expect(onRun.mock.calls[0]?.[0]?.id).toBe("buy-house");
  });
  it("keeps the existing loan borrowing services at the teller",()=>{
    const teller=ROOMS.bank.hotspots.find(h=>h.id==="teller")!;
    render(<InteriorCommercePanel venue="bank" hotspot={teller} state={{...START,money:1000}}
      godMode={false} onRun={()=>{}} onClose={()=>{}}/>);
    fireEvent.click(screen.getByRole("button",{name:/Loans/i}));
    expect(screen.getByRole("button",{name:/Borrow 250\b/i})).toBeTruthy();
  });
});
describe("cross-area selection",()=>{
  it("resolves the correct zone for fixture selection",()=>{
    expect(zoneForSlot(BANK,"teller")).toBe("floor");
    expect(zoneForSlot(BANK,"vault")).toBe("back");
    expect(zoneForSlot(SCHOOL,"classroom")).toBe("back");
    expect(zoneForSlot(SCHOOL,"admissions")).toBe("floor");
    expect(zoneForSlot(BANK,"not-an-object")).toBeNull();
  });
  it("zones have real distinct first-person viewpoints",()=>{
    expect(vantageFor(BANK,zoneForSlot(BANK,"teller")!).eye).not.toEqual(vantageFor(BANK,zoneForSlot(BANK,"vault")!).eye);
  });
});
