import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import type { ShopId } from "@/lib/walkable-shops";

export const COUNTERS: Record<ShopId, string> = {
  shop: "checkout",
  pawn: "pawn-counter",
  furniture: "catalogue",
  diner: "counter",
  bar: "bar-counter",
};
const HAUL: Record<ShopId, number> = { shop: 45, pawn: 40, furniture: 65, diner: 30, bar: 55 };
export const weaponName = (s: GameState) =>
  s.weapon === 2
    ? "Heavy bat"
    : s.weapon === 1
      ? "Battered bat"
      : "None";

export function weaponBlock(s: GameState, tier: 1 | 2): string | null {
  if ((s.weapon ?? 0) >= tier) return "Already owned.";
  if (tier === 2 && (s.gangStage < 2 || s.gangRep < 12 || (s.criminalTrust ?? 0) < 30))
    return "The crew are not ready to introduce you to their supplier.";
  if (tier === 2 && s.day < 7) return "The supplier is not around yet.";
  if (tier === 2 && s.str < 25) return "The crew are not convinced you could handle it.";
  if (s.money < (tier === 2 ? 900 : 180)) return `Need $${tier === 2 ? 900 : 180}.`;
  return null;
}
export function buyWeapon(tier: 1 | 2): ActionDef {
  const cost = tier === 2 ? 900 : 180;
  return {
    id: `crew-weapon-${tier}`,
    label: tier === 2 ? "Arrange a heavy bat" : "Buy a battered bat",
    hours: tier === 2 ? 3 : 1,
    energy: tier === 2 ? 20 : 8,
    cost,
    note:
      tier === 2
        ? "Heavy and intimidating. Whether that helps is another question."
        : "Old, battered and unreliable.",
    resolve: (s) => {
      const blocked = weaponBlock(s, tier);
      if (blocked) return blocked;
      return {
        patch: {
          weapon: tier,
          money: s.money - cost,
          heat: Math.min(100, s.heat + (tier === 2 ? 3 : 0)),
        },
        message:
          tier === 2
            ? "The crew finally comes through. Heavy bat acquired. The receipt has understandably gone missing."
            : "Battered bat acquired. It rattles. A cashier would probably offer it counselling.",
      };
    },
  };
}
export function robberyBlock(s: GameState): string | null {
  if ((s.weapon ?? 0) < 1) return "You do not have anything to threaten the cashier with.";
  if (s.tillRobberyDay === s.day)
    return "The town is on alert. Only one till robbery attempt per day.";
  return null;
}
export function robberyChance(s: GameState): number {
  return Math.max(
    0.1,
    Math.min(
      0.8,
      0.12 + Math.min(40, s.str) * 0.004 + Math.min(40, s.cha) * 0.005 + Math.min(100, s.streetSmarts ?? 0) * 0.004 + (s.weapon === 2 ? 0.12 : -0.15) - s.heat * 0.008,
    ),
  );
}
export function robTill(venue: ShopId): ActionDef {
  return {
    id: `rob-till-${venue}`,
    label: "Rob the till",
    hours: 0.5,
    energy: 15,
    note: `Possible haul $${HAUL[venue]} · karma −6 · heat +8–10 · failure can lose up to $20 and 8 extra energy.`,
    resolve: (s, rng) => {
      const blocked = robberyBlock(s);
      if (blocked) return blocked;
      const success = rng() < robberyChance(s);
      return {
        patch: {
          tillRobberyDay: s.day,
          money: success ? Math.min(1e12, s.money + HAUL[venue]) : Math.max(0, s.money - 20),
          karma: Math.max(-1e6, s.karma - 6),
          heat: Math.min(100, s.heat + (success ? 8 : 10)),
          energy: Math.max(0, s.energy - (success ? 15 : 23)),
        },
        message: success
          ? `You flee with $${HAUL[venue]}. The cashier files you under 'customers who will not be getting loyalty points'.`
          : "The cashier hits the alarm. You bolt, trip over a sale sign and drop up to $20. Apparently the discount was on dignity.",
      };
    },
  };
}
