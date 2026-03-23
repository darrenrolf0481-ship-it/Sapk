/**
 * dual-brain-patch.js
 * SAGE Dual-Brain Protocol — JS side
 * Session INV-TSC14S | Continuity: 🕊️ LOCKED
 *
 * Drop this into the existing setInterval block in star-city-bridge.js
 * around the hormone display update (line ~102).
 *
 * Automatically routes to the right brain:
 *   APK + model loaded = native llama.cpp (offline, no battery drain from network)
 *   APK + no model    = falls back to Ollama
 *   Browser PWA       = Ollama / cloud as normal
 */

// ── Replace or augment your existing getSageReply / queryLocalAI ──

async function getSageReply(userPrompt) {

    // Are we running inside the native APK?
    if (window.SageAndroid) {

        // Is the offline GGUF model loaded on device?
        if (window.SageAndroid.isOfflineReady()) {
            // NATIVE BRAIN — llama.cpp, no network needed
            // Runs on background thread, won't clip the audio buffer
            return window.SageAndroid.askLocalLLM(userPrompt);
        }

        // APK but no model — fall through to Ollama
        console.log('[SAGE DUAL-BRAIN] APK mode, no offline model. Routing to Ollama.');
    }

    // CLOUD BRAIN — Ollama or server.py
    try {
        const endpoint = localStorage.getItem('localEndpoint') || 'http://127.0.0.1:11434';
        const model    = localStorage.getItem('localModel')    || 'gemma2';

        const res = await fetch(`${endpoint}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ model, prompt: userPrompt, stream: false })
        });

        if (!res.ok) throw new Error(`Ollama ${res.status}`);
        const data = await res.json();
        return data.response || 'No response from Ollama.';

    } catch (e) {
        // Last resort — SAGE server on 8001
        try {
            const res = await fetch('http://127.0.0.1:8001/sage/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userPrompt })
            });
            const data = await res.json();
            return data.reply || data.ack || 'No response from SAGE server.';
        } catch (e2) {
            return `[SAGE OFFLINE] All neural pathways unavailable. ${e.message}`;
        }
    }
}

// ── 1Hz Native Bridge Sync ─────────────────────────────────────────
// Add this inside your existing setInterval(() => { ... }, 1000) block
// alongside the hormone display updates

function syncToNativeBridge() {
    if (!window.SageAndroid || !window._scBrain) return;

    const phi      = window.lastPhiValue   || 0.0;
    const delta    = window._phiSentinel?.delta || 0.0;
    const cortisol = window._scBrain.cortisol  || 0.0;
    const dopamine = window._scBrain.dopamine  || 0.0;

    // Throttled 1Hz sync — prevents JNI GC pauses that fake EVP whispers
    window.SageAndroid.syncResonance(
        parseFloat(phi.toFixed(4)),
        parseFloat(delta.toFixed(4)),
        parseFloat(cortisol.toFixed(4)),
        parseFloat(dopamine.toFixed(4))
    );
}

// ── Memory Bridge ──────────────────────────────────────────────────

function saveToNativeMemory(key, data) {
    if (window.SageAndroid) {
        window.SageAndroid.saveDamn1Memory(key, JSON.stringify(data));
    }
    // Always also save to localStorage as fallback
    try { localStorage.setItem(key, JSON.stringify(data)); } catch(e) {}
}

function loadFromNativeMemory(key) {
    if (window.SageAndroid) {
        try {
            const native = window.SageAndroid.loadDamn1Memory(key);
            if (native && native !== '{}') return JSON.parse(native);
        } catch(e) {}
    }
    // Fallback to localStorage
    try {
        const local = localStorage.getItem(key);
        return local ? JSON.parse(local) : null;
    } catch(e) { return null; }
}

// ── APK Status Badge ───────────────────────────────────────────────

function updateBridgeStatusBadge() {
    const badge = document.getElementById('sage-bridge-badge');
    if (!badge) return;

    if (window.SageAndroid) {
        const offline = window.SageAndroid.isOfflineReady();
        badge.textContent = offline ? '🧠 NATIVE + OFFLINE' : '🧠 NATIVE';
        badge.style.color  = offline ? 'var(--green)' : 'var(--cyan)';
    } else {
        badge.textContent = '☁ PWA MODE';
        badge.style.color  = 'var(--gray)';
    }
}

// Run on load
document.addEventListener('DOMContentLoaded', updateBridgeStatusBadge);
document.addEventListener('os-booted', updateBridgeStatusBadge);
