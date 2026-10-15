import { useEffect, useState } from "react";
import { RENDER_EVENT, type RenderSample } from "./RenderDiagnosticsProbe";

function snapshot(sceneName: string, sample: RenderSample | null) {
  const canvas = typeof document === "undefined" ? null : document.querySelector("canvas");
  const glCanvas = canvas instanceof HTMLCanvasElement ? canvas : null;
  const data = {
    screen: sceneName,
    graphics: sample?.renderer ?? (glCanvas ? "Canvas detected; no 3D sample yet" : "No active WebGL sample"),
    resolution: sample?.viewport ?? "—", dpr: sample?.dpr ?? null,
    frameRate: sample?.fps ?? null,
    frameRateNote: "Observed frame updates (demand-rendered scenes are idle between updates; not a benchmark)",
    drawCalls: sample?.drawCalls ?? null,
    triangles: sample?.triangles ?? null,
    geometries: sample?.geometries ?? null,
    textures: sample?.textures ?? null,
    canvasCount: typeof document === "undefined" ? 0 : document.querySelectorAll("canvas").length,
    viewport: typeof window === "undefined" ? "—" : `${innerWidth}×${innerHeight}`,
    pixelRatio: typeof window === "undefined" ? null : window.devicePixelRatio,
    userAgent: typeof navigator === "undefined" ? "—" : navigator.userAgent,
  };
  return data;
}

export function GlobalRenderingDiagnostics({ screen }: { screen: string }) {
  const [open,setOpen] = useState(false);
  const [sample,setSample] = useState<RenderSample|null>(null);
  const [tick,setTick] = useState(0);
  const [copied,setCopied] = useState(false);
  useEffect(()=>{
    const listen=(e:Event)=>setSample((e as CustomEvent<RenderSample>).detail);
    window.addEventListener(RENDER_EVENT,listen);
    return()=>window.removeEventListener(RENDER_EVENT,listen);
  },[]);
  useEffect(()=>{
    if(!open)return;
    const id=window.setInterval(()=>setTick(t=>t+1),1000);
    return()=>window.clearInterval(id);
  },[open]);
  const age = sample ? performance.now()-sample.measuredAt : Infinity;
  const current = age < 3500 ? sample : null;
  const info=snapshot(screen,current);
  const rows: [string,string][]=[
    ["Active screen",info.screen],["Renderer",info.graphics],
    ["Renderer resolution",info.resolution],["Renderer DPR",String(info.dpr??"—")],
    ["Observed frame updates",current?.fps==null?"—":`${current.fps}/s`],
    ["Draw calls",String(info.drawCalls??"—")],["Triangles",String(info.triangles??"—")],
    ["Geometries",String(info.geometries??"—")],["Textures",String(info.textures??"—")],
    ["Canvas elements",String(info.canvasCount)],["Browser viewport",info.viewport],
    ["Device pixel ratio",String(info.pixelRatio??"—")],
  ];
  void tick;
  return <>
    <div className="pointer-events-auto absolute right-3 top-[5.6rem] z-[90]">
      <button type="button" aria-label="Show rendering diagnostics" aria-expanded={open}
        onClick={()=>{setOpen(x=>!x);setCopied(false);}}
        className="min-h-10 rounded-lg border-2 border-foreground bg-card/95 px-3 text-sm font-bold shadow-lg">
        {open?"Hide diagnostics":"Show rendering diagnostics"}
      </button>
    </div>
    {open&&<div role="dialog" aria-label="Rendering diagnostics"
      className="pointer-events-auto absolute inset-x-3 top-[9rem] z-[95] mx-auto max-h-[min(65dvh,520px)] max-w-md overflow-auto rounded-xl border-2 border-foreground bg-card p-3 text-foreground shadow-xl">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold">Rendering diagnostics</h2>
        <button className="min-h-10 min-w-10 rounded-md border border-foreground" type="button" onClick={()=>setOpen(false)} aria-label="Close rendering diagnostics">✕</button>
      </div>
      <p className="mb-2 text-xs text-muted-foreground">Live information for the whole game. Numbers show the active 3D canvas when it is rendering; 2D screens may not report WebGL metrics.</p>
      <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-sm">
        {rows.map(([name,value])=><div key={name} className="contents"><dt className="text-muted-foreground">{name}</dt><dd className="text-right font-semibold tabular-nums">{value}</dd></div>)}
      </dl>
      <p className="mt-2 text-xs text-muted-foreground">{info.frameRateNote}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" className="min-h-11 flex-1 rounded-md border-2 border-foreground bg-secondary px-3 font-bold"
          onClick={async()=>{try{await navigator.clipboard.writeText(JSON.stringify(info,null,2));setCopied(true);}catch{setCopied(false);}}}>
          {copied?"Copied":"Copy diagnostics"}
        </button>
        <button type="button" className="min-h-11 rounded-md border-2 border-foreground px-3 font-bold" onClick={()=>setOpen(false)}>Close</button>
      </div>
    </div>}
  </>;
}
