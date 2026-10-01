import { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Mono, Serif, inputStyle } from '@/components/ui';
import { byExpiryThenName, expiryLabel, expiryStatus } from '@/lib/dates';
import { KIND_LABEL, counted } from '@/lib/recipes';
import { C, F } from '@/lib/theme';
import type { Ingredient, Store } from '@/lib/types';

const KIND_COLOR = { fresh: [C.green, C.greenSoft], weekly: ['#5b7cb8', '#eaeff7'], pantry: [C.accentInk, C.accentSoft] } as const;
export const KindChip = ({ kind }: { kind: Ingredient['kind'] }) => (
  <View style={{ paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: KIND_COLOR[kind][1] }}>
    <Text style={{ fontFamily: F.sansBold, fontSize: 9.5, letterSpacing: 0.5, textTransform: 'uppercase', color: KIND_COLOR[kind][0] }}>{KIND_LABEL[kind]}</Text>
  </View>
);
const expiryColor = (d: string) => ({ expired: C.red, soon: C.amber, later: C.faint })[expiryStatus(d).status];

/** Everything this house buys, searchable, with a + per row — the phone's version of the web's catalog table.
 *  Rows already on the recipe show "added" and can't be picked twice. */
export function Catalog({ ingredients, stores, added, onAdd, onNew }: { ingredients: Ingredient[]; stores: Store[]; added: Set<string>; onAdd: (i: Ingredient) => void; onNew?: () => void }) {
  const [search, setSearch] = useState('');
  const storeById = Object.fromEntries(stores.map((s) => [s.id, s]));
  const rows = ingredients.slice().sort(byExpiryThenName);
  const needle = search.trim().toLowerCase();
  const shown = needle ? rows.filter((i) => i.name.toLowerCase().includes(needle)) : rows;
  return (
    <View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 18, paddingVertical: 10 }}>
        <TextInput accessibilityLabel="search ingredients" placeholder="Search ingredients" placeholderTextColor="#c0b7ab" value={search} onChangeText={setSearch} style={[inputStyle, { flex: 1 }]} />
        {needle !== '' && <Mono size={12} color={C.faint}>{shown.length} of {rows.length}</Mono>}
      </View>
      {shown.length === 0 && <Body color={C.faint} style={{ paddingHorizontal: 18, paddingVertical: 12, fontFamily: F.serif, fontStyle: 'italic' }}>{needle ? `Nothing matches “${search.trim()}”.` : 'No ingredients yet.'}</Body>}
      {shown.map((i) => { const on = added.has(i.id); return (
        <Pressable key={i.id} onPress={() => !on && onAdd(i)} disabled={on} accessibilityRole="button" accessibilityLabel={on ? `${i.name}, added` : `add ${i.name}`} style={s.row}>
          <View style={{ width: 9, height: 9, borderRadius: 3, backgroundColor: storeById[i.storeId]?.color ?? '#ccc' }} />
          <View style={{ flex: 1, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}><Serif size={17}>{i.name}</Serif><KindChip kind={i.kind} /><Body size={11.5} color={C.faint}>{i.form} · {storeById[i.storeId]?.name ?? '—'}</Body></View>
            <Body size={12} color={C.muted} style={i.kind === 'pantry' ? { fontFamily: F.serif, fontStyle: 'italic' } : undefined}>{counted(i)}</Body>
            {i.expiresOn && <Text style={{ fontFamily: F.sansMed, fontSize: 11.5, color: expiryColor(i.expiresOn) }}>{expiryLabel(i.expiresOn)}</Text>}
          </View>
          {on ? <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Ionicons name="checkmark" size={14} color={C.greenInk} /><Body size={12.5} color={C.greenInk}>added</Body></View>
            : <View style={s.plus}><Ionicons name="add" size={18} color={C.accentInk} /></View>}
        </Pressable>); })}
      {onNew && <Pressable onPress={onNew} style={[s.row, { minHeight: 52 }]} accessibilityRole="button"><Ionicons name="add" size={18} color={C.faint} /><Body size={15} color={C.faint}>New ingredient…</Body></Pressable>}
    </View>
  );
}

/** The catalog as a sheet, for picking a line's ingredient. */
export function IngredientPicker({ ingredients, stores, added, onPick, onNew, onClose }: { ingredients: Ingredient[]; stores: Store[]; added: Set<string>; onPick: (i: Ingredient) => void; onNew: () => void; onClose: () => void }) {
  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 4 }}>
          <Serif size={22} style={{ fontFamily: F.serifBold, flex: 1 }}>Choose an ingredient</Serif>
          <Pressable onPress={onClose} accessibilityLabel="close" hitSlop={10}><Ionicons name="close" size={22} color={C.muted} /></Pressable>
        </View>
        <ScrollView keyboardShouldPersistTaps="handled"><Catalog ingredients={ingredients} stores={stores} added={added} onAdd={onPick} onNew={onNew} /><View style={{ height: 24 }} /></ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 10, minHeight: 60, borderTopWidth: 1, borderTopColor: C.ruleSoft },
  plus: { width: 36, height: 36, borderRadius: 999, borderWidth: 1, borderColor: C.fieldLine, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
});
