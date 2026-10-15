import type { ReactNode } from "react";
import type { GameState } from "@/lib/game-state";
import { HOUSES, SCHOOLS } from "@/lib/game-data";
import { CAREERS, currentRole, nextRole } from "@/lib/careers";
import { FURNITURE, ownsFurniture } from "@/lib/furniture";
import { weaponName } from "@/lib/counter-robbery";

const money = (n: number) => "$" + n.toLocaleString();
function PanelSection({ title, children }: { title: string; children: ReactNode }) {
  return <section className="space-y-2"><h3 className="px-1 text-xs font-black uppercase tracking-[.18em] text-muted-foreground">{title}</h3>{children}</section>;
}
function Metric({ label, value, helper }: { label: string; value: ReactNode; helper?: string }) {
  return <div className="min-w-0 rounded-xl border-2 border-foreground/80 bg-background/70 px-3 py-2"><p className="text-xs text-muted-foreground">{label}</p><p className="break-words text-xl font-bold leading-tight">{value}</p>{helper && <p className="text-xs text-muted-foreground">{helper}</p>}</div>;
}
function ItemRow({ icon, title, detail, children }: { icon: string; title: string; detail: string; children?: ReactNode }) {
  return <div className="flex min-w-0 items-center gap-3 rounded-xl border-2 border-foreground/80 bg-background/70 p-3"><span aria-hidden className="text-2xl">{icon}</span><div className="min-w-0 flex-1"><p className="font-bold">{title}</p><p className="text-sm text-muted-foreground">{detail}</p></div>{children}</div>;
}
const actionClass = "min-h-11 shrink-0 rounded-lg border-2 border-foreground bg-secondary px-3 py-2 text-sm font-bold";
export function PlayerDashboard({ state: s, align, won }: { state: GameState; align: string; won: boolean }) {
  const role = currentRole(s), upcoming = nextRole(s);
  const working = s.employed !== 0;
  return <div data-player-dashboard className="space-y-5 pb-2">
    <div className="rounded-2xl border-2 border-foreground bg-secondary p-4"><div className="flex items-center justify-between gap-3"><div><p className="text-xs font-bold uppercase tracking-widest">Your story so far</p><p className="text-2xl font-black">Day {s.day}</p></div><div className="rounded-full border-2 border-foreground bg-background px-3 py-1 text-sm font-bold">{align} · {s.karma} karma</div></div>{won && <p className="mt-2 font-bold">🏆 Mansion + CEO achieved!</p>}</div>
    <PanelSection title="At a glance"><div className="grid grid-cols-2 gap-2"><Metric label="Energy" value={`${s.energy}/100`}/><Metric label="Cash" value={money(s.money)}/><Metric label="Savings" value={money(s.bank)}/><Metric label="Home" value={HOUSES[s.house]?.name ?? "Cardboard Box"}/></div><div className="grid grid-cols-2 gap-2"><Metric label="Heat" value={s.heat ? `${s.heat}` : "Clear"}/><Metric label="Education" value={SCHOOLS[s.school] ?? "Dropout"}/></div></PanelSection>
    <PanelSection title="Career progression"><div className="rounded-2xl border-2 border-foreground bg-secondary p-4"><p className="text-xs uppercase tracking-widest text-muted-foreground">{working ? CAREERS[s.career]?.name : "Not employed"}</p><p className="mt-1 text-xl font-bold">{working ? role.name : "Looking for work"}</p><div className="mt-3 grid grid-cols-2 gap-2 text-sm"><span>Work XP <strong>{s.xp}</strong></span><span>{working ? `${money(role.pay)}/hour` : "Visit a workplace"}</span></div>{working && <div className="mt-3 rounded-lg bg-background p-2 text-sm">{upcoming ? `Next promotion: ${upcoming.name} · ${money(upcoming.pay)}/hour` : "Top career rank reached"}</div>}</div><div className="grid grid-cols-3 gap-2"><Metric label="Strength" value={s.str}/><Metric label="Intelligence" value={s.int}/><Metric label="Charm" value={s.cha}/></div></PanelSection>
    <PanelSection title="Relationships"><div className="rounded-xl border-2 border-foreground bg-background/70 px-3">{([["Mara",s.relMara],["Nox",s.relNox],["Gus",s.relGus],["Ivy",s.relIvy]] as const).map(([name,value])=><div key={name} className="flex items-center justify-between border-b border-foreground/20 py-2 last:border-0"><span className="font-bold">{name}</span><span className="rounded-full bg-secondary px-3 py-1 text-sm">{value > 0 ? "+" : ""}{value} · {value > 0 ? "Friendly" : value < 0 ? "Tense" : "Neutral"}</span></div>)}</div></PanelSection>
    <PanelSection title="Lifestyle"><div className="grid grid-cols-2 gap-2"><Metric label="Furniture" value={`${FURNITURE.filter(item=>ownsFurniture(s.furniture,item.id)).length}/${FURNITURE.length}`}/><Metric label="Skateboard" value={s.skateboard ? "Owned" : "None"}/><Metric label="Alarm clock" value={s.alarm ? "Owned" : "None"}/><Metric label="Shoes" value={s.trainers ? "Owned" : "None"}/></div></PanelSection>
  </div>;
}
export function InventoryDashboard({ state: s, onEquip, onSnack }: { state: GameState; onEquip: () => void; onSnack: () => void }) {
 return <div data-inventory-dashboard className="space-y-5 pb-2">
  <p className="text-sm text-muted-foreground">Your gear, supplies and belongings. Equip items straight from their cards.</p>
  <PanelSection title="Equipment">
    <ItemRow icon="🛹" title="Skateboard" detail={!s.skateboard ? "Not owned" : s.skateboardEquipped ? "Equipped · 1.5× speed" : "Owned · Unequipped"}>{s.skateboard > 0 && <button className={actionClass} onClick={onEquip}>{s.skateboardEquipped ? "Unequip" : "Equip"}</button>}</ItemRow>
    <ItemRow icon="👟" title="Running shoes" detail={s.trainers ? "Owned · 1.35× walking speed" : "Not owned"}/>
    <ItemRow icon="🗡️" title="Weapon" detail={weaponName(s)}/>
    <ItemRow icon="⏰" title="Alarm clock" detail={s.alarm ? "Owned" : "Not owned"}/>
  </PanelSection>
  <PanelSection title="Consumables"><div className="grid grid-cols-2 gap-2"><Metric label="🚬 Smokes" value={s.smokes}/><div className="rounded-xl border-2 border-foreground/80 bg-background/70 p-3"><p className="text-xs text-muted-foreground">🍫 Snacks</p><p className="text-xl font-bold">{s.snacks}</p>{s.snacks > 0 && <button className={actionClass+" mt-2 w-full"} onClick={onSnack}>Eat · +25 energy</button>}</div></div></PanelSection>
  <PanelSection title="Home & valuables"><ItemRow icon="🛋️" title="Furniture" detail={`${FURNITURE.filter(item=>ownsFurniture(s.furniture,item.id)).length} of ${FURNITURE.length} items collected`}/></PanelSection>
 </div>;
}
