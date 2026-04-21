/**
 * NeuroBalance AI — Extension Popup Script
 */

const BACKEND_URL = 'http://localhost:4000';

const stressPanel = document.getElementById('stress-panel');
const loginPanel = document.getElementById('login-panel');
const actions = document.getElementById('actions');
const statusDot = document.getElementById('status-dot');
const stressNumber = document.getElementById('stress-number');
const stressArc = document.getElementById('stress-arc');
const stressLevelEl = document.getElementById('stress-level');
const sessionTimeEl = document.getElementById('session-time');
const loginError = document.getElementById('login-error');

const CIRCUMFERENCE = 2 * Math.PI * 34; // r=34

function setStress(score) {
  const s = Math.round(score);
  stressNumber.textContent = s;
  const offset = ((100 - s) / 100) * CIRCUMFERENCE;
  stressArc.style.strokeDashoffset = offset;

  const color = s > 65 ? '#ef4444' : s > 35 ? '#f59e0b' : '#22c55e';
  stressArc.style.stroke = color;
  stressNumber.style.color = color;

  stressLevelEl.textContent = s > 65 ? 'High' : s > 35 ? 'Moderate' : 'Low';
  stressLevelEl.className = 'meta-value ' + (s > 65 ? 'level-high' : s > 35 ? 'level-medium' : 'level-low');
}

function setStatus(online) {
  statusDot.className = 'status-dot ' + (online ? 'online' : 'offline');
}

// ── Check background for current status ───────────────────────────────────
chrome.runtime.sendMessage({ type: 'nb_get_status' }, (res) => {
  if (chrome.runtime.lastError || !res) return;
  if (res.token) {
    setStatus(true);
    loginPanel.classList.add('hidden');
    stressPanel.classList.remove('hidden');
    actions.classList.remove('hidden');
    setStress(res.stressScore || 0);
    sessionTimeEl.textContent = `${Math.round(res.screenTimeMinutes || 0)}m`;
  } else {
    setStatus(false);
  }
});

// ── Login ──────────────────────────────────────────────────────────────────
document.getElementById('login-btn').addEventListener('click', async () => {
  const email = document.getElementById('nb-email').value.trim();
  const password = document.getElementById('nb-password').value;
  loginError.classList.add('hidden');

  if (!email || !password) {
    loginError.textContent = 'Email and password required.';
    loginError.classList.remove('hidden');
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Login failed');

    chrome.runtime.sendMessage({ type: 'nb_set_token', token: data.token });
    setStatus(true);
    loginPanel.classList.add('hidden');
    stressPanel.classList.remove('hidden');
    actions.classList.remove('hidden');
  } catch (err) {
    loginError.textContent = err.message;
    loginError.classList.remove('hidden');
  }
});

// ── Logout ─────────────────────────────────────────────────────────────────
document.getElementById('logout-btn').addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'nb_logout' });
  setStatus(false);
  stressPanel.classList.add('hidden');
  actions.classList.add('hidden');
  loginPanel.classList.remove('hidden');
  setStress(0);
});
