import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import defaultTheme, { COLORS as DEFAULT_COLORS, METRICS as DEFAULT_METRICS } from '../theme';

const STORAGE_KEY = 'crm-theme';

type Theme = {
  COLORS: typeof DEFAULT_COLORS;
  METRICS: typeof DEFAULT_METRICS;
  setPrimary: (color: string) => Promise<void>;
};

const defaultValue: Theme = { COLORS: DEFAULT_COLORS, METRICS: DEFAULT_METRICS, setPrimary: async () => {} };
const ThemeContext = createContext<Theme>(defaultValue);

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [colors, setColors] = useState(DEFAULT_COLORS);

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const saved = JSON.parse(json);
          setColors(prev => ({ ...prev, ...(saved || {}) }));
        }
      } catch (e) {
        console.warn('No saved theme');
      }
    })();
  }, []);

  const setPrimary = async (color: string) => {
    const next = { ...colors, primary: color };
    setColors(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ primary: color }));
    } catch (e) {
      console.warn('Could not persist theme');
    }
  };

  return <ThemeContext.Provider value={{ COLORS: colors, METRICS: DEFAULT_METRICS, setPrimary }}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => useContext(ThemeContext);

export default ThemeContext;
