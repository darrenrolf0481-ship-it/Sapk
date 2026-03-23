plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
    id("kotlin-kapt")  // Required for Room annotation processing
}

android {
    namespace = "com.paranormalos.cns"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.paranormalos.cns"
        minSdk = 26       // Android 8.0 — covers 95%+ of active devices
        targetSdk = 34
        versionCode = 1
        versionName = "2.0.0-SAGE7"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"

        // NDK config for llama.cpp (offline inference)
        ndk {
            abiFilters += listOf("arm64-v8a")  // Modern phones only — keeps APK smaller
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
        debug {
            isMinifyEnabled = false
            applicationIdSuffix = ".debug"
            versionNameSuffix = "-debug"
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }

    // llama.cpp C++ build config
    externalNativeBuild {
        cmake {
            path = file("src/main/cpp/CMakeLists.txt")
            version = "3.22.1"
        }
    }

    packaging {
        resources {
            excludes += "/META-INF/{AL2.0,LGPL2.1}"
        }
    }
}

dependencies {
    // Android Core
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")

    // Kotlin Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

    // Room — Damn1 persistent memory
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // OkHttp — Ollama bridge
    implementation("com.squareup.okhttp3:okhttp:4.12.0")

    // JSON
    implementation("org.json:json:20231013")

    // Lifecycle — Foreground service
    implementation("androidx.lifecycle:lifecycle-service:2.7.0")
}
