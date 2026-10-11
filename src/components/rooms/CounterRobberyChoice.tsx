import { useRef, useState } from "react";
import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import type { ShopId } from "@/lib/walkable-shops";
import { robTill, robberyBlock, robberyChance } from "@/lib/counter-robbery";
import { actionBlockReason } from "@/components/rooms/ActionPanel";

export function CounterRobberyChoice({
  state,
  venue,
  godMode,
  onRun,
}: {
  state: GameState;
  venue: ShopId;
  godMode: boolean;
  onRun: (a: ActionDef) => void;
}) {
  const [armed, setArmed] = useState(false);
  const ready = useRef(false);
  const action = robTill(venue);
  // Equipment and daily guards also apply in god mode.
  const blocked = robberyBlock(state) ?? actionBlockReason(state, action, godMode);
  return (
    <div className="flex shrink-0 flex-col gap-2 border-t-2 border-foreground/20 pt-3">
      <button
        type="button"
        className="room-action"
        disabled={!!blocked}
        onClick={() => {
          ready.current = true;
          setArmed(true);
        }}
      >
        <span>Rob the till</span>
        <span className="room-action-note">
          {blocked ?? "Requires your heavy bat · review risks first"}
        </span>
      </button>
      {armed && (
        <div className="flex flex-col gap-2" role="group" aria-label="Confirm till robbery">
          <p className="room-panel-line">
            {action.note} 30 minutes · 15 energy · {Math.round(robberyChance(state) * 100)}%
            estimated success. One attempt per day across town.
          </p>
          <button
            type="button"
            className="room-action"
            disabled={!!blocked}
            onClick={() => {
              if (!ready.current || blocked) return;
              ready.current = false;
              setArmed(false);
              onRun(action);
            }}
          >
            Go through with it
          </button>
          <button
            type="button"
            className="room-action"
            onClick={() => {
              ready.current = false;
              setArmed(false);
            }}
          >
            Back off
          </button>
        </div>
      )}
    </div>
  );
}
