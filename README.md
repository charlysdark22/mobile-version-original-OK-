# CRM App - Mobile (Expo)

Este es un scaffold mínimo para la versión móvil de la app.

## Credenciales por defecto

- **Usuario**: `Gerente`
- **Contraseña**: `admin123`

> Están definidas en `src/utils/storage.ts` dentro del objeto `datosIniciales.usuarios`.

## Ejecutar la app (desarrollo)

1. Instalar dependencias:

```bash
npm install
```

2. Iniciar el servidor de desarrollo (borrar cache):

```bash
npx expo start -c
```

3. Abrir en el objetivo deseado:
- Android: `a` o escanear el QR con Expo Go
- iOS: `i` (en macOS) o usar Expo Go
- Web: `w` (opcional)

Si quieres resetear datos guardados en AsyncStorage, borra las claves `crm-locales-data` y `usuario-actual` o desinstala la app del emulador.


Pasos para completar la instalación (en tu máquina local con Internet):

1. Desde la raíz de este directorio (`mobile/`) ejecuta:

   - Con `create-expo-app` (recomendado):
     npx create-expo-app . --template expo-template-blank-typescript

   - O bien instala dependencias manualmente:
     npm install

2. Iniciar la app:
   npm start

Notas:
- Si `npx create-expo-app` no funciona en este entorno, usa tu máquina local para completar la instalación. Aquí he incluido archivos esenciales y pantallas placeholder para avanzar con el desarrollo.
- Tras instalar, instala las librerías que necesitamos: `@react-navigation/*`, `@react-native-async-storage/async-storage`, `axios`, `@expo/vector-icons`, etc.
  
Dependencias recomendadas para continuar:

```
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/drawer
expo install react-native-gesture-handler react-native-reanimated react-native-screens react-native-safe-area-context @react-native-masked-view/masked-view
npm install axios
expo install @react-native-async-storage/async-storage
npm install @expo/vector-icons
```

Para respaldo y carga de archivos (descargar/leer JSON) usa:

```
expo install expo-file-system expo-sharing expo-document-picker
```

Y si quieres gráficos, considera `react-native-svg` + `victory-native` o `react-native-chart-kit`.

## Cambios recientes (resumen)

- Reemplacé el Drawer por un **FloatingMenu** radial/fan en `src/components/FloatingMenu.tsx` (animaciones, soporte háptico y accesibilidad añadidos).
- Eliminado paquete `@react-navigation/drawer` y renombrado tipos de navegación a `MainStackParamList` (`src/types/navigation.ts`).
- Añadido módulo puro `src/utils/applyTransfer.ts` con pruebas unitarias (`npm run test:unit`).
- Actualizadas dependencias (`npm update` con `--legacy-peer-deps` cuando fue necesario) y verificado que `npx tsc --noEmit` no muestra errores.

Para ejecutar tests unitarios:

```
npm run test:unit
```

Si ves problemas con peer-deps al instalar dependencias usa:

```
npm install --legacy-peer-deps
```

