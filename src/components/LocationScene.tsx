import { useEffect, useRef, useState, type CSSProperties } from "react";
import { fitRect, panelStyle, type Size } from "@/lib/room-layout";
import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { RoomArt } from "@/components/rooms/RoomArt";
import {
  VIEW,
  hotspotActions,
  visibleHotspots,
  type Box,
  type Hotspot,
  type Room,
} from "@/lib/rooms";

export type Feedback = { message: string; success: boolean; changes: string[]; timeLine?: string };

function actionMeta(a: ActionDef) {
  const parts = [
    a.hours ? `${a.hours}h` : "No time",
    a.energy ? `−${a.energy} energy` : "No energy",
  ];
  if (a.cost) parts.push(`$${a.cost}`);
  return parts.join(" · ");
}

function ActionPanel({
  hotspot,
  state,
  style,
  onRun,
  onClose,
}: {
  hotspot: Hotspot;
  state: GameState;
  style: CSSProperties;
  onRun: (a: ActionDef) => void;
  onClose: () => void;
}) {
  const actions = hotspotActions(hotspot, state);
  const lines = hotspot.lines?.(state) ?? [];
  return (
    <div role="dialog" aria-label={hotspot.label} className="room-panel" style={style} data-panel>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="room-panel-title">{hotspot.label}</p>
          <p className="room-panel-hint">{hotspot.hint}</p>
        </div>
        <button type="button" aria-label="Close panel" onClick={onClose} className="room-close">
          ✕
        </button>
      </div>
      {lines.map((line) => (
        <p key={line} className="room-panel-line">
          {line}
        </p>
      ))}
      {actions.map((a) => (
        <button key={a.id} type="button" className="room-action" onClick={() => onRun(a)}>
          <span>{a.label}</span>
          <span className="room-action-meta">{actionMeta(a)}</span>
          {a.note && <span className="room-action-note">{a.note}</span>}
        </button>
      ))}
      {actions.length === 0 && lines.length === 0 && (
        <p className="room-panel-line">Nothing to do here yet.</p>
      )}
    </div>
  );
}

export function LocationScene({
  room,
  state,
  feedback,
  onRun,
  onLeave,
}: {
  room: Room;
  state: GameState;
  feedback: Feedback | null;
  onRun: (a: ActionDef) => void;
  onLeave: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [size, setSize] = useState<Size>({ w: 0, h: 0 });
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedId) setSelectedId(null);
      else onLeave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, onLeave]);

  const visible = visibleHotspots(room, state);
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
      </header>

      <div
        ref={stageRef}
        className="relative min-h-0 flex-1 overflow-hidden border-y-2 border-foreground"
        style={stageStyle}
        onClick={(e) => {
          if (!(e.target as Element).closest("[data-hotspot],[data-panel]")) setSelectedId(null);
        }}
      >
        {fit.y >= 40 && (
          <div className="room-sign" style={{ top: Math.max(10, fit.y / 2 - 15) }}>
            {room.sign}
          </div>
        )}
        <div className="absolute" style={{ left: fit.x, top: fit.y, width: fit.w, height: fit.h }}>
          <RoomArt
            room={room}
            state={state}
            visible={visible}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId((cur) => (cur === id ? null : id))}
          />
        </div>
        {selected && (
          <ActionPanel
            hotspot={selected}
            state={state}
            style={panelStyle(selected.box, fit, size.w, size.h)}
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
            <p className="text-muted-foreground">Tap an object to see what you can do.</p>
          )}
        </div>
      </footer>
    </div>
  );
}
