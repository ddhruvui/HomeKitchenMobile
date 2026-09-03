import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';
import { C, F } from '@/lib/theme';

export const Eyebrow = ({ children, color = C.faint }: { children: ReactNode; color?: string }) => (
  <Text style={{ fontFamily: F.sansBold, fontSize: 10.5, letterSpacing: 1, textTransform: 'uppercase', color }}>{children}</Text>
);
export const Serif = ({ children, size = 18, color = C.ink, style }: { children: ReactNode; size?: number; color?: string; style?: object }) => (
  <Text style={[{ fontFamily: F.serif, fontSize: size, color }, style]}>{children}</Text>
);
export const Mono = ({ children, size = 16, color = C.ink, style }: { children: ReactNode; size?: number; color?: string; style?: object }) => (
  <Text style={[{ fontFamily: F.mono, fontSize: size, color }, style]}>{children}</Text>
);
export const Body = ({ children, size = 14, color = C.ink, style }: { children: ReactNode; size?: number; color?: string; style?: object }) => (
  <Text style={[{ fontFamily: F.sans, fontSize: size, color }, style]}>{children}</Text>
);
export function Pill({ label, on, onPress, dot, count }: { label: string; on?: boolean; onPress?: () => void; dot?: string; count?: number }) {
  return (
    <Pressable onPress={onPress} style={[s.pill, on && s.pillOn]} accessibilityRole="button" accessibilityState={{ selected: !!on }}>
      {dot && <View style={[s.dot, { backgroundColor: dot }]} />}
      <Text style={{ fontFamily: on ? F.sansBold : F.sansMed, fontSize: 13, color: on ? '#fff' : '#4a423a' }}>{label}</Text>
      {count !== undefined && <Text style={{ fontFamily: F.mono, fontSize: 11.5, color: on ? '#c9bfb2' : C.faint }}>{count}</Text>}
    </Pressable>
  );
}
export function Stepper({ value, onChange, min = 1, max = 12 }: { value: number; onChange: (v: number) => void; min?: number; max?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
      <Pressable accessibilityLabel="fewer" onPress={() => onChange(Math.max(min, value - 1))} style={s.stepBtn}><Text style={{ color: C.muted, fontSize: 18, lineHeight: 20 }}>−</Text></Pressable>
      <Mono>{value}</Mono>
      <Pressable accessibilityLabel="more" onPress={() => onChange(Math.min(max, value + 1))} style={s.stepBtn}><Text style={{ color: C.muted, fontSize: 18, lineHeight: 20 }}>+</Text></Pressable>
    </View>
  );
}
export const Box = ({ on, color = C.green }: { on: boolean; color?: string }) => (
  <View style={[s.box, on && { backgroundColor: color, borderColor: color }]}>{on && <Text style={{ color: '#fff', fontSize: 13, lineHeight: 16, fontFamily: F.sansBold }}>✓</Text>}</View>
);
export const Section = ({ label, color = C.faint, style }: { label: string; color?: string; style?: ViewStyle }) => (
  <View style={[{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: 6 }, style]}><Eyebrow color={color}>{label}</Eyebrow></View>
);

const s = StyleSheet.create({
  pill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12, paddingHorizontal: 13, borderRadius: 999, borderWidth: 1, borderColor: C.fieldLine, backgroundColor: C.surface },
  pillOn: { backgroundColor: C.ink, borderColor: C.ink },
  dot: { width: 8, height: 8, borderRadius: 2 },
  stepBtn: { width: 36, height: 36, borderRadius: 999, borderWidth: 1, borderColor: C.fieldLine, alignItems: 'center', justifyContent: 'center' },
  box: { width: 24, height: 24, borderRadius: 7, borderWidth: 1.8, borderColor: C.box, alignItems: 'center', justifyContent: 'center' },
});
