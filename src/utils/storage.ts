import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';

// Tipos (copiados/adaptados)
export interface Usuario {
  id: string;
  nombre: string;
  rol: 'superadmin' | 'admin' | 'empleado';
  contraseña: string;
}

export interface Producto {
  id: string;
  nombre: string;
  categoria: 'cocina' | 'cantina';
  cantidad: number;
  unidad: string;
  precioUnitario: number;
  fechaActualizacion: string;
}

export interface Movimiento {
  id: string;
  tipo: 'entrada' | 'salida' | 'consumo' | 'suministro';
  productoId: string;
  cantidad: number;
  origen?: string;
  destino?: string;
  fecha: string;
  mesa?: number;
  productoNombre?: string;
}

export interface Local {
  id: string;
  nombre: string;
  activo: boolean;
  almacen: Producto[];
}

export interface AppData {
  usuarios: Usuario[];
  almacenCentral: Producto[];
  locales: Local[];
  movimientos: Movimiento[];
  pedidosMesas: { [mesaId: number]: { items: { productoId: string; cantidad: number; nombre: string }[]; total: number; activa: boolean } };
  ultimoRespaldo: string;
}

const datosIniciales: AppData = {
  usuarios: [
    { id: 'gerente-001', nombre: 'Gerente', rol: 'superadmin', contraseña: 'admin123' }
  ],
  almacenCentral: [],
  locales: [],
  movimientos: [],
  pedidosMesas: {},
  ultimoRespaldo: new Date().toISOString()
};

const STORAGE_KEY = 'crm-locales-data';
const SAVE_DEBOUNCE_MS = 500;

let _persistedDataCache: AppData | null = null;
let _saveTimer: ReturnType<typeof setTimeout> | null = null;
const BACKUP_FILENAME_PREFIX = 'respaldo-crm-';
const USUARIO_ACTUAL_KEY = 'usuario-actual';

export const cargarDatos = async (): Promise<AppData> => {
  try {
    const json = await AsyncStorage.getItem(STORAGE_KEY);
    if (json) return JSON.parse(json) as AppData;
  } catch (error) {
    console.error('Error al cargar datos (AsyncStorage):', error);
  }
  await guardarDatos(datosIniciales);
  return datosIniciales;
};

export const guardarDatos = async (datos: AppData): Promise<void> => {
  try {
    // Keep in-memory cache and debounce actual disk writes to improve throughput
    _persistedDataCache = datos;
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(async () => {
      try {
        if (_persistedDataCache) {
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_persistedDataCache));
        }
      } catch (error) {
        console.error('Error al guardar datos (AsyncStorage):', error);
      } finally {
        _saveTimer = null;
      }
    }, SAVE_DEBOUNCE_MS);
  } catch (error) {
    console.error('Error al programar guardado de datos:', error);
  }
};

// Force flush pending writes immediately
export const flushGuardarDatos = async (): Promise<void> => {
  if (_saveTimer) {
    clearTimeout(_saveTimer);
    _saveTimer = null;
  }
  try {
    if (_persistedDataCache) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(_persistedDataCache));
    }
  } catch (error) {
    console.error('Error al forzar guardado de datos:', error);
  }
};

export const crearRespaldo = async (): Promise<string> => {
  const datos = await cargarDatos();
  datos.ultimoRespaldo = new Date().toISOString();
  const respaldo = JSON.stringify(datos);
  await AsyncStorage.setItem(`${STORAGE_KEY}-respaldo`, respaldo);
  return respaldo;
};

// Onboarding seen flag
export const obtenerOnboardingVisto = async (): Promise<boolean> => {
  try {
    const v = await AsyncStorage.getItem('onboarding-seen');
    return v === '1';
  } catch (e) {
    return false;
  }
};

export const marcarOnboardingVisto = async (): Promise<void> => {
  try {
    await AsyncStorage.setItem('onboarding-seen', '1');
  } catch (e) {
    // ignore
  }
};

export const resetearOnboarding = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem('onboarding-seen');
  } catch (e) {
    // ignore
  }
};

export const listarLocales = async (): Promise<Local[]> => {
  const datos = await cargarDatos();
  return datos.locales;
};

export const crearLocal = async (nombre: string): Promise<Local> => {
  const datos = await cargarDatos();
  const nuevo: Local = { id: `local-${Date.now()}`, nombre, activo: true, almacen: [] };
  datos.locales.push(nuevo);
  await guardarDatos(datos);
  return nuevo;
};

export const obtenerLocal = async (id: string): Promise<Local | null> => {
  const datos = await cargarDatos();
  return datos.locales.find(l => l.id === id) || null;
};

export const listarAlmacenCentral = async (): Promise<Producto[]> => {
  const datos = await cargarDatos();
  return datos.almacenCentral;
};

export const agregarProductoAlmacenCentral = async (p: Omit<Producto, 'id' | 'fechaActualizacion'>): Promise<Producto> => {
  const datos = await cargarDatos();
  const nuevo: Producto = {
    id: `prod-${Date.now()}`,
    nombre: p.nombre,
    categoria: p.categoria,
    cantidad: p.cantidad,
    unidad: p.unidad,
    precioUnitario: p.precioUnitario,
    fechaActualizacion: new Date().toISOString()
  };
  datos.almacenCentral.push(nuevo);
  await guardarDatos(datos);
  return nuevo;
};

export const eliminarProductoAlmacenCentral = async (id: string): Promise<boolean> => {
  const datos = await cargarDatos();
  const before = datos.almacenCentral.length;
  datos.almacenCentral = datos.almacenCentral.filter(p => p.id !== id);
  await guardarDatos(datos);
  return datos.almacenCentral.length < before;
};

export const actualizarProductoAlmacenCentral = async (producto: Producto): Promise<void> => {
  const datos = await cargarDatos();
  const idx = datos.almacenCentral.findIndex(p => p.id === producto.id);
  if (idx >= 0) {
    producto.fechaActualizacion = new Date().toISOString();
    datos.almacenCentral[idx] = producto;
    await guardarDatos(datos);
  }
};

/**
 * Transferir cantidad desde almacen central hacia un local.
 * Si el producto ya existe en el local, suma la cantidad; si no, lo crea.
 * Reduce la cantidad en almacenCentral y si queda 0 lo elimina.
 */
export const transferirACentralAlocal = async (productoId: string, cantidad: number, localId: string): Promise<boolean> => {
  if (cantidad <= 0) return false;
  const datos = await cargarDatos();
  const res = applyTransfer(datos, productoId, cantidad, localId);
  if (!res.ok || !res.datos) return false;
  await guardarDatos(res.datos);
  return true;
};

/**
 * Pure helper: apply transfer on an AppData object and return the modified data and movimiento.
 * This is useful for unit testing without AsyncStorage side-effects.
 */
export const applyTransfer = (datosIn: AppData, productoId: string, cantidad: number, localId: string): { ok: boolean; datos?: AppData; movimiento?: Movimiento } => {
  if (cantidad <= 0) return { ok: false };
  // shallow clone structure (sufficient for our simple model)
  const datos: AppData = JSON.parse(JSON.stringify(datosIn));

  const prodIndex = datos.almacenCentral.findIndex(p => p.id === productoId);
  if (prodIndex === -1) return { ok: false };

  const prodCentral = datos.almacenCentral[prodIndex];
  if (prodCentral.cantidad < cantidad) return { ok: false };

  // restar del central
  prodCentral.cantidad -= cantidad;
  prodCentral.fechaActualizacion = new Date().toISOString();
  if (prodCentral.cantidad <= 0) {
    datos.almacenCentral.splice(prodIndex, 1);
  } else {
    datos.almacenCentral[prodIndex] = prodCentral;
  }

  const local = datos.locales.find(l => l.id === localId);
  if (!local) return { ok: false };

  const existing = local.almacen.find(p => p.nombre === prodCentral.nombre && p.unidad === prodCentral.unidad && p.categoria === prodCentral.categoria);
  if (existing) {
    existing.cantidad += cantidad;
    existing.fechaActualizacion = new Date().toISOString();
  } else {
    const nuevo: Producto = {
      id: `local-${localId}-${Date.now()}`,
      nombre: prodCentral.nombre,
      categoria: prodCentral.categoria,
      cantidad,
      unidad: prodCentral.unidad,
      precioUnitario: prodCentral.precioUnitario,
      fechaActualizacion: new Date().toISOString()
    };
    local.almacen.push(nuevo);
  }

  const movimiento: Movimiento = {
    id: `mov-${Date.now()}`,
    tipo: 'suministro',
    productoId: prodCentral.id,
    productoNombre: prodCentral.nombre,
    cantidad,
    origen: 'Almacén Central',
    destino: local.nombre,
    fecha: new Date().toISOString()
  };
  datos.movimientos.push(movimiento);

  return { ok: true, datos, movimiento };
};

export const ajustarCantidadLocal = async (localId: string, productoId: string, nuevaCantidad: number): Promise<boolean> => {
  const datos = await cargarDatos();
  const local = datos.locales.find(l => l.id === localId);
  if (!local) return false;
  const idx = local.almacen.findIndex(p => p.id === productoId);
  if (idx === -1) return false;
  if (nuevaCantidad <= 0) {
    local.almacen.splice(idx, 1);
  } else {
    local.almacen[idx].cantidad = nuevaCantidad;
    local.almacen[idx].fechaActualizacion = new Date().toISOString();
  }
  await guardarDatos(datos);
  return true;
};

export const descargarRespaldo = async (): Promise<boolean> => {
  try {
    const respaldo = await crearRespaldo();
    const filename = `${BACKUP_FILENAME_PREFIX}${new Date().toISOString().split('T')[0]}.json`;
    const filepath = `${FileSystem.documentDirectory}${filename}`;
    await FileSystem.writeAsStringAsync(filepath, respaldo, { encoding: FileSystem.EncodingType.UTF8 });
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(filepath);
    }
    return true;
  } catch (error) {
    console.error('Error al descargar respaldo:', error);
    return false;
  }
};

export const cargarRespaldo = async (): Promise<boolean> => {
  try {
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/json' });
    if (res.type === 'success' && res.uri) {
      const contenido = await FileSystem.readAsStringAsync(res.uri, { encoding: FileSystem.EncodingType.UTF8 });
      const datos = JSON.parse(contenido);
      await guardarDatos(datos as AppData);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al cargar respaldo desde archivo:', error);
    return false;
  }
};

export const autenticarUsuario = async (nombre: string, contraseña: string): Promise<Usuario | null> => {
  const datos = await cargarDatos();
  const usuario = datos.usuarios.find(u => u.nombre === nombre && u.contraseña === contraseña);
  return usuario || null;
};

export const obtenerUsuarioActual = async (): Promise<Usuario | null> => {
  try {
    const json = await AsyncStorage.getItem(USUARIO_ACTUAL_KEY);
    if (json) return JSON.parse(json) as Usuario;
  } catch (error) {
    console.error('Error al obtener usuario actual:', error);
  }
  return null;
};

export const guardarUsuarioActual = async (usuario: Usuario): Promise<void> => {
  try {
    await AsyncStorage.setItem(USUARIO_ACTUAL_KEY, JSON.stringify(usuario));
  } catch (error) {
    console.error('Error al guardar usuario actual:', error);
  }
};

export const cerrarSesion = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(USUARIO_ACTUAL_KEY);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  }
};