import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";

/** A small, self-contained vignette: no quest marker and no new world map. */
function SeatedContact({ x, shirt }: { x: number; shirt: string }) {
 return <group position={[x,0,0]}>
  <mesh position={[0,0.64,0]} castShadow><cylinderGeometry args={[0.26,0.29,0.65,10]} /><meshStandardMaterial color={shirt}/></mesh>
  <mesh position={[0,1.16,0]} castShadow><sphereGeometry args={[0.24,12,10]}/><meshStandardMaterial color="#b89070"/></mesh>
  <mesh position={[-0.16,0.43,0.35]} rotation={[0.4,0,0]}><capsuleGeometry args={[0.075,0.38,4,8]}/><meshStandardMaterial color="#39343b"/></mesh>
  <mesh position={[0.16,0.43,0.35]} rotation={[0.4,0,0]}><capsuleGeometry args={[0.075,0.38,4,8]}/><meshStandardMaterial color="#39343b"/></mesh>
 </group>;
}
function Room() {
 return <>
  <ambientLight intensity={0.8}/>
  <pointLight position={[0,3.5,0.5]} intensity={28} distance={9} color="#ffc882" />
  <directionalLight position={[-3,5,6]} intensity={1.2}/>
  <mesh position={[0,-0.1,0]} receiveShadow><boxGeometry args={[7,0.2,5]}/><meshStandardMaterial color="#51483f"/></mesh>
  <mesh position={[0,1.75,-2.5]}><boxGeometry args={[7,3.5,0.18]}/><meshStandardMaterial color="#4f4b48"/></mesh>
  <mesh position={[-3.5,1.75,0]}><boxGeometry args={[0.18,3.5,5]}/><meshStandardMaterial color="#514b48"/></mesh>
  <mesh position={[3.5,1.75,0]}><boxGeometry args={[0.18,3.5,5]}/><meshStandardMaterial color="#514b48"/></mesh>
  <mesh position={[0,0.65,0.25]} castShadow><boxGeometry args={[2.6,0.14,1.15]}/><meshStandardMaterial color="#533725"/></mesh>
  {[-1,1].map(x=><mesh key={x} position={[x,0.31,0.25]}><boxGeometry args={[0.12,0.65,0.12]}/><meshStandardMaterial color="#302823"/></mesh>)}
  <mesh position={[0,1.74,-2.36]}><boxGeometry args={[1.4,0.9,0.07]}/><meshStandardMaterial color="#806b4b"/></mesh>
  <mesh position={[0,1.74,-2.29]}><boxGeometry args={[1.2,0.68,0.05]}/><meshStandardMaterial color="#222a2e"/></mesh>
  <SeatedContact x={0} shirt="#242c32"/>
  <SeatedContact x={-2} shirt="#53434c"/>
  <SeatedContact x={2} shirt="#4c5543"/>
  <mesh position={[2.9,0.8,-1.9]}><boxGeometry args={[0.8,1.6,0.65]}/><meshStandardMaterial color="#303236" metalness={0.5}/></mesh>
 </>;
}
export default function PawnBackroom3D() {
 return <div data-pawn-backroom-3d aria-label="Vince and two associates in the pawn shop back office" className="pointer-events-none absolute inset-x-0 top-0 h-[48%] min-h-[150px] overflow-hidden rounded-t-xl">
  <Suspense fallback={null}><Canvas shadows camera={{ position:[5,3.3,7],fov:48,near:0.1,far:50 }} gl={{antialias:true,alpha:false}}><color attach="background" args={["#34302e"]}/><Room/></Canvas></Suspense>
 </div>;
}
