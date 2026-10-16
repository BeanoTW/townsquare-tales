import type { GameState } from "@/lib/game-state";
import { parseGame } from "@/lib/game-state";

const prefix="sticktown:manual:";
const backupKey="sticktown:pre-restore";
export type SlotSummary={slot:number;day:number};
type Envelope={game:"townsquare-tales";version:1;savedAt:string;state:GameState};
const pack=(s:GameState):Envelope=>({game:"townsquare-tales",version:1,savedAt:new Date().toISOString(),state:s});
function unpack(raw:string|null,fallback:GameState):GameState|null{
 if(!raw)return null;
 try{const x:unknown=JSON.parse(raw);
   if(!x||typeof x!=="object")return null;
   const e=x as Partial<Envelope>;
   if(e.game!=="townsquare-tales"||e.version!==1||!e.state||typeof e.state.day!=="number"||typeof e.state.money!=="number")return null;
   return parseGame(JSON.stringify(e.state),fallback);
 }catch{return null;}
}
export function saveSlot(slot:number,s:GameState):boolean{
 if(typeof window==="undefined"||slot<1||slot>3)return false;
 try{localStorage.setItem(prefix+slot,JSON.stringify(pack(s)));return true;}catch{return false;}
}
export function readSlot(slot:number,fallback:GameState):GameState|null{
 if(typeof window==="undefined"||slot<1||slot>3)return null;
 try{return unpack(localStorage.getItem(prefix+slot),fallback);}catch{return null;}
}
export function localSlots():SlotSummary[]{
 if(typeof window==="undefined")return [];
 const result:SlotSummary[]=[];
 for(let slot=1;slot<=3;slot++){try{const s=JSON.parse(localStorage.getItem(prefix+slot)||"null") as Partial<Envelope>|null;
   if(s?.game==="townsquare-tales"&&typeof s.state?.day==="number")result.push({slot,day:s.state.day});
 }catch{/* Don't affect other save slots */}}
 return result;
}
export function backupSave(s:GameState):boolean{
 if(typeof window==="undefined")return false;
 try{localStorage.setItem(backupKey,JSON.stringify(pack(s)));return true;}catch{return false;}
}
export const importSave=(raw:string,fallback:GameState):GameState|null=>unpack(raw,fallback);
export function exportSave(s:GameState):void{
 if(typeof document==="undefined")return;
 const url=URL.createObjectURL(new Blob([JSON.stringify(pack(s),null,2)],{type:"application/json"}));
 const a=document.createElement("a");a.href=url;a.download="town-square-tales-day-"+s.day+".json";document.body.append(a);a.click();a.remove();
 window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
