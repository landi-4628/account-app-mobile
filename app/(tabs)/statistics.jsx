import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function StatisticsScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">统计</ThemedText>
      <ThemedText>收支统计占位页</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
});
