import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Person, type ActFn, type PersonState, type Pose } from "@/components/Character3D";
import type { HeldProp } from "@/lib/cutscenes";
import { heldProps } from "./scenes/props";
import { townColor } from "@/components/town3d/palette";
import type { HomePlan } from "@/lib/home3d/layout";
import { buildNav, walkable } from "@/lib/home3d/nav";
import { routeHome, type WalkPoint } from "@/lib/home3d/route";
import { INTERIOR_STICK_EVENT, type StickVector } from "./InteriorJoystick";
import { slideMove, smoothRoute } from "./fluid-motion";

/** While set, a cutscene drives the character and player input is ignored. */
export type SceneDrive = { x: number; z: number; angle: number; lift: number; pose: Pose; walking: boolean; phase: number; act: ActFn; actT: number };
export type WalkerHandle = { position: WalkPoint; moving: boolean; nearby?: string | null; lookYaw?: number; scene?: SceneDrive | null };
const SPEED = 2.5;
export function HomeWalker({ plan, visibleIds, handle, onArrive, head, held = null, firstPerson = false }: {
  head: string;
  /** Prop in hand during a cutscene. */
  held?: HeldProp | null;
  firstPerson?: boolean;
  plan: HomePlan; visibleIds: readonly string[]; handle: MutableRefObject<WalkerHandle>;
  onArrive: (id: string) => void;
}) {
  const { invalidate }=useThree();
  const nav=useMemo(()=>buildNav(plan,visibleIds),[plan,visibleIds]);
  const start=plan.spawn.entry;
  const pos=useRef<WalkPoint>({x:start[0],z:start[1]});
  const waypoints=useRef<WalkPoint[]>([]);
  const target=useRef<string|null>(null);
  const dragPointer=useRef<number|null>(null);
  const keys=useRef(new Set<string>());
  const stick=useRef<StickVector>({x:0,z:0});
  const dir=useRef(0);
  const phase=useRef(0);
  const character = useRef<PersonState>({ x: start[0], z: start[1], angle: 180, walking: false, pose: "standing", visible: true, lift: 0.04, phase: 0 });
  const onArriveRef=useRef(onArrive);
  onArriveRef.current=onArrive;
  handle.current.position=pos.current;
  const moveTo=(x:number,z:number,id:string|null=null)=>{
    target.current=id;
    waypoints.current=smoothRoute(nav,pos.current,routeHome(nav,pos.current,{x,z}));
    invalidate();
  };
  const props=useMemo(()=>heldProps(held),[held]);
  const actionAt=(id:string)=>{
    const slot=plan.slots.find(s=>s.id===id);
    if(!slot)return;
    moveTo(slot.x,slot.z,id);
  };
  useEffect(()=>{
    const down=(e:KeyboardEvent)=>{
      if((e.target as HTMLElement)?.closest?.("button,input,textarea,select,[role=dialog]"))return;
      const k=e.key.toLowerCase();
      if(["arrowup","arrowdown","arrowleft","arrowright","w","a","s","d"].includes(k)){
        e.preventDefault();keys.current.add(k);waypoints.current=[];target.current=null;invalidate();
      }
    };
    const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());
    const clear=()=>keys.current.clear();
    window.addEventListener("keydown",down);window.addEventListener("keyup",up);window.addEventListener("blur",clear);
    return()=>{window.removeEventListener("keydown",down);window.removeEventListener("keyup",up);window.removeEventListener("blur",clear);};
  },[invalidate]);
  useEffect(()=>{
    const listener=(e:Event)=>{
      const d=(e as CustomEvent<{id:string}>).detail;
      if(d?.id && !handle.current.scene)actionAt(d.id);
    };
    window.addEventListener("tst-home-walk-to",listener);
    return()=>window.removeEventListener("tst-home-walk-to",listener);
  },[nav,plan]);
  useEffect(()=>{
    const onStick=(e:Event)=>{
      const v=(e as CustomEvent<StickVector>).detail;
      stick.current={x:v?.x??0,z:v?.z??0};
      if(Math.hypot(stick.current.x,stick.current.z)>.06){waypoints.current=[];target.current=null;invalidate();}
    };
    window.addEventListener(INTERIOR_STICK_EVENT,onStick);
    return()=>{stick.current={x:0,z:0};window.removeEventListener(INTERIOR_STICK_EVENT,onStick);};
  },[invalidate]);
  useEffect(()=>{
    const go=(e:Event)=>{
      const next=(e as CustomEvent<{x:number;z:number}>).detail;
      if(!next || handle.current.scene)return;
      if(walkable(nav,next.x,next.z)){
        pos.current={x:next.x,z:next.z};
        waypoints.current=[];target.current=null;
        handle.current.position={...pos.current};
        invalidate();
      }
    };
    window.addEventListener("tst:room-vantage",go);
    return()=>window.removeEventListener("tst:room-vantage",go);
  },[nav,invalidate]);
  useFrame((_,raw)=>{
    const dt=Math.min(raw,0.05),p=pos.current;
    const scene=handle.current.scene;
    if(scene){
      // The director owns the character; drop any queued walking so the player stays put afterwards.
      waypoints.current=[];target.current=null;keys.current.clear();
      Object.assign(character.current,{x:scene.x,z:scene.z,angle:scene.angle,lift:scene.lift,pose:scene.pose,walking:scene.walking,phase:scene.phase,act:scene.act,actT:scene.actT});
      handle.current.moving=false;
      return;
    }
    if(character.current.act)Object.assign(character.current,{act:undefined,actT:0,pose:"standing",lift:0.04});
    let dx=0,dz=0;
    if(keys.current.has("w")||keys.current.has("arrowup"))dz-=1;
    if(keys.current.has("s")||keys.current.has("arrowdown"))dz+=1;
    if(keys.current.has("a")||keys.current.has("arrowleft"))dx-=1;
    if(keys.current.has("d")||keys.current.has("arrowright"))dx+=1;
    if(Math.hypot(stick.current.x,stick.current.z)>.06){const yaw=firstPerson?(handle.current.lookYaw??0):0;dx=Math.cos(yaw)*stick.current.x+Math.sin(yaw)*stick.current.z;dz=-Math.sin(yaw)*stick.current.x+Math.cos(yaw)*stick.current.z;waypoints.current=[];target.current=null;}
    if(!dx&&!dz&&waypoints.current.length){
      const next=waypoints.current[0]!;
      dx=next.x-p.x;dz=next.z-p.z;
      if(Math.hypot(dx,dz)<0.1){waypoints.current.shift();dx=0;dz=0;}
    }
    let moved=false;
    const length=Math.hypot(dx,dz);
    if(length>0){
      const analogue=Math.hypot(stick.current.x,stick.current.z)>.06;
      const step=Math.min(SPEED*dt*(analogue?Math.min(1,length):1),analogue?Infinity:length), vx=dx/length*step,vz=dz/length*step;
      const next=slideMove(nav,p,vx,vz);
      const actualX=next.x-p.x, actualZ=next.z-p.z;
      moved=Math.hypot(actualX,actualZ)>0.0001;
      if(moved){p.x=next.x;p.z=next.z;}
      else if(!analogue)waypoints.current=[];
      if(moved){dir.current=Math.atan2(actualX,actualZ);phase.current+=dt*11;}
    }
    if(!waypoints.current.length && target.current){
      const slot=plan.slots.find(s=>s.id===target.current);
      if(slot && Math.hypot(slot.x-p.x,slot.z-p.z)<Math.max(slot.w,slot.d)/2+1.1){const id=target.current;target.current=null;onArriveRef.current(id);}
      else target.current=null;
    }
    Object.assign(character.current, { x: p.x, z: p.z, angle: 180 - dir.current * 180 / Math.PI, phase: phase.current, walking: moved });
    // Find only the closest currently available interaction, within reach.
    // The render loop reads this without rerendering every scene object.
    let nearest:string|null=null,best=1.35;
    for(const slot of plan.slots){
      if(!visibleIds.includes(slot.id))continue;
      const distance=Math.hypot(slot.x-p.x,slot.z-p.z);
      if(distance<best){best=distance;nearest=slot.id;}
    }
    handle.current.nearby=nearest;
    handle.current.position={...p};
    handle.current.moving=moved;
    if(moved||waypoints.current.length||Math.hypot(stick.current.x,stick.current.z)>.06)invalidate();
  }, -1);
  return <>
    <group visible={!firstPerson || Boolean(handle.current.scene)}><Person get={() => character.current} skin={head} outfit={townColor("var(--town-player)")} scale={1.7} heldL={props.left} heldR={props.right} /></group>
    {/* Capture a single finger so drag-to-walk continues even when the finger
        crosses a fixture. Pinch gestures are handled by the camera controls. */}
    <mesh position={[plan.size.w/2,0.041,plan.size.d/2]} rotation={[-Math.PI/2,0,0]}
      onPointerDown={e=>{
        if (handle.current.scene || dragPointer.current!==null || !e.isPrimary) return;
        e.stopPropagation();
        dragPointer.current=e.pointerId;
        e.target.setPointerCapture(e.pointerId);
        moveTo(e.point.x,e.point.z);
      }}
      onPointerMove={e=>{
        if (dragPointer.current!==e.pointerId || !e.isPrimary) return;
        e.stopPropagation();
        moveTo(e.point.x,e.point.z);
      }}
      onPointerUp={e=>{
        if (dragPointer.current!==e.pointerId) return;
        dragPointer.current=null;
        if(e.target.hasPointerCapture(e.pointerId))e.target.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={e=>{
        if(dragPointer.current===e.pointerId)dragPointer.current=null;
      }}>
      <planeGeometry args={[plan.size.w,plan.size.d]}/>
      <meshBasicMaterial transparent opacity={0} depthWrite={false}/>
    </mesh>
  </>;
}
