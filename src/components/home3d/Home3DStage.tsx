import { Component, lazy, Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { GameState } from "@/lib/game-state";
import { ownsFurniture, type FurnitureId } from "@/lib/furniture";
import type { Hotspot } from "@/lib/rooms";
import type { PlanZone } from "@/lib/home-zones";
import type { HomePlan } from "@/lib/home3d/layout";
import { planFor } from "@/lib/home3d/plans";
import type { CameraControls } from "./types";
import { FirstPersonHands } from "./FirstPersonHands";
import type { Cutscene } from "@/lib/cutscenes";

import { karmaHeadColor } from "@/lib/player-appearance";

const HomeScene3D = lazy(() => import("./HomeScene3D"));

/** Hotspot ids and layout slot ids differ for the television only. */
export const toSlotId = (hotspotId: string) => (hotspotId === "television" ? "tv" : hotspotId);
/** Games-room machines are scene objects that open the existing minigames rather than action panels. */
export const GAME_SLOTS: Record<string, "blackjack" | "slots"> = { blackjack: "blackjack", slots: "slots" };
export const toHotspotId = (slotId: string) => (slotId === "tv" ? "television" : slotId);

export function webglAvailable(): boolean {
  try {
    if (typeof document === "undefined") return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

class Boundary extends Component<{ fallback: ReactNode; children: ReactNode }, { failed: boolean }> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override componentDidCatch() {}
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const LUX_IDS: FurnitureId[] = ["bed", "kitchen", "weights", "desk", "sofa", "tv", "console", "bookshelf"];

export function luxuryMap(state: GameState): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  for (const id of LUX_IDS) out[id] = ownsFurniture(state.luxuryFurniture ?? 0, id);
  return out;
}

const BTN = "min-h-11 min-w-11 rounded-lg border-2 border-foreground bg-card/90 px-2 text-lg font-bold shadow";

export function Home3DStage({
  state, visible, selectedId, zone, onSelect, onDeselect, onFail, onLaunch, plan: planProp, cutscene = null, onCutsceneDone,
}: {
  state: GameState;
  visible: Hotspot[];
  selectedId: string | null;
  zone: PlanZone;
  /** A venue's plan (casino, bar, gym). Omitted for homes, which follow the player's property tier. */
  plan?: HomePlan | undefined;
  onSelect: (hotspotId: string) => void;
  onDeselect: () => void;
  /** Called if WebGL breaks at runtime so the parent can switch to the classic renderer. */
  onFail: () => void;
  /** Open a full-screen minigame (mansion games room). */
  onLaunch?: ((game: "blackjack" | "slots") => void) | undefined;
  cutscene?: Cutscene | null;
  onCutsceneDone?: (() => void) | undefined;
}) {
  const controls = useRef<CameraControls | null>(null);
  const [nearby,setNearby]=useState<string|null>(null);
  useEffect(()=>{
    const onNear=(event:Event)=>setNearby((event as CustomEvent<{id:string|null}>).detail?.id??null);
    window.addEventListener("tst:nearby-action",onNear);
    return()=>window.removeEventListener("tst:nearby-action",onNear);
  },[]);
  const plan = planProp ?? planFor(state.house) ?? planFor(1)!;
  const isHome = !planProp;
  const visibleIds = useMemo(() => {
    const ids = visible.map((h) => toSlotId(h.id));
    if (isHome && state.house >= 3) ids.push(...Object.keys(GAME_SLOTS));
    return ids;
  }, [visible, state.house, isHome]);
  const luxury = useMemo(() => luxuryMap(state), [state]);
  const hasBed = ownsFurniture(state.furniture, "bed");
  const c = () => controls.current;
  return (
    <div className="absolute inset-0" data-home3d data-hotspot="home3d" data-plan={plan.kind}>
      <Boundary fallback={<FailNotice onFail={onFail} />}>
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Building the scene…</div>}>
          <HomeScene3D
            key={plan.kind}
            plan={plan}
            controls={controls}
            visibleIds={visibleIds}
            luxury={luxury}
            hasBed={hasBed}
            selectedId={selectedId ? toSlotId(selectedId) : null}
            zone={zone}
            hour={state.hour}
            playerHead={karmaHeadColor(state.karma)}
            cutscene={cutscene}
            {...(onCutsceneDone ? { onCutsceneDone } : {})}
            onDeselect={onDeselect}
            onSelect={(slotId) => {
              const game = isHome ? GAME_SLOTS[slotId] : undefined;
              if (game && onLaunch) onLaunch(game);
              else if (!game) onSelect(toHotspotId(slotId));
            }}
          />
        </Suspense>
      </Boundary>
      <FirstPersonHands acting={Boolean(cutscene)} />
      {!cutscene && !selectedId && nearby && visibleIds.includes(nearby) && (
        <button type="button" data-nearby-action
          aria-label={`Interact with ${plan.slots.find(s=>s.id===nearby)?.label??nearby}`}
          className="pointer-events-auto absolute bottom-4 right-3 z-30 min-h-14 max-w-[45%] rounded-full border-2 border-foreground bg-primary px-4 text-base font-bold text-primary-foreground shadow-lg"
          onClick={() => {
            const game = isHome ? GAME_SLOTS[nearby] : undefined;
            if (game && onLaunch) onLaunch(game);
            else if (!game) onSelect(toHotspotId(nearby));
          }}>
          ✦ {plan.slots.find(s=>s.id===nearby)?.label??"Interact"}
        </button>
      )}
      {!cutscene && <button type="button" className={`absolute right-2 top-2 ${BTN}`} aria-label="Look ahead" onClick={() => c()?.reset()}>⌂</button>}
    </div>
  );
}

function FailNotice({ onFail }: { onFail: () => void }) {
  // Render nothing visible; hand control back to the classic renderer.
  queueMicrotask(onFail);
  return null;
}