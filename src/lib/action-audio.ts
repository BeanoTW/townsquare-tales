/** Tiny synthesized UI cues: no assets, works offline and only runs after user actions. */
export function playActionCue(type:"success"|"failure"|"encounter",enabled=true) {
 if(!enabled||typeof window==="undefined")return;
 try {
  const ctx=new AudioContext();
  const notes=type==="success"?[580,780]:type==="failure"?[220,175]:[440,540];
  const now=ctx.currentTime;
  notes.forEach((freq,i)=>{
    const o=ctx.createOscillator(),g=ctx.createGain();
    o.type=type==="failure"?"triangle":"sine";
    o.frequency.value=freq;
    const start=now+i*.085;
    g.gain.setValueAtTime(.0001,start);
    g.gain.exponentialRampToValueAtTime(.045,start+.012);
    g.gain.exponentialRampToValueAtTime(.0001,start+.12);
    o.connect(g);g.connect(ctx.destination);o.start(start);o.stop(start+.13);
  });
  void new Promise<void>(resolve=>window.setTimeout(resolve,440)).then(()=>ctx.close()).catch(()=>{});
 } catch { /* Audio may be unavailable or blocked; gameplay must still work. */ }
}
