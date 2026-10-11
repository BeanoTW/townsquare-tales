import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { OverheadPerson } from "@/components/OverheadPerson";

describe("overhead character direction and poses",()=>{
 it("rotates arms and head together with travel direction",()=>{
   const view=render(<svg><OverheadPerson angle={90} moving phase={1}/></svg>);
   expect(view.container.querySelector('[data-body-heading]')?.getAttribute("transform")).toBe("rotate(90)");
   expect(view.container.querySelector("[data-walking-feet]")).toBeInTheDocument();
   view.rerender(<svg><OverheadPerson angle={-45}/></svg>);
   expect(view.container.querySelector('[data-body-heading]')?.getAttribute("transform")).toBe("rotate(-45)");
   expect(view.container.querySelector("[data-walking-feet]")).not.toBeInTheDocument();
 });
 it("alternates one foot ahead of the head and one behind on successive steps",()=>{
   const view=render(<svg><OverheadPerson moving phase={Math.PI/2}/></svg>);
   const first=view.container.querySelector("[data-walking-feet] path")?.getAttribute("d") ?? "";
   expect(first).toContain("L-5 -13");
   expect(first).toContain("L5 7");
   view.rerender(<svg><OverheadPerson moving phase={Math.PI*1.5}/></svg>);
   const second=view.container.querySelector("[data-walking-feet] path")?.getAttribute("d") ?? "";
   expect(second).toContain("L-5 7");
   expect(second).toContain("L5 -13");
 });
 it("shows legs only for seated and reclining figures without changing the silhouette size",()=>{
   const view=render(<svg><OverheadPerson pose="sitting"/></svg>);
   expect(view.container.querySelector("[data-sideways-seated-legs]")).toBeInTheDocument();
   view.rerender(<svg><OverheadPerson pose="lying"/></svg>);
   expect(view.container.querySelector('[data-pose="lying"] [data-resting-legs]')).toBeInTheDocument();
   view.rerender(<svg><OverheadPerson/></svg>);
   expect(view.container.querySelector("[data-resting-legs]")).not.toBeInTheDocument();
 });
});