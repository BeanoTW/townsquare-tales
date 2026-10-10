import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { TownMap } from "@/components/TownMap";
afterEach(cleanup);
describe("skateboard appearance",()=>{
  it("shows the board only when skating",()=>{
    const view=render(<TownMap hour={12} house={1} skating onEnter={vi.fn()} active={null}/>);
    expect(view.container.querySelector("[data-skateboard]")).toBeInTheDocument();
    view.rerender(<TownMap hour={12} house={1} skating={false} onEnter={vi.fn()} active={null}/>);
    expect(view.container.querySelector("[data-skateboard]")).not.toBeInTheDocument();
  });
});