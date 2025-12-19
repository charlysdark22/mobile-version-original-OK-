import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Input from '../components/Input';
import { useNavigation } from '@react-navigation/native';
import { Local, listarLocales, crearLocal, obtenerLocal, ajustarCantidadLocal, cargarDatos } from '../utils/storage';
import Toast from 'react-native-toast-message';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/Header';

export default function LocalesListScreen() {
  const { COLORS } = useTheme();
  const [locales, setLocales] = useState<Local[]>([]);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [selectedLocal, setSelectedLocal] = useState<Local | null>(null);
  const [search, setSearch] = useState('');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingLocal, setEditingLocal] = useState<Local | null>(null);
  const [systemStats, setSystemStats] = useState({
    localesActivos: 0,
    totalProductos: 0,
    enDesarrollo: 0
  });

  const load = async () => {
    const ls = await listarLocales();
    setLocales(ls);
    
    // Calculate system stats
    const datos = await cargarDatos();
    const localesActivos = ls.filter(l => l.activo).length;
    const totalProductos = ls.reduce((sum, l) => sum + l.almacen.length, 0);
    const enDesarrollo = ls.filter(l => !l.activo).length;
    
    setSystemStats({
      localesActivos,
      totalProductos,
      enDesarrollo
    });
  };

  useEffect(() => { load(); }, []);

  const onCrearLocal = async () => {
    if (!nuevoNombre.trim()) return Toast.show({ type: 'error', text1: 'Nombre obligatorio' });
    const l = await crearLocal(nuevoNombre.trim());
    setNuevoNombre('');
    await load();
    Toast.show({ type: 'success', text1: 'Local creado' });
  };

  const onStartEditLocal = (l: Local) => { setEditingLocal(l); setEditModalOpen(true); };

  const onSaveLocalEdit = async (newName: string) => {
    if (!editingLocal) return;
    const appModule = await import('../utils/storage');
    const datosApp = await appModule.cargarDatos();
    const idx = datosApp.locales.findIndex(x => x.id === editingLocal.id);
    if (idx >= 0) {
      datosApp.locales[idx].nombre = newName;
      await appModule.guardarDatos(datosApp as any);
      await load();
      Toast.show({ type: 'success', text1: 'Local actualizado' });
    }
    setEditModalOpen(false);
    setEditingLocal(null);
  };

  const onDeleteLocal = (id: string) => {
    Alert.alert('Confirmar', 'Eliminar local y su inventario?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar', style: 'destructive', onPress: async () => {
          const appModule = await import('../utils/storage');
          const datos = await appModule.cargarDatos();
          datos.locales = datos.locales.filter(l => l.id !== id);
          await appModule.guardarDatos(datos as any);
          await load();
          Toast.show({ type: 'success', text1: 'Local eliminado' });
        }
      }
    ]);
  };

  const navigationAny: any = useNavigation();

  const onSelectLocal = async (id: string) => {
    navigationAny.navigate('LocalDetail', { localId: id });
  };

  // Ensure Cafe Avellaneda exists and is active
  useEffect(() => {
    const ensureCafeAvellaneda = async () => {
      const ls = await listarLocales();
      const cafeAvellaneda = ls.find(l => l.nombre === 'Cafe Avellaneda');
      if (!cafeAvellaneda) {
        await crearLocal('Cafe Avellaneda');
        await load();
      } else if (!cafeAvellaneda.activo) {
        const appModule = await import('../utils/storage');
        const datos = await appModule.cargarDatos();
        const idx = datos.locales.findIndex(l => l.id === cafeAvellaneda.id);
        if (idx >= 0) {
          datos.locales[idx].activo = true;
          await appModule.guardarDatos(datos as any);
          await load();
        }
      }
    };
    ensureCafeAvellaneda();
  }, []);

  // Ensure we have 4 locals total (Cafe Avellaneda + 3 coming soon)
  useEffect(() => {
    const ensureLocals = async () => {
      const ls = await listarLocales();
      const cafeAvellaneda = ls.find(l => l.nombre === 'Cafe Avellaneda');
      const local2 = ls.find(l => l.nombre === 'Local 2');
      const local3 = ls.find(l => l.nombre === 'Local 3');
      const local4 = ls.find(l => l.nombre === 'Local 4');
      
      if (!local2) await crearLocal('Local 2');
      if (!local3) await crearLocal('Local 3');
      if (!local4) await crearLocal('Local 4');
      
      // Set Local 2, 3, 4 as inactive (coming soon)
      const appModule = await import('../utils/storage');
      const datos = await appModule.cargarDatos();
      datos.locales.forEach(l => {
        if (l.nombre === 'Local 2' || l.nombre === 'Local 3' || l.nombre === 'Local 4') {
          l.activo = false;
        }
      });
      await appModule.guardarDatos(datos as any);
      await load();
    };
    if (locales.length > 0) {
      ensureLocals();
    }
  }, [locales.length]);

  const getLocalStats = (local: Local) => {
    const productos = local.almacen.length;
    const unidades = local.almacen.reduce((sum, p) => sum + p.cantidad, 0);
    const valorTotal = local.almacen.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0);
    return { productos, unidades, valorTotal };
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Gestión de Locales" />
      <View style={styles.headerSection}>
        <Text style={[styles.subtitle, { color: COLORS.muted }]}>Administra todos los locales del sistema</Text>
      </View>

      {/* Local Cards Grid */}
      <View style={styles.localsGrid}>
        {locales.map((local) => {
          const stats = getLocalStats(local);
          const isActive = local.activo;
          
          return (
            <Card key={local.id} style={styles.localCard}>
              {/* Header */}
              <View style={[
                styles.localHeader,
                isActive ? styles.localHeaderActive : styles.localHeaderInactive
              ]}>
                {isActive ? (
                  <View style={styles.gradientHeader}>
                    <View style={styles.localHeaderContent}>
                      <MaterialIcons name="store" size={24} color="#fff" />
                      <Text style={styles.localHeaderTitle}>{local.nombre}</Text>
                    </View>
                    <View style={styles.statusRow}>
                      <MaterialIcons name="check-circle" size={16} color="#22C55E" />
                      <Text style={styles.statusText}>Activo</Text>
                    </View>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" style={styles.arrowIcon} />
                  </View>
                ) : (
                  <View style={styles.localHeaderContentInactive}>
                    <MaterialIcons name="store" size={24} color="#6B7280" />
                    <Text style={styles.localHeaderTitleInactive}>{local.nombre}</Text>
                    <View style={styles.statusRow}>
                      <MaterialIcons name="schedule" size={16} color="#6B7280" />
                      <Text style={styles.statusTextInactive}>Próximamente</Text>
                    </View>
                  </View>
                )}
              </View>

              {/* Content */}
              {isActive ? (
                <View style={styles.localContent}>
                  <View style={styles.statsRow}>
                    <View style={[styles.statBox, { backgroundColor: '#e3f2fd' }]}>
                      <Text style={styles.statLabel}>Productos</Text>
                      <Text style={styles.statValue}>{stats.productos}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#e8f5e9' }]}>
                      <Text style={styles.statLabel}>Unidades</Text>
                      <Text style={styles.statValue}>{stats.unidades}</Text>
                    </View>
                    <View style={[styles.statBox, { backgroundColor: '#f3e5f5' }]}>
                      <Text style={styles.statLabel}>Valor Total Inventario</Text>
                      <Text style={styles.statValue}>${stats.valorTotal.toFixed(2)}</Text>
                    </View>
                  </View>
                  <TouchableOpacity 
                    onPress={() => onSelectLocal(local.id)}
                    style={styles.detailButton}
                  >
                    <Text style={styles.detailButtonText}>Ver Detalles →</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.localContentInactive}>
                  <MaterialIcons name="schedule" size={64} color="#D1D5DB" />
                  <Text style={styles.comingSoonText}>Este local estará disponible próximamente</Text>
                  <Text style={styles.configText}>En proceso de configuración</Text>
                </View>
              )}
            </Card>
          );
        })}
      </View>

      {/* System Status */}
      <Card style={styles.systemStatusCard}>
        <Text style={styles.systemStatusTitle}>Estado del Sistema</Text>
        <View style={styles.systemStatsRow}>
          <View style={[styles.systemStatBox, { backgroundColor: '#e8f5e9' }]}>
            <Text style={styles.systemStatLabel}>Locales Activos</Text>
            <Text style={styles.systemStatValue}>{systemStats.localesActivos} de {locales.length}</Text>
          </View>
          <View style={[styles.systemStatBox, { backgroundColor: '#e3f2fd' }]}>
            <Text style={styles.systemStatLabel}>Total Productos</Text>
            <Text style={styles.systemStatValue}>{systemStats.totalProductos} items</Text>
          </View>
          <View style={[styles.systemStatBox, { backgroundColor: '#f3e5f5' }]}>
            <Text style={styles.systemStatLabel}>En Desarrollo</Text>
            <Text style={styles.systemStatValue}>{systemStats.enDesarrollo} locales</Text>
          </View>
        </View>
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
  localsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  localCard: {
    width: '48%',
    marginBottom: 16,
    padding: 0,
    overflow: 'hidden'
  },
  localHeader: {
    padding: 16
  },
  gradientHeader: {
    padding: 16,
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#9b59b6'
  },
  localHeaderContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1
  },
  localHeaderContentInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  localHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8
  },
  localHeaderTitleInactive: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
    marginLeft: 8
  },
  localHeaderActive: {
    backgroundColor: '#9b59b6'
  },
  localHeaderInactive: {
    backgroundColor: '#E5E7EB'
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  statusText: {
    fontSize: 12,
    color: '#22C55E',
    marginLeft: 4,
    fontWeight: '600'
  },
  statusTextInactive: {
    fontSize: 12,
    color: '#6B7280',
    marginLeft: 4,
    fontWeight: '600'
  },
  arrowIcon: {
    marginLeft: 8
  },
  localContent: {
    padding: 16
  },
  localContentInactive: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center'
  },
  statsRow: {
    marginBottom: 16
  },
  statBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937'
  },
  detailButton: {
    backgroundColor: '#3498db',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center'
  },
  detailButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700'
  },
  comingSoonText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '600'
  },
  configText: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 8
  },
  systemStatusCard: {
    padding: 16,
    marginBottom: 20
  },
  systemStatusTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16
  },
  systemStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12
  },
  systemStatBox: {
    flex: 1,
    padding: 16,
    borderRadius: 8
  },
  systemStatLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8
  },
  systemStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937'
  }
});
