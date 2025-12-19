import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert, Modal, TouchableOpacity, Dimensions } from 'react-native';
import Input from '../components/Input';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { Producto, listarAlmacenCentral, agregarProductoAlmacenCentral, eliminarProductoAlmacenCentral, actualizarProductoAlmacenCentral, listarLocales, transferirACentralAlocal } from '../utils/storage';
import Toast from 'react-native-toast-message';
import { Picker } from '@react-native-picker/picker';
import { BarChart, PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

const screenWidth = Dimensions.get('window').width - 32;

export default function AlmacenCentralScreen() {
  const { COLORS } = useTheme();
  const [productos, setProductos] = useState<Producto[]>([]);
  const [filteredProductos, setFilteredProductos] = useState<Producto[]>([]);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'todas' | 'cocina' | 'cantina'>('todas');
  const [nombre, setNombre] = useState('');
  const [categoria, setCategoria] = useState<'cocina' | 'cantina'>('cocina');
  const [cantidad, setCantidad] = useState('0');
  const [unidad, setUnidad] = useState('u');
  const [precio, setPrecio] = useState('0');
  const [editing, setEditing] = useState<Producto | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [barData, setBarData] = useState<{ labels: string[]; datasets: { data: number[] }[] }>({ labels: [], datasets: [{ data: [] }] });
  const [pieData, setPieData] = useState<any[]>([]);

  const cargar = async () => {
    const lista = await listarAlmacenCentral();
    setProductos(lista);
    setFilteredProductos(lista);
    const ls = await listarLocales();
    setLocales(ls);
    updateCharts(lista);
  };

  const updateCharts = (lista: Producto[]) => {
    // Bar chart: Distribution by Category
    const cocinaProductos = lista.filter(p => p.categoria === 'cocina').length;
    const cantinaProductos = lista.filter(p => p.categoria === 'cantina').length;
    const cocinaUnidades = lista.filter(p => p.categoria === 'cocina').reduce((sum, p) => sum + p.cantidad, 0);
    const cantinaUnidades = lista.filter(p => p.categoria === 'cantina').reduce((sum, p) => sum + p.cantidad, 0);
    
    // For react-native-chart-kit, we need to show both datasets separately or combine them
    // We'll show productos as the main data and add a note about unidades
    setBarData({
      labels: ['Cocina', 'Cantina'],
      datasets: [
        {
          data: [cocinaProductos, cantinaProductos]
        }
      ]
    });

    // Pie chart: Top 8 products by value
    const productosConValor = lista.map(p => ({
      ...p,
      valorTotal: p.cantidad * p.precioUnitario
    })).sort((a, b) => b.valorTotal - a.valorTotal).slice(0, 8);

    const colors = ['#1976d2', '#42a5f5', '#66bb6a', '#ffa726', '#ef5350', '#ab47bc', '#7e57c2', '#5c6bc0'];
    setPieData(productosConValor.map((p, idx) => ({
      name: p.nombre,
      population: p.valorTotal,
      color: colors[idx % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 10
    })));
  };

  useEffect(() => {
    cargar();
  }, []);

  useEffect(() => {
    let filtered = productos;
    
    // Filter by category
    if (selectedCategory !== 'todas') {
      filtered = filtered.filter(p => p.categoria === selectedCategory);
    }
    
    // Filter by search text
    if (searchText.trim()) {
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(searchText.toLowerCase())
      );
    }
    
    setFilteredProductos(filtered);
  }, [productos, selectedCategory, searchText]);

  const onAgregar = useCallback(async () => {
    if (!nombre.trim()) return Toast.show({ type: 'error', text1: 'Nombre obligatorio' });
    if (Number(cantidad) < 0) return Toast.show({ type: 'error', text1: 'Cantidad inválida' });
    if (Number(precio) < 0) return Toast.show({ type: 'error', text1: 'Precio inválido' });
    const p = await agregarProductoAlmacenCentral({
      nombre: nombre.trim(),
      categoria,
      cantidad: Number(cantidad) || 0,
      unidad: unidad || 'u',
      precioUnitario: Number(precio) || 0
    });
    setNombre('');
    setCantidad('0');
    setUnidad('u');
    setPrecio('0');
    setAddModalVisible(false);
    await cargar();
    Toast.show({ type: 'success', text1: 'Producto agregado' });
  }, [nombre, categoria, cantidad, unidad, precio]);

  const [locales, setLocales] = useState<any[]>([]);
  const [sendModalVisible, setSendModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null);
  const [selectedLocalId, setSelectedLocalId] = useState<string | null>(null);
  const [sendQuantity, setSendQuantity] = useState('1');

  const openSendModal = useCallback((p: Producto) => {
    setSelectedProduct(p);
    setSendQuantity('1');
    setSendModalVisible(true);
  }, []);

  const onSend = useCallback(async () => {
    if (!selectedProduct || !selectedLocalId) return Toast.show({ type: 'error', text1: 'Selecciona local y cantidad' });
    const q = Number(sendQuantity) || 0;
    if (q <= 0) return Toast.show({ type: 'error', text1: 'Cantidad inválida' });
    const ok = await transferirACentralAlocal(selectedProduct.id, q, selectedLocalId);
    if (!ok) return Toast.show({ type: 'error', text1: 'No se pudo transferir (cantidad insuficiente o local no encontrado)' });
    await cargar();
    setSendModalVisible(false);
    setSelectedProduct(null);
    setSelectedLocalId(null);
    Toast.show({ type: 'success', text1: 'Producto transferido' });
  }, [selectedProduct, selectedLocalId, sendQuantity]);

  const onEliminar = useCallback((id: string) => {
    Alert.alert('Confirmar', 'Eliminar producto?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          await eliminarProductoAlmacenCentral(id);
          await cargar();
        }
      }
    ]);
  }, []);

  const onStartEdit = useCallback((p: Producto) => {
    setEditing(p);
    setNombre(p.nombre);
    setCategoria(p.categoria);
    setCantidad(String(p.cantidad));
    setUnidad(p.unidad);
    setPrecio(String(p.precioUnitario));
  }, []);

  const onCancelEdit = useCallback(() => {
    setEditing(null);
    setNombre('');
    setCantidad('0');
    setUnidad('u');
    setPrecio('0');
  }, []);

  const onSaveEdit = useCallback(async () => {
    if (!editing) return;
    if (!nombre.trim()) return Alert.alert('Error', 'Nombre obligatorio');
    if (Number(cantidad) < 0) return Alert.alert('Error', 'Cantidad inválida');
    if (Number(precio) < 0) return Alert.alert('Error', 'Precio inválido');

    const updated: Producto = {
      ...editing,
      nombre: nombre.trim(),
      categoria,
      cantidad: Number(cantidad) || 0,
      unidad: unidad || 'u',
      precioUnitario: Number(precio) || 0,
      fechaActualizacion: new Date().toISOString()
    };

    await actualizarProductoAlmacenCentral(updated);
    await cargar();
    onCancelEdit();
  }, [editing, nombre, categoria, cantidad, unidad, precio, onCancelEdit]);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Almacén Central" />
      {/* Header */}
      <View style={styles.headerSection}>
        <Text style={[styles.subtitle, { color: COLORS.muted }]}>Gestión de inventario principal</Text>
        <AppButton 
          title="+ Agregar Producto" 
          onPress={() => setAddModalVisible(true)}
          style={styles.addButton}
        />
      </View>

      {/* Charts Row */}
      <View style={styles.chartsContainer}>
        {/* Distribution by Category */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Distribución por Categoría</Text>
          <BarChart
            data={barData}
            width={screenWidth - 64}
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(156, 39, 176, ${opacity})`,
              barPercentage: 0.6,
            }}
            verticalLabelRotation={0}
            showValuesOnTopOfBars
          />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: '#9c27b0', width: 20, height: 4 }]} />
              <Text style={styles.legendText}>Productos</Text>
            </View>
          </View>
          <Text style={styles.chartNote}>
            Cocina: {productos.filter(p => p.categoria === 'cocina').reduce((sum, p) => sum + p.cantidad, 0)} unidades{'\n'}
            Cantina: {productos.filter(p => p.categoria === 'cantina').reduce((sum, p) => sum + p.cantidad, 0)} unidades
          </Text>
        </Card>

        {/* Value per Product Top 8 */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>Valor por Producto (Top 8)</Text>
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="10"
          />
        </Card>
      </View>

      {/* Search and Filters */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <MaterialIcons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
          <Input
            placeholder="Buscar producto..."
            value={searchText}
            onChangeText={setSearchText}
            style={styles.searchInput}
          />
        </View>
        
        <View style={styles.filterButtons}>
          <TouchableOpacity
            onPress={() => setSelectedCategory('todas')}
            style={[
              styles.filterButton,
              selectedCategory === 'todas' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory === 'todas' && styles.filterButtonTextActive
            ]}>Todas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedCategory('cocina')}
            style={[
              styles.filterButton,
              selectedCategory === 'cocina' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory === 'cocina' && styles.filterButtonTextActive
            ]}>Cocina</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedCategory('cantina')}
            style={[
              styles.filterButton,
              selectedCategory === 'cantina' && styles.filterButtonActive
            ]}
          >
            <Text style={[
              styles.filterButtonText,
              selectedCategory === 'cantina' && styles.filterButtonTextActive
            ]}>Cantina</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Product Table */}
      <Card style={styles.tableCard}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tableWrapper}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, styles.colProducto]}>Producto</Text>
              <Text style={[styles.tableHeaderText, styles.colCategoria]}>Categoría</Text>
              <Text style={[styles.tableHeaderText, styles.colCantidad]}>Cantidad</Text>
              <Text style={[styles.tableHeaderText, styles.colUnidad]}>Unidad</Text>
              <Text style={[styles.tableHeaderText, styles.colPrecio]}>Precio Unit.</Text>
              <Text style={[styles.tableHeaderText, styles.colValor]}>Valor Total</Text>
              <Text style={[styles.tableHeaderText, styles.colAcciones]}>Acciones</Text>
            </View>
            
            {filteredProductos.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay productos</Text>
              </View>
            ) : (
              filteredProductos.map((item) => (
                <View key={item.id} style={styles.tableRow}>
                  <View style={[styles.tableCell, styles.colProducto, { flexDirection: 'row', alignItems: 'center' }]}>
                    <View style={[styles.productIcon, { backgroundColor: '#f39c12' }]}>
                      <MaterialIcons name="inventory" size={14} color="#fff" />
                    </View>
                    <Text style={[styles.tableCellText, { flexShrink: 1 }]} numberOfLines={1}>{item.nombre}</Text>
                  </View>
                  <View style={[styles.tableCell, styles.colCategoria]}>
                    <View style={[
                      styles.categoryTag,
                      { backgroundColor: item.categoria === 'cocina' ? '#fff3e0' : '#e3f2fd' }
                    ]}>
                      <Text style={[
                        styles.categoryTagText,
                        { color: item.categoria === 'cocina' ? '#f39c12' : '#3498db' }
                      ]}>
                        {item.categoria === 'cocina' ? 'Cocina' : 'Cantina'}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colCantidad]}>{item.cantidad.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colUnidad]}>{item.unidad}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colPrecio]}>${item.precioUnitario.toFixed(2)}</Text>
                  <Text style={[styles.tableCell, styles.tableCellText, styles.colValor]}>${(item.cantidad * item.precioUnitario).toFixed(2)}</Text>
                  <View style={[styles.tableCell, styles.colAcciones, { flexDirection: 'row', gap: 6 }]}>
                    <TouchableOpacity onPress={() => openSendModal(item)}>
                      <View style={[styles.actionButton, { backgroundColor: '#22C55E' }]}>
                        <MaterialIcons name="arrow-upward" size={14} color="#fff" />
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => onStartEdit(item)}>
                      <View style={[styles.actionButton, { backgroundColor: '#3498db' }]}>
                        <MaterialIcons name="edit" size={14} color="#fff" />
                      </View>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      </Card>

      {/* Add Product Modal */}
      <Modal visible={addModalVisible} animationType="slide" onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Agregar Producto</Text>
          <Input placeholder="Nombre" value={nombre} onChangeText={setNombre} style={styles.modalInput} />
          <View style={styles.modalPicker}>
            <Picker selectedValue={categoria} onValueChange={(v: 'cocina' | 'cantina') => setCategoria(v)}>
              <Picker.Item label="Cocina" value="cocina" />
              <Picker.Item label="Cantina" value="cantina" />
            </Picker>
          </View>
          <Input placeholder="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="numeric" style={styles.modalInput} />
          <Input placeholder="Unidad" value={unidad} onChangeText={setUnidad} style={styles.modalInput} />
          <Input placeholder="Precio unitario" value={precio} onChangeText={setPrecio} keyboardType="numeric" style={styles.modalInput} />
          <AppButton title="Agregar" onPress={onAgregar} style={{ marginTop: 16 }} />
          <AppButton title="Cancelar" variant="ghost" onPress={() => setAddModalVisible(false)} style={{ marginTop: 8 }} />
        </View>
      </Modal>

      {/* Edit Modal */}
      <Modal visible={!!editing} animationType="slide" onRequestClose={onCancelEdit}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Editar producto</Text>
          <Input placeholder="Nombre" value={nombre} onChangeText={setNombre} style={styles.modalInput} />
          <View style={styles.modalPicker}>
            <Picker selectedValue={categoria} onValueChange={(v: 'cocina' | 'cantina') => setCategoria(v)}>
              <Picker.Item label="Cocina" value="cocina" />
              <Picker.Item label="Cantina" value="cantina" />
            </Picker>
          </View>
          <Input placeholder="Cantidad" value={cantidad} onChangeText={setCantidad} keyboardType="numeric" style={styles.modalInput} />
          <Input placeholder="Unidad" value={unidad} onChangeText={setUnidad} style={styles.modalInput} />
          <Input placeholder="Precio unitario" value={precio} onChangeText={setPrecio} keyboardType="numeric" style={styles.modalInput} />
          <AppButton title="Guardar" onPress={onSaveEdit} style={{ marginTop: 16 }} />
          <AppButton title="Cancelar" variant="ghost" onPress={onCancelEdit} style={{ marginTop: 8 }} />
        </View>
      </Modal>

      {/* Send Modal */}
      <Modal visible={sendModalVisible} animationType="slide" onRequestClose={() => setSendModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Enviar a Local</Text>
          <Text style={{ marginBottom: 8, fontSize: 16, fontWeight: '600' }}>{selectedProduct?.nombre}</Text>
          <Text style={{ marginBottom: 8 }}>Selecciona Local:</Text>
          <View style={styles.modalPicker}>
            {locales.length === 0 ? <Text>No hay locales creados</Text> : (
              <Picker selectedValue={selectedLocalId || ''} onValueChange={(v) => setSelectedLocalId(v)}>
                <Picker.Item label="Selecciona local..." value="" />
                {locales.map(l => <Picker.Item key={l.id} label={l.nombre} value={l.id} />)}
              </Picker>
            )}
          </View>
          <Input placeholder="Cantidad a enviar" value={sendQuantity} onChangeText={setSendQuantity} keyboardType="numeric" style={styles.modalInput} />
          <AppButton title="Enviar" onPress={onSend} style={{ marginTop: 16 }} />
          <AppButton title="Cancelar" variant="ghost" onPress={() => setSendModalVisible(false)} style={{ marginTop: 8 }} />
        </View>
      </Modal>
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
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20
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
  addButton: {
    paddingHorizontal: 16,
    paddingVertical: 10
  },
  chartsContainer: {
    marginBottom: 20,
    gap: 12
  },
  chartCard: {
    width: '100%',
    padding: 16,
    marginBottom: 12
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    color: '#1F2937'
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
    gap: 16
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6
  },
  legendColor: {
    borderRadius: 2
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280'
  },
  chartNote: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center'
  },
  searchSection: {
    marginBottom: 20
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB'
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    borderWidth: 0,
    paddingVertical: 10
  },
  filterButtons: {
    flexDirection: 'row',
    gap: 8
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
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
  colCategoria: { width: 100, paddingRight: 12 },
  colCantidad: { width: 80, paddingRight: 12 },
  colUnidad: { width: 70, paddingRight: 12 },
  colPrecio: { width: 100, paddingRight: 12 },
  colValor: { width: 110, paddingRight: 12 },
  colAcciones: { width: 80, paddingRight: 16 },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: 'flex-start'
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600'
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },
  emptyState: {
    padding: 40,
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 14,
    color: '#6B7280'
  },
  modalContainer: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    justifyContent: 'center'
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center'
  },
  modalInput: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  },
  modalPicker: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden'
  }
});
