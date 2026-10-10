import { P } from "@/lib/town-projection";

export type BuildingLot = { facing: "north" | "south" | "east" | "west"; id: string; label: string; x: number; y: number; w: number; d: number; h: number; wall: string; side: string; roof: string; sign: string; win?: boolean };
const points = (a: (readonly [number, number])[]) => a.map(p => p.join(",")).join(" ");
const ink = "var(--town-ink)", paper = "var(--town-paper)", glass = "var(--town-glass)";

export function BuildingExterior({ b, night }: { b: BuildingLot; night: boolean }) {
  const { x, y, w, d, h, id } = b;
  const roofPoint = P(x + w / 2, y + d / 2, h);
  const horizontal = b.facing === "north" || b.facing === "south";
  const fy = b.facing === "north" ? y : y + d;
  const fx = b.facing === "west" ? x : x + w;
  // The frontage follows the actual doorway, including west-facing shops.
  const F = (u: number, z: number) => horizontal ? P(x + u * w, fy, z) : P(fx, y + u * d, z);
  const frontWidth = horizontal ? w * 48 : d * 36;
  const panel = (a: number, c: number, low: number, high: number, fill: string) => <polygon points={points([F(a, low), F(c, low), F(c, high), F(a, high)])} fill={fill} stroke={ink} strokeWidth="1.3" />;
  const peaked = ["home", "school", "furniture", "bank"].includes(id) && h > 20;
  const canopy = ["shop", "diner", "pawn", "bar", "furniture", "depot", "clinic"].includes(id);
  const [sx, sy] = F(.5, Math.min(h - 5, 42));
  const [px, py] = F(.83, 0);
  const signText = id === "home" ? b.label : b.label;
  const signWidth = Math.max(70, Math.min(frontWidth + 18, signText.length * 7 + 12));
  return <g data-building={id} strokeLinejoin="round">
    <polygon points={points([P(x+.15,y+.1),P(x+w+.38,y+.1),P(x+w+.38,y+d+.35),P(x+.15,y+d+.35)])} fill={ink} opacity=".15" />
    {[[P(x,y),P(x+w,y),P(x+w,y,h),P(x,y,h)], [P(x,y),P(x,y+d),P(x,y+d,h),P(x,y,h)], [P(x+w,y),P(x+w,y+d),P(x+w,y+d,h),P(x+w,y,h)], [P(x,y+d),P(x+w,y+d),P(x+w,y+d,h),P(x,y+d,h)]].map((face,i)=><polygon key={i} points={points(face)} fill={(i===0&&b.facing==="north")||(i===1&&b.facing==="west")||(i===2&&b.facing==="east")||(i===3&&b.facing==="south")?b.wall:b.side} stroke={ink} strokeWidth="1.8"/>)}
    {b.win && Array.from({length:Math.max(1,Math.floor((h-20)/30))},(_,r)=><g key={r}>{[.12,.29,.7,.87].map(u=><g key={u}>{panel(u-.055,u+.055,18+r*30,32+r*30,night?"var(--town-window-lit)":glass)}<path d={`M${F(u,18+r*30).join(" ")}L${F(u,32+r*30).join(" ")}`} stroke={paper} strokeWidth="1" opacity=".55"/></g>)}</g>)}
    {panel(.43,.57,0,25,night?"var(--town-window-lit)":glass)}
    {id==="gym" && panel(.08,.35,2,17,glass)}
    {id==="diner" && <g>{panel(.04,.37,2,23,glass)}{panel(.65,.96,2,23,glass)}{[.08,.2,.32,.68,.8,.92].map(u=><circle key={u} cx={F(u,4)[0]} cy={F(u,4)[1]} r="2" fill={b.sign}/>)}</g>}
    {id==="bank" && [.15,.3,.7,.85].map(u=><g key={u}><path d={`M${F(u,3).join(" ")}L${F(u,h-12).join(" ")}`} stroke={paper} strokeWidth="8"/><path d={`M${F(u-.035,3).join(" ")}L${F(u+.035,3).join(" ")}`} stroke={ink} strokeWidth="3"/></g>)}
    {id==="work" && [45,80,115,150].map(z=><path key={z} d={`M${F(0,z).join(" ")}L${F(1,z).join(" ")}`} stroke={paper} opacity=".65" strokeWidth="2"/>)}
    {id==="alley" && <g transform={`translate(${sx-24},${sy+9}) rotate(-9)`}><text fill="var(--town-graffiti)" fontSize="17" fontWeight="bold">NO COPS</text><path d="M0 5L68 2" stroke="var(--town-graffiti)" strokeWidth="3"/></g>}
    <polygon points={points([P(x,y,h),P(x+w,y,h),P(x+w,y+d,h),P(x,y+d,h)])} fill={b.roof} stroke={ink} strokeWidth="1.8"/>
    {peaked ? <g><polygon points={points([P(x-.1,y-.1,h),P(x+w/2,y-.1,h+30),P(x+w/2,y+d+.1,h+30),P(x-.1,y+d+.1,h)])} fill={b.roof} stroke={ink} strokeWidth="1.8"/><polygon points={points([P(x+w/2,y-.1,h+30),P(x+w+.1,y-.1,h),P(x+w+.1,y+d+.1,h),P(x+w/2,y+d+.1,h+30)])} fill={b.sign} stroke={ink} strokeWidth="1.8"/>{[.25,.5,.75].map(u=><path key={u} d={`M${P(x+w/2,y+d*u,h+30).join(" ")}L${P(x+w,y+d*u,h).join(" ")}`} stroke={ink} opacity=".3"/>)}</g>:<polygon points={points([P(x+.13,y+.13,h+5),P(x+w-.13,y+.13,h+5),P(x+w-.13,y+d-.13,h+5),P(x+.13,y+d-.13,h+5)])} fill="none" stroke={b.side} strokeWidth="5"/>}
    <g transform={`translate(${roofPoint[0]},${roofPoint[1]})`}>
      {id==="home" && (h<20?<g stroke={ink}><path d="M-45 -15L-9 12L18 -14M-9 12V39" fill="none" strokeWidth="2"/><rect x="15" y="-16" width="25" height="14" fill={paper}/><text x="27" y="-5" textAnchor="middle" fontSize="9">HOME</text></g>:<g><rect x="23" y="-34" width="13" height="29" fill={b.wall} stroke={ink}/><path d="M23 -34H36" stroke={ink} strokeWidth="4"/></g>)}
      {id==="school" && <g><rect x="-17" y="-40" width="34" height="32" fill={b.wall} stroke={ink}/><path d="M-22 -40L0 -59L22 -40Z" fill={b.roof} stroke={ink}/><circle cy="-25" r="11" fill={paper} stroke={ink}/><path d="M0 -33V-25L6 -22" stroke={ink} fill="none" strokeWidth="2"/><path d="M0 -59V-82L24 -77L0 -69" fill={b.sign} stroke={ink}/></g>}
      {id==="gym" && <g stroke={ink} strokeWidth="3"><path d="M-40 -16H40"/><rect x="-40" y="-27" width="12" height="23" rx="2" fill={b.sign}/><rect x="28" y="-27" width="12" height="23" rx="2" fill={b.sign}/><rect x="-27" y="-23" width="7" height="16" fill={b.sign}/><rect x="20" y="-23" width="7" height="16" fill={b.sign}/></g>}
      {id==="work" && <g><rect x="-26" y="-13" width="36" height="21" fill={b.side} stroke={ink}/><path d="M-20 -7H4M-20 -2H4M-20 3H4M27 3V-55M12 -34H42M18 -47H36" stroke={ink} strokeWidth="2"/><circle cx="27" cy="-57" r="3" fill={b.sign}/></g>}
      {id==="bank" && <g><circle cy="-25" r="14" fill={b.sign} stroke={ink}/><text y="-18" textAnchor="middle" fill={paper} fontSize="22">$</text></g>}
      {id==="casino" && <g><path d="M-48 -6L-40 -45H40L48 -6Z" fill={b.sign} stroke={ink} strokeWidth="2"/><text y="-17" fontSize="28" fill={b.roof} textAnchor="middle" fontWeight="bold">7 · 7 · 7</text>{[-36,-18,0,18,36].map(v=><circle key={v} cx={v} cy="-39" r="2.4" fill={paper}/>)}</g>}
      {id==="clinic" && <g fill={b.sign} stroke={paper} strokeWidth="2"><path d="M-8 -38H8V-25H21V-9H8V4H-8V-9H-21V-25H-8Z"/></g>}
      {id==="police" && <g><path d="M-20 -30L0 -37L20 -30V-14Q16 1 0 7Q-16 1 -20 -14Z" fill={b.sign} stroke={paper} strokeWidth="2"/><text y="-10" textAnchor="middle" fill={paper} fontSize="22">★</text><path d="M38 10V-35M30 -28L38 -38L46 -28" stroke={ink} strokeWidth="2" fill="none"/></g>}
      {id==="bar" && <g><rect x="-17" y="-29" width="27" height="24" rx="3" fill={b.sign} stroke={ink}/><path d="M10 -24Q28 -25 24 -12Q21 -7 10 -10" fill="none" stroke={b.sign} strokeWidth="6"/><path d="M-15 -28Q-9 -38 -3 -28Q4 -37 10 -28" stroke={paper} strokeWidth="5" fill="none"/></g>}
      {id==="diner" && <g><rect x="-42" y="-19" width="68" height="10" rx="4" fill={paper} stroke={ink}/><path d="M-32 -16H17" stroke={b.sign} strokeWidth="3"/><path d="M35 8V-32M29 -32V-20H41V-32" fill="none" stroke={ink} strokeWidth="3"/></g>}
      {id==="shop" && <g><rect x="15" y="-15" width="22" height="20" fill={b.side} stroke={ink}/><path d="M18 -10H34M18 -4H34M18 2H34" stroke={ink}/></g>}
      {id==="pawn" && <g><circle cx="-23" cy="-20" r="8" fill={b.sign} stroke={ink}/><circle cy="-13" r="8" fill={b.sign} stroke={ink}/><circle cx="23" cy="-20" r="8" fill={b.sign} stroke={ink}/><path d="M-23 -28V-42H23V-28M0 -42V-21" stroke={ink} fill="none" strokeWidth="2"/></g>}
      {id==="furniture" && <g><rect x="-29" y="-26" width="58" height="24" rx="5" fill={b.wall} stroke={ink}/><rect x="-35" y="-15" width="70" height="19" rx="4" fill={b.sign} stroke={ink}/><path d="M-25 4V11M25 4V11M0 -25V-4" stroke={ink} strokeWidth="2"/></g>}
      {id==="depot" && <g><circle cy="-15" r="17" fill={b.sign} stroke={ink}/><rect x="-10" y="-26" width="20" height="20" rx="3" fill={paper}/><rect x="-7" y="-23" width="14" height="8" fill={glass}/><circle cx="-6" cy="-9" r="2" fill={ink}/><circle cx="6" cy="-9" r="2" fill={ink}/></g>}
      {id==="alley" && <g><rect x="-30" y="-4" width="34" height="14" fill={b.side} stroke={ink}/><path d="M-27 0H0M-27 5H0M17 12V-16H33V12M21 -16V-27H29V-16" stroke={ink} fill="none" strokeWidth="2"/></g>}
    </g>
    {canopy && <g transform={`translate(${sx},${sy+12})`}><path d={`M${-frontWidth*.44} 0H${frontWidth*.44}L${frontWidth*.48} 14H${-frontWidth*.48}Z`} fill={paper} stroke={ink} strokeWidth="1.5"/>{Array.from({length:7},(_,i)=><path key={i} d={`M${-frontWidth*.44+i*frontWidth*.126} 1l2 12`} stroke={b.sign} strokeWidth={frontWidth*.058}/>)}<path d={`M${-frontWidth*.48} 14H${frontWidth*.48}`} stroke={ink}/></g>}
    {h>20 && <g transform={`translate(${sx},${sy-7})`}><rect x={-signWidth/2} y="-18" width={signWidth} height="23" rx="2" fill={b.sign} stroke={ink} strokeWidth="1.5"/><text textAnchor="middle" y="-2" fontSize={Math.min(14,(signWidth-10)/signText.length*1.85)} fill={paper} fontWeight="bold">{signText}</text></g>}
    <g transform={`translate(${px+13},${py+15})`}>
      {["shop","diner","bar","pawn","furniture"].includes(id) && <g transform="rotate(5)"><path d="M-12 3L-8 -26H12L16 3M-8 -26L-15 3" fill={b.sign} stroke={ink} strokeWidth="2"/><text x="2" y="-15" textAnchor="middle" fontSize="8" fill={paper}>{id==="diner"?"COFFEE":id==="pawn"?"WE BUY":id==="furniture"?"SALE":"OPEN"}</text><path d="M-4 -9H8M-4 -5H8" stroke={paper}/></g>}
      {id==="alley" && <g><rect x="-13" y="-24" width="32" height="21" fill="var(--town-bin)" stroke={ink}/><path d="M-17 -24H22M-7 -19H13" stroke={ink} strokeWidth="3"/><circle cx="-5" r="3" fill={ink}/><circle cx="13" r="3" fill={ink}/></g>}
      {["school","clinic","bank","police","home"].includes(id) && <g><path d="M-10 0H10L8 -15H-8Z" fill={b.sign} stroke={ink}/><circle cy="-20" r="11" fill="var(--town-leaf)" stroke={ink}/><circle cx="-4" cy="-24" r="5" fill="var(--town-leaf-light)"/></g>}
      {id==="gym" && <g stroke={ink} strokeWidth="3"><path d="M-18 -8H18"/><rect x="-20" y="-15" width="9" height="15" fill={b.side}/><rect x="11" y="-15" width="9" height="15" fill={b.side}/></g>}
      {id==="depot" && <g stroke={ink}><path d="M-25 -12H25M-25 -5H25M-19 -18V3M19 -18V3" strokeWidth="4"/><path d="M35 0V-45H59V-26H35" fill={b.sign}/><text x="47" y="-32" textAnchor="middle" fill={paper} fontSize="10">BUS</text></g>}
      {id==="casino" && <g><path d="M0 2V-20M28 2V-20M0 -16Q14 -25 28 -16" stroke={b.sign} strokeWidth="3" fill="none"/><circle cy="-22" r="4" fill={b.sign}/><circle cx="28" cy="-22" r="4" fill={b.sign}/></g>}
      {id==="work" && <g><rect x="-14" y="-20" width="28" height="20" fill={b.side} stroke={ink}/><text y="-7" textAnchor="middle" fill={paper} fontSize="8">MEGA</text></g>}
    </g>
  </g>;
}
