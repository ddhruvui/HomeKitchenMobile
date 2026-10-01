import { useState } from 'react';
import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Body, Serif } from '@/components/ui';
import { C, F } from '@/lib/theme';
import { shortDate, toDateStr, toLocalDate } from '@/lib/dates';

/** One picker for both platforms: iOS gets an inline calendar in a sheet with Done, Android its native dialog. */
export function DatePick({ title, initial, onClose, onPick }: { title: string; initial?: string; onClose: () => void; onPick: (d: string) => void }) {
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

const s = StyleSheet.create({
  btn: { paddingVertical: 11, paddingHorizontal: 18, borderRadius: 8, borderWidth: 1, borderColor: C.fieldLine, backgroundColor: C.surface },
  btnPrimary: { backgroundColor: C.accent, borderColor: C.accent },
  sheet: { backgroundColor: C.paper, borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 20, paddingBottom: 34, gap: 14 },
});
