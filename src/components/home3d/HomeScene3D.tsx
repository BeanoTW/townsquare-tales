import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import * as THREE from "three";
import type { HomeZone } from "@/lib/home-zones";
import { STUDIO, daylight, fitToView, visibleSlots, wallCutDown, type Slot } from "@/lib/home3d/layout";
import { Bed, Bookshelf, Console, Desk, EstateBoard, Kitchen, Mattress, Sofa, Television, Weights } from "./furniture";
import { Decor, Floors, Plinth, Wall } from "./StudioShell";
import type { CameraControls, Scene3DProps } from "./types";

const FOV = 45;
const EL_MIN = 0.3;
const EL_MAX = 1.38;
const DIST_MIN = 3.4;
const DEFAULT_AZ = 0.42;
const DEFAULT_EL = 0.86;

type Cam = { az: number; el: number; dist: number; tx: number; tz: number; gaz: number; gel: number; gdist: number; gtx: number; gtz: number; moved: boolean; zone: HomeZone | "all" };

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const mixHex = (a: string, b: string, t: number) => {
  const c = new THREE.Color(a).lerp(new THREE.Color(b), t);
  return `#${c.getHexString()}`;
};

function regionFor(zone: HomeZone | "all") {
  const f = STUDIO.focus[zone] ?? STUDIO.focus.all!;
  const w = zone === "living" ? 4.4 : zone === "bedroom" ? 3.6 : STUDIO.size.w;
  return { x: f.x, z: f.z, w, d: STUDIO.size.d };
}

function Lights({ day }: { day: number }) {
  return (
    <>
      <hemisphereLight args={["#e3edf5", "#7d6a55", 0.5 + 0.55 * day]} />
      <directionalLight
        castShadow
        position={[-3.5, 9, -7]}
        intensity={0.2 + 2.6 * day}
        color={day > 0.9 ? "#fff3dc" : "#ffcf9a"}
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-7}
        shadow-camera-right={7}
        shadow-camera-top={7}
        shadow-camera-bottom={-7}
        shadow-camera-near={1}
        shadow-camera-far={28}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
        shadow-radius={4}
      />
      {/* warm light for the living space, cooler for the sleeping space, so they read as different rooms */}
      <pointLight position={[2.1, 2.2, 2.5]} color="#ffc983" intensity={4 + 16 * (1 - day)} distance={8} decay={1.6} />
      <pointLight position={[5.9, 2.0, 2.2]} color="#c3d2ff" intensity={2.5 + 11 * (1 - day)} distance={7} decay={1.6} />
      <pointLight position={[1.4, 1.5, 0.9]} color="#fff0c8" intensity={1.5 + 3 * (1 - day)} distance={3.5} decay={1.8} />
    </>
  );
}

function Furniture({ slot, luxury, hasBed }: { slot: Slot; luxury: boolean; hasBed: boolean }) {
  switch (slot.id) {
    case "bed":
      return hasBed ? <Bed lux={luxury} /> : <Mattress />;
    case "sofa":
      return <Sofa lux={luxury} />;
    case "kitchen":
      return <Kitchen lux={luxury} />;
    case "tv":
      return <Television lux={luxury} />;
    case "console":
      return <Console lux={luxury} />;
    case "bookshelf":
      return <Bookshelf lux={luxury} />;
    case "weights":
      return <Weights lux={luxury} />;
    case "desk":
      return <Desk lux={luxury} />;
    case "estate":
      return <EstateBoard />;
    default:
      return null;
  }
}

type Shared = {
  controls: MutableRefObject<CameraControls | null>;
  labelEls: MutableRefObject<Map<string, HTMLElement>>;
  walls: MutableRefObject<Map<string, THREE.Group>>;
  hover: MutableRefObject<string | null>;
  dragged: MutableRefObject<number>;
};

function Rig({ slots, zone, shared }: { slots: Slot[]; zone: HomeZone; shared: Shared }) {
  const { camera, gl, size, invalidate } = useThree();
  const reduce = useMemo(() => typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true, []);
  const aspect = size.width / Math.max(1, size.height);
  const cam = useRef<Cam | null>(null);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const slotsRef = useRef(slots);
  slotsRef.current = slots;

  const goalFor = useCallback(
    (z: HomeZone | "all") => {
      const r = regionFor(z);
      const az = cam.current?.gaz ?? DEFAULT_AZ;
      return { tx: r.x, tz: r.z, dist: fitToView(r.w, r.d, STUDIO.size.h, az, DEFAULT_EL, aspect, FOV) };
    },
    [aspect],
  );
  const maxDist = useCallback(() => fitToView(STUDIO.size.w, STUDIO.size.d, STUDIO.size.h, DEFAULT_AZ, DEFAULT_EL, aspect, FOV, 1.5), [aspect]);

  if (!cam.current) {
    const g = goalFor("all");
    cam.current = { az: DEFAULT_AZ, el: DEFAULT_EL, dist: g.dist, tx: g.tx, tz: g.tz, gaz: DEFAULT_AZ, gel: DEFAULT_EL, gdist: g.dist, gtx: g.tx, gtz: g.tz, moved: false, zone: "all" };
  }

  const limit = useCallback(() => {
    const c = cam.current!;
    c.gel = clamp(c.gel, EL_MIN, EL_MAX);
    c.gdist = clamp(c.gdist, DIST_MIN, maxDist());
    c.gtx = clamp(c.gtx, 0, STUDIO.size.w);
    c.gtz = clamp(c.gtz, 0, STUDIO.size.d);
  }, [maxDist]);

  // Public handle used by the on-screen buttons and by tests.
  useEffect(() => {
    const c = cam.current!;
    const focus = (z: HomeZone | "all") => {
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
      rotate: (r) => {
        c.gaz += r;
        c.moved = true;
        invalidate();
      },
      tilt: (r) => {
        c.gel += r;
        c.moved = true;
        limit();
        invalidate();
      },
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

  // Gestures: one finger / left mouse orbits, two fingers pinch to zoom and drag to pan, wheel zooms,
  // right or middle mouse (or shift) pans, arrow keys rotate.
  useEffect(() => {
    const el = gl.domElement;
    const c = cam.current!;
    const pts = new Map<number, { x: number; y: number }>();
    let mode: "orbit" | "pan" | null = null;
    let last = { x: 0, y: 0, d: 0 };
    const mid = () => {
      const a = [...pts.values()];
      return { x: a.reduce((s, p) => s + p.x, 0) / a.length, y: a.reduce((s, p) => s + p.y, 0) / a.length };
    };
    const spread = () => {
      const a = [...pts.values()];
      return a.length < 2 ? 0 : Math.hypot(a[0]!.x - a[1]!.x, a[0]!.y - a[1]!.y);
    };
    const pan = (dx: number, dy: number) => {
      const k = c.gdist * 0.0016;
      const sa = Math.sin(c.gaz);
      const ca = Math.cos(c.gaz);
      c.gtx += (-dx * ca + dy * sa) * k;
      c.gtz += (dx * sa + dy * ca) * k;
    };
    const down = (e: PointerEvent) => {
      el.setPointerCapture?.(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      shared.dragged.current = 0;
      if (pts.size === 1) {
        mode = e.pointerType === "mouse" && (e.button === 2 || e.button === 1 || e.shiftKey) ? "pan" : "orbit";
        last = { ...pts.get(e.pointerId)!, d: 0 };
      } else {
        mode = "pan";
        const m = mid();
        last = { x: m.x, y: m.y, d: spread() };
      }
    };
    const move = (e: PointerEvent) => {
      if (!pts.has(e.pointerId)) return;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size >= 2) {
        const m = mid();
        const d = spread();
        if (last.d > 0 && d > 0) c.gdist *= last.d / d;
        pan(m.x - last.x, m.y - last.y);
        shared.dragged.current += Math.abs(m.x - last.x) + Math.abs(m.y - last.y) + 8;
        last = { x: m.x, y: m.y, d };
      } else {
        const dx = e.clientX - last.x;
        const dy = e.clientY - last.y;
        shared.dragged.current += Math.abs(dx) + Math.abs(dy);
        if (mode === "pan") pan(dx, dy);
        else {
          c.gaz -= dx * 0.0085;
          c.gel += dy * 0.006;
        }
        last = { x: e.clientX, y: e.clientY, d: 0 };
      }
      if (shared.dragged.current > 3) c.moved = true;
      limit();
      invalidate();
    };
    const up = (e: PointerEvent) => {
      pts.delete(e.pointerId);
      if (pts.size === 1) {
        mode = "orbit";
        last = { ...[...pts.values()][0]!, d: 0 };
      } else if (pts.size === 0) mode = null;
    };
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      c.gdist *= Math.exp(e.deltaY * 0.0012);
      c.moved = true;
      limit();
      invalidate();
    };
    const menu = (e: Event) => e.preventDefault();
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("contextmenu", menu);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("contextmenu", menu);
    };
  }, [gl, invalidate, limit, shared.dragged]);

  useFrame((state, dtRaw) => {
    const c = cam.current!;
    const dt = Math.min(0.05, dtRaw);
    const k = reduce ? 1 : 1 - Math.exp(-dt * 10);
    c.az += (c.gaz - c.az) * k;
    c.el += (c.gel - c.el) * k;
    c.dist += (c.gdist - c.dist) * k;
    c.tx += (c.gtx - c.tx) * k;
    c.tz += (c.gtz - c.tz) * k;
    const ce = Math.cos(c.el);
    camera.position.set(c.tx + c.dist * ce * Math.sin(c.az), c.dist * Math.sin(c.el), c.tz + c.dist * ce * Math.cos(c.az));
    camera.lookAt(c.tx, 0.55, c.tz);
    camera.updateMatrixWorld();
    let busy = Math.abs(c.gaz - c.az) + Math.abs(c.gel - c.el) + Math.abs(c.gdist - c.dist) * 0.2 + Math.abs(c.gtx - c.tx) + Math.abs(c.gtz - c.tz) > 0.0015;

    // Cut away whichever exterior walls face the camera, so the view is never blocked.
    const off = { x: camera.position.x - STUDIO.size.w / 2, z: camera.position.z - STUDIO.size.d / 2 };
    for (const spec of STUDIO.walls) {
      const g = shared.walls.current.get(spec.id);
      if (!g) continue;
      const cut = wallCutDown(spec, off) || (!spec.outer && spec.height > 1.2 && cutPartition(spec, camera.position));
      const target = cut ? 0.06 : 1;
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

/** Partition walls only drop when the camera is level with them and close behind, so rooms stay visible. */
function cutPartition(spec: { a: [number, number]; normal: [number, number] }, camPos: THREE.Vector3): boolean {
  return (camPos.x - spec.a[0]) * spec.normal[0] * -1 > 0 && Math.abs(camPos.x - spec.a[0]) > 0 ? camPos.x > spec.a[0] + 0.01 && camPos.y < 3 : false;
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
  const slots = useMemo(() => visibleSlots(STUDIO, p.visibleIds), [p.visibleIds]);
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
      <Rig slots={slots} zone={p.zone} shared={shared} />
      <Lights day={daylight(p.hour)} />
      <Plinth />
      <Floors />
      {STUDIO.walls.map((w) => (
        <Wall key={w.id} spec={w} register={register} />
      ))}
      <Decor />
      {slots.map((s) => (
        <group
          key={s.id}
          position={[s.x, 0, s.z]}
          rotation={[0, s.rot, 0]}
          onClick={(e) => {
            e.stopPropagation();
            if (shared.dragged.current > 6) return;
            p.onSelect(s.id);
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
          <Furniture slot={s} luxury={Boolean(p.luxury[s.id])} hasBed={p.hasBed} />
        </group>
      ))}
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
  const shared: Shared = useMemo(() => ({ controls: props.controls, labelEls, walls, hover, dragged }), [props.controls]);
  const day = daylight(props.hour);
  const slots = useMemo(() => visibleSlots(STUDIO, props.visibleIds), [props.visibleIds]);
  const bg = `linear-gradient(180deg, ${mixHex("#1c2440", "#cfe3ee", day)} 0%, ${mixHex("#2d3150", "#f0e8d6", day)} 100%)`;
  const { onReady } = props;
  useEffect(() => {
    onReady?.();
  }, [onReady]);
  return (
    <div className="absolute inset-0 overflow-hidden" style={{ background: bg, touchAction: "none" }} data-home3d="studio" data-daylight={day.toFixed(2)}>
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
        aria-label="Interactive 3D view of your studio flat. Drag to orbit, pinch or scroll to zoom, tap furniture to use it."
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
            onClick={() => props.onSelect(s.id)}
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
