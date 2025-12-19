import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { obtenerLocal, cargarDatos } from '../utils/storage';

export default function AlmacenLocalScreen({ route }: any) {
  const { COLORS } = useTheme();
  const localId = route?.params?.localId;
  const [localName, setLocalName] = useState<string>('');
  const [inventario, setInventario] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!localId) return;
    
    const local = await obtenerLocal(localId);
    if (!local) return;
    
    setLocalName(local.nombre);
    
    const datos = await cargarDatos();
    
    // Get central stock for each product
    const inventarioCompleto = local.almacen.map(p => {
      const centralProduct = datos.almacenCentral.find(cp => 
        cp.nombre === p.nombre && cp.categoria === p.categoria
      );
      return {
        ...p,
        stockCentral: centralProduct?.cantidad || 0
      };
    });
    
    setInventario(inventarioCompleto);
  }, [localId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Refresh when route params change
  useEffect(() => {
    if (route?.params?._refresh) {
      loadData();
    }
  }, [route?.params?._refresh, loadData]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={[styles.headerIcon, { backgroundColor: '#e8f5e9' }]}>
          <MaterialIcons name="inventory" size={32} color="#22C55E" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: COLORS.text }]}>Almacén de Local</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>
            {localName ? `Inventario de ${localName}` : 'Inventario del local'}
          </Text>
        </View>
      </View>

      {/* Inventory Table */}
      <Card style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProducto]}>Producto</Text>
              <Text style={[styles.tableHeaderText, styles.colStockLocal]}>Stock Local</Text>
              <Text style={[styles.tableHeaderText, styles.colStockCentral]}>Stock Central</Text>
              <Text style={[styles.tableHeaderText, styles.colUnidad]}>Unidad</Text>
              <Text style={[styles.tableHeaderText, styles.colPrecio]}>Precio Unit.</Text>
              <Text style={[styles.tableHeaderText, styles.colValor]}>Valor Total</Text>
              <Text style={[styles.tableHeaderText, styles.colEstado]}>Estado</Text>
            </View>
            
            {inventario.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialIcons name="inventory" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No hay productos en inventario</Text>
                <Text style={styles.emptySubtext}>
                  Suministra productos desde el Almacén Central para comenzar
                </Text>
              </View>
            ) : (
              inventario.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.colProducto, { flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={[
                      styles.productIcon,
                      { backgroundColor: item.categoria === 'cocina' ? '#fff3e0' : '#e3f2fd' }
                    ]}>
                      <MaterialIcons 
                        name="inventory" 
                        size={14} 
                        color={item.categoria === 'cocina' ? '#f39c12' : '#3498db'} 
                      />
                    </View>
                    <Text style={[styles.tableCellText, { flexShrink: 1 }]} numberOfLines={1}>{item.nombre}</Text>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colStockLocal]}>
                    {item.cantidad.toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colStockCentral]}>
                    {item.stockCentral.toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colUnidad]}>
                    {item.unidad}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colPrecio]}>
                    ${item.precioUnitario.toFixed(2)}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colValor]}>
                    ${(item.cantidad * item.precioUnitario).toFixed(2)}
                  </Text>
                  <View style={[styles.tableCell, styles.colEstado]}>
                    <View style={[
                      styles.statusBadge,
                      item.cantidad <= 5 ? styles.statusBadgeWarning : styles.statusBadgeOk
                    ]}>
                      <Text style={[
                        styles.statusText,
                        item.cantidad <= 5 ? styles.statusTextWarning : styles.statusTextOk
                      ]}>
                        {item.cantidad <= 5 ? 'Bajo' : 'OK'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </Card>

      {/* Summary Card */}
      {inventario.length > 0 && (
        <Card style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen</Text>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Productos</Text>
              <Text style={styles.summaryValue}>{inventario.length}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Valor Total</Text>
              <Text style={styles.summaryValue}>
                ${inventario.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0).toFixed(2)}
              </Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Bajo Stock</Text>
              <Text style={[styles.summaryValue, { color: '#f39c12' }]}>
                {inventario.filter(p => p.cantidad <= 5).length}
              </Text>
            </View>
          </View>
        </Card>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f4f6fb',
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16
  },
  headerText: {
    flex: 1
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
  tableCard: {
    padding: 0,
    marginBottom: 20,
    overflow: 'hidden'
  },
  tableWrapper: {
    minWidth: 800,
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#F9FAFB'
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  colProducto: { width: 180, paddingRight: 12 },
  colStockLocal: { width: 110, paddingRight: 12 },
  colStockCentral: { width: 120, paddingRight: 12 },
  colUnidad: { width: 80, paddingRight: 12 },
  colPrecio: { width: 110, paddingRight: 12 },
  colValor: { width: 120, paddingRight: 12 },
  colEstado: { width: 80, paddingRight: 16 },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
    alignItems: 'center',
    minHeight: 60
  },
  tableCell: {
    justifyContent: 'center',
    paddingRight: 12
  },
  tableCellText: {
    fontSize: 13,
    color: '#1F2937'
  },
  productIcon: {
    width: 22,
    height: 22,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    flexShrink: 0
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start'
  },
  statusBadgeOk: {
    backgroundColor: '#e8f5e9'
  },
  statusBadgeWarning: {
    backgroundColor: '#fff3e0'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600'
  },
  statusTextOk: {
    color: '#22C55E'
  },
  statusTextWarning: {
    color: '#f39c12'
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center'
  },
  summaryCard: {
    padding: 20,
    marginBottom: 20
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center'
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937'
  }
});
