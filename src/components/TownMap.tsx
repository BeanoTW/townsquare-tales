import { beginStreetGrind, advanceStreetGrind, grindPosition, type StreetGrind } from "@/lib/street-grind";
import { nearbyRail } from "@/lib/town-rails";
import { TOWN_RAILS } from "@/lib/town-rails";
import { elevation, deckRotation, stepJump, type SkateJump } from "@/lib/skate-tricks";
import { OverheadPerson } from "@/components/OverheadPerson";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StreetLife, type ResidentPositions } from "@/components/StreetLife";
import { townAtmosphere, STREET_OBJECTS, type StreetObjectId } from "@/lib/street-life";
import { START } from "@/lib/game-data";
import type { ResidentId } from "@/lib/living-town";
import type { GameState } from "@/lib/game-state";
import { BuildingExterior, type BuildingLot } from "@/components/BuildingExterior";
import { Button } from "@/components/ui/button";
import { P } from "@/lib/town-projection";
import { ConstructionSite } from "@/components/ConstructionSite";
export { P } from "@/lib/town-projection";
import { findRoute, nearestWalkable, isWalkable, type Point } from "@/lib/pathfinding";
import type { EncounterSpot } from "@/lib/world-encounters";
import { GANG_SPOT } from "@/lib/street-gang";

import { PARK_KID_SPOT } from "@/lib/park-kid";

// Upright oblique projection: ground plan matches the minimap; height offsets
// the roof up and slightly right to reveal front and side walls.
const TW = 48, TH = 36, N = 30;
const Exterior = memo(BuildingExterior);
const Site = memo(ConstructionSite);

/** Shift the paper-coloured head continuously toward red or blue with karma. */
export function karmaHeadColor(karma: number): string {
  const intensity = Math.min(1, Math.abs(karma) / 30);
  const base = [255, 244, 214];
  const target = karma < 0 ? [216, 59, 76] : [73, 161, 255];
  const mix = base.map((c, i) => Math.round(c + ((target[i] ?? c) - c) * intensity));
  return `rgb(${mix.join(", ")})`;
}

const pts = (a: (readonly [number, number])[]) => a.map((p) => p.join(",")).join(" ");

// Streets have deliberate ends and T-junctions rather than an endless grid.
export const ROADS = [
  { x: 8.6, y: 0, w: 2.8, d: 30 },       // north-south Main Street, only T-junctions
  { x: 0, y: 7.1, w: 9.1, d: 2.8 },    // upper west street, joins Main Street
  { x: 11.1, y: 11.9, w: 12.2, d: 2.8 }, // east market street, offset 4.8 tiles
  { x: 0, y: 18.5, w: 9.1, d: 2.8 },     // lower west street, staggered again
  { x: 11.1, y: 25.5, w: 12.2, d: 2.8 },  // lower east street, offset 7 tiles
  { x: 22.6, y: 11.9, w: 2.8, d: 17.7 }, // east side street with T-junctions
] as const;

type B = BuildingLot;

const HOUSE_LOOK = [
  { h: 18, wall: "var(--town-box-wall)", side: "var(--town-box-side)", roof: "var(--town-box-roof)", label: "Box" },
  { h: 70, wall: "var(--town-flat-wall)", side: "var(--town-flat-side)", roof: "var(--town-flat-roof)", label: "Flat" },
  { h: 60, wall: "var(--town-house-wall)", side: "var(--town-house-side)", roof: "var(--town-house-roof)", label: "House" },
  { h: 95, wall: "var(--town-mansion-wall)", side: "var(--town-mansion-side)", roof: "var(--town-mansion-roof)", label: "Mansion" },
];

export const buildings = (house: number): B[] => {
  const hl = HOUSE_LOOK[house] ?? HOUSE_LOOK[0] ?? { h: 18, wall: "var(--town-cardboard)", side: "var(--town-cardboard-side)", roof: "var(--town-cardboard-roof)", label: "Box" };
  return [
    { facing: "south", id: "home", label: `Home · ${hl.label}`, x: 1.1, y: 2, w: 3, d: 4, h: hl.h, wall: hl.wall, side: hl.side, roof: hl.roof, sign: "var(--town-home-sign)", win: house > 0 },
    { facing: "north", id: "yard", label: "Construction Office", x: 19.5, y: 22.8, w: 2.1, d: 1.5, h: 35, wall: "var(--town-depot-wall)", side: "var(--town-depot-side)", roof: "var(--town-depot-roof)", sign: "var(--town-depot-sign)", win: false },
    { facing: "south", id: "gym", label: "Iron Gym", x: 11.8, y: 7.75, w: 3, d: 3.3, h: 70, wall: "var(--town-gym-wall)", side: "var(--town-gym-side)", roof: "var(--town-gym-roof)", sign: "var(--town-gym-sign)", win: true },
    { facing: "west", id: "school", label: "Stick U", x: 12, y: 2.1, w: 4, d: 4, h: 90, wall: "var(--town-school-wall)", side: "var(--town-school-side)", roof: "var(--town-school-roof)", sign: "var(--town-school-sign)", win: true },
    { facing: "north", id: "bar", label: "The Tipsy Stick", x: 1.2, y: 22, w: 3, d: 4, h: 60, wall: "var(--town-bar-wall)", side: "var(--town-bar-side)", roof: "var(--town-bar-roof)", sign: "var(--town-bar-sign)", win: true },
    { facing: "west", id: "work", label: "MegaCorp", x: 12, y: 20.1, w: 3.7, d: 4, h: 190, wall: "var(--town-work-wall)", side: "var(--town-work-side)", roof: "var(--town-work-roof)", sign: "var(--town-work-sign)", win: true },
    { facing: "west", id: "bank", label: "Town Bank", x: 12, y: 15.5, w: 3.5, d: 4, h: 85, wall: "var(--town-bank-wall)", side: "var(--town-bank-side)", roof: "var(--town-bank-roof)", sign: "var(--town-bank-sign)", win: true },
    { facing: "south", id: "shop", label: "Corner Shop", x: 15.25, y: 8.05, w: 2.6, d: 3.0, h: 48, wall: "var(--town-shop-wall)", side: "var(--town-shop-side)", roof: "var(--town-shop-roof)", sign: "var(--town-shop-sign)", win: true },
    { facing: "south", id: "diner", label: "Fryday Diner", x: 5.1, y: 13.2, w: 2.8, d: 3.8, h: 55, wall: "var(--town-diner-wall)", side: "var(--town-diner-side)", roof: "var(--town-diner-roof)", sign: "var(--town-diner-sign)", win: true },
    { facing: "west", id: "pawn", label: "Oddities Pawn", x: 26, y: 13.3, w: 3, d: 3.2, h: 56, wall: "var(--town-pawn-wall)", side: "var(--town-pawn-side)", roof: "var(--town-pawn-roof)", sign: "var(--town-pawn-sign)", win: true },
    { facing: "south", id: "furniture", label: "Cosy Corner", x: 18.3, y: 7.25, w: 3.6, d: 3.7, h: 78, wall: "var(--town-furniture-wall)", side: "var(--town-furniture-side)", roof: "var(--town-furniture-roof)", sign: "var(--town-furniture-sign)", win: true },
    { facing: "north", id: "casino", label: "Lucky Sevens", x: 5.2, y: 22, w: 2.8, d: 4, h: 115, wall: "var(--town-casino-wall)", side: "var(--town-casino-side)", roof: "var(--town-casino-roof)", sign: "var(--town-casino-sign)", win: true },
    { facing: "west", id: "depot", label: "Town Transit", x: 26, y: 25.6, w: 3, d: 3.1, h: 50, wall: "var(--town-depot-wall)", side: "var(--town-depot-side)", roof: "var(--town-depot-roof)", sign: "var(--town-depot-sign)", win: true },
    { facing: "west", id: "police", label: "Town Police", x: 26, y: 19.3, w: 3, d: 3.9, h: 90, wall: "var(--town-police-wall)", side: "var(--town-police-side)", roof: "var(--town-police-roof)", sign: "var(--town-police-sign)", win: true },
    { facing: "south", id: "clinic", label: "Patch Up Clinic", x: 1.1, y: 13, w: 3, d: 4, h: 75, wall: "var(--town-clinic-wall)", side: "var(--town-clinic-side)", roof: "var(--town-clinic-roof)", sign: "var(--town-clinic-sign)", win: true },
  ];
};

export const door = (b: B) => {
  switch (b.facing) {
    case "north": return { x: b.x + b.w / 2, y: b.y - 0.6 };
    case "south": return { x: b.x + b.w / 2, y: b.y + b.d + 0.6 };
    case "east": return { x: b.x + b.w + 0.6, y: b.y + b.d / 2 };
    case "west": return { x: b.x - 0.6, y: b.y + b.d / 2 };
  }
};
const TREES = [[.6,1],[4.6,1],[8,3],[11.9,.6],[17,4],[21,4],[28.8,6],[1,11],[7.5,11],[12.2,10],[28.8,18],[1,28],[8,28],[13.7,27.7],[29,29]] as const;
const LAMPS = [[2,6.65],[7,6.65],[8.4,10.35],[12,11.35],[20.8,11.35],[2,18.05],[7,18.05],[8.4,22],[12,25.05],[20,25.05],[25.5,16],[25.5,23]] as const;


const Tree = memo(function Tree({ x, y }: { x: number; y: number }) {
  const [sx, sy] = P(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      <ellipse cx={0} cy={2} rx={14} ry={6} fill="var(--town-shadow)" opacity={0.18} />
      <rect x={-3} y={-22} width={6} height={22} fill="var(--town-tree-trunk)" stroke="var(--town-ink)" />
      <circle cx={0} cy={-34} r={18} fill="var(--town-leaf)" stroke="var(--town-ink)" strokeWidth={1.5} />
      <circle cx={-7} cy={-40} r={8} fill="var(--town-leaf-light)" />
    </g>
  );
});

const Lamp = memo(function Lamp({ x, y, night }: { x: number; y: number; night: boolean }) {
  const [sx, sy] = P(x, y);
  return (
    <g transform={`translate(${sx},${sy})`}>
      {night && <ellipse cx={0} cy={0} rx={34} ry={16} fill="var(--town-window-lit)" opacity={0.25} />}
      <line x1={0} y1={0} x2={0} y2={-46} stroke="var(--town-lamp-post)" strokeWidth={3} />
      <circle cx={0} cy={-48} r={5} fill={night ? "var(--town-lamp-lit)" : "var(--town-lamp-glass)"} stroke="var(--town-ink)" />
    </g>
  );
});

function Car({ x, y, dir, color }: { x: number; y: number; dir: "x" | "y"; color: string }) {
  const [w, d] = dir === "x" ? [1.2, 0.6] : [0.6, 1.2];
  const bx = x - w / 2, by = y - d / 2, h = 11;
  return (
    <g>
      <polygon points={pts([P(bx, by + d), P(bx + w, by + d), P(bx + w, by + d, h), P(bx, by + d, h)])} fill={color} stroke="var(--town-ink)" />
      <polygon points={pts([P(bx + w, by), P(bx + w, by + d), P(bx + w, by + d, h), P(bx + w, by, h)])} fill={color} stroke="var(--town-ink)" filter="brightness(0.8)" opacity={0.85} />
      <polygon points={pts([P(bx, by, h), P(bx + w, by, h), P(bx + w, by + d, h), P(bx, by + d, h)])} fill={color} stroke="var(--town-ink)" />
      <polygon points={pts([P(bx + w * 0.25, by + d * 0.2, h + 8), P(bx + w * 0.75, by + d * 0.2, h + 8), P(bx + w * 0.75, by + d * 0.8, h + 8), P(bx + w * 0.25, by + d * 0.8, h + 8)])} fill="var(--town-windscreen)" stroke="var(--town-ink)" />
    </g>
  );
}

/** Follow the visible character: the skateboard extends farther below the head uphill. */
export function playerCameraViewBox(x: number, y: number, skating = false, _skateAngle = 180): string {
  const [cx, cy] = P(x, y);
  // Keep one visual anchor in all travel directions; the board stays screen-upright.
  const boardYOffset = skating ? -5 : -7;
  return `${cx - 165} ${cy + boardYOffset - 275} 330 550`;
}

function Stick({ x, y, phase, walking, jump = null, skating = false, pose = "standing", skateAngle = 90, color = "var(--town-player)", head = "var(--town-paper)", feedback = null }: { x: number; y: number; phase: number; walking: boolean; jump?: SkateJump | null; skating?: boolean; pose?: "standing" | "sitting"; idle?: boolean; facing?: "left" | "right" | "up" | "down"; skateAngle?: number; color?: string; head?: string; feedback?: StreetObjectId | null }) {
  const [sx, sy] = P(x, y);
  return <g transform={`translate(${sx},${sy})`}>
    {skating && jump && <ellipse data-skate-shadow cx="0" cy="0" rx="11" ry="6" fill="#25242a" opacity=".17"/>}
    {skating ? <g data-skater-pose data-skate-angle={skateAngle} transform={jump ? `translate(0 ${-elevation(jump)}) rotate(${skateAngle + 180})` : `rotate(${skateAngle + 180})`}>
      <g transform={`rotate(${deckRotation(jump)})`}><rect data-skateboard="deck" x="-5" y="-24" width="10" height="42" rx="5" fill="#89949c" stroke="#30343c" strokeWidth="1.8"/><path d="M-3 -18h6M-3 12h6" stroke="#cbd0d2" strokeWidth="1.2"/></g>
      <OverheadPerson pose={pose} head={head} outline={color} phase={phase} moving={false} angle={0}/>
    </g> : <OverheadPerson pose={pose} head={head} outline={color} phase={phase} moving={walking || feedback === "bin"} angle={(skateAngle + 180) % 360}/>}
    {feedback === "vending" && <g data-drinking-feedback transform="translate(14 -10)"><path d="M-3 -4h7l-1 9h-5Z" fill="var(--town-paper)" stroke="var(--town-ink)"/><path d="M0 -4v-5l3-2" stroke="var(--town-ink)" fill="none"/></g>}
    {feedback === "bin" && <text data-search-feedback x="15" y="-25" fontSize="15" fill="var(--town-ink)">?</text>}
    {feedback === "newspaper" && <g data-reading-feedback transform="translate(0 7)"><rect x="-8" y="-4" width="16" height="11" fill="var(--town-paper)" stroke="var(--town-ink)"/><path d="M0 -3v9m-6-7h4m4 0h4m-12 4h4m4 0h4" stroke="var(--town-ink)" strokeWidth=".7"/></g>}
  </g>;
}

export function TownMap({ movementMode = "joystick", hour, house, speed = 1, skating = false, karma = 0, onEnter, active, encounter, onEncounter, kidPresent = true, onKid, state, paused = false, onStreet, onStreetIncident }: { movementMode?: "joystick" | "tap"; hour: number; house: number; speed?: number; skating?: boolean; karma?: number; onEnter: (id: string) => void; active: string | null; encounter?: EncounterSpot | null; onEncounter?: () => void; kidPresent?: boolean; onKid?: () => void; state?: GameState; paused?: boolean; onStreet?: (id: StreetObjectId) => boolean; onStreetIncident?: ((id: ResidentId) => void) | undefined }) {
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const bs = useMemo(() => buildings(house), [house]);
  const townState = useMemo(() => state ?? {...START, hour, house, karma}, [state,hour,house,karma]);
  const positions = useRef<ResidentPositions>({});
  const seatedUntil = useRef(0);
  const streetFeedback = useRef<{id:StreetObjectId;until:number}|null>(null);
  const streetRef = useRef(onStreet); streetRef.current = onStreet;
  const encounterRef = useRef({encounter,onEncounter}); encounterRef.current = {encounter,onEncounter};
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const [nearStreet, setNearStreet] = useState<StreetObjectId | null>(null);
  const nearStreetRef = useRef<StreetObjectId | null>(null);
  const useStreet = useCallback((id: StreetObjectId) => {
    const object = STREET_OBJECTS.find(o=>o.id===id);
    if (performance.now()/1000 < (streetFeedback.current?.until ?? 0)) return;
    if (!object || Math.hypot(me.current.x-object.x,me.current.y-object.y)>1.15 || pausedRef.current) return;
    if (streetRef.current?.(id)) {
      const until=performance.now()/1000+2;
      streetFeedback.current={id,until};
      if(id === "bench") seatedUntil.current=until;
    }
  }, []);
  const svgRef = useRef<SVGSVGElement>(null);
  const skateJump = useRef<SkateJump | null>(null);
  const streetGrind = useRef<StreetGrind | null>(null);
  const [grindHud, setGrindHud] = useState<{name:string;balance:number}|null>(null);
  const startTrick = (trick: "ollie" | "kickflip" | "shuvit") => {
    if (!skating || pausedRef.current || skateJump.current || streetGrind.current) return;
    const rail = nearbyRail(me.current);
    const grind = rail ? beginStreetGrind(me.current, rail) : null;
    if (grind) { streetGrind.current = grind; skateJump.current = null; }
    else skateJump.current = {trick,elapsed:0};
  };
  const me = useRef({ x: 9.95, y: 9.0, phase: 0, walking: false, skateAngle: 90, facing: "right" as "left" | "right" | "up" | "down" });
  const target = useRef<{ waypoints: Point[]; enter?: string | undefined } | null>(null);
  const routeTo = useCallback((destination: Point, enter?: string) => {
    if (!isWalkable(me.current, bs)) Object.assign(me.current, nearestWalkable(me.current, bs));
    const route = findRoute(me.current, destination, bs);
    if (enter === "kid" && Math.hypot(me.current.x-destination.x,me.current.y-destination.y) < PARK_KID_SPOT.approach) { kidRef.current?.(); return; }
    target.current = route.length ? { waypoints: route, enter } : null;
  }, [bs]);
  const selectEncounter = () => {
    if (!encounter || pausedRef.current) return;
    if(Math.hypot(me.current.x-encounter.x,me.current.y-encounter.y)<1.5) onEncounter?.();
    else routeTo(encounter,"encounter");
  };
  const selectResident = useCallback((id: string, p: Point) => {
    if(pausedRef.current)return;
    if(Math.hypot(me.current.x-p.x,me.current.y-p.y)<1.5) enterRef.current("resident:"+id);
    else routeTo(p,"resident:"+id);
  }, [routeTo]);
  const selectObject = useCallback((id: StreetObjectId) => {
    const object=STREET_OBJECTS.find(o=>o.id===id); if(!object)return;
    if(Math.hypot(me.current.x-object.x,me.current.y-object.y)<1.15)useStreet(id);
    else routeTo(object,"street:"+id);
  }, [routeTo,useStreet]);
  const keys = useRef(new Set<string>());
  // Screen-space thumb anchor appears at any touch point, including over buildings.
  // The pointer id prevents secondary touches from hijacking movement.
  const joystick = useRef<{ id: number; x: number; y: number; dx: number; dy: number } | null>(null);
  const [stickVisual, setStickVisual] = useState<{ x: number; y: number; dx: number; dy: number } | null>(null);
  const suppressGroundClickUntil = useRef(0);
  const joystickDragged = useRef(false);
  const removeJoystickListeners = useRef<(() => void) | null>(null);
  const JOYSTICK_RADIUS = 52;
  const updateJoystick = (clientX: number, clientY: number) => {
    const stick = joystick.current;
    if (!stick) return;
    const dx = clientX - stick.x;
    const dy = clientY - stick.y;
    const distance = Math.hypot(dx, dy);
    const fraction = distance > JOYSTICK_RADIUS ? JOYSTICK_RADIUS / distance : 1;
    stick.dx = dx * fraction / JOYSTICK_RADIUS;
    stick.dy = dy * fraction / JOYSTICK_RADIUS;
    setStickVisual({ x: stick.x, y: stick.y, dx: stick.dx, dy: stick.dy });
  };
  const stopJoystick = () => {
    removeJoystickListeners.current?.();
    removeJoystickListeners.current = null;
    joystick.current = null;
    joystickDragged.current = false;
    setStickVisual(null);
  };
  useEffect(() => () => {
    removeJoystickListeners.current?.();
    removeJoystickListeners.current = null;
  }, []);
  const [t, setT] = useState(0);
  const [near, setNear] = useState<B | null>(null);
  const nearRef = useRef<B | null>(null);
  const kidRef = useRef(onKid);
  kidRef.current = onKid;
  const kidPresentRef = useRef(kidPresent);
  kidPresentRef.current = kidPresent;
  const enterRef = useRef(onEnter);
  enterRef.current = onEnter;

  const blocked = (x: number, y: number) =>
    x < 0.2 || y < 0.2 || x > N - 0.2 || y > N - 0.2 || bs.some((b) => x > b.x - 0.15 && x < b.x + b.w + 0.15 && y > b.y - 0.15 && y < b.y + b.d + 0.15);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (pausedRef.current || (e.target instanceof HTMLElement && e.target.closest("button,input,textarea,[role=dialog]"))) return;
      const k = e.key.toLowerCase();
      if (skating && !e.repeat && (k === " " || k === "q" || k === "r") && !skateJump.current) {
        startTrick(k === "q" ? "kickflip" : k === "r" ? "shuvit" : "ollie");
        e.preventDefault();
        return;
      }
      if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) e.preventDefault();
      if ((k === "e" || k === " " || k === "enter") && nearStreetRef.current) useStreet(nearStreetRef.current);
      else if ((k === "e" || k === " " || k === "enter") && nearRef.current) enterRef.current(nearRef.current.id);
      else if ((k === "e" || k === " " || k === "enter") && Math.hypot(me.current.x - GANG_SPOT.x, me.current.y - GANG_SPOT.y) < GANG_SPOT.approach) enterRef.current("gang");
      keys.current.add(k);
      target.current = null;
    };
    const up = (e: KeyboardEvent) => keys.current.delete(e.key.toLowerCase());
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    if (!isWalkable(me.current, bs)) Object.assign(me.current, nearestWalkable(me.current, bs));
    // Limit expensive React/SVG scene reconciliation to 20 FPS on mobile.
    // The browser still schedules RAF normally, but most frames do no React work.
    let last = performance.now(), raf = 0;
    const FRAME_MS = 50;
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (now - last < FRAME_MS) return;
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      if(pausedRef.current){ keys.current.clear(); target.current=null; me.current.walking=false; return; }
      skateJump.current = skating ? stepJump(skateJump.current, dt) : null;
      if(streetGrind.current && skating){
        const lean = (keys.current.has("a") || keys.current.has("arrowleft") ? -1 : 0) + (keys.current.has("d") || keys.current.has("arrowright") ? 1 : 0);
        const next = advanceStreetGrind(streetGrind.current,dt,lean);
        streetGrind.current=next;
        const pos=grindPosition(next); me.current.x=pos.x; me.current.y=pos.y;
        if(next.outcome==="grinding")setGrindHud({name:next.rail.name,balance:next.balance});
        else {streetGrind.current=null;setGrindHud(null);}
        setT(now/1000);
        return;
      }
      if(!skating && streetGrind.current){streetGrind.current=null;setGrindHud(null);}
      const k = keys.current, m = me.current;
      let dx = 0, dy = 0;
      if (k.has("w") || k.has("arrowup")) dy -= 1;
      if (k.has("s") || k.has("arrowdown")) dy += 1;
      if (k.has("a") || k.has("arrowleft")) dx -= 1;
      if (k.has("d") || k.has("arrowright")) dx += 1;
      if (!dx && !dy && joystick.current) {
        const stick = joystick.current;
        // Screen X and Y align with the world's orthogonal map axes.
        // Small thumb drift falls inside a dead zone, preventing accidental steps.
        if (Math.hypot(stick.dx, stick.dy) > 0.16) {
          dx = stick.dx;
          dy = stick.dy;
        }
      }
      if (!dx && !dy && !joystick.current && target.current) {
        const waypoint = target.current.waypoints[0];
        if (waypoint) {
          dx = waypoint.x - m.x; dy = waypoint.y - m.y;
          if (Math.hypot(dx, dy) < Math.max(0.15, 1.9 * speed * dt)) {
            target.current.waypoints.shift(); dx = dy = 0;
          }
        }
        if (target.current && target.current.waypoints.length === 0) {
          const id = target.current.enter;
          target.current = null;
          if (id === "kid" && kidPresentRef.current) kidRef.current?.();
          else if (id === "encounter") {
            const current = encounterRef.current;
            if(current.encounter && Math.hypot(current.encounter.x-m.x,current.encounter.y-m.y)<1.5) current.onEncounter?.();
          }
          else if (id?.startsWith("street:")) useStreet(id.slice(7) as StreetObjectId);
          else if (id?.startsWith("resident:")) {
            const resident=positions.current[id.slice(9) as keyof ResidentPositions];
            if(resident && Math.hypot(resident.x-m.x,resident.y-m.y)<1.5)enterRef.current(id);
          }
          else if (id) enterRef.current(id);
        }
      }
      const len = Math.hypot(dx, dy);
      m.walking = len > 0;
      if (len) {
        seatedUntil.current=0;
        const sp = 1.9 * speed * dt;
        const nx = m.x + (dx / len) * sp, ny = m.y + (dy / len) * sp;
        if (!blocked(nx, ny)) { m.x = nx; m.y = ny; }
        else if (!blocked(nx, m.y)) m.x = nx;
        else if (!blocked(m.x, ny)) m.y = ny;
        else target.current = null;
        if (Math.abs(dx) > Math.abs(dy) * 1.15) m.facing = dx > 0 ? "right" : "left";
        else if (Math.abs(dy) > Math.abs(dx) * 1.15) m.facing = dy > 0 ? "down" : "up";
        m.skateAngle = Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) * 45;
        m.phase += dt * 12;
      }
      const object=STREET_OBJECTS.find(o=>Math.hypot(o.x-m.x,o.y-m.y)<1.15)?.id ?? null;
      if(object!==nearStreetRef.current){nearStreetRef.current=object;setNearStreet(object);}
      const n = bs.find((b) => { const dd = door(b); return Math.hypot(dd.x - m.x, dd.y - m.y) < 1; }) ?? null;
      if (n?.id !== nearRef.current?.id) { nearRef.current = n; setNear(n); }
      setT(now / 1000);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house, speed, hour]);

  const toTile = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const matrix = svg.getScreenCTM();
    if (!matrix) return null;
    const p = pt.matrixTransform(matrix.inverse());
    return { x: p.x / TW, y: p.y / TH };
  };

  const onGroundPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (movementMode !== "joystick" || e.pointerType === "mouse" || joystick.current) return;
    if (e.isPrimary === false) return;
    // Anchor to the real touch point, not a clamped position that jumps near edges.
    const x = e.clientX, y = e.clientY;
    joystick.current = { id: e.pointerId, x, y, dx: 0, dy: 0 };
    joystickDragged.current = false;
    // Capture on the persistent SVG root so moving scenery cannot steal a drag.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* Window listeners remain a fallback. */ }
    setStickVisual({ x, y, dx: 0, dy: 0 });

    // Follow the gesture from window level. The game camera, SVG objects and
    // buildings can change under the thumb without interrupting movement.
    const move = (event: PointerEvent) => {
      const origin = joystick.current;
      if (!origin || event.pointerId !== origin.id) return;
      if (!joystickDragged.current && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 9) {
        joystickDragged.current = true;
        target.current = null;
      }
      if (joystickDragged.current) {
        updateJoystick(event.clientX, event.clientY);
        if (event.cancelable) event.preventDefault();
      }
    };
    const end = (event: PointerEvent) => {
      if (joystick.current?.id !== event.pointerId) return;
      if (joystickDragged.current) suppressGroundClickUntil.current = performance.now() + 350;
      try {
        if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId);
      } catch { /* Pointer may already be released or cancelled. */ }
      stopJoystick();
    };
    window.addEventListener("pointermove", move, { capture: true, passive: false });
    window.addEventListener("pointerup", end, true);
    window.addEventListener("pointercancel", end, true);
    removeJoystickListeners.current = () => {
      window.removeEventListener("pointermove", move, true);
      window.removeEventListener("pointerup", end, true);
      window.removeEventListener("pointercancel", end, true);
    };
  };

  const night = hour >= 19 || hour < 6;
  const dusk = hour >= 17 && hour < 19;
  const m = me.current;

  // depth-sorted drawables
  const items: { key: number; el: React.ReactNode }[] = [];
  bs.forEach((b) => items.push({ key: (b.y + b.d) * 100 + b.x, el: (
    <g key={b.id} data-world-interactive role="button" tabIndex={0} aria-label={`Enter ${b.label}`} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();routeTo(door(b),b.id);}}} onClick={(e) => { e.stopPropagation(); routeTo(door(b), b.id); }} className="cursor-pointer" opacity={active === b.id ? 1 : 0.97}>
      <Exterior b={b} night={townAtmosphere(hour).lit} />
    </g>) }));
  TREES.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Tree key={`t${i}`} x={x} y={y} /> }));
  LAMPS.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Lamp key={`l${i}`} x={x} y={y} night={night || dusk} /> }));
  const c1 = ((t * 2.2) % 8), c2 = 11 + ((t * 1.7) % 12), c3 = ((t * 1.9 + 7) % (N + 4)) - 2;
  items.push({ key: 8.5 * 100 + c1, el: <Car key="c1" x={c1} y={8.5} dir="x" color="var(--town-car-red)" /> });
  items.push({ key: 13.3 * 100 + c2, el: <Car key="c2" x={c2} y={13.3} dir="x" color="var(--town-car-blue)" /> });
  items.push({ key: c3 * 100 + 10, el: <Car key="c3" x={10} y={c3} dir="y" color="var(--town-car-yellow)" /> });
  // A long-neglected vehicle is a quiet clue for future transport storylines.
  // Not driveable yet: there is deliberately no ordinary purchase action.
  items.push({ key: 9.25 * 100 + 8.4, el: <g key="abandoned-car" data-abandoned-car>
    <title>Rusty abandoned car — its engine has not run in years.</title>
    <Car x={8.4} y={9.25} dir="x" color="#74695e"/>
    <g transform={`translate(${P(8.4,9.25)[0]} ${P(8.4,9.25)[1]-17})`}>
      <path d="M-17 1l9 -6m5 3l8 7m6 -10l5 5" stroke="#493e39" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
  </g> });
  // Ordinary people hanging around the north-east green; only tapping them starts an encounter.
  const [gx, gy] = P(GANG_SPOT.x, GANG_SPOT.y);
  items.push({
    key: GANG_SPOT.y * 100 + GANG_SPOT.x,
    el: (
      <g key="street-gang" role="button" tabIndex={0} aria-label="Approach the street gang"
        className="cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] focus-visible:opacity-80" data-street-gang
        onClick={(event) => { event.stopPropagation(); routeTo(GANG_SPOT, "gang"); }}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.stopPropagation(); routeTo(GANG_SPOT, "gang"); } }}>
        <g transform={`translate(${gx} ${gy})`}>
          <ellipse cx="0" cy="8" rx="45" ry="7" fill="#27372f" opacity=".14"/>
          <g data-gang-backlot pointerEvents="none" stroke="var(--town-ink)">
            <rect x="-62" y="-9" width="16" height="23" rx="3" fill="var(--town-bin)"/>
            <path d="M-61 -9h14m-12-3q-6-10 0-17m8 16q7-12 0-20" fill="none" stroke="var(--town-grime)"/>
            <rect x="40" y="-4" width="30" height="17" rx="2" fill="var(--town-vending)"/>
            <circle cx="47" cy="5" r="4" fill="var(--town-ink)"/><circle cx="63" cy="5" r="4" fill="var(--town-ink)"/>
            <path d="M47 -5v-6h16v6" fill="none"/>
          </g>
          <path d="M-30 -8h22" stroke="#846b53" strokeWidth="5" strokeLinecap="round"/>
          <g data-gang-sitting transform="translate(-20 0)"><OverheadPerson head="#ae856c" outline="#292735" phase={t} pose="sitting" /></g>
          <g data-gang-standing transform="translate(8 -10)"><OverheadPerson head="#aa7f6b" outline="#292735" phase={t+2} moving/></g>
          <g data-gang-leaning transform="translate(30 0)"><OverheadPerson head="#bd977b" outline="#332c35" phase={t+4} pose="lying"/></g>
          {Math.sin(t*1.3)>.48 && <g transform="translate(4 -42)"><rect x="-21" y="-17" width="42" height="20" rx="8" fill="#eee1c4" stroke="#302b35" strokeWidth="2"/><text y="-3" textAnchor="middle" fontSize="11" fill="#302b35">Oi...</text></g>}
          <rect x="-45" y="-55" width="94" height="73" fill="transparent"/>
        </g>
      </g>
    ),
  });
  if (kidPresent) {
    const [kx, ky] = P(PARK_KID_SPOT.x, PARK_KID_SPOT.y);
    items.push({ key: PARK_KID_SPOT.y * 100 + PARK_KID_SPOT.x,
      el: <g key="park-kid" data-park-kid role="button" tabIndex={0} aria-label="Talk to the park bench regular"
        className="cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] focus-visible:opacity-80"
        onClick={ev=>{ev.stopPropagation();routeTo(PARK_KID_SPOT, "kid");}}
        onKeyDown={ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();routeTo(PARK_KID_SPOT, "kid");}}}>
        <g transform={`translate(${kx} ${ky})`}>
          <path d="M-24 -8h48M-24 -2h48" stroke="#806249" strokeWidth="5" strokeLinecap="round"/>
          <path d="M-20 -2v12M20 -2v12" stroke="#4d403a" strokeWidth="3"/>
          <g data-kid-sitting><OverheadPerson head="#dbb38b" outline="#292633" pose="sitting"/></g>
          <rect x="-28" y="-36" width="56" height="52" fill="transparent"/>
        </g>
      </g> });
  }
  if(encounter){
    const e=encounter;
    const sway=e.pose==="pacing"?Math.sin(t*1.8)*.32:0;
    const px=e.x+sway;
    const [sx,sy]=P(px,e.y);
    items.push({key:e.y*100+px,el:<g key="encounter" data-encounter className="cursor-pointer outline-none [-webkit-tap-highlight-color:transparent] focus-visible:opacity-80" role="button" tabIndex={0} aria-label={e.hint} onKeyDown={ev=>{if(ev.key==="Enter"||ev.key===" "){ev.preventDefault();ev.stopPropagation();selectEncounter();}}} onClick={ev=>{ev.stopPropagation();selectEncounter();}}>
      <g transform={`translate(${sx} ${sy})`}>
        <OverheadPerson head="#f3d7b8" outline="#3c3043" phase={t} moving={e.pose==="pacing"} pose={e.pose==="sitting"?"sitting":"standing"}/>
        <g transform={`translate(0 ${-36+Math.sin(t*3)*2})`}>
          <rect x="-19" y="-24" width="38" height="29" rx="12" fill="#fff2d4" stroke="#24202b" strokeWidth="3"/>
          <text textAnchor="middle" y="-4" fontSize="18" fontWeight="bold" fill="#25202b">{e.icon}</text>
          <path d="M-3 4L0 12L6 4" fill="#fff2d4" stroke="#24202b" strokeWidth="2"/>
        </g>
        <rect x="-22" y="-62" width="44" height="78" fill="transparent" />
      </g>
    </g>});
  }
  items.push({ key: m.y * 100 + m.x, el: <Stick key="me" x={m.x} y={m.y} phase={streetFeedback.current && t<streetFeedback.current.until ? (reducedMotion ? 0 : t*8) : m.phase} feedback={streetFeedback.current && t<streetFeedback.current.until ? streetFeedback.current.id : null} walking={m.walking} skating={skating} jump={skateJump.current} facing={m.facing} skateAngle={m.skateAngle} pose={t<seatedUntil.current ? "sitting" : "standing"} head={karmaHeadColor(karma)} /> });
  items.sort((a, b) => a.key - b.key);

  const tile = (x: number, y: number, w: number, d: number, fill: string, k: string) => (
    <polygon key={k} points={pts([P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)])} fill={fill} />
  );

  return (
    <div data-town-paused={paused} className={"absolute inset-0 overflow-hidden " + (night ? "town-night" : dusk ? "town-dusk" : "town-day")}>
      <svg ref={svgRef} viewBox={playerCameraViewBox(m.x, m.y, skating, m.skateAngle)} preserveAspectRatio="xMidYMid slice" className="block h-full w-full touch-none select-none font-hand"
        onPointerDown={e=>{if(!pausedRef.current)onGroundPointerDown(e);}}
        onClickCapture={(e) => {
          if (performance.now() < suppressGroundClickUntil.current) {
            suppressGroundClickUntil.current = 0;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onClick={(e) => {
          if (movementMode === "joystick" && e.nativeEvent.detail !== 0 && !(e.nativeEvent as PointerEvent).pointerType?.includes("mouse")) return; const p = toTile(e); if (!p) return; const wanted = { x: Math.max(0.5, Math.min(N - 1, p.x)), y: Math.max(0.5, Math.min(N - 1, p.y)) }; routeTo(nearestWalkable(wanted, bs)); }}>
        {/* Plot-led map: green blocks first, with pavements sized to actual roads and doors. */}
        {tile(0,0,N,N,"var(--town-grass)","grass")}
        {/* Plots intermix naturally; there are no imposed rectangular districts. */}
        {tile(0,0,8.8,7.2,"var(--town-lawn)","quiet-green")}
        {tile(25.5,7.5,4.2,4.8,"var(--town-park-lawn)","park-green")}
        {/* Road shoulders do not extend across entire neighbourhoods. */}
        {ROADS.map((r,i) => tile(Math.max(0,r.x-.58),Math.max(0,r.y-.58),
          Math.min(N,r.x+r.w+.58)-Math.max(0,r.x-.58),
          Math.min(N,r.y+r.d+.58)-Math.max(0,r.y-.58),
          "var(--town-pavement)","kerb-"+i))}
        {/* Individual lawns and building setbacks, rather than continuous square paving. */}
        {bs.map(b => tile(Math.max(0,b.x-.15),Math.max(0,b.y-.15),b.w+.3,b.d+.3,
          b.id==="casino" || b.id==="alley"?"var(--town-backlot)":"var(--town-garden)","lot-"+b.id))}
        {/* Short building approach paths, connected to the closest available road. */}
        {bs.map(b => {
          const d=door(b);
          const r=ROADS.map(road=>{
            const x=Math.max(road.x,Math.min(road.x+road.w,d.x));
            const y=Math.max(road.y,Math.min(road.y+road.d,d.y));
            return {x,y,distance:Math.hypot(d.x-x,d.y-y)};
          }).sort((a,b)=>a.distance-b.distance)[0];
          if(!r) return null;
          return tile(Math.min(d.x,r.x)-.22,Math.min(d.y,r.y)-.22,
            Math.abs(d.x-r.x)+.44,Math.abs(d.y-r.y)+.44,"var(--town-approach)","approach-"+b.id);
        })}
        {/* Central park: not another paved rectangle. */}
        {tile(25.5,8.1,4.1,4.0,"var(--town-park)","park")}
        <ellipse cx={P(28.1,10.2)[0]} cy={P(28.1,10.2)[1]} rx={38} ry={23} fill="var(--town-pond)" stroke="var(--town-pond-edge)" strokeWidth={3} />
        {tile(27.5,8.0,0.45,4.3,"var(--town-park-path)","park-path-ns")}
        {tile(25.5,10.3,4.1,0.4,"var(--town-park-path)","park-path-ew")}
        {/* Roads are finite streets with deliberate ends and T-junctions. */}
        {ROADS.map((r,i)=>tile(r.x,r.y,r.w,r.d,"var(--town-asphalt)","road-"+i))}
        {/* Lane paint is generated from each actual street, never a removed grid road. */}
        {ROADS.map((r,i)=>{
          const vertical=r.d>r.w;
          const count=Math.floor((vertical?r.d:r.w)/2.4);
          return Array.from({length:count},(_,j)=>
            vertical?tile(r.x+r.w/2-.05,r.y+.6+j*2.4,.1,.85,"var(--town-lane-paint)","line-"+i+"-"+j):
              tile(r.x+.6+j*2.4,r.y+r.d/2-.05,.85,.1,"var(--town-lane-paint)","line-"+i+"-"+j));
        })}
        {/* Visible grind targets, positioned using existing map projection. */}
        {TOWN_RAILS.map(rail => {
          const [ax, ay] = P(rail.a.x, rail.a.y);
          const [bx, by] = P(rail.b.x, rail.b.y);
          return <g key={"grind-"+rail.id} data-town-rail={rail.id} pointerEvents="none">
            <path d={`M${ax} ${ay} L${bx} ${by}`} stroke="#2b2c31" strokeWidth={5} strokeLinecap="round"/>
            <path d={`M${ax} ${ay-2} L${bx} ${by-2}`} stroke="#bbc2c7" strokeWidth={2} strokeLinecap="round"/>
          </g>;
        })}
        {/* Crossings only where the staggered side roads actually meet the spine. */}
        {[7.1,11.9,18.5,25.5].map((y,i)=>
          <g key={"crossing-"+i}>{Array.from({length:4},(_,j)=>
            tile(8.85+j*.62,y-.35,.34,.4,"var(--town-crossing)","stripe-"+i+"-"+j))}</g>)}
        {/* Every property has a short approach path linking its door to the surrounding pavement. */}
        {bs.map((b) => {
          const d = door(b);
          const south = b.facing === "south";
          const north = b.facing === "north";
          const x = south || north ? d.x - 0.33 : Math.min(d.x, b.facing === "east" ? b.x+b.w : b.x) - 0.05;
          const y = south ? b.y+b.d : north ? d.y : d.y - 0.33;
          const w = south || north ? 0.66 : 0.7;
          const depth = south || north ? 0.65 : 0.66;
          return tile(x, y, w, depth, "var(--town-door-path)", "walk-" + b.id);
        })}
        <Site active={townAtmosphere(hour).constructionActive} onForeman={() => {const yard=bs.find(b=>b.id==="yard");if(yard)routeTo(door(yard), "yard");}} />
        {/* Street gang occupy the untouched north-east green, away from the shops. */}
        {tile(25.5, 6.0, 2.0, 1.8, "var(--town-grime)", "gang-patch")}
        <polygon points={pts([P(0, N), P(N, N), P(N, N, -22), P(0, N, -22)])} fill="var(--town-earth-front)" stroke="var(--town-ink)" />
        <polygon points={pts([P(N, 0), P(N, N), P(N, N, -22), P(N, 0, -22)])} fill="var(--town-earth-side)" stroke="var(--town-ink)" />
        {target.current && !target.current.enter && (() => { const end = target.current.waypoints.at(-1); if (!end) return null; const [x, y] = P(end.x, end.y); return <ellipse cx={x} cy={y} rx={12} ry={6} fill="none" stroke="var(--town-paper)" strokeWidth={2} />; })()}
        {items.map((i) => i.el)}
        <StreetLife player={me} positions={positions} lots={bs} state={townState} skating={skating} paused={paused} onResident={selectResident} onObject={selectObject} onIncident={onStreetIncident} feedback={streetFeedback.current && t<streetFeedback.current.until ? streetFeedback.current.id : null} />
        {(night || dusk) && <rect x={-2000} y={-2000} width={4000} height={4000} fill={night ? "var(--town-night-wash)" : "var(--town-dusk-wash)"} opacity={night ? 0.22 : 0.1} pointerEvents="none" />}
      </svg>
      
      {stickVisual && (
        <div data-floating-joystick aria-hidden="true" className="pointer-events-none absolute inset-0 z-20">
          <div
            className="absolute grid h-[104px] w-[104px] place-items-center rounded-full border-[3px] border-white/70 bg-slate-900/35 shadow-lg"
            style={{ left: stickVisual.x, top: stickVisual.y, transform: "translate(-50%, -50%)" }}
          >
            <div className="h-12 w-12 rounded-full border-[3px] border-white/90 bg-slate-200/75 shadow-lg"
              style={{ transform: `translate(${stickVisual.dx * 52}px, ${stickVisual.dy * 52}px)` }} />
          </div>
        </div>
      )}
      {/* Compact overhead minimap: same world coordinates as navigation, not screen pixels. */}
      <div className="absolute bottom-16 left-3 z-10 w-32 rounded-lg border-2 border-foreground bg-card/95 p-1 shadow-lg sm:bottom-3 sm:w-40" aria-label="Town minimap">
        <div className="mb-1 flex items-center justify-between px-1 text-xs font-bold">
          <span>🗺️ Town map</span>
        </div>
        <svg viewBox={`0 0 ${N} ${N}`} className="aspect-square w-full rounded bg-town-grass" role="img" aria-label="Overhead map showing buildings and your location"
          onPointerDown={(e) => {
            e.stopPropagation();
            const bounds = e.currentTarget.getBoundingClientRect();
            routeTo({
              x: Math.max(0.3, Math.min(N - 0.3, (e.clientX - bounds.left) / bounds.width * N)),
              y: Math.max(0.3, Math.min(N - 0.3, (e.clientY - bounds.top) / bounds.height * N)),
            });
          }}>
          <rect x="25.5" y="8.1" width="4.1" height="4" fill="var(--town-mini-park)" />
          {ROADS.map((r,i) => <rect key={"mini-road-"+i} x={r.x} y={r.y} width={r.w} height={r.d} fill="var(--town-mini-road)" />)}
          <circle cx={GANG_SPOT.x} cy={GANG_SPOT.y} r={0.8} fill="#40343d" stroke="#f2d46f" strokeWidth={0.22}><title>Street gang - approach at your own risk</title></circle>
          {bs.map((b) => <rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.d}
            fill={b.sign} stroke="var(--town-paper)" strokeWidth={0.18} rx={0.2}>
            <title>{b.label}</title>
          </rect>)}
          <circle cx={m.x} cy={m.y} r={0.85} fill="var(--town-paper)" stroke="var(--town-player)" strokeWidth={0.35} />
          <circle cx={m.x} cy={m.y} r={0.28} fill="var(--town-player-marker)" />
        </svg>
      </div>

      {skating && !paused && grindHud && <div data-grind-hud className="absolute top-12 left-1/2 z-20 -translate-x-1/2 rounded-lg bg-card/90 px-3 py-2 text-center text-xs font-bold shadow-lg">{grindHud.name} · Balance {Math.round(grindHud.balance*100)}<div className="mt-1 flex gap-2"><button type="button" className="min-h-11 rounded border border-foreground px-3" onPointerDown={e=>{e.stopPropagation();keys.current.add("a");}} onPointerUp={()=>keys.current.delete("a")} onPointerCancel={()=>keys.current.delete("a")}>◀ Hold</button><button type="button" className="min-h-11 rounded border border-foreground px-3" onPointerDown={e=>{e.stopPropagation();keys.current.add("d");}} onPointerUp={()=>keys.current.delete("d")} onPointerCancel={()=>keys.current.delete("d")}>Hold ▶</button></div></div>}
      {skating && !paused && (
        <div data-skate-trick-controls className="absolute bottom-36 right-3 z-20 flex flex-col gap-2 sm:bottom-20" aria-label="Skateboard tricks">
          {(["ollie", "kickflip", "shuvit"] as const).map(trick => (
            <button key={trick} type="button" aria-label={trick} className="min-h-11 rounded-lg border-2 border-foreground bg-card/90 px-3 text-xs font-bold shadow-lg"
              onPointerDown={e => e.stopPropagation()}
              onClick={e => { e.stopPropagation(); startTrick(trick); }}>
              {trick === "ollie" ? "Jump" : trick === "kickflip" ? "Kickflip" : "Shuvit"}
            </button>
          ))}
        </div>
      )}
      {nearStreet && !paused && <Button onClick={()=>useStreet(nearStreet)} className="absolute bottom-64 left-1/2 h-auto min-h-11 max-w-[calc(100%-24px)] -translate-x-1/2 whitespace-normal rounded-sm border-2 border-foreground text-center sm:bottom-24">{STREET_OBJECTS.find(o=>o.id===nearStreet)?.label}</Button>}
      {near && !nearStreet && !paused && (
        <Button onClick={() => onEnter(near.id)} className="absolute bottom-64 left-1/2 max-w-[calc(100%-24px)] -translate-x-1/2 rounded-sm border-2 border-foreground bg-primary px-4 py-1 text-lg text-primary-foreground sm:bottom-24">
          Enter {near.label} <span className="hidden sm:inline">(E)</span>
        </Button>
      )}
    </div>
  );
}
