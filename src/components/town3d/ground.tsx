import { useMemo } from "react";
import * as THREE from "three";
import { N, ROADS, laneDashes, buildingPlot, door, type B } from "@/lib/town-world";
import { TOWN_RAILS } from "@/lib/town-rails";
import { Box, Cyl, Disc, Flat, Round, mat } from "@/components/town3d/kit";
import { asphaltTexture, grassTexture, gravelTexture, pavingTexture, soilTexture, timberTexture } from "@/components/town3d/textures";
import { townColor, shade } from "@/components/town3d/palette";

type Rect = { x: number; y: number; w: number; d: number };
export type Kerb = { x: number; z: number; len: number; axis: "x" | "z" };

/** Cut [a, b] by every interval in `cuts`, returning what remains. */
function subtract(a: number, b: number, cuts: [number, number][]): [number, number][] {
  let parts: [number, number][] = [[a, b]];
  for (const [c0, c1] of cuts) {
    const next: [number, number][] = [];
    for (const [p0, p1] of parts) {
      if (c1 <= p0 || c0 >= p1) next.push([p0, p1]);
      else {
        if (c0 > p0) next.push([p0, c0]);
        if (c1 < p1) next.push([c1, p1]);
      }
    }
    parts = next;
  }
  return parts.filter(([p0, p1]) => p1 - p0 > 0.05);
}

/**
 * Raised kerb lines along every road edge, broken wherever another road joins
 * (so T-junctions stay open) and skipped along the map border.
 */
export function kerbSegments(roads: readonly Rect[] = ROADS): Kerb[] {
  const out: Kerb[] = [];
  const edge = 0.05;
  roads.forEach((r, i) => {
    const others = roads.filter((_, j) => j !== i);
    // Lines of constant x (west/east edges) run along z, and vice versa.
    for (const x of [r.x, r.x + r.w]) {
      if (x <= edge || x >= N - edge) continue;
      const cuts = others.filter((o) => o.x <= x + edge && o.x + o.w >= x - edge).map((o) => [o.y, o.y + o.d] as [number, number]);
      for (const [a, b] of subtract(r.y, r.y + r.d, x > 29.45 && r.x > 22 && r.y < 8 ? [...cuts, [6.67, 7.73]] : cuts)) out.push({ x, z: a, len: b - a, axis: "z" });
    }
    for (const z of [r.y, r.y + r.d]) {
      if (z <= edge || z >= N - edge) continue;
      const cuts = others.filter((o) => o.y <= z + edge && o.y + o.d >= z - edge).map((o) => [o.x, o.x + o.w] as [number, number]);
      for (const [a, b] of subtract(r.x, r.x + r.w, cuts)) out.push({ x: a, z, len: b - a, axis: "x" });
    }
  });
  return out;
}

/** Pavement rectangles: each road widened by 0.58 tiles, clamped to the map, as on the classic map. */
export function pavementRects(roads: readonly Rect[] = ROADS): Rect[] {
  return roads.map((r) => {
    const x = Math.max(0, r.x - 0.58), y = Math.max(0, r.y - 0.58);
    return { x, y, w: Math.min(N, r.x + r.w + 0.58) - x, d: Math.min(N, r.y + r.d + 0.58) - y };
  });
}

/** Path from each door to the nearest road, as on the classic map. */
export function approachRects(bs: B[]): Rect[] {
  return bs.flatMap((b) => {
    const d = door(b);
    const r = ROADS.map((road) => {
      const x = Math.max(road.x, Math.min(road.x + road.w, d.x));
      const y = Math.max(road.y, Math.min(road.y + road.d, d.y));
      return { x, y, distance: Math.hypot(d.x - x, d.y - y) };
    }).sort((a, c) => a.distance - c.distance)[0];
    return r ? [{ x: Math.min(d.x, r.x) - 0.22, y: Math.min(d.y, r.y) - 0.22, w: Math.abs(d.x - r.x) + 0.44, d: Math.abs(d.y - r.y) + 0.44 }] : [];
  });
}

export function TownGround({ bs }: { bs: B[] }) {
  const C = useMemo(() => ({
    grass: townColor("var(--town-grass)"),
    lawn: townColor("var(--town-lawn)"),
    parkLawn: townColor("var(--town-park-lawn)"),
    pavement: townColor("var(--town-pavement)"),
    garden: townColor("var(--town-garden)"),
    backlot: townColor("var(--town-backlot)"),
    approach: townColor("var(--town-approach)"),
    park: townColor("var(--town-park)"),
    pond: townColor("var(--town-pond)"),
    pondEdge: townColor("var(--town-pond-edge)"),
    path: townColor("var(--town-park-path)"),
    asphalt: townColor("var(--town-asphalt)"),
    paint: townColor("var(--town-lane-paint)"),
    crossing: townColor("var(--town-crossing)"),
    doorPath: townColor("var(--town-door-path)"),
    grime: townColor("var(--town-grime)"),
    earth: townColor("var(--town-earth-front)"),
    drain: townColor("var(--town-drain)"),
  }), []);
  const grass = grassTexture(), paving = pavingTexture(), asphalt = asphaltTexture(), gravel = gravelTexture(), soil = soilTexture();
  const kerbs = useMemo(() => kerbSegments(), []);
  return (
    <group>
      {/* Earth slab under the town, with a turf lip. */}
      <Box s={[N, 0.7, N]} p={[N / 2, -0.35, N / 2]} c={shade(C.earth, -0.15)} o={{ rough: 1 }} shadow={false} />
      <Box s={[N + 0.02, 0.08, N + 0.02]} p={[N / 2, -0.04, N / 2]} c={C.earth} o={{ rough: 1 }} shadow={false} />
      <Flat x={0} z={0} w={N} d={N} y={0} c={C.grass} map={grass} per={1.4} />
      {/* Southern coastal extension: walkway, dunes, tidal shallows and sea. */}
      <Flat x={0} z={29.6} w={N} d={0.65} y={0.021} c="#b5b6a4" map={paving} per={0.5} />
      <Flat x={0} z={30.25} w={N} d={2.6} y={0.021} c="#ecd49f" rough={0.95} />
      <Flat x={0} z={32.85} w={N} d={0.8} y={0.023} c="#8ecfd0" rough={0.32} />
      <Flat x={0} z={33.65} w={N} d={2.35} y={0.023} c="#397fa4" rough={0.16} />
      <Flat x={0} z={0} w={8.8} d={7.2} y={0.001} c={C.lawn} map={grass} per={1.4} />
      <Flat x={17} z={0.9} w={5.0} d={5.9} y={0.0015} c={C.parkLawn} map={grass} per={1.4} />
      {pavementRects().map((r, i) => <Flat key={"pv" + i} x={r.x} z={r.y} w={r.w} d={r.d} y={0.004 + i * 0.0002} c={C.pavement} map={paving} per={0.5} />)}
      {bs.map((b) => { const plot=buildingPlot(b); return <Flat key={"lot" + b.id} x={plot.x} z={plot.y} w={plot.w} d={plot.d} y={0.006} c={b.id === "casino" ? C.backlot : C.garden} map={grass} per={1.2} />; })}
      {approachRects(bs).map((r, i) => <Flat key={"ap" + i} x={r.x} z={r.y} w={r.w} d={r.d} y={0.0065 + i * 0.0001} c={C.approach} map={paving} per={0.5} />)}
      {/* Park, pond and footbridge over the water. */}
      <Flat x={17} z={1.1} w={5.0} d={5.6} y={0.002} c={C.park} map={grass} per={1.2} />
      {/* Recreation corner: the ramp, park grind rail and basketball court share one site. */}
      <Flat x={20.05} z={1.25} w={1.85} d={2.5} y={0.008} c="#667d76" rough={0.92} />
      {[1.25,3.75].map((z,i)=><Box key={"basket-line"+i} s={[1.85,0.012,0.025]} p={[20.975,0.018,z]} c="#f4e7bc" shadow={false}/>)}
      {[20.06,21.89].map((x,i)=><Box key={"court-side"+i} s={[0.025,0.012,2.48]} p={[x,0.018,2.5]} c="#f4e7bc" shadow={false}/>)}
      <Flat x={18.28} z={2.28} w={1.2} d={0.8} y={0.01} c="#797f84" rough={0.85}/>

      <Disc x={20.3} z={4.4} rx={0.9} rz={0.74} y={0.0075} c={C.pondEdge} rough={0.9} />
      <Disc x={20.3} z={4.4} rx={0.8} rz={0.64} y={0.009} c={C.pond} rough={0.06} o={{ metal: 0.15 }} />
      {[[19.8, 4.0], [20.8, 4.75], [20.75, 3.95]].map(([x, z], i) => <Disc key={"lily" + i} x={x!} z={z!} rx={0.09} rz={0.07} y={0.012} c="#5f9a4a" />)}
      {Array.from({ length: 16 }, (_, i) => {
        const t = (i / 16) * Math.PI * 2;
        return <Round key={"st" + i} s={[0.16, 0.06, 0.12]} p={[20.3 + Math.cos(t) * 0.86, 0.025, 4.4 + Math.sin(t) * 0.7]} r={[0, -t, 0]} c={i % 3 ? "#a8a59c" : "#8f8c84"} rad={0.03} />;
      })}
      <Flat x={19.6} z={1.2} w={0.45} d={5.2} y={0.01} c={C.path} map={gravel} per={0.6} />
      <Flat x={17} z={5.5} w={5.0} d={0.4} y={0.0105} c={C.path} map={gravel} per={0.6} />
      <Bridge />
      {/* Roads, lane paint, crossings and kerbs. */}
      {ROADS.map((r, i) => <Flat key={"rd" + i} x={r.x} z={r.y} w={r.w} d={r.d} y={0.012 + i * 0.0002} c={C.asphalt} map={asphalt} per={1.2} rough={0.9} />)}
      {laneDashes().map((dash,i)=><Flat key={"ln"+i} x={dash.x} z={dash.y} w={dash.w} d={dash.d} y={0.0145} c={C.paint} rough={0.6}/>)}
      {[7.1, 11.9, 18.5, 25.5].flatMap((y, i) => Array.from({ length: 4 }, (_, j) => <Flat key={`zb${i}-${j}`} x={8.85 + j * 0.62} z={y - 0.35} w={0.34} d={0.4} y={0.015} c={C.crossing} rough={0.6} />))}
      {kerbs.map((k, i) => k.axis === "z"
        ? <Box key={"kb" + i} s={[0.07, 0.035, k.len]} p={[k.x, 0.0175, k.z + k.len / 2]} c="#d6d1c6" o={{ rough: 0.8 }} />
        : <Box key={"kb" + i} s={[k.len, 0.035, 0.07]} p={[k.x + k.len / 2, 0.0175, k.z]} c="#d6d1c6" o={{ rough: 0.8 }} />)}
      {/* Short paved walks to every front door. */}
      {bs.map((b) => {
        const d = door(b);
        const south = b.facing === "south", north = b.facing === "north";
        const x = south || north ? d.x - 0.33 : Math.min(d.x, b.facing === "east" ? b.x + b.w : b.x) - 0.05;
        const y = south ? b.y + b.d : north ? d.y : d.y - 0.33;
        return <Flat key={"dp" + b.id} x={x} z={y} w={south || north ? 0.66 : 0.7} d={south || north ? 0.65 : 0.66} y={0.0085} c={C.doorPath} map={paving} per={0.33} />;
      })}
      {/* The gang's trodden patch of dirt. */}
      <Flat x={5.2} z={3.6} w={2.0} d={1.8} y={0.003} c={shade(C.grime, 0.35)} map={soil} per={1.5} />
      {/* Storm drains on the kerbside. */}
      {[[8.45, 14.6], [21.95, 15.5], [11.75, 28.0]].map(([x, z], i) => (
        <group key={"dr" + i}>
          <Box s={[0.16, 0.012, 0.1]} p={[x!, 0.016, z!]} c={C.drain} o={{ rough: 0.5, metal: 0.4 }} shadow={false} />
          {[-0.05, 0, 0.05].map((dx) => <Box key={dx} s={[0.012, 0.014, 0.09]} p={[x! + dx, 0.018, z!]} c="#2d2f33" shadow={false} />)}
        </group>
      ))}
      <Rails />
    </group>
  );
}

/** Timber footbridge across the pond where the park paths cross it. */
function Bridge() {
  const m = useMemo(() => mat("#c7a77d", { rough: 0.8, map: timberTexture() }), []);
  const deck = (x: number, z: number, w: number, d: number) => (
    <mesh geometry={box} position={[x + w / 2, 0.035, z + d / 2]} scale={[w, 0.03, d]} material={m} castShadow receiveShadow />
  );
  return (
    <group>
      {deck(19.4, 4.48, 1.8, 0.44)}
      {deck(19.6, 3.65, 0.45, 1.5)}
      {[19.45, 21.15].map((x) => [4.47, 4.93].map((z) => <Cyl key={`${x}${z}`} rad={0.02} h={0.16} p={[x, 0.11, z]} c="#8a6a48" />))}
      <Box s={[1.7, 0.025, 0.025]} p={[20.3, 0.18, 4.93]} c="#8a6a48" />
      <Box s={[1.7, 0.025, 0.025]} p={[20.3, 0.18, 4.47]} c="#8a6a48" />
    </group>
  );
}
const box = new THREE.BoxGeometry(1, 1, 1);

/** Grind rails: steel pipe on short posts. */
function Rails() {
  return (
    <group>
      {TOWN_RAILS.map((rail) => {
        const len = Math.hypot(rail.b.x - rail.a.x, rail.b.y - rail.a.y);
        const ang = Math.atan2(rail.b.y - rail.a.y, rail.b.x - rail.a.x);
        const mx = (rail.a.x + rail.b.x) / 2, mz = (rail.a.y + rail.b.y) / 2;
        const posts = Math.max(2, Math.round(len / 0.8) + 1);
        return (
          <group key={rail.id}>
            <Cyl rad={0.025} h={len} p={[mx, 0.13, mz]} r={[0, -ang, Math.PI / 2]} c="#b9c0c4" o={{ metal: 0.7, rough: 0.25 }} />
            {Array.from({ length: posts }, (_, i) => {
              const t = i / (posts - 1);
              return <Cyl key={i} rad={0.018} h={0.13} p={[rail.a.x + (rail.b.x - rail.a.x) * t, 0.065, rail.a.y + (rail.b.y - rail.a.y) * t]} c="#3a3d42" o={{ metal: 0.5, rough: 0.4 }} />;
            })}
          </group>
        );
      })}
    </group>
  );
}
