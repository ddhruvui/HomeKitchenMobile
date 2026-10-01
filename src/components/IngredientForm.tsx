import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Btn, Chip, Label, Pill, Serif, inputStyle } from '@/components/ui';
import { DatePick } from '@/components/DatePick';
import { api, errorMessage, type IngredientInput } from '@/lib/api';
import { COUNT_UNITS, UNIT_LABEL, VOLUME_UNITS, WEIGHT_UNITS } from '@/lib/format';
import { shortDate } from '@/lib/dates';
import { C, F } from '@/lib/theme';
import { FORMS, type CountUnit, type Form, type Ingredient, type IngredientKind, type Store, type Unit } from '@/lib/types';

const KINDS: Array<[IngredientKind, string, string]> = [
  ['fresh', 'Fresh', 'Bought in the amount the week’s recipes need'],
  ['weekly', 'Weekly', 'The same amount every week, recipes or not'],
  ['pantry', 'Pantry', 'Bought in bulk, only when you mark it low'],
];
const ALL: Unit[] = [...WEIGHT_UNITS, ...VOLUME_UNITS, ...COUNT_UNITS];
const num = (s: string) => (s.trim() === '' ? undefined : Number(s.trim().replace(',', '.')));

/** A new catalog ingredient from inside the recipe editor — the phone's version of the web's ingredient dialog. */
export function IngredientForm({ stores, onClose, onSaved }: { stores: Store[]; onClose: () => void; onSaved: (i: Ingredient) => void }) {
  const [name, setName] = useState('');
  const [kind, setKind] = useState<IngredientKind>('pantry');
  const [storeId, setStoreId] = useState(stores[0]?.id ?? '');
  const [form, setForm] = useState<Form>('Veggies');
  const [weeklyQty, setWeeklyQty] = useState('1');
  const [buyUnit, setBuyUnit] = useState<Unit>('each');
  const [stockUnit, setStockUnit] = useState<Unit | ''>('');
  const [countUnit, setCountUnit] = useState<CountUnit | ''>('each');
  const [ozPerCup, setOzPerCup] = useState('');
  const [ozPerCount, setOzPerCount] = useState('');
  const [expiresOn, setExpiresOn] = useState<string | null>(null); const [picking, setPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true); setError(null);
    const body: IngredientInput = { name: name.trim(), kind, storeId, form };
    if (kind === 'weekly') body.weeklyQty = num(weeklyQty);
    if (kind === 'pantry' && expiresOn) body.expiresOn = expiresOn;
    if (kind === 'fresh') {
      body.buyUnit = buyUnit; body.stockUnit = stockUnit || buyUnit;
      const cu = countUnit || (COUNT_UNITS.includes(buyUnit as CountUnit) ? (buyUnit as CountUnit) : undefined);
      if (cu) body.countUnit = cu;
      if (num(ozPerCup)) body.ozPerCup = num(ozPerCup);
      if (num(ozPerCount)) body.ozPerCount = num(ozPerCount);
    }
    try { onSaved(await api.ingredients.create(body)); } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }

  const units = (value: string, set: (u: Unit) => void, opts: Unit[]) => (
    <View style={s.wrap}>{opts.map((u) => <Chip key={u} label={UNIT_LABEL[u]} on={value === u} onPress={() => set(u)} />)}</View>
  );

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
        <ScrollView contentContainerStyle={{ padding: 20, gap: 18 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <Serif size={24} style={{ fontFamily: F.serifBold }}>New ingredient</Serif>
          <View style={{ gap: 6 }}><Label>Name</Label><TextInput value={name} onChangeText={setName} placeholder={kind === 'pantry' ? 'Basmati Rice' : kind === 'weekly' ? 'Milk' : 'Yellow Onion'} placeholderTextColor="#c0b7ab" autoFocus style={[inputStyle, { fontFamily: F.serif, fontSize: 18 }]} /></View>
          <View style={{ gap: 8 }}><Label>What kind is it?</Label>
            {KINDS.map(([k, t, d]) => (
              <Pressable key={k} onPress={() => setKind(k)} accessibilityRole="button" accessibilityState={{ selected: kind === k }} style={[s.kind, kind === k && s.kindOn]}>
                <Body style={{ fontFamily: F.sansBold }}>{t}</Body><Body size={12.5} color={C.muted}>{d}</Body>
              </Pressable>))}
          </View>
          <View style={{ gap: 8 }}><Label>Where do you buy it?</Label>
            {stores.length === 0 ? <Body color={C.red}>Add a store first.</Body> : <View style={s.wrap}>{stores.map((st) => <Pill key={st.id} label={st.name} dot={st.color} on={storeId === st.id} onPress={() => setStoreId(st.id)} />)}</View>}
          </View>
          <View style={{ gap: 8 }}><Label>Aisle</Label><View style={s.wrap}>{FORMS.map((f) => <Chip key={f} label={f} on={form === f} onPress={() => setForm(f)} />)}</View></View>

          {kind === 'pantry' && <>
            <View style={s.note}><Body size={13} color="#6b5327" style={{ lineHeight: 19 }}>No quantity needed. A pantry item never gets a computed amount. It goes on a list only when someone marks it low, and comes off when it is checked in the store.</Body></View>
            <View style={{ gap: 8 }}><Label>Expires on <Body size={11.5} color={C.faint}>(optional)</Body></Label>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
                <Pressable onPress={() => setPicking(true)} style={[s.dateBtn]}><Ionicons name="calendar-outline" size={16} color={C.muted} /><Body size={14} color={expiresOn ? C.ink : C.faint}>{expiresOn ? shortDate(expiresOn) : 'Pick a date'}</Body></Pressable>
                {expiresOn && <Pressable onPress={() => setExpiresOn(null)} hitSlop={8}><Body size={13} color={C.muted}>Clear</Body></Pressable>}
              </View></View>
          </>}
          {kind === 'weekly' && <View style={{ gap: 6 }}><Label>How many every week, for two people</Label><TextInput value={weeklyQty} onChangeText={setWeeklyQty} keyboardType="number-pad" style={[inputStyle, { fontFamily: F.mono, width: 120 }]} /></View>}
          {kind === 'fresh' && <>
            <View style={{ gap: 8 }}><Label>Bought by</Label>{units(buyUnit, (u) => { setBuyUnit(u); if (COUNT_UNITS.includes(u as CountUnit)) setCountUnit(u as CountUnit); }, ALL)}</View>
            <View style={{ gap: 8 }}><Label>Counted in the fridge as</Label>
              <View style={s.wrap}><Chip label="same as bought" on={stockUnit === ''} onPress={() => setStockUnit('')} />{ALL.map((u) => <Chip key={u} label={UNIT_LABEL[u]} on={stockUnit === u} onPress={() => setStockUnit(u)} />)}</View></View>
            <View style={{ gap: 8 }}><Label>Count unit</Label>
              <View style={s.wrap}><Chip label="none" on={countUnit === ''} onPress={() => setCountUnit('')} />{COUNT_UNITS.map((u) => <Chip key={u} label={u} on={countUnit === u} onPress={() => setCountUnit(u)} />)}</View></View>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1, gap: 6 }}><Label>oz per cup</Label><TextInput value={ozPerCup} onChangeText={setOzPerCup} keyboardType="decimal-pad" placeholder="estimate later" placeholderTextColor="#c0b7ab" style={[inputStyle, { fontFamily: F.mono }]} /></View>
              <View style={{ flex: 1, gap: 6 }}><Label>oz per {countUnit || 'count'}</Label><TextInput value={ozPerCount} onChangeText={setOzPerCount} keyboardType="decimal-pad" placeholder="estimate later" placeholderTextColor="#c0b7ab" style={[inputStyle, { fontFamily: F.mono }]} /></View>
            </View>
          </>}
          {error && <Body color={C.red}>{error}</Body>}
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Btn label="Cancel" onPress={onClose} />
            <Btn label="Add ingredient" primary disabled={busy || !name.trim() || !storeId} onPress={save} />
          </View>
        </ScrollView>
        {picking && <DatePick title={name.trim() || 'New ingredient'} initial={expiresOn ?? undefined} onClose={() => setPicking(false)} onPick={(d) => { setExpiresOn(d); setPicking(false); }} />}
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  kind: { padding: 12, borderRadius: 10, borderWidth: 1, borderColor: C.fieldLine, backgroundColor: C.surface, gap: 2 },
  kindOn: { borderColor: C.accent, backgroundColor: C.accentSoft },
  note: { padding: 14, borderRadius: 10, backgroundColor: C.accentSoft },
  dateBtn: { flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 11, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: C.fieldLine, backgroundColor: C.surface },
});
