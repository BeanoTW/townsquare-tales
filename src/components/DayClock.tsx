import { durationLabel } from "@/lib/day-cycle";
import { useEffect, useState } from "react";
import { timeLabel } from "@/lib/day-cycle";
export function DayClock({day,hour,money,energy,health=100}:{day:number;hour:number;money:number;energy:number;health?:number}) {
 const [shown,setShown]=useState(hour);
 useEffect(()=>{
   if (typeof window==="undefined") return;
   if(Math.abs(hour-shown)>15 || hour<shown){setShown(hour);return;}
   if(shown>=hour)return;
   const timer=window.setTimeout(()=>setShown(h=>Math.min(hour,h+1)),95);
   return ()=>window.clearTimeout(timer);
 },[hour,shown]);
 const elapsed = Math.max(0,Math.min(1,shown/24));
 const hand = elapsed*2*Math.PI;
 const handX = 12+7*Math.sin(hand), handY = 12-7*Math.cos(hand);
 return <div className="pointer-events-auto min-w-0 max-w-[calc(100%-9rem)] rounded-xl border-2 border-foreground bg-card/95 px-2 py-1 text-sm shadow sm:px-3">
  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-bold">
    <span>Day {day}</span><span className="inline-flex items-center gap-1" aria-label={`Game time ${timeLabel(shown)}; ${Math.round(elapsed*100)}% of day elapsed`}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f7fbff" stroke="#859bad" strokeWidth="1.5"/><circle cx="12" cy="12" r="10" fill="#e64646" stroke="none" style={{clipPath:"none"}} opacity="0"/>{elapsed>0&&<path d={`M12 12 L12 2 A10 10 0 ${elapsed>0.5?1:0} 1 ${12+10*Math.sin(elapsed*2*Math.PI)} ${12-10*Math.cos(elapsed*2*Math.PI)} Z`} fill="#ef5555"/>}<circle cx="12" cy="12" r="2" fill="#27394c"/><line x1="12" y1="12" x2={handX} y2={handY} stroke="#172e46" strokeWidth="1.7" strokeLinecap="round"/></svg>{timeLabel(shown)}</span><span>${money}</span><span>⚡ {energy}%</span><span aria-label={`Health ${health}%`}>❤️ {health}%</span>
  </div>
  <div className="mt-1 flex gap-[2px]" role="progressbar" aria-label="Hours remaining today" aria-valuemin={0} aria-valuemax={24} aria-valuenow={Math.max(0,24-shown)}>
    {Array.from({length:24},(_,i)=><span key={i} className={`h-[6px] min-w-0 flex-1 rounded-[1px] transition-colors duration-150 ${i>=shown?(i>=19||i<6?"bg-indigo-600":i>=16?"bg-orange-500":"bg-primary"):"bg-muted"}`}/>)}
  </div>
  <div className="text-[10px] text-muted-foreground">{durationLabel(24-hour)} remaining · actions advance time</div>
 </div>;
}
