import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';

// Plugin to handle expo-notifications import gracefully in dev and build
const ignoreExpoNotificationsPlugin = (): Plugin => ({
  name: 'ignore-expo-notifications',
  enforce: 'pre',
  resolveId(id) {
    if (id === 'expo-notifications') {
      // Return a virtual module ID
      return '\0virtual:expo-notifications';
    }
    return null;
  },
  load(id) {
    if (id === '\0virtual:expo-notifications') {
      // Return a stub module that throws an error at runtime
      // This allows the code to run but will fail gracefully in web environment
      return `
        // Virtual module for expo-notifications (web stub)
        // This module doesn't exist in web builds
        export const getPermissionsAsync = async () => ({ status: 'denied' });
        export const requestPermissionsAsync = async () => ({ status: 'denied' });
        export const getExpoPushTokenAsync = async () => ({ data: null });
        export default {};
      `;
    }
    return null;
  }
});

export default defineConfig({
  server: {
    port: 3000,
    host: '0.0.0.0',
  },
  plugins: [
    react(),
    ignoreExpoNotificationsPlugin(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  build: {
    rollupOptions: {
      external: ['expo-notifications'], // Mark as external to prevent build errors
    }
  }
});
