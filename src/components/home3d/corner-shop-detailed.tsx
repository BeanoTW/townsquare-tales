import * as THREE from "three";

/** Shop-only display kit. Uses shared geometries/materials and instancing for
 * product stock so mobile doesn't pay a draw call per cereal box. */
const mat=(color:string,roughness=.72,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const p={
 teak:mat("#73503a"),shelf:mat("#3c6660",.65),edge:mat("#c2b29b"),dark:mat("#262e30"),
 tile:mat("#ddd5c3"),chiller:mat("#aebdc1",.38,.4),silver:mat("#aeb1ad",.3,.6),
 yellow:mat("#dfbb6b"),red:mat("#b55a51"),blue:mat("#477b99"),green:mat("#6d9c76"),
 paper:mat("#f0e8d4"),orange:mat("#d99655"),screen:new THREE.MeshStandardMaterial({color:"#477c80",emissive:"#174b4b",emissiveIntensity:.55,roughness:.22}),
 glass:new THREE.MeshStandardMaterial({color:"#b4d6dd",transparent:true,opacity:.24,depthWrite:false,roughness:.09}),
 black:mat("#151e24"),
};
const swatches=[p.red,p.yellow,p.green,p.blue,p.orange,p.paper];
const geometry=new THREE.BoxGeometry(1,1,1);
function Block({at,scale,material=p.teak}:{at:[number,number,number],scale:[number,number,number],material?:THREE.Material}){
 return <mesh geometry={geometry} material={material} position={at} scale={scale} castShadow receiveShadow/>;
}
function Line({at,width=.8,material=p.paper}:{at:[number,number,number],width?:number,material?:THREE.Material}){
 return <Block at={at} scale={[width,.024,.012]} material={material}/>;
}
/** One instanced mesh per merchandise colour, several shelves, dozens of products. */
function Stock({levels=4,columns=8,depth=.7}:{levels?:number,columns?:number,depth?:number}){
 const count=levels*columns;
 const transforms=Array.from({length:swatches.length},()=>[] as THREE.Matrix4[]);
 const cube=new THREE.Object3D();
 for(let i=0;i<count;i++){
   const tier=Math.floor(i/columns),col=i%columns;
   const x=(col-(columns-1)/2)*(.98/columns);
   cube.position.set(x,.31+tier*.44,depth*.1);
   cube.rotation.set(0,((i*11)%7-3)*.025,0);
   cube.scale.set(.82/columns,.24+(i%3)*.035,.17+(i%2)*.045);
   cube.updateMatrix();
   transforms[i%swatches.length]!.push(cube.matrix.clone());
 }
 return <group>{transforms.map((batch,j)=><instancedMesh key={j} args={[geometry,swatches[j]!,batch.length]} castShadow
 ref={mesh=>{if(!mesh)return;batch.forEach((matrix,i)=>mesh.setMatrixAt(i,matrix));mesh.instanceMatrix.needsUpdate=true;}}/>)}</group>;
}
function MerchandiseBay({x=0,z=0,rotation=0,small=false}:{x?:number,z?:number,rotation?:number,small?:boolean}){
 return <group position={[x,0,z]} rotation={[0,rotation,0]} scale={small?.8:1}>
  <Block at={[0,1.03,-.28]} scale={[1.18,2.05,.12]} material={p.shelf}/>
  {[-.54,.54].map(v=><Block key={v} at={[v,1.05,0]} scale={[.09,2.07,.69]} material={p.shelf}/>)}
  {[.23,.66,1.1,1.54,1.98].map((h,i)=><group key={i}>
    <Block at={[0,h,.02]} scale={[1.16,.05,.74]} material={p.edge}/>
    {i<4&&<group position={[0,h,0]}><Stock levels={1} columns={9}/></group>}
    {i<4&&<Block at={[0,h+.03,.405]} scale={[1.04,.05,.015]} material={i%2?p.yellow:p.paper}/>}
  </group>)}
  <Block at={[0,2.17,-.28]} scale={[1.26,.19,.15]} material={p.dark}/>
  <Block at={[0,2.17,-.191]} scale={[1.09,.08,.012]} material={p.paper}/>
 </group>;
}
function Bottle({x=0,y=0,z=0,colour=p.green}:{x?:number,y?:number,z?:number,colour?:THREE.Material}){
 return <group position={[x,y,z]}>
  <mesh position={[0,.14,0]} material={colour} castShadow><cylinderGeometry args={[.059,.069,.27,9]}/></mesh>
  <mesh position={[0,.31,0]} material={p.paper}><cylinderGeometry args={[.027,.027,.075,9]}/></mesh>
  <mesh position={[0,.14,.062]} material={p.paper}><boxGeometry args={[.075,.07,.009]}/></mesh>
 </group>;
}
function DrinksFridge({x,z,rotation=0}:{x:number,z:number,rotation?:number}){
 return <group position={[x,0,z]} rotation={[0,rotation,0]}>
  <Block at={[0,1.14,0]} scale={[1.35,2.25,.66]} material={p.dark}/>
  <Block at={[0,2.23,.29]} scale={[1.34,.17,.09]} material={p.blue}/>
  {[.42,.95,1.48,1.91].map((h,i)=><group key={i}>
    <Block at={[0,h,.12]} scale={[1.19,.045,.47]} material={p.silver}/>
    {Array.from({length:8},(_,j)=><Bottle key={j} x={(j-3.5)*.14} y={h+.035} z={.2} colour={swatches[(i+j)%5]}/>)}
  </group>)}
  <Block at={[0,1.22,.348]} scale={[1.23,1.91,.025]} material={p.glass}/>
  <Block at={[.02,1.22,.37]} scale={[.032,1.88,.04]} material={p.silver}/>
  <Block at={[.61,1.18,.39]} scale={[.035,.58,.06]} material={p.silver}/>
  <Block at={[-.59,1.18,.39]} scale={[.035,.58,.06]} material={p.silver}/>
  <Block at={[0,.11,.34]} scale={[1.22,.13,.06]} material={p.silver}/>
 </group>;
}
function Freezer({x,z}:{x:number,z:number}){
 return <group position={[x,0,z]}>
  <Block at={[0,.52,0]} scale={[1.24,1.03,.76]} material={p.tile}/>
  <Block at={[0,1.06,0]} scale={[1.27,.08,.82]} material={p.silver}/>
  <Block at={[0,1.108,0]} scale={[1.14,.019,.69]} material={p.glass}/>
  <Line at={[0,1.13,.39]} material={p.dark}/>
  <Block at={[0,.42,.391]} scale={[1.08,.33,.026]} material={p.blue}/>
 </group>;
}
function Checkout(){
 return <group>
  <Block at={[0,.47,0]} scale={[1.52,.88,.85]} material={p.teak}/>
  <Block at={[0,.95,0]} scale={[1.63,.09,.98]} material={p.tile}/>
  <Block at={[0,.48,.44]} scale={[1.45,.72,.06]} material={p.shelf}/>
  <Block at={[0,1.012,.24]} scale={[.89,.021,.4]} material={p.dark}/>
  <Block at={[-.44,1.27,-.24]} scale={[.49,.48,.095]} material={p.black}/>
  <Block at={[-.44,1.28,-.181]} scale={[.39,.34,.016]} material={p.screen}/>
  <Block at={[-.44,1.02,-.22]} scale={[.06,.08,.14]} material={p.silver}/>
  <Block at={[.45,1.08,.12]} scale={[.23,.14,.36]} material={p.black}/>
  <Block at={[.45,1.151,.12]} scale={[.18,.012,.21]} material={p.screen}/>
  <Block at={[.02,1.03,-.29]} scale={[.27,.13,.3]} material={p.silver}/>
  <Block at={[.02,1.1,-.28]} scale={[.2,.012,.2]} material={p.yellow}/>
  <Block at={[.07,.94,.47]} scale={[1.07,.028,.025]} material={p.paper}/>
  <Block at={[0,.12,.46]} scale={[1.45,.15,.055]} material={p.dark}/>
 </group>;
}
function Stockroom(){
 return <group>
  <Block at={[0,.9,-.23]} scale={[1.35,1.8,.24]} material={p.teak}/>
  <Block at={[0,.97,-.08]} scale={[1.21,1.5,.024]} material={p.shelf}/>
  <Block at={[0,1.81,-.045]} scale={[1.12,.21,.02]} material={p.dark}/>
  <Block at={[0,1.81,-.028]} scale={[.93,.067,.015]} material={p.paper}/>
  {[-.38,.12,.59].map((h,i)=><group key={i}>
    <Block at={[0,h+.48,.09]} scale={[1.15,.045,.32]} material={p.silver}/>
    {[-.32,.08,.41].map((x,j)=><Block key={j} at={[x,h+.63,.08]} scale={[.25,.25,.22]} material={swatches[(i+j)%6]}/>)}
  </group>)}
 </group>;
}
export function CornerShopFixture({id}:{id:string}){
 switch(id){
  case "shelves":return <group><MerchandiseBay x={-.53} z={-.08}/><MerchandiseBay x={.53} z={-.08}/></group>;
  case "checkout":return <Checkout/>;
  case "back-office":return <Stockroom/>;
  default:return null;
 }
}
/** Perimeter units and signage leave the centre aisle and all gameplay slots free. */
export function CornerShopDecor(){
 return <group>
  <MerchandiseBay x={.8} z={.48} small/>
  <MerchandiseBay x={2.3} z={.45} small/>
  <MerchandiseBay x={6.8} z={.47} small/>
  <DrinksFridge x={9.12} z={1.8} rotation={-Math.PI/2}/>
  <Freezer x={9.13} z={6.55}/>
  <group position={[.72,0,5.5]} rotation={[0,Math.PI/2,0]}><MerchandiseBay small/></group>
  <Block at={[4.95,2.63,.26]} scale={[2.3,.38,.14]} material={p.shelf}/>
  <Block at={[4.95,2.65,.35]} scale={[1.94,.17,.016]} material={p.paper}/>
  <Block at={[4.95,2.52,.352]} scale={[1.55,.027,.018]} material={p.yellow}/>
  {/* Ceiling unit and security mirrors anchor the scene visually. */}
  {[2.3,5.25,8.2].map(x=><group key={x}>
    <Block at={[x,3.02,3.5]} scale={[1.65,.08,.24]} material={p.silver}/>
    <Block at={[x,2.968,3.5]} scale={[1.5,.025,.13]} material={p.paper}/>
  </group>)}
  <mesh position={[9.5,2.65,7.35]} rotation={[0,-Math.PI/4,0]} material={p.silver}>
    <sphereGeometry args={[.24,16,8,0,Math.PI*2,0,Math.PI/2]}/>
  </mesh>
 </group>;
}
