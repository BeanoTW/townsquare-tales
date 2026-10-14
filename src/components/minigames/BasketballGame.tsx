import { useEffect, useRef, useState } from "react";
import {
  BALL_R,
  COURT,
  FIVE_SHOTS,
  LEVELS,
  RIM_HALF,
  TIMED_SECONDS,
  ballPath,
  evaluatePhysicalShot,
  hoopX,
  idealPower,
  landingX,
  powerAt,
  type Difficulty,
  type Pt,
  type Shot,
} from "@/lib/basketball";
import { RulesSheet } from "@/components/casino/CasinoShell";
import type { GameState } from "@/lib/game-state";
import { accuracy, finishBasketball, startSession, type BasketballMode } from "@/lib/minigames";
import { playActionCue } from "@/lib/action-audio";
import { useAutoPause, useFrameLoop, useHold } from "./hooks";
import { MinigameShell, PauseOverlay, ResultCard, helpSeen, markHelpSeen } from "./MinigameShell";

type Phase = "menu" | "play" | "result";
const MODES: { id: BasketballMode; label: string; desc: string }[] = [
  { id: "practice", label: "Practice", desc: "Unlimited shots. No records or rewards." },
  { id: "five", label: "Five shots", desc: "Score as many baskets as you can from five." },
  { id: "timed", label: "30 seconds", desc: "As many baskets as you can before time runs out." },
];
const LEVEL_LABEL: Record<Difficulty, string> = { easy: "Easy", normal: "Normal", hard: "Hard" };

type Flight = { shot: Shot; path: Pt[]; t: number; netDone: boolean };
type Run = {
  clock: number;
  charging: boolean;
  chargeStart: number;
  flight: Flight | null;
  cooldown: number;
  made: number;
  shots: number;
  timeLeft: number;
  shownSecond: number;
  over: boolean;
  netUntil: number;
};
const freshRun = (): Run => ({
  clock: 0,
  charging: false,
  chargeStart: 0,
  flight: null,
  cooldown: 0,
  made: 0,
  shots: 0,
  timeLeft: TIMED_SECONDS * 1000,
  shownSecond: TIMED_SECONDS,
  over: false,
  netUntil: 0,
});

const METER = { x: 14, y: 52, w: 18, h: 196 };
const HAND = { x: 84, y: 212 };

export function BasketballGame({
  state,
  onChange,
  onExit,
  sound = true,
}: {
  state: GameState;
  onChange: (next: GameState) => void;
  onExit: () => void;
  /** Play small synthesized cues (the town's sound setting). */
  sound?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("menu");
  const [mode, setMode] = useState<BasketballMode>("five");
  const [level, setLevel] = useState<Difficulty>("normal");
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("Pick a mode to start.");
  const [good, setGood] = useState<boolean | undefined>(undefined);
  const [hud, setHud] = useState({ made: 0, shots: 0, left: TIMED_SECONDS });
  const [callout, setCallout] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [result, setResult] = useState<{ headline: string; lines: string[]; best: boolean } | null>(
    null,
  );

  const run = useRef<Run>(freshRun());
  const sessionPaid = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pausedRef = useRef(paused);
  pausedRef.current = paused || help;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const levelRef = useRef(level);
  levelRef.current = level;
  const finished = useRef(false);

  const hoopEl = useRef<SVGGElement>(null);
  const netEl = useRef<SVGGElement>(null);
  const ballEl = useRef<SVGCircleElement>(null);
  const armsEl = useRef<SVGGElement>(null);
  const fillEl = useRef<SVGRectElement>(null);
  const guideEl = useRef<SVGRectElement>(null);
  const markerEl = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (!helpSeen("basketball")) setHelp(true);
  }, []);
  useAutoPause(() => {
    if (phaseRef.current === "play") setPaused(true);
  });

  const meterY = (p: number) => METER.y + METER.h * (1 - p);
  const slope = (() => {
    const a = landingX(0.55)!;
    const b = landingX(0.65)!;
    return (b - a) / 0.1;
  })();

  const paint = () => {
    const r = run.current;
    const l = levelRef.current;
    const hx = hoopX(r.clock, l);
    hoopEl.current?.setAttribute("transform", `translate(${(hx - 296).toFixed(2)} 0)`);
    const netScale = r.netUntil > r.clock ? 1.35 : 1;
    netEl.current?.setAttribute(
      "transform",
      `translate(${hx.toFixed(2)} ${COURT.rimY + 4}) scale(1 ${netScale}) translate(${(-hx).toFixed(2)} ${-(COURT.rimY + 4)})`,
    );
    const power = r.charging ? powerAt(r.clock - r.chargeStart) : 0;
    fillEl.current?.setAttribute("y", String(meterY(power)));
    fillEl.current?.setAttribute("height", String(METER.h * power));
    // Arms rise with the charge so the shooter visibly winds up.
    armsEl.current?.setAttribute("transform", `rotate(${-30 - power * 80} 70 176)`);
    if (LEVELS[l].showGuide && !r.flight) {
      const ideal = idealPower(r.clock, l);
      const half = LEVELS[l].made / slope;
      const top = meterY(Math.min(1, ideal + half));
      const bottom = meterY(Math.max(0, ideal - half));
      guideEl.current?.setAttribute("y", String(top));
      guideEl.current?.setAttribute("height", String(Math.max(3, bottom - top)));
    } else guideEl.current?.setAttribute("height", "0");
    markerEl.current?.setAttribute("transform", `translate(0 ${meterY(power)})`);
    const ball = ballEl.current;
    if (!ball) return;
    if (r.flight) {
      const i = Math.min(r.flight.path.length - 1, Math.floor(r.flight.t / (1000 / 60)));
      const p = r.flight.path[i]!;
      ball.setAttribute("cx", p.x.toFixed(1));
      ball.setAttribute("cy", p.y.toFixed(1));
    } else {
      // In the shooter's hands: lifts a little as power builds.
      ball.setAttribute("cx", String(HAND.x - 6));
      ball.setAttribute("cy", String(HAND.y - 22 - power * 26));
    }
  };

  const finishRun = (completed: boolean) => {
    if (finished.current) return;
    finished.current = true;
    const r = run.current;
    r.over = true;
    const out = finishBasketball(stateRef.current, modeRef.current, r.made, r.shots, completed);
    onChange(out.next);
    if (completed) {
      const acc = accuracy(r.made, r.shots);
      setResult({
        headline: modeRef.current === "five" ? `${r.made} / ${FIVE_SHOTS}` : `${r.made} baskets`,
        lines: [`${r.made} of ${r.shots} shots (${acc}%)`, ...out.notes],
        best: out.newBest,
      });
      setPhase("result");
      setStatus(out.newBest ? "New personal best!" : "Round over.");
    }
  };

  const resolveFlight = () => {
    const r = run.current;
    const f = r.flight;
    if (!f) return;
    r.flight = null;
    r.cooldown = 450;
    if (f.shot.made) r.made++;
    playActionCue(f.shot.made ? "success" : "failure", sound);
    setHud((h) => ({ ...h, made: r.made, shots: r.shots }));
    setStatus(f.shot.reason);
    setGood(f.shot.made);
    setCallout({
      text:
        f.shot.result === "swish"
          ? "SWISH!"
          : f.shot.made
            ? "In!"
            : f.shot.result === "airball"
              ? "Airball"
              : "Miss",
      good: f.shot.made,
      id: r.shots,
    });
    if (modeRef.current === "five" && r.shots >= FIVE_SHOTS) finishRun(true);
  };

  useFrameLoop(
    (dt) => {
      const r = run.current;
      r.clock += dt;
      if (r.cooldown > 0) r.cooldown -= dt;
      if (modeRef.current === "timed" && !r.over) {
        r.timeLeft = Math.max(0, r.timeLeft - dt);
        const sec = Math.ceil(r.timeLeft / 1000);
        if (sec !== r.shownSecond) {
          r.shownSecond = sec;
          setHud((h) => ({ ...h, left: sec }));
        }
        if (r.timeLeft <= 0 && r.charging) r.charging = false; // time's up: an unreleased shot does not count
      }
      if (r.flight) {
        r.flight.t += dt;
        const i = Math.floor(r.flight.t / (1000 / 60));
        if (r.flight.shot.made && !r.flight.netDone) {
          const p = r.flight.path[Math.min(i, r.flight.path.length - 1)]!;
          if (p.y > COURT.rimY && i > 20) {
            r.flight.netDone = true;
            r.netUntil = r.clock + 260;
          }
        }
        if (i >= r.flight.path.length) resolveFlight();
      }
      paint();
      if (modeRef.current === "timed" && r.timeLeft <= 0 && !r.flight && !r.over) finishRun(true);
    },
    phase === "play" && !paused && !help,
  );

  const onDown = () => {
    const r = run.current;
    if (r.over || r.flight || r.cooldown > 0 || phaseRef.current !== "play" || pausedRef.current)
      return;
    if (modeRef.current === "timed" && r.timeLeft <= 0) return;
    r.charging = true;
    r.chargeStart = r.clock;
    setCallout(null);
  };
  const onUp = () => {
    const r = run.current;
    if (!r.charging) return;
    r.charging = false;
    if (pausedRef.current || phaseRef.current !== "play" || r.over || r.flight) return; // a paused hold is cancelled, not fired
    const power = powerAt(r.clock - r.chargeStart);
    const shot = evaluatePhysicalShot(power, r.clock, levelRef.current);
    r.flight = { shot, path: ballPath(shot), t: 0, netDone: false };
    r.shots++;
    setHud((h) => ({ ...h, shots: r.shots }));
    setStatus("Ball's in the air...");
    setGood(undefined);
  };
  const { bind } = useHold({
    enabled: phase === "play" && !paused && !help,
    onDown,
    onUp,
    onCancel: () => {
      run.current.charging = false;
    },
  });

  const start = (m: BasketballMode) => {
    if (!sessionPaid.current) {
      const s = startSession(stateRef.current, "basketball");
      if (!s.ok) {
        setStatus(s.message);
        setGood(false);
        return;
      }
      onChange(s.next);
      sessionPaid.current = true;
    }
    run.current = freshRun();
    finished.current = false;
    setMode(m);
    modeRef.current = m;
    setHud({ made: 0, shots: 0, left: TIMED_SECONDS });
    setCallout(null);
    setResult(null);
    setPaused(false);
    setPhase("play");
    setGood(undefined);
    setStatus(
      m === "practice"
        ? "Hold, then release to shoot. Practice is unlimited."
        : "Hold, then release to shoot.",
    );
  };

  const leave = () => {
    if (phaseRef.current === "play" && run.current.shots > 0) finishRun(false);
    onExit();
  };
  const closeHelp = () => {
    markHelpSeen("basketball");
    setHelp(false);
  };
  const endPractice = () => {
    const r = run.current;
    if (r.flight) return;
    finishRun(true);
    // Practice has no result screen worth showing beyond the summary.
  };

  const guide = LEVELS[level].showGuide;
  const hudView =
    phase === "play" ? (
      <>
        <span>{MODES.find((m) => m.id === mode)?.label}</span>
        <span data-testid="hud-score">
          Baskets {hud.made}/{hud.shots}
          {mode === "five" ? ` · ${Math.max(0, FIVE_SHOTS - hud.shots)} left` : ""}
        </span>
        {mode === "timed" && <span data-testid="hud-time">⏱ {hud.left}s</span>}
      </>
    ) : null;

  const dock =
    phase === "play" ? (
      <div className="space-y-2">
        <button
          type="button"
          className="mg-hold"
          aria-label="Hold to charge, release to shoot"
          {...bind}
        >
          HOLD TO SHOOT
        </button>
        {mode === "practice" && (
          <button type="button" className="mg-btn w-full" onClick={endPractice}>
            Finish practice
          </button>
        )}
      </div>
    ) : phase === "menu" ? (
      <button type="button" className="mg-btn mg-btn-primary w-full" onClick={() => start(mode)}>
        Start · {MODES.find((m) => m.id === mode)?.label}
      </button>
    ) : null;

  return (
    <MinigameShell
      kicker="Park court"
      title="Basketball"
      background="#bfe0ee"
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
      {phase === "menu" && (
        <div className="mg-card mx-auto flex h-full max-w-md flex-col gap-3 overflow-y-auto">
          <div role="radiogroup" aria-label="Mode" className="grid gap-2">
            {MODES.map((m) => (
              <button
                key={m.id}
                type="button"
                role="radio"
                aria-checked={mode === m.id}
                className={`mg-btn text-left ${mode === m.id ? "mg-btn-primary" : ""}`}
                onClick={() => setMode(m.id)}
              >
                <span className="block">{m.label}</span>
                <span className="block text-xs font-normal">{m.desc}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Difficulty">
            <span className="text-sm font-bold">Difficulty</span>
            {(["easy", "normal", "hard"] as const).map((d) => (
              <button
                key={d}
                type="button"
                className="mg-chip"
                aria-pressed={level === d}
                onClick={() => setLevel(d)}
              >
                {LEVEL_LABEL[d]}
              </button>
            ))}
          </div>
          <p className="text-sm" data-testid="records">
            Best five-shot: {state.bbBest5}/{FIVE_SHOTS} · Best 30s: {state.bbBestTimed} · Lifetime:{" "}
            {state.bbMade}/{state.bbShots} ({accuracy(state.bbMade, state.bbShots)}%)
          </p>
          <p className="text-xs opacity-80">
            Costs 30 minutes and 8 energy once per visit. Strength +1 once a day for a scoring
            round.
          </p>
        </div>
      )}

      {phase === "result" && result && (
        <div className="flex h-full items-center">
          <ResultCard
            title="Round over"
            headline={result.headline}
            lines={result.lines}
            best={result.best}
            actions={
              <>
                <button type="button" className="mg-btn mg-btn-primary" onClick={() => start(mode)}>
                  Play again
                </button>
                <button type="button" className="mg-btn" onClick={() => setPhase("menu")}>
                  Change mode
                </button>
                <button type="button" className="mg-btn" onClick={leave}>
                  Leave court
                </button>
              </>
            }
          />
        </div>
      )}

      {phase === "play" && (
        <div className="mg-play-area relative flex h-full items-center justify-center" {...bind}>
          <svg
            viewBox={`0 0 ${COURT.w} ${COURT.h}`}
            className="max-h-full w-full max-w-[560px] rounded-xl border-2 border-[#25242a]"
            role="img"
            aria-label="Basketball court. Hold to charge the power meter, release to shoot at the moving hoop."
            preserveAspectRatio="xMidYMid meet"
          >
            <rect width={COURT.w} height={COURT.h} fill="#bfe0ee" />
            <path
              d="M0 210 L40 170 L80 205 L130 150 L190 210 L240 165 L300 215 L350 175 L400 205 V268 H0Z"
              fill="#9cc7b5"
            />
            <rect y={COURT.floorY} width={COURT.w} height={COURT.h - COURT.floorY} fill="#c98a4b" />
            <path d={`M0 ${COURT.floorY}H${COURT.w}`} stroke="#25242a" strokeWidth="3" />
            <path
              d={`M20 ${COURT.floorY + 16}H${COURT.w - 20}`}
              stroke="#f6e4c3"
              strokeWidth="3"
              strokeDasharray="14 10"
            />

            <g data-testid="hoop" ref={hoopEl}>
              <path d={`M333 ${COURT.rimY + 6}V${COURT.floorY}`} stroke="#25242a" strokeWidth="6" />
              <circle cx="333" cy={COURT.floorY - 2} r="5" fill="#25242a" />
              <rect
                x={296 + RIM_HALF + 12}
                y={COURT.rimY - 52}
                width="6"
                height="58"
                rx="2"
                fill="#fffdf5"
                stroke="#25242a"
                strokeWidth="2.5"
              />
              <path
                d={`M${296 + RIM_HALF} ${COURT.rimY}H${296 + RIM_HALF + 12}`}
                stroke="#25242a"
                strokeWidth="3"
              />
            </g>
            <g ref={netEl} data-testid="net">
              <path
                d={`M${296 - RIM_HALF} ${COURT.rimY}L${296 - 13} ${COURT.rimY + 24}M${296 - 7} ${COURT.rimY + 3}L${296 - 4} ${COURT.rimY + 26}M${296 + 7} ${COURT.rimY + 3}L${296 + 4} ${COURT.rimY + 26}M${296 + RIM_HALF} ${COURT.rimY}L${296 + 13} ${COURT.rimY + 24}M${296 - 17} ${COURT.rimY + 12}H${296 + 17}`}
                stroke="#fffdf5"
                strokeWidth="2"
                fill="none"
              />
              <ellipse
                cx="296"
                cy={COURT.rimY}
                rx={RIM_HALF}
                ry="4.5"
                fill="none"
                stroke="#d2542a"
                strokeWidth="4"
              />
            </g>

            {/* shooter: circular head, fixed standing legs, arms that rise with the charge */}
            <g stroke="#25242a" strokeWidth="4" strokeLinecap="round" fill="none">
              <circle cx="70" cy="150" r="12" fill="#f1d6ae" />
              <path d="M70 162V204M70 204L58 252M70 204L84 252" />
              <g ref={armsEl} transform="rotate(-30 70 176)">
                <path d="M70 176L98 190" />
              </g>
            </g>
            <ellipse cx="70" cy={COURT.floorY} rx="26" ry="5" fill="#25242a" opacity="0.15" />

            {/* power meter */}
            <rect
              x={METER.x}
              y={METER.y}
              width={METER.w}
              height={METER.h}
              rx="6"
              fill="#fffdf5"
              stroke="#25242a"
              strokeWidth="2.5"
            />
            <rect
              ref={guideEl}
              x={METER.x + 1}
              width={METER.w - 2}
              y={METER.y}
              height="0"
              fill="#7bd389"
              opacity="0.85"
            />
            <rect
              ref={fillEl}
              x={METER.x + 3}
              width={METER.w - 6}
              y={METER.y + METER.h}
              height="0"
              rx="3"
              fill="#e08b2c"
            />
            <path ref={markerEl} d={`M${METER.x + METER.w + 2} 0l9 -5v10z`} fill="#25242a" />
            <text
              x={METER.x + METER.w / 2}
              y={METER.y - 8}
              textAnchor="middle"
              fontSize="11"
              fontWeight="700"
              fill="#25242a"
            >
              POWER
            </text>

            <circle
              ref={ballEl}
              cx={HAND.x - 6}
              cy={HAND.y - 22}
              r={BALL_R}
              fill="#e0732a"
              stroke="#25242a"
              strokeWidth="2.5"
            />
          </svg>
          {callout && (
            <div
              key={callout.id}
              className={`mg-pop pointer-events-none absolute left-1/2 top-3 -translate-x-1/2 rounded-xl border-2 border-[#25242a] px-4 py-1 text-xl font-extrabold ${callout.good ? "bg-[#9be3a4]" : "bg-[#f5b3a6]"}`}
              data-testid="callout"
            >
              {callout.text}
            </div>
          )}
          {!guide && (
            <p className="pointer-events-none absolute bottom-2 left-3 text-xs font-bold opacity-80">
              Hard: no aiming guide
            </p>
          )}
          {paused && <PauseOverlay onResume={() => setPaused(false)} onLeave={leave} />}
        </div>
      )}

      {help && (
        <RulesSheet title="How to play basketball" onClose={closeHelp}>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The hoop slides left and right. You can't move, so you aim with power and timing.
            </li>
            <li>
              <b>Press and hold</b> (touch the court or the big button, or hold Space) to charge.
              The power bar sweeps up and down.
            </li>
            <li>
              <b>Release</b> to shoot. Release when the orange bar reaches the green zone, which
              follows the hoop.
            </li>
            <li>
              The message under the court tells you why a shot missed: short means more power, long
              means less.
            </li>
            <li>Five shots or 30 seconds. Practice is unlimited but never counts for records.</li>
            <li>
              Scoring a challenge round gives Strength +1, once a day. Pausing stops the clock.
            </li>
          </ul>
        </RulesSheet>
      )}
    </MinigameShell>
  );
}
