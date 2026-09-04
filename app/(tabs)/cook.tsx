import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Eyebrow, Mono, Section, Serif, Stepper } from '@/components/ui';
import { addDays, dowLong, relativeDay, shortDate, todayStr } from '@/lib/dates';
import { formatQty, UNIT_LABEL } from '@/lib/format';
import { useSettings, useToday, useUpdateSettings } from '@/lib/hooks';
import { C, F } from '@/lib/theme';
import type { ScaledRecipe } from '@/lib/types';

// Naming the evening a pot was cooked the way you'd say it at the stove; a carry that skipped a fast reaches further back than last night (§4 Ekadashi).
export const nightLabel = (from: string, date: string) => (from === addDays(date, -1) ? 'last night' : `${dowLong(from)} night`);

export default function CookScreen() {
  const [date, setDate] = useState(todayStr());
  const today = useToday(date); const settings = useSettings(); const update = useUpdateSettings();
  const [done, setDone] = useState<Set<string>>(new Set());
  const t = today.data;
  const toggle = (k: string) => setDone((prev) => { const n = new Set(prev); if (n.has(k)) n.delete(k); else n.add(k); return n; });

  const Block = ({ slot, label, factor, note, recipes }: { slot: string; label: string; factor: string; note?: string; recipes: ScaledRecipe[] }) => (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 18, paddingTop: 16, paddingBottom: 2 }}><Eyebrow color={C.accentInk}>{label}</Eyebrow><Body size={11.5} color={C.faint} style={{ flex: 1 }}>{factor}</Body></View>
      {note && <Body size={12.5} color={C.amber} style={{ paddingHorizontal: 18, paddingTop: 2, fontFamily: F.sansMed }}>{note}</Body>}
      {recipes.length === 0 && <Body color={C.faint} style={{ paddingHorizontal: 18, paddingVertical: 10, fontFamily: F.serif, fontStyle: 'italic' }}>Nothing planned</Body>}
      {recipes.map((r, ri) => (
        <View key={r.recipeId} style={ri > 0 ? { borderTopWidth: 1, borderTopColor: C.ruleSoft, marginTop: 6 } : undefined}>
          <View style={{ paddingHorizontal: 18, paddingTop: 14, paddingBottom: 8, gap: 3 }}><Serif size={22}>{r.title}</Serif><Body size={12} color={C.faint}>{r.lines.length} ingredients · {r.steps.length} steps</Body></View>
          <Section label="Ingredients" style={{ paddingTop: 10, paddingBottom: 4 }} />
          {r.lines.map((l, i) => (
            <View key={i} style={s.line}>
              <Mono size={15} style={{ width: 58, textAlign: 'right' }}>{l.qty !== undefined ? formatQty(l.qty) : ''}</Mono>
              <Body size={12.5} color={C.muted} style={{ width: 44 }}>{l.unit ? UNIT_LABEL[l.unit] : ''}</Body>
              <Text style={{ flex: 1 }}><Serif size={16}>{l.name}</Serif>{l.note ? <Body size={12} color={C.faint}>  {l.note}</Body> : null}</Text>
            </View>
          ))}
          {r.steps.length > 0 && <Section label="Method" style={{ paddingTop: 10, paddingBottom: 4 }} />}
          {r.steps.map((st, i) => { const k = `${date}|${slot}|${r.recipeId}|${i}`; const d = done.has(k); return (
            <Pressable key={i} onPress={() => toggle(k)} style={s.step} accessibilityRole="checkbox" accessibilityState={{ checked: d }}>
              <View style={[s.num, d && { backgroundColor: C.green }]}>{d ? <Text style={{ color: '#fff', fontSize: 12, fontFamily: F.sansBold }}>✓</Text> : <Mono size={11} color={C.accentInk}>{i + 1}</Mono>}</View>
              <Body style={[{ flex: 1, lineHeight: 21, paddingTop: 2 }, d && { color: C.dim, textDecorationLine: 'line-through' }]}>{st}</Body>
            </Pressable>); })}
        </View>
      ))}
    </>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }} edges={['top']}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginHorizontal: -10 }}>
          <Pressable accessibilityLabel="previous day" onPress={() => setDate(addDays(date, -1))} style={s.arrow}><Ionicons name="chevron-back" size={18} color={C.muted} /></Pressable>
          <Pressable onPress={() => setDate(todayStr())} style={{ flex: 1, alignItems: 'center', gap: 1 }}>
            <Eyebrow color={date === todayStr() ? C.accentInk : C.faint}>{relativeDay(date)}</Eyebrow>
            <Serif size={22} style={{ fontFamily: F.serifBold }}>{shortDate(date)}</Serif>
            {t?.isEkadashi && <View style={s.fast}><Eyebrow color={C.amber}>Ekadashi</Eyebrow></View>}
          </Pressable>
          <Pressable accessibilityLabel="next day" onPress={() => setDate(addDays(date, 1))} style={s.arrow}><Ionicons name="chevron-forward" size={18} color={C.muted} /></Pressable>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
          <Body size={12.5} color={C.muted}>Cooking for</Body>
          <Stepper value={settings.data?.people ?? 2} onChange={(people) => update.mutate({ people })} />
        </View>
      </View>
      <ScrollView style={{ flex: 1 }}>
        {t && <>
          <Block slot="b" label="Breakfast" factor={`for ${t.people} · ×1`} recipes={t.breakfast} />
          <View style={s.lunch}><Eyebrow>Lunch</Eyebrow><Body size={13} color="#6b6157" style={{ flex: 1 }}>{t.lunch.length && t.lunchFrom ? `${t.lunch.join(' + ')}, ${t.isEkadashi ? 'the fast’s own dish, cooked last night' : `from ${nightLabel(t.lunchFrom, date)}`} — nothing to cook` : 'Nothing carried over'}</Body></View>
          <Block slot="d" label="Dinner" recipes={t.dinner}
            factor={t.isEkadashi ? `for ${t.people} · ×2, lunch and dinner` : `for ${t.people} · ×2, ${t.cookAhead ? 'tonight and the lunch after the fast' : 'tonight and tomorrow’s lunch'}`}
            note={t.isEkadashi && t.dinner.length > 0 ? `Cooked ${nightLabel(t.dinnerCookedOn, date)} · the same dish at lunch and dinner` : undefined} />
          {t.cookAhead && <Block slot="a" label="Also cook tonight" factor={`for ${t.people} · ×2`} note={`For ${dowLong(t.cookAhead.date)}’s Ekadashi — it is eaten at both lunch and dinner`} recipes={t.cookAhead.recipes} />}
        </>}
        {today.isLoading && <Body color={C.faint} style={{ padding: 24 }}>Loading…</Body>}
        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingBottom: 12, gap: 8, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.rule },
  arrow: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  line: { flexDirection: 'row', alignItems: 'baseline', gap: 8, paddingHorizontal: 18, paddingVertical: 6 },
  step: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, paddingHorizontal: 18, minHeight: 52, paddingVertical: 8 },
  num: { width: 22, height: 22, borderRadius: 999, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  fast: { marginTop: 3, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999, backgroundColor: C.amberSoft, borderWidth: 1, borderColor: C.amberLine },
  lunch: { flexDirection: 'row', alignItems: 'center', gap: 9, marginHorizontal: 18, marginTop: 16, marginBottom: 4, padding: 12, backgroundColor: C.soft, borderRadius: 9 },
});
