import { useEffect, useRef, useState, type PointerEvent } from "react";
import { ArrowUp, Pause, Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RulesSheet } from "@/components/casino/CasinoShell";
import type { GameState } from "@/lib/game-state";
import { accuracy, finishBasketball, startSession, type BasketballMode } from "@/lib/minigames";
import { playActionCue } from "@/lib/action-audio";
import { ARCADE_COURT as C, SHOOTOUT_SECONDS, projectCourt, rimOutline, simulateArcadeShot, swipeVelocity, type ArcadeFlight, type Vec3 } from "@/lib/basketball-arcade";
import { useAutoPause, useFrameLoop } from "./hooks";
import { MinigameShell, PauseOverlay, ResultCard, markHelpSeen } from "./MinigameShell";
import "./basketball-arcade.css";

type Mode = Extract<BasketballMode, "timed" | "practice">;
type Phase = "menu" | "play" | "result";
type Flight = { simulation: ArcadeFlight; elapsed: number; index: number };
type Run = { left: number; made: number; shots: number; streak: number; flight: Flight | null; cooldown: number; net: number; over: boolean };
const fresh = (): Run => ({ left: SHOOTOUT_SECONDS, made: 0, shots: 0, streak: 0, flight: null, cooldown: 0, net: 0, over: false });
const point = (p: Vec3) => { const q = projectCourt(p); return `${q.x.toFixed(2)},${q.y.toFixed(2)}`; };
const polygon = (points: Vec3[]) => points.map(point).join(" ");
const release = projectCourt(C.release);
const rim = projectCourt(C.hoop);
const board = polygon([
  { x: -1, y: C.boardTop, z: C.boardZ }, { x: 1, y: C.boardTop, z: C.boardZ },
  { x: 1, y: C.boardBottom, z: C.boardZ }, { x: -1, y: C.boardBottom, z: C.boardZ },
]);
const target = polygon([
  { x: -.32, y: 3.6, z: C.boardZ }, { x: .32, y: 3.6, z: C.boardZ },
  { x: .32, y: 3.08, z: C.boardZ }, { x: -.32, y: 3.08, z: C.boardZ },
]);

export function BasketballGame({ state, onChange, onExit, sound = true }: {
  state: GameState; onChange: (s: GameState) => void; onExit: () => void; sound?: boolean;
}) {
  const [phase, setPhase] = useState<Phase>("menu");
  const [mode, setMode] = useState<Mode>("timed");
  const [paused, setPaused] = useState(false);
  const [help, setHelp] = useState(false);
  const [status, setStatus] = useState("The park's least official league.");
  const [hud, setHud] = useState({ score: 0, shots: 0, streak: 0, left: SHOOTOUT_SECONDS });
  const [callout, setCallout] = useState("");
  const [result, setResult] = useState<{ headline: string; lines: string[]; best: boolean } | null>(null);
  const run = useRef(fresh());
  const paid = useRef(false), finished = useRef(false);
  const latest = useRef({ state, mode, phase, paused: paused || help });
  latest.current = { state, mode, phase, paused: paused || help };
  const ball = useRef<SVGGElement>(null), shadow = useRef<SVGEllipseElement>(null), net = useRef<SVGGElement>(null);
  const aim = useRef<SVGPathElement>(null);
  const drag = useRef<{ x: number; y: number; start: number; id: number } | null>(null);
  const keyboardStart = useRef<number | null>(null);
  const aimOffset = useRef(0);
  const cancel = () => { drag.current = null; keyboardStart.current = null; aim.current?.setAttribute("d", ""); };
  useAutoPause(() => { cancel(); if (latest.current.phase === "play") setPaused(true); });
  useEffect(() => { if (paused || help) cancel(); }, [paused, help]);

  const updateHud = () => {
    const r = run.current;
    setHud({ score: r.made, shots: r.shots, streak: r.streak, left: Math.ceil(r.left) });
  };
  const paint = () => {
    const r = run.current, f = r.flight;
    const current = f?.simulation.frames[Math.min(f.index, f.simulation.frames.length - 1)];
    let position = current;
    const next = f?.simulation.frames[f.index + 1];
    if (current && next && f) {
      const t = Math.max(0, Math.min(1, (f.elapsed - current.time) / (next.time - current.time)));
      position = { ...current, x: current.x + (next.x - current.x) * t, y: current.y + (next.y - current.y) * t, z: current.z + (next.z - current.z) * t };
    }
    const p = projectCourt(position ?? C.release);
    ball.current?.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${p.radius / 40}) rotate(${f ? f.elapsed * 220 : 0})`);
    const ground = projectCourt({ ...(position ?? C.release), y: 0 });
    shadow.current?.setAttribute("cx", String(ground.x)); shadow.current?.setAttribute("cy", String(Math.min(550, ground.y)));
    shadow.current?.setAttribute("rx", String(p.radius * .85));
    net.current?.setAttribute("transform", `translate(${rim.x} ${rim.y}) scale(1 ${1 + Math.sin(r.net * 25) * r.net * .35}) translate(${-rim.x} ${-rim.y})`);
  };
  const finish = (completed: boolean) => {
    if (finished.current) return;
    finished.current = true; run.current.over = true; cancel();
    const r = run.current;
    const outcome = finishBasketball(latest.current.state, latest.current.mode, r.made, r.shots, completed);
    onChange(outcome.next);
    if (completed) {
      setResult({ headline: `${r.made} basket${r.made === 1 ? "" : "s"}`, lines: [`${r.made}/${r.shots} shots · ${accuracy(r.made, r.shots)}% accuracy`, ...outcome.notes], best: outcome.newBest });
      setPhase("result"); setStatus(outcome.newBest ? "New park record. Still no scouts." : "Round over.");
    }
  };
  const shoot = (dx: number, up: number, ms: number) => {
    const r = run.current, l = latest.current;
    cancel();
    if (l.phase !== "play" || l.paused || r.over || r.flight || r.cooldown > 0 || (l.mode === "timed" && r.left <= 0)) return;
    const velocity = swipeVelocity(dx, up, ms);
    if (!velocity) return;
    r.flight = { simulation: simulateArcadeShot(velocity), elapsed: 0, index: 0 };
    r.shots++; setCallout(""); setStatus("Ball in the air…"); updateHud();
  };
  useFrameLoop((dtMs) => {
    const r = run.current, dt = dtMs / 1000;
    if (r.over) return;
    r.cooldown = Math.max(0, r.cooldown - dt); r.net = Math.max(0, r.net - dt);
    if (latest.current.mode === "timed") {
      const old = Math.ceil(r.left); r.left = Math.max(0, r.left - dt);
      if (old !== Math.ceil(r.left)) updateHud();
      if (r.left === 0) cancel();
    }
    const f = r.flight;
    if (f) {
      f.elapsed += dt;
      const frames = f.simulation.frames;
      while (f.index + 1 < frames.length && (frames[f.index + 1]?.time ?? Infinity) <= f.elapsed) {
        f.index++;
        const frame = frames[f.index];
        if (frame?.basket) {
          r.made++; r.streak++; r.net = .6; updateHud();
          setCallout(r.streak >= 3 ? "HEATING UP!" : f.simulation.swish ? "SWISH!" : "IN!");
          setStatus(f.simulation.swish ? "Nothing but net." : "Ugly baskets count too."); playActionCue("success", sound);
        } else if (frame?.contact === "rim" || frame?.contact === "board") {
          setCallout(frame.contact === "rim" ? "CLANG!" : "OFF THE GLASS!");
        }
      }
      const last = frames.at(-1);
      if (last && f.elapsed >= last.time + .08) {
        if (!f.simulation.made) {
          r.streak = 0; updateHud();
          const hit = f.simulation.contacts.some((c) => c !== "floor");
          setCallout(hit ? "CLANG!" : "AIRBALL!"); setStatus(hit ? "The iron remains undefeated." : "Somewhere, a pigeon is worried.");
          playActionCue("failure", sound);
        }
        r.flight = null; r.cooldown = .12;
      }
    }
    paint();
    // A shot released before the buzzer finishes visibly; no shots after zero.
    if (latest.current.mode === "timed" && r.left <= 0 && !r.flight) finish(true);
  }, phase === "play" && !paused && !help);

  const handlers = useRef({ shoot }); handlers.current = { shoot };
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (latest.current.phase !== "play" || latest.current.paused) return;
      if (e.code === "ArrowLeft" || e.code === "ArrowRight") {
        e.preventDefault(); aimOffset.current = Math.max(-120, Math.min(120, aimOffset.current + (e.code === "ArrowLeft" ? -10 : 10)));
        setStatus(aimOffset.current === 0 ? "Aim: centre" : `Aim: ${Math.abs(aimOffset.current)} ${aimOffset.current < 0 ? "left" : "right"}`);
      }
      if (e.code === "Space") { e.preventDefault(); if (!e.repeat) keyboardStart.current = performance.now(); }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code !== "Space" || keyboardStart.current === null) return;
      e.preventDefault();
      const ms = performance.now() - keyboardStart.current;
      handlers.current.shoot(aimOffset.current, Math.max(32, Math.min(290, ms * .56)), ms);
    };
    window.addEventListener("keydown", down); window.addEventListener("keyup", up);
    return () => { window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
  }, []);
  const coords = (e: PointerEvent<HTMLDivElement>) => {
    const bounds = e.currentTarget.querySelector("svg")?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return null;
    const scale = Math.min(bounds.width / 400, bounds.height / 560);
    return { x: (e.clientX - bounds.left - (bounds.width - 400 * scale) / 2) / scale, y: (e.clientY - bounds.top - (bounds.height - 560 * scale) / 2) / scale };
  };
  const pointerDown = (e: PointerEvent<HTMLDivElement>) => {
    const r = run.current;
    if (e.button !== 0 || latest.current.paused || drag.current || r.flight || r.cooldown > 0 || r.over) return;
    const p = coords(e); if (!p) return;
    e.preventDefault(); e.currentTarget.setPointerCapture?.(e.pointerId);
    drag.current = { ...p, start: performance.now(), id: e.pointerId }; setCallout("");
  };
  const start = () => {
    if (!paid.current) {
      const session = startSession(latest.current.state, "basketball");
      if (!session.ok) { setStatus(session.message); return; }
      onChange(session.next); paid.current = true;
    }
    run.current = fresh(); finished.current = false; cancel(); aimOffset.current = 0;
    setHud({ score: 0, shots: 0, streak: 0, left: SHOOTOUT_SECONDS });
    setResult(null); setCallout(""); setPaused(false); setPhase("play"); setStatus("The park's least official league.");
  };
  const leave = () => { if (latest.current.phase === "play" && run.current.shots > 0) finish(false); onExit(); };
  const closeHelp = () => { markHelpSeen("basketball"); setHelp(false); };

  return <MinigameShell kicker="Park court" title="Basketball" background="var(--basketball-sky)"
    status={status} helpOpen={help} onHelp={() => { cancel(); setHelp(true); }} onLeave={leave}
    paused={phase === "play" ? paused : undefined}
    onTogglePause={phase === "play" && !help ? () => { cancel(); setPaused((p) => !p); } : undefined}
    hud={phase === "play" ? <><span data-testid="hud-score">Score {hud.score} · Shots {hud.shots}</span><span data-testid="hud-time">{mode === "timed" ? `${hud.left}s` : "Practice ∞"}</span><span data-testid="hud-streak">Streak {hud.streak}</span></> : null}
    dock={phase === "menu" ? <Button className="mg-btn mg-btn-primary w-full" onClick={start}><Play size={18}/>Start · {mode === "timed" ? "30-Second Shootout" : "Practice"}</Button> : phase === "play" && mode === "practice" ? <Button className="mg-btn w-full" onClick={() => { cancel(); run.current.flight = null; finish(true); }}>Finish practice</Button> : undefined}>
    <div className="bb-arcade relative h-full">
      <div className="bb-court mg-play-area" role="application" aria-label="Swipe shooting area" tabIndex={phase === "play" ? 0 : -1}
        onPointerDown={phase === "play" ? pointerDown : undefined}
        onPointerMove={(e) => { const d = drag.current, p = coords(e); if (!d || d.id !== e.pointerId || !p) return; aim.current?.setAttribute("d", `M${d.x} ${d.y}L${p.x} ${p.y}`); }}
        onPointerUp={(e) => { const d = drag.current, p = coords(e); if (!d || d.id !== e.pointerId) return; if (p) shoot(p.x - d.x, d.y - p.y, performance.now() - d.start); else cancel(); }}
        onPointerCancel={cancel} onLostPointerCapture={cancel} onContextMenu={(e) => e.preventDefault()}>
        <svg viewBox="0 0 400 560" preserveAspectRatio="xMidYMid meet" aria-label="First-person outdoor basketball court" role="img">
          <rect width="400" height="560" fill="var(--basketball-sky)"/>
          <circle cx="338" cy="45" r="24" fill="var(--basketball-sun)"/>
          <path d="M0 220V170L22 150L42 173L58 148L80 170L100 162L125 185L154 161L175 185L225 166L260 180L284 152L310 174L338 144L365 171L400 157V290H0Z" fill="var(--town-leaf-light)" stroke="var(--town-ink)" strokeWidth="2"/>
          <path d="M0 260H400V560H0Z" fill="var(--basketball-court)"/>
          <path d="M0 260H400M0 560L155 260M400 560L245 260M100 560L177 260M300 560L223 260M100 425Q200 390 300 425" fill="none" stroke="var(--town-crossing)" strokeWidth="3"/>
          <g stroke="var(--town-ink)" strokeWidth="2" opacity=".45"><path d="M0 245H400M0 229H400"/>{Array.from({length: 17}, (_, i) => <path key={i} d={`M${i*25} 225v35`}/>)}</g>
          <g data-testid="hoop" stroke="var(--town-ink)" strokeWidth="2.5" strokeLinejoin="round">
            <path d={`M${point({ x: 0, y: 0, z: 6.1 })}L${point({ x: 0, y: 3.4, z: 6.1 })}`} strokeWidth="9"/>
            <polygon points={board} fill="var(--basketball-board)"/>
            <polygon points={target} fill="none" stroke="var(--basketball-rim)" strokeWidth="3"/>
            <path d={`M${point({ x: 0, y: C.hoop.y, z: C.boardZ })}L${point({ x: 0, y: C.hoop.y, z: C.hoop.z + C.rimRadius })}`} stroke="var(--basketball-rim)" strokeWidth="4"/>
            <g ref={net} data-testid="net" stroke="var(--basketball-net)" strokeWidth="1.6" fill="none">
              {Array.from({ length: 12 }, (_, i) => {
                const a = i / 12 * Math.PI * 2, b = a + .8;
                return <path key={i} d={`M${point({ x: Math.cos(a)*C.rimRadius, y: C.hoop.y, z: C.hoop.z+Math.sin(a)*C.rimRadius })}L${point({ x: Math.cos(b)*.24, y: 2.48, z: C.hoop.z+Math.sin(b)*.24 })}`}/>;
              })}
              <path d={rimOutline(.33, 2.77)}/><path d={rimOutline(.24, 2.48)}/>
            </g>
            <path d={rimOutline()} fill="none" stroke="var(--basketball-rim)" strokeWidth="4"/>
          </g>
          <g fill="var(--town-paper)" stroke="var(--town-ink)" strokeWidth="3" strokeLinecap="round">
            <path d="M46 299l-10 9m24-9 10 9M340 299l-10-6m24 6 11-6"/><circle cx="53" cy="296" r="10"/><circle cx="347" cy="296" r="10"/>
          </g>
          <text x="53" y="332" textAnchor="middle" className="bb-scenery-text">NO SCOUTS.</text><text x="347" y="332" textAnchor="middle" className="bb-scenery-text">JUST GUS.</text>
          <ellipse ref={shadow} cx="200" cy="550" rx="35" ry="7" fill="var(--town-shadow)" opacity=".18"/>
          <g ref={ball} data-testid="basketball-ball" transform={`translate(${release.x} ${release.y}) scale(${release.radius / 40})`}>
            <circle r="40" fill="var(--basketball-ball)" stroke="var(--town-ink)" strokeWidth="2.5"/>
            <path d="M-40 0H40M0-40V40M-28-28Q12 0-28 28M28-28Q-12 0 28 28" fill="none" stroke="var(--town-ink)" strokeWidth="2"/>
            <path d="M-20-28Q-8-35 3-32" stroke="var(--basketball-highlight)" strokeWidth="5" strokeLinecap="round"/>
          </g>
          <path ref={aim} fill="none" stroke="var(--basketball-net)" strokeWidth="4" strokeDasharray="8 6"/>
        </svg>
      </div>
      {phase === "menu" && <div className="bb-menu">
        <h3>Park Shootout</h3>
        <div role="radiogroup" aria-label="Mode" className="grid gap-2">
          <Button role="radio" aria-checked={mode === "timed"} className={`mg-btn ${mode === "timed" ? "mg-btn-primary" : ""}`} onClick={() => setMode("timed")}>30-Second Shootout</Button>
          <Button role="radio" aria-checked={mode === "practice"} className={`mg-btn ${mode === "practice" ? "mg-btn-primary" : ""}`} onClick={() => setMode("practice")}>Practice</Button>
        </div>
        <p>Best 30s: {state.bbBestTimed} · Lifetime {state.bbMade}/{state.bbShots}</p>
        <p>30 minutes · 8 energy per visit</p>
      </div>}
      {phase === "play" && callout && <div className="bb-callout" key={`${hud.shots}-${callout}`} aria-live="polite" data-testid="callout">{callout}</div>}
      {phase === "play" && paused && <PauseOverlay onResume={() => setPaused(false)} onLeave={leave}/>}
      {phase === "result" && result && <div className="bb-results"><ResultCard title="Round over" {...result} actions={<>
        <Button className="mg-btn mg-btn-primary" onClick={start}><RotateCcw size={18}/>Play again</Button>
        <Button className="mg-btn" onClick={() => setPhase("menu")}>Change mode</Button>
        <Button className="mg-btn" onClick={leave}>Leave court</Button>
      </>}/></div>}
    </div>
    {help && <RulesSheet title="How to play basketball" onClose={closeHelp}>
      <ul className="list-disc space-y-2 pl-5">
        <li>Swipe up on the ball or court and release. A medium straight swipe is a good starting shot.</li>
        <li>Swipe left or right to aim; longer, faster swipes add power. Mouse drags work too.</li>
        <li>Keyboard: hold Space briefly and release to shoot; left/right arrows adjust aim.</li>
        <li>Each basket scores one. Shots released before the buzzer can still finish. Pause stops the clock.</li>
        <li>Practice has no records or rewards. A scoring shootout earns Strength +1, once a day.</li>
      </ul>
    </RulesSheet>}
  </MinigameShell>;
}
