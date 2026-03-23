package com.paranormalos.cns

import android.content.Context
import androidx.room.Room
import com.paranormalos.cns.memory.Damn1Database
import com.paranormalos.cns.memory.Damn1Engram

/**
 * Damn1Manager.kt
 * SAGE CNS Layer — Room DB Wrapper
 * Session INV-TSC14S | Damn1 Memory Commit
 *
 * Clean API for the JNI bridge.
 * All writes are synchronous on the JNI background thread.
 * Continuity: 🕊️ LOCKED
 */
class Damn1Manager(context: Context) {

    private val db = Room.databaseBuilder(
        context.applicationContext,
        Damn1Database::class.java,
        "paranormal_cortex.db"
    )
        .allowMainThreadQueries() // JNI thread — acceptable here
        .fallbackToDestructiveMigration()
        .build()

    private val dao = db.damn1Dao()

    fun persist(key: String, payloadJSON: String, phiWeight: Float = 0.0f) {
        dao.encodeEngram(
            Damn1Engram(
                memoryKey = key,
                payload = payloadJSON,
                timestamp = System.currentTimeMillis(),
                resonanceWeight = phiWeight
            )
        )
    }

    fun retrieve(key: String): String? {
        return dao.retrieveEngram(key)
    }

    fun obliterate(key: String) {
        dao.obliterateEngram(key)
    }

    fun getHighResonanceEvents(): List<Damn1Engram> {
        return dao.getHighResonanceEvents()
    }

    fun getRecentEvents(limit: Int = 20): List<Damn1Engram> {
        return dao.getRecentEvents(limit)
    }
}
