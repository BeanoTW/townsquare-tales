import type { GameState } from '@/lib/game-state';
import { ownsFurniture, type FurnitureId } from '@/lib/furniture';
import type { Box } from '@/lib/rooms';
import { furnitureZone, type HomeZone } from '@/lib/home-zones';

const C = (name: string) => `var(--home-${name})`;
const ink = C('ink');
const paper = C('paper');

function Window({ x, y, w, h, curtains = false }: { x: number; y: number; w: number; h: number; curtains?: boolean }) {
  return <g>
    <rect x={x} y={y} width={w} height={h} rx={2} fill={C('glass')} stroke={paper} strokeWidth={5}/>
    <path d={`M${x+3} ${y+h-8}l${w*.3} -22l${w*.2} 12l${w*.25} -31l${w*.2} 41`} fill={C('leaf')} opacity={.6}/>
    <path d={`M${x+w*.25} ${y+7}l-8 ${h*.55}m${w*.6} ${-h*.55}l-7 ${h*.4}`} stroke={paper} strokeWidth={5} opacity={.5}/>
    <path d={`M${x+w/2} ${y}v${h}M${x} ${y+h/2}h${w}`} stroke={paper} strokeWidth={3}/>
    <rect x={x-5} y={y+h} width={w+10} height={6} fill={C('wood-light')} stroke={ink} strokeWidth={1.5}/>
    {curtains && <g fill={C('teal')} stroke={ink} strokeWidth={1.5}>
      <path d={`M${x-9} ${y-6}h22q-1 ${h*.6} -17 ${h*.72}l10 ${h*.28}h-17Z`}/>
      <path d={`M${x+w+9} ${y-6}h-22q1 ${h*.6} 17 ${h*.72}l-10 ${h*.28}h17Z`}/>
    </g>}
  </g>;
}
function Pot({ x, y, luxury = false }: { x: number; y: number; luxury?: boolean }) {
  return <g stroke={ink} strokeWidth={1.5}>
    <path d={`M${x-8} ${y}h16l-3 16h-10Z`} fill={luxury?C('gold'):C('coral')}/>
    <path d={`M${x} ${y}v-24`} stroke={C('leaf')} strokeWidth={3}/>
    <ellipse cx={x-7} cy={y-16} rx={8} ry={4} transform={`rotate(35 ${x-7} ${y-16})`} fill={C('leaf')}/>
    <ellipse cx={x+7} cy={y-25} rx={9} ry={5} transform={`rotate(-35 ${x+7} ${y-25})`} fill={C('leaf')}/>
  </g>;
}

/** Four intentionally different shells; furniture targets retain their original coordinates. */
export function HomeShell({ house }: { house: number }) {
  const tier = Math.max(0, Math.min(3, house));
  const wall = C(['cardboard','studio-wall','suburban-wall','mansion-wall'][tier] ?? 'studio-wall');
  const side = C(['cardboard-dark','studio-side','suburban-side','mansion-side'][tier] ?? 'studio-side');
  const floor = C(['cardboard-dark','studio-floor','suburban-floor','marble'][tier] ?? 'studio-floor');
  return <g data-scene-depth={`home-${tier}`} pointerEvents="none" strokeLinejoin="round">
    <g data-room-shell="square">
      <rect width={420} height={300} fill={side}/>
      <rect data-back-wall="upright" x={34} y={0} width={352} height={170} fill={wall}/>
      <path d="M0 300L34 170H386L420 300Z" fill={floor}/>
      <path d="M34 0V170H386V0" fill="none" stroke={ink} strokeWidth={3}/>
    </g>
    {tier === 0 && <g>
      {[45,145,245,345].map(x=><g key={x}>
        <path d={`M${x} 4v158m-92 -109h88m-88 69h88`} stroke={C('cardboard-dark')} strokeWidth={2} strokeDasharray="5 4" fill="none"/>
        <path d={`M${x-40} 15v30`} stroke={paper} strokeWidth={8} opacity={.35}/>
      </g>)}
      <path d="M40 220l35 -18l14 12l-35 18Zm253 43l29 -16l31 11l-31 22Z" fill={C('cardboard')} stroke={ink} strokeWidth={1.5}/>
      <path d="M302 258l25 4m-18 1l16 3M46 218l23 -10" stroke={C('cardboard-dark')} strokeWidth={2}/>
      <path d="M178 78l15 -19l43 6l12 20l-31 17l-36 -8Z" fill={C('glass')} stroke={ink} strokeWidth={3}/>
      <path d="M181 79l21 2l10 19m-16 -38l8 13l30 3" fill="none" stroke={C('cardboard-dark')} strokeWidth={5}/>
      <path d="M43 286l19 -5l29 6l-3 9H40Z" fill={paper} stroke={ink} strokeWidth={1.5}/>
      <path d="M49 287h29m-25 5h22" stroke={ink} strokeWidth={1}/>
      <circle cx={372} cy={263} r={7} fill={C('metal')} stroke={ink} strokeWidth={2}/>
      <path d="M367 262h10" stroke={C('coral')} strokeWidth={3}/>
    </g>}
    {tier === 1 && <g>
      <path d="M34 163H386" stroke={paper} strokeWidth={7}/>
      {[190,212,239,270].map(y=><path key={y} d={`M0 ${y}H420`} stroke={C('wood')} strokeWidth={1} opacity={.3}/>)}
      <path d="M90 170l-25 130m130 -130l-4 130m111 -130l23 130" stroke={C('wood')} strokeWidth={1} opacity={.3}/>
      <Window x={42} y={15} w={59} h={35}/>
      <path d="M39 54h65" stroke={ink} strokeWidth={2}/>
      <path d="M35 14h16l-3 31l-12 7Z" fill={C('coral')} stroke={ink} strokeWidth={1.5}/>
      <path d="M39 73l10 -4l4 13l-8 7m249 61l8 -9l4 9" stroke={C('studio-side')} strokeWidth={2} fill="none"/>
      <path d="M172 218h101l11 57H157Z" fill={C('coral')} stroke={ink} strokeWidth={2}/>
      <path d="M176 228h92m-98 35h105" stroke={paper} strokeWidth={3} opacity={.55}/>
      <path d="M291 211v43m-13 0h26" stroke={ink} strokeWidth={3}/>
      <path d="M281 213l4 -17h12l5 17Z" fill={C('gold')} stroke={ink} strokeWidth={2}/>
      <Pot x={365} y={238}/>
      <rect x={41} y={240} width={36} height={28} fill={C('cardboard')} stroke={ink} strokeWidth={2}/>
      <path d="M59 240v28m-12 -16h7m9 0h9" stroke={C('cardboard-dark')} strokeWidth={3}/>
    </g>}
    {tier === 2 && <g>
      <rect x={34} y={122} width={352} height={46} fill={paper}/>
      {[42,83,124,165,206,247,288,329,370].map(x=><rect key={x} x={x} y={130} width={29} height={28} fill="none" stroke={C('suburban-side')} strokeWidth={1.5}/>)}
      <path d="M34 121H386M34 166H386" stroke={C('wood-light')} strokeWidth={4}/>
      {[187,212,241,274].map(y=><path key={y} d={`M0 ${y}H420`} stroke={C('wood')} strokeWidth={1.4} opacity={.3}/>)}
      <path d="M62 170L0 300m133 -130l-18 130m105 -130l8 130m62 -130l40 130" stroke={C('wood')} strokeWidth={1} opacity={.22}/>
      <Window x={43} y={13} w={61} h={39} curtains/>
      <Window x={301} y={12} w={67} h={46} curtains/>
      <path d="M134 210h166l18 75H113Z" fill={C('teal')} stroke={ink} strokeWidth={2}/>
      <path d="M143 220h146l12 53H128Z" fill="none" stroke={C('gold')} strokeWidth={3}/>
      <path d="M182 247l29 -15l28 15l-28 16Z" fill={C('teal-light')} stroke={paper} strokeWidth={1.5}/>
      <rect x={44} y={215} width={67} height={42} rx={2} fill={C('wood')} stroke={ink} strokeWidth={2}/>
      <rect x={41} y={211} width={73} height={8} fill={C('wood-light')} stroke={ink} strokeWidth={2}/>
      <path d="M48 258v16m59 -16v16m-59 -46h59" stroke={ink} strokeWidth={3}/>
      <Pot x={60} y={207}/>
      <g transform="translate(332 211)"><rect width={40} height={44} fill={paper} stroke={ink} strokeWidth={3}/><rect x={6} y={6} width={28} height={31} fill={C('coral')}/><path d="M9 30l10 -16l13 16Z" fill={C('teal')}/></g>
      <Pot x={384} y={245}/>
    </g>}
    {tier === 3 && <g>
      <path d="M0 190H420M0 223H420M0 263H420M78 170L42 300M164 170L150 300M254 170L268 300M340 170L384 300" fill="none" stroke={C('mansion-side')} strokeWidth={1.5}/>
      <path d="M37 232l30 -7l18 9l27 -5m188 48l-25 -8l9 -9l-14 -10m-66 -64l11 11l-5 16" stroke={C('mansion-side')} opacity={.65} strokeWidth={1.5} fill="none"/>
      <path d="M34 160H386M34 8H386" stroke={C('gold')} strokeWidth={4}/>
      <path d="M34 14H386M34 154H386" stroke={paper} strokeWidth={3}/>
      <Window x={298} y={14} w={76} h={46} curtains/>
      <Window x={43} y={12} w={60} h={38} curtains/>
      {[21,399].map(x=><g key={x}><rect x={x-8} y={10} width={16} height={163} fill={paper} stroke={C('mansion-side')} strokeWidth={2}/><path d={`M${x-5} 21v139m5 -139v139m5 -139v139`} stroke={C('mansion-side')} strokeWidth={1}/><path d={`M${x-13} 10h26m-26 159h26`} stroke={C('gold')} strokeWidth={5}/></g>)}
      <g stroke={C('gold')} strokeWidth={2} fill={paper}>
        <path d="M211 0v12m-24 0q24 16 48 0m-36 2v8m24 -8v8" fill="none"/>
        {[186,198,211,224,236].map((x,i)=><path key={x} d={`M${x} ${i%2?13:9}v10l-3 4l3 5l3 -5Z`}/>)}
      </g>
      <path d="M131 207h170l21 80H111Z" fill={C('teal')} stroke={C('gold')} strokeWidth={4}/>
      <path d="M142 219h148l15 56H126Z" fill="none" stroke={paper} strokeWidth={1.5}/>
      <path d="M171 247q42 -27 82 0q-42 28 -82 0Z" fill="none" stroke={C('gold')} strokeWidth={2}/>
      <g transform="translate(47 209)" stroke={ink} strokeWidth={2}>
        <rect width={61} height={55} fill={paper}/><path d="M-4 0h69m-63 7h55m-54 41h52" stroke={C('gold')} strokeWidth={3}/>
        <path d="M12 48V30q19 -29 38 0v18Z" fill={C('wood')}/>
        <path d="M19 45l7 -14l7 10l6 -17l7 21Z" fill={C('coral')} stroke={C('gold')}/>
        <rect x={14} y={-25} width={34} height={22} fill={C('glass')} stroke={C('gold')} strokeWidth={3}/>
      </g>
      <Pot x={357} y={240} luxury/>
      <path d="M338 267h38m-33 0v10m28 -10v10" stroke={C('gold')} strokeWidth={3}/>
      <ellipse cx={357} cy={261} rx={23} ry={8} fill={C('glass')} stroke={ink} strokeWidth={2}/>
    </g>}
  </g>;
}

/** Local 100×100 drawings scale into the existing interaction boxes. */
function FurnitureArt({ id, luxury }: { id: FurnitureId; luxury: boolean }) {
  const trim = luxury ? C('gold') : C('wood');
  const fabric = luxury ? C('teal') : C('coral');
  switch (id) {
    case 'bed': return <g>
      <rect x={5} y={7} width={90} height={80} rx={luxury?9:3} fill={luxury?C('teal'):C('wood')} strokeWidth={3}/>
      {luxury && <g stroke={C('gold')} strokeWidth={1.5}><path d="M10 13l80 0m-80 0l20 18l20 -18l20 18l20 -18" fill="none"/>{[25,50,75].map(x=><circle key={x} cx={x} cy={20} r={1.8} fill={C('gold')}/>)}</g>}
      <rect x={11} y={29} width={78} height={55} rx={4} fill={paper}/>
      <rect x={14} y={30} width={luxury?32:43} height={15} rx={5} fill={paper} strokeWidth={1.5}/>
      {luxury && <rect x={53} y={30} width={32} height={15} rx={5} fill={paper} strokeWidth={1.5}/>}
      <path d="M11 49h78v34H11Z" fill={fabric} strokeWidth={2}/>
      {luxury?<path d="M12 54h76m-76 12h76m-66 -17v34m20 -34v34m20 -34v34" stroke={C('teal-light')} strokeWidth={1.2}/>:<path d="M17 57q10 -6 21 1m30 7l10 4" stroke={paper} strokeWidth={2} fill="none"/>}
      <path d="M7 86h86m-81 0v9m76 -9v9" stroke={trim} strokeWidth={5}/>
      <path d="M18 76h64v7H18Z" fill={luxury?C('gold'):C('wood-light')} stroke="none"/>
    </g>;
    case 'sofa': return <g>
      <path d="M9 79v15m81 -15v15" stroke={trim} strokeWidth={5}/>
      <rect x={6} y={15} width={88} height={68} rx={luxury?12:5} fill={fabric} strokeWidth={3}/>
      <path d="M13 52h74m-37 -34v58" fill="none" stroke={luxury?C('teal-light'):C('wood')} strokeWidth={2}/>
      <rect x={1} y={37} width={13} height={42} rx={5} fill={fabric} strokeWidth={2}/><rect x={86} y={37} width={13} height={42} rx={5} fill={fabric} strokeWidth={2}/>
      <path d="M15 79h69" stroke={trim} strokeWidth={4}/>
      <rect x={20} y={26} width={18} height={24} rx={4} fill={luxury?C('gold'):paper} transform="rotate(-12 29 38)" strokeWidth={1.5}/>
      {luxury && <rect x={62} y={24} width={18} height={25} rx={4} fill={paper} transform="rotate(12 71 36)" strokeWidth={1.5}/>}
      {!luxury && <path d="M64 62l8 6m-8 0l8 -6" stroke={paper} strokeWidth={2}/>}
    </g>;
    case 'kitchen': return <g>
      <rect x={4} y={8} width={92} height={26} rx={2} fill={luxury?C('teal'):paper} strokeWidth={2}/>
      <path d="M35 9v24m31 -24v24m-46 -9h8m19 0h8m17 0h8" stroke={trim} strokeWidth={2}/>
      <rect x={3} y={46} width={94} height={49} fill={luxury?C('teal'):C('wood-light')} strokeWidth={2.5}/>
      <rect x={0} y={40} width={100} height={9} rx={2} fill={luxury?paper:C('metal')} strokeWidth={2}/>
      <rect x={10} y={52} width={37} height={34} rx={2} fill={C('metal')} strokeWidth={2}/>
      <rect x={15} y={61} width={27} height={19} fill={C('screen')} strokeWidth={1.5}/>
      {[17,28,39].map(x=><circle key={x} cx={x} cy={56} r={2} fill={ink}/>)}
      <ellipse cx={25} cy={41} rx={12} ry={4} fill={ink}/><ellipse cx={66} cy={42} rx={13} ry={4} fill={C('glass')} strokeWidth={1.5}/>
      <path d="M69 40V32q-9 -10 -9 1m-3 20h33v35H57m7 -28h12" fill="none" stroke={trim} strokeWidth={2.5}/>
      {luxury && <path d="M78 11v18m-6 -18v18m-4 -18v18M7 44l14 1m52 -3l16 2" stroke={C('gold')} strokeWidth={1}/>} 
    </g>;
    case 'weights': return <g>
      {luxury && <path d="M10 87V6h78v81M10 23h78" fill="none" stroke={C('metal')} strokeWidth={5}/>}
      <path d="M13 32h74m-74 35h74" stroke={C('metal')} strokeWidth={4}/>
      {[23,50,77].map((x,i)=><g key={x} fill={luxury?C('metal'):ink} strokeWidth={2}><rect x={x-11} y={24} width={5} height={16} rx={2}/><rect x={x+6} y={24} width={5} height={16} rx={2}/><path d={`M${x-6} 32h12`} stroke={luxury?C('gold'):C('metal')} strokeWidth={3}/><circle cx={x} cy={67} r={9+i} fill={ink}/><circle cx={x} cy={67} r={3} fill={C('metal')}/></g>)}
      {luxury && <g><path d="M24 93v-12h49v12" stroke={C('metal')} strokeWidth={4} fill="none"/><rect x={20} y={76} width={57} height={9} rx={3} fill={C('teal')} strokeWidth={2}/></g>}
    </g>;
    case 'desk': return <g>
      <path d="M12 63v31m76 -31v31" stroke={trim} strokeWidth={5}/>
      <rect x={6} y={56} width={88} height={10} rx={2} fill={luxury?C('wood'):C('wood-light')} strokeWidth={2.5}/>
      <rect x={68} y={66} width={22} height={24} fill={C('wood')} strokeWidth={2}/><path d="M69 77h20m-15 -6h10m-10 12h10" stroke={trim} strokeWidth={2}/>
      <rect x={25} y={13} width={luxury?45:36} height={33} rx={luxury?2:4} fill={C('metal')} strokeWidth={2}/><rect x={29} y={17} width={luxury?37:28} height={24} fill={C('glass')} strokeWidth={1}/>
      <path d="M33 26h18m-18 6h13" stroke={paper} strokeWidth={2}/>
      <path d={luxury?'M25 46h45l7 8H18Z':'M43 47v9m-12 0h24'} fill={C('metal')} strokeWidth={2}/>
      {luxury && <g stroke={C('gold')} strokeWidth={3}><path d="M83 56V25l-8 -10" fill="none"/><path d="M63 18l12 -9l9 8Z" fill={C('gold')}/></g>}
      <rect x={8} y={44} width={11} height={10} rx={2} fill={paper} strokeWidth={1.5}/>
    </g>;
    case 'tv': return <g>
      <rect x={luxury?1:8} y={luxury?4:12} width={luxury?98:84} height={luxury?73:65} rx={luxury?2:7} fill={ink} strokeWidth={2}/>
      <rect x={luxury?4:15} y={luxury?7:18} width={luxury?92:64} height={luxury?66:49} rx={2} fill={C('screen')} stroke={C('metal')} strokeWidth={1}/>
      <path d="M16 60l20 -33l21 30l16 -21l15 27Z" fill={C('teal-light')} stroke="none"/>
      <circle cx={72} cy={24} r={8} fill={C('gold')} stroke="none"/>
      <path d="M40 79v10h20V79" fill={C('metal')} strokeWidth={2}/>
      {luxury ? <g><rect x={17} y={88} width={66} height={7} rx={3} fill={ink}/><path d="M25 91h50" stroke={C('metal')} strokeWidth={1}/></g>:<circle cx={85} cy={70} r={2} fill={C('teal-light')}/>}
    </g>;
    case 'console': return <g>
      <rect x={luxury?16:9} y={luxury?6:18} width={luxury?32:64} height={luxury?74:31} rx={4} fill={luxury?paper:C('metal')} strokeWidth={2.5}/>
      <path d={luxury?'M27 12v59m5 -55v52':'M15 25h49m-31 10h24'} stroke={luxury?ink:C('screen')} strokeWidth={luxury?5:3}/>
      <path d={luxury?'M15 77h39':'M15 42h53'} stroke={C('teal-light')} strokeWidth={3}/>
      <path d="M51 55q9 -11 18 0q9 -4 16 1l6 18q-2 8 -10 1l-8 -4l-10 0l-8 5q-12 3 -10 -5Z" fill={luxury?paper:C('screen')} strokeWidth={2}/>
      <path d="M55 59v10m-5 -5h10" stroke={ink} strokeWidth={2}/><circle cx={79} cy={61} r={2} fill={C('coral')}/><circle cx={84} cy={66} r={2} fill={C('teal')}/>
      {luxury && <path d="M11 86h79" stroke={C('gold')} strokeWidth={4}/>}
    </g>;
    case 'bookshelf': return <g>
      <rect x={5} y={2} width={90} height={94} rx={2} fill={luxury?C('wood'):C('wood-light')} strokeWidth={3}/>
      {[0,1,2].map(row=><g key={row}>
        {[0,1,2,3,4].map((n)=><g key={n}><rect x={13+n*15} y={10+row*27} width={10} height={19+(n%2)*3} fill={luxury?C('teal'):C(['coral','teal','glass','gold','paper'][n] ?? 'paper')} strokeWidth={1}/>{luxury && <path d={`M${14+n*15} ${14+row*27}h8m-8 12h8`} stroke={C('gold')} strokeWidth={1.5}/>}</g>)}
        <path d={`M9 ${34+row*27}h82`} stroke={trim} strokeWidth={4}/>
      </g>)}
      {luxury && <g fill="none" stroke={C('gold')} strokeWidth={2}><rect x={9} y={6} width={82} height={86}/><path d="M50 6v86m-6 -36v10m12 -10v10"/><path d="M14 9l-2 25m73 28l-3 22" stroke={paper} opacity={.4}/></g>}
    </g>;
  }
}

export function HomeFurnishings({ state, box, zone }: { state: GameState; box: (id: string) => Box; zone?: HomeZone }) {
  const ids: FurnitureId[] = ['bed','weights','desk','sofa','tv','bookshelf','console','kitchen'];
  return <g pointerEvents="none" stroke={ink} strokeLinejoin="round" strokeLinecap="round">
    {ids.map(id=>{
      if (!ownsFurniture(state.furniture,id)) return null;
      if (zone && furnitureZone(id, state.house) !== zone) return null;
      if (state.house < 1 && ['tv','bookshelf','console'].includes(id)) return null;
      const b = box(id==='tv'?'television':id);
      const luxury = ownsFurniture(state.luxuryFurniture ?? 0,id);
      return <g key={id} data-home-furniture={id} data-furniture-quality={luxury?'luxury':'standard'} transform={`translate(${b.x} ${b.y}) scale(${b.w/100} ${b.h/100})`}>
        <ellipse cx={50} cy={93} rx={46} ry={5} fill={ink} opacity={.16} stroke="none"/>
        <FurnitureArt id={id} luxury={luxury}/>
      </g>;
    })}
    {(!zone || furnitureZone('bed', state.house) === zone) && !ownsFurniture(state.furniture,'bed') && <g data-makeshift-sleep={state.house===0?true:undefined} data-basic-mattress={state.house>0?true:undefined}>
      <path d="M14 158l25 -26h85l18 26l-23 27H16Z" fill={state.house===0?C('cardboard'):C('metal')} strokeWidth={2.5}/>
      <path d="M18 152l22 -23h79l17 23l-21 20H21Z" fill={state.house===0?C('cardboard'):paper} strokeWidth={2.5}/>
      <path d="M29 151l23 -19h48l17 20l-20 16H28Z" fill={C('teal-light')} strokeWidth={1.5}/>
      <path d="M38 140l14 -11h32l15 12l-19 10H38Z" fill={paper} strokeWidth={1.5}/>
      {state.house===0 && <path d="M25 173l19 5m53 -3l16 -6M28 178l18 5" stroke={C('cardboard-dark')} strokeWidth={2}/>}
    </g>}
    {state.house < 3 && (!zone || furnitureZone("estate", state.house) === zone) && <g transform="translate(330 18)">
      <rect x={0} y={0} width={76} height={44} rx={2} fill={C('coral')} strokeWidth={2.5}/>
      <rect x={4} y={4} width={68} height={36} fill="none" stroke={paper} strokeWidth={1}/>
      <text x={38} y={18} textAnchor="middle" fontSize={10} fill={paper} stroke="none" fontWeight="bold">FOR SALE</text>
      <path d="M29 33v-9l9 -6l9 6v9Zm6 0v-6h6v6" fill="none" stroke={paper} strokeWidth={1.5}/>
    </g>}
  </g>;
}
