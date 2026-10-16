import { useState, type ReactNode } from "react";
import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { DEPOSIT_50, DEPOSIT_ALL, WITHDRAW_50, WITHDRAW_ALL, bankLoanAction, repayLoanAction } from "@/lib/actions";
import { SHOP_GOODS, shopAvailability } from "@/lib/shop-catalog";
import { actionBlockReason } from "@/components/rooms/ActionPanel";
import { hotspotActions, type Hotspot } from "@/lib/rooms";

type Filter = "All" | "Food & drink" | "Equipment" | "Smokes";
const filters: Filter[] = ["All", "Food & drink", "Equipment", "Smokes"];
const button = "min-h-11 rounded-xl border-2 border-foreground bg-secondary px-3 py-2 text-left text-sm font-bold disabled:opacity-50";
function QuickAction({action,state,godMode,onRun,children}: {action:ActionDef;state:GameState;godMode:boolean;onRun:(a:ActionDef)=>void;children?:ReactNode}) {
  const blocked=actionBlockReason(state,action,godMode);
  return <button type="button" className={button} disabled={blocked!==null} title={blocked??action.note??""} onClick={()=>onRun(action)}>
    <span className="block">{children??action.label}</span>
    <span className="block text-xs font-normal opacity-70">{blocked??(action.cost?`$${action.cost} · `:"")+(action.hours?`${action.hours}h`:"Instant")}</span>
  </button>;
}
function ShopStock({state,godMode,onRun}:{state:GameState;godMode:boolean;onRun:(a:ActionDef)=>void}) {
  const [filter,setFilter]=useState<Filter>("All");
  const goods=SHOP_GOODS.filter(g=>filter==="All"||(filter==="Equipment"&&g.category==="Equipment")||(filter==="Smokes"&&g.id==="smokes")||(filter==="Food & drink"&&g.category==="Consumable"&&g.id!=="smokes"));
  return <>
    <p className="text-xs text-muted-foreground">Shopkeeper: “Exact change, please.” · Wallet $${state.money.toLocaleString()}</p>
    <div className="flex gap-1.5 overflow-x-auto py-1" role="group" aria-label="Product categories">
      {filters.map(f=><button key={f} type="button" aria-pressed={filter===f} onClick={()=>setFilter(f)} className={`min-h-9 shrink-0 rounded-full border px-2.5 text-xs font-bold ${filter===f?"bg-primary text-primary-foreground":"bg-secondary"}`}>{f}</button>)}
    </div>
    <div className="grid grid-cols-2 gap-2">
      {goods.map(g=>{
        const reason=!godMode&&!g.available(state)?shopAvailability(g,state):null;
        const blocked=actionBlockReason(state,g.action(state),godMode)??reason;
        return <button type="button" key={g.id} className={button} disabled={blocked!==null} onClick={()=>onRun(g.action(state))} aria-label={blocked?`${g.name}: ${blocked}`:`Buy ${g.name} for $${g.price}`}>
          <span className="block truncate">{g.icon} {g.name}</span>
          <span className="block text-xs font-normal opacity-75">$${g.price} · {blocked??(g.repeatable?"Buy":"Purchase")}</span>
        </button>;
      })}
    </div>
  </>;
}
function BankDesk({id,state,godMode,onRun}:{id:string;state:GameState;godMode:boolean;onRun:(a:ActionDef)=>void}) {
  const loan=(state.loanDebt??0)>0;
  const options=id==="teller"?[DEPOSIT_50,DEPOSIT_ALL,WITHDRAW_50,WITHDRAW_ALL]:id==="atm"?[WITHDRAW_50,WITHDRAW_ALL]:id==="loans"?(loan?[repayLoanAction(100),repayLoanAction(500),repayLoanAction("all")]:[bankLoanAction(250),bankLoanAction(1000),bankLoanAction(2500),bankLoanAction(5000)]):[];
  return <>
    <p className="text-xs text-muted-foreground">{id==="loans"?"Mr. Sterling: “Let's see what the numbers say.”":id==="atm"?"Quick cash without the conversation.":"Cashier: “How can I help today?”"}</p>
    <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary/70 p-2 text-xs">
      <span>Wallet <strong className="block text-base">$${state.money.toLocaleString()}</strong></span>
      <span>Savings <strong className="block text-base">$${state.bank.toLocaleString()}</strong></span>
    </div>
    {id==="loans"&&<p className="text-xs">Debt: <strong>$${(state.loanDebt??0).toLocaleString()}</strong> · Due day {state.loanDueDay||"—"} · 40% finance charge · 2% daily if overdue. Larger loans require employment.</p>}
    {id==="vault"&&<p className="text-sm">Your savings earn 0.1% interest each night.</p>}
    <div className="grid grid-cols-2 gap-2">{options.map(a=><QuickAction key={a.id} action={a} state={state} godMode={godMode} onRun={onRun}/>)}</div>
  </>;
}
export function InteriorCommercePanel({venue,hotspot,state,godMode,onRun,onClose}:{venue:string;hotspot:Hotspot;state:GameState;godMode:boolean;onRun:(a:ActionDef)=>void;onClose:()=>void}) {
  const shop=venue==="shop"&&(hotspot.id==="shelves"||hotspot.id==="checkout");
  const bank=venue==="bank"&&["teller","atm","loans","vault"].includes(hotspot.id);
  const actions=hotspotActions(hotspot,state);
  return <section role="dialog" aria-label={hotspot.label} data-panel data-interior-commerce className="rounded-2xl border-2 border-foreground bg-card/95 p-3 shadow-2xl backdrop-blur-md">
    <div className="mb-2 flex items-start justify-between gap-2">
      <div><h3 className="font-bold text-base">{shop?"🏪 ":bank?"🏦 ":""}{hotspot.label}</h3><p className="text-xs text-muted-foreground">{hotspot.hint}</p></div>
      <button type="button" aria-label="Close panel" onClick={onClose} className="min-h-10 min-w-10 rounded-lg border-2 border-foreground bg-secondary font-bold">✕</button>
    </div>
    {shop&&<ShopStock state={state} godMode={godMode} onRun={onRun}/>}
    {bank&&<BankDesk id={hotspot.id} state={state} godMode={godMode} onRun={onRun}/>}
    {shop&&hotspot.id==="checkout"&&actions.filter(a=>a.id.includes("shift")).map(a=><div className="mt-2" key={a.id}><QuickAction action={a} state={state} godMode={godMode} onRun={onRun}/></div>)}
  </section>;
}
