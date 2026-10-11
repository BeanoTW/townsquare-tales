import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { OverheadPerson } from "@/components/OverheadPerson";
import { RulesSheet } from "@/components/casino/CasinoShell";
import type { GameState } from "@/lib/game-state";
import { finishRail, hasEquippedBoard, startSession } from "@/lib/minigames";
import {
  GRIND_MS,
  MAX_LEVEL,
  SAFE,
  SCENE,
  clampLevel,
  fallReason,
  jumpWindow,
  levelInfo,
  newRun,
  poseAt,
  pressJump,
  scoreRun,
  stepRun,
  trickName,
  unlockedLevel,
  type RailRun,
} from "@/lib/rail-grind";
import { playActionCue } from "@/lib/action-audio";
import { useAutoPause, useFrameLoop, useReducedMotion } from "./hooks";
import { MinigameShell, PauseOverlay, ResultCard, helpSeen, markHelpSeen } from "./MinigameShell";

type Phase = "menu" | "play" | "result";

const METER = { x: 70, y: 22, w: 260, h: 16 } as const;
const SPARKS = 9;
const DRAG_RANGE = 46; // px of horizontal drag for a full lean

type Props = {
  state: GameState;
  onChange: (next: GameState) => void;
  onExit: () => void;
  /** Injected for tests. */
  rng?: () => number;
  /** Play small synthesized cues (the town's sound setting). */
  sound?: boolean;
};

export function RailGrindGame({ state, onChange, onExit, rng = Math.random, sound = true }: Props) {
  const reduced = useReducedMotion();
  const owned = hasEquippedBoard(state);
  const unlocked = unlockedLevel(state.railLevel);
  const [phase, setPhase] = useState<Phase>("menu");
  const [level, setLevel] = useState(() => unlocked);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState(
    owned ? "Pick a rail to start." : "You need your skateboard equipped.",
  );
  const [good, setGood] = useState<boolean | undefined>(owned ? undefined : false);
  const [callout, setCallout] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [leanUi, setLeanUi] = useState<-1 | 0 | 1>(0);
  const [result, setResult] = useState<{
    headline: string;
    lines: string[];
    best: boolean;
    success: boolean;
  } | null>(null);
  const [hudMs, setHudMs] = useState(0);

  const run = useRef<RailRun>(newRun(1, rng));
  const sessionPaid = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pausedRef = useRef(paused);
  pausedRef.current = paused || help;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const finished = useRef(false);
  const lastPhase = useRef<RailRun["phase"]>("approach");
  const shownSec = useRef(-1);
  const calloutId = useRef(0);
  const clock = useRef(0);

  // Lean input: held buttons / keys, plus an analogue drag. All live in refs so frames never re-render.
  const left = useRef(false);
  const right = useRef(false);
  const drag = useRef<{ id: number; x0: number; v: number } | null>(null);

  const boardEl = useRef<SVGGElement>(null);
  const markerEl = useRef<SVGPathElement>(null);
  const timeEl = useRef<SVGRectElement>(null);
  const glowEl = useRef<SVGRectElement>(null);
  const sparkEls = useRef<(SVGCircleElement | null)[]>([]);
  const shadowEl = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    if (owned && !helpSeen("rail")) setHelp(true);
  }, [owned]);
  useAutoPause(() => {
    if (phaseRef.current === "play") setPaused(true);
  });

  const clearInput = () => {
    left.current = false;
    right.current = false;
    drag.current = null;
    setLeanUi(0);
  };
  useEffect(() => {
    if (paused || help || phase !== "play") clearInput();
  }, [paused, help, phase]);

  const input = () => {
    const d = drag.current ? drag.current.v : 0;
    const k = (right.current ? 1 : 0) - (left.current ? 1 : 0);
    return Math.max(-1, Math.min(1, k + d));
  };
  const syncUi = () => setLeanUi(left.current === right.current ? 0 : left.current ? -1 : 1);

  const say = (text: string, isGood: boolean | undefined) => {
    setStatus(text);
    setGood(isGood);
  };
  const flash = (text: string, isGood: boolean) => {
    calloutId.current += 1;
    setCallout({ text, good: isGood, id: calloutId.current });
  };

  const jump = () => {
    const r = run.current;
    if (phaseRef.current !== "play" || pausedRef.current || r.phase !== "approach") return;
    const res = pressJump(r, rng);
    if (res === "early") {
      say("Too early. Wait for the rail to glow.", false);
      flash("Wait…", false);
    } else if (res === "jumped") {
      flash(
        r.jump === "perfect" ? "Perfect jump!" : r.jump === "good" ? "Good jump" : "Late jump!",
        r.jump !== "late",
      );
      say("You're on! Lean against the drift to stay in the green.", undefined);
    }
  };

  const finishRun = () => {
    if (finished.current) return;
    finished.current = true;
    const r = run.current;
    const success = r.outcome === "clean";
    const out = finishRail(stateRef.current, { level: r.level, success, balancedMs: r.streakMs });
    onChange(out.next);
    const score = scoreRun(r);
    setResult({
      success,
      best: out.newBest,
      headline: success ? `${trickName(r)}!` : "Wiped out",
      lines: [
        success
          ? `Clean four-second grind on the ${levelInfo(r.level).name.toLowerCase()}.`
          : fallReason(r),
        `Score ${score} · longest steady balance ${(r.streakMs / 1000).toFixed(1)}s`,
        ...out.notes,
      ],
    });
    setPhase("result");
    say(success ? "Landed it." : fallReason(r), success);
  };

  const paint = () => {
    const r = run.current;
    const p = poseAt(r);
    boardEl.current?.setAttribute(
      "transform",
      `translate(${p.x.toFixed(1)} ${p.y.toFixed(1)}) rotate(${p.angle.toFixed(1)})`,
    );
    shadowEl.current?.setAttribute("cx", p.x.toFixed(1));
    shadowEl.current?.setAttribute("opacity", p.airborne ? "0.08" : "0.2");
    const inGrind = r.phase === "grind";
    const b = inGrind
      ? Math.max(-1, Math.min(1, r.b))
      : r.phase === "fall" || r.phase === "done"
        ? Math.max(-1, Math.min(1, r.b))
        : 0;
    markerEl.current?.setAttribute(
      "transform",
      `translate(${(METER.x + METER.w / 2 + (b * METER.w) / 2).toFixed(1)} 0)`,
    );
    timeEl.current?.setAttribute(
      "width",
      String(((METER.w * Math.min(GRIND_MS, r.grindMs)) / GRIND_MS).toFixed(1)),
    );
    // The rail glows while the jump window is open.
    const w = jumpWindow(r.level);
    const open = r.phase === "approach" && r.t >= w.open;
    glowEl.current?.setAttribute(
      "opacity",
      open ? (0.55 + 0.35 * Math.sin(clock.current / 70)).toFixed(2) : "0",
    );
    for (let i = 0; i < SPARKS; i++) {
      const el = sparkEls.current[i];
      if (!el) continue;
      if (!p.sparks || reducedRef.current) {
        el.setAttribute("opacity", "0");
        continue;
      }
      const u = (clock.current / 340 + i / SPARKS) % 1;
      const n = Math.sin((i + 1) * 12.9898) * 43758.5453;
      const spread = n - Math.floor(n);
      el.setAttribute("cx", (p.x - 4 - u * 34).toFixed(1));
      el.setAttribute(
        "cy",
        (SCENE.railY - 3 - Math.sin(u * Math.PI) * (6 + spread * 14) + u * u * 14).toFixed(1),
      );
      el.setAttribute("r", (2.4 - u * 1.4).toFixed(1));
      el.setAttribute("opacity", (1 - u).toFixed(2));
    }
  };

  useFrameLoop(
    (dt) => {
      clock.current += dt;
      const r = run.current;
      if (r.phase !== "done") stepRun(r, dt, input());
      if (r.phase !== lastPhase.current) {
        const prev = lastPhase.current;
        lastPhase.current = r.phase;
        if (r.phase === "landing") {
          playActionCue("success", sound);
          flash(`${trickName(r)}!`, true);
          say("Clean landing!", true);
        } else if (r.phase === "fall") {
          playActionCue("failure", sound);
          flash(r.outcome === "missed-jump" ? "Missed it" : "Bail!", false);
          say(fallReason(r), false);
        } else if (prev === "jump" && r.phase === "grind") {
          say("Grinding. Keep the marker in the green.", undefined);
        }
      }
      if (r.phase === "grind") {
        const sec = Math.floor(r.grindMs / 100);
        if (sec !== shownSec.current) {
          shownSec.current = sec;
          setHudMs(r.grindMs);
        }
      }
      paint();
      if (r.phase === "done") finishRun();
    },
    phase === "play" && !paused && !help,
  );

  const start = (lv: number) => {
    if (!owned) return;
    if (!sessionPaid.current) {
      const s = startSession(stateRef.current, "rail");
      if (!s.ok) {
        say(s.message, false);
        return;
      }
      onChange(s.next);
      sessionPaid.current = true;
    }
    const l = Math.min(clampLevel(lv), unlockedLevel(stateRef.current.railLevel));
    setLevel(l);
    run.current = newRun(l, rng);
    finished.current = false;
    lastPhase.current = "approach";
    shownSec.current = -1;
    clock.current = 0;
    clearInput();
    setHudMs(0);
    setCallout(null);
    setResult(null);
    setPaused(false);
    setPhase("play");
    say("Rolling in… tap JUMP when the rail glows.", undefined);
  };

  const leave = () => onExit();
  const closeHelp = () => {
    markHelpSeen("rail");
    setHelp(false);
  };

  // Keyboard: A/D or arrows lean, Space/W/Up jump.
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (phaseRef.current !== "play" || pausedRef.current) return;
      if (e.code === "KeyA" || e.code === "ArrowLeft") {
        e.preventDefault();
        left.current = true;
        syncUi();
      } else if (e.code === "KeyD" || e.code === "ArrowRight") {
        e.preventDefault();
        right.current = true;
        syncUi();
      } else if (e.code === "Space" || e.code === "KeyW" || e.code === "ArrowUp") {
        e.preventDefault();
        if (!e.repeat) jump();
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === "KeyA" || e.code === "ArrowLeft") left.current = false;
      else if (e.code === "KeyD" || e.code === "ArrowRight") right.current = false;
      else return;
      syncUi();
    };
    const blur = () => clearInput();
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", blur);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", blur);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leanBind = (side: "left" | "right") => {
    const ref = side === "left" ? left : right;
    return {
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
        e.preventDefault();
        if (pausedRef.current) return;
        e.currentTarget.setPointerCapture?.(e.pointerId);
        ref.current = true;
        syncUi();
      },
      onPointerUp: () => {
        ref.current = false;
        syncUi();
      },
      onPointerCancel: () => {
        ref.current = false;
        syncUi();
      },
      onLostPointerCapture: () => {
        ref.current = false;
        syncUi();
      },
      onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
    };
  };

  // Touching the scene: tap to jump while rolling in, drag sideways to lean while grinding.
  const stageBind = {
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => {
      e.preventDefault();
      if (run.current.phase === "approach") {
        jump();
        return;
      }
      e.currentTarget.setPointerCapture?.(e.pointerId);
      drag.current = { id: e.pointerId, x0: e.clientX, v: 0 };
    },
    onPointerMove: (e: ReactPointerEvent<HTMLElement>) => {
      const d = drag.current;
      if (!d || d.id !== e.pointerId) return;
      d.v = Math.max(-1, Math.min(1, (e.clientX - d.x0) / DRAG_RANGE));
      // Re-anchor slowly so a long drag never gets stuck at full lean.
      d.x0 += (e.clientX - d.x0) * 0.04;
    },
    onPointerUp: () => {
      drag.current = null;
    },
    onPointerCancel: () => {
      drag.current = null;
    },
    onContextMenu: (e: { preventDefault: () => void }) => e.preventDefault(),
  };

  const info = levelInfo(level);
  const hudView =
    phase === "play" ? (
      <>
        <span>
          {info.name} · L{level}
        </span>
        <span data-testid="hud-time">⏱ {(Math.min(GRIND_MS, hudMs) / 1000).toFixed(1)} / 4.0s</span>
      </>
    ) : null;

  const dock =
    phase === "play" ? (
      <div className="grid grid-cols-[1fr_1.2fr_1fr] gap-2" data-testid="rail-controls">
        <button
          type="button"
          className={`mg-hold ${leanUi === -1 ? "is-down" : ""}`}
          aria-label="Lean left"
          {...leanBind("left")}
        >
          ◀ LEFT
        </button>
        <button
          type="button"
          className="mg-hold"
          style={{ background: "#9be3a4" }}
          aria-label="Jump"
          onPointerDown={(e) => {
            e.preventDefault();
            jump();
          }}
          onKeyDown={(e) => e.preventDefault()}
        >
          JUMP
        </button>
        <button
          type="button"
          className={`mg-hold ${leanUi === 1 ? "is-down" : ""}`}
          aria-label="Lean right"
          {...leanBind("right")}
        >
          RIGHT ▶
        </button>
      </div>
    ) : phase === "menu" && owned ? (
      <button type="button" className="mg-btn mg-btn-primary w-full" onClick={() => start(level)}>
        Start · {levelInfo(level).name}
      </button>
    ) : null;

  const rider = (
    <g ref={boardEl} data-testid="skater" data-skater-pose>
      {/* Same approved parts as the town sprite: grey deck, circular-head rider. No legs. Everything here rotates together. */}
      <rect
        data-skateboard="deck"
        x="-21"
        y="-5"
        width="42"
        height="10"
        rx="5"
        fill="#89949c"
        stroke="#30343c"
        strokeWidth="1.8"
      />
      <circle cx="-13" cy="7" r="3.2" fill="#30343c" />
      <circle cx="13" cy="7" r="3.2" fill="#30343c" />
      <g transform="translate(0 -9) scale(1.25)">
        <OverheadPerson head="#f0d5b7" outline="#222530" phase={0} moving={false} angle={0} />
      </g>
    </g>
  );

  return (
    <MinigameShell
      kicker="Skate park"
      title="Rail grind"
      background="#d7e9c9"
      hud={hudView}
      status={status}
      statusGood={good}
      paused={phase === "play" ? paused : undefined}
      onTogglePause={phase === "play" && !help ? () => setPaused((p) => !p) : undefined}
      helpOpen={help}
      onHelp={() => setHelp(true)}
      onLeave={leave}
      dock={dock}
    >
      {phase === "menu" && !owned && (
        <div
          className="mg-card mx-auto flex h-full max-w-md flex-col justify-center gap-3 text-center"
          data-testid="board-required"
        >
          <p className="text-2xl font-extrabold">Skateboard required</p>
          <p className="text-sm">
            {state.skateboard
              ? "You own a skateboard but it isn't equipped. Equip it from your inventory (the backpack button), then come back."
              : "You don't own a skateboard yet. Get one (the park kid knows where boards come from), equip it, then come back."}
          </p>
          <button type="button" className="mg-btn mg-btn-primary" onClick={leave}>
            OK
          </button>
        </div>
      )}

      {phase === "menu" && owned && (
        <div className="mg-card mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto">
          <p className="text-sm font-bold">Choose a rail. Clear one to unlock the next.</p>
          <div role="radiogroup" aria-label="Rail" className="grid gap-2">
            {Array.from({ length: MAX_LEVEL }, (_, i) => i + 1).map((l) => {
              const locked = l > unlocked;
              const li = levelInfo(l);
              return (
                <button
                  key={l}
                  type="button"
                  role="radio"
                  aria-checked={level === l}
                  disabled={locked}
                  className={`mg-btn text-left ${level === l ? "mg-btn-primary" : ""}`}
                  onClick={() => setLevel(l)}
                >
                  <span className="block">
                    {locked ? "🔒 " : ""}Level {l} · {li.name}
                  </span>
                  <span className="block text-xs font-normal">
                    {locked ? "Clear the previous rail first." : `Trick: ${li.trick}`}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-sm" data-testid="records">
            Grinds: {state.railGrinds} · Falls: {state.railFalls} · Longest steady balance:{" "}
            {(state.railLongest / 1000).toFixed(1)}s · Best level: {state.railLevel}
          </p>
          <p className="text-xs opacity-80">
            Costs 15 minutes and 6 energy once per visit. Charm +1 once a day for a clean grind.
          </p>
        </div>
      )}

      {phase === "result" && result && (
        <div className="flex h-full items-center">
          <ResultCard
            title={result.success ? "Grind complete" : "Round over"}
            headline={result.headline}
            lines={result.lines}
            best={result.best}
            actions={
              <>
                <button
                  type="button"
                  className="mg-btn mg-btn-primary"
                  onClick={() => start(result.success ? Math.min(MAX_LEVEL, level + 1) : level)}
                >
                  {result.success &&
                  level < MAX_LEVEL &&
                  level + 1 <= unlockedLevel(state.railLevel)
                    ? "Next rail"
                    : "Try again"}
                </button>
                <button type="button" className="mg-btn" onClick={() => setPhase("menu")}>
                  Pick a rail
                </button>
                <button type="button" className="mg-btn" onClick={leave}>
                  Leave park
                </button>
              </>
            }
          />
        </div>
      )}

      {phase === "play" && (
        <div
          className="mg-play-area relative flex h-full items-center justify-center"
          {...stageBind}
        >
          <svg
            viewBox={`0 0 ${SCENE.w} ${SCENE.h}`}
            className="max-h-full w-full max-w-[560px] rounded-xl border-2 border-[#25242a]"
            role="img"
            aria-label="Skate rail side view. Tap jump when the rail glows, then lean left and right to keep the balance marker in the green."
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width={SCENE.w} height={SCENE.h} fill="#bfe0ee" />
            <path
              d="M0 215 L50 170 L100 210 L160 160 L230 215 L290 172 L350 212 L400 185 V250 H0Z"
              fill="#9cc7b5"
            />
            <rect y={SCENE.ground} width={SCENE.w} height={SCENE.h - SCENE.ground} fill="#b9b3a6" />
            <path d={`M0 ${SCENE.ground}H${SCENE.w}`} stroke="#25242a" strokeWidth="3" />
            <path
              d={`M16 ${SCENE.ground + 22}H${SCENE.w - 16}`}
              stroke="#f6e4c3"
              strokeWidth="3"
              strokeDasharray="14 10"
            />

            {/* the rail: top bar and two posts */}
            <rect
              ref={glowEl}
              x={SCENE.railX0 - 10}
              y={SCENE.railY - 18}
              width={SCENE.railX1 - SCENE.railX0 + 20}
              height="26"
              rx="8"
              fill="#ffe97a"
              opacity="0"
            />
            <path
              d={`M${SCENE.railX0 + 14} ${SCENE.railY}V${SCENE.ground}M${SCENE.railX1 - 14} ${SCENE.railY}V${SCENE.ground}`}
              stroke="#25242a"
              strokeWidth="5"
            />
            <path
              d={`M${SCENE.railX0} ${SCENE.railY}H${SCENE.railX1}`}
              stroke="#25242a"
              strokeWidth="7"
              strokeLinecap="round"
            />
            <path
              d={`M${SCENE.railX0} ${SCENE.railY - 1}H${SCENE.railX1}`}
              stroke="#c8ccd0"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <ellipse
              ref={shadowEl}
              cx={SCENE.startX}
              cy={SCENE.ground + 3}
              rx="22"
              ry="4"
              fill="#25242a"
              opacity="0.2"
            />

            {rider}
            {Array.from({ length: SPARKS }, (_, i) => (
              <circle
                key={i}
                ref={(el) => {
                  sparkEls.current[i] = el;
                }}
                r="2"
                fill="#ffb02e"
                opacity="0"
              />
            ))}

            {/* balance meter: green safe zone in the middle, red danger at the edges */}
            <rect
              x={METER.x}
              y={METER.y}
              width={METER.w}
              height={METER.h}
              rx="8"
              fill="#f2b3a6"
              stroke="#25242a"
              strokeWidth="2.5"
            />
            <rect
              x={METER.x + (METER.w / 2) * (1 - SAFE)}
              y={METER.y}
              width={METER.w * SAFE}
              height={METER.h}
              fill="#7bd389"
              stroke="#25242a"
              strokeWidth="1.5"
              data-testid="safe-zone"
            />
            <path
              d={`M${METER.x + METER.w / 2} ${METER.y - 3}v${METER.h + 6}`}
              stroke="#25242a"
              strokeWidth="1"
              opacity="0.4"
            />
            <path
              ref={markerEl}
              d={`M0 ${METER.y + METER.h + 3}l-8 11h16z`}
              fill="#25242a"
              data-testid="marker"
              transform={`translate(${METER.x + METER.w / 2} 0)`}
            />
            <rect
              x={METER.x}
              y={METER.y + METER.h + 18}
              width={METER.w}
              height="6"
              rx="3"
              fill="#fffdf5"
              stroke="#25242a"
              strokeWidth="1.5"
            />
            <rect
              ref={timeEl}
              x={METER.x}
              y={METER.y + METER.h + 18}
              width="0"
              height="6"
              rx="3"
              fill="#e08b2c"
            />
          </svg>
          {callout && (
            <div
              key={callout.id}
              className={`mg-pop pointer-events-none absolute left-1/2 top-[34%] -translate-x-1/2 rounded-xl border-2 border-[#25242a] px-4 py-1 text-xl font-extrabold ${callout.good ? "bg-[#9be3a4]" : "bg-[#f5b3a6]"}`}
              data-testid="callout"
            >
              {callout.text}
            </div>
          )}
          {paused && <PauseOverlay onResume={() => setPaused(false)} onLeave={leave} />}
        </div>
      )}

      {help && (
        <RulesSheet title="How to grind" onClose={closeHelp}>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              You roll in automatically. <b>Tap JUMP</b> (or Space, or tap the scene) once the rail
              glows yellow. Too early is ignored.
            </li>
            <li>
              On the rail the marker drifts and wobbles. <b>Hold LEFT / RIGHT</b> (or A / D, or drag
              sideways) to lean it back into the green.
            </li>
            <li>
              Over-correcting sends it the other way, so use short, steady leans. It gets twitchier
              as the grind goes on.
            </li>
            <li>
              Stay up for four seconds to land the trick. Leave the green for too long, or hit the
              edge, and you bail.
            </li>
            <li>
              Clear a rail to unlock a harder one. A clean grind gives Charm +1, once a day. You
              need an equipped skateboard.
            </li>
          </ul>
        </RulesSheet>
      )}
    </MinigameShell>
  );
}
