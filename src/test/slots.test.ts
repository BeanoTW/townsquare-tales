import { describe, expect, it } from "vitest";
import {
  PAYTABLE,
  STOPS,
  STRIP,
  drawStops,
  evaluate,
  exactStats,
  finishSpin,
  idleSpin,
  lineFor,
  startSpin,
  windowAt,
  type Line,
} from "@/lib/slots";

describe("reel strip", () => {
  it("matches the documented symbol distribution", () => {
    const count = (s: string) => STRIP.filter((x) => x === s).length;
    expect(STOPS).toBe(20);
    expect({
      seven: count("seven"),
      diamond: count("diamond"),
      bar: count("bar"),
      bell: count("bell"),
      cherry: count("cherry"),
      lemon: count("lemon"),
    }).toEqual({ seven: 1, diamond: 2, bar: 3, bell: 4, cherry: 5, lemon: 5 });
  });
  it("shows the neighbouring stops above and below the payline, wrapping round", () => {
    expect(windowAt(0)).toEqual([STRIP[19], STRIP[0], STRIP[1]]);
    expect(windowAt(19)).toEqual([STRIP[18], STRIP[19], STRIP[0]]);
  });
});

describe("paytable", () => {
  const e = (...l: Line) => evaluate(l)?.mult ?? 0;
  it("pays each documented combination", () => {
    expect(e("seven", "seven", "seven")).toBe(300);
    expect(e("diamond", "diamond", "diamond")).toBe(75);
    expect(e("bar", "bar", "bar")).toBe(30);
    expect(e("bell", "bell", "bell")).toBe(15);
    expect(e("cherry", "cherry", "cherry")).toBe(8);
    expect(e("lemon", "lemon", "lemon")).toBe(3);
  });
  it("pays exactly two cherries wherever they sit, but not one", () => {
    expect(e("cherry", "cherry", "bell")).toBe(3);
    expect(e("cherry", "bell", "cherry")).toBe(3);
    expect(e("bell", "cherry", "cherry")).toBe(3);
    expect(e("cherry", "bell", "bar")).toBe(0);
  });
  it("pays nothing for mixed lines and for two matching non-cherries", () => {
    expect(e("seven", "seven", "bar")).toBe(0);
    expect(e("bell", "lemon", "bar")).toBe(0);
  });
  it("lists every payout on the paytable that the evaluator can return", () => {
    const ids = new Set(PAYTABLE.map((p) => p.id));
    for (const id of Object.keys(exactStats().wins)) expect(ids.has(id)).toBe(true);
  });
});

describe("exact odds", () => {
  const stats = exactStats();
  it("enumerates all 8,000 outcomes", () => {
    expect(stats.total).toBe(8000);
  });
  it("returns exactly 92.75% to the player", () => {
    expect(stats.rtp).toBeCloseTo(0.9275, 10);
  });
  it("pays on 1,475 of 8,000 spins", () => {
    expect(Object.values(stats.wins).reduce((a, b) => a + b, 0)).toBe(1475);
    expect(stats.hitRate).toBeCloseTo(1475 / 8000, 10);
  });
  it("has the documented frequency for each prize", () => {
    expect(stats.wins).toEqual({
      seven: 1,
      diamond: 8,
      bar: 27,
      bell: 64,
      cherry3: 125,
      lemon: 125,
      cherry2: 1125,
    });
  });
  it("keeps the house edge positive, so the game is not a money machine", () => {
    expect(stats.rtp).toBeLessThan(1);
  });
  it("small wins are common and the jackpot is rare", () => {
    expect(stats.wins["cherry2"]!).toBeGreaterThan(stats.wins["seven"]! * 100);
  });
});

describe("symbol generation", () => {
  it("always yields legal stops and reaches every stop", () => {
    const seen = new Set<number>();
    let n = 7;
    const rng = () => ((n = (n * 1103515245 + 12345) % 2147483648), n / 2147483648);
    for (let i = 0; i < 3000; i++) {
      for (const stop of drawStops(rng)) {
        expect(Number.isInteger(stop)).toBe(true);
        expect(stop).toBeGreaterThanOrEqual(0);
        expect(stop).toBeLessThan(STOPS);
        seen.add(stop);
      }
    }
    expect(seen.size).toBe(STOPS);
  });
  it("copes with rng edge values", () => {
    expect(drawStops(() => 0)).toEqual([0, 0, 0]);
    expect(drawStops(() => 0.999999999)).toEqual([19, 19, 19]);
    expect(drawStops(() => 1)).toEqual([19, 19, 19]);
  });
  it("the simulated return converges on the documented RTP", () => {
    let n = 12345;
    const rng = () => ((n = (n * 1103515245 + 12345) % 2147483648), n / 2147483648);
    let back = 0;
    const spins = 200000;
    for (let i = 0; i < spins; i++) back += evaluate(lineFor(drawStops(rng)))?.mult ?? 0;
    expect(back / spins).toBeGreaterThan(0.85);
    expect(back / spins).toBeLessThan(1.0);
  });
});

describe("settlement when the spin begins", () => {
  // stop 14 is the lone seven; reel strips are identical, so [14,14,14] is 7-7-7.
  const jackpot = (() => {
    const q = [14, 14, 14].map((i) => (i + 0.5) / STOPS);
    let k = 0;
    return () => q[k++ % 3]!;
  })();
  it("settles the bet and the prize in one go", () => {
    const { state, settlement } = startSpin(idleSpin(), 10, 100, jackpot);
    expect(state.phase).toBe("spinning");
    expect(state.win?.id).toBe("seven");
    expect(settlement).toEqual({ bet: 10, payout: 3000, net: 2990 });
  });
  it("a losing spin settles the stake as lost", () => {
    const losing = (() => {
      const q = [0, 3, 4].map((i) => (i + 0.5) / STOPS); // lemon, lemon, bar
      let k = 0;
      return () => q[k++ % 3]!;
    })();
    const { settlement } = startSpin(idleSpin(), 50, 100, losing);
    expect(settlement).toEqual({ bet: 50, payout: 0, net: -50 });
  });
  it("repeated taps while spinning neither re-roll nor settle again", () => {
    const first = startSpin(idleSpin(), 10, 100, Math.random);
    let st = first.state;
    for (let i = 0; i < 20; i++) {
      const again = startSpin(st, 10, 100, Math.random);
      expect(again.settlement).toBeNull();
      expect(again.state).toBe(st);
      st = again.state;
    }
    expect(st.stops).toEqual(first.state.stops);
    expect(st.spinId).toBe(1);
  });
  it("an interrupted animation (leave or skip) still leaves exactly one settlement", () => {
    let settled = 0;
    const s1 = startSpin(idleSpin(), 10, 100, Math.random);
    if (s1.settlement) settled++;
    let st = finishSpin(s1.state);
    st = finishSpin(st); // finishing twice is harmless
    expect(st.phase).toBe("idle");
    expect(settled).toBe(1);
    const s2 = startSpin(st, 10, 100, Math.random);
    expect(s2.settlement).not.toBeNull();
    expect(s2.state.spinId).toBe(2);
  });
  it("refuses a bet the player cannot afford or a zero bet", () => {
    expect(startSpin(idleSpin(), 200, 100, Math.random).settlement).toBeNull();
    expect(startSpin(idleSpin(), 0, 100, Math.random).settlement).toBeNull();
  });
});
