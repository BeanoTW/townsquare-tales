import { describe, expect, it } from "vitest";
import {
  canDouble,
  canSplit,
  dealRound,
  dealerMustHit,
  doubleDown,
  freshDeck,
  handValue,
  hit,
  isNatural,
  settleRound,
  shuffle,
  split,
  stand,
  totalWagered,
  type Card,
  type Rank,
  type Round,
} from "@/lib/blackjack";

const SUIT: Record<string, Card["suit"]> = { S: "♠", H: "♥", D: "♦", C: "♣" };
/** "10H" -> ten of hearts. */
const c = (s: string): Card => ({ rank: s.slice(0, -1) as Rank, suit: SUIT[s.slice(-1)]! });
const hand = (...s: string[]) => s.map(c);
/** Stacked deal: player, dealer, player, dealer, then the draw pile in order. */
const stack = (player: [string, string], dealer: [string, string], ...rest: string[]) =>
  [player[0], dealer[0], player[1], dealer[1], ...rest].map(c);
const rng0 = () => 0.5;
const play = (r: Round) => r;

describe("hand values", () => {
  it("counts numbers and face cards", () => {
    expect(handValue(hand("9S", "7H")).total).toBe(16);
    expect(handValue(hand("KS", "QH", "JD")).total).toBe(30);
  });
  it("counts an ace as 11 when it fits, otherwise 1", () => {
    expect(handValue(hand("AS", "6H"))).toEqual({ total: 17, soft: true, bust: false });
    expect(handValue(hand("AS", "6H", "9D"))).toEqual({ total: 16, soft: false, bust: false });
    expect(handValue(hand("AS", "AH"))).toEqual({ total: 12, soft: true, bust: false });
    expect(handValue(hand("AS", "AH", "9D")).total).toBe(21);
    expect(handValue(hand("AS", "AH", "AD", "AC", "8S")).total).toBe(12);
  });
  it("detects busts", () => {
    expect(handValue(hand("KS", "QH", "2D")).bust).toBe(true);
    expect(handValue(hand("KS", "QH", "AD")).bust).toBe(false);
  });
  it("only a two-card 21 is a natural, and never after a split", () => {
    expect(isNatural(hand("AS", "KH"))).toBe(true);
    expect(isNatural(hand("7S", "7H", "7D"))).toBe(false);
    expect(isNatural(hand("AS", "KH"), true)).toBe(false);
  });
});

describe("deck", () => {
  it("has 52 unique cards", () => {
    const d = freshDeck();
    expect(d).toHaveLength(52);
    expect(new Set(d.map((x) => x.rank + x.suit)).size).toBe(52);
  });
  it("shuffles into a permutation without touching the original", () => {
    const d = freshDeck();
    let n = 0;
    const seq = () => ((n = (n * 7 + 3) % 11), n / 11);
    const s = shuffle(d, seq);
    expect(s).toHaveLength(52);
    expect([...s].map((x) => x.rank + x.suit).sort()).toEqual(d.map((x) => x.rank + x.suit).sort());
    expect(s).not.toEqual(d);
    expect(d).toEqual(freshDeck());
  });
  it("deals from a real shuffled deck with no repeated card", () => {
    const r = dealRound(10, Math.random);
    const seen = [...r.dealer, ...r.hands[0]!.cards, ...r.deck].map((x) => x.rank + x.suit);
    expect(new Set(seen).size).toBe(52);
  });
});

describe("dealer rule: stands on every 17", () => {
  it("hits 16 and below, stands on hard and soft 17", () => {
    expect(dealerMustHit(hand("10S", "6H"))).toBe(true);
    expect(dealerMustHit(hand("10S", "7H"))).toBe(false);
    expect(dealerMustHit(hand("AS", "6H"))).toBe(false); // soft 17
    expect(dealerMustHit(hand("AS", "5H"))).toBe(true); // soft 16
  });
  it("draws until 17 or more once the player stands", () => {
    const r = stand(dealRound(10, rng0, stack(["10S", "9H"], ["6D", "5C"], "4S", "9D")));
    expect(r.phase).toBe("over");
    expect(r.dealer.map((x) => x.rank)).toEqual(["6", "5", "4", "9"]);
    expect(handValue(r.dealer).total).toBeGreaterThanOrEqual(17);
  });
  it("does not draw when the player has already busted", () => {
    let r = dealRound(10, rng0, stack(["10S", "6H"], ["6D", "5C"], "KS", "9D"));
    r = hit(r);
    expect(r.phase).toBe("over");
    expect(r.dealer).toHaveLength(2);
    expect(settleRound(r).results[0]!.outcome).toBe("bust");
  });
});

describe("natural blackjack", () => {
  it("pays 3:2", () => {
    const r = dealRound(100, rng0, stack(["AS", "KH"], ["9D", "7C"]));
    expect(r.phase).toBe("over");
    const s = settleRound(r);
    expect(s.results[0]).toEqual({ outcome: "blackjack", payout: 250, net: 150 });
    expect(s.net).toBe(150);
  });
  it("pushes when the dealer also has one", () => {
    const s = settleRound(dealRound(50, rng0, stack(["AS", "KH"], ["AD", "QC"])));
    expect(s.results[0]!.outcome).toBe("push");
    expect(s.net).toBe(0);
  });
  it("loses at once to a dealer natural", () => {
    const r = dealRound(50, rng0, stack(["10S", "9H"], ["AD", "KC"]));
    expect(r.phase).toBe("over");
    expect(r.holeRevealed).toBe(true);
    const s = settleRound(r);
    expect(s.results[0]!.outcome).toBe("lose");
    expect(s.net).toBe(-50);
  });
  it("a three-card 21 does not beat a natural", () => {
    const s = settleRound(dealRound(10, rng0, stack(["AS", "KH"], ["7D", "7C"], "7S")));
    expect(s.results[0]!.outcome).toBe("blackjack");
  });
});

describe("settlement", () => {
  const finish = (p: [string, string], d: [string, string], ...rest: string[]) =>
    settleRound(stand(dealRound(20, rng0, stack(p, d, ...rest)))).results[0]!;
  it("wins pay 1:1, losses pay nothing, equal totals push", () => {
    expect(finish(["10S", "9H"], ["10D", "7C"])).toEqual({ outcome: "win", payout: 40, net: 20 });
    expect(finish(["10S", "7H"], ["10D", "9C"])).toEqual({ outcome: "lose", payout: 0, net: -20 });
    expect(finish(["10S", "8H"], ["10D", "8C"])).toEqual({ outcome: "push", payout: 20, net: 0 });
  });
  it("player wins when the dealer busts", () => {
    expect(finish(["10S", "2H"], ["10D", "6C"], "KS").outcome).toBe("win");
  });
  it("a player 21 made with several cards beats dealer 20", () => {
    let r = dealRound(10, rng0, stack(["5S", "6H"], ["10D", "KC"], "KS"));
    r = hit(r); // 21 stands automatically
    expect(r.phase).toBe("over");
    expect(settleRound(r).results[0]!.outcome).toBe("win");
  });
  it("refuses to pay the same round twice", () => {
    const s = settleRound(stand(dealRound(10, rng0, stack(["10S", "9H"], ["10D", "7C"]))));
    expect(() => settleRound(s.round)).toThrow();
  });
  it("refuses to settle a hand still in play", () => {
    expect(() => settleRound(dealRound(10, rng0, stack(["10S", "9H"], ["10D", "7C"])))).toThrow();
  });
  it("a forfeited live hand loses the stake exactly once", () => {
    const live = dealRound(40, rng0, stack(["10S", "9H"], ["10D", "7C"]));
    const s = settleRound(live, true);
    expect(s.payout).toBe(0);
    expect(s.net).toBe(-40);
    expect(() => settleRound(s.round, true)).toThrow();
  });
});

describe("hit and bust", () => {
  it("adds a card, keeps playing under 21 and busts over", () => {
    let r = dealRound(10, rng0, stack(["5S", "4H"], ["10D", "7C"], "3S", "KD"));
    r = hit(r);
    expect(r.phase).toBe("player");
    expect(handValue(r.hands[0]!.cards).total).toBe(12);
    r = hit(r);
    expect(r.phase).toBe("over");
    expect(handValue(r.hands[0]!.cards).bust).toBe(true);
  });
  it("does nothing once the round is over", () => {
    const r = stand(dealRound(10, rng0, stack(["10S", "9H"], ["10D", "7C"])));
    expect(hit(r)).toBe(r);
    expect(stand(r)).toBe(r);
  });
  it("does not mutate the previous round", () => {
    const r = dealRound(10, rng0, stack(["5S", "4H"], ["10D", "7C"], "3S"));
    const before = JSON.stringify(r);
    hit(r);
    expect(JSON.stringify(r)).toBe(before);
  });
});

describe("double down", () => {
  const base = () => dealRound(50, rng0, stack(["5S", "6H"], ["10D", "7C"], "10S", "2D"));
  it("needs two cards and enough money", () => {
    expect(canDouble(base(), 50)).toBe(true);
    expect(canDouble(base(), 49)).toBe(false);
    expect(
      canDouble(hit(dealRound(50, rng0, stack(["2S", "3H"], ["10D", "7C"], "2D", "9S"))), 500),
    ).toBe(false);
  });
  it("doubles the stake, takes one card and stands", () => {
    const before = base();
    const r = doubleDown(before, 50);
    expect(r.hands[0]!.bet).toBe(100);
    expect(r.hands[0]!.cards).toHaveLength(3);
    expect(totalWagered(r) - totalWagered(before)).toBe(50);
    expect(r.phase).toBe("over");
    const s = settleRound(r); // 5+6+10 = 21 beats 17
    expect(s.results[0]).toEqual({ outcome: "win", payout: 200, net: 100 });
  });
  it("a lost double costs both stakes", () => {
    const r = doubleDown(dealRound(50, rng0, stack(["5S", "4H"], ["10D", "7C"], "2S")), 50);
    expect(settleRound(r).net).toBe(-100);
  });
  it("is ignored when it is not allowed", () => {
    const r = base();
    expect(doubleDown(r, 10)).toBe(r);
  });
});

describe("split", () => {
  const pair = (extra: string[] = []) =>
    dealRound(50, rng0, stack(["8S", "8H"], ["10D", "7C"], ...extra));
  it("only offers a split on equal ranks with enough money, once", () => {
    expect(canSplit(pair(["3S", "2D"]), 50)).toBe(true);
    expect(canSplit(pair(["3S", "2D"]), 49)).toBe(false);
    expect(canSplit(dealRound(10, rng0, stack(["10S", "KH"], ["9D", "7C"])), 100)).toBe(false);
    const s = split(pair(["3S", "2D", "AS", "AD"]), 100);
    expect(canSplit(s, 1000)).toBe(false);
  });
  it("makes two hands, each with its own stake", () => {
    const r = split(pair(["3S", "2D", "9C"]), 50);
    expect(r.hands).toHaveLength(2);
    expect(r.hands.map((h) => h.cards.length)).toEqual([2, 2]);
    expect(totalWagered(r)).toBe(100);
    expect(r.active).toBe(0);
  });
  it("plays the hands in order, then the dealer, and settles each hand on its own", () => {
    // hand 1: 8+3=11, hand 2: 8+2=10. Hit hand 1 -> 21 (auto), hit hand 2 -> 20.
    let r = split(pair(["3S", "2D", "10C", "10H"]), 50);
    r = hit(r); // hand 1: 8,3,10 = 21
    expect(r.active).toBe(1);
    r = hit(r); // hand 2: 8,2,10 = 20
    r = stand(r);
    expect(r.phase).toBe("over");
    const s = settleRound(r); // dealer 17
    expect(s.results.map((x) => x.outcome)).toEqual(["win", "win"]);
    expect(s.payout).toBe(200);
    expect(s.net).toBe(100);
  });
  it("can win one hand and lose the other", () => {
    let r = split(pair(["10S", "2D", "5C"]), 50); // hand 1: 8+10=18; hand 2: 8+2=10
    r = stand(r); // 18 stands
    r = hit(r); // 10+5 = 15
    r = stand(r);
    const s = settleRound(r); // dealer 17: 18 wins, 15 loses
    expect(s.results.map((x) => x.outcome)).toEqual(["win", "lose"]);
    expect(s.net).toBe(0);
  });
  it("split aces get one card each and the hands finish automatically", () => {
    const r = dealRound(50, rng0, stack(["AS", "AH"], ["10D", "7C"], "5S", "9D"));
    const s = split(r, 50);
    expect(s.phase).toBe("over");
    expect(s.hands.every((h) => h.cards.length === 2 && h.done)).toBe(true);
    expect(settleRound(s).results.map((x) => x.outcome)).toEqual(["lose", "win"]); // A+5=16 vs 17, A+9=20
  });
  it("a 21 after splitting aces is a plain win, not a 3:2 natural", () => {
    const r = dealRound(50, rng0, stack(["AS", "AH"], ["10D", "7C"], "KS", "9D"));
    const s = settleRound(split(r, 50));
    expect(s.results[0]).toEqual({ outcome: "win", payout: 100, net: 50 });
  });
  it("allows doubling a split hand", () => {
    const r = split(pair(["3S", "2D", "9C", "10H"]), 100); // hand 1 is 8+3 = 11
    expect(canDouble(r, 50)).toBe(true);
    const d = doubleDown(r, 100);
    expect(d.hands[0]!.bet).toBe(100);
    expect(d.active).toBe(1);
    expect(totalWagered(d)).toBe(150);
  });
  it("no dealer draw when every split hand busts", () => {
    let r = split(pair(["6S", "6D", "KC", "KH"]), 50); // 14 and 14
    r = hit(r);
    r = hit(r);
    expect(r.phase).toBe("over");
    expect(r.dealer).toHaveLength(2);
    expect(settleRound(r).net).toBe(-100);
  });
});

describe("round bookkeeping", () => {
  it("the money moved over a whole round always equals payout minus stakes", () => {
    for (let seed = 1; seed <= 300; seed++) {
      let n = seed;
      const rng = () => ((n = (n * 1103515245 + 12345) % 2147483648), n / 2147483648);
      let r = dealRound(30, rng);
      let money = 1000 - 30;
      let guard = 0;
      while (r.phase === "player" && guard++ < 20) {
        const choice = Math.floor(rng() * 4);
        const before = totalWagered(r);
        if (choice === 0) r = hit(r);
        else if (choice === 1) r = stand(r);
        else if (choice === 2) r = doubleDown(r, money);
        else r = split(r, money);
        money -= totalWagered(r) - before;
      }
      const s = settleRound(play(r));
      money += s.payout;
      expect(money).toBe(1000 + s.net);
      expect(s.payout).toBeGreaterThanOrEqual(0);
    }
  });
});
