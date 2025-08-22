const config = {
  appId: 'com.aicodestudio.app',
  appName: 'AI Code Studio',
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

module.exports = config;