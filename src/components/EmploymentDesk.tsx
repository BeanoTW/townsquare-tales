import { useState } from "react";
import { CAREERS, currentRole, nextRole, missingRequirements, type CareerStats } from "@/lib/careers";

type Props = {
  player: CareerStats;
  onShift: () => void;
  onPromotion: () => void;
  onApply: (career: number) => void;
};
const schoolNames=["Dropout","High School","College","University Degree","PhD"];
export function EmploymentDesk({player,onShift,onPromotion,onApply}:Props) {
 const [view,setView]=useState<"career"|"jobs">("career");
 const current=CAREERS[player.career] ?? CAREERS[0];
 const role=currentRole(player), next=nextRole(player);
 const missing=next?missingRequirements(player,next):[];
 return <section className="grid gap-3 text-base" aria-label="Employment office">
  <div className="rounded-lg border-2 border-foreground bg-secondary/70 p-3">
   <div className="text-sm uppercase tracking-wide text-muted-foreground">Your employment</div>
   <h3 className="text-2xl font-bold">{role.name}</h3>
   <p>{current.name} · <strong>${role.pay}/hour</strong> · ${role.pay*4} per shift</p>
   <div className="mt-2 flex justify-between text-sm"><span>Work experience</span><strong>{player.xp} XP</strong></div>
   <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-label="Experience towards next role">
    <div className="h-full bg-primary transition-all" style={{width:`${next?Math.min(100,Math.round(player.xp/Math.max(next.experience,1)*100)):100}%`}} />
   </div>
   <button className="mt-3 min-h-11 w-full rounded-md border-2 border-foreground bg-primary px-3 py-2 text-left font-bold text-primary-foreground" onClick={onShift}>Work a 4-hour shift · +${role.pay*4} · +4 XP</button>
  </div>
  <div className="flex gap-2">
   <button type="button" aria-pressed={view==="career"} className={`min-h-11 flex-1 rounded-md border-2 border-foreground px-2 ${view==="career"?"bg-primary text-primary-foreground":"bg-card"}`} onClick={()=>setView("career")}>Progression</button>
   <button type="button" aria-pressed={view==="jobs"} className={`min-h-11 flex-1 rounded-md border-2 border-foreground px-2 ${view==="jobs"?"bg-primary text-primary-foreground":"bg-card"}`} onClick={()=>setView("jobs")}>Job board</button>
  </div>
  {view==="career"?<div className="grid gap-2">
   <h3 className="text-xl font-bold">Career ladder</h3>
   {current.roles.map((r,i)=>{
    const active=i===player.job, completed=i<player.job, eligible=i===player.job+1&&missing.length===0;
    return <div key={r.name} className={`rounded-md border-2 p-3 ${active?"border-primary bg-primary/10":"border-foreground/60 bg-card"}`}>
     <div className="flex items-center justify-between gap-2"><strong>{completed?"✓ ":active?"➜ ":""}{r.name}</strong><strong>${r.pay}/h</strong></div>
     <p className="text-sm text-muted-foreground">{completed?"Previously held":active?"Current job":`Requires ${r.experience} XP${r.school?", "+schoolNames[r.school]:""}`}</p>
     {i===player.job+1&&<><p className="mt-1 text-sm">{eligible?"✓ You're eligible to request promotion.":`Still needed: ${missing.join(", ")}`}</p><button onClick={onPromotion} disabled={!eligible} className="mt-2 min-h-11 w-full rounded border-2 border-foreground bg-secondary px-3 text-left disabled:opacity-50">Request promotion</button></>}
    </div>;
   })}
  </div>:<div className="grid gap-2">
   <h3 className="text-xl font-bold">Open career paths</h3>
   <p className="text-sm text-muted-foreground">You can switch industries. New positions start at entry level; a quarter of your work experience transfers.</p>
   {CAREERS.map((c,i)=><div key={c.name} className="rounded-md border-2 border-foreground bg-card p-3">
    <div className="flex items-center justify-between gap-2"><strong>{c.name}</strong><span className="text-sm">Up to ${c.roles.at(-1)?.pay}/h</span></div>
    <p className="text-sm">{c.roles[0].name} · ${c.roles[0].pay}/hour</p>
    <p className="text-sm text-muted-foreground">{i===player.career?"Your current field":"Entry-level vacancy · 1h application"}</p>
    <button disabled={i===player.career} onClick={()=>onApply(i)} className="mt-2 min-h-11 w-full rounded border-2 border-foreground bg-secondary px-3 text-left disabled:opacity-50">{i===player.career?"Currently employed here":"Apply for this job"}</button>
   </div>)}
  </div>}
 </section>;
}
