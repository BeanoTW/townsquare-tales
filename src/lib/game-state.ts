export type GameState = {
  sideHustleDay?: number; sideHustlesToday?: number;
  loanDebt?: number; loanLastDay?: number; loanDueDay?: number; loanPrincipal?: number;
  day: number; hour: number; energy: number; money: number;
  civicStage?: number; civicSupport?: number;
  str: number; int: number; cha: number; karma: number;
  house: number; ownedHomes?: number; school: number; job: number; heat: number;
  bank: number; caffeinePills?: number; snacks: number; trainers: number; alarm: number; furniture: number;
  luxuryFurniture?: number;
  mailbox?: number;
  mailReadMask?: number; familyReplyMask?: number; pendingReplyMask?: number; familyFirstReplyDay?: number;
  career: number; xp: number; studyXp?: number; employed?: number;
  gangRep: number; gangStage: number;
  relMara: number; relNox: number; relGus: number; relIvy: number;
  lastMara: number; lastNox: number; lastGus: number; lastIvy: number;
  smokes: number; skateboard: number; skateboardEquipped: number; parkSmokes: number; parkKidGone: number;
  parkSkateDay?: number; parkHoopDay?: number; parkHideDay?: number; gangResponseDay?: number;
  /** Records retained from the first arcade release. */
  basketBest?: number; skateBest?: number; dartsBest?: number; dartsRewardDay?: number;
  weapon?: number; tillRobberyDay?: number;
  streetSearchDay?: number;
  residentFavour?: number; residentFavourStage?: number; residentFavourDeadline?: number; residentFavourLastDay?: number;
  streetNewsDay?: number;
  streetEncounterDay?: number;
  streetMaraIncidents?: number; streetNoxIncidents?: number; streetGusIncidents?: number; streetIvyIncidents?: number;
  /** Lifetime casino totals (money won / money lost) per game. Old saves default to 0. */
  bjWon: number; bjLost: number; slotWon: number; slotLost: number;
  /** Arcade minigame records. Old saves default to 0. */
  bbBest5: number; bbBestTimed: number; bbMade: number; bbShots: number;
  railGrinds: number; railFalls: number; railLongest: number; railLevel: number;
  dartBest3: number; dartThrows: number; dartHits: number; dartWins: number; dartLosses: number;
  dartDay?: number;
};

const KEY = "sticktown";
const ranges: Record<keyof GameState, [number, number]> = {
  sideHustleDay: [0, 100000], sideHustlesToday: [0, 3],
  loanDebt: [0, 1000000], loanLastDay: [0, 100000], loanDueDay: [0, 100000], loanPrincipal: [0, 1000000],
  parkSkateDay:[0,100000],parkHoopDay:[0,100000],parkHideDay:[0,100000],gangResponseDay:[0,100000],
  basketBest: [0, 5], skateBest: [0, 4], dartsBest: [0, 540], dartsRewardDay: [0, 100000],
  weapon: [0, 2], tillRobberyDay: [0, 100000],
  streetSearchDay: [0, 100000],
  luxuryFurniture: [0, 255], mailbox: [0, 1], mailReadMask: [0, 2047], familyReplyMask: [0, 2047], pendingReplyMask: [0, 2047], familyFirstReplyDay: [0, 100000],
  residentFavour:[0,4],residentFavourStage:[0,1],residentFavourDeadline:[0,2400030],residentFavourLastDay:[0,100000],
  streetNewsDay: [0, 100000],
  streetEncounterDay: [0, 100000],
  streetMaraIncidents: [0, 1000003], streetNoxIncidents: [0, 1000003], streetGusIncidents: [0, 1000003], streetIvyIncidents: [0, 1000003],
  gangRep: [0, 100], gangStage: [0, 2],
  civicStage: [0, 4], civicSupport: [0, 100],
  day: [1, 100000], hour: [0, 24], energy: [0, 100], money: [0, 1e12],
  str: [0, 1e6], int: [0, 1e6], cha: [0, 1e6],
  lastMara: [0, 100000], lastNox: [0, 100000], lastGus: [0, 100000], lastIvy: [0, 100000],
  relMara: [-10, 10], relNox: [-10, 10], relGus: [-10, 10], relIvy: [-10, 10],
  karma: [-1e6, 1e6], house: [0, 3], ownedHomes: [0, 15], school: [0, 4],
  employed: [0, 1], job: [0, 4], career: [0, 3], xp: [0, 1000000], studyXp: [0, 1000000], heat: [0, 100],
  bank: [0, 1e12], smokes: [0, 99], skateboard: [0, 1], skateboardEquipped: [0, 1], parkSmokes: [0, 15], parkKidGone: [0, 1], caffeinePills: [0, 20], snacks: [0, 99], trainers: [0, 1], alarm: [0, 1], furniture: [0, 255],
  bjWon: [0, 1e12], bjLost: [0, 1e12], slotWon: [0, 1e12], slotLost: [0, 1e12],
  bbBest5: [0, 5], bbBestTimed: [0, 200], bbMade: [0, 1e9], bbShots: [0, 1e9],
  railGrinds: [0, 1e9], railFalls: [0, 1e9], railLongest: [0, 60000], railLevel: [0, 5],
  dartBest3: [0, 180], dartThrows: [0, 1e9], dartHits: [0, 1e9], dartWins: [0, 1e9], dartLosses: [0, 1e9],
  dartDay: [0, 100000],
};

export function parseGame(raw: string | null, fallback: GameState): GameState {
  if (!raw) return { ...fallback };
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== "object" || Array.isArray(value)) return { ...fallback };
    const result = { ...fallback };
    for (const k of Object.keys(ranges) as (keyof GameState)[]) {
      const n = (value as Record<string, unknown>)[k];
      if (typeof n !== "number" || !Number.isFinite(n)) continue;
      const [min, max] = ranges[k];
      result[k] = Math.max(min, Math.min(max, k === "hour" || k === "residentFavourDeadline" || k === "skateBest" ? n : Math.trunc(n)));
    }
    if (!("employed" in (value as Record<string, unknown>))) result.employed = 1; // preserve legacy employment
    // Migrate compatible records from PR #108 only when the new field is absent.
    const saved = value as Record<string, unknown>;
    if (!("bbBest5" in saved)) result.bbBest5 = result.basketBest ?? 0;
    if (!("railLongest" in saved)) result.railLongest = Math.round((result.skateBest ?? 0) * 1000);
    if ((result.skateBest ?? 0) >= 4) {
      if (!("railLevel" in saved)) result.railLevel = 1;
      if (!("railGrinds" in saved)) result.railGrinds = 1;
    }
    if (!("dartDay" in saved) && result.dartsRewardDay !== undefined) result.dartDay = result.dartsRewardDay;
    // The old nine-dart score has no equivalent in the new three-dart mode; retain it separately.
    if (!("skateboardEquipped" in (value as Record<string, unknown>))) result.skateboardEquipped = result.skateboard;
    return result;
  } catch {
    return { ...fallback };
  }
}

export function loadGame(fallback: GameState): GameState {
  if (typeof window === "undefined") return { ...fallback };
  try { return parseGame(window.localStorage.getItem(KEY), fallback); }
  catch { return { ...fallback }; }
}

export function saveGame(state: GameState): boolean {
  if (typeof window === "undefined") return false;
  try { window.localStorage.setItem(KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
