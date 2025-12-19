import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { useTheme } from '../context/ThemeContext';

const PRESET_COLORS = ['#2B8AEF', '#1F9A8C', '#E11D48', '#F59E0B', '#6B21A8'];

export default function ConfiguracionScreen() {
  const { COLORS, setPrimary } = useTheme();
  const [selected, setSelected] = useState(COLORS.primary);

  const apply = async () => {
    await setPrimary(selected);
  };

  return (
    <View style={styles.container}>
      <Header title="Configuración" />
      <Card style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Color primario</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {PRESET_COLORS.map(c => (
            <AppButton key={c} title={c === selected ? '✓' : ''} variant={c === selected ? 'filled' : 'ghost'} onPress={() => setSelected(c)} style={{ width: 56, height: 40, padding: 6, backgroundColor: c === selected ? c : 'transparent', borderRadius: 12, borderColor: c === selected ? 'transparent' : 'rgba(0,0,0,0.06)' }} />
          ))}
        </View>
        <View style={{ height: 12 }} />
        <AppButton title="Aplicar" onPress={apply} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 } });
