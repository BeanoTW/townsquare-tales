import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render } from "@testing-library/react";
import { StreetLife, type ResidentPositions } from "@/components/StreetLife";
import { START } from "@/lib/game-data";
import { STREET_OBJECTS, makeActor } from "@/lib/street-life";
import { buildings } from "@/components/TownMap";
import { isWalkable } from "@/lib/pathfinding";
afterEach(()=>{cleanup();vi.restoreAllMocks();vi.unstubAllGlobals();});
describe("street interaction feedback",()=>{
  const props=()=>({player:{current:{x:9.95,y:9,walking:false}},positions:{current:{} as ResidentPositions},lots:buildings(0),state:START,skating:false,paused:false,onResident:vi.fn(),onObject:vi.fn()});
  it("fires one real skateboard incident and freezes residents while a panel is open",()=>{
    let frame: FrameRequestCallback = ()=>{};
    vi.spyOn(performance,"now").mockReturnValue(1000);
    vi.stubGlobal("requestAnimationFrame",(callback:FrameRequestCallback)=>{frame=callback;return 1;});
    vi.stubGlobal("cancelAnimationFrame",()=>{});
    const p=props(), incident=vi.fn();
    p.player.current={x:4,y:5,walking:true};
    p.positions.current.ivy={...makeActor({x:4.8,y:5},[]),path:[{x:8,y:5}]};
    const view=render(<svg><StreetLife {...p} skating onIncident={incident}/></svg>);
    p.player.current.x=4.2;
    act(()=>frame(1051));expect(incident).toHaveBeenCalledExactlyOnceWith("ivy");
    for(let n=2;n<20;n++) act(()=>frame(1000+n*51));
    expect(incident).toHaveBeenCalledTimes(1);
    const before={x:p.positions.current.ivy!.x,y:p.positions.current.ivy!.y};
    view.rerender(<svg><StreetLife {...p} skating paused onIncident={incident}/></svg>);
    for(let n=20;n<40;n++) act(()=>frame(1000+n*51));
    expect(p.positions.current.ivy).toMatchObject(before);
    expect(incident).toHaveBeenCalledTimes(1);
  });
  it("exposes touch and keyboard actions with costs before activation",()=>{
    const p=props(), view=render(<svg><StreetLife {...p}/></svg>);
    const paper=view.getByRole("button",{name:/Read the town paper/});
    expect(paper).toHaveAttribute("tabindex","0");
    fireEvent.keyDown(paper,{key:"Enter"});expect(p.onObject).toHaveBeenCalledWith("newspaper");
    fireEvent.click(view.getByRole("button",{name:/Kick litter/}));expect(p.onObject).toHaveBeenCalledWith("litter");
    for(const object of STREET_OBJECTS) expect(isWalkable(object,p.lots),object.id).toBe(true);
  });
  it("renders feedback on the active object without adding character legs",()=>{
    const view=render(<svg><StreetLife {...props()} feedback="litter"/></svg>);
    expect(view.container.querySelector('[data-street-object="litter"]')).toHaveAttribute("data-action-feedback","true");
    expect(view.container.querySelector(".town-litter-kicked")).toBeInTheDocument();
    expect(view.container.querySelectorAll('[data-overhead-person][data-pose="standing"] [data-resting-legs]')).toHaveLength(0);
    expect(view.container.querySelectorAll('[data-street-object="newspaper"]')).toHaveLength(1);
  });
});
