import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { PlanZone } from "@/lib/home-zones";
import { daylight, fitToView, partitionDrops, visibleSlots, wallScale, type HomePlan, type Rect, type Slot } from "@/lib/home3d/layout";
import { Bed, Bookshelf, Console, Desk, EstateBoard, Kitchen, Mattress, Sofa, Television, Weights } from "./furniture";
import { Floors, Plinth, Wall } from "./parts";
import { StudioDecor } from "./StudioShell";
import { CampStove, CrateDesk, OldCouch, PalletBed, ScrapWeights, SquatDecor, SquatMattress } from "./squat";
import { SuburbanDecor } from "./suburban";
import { Bedsides, BlackjackTable, Figure, MansionDecor, SlotBank } from "./mansion";
import { BarCounter, BarDecor, DanceFloor, Dartboard } from "./bar";
import { CasinoDecor, DiceTable } from "./casino";
import { GymDecor, PowerRack, Treadmills } from "./gym";
import { PawnCounter, PawnCuriosities, PawnDecor } from "./pawn";
import type { CameraControls, Scene3DProps } from "./types";
import { HomeWalker, type WalkerHandle } from "./HomeWalker";

const FOV = 45;
const EL_MIN = 0.3;
const EL_MAX = 1.38;
const DIST_MIN = 3.4;
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
    case "pawn-counter": return <PawnCounter />;
    case "curiosities": return <PawnCuriosities />;
    case "rack":
      return <PowerRack />;
    case "track":
      return <Treadmills />;
    default:
      return null;
  }
}

function Decor({ plan, owned }: { plan: HomePlan; owned: ReadonlySet<string> }) {
  switch (plan.kind) {
    case "squat":
      return <SquatDecor owned={owned} />;
    case "suburban":
      return <SuburbanDecor owned={owned} />;
    case "mansion":
      return <MansionDecor owned={owned} />;
    case "casino":
      return <CasinoDecor />;
    case "bar":
      return <BarDecor />;
    case "gym":
      return <GymDecor />;
    case "pawn":
      return <PawnDecor />;
    default:
      return <StudioDecor />;
  }
}

type Shared = {
  controls: MutableRefObject<CameraControls | null>;
  labelEls: MutableRefObject<Map<string, HTMLElement>>;
  walls: MutableRefObject<Map<string, THREE.Group>>;
  hover: MutableRefObject<string | null>;
  dragged: MutableRefObject<number>;
  walker: MutableRefObject<WalkerHandle>;
};

function Rig({ plan, slots, zone, shared }: { plan: HomePlan; slots: Slot[]; zone: PlanZone; shared: Shared }) {
  const { camera, gl, size, invalidate } = useThree();
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true, []);
  const aspect = size.width / Math.max(1, size.height);
  const cam = useRef<Cam | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const goalFor = useCallback(
    (z: PlanZone | "all") => {
      const r = regionOf(plan, z);
      const az = cam.current?.gaz ?? DEFAULT_AZ;
      return { tx: (r.x0 + r.x1) / 2, tz: (r.z0 + r.z1) / 2, dist: fitToView(r.x1 - r.x0, r.z1 - r.z0, plan.size.h, az, DEFAULT_EL, aspect, FOV) };
    },
    [aspect, plan],
  );
  const maxDist = useCallback(() => fitToView(plan.size.w, plan.size.d, plan.size.h, DEFAULT_AZ, DEFAULT_EL, aspect, FOV, 1.5), [aspect, plan]);

  if (!cam.current) {
    const g = goalFor("all");
    cam.current = { az: DEFAULT_AZ, el: DEFAULT_EL, dist: g.dist, tx: g.tx, tz: g.tz, gaz: DEFAULT_AZ, gel: DEFAULT_EL, gdist: g.dist, gtx: g.tx, gtz: g.tz, moved: false, zone: "all" };
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
      c.gtx = g.tx;
      c.gtz = g.tz;
      c.gdist = g.dist;
      c.gel = DEFAULT_EL;
      c.zone = z;
      c.moved = false;
      invalidate();
    };
    shared.controls.current = {
      reset: () => {
        c.gaz = DEFAULT_AZ;
        focus("all");
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
  }, [goalFor, invalidate, limit, shared.controls]);

  // Room button => fly to that room.
  const firstZone = useRef(true);
  useEffect(() => {
    if (firstZone.current) {
      firstZone.current = false;
      return;
    }
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

  // Camera remains bird's-eye. One-finger gestures walk the player; pinch/wheel only zoom.
  useEffect(() => {
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
  },[gl,limit,invalidate]);

  useFrame((state, dtRaw) => {
    const c = cam.current!;
    if (shared.walker.current.moving) { c.gtx = shared.walker.current.position.x; c.gtz = shared.walker.current.position.z; }
    const dt = Math.min(0.05, dtRaw);
    const k = reduce ? 1 : 1 - Math.exp(-dt * 10);
    c.az = DEFAULT_AZ;
    c.el = DEFAULT_EL;
    c.dist += (c.gdist - c.dist) * k;
    c.tx += (c.gtx - c.tx) * k;
    c.tz += (c.gtz - c.tz) * k;
    const ce = Math.cos(c.el);
    camera.position.set(c.tx + c.dist * ce * Math.sin(c.az), c.dist * Math.sin(c.el), c.tz + c.dist * ce * Math.cos(c.az));
    camera.lookAt(c.tx, 0, c.tz);
    camera.updateMatrixWorld();
    let busy = Math.abs(c.gaz - c.az) + Math.abs(c.gel - c.el) + Math.abs(c.gdist - c.dist) * 0.2 + Math.abs(c.gtx - c.tx) + Math.abs(c.gtz - c.tz) > 0.0015;

    // Cut away whichever exterior walls face the camera, so the view is never blocked.
    const off = { x: camera.position.x - plan.size.w / 2, z: camera.position.z - plan.size.d / 2 };
    for (const spec of plan.walls) {
      const g = shared.walls.current.get(spec.id);
      if (!g) continue;
      const target = Math.min(wallScale(spec, off), partitionDrops(spec, camera.position) ? 0.06 : 1);
      const next = reduce ? target : g.scale.y + (target - g.scale.y) * k;
      if (Math.abs(next - g.scale.y) > 0.002) busy = true;
      g.scale.y = Math.abs(next - target) < 0.004 ? target : next;
    }

    // Float the tags above their furniture.
    const w = state.size.width;
    const h = state.size.height;
    for (const s of slotsRef.current) {
      const el = shared.labelEls.current.get(s.id);
      if (!el) continue;
      tmp.set(s.x, s.labelY, s.z).project(camera);
      const visible = tmp.z < 1 && tmp.z > -1;
      const x = (tmp.x * 0.5 + 0.5) * w;
      const y = (-tmp.y * 0.5 + 0.5) * h;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
      el.style.opacity = visible ? "1" : "0";
      el.style.pointerEvents = visible ? "auto" : "none";
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
  useEffect(() => invalidate(), [p.visibleIds, p.luxury, p.hasBed, p.selectedId, p.hour, invalidate]);
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
      {plan.npcs?.map((n) => (
        <Figure key={n.id} npc={n} />
      ))}
      {slots.map((s) => (
        <group
          key={s.id}
          position={[s.x, 0, s.z]}
          rotation={[0, s.rot, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (shared.dragged.current > 6) return;
            window.dispatchEvent(new CustomEvent("tst-home-walk-to",{detail:{id:s.id}}));
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
      <HomeWalker head={p.playerHead ?? "rgb(255, 244, 214)"} plan={plan} visibleIds={p.visibleIds} handle={shared.walker} onArrive={p.onSelect} />
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
  const shared: Shared = useMemo(() => ({ controls: props.controls, labelEls, walls, hover, dragged, walker }), [props.controls]);
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
        aria-label={`Overhead 3D view of ${plan.name}. Tap or drag on the floor to walk, pinch to zoom, tap furniture to interact.`}
      >
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
            onClick={() => window.dispatchEvent(new CustomEvent("tst-home-walk-to",{detail:{id:s.id}}))}
            className={`pointer-events-auto absolute left-0 top-0 min-h-9 min-w-9 rounded-full border-2 border-foreground px-2.5 text-[11px] font-extrabold tracking-wide shadow-md ${props.selectedId === s.id ? "bg-primary text-primary-foreground" : "bg-card/95 text-foreground"}`}
            style={{ transform: "translate(-9999px,-9999px)" }}
          >
            {s.tag}
          </button>
        ))}
      </div>
    </div>
  );
}
