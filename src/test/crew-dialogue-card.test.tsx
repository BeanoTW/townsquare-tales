import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { CrewDialogueCard } from "@/components/crime/CrewDialogueCard";

describe("crew conversation", () => {
 it("shows a single speaker, contextual topics and reachable leave action", () => {
  const onSpeaker = vi.fn(), onTopic = vi.fn(), onLeave = vi.fn();
  const { container } = render(<CrewDialogueCard speaker="mick" onSpeaker={onSpeaker} onTopic={onTopic} onLeave={onLeave} topic="talk" hostile={false} line="Keep your voice down."><button>Take the package</button></CrewDialogueCard>);
  expect(screen.getByText("Keep your voice down.")).toBeTruthy();
  expect(container.querySelectorAll("[data-crew-dialogue]")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button",{name:/lez/i}));
  expect(onSpeaker).toHaveBeenCalledWith("lez");
  fireEvent.click(screen.getByRole("button",{name:/ask about work/i}));
  expect(onTopic).toHaveBeenCalledWith("work");
  fireEvent.click(screen.getByRole("button",{name:/back away/i}));
  expect(onLeave).toHaveBeenCalledOnce();
 });
 it("restricts speaker switching when hostile", () => {
  const {container}=render(<CrewDialogueCard speaker="mick" onSpeaker={()=>{}} onTopic={()=>{}} onLeave={()=>{}} topic="talk" hostile line="Private pavement."><span>Stand ground</span></CrewDialogueCard>);
  expect((screen.getByRole("button",{name:/nia/i}) as HTMLButtonElement).disabled).toBe(true);
  expect(container.querySelector("[data-crew-actions]")?.textContent).toContain("Stand ground");
 });
});
