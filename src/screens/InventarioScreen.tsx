import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList } from 'react-native';
import { cargarDatos, obtenerLocal } from '../utils/storage';
import Header from '../components/Header';
import Card from '../components/Card';
import Input from '../components/Input';

export default function InventarioScreen({ route }: any) {
  const [filter, setFilter] = useState('');
  const [data, setData] = useState<Record<string, { cantidad: number; unidad?: string; categorias: Set<string> }>>({});
  const [titlePrefix, setTitlePrefix] = useState('');

  useEffect(() => {
    const load = async () => {
      const datos = await cargarDatos();
      if (route?.params?.localId) {
        const l = await obtenerLocal(route.params.localId);
        setTitlePrefix(l?.nombre ? `${l.nombre} — ` : '');
        // restrict data to that local
        const mapLoc: { [k: string]: { cantidad: number; unidad?: string; categorias: Set<string> } } = {};
        l?.almacen.forEach(p => {
          if (!mapLoc[p.nombre]) mapLoc[p.nombre] = { cantidad: 0, unidad: p.unidad, categorias: new Set() };
          mapLoc[p.nombre].cantidad += p.cantidad;
          mapLoc[p.nombre].categorias.add(p.categoria);
        });
        setData(mapLoc);
        return;
      }
      // aggregate by product name
      const map: { [k: string]: { cantidad: number; unidad?: string; categorias: Set<string> } } = {};
      datos.almacenCentral.forEach(p => {
        if (!map[p.nombre]) map[p.nombre] = { cantidad: 0, unidad: p.unidad, categorias: new Set() };
        map[p.nombre].cantidad += p.cantidad;
        map[p.nombre].categorias.add(p.categoria);
      });
      datos.locales.forEach(l => l.almacen.forEach(p => {
        if (!map[p.nombre]) map[p.nombre] = { cantidad: 0, unidad: p.unidad, categorias: new Set() };
        map[p.nombre].cantidad += p.cantidad;
        map[p.nombre].categorias.add(p.categoria);
      }));
      setData(map);
    };
    load();
  }, [route?.params?.localId, route?.params?._refresh]);

  const items = useMemo(() => {
    return Object.entries(data).map(([nombre, v]) => ({ nombre, cantidad: v.cantidad, unidad: v.unidad, categorias: Array.from(v.categorias) } as { nombre: string; cantidad: number; unidad?: string; categorias: string[] }));
  }, [data]);

  const filtered = useMemo(() => items.filter(i => i.nombre.toLowerCase().includes(filter.toLowerCase())), [items, filter]);

  const lowStock = filtered.filter(i => i.cantidad <= 5);

  return (
    <View style={styles.container}>
      <Header title={`${titlePrefix}Inventario`} />
      <Card style={{ marginTop: 8 }}>
        <Input placeholder="Buscar producto" value={filter} onChangeText={setFilter} style={styles.input} />
        <Text style={{ fontWeight: '700', marginTop: 8 }}>Resumen</Text>
        <Text>Total productos distintos: {items.length}</Text>
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>Resultados</Text>
        <FlatList data={filtered} keyExtractor={i => i.nombre} renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomColor: '#eee', borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: '700' }}>{item.nombre}</Text>
            <Text>{item.cantidad} {item.unidad} · Categorías: {item.categorias.join(', ')}</Text>
          </View>
        )} />
      </Card>

      <Card style={{ marginTop: 12 }}>
        <Text style={{ fontWeight: '700', marginBottom: 8 }}>{'Bajo stock (<=5)'}</Text>
        <FlatList data={lowStock} keyExtractor={i => i.nombre} renderItem={({ item }) => (
          <View style={{ padding: 8, borderBottomColor: '#eee', borderBottomWidth: 1 }}>
            <Text style={{ fontWeight: '700' }}>{item.nombre}</Text>
            <Text>{item.cantidad} {item.unidad}</Text>
          </View>
        )} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, padding: 16 }, title: { fontSize: 18, fontWeight: '700' }, input: { width: '100%', height: 40, borderColor: '#ccc', borderWidth: 1, paddingHorizontal: 8, marginBottom: 8, borderRadius: 4 } });
