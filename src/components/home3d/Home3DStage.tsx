import { Component, lazy, Suspense, useMemo, useRef, type ReactNode } from "react";
import type { GameState } from "@/lib/game-state";
import { ownsFurniture, type FurnitureId } from "@/lib/furniture";
import type { Hotspot } from "@/lib/rooms";
import type { HomeZone } from "@/lib/home-zones";
import type { CameraControls } from "./types";

const HomeScene3D = lazy(() => import("./HomeScene3D"));

/** Hotspot ids and layout slot ids differ for the television only. */
export const toSlotId = (hotspotId: string) => (hotspotId === "television" ? "tv" : hotspotId);
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
  state, visible, selectedId, zone, onSelect, onDeselect, onFail,
}: {
  state: GameState;
  visible: Hotspot[];
  selectedId: string | null;
  zone: HomeZone;
  onSelect: (hotspotId: string) => void;
  onDeselect: () => void;
  /** Called if WebGL breaks at runtime so the parent can switch to the classic renderer. */
  onFail: () => void;
}) {
  const controls = useRef<CameraControls | null>(null);
  const visibleIds = useMemo(() => visible.map((h) => toSlotId(h.id)), [visible]);
  const luxury = useMemo(() => luxuryMap(state), [state]);
  const hasBed = ownsFurniture(state.furniture, "bed");
  const c = () => controls.current;
  return (
    <div className="absolute inset-0" data-home3d data-hotspot="home3d">
      <Boundary fallback={<FailNotice onFail={onFail} />}>
        <Suspense fallback={<div className="absolute inset-0 grid place-items-center text-sm text-muted-foreground">Building your flat…</div>}>
          <HomeScene3D
            controls={controls}
            visibleIds={visibleIds}
            luxury={luxury}
            hasBed={hasBed}
            selectedId={selectedId ? toSlotId(selectedId) : null}
            zone={zone}
            hour={state.hour}
            onDeselect={onDeselect}
            onSelect={(slotId) => onSelect(toHotspotId(slotId))}
          />
        </Suspense>
      </Boundary>
      <div className="absolute right-2 top-2 flex flex-col gap-1" data-home3d-controls onClick={(e) => e.stopPropagation()}>
        <button type="button" className={BTN} aria-label="Zoom in" onClick={() => c()?.zoom(0.8)}>＋</button>
        <button type="button" className={BTN} aria-label="Zoom out" onClick={() => c()?.zoom(1.25)}>－</button>
        <button type="button" className={BTN} aria-label="Rotate left" onClick={() => c()?.rotate(-0.5)}>⟲</button>
        <button type="button" className={BTN} aria-label="Rotate right" onClick={() => c()?.rotate(0.5)}>⟳</button>
        <button type="button" className={BTN} aria-label="Reset camera" onClick={() => c()?.reset()}>⌂</button>
      </div>
    </div>
  );
}

function FailNotice({ onFail }: { onFail: () => void }) {
  // Render nothing visible; hand control back to the classic renderer.
  queueMicrotask(onFail);
  return null;
}
