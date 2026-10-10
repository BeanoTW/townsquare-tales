import { CAREERS, missingRequirements, nextRole, shiftReward } from "@/lib/careers";
import { sleepOutcome, timeLabel } from "@/lib/day-cycle";
import { FURNITURE, ownsFurniture, type FurnitureId } from "@/lib/furniture";
import { HOUSES, SCHOOLS } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";

/**
 * Every game action is a pure rule: it reads the state, returns either a failure
 * message or a patch. `runAction` owns the shared checks (energy, time, changes),
 * so the interior UI cannot drift from the rules the tests cover.
 */
export type Patch = Partial<GameState>;
export type Resolution = string | { patch: Patch; message: string };
export type Rng = () => number;

export type ActionDef = {
  id: string;
  label: string;
  /** Hours consumed from today. */
  hours: number;
  /** Energy required and spent (overridden when the outcome sets energy itself). */
  energy: number;
  /** Cash price, shown before confirming. */
  cost?: number | undefined;
  /** Short status line, e.g. "Owned" or a benefit. */
  note?: string | undefined;
  resolve: (s: GameState, rng: Rng) => Resolution;
};

export type ActionResult =
  | { ok: false; message: string }
  | { ok: true; next: GameState; message: string; hoursUsed: number; changes: string[] };

const LABELS: [keyof GameState, string][] = [
  ["money", "Cash"],
  ["bank", "Savings"],
  ["xp", "Work XP"],
  ["int", "Intelligence"],
  ["cha", "Charm"],
  ["str", "Strength"],
  ["energy", "Energy"],
  ["karma", "Karma"],
  ["heat", "Heat"],
  ["school", "Education"],
  ["job", "Job"],
  ["career", "Career"],
  ["house", "Housing"],
  ["snacks", "Snacks"],
];

const clampEnergy = (n: number) => Math.max(0, Math.min(100, n));

export function runAction(s: GameState, def: ActionDef, rng: Rng = Math.random): ActionResult {
  if (s.energy < def.energy) {
    return {
      ok: false,
      message: `Not enough energy: need ${def.energy}, have ${s.energy}. Rest or eat first.`,
    };
  }
  if (s.hour + def.hours > 24) {
    return {
      ok: false,
      message: `Not enough time: ${def.hours}h required, only ${24 - s.hour}h left today.`,
    };
  }
  const resolved = def.resolve(s, rng);
  if (typeof resolved === "string") return { ok: false, message: resolved };

  const { patch, message } = resolved;
  const next: GameState = {
    ...s,
    ...patch,
    hour: patch.hour ?? s.hour + def.hours,
    energy: clampEnergy(patch.energy ?? s.energy - def.energy),
  };

  const changes = LABELS.flatMap(([key, label]) => {
    const value = patch[key];
    if (typeof value !== "number" || value === s[key]) return [];
    const delta = value - (s[key] as number);
    return [`${label}: ${delta > 0 ? "+" : ""}${delta}`];
  });
  if (def.hours && def.energy && patch.energy === undefined) changes.push(`Energy: -${def.energy}`);

  return { ok: true, next, message, hoursUsed: def.hours, changes };
}

/* ---------- Home ---------- */

export const HOME_WORKOUT: ActionDef = {
  id: "home-workout",
  label: "Home workout",
  hours: 2,
  energy: 18,
  resolve: (s) => ({ patch: { str: s.str + 2 }, message: "Home gym session. +2 strength." }),
};
export const STUDY_DESK: ActionDef = {
  id: "study-desk",
  label: "Study at desk",
  hours: 2,
  energy: 12,
  resolve: (s) => ({ patch: { int: s.int + 2 }, message: "Quiet study session. +2 intelligence." }),
};
export const COOK_AT_HOME: ActionDef = {
  id: "cook",
  label: "Cook dinner",
  hours: 1,
  energy: 0,
  cost: 5,
  note: "+40 energy",
  resolve: (s) =>
    s.money >= 5
      ? {
          patch: { money: s.money - 5, energy: Math.min(100, s.energy + 40) },
          message: "Homemade dinner! +40 energy.",
        }
      : "Need $5 for ingredients.",
};
export const RELAX_SOFA: ActionDef = {
  id: "relax",
  label: "Relax on the sofa",
  hours: 1,
  energy: 0,
  resolve: (s) => ({
    patch: { cha: s.cha + 2 },
    message: "You feel surprisingly sociable. +2 charm.",
  }),
};

export function sleepAction(s: GameState): ActionDef {
  const wake = sleepOutcome(s).hour;
  return {
    id: "sleep",
    label: `Sleep · wake around ${timeLabel(wake)}`,
    hours: 0,
    energy: 0,
    note: "Ends the day",
    resolve: (st) => {
      const rested = sleepOutcome(st);
      return {
        patch: {
          hour: rested.hour,
          energy: rested.energy,
          day: st.day + 1,
          bank: Math.min(1e12, st.bank + Math.floor(st.bank * 0.001)),
          heat: Math.max(0, st.heat - 1),
        },
        message: `Day ${st.day + 1}. You wake at ${timeLabel(rested.hour)} in your ${HOUSES[st.house]?.name ?? "home"} with ${rested.energy} energy.`,
      };
    },
  };
}

export function buyHouseAction(s: GameState): ActionDef {
  const next = HOUSES[s.house + 1];
  return {
    id: "buy-house",
    label: `Buy ${next?.name ?? "a new home"}`,
    hours: 0,
    energy: 0,
    cost: next?.cost,
    resolve: (st) => {
      const target = HOUSES[st.house + 1];
      if (!target) return "You already own the best home.";
      return st.money >= target.cost
        ? {
            patch: { money: st.money - target.cost, house: st.house + 1 },
            message: `You moved into a ${target.name}!`,
          }
        : "Not enough cash.";
    },
  };
}

export function furnitureAction(id: FurnitureId, s: GameState): ActionDef {
  const item = FURNITURE.find((i) => i.id === id);
  const owned = ownsFurniture(s.furniture, id);
  return {
    id: `furniture-${id}`,
    label: item?.name ?? id,
    hours: 0,
    energy: 0,
    cost: item?.cost,
    note: owned ? "Owned · set up at home" : item?.benefit,
    resolve: (st) => {
      if (!item) return "That item is not for sale.";
      if (ownsFurniture(st.furniture, id)) return "You already own that. It is set up at home.";
      if (st.money < item.cost) return `Need ${item.cost} cash.`;
      return {
        patch: { money: st.money - item.cost, furniture: st.furniture | item.bit },
        message: `${item.name} delivered! Check your home.`,
      };
    },
  };
}

/* ---------- Gym & school ---------- */

export const LIFT_WEIGHTS: ActionDef = {
  id: "lift",
  label: "Lift weights",
  hours: 2,
  energy: 20,
  cost: 5,
  note: "+3 strength",
  resolve: (s) =>
    s.money >= 5
      ? { patch: { money: s.money - 5, str: s.str + 3 }, message: "+3 strength. Swole." }
      : "Gym costs $5.",
};
export const JOG: ActionDef = {
  id: "jog",
  label: "Jog outside",
  hours: 2,
  energy: 25,
  note: "+1 strength",
  resolve: (s) => ({ patch: { str: s.str + 1 }, message: "+1 strength." }),
};
export const STUDY_LIBRARY: ActionDef = {
  id: "library",
  label: "Study in the library",
  hours: 2,
  energy: 15,
  note: "+1 intelligence",
  resolve: (s) => ({ patch: { int: s.int + 1 }, message: "+1 intelligence." }),
};

export function enrollAction(s: GameState): ActionDef | null {
  const target = SCHOOLS[s.school + 1];
  if (!target) return null;
  const cost = (s.school + 1) * 100;
  return {
    id: "enroll",
    label: `Enrol: ${target}`,
    hours: 4,
    energy: 30,
    cost,
    note: "+10 intelligence",
    resolve: (st) => {
      const nextLevel = SCHOOLS[st.school + 1];
      if (!nextLevel) return "No further qualifications.";
      return st.money >= cost
        ? {
            patch: { money: st.money - cost, school: st.school + 1, int: st.int + 10 },
            message: `Graduated: ${nextLevel}! +10 int`,
          }
        : "Tuition too high.";
    },
  };
}

/* ---------- Bar, bank, shop, diner, pawn ---------- */

export const BUY_ROUND: ActionDef = {
  id: "round",
  label: "Buy a round",
  hours: 2,
  energy: 10,
  cost: 15,
  note: "+3 charm",
  resolve: (s) =>
    s.money >= 15
      ? { patch: { money: s.money - 15, cha: s.cha + 3 }, message: "Everyone loves you. +3 charm" }
      : "Can't afford it.",
};
export const CHAT_UP: ActionDef = {
  id: "chat-up",
  label: "Chat someone up",
  hours: 2,
  energy: 10,
  note: "Risky · charm helps",
  resolve: (s, rng) =>
    rng() * 60 < s.cha
      ? { patch: { cha: s.cha + 2 }, message: "They gave you their number! +2 charm" }
      : { patch: { cha: s.cha + 1 }, message: "Rejected. Character building. +1 charm" },
};

/** Any whole-dollar transfer amount, without changing the save schema. */
export function bankTransferAction(kind: "deposit" | "withdraw", amount: number): ActionDef {
  return {
    id: `bank-${kind}-${amount}`,
    label: `${kind === "deposit" ? "Deposit" : "Withdraw"} ${amount}`,
    hours: 0,
    energy: 0,
    resolve: (s) => {
      if (!Number.isSafeInteger(amount) || amount <= 0) return "Enter a positive whole-dollar amount.";
      if (kind === "deposit") {
        if (s.money < amount) return "Not enough cash to deposit.";
        return {
          patch: { money: s.money - amount, bank: s.bank + amount },
          message: `Deposited ${amount}. Your savings are growing.`,
        };
      }
      if (s.bank < amount) return "Not enough savings to withdraw.";
      return {
        patch: { bank: s.bank - amount, money: s.money + amount },
        message: `Withdrew ${amount}. Cash ready to spend.`,
      };
    },
  };
}

export const DEPOSIT_50: ActionDef = {
  id: "deposit-50",
  label: "Deposit $50",
  hours: 0,
  energy: 0,
  cost: 50,
  resolve: (s) =>
    s.money >= 50
      ? {
          patch: { money: s.money - 50, bank: s.bank + 50 },
          message: "Deposited $50. Savings earn 0.1% per night.",
        }
      : "You need $50 cash.",
};
export const DEPOSIT_ALL: ActionDef = {
  id: "deposit-all",
  label: "Deposit all cash",
  hours: 0,
  energy: 0,
  resolve: (s) =>
    s.money > 0
      ? { patch: { bank: s.bank + s.money, money: 0 }, message: "Your cash is safe in the bank." }
      : "No cash to deposit.",
};
export const WITHDRAW_50: ActionDef = {
  id: "withdraw-50",
  label: "Withdraw $50",
  hours: 0,
  energy: 0,
  resolve: (s) =>
    s.bank >= 50
      ? { patch: { money: s.money + 50, bank: s.bank - 50 }, message: "Withdrew $50." }
      : "Not enough savings.",
};
export const WITHDRAW_ALL: ActionDef = {
  id: "withdraw-all",
  label: "Withdraw all savings",
  hours: 0,
  energy: 0,
  resolve: (s) =>
    s.bank > 0
      ? { patch: { money: s.money + s.bank, bank: 0 }, message: "Withdrew your savings." }
      : "No savings to withdraw.",
};

export const BUY_SNACK: ActionDef = {
  id: "snack",
  label: "Snack",
  hours: 0,
  energy: 0,
  cost: 10,
  note: "+1 to your bag",
  resolve: (s) =>
    s.money >= 10 && s.snacks < 99
      ? {
          patch: { money: s.money - 10, snacks: s.snacks + 1 },
          message: "Bought a snack. Open Player to eat it.",
        }
      : "Need $10 and room in your bag.",
};
export const EAT_SNACK: ActionDef = {
  id: "eat-snack",
  label: "Eat snack",
  hours: 0,
  energy: 0,
  note: "+25 energy",
  resolve: (s) =>
    s.snacks > 0
      ? {
          patch: { snacks: s.snacks - 1, energy: Math.min(100, s.energy + 25) },
          message: "Ate a snack. +25 energy.",
        }
      : "No snacks left.",
};

export function buyShoesAction(s: GameState): ActionDef {
  return {
    id: "buy-shoes",
    label: "Running shoes",
    hours: 0,
    energy: 0,
    cost: 150,
    note: s.trainers ? "Owned" : "Walk 35% faster",
    resolve: (st) =>
      !st.trainers && st.money >= 150
        ? { patch: { money: st.money - 150, trainers: 1 }, message: "New shoes! Walk 35% faster." }
        : "Already owned or not enough cash.",
  };
}
export function buyAlarmAction(s: GameState): ActionDef {
  return {
    id: "buy-alarm",
    label: "Alarm clock",
    hours: 0,
    energy: 0,
    cost: 100,
    note: s.alarm ? "Owned" : "Wake an hour earlier",
    resolve: (st) =>
      !st.alarm && st.money >= 100
        ? {
            patch: { money: st.money - 100, alarm: 1 },
            message: "You now wake at 7:00, gaining an extra hour.",
          }
        : "Already owned or not enough cash.",
  };
}

/** Food is the main interaction at the diner, independent of employment. */
export function dinerMealAction(id: "soup" | "breakfast"): ActionDef {
  const meal = id === "soup"
    ? { label: "Soup & bread", cost: 9, recovery: 22 }
    : { label: "Big breakfast", cost: 26, recovery: 65 };
  return {
    id: `diner-${id}`,
    label: meal.label,
    hours: 1,
    energy: 0,
    cost: meal.cost,
    note: `+${meal.recovery} energy`,
    resolve: (s) => s.money < meal.cost
      ? `Need ${meal.cost} for ${meal.label.toLowerCase()}.`
      : {
          patch: { money: s.money - meal.cost, energy: Math.min(100, s.energy + meal.recovery) },
          message: `${meal.label} enjoyed! You feel much better.`,
        },
  };
}

export const LUNCH_SHIFT: ActionDef = {
  id: "lunch-shift",
  label: "Lunch rush shift",
  hours: 4,
  energy: 30,
  note: "$40 flat · +1 karma",
  resolve: (s) => ({
    patch: { money: s.money + 40, karma: s.karma + 1 },
    message: "Busy shift. Earned $40.",
  }),
};
export const HOT_MEAL: ActionDef = {
  id: "hot-meal",
  label: "Hot meal",
  hours: 1,
  energy: 0,
  cost: 18,
  note: "+45 energy",
  resolve: (s) =>
    s.money >= 18
      ? {
          patch: { money: s.money - 18, energy: Math.min(100, s.energy + 45) },
          message: "Proper meal! +45 energy.",
        }
      : "Not enough cash.",
};

export const SELL_SHOES: ActionDef = {
  id: "sell-shoes",
  label: "Sell running shoes",
  hours: 0,
  energy: 0,
  note: "$70",
  resolve: (s) =>
    s.trainers
      ? { patch: { trainers: 0, money: s.money + 70 }, message: "Sold shoes for $70." }
      : "Nothing to sell.",
};
export const SELL_ALARM: ActionDef = {
  id: "sell-alarm",
  label: "Sell alarm clock",
  hours: 0,
  energy: 0,
  note: "$45",
  resolve: (s) =>
    s.alarm
      ? { patch: { alarm: 0, money: s.money + 45 }, message: "Sold clock for $45." }
      : "Nothing to sell.",
};

/* ---------- Casino, alley, depot, police, clinic ---------- */

export const SLOTS: ActionDef = {
  id: "slots",
  label: "Play slots",
  hours: 1,
  energy: 5,
  cost: 50,
  note: "28% chance to win $100",
  resolve: (s, rng) =>
    s.money < 50
      ? "Need $50."
      : rng() < 0.28
        ? { patch: { money: s.money + 100 }, message: "Jackpot! +$100 net." }
        : { patch: { money: s.money - 50 }, message: "The house wins. -$50." },
};
export const HIGH_DICE: ActionDef = {
  id: "high-dice",
  label: "High-stakes dice",
  hours: 1,
  energy: 5,
  cost: 200,
  note: "45% chance to win $200",
  resolve: (s, rng) =>
    s.money < 200
      ? "Need $200."
      : rng() < 0.45
        ? { patch: { money: s.money + 200 }, message: "Lucky roll! +$200." }
        : { patch: { money: s.money - 200 }, message: "Snake eyes. -$200." },
};
export const SELL_GOODS: ActionDef = {
  id: "sell-goods",
  label: "Sell sketchy goods",
  hours: 2,
  energy: 15,
  note: "Risk of a bust rises with heat",
  resolve: (s, rng) => {
    if (rng() < Math.min(0.9, 0.15 + s.heat * 0.05)) {
      return {
        patch: { money: Math.floor(s.money / 2), heat: 0, karma: s.karma - 3 },
        message: "BUSTED! Cops take half your cash.",
      };
    }
    const earned = 40 + s.cha * 2;
    return {
      patch: { money: s.money + earned, karma: s.karma - 3, heat: s.heat + 1 },
      message: `Made $${earned}. -3 karma`,
    };
  },
};
export const MUG: ActionDef = {
  id: "mug",
  label: "Mug someone",
  hours: 1,
  energy: 20,
  note: "+$60 · -8 karma · may backfire",
  resolve: (s, rng) =>
    s.str > 15 + rng() * 30
      ? {
          patch: { money: s.money + 60, karma: s.karma - 8, heat: s.heat + 2 },
          message: "+$60. You monster. -8 karma",
        }
      : { patch: { energy: 0 }, message: "They fought back. You're knocked out." },
};
export const ALLEY_DICE: ActionDef = {
  id: "alley-dice",
  label: "Dice in the alley",
  hours: 1,
  energy: 5,
  cost: 20,
  resolve: (s, rng) =>
    s.money < 20
      ? "Need $20."
      : rng() < 0.45
        ? { patch: { money: s.money + 20 }, message: "Won $20!" }
        : { patch: { money: s.money - 20 }, message: "Lost $20." },
};

export const CHECK_DEPARTURES: ActionDef = {
  id: "departures",
  label: "Check departures",
  hours: 0,
  energy: 0,
  resolve: () => ({
    patch: {},
    message: "No routes out of town yet. New destinations coming soon.",
  }),
};

export const PAY_FINE: ActionDef = {
  id: "fine",
  label: "Pay $100 fine",
  hours: 1,
  energy: 0,
  cost: 100,
  note: "-3 heat",
  resolve: (s) =>
    s.heat > 0 && s.money >= 100
      ? {
          patch: { money: s.money - 100, heat: Math.max(0, s.heat - 3) },
          message: "Fine settled; heat reduced.",
        }
      : "Need $100 and an outstanding record.",
};

export const CLINIC_RECOVERY: ActionDef = {
  id: "recovery",
  label: "Medical recovery",
  hours: 1,
  energy: 0,
  cost: 40,
  note: "Restores all energy",
  resolve: (s) =>
    s.money >= 40
      ? { patch: { money: s.money - 40, energy: 100 }, message: "Back on your feet!" }
      : "Treatment costs $40.",
};

/* ---------- Careers ---------- */

export function shiftAction(s: GameState): ActionDef {
  const reward = shiftReward(s);
  return {
    id: "shift",
    label: `Work 4h shift · +$${reward.money}`,
    hours: 4,
    energy: 30,
    note: `${reward.role} · +4 work XP`,
    resolve: (st) => {
      const r = shiftReward(st);
      return {
        patch: { money: st.money + r.money, xp: st.xp + r.xp, karma: st.karma + r.karma },
        message: `Earned ${r.money} as ${r.role}. +4 work XP.`,
      };
    },
  };
}

export const PROMOTE: ActionDef = {
  id: "promote",
  label: "Request promotion",
  hours: 1,
  energy: 5,
  resolve: (s) => {
    const upcoming = nextRole(s);
    if (!upcoming) return "Already at the top of your profession.";
    const missing = missingRequirements(s, upcoming);
    return missing.length
      ? `Promotion requires: ${missing.join(", ")}.`
      : {
          patch: { job: s.job + 1 },
          message: `Promoted to ${upcoming.name}! New wage ${upcoming.pay}/hour.`,
        };
  },
};

export function applyAction(index: number): ActionDef {
  const field = CAREERS[index];
  const entry = field?.roles[0];
  return {
    id: `apply-${index}`,
    label: `Apply: ${entry?.name ?? "entry role"}`,
    hours: 1,
    energy: 5,
    note: entry ? `$${entry.pay}/hour · entry level` : undefined,
    resolve: (s) => {
      if (!field) return "No such vacancy.";
      if (s.career === index) return `You're already employed in ${field.name}.`;
      return {
        patch: { career: index, job: 0, xp: Math.floor(s.xp / 4) },
        message: `Hired as ${entry?.name ?? field.name}! Some experience transferred.`,
      };
    },
  };
}
