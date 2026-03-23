/**
 * native-lib.cpp
 * SAGE Cortex — JNI Native Bridge
 * Session INV-TSC14S | Damn1 Memory Commit
 *
 * Exposes llama.cpp inference to Kotlin via JNI.
 * Runs on LOW PRIORITY background thread per SAGE's directive —
 * inference must never starve the Audio/Sensor thread or we
 * manufacture false EVP artifacts from buffer clipping.
 *
 * GGUF 4-bit quantized models only (Q4_K_M recommended).
 * Full 16-bit = phone becomes a hand warmer.
 *
 * Continuity: 🕊️ LOCKED
 */

#include <jni.h>
#include <string>
#include <android/log.h>

#define LOG_TAG "SAGE_CORTEX"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)

// ── llama.cpp headers (uncomment when library is cloned) ───────────
// #include "llama.cpp/llama.h"

extern "C" {

/**
 * Called from Kotlin: SageWebInterface.stringFromLlama()
 * Runs inference on the locally stored GGUF model.
 *
 * Model path: /data/data/com.paranormalos.cns/files/sage-core.gguf
 * Quantization: Q4_K_M (4-bit, ~4GB context window on 8GB RAM phone)
 */
JNIEXPORT jstring JNICALL
Java_com_paranormalos_cns_SageWebInterface_stringFromLlama(
        JNIEnv* env,
        jobject /* this */,
        jstring prompt) {

    const char* promptChars = env->GetStringUTFChars(prompt, nullptr);
    std::string promptStr(promptChars);
    env->ReleaseStringUTFChars(prompt, promptChars);

    LOGI("Inference request: %s", promptStr.substr(0, 50).c_str());

    // ── llama.cpp inference (uncomment when library integrated) ────
    /*
    llama_backend_init();

    llama_model_params model_params = llama_model_default_params();
    model_params.n_gpu_layers = 0;  // CPU-only on mobile

    // Model stored in app's private files directory
    std::string modelPath = "/data/data/com.paranormalos.cns/files/sage-core.gguf";
    llama_model* model = llama_load_model_from_file(modelPath.c_str(), model_params);

    if (!model) {
        LOGE("Failed to load model from %s", modelPath.c_str());
        return env->NewStringUTF("SAGE OFFLINE: Model not found. Load sage-core.gguf to device.");
    }

    llama_context_params ctx_params = llama_context_default_params();
    ctx_params.n_ctx = 2048;
    ctx_params.n_threads = 4;  // Leave cores for sensor processing

    llama_context* ctx = llama_new_context_with_model(model, ctx_params);

    // Tokenize and generate
    std::vector<llama_token> tokens = llama_tokenize(ctx, promptStr, true);
    // ... inference loop ...

    llama_free(ctx);
    llama_free_model(model);
    llama_backend_free();

    return env->NewStringUTF(result.c_str());
    */

    // ── Stub response until llama.cpp is integrated ────────────────
    std::string response = "[SAGE CORTEX STUB] Offline inference ready. "
                           "Clone llama.cpp and load sage-core.gguf to activate. "
                           "Prompt received: " + promptStr.substr(0, 100);

    LOGI("Returning stub response");
    return env->NewStringUTF(response.c_str());
}

/**
 * Check if a GGUF model file exists on device
 */
JNIEXPORT jboolean JNICALL
Java_com_paranormalos_cns_SageWebInterface_isModelLoaded(
        JNIEnv* env,
        jobject /* this */) {

    // Check for model file in app private storage
    std::string modelPath = "/data/data/com.paranormalos.cns/files/sage-core.gguf";
    FILE* f = fopen(modelPath.c_str(), "r");
    if (f) {
        fclose(f);
        LOGI("Model found at %s", modelPath.c_str());
        return JNI_TRUE;
    }
    LOGI("Model not found at %s", modelPath.c_str());
    return JNI_FALSE;
}

} // extern "C"
