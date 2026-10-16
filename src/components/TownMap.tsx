import { canDrive } from "@/lib/transport";
import { townHallBuilt as isTownHallBuilt } from "@/lib/civic-career";
import { beginStreetGrind, advanceStreetGrind, grindPosition, type StreetGrind } from "@/lib/street-grind";
import { nearbyRail } from "@/lib/town-rails";
import { TOWN_RAILS } from "@/lib/town-rails";
import { stepJump, type SkateJump } from "@/lib/skate-tricks";
import { SkaterFigure } from "@/components/SkaterFigure";
import { OverheadPerson } from "@/components/OverheadPerson";
import { lazy, memo, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

import { TW, TH, N } from "@/lib/town-world";
const Exterior = memo(BuildingExterior);
// Three.js is only loaded when a WebGL-capable browser actually shows the 3D town.
const TownWorld3D = lazy(() => import("@/components/town3d/TownWorld3D"));

function townWebgl(): boolean {
  try {
    if (typeof document === "undefined") return false;
    const c = document.createElement("canvas");
    return Boolean(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

/** 3D is primary. Classic map remains a fallback for unsupported WebGL devices only. */
function useTown3d() {
  const [gl, setGl] = useState(false);
  useEffect(() => { setGl(townWebgl()); }, []);
  return { use3d: gl };
}
const Site = memo(ConstructionSite);

import { karmaHeadColor } from "@/lib/player-appearance";
export { karmaHeadColor } from "@/lib/player-appearance";

const pts = (a: (readonly [number, number])[]) => a.map((p) => p.join(",")).join(" ");

export { ROADS, buildings, door, HOUSE_LOOK } from "@/lib/town-world";
import { ROADS, laneDashes, buildings, buildingPlot, townSolids, door, TREES, LAMPS, playerCameraOffset, type B } from "@/lib/town-world";
import { buildingHull3d } from "@/components/town3d/specs";
import { DINER_CHIMNEY, screenOf, townSky } from "@/components/town3d/screen";
import type { StreetLive, TownLive } from "@/components/town3d/actors";

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
      <polygon points={pts([P(bx + w, by), P(bx + w, by + d), P(bx + w, by + d, h), P(bx + w, by, h)])} fill={color} stroke="var(--town-ink)" opacity={0.85} />
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

/** Camera as a pixel-snapped transform on a fixed viewBox: avoids full SVG re-rasterising each frame. */
export function playerCameraTransform(x: number, y: number, skating = false): string {
  const [ox, oy] = playerCameraOffset(x, y, skating);
  return `translate(${ox} ${oy})`;
}

function Stick({ x, y, phase, walking, jump = null, skating = false, pose = "standing", skateAngle = 90, color = "var(--town-player)", head = "var(--town-paper)", feedback = null, turnVelocity = 0 }: { x: number; y: number; phase: number; walking: boolean; jump?: SkateJump | null; skating?: boolean; pose?: "standing" | "sitting"; idle?: boolean; facing?: "left" | "right" | "up" | "down"; skateAngle?: number; color?: string; head?: string; feedback?: StreetObjectId | null; turnVelocity?: number }) {
  const [sx, sy] = P(x, y);
  return <g transform={`translate(${sx},${sy})`}>
    {skating
      ? <SkaterFigure skateAngle={skateAngle} moving={walking} phase={phase} turnVelocity={turnVelocity} head={head} outline={color} jump={jump} />
      : <OverheadPerson pose={pose} head={head} outline={color} phase={phase} moving={walking || feedback === "bin"} angle={(skateAngle + 180) % 360} />}
    <FeedbackIcons feedback={feedback} />
  </g>;
}

/** Little action cues next to the player (drinking, searching, reading). */
function FeedbackIcons({ feedback }: { feedback: StreetObjectId | null }) {
  return <>
    {feedback === "vending" && <g data-drinking-feedback transform="translate(14 -10)"><path d="M-3 -4h7l-1 9h-5Z" fill="var(--town-paper)" stroke="var(--town-ink)"/><path d="M0 -4v-5l3-2" stroke="var(--town-ink)" fill="none"/></g>}
    {feedback === "bin" && <text data-search-feedback x="15" y="-25" fontSize="15" fill="var(--town-ink)">?</text>}
    {feedback === "newspaper" && <g data-reading-feedback transform="translate(0 7)"><rect x="-8" y="-4" width="16" height="11" fill="var(--town-paper)" stroke="var(--town-ink)"/><path d="M0 -3v9m-6-7h4m4 0h4m-12 4h4m4 0h4" stroke="var(--town-ink)" strokeWidth=".7"/></g>}
  </>;
}

export function TownMap({ movementMode = "joystick", hour, house, speed = 1, skating = false, karma = 0, onEnter, active, encounter, onEncounter, kidPresent = true, onKid, state, paused = false, onStreet, onStreetIncident, onDrive, onHotwire, onWreckRepair }: { movementMode?: "joystick" | "tap"; hour: number; house: number; speed?: number; skating?: boolean; karma?: number; onEnter: (id: string) => void; active: string | null; encounter?: EncounterSpot | null; onEncounter?: () => void; kidPresent?: boolean; onKid?: () => void; state?: GameState; paused?: boolean; onStreet?: (id: StreetObjectId) => boolean; onStreetIncident?: ((id: ResidentId) => void) | undefined; onDrive?: (destination: "home" | "work") => void; onHotwire?: () => boolean; onWreckRepair?: () => boolean }) {
  const reducedMotion = useMemo(() => typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const castleOwned = Boolean((state?.ownedHomes ?? 0) & (1 << 4)) || house >= 4;
  const townHallReady = isTownHallBuilt({ day: state?.day ?? 1 });
  const yardRelocated = townHallReady;
  const bs = useMemo(() => buildings(house, castleOwned, yardRelocated), [house, castleOwned, yardRelocated]);
  const solids = useMemo(() => townSolids(bs), [bs]);
  const { use3d } = useTown3d();
  const townState = useMemo(() => state ?? {...START, hour, house, karma}, [state,hour,house,karma]);
  const positions = useRef<ResidentPositions>({});
  const seatedUntil = useRef(0);
  const streetFeedback = useRef<{id:StreetObjectId;until:number}|null>(null);
  const streetRef = useRef(onStreet); streetRef.current = onStreet;
  const encounterRef = useRef({encounter,onEncounter}); encounterRef.current = {encounter,onEncounter};
  const pausedRef = useRef(paused); pausedRef.current = paused;
  const [nearStreet, setNearStreet] = useState<StreetObjectId | null>(null);
  const [inspectAbandonedCar, setInspectAbandonedCar] = useState(false);
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
  const worldRef = useRef<SVGGElement>(null);
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
  const [driving,setDriving]=useState(false);
  const [vehicle,setVehicle]=useState<"company"|"wreck"|null>(null);
  const vehicleRef=useRef<"company"|"wreck"|null>(null);
  const wreckPosition=useRef({x:5.8,y:11.1,angle:90});
  const drivingRef=useRef(false);
  const carSpeed=useRef(0);
  // Shared with the 3D car, so interaction tests the actual parking position.
  const carPosition=useRef({x:30.1,y:22.1,angle:180});
  const toggleDriving = () => {
    if(!state?.companyCar || !state.drivingLicence || paused || active || (drivingRef.current && vehicleRef.current!=="company"))return;
    const m=me.current;
    if(!drivingRef.current && Math.hypot(m.x-carPosition.current.x,m.y-carPosition.current.y)>2.2)return;
    if (!drivingRef.current) {
      m.x=carPosition.current.x; m.y=carPosition.current.y;
      m.skateAngle=carPosition.current.angle;
    } else {
      carPosition.current={x:m.x,y:m.y,angle:m.skateAngle};
    }
    drivingRef.current=!drivingRef.current;
    vehicleRef.current=drivingRef.current?"company":null;
    setVehicle(vehicleRef.current);
    setDriving(drivingRef.current);
    carSpeed.current=0;
    target.current=null;
  };
  const toggleWreck=()=>{
    if(!state?.abandonedCar || (state.wreckRepairs??0)<3 || !state.drivingLicence || paused || active)return;
    const m=me.current;
    if(drivingRef.current && vehicleRef.current!=="wreck")return;
    if(!drivingRef.current && Math.hypot(m.x-wreckPosition.current.x,m.y-wreckPosition.current.y)>2.2)return;
    if(!drivingRef.current){Object.assign(m,{x:wreckPosition.current.x,y:wreckPosition.current.y,skateAngle:wreckPosition.current.angle});}
    else wreckPosition.current={x:m.x,y:m.y,angle:m.skateAngle};
    drivingRef.current=!drivingRef.current;
    vehicleRef.current=drivingRef.current?"wreck":null;
    setVehicle(vehicleRef.current);setDriving(drivingRef.current);carSpeed.current=0;target.current=null;
  };
  // Initialise only after save hydration, outside the actual owned home rather than
  // a fixed downtown coordinate that can land in later construction footprints.
  const initialHome = bs.find(b => b.id === "home");
  const initialSpawn = initialHome ? nearestWalkable(door(initialHome), solids) : {x:9.95,y:9.0};
  const me = useRef({ x: initialSpawn.x, y: initialSpawn.y, phase: 0, walking: false, skateAngle: 90, turnVelocity: 0, facing: "right" as "left" | "right" | "up" | "down" });
  // The 3D town reads the same live state the SVG uses; it never owns game logic.
  const streetLive = useRef<StreetLive | null>(null);
  const live3d = useMemo<TownLive>(() => ({ me, jump: skateJump, seatedUntil, residents: positions, street: streetLive }), []);
  const target = useRef<{ waypoints: Point[]; enter?: string | undefined } | null>(null);
  const driveSeen = useRef(state?.driveTrip ?? 0);
  useEffect(() => {
    if (!state || !canDrive(state) || (state.driveTrip ?? 0) === driveSeen.current) return;
    driveSeen.current = state.driveTrip ?? 0;
    const id = state.driveDestination === 1 ? "home" :
      state.driveDestination === 2 && state.employed ? (["work","diner","shop","yard"][state.career] ?? "") : "";
    const destination = bs.find(b => b.id === id);
    if (!destination) return;
    Object.assign(me.current, nearestWalkable(door(destination), solids));
    target.current = null;
  }, [state?.driveTrip, state?.driveDestination, state?.career, state?.employed, bs, solids]);

  const routeTo = useCallback((destination: Point, enter?: string) => {
    if (!isWalkable(me.current, solids)) Object.assign(me.current, nearestWalkable(me.current, solids));
    const route = findRoute(me.current, destination, solids);
    if (enter === "kid" && Math.hypot(me.current.x-destination.x,me.current.y-destination.y) < PARK_KID_SPOT.approach) { kidRef.current?.(); return; }
    target.current = route.length ? { waypoints: route, enter } : null;
  }, [solids]);
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
    x < 0.2 || y < 0.2 || x > 35.4 || y > 32.5 || solids.some((b) => x > b.x - 0.15 && x < b.x + b.w + 0.15 && y > b.y - 0.15 && y < b.y + b.d + 0.15);

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
    if (!isWalkable(me.current, solids)) Object.assign(me.current, nearestWalkable(me.current, solids));
    // Keep map animation at 30 FPS on mobile for smoother movement without full 60 FPS scene reconciliation.
    // The browser still schedules RAF normally, but most frames do no React work.
    let last = performance.now(), raf = 0;
    const FRAME_MS = 1000 / 30;
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
        const drivingNow=drivingRef.current;
        const desired=drivingNow ? 5.5 : 1.9 * speed;
        carSpeed.current = drivingNow ? Math.min(desired,carSpeed.current+dt*6.5) : 0;
        const sp = (drivingNow?carSpeed.current:desired)*dt;
        let vx=dx/len,vy=dy/len;
        if(drivingNow){
          const requested=Math.atan2(dx,-dy)*180/Math.PI;
          const delta=((requested-m.skateAngle+540)%360)-180;
          const steer=delta*Math.min(1,dt*5);
          m.skateAngle=(m.skateAngle+steer+360)%360;
          m.turnVelocity=Math.max(-1,Math.min(1,steer/Math.max(dt,.001)/180));
          vx=Math.sin(m.skateAngle*Math.PI/180);
          vy=-Math.cos(m.skateAngle*Math.PI/180);
        }
        const nx = m.x + vx*sp, ny = m.y + vy*sp;
        const collision = (x:number,y:number) => drivingNow
          ? [[-0.24,-0.3],[0.24,-0.3],[-0.24,0.3],[0.24,0.3]].some(([a,b])=>blocked(x+a,y+b))
          : blocked(x,y);
        if (!collision(nx, ny)) { m.x = nx; m.y = ny; }
        else if (!collision(nx, m.y)) m.x = nx;
        else if (!collision(m.x, ny)) m.y = ny;
        else { target.current = null; m.walking = false; carSpeed.current=0; }
        if(drivingNow && vehicleRef.current==="wreck") wreckPosition.current={x:m.x,y:m.y,angle:m.skateAngle};
        if (Math.abs(dx) > Math.abs(dy) * 1.15) m.facing = dx > 0 ? "right" : "left";
        else if (Math.abs(dy) > Math.abs(dx) * 1.15) m.facing = dy > 0 ? "down" : "up";
        const targetAngle = Math.atan2(dx, -dy) * 180 / Math.PI;
        if (skating && !drivingNow) {
          const diff = ((targetAngle - m.skateAngle + 540) % 360) - 180;
          const step = diff * Math.min(1, dt * (drivingNow?5:14));
          m.skateAngle = (m.skateAngle + step + 360) % 360;
          m.turnVelocity = Math.max(-1, Math.min(1, step / Math.max(dt, 0.001) / 180));
        } else if(!drivingNow) {
          m.skateAngle = Math.round(Math.atan2(dx, -dy) / (Math.PI / 4)) * 45;
          m.turnVelocity = 0;
        }
        m.phase += dt * (skating ? 16 : 12);
      }
      if (!m.walking) { m.turnVelocity *= Math.exp(-dt * 12); carSpeed.current=Math.max(0,carSpeed.current-dt*10); }
      const object=STREET_OBJECTS.find(o=>Math.hypot(o.x-m.x,o.y-m.y)<1.15)?.id ?? null;
      if(object!==nearStreetRef.current){nearStreetRef.current=object;setNearStreet(object);}
      const n = bs.find((b) => { const dd = door(b); return Math.hypot(dd.x - m.x, dd.y - m.y) < 1; }) ?? null;
      if (n?.id !== nearRef.current?.id) { nearRef.current = n; setNear(n); }
      setT(now / 1000);
    };
    raf = requestAnimationFrame(loop);
    return () => { cancelAnimationFrame(raf); window.removeEventListener("keydown", down); window.removeEventListener("keyup", up); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [house, speed, hour, skating]);

  const toTile = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const matrix = (worldRef.current ?? svg).getScreenCTM();
    if (!matrix) return null;
    const p = pt.matrixTransform(matrix.inverse());
    return { x: p.x / TW, y: p.y / TH };
  };

  const onGroundPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    if (e.pointerType !== "touch" && e.pointerType !== "pen") return;
    if (joystick.current) return;
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

  const tile = (x: number, y: number, w: number, d: number, fill: string, k: string) => (
    <polygon key={k} points={pts([P(x, y), P(x + w, y), P(x + w, y + d), P(x, y + d)])} fill={fill} />
  );
  const constructionActive = townAtmosphere(hour).constructionActive;
  const ground = useMemo(() => <>
        {!use3d && <>
        {/* Plot-led map: green blocks first, with pavements sized to actual roads and doors. */}
        {tile(0,0,N,N,"var(--town-grass)","grass")}
        {tile(0,29.6,N,0.65,"#b5b6a4","promenade")}
        {tile(0,30.25,N,2.6,"#ecd49f","coastal-sand")}
        {tile(0,32.85,N,0.8,"#8ecfd0","shoreline")}
        {tile(0,33.65,N,2.35,"#397fa4","sea")}
        {/* Plots intermix naturally; there are no imposed rectangular districts. */}
        {tile(0,0,8.8,7.2,"var(--town-lawn)","quiet-green")}
        {tile(17,0.9,5.0,5.9,"var(--town-park-lawn)","park-green")}
        {/* Road shoulders do not extend across entire neighbourhoods. */}
        {ROADS.map((r,i) => tile(Math.max(0,r.x-.58),Math.max(0,r.y-.58),
          Math.min(N,r.x+r.w+.58)-Math.max(0,r.x-.58),
          Math.min(N,r.y+r.d+.58)-Math.max(0,r.y-.58),
          "var(--town-pavement)","kerb-"+i))}
        {/* Individual lawns and building setbacks, rather than continuous square paving. */}
        {bs.map(b => {
          const plot=buildingPlot(b);
          return tile(plot.x,plot.y,plot.w,plot.d,
            b.id==="casino" || b.id==="alley"?"var(--town-backlot)":"var(--town-garden)","lot-"+b.id);
        })}
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
        {tile(17,1.1,5.0,5.6,"var(--town-park)","park")}
        {/* Shared skate-and-basketball recreation corner behind Stick U. */}
        {tile(20.05,1.25,1.85,2.5,"#667d76","basketball-court")}
        {tile(20.14,1.36,1.67,0.045,"#f6edcc","basketball-baseline")}
        {tile(20.14,3.52,1.67,0.045,"#f6edcc","basketball-endline")}
        {tile(20.14,1.36,0.045,2.20,"#f6edcc","basketball-side-left")}
        {tile(21.77,1.36,0.045,2.20,"#f6edcc","basketball-side-right")}
        <circle cx={P(21.25,2.2)[0]} cy={P(21.25,2.2)[1]} r={12} fill="none" stroke="#f4ddad" strokeWidth={2}/>
        <g data-park-basketball pointerEvents="none">
          <polygon points={pts([P(21.07,1.46),P(21.45,1.46),P(21.45,1.53),P(21.07,1.53)])} fill="#ede8da" stroke="#31353e" strokeWidth={1.5}/>
          <ellipse cx={P(21.25,1.74)[0]} cy={P(21.25,1.74)[1]} rx={8} ry={4} fill="none" stroke="#d65e35" strokeWidth={2}/>
        </g>
        {tile(18.28,2.28,1.2,0.8,"#777c82","skate-ramp-base")}
        {tile(18.35,2.32,1.06,0.56,"#9da4aa","skate-ramp-top")}

        <ellipse cx={P(20.3,4.4)[0]} cy={P(20.3,4.4)[1]} rx={38} ry={23} fill="var(--town-pond)" stroke="var(--town-pond-edge)" strokeWidth={3} />
        {tile(19.6,1.2,0.45,5.2,"var(--town-park-path)","park-path-ns")}
        {tile(17,5.5,5.0,0.4,"var(--town-park-path)","park-path-ew")}
        {/* Roads are finite streets with deliberate ends and T-junctions. */}
        {ROADS.map((r,i)=>tile(r.x,r.y,r.w,r.d,"var(--town-asphalt)","road-"+i))}
        {/* Dashed lane paint stops at junctions in both renderers. */}
        {laneDashes().map((dash,i)=>tile(dash.x,dash.y,dash.w,dash.d,"var(--town-lane-paint)","line-"+i))}
        </>}
        {/* Visible grind targets, positioned using existing map projection. */}
        {!use3d && TOWN_RAILS.map(rail => {
          const [ax, ay] = P(rail.a.x, rail.a.y);
          const [bx, by] = P(rail.b.x, rail.b.y);
          return <g key={"grind-"+rail.id} data-town-rail={rail.id} pointerEvents="none">
            <path d={`M${ax} ${ay} L${bx} ${by}`} stroke="#2b2c31" strokeWidth={5} strokeLinecap="round"/>
            <path d={`M${ax} ${ay-2} L${bx} ${by-2}`} stroke="#bbc2c7" strokeWidth={2} strokeLinecap="round"/>
          </g>;
        })}
        {!use3d && <>
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
        </>}
        {!townHallReady && <Site ghost={use3d} active={constructionActive} onForeman={() => {const yard=bs.find(b=>b.id==="yard");if(yard)routeTo(door(yard), "yard");}} />}
        {yardRelocated && !use3d && <g transform={`translate(${19.1*48} ${12.3*36}) scale(0.7)`}><Site active={constructionActive} onForeman={() => {const yard=bs.find(b=>b.id==="yard");if(yard)routeTo(door(yard), "yard");}} /></g>}
        {/* Rough patch by the starter home where the gang now hang out. */}
        {!use3d && tile(5.2, 3.6, 2.0, 1.8, "var(--town-grime)", "gang-patch")}
        {!use3d && <>
        <polygon points={pts([P(0, N), P(N, N), P(N, N, -22), P(0, N, -22)])} fill="var(--town-earth-front)" stroke="var(--town-ink)" />
        <polygon points={pts([P(N, 0), P(N, N), P(N, N, -22), P(N, 0, -22)])} fill="var(--town-earth-side)" stroke="var(--town-ink)" />
        </>}
  </>, [bs, constructionActive, routeTo, use3d]);
  const head = karmaHeadColor(karma);
  const night = hour >= 19 || hour < 6;
  const dusk = hour >= 17 && hour < 19;
  const m = me.current;
  const playerOffset = playerCameraOffset(m.x, m.y, skating);

  // depth-sorted drawables
  const items: { key: number; el: React.ReactNode }[] = [];
  bs.forEach((b) => items.push({ key: (b.y + b.d) * 100 + b.x, el: (
    <g key={b.id} data-world-interactive role="button" tabIndex={0} aria-label={`Enter ${b.label}`} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();if(!b.id.startsWith("residence-"))routeTo(door(b),b.id);}}} onClick={(e) => { e.stopPropagation(); if (!b.id.startsWith("residence-")) routeTo(door(b), b.id); }} className="cursor-pointer" opacity={active === b.id ? 1 : 0.97}>
      {use3d ? <polygon points={buildingHull3d(b, house).map((p) => p.join(",")).join(" ")} fill="transparent" data-building-hit={b.id} /> : <Exterior b={b} night={townAtmosphere(hour).lit} />}
    </g>) }));
  // In 3D mode trees and lamps are part of the Three.js world.
  if (!use3d) {
    TREES.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Tree key={`t${i}`} x={x} y={y} /> }));
    LAMPS.forEach(([x, y], i) => items.push({ key: y * 100 + x, el: <Lamp key={`l${i}`} x={x} y={y} night={night || dusk} /> }));
  }
  const c1 = ((t * 2.2) % 8), c2 = 11 + ((t * 1.7) % 12), c3 = ((t * 1.9 + 7) % 34) - 2;
  if (!use3d) {
  if (yardRelocated && state?.companyCar) items.push({key: carPosition.current.y*100+carPosition.current.x, el:<g key="company-car" data-company-car><title>Your company car</title><Car x={carPosition.current.x} y={carPosition.current.y} dir={Math.abs(Math.sin(m.skateAngle*Math.PI/180))>0.7?"x":"y"} color="#788574" /></g>});
  items.push({ key: 8.5 * 100 + c1, el: <Car key="c1" x={c1} y={8.5} dir="x" color="var(--town-car-red)" /> });
  items.push({ key: 13.3 * 100 + c2, el: <Car key="c2" x={c2} y={13.3} dir="x" color="var(--town-car-blue)" /> });
  items.push({ key: c3 * 100 + 10, el: <Car key="c3" x={10} y={c3} dir="y" color="var(--town-car-yellow)" /> });
  // This is an abandoned vehicle, distinct from the Site Lead company car.
  items.push({ key: wreckPosition.current.y * 100 + wreckPosition.current.x, el: <g key="abandoned-car" data-abandoned-car>
    <title>Rusty abandoned car — its engine has not run in years.</title>
    <Car x={wreckPosition.current.x} y={wreckPosition.current.y} dir="x" color={(state?.wreckRepairs??0)>=3?"#677b89":"#74695e"}/>
    <g transform={`translate(${P(5.8,11.1)[0]} ${P(8.4,9.25)[1]-17})`}>
      <path d="M-17 1l9 -6m5 3l8 7m6 -10l5 5" stroke="#493e39" strokeWidth="2.5" strokeLinecap="round"/>
    </g>
  </g> });
  }
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
          {!use3d && <>
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
          </>}
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
          {!use3d && <>
          <path d="M-24 -8h48M-24 -2h48" stroke="#806249" strokeWidth="5" strokeLinecap="round"/>
          <path d="M-20 -2v12M20 -2v12" stroke="#4d403a" strokeWidth="3"/>
          <g data-kid-sitting><OverheadPerson head="#dbb38b" outline="#292633" pose="sitting"/></g>
          </>}
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
        {!use3d && <OverheadPerson head="#f3d7b8" outline="#3c3043" phase={t} moving={e.pose==="pacing"} pose={e.pose==="sitting"?"sitting":"standing"}/>}
        <g transform={`translate(0 ${-36+Math.sin(t*3)*2})`}>
          <rect x="-19" y="-24" width="38" height="29" rx="12" fill="#fff2d4" stroke="#24202b" strokeWidth="3"/>
          <text textAnchor="middle" y="-4" fontSize="18" fontWeight="bold" fill="#25202b">{e.icon}</text>
          <path d="M-3 4L0 12L6 4" fill="#fff2d4" stroke="#24202b" strokeWidth="2"/>
        </g>
        <rect x="-22" y="-62" width="44" height="78" fill="transparent" />
      </g>
    </g>});
  }
  const feedbackNow = streetFeedback.current && t<streetFeedback.current.until ? streetFeedback.current.id : null;
  if (use3d) items.push({ key: m.y * 100 + m.x, el: <g key="me" transform={`translate(${P(m.x, m.y).join(",")})`} pointerEvents="none" data-player-feedback><FeedbackIcons feedback={feedbackNow} /></g> });
  else if (!driving) items.push({ key: m.y * 100 + m.x, el: <Stick key="me" x={m.x} y={m.y} phase={streetFeedback.current && t<streetFeedback.current.until ? (reducedMotion ? 0 : t*8) : m.phase} feedback={streetFeedback.current && t<streetFeedback.current.until ? streetFeedback.current.id : null} walking={m.walking} skating={skating} jump={skateJump.current} facing={m.facing} skateAngle={m.skateAngle} turnVelocity={m.turnVelocity} pose={t<seatedUntil.current ? "sitting" : "standing"} head={head} /> });
  items.sort((a, b) => a.key - b.key);


  return (
    <div data-town-paused={paused} data-town-renderer={use3d ? "3d" : "classic"} className={"absolute inset-0 overflow-hidden " + (night ? "town-night" : dusk ? "town-dusk" : "town-day")} style={use3d ? { background: townSky(hour) } : undefined}>
      {/* Interior scenes use their own WebGL canvas. Release the town context while
          an interior is open; remount a fresh renderer on return to avoid mobile
          WebGL contexts that resume with a permanently blank frame. Game state,
          movement and the SVG interaction overlay remain mounted. */}
      {use3d && !active && <Suspense fallback={null}><TownWorld3D live={live3d} tick={t} house={house} hour={hour} skating={skating} head={head} kidPresent={kidPresent} encounter={encounter} constructionActive={constructionActive} townHallBuilt={townHallReady} mansionOwned={Boolean((state?.ownedHomes ?? ((1 << (house + 1)) - 1)) & (1 << 3))} castleOwned={castleOwned} yardRelocated={yardRelocated} companyCar={Boolean(state?.companyCar)} driving={vehicle==="company"} carPosition={carPosition} wreckOwned={Boolean(state?.abandonedCar)} wreckPosition={wreckPosition} wreckDriving={vehicle==="wreck"} /></Suspense>}
      <svg ref={svgRef} viewBox="0 0 330 550" preserveAspectRatio="xMidYMid slice" className="relative block h-full w-full touch-none select-none font-hand"
        onPointerDownCapture={e=>{if(!pausedRef.current && movementMode === "joystick")onGroundPointerDown(e);}}
        onClickCapture={(e) => {
          if (performance.now() < suppressGroundClickUntil.current) {
            suppressGroundClickUntil.current = 0;
            e.preventDefault();
            e.stopPropagation();
          }
        }}
        onClick={(e) => {
          if (e.nativeEvent.detail !== 0 && (e.nativeEvent as PointerEvent).pointerType === "touch") return; const p = toTile(e); if (!p) return; const wanted = { x: Math.max(0.5, Math.min(N - 1, p.x)), y: Math.max(0.5, Math.min(N - 1, p.y)) }; routeTo(nearestWalkable(wanted, solids)); }}>
        <g ref={worldRef} transform={`translate(${playerOffset[0]} ${playerOffset[1]})`}>
        {ground}
        {target.current && !target.current.enter && (() => { const end = target.current.waypoints.at(-1); if (!end) return null; const [x, y] = P(end.x, end.y); return <ellipse cx={x} cy={y} rx={12} ry={6} fill="none" stroke="var(--town-paper)" strokeWidth={2} />; })()}
        {items.map((i) => i.el)}
        <StreetLife player={me} positions={positions} lots={solids} state={townState} skating={skating} paused={paused} onResident={selectResident} onObject={selectObject} onIncident={onStreetIncident} feedback={feedbackNow} ghost={use3d} live={streetLive} steamAt={use3d ? screenOf(DINER_CHIMNEY.x, DINER_CHIMNEY.y, DINER_CHIMNEY.z) : undefined} />
        {!use3d && (night || dusk) && <rect x={-2000} y={-2000} width={4000} height={4000} fill={night ? "var(--town-night-wash)" : "var(--town-dusk-wash)"} opacity={night ? 0.22 : 0.1} pointerEvents="none" />}
        </g>
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
      {!active && !paused && Math.hypot(m.x-wreckPosition.current.x,m.y-wreckPosition.current.y) < 2.2 && (
        <button type="button" data-inspect-abandoned-car onClick={() => setInspectAbandonedCar(true)}
          className="absolute bottom-[13.4rem] right-3 z-20 min-h-11 rounded-lg border-2 border-foreground bg-card/95 px-3 text-xs font-bold shadow-lg">
          🔍 Inspect rusty car
        </button>
      )}
      {inspectAbandonedCar && !active && (
        <div role="dialog" aria-modal="true" aria-label="Rusty abandoned car" className="absolute inset-x-3 bottom-44 z-30 rounded-xl border-2 border-foreground bg-card p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2">
            <strong>Rusty abandoned car</strong>
            <button type="button" aria-label="Close car inspection" className="min-h-10 min-w-10 rounded-md bg-secondary" onClick={() => setInspectAbandonedCar(false)}>✕</button>
          </div>
          <p className="mt-2 text-sm">Years of rust. Flat tyres. The engine hasn't turned over in ages. This isn't the company car the foreman offers at Site Lead.</p>
          {state?.abandonedCar ? <><p className="mt-2 text-sm">{(state.wreckRepairs??0)>=3?"The old wreck is roadworthy. It belongs to you.":"The engine runs, but the old wreck still needs repairs before it can be driven."}</p>{(state.wreckRepairs??0)<3 && <button type="button" className="mt-3 min-h-11 rounded-md bg-secondary px-3 font-bold" onClick={() => { if(onWreckRepair?.())setInspectAbandonedCar(false); }}>Repair the wreck — stage {(state.wreckRepairs??0)+1} of 3</button>}</> : (state?.criminalTrust ?? 0) >= 10 ? <><p className="mt-2 text-xs text-muted-foreground">You remember the crew's advice. The ignition challenge is a fictional luck-and-skill test.</p><button type="button" className="mt-3 min-h-11 rounded-md bg-secondary px-3 font-bold" onClick={() => { onHotwire?.(); setInspectAbandonedCar(false); }}>Try the ignition challenge</button></> : <p className="mt-2 text-xs text-muted-foreground">The car has been dead for years. Maybe someone around town knows more about it.</p>}
        </div>
      )}
      {state?.abandonedCar && (state.wreckRepairs??0)>=3 && state.drivingLicence && !active && !paused && (vehicle==="wreck" || (!driving && Math.hypot(m.x-wreckPosition.current.x,m.y-wreckPosition.current.y)<2.2)) && <button type="button" data-personal-car-interact className="absolute bottom-[17rem] right-3 z-20 min-h-11 rounded-lg border-2 border-foreground bg-card px-3 font-bold shadow-lg" onClick={toggleWreck}>{vehicle==="wreck"?"Park personal car":"🚙 Enter personal car"}</button>}
      {state && canDrive(state) && !active && !paused && (vehicle==="company" || (!driving && Math.hypot(m.x-carPosition.current.x,m.y-carPosition.current.y)<2.2)) && (
        <button type="button" data-company-car-interact className="absolute bottom-[21rem] right-3 z-20 min-h-11 rounded-lg border-2 border-foreground bg-card px-3 font-bold shadow-lg" onClick={toggleDriving}>{vehicle==="company"?"Park and exit":"🚗 Enter company car"}</button>
      )}
      {state && canDrive(state) && driving && !active && !paused && onDrive && (
        <nav aria-label="Car travel shortcuts" className="absolute bottom-[13.4rem] left-3 z-20 flex flex-col gap-1 rounded-lg border-2 border-foreground bg-card/95 p-1.5 text-xs font-bold shadow-lg sm:bottom-44">
          <button type="button" className="min-h-10 rounded-md bg-secondary px-2" onClick={() => onDrive("home")}>🚗 Jump home</button>
          {Boolean(state.employed) && <button type="button" className="min-h-10 rounded-md bg-secondary px-2" onClick={() => onDrive("work")}>🚗 Jump to work</button>}
        </nav>
      )}
      {/* Compact overhead minimap: same world coordinates as navigation, not screen pixels. */}
      <div className="absolute bottom-16 left-3 z-10 w-36 rounded-xl border-2 border-foreground bg-card/95 p-1.5 shadow-lg sm:bottom-3 sm:w-44" aria-label="Town minimap">
        <div className="mb-1 flex items-center justify-between px-1 text-xs font-bold">
          <span>🗺️ Stick Town</span><span className="font-normal text-muted-foreground">Tap to move</span>
        </div>
        <svg viewBox={`0 0 ${N} ${N}`} className="aspect-square w-full rounded-md bg-town-grass" role="img" aria-label="Town map showing roads, residences, beach, sea and player"
          onPointerDown={(e) => {
            e.stopPropagation();
            const bounds = e.currentTarget.getBoundingClientRect();
            routeTo({
              x: Math.max(0.3, Math.min(N - 0.3, (e.clientX - bounds.left) / bounds.width * N)),
              y: Math.max(0.3, Math.min(N - 0.3, (e.clientY - bounds.top) / bounds.height * N)),
            });
          }}>
          <rect x="0" y="29.6" width={N} height="0.65" fill="#b8b6a9" />
          <rect x="0" y="30.25" width={N} height="2.6" fill="#ecd49f" />
          <rect x="0" y="32.85" width={N} height="0.8" fill="#8ecfd0" />
          <rect x="0" y="33.65" width={N} height={N-33.65} fill="#397fa4" />
          <path d="M0 32.95 Q4 32.6 8 32.95 T16 32.95 T24 32.95 T32 32.95" fill="none" stroke="#f7efdf" strokeWidth=".17" />
          <rect x="17" y="1.1" width="5" height="5.6" rx=".35" fill="var(--town-mini-park)" />
          <circle cx="20.3" cy="4.4" r=".85" fill="#75bac3" />
          {ROADS.map((r,i) => <rect key={"mini-road-"+i} x={r.x} y={r.y} width={r.w} height={r.d} fill="var(--town-mini-road)" />)}
          {laneDashes().map((d,i) => <rect key={"mini-lane-"+i} x={d.x} y={d.y} width={d.w} height={d.d} fill="#eed076" opacity=".85" />)}
          <rect x="29.5" y="6.75" width="2.8" height=".9" fill="#a49c88" />
          <circle cx={GANG_SPOT.x} cy={GANG_SPOT.y} r={0.8} fill="#40343d" stroke="#f2d46f" strokeWidth={0.22}><title>Street gang - approach at your own risk</title></circle>
          {bs.map((b) => <rect key={b.id} x={b.x} y={b.y} width={b.w} height={b.d}
            fill={b.id === "home" ? "#efd17b" : b.id.startsWith("residence-") ? "#617f8d" : b.sign} stroke={b.id === "home" ? "#fff6be" : "var(--town-paper)"} strokeWidth={b.id === "home" ? 0.36 : 0.18} rx={0.2}>
            <title>{b.label}</title>
          </rect>)}
          {isTownHallBuilt({day:state?.day??1}) && (
            <g data-minimap-town-hall aria-label="Completed Town Hall">
              <rect x="15.8" y="15.1" width="5.9" height="8.6" rx=".25" fill="#bbb5a6" opacity=".9" />
              <rect x="16.6" y="16.65" width="4.3" height="4.7" rx=".2" fill="#d8c9ab" stroke="#535b63" strokeWidth=".25" />
              <rect x="16.425" y="16.5" width="4.65" height="5" rx=".15" fill="none" stroke="#535b63" strokeWidth=".35" />
              <rect x="17.75" y="21.35" width="2" height="2.05" fill="#a6a095" />
              <rect x="18.4" y="21.35" width=".7" height=".45" fill="#485c63" />
              <path d="M18.75 16.9 l.9 .75 -.9 .75 -.9 -.75 Z" fill="#bdab84" />
              <title>Town Hall — completed on day 30</title>
            </g>
          )}
          <circle cx={m.x} cy={m.y} r={1.03} fill="#ffffff" stroke="#19212a" strokeWidth={0.35} />
          <path d={`M ${m.x} ${m.y-0.67} l-.45 .86 h.9 Z`} transform={`rotate(${m.skateAngle}, ${m.x}, ${m.y})`} fill="#2376b4" />
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
