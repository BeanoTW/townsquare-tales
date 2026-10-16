import { requiresMainsPower } from "@/lib/home-zones";
import { CAREERS, missingRequirements, nextRole, shiftReward } from "@/lib/careers";
import { sleepOutcome, timeLabel } from "@/lib/day-cycle";
import { FURNITURE, LUXURY_FURNITURE, ownsFurniture, type FurnitureId } from "@/lib/furniture";
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
  ["gangRep", "Gang reputation"],
  ["relMara", "Mara relationship"],
  ["relNox", "Nox relationship"],
  ["relGus", "Gus relationship"],
  ["relIvy", "Ivy relationship"],
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
  // Keep any single action from awarding more than +2 to a core attribute.
  for (const stat of ["str", "int", "cha"] as const) {
    if (typeof patch[stat] === "number") patch[stat] = Math.min(patch[stat]!, s[stat] + 2);
  }
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
/** Each qualification adds one intelligence point to every study session. */
export const studyGain = (base: number, school: number) => Math.min(2, base + Math.max(0, Math.min(4, Math.trunc(school))));
/** Cumulative study XP milestones for High School, College, University and PhD. */
export const EDUCATION_XP_REQUIRED = [0, 20, 60, 120, 200] as const;

export const STUDY_DESK: ActionDef = {
  id: "study-desk",
  label: "Study at desk",
  hours: 2,
  energy: 12,
  resolve: (s) => ({ patch: { int: s.int + studyGain(2, s.school), studyXp: (s.studyXp ?? 0) + 4 }, message: `Quiet study session. +${studyGain(2, s.school)} intelligence, +4 Study XP.` }),
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
    patch: { energy: Math.min(100, s.energy + 15) },
    message: "You unwind on the sofa. +15 energy (up to 100)."
  }),
};

export function sleepAction(s: GameState): ActionDef {
  const wake = sleepOutcome(s).hour;
  return {
    id: "sleep",
    label: `Sleep · wake around ${timeLabel(wake)}`,
    hours: 0,
    energy: 0,
    note: (s.caffeinePills ?? 0)>0 ? "Use 1 caffeine pill for a two-hour wake-up boost" : "Ends the day",
    resolve: (st) => {
      const rested = sleepOutcome(st);
      return {
        patch: {
          hour: rested.hour,
          energy: rested.energy,
          caffeinePills: (st.caffeinePills ?? 0)>0 ? (st.caffeinePills ?? 0)-1 : (st.caffeinePills ?? 0),
          day: st.day + 1,
          bank: Math.min(1e12, st.bank + Math.floor(st.bank * 0.001)),
          // Loans have a fixed 40% borrowing charge; only overdue debt incurs additional penalties.
          loanDebt: (st.loanDueDay ?? 0) > 0 && st.day + 1 > (st.loanDueDay ?? 0)
            ? Math.min(1000000, (st.loanDebt ?? 0) + Math.ceil((st.loanDebt ?? 0) * 0.02))
            : st.loanDebt ?? 0,
          loanLastDay: st.day + 1,
          heat: Math.max(0, st.heat - 1),
          ...(() => {
            const weekly = housingWeeklyCost(st);
            if (!weekly || (st.day + 1 - (st.housingLastPaidDay ?? st.day)) < 7) return {};
            const due = st.housingMode === 2 ? Math.min(weekly, st.mortgageBalance ?? 0) + (st.housingArrears ?? 0) : weekly + (st.housingArrears ?? 0);
            const paid = Math.min(st.money, due);
            const remaining = Math.max(0, due - paid);
            const loan = st.housingMode === 2 ? Math.max(0, (st.mortgageBalance ?? 0) - Math.max(0, paid)) : 0;
            const settled = st.housingMode === 2 && loan === 0 && remaining === 0;
            return {
              money: st.money - paid,
              housingArrears: remaining,
              housingLastPaidDay: st.day + 1,
              mortgageBalance: loan,
              ...(settled ? { housingMode: 0, ownedHomes: (st.ownedHomes ?? ((1 << (st.house + 1)) - 1)) | (1 << st.housingTier!) } : {}),
            };
          })(),
        },
        message: `Day ${st.day + 1}. You wake at ${timeLabel(rested.hour)} in your ${HOUSES[st.house]?.name ?? "home"} with ${rested.energy} energy.`,
      };
    },
  };
}

/** Purchase any property tier directly; owned homes can be selected again for free. */
export function buyHouseAction(s: GameState, tier = Math.min(4, s.house + 1)): ActionDef {
  const property = HOUSES[tier];
  const owned = Boolean(((s.ownedHomes ?? ((1 << (s.house + 1)) - 1)) & (1 << tier)));
  return {
    id: `buy-house-${tier}`,
    label: owned ? `Move into ${property?.name ?? "home"}` : `Buy ${property?.name ?? "home"}`,
    hours: 0,
    energy: 0,
    cost: owned ? 0 : property?.cost,
    resolve: (st) => {
      const target = HOUSES[tier];
      if (!target || tier < 1) return "That property is not available.";
      const mask = st.ownedHomes ?? ((1 << (st.house + 1)) - 1);
      const alreadyOwned = Boolean(mask & (1 << tier));
      if (st.housingMode === 1 && (st.housingArrears ?? 0) > 0) return "Clear outstanding rent before purchasing a new home.";
      if (!alreadyOwned && st.money < target.cost) return "Not enough cash.";
      if (st.housingMode === 2 && (st.mortgageBalance ?? 0) > 0) return "Pay off your existing mortgage first.";
      return {
        patch: { money: st.money - (alreadyOwned ? 0 : target.cost), house: tier, ownedHomes: mask | (1 << tier), housingMode: 0, housingTier: 0, mortgageBalance: 0, housingArrears: 0 },
        message: alreadyOwned ? `Moved into your ${target.name}.` : `You bought a ${target.name}!`,
      };
    },
  };
}

/** A weekly payment is due every seven days spent in rented/mortgaged housing.
 * Arrears are recorded explicitly; the balance never silently disappears. */
export function housingWeeklyCost(s: GameState): number {
  if (s.housingMode === 1) return s.housingTier === 1 ? 300 : 900;
  if (s.housingMode === 2 && (s.mortgageBalance ?? 0) > 0) return s.housingTier === 1 ? 220 : 650;
  return 0;
}
export function housingAction(s: GameState, tier: 1 | 2, mode: 1 | 2): ActionDef {
  const home = HOUSES[tier];
  const weekly = mode === 1 ? (tier === 1 ? 300 : 900) : (tier === 1 ? 220 : 650);
  const deposit = mode === 1 ? weekly : Math.floor(home.cost * 0.2);
  return {
    id: `housing-${mode}-${tier}`,
    label: `${mode === 1 ? "Rent" : "Mortgage"} ${home.name} · ${deposit} upfront`,
    hours: 0, energy: 0, cost: deposit,
    note: `${weekly} every 7 days${mode === 2 ? " · 20% deposit" : ""}`,
    resolve: st => {
      if (st.housingMode === 1 && (st.housingArrears ?? 0) > 0) return "Clear outstanding rent before changing homes.";
      if (st.housingMode === mode && st.housingTier === tier) return "You already have this housing agreement.";
      if (st.money < deposit) return "Not enough cash for the deposit.";
      if (st.housingMode && (st.mortgageBalance ?? 0) > 0)
        return "Settle your existing mortgage before switching housing.";
      return {
        patch: {
          money: st.money - deposit, house: tier, housingMode: mode,
          ownedHomes: st.ownedHomes ?? ((1 << (st.house + 1)) - 1),
          housingTier: tier, mortgageBalance: mode === 2 ? home.cost - deposit : 0,
          housingLastPaidDay: st.day, housingArrears: 0,
        },
        message: `${mode === 1 ? "Rented" : "Mortgaged"} ${home.name}. Weekly payment ${weekly}.`,
      };
    },
  };
}

export function furnitureAction(id: FurnitureId, s: GameState, luxury = false): ActionDef {
  const item = (luxury ? LUXURY_FURNITURE : FURNITURE).find((i) => i.id === id);
  const owned = ownsFurniture(luxury ? s.luxuryFurniture ?? 0 : s.furniture, id);
  return {
    id: `furniture-${luxury ? "luxury-" : ""}${id}`,
    label: item?.name ?? id,
    hours: 0,
    energy: 0,
    cost: item?.cost,
    note: owned ? "Owned · set up at home" : item?.benefit,
    resolve: (st) => {
      if (!item) return "That item is not for sale.";
      if (st.house < 1 && requiresMainsPower(id)) return "Requires Studio Flat or better (mains power and space).";
      if (ownsFurniture(luxury ? st.luxuryFurniture ?? 0 : st.furniture, id)) return "You already own that. It is set up at home.";
      if (st.money < item.cost) return `Need ${item.cost} cash.`;
      return {
        patch: { money: st.money - item.cost, furniture: st.furniture | item.bit,
          ...(luxury ? { luxuryFurniture: (st.luxuryFurniture ?? 0) | item.bit } : {}) },
        message: `${item.name} delivered! Check your home.`,
      };
    },
  };
}

/** Television channels offer small repeatable gains at the cost of time and energy. */
export const TV_CHANNELS = [
  { id: "science", name: "Brain Box · science", stat: "int", gain: 2, energy: 8, hours: 2, description: "+2 intelligence" },
  { id: "fitness", name: "Pump TV · fitness", stat: "str", gain: 1, energy: 12, hours: 2, description: "+1 strength" },
  { id: "social", name: "Drama Hour · social", stat: "cha", gain: 1, energy: 8, hours: 2, description: "+1 charm" },
  { id: "comedy", name: "Laugh Track · comedy", stat: "cha", gain: 1, energy: 8, hours: 2, description: "+1 charm" },
  { id: "career", name: "Business Tonight · career", stat: "xp", gain: 3, energy: 10, hours: 2, description: "+3 work XP" },
] as const;

export function watchTvAction(id: (typeof TV_CHANNELS)[number]["id"]): ActionDef {
  const channel = TV_CHANNELS.find(c => c.id === id);
  if (!channel) throw new Error("Unknown TV channel");
  return {
    id: `tv-${channel.id}`,
    label: channel.name,
    hours: channel.hours,
    energy: channel.energy,
    note: channel.description,
    resolve: (state) => {
      if (state.house < 1 || !ownsFurniture(state.furniture, "tv")) return "You need a home and a television first.";
      return {
        patch: { [channel.stat]: state[channel.stat] + channel.gain },
        message: `Watched ${channel.name}. ${channel.description}.`,
      };
    },
  };
}

/** Home entertainment is slightly less efficient than specialist venues but has no cash fee. */
export const HOME_ENTERTAINMENT = [
  { id: "game-puzzle", label: "Play puzzle games", furniture: "console", stat: "int", gain: 2, hours: 2, energy: 8 },
  { id: "game-party", label: "Play party games online", furniture: "console", stat: "cha", gain: 2, hours: 2, energy: 10 },
  { id: "read-fiction", label: "Read a novel", furniture: "bookshelf", stat: "int", gain: 2, hours: 2, energy: 6 },
  { id: "read-business", label: "Read business books", furniture: "bookshelf", stat: "xp", gain: 3, hours: 2, energy: 8 },
] as const;

export function homeEntertainmentAction(id: (typeof HOME_ENTERTAINMENT)[number]["id"]): ActionDef {
  const activity = HOME_ENTERTAINMENT.find(item => item.id === id);
  if (!activity) throw new Error("Unknown home activity");
  return {
    id: activity.id, label: activity.label, hours: activity.hours, energy: activity.energy,
    note: `+${activity.gain} ${activity.stat === "int" ? "intelligence" : activity.stat === "cha" ? "charm" : "work XP"}`,
    resolve: (state) => {
      if (state.house < 1 || !ownsFurniture(state.furniture, activity.furniture)) return "You need a flat and the right equipment first.";
      return { patch: { [activity.stat]: state[activity.stat] + activity.gain }, message: `${activity.label}. +${activity.gain} ${activity.stat === "int" ? "intelligence" : activity.stat === "cha" ? "charm" : "work XP"}.` };
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
  note: "+2 strength",
  resolve: (s) =>
    s.money >= 5
      ? { patch: { money: s.money - 5, str: s.str + 2 }, message: "+2 strength. Swole." }
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
  note: "Base +1 intelligence · education boosts each session",
  resolve: (s) => ({ patch: { int: s.int + studyGain(1, s.school), studyXp: (s.studyXp ?? 0) + 4 }, message: `+${studyGain(1, s.school)} intelligence, +4 Study XP.` }),
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
    note: `Requires ${EDUCATION_XP_REQUIRED[s.school + 1]} Study XP · +1 intelligence per future study`,
    resolve: (st) => {
      const nextLevel = SCHOOLS[st.school + 1];
      if (!nextLevel) return "No further qualifications.";
      const requiredXp = EDUCATION_XP_REQUIRED[st.school + 1] ?? Infinity;
      if ((st.studyXp ?? 0) < requiredXp) return `Study XP ${st.studyXp ?? 0}/${requiredXp}. Keep studying before qualifying.`;
      return st.money >= cost
        ? {
            patch: { money: st.money - cost, school: st.school + 1 },
            message: `Graduated: ${nextLevel}! Future study sessions now earn +${st.school + 1} bonus intelligence.`,
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
  note: "+2 charm",
  resolve: (s) =>
    s.money >= 15
      ? { patch: { money: s.money - 15, cha: s.cha + 2 }, message: "Everyone loves you. +2 charm" }
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
/** Fixed-term loans: 40% total finance charge, due in 30 in-game days. Overdue balances incur 2% daily penalties. */
export function bankLoanAction(amount: number): ActionDef {
  return {
    id: `bank-loan-${amount}`, label: `Borrow ${amount}`, hours: 0, energy: 0,
    note: "40% finance charge · repay within 30 days",
    resolve: s => {
      if (![250, 1000, 2500, 5000].includes(amount)) return "That loan amount is unavailable.";
      if ((s.loanDebt ?? 0) > 0) return "Repay your existing loan before borrowing again.";
      if (amount > 250 && s.employed === 0) return "You need a job to qualify for a larger loan.";
      if (s.money + amount > 1e12) return "Your wallet cannot hold that much cash.";
      return { patch: { money: s.money + amount, loanPrincipal: amount, loanDebt: Math.ceil(amount * 1.4), loanDueDay: s.day + 30, loanLastDay: s.day }, message: `Approved: ${amount}. Total repayment ${Math.ceil(amount * 1.4)} by day ${s.day + 30} (40% finance charge).` };
    },
  };
}

export function repayLoanAction(amount: number | "all"): ActionDef {
  return {
    id: `bank-repay-${amount}`, label: amount === "all" ? "Repay loan in full" : `Repay ${amount}`,
    hours: 0, energy: 0,
    resolve: s => {
      const debt = s.loanDebt ?? 0;
      if (!debt) return "You have no outstanding loan.";
      const payment = amount === "all" ? debt : Math.min(debt, amount);
      if (s.money < payment) return `You need ${payment} cash to make this payment.`;
      return { patch: { money: s.money - payment, loanDebt: debt - payment, ...(debt === payment ? {loanDueDay: 0, loanPrincipal: 0} : {}) }, message: `Paid ${payment} towards your loan. ${debt-payment} remaining.` };
    },
  };
}

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
    note: s.alarm ? "Owned" : "Wake two hours earlier; pair with caffeine for 07:00",
    resolve: (st) =>
      !st.alarm && st.money >= 100
        ? {
            patch: { money: st.money - 100, alarm: 1 },
            message: "Alarm clock purchased. Wake two hours earlier; combine with a caffeine pill for 07:00.",
          }
        : "Already owned or not enough cash.",
  };
}

/** Single-use morning boost: requires an alarm for the 07:00 wake-up. */
export function buyCaffeineAction(): ActionDef {
  return {
    id: "buy-caffeine-pill",
    label: "Caffeine pill · $75",
    hours: 0,
    energy: 0,
    cost: 75,
    note: "Single use · wake two hours earlier; stacks with alarm",
    resolve: s => (s.caffeinePills ?? 0) >= 20 ? "Your bag is already full of caffeine pills."
      : s.money < 75 ? "Not enough cash for caffeine pills."
      : { patch: { money: s.money-75, caffeinePills: (s.caffeinePills ?? 0)+1 }, message: "Bought one caffeine pill. Wake two hours earlier when sleeping; combine with an alarm for an even earlier start." },
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
      if (st.employed === 0) return "Not employed. Apply for a job first.";
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
    if (s.employed === 0) return "Not employed. Apply for a job first.";
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

export const QUIT_JOB: ActionDef = {
  id: "quit-job", label: "Resign from current job", hours: 0, energy: 0,
  resolve: s => s.employed === 0 ? "You are not employed." : { patch: { employed: 0 }, message: "You resigned. You can now apply elsewhere." },
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
      if (s.employed !== 0) return `Already employed at ${CAREERS[s.career]?.name ?? "another workplace"}. Resign before applying.`;
      return {
        patch: { career: index, employed: 1, job: 0, xp: Math.floor(s.xp / 4) },
        message: `Hired as ${entry?.name ?? field.name}! Some experience transferred.`,
      };
    },
  };
}
