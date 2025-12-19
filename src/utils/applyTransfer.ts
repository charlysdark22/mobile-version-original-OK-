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
  usuarios: any[];
  almacenCentral: Producto[];
  locales: Local[];
  movimientos: Movimiento[];
  pedidosMesas: { [mesaId: number]: any };
  ultimoRespaldo: string;
}

export const applyTransfer = (datosIn: AppData, productoId: string, cantidad: number, localId: string): { ok: boolean; datos?: AppData; movimiento?: Movimiento } => {
  if (cantidad <= 0) return { ok: false };
  const datos: AppData = JSON.parse(JSON.stringify(datosIn));

  const prodIndex = datos.almacenCentral.findIndex(p => p.id === productoId);
  if (prodIndex === -1) return { ok: false };

  const prodCentral = datos.almacenCentral[prodIndex];
  if (prodCentral.cantidad < cantidad) return { ok: false };

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

export default applyTransfer;
