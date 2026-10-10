import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { residentsAt, conversation, applyConversation, dailyTownEvent } from "@/lib/living-town";
import { parseGame } from "@/lib/game-state";

describe("living town residents",()=>{
  it("keeps named residents consistent while their daily locations change",()=>{
    const morning=residentsAt(8), evening=residentsAt(21);
    expect(morning.map(p=>p.id)).toEqual(evening.map(p=>p.id));
    expect(morning.find(p=>p.id==="gus")!.x).not.toBe(evening.find(p=>p.id==="gus")!.x);
  });
  it("remembers relationships and changes greetings",()=>{
    let s={...START};
    const first=conversation("mara",s).text;
    for(let i=0;i<3;i++)s=applyConversation(s,"mara",2,1);
    expect(conversation("mara",s).text).not.toBe(first);
    expect(s.relMara).toBe(6);
    expect(s.karma).toBe(3);
    expect(parseGame(JSON.stringify(s),START).relMara).toBe(6);
  });
  it("prevents scores leaving bounded ranges",()=>{
    expect(applyConversation({...START,relNox:10},"nox",4,0).relNox).toBe(10);
    expect(applyConversation({...START,relNox:-10},"nox",-4,0).relNox).toBe(-10);
  });
  it("creates day and hour dependent events",()=>{
    expect(dailyTownEvent(1,18)).toBeNull();
    expect(dailyTownEvent(3,18)).toBeNull();
    expect(dailyTownEvent(5,18)?.title).toBeTruthy();
  });
});
