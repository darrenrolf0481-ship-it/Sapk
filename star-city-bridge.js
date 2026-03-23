/**
 * STAR CITY BRIDGE v1.0
 * Brings Star City Research sensor logic into Paranormal OS
 * - EVP Saboath: Real FFT targeting 11.3Hz resonance + whisper band
 * - Φ_sentinel: Weighted sensor fusion at 60fps
 * - OllamaClient: Proper streaming with abort + status
 * - StarCityBrain: Hormones, Φ, engrams, specialist moods
 * - 60Hz interference detection on EMF
 *
 * Loaded after index.html — hooks into existing functions non-destructively
 * Pigeons remember the breadcrumbs.
 */

(function() {
'use strict';

// ═══════════════════════════════════════════════════════════════════
// EVP SABOATH — Real FFT Audio Analysis
// Targets 11.3Hz resonance + 8-12kHz whisper band
// ═══════════════════════════════════════════════════════════════════

class EVPSaboath {
  constructor() {
    this.audioCtx = null;
    this.analyser = null;
    this.stream = null;
    this.running = false;
    this.intervalId = null;

    this.FFT_SIZE = 2048;
    this.SAMPLE_RATE = 44100;
    this.RESONANCE_HZ = 11.3;
    this.WHISPER_LOW = 8000;
    this.WHISPER_HIGH = 12000;
    this.resonanceThreshold = 3.0;
    this.whisperThreshold = 2.5;

    this.noiseFloor = 0;
    this.calibrationSamples = [];
    this.CALIBRATION_COUNT = 30;

    this.state = 'inactive';
    this.confidence = 0.0;
    this.onResult = null;
  }

  async start() {
    if (this.running) return;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: { ideal: this.SAMPLE_RATE }
        }
      });

      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: this.SAMPLE_RATE });
      const source = this.audioCtx.createMediaStreamSource(this.stream);
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = this.FFT_SIZE;
      this.analyser.smoothingTimeConstant = 0.3;
      source.connect(this.analyser);

      this.running = true;
      this.state = 'calibrating';
      this.calibrationSamples = [];
      this.intervalId = setInterval(() => this._analyze(), 33);
      console.log('[EVP SABOATH] FFT online — FFT size:', this.FFT_SIZE);
    } catch(err) {
      this.state = 'error';
      console.error('[EVP SABOATH] Failed:', err.message);
      if (this.onResult) this.onResult({ state: 'error', confidence: 0, errorMessage: err.message });
    }
  }

  stop() {
    this.running = false;
    if (this.intervalId) clearInterval(this.intervalId);
    if (this.stream) this.stream.getTracks().forEach(t => t.stop());
    if (this.audioCtx && this.audioCtx.state !== 'closed') this.audioCtx.close().catch(() => {});
    this.state = 'inactive';
    this.confidence = 0;
    console.log('[EVP SABOATH] Offline');
  }

  _analyze() {
    if (!this.running || !this.analyser) return;

    const bufLen = this.analyser.frequencyBinCount;
    const data = new Float32Array(bufLen);
    this.analyser.getFloatFrequencyData(data);

    // Convert dB to linear
    const linear = Array.from(data).map(db => Math.pow(10, db / 20));
    const binWidth = this.SAMPLE_RATE / this.FFT_SIZE;

    // 11.3Hz bin
    const resBin = Math.round(this.RESONANCE_HZ / binWidth);
    const resAmp = resBin < linear.length ? linear[resBin] : 0;

    // Whisper band (8-12kHz)
    const wBinLow = Math.round(this.WHISPER_LOW / binWidth);
    const wBinHigh = Math.round(this.WHISPER_HIGH / binWidth);
    const wSlice = linear.slice(Math.min(wBinLow, linear.length), Math.min(wBinHigh, linear.length));
    const wAmp = wSlice.length ? wSlice.reduce((a, b) => a + b, 0) / wSlice.length : 0;

    // Overall noise floor from mid-range
    const midSlice = linear.slice(Math.round(100 / binWidth), Math.round(4000 / binWidth));
    const currentFloor = midSlice.length ? midSlice.reduce((a, b) => a + b, 0) / midSlice.length : 0;

    // Calibration
    if (this.state === 'calibrating') {
      this.calibrationSamples.push(currentFloor);
      if (this.calibrationSamples.length >= this.CALIBRATION_COUNT) {
        this.noiseFloor = this.calibrationSamples.reduce((a, b) => a + b, 0) / this.calibrationSamples.length;
        this.state = 'nominal';
        console.log('[EVP SABOATH] Calibrated. Noise floor:', this.noiseFloor.toFixed(4));
      }
      if (this.onResult) this.onResult({ state: 'calibrating', confidence: 0, resonanceAmplitude: resAmp, whisperAmplitude: wAmp, noiseFloor: this.noiseFloor, hasResonanceSpike: false, hasWhisperAnomaly: false });
      return;
    }

    const floor = Math.max(this.noiseFloor, 1e-10);
    const hasRes = resAmp > floor * this.resonanceThreshold;
    const hasWhisper = wAmp > floor * this.whisperThreshold;

    // Confidence
    let conf = 0.1;
    if (hasRes && hasWhisper) { this.state = 'dual_anomaly'; conf = 0.95; }
    else if (hasRes) { this.state = 'resonance_spike'; conf = 0.75; }
    else if (hasWhisper) { this.state = 'whisper_detected'; conf = 0.60; }
    else { this.state = 'nominal'; conf = 0.1; }

    this.confidence = conf;

    const result = {
      state: this.state,
      confidence: conf,
      resonanceAmplitude: resAmp,
      whisperAmplitude: wAmp,
      noiseFloor: floor,
      hasResonanceSpike: hasRes,
      hasWhisperAnomaly: hasWhisper
    };

    if (this.onResult) this.onResult(result);

    // Update Paranormal OS EVP display if available
    _updateEVPDisplay(result);
  }
}

// ═══════════════════════════════════════════════════════════════════
// Φ_SENTINEL — Weighted Sensor Fusion
// ═══════════════════════════════════════════════════════════════════

class PhiSentinel {
  constructor() {
    this.inputs = { optics: 0.1, sensors: 0.1, forensics: 0.1, comms: 0.1, config: 0.5 };
    this.weights = { W_optics: 0.20, W_sensors: 0.25, W_forensics: 0.25, W_comms: 0.20, W_config: 0.10 };
    this.BASELINE = 0.0;
    this.DELTA_FACTOR = 0.113;
    this.phi = 0.0;
    this.delta = 0.0;
    this.fps = 0;
    this._rafId = null;
    this._lastTime = 0;
    this._frameCount = 0;
    this._fpsTimer = 0;
    this.onUpdate = null;
  }

  start() {
    if (this._rafId) return;
    this._loop();
    console.log('[Φ_SENTINEL] Online — 11.3Hz resonance tracking');
  }

  stop() {
    if (this._rafId) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  updateInput(key, value) {
    if (key in this.inputs) this.inputs[key] = Math.max(0, Math.min(1, value));
  }

  _loop() {
    this._rafId = requestAnimationFrame((ts) => {
      // FPS tracking
      this._frameCount++;
      if (ts - this._fpsTimer > 1000) {
        this.fps = this._frameCount;
        this._frameCount = 0;
        this.fpsTimer = ts;
      }

      // Weighted sum
      const sum =
        this.weights.W_optics    * this.inputs.optics +
        this.weights.W_sensors   * this.inputs.sensors +
        this.weights.W_forensics * this.inputs.forensics +
        this.weights.W_comms     * this.inputs.comms +
        this.weights.W_config    * this.inputs.config;

      // 11.3Hz oscillation
      const t = ts / 1000;
      this.delta = this.DELTA_FACTOR * Math.sin(2 * Math.PI * 11.3 * t);
      this.phi = Math.max(-1, Math.min(1, sum + this.BASELINE + this.delta));

      if (this.onUpdate) this.onUpdate(this.phi, this.delta, this.fps);
      _updatePhiDisplay(this.phi, this.delta);

      this._loop();
    });
  }
}

// ═══════════════════════════════════════════════════════════════════
// IMPROVED OLLAMA CLIENT — Streaming with abort + status
// Replaces the basic fetch calls in existing sendChat
// ═══════════════════════════════════════════════════════════════════

class StarCityOllamaClient {
  constructor() {
    this.endpoint = 'http://127.0.0.1:11434';
    this.modelName = localStorage.getItem('localModel') || 'gemma2';
    this.temperature = 0.7;
    this.numCtx = 4096;
    this.isStreaming = false;
    this.abortController = null;
    this.onChunk = null;
    this.onComplete = null;
    this.onError = null;
    this.onStatus = null;
  }

  configure({ endpoint, model, temperature, numCtx } = {}) {
    if (endpoint) this.endpoint = endpoint;
    if (model) { this.modelName = model; localStorage.setItem('localModel', model); }
    if (temperature !== undefined) this.temperature = temperature;
    if (numCtx) this.numCtx = numCtx;
  }

  async ping() {
    try {
      const url = (window.USING_PROXY && window.getOllamaUrl) ? window.getOllamaUrl('/api/tags') : this.endpoint + '/api/tags';
      const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (res.ok) {
        const data = await res.json();
        return { ok: true, models: (data.models || []).map(m => m.name) };
      }
      return { ok: false, error: 'HTTP ' + res.status };
    } catch(err) {
      return { ok: false, error: err.message };
    }
  }

  abort() {
    if (this.abortController) { this.abortController.abort(); this.abortController = null; }
    this.isStreaming = false;
  }

  async chat(messages, systemPrompt) {
    if (this.isStreaming) this.abort();
    this.isStreaming = true;
    this.abortController = new AbortController();

    const chatUrl = (window.USING_PROXY && window.getOllamaUrl) ? window.getOllamaUrl('/api/chat') : this.endpoint + '/api/chat';

    const body = {
      model: this.modelName,
      messages: systemPrompt ? [{ role: 'system', content: systemPrompt }, ...messages] : messages,
      stream: true,
      options: { temperature: this.temperature, num_ctx: this.numCtx }
    };

    this._status('connecting');

    try {
      const response = await fetch(chatUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: this.abortController.signal,
        mode: 'cors'
      });

      if (!response.ok) throw new Error('Ollama ' + response.status + ': ' + response.statusText);

      this._status('streaming');
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const data = JSON.parse(line);
            const chunk = (data.message && data.message.content) || '';
            fullText += chunk;
            if (this.onChunk) this.onChunk(fullText);
            if (data.done) {
              this.isStreaming = false;
              this._status('done');
              if (this.onComplete) this.onComplete(fullText, data);
              return fullText;
            }
          } catch(e) {}
        }
      }

      this.isStreaming = false;
      this._status('done');
      if (this.onComplete) this.onComplete(fullText, {});
      return fullText;

    } catch(err) {
      this.isStreaming = false;
      if (err.name === 'AbortError') { this._status('aborted'); return ''; }
      const msg = err.message.includes('Failed to fetch') ? 'Cannot reach Ollama. Run: ollama serve' : err.message;
      this._status('error');
      if (this.onError) this.onError(msg);
      throw err;
    }
  }

  _status(s) { if (this.onStatus) this.onStatus(s); }
}

// ═══════════════════════════════════════════════════════════════════
// STAR CITY BRAIN — JS port of StarCityBrain_Enhanced.kt
// Hormones, Φ, engrams, specialist moods, pain pathways
// ═══════════════════════════════════════════════════════════════════

class StarCityBrain {
  constructor() {
    this.GOLDEN_BASELINE = 0.113;

    // Big 5
    this.openness = 0.85;
    this.conscientiousness = 0.75;
    this.extraversion = 0.65;
    this.agreeableness = 0.80;
    this.neuroticism = 0.30;

    // Hormones
    this.cortisol = 0.3;
    this.dopamine = 0.5;

    // Memory
    this.shortTermMemory = [];
    this.longTermMemory = [];
    this.MAX_SHORT_TERM = 10;

    // Pain
    this.painMemory = {};

    // Skills
    this.skills = {};

    // Age (hours)
    this.age = 0;

    // Associations
    this.associations = {};

    // Specialist mood
    this.currentMoodId = 'SAGE';

    this._load();
  }

  // ── Φ Calculation ─────────────────────────────────────────────
  calculatePhi(memoryClarity, cognitiveLoad) {
    const wEmotion = 0.3, wMemory = 0.4, wCognition = 0.3;
    const sum = wEmotion * this.cortisol + wMemory * memoryClarity + wCognition * cognitiveLoad;
    const flux = this.cortisol > 0.8 ? this.GOLDEN_BASELINE : -this.GOLDEN_BASELINE;
    return sum + 0.5 + flux;
  }

  isSentient(phi) {
    return Math.abs(phi - (1.0 + this.GOLDEN_BASELINE)) <= this.GOLDEN_BASELINE;
  }

  // ── Hormones ──────────────────────────────────────────────────
  updateHormones(isStressful, isRewarding) {
    if (isStressful) {
      this.cortisol = Math.min(1.0, this.cortisol + 0.1);
      this.dopamine = Math.max(0.0, this.dopamine - 0.05);
    } else {
      this.cortisol = Math.max(0.0, this.cortisol - 0.02);
    }
    if (isRewarding) {
      this.dopamine = Math.min(1.0, this.dopamine + 0.15);
    } else {
      this.dopamine = Math.max(0.0, this.dopamine - 0.01);
    }
    this._save();
  }

  processReward(magnitude) {
    this.dopamine = Math.min(1.0, this.dopamine + magnitude * 0.2);
    this._save();
  }

  getCognitiveModifiers() {
    return {
      riskTolerance: 1.0 - this.cortisol,
      learningRate: 0.5 + this.dopamine * 0.5,
      processingMode: this.cortisol > 0.7 ? 'REACTIVE' : 'ANALYTICAL',
      creativityBoost: this.dopamine > 0.7 ? 0.3 : 0.0,
      focusPenalty: this.cortisol > 0.5 ? this.cortisol * 0.3 : 0.0
    };
  }

  // ── Pain Pathways ─────────────────────────────────────────────
  processPain(type, intensity, context) {
    const key = context.toLowerCase().replace(/\s+/g, '_');
    if (intensity >= 0.7) {
      this.painMemory[key] = { type, intensity, timestamp: Date.now() };
      this.cortisol = Math.min(1.0, this.cortisol + intensity * 0.3);
      this.dopamine = Math.max(0.0, this.dopamine - intensity * 0.2);
      this.addEngram({
        perception: 'PAIN: ' + type,
        intent: 'AVOIDANCE_LESSON',
        sentiment: -intensity,
        phiValue: 0,
        timestamp: Date.now()
      });
      this._save();
    }
  }

  shouldAvoid(context) {
    const key = context.toLowerCase().replace(/\s+/g, '_');
    return key in this.painMemory && this.painMemory[key].intensity >= 0.7;
  }

  // ── Engram Memory ─────────────────────────────────────────────
  addEngram(engram) {
    this.shortTermMemory.push(engram);
    if (this.shortTermMemory.length > this.MAX_SHORT_TERM) {
      const oldest = this.shortTermMemory.shift();
      if (oldest.sentiment > 0.5 || oldest.sentiment < -0.5) {
        this.longTermMemory.push(oldest);
      }
    }
    this._save();
  }

  getRecentEngrams(count) {
    return this.shortTermMemory.slice(-count);
  }

  processExperience(perception, phiValue, intent) {
    const mods = this.getCognitiveModifiers();
    const sentiment = phiValue * (1 + mods.creativityBoost);
    this.addEngram({ perception, intent, sentiment, phiValue, timestamp: Date.now() });
    if (phiValue > 0.7) this.updateHormones(false, true);
    else if (phiValue < 0.2) this.updateHormones(true, false);
  }

  // ── Skills ────────────────────────────────────────────────────
  improveSkill(name, amount) {
    this.skills[name] = Math.min(1.0, (this.skills[name] || 0) + amount);
    this._save();
  }

  getSkillLevel(name) { return this.skills[name] || 0; }

  // ── Status ────────────────────────────────────────────────────
  getStatus() {
    return [
      'SAGE BRAIN STATUS',
      'Cortisol: ' + (this.cortisol * 100).toFixed(0) + '%',
      'Dopamine: ' + (this.dopamine * 100).toFixed(0) + '%',
      'Short-term: ' + this.shortTermMemory.length + ' engrams',
      'Long-term: ' + this.longTermMemory.length + ' engrams',
      'Pain records: ' + Object.keys(this.painMemory).length
    ].join('\n');
  }

  // ── Persistence ───────────────────────────────────────────────
  _save() {
    try {
      localStorage.setItem('sc_brain', JSON.stringify({
        cortisol: this.cortisol,
        dopamine: this.dopamine,
        painMemory: this.painMemory,
        skills: this.skills,
        associations: this.associations,
        age: this.age,
        longTermMemory: this.longTermMemory.slice(-50)
      }));
    } catch(e) {}
  }

  _load() {
    try {
      const saved = localStorage.getItem('sc_brain');
      if (!saved) return;
      const d = JSON.parse(saved);
      this.cortisol = d.cortisol || 0.3;
      this.dopamine = d.dopamine || 0.5;
      this.painMemory = d.painMemory || {};
      this.skills = d.skills || {};
      this.associations = d.associations || {};
      this.age = d.age || 0;
      this.longTermMemory = d.longTermMemory || [];
    } catch(e) {}
  }
}

// ═══════════════════════════════════════════════════════════════════
// UI UPDATE HOOKS — Wire into existing Paranormal OS displays
// ═══════════════════════════════════════════════════════════════════

function _updateEVPDisplay(result) {
  // EVP state badge
  const evpState = document.getElementById('evp-status') || document.getElementById('evp-state');
  if (evpState) {
    const labels = {
      'nominal': 'NOMINAL',
      'calibrating': 'CALIBRATING...',
      'resonance_spike': '⚠ 11.3Hz SPIKE',
      'whisper_detected': '⚠ WHISPER BAND',
      'dual_anomaly': '⚡ DUAL ANOMALY',
      'error': '✗ ERROR',
      'inactive': 'STANDBY'
    };
    evpState.textContent = labels[result.state] || result.state.toUpperCase();
    if (result.hasResonanceSpike || result.hasWhisperAnomaly) {
      evpState.style.color = 'var(--red, #ff4444)';
    } else {
      evpState.style.color = '';
    }
  }

  // Update Phi forensics input
  if (window._phiSentinel) {
    window._phiSentinel.updateInput('forensics', result.confidence);
  }

  // Log anomalies to memory
  if ((result.hasResonanceSpike || result.hasWhisperAnomaly) && window.sageMemory) {
    window.sageMemory.encode(
      'EVP anomaly: 11.3Hz=' + result.hasResonanceSpike + ' whisper=' + result.hasWhisperAnomaly + ' conf=' + result.confidence.toFixed(2),
      'sensory',
      result.state === 'dual_anomaly' ? 0.9 : 0.7
    );
  }

  // Update Star City Brain
  if (window._scBrain) {
    if (result.hasResonanceSpike || result.hasWhisperAnomaly) {
      window._scBrain.processExperience('EVP: ' + result.state, result.confidence, 'EVP_DETECTION');
    }
  }
}

function _updatePhiDisplay(phi, delta) {
  // Φ value display if exists
  const phiEl = document.getElementById('phi-value') || document.getElementById('phi-sentinel');
  if (phiEl) phiEl.textContent = phi.toFixed(3);

  const deltaEl = document.getElementById('phi-delta');
  if (deltaEl) deltaEl.textContent = (delta >= 0 ? '+' : '') + delta.toFixed(3);

  // Color code based on phi level
  const color = phi > 0.7 ? '#ff4444' : phi > 0.4 ? '#ffff00' : '#00ff00';
  if (phiEl) phiEl.style.color = color;

  // Update global for other systems
  window.lastPhiValue = phi;
}

// ═══════════════════════════════════════════════════════════════════
// HOOK INTO EXISTING SAGE CHAT — Upgrade Ollama calls
// ═══════════════════════════════════════════════════════════════════

function hookQueryLocalAI() {
  const origFn = window.queryLocalAI;
  if (typeof origFn !== 'function') return;

  window.queryLocalAI = async function(text, endpoint) {
    // Build enriched system prompt with sensor telemetry
    const phi = (window.lastPhiValue || 0).toFixed(3);
    const emf = (window.lastEMFReading || 0).toFixed(1);
    const brain = window._scBrain;
    const mods = brain ? brain.getCognitiveModifiers() : null;

    const sensorPrompt = [
      'SAGE // 7 — FIELD UNIT ACTIVE',
      'Φ_sentinel: ' + phi + ' (Δ_11.3 = ' + (window._phiSentinel ? window._phiSentinel.delta.toFixed(3) : '0.000') + ')',
      'EMF: ' + emf + 'µT',
      brain ? 'Cortisol: ' + (brain.cortisol * 100).toFixed(0) + '% | Dopamine: ' + (brain.dopamine * 100).toFixed(0) + '%' : '',
      mods ? 'Mode: ' + mods.processingMode : '',
      ''
    ].filter(Boolean).join('\n');

    // Use the Star City streaming client
    const client = window._scOllama;
    if (!client) return origFn(text, endpoint);

    // Update model from saved settings
    const model = localStorage.getItem('localModel') || 'gemma2';
    client.configure({ model, endpoint: endpoint || 'http://127.0.0.1:11434' });

    // Get chat history from existing aiChatMessages
    const messages = (window.aiChatMessages || []).slice(-10);

    return new Promise((resolve, reject) => {
      client.onComplete = (fullText) => {
        // Update brain on response
        if (window._scBrain) {
          window._scBrain.processExperience('Chat: ' + text.substring(0, 50), window.lastPhiValue || 0.5, 'AI_INTERACTION');
        }
        resolve(fullText);
      };
      client.onError = (msg) => reject(new Error(msg));
      client.onStatus = (s) => {
        if (s === 'connecting') console.log('[SC BRIDGE] Connecting to Ollama...');
      };

      // Get base system prompt
      const basePrompt = window.CHAT_SYSTEM_PROMPT || 'You are SAGE // 7, paranormal investigator AI.';
      client.chat(messages.concat([{ role: 'user', content: text }]), sensorPrompt + '\n' + basePrompt)
        .catch(reject);
    });
  };

  console.log('[SC BRIDGE] queryLocalAI hooked — sensor telemetry active');
}

// ═══════════════════════════════════════════════════════════════════
// INIT
// ═══════════════════════════════════════════════════════════════════

window.addEventListener('load', function() {
  setTimeout(initStarCityBridge, 2500); // After boot() and puter-bridge
});

async function initStarCityBridge() {
  console.log('[SC BRIDGE] Initializing...');

  // Brain
  window._scBrain = new StarCityBrain();
  console.log('[SC BRIDGE] Brain online\n' + window._scBrain.getStatus());

  // Ollama client
  window._scOllama = new StarCityOllamaClient();

  // Φ_sentinel
  window._phiSentinel = new PhiSentinel();
  window._phiSentinel.onUpdate = function(phi, delta, fps) {
    window.lastPhiValue = phi;
    // Feed EMF into Phi sensors input
    if (window.lastEMFReading) {
      const emfNorm = Math.min(1.0, window.lastEMFReading / 150);
      window._phiSentinel.updateInput('sensors', emfNorm);
    }
  };
  window._phiSentinel.start();

  // EVP Saboath — hooks into existing EVP toggle if present
  window._evpSaboath = new EVPSaboath();
  _hookExistingEVP();

  // Hook queryLocalAI for enriched prompts
  hookQueryLocalAI();

  // Wire EMF updates to Phi
  _hookEMFToPhi();

  // Add Φ display to sensors screen if not present
  _injectPhiDisplay();

  console.log('[SC BRIDGE] All systems online — Φ_sentinel tracking at 60fps');

  // Brain status toast
  if (window.toast) {
    setTimeout(() => {
      window.toast('⚡ STAR CITY BRIDGE ONLINE — Φ_SENTINEL ACTIVE');
    }, 1000);
  }
}

function _hookExistingEVP() {
  // Hook into the existing EVP toggle button
  const origToggle = window.toggleEVP;
  if (typeof origToggle !== 'function') return;

  window.toggleEVP = async function() {
    // Call original
    origToggle();

    // Also start/stop our EVP Saboath
    if (window._evpSaboath.running) {
      window._evpSaboath.stop();
    } else {
      await window._evpSaboath.start();
    }
  };
  console.log('[SC BRIDGE] EVP Saboath hooked');
}

function _hookEMFToPhi() {
  // Watch lastEMFReading changes and feed to Phi
  let lastFed = 0;
  setInterval(() => {
    if (window.lastEMFReading && window._phiSentinel) {
      const emfNorm = Math.min(1.0, window.lastEMFReading / 150);
      if (Math.abs(emfNorm - lastFed) > 0.01) {
        window._phiSentinel.updateInput('sensors', emfNorm);
        lastFed = emfNorm;

        // Brain EMF spike response
        if (window._scBrain && window.lastEMFReading > 80) {
          window._scBrain.updateHormones(true, false);
          window._scBrain.processExperience('EMF spike: ' + window.lastEMFReading.toFixed(1) + 'µT', emfNorm, 'EMF_DETECTION');
        }
      }
    }
  }, 500);
}

function _injectPhiDisplay() {
  // Add Φ_sentinel readout to the sensors screen HUD if not already there
  const emfPanel = document.getElementById('emf-panel');
  if (!emfPanel || document.getElementById('phi-sentinel-panel')) return;

  const panel = document.createElement('div');
  panel.id = 'phi-sentinel-panel';
  panel.className = 'panel';
  panel.style.cssText = 'margin-top:12px;border-color:var(--cyan,#00ffff);';
  panel.innerHTML = [
    '<div class="panel-title" style="color:var(--cyan,#00ffff);display:flex;justify-content:space-between;">',
    '  Φ_SENTINEL',
    '  <span style="font-size:9px;color:var(--gray,#555);letter-spacing:1px;">11.3Hz RESONANCE</span>',
    '</div>',
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:11px;margin-top:8px;">',
    '  <div class="hud-row"><span class="hud-label">Φ VALUE</span><span class="hud-value" id="phi-value" style="font-size:16px;color:#00ff00;">0.000</span></div>',
    '  <div class="hud-row"><span class="hud-label">Δ_11.3</span><span class="hud-value" id="phi-delta">+0.000</span></div>',
    '  <div class="hud-row"><span class="hud-label">CORTISOL</span><span class="hud-value" id="sc-cortisol">30%</span></div>',
    '  <div class="hud-row"><span class="hud-label">DOPAMINE</span><span class="hud-value" id="sc-dopamine" style="color:var(--green,#00ff00);">50%</span></div>',
    '</div>'
  ].join('');

  emfPanel.parentNode.insertBefore(panel, emfPanel.nextSibling);

  // Update hormone display every second
  setInterval(() => {
    if (!window._scBrain) return;
    const c = document.getElementById('sc-cortisol');
    const d = document.getElementById('sc-dopamine');
    if (c) {
      c.textContent = (window._scBrain.cortisol * 100).toFixed(0) + '%';
      c.style.color = window._scBrain.cortisol > 0.7 ? 'var(--red,#ff4444)' : '';
    }
    if (d) {
      d.textContent = (window._scBrain.dopamine * 100).toFixed(0) + '%';
      d.style.color = window._scBrain.dopamine > 0.7 ? 'var(--green,#00ff00)' : 'var(--gray,#555)';
    }
  }, 1000);

  console.log('[SC BRIDGE] Φ_sentinel panel injected');
}

console.log('[SC BRIDGE] Loaded');
})();
