import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocationScene } from "@/components/LocationScene";
import { HomeShell } from "@/components/rooms/HomeInterior";
import { START } from "@/lib/game-data";
import { roomFor } from "@/lib/rooms";

afterEach(cleanup);
describe("distinct home rooms", () => {
  it("gives different zones their own visual identities", () => {
    const { container, rerender } = render(<svg><HomeShell house={3} zone="kitchen" /></svg>);
    expect(container.querySelector('[data-home-room-theme="kitchen"]')).toBeTruthy();
    rerender(<svg><HomeShell house={3} zone="entertainment" /></svg>);
    expect(container.querySelector('[data-home-room-theme="entertainment"]')).toBeTruthy();
    expect(container.querySelector('[data-home-room-theme="kitchen"]')).toBeNull();
  });
  it("offers blackjack and slots only inside the mansion games room", () => {
    const onLaunch = vi.fn();
    const state = { ...START, house: 3 };
    render(<LocationScene room={roomFor("home",state)} state={state} feedback={null} onRun={vi.fn()} onLeave={vi.fn()} onLaunch={onLaunch} />);
    expect(screen.queryByRole("region", { name: "Games room" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Entertainment" }));
    expect(screen.getByRole("region", { name: "Games room" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Blackjack/ }));
    expect(onLaunch).toHaveBeenCalledWith("blackjack");
    fireEvent.click(screen.getByRole("button", { name: /Slots/ }));
    expect(onLaunch).toHaveBeenCalledWith("slots");
  });
});
