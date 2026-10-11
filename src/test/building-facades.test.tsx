import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BuildingExterior } from "@/components/BuildingExterior";
import { buildings } from "@/components/TownMap";

describe("two-face building perspective", () => {
  it("paints landmark return walls over hidden facade glazing", () => {
    for (const id of ["work", "casino", "bar"]) {
      const lot=buildings(1).find(b=>b.id===id)!;
      const view=render(<svg><BuildingExterior b={lot} night={false}/></svg>);
      const wall=view.container.querySelector('[data-landmark-return-wall="'+id+'"]');
      expect(wall).toBeInTheDocument();
      expect(wall?.querySelectorAll('[data-side-window]')).toHaveLength(2);
      view.unmount();
    }
  });
  it("mounts street-facing signs on walls rather than floating over the road", () => {
    for (const id of ["police","depot","pawn"]) {
      const lot=buildings(1).find(b=>b.id===id)!;
      const view=render(<svg><BuildingExterior b={lot} night={false}/></svg>);
      expect(view.container.querySelector('[data-mounted-sign="'+id+'"] polygon')).toBeInTheDocument();
      expect(view.container.querySelector('[data-mounted-sign="'+id+'"] text')?.textContent).toBe(lot.label);
      view.unmount();
    }
  });
  it("shows secondary facade glazing while preserving the main entrance", () => {
    for (const id of ["gym","shop","bank","police"]) {
      const lot=buildings(1).find(b=>b.id===id)!;
      const view=render(<svg><BuildingExterior b={lot} night={false}/></svg>);
      expect(view.container.querySelector('[data-building="'+id+'"]')).toBeInTheDocument();
      expect(view.container.querySelectorAll("[data-side-window]").length).toBe(2);
      view.unmount();
    }
  });
});