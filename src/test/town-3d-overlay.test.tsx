import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render } from "@testing-library/react";
import { useRef } from "react";
import { TownMap } from "@/components/TownMap";
import { StreetLife, type ResidentPositions } from "@/components/StreetLife";
import { ConstructionSite } from "@/components/ConstructionSite";
import { START } from "@/lib/game-data";
import type { StreetLive } from "@/components/town3d/actors";

afterEach(cleanup);

describe("town renderer selection", () => {
  it("falls back to the classic SVG town when WebGL is unavailable", () => {
    const view = render(<TownMap hour={12} house={1} onEnter={vi.fn()} active={null} />);
    expect(view.container.querySelector('[data-town-renderer="classic"]')).toBeInTheDocument();
    expect(view.container.querySelector("[data-town-world-3d]")).not.toBeInTheDocument();
    expect(view.container.querySelector("[data-building]")).toBeInTheDocument();
  });
});

function Street({ ghost }: { ghost: boolean }) {
  const player = useRef({ x: 9.95, y: 9, walking: false });
  const positions = useRef<ResidentPositions>({});
  const live = useRef<StreetLive | null>(null);
  return (
    <svg>
      <StreetLife player={player} positions={positions} lots={[]} state={{ ...START, hour: 12 }} skating={false} paused={false}
        onResident={vi.fn()} onObject={vi.fn()} ghost={ghost} live={live} />
    </svg>
  );
}

describe("street life overlay in the 3D town", () => {
  it("keeps tap targets and name tags but draws no SVG bodies", () => {
    const view = render(<Street ghost />);
    expect(view.container.querySelectorAll("[data-resident]").length).toBeGreaterThan(0);
    expect(view.container.querySelectorAll("[data-street-object]").length).toBeGreaterThan(0);
    expect(view.container.querySelector("[data-overhead-person]")).not.toBeInTheDocument();
    expect(view.container.querySelector("[data-pigeon]")).not.toBeInTheDocument();
    expect(view.container.querySelector("[data-street-pedestrian]")).not.toBeInTheDocument();
    expect(view.container.textContent).toContain("Ivy");
  });

  it("still draws everything in the classic view", () => {
    const view = render(<Street ghost={false} />);
    expect(view.container.querySelector("[data-overhead-person]")).toBeInTheDocument();
    expect(view.container.querySelector("[data-pigeon]")).toBeInTheDocument();
  });

  it("keeps the foreman reachable when the site is drawn in 3D", () => {
    const onForeman = vi.fn();
    const view = render(<svg><ConstructionSite ghost onForeman={onForeman} /></svg>);
    const foreman = view.container.querySelector("[data-construction-foreman]") as SVGGElement;
    expect(foreman).toBeInTheDocument();
    expect(view.container.querySelector("[data-construction-crane]")).not.toBeInTheDocument();
    foreman.dispatchEvent(new MouseEvent("click", { bubbles: true }));
    expect(onForeman).toHaveBeenCalled();
  });
});
