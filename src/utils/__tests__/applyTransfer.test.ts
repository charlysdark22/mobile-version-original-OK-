import assert from 'assert';
import { applyTransfer, AppData } from '../applyTransfer';

// Simple unit tests for applyTransfer (pure function)
(() => {
  console.log('Running applyTransfer tests...');

  const datos: AppData = {
    usuarios: [],
    almacenCentral: [
      { id: 'p-1', nombre: 'Azúcar', categoria: 'cocina', cantidad: 10, unidad: 'kg', precioUnitario: 1.5, fechaActualizacion: new Date().toISOString() }
    ],
    locales: [
      { id: 'local-1', nombre: 'Local A', activo: true, almacen: [] }
    ],
    movimientos: [],
    pedidosMesas: {},
    ultimoRespaldo: new Date().toISOString()
  };

  // Successful transfer
  const r1 = applyTransfer(datos, 'p-1', 5, 'local-1');
  assert.strictEqual(r1.ok, true, 'expected ok true');
  if (!r1.datos) throw new Error('missing datos in result');
  const centralAfter = r1.datos.almacenCentral.find(p => p.id === 'p-1');
  assert.ok((centralAfter && centralAfter.cantidad === 5) || !centralAfter, 'central should have 5 or be removed');
  const localProduct = r1.datos.locales.find(l => l.id === 'local-1')?.almacen.find(p => p.nombre === 'Azúcar');
  assert.ok(localProduct && localProduct.cantidad === 5, 'local debe tener 5');
  assert.ok(r1.movimiento && r1.movimiento.tipo === 'suministro', 'movimiento creado');

  // Transfer too large
  const r2 = applyTransfer(datos, 'p-1', 100, 'local-1');
  assert.strictEqual(r2.ok, false, 'transfer should fail when quantity too large');

  // Non-existing product
  const r3 = applyTransfer(datos, 'no-ex', 1, 'local-1');
  assert.strictEqual(r3.ok, false, 'non-existing product should fail');

  // Non-existing local
  const r4 = applyTransfer(datos, 'p-1', 1, 'no-local');
  assert.strictEqual(r4.ok, false, 'non-existing local should fail');

  console.log('applyTransfer tests passed');
})();
