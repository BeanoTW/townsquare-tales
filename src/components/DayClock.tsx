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
 return <div className="pointer-events-auto min-w-0 max-w-[calc(100%-9rem)] px-1 py-1 text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.95),0_0_5px_rgba(0,0,0,0.85)]">
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-bold leading-tight">
    <span className="whitespace-nowrap text-white/90">Day {day}</span><span className="inline-flex items-center gap-1" aria-label={`Game time ${timeLabel(shown)}; ${Math.round(elapsed*100)}% of day elapsed`}><svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10" fill="#f7fbff" stroke="#859bad" strokeWidth="1.5"/><circle cx="12" cy="12" r="10" fill="#e64646" stroke="none" style={{clipPath:"none"}} opacity="0"/>{elapsed>0&&<path d={`M12 12 L12 2 A10 10 0 ${elapsed>0.5?1:0} 1 ${12+10*Math.sin(elapsed*2*Math.PI)} ${12-10*Math.cos(elapsed*2*Math.PI)} Z`} fill="#ef5555"/>}<circle cx="12" cy="12" r="2" fill="#27394c"/><line x1="12" y1="12" x2={handX} y2={handY} stroke="#172e46" strokeWidth="1.7" strokeLinecap="round"/></svg>{timeLabel(shown)}</span><span className="whitespace-nowrap text-emerald-300">${money}</span><span className="whitespace-nowrap text-amber-200">⚡ {energy}%</span><span className="whitespace-nowrap text-rose-200" aria-label={`Health ${health}%`}>❤️ {health}%</span>
  </div>
  <div className="mt-1 text-[10px] leading-tight text-white/65">{durationLabel(24-hour)} remaining · actions advance time</div>
 </div>;
}
