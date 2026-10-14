/** Browser-safe 3D court. Playback and scoring consume the exact same fixed-step frames. */
export type Vec3 = { x: number; y: number; z: number };
export type ArcadeContact = "rim" | "board" | "floor";
export type ArcadeFrame = Vec3 & { time: number; contact?: ArcadeContact; basket?: boolean };
export type ArcadeFlight = { frames: ArcadeFrame[]; made: boolean; swish: boolean; contacts: ArcadeContact[] };
export const ARCADE_COURT = {
  hoop: { x: 0, y: 3.05, z: 5.5 }, rimRadius: 0.43, rimTube: 0.025,
  ballRadius: 0.12, boardZ: 5.95, boardBottom: 2.9, boardTop: 4.15,
  boardHalfWidth: 1, release: { x: 0, y: 1.18, z: 0.4 }, gravity: 9.8,
} as const;
export const SHOOTOUT_SECONDS = 30;
export const projectCourt = (p: Vec3) => {
  const scale = 500 / Math.max(0.6, p.z + 1);
  return { x: 200 + p.x * scale, y: 270 - (p.y - 1.7) * scale, radius: ARCADE_COURT.ballRadius * scale };
};
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

/** Input distances in the court's 400 × 560 coordinate space, independent of screen size. */
export function swipeVelocity(dx: number, up: number, milliseconds: number): Vec3 | null {
  if (!Number.isFinite(dx + up + milliseconds) || up < 32) return null;
  const distance = up / 168;
  const speed = up / Math.max(100, milliseconds) / 0.56;
  const strength = clamp(1 + (distance - 1) * 0.24 + (speed - 1) * 0.06, 0.68, 1.32);
  return { x: clamp(dx / up, -1.5, 1.5) * 4.636 * 0.4, y: 7.09 * strength, z: 4.636 * strength };
}

export function simulateArcadeShot(velocity: Vec3): ArcadeFlight {
  const c = ARCADE_COURT, h = c.hoop;
  const dt = 1 / 240;
  const frames: ArcadeFrame[] = [{ ...c.release, time: 0 }];
  const contacts: ArcadeContact[] = [];
  let p: Vec3 = { ...c.release }, v = { ...velocity }, made = false;
  let pendingContact: ArcadeContact | undefined, pendingBasket = false;
  let lastContactTime = -1;
  for (let tick = 1; tick <= 720; tick++) {
    const old = { ...p };
    v.y -= c.gravity * dt;
    p = { x: p.x + v.x * dt, y: p.y + v.y * dt, z: p.z + v.z * dt };
    let contact: ArcadeContact | undefined;
    // Sphere against the hoop's horizontal torus; all sides share the same geometry.
    const dx = p.x - h.x, dz = p.z - h.z;
    const radial = Math.hypot(dx, dz);
    if (radial > 0.0001) {
      const q = { x: h.x + dx / radial * c.rimRadius, y: h.y, z: h.z + dz / radial * c.rimRadius };
      const d = { x: p.x - q.x, y: p.y - q.y, z: p.z - q.z };
      const length = Math.hypot(d.x, d.y, d.z), limit = c.ballRadius + c.rimTube;
      if (length < limit && length > 0.00001) {
        const n = { x: d.x / length, y: d.y / length, z: d.z / length };
        const approach = v.x * n.x + v.y * n.y + v.z * n.z;
        p.x += n.x * (limit - length); p.y += n.y * (limit - length); p.z += n.z * (limit - length);
        if (approach < 0) {
          v.x -= 1.62 * approach * n.x; v.y -= 1.62 * approach * n.y; v.z -= 1.62 * approach * n.z;
          contact = "rim";
        }
      }
    }
    // Solid backboard, including rebounds from either face.
    const front = c.boardZ - c.ballRadius, back = c.boardZ + c.ballRadius;
    if (Math.abs(p.x) <= c.boardHalfWidth + c.ballRadius && p.y + c.ballRadius >= c.boardBottom && p.y - c.ballRadius <= c.boardTop) {
      if (v.z > 0 && old.z <= front && p.z >= front) { p.z = front; v.z *= -0.72; contact = "board"; }
      else if (v.z < 0 && old.z >= back && p.z <= back) { p.z = back; v.z *= -0.72; contact = "board"; }
    }
    // Score ONLY an actual downward crossing of the clear aperture. Never a projected estimate.
    if (!made && old.y > h.y && p.y <= h.y && v.y < 0) {
      const t = (old.y - h.y) / (old.y - p.y);
      const x = old.x + (p.x - old.x) * t, z = old.z + (p.z - old.z) * t;
      if (Math.hypot(x - h.x, z - h.z) < c.rimRadius - c.ballRadius - c.rimTube) {
        made = true; pendingBasket = true;
      }
    }
    if (p.y <= c.ballRadius && v.y < 0) { p.y = c.ballRadius; v.y *= -0.45; v.x *= 0.8; v.z *= 0.8; contact = "floor"; }
    if (contact) {
      pendingContact = contact;
      if (tick * dt - lastContactTime > 0.05) { contacts.push(contact); lastContactTime = tick * dt; }
    }
    if (tick % 4 === 0) {
      frames.push({ ...p, time: tick * dt, ...(pendingContact ? { contact: pendingContact } : {}), ...(pendingBasket ? { basket: true } : {}) });
      pendingContact = undefined; pendingBasket = false;
      // A scored ball clears the net before reset; misses retain visible rebound/fall.
      if ((made && p.y < h.y - 0.85) || (contact === "floor") || p.z < -0.2 || Math.abs(p.x) > 6) break;
    }
  }
  return { frames, made, swish: made && !contacts.some((c) => c === "rim" || c === "board"), contacts };
}

export function rimOutline(radius: number = ARCADE_COURT.rimRadius, y: number = ARCADE_COURT.hoop.y): string {
  const h = ARCADE_COURT.hoop;
  return Array.from({ length: 49 }, (_, i) => {
    const angle = i / 48 * Math.PI * 2;
    const p = projectCourt({ x: h.x + Math.cos(angle) * radius, y, z: h.z + Math.sin(angle) * radius });
    return `${i === 0 ? "M" : "L"}${p.x.toFixed(2)},${p.y.toFixed(2)}`;
  }).join(" ") + " Z";
}