/** 3D upgrades for venues that previously used arcade/vector interiors.
 * All interaction IDs remain exactly the same; layouts are deliberately simple
 * and walkable, with each venue's established front desk / fixture arrangement.
 */
import type { HomePlan, Slot } from "./layout";
import type { VenueId } from "@/lib/home-zones";
import { wall, door, win } from "./plans";

type RemainingId = "shop"|"diner"|"furniture"|"bank"|"school"|"work"|"yard"|"clinic"|"depot";
type Config = {
 name:string; wall:string; floor:string; trim:string; floorKind:HomePlan["floors"][number]["kind"];
 fixtures: readonly [id:string,x:number,z:number,label:string,tag:string][];
};
const CONFIG: Record<RemainingId,Config> = {
 shop:{name:"General Store",wall:"#cfbaa0",floor:"#b8aa96",trim:"#51604e",floorKind:"tile",fixtures:[
 ["shelves",2.2,2.4,"Stocked shelves","SHOP"],["shop-board",7.8,1.5,"Notice board","JOBS"],
 ["back-office",8.0,3.5,"Stockroom","STAFF"],["checkout",4.4,5.3,"Checkout","BUY"]]},
 diner:{name:"Fryday Diner",wall:"#debfab",floor:"#ded5c1",trim:"#a84e47",floorKind:"checker",fixtures:[
 ["hiring",2.1,1.4,"Hiring notice","JOB"],["kitchen",8,2.1,"Kitchen pass","COOK"],
 ["counter",4.4,3.8,"Diner counter","EAT"],["booth",8.1,5.5,"Manager booth","WORK"]]},
 furniture:{name:"Cosy Corner",wall:"#dfc9af",floor:"#ab8467",trim:"#715242",floorKind:"boards",fixtures:[
 ["sofa-display",2.4,3.1,"Sofa display","SOFA"],["bed-display",7.7,2.8,"Bed display","BED"],
 ["catalogue",7.7,5.6,"Catalogue","BROWSE"]]},
 bank:{name:"Town Bank",wall:"#b8cdc3",floor:"#c3d4cd",trim:"#33645a",floorKind:"marble",fixtures:[
 ["teller",2.4,2.8,"Bank teller","BANK"],["atm",7.8,1.9,"Cash machine","ATM"],
 ["vault",7.8,4.1,"Bank vault","VAULT"],["loans",2.5,5.2,"Loan desk","LOANS"]]},
 school:{name:"Stick University",wall:"#ddd3bb",floor:"#9b856c",trim:"#4d6557",floorKind:"boards",fixtures:[
 ["library",2.3,2.4,"Library shelves","STUDY"],["classroom",7.7,2.6,"Classroom","LEARN"],
 ["admissions",4.9,5.5,"Admissions desk","JOIN"]]},
 work:{name:"Office",wall:"#b9cbd0",floor:"#84999e",trim:"#456373",floorKind:"tile",fixtures:[
 ["workstation",2.3,2.7,"Workstation","WORK"],["vacancies",7.8,1.7,"Vacancies board","APPLY"],
 ["manager",7.4,5.3,"Manager desk","PROMOTE"]]},
 yard:{name:"Construction Yard",wall:"#b7b0a4",floor:"#888579",trim:"#c99c36",floorKind:"concrete",fixtures:[
 ["site",2.2,2.5,"Work site","WORK"],["trades-board",7.8,1.5,"Trades board","JOBS"],
 ["foreman",7.3,5.2,"Foreman's cabin","BOSS"]]},
 clinic:{name:"Patch Up Clinic",wall:"#e0ece5",floor:"#c8d9d2",trim:"#579c8a",floorKind:"tile",fixtures:[
 ["treatment-bed",2.8,3,"Treatment bed","HEAL"],["cabinet",7.7,2.1,"Medical cabinet","SUPPLY"]]},
 depot:{name:"Town Transit",wall:"#bbced2",floor:"#879ca3",trim:"#4b7180",floorKind:"tile",fixtures:[
 ["departures",2.8,2.2,"Departures board","TIMES"],["ticket-hatch",7.3,4.6,"Ticket hatch","JOBS"]]},
};
const rect=(x0:number,z0:number,x1:number,z1:number)=>({x0,z0,x1,z1});
function makePlan(id:RemainingId,serial:number):HomePlan {
 const c=CONFIG[id],w=10,d=8,h=3.15;
 const slots:Slot[]=c.fixtures.map(([slotId,x,z,label,tag])=>({id:slotId as Slot["id"],x,z,rot:0,w:1.25,d:.8,zone:"floor",label,tag,labelY:1.9}));
 return {
  tier:20+serial,kind:id,name:c.name,size:{w,d,h},
  floors:[{zone:"floor",rect:rect(0,0,w,d),kind:c.floorKind,colour:c.floor}],
  walls:[
   wall("back",[0,0],[w,0],h,.2,[0,-1],true,c.wall,[],{style:id==="yard"?"block":"panel",trim:c.trim}),
   wall("front",[0,d],[w,d],h,.2,[0,1],true,c.wall,[win(.7,2.9,1,2.25),door(4.35,5.7,2.3),win(7.1,9.25,1,2.25)],{style:id==="yard"?"block":"panel",trim:c.trim}),
   wall("left",[0,0],[0,d],h,.2,[-1,0],true,c.wall,[],{style:"panel",trim:c.trim}),
   wall("right",[w,0],[w,d],h,.2,[1,0],true,c.wall,[],{style:"panel",trim:c.trim}),
  ],
  slots,focus:{all:rect(0,0,w,d),floor:rect(0,0,w,d)},
  rooms:[{zone:"floor",name:c.name,rect:rect(0,0,w,d)}],
  doors:[{a:[4.35,d],b:[5.7,d]}],
  spawn:{entry:[5,7.4],zones:{floor:[5,6.7]}},
  colliders:[],
  lights:{hemi:[c.wall,"#3c4447"],hemiBase:.85,hemiDay:.45,sunBase:.4,sunDay:1.25,sunTint:["#fff4df","#efb88c"],
   points:[{p:[2.8,2.8,2.8],colour:"#fff1d8",day:5,night:11,distance:7,decay:1.5},
           {p:[7.5,2.8,4.5],colour:"#f0f5ff",day:4,night:9,distance:6,decay:1.6}]},
  sky:{day:[c.wall,"#e6e3da"],night:["#28323b",c.trim]},
  base:{side:c.trim,top:c.floor,margin:.4},
  npcs:[{id:id+"-staff",name:"Staff",x:4.9,z:1.0,rot:0,pose:"stand",shirt:c.trim,skin:"#d4a583",hair:"#322c2d"}]
 };
}
export const REMAINING_VENUES = Object.fromEntries((Object.keys(CONFIG) as RemainingId[]).map((id,i)=>[id,makePlan(id,i)])) as Record<RemainingId,HomePlan>;
export const REMAINING_IDS = Object.keys(CONFIG) as RemainingId[];
export function isRemainingVenue(id:string):id is RemainingId{return Object.prototype.hasOwnProperty.call(CONFIG,id);}
