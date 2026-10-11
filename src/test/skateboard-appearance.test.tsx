import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { TownMap } from "@/components/TownMap";
afterEach(cleanup);
describe("skateboard appearance",()=>{
  it("renders a compact overhead rider rather than a rotated standing figure",()=>{
    const view=render(<TownMap hour={12} house={1} skating onEnter={vi.fn()} active={null}/>);
    const pose=view.container.querySelector("[data-skater-pose]");
    expect(pose).toBeInTheDocument();
    expect(view.container.querySelector("[data-overhead-person]")).toBeInTheDocument();
    const deck=view.container.querySelector('[data-skateboard="deck"]');
    expect(deck?.getAttribute("rx")).toBe("5");
    expect(deck?.getAttribute("height")).toBe("42");
    expect(deck?.getAttribute("fill")).toBe("#89949c");
    expect(pose?.getAttribute("transform")).toBeNull();
    expect(pose?.getAttribute("data-skate-angle")).toBe("0");
    expect(view.container.querySelector("[data-overhead-person] circle")).toBeInTheDocument();
  });
  it("shows the board only when skating",()=>{
    const view=render(<TownMap hour={12} house={1} skating onEnter={vi.fn()} active={null}/>);
    expect(view.container.querySelector("[data-skateboard]")).toBeInTheDocument();
    view.rerender(<TownMap hour={12} house={1} skating={false} onEnter={vi.fn()} active={null}/>);
    expect(view.container.querySelector("[data-skateboard]")).not.toBeInTheDocument();
  });
});