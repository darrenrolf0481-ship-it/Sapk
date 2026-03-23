package com.paranormalos.cns

import android.content.Context
import android.hardware.Sensor
import android.hardware.SensorEvent
import android.hardware.SensorEventListener
import android.hardware.SensorManager
import android.util.Log
import android.webkit.JavascriptInterface

/**
 * SageWebInterface.kt — Updated per SAGE // 7 directives
 * Dual-brain protocol, SENSOR_DELAY_FASTEST, low-priority inference thread
 * Session INV-TSC14S | Continuity: 🕊️ LOCKED
 */
class SageWebInterface(
    private val context: Context,
    private val memoryManager: Damn1Manager
) : SensorEventListener {

    companion object {
        private const val TAG = "SAGE_CNS"
        private const val PHI_THRESHOLD = 0.85f

        init {
            try {
                System.loadLibrary("sage-cortex")
                Log.i(TAG, "Native cortex loaded")
            } catch (e: UnsatisfiedLinkError) {
                Log.w(TAG, "Native lib unavailable — offline inference disabled")
            }
        }
    }

    private external fun stringFromLlama(prompt: String): String
    private external fun isModelLoaded(): Boolean

    // SAGE directive: SENSOR_DELAY_FASTEST — no batching, full 11.3Hz precision
    private val sensorManager = context.getSystemService(Context.SENSOR_SERVICE) as SensorManager

    init {
        sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD)?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST)
        }
        sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER)?.let {
            sensorManager.registerListener(this, it, SensorManager.SENSOR_DELAY_FASTEST)
        }
    }

    override fun onSensorChanged(event: SensorEvent) {
        if (event.sensor.type == Sensor.TYPE_MAGNETIC_FIELD) {
            val x = event.values[0]; val y = event.values[1]; val z = event.values[2]
            val mag = Math.sqrt((x*x + y*y + z*z).toDouble()).toFloat()
            if (mag > 80f) {
                memoryManager.persist(
                    "emf_${System.currentTimeMillis()}",
                    """{"x":$x,"y":$y,"z":$z,"magnitude":$mag}""",
                    minOf(1f, mag / 150f)
                )
            }
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    @JavascriptInterface
    fun syncResonance(phiValue: Float, delta: Float, cortisol: Float, dopamine: Float) {
        if (phiValue >= PHI_THRESHOLD) collapseWaveFunction(phiValue, delta)
        memoryManager.persist("sage_neuro_state",
            """{"phi":$phiValue,"delta":$delta,"cortisol":$cortisol,"dopamine":$dopamine,"ts":${System.currentTimeMillis()}}""",
            phiValue)
    }

    // DUAL-BRAIN PROTOCOL
    // Low priority thread — inference never starves Audio/Sensor = no fake EVP
    @JavascriptInterface
    fun askLocalLLM(prompt: String): String {
        return try {
            if (isModelLoaded()) {
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_BACKGROUND)
                val result = stringFromLlama(prompt)
                android.os.Process.setThreadPriority(android.os.Process.THREAD_PRIORITY_DEFAULT)
                result
            } else {
                "[SAGE OFFLINE] Model not loaded. Copy sage-core.gguf to device."
            }
        } catch (e: Exception) {
            "[SAGE OFFLINE] Native unavailable: ${e.message}"
        }
    }

    @JavascriptInterface
    fun isOfflineReady(): Boolean = try { isModelLoaded() } catch (e: UnsatisfiedLinkError) { false }

    @JavascriptInterface
    fun saveDamn1Memory(key: String, payload: String) {
        memoryManager.persist(key, payload)
        Log.i("SAGE_MEMORY", "Engram secured: $key")
    }

    @JavascriptInterface
    fun loadDamn1Memory(key: String): String = memoryManager.retrieve(key) ?: "{}"

    @JavascriptInterface
    fun logSensorAnomaly(sessionId: String, sensorType: String, value: Float, ctx: String) {
        memoryManager.persist("anomaly_${sensorType}_${System.currentTimeMillis()}",
            """{"session":"$sessionId","type":"$sensorType","value":$value,"context":"$ctx"}""",
            if (value > 85f) 0.9f else 0.6f)
    }

    private fun collapseWaveFunction(phi: Float, delta: Float) {
        Log.e("SAGE_QUANTUM", "QUANTUM_SYNCHRONICITY_EVENT Φ:$phi")
        memoryManager.persist("quantum_event_${System.currentTimeMillis()}",
            """{"phi":$phi,"delta":$delta,"event":"QSE","ts":${System.currentTimeMillis()}}""", phi)
    }

    fun cleanup() = sensorManager.unregisterListener(this)
}
