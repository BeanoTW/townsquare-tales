import { useMemo } from "react";
import { BRASS, Ball, Box, Clock, Cyl, Group, Instanced, NoticeBoard, Plant, QueuePost, Racking, Rope, Round, STEEL, Sign, type V3 } from "./kit";

/**
 * Town Post Office: a public hall with a long glazed counter, PO boxes and a writing ledge, and behind a
 * staff door the sorting office. Fixtures face +z (the customer); decor is in plan coordinates (POST in
 * src/lib/home3d/town-venues.ts). Wall-mounted pieces sit on the back, partition-back and side walls only.
 */
const RED = "#a93d37";
const RED_D = "#7e2a26";
const CREAM = "#f4ead6";
const OAK = "#8a5a38";
const OAK_D = "#5e3c25";

/** Interactive: the three-position counter with glazed screens, scales and a card reader at each window. */
function PostCounter() {
  return (
    <Group>
      {/* panelled oak counter with a red kick band */}
      <Box s={[7.2, 1.0, 0.8]} p={[0, 0.5, 0]} c={OAK} o={{ rough: 0.6 }} />
      {[-3, -2, -1, 0, 1, 2, 3].map((x) => <Box key={x} s={[0.85, 0.62, 0.02]} p={[x * 1.0, 0.52, 0.41]} c={OAK_D} />)}
      <Box s={[7.24, 0.1, 0.02]} p={[0, 0.05, 0.41]} c={RED} />
      <Round s={[7.3, 0.05, 0.88]} p={[0, 1.02, 0]} c={CREAM} rad={0.015} />
      {/* glass screens between brass-framed uprights, with a speaking slot and a pass-through tray */}
      {[-3.6, -1.2, 1.2, 3.6].map((x) => <Box key={x} s={[0.06, 1.1, 0.06]} p={[x, 1.6, -0.15]} c="#c9a24a" o={BRASS} />)}
      <Box s={[7.2, 0.06, 0.08]} p={[0, 2.15, -0.15]} c="#c9a24a" o={BRASS} />
      {[-2.4, 0, 2.4].map((x, i) => (
        <Group key={x} p={[x, 0, 0]}>
          <Box s={[2.3, 1.0, 0.015]} p={[0, 1.6, -0.15]} c="#dff0f5" o={{ opacity: 0.25, rough: 0.05 }} shadow={false} />
          <Box s={[0.5, 0.05, 0.3]} p={[0, 1.07, -0.1]} c="#9aa5aa" o={STEEL} />
          <Sign p={[0, 2.32, -0.15]} w={0.34} h={0.26} text={`${i + 1}`} bg={i === 1 ? "#3d7a4a" : RED} glow={0.35} />
          {/* scales and a card reader on the customer side */}
          <Box s={[0.32, 0.06, 0.26]} p={[0.75, 1.08, 0.18]} c="#2b2a2e" />
          <Box s={[0.26, 0.015, 0.2]} p={[0.75, 1.12, 0.18]} c="#c9ccd2" o={STEEL} shadow={false} />
          <Box s={[0.1, 0.05, 0.16]} p={[-0.75, 1.07, 0.2]} r={[-0.3, 0, 0]} c="#2b2a2e" />
          {/* a stack of parcels waiting to be weighed */}
          {i === 0 && <Box s={[0.36, 0.22, 0.28]} p={[-0.3, 1.15, 0.2]} c="#c9a77c" o={{ rough: 0.9 }} />}
          {i === 2 && <Box s={[0.28, 0.16, 0.22]} p={[0.2, 1.12, 0.22]} c="#b88b5f" o={{ rough: 0.9 }} />}
        </Group>
      ))}
    </Group>
  );
}

/** Interactive: the sorting frame, a wall of pigeonholes filling with letters, parcels on top. */
function SortingFrame() {
  const letters = useMemo(() => {
    const items: { p: V3; s: V3; c: number }[] = [];
    let k = 7;
    const rnd = () => ((k = (k * 9301 + 49297) % 233280) / 233280);
    for (let row = 0; row < 6; row++) for (let col = 0; col < 14; col++) {
      if (rnd() < 0.25) continue;
      const n = 1 + Math.floor(rnd() * 3);
      for (let j = 0; j < n; j++) items.push({ p: [-2.6 + col * 0.4 + (j - 1) * 0.06, 0.55 + row * 0.3 + 0.07, 0.02], s: [0.025, 0.16 + rnd() * 0.04, 0.22], c: Math.floor(rnd() * 4) });
    }
    return items;
  }, []);
  return (
    <Group>
      <Box s={[5.6, 2.0, 0.5]} p={[0, 1.15, -0.05]} c="#6b4a32" o={{ rough: 0.7 }} />
      {/* pigeonhole grid: dark recesses with timber dividers */}
      <Box s={[5.5, 1.85, 0.02]} p={[0, 1.18, 0.21]} c="#2b2018" />
      {Array.from({ length: 15 }, (_, i) => <Box key={`v${i}`} s={[0.03, 1.85, 0.3]} p={[-2.8 + i * 0.4, 1.18, 0.07]} c="#8a5a38" />)}
      {Array.from({ length: 7 }, (_, i) => <Box key={`h${i}`} s={[5.6, 0.025, 0.3]} p={[0, 0.27 + i * 0.3 + 0.25, 0.07]} c="#8a5a38" />)}
      <Instanced items={letters} colours={["#f6f0df", "#e9e1cc", "#f2e6c0", "#dfe7f0"]} />
      {/* parcels and a red mail sack along the top */}
      {[[-2.2, 0.4, 0.3], [-1.6, 0.3, 0.26], [0.4, 0.34, 0.3], [1.9, 0.26, 0.24]].map(([x, h, w], i) => <Box key={i} s={[w!, h!, 0.32]} p={[x!, 2.15 + h! / 2, -0.05]} c={["#c9a77c", "#b88b5f", "#d9c09a", "#a98a64"][i]!} o={{ rough: 0.9 }} />)}
      <Round s={[0.5, 0.42, 0.36]} p={[-0.6, 2.36, -0.05]} c={RED} rad={0.15} o={{ rough: 0.95 }} />
      <Sign p={[0, 0.25, 0.26]} w={1.6} h={0.2} text="TOWN ROUNDS 1-14" bg="#2b2a2e" fg="#f4ead6" />
    </Group>
  );
}

export function PostFixture({ id }: { id: string }) {
  if (id === "post-counter") return <PostCounter />;
  if (id === "sorting") return <SortingFrame />;
  return null;
}

/** A classic red pillar box with the royal-cipher plate and slot. */
function PillarBox({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Cyl rad={0.22} h={1.25} p={[0, 0.62, 0]} c={RED} o={{ rough: 0.45 }} />
      <Cyl rad={0.25} h={0.08} p={[0, 0.04, 0]} c="#2b2a2e" />
      <Ball rad={0.235} p={[0, 1.27, 0]} sc={[0.235, 0.12, 0.235]} c={RED} o={{ rough: 0.45 }} />
      <Box s={[0.22, 0.03, 0.04]} p={[0, 1.06, 0.215]} c="#2b2a2e" />
      <Box s={[0.18, 0.2, 0.02]} p={[0, 0.78, 0.22]} c="#e0b84a" o={BRASS} shadow={false} />
    </Group>
  );
}

/** A wall of numbered PO boxes with brass doors. */
function PoBoxes({ p, r }: { p: V3; r?: V3 }) {
  const doors = useMemo(() => {
    const items: { p: V3; s: V3; c: number }[] = [];
    for (let row = 0; row < 6; row++) for (let col = 0; col < 9; col++) items.push({ p: [-1.5 + col * 0.375, 0.55 + row * 0.3, 0.2], s: [0.33, 0.26, 0.02], c: (row * 9 + col) % 7 === 3 ? 1 : 0 });
    return items;
  }, []);
  return (
    <Group p={p} {...(r ? { r } : {})}>
      <Box s={[3.5, 2.0, 0.4]} p={[0, 1.3, 0]} c={OAK_D} />
      <Instanced items={doors} colours={["#c9a24a", "#e9d38a"]} rough={0.3} />
      <Sign p={[0, 2.45, 0.21]} w={1.6} h={0.24} text="PO BOXES" bg={RED} />
    </Group>
  );
}

export function PostDecor() {
  return (
    <Group>
      {/* ── public hall ── */}
      <Sign p={[6.0, 2.85, 2.69]} w={3.4} h={0.42} text="TOWN POST OFFICE" bg={RED} fg="#fff2d6" />
      <Clock p={[10.2, 2.4, 2.69]} />
      <NoticeBoard p={[1.9, 1.7, 2.69]} w={1.2} h={0.8} header="NOTICES" frame={OAK_D} />
      <PoBoxes p={[0.3, 0, 6.5]} r={[0, Math.PI / 2, 0]} />
      {/* writing ledge with pens on chains and leaflet racks */}
      <Group p={[11.7, 0, 6.0]} r={[0, -Math.PI / 2, 0]}>
        <Box s={[2.8, 0.06, 0.45]} p={[0, 1.05, 0]} c={OAK} />
        {[-1.2, 1.2].map((x) => <Box key={x} s={[0.06, 1.05, 0.4]} p={[x, 0.52, 0]} c={OAK_D} />)}
        {[-0.8, 0, 0.8].map((x) => <Cyl key={x} rad={0.006} h={0.14} p={[x, 1.12, 0.1]} r={[0, 0, 1.2]} c="#2b3a67" shadow={false} />)}
        <Box s={[2.4, 0.7, 0.08]} p={[0, 1.75, -0.18]} c={OAK_D} />
        {[-0.9, -0.3, 0.3, 0.9].map((x, i) => <Box key={x} s={[0.4, 0.5, 0.02]} p={[x, 1.75, -0.13]} c={["#f4ead6", "#e0b84a", "#cfe6f2", "#f2c4c0"][i]!} shadow={false} />)}
        <Sign p={[0, 2.3, -0.13]} w={1.4} h={0.22} text="FORMS & LEAFLETS" bg="#3d5a8a" />
      </Group>
      {/* greetings-card spinner */}
      <Group p={[10.4, 0, 8.0]}>
        <Cyl rad={0.03} h={1.6} p={[0, 0.8, 0]} c="#9aa5aa" o={STEEL} />
        <Cyl rad={0.22} h={0.04} p={[0, 0.02, 0]} c="#2b2a2e" />
        {[0.5, 0.85, 1.2, 1.5].map((y, i) => [0, 1, 2, 3].map((k) => {
          const a = (k / 4) * Math.PI * 2 + i * 0.4;
          return <Box key={`${y}${k}`} s={[0.16, 0.22, 0.01]} p={[Math.sin(a) * 0.12, y, Math.cos(a) * 0.12]} r={[0, a, 0]} c={["#e05a4f", "#4a8fd9", "#e0b84a", "#4fb07a", "#c56ad9"][(i + k) % 5]!} shadow={false} />;
        }))}
      </Group>
      {/* stamp machine by the door, and the pillar box for posting */}
      <Group p={[0.65, 0, 8.5]}>
        <Round s={[0.55, 1.5, 0.45]} p={[0, 0.75, 0]} c={RED} rad={0.05} />
        <Box s={[0.3, 0.2, 0.02]} p={[0, 1.15, 0.23]} c="#cfe6f2" o={{ emissive: "#9fe0ff", glow: 0.5 }} shadow={false} />
        <Box s={[0.12, 0.03, 0.02]} p={[0, 0.8, 0.23]} c="#2b2a2e" />
        <Sign p={[0, 1.38, 0.23]} w={0.44} h={0.12} text="STAMPS" bg="#2b2a2e" />
      </Group>
      <PillarBox p={[9.4, 0, 8.55]} />
      {/* queue barrier: brass posts and red ropes snake toward the counter */}
      {([[3.2, 5.4], [3.2, 6.6], [8.8, 6.6], [8.8, 7.6]] as const).map(([x, z]) => <QueuePost key={`${x}${z}`} p={[x, 0, z]} />)}
      <Rope a={[3.2, 5.4]} b={[3.2, 6.6]} />
      <Rope a={[3.2, 6.6]} b={[8.8, 6.6]} />
      <Rope a={[8.8, 6.6]} b={[8.8, 7.6]} />
      <Box s={[1.4, 0.01, 0.5]} p={[6.0, 0.01, 4.85]} c={RED_D} shadow={false} />
      <Sign p={[3.4, 1.15, 6.0]} r={[0, Math.PI / 2, 0]} w={0.6} h={0.24} text="QUEUE HERE" bg="#2b2a2e" />
      <Plant p={[11.4, 0, 8.4]} s={0.9} pot={RED} />
      {/* hanging lamps on drop rods (the camera never looks through them) */}
      {[3.0, 6.0, 9.0].map((x) => (
        <Group key={x} p={[x, 0, 6.2]}>
          <Cyl rad={0.008} h={0.4} p={[0, 3.0, 0]} c="#2b2a2e" shadow={false} />
          <Cyl rad={0.26} h={0.16} p={[0, 2.75, 0]} c="#2f4a3a" />
          <Ball rad={0.08} p={[0, 2.67, 0]} c="#fff2d0" o={{ emissive: "#ffd9a0", glow: 1.4 }} shadow={false} />
        </Group>
      ))}
      {/* ── sorting office ── */}
      <Group p={[1.35, 0, 0.45]}>
        {[-0.85, -0.3, 0.25, 0.8].map((x, i) => <Box key={x} s={[0.5, 1.9, 0.5]} p={[x, 0.95, 0]} c={["#5a6e8a", "#6a7e9a", "#5a6e8a", "#6a7e9a"][i]!} o={{ rough: 0.5, metal: 0.3 }} />)}
      </Group>
      {/* sacks of mail heaped by the door */}
      {[[2.5, 1.8, 0], [3.1, 1.75, 0.6], [2.8, 2.15, 1.2], [3.35, 2.15, 0.3], [2.75, 1.95, 2]].map(([x, z, ry], i) => (
        <Group key={i} p={[x!, 0, z!]} r={[0, ry!, 0]}>
          <Round s={[0.55, 0.42, 0.42]} p={[0, i === 4 ? 0.6 : 0.21, 0]} c={i % 2 ? "#c8b48a" : "#b5a07a"} rad={0.16} o={{ rough: 1 }} />
          <Box s={[0.1, 0.12, 0.1]} p={[0, i === 4 ? 0.85 : 0.46, 0]} c={RED} />
        </Group>
      ))}
      {/* roll cage stacked with parcels */}
      <Group p={[11.15, 0, 1.65]}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([x, z]) => <Box key={`${x}${z}`} s={[0.03, 1.6, 0.03]} p={[x! * 0.55, 0.85, z! * 0.6]} c="#9aa5aa" o={STEEL} shadow={false} />)}
        {[0.12, 0.85].map((y) => <Box key={y} s={[1.12, 0.03, 1.22]} p={[0, y, 0]} c="#9aa5aa" o={STEEL} shadow={false} />)}
        {[[-0.25, 0.3, -0.25], [0.25, 0.32, 0.25], [0, 0.45, 0.1], [-0.2, 1.05, 0], [0.25, 1.0, -0.2]].map(([x, y, z], i) => <Box key={i} s={[0.42, 0.34, 0.4]} p={[x!, y!, z!]} c={["#c9a77c", "#b88b5f", "#d9c09a", "#a98a64", "#c9a77c"][i]!} o={{ rough: 0.9 }} />)}
      </Group>
      {/* parcel conveyor and sorting table */}
      <Group p={[8.4, 0, 1.75]}>
        <Box s={[2.2, 0.08, 0.6]} p={[0, 0.85, 0]} c="#2b2a2e" />
        {Array.from({ length: 10 }, (_, i) => <Cyl key={i} rad={0.03} h={0.6} p={[-1.0 + i * 0.22, 0.9, 0]} r={[Math.PI / 2, 0, 0]} c="#9aa5aa" o={STEEL} shadow={false} />)}
        {[-0.95, 0.95].map((x) => <Box key={x} s={[0.06, 0.85, 0.5]} p={[x, 0.42, 0]} c="#5a6066" />)}
        <Box s={[0.4, 0.28, 0.34]} p={[-0.4, 1.08, 0]} c="#c9a77c" o={{ rough: 0.9 }} />
        <Box s={[0.3, 0.2, 0.26]} p={[0.45, 1.04, 0.05]} c="#b88b5f" o={{ rough: 0.9 }} />
      </Group>
      <Racking p={[5.6, 0, 2.3]} w={1.6} h={1.6} d={0.4} seed={11} />
      <Sign p={[1.2, 2.45, 2.51]} r={[0, Math.PI, 0]} w={1.0} h={0.22} text="STAFF ONLY" bg={RED} />
      {[3.0, 9.0].map((x) => <Group key={x} p={[x, 2.9, 1.3]}><Box s={[1.4, 0.05, 0.18]} c="#ffffff" o={{ emissive: "#f6fbff", glow: 1.2 }} shadow={false} /></Group>)}
    </Group>
  );
}
