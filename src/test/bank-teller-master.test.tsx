import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InteriorCommercePanel } from "@/components/rooms/InteriorCommercePanel";
import { START } from "@/lib/game-data";
import { ROOMS } from "@/lib/rooms";

const teller = ROOMS.bank.hotspots.find(h=>h.id==="teller")!;
const setup=(state={...START,money:1000,bank:500,loanDebt:0,loanDueDay:0})=>{
  const onRun=vi.fn();
  render(<InteriorCommercePanel venue="bank" hotspot={teller} state={state}
    godMode={false} onRun={onRun} onClose={()=>{}}/>);
  return {onRun,dialog:screen.getByRole("dialog",{name:"Teller window"})};
};

describe("simple bank teller",()=>{
  it("starts with only three readable services",()=>{
    const {dialog}=setup();
    const services=within(dialog).getByRole("group",{name:"Banking services"});
    expect(within(services).getAllByRole("button")).toHaveLength(3);
    expect(within(services).getByRole("button",{name:/Deposit/i})).toBeTruthy();
    expect(within(services).getByRole("button",{name:/Withdraw/i})).toBeTruthy();
    expect(within(services).getByRole("button",{name:/Loans/i})).toBeTruthy();
    expect(within(dialog).queryByLabelText("Deposit amount")).toBeNull();
  });
  it("accepts exact deposit amounts using existing game transfer actions",()=>{
    const {dialog,onRun}=setup();
    fireEvent.click(within(dialog).getByRole("button",{name:/Deposit/i}));
    const entry=within(dialog).getByRole("spinbutton",{name:"Deposit amount"});
    fireEvent.change(entry,{target:{value:"137"}});
    expect(within(dialog).getByRole("button",{name:"Confirm deposit"}).hasAttribute("disabled")).toBe(false);
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirm deposit"}));
    expect(onRun).toHaveBeenCalledTimes(1);
    expect(onRun.mock.calls[0]![0].id).toBe("bank-deposit-137");
  });
  it("rejects unavailable funds, allows full withdrawal",()=>{
    const {dialog,onRun}=setup();
    fireEvent.click(within(dialog).getByRole("button",{name:/Withdraw/i}));
    const entry=within(dialog).getByRole("spinbutton",{name:"Withdraw amount"});
    fireEvent.change(entry,{target:{value:"999"}});
    expect(within(dialog).getByRole("button",{name:"Confirm withdraw"}).hasAttribute("disabled")).toBe(true);
    fireEvent.click(within(dialog).getByRole("button",{name:"All"}));
    expect((entry as HTMLInputElement).value).toBe("500");
    fireEvent.click(within(dialog).getByRole("button",{name:"Confirm withdraw"}));
    expect(onRun.mock.calls[0]![0].id).toBe("bank-withdraw-500");
  });
  it("shows loan profile and borrowing options together",()=>{
    const {dialog,onRun}=setup();
    fireEvent.click(within(dialog).getByRole("button",{name:/Loans/i}));
    expect(within(dialog).getByText(/No outstanding loan/i)).toBeTruthy();
    const borrow=within(dialog).getByRole("button",{name:/^Borrow 250\b/i});
    fireEvent.click(borrow);
    expect(onRun).toHaveBeenCalledTimes(1);
  });
  it("shows loan repayment at the same teller without the separate desk",()=>{
    const {dialog}=setup({...START,money:1000,bank:100,loanDebt:650,loanDueDay:12});
    fireEvent.click(within(dialog).getByRole("button",{name:/Loans/i}));
    expect(within(dialog).getByText(/Outstanding loan:/i)).toBeTruthy();
    expect(within(dialog).getByRole("button",{name:/Repay 100/i})).toBeTruthy();
  });
});
