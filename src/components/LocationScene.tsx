import { useState, type ReactNode } from "react";
import { ownsFurniture } from "@/lib/furniture";

type SceneId = "home" | "gym" | "school" | "work" | "bar" | "alley" | "bank" | "shop" | "diner" | "pawn" | "furniture" | "casino" | "depot" | "police" | "clinic";

const LOOK: Record<SceneId, { title: string; caption: string; wall: string; floor: string; accent: string; props: string[] }> = {
  home: { title: "Home sweet home", caption: "It isn't much, but the landlord never calls.", wall: "#b8c5a0", floor: "#9d7858", accent: "#8c5844", props: ["BED", "LAMP", "WINDOW"] },
  gym: { title: "Iron Gym", caption: "No pain, no gain. Refunds not available.", wall: "#8da4af", floor: "#56636b", accent: "#e1a53a", props: ["WEIGHTS", "MIRROR", "POSTER"] },
  school: { title: "Stick U", caption: "An expensive way to become slightly smarter.", wall: "#c9b78e", floor: "#916f55", accent: "#547b62", props: ["BOARD", "BOOKS", "DESK"] },
  work: { title: "MegaCorp", caption: "Your soul is valued. At an hourly rate.", wall: "#aebdcb", floor: "#708393", accent: "#47759b", props: ["DESK", "COMPUTER", "CLOCK"] },
  bar: { title: "The Tipsy Stick", caption: "The bartender already knows your problems.", wall: "#644363", floor: "#3a2937", accent: "#f477a9", props: ["BOTTLES", "BAR", "NEON"] },
  alley: { title: "Dark Alley", caption: "Business is brisk. Questions are discouraged.", wall: "#6a645f", floor: "#45413e", accent: "#b9a04c", props: ["BIN", "GRAFFITI", "CRATE"] },
  bank: { title: "Town Bank", caption: "Your money is safe. Your dignity is not insured.", wall: "#b9c8b8", floor: "#769187", accent: "#426c59", props: ["VAULT", "COUNTER", "CLOCK"] },
  shop: { title: "Corner Shop", caption: "Everything you need, and several things you don't.", wall: "#e3c689", floor: "#a98a6a", accent: "#ce6b45", props: ["SHELVES", "FRIDGE", "COUNTER"] },
  diner: { title: "Fryday Diner", caption: "The coffee is strong. The wages aren't.", wall: "#efc99d", floor: "#b86a58", accent: "#ce4d43", props: ["MENU", "BAR", "STOVE"] },
  pawn: { title: "Oddities Pawn", caption: "Someone else's rubbish is your treasure.", wall: "#aca78b", floor: "#736d56", accent: "#a98c4a", props: ["SHELVES", "CLOCK", "GUITAR"] },
  furniture: { title: "Cosy Corner", caption: "Sit down. Just don't fall asleep in the showroom.", wall: "#e6d8ba", floor: "#bd9470", accent: "#ad735b", props: ["SOFA", "LAMP", "WINDOW"] },
  casino: { title: "Lucky Sevens", caption: "The house always wins. But you're feeling lucky.", wall: "#493866", floor: "#312744", accent: "#f3bd4b", props: ["SLOTS", "TABLE", "NEON"] },
  depot: { title: "Town Transit", caption: "The next bus is due eventually.", wall: "#a3bac1", floor: "#677c82", accent: "#366c7b", props: ["BOARD", "BENCH", "CLOCK"] },
  police: { title: "Town Police", caption: "They know exactly what you've been up to.", wall: "#9dacbd", floor: "#738295", accent: "#355e88", props: ["DESK", "POSTER", "CLOCK"] },
  clinic: { title: "Patch Up Clinic", caption: "A little tape fixes almost everything.", wall: "#d4e5dd", floor: "#a7c5b4", accent: "#5a9e83", props: ["BED", "CROSS", "CABINET"] },
};

function Person({ x, y, shirt }: { x: number; y: number; shirt: string }) {
  return <g transform={`translate(${x} ${y})`} stroke="#212329" strokeWidth="3" strokeLinecap="round" fill="none">
    <ellipse cy="5" rx="18" ry="5" fill="#25232b" opacity=".13" stroke="none"/>
    <circle cy="-64" r="11" fill="#f1d6ae"/>
    <path d="M0 -52V-25M0 -46L-18 -30M0 -46L18 -30M0 -25L-13 0M0 -25L13 0" />
    <path d="M-6 -51L6 -51L8 -33L-8 -33Z" fill={shirt} />
    <circle cx="-4" cy="-66" r="1" fill="#212329" stroke="none"/><circle cx="4" cy="-66" r="1" fill="#212329" stroke="none"/>
  </g>;
}

function Prop({ name, x, accent }: { name: string; x: number; accent: string }) {
  const stroke = "#25242a";
  const box = (w: number, h: number, y = 112, color = accent) => <rect x={x} y={y-h} width={w} height={h} rx="3" fill={color} stroke={stroke} strokeWidth="3"/>;
  switch (name) {
    case "BED": return <g>{box(126,52,150,"#725a51")}<rect x={x+8} y="110" width="110" height="24" rx="7" fill="#e5d8c3" stroke={stroke} strokeWidth="3"/><rect x={x+10} y="101" width="33" height="15" rx="5" fill="#fff2d8" stroke={stroke} strokeWidth="2"/></g>;
    case "SOFA": return <g>{box(124,53,146)}<rect x={x+9} y="99" width="105" height="28" rx="7" fill="#ebc79c" stroke={stroke} strokeWidth="3"/><rect x={x} y="111" width="20" height="35" rx="6" fill={accent} stroke={stroke} strokeWidth="3"/><rect x={x+104} y="111" width="20" height="35" rx="6" fill={accent} stroke={stroke} strokeWidth="3"/></g>;
    case "VAULT": return <g>{box(97,125,151,"#576c69")}<circle cx={x+49} cy="86" r="29" fill="#9baead" stroke={stroke} strokeWidth="4"/><circle cx={x+49} cy="86" r="12" fill="#d0d9d1" stroke={stroke} strokeWidth="3"/><path d={`M${x+49} 66V106M${x+29} 86H${x+69}`} stroke={stroke} strokeWidth="4"/></g>;
    case "COUNTER": case "BAR": return <g>{box(128,57,157, name==="BAR"?"#73444e":"#9b8061")}<rect x={x-3} y="100" width="134" height="12" rx="3" fill="#d9b688" stroke={stroke} strokeWidth="3"/></g>;
    case "SHELVES": return <g>{box(104,105,148,"#765944")}{[65,100,134].map((y,i)=><g key={y}><line x1={x+6} x2={x+98} y1={y} y2={y} stroke="#e6c89d" strokeWidth="5"/>{[15,42,67].map((v,j)=><rect key={v} x={x+v} y={y-20} width={j===1?18:12} height="17" rx="2" fill={["#a9d1af","#e7ac55","#bd7791"][(i+j)%3]} stroke={stroke} strokeWidth="2"/>)}</g>)}</g>;
    case "SLOTS": return <g>{box(94,112,150,"#9c3f69")}<rect x={x+7} y="55" width="80" height="45" rx="5" fill="#f8e1a2" stroke={stroke} strokeWidth="3"/><text x={x+47} y="85" fontSize="25" fontWeight="bold" fill="#cf4b47" textAnchor="middle">7 7 7</text><circle cx={x+47} cy="124" r="9" fill="#e7bc42" stroke={stroke} strokeWidth="2"/></g>;
    case "TABLE": case "DESK": return <g><rect x={x+14} y="110" width="95" height="13" rx="2" fill={accent} stroke={stroke} strokeWidth="3"/><path d={`M${x+26} 123V154M${x+95} 123V154`} stroke={stroke} strokeWidth="6"/></g>;
    case "WEIGHTS": return <g><path d={`M${x+10} 112H${x+110}`} stroke={stroke} strokeWidth="8"/>{[18,29,91,102].map(v=><rect key={v} x={x+v} y="83" width="8" height="57" rx="2" fill="#505863" stroke={stroke} strokeWidth="2"/>)}</g>;
    case "FRIDGE": return <g>{box(78,120,154,"#d9e5e5")}<line x1={x} x2={x+78} y1="87" y2="87" stroke={stroke} strokeWidth="3"/><path d={`M${x+65} 56V75`} stroke={stroke} strokeWidth="4"/></g>;
    case "LAMP": return <g><path d={`M${x+40} 82V145`} stroke={stroke} strokeWidth="4"/><path d={`M${x+22} 145H${x+58}`} stroke={stroke} strokeWidth="5"/><path d={`M${x+18} 82L${x+31} 53H${x+49}L${x+62} 82Z`} fill="#f3d284" stroke={stroke} strokeWidth="3"/></g>;
    case "CLOCK": return <g><circle cx={x+45} cy="61" r="29" fill="#f5f0db" stroke={stroke} strokeWidth="4"/><path d={`M${x+45} 43V61L${x+60} 70`} fill="none" stroke={stroke} strokeWidth="4"/></g>;
    case "CROSS": return <g><rect x={x+30} y="38" width="40" height="90" rx="3" fill="#e8f5ed"/><rect x={x+5} y="63" width="90" height="40" rx="3" fill="#e8f5ed"/><path d={`M${x+42} 52H${x+58}V76H${x+82}V90H${x+58}V114H${x+42}V90H${x+18}V76H${x+42}Z`} fill="#d45b55"/></g>;
    case "BOARD": case "MENU": case "POSTER": case "GRAFFITI": case "NEON": return <g>{box(112,76,112,name==="NEON"?"#392a51":"#405c58")}<text x={x+56} y="66" fontSize="12" fontWeight="bold" textAnchor="middle" fill="#fff0c9">{( {BOARD:"TODAY",MENU:"SPECIALS",POSTER:"KEEP GOING",GRAFFITI:"NO SNITCHES",NEON:"OPEN"} as Record<string, string> )[name]}</text><path d={`M${x+18} 82H${x+94}M${x+28} 92H${x+84}`} stroke="#edd6a4" strokeWidth="3"/></g>;
    case "COMPUTER": return <g>{box(98,65,124,"#303b4a")}<rect x={x+9} y="68" width="80" height="44" fill="#92c8c4"/><path d={`M${x+49} 124V145`} stroke={stroke} strokeWidth="5"/></g>;
    case "BOTTLES": return <g>{box(118,100,145,"#674454")}{[25,53,83].map((v,i)=><g key={v}><rect x={x+v} y={76+i%2*7} width="16" height="46" rx="4" fill={["#75b5a2","#d99a4d","#aa79b1"][i]} stroke={stroke} strokeWidth="2"/><rect x={x+v+5} y={67+i%2*7} width="6" height="12" fill="#ddd1b4"/></g>)}</g>;
    case "BIN": return <g>{box(79,91,155,"#465356")}<rect x={x-5} y="59" width="89" height="12" rx="2" fill="#293337" stroke={stroke} strokeWidth="3"/></g>;
    case "BENCH": return <g>{box(115,15,112,"#8d634f")}<path d={`M${x+13} 113V154M${x+100} 113V154`} stroke={stroke} strokeWidth="5"/></g>;
    default: return <g>{box(82,83,146)}<rect x={x+12} y="80" width="58" height="20" fill="#ded0aa"/></g>;
  }
}

export type RoomStation = { label: string; hint: string; content: ReactNode };
export function LocationScene({ id, house = 0, furniture = 0, children, stations, onClose, feedback }: { id: string; house?: number; furniture?: number; children: ReactNode; stations?: RoomStation[]; onClose: () => void; feedback?: string }) {
  const [selected, setSelected] = useState<number | null>(null);
  const hotspots = stations?.length ? stations : null;
  const scene = LOOK[id as SceneId] ?? LOOK.shop;
  const props = scene.props;
  const homes = [{ wall: "#8c9575", floor: "#806c57", title: "A room with questionable walls", basics: ["BIN","CRATE","LAMP"] }, { wall: "#d6c9ad", floor: "#ad8667", title: "Your first studio flat", basics: ["BED","WINDOW","LAMP"] }, { wall: "#a9c5b0", floor: "#926b4c", title: "Welcome to the suburbs", basics: ["SOFA","WINDOW","LAMP"] }, { wall: "#d9d3c4", floor: "#84674d", title: "The mansion life", basics: ["SOFA","WINDOW","CLOCK"] }];
  const home = homes[Math.min(3, Math.max(0, house))]!;
  const wall = id === "home" ? home.wall : scene.wall;
  const floor = id === "home" ? home.floor : scene.floor;
  return <div className="absolute inset-0 z-20 flex flex-col bg-background/95 font-hand sm:items-center sm:justify-center">
    <section className="flex h-full w-full flex-col overflow-hidden border-foreground bg-card sm:h-[min(850px,95vh)] sm:max-w-2xl sm:rounded-xl sm:border-2 sm:shadow-2xl">
      <header className="flex shrink-0 items-center justify-between border-b-2 border-foreground px-4 py-3">
        <div><div className="text-xs uppercase tracking-widest text-muted-foreground">Town Square Tales · Inside</div><h2 className="text-2xl font-bold">{scene.title}</h2></div>
        <button onClick={onClose} aria-label="Leave building" className="rounded-lg border-2 border-foreground bg-secondary px-4 py-2 text-lg font-bold">← Leave</button>
      </header>
      <div className="relative min-h-0 shrink-0 overflow-hidden border-b-2 border-foreground" style={{height:hotspots?"min(53vh,430px)":"clamp(190px,39vh,365px)",background:wall}}>
        <svg viewBox="0 0 420 230" preserveAspectRatio="xMidYMid slice" className="h-full w-full" role="img" aria-label={`Illustrated interior of ${scene.title}`}>
          <rect width="420" height="230" fill={wall}/><path d="M0 150H420V230H0Z" fill={floor}/>
          <path d="M0 150H420" stroke="#29252a" strokeWidth="5"/>
          <path d="M0 230L155 150H265L420 230" fill="#fff" opacity=".06"/>
          <rect x="10" y="10" width="105" height="27" rx="5" fill={scene.accent} stroke="#25242a" strokeWidth="3"/>
          <text x="62" y="29" textAnchor="middle" fill="white" fontWeight="bold" fontSize="14">{id==="home"?["CARDBOARD","STUDIO","HOUSE","MANSION"][house] ?? "HOME":scene.title.toUpperCase().slice(0,13)}</text>
          {id === "home" ? <>
            <Prop name={ownsFurniture(furniture, "bed") ? "BED" : home.basics[0] ?? "BED"} x={17} accent={scene.accent}/>
            <Prop name={ownsFurniture(furniture, "kitchen") ? "FRIDGE" : home.basics[1] ?? "LAMP"} x={295} accent={scene.accent}/>
            <Prop name={ownsFurniture(furniture, "desk") ? "COMPUTER" : home.basics[2] ?? "WINDOW"} x={167} accent={scene.accent}/>
            {ownsFurniture(furniture, "sofa") && <g transform="translate(0 42) scale(.72)"><Prop name="SOFA" x={295} accent="#ba826a"/></g>}
            {ownsFurniture(furniture, "weights") && <g transform="translate(24 65) scale(.6)"><Prop name="WEIGHTS" x={17} accent="#647d86"/></g>}
          </> : <>
            <Prop name={props[0] ?? "DESK"} x={17} accent={scene.accent}/>
            <Prop name={props[1] ?? "LAMP"} x={285} accent={scene.accent}/>
            <g opacity=".8"><Prop name={props[2] ?? "WINDOW"} x={164} accent={scene.accent}/></g>
          </>}
          <Person x={225} y={187} shirt={scene.accent}/><Person x={369} y={208} shirt="#e1bb6d"/>
          <ellipse cx="215" cy="215" rx="180" ry="12" fill="#262329" opacity=".1"/>
        </svg>
        {hotspots && <>
          <div className="absolute inset-x-2 bottom-2 grid grid-cols-3 gap-2">
            {hotspots.map((station,i)=><button key={station.label} type="button"
              aria-pressed={selected===i} onClick={()=>setSelected(i)}
              className={`min-h-12 rounded-lg border-2 border-foreground px-1 py-2 text-center text-sm font-bold shadow-md ${selected===i?"bg-primary text-primary-foreground":"bg-card/95"}`}>
              <span aria-hidden="true">{["🖥️","📋","🚪"][i] ?? "✦"} </span>{station.label}
            </button>)}
          </div>
        </>}
      </div>
      <div className="shrink-0 border-b border-foreground/20 bg-secondary/60 px-4 py-2 text-base italic">{id === "home" ? home.title + " · " + (furniture ? "Your upgrades are making it feel like yours." : "A fresh start.") : scene.caption}</div>
      {hotspots ? <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3">
        {selected===null ? <div className="grid gap-2 text-center">
          <strong className="text-lg">Tap an object to interact</strong>
          <p className="text-sm text-muted-foreground">Workstations, notices and counters each open their own options. Use Leave to return to town.</p>
          <div className="grid grid-cols-3 gap-2">{hotspots.map((station,i)=><button type="button" key={station.label} className="min-h-11 rounded-md border-2 border-foreground bg-secondary px-1 text-sm font-bold" onClick={()=>setSelected(i)}>{station.label}</button>)}</div>
        </div> : <>
          <div className="mb-2 flex items-center justify-between gap-2"><div><h3 className="text-lg font-bold">{hotspots[selected]?.label}</h3><p className="text-sm text-muted-foreground">{hotspots[selected]?.hint}</p></div><button type="button" aria-label="Close actions" onClick={()=>setSelected(null)} className="min-h-11 min-w-11 rounded-md border-2 border-foreground bg-secondary">✕</button></div>
          <div className="grid gap-2">{hotspots[selected]?.content}</div>
        </>}
        {feedback && <p aria-live="polite" className="mt-2 rounded border border-foreground/30 bg-secondary p-2 text-sm">{feedback}</p>}
      </div> : <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
        <div className="mb-2 text-sm font-bold uppercase tracking-wide text-muted-foreground">What would you like to do?</div>
        <div className="flex flex-col gap-2">{children}</div>
        {feedback && <p aria-live="polite" className="mt-3 rounded border border-foreground/30 bg-secondary p-2 text-base">{feedback}</p>}
      </div>}
    </section>
  </div>;
}
