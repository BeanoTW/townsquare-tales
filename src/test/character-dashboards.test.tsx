import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { PlayerDashboard, InventoryDashboard } from "@/components/CharacterDashboards";
import { START } from "@/lib/game-data";
import { bankLoanAction, repayLoanAction, runAction } from "@/lib/actions";
describe("character panels and accessible bank loans", () => {
 it("renders distinct status, progression, social, and equipment sections", () => {
  const player = renderToStaticMarkup(<PlayerDashboard state={START} align="Neutral" won={false} />);
  expect(player).toContain("Career progression");
  expect(player).toContain("Relationships");
  expect(player).toContain("Not employed");
  const inv = renderToStaticMarkup(<InventoryDashboard state={{...START, skateboard: 1}} onEquip={() => {}} onSnack={() => {}} />);
  expect(inv).toContain("Consumables");
  expect(inv).toContain("Equip");
 });
 it("handles borrowing and repayment using the shared action system", () => {
  const borrowed = runAction(START, bankLoanAction(250));
  expect(borrowed.ok).toBe(true);
  if (!borrowed.ok) return;
  const repaid = runAction({...borrowed.next, money: 300}, repayLoanAction("all"));
  expect(repaid.ok).toBe(true);
  if (repaid.ok) expect(repaid.next.loanDebt).toBe(0);
 });
});
