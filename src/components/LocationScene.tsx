import { useEffect, useRef, useState, type CSSProperties } from "react";
import { fitRect, panelStyle, type Size } from "@/lib/room-layout";
import { bankLoanAction, repayLoanAction, type ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { RoomArt } from "@/components/rooms/RoomArt";
import { ActionPanel } from "@/components/rooms/ActionPanel";
export { actionBlockReason } from "@/components/rooms/ActionPanel";
import { WalkableShop } from "@/components/rooms/WalkableShop";
import { isWalkableShop } from "@/lib/walkable-shops";
import { ArcadeInterior } from "@/components/rooms/ArcadeInterior";
import { isArcadeRoom } from "@/lib/arcade-rooms";
import { Home3DStage, webglAvailable } from "@/components/home3d/Home3DStage";
import { homeZones, furnitureZone, type HomeZone } from "@/lib/home-zones";
import { VIEW, visibleHotspots, type Box, type Room, type Hotspot } from "@/lib/rooms";

const panel3d = (cw: number, ch: number): CSSProperties =>
  cw <= 600
    ? { left: 8, bottom: 8, width: cw - 16, maxHeight: Math.max(80, ch - 16) }
    : { right: 8, bottom: 8, width: Math.min(290, cw - 16), maxHeight: Math.max(140, ch - 16) };

export type Feedback = { message: string; success: boolean; changes: string[]; timeLine?: string };

function ObjectLocationScene({
  room,
  state,
  feedback,
  onRun,
  onLeave,
  godMode = false,
  onLaunch,
  paused = false,
}: {
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
  const [homeZone, setHomeZone] = useState<HomeZone>(room.id === "home" ? homeZones(state.house)[0]!.id : "shelter");
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
  // Studio Flat renders as a real 3D scene when WebGL works; the classic SVG renderer remains the fallback.
  // Both are resolved after mount so server and client markup match.
  const [classic, setClassic] = useState(false);
  const [gl, setGl] = useState(false);
  useEffect(() => {
    setGl(webglAvailable());
    try { setClassic(localStorage.getItem("tst.home3d") === "classic"); } catch { /* storage unavailable */ }
  }, []);
  const use3d = room.id === "home" && state.house === 1 && gl && !classic;
  const setRenderer = (c: boolean) => {
    setSelectedId(null);
    setClassic(c);
    try { localStorage.setItem("tst.home3d", c ? "classic" : "3d"); } catch { /* storage unavailable */ }
  };
  const stageRef = useRef<HTMLDivElement>(null);

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
      if (selectedId) setSelectedId(null);
      else onLeave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onLeave, paused]);

  const [chatterIdx, setChatterIdx] = useState(0);
  const chatter = room.chatter;
  useEffect(() => {
    if (!chatter || chatter.length < 2) return;
    const id = window.setInterval(() => setChatterIdx((i) => (i + 1) % chatter.length), 6500);
    return () => window.clearInterval(id);
  }, [chatter]);

  const visible = visibleHotspots(room, state).filter(h => room.id !== "home" || use3d || furnitureZone(h.id, state.house) === homeZone);
  const selected = visible.find((h) => h.id === selectedId) ?? null;
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
        <h2 className="text-2xl font-bold leading-tight">{room.title}</h2>
        <p className="room-caption text-sm text-muted-foreground">{room.caption}</p>
        {room.id === "home" && <nav className="mt-2 flex gap-2 overflow-x-auto pb-2" aria-label="Home rooms">{homeZones(state.house).map(z => <button type="button" key={z.id} aria-current={homeZone === z.id ? "page" : undefined} onClick={() => {setSelectedId(null); setHomeZone(z.id);}} className={`min-h-11 shrink-0 rounded-lg border-2 border-foreground px-3 font-bold ${homeZone === z.id ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>{z.label}</button>)}</nav>}
        {room.id === "home" && state.house === 1 && gl && <button type="button" onClick={() => setRenderer(!classic)} className="mb-1 min-h-9 rounded-lg border-2 border-foreground bg-secondary px-3 text-sm font-bold" data-renderer-toggle>{classic ? "Switch to 3D view" : "Switch to classic view"}</button>}
        {room.id === "home" && state.house >= 3 && homeZone === "entertainment" && <section className="my-2 rounded-xl border-2 border-foreground bg-secondary p-2" aria-label="Games room">
          <p className="text-sm font-bold">🎲 Your friends are here for cards and slots.</p>
          <div className="mt-2 flex gap-2">
            <button type="button" className="min-h-11 flex-1 rounded-lg border-2 border-foreground bg-card px-2 font-bold" onClick={() => onLaunch?.("blackjack")}>♠ Blackjack</button>
            <button type="button" className="min-h-11 flex-1 rounded-lg border-2 border-foreground bg-card px-2 font-bold" onClick={() => onLaunch?.("slots")}>🎰 Slots</button>
          </div>
        </section>}
        {room.id === "bank" && <button type="button" onClick={() => { setSelectedId(null); setShowLoans(v => !v); }} className="my-2 min-h-11 rounded-xl border-2 border-foreground bg-secondary px-4 text-base font-bold" aria-expanded={showLoans}>🏦 {showLoans ? "Close loan desk" : "Loans · Borrow & repay"} · Debt ${state.loanDebt ?? 0}</button>}
        {room.id === "bank" && showLoans && <section data-bank-loans className="max-h-[35vh] overflow-y-auto rounded-xl border-2 border-foreground bg-card p-3 shadow-lg">
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
            onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
            onDeselect={() => setSelectedId(null)}
            onFail={() => setClassic(true)}
          />
        )}
        {!use3d && (
        <div
          className="room-art-frame absolute"
          style={{ left: fit.x, top: fit.y, width: fit.w, height: fit.h }}
        >
          <RoomArt
            room={room}
            homeZone={room.id === "home" ? homeZone : undefined}
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
        {selected && (
          <ActionPanel
            hotspot={selected}
            state={state}
            godMode={godMode}
            style={use3d ? panel3d(size.w, size.h) : panelStyle(selected.box, fit, size.w, size.h)}
            onRun={onRun}
            onClose={() => setSelectedId(null)}
          />
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
              <p className="text-muted-foreground">Tap an object to see what you can do.</p>
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
export function LocationScene(props: Parameters<typeof ObjectLocationScene>[0]) {
  if (isWalkableShop(props.room.id)) return <WalkableShop key={props.room.id} {...props} />;
  return isArcadeRoom(props.room.id) ? (
    <ArcadeInterior {...props} />
  ) : (
    <ObjectLocationScene {...props} />
  );
}
