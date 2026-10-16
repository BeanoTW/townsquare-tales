import { useState, type ReactNode } from "react";
import type { GameState } from "@/lib/game-state";
import type { ActionDef } from "@/lib/actions";
import { WITHDRAW_50, WITHDRAW_ALL, bankTransferAction, bankLoanAction, repayLoanAction } from "@/lib/actions";
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
type TellerService = "deposit" | "withdraw" | "loans";
const tellerServices: {id:TellerService;name:string;icon:string}[] = [
  {id:"deposit",name:"Deposit",icon:"↓"},
  {id:"withdraw",name:"Withdraw",icon:"↑"},
  {id:"loans",name:"Loans",icon:"▤"},
];

function BankBalances({state}:{state:GameState}) {
  return <div className="grid grid-cols-2 gap-2 rounded-lg bg-secondary p-2 text-xs">
    <span>Wallet <strong className="block text-base">${state.money.toLocaleString()}</strong></span>
    <span>Savings <strong className="block text-base">${state.bank.toLocaleString()}</strong></span>
  </div>;
}
function BankLoanInfo({state}:{state:GameState}) {
  const debt=state.loanDebt??0;
  return <div className="rounded-lg bg-secondary p-2 text-xs space-y-1">
    <p>Outstanding loan: <strong>${debt.toLocaleString()}</strong></p>
    <p>{debt>0?`Due on day ${state.loanDueDay || "—"}`:"No outstanding loan"} · 40% finance charge · 30-day term</p>
    <p>2% daily penalty after the deadline. Loans above $250 require employment.</p>
  </div>;
}
function ExactTransfer({kind,state,onRun}:{kind:"deposit"|"withdraw";state:GameState;onRun:(a:ActionDef)=>void}) {
  const [amount,setAmount]=useState("");
  const maximum=kind==="deposit"?state.money:state.bank;
  const parsed=Number(amount);
  const valid=amount.trim()!=="" && /^\d+$/.test(amount.trim()) && Number.isSafeInteger(parsed) && parsed>0 && parsed<=maximum;
  const error=amount.trim()===""?"":!Number.isSafeInteger(parsed)||!/^\d+$/.test(amount.trim())||parsed<=0?"Enter a positive whole-dollar amount.":parsed>maximum?"Not enough available funds.":"";
  const label=kind==="deposit"?"Deposit":"Withdraw";
  return <form className="space-y-2" onSubmit={e=>{
    e.preventDefault();
    if(!valid)return;
    onRun(bankTransferAction(kind,parsed));
    setAmount("");
  }}>
    <label htmlFor={`bank-exact-${kind}`} className="block text-sm font-bold">{label} amount ($)</label>
    <div className="flex gap-2">
      <input id={`bank-exact-${kind}`} aria-label={`${label} amount`} type="number" min="1" max={maximum}
        step="1" inputMode="numeric" placeholder="Enter amount" value={amount} onChange={e=>setAmount(e.target.value)}
        className="min-w-0 flex-1 rounded-xl border-2 border-foreground bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground"/>
      <button type="button" onClick={()=>setAmount(String(maximum))} disabled={maximum<=0}
        className={button}>All</button>
    </div>
    <p className="text-xs text-muted-foreground">Available: ${maximum.toLocaleString()}</p>
    {error&&<p role="alert" className="text-xs font-bold text-destructive">{error}</p>}
    <button type="submit" disabled={!valid}
      className="min-h-11 w-full rounded-xl border-2 border-foreground bg-foreground px-3 font-bold text-background disabled:opacity-50">
      Confirm {label.toLowerCase()}
    </button>
  </form>;
}
function BankDesk({id,state,godMode,onRun}:{id:string;state:GameState;godMode:boolean;onRun:(a:ActionDef)=>void}) {
  const [service,setService]=useState<TellerService|null>(null);
  const debt=state.loanDebt??0;
  const loan=debt>0;
  const specialist=id==="loans";
  const showLoans=specialist || (id==="teller"&&service==="loans");
  const showTransfer=id==="teller"&&(service==="deposit"||service==="withdraw");
  return <div className="space-y-2" data-bank-service={showLoans?"loans":service??id}>
    <p className="text-xs text-muted-foreground">
      {id==="teller"?"Cashier: “How can I help?”":
       specialist?"Mr. Sterling: “Let's see what the numbers say.”":
       id==="atm"?"ATM: Quick cash, no queue.":"Vault: Your savings, safely accounted for."}
    </p>
    {id==="teller"&&<div className="grid grid-cols-3 gap-2" role="group" aria-label="Banking services">
      {tellerServices.map(item=><button type="button" key={item.id}
        aria-pressed={service===item.id} onClick={()=>setService(item.id)}
        className={`min-h-12 rounded-xl border-2 border-foreground px-1.5 py-2 text-center text-sm font-bold ${service===item.id?"bg-foreground text-background":"bg-secondary text-foreground"}`}>
        <span aria-hidden="true">{item.icon} </span>{item.name}
      </button>)}
    </div>}
    <BankBalances state={state}/>
    {showTransfer&&<ExactTransfer key={service} kind={service as "deposit"|"withdraw"} state={state} onRun={onRun}/>}
    {showLoans&&<>
      <BankLoanInfo state={state}/>
      {loan?<div className="space-y-2">
        <p className="text-xs font-bold">Repay your current loan</p>
        <div className="grid grid-cols-2 gap-2">
          {[repayLoanAction(100),repayLoanAction(500),repayLoanAction("all")].map(a=><QuickAction key={a.id} action={a} state={state} godMode={godMode} onRun={onRun}/>)}
        </div>
        <p className="text-xs text-muted-foreground">Repay this loan before applying for another.</p>
      </div>:<div className="space-y-2">
        <p className="text-xs font-bold">Apply for a loan</p>
        <div className="grid grid-cols-2 gap-2">
          {[250,1000,2500,5000].map(amount=><QuickAction key={amount} action={bankLoanAction(amount)} state={state} godMode={godMode} onRun={onRun}/>)}
        </div>
      </div>}
    </>}
    {id==="atm"&&<div className="grid grid-cols-2 gap-2">{[WITHDRAW_50,WITHDRAW_ALL].map(a=><QuickAction key={a.id} action={a} state={state} godMode={godMode} onRun={onRun}/>)}</div>}
    {id==="vault"&&<p className="text-xs">Savings earn 0.1% interest each night. Visit the teller for everyday banking.</p>}
  </div>;
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
