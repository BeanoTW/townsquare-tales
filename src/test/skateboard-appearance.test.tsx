import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { TownMap } from "@/components/TownMap";
afterEach(cleanup);
describe("skateboard appearance",()=>{
  it("renders a compact overhead rider rather than a rotated standing figure",()=>{
    const view=render(<TownMap hour={12} house={1} skating onEnter={vi.fn()} active={null}/>);
    const pose=view.container.querySelector("[data-skater-pose]");
    expect(pose).toBeInTheDocument();
    expect(pose?.getAttribute("transform")).toContain("translate(0 -9)");
    const deck=view.container.querySelector('[data-skateboard="deck"]');
    expect(deck?.getAttribute("ry")).toBe("15");
    expect(pose?.querySelectorAll("circle")).toHaveLength(1);
  });
  it("shows the board only when skating",()=>{
    const view=render(<TownMap hour={12} house={1} skating onEnter={vi.fn()} active={null}/>);
    expect(view.container.querySelector("[data-skateboard]")).toBeInTheDocument();
    view.rerender(<TownMap hour={12} house={1} skating={false} onEnter={vi.fn()} active={null}/>);
    expect(view.container.querySelector("[data-skateboard]")).not.toBeInTheDocument();
  });
});