import { CounterRobberyChoice } from "@/components/rooms/CounterRobberyChoice";
import { COUNTERS } from "@/lib/counter-robbery";
import { useEffect, useRef, useState } from "react";
import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import type { Feedback } from "@/components/LocationScene";
import { ShopFitting, ShopShell } from "@/components/rooms/ShopFittings";
import { ActionPanel } from "@/components/rooms/ActionPanel";
import { OverheadPerson } from "@/components/OverheadPerson";
import { STAFF } from "@/components/rooms/ArcadeInterior";
import { visibleHotspots, type Hotspot, type Room } from "@/lib/rooms";
import {
  SHOP_ENTRY,
  SHOP_EXIT,
  SHOP_LAYOUTS,
  SHOP_STAFF,
  SHOP_AISLES,
  shopRoute,
  moveShopPlayer,
  fixtureNear,
  type ShopId,
} from "@/lib/walkable-shops";
import { FurnitureShowroom } from "@/components/rooms/FurnitureShowroom";
import { ShopCatalogPanel } from "@/components/rooms/ShopCatalogPanel";
import { DINER_MEALS } from "@/lib/diner-menu";
import { hotspotActions } from "@/lib/rooms";
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
  onLaunch,
  paused = false,
}: {
  room: Room;
  state: GameState;
  feedback: Feedback | null;
  onRun: (a: ActionDef) => void;
  onLeave: () => void;
  godMode?: boolean;
  /** Hotspots with a `launch` open a full-screen minigame instead of a panel. */
  onLaunch?: ((game: NonNullable<Hotspot["launch"]>) => void) | undefined;
  /** A minigame is open on top: ignore the keyboard so it cannot walk the player or leave the room. */
  paused?: boolean;
}) {
  const id = room.id as ShopId,
    fixtures = SHOP_LAYOUTS[id];
  const interactionFixtures = [...fixtures, ...SHOP_AISLES[id]];
  const hotspotId = (target: string) => (target === "aisle" ? "shelves" : target === "premium" ? "catalogue" : target);
  const pos = useRef<Point>({ ...SHOP_ENTRY }),
    path = useRef<Point[]>([]),
    pending = useRef<string | null>(null),
    keys = useRef(new Set<string>());
  const [player, setPlayer] = useState({ ...SHOP_ENTRY, angle: 0, phase: 0, moving: false });
  const [running, setRunning] = useState(false),
    [selectedId, setSelected] = useState<string | null>(null);
  const [pickedGood, setPickedGood] = useState("snack");
  const [furnitureRange, setFurnitureRange] = useState<"basic" | "luxury">("basic");
  const reduced = useRef(false);
  const visible = visibleHotspots(room, state).filter(
    (h) =>
      id !== "diner" ||
      (((h.id !== "kitchen" && h.id !== "booth") || state.career === 1) &&
        (h.id !== "hiring" || state.career !== 1)),
  );
  const selected = visible.find((h) => h.id === selectedId);
  const near = interactionFixtures.find(
    (f) => fixtureNear(player, f) && visible.some((h) => h.id === hotspotId(f.id)),
  );
  const staff = STAFF[id]!;
  const panel =
    selected && id === "diner" && selected.id === "counter"
      ? {
          ...selected,
          label: "Food menu",
          hint: "Order at the counter · three meals · 1h",
          actions: () =>
            DINER_MEALS.map((m) => ({
              ...m.action,
              label: m.title,
              note: `${m.description} ${m.action.note ?? ""}`,
            })),
        }
      : selected;
  const control = useRef({ selectedId, onLeave, visible, near, onLaunch, paused });
  control.current = { selectedId, onLeave, visible, near, onLaunch, paused };
  const choose = (target: string) => {
    const spot = control.current.visible.find((h) => h.id === hotspotId(target));
    if (spot?.launch && control.current.onLaunch) {
      keys.current.clear();
      path.current = [];
      setSelected(null);
      control.current.onLaunch(spot.launch);
      return;
    }
    if (id === "furniture") setFurnitureRange(target === "premium" ? "luxury" : "basic");
    setSelected(hotspotId(target));
  };
  const open = (target: string) => {
    if (target === "exit") {
      if (Math.hypot(pos.current.x - SHOP_EXIT.x, pos.current.y - SHOP_EXIT.y) < 0.8) {
        onLeave();
        return;
      }
    } else {
      const f = interactionFixtures.find((f) => f.id === target);
      if (!f) return;
      if (fixtureNear(pos.current, f)) {
        choose(target);
        return;
      }
    }
    const goal =
      target === "exit" ? SHOP_EXIT : interactionFixtures.find((f) => f.id === target)!.approach;
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
      if (control.current.paused) return;
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
        if (control.current.near) choose(control.current.near.id);
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
          control.current.visible.some((h) => h.id === hotspotId(target)) &&
          interactionFixtures.some((f) => f.id === target && fixtureNear(next, f))
        )
          choose(target);
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
          <ShopShell shop={id} />
          {fixtures
            .filter((f) => !visible.some((h) => h.id === hotspotId(f.id)))
            .map((f) => (
              <ShopFitting key={f.id} fixture={f} shop={id} />
            ))}
          {SHOP_AISLES[id].map((f) =>
            f.id !== "aisle" ? (
              <ShopFitting key={f.id} fixture={f} shop={id} />
            ) : (
              <g
                key={f.id}
                role="button"
                tabIndex={0}
                aria-label="Browse the grocery aisle"
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
                <ShopFitting fixture={f} shop={id} />
                <rect
                  x={f.x * 24 - 6}
                  y={f.y * 24 - 6}
                  width={f.w * 24 + 12}
                  height={f.d * 24 + 12}
                  fill="transparent"
                />
              </g>
            ),
          )}
          {fixtures
            .filter((f) => visible.some((h) => h.id === hotspotId(f.id)))
            .map((f) => {
              const h = visible.find((h) => h.id === hotspotId(f.id))!;
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
                  <ShopFitting fixture={f} shop={id} />
                  <text
                    x={(f.x + f.w / 2) * 24}
                    y={(f.y + f.d) * 24 + 12}
                    textAnchor="middle"
                    fontSize="9"
                    fill="var(--town-ink)"
                  >
                    {f.id === "checkout"
                      ? "CHECKOUT"
                      : f.id === "catalogue"
                        ? "SALES DESK"
                        : f.id === "shelves"
                          ? "FOOD & DRINK"
                          : f.id === "curiosities"
                            ? "ODDITIES"
                            : h.label.replace(" display", "").replace("Shop ", "")}
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
          <g
            transform={`translate(${SHOP_STAFF[id].x * 24} ${SHOP_STAFF[id].y * 24})`}
            data-shop-attendant
          >
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
          {(id === "diner" || id === "bar") && (
            <g
              data-interior-patron
              transform={id === "diner" ? "translate(72 201)" : "translate(333 267)"}
              pointerEvents="none"
            >
              <OverheadPerson
                pose="sitting"
                outline="var(--town-npc-green)"
                angle={id === "diner" ? 90 : 270}
              />
              <title>
                {id === "diner"
                  ? "Regular: Breakfast is cheaper than therapy."
                  : "Pub regular: Only staying for one. A historic lie."}
              </title>
            </g>
          )}
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
        {panel && id === "furniture" && panel.id === "catalogue" ? (
          <div data-panel className="absolute inset-x-3 bottom-3 z-30 max-h-[75%] overflow-y-auto rounded-xl border-2 border-foreground bg-card p-3 shadow-xl">
            <div className="mb-2 flex items-center justify-between gap-2"><strong>{furnitureRange === "luxury" ? "✨ Premium Furniture" : "Basic Furniture"}</strong><button type="button" className="min-h-11 min-w-11 rounded-lg border-2 border-foreground" aria-label="Close furniture collection" onClick={() => setSelected(null)}>✕</button></div>
            <FurnitureShowroom key={furnitureRange} state={state} onRun={onRun} initialRange={furnitureRange} hideTabs />
          </div>
        ) : panel && id === "shop" && (panel.id === "shelves" || panel.id === "checkout") ? (
          <ShopCatalogPanel
            key={panel.id}
            state={state}
            godMode={godMode}
            browsing={panel.id === "shelves"}
            counterOption={
              <CounterRobberyChoice state={state} venue={id} godMode={godMode} onRun={onRun} />
            }
            picked={pickedGood}
            onPick={(good) => {
              setPickedGood(good);
              if (panel.id === "shelves") open("checkout");
            }}
            onRun={onRun}
            onClose={() => setSelected(null)}
            shiftActions={
              panel.id === "checkout"
                ? hotspotActions(panel, state).filter(
                    (a) => a.id !== "buy-shoes" && a.id !== "buy-alarm",
                  )
                : []
            }
          />
        ) : (
          panel && (
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
              unavailable={(a) =>
                a.cost && state.money < a.cost ? `Need $${a.cost} (have $${state.money})` : null
              }
              onRun={onRun}
              onClose={() => setSelected(null)}
            >
              {panel.id === COUNTERS[id] && (
                <CounterRobberyChoice
                  key={panel.id}
                  state={state}
                  venue={id}
                  godMode={godMode}
                  onRun={onRun}
                />
              )}
            </ActionPanel>
          )
        )}
        {near && !selected && !running && (
          <button
            type="button"
            className="absolute bottom-2 left-1/2 min-h-11 -translate-x-1/2 rounded border-2 border-foreground bg-card px-3"
            onClick={() => {
              stop();
              choose(near.id);
            }}
          >
            {visible.find((h) => h.id === hotspotId(near.id))?.label} · E
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
