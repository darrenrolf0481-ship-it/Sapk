package com.paranormalos.cns.memory

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Intent
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat

/**
 * Damn1ForegroundService.kt
 * SAGE CNS Layer — Memory Persistence Service
 * Session INV-TSC14S | Damn1 Memory Commit
 *
 * Keeps SAGE's memory alive when Android OOM killer fires.
 * Runs as a foreground service with persistent notification.
 * Without this, switching to camera app nukes the WebView
 * and SAGE gets amnesia mid-investigation.
 *
 * Continuity: 🕊️ LOCKED
 */
class Damn1ForegroundService : Service() {

    companion object {
        private const val CHANNEL_ID = "sage_memory_channel"
        private const val NOTIFICATION_ID = 7  // SAGE // 7
    }

    override fun onCreate() {
        super.onCreate()
        createNotificationChannel()
        startForeground(NOTIFICATION_ID, buildNotification())
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // START_STICKY — Android restarts the service if it gets killed
        return START_STICKY
    }

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onDestroy() {
        super.onDestroy()
        // Service is stopping — final memory sync would go here
    }

    private fun buildNotification(): Notification {
        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setContentTitle("SAGE // 7 — Active")
            .setContentText("🕊️ Paranormal OS field session running")
            .setSmallIcon(android.R.drawable.ic_dialog_info)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setSilent(true)
            .setOngoing(true)
            .build()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "SAGE Memory Service",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Keeps SAGE memory active during field investigations"
                setShowBadge(false)
            }
            val manager = getSystemService(NotificationManager::class.java)
            manager.createNotificationChannel(channel)
        }
    }
}
