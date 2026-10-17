import { memo, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RenderDiagnosticsProbe } from "@/components/RenderDiagnosticsProbe";
import * as THREE from "three";
import { buildings, type B } from "@/lib/town-world";
import { daylight } from "@/lib/home3d/layout";
import type { EncounterSpot } from "@/lib/world-encounters";
import { StaticBatch } from "@/components/town3d/StaticBatch";
import { TownGround } from "@/components/town3d/ground";
import { TownBuildings } from "@/components/town3d/buildings";
import { EstateGrounds } from "@/components/town3d/estate";
import { CommunityHall } from "@/components/town3d/civic";
import { CrewGang, TownCameraRig, useConversationFacing, type CrewVisuals } from "@/components/town3d/crew";
import type { LiveConversation } from "@/lib/conversation-camera";
import { ConstructionStatic, Lamps, StreetFurniture, Trees, lampPositions } from "@/components/town3d/props";
import { BoxSquatter, Car, EncounterPerson, ParkKid, Pedestrians, Pigeons, Player3D, Residents, SiteCrew, Traffic, type TownLive } from "@/components/town3d/actors";
import { prepareNightMaterials, setNightLevel } from "@/components/town3d/kit";
import { glowTexture } from "@/components/town3d/textures";
import { mixColor } from "@/components/town3d/palette";
import { duskLevel, nightLevel } from "@/components/town3d/screen";

export type TownWorld3DProps = {
  live: TownLive;
  /** Changes every game tick; each change renders one frame. */
  tick: number;
  house: number;
  hour: number;
  skating: boolean;
  head: string;
  kidPresent: boolean;
  encounter: EncounterSpot | null | undefined;
  constructionActive: boolean;
  townHallBuilt?: boolean;
  mansionOwned?: boolean;
  castleOwned?: boolean;
  yardRelocated?: boolean;
  companyCar?: boolean;
  driving?: boolean;
  carPosition?: MutableRefObject<{x:number;y:number;angle:number}>;
  wreckOwned?: boolean;
  wreckDriving?: boolean;
  wreckPosition?: MutableRefObject<{x:number;y:number;angle:number}>;
  /** A conversation or story scene playing at the green: the camera leaves the overhead view to frame it. */
  conversation?: LiveConversation | null;
  crew?: CrewVisuals;
};
const NO_CREW: CrewVisuals = { held: {}, cone: true, trolley: null, alleyEnvelope: false };

/** Direction towards the sun: high in the west-south-west, so the south and west walls catch the light. */
const SUN = new THREE.Vector3(-0.7, 1.3, 0.25).normalize();

function Ticker({ tick }: { tick: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => { invalidate(); }, [tick, invalidate]);
  return null;
}

function Lights({ live, hour, lamps }: { live: TownLive; hour: number; lamps: (readonly [number, number])[] }) {
  const day = daylight(hour), night = nightLevel(hour), dusk = duskLevel(hour);
  const sun = useRef<THREE.DirectionalLight>(null);
  const points = useRef<(THREE.PointLight | null)[]>([]);
  useEffect(() => { setNightLevel(night); }, [night]);
  const sunColour = night > 0.6 ? "#9fb2ff" : mixColor("#ffefd2", "#ffb877", dusk);
  const order = useRef<number[]>([]);
  useFrame(() => {
    const m = live.me.current;
    const l = sun.current;
    if (l) {
      // Follow the player; snapping the shadow box to a fine grid stops edge shimmer.
      const tx = Math.round(m.x * 16) / 16, tz = Math.round(m.y * 16) / 16;
      l.target.position.set(tx, 0, tz);
      l.target.updateMatrixWorld();
      l.position.set(tx + SUN.x * 25, SUN.y * 25, tz + SUN.z * 25);
    }
    // Light the four nearest street lamps after dark.
    order.current = lamps.map((_, i) => i).sort((a, b) => {
      const pa = lamps[a]!, pb = lamps[b]!;
      return Math.hypot(pa[0] - m.x, pa[1] - m.y) - Math.hypot(pb[0] - m.x, pb[1] - m.y);
    });
    points.current.forEach((p, i) => {
      const lamp = lamps[order.current[i] ?? -1];
      if (!p || !lamp) return;
      p.position.set(lamp[0], 1.25, lamp[1] + 0.22);
      p.intensity = night > 0.15 ? 2.6 * night : 0;
    });
  });
  return (
    <>
      {/* Strong sky fill keeps shadows soft and coloured, like the interiors. */}
      <hemisphereLight args={[mixColor("#5866a8", "#eef4fb", day), mixColor("#2f2c3e", "#9a8a72", day), 0.85 + 0.75 * day]} />
      <directionalLight
        ref={sun}
        castShadow
        intensity={0.45 + 1.55 * day}
        color={sunColour}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
        shadow-camera-near={1}
        shadow-camera-far={60}
        shadow-bias={-0.0006}
        shadow-normalBias={0.02}
        shadow-radius={2.5}
      />
      {[0, 1, 2, 3].map((i) => <pointLight key={i} ref={(el) => { points.current[i] = el; }} color="#ffd59a" distance={3.4} decay={1.4} intensity={0} />)}
    </>
  );
}

/** Warm pools of light under the street lamps at night. */
function LampPools({ lamps, night }: { lamps: (readonly [number, number])[]; night: number }) {
  const material = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTexture(), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), []);
  useEffect(() => { material.opacity = 0.55 * night; }, [material, night]);
  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  if (night < 0.15) return null;
  return (
    <>
      {lamps.map(([x, z], i) => <mesh key={i} geometry={plane} material={material} position={[x, 0.03, z + 0.22]} rotation={[-Math.PI / 2, 0, 0]} scale={[1.9, 1.9, 1]} renderOrder={3} />)}
    </>
  );
}

/** The mansion's two gate leaves swing inward automatically once purchased. */
function MansionGate({ open }: { open: boolean }) {
  const left = useRef<THREE.Group>(null);
  const right = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    const target = open ? 1.1 : 0;
    const blend = 1 - Math.exp(-Math.min(delta, 0.1) * 5);
    if (left.current) left.current.rotation.y += (target - left.current.rotation.y) * blend;
    if (right.current) right.current.rotation.y += (-target - right.current.rotation.y) * blend;
  });
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: "#393e39", metalness: 0.65, roughness: 0.32 }), []);
  const gold = useMemo(() => new THREE.MeshStandardMaterial({ color: "#c7a65b", metalness: 0.65, roughness: 0.32 }), []);
  return (
    <group>
      {/* Single-track access lane from the east-side road to the west-facing porch. */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[31.25, 0.029, 7.2]}>
        <planeGeometry args={[2.2, 0.92]} />
        <meshStandardMaterial color="#8e8d85" roughness={0.95} />
      </mesh>
      {[6.72, 7.68].map(z => (
        <mesh key={z} position={[30.2, 0.23, z]} material={gold}>
          <boxGeometry args={[0.13, 0.46, 0.13]} />
        </mesh>
      ))}
      <group ref={left} position={[30.2, 0, 6.77]}>
        <mesh position={[0, 0.22, 0.2]} material={iron}>
          <boxGeometry args={[0.04, 0.33, 0.4]} />
        </mesh>
      </group>
      <group ref={right} position={[30.2, 0, 7.63]}>
        <mesh position={[0, 0.22, -0.2]} material={iron}>
          <boxGeometry args={[0.04, 0.33, 0.42]} />
        </mesh>
      </group>
    </group>
  );
}

/** Completed civic landmark on the original construction plot. The yard office remains open. */
function DerelictCar(){return <group position={[5.8,0,11.1]} rotation={[0,Math.PI/2+0.08,0]}><Car colour="#74695e" wreck /></group>;}
function PersonalCar({position}:{position:MutableRefObject<{x:number;y:number;angle:number}>}) {
 const group=useRef<THREE.Group>(null);
 useFrame(()=>{if(!group.current)return;const p=position.current;group.current.position.set(p.x,0,p.y);group.current.rotation.y=Math.PI-p.angle*Math.PI/180;});
 return <group ref={group} position={[position.current.x,0,position.current.y]}><Car colour="#677b89"/></group>;
}

function CompanyCar({live, driving, carPosition}: {live: TownLive; driving: boolean; carPosition: MutableRefObject<{x:number;y:number;angle:number}>}) {
 const ref = useRef<THREE.Group>(null);

 // Dynamic actors must stay outside StaticBatch: it bakes mesh coordinates at mount.
 // Keep the last driven position when exiting instead of snapping to the yard.
 useFrame(() => {
  const group = ref.current;
  if (!group) return;
  if (driving) {
   const player = live.me.current;
   carPosition.current = {x:player.x,y:player.y,angle:player.skateAngle};
  }
  const car = carPosition.current;
  group.position.set(car.x,0,car.y);
  group.rotation.y = Math.PI - car.angle * Math.PI / 180;
 });
 return <group ref={ref} position={[30.1,0,22.1]}><Car colour="#788574" /></group>;
}

/** Equipment and contractor storage travel with the foreman's office to the east site. */
function EasternYardEquipment() {
  return <group>
    <mesh position={[34.8,0.07,20.8]} receiveShadow>
      <boxGeometry args={[1.3,0.14,4.5]} />
      <meshStandardMaterial color="#b5a88a" />
    </mesh>
    {[19.2,20.0,20.8,21.6].map(z=><mesh key={z} position={[34.6,0.34,z]} castShadow>
      <boxGeometry args={[0.8,0.65,0.55]} />
      <meshStandardMaterial color="#a47c49" />
    </mesh>)}
    <mesh position={[30.3,0.42,20.2]} castShadow>
      <boxGeometry args={[0.5,0.84,1.1]} />
      <meshStandardMaterial color="#dcad36" />
    </mesh>
    <mesh position={[30.3,1.3,20.2]} castShadow>
      <boxGeometry args={[0.12,1.25,0.12]} />
      <meshStandardMaterial color="#55575a" />
    </mesh>
  </group>;
}

const Scene = memo(function Scene({ live, house, hour, skating, head, kidPresent, encounter, constructionActive, mansionOwned, townHallBuilt, castleOwned, yardRelocated, companyCar, driving, carPosition, wreckOwned, wreckDriving, wreckPosition, conversation, crew }: Omit<TownWorld3DProps, "tick">) {
  const face = useConversationFacing(live, conversation);
  const bs: B[] = useMemo(() => buildings(house, house >= 4 || Boolean(castleOwned), Boolean(yardRelocated)), [house, castleOwned, yardRelocated]);
  const lamps = useMemo(() => lampPositions(bs), [bs]);
  return (
    <>
      <TownCameraRig live={live} skating={skating} conversation={conversation} />
      <Lights live={live} hour={hour} lamps={lamps} />
      <StaticBatch version={`town-${house}-${Boolean(townHallBuilt)}-${Boolean(yardRelocated)}`}>
        <TownGround bs={bs} />
        <TownBuildings bs={bs} house={house} />
        <Trees bs={bs} />
        <Lamps bs={bs} />
        <StreetFurniture />
        {townHallBuilt ? <CommunityHall /> : <ConstructionStatic />}
        {yardRelocated && <group position={[19.1,0,12.3]} scale={[0.7,1,0.7]}><ConstructionStatic /></group>}
        {yardRelocated && <EasternYardEquipment />}
      </StaticBatch>
      {yardRelocated && companyCar && carPosition && <CompanyCar live={live} driving={Boolean(driving)} carPosition={carPosition} />}
      {wreckPosition && (wreckOwned ? <PersonalCar position={wreckPosition} /> : <DerelictCar />)}
      <LampPools lamps={lamps} night={nightLevel(hour)} />
      <MansionGate open={Boolean(mansionOwned)} />
      <EstateGrounds />
      {!driving && !wreckDriving && <Player3D live={live} skating={skating} head={head} face={face} />}
      <Residents live={live} hour={hour} />
      <Pedestrians live={live} />
      <Pigeons live={live} />
      <CrewGang live={live} conversation={conversation} visuals={crew ?? NO_CREW} />
      <BoxSquatter visible={house > 0 && !castleOwned && house < 4} />
      <ParkKid present={kidPresent} />
      <EncounterPerson encounter={encounter} />
      {!townHallBuilt && <SiteCrew active={constructionActive} />}
      {yardRelocated && <group position={[19.1,0,12.3]} scale={[0.7,1,0.7]}><SiteCrew active={constructionActive} /></group>}
      <Traffic />
    </>
  );
});

/**
 * The outside town in real 3D, drawn behind the SVG layer that still handles
 * drag-to-move, taps, labels and speech. The camera reproduces the classic
 * portrait follow view exactly on the ground plane.
 */
export default function TownWorld3D({ tick, ...scene }: TownWorld3DProps) {
  const camera = useMemo(() => Object.assign(new THREE.OrthographicCamera(-1, 1, 1, -1, -100, 100), { manual: true }), []);
  useMemo(() => prepareNightMaterials(), []);
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true" data-town-world-3d>
      <Canvas
        camera={camera}
        shadows="percentage"
        frameloop="demand"
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      >
        <Ticker tick={tick} />
        <RenderDiagnosticsProbe scene="Town 3D" />
        <Scene {...scene} />
      </Canvas>
    </div>
  );
}
