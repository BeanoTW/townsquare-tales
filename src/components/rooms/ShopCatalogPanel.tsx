import { useState } from "react";
import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { SHOP_GOODS, shopAvailability } from "@/lib/shop-catalog";
import { actionBlockReason } from "@/components/rooms/ActionPanel";

type Category = "All" | "Food & drink" | "Equipment" | "Smokes";
export function ShopCatalogPanel({
  state,
  godMode,
  browsing,
  picked,
  onPick,
  onRun,
  onClose,
  shiftActions,
}: {
  state: GameState;
  godMode: boolean;
  browsing: boolean;
  picked: string;
  onPick: (id: string) => void;
  onRun: (a: ActionDef) => void;
  onClose: () => void;
  shiftActions: ActionDef[];
}) {
  const [category, setCategory] = useState<Category>("All");
  const goods = SHOP_GOODS.filter(
    (g) =>
      category === "All" ||
      (category === "Equipment" && g.category === "Equipment") ||
      (category === "Smokes" && g.id === "smokes") ||
      (category === "Food & drink" && g.category === "Consumable" && g.id !== "smokes"),
  );
  const selected = SHOP_GOODS.find((g) => g.id === picked) ?? SHOP_GOODS[0]!;
  const block = godMode
    ? null
    : (actionBlockReason(state, selected.action(state)) ??
      (!selected.available(state) ? shopAvailability(selected, state) : null));
  return (
    <div
      role="dialog"
      aria-label={browsing ? "Shop shelves" : "Checkout"}
      className="shop-catalog-panel"
      data-shop-catalog
    >
      <header className="shop-catalog-heading">
        <div>
          <h3>{browsing ? "Browse the shelves" : "Pay at the till"}</h3>
          <p>
            {browsing
              ? "Pick an item, then walk to the checkout. No charge yet."
              : "The shopkeeper: ‘Exact change. Approximate enthusiasm.’"}
          </p>
        </div>
        <button type="button" className="room-close" aria-label="Close panel" onClick={onClose}>
          ✕
        </button>
      </header>
      <div className="shop-catalog-tabs" aria-label="Product categories">
        {(["All", "Food & drink", "Equipment", "Smokes"] as const).map((c) => (
          <button
            type="button"
            key={c}
            aria-pressed={category === c}
            onClick={() => setCategory(c)}
          >
            {c}
          </button>
        ))}
      </div>
      <div className="shop-catalog-list">
        {goods.map((g) => (
          <button
            type="button"
            key={g.id}
            className="shop-product-card"
            aria-label={browsing ? `Take ${g.name} to checkout` : `Select ${g.name}`}
            aria-pressed={!browsing && g.id === selected.id}
            onClick={() => onPick(g.id)}
          >
            <span className="shop-product-icon" aria-hidden="true">
              {g.icon}
            </span>
            <span className="shop-product-copy">
              <span className="shop-product-name">{g.name}</span>
              <span className="shop-product-description">{g.description}</span>
              {!g.repeatable && g.owned(state) > 0 && (
                <span className="shop-product-description">Already owned</span>
              )}
            </span>
            <span className="shop-product-price">${g.price}</span>
          </button>
        ))}
      </div>
      {!browsing && (
        <div className="shop-payment">
          <div>
            <strong>{selected.name}</strong>
            <span>
              ${selected.price} ·{" "}
              {selected.action(state).hours ? `${selected.action(state).hours}h` : "Instant"}
            </span>
          </div>
          <button
            type="button"
            disabled={block !== null}
            onClick={() => onRun(selected.action(state))}
            aria-label={
              block ? `${selected.name}: ${block}` : `Buy ${selected.name} for $${selected.price}`
            }
            className="shop-pay-button"
          >
            {block ?? `Buy · $${selected.price}`}
          </button>
          {shiftActions.map((a) => (
            <button
              type="button"
              key={a.id}
              className="shop-shift-button"
              disabled={actionBlockReason(state, a, godMode) !== null}
              onClick={() => onRun(a)}
            >
              {a.label} · {a.hours}h · {a.energy} energy
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
