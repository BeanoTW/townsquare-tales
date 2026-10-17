import {useState} from "react";
import type {GameState} from "@/lib/game-state";
import {beginFight,takeTurn,opponentMove,settleFight,MOVES,PUB_STAKES,type Fight,type MoveId} from "@/lib/combat";
export function PubBrawl({state,onChange,onExit}:{state:GameState;onChange:(s:GameState)=>void;onExit:()=>void}){
 const [fight,setFight]=useState<Fight|null>(null);const [error,setError]=useState("");
 const start=(stake:number)=>{try{setFight(beginFight(state,stake,"pub",Math.floor(Math.random()*4)));setError("");}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const turn=(move:MoveId)=>{if(!fight||fight.over)return;try{let result=takeTurn(fight,move);if(!result.over)result=takeTurn(result,opponentMove(result));setFight(result);}catch(e){setError(e instanceof Error?e.message:String(e));}};
 const finish=()=>{if(!fight?.over)return;onChange({...state,...settleFight(state,fight)});onExit();};
 return <div className="absolute inset-0 z-[95] flex items-center justify-center bg-black/85 p-3" data-pub-brawl>
  <div className="w-full max-w-md rounded-xl border-2 border-foreground bg-background p-4 space-y-3 max-h-[94vh] overflow-auto">
   <div className="flex items-center justify-between"><h2 className="text-xl font-black">🥊 The Tipsy Stick Brawls</h2><button className="rounded border px-3 py-2" onClick={onExit} disabled={!!fight&&!fight.over}>Leave</button></div>
   {!fight?<><p>The regulars clear a space. Pick your stake — winner takes both bets!</p><div className="flex gap-2">{PUB_STAKES.map(n=><button key={n} onClick={()=>start(n)} disabled={state.money<n||(state.health??100)<=0} className="flex-1 rounded-lg border-2 border-foreground p-3 font-bold">Bet ${n}</button>)}</div><p className="text-sm">Your health: {state.health??100}/100 · Cash: ${state.money}</p></>:
   <><div className="grid grid-cols-2 gap-3">{[fight.player,fight.opponent].map(f=><div key={f.name} className="rounded-lg bg-secondary p-3"><p className="font-bold">{f.name}</p><p>❤️ {f.hp} HP</p><div className="h-2 rounded bg-foreground/15 overflow-hidden"><div className="h-full bg-green-600" style={{width:`${Math.min(100,f.hp)}%`}}/></div><p>⚡ {f.ap}/5 AP {f.guard?"· Blocking":""}</p></div>)}</div>
    <p className="font-semibold">{fight.over?(fight.winner==="player"?"You win the bet!":"You've been knocked out — hospital bill: $350."):"Round "+fight.round+" · Your turn · Wager $"+fight.stake}</p>
    {!fight.over?<div className="grid grid-cols-2 gap-2">{(Object.keys(MOVES) as MoveId[]).map(id=><button key={id} disabled={fight.player.ap<MOVES[id].cost} onClick={()=>turn(id)} className="rounded-lg border-2 border-foreground p-3 text-left disabled:opacity-40"><strong>{MOVES[id].name}</strong><div className="text-xs">{MOVES[id].cost} AP · {id==="recover"?"+2 AP":id==="block"?"Defend":`${MOVES[id].min}–${MOVES[id].max} damage`}</div></button>)}</div>:<button onClick={finish} className="w-full rounded-lg bg-primary p-3 text-primary-foreground font-black">Collect result & leave</button>}
    <div aria-live="polite" className="space-y-1 text-sm">{fight.history.slice(-4).map((line,i)=><p key={i}>{line}</p>)}</div></>}
   {error&&<p role="alert" className="text-red-600">{error}</p>}
  </div></div>;
}
