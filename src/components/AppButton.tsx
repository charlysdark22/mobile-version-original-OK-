import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';

export default function AppButton({ title, onPress, style, textStyle, variant = 'filled', disabled = false }: { title: string; onPress?: () => void; style?: ViewStyle; textStyle?: TextStyle; variant?: 'filled' | 'ghost'; disabled?: boolean }) {
  const { COLORS } = useTheme();
  const filled = variant === 'filled';
  const handlePress = () => {
    if (disabled) return;
    onPress?.();
  };
  return (
    <TouchableOpacity accessibilityState={{ disabled }} onPress={handlePress} style={[filled ? { backgroundColor: COLORS.primary, borderColor: 'rgba(0,0,0,0.06)' } : { backgroundColor: 'transparent', borderColor: COLORS.transparentBorder }, styles.base, { borderRadius: 22, borderWidth: 1, opacity: disabled ? 0.5 : 1 }, style]}>
      <Text style={[filled ? { color: '#fff' } : { color: COLORS.primary }, styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: { paddingVertical: 10, paddingHorizontal: 14, alignItems: 'center', justifyContent: 'center' },
  text: { fontWeight: '700' }
});
