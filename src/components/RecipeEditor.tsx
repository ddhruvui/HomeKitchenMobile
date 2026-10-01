import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useQueryClient } from '@tanstack/react-query';
import { Body, Btn, Chip, Label, Mono, Serif, inputStyle } from '@/components/ui';
import { Catalog, IngredientPicker, KindChip } from '@/components/Catalog';
import { IngredientForm } from '@/components/IngredientForm';
import { RecipeChat } from '@/components/RecipeChat';
import { api, errorMessage } from '@/lib/api';
import { UNIT_LABEL, unitsFor } from '@/lib/format';
import { keys, useIngredients, useStores } from '@/lib/hooks';
import { blankDraft, draftFrom, draftToBody, type LineDraft } from '@/lib/recipes';
import { C, F } from '@/lib/theme';
import type { Ingredient, Recipe } from '@/lib/types';

/** One half of the method: an ordered list of plain lines, edited in place. */
function StepsCard({ title, hint, placeholder, steps, onChange }: { title: string; hint: string; placeholder: string; steps: string[]; onChange: (s: string[]) => void }) {
  const move = (i: number, dir: -1 | 1) => { const s = steps.slice(); const j = i + dir; if (j < 0 || j >= s.length) return; [s[i], s[j]] = [s[j], s[i]]; onChange(s); };
  const label = title.toLowerCase();
  return (
    <View style={s.card}>
      <View style={s.cardHead}><Serif size={19} style={{ flex: 1 }}>{title}</Serif><Mono size={12} color={C.faint}>{steps.filter((x) => x.trim()).length} steps</Mono></View>
      <Body size={12.5} color={C.faint} style={{ fontFamily: F.serif, fontStyle: 'italic', paddingHorizontal: 16, paddingBottom: 6 }}>{hint}</Body>
      {steps.map((st, i) => (
        <View key={i} style={s.stepRow}>
          <View style={s.num}><Mono size={11} color={C.accentInk}>{i + 1}</Mono></View>
          <TextInput accessibilityLabel={`${label} step ${i + 1}`} multiline value={st} placeholder={placeholder} placeholderTextColor="#c0b7ab" onChangeText={(t) => onChange(steps.map((x, j) => (j === i ? t : x)))} style={[inputStyle, { flex: 1, minHeight: 40 }]} />
          <View style={{ gap: 2 }}>
            <Pressable accessibilityLabel="move up" hitSlop={6} onPress={() => move(i, -1)}><Ionicons name="chevron-up" size={16} color="#c0b7ab" /></Pressable>
            <Pressable accessibilityLabel="move down" hitSlop={6} onPress={() => move(i, 1)}><Ionicons name="chevron-down" size={16} color="#c0b7ab" /></Pressable>
          </View>
          <Pressable accessibilityLabel={`remove ${label} step`} hitSlop={8} onPress={() => onChange(steps.filter((_, j) => j !== i))}><Ionicons name="close" size={16} color="#c0b7ab" /></Pressable>
        </View>))}
      <Pressable onPress={() => onChange([...steps, ''])} style={s.addRow}><Ionicons name="add" size={16} color={C.faint} /><Body size={14} color={C.faint}>Add a {label} step</Body></Pressable>
    </View>
  );
}

/** Pick a line's ingredient, or the next line's: which line, if any, the sheet is choosing for. */
type Picking = { line: number | 'new' } | null;

/** Create or edit a recipe — everything the web's recipe page does, as a full-screen sheet. */
export function RecipeEditor({ recipe, onClose }: { recipe: Recipe | null; onClose: () => void }) {
  const ings = useIngredients(); const stores = useStores(); const qc = useQueryClient();
  const isNew = recipe === null;
  const [draft, setDraft] = useState(() => (recipe ? draftFrom(recipe) : blankDraft()));
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState<Picking>(null);
  const [newIngFor, setNewIngFor] = useState<Picking>(null);
  const byId = useMemo(() => Object.fromEntries((ings.data ?? []).map((i) => [i.id, i])), [ings.data]);
  const onRecipe = new Set(draft.lines.map((l) => l.ingredientId).filter(Boolean));

  const setLine = (i: number, patch: Partial<LineDraft>) => setDraft((d) => ({ ...d, lines: d.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const addLine = (id: string) => setDraft((d) => ({ ...d, lines: [...d.lines, { ingredientId: id, qty: '', unit: '', note: '' }] }));
  const choose = (target: Picking, ing: Ingredient) => { if (target?.line === 'new') addLine(ing.id); else if (target) setLine(target.line, { ingredientId: ing.id, unit: '' }); };

  async function save() {
    setBusy(true); setError(null);
    try {
      const body = draftToBody(draft);
      if (isNew) await api.recipes.create(body); else await api.recipes.update(recipe.id, body);
      await qc.invalidateQueries({ queryKey: keys.recipes }); qc.invalidateQueries({ queryKey: ['today'] });
      onClose();
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  function remove() {
    if (isNew) return;
    Alert.alert('Delete this recipe?', recipe.title, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await api.recipes.remove(recipe.id); qc.invalidateQueries({ queryKey: keys.recipes }); onClose(); } catch (e) { setError(errorMessage(e)); }
      } },
    ]);
  }

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }}>
        <View style={s.top}>
          <Serif size={22} style={{ fontFamily: F.serifBold, flex: 1 }}>{isNew ? 'New recipe' : 'Edit recipe'}</Serif>
          <Pressable onPress={onClose} accessibilityLabel="close" hitSlop={10}><Ionicons name="close" size={22} color={C.muted} /></Pressable>
        </View>
        <ScrollView contentContainerStyle={{ paddingVertical: 14, gap: 14 }} keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets>
          <View style={[s.card, { padding: 16, gap: 12 }]}>
            <View style={{ gap: 6 }}><Label>Title</Label><TextInput accessibilityLabel="Title" value={draft.title} onChangeText={(title) => setDraft((d) => ({ ...d, title }))} placeholder="Pav Bhaji" placeholderTextColor="#c0b7ab" style={[inputStyle, { fontFamily: F.serif, fontSize: 21 }]} /></View>
            <View style={{ gap: 6 }}><Label>Tags <Body size={11.5} color={C.faint}>(comma separated)</Body></Label><TextInput accessibilityLabel="Tags" autoCapitalize="none" value={draft.tagsText} onChangeText={(tagsText) => setDraft((d) => ({ ...d, tagsText }))} placeholder="veg, weeknight" placeholderTextColor="#c0b7ab" style={inputStyle} /></View>
            <Body size={12.5} color={C.faint} style={{ fontFamily: F.serif, fontStyle: 'italic', lineHeight: 18 }}>Amounts are for one meal, two people. Dinner doubles them; the household count scales the rest.</Body>
          </View>

          {isNew && <RecipeChat title={draft.title} />}

          <View style={s.card}>
            <View style={s.cardHead}><Serif size={19} style={{ flex: 1 }}>Ingredients</Serif><Mono size={12} color={C.faint}>{draft.lines.length}</Mono></View>
            {draft.lines.map((l, i) => { const ing: Ingredient | undefined = byId[l.ingredientId]; const pantry = ing?.kind === 'pantry'; return (
              <View key={i} style={[s.line, pantry && { backgroundColor: '#fdfcfa' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Pressable accessibilityLabel={`ingredient ${i + 1}`} onPress={() => setPicking({ line: i })} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Serif size={17} color={ing ? C.ink : C.faint}>{ing?.name ?? 'Choose…'}</Serif>
                    {ing && <KindChip kind={ing.kind} />}
                    <Ionicons name="chevron-down" size={14} color={C.faint} />
                  </Pressable>
                  <Pressable accessibilityLabel="remove line" hitSlop={8} onPress={() => setDraft((d) => ({ ...d, lines: d.lines.filter((_, j) => j !== i) }))}><Ionicons name="close" size={16} color="#c0b7ab" /></Pressable>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <TextInput accessibilityLabel="quantity" keyboardType="decimal-pad" value={l.qty} onChangeText={(qty) => setLine(i, { qty })} placeholder="qty" placeholderTextColor="#c0b7ab" style={[inputStyle, { fontFamily: F.mono, width: 72, color: pantry ? C.muted : C.ink }]} />
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 6, alignItems: 'center' }}>
                    {unitsFor(ing).map((u) => <Chip key={u} label={UNIT_LABEL[u]} on={l.unit === u} onPress={() => setLine(i, { unit: l.unit === u ? '' : u })} />)}
                  </ScrollView>
                </View>
                <TextInput accessibilityLabel="note" value={l.note} onChangeText={(note) => setLine(i, { note })} placeholder={pantry ? 'not counted — bought when low' : 'finely chopped'} placeholderTextColor="#c0b7ab" style={[inputStyle, { fontSize: 13.5, paddingVertical: 7 }]} />
              </View>); })}
            <Pressable onPress={() => setPicking({ line: 'new' })} style={s.addRow}><Ionicons name="add" size={16} color={C.faint} /><Body size={14} color={C.faint}>Add an ingredient</Body></Pressable>
          </View>

          <StepsCard title="Morning" hint="Hours ahead — soak, thaw, set the curd. Leave empty if there is nothing." placeholder="Soak the chana." steps={draft.morningSteps} onChange={(morningSteps) => setDraft((d) => ({ ...d, morningSteps }))} />
          <StepsCard title="Evening" hint="The cooking itself." placeholder="Boil the potatoes until soft." steps={draft.steps} onChange={(steps) => setDraft((d) => ({ ...d, steps }))} />

          {error && <View style={s.err}><Body color={C.red}>{error}</Body></View>}
          <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16 }}>
            {!isNew && <Btn danger label="Delete" onPress={remove} />}
            <View style={{ flex: 1 }} />
            <Btn label="Discard" onPress={onClose} />
            <Btn primary label={busy ? 'Saving…' : 'Save recipe'} disabled={busy || !draft.title.trim()} onPress={save} />
          </View>

          {isNew && (
            <View style={s.card}>
              <View style={s.cardHead}><Serif size={19} style={{ flex: 1 }}>Everything this house buys</Serif><Mono size={12} color={C.faint}>{ings.data?.length ?? 0}</Mono></View>
              <Body size={12.5} color={C.faint} style={{ fontFamily: F.serif, fontStyle: 'italic', paddingHorizontal: 16 }}>Tap + to add one, then set its amount above. Anything missing needs New ingredient first.</Body>
              <Catalog ingredients={ings.data ?? []} stores={stores.data ?? []} added={onRecipe} onAdd={(i) => addLine(i.id)} onNew={() => setNewIngFor({ line: 'new' })} />
            </View>)}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>

      {picking && <IngredientPicker
        ingredients={ings.data ?? []} stores={stores.data ?? []}
        added={new Set([...onRecipe].filter((id) => picking.line === 'new' || id !== draft.lines[picking.line]?.ingredientId))}
        onPick={(ing) => { choose(picking, ing); setPicking(null); }}
        onNew={() => { setNewIngFor(picking); setPicking(null); }}
        onClose={() => setPicking(null)} />}
      {newIngFor && <IngredientForm stores={stores.data ?? []} onClose={() => setNewIngFor(null)} onSaved={(ing) => { qc.invalidateQueries({ queryKey: keys.ingredients }); choose(newIngFor, ing); setNewIngFor(null); }} />}
    </Modal>
  );
}

const s = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, paddingTop: 16, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: C.rule, backgroundColor: C.surface },
  card: { marginHorizontal: 16, backgroundColor: C.surface, borderWidth: 1, borderColor: C.rule, borderRadius: 12, overflow: 'hidden' },
  cardHead: { flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 6 },
  line: { paddingHorizontal: 16, paddingVertical: 12, gap: 8, borderTopWidth: 1, borderTopColor: C.ruleSoft },
  stepRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingHorizontal: 16, paddingVertical: 8, borderTopWidth: 1, borderTopColor: C.ruleSoft },
  num: { width: 22, height: 22, borderRadius: 999, backgroundColor: C.soft, alignItems: 'center', justifyContent: 'center', marginTop: 9 },
  addRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.ruleSoft },
  err: { marginHorizontal: 16, padding: 12, borderRadius: 10, backgroundColor: C.redSoft },
});
