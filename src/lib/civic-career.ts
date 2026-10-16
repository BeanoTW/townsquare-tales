import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";

/** The yard builds the Town Hall over the first 30 game days. */
export const TOWN_HALL_OPEN_DAY = 30;
export const townHallBuilt = (s: Pick<GameState, "day">) => s.day >= TOWN_HALL_OPEN_DAY;
export const CIVIC_TITLES = ["Resident", "Community Volunteer", "Town Councillor", "Mayor", "President"] as const;
const SUPPORT_NEEDED = [0, 10, 30, 60, 90] as const;
/** Karma affects political credibility without permanently disqualifying anybody. */
export function civicSupportNeeded(s: GameState, nextStage: number): number {
 const base = SUPPORT_NEEDED[Math.max(0, Math.min(4, nextStage))] ?? 90;
 const penalty = Math.min(30, Math.floor(Math.max(0, -s.karma) / 5));
 const bonus = Math.min(10, Math.floor(Math.max(0, s.karma) / 10));
 return Math.max(0, Math.min(100, base + penalty - bonus));
}

export const civicStatus = (s: GameState): string[] => {
  if (!townHallBuilt(s)) return [
    "Town Hall under construction",
    `Grand opening on day ${TOWN_HALL_OPEN_DAY}. Day ${s.day} of ${TOWN_HALL_OPEN_DAY}.`,
    "The workers' yard remains open during construction.",
  ];
  const stage = Math.max(0, Math.min(4, s.civicStage ?? 0));
  return [
    `Current role: ${CIVIC_TITLES[stage]}`,
    `Community support: ${s.civicSupport ?? 0}/100`,
    stage < 4 ? `Next: ${CIVIC_TITLES[stage + 1]} · ${civicSupportNeeded(s,stage+1)} support (reputation adjusted)` : "You've reached the presidency.",
  ];
};

/** Toy-game fictional civic progression, without real-world party messaging. */
export function civicVolunteerAction(): ActionDef {
  return {
    id: "civic-volunteer", label: "Volunteer on a community project",
    hours: 2, energy: 12, cost: 0,
    resolve: s => !townHallBuilt(s) ? "The Town Hall isn't open yet."
      : s.energy < 12 ? "You need 12 energy."
      : {
        patch: { civicSupport: Math.min(100, (s.civicSupport ?? 0) + 5), energy: s.energy - 12, hour: s.hour + 2 },
        message: "You helped around town. Community support +5.",
      },
  };
}
export function civicRunAction(): ActionDef {
  return {
    id: "civic-run", label: "Stand for the next office", hours: 1, energy: 5, cost: 0,
    resolve: s => {
      if (!townHallBuilt(s)) return "Wait for the Town Hall to open.";
      const stage = Math.max(0, Math.min(4, s.civicStage ?? 0));
      if (stage >= 4) return "You're already President.";
      if ((s.civicSupport ?? 0) < civicSupportNeeded(s,stage+1)) return "Build more community support first.";
      if (s.energy < 5) return "You need 5 energy.";
      return {
        patch: { civicStage: stage + 1, energy: s.energy - 5, hour: s.hour + 1 },
        message: `Your campaign succeeded! New office: ${CIVIC_TITLES[stage + 1]}.`,
      };
    },
  };
}
