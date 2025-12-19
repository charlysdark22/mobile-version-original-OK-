import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import Card from '../components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { obtenerLocal, cargarDatos } from '../utils/storage';

type Periodo = 'hoy' | 'semana' | 'mes';

export default function CocinaScreen({ route }: any) {
  const { COLORS } = useTheme();
  const localId = route?.params?.localId;
  const [periodo, setPeriodo] = useState<Periodo>('hoy');
  const [metrics, setMetrics] = useState({
    entradas: 0,
    consumos: 0,
    stockActual: 0,
    bajoStock: 0
  });
  const [inventario, setInventario] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    if (!localId) return;
    
    const local = await obtenerLocal(localId);
    if (!local) return;
    
    const datos = await cargarDatos();
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    let fechaInicio = new Date(hoy);
    if (periodo === 'semana') {
      fechaInicio.setDate(hoy.getDate() - 7);
    } else if (periodo === 'mes') {
      fechaInicio.setMonth(hoy.getMonth() - 1);
    }
    
    // Filter movements for this local and period
    const movimientos = datos.movimientos || [];
    const movimientosPeriodo = movimientos.filter(m => {
      const fechaMov = new Date(m.fecha);
      return fechaMov >= fechaInicio && m.destino === local.nombre;
    });
    
    // Calculate metrics
    const entradas = movimientosPeriodo
      .filter(m => m.tipo === 'suministro' || m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.cantidad, 0);
    
    const consumos = movimientosPeriodo
      .filter(m => m.tipo === 'consumo')
      .reduce((sum, m) => sum + m.cantidad, 0);
    
    // Get kitchen products from local inventory
    const productosCocina = local.almacen.filter(p => p.categoria === 'cocina');
    const stockActual = productosCocina.reduce((sum, p) => sum + p.cantidad, 0);
    const bajoStock = productosCocina.filter(p => p.cantidad <= 5).length;
    
    setMetrics({ entradas, consumos, stockActual, bajoStock });
    
    // Get central stock for each product
    const inventarioCompleto = productosCocina.map(p => {
      const centralProduct = datos.almacenCentral.find(cp => 
        cp.nombre === p.nombre && cp.categoria === 'cocina'
      );
      return {
        ...p,
        stockCentral: centralProduct?.cantidad || 0
      };
    });
    
    setInventario(inventarioCompleto);
  }, [localId, periodo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={[styles.headerIcon, { backgroundColor: '#fff3e0' }]}>
          <MaterialIcons name="restaurant-menu" size={32} color="#f39c12" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: COLORS.text }]}>Cocina - Cafe Avellaneda</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>Reportes e inventario de cocina</Text>
        </View>
      </View>

      {/* Period Selection */}
      <View style={styles.periodSection}>
        <Text style={styles.periodLabel}>Periodo:</Text>
        <View style={styles.periodButtons}>
          <TouchableOpacity
            onPress={() => setPeriodo('hoy')}
            style={[
              styles.periodButton,
              periodo === 'hoy' && styles.periodButtonActive
            ]}
          >
            <Text style={[
              styles.periodButtonText,
              periodo === 'hoy' && styles.periodButtonTextActive
            ]}>Hoy</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriodo('semana')}
            style={[
              styles.periodButton,
              periodo === 'semana' && styles.periodButtonActive
            ]}
          >
            <Text style={[
              styles.periodButtonText,
              periodo === 'semana' && styles.periodButtonTextActive
            ]}>Última Semana</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setPeriodo('mes')}
            style={[
              styles.periodButton,
              periodo === 'mes' && styles.periodButtonActive
            ]}
          >
            <Text style={[
              styles.periodButtonText,
              periodo === 'mes' && styles.periodButtonTextActive
            ]}>Último Mes</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Metrics Cards */}
      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#e8f5e9' }]}>
            <MaterialIcons name="trending-up" size={24} color="#22C55E" />
          </View>
          <Text style={styles.metricLabel}>Entradas</Text>
          <Text style={styles.metricValue}>{metrics.entradas.toFixed(2)} unidades</Text>
        </Card>
        
        <Card style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#ffebee' }]}>
            <MaterialIcons name="trending-down" size={24} color="#EF4444" />
          </View>
          <Text style={styles.metricLabel}>Consumos</Text>
          <Text style={styles.metricValue}>{metrics.consumos.toFixed(2)} unidades</Text>
        </Card>
      </View>

      <View style={styles.metricsRow}>
        <Card style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#e3f2fd' }]}>
            <MaterialIcons name="inventory" size={24} color="#3498db" />
          </View>
          <Text style={styles.metricLabel}>Stock Actual</Text>
          <Text style={styles.metricValue}>{metrics.stockActual.toFixed(2)} unidades</Text>
        </Card>
        
        <Card style={styles.metricCard}>
          <View style={[styles.metricIcon, { backgroundColor: '#fff3e0' }]}>
            <MaterialIcons name="warning" size={24} color="#f39c12" />
          </View>
          <Text style={styles.metricLabel}>Bajo Stock</Text>
          <Text style={styles.metricValue}>{metrics.bajoStock} productos</Text>
        </Card>
      </View>

      {/* Inventory Table */}
      <Card style={styles.inventoryCard}>
        <View style={styles.inventoryHeader}>
          <Text style={styles.inventoryTitle}>Inventario de Cocina - Local</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProducto]}>Producto</Text>
              <Text style={[styles.tableHeaderText, styles.colStockLocal]}>Stock Local</Text>
              <Text style={[styles.tableHeaderText, styles.colStockCentral]}>Stock Central</Text>
              <Text style={[styles.tableHeaderText, styles.colUnidad]}>Unidad</Text>
              <Text style={[styles.tableHeaderText, styles.colEstado]}>Estado</Text>
            </View>
            
            {inventario.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay productos en inventario</Text>
              </View>
            ) : (
              inventario.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colProducto]} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colStockLocal]}>{item.cantidad.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colStockCentral]}>{item.stockCentral.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colUnidad]}>{item.unidad}</Text>
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
  periodSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  periodLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 12
  },
  periodButtons: {
    flexDirection: 'row',
    gap: 8
  },
  periodButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  periodButtonActive: {
    backgroundColor: '#f39c12',
    borderColor: '#f39c12'
  },
  periodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  periodButtonTextActive: {
    color: '#fff'
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12
  },
  metricCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center'
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280'
  },
  inventoryCard: {
    padding: 0,
    marginTop: 20,
    overflow: 'hidden'
  },
  inventoryHeader: {
    backgroundColor: '#fff3e0',
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16
  },
  inventoryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937'
  },
  tableWrapper: {
    minWidth: 600,
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
  colStockLocal: { width: 100, paddingRight: 12 },
  colStockCentral: { width: 110, paddingRight: 12 },
  colUnidad: { width: 80, paddingRight: 12 },
  colEstado: { width: 80, paddingRight: 16 },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#fff',
    alignItems: 'center',
    minHeight: 56
  },
  tableCell: {
    justifyContent: 'center',
    paddingRight: 12
  },
  tableCellText: {
    fontSize: 13,
    color: '#1F2937'
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
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff'
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280'
  }
});
