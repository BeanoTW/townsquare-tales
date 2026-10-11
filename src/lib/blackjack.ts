import type { Rng } from "@/lib/actions";

/**
 * Blackjack rules (all pure, so the table UI cannot disagree with the tests):
 *  - One fresh, shuffled 52-card deck per round.
 *  - Dealer stands on every 17, soft or hard, and draws on 16 or less.
 *  - The dealer checks for a natural up front, so a dealer blackjack ends the round at once.
 *  - A natural (Ace + ten-value on the first two cards) pays 3:2, unless the dealer also has one (push).
 *  - Double down: first two cards of a hand only, one extra card, stake doubles.
 *  - Split: one split per round, two cards of the same rank. Split aces get one card each and stand.
 *    Doubling after a split is allowed (not on split aces). A 21 after a split is an ordinary 21, not a natural.
 *  - Wagers are taken when committed (deal, double, split) and winnings are paid once by settleRound.
 */
export const SUITS = ["♠", "♥", "♦", "♣"] as const;
export const RANKS = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "10", "J", "Q", "K"] as const;
export type Suit = (typeof SUITS)[number];
export type Rank = (typeof RANKS)[number];
export type Card = { rank: Rank; suit: Suit };

export function freshDeck(): Card[] {
  return SUITS.flatMap((suit) => RANKS.map((rank) => ({ rank, suit })));
}

/** Fisher–Yates shuffle of a copy. */
export function shuffle(deck: readonly Card[], rng: Rng): Card[] {
  const out = [...deck];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.min(i, Math.floor(rng() * (i + 1)));
    const a = out[i]!;
    out[i] = out[j]!;
    out[j] = a;
  }
  return out;
}

export function cardValue(rank: Rank): number {
  if (rank === "A") return 11;
  return rank === "J" || rank === "Q" || rank === "K" ? 10 : Number(rank);
}

export type HandValue = { total: number; soft: boolean; bust: boolean };

export function handValue(cards: readonly Card[]): HandValue {
  let total = 0;
  let aces = 0;
  for (const c of cards) {
    total += cardValue(c.rank);
    if (c.rank === "A") aces++;
  }
  while (total > 21 && aces > 0) {
    total -= 10;
    aces--;
  }
  return { total, soft: aces > 0 && total <= 21, bust: total > 21 };
}

export const isNatural = (cards: readonly Card[], fromSplit = false) =>
  !fromSplit && cards.length === 2 && handValue(cards).total === 21;

/** Dealer rule: hit 16 or less, stand on all 17s (including soft 17). */
export const dealerMustHit = (cards: readonly Card[]) => handValue(cards).total < 17;

export type Hand = {
  cards: Card[];
  bet: number;
  doubled: boolean;
  fromSplit: boolean;
  done: boolean;
};
export type Round = {
  deck: Card[];
  dealer: Card[];
  hands: Hand[];
  active: number;
  /** "player": waiting for decisions. "over": all play finished, ready to settle. */
  phase: "player" | "over";
  holeRevealed: boolean;
  paid: boolean;
};
export type Outcome = "blackjack" | "win" | "push" | "lose" | "bust";
export type HandResult = { outcome: Outcome; payout: number; net: number };

const draw = (deck: Card[]): Card => {
  const c = deck.shift();
  if (!c) throw new Error("deck exhausted");
  return c;
};

export const totalWagered = (r: Round) => r.hands.reduce((n, h) => n + h.bet, 0);
const clone = (r: Round): Round => ({
  ...r,
  deck: [...r.deck],
  dealer: [...r.dealer],
  hands: r.hands.map((h) => ({ ...h, cards: [...h.cards] })),
});

/** Deal a round. Pass `deck` to stack the cards (tests); otherwise a shuffled deck is used. */
export function dealRound(bet: number, rng: Rng, deck?: readonly Card[]): Round {
  const d = deck ? [...deck] : shuffle(freshDeck(), rng);
  const p1 = draw(d);
  const d1 = draw(d);
  const p2 = draw(d);
  const d2 = draw(d);
  const r: Round = {
    deck: d,
    dealer: [d1, d2],
    hands: [{ cards: [p1, p2], bet, doubled: false, fromSplit: false, done: false }],
    active: 0,
    phase: "player",
    holeRevealed: false,
    paid: false,
  };
  if (isNatural(r.hands[0]!.cards) || isNatural(r.dealer)) {
    r.hands[0]!.done = true;
    r.holeRevealed = true;
    r.phase = "over";
  }
  return r;
}

/** Move to the next unfinished hand, or let the dealer play when none remain. */
function advance(r: Round): Round {
  const next = r.hands.findIndex((h) => !h.done);
  if (next >= 0) {
    r.active = next;
    return r;
  }
  r.holeRevealed = true;
  if (r.hands.some((h) => !handValue(h.cards).bust)) {
    while (dealerMustHit(r.dealer)) r.dealer.push(draw(r.deck));
  }
  r.phase = "over";
  return r;
}

/** After a card is added, a bust or 21 ends the hand automatically. */
function checkHand(r: Round, h: Hand): Round {
  const v = handValue(h.cards);
  if (v.bust || v.total === 21) h.done = true;
  return h.done ? advance(r) : r;
}

export function hit(round: Round): Round {
  if (round.phase !== "player") return round;
  const r = clone(round);
  const h = r.hands[r.active]!;
  h.cards.push(draw(r.deck));
  return checkHand(r, h);
}

export function stand(round: Round): Round {
  if (round.phase !== "player") return round;
  const r = clone(round);
  r.hands[r.active]!.done = true;
  return advance(r);
}

const splitAces = (h: Hand) => h.fromSplit && h.cards[0]?.rank === "A";

export function canDouble(round: Round, money: number): boolean {
  if (round.phase !== "player") return false;
  const h = round.hands[round.active]!;
  return h.cards.length === 2 && !splitAces(h) && money >= h.bet;
}

export function doubleDown(round: Round, money: number): Round {
  if (!canDouble(round, money)) return round;
  const r = clone(round);
  const h = r.hands[r.active]!;
  h.bet *= 2;
  h.doubled = true;
  h.cards.push(draw(r.deck));
  h.done = true;
  return advance(r);
}

export function canSplit(round: Round, money: number): boolean {
  if (round.phase !== "player" || round.hands.length !== 1) return false;
  const h = round.hands[0]!;
  return h.cards.length === 2 && h.cards[0]!.rank === h.cards[1]!.rank && money >= h.bet;
}

export function split(round: Round, money: number): Round {
  if (!canSplit(round, money)) return round;
  const r = clone(round);
  const h = r.hands[0]!;
  const [a, b] = h.cards as [Card, Card];
  const aces = a.rank === "A";
  const first: Hand = {
    cards: [a, draw(r.deck)],
    bet: h.bet,
    doubled: false,
    fromSplit: true,
    done: aces,
  };
  const second: Hand = {
    cards: [b, draw(r.deck)],
    bet: h.bet,
    doubled: false,
    fromSplit: true,
    done: aces,
  };
  r.hands = [first, second];
  r.active = 0;
  for (const x of r.hands) if (!x.done && handValue(x.cards).total === 21) x.done = true;
  return advance(r);
}

export type Settlement = { round: Round; results: HandResult[]; payout: number; net: number };

/**
 * Pay the round exactly once. `payout` is the money returned to the player (stake included),
 * `net` is payout minus all stakes. Passing `forfeit` loses every stake (leaving a live hand).
 * Settling an already-paid round throws, so a double click can never pay twice.
 */
export function settleRound(round: Round, forfeit = false): Settlement {
  if (round.paid) throw new Error("round already settled");
  if (round.phase !== "over" && !forfeit) throw new Error("round still in play");
  const dealerTotal = handValue(round.dealer);
  const dealerNatural = isNatural(round.dealer);
  const results = round.hands.map((h): HandResult => {
    const v = handValue(h.cards);
    let outcome: Outcome;
    if (forfeit) outcome = v.bust ? "bust" : "lose";
    else if (v.bust) outcome = "bust";
    else if (isNatural(h.cards, h.fromSplit)) outcome = dealerNatural ? "push" : "blackjack";
    else if (dealerNatural) outcome = "lose";
    else if (dealerTotal.bust || v.total > dealerTotal.total) outcome = "win";
    else if (v.total === dealerTotal.total) outcome = "push";
    else outcome = "lose";
    const payout =
      outcome === "blackjack"
        ? (h.bet * 5) / 2
        : outcome === "win"
          ? h.bet * 2
          : outcome === "push"
            ? h.bet
            : 0;
    return { outcome, payout, net: payout - h.bet };
  });
  const payout = results.reduce((n, r) => n + r.payout, 0);
  return {
    round: { ...clone(round), phase: "over", holeRevealed: true, paid: true },
    results,
    payout,
    net: payout - totalWagered(round),
  };
}
