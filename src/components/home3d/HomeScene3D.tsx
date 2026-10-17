import { StoryContact } from "@/components/crime/StoryContact";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RenderDiagnosticsProbe } from "@/components/RenderDiagnosticsProbe";
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { PlanZone } from "@/lib/home-zones";
import { daylight, fitToView, partitionDrops, vantageFor, visibleSlots, wallScale, type HomePlan, type Rect, type Slot } from "@/lib/home3d/layout";
import { Bed, Bookshelf, Console, Desk, EstateBoard, Kitchen, Mattress, Sofa, Television, Weights } from "./furniture";
import { Floors, Plinth, Wall } from "./parts";
import { StudioDecor } from "./StudioShell";
import { CampStove, CrateDesk, OldCouch, PalletBed, ScrapWeights, SquatDecor, SquatMattress } from "./squat";
import { SuburbanDecor } from "./suburban";
import { Bedsides, BlackjackTable, Figure, MansionDecor, SlotBank } from "./mansion";
import { CastleDecor } from "./castle-interior";
import { BarCounter, BarDecor, DanceFloor, Dartboard } from "./bar";
import { CasinoDecor, DiceTable } from "./casino";
import { GymDecor, PowerRack, Treadmills } from "./gym";
import { TownVenueDecor, TownVenueFixture, hasTownVenue } from "./venues";
import { VenueVisualPolish } from "./venue-visual-polish";
import type { CameraControls, Scene3DProps } from "./types";
import { HomeWalker, type WalkerHandle } from "./HomeWalker";
import { Director, SKIP_EVENT, type Cine, type CineOverlay } from "./scenes/Director";

const FOV = 45;
const FP_FOV = 72;
const FP_PITCH_MIN = -1.35;
const FP_PITCH_MAX = 1.35;
/** Player homes (tiers 0–3) are viewed in first person; venues keep the overhead camera. */
export const isFirstPerson = (_plan: HomePlan) => true;
const EL_MIN = 0.3;
const EL_MAX = 1.38;
const DIST_MIN = 3.4;
/** Match three presses of the existing 0.8× zoom-in control on venue entry. */
export const VENUE_ENTRY_ZOOM = 0.8 ** 3;
/** Equivalent to one tap of the existing Zoom Out button on room entry. */
export const ROOM_ENTRY_ZOOM_OUT = 1.25;
const initialDistance = (plan: HomePlan, full: number) => plan.tier >= 10 && plan.kind !== "bank" ? Math.max(DIST_MIN, full * VENUE_ENTRY_ZOOM) : full;
const DEFAULT_AZ = 0;
const DEFAULT_EL = Math.PI / 2 - 0.015;

type Cam = { az: number; el: number; dist: number; tx: number; tz: number; gaz: number; gel: number; gdist: number; gtx: number; gtz: number; moved: boolean; zone: PlanZone | "all" };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mixHex = (a: string, b: string, t: number) => {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t);
  return `#${c.getHexString()}`;
};

const regionOf = (plan: HomePlan, zone: PlanZone | "all"): Rect => plan.focus[zone] ?? plan.focus.all!;

function Lights({ plan, day }: { plan: HomePlan; day: number }) {
  const L = plan.lights;
  const sun = useRef<THREE.DirectionalLight>(null);
  const cx = plan.size.w / 2;
  const cz = plan.size.d / 2;
  const r = Math.hypot(plan.size.w, plan.size.d) / 2 + 1;
  const k = Math.max(1, r / 5.5);
  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    l.target.position.set(cx, 0, cz);
    l.target.updateMatrixWorld();
  }, [cx, cz]);
  return (
    <>
      <hemisphereLight args={[L.hemi[0], L.hemi[1], L.hemiBase + L.hemiDay * day]} />
      <directionalLight
        ref={sun}
        castShadow
        position={[cx - 3.5 * k, 9 * k, cz - 7 * k]}
        intensity={L.sunBase + L.sunDay * day}
        color={day > 0.9 ? L.sunTint[0] : L.sunTint[1]}
        shadow-mapSize={r > 9 ? [2048, 2048] : [1024, 1024]}
        shadow-camera-left={-r}
        shadow-camera-right={r}
        shadow-camera-top={r}
        shadow-camera-bottom={-r}
        shadow-camera-near={1}
        shadow-camera-far={28 * k}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      {/* each room has its own coloured light, so the spaces read as different places */}
      {L.points.map((l, i) => (
        <pointLight key={i} position={l.p} color={l.colour} intensity={l.day + (l.night - l.day) * (1 - day)} distance={l.distance} decay={l.decay} />
      ))}
    </>
  );
}

function Furniture({ slot, plan, luxury, hasBed }: { slot: Slot; plan: HomePlan; luxury: boolean; hasBed: boolean }) {
  if(slot.id==="crew-contact") {
    const buyer=plan.kind==="bar";
    const coat=buyer?"#68493e":"#485568";
    const cap=buyer?"#302d31":"#4a453b";
    return <group>
      {buyer && <mesh position={[0,0.42,-0.07]}><boxGeometry args={[0.62,0.48,0.45]}/><meshStandardMaterial color="#594537"/></mesh>}
      <mesh position={[0,buyer?1.11:1.53,0]}><sphereGeometry args={[0.225,16,12]}/><meshStandardMaterial color={buyer?"#bc906c":"#99775c"}/></mesh>
      <mesh position={[0,buyer?0.72:1.12,0]}><cylinderGeometry args={[0.30,0.34,0.69,10]}/><meshStandardMaterial color={coat}/></mesh>
      <mesh position={[0,buyer?1.32:1.75,0]}><cylinderGeometry args={[0.235,0.26,0.11,12]}/><meshStandardMaterial color={cap}/></mesh>
      <mesh position={[0,buyer?1.28:1.72,0.15]}><boxGeometry args={[0.34,0.055,0.16]}/><meshStandardMaterial color={cap}/></mesh>
      {buyer ? <>
        <mesh position={[0,0.42,0.48]}><boxGeometry args={[0.9,0.08,0.6]}/><meshStandardMaterial color="#795b42"/></mesh>
        <mesh position={[0.24,0.54,0.46]}><cylinderGeometry args={[0.07,0.07,0.16,8]}/><meshStandardMaterial color="#e3c58d" transparent opacity={0.7}/></mesh>
      </> : <>
        {[-0.14,0.14].map(x=><mesh key={x} position={[x,0.34,0]}><cylinderGeometry args={[0.085,0.09,0.67,8]}/><meshStandardMaterial color="#303743"/></mesh>)}
      </>}
    </group>;
  }
  if (hasTownVenue(plan.kind)) return <TownVenueFixture kind={plan.kind} id={slot.id} />;
  const scrap = plan.kind === "squat" && !luxury;
  switch (slot.id) {
    case "bed":
      if (!hasBed) return scrap ? <SquatMattress /> : <Mattress />;
      return scrap ? <PalletBed /> : (
        <>
          <Bed lux={luxury} />
          {plan.tier >= 2 && <Bedsides lux={luxury} />}
        </>
      );
    case "sofa":
      return scrap ? <OldCouch /> : <Sofa lux={luxury} />;
    case "kitchen":
      return scrap ? <CampStove /> : <Kitchen lux={luxury} />;
    case "tv":
      return <Television lux={luxury} />;
    case "console":
      return <Console lux={luxury} />;
    case "bookshelf":
      return <Bookshelf lux={luxury} />;
    case "weights":
      return scrap ? <ScrapWeights /> : <Weights lux={luxury} />;
    case "desk":
      return scrap ? <CrateDesk /> : <Desk lux={luxury} />;
    case "estate":
      return <EstateBoard />;
    case "blackjack":
      return <BlackjackTable />;
    case "slots":
      return <SlotBank />;
    case "high-dice":
      return <DiceTable />;
    case "bar-counter":
      return <BarCounter />;
    case "dance-floor":
      return <DanceFloor />;
    case "dartboard":
      return <Dartboard />;
    case "rack":
      return <PowerRack />;
    case "track":
      return <Treadmills />;
    default:
      return null;
  }
}

function Decor({ plan, owned }: { plan: HomePlan; owned: ReadonlySet<string> }) {
  if (hasTownVenue(plan.kind)) return <TownVenueDecor kind={plan.kind} />;
  switch (plan.kind) {
    case "squat":
      return <SquatDecor owned={owned} />;
    case "suburban":
      return <SuburbanDecor owned={owned} />;
    case "castle":
      return <CastleDecor owned={owned} />;
    case "mansion":
      return <MansionDecor owned={owned} />;
    case "casino":
      return <><CasinoDecor /><VenueVisualPolish venue="casino"/></>;
    case "bar":
      return <><BarDecor /><VenueVisualPolish venue="bar"/></>;
    case "gym":
      return <><GymDecor /><VenueVisualPolish venue="gym"/></>;
    default:
      return plan.kind === "studio" ? <StudioDecor /> : null;
  }
}

type Shared = {
  controls: MutableRefObject<CameraControls | null>;
  labelEls: MutableRefObject<Map<string, HTMLElement>>;
  walls: MutableRefObject<Map<string, THREE.Group>>;
  hover: MutableRefObject<string | null>;
  dragged: MutableRefObject<number>;
  walker: MutableRefObject<WalkerHandle>;
  cine: MutableRefObject<Cine>;
  overlay: MutableRefObject<CineOverlay>;
  cast: MutableRefObject<Map<string, THREE.Group>>;
};

function Rig({ plan, slots, zone, shared }: { plan: HomePlan; slots: Slot[]; zone: PlanZone; shared: Shared }) {
  const { camera, gl, size, invalidate } = useThree();
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true, []);
  const aspect = size.width / Math.max(1, size.height);
  const cam = useRef<Cam | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const nearbyRef = useRef<string | null>(null);
  const fp = isFirstPerson(plan);
  const fpRef = useRef({ yaw: 0, gyaw: 0, pitch: -0.075, gpitch: -0.075 });
  // Each axis can be inverted independently; defaults match conventional
  // drag-to-look input, with horizontal reversed from the old implementation.
  const swipeAxes = useRef({ horizontal: 1, vertical: 1 });
  useEffect(() => {
    const read = () => {
      try {
        swipeAxes.current.horizontal = window.localStorage.getItem("sticktown-look-horizontal") === "inverted" ? -1 : 1;
        swipeAxes.current.vertical = window.localStorage.getItem("sticktown-look-vertical") === "inverted" ? -1 : 1;
      } catch { /* Keep usable default controls without storage. */ }
    };
    read();
    window.addEventListener("tst:look-controls-changed", read);
    return () => window.removeEventListener("tst:look-controls-changed", read);
  }, []);
  const firstView = vantageFor(plan, zone);
  const fpEye = useRef(new THREE.Vector3(...firstView.eye));
  const fpTargetEye = useRef(new THREE.Vector3(...firstView.eye));
  const firstYaw = Math.atan2(firstView.eye[0] - firstView.lookAt[0], firstView.eye[2] - firstView.lookAt[2]);
  const fpHeading = useRef(firstYaw);
  const fpTargetHeading = useRef(firstYaw);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const goalFor = useCallback(
    (z: PlanZone | "all") => {
      const r = regionOf(plan, z);
      const az = cam.current?.gaz ?? DEFAULT_AZ;
      return { tx: (r.x0 + r.x1) / 2, tz: (r.z0 + r.z1) / 2, dist: Math.max(DIST_MIN, initialDistance(plan, fitToView(r.x1 - r.x0, r.z1 - r.z0, plan.size.h, az, DEFAULT_EL, aspect, FOV)) * ROOM_ENTRY_ZOOM_OUT) };
    },
    [aspect, plan],
  );
  const maxDist = useCallback(() => fitToView(plan.size.w, plan.size.d, plan.size.h, DEFAULT_AZ, DEFAULT_EL, aspect, FOV, 1.5), [aspect, plan]);

  if (!cam.current) {
    const g = goalFor("all");
    const [startX, startZ] = plan.spawn.entry;
    cam.current = { az: DEFAULT_AZ, el: DEFAULT_EL, dist: g.dist, tx: startX, tz: startZ, gaz: DEFAULT_AZ, gel: DEFAULT_EL, gdist: g.dist, gtx: startX, gtz: startZ, moved: false, zone: "all" };
  }

  const limit = useCallback(() => {
    const c = cam.current!;
    c.gel = clamp(c.gel, EL_MIN, EL_MAX);
    c.gdist = clamp(c.gdist, DIST_MIN, maxDist());
    c.gtx = clamp(c.gtx, 0, plan.size.w);
    c.gtz = clamp(c.gtz, 0, plan.size.d);
  }, [maxDist, plan]);

  // Public handle used by the on-screen buttons and by tests.
  useEffect(() => {
    const c = cam.current!;
    const focus = (z: PlanZone | "all") => {
      const g = goalFor(z);
      if (fp && z !== "all") {
        const v = vantageFor(plan, z);
        fpTargetHeading.current = Math.atan2(v.eye[0] - v.lookAt[0], v.eye[2] - v.lookAt[2]);
        fpTargetEye.current.set(...v.eye);
        fpRef.current.yaw = 0;
        fpRef.current.gyaw = 0;
        fpRef.current.gpitch = -0.075;
        fpRef.current.pitch = -0.075;

      }
      c.gtx = z === "all" ? shared.walker.current.position.x : g.tx;
      c.gtz = z === "all" ? shared.walker.current.position.z : g.tz;
      c.gdist = g.dist;
      c.gel = DEFAULT_EL;
      c.zone = z;
      c.moved = false;
      invalidate();
    };
    shared.controls.current = {
      reset: () => {
        c.gaz = DEFAULT_AZ;
        fpRef.current.gyaw = 0;
        focus(zone);
      },
      zoom: (f) => {
        c.gdist *= f;
        c.moved = true;
        limit();
        invalidate();
      },
      rotate: () => { /* Locked overhead perspective. */ },
      tilt: () => { /* Locked overhead perspective. */ },
      focus,
      read: () => ({ az: c.gaz, el: c.gel, dist: c.gdist, tx: c.gtx, tz: c.gtz }),
    };
  }, [goalFor, invalidate, limit, shared.controls, fp, plan]);

  // Room button => fly to that room.
  useEffect(() => {
    shared.controls.current?.focus(zone);
  }, [zone, shared.controls]);

  // Re-fit on resize until the player takes the camera themselves.
  useEffect(() => {
    const c = cam.current!;
    if (c.moved) return;
    const g = goalFor(c.zone);
    c.gdist = g.dist;
    if (!reduce && c.dist === 0) c.dist = g.dist;
    invalidate();
  }, [aspect, goalFor, invalidate, reduce]);

  // Free-look: unlimited 360° yaw, bounded vertical pitch. Capture one
  // pointer only, so other fingers and the joystick remain independent.
  useEffect(() => {
    if (!fp) return;
    const el = gl.domElement;
    let pointer: number | null = null;
    let lastX = 0, lastY = 0;
    const down = (e: PointerEvent) => {
      if (pointer !== null || !e.isPrimary) return;
      pointer = e.pointerId;
      lastX = e.clientX; lastY = e.clientY;
      shared.dragged.current = 0;
    };
    const move = (e: PointerEvent) => {
      if (pointer !== e.pointerId) return;
      const dx = e.clientX-lastX, dy = e.clientY-lastY;
      lastX = e.clientX; lastY = e.clientY;
      shared.dragged.current += Math.abs(dx)+Math.abs(dy);
      const f = fpRef.current;
      f.gyaw -= dx * 0.006 * swipeAxes.current.horizontal;
      f.gpitch = clamp(f.gpitch - dy * 0.005 * swipeAxes.current.vertical, FP_PITCH_MIN, FP_PITCH_MAX);
      invalidate();
    };
    const up = (e: PointerEvent) => { if (pointer === e.pointerId) pointer = null; };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
    };
  }, [fp, gl, invalidate, shared.dragged]);

  // Camera remains bird's-eye. One-finger gestures walk the player; pinch/wheel only zoom.
  useEffect(() => {
    if (fp) return;
    const el=gl.domElement;
    const pts=new Map<number,{x:number;y:number}>();
    let spread=0;
    const distance=()=>{const a=[...pts.values()];return a.length<2?0:Math.hypot(a[0]!.x-a[1]!.x,a[0]!.y-a[1]!.y);};
    const down=(e:PointerEvent)=>{pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===2)spread=distance();};
    const move=(e:PointerEvent)=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size>=2){const d=distance();if(d>0&&spread>0){cam.current!.gdist*=spread/d;limit();invalidate();}spread=d;}};
    const up=(e:PointerEvent)=>{pts.delete(e.pointerId);spread=distance();};
    const wheel=(e:WheelEvent)=>{e.preventDefault();cam.current!.gdist*=Math.exp(e.deltaY*0.0012);limit();invalidate();};
    el.addEventListener("pointerdown",down);el.addEventListener("pointermove",move);el.addEventListener("pointerup",up);el.addEventListener("pointercancel",up);el.addEventListener("wheel",wheel,{passive:false});
    return()=>{el.removeEventListener("pointerdown",down);el.removeEventListener("pointermove",move);el.removeEventListener("pointerup",up);el.removeEventListener("pointercancel",up);el.removeEventListener("wheel",wheel);};
  },[gl,limit,invalidate,fp]);

  // Where the camera was before a cutscene took it, so it can glide back afterwards.
  const saved = useRef<{ tx: number; tz: number; dist: number } | null>(null);
  // While filming from a lower angle, slice the room like a dollhouse so ceiling lights and wall tops never block the shot.
  const cutaway = useMemo(() => [new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.25)], []);
  useFrame((state, dtRaw) => {
    const c = cam.current!;
    const cine = shared.cine.current;
    if (cine.active && !saved.current) saved.current = { tx: c.gtx, tz: c.gtz, dist: c.gdist };
    if (cine.active) { c.gtx = cine.tx; c.gtz = cine.tz; c.gdist = cine.dist; }
    else if (saved.current) { c.gtx = saved.current.tx; c.gtz = saved.current.tz; c.gdist = saved.current.dist; saved.current = null; }
    if (shared.walker.current.moving) { c.gtx = shared.walker.current.position.x; c.gtz = shared.walker.current.position.z; }
    const dt = Math.min(0.05, dtRaw);
    // Cinematic moves glide; ordinary camera follow stays snappy.
    const filming = cine.active || Math.abs(c.el - DEFAULT_EL) > 0.002;
    const k = reduce ? 1 : 1 - Math.exp(-dt * (filming ? 3.6 : 10));
    c.az = DEFAULT_AZ;
    c.el += ((cine.active ? cine.el : DEFAULT_EL) - c.el) * k;
    if (Math.abs(c.el - DEFAULT_EL) < 0.001) c.el = DEFAULT_EL;
    const slice = c.el < DEFAULT_EL - 0.08;
    if (slice !== (gl.clippingPlanes.length > 0)) gl.clippingPlanes = slice ? cutaway : [];
    c.dist += (c.gdist - c.dist) * k;
    c.tx += (c.gtx - c.tx) * k;
    c.tz += (c.gtz - c.tz) * k;
    const pc = camera as THREE.PerspectiveCamera;
    if (fp && !cine.active) {
      // The walker is the eye-level camera anchor. Room tabs relocate it to
      // their plan-defined safe zone; the camera glides between viewpoints.
      const f=fpRef.current;
      f.yaw+=(f.gyaw-f.yaw)*(reduce?1:1-Math.exp(-dt*12));
      f.pitch+=(f.gpitch-f.pitch)*(reduce?1:1-Math.exp(-dt*12));
      const blend=reduce?1:1-Math.exp(-dt*6);
      const angleError=Math.atan2(Math.sin(fpTargetHeading.current-fpHeading.current),Math.cos(fpTargetHeading.current-fpHeading.current));
      fpHeading.current+=angleError*blend;
      fpEye.current.lerp(fpTargetEye.current,blend);
      const heading=fpHeading.current+f.yaw;

      if(pc.fov!==FP_FOV){pc.fov=FP_FOV;pc.updateProjectionMatrix();}
      camera.position.copy(fpEye.current);
      camera.lookAt(fpEye.current.x-Math.sin(heading)*Math.cos(f.pitch)*4,fpEye.current.y+Math.sin(f.pitch)*4,fpEye.current.z-Math.cos(heading)*Math.cos(f.pitch)*4);
      if(fpEye.current.distanceTo(fpTargetEye.current)>0.004 || Math.abs(angleError)>0.001)invalidate();
            if (Math.abs(f.gyaw - f.yaw) + Math.abs(f.gpitch - f.pitch) > 0.001) invalidate();
    } else {
      if (pc.fov !== FOV) { pc.fov = FOV; pc.updateProjectionMatrix(); }
      const ce = Math.cos(c.el);
      camera.position.set(c.tx + c.dist * ce * Math.sin(c.az), c.dist * Math.sin(c.el), c.tz + c.dist * ce * Math.cos(c.az));
      camera.lookAt(c.tx, 0.45 * (1 - (c.el - EL_MIN) / (DEFAULT_EL - EL_MIN)), c.tz);
    }
    camera.updateMatrixWorld();
    let busy = Math.abs((cine.active ? cine.el : DEFAULT_EL) - c.el) + Math.abs(c.gaz - c.az) + Math.abs(c.gdist - c.dist) * 0.2 + Math.abs(c.gtx - c.tx) + Math.abs(c.gtz - c.tz) > 0.0015;

    // Cut away whichever exterior walls face the camera, so the view is never blocked.
    const off = { x: camera.position.x - plan.size.w / 2, z: camera.position.z - plan.size.d / 2 };
    for (const spec of plan.walls) {
      const g = shared.walls.current.get(spec.id);
      if (!g) continue;
      const target = fp && !cine.active ? 1 : Math.min(wallScale(spec, off), partitionDrops(spec, camera.position) ? 0.06 : 1);
      const next = reduce ? target : g.scale.y + (target - g.scale.y) * k;
      if (Math.abs(next - g.scale.y) > 0.002) busy = true;
      g.scale.y = Math.abs(next - target) < 0.004 ? target : next;
    }

    // Float the tags above their furniture.
    const w = state.size.width;
    const h = state.size.height;
    // First person: label only the object nearest the centre of view.
    let centre: string | null = null;
    if (fp) {
      let best = 0.6;
      for (const s of slotsRef.current) {
        tmp.set(s.x, s.labelY, s.z).project(camera);
        if (tmp.z < 1 && tmp.z > -1 && Math.abs(tmp.x) < best && Math.hypot(s.x-fpEye.current.x,s.z-fpEye.current.z)<Math.max(plan.size.w,plan.size.d)) { best = Math.abs(tmp.x); centre = s.id; }
      }
    }
    for (const s of slotsRef.current) {
      const el = shared.labelEls.current.get(s.id);
      if (!el) continue;
      tmp.set(s.x, s.labelY, s.z).project(camera);
      const visible = tmp.z < 1 && tmp.z > -1;
      const x = (tmp.x * 0.5 + 0.5) * w;
      const y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      // Tags step aside while a cutscene plays.
      const show = visible && !cine.active && !shared.walker.current.scene && (fp ? centre === s.id : shared.walker.current.nearby === s.id);
      el.style.opacity = show ? "1" : "0";
      el.style.visibility = show ? "visible" : "hidden";
      el.style.pointerEvents = show ? "auto" : "none";
    }
    // Low-frequency DOM event only when the nearby actionable object changes.
    // No React re-render is needed on each joystick movement.
    if (nearbyRef.current !== (fp ? centre : shared.walker.current.nearby)) {
      nearbyRef.current = (fp ? centre : shared.walker.current.nearby) ?? null;
      window.dispatchEvent(new CustomEvent("tst:nearby-action", {detail:{id:nearbyRef.current}}));
    }
    if (busy) invalidate();
  });
  return null;
}

function Ring({ slot }: { slot: Slot }) {
  const r = Math.max(slot.w, slot.d) / 2 + 0.12;
  return (
    <mesh position={[slot.x, 0.045, slot.z]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={5}>
      <ringGeometry args={[r, r + 0.07, 48]} />
      <meshBasicMaterial color="#ffd24a" transparent opacity={0.95} depthTest={false} />
    </mesh>
  );
}

function World({ p, shared }: { p: Scene3DProps; shared: Shared }) {
  const { invalidate } = useThree();
  const { plan } = p;
  const slots = useMemo(() => visibleSlots(plan, p.visibleIds), [plan, p.visibleIds]);
  const owned = useMemo(() => new Set(p.visibleIds), [p.visibleIds]);
  const register = useCallback(
    (id: string, g: THREE.Group | null) => {
      if (g) shared.walls.current.set(id, g);
      else shared.walls.current.delete(id);
    },
    [shared.walls],
  );
  useEffect(() => invalidate(), [p.visibleIds, p.luxury, p.hasBed, p.selectedId, p.hour, p.cutscene, invalidate]);
  const sel = p.selectedId ? slots.find((s) => s.id === p.selectedId) : undefined;
  return (
    <>
      <Rig plan={plan} slots={slots} zone={p.zone} shared={shared} />
      <Lights plan={plan} day={daylight(p.hour)} />
      <Plinth plan={plan} />
      <Floors plan={plan} />
      {plan.walls.map((w) => (
        <Wall key={w.id} spec={w} register={register} />
      ))}
      <Decor plan={plan} owned={owned} />
      {p.storyScene && <StoryContact scene={p.storyScene} />}
      {plan.npcs?.filter((n) => !p.storyScene?.replaces.includes(n.id)).map((n) => (
        // Each NPC stands in its own pivot so a cutscene can turn, bob, hop or hide them.
        <group key={n.id} position={[n.x, 0, n.z]} ref={(g) => { if (g) shared.cast.current.set(n.id, g); else shared.cast.current.delete(n.id); }}>
          <Figure npc={{ ...n, x: 0, z: 0 }} />
        </group>
      ))}
      {slots.map((s) => (
        <group
          key={s.id}
          position={[s.x, 0, s.z]}
          rotation={[0, s.rot, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (shared.dragged.current > 6) return;
            if (isFirstPerson(plan)) p.onSelect(s.id);
            else window.dispatchEvent(new CustomEvent("tst-home-walk-to",{detail:{id:s.id}}));
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            shared.hover.current = s.id;
            document.body.style.cursor = "pointer";
            invalidate();
          }}
          onPointerOut={() => {
            if (shared.hover.current === s.id) shared.hover.current = null;
            document.body.style.cursor = "";
            invalidate();
          }}
        >
          <Furniture slot={s} plan={plan} luxury={Boolean(p.luxury[s.id])} hasBed={p.hasBed} />
        </group>
      ))}
      {p.cutscene && <HomeWalker firstPerson={false} showAvatar head={p.playerHead ?? "rgb(255, 244, 214)"} plan={plan} visibleIds={p.visibleIds} handle={shared.walker} onArrive={p.onSelect} held={p.cutscene?.held ?? null} />}
      {p.cutscene && <Director key={p.cutscene.key} cut={p.cutscene} plan={plan} walker={shared.walker} cine={shared.cine} overlay={shared.overlay} cast={shared.cast} onDone={() => p.onCutsceneDone?.()} />}
      {sel && <Ring slot={sel} />}
    </>
  );
}

export type HomeScene3DProps = Scene3DProps & { controls: MutableRefObject<CameraControls | null> };

export default function HomeScene3D(props: HomeScene3DProps) {
  const labelEls = useRef(new Map<string, HTMLElement>());
  const walls = useRef(new Map<string, THREE.Group>());
  const hover = useRef<string | null>(null);
  const dragged = useRef(0);
  const walker = useRef<WalkerHandle>({position:{x:props.plan.spawn.entry[0],z:props.plan.spawn.entry[1]},moving:false});
  const cine = useRef<Cine>({ active: false, tx: 0, tz: 0, dist: 0, el: 0 });
  const overlay = useRef<CineOverlay>({ barTop: null, barBottom: null, title: null, gains: null, tint: null });
  const cast = useRef(new Map<string, THREE.Group>());
  const shared: Shared = useMemo(() => ({ controls: props.controls, labelEls, walls, hover, dragged, walker, cine, overlay, cast }), [props.controls]);
  const cut = props.cutscene ?? null;
  const day = daylight(props.hour);
  const { plan } = props;
  const slots = useMemo(() => visibleSlots(plan, props.visibleIds), [plan, props.visibleIds]);
  const bg = `linear-gradient(180deg, ${mixHex(plan.sky.night[0], plan.sky.day[0], day)} 0%, ${mixHex(plan.sky.night[1], plan.sky.day[1], day)} 100%)`;
  const { onReady } = props;
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bg, touchAction: "none" }} data-home3d={plan.kind} data-daylight={day.toFixed(2)}>
      <Canvas
        shadows="percentage"
        dpr={[1, 1.75]}
        frameloop="demand"
        camera={{ fov: FOV, near: 0.1, far: 80, position: [6, 8, 12] }}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance", preserveDrawingBuffer: true }}
        style={{ touchAction: "none" }}
        onPointerMissed={() => {
          if (shared.dragged.current <= 6) props.onDeselect?.();
        }}
        aria-label={`First-person 3D view of ${plan.name}. Choose a room, swipe to look, and tap objects to interact.`}
      >
        <RenderDiagnosticsProbe scene={plan.name} />
        <World p={props} shared={shared} />
      </Canvas>
      {/* Tags are real buttons, so every object is reachable by keyboard and screen reader too. */}
      <div className="pointer-events-none absolute inset-0">
        {slots.map((s) => (
          <button
            key={s.id}
            type="button"
            ref={(el) => {
              if (el) labelEls.current.set(s.id, el);
              else labelEls.current.delete(s.id);
            }}
            data-home3d-tag={s.id}
            aria-label={`${s.label}. Tap to use`}
            aria-pressed={props.selectedId === s.id}
            onClick={() => isFirstPerson(plan) ? props.onSelect(s.id) : window.dispatchEvent(new CustomEvent("tst-home-walk-to",{detail:{id:s.id}}))}
            className={`pointer-events-auto absolute left-0 top-0 min-h-9 min-w-9 rounded-full border-2 border-foreground px-2.5 text-[11px] font-extrabold tracking-wide shadow-md ${props.selectedId === s.id ? "bg-primary text-primary-foreground" : "bg-card/95 text-foreground"}`}
            style={{ transform: "translate(-9999px,-9999px)" }}
          >
            {s.tag}
          </button>
        ))}
      </div>
      {cut && (
        <div
          key={cut.key}
          className="absolute inset-0"
          data-cutscene={cut.act}
          data-cutscene-action={cut.actionId}
          role="status"
          aria-label={[cut.title, cut.caption, ...cut.gains, ...cut.losses].filter(Boolean).join(". ")}
          onPointerDown={() => window.dispatchEvent(new Event(SKIP_EVENT))}
        >
          <div ref={(el) => { overlay.current.tint = el; }} className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(circle at 50% 45%, #1b2550 0%, #070b1c 80%)", opacity: 0 }} />
          <div ref={(el) => { overlay.current.barTop = el; }} className="pointer-events-none absolute inset-x-0 top-0 bg-[#111014]" style={{ height: 0 }} />
          <div ref={(el) => { overlay.current.barBottom = el; }} className="pointer-events-none absolute inset-x-0 bottom-0 bg-[#111014]" style={{ height: 0 }} />
          <div ref={(el) => { overlay.current.gains = el; }} className="pointer-events-none absolute left-0 top-0 flex flex-col items-center gap-1" style={{ opacity: 0, transform: "translate(-9999px,-9999px)" }}>
            {cut.caption && <span className="whitespace-nowrap rounded-full border-2 border-[#111014] bg-[#ffd24a] px-3 py-0.5 text-[11px] font-black tracking-wider text-[#111014] shadow-md">{cut.caption}</span>}
            {cut.gains.map((g) => (
              <span key={g} className="whitespace-nowrap rounded-full border-2 border-[#111014] bg-card px-2.5 py-0.5 text-sm font-extrabold text-foreground shadow-md">{g}</span>
            ))}
            {cut.losses.map((g) => (
              <span key={g} className="whitespace-nowrap rounded-full border-2 border-[#111014] bg-[#b5413a] px-2.5 py-0.5 text-sm font-extrabold text-[#fff4ea] shadow-md">{g}</span>
            ))}
          </div>
          <div ref={(el) => { overlay.current.title = el; }} className="pointer-events-none absolute inset-x-0 top-[2.4%] px-3 text-center text-xs font-black tracking-[0.22em] text-[#f6efe0] sm:text-base sm:tracking-[0.3em]" style={{ opacity: 0 }}>
            {cut.title}
          </div>
          <button
            type="button"
            className="absolute bottom-[2%] right-3 min-h-9 rounded-full border-2 border-[#f6efe0]/70 bg-black/40 px-3 text-xs font-extrabold tracking-wider text-[#f6efe0]"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => window.dispatchEvent(new Event(SKIP_EVENT))}
          >
            SKIP ▸▸
          </button>
        </div>
      )}
    </div>
  );
}
