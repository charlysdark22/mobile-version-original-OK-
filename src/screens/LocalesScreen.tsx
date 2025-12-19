import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function LocalesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Locales (placeholder)</Text>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, alignItems: 'center', justifyContent: 'center' }, title: { fontSize: 18, fontWeight: '700' } });