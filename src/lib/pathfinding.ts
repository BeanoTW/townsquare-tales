/** Grid-based A* routing for our small town. Obstacles are expressed in world coordinates. */
export type Point = { x: number; y: number };
export type Obstacle = { x: number; y: number; w: number; d: number };
const STEP = 0.5;
const SIZE = 60;
const cell = (p: Point) => ({ x: Math.max(0, Math.min(SIZE - 1, Math.round(p.x / STEP))), y: Math.max(0, Math.min(SIZE - 1, Math.round(p.y / STEP))) });
const key = (p: Point) => p.x + "," + p.y;
export function findRoute(start: Point, goal: Point, obstacles: Obstacle[]): Point[] {
  const blocked = (p: Point) => p.x < 0.2 || p.y < 0.2 || p.x > 29.8 || p.y > 29.8 ||
    obstacles.some(b => p.x > b.x - 0.15 && p.x < b.x + b.w + 0.15 && p.y > b.y - 0.15 && p.y < b.y + b.d + 0.15);
  const from = cell(start), to = cell(goal);
  const valid = (c: Point) => c.x >= 1 && c.y >= 1 && c.x < SIZE && c.y < SIZE && !blocked({x:c.x*STEP,y:c.y*STEP});
  if (!valid(from)) return [];
  const open: Point[] = [from], parents = new Map<string,string>(), costs = new Map([[key(from),0]]), closed = new Set<string>();
  const heuristic = (a: Point) => Math.abs(a.x-to.x)+Math.abs(a.y-to.y);
  let best = from;
  while (open.length) {
    open.sort((a,b)=>(costs.get(key(a))!+heuristic(a))-(costs.get(key(b))!+heuristic(b)));
    const p = open.shift()!, id=key(p);
    if (closed.has(id)) continue;
    closed.add(id);
    if (heuristic(p)<heuristic(best)) best=p;
    if (p.x===to.x && p.y===to.y) {best=p;break;}
    for (const q of [{x:p.x+1,y:p.y},{x:p.x-1,y:p.y},{x:p.x,y:p.y+1},{x:p.x,y:p.y-1}]) {
      if (!valid(q) || closed.has(key(q))) continue;
      const cost=costs.get(id)!+1;
      if (cost < (costs.get(key(q))??Infinity)) {costs.set(key(q),cost);parents.set(key(q),id);open.push(q);}
    }
  }
  if (heuristic(best)>2) return [];
  const out: Point[] = [];
  let id=key(best);
  while (id!==key(from)) {
    const [x,y]=id.split(",").map(Number);
    out.push({x:x*STEP,y:y*STEP});
    const prev=parents.get(id);
    if (!prev) return [];
    id=prev;
  }
  out.reverse();
  // Remove collinear intermediate nodes without cutting through buildings.
  return out.filter((p,i)=>i===out.length-1 || i===0 || (out[i-1].x-p.x)!==(p.x-out[i+1].x) || (out[i-1].y-p.y)!==(p.y-out[i+1].y));
}
