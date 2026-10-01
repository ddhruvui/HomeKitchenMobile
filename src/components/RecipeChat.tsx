import { useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Body, Btn, Chip, Mono, Serif, inputStyle } from '@/components/ui';
import { api, errorMessage } from '@/lib/api';
import { C, F } from '@/lib/theme';
import type { ChatTurn } from '@/lib/types';

/** What answered is display-only: the backend's fallback chain means it varies per turn, and only role and text go back up. */
type Turn = ChatTurn & { model?: string };

/** Same openers as the web, in the order a recipe gets written. Static — a chip is not worth one of the free tier's 20 requests. */
const SUGGESTIONS = (dish: string) => [`What do I need for ${dish}?`, `How do I make ${dish}?`, 'How long does it take?', 'Can I make any of it ahead?'];

/** A conversation about the dish, beside the editor. Nothing it says reaches the recipe except by your typing it in,
 *  and nothing is stored: the turns live in this component and go up whole on every question. */
export function RecipeChat({ title }: { title: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask(conversation: Turn[]) {
    setBusy(true); setError(null);
    try {
      const { reply, model } = await api.ai.chat(conversation.map(({ role, text: t }) => ({ role, text: t })));
      setTurns([...conversation, { role: 'model', text: reply, model }]);
    } catch (e) { setError(errorMessage(e)); } finally { setBusy(false); }
  }
  function ask1(question: string) {
    if (busy) return;
    const next: Turn[] = [...turns, { role: 'user', text: question }];
    setTurns(next); setText(''); ask(next);
  }

  const dish = title.trim() || 'pav bhaji';
  const asked = new Set(turns.filter((t) => t.role === 'user').map((t) => t.text));
  const suggestions = SUGGESTIONS(dish).filter((q) => !asked.has(q)).slice(0, 3);

  return (
    <View style={s.card}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Serif size={19} style={{ flex: 1 }}>Ask about the dish</Serif>
        {turns.length > 0 && <Btn small label="Start over" onPress={() => { setTurns([]); setError(null); }} />}
      </View>
      <Body size={12.5} color={C.faint} style={{ fontFamily: F.serif, fontStyle: 'italic', lineHeight: 18 }}>Gemini answers in this house’s units, for two people, using your catalog’s names where it can. Nothing it says is written down — copy what you want into the recipe.</Body>
      {turns.map((t, i) => (
        <View key={i} style={{ gap: 3, alignItems: t.role === 'user' ? 'flex-end' : 'flex-start' }}>
          <Mono size={10.5} color={C.faint}>{t.role === 'user' ? 'YOU' : t.model ? `GEMINI · ${t.model}` : 'GEMINI'}</Mono>
          <View style={[s.bubble, t.role === 'user' ? s.mine : s.theirs]}>
            <Body size={14} style={{ lineHeight: 21, fontFamily: t.role === 'user' ? F.sans : F.serif }}>{t.text}</Body>
          </View>
        </View>))}
      {busy && <Body size={12.5} color={C.faint}>Asking Gemini…</Body>}
      {suggestions.length > 0 && !busy && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>{suggestions.map((q) => <Chip key={q} label={q} onPress={() => ask1(q)} />)}</View>}
      {error && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Body color={C.red} style={{ flex: 1 }}>{error}</Body>
          {turns.length > 0 && turns[turns.length - 1].role === 'user' && <Btn small label="Retry" disabled={busy} onPress={() => ask(turns)} />}
        </View>)}
      <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-end' }}>
        <TextInput accessibilityLabel="ask about the dish" multiline value={text} onChangeText={setText} placeholder={turns.length ? 'Ask a follow-up…' : `How do I make ${dish}?`} placeholderTextColor="#c0b7ab" style={[inputStyle, { flex: 1, minHeight: 44 }]} />
        <Btn primary label={busy ? 'Asking…' : 'Ask'} disabled={busy || !text.trim()} onPress={() => { const q = text.trim(); if (q) ask1(q); }} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  card: { marginHorizontal: 16, padding: 16, gap: 12, backgroundColor: C.surface, borderWidth: 1, borderColor: C.rule, borderRadius: 12 },
  bubble: { maxWidth: '88%', paddingVertical: 9, paddingHorizontal: 13, borderRadius: 10 },
  mine: { backgroundColor: C.soft }, theirs: { backgroundColor: C.paper, borderWidth: 1, borderColor: C.ruleSoft },
});
