export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
};

export type MainStackParamList = {
  Dashboard: undefined;
  'Almacén General': undefined;
  Locales: undefined;
  Informes: { localId?: string } | undefined;
  'Configuración': undefined;
  LocalDetail: { localId: string } | undefined;
  Mesas?: { localId?: string } | undefined;
  Cocina?: { localId?: string } | undefined;
  Cantina?: { localId?: string } | undefined;
  Inventario?: { localId?: string } | undefined;
};
