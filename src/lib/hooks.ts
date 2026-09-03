import { useMutation, useMutationState, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { onlineManager } from '@tanstack/react-query';
import { api } from './api';
import { applyCheck, applyExpiry, applyLow, applyPantryLow } from './optimistic';
import type { Ingredient, ShoppingList } from './types';

export const keys = {
  settings: ['settings'] as const, stores: ['stores'] as const, ingredients: ['ingredients'] as const,
  list: (d: string) => ['list', d] as const, today: (d: string) => ['today', d] as const,
};
export const useSettings = () => useQuery({ queryKey: keys.settings, queryFn: api.settings.get });
export const useStores = () => useQuery({ queryKey: keys.stores, queryFn: api.stores.list });
export const useIngredients = () => useQuery({ queryKey: keys.ingredients, queryFn: api.ingredients.list });
export const useList = (date: string) => useQuery({ queryKey: keys.list(date), queryFn: () => api.lists.forWeek(date) });
export const useToday = (date: string) => useQuery({ queryKey: keys.today(date), queryFn: () => api.today(date) });

export function useOnline() {
  const [online, setOnline] = useState(onlineManager.isOnline());
  useEffect(() => onlineManager.subscribe(setOnline), []);
  return online;
}
export function usePendingCount() {
  return useMutationState({ filters: { status: 'pending' }, select: (m) => m.state.status }).length;
}

/** Tick a line: the screen changes now, the server hears about it when it can. */
export function useCheck(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['check'],
    onMutate: async (v: { listId: string; ingredientId: string; checked: boolean }) => {
      await qc.cancelQueries({ queryKey: keys.list(date) });
      const prev = qc.getQueryData<ShoppingList | null>(keys.list(date));
      if (prev) qc.setQueryData(keys.list(date), applyCheck(prev, v.ingredientId, v.checked));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev !== undefined) qc.setQueryData(keys.list(date), ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: keys.list(date) }); qc.invalidateQueries({ queryKey: keys.ingredients }); },
  });
}
/** From the list's pantry reminder: flag low and show it in the store list immediately, even with no signal. */
export function usePantryFlag(date: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['pantry'],
    onMutate: async (v: { listId: string; ingredientId: string }) => {
      await qc.cancelQueries({ queryKey: keys.list(date) });
      const prev = qc.getQueryData<ShoppingList | null>(keys.list(date));
      if (prev) qc.setQueryData(keys.list(date), applyPantryLow(prev, v.ingredientId));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev !== undefined) qc.setQueryData(keys.list(date), ctx.prev); },
    onSettled: () => { qc.invalidateQueries({ queryKey: keys.list(date) }); qc.invalidateQueries({ queryKey: keys.ingredients }); },
  });
}
export function useSetLow() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['low'],
    onMutate: async (v: { id: string; isLow: boolean }) => {
      await qc.cancelQueries({ queryKey: keys.ingredients });
      const prev = qc.getQueryData<Ingredient[]>(keys.ingredients);
      if (prev) qc.setQueryData(keys.ingredients, applyLow(prev, v.id, v.isLow));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(keys.ingredients, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.ingredients }),
  });
}
/** Set or clear an expiry date from the pantry screen; optimistic and queued like everything else. */
export function useSetExpiry() {
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['expiry'],
    onMutate: async (v: { id: string; expiresOn: string | null }) => {
      await qc.cancelQueries({ queryKey: keys.ingredients });
      const prev = qc.getQueryData<Ingredient[]>(keys.ingredients);
      if (prev) qc.setQueryData(keys.ingredients, applyExpiry(prev, v.id, v.expiresOn));
      return { prev };
    },
    onError: (_e, _v, ctx) => { if (ctx?.prev) qc.setQueryData(keys.ingredients, ctx.prev); },
    onSettled: () => qc.invalidateQueries({ queryKey: keys.ingredients }),
  });
}
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: api.settings.update, onSuccess: () => qc.invalidateQueries() });
}
