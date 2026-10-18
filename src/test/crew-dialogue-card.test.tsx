import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CrewDialogueCard, speakerForTopic } from "@/components/crime/CrewDialogueCard";

describe("crew conversation", () => {
 it("routes subjects to their relevant crew member", () => {
  expect(speakerForTopic("work")).toBe("mick");
  expect(speakerForTopic("news")).toBe("lez");
  expect(speakerForTopic("business")).toBe("nia");
  expect(speakerForTopic("gear")).toBe("nia");
 });
 it("shows one speaker, subject choices and a reachable exit", () => {
  const onTopic = vi.fn(), onLeave = vi.fn();
  const {container}=render(<CrewDialogueCard speaker="mick" onTopic={onTopic} onLeave={onLeave} topic="talk" hostile={false} line="Keep your voice down."><button>Take the package</button></CrewDialogueCard>);
  expect(screen.getByText("Keep your voice down.")).toBeTruthy();
  expect(container.querySelectorAll("[data-crew-dialogue]")).toHaveLength(1);
  expect(screen.queryByRole("button",{name:/^Mick/i})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:/street news/i}));
  expect(onTopic).toHaveBeenCalledWith("news");
  fireEvent.click(screen.getByRole("button",{name:/back away/i}));
  expect(onLeave).toHaveBeenCalledOnce();
 });
 it("keeps hostile responses without showing ordinary subjects", () => {
  const {container}=render(<CrewDialogueCard speaker="mick" onTopic={()=>{}} onLeave={()=>{}} topic="talk" hostile line="Private pavement."><span>Stand ground</span></CrewDialogueCard>);
  expect(screen.queryByRole("navigation",{name:/conversation subjects/i})).toBeNull();
  expect(container.querySelector("[data-crew-actions]")?.textContent).toContain("Stand ground");
 });
});
