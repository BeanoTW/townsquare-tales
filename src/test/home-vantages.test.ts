import { describe, it, expect } from 'vitest';
import { PLANS } from '@/lib/home3d/plans';
import { vantageFor, vantageLook, roomWallScale, wallScale, partitionDrops } from '@/lib/home3d/layout';

describe('home room viewpoints', () => {
  it('authors a viewpoint inside each selectable room for all four tiers', () => {
    for (const plan of PLANS) for (const room of plan.rooms) {
      const v = vantageFor(plan, room.zone);
      expect(plan.vantagePoints?.[room.zone]).toBeDefined();
      const rooms = plan.rooms.filter(r => r.zone === room.zone);
      expect(rooms.some(r => v.eye[0] >= r.rect.x0 && v.eye[0] <= r.rect.x1 && v.eye[2] >= r.rect.z0 && v.eye[2] <= r.rect.z1)).toBe(true);
      expect(v.eye[1]).toBeGreaterThan(1);
      expect(v.eye[1]).toBeLessThan(plan.size.h);
    }
  });
  it('preserves authored angled views and pitch at zero drag', () => {
    const v = vantageFor(PLANS[2]!, 'living');
    vantageLook(v.eye, v.lookAt, 0).forEach((n, i) => expect(n).toBeCloseTo(v.lookAt[i]!));
    const turned = vantageLook(v.eye, v.lookAt, 0.7);
    expect(turned[1]).toBe(v.lookAt[1]);
    expect(Math.hypot(turned[0]-v.eye[0], turned[2]-v.eye[2])).toBeCloseTo(Math.hypot(v.lookAt[0]-v.eye[0], v.lookAt[2]-v.eye[2]));
  });
  it('keeps fallback eyes inside the property', () => {
    const { vantagePoints, ...plan } = PLANS[0]!;
    const v = vantageFor(plan, 'shelter');
    expect(v.eye[2]).toBeLessThan(plan.size.d);
  });
  it('keeps partitions full height in first person and preserves cinematic folding', () => {
    for (const plan of PLANS) for (const wall of plan.walls) {
      const off = { x: 10, z: 10 }, camera = { x: 30, y: 1.6 };
      expect(roomWallScale(wall, off, camera, false)).toBe(Math.min(wallScale(wall, off), partitionDrops(wall, camera) ? 0.06 : 1));
      if (!wall.outer) expect(roomWallScale(wall, off, camera, true)).toBe(1);
    }
  });
});
