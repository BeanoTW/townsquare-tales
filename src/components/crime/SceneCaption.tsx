import { useEffect, useState } from "react";
import { beatAt, sceneLength, type LiveConversation } from "@/lib/conversation-camera";

/**
 * Letterbox and captions over the live town while a story ending plays at the green. Purely presentational:
 * the story has already been resolved. Tap anywhere (or the skip button) to return to play at once.
 */
export function SceneCaption({ scene, onDone }: { scene: LiveConversation; onDone: () => void }) {
  const [, setTick] = useState(0);
  const length = sceneLength(scene.cue);
  useEffect(() => {
    const end = window.setTimeout(onDone, Math.max(0, scene.startedAt + length - performance.now()));
    const tick = window.setInterval(() => setTick((n) => n + 1), 250);
    const key = (e: KeyboardEvent) => { if (e.key === "Escape" || e.key === " " || e.key === "Enter") onDone(); };
    window.addEventListener("keydown", key);
    return () => { window.clearTimeout(end); window.clearInterval(tick); window.removeEventListener("keydown", key); };
  }, [scene, length, onDone]);
  const { beat } = beatAt(scene.cue, performance.now() - scene.startedAt);
  return (
    <div className="fixed inset-0 z-[85]" data-scene-caption={scene.cue.id} role="status" aria-label={scene.cue.beats.map((b) => b.caption).filter(Boolean).join(" ")} onPointerDown={onDone}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[9%] bg-[#0b0a12]" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[22%] bg-gradient-to-t from-[#0b0a12] via-[#0b0a12]/90 to-transparent" />
      {beat.caption && (
        <p key={beat.caption} className="pointer-events-none absolute inset-x-4 top-[10.5%] mx-auto max-w-md rounded-lg bg-[#0b0a12]/70 px-3 py-2 text-center text-[clamp(15px,4.4vw,20px)] font-bold leading-snug text-[#f6efe0] drop-shadow-[0_2px_0_#000]">
          {beat.caption}
        </p>
      )}
      <button type="button" className="absolute right-3 top-[2%] min-h-11 rounded-full border-2 border-[#f6efe0]/70 bg-black/40 px-4 text-xs font-extrabold tracking-wider text-[#f6efe0]"
        onPointerDown={(e) => e.stopPropagation()} onClick={onDone}>SKIP ▸▸</button>
    </div>
  );
}