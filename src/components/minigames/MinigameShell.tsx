import { useEffect, useRef, type ReactNode } from "react";
import "./minigames.css";

/**
 * Shared chrome for every arcade minigame: title and live HUD, obvious Pause / Help / Leave
 * controls, a pinned control dock that can never scroll out of reach, a status line, and the
 * same Escape behaviour everywhere. The play area itself is supplied by each game.
 */
export function MinigameShell({
  helpOpen = false,
  kicker,
  title,
  background,
  hud,
  status,
  statusGood,
  paused,
  onTogglePause,
  onHelp,
  onLeave,
  dock,
  children,
}: {
  helpOpen?: boolean;
  kicker: string;
  title: string;
  /** CSS colour behind the play area. */
  background: string;
  hud?: ReactNode;
  status: string;
  statusGood?: boolean | undefined;
  /** Omit to hide the pause button (menus and results). */
  paused?: boolean | undefined;
  onTogglePause?: (() => void) | undefined;
  onHelp: () => void;
  onLeave: () => void;
  dock?: ReactNode;
  children: ReactNode;
}) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Tab") {
        const scope = helpOpen ? root.current?.querySelector('[role="dialog"]') : root.current;
        const targets = scope
          ? Array.from(
              scope.querySelectorAll<HTMLElement>(
                'button:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex="0"]',
              ),
            )
          : [];
        const first = targets[0],
          last = targets.at(-1);
        if (
          first &&
          last &&
          (!scope?.contains(document.activeElement) ||
            (e.shiftKey ? document.activeElement === first : document.activeElement === last))
        ) {
          e.preventDefault();
          (e.shiftKey ? last : first).focus();
        }
      } else if (e.key === "Escape") onLeave();
      else if ((e.key === "p" || e.key === "P") && onTogglePause) onTogglePause();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onLeave, onTogglePause, helpOpen]);
  useEffect(() => {
    const target = helpOpen
      ? root.current?.querySelector('[role="dialog"]')?.querySelector<HTMLElement>("button")
      : root.current;
    target?.focus();
  }, [helpOpen]);

  return (
    <div
      ref={root}
      tabIndex={-1}
      role="dialog"
      aria-label={title}
      className="mg-root absolute inset-0 z-20 flex flex-col overflow-hidden font-hand text-[#25242a]"
      style={{ background }}
      data-minigame={kicker}
    >
      <header className="shrink-0 px-3 pb-1 pt-[104px] sm:pt-24">
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-widest opacity-70">{kicker}</div>
            <h2 className="text-2xl font-bold leading-tight">{title}</h2>
          </div>
          <div className="flex shrink-0 gap-2">
            {onTogglePause && (
              <button
                type="button"
                className="mg-btn"
                aria-label={paused ? "Resume" : "Pause"}
                aria-pressed={Boolean(paused)}
                onClick={onTogglePause}
              >
                {paused ? "▶" : "⏸"}
              </button>
            )}
            <button type="button" className="mg-btn" aria-label="How to play" onClick={onHelp}>
              ?
            </button>
          </div>
        </div>
        {hud && (
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-sm font-bold">
            {hud}
          </div>
        )}
      </header>

      <main className="relative min-h-0 flex-1 overflow-hidden px-3 pb-2">{children}</main>

      {dock && (
        <div
          className="shrink-0 border-t-2 border-[#25242a] bg-[#f4ead0]/95 px-3 pb-2 pt-2"
          data-dock
        >
          <div className="mx-auto max-w-md">{dock}</div>
        </div>
      )}

      <footer className="flex shrink-0 items-center gap-2 bg-[#25242a] px-3 py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] text-[#fff8e6]">
        <button type="button" className="mg-btn shrink-0" aria-label="Leave" onClick={onLeave}>
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

/** Pause screen drawn over the play area. The game clock is stopped while it is visible. */
export function PauseOverlay({ onResume, onLeave }: { onResume: () => void; onLeave: () => void }) {
  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-black/55 p-4"
      role="dialog"
      aria-label="Paused"
    >
      <div className="mg-card mg-pop w-full max-w-xs text-center">
        <p className="text-xl font-bold">Paused</p>
        <p className="mt-1 text-sm">The clock is stopped. Take your time.</p>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <button type="button" className="mg-btn" onClick={onLeave}>
            Leave
          </button>
          <button type="button" className="mg-btn mg-btn-primary" onClick={onResume}>
            Resume
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResultCard({
  title,
  headline,
  lines,
  best,
  actions,
}: {
  title: string;
  headline: string;
  lines: string[];
  best?: boolean | undefined;
  actions: ReactNode;
}) {
  return (
    <div
      className="mg-card mg-pop mx-auto w-full max-w-sm text-center"
      role="status"
      data-testid="result"
    >
      <p className="text-sm uppercase tracking-widest opacity-70">{title}</p>
      <p className="text-3xl font-extrabold">{headline}</p>
      {best && <p className="font-bold text-[#b3532a]">New personal best!</p>}
      <ul className="mt-2 space-y-0.5 text-sm">
        {lines.map((l) => (
          <li key={l}>{l}</li>
        ))}
      </ul>
      <div className="mt-3 grid gap-2">{actions}</div>
    </div>
  );
}

const HELP_PREFIX = "tst-minigame-help-";
export const helpSeen = (id: string) => {
  try {
    return window.localStorage.getItem(HELP_PREFIX + id) === "1";
  } catch {
    return true;
  }
};
export const markHelpSeen = (id: string) => {
  try {
    window.localStorage.setItem(HELP_PREFIX + id, "1");
  } catch {
    /* storage can be unavailable; help still opens from the ? button */
  }
};
