import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { GameState } from "@/lib/game-state";
import { beginFight, settleFight, FIGHT_BILLS, PUB_STAKES, type Fight, type FightVenue, type MoveId } from "@/lib/combat";
import { FIGHT_VENUES, MOVE_BAR, commentary, eventSeconds, fighterFor, playTurn, queueSeconds, voice, type FightEvent, type FighterLook } from "@/lib/fight-presentation";
import type { CutsceneMode } from "@/lib/conversation-camera";
import { IMPACT } from "@/components/fight/fight-acts";
import { INTRO_SECONDS, type FightPhase, type FightShow, type Popups } from "@/components/fight/FightStage";
import { BOOKIE_NAME } from "@/components/fight/Bookmaker";
import { webglAvailable } from "@/components/home3d/Home3DStage";
import { karmaHeadColor } from "@/lib/player-appearance";
import { townColor } from "@/components/town3d/palette";

const FightStage = lazy(() => import("@/components/fight/FightStage").then((m) => ({ default: m.FightStage })));

/**
 * The Tipsy Stick brawl: Ron takes the bet, the regulars make a circle, and the fight plays out in the pub in 3D.
 * Every rule (turns, AP, damage, knockouts, the bet and the hospital bill) comes from src/lib/combat.ts; this
 * screen only presents results. Settlement is applied once, the moment the engine says the fight is over, so
 * skipping or closing the ending can never skip or repeat it. Moves lock while a turn is being acted out.
 */
type Settled = { won: boolean; moneyBefore: number; money: number; health: number; debtAdded: number; debt: number; stake: number };
const reducedMotion = () => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

export function PubBrawl({ state, onChange, onExit, cutsceneMode = "full", venue = "pub" }: {
  state: GameState; onChange: (s: GameState) => void; onExit: () => void; cutsceneMode?: CutsceneMode; venue?: FightVenue;
}) {
  const preset = FIGHT_VENUES[venue];
  const [opponentIndex] = useState(() => Math.floor(Math.random() * 4));
  const opponent: FighterLook = useMemo(() => fighterFor(["Big Barry", "One-Punch Pete", "Derek the Menace", "Mad Mick's Cousin"][opponentIndex % 4]!), [opponentIndex]);
  const reduced = useMemo(reducedMotion, []);
  const [gl] = useState(() => webglAvailable());
  const [phase, setPhase] = useState<FightPhase>("wager");
  const [fight, setFight] = useState<Fight | null>(null);
  /** What the HUD shows: lags the engine until each blow lands on screen. */
  const [shown, setShown] = useState<Fight | null>(null);
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const [details, setDetails] = useState(false);
  const [error, setError] = useState("");
  const [settled, setSettled] = useState<Settled | null>(null);
  const [opponentMax, setOpponentMax] = useState(100);
  const settledOnce = useRef(false);
  const latest = useRef(state);
  latest.current = state;
  const show = useRef<FightShow>({ phase: "wager", phaseAt: performance.now(), events: [], eventsAt: 0, guards: { player: false, opponent: false }, mode: cutsceneMode, reduced });
  const popups = useRef<Popups>({ player: null, opponent: null });
  const queue = useRef<{ events: FightEvent[]; applied: number; final: Fight } | null>(null);

  const enter = useCallback((p: FightPhase) => {
    setPhase(p);
    show.current = { ...show.current, phase: p, phaseAt: performance.now() };
  }, []);

  /* ---------------------------------------------------------------- wager and introduction */
  const start = (stake: number) => {
    try {
      const f = beginFight(state, stake, venue, opponentIndex);
      setFight(f); setShown(f); setError(""); setOpponentMax(f.opponent.hp);
      setLines([`${BOOKIE_NAME.split(" ")[0]}: "$${stake} on the table. Winner takes both stakes."`]);
      if (cutsceneMode === "off") enter("fight"); else enter("intro");
    } catch (e) { setError(e instanceof Error ? e.message : String(e)); }
  };
  useEffect(() => {
    if (phase !== "intro") return;
    const len = reduced ? 1.6 : INTRO_SECONDS[cutsceneMode];
    const announce = window.setTimeout(() => setLines((l) => [...l, `${opponent.name} — ${opponent.billing}.`, opponent.intro]), len * 300);
    const go = window.setTimeout(() => enter("fight"), len * 1000);
    return () => { window.clearTimeout(go); window.clearTimeout(announce); };
  }, [phase, cutsceneMode, reduced, opponent, enter]);

  /* ---------------------------------------------------------------- turns */
  const settle = useCallback((f: Fight) => {
    if (settledOnce.current || !f.over) return;
    settledOnce.current = true;
    const s = latest.current;
    const patch = settleFight(s, f);
    const won = f.winner === "player";
    setSettled({ won, moneyBefore: s.money, money: patch.money ?? s.money, health: patch.health ?? s.health ?? 100, debtAdded: (patch.medicalDebt ?? 0) - (s.medicalDebt ?? 0), debt: patch.medicalDebt ?? 0, stake: f.stake });
    onChange({ ...s, ...patch });
  }, [onChange]);

  const turn = (move: MoveId) => {
    if (!fight || fight.over || busy || phase !== "fight") return;
    let result: ReturnType<typeof playTurn>;
    try { result = playTurn(fight, move); } catch (e) { setError(e instanceof Error ? e.message : String(e)); return; }
    setError("");
    setFight(result.fight);
    // The result is final now; the screen catches up blow by blow.
    if (result.fight.over) settle(result.fight);
    queue.current = { events: result.events, applied: 0, final: result.fight };
    show.current = { ...show.current, events: result.events, eventsAt: performance.now() };
    setBusy(true);
  };

  // Plays the queue: each blow updates the HUD and commentary as it lands; moves unlock when it's done.
  useEffect(() => {
    if (!busy) return;
    const id = window.setInterval(() => {
      const q = queue.current;
      if (!q) return;
      const s = show.current;
      const elapsed = (performance.now() - s.eventsAt) / 1000;
      let at = 0;
      q.events.forEach((e, i) => {
        const dur = eventSeconds(e, s.mode, s.reduced);
        if (i >= q.applied && elapsed >= at + dur * IMPACT[e.move]) {
          q.applied = i + 1;
          setShown(e.after);
          setLines((l) => [...l, ...commentary(e, opponent)].slice(-12));
        }
        at += dur;
      });
      if (elapsed >= queueSeconds(q.events, s.mode, s.reduced)) {
        setShown(q.final);
        show.current = { ...show.current, guards: { player: q.final.player.guard, opponent: q.final.opponent.guard } };
        setBusy(false);
        if (q.final.over) window.setTimeout(() => enter("result"), s.mode === "off" || s.reduced ? 200 : 900);
      }
    }, 40);
    return () => window.clearInterval(id);
  }, [busy, opponent, enter]);

  /** Tap the scene to hurry a turn along; the outcome is already decided, so nothing is skipped but the wait. */
  const hurry = () => {
    if (phase === "intro") { enter("fight"); return; }
    const q = queue.current;
    if (busy && q) show.current = { ...show.current, eventsAt: performance.now() - queueSeconds(q.events, show.current.mode, show.current.reduced) * 1000 };
  };

  const view = shown ?? fight;
  const playerLook = useMemo(() => ({ ...fighterFor("You"), style: "player" as const, name: "You", outfit: townColor("var(--town-player)"), skin: karmaHeadColor(state.karma), legs: "#252833", stretch: 1, bulk: 1 }), [state.karma]);
  const health = state.health ?? 100;
  const cannot = (stake: number) => (health <= 0 ? "Get patched up at the clinic first." : state.money < stake ? `You need $${stake}.` : "");

  return (
    <div className="fixed inset-0 z-[95] flex flex-col overflow-hidden bg-[#140d1a] font-hand text-foreground" data-pub-brawl data-fight-phase={phase} role="dialog" aria-modal="true" aria-label={`Brawl at ${preset.label}`}>
      {/* the pub, in 3D (or a plain backdrop without WebGL) */}
      <div className="absolute inset-0" onPointerDown={phase === "intro" || busy ? hurry : undefined} data-fight-scene>
        {gl ? <Suspense fallback={null}><FightStage preset={preset} opponent={opponent} player={playerLook} show={show} popups={popups} /></Suspense>
          : <div className="h-full w-full bg-gradient-to-b from-[#3a2232] to-[#140d1a]" />}
        <div className="pointer-events-none absolute inset-0">
          {(["player", "opponent"] as const).map((side) => (
            <span key={side} ref={(el) => { popups.current[side] = el; }} data-fight-popup={side}
              className="absolute left-0 top-0 whitespace-nowrap rounded-full border-2 border-[#111014] bg-card px-2.5 py-0.5 text-sm font-black text-foreground shadow-md data-[kind=big]:bg-[#b5413a] data-[kind=big]:text-[#fff4ea] data-[kind=hit]:bg-[#ffd24a] data-[kind=ko]:bg-[#b5413a] data-[kind=ko]:text-lg data-[kind=ko]:text-[#fff4ea] data-[kind=miss]:bg-[#e9e4d8]"
              style={{ opacity: 0, transform: "translate(-9999px,-9999px)" }} />
          ))}
        </div>
      </div>

      {/* top: both fighters, the round and the money */}
      {view && phase !== "wager" && (
        <div className="pointer-events-none relative z-10 px-2 pt-[max(env(safe-area-inset-top),8px)]" data-fight-hud>
          <div className="grid grid-cols-2 gap-2">
            <FighterCard name="You" hp={view.player.hp} max={100} ap={view.player.ap} guard={view.player.guard} active={view.turn === "player" && !busy && !view.over} />
            <FighterCard name={opponent.name} hp={view.opponent.hp} max={opponentMax} ap={view.opponent.ap} guard={view.opponent.guard} active={busy} right />
          </div>
          <div className="mt-1 flex justify-center">
            <span className="rounded-full border-2 border-[#111014] bg-[#ffd24a] px-3 py-0.5 text-xs font-black tracking-wider text-[#111014]" data-fight-round>
              ROUND {view.round} · ${view.stake} A SIDE{phase === "fight" ? (view.over ? " · K.O." : busy ? " · …" : " · YOUR MOVE") : ""}
            </span>
          </div>
        </div>
      )}

      <div className="flex-1" />
      {/* a knockout loss fades towards the clinic */}
      {phase === "result" && settled && !settled.won && <div className="pointer-events-none absolute inset-0 bg-[#0b0a12]/70 transition-opacity duration-700" data-fight-fade />}

      {/* bottom: Ron's offer, the move bar, or the result */}
      <div className="relative z-10 px-2 pb-[max(env(safe-area-inset-bottom),8px)]">
        {phase === "wager" && (
          <section className="mx-auto max-w-md rounded-2xl border-2 border-foreground bg-card/95 p-3 shadow-xl" data-bookie-offer>
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{BOOKIE_NAME}</p>
            <p className="text-xl font-black">“Fancy a scrap?”</p>
            <p className="text-sm">Pick your stake. Your opponent puts the same in; <strong>winner takes both stakes</strong>. Tonight's opponent: <strong>{opponent.name}</strong>, {opponent.billing.toLowerCase()}.</p>
            <div className="mt-2 grid grid-cols-3 gap-2">
              {PUB_STAKES.map((n) => (
                <button key={n} type="button" onClick={() => start(n)} disabled={Boolean(cannot(n))} title={cannot(n) || undefined}
                  className="min-h-12 rounded-xl border-2 border-foreground bg-secondary px-2 text-lg font-black disabled:border-dashed disabled:opacity-45">${n}</button>
              ))}
            </div>
            <p className="mt-2 text-xs">Health {health}/100 · Cash ${state.money}{health <= 0 ? " · You need treatment before you can fight." : ""} · Losing costs your stake plus a ${FIGHT_BILLS.pubLoss} hospital bill.</p>
            {error && <p role="alert" className="mt-1 text-sm font-bold text-destructive">{error}</p>}
            <button type="button" onClick={onExit} className="mt-2 min-h-11 w-full rounded-xl border-2 border-foreground bg-card font-bold">Not tonight, Ron</button>
          </section>
        )}

        {phase === "intro" && (
          <section className="mx-auto max-w-md rounded-2xl border-2 border-[#111014] bg-[#111014]/80 p-3 text-center text-[#f6efe0]" aria-live="polite" data-fight-intro>
            {lines.slice(-3).map((l, i) => <p key={i} className={i === lines.slice(-3).length - 1 ? "text-base font-bold" : "text-sm opacity-90"}>{l}</p>)}
            <button type="button" className="mt-2 min-h-11 rounded-full border-2 border-[#f6efe0]/70 px-4 text-xs font-black tracking-wider" onClick={() => enter("fight")}>SKIP ▸▸</button>
          </section>
        )}

        {phase === "fight" && view && (
          <section className="mx-auto max-w-md rounded-2xl border-2 border-foreground bg-card/95 p-2 shadow-xl" data-fight-controls>
            <div aria-live="polite" className="min-h-[2.6rem] px-1 text-sm leading-snug">
              {lines.slice(-2).map((l, i) => <p key={`${lines.length}-${i}`} className={i === 1 || lines.length === 1 ? "font-bold" : "text-muted-foreground"}>{l}</p>)}
            </div>
            <div className="mt-1 grid grid-cols-5 gap-1.5">
              {MOVE_BAR.map((m) => {
                const short = view.player.ap < m.cost;
                return (
                  <button key={m.id} type="button" data-move={m.id} onClick={() => turn(m.id)} disabled={busy || short || view.over}
                    aria-label={`${m.name}, ${m.cost} AP${short ? ", not enough AP" : ""}`}
                    className={`flex min-h-[64px] flex-col items-center justify-center rounded-xl border-2 px-0.5 py-1 text-center leading-tight ${short ? "border-dashed border-foreground/40 bg-muted text-muted-foreground" : "border-foreground bg-secondary"} ${busy && !short ? "opacity-60" : ""}`}>
                    <span className="text-[13px] font-black">{m.name.replace(" punch", "")}</span>
                    <span className="mt-0.5 flex gap-0.5" aria-hidden>{m.cost === 0 ? <span className="text-[10px] font-bold">FREE</span> : Array.from({ length: m.cost }, (_, i) => <span key={i} className={`h-1.5 w-1.5 rounded-full ${short ? "bg-foreground/30" : "bg-[#3a8adf]"}`} />)}</span>
                    <span className="text-[10px]">{short ? `Need ${m.cost} AP` : m.effect}</span>
                  </button>
                );
              })}
            </div>
            <div className="mt-1 flex items-center justify-between px-1">
              <button type="button" className="min-h-9 text-xs font-bold underline" onClick={() => setDetails((d) => !d)} aria-expanded={details}>{details ? "Hide fight log" : "Fight log"}</button>
              <span className="text-[11px] text-muted-foreground">{busy ? "Tap the fight to hurry it along" : "AP refills by 2 each turn"}</span>
            </div>
            {details && <ol className="max-h-28 overflow-y-auto px-1 text-xs" data-fight-log>{(fight?.history ?? []).map((h, i) => <li key={i}>{voice(h)}</li>)}</ol>}
            {error && <p role="alert" className="text-sm font-bold text-destructive">{error}</p>}
          </section>
        )}

        {phase === "result" && settled && (
          <ResultCard settled={settled} opponent={opponent} onExit={onExit} />
        )}
      </div>
    </div>
  );
}

function FighterCard({ name, hp, max, ap, guard, active, right = false }: { name: string; hp: number; max: number; ap: number; guard: boolean; active: boolean; right?: boolean }) {
  const pct = Math.max(0, Math.min(100, (hp / Math.max(1, max)) * 100));
  return (
    <div className={`rounded-xl border-2 border-[#111014] bg-card/95 px-2 py-1 shadow-md ${active ? "ring-2 ring-[#ffd24a]" : ""} ${right ? "text-right" : ""}`} data-fighter-card={right ? "opponent" : "player"}>
      <p className="truncate text-sm font-black">{name}{guard ? " 🛡" : ""}</p>
      <div className="h-2.5 overflow-hidden rounded-full border border-[#111014] bg-[#3a2232]" role="meter" aria-label={`${name} health`} aria-valuenow={hp} aria-valuemin={0} aria-valuemax={max}>
        <div className={`h-full ${pct > 50 ? "bg-[#4fb07a]" : pct > 25 ? "bg-[#e0b84a]" : "bg-[#b5413a]"} transition-[width] duration-300 ${right ? "ml-auto" : ""}`} style={{ width: `${pct}%` }} />
      </div>
      <div className={`mt-0.5 flex items-center gap-1 text-[11px] font-bold ${right ? "justify-end" : ""}`}>
        <span>{hp} HP</span><span aria-label={`${ap} of 5 action points`} className="flex gap-0.5">{Array.from({ length: 5 }, (_, i) => <span key={i} className={`h-2 w-2 rounded-full border border-[#111014] ${i < ap ? "bg-[#3a8adf]" : "bg-transparent"}`} />)}</span>
      </div>
    </div>
  );
}

function ResultCard({ settled, opponent, onExit }: { settled: Settled; opponent: FighterLook; onExit: () => void }) {
  if (settled.won) {
    return (
      <section className="mx-auto max-w-md rounded-2xl border-2 border-foreground bg-card/95 p-3 text-center shadow-xl" data-fight-result="won">
        <p className="text-3xl font-black text-[#2f7a52]">K.O.! YOU WIN</p>
        <p className="text-sm">{opponent.ko}</p>
        <p className="mt-2 text-2xl font-black">+${settled.stake}</p>
        <p className="text-sm">Ron counts out ${settled.stake * 2}: your ${settled.stake} back and {opponent.name}'s ${settled.stake}. Cash now ${settled.money}.</p>
        <p className="text-xs text-muted-foreground">Health {settled.health}/100 · Energy −15 · 30 minutes pass.</p>
        <button type="button" onClick={onExit} className="mt-3 min-h-12 w-full rounded-xl border-2 border-foreground bg-primary font-black text-primary-foreground">Back to the pub</button>
      </section>
    );
  }
  return (
    <section className="mx-auto max-w-md rounded-2xl border-2 border-foreground bg-[#f4f1ea] p-3 text-center shadow-xl" data-fight-result="lost">
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Patch Up Clinic</p>
      <p className="text-2xl font-black">You wake up on a trolley.</p>
      <p className="text-sm">{opponent.win}</p>
      <ul className="mt-2 space-y-0.5 text-sm font-bold">
        <li>Stake lost: −${settled.stake}</li>
        <li>Hospital bill: ${settled.debtAdded} added to medical debt (now ${settled.debt})</li>
        <li>Health: {settled.health}/100 · Energy −15 · 30 minutes pass</li>
      </ul>
      <button type="button" onClick={onExit} className="mt-3 min-h-12 w-full rounded-xl border-2 border-foreground bg-primary font-black text-primary-foreground">Limp back to the pub</button>
    </section>
  );
}
