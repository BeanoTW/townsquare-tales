import { describe, expect, it } from "vitest";
import {
  BALL_R,
  COURT,
  LEVELS,
  METER_PERIOD_MS,
  ballPath,
  evaluateShot,
  flightToRim,
  hoopX,
  idealPower,
  landingX,
  powerAt,
  type Difficulty,
} from "@/lib/basketball";

const levels: Difficulty[] = ["easy", "normal", "hard"];

describe("power meter", () => {
  it("sweeps up then down like a triangle wave", () => {
    expect(powerAt(0)).toBe(0);
    expect(powerAt(METER_PERIOD_MS / 2)).toBeCloseTo(1, 10);
    expect(powerAt(METER_PERIOD_MS)).toBeCloseTo(0, 10);
    expect(powerAt(METER_PERIOD_MS / 4)).toBeCloseTo(0.5, 10);
    expect(powerAt(METER_PERIOD_MS * 3.75)).toBeCloseTo(0.5, 10);
  });
  it("never leaves 0..1, even for odd inputs", () => {
    for (const t of [-500, 0, 1, 123456, 9e6]) {
      expect(powerAt(t)).toBeGreaterThanOrEqual(0);
      expect(powerAt(t)).toBeLessThanOrEqual(1);
    }
  });
});

describe("hoop movement", () => {
  it("stays within its swing and is moving at every difficulty", () => {
    for (const lv of levels) {
      const xs = Array.from({ length: 200 }, (_, i) => hoopX(i * 100, lv));
      expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(LEVELS[lv].amp);
      expect(Math.max(...xs)).toBeLessThanOrEqual(296 + LEVELS[lv].amp + 0.001);
    }
  });
  it("harder levels swing wider and faster", () => {
    expect(LEVELS.hard.amp).toBeGreaterThan(LEVELS.easy.amp);
    expect(LEVELS.hard.periodMs).toBeLessThan(LEVELS.easy.periodMs);
    expect(LEVELS.hard.made).toBeLessThan(LEVELS.easy.made);
  });
});

describe("shot trajectory", () => {
  it("lands further away with more power", () => {
    const a = landingX(0.5)!;
    const b = landingX(0.6)!;
    const c = landingX(0.8)!;
    expect(b).toBeGreaterThan(a);
    expect(c).toBeGreaterThan(b);
  });
  it("a weak shot never reaches the rim height", () => {
    expect(flightToRim(0)).toBeNull();
    expect(landingX(0.1)).toBeNull();
    const shot = evaluateShot(0.1, 0, "normal");
    expect(shot.result).toBe("airball");
    expect(shot.made).toBe(false);
    expect(shot.reason).toMatch(/never reached the rim/);
  });
  it("covers the whole hoop swing with powers the meter can reach", () => {
    for (const lv of levels) {
      for (let t = 0; t < 12000; t += 100) {
        const p = idealPower(t, lv);
        expect(p).toBeGreaterThan(0.3);
        expect(p).toBeLessThan(0.95);
      }
    }
  });
});

describe("scoring a shot", () => {
  it("the ideal power is a clean swish at any moment, on every difficulty", () => {
    for (const lv of levels) {
      for (let t = 0; t < 9000; t += 137) {
        const shot = evaluateShot(idealPower(t, lv), t, lv);
        expect(shot.result).toBe("swish");
        expect(shot.made).toBe(true);
        expect(Math.abs(shot.miss)).toBeLessThan(1.5);
      }
    }
  });
  it("a slightly early or late release is still a rim-in, but a sloppy one misses", () => {
    const lv: Difficulty = "normal";
    const t = 1000;
    const ideal = idealPower(t, lv);
    const px = (dp: number) => evaluateShot(ideal + dp, t, lv);
    expect(px(0.03).made).toBe(true);
    expect(px(-0.03).made).toBe(true);
    expect(px(0.2).made).toBe(false);
    expect(px(-0.2).made).toBe(false);
  });
  it("explains a short shot and a long one differently", () => {
    const t = 1500;
    const ideal = idealPower(t, "normal");
    const short = evaluateShot(ideal - 0.25, t, "normal");
    const long = evaluateShot(ideal + 0.25, t, "normal");
    expect(short.miss).toBeLessThan(0);
    expect(long.miss).toBeGreaterThan(0);
    expect(short.result).toBe("short");
    expect(long.result).toBe("long");
    expect(short.reason).toMatch(/Short by \d+px/);
    expect(long.reason).toMatch(/Long by \d+px/);
  });
  it("rewards leading a moving hoop: the same power scores or misses depending on when it is thrown", () => {
    const lv: Difficulty = "hard";
    const p = idealPower(0, lv);
    const results = new Set<boolean>();
    for (let t = 0; t < 4200; t += 200) results.add(evaluateShot(p, t, lv).made);
    expect(results.has(true)).toBe(true);
    expect(results.has(false)).toBe(true);
  });
  it("easier levels forgive more", () => {
    const t = 800;
    const off = 0.07;
    const made = (lv: Difficulty) => evaluateShot(idealPower(t, lv) + off, t, lv).made;
    expect(made("easy")).toBe(true);
    expect(made("hard")).toBe(false);
  });
  it("tags rim-outs between a make and a clear miss", () => {
    const t = 500;
    const ideal = idealPower(t, "normal");
    const seen = new Set<string>();
    for (let dp = -0.3; dp <= 0.3; dp += 0.005) seen.add(evaluateShot(ideal + dp, t, "normal").result);
    for (const r of ["swish", "rim-in", "rim-out", "short", "long"]) expect(seen.has(r)).toBe(true);
  });
});

describe("ball animation path", () => {
  const path = (p: number, t = 1000, lv: Difficulty = "normal") => ballPath(evaluateShot(p, t, lv));
  it("starts at the shooter's hands and follows a visible arc", () => {
    const pts = path(idealPower(1000, "normal"));
    expect(pts.length).toBeGreaterThan(40);
    expect(pts[0]!.x).toBeGreaterThan(COURT.releaseX);
    const top = Math.min(...pts.map((p) => p.y));
    expect(top).toBeLessThan(COURT.releaseY - 60);
  });
  it("a made shot passes through the hoop centre and ends below the rim", () => {
    const shot = evaluateShot(idealPower(1000, "normal"), 1000, "normal");
    const pts = ballPath(shot);
    const apex = pts.findIndex((p) => p.y === Math.min(...pts.map((q) => q.y)));
    const cross = pts.find((p, i) => i > apex && p.y >= COURT.rimY)!;
    expect(Math.abs(cross.x - shot.hoopAtArrival)).toBeLessThan(10);
    expect(pts.at(-1)!.y).toBeGreaterThan(COURT.rimY + 40);
  });
  it("a miss ends on the floor and never goes through the hoop", () => {
    const shot = evaluateShot(idealPower(1000, "normal") + 0.3, 1000, "normal");
    const pts = ballPath(shot);
    expect(shot.made).toBe(false);
    const last = pts.at(-1)!;
    expect(last.y).toBeGreaterThanOrEqual(COURT.floorY - BALL_R - 1);
  });
  it("is deterministic", () => {
    const a = path(0.6);
    const b = path(0.6);
    expect(a).toEqual(b);
  });
  it("always terminates with a bounded number of frames", () => {
    for (let p = 0; p <= 1; p += 0.05) expect(path(p).length).toBeLessThanOrEqual(240);
  });
});
