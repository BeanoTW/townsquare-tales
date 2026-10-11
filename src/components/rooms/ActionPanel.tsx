import type { CSSProperties } from "react";
import type { ActionDef } from "@/lib/actions";
import type { GameState } from "@/lib/game-state";
import { hotspotActions, type Hotspot } from "@/lib/rooms";

function actionMeta(a: ActionDef) {
  const parts = [
    a.hours ? `${a.hours}h` : "No time",
    a.energy ? `−${a.energy} energy` : "No energy",
  ];
  if (a.cost) parts.push(`$${a.cost}`);
  return parts.join(" · ");
}

export function actionBlockReason(
  state: GameState,
  action: ActionDef,
  godMode = false,
): string | null {
  if (godMode) return null;
  if (state.energy < action.energy) return `Need ${action.energy} energy (have ${state.energy})`;
  if (state.hour + action.hours > 24)
    return `Not enough time left today (${24 - state.hour}h available)`;
  return null;
}

export function ActionPanel({
  hotspot,
  state,
  godMode,
  style,
  onRun,
  onClose,
  unavailable,
}: {
  hotspot: Hotspot;
  state: GameState;
  godMode: boolean;
  style: CSSProperties;
  onRun: (a: ActionDef) => void;
  onClose: () => void;
  unavailable?: (a: ActionDef) => string | null;
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
      {actions.map((a) => {
        const blocked =
          actionBlockReason(state, a, godMode) ?? (godMode ? null : (unavailable?.(a) ?? null));
        return (
          <button
            key={a.id}
            type="button"
            className="room-action"
            disabled={blocked !== null}
            aria-label={blocked ? `${a.label}: ${blocked}` : a.label}
            onClick={() => onRun(a)}
          >
            <span>{a.label}</span>
            <span className="room-action-meta">{actionMeta(a)}</span>
            {blocked ? (
              <span className="room-action-blocked">{blocked}</span>
            ) : (
              a.note && <span className="room-action-note">{a.note}</span>
            )}
          </button>
        );
      })}
      {actions.length === 0 && lines.length === 0 && (
        <p className="room-panel-line">Nothing to do here yet.</p>
      )}
    </div>
  );
}
