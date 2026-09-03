import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { C, F } from '@/lib/theme';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: C.accentInk, tabBarInactiveTintColor: C.faint, tabBarStyle: { backgroundColor: C.surface, borderTopColor: C.rule }, tabBarLabelStyle: { fontFamily: F.sansMed, fontSize: 11 } }}>
      <Tabs.Screen name="index" options={{ title: 'Shopping', tabBarIcon: ({ color, size }) => <Ionicons name="list-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="cook" options={{ title: 'Cook', tabBarIcon: ({ color, size }) => <Ionicons name="restaurant-outline" size={size} color={color} /> }} />
      <Tabs.Screen name="pantry" options={{ title: 'Pantry', tabBarIcon: ({ color, size }) => <Ionicons name="cube-outline" size={size} color={color} /> }} />
    </Tabs>
  );
}
