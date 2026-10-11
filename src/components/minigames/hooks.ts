import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";

/** True when the player asked their device for less motion. Live: reacts if the setting changes. */
export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq =
      typeof window.matchMedia === "function"
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (!mq) return;
    setReduced(Boolean(mq.matches));
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);
  return reduced;
}

/**
 * Lightweight requestAnimationFrame loop. The callback receives the elapsed milliseconds since the
 * previous frame, capped at 50 so a stalled tab cannot teleport the simulation. Nothing here touches
 * React state, so active gameplay does not re-render per frame.
 */
export function useFrameLoop(callback: (dtMs: number) => void, running: boolean) {
  const cb = useRef(callback);
  cb.current = callback;
  useEffect(() => {
    if (!running) return;
    let id = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.max(0, Math.min(50, now - last));
      last = now;
      cb.current(dt);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [running]);
}

/** Pause when the page is hidden or the app is switched away (phone calls, tab switches). */
export function useAutoPause(onHide: () => void) {
  const ref = useRef(onHide);
  ref.current = onHide;
  useEffect(() => {
    const hide = () => {
      if (document.hidden) ref.current();
    };
    const pagehide = () => ref.current();
    document.addEventListener("visibilitychange", hide);
    window.addEventListener("pagehide", pagehide);
    window.addEventListener("blur", pagehide);
    return () => {
      document.removeEventListener("visibilitychange", hide);
      window.removeEventListener("pagehide", pagehide);
      window.removeEventListener("blur", pagehide);
    };
  }, []);
}

/**
 * Press-and-hold input: pointer (mouse and touch) on an element plus a keyboard key.
 * Spread `bind` on the element that should react to touches. Releases are always delivered,
 * including when the pointer is cancelled or the window loses focus.
 */
export function useHold({
  enabled,
  keys = ["Space"],
  onDown,
  onUp,
  onCancel,
}: {
  enabled: boolean;
  keys?: string[];
  onDown: () => void;
  onUp: () => void;
  onCancel?: () => void;
}) {
  const holding = useRef(false);
  const handlers = useRef({ onDown, onUp, onCancel, enabled });
  handlers.current = { onDown, onUp, onCancel, enabled };

  const down = useCallback(() => {
    if (holding.current || !handlers.current.enabled) return;
    holding.current = true;
    handlers.current.onDown();
  }, []);
  const up = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    handlers.current.onUp();
  }, []);

  const cancel = useCallback(() => {
    if (!holding.current) return;
    holding.current = false;
    (handlers.current.onCancel ?? handlers.current.onUp)();
  }, []);

  useEffect(() => {
    const keyDown = (e: KeyboardEvent) => {
      if (!keys.includes(e.code) || !handlers.current.enabled) return;
      e.preventDefault();
      if (!e.repeat) down();
    };
    const keyUp = (e: KeyboardEvent) => {
      if (!keys.includes(e.code)) return;
      if (holding.current) e.preventDefault();
      up();
    };
    window.addEventListener("keydown", keyDown);
    window.addEventListener("keyup", keyUp);
    window.addEventListener("blur", cancel);
    return () => {
      window.removeEventListener("keydown", keyDown);
      window.removeEventListener("keyup", keyUp);
      window.removeEventListener("blur", cancel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys.join(","), down, up, cancel]);

  // Disabling mid-hold (pause, game over) releases cleanly.
  useEffect(() => {
    if (!enabled) cancel();
  }, [enabled, cancel]);

  const bind = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture?.(e.pointerId);
      down();
    },
    onPointerUp: () => up(),
    onPointerCancel: () => cancel(),
    onLostPointerCapture: () => cancel(),
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };
  return { bind, isHolding: () => holding.current };
}
