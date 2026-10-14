import { describe, expect, it } from "vitest";
import { simulateFlight } from "./basketball-physics";
import { ballPath, evaluatePhysicalShot, powerAt } from "./basketball";

const base = {
  releaseX: 84, releaseY: 212, floorY: 268, rimY: 118,
  radius: 9, rimHalf: 22, gravity: 900,
  speed: 500, angle: Math.PI / 3, hoopX: 296,
};

describe("basketball physics", () => {
  it("is deterministic for the same launch", () => {
    const first = simulateFlight(base);
    expect(simulateFlight(base)).toEqual(first);
    expect(first.frames.length).toBeGreaterThan(15);
  });

  it("never moves the ball below the court floor", () => {
    const flight = simulateFlight(base);
    expect(flight.frames.every((p) => p.y <= base.floorY - base.radius + 0.01)).toBe(true);
  });

  it("registers a backboard impact from the left", () => {
    const flight = simulateFlight({
      ...base, releaseX: 302, releaseY: 85, speed: 150, angle: 0,
    });
    expect(flight.contacts).toContain("backboard");
  });

  it("detects a front rim impact", () => {
    const flight = simulateFlight({
      ...base, releaseX: 274, releaseY: 80, speed: 0, angle: 0,
    });
    expect(flight.contacts).toContain("front-rim");
  });

  it("detects a downward net crossing", () => {
    const flight = simulateFlight({
      ...base, releaseX: 296, releaseY: 75, speed: 0, angle: 0,
    });
    expect(flight.crossedNet).toBe(true);
  });
});

describe("basketball scoring integration", () => {
  it("agrees with the simulated shot crossing for varied powers", () => {
    for (let i = 0; i <= 20; i++) {
      const power = i / 20;
      const releaseMs = 1200;
      const shot = evaluatePhysicalShot(power, releaseMs, "normal");
      const frames = ballPath(shot);
      expect(frames.length).toBeGreaterThan(0);
      const simulation = simulateFlight({
        ...base, speed: 380 + power * 320, hoopX: shot.hoopAtArrival,
      });
      expect(shot.made).toBe(simulation.crossedNet);
    }
  });
});
