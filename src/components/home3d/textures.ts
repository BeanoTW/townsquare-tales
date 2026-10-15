import * as THREE from "three";

const cache = new Map<string, THREE.CanvasTexture>();
function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]): THREE.CanvasTexture {
  const hit = cache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  draw(g);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  cache.set(key, t);
  return t;
}
/** Tiny deterministic noise so textures look the same every visit. */
const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
};

/** Warm laminate planks with grain and end joints. */
export const plankTexture = (repeat: [number, number] = [4, 4]) =>
  make("planks", 256, 256, (g) => {
    const r = rnd(7);
    const rows = 8;
    for (let i = 0; i < rows; i++) {
      const y = (i * 256) / rows;
      const tone = 150 + Math.floor(r() * 36);
      g.fillStyle = `rgb(${tone + 30},${tone - 12},${tone - 62})`;
      g.fillRect(0, y, 256, 256 / rows);
      g.strokeStyle = "rgba(70,40,20,.18)";
      for (let k = 0; k < 5; k++) {
        g.beginPath();
        const gy = y + 3 + r() * (256 / rows - 6);
        g.moveTo(0, gy);
        g.bezierCurveTo(70, gy + (r() - 0.5) * 4, 150, gy + (r() - 0.5) * 4, 256, gy);
        g.stroke();
      }
      g.fillStyle = "rgba(40,22,10,.55)";
      g.fillRect(0, y, 256, 1.6);
      const joint = r() * 256;
      g.fillRect(joint, y, 1.6, 256 / rows);
    }
  }, repeat);

/** Low-pile carpet: speckled so it reads as fabric, not paint. */
export const carpetTexture = (repeat: [number, number] = [3, 3]) =>
  make("carpet", 128, 128, (g) => {
    g.fillStyle = "#6f7f93";
    g.fillRect(0, 0, 128, 128);
    const r = rnd(11);
    for (let i = 0; i < 2600; i++) {
      const l = 40 + r() * 28;
      g.fillStyle = `hsla(214,${14 + r() * 10}%,${l}%,.55)`;
      g.fillRect(r() * 128, r() * 128, 1.6, 1.6);
    }
  }, repeat);

export const wallTexture = (colour: string) =>
  make("wall" + colour, 128, 128, (g) => {
    g.fillStyle = colour;
    g.fillRect(0, 0, 128, 128);
    const r = rnd(colour.length * 31);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "60,50,40"},${0.03 + r() * 0.04})`;
      g.fillRect(r() * 128, r() * 128, 2, 2);
    }
  }, [2, 1]);

/** Television pictures. `cinema` is a sunset landscape; `basic` is a chunky news ticker. */
export const screenTexture = (kind: "basic" | "cinema") =>
  make("screen" + kind, 256, 144, (g) => {
    if (kind === "cinema") {
      const sky = g.createLinearGradient(0, 0, 0, 144);
      sky.addColorStop(0, "#1f2a5a");
      sky.addColorStop(0.55, "#d9695a");
      sky.addColorStop(1, "#f3bf6a");
      g.fillStyle = sky;
      g.fillRect(0, 0, 256, 144);
      g.fillStyle = "#f7e2a0";
      g.beginPath();
      g.arc(170, 86, 20, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = "#1b2a3a";
      g.beginPath();
      g.moveTo(0, 144);
      g.lineTo(0, 100);
      g.lineTo(60, 70);
      g.lineTo(110, 105);
      g.lineTo(170, 80);
      g.lineTo(256, 112);
      g.lineTo(256, 144);
      g.fill();
    } else {
      g.fillStyle = "#245a74";
      g.fillRect(0, 0, 256, 144);
      g.fillStyle = "#e9dfc9";
      g.fillRect(14, 14, 86, 52);
      g.fillStyle = "#d9695a";
      g.fillRect(112, 14, 130, 10);
      g.fillStyle = "#c9a24a";
      g.fillRect(112, 32, 100, 8);
      g.fillRect(112, 48, 120, 8);
      g.fillStyle = "#12212b";
      g.fillRect(0, 112, 256, 32);
      g.fillStyle = "#e9dfc9";
      g.font = "bold 16px sans-serif";
      g.fillText("TOWN NEWS · TEA PRICES UP AGAIN", 10, 134);
    }
  });

export const signTexture = (title: string, sub: string) =>
  make("sign" + title + sub, 256, 192, (g) => {
    g.fillStyle = "#d9695a";
    g.fillRect(0, 0, 256, 192);
    g.strokeStyle = "#fff8e6";
    g.lineWidth = 6;
    g.strokeRect(10, 10, 236, 172);
    g.fillStyle = "#fff8e6";
    g.textAlign = "center";
    g.font = "bold 44px sans-serif";
    g.fillText(title, 128, 84);
    g.font = "bold 22px sans-serif";
    g.fillText(sub, 128, 130);
    g.beginPath();
    g.moveTo(98, 160);
    g.lineTo(128, 140);
    g.lineTo(158, 160);
    g.fill();
  });

export const artTexture = (n: number) =>
  make("art" + n, 128, 160, (g) => {
    const pal = [["#2f7f79", "#f3bf6a", "#d9695a"], ["#6f7f93", "#e9dfc9", "#c9a24a"], ["#d9695a", "#2f7f79", "#fff8e6"]][n % 3]!;
    g.fillStyle = pal[1]!;
    g.fillRect(0, 0, 128, 160);
    g.fillStyle = pal[0]!;
    g.beginPath();
    g.moveTo(0, 160);
    g.lineTo(0, 100);
    g.lineTo(50, 60);
    g.lineTo(96, 110);
    g.lineTo(128, 80);
    g.lineTo(128, 160);
    g.fill();
    g.fillStyle = pal[2]!;
    g.beginPath();
    g.arc(90, 40, 18, 0, Math.PI * 2);
    g.fill();
  });



/* ------------------------------------------------------------------ more floors and surfaces */
/** Glazed ceramic tiles with grout; `dark` flips to a slate kitchen tile. */
export const tileTexture = (repeat: [number, number] = [4, 4]) =>
  make("tile", 256, 256, (g) => {
    const r = rnd(23);
    g.fillStyle = "#b9b4a8";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++)
      for (let j = 0; j < 4; j++) {
        const l = 224 + Math.floor(r() * 18);
        g.fillStyle = `rgb(${l},${l - 4},${l - 14})`;
        g.fillRect(i * 64 + 2, j * 64 + 2, 60, 60);
        g.fillStyle = "rgba(255,255,255,.35)";
        g.fillRect(i * 64 + 4, j * 64 + 4, 22, 3);
      }
  }, repeat);

/** Polished herringbone-ish parquet: short boards laid in alternating directions. */
export const parquetTexture = (repeat: [number, number] = [4, 4]) =>
  make("parquet", 256, 256, (g) => {
    const r = rnd(41);
    for (let i = 0; i < 8; i++)
      for (let j = 0; j < 8; j++) {
        const tone = 150 + Math.floor(r() * 40);
        g.fillStyle = `rgb(${tone + 20},${tone - 20},${tone - 62})`;
        const horiz = (i + j) % 2 === 0;
        g.fillRect(i * 32 + 1, j * 32 + 1, 30, 30);
        g.strokeStyle = "rgba(60,30,12,.28)";
        for (let k = 0; k < 3; k++) {
          g.beginPath();
          if (horiz) {
            g.moveTo(i * 32 + 2, j * 32 + 6 + k * 9);
            g.lineTo(i * 32 + 30, j * 32 + 6 + k * 9);
          } else {
            g.moveTo(i * 32 + 6 + k * 9, j * 32 + 2);
            g.lineTo(i * 32 + 6 + k * 9, j * 32 + 30);
          }
          g.stroke();
        }
      }
    g.strokeStyle = "rgba(30,14,6,.55)";
    g.lineWidth = 1.4;
    for (let i = 0; i <= 8; i++) {
      g.beginPath();
      g.moveTo(i * 32, 0);
      g.lineTo(i * 32, 256);
      g.moveTo(0, i * 32);
      g.lineTo(256, i * 32);
      g.stroke();
    }
  }, repeat);

/** Cream marble with soft grey veins and a faint polish. */
export const marbleTexture = (repeat: [number, number] = [2, 2]) =>
  make("marble", 256, 256, (g) => {
    const r = rnd(53);
    g.fillStyle = "#efeae0";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 9; i++) {
      g.strokeStyle = `rgba(${110 + r() * 40},${105 + r() * 40},${100 + r() * 40},${0.12 + r() * 0.16})`;
      g.lineWidth = 0.8 + r() * 1.6;
      g.beginPath();
      let x = r() * 256;
      let y = 0;
      g.moveTo(x, y);
      while (y < 256) {
        x += (r() - 0.5) * 36;
        y += 18 + r() * 24;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    g.strokeStyle = "rgba(90,84,76,.4)";
    g.lineWidth = 2;
    g.strokeRect(1, 1, 254, 254);
  }, repeat);

/** Grey gym rubber with flecks. */
export const rubberTexture = (repeat: [number, number] = [4, 4]) =>
  make("rubber", 128, 128, (g) => {
    const r = rnd(67);
    g.fillStyle = "#3d4146";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(200,205,210,.25)" : "rgba(10,12,14,.35)";
      g.fillRect(r() * 128, r() * 128, 2, 2);
    }
    g.strokeStyle = "rgba(0,0,0,.5)";
    g.strokeRect(0.5, 0.5, 127, 127);
  }, repeat);

/** Cracked, stained concrete: the squat's floor. */
export const concreteTexture = (repeat: [number, number] = [2, 2]) =>
  make("concrete", 256, 256, (g) => {
    const r = rnd(79);
    g.fillStyle = "#8a857b";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "50,44,36" : "190,184,170"},${0.06 + r() * 0.12})`;
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 8 + r() * 30, 6 + r() * 20, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(25,22,18,.6)";
    g.lineWidth = 1.6;
    for (let i = 0; i < 5; i++) {
      g.beginPath();
      let x = r() * 256;
      let y = r() * 256;
      g.moveTo(x, y);
      for (let k = 0; k < 6; k++) {
        x += (r() - 0.5) * 50;
        y += (r() - 0.3) * 40;
        g.lineTo(x, y);
      }
      g.stroke();
    }
    // oily stains
    g.fillStyle = "rgba(20,18,14,.35)";
    g.beginPath();
    g.ellipse(190, 70, 26, 14, 0.4, 0, Math.PI * 2);
    g.fill();
  }, repeat);

/** Mismatched scavenged boards. */
export const boardsTexture = (repeat: [number, number] = [2, 2]) =>
  make("boards", 256, 256, (g) => {
    const r = rnd(83);
    let y = 0;
    while (y < 256) {
      const h = 20 + Math.floor(r() * 24);
      const tone = 90 + Math.floor(r() * 60);
      g.fillStyle = `rgb(${tone + 40},${tone + 6},${tone - 36})`;
      g.fillRect(0, y, 256, h);
      g.strokeStyle = "rgba(30,16,8,.5)";
      g.beginPath();
      g.moveTo(0, y);
      g.lineTo(256, y);
      g.stroke();
      for (let k = 0; k < 4; k++) {
        g.strokeStyle = "rgba(40,20,8,.25)";
        g.beginPath();
        const gy = y + 3 + r() * (h - 6);
        g.moveTo(0, gy);
        g.lineTo(256, gy + (r() - 0.5) * 4);
        g.stroke();
      }
      g.fillStyle = "rgba(25,14,6,.7)";
      g.fillRect(r() * 240, y + h / 2 - 1.5, 3, 3);
      g.fillRect(r() * 240, y + h / 2 - 1.5, 3, 3);
      y += h;
    }
  }, repeat);

/** Short lawn with slightly lighter blades. */
export const lawnTexture = (repeat: [number, number] = [3, 3]) =>
  make("lawn", 128, 128, (g) => {
    const r = rnd(97);
    g.fillStyle = "#5f9448";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1200; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(140,200,100,.35)" : "rgba(30,80,30,.3)";
      g.fillRect(r() * 128, r() * 128, 1.4, 3);
    }
  }, repeat);

/** Brown flattened cardboard with printed fragments and tape. */
export const cardboardTexture = (seed = 1) =>
  make("cardboard" + seed, 128, 128, (g) => {
    const r = rnd(101 + seed * 7);
    g.fillStyle = `rgb(${172 + seed * 6},${130 + seed * 4},${84 + seed * 3})`;
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 14; i++) {
      g.strokeStyle = "rgba(110,76,42,.25)";
      g.beginPath();
      g.moveTo(0, i * 9 + r() * 4);
      g.lineTo(128, i * 9 + r() * 4);
      g.stroke();
    }
    for (let i = 0; i < 40; i++) {
      g.fillStyle = `rgba(60,36,16,${0.05 + r() * 0.12})`;
      g.beginPath();
      g.ellipse(r() * 128, r() * 128, 4 + r() * 14, 3 + r() * 9, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.fillStyle = "rgba(205,60,40,.8)";
    g.font = "bold 18px sans-serif";
    g.fillText(["THIS WAY UP", "FRAGILE", "KEEP DRY", "NOODLES"][seed % 4]!, 6 + r() * 20, 40 + r() * 50);
    g.fillStyle = "rgba(225,205,150,.55)";
    g.fillRect(40 + r() * 30, 0, 18, 128);
  });

/** Corrugated metal sheet, rusted at the edges. */
export const corrugatedTexture = () =>
  make("corrugated", 128, 128, (g) => {
    const r = rnd(113);
    for (let i = 0; i < 16; i++) {
      g.fillStyle = i % 2 ? "#8a8f90" : "#a9aeb0";
      g.fillRect(i * 8, 0, 8, 128);
    }
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${130 + r() * 40},${60 + r() * 30},30,${0.15 + r() * 0.3})`;
      g.beginPath();
      g.ellipse(r() * 128, r() * 128, 3 + r() * 10, 2 + r() * 7, 0, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Green baize for the card table. */
export const feltTexture = () =>
  make("felt", 128, 128, (g) => {
    const r = rnd(127);
    g.fillStyle = "#1d6b46";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "120,220,160" : "0,40,20"},.12)`;
      g.fillRect(r() * 128, r() * 128, 1.5, 1.5);
    }
  });

/** Neon-style sign with a glowing outline. */
export const neonTexture = (text: string, colour: string) =>
  make("neon" + text + colour, 512, 128, (g) => {
    g.fillStyle = "#120a1a";
    g.fillRect(0, 0, 512, 128);
    g.shadowColor = colour;
    g.shadowBlur = 18;
    g.fillStyle = colour;
    g.font = "bold 64px sans-serif";
    g.textAlign = "center";
    g.fillText(text, 256, 84);
    g.strokeStyle = colour;
    g.lineWidth = 5;
    g.strokeRect(10, 10, 492, 108);
  });

/* ------------------------------------------------------------------ floors at world scale */
import type { FloorKind } from "@/lib/home3d/layout";
const FLOOR: Record<FloorKind, { make: () => THREE.CanvasTexture; metres: number; rough: number }> = {
  laminate: { make: () => plankTexture(), metres: 1.2, rough: 0.55 },
  carpet: { make: () => carpetTexture(), metres: 0.9, rough: 0.98 },
  tile: { make: () => tileTexture(), metres: 1.2, rough: 0.22 },
  parquet: { make: () => parquetTexture(), metres: 1.2, rough: 0.4 },
  marble: { make: () => marbleTexture(), metres: 1.8, rough: 0.12 },
  rubber: { make: () => rubberTexture(), metres: 1.0, rough: 0.9 },
  concrete: { make: () => concreteTexture(), metres: 1.8, rough: 0.95 },
  boards: { make: () => boardsTexture(), metres: 1.5, rough: 0.85 },
  dirt: { make: () => concreteTexture(), metres: 1.8, rough: 1 },
  lawn: { make: () => lawnTexture(), metres: 2.0, rough: 1 },
};
const floorCache = new Map<string, THREE.CanvasTexture>();
/** A floor texture scaled so a tile is the same real size whatever the room's dimensions. */
export function floorTexture(kind: FloorKind, w: number, d: number): { map: THREE.CanvasTexture; rough: number } {
  const f = FLOOR[kind];
  const key = `${kind}|${w.toFixed(2)}|${d.toFixed(2)}`;
  let t = floorCache.get(key);
  if (!t) {
    t = f.make().clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(w / f.metres, d / f.metres);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    t.needsUpdate = true;
    floorCache.set(key, t);
  }
  return { map: t, rough: f.rough };
}

/** Slot-machine reel window: three symbols on a lit strip. */
export const slotTexture = (n: number) =>
  make("slot" + n, 192, 96, (g) => {
    g.fillStyle = "#101018";
    g.fillRect(0, 0, 192, 96);
    const syms = [["7", "#e63946"], ["BAR", "#f4f1ea"], ["★", "#f3bf6a"], ["♦", "#6fe3ff"]];
    for (let i = 0; i < 3; i++) {
      g.fillStyle = "#f7f1de";
      g.fillRect(8 + i * 60, 10, 52, 76);
      const [t, c] = syms[(i * 2 + n) % syms.length]!;
      g.fillStyle = c!;
      g.font = `bold ${t === "BAR" ? 22 : 44}px sans-serif`;
      g.textAlign = "center";
      g.fillText(t!, 34 + i * 60, 60);
    }
    g.strokeStyle = "#f3bf6a";
    g.lineWidth = 3;
    g.strokeRect(2, 2, 188, 92);
  });
