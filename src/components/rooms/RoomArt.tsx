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
function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <R x={x} y={y} w={w} h={h} fill="#cfe9f2" rx={2} />
      <path
        d={`M${x + w / 2} ${y}V${y + h}M${x} ${y + h / 2}H${x + w}`}
        stroke={INK}
        strokeWidth={3}
      />
    </g>
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

function PerspectiveRoom({ room, house }: { room: Room; house: number }) {
  if (room.id === "casino") {
    return (
      <g data-scene-depth="casino">
        <rect width="420" height="300" fill="#392b55"/>
        <path d="M0 0H420L365 168H55Z" fill="#654c82"/>
        <path d="M0 0L55 168V230L0 300Z" fill="#302744"/>
        <path d="M420 0L365 168V230L420 300Z" fill="#37274d"/>
        <path d="M0 300L55 168H365L420 300Z" fill="#4d365f" stroke="#20182e" strokeWidth="5"/>
        {[178,203,238,278].map((y)=><path key={y} d={`M${55-(y-168)*.417} ${y}H${365+(y-168)*.417}`} stroke="#bb8f62" strokeOpacity=".42" strokeWidth="3"/>)}
        {[0,105,210,315,420].map((x)=><path key={x} d={`M210 168L${x} 300`} stroke="#bb8f62" strokeOpacity=".36" strokeWidth="2"/>)}
        <path d="M10 20H410" stroke="#f5bd55" strokeWidth="8" strokeOpacity=".7"/>
        {[55,355].map((x)=><g key={x}><path d={`M${x} 14V55`} stroke="#e0b77f" strokeWidth="5"/><path d={`M${x-20} 65L${x-10} 48H${x+10}L${x+20} 65Z`} fill="#f9d087" stroke="#4b3150" strokeWidth="3"/><ellipse cx={x} cy={69} rx="18" ry="5" fill="#f4b965" opacity=".35"/></g>)}
        <rect x="175" y="16" width="83" height="37" rx="7" fill="#312340" stroke="#ffe28e" strokeWidth="4"/>
        <text x="216" y="42" textAnchor="middle" fontWeight="bold" fontSize="21" fill="#ffdc75">777</text>
        <ellipse cx="220" cy="270" rx="160" ry="27" fill="#d0a350" opacity=".16"/>
      </g>
    );
  }
  if (room.id !== "home") return null;
  const cardboard = house === 0;
  const rich = house >= 3;
  const wall = cardboard ? "#9c7957" : house === 1 ? "#d7c8b1" : house === 2 ? "#b8d7c3" : "#eee3cb";
  const floor = cardboard ? "#897b65" : house === 1 ? "#b28b6d" : house === 2 ? "#a68061" : "#947152";
  return (
    <g data-scene-depth={`home-${house}`}>
      <rect width="420" height="300" fill={wall}/>
      <path d="M0 0L64 166H356L420 0Z" fill={wall}/>
      <path d="M0 0L64 166L0 300Z" fill={cardboard?"#796047":"#a38c76"}/>
      <path d="M420 0L356 166L420 300Z" fill={cardboard?"#86694e":"#b4a58f"}/>
      <path d="M0 300L64 166H356L420 300Z" fill={floor} stroke="#49392f" strokeWidth="4"/>
      {[178,215,267].map((y)=><path key={y} d={`M${64-(y-166)*.48} ${y}H${356+(y-166)*.48}`} stroke="#47362c" strokeOpacity=".23" strokeWidth="3"/>)}
      {[0,140,280,420].map((x)=><path key={x} d={`M210 166L${x} 300`} stroke="#49392f" strokeOpacity=".17" strokeWidth="2"/>)}
      {cardboard ? (
        <g>
          <path d="M9 22L96 33L105 144L20 151Z" fill="#ae8660" stroke="#684d39" strokeWidth="4"/>
          <path d="M22 52H94M24 82H100M27 109H100" stroke="#785d45" strokeWidth="2" strokeDasharray="3 6"/>
          <path d="M295 20L398 34L391 145L295 139Z" fill="#b09068" stroke="#6b513c" strokeWidth="4"/>
          <path d="M330 24L324 139" stroke="#e6c99e" strokeWidth="9" opacity=".8"/>
          <path d="M144 27L275 23L252 90L163 91Z" fill="#7792a1" stroke="#71573f" strokeWidth="5"/>
          <path d="M159 37L247 41L233 71H169Z" fill="#a8bfc0" opacity=".6"/>
          <path d="M196 28V89" stroke="#d4bc8e" strokeWidth="6"/>
          <text x="210" y="125" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#6d4b38">MAKESHIFT SHELTER</text>
        </g>
      ) : (
        <g>
          <rect x={rich?157:179} y={rich?18:34} width={rich?109:80} height={rich?112:72} rx="3" fill="#cae4ed" stroke="#705b4b" strokeWidth="7"/>
          <path d={rich?"M212 18V130M157 74H266":"M219 34V106M179 70H259"} stroke="#705b4b" strokeWidth="5"/>
          <path d="M24 16H109V63H24Z" fill={rich?"#dbbc78":"#d7ba86"} stroke="#75604b" strokeWidth="5"/>
          <path d="M35 27L93 52M94 27L36 52" stroke="#967b64" strokeWidth="3"/>
          {rich && <g><path d="M210 0V34" stroke="#987344" strokeWidth="5"/><path d="M175 36Q210 65 245 36Z" fill="#f3d899" stroke="#876c4c" strokeWidth="4"/><circle cx="210" cy="50" r="8" fill="#fff0b9"/></g>}
        </g>
      )}
    </g>
  );
}

/* ---------- Per-room decor. Every object is placed inside its hotspot box. ---------- */

function decorFor(id: PlaceId, state: GameState, B: (id: string) => Box, room: Room): ReactNode {
  switch (id) {
    case "home": {
      const bedOwned = ownsFurniture(state.furniture, "bed");
      return (
        <g>
          {state.house > 0 && <Window x={196} y={44} w={84} h={62} />}
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
              <path d="M11 165L37 134H126L146 165L113 191H19Z" fill="#a8815a" stroke={INK} strokeWidth="3"/>
              <path d="M15 161L39 143H117L136 160L111 176H23Z" fill="#d7bd91" stroke="#785a45" strokeWidth="3"/>
              <path d="M29 152L57 140H98L121 160L96 173H27Z" fill="#7b8d8c" stroke={INK} strokeWidth="3"/>
              <path d="M39 150L64 141H95L105 150L85 156H36Z" fill="#e7d7b4" stroke={INK} strokeWidth="2"/>
              <path d="M11 165L36 175L28 191" stroke="#74573c" strokeWidth="3" fill="none"/>
              <path d="M117 160L135 153L145 166" stroke="#71533b" strokeWidth="3" fill="none"/>
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
    case "gym":
      return (
        <g>
          <R x={200} y={18} w={206} h={44} fill="#cde6ea" rx={4} />
          <Lamp x={390} y={70} />
          <Shelves
            b={{ x: 24, y: 96, w: 160, h: 94 }}
            body="#505863"
            colors={["#505863", "#e1a53a"]}
          />
          <R x={226} y={170} w={160} h={20} fill="#3b4348" rx={3} />
          <Fill
            b={{ x: B("track").x, y: B("track").y, w: B("track").w, h: 36 }}
            fill="#505863"
            rx={4}
          />
          <R
            x={B("track").x + 14}
            y={B("track").y + 36}
            w={B("track").w - 28}
            h={18}
            fill="#25242a"
            rx={3}
            sw={2}
          />
        </g>
      );
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
