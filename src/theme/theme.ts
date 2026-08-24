import { MD3DarkTheme as DefaultTheme } from 'react-native-paper';

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#2563EB',     // Vibrant blue for primary actions
    accent: '#3B82F6',      // Lighter blue for accents
    background: '#0F172A',  // Deep navy background (slate-900)
    surface: '#1E293B',     // Slightly lighter for cards (slate-800)
    surfaceVariant: '#334155', // For stat cards/secondary surfaces
    text: '#F8FAFC',        // Slate-50 for high contrast text
    error: '#EF4444',       // Red-500
    onSurface: '#F8FAFC',
    onBackground: '#F8FAFC',
    onSurfaceVariant: '#94A3B8', // Slate-400 for secondary text
  },
};
