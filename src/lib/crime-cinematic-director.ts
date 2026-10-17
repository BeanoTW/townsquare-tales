import {visualCueForAction,type CrimeVisualActor,type CrimeVisualCue} from "@/lib/crime-visual-cues";
import {UNDERWORLD_SCRIPTS} from "@/lib/underworld-story-script";
export type CameraShot="overhead"|"three-shot"|"speaker-close"|"over-shoulder"|"two-shot"|"wide";
export type DirectorBeat={speaker:CrimeVisualActor|null;focus:CrimeVisualActor;shot:CameraShot;gesture:"idle"|"talk"|"nod"|"shrug"|"glance"|"hand-over"|"pause";pauseMs:number};
export type ConversationCue={id:string;venue:string;cast:readonly CrimeVisualActor[];beats:readonly DirectorBeat[];returnShot:"overhead";};
export type DirectedCrimeCue={visual:CrimeVisualCue;beats:readonly DirectorBeat[];durationSeconds:number;skippable:true;reducedMotion:"static";};
const beat=(speaker:CrimeVisualActor|null,focus:CrimeVisualActor,shot:CameraShot,gesture:DirectorBeat["gesture"],pauseMs=0):DirectorBeat=>({speaker,focus,shot,gesture,pauseMs});
export function crewConversationCue(speaker:"mick"|"lez"|"nia",storyId?:number):ConversationCue{
 const cast=["mick","lez","nia","player"] as const;
 const reactions:Record<typeof speaker,CrimeVisualActor>={mick:"nia",lez:"mick",nia:"lez"};
 const reflective=storyId===5;
 return {id:storyId?`crew-story-${storyId}`:`crew-chat-${speaker}`,venue:"gang",cast,returnShot:"overhead",
 beats:[beat(speaker,speaker,"speaker-close","talk"),beat(null,reactions[speaker],"three-shot",reflective?"pause":"glance",reflective?900:300),beat(null,"player","over-shoulder","idle")]};
}
export function storyLocationConversationCue(id:number):ConversationCue|null{
 const script=UNDERWORLD_SCRIPTS[id];const scene=visualCueForAction("underworld-investigate-"+id);
 if(!script||!scene)return null;
 const other=scene.cast.find(actor=>actor!=="player")??"player";
 return {id:"underworld-venue-"+id,venue:scene.venue,cast:scene.cast,returnShot:"overhead",
 beats:[beat(other,other,"two-shot","talk"),beat(null,"player","over-shoulder","glance"),beat(null,other,"speaker-close","pause",id===5?850:250)]};
}
export function directedCrimeCue(actionId:string,mode:"full"|"short"|"off",reducedMotion=false):DirectedCrimeCue|null{
 if(mode==="off")return null;
 const visual=visualCueForAction(actionId);if(!visual)return null;
 const target=visual.cast.find(x=>x!=="player")??"player";
 const handover=["delivery","collection"].includes(visual.kind);
 return {visual,skippable:true,reducedMotion:"static",
 durationSeconds:reducedMotion?0:mode==="short"?Math.min(1.5,visual.suggestedDurationSeconds):visual.suggestedDurationSeconds,
 beats:reducedMotion?[beat(null,target,"wide","idle")]:[
  beat(null,"player","over-shoulder","glance"),
  beat(target,target,"two-shot",handover?"hand-over":visual.kind==="lookout"?"glance":"talk"),
  beat(null,target,"speaker-close",visual.tone==="reflective"?"pause":"shrug",visual.tone==="reflective"?900:230)
 ]};
}
