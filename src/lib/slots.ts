import type { Rng } from "@/lib/actions";

/**
 * Lucky Sevens slot machine: three reels, one payline (the centre row).
 *
 * Every reel uses the same 20-stop strip and each stop is equally likely, so there are
 * 20 × 20 × 20 = 8,000 equally likely outcomes. `exactStats()` enumerates all of them, which is
 * what the tests (and the paytable on screen) rely on: no hidden weighting, no "near-miss"
 * adjustment. The rows above and below the payline are simply the neighbouring stops on the strip.
 *
 * Strip (count per reel): seven 1, diamond 2, bar 3, bell 4, cherry 5, lemon 5.
 *
 * Paytable (multiple of the wager returned, stake included):
 *   777 ×300 · 💎💎💎 ×75 · BAR×3 ×30 · 🔔🔔🔔 ×15 · 🍒🍒🍒 ×8 · 🍋🍋🍋 ×3 · exactly two 🍒 ×3
 * Return to player 92.75%; 18.4% of spins pay something (1 in 5.4).
 */
export type Sym = "seven" | "diamond" | "bar" | "bell" | "cherry" | "lemon";

export const STRIP: readonly Sym[] = [
  "lemon",
  "cherry",
  "bell",
  "lemon",
  "bar",
  "cherry",
  "bell",
  "diamond",
  "lemon",
  "cherry",
  "bar",
  "bell",
  "lemon",
  "cherry",
  "seven",
  "bell",
  "bar",
  "lemon",
  "cherry",
  "diamond",
];
export const STOPS = STRIP.length;

export const SYMBOLS: Record<Sym, { glyph: string; label: string }> = {
  seven: { glyph: "7", label: "Seven" },
  diamond: { glyph: "💎", label: "Diamond" },
  bar: { glyph: "BAR", label: "Bar" },
  bell: { glyph: "🔔", label: "Bell" },
  cherry: { glyph: "🍒", label: "Cherry" },
  lemon: { glyph: "🍋", label: "Lemon" },
};

export type Win = { id: string; label: string; mult: number };
export const PAYTABLE: readonly Win[] = [
  { id: "seven", label: "7 7 7", mult: 300 },
  { id: "diamond", label: "Three diamonds", mult: 75 },
  { id: "bar", label: "Three BARs", mult: 30 },
  { id: "bell", label: "Three bells", mult: 15 },
  { id: "cherry3", label: "Three cherries", mult: 8 },
  { id: "lemon", label: "Three lemons", mult: 3 },
  { id: "cherry2", label: "Exactly two cherries", mult: 3 },
];
const WIN = Object.fromEntries(PAYTABLE.map((w) => [w.id, w])) as Record<string, Win>;

export type Line = readonly [Sym, Sym, Sym];
export type Stops = readonly [number, number, number];

/** What the payline pays, or null for a losing line. */
export function evaluate(line: Line): Win | null {
  const [a, b, c] = line;
  if (a === b && b === c) return a === "cherry" ? WIN["cherry3"]! : WIN[a]!;
  return line.filter((s) => s === "cherry").length === 2 ? WIN["cherry2"]! : null;
}

const at = (i: number): Sym => STRIP[((i % STOPS) + STOPS) % STOPS]!;
/** Three visible rows (top, payline, bottom) for a reel stopped on `stop`. */
export const windowAt = (stop: number): [Sym, Sym, Sym] => [at(stop - 1), at(stop), at(stop + 1)];
export const lineFor = (stops: Stops): Line => [at(stops[0]), at(stops[1]), at(stops[2])];

export function drawStops(rng: Rng): Stops {
  const one = () => Math.min(STOPS - 1, Math.floor(rng() * STOPS));
  return [one(), one(), one()];
}

export function exactStats() {
  const wins: Record<string, number> = {};
  let paid = 0;
  let returnUnits = 0;
  for (let a = 0; a < STOPS; a++)
    for (let b = 0; b < STOPS; b++)
      for (let c = 0; c < STOPS; c++) {
        const w = evaluate(lineFor([a, b, c]));
        if (!w) continue;
        wins[w.id] = (wins[w.id] ?? 0) + 1;
        paid++;
        returnUnits += w.mult;
      }
  const total = STOPS ** 3;
  return { total, wins, hitRate: paid / total, rtp: returnUnits / total };
}

export type SpinState = {
  phase: "idle" | "spinning";
  bet: number;
  stops: Stops | null;
  win: Win | null;
  payout: number;
  /** Increments once per accepted spin; lets the UI tell a new spin from a repeat tap. */
  spinId: number;
};
export const idleSpin = (): SpinState => ({
  phase: "idle",
  bet: 0,
  stops: null,
  win: null,
  payout: 0,
  spinId: 0,
});

export type SpinSettlement = { bet: number; payout: number; net: number };

/**
 * Begin a spin: the result is drawn and settled right now, the reels merely reveal it.
 * While a spin is in progress (or the bet is illegal) the call changes nothing and settles nothing,
 * so repeated taps can never re-roll or pay twice.
 */
export function startSpin(
  st: SpinState,
  bet: number,
  money: number,
  rng: Rng,
): { state: SpinState; settlement: SpinSettlement | null } {
  if (st.phase === "spinning" || bet <= 0 || bet > money) return { state: st, settlement: null };
  const stops = drawStops(rng);
  const win = evaluate(lineFor(stops));
  const payout = win ? win.mult * bet : 0;
  return {
    state: { phase: "spinning", bet, stops, win, payout, spinId: st.spinId + 1 },
    settlement: { bet, payout, net: payout - bet },
  };
}

/** The reveal finished (or was skipped/interrupted). Idempotent. */
export const finishSpin = (st: SpinState): SpinState =>
  st.phase === "spinning" ? { ...st, phase: "idle" } : st;
