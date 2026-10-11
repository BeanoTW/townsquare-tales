import type { Rng } from "@/lib/actions";

/** Dealer, machine and staff patter. Pure data so the UI and tests share it. */
export const pick = <T>(items: readonly T[], rng: Rng): T =>
  items[Math.min(items.length - 1, Math.floor(rng() * items.length))]!;

export const DEALER = {
  welcome: [
    "Sit. Bet. Try to look like you meant it.",
    "Welcome to my table. Mind the felt, it's had a hard life.",
  ],
  broke: ["Come back when you own money.", "The house accepts cash, not optimism."],
  bigBet: [
    "Bold strategy. Financially questionable, but bold.",
    "That's either confidence or a cry for help.",
  ],
  smallBet: ["Ten dollars. Living dangerously, I see.", "Cautious. The bar is that way."],
  deal: [
    "Cards are out. Try not to narrate.",
    "Here we go. Thrilling.",
    "Dealing. Don't touch anything.",
  ],
  hit: ["Another card? Bless.", "Optimism. Cute.", "Hit it is."],
  stand: ["Standing. A rare act of restraint.", "Playing it safe. Won't save you, but sure."],
  double: [
    "Doubling. Bold strategy. Financially questionable, but bold.",
    "Double or nothing. Mostly nothing.",
  ],
  split: ["Splitting. Now you can lose twice.", "Two hands. Twice the disappointment."],
  twentyOne: ["Twenty-one. Even a stopped clock...", "Twenty-one. Don't let it go to your head."],
  playerBlackjack: [
    "Blackjack. Fine. Take your three-to-two and go.",
    "Natural. Somebody check the deck.",
  ],
  dealerBlackjack: [
    "Blackjack. Dealer. Shocking, I know.",
    "Ooh. Natural. For me. How unfortunate for you.",
  ],
  bust: ["Bust. Naturally.", "Over twenty-one. Gravity works on cards too."],
  dealerBust: ["I bust. Don't get used to it.", "Well. That's embarrassing for both of us."],
  win: [
    "You win. Enjoy it. Briefly.",
    "Fine. Take it. Tell nobody.",
    "A win. The pit boss is writing it down.",
  ],
  lose: [
    "House wins. Shocking development.",
    "House wins. As foretold.",
    "Better luck next time. There won't be any.",
  ],
  push: ["Push. Nobody wins. Very you.", "A tie. The most boring outcome, achieved."],
  leave: ["Leaving? Funny, you were just getting started.", "Don't let the door hit your wallet."],
  forfeit: ["Walking out mid-hand? The house thanks you for the donation."],
} as const;

export const SLOT_LINES = {
  welcome: [
    "Pull the lever. Nothing could possibly go wrong.",
    "Every spin is independent. The machine doesn't care about you.",
  ],
  spin: ["Whirr...", "Reels are spinning. Hope is optional.", "Spinning..."],
  lose: [
    "Nothing. The reels are unimpressed too.",
    "No win. Reels don't owe you anything.",
    "Not this time. Not any time, statistically.",
  ],
  small: [
    "A small win. Don't spend it all in one place. There's only one place.",
    "Something! Barely.",
  ],
  big: [
    "That's a real one. Somebody get the mop, the staff are fainting.",
    "Big win. Cash it in and walk away. You won't.",
  ],
  jackpot: ["Triple seven. The machine's embarrassed."],
  broke: ["You can't afford the smallest bet. The machine feels nothing."],
} as const;

/** Background chatter on the casino floor, rotated while the player looks around. */
export const CASINO_CHATTER = [
  'Dealer: "Next victim, please."',
  "A slot machine plays a little tune. Nobody cheers.",
  "Bouncer: \"No, I don't take tips. Yes, I'm watching you.\"",
  "Someone near the dice sobs quietly into a drink.",
  "Cocktail waitress: \"We're out of free drinks. We've always been out.\"",
  "The neon 7s buzz. One of them is giving up.",
  "Pit boss: \"It's not rigged. It's just... unfriendly.\"",
  "A gambler cheers. The room sighs on his behalf.",
] as const;
