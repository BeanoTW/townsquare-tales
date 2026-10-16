import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { InteriorCommercePanel } from "@/components/rooms/InteriorCommercePanel";
import { START } from "@/lib/game-data";
import { ROOMS } from "@/lib/rooms";

const teller = ROOMS.bank.hotspots.find(h=>h.id==="teller")!;
const renderTeller=(state=START)=>{
  const onRun=vi.fn();
  const result=render(<InteriorCommercePanel venue="bank" hotspot={teller} state={state}
    godMode={false} onRun={onRun} onClose={()=>{}}/>);
  return {...result,onRun};
};

describe("bank teller master services",()=>{
  it("offers deposits, withdrawals, borrowing, repayment and account details at one counter",()=>{
    const {onRun}=renderTeller({...START,money:1000,bank:500,loanDebt:0,loanDueDay:0});
    const dialog=screen.getByRole("dialog",{name:"Teller window"});
    expect(within(dialog).getByRole("button",{name:/Deposit \$50/i})).toBeTruthy();
    expect(within(dialog).getByRole("button",{name:/Withdraw \$50/i})).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button",{name:/Apply for loan/i}));
    expect(within(dialog).getByRole("button",{name:/Borrow 250/i})).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button",{name:/Borrow 250/i}));
    expect(onRun).toHaveBeenCalledTimes(1);
    fireEvent.click(within(dialog).getByRole("button",{name:/My accounts/i}));
    expect(within(dialog).getByText(/0.1% interest each night/i)).toBeTruthy();
    fireEvent.click(within(dialog).getByRole("button",{name:/Repay a loan/i}));
    expect(within(dialog).getByText(/no outstanding loan/i)).toBeTruthy();
  });
  it("lets customers repay at the teller without visiting the private loan desk",()=>{
    renderTeller({...START,money:1000,bank:100,loanDebt:650,loanDueDay:12});
    fireEvent.click(screen.getByRole("button",{name:/Repay a loan/i}));
    expect(screen.getByRole("button",{name:/Repay 100/i})).toBeTruthy();
  });
});
