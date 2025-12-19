import React, { useState, useRef, useEffect } from 'react';
/**
 * FloatingMenu
 * - Radial/fan floating action menu used across the app (Dashboard)
 * - Features: animated fan, per-item press scale animation, haptic feedback (Vibration), and accessibility labels
 * - Usage: <FloatingMenu items={[{ key: 'x', title: 'Title', icon: { name: 'inventory', color: '#ff6b6b' }, onPress: () => {} }]} />
 */
import { View, TouchableOpacity, Text, StyleSheet, Modal, Animated, TouchableWithoutFeedback, Vibration, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { MaterialIcons } from '@expo/vector-icons';

export type FloatingMenuItem = { key: string; title: string; icon?: { name: React.ComponentProps<typeof MaterialIcons>['name']; color?: string }; onPress: () => void };

export default function FloatingMenu({ items = [], size = 64 }: { items?: FloatingMenuItem[]; size?: number }) {
  const { COLORS } = useTheme();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  // per-item press animations (kept in a ref so we can keep stable Animated.Values)
  const pressAnimsRef = useRef<Animated.Value[]>(items.map(() => new Animated.Value(1)));
  useEffect(() => {
    // keep the array length in sync with items
    pressAnimsRef.current = items.map((_, i) => pressAnimsRef.current[i] || new Animated.Value(1));
  }, [items]);

  const toggle = () => {
    if (open) {
      Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => setOpen(false));
    } else {
      setOpen(true);
      // small vibration on open (fallback to Vibration API)
      try { Vibration.vibrate(8); } catch (e) {}
      Animated.timing(anim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    }
  };

  const backdropOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.45] });

  // fan layout: compute angle spread from -90 (up) to -180 (left)
  const radius = 120; // distance from FAB

  return (
    <View pointerEvents="box-none" style={styles.container}>
      <Modal visible={open} transparent animationType="none" onRequestClose={toggle}>
        <TouchableWithoutFeedback onPress={toggle}>
          <Animated.View style={[styles.backdrop, { backgroundColor: '#000', opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Fan items */}
        <View style={styles.fanRoot} pointerEvents="box-none">
          {items.map((it, idx) => {
            const count = items.length;
            const step = count > 1 ? 90 / (count - 1) : 0; // degrees
            const angleDeg = -90 - (step * idx);
            const angle = (angleDeg * Math.PI) / 180;
            const toX = Math.cos(angle) * radius;
            const toY = Math.sin(angle) * radius;

            const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -toX] });
            const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [0, -toY] });
            const baseScale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });
            const pressAnim = pressAnimsRef.current[idx];

            // determine background color for circle; prefer explicit icon.color (treat as bg) otherwise palette
            const palette = ['#ff6b6b', '#ff9f43', '#1dd1a1', '#54a0ff', '#5f27cd'];
            const bgColor = it.icon?.color || palette[idx % palette.length];

            return (
              <Animated.View key={it.key} style={[styles.fanItem, { transform: [{ translateX }, { translateY }, { scale: Animated.multiply(baseScale, pressAnim) }] }]}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  accessibilityRole="button"
                  accessible
                  accessibilityLabel={it.title}
                  onPressIn={() => { Animated.spring(pressAnim, { toValue: 0.92, useNativeDriver: true }).start(); try { Vibration.vibrate(6); } catch (e) {} }}
                  onPressOut={() => { Animated.spring(pressAnim, { toValue: 1, useNativeDriver: true }).start(); }}
                  style={[styles.fanButton, { backgroundColor: bgColor }]}
                  onPress={() => { try { Vibration.vibrate(10); } catch (e) {}; toggle(); it.onPress(); }}
                >
                  {it.icon ? <MaterialIcons name={it.icon.name} size={20} color={'#fff'} /> : null}
                </TouchableOpacity>
                <View style={styles.labelWrap} pointerEvents="none">
                  <Text style={[styles.fanLabel, { color: COLORS.text }]} numberOfLines={1}>{it.title}</Text>
                </View>
              </Animated.View>
            );
          })}
        </View>
      </Modal>

      <TouchableOpacity
        activeOpacity={0.85}
        accessibilityRole="button"
        accessible
        accessibilityLabel={open ? 'Cerrar menú' : 'Abrir menú'}
        accessibilityHint="Abre accesos rápidos"
        onPress={toggle}
        style={[styles.fab, { width: size, height: size, borderRadius: size / 2, backgroundColor: COLORS.primary }]}
      >
        <MaterialIcons name={open ? 'close' : 'menu'} size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'absolute', right: 16, bottom: 24, alignItems: 'center', justifyContent: 'flex-end' },
  fab: { alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 6 } },
  backdrop: { ...StyleSheet.absoluteFillObject },
  fanRoot: { position: 'absolute', right: 32, bottom: 100, alignItems: 'flex-end' },
  fanItem: { position: 'absolute', alignItems: 'center' },
  fanButton: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 } },
  labelWrap: { position: 'absolute', right: 68, top: 16, minWidth: 80, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.9)' },
  fanLabel: { fontWeight: '600' }
});
