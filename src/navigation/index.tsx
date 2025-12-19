import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Drawer removed in favor of floating menu navigation

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LocalesListScreen from '../screens/LocalesListScreen';
import AlmacenCentralScreen from '../screens/AlmacenCentralScreen';
import AlmacenLocalScreen from '../screens/AlmacenLocalScreen';
import CocinaScreen from '../screens/CocinaScreen';
import CantinaScreen from '../screens/CantinaScreen';
import MesasPedidosScreen from '../screens/MesasPedidosScreen';
import InformesScreen from '../screens/InformesScreen';
import ConfiguracionRespaldoScreen from '../screens/ConfiguracionRespaldoScreen';
import ConfiguracionScreen from '../screens/ConfiguracionScreen';
import LocalDetailScreen from '../screens/LocalDetailScreen';

const Stack = createNativeStackNavigator();
function MainStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Locales" component={LocalesListScreen} />
      <Stack.Screen name="Almacén General" component={AlmacenCentralScreen} />
      <Stack.Screen name="Informes" component={InformesScreen} />
      <Stack.Screen name="Configuración" component={ConfiguracionScreen} />
      {/* Detail routes */}
      <Stack.Screen name="LocalDetail" component={LocalDetailScreen} />
      <Stack.Screen name="Mesas" component={MesasPedidosScreen} />
      <Stack.Screen name="Cocina" component={CocinaScreen} />
      <Stack.Screen name="Cantina" component={CantinaScreen} />
      <Stack.Screen name="Inventario" component={AlmacenLocalScreen} />
    </Stack.Navigator>
  );
}

export default function AppNavigation() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Main" component={MainStack} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
