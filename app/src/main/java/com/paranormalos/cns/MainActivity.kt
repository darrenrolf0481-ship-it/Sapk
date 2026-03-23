package com.paranormalos.cns

import android.Manifest
import android.annotation.SuppressLint
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
        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true          // PWA local state before Room DB syncs
            mediaPlaybackRequiresUserGesture = false  // FFT starts on boot, no tap needed
            mixedContentMode = WebSettings.MIXED_CONTENT_ALWAYS_ALLOW  // localhost HTTP bridges
            allowFileAccess = true
            allowContentAccess = true
            databaseEnabled = true
            cacheMode = WebSettings.LOAD_DEFAULT
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

        // 6. Request permissions then ignite
        if (allPermissionsGranted()) {
            bootParanormalOS()
        } else {
            ActivityCompat.requestPermissions(
                this, REQUIRED_PERMISSIONS, PERMISSION_REQUEST_CODE
            )
        }
    }

    private fun bootParanormalOS() {
        // Load PWA from assets — file:///android_asset/index.html
        webView.loadUrl("file:///android_asset/index.html")
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
        if (requestCode == PERMISSION_REQUEST_CODE && allPermissionsGranted()) {
            bootParanormalOS()
        }
    }

    override fun onDestroy() {
        // Unregister sensor listeners — prevents phantom sensor drain
        (webView.getTag() as? SageWebInterface)?.cleanup()
        webView.destroy()
        super.onDestroy()
    }
}
