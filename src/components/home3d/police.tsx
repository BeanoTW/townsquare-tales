import * as THREE from "three";
import { VenueVisualPolish } from "./venue-visual-polish";

// The reception keeps the classic hotspot arrangement: desk at left/front,
// wanted board at right/rear. All props are decorative and use the existing actions.
const navy = new THREE.MeshStandardMaterial({color:"#30455c",roughness:.7});
const blue = new THREE.MeshStandardMaterial({color:"#405e7d",roughness:.65});
const cream = new THREE.MeshStandardMaterial({color:"#dbe2e8",roughness:.8});
const steel = new THREE.MeshStandardMaterial({color:"#858f9d",roughness:.38,metalness:.65});
const dark = new THREE.MeshStandardMaterial({color:"#242a34",roughness:.66});
const paper = new THREE.MeshStandardMaterial({color:"#e9e4d7",roughness:1});
const cork = new THREE.MeshStandardMaterial({color:"#866c53",roughness:.95});
const glass = new THREE.MeshStandardMaterial({color:"#a6c3d2",roughness:.11,transparent:true,opacity:.34,depthWrite:false});
const red = new THREE.MeshStandardMaterial({color:"#bd5952",roughness:.6});
const teal = new THREE.MeshStandardMaterial({color:"#497b82",roughness:.65});
const box = (p:[number,number,number],s:[number,number,number],m:THREE.Material,key?:string)=>
  <mesh key={key} position={p} material={m} castShadow receiveShadow><boxGeometry args={s}/></mesh>;
const cyl = (p:[number,number,number],radius:number,height:number,m:THREE.Material,key?:string)=>
  <mesh key={key} position={p} material={m} castShadow><cylinderGeometry args={[radius,radius,height,12]}/></mesh>;

/** Enquiry desk with visitor-side counter, monitor, badge and paperwork. */
export function PoliceDesk(){
  return <group>
    {box([0,.49,0],[4.15,.91,1.07],navy)}
    {box([0,.975,0],[4.25,.09,1.18],cream)}
    {box([0,.54,.548],[4.03,.55,.045],blue)}
    {[-1.88,1.88].map(x=>box([x,.49,.58],[.045,.77,.025],steel,String(x)))}
    {box([.75,1.19,-.24],[.65,.46,.1],dark)}
    {box([.75,1.18,-.181],[.53,.34,.012],teal)}
    {box([.75,.99,-.2],[.08,.1,.11],steel)}
    {box([1.05,1.02,.16],[.55,.035,.28],steel)}
    {box([-.78,1.02,.12],[.55,.015,.36],paper)}
    {box([-.72,1.04,.05],[.3,.015,.03],navy)}
    {box([-1.48,1.06,.15],[.24,.12,.22],dark)}
    {cyl([-.01,1.09,.13],.08,.07,steel)}
    {box([-.01,1.142,.13],[.17,.025,.1],navy)}
    {box([0,.24,.552],[1.42,.22,.022],cream)}
  </group>;
}

/** Wall-mounted wanted/heat board retains the original inspection hotspot. */
export function WantedBoard(){
  return <group>
    {box([0,1.42,-.02],[1.7,1.45,.14],navy)}
    {box([0,1.43,.062],[1.52,1.25,.025],cork)}
    {Array.from({length:4},(_,i)=>{
      const x=(i%2)*.69-.35,z=.87+Math.floor(i/2)*.61;
      return <group key={i}>
        {box([x,z,.085],[.57,.48,.016],paper)}
        {box([x,z+.08,.105],[.22,.22,.008],steel)}
        {box([x,z-.12,.105],[.41,.018,.008],dark)}
        {cyl([x,z+.23,.115],.024,.016,red)}
      </group>;
    })}
    {box([0,2.23,.052],[1.7,.11,.13],steel)}
  </group>;
}

/** Reception is institutional rather than cartoon-clean: noticeboards,
 * fixed waiting seats, security glazing, filing cabinets and a holding door.
 * Layout-critical desk / wanted fixtures remain owned by their 3D slots. */
export function PoliceDecor(){
  return <group>
    <VenueVisualPolish venue="police"/>
    {/* Public waiting area along the west wall: distinct from reception desk. */}
    {[2.5,3.65].map((z,i)=><group key={i}>
      {box([.65,.47,z],[.7,.12,.59],blue)}
      {box([.33,.78,z],[.1,.69,.59],blue)}
      {[-.24,.24].map((off,j)=>box([.65,.23,z+off],[.065,.44,.06],steel,String(j)))}
    </group>)}
    {/* Security partition immediately behind the reception. */}
    {box([3.12,1.38,3.46],[4.55,1.18,.09],glass)}
    {box([3.12,2.03,3.46],[4.55,.055,.1],steel)}
    {[-2.2,2.2].map(x=>box([3.12+x,1.38,3.46],[.055,1.27,.1],steel,String(x)))}
    {/* Filing cabinets and paper trays at the back of the room. */}
    {[1.1,2.05,3].map((x,i)=><group key={i}>
      {box([x,.67,.44],[.73,1.32,.67],steel)}
      {[.25,.67,1.08].map((y,j)=><group key={j}>
        {box([x,y,.79],[.63,.025,.03],dark)}
        {box([x,y+.08,.81],[.18,.035,.015],navy)}
      </group>)}
    </group>)}
    {/* Coded staff door and security access point behind desk. */}
    {box([5.4,1.06,.15],[.9,2.05,.08],dark)}
    {box([5.4,1.1,.22],[.66,1.75,.035],blue)}
    {box([5.07,1.06,.247],[.11,.16,.025],steel)}
    {box([6,1.23,.28],[.19,.29,.05],dark)}
    {box([6,1.23,.317],[.13,.13,.01],teal)}
    {/* Public information board and a digital queue display. */}
    {box([7.6,2.08,.22],[1.85,.56,.1],navy)}
    {box([7.6,2.08,.279],[1.65,.38,.01],dark)}
    {box([7.6,1.83,.289],[.95,.035,.012],teal)}
    {box([9.54,1.42,5.35],[.1,1.9,1.5],cream)}
    {box([9.48,1.52,5.35],[.035,1.38,1.15],cork)}
    {/* Evidence lockers and stacked forms remain behind the public line. */}
    {[7.5,8.3,9.1].map((x,i)=><group key={i}>
      {box([x,.95,.44],[.68,1.88,.66],blue)}
      {[.35,.93,1.51].map((y,j)=>box([x,y,.785],[.46,.035,.025],steel,String(j)))}
    </group>)}
    {/* Queue bollards guide people to the existing reception counter. */}
    {[1.25,2.8,4.35].map((x,i)=><group key={i}>
      {cyl([x,.45,6.35],.035,.9,steel)}
      {cyl([x,.04,6.35],.14,.06,dark)}
      {cyl([x,.89,6.35],.09,.06,steel)}
      {i<2&&box([x+.775,.66,6.35],[1.45,.055,.03],navy)}
    </group>)}
    {/* Maintenance scuffs rather than extra walk-blocking fixtures. */}
    {box([6.4,.012,6.75],[2.1,.02,1.02],blue)}
    {box([6.4,.027,6.75],[1.9,.008,.08],cream)}
  </group>;
}
