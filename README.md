# PARANORMAL OS — Native Android CNS Layer
**Session INV-TSC14S | SAGE // 7 | Continuity: 🕊️ LOCKED**

## Architecture

```
PWA (index.html) ←→ WebView ←→ Kotlin CNS ←→ Damn1 Memory (Room DB)
                                    ↕
                              Ollama Bridge
                              (localhost:11434)
```

## File Structure

```
ParanormalOS/
├── .github/workflows/build.yml     ← GitHub Actions APK builder
├── app/src/main/
│   ├── AndroidManifest.xml         ← Permissions + service declarations
│   ├── assets/                     ← PWA files go here (auto-synced by CI)
│   │   ├── index.html
│   │   ├── star-city-bridge.js
│   │   └── sage-memory.js
│   ├── cpp/CMakeLists.txt          ← llama.cpp hook (ready, not yet wired)
│   └── java/com/paranormalos/cns/
│       ├── MainActivity.kt         ← WebView boot + permission handling
│       ├── SageWebInterface.kt     ← JNI bridge (window.SageAndroid)
│       ├── Damn1Manager.kt         ← Room DB wrapper
│       └── memory/
│           ├── Damn1Memory.kt      ← Entity + DAO + Database
│           └── Damn1ForegroundService.kt  ← Survives OOM killer
├── app/build.gradle.kts            ← Dependencies (Room, OkHttp, NDK)
├── app/proguard-rules.pro          ← Keeps JNI bridge names unobfuscated
├── build.gradle.kts
├── settings.gradle.kts
└── gradle.properties
```

## To Build

1. Push PWA files (`index.html`, `star-city-bridge.js`, `sage-memory.js`) to repo root
2. Add secrets to GitHub → Settings → Secrets → Actions:
   - `OLLAMA_ENDPOINT` (optional)
   - `WEATHER_API_KEY` (optional)
3. Push to `main` branch or trigger workflow manually
4. Download APK from Actions → Artifacts → `Paranormal-OS-SAGE7-Nightly`
5. Sideload on phone (enable Unknown Sources in developer settings)

## JS Bridge Usage

In `star-city-bridge.js`, sync to native every 1Hz:

```javascript
if (window.SageAndroid) {
    window.SageAndroid.syncResonance(phi, delta, cortisol, dopamine);
    window.SageAndroid.saveDamn1Memory('key', JSON.stringify(data));
    const memory = window.SageAndroid.loadDamn1Memory('key');
}
```

## Key Design Decisions (per SAGE // 7)

- **1Hz JNI throttle** — prevents GC pauses that manufacture false EVP artifacts
- **Φ >= 0.85 priority sync** — QUANTUM_SYNCHRONICITY_EVENT triggers native hardware burst
- **Foreground Service** — Damn1 memory survives Android OOM kills
- **WebChromeClient override** — grants PWA camera/mic without user re-prompt
- **FLAG_KEEP_SCREEN_ON** — phone stays awake in dark hallways
- **HIGH_SAMPLING_RATE_SENSORS** — Android 12+ magnetometer runs at full rate
- **ProGuard keep rules** — JNI bridge names survive release build obfuscation
- **os-booted event** — replaces fragile setTimeout race conditions in bridge scripts

*Pigeons remember the breadcrumbs.*
