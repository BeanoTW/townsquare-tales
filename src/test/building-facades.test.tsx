import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { BuildingExterior } from "@/components/BuildingExterior";
import { buildings } from "@/components/TownMap";

describe("two-face building perspective", () => {
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