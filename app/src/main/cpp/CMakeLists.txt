cmake_minimum_required(VERSION 3.22.1)
project("paranormal_cortex")

# ── llama.cpp integration ──────────────────────────────────────────
# Clone llama.cpp into this folder:
# cd app/src/main/cpp && git clone https://github.com/ggerganov/llama.cpp
#
# GGUF 4-bit quantized models only (Q4_K_M recommended)
# Full 16-bit models will overheat and kill the battery
# add_subdirectory(llama.cpp)

# ── SAGE Cortex bridge library ─────────────────────────────────────
add_library(sage-cortex SHARED native-lib.cpp)

# ── Link Android system libraries ─────────────────────────────────
target_link_libraries(sage-cortex
    # llama          # Uncomment when llama.cpp cloned
    log
    android
)
