import { useEffect, useState, type ReactNode } from "react";
import type { CrewMember } from "@/lib/gang-career";

export type CrewTopic = "talk" | "work" | "business" | "gear" | "news";
const roles = { mick: ["Organiser","●"], lez: ["Lookout","◉"], nia: ["Handler","◆"] } as const;
export function CrewDialogueCard({ speaker, onSpeaker, line, hostile, children, onLeave, topic, onTopic, bubble }: {
 speaker: CrewMember; onSpeaker:(id:CrewMember)=>void; line:string; hostile:boolean;
 children:ReactNode; onLeave:()=>void; topic:CrewTopic; onTopic:(topic:CrewTopic)=>void; bubble?:string;
}) {
 const members = ["mick","lez","nia"] as const;
 const topics: CrewTopic[] = hostile?["talk"]:speaker==="mick"?["talk","work"]:speaker==="lez"?["talk","news"]:["talk","business","gear"];
 return <div role="dialog" aria-label="Talk to the crew" data-crew-dialogue className="pointer-events-none absolute inset-0 z-30">
   <div className="pointer-events-auto absolute left-1/2 top-[17%] w-[min(86vw,340px)] -translate-x-1/2 rounded-2xl border-2 border-foreground/40 bg-card/95 px-3 py-2 text-center shadow-lg backdrop-blur-sm" data-crew-speech>
    <div className="text-xs font-bold uppercase tracking-wide">{speaker} · {roles[speaker][0]}</div>
    <p role="status" className="text-sm leading-snug">{bubble ?? line}</p>
    <span aria-hidden="true" className="absolute -bottom-2 left-1/2 h-3.5 w-3.5 -translate-x-1/2 rotate-45 border-b-2 border-r-2 border-foreground/40 bg-card"/>
   </div>
   <section className={"pointer-events-auto absolute inset-x-2 bottom-2 mx-auto flex max-h-[min(38dvh,340px)] max-w-md flex-col overflow-hidden rounded-2xl border-2 shadow-xl backdrop-blur-md "+(hostile?"border-amber-500/70 bg-[#30231e]/95 text-white":"border-white/20 bg-[#19232c]/95 text-white")}>
    <div className="grid shrink-0 grid-cols-3 gap-1 border-b border-white/15 p-1.5">
     {members.map(id=><button key={id} type="button" aria-pressed={speaker===id} disabled={hostile&&id!=="mick"} onClick={()=>{onSpeaker(id);onTopic("talk");}} className={"min-h-11 rounded-lg px-1 py-1 text-center text-sm font-bold "+(speaker===id?"bg-white/20":"text-white/75")+" disabled:opacity-40"}>
       <span className="block">{id[0]!.toUpperCase()+id.slice(1)} {roles[id][1]}</span><span className="block text-[10px] font-normal">{roles[id][0]}</span>
     </button>)}
    </div>
    {!hostile&&<nav aria-label="Conversation subjects" className="flex shrink-0 gap-1 overflow-x-auto border-b border-white/10 px-2 py-1.5">
      {topics.map(t=><button key={t} type="button" aria-pressed={topic===t} onClick={()=>onTopic(t)} className={"min-h-9 shrink-0 rounded-lg px-3 text-xs font-bold "+(topic===t?"bg-white text-[#19232c]":"border border-white/25 text-white")}>{t==="talk"?"Talk":t==="work"?"Ask about work":t==="news"?"Street news":t==="business"?"Business":"Gear"}</button>)}
    </nav>}
    <div className="min-h-0 overflow-y-auto overscroll-contain p-2 [&_button]:min-h-11 [&_button]:rounded-lg [&_button]:border [&_button]:border-white/25 [&_button]:bg-white/10 [&_button]:px-3 [&_button]:py-2 [&_button]:text-white [&_button]:font-bold [&_button]:text-sm [&_button]:w-full [&_button]:text-left [&_button:disabled]:opacity-40" data-crew-actions>{children}</div>
    <button type="button" onClick={onLeave} className="min-h-11 shrink-0 border-t border-white/15 px-3 text-left text-sm font-bold text-white/80">← Back away</button>
   </section>
 </div>;
}
