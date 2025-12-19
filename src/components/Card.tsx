import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { METRICS, COLORS } = useTheme();
  return <View style={[styles.card, { backgroundColor: COLORS.surface, borderColor: COLORS.transparentBorder, padding: METRICS.cardPadding }, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2
  }
});
