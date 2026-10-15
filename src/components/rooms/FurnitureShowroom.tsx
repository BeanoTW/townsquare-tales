import { useState } from "react";
import { furnitureAction, type ActionDef } from "@/lib/actions";
import { FURNITURE, LUXURY_FURNITURE, ownsFurniture } from "@/lib/furniture";
import type { GameState } from "@/lib/game-state";

export function FurnitureShowroom({ state, onRun }: { state: GameState; onRun: (action: ActionDef) => void }) {
  const [range, setRange] = useState<"basic" | "luxury">("basic");
  const luxury = range === "luxury";
  const items = luxury ? LUXURY_FURNITURE : FURNITURE;
  const ownedMask = luxury ? state.luxuryFurniture ?? 0 : state.furniture;
  const ownedCount = items.filter(item => ownsFurniture(ownedMask, item.id)).length;
  return <div className="space-y-3" data-furniture-showroom>
    <div className="arcade-tabs arcade-service-tabs" role="tablist" aria-label="Furniture ranges">
      <button type="button" role="tab" aria-selected={!luxury} onClick={() => setRange("basic")}>Basic collection</button>
      <button type="button" role="tab" aria-selected={luxury} onClick={() => setRange("luxury")}>✨ Premium aisle</button>
    </div>
    <section role="tabpanel" aria-label={luxury ? "Premium aisle" : "Basic collection"}>
      <div className="flex items-center justify-between gap-2">
        <div><h3 className="font-bold">{luxury ? "Premium showroom" : "Everyday essentials"}</h3><p className="arcade-subline">{luxury ? "Luxury upgrades for your home." : "Functional furniture to get started."}</p></div>
        <span className="shrink-0 rounded-lg border border-current px-2 py-1 text-sm">Owned {ownedCount}/{items.length}</span>
      </div>
      <div className="mt-3 grid gap-2">
        {items.map(item => {
          const owned = ownsFurniture(ownedMask, item.id);
          const affordable = state.money >= item.cost;
          return <article key={item.id} className="rounded-xl border-2 border-current/40 bg-background/70 p-3" data-furniture-item={item.id}>
            <div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="font-bold">{item.name}</p><p className="text-sm text-muted-foreground">{item.benefit}</p></div><strong className="whitespace-nowrap">${item.cost.toLocaleString()}</strong></div>
            <button type="button" className="mt-2 min-h-11 w-full rounded-lg border-2 border-foreground bg-secondary px-3 font-bold disabled:opacity-70" disabled={owned || !affordable} onClick={() => onRun(furnitureAction(item.id, state, luxury))}>
              {owned ? "✓ OWNED" : affordable ? `Buy for $${item.cost.toLocaleString()}` : `Need $${(item.cost - state.money).toLocaleString()} more`}
            </button>
          </article>;
        })}
      </div>
    </section>
  </div>;
}
