import { buyWeapon, weaponName, weaponBlock } from "@/lib/counter-robbery";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { loadGame, saveGame, type GameState } from "@/lib/game-state";
import { backupSave, localSlots, saveSlot, readSlot, exportSave, importSave, type SlotSummary } from "@/lib/save-vault";
import { GOD_ENABLED_KEY, GOD_SAVE_KEY, parseGodSave, runGodAction } from "@/lib/god-mode";
import { Button } from "@/components/ui/button";
import { recordStreetIncident, streetAction, type StreetObjectId } from "@/lib/street-life";
import { canDrive, driveAction } from "@/lib/transport";
import { TownMap } from "@/components/TownMap";
import { GlobalRenderingDiagnostics } from "@/components/GlobalRenderingDiagnostics";
import { PlayerDashboard, InventoryDashboard } from "@/components/CharacterDashboards";
import { ActionVignette, VIGNETTE_TITLES, vignetteForAction, type VignetteKind } from "@/components/ActionVignette";
import { SceneStage } from "@/components/scenes/SceneStage";
import { webglAvailable } from "@/components/home3d/Home3DStage";
import { karmaHeadColor } from "@/lib/player-appearance";
import { cardStage, milestoneStage, type StageSpec } from "@/lib/scene-stage";
import { CUTSCENE_MODE_KEY, milestoneFor, readCutsceneMode, type CutsceneMode } from "@/lib/milestones";
import type { CutsceneClaim } from "@/lib/cutscenes";
import { DayClock } from "@/components/DayClock";
import { playActionCue } from "@/lib/action-audio";
import { RESIDENT_FAVOURS, activeFavour, favourChoices, favourObjective, favourVisitAction } from "@/lib/resident-favours";
import { availableStreetEvent, streetEncounter, type StreetEncounter } from "@/lib/street-encounters";
import { conversation, recordConversation, hasTalkedToday, RELATION_FIELDS, type ResidentId } from "@/lib/living-town";
import { BlackjackGame } from "@/components/casino/BlackjackGame";
import { SlotsGame } from "@/components/casino/SlotsGame";
import { LocationScene, type Feedback } from "@/components/LocationScene";
import { MIN_BET, canSit, type CasinoGame } from "@/lib/casino";
import { timeLabel } from "@/lib/day-cycle";
import { FURNITURE, ownsFurniture } from "@/lib/furniture";
import { CAREERS, currentRole, nextRole } from "@/lib/careers";
import { HOUSES, SCHOOLS, START } from "@/lib/game-data";
import { EAT_SNACK, SELL_GOODS, ALLEY_DICE, runAction, type ActionDef } from "@/lib/actions";
import { gangReception, gangResponse, type GangMeeting } from "@/lib/street-gang";
import { gangAccess, gangDialogue, gangJob } from "@/lib/gang-career";
import { gangCarLesson, pawnIntroductionAction, attemptHotwire, repairWreck } from "@/lib/underworld";
import { WreckIgnitionGame } from "@/components/minigames/WreckIgnitionGame";
import { giveParkSmoke, parkKidDialogue } from "@/lib/park-kid";
import { hasEquippedBoard, startSession } from "@/lib/minigames";
import { DartsGame } from "@/components/minigames/DartsGame";
import { RailGrindGame } from "@/components/minigames/RailGrindGame";
import { BasketballGame } from "@/components/minigames/BasketballGame";
import { isPlace, roomFor, type PlaceId } from "@/lib/rooms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Town Square Tales — A Living Stick Town" },
      {
        name: "description",
        content:
          "A tiny stick-figure life sim. Train, study, work or hustle. Upgrade your house and meet strange people around town.",
      },
      { property: "og:title", content: "Town Square Tales — A Living Stick Town" },
      {
        property: "og:description",
        content: "Train, study, work or hustle. A tiny stick-figure life sim.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

type S = GameState;
function Game() {
  const [s, setS] = useState<S>(START);
  const [saveReady, setSaveReady] = useState(false);
  const [slots, setSlots] = useState<SlotSummary[]>([]);
  const refreshSlots = () => setSlots(localSlots());
  const [godMode, setGodMode] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [movementMode, setMovementMode] = useState<"joystick" | "tap">("joystick");
  const [lookHorizontal, setLookHorizontal] = useState<"normal" | "inverted">("normal");
  const [lookVertical, setLookVertical] = useState<"normal" | "inverted">("normal");
  const [log, setLog] = useState<string[]>([
    "Welcome to Stick Town. You live in a box. Good luck.",
  ]);
  const [place, setPlace] = useState<PlaceId | null>(null);
  const [tab, setTab] = useState<"player" | "inventory" | "log" | "settings" | null>(null);
  const [enc, setEnc] = useState<StreetEncounter | null>(null);
  const [resident, setResident] = useState<ResidentId | null>(null);
  const [gangDone, setGangDone] = useState<number | null>(null);
  const [parkKidOpen, setParkKidOpen] = useState(false);
  const [strangerLeft, setStrangerLeft] = useState<number | null>(null);
  const [gangMeeting, setGangMeeting] = useState<GangMeeting | null>(null);
  const [game, setGame] = useState<CasinoGame | null>(null);
  const [arcade, setArcade] = useState<"basketball" | "rail" | "darts" | null>(null);
  const [wreckGame, setWreckGame] = useState(false);
  const [result, setResult] = useState<Feedback | null>(null);
  const [vignette, setVignette] = useState<{ kind: VignetteKind; changes: string[]; message: string } | null>(null);
  /** Milestone scenes and the 3D action card share one stage overlay. */
  const [stage, setStage] = useState<StageSpec | null>(null);
  const [cutsceneMode, setCutsceneMode] = useState<CutsceneMode>("full");
  const [gl, setGl] = useState(false);
  /** Set by a 3D room that can act an action out in-world instead of showing the vignette card. */
  const cutsceneClaim = useRef<CutsceneClaim | null>(null);
  // Result cards are transient, unlike dialogue that requires a player decision.
  useEffect(() => {
    if (!result) return;
    const timer = window.setTimeout(() => setResult(null), 2400);
    return () => window.clearTimeout(timer);
  }, [result]);


  // Load whatever the player has saved. Releases must never erase progress.
  useEffect(() => {
    // Always launch the regular save. Developer Mode is an explicit session choice,
    // never a persisted launch preference; retain its separate progress for next time.
    const normal = loadGame(START);
    refreshSlots();
    setGodMode(false);
    setS(normal);
    try {
      window.localStorage.removeItem(GOD_ENABLED_KEY);
      setMovementMode(window.localStorage.getItem("sticktown-movement") === "tap" ? "tap" : "joystick");
      setSoundOn(window.localStorage.getItem("sticktown-sounds") !== "false");
      setLookHorizontal(window.localStorage.getItem("sticktown-look-horizontal") === "inverted" ? "inverted" : "normal");
      setLookVertical(window.localStorage.getItem("sticktown-look-vertical") === "inverted" ? "inverted" : "normal");
    } catch { /* Run with in-memory preferences when storage is unavailable. */ }
    setCutsceneMode(readCutsceneMode());
    setGl(webglAvailable());
    setSaveReady(true);
  }, []);
  // Never overwrite a player's existing save with SSR defaults during hydration.
  useEffect(() => {
    if (!saveReady) return;
    if (godMode) {
      try { window.localStorage.setItem(GOD_SAVE_KEY, JSON.stringify(s)); } catch { /* Session-only sandbox. */ }
    } else saveGame(s);
  }, [s, saveReady, godMode]);

  const toggleGodMode = () => {
    if (godMode) {
      try {
        window.localStorage.setItem(GOD_SAVE_KEY, JSON.stringify(s));
        window.localStorage.removeItem(GOD_ENABLED_KEY);
      } catch { /* Still switches back during this session. */ }
      setS(loadGame(START));
      setGodMode(false);
    } else {
      saveGame(s);
      let sandbox = parseGodSave(null, s);
      try {
        sandbox = parseGodSave(window.localStorage.getItem(GOD_SAVE_KEY), s);
        // Never persist God Mode as a launch preference.
      } catch { /* Continue with a fresh sandbox if storage is disabled. */ }
      setS(sandbox);
      setGodMode(true);
    }
    setResult(null);
    setVignette(null);
    setStage(null);
  };

  const selectMovement = (mode: "joystick" | "tap") => {
    setMovementMode(mode);
    try { window.localStorage.setItem("sticktown-movement", mode); } catch { /* Preferences stay in memory. */ }
  };
  const setLookAxis = (axis: "horizontal" | "vertical", value: "normal" | "inverted") => {
    if (axis === "horizontal") setLookHorizontal(value);
    else setLookVertical(value);
    try { window.localStorage.setItem(`sticktown-look-${axis}`, value); } catch { /* Session preference only. */ }
    window.dispatchEvent(new Event("tst:look-controls-changed"));
  };
  const selectCutscenes = (mode: CutsceneMode) => {
    setCutsceneMode(mode);
    try { window.localStorage.setItem(CUTSCENE_MODE_KEY, mode); } catch { /* Session preference still works. */ }
  };
  const selectSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { window.localStorage.setItem("sticktown-sounds", String(next)); } catch { /* Session preference still works. */ }
  };
  const say = (m: string) => setLog((l) => [m, ...l].slice(0, 30));

  const notify = (message: string, success: boolean, hours = 0, changes: string[] = []) => {
    const before = s.hour;
    const after = Math.min(24, s.hour + hours);
    const timeLine =
      success && after > before
        ? `${timeLabel(before)} → ${timeLabel(after)} · ${after - before}h used`
        : undefined;
    setResult({ message, success, changes, ...(timeLine ? { timeLine } : {}) });
    playActionCue(success ? "success" : "failure", soundOn);
    say(message);
  };

  /** Every interior and town action goes through the same rules and feedback. */
  const perform = (def: ActionDef) => {
    const outcome = godMode ? runGodAction(s, def, Math.random) : runAction(s, def, Math.random);
    if (!outcome.ok) { notify(outcome.message, false); return false; }
    setS(outcome.next);
    notify(outcome.message, true, outcome.hoursUsed, outcome.changes);
    if (cutsceneMode === "off") return true;
    // Life milestones get the big stage; everything else plays in-world when the room can, else as a card.
    const milestone = milestoneFor(s, outcome.next);
    if (milestone && gl) {
      setStage(milestoneStage(milestone, { day: s.day, house: outcome.next.house, changes: outcome.changes, message: outcome.message, mode: cutsceneMode }));
      return true;
    }
    const inWorld = cutsceneClaim.current?.({ actionId: def.id, changes: outcome.changes, before: s, after: outcome.next, short: cutsceneMode === "short" }) ?? false;
    const kind = inWorld ? null : vignetteForAction(def.id);
    if (kind && gl) setStage(cardStage(kind, { actionId: def.id, changes: outcome.changes, message: outcome.message, before: s, after: outcome.next, title: VIGNETTE_TITLES[kind], mode: cutsceneMode }));
    else if (kind) setVignette({ kind, changes: outcome.changes, message: outcome.message });
    return true;
  };

  /** Casino tables and machines: refuse politely before opening if the player can't sit down or bet. */
  const launchGame = (g: CasinoGame) => {
    const seat = canSit(s);
    if (!seat.ok) return notify(seat.message, false);
    if (s.money < MIN_BET) return notify(`You need at least $${MIN_BET} to sit down.`, false);
    setResult(null);
    setGame(g);
  };

  /** Darts at The Tipsy Stick: refuse politely if too tired, otherwise open on top of the pub (the room stays mounted, so you return exactly where you stood). */
  const launchDarts = () => {
    const ok = startSession(s, "darts");
    if (!ok.ok) return notify(ok.message, false);
    setResult(null);
    setArcade("darts");
  };

  const walk = (id: PlaceId) => {
    setResult(null);
    setStrangerLeft(s.day);
    setEnc(null);
    setParkKidOpen(false);
    if (s.parkSmokes >= 15 && !s.parkKidGone) setS(cur => ({ ...cur, parkKidGone: 1 }));
    const pickup=favourVisitAction(s,id);
    if(pickup) {
      const outcome=runAction(s,pickup);
      if(outcome.ok) {setS(current => {const latest=runAction(current,pickup);return latest.ok ? latest.next : current;});say(outcome.message);}
    }
    setPlace(id);
  };
  const approachGang = () => {
    if (gangDone === s.day || gangMeeting) {
      notify("The crew have had enough of you for today. Clear off.", false);
      return;
    }
    setPlace(null);
    setTab(null);
    setResult(null);
    const meeting = gangReception(s);
    setGangDone(s.day);
    setGangMeeting(meeting);
    notify(meeting.message, true);
    playActionCue("encounter", soundOn);
  };
  const encounterSpot = strangerLeft === s.day ? null : availableStreetEvent(s);
  const approachEncounter = () => {
    if (!encounterSpot) return;
    setPlace(null);
    setTab(null);
    setResult(null);
    setEnc(streetEncounter(encounterSpot,s));
    playActionCue("encounter", soundOn);
  };

  const job = currentRole(s);
  const nextJob = nextRole(s);
  const align =
    s.karma >= 20
      ? "Saint"
      : s.karma >= 5
        ? "Legit"
        : s.karma > -5
          ? "Neutral"
          : s.karma > -20
            ? "Crooked"
            : "Kingpin";
  const won = s.house >= 3 && s.career === 0 && s.job === 4;

  const close = () => {
    setGame(null);
    setPlace(null);
  };
  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground font-hand">
      {saveReady && <TownMap
        state={s}
        onStreetIncident={id => setS(current => recordStreetIncident(current,id))}
        paused={Boolean(place || tab || enc || resident || gangMeeting || parkKidOpen || vignette || stage || arcade || wreckGame)}
        onStreet={(id: StreetObjectId) => {
          if(id==="ramp"){
            // Without an equipped board the game opens on its requirement card instead of charging anything.
            if(hasEquippedBoard(s)){
              const ok=startSession(s,"rail");
              if(!ok.ok){setResult(null);say(ok.message);playActionCue("failure",soundOn);return false;}
            }
            setResult(null);setArcade("rail");return true;
          }
          if(id==="hoop"){
            const ok=startSession(s,"basketball");
            if(!ok.ok){setResult(null);say(ok.message);playActionCue("failure",soundOn);return false;}
            setResult(null);setArcade("basketball");return true;
          }
          const outcome=godMode ? runGodAction(s,streetAction(id),Math.random) : runAction(s,streetAction(id),Math.random);
          if(outcome.ok)setS(outcome.next);
          setResult(null);say(outcome.message);
          playActionCue(outcome.ok ? "success" : "failure",soundOn);
          return outcome.ok;
        }}
        onDrive={destination => perform(driveAction(destination))}
        onPositionChange={(x,y)=>setS(current=>({...current,playerX:x,playerY:y}))}
        onWreckRepair={() => perform(repairWreck())}
        onHotwire={() => { if (s.abandonedCar || (s.criminalTrust??0)<10 || s.hotwireLastDay===s.day || s.energy<8 || s.hour>23.5) { notify("You cannot try the wreck right now.",false); return false; } setWreckGame(true); return true; }}
        movementMode={movementMode}
        hour={s.hour}
        house={s.house}
        speed={s.skateboard && s.skateboardEquipped ? 1.5 : s.trainers ? 1.35 : 1}
        skating={Boolean(s.skateboard && s.skateboardEquipped)}
        karma={s.karma}
        active={place}
        encounter={encounterSpot}
        onEncounter={approachEncounter}
        kidPresent={!s.parkKidGone}
        onKid={() => { setEnc(null); setGangMeeting(null); setPlace(null); setParkKidOpen(true); }}
        onEnter={(id) => {
          if (id.startsWith("resident:")) {
            const who = id.slice(9) as ResidentId;
            if (RELATION_FIELDS[who]) { setResident(who); setTab(null); setPlace(null); setResult(null); }
          }
          else if (id === "gang") approachGang();
          else if (isPlace(id) && id !== "alley") walk(id);
        }}
      />}

      {vignette && <ActionVignette kind={vignette.kind} changes={vignette.changes} message={vignette.message} onDone={() => setVignette(null)} />}
      {stage && <SceneStage key={stage.key} spec={stage} head={karmaHeadColor(s.karma)} onDone={() => setStage(null)} />}

      <GlobalRenderingDiagnostics screen={game ? `Casino: ${game}` : arcade ? `Minigame: ${arcade}` : place ? `Interior: ${place}` : "Town map"} />
      {/* top HUD: always visible, including inside buildings */}
      <div className="pointer-events-none absolute z-40 inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <DayClock day={s.day} hour={s.hour} money={s.money} energy={s.energy} />
        <div className="pointer-events-auto flex shrink-0 flex-row gap-1 sm:gap-2">
          <Icon disabled={game !== null || arcade !== null} label="Player" onClick={() => setTab("player")}>
            👤
          </Icon>
          <Icon disabled={game !== null || arcade !== null} label="Inventory" onClick={() => setTab("inventory")}>🎒</Icon>
          <Icon disabled={game !== null || arcade !== null} label="Journal" onClick={() => setTab("log")}>
            📜
          </Icon>
          <Icon disabled={game !== null || arcade !== null} label="Settings" onClick={() => setTab("settings")}>
            ⚙️
          </Icon>
        </div>
      </div>

      {activeFavour(s) && !place && !tab && !enc && !resident && !gangMeeting && !parkKidOpen && !result && <div role="status" className="pointer-events-none absolute left-3 top-24 z-10 max-w-[13rem] rounded-md border border-foreground bg-card/90 px-2 py-1 text-xs">{favourObjective(s)}</div>}

      {log[0] && !result && !place && !enc && !gangMeeting && !resident && !parkKidOpen && !tab && (
        <div className="pointer-events-none absolute inset-x-3 bottom-4 mx-auto max-w-md rounded-sm border-2 border-foreground bg-card/90 px-3 py-1 text-center text-base">
          {log[0]}
        </div>
      )}

      {parkKidOpen && !place && (
        <Sheet title="Park bench regular" onClose={() => {
          setParkKidOpen(false);
          if (s.parkSmokes >= 15) setS(cur=>({...cur,parkKidGone:1}));
        }}>
          <p className="text-lg">{parkKidDialogue(s.parkSmokes)}</p>
          {s.parkSmokes < 15 && <Btn onClick={() => {
            const outcome = giveParkSmoke(s);
            if (typeof outcome === "string") { notify(outcome, false); return; }
            setS(cur => ({...cur,...outcome.patch}));
            notify(outcome.message, true);
          }}>Give one smoke</Btn>}
          <Btn onClick={() => {
            setParkKidOpen(false);
            if(s.parkSmokes >= 15) setS(cur=>({...cur,parkKidGone:1}));
          }}>Leave the bench</Btn>
        </Sheet>
      )}

      {resident && (
        <div role="dialog" aria-label={conversation(resident,s).title} className="absolute inset-x-3 bottom-3 z-30 mx-auto max-h-[65dvh] max-w-md overflow-y-auto rounded-md border-2 border-foreground bg-card p-3 shadow-lg">
          <div className="flex items-start justify-between gap-2"><h2 className="text-lg font-bold">{conversation(resident,s).title}</h2><Button size="icon" variant="ghost" aria-label="Close conversation" onClick={()=>setResident(null)}>✕</Button></div>
          <p className="text-lg">{conversation(resident,s).text}</p>
          <p className="text-sm text-muted-foreground">Relationship: {s[RELATION_FIELDS[resident]]} · {s[RELATION_FIELDS[resident]]>=4?"Friends":s[RELATION_FIELDS[resident]]<=-4?"Rivals":"Acquaintances"}</p>
          {hasTalkedToday(s,resident)
            ? <p className="text-sm">You've already had a proper chat today. Come back tomorrow.</p>
            : conversation(resident,s).choices.map(choice => (
              <Btn key={choice.label} onClick={() => {
                setS(current=>recordConversation(current,resident,choice.change,choice.karma));
                say(choice.reply);
                setResult({message:choice.reply,success:true,changes:[`Relationship ${choice.change>0?"+":""}${choice.change}`,...(choice.karma?[`Karma ${choice.karma>0?"+":""}${choice.karma}`]:[])]});
                setResident(null);
              }}>{choice.label}</Btn>
            ))}
          <div className="mt-3 grid gap-2 border-t border-foreground/20 pt-2">
            <h3 className="font-bold">Resident favour</h3>
            <p className="text-sm">{activeFavour(s) ? favourObjective(s) : favourChoices(resident,s).length ? RESIDENT_FAVOURS.find(f=>f.resident===resident)?.request : "No favour available just now. Relationships and recent errands matter."}</p>
            {favourChoices(resident,s).map(action=><Btn key={action.id} onClick={()=>{if(perform(action))setResident(null);}}>{action.label}</Btn>)}
            {result && <p role="status" className="text-sm">{result.message}</p>}
          </div>
          <div className="mt-2"><Button variant="ghost" onClick={()=>setResident(null)}>Leave them to it</Button></div>
        </div>
      )}
      {gangMeeting && (
        <Sheet title={gangMeeting.hostile ? "Trouble in the north-east green" : "The crew at the green"}>
          <p className="text-lg font-bold">{gangMeeting.message}</p>
          {gangMeeting.hostile ? (
            <>
              <p className="text-base">Strength 15 holds your ground; Charm 15 talks them down. Each response takes 15m. Leaving costs nothing.</p>
              <Btn onClick={() => { if(perform(gangResponse("stand"))) setGangMeeting(null); }}>Stand ground · 10 energy · risk $10</Btn>
              <Btn onClick={() => { if(perform(gangResponse("talk"))) setGangMeeting(null); }}>Talk them down · 4 energy · risk $5</Btn>
              {s.gangStage === 0 && <Btn onClick={() => { if(perform(gangJob("gang-initiation"))) setGangMeeting(null); }}>Ask the crew for work</Btn>}
              <Btn disabled={!!weaponBlock(s,1)} onClick={() => { if(perform(buyWeapon(1))) setGangMeeting(null); }}>Buy an ordinary bat · $180</Btn>
              <Btn onClick={() => setGangMeeting(null)}>Fine. I'm leaving.</Btn>
            </>
          ) : (
            <>
              <p className="text-base">{gangDialogue(s)}</p>
              {gangAccess(s)==="initiation" && <Btn onClick={() => { if(perform(gangJob("gang-initiation"))) setGangMeeting(null); }}>Hear them out</Btn>}
              {["probation","trusted"].includes(gangAccess(s)) && <>
                <Btn onClick={() => { if(perform(gangJob("gang-lookout"))) setGangMeeting(null); }}>Keep watch</Btn>
                <Btn onClick={() => { if(perform(gangJob("gang-courier"))) setGangMeeting(null); }}>Take a package</Btn>
                {gangAccess(s)==="trusted" && <Btn onClick={() => { if(perform(gangJob("gang-fence"))) setGangMeeting(null); }}>Meet their buyer</Btn>}
              </>}
              {(s.gangStage >= 1) && !s.abandonedCar && <Btn onClick={() => { if(perform(gangCarLesson())) setGangMeeting(null); }}>Ask about the old wreck</Btn>}
              {(s.gangRep >= 7 && (s.criminalTrust??0) >= 25 && s.karma <= -5) && !s.pawnIntroduction && <Btn onClick={() => { if(perform(pawnIntroductionAction())) setGangMeeting(null); }}>Ask who's really in charge</Btn>}
              <p className="text-sm">An ordinary bat is available to anyone. Specialist gear requires earned trust; the basic bat cannot be used for till robberies.</p>
              {([1,2] as const).map(tier => <Btn key={tier} disabled={!!weaponBlock(s,tier)} onClick={() => { if(perform(buyWeapon(tier))) setGangMeeting(null); }}>{buyWeapon(tier).label} · ${buyWeapon(tier).cost} · {buyWeapon(tier).hours}h · {buyWeapon(tier).energy} energy · {weaponBlock(s,tier) ?? buyWeapon(tier).note}</Btn>)}
              <Btn onClick={() => { perform(ALLEY_DICE); setGangMeeting(null); }}>Play street dice</Btn>
              <Btn onClick={() => setGangMeeting(null)}>Tell them to get lost</Btn>
            </>
          )}
        </Sheet>
      )}

      {enc && (
        <div role="dialog" aria-label={enc.title} className="absolute inset-x-3 bottom-3 z-30 mx-auto max-h-[65dvh] max-w-md overflow-y-auto rounded-md border-2 border-foreground bg-card p-3 shadow-lg">
          <h2 className="text-lg font-bold">{enc.title}</h2>
          <p className="text-lg">{enc.text}</p>
          {result && <p role="status" className="my-2 text-sm">{result.message}</p>}
          {enc.choices.map((c) => (
            <Btn
              key={c.label}
              onClick={() => {
                if(perform(c)) setEnc(null);
              }}
            >
              {c.label}
            </Btn>
          ))}
          <Btn onClick={() => setEnc(null)}>Walk away</Btn>
        </div>
      )}

      {!enc && !gangMeeting && !resident && !parkKidOpen && place && !tab && (
        <LocationScene
          key={place}
          room={roomFor(place, s)}
          state={s}
          godMode={godMode}
          feedback={result}
          onRun={perform}
          onMailChange={setS}
          cutsceneClaim={cutsceneClaim}
          onLeave={close}
          onLaunch={(g) => (g === "darts" ? launchDarts() : launchGame(g))}
          paused={game !== null || arcade === "darts"}
        />
      )}

      {!enc && (place === "casino" || place === "home") && game && (
        <>
          {game === "blackjack" ? (
            <BlackjackGame
              state={s}
              onChange={setS}
              onExit={() => {
                setGame(null);
                notify("You step away from the table.", true);
              }}
            />
          ) : (
            <SlotsGame
              state={s}
              onChange={setS}
              onExit={() => {
                setGame(null);
                notify("You step away from the machine.", true);
              }}
            />
          )}
        </>
      )}

      {wreckGame && <WreckIgnitionGame day={s.day} attempts={s.hotwireAttempts??0} onExit={() => setWreckGame(false)} onFinish={(won) => { perform(attemptHotwire(won)); setWreckGame(false); }} />}
      {arcade==="basketball" && (
        <BasketballGame
          sound={soundOn}
          state={s}
          onChange={setS}
          onExit={() => {
            setArcade(null);
            notify("You head back from the court.", true);
          }}
        />
      )}

      {arcade==="darts" && (
        <DartsGame
          sound={soundOn}
          state={s}
          onChange={setS}
          onExit={() => {
            setArcade(null);
            notify("You step away from the dartboard.", true);
          }}
        />
      )}

      {arcade==="rail" && (
        <RailGrindGame
          sound={soundOn}
          state={s}
          onChange={setS}
          onExit={() => {
            setArcade(null);
            notify("You roll away from the rail.", true);
          }}
        />
      )}

      {result && !enc && !gangMeeting && !resident && !parkKidOpen && !place && (
        <div
          key={result.message + String(result.timeLine)}
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute inset-x-3 top-24 z-50 mx-auto max-w-sm animate-in fade-in slide-in-from-top-2 duration-200"
        >
          <div className="pointer-events-auto rounded-xl border-2 border-foreground bg-card p-3 shadow-xl">
            <div className="flex items-start justify-between gap-2">
              <strong>{result.success ? "✓ Action complete" : "! Action unavailable"}</strong>
              <button
                onClick={() => setResult(null)}
                aria-label="Dismiss result"
                className="min-h-8 min-w-8 rounded border border-foreground"
              >
                ✕
              </button>
            </div>
            <p className="text-sm">{result.message}</p>
            {!!result.changes.length && (
              <div className="mt-2 flex flex-wrap gap-1">
                {result.changes.map((c, i) => (
                  <span key={i} className="rounded bg-secondary px-2 py-1 text-xs font-bold">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {result.timeLine && <p className="text-xs font-bold">🕒 {result.timeLine}</p>}
          </div>
        </div>
      )}

      {tab === "inventory" && (
        <Sheet title="Inventory" onClose={() => setTab(null)}>
          <InventoryDashboard state={s} onEquip={() => setS(current => ({ ...current, skateboardEquipped: current.skateboardEquipped ? 0 : 1 }))} onSnack={() => perform(EAT_SNACK)} />
          {canDrive(s) && <section aria-label="Travel shortcuts" className="mt-3 rounded-lg border border-foreground/30 p-3"><p className="mb-2 font-bold">🚗 Travel shortcuts</p><p className="mb-2 text-sm text-muted-foreground">Travel uses no in-game time, just like walking across town.</p><div className="flex flex-wrap gap-2"><Btn onClick={() => { if(perform(driveAction("home")))setTab(null); }}>Jump home</Btn>{Boolean(s.employed) && <Btn onClick={() => { if(perform(driveAction("work")))setTab(null); }}>Jump to work</Btn>}</div></section> }
        </Sheet>
      )}
      {tab === "player" && (
        <Sheet title="Player" onClose={() => setTab(null)}>
          <PlayerDashboard state={s} align={align} won={won} />
        </Sheet>
      )}
      {tab === "log" && (
        <Sheet title="Journal" onClose={() => setTab(null)}>
          <div className="max-h-[50vh] overflow-auto text-base">
            {log.map((l, i) => (
              <p key={i} className={i ? "text-muted-foreground" : ""}>
                {l}
              </p>
            ))}
          </div>
        </Sheet>
      )}
      {tab === "settings" && (

        <Sheet title="Settings" onClose={() => setTab(null)}>
          <section className="rounded-lg border-2 border-foreground p-3" aria-label="Local saves">
            <p className="font-bold text-lg">💾 Saves & backups</p>
            <p className="text-sm">Autosave stays in this browser. Manual slots and downloaded files protect your progress. Cloud sync isn't connected yet.</p>
            <p className="font-bold">Current: Day {s.day}</p>
            {[1,2,3].map(slot => {
              const stored=slots.find(item=>item.slot===slot);
              return <div key={slot} className="rounded-md border border-foreground/40 p-2 my-2">
                <p>Slot {slot}: {stored ? "Day "+stored.day : "Empty"}</p>
                <div className="flex flex-wrap gap-2">
                  <Btn onClick={()=>{if(godMode){alert("Exit Developer Mode first.");return;}if(stored&&!confirm("Overwrite this slot?"))return;if(saveSlot(slot,s))refreshSlots();else alert("Save failed.");}}>Save</Btn>
                  {stored && <Btn onClick={()=>{if(godMode){alert("Exit Developer Mode first.");return;}if(!confirm("Restore Day "+stored.day+"? The current save will be backed up."))return;const data=readSlot(slot,START);if(!data)return;backupSave(s);setS(data);saveGame(data);setPlace(null);setTab(null);refreshSlots();}}>Load</Btn>}
                </div>
              </div>;
            })}
            <Btn onClick={()=>exportSave(s)}>Download save file</Btn>
            <label className="block mt-2 text-sm">Import save JSON
              <input type="file" accept=".json,application/json" className="mt-1 block w-full" onChange={async e=>{
                const file=e.currentTarget.files?.[0];e.currentTarget.value="";if(!file)return;
                if(godMode){alert("Exit Developer Mode first.");return;}
                try{const data=importSave(await file.text(),START);if(!data){alert("Invalid Town Square Tales save.");return;}
                  if(!confirm("Import Day "+data.day+"? Current progress will be backed up."))return;
                  backupSave(s);setS(data);saveGame(data);setPlace(null);setTab(null);refreshSlots();
                }catch{alert("Couldn't read save file.");}
              }}/>
            </label>
          </section>
          <p className="text-base text-muted-foreground">
            Move using your chosen control. Tap buildings and characters to interact. Inside, tap an object to act.
          </p>
          <div className="rounded-lg border-2 border-foreground p-3">
            <div className="mb-2 flex items-center justify-between gap-2">
              <strong className="text-lg">⚡ Developer Mode</strong>
              <span className="text-xs font-bold">{godMode ? "ON" : "OFF"}</span>
            </div>
            <p className="mb-2 text-sm">
              Unlimited cash, bank balance, work XP and energy, with time frozen during actions.
              Houses, jobs, education, skills and equipment stay locked until you earn, buy or unlock them.
              This is a separate test save; normal progress is safe.
            </p>
            <Btn onClick={toggleGodMode}>{godMode ? "Disable Developer Mode · Restore normal save" : "Enable Developer Mode"}</Btn>
          </div>
          <p className="text-base font-bold">Movement controls</p>
          <div className="grid grid-cols-2 gap-2" role="group" aria-label="Movement controls">
            <button type="button" aria-pressed={movementMode === "joystick"} onClick={() => selectMovement("joystick")}
              className={`min-h-12 rounded border-2 border-foreground p-2 font-bold ${movementMode === "joystick" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              Floating joystick
            </button>
            <button type="button" aria-pressed={movementMode === "tap"} onClick={() => selectMovement("tap")}
              className={`min-h-12 rounded border-2 border-foreground p-2 font-bold ${movementMode === "tap" ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
              Tap to walk
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            {movementMode === "joystick"
              ? "Touch open ground anywhere and drag your thumb. Release to stop. Tapping buildings still works."
              : "Tap open ground to walk there. Drag controls are disabled."}
          </p>
          <p className="text-base font-bold">Interior camera swipe controls</p>
          <p className="text-sm text-muted-foreground">Choose the direction the camera responds when you swipe inside a 3D room. Horizontal and vertical are independent.</p>
          {([
            ["horizontal", lookHorizontal, "Horizontal look"],
            ["vertical", lookVertical, "Vertical look"],
          ] as const).map(([axis, value, label]) => (
            <div key={axis} className="rounded-lg border border-foreground/50 p-2">
              <p className="mb-2 text-sm font-bold">{label}</p>
              <div className="grid grid-cols-2 gap-2" role="group" aria-label={label}>
                {(["normal", "inverted"] as const).map(direction => (
                  <button key={direction} type="button" aria-pressed={value === direction}
                    onClick={() => setLookAxis(axis, direction)}
                    className={`min-h-11 rounded border-2 border-foreground p-2 text-sm font-bold ${value === direction ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                    {direction === "normal" ? "Normal" : "Inverted"}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-base font-bold">Cutscenes</p>
          <div className="grid grid-cols-3 gap-2" role="group" aria-label="Cutscenes">
            {(["full", "short", "off"] as const).map((m) => (
              <button key={m} type="button" aria-pressed={cutsceneMode === m} onClick={() => selectCutscenes(m)}
                className={`min-h-12 rounded border-2 border-foreground p-2 font-bold ${cutsceneMode === m ? "bg-primary text-primary-foreground" : "bg-secondary"}`}>
                {m === "full" ? "Full" : m === "short" ? "Short" : "Off"}
              </button>
            ))}
          </div>
          <p className="text-sm text-muted-foreground">
            {cutsceneMode === "full" ? "Actions play out in full, shortened when you repeat them the same day. Tap any scene to skip it."
              : cutsceneMode === "short" ? "Every scene plays a quick version. Milestones stay a little longer."
              : "No cutscenes. Results still show at the bottom of the screen."}
          </p>
          <Btn onClick={selectSound}>
            🔊 Action sounds: {soundOn ? "On" : "Off"}
          </Btn>
          <Btn
            onClick={() => {
              if (confirm("Start a new life? Existing progress will be backed up first.")) {
                if (!godMode) { backupSave(s); refreshSlots(); }
                if (godMode) {
                  try { window.localStorage.removeItem(GOD_SAVE_KEY); } catch { /* No storage. */ }
                }
                setS(godMode ? parseGodSave(null, START) : START);
                setLog(["New life started."]);
                setPlace(null);
                setTab(null);
                setResult(null);
              }
            }}
          >
            Restart life
          </Btn>
        </Sheet>
      )}
    </main>
  );
}

function Icon(p: { disabled?: boolean; label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={p.label}
      disabled={p.disabled}
      onClick={p.onClick}
      className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-foreground bg-card text-base shadow sm:h-11 sm:w-11 sm:text-xl"
    >
      {p.children}
    </button>
  );
}
function Sheet(p: { title: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-h-[75vh] max-w-md flex-col gap-2 overflow-auto rounded-t-xl border-2 border-b-0 border-foreground bg-card p-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">{p.title}</h2>
        {p.onClose && (
          <button aria-label="Close" onClick={p.onClose} className="text-2xl">
            ✕
          </button>
        )}
      </div>
      {p.children}
    </div>
  );
}
function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="border-2 border-foreground bg-card px-2 py-1 rounded-sm">
      <div className="text-sm text-muted-foreground">{k}</div>
      <div className="truncate">{v}</div>
    </div>
  );
}
function Btn(p: { onClick: () => void; children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      onClick={p.onClick}
      disabled={p.disabled}
      className="min-h-11 text-left text-lg border-2 border-foreground px-3 py-1 rounded-sm bg-secondary hover:bg-primary hover:text-primary-foreground"
    >
      {p.children}
    </button>
  );
}
