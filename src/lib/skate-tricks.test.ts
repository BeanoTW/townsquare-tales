import { describe, expect, it } from "vitest";
import { deckRotation, elevation, stepJump, trickLabel } from "./skate-tricks";
describe("overworld skateboard tricks", () => {
  it("rises and lands on the same plane", () => {
    const jump = { trick: "ollie" as const, elapsed: 0 };
    expect(elevation(jump)).toBe(0);
    expect(elevation({ ...jump, elapsed: .175 })).toBeCloseTo(18);
    expect(elevation({ ...jump, elapsed: .35 })).toBe(0);
    expect(stepJump(jump, .35)).toBeNull();
  });
  it("keeps rider orientation separate from board trick rotation", () => {
    expect(deckRotation({ trick: "shuvit", elapsed: .175 })).toBe(90);
    expect(deckRotation({ trick: "ollie", elapsed: .175 })).toBe(0);
    expect(trickLabel("kickflip")).toBe("KICKFLIP!");
  });
});
