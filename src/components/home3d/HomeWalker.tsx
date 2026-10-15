import { useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import type { HomePlan } from "@/lib/home3d/layout";
import { buildNav, walkable } from "@/lib/home3d/nav";
import { routeHome, type WalkPoint } from "@/lib/home3d/route";

export type WalkerHandle = { position: WalkPoint; moving: boolean };
const SPEED = 2.5;
function StickPerson({ angle, phase, moving }: { angle: number; phase: number; moving: boolean }) {
  const stride = moving ? Math.sin(phase) * 0.16 : 0;
  return <group rotation={[0, angle, 0]}>
    <mesh position={[0,0.013,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[0.26,24]} /><meshBasicMaterial color="#17202b" transparent opacity={0.22} depthWrite={false}/></mesh>
    {/* Keep the town's minimal floating head-and-arms silhouette, not a realistic human model. */}
    <mesh position={[0,0.86,0]} castShadow><sphereGeometry args={[0.24,20,16]}/><meshStandardMaterial color="#edc0a0" roughness={0.9}/></mesh>
    <mesh position={[0,0.995,-0.055]}><sphereGeometry args={[0.233,16,12,0,Math.PI*2,0,Math.PI*0.41]}/><meshStandardMaterial color="#24202a"/></mesh>
    {[-1,1].map(s=><group key={s}>
      <mesh position={[s*0.235,0.48,0]} rotation={[0,0,s*0.35]} castShadow><capsuleGeometry args={[0.045,0.28,4,8]}/><meshStandardMaterial color="#272b36"/></mesh>
      <mesh position={[s*0.285,0.26,0.055]}><sphereGeometry args={[0.055,8,8]}/><meshStandardMaterial color="#edc0a0"/></mesh>
      <mesh position={[s*0.11,0.065,s*stride]}><sphereGeometry args={[0.075,8,8]}/><meshStandardMaterial color="#272b36"/></mesh>
    </group>)}
    <mesh position={[-0.075,0.88,0.22]}><sphereGeometry args={[0.022,8,8]}/><meshBasicMaterial color="#171923"/></mesh>
    <mesh position={[0.075,0.88,0.22]}><sphereGeometry args={[0.022,8,8]}/><meshBasicMaterial color="#171923"/></mesh>
  </group>;
}
export function HomeWalker({ plan, visibleIds, handle, onArrive }: {
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
  const [pose,setPose]=useState({angle:0,phase:0,moving:false});
  const lastPose=useRef(0);
  const mesh=useRef<THREE.Group>(null);
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
    if((moved || pose.moving) && phase.current-lastPose.current>0.22){lastPose.current=phase.current;setPose({angle:dir.current,phase:phase.current,moving:moved});}
    else if(!moved && pose.moving){setPose({angle:dir.current,phase:phase.current,moving:false});}
    handle.current.position={...p};
    handle.current.moving=moved;
    if(mesh.current){mesh.current.position.set(p.x,0.04,p.z);mesh.current.rotation.set(0,0,0);}
    if(moved||waypoints.current.length)invalidate();
  });
  return <>
    <group ref={mesh} position={[start[0],0.04,start[1]]}>
      <StickPerson angle={pose.angle} phase={pose.phase} moving={pose.moving}/>
    </group>
    {/* An unobtrusive ground target: pointer events on furniture take precedence. */}
    <mesh position={[plan.size.w/2,0.041,plan.size.d/2]} rotation={[-Math.PI/2,0,0]}
      onClick={e=>{if(e.delta>8)return;e.stopPropagation();moveTo(e.point.x,e.point.z);}}
      onPointerMove={e=>{if(e.buttons===1){e.stopPropagation();moveTo(e.point.x,e.point.z);}}}>
      <planeGeometry args={[plan.size.w,plan.size.d]}/>
      <meshBasicMaterial transparent opacity={0} depthWrite={false}/>
    </mesh>
  </>;
}
