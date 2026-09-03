import { useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Box, Eyebrow, Mono, Pill, Section, Serif } from '@/components/ui';
import { addDays, rangeLabel, relativeWeek, todayStr } from '@/lib/dates';
import { formatQty, qtyUnit } from '@/lib/format';
import { useCheck, useList, useOnline, usePantryFlag, usePendingCount, useStores } from '@/lib/hooks';
import { storeCounts, syncLabel } from '@/lib/optimistic';
import { C, F } from '@/lib/theme';
import type { ShoppingItem } from '@/lib/types';

export default function ShoppingScreen() {
  const [date, setDate] = useState(todayStr());
  const list = useList(date); const stores = useStores(); const check = useCheck(date); const flag = usePantryFlag(date);
  const online = useOnline(); const pending = usePendingCount();
  const [storeId, setStoreId] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const l = list.data ?? null;
  const counts = useMemo(() => storeCounts(l), [l]);
  const visible = (stores.data ?? []).filter((s) => counts[s.id]);
  const current = storeId && counts[storeId] ? storeId : visible[0]?.id ?? null;
  const items = (l?.items ?? []).filter((i) => i.storeId === current);
  const store = visible.find((s) => s.id === current);
  const done = current ? counts[current]?.done ?? 0 : 0, total = current ? counts[current]?.total ?? 0 : 0;
  const thisWeekStart = l ? l.startDate : date;

  const tick = (it: ShoppingItem) => { if (l) check.mutate({ listId: l.id, ingredientId: it.ingredientId, checked: !it.checked }); };
  const toCheck = (l?.pantryCheck ?? []).filter((p) => !p.isLow);
  const storeName = (id: string) => (stores.data ?? []).find((s) => s.id === id)?.name ?? '';

  let lastGroup = '';
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }} edges={['top']}>
      <View style={s.header}>
        <View style={s.weekRow}>
          <Pressable accessibilityLabel="previous week" onPress={() => setDate(addDays(date, -7))} style={s.arrow}><Ionicons name="chevron-back" size={18} color={C.faint} /></Pressable>
          <Pressable onPress={() => setDate(todayStr())} style={{ flex: 1, alignItems: 'center' }}>
            <Text style={{ fontFamily: F.sansBold, fontSize: 12.5, color: l && relativeWeek(l.startDate, thisWeekStart) === 'This week' && date === todayStr() ? C.accentInk : C.muted }}>{l ? rangeLabel(l.startDate, l.endDate) : 'No list for this week'}</Text>
          </Pressable>
          <Pressable accessibilityLabel="next week" onPress={() => setDate(addDays(date, 7))} style={s.arrow}><Ionicons name="chevron-forward" size={18} color={C.faint} /></Pressable>
        </View>
        {store && <>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
            <View style={{ width: 11, height: 11, borderRadius: 3, backgroundColor: store.color }} />
            <Serif size={24} style={{ fontFamily: F.serifBold, flex: 1 }}>{store.name}</Serif>
            <Mono size={13} color={C.muted}>{done === total ? 'Done' : `${done}/${total}`}</Mono>
          </View>
          <View style={s.bar}><View style={[s.barFill, { width: `${total ? Math.round((done / total) * 100) : 0}%` }]} /></View>
        </>}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 7, height: 7, borderRadius: 999, backgroundColor: online ? C.green : C.amber }} /><Body size={11.5} color={C.faint}>{syncLabel(online, pending)}</Body>
        </View>
      </View>
      {visible.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.rule }} contentContainerStyle={{ gap: 7, paddingHorizontal: 18, paddingVertical: 11 }}>
          {visible.map((st) => <Pill key={st.id} label={st.name} dot={st.color} count={counts[st.id]?.total} on={st.id === current} onPress={() => { setStoreId(st.id); setOpen(null); }} />)}
        </ScrollView>
      )}
      <ScrollView style={{ flex: 1 }} refreshControl={<RefreshControl refreshing={list.isFetching && !list.isLoading} onRefresh={() => list.refetch()} />}>
        {list.isLoading && <Body color={C.faint} style={{ padding: 24 }}>Loading…</Body>}
        {!list.isLoading && !l && <View style={{ padding: 28, gap: 8 }}><Serif size={19} color="#4a423a">Nothing here yet</Serif><Body color={C.muted} style={{ lineHeight: 20 }}>{date > todayStr() ? 'This week is planned but its list has not been generated. Do that from the fridge check on the web.' : 'No list was generated for this week.'}</Body></View>}
        {items.map((it) => {
          const showGroup = it.group !== lastGroup; lastGroup = it.group;
          const isOpen = open === it.ingredientId && it.source === 'auto';
          return (
            <View key={it.ingredientId + it.source} style={isOpen ? { backgroundColor: '#fffdf7', borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#f2ebdf' } : undefined}>
              {showGroup && <Section label={it.group} color={it.source === 'low' ? C.amber : C.faint} />}
              <Pressable onPress={() => tick(it)} style={s.row} accessibilityRole="checkbox" accessibilityState={{ checked: it.checked }} accessibilityLabel={it.name}>
                <Box on={it.checked} />
                <Serif size={18} color={it.checked ? C.dim : C.ink} style={[{ flex: 1 }, it.checked && { textDecorationLine: 'line-through' }]}>{it.name}</Serif>
                <Pressable onPress={() => (it.source === 'auto' ? setOpen(isOpen ? null : it.ingredientId) : tick(it))} style={{ alignItems: 'flex-end', paddingVertical: 6, paddingLeft: 10 }}>
                  {it.buyQty !== undefined && <Mono color={it.checked ? C.dim : C.ink}>{qtyUnit(it.buyQty, it.buyUnit)}</Mono>}
                  {it.source === 'weekly' && <Body size={11.5} color={it.checked ? '#c3bbb0' : C.amber}>every week</Body>}
                  {it.source === 'low' && it.checked && <Text style={{ fontFamily: F.sansBold, fontSize: 11.5, color: C.green }}>replenished</Text>}
                  {it.altQty !== undefined && it.altUnit && <Mono size={11.5} color={C.faint}>≈ {qtyUnit(it.altQty, it.altUnit)}</Mono>}
                </Pressable>
              </Pressable>
              {isOpen && it.needQty !== undefined && <View style={s.math}><Mono size={12} color="#8a7f73">need {formatQty(it.needQty)}  ·  have {formatQty(it.haveQty ?? 0)}  ·  short {formatQty(Math.max(0, it.needQty - (it.haveQty ?? 0)))} {it.needUnit}</Mono></View>}
            </View>
          );
        })}
        {l && toCheck.length > 0 && (
          <View style={s.pantryBox}>
            <Eyebrow color={C.accentInk}>Check the pantry</Eyebrow>
            <Body size={12.5} color={C.muted} style={{ lineHeight: 18 }}>This week cooks with these and nobody has flagged them. Low on one? Tap it and it goes onto its store’s list.</Body>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
              {toCheck.map((p) => <Pill key={p.ingredientId} label={`${p.name} · ${storeName(p.storeId)}`} dot={(stores.data ?? []).find((st) => st.id === p.storeId)?.color} onPress={() => flag.mutate({ listId: l.id, ingredientId: p.ingredientId })} />)}
            </View>
          </View>
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  pantryBox: { marginHorizontal: 18, marginTop: 18, padding: 14, gap: 6, backgroundColor: C.surface, borderWidth: 1, borderColor: C.rule, borderRadius: 10 },
  header: { paddingHorizontal: 18, paddingBottom: 12, gap: 9, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.rule },
  weekRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: -10 },
  arrow: { width: 44, height: 36, alignItems: 'center', justifyContent: 'center' },
  bar: { height: 5, borderRadius: 999, backgroundColor: C.ruleSoft, overflow: 'hidden' },
  barFill: { height: 5, borderRadius: 999, backgroundColor: C.green },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 18, minHeight: 56 },
  math: { paddingLeft: 56, paddingRight: 18, paddingBottom: 12 },
});
