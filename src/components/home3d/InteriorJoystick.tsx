import { useEffect, useRef, useState } from "react";

/** Floating analogue stick for 3D rooms. Uses a game-scoped CustomEvent so it
 * can steer the Three.js walker without rerendering the 3D scene every drag. */
export const INTERIOR_STICK_EVENT = "tst:interior-stick";
export type StickVector = { x: number; z: number };
const RADIUS = 42;
export function InteriorJoystick(){
 const pointer = useRef<number|null>(null);
 const origin = useRef<[number,number]>([0,0]);
 const [vector,setVector] = useState<StickVector>({x:0,z:0});
 const emit=(x:number,z:number)=>{
   setVector({x,z});
   window.dispatchEvent(new CustomEvent<StickVector>(INTERIOR_STICK_EVENT,{detail:{x,z}}));
 };
 const stop=()=>{
   pointer.current=null;
   emit(0,0);
 };
 useEffect(()=>{
   const reset=()=>stop();
   window.addEventListener("blur",reset);
   return()=>{window.removeEventListener("blur",reset);window.dispatchEvent(new CustomEvent<StickVector>(INTERIOR_STICK_EVENT,{detail:{x:0,z:0}}));};
 },[]);
 return <div className="pointer-events-auto absolute bottom-3 left-3 z-30" data-interior-joystick>
  <div role="group" aria-label="Move character with joystick"
    className="relative grid h-28 w-28 place-items-center rounded-full border-2 border-foreground bg-card/75 shadow-lg select-none"
    style={{touchAction:"none"}}
    onPointerDown={e=>{
      if(pointer.current!==null || !e.isPrimary)return;
      e.preventDefault();e.stopPropagation();
      pointer.current=e.pointerId;
      origin.current=[e.clientX,e.clientY];
      e.currentTarget.setPointerCapture(e.pointerId);
      emit(0,0);
    }}
    onPointerMove={e=>{
      if(pointer.current!==e.pointerId)return;
      e.preventDefault();e.stopPropagation();
      const dx=e.clientX-origin.current[0],dy=e.clientY-origin.current[1],d=Math.hypot(dx,dy);
      const k=d>RADIUS?RADIUS/d:1;
      emit(dx*k/RADIUS,dy*k/RADIUS);
    }}
    onPointerUp={e=>{
      if(pointer.current!==e.pointerId)return;
      e.stopPropagation();stop();
      if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId);
    }}
    onPointerCancel={e=>{if(pointer.current===e.pointerId)stop();}}>
    <div className="pointer-events-none absolute inset-3 rounded-full border border-foreground/30"/>
    <div className="pointer-events-none grid h-12 w-12 place-items-center rounded-full border-2 border-foreground bg-secondary text-xl font-bold shadow"
       style={{transform:`translate(${vector.x*RADIUS}px,${vector.z*RADIUS}px)`}}>✥</div>
  </div>
 </div>;
}
