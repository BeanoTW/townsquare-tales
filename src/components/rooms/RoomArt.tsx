import type { ReactNode } from "react";
import type { GameState } from "@/lib/game-state";
import { ownsFurniture } from "@/lib/furniture";
import { HOUSES } from "@/lib/game-data";
import { VIEW, type Box, type Hotspot, type PlaceId, type Room } from "@/lib/rooms";
import "./room.css";

const INK = "#25242a";
const PAPER = "#fff4d6";

/** A rectangle that stands on its own coordinates. */
function R({
  x,
  y,
  w,
  h,
  fill,
  rx = 3,
  sw = 3,
  className,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill: string;
  rx?: number;
  sw?: number;
  className?: string | undefined;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={w}
      height={h}
      rx={rx}
      fill={fill}
      stroke={INK}
      strokeWidth={sw}
      className={className}
    />
  );
}
/** A rectangle that fills a hotspot box. */
function Fill({
  b,
  fill,
  rx = 3,
  sw = 3,
  className,
}: {
  b: Box;
  fill: string;
  rx?: number;
  sw?: number;
  className?: string;
}) {
  return <R x={b.x} y={b.y} w={b.w} h={b.h} fill={fill} rx={rx} sw={sw} className={className} />;
}
function Label({
  x,
  y,
  text,
  size = 13,
  fill = PAPER,
  anchor = "middle",
}: {
  x: number;
  y: number;
  text: string;
  size?: number;
  fill?: string;
  anchor?: "start" | "middle";
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={size} fontWeight="bold" fill={fill}>
      {text}
    </text>
  );
}
function Plant({ x, y }: { x: number; y: number }) {
  return (
    <g className="room-sway" style={{ transformOrigin: `${x}px ${y + 40}px` }}>
      <R x={x - 10} y={y + 26} w={20} h={18} fill="#b76f4d" rx={2} sw={2.5} />
      <ellipse cx={x} cy={y + 12} rx={16} ry={18} fill="#6fae73" stroke={INK} strokeWidth={2.5} />
      <path d={`M${x} ${y + 26}V${y - 2}`} stroke={INK} strokeWidth={2} />
    </g>
  );
}
function Figure({
  x,
  y,
  shirt,
  hood = false,
}: {
  x: number;
  y: number;
  shirt: string;
  hood?: boolean;
}) {
  return (
    <g
      transform={`translate(${x} ${y})`}
      stroke={INK}
      strokeWidth={3}
      strokeLinecap="round"
      fill="none"
    >
      <ellipse cy={5} rx={18} ry={5} fill={INK} opacity={0.13} stroke="none" />
      <circle cy={-64} r={11} fill={hood ? "#4b4650" : "#f1d6ae"} />
      <path d="M0 -52V-25M0 -46L-18 -30M0 -46L18 -30M0 -25L-13 0M0 -25L13 0" />
      <path d={"M-6 -51L6 -51L8 -33L-8 -33Z"} fill={shirt} />
    </g>
  );
}
function Monitor({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <R x={x} y={y} w={w} h={h} fill="#303b4a" rx={3} sw={2.5} />
      <R x={x + 5} y={y + 5} w={w - 10} h={h - 12} fill="#92c8c4" rx={1} sw={1.5} />
    </g>
  );
}
function Sofa({ b, fill = "#ba826a" }: { b: Box; fill?: string }) {
  return (
    <g>
      <Fill b={{ x: b.x, y: b.y + b.h * 0.45, w: b.w, h: b.h * 0.55 }} fill={fill} rx={8} />
      <Fill
        b={{ x: b.x + 8, y: b.y + b.h * 0.1, w: b.w - 16, h: b.h * 0.4 }}
        fill="#ebc79c"
        rx={8}
        sw={2.5}
      />
    </g>
  );
}
function Bed({ b }: { b: Box }) {
  return (
    <g>
      <Fill b={{ x: b.x, y: b.y + b.h * 0.25, w: b.w, h: b.h * 0.75 }} fill="#725a51" rx={6} />
      <R
        x={b.x + 8}
        y={b.y + b.h * 0.42}
        w={b.w - 16}
        h={b.h * 0.4}
        fill="#e5d8c3"
        rx={7}
        sw={2.5}
      />
      <R x={b.x + 10} y={b.y + b.h * 0.27} w={34} h={16} fill="#fff2d8" rx={5} sw={2} />
    </g>
  );
}
function Counter({ b, top, body }: { b: Box; top: string; body: string }) {
  return (
    <g>
      <R x={b.x} y={b.y + b.h * 0.42} w={b.w} h={b.h * 0.58} fill={body} rx={3} />
      <R x={b.x - 6} y={b.y + b.h * 0.3} w={b.w + 12} h={12} fill={top} rx={3} />
    </g>
  );
}
function Shelves({ b, body, colors }: { b: Box; body: string; colors: string[] }) {
  const rows = 3;
  return (
    <g>
      <Fill b={b} fill={body} rx={4} />
      {Array.from({ length: rows }, (_, r) => {
        const y = b.y + 14 + r * ((b.h - 18) / rows);
        return (
          <g key={r}>
            <path d={`M${b.x + 6} ${y + 2}H${b.x + b.w - 6}`} stroke="#e6c89d" strokeWidth={5} />
            {Array.from({ length: Math.max(2, Math.floor(b.w / 22)) }, (_, c) => {
              const bx = b.x + 10 + c * 20;
              return (
                <rect
                  key={c}
                  x={bx}
                  y={y - 16}
                  width={13}
                  height={14}
                  rx={2}
                  fill={colors[(r + c) % colors.length] ?? "#a9d1af"}
                  stroke={INK}
                  strokeWidth={1.8}
                />
              );
            })}
          </g>
        );
      })}
    </g>
  );
}
function Board({
  b,
  text,
  sub,
  fill = "#405c58",
}: {
  b: Box;
  text: string;
  sub?: string;
  fill?: string;
}) {
  return (
    <g>
      <Fill b={b} fill="#e1b978" rx={4} />
      <Fill b={{ x: b.x + 8, y: b.y + 8, w: b.w - 16, h: b.h - 16 }} fill={fill} rx={2} sw={2} />
      <Label
        x={b.x + b.w / 2}
        y={b.y + b.h / 2 - 2}
        text={text}
        size={Math.max(8, Math.min(13, (b.w - 16) / (text.length * 0.62)))}
      />
      {sub && <Label x={b.x + b.w / 2} y={b.y + b.h / 2 + 14} text={sub} size={9} fill="#edd6a4" />}
    </g>
  );
}
function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <path d={`M${x} ${y + 30}V${y + 88}`} stroke={INK} strokeWidth={4} />
      <path d={`M${x - 14} ${y + 88}H${x + 14}`} stroke={INK} strokeWidth={5} />
      <path
        d={`M${x - 16} ${y + 30}L${x - 8} ${y}H${x + 8}L${x + 16} ${y + 30}Z`}
        fill="#f3d284"
        stroke={INK}
        strokeWidth={3}
      />
    </g>
  );
}
function Neon({
  x,
  y,
  w,
  h,
  text,
  color,
  className = "room-flicker",
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  color: string;
  className?: string;
}) {
  return (
    <g className={className}>
      <R x={x} y={y} w={w} h={h} fill="#2b2238" rx={6} sw={2.5} />
      <Label
        x={x + w / 2}
        y={y + h / 2 + 6}
        text={text}
        size={Math.min(20, h * 0.5)}
        fill={color}
      />
    </g>
  );
}
function Floor({
  palette,
  pattern,
}: {
  palette: Room["palette"];
  pattern: "planks" | "tiles" | "carpet" | "concrete" | "grass" | "checker";
}) {
  const top = VIEW.floorY;
  const lines: ReactNode[] = [];
  if (pattern === "planks")
    for (let x = 0; x <= VIEW.w; x += 56)
      lines.push(
        <path
          key={`p${x}`}
          d={`M${x} ${top}L${x - 30} ${VIEW.h}`}
          stroke={INK}
          strokeOpacity={0.18}
          strokeWidth={2}
        />,
      );
  if (pattern === "tiles")
    for (let x = 0; x <= VIEW.w; x += 42)
      lines.push(
        <path
          key={`t${x}`}
          d={`M${x} ${top}V${VIEW.h}`}
          stroke={INK}
          strokeOpacity={0.2}
          strokeWidth={2}
        />,
      );
  if (pattern === "carpet")
    for (let x = 0; x <= VIEW.w; x += 30)
      lines.push(<circle key={`c${x}`} cx={x} cy={top + 22} r={2} fill={INK} opacity={0.12} />);
  if (pattern === "checker")
    for (let x = 0; x < VIEW.w; x += 28)
      for (let y = top; y < VIEW.h; y += 28)
        lines.push(
          <rect
            key={`k${x}-${y}`}
            x={x}
            y={y}
            width={28}
            height={28}
            fill={(x / 28 + (y - top) / 28) % 2 === 0 ? "#00000012" : "#ffffff10"}
          />,
        );
  return (
    <g>
      <rect x={0} y={top} width={VIEW.w} height={VIEW.h - top} fill={palette.floor} />
      {lines}
      <path d={`M0 ${top}H${VIEW.w}`} stroke={INK} strokeWidth={5} />
    </g>
  );
}

function Rug({ accent }: { accent: string }) {
  return (
    <g pointerEvents="none">
      <ellipse
        cx={VIEW.w / 2}
        cy={254}
        rx={172}
        ry={26}
        fill={accent}
        opacity={0.55}
        stroke={INK}
        strokeWidth={2.5}
      />
      <ellipse
        cx={VIEW.w / 2}
        cy={254}
        rx={132}
        ry={16}
        fill="none"
        stroke={INK}
        strokeOpacity={0.35}
        strokeWidth={2}
        strokeDasharray="6 6"
      />
    </g>
  );
}

/** Shared backdrop: wall, floor and rug. Decor sits on top; hotspots sit above that. */
function Backdrop({
  room,
  pattern,
}: {
  room: Room;
  pattern: Parameters<typeof Floor>[0]["pattern"];
}) {
  return (
    <g>
      <rect width={VIEW.w} height={VIEW.h} fill={room.palette.wall} />
      <Floor palette={room.palette} pattern={pattern} />
      <Rug accent={room.palette.accent} />
    </g>
  );
}


/** A square rear wall and vertical corners replace the old inward-collapsing trapezoid. */
function RoomShell({ back, side, dark, floor, trim }: { back: string; side: string; dark: string; floor: string; trim: string }) {
  return <g data-room-shell="square" pointerEvents="none">
    <rect width="420" height="300" fill={side}/>
    <rect x="34" y="0" width="352" height="170" fill={back} data-back-wall="upright"/>
    <path d="M0 0H34V170L0 220Z" fill={side}/>
    <path d="M386 0H420V220L386 170Z" fill={dark}/>
    <path d="M0 300L34 170H386L420 300Z" fill={floor}/>
    <path d="M34 0V170H386V0" stroke={trim} strokeOpacity=".5" strokeWidth="3" fill="none"/>
    <path d="M34 170H386" stroke={trim} strokeOpacity=".55" strokeWidth="5"/>
    <path d="M23 218H397M11 259H409" stroke={trim} strokeOpacity=".16" strokeWidth="2"/>
    <path d="M114 170L79 300M210 170V300M306 170L341 300" stroke={trim} strokeOpacity=".11" strokeWidth="2"/>
    <ellipse cx="210" cy="270" rx="170" ry="24" fill={dark} opacity=".13"/>
  </g>;
}

/** Background people and props are scenery only; the existing hotspots stay interactive. */
function PerspectiveRoom({ room, house }: { room: Room; house: number }) {
  if (room.id === "casino") return <g data-scene-depth="casino" pointerEvents="none">
    <RoomShell back="#5b4674" side="#493659" dark="#32253f" floor="#4a3659" trim="#cfac7d"/>
    <path d="M34 25H386" stroke="#edba65" strokeWidth="7" opacity=".75"/>
    {[71,347].map(x=><g key={x}>
      <path d={"M"+x+" 25V54"} stroke="#e0bb82" strokeWidth="5"/>
      <path d={"M"+(x-17)+" 67L"+(x-9)+" 51H"+(x+9)+"L"+(x+17)+" 67Z"} fill="#edc381" stroke="#493353" strokeWidth="3"/>
      <ellipse cx={x} cy="75" rx="37" ry="9" fill="#f3cf8a" opacity=".2"/>
    </g>)}
    <rect x="173" y="18" width="77" height="41" rx="7" fill="#32263f" stroke="#ffdd8b" strokeWidth="4"/>
    <text x="211" y="46" textAnchor="middle" fontWeight="bold" fontSize="24" fill="#f9d978">777</text>
    {/* A row of older machines makes the casino feel occupied, not like a two-object set. */}
    {[40,92,318,368].map((x,i)=><g key={x} opacity={i===1||i===2?.55:.78}>
      <rect x={x} y="93" width="35" height="67" rx="5" fill="#402941" stroke="#2c2138" strokeWidth="3"/>
      <rect x={x+5} y="102" width="25" height="29" rx="3" fill={i%2?"#a0caba":"#e9b4d4"} stroke="#d9a36c" strokeWidth="2"/>
      <text x={x+17} y="122" textAnchor="middle" fontSize="15" fontWeight="bold" fill="#a03e66">7</text>
      <circle cx={x+17} cy="146" r="4" fill="#ffdc85"/>
    </g>)}
    <g data-casino-regular transform="translate(330 125)">
      <ellipse cx="0" cy="40" rx="27" ry="7" fill="#201b2b" opacity=".3"/>
      <path d="M-24 12Q0 2 23 12L28 41H-30Z" fill="#28232d" stroke="#2a2333" strokeWidth="3"/>
      <circle cy="-3" r="15" fill="#b18a71" stroke="#29212b" strokeWidth="3"/>
      <path d="M-15 -5Q-18 -23 1 -22Q19 -21 16 -5L4 -13L-12 -6Z" fill="#302833"/>
      <path d="M-10 -5L-2 -2M4 -3L11 -6M-5 7H6" stroke="#382a33" strokeWidth="3"/>
    </g>
    <ellipse cx="195" cy="265" rx="135" ry="19" fill="#ffd586" opacity=".09"/>
  </g>;

  if (room.id === "gym") return <g data-scene-depth="gym" pointerEvents="none">
    <RoomShell back="#a4bcc0" side="#77929a" dark="#546e79" floor="#465763" trim="#a1b7bb"/>
    <rect x="42" y="29" width="102" height="84" fill="#a6c9d1" stroke="#3c5059" strokeWidth="6"/>
    <path d="M51 35L71 104M113 36L131 86" stroke="#e5f1f0" strokeOpacity=".5" strokeWidth="7"/>
    <path d="M148 10H266" stroke="#e9efec" strokeWidth="7" strokeLinecap="round"/>
    <rect x="158" y="21" width="103" height="42" rx="4" fill="#2b313a" stroke="#e2b857" strokeWidth="4"/>
    <text x="209" y="42" fontSize="14" fontWeight="bold" fill="#f8d87c" textAnchor="middle">IRON GYM</text>
    <text x="209" y="55" fontSize="9" fill="#eee5d8" textAnchor="middle">NO EXCUSES</text>
    <rect x="292" y="27" width="94" height="101" fill="#e3cfa5" stroke="#343e45" strokeWidth="4"/>
    <path d="M308 44L371 110M372 44L309 110" stroke="#b9564b" strokeWidth="7"/>
    <text x="340" y="82" fontWeight="bold" fontSize="14" textAnchor="middle" fill="#2b353c">PUSH</text>
    <text x="340" y="98" fontWeight="bold" fontSize="14" textAnchor="middle" fill="#2b353c">HARDER</text>
    <g data-gym-trainer transform="translate(204 123)">
      <ellipse cy="38" rx="28" ry="6" fill="#28333b" opacity=".3"/>
      <path d="M-20 10L-27 38H27L20 10Z" fill="#3d3d42" stroke="#293039" strokeWidth="4"/>
      <path d="M-20 16L-29 32M20 16L29 32" stroke="#b99076" strokeWidth="8" strokeLinecap="round"/>
      <circle cy="-6" r="16" fill="#bf8e73" stroke="#293039" strokeWidth="3"/>
      <path d="M-16 -7Q-15 -30 5 -24Q19 -21 16 -6L2 -17L-15 -9Z" fill="#252b30"/>
      <path d="M-11 -7L-3 -3M3 -3L11 -7M-6 5H6" stroke="#332d2f" strokeWidth="3"/>
    </g>
    <path d="M271 65V77" stroke="#31363b" strokeWidth="5"/>
    <rect x="258" y="77" width="26" height="59" rx="11" fill="#7e454b" stroke="#30343c" strokeWidth="4"/>
    <path d="M259 100H283M259 117H283" stroke="#ad7774" strokeWidth="3"/>
    <path d="M39 157H107" stroke="#303940" strokeWidth="6"/>
    {[51,66,81].map((x,i)=><circle key={x} cx={x} cy="154" r={11-i*2} fill="#2d353d" stroke="#aebbc0" strokeWidth="3"/>)}
  </g>;

  if (room.id !== "home") return null;
  const cardboard=house===0;
  const rich=house>=3;
  const wall=cardboard?"#ad8a68":house===1?"#d9c9b0":house===2?"#b7d3c0":"#eee1c9";
  return <g data-scene-depth={["home",house].join("-")} pointerEvents="none">
    <RoomShell back={wall} side={cardboard?"#876a51":"#b4a18e"} dark={cardboard?"#795b46":"#998673"}
      floor={cardboard?"#91836d":house===1?"#b28b6d":house===2?"#a58060":"#987356"} trim="#745d4c"/>
    {cardboard?<g>
      <rect x="39" y="22" width="97" height="140" fill="#b38e69" stroke="#725640" strokeWidth="4"/>
      <path d="M46 59H132M46 105H132M54 26V154M122 26V154" stroke="#765941" strokeWidth="2" strokeDasharray="4 5" opacity=".7"/>
      <rect x="296" y="20" width="86" height="140" fill="#b89472" stroke="#785941" strokeWidth="4"/>
      <path d="M339 23V157" stroke="#e1c99f" strokeWidth="8" opacity=".75"/>
      <rect x="162" y="24" width="105" height="82" fill="#7597a6" stroke="#74573f" strokeWidth="6"/>
      <rect x="170" y="33" width="89" height="64" fill="#a5c3ca" opacity=".7"/>
      <path d="M213 27V104" stroke="#ddc598" strokeWidth="6"/>
      <path d="M150 111L163 104L178 110M277 130L284 143L274 153" fill="none" stroke="#816650" strokeWidth="3"/>
      <path d="M181 166L192 140H232L245 166Z" fill="#71604e" stroke="#594638" strokeWidth="3"/>
      <rect x="195" y="138" width="31" height="17" rx="2" fill="#d2b88c" stroke="#705743" strokeWidth="2"/>
      <path d="M173 175L187 168M240 166L254 177" stroke="#705640" strokeWidth="3"/>
    </g>:<g>
      <rect x={rich?157:176} y={rich?18:35} width={rich?108:85} height={rich?112:79} fill="#c7e1e5" stroke="#79604d" strokeWidth="7"/>
      <path d={rich?"M211 18V130M157 74H265":"M218 35V114M176 74H261"} stroke="#79604d" strokeWidth="5"/>
      <rect x="49" y="30" width="81" height="48" fill="#dbc69f" stroke="#866e52" strokeWidth="4"/>
      <path d="M63 41L116 64M116 41L63 64" stroke="#a78a6d" strokeWidth="3"/>
      <rect x="299" y="72" width="75" height="84" fill="#a88a69" stroke="#69533e" strokeWidth="4"/>
      <path d="M306 105H365M306 130H365" stroke="#dac298" strokeWidth="4"/>
      {rich&&<g><path d="M210 0V31" stroke="#92754b" strokeWidth="4"/><path d="M175 34Q210 62 245 34Z" fill="#f0d18b" stroke="#876d4b" strokeWidth="4"/><circle cx="210" cy="48" r="7" fill="#fff4ba"/></g>}
    </g>}
  </g>;
}

/* ---------- Per-room decor. Every object is placed inside its hotspot box. ---------- */

function decorFor(id: PlaceId, state: GameState, B: (id: string) => Box, room: Room): ReactNode {
  switch (id) {
    case "home": {
      const bedOwned = ownsFurniture(state.furniture, "bed");
      return (
        <g>
          {bedOwned ? (
            <g>
              <path d="M13 142L130 142L145 171H20Z" fill="#64473b" stroke={INK} strokeWidth="4"/>
              <path d="M13 118H120L138 140H13Z" fill="#f0e6cd" stroke={INK} strokeWidth="4"/>
              <path d="M16 126H87L106 138H21Z" fill="#c6b5a1"/>
              <path d="M92 120H122L134 135H105Z" fill="#fff8e7" stroke={INK} strokeWidth="2"/>
              <path d="M22 157V180M128 159V184" stroke={INK} strokeWidth="7"/>
            </g>
          ) : state.house === 0 ? (
            <g data-makeshift-sleep>
              <ellipse cx="79" cy="188" rx="73" ry="13" fill="#514638" opacity=".24"/>
              <path d="M11 168L36 137H122L147 165L116 191H19Z" fill="#84694f" stroke={INK} strokeWidth="3"/>
              <path d="M15 162L39 141H118L139 160L113 181H22Z" fill="#ccb48a" stroke="#80624a" strokeWidth="3"/>
              <path d="M24 156L46 145H112L130 162L104 178H24Z" fill="#768b8d" stroke="#38434a" strokeWidth="2"/>
              <path d="M33 150L54 138H90L111 151L90 162H29Z" fill="#e9dec6" stroke={INK} strokeWidth="2"/>
              <path d="M33 152Q48 157 66 155" stroke="#cbb9a0" strokeWidth="2" fill="none"/>
              <path d="M22 173L17 184M119 181L130 188" stroke="#79614b" strokeWidth="3"/>
            </g>
          ) : (
            <g data-basic-mattress>
              <path d="M13 143L42 119H129L144 145L116 170H18Z" fill="#907b74" stroke={INK} strokeWidth="4"/>
              <path d="M14 135L40 117H122L138 137L111 153H19Z" fill="#e8d7bc" stroke={INK} strokeWidth="3"/>
              <path d="M29 130L51 121H92L109 133L89 142H30Z" fill="#b2c6bd"/>
            </g>
          )}
          {ownsFurniture(state.furniture, "weights") && (
            <Shelves b={B("weights")} body="#647d86" colors={["#505863"]} />
          )}
          {ownsFurniture(state.furniture, "desk") && (
            <g>
              <Monitor x={B("desk").x + 26} y={B("desk").y} w={44} h={34} />
              <Fill
                b={{ x: B("desk").x, y: B("desk").y + 40, w: B("desk").w, h: 12 }}
                fill="#7d5b43"
                rx={2}
                sw={2.5}
              />
            </g>
          )}
          {ownsFurniture(state.furniture, "sofa") && <Sofa b={B("sofa")} />}
          {ownsFurniture(state.furniture, "kitchen") && (
            <g>
              <Fill b={B("kitchen")} fill="#d9e5e5" rx={5} />
              <path
                d={`M${B("kitchen").x} ${B("kitchen").y + 60}H${B("kitchen").x + B("kitchen").w}`}
                stroke={INK}
                strokeWidth={3}
              />
            </g>
          )}
          {state.house < HOUSES.length - 1 && (
            <Board b={B("estate")} text="FOR SALE" sub="HOUSE" fill="#8a5d44" />
          )}
        </g>
      );
    }
    case "gym": {
      const rack = B("rack");
      const track = B("track");
      return <g data-gym-equipment>
        {/* Grounded plate-loaded squat rack with steel posts and depth. */}
        <path d={`M${rack.x+18} ${rack.y+14}L${rack.x+33} ${rack.y}H${rack.x+rack.w-5}L${rack.x+rack.w-19} ${rack.y+14}Z`}
          fill="#b0b8bd" stroke={INK} strokeWidth={4}/>
        <path d={`M${rack.x+18} ${rack.y+14}V${rack.y+rack.h-6}M${rack.x+rack.w-19} ${rack.y+14}V${rack.y+rack.h-6}`}
          stroke="#333c45" strokeWidth={9}/>
        <path d={`M${rack.x+24} ${rack.y+34}H${rack.x+rack.w-21}`} stroke="#ced5d7" strokeWidth={7}/>
        <path d={`M${rack.x+30} ${rack.y+42}H${rack.x+rack.w-32}`} stroke="#333c45" strokeWidth={4}/>
        {[0,1,2].map(n=><g key={n}>
          <ellipse cx={rack.x+38+n*38} cy={rack.y+64} rx={12+n%2*3} ry={20+n%2*4} fill={["#272d37","#bf9140","#465f6d"][n]} stroke={INK} strokeWidth={3}/>
          <circle cx={rack.x+38+n*38} cy={rack.y+64} r={3} fill="#e2ded0"/>
        </g>)}
        <path d={`M${rack.x+18} ${rack.y+rack.h-5}L${rack.x+31} ${rack.y+rack.h-17}H${rack.x+rack.w-8}`}
          fill="none" stroke="#aab3b7" strokeWidth={6}/>
        {/* 3D running machine, roller and handrail; belt narrows to the back. */}
        <path d={`M${track.x+19} ${track.y+track.h-5}L${track.x+48} ${track.y+66}H${track.x+track.w-25}L${track.x+track.w-4} ${track.y+track.h-5}Z`}
          fill="#252d37" stroke={INK} strokeWidth={4}/>
        <path d={`M${track.x+34} ${track.y+track.h-15}L${track.x+56} ${track.y+73}H${track.x+track.w-38}L${track.x+track.w-20} ${track.y+track.h-15}Z`}
          fill="#5a6670" stroke="#9ea7ae" strokeWidth={3}/>
        <path d={`M${track.x+32} ${track.y+60}V${track.y+17}H${track.x+track.w-35}V${track.y+60}`}
          fill="none" stroke="#343a43" strokeWidth={7}/>
        <path d={`M${track.x+26} ${track.y+54}H${track.x+track.w-28}`} stroke="#b1bcc1" strokeWidth={6}/>
        <rect x={track.x+track.w/2-24} y={track.y+8} width={48} height={28} rx={5} fill="#383e48" stroke={INK} strokeWidth={3}/>
        <rect x={track.x+track.w/2-17} y={track.y+13} width={34} height={16} rx={2} fill="#8dd1c6"/>
        <text x={track.x+track.w/2} y={track.y+25} textAnchor="middle" fontSize="10" fontWeight="bold" fill="#2e5052">RUN</text>
      </g>;
    }
    case "yard": {
      const site = B("site"),
        board = B("trades-board"),
        foreman = B("foreman");
      return (
        <g>
          <path
            d={`M${site.x + 10} ${site.y + site.h}V${site.y}M${site.x + 60} ${site.y + site.h}V${site.y}M${site.x + 110} ${site.y + site.h}V${site.y}`}
            stroke="#9b8061"
            strokeWidth={5}
          />
          {[0, 1, 2, 3].map((i) => (
            <path
              key={i}
              d={`M${site.x + 10} ${site.y + 16 + i * 32}H${site.x + 110}`}
              stroke="#b08b5e"
              strokeWidth={6}
            />
          ))}
          <path
            d={`M${site.x + 110} ${site.y}L${site.x + 150} ${site.y + 26}`}
            stroke="#e1a53a"
            strokeWidth={7}
          />
          <R x={site.x + 130} y={site.y + 26} w={18} h={14} fill="#e1a53a" sw={2} />
          <Board b={board} text="TRADES" sub="APPLY" fill="#4c6066" />
          <R
            x={foreman.x}
            y={foreman.y + 30}
            w={foreman.w}
            h={foreman.h - 30}
            fill="#d8bb8e"
            rx={3}
          />
          <R x={foreman.x + 14} y={foreman.y + 44} w={34} h={28} fill="#bfe1ec" rx={2} sw={2.5} />
          <Board
            b={{ x: foreman.x + 10, y: foreman.y + 4, w: foreman.w - 20, h: 22 }}
            text="SITE OFFICE"
            fill="#7a5e3f"
          />
          <R
            x={foreman.x + foreman.w - 36}
            y={foreman.y + 62}
            w={22}
            h={foreman.h - 62}
            fill="#7a5e3f"
            rx={2}
            sw={2.5}
          />
        </g>
      );
    }
    case "work": {
      const desk = B("workstation"),
        board = B("vacancies"),
        mgr = B("manager");
      return (
        <g>
          <Board b={{ x: 14, y: 40, w: 120, h: 40 }} text="MEGA" sub="CORP" fill="#47759b" />
          <Fill
            b={{ x: desk.x, y: desk.y + 56, w: desk.w, h: 12 }}
            fill="#7d8c9b"
            rx={2}
            sw={2.5}
          />
          <Monitor x={desk.x + 10} y={desk.y + 8} w={48} h={44} />
          <Monitor x={desk.x + 70} y={desk.y + 8} w={48} h={44} />
          <Board b={board} text="VACANCIES" sub="OFFICE" fill="#405c58" />
          <Fill b={mgr} fill="#53687b" rx={3} />
          <R x={mgr.x + 10} y={mgr.y + 12} w={mgr.w - 20} h={44} fill="#b4d3db" rx={2} sw={2.5} />
          <Label x={mgr.x + mgr.w / 2} y={mgr.y + 38} text="MANAGER" size={11} fill="#24313d" />
          <circle
            cx={mgr.x + mgr.w - 16}
            cy={mgr.y + 100}
            r={5}
            fill="#e3ae5c"
            stroke={INK}
            strokeWidth={2}
          />
        </g>
      );
    }
    case "school": {
      const lib = B("library"),
        board = B("classroom"),
        desk = B("admissions");
      return (
        <g>
          <Shelves b={lib} body="#765944" colors={["#bd7791", "#7aa2c4", "#e7ac55", "#a9d1af"]} />
          <Board b={board} text="LESSON" sub="ALGEBRA ~ x = 42" fill="#2f4a3e" />
          <path
            d={`M${board.x + 22} ${board.y + 56}q14 -12 28 0t28 0`}
            stroke={PAPER}
            strokeWidth={2}
            fill="none"
          />
          <Counter b={desk} top="#b68d62" body="#8d6b4c" />
          <Board
            b={{ x: desk.x + 6, y: desk.y - 36, w: desk.w - 12, h: 24 }}
            text="ADMISSIONS"
            fill="#547b62"
          />
          <Board
            b={{ x: 300, y: 20, w: 110, h: 50 }}
            text="STUDY HARD"
            sub="PAYS OFF"
            fill="#405c58"
          />
        </g>
      );
    }
    case "bar": {
      const counter = B("bar-counter"),
        floor = B("dance-floor");
      return (
        <g>
          <Shelves
            b={{ x: 24, y: 40, w: 200, h: 60 }}
            body="#674454"
            colors={["#75b5a2", "#d99a4d", "#aa79b1"]}
          />
          <Neon x={262} y={26} w={140} h={44} text="OPEN" color="#f477a9" />
          <Counter b={counter} top="#d9b688" body="#73444e" />
          {[60, 130, 200].map((x) => (
            <circle
              key={x}
              cx={x}
              cy={counter.y + counter.h + 16}
              r={10}
              fill="#8a5a6b"
              stroke={INK}
              strokeWidth={2.5}
            />
          ))}
          <Fill b={floor} fill="#2b2238" rx={2} sw={2} className="room-flicker" />
        </g>
      );
    }
    case "alley": {
      const crate = B("crate"),
        stranger = B("stranger"),
        dice = B("dice");
      return (
        <g>
          <Label x={320} y={62} text="NO SNITCHES" size={15} fill="#c4b65a" />
          <path d="M260 72L390 66" stroke="#c4b65a" strokeWidth={3} />
          <Fill
            b={{ x: crate.x, y: crate.y + 30, w: crate.w / 2 - 4, h: crate.h - 30 }}
            fill="#8a6446"
            rx={2}
          />
          <Fill
            b={{
              x: crate.x + crate.w / 2 + 4,
              y: crate.y + 30,
              w: crate.w / 2 - 4,
              h: crate.h - 30,
            }}
            fill="#8a6446"
            rx={2}
          />
          <Fill b={{ x: crate.x + 8, y: crate.y, w: crate.w - 16, h: 30 }} fill="#a37a55" rx={2} />
          <Figure x={stranger.x + stranger.w / 2} y={VIEW.floorY - 2} shirt="#5b564f" hood />
          <R x={stranger.x + 8} y={VIEW.floorY - 50} w={20} h={40} fill="#465356" rx={2} />
          <Fill b={dice} fill="#4d6e52" rx={4} />
          <R x={dice.x + 18} y={dice.y + 14} w={14} h={14} fill={PAPER} rx={2} sw={2} />
          <R x={dice.x + 46} y={dice.y + 26} w={14} h={14} fill={PAPER} rx={2} sw={2} />
        </g>
      );
    }
    case "bank": {
      const teller = B("teller"),
        atm = B("atm"),
        vault = B("vault");
      return (
        <g>
          <Counter b={teller} top="#8e6e4b" body="#b9c8b8" />
          <R
            x={teller.x + 20}
            y={teller.y + 14}
            w={teller.w - 40}
            h={36}
            fill="#cfe9f2"
            rx={3}
            sw={2.5}
          />
          <Label x={teller.x + teller.w / 2} y={teller.y + 38} text="TELLER" size={11} fill={INK} />
          <Fill b={atm} fill="#426c59" rx={4} />
          <R x={atm.x + 14} y={atm.y + 16} w={atm.w - 28} h={34} fill="#9cd8c0" rx={2} sw={2.5} />
          <R x={atm.x + 20} y={atm.y + 64} w={atm.w - 40} h={10} fill="#1f3a30" rx={2} sw={2} />
          <Fill b={vault} fill="#576c69" rx={4} />
          <circle
            cx={vault.x + vault.w / 2}
            cy={vault.y + 70}
            r={34}
            fill="#9baead"
            stroke={INK}
            strokeWidth={4}
          />
          <circle
            cx={vault.x + vault.w / 2}
            cy={vault.y + 70}
            r={10}
            fill="#d0d9d1"
            stroke={INK}
            strokeWidth={3}
          />
          <Label x={vault.x + vault.w / 2} y={vault.y + vault.h - 14} text="VAULT" size={12} />
        </g>
      );
    }
    case "shop": {
      const shelves = B("shelves"),
        back = B("back-office"),
        jobs = B("shop-board"),
        till = B("checkout");
      return (
        <g>
          <Shelves
            b={shelves}
            body="#765944"
            colors={["#a9d1af", "#e7ac55", "#bd7791", "#7aa2c4"]}
          />
          <R x={back.x} y={back.y} w={back.w} h={back.h} fill="#8c6d52" rx={3} />
          <R
            x={back.x + 10}
            y={back.y + 14}
            w={back.w - 20}
            h={back.h - 28}
            fill="#b38e64"
            rx={2}
            sw={2.5}
          />
          <Label x={back.x + back.w / 2} y={back.y + 8} text="STAFF" size={10} fill={PAPER} />
          <Board b={jobs} text="SHOP JOBS" sub="APPLY HERE" fill="#4a6e5b" />
          <Counter b={till} top="#c7a06b" body="#9b8061" />
          <R x={till.x + 16} y={till.y - 16} w={34} h={18} fill="#ffe3a8" rx={2} sw={2.5} />
        </g>
      );
    }
    case "diner": {
      const kitchen = B("kitchen"),
        hiring = B("hiring"),
        booth = B("booth"),
        counter = B("counter");
      return (
        <g>
          <Fill b={kitchen} fill="#d8d3c4" rx={4} />
          <Fill
            b={{ x: kitchen.x + 8, y: kitchen.y + 44, w: kitchen.w - 16, h: 18 }}
            fill="#7b7f88"
            rx={2}
            sw={2}
          />
          <circle
            cx={kitchen.x + 34}
            cy={kitchen.y + 36}
            r={12}
            fill="#6c737c"
            stroke={INK}
            strokeWidth={2.5}
          />
          <circle
            cx={kitchen.x + 90}
            cy={kitchen.y + 36}
            r={12}
            fill="#6c737c"
            stroke={INK}
            strokeWidth={2.5}
          />
          <Board b={hiring} text="WE'RE HIRING" sub="ASK INSIDE" fill="#ce4d43" />
          <R x={booth.x} y={booth.y} w={booth.w} h={booth.h} fill="#d64b3e" rx={6} />
          <R
            x={booth.x + 14}
            y={booth.y + 80}
            w={booth.w - 28}
            h={18}
            fill="#f4e1c8"
            rx={3}
            sw={2.5}
          />
          <Counter b={counter} top="#efe2c8" body="#b86a58" />
          {[0, 1, 2].map((i) => (
            <circle
              key={i}
              cx={counter.x + 22 + i * 40}
              cy={counter.y + counter.h + 14}
              r={8}
              fill="#ce4d43"
              stroke={INK}
              strokeWidth={2.5}
            />
          ))}
        </g>
      );
    }
    case "pawn": {
      const counter = B("pawn-counter"),
        shelf = B("curiosities");
      return (
        <g>
          <Counter b={counter} top="#d7c08c" body="#736d56" />
          <R
            x={counter.x + 20}
            y={counter.y - 4}
            w={counter.w - 40}
            h={14}
            fill="#cfe9f2"
            rx={2}
            sw={2}
          />
          <Shelves b={shelf} body="#765944" colors={["#e7ac55", "#aca78b", "#bd7791"]} />
          <circle
            cx={shelf.x + 30}
            cy={shelf.y + 50}
            r={12}
            fill="#f5f0db"
            stroke={INK}
            strokeWidth={3}
          />
          <path
            d={`M${shelf.x + 30} ${shelf.y + 44}V${shelf.y + 50}L${shelf.x + 36} ${shelf.y + 54}`}
            stroke={INK}
            strokeWidth={2}
            fill="none"
          />
        </g>
      );
    }
    case "furniture": {
      const sofa = B("sofa-display"),
        bed = B("bed-display"),
        cat = B("catalogue");
      return (
        <g>
          <Sofa b={sofa} fill="#ad735b" />
          <Bed b={bed} />
          <Fill b={cat} fill="#8d7360" rx={4} />
          <Fill
            b={{ x: cat.x + 10, y: cat.y + 14, w: cat.w - 20, h: 30 }}
            fill="#f4e1c8"
            rx={3}
            sw={2.5}
          />
          <Label x={cat.x + cat.w / 2} y={cat.y + 34} text="CATALOGUE" size={9} fill={INK} />
          <Fill
            b={{ x: cat.x + 10, y: cat.y + 56, w: cat.w - 20, h: 60 }}
            fill="#e6cfa8"
            rx={3}
            sw={2}
          />
        </g>
      );
    }
    case "casino": {
      const slots = B("slots"), table = B("high-dice");
      return <g>
        <g data-slot-machine>
          <path d={`M${slots.x+15} ${slots.y+18}L${slots.x+38} ${slots.y}H${slots.x+slots.w-4}L${slots.x+slots.w-16} ${slots.y+22}Z`} fill="#bd729c" stroke={INK} strokeWidth={4}/>
          <path d={`M${slots.x+slots.w-16} ${slots.y+22}L${slots.x+slots.w-4} ${slots.y}V${slots.y+slots.h-22}L${slots.x+slots.w-16} ${slots.y+slots.h}Z`} fill="#5d3156" stroke={INK} strokeWidth={4}/>
          <R x={slots.x+15} y={slots.y+22} w={slots.w-31} h={slots.h-22} rx={9} fill="#a3437c" sw={4}/>
          <R x={slots.x+27} y={slots.y+38} w={slots.w-56} h={57} fill="#ffe0a6" rx={6} sw={3}/>
          <Label x={slots.x+slots.w/2-3} y={slots.y+73} text="7  7  7" size={24} fill="#b53e56"/>
          <R x={slots.x+38} y={slots.y+107} w={slots.w-83} h={9} fill="#3a2a3b" rx={3} sw={2}/>
          <circle cx={slots.x+slots.w/2} cy={slots.y+128} r={8} fill="#f5c957" stroke={INK} strokeWidth={3}/>
          <path d={`M${slots.x+slots.w-5} ${slots.y+65}H${slots.x+slots.w+9}V${slots.y+40}`} stroke="#f2c45c" strokeWidth="5" fill="none"/>
          <circle cx={slots.x+slots.w+9} cy={slots.y+38} r={7} fill="#f2c45c" stroke={INK} strokeWidth={2}/>
        </g>
        <g data-dice-table>
          <path d={`M${table.x+27} ${table.y+25}V${table.y+99}M${table.x+table.w-27} ${table.y+25}V${table.y+99}`} stroke="#4d3430" strokeWidth={11}/>
          <ellipse cx={table.x+table.w/2} cy={table.y+45} rx={table.w/2-2} ry={32} fill="#492a35" stroke={INK} strokeWidth={5}/>
          <ellipse cx={table.x+table.w/2} cy={table.y+34} rx={table.w/2-8} ry={25} fill="#25805f" stroke="#b78b4c" strokeWidth={5}/>
          <path d={`M${table.x+24} ${table.y+34}Q${table.x+80} ${table.y-7} ${table.x+table.w-24} ${table.y+34}`} fill="none" stroke="#e5c979" strokeWidth={3} strokeDasharray="7 6"/>
          <R x={table.x+64} y={table.y+16} w={14} h={14} fill="#fff3c7" rx={2} sw={2}/>
          <R x={table.x+91} y={table.y+31} w={14} h={14} fill="#fff3c7" rx={2} sw={2}/>
          <circle cx={table.x+69} cy={table.y+22} r={2} fill="#42373d"/>
          <circle cx={table.x+96} cy={table.y+37} r={2} fill="#42373d"/>
        </g>
      </g>;
    }
    case "depot": {
      const board = B("departures"),
        hatch = B("ticket-hatch");
      return (
        <g>
          <Fill b={board} fill="#2f3c40" rx={4} />
          {[0, 1, 2].map((i) => (
            <g key={i}>
              <R
                x={board.x + 14}
                y={board.y + 18 + i * 24}
                w={board.w - 28}
                h={14}
                fill="#44565b"
                rx={2}
                sw={1.5}
              />
              <R
                x={board.x + board.w - 60}
                y={board.y + 20 + i * 24}
                w={34}
                h={10}
                fill="#f5b041"
                rx={1}
                sw={0}
              />
            </g>
          ))}
          <R x={hatch.x} y={hatch.y} w={hatch.w} h={hatch.h} fill="#a3bac1" rx={3} />
          <R
            x={hatch.x + 14}
            y={hatch.y + 12}
            w={hatch.w - 28}
            h={28}
            fill="#cfe9f2"
            rx={2}
            sw={2.5}
          />
          <Label
            x={hatch.x + hatch.w / 2}
            y={hatch.y + hatch.h - 10}
            text="TICKETS"
            size={11}
            fill={INK}
          />
        </g>
      );
    }
    case "police": {
      const desk = B("front-desk"),
        wanted = B("wanted");
      return (
        <g>
          <Counter b={desk} top="#6f8193" body="#355e88" />
          <R x={desk.x + 24} y={desk.y + 10} w={28} h={28} fill="#f1d6ae" rx={14} sw={2.5} />
          <Fill b={wanted} fill="#dfe3e8" rx={4} />
          {[0, 1, 2, 3].map((i) => (
            <R
              key={i}
              x={wanted.x + 12 + (i % 2) * 42}
              y={wanted.y + 14 + Math.floor(i / 2) * 42}
              w={34}
              h={34}
              fill="#fff8e6"
              rx={2}
              sw={2}
            />
          ))}
          <Label
            x={wanted.x + wanted.w / 2}
            y={wanted.y + wanted.h - 8}
            text="WANTED"
            size={11}
            fill={INK}
          />
        </g>
      );
    }
    case "clinic": {
      const bed = B("treatment-bed"),
        cab = B("cabinet");
      return (
        <g>
          <Bed b={bed} />
          <Fill b={cab} fill="#e8f5ed" rx={4} />
          <path
            d={`M${cab.x + cab.w / 2 - 6} ${cab.y + 26}h12v12h12v12h-12v12h-12v-12h-12v-12h12z`}
            fill="#d45b55"
          />
          <Label
            x={cab.x + cab.w / 2}
            y={cab.y + cab.h - 12}
            text="MEDICINE"
            size={11}
            fill={INK}
          />
        </g>
      );
    }
  }
}

function Hotspot({
  h,
  selected,
  onSelect,
}: {
  h: Hotspot;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const { x, y, w, h: hh } = h.box;
  const tagW = h.tag.length * 7.2 + 16;
  const cx = x + w / 2;
  const tagY = y + 4;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={`${h.label}. ${h.hint}`}
      aria-pressed={selected}
      data-hotspot={h.id}
      className={`room-hotspot${selected ? " is-selected" : ""}`}
      onClick={() => onSelect(h.id)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect(h.id);
        }
      }}
    >
      <rect x={x} y={y} width={w} height={hh} fill="transparent" />
      <rect className="room-outline" x={x + 2} y={y + 2} width={w - 4} height={hh - 4} rx={6} />
      <g transform={`translate(${cx - tagW / 2} ${tagY})`}>
        <g className="room-bob">
          <rect width={tagW} height={18} rx={9} fill={INK} />
          <text
            x={tagW / 2}
            y={13}
            textAnchor="middle"
            fontSize={11}
            fontWeight="bold"
            fill="#fff8e6"
          >
            {h.tag}
          </text>
        </g>
      </g>
    </g>
  );
}

export function RoomArt({
  room,
  state,
  visible,
  selectedId,
  onSelect,
}: {
  room: Room;
  state: GameState;
  visible: Hotspot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const B = (id: string): Box =>
    room.hotspots.find((h) => h.id === id)?.box ?? { x: 0, y: 0, w: 0, h: 0 };
  const pattern = PATTERNS[room.id];
  return (
    <svg
      viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
      className="room-art block h-full w-full"
      role="group"
      aria-label={`${room.title} interior`}
    >
      <Backdrop room={room} pattern={pattern} />
      <PerspectiveRoom room={room} house={state.house} />
      <g pointerEvents="none">{decorFor(room.id, state, B, room)}</g>
      {visible.map((h) => (
        <Hotspot key={h.id} h={h} selected={selectedId === h.id} onSelect={onSelect} />
      ))}
    </svg>
  );
}

const PATTERNS: Record<PlaceId, "planks" | "tiles" | "carpet" | "concrete" | "grass" | "checker"> =
  {
    home: "planks",
    gym: "concrete",
    yard: "concrete",
    school: "planks",
    work: "tiles",
    bar: "checker",
    alley: "concrete",
    bank: "tiles",
    shop: "tiles",
    diner: "checker",
    pawn: "planks",
    furniture: "carpet",
    casino: "carpet",
    depot: "tiles",
    police: "tiles",
    clinic: "tiles",
  };
