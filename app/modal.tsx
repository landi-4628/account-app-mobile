import { Link } from 'expo-router';
import { StyleSheet } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

const copy = {
  title: '\u8fd9\u662f\u4e00\u4e2a\u5f39\u7a97',
  backHome: '\u8fd4\u56de\u9996\u9875',
};

export default function ModalScreen() {
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">{copy.title}</ThemedText>
      <Link href="/" dismissTo style={styles.link}>
        <ThemedText type="link">{copy.backHome}</ThemedText>
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
