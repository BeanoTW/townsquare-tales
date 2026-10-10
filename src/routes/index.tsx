import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadGame, saveGame, type GameState } from "@/lib/game-state";
import { TownMap } from "@/components/TownMap";
import { DayClock } from "@/components/DayClock";
import { playActionCue } from "@/lib/action-audio";
import { encounterForDay } from "@/lib/world-encounters";
import { LocationScene, type Feedback } from "@/components/LocationScene";
import { timeLabel } from "@/lib/day-cycle";
import { FURNITURE, ownsFurniture } from "@/lib/furniture";
import { CAREERS, currentRole, nextRole } from "@/lib/careers";
import { HOUSES, SCHOOLS, START } from "@/lib/game-data";
import { EAT_SNACK, runAction, type ActionDef } from "@/lib/actions";
import { isPlace, roomFor, type PlaceId } from "@/lib/rooms";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stick Town — Level Up, Go Legit or Go Crooked" },
      {
        name: "description",
        content:
          "A tiny stick-figure life sim. Train, study, work or hustle. Upgrade your house and meet strange people around town.",
      },
      { property: "og:title", content: "Stick Town" },
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
type Encounter = { text: string; choices: { label: string; f: (s: S) => [Partial<S>, string] }[] };

const ENCOUNTERS: {
  text: string;
  choices: { label: string; f: (s: S) => [Partial<S>, string] }[];
}[] = [
  {
    text: "The diner owner is short on change and asks for a hand before the lunch rush.",
    choices: [
      {
        label: "Help serve customers (1h)",
        f: (s) => [
          { money: s.money + 15, cha: s.cha + 1 },
          "The lunch rush clears. +$15, +1 charm.",
        ],
      },
      { label: "Say you're busy", f: () => [{}, "You wish the owner luck and carry on."] },
    ],
  },
  {
    text: "A nervous customer outside the shop offers you a suspiciously cheap watch.",
    choices: [
      {
        label: "Buy the watch ($40)",
        f: (s) =>
          s.money >= 40
            ? [
                { money: s.money - 40, karma: s.karma - 2 },
                "The watch looks real enough. -$40, -2 karma.",
              ]
            : [{}, "You need $40 for the watch."],
      },
      { label: "Walk away", f: () => [{}, "You leave the stranger to find another customer."] },
    ],
  },
  {
    text: "A bar regular is arguing loudly with a friend. The atmosphere is getting tense.",
    choices: [
      {
        label: "Calm things down",
        f: (s) => [{ cha: s.cha + 2, karma: s.karma + 1 }, "They settle down. +2 charm, +1 karma."],
      },
      {
        label: "Join the argument",
        f: (s) => [
          { karma: s.karma - 2, cha: s.cha + 1 },
          "A spectacular argument. +1 charm, -2 karma.",
        ],
      },
    ],
  },
  {
    text: "Someone has dropped a wallet near the busier shops.",
    choices: [
      {
        label: "Hand it in",
        f: (s) => [
          { karma: s.karma + 3, cha: s.cha + 1 },
          "The grateful owner finds you later. +3 karma, +1 charm.",
        ],
      },
      {
        label: "Keep the cash",
        f: (s) => [{ money: s.money + 50, karma: s.karma - 4 }, "You pocket $50. -4 karma."],
      },
    ],
  },
  {
    text: "A student is struggling with homework outside Stick U.",
    choices: [
      {
        label: "Help them study",
        f: (s) => [
          { int: s.int + 2, karma: s.karma + 1 },
          "They finally understand it. +2 intelligence, +1 karma.",
        ],
      },
      {
        label: "Trade your notes ($10)",
        f: (s) => [{ money: s.money + 10, karma: s.karma - 1 }, "Sold your notes. +$10, -1 karma."],
      },
    ],
  },
  {
    text: "A colleague near MegaCorp has spotted a mistake in a report.",
    choices: [
      {
        label: "Help correct it",
        f: (s) => [{ int: s.int + 1, cha: s.cha + 1 }, "Report saved. +1 intelligence, +1 charm."],
      },
      {
        label: "Take credit",
        f: (s) => [
          { cha: s.cha + 2, karma: s.karma - 2 },
          "The boss is impressed. Your colleague isn't. +2 charm, -2 karma.",
        ],
      },
    ],
  },
  {
    text: "A stranger in the alley offers an off-the-books delivery job.",
    choices: [
      {
        label: "Take the delivery",
        f: (s) => [
          { money: s.money + 65, heat: s.heat + 1, karma: s.karma - 2 },
          "Paid $65, but the police noticed. +1 heat, -2 karma.",
        ],
      },
      { label: "Decline", f: () => [{}, "You decide it's not worth the risk."] },
    ],
  },
];

function Game() {
  const [s, setS] = useState<S>(START);
  const [saveReady, setSaveReady] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [log, setLog] = useState<string[]>([
    "Welcome to Stick Town. You live in a box. Good luck.",
  ]);
  const [place, setPlace] = useState<PlaceId | null>(null);
  const [tab, setTab] = useState<"player" | "log" | "settings" | null>(null);
  const [enc, setEnc] = useState<Encounter | null>(null);
  const [encounterDone, setEncounterDone] = useState<number | null>(null);
  const [result, setResult] = useState<Feedback | null>(null);

  // SSR and the initial browser render must agree. Load the save only after hydration.
  useEffect(() => {
    setS(loadGame(START));
    setSaveReady(true);
  }, []);
  // Never overwrite a player's existing save with SSR defaults during hydration.
  useEffect(() => {
    if (saveReady) saveGame(s);
  }, [s, saveReady]);

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
    const outcome = runAction(s, def, Math.random);
    if (!outcome.ok) return notify(outcome.message, false);
    setS(outcome.next);
    notify(outcome.message, true, outcome.hoursUsed, outcome.changes);
  };

  const walk = (id: PlaceId) => {
    setResult(null);
    setPlace(id);
  };
  const encounterSpot = encounterDone === s.day ? null : encounterForDay(s.day);
  const approachEncounter = () => {
    if (!encounterSpot) return;
    setPlace(null);
    setTab(null);
    setResult(null);
    // Each encounter draws from a situation suited to its location.
    const choices: Record<string, number> = {
      diner: 0,
      shop: 1,
      bar: 2,
      school: 4,
      work: 5,
      alley: 6,
    };
    setEnc(ENCOUNTERS[choices[encounterSpot.id] ?? 3] ?? null);
    playActionCue("encounter", soundOn);
    setEncounterDone(s.day);
  };

  const resolveEncounter = (f: (st: S) => [Partial<S>, string]): ActionDef => ({
    id: "encounter",
    label: "Encounter",
    hours: 0,
    energy: 0,
    resolve: (st) => {
      const [patch, message] = f(st);
      return { patch, message };
    },
  });

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
  const won = s.house === 3 && s.career === 0 && s.job === 4;

  const close = () => {
    setPlace(null);
  };
  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground font-hand">
      <TownMap
        hour={s.hour}
        house={s.house}
        speed={s.trainers ? 1.35 : 1}
        active={place}
        encounter={encounterSpot}
        onEncounter={approachEncounter}
        onEnter={(id) => {
          if (isPlace(id)) walk(id);
        }}
      />

      {/* top HUD: always visible, including inside buildings */}
      <div className="pointer-events-none absolute z-40 inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <DayClock day={s.day} hour={s.hour} money={s.money} energy={s.energy} />
        <div className="pointer-events-auto flex shrink-0 flex-row gap-1 sm:gap-2">
          <Icon label="Player" onClick={() => setTab("player")}>
            👤
          </Icon>
          <Icon label="Journal" onClick={() => setTab("log")}>
            📜
          </Icon>
          <Icon label="Settings" onClick={() => setTab("settings")}>
            ⚙️
          </Icon>
        </div>
      </div>

      {log[0] && !place && !enc && !tab && (
        <div className="pointer-events-none absolute inset-x-3 bottom-4 mx-auto max-w-md rounded-sm border-2 border-foreground bg-card/90 px-3 py-1 text-center text-base">
          {log[0]}
        </div>
      )}

      {enc && (
        <Sheet title={encounterSpot?.title ?? "A town encounter"}>
          <p className="text-lg">{enc.text}</p>
          {enc.choices.map((c) => (
            <Btn
              key={c.label}
              onClick={() => {
                perform(resolveEncounter(c.f));
                setEnc(null);
              }}
            >
              {c.label}
            </Btn>
          ))}
          <Btn onClick={() => setEnc(null)}>Walk away</Btn>
        </Sheet>
      )}

      {!enc && place && !tab && (
        <LocationScene
          key={place}
          room={roomFor(place, s)}
          state={s}
          feedback={result}
          onRun={perform}
          onLeave={close}
        />
      )}

      {result && !enc && !place && (
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

      {tab === "player" && (
        <Sheet title="Player" onClose={() => setTab(null)}>
          {won && (
            <div className="border-2 border-foreground bg-accent p-2 text-center text-xl">
              🏆 Mansion + CEO in {s.day} days!
            </div>
          )}
          <div className="grid grid-cols-2 gap-2 text-lg">
            <Stat k="Day" v={s.day} />
            <Stat k="Energy" v={`${s.energy}/100`} />
            <Stat k="Bank savings" v={`${s.bank}`} />
            <Stat k="Snacks" v={s.snacks} />
            <Stat
              k="Furniture"
              v={`${FURNITURE.filter((item) => ownsFurniture(s.furniture, item.id)).length}/${FURNITURE.length}`}
            />
            <Stat k="Running shoes" v={s.trainers ? "Owned" : "—"} />
            <Stat k="Alarm clock" v={s.alarm ? "Owned" : "—"} />
            <Stat k="Strength" v={s.str} />
            <Stat k="Intelligence" v={s.int} />
            <Stat k="Charm" v={s.cha} />
            <Stat k="Karma" v={`${s.karma} · ${align}`} />
            <Stat k="Heat" v={"🔥".repeat(Math.min(5, s.heat)) || "—"} />
            <Stat k="Home" v={HOUSES[s.house]?.name ?? "Cardboard Box"} />
            <Stat k="Career" v={CAREERS[s.career]?.name ?? "Corporate"} />
            <Stat k="Job" v={job.name} />
            <Stat k="Work XP" v={s.xp} />
            <Stat k="School" v={SCHOOLS[s.school] ?? "Dropout"} />
          </div>
          {s.snacks > 0 && <Btn onClick={() => perform(EAT_SNACK)}>Eat snack (+25 energy)</Btn>}
          {nextJob && (
            <p className="text-sm text-muted-foreground">
              Next role: {nextJob.name} · ${nextJob.pay}/hour
            </p>
          )}
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
          <p className="text-base text-muted-foreground">
            Tap the ground to walk. Tap a building to go inside. In a building, tap an object to
            act. Escape closes a panel, then leaves.
          </p>
          <Btn onClick={() => setSoundOn((v) => !v)}>
            🔊 Action sounds: {soundOn ? "On" : "Off"}
          </Btn>
          <Btn
            onClick={() => {
              if (confirm("Start a new life?")) {
                setS(START);
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

function Icon(p: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      aria-label={p.label}
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
function Btn(p: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={p.onClick}
      className="text-left text-lg border-2 border-foreground px-3 py-1 rounded-sm bg-secondary hover:bg-primary hover:text-primary-foreground"
    >
      {p.children}
    </button>
  );
}
