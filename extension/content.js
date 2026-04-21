/**
 * NeuroBalance AI — Content Script
 * Injects tasteful intervention overlays into any web page.
 */

(function () {
  'use strict';

  let overlayEl = null;
  let dismissTimer = null;

  function createOverlay(data) {
    // Remove existing overlay
    if (overlayEl) overlayEl.remove();

    const { stressScore = 0, screenTimeMinutes = 0 } = data;

    const stressColor =
      stressScore > 65 ? '#ef4444' : stressScore > 35 ? '#f59e0b' : '#22c55e';

    let message;
    let icon;
    if (stressScore > 65) {
      icon = '🌬️';
      message = 'High cognitive stress detected. Try box breathing to reset.';
    } else if (screenTimeMinutes > 45) {
      icon = '☕';
      message = `${Math.round(screenTimeMinutes)} minutes on screen. A quick break will help.`;
    } else {
      icon = '👁️';
      message = 'Look away from the screen for 20 seconds to rest your eyes.';
    }

    const overlay = document.createElement('div');
    overlay.id = 'neurobalance-overlay';
    overlay.innerHTML = `
      <div style="
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 300px;
        background: rgba(6,8,15,0.95);
        backdrop-filter: blur(20px);
        border: 1px solid rgba(255,255,255,0.1);
        border-left: 3px solid ${stressColor};
        border-radius: 16px;
        padding: 16px;
        z-index: 2147483647;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        color: white;
        animation: nbSlideIn 0.4s cubic-bezier(0.34,1.56,0.64,1) both;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <style>
          @keyframes nbSlideIn {
            from { transform: translateX(120%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        </style>
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;">
            <span style="font-size:18px;">${icon}</span>
            <div>
              <div style="font-size:12px;font-weight:700;color:white;">NeuroBalance AI</div>
              <div style="font-size:10px;color:rgba(255,255,255,0.4);">Stress: ${Math.round(stressScore)}/100</div>
            </div>
          </div>
          <button id="nb-close" style="
            background:none;border:none;color:rgba(255,255,255,0.3);
            cursor:pointer;font-size:16px;padding:0;line-height:1;
          ">×</button>
        </div>
        <p style="font-size:12px;color:rgba(255,255,255,0.6);line-height:1.5;margin:0 0 12px;">
          ${message}
        </p>
        <div style="display:flex;gap:8px;">
          <a href="http://localhost:3000/dashboard" target="_blank" style="
            flex:1;text-align:center;padding:7px;background:rgba(61,83,252,0.2);
            border:1px solid rgba(61,83,252,0.3);border-radius:10px;
            color:#3d53fc;font-size:11px;font-weight:600;text-decoration:none;
            transition:all 0.2s;
          ">Open Dashboard</a>
          <button id="nb-dismiss" style="
            flex:1;padding:7px;background:rgba(255,255,255,0.05);
            border:1px solid rgba(255,255,255,0.1);border-radius:10px;
            color:rgba(255,255,255,0.5);font-size:11px;cursor:pointer;
          ">Dismiss</button>
        </div>
      </div>
    `;
    document.body.appendChild(overlay);
    overlayEl = overlay;

    // Auto-dismiss after 30s
    if (dismissTimer) clearTimeout(dismissTimer);
    dismissTimer = setTimeout(removeOverlay, 30000);

    // Close button
    overlay.querySelector('#nb-close').addEventListener('click', removeOverlay);
    overlay.querySelector('#nb-dismiss').addEventListener('click', removeOverlay);
  }

  function removeOverlay() {
    if (overlayEl) { overlayEl.remove(); overlayEl = null; }
    if (dismissTimer) { clearTimeout(dismissTimer); dismissTimer = null; }
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'nb_update') {
      const { stressScore, screenTimeMinutes } = msg.data;
      // Only show if stress is high or session is long
      if (stressScore > 65 || screenTimeMinutes > 45) {
        createOverlay(msg.data);
      }
    } else if (msg.type === 'nb_show_intervention') {
      createOverlay(msg.data);
    }
  });

  // Track scroll/click as engagement signals
  let lastActivity = Date.now();
  ['scroll', 'click', 'keydown'].forEach((event) => {
    document.addEventListener(event, () => { lastActivity = Date.now(); }, { passive: true });
  });
})();
