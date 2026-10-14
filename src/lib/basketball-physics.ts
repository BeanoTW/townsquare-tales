/**
 * Fixed-step, deterministic basketball flight for the side-on court.
 * Simulation is independent of React and can be replayed without allocating per frame.
 * Scoring is still owned by evaluateShot until the full physics/scoring migration.
 */
export type PhysicsPoint = { x: number; y: number };
export type PhysicsContact = "front-rim" | "back-rim" | "backboard" | "floor";
export type PhysicsFrame = PhysicsPoint & { contact?: PhysicsContact };
export type PhysicsSettings = {
  releaseX: number; releaseY: number; floorY: number; rimY: number;
  radius: number; rimHalf: number; gravity: number;
  speed: number; angle: number; hoopX: number;
};
export type PhysicsFlight = {
  frames: PhysicsFrame[];
  contacts: PhysicsContact[];
  crossedNet: boolean;
};
const STEP = 1 / 120;
const DURATION = 4;
const RIM_RESTITUTION = 0.68;
const BOARD_RESTITUTION = 0.72;
const FLOOR_RESTITUTION = 0.51;

export function simulateFlight(settings: PhysicsSettings): PhysicsFlight {
  const s = settings;
  const frames: PhysicsFrame[] = [];
  const contacts: PhysicsContact[] = [];
  let x = s.releaseX;
  let y = s.releaseY;
  let vx = s.speed * Math.cos(s.angle);
  let vy = -s.speed * Math.sin(s.angle);
  let crossedNet = false;
  let lastContact = "";
  let lastContactStep = -20;
  const rimXs = [s.hoopX - s.rimHalf, s.hoopX + s.rimHalf];
  const floor = s.floorY - s.radius;

  for (let tick = 0; tick < DURATION / STEP; tick++) {
    const oldY = y;
    vy += s.gravity * STEP;
    vx *= 0.9997;
    x += vx * STEP;
    y += vy * STEP;
    let contact: PhysicsContact | undefined;

    // Circle vs circular rim cross-section, including approach from underneath.
    for (let index = 0; index < 2; index++) {
      const lipX = rimXs[index]!;
      const dx = x - lipX;
      const dy = y - s.rimY;
      const distance = Math.hypot(dx, dy);
      const contactDistance = s.radius + 2;
      const kind: PhysicsContact = index === 0 ? "front-rim" : "back-rim";
      if (distance >= contactDistance || distance < 0.001) continue;
      const nx = dx / distance;
      const ny = dy / distance;
      const approaching = vx * nx + vy * ny;
      if (approaching >= 0) continue;
      x += nx * (contactDistance - distance + 0.05);
      y += ny * (contactDistance - distance + 0.05);
      vx -= (1 + RIM_RESTITUTION) * approaching * nx;
      vy -= (1 + RIM_RESTITUTION) * approaching * ny;
      vx *= 0.985;
      contact = kind;
      break;
    }

    // The board is a narrow vertical solid, not an infinitely tall wall.
    const boardX = s.hoopX + s.rimHalf + 12;
    const boardTop = s.rimY - 52;
    const boardBottom = s.rimY + 6;
    if (!contact && vx > 0 && x + s.radius >= boardX &&
        x - s.radius < boardX && y + s.radius >= boardTop && y - s.radius <= boardBottom) {
      x = boardX - s.radius;
      vx = -Math.abs(vx) * BOARD_RESTITUTION;
      contact = "backboard";
    }

    if (oldY <= s.rimY && y >= s.rimY && vy > 0 &&
        x > rimXs[0]! + s.radius * 0.35 &&
        x < rimXs[1]! - s.radius * 0.35 && !contact) {
      crossedNet = true;
    }

    if (y >= floor && vy > 0) {
      y = floor;
      vy = -vy * FLOOR_RESTITUTION;
      vx *= 0.78;
      if (Math.abs(vy) < 38) vy = 0;
      contact = "floor";
    }
    if (contact && (contact !== lastContact || tick - lastContactStep > 10)) {
      contacts.push(contact);
      lastContact = contact;
      lastContactStep = tick;
    }
    // Keep display playback at 60 fps, while integrating at 120 Hz.
    if (tick % 2 === 1) frames.push({ x, y, ...(contact ? { contact } : {}) });
    if (y >= floor - 0.01 && vy === 0 && Math.abs(vx) < 8 && tick > 50) break;
    // Prevent a long off-court flight from consuming simulation time.
    if (x < -100 || x > 600 || y > s.floorY + 100) break;
  }
  return { frames, contacts, crossedNet };
}
