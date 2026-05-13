import Ionicons from '@expo/vector-icons/Ionicons';
import { Tabs } from 'expo-router';
import React from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

const TAB_TITLES = {
  index: '首页',
  details: '明细',
  statistics: '统计',
  profile: '我的',
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
          title: TAB_TITLES.index,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="details"
        options={{
          title: TAB_TITLES.details,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="list" color={color} />,
        }}
      />
      <Tabs.Screen
        name="statistics"
        options={{
          title: TAB_TITLES.statistics,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="bar-chart" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: TAB_TITLES.profile,
          tabBarIcon: ({ color }) => <Ionicons size={24} name="person" color={color} />,
        }}
      />
    </Tabs>
  );
}
