import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { obtenerUsuarioActual, cerrarSesion } from '../utils/storage';

const { width } = Dimensions.get('window');

interface MenuItem {
  key: string;
  title: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  route: string;
  params?: any;
  color?: string;
  section?: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', title: 'Dashboard Principal', icon: 'dashboard', route: 'Dashboard', section: 'Principal' },
  { key: 'almacen', title: 'Almacén Central', icon: 'inventory', route: 'Almacén General', section: 'Principal' },
  { key: 'locales', title: 'Gestión de Locales', icon: 'store', route: 'Locales', section: 'Principal' },
  { key: 'informes', title: 'Informes e Inventarios', icon: 'assessment', route: 'Informes', section: 'Principal' },
  { key: 'config', title: 'Configuración', icon: 'settings', route: 'Configuración', section: 'Sistema' },
];

export default function NavigationMenu() {
  const { COLORS, METRICS } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const [visible, setVisible] = useState(false);
  const [usuario, setUsuario] = useState<string>('');
  const slideAnim = React.useRef(new Animated.Value(-width * 0.8)).current;
  const backdropOpacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadUsuario();
  }, []);

  const loadUsuario = async () => {
    const user = await obtenerUsuarioActual();
    if (user) {
      setUsuario(user.nombre);
    }
  };

  const openMenu = () => {
    setVisible(true);
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const closeMenu = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -width * 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
    });
  };

  const handleNavigation = (item: MenuItem) => {
    closeMenu();
    setTimeout(() => {
      if (item.params) {
        navigation.navigate(item.route, item.params);
      } else {
        navigation.navigate(item.route);
      }
    }, 300);
  };

  const handleLogout = async () => {
    closeMenu();
    await cerrarSesion();
    setTimeout(() => {
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    }, 300);
  };

  const isActive = (itemRoute: string) => {
    return route.name === itemRoute;
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    const section = item.section || 'Otros';
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  return (
    <>
      <TouchableOpacity
        style={styles.menuButton}
        onPress={openMenu}
        activeOpacity={0.7}
      >
        <MaterialIcons name="menu" size={24} color={COLORS.text} />
      </TouchableOpacity>

      <Modal
        visible={visible}
        transparent
        animationType="none"
        onRequestClose={closeMenu}
      >
        <View style={styles.modalContainer}>
          <TouchableWithoutFeedback onPress={closeMenu}>
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: backdropOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            />
          </TouchableWithoutFeedback>

          <Animated.View
            style={[
              styles.menuContainer,
              {
                transform: [{ translateX: slideAnim }],
                backgroundColor: COLORS.surface,
              },
            ]}
          >
            <ScrollView 
              style={styles.menuContent} 
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.menuContentContainer}
            >
              {/* Header */}
              <View style={[styles.menuHeader, { backgroundColor: COLORS.primary }]}>
                <View style={styles.userInfo}>
                  <View style={[styles.avatar, { backgroundColor: 'rgba(255, 255, 255, 0.25)' }]}>
                    <MaterialIcons name="person" size={28} color="#fff" />
                  </View>
                  <View style={styles.userDetails}>
                    <Text style={styles.userName}>{usuario || 'Usuario'}</Text>
                    <Text style={styles.userRole}>Sistema de Gestión</Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={closeMenu} 
                  style={styles.closeButton}
                  activeOpacity={0.7}
                >
                  <View style={[styles.closeButtonBg, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                    <MaterialIcons name="close" size={20} color="#fff" />
                  </View>
                </TouchableOpacity>
              </View>

              {/* Menu Items */}
              <View style={styles.menuItems}>
                {Object.entries(groupedItems).map(([section, items]) => (
                  <View key={section} style={styles.section}>
                    <Text style={[styles.sectionTitle, { color: COLORS.muted }]}>
                      {section}
                    </Text>
                    {items.map((item) => {
                      const active = isActive(item.route);
                      return (
                        <TouchableOpacity
                          key={item.key}
                          style={[
                            styles.menuItem,
                            active && { backgroundColor: COLORS.primary + '10' },
                          ]}
                          onPress={() => handleNavigation(item)}
                          activeOpacity={0.6}
                        >
                          <View
                            style={[
                              styles.menuItemIcon,
                              {
                                backgroundColor: active
                                  ? COLORS.primary
                                  : COLORS.background,
                              },
                            ]}
                          >
                            <MaterialIcons
                              name={item.icon}
                              size={22}
                              color={active ? '#fff' : COLORS.primary}
                            />
                          </View>
                          <Text
                            style={[
                              styles.menuItemText,
                              {
                                color: active ? COLORS.primary : COLORS.text,
                                fontWeight: active ? '700' : '500',
                              },
                            ]}
                          >
                            {item.title}
                          </Text>
                          {active && (
                            <View
                              style={[
                                styles.activeIndicator,
                                { backgroundColor: COLORS.primary },
                              ]}
                            />
                          )}
                          {!active && (
                            <MaterialIcons 
                              name="chevron-right" 
                              size={20} 
                              color={COLORS.muted} 
                              style={styles.chevron}
                            />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                ))}
              </View>

              {/* Logout Button */}
              <View style={styles.logoutSection}>
                <View style={[styles.divider, { backgroundColor: COLORS.transparentBorder }]} />
                <TouchableOpacity
                  style={styles.logoutButton}
                  onPress={handleLogout}
                  activeOpacity={0.7}
                >
                  <View style={[styles.menuItemIcon, { backgroundColor: '#EF4444' + '15' }]}>
                    <MaterialIcons name="logout" size={22} color="#EF4444" />
                  </View>
                  <Text style={[styles.logoutText, { color: '#EF4444' }]}>
                    Cerrar Sesión
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  menuContainer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: width * 0.8,
    maxWidth: 320,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 4, height: 0 },
    shadowRadius: 12,
    elevation: 12,
  },
  menuContent: {
    flex: 1,
  },
  menuContentContainer: {
    paddingBottom: 20,
  },
  menuHeader: {
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  userRole: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItems: {
    paddingVertical: 12,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    position: 'relative',
    marginHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 15,
    flex: 1,
    letterSpacing: 0.2,
  },
  activeIndicator: {
    position: 'absolute',
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.5,
  },
  logoutSection: {
    marginTop: 8,
    paddingTop: 8,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginBottom: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    borderRadius: 12,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});
