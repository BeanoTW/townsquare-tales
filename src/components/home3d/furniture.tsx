import { useMemo } from "react";
import * as THREE from "three";
import { Ball, Box, Cone, Cyl, Group, Round, mat } from "./primitives";
import { artTexture, screenTexture, signTexture } from "./textures";

/**
 * Furniture models, built from primitives with bevels, inset panels and small props.
 * Every model is drawn around its own origin: the centre of its footprint on the floor, front toward +z.
 * Luxury versions are different models, not recoloured basic ones.
 */
const WOOD = "#b98a5b";
const WOOD_D = "#6b4a32";
const WALNUT = "#4a3022";
const CREAM = "#efe6d2";
const WHITE = "#f4f1ea";
const CORAL = "#cf6a57";
const TEAL = "#1f6f6a";
const TEAL_L = "#3f9a94";
const GOLD = "#c9a24a";
const STEEL = "#aab3b8";
const BLACK = "#26282c";
const BRASS = { rough: 0.3, metal: 0.85 };
const CHROME = { rough: 0.2, metal: 0.95 };

export type Quality = { lux: boolean };

/* ---------------------------------- Bed ---------------------------------- */
export function Bed({ lux }: Quality) {
  if (!lux)
    return (
      <Group>
        <Box s={[1.62, 0.28, 2.1]} p={[0, 0.14, 0]} c={WOOD} />
        <Box s={[1.5, 0.12, 1.98]} p={[0, 0.3, 0.02]} c={WOOD_D} />
        <Round s={[1.5, 0.2, 1.95]} p={[0, 0.4, 0.03]} c={CREAM} rad={0.06} />
        <Round s={[1.52, 0.1, 1.3]} p={[0, 0.52, 0.38]} c={CORAL} rad={0.04} />
        <Box s={[1.52, 0.012, 0.05]} p={[0, 0.576, 0.15]} c={CREAM} />
        <Box s={[1.64, 0.8, 0.07]} p={[0, 0.54, -1.04]} c={WOOD} />
        <Box s={[1.64, 0.05, 0.1]} p={[0, 0.96, -1.04]} c={WOOD_D} />
        <Round s={[0.55, 0.14, 0.34]} p={[-0.37, 0.57, -0.76]} r={[-0.18, 0.06, 0]} c={WHITE} rad={0.05} />
        <Round s={[0.55, 0.14, 0.34]} p={[0.37, 0.57, -0.76]} r={[-0.18, -0.06, 0]} c={WHITE} rad={0.05} />
        {[-0.8, 0.8].map((x) => (
          <Box key={x} s={[0.06, 0.08, 0.06]} p={[x, 0.04, 1.0]} c={WOOD_D} />
        ))}
      </Group>
    );
  return (
    <Group>
      <Round s={[1.76, 0.36, 2.22]} p={[0, 0.3, 0.02]} c="#34556a" rad={0.07} />
      {[[-0.8, -1.0], [0.8, -1.0], [-0.8, 1.04], [0.8, 1.04]].map(([x, z]) => (
        <Cyl key={`${x}${z}`} rad={0.04} h={0.13} p={[x!, 0.065, z!]} c={GOLD} o={BRASS} />
      ))}
      <Round s={[1.62, 0.26, 2.02]} p={[0, 0.58, 0.05]} c={WHITE} rad={0.08} />
      <Round s={[1.64, 0.15, 1.42]} p={[0, 0.76, 0.4]} c={TEAL_L} rad={0.06} />
      {[0, 1, 2, 3].map((i) => (
        <Box key={i} s={[1.64, 0.012, 0.025]} p={[0, 0.84, -0.05 + i * 0.33]} c={CREAM} />
      ))}
      {[-0.4, 0, 0.4].map((x) => (
        <Box key={x} s={[0.025, 0.012, 1.42]} p={[x, 0.842, 0.4]} c={CREAM} />
      ))}
      <Round s={[1.64, 0.1, 0.38]} p={[0, 0.86, 0.98]} c={GOLD} rad={0.04} />
      <Round s={[1.86, 1.34, 0.16]} p={[0, 0.9, -1.12]} c="#34556a" rad={0.07} />
      {[0, 1, 2, 3, 4].flatMap((i) =>
        [0, 1, 2].map((j) => <Ball key={`${i}${j}`} rad={0.024} p={[-0.64 + i * 0.32, 0.62 + j * 0.3, -1.03]} c={GOLD} o={BRASS} />),
      )}
      <Round s={[0.62, 0.17, 0.4]} p={[-0.4, 0.78, -0.82]} r={[-0.2, 0.05, 0]} c={WHITE} rad={0.07} />
      <Round s={[0.62, 0.17, 0.4]} p={[0.4, 0.78, -0.82]} r={[-0.2, -0.05, 0]} c={WHITE} rad={0.07} />
      <Round s={[0.4, 0.14, 0.3]} p={[-0.22, 0.88, -0.58]} r={[-0.5, 0.3, 0]} c={GOLD} rad={0.06} />
      <Round s={[0.4, 0.14, 0.3]} p={[0.22, 0.88, -0.58]} r={[-0.5, -0.3, 0]} c={TEAL} rad={0.06} />
    </Group>
  );
}

/** The mattress on the floor you have before buying a bed. */
export function Mattress() {
  return (
    <Group>
      <Round s={[1.3, 0.14, 1.9]} p={[0, 0.07, 0]} c="#9aa6ae" rad={0.05} />
      <Round s={[1.3, 0.05, 1.05]} p={[0, 0.17, 0.4]} c="#7f5a6b" rad={0.025} />
      <Round s={[0.5, 0.09, 0.32]} p={[0, 0.2, -0.72]} c={CREAM} rad={0.04} />
    </Group>
  );
}

/* ---------------------------------- Sofa ---------------------------------- */
export function Sofa({ lux }: Quality) {
  if (!lux)
    return (
      <Group>
        <Round s={[2.0, 0.28, 0.92]} p={[0, 0.27, 0]} c={CORAL} rad={0.05} />
        <Round s={[0.84, 0.16, 0.7]} p={[-0.43, 0.49, 0.1]} c={CORAL} rad={0.05} />
        <Round s={[0.84, 0.16, 0.7]} p={[0.43, 0.49, 0.1]} c={CORAL} rad={0.05} />
        <Round s={[2.0, 0.52, 0.2]} p={[0, 0.66, -0.36]} c={CORAL} rad={0.06} />
        <Round s={[0.2, 0.44, 0.92]} p={[-0.9, 0.5, 0]} c="#b95a49" rad={0.05} />
        <Round s={[0.2, 0.44, 0.92]} p={[0.9, 0.5, 0]} c="#b95a49" rad={0.05} />
        {[[-0.86, -0.38], [0.86, -0.38], [-0.86, 0.38], [0.86, 0.38]].map(([x, z]) => (
          <Cyl key={`${x}${z}`} rad={0.035} h={0.12} p={[x!, 0.06, z!]} c={WOOD_D} />
        ))}
        <Round s={[0.4, 0.38, 0.12]} p={[-0.62, 0.78, -0.12]} r={[0.1, 0.2, 0.25]} c={CREAM} rad={0.04} />
        <Round s={[0.8, 0.05, 0.5]} p={[0.5, 0.58, 0.05]} r={[0, 0.12, 0]} c="#8a5a6b" rad={0.02} />
      </Group>
    );
  return (
    <Group>
      <Round s={[2.1, 0.36, 1.0]} p={[0, 0.36, 0]} c={TEAL} rad={0.1} />
      {[-0.68, 0, 0.68].map((x) => (
        <Round key={x} s={[0.66, 0.2, 0.76]} p={[x, 0.64, 0.1]} c={TEAL} rad={0.08} />
      ))}
      <Round s={[2.1, 0.74, 0.26]} p={[0, 0.8, -0.37]} c={TEAL} rad={0.1} />
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
        <Ball key={x} rad={0.022} p={[x, 0.9, -0.235]} c={GOLD} o={BRASS} />
      ))}
      {[-0.7, -0.35, 0, 0.35, 0.7].map((x) => (
        <Ball key={`b${x}`} rad={0.022} p={[x, 0.68, -0.235]} c={GOLD} o={BRASS} />
      ))}
      <Round s={[0.26, 0.64, 1.02]} p={[-0.93, 0.62, 0]} c={TEAL} rad={0.11} />
      <Round s={[0.26, 0.64, 1.02]} p={[0.93, 0.62, 0]} c={TEAL} rad={0.11} />
      {[[-0.92, -0.4], [0.92, -0.4], [-0.92, 0.4], [0.92, 0.4]].map(([x, z]) => (
        <Cone key={`${x}${z}`} rad={0.045} h={0.17} p={[x!, 0.085, z!]} r={[Math.PI, 0, 0]} c={GOLD} o={BRASS} />
      ))}
      <Round s={[0.46, 0.46, 0.17]} p={[-0.66, 0.9, 0.0]} r={[-0.2, 0.3, 0.2]} c={GOLD} rad={0.07} />
      <Round s={[0.46, 0.46, 0.17]} p={[0.62, 0.9, 0.02]} r={[-0.2, -0.3, -0.2]} c="#d98b7a" rad={0.07} />
      <Cyl rad={0.09} h={0.5} p={[0.2, 0.93, 0.08]} r={[0, 0, Math.PI / 2 + 0.2]} c={CREAM} />
    </Group>
  );
}

/* --------------------------------- Kitchen -------------------------------- */
export function Kitchen({ lux }: Quality) {
  const body = lux ? "#2d5f64" : CREAM;
  const top = lux ? "#efede8" : "#9c7a55";
  const handle = lux ? { c: GOLD, o: BRASS } : { c: STEEL, o: CHROME };
  const topH = lux ? 0.06 : 0.04;
  const unit = (cx: number, w: number, key: string) => (
    <Group key={key} p={[cx, 0, 0]}>
      <Box s={[w, 0.84, 0.64]} p={[0, 0.44, 0.0]} c={body} />
      <Box s={[w - 0.05, 0.7, 0.02]} p={[0, 0.5, 0.325]} c={lux ? "#35747a" : WHITE} />
      <Box s={[0.18, 0.02, 0.025]} p={[0, 0.78, 0.35]} {...handle} />
      <Box s={[w, 0.08, 0.6]} p={[0, 0.04, 0.02]} c={BLACK} />
    </Group>
  );
  return (
    <Group>
      {/* fridge */}
      {lux ? (
        <Group p={[-0.95, 0, 0]}>
          <Round s={[0.78, 1.82, 0.68]} p={[0, 0.91, 0]} c="#c7ced2" rad={0.03} o={CHROME} />
          <Box s={[0.012, 1.7, 0.02]} p={[0, 0.92, 0.35]} c={BLACK} />
          <Box s={[0.03, 0.5, 0.04]} p={[-0.06, 1.15, 0.36]} c={STEEL} o={CHROME} />
          <Box s={[0.03, 0.5, 0.04]} p={[0.06, 1.15, 0.36]} c={STEEL} o={CHROME} />
        </Group>
      ) : (
        <Group p={[-1.0, 0, 0]}>
          <Round s={[0.62, 1.7, 0.64]} p={[0, 0.85, 0]} c={WHITE} rad={0.04} />
          <Box s={[0.5, 0.012, 0.02]} p={[0, 1.18, 0.33]} c={STEEL} />
          <Box s={[0.025, 0.4, 0.04]} p={[0.2, 1.4, 0.34]} c={STEEL} o={CHROME} />
          <Box s={[0.025, 0.55, 0.04]} p={[0.2, 0.7, 0.34]} c={STEEL} o={CHROME} />
        </Group>
      )}
      {unit(lux ? -0.3 : -0.36, 0.56, "a")}
      {unit(lux ? 1.0 : 0.92, lux ? 0.62 : 0.76, "b")}
      {/* worktop */}
      <Box s={[lux ? 1.98 : 2.0, topH, 0.68]} p={[lux ? 0.35 : 0.3, 0.84 + topH / 2, 0.01]} c={top} o={lux ? { rough: 0.25 } : { rough: 0.6 }} />
      {/* cooker */}
      {lux ? (
        <Group p={[0.4, 0, 0]}>
          <Box s={[0.9, 0.86, 0.66]} p={[0, 0.43, 0]} c="#b8c0c4" o={CHROME} />
          <Box s={[0.78, 0.5, 0.02]} p={[0, 0.42, 0.34]} c={BLACK} o={{ glow: 0, rough: 0.1 }} />
          <Box s={[0.7, 0.03, 0.03]} p={[0, 0.72, 0.37]} c={GOLD} o={BRASS} />
          {[-0.3, -0.15, 0, 0.15, 0.3].map((x) => (
            <Cyl key={x} rad={0.02} h={0.03} p={[x, 0.8, 0.345]} r={[Math.PI / 2, 0, 0]} c={GOLD} o={BRASS} />
          ))}
          {[[-0.22, -0.1], [0.22, -0.1], [-0.22, 0.14], [0.22, 0.14], [0, 0.02]].map(([x, z]) => (
            <Group key={`${x}${z}`} p={[x!, 0.89, z!]}>
              <Cyl rad={0.09} h={0.012} c={BLACK} shadow={false} />
              <Cyl rad={0.05} h={0.016} c="#555" shadow={false} />
            </Group>
          ))}
        </Group>
      ) : (
        <Group p={[0.22, 0, 0]}>
          <Box s={[0.6, 0.86, 0.62]} p={[0, 0.43, 0]} c={WHITE} />
          <Box s={[0.5, 0.36, 0.02]} p={[0, 0.4, 0.32]} c="#2b3640" o={{ rough: 0.15 }} />
          <Box s={[0.4, 0.025, 0.03]} p={[0, 0.65, 0.345]} c={STEEL} o={CHROME} />
          {[-0.2, -0.07, 0.07, 0.2].map((x) => (
            <Cyl key={x} rad={0.02} h={0.03} p={[x, 0.77, 0.32]} r={[Math.PI / 2, 0, 0]} c={BLACK} />
          ))}
          {[[-0.14, -0.08], [0.14, -0.08], [-0.14, 0.14], [0.14, 0.14]].map(([x, z]) => (
            <Cyl key={`${x}${z}`} rad={0.075} h={0.014} p={[x!, 0.867, z!]} c={BLACK} shadow={false} />
          ))}
        </Group>
      )}
      {/* sink and tap */}
      <Group p={[lux ? 1.0 : 0.92, 0, 0]}>
        <Box s={[0.46, 0.01, 0.36]} p={[0, 0.84 + topH + 0.002, 0.02]} c={STEEL} o={CHROME} shadow={false} />
        <Box s={[0.4, 0.02, 0.3]} p={[0, 0.84 + topH + 0.01, 0.02]} c="#707a80" o={CHROME} shadow={false} />
        <Cyl rad={0.018} h={0.26} p={[0, 0.84 + topH + 0.13, -0.24]} c={lux ? GOLD : STEEL} o={lux ? BRASS : CHROME} />
        <Cyl rad={0.014} h={0.18} p={[0, 0.84 + topH + 0.26, -0.15]} r={[Math.PI / 2, 0, 0]} c={lux ? GOLD : STEEL} o={lux ? BRASS : CHROME} />
      </Group>
      {/* wall units and extractor */}
      <Box s={[0.56, 0.62, 0.34]} p={[lux ? -0.3 : -0.36, 1.76, -0.15]} c={body} />
      <Box s={[lux ? 0.62 : 0.76, 0.62, 0.34]} p={[lux ? 1.0 : 0.92, 1.76, -0.15]} c={body} />
      <Box s={[0.5, 0.52, 0.015]} p={[lux ? -0.3 : -0.36, 1.76, 0.03]} c={lux ? "#35747a" : WHITE} />
      <Box s={[lux ? 0.56 : 0.7, 0.52, 0.015]} p={[lux ? 1.0 : 0.92, 1.76, 0.03]} c={lux ? "#35747a" : WHITE} />
      {lux ? (
        <Group p={[0.4, 0, -0.1]}>
          <Cone rad={0.5} h={0.5} p={[0, 1.78, 0]} c="#b87333" o={{ rough: 0.35, metal: 0.8 }} />
          <Box s={[0.28, 0.5, 0.28]} p={[0, 2.25, -0.04]} c="#b87333" o={{ rough: 0.35, metal: 0.8 }} />
        </Group>
      ) : (
        <Group p={[0.22, 0, -0.18]}>
          <Box s={[0.6, 0.12, 0.4]} p={[0, 1.5, 0.05]} c={STEEL} o={CHROME} />
          <Box s={[0.2, 0.5, 0.2]} p={[0, 1.9, -0.02]} c={STEEL} o={CHROME} />
        </Group>
      )}
      {lux && <Box s={[1.5, 0.015, 0.05]} p={[0.35, 1.44, 0.0]} c="#ffe2a0" o={{ emissive: "#ffd27a", glow: 1.4 }} shadow={false} />}
      {/* things on the worktop */}
      {lux ? (
        <Group p={[-0.3, 0.9, 0.05]}>
          <Cyl rad={0.13} h={0.05} p={[0, 0.03, 0]} c={WHITE} />
          {[[-0.04, 0.03], [0.05, 0.02], [0, -0.05]].map(([x, z], i) => (
            <Ball key={i} rad={0.05} p={[x!, 0.1, z!]} c={["#d9695a", "#e0b84a", "#6a9a4a"][i]!} />
          ))}
        </Group>
      ) : (
        <Group p={[-0.36, 0.88, 0.05]}>
          <Cyl rad={0.045} h={0.1} p={[0, 0.05, 0]} c={CORAL} />
          <Box s={[0.22, 0.015, 0.16]} p={[0.2, 0.01, 0.05]} c={WOOD_D} />
          <Cyl rad={0.07} h={0.04} p={[0.45, 0.03, 0]} c={WHITE} />
        </Group>
      )}
    </Group>
  );
}

/* ----------------------------------- TV ----------------------------------- */
export function Television({ lux }: Quality) {
  const tex = useMemo(() => screenTexture(lux ? "cinema" : "basic"), [lux]);
  const screen = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissive: new THREE.Color("#ffffff"), emissiveMap: tex, emissiveIntensity: 0.95, roughness: 0.3 }), [tex]);
  if (!lux)
    return (
      <Group>
        <Box s={[1.3, 0.44, 0.42]} p={[0, 0.22, 0]} c={WOOD_D} />
        <Box s={[0.62, 0.34, 0.02]} p={[-0.3, 0.22, 0.215]} c={WOOD} />
        <Box s={[0.62, 0.34, 0.02]} p={[0.3, 0.22, 0.215]} c={WOOD} />
        <Box s={[0.1, 0.02, 0.02]} p={[-0.3, 0.3, 0.23]} c={STEEL} />
        <Box s={[0.1, 0.02, 0.02]} p={[0.3, 0.3, 0.23]} c={STEEL} />
        <Box s={[1.0, 0.6, 0.06]} p={[0, 0.78, -0.02]} c={BLACK} />
        <mesh position={[0, 0.78, 0.012]} material={screen}>
          <planeGeometry args={[0.94, 0.53]} />
        </mesh>
        <Box s={[0.16, 0.12, 0.08]} p={[0, 0.5, -0.02]} c={BLACK} />
        <Box s={[0.4, 0.03, 0.2]} p={[0, 0.465, 0]} c={BLACK} />
      </Group>
    );
  return (
    <Group>
      <Round s={[1.34, 0.4, 0.44]} p={[0, 0.3, 0]} c={WALNUT} rad={0.03} />
      {[[-0.6, -0.17], [0.6, -0.17], [-0.6, 0.17], [0.6, 0.17]].map(([x, z]) => (
        <Cyl key={`${x}${z}`} rad={0.025} h={0.1} p={[x!, 0.05, z!]} c={GOLD} o={BRASS} />
      ))}
      <Box s={[1.28, 0.012, 0.02]} p={[0, 0.34, 0.225]} c={GOLD} o={BRASS} />
      <Box s={[1.34, 0.76, 0.04]} p={[0, 1.0, -0.02]} c={BLACK} />
      <mesh position={[0, 1.0, 0.003]} material={screen}>
        <planeGeometry args={[1.3, 0.72]} />
      </mesh>
      <Box s={[0.9, 0.07, 0.11]} p={[0, 0.54, 0.1]} c={BLACK} />
      <Box s={[0.84, 0.012, 0.01]} p={[0, 0.548, 0.157]} c={GOLD} o={{ ...BRASS, emissive: "#c9a24a", glow: 0.5 }} />
      <Box s={[0.05, 0.3, 0.03]} p={[0, 0.65, -0.03]} c="#222" />
    </Group>
  );
}

/* --------------------------------- Console -------------------------------- */
export function Console({ lux }: Quality) {
  return (
    <Group>
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map(([x, z]) => (
        <Cyl key={`${x}${z}`} rad={0.02} h={0.4} p={[x!, 0.2, z!]} c={lux ? GOLD : WOOD_D} {...(lux ? { o: BRASS } : {})} />
      ))}
      <Box s={[0.5, 0.04, 0.5]} p={[0, 0.42, 0]} c={lux ? WALNUT : WOOD} />
      {lux ? (
        <>
          <Round s={[0.085, 0.3, 0.22]} p={[0, 0.59, 0]} c={WHITE} rad={0.03} />
          <Box s={[0.012, 0.24, 0.02]} p={[0.045, 0.59, 0.05]} c="#55e0d0" o={{ emissive: "#55e0d0", glow: 2 }} shadow={false} />
          <Cyl rad={0.11} h={0.012} p={[0.17, 0.446, 0.08]} c="#222" />
          <Cyl rad={0.1} h={0.014} p={[0.17, 0.452, 0.08]} c="#55e0d0" o={{ emissive: "#55e0d0", glow: 1.6 }} shadow={false} />
          <Round s={[0.14, 0.035, 0.09]} p={[0.17, 0.48, 0.08]} c={WHITE} rad={0.015} />
        </>
      ) : (
        <>
          <Round s={[0.36, 0.075, 0.25]} p={[0, 0.48, -0.02]} c="#8a9298" rad={0.02} />
          <Box s={[0.2, 0.01, 0.02]} p={[0, 0.51, 0.11]} c={BLACK} />
          <Round s={[0.14, 0.035, 0.085]} p={[0.17, 0.455, 0.14]} r={[0, 0.3, 0]} c={BLACK} rad={0.014} />
          <Box s={[0.28, 0.1, 0.1]} p={[-0.05, 0.47, 0.18]} c="#2b3640" />
        </>
      )}
    </Group>
  );
}

/* -------------------------------- Bookshelf -------------------------------- */
const BOOK_COLS = ["#d9695a", "#2f7f79", "#e0b84a", "#6f7f93", "#e9dfc9", "#8a5a6b", "#4a7a4a"];
export function Bookshelf({ lux }: Quality) {
  const wood = lux ? WALNUT : WOOD;
  const shelves = [0.04, 0.4, 0.76, 1.12, 1.48];
  return (
    <Group>
      <Box s={[0.04, 1.84, 0.36]} p={[-0.455, 0.92, 0]} c={wood} />
      <Box s={[0.04, 1.84, 0.36]} p={[0.455, 0.92, 0]} c={wood} />
      <Box s={[0.95, 1.84, 0.02]} p={[0, 0.92, -0.17]} c={lux ? "#35261c" : WOOD_D} />
      {[...shelves, 1.82].map((y) => (
        <Box key={y} s={[0.87, 0.03, 0.34]} p={[0, y, 0]} c={wood} />
      ))}
      {shelves.slice(0, 4).map((y, row) =>
        Array.from({ length: 9 }, (_, i) => {
          const h = 0.22 + ((i * 7 + row * 3) % 4) * 0.03;
          const x = -0.38 + i * 0.075 + (row % 2 ? 0.02 : 0);
          return <Box key={`${row}${i}`} s={[0.052, h, 0.22]} p={[x, y + 0.015 + h / 2, -0.02]} r={[0, 0, i === 5 && row === 1 ? -0.25 : 0]} c={lux ? (i % 3 === 0 ? GOLD : ["#7a2d2d", "#1f4a42", "#2d3a5a"][i % 3]!) : BOOK_COLS[(i + row * 2) % BOOK_COLS.length]!} {...(lux && i % 3 === 0 ? { o: BRASS } : {})} />;
        }),
      )}
      {/* top shelf: plant pot and a trinket */}
      <Cyl rad={0.06} h={0.1} p={[-0.25, 1.52 + 0.05 + 0.01, 0]} c={lux ? GOLD : CORAL} {...(lux ? { o: BRASS } : {})} />
      <Ball rad={0.1} p={[-0.25, 1.78 - 0.1, 0]} c="#4a8a4a" sc={[0.1, 0.12, 0.1]} />
      {lux ? (
        <>
          <Box s={[1.05, 0.06, 0.42]} p={[0, 1.88, 0]} c={WALNUT} />
          <Box s={[0.99, 0.02, 0.4]} p={[0, 1.925, 0]} c={GOLD} o={BRASS} />
          <Box s={[0.4, 1.74, 0.012]} p={[-0.215, 0.9, 0.185]} c="#bfe4ee" o={{ opacity: 0.18, rough: 0.05 }} shadow={false} />
          <Box s={[0.4, 1.74, 0.012]} p={[0.215, 0.9, 0.185]} c="#bfe4ee" o={{ opacity: 0.18, rough: 0.05 }} shadow={false} />
          <Box s={[0.03, 0.1, 0.03]} p={[-0.03, 0.9, 0.2]} c={GOLD} o={BRASS} />
          <Box s={[0.03, 0.1, 0.03]} p={[0.03, 0.9, 0.2]} c={GOLD} o={BRASS} />
          <Ball rad={0.09} p={[0.28, 1.57, 0]} c="#3f6a8a" o={{ rough: 0.4 }} />
        </>
      ) : (
        <Box s={[0.16, 0.12, 0.16]} p={[0.28, 1.58, 0]} c={CREAM} />
      )}
    </Group>
  );
}

/* --------------------------------- Weights --------------------------------- */
function Plate({ x, rad, c, y, t = 0.045 }: { x: number; rad: number; c: string; y: number; t?: number }) {
  return <Cyl rad={rad} h={t} p={[x, y, 0]} r={[0, 0, Math.PI / 2]} c={c} o={{ rough: 0.5 }} />;
}
export function Weights({ lux }: Quality) {
  if (!lux)
    return (
      <Group>
        <Box s={[1.5, 0.025, 1.08]} p={[0, 0.0125, 0]} c="#2d2f33" o={{ rough: 0.95 }} shadow={false} />
        {/* flat bench */}
        <Round s={[0.34, 0.1, 0.95]} p={[-0.38, 0.4, -0.02]} c={BLACK} rad={0.03} />
        <Box s={[0.28, 0.02, 0.8]} p={[-0.38, 0.465, -0.02]} c={CORAL} />
        {[-0.3, 0.3].map((z) => (
          <Box key={z} s={[0.3, 0.36, 0.04]} p={[-0.38, 0.19, z]} c={STEEL} o={CHROME} />
        ))}
        {/* barbell across the floor */}
        <Group p={[0.2, 0, 0.3]}>
          <Cyl rad={0.015} h={1.4} p={[0, 0.08, 0]} r={[0, 0, Math.PI / 2]} c={STEEL} o={CHROME} />
          {[-0.55, -0.6, 0.55, 0.6].map((x) => (
            <Plate key={x} x={x} y={0.1} rad={0.12} c={BLACK} t={0.05} />
          ))}
        </Group>
        {/* dumbbells */}
        {[0, 1].map((i) => (
          <Group key={i} p={[0.38, 0, -0.2 + i * 0.2]}>
            <Cyl rad={0.02} h={0.28} p={[0, 0.06, 0]} r={[0, 0, Math.PI / 2]} c={STEEL} o={CHROME} />
            <Plate x={-0.12} y={0.065} rad={0.065} c="#444" t={0.05} />
            <Plate x={0.12} y={0.065} rad={0.065} c="#444" t={0.05} />
          </Group>
        ))}
        <Cyl rad={0.14} h={0.03} p={[-0.2, 0.025, -0.4]} c={BLACK} />
        <Cyl rad={0.14} h={0.03} p={[-0.2, 0.055, -0.4]} c="#3a3d42" />
      </Group>
    );
  return (
    <Group>
      <Box s={[1.5, 0.03, 1.1]} p={[0, 0.015, 0]} c="#1f2124" o={{ rough: 0.95 }} shadow={false} />
      {/* chrome power rack */}
      {[[-0.5, -0.4], [0.5, -0.4], [-0.5, -0.05], [0.5, -0.05]].map(([x, z]) => (
        <Box key={`${x}${z}`} s={[0.05, 2.1, 0.05]} p={[x!, 1.05, z!]} c={STEEL} o={CHROME} />
      ))}
      {[-0.4, -0.05].map((z) => (
        <Box key={z} s={[1.05, 0.05, 0.05]} p={[0, 2.08, z]} c={STEEL} o={CHROME} />
      ))}
      <Box s={[1.05, 0.05, 0.05]} p={[0, 0.3, -0.4]} c={STEEL} o={CHROME} />
      <Cyl rad={0.018} h={1.1} p={[0, 1.95, -0.22]} r={[0, 0, Math.PI / 2]} c={STEEL} o={CHROME} />
      {[-0.5, 0.5].map((x) => (
        <Box key={x} s={[0.05, 0.05, 0.38]} p={[x, 1.95, -0.22]} c={STEEL} o={CHROME} />
      ))}
      {/* racked barbell with bumper plates */}
      <Group p={[0, 1.3, -0.22]}>
        <Cyl rad={0.016} h={1.6} r={[0, 0, Math.PI / 2]} c={STEEL} o={CHROME} />
        {[-0.62, 0.62].map((x) => (
          <Plate key={x} x={x} y={0} rad={0.17} c="#c0392b" t={0.06} />
        ))}
        {[-0.69, 0.69].map((x) => (
          <Plate key={x} x={x} y={0} rad={0.14} c="#2d5f8a" t={0.05} />
        ))}
      </Group>
      {/* padded bench */}
      <Round s={[0.34, 0.12, 0.95]} p={[0.0, 0.43, 0.5]} c={TEAL} rad={0.045} />
      <Box s={[0.14, 0.4, 0.06]} p={[0, 0.2, 0.15]} c={STEEL} o={CHROME} />
      <Box s={[0.14, 0.4, 0.06]} p={[0, 0.2, 0.82]} c={STEEL} o={CHROME} />
      {/* dumbbell rack */}
      <Group p={[0.55, 0, 0.42]}>
        <Box s={[0.4, 0.04, 0.8]} p={[0, 0.48, 0]} c={STEEL} o={CHROME} />
        <Box s={[0.4, 0.04, 0.8]} p={[0, 0.78, 0]} c={STEEL} o={CHROME} />
        {[-0.16, 0.16].map((x) => (
          <Box key={x} s={[0.04, 0.8, 0.8]} p={[x, 0.4, 0]} c={STEEL} o={CHROME} />
        ))}
        {[0, 1, 2].map((i) => (
          <Group key={i} p={[0, 0, -0.28 + i * 0.28]}>
            <Cyl rad={0.02} h={0.24} p={[0, 0.54, 0]} r={[0, 0, Math.PI / 2]} c={STEEL} o={CHROME} />
            <Cyl rad={0.06 + i * 0.01} h={0.06} p={[-0.1, 0.54, 0]} r={[0, 0, Math.PI / 2]} c={BLACK} />
            <Cyl rad={0.06 + i * 0.01} h={0.06} p={[0.1, 0.54, 0]} r={[0, 0, Math.PI / 2]} c={BLACK} />
            <Cyl rad={0.02} h={0.24} p={[0, 0.84, 0]} r={[0, 0, Math.PI / 2]} c={STEEL} o={CHROME} />
            <Cyl rad={0.045 + i * 0.01} h={0.06} p={[-0.1, 0.84, 0]} r={[0, 0, Math.PI / 2]} c={CORAL} />
            <Cyl rad={0.045 + i * 0.01} h={0.06} p={[0.1, 0.84, 0]} r={[0, 0, Math.PI / 2]} c={CORAL} />
          </Group>
        ))}
      </Group>
    </Group>
  );
}

/* ----------------------------------- Desk ---------------------------------- */
export function Desk({ lux }: Quality) {
  if (!lux)
    return (
      <Group>
        <Box s={[1.5, 0.04, 0.7]} p={[0, 0.74, 0]} c={WOOD} />
        {[[-0.7, -0.3], [0.7, -0.3], [-0.7, 0.3]].map(([x, z]) => (
          <Box key={`${x}${z}`} s={[0.05, 0.72, 0.05]} p={[x!, 0.36, z!]} c={WOOD_D} />
        ))}
        <Box s={[0.4, 0.66, 0.62]} p={[0.52, 0.36, 0]} c={WOOD_D} />
        {[0.5, 0.34, 0.18].map((y) => (
          <Box key={y} s={[0.34, 0.12, 0.012]} p={[0.52, y + 0.06, 0.315]} c={WOOD} />
        ))}
        {/* monitor, keyboard, notebook, mug */}
        <Box s={[0.52, 0.34, 0.04]} p={[-0.2, 1.03, -0.15]} c={BLACK} />
        <Box s={[0.46, 0.28, 0.01]} p={[-0.2, 1.03, -0.125]} c="#1d4a64" o={{ emissive: "#2b7fa8", glow: 0.7 }} shadow={false} />
        <Box s={[0.08, 0.16, 0.06]} p={[-0.2, 0.84, -0.15]} c={BLACK} />
        <Box s={[0.4, 0.015, 0.14]} p={[-0.2, 0.775, 0.12]} c="#d8d4c8" />
        <Box s={[0.28, 0.012, 0.2]} p={[0.2, 0.766, 0.1]} r={[0, 0.2, 0]} c={WHITE} />
        <Cyl rad={0.035} h={0.08} p={[0.35, 0.8, -0.22]} c={CORAL} />
        {/* chair */}
        <Group p={[0.0, 0, 0.78]}>
          <Round s={[0.44, 0.06, 0.44]} p={[0, 0.46, 0]} c={CORAL} rad={0.025} />
          {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z]) => (
            <Cyl key={`${x}${z}`} rad={0.02} h={0.44} p={[x!, 0.22, z!]} c={WOOD_D} />
          ))}
          <Box s={[0.42, 0.36, 0.035]} p={[0, 0.72, 0.2]} c={WOOD} />
        </Group>
      </Group>
    );
  return (
    <Group>
      <Round s={[1.5, 0.06, 0.75]} p={[0, 0.76, 0]} c={WALNUT} rad={0.02} />
      {[-0.5, 0.5].map((x) => (
        <Group key={x} p={[x, 0, 0]}>
          <Box s={[0.44, 0.7, 0.66]} p={[0, 0.37, 0]} c="#3b2519" />
          {[0.6, 0.42, 0.24].map((y) => (
            <Group key={y}>
              <Box s={[0.38, 0.14, 0.012]} p={[0, y + 0.02, 0.335]} c={WALNUT} />
              <Box s={[0.12, 0.014, 0.02]} p={[0, y + 0.02, 0.35]} c={GOLD} o={BRASS} />
            </Group>
          ))}
        </Group>
      ))}
      <Box s={[0.56, 0.4, 0.02]} p={[0, 0.5, -0.3]} c="#3b2519" />
      <Box s={[0.9, 0.012, 0.42]} p={[0, 0.796, 0.1]} c="#1f4a3a" o={{ rough: 0.5 }} />
      {/* laptop */}
      <Group p={[-0.12, 0.8, 0.0]}>
        <Round s={[0.36, 0.014, 0.25]} p={[0, 0.007, 0.08]} c="#c9ced1" rad={0.005} o={CHROME} />
        <Group p={[0, 0.01, -0.04]} r={[-0.25, 0, 0]}>
          <Round s={[0.36, 0.24, 0.012]} p={[0, 0.12, 0]} c="#c9ced1" rad={0.005} o={CHROME} />
          <Box s={[0.33, 0.21, 0.004]} p={[0, 0.12, 0.008]} c="#2d5f8a" o={{ emissive: "#4aa0d8", glow: 0.9 }} shadow={false} />
        </Group>
      </Group>
      {/* brass reading lamp */}
      <Group p={[0.6, 0.79, -0.22]}>
        <Cyl rad={0.07} h={0.02} p={[0, 0.01, 0]} c={GOLD} o={BRASS} />
        <Cyl rad={0.012} h={0.36} p={[0, 0.2, 0]} c={GOLD} o={BRASS} />
        <Cone rad={0.11} h={0.14} p={[0, 0.4, 0]} r={[Math.PI, 0, 0]} c="#2f6a52" o={{ emissive: "#ffd98a", glow: 0.7 }} />
      </Group>
      <Box s={[0.08, 0.1, 0.08]} p={[0.35, 0.84, 0.12]} c={BLACK} />
      {/* leather chair */}
      <Group p={[0, 0, 0.85]}>
        <Cyl rad={0.03} h={0.3} p={[0, 0.2, 0]} c={BLACK} o={CHROME} />
        <Cyl rad={0.27} h={0.03} p={[0, 0.03, 0]} c={BLACK} o={CHROME} />
        <Round s={[0.54, 0.12, 0.54]} p={[0, 0.5, 0]} c="#5a3a2a" rad={0.05} o={{ rough: 0.45 }} />
        <Round s={[0.52, 0.78, 0.12]} p={[0, 0.92, 0.26]} c="#5a3a2a" rad={0.06} o={{ rough: 0.45 }} />
        {[-0.3, 0.3].map((x) => (
          <Round key={x} s={[0.08, 0.06, 0.4]} p={[x, 0.68, 0.03]} c="#3b2519" rad={0.02} />
        ))}
      </Group>
    </Group>
  );
}

/* ------------------------------ Estate board ------------------------------ */
export function EstateBoard() {
  const tex = useMemo(() => signTexture("FOR SALE", "Move up in the world"), []);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 }), [tex]);
  return (
    <Group>
      <Box s={[0.05, 1.0, 0.05]} p={[-0.28, 0.5, 0]} c={WOOD_D} />
      <Box s={[0.05, 1.0, 0.05]} p={[0.28, 0.5, 0]} c={WOOD_D} />
      <Box s={[0.76, 0.56, 0.04]} p={[0, 0.9, 0]} c={WHITE} />
      <mesh position={[0, 0.9, 0.022]} material={face}>
        <planeGeometry args={[0.7, 0.5]} />
      </mesh>
    </Group>
  );
}

/** Framed art used as wall decoration. */
export function Frame({ w, h, art }: { w: number; h: number; art: number }) {
  const tex = useMemo(() => artTexture(art), [art]);
  const face = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 }), [tex]);
  return (
    <Group>
      <Box s={[w + 0.06, h + 0.06, 0.03]} c="#3a2c22" shadow={false} />
      <mesh position={[0, 0, 0.017]} material={face}>
        <planeGeometry args={[w, h]} />
      </mesh>
    </Group>
  );
}

export { mat };
