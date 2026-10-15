import { useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Person, type PersonState } from "@/components/Character3D";
import { townColor } from "@/components/town3d/palette";
import type { HomePlan } from "@/lib/home3d/layout";
import { buildNav, walkable } from "@/lib/home3d/nav";
import { routeHome, type WalkPoint } from "@/lib/home3d/route";

export type WalkerHandle = { position: WalkPoint; moving: boolean };
const SPEED = 2.5;
export function HomeWalker({ plan, visibleIds, handle, onArrive, head }: {
  head: string;
  plan: HomePlan; visibleIds: readonly string[]; handle: MutableRefObject<WalkerHandle>;
  onArrive: (id: string) => void;
}) {
  const { invalidate }=useThree();
  const nav=useMemo(()=>buildNav(plan,visibleIds),[plan,visibleIds]);
  const start=plan.spawn.entry;
  const pos=useRef<WalkPoint>({x:start[0],z:start[1]});
  const waypoints=useRef<WalkPoint[]>([]);
  const target=useRef<string|null>(null);
  const keys=useRef(new Set<string>());
  const dir=useRef(0);
  const phase=useRef(0);
  const character = useRef<PersonState>({ x: start[0], z: start[1], angle: 180, walking: false, pose: "standing", visible: true, lift: 0.04, phase: 0 });
  const onArriveRef=useRef(onArrive);
  onArriveRef.current=onArrive;
  handle.current.position=pos.current;
  const moveTo=(x:number,z:number,id:string|null=null)=>{
    target.current=id;
    waypoints.current=routeHome(nav,pos.current,{x,z});
    invalidate();
  };
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
      if(d?.id)actionAt(d.id);
    };
    window.addEventListener("tst-home-walk-to",listener);
    return()=>window.removeEventListener("tst-home-walk-to",listener);
  },[nav,plan]);
  useFrame((_,raw)=>{
    const dt=Math.min(raw,0.05),p=pos.current;
    let dx=0,dz=0;
    if(keys.current.has("w")||keys.current.has("arrowup"))dz-=1;
    if(keys.current.has("s")||keys.current.has("arrowdown"))dz+=1;
    if(keys.current.has("a")||keys.current.has("arrowleft"))dx-=1;
    if(keys.current.has("d")||keys.current.has("arrowright"))dx+=1;
    if(!dx&&!dz&&waypoints.current.length){
      const next=waypoints.current[0]!;
      dx=next.x-p.x;dz=next.z-p.z;
      if(Math.hypot(dx,dz)<0.1){waypoints.current.shift();dx=0;dz=0;}
    }
    let moved=false;
    const length=Math.hypot(dx,dz);
    if(length>0){
      const step=Math.min(SPEED*dt,length), vx=dx/length*step,vz=dz/length*step;
      if(walkable(nav,p.x+vx,p.z)){p.x+=vx;p.z+=vz;moved=true;}
      else if(walkable(nav,p.x+vx,p.z)){p.x+=vx;moved=true;}
      else if(walkable(nav,p.x,p.z+vz)){p.z+=vz;moved=true;}
      else waypoints.current=[];
      if(moved){dir.current=Math.atan2(vx,vz);phase.current+=dt*11;}
    }
    if(!waypoints.current.length && target.current){
      const slot=plan.slots.find(s=>s.id===target.current);
      if(slot && Math.hypot(slot.x-p.x,slot.z-p.z)<Math.max(slot.w,slot.d)/2+1.1){const id=target.current;target.current=null;onArriveRef.current(id);}
      else target.current=null;
    }
    Object.assign(character.current, { x: p.x, z: p.z, angle: 180 - dir.current * 180 / Math.PI, phase: phase.current, walking: moved });
    handle.current.position={...p};
    handle.current.moving=moved;
    if(moved||waypoints.current.length)invalidate();
  }, -1);
  return <>
    <Person get={() => character.current} skin={head} outfit={townColor("var(--town-player)")} scale={1.7} />
    {/* An unobtrusive ground target: pointer events on furniture take precedence. */}
    <mesh position={[plan.size.w/2,0.041,plan.size.d/2]} rotation={[-Math.PI/2,0,0]}
      onClick={e=>{if(e.delta>8)return;e.stopPropagation();moveTo(e.point.x,e.point.z);}}
      onPointerMove={e=>{if(e.buttons===1){e.stopPropagation();moveTo(e.point.x,e.point.z);}}}>
      <planeGeometry args={[plan.size.w,plan.size.d]}/>
      <meshBasicMaterial transparent opacity={0} depthWrite={false}/>
    </mesh>
  </>;
}
