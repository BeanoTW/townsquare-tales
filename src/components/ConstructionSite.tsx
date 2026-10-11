import "./construction-site.css";
import { P } from "@/lib/town-projection";

const polygon = (corners: [number,number][]) => corners.map(([x,y]) => P(x,y).join(",")).join(" ");

/** Large decorative redevelopment plot. Interactions remain with the actual yard office/foreman. */
export function ConstructionSite({ onForeman }: { onForeman: () => void }) {
  const x=16.1, y=15.3, w=6.0, d=9.2;
  const [fx,fy]=P(18.2,24.1);
  const [cx,cy]=P(18.9,16.9);
  return <g data-construction-site>
    <polygon points={polygon([[x,y],[x+w,y],[x+w,y+d],[x,y+d]])} fill="#968b76" stroke="#4a4842" strokeWidth="3"/>
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
    {/* Second structure at foundations stage. */}
    <polygon points={polygon([[19.9,19.2],[21.6,19.2],[21.6,21.4],[19.9,21.4]])} fill="#b0a89b" stroke="#5b5f60" strokeWidth="5"/>
    {([[20.1,19.4],[21.4,19.4],[20.1,21.2],[21.4,21.2]] as [number,number][]).map(([px,py],i)=><circle key={i} cx={P(px,py)[0]} cy={P(px,py)[1]} r="6" fill="#767d7c" stroke="#454a48" strokeWidth="2"/>)}
    {/* Animated crane, isolated behind the fence. */}
    <g transform={`translate(${cx} ${cy})`} data-construction-crane>
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
      <circle cx="-17" cy="17" r="6" fill="#2a3032"/><circle cx="15" cy="17" r="6" fill="#2a3032"/>
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
    {/* Foreman is the walk-up gateway to the existing Workers Yard employment. */}
    <g role="button" tabIndex={0} aria-label="Talk to the construction foreman" data-construction-foreman
      className="cursor-pointer" onClick={e=>{e.stopPropagation();onForeman();}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onForeman();}}}>
      <g transform={`translate(${fx} ${fy})`}>
        <ellipse cy="3" rx="13" ry="5" fill="#383c34" opacity=".2"/>
        <path d="M0 -15v-23m0 9l-11 8m11-8l11 6M0 -15l-9 17m9-17l9 17" stroke="#303137" strokeWidth="4" strokeLinecap="round"/>
        <path d="M-8 -36h16v17h-16z" fill="#e88b2e" stroke="#303137" strokeWidth="2"/>
        <circle cy="-47" r="10" fill="#e1ae83" stroke="#303137" strokeWidth="2"/>
        <path d="M-11 -51q11-14 22 0v4h-22Z" fill="#f2c846" stroke="#303137" strokeWidth="2"/>
        <rect x="13" y="-27" width="10" height="14" rx="1" fill="#d3c8aa" stroke="#343a3d" strokeWidth="2"/>
        <rect x="-24" y="-91" width="49" height="104" fill="transparent"/>
      </g>
    </g>
  </g>;
}
