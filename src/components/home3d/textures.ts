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


