import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { OverheadPerson } from "@/components/OverheadPerson";
import { P } from "@/lib/town-projection";
import { residentsAt, RELATION_FIELDS, type ResidentId } from "@/lib/living-town";
import type { GameState } from "@/lib/game-state";
import { isWalkable, type Point, type Obstacle } from "@/lib/pathfinding";
import { AMBIENT_ROUTES, ambientVisible, makeActor, moveActor, PIGEON_FLOCKS, moveBird, townAtmosphere, type StreetBird, residentBark, routineGoal, SPEECH_COOLDOWN, SPEECH_SECONDS, STREET_OBJECTS, newEncounterMemory, updateEncounter, reactionTarget, type EncounterMemory, type StreetActor, type StreetObjectId } from "@/lib/street-life";

type Player = Point & { walking: boolean };
export type ResidentPositions = Partial<Record<ResidentId, StreetActor>>;
export function StreetLife({ player, positions, lots, state, skating, paused, onResident, onObject, onIncident, feedback = null }: {
  player: MutableRefObject<Player>; positions: MutableRefObject<ResidentPositions>; lots: Obstacle[];
  state: GameState; skating: boolean; paused: boolean; onResident: (id: ResidentId, p: Point) => void; onObject: (id: StreetObjectId) => void; onIncident?: ((id: ResidentId) => void) | undefined; feedback?: StreetObjectId | null;
}) {
  const groups = useRef<Record<string, SVGGElement | null>>({});
  const birds = useRef<Record<string, SVGGElement | null>>({});
  const extras = useRef<Record<string, StreetActor>>({});
  const memories = useRef<Record<string, EncounterMemory>>({});
  const config = useRef({ state, skating, paused, lots, onIncident });
  config.current = { state, skating, paused, lots, onIncident };
  const [speech, setSpeech] = useState<{ id: string; text: string; x: number; y: number } | null>(null);
  const cooldown = useRef<Record<string, number>>({});
  const selectedUntil = useRef<Record<string, number>>({});
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now(), nextSpeech = 0, speechUntil = 0, visibleId = "";
    const flockActors: Record<string, StreetBird> = {};
    let previous = {x:player.current.x,y:player.current.y};
    const update = (now: number) => {
      raf = requestAnimationFrame(update);
      if (now - last < (reduced ? 100 : 50)) return;
      const dt = Math.min(.1, (now-last)/1000); last = now;
      const seconds = now / 1000, { state: s, lots: obstacles, skating: board, paused: frozen } = config.current;
      const me = player.current;
      const velocity = {x:(me.x-previous.x)/dt,y:(me.y-previous.y)/dt};
      previous = {x:me.x,y:me.y};
      if (speechUntil && seconds > speechUntil) { setSpeech(null); speechUntil = 0; visibleId = ""; }
      const speak = (id: string, text: string, actor: Point) => {
        // Only a single bubble, near the camera centre and clear of the HUD.
        if (frozen || seconds < nextSpeech || seconds < (cooldown.current[id] ?? 0) || Math.abs(actor.x-me.x)>2.5 || actor.y < me.y-2.7 || actor.y > me.y+3.8) return;
        setSpeech({ id, text, ...actor }); visibleId = id; speechUntil = seconds + SPEECH_SECONDS;
        nextSpeech = speechUntil + 3; cooldown.current[id] = seconds + SPEECH_COOLDOWN;
      };
      for (const schedule of residentsAt(s.hour)) {
        let actor = positions.current[schedule.id];
        if (!actor) { actor = makeActor(schedule, obstacles); positions.current[schedule.id] = actor; }
        const group = groups.current[schedule.id];
        const distance = Math.hypot(actor.x-me.x, actor.y-me.y);
        const goal = routineGoal(schedule.id, schedule, s.hour, actor.trip);
        const obstructed = actor.path.length > 0 && distance < .85;
        const selected = seconds < (selectedUntil.current[schedule.id] ?? 0);
        if (!frozen && !selected) {
          if (actor.path.length === 0 && seconds >= actor.pauseUntil) {
            actor.trip++;
            actor.pauseUntil = seconds + 10 + (schedule.id === "gus" ? 8 : 0);
          }
          const memory = memories.current[schedule.id] ??= newEncounterMemory();
          const context = updateEncounter(memory,actor,me,velocity,board,schedule.id === "nox" && s.gangRep >= 20 ? "ally" : schedule.id,seconds,dt);
          if (context) {
            if (memory.kind === "yield" || memory.kind === "dodge") memory.target = reactionTarget(actor,me,obstacles);
            speak(schedule.id,residentBark(schedule.id,s,context,memory.sequence-1),actor);
            if (context === "blocked" || context === "skating") config.current.onIncident?.(schedule.id);
          }
          if (seconds < memory.activeUntil && memory.target) moveActor(actor,memory.target,obstacles,dt);
          else moveActor(actor,goal,obstacles,dt,obstructed || seconds < actor.pauseUntil || seconds < memory.recoveryUntil);
          // Friends may greet on a fresh approach, never continually while standing nearby.
          if (distance < 1.8 && memory.armed && seconds >= memory.cooldownUntil && s[RELATION_FIELDS[schedule.id]] >= 4) {
            speak(schedule.id,residentBark(schedule.id,s,"passing"),actor);
            memory.cooldownUntil = seconds + SPEECH_COOLDOWN;
          }
        } else actor.walking = false;
        if (distance < 1.8 && !actor.walking) actor.angle = Math.atan2(me.x-actor.x, -(me.y-actor.y))*180/Math.PI;
        if (group) {
          const [x,y] = P(actor.x,actor.y); group.setAttribute("transform",`translate(${x} ${y})`);
          group.setAttribute("data-reaction",seconds < (memories.current[schedule.id]?.activeUntil ?? 0) ? memories.current[schedule.id]?.kind ?? "" : "");
          group.setAttribute("data-walking",String(actor.walking));
          group.setAttribute("data-world-x",String(actor.x)); group.setAttribute("data-world-y",String(actor.y));
          const body = group.querySelector("[data-body-heading]"); body?.setAttribute("transform",`rotate(${actor.angle})`);
          const arms = group.querySelector("[data-person-arms]");
          arms?.setAttribute("transform",`rotate(${!reduced && (actor.walking || seconds < (memories.current[schedule.id]?.activeUntil ?? 0)) ? Math.sin(seconds*5)*9 : 0} 0 -7)`);
          const sitting = schedule.id === "gus" && Math.hypot(actor.x-8,actor.y-10.8)<.65 && !actor.walking;
          const legs = group.querySelector("[data-resting-legs]"); legs?.setAttribute("visibility",sitting ? "visible" : "hidden");
          group.setAttribute("data-resting",String(sitting));
          if (visibleId === schedule.id) {
            const bubble = groups.current["speech"];
            bubble?.setAttribute("transform",`translate(${x} ${y-37})`);
          }
        }
      }
      for (const route of AMBIENT_ROUTES) {
        const group = groups.current[route.id]; if (!group) continue;
        const visible = ambientVisible(route.id,s.hour);
        group.setAttribute("visibility",visible ? "visible" : "hidden"); if (!visible) continue;
        const stops = s.hour >= 18 ? route.evening : route.morning;
        const actor = extras.current[route.id] ?? makeActor(stops[0],obstacles); extras.current[route.id] = actor;
        if (actor.path.length === 0 && seconds >= actor.pauseUntil) { actor.trip++; actor.pauseUntil=seconds+6; }
        const distance = Math.hypot(actor.x-me.x,actor.y-me.y);
        const memory = memories.current[route.id] ??= newEncounterMemory();
        if (!frozen) {
          const context = updateEncounter(memory,actor,me,velocity,board,route.id,seconds,dt);
          if(context) {
            if(memory.kind === "yield" || memory.kind === "dodge") memory.target = reactionTarget(actor,me,obstacles);
            speak(route.id,context === "skating" ? "Oi! Watch where you're going!" : context === "blocked" ? "Somewhere else to stand?" : route.line,actor);
          }
          if(seconds < memory.activeUntil && memory.target) moveActor(actor,memory.target,obstacles,dt);
          else moveActor(actor,stops[actor.trip%2] ?? stops[0],obstacles,dt,distance<.8 || seconds<actor.pauseUntil || seconds<memory.recoveryUntil);
        } else actor.walking = false;
        const [x,y] = P(actor.x,actor.y); group.setAttribute("transform",`translate(${x} ${y})`);
        group.querySelector("[data-body-heading]")?.setAttribute("transform",`rotate(${actor.angle})`);
        group.querySelector("[data-person-arms]")?.setAttribute("transform",`rotate(${!reduced && actor.walking ? Math.sin(seconds*5)*9 : 0} 0 -7)`);

      }
      PIGEON_FLOCKS.forEach((flock, index) => {
        for(let i=0;i<3;i++) {
          const key=`${index}-${i}`, bird = birds.current[key]; if(!bird)continue;
          const home={x:flock.x+i*.15,y:flock.y};
          const actor=flockActors[key] ??= {...home,angle:i*120,scatterUntil:0,armed:true};
          if(frozen)continue;
          const scatter=moveBird(actor,home,me,seconds,dt,i,obstacles,reduced);
          const [x,y]=P(actor.x,actor.y);
          bird.setAttribute("transform",`translate(${x} ${y}) rotate(${actor.angle})`);
          bird.setAttribute("data-scattering",String(scatter));
          bird.querySelector("[data-wing]")?.setAttribute("opacity",scatter && !reduced ? String(.3+Math.abs(Math.sin(seconds*12))*.7) : "0");
        }
      });
    };
    raf=requestAnimationFrame(update);
    return () => cancelAnimationFrame(raf);
  }, [player, positions]);
  const clickResident = (id:ResidentId) => {
    const p=positions.current[id]; if(!p)return;
    selectedUntil.current[id]=performance.now()/1000+40;
    onResident(id,p);
  };
  const schedules=residentsAt(state.hour);
  const atmosphere=townAtmosphere(state.hour);
  return <g data-street-life data-town-period={atmosphere.period} data-town-paused={paused}>
    {STREET_OBJECTS.map(object => <g key={object.id} transform={`translate(${P(object.x,object.y).join(" ")})`} data-street-object={object.id} data-action-feedback={feedback===object.id}
      role="button" tabIndex={0} aria-label={object.label} className="street-target" onClick={e=>{e.stopPropagation();onObject(object.id);}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onObject(object.id);}}}>
      {feedback===object.id && <ellipse data-street-feedback-halo rx="27" ry="15" cy="4" fill="var(--town-window-lit)" opacity=".35" pointerEvents="none"/>}
      {object.kind === "ramp" ? <g stroke="var(--town-ink)" strokeWidth="2"><path d="M-37 10v-30Q0 5 37 -20v30Z" fill="var(--town-sidewalk)"/><path d="M-37 -20Q0 5 37 -20" fill="none"/><text x="-22" y="6" fontSize="10" fill="var(--town-ink)">NO FUTURE</text><path d="M-30 20h55m-48 0v8m40-8v8"/></g> : object.kind === "hoop" ? <g stroke="var(--town-ink)" strokeWidth="2"><path d="M0 -15v35"/><rect x="-19" y="-38" width="38" height="24" fill="var(--town-paper)"/><ellipse cy="-14" rx="10" ry="4" fill="none"/><path d="M-9 -13l4 12h10l4-12M-14 28h28" fill="none"/><circle cx="20" cy="18" r="7" fill="var(--town-depot-sign)"/></g> : object.kind === "hide" ? <g fill="var(--town-park)" stroke="var(--town-ink)"><ellipse cx="-14" rx="19" ry="16"/><ellipse cy="-6" rx="19" ry="19"/><ellipse cx="17" rx="19" ry="16"/><title>Municipal witness protection</title></g> : object.kind === "litter" ? <g className={feedback==="litter" ? "town-litter-kicked" : ""}><path d="M-6 -4l12 3 -2 8 -10 -3Z" fill="var(--town-paper)" stroke="var(--town-grime)"/><title>Receipt: emotional damages not refundable</title></g> : object.kind === "newspaper" ? <g><rect x="-10" y="-24" width="20" height="28" fill="var(--town-vending)" stroke="var(--town-ink)"/><rect x="-7" y="-20" width="14" height="12" fill="var(--town-bubble)"/><path d="M-5 -16h10M-5 -12h7" stroke="var(--town-ink)"/></g> : object.kind === "bench" ? <g stroke="var(--town-ink)" strokeWidth="2"><path d="M-22 -9h44M-22 -3h44" stroke="var(--town-tree-trunk)" strokeWidth="6"/><path d="M-18 -2v12M18 -2v12"/></g> : object.kind === "bin" ? <g><rect x="-10" y="-20" width="20" height="27" rx="3" fill="var(--town-bin)" stroke="var(--town-ink)" strokeWidth="2"/><path d="M-12 -20h24M-5 -15v16M5 -15v16" stroke="var(--town-ink)" strokeWidth="2"/></g> : <g><rect x="-14" y="-37" width="28" height="44" rx="2" fill="var(--town-vending)" stroke="var(--town-ink)" strokeWidth="2"/><rect x="-9" y="-31" width="14" height="21" fill="var(--town-glass)"/><path d="M-6 -26h8M-6 -20h8M-6 -14h8" stroke="var(--town-window-lit)" strokeWidth="3"/><path d="M-7 0h14" stroke="var(--town-ink)" strokeWidth="4"/></g>}
      <rect x="-25" y="-40" width="50" height="54" fill="transparent"/><title>{object.label}</title>
    </g>)}
    {schedules.map(person => {const p=positions.current[person.id] ?? person;return <g key={person.id} ref={el=>{groups.current[person.id]=el;}} transform={`translate(${P(p.x,p.y).join(" ")})`} data-resident={person.id} role="button" tabIndex={0} aria-label={`Talk to ${person.name}`} className="street-target"
      onClick={e=>{e.stopPropagation();clickResident(person.id);}} onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();clickResident(person.id);}}}>
      <OverheadPerson outline={person.color} pose={person.id==="gus"?"sitting":"standing"}/>
      <g transform="translate(0 -27)"><rect x="-21" y="-12" width="42" height="16" rx="4" fill="var(--town-bubble)" stroke="var(--town-ink)"/><text textAnchor="middle" y="0" fontSize="11" fill="var(--town-ink)">{person.name}</text></g>
      <rect x="-25" y="-35" width="50" height="56" fill="transparent"/>
    </g>;})}
    {AMBIENT_ROUTES.map(route=><g key={route.id} ref={el=>{groups.current[route.id]=el;}} transform={`translate(${P(route.morning[0].x,route.morning[0].y).join(" ")})`} visibility={ambientVisible(route.id,state.hour)?"visible":"hidden"} data-street-pedestrian={route.id}><OverheadPerson outline={route.color} {...(route.id==="foreman-helper" ? {hat:"var(--town-window-lit)"} : {})}/></g>)}
    {PIGEON_FLOCKS.flatMap((flock,index)=>[0,1,2].map(i=><g key={`${index}-${i}`} ref={el=>{birds.current[`${index}-${i}`]=el;}} transform={`translate(${P(flock.x+i*.15,flock.y).join(" ")})`} data-pigeon><ellipse rx="4" ry="6" fill="var(--town-pigeon)" stroke="var(--town-ink)" strokeWidth=".7"/><circle cy="-5" r="2.6" fill="var(--town-pigeon-neck)"/><path d="M-2 -7L0 -10L2 -7" fill="var(--town-lane-paint)"/><path data-wing d="M-3 0L-9 5M3 0L9 5" stroke="var(--town-pigeon)" strokeWidth="3" opacity="0"/></g>))}
    {/* Wind-blown receipts stay clear of doors, with no gameplay cost. */}
    {[{x:8.1,y:14.3}].map((p,i)=><g key={`receipt-${i}`} transform={`translate(${P(p.x,p.y).join(" ")})`} pointerEvents="none" data-street-receipt><g className="town-receipt" style={{animationDelay:`${i*-4}s`}}><path d="M-4 -3l9 2 -1 5 -8 -2Z" fill="var(--town-paper)" stroke="var(--town-grime)" strokeWidth=".8"/><title>{i ? "Receipt: emotional damages not refundable" : "MegaCorp receipt: one soul, no change"}</title></g></g>)}
    {/* Minimal street wear, clear of every doorway. */}
    {[{x:8.1,y:14.3},{x:21.6,y:15.2},{x:11.4,y:27.7}].map((p,i)=><g key={i} transform={`translate(${P(p.x,p.y).join(" ")})`} pointerEvents="none"><path d="M-14 -2l7 3 -2 6 8 2M-7 1l3 -8" stroke="var(--town-grime)" fill="none" opacity=".5"/><rect x="10" y="8" width="13" height="8" fill="var(--town-drain)" stroke="var(--town-ink)"/><path d="M13 8v8M17 8v8M21 8v8" stroke="var(--town-ink)"/></g>)}
    <g transform={`translate(${P(11.4,18).join(" ")})`} data-parked-bicycle stroke="var(--town-ink)" strokeWidth="2" fill="none"><circle cx="-11" r="7"/><circle cx="13" r="7"/><path d="M-11 0L-3 -11L6 0H-11M6 0L8 -15h5M-3 -11h10"/></g>

    <g transform={`translate(${P(6.5,14.4,55).join(" ")})`} pointerEvents="none" data-diner-steam visibility={atmosphere.dinerActive ? "visible" : "hidden"}><path className="town-steam" d="M0 0q-8 -8 0 -16t0 -16M9 4q8 -8 0 -16t0 -16" fill="none" stroke="var(--town-paper)" strokeWidth="3" opacity=".5"/></g>
    {atmosphere.lit && <g transform={`translate(${P(6.6,21.9,100).join(" ")})`} className="town-neon" pointerEvents="none"><path d="M-25 0h50" stroke="var(--town-casino-sign)" strokeWidth="5"/></g>}
    {speech && !paused && <g key={`${speech.id}-${speech.text}`} ref={el=>{groups.current["speech"]=el;}} transform={`translate(${P(speech.x,speech.y)[0]} ${P(speech.x,speech.y)[1]-37})`} className="town-speech" data-ambient-speech pointerEvents="none">
      <rect x="-83" y="-40" width="166" height="37" rx="6" fill="var(--town-bubble)" stroke="var(--town-ink)" strokeWidth="1.6"/><path d="M-7 -3L0 4L6 -3" fill="var(--town-bubble)" stroke="var(--town-ink)" strokeWidth="1.4"/>
      <text textAnchor="middle" fontSize="12" fill="var(--town-ink)">{wrapSpeech(speech.text).map((line,i)=><tspan key={i} x="0" y={-24+i*14}>{line}</tspan>)}</text>
    </g>}
  </g>;
}
function wrapSpeech(text:string) {
  const words=text.split(" "); const lines=[""];
  for(const word of words){const index=lines.length-1;const current=lines[index] ?? "";if(current.length+word.length>25 && lines.length<2)lines.push(word);else lines[index]=`${current} ${word}`.trim();}
  return lines;
}