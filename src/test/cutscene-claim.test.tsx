import { describe, expect, it, vi } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { createRef } from "react";
import { START } from "@/lib/game-data";
import { roomFor } from "@/lib/rooms";
import type { Cutscene, CutsceneClaim } from "@/lib/cutscenes";

// jsdom has no WebGL: pretend it does, and swap the canvas for a stub that reports what it was asked to play.
vi.mock("@/components/home3d/Home3DStage", async (orig) => {
  const real = await orig<typeof import("@/components/home3d/Home3DStage")>();
  return {
    ...real,
    webglAvailable: () => true,
    Home3DStage: ({ cutscene, onCutsceneDone }: { cutscene: Cutscene | null; onCutsceneDone?: () => void }) => (
      <div data-home3d>
        {cutscene && <button type="button" data-stub-cutscene={cutscene.act} onClick={onCutsceneDone}>{cutscene.title}</button>}
      </div>
    ),
  };
});

const { LocationScene } = await import("@/components/LocationScene");

describe("cutscene hand-off", () => {
  it("lets the 3D gym claim a lift so the card never shows, then hands control back", async () => {
    const s = { ...START, house: 1, str: 12, energy: 60, money: 500 };
    const claim = createRef<CutsceneClaim | null>() as { current: CutsceneClaim | null };
    claim.current = null;
    render(<LocationScene room={roomFor("gym", s)} state={s} feedback={null} onRun={() => {}} onLeave={() => {}} cutsceneClaim={claim} />);
    await act(async () => {});
    expect(claim.current).toBeTypeOf("function");

    let claimed = false;
    act(() => { claimed = claim.current!({ actionId: "lift", changes: ["Strength: +2"], before: s, after: { ...s, str: 14 } }); });
    expect(claimed).toBe(true);
    const scene = screen.getByRole("button", { name: "BENCH DAY" });
    expect(scene.getAttribute("data-stub-cutscene")).toBe("bench");

    // While one scene plays, nothing else is claimed (the card shows instead).
    let second = true;
    act(() => { second = claim.current!({ actionId: "lift", changes: [], before: s, after: s }); });
    expect(second).toBe(false);

    act(() => scene.click());
    expect(screen.queryByRole("button", { name: "BENCH DAY" })).toBeNull();
  });

  it("clears an interrupted home scene when switching to classic view", async () => {
    const s = { ...START, house: 1 };
    const claim = { current: null as CutsceneClaim | null };
    render(<LocationScene room={roomFor("home", s)} state={s} feedback={null} onRun={() => {}} onLeave={() => {}} cutsceneClaim={claim} />);
    await act(async () => {});
    act(() => { expect(claim.current!({ actionId: "sleep", changes: [], before: s, after: s })).toBe(true); });
    expect(screen.getByRole("button", { name: "LIGHTS OUT" })).toBeTruthy();
    act(() => screen.getByRole("button", { name: "Switch to classic view" }).click());
    expect(screen.queryByRole("button", { name: "LIGHTS OUT" })).toBeNull();
    act(() => screen.getByRole("button", { name: "Switch to 3D view" }).click());
    expect(screen.queryByRole("button", { name: "LIGHTS OUT" })).toBeNull();
    act(() => { expect(claim.current!({ actionId: "sleep", changes: [], before: s, after: s })).toBe(true); });
  });

  it("declines actions it cannot act out", async () => {
    const s = { ...START, house: 1 };
    const claim = { current: null as CutsceneClaim | null };
    render(<LocationScene room={roomFor("gym", s)} state={s} feedback={null} onRun={() => {}} onLeave={() => {}} cutsceneClaim={claim} />);
    await act(async () => {});
    expect(claim.current!({ actionId: "buy-shoes", changes: [], before: s, after: s })).toBe(false);
  });
});
