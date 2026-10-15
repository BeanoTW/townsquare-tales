import type { HomeZone } from "@/lib/home-zones";

/** Perspective interior scene. One room language per home tier and room purpose.
 * Fixed SVG camera and geometry keep existing furniture/hotspot coordinate systems intact.
 * This is 2.5D, not a WebGL simulation. */
const LOOKS = [
  {wall:"#85796c",side:"#564d44",floor:"#57493b",trim:"#c8b99e",metal:"#7b7368",light:"#e8d6b5",shade:"#2b2825"},
  {wall:"#dfd5bc",side:"#b8aa90",floor:"#9d7756",trim:"#f5eddb",metal:"#8f9693",light:"#fff0d0",shade:"#514536"},
  {wall:"#c9d5cc",side:"#8fada4",floor:"#a57e55",trim:"#eee5cb",metal:"#6f8b86",light:"#ffefc8",shade:"#344b47"},
  {wall:"#e6e6e0",side:"#abb9b2",floor:"#c8c3b5",trim:"#fbf9f0",metal:"#b8a06d",light:"#fff7de",shade:"#344743"},
] as const;
const ROOM_ACCENTS: Record<HomeZone,string>={shelter:"#806b59",living:"#417d74",bedroom:"#9b879f",kitchen:"#ac8c59",study:"#617e94",gym:"#627b70",entertainment:"#73528a"};
const ROOM_TITLES: Record<HomeZone,string>={shelter:"MAKE DO",living:"LIVING",bedroom:"SLEEP",kitchen:"KITCHEN",study:"STUDY",gym:"TRAIN",entertainment:"GAMES"};
function wallLamp(x:number,y:number,luxury:boolean){return <g key={x} stroke="#403f3a" strokeWidth="1.2"><path d={`M${x} ${y}v12`} fill="none"/><path d={`M${x-13} ${y+12}h26l-5 13h-16Z`} fill={luxury?"#ddc48c":"#a19a87"}/><ellipse cx={x} cy={y+25} rx="22" ry="8" fill="#ffe9a0" opacity=".24" stroke="none"/></g>}
export function HomePerspectiveScene({house,zone}: {house:number;zone:HomeZone}) {
 const tier=Math.max(0,Math.min(3,Math.trunc(house)));
 const t=LOOKS[tier]!;
 const premium=tier===3, accent=ROOM_ACCENTS[zone];
 const key=`home-3d-${tier}-${zone}`;
 return <g data-perspective-home={key} pointerEvents="none">
  <defs>
   <linearGradient id={key+"-back"} x1="0" y1="0" x2=".9" y2="1"><stop offset="0" stopColor={t.light}/><stop offset=".4" stopColor={t.wall}/><stop offset="1" stopColor={t.side}/></linearGradient>
   <linearGradient id={key+"-floor"} x1=".15" y1="0" x2=".8" y2="1"><stop offset="0" stopColor={t.floor}/><stop offset="1" stopColor={t.shade}/></linearGradient>
   <linearGradient id={key+"-left"}><stop stopColor={t.shade}/><stop offset="1" stopColor={t.side}/></linearGradient>
   <radialGradient id={key+"-light"} cx=".63" cy=".3" r=".8"><stop offset="0" stopColor={t.light} stopOpacity=".45"/><stop offset="1" stopColor={t.light} stopOpacity="0"/></radialGradient>
   <pattern id={key+"-grain"} width={tier===3?35:23} height="12" patternUnits="userSpaceOnUse"><path d="M0 10h33M10 0v10" stroke={t.trim} strokeWidth=".7" opacity=".21"/></pattern>
  </defs>
  <rect width="420" height="300" fill={t.shade}/>
  <path d="M0 0h420v164l-42 17H42L0 164Z" fill={`url(#${key}-back)`}/>
  <path d="M0 0L45 27V181L0 300Z" fill={`url(#${key}-left)`}/>
  <path d="M420 0L375 27V181L420 300Z" fill={t.side}/>
  <path d="M45 27H375V181H45Z" fill={`url(#${key}-back)`}/>
  <path d="M0 300L45 181H375L420 300Z" fill={`url(#${key}-floor)`}/>
  <path d="M0 300L45 181H375L420 300Z" fill={`url(#${key}-grain)`}/>
  <path d="M45 181H375M45 27V181M375 27V181" stroke={t.trim} strokeWidth={tier===3?5:3} fill="none"/>
  {[1,2,3,4].map(n=><path key={n} d={`M${45+n*66} 181L${n*84} 300`} fill="none" stroke={t.shade} strokeWidth="1.1" opacity=".27"/>)}
  {[213,248,282].map(y=><path key={y} d={`M${45-(y-181)*.38} ${y}H${375+(y-181)*.38}`} stroke={t.trim} strokeWidth="1" opacity=".22" key={y}/>)}
  <rect x="45" y="27" width="330" height="154" fill={`url(#${key}-light)`}/>
  {tier===0 ? <g>
    <path d="M46 55l328 -7M45 110l330 12M85 29l-4 150m75 -150l8 150m75 -150l-3 150m76 -150l-2 150" stroke="#403b37" strokeWidth="2" strokeDasharray="11 5" opacity=".55"/>
    <path d="M66 67l46 -10l7 35l-45 9Z" fill="#738489" stroke="#292a2a" strokeWidth="4"/><path d="M70 72l41 -12m-29 35l18 -27" stroke="#c2d3d2" strokeWidth="2" opacity=".6"/>
    <path d="M330 89l25 -13v27l-25 12Z" fill="#463c34" stroke="#332b26" strokeWidth="2"/>
    <path d="M22 245l58 -16l29 17l-60 19Z" fill="#8a7558" stroke="#43392d" strokeWidth="2"/>
  </g> : <>
    <path d="M45 35H375" stroke={t.trim} strokeWidth={tier===3?7:4}/>
    <g transform="translate(60 52)" stroke="#564d42" strokeWidth={tier===3?3:2}>
     <rect width={tier===3?100:79} height={tier===3?81:66} rx="2" fill={t.trim}/>
     <rect x="7" y="7" width={tier===3?86:65} height={tier===3?67:52} fill={tier===3?"#93b8be":"#88b3b7"}/>
     <path d={tier===3?"M50 7v67M7 40h86":"M39 7v52M7 31h65"} fill="none" stroke={t.trim} strokeWidth="4"/>
     <path d="M13 51l15 -23l13 18l17 -20l13 25" fill="none" stroke="#d5e8dd" strokeWidth="4" opacity=".35"/>
    </g>
    {wallLamp(312,55,premium)}
   </>}
  {zone==="living" && <g>
    <path d="M150 91h96l6 59h-108Z" fill={accent} stroke={t.shade} strokeWidth="3"/>
    <rect x="160" y="102" width="78" height="38" rx="3" fill="#172a2e"/><path d="M168 110h62v20h-62Z" fill="#3f6b6e"/><path d="M193 150v11" stroke={t.metal} strokeWidth="5"/>
    <path d="M300 158h35v15h-35Z" fill={t.trim} stroke={t.shade} strokeWidth="2"/>
  </g>}
  {zone==="bedroom" && <g stroke={t.shade} strokeWidth="2">
    <rect x="270" y="77" width="74" height="94" rx="3" fill={t.side}/><path d="M279 79v90m55 -90v90" stroke={t.trim} strokeWidth="4"/>
    <rect x="53" y="140" width="49" height="33" rx="3" fill={accent}/><path d="M55 151h45" stroke={t.trim} strokeWidth="2"/>
  </g>}
  {zone==="kitchen" && <g stroke={t.shade} strokeWidth="2">
    <rect x="235" y="74" width="121" height="87" rx="3" fill={t.trim}/>
    <path d="M235 102h121m-75 0v59m34-59v59" stroke={t.side} strokeWidth="3"/>
    <rect x="237" y="94" width="120" height="12" rx="2" fill={t.metal}/>
    <ellipse cx="269" cy="98" rx="12" ry="3" fill={t.shade}/><ellipse cx="310" cy="98" rx="12" ry="3" fill={t.shade}/>
    {tier>1 && <path d="M80 139h103l14 25H65Z" fill={t.metal} strokeWidth="3"/>}
  </g>}
  {zone==="study" && <g stroke={t.shade} strokeWidth="2">
    <rect x="245" y="61" width="101" height="104" fill={t.side}/>{[87,112,138].map(y=><path key={y} d={`M247 ${y}h97`} stroke={t.trim} strokeWidth="4"/>)}
    {Array.from({length:16},(_,i)=><rect key={i} x={249+(i%8)*11} y={66+Math.floor(i/8)*27} width="7" height="18" fill={i%3===0?accent:t.trim} stroke="none"/>)}
    <path d="M62 155h130l14 16H50Z" fill={t.metal}/>
  </g>}
  {zone==="gym" && <g stroke={t.shade} strokeWidth="3">
    <path d="M95 78v98m100-98v98M82 85h126" fill="none"/><rect x="104" y="135" width="81" height="14" rx="6" fill={accent}/>
    {[94,195].map(x=><g key={x}><rect x={x-8} y="77" width="16" height="22" rx="2" fill={t.metal}/><circle cx={x} cy="85" r="5" fill={t.trim}/></g>)}
    <path d="M239 155h93" stroke={t.metal} strokeWidth="7"/>
  </g>}
  {zone==="entertainment" && <g stroke={t.shade} strokeWidth="2.4">
     <path d="M67 125h116l18 36H49Z" fill="#205e4d"/><path d="M76 132h98l10 23H64Z" fill="#29775c" stroke="#e9d6af"/>
     <path d="M121 130v25m-44 -16h95" stroke="#e6d7ba" opacity=".85"/>
     <rect x="280" y="84" width="63" height="81" rx="7" fill={accent}/><rect x="289" y="94" width="46" height="29" rx="3" fill="#f1d7a0"/><text x="312" y="114" textAnchor="middle" fontSize="18" fill="#743a50" stroke="none">777</text>
     {[220,257].map((x,i)=><g key={x}><ellipse cx={x} cy="160" rx="14" ry="19" fill={i?"#526b77":"#946b53"}/><circle cx={x} cy="134" r="12" fill={i?"#ba8e71":"#8c6049"}/><path d={`M${x-10} 132q10 -7 20 0`} stroke="#382a29" fill="none"/></g>)}
  </g>}
  <path d="M0 300L45 181H375L420 300Z" fill={`url(#${key}-light)`} opacity=".27"/>
  {tier===3 && <g fill="none" stroke={t.metal} strokeWidth="2"><path d="M47 38H373M48 169H372"/><path d="M206 0v26m-17 0q17 11 34 0"/><path d="M193 31l13 13l13 -13" fill={t.light}/></g>}
  <rect width="420" height="300" fill="none" stroke={t.shade} strokeWidth="2"/>
  <text x="210" y="22" textAnchor="middle" fontSize="11" letterSpacing="2.4" fontWeight="bold" fill={tier===0?t.light:t.shade} stroke="none">{ROOM_TITLES[zone]} · {["SHELTER","STUDIO","HOUSE","MANSION"][tier]}</text>
 </g>;
}
