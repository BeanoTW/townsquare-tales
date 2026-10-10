import { useEffect, useState, type CSSProperties } from "react";
import type { ActionDef } from "@/lib/actions";
import { currentRole } from "@/lib/careers";
import { SCHOOLS } from "@/lib/game-data";
import type { GameState } from "@/lib/game-state";
import { SHOP_GOODS, shopAvailability } from "@/lib/shop-catalog";
import { hotspotActions, type PlaceId, type Room } from "@/lib/rooms";
import type { Feedback } from "@/components/LocationScene";
import "./arcade-interior.css";

type SceneProps = {
  room: Room;
  state: GameState;
  feedback: Feedback | null;
  onRun: (action: ActionDef) => void;
  onLeave: () => void;
};

type Attendant = { title: string; name: string; greeting: string; shirt: string; accent: string; prop: string };
const STAFF: Partial<Record<PlaceId, Attendant>> = {
  shop: { title: "CORNER SHOP", name: "The shopkeeper", greeting: "Welcome in! Take a spin, have a look. No refunds on eaten snacks.", shirt: "#a63f38", accent: "#e0c176", prop: "🏷️" },
  bank: { title: "TOWN BANK", name: "Bank teller", greeting: "Good day. Your money is in capable hands. Probably.", shirt: "#426c59", accent: "#c9dcbb", prop: "💵" },
  school: { title: "STICK U", name: "Admissions officer", greeting: "The price of knowledge is on the board. The debt is yours.", shirt: "#547b62", accent: "#e5ca86", prop: "📚" },
  work: { title: "MEGACORP", name: "Receptionist", greeting: "Welcome to MegaCorp. Your time is extremely valuable to us.", shirt: "#47759b", accent: "#d2deeb", prop: "💼" },
  yard: { title: "WORKERS YARD", name: "Site foreman", greeting: "Morning! Boots on. The job won't build itself.", shirt: "#c48f35", accent: "#f3d281", prop: "🦺" },
  diner: { title: "FRYDAY DINER", name: "Counter cook", greeting: "Grab a booth, grab a bite. The grill's already hot.", shirt: "#c94f4a", accent: "#f9d5ad", prop: "🍳" },
  bar: { title: "THE TIPSY STICK", name: "Bartender", greeting: "What'll it be? Good company costs extra.", shirt: "#83416f", accent: "#d9a7d5", prop: "🍹" },
  pawn: { title: "ODDITIES PAWN", name: "Pawn broker", greeting: "Show me what you've got. I might be interested.", shirt: "#8a7145", accent: "#d9ce9c", prop: "💎" },
  clinic: { title: "PATCH UP CLINIC", name: "Doctor", greeting: "You look terrible. Luckily, we accept cash.", shirt: "#69a89d", accent: "#dbefe1", prop: "🩹" },
  depot: { title: "TOWN TRANSIT", name: "Ticket clerk", greeting: "Next departure? We'll let you know when there's one.", shirt: "#366c7b", accent: "#c2e0e3", prop: "🚌" },
  police: { title: "TOWN POLICE", name: "Desk sergeant", greeting: "Keep your nose clean. We've got paperwork to do.", shirt: "#355e88", accent: "#c4d0df", prop: "👮" },
  furniture: { title: "COSY CORNER", name: "Sales assistant", greeting: "Make your home a home. We deliver immediately.", shirt: "#ad735b", accent: "#f0d9bc", prop: "🛋️" },
};

function ActionChoice({ action, onRun }: { action: ActionDef; onRun: (action: ActionDef) => void }) {
  return (
    <button type="button" className="arcade-choice" onClick={() => onRun(action)}>
      <span className="arcade-choice-label">{action.label}</span>
      <span className="arcade-choice-cost">
        {action.cost ? `$${action.cost} · ` : ""}
        {action.hours ? `${action.hours}h` : "Instant"}
        {action.energy ? ` · ${action.energy}⚡` : ""}
      </span>
      {action.note && <span className="arcade-choice-note">{action.note}</span>}
    </button>
  );
}

function CounterBackdrop({ attendant }: { attendant: Attendant }) {
  return (
    <div className="arcade-set" aria-hidden="true">
      <div className="arcade-set-shelf">
        <span>▣</span><span>▤</span><span>▥</span><span>▣</span>
      </div>
      <div className="arcade-set-sign">{attendant.title}</div>
      <div className="arcade-npc">
        <svg viewBox="0 0 112 150" role="presentation">
          <ellipse cx="56" cy="143" rx="42" ry="6" fill="#272332" opacity=".25" />
          <path d="M30 144L38 101H74L82 144" fill="#343044" stroke="#282532" strokeWidth="5" />
          <path d="M30 111L21 140M82 111L91 139" stroke="#302d35" strokeWidth="8" strokeLinecap="round" />
          <path d="M29 83Q56 68 83 83L77 123H35Z" fill={attendant.shirt} stroke="#292633" strokeWidth="5" />
          <path d="M31 92L16 114M81 92L96 114" fill="none" stroke="#292633" strokeWidth="6" strokeLinecap="round" />
          <circle cx="56" cy="49" r="28" fill="#f0cb99" stroke="#292633" strokeWidth="5" />
          <path d="M29 44Q31 12 58 12Q83 10 85 41Q65 29 44 35L28 48Z" fill="#3b3134" stroke="#292633" strokeWidth="3" />
          <circle cx="47" cy="51" r="2.7" fill="#292633" /><circle cx="66" cy="51" r="2.7" fill="#292633" />
          <path d="M48 65Q56 70 65 64" stroke="#8b4e44" strokeWidth="2.5" fill="none" />
        </svg>
      </div>
      <div className="arcade-till"><div className="arcade-till-screen">$$$</div></div>
      <div className="arcade-counter-face" />
    </div>
  );
}

function ShopWheel({ state, onRun, room }: { state: GameState; onRun: (a: ActionDef) => void; room: Room }) {
  const [selected, setSelected] = useState(0);
  const [view, setView] = useState<"goods" | "jobs">("goods");
  const [pop, setPop] = useState(0);
  const good = SHOP_GOODS[selected]!;
  const owned = good.owned(state);
  const available = good.available(state);
  const availability = shopAvailability(good, state);

  function purchase() {
    if (!available) return;
    onRun(good.action(state));
    setPop((count) => count + 1);
  }

  return (
    <>
      <div className="arcade-tabs" role="tablist" aria-label="Corner Shop departments">
        <button type="button" role="tab" aria-selected={view === "goods"} onClick={() => setView("goods")}>🛒 Shop</button>
        <button type="button" role="tab" aria-selected={view === "jobs"} onClick={() => setView("jobs")}>📋 Work here</button>
      </div>
      {view === "goods" ? (
        <div className="arcade-shop" role="tabpanel" aria-label="Shop products">
          <p className="arcade-mini-title">TURN THE WHEEL · TAP AN ITEM</p>
          <div className="arcade-wheel" aria-label="Product wheel">
            <div className="arcade-wheel-ring" />
            {SHOP_GOODS.map((entry, index) => {
              const angle = ((index - selected) * 60 - 90) * Math.PI / 180;
              return (
                <button
                  type="button"
                  key={entry.id}
                  className={`arcade-wheel-item ${index === selected ? "is-selected" : ""}`}
                  aria-pressed={index === selected}
                  aria-label={`Select ${entry.name}`}
                  onClick={() => setSelected(index)}
                  style={{ left: `${50 + 39 * Math.cos(angle)}%`, top: `${50 + 39 * Math.sin(angle)}%` }}
                >
                  <span aria-hidden="true">{entry.icon}</span>
                </button>
              );
            })}
            <div key={`${good.id}-${pop}`} className={`arcade-wheel-centre ${pop ? "arcade-purchase-pop" : ""}`} aria-hidden="true">
              {good.icon}
            </div>
          </div>
          <div className="arcade-wheel-nav">
            <button type="button" aria-label="Previous item" onClick={() => setSelected((selected + SHOP_GOODS.length - 1) % SHOP_GOODS.length)}>◀</button>
            <div className="arcade-product-name"><strong>{good.name}</strong><span>{good.category} · {selected + 1}/{SHOP_GOODS.length}</span></div>
            <button type="button" aria-label="Next item" onClick={() => setSelected((selected + 1) % SHOP_GOODS.length)}>▶</button>
          </div>
          <p className="arcade-product-desc">{good.description}</p>
          {good.id === "snack" && <p className="arcade-inventory-count">In your bag: <strong>{owned}</strong> / 99</p>}
          {good.category === "Equipment" && owned > 0 && <p className="arcade-inventory-count">✓ Already owned</p>}
          <button className="arcade-buy" type="button" onClick={purchase} disabled={!available}>
            {available ? `${good.repeatable ? "BUY" : "PURCHASE"} · $${good.price}` : availability}
          </button>
          <p className="arcade-purchase-hint">{good.repeatable ? "Keep buying while you have cash." : "One-time upgrade."}</p>
        </div>
      ) : (
        <div role="tabpanel" aria-label="Retail careers" className="arcade-job-panel">
          <p className="arcade-mini-title">STAFF NOTICEBOARD</p>
          {room.hotspots.filter((h) => h.id !== "shelves").map((hotspot) => {
            const actions = hotspotActions(hotspot, state).filter((a) => a.id !== "buy-shoes" && a.id !== "buy-alarm");
            const lines = hotspot.lines?.(state) ?? [];
            return (
              <section className="arcade-job-section" key={hotspot.id}>
                <h3>{hotspot.label}</h3>
                {lines.map((line) => <p key={line} className="arcade-subline">{line}</p>)}
                <div className="arcade-choice-list">{actions.map((action) => <ActionChoice key={action.id} action={action} onRun={onRun} />)}</div>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function StatStrip({ room, state }: { room: Room; state: GameState }) {
  if (room.id === "bank") return <div className="arcade-stats"><span>Cash <strong>${state.money}</strong></span><span>Savings <strong>${state.bank}</strong></span></div>;
  if (room.id === "school") return <div className="arcade-stats"><span>Education <strong>{SCHOOLS[state.school] ?? "Dropout"}</strong></span><span>Intelligence <strong>{state.int}</strong></span></div>;
  if (["work", "yard", "diner"].includes(room.id)) {
    const career = room.id === "work" ? 0 : room.id === "yard" ? 3 : 1;
    return <div className="arcade-stats"><span>Role here <strong>{state.career === career ? currentRole(state).name : "Not employed"}</strong></span><span>Work XP <strong>{state.xp}</strong></span></div>;
  }
  if (room.id === "clinic" || room.id === "diner") return <div className="arcade-stats"><span>Energy <strong>{state.energy}%</strong></span><span>Cash <strong>${state.money}</strong></span></div>;
  if (room.id === "pawn") return <div className="arcade-stats"><span>Shoes <strong>{state.trainers ? "Owned" : "None"}</strong></span><span>Alarm <strong>{state.alarm ? "Owned" : "None"}</strong></span></div>;
  return null;
}

function ServiceDesk({ room, state, feedback, onRun }: { room: Room; state: GameState; feedback: Feedback | null; onRun: (a: ActionDef) => void }) {
  const [active, setActive] = useState(0);
  const hotspot = room.hotspots[active] ?? room.hotspots[0];
  const actions = hotspot ? hotspotActions(hotspot, state) : [];
  const lines = hotspot?.lines?.(state) ?? [];
  const showLevelUp = room.id === "school" && feedback?.success && feedback.changes.some((change) => change.includes("Intelligence") || change.includes("Education"));
  return (
    <div className="arcade-service" aria-label={`${room.title} services`}>
      <StatStrip room={room} state={state} />
      {showLevelUp && (
        <div key={feedback.message} className="arcade-levelup" role="status">
          ✨ {feedback.message.includes("Graduated") ? "GRADUATED!" : "INTELLIGENCE INCREASED!"} ✨
          <span>{feedback.changes.filter((change) => change.includes("Intelligence") || change.includes("Education")).join(" · ")}</span>
        </div>
      )}
      <div className="arcade-tabs arcade-service-tabs" role="tablist" aria-label={`${room.title} options`}>
        {room.hotspots.map((h, index) => (
          <button key={h.id} type="button" role="tab" aria-selected={active === index} onClick={() => setActive(index)}>
            {h.tag}
          </button>
        ))}
      </div>
      {hotspot && (
        <div className="arcade-service-page" role="tabpanel" aria-label={hotspot.label}>
          <h3>{hotspot.label}</h3>
          <p className="arcade-subline">{hotspot.hint}</p>
          {lines.map((line) => <p key={line} className="arcade-subline">{line}</p>)}
          <div className="arcade-choice-list">
            {actions.map((action) => <ActionChoice key={action.id} action={action} onRun={onRun} />)}
            {actions.length === 0 && <p className="arcade-empty">Nothing to do here at the moment.</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function ArcadeInterior({ room, state, feedback, onRun, onLeave }: SceneProps) {
  const attendant = STAFF[room.id] ?? STAFF.shop!;
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onLeave();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [onLeave]);

  const style = {
    "--arcade-wall": room.palette.wall,
    "--arcade-floor": room.palette.floor,
    "--arcade-accent": room.palette.accent,
    "--arcade-service-colour": attendant.accent,
  } as CSSProperties;

  return (
    <div className="arcade-interior absolute inset-0 z-20 flex flex-col overflow-hidden bg-card font-hand" style={style} data-room={room.id}>
      <header className="arcade-header">
        <p>Town Square Tales · Inside</p>
        <h2>{room.title}</h2>
      </header>
      <div className="arcade-stage">
        <CounterBackdrop attendant={attendant} />
        <section className="arcade-dialog" aria-label={`${room.title} interaction`}>
          <div className="arcade-dialog-heading">
            <div className="arcade-avatar" aria-hidden="true">{attendant.prop}</div>
            <div><p className="arcade-speaker">{attendant.name}</p><p className="arcade-greeting">“{attendant.greeting}”</p></div>
          </div>
          {room.id === "shop"
            ? <ShopWheel state={state} onRun={onRun} room={room} />
            : <ServiceDesk room={room} state={state} feedback={feedback} onRun={onRun} />}
        </section>
      </div>
      <footer className="arcade-footer">
        <button type="button" onClick={onLeave} aria-label="Leave building" className="arcade-leave">← Leave</button>
        <div className="arcade-feedback" aria-live="polite">
          {feedback
            ? <div key={`${feedback.message}-${state.money}`}>
                <p className={feedback.success ? "arcade-result-success" : "arcade-result-failed"}>{feedback.success ? "✓ " : "! "}{feedback.message}</p>
                {(feedback.changes.length > 0 || feedback.timeLine) && <div className="arcade-changes">
                  {feedback.changes.map((change) => <span key={change}>{change}</span>)}
                  {feedback.timeLine && <span>🕒 {feedback.timeLine}</span>}
                </div>}
              </div>
            : <p>Make yourself at home. Just don't touch the till.</p>}
        </div>
      </footer>
    </div>
  );
}
