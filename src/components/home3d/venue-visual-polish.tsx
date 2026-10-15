import * as THREE from "three";

/** Small reusable visual details shared by venue models. All materials and
 * geometry are deliberately lightweight for mobile WebGL. No hit targets. */
const material = (color:string,roughness=.7,metalness=0) =>
  new THREE.MeshStandardMaterial({color,roughness,metalness});
const paint = {
  black:material("#262e34",.55), steel:material("#9aa5aa",.35,.55),
  timber:material("#644b38",.86), oak:material("#ad8b62",.78),
  paper:material("#e9ddc4",.95), white:material("#eee9dc",.86),
  teal:material("#43887b",.45), cream:material("#d9d3c5",.9),
  red:material("#ab5d4f",.65), blue:material("#47718d",.57),
  gold:material("#c7a465",.4,.35), yellow:material("#e4be60",.6),
  green:material("#6e956f",.7),
  glass:new THREE.MeshStandardMaterial({color:"#b5d8df",transparent:true,opacity:.28,depthWrite:false,roughness:.12}),
  screen:new THREE.MeshStandardMaterial({color:"#294d55",emissive:"#153a43",emissiveIntensity:.28,roughness:.24}),
};
function Box({at,size,finish=paint.timber}:{at:[number,number,number];size:[number,number,number];finish?:THREE.Material}){
 return <mesh position={at} material={finish} castShadow receiveShadow><boxGeometry args={size}/></mesh>;
}
function Tube({at,radius,height,finish=paint.steel,segments=10}:{at:[number,number,number];radius:number;height:number;finish?:THREE.Material;segments?:number}){
 return <mesh position={at} material={finish} castShadow><cylinderGeometry args={[radius,radius,height,segments]}/></mesh>;
}
function Frame({x,y,z,w=1.2,h=.7,color=paint.black}:{x:number;y:number;z:number;w?:number;h?:number;color?:THREE.Material}){
 return <group>
 <Box at={[x,y,z]} size={[w+.11,h+.11,.06]} finish={paint.timber}/>
 <Box at={[x,y,z+.038]} size={[w,h,.018]} finish={color}/>
 </group>;
}
function ProductRow({count=5,kind="grocery"}:{count?:number;kind?:"grocery"|"bottles"|"files"}){
 return <group>{Array.from({length:count},(_,i)=>{
  const x=(i-(count-1)/2)*(.85/count);
  const finish=kind==="files"?[paint.white,paint.teal,paint.blue][i%3]:[paint.yellow,paint.red,paint.green,paint.blue,paint.white][i%5];
  return <group key={i}>
   {kind==="bottles"?<><Tube at={[x,.14,.0]} radius={.045} height={.25} finish={finish}/><Tube at={[x,.295,0]} radius={.018} height={.065} finish={paint.white}/></>:
    <Box at={[x,.16,0]} size={[.76/count,.3,.16]} finish={finish}/>}
   <Box at={[x,.045,.09]} size={[.78/count,.018,.02]} finish={paint.paper}/>
  </group>;
 })}</group>;
}
function WallClock({x,z}:{x:number;z:number}){
 return <group position={[x,2.3,z]}>
  <mesh rotation={[Math.PI/2,0,0]} material={paint.black}><cylinderGeometry args={[.19,.19,.05,24]}/></mesh>
  <mesh position={[0,0,.036]} material={paint.white}><circleGeometry args={[.158,24]}/></mesh>
  <Box at={[0,.04,.055]} size={[.012,.095,.008]} finish={paint.black}/>
  <Box at={[.04,.015,.057]} size={[.078,.012,.008]} finish={paint.black}/>
 </group>;
}
function CeilingLight({x,z,w=1.5,color=paint.white}:{x:number;z:number;w?:number;color?:THREE.Material}){
 return <group>
  <Box at={[x,3.03,z]} size={[w,.055,.27]} finish={paint.steel}/>
  <Box at={[x,2.99,z]} size={[w-.15,.016,.16]} finish={color}/>
 </group>;
}
function Poster({x,z,tone=paint.teal}:{x:number;z:number;tone?:THREE.Material}){
 return <group>
  <Box at={[x,1.76,z]} size={[.77,1.0,.045]} finish={paint.timber}/>
  <Box at={[x,1.77,z+.035]} size={[.66,.9,.016]} finish={paint.paper}/>
  <Box at={[x,1.96,z+.048]} size={[.52,.32,.009]} finish={tone}/>
  {[1.66,1.55,1.45].map(y=><Box key={y} at={[x,y,z+.049]} size={[.49,.025,.007]} finish={paint.black}/>)}
 </group>;
}
function DividerStand({x,z}:{x:number;z:number}){
 return <group position={[x,0,z]}>
  <Tube at={[0,.47,0]} radius={.034} height={.9}/>
  <Tube at={[0,.05,0]} radius={.13} height={.08} finish={paint.black}/>
  <Tube at={[0,.94,0]} radius={.075} height={.06} finish={paint.gold}/>
 </group>;
}
/** Fittings anchored near walls and counters, outside gameplay colliders.
 * Each room has a coherent palette and a legible occupational identity. */
export function VenueVisualPolish({venue}:{venue:string}){
 const retail=venue==="shop"||venue==="pawn";
 return <group>
  <CeilingLight x={2.25} z={2.55} />
  <CeilingLight x={7.75} z={5.0} color={retail?paint.yellow:paint.white}/>
  {!["yard","casino","bar"].includes(venue)&&<WallClock x={8.95} z={.17}/>}
  {venue==="shop"&&<>
    <Poster x={5.1} z={.20} tone={paint.red}/>
    <group position={[9.1,0,5.85]}>
      <Box at={[0,1.08,0]} size={[1.1,2.05,.66]} finish={paint.black}/>
      <Box at={[0,1.11,.35]} size={[.9,1.75,.015]} finish={paint.glass}/>
      {[.35,.84,1.33,1.8].map((y,i)=><group key={i} position={[0,y,.15]}><Box at={[0,0,0]} size={[.85,.03,.4]} finish={paint.steel}/><ProductRow kind="bottles"/></group>)}
    </group>
  </>}
  {venue==="diner"&&<>
    <Frame x={4.85} y={2.0} z={.16} w={1.65} h={.87} color={paint.black}/>
    {[0,1,2].map(i=><group key={i} position={[4.45+i*.4,1.9,.215]}>
      <Box at={[0,0,0]} size={[.24,.025,.008]} finish={paint.white}/>
      <Box at={[0,-.13,0]} size={[.2,.018,.008]} finish={paint.yellow}/>
    </group>)}
    <group position={[9.1,0,.8]}><Box at={[0,.7,0]} size={[.7,1.4,.65]} finish={paint.steel}/><Box at={[0,1.27,.36]} size={[.5,.2,.01]} finish={paint.screen}/></group>
  </>}
  {venue==="furniture"&&<>
    <Poster x={5} z={.16} tone={paint.gold}/>
    <Box at={[.55,1.35,5.15]} size={[.45,.65,.45]} finish={paint.oak}/>
    <Box at={[.55,1.72,5.15]} size={[.48,.12,.48]} finish={paint.cream}/>
    <Box at={[8.95,.025,6.5]} size={[1.2,.025,.9]} finish={paint.gold}/>
  </>}
  {venue==="bank"&&<>
    <Frame x={5.3} y={2.25} z={.18} w={1.5} h={.6} color={paint.green}/>
    <Box at={[5.3,2.25,.24]} size={[1.25,.075,.014]} finish={paint.gold}/>
    {[1.65,2.9,4.15].map(x=><DividerStand key={x} x={x} z={6.3}/>)}
    <Box at={[2.9,.72,6.3]} size={[2.5,.035,.04]} finish={paint.teal}/>
  </>}
  {venue==="school"&&<>
    <Frame x={5.05} y={2} z={.15} w={2.0} h={1.0} color={paint.green}/>
    <Box at={[5.03,1.63,.23]} size={[1.7,.025,.016]} finish={paint.oak}/>
    <Poster x={8.9} z={.19} tone={paint.blue}/>
  </>}
  {venue==="work"&&<>
    <Frame x={4.85} y={2.1} z={.16} w={1.7} h={.82} color={paint.blue}/>
    <group position={[.55,0,5]}><Box at={[0,.95,0]} size={[.48,1.8,.48]} finish={paint.steel}/>{[.42,.98,1.5].map(y=><Box key={y} at={[0,y,.26]} size={[.35,.04,.019]} finish={paint.black}/>)}</group>
    <Poster x={8.85} z={.16} tone={paint.teal}/>
  </>}
  {venue==="yard"&&<>
    <Box at={[5.1,2.5,.2]} size={[2.3,.5,.09]} finish={paint.yellow}/>
    {[4.3,4.65,5,5.35,5.7].map(x=><Box key={x} at={[x,2.5,.26]} size={[.09,.4,.012]} finish={paint.black}/>)}
    <group position={[9.15,0,5.8]}><Box at={[0,.5,0]} size={[.65,1,.65]} finish={paint.gold}/><Box at={[0,1.05,0]} size={[.72,.1,.72]} finish={paint.black}/></group>
  </>}
  {venue==="clinic"&&<>
    <Poster x={4.9} z={.15} tone={paint.green}/>
    <Box at={[8.9,1.7,.22]} size={[.65,.65,.15]} finish={paint.white}/>
    <Box at={[8.9,1.7,.315]} size={[.16,.48,.015]} finish={paint.red}/>
    <Box at={[8.9,1.7,.323]} size={[.46,.16,.01]} finish={paint.red}/>
  </>}
  {venue==="depot"&&<>
    <Frame x={5} y={2.15} z={.18} w={2.4} h={.95} color={paint.black}/>
    {[1.85,2.05,2.25,2.45].map((y,i)=><group key={i}><Box at={[5,y,.22]} size={[2.1,.027,.011]} finish={paint.gold}/><Box at={[4.4,y+.065,.22]} size={[.7,.06,.01]} finish={paint.white}/></group>)}
    <Poster x={8.92} z={.2} tone={paint.blue}/>
  </>}
  {venue==="casino"&&<>
    <Frame x={7.5} y={2.4} z={.17} w={2.0} h={.64} color={paint.black}/>
    {[6.8,7.25,7.7,8.15].map((x,i)=><group key={i}>
      <Box at={[x,2.45,.215]} size={[.29,.36,.014]} finish={i%2?paint.gold:paint.red}/>
      <Box at={[x,2.27,.229]} size={[.24,.028,.011]} finish={paint.white}/>
    </group>)}
    <Box at={[4.8,.02,8.7]} size={[2.5,.015,1.2]} finish={paint.red}/>
  </>}
  {venue==="bar"&&<>
    <group position={[.45,0,.65]}><Box at={[0,1.0,0]} size={[.5,1.96,.4]} finish={paint.timber}/>{[.45,1.04,1.6].map(y=><Box key={y} at={[0,y,.22]} size={[.43,.03,.35]} finish={paint.gold}/>)}</group>
    <Poster x={6.1} z={.17} tone={paint.red}/>
    <Box at={[6.1,2.68,.15]} size={[1.35,.16,.12]} finish={paint.gold}/>
  </>}
  {venue==="gym"&&<>
    <Poster x={6.1} z={.17} tone={paint.yellow}/>
    <Box at={[2.3,.013,7.2]} size={[2.2,.02,1.25]} finish={paint.black}/>
    <Box at={[5.1,2.58,.15]} size={[2.7,.12,.12]} finish={paint.black}/>
    {[4.2,4.75,5.3,5.85].map((x,i)=><Box key={i} at={[x,2.58,.225]} size={[.25,.08,.012]} finish={i%2?paint.red:paint.yellow}/>)}
  </>}
  {venue==="pawn"&&<>
    <Poster x={5.2} z={.2} tone={paint.gold}/>
    <group position={[9.2,0,6]}><Box at={[0,.48,0]} size={[.68,.93,.48]} finish={paint.timber}/><Box at={[0,.96,0]} size={[.72,.055,.53]} finish={paint.gold}/></group>
  </>}
  {venue==="police"&&<>
    <Poster x={5.4} z={.15} tone={paint.blue}/>
    <Frame x={7.75} y={2.5} z={.16} color={paint.black}/>
    {[1.85,3.25].map(x=><DividerStand key={x} x={x} z={6.4}/>)}
    <Box at={[2.55,.65,6.4]} size={[1.35,.045,.05]} finish={paint.blue}/>
  </>}
 </group>;
}
