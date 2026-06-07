# Build Android APK

## Prerequisitos
- Android Studio instalado
- JDK 17+
- Variables de entorno ANDROID_HOME configuradas

## Pasos

```bash
# 1. Sincronizar el build web con Capacitor
npm run build:android

# 2. Abrir el proyecto en Android Studio
npx cap open android

# 3. En Android Studio:
#    Build → Generate Signed Bundle/APK
#    → APK → Next
#    → Crear o seleccionar keystore
#    → release → Finish
```

## capacitor.config verificado
- appId: com.aura.game (en capacitor.config.js)
- webDir: dist

## APIs incompatibles con WebView
- localStorage: ✅ funciona en WebView
- requestAnimationFrame: ✅ funciona en WebView
- performance.now(): ✅ funciona en WebView
- window.crypto.randomUUID(): ⚠️ No se usa (usamos Math.random())
