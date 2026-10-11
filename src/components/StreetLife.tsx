import { useEffect, useRef, useState, type MutableRefObject } from "react";
import { OverheadPerson } from "@/components/OverheadPerson";
import { P } from "@/lib/town-projection";
import { residentsAt, type ResidentId } from "@/lib/living-town";
import type { GameState } from "@/lib/game-state";
import { isWalkable, type Point, type Obstacle } from "@/lib/pathfinding";
import { AMBIENT_ROUTES, ambientVisible, makeActor, moveActor, PIGEON_FLOCKS, pigeonOffset, residentBark, routineGoal, SPEECH_COOLDOWN, SPEECH_SECONDS, STREET_OBJECTS, yieldsToPlayer, type StreetActor, type StreetObjectId } from "@/lib/street-life";

type Player = Point & { walking: boolean };
export type ResidentPositions = Partial<Record<ResidentId, StreetActor>>;
export function StreetLife({ player, positions, lots, state, skating, paused, onResident, onObject }: {
  player: MutableRefObject<Player>; positions: MutableRefObject<ResidentPositions>; lots: Obstacle[];
  state: GameState; skating: boolean; paused: boolean; onResident: (id: ResidentId, p: Point) => void; onObject: (id: StreetObjectId) => void;
}) {
  const groups = useRef<Record<string, SVGGElement | null>>({});
  const birds = useRef<Record<string, SVGGElement | null>>({});
  const extras = useRef<Record<string, StreetActor>>({});
  const config = useRef({ state, skating, paused, lots });
  config.current = { state, skating, paused, lots };
  const [speech, setSpeech] = useState<{ id: string; text: string; x: number; y: number } | null>(null);
  const cooldown = useRef<Record<string, number>>({});
  const selectedUntil = useRef<Record<string, number>>({});
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0, last = performance.now(), nextSpeech = 0, speechUntil = 0, visibleId = "";
    const frightened: Record<string, number> = {};
    const update = (now: number) => {
      raf = requestAnimationFrame(update);
      if (now - last < (reduced ? 100 : 50)) return;
      const dt = Math.min(.1, (now-last)/1000); last = now;
      const seconds = now / 1000, { state: s, lots: obstacles, skating: board, paused: frozen } = config.current;
      const me = player.current;
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
          if (obstructed && yieldsToPlayer(schedule.id)) {
            const side = {x:actor.x + (actor.x >= me.x ? .65 : -.65), y:actor.y};
            if (isWalkable(side, obstacles)) moveActor(actor, side, obstacles, dt);
          } else moveActor(actor, goal, obstacles, dt, obstructed || seconds < actor.pauseUntil);
        } else actor.walking = false;
        if (distance < 1.8) {
          actor.angle = Math.atan2(me.x-actor.x, -(me.y-actor.y))*180/Math.PI;
          if (board && me.walking && distance < 1.35) speak(schedule.id, residentBark(schedule.id,s,"skating"),actor);
          else if (obstructed) speak(schedule.id,residentBark(schedule.id,s,"blocked"),actor);
          else speak(schedule.id,residentBark(schedule.id,s,"passing"),actor);
        }
        if (group) {
          const [x,y] = P(actor.x,actor.y); group.setAttribute("transform",`translate(${x} ${y})`);
          group.setAttribute("data-walking",String(actor.walking));
          group.setAttribute("data-world-x",String(actor.x)); group.setAttribute("data-world-y",String(actor.y));
          const body = group.querySelector("[data-body-heading]"); body?.setAttribute("transform",`rotate(${actor.angle})`);
          const arms = group.querySelector("[data-person-arms]");
          arms?.setAttribute("transform",`rotate(${!reduced && (actor.walking || distance < 1.35) ? Math.sin(seconds*5)*9 : 0} 0 -7)`);
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
        if (!frozen) moveActor(actor,stops[actor.trip%2] ?? stops[0],obstacles,dt, distance<.8 || seconds<actor.pauseUntil);
        const [x,y] = P(actor.x,actor.y); group.setAttribute("transform",`translate(${x} ${y})`);
        group.querySelector("[data-body-heading]")?.setAttribute("transform",`rotate(${actor.angle})`);
        if (distance < 1.5) speak(route.id,route.id === "patrol" && s.heat >= 30 ? "You. We're watching." : board && me.walking ? "Oi! Watch where you're going!" : route.line,actor);
      }
      PIGEON_FLOCKS.forEach((flock, index) => {
        const distance = Math.hypot(flock.x-me.x,flock.y-me.y);
        if(distance<1.5) frightened[index]=seconds+5;
        for(let i=0;i<3;i++) {
          const bird = birds.current[`${index}-${i}`]; if(!bird)continue;
          const offset=pigeonOffset(seconds<(frightened[index] ?? 0) ? 0 : 10,seconds,i);
          const point={x:flock.x+offset.x,y:flock.y+offset.y};
          const [x,y]=P(isWalkable(point,obstacles)?point.x:flock.x,isWalkable(point,obstacles)?point.y:flock.y);
          bird.setAttribute("transform",`translate(${x} ${y}) rotate(${seconds*15+i*120})`);
          bird.setAttribute("data-scattering",String(offset.scatter));
          bird.querySelector("[data-wing]")?.setAttribute("opacity",offset.scatter && !reduced ? String(.3+Math.abs(Math.sin(seconds*12))*.7) : "0");
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
  return <g data-street-life>
    {STREET_OBJECTS.map(object => <g key={object.id} transform={`translate(${P(object.x,object.y).join(" ")})`} data-street-object={object.id}
      role="button" tabIndex={0} aria-label={object.label} className="street-target" onClick={e=>{e.stopPropagation();onObject(object.id);}}
      onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();e.stopPropagation();onObject(object.id);}}}>
      {object.kind === "bench" ? <g stroke="var(--town-ink)" strokeWidth="2"><path d="M-22 -9h44M-22 -3h44" stroke="var(--town-tree-trunk)" strokeWidth="6"/><path d="M-18 -2v12M18 -2v12"/></g> : object.kind === "bin" ? <g><rect x="-10" y="-20" width="20" height="27" rx="3" fill="var(--town-bin)" stroke="var(--town-ink)" strokeWidth="2"/><path d="M-12 -20h24M-5 -15v16M5 -15v16" stroke="var(--town-ink)" strokeWidth="2"/></g> : <g><rect x="-14" y="-37" width="28" height="44" rx="2" fill="var(--town-vending)" stroke="var(--town-ink)" strokeWidth="2"/><rect x="-9" y="-31" width="14" height="21" fill="var(--town-glass)"/><path d="M-6 -26h8M-6 -20h8M-6 -14h8" stroke="var(--town-window-lit)" strokeWidth="3"/><path d="M-7 0h14" stroke="var(--town-ink)" strokeWidth="4"/></g>}
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
    {/* Minimal street wear, clear of every doorway. */}
    {[{x:8.1,y:14.3},{x:21.6,y:15.2},{x:11.4,y:27.7}].map((p,i)=><g key={i} transform={`translate(${P(p.x,p.y).join(" ")})`} pointerEvents="none"><path d="M-14 -2l7 3 -2 6 8 2M-7 1l3 -8" stroke="var(--town-grime)" fill="none" opacity=".5"/><rect x="10" y="8" width="13" height="8" fill="var(--town-drain)" stroke="var(--town-ink)"/><path d="M13 8v8M17 8v8M21 8v8" stroke="var(--town-ink)"/></g>)}
    <g transform={`translate(${P(11.4,18).join(" ")})`} data-parked-bicycle stroke="var(--town-ink)" strokeWidth="2" fill="none"><circle cx="-11" r="7"/><circle cx="13" r="7"/><path d="M-11 0L-3 -11L6 0H-11M6 0L8 -15h5M-3 -11h10"/></g>
    <g transform={`translate(${P(8.1,17.9).join(" ")})`} data-newspaper-box><rect x="-8" y="-20" width="16" height="24" fill="var(--town-vending)" stroke="var(--town-ink)"/><rect x="-5" y="-16" width="10" height="9" fill="var(--town-bubble)"/><path d="M-4 -13h8M-4 -10h5" stroke="var(--town-ink)"/></g>
    <g transform={`translate(${P(6.5,14.4,55).join(" ")})`} pointerEvents="none" data-diner-steam><path className="town-steam" d="M0 0q-8 -8 0 -16t0 -16M9 4q8 -8 0 -16t0 -16" fill="none" stroke="var(--town-paper)" strokeWidth="3" opacity=".5"/></g>
    {state.hour>=18 && <g transform={`translate(${P(6.6,21.9,100).join(" ")})`} className="town-neon" pointerEvents="none"><path d="M-25 0h50" stroke="var(--town-casino-sign)" strokeWidth="5"/></g>}
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