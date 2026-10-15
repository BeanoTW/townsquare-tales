import { Ball, Box, Cyl, Group, Round } from "./primitives";
import { Frame } from "./furniture";
import { Plant } from "./StudioShell";
import { Blind, BookStack, Curtains, DoorMat, Hedge, Mirror, Pendant, Radiator, Rug, Splashback, Tree, Wardrobe } from "./decor";

/**
 * Suburban House fixtures: a family home with separate, ordinary rooms. Everything here is architecture,
 * decoration or clutter. Furniture the player owns is drawn from the shared slots instead.
 */
const CREAM = "#e9dfc9";

function DiningSet() {
  return (
    <Group p={[8.5, 0, 3.0]}>
      <Round s={[1.5, 0.05, 0.9]} p={[0, 0.74, 0]} c="#9a6b43" rad={0.02} />
      {[[-0.65, -0.35], [0.65, -0.35], [-0.65, 0.35], [0.65, 0.35]].map(([x, z]) => (
        <Box key={`${x}${z}`} s={[0.06, 0.72, 0.06]} p={[x!, 0.36, z!]} c="#6b4a32" />
      ))}
      {[[-0.38, -0.62, 0], [0.38, -0.62, 0], [-0.38, 0.62, Math.PI], [0.38, 0.62, Math.PI]].map(([x, z, r], i) => (
        <Group key={i} p={[x!, 0, z!]} r={[0, r!, 0]}>
          <Round s={[0.4, 0.05, 0.4]} p={[0, 0.45, 0]} c="#b9805a" rad={0.02} />
          <Box s={[0.4, 0.45, 0.04]} p={[0, 0.7, -0.18]} c="#b9805a" />
          {[[-0.17, -0.17], [0.17, -0.17], [-0.17, 0.17], [0.17, 0.17]].map(([a, b]) => (
            <Box key={`${a}${b}`} s={[0.035, 0.44, 0.035]} p={[a!, 0.22, b!]} c="#6b4a32" shadow={false} />
          ))}
        </Group>
      ))}
      {/* fruit bowl and a runner */}
      <Box s={[1.1, 0.008, 0.28]} p={[0, 0.768, 0]} c="#2f7f79" shadow={false} />
      <Cyl rad={0.12} h={0.06} p={[0, 0.8, 0]} c="#efe6d2" />
      <Ball rad={0.05} p={[-0.04, 0.86, 0.02]} c="#d9695a" />
      <Ball rad={0.05} p={[0.05, 0.86, -0.02]} c="#e9c24a" />
    </Group>
  );
}

function PorchAndGarden() {
  return (
    <Group>
      {/* step, path and a porch light by the red front door */}
      <Box s={[1.5, 0.1, 0.55]} p={[5.6, 0.02, 8.22]} c="#a9a79d" o={{ rough: 1 }} />
      {[0, 1, 2, 3, 4].map((i) => (
        <Box key={i} s={[1.1, 0.04, 0.5]} p={[5.6 + (i % 2 ? 0.06 : -0.06), -0.015, 8.75 + i * 0.28]} c="#b7b3a6" o={{ rough: 1 }} shadow={false} />
      ))}
      <Hedge p={[3.0, -0.02, 8.9]} w={3.4} />
      <Hedge p={[8.55, -0.02, 8.9]} w={3.4} />
      <Tree p={[1.2, 0, 9.4]} s={1.1} />
      <Tree p={[10.2, 0, 9.5]} s={0.95} />
      {/* letterbox post */}
      <Cyl rad={0.04} h={0.95} p={[7.2, 0.45, 9.5]} c="#4a4038" />
      <Round s={[0.3, 0.2, 0.22]} p={[7.2, 1.0, 9.5]} c="#c0392b" rad={0.04} />
      {/* a garden gnome, because every suburban house has one */}
      <Group p={[4.2, 0, 8.9]}>
        <Cyl rad={0.07} h={0.2} p={[0, 0.1, 0]} c="#4a7a9a" />
        <Ball rad={0.05} p={[0, 0.26, 0]} c="#f0d5b7" />
        <Cyl rad={0.045} h={0.14} p={[0, 0.36, 0]} c="#c0392b" />
      </Group>
    </Group>
  );
}

export function SuburbanDecor({ owned }: { owned: ReadonlySet<string> }) {
  void owned;
  return (
    <Group>
      {/* ---------------- living room ---------------- */}
      <Rug p={[1.55, 3.1]} w={2.7} d={2.1} cols={[CREAM, "#2f7f79", "#d9695a", "#efe6d2"]} />
      <Curtains p={[4.7, 0, 0.17]} w={1.6} colour="#b95a49" drop={1.35} top={2.15} pelmet="#8a4a3a" />
      <Curtains p={[0.17, 0, 1.25]} rot={Math.PI / 2} w={1.1} colour="#b95a49" drop={1.35} top={2.15} />
      <Radiator p={[0.12, 0.35, 1.25]} rot={Math.PI / 2} />
      <Pendant p={[3.0, 2.28, 2.5]} r={0.3} colour="#f1dfb0" />
      <Group p={[5.93, 1.5, 3.4]} r={[0, -Math.PI / 2, 0]}>
        <Frame w={0.7} h={0.5} art={2} />
      </Group>
      <Group p={[2.0, 1.45, 0.09]}>
        <Frame w={0.5} h={0.62} art={1} />
      </Group>
      <Plant p={[5.65, 0, 0.35]} big />
      <BookStack p={[0.45, 0.5, 1.95]} />
      <Group p={[3.5, 0, 0.6]}>
        {/* standing lamp */}
        <Cyl rad={0.14} h={0.03} p={[0, 0.015, 0]} c="#2a2a2c" />
        <Cyl rad={0.012} h={1.4} p={[0, 0.72, 0]} c="#2a2a2c" />
        <Cyl rad={0.2} h={0.28} p={[0, 1.5, 0]} c="#f1dfb0" o={{ emissive: "#ffd98a", glow: 0.9, rough: 0.9 }} />
      </Group>

      {/* ---------------- hall ---------------- */}
      <DoorMat p={[5.6, 7.55]} />
      <Group p={[6.5, 0, 7.45]}>
        <Box s={[0.05, 1.2, 0.5]} p={[0.04, 1.55, 0]} c="#6b4a32" shadow={false} />
        {[-0.18, 0, 0.18].map((z, i) => (
          <Round key={z} s={[0.1, 0.7 - i * 0.08, 0.2]} p={[0.0, 1.4 - i * 0.04, z]} c={["#2f6a64", "#8a3a3a", "#6a6a74"][i]!} rad={0.04} />
        ))}
      </Group>
      <Pendant p={[5.6, 2.35, 6.2]} r={0.22} colour="#efe3c0" />
      <Round s={[0.12, 0.09, 0.26]} p={[5.0, 0.05, 7.4]} r={[0, 0.3, 0]} c="#3a3a3f" rad={0.03} />

      {/* ---------------- kitchen ---------------- */}
      <DiningSet />
      <Splashback p={[8.3, 1.2, 0.09]} w={2.6} />
      <Blind p={[8.3, 0, 0.12]} w={1.9} top={2.1} drop={0.45} />
      <Curtains p={[11.04, 0, 1.8]} rot={-Math.PI / 2} w={1.55} colour="#d7b24a" drop={1.3} top={2.15} />
      <Pendant p={[8.5, 2.3, 3.0]} r={0.26} colour="#e9c24a" />
      <Group p={[6.15, 1.6, 3.6]} r={[0, Math.PI / 2, 0]}>
        {/* wall clock */}
        <Cyl rad={0.17} h={0.03} r={[Math.PI / 2, 0, 0]} c="#f4f1ea" />
        <Box s={[0.012, 0.11, 0.012]} p={[0, 0.05, 0.02]} c="#222" shadow={false} />
        <Box s={[0.1, 0.012, 0.012]} p={[0.04, 0, 0.02]} c="#222" shadow={false} />
      </Group>
      <Plant p={[10.8, 0, 4.1]} small />

      {/* ---------------- bedroom ---------------- */}
      <Rug p={[3.1, 6.0]} w={3.2} d={2.6} cols={["#d9cde4", "#9b879f", "#e9dfe9", "#c9b6d4"]} />
      <Wardrobe p={[0.4, 0, 5.1]} rot={Math.PI / 2} w={1.0} d={0.6} />
      <Curtains p={[2.3, 0, 7.83]} rot={Math.PI} w={1.8} colour="#9b879f" drop={1.4} top={2.2} pelmet="#7a6a84" />
      <Curtains p={[0.17, 0, 6.0]} rot={Math.PI / 2} w={1.4} colour="#9b879f" drop={1.4} top={2.2} />
      <Group p={[3.1, 1.55, 4.5]}>
        <Frame w={0.8} h={0.55} art={0} />
      </Group>
      <Pendant p={[2.5, 2.3, 6.4]} r={0.28} colour="#e6dcf0" />
      <Plant p={[4.3, 0, 7.6]} small />
      <Group p={[1.0, 0, 7.5]}>
        {/* laundry basket */}
        <Cyl rad={0.22} h={0.5} p={[0, 0.25, 0]} c="#cfc6b0" />
        <Round s={[0.3, 0.1, 0.2]} p={[0.04, 0.56, 0]} r={[0.2, 0.4, 0.3]} c="#d9695a" rad={0.04} />
      </Group>

      {/* ---------------- study and gym ---------------- */}
      <Rug p={[7.7, 6.7]} w={2.0} d={1.5} cols={["#cfd9e2", "#617e94", "#9ab0c2", "#d9e2ea"]} />
      <Blind p={[7.8, 0, 7.85]} rot={Math.PI} w={1.2} top={2.05} drop={0.45} />
      <Mirror p={[10.1, 1.25, 4.5]} w={1.7} h={1.5} />
      <Group p={[6.7, 1.45, 7.2]} r={[0, Math.PI / 2, 0]}>
        {/* pinboard */}
        <Box s={[0.7, 0.5, 0.03]} c="#b9805a" />
        {[[-0.2, 0.1, "#fff8e6"], [0.05, -0.05, "#d9695a"], [0.22, 0.12, "#f3bf6a"]].map(([x, y, c]) => (
          <Box key={String(x)} s={[0.18, 0.2, 0.012]} p={[x as number, y as number, 0.02]} c={c as string} shadow={false} />
        ))}
      </Group>
      <Group p={[10.78, 0, 7.48]}>
        {/* water cooler */}
        <Round s={[0.34, 0.9, 0.34]} p={[0, 0.45, 0]} c="#e8eef2" rad={0.05} />
        <Cyl rad={0.12} h={0.3} p={[0, 1.05, 0]} c="#9fd0ea" o={{ opacity: 0.6, rough: 0.1 }} shadow={false} />
      </Group>
      <Group p={[10.75, 0.02, 7.0]} r={[0, 0.5, 0]}>
        {/* rolled yoga mat */}
        <Cyl rad={0.07} h={0.6} r={[0, 0, Math.PI / 2]} p={[0, 0.07, 0]} c="#2f7f79" />
      </Group>
      <Pendant p={[7.7, 2.3, 6.2]} r={0.24} colour="#d7e2ee" />

      <PorchAndGarden />
    </Group>
  );
}
