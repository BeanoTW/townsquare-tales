import { describe,expect,it,vi } from "vitest";
import { fireEvent, render,screen } from "@testing-library/react";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";
import { mailFor,hasRead,markRead,replyFamily,unreadCount,hasReplied } from "@/lib/town-mail";
import { MailInbox } from "@/components/rooms/MailInbox";

describe("persistent town correspondence",()=>{
  it("keeps undelivered letters from before mailbox purchase",()=>{
    const late={...START,day:21,mailbox:0};
    const before=mailFor(late);
    const after=mailFor({...late,mailbox:1});
    expect(before.length).toBeGreaterThanOrEqual(6);
    expect(after.map(l=>l.id)).toEqual(before.map(l=>l.id));
    expect(unreadCount(late)).toBe(before.length);
  });
  it("records read letters and family responses in existing save system",()=>{
    const state={...START,day:19,mailbox:1};
    const opened=markRead(state,0);
    expect(hasRead(opened,0)).toBe(true);
    const replied=replyFamily(opened,0);
    expect(hasReplied(replied,0)).toBe(true);
    expect(replied.familyFirstReplyDay).toBe(19);
    const restored=parseGame(JSON.stringify(replied),START);
    expect(hasReplied(restored,0)).toBe(true);
    expect(hasRead(restored,0)).toBe(true);
  });
  it("shows an explanation at home if mail has not been registered",()=>{
    render(<MailInbox state={{...START,day:16}} atPostOffice={false} onChange={vi.fn()} onClose={vi.fn()}/>);
    expect(screen.getByText(/haven't registered a mailbox/i)).toBeTruthy();
  });
  it("allows collection at the post office and replying to Mum",()=>{
    const onChange=vi.fn();
    const state={...START,day:16,mailbox:0};
    render(<MailInbox state={state} atPostOffice onChange={onChange} onClose={vi.fn()}/>);
    fireEvent.click(screen.getByRole("button",{name:/Just checking in/i}));
    expect(onChange.mock.calls[0]![0].mailReadMask).toBe(1);
  });
});
