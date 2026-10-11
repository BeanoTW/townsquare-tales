import { useEffect, useMemo, useRef, useState } from "react";
import type { Rng } from "@/lib/actions";
import {
  MIN_BET,
  chargeSession,
  clampBet,
  maxBet,
  money,
  recordResult,
  signed,
} from "@/lib/casino";
import { SLOT_LINES, pick } from "@/lib/casino-lines";
import type { GameState } from "@/lib/game-state";
import {
  PAYTABLE,
  STOPS,
  STRIP,
  SYMBOLS,
  exactStats,
  finishSpin,
  idleSpin,
  lineFor,
  startSpin,
  type SpinState,
  type Stops,
} from "@/lib/slots";
import { CasinoShell, RulesSheet } from "./CasinoShell";

const BET_LEVELS = [10, 20, 50, 100, 250, 500] as const;
const COPIES = 3;
/** Per-reel stop times (ms) and the length of the slow-down, so reels stop one after another. */
const STOP_AT = [900, 1350, 1800] as const;
const EASE_MS = 450;
const SPEED = 0.028; // cells per millisecond while spinning
const IDLE_STOPS: Stops = [0, 5, 10]; // lemon / cherry / bar: deliberately not a win

const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const wrap = (p: number) => ((p % STOPS) + STOPS) % STOPS;
/** Smallest position >= min that lands on `stop`. */
const landing = (min: number, stop: number) => stop + Math.ceil((min - stop) / STOPS) * STOPS;
const reduceMotion = () =>
  typeof window !== "undefined" &&
  typeof window.matchMedia === "function" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const RULES_SEEN = "tst-slots-rules-seen";
const seenRules = () => {
  try {
    return window.localStorage.getItem(RULES_SEEN) === "1";
  } catch {
    return true;
  }
};

function Reel({
  index,
  setCol,
}: {
  index: number;
  setCol: (i: number, el: HTMLDivElement | null) => void;
}) {
  const cells = useMemo(
    () => Array.from({ length: STOPS * COPIES }, (_, k) => STRIP[k % STOPS]!),
    [],
  );
  return (
    <div className="sl-reel" aria-hidden="true">
      <div className="sl-reel-col" ref={(el) => setCol(index, el)}>
        {cells.map((sym, k) => (
          <div
            key={k}
            className={`sl-cell ${sym === "bar" ? "is-bar" : ""} ${sym === "seven" ? "is-seven" : ""}`}
          >
            {SYMBOLS[sym].glyph}
          </div>
        ))}
      </div>
      <div className="sl-shade" />
    </div>
  );
}

export function SlotsGame({
  state,
  onChange,
  onExit,
  rng = Math.random,
}: {
  state: GameState;
  onChange: (next: GameState) => void;
  onExit: () => void;
  rng?: Rng;
}) {
  const stats = useMemo(() => exactStats(), []);
  const [betLevel, setBetLevel] = useState(0);
  const [spin, setSpin] = useState<SpinState>(idleSpin);
  const spinRef = useRef<SpinState>(spin);
  const [line, setLine] = useState<string>(() => pick(SLOT_LINES.welcome, rng));
  const [status, setStatus] = useState("Pick a bet and pull the lever.");
  const [good, setGood] = useState<boolean | undefined>(undefined);
  const [rules, setRules] = useState(false);
  const [resultText, setResultText] = useState("");
  const [winId, setWinId] = useState<string | null>(null);
  const paidSession = useRef(false);
  const cols = useRef<(HTMLDivElement | null)[]>([null, null, null]);
  const pos = useRef<number[]>([...IDLE_STOPS]);
  const raf = useRef<number | null>(null);
  /** After a spin ends, brief cooldown so a frantic triple-tap cannot buy a second spin by accident. */
  const lockUntil = useRef(0);
  const pending = useRef<{
    stops: Stops;
    text: string;
    win: string | null;
    net: number;
    line: string;
  } | null>(null);

  const bet = clampBet(BET_LEVELS[betLevel]!, state.money);
  const maxAllowed = maxBet(state.money);
  const spinning = spin.phase === "spinning";

  const paint = (i: number, p: number) => {
    const el = cols.current[i];
    if (!el) return;
    const offset = wrap(p) + STOPS - 1; // top row sits one cell above the payline
    el.style.transform = `translateY(${(-offset / (STOPS * COPIES)) * 100}%)`;
  };
  const setCol = (i: number, el: HTMLDivElement | null) => {
    cols.current[i] = el;
    if (el) paint(i, pos.current[i]!);
  };

  useEffect(() => {
    if (!seenRules()) setRules(true);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, []);

  const closeRules = () => {
    try {
      window.localStorage.setItem(RULES_SEEN, "1");
    } catch {
      /* ignore */
    }
    setRules(false);
  };

  /** The reveal is over (played out, skipped, or the player left): show the outcome, once. */
  const reveal = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    const p = pending.current;
    if (!p) return;
    pending.current = null;
    lockUntil.current = performance.now() + 600;
    p.stops.forEach((s, i) => {
      pos.current[i] = s;
      paint(i, s);
    });
    spinRef.current = finishSpin(spinRef.current);
    setSpin(spinRef.current);
    setResultText(p.text);
    setWinId(p.win);
    setGood(p.net >= 0 ? true : undefined);
    setStatus(p.text);
    setLine(p.line);
  };

  const animate = (stops: Stops) => {
    if (reduceMotion()) {
      reveal();
      return;
    }
    const from = [...pos.current];
    const target: (number | null)[] = [null, null, null];
    const stopPos: number[] = [0, 0, 0];
    const t0 = performance.now();
    const frame = (now: number) => {
      const t = now - t0;
      for (let i = 0; i < 3; i++) {
        const stopTime = STOP_AT[i]!;
        if (t < stopTime) {
          paint(i, from[i]! + SPEED * t);
        } else {
          if (target[i] === null) {
            stopPos[i] = from[i]! + SPEED * stopTime;
            target[i] = landing(stopPos[i]! + 3, stops[i]!);
          }
          const u = Math.min(1, (t - stopTime) / EASE_MS);
          paint(i, stopPos[i]! + (target[i]! - stopPos[i]!) * easeOut(u));
        }
      }
      if (t >= STOP_AT[2]! + EASE_MS) {
        reveal();
        return;
      }
      raf.current = requestAnimationFrame(frame);
    };
    raf.current = requestAnimationFrame(frame);
  };

  const pull = () => {
    // A second tap during a spin never re-rolls: it just skips ahead to the result already decided.
    if (spinRef.current.phase === "spinning") {
      reveal();
      return;
    }
    if (performance.now() < lockUntil.current) return;
    if (bet < MIN_BET) {
      setStatus("You can't cover the minimum bet.");
      setGood(false);
      setLine(pick(SLOT_LINES.broke, rng));
      return;
    }
    let base = state;
    if (!paidSession.current) {
      const c = chargeSession(state);
      if (!c.ok) {
        setStatus(c.message);
        setGood(false);
        return;
      }
      base = c.next;
    }
    const { state: next, settlement } = startSpin(spinRef.current, bet, base.money, rng);
    if (!settlement) return;
    paidSession.current = true;
    spinRef.current = next;
    setSpin(next);
    onChange(
      recordResult(
        { ...base, money: base.money - settlement.bet + settlement.payout },
        "slots",
        settlement.net,
      ),
    );
    const win = next.win;
    const lineSyms = lineFor(next.stops!);
    const names = lineSyms.map((s) => SYMBOLS[s].label).join(", ");
    const text = win
      ? `${win.label}: pays ×${win.mult}. Net ${signed(settlement.net)}.`
      : `No win (${names}). −${money(settlement.bet)}.`;
    pending.current = {
      stops: next.stops!,
      text,
      win: win?.id ?? null,
      net: settlement.net,
      line: pick(
        win
          ? win.mult >= 75
            ? win.id === "seven"
              ? SLOT_LINES.jackpot
              : SLOT_LINES.big
            : SLOT_LINES.small
          : SLOT_LINES.lose,
        rng,
      ),
    };
    setWinId(null);
    setResultText("");
    setGood(undefined);
    setStatus("Spinning...");
    setLine(pick(SLOT_LINES.spin, rng));
    animate(next.stops!);
  };

  /** Leaving mid-spin is safe: the spin was settled when it began, so just show the outcome and go. */
  const leave = () => {
    reveal();
    onExit();
  };

  const step = (d: number) =>
    setBetLevel((l) => Math.max(0, Math.min(BET_LEVELS.length - 1, l + d)));
  const winning = winId !== null && !spinning;

  const dock = (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-2" role="group" aria-label="Bet">
        <button
          type="button"
          className="cz-btn w-12 px-0"
          aria-label="Lower bet"
          disabled={spinning || betLevel === 0}
          onClick={() => step(-1)}
        >
          −
        </button>
        <span className="min-w-[88px] text-center font-bold" data-testid="slot-bet">
          Bet {money(bet)}
        </span>
        <button
          type="button"
          className="cz-btn w-12 px-0"
          aria-label="Raise bet"
          disabled={
            spinning || betLevel === BET_LEVELS.length - 1 || BET_LEVELS[betLevel + 1]! > maxAllowed
          }
          onClick={() => step(1)}
        >
          +
        </button>
      </div>
      <button
        type="button"
        className="cz-btn cz-btn-primary min-w-[120px]"
        disabled={maxAllowed < MIN_BET && !spinning}
        onClick={pull}
      >
        {spinning ? "Skip" : "Spin"}
      </button>
    </div>
  );

  return (
    <CasinoShell
      game="slots"
      title="Lucky Sevens Slots"
      state={state}
      status={status}
      statusGood={good}
      onLeave={leave}
      onRules={() => setRules(true)}
      rulesLabel="Odds"
      dock={dock}
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 pb-2">
        <p className="text-sm text-[#e6d8ba]" data-testid="machine-line">
          {line}
        </p>

        <div className={`sl-cabinet ${winning ? "is-winning" : ""}`}>
          <div className="sl-bulbs" aria-hidden="true" />
          <div className="mb-2 text-center text-lg font-extrabold tracking-widest text-[#ffe08a]">
            ★ LUCKY 7s ★
          </div>
          <div className="sl-window" style={{ ["--cell-h" as string]: "168px" }}>
            {[0, 1, 2].map((i) => (
              <Reel key={i} index={i} setCol={setCol} />
            ))}
            <div className="sl-line" aria-hidden="true" />
          </div>
          <button
            type="button"
            className={`sl-lever ${spinning ? "is-pulled" : ""}`}
            aria-label="Pull lever"
            onClick={pull}
          >
            <span className="stick" />
            <span className="knob" />
          </button>
          <p className="mt-2 text-center text-xs text-[#ffe08a]">
            Pays on the red centre line only
          </p>
        </div>

        <p aria-live="polite" className="sr-only" data-testid="slot-result">
          {resultText}
        </p>

        <section
          aria-label="Paytable"
          className="rounded-xl border-2 border-[#25242a] bg-[#3b2f52] p-2 text-sm"
        >
          <h3 className="mb-1 font-bold text-[#f3bd4b]">Paytable (× your bet)</h3>
          <ul className="grid grid-cols-1 gap-0.5">
            {PAYTABLE.map((w) => (
              <li
                key={w.id}
                className={`flex items-center justify-between rounded px-2 py-0.5 ${winId === w.id && !spinning ? "sl-win-row" : ""}`}
              >
                <span>{w.label}</span>
                <b>×{w.mult}</b>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {rules && (
        <RulesSheet title="Slots: how it works and the odds" onClose={closeRules}>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              Choose a bet ($10 to $500, never more than you hold) and press Spin or pull the lever.
            </li>
            <li>
              Your bet is taken and any prize is paid the moment the reels start. The spinning is
              just the reveal; tapping again skips it and never re-rolls.
            </li>
            <li>
              Three reels, each with the same 20 stops, each equally likely. Only the centre line
              pays.
            </li>
            <li>
              Per reel: one 7, two diamonds, three BARs, four bells, five cherries, five lemons.
            </li>
            <li>
              About {(stats.hitRate * 100).toFixed(1)}% of spins pay (1 in{" "}
              {(1 / stats.hitRate).toFixed(1)}). Over time the machine returns{" "}
              {(stats.rtp * 100).toFixed(2)}% of what is bet, so the house wins in the long run.
            </li>
            <li>
              Sitting down costs 1 hour and 5 energy. Only in-game cash is used; nothing can be
              bought.
            </li>
          </ul>
        </RulesSheet>
      )}
    </CasinoShell>
  );
}
