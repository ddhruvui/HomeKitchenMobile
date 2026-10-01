import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { Body, Mono, Pill, Serif, inputStyle } from '@/components/ui';
import { RecipeEditor } from '@/components/RecipeEditor';
import { useRecipes } from '@/lib/hooks';
import { filterRecipes, tagCounts, tagsOf } from '@/lib/recipes';
import { C, F } from '@/lib/theme';
import type { Recipe } from '@/lib/types';

export default function RecipesScreen() {
  const recipes = useRecipes();
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState<string | null>(null);
  /** null: the list. 'new' or a recipe: the editor sheet is open on it. */
  const [editing, setEditing] = useState<Recipe | 'new' | null>(null);
  const all = recipes.data ?? [];
  const tags = tagsOf(all);
  const counts = tagCounts(all);
  const shown = filterRecipes(all, search, tag);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.paper }} edges={['top']}>
      <View style={s.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}><Serif size={26} style={{ fontFamily: F.serifBold }}>Recipes</Serif><Body size={12.5} color={C.muted}><Mono size={12.5} color={C.muted}>{all.length}</Mono> in the book</Body></View>
          <Pressable onPress={() => setEditing('new')} accessibilityRole="button" style={s.newBtn}><Ionicons name="add" size={16} color="#fff" /><Body size={14} color="#fff" style={{ fontFamily: F.sansBold }}>New recipe</Body></Pressable>
        </View>
      </View>
      <View style={{ paddingHorizontal: 18, paddingTop: 12 }}>
        <TextInput accessibilityLabel="Search recipes" placeholder="Search recipes" placeholderTextColor="#c0b7ab" value={search} onChangeText={setSearch} style={inputStyle} />
      </View>
      {tags.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 8, paddingHorizontal: 18, paddingTop: 10, paddingBottom: 2 }}>
          {tags.map((t) => <Pill key={t} label={t} count={counts[t]} on={tag === t} onPress={() => setTag(tag === t ? null : t)} />)}
        </ScrollView>
      )}
      <ScrollView style={{ flex: 1 }} keyboardShouldPersistTaps="handled">
        {recipes.isLoading && <Body color={C.faint} style={{ padding: 24 }}>Loading…</Body>}
        {!recipes.isLoading && shown.length === 0 && <Body color={C.faint} style={{ padding: 24, fontFamily: F.serif, fontStyle: 'italic' }}>{all.length ? 'No recipes match.' : 'No recipes yet.'}</Body>}
        {shown.map((r) => (
          <Pressable key={r.id} onPress={() => setEditing(r)} accessibilityRole="button" style={s.row}>
            <View style={{ flex: 1, gap: 2 }}>
              <Serif size={18}>{r.title}</Serif>
              {r.tags.length > 0 && <Body size={12} color={C.faint}>{r.tags.join(' · ')}</Body>}
            </View>
            <Mono size={12} color={C.faint}>{r.ingredients.length}</Mono>
            <Ionicons name="chevron-forward" size={16} color={C.dim} />
          </Pressable>))}
        <View style={{ height: 24 }} />
      </ScrollView>
      {editing && <RecipeEditor recipe={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: { paddingHorizontal: 18, paddingTop: 4, paddingBottom: 13, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.rule },
  newBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 8, backgroundColor: C.accent },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 18, paddingVertical: 12, minHeight: 60, borderBottomWidth: 1, borderBottomColor: C.ruleSoft },
});
