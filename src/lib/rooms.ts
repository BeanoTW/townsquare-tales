import { licenceTestAction, claimCompanyCarAction, companyCarEligible } from "@/lib/transport";
import { meetPawnContact, pawnErrand, repairWreck } from "@/lib/underworld";
import { CONTRACTS, constructionStatus, startContractAction } from "@/lib/construction-contracts";
import { businessStatus, buyBusinessAction, repayBusinessDebtAction, hireBusinessManagerAction, expandBusinessAction } from "@/lib/owned-businesses";
import { civicRunAction, civicStatus, civicVolunteerAction, townHallBuilt } from "@/lib/civic-career";
import { buyLaptopAction, marketAction, marketUnlocked, sharePrice } from "@/lib/investing";
import { HUSTLES, hustleAction } from "@/lib/side-hustles";
import { CAREERS, currentRole, missingRequirements, nextRole } from "@/lib/careers";
import {
  ALLEY_DICE,
  applyAction,
  BUY_ROUND,
  BUY_SNACK,
  CHAT_UP,
  CHECK_DEPARTURES,
  CLINIC_RECOVERY,
  COOK_AT_HOME,
  DEPOSIT_50,
  bankLoanAction,
  repayLoanAction,
  buyHouseAction,
  housingAction,
  housingWeeklyCost,
  DEPOSIT_ALL,
  furnitureAction,
  HIGH_DICE,
  HOME_WORKOUT,
  HOME_ENTERTAINMENT,
  homeEntertainmentAction,
  HOT_MEAL,
  JOG,
  LIFT_WEIGHTS,
  LUNCH_SHIFT,
  MUG,
  PAY_FINE,
  PROMOTE,
  QUIT_JOB,
  RELAX_SOFA,
  SELL_ALARM,
  SELL_GOODS,
  SELL_SHOES,
  shiftAction,
  sleepAction,
  STUDY_DESK,
  STUDY_LIBRARY,
  EDUCATION_XP_REQUIRED,
  TV_CHANNELS,
  watchTvAction,
  WITHDRAW_50,
  WITHDRAW_ALL,
  buyAlarmAction,
  buyCaffeineAction,
  buyShoesAction,
  enrollAction,
  type ActionDef,
} from "@/lib/actions";
import { buyMailboxAction } from "@/lib/post-office";
import { CASINO_CHATTER } from "@/lib/casino-lines";
import { lifetime, money, signed, type CasinoGame } from "@/lib/casino";
import { HOUSES, SCHOOLS } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { ownsFurniture } from "@/lib/furniture";

/** Every room is drawn on one fixed canvas; the screen fits it without cropping. */
export const VIEW = { w: 420, h: 300, floorY: 190 } as const;

export const PLACE_IDS = [
  "home",
  "gym",
  "yard",
  "school",
  "work",
  "bar",
  "alley",
  "bank",
  "shop",
  "diner",
  "pawn",
  "garage",
  "hall",
  "furniture",
  "casino",
  "depot",
  "post",
  "police",
  "clinic",
] as const;
export type PlaceId = (typeof PLACE_IDS)[number];

export type Box = { x: number; y: number; w: number; h: number };
export type Hotspot = {
  id: string;
  /** Name shown in the floating panel and to screen readers. */
  label: string;
  /** Short tag pinned above the object so players can see what is tappable. */
  tag: string;
  hint: string;
  box: Box;
  /** Hidden entirely when false (e.g. furniture not yet bought). */
  when?: (s: GameState) => boolean;
  /** Plain-language status lines shown in the panel. */
  lines?: (s: GameState) => string[];
  actions?: (s: GameState) => ActionDef[];
  /** Tapping opens this full-screen minigame instead of a panel. */
  launch?: "blackjack" | "slots" | "darts";
};
export type Palette = { wall: string; floor: string; accent: string };
export type Room = {
  id: PlaceId;
  title: string;
  caption: string;
  /** Sign painted above the room. */
  sign: string;
  palette: Palette;
  hotspots: Hotspot[];
  /** Ambient lines rotated in the footer while the player looks around. */
  chatter?: readonly string[];
};

const casinoRecord = (game: CasinoGame, s: GameState): string[] => {
  const r = lifetime(s, game);
  return [`Lifetime: won ${money(r.won)}, lost ${money(r.lost)}, net ${signed(r.net)}.`];
};

const employed = (s: GameState, career: number) => s.employed !== 0 && s.career === career;

function careerStatus(career: number, s: GameState): string[] {
  if (employed(s, career)) {
    const role = currentRole(s);
    return [`Your role: ${role.name} · $${role.pay}/hour`];
  }
  return [
    `Not employed here. Apply for a ${CAREERS[career]?.name ?? "career"} role on the vacancy board.`,
  ];
}

function promotionStatus(career: number, s: GameState): string[] {
  if (!employed(s, career)) return ["Apply for a job here before requesting promotions."];
  const next = nextRole(s);
  if (!next) return ["You're at the top of this career."];
  const missing = missingRequirements(s, next);
  return [
    `Next: ${next.name} · $${next.pay}/hour`,
    missing.length
      ? `Still needed: ${missing.join(", ")}`
      : "All requirements met. Ask for the promotion.",
  ];
}

const shiftSpot = (career: number) => (s: GameState) =>
  employed(s, career) ? [shiftAction(s)] : [];
const promoteSpot = (career: number) => (s: GameState) => (employed(s, career) ? [PROMOTE] : []);

const HOME_TIERS: { title: string; sign: string; palette: Palette }[] = [
  {
    title: "A room with questionable walls",
    sign: "CARDBOARD",
    palette: { wall: "#8c9575", floor: "#806c57", accent: "#8c5844" },
  },
  {
    title: "Your first studio flat",
    sign: "STUDIO",
    palette: { wall: "#d6c9ad", floor: "#ad8667", accent: "#8c5844" },
  },
  {
    title: "Welcome to the suburbs",
    sign: "SUBURBS",
    palette: { wall: "#a9c5b0", floor: "#926b4c", accent: "#5b7e62" },
  },
  {
    title: "The mansion life",
    sign: "MANSION",
    palette: { wall: "#d9d3c4", floor: "#84674d", accent: "#7a5a3f" },
  },
];

export const ROOMS: Record<PlaceId, Room> = {
  home: {
    id: "home",
    title: "Home sweet home",
    caption: "It isn't much, but the landlord never calls.",
    sign: "HOME",
    palette: { wall: "#b8c5a0", floor: "#9d7858", accent: "#8c5844" },
    hotspots: [
      {
        id: "bed",
        label: "Bed",
        tag: "SLEEP",
        hint: "Rest until the next day",
        box: { x: 12, y: 116, w: 132, h: 74 },
        actions: (s) => [sleepAction(s)],
      },
      {
        id: "weights",
        label: "Home weights",
        tag: "TRAIN",
        hint: "Strength training at home",
        box: { x: 12, y: 58, w: 96, h: 52 },
        when: (s) => ownsFurniture(s.furniture, "weights"),
        actions: () => [HOME_WORKOUT],
      },
      {
        id: "desk",
        label: "Study desk",
        tag: "STUDY",
        hint: "Quiet study at home",
        box: { x: 166, y: 92, w: 96, h: 58 },
        when: (s) => ownsFurniture(s.furniture, "desk"),
        lines: (s) => s.laptop ? [`Laptop · ${s.marketShares??0} shares · ${sharePrice(s.day)}/share`,marketUnlocked(s) ? "Stock market unlocked · 2% fee per trade" : "Investment training unlocks at MegaCorp Analyst"] : ["Buy a laptop at Cosy Corner to access online finances."],
        actions: (s) => [STUDY_DESK, ...(s.laptop && marketUnlocked(s) ? [marketAction("buy",1),marketAction("buy",10),marketAction("sell",1),marketAction("sell",10)] : [])],
      },
      {
        id: "sofa",
        label: "Cosy sofa",
        tag: "RELAX",
        hint: "Sit back and be sociable",
        box: { x: 156, y: 150, w: 118, h: 40 },
        when: (s) => ownsFurniture(s.furniture, "sofa"),
        actions: () => [RELAX_SOFA],
      },
      {
        id: "television",
        label: "Television",
        tag: "WATCH",
        hint: "Choose something worth watching",
        box: { x: 160, y: 26, w: 130, h: 48 },
        when: (st) => st.house >= 1 && ownsFurniture(st.furniture, "tv"),
        actions: () => TV_CHANNELS.map(channel => watchTvAction(channel.id)),
      },
      {
        id: "bookshelf",
        label: "Bookshelf",
        tag: "READ",
        hint: "A little quiet learning",
        box: { x: 110, y: 28, w: 43, h: 75 },
        when: (st) => st.house >= 1 && ownsFurniture(st.furniture, "bookshelf"),
        actions: () => HOME_ENTERTAINMENT.filter(a => a.furniture === "bookshelf").map(a => homeEntertainmentAction(a.id)),
      },
      {
        id: "console",
        label: "Game console",
        tag: "PLAY",
        hint: "Play some games",
        box: { x: 42, y: 12, w: 48, h: 42 },
        when: (st) => st.house >= 1 && ownsFurniture(st.furniture, "console"),
        actions: () => HOME_ENTERTAINMENT.filter(a => a.furniture === "console").map(a => homeEntertainmentAction(a.id)),
      },
      {
        id: "kitchen",
        label: "Kitchen",
        tag: "COOK",
        hint: "Cook a proper dinner",
        box: { x: 296, y: 70, w: 112, h: 120 },
        when: (s) => ownsFurniture(s.furniture, "kitchen"),
        actions: () => [COOK_AT_HOME],
      },
    ],
  },
  gym: {
    id: "gym",
    title: "Iron Gym",
    caption: "No pain, no gain. Refunds not available.",
    sign: "IRON GYM",
    palette: { wall: "#8da4af", floor: "#56636b", accent: "#e1a53a" },
    hotspots: [
      {
        id: "rack",
        label: "Weights rack",
        tag: "LIFT",
        hint: "Heavy lifting for strength",
        box: { x: 24, y: 96, w: 160, h: 94 },
        actions: () => [LIFT_WEIGHTS],
      },
      {
        id: "track",
        label: "Running machine",
        tag: "JOG",
        hint: "Free cardio, lots of effort",
        box: { x: 226, y: 70, w: 160, h: 120 },
        actions: () => [JOG],
      },
    ],
  },
  yard: {
    id: "yard",
    title: "Workers Yard",
    caption: "Hard hats, early starts, and proper work.",
    sign: "WORKERS YARD",
    palette: { wall: "#bba981", floor: "#79624d", accent: "#d8a63c" },
    hotspots: [
      {
        id: "town-hall",
        label: "Town Hall project",
        tag: "CIVICS",
        hint: "Construction progress and the path into politics",
        box: { x: 158, y: 155, w: 130, h: 125 },
        lines: civicStatus,
        actions: s => townHallBuilt(s) ? [civicVolunteerAction(), civicRunAction()] : [],
      },
      {
        id: "site",
        label: "Job site",
        tag: "SHIFT",
        hint: "Your current shift",
        box: { x: 10, y: 40, w: 150, h: 150 },
        lines: (s) => careerStatus(3, s),
        actions: shiftSpot(3),
      },
      {
        id: "trades-board",
        label: "Trades vacancy board",
        tag: "JOBS",
        hint: "Join the trades",
        box: { x: 200, y: 40, w: 96, h: 96 },
        lines: () => [`Apprentice · $${CAREERS[3]?.roles[0]?.pay ?? 10}/hour · 1h application`],
        actions: s => s.employed === 0 ? [applyAction(3)] : employed(s, 3) ? [QUIT_JOB] : [],
      },
      {
        id: "foreman",
        label: "Site foreman",
        tag: "PROMOTE",
        hint: "Progress and promotions",
        box: { x: 312, y: 90, w: 96, h: 100 },
        lines: (s) => [...promotionStatus(3, s),...(s.day>=30 ? ["FOREMAN: Town Hall is finished. The entire Workers Yard has relocated east of Town Police. Check the letter I sent you."] : ["FOREMAN: Once Town Hall is complete, our yard moves east of Town Police."]),...constructionStatus(s),...(companyCarEligible(s)?[s.companyCar?"Company car collected":"Old company car available · driving licence required"]:[])],
        actions: s => [...promoteSpot(3)(s),...(!s.contractType ? CONTRACTS.map(job => startContractAction(job.id)) : []), ...(companyCarEligible(s) && !s.companyCar ? [claimCompanyCarAction()] : [])],
      },
    ],
  },
  work: {
    id: "work",
    title: "MegaCorp",
    caption: "Your soul is valued. At an hourly rate.",
    sign: "MEGACORP",
    palette: { wall: "#aebdcb", floor: "#708393", accent: "#47759b" },
    hotspots: [
      {
        id: "workstation",
        label: "Workstation",
        tag: "WORK",
        hint: "Your current shift",
        box: { x: 14, y: 100, w: 132, h: 90 },
        lines: (s) => careerStatus(0, s),
        actions: shiftSpot(0),
      },
      {
        id: "vacancies",
        label: "Vacancy board",
        tag: "APPLY",
        hint: "Join corporate work",
        box: { x: 160, y: 30, w: 110, h: 100 },
        lines: () => [`Office Intern · $${CAREERS[0]?.roles[0]?.pay ?? 9}/hour · 1h application`],
        actions: s => s.employed === 0 ? [applyAction(0)] : employed(s, 0) ? [QUIT_JOB] : [],
      },
      {
        id: "manager",
        label: "Manager's office",
        tag: "PROMOTE",
        hint: "Progress and promotions",
        box: { x: 296, y: 30, w: 108, h: 150 },
        lines: (s) => promotionStatus(0, s),
        actions: promoteSpot(0),
      },
    ],
  },
  school: {
    id: "school",
    title: "Stick U",
    caption: "An expensive way to become slightly smarter.",
    sign: "STICK U",
    palette: { wall: "#c9b78e", floor: "#916f55", accent: "#547b62" },
    hotspots: [
      {
        id: "library",
        label: "Library shelves",
        tag: "STUDY",
        hint: "Study on your own",
        box: { x: 14, y: 40, w: 130, h: 150 },
        actions: () => [STUDY_LIBRARY],
      },
      {
        id: "classroom",
        label: "Classroom",
        tag: "ENROL",
        hint: "Classes and qualifications",
        box: { x: 162, y: 44, w: 150, h: 90 },
        lines: (s) => [`Current level: ${SCHOOLS[s.school] ?? "Dropout"}`, s.school < 4 ? `Study XP: ${s.studyXp ?? 0}/${EDUCATION_XP_REQUIRED[s.school + 1]}` : `Study XP: ${s.studyXp ?? 0} · Maximum qualification`],
        actions: (s) => {
          const e = enrollAction(s);
          return e ? [e] : [];
        },
      },
      {
        id: "admissions",
        label: "Admissions desk",
        tag: "INFO",
        hint: "Education and careers",
        box: { x: 330, y: 120, w: 80, h: 70 },
        lines: () => [
          "Qualifications unlock opportunities around town.",
          "Vacancy boards at each workplace show what's open.",
        ],
      },
    ],
  },
  bar: {
    id: "bar",
    title: "The Tipsy Stick",
    caption: "The bartender already knows your problems.",
    sign: "TIPSY STICK",
    palette: { wall: "#644363", floor: "#3a2937", accent: "#f477a9" },
    hotspots: [
      {
        id: "bar-counter",
        label: "Bar counter",
        tag: "ROUND",
        hint: "Buy the house a round",
        box: { x: 24, y: 116, w: 230, h: 72 },
        actions: () => [BUY_ROUND],
      },
      {
        id: "dance-floor",
        label: "Dance floor",
        tag: "CHAT",
        hint: "Make a move",
        box: { x: 262, y: 126, w: 140, h: 62 },
        actions: () => [CHAT_UP],
      },
      {
        id: "dartboard",
        label: "Dartboard",
        tag: "DARTS",
        hint: "Throw darts with Gus watching",
        box: { x: 340, y: 46, w: 56, h: 64 },
        lines: () => ["Gus is watching. Three darts, no pressure."],
        launch: "darts",
      },
    ],
  },
  alley: {
    id: "alley",
    title: "Dark Alley",
    caption: "Business is brisk. Questions are discouraged.",
    sign: "DARK ALLEY",
    palette: { wall: "#6a645f", floor: "#45413e", accent: "#b9a04c" },
    hotspots: [
      {
        id: "crate",
        label: "Crate stash",
        tag: "SELL",
        hint: "Move some questionable goods",
        box: { x: 14, y: 120, w: 116, h: 70 },
        actions: () => [SELL_GOODS],
      },
      {
        id: "stranger",
        label: "Shady stranger",
        tag: "MUG",
        hint: "Ask no questions",
        box: { x: 150, y: 96, w: 116, h: 94 },
        actions: () => [MUG],
      },
      {
        id: "dice",
        label: "Dice table",
        tag: "DICE",
        hint: "Quick, cash-only game",
        box: { x: 292, y: 130, w: 114, h: 60 },
        actions: () => [ALLEY_DICE],
      },
    ],
  },
  bank: {
    id: "bank",
    title: "Town Bank",
    caption: "Your money is safe. Your dignity is not insured.",
    sign: "TOWN BANK",
    palette: { wall: "#b9c8b8", floor: "#769187", accent: "#426c59" },
    hotspots: [
      {
        id: "teller",
        label: "Teller window",
        tag: "DEPOSIT",
        hint: "Manage your savings",
        box: { x: 14, y: 70, w: 160, h: 120 },
        actions: () => [DEPOSIT_50, DEPOSIT_ALL],
      },
      {
        id: "atm",
        label: "ATM",
        tag: "CASH",
        hint: "Withdraw cash",
        box: { x: 196, y: 40, w: 80, h: 130 },
        actions: () => [WITHDRAW_50, WITHDRAW_ALL],
      },
      {
        id: "vault",
        label: "Vault",
        tag: "SAVINGS",
        hint: "Your savings",
        box: { x: 300, y: 20, w: 110, h: 170 },
        lines: (s) => [`Savings: ${s.bank}`, "Savings earn 0.1% each night."],
      },
      {
        id: "loans",
        label: "Property management",
        tag: "HOMES",
        hint: "Browse all available homes",
        box: { x: 280, y: 190, w: 126, h: 80 },
        lines: s => [`Current home: ${HOUSES[s.house]?.name ?? "Home"}`, s.housingMode ? `${s.housingMode === 1 ? "Rent" : "Mortgage"}: ${housingWeeklyCost(s)}/week · arrears ${s.housingArrears ?? 0}` : "Owned or starter housing", "Flats and suburban homes may be rented or mortgaged. Mansions must be bought."],
        actions: s => [
          ...[1, 2, 3, 4].filter(tier => tier !== s.house || Boolean(s.housingMode)).map(tier => buyHouseAction(s, tier)),
          ...([1, 2] as const).filter(tier => tier !== s.house).flatMap(tier => [housingAction(s, tier, 1), housingAction(s, tier, 2)]),
        ],
      },
    ],
  },
  shop: {
    id: "shop",
    title: "Corner Shop",
    caption: "Everything you need, and several things you don't.",
    sign: "CORNER SHOP",
    palette: { wall: "#e3c689", floor: "#a98a6a", accent: "#ce6b45" },
    hotspots: [
      {
        id: "shelves",
        label: "Shop shelves",
        tag: "LOOK",
        hint: "Browse the shelves. Take your items to the checkout to buy.",
        box: { x: 12, y: 30, w: 150, h: 130 },
        lines: () => ["Stocked shelves and everyday essentials.", "All purchases are handled at the checkout counter."],
      },
      {
        id: "back-office",
        label: "Back office",
        tag: "PROMOTE",
        hint: "Retail progression",
        box: { x: 180, y: 40, w: 70, h: 150 },
        lines: (s) => [...promotionStatus(2, s), ...businessStatus(s,"retail")],
        actions: s => [...promoteSpot(2)(s), ...(!s.retailOwned ? [buyBusinessAction("retail")] : [hireBusinessManagerAction("retail",1),hireBusinessManagerAction("retail",2),expandBusinessAction("retail")]), ...(s.businessDebt ? [repayBusinessDebtAction()] : [])],
      },
      {
        id: "shop-board",
        label: "Shop jobs board",
        tag: "APPLY",
        hint: "Retail vacancies",
        box: { x: 268, y: 28, w: 140, h: 70 },
        lines: () => [`Shop Assistant · $${CAREERS[2]?.roles[0]?.pay ?? 8}/hour · 1h application`],
        actions: s => s.employed === 0 ? [applyAction(2)] : employed(s, 2) ? [QUIT_JOB] : [],
      },
      {
        id: "checkout",
        label: "Checkout",
        tag: "BUY",
        hint: "Equipment and your shift",
        box: { x: 268, y: 120, w: 140, h: 70 },
        lines: (s) => [...careerStatus(2, s), `Caffeine pills in bag: ${s.caffeinePills ?? 0}`],
        actions: (s) => [...shiftSpot(2)(s), buyShoesAction(s), buyAlarmAction(s), buyCaffeineAction()],
      },
    ],
  },
  diner: {
    id: "diner",
    title: "Fryday Diner",
    caption: "The coffee is strong. The wages aren't.",
    sign: "FRYDAY",
    palette: { wall: "#efc99d", floor: "#b86a58", accent: "#ce4d43" },
    hotspots: [
      {
        id: "kitchen",
        label: "Kitchen pass",
        tag: "SHIFT",
        hint: "Your current shift",
        box: { x: 14, y: 96, w: 128, h: 94 },
        lines: (s) => careerStatus(1, s),
        actions: shiftSpot(1),
      },
      {
        id: "hiring",
        label: "Hiring board",
        tag: "APPLY",
        hint: "Restaurant vacancies",
        box: { x: 160, y: 24, w: 110, h: 84 },
        lines: () => [`Kitchen Porter · $${CAREERS[1]?.roles[0]?.pay ?? 8}/hour · 1h application`],
        actions: s => s.employed === 0 ? [applyAction(1)] : employed(s, 1) ? [QUIT_JOB] : [],
      },
      {
        id: "booth",
        label: "Manager's booth",
        tag: "PROMOTE",
        hint: "Progress and promotions",
        box: { x: 290, y: 40, w: 112, h: 140 },
        lines: (s) => [...promotionStatus(1, s), ...businessStatus(s,"restaurant")],
        actions: s => [...promoteSpot(1)(s), ...(!s.restaurantOwned ? [buyBusinessAction("restaurant")] : [hireBusinessManagerAction("restaurant",1),hireBusinessManagerAction("restaurant",2),expandBusinessAction("restaurant")]), ...(s.businessDebt ? [repayBusinessDebtAction()] : [])],
      },
      {
        id: "counter",
        label: "Counter",
        tag: "EAT",
        hint: "Food, and some extra shifts",
        box: { x: 150, y: 120, w: 130, h: 70 },
        actions: () => [HOT_MEAL, LUNCH_SHIFT],
      },
    ],
  },
  hall: {
    id:"hall",title:"Stick Town Community Hall",caption:"The neighbourhood has somewhere to meet at last.",sign:"COMMUNITY HALL",
    palette:{wall:"#ded8c6",floor:"#ac9d82",accent:"#537782"},
    hotspots:[
      {id:"noticeboard",label:"Community noticeboard",tag:"INFO",hint:"What's happening locally",box:{x:12,y:40,w:130,h:125},lines:civicStatus},
      {id:"volunteer-desk",label:"Volunteer desk",tag:"HELP",hint:"Get involved around town",box:{x:155,y:40,w:118,h:125},actions:s=>townHallBuilt(s)?[civicVolunteerAction()]:[]},
      {id:"meeting-room",label:"Meeting room",tag:"MEET",hint:"Local council meetings",box:{x:282,y:50,w:120,h:130},lines:civicStatus,actions:s=>townHallBuilt(s)?[civicRunAction()]:[]},
    ]
  },
  garage: {
    id: "garage", title: "Bayside Garage", caption: "Three bays, a battered toolbox and the smell of old oil.", sign: "BAYSIDE GARAGE",
    palette: {wall:"#a79d8b",floor:"#777a77",accent:"#c6a663"},
    hotspots: [
      {id:"service-desk",label:"Mechanic reception",tag:"SERVICE",hint:"Ask about your car",box:{x:18,y:40,w:126,h:100},
        lines:s=>[s.abandonedCar?"Your old wreck is on the books.":"No personal car registered yet.",`Repair stages complete: ${s.wreckRepairs??0} / 3.`],
        actions:s=>s.abandonedCar && (s.wreckRepairs??0)<3 ? [repairWreck()] : []},
      {id:"service-bays",label:"Three repair bays",tag:"BAYS",hint:"Inspect the work area",box:{x:157,y:46,w:244,h:144},
        lines:s=>[(s.wreckRepairs??0)>=3?"Your personal car has passed its restoration inspection.":"A mechanic is working through the service queue.","Vehicle upgrades and paintwork are coming later."]},
    ],
  },
  pawn: {
    id: "pawn",
    title: "Oddities Pawn",
    caption: "Someone else's rubbish is your treasure.",
    sign: "PAWN",
    palette: { wall: "#aca78b", floor: "#736d56", accent: "#a98c4a" },
    hotspots: [
      {
        id: "pawn-counter",
        label: "Pawn counter",
        tag: "SELL",
        hint: "Sell your belongings",
        box: { x: 20, y: 120, w: 180, h: 70 },
        lines: (s) =>
          s.trainers || s.alarm ? [] : ["Nothing to sell yet. Buy something from the shop first."],
        actions: (s) => [...(s.trainers ? [SELL_SHOES] : []), ...(s.alarm ? [SELL_ALARM] : [])],
      },
      {
        id: "backroom",
        label: "Back office door",
        tag: "PRIVATE",
        hint: "A door behind the counter",
        box: { x: 340, y: 122, w: 65, h: 65 },
        lines: s => [s.pawnMet ? '"Vince is expecting you."':s.pawnIntroduction ? '"You were sent by someone? Keep your voice down."':'The shopkeeper glances over. "Staff only."'],
        actions: s => !s.pawnIntroduction ? [] : s.pawnMet ? [pawnErrand()] : [meetPawnContact()],
      },
      {
        id: "curiosities",
        label: "Curiosity shelf",
        tag: "LOOK",
        hint: "Odds and ends on display",
        box: { x: 230, y: 30, w: 170, h: 140 },
        lines: (s) => [
          s.trainers ? "Running shoes in your bag." : "No shoes to sell.",
          s.alarm ? "Alarm clock in your bag." : "No clock to sell.",
        ],
      },
    ],
  },
  furniture: {
    id: "furniture",
    title: "Cosy Corner",
    caption: "Sit down. Just don't fall asleep in the showroom.",
    sign: "COSY CORNER",
    palette: { wall: "#e6d8ba", floor: "#bd9470", accent: "#ad735b" },
    hotspots: [
      {
        id: "sofa-display",
        label: "Sofa display",
        tag: "SOFA",
        hint: "Try before you buy",
        box: { x: 12, y: 130, w: 140, h: 60 },
        actions: (s) => [furnitureAction("sofa", s), furnitureAction("sofa", s, true)],
      },
      {
        id: "bed-display",
        label: "Bed display",
        tag: "BED",
        hint: "Better sleep at home",
        box: { x: 170, y: 96, w: 120, h: 94 },
        actions: (s) => [furnitureAction("bed", s), furnitureAction("bed", s, true)],
      },
      {
        id: "catalogue",
        label: "Catalogue stand",
        tag: "BROWSE",
        hint: "Everything else for the home",
        box: { x: 310, y: 40, w: 96, h: 150 },
        actions: (s) => [
          furnitureAction("kitchen", s),
          furnitureAction("weights", s),
          furnitureAction("desk", s),
          ...(!s.laptop ? [buyLaptopAction()] : []),
          furnitureAction("tv", s),
          furnitureAction("console", s),
          furnitureAction("bookshelf", s),
          ...(["kitchen", "weights", "desk", "tv", "console", "bookshelf"] as const).map(id => furnitureAction(id, s, true)),
        ],
      },
    ],
  },
  casino: {
    id: "casino",
    title: "Lucky Sevens",
    caption: "The house always wins. But you're feeling lucky.",
    sign: "LUCKY 7s",
    palette: { wall: "#493866", floor: "#312744", accent: "#f3bd4b" },
    chatter: CASINO_CHATTER,
    hotspots: [
      {
        id: "slots",
        label: "Slot machine",
        tag: "SLOTS",
        hint: "Pull the lever. Statistically unwise.",
        box: { x: 20, y: 50, w: 160, h: 140 },
        launch: "slots",
        lines: (s) => casinoRecord("slots", s),
      },
      {
        id: "blackjack",
        label: "Blackjack table",
        tag: "21",
        hint: "Beat the dealer. He's unimpressed.",
        box: { x: 236, y: 66, w: 164, h: 60 },
        launch: "blackjack",
        lines: (s) => casinoRecord("blackjack", s),
      },
      {
        id: "high-dice",
        label: "High-stakes dice",
        tag: "DICE",
        hint: "Big money, bigger risk",
        box: { x: 240, y: 130, w: 160, h: 60 },
        actions: () => [HIGH_DICE],
      },
    ],
  },
  depot: {
    id: "depot",
    title: "Town Transit",
    caption: "The next bus is due eventually.",
    sign: "TRANSIT",
    palette: { wall: "#a3bac1", floor: "#677c82", accent: "#366c7b" },
    hotspots: [
      {
        id: "departures",
        label: "Departures board",
        tag: "CHECK",
        hint: "See what's leaving",
        box: { x: 30, y: 30, w: 200, h: 110 },
        actions: () => [CHECK_DEPARTURES],
      },
      {
        id: "ticket-hatch",
        label: "Jobs and driving licences",
        tag: "JOBS",
        hint: "Local noticeboard · side hustles",
        box: { x: 270, y: 110, w: 130, h: 80 },
        lines: (s) => [`Daily side jobs completed: ${s.sideHustleDay===s.day ? s.sideHustlesToday??0 : 0}/3`, "Earn cash between shifts. Hustles take time and energy; skills affect payouts.", s.drivingLicence ? "Driving licence: valid" : "Driving test: $120 · 2h · requires 10 intelligence"],
        actions: s => [...HUSTLES.map(h => hustleAction(h.id)), ...(s.drivingLicence ? [] : [licenceTestAction()])],
      },
    ],
  },
  post: {
    id: "post",
    title: "Town Post Office",
    caption: "Your post is safe here. Probably.",
    sign: "POST OFFICE",
    palette: { wall: "#f2debe", floor: "#aa8f74", accent: "#a93d37" },
    hotspots: [
      {
        id: "post-counter",
        label: "Postal counter",
        tag: "MAIL",
        hint: "Register a mailbox for home deliveries",
        box: { x: 15, y: 115, w: 230, h: 85 },
        lines: s => s.mailbox
          ? ["Your mailbox is registered. Check the mailbox at home or collect letters here."]
          : ["Letters are held here until you register an address.", "A permanent mailbox costs $25 and moves with your home."],
        actions: s => s.mailbox ? [] : [buyMailboxAction(s)],
      },
      {
        id: "sorting",
        label: "Sorting shelves",
        tag: "POST",
        hint: "Letters waiting to be sorted",
        box: { x: 265, y: 65, w: 135, h: 140 },
        lines: () => ["Stacks of envelopes and parcels.", "Check your held letters using Collect post at the top of this room."],
      },
    ],
  },
  police: {
    id: "police",
    title: "Town Police",
    caption: "They know exactly what you've been up to.",
    sign: "POLICE",
    palette: { wall: "#9dacbd", floor: "#738295", accent: "#355e88" },
    hotspots: [
      {
        id: "front-desk",
        label: "Front desk",
        tag: "FINE",
        hint: "Settle your record",
        box: { x: 14, y: 116, w: 220, h: 74 },
        actions: () => [PAY_FINE],
      },
      {
        id: "wanted",
        label: "Wanted board",
        tag: "HEAT",
        hint: "Your current heat",
        box: { x: 280, y: 30, w: 120, h: 110 },
        lines: (s) => [`Heat level: ${s.heat}`, "Clean records help you blend in."],
      },
    ],
  },
  clinic: {
    id: "clinic",
    title: "Patch Up Clinic",
    caption: "A little tape fixes almost everything.",
    sign: "PATCH UP",
    palette: { wall: "#d4e5dd", floor: "#a7c5b4", accent: "#5a9e83" },
    hotspots: [
      {
        id: "treatment-bed",
        label: "Treatment bed",
        tag: "HEAL",
        hint: "Restore your energy",
        box: { x: 14, y: 116, w: 200, h: 74 },
        actions: () => [CLINIC_RECOVERY],
      },
      {
        id: "cabinet",
        label: "Medicine cabinet",
        tag: "INFO",
        hint: "What's in stock",
        box: { x: 264, y: 40, w: 140, h: 120 },
        lines: () => ["Treatment costs $40 and restores all energy."],
      },
    ],
  },
};

/** Home decor and the room title follow the player's housing tier. */
export function roomFor(id: PlaceId, s: GameState): Room {
  const base = ROOMS[id];
  if (id !== "home") return base;
  const tier = HOME_TIERS[Math.max(0, Math.min(HOME_TIERS.length - 1, s.house))] ?? HOME_TIERS[0]!;
  return { ...base, title: tier.title, sign: tier.sign, palette: tier.palette };
}

export function visibleHotspots(room: Room, s: GameState): Hotspot[] {
  return room.hotspots.filter((h) => !h.when || h.when(s));
}

export function hotspotActions(h: Hotspot, s: GameState): ActionDef[] {
  return h.actions?.(s) ?? [];
}

export const isPlace = (value: string): value is PlaceId =>
  (PLACE_IDS as readonly string[]).includes(value);
