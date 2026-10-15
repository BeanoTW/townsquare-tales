import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FurnitureShowroom } from "@/components/rooms/FurnitureShowroom";
import { START } from "@/lib/game-data";
import { FURNITURE, LUXURY_FURNITURE } from "@/lib/furniture";

afterEach(cleanup);
describe("Cosy Corner furniture showroom", () => {
  it("separates basic and premium ranges without duplicating stock", () => {
    render(<FurnitureShowroom state={{ ...START, money: 10000 }} onRun={vi.fn()} />);
    expect(screen.getByRole("tabpanel", { name: "Basic collection" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(FURNITURE.length);
    fireEvent.click(screen.getByRole("tab", { name: /Premium aisle/ }));
    expect(screen.getByRole("tabpanel", { name: "Premium aisle" })).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(LUXURY_FURNITURE.length);
  });
  it("marks owned pieces and disables repeat purchase separately for each range", () => {
    const onRun = vi.fn();
    render(<FurnitureShowroom state={{ ...START, money: 10000, furniture: 1, luxuryFurniture: 0 }} onRun={onRun} />);
    const bed = screen.getByText("Proper bed").closest("article")!;
    expect(within(bed).getByRole("button", { name: /OWNED/ })).toBeDisabled();
    fireEvent.click(screen.getByRole("tab", { name: /Premium aisle/ }));
    const luxuryBed = screen.getByText("Cloud king bed").closest("article")!;
    const button = within(luxuryBed).getByRole("button", { name: /Buy for/ });
    expect(button).toBeEnabled();
    fireEvent.click(button);
    expect(onRun.mock.calls[0]?.[0].id).toBe("furniture-luxury-bed");
  });
});
