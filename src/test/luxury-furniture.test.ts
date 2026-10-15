import { describe, expect, it } from 'vitest';
import { START } from '@/lib/game-data';
import { FURNITURE, LUXURY_FURNITURE, ownsFurniture } from '@/lib/furniture';
import { furnitureAction, runAction } from '@/lib/actions';
import { parseGame } from '@/lib/game-state';

describe('separately purchased luxury furnishings', () => {
  it.each(FURNITURE)('sells a separate luxury version of $id', item => {
    const state = { ...START, house: 3, furniture: item.bit, money: 50000 };
    expect(state).not.toHaveProperty('luxuryFurniture');
    const out = runAction(state, furnitureAction(item.id, state, true));
    if (!out.ok) throw Error(out.message);
    expect(ownsFurniture(out.next.luxuryFurniture ?? 0, item.id)).toBe(true);
    expect(out.next.furniture).toBe(item.bit);
    expect(out.next.money).toBe(50000 - (LUXURY_FURNITURE.find(x => x.id === item.id)?.cost ?? 0));
    expect(runAction(out.next, furnitureAction(item.id, out.next, true)).ok).toBe(false);
  });

  it('does not grant luxury ownership when a house upgrades or an old save loads', () => {
    const saved = parseGame(JSON.stringify({ ...START, house: 3, furniture: 255 }), START);
    expect(saved.luxuryFurniture ?? 0).toBe(0);
    expect(saved.furniture).toBe(255);
  });

  it('persists all eight luxury purchases independently from basic furniture', () => {
    const saved = parseGame(JSON.stringify({ ...START, furniture: 255, luxuryFurniture: 255 }), START);
    expect(saved.luxuryFurniture).toBe(255);
    expect(parseGame(JSON.stringify({ ...START, luxuryFurniture: 999 }), START).luxuryFurniture).toBe(255);
  });

  it('rejects unaffordable luxury purchases without replacing basic furniture', () => {
    const state = { ...START, furniture: 1, money: 0 };
    expect(runAction(state, furnitureAction('bed', state, true)).ok).toBe(false);
    expect(state.furniture).toBe(1);
  });

  it('allows luxury to be purchased directly and retains the original activity ownership', () => {
    const state = { ...START, money: 50000 };
    const out = runAction(state, furnitureAction('bed', state, true));
    if (!out.ok) throw Error(out.message);
    expect(out.next.furniture).toBe(1);
    expect(out.next.luxuryFurniture).toBe(1);
  });
});