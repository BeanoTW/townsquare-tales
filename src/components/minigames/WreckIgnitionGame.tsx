import { useMemo, useState } from "react";

const SYMBOLS = ["◆", "●", "▲", "■"] as const;
type Props = { day: number; attempts: number; onFinish: (won:boolean)=>void; onExit:()=>void };

export function WreckIgnitionGame({day,attempts,onFinish,onExit}:Props) {
 const pattern = useMemo(() => Array.from({length:3},(_,i)=>SYMBOLS[(day*7+attempts*11+i*i*3+i)%4]!),[day,attempts]);
 const [step,setStep] = useState(0);
 const [phase,setPhase] = useState<"remember"|"repeat"|"result">("remember");
 const [wrong,setWrong] = useState(false);
 const [won,setWon] = useState(false);
 const choose = (symbol:string) => {
  const failed = wrong || symbol !== pattern[step];
  setWrong(failed);
  if(step===2) {setWon(!failed);setPhase("result");}
  else setStep(step+1);
 };
 return <div role="dialog" aria-modal="true" aria-label="Old wreck challenge" className="absolute inset-0 z-[70] flex items-center justify-center bg-black/80 p-4">
  <section className="w-full max-w-sm rounded-xl border-2 border-foreground bg-card p-5 text-center shadow-2xl">
   <h2 className="text-xl font-bold">The old wreck</h2>
   <p className="my-3 text-sm">Remember three abstract symbols and repeat them. This is a fictional arcade challenge.</p>
   {phase==="remember" && <>
    <p className="my-6 text-4xl tracking-widest">{pattern.join(" ")}</p>
    <button className="min-h-12 w-full rounded-lg bg-primary text-primary-foreground" onClick={()=>setPhase("repeat")}>Remembered — let's try</button>
   </>}
   {phase==="repeat" && <>
    <p className="my-4 font-bold">Symbol {step+1} of 3</p>
    <div className="grid grid-cols-2 gap-3">{SYMBOLS.map(symbol=><button key={symbol} aria-label={"Choose "+symbol} className="min-h-20 rounded-lg border-2 border-foreground bg-secondary text-4xl" onClick={()=>choose(symbol)}>{symbol}</button>)}</div>
   </>}
   {phase==="result" && <>
    <p role="status" className="my-6 font-bold">{won?"The old engine catches!":"Only a splutter this time."}</p>
    <button className="min-h-12 w-full rounded-lg bg-primary text-primary-foreground" onClick={()=>onFinish(won)}>Finish attempt</button>
   </>}
   {phase!=="result" && <button className="mt-4 min-h-11 w-full rounded-lg border border-foreground" onClick={onExit}>Leave the wreck</button>}
  </section>
 </div>;
}
