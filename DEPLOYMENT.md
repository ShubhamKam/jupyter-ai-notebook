# 🚀 Deployment Guide

## GitHub Actions APK Generation

### Quick Setup

1. **Create GitHub Repository**
   ```bash
   # Go to https://github.com/new
   # Repository name: jupyter-ai-notebook
   # Visibility: Public (for free GitHub Actions)
   ```

2. **Connect Local Repository**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/jupyter-ai-notebook.git
   git branch -M main
   git push -u origin main
   ```

3. **Automatic Build**
   - GitHub Actions will automatically start building
   - Check the "Actions" tab in your repository
   - APK will be available in ~5-10 minutes

### Download APK

#### Development APK (Every Push)
- Go to repository → Actions tab
- Click on latest workflow run
- Download "jupyter-ai-notebook-apk" artifact
- Extract the ZIP to get the APK file

#### Release APK (Version Tags)
- Create a new tag: `git tag v1.0.0 && git push origin v1.0.0`
- Check "Releases" section for automatic release
- Download APK directly from releases

### Manual Trigger
- Go to Actions tab → "Build APK" workflow
- Click "Run workflow" button
- Select branch and click "Run workflow"

## Local APK Build (Alternative)

### Prerequisites
- Node.js 18+
- Android Studio
- Java 17+

### Commands
```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Setup Capacitor (first time only)
npm run cap:init

# Add Android platform (first time only)
npm run cap:add:android

# Sync web assets to native
npm run cap:sync

# Build APK
npm run cap:build:android

# Open in Android Studio (optional)
npm run cap:open:android
```

### APK Location
```
android/app/build/outputs/apk/debug/app-debug.apk
```

## Troubleshooting

### GitHub Actions Fails
- Check Actions tab for error logs
- Ensure repository is public (for free tier)
- Verify all required files are committed

### Local Build Fails
- Install Android Studio and SDK
- Set ANDROID_HOME environment variable
- Accept Android SDK licenses: `$ANDROID_HOME/tools/bin/sdkmanager --licenses`

### APK Installation Issues
- Enable "Unknown sources" in Android settings
- APK is debug-signed (not for production distribution)
- For production: Set up proper signing in GitHub secrets

## Production Release

### Setup Signing (Optional)
1. Generate keystore file
2. Add to GitHub repository secrets:
   - `ANDROID_KEYSTORE_FILE`
   - `ANDROID_KEYSTORE_PASSWORD` 
   - `ANDROID_KEY_ALIAS`
   - `ANDROID_KEY_PASSWORD`

### Create Release
```bash
git tag v1.0.0
git push origin v1.0.0
```

GitHub Actions will automatically:
- Build signed APK
- Create GitHub release
- Upload APK to release assets