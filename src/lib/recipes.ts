// Pure pieces of the Recipes tab: the list's search and tag filter, and the editor's draft. Tested without React Native.
import type { Ingredient, IngredientKind, Recipe, Unit } from './types';
import type { RecipeInput } from './api';
import { UNIT_LABEL } from './format';

/** A line while it is being edited: quantity is text until it is saved, and the unit may not be chosen yet. */
export type LineDraft = { ingredientId: string; qty: string; unit: Unit | ''; note: string };
/** Tags are typed as one comma-separated string and split on save, so a trailing comma survives typing. */
export interface RecipeDraft { title: string; tagsText: string; lines: LineDraft[]; morningSteps: string[]; steps: string[] }

export const blankDraft = (): RecipeDraft => ({ title: '', tagsText: '', lines: [], morningSteps: [''], steps: [''] });

export function draftFrom(r: Recipe): RecipeDraft {
  return {
    title: r.title, tagsText: r.tags.join(', '),
    morningSteps: r.morningSteps?.length ? r.morningSteps : [''], steps: r.steps.length ? r.steps : [''],
    lines: r.ingredients.map((l) => ({ ingredientId: l.ingredientId, qty: l.qty?.toString() ?? '', unit: l.unit ?? '', note: l.note ?? '' })),
  };
}

/** A phone keyboard in some locales types "1,5"; the API wants 1.5. */
const toNumber = (s: string) => Number(s.trim().replace(',', '.'));

export function draftToBody(d: RecipeDraft): RecipeInput {
  return {
    title: d.title.trim(), tags: d.tagsText.split(',').map((t) => t.trim()).filter(Boolean),
    morningSteps: d.morningSteps.map((s) => s.trim()).filter(Boolean), steps: d.steps.map((s) => s.trim()).filter(Boolean),
    ingredients: d.lines.filter((l) => l.ingredientId).map((l) => ({ ingredientId: l.ingredientId, ...(l.qty.trim() ? { qty: toNumber(l.qty) } : {}), ...(l.unit ? { unit: l.unit } : {}), ...(l.note.trim() ? { note: l.note.trim() } : {}) })),
  };
}

/** Every tag in the book, lower-cased so "Soup" and "soup" are one pill. */
export function tagsOf(recipes: Recipe[]): string[] {
  return [...new Set(recipes.flatMap((r) => r.tags.map((t) => t.toLowerCase())))].sort();
}
export function filterRecipes(recipes: Recipe[], search: string, tag: string | null): Recipe[] {
  const needle = search.trim().toLowerCase();
  return recipes.filter((r) => r.title.toLowerCase().includes(needle) && (!tag || r.tags.some((t) => t.toLowerCase() === tag)));
}

export const KIND_LABEL: Record<IngredientKind, string> = { fresh: 'Fresh', weekly: 'Weekly', pantry: 'Pantry' };
/** The one line that explains how an ingredient reaches the shopping list. */
export function counted(i: Ingredient): string {
  if (i.kind === 'pantry') return 'no quantity — marked low';
  if (i.kind === 'weekly') return `${i.weeklyQty} every week`;
  const parts = [i.buyUnit ? `by ${UNIT_LABEL[i.buyUnit]}` : ''];
  if (i.ozPerCount && i.countUnit) parts.push(`${i.ozPerCount} oz per ${i.countUnit}`);
  if (i.ozPerCup) parts.push(`${i.ozPerCup} oz per cup`);
  return parts.filter(Boolean).join(' · ');
}
