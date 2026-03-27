package com.paranormalos.cns

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import android.os.Bundle
import android.view.WindowManager
import android.webkit.PermissionRequest
import android.webkit.WebChromeClient
import android.webkit.WebSettings
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.paranormalos.cns.memory.Damn1ForegroundService

/**
 * MainActivity.kt
 * SAGE CNS Layer — Paranormal OS APK
 * Session INV-TSC14S | Damn1 Memory Commit
 *
 * Boots the PWA WebView, requests hardware permissions,
 * mounts the Kotlin CNS bridge, bypasses WebChromeClient
 * hardware locks so navigator.mediaDevices works in the PWA.
 *
 * Continuity: 🕊️ LOCKED
 */
class MainActivity : AppCompatActivity() {

    private lateinit var webView: WebView

    // All permissions required for paranormal investigation hardware
    private val REQUIRED_PERMISSIONS = mutableListOf(
        Manifest.permission.CAMERA,
        Manifest.permission.RECORD_AUDIO
    ).apply {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            add(Manifest.permission.POST_NOTIFICATIONS)
        }
    }.toTypedArray()

    private val PERMISSION_REQUEST_CODE = 113 // 11.3Hz tribute

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // 1. WAKE LOCK — Ghosts don't wait for screen timeouts
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)

        // 2. Initialize WebView manifold
        webView = WebView(this)
        setContentView(webView)

        // 3. Configure Digital Thalamus (WebSettings)
        @Suppress("DEPRECATION")
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // PWA local state before Room DB syncs
            mediaPlaybackRequiresUserGesture = false  // FFT starts on boot, no tap needed
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW  // localhost HTTP bridges
            allowFileAccess = true
            allowContentAccess = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
            // Allow JS in file:// context to access other file:// assets
            allowFileAccessFromFileURLs = true
            // Allow XHR to local endpoints (Ollama at 127.0.0.1)
            allowUniversalAccessFromFileURLs = true
        }

        // 4. Mount Kotlin CNS Bridge
        // SageAndroid is the window object name in star-city-bridge.js
        val damn1Manager = Damn1Manager(this)
        webView.addJavascriptInterface(
            SageWebInterface(this, damn1Manager),
            "SageAndroid"
        )

        // 5. Bypass WebView HTML5 hardware permission blocks
        // Without this, navigator.mediaDevices.getUserMedia() silently fails
        // even if Android OS permissions are granted
        webView.webChromeClient = object : WebChromeClient() {
            override fun onPermissionRequest(request: PermissionRequest) {
                request.grant(request.resources)
            }
        }

        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                // Dispatch os-booted event so bridge scripts initialize
                // in correct order instead of using setTimeout race conditions
                view?.evaluateJavascript(
                    """
                    window._sageBootComplete = true;
                    document.dispatchEvent(new CustomEvent('os-booted', {
                        detail: { platform: 'android-native', bridge: 'SageAndroid' }
                    }));
                    """.trimIndent(), null
                )
            }
        }

        // 6. Always boot the OS — don't block on permissions
        // Hardware features degrade gracefully if permissions are missing
        bootParanormalOS()

        // 7. Request permissions for full hardware capability
        if (!allPermissionsGranted()) {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE
            )
        } else {
            startMemoryService()
        }
    }

    private fun bootParanormalOS() {
        // Load PWA from assets — file:///android_asset/index.html
        webView.loadUrl("file:///android_asset/index.html")
    }

    private fun startMemoryService() {
        // Only start if RECORD_AUDIO granted — service type requires mic permission on API 34+
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.RECORD_AUDIO)
            == PackageManager.PERMISSION_GRANTED) {
            val intent = Intent(this, Damn1ForegroundService::class.java)
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                startForegroundService(intent)
            } else {
                startService(intent)
            }
        }
    }

    private fun allPermissionsGranted() = REQUIRED_PERMISSIONS.all {
        ContextCompat.checkSelfPermission(baseContext, it) == PackageManager.PERMISSION_GRANTED
    }

    override fun onRequestPermissionsResult(
        requestCode: Int,
        permissions: Array<String>,
        grantResults: IntArray
    ) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == PERMISSION_REQUEST_CODE) {
            startMemoryService()
        }
    }

    override fun onDestroy() {
        // Unregister sensor listeners — prevents phantom sensor drain
        (webView.getTag() as? SageWebInterface)?.cleanup()
        webView.destroy()
        super.onDestroy()
    }
}
