import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, ActivityIndicator, Animated, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MainStackParamList } from '../types/navigation';
import { cargarDatos, obtenerOnboardingVisto, marcarOnboardingVisto } from '../utils/storage';
import { PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import Card from '../components/Card';
import AppButton from '../components/AppButton';
import Header from '../components/Header';
import { useTheme } from '../context/ThemeContext';
import { useI18n } from '../context/I18nContext';
import FloatingMenu from '../components/FloatingMenu';

const screenWidth = Dimensions.get('window').width - 32;

export default function DashboardScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MainStackParamList>>();
  const [totales, setTotales] = useState({ 
    almacenCentral: 0, 
    valorInventario: 0, 
    cafeAvellaneda: 0, 
    alertasStock: 0,
    cocinaProductos: 0,
    cantinaProductos: 0,
    movimientosHoy: 0,
    localesActivos: 0,
    totalLocales: 0
  });
  const [pieData, setPieData] = useState<any[]>([]);
  const [ultimoRespaldo, setUltimoRespaldo] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { COLORS } = useTheme();
  const { t, locale, setLocale } = useI18n();

  const stepAnim = useRef(new Animated.Value(0)).current; // used to slide between steps
  const fadeAnim = useRef(new Animated.Value(1)).current; // fade out onboarding when finishing
  const [step, setStep] = useState(0);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      const datos = await cargarDatos();
      
      // Almacén Central - unidades totales
      const almacenCentralTotal = datos.almacenCentral.reduce((sum, p) => sum + p.cantidad, 0);
      
      // Valor Inventario - suma de (cantidad * precioUnitario) de todos los productos
      const valorInventario = datos.almacenCentral.reduce((sum, p) => sum + (p.cantidad * p.precioUnitario), 0) +
        datos.locales.reduce((sum, l) => 
          sum + l.almacen.reduce((s, p) => s + (p.cantidad * p.precioUnitario), 0), 0);
      
      // Cafe Avellaneda - unidades en local
      const cafeAvellaneda = datos.locales.find(l => l.nombre === 'Cafe Avellaneda');
      const cafeAvellanedaTotal = cafeAvellaneda ? cafeAvellaneda.almacen.reduce((sum, p) => sum + p.cantidad, 0) : 0;
      
      // Alertas Stock - productos con cantidad <= 5
      const allProducts = [...datos.almacenCentral, ...datos.locales.flatMap(l => l.almacen)];
      const alertasStock = allProducts.filter(p => p.cantidad <= 5).length;
      
      // Productos por categoría
      const cocinaProductos = datos.almacenCentral.filter(p => p.categoria === 'cocina').length +
        datos.locales.reduce((sum, l) => sum + l.almacen.filter(p => p.categoria === 'cocina').length, 0);
      const cantinaProductos = datos.almacenCentral.filter(p => p.categoria === 'cantina').length +
        datos.locales.reduce((sum, l) => sum + l.almacen.filter(p => p.categoria === 'cantina').length, 0);
      
      const totalProductos = cocinaProductos + cantinaProductos;
      const cocinaPorcentaje = totalProductos > 0 ? Math.round((cocinaProductos / totalProductos) * 100) : 0;
      const cantinaPorcentaje = totalProductos > 0 ? Math.round((cantinaProductos / totalProductos) * 100) : 0;
      
      // Movimientos hoy
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const movimientosHoy = datos.movimientos?.filter(m => {
        const fechaMov = new Date(m.fecha);
        fechaMov.setHours(0, 0, 0, 0);
        return fechaMov.getTime() === hoy.getTime();
      }).length || 0;
      
      // Locales activos
      const localesActivos = datos.locales.filter(l => l.activo).length;
      
      setTotales({
        almacenCentral: almacenCentralTotal,
        valorInventario,
        cafeAvellaneda: cafeAvellanedaTotal,
        alertasStock,
        cocinaProductos,
        cantinaProductos,
        movimientosHoy,
        localesActivos,
        totalLocales: datos.locales.length
      });

      // Pie chart data
      const counts: { [k: string]: number } = { cocina: 0, cantina: 0 };
      datos.almacenCentral.forEach(p => counts[p.categoria] += p.cantidad);
      datos.locales.forEach(l => l.almacen.forEach(p => counts[p.categoria] += p.cantidad));
      setPieData([
        { name: 'Cocina', population: counts.cocina, color: '#f39c12', legendFontColor: '#7F7F7F', legendFontSize: 12 },
        { name: 'Cantina', population: counts.cantina, color: '#3498db', legendFontColor: '#7F7F7F', legendFontSize: 12 }
      ]);
      
      // Último respaldo
      setUltimoRespaldo(datos.ultimoRespaldo || new Date().toISOString());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const visto = await obtenerOnboardingVisto();
      setShowWelcome(!visto);
      loadMetrics();
    })();
  }, [loadMetrics]);

  useFocusEffect(
    React.useCallback(() => {
      loadMetrics();
    }, [loadMetrics])
  );

  if (showWelcome) {
    return (
      <SafeAreaView style={[styles.welcomeSafe, { backgroundColor: COLORS.background }]}>
        <ScrollView 
          contentContainerStyle={styles.welcomeScrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.hero}>
            <View style={[styles.heroIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
              <MaterialIcons name="store" size={64} color={COLORS.primary} />
            </View>
          </View>
          <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
            <View style={styles.contentHeader}>
              <Text style={[styles.welcomeTitle, { color: COLORS.text }]}>Bienvenido</Text>
              <Text style={[styles.welcomeSubtitle, { color: COLORS.muted }]}>Sistema de Gestión de Locales</Text>
            </View>

            {/* Stepper */}
            <View style={styles.stepper}>
              {[0, 1, 2].map(i => (
                <View 
                  key={i} 
                  style={[
                    styles.stepperDot, 
                    { backgroundColor: i === step ? COLORS.primary : '#E5E7EB' }
                  ]} 
                />
              ))}
            </View>

            <Animated.View 
              style={[
                styles.stepsContainer, 
                { 
                  transform: [{ 
                    translateX: stepAnim.interpolate({ 
                      inputRange: [0, 1, 2], 
                      outputRange: [0, -Dimensions.get('window').width, -Dimensions.get('window').width * 2] 
                    }) 
                  }] 
                }
              ]}
            >
              <Card style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: COLORS.primary + '15' }]}>
                  <MaterialIcons name="dashboard" size={32} color={COLORS.primary} />
                </View>
                <Text style={[styles.stepTitle, { color: COLORS.text }]}>Dashboard Principal</Text>
                <Text style={[styles.stepDesc, { color: COLORS.muted }]}>
                  Visualiza el resumen general del sistema, métricas clave y actividad del sistema
                </Text>
              </Card>
              
              <Card style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#3498db' + '15' }]}>
                  <MaterialIcons name="inventory" size={32} color="#3498db" />
                </View>
                <Text style={[styles.stepTitle, { color: COLORS.text }]}>Gestión de Inventario</Text>
                <Text style={[styles.stepDesc, { color: COLORS.muted }]}>
                  Administra el almacén central, locales y realiza transferencias entre ellos
                </Text>
              </Card>
              
              <Card style={styles.stepCard}>
                <View style={[styles.stepIcon, { backgroundColor: '#22C55E' + '15' }]}>
                  <MaterialIcons name="assessment" size={32} color="#22C55E" />
                </View>
                <Text style={[styles.stepTitle, { color: COLORS.text }]}>Reportes e Informes</Text>
                <Text style={[styles.stepDesc, { color: COLORS.muted }]}>
                  Genera informes detallados, visualiza tendencias y analiza el rendimiento
                </Text>
              </Card>
            </Animated.View>

            <View style={styles.welcomeActions}>
              <View style={styles.welcomeButtons}>
                <TouchableOpacity 
                  onPress={async () => { 
                    await marcarOnboardingVisto(); 
                    setShowWelcome(false); 
                  }}
                  style={styles.skipButton}
                >
                  <Text style={[styles.skipText, { color: COLORS.muted }]}>Omitir</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => {
                    if (step < 2) {
                      const next = step + 1;
                      Animated.timing(stepAnim, { toValue: next, duration: 300, useNativeDriver: true }).start();
                      setStep(next);
                    } else {
                      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(async () => {
                        await marcarOnboardingVisto();
                        setShowWelcome(false);
                      });
                    }
                  }}
                  style={styles.nextButton}
                >
                  <View style={[styles.nextButtonInner, { backgroundColor: COLORS.primary }]}> 
                    <Text style={styles.nextButtonText}>
                      {step < 2 ? 'Siguiente' : 'Comenzar'}
                    </Text>
                    <MaterialIcons name={step < 2 ? 'arrow-forward' : 'check'} size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header title="Dashboard Principal" />
      <View style={styles.headerSection}>
        <Text style={[styles.subtitle, { color: COLORS.muted }]}>Resumen general del sistema de gestión</Text>
      </View>
      
      {/* Floating menu anchored to bottom-right for quick actions */}
      <FloatingMenu items={[
        { key: 'almacen', title: 'Almacén', icon: { name: 'inventory' }, onPress: () => navigation.navigate('Almacén General') },
        { key: 'locales', title: 'Locales', icon: { name: 'store' }, onPress: () => navigation.navigate('Locales') },
        { key: 'informes', title: 'Informes', icon: { name: 'bar-chart' }, onPress: () => navigation.navigate('Informes') },
        { key: 'config', title: 'Configuración', icon: { name: 'settings' }, onPress: () => navigation.navigate('Configuración') }
      ]} />
      
      {/* Top Row - Key Metric Cards */}
      <View style={styles.topCardsRow}>
        {/* Almacén Central */}
        <Card style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#3498db' }]}>
            <MaterialIcons name="inventory" size={24} color="#fff" />
          </View>
          <Text style={styles.metricValue}>{totales.almacenCentral}</Text>
          <Text style={styles.metricLabel}>Almacén Central</Text>
          <Text style={styles.metricSubLabel}>unidades totales</Text>
          <View style={styles.trendUp}>
            <MaterialIcons name="trending-up" size={14} color="#22C55E" />
            <Text style={styles.trendText}>+12%</Text>
          </View>
        </Card>
        
        {/* Valor Inventario */}
        <Card style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#22C55E' }]}>
            <MaterialIcons name="show-chart" size={24} color="#fff" />
          </View>
          <Text style={styles.metricValue}>${totales.valorInventario.toFixed(2)}</Text>
          <Text style={styles.metricLabel}>Valor Inventario</Text>
          <Text style={styles.metricSubLabel}>valor total</Text>
          <View style={styles.trendUp}>
            <MaterialIcons name="trending-up" size={14} color="#22C55E" />
            <Text style={styles.trendText}>+8%</Text>
          </View>
        </Card>
      </View>
      
      <View style={styles.topCardsRow}>
        {/* Cafe Avellaneda */}
        <Card style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#9b59b6' }]}>
            <MaterialIcons name="store" size={24} color="#fff" />
          </View>
          <Text style={styles.metricValue}>{totales.cafeAvellaneda}</Text>
          <Text style={styles.metricLabel}>Cafe Avellaneda</Text>
          <Text style={styles.metricSubLabel}>unidades en local</Text>
          <View style={styles.trendDown}>
            <MaterialIcons name="trending-down" size={14} color="#EF4444" />
            <Text style={[styles.trendText, { color: '#EF4444' }]}>-3%</Text>
          </View>
        </Card>
        
        {/* Alertas Stock */}
        <Card style={styles.metricCard}>
          <View style={[styles.iconBox, { backgroundColor: '#f39c12' }]}>
            <MaterialIcons name="warning" size={24} color="#fff" />
          </View>
          <Text style={[styles.attentionTitle, { color: '#f39c12' }]}>Atención</Text>
          <Text style={styles.metricValue}>{totales.alertasStock}</Text>
          <Text style={styles.metricLabel}>Alertas Stock</Text>
          <Text style={styles.metricSubLabel}>productos bajo stock</Text>
        </Card>
      </View>
      
      {/* Bottom Section */}
      <View style={styles.bottomSection}>
        {/* Product Categories */}
        <Card style={styles.categoryCard}>
          <Text style={styles.sectionTitle}>Categorías de Productos</Text>
          
          {/* Cocina */}
          <View style={styles.categoryItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#f39c12' }]}>
              <MaterialIcons name="inventory" size={20} color="#fff" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>Cocina</Text>
              <Text style={styles.categoryCount}>{totales.cocinaProductos} productos</Text>
            </View>
            <View style={styles.categoryBarContainer}>
              <View style={[styles.categoryBar, { 
                width: `${totales.cocinaProductos + totales.cantinaProductos > 0 ? Math.round((totales.cocinaProductos / (totales.cocinaProductos + totales.cantinaProductos)) * 100) : 0}%`,
                backgroundColor: '#f39c12'
              }]} />
            </View>
            <Text style={[styles.categoryPercent, { color: '#f39c12' }]}>
              {totales.cocinaProductos + totales.cantinaProductos > 0 ? Math.round((totales.cocinaProductos / (totales.cocinaProductos + totales.cantinaProductos)) * 100) : 0}%
            </Text>
          </View>
          
          {/* Cantina */}
          <View style={styles.categoryItem}>
            <View style={[styles.categoryIcon, { backgroundColor: '#3498db' }]}>
              <MaterialIcons name="inventory" size={20} color="#fff" />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={styles.categoryName}>Cantina</Text>
              <Text style={styles.categoryCount}>{totales.cantinaProductos} productos</Text>
            </View>
            <View style={styles.categoryBarContainer}>
              <View style={[styles.categoryBar, { 
                width: `${totales.cocinaProductos + totales.cantinaProductos > 0 ? Math.round((totales.cantinaProductos / (totales.cocinaProductos + totales.cantinaProductos)) * 100) : 0}%`,
                backgroundColor: '#3498db'
              }]} />
            </View>
            <Text style={[styles.categoryPercent, { color: '#3498db' }]}>
              {totales.cocinaProductos + totales.cantinaProductos > 0 ? Math.round((totales.cantinaProductos / (totales.cocinaProductos + totales.cantinaProductos)) * 100) : 0}%
            </Text>
          </View>
        </Card>
        
        {/* System Activity */}
        <Card style={styles.activityCard}>
          <Text style={styles.sectionTitle}>Actividad del Sistema</Text>
          
          <View style={styles.activityItem}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityLabel}>Movimientos hoy</Text>
              <Text style={styles.activitySubLabel}>Registros de inventario</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.badgeText, { color: '#1976d2' }]}>{totales.movimientosHoy}</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityLabel}>Locales activos</Text>
              <Text style={styles.activitySubLabel}>De {totales.totalLocales} locales totales</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[styles.badgeText, { color: '#388e3c' }]}>{totales.localesActivos}</Text>
            </View>
          </View>
          
          <View style={styles.activityItem}>
            <View style={styles.activityInfo}>
              <Text style={styles.activityLabel}>Último respaldo</Text>
              <Text style={styles.activitySubLabel}>
                {ultimoRespaldo ? new Date(ultimoRespaldo).toLocaleString('es-ES', { 
                  day: '2-digit', 
                  month: '2-digit', 
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }) : 'N/A'}
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  /* Welcome Hero styles */
  welcomeSafe: { flex: 1 },
  welcomeScrollContent: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  hero: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  heroIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { 
    flex: 1, 
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  contentHeader: { 
    alignItems: 'center',
    marginBottom: 32,
  },
  welcomeTitle: { 
    fontSize: 32, 
    fontWeight: '800', 
    textAlign: 'center', 
    marginBottom: 8,
  },
  welcomeSubtitle: { 
    fontSize: 16, 
    fontWeight: '500', 
    textAlign: 'center',
  },
  stepper: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 32,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  stepsContainer: {
    flexDirection: 'row',
    width: Dimensions.get('window').width * 3,
    marginBottom: 32,
  },
  stepCard: {
    width: Dimensions.get('window').width - 48,
    marginHorizontal: 24,
    padding: 24,
    alignItems: 'center',
  },
  stepIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  stepDesc: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  welcomeActions: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  welcomeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    marginLeft: 16,
  },
  nextButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },

  container: { 
    padding: 16, 
    backgroundColor: '#f4f6fb', 
    paddingBottom: 100,
  },
  headerSection: { marginBottom: 20 },
  mainTitle: { fontSize: 24, fontWeight: '800', marginBottom: 4 },
  subtitle: { fontSize: 14, fontWeight: '400' },
  
  topCardsRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    marginBottom: 12,
    gap: 12
  },
  metricCard: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    minHeight: 140
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4
  },
  metricLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  metricSubLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 8
  },
  attentionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4
  },
  trendUp: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  trendDown: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4
  },
  trendText: {
    fontSize: 12,
    color: '#22C55E',
    marginLeft: 4,
    fontWeight: '600'
  },
  
  bottomSection: {
    marginTop: 12
  },
  categoryCard: {
    padding: 16,
    marginBottom: 12
  },
  activityCard: {
    padding: 16
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    position: 'relative'
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  categoryInfo: {
    flex: 1
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  categoryCount: {
    fontSize: 12,
    color: '#6B7280'
  },
  categoryBarContainer: {
    flex: 1,
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    marginHorizontal: 12,
    overflow: 'hidden'
  },
  categoryBar: {
    height: '100%',
    borderRadius: 4
  },
  categoryPercent: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 40,
    textAlign: 'right'
  },
  
  activityItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16
  },
  activityInfo: {
    flex: 1
  },
  activityLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2
  },
  activitySubLabel: {
    fontSize: 12,
    color: '#6B7280'
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    minWidth: 40,
    alignItems: 'center'
  },
  badgeText: {
    fontSize: 14,
    fontWeight: '700'
  }
});