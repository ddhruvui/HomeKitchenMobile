import { useMemo, useState } from 'react';
import { Alert, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Body, Eyebrow, Mono, Pill, Section, Serif } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { keys, useIngredients, useSetExpiry, useSetLow, useStores } from '@/lib/hooks';
import { C, F } from '@/lib/theme';
import { byExpiryThenName, expiryLabel, expiryStatus, toDateStr, toLocalDate, shortDate } from '@/lib/dates';
import { FORMS, type Form, type Ingredient } from '@/lib/types';

export default function PantryScreen() {
  const ings = useIngredients(); const stores = useStores(); const setLow = useSetLow(); const setExpiry = useSetExpiry(); const qc = useQueryClient();
  const [dateFor, setDateFor] = useState<Ingredient | null>(null);
  const askDate = (i: Ingredient) => {
    if (!i.expiresOn) return setDateFor(i);
    Alert.alert(i.name, expiryLabel(i.expiresOn), [
      { text: 'Change date', onPress: () => setDateFor(i) },
      { text: 'Clear date', style: 'destructive', onPress: () => setExpiry.mutate({ id: i.id, expiresOn: null }) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };
  const [filter, setFilter] = useState<'all' | 'low'>('all');
  const [adding, setAdding] = useState(false);
  const storeById = useMemo(() => Object.fromEntries((stores.data ?? []).map((s) => [s.id, s])), [stores.data]);
  const pantry = (ings.data ?? []).filter((i) => i.kind === 'pantry');
  const lowCount = pantry.filter((i) => i.isLow).length;
  // dated items first, soonest first, then the rest grouped by aisle
  const filtered = pantry.filter((i) => filter === 'all' || i.isLow);
  const dated = filtered.filter((i) => i.expiresOn).sort(byExpiryThenName);
  const undated = filtered.filter((i) => !i.expiresOn).sort((a, b) => FORMS.indexOf(a.form) - FORMS.indexOf(b.form) || a.name.localeCompare(b.name));
  const rows = [...dated, ...undated];
  const expiryColor = (d: string) => ({ expired: C.red, soon: C.amber, later: C.faint })[expiryStatus(d).status];
  let lastForm = '';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }} edges={['top']}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}>
          <Serif size={26} style={{ fontFamily: F.serifBold, flex: 1 }}>Pantry</Serif>
          <Text style={{ fontFamily: F.sansBold, fontSize: 13, color: C.amber }}><Mono size={13} color={C.amber}>{lowCount}</Mono> running low</Text>
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 18, paddingTop: 12, paddingBottom: 2 }}>
        <Pill label="Everything" on={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill label="Running low" on={filter === 'low'} onPress={() => setFilter('low')} />
      </View>
      <ScrollView style={{ flex: 1 }}>
        {ings.isLoading && <Body color={C.faint} style={{ padding: 24 }}>Loading…</Body>}
        {rows.map((i) => {
          const group = i.expiresOn ? 'Expiry dates' : i.form;
          const showForm = group !== lastForm; lastForm = group;
          return (
            <View key={i.id}>
              {showForm && <Section label={group} color={i.expiresOn ? C.accentInk : C.faint} style={{ paddingTop: 14 }} />}
              <Pressable onPress={() => setLow.mutate({ id: i.id, isLow: !i.isLow })} style={s.row} accessibilityRole="switch" accessibilityState={{ checked: !!i.isLow }} accessibilityLabel={i.name}>
                <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: storeById[i.storeId]?.color ?? '#ccc' }} />
                <View style={{ flex: 1, gap: 1 }}><Serif size={18}>{i.name}</Serif>{i.expiresOn && <Text style={{ fontFamily: F.sansMed, fontSize: 11.5, color: expiryColor(i.expiresOn) }}>{expiryLabel(i.expiresOn)}</Text>}</View>
                <View style={[s.chip, i.isLow ? s.chipOn : s.chipOff]}>
                  {i.isLow && <Ionicons name="warning-outline" size={13} color={C.accentInk} />}
                  <Text style={{ fontFamily: F.sansBold, fontSize: 12.5, color: i.isLow ? C.accentInk : C.muted }}>{i.isLow ? 'On the list' : 'Mark low'}</Text>
                </View>
                <Pressable onPress={() => askDate(i)} accessibilityLabel={`expiry date for ${i.name}`} hitSlop={6} style={s.calBtn}>
                  <Ionicons name="calendar-outline" size={18} color={i.expiresOn ? expiryColor(i.expiresOn) : C.faint} />
                </Pressable>
              </Pressable>
            </View>
          );
        })}
        <Pressable onPress={() => setAdding(true)} style={[s.row, { borderTopWidth: 1, borderTopColor: C.ruleSoft, marginTop: 8 }]}><Ionicons name="add" size={18} color={C.faint} /><Body size={15} color={C.faint}>Add a pantry item</Body></Pressable>
        <View style={s.note}><Ionicons name="information-circle-outline" size={15} color={C.faint} /><Body size={12.5} color={C.muted} style={{ flex: 1, lineHeight: 18 }}>Anything marked low stays on every list until it’s checked off in the store.</Body></View>
        <View style={{ height: 24 }} />
      </ScrollView>
      {adding && <AddPantry stores={Object.values(storeById)} onClose={() => setAdding(false)} onSaved={() => { qc.invalidateQueries({ queryKey: keys.ingredients }); setAdding(false); }} />}
      {dateFor && <DatePick title={dateFor.name} initial={dateFor.expiresOn} onClose={() => setDateFor(null)} onPick={(d) => { setExpiry.mutate({ id: dateFor.id, expiresOn: d }); setDateFor(null); }} />}
    </SafeAreaView>
  );
}

/** One picker for both platforms: iOS gets an inline calendar in a sheet with Done, Android its native dialog. */
function DatePick({ title, initial, onClose, onPick }: { title: string; initial?: string; onClose: () => void; onPick: (d: string) => void }) {
  const [value, setValue] = useState<Date>(initial ? toLocalDate(initial) : new Date());
  if (Platform.OS === 'android') {
    return <DateTimePicker value={value} mode="date" onChange={(e: DateTimePickerEvent, d?: Date) => { if (e.type === 'set' && d) onPick(toDateStr(d)); else onClose(); }} />;
  }
  return (
    <Modal transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(42,36,32,0.28)' }} onPress={onClose} />
      <View style={s.sheet}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 10 }}><Serif size={20} style={{ fontFamily: F.serifBold, flex: 1 }}>{title}</Serif><Body size={12.5} color={C.muted}>expires {shortDate(toDateStr(value))}</Body></View>
        <DateTimePicker value={value} mode="date" display="inline" accentColor={C.accent} onChange={(_e: DateTimePickerEvent, d?: Date) => { if (d) setValue(d); }} />
        <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
          <Pressable onPress={onClose} style={s.btn}><Body size={14} color="#4a423a" style={{ fontFamily: F.sansMed }}>Cancel</Body></Pressable>
          <Pressable onPress={() => onPick(toDateStr(value))} style={[s.btn, s.btnPrimary]}><Body size={14} color="#fff" style={{ fontFamily: F.sansBold }}>Done</Body></Pressable>
        </View>
      </View>
    </Modal>
  );
}

function AddPantry({ stores, onClose, onSaved }: { stores: Array<{ id: string; name: string; color: string }>; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(''); const [storeId, setStoreId] = useState(stores[0]?.id ?? ''); const [form, setForm] = useState<Form>('Dry Goods');
  const [expiresOn, setExpiresOn] = useState<string | null>(null); const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null); const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true); setError(null);
    try { await api.ingredients.create({ name: name.trim(), kind: 'pantry', storeId, form, ...(expiresOn ? { expiresOn } : {}) }); onSaved(); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }}>
          <Serif size={24} style={{ fontFamily: F.serifBold }}>New pantry item</Serif>
          <View style={{ gap: 6 }}><Body size={11.5} color={C.muted}>Name</Body><TextInput value={name} onChangeText={setName} placeholder="Jaggery" placeholderTextColor="#c0b7ab" autoFocus style={s.input} /></View>
          <View style={{ gap: 8 }}><Body size={11.5} color={C.muted}>Where do you buy it?</Body><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{stores.map((st) => <Pill key={st.id} label={st.name} dot={st.color} on={storeId === st.id} onPress={() => setStoreId(st.id)} />)}</View></View>
          <View style={{ gap: 8 }}><Body size={11.5} color={C.muted}>Aisle</Body><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{FORMS.map((f) => <Pill key={f} label={f} on={form === f} onPress={() => setForm(f)} />)}</View></View>
          <View style={{ gap: 8 }}><Body size={11.5} color={C.muted}>Expires on <Body size={11.5} color={C.faint}>(optional — a reminder to use it up)</Body></Body>
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
              <Pressable onPress={() => setPicking(true)} style={[s.btn, { flexDirection: 'row', gap: 8, alignItems: 'center' }]}><Ionicons name="calendar-outline" size={16} color={C.muted} /><Body size={14} color={expiresOn ? C.ink : C.faint}>{expiresOn ? shortDate(expiresOn) : 'Pick a date'}</Body></Pressable>
              {expiresOn && <Pressable onPress={() => setExpiresOn(null)} hitSlop={8}><Body size={13} color={C.muted}>Clear</Body></Pressable>}
            </View></View>
          <View style={{ padding: 14, borderRadius: 10, backgroundColor: C.accentSoft }}><Body size={13} color="#6b5327" style={{ lineHeight: 19 }}>No quantity needed. A pantry item never gets a computed amount — it goes on a list only when someone marks it low.</Body></View>
          {error && <Body color={C.red}>{error}</Body>}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Pressable onPress={onClose} style={s.btn}><Body size={14} color="#4a423a" style={{ fontFamily: F.sansMed }}>Cancel</Body></Pressable>
            <Pressable onPress={save} disabled={busy || !name.trim() || !storeId} style={[s.btn, s.btnPrimary, (busy || !name.trim()) && { opacity: 0.5 }]}><Body size={14} color="#fff" style={{ fontFamily: F.sansBold }}>Add</Body></Pressable>
          </View>
        </ScrollView>
        {picking && <DatePick title={name.trim() || 'New pantry item'} initial={expiresOn ?? undefined} onClose={() => setPicking(false)} onPick={(d) => { setExpiresOn(d); setPicking(false); }} />}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 13, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.rule },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 18, minHeight: 60 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 6, height: 44, paddingHorizontal: 15, borderRadius: 999, borderWidth: 1 },
  chipOn: { backgroundColor: C.amberSoft, borderColor: C.amberLine }, chipOff: { backgroundColor: C.surface, borderColor: C.fieldLine },
  note: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', marginHorizontal: 18, marginTop: 12, padding: 13, backgroundColor: C.surface, borderWidth: 1, borderColor: C.rule, borderRadius: 10 },
  input: { fontFamily: F.serif, fontSize: 18, color: C.ink, padding: 12, borderWidth: 1, borderColor: C.fieldLine, borderRadius: 8, backgroundColor: C.field },
  btn: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: C.fieldLine, backgroundColor: C.surface },
  btnPrimary: { backgroundColor: C.accent, borderColor: C.accent },
  calBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -10 },
  sheet: { backgroundColor: C.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34, gap: 14 },
});
