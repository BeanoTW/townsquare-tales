import { describe, expect, it } from "vitest";
import { ARCADE_COURT as C, SHOOTOUT_SECONDS, projectCourt, simulateArcadeShot, swipeVelocity } from "./basketball-arcade";

describe("first-person arcade physics", () => {
  it("uses a 30-second primary round", () => expect(SHOOTOUT_SECONDS).toBe(30));
  it("ignores taps and downward drags", () => {
    expect(swipeVelocity(0, 0, 300)).toBeNull();
    expect(swipeVelocity(0, -100, 300)).toBeNull();
  });
  it("a straight medium swipe swishes through the stationary opening", () => {
    const velocity = swipeVelocity(0, 168, 300);
    expect(velocity).not.toBeNull();
    if (!velocity) return;
    const shot = simulateArcadeShot(velocity);
    expect(shot.made).toBe(true);
    expect(shot.swish).toBe(true);
    expect(shot.frames.filter((f) => f.basket)).toHaveLength(1);
  });
  it("horizontal accuracy, distance and speed change the actual flight", () => {
    const side = swipeVelocity(150, 168, 300), weak = swipeVelocity(0, 40, 600), fast = swipeVelocity(0, 168, 100), slow = swipeVelocity(0, 168, 800);
    if (!side || !weak || !fast || !slow) throw new Error("Expected valid swipes");
    expect(simulateArcadeShot(side).made).toBe(false);
    expect(simulateArcadeShot(weak).made).toBe(false);
    expect(fast.z).toBeGreaterThan(slow.z);
  });
  it("every scored shot has a downward crossing inside the clear aperture", () => {
    let made = 0, rim = 0, board = 0, missed = 0;
    for (let up = 60; up <= 290; up += 10) for (let dx = -60; dx <= 60; dx += 10) {
      const v = swipeVelocity(dx, up, 300);
      if (!v) continue;
      const shot = simulateArcadeShot(v);
      expect(shot.made).toBe(shot.frames.some((f) => f.basket));
      if (shot.made) made++; else missed++;
      if (shot.contacts.includes("rim")) rim++;
      if (shot.contacts.includes("board")) board++;
      shot.frames.forEach((f, i) => {
        if (!f.basket) return;
        const previous = shot.frames[i - 1];
        if (!previous) throw new Error("Basket before release");
        expect(f.y).toBeLessThanOrEqual(C.hoop.y);
        expect(previous.y).toBeGreaterThan(C.hoop.y);
        const t = (previous.y - C.hoop.y) / (previous.y - f.y);
        const x = previous.x + (f.x - previous.x) * t, z = previous.z + (f.z - previous.z) * t;
        expect(Math.hypot(x, z - C.hoop.z)).toBeLessThan(C.rimRadius - C.ballRadius - C.rimTube + 0.025);
      });
    }
    expect(made).toBeGreaterThan(0); expect(missed).toBeGreaterThan(0);
    expect(rim).toBeGreaterThan(0); expect(board).toBeGreaterThan(0);
  });
  it("keeps swipe calibration finite across realistic mobile gestures", () => {
    for (const duration of [80, 120, 250, 500, 900]) {
      for (const up of [35, 65, 110, 168, 230, 320]) {
        for (const dx of [-180, -60, 0, 60, 180]) {
          const velocity = swipeVelocity(dx, up, duration);
          expect(velocity).not.toBeNull();
          if (!velocity) continue;
          expect(Object.values(velocity).every(Number.isFinite)).toBe(true);
          const flight = simulateArcadeShot(velocity);
          expect(flight.frames.length).toBeGreaterThan(1);
          expect(flight.made).toBe(flight.frames.some(frame => frame.basket));
        }
      }
    }
  });
  it("is deterministic and perspective makes the ball shrink toward the basket", () => {
    const v = { x: 0, y: 7.09, z: 4.636 };
    expect(simulateArcadeShot(v)).toEqual(simulateArcadeShot(v));
    expect(projectCourt(C.release).radius).toBeGreaterThan(projectCourt(C.hoop).radius);
    expect(simulateArcadeShot(v).frames.length).toBeLessThanOrEqual(181);
  });
});