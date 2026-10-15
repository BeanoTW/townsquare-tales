import { Ball, Box, Cone, Cyl, Group, Round, mat } from "./primitives";
import { floorTexture } from "./textures";

/** Small architectural and decorative pieces shared by the house shells. None of them is purchasable furniture. */
type V3 = [number, number, number];

/** A rug made of nested borders. `rot` turns it about the vertical axis. */
export function Rug({ p, w, d, rot = 0, cols }: { p: [number, number]; w: number; d: number; rot?: number; cols: [string, string, string, string] }) {
  return (
    <Group p={[p[0], 0, p[1]]} r={[0, rot, 0]}>
      <Box s={[w, 0.012, d]} p={[0, 0.026, 0]} c={cols[0]} o={{ rough: 1 }} shadow={false} />
      <Box s={[w - 0.2, 0.014, d - 0.2]} p={[0, 0.028, 0]} c={cols[1]} o={{ rough: 1 }} shadow={false} />
      <Box s={[w - 0.5, 0.016, d - 0.5]} p={[0, 0.03, 0]} c={cols[2]} o={{ rough: 1 }} shadow={false} />
      <Box s={[w - 0.8, 0.018, d - 0.8]} p={[0, 0.032, 0]} c={cols[3]} o={{ rough: 1 }} shadow={false} />
    </Group>
  );
}

/** Curtains with a rod, two pleated panels and a tie-back. Centred on the window, facing +z (rotate for other walls). */
export function Curtains({ p, rot = 0, w, drop = 1.5, top = 2.2, colour, pelmet }: { p: V3; rot?: number; w: number; drop?: number; top?: number; colour: string; pelmet?: string }) {
  const pw = Math.min(0.5, w * 0.22);
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Cyl rad={0.014} h={w + 0.5} p={[0, top, 0]} r={[0, 0, Math.PI / 2]} c="#2a2a2c" o={{ rough: 0.4, metal: 0.5 }} />
      {[-1, 1].map((s) => (
        <Group key={s} p={[s * (w / 2 + 0.02 - pw / 2), top - drop / 2 - 0.05, 0]}>
          <Round s={[pw, drop, 0.07]} c={colour} rad={0.02} />
          {[-0.35, -0.12, 0.12, 0.35].map((f) => (
            <Box key={f} s={[0.012, drop - 0.02, 0.09]} p={[f * pw, 0, 0]} c={colour} o={{ rough: 1 }} shadow={false} />
          ))}
          <Box s={[pw + 0.02, 0.05, 0.1]} p={[0, -drop * 0.12, 0]} c="#e9dfc9" shadow={false} />
        </Group>
      ))}
      {pelmet && <Box s={[w + 0.5, 0.16, 0.14]} p={[0, top + 0.1, 0]} c={pelmet} />}
    </Group>
  );
}

/** Roller blind half drawn. */
export function Blind({ p, rot = 0, w, top = 2.1, drop = 0.5, colour = "#e9dfc9" }: { p: V3; rot?: number; w: number; top?: number; drop?: number; colour?: string }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[w, drop, 0.03]} p={[0, top - drop / 2, 0]} c={colour} />
      <Cyl rad={0.02} h={w + 0.02} p={[0, top + 0.02, 0]} r={[0, 0, Math.PI / 2]} c="#cfc6b0" />
    </Group>
  );
}

export function Radiator({ p, rot = 0, w = 1.05 }: { p: V3; rot?: number; w?: number }) {
  const n = Math.round(w / 0.115);
  return (
    <Group p={p} r={[0, rot, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <Box key={i} s={[0.07, 0.5, 0.06]} p={[-w / 2 + 0.05 + i * ((w - 0.1) / (n - 1)), 0, 0]} c="#f4f1ea" shadow={false} />
      ))}
      <Box s={[w, 0.04, 0.06]} p={[0, 0.27, 0]} c="#f4f1ea" shadow={false} />
      <Box s={[w, 0.04, 0.06]} p={[0, -0.24, 0]} c="#f4f1ea" shadow={false} />
    </Group>
  );
}

/** A hanging pendant: cord, shade and a warm glow. */
export function Pendant({ p, r = 0.22, h = 0.18, colour = "#f1dfb0", cord = 0.5 }: { p: V3; r?: number; h?: number; colour?: string; cord?: number }) {
  return (
    <Group p={p}>
      <Cyl rad={0.006} h={cord} p={[0, cord / 2 + h / 2, 0]} c="#222" shadow={false} />
      <Cone rad={r} h={h} r={[Math.PI, 0, 0]} c={colour} o={{ emissive: "#ffd98a", glow: 0.9, rough: 0.9 }} shadow={false} />
      <Ball rad={0.05} p={[0, -0.02, 0]} c="#fff4d2" o={{ emissive: "#ffe2a0", glow: 2 }} shadow={false} />
    </Group>
  );
}

/** A built-in wardrobe with two doors and handles, on the floor, back to the wall (front toward +z). */
export function Wardrobe({ p, rot = 0, w = 1.0, d = 0.6, h = 2.15, c = "#e4dcc8", handle = "#8a7a60" }: { p: V3; rot?: number; w?: number; d?: number; h?: number; c?: string; handle?: string }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[w, h, d]} p={[0, h / 2, 0]} c={c} />
      {[-1, 1].map((s) => (
        <Box key={s} s={[w / 2 - 0.04, h - 0.15, 0.012]} p={[s * (w / 4), h / 2, d / 2 + 0.006]} c="#d3c9b0" shadow={false} />
      ))}
      {[-0.05, 0.05].map((x) => (
        <Box key={x} s={[0.02, 0.2, 0.02]} p={[x, h / 2, d / 2 + 0.025]} c={handle} shadow={false} />
      ))}
      <Box s={[w + 0.04, 0.05, d + 0.04]} p={[0, h + 0.02, 0]} c="#cfc6b0" shadow={false} />
    </Group>
  );
}

export function DoorMat({ p, rot = 0 }: { p: [number, number]; rot?: number }) {
  return (
    <Group p={[p[0], 0, p[1]]} r={[0, rot, 0]}>
      <Box s={[0.8, 0.02, 0.5]} p={[0, 0.03, 0]} c="#6a5340" o={{ rough: 1 }} shadow={false} />
      <Box s={[0.64, 0.022, 0.34]} p={[0, 0.032, 0]} c="#8a7050" o={{ rough: 1 }} shadow={false} />
      <Box s={[0.22, 0.01, 0.14]} p={[0.1, 0.044, 0.05]} r={[0, 0.3, 0]} c="#f4f1ea" shadow={false} />
    </Group>
  );
}

/** Ceramic tile splashback: the same tile texture as the floor, hung on a wall. */
export function Splashback({ p, w, h = 0.6, rot = 0 }: { p: V3; w: number; h?: number; rot?: number }) {
  const { map } = floorTexture("tile", w, h);
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[w, h, 0.012]} m={mat("#ffffff", { rough: 0.25, map })} shadow={false} />
    </Group>
  );
}

export function Hedge({ p, w, d = 0.5, h = 0.6 }: { p: V3; w: number; d?: number; h?: number }) {
  return (
    <Group p={p}>
      <Round s={[w, h, d]} p={[0, h / 2, 0]} c="#3f7a3c" rad={0.14} />
      <Round s={[w - 0.2, h * 0.5, d - 0.1]} p={[0, h * 0.78, 0]} c="#4a8a46" rad={0.12} />
    </Group>
  );
}

export function Tree({ p, s = 1 }: { p: V3; s?: number }) {
  return (
    <Group p={p}>
      <Cyl rad={0.1 * s} h={1.1 * s} p={[0, 0.55 * s, 0]} c="#6b4a32" o={{ rough: 1 }} />
      {([[0, 1.45, 0, 0.62], [0.32, 1.25, 0.12, 0.45], [-0.3, 1.3, -0.1, 0.48], [0.05, 1.85, 0.05, 0.42]] as const).map(([x, y, z, r], i) => (
        <Ball key={i} rad={r * s} p={[x * s, y * s, z * s]} c={i % 2 ? "#3f8a4a" : "#4aa05a"} o={{ rough: 1 }} />
      ))}
    </Group>
  );
}

/** A wall-mounted mirror in a thin frame; faces +z. */
export function Mirror({ p, w, h, rot = 0 }: { p: V3; w: number; h: number; rot?: number }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[w + 0.06, h + 0.06, 0.03]} c="#2a2a2c" shadow={false} />
      <Box s={[w, h, 0.012]} p={[0, 0, 0.02]} c="#cfe2ea" o={{ rough: 0.05, metal: 0.8 }} shadow={false} />
      <Box s={[0.05, h * 0.9, 0.004]} p={[w * 0.2, 0, 0.028]} r={[0, 0, 0.5]} c="#ffffff" o={{ opacity: 0.35 }} shadow={false} />
    </Group>
  );
}

/** A stack of coloured books lying flat. */
export function BookStack({ p, rot = 0 }: { p: V3; rot?: number }) {
  return (
    <Group p={p} r={[0, rot, 0]}>
      <Box s={[0.26, 0.04, 0.19]} p={[0, 0.02, 0]} c="#2f6a64" shadow={false} />
      <Box s={[0.24, 0.035, 0.18]} p={[0.01, 0.0575, 0]} r={[0, 0.2, 0]} c="#b8442f" shadow={false} />
      <Box s={[0.22, 0.03, 0.17]} p={[0, 0.09, 0]} r={[0, -0.15, 0]} c="#c9a24a" shadow={false} />
    </Group>
  );
}
