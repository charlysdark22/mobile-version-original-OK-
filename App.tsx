import 'react-native-gesture-handler';
import React from 'react';
import AppNavigation from './src/navigation';
import Toast from 'react-native-toast-message';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { I18nProvider } from './src/context/I18nContext';

export default function App() {
  const { COLORS } = useTheme();
  return (
    <ThemeProvider>
      <I18nProvider>
      <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.background }]}> 
        <StatusBar barStyle="dark-content" />
        <AppNavigation />
        <Toast />
      </SafeAreaView>
      </I18nProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1 } });