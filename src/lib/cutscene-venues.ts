import type { GameState } from "@/lib/game-state";
import type { HomePlan } from "@/lib/home3d/layout";
import type { CastCue, HeldProp, Pick } from "@/lib/cutscenes";

/**
 * Venue scenes (phase 2). Marks are fixture-local like the home ones (+z is the customer side,
 * `face` π looks back at the fixture) unless `abs` is set, in which case x/z are world metres
 * (used for seats that belong to the room rather than the fixture). Seat lifts are the cushion
 * height minus the 0.26 m hip offset of the seated rig.
 */
type Ctx = { before: GameState; after: GameState; round: number; has: (id: string) => boolean };

const SEAT = (top: number) => top - 0.26;
const won = (c: Ctx) => c.after.money > c.before.money;
const at = (slotId: string, x: number, z: number, face: number, lift = 0) => ({ slotId, mark: { x, z, face, lift } });

/** A promotion: handshake across the desk, then turn to the camera and celebrate. */
function promotion(c: Ctx, slotId: string, boss: string | null, z = 0.85): Pick {
  const job = c.after.job > c.before.job;
  return {
    ...at(slotId, 0, z, Math.PI), act: "promote", held: null,
    title: job ? "MOVING UP" : "PERFORMANCE REVIEW",
    caption: job ? "PROMOTED!" : null,
    cast: boss ? [{ id: boss, cue: "face" }, { id: boss, cue: "cheer", at: 1.7 }] : [],
  };
}
const resign = (slotId: string, z = 0.8): Pick => ({ ...at(slotId, 0, z, 0), act: "resign", held: "box", title: "CLEARING OUT" });
const hired = (slotId: string, z = 0.8): Pick => ({ ...at(slotId, 0, z, Math.PI), act: "apply", held: null, title: "NEW START", caption: "YOU'RE HIRED!" });

/** Robbing a counter: snatch and run if it works, a pratfall if it doesn't. */
function robbery(c: Ctx, slotId: string, x: number, z: number, staff: string | null): Pick {
  const ok = won(c);
  return {
    ...at(slotId, x, z, Math.PI), act: ok ? "rob" : "caught", held: ok ? "bag" : null,
    title: ok ? "GRAB AND GO" : "NOT TODAY",
    caption: ok ? null : "CAUGHT RED-HANDED",
    cast: staff ? [{ id: staff, cue: "face" }, { id: staff, cue: "cheer", at: 0.6 }] : [],
  };
}

export function venuePick(actionId: string, plan: HomePlan, c: Ctx): Pick | null {
  const k = plan.kind;
  if (actionId.startsWith("apply-")) {
    const board = ({ shop: "shop-board", diner: "hiring", work: "vacancies", yard: "trades-board" } as Record<string, string>)[k];
    return board && c.has(board) ? hired(board) : null;
  }
  if (actionId === "quit-job") {
    const board = ({ shop: "shop-board", diner: "hiring", work: "vacancies", yard: "trades-board" } as Record<string, string>)[k];
    return board && c.has(board) ? resign(board) : null;
  }
  switch (k) {
    case "shop": {
      if (actionId === "shift" && c.has("checkout")) {
        return c.round % 2 === 0
          ? { ...at("checkout", 0, -0.95, 0), act: "scan", held: null, title: "BEEP. BEEP. BEEP.", cast: [{ id: "shopkeeper", cue: "hide" }, { id: "browser", cue: "face" }] }
          : { ...at("shelves", 0.4, 0.75, 0), act: "carry", held: "box", title: "RESTOCKING", cast: [{ id: "browser", cue: "face" }] };
      }
      if ((actionId === "buy-shoes" || actionId === "buy-alarm") && c.has("checkout")) return { ...at("checkout", 0.2, 0.85, Math.PI), act: "pay", held: "cash", title: "CHING CHING!", cast: [{ id: "shopkeeper", cue: "nod" }] };
      if (actionId === "snack" && c.has("shelves")) return { ...at("shelves", 0.95, 0.8, 0), act: "munch", held: "snack", title: "SNACK ATTACK" };
      if (actionId === "promote" && c.has("back-office")) return promotion(c, "back-office", "stock-boy", 0.9);
      if (actionId === "rob-till-shop" && c.has("checkout")) return robbery(c, "checkout", 0.2, 0.85, "shopkeeper");
      return null;
    }
    case "diner": {
      if (actionId === "shift" && c.has("kitchen")) return { ...at("kitchen", -0.1, 1.0, Math.PI), act: "flip", held: "spatula", title: "ORDER UP!", cast: [{ id: "cook", cue: "hide" }, { id: "waitress", cue: "face" }] };
      if (actionId === "lunch-shift" && c.has("counter")) return { ...at("counter", 0, -1.25, 0), act: "serve", held: "tray", title: "LUNCH RUSH", cast: [{ id: "waitress", cue: "hide" }, { id: "regular", cue: "nod" }] };
      if (actionId === "hot-meal" && c.has("counter")) return { slotId: "counter", mark: { x: 5.75, z: 3.7, face: Math.PI, lift: SEAT(0.74), abs: true }, act: "eat", held: "fork", title: "BLUE PLATE SPECIAL", cast: [{ id: "waitress", cue: "nod" }] };
      if (actionId === "promote" && c.has("booth")) return promotion(c, "booth", "waitress", 1.0);
      if (actionId === "rob-till-diner" && c.has("counter")) return robbery(c, "counter", 0.45, 0.8, "waitress");
      return null;
    }
    case "furniture": {
      if (actionId.startsWith("furniture-") && actionId.endsWith("sofa") && c.has("sofa-display")) return { ...at("sofa-display", 0.75, -0.45, 0, SEAT(0.46)), act: "bounce", held: null, title: "TEST DRIVE", caption: "SOLD!", cast: [{ id: "tester", cue: "face" }] };
      if (actionId.startsWith("furniture-") && actionId.endsWith("bed") && c.has("bed-display")) return { ...at("bed-display", 0, 0.15, 0, 0.74), act: "flop", held: null, title: "SWEET DREAMS", caption: "SOLD!" };
      if (actionId.startsWith("furniture-") && c.has("catalogue")) return { ...at("catalogue", -0.5, 0.85, Math.PI), act: "pay", held: "cash", title: "CHING CHING!", caption: "DELIVERED HOME", cast: [{ id: "sales", cue: "face" }, { id: "sales", cue: "nod", at: 1.2 }] };
      if (actionId === "rob-till-furniture" && c.has("catalogue")) return robbery(c, "catalogue", -0.5, 0.85, "sales");
      return null;
    }
    case "bank": {
      if (actionId.startsWith("deposit") && c.has("teller")) return { ...at("teller", -0.9, 0.8, Math.PI), act: "pay", held: "cash", title: "SAFE AND SOUND", cast: [{ id: "teller-a", cue: "nod" }] };
      if (actionId.startsWith("withdraw") && c.has("atm")) return { ...at("atm", 0, 0.75, Math.PI), act: "atm", held: "cash", title: "CASH MONEY" };
      if (actionId.startsWith("withdraw") && c.has("teller")) return { ...at("teller", -0.9, 0.8, Math.PI), act: "collect", held: "cash", title: "CASH MONEY", cast: [{ id: "teller-a", cue: "nod" }] };
      if (actionId.startsWith("bank-") && c.has("loans")) return { ...at("loans", 0.4, 0.6, Math.PI, SEAT(0.49)), act: "sign", held: "pen", title: "SIGN HERE", caption: c.after.loanDebt && !c.before.loanDebt ? "LOAN APPROVED" : null };
      return null;
    }
    case "school": {
      if (actionId === "library" && c.has("library")) return { ...at("library", 0.6, 0.95, Math.PI, SEAT(0.49)), act: "read", held: "book", title: "HITTING THE BOOKS", cast: [{ id: "librarian", cue: "face" }] };
      if (actionId === "enroll" && c.has("classroom")) return { slotId: "classroom", mark: { x: 11.7, z: 4.67, face: Math.PI, lift: SEAT(0.47), abs: true }, act: "write", held: "pen", title: "CLASS IN SESSION", caption: c.after.school > c.before.school ? "ENROLLED!" : null, cast: [{ id: "lecturer", cue: "nod" }] };
      return null;
    }
    case "work": {
      if (actionId === "shift" && c.has("workstation")) return { ...at("workstation", 0.7, 1.15, Math.PI, SEAT(0.5)), act: "type", held: null, title: "CLOCKING IN", cast: [{ id: "worker-a", cue: "face", at: 2.0 }] };
      if (actionId === "promote" && c.has("manager")) return { ...promotion(c, "manager", "manager"), mark: { x: 0.55, z: 0.85, face: Math.PI, lift: 0 } };
      return null;
    }
    case "yard": {
      if (actionId === "shift" && c.has("site")) {
        return c.round % 2 === 0
          ? { ...at("site", -0.8, 1.1, Math.PI), act: "shovel", held: "shovel", title: "BREAKING GROUND", cast: [{ id: "builder", cue: "face" }] }
          : { ...at("site", -0.8, 1.1, 0), act: "carry", held: "bricks", title: "HOD CARRIER", cast: [{ id: "labourer", cue: "face" }] };
      }
      if (actionId === "promote" && c.has("foreman")) return promotion(c, "foreman", "foreman");
      return null;
    }
    case "clinic":
      if (actionId === "recovery" && c.has("treatment-bed")) return { ...at("treatment-bed", 0, 0.05, 0, 0.6), act: "heal", held: null, title: "PATCHED UP", cast: [{ id: "nurse", cue: "face" }, { id: "nurse", cue: "nod", at: 1.4 }] };
      return null;
    case "depot":
      if (actionId === "departures" && c.has("departures")) return { ...at("departures", 0.8, 1.0, Math.PI), act: "board", held: null, title: "ON THE MOVE", cast: [{ id: "watcher", cue: "face", at: 2.2 }] };
      if (actionId.startsWith("hustle-") && c.has("ticket-hatch")) {
        const held: HeldProp = actionId.endsWith("deliveries") ? "parcel" : actionId.endsWith("stall") ? "crate" : "toolbox";
        return { ...at("ticket-hatch", 0, 0.8, 0), act: "carry", held, title: actionId.endsWith("deliveries") ? "SPECIAL DELIVERY" : actionId.endsWith("stall") ? "MARKET DAY" : "ODD JOBS", cast: [{ id: "clerk", cue: "nod" }] };
      }
      return null;
    case "pawn":
      if (actionId.startsWith("sell-") && c.has("pawn-counter")) return { ...at("pawn-counter", 0.3, 0.85, Math.PI), act: "sell", held: actionId === "sell-shoes" ? "trainers" : "clock", title: "CASH IN HAND", cast: [{ id: "pawn-broker", cue: "nod" }] };
      if (actionId === "rob-till-pawn" && c.has("pawn-counter")) return robbery(c, "pawn-counter", 0.3, 0.85, "pawn-broker");
      return null;
    case "police":
      if (actionId === "fine" && c.has("front-desk")) return { ...at("front-desk", 0.6, 0.9, Math.PI), act: "payfine", held: "cash", title: "DEBT TO SOCIETY", cast: [{ id: "desk-sergeant", cue: "face" }] };
      return null;
    case "bar":
      if (actionId === "round" && c.has("bar-counter")) return { ...at("bar-counter", 0.5, 0.85, Math.PI, SEAT(0.72)), act: "drink", held: "pint", title: "BOTTOMS UP", cast: [{ id: "barkeep", cue: "nod" }, { id: "pete", cue: "face" }, { id: "pete", cue: "cheer", at: 2.5 }, { id: "dot", cue: "face", at: 2.3 }] };
      if (actionId === "chat-up" && c.has("dance-floor")) return { ...at("dance-floor", -0.45, 0.3, 0), act: "dance", held: null, title: "MAKING FRIENDS", cast: (["dancer1", "dancer2", "dancer3"] as const).flatMap((id): CastCue[] => [{ id, cue: "face" }, { id, cue: "cheer", at: 1.5 }]) };
      if (actionId === "rob-till-bar" && c.has("bar-counter")) return robbery(c, "bar-counter", 0.5, 0.85, "barkeep");
      return null;
    case "casino":
      if (actionId === "high-dice" && c.has("high-dice")) {
        const win = won(c);
        return {
          ...at("high-dice", 0, 1.15, Math.PI), act: win ? "dice-win" : "dice-lose", held: "dice",
          title: win ? "WINNER WINNER" : "THE HOUSE ALWAYS WINS",
          caption: win ? "LUCKY ROLL!" : "SNAKE EYES",
          cast: [
            { id: "croupier", cue: "face" },
            { id: "whale1", cue: win ? "cheer" : "face", at: 1.6 },
            { id: "whale2", cue: win ? "cheer" : "face", at: 1.6 },
          ],
        };
      }
      return null;
    default:
      return null;
  }
}
