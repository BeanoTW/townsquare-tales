import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type MutableRefObject } from "react";
import { fitRect, panelStyle, type Size } from "@/lib/room-layout";
import { bankLoanAction, repayLoanAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { RoomArt } from "@/components/rooms/RoomArt";
import { ActionPanel } from "@/components/rooms/ActionPanel";
import { InteriorCommercePanel } from "@/components/rooms/InteriorCommercePanel";
export { actionBlockReason } from "@/components/rooms/ActionPanel";
import { WalkableShop } from "@/components/rooms/WalkableShop";
import { isWalkableShop } from "@/lib/walkable-shops";
import { ArcadeInterior } from "@/components/rooms/ArcadeInterior";
import { isArcadeRoom } from "@/lib/arcade-rooms";
import { Home3DStage, luxuryMap, toSlotId, webglAvailable } from "@/components/home3d/Home3DStage";
import { planCutscene, ScenePlays, type Cutscene, type CutsceneClaim } from "@/lib/cutscenes";
import { planFor } from "@/lib/home3d/plans";
import { ownsFurniture } from "@/lib/furniture";
import { SKIP_EVENT } from "@/components/home3d/scenes/Director";
import { homeZones, furnitureZone, isVenue, venueZones, type HomeZone, type PlanZone } from "@/lib/home-zones";
import { venuePlan } from "@/lib/home3d/venues";
import { CounterRobberyChoice } from "@/components/rooms/CounterRobberyChoice";
import { COUNTERS } from "@/lib/counter-robbery";
import { STAFF } from "@/components/rooms/ArcadeInterior";
import { VIEW, visibleHotspots, type Box, type Room, type Hotspot } from "@/lib/rooms";

const panel3d = (cw: number, ch: number): CSSProperties =>
  cw <= 600
    ? { left: 8, bottom: 8, width: cw - 16, maxHeight: Math.max(80, ch - 16) }
    : { right: 8, bottom: 8, width: Math.min(290, cw - 16), maxHeight: Math.max(140, ch - 16) };

/** Whether the real 3D renderer can be used, and the player's saved choice between it and the classic view. */
export function useRenderer3d() {
  // Both are resolved after mount so server and client markup match.
  const [classic, setClassicState] = useState(false);
  const [gl, setGl] = useState(false);
  useEffect(() => {
    setGl(webglAvailable());
    try { setClassicState(localStorage.getItem("tst.home3d") === "classic"); } catch { /* storage unavailable */ }
  }, []);
  const setClassic = (c: boolean) => {
    setClassicState(c);
    try { localStorage.setItem("tst.home3d", c ? "classic" : "3d"); } catch { /* storage unavailable */ }
  };
  return { gl, classic, setClassic, failed: () => setClassicState(true) };
}
export type Renderer3d = ReturnType<typeof useRenderer3d>;

export type Feedback = { message: string; success: boolean; changes: string[]; timeLine?: string };

/** Variant rotation and "seen today" shortening persist for the whole session. */
const PLAYS = new ScenePlays();
const prefersReducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

function ObjectLocationScene({
  room,
  state,
  feedback,
  onRun,
  onLeave,
  godMode = false,
  onLaunch,
  paused = false,
  renderer,
  cutsceneClaim,
}: {
  renderer?: Renderer3d | undefined;
  /** The game offers each successful action here; a 3D room claims the ones it can act out. */
  cutsceneClaim?: MutableRefObject<CutsceneClaim | null> | undefined;
  room: Room;
  state: GameState;
  feedback: Feedback | null;
  godMode?: boolean;
  onRun: (a: ActionDef) => void;
  onLeave: () => void;
  /** Open a full-screen minigame from a hotspot (e.g. the casino tables). */
  onLaunch?: ((game: NonNullable<Hotspot["launch"]>) => void) | undefined;
  /** A minigame is open on top: stop reacting to Escape. */
  paused?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showLoans, setShowLoans] = useState(false);
  const venue = isVenue(room.id) ? room.id : null;
  const [homeZone, setHomeZone] = useState<PlanZone>(room.id === "home" ? homeZones(state.house)[0]!.id : venue ? venueZones(venue)[0]!.id : "shelter");
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  // Homes, the casino, the bar and the gym render as real 3D scenes when WebGL works; the classic renderer remains the fallback.
  const own = useRenderer3d();
  const { gl, classic, setClassic } = renderer ?? own;
  const use3d = (room.id === "home" || venue !== null) && gl && !classic;
  const setRenderer = (c: boolean) => {
    setSelectedId(null);
    setClassic(c);
  };
  const stageRef = useRef<HTMLDivElement>(null);
  const [cutscene, setCutscene] = useState<Cutscene | null>(null);
  const resumeId = useRef<string | null>(null);

  // A renderer switch or WebGL failure removes the director; release its UI state too.
  useEffect(() => {
    if (use3d || !cutscene) return;
    setCutscene(null);
    setSelectedId(resumeId.current);
    resumeId.current = null;
  }, [use3d, cutscene]);

  useEffect(() => {
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(measure);
    observer?.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Escape closes the panel first, then leaves the room.
  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (cutscene) window.dispatchEvent(new Event(SKIP_EVENT));
      else if (selectedId) setSelectedId(null);
      else onLeave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onLeave, paused, cutscene]);

  const [chatterIdx, setChatterIdx] = useState(0);
  const chatter = room.chatter;
  useEffect(() => {
    if (!chatter || chatter.length < 2) return;
    const id = window.setInterval(() => setChatterIdx((i) => (i + 1) % chatter.length), 6500);
    return () => window.clearInterval(id);
  }, [chatter]);

  const visible = visibleHotspots(room, state).filter(h => room.id !== "home" || use3d || furnitureZone(h.id, state.house) === homeZone);
  const selected = cutscene ? null : visible.find((h) => h.id === selectedId) ?? null;
  const commerce = Boolean(use3d && selected && ((room.id === "shop" && ["shelves","checkout"].includes(selected.id)) || (room.id === "bank" && ["teller","atm","loans","vault"].includes(selected.id))));
  const plan3d = use3d ? (venue ? venuePlan(venue) ?? null : planFor(state.house) ?? planFor(1) ?? null) : null;
  // Interactions can be selected from UI even when their fixture belongs
  // to another room. Match the hotspot to the actual plan slot, then move
  // the fixed first-person camera to that area before presenting actions.
  useEffect(() => {
    if (!use3d || !selectedId || !plan3d || cutscene) return;
    const activeSlot = plan3d.slots.find(slot => slot.id === toSlotId(selectedId));
    if (activeSlot && activeSlot.zone !== homeZone) setHomeZone(activeSlot.zone);
  }, [selectedId, use3d, plan3d, homeZone, cutscene]);


  // Claim actions this room can act out; refreshed every render so it always sees the pre-action room.
  const claim: CutsceneClaim = (req) => {
    if (!plan3d || cutscene) return false;
    const cut = planCutscene({ ...req, slotId: selectedId ? toSlotId(selectedId) : null }, plan3d, {
      visibleSlotIds: visible.map((h) => toSlotId(h.id)),
      luxury: luxuryMap(state),
      hasBed: ownsFurniture(state.furniture, "bed"),
      plays: PLAYS,
      reducedMotion: prefersReducedMotion(),
    });
    if (!cut) return false;
    resumeId.current = selectedId;
    setSelectedId(null);
    setCutscene(cut);
    return true;
  };
  useLayoutEffect(() => {
    if (!cutsceneClaim) return;
    cutsceneClaim.current = claim;
    return () => { if (cutsceneClaim.current === claim) cutsceneClaim.current = null; };
  });
  const fit = fitRect(size.w, size.h);
  const floorPx = fit.y + VIEW.floorY * (fit.h / VIEW.h);
  // Faint wallpaper dots over the wall/floor split; the sign plate reads from the wall band.
  const stageStyle: CSSProperties = {
    backgroundImage: size.h
      ? `radial-gradient(rgba(37, 36, 42, 0.07) 1.5px, transparent 1.6px), linear-gradient(to bottom, ${room.palette.wall} ${floorPx}px, ${room.palette.floor} ${floorPx}px)`
      : `linear-gradient(${room.palette.wall}, ${room.palette.wall})`,
    backgroundSize: "22px 22px, 100% 100%",
    ["--room-accent" as string]: room.palette.accent,
  };

  return (
    <div
      className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-background font-hand"
      data-room={room.id}
    >
      <header className="shrink-0 px-3 pb-1 pt-[104px] sm:pt-24">
        <div className="text-xs uppercase tracking-widest text-muted-foreground">
          Town Square Tales · Inside
        </div>
        <div className="flex items-center justify-between gap-2">
          <h2 className="min-w-0 text-xl font-bold leading-tight sm:text-2xl">{room.title}</h2>
          {(room.id === "home" || venue) && gl && use3d && (
            <button type="button" onClick={() => setRenderer(true)}
              className="min-h-10 shrink-0 rounded-lg border-2 border-foreground bg-secondary px-3 text-xs font-bold"
              data-renderer-toggle aria-label="Switch to classic view">Classic view</button>
          )}
        </div>
        <p className={`room-caption text-sm text-muted-foreground ${use3d ? "hidden sm:block" : ""}`}>{room.caption}</p>
        {(room.id === "home" || (venue && use3d)) && <nav className="mt-1 flex gap-2 overflow-x-auto pb-1 sm:mt-2 sm:pb-2" aria-label={venue ? "Areas" : "Home rooms"}>{(venue ? venueZones(venue) : homeZones(state.house)).map(z => <button type="button" key={z.id} disabled={Boolean(cutscene)} aria-current={homeZone === z.id ? "page" : undefined} onClick={() => {setSelectedId(null); setHomeZone(z.id);}} className={`min-h-11 shrink-0 rounded-lg border-2 border-foreground px-3 font-bold ${homeZone === z.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{z.label}</button>)}</nav>}
        {(room.id === "home" || venue) && gl && !use3d && <button type="button" onClick={() => setRenderer(false)} className="mb-1 min-h-9 rounded-lg border-2 border-foreground bg-secondary px-3 text-sm font-bold" data-renderer-toggle>Switch to 3D view</button>}
        {room.id === "home" && state.house >= 3 && !use3d && homeZone === "entertainment" && <section className="my-2 rounded-xl border-2 border-foreground bg-secondary p-2" aria-label="Games room">
          <p className="text-sm font-bold">🎲 Your friends are here for cards and slots.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="min-h-11 flex-1 rounded-lg border-2 border-foreground bg-card px-2 font-bold" onClick={() => onLaunch?.("blackjack")}>♠ Blackjack</button>
            <button type="button" className="min-h-11 flex-1 rounded-lg border-2 border-foreground bg-card px-2 font-bold" onClick={() => onLaunch?.("slots")}>🎰 Slots</button>
          </div>
        </section>}
        {room.id === "bank" && !use3d && <button type="button" onClick={() => { setSelectedId(null); setShowLoans(v => !v); }} className="my-2 min-h-11 rounded-xl border-2 border-foreground bg-secondary px-4 text-base font-bold" aria-expanded={showLoans}>🏦 {showLoans ? "Close loan desk" : "Loans · Borrow & repay"} · Debt ${state.loanDebt ?? 0}</button>}
        {room.id === "bank" && !use3d && showLoans && <section data-bank-loans className="max-h-[35vh] overflow-y-auto rounded-xl border-2 border-foreground bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2"><strong>Loan desk</strong><span className="text-sm">40% finance charge · 30-day term · 2% daily if overdue</span></div>
          <p className="my-2 text-sm">Outstanding: <strong>${state.loanDebt ?? 0}</strong>. Due day {state.loanDueDay ?? '—'}. Larger loans require employment. One loan at a time.</p>
          <div className="grid grid-cols-2 gap-2">
          {(state.loanDebt ?? 0) > 0 ? [repayLoanAction(100), repayLoanAction(500), repayLoanAction("all")].map(a => <button key={a.id} className="min-h-11 rounded-lg border-2 border-foreground bg-secondary p-2 font-bold" onClick={() => onRun(a)}>{a.label}</button>) : [bankLoanAction(250), bankLoanAction(1000), bankLoanAction(2500), bankLoanAction(5000)].map(a => <button key={a.id} className="min-h-11 rounded-lg border-2 border-foreground bg-secondary p-2 font-bold" onClick={() => onRun(a)}>{a.label}</button>)}
          </div>
        </section>}
      </header>

      <div
        ref={stageRef}
        className="room-stage relative min-h-0 flex-1 overflow-hidden border-y-2 border-foreground"
        style={stageStyle}
        onClick={(e) => {
          if (!(e.target as Element).closest("[data-hotspot],[data-panel]")) setSelectedId(null);
        }}
      >
        {!use3d && fit.y >= 40 && (
          <div className="room-sign" style={{ top: Math.max(10, fit.y / 2 - 15) }}>
            {room.sign}
          </div>
        )}
        {use3d && (
          <Home3DStage
            state={state}
            visible={visible}
            selectedId={selectedId}
            zone={homeZone}
            plan={venue ? venuePlan(venue) ?? undefined : undefined}
            onSelect={(id) => {
              const spot = visible.find((h) => h.id === id);
              if (spot?.launch && onLaunch) {
                setSelectedId(null);
                onLaunch(spot.launch);
                return;
              }
              setSelectedId((cur) => (cur === id ? null : id));
            }}
            onDeselect={() => setSelectedId(null)}
            onFail={() => (renderer ?? own).failed()}
            onLaunch={onLaunch}
            cutscene={cutscene}
            onCutsceneDone={() => {
              setCutscene(null);
              // Back to the same panel, ready for another rep.
              setSelectedId(resumeId.current);
              resumeId.current = null;
            }}
          />
        )}
        {!use3d && (
        <div
          className="room-art-frame absolute"
          style={{ left: fit.x, top: fit.y, width: fit.w, height: fit.h }}
        >
          <RoomArt
            room={room}
            homeZone={room.id === "home" ? (homeZone as HomeZone) : undefined}
            state={state}
            visible={visible}
            selectedId={selectedId}
            onSelect={(id) => {
              const spot = visible.find((h) => h.id === id);
              if (spot?.launch && onLaunch) {
                setSelectedId(null);
                onLaunch(spot.launch);
                return;
              }
              setSelectedId((cur) => (cur === id ? null : id));
            }}
          />
        </div>
        )}
        {selected && use3d && (
          <div className="absolute inset-x-2 bottom-2 z-30 max-h-[min(48dvh,75%)] overflow-y-auto overscroll-contain rounded-2xl sm:inset-x-auto sm:right-2 sm:w-[min(360px,48%)]"
            data-mobile-action-sheet onClick={e=>e.stopPropagation()}>
            {commerce ? (
              <InteriorCommercePanel venue={room.id} hotspot={selected} state={state} godMode={godMode}
                onRun={onRun} onClose={()=>setSelectedId(null)}/>
            ) : (
              <ActionPanel hotspot={selected} state={state} godMode={godMode}
                style={{ position: "relative", inset: "auto", top: "auto", right: "auto", bottom: "auto", left: "auto", width: "100%", maxHeight: "none", borderRadius: 16, boxShadow: "none" }}
                onRun={onRun} onClose={()=>setSelectedId(null)}>
                {room.id === "bar" && selected.id === COUNTERS.bar && <CounterRobberyChoice key={selected.id} state={state} venue="bar" godMode={godMode} onRun={onRun}/>}
              </ActionPanel>
            )}
          </div>
        )}
        {selected && !use3d && (
          <ActionPanel
            hotspot={selected}
            state={state}
            godMode={godMode}
            style={use3d ? panel3d(size.w, size.h) : panelStyle(selected.box, fit, size.w, size.h)}
            onRun={onRun}
            onClose={() => setSelectedId(null)}
          >
            {use3d && room.id === "bar" && selected.id === COUNTERS.bar && (
              <CounterRobberyChoice key={selected.id} state={state} venue="bar" godMode={godMode} onRun={onRun} />
            )}
          </ActionPanel>
        )}
      </div>

      <footer className="flex shrink-0 items-center gap-2 bg-card px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          onClick={onLeave}
          aria-label="Leave building"
          className="min-h-12 shrink-0 rounded-lg border-2 border-foreground bg-secondary px-4 text-base font-bold"
        >
          ← Leave
        </button>
        <div aria-live="polite" className="min-w-0 flex-1 text-sm">
          {feedback ? (
            <div>
              <p
                className={`font-bold ${feedback.success ? "" : "text-destructive"}`}
              >{`${feedback.success ? "✓ " : "! "}${feedback.message}`}</p>
              {(feedback.changes.length > 0 || feedback.timeLine) && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {feedback.changes.map((c) => (
                    <span key={c} className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">
                      {c}
                    </span>
                  ))}
                  {feedback.timeLine && (
                    <span className="rounded bg-secondary px-2 py-0.5 text-xs font-bold">
                      🕒 {feedback.timeLine}
                    </span>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div>
              <p className="text-muted-foreground">{use3d && room.id === "bar" ? `${STAFF.bar!.name}: “${STAFF.bar!.greeting}”` : "Tap an object to see what you can do."}</p>
              {chatter && (
                <p
                  aria-live="off"
                  className="mt-0.5 text-xs italic text-muted-foreground"
                  data-testid="chatter"
                >
                  {chatter[chatterIdx % chatter.length]}
                </p>
              )}
            </div>
          )}
        </div>
      </footer>
    </div>
  );
}

/** Arcade counters for service locations; object scenes for home, training and the street. */
/** The bar is a 3D room when WebGL works and otherwise the classic walkable shop. */
function Walkable3DVenueScene(props: Parameters<typeof ObjectLocationScene>[0]) {
  const renderer = useRenderer3d();
  if (renderer.gl && !renderer.classic) return <ObjectLocationScene {...props} renderer={renderer} />;
  if (props.room.id !== "bar" && !isWalkableShop(props.room.id)) return <><ArcadeInterior {...props} />{renderer.gl && <button type="button" data-renderer-toggle onClick={() => renderer.setClassic(false)} className="absolute right-3 top-[100px] z-30 min-h-9 rounded-lg border-2 border-foreground bg-secondary px-3 text-sm font-bold">Switch to 3D view</button>}</>;
  return (
    <>
      <WalkableShop {...props} />
      {renderer.gl && (
        <button type="button" onClick={() => renderer.setClassic(false)} className="absolute right-3 top-[100px] z-30 min-h-9 rounded-lg border-2 border-foreground bg-secondary px-3 text-sm font-bold" data-renderer-toggle>Switch to 3D view</button>
      )}
    </>
  );
}

export function LocationScene(props: Parameters<typeof ObjectLocationScene>[0]) {
  if (isVenue(props.room.id) && props.room.id !== "casino" && props.room.id !== "gym") return <Walkable3DVenueScene key={props.room.id} {...props} />;
  if (isWalkableShop(props.room.id)) return <WalkableShop key={props.room.id} {...props} />;
  return isArcadeRoom(props.room.id) ? (
    <ArcadeInterior {...props} />
  ) : (
    <ObjectLocationScene {...props} />
  );
}