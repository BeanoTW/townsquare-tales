import { describe, expect, it } from "vitest";
import { START } from "@/lib/game-data";
import { parseGame } from "@/lib/game-state";
import { buildings } from "@/lib/town-world";
import { GANG_SPOT } from "@/lib/street-gang";
import { PARK_KID_SPOT } from "@/lib/park-kid";
import { TOWN_RAILS } from "@/lib/town-rails";
import { ROOMS, isPlace, hotspotActions } from "@/lib/rooms";
import { buyMailboxAction } from "@/lib/post-office";

describe("new town districts", () => {
  it("places the Post Office in the north-east without overlapping Stick U", () => {
    const bs=buildings(0);
    const post=bs.find(b=>b.id==="post")!;
    const uni=bs.find(b=>b.id==="school")!;
    expect(isPlace("post")).toBe(true);
    expect(post.x).toBeGreaterThan(uni.x+uni.w);
    expect(post.y).toBeLessThan(7);
    expect(post.label).toContain("Post Office");
  });
  it("moves gang to home-side grass and skater behind university", () => {
    const bs=buildings(0), home=bs.find(b=>b.id==="home")!, uni=bs.find(b=>b.id==="school")!;
    expect(GANG_SPOT.x).toBeGreaterThan(home.x+home.w);
    expect(GANG_SPOT.x).toBeLessThan(8);
    expect(PARK_KID_SPOT.x).toBeGreaterThan(uni.x+uni.w);
    expect(PARK_KID_SPOT.y).toBeLessThan(7);
    expect(TOWN_RAILS.find(r=>r.id==="park")!.a.x).toBeGreaterThan(uni.x+uni.w);
  });
  it("sells one permanent mailbox and preserves the purchase across saves", () => {
    const counter=ROOMS.post.hotspots.find(h=>h.id==="post-counter")!;
    const start={...START,money:100};
    const action=hotspotActions(counter,start)[0]!;
    expect(action.id).toBe("buy-mailbox");
    const result=buyMailboxAction(start).resolve(start,Math.random);
    expect(typeof result).not.toBe("string");
    if(typeof result==="string")return;
    const saved={...start,...result.patch};
    expect(saved.mailbox).toBe(1);
    expect(parseGame(JSON.stringify(saved),START).mailbox).toBe(1);
    expect(hotspotActions(counter,saved)).toHaveLength(0);
  });
});
