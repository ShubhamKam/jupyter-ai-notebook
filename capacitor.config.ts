import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.jupyterai.notebook',
  appName: 'Jupyter AI Notebook',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true
  },
  plugins: {
    Filesystem: {
      requestPermissions: true
    },
    Share: {
      subject: 'Jupyter AI Notebook Export',
      text: 'Check out this notebook created with Jupyter AI'
    },
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#1FB8CD',
      showSpinner: true,
      spinnerColor: '#ffffff'
    }
  }
};

export default config;