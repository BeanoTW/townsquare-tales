import { memo, useEffect, useRef, useState } from "react";
import { RulesSheet } from "@/components/casino/CasinoShell";
import {
  BOARD_R,
  DARTS_PER_TURN,
  LEVELS,
  ONE_EIGHTY,
  RADII,
  SEGMENTS,
  START_301,
  applyDart,
  banterFor,
  gusMatchLine,
  gusThreeDarts,
  gusVisit,
  newAimer,
  press,
  release,
  reticle,
  sigmaNow,
  steadiness,
  stepAimer,
  threeDartScore,
  type Aimer,
  type Dart,
  type Difficulty,
  type Turn,
} from "@/lib/darts";
import type { GameState } from "@/lib/game-state";
import {
  MAX_WAGER,
  WAGERS,
  accuracy,
  clampWager,
  finishDarts,
  startSession,
  takeWager,
  type DartsMode,
} from "@/lib/minigames";
import { playActionCue } from "@/lib/action-audio";
import { useAutoPause, useFrameLoop, useHold, useReducedMotion } from "./hooks";
import { MinigameShell, PauseOverlay, ResultCard, helpSeen, markHelpSeen } from "./MinigameShell";

type Phase = "menu" | "play" | "result";

const U = 112; // pixels per board unit
const HAND = { x: 0, y: 196 };
const FLIGHT_MS = 240;
const GUS_DELAY_MS = 1500;

const MODES: { id: DartsMode; label: string; desc: string }[] = [
  { id: "practice", label: "Practice", desc: "Unlimited throws. No records, stakes or rewards." },
  { id: "three", label: "Three darts", desc: "Best three-dart score against Gus's one visit." },
  {
    id: "x01",
    label: "301",
    desc: "Count down to exactly zero. Finish on a double. Bust and you go back.",
  },
];

const pol = (r: number, a: number) => [Math.sin(a) * r * U, -Math.cos(a) * r * U] as const;
function wedge(r0: number, r1: number, a0: number, a1: number) {
  const [x0, y0] = pol(r1, a0);
  const [x1, y1] = pol(r1, a1);
  const [x2, y2] = pol(r0, a1);
  const [x3, y3] = pol(r0, a0);
  return `M${x0.toFixed(1)} ${y0.toFixed(1)}A${r1 * U} ${r1 * U} 0 0 1 ${x1.toFixed(1)} ${y1.toFixed(1)}L${x2.toFixed(1)} ${y2.toFixed(1)}A${r0 * U} ${r0 * U} 0 0 0 ${x3.toFixed(1)} ${y3.toFixed(1)}Z`;
}

/** The board is static, so it is drawn once. */
const BoardArt = memo(function BoardArt() {
  const step = Math.PI / 10;
  return (
    <g data-testid="board">
      <circle r={BOARD_R * U + 9} fill="#5a3d2a" stroke="#25242a" strokeWidth="3" />
      <circle r={BOARD_R * U} fill="#25242a" />
      {SEGMENTS.map((n, i) => {
        const a0 = i * step - step / 2;
        const a1 = i * step + step / 2;
        const dark = i % 2 === 0;
        const single = dark ? "#2b2a30" : "#f3e7c6";
        const ring = dark ? "#cf4a3f" : "#3f9a5b";
        const [tx, ty] = pol(1.15, i * step);
        return (
          <g key={n}>
            <path
              d={wedge(RADII.outerBull, RADII.trebleInner, a0, a1)}
              fill={single}
              stroke="#8a8a8a"
              strokeWidth=".6"
            />
            <path
              d={wedge(RADII.trebleInner, RADII.trebleOuter, a0, a1)}
              fill={ring}
              stroke="#8a8a8a"
              strokeWidth=".6"
            />
            <path
              d={wedge(RADII.trebleOuter, RADII.doubleInner, a0, a1)}
              fill={single}
              stroke="#8a8a8a"
              strokeWidth=".6"
            />
            <path
              d={wedge(RADII.doubleInner, RADII.doubleOuter, a0, a1)}
              fill={ring}
              stroke="#8a8a8a"
              strokeWidth=".6"
            />
            <text
              x={tx}
              y={ty + 5}
              textAnchor="middle"
              fontSize="15"
              fontWeight="700"
              fill="#fff8e6"
              fontFamily="inherit"
            >
              {n}
            </text>
          </g>
        );
      })}
      <circle r={RADII.outerBull * U} fill="#3f9a5b" stroke="#8a8a8a" strokeWidth=".6" />
      <circle r={RADII.bull * U} fill="#cf4a3f" stroke="#8a8a8a" strokeWidth=".6" />
    </g>
  );
});

type Flight = { dart: Dart; t: number };
type Match = {
  mode: DartsMode;
  level: Difficulty;
  wager: number;
  turn: Turn;
  playerRem: number;
  gusRem: number;
  throws: number;
  hits: number;
  over: boolean;
  best: number;
  flight: Flight | null;
  wait: number;
  next: "gus" | "clear" | "end" | null;
  pendingEnd: { won: boolean | null; score?: number } | null;
};

function freshMatch(mode: DartsMode, level: Difficulty, wager: number): Match {
  return {
    mode,
    level,
    wager,
    turn: { darts: [], startRemaining: START_301 },
    playerRem: START_301,
    gusRem: START_301,
    throws: 0,
    hits: 0,
    over: false,
    best: 0,
    flight: null,
    wait: 0,
    next: null,
    pendingEnd: null,
  };
}

type Props = {
  state: GameState;
  onChange: (next: GameState) => void;
  onExit: () => void;
  rng?: () => number;
  /** Play small synthesized cues (the town's sound setting). */ sound?: boolean;
};

export function DartsGame({ state, onChange, onExit, rng = Math.random, sound = true }: Props) {
  const reduced = useReducedMotion();
  const [phase, setPhase] = useState<Phase>("menu");
  const [mode, setMode] = useState<DartsMode>("three");
  const [level, setLevel] = useState<Difficulty>("normal");
  const [wager, setWager] = useState(0);
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("Pick a game to start.");
  const [good, setGood] = useState<boolean | undefined>(undefined);
  const [stuck, setStuck] = useState<Dart[]>([]);
  const [score, setScore] = useState({
    you: START_301,
    gus: START_301,
    darts: 0,
    last: "",
    throws: 0,
    hits: 0,
    sum: 0,
  });
  const [bubble, setBubble] = useState<{ gus: string; crowd: string | null; id: number } | null>(
    null,
  );
  const [callout, setCallout] = useState<{ text: string; good: boolean; id: number } | null>(null);
  const [result, setResult] = useState<{
    headline: string;
    lines: string[];
    best: boolean;
    won: boolean | null;
  } | null>(null);

  const m = useRef<Match>(freshMatch("three", "normal", 0));
  const aimer = useRef<Aimer>(newAimer("normal", rng));
  const sessionPaid = useRef(false);
  const stateRef = useRef(state);
  stateRef.current = state;
  const phaseRef = useRef(phase);
  phaseRef.current = phase;
  const pausedRef = useRef(paused);
  pausedRef.current = paused || help;
  const reducedRef = useRef(reduced);
  reducedRef.current = reduced;
  const idRef = useRef(0);

  const reticleEl = useRef<SVGGElement>(null);
  const scatterEl = useRef<SVGCircleElement>(null);
  const flightEl = useRef<SVGGElement>(null);
  const holdLabel = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!helpSeen("darts")) setHelp(true);
  }, []);
  useAutoPause(() => {
    if (phaseRef.current === "play") setPaused(true);
  });

  const say = (text: string, isGood: boolean | undefined) => {
    setStatus(text);
    setGood(isGood);
  };
  const talk = (b: { gus: string; crowd: string | null }) => {
    idRef.current += 1;
    setBubble({ ...b, id: idRef.current });
  };
  const flash = (text: string, isGood: boolean) => {
    idRef.current += 1;
    setCallout({ text, good: isGood, id: idRef.current });
  };

  const syncScore = (extra: Partial<typeof score> = {}) => {
    const mm = m.current;
    setScore((s) => ({
      ...s,
      you: mm.playerRem,
      gus: mm.gusRem,
      darts: mm.turn.darts.length,
      throws: mm.throws,
      hits: mm.hits,
      sum: threeDartScore(mm.turn.darts),
      ...extra,
    }));
  };

  /** End the match (not practice) and show the result. */
  const endMatch = (won: boolean | null, threeScore?: number) => {
    const mm = m.current;
    if (mm.over) return;
    mm.over = true;
    const out = finishDarts(stateRef.current, {
      mode: mm.mode,
      throws: mm.throws,
      hits: mm.hits,
      ...(threeScore !== undefined ? { score: threeScore } : {}),
      won,
      completed: true,
      wager: mm.wager,
    });
    onChange(out.next);
    const acc = accuracy(mm.hits, mm.throws);
    const head = won === null ? "Draw" : won ? "You win!" : "Gus wins";
    setResult({
      headline: head,
      best: out.newBest,
      won,
      lines: [
        mm.mode === "three" ? `You ${threeScore} · Gus ${mm.gusRem}` : `301 · accuracy ${acc}%`,
        gusMatchLine(won, rng),
        ...out.notes,
      ],
    });
    setPhase("result");
    say(head, won === null ? undefined : won);
  };

  const land = (dart: Dart) => {
    const mm = m.current;
    mm.throws += 1;
    if (dart.points > 0) mm.hits += 1;
    setStuck((s) => [...s, dart]);
    playActionCue(
      dart.points >= 20 ? "success" : dart.offBoard || dart.points === 0 ? "failure" : "encounter",
      sound,
    );
    const label = dart.offBoard
      ? "Missed the board!"
      : dart.points
        ? `${dart.label} · ${dart.points}`
        : "Rim: 0";
    flash(dart.offBoard ? "MISS!" : dart.label, !dart.offBoard && dart.points >= 20);
    if (mm.mode === "practice") {
      mm.turn.darts.push(dart);
      const b = banterFor(dart, rng);
      talk(b);
      say(`${label}`, dart.points >= 20 ? true : dart.offBoard ? false : undefined);
      if (threeDartScore(mm.turn.darts) === 180 && mm.turn.darts.length === 3)
        talk({ gus: ONE_EIGHTY, crowd: null });
      if (mm.turn.darts.length >= DARTS_PER_TURN) {
        mm.wait = 1100;
        mm.next = "clear";
      }
      syncScore({ last: dart.label });
      return;
    }
    if (mm.mode === "three") {
      mm.turn.darts.push(dart);
      talk(banterFor(dart, rng));
      say(label, dart.points >= 20 ? true : dart.offBoard ? false : undefined);
      syncScore({ last: dart.label });
      if (mm.turn.darts.length >= DARTS_PER_TURN) {
        const total = threeDartScore(mm.turn.darts);
        mm.gusRem = gusThreeDarts(rng);
        mm.best = total;
        mm.wait = GUS_DELAY_MS;
        mm.next = "end";
        mm.pendingEnd = {
          won: total > mm.gusRem ? true : total === mm.gusRem ? null : false,
          score: total,
        };
        if (total === 180) talk({ gus: ONE_EIGHTY, crowd: null });
        say(`You scored ${total}. Gus steps up…`, undefined);
      }
      return;
    }
    // 301
    const r = applyDart(mm.turn, dart);
    mm.playerRem = r.remaining;
    if (r.kind === "bust") {
      talk(banterFor(dart, rng, { bust: true }));
      say(
        r.reason === "no-double"
          ? "Bust! You have to finish on a double."
          : r.reason === "one"
            ? "Bust! Can't leave one."
            : "Bust! Too many. Back to where you started.",
        false,
      );
      flash("BUST", false);
    } else if (r.kind === "win") {
      say("Double out! You win!", true);
    } else {
      talk(banterFor(dart, rng));
      say(
        `${label} · ${r.remaining} to go`,
        dart.points >= 20 ? true : dart.offBoard ? false : undefined,
      );
    }
    syncScore({ last: dart.label });
    if (r.kind === "win") {
      mm.wait = 900;
      mm.next = "end";
      mm.pendingEnd = { won: true };
    } else if (r.turnOver) {
      mm.wait = GUS_DELAY_MS;
      mm.next = "gus";
    }
  };

  const afterWait = () => {
    const mm = m.current;
    const what = mm.next;
    mm.next = null;
    if (what === "clear") {
      mm.turn = { darts: [], startRemaining: START_301 };
      setStuck([]);
      syncScore({ last: "" });
    } else if (what === "end") {
      const p = mm.pendingEnd;
      if (p) endMatch(p.won, p.score);
    } else if (what === "gus") {
      const v = gusVisit(mm.gusRem, rng);
      mm.gusRem = v.remaining;
      if (v.won) {
        talk({
          gus: 'Gus: "Double out. Don\'t clap, it was easy."',
          crowd: "The pub groans for you.",
        });
        say("Gus finishes on a double. Ouch.", false);
        syncScore();
        mm.pendingEnd = { won: false };
        mm.wait = 900;
        mm.next = "end";
        return;
      }
      say(
        v.bust
          ? `Gus busts! Still on ${v.remaining}.`
          : `Gus scores ${v.scored}. He's on ${v.remaining}.`,
        v.bust ? true : undefined,
      );
      if (v.bust)
        talk({
          gus: 'Gus: "That board is rigged."',
          crowd: "A man by the jukebox snorts into his pint.",
        });
      mm.turn = { darts: [], startRemaining: mm.playerRem };
      setStuck([]);
      syncScore();
    }
  };

  const onDown = () => {
    const mm = m.current;
    if (mm.over || mm.flight || mm.wait > 0 || phaseRef.current !== "play" || pausedRef.current)
      return;
    press(aimer.current);
  };
  const onUp = () => {
    const a = aimer.current;
    if (!a.holding) return;
    const mm = m.current;
    if (pausedRef.current || phaseRef.current !== "play" || mm.over || mm.flight) {
      a.holding = false;
      a.heldMs = 0;
      return; // a paused hold is cancelled, not thrown
    }
    const d = release(a, rng);
    mm.flight = { dart: d, t: 0 };
    if (reducedRef.current) mm.flight.t = FLIGHT_MS;
    say("Thrown…", undefined);
  };
  const { bind } = useHold({
    enabled: phase === "play" && !paused && !help,
    onDown,
    onUp,
    onCancel: () => {
      aimer.current.holding = false;
      aimer.current.heldMs = 0;
    },
  });

  const paint = () => {
    const a = aimer.current;
    const mm = m.current;
    const p = reticle(a);
    const hide = Boolean(mm.flight) || mm.over;
    reticleEl.current?.setAttribute(
      "transform",
      `translate(${(p.x * U).toFixed(1)} ${(p.y * U).toFixed(1)})`,
    );
    reticleEl.current?.setAttribute("opacity", hide ? "0" : "1");
    const sg = sigmaNow(a);
    scatterEl.current?.setAttribute("r", (Math.max(0.012, sg * 2) * U).toFixed(1));
    scatterEl.current?.setAttribute("opacity", LEVELS[mm.level].label === "Hard" ? "0" : "0.9");
    const f = mm.flight;
    const g = flightEl.current;
    if (g) {
      if (f) {
        const u = Math.min(1, f.t / FLIGHT_MS);
        const x = HAND.x + (f.dart.x * U - HAND.x) * u;
        const y = HAND.y + (f.dart.y * U - HAND.y) * u - Math.sin(Math.PI * u) * 26;
        const sc = 1.15 - 0.55 * u;
        g.setAttribute(
          "transform",
          `translate(${x.toFixed(1)} ${y.toFixed(1)}) scale(${sc.toFixed(2)})`,
        );
        g.setAttribute("opacity", "1");
      } else g.setAttribute("opacity", "0");
    }
    if (holdLabel.current) {
      const s = a.holding ? Math.round(steadiness(a) * 100) : 0;
      holdLabel.current.textContent = a.holding
        ? a.heldMs > 2300
          ? "ARM TIRING… THROW!"
          : `STEADY ${s}% · RELEASE`
        : "HOLD TO STEADY";
    }
  };

  useFrameLoop(
    (dt) => {
      const mm = m.current;
      stepAimer(aimer.current, dt);
      if (mm.flight) {
        mm.flight.t += dt;
        if (mm.flight.t >= FLIGHT_MS) {
          const d = mm.flight.dart;
          mm.flight = null;
          land(d);
        }
      } else if (mm.wait > 0) {
        mm.wait -= dt;
        if (mm.wait <= 0) {
          mm.wait = 0;
          afterWait();
        }
      }
      paint();
    },
    phase === "play" && !paused && !help,
  );

  const start = (md: DartsMode) => {
    const w = md === "practice" ? 0 : clampWager(wager, stateRef.current.money);
    let next = stateRef.current;
    if (!sessionPaid.current) {
      const s = startSession(next, "darts");
      if (!s.ok) {
        say(s.message, false);
        return;
      }
      next = s.next;
      sessionPaid.current = true;
    }
    next = takeWager(next, w);
    if (next !== stateRef.current) onChange(next);
    m.current = freshMatch(md, level, w);
    aimer.current = newAimer(level, rng);
    setMode(md);
    setStuck([]);
    setBubble(null);
    setCallout(null);
    setResult(null);
    setPaused(false);
    setScore({ you: START_301, gus: START_301, darts: 0, last: "", throws: 0, hits: 0, sum: 0 });
    setPhase("play");
    say(
      md === "practice"
        ? "Hold to steady, release to throw."
        : w
          ? `$${w} on the line. Hold to steady, release to throw.`
          : "Hold to steady, release to throw.",
      undefined,
    );
    talk({
      gus:
        md === "x01"
          ? 'Gus: "Three-oh-one. Double to finish. Try to keep up."'
          : md === "three"
            ? 'Gus: "Three darts, highest wins. Even you can manage that."'
            : 'Gus: "Take your time. Not that it\'ll help."',
      crowd: null,
    });
  };

  /** Leaving mid-match: nothing is lost for walking away before throwing, otherwise it counts as a forfeit. */
  const leave = () => {
    const mm = m.current;
    if (phaseRef.current === "play" && !mm.over) {
      if (mm.mode === "practice") {
        if (mm.throws > 0)
          onChange(
            finishDarts(stateRef.current, {
              mode: "practice",
              throws: mm.throws,
              hits: mm.hits,
              completed: true,
            }).next,
          );
      } else if (mm.throws === 0 && !mm.flight) {
        if (mm.wager) onChange({ ...stateRef.current, money: stateRef.current.money + mm.wager });
      } else {
        onChange(
          finishDarts(stateRef.current, {
            mode: mm.mode,
            throws: mm.throws,
            hits: mm.hits,
            completed: false,
            wager: mm.wager,
          }).next,
        );
      }
      mm.over = true;
    }
    onExit();
  };
  const closeHelp = () => {
    markHelpSeen("darts");
    setHelp(false);
  };

  const wagerOptions = WAGERS.filter((w) => w === 0 || w <= Math.min(MAX_WAGER, state.money));
  const acc = accuracy(score.hits, score.throws);

  const hudView =
    phase === "play" ? (
      mode === "x01" ? (
        <>
          <span data-testid="hud-you">You {score.you}</span>
          <span data-testid="hud-gus">Gus {score.gus}</span>
          <span>
            Dart {Math.min(DARTS_PER_TURN, score.darts + 1)}/{DARTS_PER_TURN}
          </span>
        </>
      ) : mode === "three" ? (
        <>
          <span data-testid="hud-you">Score {score.sum}</span>
          <span>
            Dart {Math.min(DARTS_PER_TURN, score.darts + 1)}/{DARTS_PER_TURN}
          </span>
          {m.current.wager > 0 && <span>Stake ${m.current.wager}</span>}
        </>
      ) : (
        <>
          <span data-testid="hud-you">Last {score.last || "–"}</span>
          <span>
            Darts {score.throws} · {acc}% on board
          </span>
        </>
      )
    ) : null;

  const dock =
    phase === "play" ? (
      <button
        type="button"
        className="mg-hold"
        aria-label="Hold to steady, release to throw"
        {...bind}
      >
        <span ref={holdLabel}>HOLD TO STEADY</span>
      </button>
    ) : phase === "menu" ? (
      <button type="button" className="mg-btn mg-btn-primary w-full" onClick={() => start(mode)}>
        Start · {MODES.find((x) => x.id === mode)?.label}
        {mode !== "practice" && wager > 0 ? ` · $${wager}` : ""}
      </button>
    ) : null;

  return (
    <MinigameShell
      kicker="The Tipsy Stick"
      title="Darts"
      background="#e3c9da"
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
          <div role="radiogroup" aria-label="Game" className="grid gap-2">
            {MODES.map((x) => (
              <button
                key={x.id}
                type="button"
                role="radio"
                aria-checked={mode === x.id}
                className={`mg-btn text-left ${mode === x.id ? "mg-btn-primary" : ""}`}
                onClick={() => setMode(x.id)}
              >
                <span className="block">{x.label}</span>
                <span className="block text-xs font-normal">{x.desc}</span>
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
                {LEVELS[d].label}
              </button>
            ))}
          </div>
          <div
            className="flex flex-wrap items-center gap-2"
            role="group"
            aria-label="Friendly wager"
          >
            <span className="text-sm font-bold">Friendly wager</span>
            {wagerOptions.map((w) => (
              <button
                key={w}
                type="button"
                className="mg-chip"
                aria-pressed={(mode === "practice" ? 0 : wager) === w}
                disabled={mode === "practice"}
                onClick={() => setWager(w)}
              >
                {w === 0 ? "None" : `$${w}`}
              </button>
            ))}
          </div>
          <p className="text-sm" data-testid="records">
            Best three-dart: {state.dartBest3} · Accuracy:{" "}
            {accuracy(state.dartHits, state.dartThrows)}% · Won {state.dartWins} / Lost{" "}
            {state.dartLosses}
          </p>
          <p className="text-xs opacity-80">
            Costs 30 minutes and 3 energy once per visit. Beat Gus for Charm and his respect, once a
            day. Stakes are capped at ${MAX_WAGER}.
          </p>
        </div>
      )}

      {phase === "result" && result && (
        <div className="flex h-full items-center overflow-y-auto">
          <ResultCard
            title="Game over"
            headline={result.headline}
            lines={result.lines}
            best={result.best}
            actions={
              <>
                <button type="button" className="mg-btn mg-btn-primary" onClick={() => start(mode)}>
                  {wager > 0 && mode !== "practice"
                    ? `Play again · $${clampWager(wager, state.money)}`
                    : "Play again"}
                </button>
                <button type="button" className="mg-btn" onClick={() => setPhase("menu")}>
                  Change game
                </button>
                <button type="button" className="mg-btn" onClick={leave}>
                  Back to the pub
                </button>
              </>
            }
          />
        </div>
      )}

      {phase === "play" && (
        <div className="mg-play-area relative flex h-full items-center justify-center" {...bind}>
          <svg
            viewBox={`-170 -170 340 ${170 + HAND.y + 30}`}
            className="max-h-full w-full max-w-[460px] rounded-xl border-2 border-[#25242a]"
            role="img"
            aria-label="Dartboard. Hold to steady the aim, release to throw."
            preserveAspectRatio="xMidYMid meet"
          >
            <rect x="-170" y="-170" width="340" height={170 + HAND.y + 30} fill="#7a4f6f" />
            <path d="M-170 150H170V400H-170Z" fill="#3a2937" />
            <BoardArt />
            {stuck.map((d, i) => (
              <g
                key={i}
                transform={`translate(${(d.x * U).toFixed(1)} ${(d.y * U).toFixed(1)})`}
                data-testid="stuck-dart"
              >
                <path d="M0 0L-3 -22L3 -22Z" fill="#ffd27a" stroke="#25242a" strokeWidth="1" />
                <path
                  d="M-6 -30L0 -22L6 -30L0 -34Z"
                  fill="#cf4a3f"
                  stroke="#25242a"
                  strokeWidth="1"
                />
                <circle r="2.2" fill="#25242a" />
              </g>
            ))}
            <g ref={reticleEl} data-testid="reticle">
              <circle
                ref={scatterEl}
                r="8"
                fill="none"
                stroke="#fff"
                strokeWidth="1.6"
                strokeDasharray="4 3"
              />
              <path d="M-9 0H9M0 -9V9" stroke="#fff" strokeWidth="2.2" />
              <path d="M-9 0H9M0 -9V9" stroke="#25242a" strokeWidth="0.8" />
            </g>
            <g ref={flightEl} opacity="0" data-testid="flying-dart">
              <path d="M0 0L-3 -22L3 -22Z" fill="#ffd27a" stroke="#25242a" strokeWidth="1" />
              <path
                d="M-6 -30L0 -22L6 -30L0 -34Z"
                fill="#cf4a3f"
                stroke="#25242a"
                strokeWidth="1"
              />
            </g>
            {/* the thrower's hand, a plain circle-headed stick in keeping with the town */}
            <circle
              cx="0"
              cy={HAND.y + 14}
              r="10"
              fill="#f0d5b7"
              stroke="#222530"
              strokeWidth="2.4"
            />
            <path
              d="M-12 215l12 -10 12 10"
              stroke="#222530"
              strokeWidth="2.6"
              fill="none"
              strokeLinecap="round"
            />
          </svg>
          {callout && (
            <div
              key={callout.id}
              className={`mg-pop pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-xl border-2 border-[#25242a] px-4 py-1 text-xl font-extrabold ${callout.good ? "bg-[#9be3a4]" : "bg-[#f5b3a6]"}`}
              data-testid="callout"
            >
              {callout.text}
            </div>
          )}
          {bubble && (
            <div
              key={bubble.id}
              className="pointer-events-none absolute inset-x-1 bottom-1 mx-auto max-w-[460px] rounded-lg border-2 border-[#25242a] bg-[#fff8e6]/95 px-2 py-1 text-xs leading-snug text-[#25242a]"
              data-testid="banter"
            >
              <p>{bubble.gus}</p>
              {bubble.crowd && <p className="opacity-75">{bubble.crowd}</p>}
            </div>
          )}
          {paused && <PauseOverlay onResume={() => setPaused(false)} onLeave={leave} />}
        </div>
      )}

      {help && (
        <RulesSheet title="How to play darts" onClose={closeHelp}>
          <ul className="list-disc space-y-1 pl-5">
            <li>
              The white cross sweeps across the board. Its dashed circle shows how far your dart
              might stray.
            </li>
            <li>
              <b>Press and hold</b> (the big button, the board, or Space) to steady your arm. The
              cross slows and the circle shrinks.
            </li>
            <li>
              <b>Release</b> to throw when the cross is where you want it. Let go instantly and you
              flinch. Hold too long and your arm tires.
            </li>
            <li>
              Trebles (inner ring) score triple, doubles (outer ring) score double, the bull is 50
              and the outer bull 25.
            </li>
            <li>
              Three darts: top Gus's one visit. 301: count down to exactly zero and finish on a
              double or the bull. Bust, and the turn is wiped.
            </li>
            <li>
              A friendly wager is optional and capped. Beating Gus gives Charm and a little of his
              respect, once a day.
            </li>
          </ul>
        </RulesSheet>
      )}
    </MinigameShell>
  );
}
