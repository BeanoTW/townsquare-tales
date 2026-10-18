import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { beginFight, opponentMove, takeTurn, type Fight } from "@/lib/combat";
import type { GameState } from "@/lib/game-state";
import { START } from "@/lib/game-data";
import { FIGHTERS, FIGHT_VENUES, MOVE_BAR, commentary, eventFor, eventSeconds, fighterFor, playTurn, queueSeconds, voice } from "@/lib/fight-presentation";
import { venuePlan } from "@/lib/home3d/venues";
import { roomFor } from "@/lib/rooms";
import { PubBrawl } from "@/components/PubBrawl";

const state = { ...START, money: 500, energy: 100, hour: 12, health: 100, str: 0, streetSmarts: 0, medicalDebt: 0 } as GameState;
const seq = (...xs: number[]) => { let i = 0; return () => xs[i++ % xs.length]!; };

describe("turn events are read from the engine, never decided by the presentation", () => {
  it("names hits, misses, blocks, guards, recoveries and knockouts from before/after state", () => {
    let f = beginFight(state, 50);
    const hit = takeTurn(f, "jab", () => 0);
    expect(eventFor(f, hit, "jab")).toMatchObject({ actor: "player", outcome: "hit", ko: false });
    const miss = takeTurn(f, "heavy", () => 0.99);
    expect(eventFor(f, miss, "heavy")).toMatchObject({ outcome: "miss", damage: 0 });
    expect(eventFor(f, takeTurn(f, "block"), "block").outcome).toBe("brace");
    expect(eventFor(f, takeTurn(f, "recover"), "recover").outcome).toBe("recover");
    f = takeTurn(f, "block");
    const blocked = takeTurn(f, "hook", () => 0);
    expect(eventFor(f, blocked, "hook")).toMatchObject({ actor: "opponent", outcome: "blocked" });
    const finale: Fight = { ...beginFight(state, 50), opponent: { ...beginFight(state, 50).opponent, hp: 3 } };
    const ko = eventFor(finale, takeTurn(finale, "jab", () => 0), "jab");
    expect(ko.ko).toBe(true);
    expect(ko.big).toBe(true);
  });

  it("plays a turn exactly as the old screen did: the player's move, then the opponent's reply", () => {
    const f = beginFight(state, 50);
    const rolls = [0.2, 0.4, 0.6, 0.1, 0.3];
    const ours = playTurn(f, "hook", seq(...rolls));
    const first = takeTurn(f, "hook", seq(...rolls));
    const theirs = takeTurn(first, opponentMove(first), (() => { const r = seq(...rolls); r(); r(); return r; })());
    expect(ours.fight.player.hp).toBe(theirs.player.hp);
    expect(ours.fight.opponent.hp).toBe(theirs.opponent.hp);
    expect(ours.events.map((e) => e.actor)).toEqual(["player", "opponent"]);
  });

  it("keeps ordinary turns short, makes knockouts linger, and respects off and reduced motion", () => {
    const f = beginFight(state, 50);
    const { events } = playTurn(f, "jab", () => 0);
    expect(queueSeconds(events, "full")).toBeLessThan(2.5);
    expect(eventSeconds({ ...events[0]!, ko: true }, "full")).toBeGreaterThan(eventSeconds(events[0]!, "full"));
    expect(eventSeconds({ ...events[0]!, move: "heavy" }, "full")).toBeGreaterThan(eventSeconds({ ...events[0]!, move: "jab" }, "full"));
    expect(queueSeconds(events, "off")).toBeLessThan(1);
    expect(queueSeconds(events, "full", true)).toBeLessThan(1);
    expect(queueSeconds(events, "short")).toBeLessThan(queueSeconds(events, "full"));
  });

  it("leads commentary with the engine's words and gives every pub opponent a personality", () => {
    const f = beginFight(state, 50);
    const { events } = playTurn(f, "jab", () => 0);
    expect(commentary(events[0]!, FIGHTERS.barry)[0]).toBe(voice(events[0]!.message));
    expect(voice("You lands a jab for 7 HP!")).toBe("You land a jab for 7 HP!");
    expect(voice("You's heavy punch misses!")).toBe("Your heavy punch misses!");
    for (const name of ["Big Barry", "One-Punch Pete", "Derek the Menace", "Mad Mick's Cousin"]) {
      const look = fighterFor(name);
      expect(look.name).toBe(name);
      expect(look.miss.length).toBeGreaterThan(0);
    }
    expect(new Set(Object.values(FIGHTERS).map((l) => l.outfit)).size).toBe(Object.keys(FIGHTERS).length);
    expect(MOVE_BAR.map((m) => [m.id, m.cost])).toEqual([["jab", 1], ["hook", 2], ["heavy", 3], ["block", 1], ["recover", 0]]);
  });
});

describe("fight venues", () => {
  it("stages pub fights on The Tipsy Stick's dance floor, clear of its furniture, and has room for other venues", () => {
    const pub = FIGHT_VENUES.pub;
    const plan = venuePlan("bar")!;
    for (const p of [pub.player, pub.opponent, ...pub.spectators]) {
      expect(p.x).toBeGreaterThan(0); expect(p.x).toBeLessThan(plan.size.w);
      expect(p.z).toBeGreaterThan(0); expect(p.z).toBeLessThan(plan.size.d);
      for (const c of plan.colliders ?? []) expect(p.x > c.x0 && p.x < c.x1 && p.z > c.z0 && p.z < c.z1).toBe(false);
    }
    for (const shot of Object.values(pub.shots)) {
      expect(shot.eye[2]).toBeLessThan(plan.size.d); // the camera stays inside the pub
      expect(shot.eye[0]).toBeGreaterThan(0);
    }
    expect(FIGHT_VENUES.underground.venue).toBe("underground");
    expect(Object.keys(FIGHT_VENUES.underground.shots)).toEqual(Object.keys(pub.shots));
  });

  it("puts Ron the bookie in the pub as the way into a fight, alongside the bar, dance floor and darts", () => {
    const plan = venuePlan("bar")!;
    expect(plan.slots.map((s) => s.id).sort()).toEqual(["bar-counter", "dance-floor", "dartboard", "pub-brawl"]);
    expect(plan.slots.map((s) => s.id).sort()).toEqual(roomFor("bar", state).hotspots.map((h) => h.id).sort());
    expect(roomFor("bar", state).hotspots.find((h) => h.id === "pub-brawl")?.launch).toBe("fight");
  });
});

describe("the brawl screen", () => {
  afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

  it("takes the wager, locks moves while a turn plays, and settles exactly once", () => {
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0);
    const onChange = vi.fn();
    const onExit = vi.fn();
    render(<PubBrawl state={state} onChange={onChange} onExit={onExit} cutsceneMode="off" />);
    expect(screen.getByText("“Fancy a scrap?”")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "$50" }));
    // No way out mid-fight: no leave button, and taps on the scene do not close it.
    expect(screen.queryByText("Not tonight, Ron")).toBeNull();
    fireEvent.pointerDown(document.querySelector("[data-fight-scene]")!);
    expect(onExit).not.toHaveBeenCalled();
    for (let i = 0; i < 40 && !document.querySelector("[data-fight-result]"); i++) {
      const move = ["heavy", "hook", "jab", "recover"].map((m) => document.querySelector<HTMLButtonElement>(`[data-move="${m}"]`)).find((b) => b && !b.disabled);
      if (move) {
        fireEvent.click(move);
        // A second tap while the turn is still playing is ignored.
        expect(document.querySelector<HTMLButtonElement>(`[data-move="recover"]`)?.disabled ?? true).toBe(true);
        fireEvent.click(move);
      }
      act(() => { vi.advanceTimersByTime(3000); });
    }
    expect(document.querySelector("[data-fight-result]")).toBeTruthy();
    expect(onChange).toHaveBeenCalledTimes(1);
    const after = onChange.mock.calls[0]![0] as GameState;
    expect(after.money === 550 || after.money === 450).toBe(true);
    if (after.money === 450) expect(after.medicalDebt).toBe(350);
    act(() => { vi.advanceTimersByTime(10_000); });
    expect(onChange).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: /back to the pub/i }));
    expect(onExit).toHaveBeenCalledTimes(1);
  });

  it("refuses stakes the player can't cover, and fights when they're out of health", () => {
    render(<PubBrawl state={{ ...state, money: 80 }} onChange={() => {}} onExit={() => {}} />);
    expect((screen.getByRole("button", { name: "$150" }) as HTMLButtonElement).disabled).toBe(true);
    expect((screen.getByRole("button", { name: "$50" }) as HTMLButtonElement).disabled).toBe(true);
    cleanup();
    render(<PubBrawl state={{ ...state, health: 0 }} onChange={() => {}} onExit={() => {}} />);
    expect((screen.getByRole("button", { name: "$50" }) as HTMLButtonElement).disabled).toBe(true;
  });
});