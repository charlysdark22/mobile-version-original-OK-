import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppButton from '../components/AppButton';
import { useTheme } from '../context/ThemeContext';
import Input from '../components/Input';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../types/navigation';
import { autenticarUsuario, guardarUsuarioActual, resetearOnboarding } from '../utils/storage';

export default function LoginScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { COLORS } = useTheme();
  const [form, setForm] = useState({ usuario: '', password: '' });
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    if (!form.usuario.trim() || !form.password.trim()) {
      Alert.alert('Error', 'Por favor ingrese usuario y contraseña');
      return;
    }
    setLoading(true);
    const user = await autenticarUsuario(form.usuario.trim(), form.password);
    setLoading(false);
    if (user) {
      await guardarUsuarioActual(user);
      // Resetear onboarding para mostrar landing page al iniciar sesión
      await resetearOnboarding();
      // @ts-ignore
      navigation.replace('Main');
    } else {
      Alert.alert('Error', 'Credenciales inválidas');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: COLORS.background }]}> 
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            accessibilityLabel="App Logo"
            resizeMode="contain"
            style={styles.headerImg}
            source={{ uri: 'https://assets.withfra.me/SignIn.2.png' }} />

          <Text style={styles.title}>Iniciar Sesión</Text>
          <Text style={styles.subtitle}>Sistema de Gestión de Locales</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Usuario</Text>
            <Input
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="Ingrese su usuario"
              placeholderTextColor="#6b7280"
              value={form.usuario}
              onChangeText={(usuario) => setForm({ ...form, usuario })}
              style={styles.inputControl}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <Input
              autoCorrect={false}
              placeholder="Ingrese su contraseña"
              placeholderTextColor="#6b7280"
              secureTextEntry
              value={form.password}
              onChangeText={(password) => setForm({ ...form, password })}
              style={styles.inputControl}
            />
          </View>

          <View style={styles.formAction}>
            <AppButton title={loading ? 'Iniciando sesión...' : 'Iniciar Sesión'} onPress={onLogin} style={styles.btn} />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
    padding: 24,
  },
  title: {
    fontSize: 31,
    fontWeight: '700',
    color: '#1D2A32',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#929292',
  },
  /** Header */
  header: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 36,
  },
  headerImg: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    marginBottom: 36,
  },
  /** Form */
  form: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: 0,
  },
  formAction: {
    marginTop: 4,
    marginBottom: 16,
  },
  formLink: {
    fontSize: 16,
    fontWeight: '600',
    color: '#075eec',
    textAlign: 'center',
  },
  formFooter: {
    paddingVertical: 24,
    fontSize: 15,
    fontWeight: '600',
    color: '#222',
    textAlign: 'center',
    letterSpacing: 0.15,
  },
  /** Input */
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#222',
    marginBottom: 8,
  },
  inputControl: {
    height: 50,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    borderRadius: 12,
    fontSize: 15,
    fontWeight: '500',
    color: '#222',
    borderWidth: 1,
    borderColor: '#C9D3DB',
    borderStyle: 'solid',
  },
  /** Button */
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderWidth: 1,
    backgroundColor: '#075eec',
    borderColor: '#075eec',
  },
  btnText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600',
    color: '#fff',
  }
});