/**
 * NeuroBalance AI — Chrome Extension Service Worker
 * Tracks active tab time and communicates with the backend.
 */

const BACKEND_URL = 'http://localhost:4000';
let sessionStartTime = Date.now();
let screenTimeMinutes = 0;
let stressScore = 0;
let token = null;

// ── Restore token from storage ─────────────────────────────────────────────
chrome.storage.local.get(['nb_token', 'nb_session_start'], (result) => {
  if (result.nb_token) token = result.nb_token;
  if (result.nb_session_start) {
    sessionStartTime = result.nb_session_start;
  } else {
    chrome.storage.local.set({ nb_session_start: sessionStartTime });
  }
});

// ── Alarm: update screen time every minute ─────────────────────────────────
chrome.alarms.create('screen_time_tick', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== 'screen_time_tick') return;
  screenTimeMinutes = (Date.now() - sessionStartTime) / 60000;

  // Fetch latest stress score from backend
  if (token) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        stressScore = data.latestSession?.avg_stress ?? stressScore;
        chrome.storage.local.set({ nb_stress_score: stressScore });
      }
    } catch { /* offline */ }
  }

  // Notify content script
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]?.id) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'nb_update',
        data: { screenTimeMinutes: Math.round(screenTimeMinutes), stressScore },
      }).catch(() => {});
    }
  });

  // Show notification if stress is high
  if (stressScore > 70 && token) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: '⚠️ NeuroBalance: High Stress Detected',
      message: `Your stress score is ${Math.round(stressScore)}. Consider taking a short break.`,
      priority: 1,
    });
  }
});

// ── Message handler ────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'nb_set_token') {
    token = msg.token;
    chrome.storage.local.set({ nb_token: msg.token });
    sendResponse({ ok: true });
  } else if (msg.type === 'nb_get_status') {
    sendResponse({ stressScore, screenTimeMinutes: Math.round(screenTimeMinutes), token: !!token });
  } else if (msg.type === 'nb_logout') {
    token = null;
    stressScore = 0;
    chrome.storage.local.remove(['nb_token', 'nb_session_start', 'nb_stress_score']);
    sendResponse({ ok: true });
  }
  return true; // keep channel open for async
});
