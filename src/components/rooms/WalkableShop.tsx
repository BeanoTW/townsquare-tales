import { useEffect, useRef, useState } from "react";
import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import type { Feedback } from "@/components/LocationScene";
import { ActionPanel } from "@/components/rooms/ActionPanel";
import { OverheadPerson } from "@/components/OverheadPerson";
import { STAFF } from "@/components/rooms/ArcadeInterior";
import { visibleHotspots, type Room } from "@/lib/rooms";
import {
  SHOP_ENTRY,
  SHOP_EXIT,
  SHOP_LAYOUTS,
  shopRoute,
  moveShopPlayer,
  fixtureNear,
  type ShopId,
} from "@/lib/walkable-shops";
import { SHOP_GOODS, shopAvailability } from "@/lib/shop-catalog";
import type { Point } from "@/lib/pathfinding";

const vectors: Record<string, Point> = {
  ArrowUp: { x: 0, y: -1 },
  w: { x: 0, y: -1 },
  ArrowDown: { x: 0, y: 1 },
  s: { x: 0, y: 1 },
  ArrowLeft: { x: -1, y: 0 },
  a: { x: -1, y: 0 },
  ArrowRight: { x: 1, y: 0 },
  d: { x: 1, y: 0 },
};
export function WalkableShop({
  room,
  state,
  feedback,
  onRun,
  onLeave,
  godMode = false,
}: {
  room: Room;
  state: GameState;
  feedback: Feedback | null;
  onRun: (a: ActionDef) => void;
  onLeave: () => void;
  godMode?: boolean;
}) {
  const id = room.id as ShopId,
    fixtures = SHOP_LAYOUTS[id];
  const pos = useRef<Point>({ ...SHOP_ENTRY }),
    path = useRef<Point[]>([]),
    pending = useRef<string | null>(null),
    keys = useRef(new Set<string>());
  const [player, setPlayer] = useState({ ...SHOP_ENTRY, angle: 0, phase: 0, moving: false });
  const [running, setRunning] = useState(false),
    [selectedId, setSelected] = useState<string | null>(null);
  const reduced = useRef(false);
  const visible = visibleHotspots(room, state);
  const selected = visible.find((h) => h.id === selectedId);
  const near = fixtures.find((f) => fixtureNear(player, f) && visible.some((h) => h.id === f.id));
  const staff = STAFF[id]!;
  // The shared catalog remains the source for all seven goods; careers use room hotspots.
  const panel =
    selected && id === "shop" && selected.id === "shelves"
      ? {
          ...selected,
          actions: (s: GameState) =>
            SHOP_GOODS.map((g) => ({ ...g.action(s), note: g.description })),
          lines: () => [staff.greeting],
        }
      : selected;
  const control = useRef({ selectedId, onLeave, visible, near });
  control.current = { selectedId, onLeave, visible, near };
  const open = (target: string) => {
    if (target === "exit") {
      if (Math.hypot(pos.current.x - SHOP_EXIT.x, pos.current.y - SHOP_EXIT.y) < 0.8) {
        onLeave();
        return;
      }
    } else {
      const f = fixtures.find((f) => f.id === target);
      if (!f) return;
      if (fixtureNear(pos.current, f)) {
        setSelected(target);
        return;
      }
    }
    const goal = target === "exit" ? SHOP_EXIT : fixtures.find((f) => f.id === target)!.approach;
    keys.current.clear();
    setSelected(null);
    pending.current = target;
    path.current = shopRoute(id, pos.current, goal);
    setRunning(path.current.length > 0);
  };
  useEffect(() => {
    if (selectedId) {
      keys.current.clear();
      path.current = [];
      pending.current = null;
      setRunning(false);
      setPlayer((p) => ({ ...p, moving: false }));
    }
  }, [selectedId]);
  useEffect(() => {
    reduced.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    const down = (e: KeyboardEvent) => {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (k === "Escape") {
        e.preventDefault();
        keys.current.clear();
        path.current = [];
        setRunning(false);
        if (control.current.selectedId) setSelected(null);
        else control.current.onLeave();
        return;
      }
      if ((e.target as Element)?.closest?.("button,input,select,textarea,[role=button]")) return;
      if (control.current.selectedId) return;
      if (vectors[k]) {
        e.preventDefault();
        pending.current = null;
        path.current = [];
        keys.current.add(k);
        setRunning(true);
      }
      if (k === "e" || k === "Enter" || k === " ") {
        e.preventDefault();
        if (control.current.near) setSelected(control.current.near.id);
        else if (Math.hypot(pos.current.x - SHOP_EXIT.x, pos.current.y - SHOP_EXIT.y) < 0.8)
          control.current.onLeave();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current.delete(e.key.length === 1 ? e.key.toLowerCase() : e.key);
    };
    const blur = () => {
      keys.current.clear();
      path.current = [];
      pending.current = null;
      setRunning(false);
      setPlayer((p) => ({ ...p, moving: false }));
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
  }, []);
  useEffect(() => {
    if (!running) return;
    let frame = 0,
      last = performance.now();
    const tick = (now: number) => {
      if (now - last < 50) {
        frame = requestAnimationFrame(tick);
        return;
      }
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      let dx = 0,
        dy = 0;
      keys.current.forEach((k) => {
        dx += vectors[k]?.x ?? 0;
        dy += vectors[k]?.y ?? 0;
      });
      const goal = path.current[0];
      if (!dx && !dy && goal) {
        dx = goal.x - pos.current.x;
        dy = goal.y - pos.current.y;
        if (Math.hypot(dx, dy) < 0.08) {
          path.current.shift();
          dx = 0;
          dy = 0;
        }
      }
      const length = Math.hypot(dx, dy),
        step = Math.min(
          3.5 * dt * (state.trainers ? 1.35 : 1),
          goal && !keys.current.size ? length : Infinity,
        );
      const next = length
        ? moveShopPlayer(id, pos.current, { x: (dx / length) * step, y: (dy / length) * step })
        : pos.current;
      const moved = Math.hypot(next.x - pos.current.x, next.y - pos.current.y) > 0.001;
      pos.current = next;
      setPlayer((p) => ({
        ...next,
        angle: moved ? (Math.atan2(dx, -dy) * 180) / Math.PI : p.angle,
        phase: reduced.current ? 0 : p.phase + dt * 8,
        moving: moved,
      }));
      if (!keys.current.size && !path.current.length) {
        const target = pending.current;
        pending.current = null;
        if (target === "exit" && Math.hypot(next.x - SHOP_EXIT.x, next.y - SHOP_EXIT.y) < 0.8)
          control.current.onLeave();
        else if (
          target &&
          control.current.visible.some((h) => h.id === target) &&
          fixtures.some((f) => f.id === target && fixtureNear(next, f))
        )
          setSelected(target);
        setRunning(false);
        return;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running, id, state.trainers]);
  const stop = () => {
    keys.current.clear();
    path.current = [];
    pending.current = null;
    setRunning(false);
    setPlayer((p) => ({ ...p, moving: false }));
  };
  return (
    <div
      className="absolute inset-0 z-20 flex flex-col overflow-hidden bg-background font-hand"
      data-room={id}
      data-walkable-shop
    >
      <header className="shrink-0 px-3 pb-1 pt-[104px] sm:pt-24">
        <h2 className="text-2xl font-bold">{room.title}</h2>
        <p className="text-sm text-muted-foreground">{room.caption}</p>
      </header>
      <div
        className="relative min-h-0 flex-1 border-y-2 border-foreground"
        role="region"
        aria-label={`${room.title} interaction`}
      >
        <svg
          viewBox="0 0 432 360"
          className="h-full w-full touch-manipulation"
          aria-label={`Walk around ${room.title}`}
          onClick={(e) => {
            if (selectedId) return;
            const rect = e.currentTarget.getBoundingClientRect(),
              scale = Math.min(rect.width / 432, rect.height / 360);
            if (!scale) return;
            const goal = {
              x: (e.clientX - rect.left - (rect.width - 432 * scale) / 2) / scale / 24,
              y: (e.clientY - rect.top - (rect.height - 360 * scale) / 2) / scale / 24,
            };
            pending.current = null;
            keys.current.clear();
            path.current = shopRoute(id, pos.current, goal);
            setRunning(path.current.length > 0);
          }}
        >
          <rect
            x="24"
            y="24"
            width="384"
            height="312"
            rx="3"
            fill={room.palette.floor}
            stroke="var(--town-ink)"
            strokeWidth="4"
          />
          <path d="M24 24h384v18H24Z" fill={room.palette.wall} />
          <g opacity=".12" stroke="var(--town-ink)">
            {Array.from({ length: 12 }, (_, i) => (
              <path key={i} d={`M24 ${48 + i * 24}H408`} />
            ))}
          </g>
          {fixtures
            .filter((f) => visible.some((h) => h.id === f.id))
            .map((f) => {
              const h = visible.find((h) => h.id === f.id)!;
              return (
                <g
                  key={f.id}
                  role="button"
                  tabIndex={0}
                  aria-label={`${h.label}. Walk over to interact`}
                  data-shop-fixture={f.id}
                  className="cursor-pointer focus-visible:opacity-80"
                  onClick={(e) => {
                    e.stopPropagation();
                    open(f.id);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      open(f.id);
                    }
                  }}
                >
                  <rect
                    x={f.x * 24}
                    y={f.y * 24}
                    width={f.w * 24}
                    height={f.d * 24}
                    rx="5"
                    fill={room.palette.wall}
                    stroke="var(--town-ink)"
                    strokeWidth="2"
                  />
                  {f.id === "bed-display" ? (
                    <g fill="var(--town-paper)" stroke="var(--town-ink)">
                      <rect
                        x={f.x * 24 + 6}
                        y={f.y * 24 + 6}
                        width={f.w * 24 - 12}
                        height="25"
                        rx="4"
                      />
                      <path d={`M${f.x * 24 + 5} ${f.y * 24 + 40}h${f.w * 24 - 10}`} fill="none" />
                    </g>
                  ) : f.id === "sofa-display" ? (
                    <path
                      d={`M${f.x * 24 + 8} ${f.y * 24 + 8}v30h${f.w * 24 - 16}v-30m-${f.w * 12 - 8} 0v30`}
                      fill="none"
                      stroke="var(--town-ink)"
                      strokeWidth="3"
                    />
                  ) : (
                    <path
                      d={`M${f.x * 24 + 8} ${(f.y + f.d / 2) * 24}h${f.w * 24 - 16}`}
                      stroke="var(--town-ink)"
                    />
                  )}
                  <text
                    x={(f.x + f.w / 2) * 24}
                    y={(f.y + f.d) * 24 - 7}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--town-ink)"
                  >
                    {h.tag}
                  </text>
                  <circle
                    cx={f.approach.x * 24}
                    cy={f.approach.y * 24}
                    r="5"
                    fill="var(--town-window-lit)"
                    stroke="var(--town-ink)"
                  />
                  <rect
                    x={f.x * 24 - 6}
                    y={f.y * 24 - 6}
                    width={Math.max(60, f.w * 24 + 12)}
                    height={Math.max(60, f.d * 24 + 12)}
                    fill="transparent"
                  />
                  <title>
                    {h.label} · {h.hint}
                  </title>
                </g>
              );
            })}
          <g transform="translate(360 144)" data-shop-attendant>
            <OverheadPerson outline="var(--town-npc-red)" />
            <title>{staff.name}</title>
          </g>
          <g
            role="button"
            tabIndex={0}
            aria-label="Walk to exit"
            onClick={(e) => {
              e.stopPropagation();
              open("exit");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                open("exit");
              }
            }}
            className="cursor-pointer focus-visible:opacity-80"
          >
            <rect
              x="192"
              y="312"
              width="48"
              height="24"
              fill="var(--town-window-lit)"
              stroke="var(--town-ink)"
            />
            <text x="216" y="328" textAnchor="middle" fontSize="11" fill="var(--town-ink)">
              EXIT
            </text>
          </g>
          <g
            transform={`translate(${player.x * 24} ${player.y * 24})`}
            data-shop-player
            data-x={player.x}
            data-y={player.y}
          >
            <OverheadPerson
              outline="var(--town-player)"
              moving={player.moving && !reduced.current}
              phase={player.phase}
              angle={player.angle}
            />
          </g>
        </svg>
        {panel && (
          <ActionPanel
            hotspot={panel}
            state={state}
            godMode={godMode}
            style={{
              left: 12,
              right: 12,
              bottom: 12,
              width: "auto",
              maxHeight: "75%",
              overflowY: "auto",
            }}
            unavailable={(a) => {
              const good =
                id === "shop" && panel.id === "shelves"
                  ? SHOP_GOODS.find((g) => g.action(state).id === a.id)
                  : undefined;
              return good && !good.available(state) ? shopAvailability(good, state) : null;
            }}
            onRun={onRun}
            onClose={() => setSelected(null)}
          />
        )}
        {near && !selected && !running && (
          <button
            type="button"
            className="absolute bottom-2 left-1/2 min-h-11 -translate-x-1/2 rounded border-2 border-foreground bg-card px-3"
            onClick={() => {
              stop();
              setSelected(near.id);
            }}
          >
            {visible.find((h) => h.id === near.id)?.label} · E
          </button>
        )}
      </div>
      <footer className="shrink-0 bg-card p-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <div className="flex items-start gap-2">
          <button
            type="button"
            aria-label="Leave building"
            className="min-h-11 shrink-0 rounded border-2 border-foreground px-3"
            onClick={onLeave}
          >
            ← Leave
          </button>
          <div className="max-h-24 overflow-y-auto text-sm" aria-live="polite">
            {feedback ? (
              <>
                <p className={feedback.success ? "" : "text-destructive"}>{feedback.message}</p>
                <p>{[...feedback.changes, feedback.timeLine].filter(Boolean).join(" · ")}</p>
              </>
            ) : (
              <>
                <p>
                  {staff.name}: “{staff.greeting}”
                </p>
                <p>Tap the floor or a fixture to walk. Arrow keys / WASD · E to interact.</p>
              </>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}
