// Pure reducers for what the screen shows before the server answers (§12 L). Tested without React Native.
import type { Ingredient, ShoppingList } from './types';

export function applyCheck(list: ShoppingList, ingredientId: string, checked: boolean): ShoppingList {
  return { ...list, items: list.items.map((i) => (i.ingredientId === ingredientId ? { ...i, checked } : i)) };
}
/** Flagging from the list's pantry reminder: the item appears under its store's Running low right away (§2). */
export function applyPantryLow(list: ShoppingList, ingredientId: string): ShoppingList {
  const p = list.pantryCheck.find((x) => x.ingredientId === ingredientId);
  if (!p || p.isLow) return list;
  const exists = list.items.some((i) => i.ingredientId === ingredientId && i.source === 'low');
  return {
    ...list,
    pantryCheck: list.pantryCheck.map((x) => (x.ingredientId === ingredientId ? { ...x, isLow: true } : x)),
    items: exists ? list.items : [...list.items, { ingredientId, name: p.name, storeId: p.storeId, group: 'Running low', source: 'low', checked: false }],
  };
}
export function applyExpiry(ingredients: Ingredient[], id: string, expiresOn: string | null): Ingredient[] {
  return ingredients.map((i) => { if (i.id !== id) return i; const { expiresOn: _old, ...rest } = i; return expiresOn ? { ...rest, expiresOn } : rest; });
}
export function applyLow(ingredients: Ingredient[], id: string, isLow: boolean): Ingredient[] {
  return ingredients.map((i) => (i.id === id ? { ...i, isLow } : i));
}
/** What the little status line under the header says. */
export function syncLabel(online: boolean, pending: number): string {
  if (!online) return pending > 0 ? `No signal · ${pending} change${pending === 1 ? '' : 's'} saved on this phone` : 'No signal · showing the last list you loaded';
  if (pending > 0) return `Syncing ${pending} change${pending === 1 ? '' : 's'}…`;
  return 'Works without signal · in sync';
}
export function storeCounts(list: ShoppingList | null | undefined): Record<string, { total: number; done: number }> {
  const out: Record<string, { total: number; done: number }> = {};
  for (const it of list?.items ?? []) { const e = (out[it.storeId] ??= { total: 0, done: 0 }); e.total++; if (it.checked) e.done++; }
  return out;
}
