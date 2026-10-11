export type GameState = {
  day: number; hour: number; energy: number; money: number;
  str: number; int: number; cha: number; karma: number;
  house: number; school: number; job: number; heat: number;
  bank: number; snacks: number; trainers: number; alarm: number; furniture: number;
  career: number; xp: number;
  gangRep: number; gangStage: number;
  relMara: number; relNox: number; relGus: number; relIvy: number;
  lastMara: number; lastNox: number; lastGus: number; lastIvy: number;
  smokes: number; skateboard: number; skateboardEquipped: number; parkSmokes: number; parkKidGone: number;
  parkSkateDay?: number; parkHoopDay?: number; parkHideDay?: number; gangResponseDay?: number;
  basketBest?: number; skateBest?: number; dartsBest?: number; dartsRewardDay?: number;
  weapon?: number; tillRobberyDay?: number;
  streetSearchDay?: number;
  residentFavour?: number; residentFavourStage?: number; residentFavourDeadline?: number; residentFavourLastDay?: number;
  streetNewsDay?: number;
  streetEncounterDay?: number;
  streetMaraIncidents?: number; streetNoxIncidents?: number; streetGusIncidents?: number; streetIvyIncidents?: number;
  /** Lifetime casino totals (money won / money lost) per game. Old saves default to 0. */
  bjWon: number; bjLost: number; slotWon: number; slotLost: number;
};

const KEY = "sticktown";
const ranges: Record<keyof GameState, [number, number]> = {
  parkSkateDay:[0,100000],parkHoopDay:[0,100000],parkHideDay:[0,100000],gangResponseDay:[0,100000],
  basketBest: [0, 5], skateBest: [0, 4], dartsBest: [0, 540], dartsRewardDay: [0, 100000],
  weapon: [0, 2], tillRobberyDay: [0, 100000],
  streetSearchDay: [0, 100000],
  residentFavour:[0,4],residentFavourStage:[0,1],residentFavourDeadline:[0,2400030],residentFavourLastDay:[0,100000],
  streetNewsDay: [0, 100000],
  streetEncounterDay: [0, 100000],
  streetMaraIncidents: [0, 1000003], streetNoxIncidents: [0, 1000003], streetGusIncidents: [0, 1000003], streetIvyIncidents: [0, 1000003],
  gangRep: [0, 100], gangStage: [0, 2],
  day: [1, 100000], hour: [0, 24], energy: [0, 100], money: [0, 1e12],
  str: [0, 1e6], int: [0, 1e6], cha: [0, 1e6],
  lastMara: [0, 100000], lastNox: [0, 100000], lastGus: [0, 100000], lastIvy: [0, 100000],
  relMara: [-10, 10], relNox: [-10, 10], relGus: [-10, 10], relIvy: [-10, 10],
  karma: [-1e6, 1e6], house: [0, 3], school: [0, 4],
  job: [0, 4], career: [0, 3], xp: [0, 1000000], heat: [0, 100],
  bank: [0, 1e12], smokes: [0, 99], skateboard: [0, 1], skateboardEquipped: [0, 1], parkSmokes: [0, 15], parkKidGone: [0, 1], snacks: [0, 99], trainers: [0, 1], alarm: [0, 1], furniture: [0, 255],
  bjWon: [0, 1e12], bjLost: [0, 1e12], slotWon: [0, 1e12], slotLost: [0, 1e12],
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
