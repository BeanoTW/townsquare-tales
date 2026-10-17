import { BUY_SNACK, buyAlarmAction, buyShoesAction, buyCaffeineAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import {buyLaptopAction,buyDesktopPcAction} from "@/lib/investing";

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
  {id:"caffeine-pill",name:"Caffeine tablet",icon:"💊",price:75,
    description:"Single use. Wake earlier after sleeping; combines with an alarm.",
    category:"Consumable",repeatable:true,action:buyCaffeineAction,
    owned:s=>s.caffeinePills??0,available:s=>(s.caffeinePills??0)<20&&s.money>=75},
  {id:"laptop",name:"Laptop",icon:"💻",price:2500,
    description:"Portable computer for online finances and investments at your home study desk.",
    category:"Equipment",repeatable:false,action:buyLaptopAction,
    owned:s=>s.laptop??0,available:s=>!s.laptop&&s.house>=1&&s.money>=2500},
  {id:"desktop-pc",name:"Desktop PC",icon:"🖥️",price:3200,
    description:"Desktop computer for online tools and investing at your study desk.",
    category:"Equipment",repeatable:false,action:buyDesktopPcAction,
    owned:s=>s.desktopPc??0,available:s=>!s.desktopPc&&s.house>=1&&s.money>=3200},
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
  if (good.id === "caffeine-pill" && (state.caffeinePills??0)>=20) return "Bag full";
  if ((good.id === "laptop" || good.id === "desktop-pc") && state.house<1) return "Requires a studio flat or better";
  if (good.id === "smokes" && state.smokes > 94) return "Bag full";
  if (state.money < good.price) return `Need $${good.price - state.money} more`;
  return good.repeatable ? "Buy" : "Purchase";
}
