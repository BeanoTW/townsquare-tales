import { useMemo } from "react";
import * as THREE from "three";
import { DoorMat, Pendant, Rug } from "../decor";
import { Art, Ball, BRASS, Bookcase, Box, Chair, Clock, Counter, Cyl, Group, Monitor, NoticeBoard, Plant, Round, Sign, Table, type V3 } from "./kit";

/**
 * Stick University: a cream-and-green Victorian college. Panelled library with a study island, a lecture room
 * with rows of desks and a whiteboard, and an entrance hall with the admissions desk and the trophy cabinet.
 */
const GREEN = "#4d6557";
const OAK = "#8a5a36";
const CREAM = "#f4efe4";

function BankerLamp({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Cyl rad={0.06} h={0.02} p={[0, 0.01, 0]} c="#c9a24a" o={BRASS} shadow={false} />
      <Cyl rad={0.01} h={0.26} p={[0, 0.14, 0]} c="#c9a24a" o={BRASS} shadow={false} />
      <Round s={[0.3, 0.06, 0.12]} p={[0, 0.28, 0.04]} c="#2f6a4a" rad={0.03} o={{ emissive: "#ffe2a0", glow: 0.25, rough: 0.2 }} />
    </Group>
  );
}

/** Interactive: a double-sided bookcase island with a reading table in front. */
function Library() {
  return (
    <Group>
      <Bookcase p={[0, 0, -0.45]} w={2.8} h={1.6} d={0.4} wood={OAK} seed={11} />
      <Table p={[0, 0, 0.4]} w={2.2} d={0.7} h={0.74} top={OAK} leg="#4a3022" />
      <BankerLamp p={[-0.6, 0.77, 0.3]} />
      <BankerLamp p={[0.6, 0.77, 0.3]} />
      {[[-0.2, 0.45, 0.2], [0.25, 0.5, -0.15]].map(([x, z, r], i) => (
        <Group key={i} p={[x!, 0.775, z!]} r={[0, r!, 0]}>
          <Box s={[0.3, 0.015, 0.22]} c="#fdfbf2" shadow={false} />
          <Box s={[0.006, 0.02, 0.22]} p={[0, 0.01, 0]} c="#8a5a6b" shadow={false} />
        </Group>
      ))}
      {[-0.6, 0.6].map((x) => <Chair key={x} p={[x, 0, 0.95]} r={[0, Math.PI, 0]} frame={OAK} cushion="#2f6a4a" />)}
      <Sign p={[0, 1.78, -0.45]} w={0.9} h={0.18} text="LIBRARY" bg={GREEN} />
    </Group>
  );
}

/** Interactive: the lecturer's desk with a laptop and an apple. */
function LecturerDesk() {
  return (
    <Group>
      <Round s={[1.9, 0.06, 0.75]} p={[0, 0.76, 0]} c={OAK} rad={0.02} />
      <Box s={[1.8, 0.7, 0.04]} p={[0, 0.38, 0.33]} c="#6b4a32" />
      {[-0.85, 0.85].map((x) => <Box key={x} s={[0.06, 0.74, 0.7]} p={[x, 0.37, 0]} c="#6b4a32" />)}
      <Group p={[0.3, 0.8, 0]}>
        <Box s={[0.38, 0.02, 0.26]} c="#9aa3a8" shadow={false} />
        <Box s={[0.38, 0.24, 0.015]} p={[0, 0.12, -0.13]} r={[-0.3, 0, 0]} c="#9aa3a8" shadow={false} />
        <Box s={[0.34, 0.2, 0.004]} p={[0, 0.12, -0.12]} r={[-0.3, 0, 0]} c="#0f2030" o={{ emissive: "#a8d8ff", glow: 0.6 }} shadow={false} />
      </Group>
      <Ball rad={0.05} p={[-0.6, 0.84, 0.15]} c="#c0392b" />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.25, 0.04, 0.33]} p={[-0.3, 0.81 + i * 0.04, -0.05]} r={[0, i * 0.1, 0]} c={["#2f7f79", "#d9695a", "#e0b84a"][i]!} shadow={false} />)}
    </Group>
  );
}

/** Interactive: admissions counter with the university crest and prospectus racks. */
function Admissions() {
  return (
    <Group>
      <Counter p={[0, 0, 0]} w={2.3} d={0.7} h={1.05} body={OAK} top={CREAM} front={GREEN} />
      <Monitor p={[-0.5, 1.05, -0.15]} r={[0, Math.PI, 0]} w={0.45} />
      <Cyl rad={0.04} h={0.03} p={[0.6, 1.09, 0.15]} c="#c9a24a" o={BRASS} shadow={false} />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.2, 0.28, 0.02]} p={[0.15 + i * 0.22, 1.2, 0.05]} r={[-0.15, 0, 0]} c={["#2f7f79", "#d9695a", "#4d6557"][i]!} shadow={false} />)}
      <Sign p={[0, 1.85, -0.3]} w={1.4} h={0.26} text="ADMISSIONS" bg={GREEN} />
      <Cyl rad={0.008} h={1.3} p={[-0.6, 2.6, -0.3]} c="#2b2a2e" shadow={false} />
      <Cyl rad={0.008} h={1.3} p={[0.6, 2.6, -0.3]} c="#2b2a2e" shadow={false} />
    </Group>
  );
}

/** Whiteboard with scribbled lecture notes, drawn to a canvas once. */
function Whiteboard({ p, w = 3.0, h = 1.2 }: { p: V3; w?: number; h?: number }) {
  const face = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 205;
    const g = c.getContext("2d")!;
    g.fillStyle = "#f8f9f7"; g.fillRect(0, 0, 512, 205);
    g.strokeStyle = "#2a4a8a"; g.lineWidth = 3; g.font = '28px "Patrick Hand", cursive'; g.fillStyle = "#2a4a8a";
    g.fillText("STICK ECONOMICS 101", 24, 40);
    g.fillStyle = "#c0392b"; g.fillText("work + study = $$$", 30, 90);
    g.strokeStyle = "#2f7f79"; g.beginPath(); g.moveTo(300, 170); g.lineTo(360, 120); g.lineTo(410, 140); g.lineTo(480, 60); g.stroke();
    g.beginPath(); g.moveTo(300, 175); g.lineTo(490, 175); g.moveTo(300, 175); g.lineTo(300, 50); g.stroke();
    g.fillStyle = "#2a4a8a"; g.fillText("1. Show up", 30, 140); g.fillText("2. Don't nap", 30, 180);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.25 });
  }, []);
  return (
    <Group p={p}>
      <Box s={[w + 0.08, h + 0.08, 0.04]} c="#c9ced2" o={{ rough: 0.4, metal: 0.4 }} />
      <mesh position={[0, 0, 0.022]} material={face}><planeGeometry args={[w, h]} /></mesh>
      <Box s={[w, 0.04, 0.08]} p={[0, -h / 2 - 0.04, 0.04]} c="#c9ced2" shadow={false} />
      {[0, 1, 2].map((i) => <Box key={i} s={[0.1, 0.02, 0.02]} p={[-0.4 + i * 0.15, -h / 2 - 0.01, 0.05]} c={["#2a4a8a", "#c0392b", "#2f7f79"][i]!} shadow={false} />)}
    </Group>
  );
}

/** Student desk with an attached chair, for the lecture rows. */
function StudentDesk({ p }: { p: V3 }) {
  return (
    <Group p={p}>
      <Round s={[0.9, 0.04, 0.42]} p={[0, 0.74, -0.05]} c="#c79a5c" rad={0.015} />
      {[-0.4, 0.4].map((x) => <Box key={x} s={[0.04, 0.72, 0.36]} p={[x, 0.37, -0.05]} c="#4a4f55" shadow={false} />)}
      <Chair p={[0, 0, 0.42]} r={[0, Math.PI, 0]} frame="#4a4f55" cushion="#5c6e98" h={0.44} />
      <Box s={[0.26, 0.012, 0.2]} p={[0.15, 0.77, -0.05]} c="#fdfbf2" shadow={false} />
    </Group>
  );
}

export function SchoolFixture({ id }: { id: string }) {
  switch (id) {
    case "library": return <Library />;
    case "classroom": return <LecturerDesk />;
    case "admissions": return <Admissions />;
    default: return null;
  }
}

export function SchoolDecor() {
  return (
    <Group>
      {/* library: low cases under the windows, tall cases on the left wall, reading table, globe and rug */}
      {[0.9, 2.95, 5.1, 6.85].map((x, i) => <Bookcase key={x} p={[x, 0, 0.35]} w={i === 3 ? 1.0 : 1.5} h={1.2} d={0.38} wood={OAK} seed={i + 2} />)}
      {[1.3, 2.8, 4.3, 5.6].map((z, i) => <Bookcase key={z} p={[0.35, 0, z]} r={[0, Math.PI / 2, 0]} w={1.4} h={2.6} d={0.38} wood={OAK} seed={i + 7} />)}
      <Group p={[3.6, 0, 4.7]}>
        <Table p={[0, 0, 0]} w={3.0} d={0.9} h={0.74} top={OAK} leg="#4a3022" />
        {[-1.0, 0, 1.0].map((x) => <BankerLamp key={x} p={[x, 0.77, 0]} />)}
        {[-1.0, 0, 1.0].map((x) => <Chair key={`n${x}`} p={[x, 0, -0.65]} frame={OAK} cushion="#2f6a4a" />)}
        {[-1.0, 1.0].map((x) => <Chair key={`s${x}`} p={[x, 0, 0.65]} r={[0, Math.PI, 0]} frame={OAK} cushion="#2f6a4a" />)}
        <Box s={[0.3, 0.12, 0.22]} p={[-0.5, 0.83, 0.15]} c="#8a5a6b" shadow={false} />
      </Group>
      <Group p={[6.5, 0, 1.3]}>
        <Cyl rad={0.2} h={0.03} p={[0, 0.02, 0]} c="#4a3022" shadow={false} />
        <Cyl rad={0.03} h={0.75} p={[0, 0.4, 0]} c="#4a3022" />
        <Ball rad={0.24} p={[0, 0.98, 0]} c="#4a7fb0" o={{ rough: 0.4 }} />
        <Ball rad={0.245} p={[0.02, 1.0, 0.02]} sc={[0.1, 0.18, 0.2]} c="#6aa24f" shadow={false} />
      </Group>
      <Rug p={[3.4, 2.6]} w={4.2} d={3.0} cols={["#4d6557", "#e9dfc9", "#8a2a2a", "#e9dfc9"]} />
      <Clock p={[6.9, 2.6, 0.13]} />
      {/* lecture room: whiteboard, projector screen, rows of desks and a periodic table */}
      <Whiteboard p={[10.8, 1.7, 0.14]} />
      <Box s={[0.4, 0.15, 0.3]} p={[10.8, 3.2, 3.4]} c="#d9dde0" />
      <Box s={[0.12, 0.08, 0.02]} p={[10.8, 3.17, 3.24]} c="#ffffff" o={{ emissive: "#eef4ff", glow: 1.5 }} shadow={false} />
      {[3.05, 4.25, 5.45].map((z) => [8.8, 9.9, 11.7, 12.9].map((x) => <StudentDesk key={`${x}${z}`} p={[x, 0, z]} />))}
      <Art p={[13.88, 1.9, 2.4]} r={[0, -Math.PI / 2, 0]} w={1.2} h={0.8} art={0} />
      <Sign p={[13.88, 2.6, 4.6]} r={[0, -Math.PI / 2, 0]} w={1.0} h={0.2} text="QUIET PLEASE" bg={GREEN} />
      {/* entrance hall: crest banner, trophy cabinet, bench, notice board and plants */}
      <Sign p={[0.12, 2.5, 8.3]} r={[0, Math.PI / 2, 0]} w={2.2} h={0.45} text="STICK UNIVERSITY" bg={GREEN} fg="#f6e7c4" border="#c9a24a" />
      <Group p={[0.45, 0, 8.3]} r={[0, Math.PI / 2, 0]}>
        <Box s={[2.1, 1.9, 0.45]} p={[0, 0.95, 0]} c={OAK} o={{ rough: 0.5 }} />
        <Box s={[1.95, 1.6, 0.02]} p={[0, 1.0, 0.23]} c="#dff0f5" o={{ opacity: 0.3, rough: 0.05 }} shadow={false} />
        {[0.55, 1.05, 1.5].map((y) => <Box key={y} s={[1.9, 0.02, 0.38]} p={[0, y, 0]} c="#e9dfc9" shadow={false} />)}
        {[[-0.6, 0.57], [0, 0.57], [0.6, 0.57], [-0.3, 1.07], [0.4, 1.07]].map(([x, y], i) => (
          <Group key={i} p={[x!, y!, 0]}>
            <Cyl rad={0.05} h={0.08} p={[0, 0.04, 0]} c="#4a3022" shadow={false} />
            <Cyl rad={0.07} h={0.16} p={[0, 0.16, 0]} c="#e1b23d" o={{ rough: 0.25, metal: 0.85 }} shadow={false} />
          </Group>
        ))}
      </Group>
      <Group p={[3.9, 0, 9.55]} r={[0, Math.PI, 0]}>
        <Round s={[2.0, 0.08, 0.42]} p={[0, 0.45, 0]} c={OAK} rad={0.02} />
        <Round s={[2.0, 0.4, 0.08]} p={[0, 0.7, -0.18]} c={OAK} rad={0.02} />
        {[-0.85, 0.85].map((x) => <Box key={x} s={[0.06, 0.45, 0.38]} p={[x, 0.22, 0]} c="#2b2a2e" shadow={false} />)}
      </Group>
      <NoticeBoard p={[13.88, 1.6, 8.3]} r={[0, -Math.PI / 2, 0]} w={1.5} h={1.0} header="CLUBS" frame={GREEN} />
      <Plant p={[13.4, 0, 9.4]} s={1.1} pot={GREEN} />
      <Plant p={[5.9, 0, 9.4]} s={0.9} pot={GREEN} />
      <DoorMat p={[7.0, 9.5]} />
      {[[3.4, 3.5, 2.6], [7.0, 3.5, 8.3], [10.8, 3.5, 2.4], [10.8, 3.5, 4.8]].map(([x, y, z], i) => <Pendant key={i} p={[x!, y!, z!]} colour={i >= 2 ? "#eef4ff" : "#ffe2b0"} cord={1.0} />)}
    </Group>
  );
}
