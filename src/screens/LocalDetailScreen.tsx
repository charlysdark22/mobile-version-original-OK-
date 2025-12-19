import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, Alert, TouchableOpacity } from 'react-native';
import AppButton from '../components/AppButton';
import { obtenerLocal, listarAlmacenCentral, transferirACentralAlocal } from '../utils/storage';
import Toast from 'react-native-toast-message';
import Input from '../components/Input';
import { Picker } from '@react-native-picker/picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import Card from '../components/Card';

export default function LocalDetailScreen({ route, navigation }: any) {
  const { COLORS } = useTheme();
  const localId = route.params?.localId;
  const [localName, setLocalName] = useState<string>('');
  const [supplyModalVisible, setSupplyModalVisible] = useState(false);
  const [centralProducts, setCentralProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [supplyQuantity, setSupplyQuantity] = useState('1');

  useEffect(() => {
    const load = async () => {
      if (!localId) return;
      const l = await obtenerLocal(localId);
      if (l) setLocalName(l.nombre);
    };
    load();
  }, [localId]);

  const openSupplyModal = useCallback(async () => {
    const lista = await listarAlmacenCentral();
    setCentralProducts(lista);
    setSelectedProductId(lista[0]?.id || null);
    setSupplyQuantity('1');
    setSupplyModalVisible(true);
  }, []);

  const onSupply = useCallback(async () => {
    if (!selectedProductId) return Toast.show({ type: 'error', text1: 'Seleccione producto' });
    const q = Number(supplyQuantity) || 0;
    if (q <= 0) return Toast.show({ type: 'error', text1: 'Cantidad inválida' });
    const ok = await transferirACentralAlocal(selectedProductId, q, localId);
    if (!ok) return Toast.show({ type: 'error', text1: 'No se pudo suministrar (stock insuficiente o local no encontrado)' });
    const lista = await listarAlmacenCentral();
    setCentralProducts(lista);
    setSupplyModalVisible(false);
    Toast.show({ type: 'success', text1: 'Suministro realizado' });
    navigation.navigate('Inventario', { localId, _refresh: Date.now() });
  }, [selectedProductId, supplyQuantity, localId, navigation]);

  const confirmSupply = useCallback(() => {
    const q = Number(supplyQuantity) || 0;
    if (!selectedProductId) return Toast.show({ type: 'error', text1: 'Seleccione producto' });
    if (q <= 0) return Toast.show({ type: 'error', text1: 'Cantidad inválida' });
    const sel = centralProducts.find(p => p.id === selectedProductId);
    if (!sel) return Toast.show({ type: 'error', text1: 'Producto no encontrado' });
    if (sel.cantidad < q) return Toast.show({ type: 'error', text1: 'Cantidad mayor al stock disponible' });
    Alert.alert('Confirmar suministro', `Enviar ${q} ${sel.unidad} de "${sel.nombre}" a ${localName || 'este local'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', onPress: onSupply }
    ]);
  }, [selectedProductId, supplyQuantity, centralProducts, localName, onSupply]);

  if (!localId) return (
    <View style={styles.container}><Text style={styles.title}>Local no especificado</Text></View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerSection}>
        <View style={styles.headerIcon}>
          <MaterialIcons name="store" size={32} color="#9b59b6" />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: COLORS.text }]}>{localName || 'Local'}</Text>
          <Text style={[styles.subtitle, { color: COLORS.muted }]}>
            {localName === 'Cafe Avellaneda' 
              ? 'Gestión completa del local' 
              : 'Gestión del local'}
          </Text>
        </View>
      </View>

      {/* Sections Grid */}
      <View style={styles.sectionsGrid}>
        {/* Mesas y Pedidos */}
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Mesas', { localId })}
        >
          <View style={[styles.sectionIcon, { backgroundColor: '#e3f2fd' }]}>
            <MaterialIcons name="restaurant" size={32} color="#3498db" />
          </View>
          <Text style={styles.sectionTitle}>Mesas y Pedidos</Text>
          <Text style={styles.sectionSubtitle}>Gestión de consumos por mesa</Text>
        </TouchableOpacity>

        {/* Cocina */}
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Cocina', { localId })}
        >
          <View style={[styles.sectionIcon, { backgroundColor: '#fff3e0' }]}>
            <MaterialIcons name="restaurant-menu" size={32} color="#f39c12" />
          </View>
          <Text style={styles.sectionTitle}>Cocina</Text>
          <Text style={styles.sectionSubtitle}>Reportes e inventario</Text>
        </TouchableOpacity>

        {/* Cantina */}
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Cantina', { localId })}
        >
          <View style={[styles.sectionIcon, { backgroundColor: '#e3f2fd' }]}>
            <MaterialIcons name="local-cafe" size={32} color="#3498db" />
          </View>
          <Text style={styles.sectionTitle}>Cantina</Text>
          <Text style={styles.sectionSubtitle}>Reportes e inventario</Text>
        </TouchableOpacity>

        {/* Informes e Inventario */}
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Informes', { localId })}
        >
          <View style={[styles.sectionIcon, { backgroundColor: '#f3e5f5' }]}>
            <MaterialIcons name="assessment" size={32} color="#9b59b6" />
          </View>
          <Text style={styles.sectionTitle}>Informes e Inventario</Text>
          <Text style={styles.sectionSubtitle}>Reportes detallados</Text>
        </TouchableOpacity>

        {/* Almacén de Local */}
        <TouchableOpacity 
          style={styles.sectionCard}
          onPress={() => navigation.navigate('Inventario', { localId })}
        >
          <View style={[styles.sectionIcon, { backgroundColor: '#e8f5e9' }]}>
            <MaterialIcons name="inventory" size={32} color="#22C55E" />
          </View>
          <Text style={styles.sectionTitle}>Almacén de Local</Text>
          <Text style={styles.sectionSubtitle}>Inventario del local</Text>
        </TouchableOpacity>
      </View>

      {/* Supply Section */}
      <Card style={styles.supplyCard}>
        <Text style={styles.supplyTitle}>Suministro desde Almacén Central</Text>
        <Text style={styles.supplySubtitle}>Transfiere productos desde el almacén central a este local</Text>
        <AppButton 
          title="Suministrar desde Almacén Central" 
          onPress={openSupplyModal} 
          style={{ marginTop: 12 }} 
        />
      </Card>

      {/* Supply Modal */}
      <Modal visible={supplyModalVisible} animationType="slide" onRequestClose={() => setSupplyModalVisible(false)}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>Suministrar desde Almacén Central</Text>
          {centralProducts.length === 0 ? (
            <Text style={styles.modalText}>No hay productos en el almacen central</Text>
          ) : (
            <View style={styles.modalContent}>
              <View style={styles.modalPicker}>
                <Picker selectedValue={selectedProductId || ''} onValueChange={(v) => setSelectedProductId(v)}>
                  {centralProducts.map(p => (
                    <Picker.Item 
                      key={p.id} 
                      label={`${p.nombre} · ${p.cantidad} ${p.unidad}`} 
                      value={p.id} 
                    />
                  ))}
                </Picker>
              </View>
              <Text style={styles.modalText}>
                Stock disponible: {centralProducts.find(p => p.id === selectedProductId)?.cantidad || 0}
              </Text>
              <View style={styles.modalProductInfo}>
                <Text style={styles.modalProductName}>
                  {centralProducts.find(p => p.id === selectedProductId)?.nombre || ''}
                </Text>
                <Text style={styles.modalProductDetails}>
                  {centralProducts.find(p => p.id === selectedProductId)?.categoria || ''} · 
                  {centralProducts.find(p => p.id === selectedProductId)?.unidad || ''} · 
                  ${centralProducts.find(p => p.id === selectedProductId)?.precioUnitario?.toFixed?.(2) || '0.00'}
                </Text>
              </View>
              <Input 
                placeholder="Cantidad a suministrar" 
                value={supplyQuantity} 
                onChangeText={setSupplyQuantity} 
                keyboardType="numeric" 
                style={styles.modalInput} 
              />
              <AppButton 
                title="Suministrar" 
                onPress={confirmSupply} 
                disabled={
                  Number(supplyQuantity) <= 0 || 
                  Number(supplyQuantity) > (centralProducts.find(p => p.id === selectedProductId)?.cantidad || 0)
                }
                style={{ marginTop: 16 }} 
              />
              <AppButton 
                title="Cancelar" 
                variant="ghost" 
                onPress={() => setSupplyModalVisible(false)} 
                style={{ marginTop: 8 }} 
              />
            </View>
          )}
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 16, 
    backgroundColor: '#f4f6fb',
    paddingBottom: 40,
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
    backgroundColor: '#f3e5f5',
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
  sectionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20
  },
  sectionCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2
  },
  sectionIcon: {
    width: 64,
    height: 64,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center'
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center'
  },
  supplyCard: {
    padding: 20,
    marginBottom: 20
  },
  supplyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8
  },
  supplySubtitle: {
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
  modalContent: {
    width: '100%'
  },
  modalPicker: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    overflow: 'hidden'
  },
  modalText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
    textAlign: 'center'
  },
  modalProductInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8
  },
  modalProductName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  modalProductDetails: {
    fontSize: 14,
    color: '#6B7280'
  },
  modalInput: {
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10
  }
});
