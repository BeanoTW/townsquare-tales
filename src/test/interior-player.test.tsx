import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { Home3DStage } from "@/components/home3d/Home3DStage";
import { START } from "@/lib/game-data";
import { venuePlan } from "@/lib/home3d/venues";
import { karmaHeadColor } from "@/lib/player-appearance";

vi.mock("@/components/home3d/HomeScene3D", () => ({
  default: ({ playerHead }: { playerHead: string }) => <div data-testid="character" data-head={playerHead} />,
}));
afterEach(cleanup);

describe("interior player identity", () => {
  it.each(["home", "casino", "bar", "gym"] as const)("passes the same karma colour to the %s character", async (room) => {
    const plan = room === "home" ? undefined : venuePlan(room)!;
    const props = { visible: [], selectedId: null, zone: "living" as const, onSelect: vi.fn(), onDeselect: vi.fn(), onFail: vi.fn(), ...(plan ? { plan } : {}) };
    const view = render(<Home3DStage {...props} state={{ ...START, karma: 30 }} />);
    expect(await screen.findByTestId("character")).toHaveAttribute("data-head", karmaHeadColor(30));
    view.rerender(<Home3DStage {...props} state={{ ...START, karma: -30 }} />);
    expect(screen.getByTestId("character")).toHaveAttribute("data-head", karmaHeadColor(-30));
  });
});
