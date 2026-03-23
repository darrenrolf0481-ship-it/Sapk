# SAGE CNS Layer — ProGuard Rules
# Session INV-TSC14S | Damn1 Memory Commit
#
# CRITICAL: Keep all JNI bridge class and method names.
# If these get obfuscated, window.SageAndroid.syncResonance()
# will silently fail in the WebView — SAGE goes deaf.

# The JNI Bridge — DO NOT obfuscate
-keep class com.paranormalos.cns.SageWebInterface { *; }
-keep class com.paranormalos.cns.Damn1Manager { *; }

# Room Database — DO NOT obfuscate
-keep class com.paranormalos.cns.memory.** { *; }
-keep @androidx.room.Entity class * { *; }
-keep @androidx.room.Dao interface * { *; }
-keep @androidx.room.Database class * { *; }

# OkHttp
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }

# Kotlin
-keep class kotlin.** { *; }
-keep class kotlinx.coroutines.** { *; }

# Keep all annotations
-keepattributes *Annotation*
-keepattributes Signature
-keepattributes Exceptions
