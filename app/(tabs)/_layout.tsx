import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const tabTitles = {
  index: '\u9996\u9875',
  details: '\u660e\u7ec6',
  statistics: '\u7edf\u8ba1',
  profile: '\u6211\u7684',
} as const;

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: tabTitles.index,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          title: tabTitles.details,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: tabTitles.statistics,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: tabTitles.profile,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
