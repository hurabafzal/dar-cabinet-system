import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.darfurniture.productconfigurator',
  appName: 'Product Configurator',
  webDir: 'dist',
  plugins: {
    CapacitorCookies: {
      enabled: true,
    },
  },
};

export default config;
