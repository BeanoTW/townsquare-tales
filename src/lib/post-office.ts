import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";

export const MAILBOX_PRICE = 25;

export function buyMailboxAction(state: GameState): ActionDef {
  return {
    id: "buy-mailbox",
    label: state.mailbox ? "Mailbox installed" : "Purchase mailbox",
    hours: 0,
    energy: 0,
    cost: MAILBOX_PRICE,
    note: state.mailbox ? "Your address is registered" : "Permanent mailbox · moves with your home",
    resolve: s => s.mailbox
      ? "You already have a registered mailbox."
      : s.money < MAILBOX_PRICE
        ? `You need $${MAILBOX_PRICE} to register a mailbox.`
        : { patch: { money: s.money - MAILBOX_PRICE, mailbox: 1 }, message: "Mailbox registered! Post can now be delivered to your home." },
  };
}
