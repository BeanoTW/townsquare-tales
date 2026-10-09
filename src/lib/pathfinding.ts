/** Grid-based navigation. Requests inside buildings resolve to the nearest walkable tile. */
export type Point = { x: number; y: number };
export type Obstacle = { x: number; y: number; w: number; d: number };
const STEP = 0.5, SIZE = 60;
const key = (x: number, y: number) => y * SIZE + x;
const fromKey = (k: number): Point => ({ x: k % SIZE * STEP, y: Math.floor(k / SIZE) * STEP });
const cell = (p: Point) => ({
  x: Math.max(1, Math.min(SIZE - 2, Math.round(p.x / STEP))),
  y: Math.max(1, Math.min(SIZE - 2, Math.round(p.y / STEP))),
});
const manhattan = (a: Point, b: Point) => Math.abs(a.x-b.x) + Math.abs(a.y-b.y);
export function isWalkable(p: Point, obstacles: Obstacle[]): boolean {
  return p.x >= STEP && p.y >= STEP && p.x <= 29 && p.y <= 29 &&
    !obstacles.some(b => p.x > b.x - .15 && p.x < b.x + b.w + .15 &&
                          p.y > b.y - .15 && p.y < b.y + b.d + .15);
}
/** Snap an invalid start to safe ground after map migrations. */
export function nearestWalkable(start: Point, obstacles: Obstacle[]): Point {
  if (isWalkable(start, obstacles)) return start;
  const origin=cell(start);
  for(let radius=1;radius<SIZE;radius++) {
    let candidate:Point|null=null, best=Infinity;
    for(let dx=-radius;dx<=radius;dx++) for(let dy=-radius;dy<=radius;dy++) {
      if(Math.max(Math.abs(dx),Math.abs(dy))!==radius)continue;
      const p={x:(origin.x+dx)*STEP,y:(origin.y+dy)*STEP};
      if(!isWalkable(p,obstacles))continue;
      const distance=Math.hypot(p.x-start.x,p.y-start.y);
      if(distance<best){candidate=p;best=distance;}
    }
    if(candidate)return candidate;
  }
  return {x:9.95,y:9};
}
export function findRoute(start: Point, goal: Point, obstacles: Obstacle[]): Point[] {
  const openStart = cell(nearestWalkable(start, obstacles)), desired = cell(goal);
  const visited = new Uint8Array(SIZE*SIZE), parent = new Int32Array(SIZE*SIZE).fill(-1);
  const queue = new Int32Array(SIZE*SIZE);
  const startId=key(openStart.x,openStart.y);
  // Never strand a saved player that becomes enclosed after a town re-layout.
  const permitted = (x: number, y: number) => x > 0 && x < SIZE-1 && y > 0 && y < SIZE-1 && isWalkable({ x:x*STEP,y:y*STEP },obstacles);
  let head=0,tail=1; queue[0]=startId;visited[startId]=1;
  let nearest=startId, distance=manhattan(openStart,desired);
  while(head<tail) {
    const id=queue[head++], x=id%SIZE, y=Math.floor(id/SIZE);
    const dist=manhattan({x,y},desired);
    if(dist<distance) { nearest=id;distance=dist; }
    if(dist===0) {nearest=id;break;}
    for(const [nx,ny] of [[x+1,y],[x-1,y],[x,y+1],[x,y-1]]) {
      if(!permitted(nx,ny))continue;
      const next=key(nx,ny);
      if(visited[next])continue;
      visited[next]=1; parent[next]=id;queue[tail++]=next;
    }
  }
  if(nearest===startId) return [];
  const route:Point[]=[];
  for(let id=nearest;id!==startId;id=parent[id]) {
    if(id<0) return [];
    route.push(fromKey(id));
  }
  route.reverse();
  // Keep actual turn points: the last waypoint is the reachable goal.
  return route.filter((p,i) => i===route.length-1 ||
    i===0 || (route[i-1].x-p.x !== p.x-route[i+1].x) ||
             (route[i-1].y-p.y !== p.y-route[i+1].y));
}
