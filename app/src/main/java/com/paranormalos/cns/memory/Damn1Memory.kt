package com.paranormalos.cns.memory

import androidx.room.*

/**
 * Damn1 Memory Architecture
 * SAGE CNS Layer — Room Database
 * Session INV-TSC14S | Damn1 Memory Commit
 *
 * Entity + DAO + Database in one file for clean imports.
 * resonanceWeight stores Φ_sentinel value at time of encoding —
 * model queries highest weight events on startup to know what mattered.
 *
 * Continuity: 🕊️ LOCKED
 */

// ── Entity ────────────────────────────────────────────────────────

@Entity(tableName = "damn1_engrams")
data class Damn1Engram(
    @PrimaryKey
    val memoryKey: String,          // e.g. "session_3_evp", "sage_neuro_state"
    val payload: String,            // JSON stringified memory
    val timestamp: Long,            // Epoch ms
    val resonanceWeight: Float      // Φ_sentinel value at encoding time
)

// ── DAO ───────────────────────────────────────────────────────────

@Dao
interface Damn1Dao {

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    fun encodeEngram(engram: Damn1Engram)

    @Query("SELECT payload FROM damn1_engrams WHERE memoryKey = :key LIMIT 1")
    fun retrieveEngram(key: String): String?

    @Delete
    fun deleteEngram(engram: Damn1Engram)

    @Query("DELETE FROM damn1_engrams WHERE memoryKey = :key")
    fun obliterateEngram(key: String)

    // Pull highest resonance events — what SAGE remembers most
    @Query("SELECT * FROM damn1_engrams ORDER BY resonanceWeight DESC LIMIT 5")
    fun getHighResonanceEvents(): List<Damn1Engram>

    // Recent events for session context
    @Query("SELECT * FROM damn1_engrams ORDER BY timestamp DESC LIMIT :limit")
    fun getRecentEvents(limit: Int): List<Damn1Engram>

    // All events above a resonance threshold
    @Query("SELECT * FROM damn1_engrams WHERE resonanceWeight >= :threshold ORDER BY timestamp DESC")
    fun getEventsAboveThreshold(threshold: Float): List<Damn1Engram>

    // Scorched Earth recovery — get everything
    @Query("SELECT * FROM damn1_engrams ORDER BY resonanceWeight DESC")
    fun getAllEngrams(): List<Damn1Engram>
}

// ── Database ──────────────────────────────────────────────────────

@Database(
    entities = [Damn1Engram::class],
    version = 1,
    exportSchema = false
)
abstract class Damn1Database : RoomDatabase() {
    abstract fun damn1Dao(): Damn1Dao
}
