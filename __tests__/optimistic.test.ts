import { applyCheck, applyExpiry, applyLow, applyPantryLow, storeCounts, syncLabel } from '../src/lib/optimistic';
import type { ShoppingList } from '../src/lib/types';

const list: ShoppingList = { id: 'l', startDate: '2026-09-05', endDate: '2026-09-11', generatedAt: '', status: 'active', people: 2, problems: [], pantryCheck: [{ ingredientId: 'dal', name: 'Toor Dal', storeId: 'indian', isLow: false }, { ingredientId: 'ric', name: 'Rice', storeId: 'indian', isLow: true }], items: [
  { ingredientId: 'oni', name: 'Onion', storeId: 'costco', group: 'Produce', source: 'auto', checked: false, buyQty: 0.7, buyUnit: 'each' },
  { ingredientId: 'ric', name: 'Rice', storeId: 'indian', group: 'Running low', source: 'low', checked: false },
  { ingredientId: 'mil', name: 'Milk', storeId: 'costco', group: 'Dairy', source: 'weekly', checked: true, buyQty: 2 },
] };

describe('optimistic reducers', () => {
  it('ticks one line and leaves the rest untouched, never removing it', () => {
    const next = applyCheck(list, 'ric', true);
    expect(next.items).toHaveLength(3);
    expect(next.items[1].checked).toBe(true); expect(next.items[0].checked).toBe(false);
    expect(list.items[1].checked).toBe(false); // input not mutated
  });
  it('flips the low flag on one ingredient', () => {
    const out = applyLow([{ id: 'a', name: 'Rice', kind: 'pantry', storeId: 's', form: 'Dry Goods', isLow: false }, { id: 'b', name: 'Dal', kind: 'pantry', storeId: 's', form: 'Dry Goods', isLow: true }], 'a', true);
    expect(out.map((i) => i.isLow)).toEqual([true, true]);
  });
  it('flagging from the pantry reminder puts the item under its store, once', () => {
    const next = applyPantryLow(list, 'dal');
    expect(next.items.at(-1)).toMatchObject({ ingredientId: 'dal', storeId: 'indian', source: 'low', group: 'Running low', checked: false });
    expect(next.pantryCheck.find((p) => p.ingredientId === 'dal')?.isLow).toBe(true);
    expect(applyPantryLow(next, 'dal').items).toHaveLength(next.items.length); // idempotent
    expect(applyPantryLow(list, 'ric')).toBe(list); // already low → untouched
  });
  it('sets and clears an expiry date on one ingredient', () => {
    const ings = [{ id: 'a', name: 'Masala', kind: 'pantry' as const, storeId: 's', form: 'Spices' as const }, { id: 'b', name: 'Salt', kind: 'pantry' as const, storeId: 's', form: 'Dry Goods' as const, expiresOn: '2027-06-01' }];
    expect(applyExpiry(ings, 'a', '2026-09-15')[0].expiresOn).toBe('2026-09-15');
    expect(applyExpiry(ings, 'b', null)[1]).not.toHaveProperty('expiresOn');
    expect(applyExpiry(ings, 'a', '2026-09-15')[1].expiresOn).toBe('2027-06-01');
  });
  it('counts per store', () => { expect(storeCounts(list)).toEqual({ costco: { total: 2, done: 1 }, indian: { total: 1, done: 0 } }); expect(storeCounts(null)).toEqual({}); });
  it('says the right thing about sync', () => {
    expect(syncLabel(true, 0)).toMatch(/in sync/); expect(syncLabel(true, 2)).toBe('Syncing 2 changes…');
    expect(syncLabel(false, 0)).toMatch(/last list/); expect(syncLabel(false, 1)).toBe('No signal · 1 change saved on this phone');
  });
});
