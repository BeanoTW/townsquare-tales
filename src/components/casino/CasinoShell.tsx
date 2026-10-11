import { useEffect, type ReactNode } from "react";
import { lifetime, money, signed, type CasinoGame } from "@/lib/casino";
import type { GameState } from "@/lib/game-state";
import "./casino.css";

/** Shared chrome for the casino games: title, balance, lifetime record, rules and leave controls. */
export function CasinoShell({
  game,
  title,
  state,
  status,
  statusGood,
  onLeave,
  onRules,
  rulesLabel,
  dock,
  children,
}: {
  game: CasinoGame;
  title: string;
  state: GameState;
  status: string;
  statusGood?: boolean | undefined;
  onLeave: () => void;
  onRules: () => void;
  rulesLabel: string;
  /** Controls pinned above the footer so they never scroll out of reach. */
  dock?: ReactNode;
  children: ReactNode;
}) {
  const record = lifetime(state, game);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onLeave();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLeave]);

  return (
    <div
      className="cz-root absolute inset-0 z-20 flex flex-col overflow-hidden bg-[#312744] font-hand text-[#fff8e6]"
      data-casino={game}
    >
      <header className="shrink-0 px-3 pb-1 pt-[104px] sm:pt-24">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest text-[#f3bd4b]">Lucky Sevens</div>
            <h2 className="text-2xl font-bold leading-tight">{title}</h2>
          </div>
          <button type="button" className="cz-btn shrink-0" onClick={onRules}>
            {rulesLabel}
          </button>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm">
          <span className="font-bold" data-testid="balance">
            Cash {money(state.money)}
          </span>
          <span className="text-[#e6d8ba]" data-testid="record">
            Lifetime: won {money(record.won)} · lost {money(record.lost)} · net {signed(record.net)}
          </span>
        </div>
      </header>

      <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2">
        {children}
      </main>

      {dock && (
        <div className="shrink-0 border-t-2 border-[#25242a] bg-[#2b2140] px-3 pb-2 pt-2" data-dock>
          <div className="mx-auto max-w-md">{dock}</div>
        </div>
      )}

      <footer className="flex shrink-0 items-center gap-2 bg-[#241c33] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
        <button
          type="button"
          className="cz-btn shrink-0"
          aria-label="Leave table"
          onClick={onLeave}
        >
          ← Leave
        </button>
        <p
          aria-live="polite"
          className={`min-w-0 flex-1 text-sm ${statusGood === false ? "text-[#ff9c8f]" : ""}`}
        >
          {status}
        </p>
      </footer>
    </div>
  );
}

export function RulesSheet({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onClose]);
  return (
    <div className="absolute inset-0 z-40 flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="flex max-h-full w-full max-w-md flex-col rounded-2xl border-2 border-[#25242a] bg-[#fff8e6] p-4 text-[#25242a]"
      >
        <h3 className="shrink-0 text-xl font-bold">{title}</h3>
        <div className="mt-2 min-h-0 flex-1 space-y-2 overflow-y-auto text-sm">{children}</div>
        <button
          type="button"
          className="cz-btn cz-btn-primary mt-3 w-full shrink-0"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  );
}
