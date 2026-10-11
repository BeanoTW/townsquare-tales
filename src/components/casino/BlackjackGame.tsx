import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  canDouble,
  canSplit,
  dealRound,
  doubleDown,
  handValue,
  hit,
  settleRound,
  split,
  stand,
  totalWagered,
  type Card,
  type Outcome,
  type Round,
  type Settlement,
} from "@/lib/blackjack";
import {
  CHIPS,
  MAX_BET,
  MIN_BET,
  chargeSession,
  clampBet,
  maxBet,
  money,
  recordResult,
  signed,
} from "@/lib/casino";
import { DEALER, pick } from "@/lib/casino-lines";
import type { Rng } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { CasinoShell, RulesSheet } from "./CasinoShell";

const RANK_NAME: Record<string, string> = { A: "Ace", J: "Jack", Q: "Queen", K: "King" };
const SUIT_NAME = { "♠": "spades", "♥": "hearts", "♦": "diamonds", "♣": "clubs" } as const;
const cardName = (c: Card) => `${RANK_NAME[c.rank] ?? c.rank} of ${SUIT_NAME[c.suit]}`;

function PlayingCard({ card, down, delay }: { card: Card; down: boolean; delay: number }) {
  const red = card.suit === "♥" || card.suit === "♦";
  return (
    <div
      className={`bj-card bj-deal ${down ? "is-down" : ""}`}
      style={{ ["--delay" as string]: `${delay}ms` }}
      role="img"
      aria-label={down ? "Face-down card" : cardName(card)}
    >
      <div className="bj-card-inner">
        <div className={`bj-face ${red ? "bj-red" : "bj-black"}`}>
          <span className="corner">
            {card.rank}
            <small>{card.suit}</small>
          </span>
          <span className="pip">{card.suit}</span>
        </div>
        <div className="bj-back" />
      </div>
    </div>
  );
}

function ChipStack({ amount }: { amount: number }) {
  const chips: number[] = [];
  let left = amount;
  for (const v of [...CHIPS].reverse()) {
    while (left >= v && chips.length < 6) {
      chips.push(v);
      left -= v;
    }
  }
  return (
    <span className="bj-stake" aria-hidden="true">
      {chips.map((v, i) => (
        <span key={i} className={`bj-chip bj-chip-${v}`}>
          {v}
        </span>
      ))}
    </span>
  );
}

function Dealer({ line }: { line: string }) {
  return (
    <div className="flex items-start gap-3">
      <svg viewBox="0 0 64 64" width="56" height="56" aria-hidden="true" className="shrink-0">
        <circle cx="32" cy="26" r="16" fill="#f1d6ae" stroke="#25242a" strokeWidth="3" />
        <path d="M23 24h7M34 24h7" stroke="#25242a" strokeWidth="3" strokeLinecap="round" />
        <path d="M25 24h5v3h-5zM34 24h5v3h-5z" fill="#f1d6ae" />
        <path
          d="M26 35q6-2 12 0"
          stroke="#25242a"
          strokeWidth="3"
          fill="none"
          strokeLinecap="round"
        />
        <path d="M32 42l-9-5v10zM32 42l9-5v10z" fill="#cf4b47" stroke="#25242a" strokeWidth="2.5" />
        <rect x="29" y="40" width="6" height="6" fill="#cf4b47" stroke="#25242a" strokeWidth="2" />
      </svg>
      <p className="cz-dealer-bubble min-w-0 flex-1 text-[#25242a]" data-testid="dealer-line">
        {line}
      </p>
    </div>
  );
}

const OUTCOME_TEXT: Record<Outcome, string> = {
  blackjack: "Blackjack",
  win: "Win",
  push: "Push",
  lose: "Lose",
  bust: "Bust",
};

const HINTS_SEEN = "tst-blackjack-rules-seen";
const seenRules = () => {
  try {
    return window.localStorage.getItem(HINTS_SEEN) === "1";
  } catch {
    return true;
  }
};
const markRules = () => {
  try {
    window.localStorage.setItem(HINTS_SEEN, "1");
  } catch {
    /* storage may be unavailable; the rules button still works */
  }
};

export function BlackjackGame({
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
  const [bet, setBet] = useState(() => clampBet(MIN_BET, state.money));
  const [round, setRound] = useState<Round | null>(null);
  const [settlement, setSettlement] = useState<Settlement | null>(null);
  const [line, setLine] = useState<string>(() =>
    pick(state.money < MIN_BET ? DEALER.broke : DEALER.welcome, rng),
  );
  const [status, setStatus] = useState("Place a bet, then deal.");
  const [good, setGood] = useState<boolean | undefined>(undefined);
  const [rules, setRules] = useState(false);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const paidSession = useRef(false);
  const settledFor = useRef<Round | null>(null);

  useEffect(() => {
    if (!seenRules()) setRules(true);
  }, []);

  const closeRules = () => {
    markRules();
    setRules(false);
  };

  const live = round !== null && round.phase === "player";
  const wagered = round ? totalWagered(round) : 0;

  /** Pay out once, as soon as a round is over. The ref guards against any repeated effect run. */
  useEffect(() => {
    if (!round || round.phase !== "over" || round.paid || settledFor.current === round) return;
    settledFor.current = round;
    const s = settleRound(round);
    let next: GameState = { ...state, money: state.money + s.payout };
    next = recordResult(next, "blackjack", s.net);
    onChange(next);
    setRound(s.round);
    setSettlement(s);
    const outcomes = s.results.map((r) => r.outcome);
    const natural = outcomes.includes("blackjack");
    const dealerNatural = round.dealer.length === 2 && handValue(round.dealer).total === 21;
    const first = s.results[0]!.outcome;
    const dealerBust = handValue(round.dealer).bust;
    let pool: readonly string[];
    if (natural) pool = DEALER.playerBlackjack;
    else if (dealerNatural && s.net < 0) pool = DEALER.dealerBlackjack;
    else if (s.net > 0)
      pool =
        outcomes.length === 1 && handValue(round.hands[0]!.cards).total === 21
          ? DEALER.twentyOne
          : dealerBust
            ? DEALER.dealerBust
            : DEALER.win;
    else if (s.net === 0) pool = DEALER.push;
    else pool = first === "bust" ? DEALER.bust : DEALER.lose;
    setLine(pick(pool, rng));
    setGood(s.net >= 0);
    setStatus(
      s.net > 0
        ? `You won ${money(s.net)}.`
        : s.net < 0
          ? `You lost ${money(-s.net)}.`
          : "Push. Your bet comes back.",
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round]);

  const deal = () => {
    if (live) return;
    const wager = clampBet(bet, state.money);
    if (wager < MIN_BET) {
      setStatus("You can't cover the minimum bet.");
      setGood(false);
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
      paidSession.current = true;
    }
    base = { ...base, money: base.money - wager };
    onChange(base);
    setBet(wager);
    setSettlement(null);
    setGood(undefined);
    setStatus("Your move.");
    setLine(
      pick(wager >= 200 ? DEALER.bigBet : wager <= MIN_BET ? DEALER.smallBet : DEALER.deal, rng),
    );
    setRound(dealRound(wager, rng));
  };

  /** Apply a player move; any extra stake (double/split) leaves the wallet at the same moment. */
  const act = (move: "hit" | "stand" | "double" | "split") => {
    if (!round || round.phase !== "player") return;
    let next = round;
    if (move === "hit") next = hit(round);
    else if (move === "stand") next = stand(round);
    else if (move === "double") next = doubleDown(round, state.money);
    else next = split(round, state.money);
    if (next === round) return;
    const extra = totalWagered(next) - totalWagered(round);
    if (extra > 0) onChange({ ...state, money: state.money - extra });
    setRound(next);
    const pool =
      move === "hit"
        ? DEALER.hit
        : move === "stand"
          ? DEALER.stand
          : move === "double"
            ? DEALER.double
            : DEALER.split;
    setLine(pick(pool, rng));
  };

  const requestLeave = useCallback(() => {
    if (live) setConfirmLeave(true);
    else onExit();
  }, [live, onExit]);

  const forfeitAndLeave = () => {
    if (round && round.phase === "player" && !round.paid) {
      const s = settleRound(round, true);
      onChange(recordResult(state, "blackjack", s.net));
    }
    onExit();
  };

  const maxAllowed = maxBet(state.money);
  const addChip = (v: number) => setBet((b) => clampBet(b + v, state.money));
  const dealerShown = useMemo(() => {
    if (!round) return null;
    return round.holeRevealed ? handValue(round.dealer) : handValue([round.dealer[0]!]);
  }, [round]);

  const handsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    handsRef.current?.scrollIntoView?.({ block: "nearest" });
  }, [round]);

  const splitOk = round ? canSplit(round, state.money) : false;
  const doubleOk = round ? canDouble(round, state.money) : false;

  const dock = live ? (
    <div className="grid grid-cols-2 gap-2" role="group" aria-label="Your move">
      <button type="button" className="cz-btn cz-btn-primary" onClick={() => act("hit")}>
        Hit
      </button>
      <button type="button" className="cz-btn cz-btn-primary" onClick={() => act("stand")}>
        Stand
      </button>
      <button
        type="button"
        className="cz-btn"
        disabled={!doubleOk}
        aria-label={`Double down${round && doubleOk ? ` for ${money(round.hands[round.active]!.bet)} more` : ""}`}
        onClick={() => act("double")}
      >
        Double{round && doubleOk ? ` (+${money(round.hands[round.active]!.bet)})` : ""}
      </button>
      <button type="button" className="cz-btn" disabled={!splitOk} onClick={() => act("split")}>
        Split{round && splitOk ? ` (+${money(round.hands[0]!.bet)})` : ""}
      </button>
    </div>
  ) : (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-1" role="group" aria-label="Chips">
        {CHIPS.map((v) => (
          <button
            key={v}
            type="button"
            className={`bj-chip bj-chip-${v}`}
            aria-label={`Add ${money(v)} chip`}
            disabled={maxAllowed < v}
            onClick={() => addChip(v)}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-sm">
          Bet <b data-testid="bet">{money(clampBet(bet, state.money))}</b>{" "}
          <span className="text-[#e6d8ba]">(max {money(Math.min(MAX_BET, maxAllowed))})</span>
        </p>
        <span className="flex shrink-0 gap-2">
          <button type="button" className="cz-btn px-3" onClick={() => setBet(MIN_BET)}>
            Min
          </button>
          <button type="button" className="cz-btn px-3" onClick={() => setBet(maxAllowed)}>
            Max
          </button>
        </span>
      </div>
      <button
        type="button"
        className="cz-btn cz-btn-primary w-full"
        disabled={maxAllowed < MIN_BET}
        onClick={deal}
      >
        {settlement ? "Deal again" : "Deal"} · {money(clampBet(bet, state.money))}
      </button>
    </div>
  );

  return (
    <CasinoShell
      game="blackjack"
      title="Blackjack"
      state={state}
      status={status}
      statusGood={good}
      onLeave={requestLeave}
      onRules={() => setRules(true)}
      rulesLabel="Rules"
      dock={dock}
    >
      <div className="mx-auto flex max-w-md flex-col gap-3 pb-2">
        <Dealer line={line} />

        <section className="bj-felt px-3 pb-4 pt-3" aria-label="Blackjack table">
          <p className="bj-arc">Blackjack pays 3 to 2 · Dealer stands on 17</p>

          <div className="mt-2 min-h-[110px]" aria-label="Dealer's hand">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="font-bold">Dealer</span>
              {round && dealerShown && (
                <span data-testid="dealer-total">
                  {round.holeRevealed ? (dealerShown.bust ? "Bust " : "") : "Showing "}
                  {dealerShown.total}
                </span>
              )}
            </div>
            <div className="flex min-h-[78px] pl-1">
              {round ? (
                round.dealer.map((c, i) => (
                  <PlayingCard
                    key={`d${i}${c.rank}${c.suit}`}
                    card={c}
                    down={i === 1 && !round.holeRevealed}
                    delay={i === 0 ? 120 : i === 1 ? 360 : (i - 1) * 260}
                  />
                ))
              ) : (
                <span className="text-sm text-[#cfe9d8]">Waiting for your bet.</span>
              )}
            </div>
          </div>

          <div className="mt-3" aria-label="Your hands" ref={handsRef}>
            {round ? (
              <div className="flex flex-wrap gap-x-5 gap-y-3">
                {round.hands.map((h, hi) => {
                  const v = handValue(h.cards);
                  const result = settlement?.results[hi];
                  const active = live && round.active === hi;
                  return (
                    <div
                      key={hi}
                      data-hand={hi}
                      className={`rounded-lg p-1 ${active && round.hands.length > 1 ? "outline outline-2 outline-[#f3bd4b]" : ""}`}
                    >
                      <div className="mb-1 flex items-center gap-2 text-sm">
                        <span className="font-bold">
                          {round.hands.length > 1 ? `Hand ${hi + 1}` : "You"}
                        </span>
                        <span data-testid={`total-${hi}`}>
                          {v.bust ? `Bust ${v.total}` : v.soft ? `Soft ${v.total}` : v.total}
                        </span>
                        {result && (
                          <span className="font-bold text-[#f3bd4b]">
                            {OUTCOME_TEXT[result.outcome]}
                          </span>
                        )}
                      </div>
                      <div className="flex pl-1">
                        {h.cards.map((c, i) => (
                          <PlayingCard
                            key={`p${hi}${i}${c.rank}${c.suit}`}
                            card={c}
                            down={false}
                            delay={hi === 0 && i < 2 ? (i === 0 ? 0 : 240) : 80}
                          />
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs">
                        <ChipStack amount={h.bet} />
                        <span>{money(h.bet)}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-[#cfe9d8]">Your cards will land here.</p>
            )}
          </div>
        </section>

        {!live && settlement && round && (
          <div
            key={String(wagered)}
            className="bj-banner rounded-xl border-2 border-[#25242a] bg-[#fff8e6] p-2 text-center text-[#25242a]"
            role="status"
            data-testid="result"
          >
            <p className="text-lg font-bold">
              {settlement.net > 0 ? "You win" : settlement.net < 0 ? "House wins" : "Push"}{" "}
              {settlement.net !== 0 && <span>{signed(settlement.net)}</span>}
            </p>
            <p className="text-xs text-[#4a4855]">
              Wagered {money(totalWagered(round))} · returned {money(settlement.payout)}
            </p>
          </div>
        )}
      </div>

      {rules && (
        <RulesSheet title="How to play Blackjack" onClose={closeRules}>
          <p>Beat the dealer by getting closer to 21 without going over.</p>
          <ul className="list-disc space-y-1 pl-5">
            <li>Number cards count as their number, J/Q/K count 10, an Ace counts 11 or 1.</li>
            <li>Bets go up in $10 steps, up to $500 and never more than you hold.</li>
            <li>
              <b>Hit</b> takes a card. <b>Stand</b> keeps your hand.
            </li>
            <li>
              <b>Double down</b> on your first two cards: your bet doubles and you get exactly one
              more card.
            </li>
            <li>
              <b>Split</b> two cards of the same rank into two hands, each with its own bet. Split
              aces get one card each.
            </li>
            <li>
              Blackjack (Ace + ten-value card) pays 3 to 2. A tie is a push and your bet comes back.
            </li>
            <li>The dealer must hit 16 or less and stands on every 17.</li>
            <li>
              Sitting down costs 1 hour and 5 energy. Leaving a hand half-played forfeits its bet.
            </li>
          </ul>
          <p className="text-xs text-[#4a4855]">
            Only in-game cash is ever used. There is no way to buy more.
          </p>
        </RulesSheet>
      )}

      {confirmLeave && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 p-4">
          <div
            role="alertdialog"
            aria-modal="true"
            aria-label="Leave table"
            className="w-full max-w-sm rounded-2xl border-2 border-[#25242a] bg-[#fff8e6] p-4 text-[#25242a]"
          >
            <p className="font-bold">Leave mid-hand?</p>
            <p className="mt-1 text-sm">
              You'll forfeit your {money(wagered)} bet. {DEALER.forfeit[0]}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <button type="button" className="cz-btn" onClick={() => setConfirmLeave(false)}>
                Keep playing
              </button>
              <button type="button" className="cz-btn cz-btn-primary" onClick={forfeitAndLeave}>
                Forfeit and leave
              </button>
            </div>
          </div>
        </div>
      )}
    </CasinoShell>
  );
}
