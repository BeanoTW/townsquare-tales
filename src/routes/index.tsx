import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { loadGame, saveGame, type GameState } from "@/lib/game-state";
import { TownMap } from "@/components/TownMap";
import { DayClock } from "@/components/DayClock";
import { playActionCue } from "@/lib/action-audio";
import { encounterForDay } from "@/lib/world-encounters";
import { LocationScene } from "@/components/LocationScene";
import { sleepOutcome, timeLabel } from "@/lib/day-cycle";
import { FURNITURE, ownsFurniture, type FurnitureId } from "@/lib/furniture";
import { CAREERS, currentRole, nextRole, missingRequirements, shiftReward } from "@/lib/careers";

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
const START: S = { day: 1, hour: 8, energy: 100, money: 20, str: 5, int: 5, cha: 5, karma: 0, house: 0, school: 0, job: 0, heat: 0, bank: 0, snacks: 0, trainers: 0, alarm: 0, furniture: 0, career: 0, xp: 0 };
const HOUSES = [
  { name: "Cardboard Box", cost: 0, rest: 50 },
  { name: "Studio Flat", cost: 300, rest: 75 },
  { name: "Suburban House", cost: 2000, rest: 100 },
  { name: "Mansion", cost: 15000, rest: 100 },
];
const SCHOOLS = ["Dropout", "High School", "College", "University Degree", "PhD"];
const PLACES = [
  { id: "home", label: "Home", x: 8, y: 18 },
  { id: "gym", label: "Gym", x: 38, y: 12 },
  { id: "yard", label: "Workers Yard", x: 0, y: 0 },
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
 {text:"The diner owner is short on change and asks for a hand before the lunch rush.",choices:[
  {label:"Help serve customers (1h)",f:s=>[{money:s.money+15,cha:s.cha+1},"The lunch rush clears. +$15, +1 charm."]},
  {label:"Say you're busy",f:()=>[{},"You wish the owner luck and carry on."]}]},
 {text:"A nervous customer outside the shop offers you a suspiciously cheap watch.",choices:[
  {label:"Buy the watch ($40)",f:s=>s.money>=40?[{money:s.money-40,karma:s.karma-2},"The watch looks real enough. -$40, -2 karma."]:[{},"You need $40 for the watch."]},
  {label:"Walk away",f:()=>[{},"You leave the stranger to find another customer."]}]},
 {text:"A bar regular is arguing loudly with a friend. The atmosphere is getting tense.",choices:[
  {label:"Calm things down",f:s=>[{cha:s.cha+2,karma:s.karma+1},"They settle down. +2 charm, +1 karma."]},
  {label:"Join the argument",f:s=>[{karma:s.karma-2,cha:s.cha+1},"A spectacular argument. +1 charm, -2 karma."]}]},
 {text:"Someone has dropped a wallet near the busier shops.",choices:[
  {label:"Hand it in",f:s=>[{karma:s.karma+3,cha:s.cha+1},"The grateful owner finds you later. +3 karma, +1 charm."]},
  {label:"Keep the cash",f:s=>[{money:s.money+50,karma:s.karma-4},"You pocket $50. -4 karma."]}]},
 {text:"A student is struggling with homework outside Stick U.",choices:[
  {label:"Help them study",f:s=>[{int:s.int+2,karma:s.karma+1},"They finally understand it. +2 intelligence, +1 karma."]},
  {label:"Trade your notes ($10)",f:s=>[{money:s.money+10,karma:s.karma-1},"Sold your notes. +$10, -1 karma."]}]},
 {text:"A colleague near MegaCorp has spotted a mistake in a report.",choices:[
  {label:"Help correct it",f:s=>[{int:s.int+1,cha:s.cha+1},"Report saved. +1 intelligence, +1 charm."]},
  {label:"Take credit",f:s=>[{cha:s.cha+2,karma:s.karma-2},"The boss is impressed. Your colleague isn't. +2 charm, -2 karma."]}]},
 {text:"A stranger in the alley offers an off-the-books delivery job.",choices:[
  {label:"Take the delivery",f:s=>[{money:s.money+65,heat:s.heat+1,karma:s.karma-2},"Paid $65, but the police noticed. +1 heat, -2 karma."]},
  {label:"Decline",f:()=>[{},"You decide it's not worth the risk."]}]},
];
function Game() {
  const [s, setS] = useState<S>(START);
  const [saveReady, setSaveReady] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [lastEncounterDay, setLastEncounterDay] = useState<number | null>(null);
  const [log, setLog] = useState<string[]>(["Welcome to Stick Town. You live in a box. Good luck."]);
  const [place, setPlace] = useState<PlaceId | null>(null);
  const [tab, setTab] = useState<"player" | "log" | "settings" | null>(null);
  const [enc, setEnc] = useState<(typeof ENCOUNTERS)[number] | null>(null);
  const [encounterDone, setEncounterDone] = useState<number | null>(null);
  const [result, setResult] = useState<{message:string;success:boolean;before:number;after:number;changes?:string[]} | null>(null);

  // SSR and the initial browser render must agree. Load the save only after hydration.
  useEffect(() => { setS(loadGame(START)); setSaveReady(true); }, []);
  // Never overwrite a player’s existing save with SSR defaults during hydration.
  useEffect(() => { if (saveReady) saveGame(s); }, [s, saveReady]);

  const say = (m: string) => setLog((l) => [m, ...l].slice(0, 30));

  const notify = (message:string,success:boolean,hours=0,changes:string[]=[]) => {
    setResult({message,success,before:s.hour,after:Math.min(24,s.hour+hours),changes});
    playActionCue(success?"success":"failure",soundOn);
    say(message);
  };
  const act = (hours: number, energy: number, fn: (s: S) => [Partial<S>, string] | string) => {
    if (s.energy < energy) return notify(`Not enough energy: need ${energy}, have ${s.energy}. Rest or eat first.`,false);
    if (s.hour + hours > 24) return notify(`Not enough time: ${hours}h required, only ${24-s.hour}h left today.`,false);
    const r = fn(s);
    if (typeof r === "string") return notify(r,false);
    const [patch, msg] = r;
    setS((p) => ({ ...p, ...patch, hour: p.hour + hours, energy: Math.max(0, Math.min(100, patch.energy ?? p.energy - energy)) }));
    const labels:Partial<Record<keyof S,string>> = {money:"Cash",bank:"Savings",xp:"Work XP",int:"Intelligence",cha:"Charm",str:"Strength",energy:"Energy",karma:"Karma",heat:"Heat",school:"Education",job:"Job",career:"Career",house:"Housing",snacks:"Snacks"};
    const changes=(Object.keys(labels) as (keyof S)[]).flatMap(key=>{
      const value=patch[key], before=s[key];
      if(typeof value!=="number"||value===before)return [];
      const delta=value-before;
      return [`${labels[key]}: ${delta>0?"+":""}${delta}`];
    });
    if(hours && patch.energy===undefined)changes.push(`Energy: -${energy}`);
    notify(msg,true,hours,changes);
  };

  const walk = (id: PlaceId) => { setResult(null); setPlace(id); };
  const encounterSpot = encounterDone===s.day ? null : encounterForDay(s.day);
  const approachEncounter = () => {
    if(!encounterSpot)return;
    setPlace(null);setTab(null);setResult(null);
    // Each encounter draws from a situation suited to its location.
    const choices:Record<string,number>={diner:0,shop:1,bar:2,school:4,work:5,alley:6};
    setEnc(ENCOUNTERS[choices[encounterSpot.id] ?? 3]);
    playActionCue("encounter",soundOn);
    setEncounterDone(s.day);
  };

  const job = currentRole(s);
  const nextJob = nextRole(s);
  const actions: Record<PlaceId, { label: string; run: () => void }[]> = {
    home: [
      ...(ownsFurniture(s.furniture, "weights") ? [{ label: "Home workout (2h, +2 strength)", run: () => act(2, 18, (p) => [{ str: p.str + 2 }, "Home gym session. +2 strength."]) }] : []),
      ...(ownsFurniture(s.furniture, "desk") ? [{ label: "Study at desk (2h, +2 intelligence)", run: () => act(2, 12, (p) => [{ int: p.int + 2 }, "Quiet study session. +2 intelligence."]) }] : []),
      ...(ownsFurniture(s.furniture, "kitchen") ? [{ label: "Cook at home (1h, $5, +40 energy)", run: () => act(1, 0, (p) => p.money >= 5 ? [{ money: p.money - 5, energy: Math.min(100, p.energy + 40) }, "Homemade dinner! +40 energy."] : "Need $5 for ingredients.") }] : []),
      ...(ownsFurniture(s.furniture, "sofa") ? [{ label: "Relax on your sofa (1h, +2 charm)", run: () => act(1, 0, (p) => [{ cha: p.cha + 2 }, "You feel surprisingly sociable. +2 charm."]) }] : []),
      { label: `Sleep · wake around ${timeLabel(sleepOutcome(s).hour)}`, run: () => {
        const rested = sleepOutcome(s);
        setS((p) => ({ ...p, ...sleepOutcome(p), day: p.day + 1, bank: Math.min(1e12, p.bank + Math.floor(p.bank * 0.001)), heat: Math.max(0, p.heat - 1) }));
        say(`Day ${s.day + 1}. You wake at ${timeLabel(rested.hour)} in your ${HOUSES[s.house]!.name} with ${rested.energy} energy.`);
      }},
      ...(HOUSES[s.house + 1]! ? [{ label: `Buy ${HOUSES[s.house + 1]!.name} ($${HOUSES[s.house + 1]!.cost})`, run: () => act(0, 0, (p) =>
        p.money >= HOUSES[p.house + 1]!.cost ? [{ money: p.money - HOUSES[p.house + 1]!.cost, house: p.house + 1 }, `You moved into a ${HOUSES[p.house + 1]!.name}!`] : "Not enough cash.") }] : []),
    ],
    yard: [],
    gym: [
      { label: "Lift weights ($5, 2h)", run: () => act(2, 20, (p) => p.money >= 5 ? [{ money: p.money - 5, str: p.str + 3 }, "+3 strength. Swole."] : "Gym costs $5.") },
      { label: "Jog outside (free, 2h)", run: () => act(2, 25, (p) => [{ str: p.str + 1 }, "+1 strength."]) },
    ],
    school: [
      { label: "Study in library (free, 2h)", run: () => act(2, 15, (p) => [{ int: p.int + 1 }, "+1 intelligence."]) },
      ...(SCHOOLS[s.school + 1] ? [{ label: `Enroll: ${SCHOOLS[s.school + 1]} ($${(s.school + 1) * 100}, 4h)`, run: () => act(4, 30, (p) =>
        p.money >= (p.school + 1) * 100 ? [{ money: p.money - (p.school + 1) * 100, school: p.school + 1, int: p.int + 10 }, `Graduated: ${SCHOOLS[p.school + 1]}! +10 int`] : "Tuition too high.") }] : []),
    ],
    work: [],
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

  const workShift = () => act(4, 30, p => {
    const reward = shiftReward(p);
    return [{money:p.money+reward.money,xp:p.xp+reward.xp,karma:p.karma+reward.karma},
      `Earned ${reward.money} as ${reward.role}. +4 work XP.`];
  });
  const requestPromotion = () => act(1, 5, p => {
    const upcoming=nextRole(p);
    if(!upcoming)return "Already at the top of your profession.";
    const missing=missingRequirements(p,upcoming);
    return missing.length?`Promotion requires: ${missing.join(", ")}.`:
      [{job:p.job+1},`Promoted to ${upcoming.name}! New wage ${upcoming.pay}/hour.`];
  });
  const applyJob = (index:number) => act(1,5,p => {
    const field=CAREERS[index];
    if(!field)return "No such vacancy.";
    if(p.career===index)return `You're already employed in ${field.name}.`;
    return [{career:index,job:0,xp:Math.floor(p.xp/4)},
      `Hired as ${field.roles[0].name}! Some experience transferred.`];
  });

  // Careers are local: only the employer for a field advertises its vacancies.
  const application = (career:number) => {
    const field=CAREERS[career];
    return <div className="grid gap-2">
      <div className="rounded-lg bg-secondary p-2">
        <strong>{field.name} · {field.roles[0].name}</strong>
        <p className="text-sm">${field.roles[0].pay}/hour · 1h application</p>
      </div>
      <Btn onClick={()=>applyJob(career)}>{s.career===career?"Already employed in this field":"Apply for this position"}</Btn>
    </div>;
  };
  const careerManager = (career:number) => s.career!==career ?
    <p className="text-sm">Apply for a job here before requesting promotions.</p> :
    <div className="grid gap-2">
      <strong>Current: {job.name} · ${job.pay}/hour</strong>
      <p className="text-sm">{nextJob ? `Next: ${nextJob.name} · ${nextJob.pay}/hour` : "You're at the top of this career."}</p>
      {nextJob && <p className="text-sm">{missingRequirements(s,nextJob).join(", ") || "All requirements met!"}</p>}
      <Btn onClick={requestPromotion}>Request promotion · 1h</Btn>
    </div>;
  const shiftStation = (career:number) => s.career===career ?
    <div className="grid gap-2"><p className="text-sm">{job.name} · ${job.pay}/hour</p><Btn onClick={workShift}>Work 4h · +${job.pay*4} · +4 XP</Btn></div> :
    <p className="text-sm">You're employed elsewhere. Check the vacancy board to join this workplace.</p>;
  const jobStations = (career:number,shiftLabel:string) => [
    {label:shiftLabel,hint:"Your current shift",content:shiftStation(career)},
    {label:"Vacancies",hint:`Join the ${CAREERS[career].name} career`,content:application(career)},
    {label:"Manager",hint:"Progress and promotions",content:careerManager(career)}
  ];
  const interiorStations = place==="work" ? jobStations(0,"Workstation") :
    place==="yard" ? jobStations(3,"Job site") :
    place==="diner" ? jobStations(1,"Kitchen") :
    place==="shop" ? [
      {label:"Shelves",hint:"Snacks and essentials",content:<Btn onClick={actions.shop[0].run}>{actions.shop[0].label}</Btn>},
      {label:"Shop jobs",hint:"Retail vacancies",content:application(2)},
      {label:"Counter",hint:"Equipment and career progression",content:<div className="grid gap-2">
        <Btn onClick={actions.shop[1].run}>{actions.shop[1].label}</Btn>
        <Btn onClick={actions.shop[2].run}>{actions.shop[2].label}</Btn>
        {careerManager(2)}
      </div>}
    ] :
    place==="school" ? [
      {label:"Library",hint:"Study independently",content:<Btn onClick={actions.school[0].run}>{actions.school[0].label}</Btn>},
      {label:"Classroom",hint:"Classes and qualifications",content:actions.school[1] ? <Btn onClick={actions.school[1].run}>{actions.school[1].label}</Btn> : <p>All available qualifications completed.</p>},
      {label:"Admissions",hint:"Education and careers",content:<p className="text-sm">Qualifications unlock opportunities around town. Look for vacancy posters at each workplace.</p>},
    ] :
    place==="bank" ? [
      {label:"Teller",hint:"Manage savings",content:<div className="grid gap-2">{actions.bank.slice(0,2).map(a=><Btn key={a.label} onClick={a.run}>{a.label}</Btn>)}</div>},
      {label:"ATM",hint:"Withdraw money",content:<div className="grid gap-2">{actions.bank.slice(2).map(a=><Btn key={a.label} onClick={a.run}>{a.label}</Btn>)}</div>},
      {label:"Careers",hint:"Professional opportunities",content:<div className="grid gap-2"><p className="text-sm">Corporate careers are currently handled through MegaCorp's vacancy board.</p></div>},
    ] : undefined;

  const align = s.karma >= 20 ? "Saint" : s.karma >= 5 ? "Legit" : s.karma > -5 ? "Neutral" : s.karma > -20 ? "Crooked" : "Kingpin";
  const won = s.house === 3 && s.career === 0 && s.job === 4;

  const close = () => { setPlace(null); };
  return (
    <main className="fixed inset-0 overflow-hidden bg-background text-foreground font-hand">
      <TownMap hour={s.hour} house={s.house} speed={s.trainers ? 1.35 : 1} active={place} encounter={encounterSpot} onEncounter={approachEncounter} onEnter={(id) => walk(id as PlaceId)} />

      {/* top HUD */}
      <div className="pointer-events-none absolute z-40 inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
        <DayClock day={s.day} hour={s.hour} money={s.money} energy={s.energy} />
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
        <Sheet title={encounterSpot?.title ?? "A town encounter"}>
          <p className="text-lg">{enc.text}</p>
          {enc.choices.map((c) => <Btn key={c.label} onClick={() => { act(0, 0, c.f); setEnc(null); }}>{c.label}</Btn>)}
          <Btn onClick={() => setEnc(null)}>Walk away</Btn>
        </Sheet>
      )}
      {!enc && place && !tab && (
        <LocationScene id={place} house={s.house} furniture={s.furniture} onClose={close} feedback={log[0] ?? ""} stations={interiorStations}>
          {actions[place].map((a) => <Btn key={a.label} onClick={a.run}>{a.label}</Btn>)}
        </LocationScene>
      )}
      {result && !enc && <div key={result.message + result.before} role="status" aria-live="polite" className="pointer-events-none absolute inset-x-3 top-24 z-50 mx-auto max-w-sm animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="pointer-events-auto rounded-xl border-2 border-foreground bg-card p-3 shadow-xl">
          <div className="flex items-start justify-between gap-2">
            <strong>{result.success?"✓ Action complete":"! Action unavailable"}</strong>
            <button onClick={()=>setResult(null)} aria-label="Dismiss result" className="min-h-8 min-w-8 rounded border border-foreground">✕</button>
          </div>
          <p className="text-sm">{result.message}</p>
          {!!result.changes?.length && <div className="mt-2 flex flex-wrap gap-1">{result.changes.map((c,i)=><span key={i} className="rounded bg-secondary px-2 py-1 text-xs font-bold">{c}</span>)}</div>}
          {result.success && result.after>result.before && <p className="text-xs font-bold">🕒 {timeLabel(result.before)} → {timeLabel(result.after)} · {result.after-result.before}h used</p>}
        </div>
      </div>}
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
            <Stat k="Career" v={CAREERS[s.career]?.name ?? "Corporate"} /><Stat k="Job" v={job.name} /><Stat k="Work XP" v={s.xp} /><Stat k="School" v={SCHOOLS[s.school]} />
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
          <Btn onClick={()=>setSoundOn(v=>!v)}>🔊 Action sounds: {soundOn?"On":"Off"}</Btn>
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
