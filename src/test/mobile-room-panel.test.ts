import { describe, expect, it } from "vitest";
import { fitRect, panelStyle } from "@/lib/room-layout";

const box = { x: 310, y: 30, w: 96, h: 150 };
describe("mobile interior action tray", () => {
  it("anchors the menu to a full-width bottom tray on narrow phones", () => {
    const fit = fitRect(320, 300);
    expect(panelStyle(box, fit, 320, 300)).toMatchObject({
      left: 8, right: 8, bottom: 8, width: "auto", maxHeight: 284,
    });
  });
  it("keeps menus inside short landscape stages", () => {
    const fit = fitRect(560, 175);
    const style = panelStyle(box, fit, 560, 175);
    expect(style.maxHeight).toBeLessThanOrEqual(175);
    expect(style.bottom).toBe(8);
  });
  it("preserves proximity-positioned panels on wide screens", () => {
    const fit = fitRect(1000, 640);
    const style = panelStyle(box, fit, 1000, 640);
    expect(style.width).toBeGreaterThan(0);
    expect(style.right).toBeUndefined();
  });
});