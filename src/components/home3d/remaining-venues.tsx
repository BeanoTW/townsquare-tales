import * as THREE from "three";
const mat=(color:string,metalness=0)=>new THREE.MeshStandardMaterial({color,metalness,roughness:metalness?.45:.78});
const m={wood:mat("#7f5d41"),metal:mat("#838d90",.5),ink:mat("#30343b"),paper:mat("#e9e4d5"),glass:new THREE.MeshStandardMaterial({color:"#accbd4",transparent:true,opacity:.37,roughness:.14,depthWrite:false}),green:mat("#456e56"),red:mat("#a74e4c"),gold:mat("#bf974b",.5),cream:mat("#d6c7a8")};
function B({p,s,material=m.wood}:{p:[number,number,number];s:[number,number,number];material?:THREE.Material}) {
 return <mesh position={p} material={material} castShadow receiveShadow><boxGeometry args={s}/></mesh>;
}
function Shelf({col=m.wood}:{col?:THREE.Material}) {
 return <group>
  <B p={[0,.95,0]} s={[1.18,1.85,.63]} material={col}/>
  {[.32,.77,1.23,1.67].map((y,i)=><group key={i}>
   <B p={[0,y,.33]} s={[1.16,.045,.68]} material={m.metal}/>
   {[-.34,0,.34].map((x,j)=><B key={j} p={[x,y+.13,.15]} s={[.17,.23,.22]} material={[m.red,m.green,m.gold,m.paper][(i+j)%4]}/>)}
  </group>)}
 </group>;
}
function Desk({colour=m.wood}:{colour?:THREE.Material}){
 return <group>
  <B p={[0,.48,0]} s={[1.42,.92,.65]} material={colour}/>
  <B p={[0,.97,0]} s={[1.55,.075,.79]} material={m.cream}/>
  <B p={[.37,1.17,-.16]} s={[.46,.34,.06]} material={m.ink}/>
  <B p={[.37,1.18,-.118]} s={[.36,.23,.012]} material={m.green}/>
  <B p={[-.37,1.02,.1]} s={[.37,.025,.28]} material={m.paper}/>
 </group>;
}
function Board({colour=m.green}:{colour?:THREE.Material}){
 return <group>
  <B p={[0,1.05,0]} s={[1.22,1.88,.19]} material={m.wood}/>
  <B p={[0,1.12,.12]} s={[1.05,1.42,.04]} material={colour}/>
  {[-.35,.15,.55].map((y,i)=><group key={i}>
    <B p={[0,y+1.08,.153]} s={[.76,.095,.014]} material={m.paper}/>
  </group>)}
 </group>;
}
function Bed(){
 return <group>
 <B p={[0,.45,0]} s={[1.24,.36,.7]} material={m.cream}/>
 <B p={[-.47,.7,0]} s={[.22,.18,.57]} material={m.paper}/>
 <B p={[-.59,.75,0]} s={[.06,.93,.73]} material={m.metal}/>
 </group>;
}
function Sofa(){
 return <group>
 <B p={[0,.47,0]} s={[1.25,.45,.66]} material={m.red}/>
 <B p={[0,.84,-.29]} s={[1.2,.65,.13]} material={m.red}/>
 {[-.58,.58].map(x=><B key={x} p={[x,.6,0]} s={[.12,.45,.67]} material={m.wood}/>)}
 </group>;
}
function Kiosk(){
 return <group>
 <B p={[0,.6,0]} s={[1.36,1.1,.6]} material={m.metal}/>
 <B p={[0,1.23,0]} s={[1.36,.09,.7]} material={m.paper}/>
 <B p={[.32,1.36,-.14]} s={[.48,.23,.05]} material={m.ink}/>
 </group>;
}
export function RemainingVenueFixture({id,venue}:{id:string;venue:string}){
 if(["shelves","library","cabinet","vault"].includes(id))return <Shelf col={venue==="clinic"?m.cream:m.wood}/>;
 if(["shop-board","trades-board","vacancies","departures","wanted"].includes(id))return <Board colour={venue==="depot"?m.ink:m.green}/>;
 if(["bed-display","treatment-bed"].includes(id))return <Bed/>;
 if(id==="sofa-display"||id==="booth")return <Sofa/>;
 if(id==="atm")return <Kiosk/>;
 if(id==="classroom")return <group><Desk/><B p={[0,1.35,-.37]} s={[1.22,.08,.12]} material={m.green}/></group>;
 if(id==="site")return <group><B p={[0,.3,0]} s={[1.3,.55,.65]} material={m.gold}/><B p={[.28,.89,-.12]} s={[.1,.85,.1]} material={m.metal}/></group>;
 if(id==="kitchen")return <group><B p={[0,.47,0]} s={[1.3,.85,.62]} material={m.metal}/><B p={[0,.95,0]} s={[1.45,.08,.72]} material={m.cream}/>{[-.3,.3].map(x=><B key={x} p={[x,1.02,0]} s={[.27,.018,.28]} material={m.ink}/>)}</group>;
 return <Desk colour={venue==="bank"?m.green:venue==="work"?m.metal:m.wood}/>;
}
function Bench({x,z}:{x:number;z:number}) {
 return <group position={[x,0,z]}><B p={[0,.45,0]} s={[1.4,.11,.42]} material={m.wood}/><B p={[0,.75,-.16]} s={[1.4,.48,.09]} material={m.wood}/>{[-.55,.55].map(v=><B key={v} p={[v,.22,0]} s={[.06,.44,.37]} material={m.metal}/>)}</group>;
}
export function RemainingVenueDecor({venue}:{venue:string}){
 return <group>
   {/* Architecture and characteristic stock is positioned along the perimeter,
       preserving a generous route between interactive fixture slots. */}
   {venue==="shop"&&<><group position={[.65,0,.8]}><Shelf/></group><group position={[9.3,0,.9]}><Shelf/></group><B p={[9.24,1.1,6.6]} s={[.68,2.1,.74]} material={m.glass}/></>}
   {venue==="diner"&&<><Bench x={.95} z={6.3}/><Bench x={9} z={6.5}/><B p={[9.2,1.4,.55]} s={[1.3,1.65,.4]} material={m.metal}/></>}
   {venue==="furniture"&&<><Bench x={.85} z={6.7}/><B p={[9.2,.8,.65]} s={[1.25,1.6,.6]} material={m.wood}/></>}
   {venue==="bank"&&<><B p={[5.1,1.5,.4]} s={[2.2,2.8,.7]} material={m.metal}/><Bench x={.95} z={6.6}/><B p={[.7,1.9,.5]} s={[1.1,1.6,.2]} material={m.glass}/></>}
   {venue==="school"&&<><group position={[.7,0,.7]}><Shelf/></group><group position={[9.3,0,.7]}><Shelf/></group><Bench x={.95} z={6.6}/></>}
   {venue==="work"&&<><group position={[.75,0,.85]}><Shelf col={m.metal}/></group><B p={[9.4,1,.9]} s={[.75,1.85,.7]} material={m.metal}/><Bench x={.95} z={6.6}/></>}
   {venue==="yard"&&<><B p={[.75,.55,.75]} s={[1.1,1.1,1.0]} material={m.gold}/><B p={[9.28,.5,.8]} s={[1.1,1,.9]} material={m.metal}/><B p={[9.4,1.65,.45]} s={[.18,2.1,.15]} material={m.gold}/></>}
   {venue==="clinic"&&<><group position={[.67,0,.85]}><Shelf col={m.cream}/></group><B p={[9.4,.85,.5]} s={[.6,1.65,.65]} material={m.metal}/><Bench x={.95} z={6.65}/></>}
   {venue==="depot"&&<><Bench x={.95} z={5.6}/><Bench x={.95} z={6.7}/><B p={[5,1.9,.28]} s={[3,1.2,.16]} material={m.ink}/></>}
 </group>;
}
