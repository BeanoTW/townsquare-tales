import { reachable, type Nav } from "./nav";
const neighbors = [[1,0],[-1,0],[0,1],[0,-1]] as const;
export type WalkPoint = { x: number; z: number };
/** Grid A*: respects walls, doorways, owned furniture and decorative colliders. */
export function routeHome(nav: Nav, start: WalkPoint, goal: WalkPoint): WalkPoint[] {
  const cell = nav.cell, nz = nav.nz;
  const idx = (x: number,z: number) => x*nz+z;
  const sx = Math.round(start.x/cell), sz = Math.round(start.z/cell);
  const gx = Math.round(goal.x/cell), gz = Math.round(goal.z/cell);
  const valid = (x:number,z:number) => x>=0 && z>=0 && x<nav.nx && z<nav.nz && !nav.blocked[idx(x,z)];
  if (!valid(sx,sz)) return [];
  const visited = reachable(nav,[start.x,start.z]);
  let tx=gx,tz=gz;
  if (!valid(tx,tz) || !visited[idx(tx,tz)]) {
    let best=Infinity;
    for(let x=0;x<nav.nx;x++)for(let z=0;z<nz;z++)if(valid(x,z)&&visited[idx(x,z)]){
      const d=Math.hypot((x-gx)*cell,(z-gz)*cell);
      if(d<best){best=d;tx=x;tz=z;}
    }
  }
  const src=idx(sx,sz),dst=idx(tx,tz);
  if(src===dst)return [];
  const came = new Int32Array(nav.blocked.length).fill(-1);
  const score = new Float32Array(nav.blocked.length).fill(Infinity);
  score[src]=0;
  const open = [src];
  const queued = new Uint8Array(nav.blocked.length);
  queued[src]=1;
  while(open.length){
    let best=0, value=Infinity;
    for(let k=0;k<open.length;k++){
      const n=open[k]!,x=Math.floor(n/nz),z=n%nz;
      const f=score[n]!+Math.abs(x-tx)+Math.abs(z-tz);
      if(f<value){best=k;value=f;}
    }
    const cur=open.splice(best,1)[0]!;
    queued[cur]=0;
    if(cur===dst){
      const path:WalkPoint[]=[];
      let at=dst;
      while(at!==src && at>=0){
        path.push({x:Math.floor(at/nz)*cell,z:(at%nz)*cell});
        at=came[at]!;
      }
      return path.reverse();
    }
    const x=Math.floor(cur/nz),z=cur%nz;
    for(const [dx,dz] of neighbors){
      const nx=x+dx,nz2=z+dz;
      if(!valid(nx,nz2))continue;
      const n=idx(nx,nz2),g=score[cur]!+1;
      if(g<score[n]!){came[n]=cur;score[n]=g;if(!queued[n]){queued[n]=1;open.push(n);}}
    }
  }
  return [];
}
