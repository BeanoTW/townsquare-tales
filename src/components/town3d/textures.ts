import * as THREE from "three";

/** Procedural town textures, cached. Most are near-neutral so material colours can tint them. */
const cache = new Map<string, THREE.CanvasTexture>();

function make(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void): THREE.CanvasTexture {
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
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  cache.set(key, t);
  return t;
}

/** A repeat-scaled copy so one source canvas serves surfaces of any size. */
const scaled = new Map<string, THREE.Texture>();
export function tiled(base: THREE.Texture, rx: number, ry: number, ox = 0, oy = 0): THREE.Texture {
  const key = `${base.uuid}|${rx.toFixed(2)}|${ry.toFixed(2)}|${ox.toFixed(2)}|${oy.toFixed(2)}`;
  let t = scaled.get(key);
  if (!t) {
    t = base.clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(rx, ry);
    t.offset.set(ox, oy);
    t.needsUpdate = true;
    scaled.set(key, t);
  }
  return t;
}

/** Neutral grass with lighter and darker blades, tinted by the theme greens. */
export const grassTexture = () =>
  make("grass", 128, 128, (g) => {
    const r = rnd(53);
    g.fillStyle = "#dedede";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "150,150,150"},${0.08 + r() * 0.1})`;
      g.beginPath();
      g.ellipse(r() * 128, r() * 128, 4 + r() * 10, 3 + r() * 6, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    for (let i = 0; i < 1500; i++) {
      g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.4)" : "rgba(110,110,110,.32)";
      g.fillRect(r() * 128, r() * 128, 1.2, 2.6);
    }
  });

/** Weathered timber planks for the park bridge and benches. */
export const timberTexture = () =>
  make("timber", 128, 128, (g) => {
    const r = rnd(59);
    for (let i = 0; i < 8; i++) {
      const v = 180 + Math.floor(r() * 50);
      g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
      g.fillRect(i * 16, 0, 16, 128);
      g.fillStyle = "rgba(60,50,40,.45)";
      g.fillRect(i * 16, 0, 1.5, 128);
      for (let k = 0; k < 3; k++) {
        g.fillStyle = "rgba(90,80,70,.25)";
        g.fillRect(i * 16 + 3 + r() * 10, 0, 1, 128);
      }
    }
  });

const rnd = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a * 1664525 + 1013904223) >>> 0;
    return a / 4294967296;
  };
};

/** Fine speckled asphalt with a few patched repairs. */
export const asphaltTexture = () =>
  make("asphalt", 256, 256, (g) => {
    const r = rnd(3);
    g.fillStyle = "#c8c8c8";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 5200; i++) {
      const v = 150 + Math.floor(r() * 105);
      g.fillStyle = `rgba(${v},${v},${v},.6)`;
      g.fillRect(r() * 256, r() * 256, 1.5, 1.5);
    }
    // Soft wear rather than hard-edged patches, so tiling never shows.
    for (let i = 0; i < 18; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "110,110,116" : "235,235,235"},.06)`;
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 18 + r() * 40, 10 + r() * 26, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Square paving slabs with soft joints. */
export const pavingTexture = () =>
  make("paving", 256, 256, (g) => {
    const r = rnd(9);
    g.fillStyle = "#9a978f";
    g.fillRect(0, 0, 256, 256);
    const n = 4;
    const s = 256 / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const v = 222 + Math.floor(r() * 26);
        g.fillStyle = `rgb(${v},${v - 2},${v - 8})`;
        g.fillRect(i * s + 2, j * s + 2, s - 4, s - 4);
        for (let k = 0; k < 40; k++) {
          g.fillStyle = `rgba(120,115,105,${0.05 + r() * 0.08})`;
          g.fillRect(i * s + r() * s, j * s + r() * s, 2, 2);
        }
      }
  });

/** Loose gravel for park paths and the yard. */
export const gravelTexture = () =>
  make("gravel", 128, 128, (g) => {
    const r = rnd(17);
    g.fillStyle = "#d8cfb8";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 900; i++) {
      const v = 160 + Math.floor(r() * 90);
      g.fillStyle = `rgb(${v},${v - 8},${v - 26})`;
      g.beginPath();
      g.arc(r() * 128, r() * 128, 0.8 + r() * 1.6, 0, Math.PI * 2);
      g.fill();
    }
  });

/** Churned earth with tyre ruts for the construction site. */
export const soilTexture = () =>
  make("soil", 256, 256, (g) => {
    const r = rnd(23);
    g.fillStyle = "#b9a684";
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 60; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "120,100,70" : "220,205,175"},${0.1 + r() * 0.15})`;
      g.beginPath();
      g.ellipse(r() * 256, r() * 256, 6 + r() * 26, 4 + r() * 14, r() * 3, 0, Math.PI * 2);
      g.fill();
    }
    g.strokeStyle = "rgba(90,74,52,.35)";
    g.lineWidth = 7;
    g.setLineDash([12, 6]);
    for (const y of [70, 92, 180, 202]) {
      g.beginPath();
      g.moveTo(0, y);
      g.bezierCurveTo(80, y + 12, 170, y - 10, 256, y + 4);
      g.stroke();
    }
  });

/** Clay roof tiles in neutral tone; tinted by the roof colour. */
export const roofTileTexture = () =>
  make("rooftiles", 128, 128, (g) => {
    const r = rnd(29);
    g.fillStyle = "#8e8e8e";
    g.fillRect(0, 0, 128, 128);
    const rows = 8;
    const h = 128 / rows;
    for (let j = 0; j < rows; j++)
      for (let i = -1; i < 9; i++) {
        const x = i * 16 + (j % 2 ? 8 : 0);
        const v = 205 + Math.floor(r() * 45);
        g.fillStyle = `rgb(${v},${v},${v})`;
        g.beginPath();
        g.moveTo(x + 1, j * h);
        g.lineTo(x + 15, j * h);
        g.lineTo(x + 15, j * h + h - 3);
        g.quadraticCurveTo(x + 8, j * h + h + 1, x + 1, j * h + h - 3);
        g.fill();
      }
  });

/** Tar-and-gravel flat roof. */
export const flatRoofTexture = () =>
  make("flatroof", 128, 128, (g) => {
    const r = rnd(31);
    g.fillStyle = "#d4d4d4";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 1400; i++) {
      const v = 170 + Math.floor(r() * 85);
      g.fillStyle = `rgba(${v},${v},${v},.7)`;
      g.fillRect(r() * 128, r() * 128, 1.3, 1.3);
    }
    g.strokeStyle = "rgba(120,120,120,.35)";
    for (let i = 0; i < 4; i++) {
      g.beginPath();
      g.moveTo(0, 32 * i + 16);
      g.lineTo(128, 32 * i + 16);
      g.stroke();
    }
  });

/** Painted plaster with faint trowel marks, neutral for tinting. */
export const plasterTexture = () =>
  make("plaster", 128, 128, (g) => {
    const r = rnd(37);
    g.fillStyle = "#f2f2f2";
    g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 700; i++) {
      g.fillStyle = `rgba(${r() > 0.5 ? "255,255,255" : "120,120,120"},${0.05 + r() * 0.06})`;
      g.fillRect(r() * 128, r() * 128, 2 + r() * 3, 2);
    }
  });

/** Brick courses, neutral red-grey for tinting. */
export const brickWallTexture = () =>
  make("brickwall", 256, 256, (g) => {
    const r = rnd(41);
    g.fillStyle = "#9b9790";
    g.fillRect(0, 0, 256, 256);
    const rows = 16;
    const bh = 256 / rows;
    const bw = 32;
    for (let j = 0; j < rows; j++)
      for (let i = -1; i < 9; i++) {
        const x = i * bw + (j % 2 ? bw / 2 : 0);
        const v = 205 + Math.floor(r() * 50);
        g.fillStyle = `rgb(${v},${v - 6},${v - 12})`;
        g.fillRect(x + 1.5, j * bh + 1.5, bw - 3, bh - 3);
      }
  });

/** Cut stone blocks for the bank and police station. */
export const stoneTexture = () =>
  make("stone", 256, 256, (g) => {
    const r = rnd(43);
    g.fillStyle = "#a9a59c";
    g.fillRect(0, 0, 256, 256);
    const rows = 6;
    const bh = 256 / rows;
    for (let j = 0; j < rows; j++)
      for (let i = -1; i < 4; i++) {
        const bw = 96;
        const x = i * bw + (j % 2 ? bw / 2 : 0);
        const v = 222 + Math.floor(r() * 30);
        g.fillStyle = `rgb(${v},${v - 3},${v - 10})`;
        g.fillRect(x + 2, j * bh + 2, bw - 4, bh - 4);
      }
  });

/** Corporate curtain wall: glass panels in a mullion grid. */
export const curtainWallTexture = () =>
  make("curtain", 128, 256, (g) => {
    const r = rnd(47);
    g.fillStyle = "#3b4654";
    g.fillRect(0, 0, 128, 256);
    for (let j = 0; j < 8; j++)
      for (let i = 0; i < 4; i++) {
        const v = r();
        const grad = g.createLinearGradient(i * 32, j * 32, i * 32 + 32, j * 32 + 32);
        grad.addColorStop(0, `rgb(${120 + v * 40},${160 + v * 30},${190 + v * 30})`);
        grad.addColorStop(1, `rgb(${70 + v * 30},${100 + v * 30},${130 + v * 30})`);
        g.fillStyle = grad;
        g.fillRect(i * 32 + 2, j * 32 + 2, 28, 28);
      }
  });

/** Awning canvas stripes in the building's sign colour and cream. */
export const stripeTexture = (colour: string) =>
  make("stripe" + colour, 128, 32, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#fff6e2" : colour;
      g.fillRect(i * 16, 0, 16, 32);
    }
    g.fillStyle = "rgba(0,0,0,.08)";
    g.fillRect(0, 26, 128, 6);
  });

/** Warm lit-window glow; used as an emissive map so frames stay dark. */
export const windowTexture = () =>
  make("window", 64, 64, (g) => {
    const grad = g.createLinearGradient(0, 0, 64, 64);
    grad.addColorStop(0, "#c9dceb");
    grad.addColorStop(0.55, "#7f9db6");
    grad.addColorStop(1, "#5a7690");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
    g.fillStyle = "rgba(255,255,255,.35)";
    g.beginPath();
    g.moveTo(6, 6);
    g.lineTo(24, 6);
    g.lineTo(6, 30);
    g.fill();
  });

/** Painted sign board with the game's hand-drawn lettering. */
export function labelTexture(text: string, bg: string, fg = "#fff8e6", opts: { w?: number; h?: number; border?: string; size?: number } = {}): THREE.CanvasTexture {
  const w = opts.w ?? 512, h = opts.h ?? 128;
  const key = `label|${text}|${bg}|${fg}|${w}|${h}|${opts.border ?? ""}|${opts.size ?? ""}`;
  const draw = (g: CanvasRenderingContext2D) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = bg;
    const rad = Math.min(18, h / 5);
    g.beginPath();
    g.roundRect(4, 4, w - 8, h - 8, rad);
    g.fill();
    if (opts.border) {
      g.strokeStyle = opts.border;
      g.lineWidth = 6;
      g.stroke();
    }
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    let size = opts.size ?? Math.round(h * 0.62);
    const family = '"Patrick Hand", "Comic Sans MS", cursive';
    g.font = `bold ${size}px ${family}`;
    while (g.measureText(text).width > w - 40 && size > 12) {
      size -= 2;
      g.font = `bold ${size}px ${family}`;
    }
    g.fillText(text, w / 2, h / 2 + size * 0.04);
  };
  const t = make(key, w, h, draw);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  // Repaint once the web font has loaded so signs match the UI lettering.
  if (typeof document !== "undefined" && document.fonts && !t.userData["fontHooked"]) {
    t.userData["fontHooked"] = true;
    document.fonts.load('bold 40px "Patrick Hand"').then(() => {
      const c = t.image as HTMLCanvasElement;
      const g = c.getContext("2d");
      if (g) {
        draw(g);
        t.needsUpdate = true;
      }
    }).catch(() => undefined);
  }
  return t;
}

/** Clock face for the school tower. */
export const clockTexture = () =>
  make("clock", 128, 128, (g) => {
    g.fillStyle = "#fff8e6";
    g.beginPath();
    g.arc(64, 64, 60, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = "#2c2a2e";
    g.lineWidth = 6;
    g.stroke();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      g.fillStyle = "#2c2a2e";
      g.fillRect(64 + Math.sin(a) * 48 - 3, 64 - Math.cos(a) * 48 - 3, 6, 6);
    }
    g.lineCap = "round";
    g.lineWidth = 7;
    g.beginPath();
    g.moveTo(64, 64);
    g.lineTo(64, 26);
    g.moveTo(64, 64);
    g.lineTo(92, 74);
    g.stroke();
  });

/** Soft radial glow used for lamp pools and window light at night. */
export const glowTexture = () =>
  make("glow", 128, 128, (g) => {
    const grad = g.createRadialGradient(64, 64, 2, 64, 64, 64);
    grad.addColorStop(0, "rgba(255,226,150,1)");
    grad.addColorStop(0.4, "rgba(255,206,120,.45)");
    grad.addColorStop(1, "rgba(255,190,100,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 128, 128);
  });

/** Soft round contact shadow for characters and cars. */
export const blobShadowTexture = () =>
  make("blob", 64, 64, (g) => {
    const grad = g.createRadialGradient(32, 32, 1, 32, 32, 32);
    grad.addColorStop(0, "rgba(0,0,0,.55)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 64);
  });
