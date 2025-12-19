import React, { createContext, useContext, useState, ReactNode } from 'react';

type Locale = 'es' | 'en';

const translations: Record<Locale, Record<string, string>> = {
  es: {
    welcome_title: 'Bienvenido a la aplicación',
    welcome_desc: 'Sigue estos pasos para configurar y aprovechar tu CRM para la gestión del café.',
    next: 'Siguiente',
    skip: 'Saltar',
    step1_title: 'Organiza tu inventario',
    step1_desc: 'Gestiona productos, stock y transferencias con facilidad.',
    step2_title: 'Controla pedidos',
    step2_desc: 'Atiende mesas y cocina de forma eficiente.',
    step3_title: 'Analiza informes',
    step3_desc: 'Visualiza ventas, movimientos e inventario en gráficos.'
  },
  en: {
    welcome_title: 'Welcome to the app',
    welcome_desc: 'Follow these steps to set up and get the most out of your cafe CRM.',
    next: 'Next',
    skip: 'Skip',
    step1_title: 'Organize your inventory',
    step1_desc: 'Manage products, stock and transfers with ease.',
    step2_title: 'Manage orders',
    step2_desc: 'Handle tables and kitchen efficiently.',
    step3_title: 'Analyze reports',
    step3_desc: 'View sales, movements and stock charts.'
  }
};

type I18nContextValue = {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
};

const I18nContext = createContext<I18nContextValue>({ locale: 'es', setLocale: () => {}, t: k => k });

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [locale, setLocale] = useState<Locale>('es');
  const t = (key: string) => translations[locale][key] || key;
  return <I18nContext.Provider value={{ locale, setLocale, t }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);

export default I18nContext;
