import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadGame, saveGame, type GameState } from "@/lib/game-state";
import { TownMap } from "@/components/TownMap";
import { LocationScene } from "@/components/LocationScene";
import { FURNITURE, ownsFurniture, furnitureBonus, type FurnitureId } from "@/lib/furniture";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Stick Town — Level Up, Go Legit or Go Crooked" },
      { name: "description", content: "A tiny stick-figure life sim. Train, study, work or hustle. Upgrade your house and meet strange people around town." },
      { property: "og:title", content: "Stick Town" },
      { property: "og:description", content: "Train, study, work or hustle. A tiny stick-figure life sim." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Game,
});

type S = GameState;
const START: S = { day: 1, hour: 8, energy: 100, money: 20, str: 5, int: 5, cha: 5, karma: 0, house: 0, school: 0, job: 0, heat: 0, bank: 0, snacks: 0, trainers: 0, alarm: 0, furniture: 0 };
const HOUSES = [
  { name: "Cardboard Box", cost: 0, rest: 50 },
  { name: "Studio Flat", cost: 300, rest: 75 },
  { name: "Suburban House", cost: 2000, rest: 100 },
  { name: "Mansion", cost: 15000, rest: 100 },
];
const SCHOOLS = ["Dropout", "High School", "College", "University Degree", "PhD"];
const JOBS = [
  { name: "Burger Flipper", pay: 8, int: 0, cha: 0 },
  { name: "Cashier", pay: 14, int: 15, cha: 10 },
  { name: "Office Drone", pay: 25, int: 35, cha: 20 },
  { name: "Manager", pay: 45, int: 60, cha: 45 },
  { name: "CEO", pay: 100, int: 100, cha: 80 },
];

const PLACES = [
  { id: "home", label: "Home", x: 8, y: 18 },
  { id: "gym", label: "Gym", x: 38, y: 12 },
  { id: "school", label: "School", x: 70, y: 16 },
  { id: "work", label: "Work", x: 12, y: 62 },
  { id: "bar", label: "Bar", x: 44, y: 58 },
  { id: "alley", label: "Dark Alley", x: 74, y: 62 },
  { id: "bank", label: "Bank", x: 28, y: 72 },
  { id: "shop", label: "Corner Shop", x: 64, y: 78 },
  { id: "diner", label: "Fryday Diner", x: 0, y: 0 },
  { id: "pawn", label: "Oddities Pawn", x: 0, y: 0 },
  { id: "furniture", label: "Cosy Corner", x: 0, y: 0 },
  { id: "casino", label: "Lucky Sevens", x: 0, y: 0 },
  { id: "depot", label: "Town Transit", x: 0, y: 0 },
  { id: "police", label: "Town Police", x: 0, y: 0 },
  { id: "clinic", label: "Patch Up Clinic", x: 0, y: 0 },
] as const;
type PlaceId = (typeof PLACES)[number]["id"];

const ENCOUNTERS: { text: string; choices: { label: string; f: (s: S) => [Partial<S>, string] }[] }[] = [
  { text: "A hobo asks for $5.", choices: [
    { label: "Give $5", f: (s) => s.money >= 5 ? [{ money: s.money - 5, karma: s.karma + 3 }, "He blesses you. +3 karma"] : [{}, "You're broke too. You share a nod."] },
    { label: "Rob him", f: (s) => [{ money: s.money + 3, karma: s.karma - 5 }, "You took $3 and his dignity. -5 karma"] },
  ]},
  { text: "A stranger in a trenchcoat offers a 'hot' watch for $40.", choices: [
    { label: "Buy it", f: (s) => s.money >= 40 ? (Math.random() < 0.5 ? [{ money: s.money + 60, karma: s.karma - 2 }, "Flipped it for $100!"] : [{ money: s.money - 40 }, "It's plastic. -$40"]) : [{}, "You can't afford it."] },
    { label: "Report him", f: (s) => [{ karma: s.karma + 4 }, "Cops thank you. +4 karma"] },
  ]},
  { text: "A tough guy bumps into you. 'Got a problem?'", choices: [
    { label: "Fight", f: (s) => s.str >= 25 ? [{ cha: s.cha + 2, money: s.money + 15 }, "You win! He drops $15."] : [{ energy: Math.max(0, s.energy - 30) }, "You get flattened. -30 energy"] },
    { label: "Talk it out", f: (s) => s.cha >= 20 ? [{ cha: s.cha + 3 }, "You're friends now. +3 charm"] : [{ energy: Math.max(0, s.energy - 15) }, "He slaps you anyway."] },
  ]},
  { text: "You find a wallet with $50 in it.", choices: [
    { label: "Return it", f: (s) => [{ karma: s.karma + 6, cha: s.cha + 1 }, "Owner hugs you. +6 karma"] },
    { label: "Keep cash", f: (s) => [{ money: s.money + 50, karma: s.karma - 4 }, "+$50, -4 karma"] },
  ]},
  { text: "A nerd asks you to help with homework.", choices: [
    { label: "Help", f: (s) => [{ int: s.int + 2, karma: s.karma + 1 }, "+2 int, +1 karma"] },
    { label: "Wedgie", f: (s) => [{ str: s.str + 1, karma: s.karma - 3 }, "+1 str, -3 karma. Jerk."] },
  ]},
];

function Game() {
  const [s, setS] = useState<S>(START);
  const [saveReady, setSaveReady] = useState(false);
  const [lastEncounterDay, setLastEncounterDay] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>(["Welcome to Stick Town. You live in a box. Good luck."]);
  const [place, setPlace] = useState<PlaceId | null>(null);
  const [tab, setTab] = useState<"player" | "log" | "settings" | null>(null);
  const [enc, setEnc] = useState<(typeof ENCOUNTERS)[number] | null>(null);

  // SSR and the initial browser render must agree. Load the save only after hydration.
  useEffect(() => { setS(loadGame(START)); setSaveReady(true); }, []);
  // Never overwrite a player’s existing save with SSR defaults during hydration.
  useEffect(() => { if (saveReady) saveGame(s); }, [s, saveReady]);

  const say = (m: string) => setLog((l) => [m, ...l].slice(0, 30));

  const act = (hours: number, energy: number, fn: (s: S) => [Partial<S>, string] | string) => {
    if (s.energy < energy) return say("Too tired. Go home and sleep.");
    if (s.hour + hours > 24) return say("Too late for that. Go home and sleep.");
    const r = fn(s);
    if (typeof r === "string") return say(r);
    const [patch, msg] = r;
    setS((p) => ({ ...p, ...patch, hour: p.hour + hours, energy: Math.max(0, Math.min(100, patch.energy ?? p.energy - energy)) }));
    say(msg);
  };

  const walk = (id: PlaceId) => {
    setPlace(id);
    if (id !== "home" && lastEncounterDay !== s.day && Math.random() < 0.3) {
      setEnc(ENCOUNTERS[Math.floor(Math.random() * ENCOUNTERS.length)]!);
      setLastEncounterDay(s.day);
    }
  };

  const job = JOBS[s.job]!;
  const nextJob = JOBS[s.job + 1]!;
  const actions: Record<PlaceId, { label: string; run: () => void }[]> = {
    home: [
      ...(ownsFurniture(s.furniture, "weights") ? [{ label: "Home workout (2h, +2 strength)", run: () => act(2, 18, (p) => [{ str: p.str + 2 }, "Home gym session. +2 strength."]) }] : []),
      ...(ownsFurniture(s.furniture, "desk") ? [{ label: "Study at desk (2h, +2 intelligence)", run: () => act(2, 12, (p) => [{ int: p.int + 2 }, "Quiet study session. +2 intelligence."]) }] : []),
      ...(ownsFurniture(s.furniture, "kitchen") ? [{ label: "Cook at home (1h, $5, +40 energy)", run: () => act(1, 0, (p) => p.money >= 5 ? [{ money: p.money - 5, energy: Math.min(100, p.energy + 40) }, "Homemade dinner! +40 energy."] : "Need $5 for ingredients.") }] : []),
      ...(ownsFurniture(s.furniture, "sofa") ? [{ label: "Relax on your sofa (1h, +2 charm)", run: () => act(1, 0, (p) => [{ cha: p.cha + 2 }, "You feel surprisingly sociable. +2 charm."]) }] : []),
      { label: `Sleep (+${Math.min(100, HOUSES[s.house]!.rest + furnitureBonus(s.furniture, "sleep"))} energy)`, run: () => {
        setS((p) => ({ ...p, day: p.day + 1, hour: p.alarm ? 7 : 8, bank: Math.min(1e12, p.bank + Math.floor(p.bank * 0.001)), energy: Math.min(100, p.energy + HOUSES[p.house]!.rest + furnitureBonus(p.furniture, "sleep")), heat: Math.max(0, p.heat - 1) }));
        say(`Day ${s.day + 1}. You wake up in your ${HOUSES[s.house]!.name}.`);
      }},
      ...(HOUSES[s.house + 1]! ? [{ label: `Buy ${HOUSES[s.house + 1]!.name} ($${HOUSES[s.house + 1]!.cost})`, run: () => act(0, 0, (p) =>
        p.money >= HOUSES[p.house + 1]!.cost ? [{ money: p.money - HOUSES[p.house + 1]!.cost, house: p.house + 1 }, `You moved into a ${HOUSES[p.house + 1]!.name}!`] : "Not enough cash.") }] : []),
    ],
    gym: [
      { label: "Lift weights ($5, 2h)", run: () => act(2, 20, (p) => p.money >= 5 ? [{ money: p.money - 5, str: p.str + 3 }, "+3 strength. Swole."] : "Gym costs $5.") },
      { label: "Jog outside (free, 2h)", run: () => act(2, 25, (p) => [{ str: p.str + 1 }, "+1 strength."]) },
    ],
    school: [
      { label: "Study in library (free, 2h)", run: () => act(2, 15, (p) => [{ int: p.int + 1 }, "+1 intelligence."]) },
      ...(SCHOOLS[s.school + 1] ? [{ label: `Enroll: ${SCHOOLS[s.school + 1]} ($${(s.school + 1) * 100}, 4h)`, run: () => act(4, 30, (p) =>
        p.money >= (p.school + 1) * 100 ? [{ money: p.money - (p.school + 1) * 100, school: p.school + 1, int: p.int + 10 }, `Graduated: ${SCHOOLS[p.school + 1]}! +10 int`] : "Tuition too high.") }] : []),
    ],
    work: [
      { label: `Work shift as ${job.name} ($${job.pay * 4}, 4h)`, run: () => act(4, 30, (p) => [{ money: p.money + JOBS[p.job]!.pay * 4, karma: p.karma + 1 }, `Earned $${JOBS[p.job]!.pay * 4}. Honest living.`]) },
      ...(nextJob ? [{ label: `Ask for promotion (needs ${nextJob.int} int, ${nextJob.cha} cha)`, run: () => act(1, 5, (p) =>
        p.int >= nextJob.int && p.cha >= nextJob.cha ? [{ job: p.job + 1 }, `Promoted to ${nextJob.name}!`] : "Boss laughs at you.") }] : []),
    ],
    bar: [
      { label: "Buy a round ($15, 2h)", run: () => act(2, 10, (p) => p.money >= 15 ? [{ money: p.money - 15, cha: p.cha + 3 }, "Everyone loves you. +3 charm"] : "Can't afford it.") },
      { label: "Hit on someone (2h)", run: () => act(2, 10, (p) => Math.random() * 60 < p.cha ? [{ cha: p.cha + 2 }, "They gave you their number! +2 charm"] : [{ cha: p.cha + 1 }, "Rejected. Character building. +1 charm"]) },
    ],
    bank: [
      { label: `Deposit $50 (balance ${s.bank})`, run: () => act(0, 0, (p) => p.money >= 50 ? [{ money: p.money - 50, bank: p.bank + 50 }, "Deposited $50. Savings earn 0.1% per night."] : "You need $50 cash.") },
      { label: "Deposit all cash", run: () => act(0, 0, (p) => p.money > 0 ? [{ bank: p.bank + p.money, money: 0 }, "Your cash is safe in the bank."] : "No cash to deposit.") },
      { label: "Withdraw $50", run: () => act(0, 0, (p) => p.bank >= 50 ? [{ money: p.money + 50, bank: p.bank - 50 }, "Withdrew $50."] : "Not enough savings.") },
      { label: "Withdraw all savings", run: () => act(0, 0, (p) => p.bank > 0 ? [{ money: p.money + p.bank, bank: 0 }, "Withdrew your savings."] : "No savings to withdraw.") },
    ],
    shop: [
      { label: "Buy snack ($10, +1 to bag)", run: () => act(0, 0, (p) => p.money >= 10 && p.snacks < 99 ? [{ money: p.money - 10, snacks: p.snacks + 1 }, "Bought a snack. Open Player to eat it."] : "Need $10 and room in your bag.") },
      { label: `Buy running shoes ($150)${s.trainers ? " — owned" : ""}`, run: () => act(0, 0, (p) => !p.trainers && p.money >= 150 ? [{ money: p.money - 150, trainers: 1 }, "New shoes! Walk 35% faster."] : "Already owned or not enough cash.") },
      { label: `Buy alarm clock ($100)${s.alarm ? " — owned" : ""}`, run: () => act(0, 0, (p) => !p.alarm && p.money >= 100 ? [{ money: p.money - 100, alarm: 1 }, "You now wake at 7:00, gaining an extra hour."] : "Already owned or not enough cash.") },
    ],
    diner: [
      { label: "Work lunch shift ($40, 4h)", run: () => act(4, 30, (p) => [{ money: p.money + 40, karma: p.karma + 1 }, "Busy shift. Earned $40."]) },
      { label: "Eat hot meal ($18, +45 energy)", run: () => act(1, 0, (p) => p.money >= 18 ? [{ money: p.money - 18, energy: Math.min(100, p.energy + 45) }, "Proper meal! +45 energy."] : "Not enough cash.") },
    ],
    pawn: [
      { label: "Sell running shoes ($70)", run: () => act(0, 0, (p) => p.trainers ? [{ trainers: 0, money: p.money + 70 }, "Sold shoes for $70."] : "Nothing to sell.") },
      { label: "Sell alarm clock ($45)", run: () => act(0, 0, (p) => p.alarm ? [{ alarm: 0, money: p.money + 45 }, "Sold clock for $45."] : "Nothing to sell.") },
    ],
    furniture: [
      ...FURNITURE.map((item) => ({ label: `${ownsFurniture(s.furniture, item.id) ? "✓ Owned · " : ""}${item.name} (${item.cost}) — ${item.benefit}`, run: () => act(0, 0, (p) => ownsFurniture(p.furniture, item.id) ? "You already own that. It is set up at home." : p.money < item.cost ? `Need ${item.cost} cash.` : [{ money: p.money - item.cost, furniture: p.furniture | item.bit }, `${item.name} delivered! Check your home.`]) })),
    ],
    casino: [
      { label: "Play slots ($50, 1h)", run: () => act(1, 5, (p) => p.money < 50 ? "Need $50." : Math.random() < 0.28 ? [{ money: p.money + 100 }, "Jackpot! +$100 net."] : [{ money: p.money - 50 }, "The house wins. -$50."]) },
      { label: "High-stakes dice ($200, 1h)", run: () => act(1, 5, (p) => p.money < 200 ? "Need $200." : Math.random() < 0.45 ? [{ money: p.money + 200 }, "Lucky roll! +$200."] : [{ money: p.money - 200 }, "Snake eyes. -$200."]) },
    ],
    depot: [
      { label: "Check departures", run: () => say("No routes out of town yet. New destinations coming soon.") },
    ],
    police: [
      { label: "Pay $100 fine (-3 heat, 1h)", run: () => act(1, 0, (p) => p.heat > 0 && p.money >= 100 ? [{ money: p.money - 100, heat: Math.max(0, p.heat - 3) }, "Fine settled; heat reduced."] : "Need $100 and an outstanding record.") },
    ],
    clinic: [
      { label: "Medical recovery ($40, 1h)", run: () => act(1, 0, (p) => p.money >= 40 ? [{ money: p.money - 40, energy: 100 }, "Back on your feet!"] : "Treatment costs $40.") },
    ],
    alley: [
      { label: "Sell sketchy goods (2h)", run: () => act(2, 15, (p) => {
        if (Math.random() < Math.min(0.9, 0.15 + p.heat * 0.05)) return [{ money: Math.floor(p.money / 2), heat: 0, karma: p.karma - 3 }, "BUSTED! Cops take half your cash."];
        const g = 40 + p.cha * 2; return [{ money: p.money + g, karma: p.karma - 3, heat: p.heat + 1 }, `Made $${g}. -3 karma`];
      })},
      { label: "Mug someone (1h)", run: () => act(1, 20, (p) => p.str > 15 + Math.random() * 30 ? [{ money: p.money + 60, karma: p.karma - 8, heat: p.heat + 2 }, "+$60. You monster. -8 karma"] : [{ energy: 0 }, "They fought back. You're knocked out."]) },
      { label: "Casino dice ($20)", run: () => act(1, 5, (p) => p.money < 20 ? "Need $20." : Math.random() < 0.45 ? [{ money: p.money + 20 }, "Won $20!"] : [{ money: p.money - 20 }, "Lost $20."]) },
    ],
  };

  const align = s.karma >= 20 ? "Saint" : s.karma >= 5 ? "Legit" : s.karma > -5 ? "Neutral" : s.karma > -20 ? "Crooked" : "Kingpin";
  const won = s.house === 3 && s.job === 4;

  const close = () => { setPlace(null); };
  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground font-hand">
      <TownMap hour={s.hour} house={s.house} speed={s.trainers ? 1.35 : 1} active={place} onEnter={(id) => walk(id as PlaceId)} />

      {/* top HUD */}
      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <div className="pointer-events-auto flex items-center gap-3 rounded-full border-2 border-foreground bg-card px-3 py-1 text-lg shadow">
          <span>☀ {s.hour}:00</span><span>${s.money}</span>
          <span className="flex items-center gap-1">⚡<span className="h-2 w-14 overflow-hidden rounded-full bg-muted"><span className="block h-full bg-primary" style={{ width: `${s.energy}%` }} /></span></span>
        </div>
        <div className="pointer-events-auto flex flex-col gap-2">
          <Icon label="Player" onClick={() => setTab("player")}>👤</Icon>
          <Icon label="Journal" onClick={() => setTab("log")}>📜</Icon>
          <Icon label="Settings" onClick={() => setTab("settings")}>⚙️</Icon>
        </div>
      </div>

      {log[0] && !place && !enc && !tab && (
        <div className="pointer-events-none absolute inset-x-3 bottom-4 mx-auto max-w-md rounded-sm border-2 border-foreground bg-card/90 px-3 py-1 text-center text-base">{log[0]}</div>
      )}

      {enc && (
        <Sheet title="Random encounter!">
          <p className="text-lg">{enc.text}</p>
          {enc.choices.map((c) => <Btn key={c.label} onClick={() => { act(0, 0, c.f); setEnc(null); }}>{c.label}</Btn>)}
        </Sheet>
      )}
      {!enc && place && !tab && (
        <LocationScene id={place} house={s.house} furniture={s.furniture} onClose={close} feedback={log[0] ?? ""}>
          {actions[place].map((a) => <Btn key={a.label} onClick={a.run}>{a.label}</Btn>)}
        </LocationScene>
      )}
      {tab === "player" && (
        <Sheet title="Player" onClose={() => setTab(null)}>
          {won && <div className="border-2 border-foreground bg-accent p-2 text-center text-xl">🏆 Mansion + CEO in {s.day} days!</div>}
          <div className="grid grid-cols-2 gap-2 text-lg">
            <Stat k="Day" v={s.day} /><Stat k="Energy" v={`${s.energy}/100`} />
            <Stat k="Bank savings" v={`${s.bank}`} /><Stat k="Snacks" v={s.snacks} />
            <Stat k="Furniture" v={`${FURNITURE.filter(item => ownsFurniture(s.furniture, item.id)).length}/${FURNITURE.length}`} /><Stat k="Running shoes" v={s.trainers ? "Owned" : "—"} /><Stat k="Alarm clock" v={s.alarm ? "Owned" : "—"} />
            <Stat k="Strength" v={s.str} /><Stat k="Intelligence" v={s.int} />
            <Stat k="Charm" v={s.cha} /><Stat k="Karma" v={`${s.karma} · ${align}`} />
            <Stat k="Heat" v={"🔥".repeat(Math.min(5, s.heat)) || "—"} /><Stat k="Home" v={HOUSES[s.house]!.name} />
            <Stat k="Job" v={job.name} /><Stat k="School" v={SCHOOLS[s.school]} />
          </div>
          {s.snacks > 0 && <Btn onClick={() => act(0, 0, (p) => p.snacks > 0 ? [{ snacks: p.snacks - 1, energy: Math.min(100, p.energy + 25) }, "Ate a snack. +25 energy."] : "No snacks left.")}>Eat snack (+25 energy)</Btn>}
        </Sheet>
      )}
      {tab === "log" && (
        <Sheet title="Journal" onClose={() => setTab(null)}>
          <div className="max-h-[50vh] overflow-auto text-base">{log.map((l, i) => <p key={i} className={i ? "text-muted-foreground" : ""}>{l}</p>)}</div>
        </Sheet>
      )}
      {tab === "settings" && (
        <Sheet title="Settings" onClose={() => setTab(null)}>
          <p className="text-base text-muted-foreground">Tap the ground to walk. Tap a building to go inside. On a keyboard, use WASD or arrows and E to enter.</p>
          <Btn onClick={() => { if (confirm("Start a new life?")) { setS(START); setLastEncounterDay(null); setLog(["New life started."]); setPlace(null); setTab(null); } }}>Restart life</Btn>
        </Sheet>
      )}
    </main>
  );
}

function Icon(p: { label: string; onClick: () => void; children: React.ReactNode }) {
  return <button aria-label={p.label} onClick={p.onClick} className="grid h-11 w-11 place-items-center rounded-full border-2 border-foreground bg-card text-xl shadow">{p.children}</button>;
}
function Sheet(p: { title: string; onClose?: () => void; children: React.ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 mx-auto flex max-h-[75vh] max-w-md flex-col gap-2 overflow-auto rounded-t-xl border-2 border-b-0 border-foreground bg-card p-4">
      <div className="flex items-center justify-between"><h2 className="text-2xl font-bold">{p.title}</h2>
        {p.onClose && <button aria-label="Close" onClick={p.onClose} className="text-2xl">✕</button>}</div>
      {p.children}
    </div>
  );
}
function Stat({ k, v }: { k: string; v: React.ReactNode }) {
  return <div className="border-2 border-foreground bg-card px-2 py-1 rounded-sm"><div className="text-sm text-muted-foreground">{k}</div><div className="truncate">{v}</div></div>;
}
function Btn(p: { onClick: () => void; children: React.ReactNode }) {
  return <button onClick={p.onClick} className="text-left text-lg border-2 border-foreground px-3 py-1 rounded-sm bg-secondary hover:bg-primary hover:text-primary-foreground">{p.children}</button>;
}
function StickMan() {
  return (
    <svg viewBox="0 0 20 30" className="w-6 h-9 stroke-current fill-none" strokeWidth="2" strokeLinecap="round">
      <circle cx="10" cy="5" r="4" /><line x1="10" y1="9" x2="10" y2="19" />
      <line x1="10" y1="12" x2="4" y2="16" /><line x1="10" y1="12" x2="16" y2="16" />
      <line x1="10" y1="19" x2="5" y2="28" /><line x1="10" y1="19" x2="15" y2="28" />
    </svg>
  );
}
