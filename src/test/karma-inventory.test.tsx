import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { karmaHeadColor, TownMap } from "@/components/TownMap";
import { parseGame } from "@/lib/game-state";
import { START } from "@/lib/game-data";

afterEach(() => cleanup());

describe("karma and inventory movement", () => {
  it("moves smoothly from neutral toward blue or red", () => {
    expect(karmaHeadColor(0)).toBe("rgb(255, 244, 214)");
    expect(karmaHeadColor(30)).toBe("rgb(73, 161, 255)");
    expect(karmaHeadColor(-30)).toBe("rgb(216, 59, 76)");
    expect(karmaHeadColor(15)).not.toBe(karmaHeadColor(30));
  });
  it("colours the player and uses a scaled park gang", () => {
    const view = render(<TownMap hour={12} house={0} karma={-30} active={null} onEnter={vi.fn()} />);
    expect(view.container.querySelector('[data-street-gang] g[transform*="scale(0.55)"]')).toBeInTheDocument();
    expect(view.container.querySelector('circle[fill="rgb(216, 59, 76)"]')).toBeInTheDocument();
  });
  it("equips legacy skateboard saves", () => {
    const saved = parseGame(JSON.stringify({ ...START, skateboard: 1, skateboardEquipped: undefined }), START);
    expect(saved.skateboardEquipped).toBe(1);
  });
});
