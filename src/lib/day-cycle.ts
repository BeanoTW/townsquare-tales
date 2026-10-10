import { ownsFurniture } from "@/lib/furniture";
export type SleepState={hour:number;energy:number;house:number;furniture:number;alarm:number};
const baseWake=[11,10,9,8];
const baseRecovery=[50,75,100,100];
/** Sleep advances a day. Better homes and beds improve rest; alarms gain usable time. */
export function sleepOutcome(s:SleepState) {
 const bed=ownsFurniture(s.furniture,"bed");
 const wake=Math.max(6,Math.min(14,(baseWake[s.house] ?? 11)-(bed?1:0)-(s.alarm?2:0)+Math.max(0,s.hour-22)));
 const recovery=Math.min(100,(baseRecovery[s.house]??50)+(bed?25:0)-Math.max(0,s.hour-22)*8);
 return {hour:wake,energy:Math.min(100,s.energy+Math.max(25,recovery))};
}
export function timeLabel(hour:number) {return `${String(Math.floor(hour)%24).padStart(2,"0")}:00`;}
