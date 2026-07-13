import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.chrislee.sayagain',
  appName: 'Say Again?',
  webDir: 'dist',
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#0f141a',
  },
};

export default config;
