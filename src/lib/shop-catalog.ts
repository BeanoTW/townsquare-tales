import { BUY_SNACK, buyAlarmAction, buyShoesAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";

/** The shop uses the same action engine and save fields as the rest of town. */
export type ShopGood = {
  id: string;
  name: string;
  icon: string;
  price: number;
  description: string;
  category: "Consumable" | "Equipment";
  repeatable: boolean;
  action: (state: GameState) => ActionDef;
  owned: (state: GameState) => number;
  available: (state: GameState) => boolean;
};

function refreshment(id: string, name: string, price: number, energy: number): ActionDef {
  return {
    id,
    label: name,
    hours: 0,
    energy: 0,
    cost: price,
    note: `+${energy} energy · ready to use`,
    resolve: (state) =>
      state.money >= price
        ? {
            patch: { money: state.money - price, energy: Math.min(100, state.energy + energy) },
            message: `${name} enjoyed. +${energy} energy.`,
          }
        : `Need $${price} for ${name.toLowerCase()}.`,
  };
}

export const SHOP_GOODS: readonly ShopGood[] = [
  {
    id: "snack",
    name: "Snack pack",
    icon: "🍫",
    price: 10,
    description: "Keep it in your bag. Eat later for +25 energy.",
    category: "Consumable",
    repeatable: true,
    action: () => BUY_SNACK,
    owned: (s) => s.snacks,
    available: (s) => s.snacks < 99 && s.money >= 10,
  },
  {
    id: "pop",
    name: "Fizzy pop",
    icon: "🥤",
    price: 8,
    description: "A sugary lift. Drink now for +18 energy.",
    category: "Consumable",
    repeatable: true,
    action: () => refreshment("fizzy-pop", "Fizzy pop", 8, 18),
    owned: () => 0,
    available: (s) => s.money >= 8,
  },
  {
    id: "sandwich",
    name: "Sandwich",
    icon: "🥪",
    price: 18,
    description: "Eat now for +35 energy.",
    category: "Consumable",
    repeatable: true,
    action: () => refreshment("shop-sandwich", "Sandwich", 18, 35),
    owned: () => 0,
    available: (s) => s.money >= 18,
  },
  {
    id: "coffee",
    name: "Coffee",
    icon: "☕",
    price: 12,
    description: "Drink now for +22 energy.",
    category: "Consumable",
    repeatable: true,
    action: () => refreshment("shop-coffee", "Coffee", 12, 22),
    owned: () => 0,
    available: (s) => s.money >= 12,
  },
  {
    id: "trainers",
    name: "Running shoes",
    icon: "👟",
    price: 150,
    description: "Permanent +35% walking speed while owned.",
    category: "Equipment",
    repeatable: false,
    action: buyShoesAction,
    owned: (s) => s.trainers,
    available: (s) => !s.trainers && s.money >= 150,
  },
  {
    id: "alarm",
    name: "Alarm clock",
    icon: "⏰",
    price: 100,
    description: "Wake an hour earlier every morning.",
    category: "Equipment",
    repeatable: false,
    action: buyAlarmAction,
    owned: (s) => s.alarm,
    available: (s) => !s.alarm && s.money >= 100,
  },
  {
    id: "smokes", name: "Smokes (pack of 5)", icon: "🚬", price: 25,
    description: "Five smokes for your inventory. A dubious purchase.",
    category: "Consumable", repeatable: true,
    action: () => ({ id: "buy-smokes", label: "Buy smokes", hours: 0, energy: 0, cost: 25,
      resolve: (s) => s.money < 25 ? "Need $25." : s.smokes > 94 ? "You cannot carry any more." : ({ patch: { money: s.money-25, smokes: s.smokes+5 }, message: "Five smokes added to your bag." }) }),
    owned: (s) => s.smokes, available: (s) => s.money >= 25 && s.smokes <= 94,
  }
];

export function shopAvailability(good: ShopGood, state: GameState): string {
  if (!good.repeatable && good.owned(state)) return "Already owned";
  if (good.id === "snack" && state.snacks >= 99) return "Bag full";
  if (good.id === "smokes" && state.smokes > 94) return "Bag full";
  if (state.money < good.price) return `Need $${good.price - state.money} more`;
  return good.repeatable ? "Buy" : "Purchase";
}
