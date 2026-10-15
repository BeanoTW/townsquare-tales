import { useMemo } from "react";
import * as THREE from "three";
import { VenueVisualPolish } from "./venue-visual-polish";

const wood = new THREE.MeshStandardMaterial({ color: "#5c3e2d", roughness: .78 });
const dark = new THREE.MeshStandardMaterial({ color: "#28292b", roughness: .72 });
const brass = new THREE.MeshStandardMaterial({ color: "#bf9550", roughness: .28, metalness: .65 });
const glass = new THREE.MeshStandardMaterial({ color: "#b6d0c5", roughness: .12, metalness: .12, transparent: true, opacity: .34, depthWrite: false });
const felt = new THREE.MeshStandardMaterial({ color: "#304c43", roughness: .95 });
const cream = new THREE.MeshStandardMaterial({ color: "#ded1b3", roughness: .95 });
const silver = new THREE.MeshStandardMaterial({ color: "#a6adb0", metalness: .7, roughness: .3 });

function Cube({ p, s, m = wood }: { p: [number,number,number]; s: [number,number,number]; m?: THREE.Material }) {
  return <mesh position={p} material={m} castShadow receiveShadow><boxGeometry args={s}/></mesh>;
}
function Trinket({ x, y, z, variant }: { x:number; y:number; z:number; variant:number }) {
  const m = [brass,silver,cream,dark][variant%4]!;
  return <group position={[x,y,z]}>
    <mesh material={m} castShadow><cylinderGeometry args={[.075,.095,.17,10]}/></mesh>
    <mesh position={[0,.12,0]} material={variant%3===0?brass:glass}><sphereGeometry args={[.06,12,8]}/></mesh>
  </group>;
}

/** Counter directly connects to the existing SELL hotspot and its current inventory logic. */
export function PawnCounter() {
  return <group>
    <Cube p={[0,.49,0]} s={[4.05,.93,.92]}/>
    <Cube p={[0,.98,.03]} s={[4.15,.09,1.04]} m={brass}/>
    <Cube p={[0,.97,-.37]} s={[3.55,.025,.14]} m={glass}/>
    <Cube p={[0,1.03,.22]} s={[1.15,.045,.4]} m={felt}/>
    <Cube p={[1.27,1.13,-.12]} s={[.42,.3,.22]} m={dark}/>
    <Cube p={[1.27,1.32,-.12]} s={[.38,.045,.19]} m={silver}/>
    <Cube p={[-1.25,1.05,.06]} s={[.28,.1,.3]} m={dark}/>
    <mesh position={[-.92,1.03,.16]} rotation={[-Math.PI/2,0,0]} material={silver}>
      <torusGeometry args={[.08,.015,8,20]}/>
    </mesh>
    {[-.35,.2,.7].map((x,i)=><Trinket key={i} x={x} y={1.07} z={-.1} variant={i}/>)}
    <Cube p={[0,.5,.47]} s={[3.95,.65,.035]} m={felt}/>
    {[-1.8,1.8].map(x=><Cube key={x} p={[x,.5,.49]} s={[.08,.84,.05]} m={brass}/>)}
  </group>;
}

/** Glass-fronted curiosities, not an alternative gameplay inventory. */
export function PawnCuriosities() {
  return <group>
    <Cube p={[0,.97,0]} s={[1.45,1.94,.76]} m={wood}/>
    {[.36,.91,1.48].map(y=><Cube key={y} p={[0,y,.01]} s={[1.3,.045,.7]} m={brass}/>)}
    {Array.from({length:9},(_,i)=><Trinket key={i} x={-.42+(i%3)*.42} y={.47+Math.floor(i/3)*.55} z={.05} variant={i}/>)}
    <Cube p={[0,1.02,.4]} s={[1.4,1.8,.025]} m={glass}/>
    {[-.7,.7].map(x=><Cube key={x} p={[x,1,.415]} s={[.035,1.85,.05]} m={brass}/>)}
    <Cube p={[0,1.9,.41]} s={[1.4,.035,.05]} m={brass}/>
  </group>;
}

function Guitar({ x,z }: {x:number;z:number}) {
  return <group position={[x,0,z]}>
    <mesh position={[0,.62,0]} material={wood} castShadow><sphereGeometry args={[.19,12,10]}/></mesh>
    <Cube p={[0,1.05,0]} s={[.075,.7,.065]} m={dark}/>
    <Cube p={[0,1.45,0]} s={[.14,.16,.07]} m={brass}/>
    <mesh position={[0,.69,.16]} material={dark}><circleGeometry args={[.07,20]}/></mesh>
  </group>;
}

export function PawnDecor() {
  const screen = useMemo(()=>new THREE.MeshStandardMaterial({color:"#253c40",roughness:.18,emissive:"#132a29",emissiveIntensity:.28}),[]);
  return <group>
    <VenueVisualPolish venue="pawn" />
    {/* Floor-to-ceiling salvage shelving, along the left wall. */}
    {[.7,2.1,3.5].map((z,j)=><group key={z}>
      <Cube p={[.62,1.25,z]} s={[1.15,2.45,1.15]} m={wood}/>
      {[.35,.97,1.58,2.2].map((y,i)=><group key={y}>
        <Cube p={[.62,y,z]} s={[1.12,.07,1.2]} m={brass}/>
        {Array.from({length:3},(_,n)=><Trinket key={n} x={.28+n*.34} y={y+.15} z={z+(n%2?-.2:.2)} variant={i+j+n}/>)}
      </group>)}
    </group>)}
    {/* Old monitors and second-hand consoles on the rear wall. */}
    {[-1.4,0,1.4].map((dx,i)=><group key={i} position={[5+dx,0,.5]}>
      <Cube p={[0,.65,0]} s={[1.1,.14,.65]} m={wood}/>
      <Cube p={[0,1.06,0]} s={[.85,.65,.16]} m={dark}/>
      <Cube p={[0,1.08,.09]} s={[.73,.5,.014]} m={screen}/>
      <Cube p={[0,.77,.15]} s={[.28,.13,.19]} m={silver}/>
    </group>)}
    {/* Guitars propped near the stock shelves and odd salvaged boxes. */}
    <Guitar x={2.15} z={.58}/>
    <Guitar x={2.42} z={.6}/>
    {[0,1,2].map(i=><group key={i} position={[3.65+(i%2)*1.8,0,4.35+i*.28]}>
      <Cube p={[0,.22,0]} s={[.7,.43,.6]} m={i===1?wood:cream}/>
      <Cube p={[0,.43,0]} s={[.72,.035,.62]} m={dark}/>
    </group>)}
    {/* Mismatched jewellery showcase and faded mat beneath the front counter. */}
    <Cube p={[5,.012,3.15]} s={[5.2,.025,1.75]} m={felt}/>
    <Cube p={[8.8,2.0,1.1]} s={[1.4,.09,.65]} m={wood}/>
    <Cube p={[8.8,1.0,1.1]} s={[1.35,1.8,.55]} m={wood}/>
    {[-.42,0,.42].map(x=><Trinket key={x} x={8.8+x} y={2.2} z={1.12} variant={Math.round(x*10)+8}/>)}
  </group>;
}
