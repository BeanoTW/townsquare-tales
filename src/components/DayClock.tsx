import { useEffect, useState } from "react";
import { timeLabel } from "@/lib/day-cycle";
export function DayClock({day,hour,money,energy}:{day:number;hour:number;money:number;energy:number}) {
 const [shown,setShown]=useState(hour);
 useEffect(()=>{
   if (typeof window==="undefined") return;
   if(Math.abs(hour-shown)>15 || hour<shown){setShown(hour);return;}
   if(shown>=hour)return;
   const timer=window.setTimeout(()=>setShown(h=>Math.min(hour,h+1)),95);
   return ()=>window.clearTimeout(timer);
 },[hour,shown]);
 return <div className="pointer-events-auto min-w-0 max-w-[calc(100%-9rem)] rounded-xl border-2 border-foreground bg-card/95 px-2 py-1 text-sm shadow sm:px-3">
  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 font-bold">
    <span>Day {day}</span><span aria-label="Game time">🕒 {timeLabel(shown)}</span><span>${money}</span><span>⚡ {energy}%</span>
  </div>
  <div className="mt-1 flex gap-[2px]" role="progressbar" aria-label="Hours elapsed today" aria-valuemin={0} aria-valuemax={24} aria-valuenow={shown}>
    {Array.from({length:24},(_,i)=><span key={i} className={`h-[6px] min-w-0 flex-1 rounded-[1px] transition-colors duration-150 ${i<shown?(i>=19||i<6?"bg-indigo-600":i>=16?"bg-orange-500":"bg-primary"):"bg-muted"}`}/>)}
  </div>
  <div className="text-[10px] text-muted-foreground">{Math.max(0,24-hour)}h remaining · actions advance time</div>
 </div>;
}
