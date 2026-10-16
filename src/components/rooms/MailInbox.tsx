import { useState } from "react";
import type { GameState } from "@/lib/game-state";
import { hasRead, hasReplied, mailFor, markRead, replyFamily } from "@/lib/town-mail";

export function MailInbox({state,atPostOffice,onChange,onClose}:{state:GameState;atPostOffice:boolean;onChange:(next:GameState)=>void;onClose:()=>void}) {
  const [opened,setOpened]=useState<number|null>(null);
  const letters=mailFor(state);
  const selected=letters.find(l=>l.id===opened);
  const registered=Boolean(state.mailbox);
  const openLetter=(id:number)=>{
    setOpened(id);
    if(!hasRead(state,id))onChange(markRead(state,id));
  };
  return <div role="dialog" aria-modal="true" aria-label="Your letters"
    className="absolute inset-x-3 top-[max(6rem,env(safe-area-inset-top))] bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 mx-auto flex max-w-lg flex-col overflow-hidden rounded-2xl border-2 border-foreground bg-card text-foreground shadow-2xl">
    <div className="flex shrink-0 items-center justify-between gap-2 border-b border-foreground/30 p-3">
      <div><h2 className="text-lg font-bold">✉ {atPostOffice?"Post Office · Held Mail":"Your Mailbox"}</h2>
        <p className="text-xs text-muted-foreground">{registered?"Address registered · Letters kept permanently":"Unregistered address · Post held for collection"}</p>
      </div>
      <button type="button" className="min-h-11 min-w-11 rounded-lg border-2 border-foreground bg-secondary font-bold" onClick={onClose} aria-label="Close mail">✕</button>
    </div>
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-3 [touch-action:pan-y] [-webkit-overflow-scrolling:touch]" onPointerDown={e=>e.stopPropagation()} onPointerMove={e=>e.stopPropagation()} onWheel={e=>e.stopPropagation()}>
    {!registered&&!atPostOffice?<div className="space-y-3">
      <p className="font-bold">You haven't registered a mailbox yet.</p>
      <p>Visit Town Post Office to register one for $25. Your letters are being held safely until then.</p>
    </div>:selected?<div className="space-y-3">
      <button type="button" className="min-h-11 rounded-lg border border-foreground bg-secondary px-3 text-sm font-bold" onClick={()=>setOpened(null)}>← Back to letters</button>
      <p className="text-xs text-muted-foreground">Day {selected.day} · {selected.category}</p>
      <h3 className="text-xl font-bold">{selected.subject}</h3>
      <p className="font-bold">From {selected.from}</p>
      <p className="whitespace-pre-wrap rounded-xl bg-secondary p-4 leading-relaxed">{selected.body}</p>
      {selected.response&&(hasReplied(state,selected.id)
        ? <p className="rounded-lg border p-3 text-sm">✓ You replied to this letter.</p>
        : <button type="button" className="min-h-12 w-full rounded-xl border-2 border-foreground bg-primary px-3 font-bold text-primary-foreground"
            onClick={()=>onChange(replyFamily(state,selected.id))}>Write a reply</button>)}
      {selected.category==="family"&&<p className="text-xs text-muted-foreground">Keeping in touch affects your relationship with your family, not your money or XP.</p>}
    </div>:<div className="space-y-2">
      <p className="text-sm text-muted-foreground">{letters.length} letters · {letters.filter(l=>!hasRead(state,l.id)).length} unread</p>
      {letters.length===0&&<p className="rounded-lg bg-secondary p-4">Nothing has arrived yet. Check back in a few days.</p>}
      {letters.map(l=><button type="button" key={l.id} onClick={()=>openLetter(l.id)}
        className="flex min-h-16 w-full items-center gap-3 rounded-xl border-2 border-foreground bg-secondary p-3 text-left">
        <span aria-hidden="true" className="text-2xl">{hasRead(state,l.id)?"✉":"📩"}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-bold">{l.subject}{!hasRead(state,l.id)?" · New":""}</span>
          <span className="block text-xs text-muted-foreground">{l.from} · Day {l.day}</span>
        </span>
      </button>)}
    </div>}
    </div>
  </div>;
}
