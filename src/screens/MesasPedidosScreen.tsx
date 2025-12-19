import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

export default function MesasPedidosScreen({ route }: any) {
  const { COLORS } = useTheme();
  const localId = route?.params?.localId;
  const [selectedMesa, setSelectedMesa] = useState<number | null>(null);
  const [mesas] = useState([1, 2, 3, 4]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.title, { color: COLORS.text }]}>Mesas y Pedidos</Text>
        <Text style={[styles.subtitle, { color: COLORS.muted }]}>
          Gestión de consumos por mesa - Cafe Avellaneda
        </Text>
      </View>

      {/* Tables Grid */}
      <View style={styles.tablesGrid}>
        {mesas.map((mesa) => (
          <TouchableOpacity
            key={mesa}
            style={styles.tableCard}
            onPress={() => setSelectedMesa(mesa)}
          >
            <View style={styles.tableIcon}>
              <MaterialIcons name="restaurant" size={32} color="#9CA3AF" />
            </View>
            <Text style={styles.tableNumber}>Mesa {mesa}</Text>
            <Text style={styles.tableStatus}>Disponible</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Selection Message */}
      <Card style={styles.selectionCard}>
        <View style={styles.selectionIcon}>
          <MaterialIcons name="restaurant" size={64} color="#D1D5DB" />
        </View>
        <Text style={styles.selectionTitle}>Selecciona una mesa</Text>
        <Text style={styles.selectionText}>
          Elige una de las 4 mesas disponibles para comenzar a gestionar pedidos
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6fb',
    paddingBottom: 40,
  },
  headerSection: {
    marginBottom: 24
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 4
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400'
  },
  tablesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  tableCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  tableIcon: {
    marginBottom: 12
  },
  tableNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  tableStatus: {
    fontSize: 14,
    color: '#6B7280'
  },
  selectionCard: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 300
  },
  selectionIcon: {
    marginBottom: 24
  },
  selectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center'
  },
  selectionText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20
  }
});
