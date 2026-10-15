import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";

/** Lightweight counters, sampled only when a diagnostics panel is listening. */
export type RenderSample = {
  scene: string; frames: number; fps: number | null; drawCalls: number;
  triangles: number; geometries: number; textures: number; dpr: number;
  renderer: string; viewport: string; measuredAt: number;
};
export const RENDER_EVENT = "tst:render-diagnostics";
export function RenderDiagnosticsProbe({ scene }: { scene: string }) {
  const gl = useThree(s => s.gl);
  const size = useThree(s => s.size);
  const count = useRef(0);
  const from = useRef(0);
  const lastEmit = useRef(0);
  useEffect(() => {
    const start = performance.now();
    from.current = start; lastEmit.current = 0; count.current = 0;
  }, [scene]);
  useFrame(() => {
    // Demand-rendered scenes may be idle. This measures frames observed,
    // not a claimed continuous benchmark.
    const now = performance.now();
    count.current++;
    if (now - lastEmit.current < 950) return;
    const elapsed = now - from.current;
    const fps = elapsed >= 950 ? count.current * 1000 / elapsed : null;
    count.current = 0; from.current = now; lastEmit.current = now;
    if (typeof window === "undefined") return;
    const info = gl.info;
    let renderer = "WebGL";
    try {
      const ctx = gl.getContext();
      renderer = ctx instanceof WebGL2RenderingContext ? "WebGL2" : "WebGL1";
    } catch { /* WebGL name unavailable */ }
    const detail: RenderSample = {
      scene, frames: info.render.frame, fps: fps===null?null:Math.round(fps),
      drawCalls: info.render.calls, triangles: info.render.triangles,
      geometries: info.memory.geometries, textures: info.memory.textures,
      dpr: gl.getPixelRatio(), renderer,
      viewport: `${Math.round(size.width)}×${Math.round(size.height)}`,
      measuredAt: now,
    };
    window.dispatchEvent(new CustomEvent(RENDER_EVENT,{detail}));
  });
  return null;
}
