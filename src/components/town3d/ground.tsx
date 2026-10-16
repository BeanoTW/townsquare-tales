import { useMemo } from "react";
import * as THREE from "three";
import { N, ROADS, laneDashes, buildingPlot, door, type B } from "@/lib/town-world";
import { TOWN_RAILS } from "@/lib/town-rails";
import { Box, Cone, Cyl, Disc, Flat, Round, mat } from "@/components/town3d/kit";
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
      {/* Deterministic shoreline detail: simple meshes rather than expensive particles. */}
      {Array.from({ length: 18 }, (_, i) => (
        <Flat key={`foam-${i}`} x={i * 2.05} z={32.81 + Math.sin(i * 1.7) * 0.13}
          w={1.3 + (i % 3) * 0.19} d={0.055} y={0.029}
          c="#f3f6df" rough={0.5} />
      ))}
      {Array.from({ length: 32 }, (_, i) => {
        const x = 0.55 + (i * 7.39) % 35;
        const z = 30.65 + (i * 1.31) % 1.85;
        return <Disc key={`shell-${i}`} x={x} z={z} rx={0.045 + i % 3 * 0.012}
          rz={0.025} y={0.026} c={i % 3 ? "#eee2cb" : "#afaa96"} />;
      })}
      {[3.3, 10.8, 21.2, 31.5].map((x, i) => (
        <group key={`drift-${i}`}>
          <Round s={[0.55, 0.11, 0.13]} p={[x, 0.08, 31.2 + (i % 2) * 0.6]}
            r={[0, i * 0.5, 0]} c="#a38b67" rad={0.04} />
        </group>
      ))}
      {/* Low-poly promenade benches, bins and sea-grass tufts. */}
      {[5.5, 17, 28.5].map(x => (
        <group key={`bench-${x}`}>
          <Box s={[0.8, 0.055, 0.23]} p={[x, 0.22, 29.84]} c="#98734d" />
          <Box s={[0.8, 0.24, 0.05]} p={[x, 0.37, 29.69]} c="#98734d" />
          {[-0.3, 0.3].map(dx => <Box key={dx} s={[0.05, 0.2, 0.05]} p={[x + dx, 0.1, 29.85]} c="#53595b" />)}
          <Cyl rad={0.11} h={0.25} p={[x + 0.85, 0.15, 29.86]} c="#4c6972" />
        </group>
      ))}
      {Array.from({ length: 22 }, (_, i) => {
        const x = 0.6 + (i * 5.43) % 35;
        return <group key={`dune-${i}`}>
          {[-0.08, 0, 0.08].map((dx, j) =>
            <Cone key={j} rad={0.04} h={0.18 + j * 0.035}
              p={[x + dx, 0.11, 30.43 + (i % 3) * 0.13]} c="#84986b" />)}
        </group>;
      })}
      {/* Starter district: scattered rough ground; estate: maintained shrubs and hedge. */}
      {Array.from({ length: 12 }, (_, i) => (
        <Disc key={`rough-${i}`} x={0.4 + (i * 2.71) % 7.8}
          z={0.5 + (i * 1.81) % 5.8} rx={0.22 + (i % 3) * 0.08}
          rz={0.13} y={0.003} c={i % 2 ? "#859368" : "#9b967c"} />
      ))}
      {Array.from({ length: 14 }, (_, i) => {
        const x = 30.5 + (i % 7) * 0.73;
        const z = i < 7 ? 4.85 : 10.85;
        return <Round key={`estate-hedge-${i}`} s={[0.68, 0.32, 0.28]}
          p={[x, 0.16, z]} c="#3d7043" rad={0.12} />;
      })}
      <Flat x={0} z={0} w={8.8} d={7.2} y={0.001} c={C.lawn} map={grass} per={1.4} />
      <Flat x={17} z={0.9} w={5.0} d={5.9} y={0.0015} c={C.parkLawn} map={grass} per={1.4} />
      {pavementRects().map((r, i) => <Flat key={"pv" + i} x={r.x} z={r.y} w={r.w} d={r.d} y={0.004 + i * 0.0002} c={C.pavement} map={paving} per={0.5} />)}
      {bs.map((b) => { const plot=buildingPlot(b); return <Flat key={"lot" + b.id} x={plot.x} z={plot.y} w={plot.w} d={plot.d} y={0.006} c={b.id === "casino" ? C.backlot : C.garden} map={grass} per={1.2} />; })}
      {/* Garage access runs along the west of the pub and across the southern frontage. */}
      <Flat x={0.45} z={21.0} w={0.6} d={8.35} y={0.0081} c={C.approach} map={paving} per={0.5} />
      <Flat x={0.45} z={29.08} w={8.2} d={0.4} y={0.0082} c={C.approach} map={paving} per={0.5} />
      {approachRects(bs).map((r, i) => <Flat key={"ap" + i} x={r.x} z={r.y} w={r.w} d={r.d} y={0.0065 + i * 0.0001} c={C.approach} map={paving} per={0.5} />)}
      {/* Coastal transition and varied ground surfaces. Put these after base plots so
          details remain visible rather than being covered by the grass overlays. */}
      {Array.from({ length: 16 }, (_, i) => {
        const x = i * 2.25;
        return <Flat key={`wet-sand-${i}`} x={x} z={32.34 + Math.sin(i * 1.3) * 0.12}
          w={2.27} d={0.34 + (i % 3) * 0.07} y={0.024}
          c={i % 2 ? "#d4c6a2" : "#d9c9a5"} rough={0.72} />;
      })}
      {Array.from({ length: 14 }, (_, i) => (
        <Flat key={`sea-ripple-${i}`} x={(i * 3.31) % 34.6}
          z={33.92 + (i * 0.47) % 1.75} w={1.0 + (i % 4) * 0.3}
          d={0.035} y={0.027} c={i % 2 ? "#6caec0" : "#87baca"} rough={0.3} />
      ))}
      {[[2.3, 31.5], [8.8, 31.85], [15.4, 31.25], [24.2, 31.85], [33.1, 31.4]].map(([x, z], i) => (
        <group key={`shore-rocks-${i}`}>
          {[0, 0.23, -0.17].map((dx, j) =>
            <Round key={j} s={[0.17 + j * 0.05, 0.075 + j * 0.015, 0.15]}
              p={[x! + dx, 0.055, z! + j * 0.08]} c={j % 2 ? "#96998f" : "#b5afa0"} rad={0.045} />)}
        </group>
      ))}
      {/* Worn footpaths through unused east-side green, avoiding the mansion's
          private grounds and road access, with a few clusters of wild scrub. */}
      <Flat x={18.0} z={16.2} w={0.52} d={4.25} y={0.0072} c="#87936b" map={soil} per={1.5} />
      <Flat x={16.1} z={19.9} w={2.4} d={0.43} y={0.0073} c="#8e9472" map={soil} per={1.5} />
      {[[17.3, 15.6], [19.1, 17.8], [18.8, 20.5], [3.2, 10.8], [6.2, 11.6], [6.8, 5.7]].map(([x, z], i) => (
        <group key={`scrub-${i}`}>
          {[-0.17, 0.13].map((dx, j) =>
            <Round key={j} s={[0.33 + j * 0.09, 0.22, 0.31]}
              p={[x! + dx, 0.13, z! + j * 0.14]} c={i % 2 ? "#678653" : "#6f8c5b"} rad={0.12} />)}
        </group>
      ))}
      {/* Frontage details for the seaside flat and the suburban home's garden. */}
      <Flat x={5.1} z={29.42} w={2.7} d={0.16} y={0.024}
        c="#b9ad93" rough={0.85} />
      {[[22.12, 1.05], [25.38, 1.05], [22.12, 4.95], [25.38, 4.95]].map(([x, z], i) =>
        <Round key={`house-shrub-${i}`} s={[0.31, 0.32, 0.31]}
          p={[x!, 0.17, z!]} c="#527b48" rad={0.12} />)}
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
