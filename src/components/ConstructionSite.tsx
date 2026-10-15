import { OverheadPerson } from "@/components/OverheadPerson";
import "./construction-site.css";
import { P } from "@/lib/town-projection";

const polygon = (corners: [number,number][]) => corners.map(([x,y]) => P(x,y).join(",")).join(" ");

/** Large decorative redevelopment plot. Interactions remain with the actual yard office/foreman. */
export function ConstructionSite({ onForeman, active = true, ghost = false }: { onForeman: () => void; active?: boolean; ghost?: boolean }) {
  const x=16.1, y=15.3, w=6.0, d=9.2;
  const [fx,fy]=P(18.2,24.1);
  const [cx,cy]=P(18.9,16.9);
  // In the 3D town the site is modelled there; only the foreman's tap target remains.
  if (ghost) return <g data-construction-site data-active={active}>
    <g role="button" tabIndex={0} aria-label="Talk to the construction foreman" data-construction-foreman
      className="cursor-pointer" onClick={e=>{e.stopPropagation();onForeman();}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onForeman();}}}>
      <rect x={fx-22} y={fy-38} width="44" height="55" fill="transparent"/>
    </g>
  </g>;
  return <g data-construction-site data-active={active}>
    <polygon points={polygon([[x,y],[x+w,y],[x+w,y+d],[x,y+d]])} fill="#968b76" stroke="#4a4842" strokeWidth="3"/>
    {/* Layered compacted earth, concrete pads and vehicle ruts. Keep the gate walkable. */}
    <g data-site-ground-detail pointerEvents="none">
      <polygon points={polygon([[16.3,15.6],[19.7,15.6],[19.7,20.8],[16.3,20.8]])} fill="#8a8170" opacity=".6"/>
      <polygon points={polygon([[19.8,16.1],[21.8,16.1],[21.8,18.9],[19.8,18.9]])} fill="#aaa08d" opacity=".7"/>
      <polygon points={polygon([[16.6,21.5],[19,21.5],[19,24.1],[16.6,24.1]])} fill="#a99b80" opacity=".65"/>
      {([16.1,16.5,16.9,17.3] as const).map((y,i)=><path key={i}
        d={`M${P(19.45,y)[0]} ${P(19.45,y)[1]} Q${P(20.5,y+.4)[0]} ${P(20.5,y+.4)[1]} ${P(21.45,y+.9)[0]} ${P(21.45,y+.9)[1]}`}
        stroke={i%2?"#746d5d":"#b8ae99"} strokeWidth="3" strokeDasharray="13 7" fill="none" opacity=".6"/>)}
      {[[16.6,16.6],[21.2,18.8],[18.9,22.2],[16.7,23.5]].map(([px,py],i)=>{
        const [sx,sy]=P(px!,py!);return <g key={i} transform={`translate(${sx} ${sy})`}>
          <ellipse rx={18+i%2*7} ry={7} fill={i%2?"#6b6c62":"#b7a486"} opacity=".75"/>
          <path d="M-10 0l7-6 9 6 7-3" stroke="#5d5b53" strokeWidth="2" fill="none" opacity=".5"/>
        </g>;
      })}
    </g>
    {/* Site perimeter, with a clear southern pedestrian gate. */}
    {([[x,y,x+w,y],[x,y,x,y+d],[x+w,y,x+w,y+d],[x,y+d,17.6,y+d],[18.8,y+d,x+w,y+d]] as [number,number,number,number][]).map(([ax,ay,bx,by],i)=>{
      const a=P(ax!,ay!),b=P(bx!,by!);
      return <g key={i}><path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke="#e1ac49" strokeWidth="7" strokeDasharray="20 9"/><path d={`M${a[0]} ${a[1]}L${b[0]} ${b[1]}`} stroke="#4c4b4a" strokeWidth="2"/></g>;
    })}
    {/* Excavated foundations and a partly erected steel-frame building. */}
    <polygon points={polygon([[16.5,17.5],[19.3,17.5],[19.3,20.2],[16.5,20.2]])} fill="#676a66" stroke="#30383b" strokeWidth="4"/>
    <polygon points={polygon([[16.8,17.8],[19.0,17.8],[19.0,19.9],[16.8,19.9]])} fill="#4d5454" stroke="#c7bca8" strokeWidth="4"/>
    {([[16.8,17.8],[19,17.8],[16.8,19.9],[19,19.9]] as [number,number][]).map(([px,py],i)=><g key={i}>
      <path d={`M${P(px,py)[0]} ${P(px,py)[1]}v-75`} stroke="#333a3c" strokeWidth="9"/>
      <path d={`M${P(px,py)[0]} ${P(px,py)[1]}v-75`} stroke="#b7bec0" strokeWidth="5"/>
    </g>)}
    <path d={`M${P(16.8,17.8).join(" ")}L${P(19,17.8).join(" ")}M${P(16.8,19.9).join(" ")}L${P(19,19.9).join(" ")}`} stroke="#adb9bb" strokeWidth="4"/>
    {/* Scaffold cross bracing, raised walk deck and open masonry bays. */}
    <g data-site-scaffolding pointerEvents="none">
      {[[16.5,17.5],[19.3,17.5],[16.5,20.2],[19.3,20.2]].map(([px,py],i)=>{
        const [sx,sy]=P(px!,py!);return <path key={i} d={`M${sx-8} ${sy-83}v-22m16 0v102`} stroke="#d4c0a0" strokeWidth="3" fill="none"/>;
      })}
      <path d={`M${P(16.5,20.2)[0]} ${P(16.5,20.2)[1]-55}L${P(19.3,20.2)[0]} ${P(19.3,20.2)[1]-55}`}
        stroke="#cba66c" strokeWidth="9"/>
      <path d={`M${P(16.5,20.2)[0]} ${P(16.5,20.2)[1]-77}L${P(19.3,20.2)[0]} ${P(19.3,20.2)[1]-15}M${P(16.5,20.2)[0]} ${P(16.5,20.2)[1]-15}L${P(19.3,20.2)[0]} ${P(19.3,20.2)[1]-77}`}
        stroke="#a8b1b0" strokeWidth="3"/>
    </g>
    {/* Second structure at foundations stage. */}
    <polygon points={polygon([[19.9,19.2],[21.6,19.2],[21.6,21.4],[19.9,21.4]])} fill="#b0a89b" stroke="#5b5f60" strokeWidth="5"/>
    {([[20.1,19.4],[21.4,19.4],[20.1,21.2],[21.4,21.2]] as [number,number][]).map(([px,py],i)=><circle key={i} cx={P(px,py)[0]} cy={P(px,py)[1]} r="6" fill="#767d7c" stroke="#454a48" strokeWidth="2"/>)}
    {/* Animated crane, isolated behind the fence. */}
    <g transform={`translate(${cx} ${cy})`} data-construction-crane>
      <ellipse cy="6" rx="19" ry="9" fill="#534d40" opacity=".35"/>
      <rect x="-21" y="-10" width="42" height="14" fill="#7c7765" stroke="#394045" strokeWidth="3"/>
      <path d="M0 0V-172" stroke="#a97720" strokeWidth="12"/>
      <path d="M0 0V-172" stroke="#f2bf46" strokeWidth="8"/>
      {[-28,-55,-82,-109,-136].map(v=><path key={v} d={`M-5 ${v}L5 ${v-19}M5 ${v}L-5 ${v-19}`} stroke="#855b25" strokeWidth="2"/>)}
      <g className="construction-crane-jib">
        <path d="M-54 -173H125L-8 -195Z" fill="#e8b642" stroke="#6c5b30" strokeWidth="3"/>
        <path d="M93 -178V-112" stroke="#4c5357" strokeWidth="2" strokeDasharray="4 3"/>
        <path d="M86 -111h14l-7 12Z" fill="#b9bfc0" stroke="#3a4244" strokeWidth="2"/>
      </g>
    </g>
    {/* Dumper truck and excavator arm move gently rather than roaming through walls. */}
    <g transform={`translate(${P(20.4,17.1).join(" ")})`} data-construction-dumper>
      <rect x="-28" y="-15" width="53" height="30" rx="5" fill="#d2a033" stroke="#313636" strokeWidth="3"/>
      <rect x="-27" y="-11" width="27" height="22" rx="2" fill="#80694c" stroke="#363535" strokeWidth="2"/>
      <rect x="5" y="-11" width="15" height="17" fill="#b5cfce" stroke="#414848" strokeWidth="2"/>
      <circle cx="-17" cy="17" r="7" fill="#2a3032" stroke="#7a7c72" strokeWidth="2"/><circle cx="15" cy="17" r="7" fill="#2a3032" stroke="#7a7c72" strokeWidth="2"/>
      <path d="M-27 -10h25l-5 10h-17Z" fill="#90714c" stroke="#33383b" strokeWidth="2"/>
      <circle cx="22" cy="-11" r="3" fill="#efa848" className="construction-beacon"/>
    </g>
    <g transform={`translate(${P(20.1,22.0).join(" ")})`} data-construction-digger>
      <rect x="-22" y="-10" width="44" height="23" rx="6" fill="#e0a72f" stroke="#353b3c" strokeWidth="3"/>
      <path d="M-21 15h42" stroke="#343b3d" strokeWidth="9" strokeLinecap="round"/>
      <g className="construction-digger-arm"><path d="M9 -7L36 -25L48 -9" stroke="#e5af43" strokeWidth="9" fill="none" strokeLinecap="round"/><path d="M42 -12L56 -3L43 5Z" fill="#656a69" stroke="#323738" strokeWidth="2"/></g>
    </g>
    {/* Pallets, pipes and warning barriers. */}
    {[0,1,2].map(i=><rect key={i} x={P(16.7+i*.34,21.5)[0]} y={P(16.7+i*.34,21.5)[1]-8} width="12" height="17" fill="#b88b62" stroke="#5c4637" strokeWidth="2"/>)}
    <g transform={`translate(${P(17.2,23.2).join(" ")})`}>
      <path d="M-28 0h56" stroke="#eab74c" strokeWidth="8"/><path d="M-26 -3l10 6m8-6l10 6m8-6l10 6" stroke="#393c3c" strokeWidth="4"/>
    </g>
    {/* Construction supplies, site safety and clearer pedestrian gate. */}
    <g data-site-materials pointerEvents="none">
      {[[17.1,22.1],[17.4,22.1],[17.7,22.1]].map(([px,py],i)=>{const [sx,sy]=P(px!,py!);return <g key={i} transform={`translate(${sx} ${sy})`}>
        <ellipse rx="14" ry="6" cy="5" fill="#433d37" opacity=".3"/>
        <rect x="-12" y="-9" width="24" height="13" fill="#b59367" stroke="#644c33" strokeWidth="2"/>
        <path d="M-9 -6h18m-18 5h18" stroke="#7a5b3c" strokeWidth="2"/>
      </g>;})}
      {[[19.6,23.8],[21.4,22.3]].map(([px,py],i)=>{const [sx,sy]=P(px!,py!);return <g key={i} transform={`translate(${sx} ${sy})`}>
        <ellipse rx="17" ry="6" cy="4" fill="#564e43" opacity=".25"/>
        {[0,1,2].map(n=><ellipse key={n} cx={n*9-9} cy={-4} rx="6" ry="5" fill="#8e9b9b" stroke="#4e595a" strokeWidth="2"/>)}
      </g>;})}
      {[[17.7,24.3],[18.8,24.3],[21.7,23.3]].map(([px,py],i)=>{const [sx,sy]=P(px!,py!);return <g key={i} transform={`translate(${sx} ${sy})`}>
        <ellipse cy="1" rx="10" ry="3" fill="#45413c" opacity=".25"/>
        <path d="M0 -18L-8 0H8Z" fill="#e78336" stroke="#524b42" strokeWidth="2"/>
        <path d="M-5 -7h10" stroke="#f2e9d3" strokeWidth="3"/>
      </g>;})}
      <g transform={`translate(${P(18.1,24.4).join(" ")})`}>
        <rect x="-44" y="-65" width="88" height="24" rx="3" fill="#f1d9a5" stroke="#414548" strokeWidth="3"/>
        <text x="0" y="-49" textAnchor="middle" fontSize="11" fontWeight="bold" fill="#34363c">SITE ACCESS</text>
        <path d="M-42 -40v32M42 -40v32" stroke="#535751" strokeWidth="4"/>
      </g>
    </g>
    {/* Same stature and overhead silhouette as the player, with subtle helmet markings. */}
    {[[17.3,20.8,"#d7ab38"],[20.8,18.7,"#eac763"]].map(([wx,wy,hat],i)=>{
      const [px,py]=P(Number(wx),Number(wy));
      return <g key={i} data-construction-worker visibility={active ? "visible" : "hidden"} transform={`translate(${px} ${py})`}>
        <g className={i===0?"construction-worker-carry":"construction-worker-hammer"}>
          <OverheadPerson head="#dbb089" outline="#394043" hat={String(hat)} moving phase={i*2}/>
        </g>
      </g>;
    })}
    {/* Foreman is the walk-up gateway to the existing Workers Yard employment. */}
    <g role="button" tabIndex={0} aria-label="Talk to the construction foreman" data-construction-foreman
      className="cursor-pointer" onClick={e=>{e.stopPropagation();onForeman();}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onForeman();}}}>
      <g transform={`translate(${fx} ${fy})`}>
        <OverheadPerson head="#e1ae83" outline="#303137" hat="#f2c846"/>
        <rect x="10" y="-15" width="8" height="11" rx="1" fill="#d3c8aa" stroke="#343a3d" strokeWidth="1.5"/>
        <rect x="-22" y="-38" width="44" height="55" fill="transparent"/>
      </g>
    </g>
  </g>;
}
