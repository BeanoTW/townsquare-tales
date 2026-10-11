import { useEffect, useRef, useState } from "react";
import type { GameState } from "@/lib/game-state";
import { OverheadPerson } from "@/components/OverheadPerson";
import {
  GAME_INFO,
  DART_SEGMENTS,
  JUMP_WINDOW,
  startSkill,
  finishSkill,
  newBasketball,
  basketballHold,
  basketballRelease,
  basketballStep,
  hoopPosition,
  shotPower,
  newSkate,
  skateJump,
  skateStep,
  newDarts,
  dartCursor,
  dartsAim,
  dartsThrow,
  dartsTotal,
  type SkillGame as GameId,
  type Basketball,
  type Skate,
  type Darts,
} from "@/lib/minigames";
import "./skill-games.css";

type Run =
  | { kind: "basketball"; data: Basketball }
  | { kind: "skateboard"; data: Skate }
  | { kind: "darts"; data: Darts };
const fresh = (kind: GameId): Run =>
  kind === "basketball"
    ? { kind, data: newBasketball() }
    : kind === "skateboard"
      ? { kind, data: newSkate() }
      : { kind, data: newDarts() };
const scoreOf = (r: Run) => (r.kind === "darts" ? dartsTotal(r.data) : r.data.score);
const INSTRUCTIONS = {
  basketball:
    "Hold Shoot or Space to charge. Release when the gold marker reaches the green zone. The hoop moves while the ball flies. Five shots; score three baskets for Strength +1.",
  skateboard:
    "Tap Jump or Space when the rider enters the gold zone. On the rail, hold Left and Right (or A/D) to keep the marker centred for four seconds. Land it for Charm +1. An equipped skateboard is required.",
  darts:
    "Drag or tap the board to aim; arrows or WASD also work. The crosshair wobbles: tap Throw or Space at the right moment. Nine darts; 180 points earns Charm +1. Inner bull 50, outer bull 25; narrow rings score triple and double.",
};

function boardPoint(radius: number, angle: number) {
  return { x: 180 + radius * Math.sin(angle), y: 126 - radius * Math.cos(angle) };
}
function wedge(inner: number, outer: number, i: number) {
  const a = ((i - 0.5) * Math.PI) / 10,
    b = ((i + 0.5) * Math.PI) / 10;
  const p = boardPoint(outer, a),
    q = boardPoint(outer, b),
    r = boardPoint(inner, b),
    s = boardPoint(inner, a);
  return `M${p.x} ${p.y}A${outer} ${outer} 0 0 1 ${q.x} ${q.y}L${r.x} ${r.y}A${inner} ${inner} 0 0 0 ${s.x} ${s.y}Z`;
}
function DartBoard({ run, onAim }: { run: Darts; onAim: (x: number, y: number) => void }) {
  const cursor = dartCursor(run);
  const aim = (e: React.PointerEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM();
    if (!matrix) return;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    onAim((p.x - 180) / 100, (p.y - 126) / 100);
  };
  return (
    <svg
      className="sg-scene sg-board"
      viewBox="0 0 360 252"
      aria-label="Dartboard. Drag to aim; use the Throw button to throw."
      role="img"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        aim(e);
      }}
      onPointerMove={(e) => {
        if (e.buttons) aim(e);
      }}
    >
      <rect width="360" height="252" fill="#332735" />
      <circle cx="180" cy="126" r="121" fill="#171821" stroke="#be9970" strokeWidth="3" />
      {DART_SEGMENTS.map((value, i) => (
        <g key={i}>
          <path
            d={wedge(9.35, 100, i)}
            fill={i % 2 ? "#eadfc7" : "#242833"}
            stroke="#aca692"
            strokeWidth=".5"
          />
          <path
            d={wedge(58.2, 62.9, i)}
            fill={i % 2 ? "#4d997c" : "#c15767"}
            stroke="#aca692"
            strokeWidth=".5"
          />
          <path
            d={wedge(95.3, 100, i)}
            fill={i % 2 ? "#4d997c" : "#c15767"}
            stroke="#aca692"
            strokeWidth=".5"
          />
          <text
            x={boardPoint(111, (i * Math.PI) / 10).x}
            y={boardPoint(111, (i * Math.PI) / 10).y + 3}
            textAnchor="middle"
            fill="#fff5dc"
            fontSize="10"
          >
            {value}
          </text>
        </g>
      ))}
      <circle cx="180" cy="126" r="9.35" fill="#4d997c" stroke="#aca692" />
      <circle cx="180" cy="126" r="3.74" fill="#c15767" />
      {run.throws.map((t, i) => (
        <g key={i} transform={`translate(${180 + t.x * 100} ${126 + t.y * 100})`}>
          <circle r="2" fill="#ffd16b" />
          <path d="M0 0l8 -10m-2 0h5v5" stroke="#ffd16b" strokeWidth="2" fill="none" />
        </g>
      ))}
      {run.phase === "aim" && (
        <g
          transform={`translate(${180 + cursor.x * 100} ${126 + cursor.y * 100})`}
          stroke="#70e7ff"
          strokeWidth="2"
          fill="none"
        >
          <circle r="6" />
          <path d="M-11 0h7M4 0h7M0 -11v7M0 4v7" />
        </g>
      )}
    </svg>
  );
}
function BasketballScene({ run }: { run: Basketball }) {
  const hoop = 60 + 240 * hoopPosition(run.time);
  const flight = Math.min(1, run.flight / 0.75),
    end = 60 + 240 * run.power;
  const ballX = 40 + (end - 40) * flight;
  const ballY = 200 + (78 - 200) * flight - 110 * Math.sin(Math.PI * flight);
  const power = run.held === null ? 0 : shotPower(run.held),
    target = hoopPosition(run.time + 0.75);
  return (
    <>
      <svg
        className="sg-scene"
        viewBox="0 0 360 252"
        role="img"
        aria-label="Basketball court with a moving hoop"
      >
        <rect width="360" height="252" fill="#284443" />
        <path d="M0 160h360v92H0Z" fill="#567a68" />
        <path
          d="M18 245l36-87h252l36 87M95 245l20-87M265 245l-20-87M18 220h324"
          fill="none"
          stroke="#e5dbb7"
          opacity=".4"
        />
        <g transform={`translate(${hoop} 0)`}>
          <path d="M0 38v130" stroke="#b7c9b8" strokeWidth="5" />
          <rect
            x="-24"
            y="37"
            width="48"
            height="36"
            rx="3"
            fill="#e6eedb"
            stroke="#222b35"
            strokeWidth="3"
          />
          <rect
            x="-12"
            y="46"
            width="24"
            height="22"
            fill="none"
            stroke="#c15767"
            strokeWidth="2"
          />
          <path d="M-13 78l5 22h16l5-22M-8 81l16 16M8 81l-16 16" stroke="#eee8d4" fill="none" />
          <ellipse cy="78" rx="17" ry="4" fill="none" stroke="#f1af5b" strokeWidth="4" />
        </g>
        <g transform="translate(40 200)">
          <OverheadPerson angle={0} />
        </g>
        <circle
          cx={run.phase === "flight" ? ballX : 49}
          cy={run.phase === "flight" ? ballY : 189}
          r="7"
          fill="#e7a35c"
          stroke="#302837"
          strokeWidth="2"
        />
        <text x="180" y="237" textAnchor="middle" fill="#fff5dc" fontSize="13">
          {run.phase === "flight"
            ? run.flight > 0.75
              ? run.hit
                ? "SWISH!"
                : "Off the rim."
              : "…"
            : "Time your release"}
        </text>
      </svg>
      <div
        className="sg-meter"
        role="meter"
        aria-label="Shot power"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(power * 100)}
      >
        <span className="sg-target" style={{ left: `${(target - 0.075) * 100}%`, width: "15%" }} />
        <span className="sg-needle" style={{ left: `${power * 100}%` }} />
      </div>
      <p className="sg-hint">
        Release in the green zone · {run.score}/5 baskets · Shot {Math.min(5, run.shots + 1)}/5
      </p>
    </>
  );
}
function SkateScene({ run }: { run: Skate }) {
  const approach = run.phase === "approach" || run.entry === 0,
    x = approach
      ? 25 + (run.time / 1.8) * 150
      : 25 + (run.entry / 1.8) * 150 + (run.time / 4) * (275 - (run.entry / 1.8) * 150);
  return (
    <>
      <svg
        className="sg-scene"
        viewBox="0 0 360 252"
        role="img"
        aria-label="Skate park rail and rider"
      >
        <rect width="360" height="252" fill="#3d3553" />
        <rect y="145" width="360" height="107" fill="#8c8c91" />
        <path d="M0 185Q55 180 75 135v55H0Z" fill="#6f677b" stroke="#272533" strokeWidth="3" />
        <path d="M94 151h228M113 151v49M301 151v49" stroke="#2d2938" strokeWidth="9" fill="none" />
        <path d="M94 147h228" stroke="#dcd7ea" strokeWidth="3" />
        {approach && (
          <rect
            x={25 + (JUMP_WINDOW[0] / 1.8) * 150}
            y="191"
            width={((JUMP_WINDOW[1] - JUMP_WINDOW[0]) / 1.8) * 150}
            height="9"
            fill="#f0bf60"
          />
        )}
        <g
          transform={`translate(${x} ${approach || run.phase === "done" ? 177 : 177 - 37 * Math.min(1, run.time / 0.22) - 12 * Math.sin(Math.PI * Math.min(1, run.time / 0.22))}) rotate(${approach ? 0 : Math.max(-1, Math.min(1, run.balance)) * 30})`}
        >
          <g transform="rotate(90)">
            <rect
              x="-5"
              y="-24"
              width="10"
              height="42"
              rx="5"
              fill="#89949c"
              stroke="#30343c"
              strokeWidth="1.8"
            />
            <path d="M-3 -18h6M-3 12h6" stroke="#cbd0d2" strokeWidth="1.2" />
            <OverheadPerson angle={0} />
          </g>
        </g>
        <text x="180" y="237" textAnchor="middle" fill="#fff5dc" fontSize="13">
          {approach
            ? "Jump inside the gold zone"
            : run.phase === "done"
              ? run.landed
                ? "Clean landing."
                : "Concrete wins this round."
              : "Keep your balance"}
        </text>
      </svg>
      {!approach && (
        <>
          <div
            className="sg-meter"
            role="meter"
            aria-label="Rail balance"
            aria-valuemin={-100}
            aria-valuemax={100}
            aria-valuenow={Math.round(run.balance * 100)}
          >
            <span className="sg-target" style={{ left: "35%", width: "30%" }} />
            <span
              className="sg-needle"
              style={{ left: `${50 + Math.max(-1, Math.min(1, run.balance)) * 50}%` }}
            />
          </div>
          <p className="sg-hint">
            {run.score.toFixed(2)} / 4.00 seconds · Left and Right to stay on
          </p>
        </>
      )}
    </>
  );
}

export function SkillGame({
  game,
  state,
  onChange,
  onExit,
}: {
  game: GameId;
  state: GameState;
  onChange: (next: GameState) => void;
  onExit: () => void;
}) {
  const root = useRef<HTMLElement>(null);
  const [run, setRun] = useState<Run | null>(null),
    live = useRef<Run | null>(null);
  const [message, setMessage] = useState("Ready when you are."),
    [rules, setRules] = useState(false);
  const keys = useRef(new Set<string>()),
    touch = useRef(new Set<number>());
  const host = useRef({ state, onChange, onExit });
  host.current = { state, onChange, onExit };
  const completed = useRef(false),
    info = GAME_INFO[game];
  const update = (next: Run) => {
    live.current = next;
    setRun(next);
    if (next.data.phase === "done" && !completed.current) {
      completed.current = true;
      const result = finishSkill(host.current.state, next.kind, scoreOf(next));
      host.current.onChange(result.next);
      setMessage(
        result.rewarded
          ? `Nice one. ${info.stat === "str" ? "Strength" : "Charm"} +1.`
          : scoreOf(next) >= info.goal
            ? "Good run. Today's stat reward is already claimed."
            : "Have another go. The goal earns a daily stat reward.",
      );
    }
  };
  const begin = () => {
    if (live.current && live.current.data.phase !== "done") return;
    const result = startSkill(host.current.state, game);
    if (!result.ok) {
      setMessage(result.message);
      return;
    }
    host.current.onChange(result.next);
    completed.current = false;
    keys.current.clear();
    touch.current.clear();
    update(fresh(game));
    setMessage("Game on.");
  };
  const act = (down: boolean) => {
    const r = live.current;
    if (!r || r.data.phase === "done" || rules) return;
    if (r.kind === "basketball")
      update({ ...r, data: down ? basketballHold(r.data) : basketballRelease(r.data) });
    if (down && r.kind === "skateboard") update({ ...r, data: skateJump(r.data) });
    if (down && r.kind === "darts") update({ ...r, data: dartsThrow(r.data) });
  };
  const callbacks = useRef({ act, update, rules });
  callbacks.current = { act, update, rules };
  useEffect(() => {
    let frame = 0,
      last = 0;
    const loop = (now: number) => {
      const dt = last ? Math.min(0.04, Math.max(0, (now - last) / 1000)) : 0;
      last = now;
      const r = live.current;
      if (r && r.data.phase !== "done" && !document.hidden && !callbacks.current.rules) {
        const left =
          keys.current.has("ArrowLeft") || keys.current.has("a") || touch.current.has(-1);
        const right =
          keys.current.has("ArrowRight") || keys.current.has("d") || touch.current.has(1);
        const input = Number(right) - Number(left);
        let next: Run;
        if (r.kind === "basketball") next = { ...r, data: basketballStep(r.data, dt) };
        else if (r.kind === "skateboard") next = { ...r, data: skateStep(r.data, dt, input) };
        else {
          const vertical =
            Number(keys.current.has("ArrowDown") || keys.current.has("s")) -
            Number(keys.current.has("ArrowUp") || keys.current.has("w"));
          next = {
            ...r,
            data: {
              ...dartsAim(
                r.data,
                r.data.aimX + input * dt * 0.8,
                r.data.aimY + vertical * dt * 0.8,
              ),
              time: r.data.time + dt,
            },
          };
        }
        callbacks.current.update(next);
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    const down = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        if (callbacks.current.rules) setRules(false);
        else host.current.onExit();
        return;
      }
      if (e.key === "Tab") {
        const scope = callbacks.current.rules
          ? root.current?.querySelector(".sg-rules")
          : root.current;
        const buttons = scope
          ? Array.from(scope.querySelectorAll<HTMLButtonElement>("button:not([disabled])"))
          : [];
        const first = buttons[0],
          end = buttons.at(-1);
        if (
          first &&
          end &&
          (!scope?.contains(document.activeElement) ||
            (e.shiftKey ? document.activeElement === first : document.activeElement === end))
        ) {
          e.preventDefault();
          (e.shiftKey ? end : first).focus();
        }
        return;
      }
      if (callbacks.current.rules) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      if (
        ![" ", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "a", "d", "w", "s"].includes(key)
      )
        return;
      if (key === " " && (!live.current || live.current.data.phase === "done")) return;
      e.preventDefault();
      if (e.repeat) return;
      keys.current.add(key);
      if (key === " ") callbacks.current.act(true);
    };
    const up = (e: KeyboardEvent) => {
      if (callbacks.current.rules) return;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      keys.current.delete(key);
      if (key === " ") {
        e.preventDefault();
        callbacks.current.act(false);
      }
    };
    const clear = () => {
      keys.current.clear();
      touch.current.clear();
      const r = live.current;
      if (r?.kind === "basketball" && r.data.held !== null)
        callbacks.current.update({ ...r, data: { ...r.data, held: null } });
      last = 0;
    };
    window.addEventListener("keydown", down, true);
    window.addEventListener("keyup", up, true);
    window.addEventListener("blur", clear);
    document.addEventListener("visibilitychange", clear);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("keydown", down, true);
      window.removeEventListener("keyup", up, true);
      window.removeEventListener("blur", clear);
      document.removeEventListener("visibilitychange", clear);
    };
  }, []);
  const done = run?.data.phase === "done",
    active = !!run && !done;
  useEffect(() => {
    root.current?.querySelector<HTMLButtonElement>(".sg-controls button")?.focus();
  }, [active]);
  useEffect(() => {
    if (rules) root.current?.querySelector<HTMLButtonElement>(".sg-rules button")?.focus();
  }, [rules]);
  const controlButton = (dir: number, label: string) => (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.preventDefault();
        e.currentTarget.setPointerCapture(e.pointerId);
        touch.current.add(dir);
      }}
      onPointerUp={() => touch.current.delete(dir)}
      onPointerCancel={() => touch.current.delete(dir)}
      onLostPointerCapture={() => touch.current.delete(dir)}
    >
      {label}
    </button>
  );
  return (
    <section ref={root} className="sg-root" role="dialog" aria-modal="true" aria-label={info.title}>
      <header className="sg-header">
        <div>
          <small>{game === "darts" ? "The Tipsy Stick" : "Town park"}</small>
          <h2>{info.title}</h2>
        </div>
        <button
          onClick={() => {
            keys.current.clear();
            touch.current.clear();
            if (live.current?.kind === "basketball")
              update({ ...live.current, data: { ...live.current.data, held: null } });
            setRules(true);
          }}
        >
          Rules
        </button>
      </header>
      <div className="sg-body">
        <p className="sg-record">
          Best:{" "}
          {game === "skateboard"
            ? (state[info.best] ?? 0).toFixed(2) + "s"
            : (state[info.best] ?? 0)}{" "}
          · {info.hours * 60} min · {info.energy} energy per run
        </p>
        {!run ? (
          <div className="sg-intro">
            <span aria-hidden="true">
              {game === "basketball" ? "🏀" : game === "skateboard" ? "🛹" : "🎯"}
            </span>
            <p>{INSTRUCTIONS[game]}</p>
            <p>Rewards once per day. Leaving a run ends it without a reward.</p>
          </div>
        ) : (
          <>
            {run.kind === "basketball" && <BasketballScene run={run.data} />}
            {run.kind === "skateboard" && <SkateScene run={run.data} />}
            {run.kind === "darts" && (
              <>
                <DartBoard
                  run={run.data}
                  onAim={(x, y) => update({ ...run, data: dartsAim(run.data, x, y) })}
                />
                <p className="sg-hint">
                  {dartsTotal(run.data)} points · {run.data.throws.length}/9 darts · Last:{" "}
                  {run.data.throws.at(-1)?.score ?? "—"}
                </p>
              </>
            )}
            {done && (
              <p className="sg-result" role="status">
                {game === "skateboard"
                  ? `${scoreOf(run).toFixed(2)} seconds`
                  : `${scoreOf(run)} ${game === "darts" ? "points" : "baskets"}`}{" "}
                · {message}
              </p>
            )}
          </>
        )}
      </div>
      <div className="sg-controls">
        {!active ? (
          <button className="sg-primary" onClick={begin}>
            {done ? "Play again" : "Start game"} · {info.hours * 60}m / {info.energy} energy
          </button>
        ) : (
          <>
            {game === "basketball" && (
              <button
                className="sg-primary"
                disabled={run?.kind === "basketball" && run.data.phase !== "aim"}
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.currentTarget.setPointerCapture(e.pointerId);
                  act(true);
                }}
                onPointerUp={() => act(false)}
                onPointerCancel={() => {
                  const r = live.current;
                  if (r?.kind === "basketball") update({ ...r, data: { ...r.data, held: null } });
                }}
                onLostPointerCapture={() => {
                  const r = live.current;
                  if (r?.kind === "basketball" && r.data.held !== null)
                    update({ ...r, data: { ...r.data, held: null } });
                }}
              >
                Hold Shoot, release to throw
              </button>
            )}
            {game === "skateboard" &&
              (run?.kind === "skateboard" && run.data.phase === "approach" ? (
                <button className="sg-primary" onClick={() => act(true)}>
                  Jump onto rail · Space
                </button>
              ) : (
                <div className="sg-directions">
                  {controlButton(-1, "← Left")}
                  {controlButton(1, "Right →")}
                </div>
              ))}
            {game === "darts" && (
              <>
                <div className="sg-directions">
                  {controlButton(-1, "← Aim left")}
                  {controlButton(1, "Aim right →")}
                </div>
                <button className="sg-primary" onClick={() => act(true)}>
                  Throw dart · Space
                </button>
              </>
            )}
          </>
        )}
      </div>
      <footer>
        <button onClick={onExit}>← Leave game</button>
        <p role="status">{message}</p>
      </footer>
      {rules && (
        <div
          className="sg-rules"
          role="dialog"
          aria-modal="true"
          aria-label={`${info.title} rules`}
        >
          <h3>How to play</h3>
          <p>{INSTRUCTIONS[game]}</p>
          <p>
            Each run costs {info.hours * 60} minutes and {info.energy} energy. Best scores save;
            stat rewards are limited to once per day.
          </p>
          <button className="sg-primary" onClick={() => setRules(false)}>
            Got it
          </button>
        </div>
      )}
    </section>
  );
}
