import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.keepyapping.escapes',
  appName: 'Keep Yapping',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f141a',
  },
};

export default config;
