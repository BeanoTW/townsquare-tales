import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { homeZones, furnitureZone } from "@/lib/home-zones";
import { FurnitureShowroom } from "@/components/rooms/FurnitureShowroom";
import { LocationScene } from "@/components/LocationScene";
import { runAction, furnitureAction } from "@/lib/actions";
import { START } from "@/lib/game-data";
import { roomFor } from "@/lib/rooms";

afterEach(cleanup);

describe("multi-room homes", () => {
 it("unlocks dedicated rooms across all four house tiers", () => {
   expect(homeZones(0).map(z=>z.id)).toEqual(["shelter"]);
   expect(homeZones(1)).toHaveLength(2);
   expect(homeZones(2)).toHaveLength(4);
   expect(homeZones(3)).toHaveLength(6);
   expect(furnitureZone("console", 3)).toBe("entertainment");
   expect(furnitureZone("kitchen", 1)).toBe("living");
 });
 it("only displays hotspots and furniture for the selected room", () => {
   const state = {...START, house: 2, furniture: 255};
   render(<LocationScene room={roomFor("home", state)} state={state} feedback={null} onRun={vi.fn()} onLeave={vi.fn()} />);
   expect(screen.getByRole("navigation", {name:"Home rooms"})).toBeInTheDocument();
   fireEvent.click(screen.getByRole("button",{name:"Kitchen"}));
   expect(document.querySelector('[data-home-furniture="kitchen"]')).toBeTruthy();
   expect(document.querySelector('[data-home-furniture="bed"]')).toBeNull();
   fireEvent.click(screen.getByRole("button",{name:"Bedroom"}));
   expect(document.querySelector('[data-home-furniture="bed"]')).toBeTruthy();
   expect(document.querySelector('[data-home-furniture="kitchen"]')).toBeNull();
 });
 it("prevents cardboard-box electronics purchases in both UI and action logic", () => {
   const state = {...START, money: 10000};
   render(<FurnitureShowroom state={state} onRun={vi.fn()} />);
   const tv = screen.getByText("Television").closest("article")!;
   expect(within(tv).getByRole("button",{name:/Requires Studio Flat/})).toBeDisabled();
   expect(runAction(state,furnitureAction("tv",state)).ok).toBe(false);
   expect(runAction({...state,house:1},furnitureAction("tv",{...state,house:1})).ok).toBe(true);
 });
});
