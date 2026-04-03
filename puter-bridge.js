/**
 * puter-bridge.js — Puter Cloud AI Bridge
 * Waits for puter.js SDK to initialize and sets window._puterReady
 * so index.html can use puter.ai.chat() as a free AI provider.
 */
(function () {
  'use strict';

  var MAX_ATTEMPTS = 20;
  var attempts = 0;

  function checkPuter() {
    attempts++;
    if (window.puter && typeof window.puter.ai !== 'undefined') {
      window._puterReady = true;
      console.log('[PUTER BRIDGE] Ready — cloud AI available via puter.ai.chat()');
    } else if (attempts < MAX_ATTEMPTS) {
      setTimeout(checkPuter, 500);
    } else {
      console.warn('[PUTER BRIDGE] Puter SDK not available — cloud AI disabled');
      window._puterReady = false;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      setTimeout(checkPuter, 1000);
    });
  } else {
    setTimeout(checkPuter, 1000);
  }
})();
