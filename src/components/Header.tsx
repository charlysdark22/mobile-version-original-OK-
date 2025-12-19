import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';
import NavigationMenu from './NavigationMenu';

export default function Header({ title, showBack, onBack }: { 
  title: string; 
  showBack?: boolean;
  onBack?: () => void;
}) {
  const { COLORS } = useTheme();
  return (
    <View style={styles.container}>
      <NavigationMenu />
      {showBack && onBack && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
      )}
      <Text style={[styles.title, { color: COLORS.text }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    paddingVertical: 12, 
    paddingHorizontal: 16, 
    backgroundColor: 'transparent',
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56
  },
  title: { 
    fontSize: 20, 
    fontWeight: '800',
    marginLeft: 8,
    flex: 1
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  }
});
