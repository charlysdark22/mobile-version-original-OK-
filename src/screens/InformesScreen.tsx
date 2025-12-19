import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { cargarDatos, obtenerLocal } from '../utils/storage';
import Header from '../components/Header';
import Card from '../components/Card';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import AppButton from '../components/AppButton';

const screenWidth = Dimensions.get('window').width - 32;

type TipoInforme = 'general' | 'cocina' | 'cantina';
type Periodo = 'hoy' | 'semana' | 'mes';

export default function InformesScreen({ route }: any) {
  const { COLORS } = useTheme();
  const localId = route?.params?.localId;
  const [tipoInforme, setTipoInforme] = useState<TipoInforme>('general');
  const [periodo, setPeriodo] = useState<Periodo>('semana');
  const [metrics, setMetrics] = useState({
    entradas: 0,
    consumos: 0,
    stockActual: 0,
    valorInventario: 0
  });
  const [lineData, setLineData] = useState<any>({ labels: [], datasets: [] });
  const [inventario, setInventario] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    const datos = await cargarDatos();
    let scopeName = '';
    let almacenCentral = datos.almacenCentral;
    let locales = datos.locales;
    
    if (localId) {
      const l = await obtenerLocal(localId);
      scopeName = l?.nombre || '';
      locales = l ? [l] : [];
      almacenCentral = [];
    }

    // Filter by category if needed
    if (tipoInforme === 'cocina') {
      almacenCentral = almacenCentral.filter(p => p.categoria === 'cocina');
      locales.forEach(l => {
        l.almacen = l.almacen.filter(p => p.categoria === 'cocina');
      });
    } else if (tipoInforme === 'cantina') {
      almacenCentral = almacenCentral.filter(p => p.categoria === 'cantina');
      locales.forEach(l => {
        l.almacen = l.almacen.filter(p => p.categoria === 'cantina');
      });
    }

    // Calculate date range
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    let fechaInicio = new Date(hoy);
    if (periodo === 'semana') {
      fechaInicio.setDate(hoy.getDate() - 7);
    } else if (periodo === 'mes') {
      fechaInicio.setMonth(hoy.getMonth() - 1);
    }

    // Calculate metrics
    const movimientos = datos.movimientos || [];
    const movimientosPeriodo = movimientos.filter(m => {
      const fechaMov = new Date(m.fecha);
      return fechaMov >= fechaInicio;
    });

    const entradas = movimientosPeriodo
      .filter(m => m.tipo === 'suministro' || m.tipo === 'entrada')
      .reduce((sum, m) => sum + m.cantidad, 0);

    const consumos = movimientosPeriodo
      .filter(m => m.tipo === 'consumo')
      .reduce((sum, m) => sum + m.cantidad, 0);

    const allProducts = [...almacenCentral, ...locales.flatMap(l => l.almacen)];
    const stockActual = allProducts.reduce((sum, p) => sum + p.cantidad, 0);
    const valorInventario = allProducts.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);

    setMetrics({ entradas, consumos, stockActual, valorInventario });

    // Generate line chart data (last 7 days)
    const labels: string[] = [];
    const entradasData: number[] = [];
    const consumosData: number[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(`${date.getDate()}/${date.getMonth() + 1}`);
      
      const dayStart = new Date(date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setHours(23, 59, 59, 999);
      
      const dayMovimientos = movimientos.filter(m => {
        const fechaMov = new Date(m.fecha);
        return fechaMov >= dayStart && fechaMov <= dayEnd;
      });
      
      const dayEntradas = dayMovimientos
        .filter(m => m.tipo === 'suministro' || m.tipo === 'entrada')
        .reduce((sum, m) => sum + m.cantidad, 0);
      
      const dayConsumos = dayMovimientos
        .filter(m => m.tipo === 'consumo')
        .reduce((sum, m) => sum + m.cantidad, 0);
      
      entradasData.push(dayEntradas);
      consumosData.push(dayConsumos);
    }

    setLineData({
      labels,
      datasets: [
        {
          data: entradasData,
          color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: consumosData,
          color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
          strokeWidth: 2
        }
      ]
    });

    // Inventory table data
    const inventarioData = allProducts.map(p => {
      const movimientosProducto = movimientosPeriodo.filter(m => 
        m.productoNombre === p.nombre || m.productoId === p.id
      );
      const entrada = movimientosProducto
        .filter(m => m.tipo === 'suministro' || m.tipo === 'entrada')
        .reduce((sum, m) => sum + m.cantidad, 0);
      const consumo = movimientosProducto
        .filter(m => m.tipo === 'consumo')
        .reduce((sum, m) => sum + m.cantidad, 0);
      
      return {
        nombre: p.nombre,
        categoria: p.categoria,
        entrada,
        consumo,
        stock: p.cantidad,
        faltante: p.cantidad <= 5 ? 5 - p.cantidad : 0,
        valor: p.cantidad * p.precioUnitario
      };
    });

    setInventario(inventarioData);
  }, [localId, tipoInforme, periodo]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Informes e Inventarios" />
      <View style={styles.headerSection}>
        <Text style={[styles.subtitle, { color: COLORS.muted }]}>Reportes detallados del sistema</Text>
        <AppButton 
          title="Descargar Informe" 
          onPress={() => {}}
          style={styles.downloadButton}
        />
      </View>

      {/* Filters */}
      <View style={styles.filtersSection}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Tipo de Informe:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              onPress={() => setTipoInforme('general')}
              style={[
                styles.filterButton,
                tipoInforme === 'general' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                tipoInforme === 'general' && styles.filterButtonTextActive
              ]}>General</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTipoInforme('cocina')}
              style={[
                styles.filterButton,
                tipoInforme === 'cocina' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                tipoInforme === 'cocina' && styles.filterButtonTextActive
              ]}>Cocina</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setTipoInforme('cantina')}
              style={[
                styles.filterButton,
                tipoInforme === 'cantina' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                tipoInforme === 'cantina' && styles.filterButtonTextActive
              ]}>Cantina</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Periodo:</Text>
          <View style={styles.filterButtons}>
            <TouchableOpacity
              onPress={() => setPeriodo('hoy')}
              style={[
                styles.filterButton,
                periodo === 'hoy' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                periodo === 'hoy' && styles.filterButtonTextActive
              ]}>Hoy</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPeriodo('semana')}
              style={[
                styles.filterButton,
                periodo === 'semana' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                periodo === 'semana' && styles.filterButtonTextActive
              ]}>Semana</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setPeriodo('mes')}
              style={[
                styles.filterButton,
                periodo === 'mes' && styles.filterButtonActive
              ]}
            >
              <Text style={[
                styles.filterButtonText,
                periodo === 'mes' && styles.filterButtonTextActive
              ]}>Mes</Text>
            </TouchableOpacity>
          </View>
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
          <View style={[styles.metricIcon, { backgroundColor: '#f3e5f5' }]}>
            <MaterialIcons name="attach-money" size={24} color="#9b59b6" />
          </View>
          <Text style={styles.metricLabel}>Valor Inventario</Text>
          <Text style={styles.metricValue}>${metrics.valorInventario.toFixed(2)}</Text>
        </Card>
      </View>

      {/* Trend Chart */}
      <Card style={styles.chartCard}>
        <Text style={styles.chartTitle}>Tendencia de Movimientos</Text>
        <LineChart
          data={lineData}
          width={screenWidth - 32}
          height={220}
          chartConfig={{
            backgroundColor: '#fff',
            backgroundGradientFrom: '#fff',
            backgroundGradientTo: '#fff',
            decimalPlaces: 0,
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            style: {
              borderRadius: 16
            },
            propsForDots: {
              r: '4',
              strokeWidth: '2'
            }
          }}
          bezier
          style={{
            marginVertical: 8,
            borderRadius: 16
          }}
        />
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#22C55E' }]} />
            <Text style={styles.legendText}>Entradas</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: '#EF4444' }]} />
            <Text style={styles.legendText}>Consumos</Text>
          </View>
        </View>
      </Card>

      {/* Inventory Table */}
      <Card style={styles.tableCard}>
        <Text style={styles.tableTitle}>Inventario Actual - {tipoInforme === 'general' ? 'General' : tipoInforme === 'cocina' ? 'Cocina' : 'Cantina'}</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProducto]}>Producto</Text>
              <Text style={[styles.tableHeaderText, styles.colCategoria]}>Categoría</Text>
              <Text style={[styles.tableHeaderText, styles.colEntrada]}>Entrada</Text>
              <Text style={[styles.tableHeaderText, styles.colConsumo]}>Consumo</Text>
              <Text style={[styles.tableHeaderText, styles.colStock]}>Stock</Text>
              <Text style={[styles.tableHeaderText, styles.colFaltante]}>Faltante</Text>
              <Text style={[styles.tableHeaderText, styles.colValor]}>Valor</Text>
            </View>
            
            {inventario.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay productos en inventario</Text>
              </View>
            ) : (
              inventario.map((item, idx) => (
                <View key={idx} style={styles.tableRow}>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colProducto]} numberOfLines={1}>{item.nombre}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colCategoria]}>
                    {item.categoria === 'cocina' ? 'Cocina' : 'Cantina'}
                  </Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colEntrada]}>{item.entrada.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colConsumo]}>{item.consumo.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colStock]}>{item.stock.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colFaltante]}>{item.faltante.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colValor]}>${item.valor.toFixed(2)}</Text>
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
    padding: 16,
    backgroundColor: '#f4f6fb',
    paddingBottom: 100,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  downloadButton: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  filtersSection: {
    marginBottom: 20
  },
  filterGroup: {
    marginBottom: 16
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  filterButtonActive: {
    backgroundColor: '#9b59b6',
    borderColor: '#9b59b6'
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280'
  },
  filterButtonTextActive: {
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
  chartCard: {
    padding: 16,
    marginBottom: 20
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 24
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 8
  },
  legendText: {
    fontSize: 14,
    color: '#6B7280'
  },
  tableCard: {
    padding: 16,
    marginBottom: 20,
    overflow: 'hidden'
  },
  tableTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16
  },
  tableWrapper: {
    minWidth: 700,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    marginBottom: 12,
    backgroundColor: '#F9FAFB',
    paddingHorizontal: 16,
    paddingTop: 16
  },
  tableHeaderText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5
  },
  colProducto: { width: 160, paddingRight: 12 },
  colCategoria: { width: 90, paddingRight: 12 },
  colEntrada: { width: 80, paddingRight: 12 },
  colConsumo: { width: 80, paddingRight: 12 },
  colStock: { width: 80, paddingRight: 12 },
  colFaltante: { width: 80, paddingRight: 12 },
  colValor: { width: 100, paddingRight: 16 },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
    minHeight: 56
  },
  tableCell: {
    justifyContent: 'center',
    paddingRight: 12
  },
  tableCellText: {
    fontSize: 12,
    color: '#1F2937'
  },
  emptyState: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280'
  }
});
