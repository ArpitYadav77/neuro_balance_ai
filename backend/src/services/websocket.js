const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { pool } = require('../db');
const { predictStress } = require('./aiClient');

// In-memory state per connection
const clientState = new Map();

// Intervention templates
const INTERVENTION_TEMPLATES = {
  eye_exercise: {
    type: 'eye_exercise',
    title: '👁️ Eye Exercise',
    message: 'Look at something 20 feet away for 20 seconds. Let your eyes relax.',
    action: 'Start Exercise',
    icon: '👁️',
    priority: 'medium',
  },
  breathing: {
    type: 'breathing',
    title: '🌬️ Box Breathing',
    message: 'Try box breathing: breathe in 4s → hold 4s → out 4s → hold 4s. Repeat 3×.',
    action: 'Start Breathing',
    icon: '🫁',
    priority: 'high',
  },
  movement: {
    type: 'movement',
    title: '🤸 Movement Break',
    message: 'Stand up, roll your shoulders, and stretch your arms above your head for 2 minutes.',
    action: 'Take Break',
    icon: '🤸',
    priority: 'medium',
  },
  mindfulness: {
    type: 'mindfulness',
    title: '🧘 Mindfulness Pause',
    message: 'Close your eyes, take 5 deep breaths, and ground yourself in the present moment.',
    action: 'Start Now',
    icon: '🧘',
    priority: 'low',
  },
  break: {
    type: 'break',
    title: '☕ Time for a Break',
    message: "You've been focused for a long time. A 5-minute break will boost your productivity.",
    action: 'Take Break',
    icon: '☕',
    priority: 'high',
  },
};

function buildIntervention(type, overrides = {}) {
  return {
    id: uuidv4(),
    ...INTERVENTION_TEMPLATES[type],
    ...overrides,
  };
}

function getInterventionsForScore(score, blinkRate, sessionMinutes, consecutiveHigh) {
  const interventions = [];

  if (score > 65) {
    interventions.push(buildIntervention('breathing'));
  }
  if (blinkRate < 8) {
    interventions.push(buildIntervention('eye_exercise'));
  }
  if (sessionMinutes > 45) {
    interventions.push(
      buildIntervention('break', {
        message: `You've been focused for ${Math.round(sessionMinutes)} minutes. A 5-minute break will boost your productivity.`,
      }),
    );
  }
  if (consecutiveHigh >= 5) {
    interventions.push(buildIntervention('mindfulness'));
    interventions.push(buildIntervention('movement'));
  }
  if (interventions.length === 0 && score > 50) {
    interventions.push(buildIntervention('eye_exercise'));
  }

  // Deduplicate by type, keep only first of each
  const seen = new Set();
  return interventions.filter((i) => {
    if (seen.has(i.type)) return false;
    seen.add(i.type);
    return true;
  });
}

function initWebSocket(server) {
  const wss = new WebSocket.Server({ server, path: '/ws' });

  wss.on('connection', async (ws, req) => {
    // ── Auth via token query param ──────────────────────────────────────────
    const url = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');
    let userId = null;

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        userId = decoded.id;
      } catch {
        /* anonymous session allowed for demo */
      }
    }

    // ── Per-client state ───────────────────────────────────────────────────
    const state = {
      userId,
      sessionId: null,
      consecutiveHigh: 0,
      lastInterventionAt: null,
      ignoreStreak: 0,
      lastStressScore: 0,
      sessionStartTime: Date.now(),
    };
    clientState.set(ws, state);

    // ── Fetch user profile ─────────────────────────────────────────────────
    let userProfile = null;
    if (userId) {
      try {
        const profileResult = await pool.query(
          'SELECT * FROM user_profiles WHERE user_id = $1',
          [userId],
        );
        userProfile = profileResult.rows[0] || null;
      } catch { /* non-fatal */ }
    }

    const alertThreshold = userProfile?.alert_threshold || 70;
    const userBaseline = userProfile?.baseline_stress || 40;

    // Send connected message
    ws.send(JSON.stringify({ type: 'connected', data: { userId } }));

    // ── Message handler ────────────────────────────────────────────────────
    ws.on('message', async (raw) => {
      let msg;
      try {
        msg = JSON.parse(raw);
      } catch {
        ws.send(JSON.stringify({ type: 'error', data: { message: 'Invalid JSON' } }));
        return;
      }

      const { type, data } = msg;

      if (type === 'eye_metrics') {
        const { blinkRate, gazeDirection, eyeClosure, screenTimeMinutes, gazeShifts } = data;

        // Call AI service
        const aiResult = await predictStress({
          blinkRate,
          gazeDirection,
          eyeClosure,
          screenTimeMinutes,
          gazeShifts,
          userBaseline,
        });

        if (!aiResult) {
          ws.send(JSON.stringify({ type: 'error', data: { message: 'AI service unavailable' } }));
          return;
        }

        const { stressScore, level } = aiResult;
        state.lastStressScore = stressScore;

        // Track consecutive high readings
        if (level === 'high') {
          state.consecutiveHigh += 1;
        } else {
          state.consecutiveHigh = 0;
        }

        ws.send(JSON.stringify({ type: 'stress_result', data: aiResult }));

        // ── Intervention logic ──────────────────────────────────────────
        const now = Date.now();
        const msSinceLastIntervention = state.lastInterventionAt
          ? now - state.lastInterventionAt
          : Infinity;
        const snoozeDuration = (userProfile?.snooze_duration_minutes || 10) * 60 * 1000;
        const sessionMinutes = (now - state.sessionStartTime) / 60000;

        const shouldTrigger =
          (stressScore > alertThreshold ||
            sessionMinutes > 45 ||
            blinkRate < 8 ||
            state.consecutiveHigh >= 5) &&
          msSinceLastIntervention > snoozeDuration &&
          state.ignoreStreak < 3;

        if (shouldTrigger) {
          const interventions = getInterventionsForScore(
            stressScore,
            blinkRate,
            sessionMinutes,
            state.consecutiveHigh,
          );

          if (interventions.length > 0) {
            state.lastInterventionAt = now;

            let triggerReason = 'high_stress';
            if (sessionMinutes > 45) triggerReason = 'long_session';
            else if (blinkRate < 8) triggerReason = 'low_blink';
            else if (state.consecutiveHigh >= 5) triggerReason = 'consecutive_stress';

            ws.send(
              JSON.stringify({
                type: 'intervention',
                data: {
                  trigger: triggerReason,
                  stressScore,
                  interventions,
                },
              }),
            );

            // Log to DB
            if (userId && state.sessionId) {
              for (const iv of interventions) {
                pool.query(
                  `INSERT INTO interventions (id, session_id, user_id, type, message, trigger_reason)
                   VALUES ($1, $2, $3, $4, $5, $6)`,
                  [iv.id, state.sessionId, userId, iv.type, iv.message, triggerReason],
                ).catch(() => {});
              }
            }
          }
        }
      } else if (type === 'session_start') {
        state.sessionId = data.sessionId;
        state.sessionStartTime = Date.now();
      } else if (type === 'session_time_alert') {
        const { minutes, currentScore } = data;
        const intervention = buildIntervention('break', {
          message: `You've been focused for ${minutes} minutes. A 5-minute break will boost your productivity.`,
        });
        ws.send(JSON.stringify({
          type: 'intervention',
          data: { trigger: 'long_session', stressScore: currentScore, interventions: [intervention] },
        }));
      } else if (type === 'intervention_response') {
        const { response } = data;
        if (response === 'ignored') {
          state.ignoreStreak += 1;
        } else {
          state.ignoreStreak = 0;
          if (response === 'snoozed') {
            state.lastInterventionAt = Date.now(); // reset snooze timer
          }
        }
      }
    });

    ws.on('close', () => {
      clientState.delete(ws);
    });

    ws.on('error', (err) => {
      console.error('[WS] Error:', err.message);
    });
  });

  return wss;
}

module.exports = { initWebSocket };
